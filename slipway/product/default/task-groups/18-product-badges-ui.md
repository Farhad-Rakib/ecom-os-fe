# Task Group 18: Product Badges UI

## Features covered

9. Product Badges (New Arrival, Trending, Discount) (this repo's
   scope: the three admin toggles only — the `Product` entity change
   and public exposure are `ecom-os-be`'s Task Group 19)

## Tasks

- `src/features/catalog/pages/ProductsPage.tsx`:
  - `ProductDto` interface (76-104): add `isNewArrival: boolean;
    isTrending: boolean; isDiscounted: boolean`.
  - `ProductWriteDto`/`ProductUpdateDto` (167-194): add the same three
    fields — required, non-optional, matching every other boolean-ish
    field already on this DTO (the editor always submits full form
    state, not a partial patch).
  - No change to whatever this file uses for product **creation** —
    per `ecom-os-be` Task Group 19's design, badges are only settable
    once a product exists (via `PUT`), not at creation time.
- `src/features/catalog/pages/ProductEditorPage.tsx`:
  - `FormState` (145-170) and its `emptyForm`/`toFormState` mapping
    (172-204): add `isNewArrival`, `isTrending`, `isDiscounted`
    (booleans, default `false` in `emptyForm` — matches a brand-new
    product having no badges settable yet).
  - New "Badges" section: three independent checkboxes (New Arrival /
    Trending / Discount), placed as its own section immediately after
    Specifications (line ~521) and before Variants — a natural home
    since, like Specifications, it's a flat set of independent
    fields with no sub-structure, unlike the SEO & Shipping section
    which is edit-mode-only. Unlike SEO & Shipping, this section is
    **not** edit-mode-gated: since badges aren't creatable at POST time
    (server-side, they simply default to `false`), the checkboxes
    render for a new product too but have no effect until the first
    save creates the product — actually simplest and most consistent
    with this task group's own backend constraint is to gate the
    section the same way SEO & Shipping already is (`isEdit`-only,
    lines 599-646's existing precedent), since there is nothing
    meaningful to toggle before the product has an `id` to `PUT`
    against. Follow the existing `isEdit`-gating precedent.
  - `updateMutation`'s dto-build closure (266-294): add the three
    fields to the constructed `ProductUpdateDto`.

## API endpoints (consumed — owned by `ecom-os-be` Task Group 19)

| Method | Path | Used for |
|---|---|---|
| PUT | `/api/v{version}/products/{id}` | save badge toggles alongside the rest of the product form |
| GET | `/api/v{version}/products/{id}` | load current badge state |

## FE pages/components

- `ProductEditorPage.tsx` — new "Badges" section (edit-mode-only,
  three checkboxes), otherwise unchanged.
- `ProductsPage.tsx` — DTO interfaces extended only; no rendering
  change to the product list itself (badges have no list-view
  presentation requirement in this task group — visual styling is
  explicitly out of scope per the PRD, and there's no storefront
  frontend in this repo to render badges on anyway).

## DB design

N/A — this repo has no database. The schema change (`products` gaining
`is_new_arrival`/`is_trending`/`is_discounted`) is entirely
`ecom-os-be` Task Group 19's scope; this task group is a pure API
consumer.

## QA checklist

- The Badges section is visible when editing an existing product and
  absent when creating a new one (matching the `isEdit`-gating already
  used for SEO & Shipping).
- Toggling any combination of the three checkboxes and saving persists
  and reloads correctly.
- A freshly created product, before ever visiting the Badges section,
  shows all three unchecked once it becomes editable.
- `tsc --noEmit` and `vite build` are both clean; no other admin page's
  behavior changes as a result of this task group.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Exact checkbox labels/copy ("New Arrival" / "Trending" / "Discount"
  vs. slightly different admin-facing wording) are an implementation
  detail, not specified further here.
