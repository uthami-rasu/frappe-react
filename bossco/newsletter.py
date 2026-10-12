"""Newsletter sign-up for the storefront.

Frappe 15 ships a Newsletter module with double opt-in; Frappe 16 removed it from core but kept
Email Group / Email Group Member. This endpoint uses whichever is available, so the storefront's
form works on both: with double opt-in on 15, and a direct (confirmed) subscription on 16.
"""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import cstr, validate_email_address

EMAIL_GROUP = "Storefront Subscribers"


def core_newsletter():
	try:
		from frappe.email.doctype.newsletter import newsletter
	except ImportError:
		return None
	return newsletter


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=10, seconds=60 * 60)
def subscribe(email):
	email = cstr(email).strip().lower()
	validate_email_address(email, throw=True)

	newsletter = core_newsletter()
	if newsletter:
		newsletter.subscribe(email, get_email_group())
		return {
			"confirmed": False,
			"message": _("Almost there! Check {0} and confirm your subscription.").format(email),
		}

	group = get_email_group()
	member = frappe.db.get_value(
		"Email Group Member", {"email": email, "email_group": group}, ["name", "unsubscribed"], as_dict=True
	)
	if member and member.unsubscribed:
		frappe.db.set_value("Email Group Member", member.name, "unsubscribed", 0)
	elif not member:
		frappe.get_doc({"doctype": "Email Group Member", "email": email, "email_group": group}).insert(
			ignore_permissions=True
		)
	return {"confirmed": True, "message": _("You're subscribed. Welcome to the wholesome side!")}


def get_email_group():
	"""The storefront's own Email Group, created on first use."""
	if not frappe.db.exists("Email Group", EMAIL_GROUP):
		frappe.get_doc({"doctype": "Email Group", "title": EMAIL_GROUP}).insert(ignore_permissions=True)
	return EMAIL_GROUP
