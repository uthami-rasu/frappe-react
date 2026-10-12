# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, cstr, flt

MAX_COMMENT_LENGTH = 2000


class StorefrontReview(Document):
	def validate(self):
		self.rating = cint(self.rating)
		if not 1 <= self.rating <= 5:
			frappe.throw(_("Rating must be between 1 and 5 stars"))
		self.title = cstr(self.title).strip()
		self.comment = cstr(self.comment).strip()
		if len(self.comment) > MAX_COMMENT_LENGTH:
			frappe.throw(_("Reviews can be at most {0} characters").format(MAX_COMMENT_LENGTH))

	def on_update(self):
		update_item_rating(self.item_code)
		if self.has_value_changed("item_code") and self.get_doc_before_save():
			update_item_rating(self.get_doc_before_save().item_code)

	def on_trash(self):
		frappe.db.delete("Storefront Review Vote", {"review": self.name})

	def after_delete(self):
		update_item_rating(self.item_code)


def on_doctype_update():
	frappe.db.add_unique("Storefront Review", ["item_code", "user"], constraint_name="unique_item_user")
	frappe.db.add_index("Storefront Review", ["item_code", "status"])


def update_item_rating(item_code):
	"""Item's storefront rating and review count always come from published reviews."""
	row = frappe.db.sql(
		"""select count(*) as reviews, avg(rating) as rating
		from `tabStorefront Review` where item_code = %s and status = 'Published'""",
		item_code,
		as_dict=True,
	)[0]
	frappe.db.set_value(
		"Item",
		item_code,
		{"bossco_rating": flt(row.rating, 1), "bossco_reviews": cint(row.reviews)},
		update_modified=False,
	)
