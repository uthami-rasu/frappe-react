"""Public endpoints used by the React storefront (frontend/src/features/api/storeApi.ts)."""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import add_days, cint, cstr, flt, today, validate_email_address

from bossco.customers import (
	create_customer,
	ensure_customer_for_user,
	get_customer_for_user,
	get_or_create_guest_customer,
	validate_address_owner,
)
from bossco.offers import CouponError, resolve_coupon, validate_coupon_for_customer
from bossco.payments import PAYMENT_METHODS, mock_charge, parse_payment, record_payment
from bossco.storefront import (
	get_bought_together,
	get_filter_options,
	get_group_with_descendants,
	get_product_details,
	get_store_categories,
	get_store_products,
	get_store_settings,
)

SHIPPING_CHARGES = {"free": 0, "express": 150, "pickup": 0}
SHIPPING_LABELS = {"free": "Free shipping", "express": "Express shipping", "pickup": "Pick up"}
DELIVERY_DAYS = 3
MAX_QTY_PER_LINE = 100
CHECKOUT_KEY_LENGTH = 64
ADDRESS_FIELDS = ("address_line1", "city", "state", "pincode", "country")
PRODUCT_SORTS = {
	"featured": None,  # Sort Order on the Item, then name (the query's order)
	"newest": (lambda product: product["createdAt"], True),
	"price-low": (lambda product: product["price"], False),
	"price-high": (lambda product: product["price"], True),
	"rating": (lambda product: (product["rating"], product["reviews"]), True),
	"popular": (lambda product: product["sold"], True),
}
MAX_PAGE_LENGTH = 200


@frappe.whitelist(allow_guest=True)
def get_catalog():
	products = get_store_products()
	return {"products": products, "categories": get_store_categories(products)}


@frappe.whitelist(allow_guest=True)
def get_storefront_config():
	"""Store-wide settings the React app shows but doesn't decide: shipping prices, announcement, ..."""
	settings = frappe.get_cached_doc("Storefront Settings")
	return {
		"storeName": settings.store_name or "Bossco",
		"announcement": settings.announcement or "",
		"currency": frappe.db.get_value("Price List", get_store_settings().price_list, "currency") or "INR",
		"deliveryDays": DELIVERY_DAYS,
		"shippingOptions": [
			{"id": method, "label": SHIPPING_LABELS[method], "amount": amount}
			for method, amount in SHIPPING_CHARGES.items()
		],
		"requireVerifiedPurchase": bool(settings.require_verified_purchase),
	}


@frappe.whitelist(allow_guest=True)
def get_product(item_code):
	"""Product page extras: sanitised description, specifications and image gallery."""
	details = get_product_details(cstr(item_code))
	if not details:
		raise frappe.DoesNotExistError(_("Product not found"))
	return details


