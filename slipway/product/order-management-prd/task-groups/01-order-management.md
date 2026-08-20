# Task Group 01: Order Management

## Features covered

1. Order Management

## Tasks

- New feature folder `src/features/orders/` (`pages/`, no `components/`
  needed yet — both pages are simple enough to stay self-contained,
  matching how `ProductEditorPage.tsx` inlines its own bits before
  splitting out).
- `src/features/orders/pages/OrdersPage.tsx` — DTOs (`OrderSummaryDto`,
  `PagedResultDto<T>` reused from the existing shared shape already
  used by `ProductsPage.tsx`) and an `OrderApi extends BaseRepository`
  class defined inline, same convention as `ProductApi`. Uses the
  shared `DataTable` component (`src/components/table/DataTable.tsx`)
  for the list — search/status-filter/pagination, no "Add" action
  (orders aren't created here).
- `src/features/orders/pages/OrderDetailPage.tsx` — `OrderDetailDto`,
  `OrderLineItemDto`, `OrderAddressDto` inline; `getById` on the same
  `orderApi` singleton; a status-update section calling `PUT
  /orders/{id}/status` via a mutation.
- `OrderStatusTransitions` mirrored client-side as a plain constant
  (`ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`) — a
  hand-copied mirror of the backend's `AllowedFrom` table (see DB
  design's note on keeping this in sync), used only to populate the
  status-update control's choices, never as the source of truth (the
  backend still validates and can reject; the FE mirror only prevents
  offering an option that's certain to fail).
- Status badge: `statusBadgeClasses: Record<OrderStatus, string>`
  colocated in `OrdersPage.tsx`, reused by `OrderDetailPage.tsx`,
  following `ProductsPage.tsx`'s exact pattern (rounded pill `<span>`
  via a `DataTable` column `render`).
- Route registration in `src/app/router/index.tsx`: `orders` (list),
  `orders/:id` (detail) — no `orders/new`, both wrapped in
  `<PermissionGuard permissions={['orders.manage']}>` (new permission
  string, backend's existing policy is literally named
  `Permissions.OrdersManage` = `"orders.manage"` — reuse that exact
  string, don't invent a different one).
- Sidebar/nav entry: add an "Orders" link under whichever existing nav
  group Catalog/Storefront items live in (follow the existing nav
  config file's pattern — same file every other feature's link was
  added to).

## API endpoints

Consumed only, all pre-existing on `ecom-os-be` (`order-management-prd`
task-group-01, committed `5d40bb7`) — no backend changes:

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/orders` | query: `status?`, `page`, `pageSize` | `ApiResponse<PagedResultDto<OrderSummaryDto>>` |
| GET | `/orders/{id}` | — | `ApiResponse<OrderDetailDto>` |
| PUT | `/orders/{id}/status` | body `{ status: OrderStatus }` | `ApiResponse<OrderDetailDto>` |

## FE pages/components

- `OrdersPage.tsx` (new) — paginated list via `DataTable`: columns id,
  buyer (customer name if `customerId` set, else `buyerName`), status
  badge, total+currency, created date. Status filter as a `<select>`
  above the table, page/pageSize wired to `DataTable`'s own pagination
  props. Row click navigates to `orders/:id`.
- `OrderDetailPage.tsx` (new) — line items table (product name, sku,
  unit price, quantity, line total), shipping address block, shipping
  method/cost, tax, subtotal, total, currency, status badge. A status
  section rendered **only when `order.customerId !== null`**: a
  `<select>` populated from `ALLOWED_TRANSITIONS[order.status]` (empty
  array → render nothing, same visual outcome as the externally-sourced
  case) plus a confirm button, wired to the `PUT .../status` mutation;
  on success, invalidate both the detail query and the list query.

## DB design

N/A — this repo has no database. **Mirror-maintenance note**: the
`ALLOWED_TRANSITIONS` client-side constant duplicates
`ecom-os-be`'s `OrderStatusTransitions.AllowedFrom` table. If that
backend table ever changes, this file must be updated in the same PR —
flagged here since it's the one piece of backend logic this task group
duplicates rather than fetches.

## QA checklist

- Filtering the list by each status value returns only orders with
  that status.
- Opening an order with `customerId` set shows an enabled status
  control offering exactly the transitions
  `OrderStatusTransitions.AllowedFrom` allows from its current status
  (verify against at least `Paid` and `Shipped` as non-trivial cases).
- Opening an order with `customerId: null` shows no status control at
  all (not just disabled — absent).
- Advancing a status, then reloading the page, shows the new status
  persisted (round-trip through the real backend, not just optimistic
  client state).
- Attempting an out-of-band transition is impossible to trigger from
  the UI (the `<select>` never offers it) — this is a UI-completeness
  check, not a backend-behavior check (the backend's own rejection is
  already covered by that PRD's own test suite).
- `tsc` and `vite build` both succeed with zero errors after this
  change; spot-check one unrelated existing page (e.g. `ProductsPage`)
  still renders correctly, confirming no shared component was broken.

## Blocking open questions

None — the API, DTOs, and transition matrix are all already
implemented and documented on the backend (see the Explore report this
design is based on); nothing here requires a backend decision that
hasn't already been made.

## Deferred / safe-to-resolve-during-implementation

- Exact nav-group placement for the new "Orders" sidebar link — follow
  whatever the existing nav config file's convention is; not a design
  decision worth blocking on.
- Whether `orderApi`'s DTOs live inline in `OrdersPage.tsx` (matching
  `ProductsPage.tsx`) or in a separate `orders.api.ts` under
  `src/core/api/services/` (matching `site-settings.api.ts`) — both
  patterns coexist in this codebase today; either is acceptable,
  implementer's choice.
