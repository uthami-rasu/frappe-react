"""Server copy of a logged-in shopper's cart (Storefront Cart Item), so it follows them across
devices. Guests keep their cart in the browser only; it is merged in when they log in.
Quantities are stored here, prices never: they are always read from ERPNext at checkout.
"""

import frappe
from frappe import _
from frappe.utils import cint, cstr

from bossco.api import MAX_QTY_PER_LINE
from bossco.storefront import get_store_products

CART = "Storefront Cart Item"
MAX_CART_LINES = 100


@frappe.whitelist()
def get_cart():
	return frappe.get_all(
		CART,
		filters={"user": frappe.session.user},
		fields=["item_code", "qty"],
		order_by="creation asc",
	)


@frappe.whitelist(methods=["POST"])
def set_cart(items):
	"""Replace the saved cart with `items` ([{item_code, qty}]); unknown items are dropped."""
	save_cart(normalize(frappe.parse_json(items) or []))
	return get_cart()


@frappe.whitelist(methods=["POST"])
def merge_cart(items):
	"""After login: combine the browser cart with the saved one (larger quantity wins per item)."""
	merged = {row.item_code: row.qty for row in get_cart()}
	for item_code, qty in normalize(frappe.parse_json(items) or []).items():
		merged[item_code] = max(qty, merged.get(item_code, 0))
	save_cart(merged)
	return get_cart()


def normalize(items):
	quantities = {}
	for line in items[:MAX_CART_LINES]:
		item_code, qty = cstr(line.get("item_code")), cint(line.get("qty"))
		if item_code and qty > 0:
			quantities[item_code] = min(qty, MAX_QTY_PER_LINE)
	if not quantities:
		return {}
	store_items = {product["id"] for product in get_store_products(list(quantities))}
	return {code: qty for code, qty in quantities.items() if code in store_items}


def save_cart(quantities):
	user = frappe.session.user
	if user == "Guest":
		frappe.throw(_("Log in to save your cart"), frappe.PermissionError)

	saved = {
		row.item_code: row
		for row in frappe.get_all(CART, filters={"user": user}, fields=["name", "item_code", "qty"])
	}
	for item_code, row in saved.items():
		if item_code not in quantities:
			frappe.db.delete(CART, {"name": row.name})
		elif row.qty != quantities[item_code]:
			frappe.db.set_value(CART, row.name, "qty", quantities[item_code], update_modified=False)
	for item_code, qty in quantities.items():
		if item_code not in saved:
			frappe.get_doc({"doctype": CART, "user": user, "item_code": item_code, "qty": qty}).insert(
				ignore_permissions=True
			)
