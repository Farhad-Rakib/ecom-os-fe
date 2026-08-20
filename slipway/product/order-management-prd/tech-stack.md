# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — no new platform
choices for this variant.

## Frontend (admin)

React — `ecom-os-fe`, this repo, the existing back-office app.
`OrdersPage.tsx`/`OrderDetailPage.tsx` are the only new pages this
variant adds.

## Frontend (storefront)

N/A — customer-facing order history is the not-yet-created Next.js
storefront's scope, not this repo's.

## Backend

.NET Core Web API, multi-tenant — `ecom-os-be`, already implemented
(`order-management-prd`, task-group-01, committed). This variant
consumes that API as-is; no backend changes.

## Database

N/A — this repo has no database of its own.

## Other

None.
