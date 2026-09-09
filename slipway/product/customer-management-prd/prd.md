# Customer Management & Delivery Rating (admin UI): Product Requirements

Mirrored from `ecom-os-be`'s `customer-management-prd`. That PRD is
the source of truth; this one states only what this repo builds. See
`ecom-os-be/slipway/memory/customer-management-prd/decisions.md` for
the reasoning.

## Problem

This app has an admin surface for catalog, orders, storefront and
store sync — and none at all for customers. Support staff cannot look
up the person they're on the phone with. And the delivery rating the
backend computes is worthless unless it appears where the dispatch
decision is made, which is in this app.

## Target users

**Tenant admins, support, and fulfilment staff** in this back-office
app.

## Why this approach

Two independent halves, split by their backend dependency. The
customer directory needs only the `Customer` entity that already
exists and can ship immediately. The recipient/rating surfaces cannot
begin until `courier-prd` has produced real delivery outcomes. They are
separate features here for exactly that reason.

The rating is added to the **existing** Orders pages, the same
additive pattern `store-sync-prd`'s synced-order badge used on those
same files.

## Out of scope (product-wide)

- Any storefront exposure of a rating — a buyer must never see their
  own score, per the backend PRD
- Editing a customer's profile, addresses, or password
- Creating a customer from the admin side
- Any UI that blocks or gates dispatch on a low rating — informational
  only in v1
- Hand-editing a rating or its underlying outcomes
- Customer export, segmentation, or marketing lists

## Features

### 1. Customer Directory UI

**Problem:** No admin-side view of customers exists.

**In scope:**
- A paged, searchable customer list (name, email, phone) using the
  shared `DataTable`
- A customer detail page: profile, saved addresses, account status,
  registration date, and their orders
- Row-click through to detail, and from an order to its customer
- A route guarded by the backend's customer permission

**Out of scope:**
- Guest and store-synced buyers — those are Feature 3's recipient
  view, not this list
- Editing anything

**Acceptance criteria:**
1. The list pages and searches by partial name, email, or phone.
2. A detail page shows profile, addresses, and orders, and its order
   data agrees with the Orders pages for the same orders.
3. An admin without the permission cannot reach either route.

### 2. Customer Account Status UI

**Problem:** No way to stop a compromised or abusive account.

**In scope:**
- Deactivate/reactivate from the customer detail page, with
  confirmation
- Clear display of current status, and who changed it when

**Out of scope:**
- Delete, scheduled suspension, or notifying the customer

**Acceptance criteria:**
1. Deactivating requires an explicit confirmation and reflects
   immediately on the page.
2. Current status and its last change (who, when) are visible without
   leaving the page.
3. A deactivated customer's orders remain visible and intact.

### 3. Recipient & Rating Surfaces

**Problem:** The rating has to be visible at the moment somebody
decides whether to ship a parcel.

**Depends on `courier-prd` being shipped** — there is nothing real to
display before it.

**In scope:**
- The recipient's rating, with its delivered/returned/decided counts,
  on `OrdersPage.tsx` and `OrderDetailPage.tsx`
- A recipient view reached from an order or by direct phone lookup:
  the phone, names ordered under, linked account if any, and the
  orders behind the score
- A phone-lookup entry point for checking a recipient before an order
  exists
- Presenting insufficient-history recipients as exactly that, visibly
  distinct from a poor ratio — never a bare percentage, and never a
  blank that reads as "fine"

**Out of scope:**
- Sorting or filtering the order list by rating
- Blocking or warning-gating dispatch
- Any bulk lookup

**Acceptance criteria:**
1. An order's row and detail show the recipient's rating with its
   counts before dispatch.
2. A phone with no history and a phone with a poor ratio are
   distinguishable at a glance and in text.
3. Direct phone lookup works for a number with no current order.
4. The rating shown on an order matches the recipient view for the
   same phone.
5. Dispatching to a low-rated recipient is not prevented or
   interrupted by this UI.

## Known repo-specific gap

Same backend-driven sidebar gap as every other new page in this repo:
no static nav config file exists, so the Customers entry needs a
`MenuItem` row via Menu Management or a backend seed. Already open for
Orders and Store Connection.
