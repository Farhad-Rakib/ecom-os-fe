# Tech Stack

Unchanged from every other variant in this repo — React + TypeScript,
React Router, TanStack Query, Tailwind, the shared `DataTable`,
`ConfirmDialog`, `PermissionGuard` and toast primitives, and
`BaseRepository` for API access.

## Frontend

`ecom-os-fe`, this repo. New feature folders:
`src/features/notifications/`; additions to the existing
`src/features/orders/`, `src/features/catalog/` and
`src/features/courier/`.

Conventions this variant is bound by, all already established here:

- **Stored secrets are never rendered.** The SMTP password follows
  `CourierConnectionPage`'s pattern exactly — the API returns only a
  `hasSmtpPassword` flag, the form is cleared after a successful save,
  and nothing holds a secret in component state longer than the
  request.
- **Menu entries come from the backend.** `NotificationsModule` and
  `OrderManagementModule` declare their own `MenuDefinition`s and the
  seeder picks them up; there is no static nav config in this repo to
  edit.
- **Routes are guarded by `PermissionGuard`** with the backend's own
  permission names — `orders.manage`, `orders.settings.manage`,
  `catalog-inventory.manage`, `notifications.manage`.
- **`OrdersPage.tsx` hand-mirrors `OrderStatus` and
  `OrderStatusTransitions`** and must be updated in the same change as
  backend task group 03, which makes `PendingPayment → Shipped` legal
  for COD orders only. The conditional edge means this file now needs
  the order's payment method to compute its available transitions —
  the first time that mirror has depended on anything but the status.

## Backend

N/A in this repo — consumed. See
`ecom-os-be/slipway/product/fulfilment-readiness-prd/`. Backend-first,
the same sequencing every prior product on this platform used: no task
group here starts before its backend counterpart is built.

## Database

N/A.

## Other

- No new dependency is expected. The template editor is a plain
  textarea with a token list beside it, deliberately — see the
  backend's decision against a templating library.

## Conventions

- Prefer the smallest dependency that solves the problem over a
  framework that solves problems you don't have yet.
- Every new dependency is a decision — record why in
  `slipway/memory/fulfilment-readiness-prd/decisions.md`.
