"""Storefront flows end to end against ERPNext. Run with:

    CI=1 bench --site <site> run-tests --app bossco

Needs the demo catalog (bench --site <site> execute bossco.demo.seed). Everything is rolled back.
"""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, cint, flt, now_datetime, today

from bossco import account, api, cart, offers, orders, reviews
from bossco.customers import ensure_customer_for_user
from bossco.storefront import get_store_products

CARD = {
	"method": "card",
	"card_number": "4242 4242 4242 4242",
	"expiry": "12/40",
	"cvc": "123",
	"name": "Test",
}
ADDRESS = {
	"address_line1": "1 Test Street",
	"city": "Chennai",
	"state": "Tamil Nadu",
	"pincode": "600001",
	"country": "India",
}


def make_shopper(email):
	if not frappe.db.exists("User", email):
		frappe.get_doc(
			{
				"doctype": "User",
				"email": email,
				"first_name": "Test",
				"last_name": "Shopper",
				"user_type": "Website User",
				"send_welcome_email": 0,
				"roles": [{"role": "Customer"}],
			}
		).insert(ignore_permissions=True)
	ensure_customer_for_user(email)
	return email


def make_coupon(code, rule_fields, maximum_use=10):
	rule = frappe.get_doc(
		{
			"doctype": "Pricing Rule",
			"apply_discount_on": "Net Total",
			"title": f"Test {code}",
			"selling": 1,
			"coupon_code_based": 1,
			"price_or_product_discount": "Price",
			"company": frappe.db.get_single_value("Global Defaults", "default_company"),
			"currency": "INR",
			**rule_fields,
		}
	).insert(ignore_permissions=True)
	return frappe.get_doc(
		{
			"doctype": "Coupon Code",
			"coupon_name": code,
			"coupon_code": code,
			"coupon_type": "Promotional",
			"pricing_rule": rule.name,
			"maximum_use": maximum_use,
		}
	).insert(ignore_permissions=True)


