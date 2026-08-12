# Implementation Report: Task Group 15 — Navigation Menus (variant: default)

## What changed

Frontend only — the backend (`StorefrontMenusController`, `storefront_menu_items` table, `MenuLocation` enum, `storefront-menus.manage` permission) was already implemented in `ecom-os-be`.

- `src/features/storefront/pages/StorefrontMenusPage.tsx` — **new**. Header/Footer as two tabs, each rendering a `MenuLocationPanel` that fetches the location's full flat item list (`GET /storefront/menus/{location}`) and assembles it client-side into a one-level tree (root items + a `parentItemId -> children` map), the same "flat rows, client assembles hierarchy" approach `CategoriesPage.tsx` uses per-level. Reuses Task Group 14's `LinkTargetPicker` with all 7 kinds enabled (`Taxonomy` and `ContentPage` on top of what Hero Banner allows), no `allowNone` (the backend's `MenuItemRequest.LinkTargetType` is a non-nullable field, so every item must carry an explicit kind).
- Per-item controls: up/down reorder among siblings (same full-array-swap pattern as `CategoryTreeLevel`), plus indent (nest a top-level item under its previous top-level sibling — blocked client-side with a toast if the item already has children of its own, since that would create 2 levels) and outdent (promote a child back to top level, inserted immediately after its former parent). Every structural change recomputes the *entire* location's `{id, parentItemId, displayOrder}` set and submits it in one call to the whole-tree-replace reorder endpoint, matching the API's documented contract (not a per-level partial update).
- Deleting an item whose `childrenByParent` count is non-zero shows a `ConfirmDialog` naming exactly how many children will also be removed (cascade, per the task group's own requirement), not a bare "are you sure."
- `src/app/router/index.tsx` — added `storefront/menus`, behind `<PermissionGuard permissions={['storefront-menus.manage']}>`.

## Tests added

No test runner configured in this repo (same known gap as prior task groups). Verified via `tsc --noEmit -p tsconfig.app.json` (clean) and `vite build` (clean).

## Deviations from the design

- **Indent/outdent are explicit buttons, not drag-and-drop** — the task group's own "Deferred" section recommended exactly this ("explicit buttons first... upgrade to drag-and-drop later if it's actually needed"), consistent with the same tradeoff already recorded for `CategoriesPage.tsx`'s and `AttributeSetBuilder`'s reordering.
- **Nesting-depth guard is duplicated client-side** (the indent button is only rendered on top-level rows at all, and clicking it further checks the target item has zero existing children before allowing the action) even though the backend's `MenuNestingPolicy` is the actual source of truth and will reject an invalid request either way. This is a UX improvement (fail before a round-trip, with a specific message) layered on top of the real server-side enforcement, not a replacement for it.
- The reorder payload's `displayOrder` values sent for newly-outdented items use a fractional sentinel (`parentIndex + 0.5`) purely to sort the item into the right position relative to existing siblings on the client before the whole set is renumbered to dense integers (`recomputePositions`) just before submission — the backend never sees a non-integer value.

## Blockers

None. Not exercised against a live backend in this pass — see Task Group 11's report for the same note on verification scope. Recommend a `/qa` pass, in particular: reparenting rejection when the chosen parent already has a parent itself, or when the item being moved already has children (AC covered client-side per above, but the server-side `MenuNestingPolicy` enforcement is what actually matters); deleting a parent cascades to children; and `targetMissing` for all 7 target kinds after deleting the thing a menu item points at (Task Group 15's checklist explicitly calls out testing every kind, not just the ones Task Group 14 already covered).
