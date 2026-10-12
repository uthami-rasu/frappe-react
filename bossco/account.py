"""Shopper accounts for the React storefront: session, sign up, login, profile, addresses,
order history and wishlist. All writes go through these methods with explicit ownership checks.
"""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import cint, cstr, flt, validate_email_address
from frappe.utils.password import check_password, update_password

from bossco.api import ADDRESS_FIELDS, create_address
from bossco.customers import (
	ensure_customer_for_user,
	get_customer_addresses,
	get_customer_for_user,
	validate_address_owner,
)
from bossco.storefront import get_store_products

MIN_PASSWORD_LENGTH = 8
WISHLIST = "Storefront Wishlist Item"


# Session and authentication


@frappe.whitelist(allow_guest=True)
def get_session():
	return get_session_info()


def get_session_info():
	"""Who is logged in, plus the CSRF token for this session (it changes on login)."""
	user = frappe.session.user
	if user == "Guest":
		return {"user": None, "csrf_token": None}

	details = frappe.db.get_value(
		"User", user, ["email", "first_name", "last_name", "full_name", "mobile_no", "user_type"], as_dict=True
	)
	return {
		"user": {
			"email": details.email or user,
			"firstName": details.first_name or "",
			"lastName": details.last_name or "",
			"fullName": details.full_name or user,
			"phone": details.mobile_no or "",
			"isSystemUser": details.user_type == "System User",
		},
		"csrf_token": frappe.sessions.get_csrf_token(),
	}


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=10, seconds=10 * 60)
def login(email, password):
	login_manager = frappe.local.login_manager
	login_manager.authenticate(user=cstr(email).strip(), pwd=password)
	login_manager.post_login()
	return get_session_info()


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=5, seconds=60 * 60)
def sign_up(first_name, email, password, last_name=None, phone=None):
	"""Create a Website User with the Customer role and their ERPNext Customer, then log in."""
	email = cstr(email).strip().lower()
	first_name = cstr(first_name).strip()
	if not first_name:
		frappe.throw(_("First name is required"))
	validate_email_address(email, throw=True)
	validate_new_password(password)
	if frappe.db.exists("User", email):
		frappe.throw(_("An account with this email already exists. Please sign in instead."))

	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": first_name,
			"last_name": cstr(last_name).strip(),
			"mobile_no": cstr(phone).strip(),
			"user_type": "Website User",
			"send_welcome_email": 0,
			"new_password": password,
			"roles": [{"role": "Customer"}],
		}
	)
	user.flags.ignore_permissions = True
	user.insert()

	ensure_customer_for_user(user.name)
	frappe.local.login_manager.login_as(user.name)
	return get_session_info()


@frappe.whitelist(methods=["POST"])
def logout():
	frappe.local.login_manager.logout()
	return {"user": None, "csrf_token": None}


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=5, seconds=60 * 60)
def forgot_password(email):
	"""Email a reset link (Frappe's /update-password page). Same answer whether or not the account exists."""
	email = cstr(email).strip().lower()
	user = frappe.db.get_value("User", {"name": email, "enabled": 1, "user_type": "Website User"})
	if user:
		try:
			frappe.get_doc("User", user).reset_password(send_email=True)
		except Exception:
			frappe.log_error(title="Storefront password reset email failed")
	return {"message": _("If an account exists for {0}, we've emailed a link to reset the password.").format(email)}


# Profile


@frappe.whitelist(methods=["POST"])
def update_profile(first_name, last_name=None, phone=None):
	first_name = cstr(first_name).strip()
	if not first_name:
		frappe.throw(_("First name is required"))

	user = frappe.get_doc("User", frappe.session.user)
	user.first_name = first_name
	user.last_name = cstr(last_name).strip()
	user.mobile_no = cstr(phone).strip()
	user.save(ignore_permissions=True)

	_customer, contact = get_customer_for_user(user.name)
	if contact:
		contact_doc = frappe.get_doc("Contact", contact)
		contact_doc.first_name = user.first_name
		contact_doc.last_name = user.last_name
		if user.mobile_no and user.mobile_no not in [row.phone for row in contact_doc.phone_nos]:
			for row in contact_doc.phone_nos:
				row.is_primary_mobile_no = 0
			contact_doc.append("phone_nos", {"phone": user.mobile_no, "is_primary_mobile_no": 1})
		contact_doc.save(ignore_permissions=True)

	return get_session_info()


@frappe.whitelist(methods=["POST"])
@rate_limit(limit=5, seconds=10 * 60)
def change_password(old_password, new_password):
	user = frappe.session.user
	try:
		check_password(user, old_password)
	except frappe.AuthenticationError:
		frappe.throw(_("Your current password is incorrect"))
	validate_new_password(new_password)
	update_password(user, new_password)
	return {"message": _("Password updated")}


def validate_new_password(password):
	if len(cstr(password)) < MIN_PASSWORD_LENGTH:
		frappe.throw(_("Password must be at least {0} characters").format(MIN_PASSWORD_LENGTH))


# Addresses


@frappe.whitelist()
def get_addresses():
	customer, _contact = get_customer_for_user(frappe.session.user)
	if not customer:
		return []
	return frappe.get_all(
		"Address",
		filters={"name": ("in", get_customer_addresses(customer) or [""]), "disabled": 0},
		fields=[
			"name",
			"address_type",
			"address_line1",
			"address_line2",
			"city",
			"state",
			"pincode",
			"country",
			"phone",
			"is_shipping_address",
		],
		order_by="is_shipping_address desc, modified desc",
	)


