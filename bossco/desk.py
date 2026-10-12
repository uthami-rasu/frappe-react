"""The "Store" workspace in Desk: a dashboard for whoever runs the shop.

Number cards, an orders chart, quick links and link cards for everything the storefront touches
(orders, invoices, customers, catalog, reviews, promotions, email, settings). Created on install
and re-applied on every migrate, so the layout here is the source of truth. With *Show only the
Store workspace in Desk* on (Storefront Settings), the other ERPNext workspaces are hidden from
the sidebar; documents stay fully accessible through the Store links and search.

On Frappe 16 the module's sidebar (Dashboard, Orders, …) is shipped as
bossco/sidebar/store/store.json and synced on migrate; Frappe 15 ignores that folder and lists
the workspace in its own sidebar.
"""

import json

import frappe

WORKSPACE = "Store"
MODULE = "Bossco"
SHIPPING_STATUSES = ["To Deliver and Bill", "To Deliver"]

# label: (doctype, function, field, filters, color)
NUMBER_CARDS = {
	"Orders Today": (
		"Sales Order",
		"Count",
		None,
		[["Sales Order", "docstatus", "=", 1], ["Sales Order", "transaction_date", "Timespan", "today"]],
		"#173f32",
	),
	"Revenue This Month": (
		"Sales Order",
		"Sum",
		"grand_total",
		[["Sales Order", "docstatus", "=", 1], ["Sales Order", "transaction_date", "Timespan", "this month"]],
		"#2f7a4a",
	),
	"Orders to Ship": (
		"Sales Order",
		"Count",
		None,
		[["Sales Order", "docstatus", "=", 1], ["Sales Order", "status", "in", SHIPPING_STATUSES]],
		"#d9a441",
	),
	"Unpaid Invoices": (
		"Sales Invoice",
		"Count",
		None,
		[["Sales Invoice", "docstatus", "=", 1], ["Sales Invoice", "outstanding_amount", ">", 0]],
		"#b3261e",
	),
	"Pending Reviews": (
		"Storefront Review",
		"Count",
		None,
		[["Storefront Review", "status", "=", "Pending"]],
		"#a35c00",
	),
	"Customers": ("Customer", "Count", None, [["Customer", "disabled", "=", 0]], "#173f32"),
	"Products in Store": (
		"Item",
		"Count",
		None,
		[["Item", "bossco_show_in_store", "=", 1], ["Item", "disabled", "=", 0]],
		"#173f32",
	),
	"Active Offers": (
		"Storefront Offer",
		"Count",
		None,
		[["Storefront Offer", "enabled", "=", 1]],
		"#2f7a4a",
	),
}

CHART = {
	"chart_name": "Storefront Orders",
	"chart_type": "Count",
	"document_type": "Sales Order",
	"based_on": "transaction_date",
	"timespan": "Last Month",
	"time_interval": "Daily",
	"type": "Line",
	"color": "#173f32",
	"filters_json": json.dumps([["Sales Order", "docstatus", "=", 1]]),
	"is_public": 1,
	"module": MODULE,
}

# label: (type, link_to, doc_view, stats_filter, icon)
SHORTCUTS = {
	"Orders": ("DocType", "Sales Order", "List", {"docstatus": 1}, "sell"),
	"Invoices": ("DocType", "Sales Invoice", "List", {"docstatus": 1}, "accounting"),
	"Customers": ("DocType", "Customer", "List", {"disabled": 0}, "customer"),
	"Products": ("DocType", "Item", "List", {"bossco_show_in_store": 1}, "stock"),
	"Item Groups": ("DocType", "Item Group", "Tree", None, "folder-normal"),
	"Reviews": ("DocType", "Storefront Review", "List", {"status": "Pending"}, "comment"),
	"Offers": ("DocType", "Storefront Offer", "List", {"enabled": 1}, "star"),
	"Coupons": ("DocType", "Coupon Code", "List", None, "tag"),
	"Sent Emails": ("DocType", "Email Queue", "List", None, "mail"),
	"Settings": ("DocType", "Storefront Settings", "List", None, "setting-gear"),
	"Open Storefront": ("URL", "/", None, None, "website"),
}

# card title: [(label, link_to, link_type)]
CARDS = {
	"Orders & Billing": [
		("Sales Order", "Sales Order", "DocType"),
		("Sales Invoice", "Sales Invoice", "DocType"),
		("Delivery Note", "Delivery Note", "DocType"),
		("Payment Entry", "Payment Entry", "DocType"),
	],
	"Catalog": [
		("Item", "Item", "DocType"),
		("Item Group", "Item Group", "DocType"),
		("Item Price", "Item Price", "DocType"),
		("Stock Balance", "Stock Balance", "Report"),
	],
	"Customers": [
		("Customer", "Customer", "DocType"),
		("Contact", "Contact", "DocType"),
		("Address", "Address", "DocType"),
		("Customer Group", "Customer Group", "DocType"),
	],
	"Reviews & Promotions": [
		("Storefront Review", "Storefront Review", "DocType"),
		("Storefront Offer", "Storefront Offer", "DocType"),
		("Coupon Code", "Coupon Code", "DocType"),
		("Pricing Rule", "Pricing Rule", "DocType"),
	],
	"Email": [
		("Email Queue", "Email Queue", "DocType"),
		("Email Template", "Email Template", "DocType"),
		("Email Account", "Email Account", "DocType"),
		("Newsletter Subscribers", "Email Group Member", "DocType"),
	],
	"Settings & Reports": [
		("Storefront Settings", "Storefront Settings", "DocType"),
		("Selling Settings", "Selling Settings", "DocType"),
		("Sales Analytics", "Sales Analytics", "Report"),
		("Sales Register", "Sales Register", "Report"),
	],
}


