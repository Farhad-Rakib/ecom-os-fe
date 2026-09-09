# Task Group 02: Stock Movement Visibility

## Features covered

2. Stock Movement Visibility

Depends on backend task group 02.

## Tasks

- **New** `StockMovementsDrawer.tsx` (`src/features/catalog/`) — the
  per-variant movement history: movement type, quantity and reserved
  deltas, resulting quantities, the originating order as a link to
  its detail, the reason, timestamp and actor. Paged off
  `GET /inventory/{variantId}/movements`.
- `InventoryPage.tsx` — a History row action opening the drawer;
  `Reserved` promoted to a real column beside on-hand and available.
- **Negative availability renders as negative and is flagged**, not
  clamped to zero. A Shopify-synced oversell is now a state the admin
  must be able to see; hiding it would make the one case this
  visibility exists for invisible.
- A visual distinction between order-driven movements and manual
  admin corrections, so a merchant can tell at a glance which part of
  a quantity they caused themselves.
- `OrderDetailPage.tsx` — a backorder indicator on any line accepted
  short of stock.

## API endpoints consumed

`GET /inventory/{variantId}/movements`; existing inventory reads,
which now return non-zero `quantityReserved`.

## FE pages/components

Listed under Tasks — this group is entirely FE.

## DB design

N/A.

## QA checklist

- A variant with a full lifecycle behind it (ordered, shipped,
  returned) shows three distinct movements, and their deltas add up to
  the displayed quantities.
- Each order-driven row links to an order the user can actually open.
- A manual correction is visibly distinct from an order-driven
  movement.
- A variant driven negative by a synced order shows a negative
  available quantity, flagged, on both the list and the drawer.
- A variant with inventory tracking off shows no movements and no
  error.
- An empty movement history renders an empty state, not a spinner.
- Light and dark themes; the drawer scrolls on a narrow viewport.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the drawer filters by warehouse. Useful for a
  multi-warehouse tenant; not required by any acceptance criterion.
