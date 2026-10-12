# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StorefrontReviewVote(Document):
	def after_insert(self):
		update_helpful_count(self.review)

	def after_delete(self):
		update_helpful_count(self.review)


def on_doctype_update():
	frappe.db.add_unique("Storefront Review Vote", ["review", "user"], constraint_name="unique_review_user")


def update_helpful_count(review):
	count = frappe.db.count("Storefront Review Vote", {"review": review})
	frappe.db.set_value("Storefront Review", review, "helpful_count", count, update_modified=False)
