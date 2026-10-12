"""Mock payment gateway. Swap mock_charge() for a real gateway (Razorpay, Stripe, ...) later.

Test values: card 4000 0000 0000 0002 or UPI ID fail@upi are declined; anything else well-formed succeeds.
"""

import re
from contextlib import contextmanager

import frappe
from frappe import _
from frappe.utils import cstr, getdate, today

PAYMENT_METHODS = {"cod": "Cash on delivery", "card": "Card (mock)", "upi": "UPI (mock)"}
MODE_OF_PAYMENT = {"card": "Credit Card", "upi": "UPI"}
DECLINED_CARD = "4000000000000002"
DECLINED_UPI = "fail@upi"


def parse_payment(payment):
	"""Validate the payment details sent by checkout. Never stores card data."""
	payment = frappe._dict(frappe.parse_json(payment) or {"method": "cod"})
	if payment.method not in PAYMENT_METHODS:
		frappe.throw(_("Choose a payment method"))

	if payment.method == "card":
		payment.card_number = re.sub(r"\D", "", cstr(payment.card_number))
		if not 12 <= len(payment.card_number) <= 19:
			frappe.throw(_("Enter a valid card number"))
		if not re.fullmatch(r"(0[1-9]|1[0-2])/\d{2}", cstr(payment.expiry).strip()):
			frappe.throw(_("Enter the card expiry as MM/YY"))
		month, year = cstr(payment.expiry).strip().split("/")
		if (2000 + int(year), int(month)) < (getdate(today()).year, getdate(today()).month):
			frappe.throw(_("This card has expired"))
		if not re.fullmatch(r"\d{3,4}", cstr(payment.cvc)):
			frappe.throw(_("Enter a valid CVC"))
	elif payment.method == "upi":
		payment.upi_id = cstr(payment.upi_id).strip().lower()
		if not re.fullmatch(r"[\w.\-]{2,}@[a-z]{2,}", payment.upi_id):
			frappe.throw(_("Enter a valid UPI ID, e.g. name@bank"))
	return payment


def mock_charge(payment, amount):
	"""Pretend to charge the customer. Returns the gateway transaction reference."""
	if payment.method == "card" and payment.card_number == DECLINED_CARD:
		frappe.throw(_("Your card was declined (mock gateway). Try another card."), title=_("Payment failed"))
	if payment.method == "upi" and payment.upi_id == DECLINED_UPI:
		frappe.throw(_("UPI payment was declined (mock gateway)."), title=_("Payment failed"))
	return f"MOCK-{payment.method.upper()}-{frappe.generate_hash(length=10).upper()}"


def record_payment(sales_order, payment, reference):
	"""Submit a Payment Entry against the (submitted) Sales Order as an advance."""
	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	mode_of_payment = MODE_OF_PAYMENT[payment.method]
	account = frappe.db.get_value(
		"Mode of Payment Account",
		{"parent": mode_of_payment, "company": sales_order.company},
		"default_account",
	)
	if not account:
		frappe.throw(
			_("Set a default account for Mode of Payment {0} in company {1}").format(
				mode_of_payment, sales_order.company
			)
		)

	# ERPNext's payment helpers check Account/Payment Entry permissions meant for Desk users
	with system_user():
		payment_entry = get_payment_entry("Sales Order", sales_order.name, bank_account=account)
		payment_entry.mode_of_payment = mode_of_payment
		payment_entry.reference_no = reference
		payment_entry.reference_date = today()
		payment_entry.remarks = f"Storefront payment via mock gateway, transaction {reference}"
		payment_entry.insert()
		payment_entry.submit()
	return payment_entry.name


@contextmanager
def system_user():
	"""Act as Administrator for a block without frappe.set_user(), which would wipe the
	shopper's HTTP session; only the in-memory user and permission cache are swapped."""
	session, user_perms = frappe.local.session, frappe.local.user_perms
	frappe.local.session = frappe._dict(session, user="Administrator")
	frappe.local.user_perms = None
	try:
		yield
	finally:
		frappe.local.session, frappe.local.user_perms = session, user_perms
