"""Item ratings used to be typed in by hand; they now always come from published Storefront Reviews."""

import frappe

from bossco.bossco.doctype.storefront_review.storefront_review import update_item_rating


def execute():
	for item_code in frappe.get_all("Item", filters={"bossco_show_in_store": 1}, pluck="name"):
		update_item_rating(item_code)
