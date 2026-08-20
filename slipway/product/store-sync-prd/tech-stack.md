# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — no new platform
choices for this variant.

## Frontend (admin)

React — `ecom-os-fe`, this repo, the existing back-office app.
`StoreConnectionPage.tsx` is the only new page; the "Synced Order
Indicator" feature is a small addition to `order-management-prd`'s
already-built `OrdersPage.tsx`/`OrderDetailPage.tsx`.

## Frontend (storefront)

N/A — the connected external platform is the tenant's storefront in
this scenario, per the backend PRD.

## Backend

.NET Core Web API, multi-tenant — `ecom-os-be`, already implemented
(`store-sync-prd`, all 3 task groups, committed/uncommitted on `dev`).
This variant consumes that API as-is; no backend changes. (One real
gap noted in `prd.md`'s Out of scope — proactive synced-catalog
read-only marking needs a backend DTO change not yet made — but this
variant doesn't add it.)

## Database

N/A — this repo has no database of its own.

## Other

**Credential input** — the Shopify `accessToken` field is sensitive;
render it as a password-style input (masked, not logged/echoed in any
client-side state persisted beyond the form's own lifetime) even
though the backend already encrypts it at rest — this repo's own
baseline handling for any secret-like field, not a new pattern.
