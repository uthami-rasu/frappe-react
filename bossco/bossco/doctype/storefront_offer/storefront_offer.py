# Copyright (c) 2026, Uthami Rasu and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_datetime

from bossco.offers import describe_pricing_rule


class StorefrontOffer(Document):
	def validate(self):
		if (
			self.valid_from
			and self.valid_upto
			and get_datetime(self.valid_upto) < get_datetime(self.valid_from)
		):
			frappe.throw(_("Show Until must be after Show From"))
		if self.cta_link and not self.cta_link.startswith(("#", "/")):
			frappe.throw(_("Button Link must be a storefront route starting with # (e.g. #honey)"))
		self.validate_coupon()

	def validate_coupon(self):
		self.discount_summary = None
		if not self.coupon_code:
			return

		coupon = frappe.db.get_value(
			"Coupon Code", self.coupon_code, ["pricing_rule", "maximum_use"], as_dict=True
		)
		if not cint(coupon.maximum_use):
			frappe.throw(
				_("Set Maximum Use on Coupon Code {0}: ERPNext can't redeem coupons without it").format(
					self.coupon_code
				)
			)
		rule = frappe.db.get_value(
			"Pricing Rule",
			coupon.pricing_rule,
			[
				"selling",
				"coupon_code_based",
				"price_or_product_discount",
				"rate_or_discount",
				"discount_percentage",
				"discount_amount",
				"rate",
			],
			as_dict=True,
		)
		if not rule or not rule.selling or not rule.coupon_code_based:
			frappe.throw(_("The coupon's Pricing Rule must be a Selling rule with Coupon Code Based ticked"))
		self.discount_summary = describe_pricing_rule(rule)