@frappe.whitelist(allow_guest=True)
def get_related_products(item_code, limit=8):
	"""Item codes to recommend on a product page.

	`boughtTogether`: most often on the same order. `similar`: same Item Group, then the rest of its
	parent group, then best sellers, as a fallback when there is little order history.
	"""
	item_code = cstr(item_code)
	limit = min(cint(limit) or 8, 24)
	products = get_store_products()
	by_code = {product["id"]: product for product in products}
	current = by_code.get(item_code)
	if not current:
		return {"boughtTogether": [], "similar": []}

	in_stock_first = lambda codes: sorted(codes, key=lambda code: not by_code[code]["inStock"])  # noqa: E731
	bought_together = [code for code in get_bought_together(item_code, limit) if code in by_code][:4]

	group = current["category"]
	parent = frappe.db.get_value("Item Group", group, "parent_item_group")
	siblings = set(get_group_with_descendants(parent)) if parent else set()
	by_popularity = sorted(products, key=lambda product: (product["sold"], product["rating"]), reverse=True)
	similar = []
	for matches in (
		lambda product: product["category"] == group,
		lambda product: product["category"] in siblings,
		lambda product: True,
	):
		for product in by_popularity:
			code = product["id"]
			if code != item_code and code not in similar and code not in bought_together and matches(product):
				similar.append(code)
	return {"boughtTogether": in_stock_first(bought_together), "similar": in_stock_first(similar[:limit])}


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


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=120, seconds=60)
def get_cart_quote(items, shipping_method="free", coupon_code=None):
	"""Price a cart exactly as checkout would, without saving anything.

	A Sales Order is built and inserted the same way `place_order` does, so ERPNext's Pricing Rules,
	coupons, taxes and shipping all apply, then everything is rolled back. Lines that can't be
	ordered are reported in `issues` rather than failing the whole quote.
	"""
	if shipping_method not in SHIPPING_CHARGES:
		shipping_method = "free"
	quantities = merge_cart_lines(frappe.parse_json(items) or [], strict=False)
	products = {product["id"]: product for product in get_store_products(list(quantities))}

	issues, order_lines = [], {}
	for item_code, qty in quantities.items():
		product = products.get(item_code)
		if not product:
			issues.append({"itemCode": item_code, "type": "unavailable", "message": _("No longer available")})
		elif not product["inStock"]:
			issues.append({"itemCode": item_code, "type": "out_of_stock", "message": _("Out of stock")})
		elif product["stock"] is not None and qty > product["stock"]:
			issues.append(
				{
					"itemCode": item_code,
					"type": "limited_stock",
					"available": product["stock"],
					"message": _("Only {0} left").format(product["stock"]),
				}
			)
			order_lines[item_code] = (product["stock"], product["price"])
		else:
			order_lines[item_code] = (min(qty, MAX_QTY_PER_LINE), product["price"])

	user = frappe.session.user
	customer = None if user == "Guest" else get_customer_for_user(user)[0]
	coupon, coupon_message = None, None
	if coupon_code:
		try:
			coupon = resolve_coupon(coupon_code)
			validate_coupon_for_customer(coupon, customer, user)
		except CouponError as error:
			coupon, coupon_message = None, str(error)

	quote = empty_quote(shipping_method)
	if order_lines:
		frappe.db.savepoint("bossco_quote")
		try:
			# a guest has no Customer yet; price against a throwaway one with the same defaults
			sales_order = build_sales_order(
				customer or create_customer("Storefront quote"), order_lines, shipping_method, coupon
			)
			sales_order.flags.name_set = True  # skip the naming series, nothing is kept
			sales_order.name = f"bossco-quote-{frappe.generate_hash(length=10)}"
			sales_order.insert()
			quote = summarize_order(sales_order)
			if coupon and not coupon_applied(sales_order, coupon):
				coupon_message = coupon_not_applied_message(coupon, quote["subtotal"])
				coupon = None
		except frappe.ValidationError as error:
			frappe.clear_last_message()
			quote["error"] = cstr(error) or _("We couldn't price your cart. Please try again.")
		finally:
			frappe.db.rollback(save_point="bossco_quote")

	quote["issues"] = issues
	quote["coupon"] = (
		{"code": frappe.db.get_value("Coupon Code", coupon, "coupon_code"), "applied": True, "message": None}
		if coupon
		else {"code": cstr(coupon_code).strip() or None, "applied": False, "message": coupon_message}
	)
	return quote


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=20, seconds=60 * 60)
def place_order(
	items,
	contact=None,
	address=None,
	address_name=None,
	shipping_method="free",
	payment=None,
	coupon_code=None,
	checkout_key=None,
):
	"""Create and submit a Sales Order; for card/UPI also take the (mock) payment.

	Logged-in shoppers order as their own Customer and may pick a saved address. Guests are
	matched to an earlier guest Customer by email, or a new one is created. Prices and discounts
	always come from ERPNext, never from the browser. Any failure, including a declined payment,
	rolls the whole order back. `checkout_key` (one per checkout attempt) makes retries safe:
	repeating it returns the order that was already placed instead of creating another.
	"""
	checkout_key = cstr(checkout_key).strip()[:CHECKOUT_KEY_LENGTH] or None
	if checkout_key and (existing := get_order_by_checkout_key(checkout_key)):
		return existing

	contact = frappe._dict(frappe.parse_json(contact) or {})
	address = frappe._dict(frappe.parse_json(address) or {})
	items = frappe.parse_json(items)
	payment = parse_payment(payment)

	if shipping_method not in SHIPPING_CHARGES:
		frappe.throw(_("Unknown shipping method"))

	order_lines = get_order_lines(items)

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

	coupon = None
	if cstr(coupon_code).strip():
		try:
			coupon = resolve_coupon(coupon_code)
			validate_coupon_for_customer(coupon, customer, frappe.session.user)
		except CouponError as error:
			frappe.throw(str(error), title=_("Coupon not applied"))

	if address_name and frappe.session.user != "Guest":
		validate_address_owner(address_name, customer)
	else:
		address_name = create_address(customer, address, email, phone)

	sales_order = build_sales_order(
		customer,
		order_lines,
		shipping_method,
		coupon,
		address_name=address_name,
		contact_name=contact_name,
		contact_email=email,
		payment_method=PAYMENT_METHODS[payment.method],
		checkout_key=checkout_key,
	)
	try:
		sales_order.insert()
	except frappe.UniqueValidationError:
		# the same checkout was submitted twice at once; the first one won
		frappe.db.rollback()
		if checkout_key and (existing := get_order_by_checkout_key(checkout_key)):
			return existing
		raise
	if coupon and not coupon_applied(sales_order, coupon):
		frappe.throw(
			coupon_not_applied_message(coupon, flt(sales_order.total)), title=_("Coupon not applied")
		)

	payment_entry = None
	if payment.method != "cod":
		sales_order.bossco_payment_reference = mock_charge(
			payment, sales_order.rounded_total or sales_order.grand_total
		)
	sales_order.submit()
	if payment.method != "cod":
		payment_entry = record_payment(sales_order, payment, sales_order.bossco_payment_reference)

	if frappe.session.user != "Guest":
		frappe.db.delete("Storefront Cart Item", {"user": frappe.session.user})

	frappe.enqueue(
		"bossco.orders.after_order_placed",
		queue="short",
		sales_order=sales_order.name,
		enqueue_after_commit=True,
	)
	return order_result(sales_order, bool(payment_entry))


