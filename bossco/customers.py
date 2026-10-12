"""Which ERPNext Customer a storefront shopper is.

Logged-in shoppers are Website Users; their Contact has `user` set and links to their Customer.
Guest checkouts get a Contact without a user, matched by email on later guest orders.
"""

import frappe
from frappe import _
from frappe.utils import cstr


def get_customer_for_user(user):
	"""Returns (customer, contact) for a user; either may be None."""
	contact = frappe.db.get_value("Contact", {"user": user}, "name")
	if not contact:
		return None, None
	return get_linked_customer(contact), contact


def get_linked_customer(contact):
	return frappe.db.get_value(
		"Dynamic Link",
		{"parenttype": "Contact", "parent": contact, "link_doctype": "Customer"},
		"link_name",
	)


def ensure_customer_for_user(user):
	"""Customer and Contact for a logged-in user, created on first need. Returns (customer, contact)."""
	customer, contact = get_customer_for_user(user)
	if customer:
		return customer, contact

	details = frappe.db.get_value(
		"User", user, ["first_name", "last_name", "full_name", "email", "mobile_no"], as_dict=True
	)
	customer = create_customer(details.full_name or user, portal_user=user)

	if contact:
		contact_doc = frappe.get_doc("Contact", contact)
		contact_doc.append("links", {"link_doctype": "Customer", "link_name": customer})
		contact_doc.save(ignore_permissions=True)
	else:
		contact = create_contact(
			customer,
			first_name=details.first_name or details.full_name or user,
			last_name=details.last_name,
			email=details.email or user,
			phone=details.mobile_no,
			user=user,
		)
	return customer, contact


def get_or_create_guest_customer(first_name, last_name, email, phone):
	"""Guest checkout: reuse the Customer of an earlier guest order with this email.

	Contacts that belong to a registered user are never matched, so a guest can't attach
	orders or addresses to someone's account by typing their email.
	"""
	contact = frappe.db.get_value("Contact", {"email_id": email, "user": ("is", "not set")}, "name")
	if contact:
		customer = get_linked_customer(contact)
		if customer:
			return customer, contact

	full_name = " ".join(filter(None, [first_name, last_name]))
	customer = create_customer(full_name)
	contact = create_contact(customer, first_name, last_name, email, phone)
	return customer, contact


def create_customer(customer_name, portal_user=None):
	customer = frappe.get_doc(
		{
			"doctype": "Customer",
			"customer_name": customer_name,
			"customer_type": "Individual",
			"customer_group": get_default("Customer Group", "customer_group", "Individual"),
			"territory": get_default("Territory", "territory", "India"),
		}
	)
	if portal_user:
		# lets the user see this Customer's documents in ERPNext's own portal pages too
		customer.append("portal_users", {"user": portal_user})
	return customer.insert(ignore_permissions=True).name


def create_contact(customer, first_name, last_name, email, phone, user=None):
	contact = frappe.get_doc(
		{
			"doctype": "Contact",
			"first_name": first_name,
			"last_name": cstr(last_name),
			"user": user,
			"email_ids": [{"email_id": email, "is_primary": 1}],
			"links": [{"link_doctype": "Customer", "link_name": customer}],
		}
	)
	if phone:
		contact.append("phone_nos", {"phone": phone, "is_primary_mobile_no": 1})
	return contact.insert(ignore_permissions=True).name


def get_customer_addresses(customer):
	return frappe.get_all(
		"Dynamic Link",
		filters={"parenttype": "Address", "link_doctype": "Customer", "link_name": customer},
		pluck="parent",
	)


def validate_address_owner(address, customer):
	if not customer or address not in get_customer_addresses(customer):
		frappe.throw(_("Address not found"), frappe.PermissionError)


def get_default(doctype, selling_settings_field, fallback):
	value = frappe.db.get_single_value("Selling Settings", selling_settings_field)
	if value and frappe.db.exists(doctype, value):
		return value
	if frappe.db.exists(doctype, fallback):
		return fallback
	return frappe.db.get_value(doctype, {"is_group": 0}, "name")
