"""Storefront promotions.

A Storefront Offer says what to show, where, to whom and when. The discount itself is ERPNext's:
an optional Coupon Code and its Pricing Rule hold the discount, minimum order value, validity and
total uses. ERPNext applies the Pricing Rule to the Sales Order, so checkout and the cart quote
(`api.get_cart_quote`) always charge what ERPNext calculates, never what the browser shows.
"""

import frappe
from frappe import _
from frappe.utils import cint, cstr, flt, fmt_money, get_datetime, getdate, now_datetime, today

from bossco.customers import get_customer_for_user
from bossco.storefront import get_group_with_descendants

AUDIENCES = ("Everyone", "Guests", "Signed-in Customers", "New Customers")


class CouponError(frappe.ValidationError):
	pass


@frappe.whitelist(allow_guest=True)
def get_active_offers():
	"""Offers the current shopper may see right now, highest priority first."""
	user = frappe.session.user
	customer = None if user == "Guest" else get_customer_for_user(user)[0]
	now = now_datetime()

	offers = frappe.get_all(
		"Storefront Offer",
		filters={"enabled": 1},
		fields=[
			"name",
			"title",
			"description",
			"image",
			"placement",
			"priority",
			"audience",
			"valid_from",
			"valid_upto",
			"cta_label",
			"cta_link",
			"coupon_code",
			"item_group",
			"item_code",
			"popup_frequency",
			"popup_delay",
		],
		order_by="priority desc, modified desc",
	)

	result = []
	for offer in offers:
		if offer.valid_from and get_datetime(offer.valid_from) > now:
			continue
		if offer.valid_upto and get_datetime(offer.valid_upto) < now:
			continue
		if not audience_matches(offer.audience, user, customer):
			continue

		coupon = get_coupon_summary(offer.coupon_code) if offer.coupon_code else None
		if offer.coupon_code and not coupon:
			continue  # expired, used up, disabled or misconfigured

		expires = [str(offer.valid_upto)] if offer.valid_upto else []
		if coupon and coupon["expiresOn"]:
			expires.append(f"{coupon['expiresOn']} 23:59:59")

		result.append(
			{
				"id": offer.name,
				"title": offer.title,
				"description": offer.description or "",
				"image": offer.image or "",
				"placement": offer.placement,
				"priority": cint(offer.priority),
				"ctaLabel": offer.cta_label or _("Shop now"),
				"ctaLink": offer.cta_link or default_link(offer),
				"couponCode": coupon["code"] if coupon else None,
				"discount": coupon["discount"] if coupon else None,
				"minOrder": coupon["minOrder"] if coupon else 0,
				"remainingUses": coupon["remainingUses"] if coupon else None,
				"expiresAt": min(expires) if expires else None,
				"itemCode": offer.item_code,
				"itemGroups": get_group_with_descendants(offer.item_group) if offer.item_group else [],
				"popupFrequency": offer.popup_frequency or "Once per day",
				"popupDelay": cint(offer.popup_delay),
			}
		)
	return result


def default_link(offer):
	if offer.item_code:
		slug = frappe.db.get_value("Item", offer.item_code, "bossco_slug")
		if slug:
			return f"#product/{slug}"
	if offer.item_group:
		return f"#honey?category={offer.item_group}"
	return "#honey"


def audience_matches(audience, user, customer):
	if audience == "Guests":
		return user == "Guest"
	if audience == "Signed-in Customers":
		return user != "Guest"
	if audience == "New Customers":
		return user != "Guest" and not has_orders(customer)
	return True


def has_orders(customer):
	return bool(customer) and frappe.db.exists("Sales Order", {"customer": customer, "docstatus": 1})


# Coupons


def get_coupon_summary(coupon_name):
	"""Public description of a usable coupon, or None if it can't be used right now."""
	try:
		coupon, rule = get_usable_coupon(coupon_name)
	except CouponError:
		return None
	return {
		"code": coupon.coupon_code,
		"discount": describe_pricing_rule(rule),
		"minOrder": flt(rule.min_amt),
		"expiresOn": str(min(filter(None, [coupon.valid_upto, rule.valid_upto]), default="")) or None,
		"remainingUses": cint(coupon.maximum_use) - cint(coupon.used),
	}


def resolve_coupon(code):
	"""Coupon Code document name for what the shopper typed (case-insensitive)."""
	code = cstr(code).strip()
	if not code:
		return None
	name = frappe.db.get_value("Coupon Code", {"coupon_code": code}, "name") or frappe.db.get_value(
		"Coupon Code", {"name": code}, "name"
	)
	if not name:
		raise CouponError(_("{0} is not a valid coupon code").format(code))
	return name


