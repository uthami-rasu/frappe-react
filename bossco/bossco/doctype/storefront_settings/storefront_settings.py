# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StorefrontSettings(Document):
	def on_update(self):
		frappe.clear_cache(doctype="Storefront Settings")


def get_settings():
	return frappe.get_cached_doc("Storefront Settings")
