# Storefront setup: settings, email, promotions, orders

Everything a shopper sees that is business-driven (prices, stock, offers, reviews, shipping, emails) is
managed in Frappe/ERPNext. This page covers the settings an operator needs after installing the app.
For how the code fits together, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Storefront Settings

Desk → **Storefront Settings** (single DocType, module Bossco).

| Setting | Default | What it does |
|---|---|---|
| Store Name | Bossco | Used in emails and the header |
| Announcement Bar | empty | Text above the header; empty hides the bar |
| Only Customers Who Bought the Product Can Review It | on | Reviews need a submitted Sales Order with that Item; `Verified Purchase` badges are set by the server |
| Publish Reviews Without Moderation | on | Off: reviews wait as *Pending* until a Sales Manager sets them to *Published* |
| Order Confirmation / Shipped and Cancelled Updates / Welcome Email / Email Invoice PDF | on | Customer emails (see §2) |
| Invoice Print Format | empty | Print Format for the invoice PDF (empty = Sales Invoice default) |
| Invoice Prepaid Orders Right Away | on | Card/UPI orders get a submitted Sales Invoice with the payment allocated |
| Invoice Cash on Delivery Orders Right Away | on | COD orders get an (unpaid) Sales Invoice at order time, emailed with the amount payable on delivery |
| Invoice Cash on Delivery Orders When Shipped | on | Orders not invoiced yet get a Sales Invoice from the Delivery Note when it is submitted |

Defaults are written on install and migrate (`bossco.install.set_settings_defaults`).

## 2. Outgoing email (Gmail SMTP)

The storefront sends through Frappe's **default outgoing Email Account**. Nothing in React sends mail and
no SMTP setting is ever exposed to the browser.

| Setting | Value |
|---|---|
| Email address / SMTP username | `therazz007@gmail.com` |
| SMTP host | `smtp.gmail.com` |
| SMTP port | `587` |
| Connection security | STARTTLS (Frappe: *Use TLS* on, *Use SSL for Outgoing* off) |
| SMTP password | Gmail **App Password**, stored only in Frappe's encrypted Password field |
| Sender name | Store name (Email Account → *Email Account Name*) |
| Default outgoing | ticked |

Gmail prerequisites: 2-Step Verification on the Google account, then *Google Account → Security → App
passwords* to create a 16-character app password. Normal account passwords are refused by Gmail SMTP.

### Set it up from the bench (recommended)

The password is read from an environment variable for the one command, never written to a file:

```bash
cd ~/bench
BOSSCO_SMTP_PASSWORD='xxxx xxxx xxxx xxxx' \
  bench --site <site> execute bossco.email_setup.setup_outgoing_email \
  --kwargs "{'email_id': 'therazz007@gmail.com', 'sender_name': 'Bossco'}"

# then prove it works
bench --site <site> execute bossco.email_setup.send_test_email --args "['you@example.com']"
```

Saving the Email Account logs in to Gmail, so a wrong app password fails right there. The helper is
safe to re-run (it updates the same account). Spaces in the app password are ignored.

### Or in Desk

Email Account → New: Email Address `therazz007@gmail.com`, Service *GMail*, Password = app password,
untick *Enable Incoming*, tick *Enable Outgoing*, *Default Outgoing*, *Always use Account's Email Address
as Sender* and *Always use Account's Name as Sender Name*. The GMail service preset fills host 587/TLS.

### Emails and templates

Templates are standard **Email Template** records created on install (never overwritten, so wording and
styling can be edited in Desk):

| Template | Sent when | Context |
|---|---|---|
| Storefront Welcome | account created (`sign_up`) | `first_name`, `shop_url` |
| Storefront Password Reset | forgot password | `first_name`, `link`, `expires_in` |
| Storefront Order Confirmation | order submitted | `doc`, `items`, `total`, `paid`, `address`, `orders_url` |
| Storefront Order Update | Delivery Note submitted / Sales Order cancelled | as above + `status` |
| Storefront Invoice | Sales Invoice submitted (PDF attached) | `invoice`, `order`, `total` |

`store_name` is available in all of them. Sending is queued (Email Queue) with retries; a failure is
written to Error Log (`Storefront email failed: …`) and never affects the order or invoice. Each order
gets at most one confirmation and each invoice one email (flags `bossco_confirmation_sent`,
`bossco_invoice_emailed`).

Newsletter sign-up uses Frappe's own `newsletter.subscribe` (double opt-in email into the default Email
Group) and the contact form uses `frappe.www.contact.send_message` (saved as a Communication; set
*Contact Us Settings → Forward To Email* to get notified).

Password-reset link lifetime: *System Settings → Reset Password Link Expiry Duration*.

## 3. Promotions, coupons and popups

Discounts live in ERPNext; the storefront only displays them.

