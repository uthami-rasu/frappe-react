import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

from bossco.email_templates import make_email_templates


def after_install():
	make_custom_fields()
	make_email_templates()
	set_settings_defaults()
	enable_contact_form()


def after_migrate():
	make_custom_fields()
	make_email_templates()
	set_settings_defaults()
	enable_contact_form()


def enable_contact_form():
	"""The storefront's contact page posts to Frappe's contact endpoint, which Frappe 16 ships
	disabled (Contact Us Settings → Disabled). Enable it so messages are saved and forwarded."""
	meta = frappe.get_meta("Contact Us Settings")
	if meta.has_field("is_disabled") and frappe.db.get_single_value("Contact Us Settings", "is_disabled"):
		frappe.db.set_single_value("Contact Us Settings", "is_disabled", 0)


def set_settings_defaults():
	"""Single DocTypes only store values once saved; write each field's default the first time
	(including fields added in later versions) so features default to on, as designed."""
	doctype = "Storefront Settings"
	saved = set(frappe.db.sql_list("select field from `tabSingles` where doctype = %s", doctype))
	for df in frappe.get_meta(doctype).fields:
		if df.default is not None and df.fieldname not in saved:
			frappe.db.set_single_value(doctype, df.fieldname, df.default)
	frappe.clear_cache(doctype=doctype)


def make_custom_fields():
	"""Storefront fields on Item, shown in their own tab. Re-applied on every migrate."""
	create_custom_fields(get_custom_fields(), update=True)


def get_custom_fields():
	return {
		"Item": [
			{
				"fieldname": "bossco_storefront_tab",
				"fieldtype": "Tab Break",
				"label": "Storefront",
				"insert_after": "total_projected_qty",
			},
			{
				"fieldname": "bossco_show_in_store",
				"fieldtype": "Check",
				"label": "Show in Store",
				"insert_after": "bossco_storefront_tab",
			},
			{
				"fieldname": "bossco_slug",
				"fieldtype": "Data",
				"label": "URL Slug",
				"description": "Used in the product link, e.g. #product/acacia-gold-honey. Generated from Item Name if left empty.",
				"unique": 1,
				"no_copy": 1,
				"insert_after": "bossco_show_in_store",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_subtitle",
				"fieldtype": "Small Text",
				"label": "Subtitle",
				"insert_after": "bossco_slug",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_origin",
				"fieldtype": "Data",
				"label": "Origin",
				"insert_after": "bossco_subtitle",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_pack_size",
				"fieldtype": "Data",
				"label": "Pack Size",
				"description": "Shown on product cards, e.g. 500g",
				"insert_after": "bossco_origin",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_column_break",
				"fieldtype": "Column Break",
				"insert_after": "bossco_pack_size",
			},
			{
				"fieldname": "bossco_badge",
				"fieldtype": "Data",
				"label": "Badge",
				"description": "e.g. Bestseller, New season, Limited harvest",
				"insert_after": "bossco_column_break",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_compare_at_price",
				"fieldtype": "Currency",
				"label": "Compare-at Price",
				"description": "Original price shown struck through next to the selling price",
				"insert_after": "bossco_badge",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_rating",
				"fieldtype": "Float",
				"label": "Rating",
				"precision": "1",
				"read_only": 1,
				"no_copy": 1,
				"description": "Average of published Storefront Reviews",
				"insert_after": "bossco_compare_at_price",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_reviews",
				"fieldtype": "Int",
				"label": "Review Count",
				"read_only": 1,
				"no_copy": 1,
				"description": "Number of published Storefront Reviews",
				"insert_after": "bossco_rating",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_featured",
				"fieldtype": "Check",
				"label": "Show in Everyday Favourites",
				"insert_after": "bossco_reviews",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_trending",
				"fieldtype": "Check",
				"label": "Show in Trending",
				"insert_after": "bossco_featured",
				"depends_on": "bossco_show_in_store",
			},
			{
				"fieldname": "bossco_sort_order",
				"fieldtype": "Int",
				"label": "Sort Order",
				"description": "Lower numbers appear first",
				"insert_after": "bossco_trending",
				"depends_on": "bossco_show_in_store",
			},
		],
		"Sales Order": [
			{
				"fieldname": "bossco_storefront_section",
				"fieldtype": "Section Break",
				"label": "Storefront Payment",
				# end of the Payment Terms section, so existing sections keep their fields
				"insert_after": "payment_schedule",
				"collapsible": 1,
			},
			{
				"fieldname": "bossco_payment_method",
				"fieldtype": "Data",
				"label": "Payment Method",
				"read_only": 1,
				"in_standard_filter": 1,
				"insert_after": "bossco_storefront_section",
			},
			{
				"fieldname": "bossco_payment_reference",
				"fieldtype": "Data",
				"label": "Payment Reference",
				"read_only": 1,
				"no_copy": 1,
				"insert_after": "bossco_payment_method",
			},
			{
				"fieldname": "bossco_checkout_key",
				"fieldtype": "Data",
				"label": "Checkout Key",
				"description": "One per storefront checkout attempt; stops a retried checkout from creating a second order",
				"read_only": 1,
				"no_copy": 1,
				"unique": 1,
				"insert_after": "bossco_payment_reference",
			},
			{
				"fieldname": "bossco_confirmation_sent",
				"fieldtype": "Check",
				"label": "Confirmation Email Sent",
				"read_only": 1,
				"no_copy": 1,
				"insert_after": "bossco_checkout_key",
			},
		],
		"Sales Invoice": [
			{
				"fieldname": "bossco_invoice_emailed",
				"fieldtype": "Check",
				"label": "Emailed to Customer (Storefront)",
				"read_only": 1,
				"no_copy": 1,
				"allow_on_submit": 1,
				"insert_after": "customer_name",
			},
		],
	}
