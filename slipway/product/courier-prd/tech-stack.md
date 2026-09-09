# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — no new platform
choices for this variant.

## Frontend (admin)

React — `ecom-os-fe`, this repo. Two new pages (courier directory,
courier connection) plus additive edits to `order-management-prd`'s
already-built `OrdersPage.tsx`/`OrderDetailPage.tsx` for dispatch and
delivery status. The shared `DataTable` and the `BaseRepository`
API-class convention are the established patterns for both new pages.

## Frontend (storefront)

N/A — this repo has no storefront, and the backend PRD exposes no
tracking to buyers.

## Backend

.NET Core Web API, multi-tenant — `ecom-os-be`'s `courier-prd`, **not
yet implemented**. This variant consumes that API once it exists; this
repo adds no backend of its own. Unlike every prior variant in this
repo, the backend is not already built, so `/shape-spec` here should
wait until the backend's contracts are settled rather than guessing
at DTO shapes.

## Database

N/A — this repo has no database.

## Other

**v1 connector is Steadfast** (backend decision) — the courier
selector and connection screen must still be written so a second
courier (Pathao, RedX) is a data addition, not a code change, the same
call `store-sync-prd` made with its `SUPPORTED_PLATFORMS` constant.

**Credential input** — courier API credentials are secret-like fields
and get the same handling as `store-sync-prd`'s Shopify access token:
masked input, never echoed back, never persisted in client state
beyond the form's own lifetime, even though the backend encrypts them
at rest.

**Sidebar** — this repo's sidebar is backend-driven (`GET /Menu`).
There is no static nav config file to add an entry to; see the PRD's
"Known repo-specific gap".
