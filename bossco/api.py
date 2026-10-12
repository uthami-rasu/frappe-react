"""Public endpoints used by the React storefront (frontend/src/features/api/storeApi.ts)."""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import add_days, cint, cstr, flt, today, validate_email_address

from bossco.customers import (
	ensure_customer_for_user,
	get_or_create_guest_customer,
	validate_address_owner,
)
from bossco.payments import PAYMENT_METHODS, mock_charge, parse_payment, record_payment
from bossco.storefront import (
	get_filter_options,
	get_group_with_descendants,
	get_store_categories,
	get_store_products,
	get_store_settings,
)

SHIPPING_CHARGES = {"free": 0, "express": 150, "pickup": 0}
SHIPPING_LABELS = {"free": "Free shipping", "express": "Express shipping", "pickup": "Pick up"}
MAX_QTY_PER_LINE = 100
ADDRESS_FIELDS = ("address_line1", "city", "state", "pincode", "country")
PRODUCT_SORTS = {
	"featured": None,  # Sort Order on the Item, then name (the query's order)
	"newest": (lambda product: product["createdAt"], True),
	"price-low": (lambda product: product["price"], False),
	"price-high": (lambda product: product["price"], True),
	"rating": (lambda product: product["rating"], True),
}
MAX_PAGE_LENGTH = 200


@frappe.whitelist(allow_guest=True)
def get_catalog():
	products = get_store_products()
	return {"products": products, "categories": get_store_categories(products)}


@frappe.whitelist(allow_guest=True)
def get_products(
	category=None,
	search=None,
	sizes=None,
	max_price=None,
	min_rating=None,
	in_stock=0,
	sort="featured",
	limit=24,
):
	"""Catalog page: filtered, sorted products plus every filter's options and counts.

	`sizes` is a comma-separated list; `category` includes its sub-groups.
	"""
	filters = {}
	if category:
		filters["item_group"] = ("in", get_group_with_descendants(category))
	if sizes:
		filters["bossco_pack_size"] = ("in", [size for size in cstr(sizes).split(",") if size])
	if flt(min_rating):
		filters["bossco_rating"] = (">=", flt(min_rating))

	or_filters = None
	search = cstr(search).strip()[:100]
	if search:
		like = ("like", f"%{search}%")
		or_filters = {
			"item_name": like,
			"item_code": like,
			"item_group": like,
			"bossco_subtitle": like,
			"bossco_origin": like,
		}

	# price and stock live outside Item (Item Price, Bin), so they're filtered after pricing
	products = get_store_products(filters=filters, or_filters=or_filters)
	if flt(max_price):
		products = [product for product in products if product["price"] <= flt(max_price)]
	if cint(in_stock):
		products = [product for product in products if product["inStock"]]

	sort_by = PRODUCT_SORTS.get(sort)
	if sort_by:
		key, reverse = sort_by
		products.sort(key=key, reverse=reverse)

	return {
		"products": products[: min(cint(limit) or 24, MAX_PAGE_LENGTH)],
		"total": len(products),
		"filters": get_filter_options(get_store_products()),
	}


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=20, seconds=60 * 60)
def place_order(items, contact=None, address=None, address_name=None, shipping_method="free", payment=None):
	"""Create and submit a Sales Order; for card/UPI also take the (mock) payment.

	Logged-in shoppers order as their own Customer and may pick a saved address. Guests are
	matched to an earlier guest Customer by email, or a new one is created. Prices always come
	from ERPNext, never from the browser. Any failure, including a declined payment, rolls the
	whole order back.
	"""
	contact = frappe._dict(frappe.parse_json(contact) or {})
	address = frappe._dict(frappe.parse_json(address) or {})
	items = frappe.parse_json(items)
	payment = parse_payment(payment)

	if shipping_method not in SHIPPING_CHARGES:
		frappe.throw(_("Unknown shipping method"))

	order_lines = get_order_lines(items)
	settings = get_store_settings()

	if frappe.session.user == "Guest":
		validate_contact(contact)
		customer, contact_name = get_or_create_guest_customer(
			contact.first_name.strip(), cstr(contact.last_name).strip(), contact.email.strip(), contact.phone
		)
		email, phone = contact.email.strip(), contact.phone
	else:
		customer, contact_name = ensure_customer_for_user(frappe.session.user)
		email = frappe.db.get_value("User", frappe.session.user, "email")
		phone = contact.phone or frappe.db.get_value("User", frappe.session.user, "mobile_no")

	if address_name and frappe.session.user != "Guest":
		validate_address_owner(address_name, customer)
	else:
		address_name = create_address(customer, address, email, phone)

	sales_order = frappe.get_doc(
		{
			"doctype": "Sales Order",
			"customer": customer,
			"company": settings.company,
			"order_type": "Shopping Cart",
			"transaction_date": today(),
			"delivery_date": add_days(today(), 3),
			"selling_price_list": settings.price_list,
			"set_warehouse": settings.warehouse,
			"customer_address": address_name,
			"shipping_address_name": address_name,
			"contact_person": contact_name,
			"bossco_payment_method": PAYMENT_METHODS[payment.method],
			"items": [
				{"item_code": item_code, "qty": qty, "rate": price}
				for item_code, (qty, price) in order_lines.items()
			],
		}
	)
	add_shipping_charge(sales_order, shipping_method, settings.company)
	sales_order.flags.ignore_permissions = True
	sales_order.insert()

	payment_entry = None
	if payment.method != "cod":
		sales_order.bossco_payment_reference = mock_charge(payment, sales_order.grand_total)
	sales_order.submit()
	if payment.method != "cod":
		payment_entry = record_payment(sales_order, payment, sales_order.bossco_payment_reference)

	return {
		"name": sales_order.name,
		"grand_total": sales_order.grand_total,
		"currency": sales_order.currency,
		"transaction_date": str(sales_order.transaction_date),
		"payment_method": sales_order.bossco_payment_method,
		"payment_reference": sales_order.bossco_payment_reference,
		"paid": bool(payment_entry),
	}


