"""Demo catalog taken from the original hard-coded React data.

Run with: bench --site <site> execute bossco.demo.seed
Safe to run again; existing Items and Item Groups are skipped.

Demo promotions only: bench --site <site> execute bossco.demo.seed_offers
"""

import os

import frappe

ITEM_GROUPS = {
	"Dry Fruits & Nuts": ["Nuts", "Mixed nuts", "Peanuts", "Dried fruits", "Other nuts"],
	"Honey": ["Raw honey", "Honeycomb", "Infused honey", "Gift sets"],
}

# (item_code, name, group, image, price, extra storefront fields, opening stock)
NUTS = [
	("NUT-001", "Premium Peanut Chikki", "Peanuts", "images/7890a4ea83eb4c865b720f64d732214fe5e22733.webp", 699, {"bossco_badge": "Bestseller"}, 40),
	("NUT-002", "Premium California Almonds", "Nuts", "images/7eaa4ec251a43e5030c515e16baaac61013784e6 (1).webp", 699, {}, 32),
	("NUT-003", "Premium Dried Figs", "Dried fruits", "images/9186c4f45f15fbaf619c01424637adde5a7bbfee.webp", 699, {"bossco_badge": "Bestseller"}, 12),
	("NUT-004", "Premium Green Kiwi", "Dried fruits", "images/46a450fc32579f8dd007794e8719e505c88017ba.webp", 699, {}, 2),
	("NUT-005", "Premium Red Berries", "Other nuts", "images/c8cf9f3396dd013d6332516298f5ca4b3d31e784.webp", 699, {"bossco_badge": "New"}, 42),
	("NUT-006", "Premium Dried Amla", "Mixed nuts", "images/7ca050cb646a18398f2d3912b62a9f7e9b9bdbec.webp", 699, {}, 18),
	("NUT-007", "Premium Black Prunes", "Dried fruits", "images/0128c4a3becf9417477ab8018b0cf9fc7d533e94.webp", 699, {}, 8),
	("NUT-008", "Premium Sweet Rings", "Other nuts", "images/849b878e0e8dd1a695c9a525c5423c4eb3bb1243.webp", 699, {}, 24),
]

HONEY = [
	("HON-001", "Melora Raw Forest Honey", "Raw honey", "images/3719332c70605ffb0114496075fad17a1e6ecb5c.webp", 480, {"bossco_slug": "melora-raw-forest-honey", "bossco_subtitle": "Deep, malty and wonderfully complex — collected from untouched forest bloom.", "bossco_origin": "Western Ghats", "bossco_pack_size": "500g", "bossco_compare_at_price": 560, "bossco_badge": "Bestseller"}, 50),
	("HON-002", "Wild Hive Comb Honey", "Honeycomb", "category/ad0871d505385543f74adf1e567c5dca11365121.webp", 1250, {"bossco_slug": "wild-hive-comb-honey", "bossco_subtitle": "Silken raw honey sealed inside tender, edible beeswax comb.", "bossco_origin": "Nilgiri Hills", "bossco_pack_size": "350g", "bossco_badge": "Pure comb"}, 50),
	("HON-003", "Ancient Forest Artisanal", "Raw honey", "category/553672e3cda4d62fbb1c7965d98b61135fe083c3.webp", 890, {"bossco_slug": "ancient-forest-artisanal", "bossco_subtitle": "A dark amber harvest with soft woody notes and a long floral finish.", "bossco_origin": "Aravalli Forest", "bossco_pack_size": "450g", "bossco_compare_at_price": 990, "bossco_badge": "Limited harvest"}, 50),
	("HON-004", "Acacia Gold Honey", "Raw honey", "category/9282672b5437c3df697468cc9de9bce23693c139.webp", 620, {"bossco_slug": "acacia-gold-honey", "bossco_subtitle": "Pale, delicate and slow to crystallise, with a clean vanilla-like sweetness.", "bossco_origin": "Kashmir Valley", "bossco_pack_size": "250g", "bossco_badge": "New season"}, 50),
	("HON-005", "Saffron Infused Honey", "Infused honey", "images/ChatGPT Image Jun 10, 2026, 11_08_40 AM 1.webp", 780, {"bossco_slug": "saffron-infused-honey", "bossco_subtitle": "Raw mountain honey slowly rested with handpicked Kashmiri saffron.", "bossco_origin": "Pampore, Kashmir", "bossco_pack_size": "200g", "bossco_compare_at_price": 860, "bossco_badge": "Bestseller"}, 50),
	("HON-006", "The Honey Tasting Trio", "Gift sets", "images/8773eeca3cba18ea1f474f415ed58dd51b2c77ee.webp", 1490, {"bossco_slug": "honey-tasting-trio", "bossco_subtitle": "Three small-batch harvests gathered in a keepsake gifting box.", "bossco_origin": "Three Indian terroirs", "bossco_pack_size": "3 × 150g", "bossco_badge": "Limited harvest"}, 50),
]

