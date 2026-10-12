"""Product reviews for the storefront (Storefront Review DocType).

- Anyone can read published reviews; writing needs a login.
- One review per shopper per product (unique index); submitting again edits it.
- `verified_purchase` is set here from the shopper's submitted Sales Orders, never by the browser.
  With "Only Customers Who Bought the Product Can Review It" ticked (default) others can't review.
- With moderation on, new and edited reviews wait as Pending until a Sales Manager publishes them.
- Item.bossco_rating / bossco_reviews are recalculated from published reviews on every change.
"""

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import cint, cstr

from bossco.customers import get_customer_for_user

REVIEW = "Storefront Review"
REVIEW_SORTS = {
	"newest": "creation desc",
	"highest": "rating desc, creation desc",
	"lowest": "rating asc, creation desc",
	"helpful": "helpful_count desc, creation desc",
}
MAX_PAGE_LENGTH = 50
MAX_TITLE_LENGTH = 120


@frappe.whitelist(allow_guest=True)
def get_reviews(item_code, sort="newest", start=0, limit=10, rating=None):
	"""Published reviews plus the rating summary and, when logged in, what the shopper may do."""
	item_code = cstr(item_code)
	filters = {"item_code": item_code, "status": "Published"}
	if cint(rating):
		filters["rating"] = cint(rating)

	limit = min(cint(limit) or 10, MAX_PAGE_LENGTH)
	rows = frappe.get_all(
		REVIEW,
		filters=filters,
		fields=[
			"name",
			"reviewer_name",
			"rating",
			"title",
			"comment",
			"verified_purchase",
			"helpful_count",
			"creation",
		],
		order_by=REVIEW_SORTS.get(sort, REVIEW_SORTS["newest"]),
		start=cint(start),
		limit=limit + 1,
	)
	voted = set()
	if frappe.session.user != "Guest" and rows:
		voted = set(
			frappe.get_all(
				"Storefront Review Vote",
				filters={"user": frappe.session.user, "review": ("in", [row.name for row in rows])},
				pluck="review",
			)
		)

	return {
		"summary": get_summary(item_code),
		"reviews": [
			{
				"id": row.name,
				"author": row.reviewer_name or _("Customer"),
				"rating": row.rating,
				"title": row.title or "",
				"comment": row.comment,
				"verifiedPurchase": bool(row.verified_purchase),
				"helpful": row.helpful_count,
				"votedHelpful": row.name in voted,
				"date": str(row.creation),
			}
			for row in rows[:limit]
		],
		"hasMore": len(rows) > limit,
		"viewer": get_viewer_state(item_code),
	}


def get_summary(item_code):
	counts = dict(
		frappe.db.sql(
			"""select rating, count(*) from `tabStorefront Review`
			where item_code = %s and status = 'Published' group by rating""",
			item_code,
		)
	)
	total = sum(counts.values())
	average = sum(rating * count for rating, count in counts.items()) / total if total else 0
	return {
		"average": round(average, 1),
		"total": total,
		"distribution": {str(star): counts.get(star, 0) for star in range(1, 6)},
	}


def get_viewer_state(item_code):
	user = frappe.session.user
	if user == "Guest":
		return {
			"loggedIn": False,
			"canReview": False,
			"verifiedPurchase": False,
			"myReview": None,
			"reason": None,
		}

	purchase = get_purchase(user, item_code)
	settings = frappe.get_cached_doc("Storefront Settings")
	can_review = bool(purchase) or not settings.require_verified_purchase
	mine = frappe.db.get_value(
		REVIEW,
		{"item_code": item_code, "user": user},
		["name", "rating", "title", "comment", "status"],
		as_dict=True,
	)
	return {
		"loggedIn": True,
		"canReview": can_review,
		"verifiedPurchase": bool(purchase),
		"reason": None if can_review else _("Only customers who bought this product can review it."),
		"myReview": dict(mine) if mine else None,
	}


def get_purchase(user, item_code):
	"""A submitted Sales Order of the shopper's Customer that includes the item, or None."""
	customer, _contact = get_customer_for_user(user)
	if not customer:
		return None
	rows = frappe.db.sql(
		"""select so.name from `tabSales Order` so
		join `tabSales Order Item` soi on soi.parent = so.name
		where so.customer = %s and so.docstatus = 1 and soi.item_code = %s
		order by so.transaction_date desc limit 1""",
		(customer, item_code),
	)
	return rows[0][0] if rows else None


@frappe.whitelist(methods=["POST"])
@rate_limit(limit=10, seconds=60 * 60)
def submit_review(item_code, rating, comment, title=None):
	user = frappe.session.user
	item_code = cstr(item_code)
	if not frappe.db.exists("Item", {"name": item_code, "bossco_show_in_store": 1, "disabled": 0}):
		frappe.throw(_("Product not found"), frappe.DoesNotExistError)

	comment = cstr(comment).strip()
	title = cstr(title).strip()
	if len(comment) < 10:
		frappe.throw(_("Please write at least a sentence (10 characters or more)"))
	if len(title) > MAX_TITLE_LENGTH:
		frappe.throw(_("Keep the title under {0} characters").format(MAX_TITLE_LENGTH))

	purchase = get_purchase(user, item_code)
	settings = frappe.get_cached_doc("Storefront Settings")
	if settings.require_verified_purchase and not purchase:
		frappe.throw(_("Only customers who bought this product can review it."), frappe.PermissionError)

	customer, _contact = get_customer_for_user(user)
	name = frappe.db.get_value(REVIEW, {"item_code": item_code, "user": user})
	review = frappe.get_doc(REVIEW, name) if name else frappe.new_doc(REVIEW)
	review.update(
		{
			"item_code": item_code,
			"user": user,
			"customer": customer,
			"reviewer_name": get_display_name(user),
			"rating": cint(rating),
			"title": title,
			"comment": comment,
			"verified_purchase": 1 if purchase else 0,
			"sales_order": purchase,
			# edits go back to moderation too
			"status": "Published" if settings.auto_publish_reviews else "Pending",
		}
	)
	review.flags.ignore_permissions = True
	review.save()
	return {
		"status": review.status,
		"message": _("Thanks! Your review is live.")
		if review.status == "Published"
		else _("Thanks! Your review will appear once it has been checked."),
	}


@frappe.whitelist(methods=["POST"])
@rate_limit(limit=60, seconds=60 * 60)
def vote_helpful(review, helpful=1):
	"""Mark (or unmark) a published review as helpful; one vote per shopper, not on your own."""
	user = frappe.session.user
	owner = frappe.db.get_value(REVIEW, {"name": review, "status": "Published"}, "user")
	if not owner:
		frappe.throw(_("Review not found"), frappe.DoesNotExistError)
	if owner == user:
		frappe.throw(_("You can't vote on your own review"))

	existing = frappe.db.get_value("Storefront Review Vote", {"review": review, "user": user})
	if cint(helpful) and not existing:
		frappe.get_doc({"doctype": "Storefront Review Vote", "review": review, "user": user}).insert(
			ignore_permissions=True
		)
	elif not cint(helpful) and existing:
		frappe.delete_doc("Storefront Review Vote", existing, ignore_permissions=True)
	return {
		"helpful": frappe.db.get_value(REVIEW, review, "helpful_count"),
		"votedHelpful": bool(cint(helpful)),
	}


def get_display_name(user):
	"""First name and last initial, e.g. "Priya R." — never the email address."""
	first, last = frappe.db.get_value("User", user, ["first_name", "last_name"]) or ("", "")
	first, last = cstr(first).strip() or _("Customer"), cstr(last).strip()
	return f"{first} {last[0]}." if last else first
