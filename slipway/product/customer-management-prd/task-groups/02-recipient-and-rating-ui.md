# Task Group 02: Recipient & Rating Surfaces

## Features covered

3. Recipient & Rating Surfaces

## Tasks

**Depends on `courier-prd`'s FE task group 02** (it edits the same two
Orders files) and on task group 01 here (shares the customers feature
area).

- New `src/features/customers/pages/RecipientPage.tsx` — phone lookup
  box plus the recipient view: normalized phone, names ordered under,
  linked account (if any), the rating, and the orders behind it with
  each one's delivery outcome.
- New shared `RatingBadge` component in
  `src/features/customers/components/RatingBadge.tsx`, exported for the
  Orders pages to import.
- `RatingBadge` **enforces the PRD's presentation rules in one place**:
  - never a bare percentage — always the delivered/returned/decided
    counts alongside
  - `hasSufficientHistory: false` renders as an explicit
    "Not enough history (n of m)" chip, visually distinct from a low
    score and never blank, a dash, or a zero
  - a missing rating entirely (order never dispatched) renders as
    "No delivery history", again distinct from both
- `OrdersPage.tsx`: one `POST /admin/ratings/batch` call per page
  render with the visible order ids, never per-row. Ratings render in
  a new column.
- `OrderDetailPage.tsx`: the recipient's rating beside the shipping
  address, linking to the recipient page for that phone.
- Route `recipients` under
  `<PermissionGuard permissions={['customers.manage']}>`.

## API endpoints consumed

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/recipients?phone=...` | recipient view + rating + orders |
| POST | `/admin/ratings/batch` | `{ orderIds }` → ratings by order id |

The phone is a **query parameter**, not a path segment — a leading `+`
gets mangled in a path.

A 400 from `/admin/recipients` means the phone was unreadable and must
be shown as a validation message on the lookup box, distinct from a
valid number with no history (which returns 200 with an empty
recipient).

## FE pages/components

- `RecipientPage.tsx` (new), `RatingBadge.tsx` (new)
- `OrdersPage.tsx` / `OrderDetailPage.tsx` (changed, additive)

## DB design

N/A.

## QA checklist

- A recipient with 2 decided orders (threshold 3) reads as
  "not enough history", and a recipient with 3 returns reads as a poor
  score — the two are unmistakable side by side.
- An order with no settled delivery shows "No delivery history", not a
  zero.
- The orders listed on the recipient page reconcile with the counts in
  its rating badge.
- The order list issues exactly one ratings request per page render.
- An unreadable phone shows a validation message, not an empty
  recipient.
- Nothing in this group blocks or warns on dispatch — the rating is
  informational.
- Typecheck and build clean.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether to also show the rating on `CustomerDetailPage.tsx` — the
  backend links a customer to a phone, so it is available; decide in
  build.