def validate_contact(contact):
	for field in ("first_name", "email", "phone"):
		if not cstr(contact.get(field)).strip():
			frappe.throw(_("{0} is required").format(frappe.unscrub(field)))
	validate_email_address(contact.email.strip(), throw=True)


def get_order_lines(items):
	"""Merge cart lines per item and price them from ERPNext. Returns {item_code: (qty, rate)}."""
	quantities = {}
	for line in items or []:
		item_code = cstr(line.get("item_code"))
		qty = cint(line.get("qty"))
		if not item_code or qty < 1:
			frappe.throw(_("Invalid cart line"))
		quantities[item_code] = quantities.get(item_code, 0) + qty

	if not quantities:
		frappe.throw(_("Your cart is empty"))

	products = {product["id"]: product for product in get_store_products(list(quantities))}
	lines = {}
	for item_code, qty in quantities.items():
		product = products.get(item_code)
		if not product:
			frappe.throw(_("{0} is no longer available").format(item_code))
		if qty > MAX_QTY_PER_LINE:
			frappe.throw(_("You can order at most {0} of {1}").format(MAX_QTY_PER_LINE, product["name"]))
		if product["stock"] is not None and qty > product["stock"]:
			frappe.throw(_("Only {0} left of {1}").format(max(product["stock"], 0), product["name"]))
		lines[item_code] = (qty, product["price"])
	return lines


def create_address(customer, address, email, phone, address_type="Shipping"):
	for field in ADDRESS_FIELDS:
		if not cstr(address.get(field)).strip():
			frappe.throw(_("{0} is required").format(frappe.unscrub(field)))

	return (
		frappe.get_doc(
			{
				"doctype": "Address",
				"address_title": customer,
				"address_type": address_type,
				"address_line1": address.address_line1,
				"address_line2": address.get("address_line2"),
				"city": address.city,
				"state": address.state,
				"pincode": address.pincode,
				"country": address.country,
				"email_id": email,
				"phone": address.get("phone") or phone,
				"links": [{"link_doctype": "Customer", "link_name": customer}],
			}
		)
		.insert(ignore_permissions=True)
		.name
	)


def add_shipping_charge(sales_order, shipping_method, company):
	amount = SHIPPING_CHARGES[shipping_method]
	if not amount:
		return

	account = frappe.db.get_value(
		"Account", {"account_name": "Freight and Forwarding Charges", "company": company, "is_group": 0}
	)
	if not account:
		frappe.throw(_("Set up a Freight and Forwarding Charges account to accept express orders"))

	sales_order.append(
		"taxes",
		{
			"charge_type": "Actual",
			"account_head": account,
			"description": SHIPPING_LABELS[shipping_method],
			"tax_amount": amount,
		},
	)
