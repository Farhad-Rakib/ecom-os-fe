# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — no new platform
choices for this variant.

## Frontend (admin)

React — `ecom-os-fe`, this repo. A customer list and detail page, a
recipient view, and additive rating display on
`order-management-prd`'s existing `OrdersPage.tsx`/
`OrderDetailPage.tsx` — the same additive pattern `store-sync-prd`'s
`SyncedBadge` used on those same files.

## Frontend (storefront)

N/A — and specifically forbidden: no rating is ever shown to a buyer.

## Database

N/A.

## Backend

.NET Core Web API — `ecom-os-be`'s `customer-management-prd`, **not
yet implemented**. Note the split dependency carried over from that
PRD: this repo's Features 1-2 need only the customer admin endpoints,
while Feature 3 additionally needs `courier-prd` shipped end to end.
`/shape-spec` should not group them together.

## Other

**Presentation constraint, not cosmetic** — a rating is never rendered
as a bare percentage, and "insufficient history" must never render as
a blank, a dash, or anything a tired admin reads as "fine". This is an
acceptance criterion in both PRDs because the failure mode is a parcel
shipped on a misread.

**Sidebar** — backend-driven (`GET /Menu`); no static nav file exists.
