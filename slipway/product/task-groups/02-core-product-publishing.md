# Task Group 02: Core Product & Publishing

## Features covered

2. Core Product Record & Publishing

## Tasks

- Domain entities: `ProductType` (platform-seeded, not tenant-scoped), `Product`, `ProductVariant` (single default variant only — multi-variant matrix is Task Group 04), `ProductMedia`, `ProductCategory` join
- Publish validation (name + price + ≥1 image) and status transitions
- `ProductsController`
- Permissions `catalog-products.manage`, `catalog-products.publish`
- Admin FE: product list + a bespoke product editor shell that later groups extend

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/products?status=&categoryId=&brandId=&search=&page=&pageSize=` | — | `ApiResponse<PagedResult<Product>>` |
| GET | `/api/v1/products/{id}` | — | `ApiResponse<Product>` |
| POST | `/api/v1/products` | `{ sku, slug, name, shortDescription, description, brandId?, productTypeId, categoryIds[], primaryCategoryId }` | `ApiResponse<Product>` |
| PUT | `/api/v1/products/{id}` | same shape + SEO fields | `ApiResponse<Product>` |
| POST | `/api/v1/products/{id}/publish` | — | `ApiResponse<Product>`, `400` listing every missing requirement if invalid |
| POST | `/api/v1/products/{id}/archive` | — | `ApiResponse<Product>` |
| DELETE | `/api/v1/products/{id}` | — | `NoContent`, `409` unless status is Draft or Archived |
| POST | `/api/v1/products/{id}/media` | multipart file + `{ altText, displayOrder }` | `ApiResponse<ProductMedia>` |
| DELETE | `/api/v1/products/{id}/media/{mediaId}` | — | `NoContent` |

`[Authorize(Policy = Permissions.CatalogProductsManage)]` at class level; `publish` action additionally requires `Permissions.CatalogProductsPublish`.

## FE pages/components

- `features/catalog/pages/ProductsPage.tsx` — `DataTable` (columns: name, sku, status pill, price, stock, category), filters, Publish/Archive row actions.
- `features/catalog/pages/ProductEditorPage.tsx` — **new, bespoke page, not `DynamicForm`.** Sectioned layout (Basic Info, Media gallery, Category/Brand, SEO, Publish panel with inline per-requirement validation). Built with an extensible "sections" structure that Task Groups 03/04 add to (Specifications, Variants) rather than duplicating the shell — see `decisions.md` for why this isn't `DynamicForm`.
- Router: `/catalog/products`, `/catalog/products/new`, `/catalog/products/:id`, wrapped in `<PermissionGuard permissions={['catalog-products.manage']}>`; the Publish action additionally checks `catalog-products.publish` client-side (server is the real gate).

## DB design

Depends on Task Group 01 (`categories`, `brands` must exist for FKs).

- `product_types` (id, code, name, supports_variants, is_digital, is_bundle, is_service) — platform-seeded rows (`simple`, `variant`, `bundle`, `digital`, `service`) via the existing `Seeding` pattern; **not** `ITenantEntity` — a fixed capability enum, not tenant data.
- `products` (id, tenant_id, sku, slug, name, short_description, description, brand_id → brands nullable, product_type_id → product_types, status, tax_class_id nullable [FK constraint added in Task Group 06], country_of_origin, weight_kg, length_cm, width_cm, height_cm, shipping_class, seo_title, seo_description, canonical_url, avg_rating decimal default 0, review_count int default 0, published_at_utc nullable); unique `(tenant_id, slug)`
- `product_variants` (id, tenant_id, product_id → products, sku, barcode, is_default, status, base_price, compare_at_price nullable, cost_price nullable, currency, weight_kg/length/width/height nullable [inherit from product when null], track_inventory, **quantity_on_hand** [temporary single-number stock, see note]); unique `(tenant_id, sku)`
- `product_media` (id, product_id → products, product_variant_id nullable, type, url, alt_text, display_order, is_primary)
- `product_categories` (id, product_id → products, category_id → categories, is_primary); unique `(product_id, category_id)`, plus a filtered/partial unique index enforcing exactly one `is_primary = true` row per product on both Postgres and SqlServer

`product_variants.quantity_on_hand` is a **deliberate temporary field** — Task Group 05 replaces it with per-warehouse `inventory_items` and drops this column, backfilling into a default warehouse. See `decisions.md`.

## QA checklist

- Publish is rejected with the specific missing field(s) named (e.g. "price required", "at least one image required"), not a generic error.
- A slug freed by deleting or renaming a product can be reused within the same tenant.
- Uploading a non-image file to the media gallery is rejected both client- and server-side.
- Editing a Published product's fields does not change its status or `published_at_utc`.
- A product can be listed under 2+ categories with exactly one `is_primary = true`; attempting to set a second primary is rejected, not silently overwritten.

## Blocking open questions

- Should Publish really require a separate `catalog-products.publish` permission from `catalog-products.manage`, or is that more granularity than the PRD asked for? Every existing controller in this codebase uses one policy per controller. Recommendation: keep them separate — this is the platform's first draft/approve merchandising workflow — but confirm before implementation since Task Groups 04, 07, and 09 assume both permissions exist in the seed data.

## Deferred / safe-to-resolve-during-implementation

- File storage backend for `product_media.url` (local disk vs. object storage) — default to local disk behind a storage interface, so it can swap later without an API change.
