# Implementation Report: Task Group 13 — Product Showcases (Collections) (variant: default)

## What changed

Frontend only — the backend (`CollectionsController`, `storefront.product_collections`/`product_collection_items` tables, `storefront-collections.manage` permission) was already implemented in `ecom-os-be`.

- `src/features/storefront/pages/CollectionsPage.tsx` — **new**. `DataTable` list (name, item count) with Create/Rename/Delete, same `DataTable` + modal-form pattern as Catalog's `BrandsPage.tsx`. `CollectionApi` exported for reuse by the editor page and by `LinkTargetPicker` (Task Group 14).
- `src/features/storefront/pages/CollectionEditorPage.tsx` — **new**. Per-collection view: a product search-and-add (`Autocomplete` driven by `productApi.getPaged({ search })`, same composition as Catalog's `RelatedProductsEditor` in `MerchandisingSections.tsx`) plus a reorderable list of already-added products using up/down buttons (same full-sibling-array-swap pattern as `CategoriesPage.tsx`'s `CategoryTreeLevel`).
- `src/app/router/index.tsx` — added `storefront/collections`, `storefront/collections/:id`, behind `<PermissionGuard permissions={['storefront-collections.manage']}>`.

## Tests added

No test runner configured in this repo (same known gap as prior task groups). Verified via `tsc --noEmit -p tsconfig.app.json` (clean) and `vite build` (clean).

## Deviations from the design

- The list page exposes **three** row actions (Manage Products, Rename, Delete) rather than folding Rename into the "Manage Products" navigation target, since the task group's spec explicitly calls for "Create/Rename/Delete following the same `DataTable` + modal-form pattern as `BrandsPage.tsx`" — `BrandsPage.tsx` renames inline via a modal without leaving the list, which this preserves.
- The product search-and-add in `CollectionEditorPage.tsx` reimplements a small local `useProductSearchOptions`-style hook rather than importing Catalog's own (in `MerchandisingSections.tsx`), because that hook is private (not exported) and shaped around excluding a single product (bundle/relation editing context) rather than excluding every already-added collection member. Narrow, same composition, no behavior difference.

## Blockers

None. Not exercised against a live backend in this pass — see Task Group 11's report for the same note on verification scope. Recommend a `/qa` pass, in particular around the 409-duplicate-item and 404-deleted-product paths (AC5/AC6 in the task group's own checklist), and confirming a product removed from Catalog silently drops out of `GetCollectionItems` rather than showing a broken row (the "Resolved during implementation" note in the task group spec).
