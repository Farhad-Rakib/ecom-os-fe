# Courier & Delivery Integration (admin UI): Product Requirements

Mirrored from `ecom-os-be`'s `courier-prd`. That PRD is the source of
truth for the product; this one states only what this repo builds.
See `ecom-os-be/slipway/memory/courier-prd/decisions.md` for the full
reasoning, including the four flags raised before scoping.

## Problem

Everything the backend PRD describes needs an admin to drive it: a
courier has to be added, credentials entered and tested, an order
picked and dispatched, and the delivery outcome read back. None of
those surfaces exist in this repo today. Fulfilment staff live in this
app all day; if dispatch isn't here, they're still in the courier's
own portal.

## Target users

**Tenant admins and fulfilment staff**, in this back-office app — the
same people who already use the Orders pages that `order-management-prd`
shipped here.

## Why this approach

Follows the same shape this repo used for `store-sync-prd`: the backend
owns the integration entirely, this repo is a thin, honest control
surface over it. Dispatch is added to the **existing** Orders pages
rather than a parallel screen — the decision to dispatch happens while
looking at an order, and a second order list would immediately drift
from the first.

## Out of scope (product-wide)

- Any storefront or customer-facing surface — this repo has none, and
  the backend PRD exposes no tracking to buyers
- Bulk dispatch UI — v1 dispatches one order at a time, per the
  backend PRD
- Any rating display — that is `customer-management-prd`'s Feature 3
  in this repo, deliberately kept out of this variant so the two can
  ship independently (the same amendment pattern `store-sync-prd` used
  on `order-management-prd`'s pages)
- Rendering courier tracking maps or per-scan timelines

## Features

### 1. Courier Directory UI

**Problem:** No way to record which couriers a tenant uses.

**In scope:**
- A courier list page with create/edit/deactivate, reusing the shared
  `DataTable` and the `BaseRepository` API-class convention this repo
  standardizes on
- Fields per the backend's Feature 2: name, active, coverage/notes,
  display order, and which integration it uses (including
  manual/offline)
- A route guarded by the backend's courier permission

**Out of scope:**
- Courier pricing or zone configuration — not modelled backend-side
- A sidebar nav entry in code (see the known gap below)

**Acceptance criteria:**
1. An admin can create, edit, list, and deactivate couriers, and every
   change is reflected on reload.
2. A deactivated courier is visibly distinct and does not appear as a
   dispatch target in Feature 3.
3. Choosing the manual/offline integration hides the credential fields
   entirely rather than showing unusable ones.
4. An admin lacking the permission cannot reach the route.

### 2. Courier Connection UI

**Problem:** Credentials have to be entered and proven to work.

**In scope:**
- A settings-shaped connection screen per API-backed courier — closer
  to `SiteSettingsPage.tsx` than to a list page, the same call
  `store-sync-prd` made for `StoreConnectionPage.tsx`
- Credential fields rendered as masked/password inputs and never
  echoed back into any persisted client state, this repo's standing
  handling for secret-like fields
- A test-connection action showing success or the backend's specific
  failure reason
- Current connection status per courier

**Out of scope:**
- Displaying a stored credential back to the admin — the backend never
  returns one in readable form
- Managing more than the v1 connector's credential shape (Steadfast)

**Acceptance criteria:**
1. A saved credential is never rendered in readable form afterwards,
   including after a page reload.
2. Test-connection surfaces the backend's own success or failure
   message rather than a generic toast.
3. Connection status is visible without running a test.

### 3. Dispatch & Delivery Status on the Orders Pages

**Problem:** Dispatch has to happen where the order is.

**In scope:**
- A dispatch action on `OrdersPage.tsx`/`OrderDetailPage.tsx` (already
  built by `order-management-prd` in this repo): pick a courier,
  confirm, submit
- Disabling that action with a stated reason when the backend would
  refuse it — no recipient phone, no address, wrong status
- Showing the consignment/tracking identifier once dispatched
- Showing the delivery outcome, including the new `Returned` state,
  and whether it came from the courier or a person
- Manual entry of a tracking identifier and final outcome for a
  manual/offline courier
- Surfacing a courier-side rejection message so it can be acted on

**Out of scope:**
- Re-dispatching a consignment, or cancelling one — the backend
  doesn't support it
- A separate dispatch queue screen

**Acceptance criteria:**
1. An eligible order can be dispatched to a chosen active courier from
   the order detail, and the consignment id appears without a manual
   reload.
2. An ineligible order shows the dispatch action disabled with the
   specific reason, rather than allowing a click that fails.
3. An already-dispatched order offers no second dispatch.
4. A courier-reported delivery or return is shown distinctly from an
   admin-set status.
5. A rejected dispatch shows the courier's own message and leaves the
   order dispatchable again.

## Known repo-specific gap

This repo has **no static nav config file** — the sidebar is entirely
backend-driven (`GET /Menu`, managed through the existing
`features/menu/` admin page). New pages therefore cannot add their own
sidebar entry in code; each needs a `MenuItem` row created through
Menu Management or a backend seed. The same gap is already open for
`order-management-prd`'s Orders page and `store-sync-prd`'s Store
Connection page. Stated here so `/shape-spec` doesn't assume a nav
file that doesn't exist.
