# Task Group 02: Dispatch & Delivery Status on the Orders Pages

## Features covered

3. Dispatch & Delivery Status on the Orders Pages

## Tasks

**Hard build-order dependency on task group 01** — the courier picker
imports `CourierDto` and `courierApi` from `CouriersPage.tsx`.

- **Required maintenance update to `OrdersPage.tsx`'s hand-mirrored
  backend constants.** `courier-prd` and its task group 04 changed the
  backend's order lifecycle, and that file's own comment says this
  constant must be updated in the same PR:
  - `OrderStatus` gains `'Returned'`
  - `ALLOWED_TRANSITIONS.Paid` gains `'Shipped'`
  - `ALLOWED_TRANSITIONS.Shipped` gains `'Returned'`
  - `ALLOWED_TRANSITIONS.Returned = []` (terminal)
  - `statusBadgeClasses.Returned` and `ORDER_STATUSES` updated
  Without this the status `<select>` offers a stale set and a
  `Returned` order renders with no badge class.
- New `ConsignmentDto` + `consignmentApi` (a second `BaseRepository`
  class in the courier feature area, since its routes hang off
  `/orders/{id}/dispatch` and `/consignments`, not `/couriers`).
- A **Dispatch** section on `OrderDetailPage.tsx`:
  - When no consignment exists and the order is dispatchable: a
    courier `<select>` (active couriers only), optional note, optional
    COD override defaulting to the order total, and a Dispatch button.
  - When the chosen courier is `Manual`: a tracking-id input instead,
    posting to `/dispatch/manual`.
  - When a consignment exists: consignment id, tracking code, courier
    name, dispatched-at, current outcome, and whether the outcome came
    from the courier or a person.
  - The delivery event timeline from `GET /consignments/{id}/events`.
  - For a `Manual` courier's in-flight consignment: a Record Outcome
    control (Delivered / Returned).
- **The Dispatch button is disabled with the reason stated** whenever
  the backend would refuse — no recipient phone, order not in
  `Paid`/`Processing`, or the order is externally sourced. The
  preconditions are mirrored client-side to explain, never to
  authorize; the backend still validates.
- `OrdersPage.tsx` list: a small delivery-outcome badge in the status
  column for orders whose consignment has settled.

## API endpoints consumed

| Method | Path | Purpose |
|---|---|---|
| POST | `/orders/{id}/dispatch` | dispatch via connected courier |
| POST | `/orders/{id}/dispatch/manual` | record a manual consignment |
| GET | `/orders/{id}/consignment` | 404 when never dispatched |
| GET | `/consignments/{id}/events` | delivery timeline |
| POST | `/consignments/{id}/outcome` | manual couriers only |

A 404 from `/consignment` is the normal "not dispatched yet" case and
must not surface as an error toast.

## FE pages/components

- `OrderDetailPage.tsx` (changed) — new Dispatch section, additive,
  placed after the existing status-update section.
- `OrdersPage.tsx` (changed) — the constants above, plus a delivery
  badge; `OrderDetailDto` gains `shippingAddress.recipientPhone`.

## DB design

N/A.

## QA checklist

- An order with no recipient phone shows Dispatch disabled with that
  reason, and the button cannot be clicked.
- An already-dispatched order offers no second dispatch.
- A courier-side rejection (422) shows the courier's own message.
- A `Returned` order renders with a distinct badge, not an unstyled
  one.
- A never-dispatched order shows "not dispatched", not an error.
- A courier-reported outcome is visibly distinguishable from an
  admin-set status.
- Typecheck and build clean.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the delivery timeline is always expanded or collapsible.
