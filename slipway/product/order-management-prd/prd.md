# Order Management (Order Management): Product Requirements

## Problem

Once a purchase completes — whether created by this platform's own
(not-yet-built) checkout, or synced in from an external platform via
`store-sync-prd` — tenant staff need a durable, searchable view of
what was bought and its fulfillment status, and a way to move that
status forward for orders this platform actually owns the lifecycle
of.

## Target users

Tenant admin/staff, in this repo's existing authenticated back-office
app.

## Why this approach

Mirrors `ecom-os-be`'s `order-management-prd` PRD — see that repo's
`prd.md` for the full reasoning, including its supersession of
`default`'s Feature 8 (whose original FE sketch in this repo's own
`default/prd.md` Feature 8 is the closest prior art for this feature's
shape, now narrowed to match the backend's actual scope: no refund
action, since Payment Processing was never built in this narrower
variant).

This feature is written to work generically for **any** order
regardless of origin, rather than being aware of `store-sync-prd`
specifically. The backend's `OrderSummaryDto`/`OrderDetailDto` already
carry `CustomerId` (nullable) and `BuyerName`/`BuyerEmail` — an order
with `CustomerId: null` is externally-sourced (its status is owned by
a sync engine, and the backend's `PUT /orders/{id}/status` rejects any
attempt to change it, 400). This PRD's own acceptance criteria account
for that case using only fields already on the DTO, so this feature
doesn't need to be re-shaped later just because `store-sync-prd`
exists — same "don't let one variant require editing another's
already-approved PRD" discipline this project follows elsewhere.

## Out of scope (product-wide)

- Refund action — Payment Processing (`default` Feature 7) isn't part
  of this narrow variant; a refund here is a status change only
  (`Refunded`), not a real payment-gateway call.
- Any customer-facing order view — the not-yet-created Next.js
  storefront's scope.
- Carrier tracking-number lookup/live tracking — a status field only.
- Order status history / an audit trail of past status changes — the
  backend has no such record (a single current `Status` field only).
- Proactively labeling which orders came from a connected external
  store (e.g. a "via Shopify" badge) — deferred to `store-sync-prd`'s
  own FE scope, since only that variant's PRD should decide whether
  and how to surface platform-of-origin.

## Features

### 1. Order Management

**Problem:** Tenant staff have no way to see or manage orders today —
there is no admin order list or detail view in this repo at all.

**In scope:**
- New `OrdersPage.tsx`: paginated, status-filterable order list (`GET
  /orders?status&page&pageSize`) — one row per order showing id,
  buyer (customer name if `CustomerId` is set, otherwise
  `BuyerName`/`BuyerEmail`), status, total, currency, created date
- New `OrderDetailPage.tsx`: full order detail (`GET /orders/{id}`) —
  line items (product name, sku, unit price, quantity, line total),
  shipping address, shipping method/cost, tax, subtotal, total,
  currency, current status
- Manual status-update action (`PUT /orders/{id}/status`), offering
  only the transitions the backend's own `OrderStatusTransitions.
  AllowedFrom(currentStatus)` matrix allows from the order's current
  status (mirror that matrix in the FE rather than allowing an
  arbitrary status pick, so the UI can't offer a jump the backend will
  reject)
- The status-update control is **hidden** (not just disabled) when
  `order.customerId` is `null` — that order's status is owned by a
  sync engine, not an admin action, so there is nothing valid to offer

**Out of scope:**
- Editing a placed order's line items
- Everything listed in "Out of scope (product-wide)" above

**Acceptance criteria:**
1. An admin can view a paginated order list, filterable by status.
2. An admin can open an individual order and see its full detail:
   line items with the price actually charged, shipping address,
   shipping method/cost, tax, subtotal, total, currency, and current
   status.
3. For an order with a `CustomerId` set, an admin can manually advance
   its status through an allowed transition only, and the change
   persists and is reflected on reload; an attempt at a
   backend-disallowed transition is not offered as an option.
4. For an order with `CustomerId: null` (externally-sourced), no
   status-update control is shown at all.
5. `tsc`/`vite build` are clean; no other admin page's behavior
   changes as a result of this feature.
