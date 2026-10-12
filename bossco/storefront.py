"""Read side of the storefront: which Items are on sale, at what price, with how much stock."""

import re
from collections import Counter

import frappe
from frappe.utils import cint, flt, getdate, strip_html_tags, today
from frappe.website.utils import cleanup_page_name

ITEM_FIELDS = [
	"item_code",
	"item_name",
	"item_group",
	"image",
	"description",
	"is_stock_item",
	"creation",
	"bossco_slug",
	"bossco_subtitle",
	"bossco_origin",
	"bossco_pack_size",
	"bossco_badge",
	"bossco_compare_at_price",
	"bossco_rating",
	"bossco_reviews",
	"bossco_featured",
	"bossco_trending",
]


def set_store_slug(doc, method=None):
	"""Item validate hook: every Item shown in the store needs a unique, URL-safe slug."""
	if not doc.get("bossco_show_in_store"):
		return

	slug = cleanup_page_name(doc.bossco_slug or doc.item_name)
	if frappe.db.exists("Item", {"bossco_slug": slug, "name": ("!=", doc.name)}):
		slug = f"{slug}-{cleanup_page_name(doc.name)}"
	doc.bossco_slug = slug


def get_store_settings():
	return frappe._dict(
		company=frappe.db.get_single_value("Global Defaults", "default_company"),
		price_list=frappe.db.get_single_value("Selling Settings", "selling_price_list") or "Standard Selling",
		warehouse=frappe.db.get_single_value("Stock Settings", "default_warehouse"),
	)


def get_store_products(item_codes=None, filters=None, or_filters=None):
	"""Store-visible Items shaped for the React app (see frontend/src/types/catalog.ts).

	`filters`/`or_filters` narrow the Item query further. Items without a selling price are
	left out, since they can't be ordered.
	"""
	item_filters = {"bossco_show_in_store": 1, "disabled": 0, "has_variants": 0, **(filters or {})}
	if item_codes is not None:
		item_filters["item_code"] = ("in", item_codes or [""])

	items = frappe.get_all(
		"Item",
		filters=item_filters,
		or_filters=or_filters,
		fields=ITEM_FIELDS,
		order_by="bossco_sort_order asc, item_name asc",
	)
	if not items:
		return []

	codes = [item.item_code for item in items]
	prices = get_prices(codes, get_store_settings().price_list)
	stock = get_available_stock(codes)

	products = []
	for item in items:
		price = prices.get(item.item_code)
		if price is None:
			continue

		available = cint(stock.get(item.item_code)) if item.is_stock_item else None
		# ERPNext copies Item Name into Description by default; don't repeat it as the subtitle
		description = strip_html_tags(item.description or "").strip()
		products.append(
			{
				"id": item.item_code,
				"slug": item.bossco_slug or cleanup_page_name(item.item_name),
				"name": item.item_name,
				"subtitle": item.bossco_subtitle or ("" if description == item.item_name else description),
				"image": item.image or "",
				"origin": item.bossco_origin or "",
				"category": item.item_group,
				"size": item.bossco_pack_size or "",
				"price": price,
				"compareAtPrice": flt(item.bossco_compare_at_price) or None,
				"rating": flt(item.bossco_rating, 1),
				"reviews": cint(item.bossco_reviews),
				"badge": item.bossco_badge or None,
				"inStock": available is None or available > 0,
				"stock": available,
				"featured": bool(item.bossco_featured),
				"trending": bool(item.bossco_trending),
				"createdAt": str(item.creation),
			}
		)
	return products


def get_prices(item_codes, price_list):
	"""Latest valid, non-customer-specific selling rate per item."""
	rows = frappe.get_all(
		"Item Price",
		filters={
			"price_list": price_list,
			"item_code": ("in", item_codes),
			"customer": ("is", "not set"),
		},
		fields=["item_code", "price_list_rate", "valid_from", "valid_upto"],
		order_by="valid_from desc",
	)
	current = getdate(today())
	prices = {}
	for row in rows:
		if row.item_code in prices:
			continue
		if row.valid_from and getdate(row.valid_from) > current:
			continue
		if row.valid_upto and getdate(row.valid_upto) < current:
			continue
		prices[row.item_code] = flt(row.price_list_rate)
	return prices


def get_available_stock(item_codes):
	"""Actual minus reserved quantity across all warehouses."""
	rows = frappe.get_all(
		"Bin",
		filters={"item_code": ("in", item_codes)},
		fields=["item_code", "sum(actual_qty) as actual_qty", "sum(reserved_qty) as reserved_qty"],
		group_by="item_code",
	)
	return {row.item_code: flt(row.actual_qty) - flt(row.reserved_qty) for row in rows}


def get_store_categories(products):
	"""Item Groups that hold store products (directly or in a sub-group), in tree order.

	Each entry: {name, parent, depth, count}; the root "All Item Groups" is left out and
	`parent` is None for top-level groups.
	"""
	groups = frappe.get_all("Item Group", fields=["name", "parent_item_group"], order_by="lft asc")
	parent_of = {group.name: group.parent_item_group for group in groups}
	root = next((group.name for group in groups if not group.parent_item_group), None)

	counts = Counter()
	for product in products:
		group = product["category"]
		while group and group != root:
			counts[group] += 1
			group = parent_of.get(group)

	def depth(group):
		level = 0
		while parent_of.get(group) and parent_of[group] != root:
			group = parent_of[group]
			level += 1
		return level

	return [
		{
			"name": group.name,
			"parent": None if group.parent_item_group == root else group.parent_item_group,
			"depth": depth(group.name),
			"count": counts[group.name],
		}
		for group in groups
		if group.name != root and counts[group.name]
	]


def get_group_with_descendants(item_group):
	bounds = frappe.db.get_value("Item Group", item_group, ["lft", "rgt"], as_dict=True)
	if not bounds:
		return [item_group]
	return frappe.get_all(
		"Item Group", filters={"lft": (">=", bounds.lft), "rgt": ("<=", bounds.rgt)}, pluck="name"
	)


RATING_THRESHOLDS = (4.5, 4.0, 3.5, 3.0)


def get_filter_options(products):
	"""Filter choices for the catalog page, each with how many products match."""
	sizes = Counter(product["size"] for product in products if product["size"])
	prices = [product["price"] for product in products]
	return {
		"categories": get_store_categories(products),
		"sizes": [{"value": size, "count": sizes[size]} for size in sorted(sizes, key=size_sort_key)],
		"price": {"min": min(prices, default=0), "max": max(prices, default=0)},
		"ratings": get_rating_options(products),
		"inStock": sum(product["inStock"] for product in products),
		"total": len(products),
	}


def get_rating_options(products):
	"""Rating thresholds that match something, skipping ones that match no more than a stricter one."""
	options = []
	for threshold in RATING_THRESHOLDS:
		count = sum(product["rating"] >= threshold for product in products)
		if count and (not options or count > options[-1]["count"]):
			options.append({"value": threshold, "count": count})
	return options


def size_sort_key(size):
	"""Order pack sizes by weight/volume: "250g" < "500g" < "1kg"; anything else after."""
	match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(g|gm|kg|ml|l)\s*", size.lower())
	if not match:
		return (1, size)
	amount, unit = float(match.group(1)), match.group(2)
	return (0, amount * 1000 if unit in ("kg", "l") else amount)
