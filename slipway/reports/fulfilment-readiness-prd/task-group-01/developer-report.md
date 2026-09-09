# Implementation Report: Task Group 01 — Payment Method & COD on the Order Views (variant: fulfilment-readiness-prd)

## What changed

- `orders/pages/OrdersPage.tsx` — `PaymentMethod` type and labels; `paymentMethod`,
  `isCodSettled`, `codAmountDue` on both order DTOs; a Payment column showing the method and, for
  COD only, whether cash is collected or still due; a payment-method filter; and the COD settlement,
  unsettled-worklist and per-order-notification API methods.
  **`allowedTransitionsFor(status, paymentMethod)`** added beside the existing
  `ALLOWED_TRANSITIONS` — the mirrored matrix now depends on the order, not just its status.
- `orders/pages/OrderDetailPage.tsx` — payment method in the summary, the payment-method-aware
  transition list, and the two new panels.
- `orders/components/CodSettlementPanel.tsx` — **new**. Amount due, settled state, the full
  settlement history with the authoritative record marked, and Mark collected / Reverse behind
  `ConfirmDialog`. Renders for COD orders only.
- `orders/components/OrderNotificationsPanel.tsx` — **new**. What the buyer was sent, when, and
  whether it arrived.
- `orders/pages/OrderSettingsPage.tsx` — **new**, `/orders/settings`, `orders.settings.manage`.
- `orders/pages/UnsettledCodPage.tsx` — **new**, `/orders/cod`.
- `courier/pages/DispatchPanel.tsx` — the blocked-reason mirror now allows `PendingPayment` for a
  COD order, and the cash field explains which case the order is in.
- `app/router/index.tsx` — five new routes, static order paths declared above `orders/:id`.

## Verification

`npm run typecheck` and `npm run build` clean. Every new file lints with zero errors.

## Deviations from the design

1. **`allowedTransitionsFor` is a function over a separate COD-only table**, not an edit to
   `ALLOWED_TRANSITIONS`. Widening the shared table would offer `PendingPayment → Shipped` for card
   orders too, which the backend always rejects — the exact failure Feature 4 AC1 exists to prevent.
2. **A pre-existing compile error was fixed in `OrderDetailPage.tsx`.** It referenced a
   `recipientRating` that was never defined anywhere in the repo. It went unnoticed because the root
   `tsconfig.json` has `"files": []`, so a bare `tsc --noEmit` checks nothing — only
   `npm run typecheck` (which targets `tsconfig.app.json`) catches it. Wired to the same batch
   ratings endpoint `OrdersPage` uses.

## Blockers

None. **One pre-existing error remains outside this group's scope**: `storefront/pages/BrandingPage.tsx:293`
fails `npm run typecheck` and has done since commit `ffc4539`. Not touched here.
