# Order, Cart & Checkout Management: Product Requirements

## Problem

Tenants can configure their catalog and how their storefront is
organized and branded, but there is still no way for a shopper to
actually buy anything — no cart, no checkout, no payment processing,
no order record. The platform stops at "browse," not "purchase."

## Target users

- **End customers (shoppers)** on a tenant's storefront, who need to
  register/log in, build a cart, and complete a real, paid purchase —
  **not this repo's scope**; see the new, separate Next.js storefront
  application (`slipway/product/default/tech-stack.md`).
- **Tenant admins/merchandisers**, who need to see and manage the
  orders that result — status, fulfillment progress, refunds. **This
  repo's scope.**

## Why this approach

Builds directly on what's already shipped: Catalog's product,
variant, and inventory data, and Storefront Configuration's
branding/navigation admin screens already in this app. This product is
the missing transactional layer that turns "a configured catalog" into
"a store customers can check out from." Unlike every feature shipped
so far in this repo, most of this product's actual customer-facing
surface (accounts, cart, checkout, payment) does **not** live here —
it needs a genuinely public, anonymous-by-default frontend with
different auth and rendering needs than this authenticated admin app,
so a new separate application owns it (mirrored from `ecom-os-be`'s
PRD). This repo's own share is narrow: the admin side of Order
Management, the same "give staff visibility and control over what's
happening" role every other admin screen in this app already plays.

## Out of scope (product-wide)

Same boundary as `ecom-os-be`'s PRD — guest checkout, multi-currency,
subscriptions, coupons/discount codes, a full returns/RMA portal,
split-warehouse fulfillment, fraud detection, abandoned-cart/marketing
email, wishlists, and vendor selection for shipping/tax providers are
all out of scope product-wide. This repo additionally has no scope at
all for the customer-facing side of any feature (accounts, cart,
checkout UI, payment collection) — that entire surface lives in the
new storefront application, not here.

## Features

### 1. Customer Accounts

**Problem:** Checkout requires a real customer identity — no
customer-facing authentication exists anywhere on this platform today.

**In scope (this repo):** None. Registration/login/session/password
reset/profile are entirely the new storefront application's scope.

**Out of scope:** Everything — see above.

**Acceptance criteria:** N/A for this repo.

### 2. Customer Address Book

**In scope (this repo):** None — the storefront application's scope.

**Acceptance criteria:** N/A for this repo.

### 3. Shopping Cart

**In scope (this repo):** None — the storefront application's scope.

**Acceptance criteria:** N/A for this repo.

### 4. Real-Time Shipping Rate Calculation

**In scope (this repo):** None — backend-only (`ecom-os-be`) plus the
storefront application's checkout UI.

**Acceptance criteria:** N/A for this repo.

### 5. Real-Time Tax Calculation

**In scope (this repo):** None — backend-only (`ecom-os-be`) plus the
storefront application's checkout UI.

**Acceptance criteria:** N/A for this repo.

### 6. Checkout

**In scope (this repo):** None — the storefront application's scope.

**Acceptance criteria:** N/A for this repo.

### 7. Payment Processing

**Problem:** The platform needs to actually collect real payment from
a customer, and let a tenant issue a refund when needed.

**In scope (this repo):**
- A "Refund" action on a Paid order (Order Management's admin detail
  view, Feature 8), triggering the backend's refund endpoint

**Out of scope:**
- Card collection/payment UI — the storefront application's scope
- Anything about the gateway integration itself — `ecom-os-be`'s scope

**Acceptance criteria:**
1. An admin can trigger a full or partial refund from an order's
   detail page, and the resulting status change (Feature 8) is
   reflected immediately in this app.

### 8. Order Management

**Problem:** Once a purchase completes, tenant staff need a durable,
searchable view of what was bought and its fulfillment status, and a
way to move it forward.

**In scope (this repo):**
- New `OrdersPage.tsx`: paginated, status-filterable order list
- New `OrderDetailPage.tsx`: full order detail (line items, customer,
  shipping address, shipping/tax/total breakdown, payment status,
  status history)
- Manual status-update action (e.g. Paid → Processing → Shipped →
  Delivered)
- Refund action (Feature 7)

**Out of scope:**
- Editing a placed order's line items
- Any customer-facing order view — the storefront application's scope
- Carrier tracking-number lookup/live tracking — a status field only

**Acceptance criteria:**
1. An admin can view a paginated order list, filterable by status.
2. An admin can open an individual order and see its full detail:
   line items with the price actually charged, shipping address,
   shipping method/cost, tax, total, and current status.
3. An admin can manually advance an order's status, and the change
   persists and is reflected on reload.
4. `tsc`/`vite build` are clean; no other admin page's behavior
   changes as a result of this feature.

### 9. Order Confirmation & Notification Emails

**In scope (this repo):** None — backend-only (`ecom-os-be`).

**Acceptance criteria:** N/A for this repo.