def setup_desk():
	make_number_cards()
	make_chart()
	make_workspace()
	set_staff_home_page()
	apply_workspace_visibility()


def upsert(doctype, name, values):
	doc = frappe.get_doc(doctype, name) if frappe.db.exists(doctype, name) else frappe.new_doc(doctype)
	doc.update(values)
	doc.flags.ignore_permissions = True
	doc.save()
	return doc


def make_number_cards():
	for label, (doctype, function, field, filters, color) in NUMBER_CARDS.items():
		if not frappe.db.exists("DocType", doctype):
			continue
		# filters_json rows carry a trailing "hidden" flag in list view format
		rows = [[*row, False] for row in filters]
		upsert(
			"Number Card",
			label,
			{
				"label": label,
				"type": "Document Type",
				"document_type": doctype,
				"function": function,
				"aggregate_function_based_on": field,
				"filters_json": json.dumps(rows),
				"is_public": 1,
				"show_percentage_stats": 1,
				"stats_time_interval": "Monthly" if "Month" in label else "Daily",
				"color": color,
				"module": MODULE,
			},
		)


def make_chart():
	upsert("Dashboard Chart", CHART["chart_name"], CHART)


def block(kind, data):
	return {"id": frappe.generate_hash(length=10), "type": kind, "data": data}


def header(text):
	return block("header", {"text": f'<span class="h4"><b>{text}</b></span>', "col": 12})


def make_workspace():
	content = [header("Today")]
	content += [block("number_card", {"number_card_name": label, "col": 3}) for label in NUMBER_CARDS]
	content += [
		header("Orders, last 30 days"),
		block("chart", {"chart_name": CHART["chart_name"], "col": 12}),
	]
	content += [header("Quick access")]
	content += [block("shortcut", {"shortcut_name": label, "col": 3}) for label in SHORTCUTS]
	content += [header("Everything else")]
	content += [block("card", {"card_name": title, "col": 4}) for title in CARDS]

	shortcuts = []
	for label, (kind, link_to, doc_view, stats_filter, icon) in SHORTCUTS.items():
		if kind == "DocType" and not frappe.db.exists("DocType", link_to):
			continue
		shortcuts.append(
			{
				"label": label,
				"type": kind,
				"link_to": link_to if kind == "DocType" else None,
				"url": link_to if kind == "URL" else None,
				"doc_view": doc_view,
				"stats_filter": json.dumps(stats_filter) if stats_filter else None,
				"format": "{} open"
				if label in ("Orders", "Invoices")
				else "{} pending"
				if label == "Reviews"
				else None,
				"color": "Green" if label == "Open Storefront" else "Grey",
				"icon": icon,
			}
		)

	links = []
	for title, rows in CARDS.items():
		rows = [row for row in rows if frappe.db.exists(row[2], row[1])]
		links.append({"type": "Card Break", "label": title, "link_count": len(rows)})
		links += [
			{
				"type": "Link",
				"label": label,
				"link_to": link_to,
				"link_type": link_type,
				"is_query_report": 1 if link_type == "Report" else 0,
				"onboard": 0,
			}
			for label, link_to, link_type in rows
		]

	upsert(
		"Workspace",
		WORKSPACE,
		{
			"label": WORKSPACE,
			"title": WORKSPACE,
			"module": MODULE,
			"icon": "sell",
			"public": 1,
			"is_hidden": 0,
			"sequence_id": 0.5,
			"content": json.dumps(content),
			"shortcuts": shortcuts,
			"links": links,
			"number_cards": [{"number_card_name": label, "label": label} for label in NUMBER_CARDS],
			"charts": [{"chart_name": CHART["chart_name"], "label": CHART["chart_name"]}],
		},
	)


def set_staff_home_page():
	"""Land staff on the Store dashboard after login.

	Frappe 16 sends system users to the website home page (the storefront) unless their role
	has a home page; Frappe 15 opens Desk, where Store is the first workspace. Shoppers
	(Website Users with the Customer role) keep landing on the storefront."""
	desk = "desk" if int(frappe.__version__.split(".")[0]) >= 16 else "app"
	frappe.db.set_value(
		"Role", "System Manager", "home_page", f"{desk}/{WORKSPACE.lower()}", update_modified=False
	)


def apply_workspace_visibility():
	"""Hide the other public workspaces when Storefront Settings asks for a simplified desk."""
	hide = bool(frappe.db.get_single_value("Storefront Settings", "simplified_desk"))
	others = frappe.get_all(
		"Workspace", filters={"public": 1, "module": ("!=", MODULE)}, fields=["name", "is_hidden"]
	)
	for workspace in others:
		if bool(workspace.is_hidden) != hide:
			frappe.db.set_value("Workspace", workspace.name, "is_hidden", int(hide), update_modified=False)
	frappe.clear_cache()
