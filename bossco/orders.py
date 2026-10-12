"""What happens after a storefront order: confirmation email, Sales Invoice and invoice email.

Everything here runs in background jobs queued after the order commits, and is safe to run
again: an order gets at most one confirmation, one invoice and one invoice email, and a failed
email never affects the order or the invoice (the error is logged and Email Queue retries it).

Order confirmation, payment, invoice creation and invoice delivery stay separate steps:
- prepaid (card / UPI) orders are invoiced once the payment is recorded, with the payment allocated;
- cash on delivery orders are invoiced from the Delivery Note when the order ships.
Both can be turned off in Storefront Settings, e.g. when invoices are made by hand in Desk.
"""

import frappe
from frappe import _
from frappe.utils import flt, get_url

from bossco.payments import system_user


def is_storefront_order(sales_order):
	"""Orders placed through the storefront carry a payment method."""
	return bool(frappe.db.get_value("Sales Order", sales_order, "bossco_payment_method"))


def get_settings():
	return frappe.get_cached_doc("Storefront Settings")


# Jobs


def after_order_placed(sales_order):
	send_order_confirmation(sales_order)
	settings = get_settings()
	if (
		settings.invoice_paid_orders
		and flt(frappe.db.get_value("Sales Order", sales_order, "advance_paid")) > 0
	):
		make_invoice_for_order(sales_order)


def make_invoice_for_order(sales_order):
	"""Submitted Sales Invoice for a prepaid order, created at most once. Returns its name."""
	from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice

	# serialise concurrent runs (job retries, Desk) on the order row
	frappe.db.get_value("Sales Order", sales_order, "name", for_update=True)
	if existing := get_order_invoices(sales_order):
		return existing[0]

	with system_user():
		invoice = make_sales_invoice(sales_order)
		invoice.allocate_advances_automatically = 1
		invoice.flags.ignore_permissions = True
		invoice.insert()
		invoice.submit()
	return invoice.name


def make_invoice_for_delivery(delivery_note):
	"""Cash on delivery: invoice what was shipped, unless the order is already billed."""
	from erpnext.stock.doctype.delivery_note.delivery_note import make_sales_invoice

	orders = get_storefront_orders_of_delivery(delivery_note)
	if not orders:
		return None
	for order in orders:
		frappe.db.get_value("Sales Order", order, "name", for_update=True)
	if frappe.db.exists("Sales Invoice Item", {"delivery_note": delivery_note, "docstatus": ("<", 2)}):
		return None
	if all(flt(frappe.db.get_value("Sales Order", order, "per_billed")) >= 100 for order in orders):
		return None

	with system_user():
		invoice = make_sales_invoice(delivery_note)
		if not invoice.items:
			return None
		invoice.allocate_advances_automatically = 1
		invoice.flags.ignore_permissions = True
		invoice.insert()
		invoice.submit()
	return invoice.name


def email_invoice(sales_invoice):
	"""Email the invoice PDF to the customer once."""
	invoice = frappe.db.get_value(
		"Sales Invoice",
		sales_invoice,
		[
			"name",
			"docstatus",
			"customer",
			"contact_email",
			"grand_total",
			"rounded_total",
			"currency",
			"bossco_invoice_emailed",
		],
		as_dict=True,
	)
	if not invoice or invoice.docstatus != 1 or invoice.bossco_invoice_emailed:
		return
	orders = get_invoice_orders(sales_invoice)
	recipient = invoice.contact_email or (
		orders and get_order_email(frappe.get_doc("Sales Order", orders[0]))
	)
	if not recipient:
		return

	settings = get_settings()
	print_format = settings.invoice_print_format or None
	context = {
		"invoice": invoice,
		"order": orders[0] if orders else None,
		"store_name": settings.store_name,
		"total": frappe.utils.fmt_money(
			invoice.rounded_total or invoice.grand_total, currency=invoice.currency
		),
		"orders_url": get_url("/#account/orders"),
	}
	sent = send_template(
		"Storefront Invoice",
		recipient,
		context,
		reference=("Sales Invoice", sales_invoice),
		attachments=[
			frappe.attach_print(
				"Sales Invoice", sales_invoice, file_name=sales_invoice, print_format=print_format
			)
		],
	)
	if sent:
		frappe.db.set_value(
			"Sales Invoice", sales_invoice, "bossco_invoice_emailed", 1, update_modified=False
		)


def send_order_confirmation(sales_order):
	order = frappe.get_doc("Sales Order", sales_order)
	if order.bossco_confirmation_sent or not get_settings().send_order_confirmation:
		return
	if send_order_template("Storefront Order Confirmation", order):
		order.db_set("bossco_confirmation_sent", 1, update_modified=False)


