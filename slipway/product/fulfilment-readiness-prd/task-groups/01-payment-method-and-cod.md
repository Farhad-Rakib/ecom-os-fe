# Task Group 01: Payment Method & COD on the Order Views

## Features covered

1. Payment Method & COD on the Order Views

Depends on backend task groups 01 (payment method) and 03 (COD).

## Tasks

- Extend the order DTO types in `src/features/orders/` with
  `paymentMethod`, `isCodSettled` and `codAmountDue`.
- `OrdersPage.tsx` — Payment column, payment-method filter, and a COD
  settlement indicator. **Update its mirrored `OrderStatus` /
  `OrderStatusTransitions` tables for the conditional
  `PendingPayment → Shipped` edge**: available transitions now depend
  on the order's payment method, not the status alone. This is the
  standing obligation that file's own comment describes.
- `OrderDetailPage.tsx` — payment method in the summary; a COD panel
  for COD orders showing amount due, settled state and the settlement
  history, with Mark collected / Reverse actions behind
  `ConfirmDialog`.
- **New** `OrderSettingsPage.tsx` — the COD toggle, route
  `/orders/settings`, guarded by `orders.settings.manage`.
- **New** `UnsettledCodPage.tsx` — the delivered-but-unsettled
  worklist, route `/orders/cod`, guarded by `orders.manage`, linking
  each row to its order detail.
- `DispatchPanel.tsx` (in `src/features/courier/`) — show the COD
  amount that will be sent to the courier before dispatch is
  confirmed.
- New API methods on the orders repository for the settlement,
  settlement-history, unsettled-list and settings endpoints.

## API endpoints consumed

`GET|PUT /orders/settings`, `POST|GET /orders/{id}/cod-settlement`,
`GET /orders/cod/unsettled`, plus `paymentMethod` / `isCodSettled` /
`codAmountDue` on the existing order list and detail responses.

## FE pages/components

Listed under Tasks — this group is entirely FE.

## DB design

N/A.

## QA checklist

- The transition dropdown on a COD order at `PendingPayment` offers
  Ship; on an online order at `PendingPayment` it does not. Both
  checked — the pair is the feature.
- A settlement history containing both an automatic and a manual
  record renders both, with the manual one shown as authoritative.
- Mark collected and Reverse each require a confirm and surface the
  backend's own error message on failure.
- The COD panel does not render at all for an online order.
- Routes are unreachable without their permissions; the COD settings
  screen specifically requires `orders.settings.manage`, not
  `orders.manage`.
- A tenant with COD disabled still sees existing COD orders correctly.
- Light and dark themes on every new screen.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the unsettled worklist gets its own menu entry or sits as a
  tab on the Orders page. Menu entry is the default; it is a backend
  `MenuDefinition` change either way.
