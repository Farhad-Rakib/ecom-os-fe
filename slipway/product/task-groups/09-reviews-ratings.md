# Task Group 09: Reviews & Ratings

## Features covered

8. Localization & Reviews (reviews half — split from localization, see Task Group 08)

## Tasks

- Domain entity `Review`
- Rating aggregation onto `products.avg_rating` / `products.review_count` (columns already added in Task Group 02, unwritten until now)
- `ReviewsController` (admin moderation) + a public submission endpoint
- Permission `catalog-reviews.moderate` (admin-side only)

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/storefront/products/{id}/reviews` | `{ rating, title, body }` (+ submitter identity — see blocking question) | `ApiResponse<Review>`, status `Pending` |
| GET | `/api/v1/products/{id}/reviews?status=Pending` | — | `ApiResponse<Review[]>` — admin moderation queue |
| PUT | `/api/v1/reviews/{id}/approve` | — | `ApiResponse<Review>` — recalculates `avg_rating`/`review_count` |
| PUT | `/api/v1/reviews/{id}/reject` | — | `ApiResponse<Review>` |

Moderation endpoints `[Authorize(Policy = Permissions.CatalogReviewsModerate)]`. Submission endpoint's auth model is the blocking question below.

## FE pages/components

- `features/catalog/pages/ReviewsModerationPage.tsx` — `DataTable` (product, rating, excerpt, status) with Approve/Reject row actions.
- `ProductEditorPage.tsx` shows read-only `avg_rating`/`review_count` with a link into the moderation queue filtered to that product.

## DB design

Depends on Task Group 02 (`products.avg_rating`/`review_count` columns, added but unused until now).

- `reviews` (id, tenant_id, product_id → products, customer_id [**type undetermined, see blocking question**], rating smallint 1–5, title, body, verified_purchase default false, status [Pending/Approved/Rejected]); index `(product_id, status)`

## QA checklist

- A Rejected review never contributes to `avg_rating`/`review_count`.
- Rating recalculation is correct after an Approved review is later deleted (reviews are not editable post-submission by the submitter in v1 — only moderatable by admin).
- Submitting an out-of-range or non-integer rating is rejected server-side regardless of client-side validation.
- A Pending review is invisible on the product detail path even to a user who just submitted it.

## Blocking open questions

- **EcomOs has no shopper/customer identity model.** `User`/`Role`/`UserRole` are the platform's only identity entities, and they represent tenant staff/admins (people who log into the back-office), not storefront shoppers. The PRD's Feature 8 assumes a "customer" who submits a review and can be checked for "verified purchase" — neither concept exists yet. This blocks the group outright until one of these is decided:
  1. Build a real shopper/customer account system (arguably a missed PRD feature — recommend routing through `/scope-feature` rather than deciding it quietly here), or
  2. Ship reviews anonymous/email-attributed in v1, dropping "verified purchase" entirely (silently breaks AC2's implication if not explicitly re-scoped).
  Do not proceed on this group until the user picks one.

## Deferred / safe-to-resolve-during-implementation

- Review media attachments (photos) — not in the PRD's acceptance criteria, explicitly deferred.