def send_order_update(sales_order, status):
	if not get_settings().send_order_updates:
		return
	order = frappe.get_doc("Sales Order", sales_order)
	send_order_template("Storefront Order Update", order, status=status)


def get_order_email(order):
	"""Who to email about an order; orders placed before checkout stored it fall back to the Contact."""
	return order.contact_email or (
		order.contact_person and frappe.db.get_value("Contact", order.contact_person, "email_id")
	)


def send_order_template(template, order, **extra):
	recipient = get_order_email(order)
	if not recipient:
		return False
	address = order.shipping_address_name and frappe.db.get_value(
		"Address",
		order.shipping_address_name,
		["address_line1", "address_line2", "city", "state", "pincode", "country"],
		as_dict=True,
	)
	context = {
		"doc": order,
		"store_name": get_settings().store_name,
		"customer_name": order.customer_name,
		"items": [
			{
				"item_name": item.item_name,
				"qty": flt(item.qty),
				"amount": frappe.utils.fmt_money(item.amount, currency=order.currency),
			}
			for item in order.items
		],
		"total": frappe.utils.fmt_money(order.rounded_total or order.grand_total, currency=order.currency),
		"paid": flt(order.advance_paid) > 0,
		"address": ", ".join(filter(None, address.values())) if address else "",
		"orders_url": get_url("/#account/orders"),
		**extra,
	}
	return send_template(template, recipient, context, reference=("Sales Order", order.name))


def send_template(template, recipient, context, reference=None, attachments=None, now=False):
	"""Render a Storefront Email Template and queue it. Returns False (and logs) on failure."""
	try:
		email_template = frappe.get_cached_doc("Email Template", template)
		subject = frappe.render_template(email_template.subject, context)
		message = frappe.render_template(email_template.response_html or email_template.response, context)
		frappe.sendmail(
			recipients=[recipient],
			subject=subject,
			message=message,
			attachments=attachments,
			reference_doctype=reference[0] if reference else None,
			reference_name=reference[1] if reference else None,
			now=now,
		)
		return True
	except Exception:
		frappe.log_error(
			title=f"Storefront email failed: {template}",
			reference_doctype=reference[0] if reference else None,
			reference_name=reference[1] if reference else None,
		)
		return False


# Document events (hooks.py)


def on_delivery_note_submit(doc, method=None):
	orders = get_storefront_orders_of_delivery(doc.name)
	if not orders:
		return
	if get_settings().invoice_on_delivery:
		frappe.enqueue(
			"bossco.orders.make_invoice_for_delivery",
			queue="short",
			delivery_note=doc.name,
			enqueue_after_commit=True,
		)
	for order in orders:
		frappe.enqueue(
			"bossco.orders.send_order_update",
			queue="short",
			sales_order=order,
			status=_("Shipped"),
			enqueue_after_commit=True,
		)


def on_sales_order_cancel(doc, method=None):
	if doc.bossco_payment_method:
		frappe.enqueue(
			"bossco.orders.send_order_update",
			queue="short",
			sales_order=doc.name,
			status=_("Cancelled"),
			enqueue_after_commit=True,
		)


def on_sales_invoice_submit(doc, method=None):
	if not get_settings().send_invoice_email or doc.is_return:
		return
	if any(is_storefront_order(order) for order in get_invoice_orders(doc.name)):
		frappe.enqueue(
			"bossco.orders.email_invoice", queue="short", sales_invoice=doc.name, enqueue_after_commit=True
		)


# Lookups


def get_order_invoices(sales_order):
	return frappe.get_all(
		"Sales Invoice Item",
		filters={"sales_order": sales_order, "docstatus": 1},
		pluck="parent",
		distinct=True,
	)


def get_invoice_orders(sales_invoice):
	return frappe.get_all(
		"Sales Invoice Item",
		filters={"parent": sales_invoice, "sales_order": ("is", "set")},
		pluck="sales_order",
		distinct=True,
	)


def get_storefront_orders_of_delivery(delivery_note):
	orders = frappe.get_all(
		"Delivery Note Item",
		filters={"parent": delivery_note, "against_sales_order": ("is", "set")},
		pluck="against_sales_order",
		distinct=True,
	)
	return [order for order in orders if is_storefront_order(order)]


def get_invoices_by_order(orders):
	"""{sales order: [submitted invoice names]} for the order history page."""
	rows = frappe.get_all(
		"Sales Invoice Item",
		filters={"sales_order": ("in", orders or [""]), "docstatus": 1},
		fields=["sales_order", "parent"],
		distinct=True,
	)
	result = {}
	for row in rows:
		result.setdefault(row.sales_order, [])
		if row.parent not in result[row.sales_order]:
			result[row.sales_order].append(row.parent)
	return result