def get_order_by_checkout_key(checkout_key):
	name = frappe.db.get_value("Sales Order", {"bossco_checkout_key": checkout_key, "docstatus": 1})
	if not name:
		return None
	sales_order = frappe.get_doc("Sales Order", name)
	return order_result(sales_order, flt(sales_order.advance_paid) > 0)


def order_result(sales_order, paid):
	return {
		"name": sales_order.name,
		"grand_total": sales_order.rounded_total or sales_order.grand_total,
		"currency": sales_order.currency,
		"transaction_date": str(sales_order.transaction_date),
		"payment_method": sales_order.bossco_payment_method,
		"payment_reference": sales_order.bossco_payment_reference,
		"paid": paid,
		"email": sales_order.contact_email,
	}


def build_sales_order(
	customer,
	order_lines,
	shipping_method,
	coupon=None,
	address_name=None,
	contact_name=None,
	contact_email=None,
	payment_method=None,
	checkout_key=None,
):
	"""Unsaved Sales Order for a storefront cart; shared by the quote and checkout."""
	settings = get_store_settings()
	sales_order = frappe.get_doc(
		{
			"doctype": "Sales Order",
			"customer": customer,
			"company": settings.company,
			"order_type": "Shopping Cart",
			"transaction_date": today(),
			"delivery_date": add_days(today(), DELIVERY_DAYS),
			"selling_price_list": settings.price_list,
			"set_warehouse": settings.warehouse,
			"customer_address": address_name,
			"shipping_address_name": address_name,
			"contact_person": contact_name,
			"contact_email": contact_email,
			"coupon_code": coupon,
			"bossco_payment_method": payment_method,
			"bossco_checkout_key": checkout_key,
			"items": [
				{"item_code": item_code, "qty": qty, "rate": price, "warehouse": settings.warehouse}
				for item_code, (qty, price) in order_lines.items()
			],
		}
	)
	add_shipping_charge(sales_order, shipping_method, settings.company)
	sales_order.flags.ignore_permissions = True
	return sales_order


