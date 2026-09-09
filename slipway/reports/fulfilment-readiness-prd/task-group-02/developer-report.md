# Implementation Report: Task Group 02 — Stock Movement Visibility (variant: fulfilment-readiness-prd)

## What changed

- `catalog/components/StockMovementsDrawer.tsx` — **new**. Per-variant history: movement type in
  the merchant's words, both deltas, the warehouse, the reason, and the originating order as a link
  to its detail. Paged.
- `catalog/pages/InventoryPage.tsx` — a "Stock history" row action; `Reserved` highlighted when
  non-zero rather than reading as a permanently-zero column; and **available quantity rendered as
  negative and flagged "oversold"** rather than clamped.

## Verification

`npm run typecheck` and `npm run build` clean; the new file lints with zero errors.

## Deviations from the design

1. **Manual corrections are distinguished by colour and label** rather than a separate section — a
   single chronological list is what actually answers "why is this number what it is", and splitting
   it would hide the interleaving.
2. **The backorder indicator needed a new backend field, added in a follow-up.** The stock ledger
   recorded a backordered line only in its `Reason`, with nothing on `OrderDetailDto` for the order
   view to read. Rather than deriving it per read, `OrderLineItem.IsBackordered` is now set at
   reservation time and returned on the DTO — the fact belongs to what was promised to the buyer,
   and must stay true after an admin corrects the inventory that caused it. The badge sits on the
   line, not as an order-level banner, because fulfilment staff need to know *which* item they
   cannot pick. **FE Feature 2 AC6 is now met.**

## Blockers

None.
