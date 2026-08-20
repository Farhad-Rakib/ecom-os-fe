# Task Group 02: Synced Order Indicator

## Features covered

2. Synced Order Indicator

## Tasks

- Small, additive edit to two already-built files from
  `order-management-prd` task-group-01 (this repo):
  `src/features/orders/pages/OrdersPage.tsx` and
  `src/features/orders/pages/OrderDetailPage.tsx`.
- In `OrdersPage.tsx`'s buyer column `render`: when `row.customerId ===
  null`, append a small inline badge/label ("Synced from Shopify")
  next to the `buyerName`/`buyerEmail` text. No new column, no layout
  change to the table otherwise.
- In `OrderDetailPage.tsx`: same badge next to the buyer section's
  heading, when `order.customerId === null`.
- No new API call — `customerId`/`buyerName`/`buyerEmail` are already
  present on `OrderSummaryDto`/`OrderDetailDto`, already fetched by
  both pages as of `order-management-prd` task-group-01.
- No route/nav changes — this group touches existing pages/routes
  only.

## API endpoints

None — reuses the exact same `GET /orders` / `GET /orders/{id}`
responses `order-management-prd` task-group-01 already fetches. No
backend changes.

## FE pages/components

- `OrdersPage.tsx` (changed, not new) — one column `render` function
  gains a conditional badge.
- `OrderDetailPage.tsx` (changed, not new) — one heading gains a
  conditional badge.
- No new page. This group is explicitly UI-decoration-only on top of
  an already-complete feature.

## DB design

N/A.

## QA checklist

- An order with `customerId: null` shows the "Synced from Shopify"
  badge on both its list row and its detail page.
- An order with `customerId` set shows no badge in either place.
- No other visual or functional change to either page — spot-check
  that the status-update control from `order-management-prd`
  task-group-01 still behaves identically (still hidden for synced
  orders, still offers the same transitions for native orders).
- `tsc`/`vite build` clean.

## Blocking open questions

**Depends on `order-management-prd` task-group-01 being implemented
first** in this repo — `OrdersPage.tsx`/`OrderDetailPage.tsx` must
exist before this group has anything to edit. Not blocking on design
(nothing here is ambiguous), only on build order.

## Deferred / safe-to-resolve-during-implementation

- Exact badge styling/wording — implementer's call, no acceptance
  criterion specifies exact copy beyond "Synced from Shopify" being
  recognizable as such.
