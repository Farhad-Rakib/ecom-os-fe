# Task Group 15: Navigation Menus

## Features covered

5. Navigation Menus

## Tasks

- Domain enum `MenuLocation { Header, Footer }` — deliberately just these two fixed values, not a generic named-location table, matching the PRD's explicit "two menu locations... extendable later, not built now."
- Domain entity `StorefrontMenuItem` (tenant-scoped): `Location` (`MenuLocation`), `ParentItemId?` (self-referencing FK), `Label`, `LinkTargetType` (reuses Task Group 14's enum — this group is the one that actually needs `Taxonomy`, on top of the `Category/Product/Brand/Collection/CustomUrl` set Task Group 14 already validated, plus `ContentPage` from Task Group 12), `LinkTargetId?`, `LinkCustomUrl?`, `DisplayOrder`. No separate "Menu" entity — a location's items are just every `StorefrontMenuItem` row with that `Location`, since there's exactly one menu per location (see Task above).
- **Nesting is capped at one level**: enforced in the service layer, not the schema — a `StorefrontMenuItem` whose `ParentItemId` is set must itself have no children (i.e. rejecting a write that would set `ParentItemId` on an item that already has at least one other item pointing at it as parent, and rejecting a write that sets `ParentItemId` to an item that itself already has a non-null `ParentItemId`).
- Deleting a parent item cascades to delete its children (DB-level `OnDelete(Cascade)` on the self-FK) — the FE must confirm before deleting an item that has children, so this isn't a surprise bulk delete (see FE section).
- Reuses Task Group 14's `LinkTargetId`-is-polymorphic-with-no-DB-FK approach and its `targetMissing` read-time resolution, extended to the two additional target kinds this group introduces (`Taxonomy`, `ContentPage`).
- EF configuration, repository, migration.
- `StorefrontMenusController`.
- Permission `storefront-menus.manage`.
- Add this group's permission + a "Menus" menu entry (parented under "Storefront") to `StorefrontConfigModule.cs`.
- Admin FE: two tree-editor views (Header, Footer), reusing Task Group 14's `LinkTargetPicker` component with `Taxonomy` and `ContentPage` (Task Group 12) enabled on top of what it already supports.

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/storefront/menus/{location}` | `location`: `header` \| `footer` | `ApiResponse<MenuItemDto[]>` (flat list with `parentItemId`; FE assembles the tree — same "flat rows, client assembles hierarchy" approach `CategoriesPage.tsx`'s tree already uses per-level) |
| POST | `/api/v1/storefront/menus/{location}/items` | `{ label, parentItemId?, linkTargetType, linkTargetId?, linkCustomUrl? }` | `ApiResponse<MenuItemDto>` |
| PUT | `/api/v1/storefront/menus/{location}/items/{id}` | same shape | `ApiResponse<MenuItemDto>` |
| DELETE | `/api/v1/storefront/menus/{location}/items/{id}` | — | `NoContent` (cascades to children — see Tasks) |
| POST | `/api/v1/storefront/menus/{location}/items/reorder` | `{ items: { id, parentItemId, displayOrder }[] }` — the whole location's tree in one call | `NoContent` |

All `[Authorize(Policy = Permissions.StorefrontMenusManage)]`. The reorder endpoint takes the *entire* location's item set in one call (not a single-level sibling list like Category's `reorder`) because Acceptance Criterion 4 requires moving an item between nesting levels, which a single-level reorder can't express — the whole-tree replace is simpler to reason about and implement correctly than a diff-based partial update.

## FE pages/components

- `features/storefront/pages/StorefrontMenusPage.tsx` — **new**. Header/Footer as two tabs or two side-by-side panels, each a nestable tree editor: add-item action (opens a form: label + Task Group 14's `LinkTargetPicker`, now with `Taxonomy` and `ContentPage` enabled), and per-item controls to move up/down among siblings and indent/outdent (promote to top level / demote under the previous sibling) — structurally an extension of `CategoriesPage.tsx`'s `CategoryTreeLevel` (which already has up/down reorder), adding the indent/outdent controls that component didn't need (Category's tree has unlimited depth via drill-down navigation, not sibling-level indent/outdent).
- Deleting an item that has children shows a confirmation naming how many children will also be removed (cascade — see Tasks), not a bare "are you sure."
- Router: `/storefront/menus`, wrapped in `<PermissionGuard permissions={['storefront-menus.manage']}>`.

## DB design

Depends on Task Group 12 (`content_pages`) and Task Group 13 (`product_collections`) existing for `ContentPage`- and `Collection`-typed items to be meaningfully validated/tested — not hard DB foreign keys (polymorphic, same as Task Group 14), so no strict migration-order requirement, but build after both.

- `storefront_menu_items` (id, tenant_id, location int, parent_item_id nullable bigint → storefront_menu_items [cascade delete], label varchar, link_target_type int, link_target_id nullable bigint, link_custom_url nullable varchar, display_order int, created_at, created_by, updated_by, updated_at)

## QA checklist

- Header and footer items are fully independent — creating/editing/deleting in one location never affects the other.
- An item that already has children cannot be re-parented under another item (would create 2 levels of nesting) — rejected with a clear error.
- An item cannot be given a parent that itself already has a parent (same 1-level cap, the other direction).
- Deleting a parent item deletes its children too, and the FE's confirmation names the count before it happens.
- Reordering — siblings, or moving an item to a different parent / to top level — persists exactly as submitted.
- `linkTargetType = Taxonomy` and `= ContentPage` are both accepted here even though Task Group 14 rejected them for the hero banner — confirms the per-feature subset restriction lives in each feature's own validation, not globally on the enum.
- `GET` returns `targetMissing: true` for any item whose Category/Taxonomy/Product/Brand/Collection/Page target has since been deleted, for every target kind this group adds, not just the ones Task Group 14 already covered.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Exact indent/outdent UI affordance (drag-and-drop vs. explicit buttons). Recommend explicit buttons first (matches `CategoriesPage.tsx`'s existing up/down-arrow pattern, no new drag-and-drop dependency) — upgrade to drag-and-drop later if it's actually needed, not preemptively.