TRENDING = [
	("TRD-001", "Crunchy Masala Bites", "Other nuts", "images/ad903c3c8ce3e6e51fe06f17ea463992aefb0f15.webp", 349, {}, 30),
	("TRD-002", "Royal Trail Mix", "Mixed nuts", "images/19c6c95934212ac057b1530c5e4f5122c4a2c598.webp", 599, {}, 30),
	("TRD-003", "Golden Kiwi Slices", "Dried fruits", "images/907ac892879c823d09936261026ca3280452b11d.webp", 449, {}, 30),
	("TRD-004", "Ruby Cranberries", "Dried fruits", "images/a758edce84f7c2653677a48f37b6c69f22c239cf.webp", 399, {}, 30),
	("TRD-005", "Whole Premium Cashews", "Nuts", "images/42b27289e10fb466136cbb956a6139f0542888a0.webp", 799, {}, 30),
	("TRD-006", "Green Kiwi Coins", "Dried fruits", "images/46a450fc32579f8dd007794e8719e505c88017ba.webp", 449, {}, 30),
]


def seed():
	setup_mock_payments()
	make_item_groups()
	sort_order = 0
	for rows, defaults in (
		(NUTS, {"bossco_featured": 1, "bossco_pack_size": "500g"}),
		(HONEY, {}),
		(TRENDING, {"bossco_trending": 1, "bossco_pack_size": "250g"}),
	):
		for item_code, item_name, group, image, price, extra, stock in rows:
			sort_order += 1
			make_item(item_code, item_name, group, image, price, {**defaults, **extra}, stock, sort_order)
	seed_offers()
	frappe.db.commit()


# (coupon code, pricing rule fields, offers)
DEMO_OFFERS = [
	(
		"WELCOME10",
		{
			"apply_on": "Transaction",
			"apply_discount_on": "Net Total",
			"rate_or_discount": "Discount Percentage",
			"discount_percentage": 10,
			"min_amt": 999,
		},
		[
			{
				"title": "10% off your first order",
				"description": "New here? Take 10% off orders over ₹999 with code WELCOME10.",
				"placement": "Popup",
				"audience": "Everyone",
				"priority": 10,
				"max_uses_per_customer": 1,
				"cta_label": "Start shopping",
				"cta_link": "#honey",
			},
			{
				"title": "Welcome offer: 10% off",
				"description": "Orders over ₹999 · one use per customer",
				"placement": "Home Banner",
				"audience": "Everyone",
				"priority": 10,
				"max_uses_per_customer": 1,
				"cta_label": "Shop the collection",
				"cta_link": "#honey",
			},
		],
	),
	(
		"HONEY15",
		{
			"apply_on": "Item Group",
			"item_group": "Honey",
			"rate_or_discount": "Discount Percentage",
			"discount_percentage": 15,
		},
		[
			{
				"title": "15% off raw honey",
				"description": "This week only, on every jar in the honey room.",
				"placement": "Product Page",
				"item_group": "Honey",
				"audience": "Everyone",
				"priority": 5,
				"cta_label": "Browse honey",
				"cta_link": "#honey?category=Honey",
			},
			{
				"title": "Honey week: 15% off",
				"description": "Raw, comb and infused honey — code HONEY15.",
				"placement": "Home Banner",
				"item_group": "Honey",
				"audience": "Everyone",
				"priority": 5,
				"cta_label": "Browse honey",
				"cta_link": "#honey?category=Honey",
			},
		],
	),
]


