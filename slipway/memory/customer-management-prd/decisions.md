# Decisions

## 2026-09-08 — plan-product — mirrored, split by dependency

New variant `customer-management-prd` mirrored from `ecom-os-be`'s,
which folds the delivery rating in rather than giving it its own
variant (user decision — the rating has no surface of its own; it is a
property of a recipient, and the recipient view is a customer-
management screen).

**This repo's variant is split by backend dependency, deliberately.**
Features 1-2 (customer directory, account status) need only the
customer admin endpoints and can ship as soon as those exist. Feature
3 (recipient view + rating) cannot begin until `courier-prd` is
shipped end to end, because there are no real delivery outcomes to
display before it. `/shape-spec` must not group them into one block.

**The rating's presentation is an acceptance criterion, not styling.**
Never a bare percentage; always the delivered/returned/decided counts
beside it; and "insufficient history" must be visibly and textually
distinct from a poor ratio. A blank or a dash reads as "fine" to
someone moving fast, and the cost of that misread is a parcel shipped
to a serial refuser. Carried directly from the backend PRD.

**Rating surfaces are additive edits to `order-management-prd`'s
pages**, matching `store-sync-prd`'s `SyncedBadge` precedent on those
same files.

## 2026-09-08 — shape-spec — two groups

`01-customer-directory-ui` (Features 1-2) and
`02-recipient-and-rating-ui` (Feature 3). Group 02 depends on
`courier-prd`'s FE task group 02 because both edit
`OrdersPage.tsx`/`OrderDetailPage.tsx`, and sequencing them avoids two
groups rewriting the same two files.

**The presentation rules live in one component, not in each call
site.** `RatingBadge` is the only thing that renders a rating anywhere
in this repo. The PRD makes "never a bare percentage", "counts always
beside the ratio", and "insufficient history visibly distinct from a
poor score" acceptance criteria rather than styling, and three call
sites each implementing them independently is three chances to get one
wrong. The backend's DTO already makes the counts inseparable from the
ratio; this is the same guarantee at the render layer.

**Three distinct states, never two.** A poor score, "not enough history
yet", and "no delivery history at all" must each read differently. The
failure mode the PRD is guarding against is a tired admin reading a
blank as "fine" and shipping to a serial refuser.

**One batch call per page render.** `POST /admin/ratings/batch` with
the visible order ids, never a request per row — the endpoint exists
precisely so the order list does not go N+1.