def get_usable_coupon(coupon_name):
	"""(coupon, pricing rule) if the coupon can be redeemed today; raises CouponError otherwise."""
	coupon = frappe.db.get_value(
		"Coupon Code",
		coupon_name,
		[
			"name",
			"coupon_code",
			"pricing_rule",
			"valid_from",
			"valid_upto",
			"maximum_use",
			"used",
			"customer",
		],
		as_dict=True,
	)
	if not coupon:
		raise CouponError(_("This coupon code is not valid"))

	current = getdate(today())
	if coupon.valid_from and getdate(coupon.valid_from) > current:
		raise CouponError(_("Coupon {0} isn't active yet").format(coupon.coupon_code))
	if coupon.valid_upto and getdate(coupon.valid_upto) < current:
		raise CouponError(_("Coupon {0} has expired").format(coupon.coupon_code))
	if not cint(coupon.maximum_use):
		# ERPNext refuses to submit an order with a coupon whose Maximum Use is 0
		frappe.log_error(
			title="Storefront coupon misconfigured",
			message=f"Coupon Code {coupon.name} needs a Maximum Use greater than 0 to be redeemed.",
		)
		raise CouponError(_("Coupon {0} can't be used right now").format(coupon.coupon_code))
	if cint(coupon.used) >= cint(coupon.maximum_use):
		raise CouponError(_("Coupon {0} has been fully redeemed").format(coupon.coupon_code))

	rule = frappe.db.get_value(
		"Pricing Rule",
		coupon.pricing_rule,
		[
			"name",
			"disable",
			"selling",
			"coupon_code_based",
			"valid_from",
			"valid_upto",
			"min_amt",
			"rate_or_discount",
			"discount_percentage",
			"discount_amount",
			"rate",
			"price_or_product_discount",
			"apply_on",
		],
		as_dict=True,
	)
	if not rule or rule.disable or not rule.selling:
		raise CouponError(_("Coupon {0} can't be used right now").format(coupon.coupon_code))
	if rule.valid_from and getdate(rule.valid_from) > current:
		raise CouponError(_("Coupon {0} isn't active yet").format(coupon.coupon_code))
	if rule.valid_upto and getdate(rule.valid_upto) < current:
		raise CouponError(_("Coupon {0} has expired").format(coupon.coupon_code))
	return coupon, rule


def validate_coupon_for_customer(coupon_name, customer, user):
	"""Rules that depend on who is ordering. `customer` may be None for a guest's first order."""
	coupon, rule = get_usable_coupon(coupon_name)

	if coupon.customer and coupon.customer != customer:
		raise CouponError(_("Coupon {0} belongs to another customer").format(coupon.coupon_code))

	offers = frappe.get_all(
		"Storefront Offer",
		filters={"coupon_code": coupon.name, "enabled": 1},
		fields=["audience", "max_uses_per_customer"],
	)
	audiences = {offer.audience for offer in offers}
	if "Everyone" not in audiences and audiences:
		if audiences <= {"Signed-in Customers", "New Customers"} and user == "Guest":
			raise CouponError(_("Sign in to use coupon {0}").format(coupon.coupon_code))
		if audiences == {"New Customers"} and has_orders(customer):
			raise CouponError(_("Coupon {0} is for your first order").format(coupon.coupon_code))

	limits = [cint(offer.max_uses_per_customer) for offer in offers if cint(offer.max_uses_per_customer)]
	if limits and customer:
		used = frappe.db.count(
			"Sales Order", {"customer": customer, "coupon_code": coupon.name, "docstatus": 1}
		)
		if used >= min(limits):
			raise CouponError(_("You have already used coupon {0}").format(coupon.coupon_code))
	return coupon, rule


def describe_pricing_rule(rule, currency="INR"):
	if rule.price_or_product_discount == "Product":
		return _("Free gift")
	if rule.rate_or_discount == "Discount Percentage":
		return _("{0}% off").format(f"{flt(rule.discount_percentage, 2):g}")
	if rule.rate_or_discount == "Discount Amount":
		return _("{0} off").format(fmt_money(rule.discount_amount, 0, currency))
	if rule.rate_or_discount == "Rate":
		return _("Special price {0}").format(fmt_money(rule.rate, 0, currency))
	return _("Special offer")