@frappe.whitelist(methods=["POST"])
def save_address(address):
	address = frappe._dict(frappe.parse_json(address))
	customer, _contact = ensure_customer_for_user(frappe.session.user)

	if address.get("name"):
		validate_address_owner(address.name, customer)
		doc = frappe.get_doc("Address", address.name)
		for field in (*ADDRESS_FIELDS, "address_line2", "phone", "address_type"):
			if field in address:
				doc.set(field, address[field])
		for field in ADDRESS_FIELDS:
			if not cstr(doc.get(field)).strip():
				frappe.throw(_("{0} is required").format(frappe.unscrub(field)))
	else:
		name = create_address(
			customer,
			address,
			frappe.db.get_value("User", frappe.session.user, "email"),
			address.get("phone"),
			address.get("address_type") or "Shipping",
		)
		doc = frappe.get_doc("Address", name)

	if cint(address.get("is_shipping_address")):
		# only one preferred shipping address per customer
		for other in get_customer_addresses(customer):
			if other != doc.name:
				frappe.db.set_value("Address", other, "is_shipping_address", 0)
		doc.is_shipping_address = 1
	doc.save(ignore_permissions=True)
	return get_addresses()


@frappe.whitelist(methods=["POST"])
def delete_address(name):
	"""Disable rather than delete: past Sales Orders still link to the address."""
	customer, _contact = get_customer_for_user(frappe.session.user)
	validate_address_owner(name, customer)
	frappe.db.set_value("Address", name, {"disabled": 1, "is_shipping_address": 0})
	return get_addresses()


# Orders


@frappe.whitelist()
def get_orders():
	customer, _contact = get_customer_for_user(frappe.session.user)
	if not customer:
		return []

	orders = frappe.get_all(
		"Sales Order",
		filters={"customer": customer},
		fields=[
			"name",
			"transaction_date",
			"status",
			"docstatus",
			"grand_total",
			"currency",
			"per_delivered",
			"advance_paid",
			"shipping_address_name",
			"bossco_payment_method",
			"bossco_payment_reference",
		],
		order_by="creation desc",
		limit=50,
	)
	if not orders:
		return []

	items = frappe.get_all(
		"Sales Order Item",
		filters={"parent": ("in", [order.name for order in orders])},
		fields=["parent", "item_code", "item_name", "qty", "rate", "amount", "image"],
		order_by="idx asc",
	)
	addresses = get_address_lines([order.shipping_address_name for order in orders if order.shipping_address_name])
	items_by_order = {}
	for item in items:
		items_by_order.setdefault(item.parent, []).append(
			{
				"itemCode": item.item_code,
				"itemName": item.item_name,
				"qty": flt(item.qty),
				"rate": flt(item.rate),
				"amount": flt(item.amount),
				"image": item.image or "",
			}
		)

	return [
		{
			"name": order.name,
			"date": str(order.transaction_date),
			"status": get_order_status(order),
			"total": flt(order.grand_total),
			"currency": order.currency,
			"paymentMethod": order.bossco_payment_method or "Cash on delivery",
			"paymentReference": order.bossco_payment_reference or "",
			"paid": flt(order.advance_paid) >= flt(order.grand_total) > 0,
			"shippingAddress": addresses.get(order.shipping_address_name, ""),
			"items": items_by_order.get(order.name, []),
		}
		for order in orders
	]


def get_address_lines(names):
	"""{address name: "line 1, city, state, pincode, country"}"""
	rows = frappe.get_all(
		"Address",
		filters={"name": ("in", names or [""])},
		fields=["name", "address_line1", "address_line2", "city", "state", "pincode", "country"],
	)
	return {
		row.name: ", ".join(
			filter(None, [row.address_line1, row.address_line2, row.city, row.state, row.pincode, row.country])
		)
		for row in rows
	}


def get_order_status(order):
	"""ERPNext's Sales Order status in shopper words."""
	if order.docstatus == 2:
		return "Cancelled"
	if order.docstatus == 0:
		return "Awaiting confirmation"
	if order.status in ("Completed", "Closed") or flt(order.per_delivered) >= 100:
		return "Delivered"
	if order.status == "On Hold":
		return "On hold"
	if flt(order.per_delivered) > 0:
		return "Partly shipped"
	return "Processing"


# Wishlist


@frappe.whitelist()
def get_wishlist():
	return frappe.get_all(WISHLIST, filters={"user": frappe.session.user}, pluck="item_code", order_by="creation asc")


@frappe.whitelist(methods=["POST"])
def add_to_wishlist(item_code):
	add_wishlist_items([item_code])
	return get_wishlist()


@frappe.whitelist(methods=["POST"])
def remove_from_wishlist(item_code):
	frappe.db.delete(WISHLIST, {"user": frappe.session.user, "item_code": item_code})
	return get_wishlist()


@frappe.whitelist(methods=["POST"])
def merge_wishlist(item_codes):
	"""Called after login: keep what the shopper saved while logged out."""
	add_wishlist_items(frappe.parse_json(item_codes) or [])
	return get_wishlist()


def add_wishlist_items(item_codes):
	user = frappe.session.user
	saved = set(get_wishlist())
	store_items = {product["id"] for product in get_store_products([c for c in item_codes if c not in saved])}
	for item_code in item_codes:
		if item_code in store_items and item_code not in saved:
			frappe.get_doc({"doctype": WISHLIST, "user": user, "item_code": item_code}).insert(
				ignore_permissions=True
			)
			saved.add(item_code)
