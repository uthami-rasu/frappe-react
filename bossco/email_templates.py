"""Storefront Email Templates, created on install/migrate when missing.

They are normal Email Template records (Desk → Email Template), so wording and styling can be
changed there; existing templates are never overwritten. Context variables are listed per template.
"""

import frappe

WRAPPER = """<div style="background:#f6f2ea;padding:24px 12px;font-family:Helvetica,Arial,sans-serif;color:#1c2b24">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border-collapse:collapse">
<tr><td style="background:#173f32;padding:20px 28px;color:#f0d59f;font-size:20px;font-weight:bold;letter-spacing:.5px">{{ store_name }}</td></tr>
<tr><td style="padding:28px">{body}</td></tr>
<tr><td style="padding:16px 28px;background:#faf7f1;color:#7a7368;font-size:12px">You're receiving this because of activity on your {{ store_name }} account or order.</td></tr>
</table></div>"""

BUTTON = '<a href="{href}" style="display:inline-block;background:#173f32;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;font-size:14px">{label}</a>'

ORDER_TABLE = """<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;margin:16px 0">
{% for item in items %}<tr><td style="padding:8px 0;border-bottom:1px solid #eee">{{ item.item_name }} &times; {{ item.qty | int }}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">{{ item.amount }}</td></tr>{% endfor %}
<tr><td style="padding:12px 0;font-weight:bold">Total</td><td style="padding:12px 0;text-align:right;font-weight:bold">{{ total }}</td></tr>
</table>"""

TEMPLATES = {
	# doc (Sales Order), customer_name, items [{item_name, qty, amount}], total, paid, address, orders_url
	"Storefront Order Confirmation": {
		"subject": "Your {{ store_name }} order {{ doc.name }} is confirmed",
		"body": """<h2 style="margin:0 0 8px;font-size:22px">Thank you, {{ customer_name }}!</h2>
<p style="margin:0;color:#4f5b55">We've received order <b>{{ doc.name }}</b> and are packing it fresh.</p>"""
		+ ORDER_TABLE
		+ """<p style="font-size:14px;color:#4f5b55;margin:0 0 6px"><b>Payment:</b> {{ doc.bossco_payment_method }}{% if paid %} &middot; paid{% endif %}</p>
{% if address %}<p style="font-size:14px;color:#4f5b55;margin:0 0 20px"><b>Delivering to:</b> {{ address }}</p>{% endif %}"""
		+ BUTTON.format(href="{{ orders_url }}", label="Track your order"),
	},
	# doc (Sales Order), status, customer_name, items, total, orders_url
	"Storefront Order Update": {
		"subject": "Order {{ doc.name }}: {{ status }}",
		"body": """<h2 style="margin:0 0 8px;font-size:22px">Your order is {{ status | lower }}</h2>
<p style="margin:0 0 4px;color:#4f5b55">Hi {{ customer_name }}, order <b>{{ doc.name }}</b> is now <b>{{ status | lower }}</b>.</p>"""
		+ ORDER_TABLE
		+ BUTTON.format(href="{{ orders_url }}", label="View your orders"),
	},
	# invoice (name, customer, ...), order, total, due (amount payable, or None), attached, orders_url
	"Storefront Invoice": {
		"subject": "Invoice {{ invoice.name }} for your {{ store_name }} order",
		"body": """<h2 style="margin:0 0 8px;font-size:22px">Your invoice</h2>
<p style="margin:0 0 12px;color:#4f5b55">Invoice <b>{{ invoice.name }}</b>{% if order %} for order <b>{{ order }}</b>{% endif %}{% if attached %} is attached as a PDF{% endif %}. Total: <b>{{ total }}</b>.</p>
{% if due %}<p style="margin:0 0 12px;color:#4f5b55"><b>Amount payable on delivery: {{ due }}</b></p>{% else %}<p style="margin:0 0 12px;color:#4f5b55">Paid in full &mdash; thank you.</p>{% endif %}
<p style="margin:0 0 20px;color:#4f5b55">You can download the invoice any time from your order history.</p>"""
		+ BUTTON.format(href="{{ orders_url }}", label="Order history"),
	},
	# first_name, link, expires_in
	"Storefront Password Reset": {
		"subject": "Reset your {{ store_name }} password",
		"body": """<h2 style="margin:0 0 8px;font-size:22px">Reset your password</h2>
<p style="margin:0 0 20px;color:#4f5b55">Hi {{ first_name or "there" }}, we received a request to reset your password. Use the button below to choose a new one{% if expires_in %}; the link works for {{ expires_in }}{% endif %}.</p>"""
		+ BUTTON.format(href="{{ link }}", label="Choose a new password")
		+ """<p style="margin:20px 0 0;font-size:12px;color:#7a7368">If you didn't ask for this, you can ignore this email — your password won't change.</p>""",
	},
	# first_name, shop_url
	"Storefront Welcome": {
		"subject": "Welcome to {{ store_name }}",
		"body": """<h2 style="margin:0 0 8px;font-size:22px">Welcome, {{ first_name or "friend" }}!</h2>
<p style="margin:0 0 20px;color:#4f5b55">Your account is ready. Save favourites to your wishlist, keep addresses for faster checkout and follow every order from your account page.</p>"""
		+ BUTTON.format(href="{{ shop_url }}", label="Start shopping"),
	},
}


def make_email_templates():
	for name, template in TEMPLATES.items():
		if frappe.db.exists("Email Template", name):
			continue
		frappe.get_doc(
			{
				"doctype": "Email Template",
				"name": name,
				"subject": template["subject"],
				"use_html": 1,
				"response_html": WRAPPER.replace("{body}", template["body"]),
			}
		).insert(ignore_permissions=True)


def reset_email_templates():
	"""Overwrite the Storefront templates with the shipped versions (discards Desk edits).

	bench --site <site> execute bossco.email_templates.reset_email_templates
	"""
	for name in TEMPLATES:
		if frappe.db.exists("Email Template", name):
			frappe.delete_doc("Email Template", name, ignore_permissions=True, force=True)
	make_email_templates()
	frappe.db.commit()
