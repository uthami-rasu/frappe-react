# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StorefrontWishlistItem(Document):
	pass


def on_doctype_update():
	frappe.db.add_unique("Storefront Wishlist Item", ["user", "item_code"], constraint_name="unique_user_item")
