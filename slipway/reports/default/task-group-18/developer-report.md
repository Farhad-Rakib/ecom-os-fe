# Implementation Report: Task Group 18 — Product Badges UI (variant: default)

## What changed

- `src/features/catalog/pages/ProductsPage.tsx`: `ProductDto` and
  `ProductUpdateDto` both gain `isNewArrival: boolean`, `isTrending:
  boolean`, `isDiscounted: boolean`. `ProductWriteDto`/create payload
  unchanged — badges stay `PUT`-only, matching `ecom-os-be` Task Group
  19's design.
- `src/features/catalog/pages/ProductEditorPage.tsx`:
  - `FormState`/`emptyForm`/`toFormState`: added the three fields,
    defaulting `false`.
  - `updateMutation`'s `ProductUpdateDto` construction: added the
    three fields.
  - New "Badges" section (three checkboxes: New Arrival / Trending /
    Discount), placed immediately after Specifications and before
    Variants, gated `isEdit && productId !== undefined` — the same
    edit-mode-only precedent SEO & Shipping already uses, since badges
    have nothing to toggle before the product has an id to `PUT`
    against.

## Tests added

No test suite exists for this page (consistent with this repo's
established verification bar for Catalog/Storefront pages —
`tsc`/`vite build` only). Verified: `tsc --noEmit` clean, `vite build`
clean.

## Deviations from the design

None — implemented exactly as specified in
`slipway/product/default/task-groups/18-product-badges-ui.md`.

## Blockers

None. No live-backend click-through this pass (none available
in-session), consistent with this repo's established pattern for
Storefront/Catalog FE task groups.
