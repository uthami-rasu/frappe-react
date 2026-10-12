import frappe

no_cache = 1


def get_context(context):
	# shop.html is the Vite build output (frontend/index.html); it reads this token for POST requests.
	context.csrf_token = frappe.sessions.get_csrf_token()
	frappe.db.commit()