1. **Pricing Rule**: *Selling* ticked, *Coupon Code Based* ticked, *Price or Product Discount* = Price,
   discount (percentage/amount), optional *Min Amt* (minimum order), validity, and what it applies to
   (Transaction, Item Group or Item). For Transaction rules set *Apply Discount On* = Net Total.
2. **Coupon Code**: type *Promotional*, link the Pricing Rule, set validity and **Maximum Use** (must be
   > 0 or ERPNext refuses to redeem it). *Customer* restricts it to one customer.
3. **Storefront Offer** (Desk → Storefront Offer): what shoppers see.

| Field | Meaning |
|---|---|
| Placement | *Home Banner*, *Popup* or *Product Page* |
| Show To | Everyone / Guests / Signed-in Customers / New Customers (no submitted orders yet) |
| Show From / Until | display window; the offer also disappears when its coupon or rule expires or is used up |
| Coupon Code | discount, minimum order and remaining uses are read from it |
| Uses per Customer | per-customer limit, enforced at checkout against submitted Sales Orders |
| Item Group / Item | Product Page offers show on matching products; also the default button link |
| Show Popup | Once / Once per day / Once per visit, plus a delay in seconds |

The popup is never shown on checkout, order-complete, sign-in or account pages. Frequency is tracked per
browser; eligibility, dates and coupon validity are checked by the server (`bossco.offers`).

Checkout re-validates the coupon (`validate_coupon_for_customer`) and ERPNext applies the Pricing Rule to
the Sales Order; a coupon that doesn't apply (minimum not met, wrong products) blocks the order with a
message instead of silently charging full price. `bench --site <site> execute bossco.demo.seed_offers`
creates two demo offers (WELCOME10, HONEY15).

## 4. Orders, payments and invoices

- The cart is priced by `bossco.api.get_cart_quote`, which builds the same Sales Order as checkout inside
  a savepoint and rolls it back, so displayed totals, discounts, taxes and shipping are what ERPNext will
  charge. The browser never sends prices.
- `place_order` takes a per-attempt `checkout_key` (unique custom field on Sales Order). A retried or
  double-submitted checkout returns the existing order instead of creating another.
- Payments are still the mock gateway (`bossco/payments.py`); card/UPI orders get a Payment Entry.
- Invoicing (`bossco/orders.py`, background jobs, idempotent): by default every order is invoiced right
  after it is placed (prepaid with the advance allocated; COD unpaid, payable on delivery) and the
  invoice is emailed. Orders not invoiced at placement are invoiced from the Delivery Note on submit.
  All three switches live in Storefront Settings for stores that invoice by hand.
- Invoice PDFs are rendered by wkhtmltopdf, which fetches the print stylesheet from the site URL, so
  `host_name` in `site_config.json` must be a URL the server itself can reach
  (`bench --site <site> set-config host_name https://shop.example.com`; on a dev bench
  `http://127.0.0.1:8000`). If the PDF fails, the email still goes out with a download link and
  the error is logged as "Storefront invoice PDF failed".
- Customers download their invoices from *My Account → Orders* (`bossco.account.download_invoice`,
  owner-checked).

## 5. Reviews

Stored as **Storefront Review** (one per shopper per Item, rating 1–5, title, comment, verified-purchase
flag, helpful votes via **Storefront Review Vote**). Item fields *Rating* and *Review Count* on the
Storefront tab are read-only and recalculated from published reviews. Moderate in Desk → Storefront
Review (status Pending / Published / Rejected).

## 6. Environment variables and secrets

| Variable | Where | Purpose |
|---|---|---|
| `BOSSCO_SMTP_PASSWORD` | shell, for the one setup command | Gmail app password; stored encrypted by Frappe, never in files or git |
| `FRAPPE_SITE`, `FRAPPE_URL` | `frontend/` dev only | which site/server `yarn dev` proxies to |

The React build has no environment variables and contains no credentials. Session cookies and the CSRF
token are the only client-side state that touches auth.

## 7. Tests

```bash
# Backend (ERPNext flows: quote vs. order, coupons, idempotency, invoices, reviews, offers, reset link)
CI=1 bench --site <site> run-tests --app bossco      # needs the demo catalog; rolls everything back

# Frontend unit tests (catalog filtering/sorting, popup scheduling, password checks)
cd apps/bossco/frontend && yarn test && yarn lint && yarn typecheck
```

## 8. Operational notes

- Rate limits (per IP): sign up 5/h, login 10/10 min, forgot password 5/h, place order 20/h, reviews
  10/h, cart quote 120/min. Shoppers see "too many requests".
- *System Settings → Allow Error Traceback* should be off in production so API error responses don't
  carry tracebacks; the storefront shows a generic message for server errors either way.
- Scheduler/worker must run (`bench worker` / `bench schedule`): confirmation emails and invoices are
  background jobs.
