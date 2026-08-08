# Task Group 13: Product Showcases (Collections)

## Features covered

3. Product Showcases (Collections)

## Tasks

- Domain entities `ProductCollection` (tenant-scoped) and `ProductCollectionItem` (join row: collection + product + display order).
- EF configuration, repository, migration. **Revised from the original design**: Storefront Configuration is built as CQRS slices inside the existing `EcomOs.Application`/`EcomOs.Persistence` projects (vertical-slice architecture, no per-module project), with its own `StorefrontDbContext`/`storefront` schema, separate from Catalog's `ApplicationDbContext`/`public` schema. `ProductCollectionItem.ProductId` is therefore a plain scalar column with **no database foreign key** — it's a soft reference, validated at write time via `ProductExistsQuery` (`EcomOs.Application.Contracts.Catalog`, dispatched through MediatR) instead of a join. `StorefrontConfigModule.cs` still declares `Dependencies: ["catalog"]`, now because Collections/Hero Banner/Menus resolve Product/Category/Brand/Taxonomy targets through Catalog's Contracts queries, not because of a DB-level FK. See "Deferred" below for the resulting read-time behavior when a member product is deleted.
- `CollectionsController`.
- Permission `storefront-collections.manage`.
- Add this group's permission + a "Collections" menu entry (parented under "Storefront") to `StorefrontConfigModule.cs`.
- Admin FE: a list page for collections plus a per-collection product picker/reorder view.

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/collections` | — | `ApiResponse<CollectionDto[]>` |
| GET | `/api/v1/collections/{id}` | — | `ApiResponse<CollectionDto>` |
| POST | `/api/v1/collections` | `{ name }` | `ApiResponse<CollectionDto>` |
| PUT | `/api/v1/collections/{id}` | `{ name }` | `ApiResponse<CollectionDto>` |
| DELETE | `/api/v1/collections/{id}` | — | `NoContent` |
| GET | `/api/v1/collections/{id}/items` | — | `ApiResponse<CollectionItemDto[]>` (ordered, includes product name/SKU/thumbnail for display) |
| POST | `/api/v1/collections/{id}/items` | `{ productId }` | `ApiResponse<CollectionItemDto>` |
| DELETE | `/api/v1/collections/{id}/items/{productId}` | — | `NoContent` |
| POST | `/api/v1/collections/{id}/items/reorder` | `{ productIdsInOrder: long[] }` | `NoContent` |

All `[Authorize(Policy = Permissions.StorefrontCollectionsManage)]`. `POST .../items` with a `productId` already in the collection is a 409, not a silent duplicate.

## FE pages/components

- `features/storefront/pages/CollectionsPage.tsx` — **new**. `DataTable` list (name, item count) with Create/Rename/Delete, following the same `DataTable` + modal-form pattern as `BrandsPage.tsx`.
- `features/storefront/pages/CollectionEditorPage.tsx` — **new**. Per-collection view: a product search/picker (reuses the search-and-add interaction `CategoryPicker` in `ProductEditorPage.tsx` already established, backed by the existing `GET /products?search=` endpoint) plus a reorderable list of already-added products (up/down controls, same as `CategoryTreeLevel`'s sibling reorder in `CategoriesPage.tsx`).
- Router: `/storefront/collections`, `/storefront/collections/:id`, wrapped in `<PermissionGuard permissions={['storefront-collections.manage']}>`.

## DB design

Depends on Catalog's `products` table (already exists, Task Group 02) for the soft item reference — no dependency on any other group *in this PRD*.

- `storefront.product_collections` (id, tenant_id, name, created_at, created_by, updated_by, updated_at)
- `storefront.product_collection_items` (id, tenant_id, collection_id → product_collections [cascade delete, real FK — same schema/module], product_id [plain bigint, **no FK** — see Tasks], display_order); unique `(collection_id, product_id)`

## QA checklist

- Removing a product from a collection does not delete the product itself.
- The same product can belong to two or more different collections simultaneously.
- Deleting a collection removes its item rows (cascade) but never touches the referenced products.
- Reordering items within a collection persists across reload.
- Adding a product that's already in the collection is rejected (409), not duplicated.
- Adding a product that doesn't exist (or belongs to a different tenant) is rejected (404) via `ProductExistsQuery`, not inserted.
- Deleting a Catalog product that's currently a collection member does not throw — see "Resolved during implementation" below for the exact behavior (no DB error either way, since there's no FK to violate).

## Blocking open questions

None.

## Resolved during implementation

- **Delete policy when a member product is deleted, decided**: since `ProductId` carries no database foreign key (a consequence of the vertical-slice architecture pivot — Storefront Configuration and Catalog now live in separate `DbContext`s/schemas within the same database, so no single FK constraint could span them even if wanted), there is no DB-level cascade to configure. A deleted product's collection-membership rows are **not** cleaned up eagerly; instead `GetCollectionItems` resolves membership against Catalog's Contracts query (`GetProductShowcaseSummariesQuery`) at read time and **silently omits** any item whose product no longer resolves, rather than showing a broken row or a `targetMissing` placeholder (unlike Hero Banner/Menu links, a showcase entry for a product that no longer exists isn't useful to display at all). The underlying `product_collection_items` row is left in place rather than deleted, matching this codebase's existing "don't clean up on the read path" convention (e.g. `ProductService.DeleteMediaAsync` also leaves the underlying file in place). See `slipway/memory/default/decisions.md`.
