app_name = "bossco"
app_title = "Bossco"
app_publisher = "Uthami Rasu"
app_description = "Bossco storefront: React SPA on Frappe/ERPNext"
app_email = "uthami@dev.io"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Shown as "Bossco Store" on the Desk apps screen; opens the Store dashboard (bossco/desk.py)
add_to_apps_screen = [
	{
		"name": "bossco",
		"logo": "/assets/bossco/images/store-logo.png",
		"title": "Bossco Store",
		"route": "/app/store",
		"has_permission": "bossco.desk.has_app_permission",
	}
]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/bossco/css/bossco.css"
# app_include_js = "/assets/bossco/js/bossco.js"

# include js, css files in header of web template
# web_include_css = "/assets/bossco/css/bossco.css"
# web_include_js = "/assets/bossco/js/bossco.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "bossco/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "bossco/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# The React storefront is built into www/shop.html (see frontend/vite.config.ts)
home_page = "shop"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "bossco.utils.jinja_methods",
# 	"filters": "bossco.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "bossco.install.before_install"
after_install = "bossco.install.after_install"
after_migrate = "bossco.install.after_migrate"

# Uninstallation
# ------------

# before_uninstall = "bossco.uninstall.before_uninstall"
# after_uninstall = "bossco.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "bossco.utils.before_app_install"
# after_app_install = "bossco.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "bossco.utils.before_app_uninstall"
# after_app_uninstall = "bossco.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "bossco.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Item": {
		"validate": "bossco.storefront.set_store_slug",
	},
	# storefront order lifecycle: invoices and customer emails (see bossco/orders.py)
	"Delivery Note": {
		"on_submit": "bossco.orders.on_delivery_note_submit",
	},
	"Sales Order": {
		"on_cancel": "bossco.orders.on_sales_order_cancel",
	},
	"Sales Invoice": {
		"on_submit": "bossco.orders.on_sales_invoice_submit",
	},
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"bossco.tasks.all"
# 	],
# 	"daily": [
# 		"bossco.tasks.daily"
# 	],
# 	"hourly": [
# 		"bossco.tasks.hourly"
# 	],
# 	"weekly": [
# 		"bossco.tasks.weekly"
# 	],
# 	"monthly": [
# 		"bossco.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "bossco.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "bossco.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "bossco.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["bossco.utils.before_request"]
# after_request = ["bossco.utils.after_request"]

# Job Events
# ----------
# before_job = ["bossco.utils.before_job"]
# after_job = ["bossco.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"bossco.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }
