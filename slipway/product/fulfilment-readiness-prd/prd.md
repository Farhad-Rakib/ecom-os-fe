# Fulfilment Readiness (admin UI): Product Requirements

Mirrored from `ecom-os-be`'s `fulfilment-readiness-prd`. That PRD is
the source of truth for the product; this one states only what this
repo builds. See
`ecom-os-be/slipway/memory/fulfilment-readiness-prd/decisions.md` for
the full reasoning.

## Problem

The backend PRD closes three seams on the order lifecycle — stock that
never moves, cash on delivery that cannot be dispatched, and a buyer
who is never contacted. Each needs an admin surface in this repo, and
none exists:

- Inventory pages show a `Reserved` column that is always zero and an
  available quantity nothing ever changes. Once stock actually moves,
  a merchant will ask *why* it moved, and there is nowhere to answer.
- There is no payment method anywhere in the order views, no way to
  turn COD on, and no way to record that a courier handed over cash.
- There is no email configuration, no template editing, and no way to
  answer "did the customer get their confirmation?" — the single
  most common support question a shop gets.

## Target users

**Tenant admins and fulfilment staff**, in this back-office app — the
same people already using the Orders, Inventory and Courier pages.

## Why this approach

Follows the same conventions the courier and store-sync UIs
established here: stored secrets are never rendered (the
`CourierConnectionPage` credential pattern), destructive or
money-affecting actions go behind a `ConfirmDialog`, permissions gate
routes through `PermissionGuard`, and menu entries come from the
backend module's own `MenuDefinition` rather than any static nav
config in this repo.

**`OrdersPage.tsx` hand-mirrors the backend's `OrderStatus` and
`OrderStatusTransitions`.** Backend task group 03 changes the
transition rules (a COD order becomes dispatchable while unpaid), so
that file's standing obligation is triggered by this variant.

## Out of scope

- Storefront surfaces. Checkout's payment-method selection and the
  out-of-stock refusal message are consumers of the backend's public
  API; this repo is the back office.
- Anything the backend PRD lists product-wide out of scope —
  discounts, buyer-initiated returns, reviews, reports.
- A visual email template editor. Templates are edited as text.

## Features

### 1. Payment Method & COD on the Order Views

**Problem:** An order's payment method is invisible, COD cannot be
enabled, and a delivered COD order cannot be marked collected.

**In scope:**
- Payment method on the order list (column + filter) and detail.
- A tenant settings screen with the COD toggle.
- A COD panel on the order detail: amount due, settled state, the
  settlement history showing automatic and manual records distinctly,
  and Mark collected / Reverse actions behind a confirm.
- An unsettled-COD worklist.
- `OrdersPage.tsx`'s mirrored transition rules updated.
- The COD amount shown in `DispatchPanel.tsx` before dispatch.

**Out of scope:**
- Reconciling a courier's remittance file.
- Partial collection.

**Acceptance criteria:**
1. Payment method is visible on the order list, order detail and the
   customer's order history, and the list can be filtered by it.
2. A tenant admin can enable and disable COD, and the screen is
   reachable only with `orders.settings.manage`.
3. A COD order's detail shows the amount due and whether it is
   settled.
4. The settlement history shows an automatic courier settlement and a
   manual override as separate entries, never one overwriting the
   other.
5. Marking collected and reversing both require a confirm and show the
   backend's own message on failure.
6. The unsettled worklist lists only delivered, unsettled COD orders.
7. `DispatchPanel` shows the COD amount going to the courier, and zero
   or nothing for a prepaid order.

### 2. Stock Movement Visibility

**Problem:** Once stock moves automatically, an unexplained quantity
is worse than no quantity at all.

**In scope:**
- A movement history per variant: type, delta, resulting quantities,
  the originating order (linked), and who or what caused it.
- Reserved quantity as a real column on the inventory views.
- Honest rendering of negative availability, which a Shopify-synced
  oversell can now produce.
- A backorder indicator on an order whose line was accepted short.

**Out of scope:**
- Editing or reversing a movement from the UI. The ledger is
  append-only; corrections are made by adjusting stock.
- Stock transfers, purchase orders, stocktakes.

**Acceptance criteria:**
1. From an inventory row, an admin can open its movement history and
   see every movement that produced the current quantities.
2. Each order-driven movement links to the order that caused it.
3. An admin's manual correction is visibly distinct from an
   order-driven movement.
4. Reserved quantity is shown alongside on-hand and available.
5. A negative available quantity renders as negative, not clamped to
   zero, and is visually flagged.
6. An order with a backordered line is flagged as such on its detail.

### 3. Email Configuration, Templates & Delivery Log

**Problem:** A tenant cannot set their own sender, cannot edit what
their customers receive, and cannot tell whether anything arrived.

**In scope:**
- SMTP settings with a masked password, a "using platform default"
  state, a send test, and a revert-to-default action.
- Template list and editor — subject, body, per-template enable, and
  the substitutable tokens available to each.
- A delivery log filterable by status and order, with retry on failed
  rows and a clear treatment for abandoned ones.
- A per-order notification panel on the order detail.

**Out of scope:**
- A WYSIWYG editor, or previewing against real order data.
- Bounce and unsubscribe handling.

**Acceptance criteria:**
1. A stored SMTP password is never rendered; entering a new one
   replaces it, matching the courier credential pattern.
2. A tenant using the platform default is told so, and can revert to
   it after configuring their own.
3. The send test reports the specific failure reason, not a generic
   error.
4. Every template can be edited and individually switched off, and its
   available tokens are listed.
5. The delivery log can be filtered by status and by order, and failed
   rows can be retried.
6. An abandoned message is visibly distinct from one still retrying.
7. An order's detail shows which messages were sent to the buyer, when,
   and whether any failed.
8. All three screens are reachable only with `notifications.manage`.
