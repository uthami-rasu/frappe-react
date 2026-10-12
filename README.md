### Bossco

Bossco storefront: a React (Vite + TypeScript + Tailwind + Redux Toolkit) single-page app served by Frappe, with products, stock and orders in ERPNext.

### How it fits together

For how React connects to Frappe (serving, API calls, CSRF, state, routing) and the main flows step by step, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For operator settings (email/SMTP, promotions, invoicing, reviews, environment variables), see [docs/SETUP.md](docs/SETUP.md).

| Piece | Where |
|---|---|
| React source | `frontend/` |
| Build output (generated, not committed) | `bossco/public/frontend/` and `bossco/www/shop.html` |
| Page that serves the app at `/` and `/shop` | `bossco/www/shop.py` (adds the CSRF token), `home_page` in `hooks.py` |
| Catalog, cart quote + checkout API | `bossco/api.py` → `get_catalog`, `get_product`, `get_related_products`, `get_cart_quote`, `place_order` |
| Accounts API (session, sign up, login, password reset, profile, addresses, orders, invoices, wishlist) | `bossco/account.py` |
| Reviews / promotions / server cart | `bossco/reviews.py`, `bossco/offers.py`, `bossco/cart.py` |
| Order lifecycle: confirmation emails, invoices, invoice emails | `bossco/orders.py` (background jobs, hooks on Delivery Note / Sales Invoice / Sales Order) |
| Email templates + SMTP setup helper | `bossco/email_templates.py`, `bossco/email_setup.py` |
| Storefront Settings, Storefront Review (+ Vote), Storefront Offer, Storefront Cart Item | `bossco/bossco/doctype/` |
| Which Customer a shopper is | `bossco/customers.py` |
| Mock payment gateway | `bossco/payments.py` |
| Item → product mapping | `bossco/storefront.py` |
| Custom fields: Storefront tab on Item, payment fields on Sales Order | `bossco/install.py`, applied on install and every migrate |
| Wishlist DocType | `Storefront Wishlist Item` |
| Demo catalog and mock payment accounts | `bossco/demo.py` |

**Products** are Items with *Show in Store* ticked (Item → Storefront tab). Category = Item Group, price = Item Price in the default selling price list, stock = actual minus reserved qty across warehouses. Items without a selling price are hidden.

**Accounts.** Signing up creates a Website User with the *Customer* role, plus their own Customer and Contact (Contact.user links them). Login, logout and password changes use Frappe's session. Forgot password emails Frappe's `/update-password` link, so outgoing email must be configured. My Account shows the profile, saved addresses (Address linked to the Customer), order history (from Sales Orders) and the wishlist (stored per user, merged with what was saved before logging in).

**Checkout.** The cart is priced by the server (`get_cart_quote` builds and rolls back the same Sales Order), so coupons (ERPNext Coupon Code + Pricing Rule), taxes and shipping shown are what is charged. Logged-in shoppers order as their own Customer and can pick a saved address. Guests are matched by email to an earlier *guest* Customer, never to a registered account. The Sales Order is **submitted** (order type *Shopping Cart*); a per-attempt checkout key stops retries from creating duplicate orders. Prices and the express shipping charge (₹150, booked to *Freight and Forwarding Charges*) are calculated on the server.

**After the order.** Background jobs send the confirmation email, create the Sales Invoice (prepaid orders right away, cash on delivery when the Delivery Note is submitted) and email the invoice PDF; all idempotent, all switchable in *Storefront Settings*. Customers download invoices from their order history.

**Reviews, offers, recommendations.** Ratings come only from published *Storefront Review* records (verified purchase checked server-side). Banners and popups come from *Storefront Offer* records backed by ERPNext coupons. "Frequently bought together" uses real order lines, with same-category best sellers as the fallback.

**Payments are mocked.** Cash on delivery leaves the order unpaid. Card or UPI "charges" the mock gateway, stores the reference on the Sales Order (*Storefront Payment* section, Terms tab) and submits a Payment Entry against it into the *Mock Payment Gateway* bank ledger. Test values: card `4000 0000 0000 0002` or UPI `fail@upi` are declined, and a declined payment creates no order. To go live, replace `mock_charge()` in `bossco/payments.py` with a real gateway.

**Order status** in My Account follows ERPNext: draft → *Awaiting confirmation*, submitted → *Processing*, partly or fully delivered (Delivery Note) → *Partly shipped* / *Delivered*, cancelled → *Cancelled*.

### Installation

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO
bench --site <site> install-app bossco
bench --site <site> execute bossco.demo.seed   # optional demo catalog, mock payment accounts and demo offers
bench build --app bossco
```

ERPNext must be installed and set up (company, default warehouse, selling price list). Then configure outgoing email and review *Storefront Settings*: see [docs/SETUP.md](docs/SETUP.md).

### Tests

```bash
CI=1 bench --site <site> run-tests --app bossco          # backend, rolls back
cd apps/bossco/frontend && yarn test && yarn lint && yarn typecheck
```

### Development

```bash
# Terminal 1: Frappe (pin the site; `bench serve` otherwise serves the bench's default site)
bench --site bossco.local serve --port 8000

# Terminal 2: Vite with hot reload on http://localhost:8080
cd apps/bossco/frontend
yarn dev        # FRAPPE_SITE / FRAPPE_URL override the proxied site and server
```

Vite proxies `/api`, `/files`, `/assets`, `/app` and `/login` to Frappe, so the app talks to real ERPNext data while you edit.

### Deploying on Frappe Cloud

1. Push this app to GitHub and add it to a bench group with Frappe + ERPNext (version-15).
2. The build runs `yarn install` (root `postinstall` installs `frontend/`) and `bench build`, which runs the root `build` script. You don't need to commit any build output.
3. Vite 8 needs **Node 20.19+ or 22.12+**. Set the bench group's Node version accordingly.
4. Install the app on the site. The custom fields are created automatically.

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/bossco
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

mit
