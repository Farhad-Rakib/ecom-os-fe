# External Store Sync (External Store Sync): Product Requirements

## Problem

A tenant whose real storefront/checkout runs on an external platform
(Shopify in v1) needs a way, from this admin app, to connect that
store, see whether it's connected and when it last synced, and
trigger a sync on demand — the backend (`store-sync-prd`, all 3 task
groups) already does the syncing itself; this repo is only the
tenant-facing control surface for it.

## Target users

Tenant admin/staff, in this repo's existing authenticated back-office
app — the same audience as every other admin feature here, not a new
user type.

## Why this approach

Mirrors `ecom-os-be`'s `store-sync-prd` PRD — see that repo's `prd.md`
for the full reasoning. That PRD's Feature 1 (External Platform
Connection) is the only feature with real tenant-facing configuration
to do; Features 2 and 3 (Catalog Sync, Order Sync) are automatic
background behavior once connected — this repo's scope for those two
is limited to a manual "sync now" trigger each, reusing the same
connection-status screen, not a dedicated page per sync type.

This variant also **amends `order-management-prd`'s already-built
`OrderDetailPage.tsx`** (once built) the same way the backend PRD
amended that variant's backend task group: a synced order (`CustomerId:
null`) gets a small "Synced from Shopify" indicator, using
`BuyerName`/`BuyerEmail`'s presence as the signal — no new field
needed, `order-management-prd`'s own FE PRD deliberately left this out
so this variant could own it. `order-management-prd/prd.md` is left
completely unedited (same rule this project follows everywhere else).

## Out of scope (product-wide)

- Any platform type beyond Shopify actually functioning (product-wide,
  backend scope)
- A public OAuth/app-store connect flow — the backend takes raw
  credential fields (`shopDomain`/`accessToken` for Shopify) via a
  plain form, not an OAuth redirect
- **Proactive read-only marking of synced products/categories in the
  existing Catalog admin pages** (e.g. a lock icon on `ProductsPage`
  before an edit is even attempted) — the backend's admin `PUT`/
  `DELETE` on a synced product/category already returns 409 with a
  clear message ("This product is synced from a connected store and
  cannot be edited here."), so this repo's existing generic
  API-error-toast handling already surfaces that correctly with zero
  new code. A **proactive** badge would need `ProductDto`/`CategoryDto`
  to expose a new sync-origin field, which is backend work the
  `store-sync-prd` backend PRD doesn't currently include — flagged
  here as a real gap, not silently worked around, but left for a
  future `/scope-feature` on the backend if wanted.
- Any Order Sync/Catalog Sync progress UI beyond a single pass/fail
  result of the manual "sync now" action (no live progress bar, no
  history of past sync runs)

## Features

### 1. Store Connection

**Problem:** A tenant admin has no way to tell this platform which
external store to pull from, or to see whether that connection is
healthy.

**In scope:**
- New `StoreConnectionPage.tsx`:
  - If no connection exists (`GET /store-sync/connection` returns all
    fields `null`): a form to connect — platform selector (only
    `Shopify` selectable/functional in v1, per the backend's own
    scope; the selector itself must not assume Shopify is the only
    option that will ever exist), and Shopify's two credential fields
    (`shopDomain`, `accessToken`) — `POST /store-sync/connection`
  - A clear inline error if connecting fails (400, connector-reported
    reason surfaced verbatim)
  - If a connection exists: show `Platform`, `Status` (Connected/
    Disconnected), `Last Catalog Synced At`, `Last Order Synced At`
    (each "Never" if `null`), and a **Disconnect** action (`DELETE
    /store-sync/connection`) with a confirming step before it fires
  - Two **"Sync now"** buttons (Catalog, Orders), each calling its own
    endpoint (`POST /store-sync/catalog/sync`, `POST
    /store-sync/orders/sync`) and showing the result inline: counts
    synced, and a warning (not an error) if `FailedRecords > 0` —
    per-record failures self-heal on a later run, they are not a
    reason to treat the whole action as failed
  - Both "sync now" buttons, and Disconnect, are disabled/hidden when
    there's no connection or `Status` is `Disconnected` (backend
    rejects with 404/409 in that case; the FE shouldn't offer an
    action it knows will fail)

**Out of scope:**
- Everything listed in "Out of scope (product-wide)" above

**Acceptance criteria:**
1. A tenant admin with no existing connection can select Shopify,
   enter their store domain and access token, and connect; success
   shows the resulting connected status, failure shows a clear error
   without navigating away from the form.
2. A tenant admin with an existing connection sees its platform,
   status, and both last-synced timestamps ("Never" if not yet
   synced).
3. A tenant admin can disconnect a connected store; the page reflects
   `Disconnected` status afterward, and no sync-trigger action remains
   available until reconnected.
4. A tenant admin can trigger a catalog sync and an order sync
   independently, each showing a result (counts, and a non-blocking
   warning if any records failed) without leaving the page.
5. `tsc`/`vite build` are clean; no other admin page's behavior
   changes as a result of this feature.

### 2. Synced Order Indicator

**Problem:** Once `order-management-prd`'s `OrderDetailPage.tsx`
exists, staff looking at a synced order have no way to tell it came
from Shopify rather than being a mistake (e.g. "why does this order
have no customer?").

**In scope:**
- On `order-management-prd`'s `OrderDetailPage.tsx` (and its
  `OrdersPage.tsx` list rows), when `order.customerId` is `null`, show
  a small "Synced from Shopify" indicator next to the buyer name —
  reads `BuyerName`/`BuyerEmail`, already present on
  `OrderSummaryDto`/`OrderDetailDto`, no new API call

**Out of scope:**
- Any change to `order-management-prd`'s own files' ownership — this
  is a small, additive change to pages that variant built; this
  variant does not re-litigate that PRD's own scope

**Acceptance criteria:**
1. An order with `customerId: null` shows a "Synced from Shopify"
   indicator on both the list row and the detail page.
2. An order with a `customerId` set shows no such indicator.
3. `tsc`/`vite build` are clean; no other admin page's behavior
   changes as a result of this feature.
