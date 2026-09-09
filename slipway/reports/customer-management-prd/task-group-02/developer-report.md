# Task Group 02 — Recipient & Rating Surfaces — Developer Report

**Status:** complete. `tsc --noEmit` and `vite build` both clean.
Uncommitted on `dev`.

## Files added

- `src/features/customers/components/RatingBadge.tsx` — the **only**
  component in this repo that renders a rating
- `src/features/customers/pages/RecipientPage.tsx` — phone lookup +
  recipient view, `RecipientApi`/`recipientApi` (also owns the ratings
  batch call)

## Files changed

- `src/features/orders/pages/OrdersPage.tsx` — a Delivery rating
  column, fed by one batch request per page render
- `src/features/orders/pages/OrderDetailPage.tsx` — the rating beside
  the shipping address, and a "View history" link to the recipient page
- `src/app/router/index.tsx` — `recipients`
- (backend) `CustomerManagementModule` — a second `MenuDefinition` for
  Recipient Lookup, so the page is reachable from the sidebar rather
  than only by link

## `RatingBadge` renders three distinct states, never two

The PRD makes these acceptance criteria rather than styling, so they
are implemented once rather than at each of the three call sites:

1. **A real score** — `87% · 13/15 delivered`. The percentage never
   appears without its counts.
2. **Not enough history** — `Not enough history (2 of 3)`. Explicitly
   worded, visually distinct, never a blank or a zero.
3. **No delivery history at all** — for an order never dispatched. The
   backend returns *no entry* for these rather than a zero, and the
   component says so in words.

The failure being guarded against is an admin moving fast reading a
blank as "fine" and shipping a cash-on-delivery parcel to a serial
refuser. Three independent implementations would be three chances to
get one wrong.

## Decisions

**One batch request per page render.** `POST /admin/ratings/batch`
with every visible order id, keyed on those ids in the query key — the
endpoint exists precisely so the order list does not go N+1.

**The rating sits with the shipping address on the detail page**,
directly above the dispatch panel, because that is where the decision
is actually made.

**The phone is a query parameter throughout** — a leading `+` gets
mangled in a path segment.

**A 400 renders as a validation message on the lookup box**, distinct
from a valid number with no history (a 200 with an empty recipient).
`retry: false` on that query so an unreadable number is not retried.

**Nothing here blocks or warns on dispatch.** The rating is
informational in v1, per the PRD; the admin decides.
