"""Set up the outgoing Email Account the storefront sends from.

The SMTP password is read from the BOSSCO_SMTP_PASSWORD environment variable and stored by
Frappe in its encrypted Password field. It is never written to a file or to git.

    BOSSCO_SMTP_PASSWORD='<gmail app password>' \\
        bench --site <site> execute bossco.email_setup.setup_outgoing_email \\
        --kwargs "{'email_id': 'therazz007@gmail.com', 'sender_name': 'Bossco'}"

Gmail needs 2-Step Verification on the account and an App Password (Google Account → Security →
App passwords). Port 587 uses STARTTLS. Desk alternative: Email Account → New, Service "GMail".
"""

import os

import frappe
from frappe import _

GMAIL_SMTP = {"smtp_server": "smtp.gmail.com", "smtp_port": "587", "use_tls": 1, "use_ssl_for_outgoing": 0}


def setup_outgoing_email(email_id, sender_name=None, password_env="BOSSCO_SMTP_PASSWORD"):
	password = (os.environ.get(password_env) or "").replace(" ", "")
	if not password:
		frappe.throw(_("Set the {0} environment variable to the SMTP (app) password").format(password_env))

	name = frappe.db.get_value("Email Account", {"email_id": email_id})
	account = frappe.get_doc("Email Account", name) if name else frappe.new_doc("Email Account")
	account.update(
		{
			"email_id": email_id,
			"email_account_name": sender_name or account.email_account_name or email_id,
			"service": "GMail" if email_id.endswith("@gmail.com") else account.service,
			"auth_method": "Basic",
			"enable_incoming": 0,
			"enable_outgoing": 1,
			"default_outgoing": 1,
			"login_id_is_different": 0,
			"password": password,
			"awaiting_password": 0,
			"always_use_account_email_id_as_sender": 1,
			"always_use_account_name_as_sender_name": 1,
			"no_smtp_authentication": 0,
			**(GMAIL_SMTP if email_id.endswith("@gmail.com") else {}),
		}
	)
	account.flags.ignore_permissions = True
	account.save()  # Frappe logs in to the SMTP server here and fails on a wrong password
	frappe.db.commit()
	print(f"Outgoing email account {account.name!r} saved and set as default.")
	return account.name


def send_test_email(recipient):
	"""bench --site <site> execute bossco.email_setup.send_test_email --args "['you@example.com']" """
	frappe.sendmail(
		recipients=[recipient],
		subject=_("Storefront email test"),
		message=_("Outgoing email from the storefront is working."),
		now=True,
	)
	print(f"Test email sent to {recipient}")
