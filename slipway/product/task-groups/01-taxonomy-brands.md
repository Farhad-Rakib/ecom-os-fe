# Task Group 01: Taxonomy & Brands

## Features covered

1. Category & Brand Taxonomy

## Tasks

- Domain entities: `Taxonomy`, `Category` (self-referencing), `Brand`
- EF configurations, repositories, migration
- `TaxonomiesController`, `CategoriesController`, `BrandsController`
- Permission `catalog-taxonomy.manage`
- Admin FE: taxonomy list, category tree, brand list

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/taxonomies` | — | `ApiResponse<Taxonomy[]>` |
| POST | `/api/v1/taxonomies` | `{ key, name }` | `ApiResponse<Taxonomy>` |
| GET | `/api/v1/categories?taxonomyId=&parentCategoryId=&page=&pageSize=` | — | `ApiResponse<PagedResult<Category>>` |
| GET | `/api/v1/categories/{id}` | — | `ApiResponse<Category>` |
| POST | `/api/v1/categories` | `{ taxonomyId, parentCategoryId?, slug, name, description, imageUrl, seoTitle, seoDescription }` | `ApiResponse<Category>` |
| PUT | `/api/v1/categories/{id}` | same shape | `ApiResponse<Category>` |
| POST | `/api/v1/categories/{id}/reorder` | `{ siblingIdsInOrder: long[] }` | `NoContent` |
| DELETE | `/api/v1/categories/{id}` | — | `NoContent`, `409` if products or child categories attached |
| GET | `/api/v1/brands?page=&pageSize=&search=` | — | `ApiResponse<PagedResult<Brand>>` |
| POST | `/api/v1/brands` | `{ slug, name, logoUrl, description, countryOfOrigin, websiteUrl }` | `ApiResponse<Brand>` |
| PUT | `/api/v1/brands/{id}` | same shape | `ApiResponse<Brand>` |
| DELETE | `/api/v1/brands/{id}` | — | `NoContent`, `409` if products attached |

All controllers `[Authorize(Policy = Permissions.CatalogTaxonomyManage)]` at class level, matching `TenantsController`'s single-policy-per-controller pattern.

## FE pages/components

- `features/catalog/pages/TaxonomiesPage.tsx` — `DataTable` list + `DynamicForm` modal for create (fits the generic pattern directly).
- `features/catalog/pages/CategoriesPage.tsx` — **new** `CategoryTree` component (expandable, drag-to-reorder). `DataTable` doesn't support hierarchical rows, so this is a one-off tree component, not a `DataTable` configuration.
- `features/catalog/pages/BrandsPage.tsx` — `DataTable` + `DynamicForm` modal (fits the generic pattern directly).
- Router: `/catalog/taxonomies`, `/catalog/categories`, `/catalog/brands`, each wrapped in `<PermissionGuard permissions={['catalog-taxonomy.manage']}>`.
- New `Menu` entries for a "Catalog" nav section (Categories, Brands) — data-driven via the existing `Menu` entity, no new code needed for the entry itself.

## DB design

No dependency — first group.

- `taxonomies` (id, tenant_id, key, name)
- `categories` (id, tenant_id, taxonomy_id → taxonomies, parent_category_id → categories nullable, slug, name, description, image_url, display_order, is_active, seo_title, seo_description); unique `(tenant_id, taxonomy_id, slug)`
- `brands` (id, tenant_id, slug, name, logo_url, description, country_of_origin, website_url, is_active); unique `(tenant_id, slug)`

`categories.attribute_set_id` is **not** added here — Task Group 03 adds it via `ALTER TABLE` once `attribute_sets` exists, avoiding a dangling unused FK column for two groups.

## QA checklist

- Reordering categories persists across reload and is reflected in list-endpoint ordering.
- Deleting a taxonomy that still has categories is blocked, same as deleting a category with products attached.
- Slug uniqueness is scoped per tenant + taxonomy, not global — two tenants (or two taxonomies) can both have a `shoes` category.
- Assigning a category as its own ancestor (direct or transitive) is rejected with a clear error, not a silent infinite loop in tree rendering.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether read-only catalog access needs a separate `.view` permission from `.manage`, or any authenticated tenant admin can view — default to a single `catalog-taxonomy.manage` gating both, matching the existing single-policy-per-controller convention.
- `CategoryTree` is built as a one-off component for this group; only generalize a reusable hierarchical table if a second tree-shaped feature appears later.
