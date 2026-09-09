# Decisions

## 2026-09-08 — plan-product — mirrored, with two repo-specific calls

New variant `courier-prd` mirrored from `ecom-os-be`'s. Full product
reasoning — including the four flags raised before scoping — lives in
`ecom-os-be/slipway/memory/courier-prd/decisions.md` and is not
duplicated here.

**Dispatch goes on the existing Orders pages, not a new screen.** The
decision to dispatch is made while looking at an order; a separate
dispatch queue would immediately drift from the order list it
duplicates. Same additive-edit pattern `store-sync-prd` used on those
same two files.

**The backend does not exist yet.** Every prior variant in this repo
was scoped against an already-implemented backend, so DTO shapes were
knowable. This one isn't. `/shape-spec courier-prd` here should wait
until the backend's contracts are settled rather than inventing them —
otherwise this repo hand-mirrors a shape that then changes, the same
maintenance hazard already flagged for `ALLOWED_TRANSITIONS` in
`order-management-prd`.

**Sidebar gap, third occurrence.** No static nav config file exists;
the sidebar is backend-driven via `GET /Menu`. Already open for Orders
and Store Connection. Recorded again so `/shape-spec` doesn't write a
task assuming a nav file.

## 2026-09-08 — shape-spec — two groups, and a correction to a standing note

`01-courier-directory-and-connection` (Features 1-2), then
`02-dispatch-on-orders` (Feature 3), which has a hard build-order
dependency on 01 — its courier picker imports `CourierDto`/`courierApi`
from `CouriersPage.tsx`, the same export-from-the-list-page pattern
`OrdersPage.tsx` already established.

**Correction to this variant's plan-product entry.** That entry
recorded the "no static nav config file" gap as applying here, as it
did for `order-management-prd` and `store-sync-prd`. It does not.
Backend modules declare their own `MenuDefinition` and are discovered
by assembly scan and seeded — `CourierModule` already declares
`("Couriers", "/couriers", "truck", courier.manage)`. The sidebar entry
for these pages therefore arrives from the backend automatically, with
no `MenuItem` row to create by hand. The gap remains real for the
earlier pages, which have no owning module declaring a menu.

**Task group 02 carries a required maintenance update, not an
optional one.** `OrdersPage.tsx` hand-mirrors the backend's
`OrderStatus` and `OrderStatusTransitions`, with a comment saying it
must be updated in the same PR as any backend change. `courier-prd`'s
backend groups 03 and 04 changed both: `Paid -> Shipped` was added, and
`Returned` is a new terminal state. Left stale, the status `<select>`
offers a wrong set and a `Returned` order renders with no badge class.