def empty_quote(shipping_method):
	return {
		"lines": [],
		"subtotal": 0,
		"discount": 0,
		"shipping": SHIPPING_CHARGES[shipping_method],
		"taxes": 0,
		"total": 0,
		"currency": "INR",
		"error": None,
	}


def summarize_order(sales_order):
	"""Totals as ERPNext calculated them. `subtotal` is before any discount."""
	lines, subtotal, item_discount = [], 0, 0
	for item in sales_order.items:
		list_rate = flt(item.price_list_rate) or flt(item.rate)
		subtotal += list_rate * flt(item.qty)
		item_discount += (list_rate - flt(item.rate)) * flt(item.qty)
		lines.append(
			{
				"itemCode": item.item_code,
				"qty": flt(item.qty),
				"listRate": list_rate,
				"rate": flt(item.rate),
				"amount": flt(item.amount),
			}
		)
	shipping = sum(
		flt(tax.tax_amount) for tax in sales_order.taxes if tax.description in SHIPPING_LABELS.values()
	)
	return {
		"lines": lines,
		"subtotal": flt(subtotal, 2),
		"discount": flt(item_discount + flt(sales_order.discount_amount), 2),
		"shipping": shipping,
		"taxes": flt(flt(sales_order.total_taxes_and_charges) - shipping, 2),
		"total": flt(sales_order.rounded_total or sales_order.grand_total, 2),
		"currency": sales_order.currency,
		"error": None,
	}


def coupon_applied(sales_order, coupon):
	"""Whether ERPNext actually applied the coupon's Pricing Rule (minimum amount, item match, ...)."""
	rule = frappe.db.get_value(
		"Pricing Rule",
		frappe.db.get_value("Coupon Code", coupon, "pricing_rule"),
		["name", "apply_on", "rate_or_discount", "discount_percentage"],
		as_dict=True,
	)
	if rule.apply_on == "Transaction":
		# transaction rules land on the order's additional discount, not on the items
		if rule.rate_or_discount == "Discount Percentage":
			return flt(sales_order.additional_discount_percentage) == flt(rule.discount_percentage) > 0
		return flt(sales_order.discount_amount) > 0
	return any(
		rule.name in (frappe.parse_json(item.pricing_rules or "[]") or []) for item in sales_order.items
	)


def coupon_not_applied_message(coupon, subtotal):
	code, rule = frappe.db.get_value("Coupon Code", coupon, ["coupon_code", "pricing_rule"])
	min_amount = flt(frappe.db.get_value("Pricing Rule", rule, "min_amt"))
	if min_amount and subtotal < min_amount:
		return _("Add {0} more to use coupon {1}").format(
			frappe.utils.fmt_money(min_amount - subtotal, 0, "INR"), code
		)
	return _("Coupon {0} doesn't apply to the products in your cart").format(code)


def validate_contact(contact):
	for field in ("first_name", "email", "phone"):
		if not cstr(contact.get(field)).strip():
			frappe.throw(_("{0} is required").format(frappe.unscrub(field)))
	validate_email_address(contact.email.strip(), throw=True)


def merge_cart_lines(items, strict=True):
	"""{item_code: total qty}; invalid lines raise when `strict`, otherwise they're dropped."""
	quantities = {}
	for line in items or []:
		item_code = cstr(line.get("item_code"))
		qty = cint(line.get("qty"))
		if not item_code or qty < 1:
			if strict:
				frappe.throw(_("Invalid cart line"))
			continue
		quantities[item_code] = quantities.get(item_code, 0) + qty
	return quantities


def get_order_lines(items):
	"""Merge cart lines per item and price them from ERPNext. Returns {item_code: (qty, rate)}."""
	quantities = merge_cart_lines(items)
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