class StorefrontTestCase(FrappeTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		products = [
			product for product in get_store_products() if product["inStock"] and (product["stock"] or 0) >= 5
		]
		if len(products) < 2:
			raise cls.skipTest(cls, "Needs the demo catalog: bench --site <site> execute bossco.demo.seed")
		cls.product, cls.other = products[0], products[1]
		cls.user = make_shopper("storefront-test@example.com")
		cls.user_two = make_shopper("storefront-test-two@example.com")
		if not frappe.db.exists("Email Account", {"default_outgoing": 1, "enable_outgoing": 1}):
			frappe.get_doc(
				{
					"doctype": "Email Account",
					"email_id": "storefront-test-outgoing@example.com",
					"email_account_name": "Storefront Test Outgoing",
					"enable_outgoing": 1,
					"default_outgoing": 1,
					"smtp_server": "localhost",
					"smtp_port": "25",
					"no_smtp_authentication": 1,
				}
			).insert(ignore_permissions=True)

	def setUp(self):
		frappe.db.set_single_value(
			"Storefront Settings",
			{"require_verified_purchase": 1, "auto_publish_reviews": 1, "send_order_confirmation": 1},
		)

	def tearDown(self):
		frappe.set_user("Administrator")

	def order(self, qty=1, **kwargs):
		frappe.set_user(self.user)
		return api.place_order(
			items=[{"item_code": self.product["id"], "qty": qty}],
			address=ADDRESS,
			payment=kwargs.pop("payment", {"method": "cod"}),
			**kwargs,
		)


class TestCheckout(StorefrontTestCase):
	def test_quote_matches_order_total_with_coupon(self):
		coupon = make_coupon(
			"TESTPCT",
			{"apply_on": "Transaction", "rate_or_discount": "Discount Percentage", "discount_percentage": 10},
		)
		items = [{"item_code": self.product["id"], "qty": 2}]

		frappe.set_user(self.user)
		quote = api.get_cart_quote(items, "express", coupon.coupon_code)
		self.assertTrue(quote["coupon"]["applied"], quote["coupon"])
		self.assertAlmostEqual(quote["discount"], flt(self.product["price"] * 2 * 0.1, 2))
		self.assertEqual(quote["shipping"], 150)

		order = api.place_order(
			items=items, address=ADDRESS, shipping_method="express", coupon_code=coupon.coupon_code
		)
		self.assertEqual(flt(order["grand_total"]), flt(quote["total"]))
		self.assertEqual(frappe.db.get_value("Coupon Code", coupon.name, "used"), 1)

	def test_quote_saves_nothing(self):
		frappe.set_user("Guest")
		before = frappe.db.count("Sales Order"), frappe.db.count("Customer")
		api.get_cart_quote([{"item_code": self.product["id"], "qty": 1}])
		self.assertEqual((frappe.db.count("Sales Order"), frappe.db.count("Customer")), before)

	def test_coupon_minimum_and_validity(self):
		coupon = make_coupon(
			"TESTMIN",
			{
				"apply_on": "Transaction",
				"rate_or_discount": "Discount Amount",
				"discount_amount": 50,
				"min_amt": 10**7,
			},
		)
		frappe.set_user(self.user)
		quote = api.get_cart_quote([{"item_code": self.product["id"], "qty": 1}], coupon_code="testmin")
		self.assertFalse(quote["coupon"]["applied"])
		self.assertIn("more to use", quote["coupon"]["message"])
		self.assertRaises(frappe.ValidationError, self.order, coupon_code="TESTMIN")

		frappe.db.set_value("Coupon Code", coupon.name, "valid_upto", add_days(today(), -1))
		quote = api.get_cart_quote([{"item_code": self.product["id"], "qty": 1}], coupon_code="TESTMIN")
		self.assertIn("expired", quote["coupon"]["message"])
		self.assertIn(
			"not a valid",
			api.get_cart_quote([{"item_code": self.product["id"], "qty": 1}], coupon_code="NOPE")["coupon"][
				"message"
			],
		)

	def test_coupon_per_customer_limit(self):
		coupon = make_coupon(
			"TESTONCE",
			{"apply_on": "Transaction", "rate_or_discount": "Discount Amount", "discount_amount": 10},
		)
		frappe.get_doc(
			{
				"doctype": "Storefront Offer",
				"title": "Once",
				"placement": "Home Banner",
				"coupon_code": coupon.name,
				"max_uses_per_customer": 1,
			}
		).insert()
		self.order(coupon_code="TESTONCE")
		self.assertRaisesRegex(frappe.ValidationError, "already used", self.order, coupon_code="TESTONCE")

	def test_checkout_key_prevents_duplicate_orders(self):
		key = frappe.generate_hash(length=32)
		first = self.order(checkout_key=key)
		second = self.order(checkout_key=key)
		self.assertEqual(first["name"], second["name"])
		self.assertEqual(frappe.db.count("Sales Order", {"bossco_checkout_key": key}), 1)

	def test_stock_is_checked_on_the_server(self):
		self.assertRaisesRegex(frappe.ValidationError, "left of|at most", self.order, qty=10**6)

	def test_order_clears_saved_cart(self):
		frappe.set_user(self.user)
		cart.set_cart([{"item_code": self.product["id"], "qty": 3}])
		self.order()
		self.assertEqual(cart.get_cart(), [])


class TestInvoices(StorefrontTestCase):
	def test_prepaid_order_is_invoiced_once(self):
		order = self.order(payment=CARD)
		self.assertTrue(order["paid"])
		frappe.set_user("Administrator")
		first = orders.make_invoice_for_order(order["name"])
		second = orders.make_invoice_for_order(order["name"])
		self.assertEqual(first, second)
		self.assertEqual(orders.get_order_invoices(order["name"]), [first])
		invoice = frappe.get_doc("Sales Invoice", first)
		self.assertEqual(invoice.docstatus, 1)
		self.assertEqual(flt(invoice.outstanding_amount), 0)  # the card payment was allocated

		frappe.set_user(self.user)
		self.assertEqual(account.get_orders()[0]["invoices"], [first])
		frappe.set_user(self.user_two)
		self.assertRaises(frappe.PermissionError, account.download_invoice, first)

	def test_confirmation_email_is_sent_once(self):
		order = self.order()
		frappe.set_user("Administrator")
		orders.send_order_confirmation(order["name"])
		orders.send_order_confirmation(order["name"])
		self.assertEqual(
			frappe.db.count(
				"Email Queue", {"reference_doctype": "Sales Order", "reference_name": order["name"]}
			),
			1,
		)


class TestReviews(StorefrontTestCase):
	def test_only_buyers_can_review_and_reviews_update_rating(self):
		frappe.set_user(self.user_two)
		self.assertRaises(
			frappe.PermissionError, reviews.submit_review, self.product["id"], 5, "Lovely and fresh!"
		)

		self.order()
		frappe.set_user(self.user)
		reviews.submit_review(self.product["id"], 4, "Fresh and crunchy, will buy again.", "Good")
		reviews.submit_review(
			self.product["id"], 2, "Changed my mind, it was stale.", "Meh"
		)  # edits, no duplicate
		self.assertEqual(
			frappe.db.count("Storefront Review", {"item_code": self.product["id"], "user": self.user}), 1
		)

		result = reviews.get_reviews(self.product["id"])
		mine = next(review for review in result["reviews"] if review["comment"].startswith("Changed"))
		self.assertTrue(mine["verifiedPurchase"])
		self.assertEqual(result["summary"]["distribution"]["2"], 1)
		self.assertEqual(
			flt(frappe.db.get_value("Item", self.product["id"], "bossco_rating")),
			result["summary"]["average"],
		)

		self.assertRaises(frappe.ValidationError, reviews.vote_helpful, mine["id"])  # own review
		frappe.set_user(self.user_two)
		reviews.vote_helpful(mine["id"])
		reviews.vote_helpful(mine["id"])
		self.assertEqual(frappe.db.get_value("Storefront Review", mine["id"], "helpful_count"), 1)

	def test_rating_is_validated(self):
		frappe.db.set_single_value("Storefront Settings", "require_verified_purchase", 0)
		frappe.set_user(self.user)
		self.assertRaises(
			frappe.ValidationError, reviews.submit_review, self.product["id"], 6, "Out of range rating"
		)
		self.assertRaises(frappe.ValidationError, reviews.submit_review, self.product["id"], 5, "Too short")

	def test_moderation_hides_pending_reviews(self):
		frappe.db.set_single_value(
			"Storefront Settings", {"require_verified_purchase": 0, "auto_publish_reviews": 0}
		)
		frappe.set_user(self.user)
		self.assertEqual(
			reviews.submit_review(self.other["id"], 5, "Waiting for approval here.")["status"], "Pending"
		)
		self.assertEqual(reviews.get_reviews(self.other["id"])["summary"]["total"], 0)


class TestCartAndOffers(StorefrontTestCase):
	def test_merge_keeps_larger_quantity_and_drops_unknown_items(self):
		frappe.set_user(self.user)
		cart.set_cart([{"item_code": self.product["id"], "qty": 2}])
		merged = cart.merge_cart(
			[
				{"item_code": self.product["id"], "qty": 1},
				{"item_code": self.other["id"], "qty": 3},
				{"item_code": "NOT-AN-ITEM", "qty": 1},
			]
		)
		self.assertEqual(
			{row.item_code: row.qty for row in merged}, {self.product["id"]: 2, self.other["id"]: 3}
		)

	def test_offers_respect_audience_and_dates(self):
		frappe.db.delete("Storefront Offer")
		for title, fields in {
			"Guests": {"audience": "Guests"},
			"Customers": {"audience": "Signed-in Customers"},
			"Expired": {"valid_upto": add_days(now_datetime(), -1)},
			"Future": {"valid_from": add_days(now_datetime(), 1)},
			"Off": {"enabled": 0},
		}.items():
			frappe.get_doc(
				{"doctype": "Storefront Offer", "title": title, "placement": "Popup", **fields}
			).insert()

		frappe.set_user("Guest")
		self.assertEqual([offer["title"] for offer in offers.get_active_offers()], ["Guests"])
		frappe.set_user(self.user)
		self.assertEqual([offer["title"] for offer in offers.get_active_offers()], ["Customers"])

	def test_used_up_coupon_hides_its_offer(self):
		frappe.db.delete("Storefront Offer")
		coupon = make_coupon(
			"TESTGONE",
			{"apply_on": "Transaction", "rate_or_discount": "Discount Amount", "discount_amount": 10},
			1,
		)
		frappe.get_doc(
			{"doctype": "Storefront Offer", "title": "Gone", "placement": "Popup", "coupon_code": coupon.name}
		).insert()
		self.assertEqual(len(offers.get_active_offers()), 1)
		frappe.db.set_value("Coupon Code", coupon.name, "used", 1)
		self.assertEqual(offers.get_active_offers(), [])


class TestAccount(StorefrontTestCase):
	def test_forgot_password_answer_does_not_reveal_accounts(self):
		frappe.set_user("Guest")
		known = account.forgot_password(self.user)["message"].replace(self.user, "<email>")
		unknown = account.forgot_password("nobody-here@example.com")["message"].replace(
			"nobody-here@example.com", "<email>"
		)
		self.assertEqual(known, unknown)

	def test_reset_link_points_to_the_storefront(self):
		frappe.set_user("Administrator")
		account.send_password_reset(self.user)
		queued = frappe.get_last_doc(
			"Email Queue", filters={"reference_doctype": "User", "reference_name": self.user}
		)
		self.assertIn("#reset-password?key=", queued.message)
		self.assertTrue(frappe.db.get_value("User", self.user, "reset_password_key"))
		self.assertEqual(cint(frappe.db.count("Email Queue", {"reference_name": self.user})) >= 1, True)
