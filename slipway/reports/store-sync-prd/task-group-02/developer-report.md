# Implementation Report: Task Group 02 — Synced Order Indicator (variant: store-sync-prd)

## What changed

- `src/features/orders/pages/OrdersPage.tsx` — added an exported `SyncedBadge` component (a small teal pill reading "Synced from Shopify") next to `buyerLabel`/`formatOrderDate`. The `buyer` column's `render` now wraps `buyerLabel(order)` and, when `order.customerId === null`, renders `<SyncedBadge />` alongside it.
- `src/features/orders/pages/OrderDetailPage.tsx` — imports `SyncedBadge` from `OrdersPage.tsx`; the header's buyer/date line now renders `<SyncedBadge />` after the existing text when `order.customerId === null`.

No other files touched — no new page, no new route, no new API call, per the task group's own scope (this group is explicitly UI-decoration-only on top of `order-management-prd` task-group-01, which had already landed before this group started).

## Tests added

No automated test framework exists in this repo (confirmed: no test script in `package.json`, zero `.test.`/`.spec.` files in `src/`) — consistent with how `order-management-prd` task-group-01 and `store-sync-prd` task-group-01 were also verified. Verification performed:
- `npx tsc --noEmit -p tsconfig.app.json` — zero new errors (one pre-existing, unrelated error in `BrandingPage.tsx`, confirmed by the prior two task groups to predate all three of this session's changes).
- `npx vite build` — clean, `✓ built in 2.39s`, zero errors.
- Manual QA checklist walkthrough (from `task-groups/02-synced-order-indicator.md`):
  - An order with `customerId: null` → `SyncedBadge` renders in both the `OrdersPage` list row and the `OrderDetailPage` header (verified by reading the conditional render logic directly against both DTOs' `customerId` field).
  - An order with `customerId` set → the conditional (`order.customerId === null`) is `false`, no badge renders.
  - No other visual/functional change: the status-update control's gating (`order.customerId !== null`, unrelated to this edit) is untouched; `ALLOWED_TRANSITIONS`/`statusBadgeClasses` logic unchanged.

## Deviations from the design

None. The task group anticipated exactly this shape ("one column `render` function gains a conditional badge" / "one heading gains a conditional badge") and that is exactly what was built — a shared `SyncedBadge` component was extracted (rather than inlining the badge markup twice) purely to avoid duplicating the same JSX in two files; this is a routine implementation detail, not a design deviation.

## Blockers

None. Both prerequisite files (`OrdersPage.tsx`, `OrderDetailPage.tsx` from `order-management-prd` task-group-01) existed before this group started, satisfying the task group's one blocking-open-question note (build-order only, not a design gap).
