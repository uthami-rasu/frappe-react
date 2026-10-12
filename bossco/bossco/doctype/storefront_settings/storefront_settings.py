# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StorefrontSettings(Document):
	def on_update(self):
		frappe.clear_cache(doctype="Storefront Settings")
		if self.has_value_changed("simplified_desk"):
			from bossco.desk import apply_workspace_visibility

			apply_workspace_visibility()


def get_settings():
	return frappe.get_cached_doc("Storefront Settings")