def seed_offers():
	"""Coupon-based demo promotions: Pricing Rule + Coupon Code + Storefront Offers. Valid 30 days."""
	from frappe.utils import add_days, today

	company = frappe.db.get_single_value("Global Defaults", "default_company")
	for code, rule_fields, offers in DEMO_OFFERS:
		if frappe.db.exists("Coupon Code", {"coupon_code": code}):
			continue
		item_group = rule_fields.pop("item_group", None)
		rule = frappe.get_doc(
			{
				"doctype": "Pricing Rule",
				"title": f"Storefront {code}",
				"selling": 1,
				"coupon_code_based": 1,
				"price_or_product_discount": "Price",
				"company": company,
				"currency": "INR",
				"valid_from": today(),
				"valid_upto": add_days(today(), 30),
				"item_groups": [{"item_group": item_group}] if item_group else [],
				**rule_fields,
			}
		).insert()
		coupon = frappe.get_doc(
			{
				"doctype": "Coupon Code",
				"coupon_name": code,
				"coupon_code": code,
				"coupon_type": "Promotional",
				"pricing_rule": rule.name,
				"valid_from": today(),
				"valid_upto": add_days(today(), 30),
				"maximum_use": 500,
			}
		).insert()
		for offer in offers:
			frappe.get_doc({"doctype": "Storefront Offer", "coupon_code": coupon.name, **offer}).insert()
	frappe.db.commit()


def setup_mock_payments():
	"""Bank ledger + Modes of Payment that the mock card/UPI payments post to (see bossco/payments.py)."""
	company = frappe.db.get_single_value("Global Defaults", "default_company")
	abbr = frappe.db.get_value("Company", company, "abbr")
	parent = frappe.db.get_value("Account", {"company": company, "account_name": "Bank Accounts", "is_group": 1})

	account = f"Mock Payment Gateway - {abbr}"
	if not frappe.db.exists("Account", account):
		frappe.get_doc(
			{
				"doctype": "Account",
				"account_name": "Mock Payment Gateway",
				"parent_account": parent,
				"company": company,
				"account_type": "Bank",
			}
		).insert()

	for mode_of_payment in ("Credit Card", "UPI"):
		if not frappe.db.exists("Mode of Payment", mode_of_payment):
			frappe.get_doc({"doctype": "Mode of Payment", "mode_of_payment": mode_of_payment, "type": "Bank"}).insert()
		doc = frappe.get_doc("Mode of Payment", mode_of_payment)
		if not any(row.company == company for row in doc.accounts):
			doc.append("accounts", {"company": company, "default_account": account})
			doc.save()


def make_item_groups():
	for parent, children in ITEM_GROUPS.items():
		if not frappe.db.exists("Item Group", parent):
			frappe.get_doc(
				{"doctype": "Item Group", "item_group_name": parent, "parent_item_group": "All Item Groups", "is_group": 1}
			).insert()
		for child in children:
			if not frappe.db.exists("Item Group", child):
				frappe.get_doc({"doctype": "Item Group", "item_group_name": child, "parent_item_group": parent}).insert()


def make_item(item_code, item_name, group, image, price, storefront, stock, sort_order):
	if frappe.db.exists("Item", item_code):
		return

	item = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_name,
			"item_group": group,
			"stock_uom": "Nos",
			"is_stock_item": 1,
			"include_item_in_manufacturing": 0,
			"standard_rate": price,
			"opening_stock": stock,
			"valuation_rate": round(price * 0.6, 2),
			"bossco_show_in_store": 1,
			"bossco_sort_order": sort_order,
			**storefront,
		}
	).insert()

	item.db_set("image", attach_image(item_code, image))


def attach_image(item_code, relative_path):
	# not frappe.get_app_path: it scrubs path parts, and some asset names contain spaces
	path = os.path.join(frappe.get_app_path("bossco"), "..", "frontend", "src", "assets", relative_path)
	with open(path, "rb") as f:
		content = f.read()

	file_doc = frappe.get_doc(
		{
			"doctype": "File",
			"file_name": f"{item_code.lower()}{os.path.splitext(path)[1]}",
			"attached_to_doctype": "Item",
			"attached_to_name": item_code,
			"attached_to_field": "image",
			"is_private": 0,
			"content": content,
		}
	).insert()
	return file_doc.file_url
