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


def _chart(name, **fields):
	base = {"chart_name": name, "is_public": 1, "module": MODULE, "color": "#173f32"}
	return {**base, **fields}


SUBMITTED = json.dumps([["Sales Order", "docstatus", "=", 1]])
SUBMITTED_LINES = json.dumps([["Sales Order Item", "docstatus", "=", 1]])

# Dashboard Charts, all computed live from ERPNext documents
CHARTS = [
	_chart(
		"Storefront Orders",
		chart_type="Count",
		document_type="Sales Order",
		based_on="transaction_date",
		timespan="Last Quarter",
		time_interval="Weekly",
		type="Line",
		filters_json=SUBMITTED,
	),
	_chart(
		"Revenue by Month",
		chart_type="Sum",
		document_type="Sales Order",
		based_on="transaction_date",
		value_based_on="grand_total",
		timespan="Last Year",
		time_interval="Monthly",
		type="Bar",
		color="#2f7a4a",
		filters_json=SUBMITTED,
	),
	_chart(
		"Sales by Category",
		chart_type="Group By",
		document_type="Sales Order Item",
		parent_document_type="Sales Order",
		group_by_type="Sum",
		group_by_based_on="item_group",
		aggregate_function_based_on="amount",
		number_of_groups=8,
		type="Donut",
		color="#d9a441",
		filters_json=SUBMITTED_LINES,
	),
	_chart(
		"Orders by Payment Method",
		chart_type="Group By",
		document_type="Sales Order",
		group_by_type="Count",
		group_by_based_on="bossco_payment_method",
		number_of_groups=5,
		type="Pie",
		color="#173f32",
		filters_json=SUBMITTED,
	),
	_chart(
		"Order Status",
		chart_type="Group By",
		document_type="Sales Order",
		group_by_type="Count",
		group_by_based_on="status",
		number_of_groups=6,
		type="Percentage",
		color="#2f7a4a",
		filters_json=SUBMITTED,
	),
	_chart(
		"Top Products",
		chart_type="Group By",
		document_type="Sales Order Item",
		parent_document_type="Sales Order",
		group_by_type="Sum",
		group_by_based_on="item_name",
		aggregate_function_based_on="qty",
		number_of_groups=10,
		type="Bar",
		color="#a35c00",
		filters_json=SUBMITTED_LINES,
	),
	_chart(
		"New Customers",
		chart_type="Count",
		document_type="Customer",
		based_on="creation",
		timespan="Last Quarter",
		time_interval="Weekly",
		type="Line",
		color="#2f6fdb",
		filters_json=json.dumps([["Customer", "disabled", "=", 0]]),
	),
	_chart(
		"Review Ratings",
		chart_type="Group By",
		document_type="Storefront Review",
		group_by_type="Count",
		group_by_based_on="rating",
		number_of_groups=5,
		type="Bar",
		color="#e2a12b",
		filters_json=json.dumps([["Storefront Review", "status", "=", "Published"]]),
	),
]

# (chart name, width in columns), laid out row by row after the number cards
CHART_LAYOUT = [
	("Storefront Orders", 6),
	("New Customers", 6),
	("Revenue by Month", 12),
	("Sales by Category", 4),
	("Orders by Payment Method", 4),
	("Order Status", 4),
	("Top Products", 6),
	("Review Ratings", 6),
]

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


def has_app_permission():
	"""Who sees the Bossco Store tile on the apps screen: anyone who can work in Desk."""
	return frappe.session.user != "Guest" and "System Manager" in frappe.get_roles()


def setup_desk():
	make_number_cards()
	make_charts()
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


def make_charts():
	for chart in CHARTS:
		if not frappe.db.exists("DocType", chart["document_type"]):
			continue
		upsert("Dashboard Chart", chart["chart_name"], chart)
		# Frappe fills in the company currency for charts on Sales Order; counts and quantities
		# must not be shown as money
		counts = chart["chart_type"] == "Count" or chart.get("group_by_type") == "Count"
		if counts or chart.get("aggregate_function_based_on") == "qty":
			frappe.db.set_value(
				"Dashboard Chart", chart["chart_name"], "currency", None, update_modified=False
			)


def block(kind, data):
	return {"id": frappe.generate_hash(length=10), "type": kind, "data": data}


def header(text):
	return block("header", {"text": f'<span class="h4"><b>{text}</b></span>', "col": 12})


def make_workspace():
	content = [header("Today")]
	content += [block("number_card", {"number_card_name": label, "col": 3}) for label in NUMBER_CARDS]
	content += [header("Sales")]
	content += [block("chart", {"chart_name": name, "col": col}) for name, col in CHART_LAYOUT]
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
			"charts": [{"chart_name": name, "label": name} for name, _col in CHART_LAYOUT],
		},
	)


def set_staff_home_page():
	"""Nothing is stored on the role any more: a role home page would also make the website
	root open Desk for staff (hooks.on_login handles the landing page instead)."""
	frappe.db.set_value("Role", "System Manager", "home_page", None, update_modified=False)


def on_login(login_manager):
	"""Land staff on the Store dashboard after signing in; shoppers keep the storefront.

	Frappe 16 sends system users to get_home_page() (the storefront, via the home_page hook)
	unless a flag says otherwise; Frappe 15 opens Desk, where Store is the first workspace."""
	if frappe.db.get_value("User", login_manager.user, "user_type") == "System User":
		desk = "desk" if int(frappe.__version__.split(".")[0]) >= 16 else "app"
		frappe.local.flags.home_page = f"{desk}/{WORKSPACE.lower()}"


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
