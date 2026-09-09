# Task Group 02 — Dispatch & Delivery Status on the Orders Pages — Developer Report

**Status:** complete. `tsc --noEmit` and `vite build` both clean.
Uncommitted on `dev`.

## Files added

- `src/features/courier/pages/DispatchPanel.tsx` — `ConsignmentDto`,
  `DeliveryEventDto`, `consignmentApi`, the precondition mirror, and
  the whole dispatch/outcome/timeline surface

## Files changed

- `src/features/orders/pages/OrdersPage.tsx` — the **required**
  backend-constant update (below), plus `recipientPhone` /
  `recipientPhoneNormalized` on `OrderAddressDto`
- `src/features/orders/pages/OrderDetailPage.tsx` — recipient phone in
  the address block, and the `DispatchPanel` after the summary

## The required constants update

`OrdersPage.tsx` hand-mirrors the backend's `OrderStatus` and
`OrderStatusTransitions`, with a comment saying it must be updated in
the same PR as any backend change. The backend's courier work changed
both, so this group applied:

- `OrderStatus` gains `'Returned'`
- `Paid` gains `'Shipped'` (backend task group 03)
- `Shipped` gains `'Returned'` (backend task group 04)
- `Returned: []` — terminal
- `statusBadgeClasses.Returned` and `ORDER_STATUSES` updated

`Returned` is deliberately **orange, not the neutral grey `Cancelled`
uses** — a returned parcel is the outcome that actually costs money and
must not blend into a merchant's own cancellation.

Left stale, the status `<select>` would have offered a wrong set and a
`Returned` order would have rendered with no badge class at all.

## Decisions

**The precondition mirror explains; it never authorizes.**
`dispatchBlockedReason` reproduces the backend's `DispatchPreconditions`
so an admin reads *why* an order cannot go out in plain words instead
of clicking and receiving a 400. The backend still checks all of it and
remains the only thing that decides. Same posture — and same
maintenance obligation — as `ALLOWED_TRANSITIONS`.

**A 404 from `GET /orders/{id}/consignment` is the normal
"not dispatched yet" case** and is swallowed into `null` rather than
surfacing as an error toast.

**Courier-reported and staff-recorded outcomes read differently
everywhere** — "Reported by courier" vs "Recorded by staff", per PRD
Feature 5 AC6. The delivery timeline also shows the courier's own
verbatim status word beside the mapped outcome, which is the only
record of what was actually reported if a mapping later proves wrong.

**Record Outcome appears only for a manual courier's in-flight
consignment.** An API courier reports its own outcomes and the backend
refuses a hand-set one.
