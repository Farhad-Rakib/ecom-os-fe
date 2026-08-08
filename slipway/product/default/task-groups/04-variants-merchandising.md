# Task Group 04: Variants & Merchandising Extras

## Features covered

4. Variants & Merchandising Extras

## Tasks

- Variant-matrix generation service driven by `is_variant_defining` attributes (application-service logic, not a new table)
- Domain entities: `ProductOption`, `ProductOptionValue`, `ProductBundleItem`, `ProductRelation`, `SizeChart`, `SizeChartRow`
- Extend `ProductsController`; new `SizeChartsController`
- Admin FE: variant matrix grid, options/bundles/relations sections in the product editor, size chart manager

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/products/{id}/variants/generate` | `{ selections: [{ attributeDefinitionId, optionIds: long[] }] }` | `ApiResponse<ProductVariant[]>` — Cartesian product, idempotent on existing combinations |
| PUT | `/api/v1/products/{id}/variants/{variantId}` | price/stock/images/status | `ApiResponse<ProductVariant>` |
| GET/POST | `/api/v1/products/{id}/options` | `{ name }` | `ApiResponse<ProductOption[]>` |
| PUT/DELETE | `/api/v1/products/{id}/options/{optionId}` | `{ name }` / — | — |
| POST/PUT/DELETE | `/api/v1/products/{id}/options/{optionId}/values` | `{ label, priceModifier, isDefault }` | `ApiResponse<ProductOptionValue>` |
| GET/POST/DELETE | `/api/v1/products/{id}/bundle-items` | `{ componentProductId, componentVariantId?, quantity, isOptional, priceOverride? }` | `ApiResponse<ProductBundleItem[]>` |
| GET/POST/DELETE | `/api/v1/products/{id}/relations` | `{ relatedProductId, relationType }` | `ApiResponse<ProductRelation[]>` |
| GET/POST/PUT/DELETE | `/api/v1/size-charts` (+ nested `/rows`) | `{ name, scopeCategoryId?, scopeBrandId?, rows: [{ sizeLabel, measurementsJson }] }` | `ApiResponse<SizeChart>` |

`[Authorize(Policy = Permissions.CatalogProductsManage)]` for all of the above, including size charts — authored from the same merchandising context as the product editor, not a separate admin area.

## FE pages/components

- `ProductEditorPage.tsx` gains a "Variants" section: **new** `VariantMatrixGrid` (columns = variant-defining attributes + price + stock + status; `DataTable` is reusable here once the generation call pre-computes rows) plus a "Generate variants" action — a picker of variant-defining attributes' options as checkboxes.
- `ProductEditorPage.tsx` gains an "Options & add-ons" section (`DynamicForm`-compatible repeatable field list) and a "Bundle items" / "Related products" section (product picker + `DataTable` of current selections).
- `features/catalog/pages/SizeChartsPage.tsx` — `DataTable` list + **new** `SizeChartRowsEditor` (inline-editable grid; columns vary per chart, so this isn't a static `DynamicForm`).

## DB design

Depends on Task Group 02 (`products`, `product_variants`) and Task Group 03 (`attribute_definitions`, `attribute_options` — variant generation reads these).

- `product_options` (id, product_id → products, name, display_order)
- `product_option_values` (id, product_option_id → product_options, label, price_modifier, is_default, display_order)
- `product_bundle_items` (id, bundle_product_id → products, component_product_id → products, component_variant_id nullable → product_variants, quantity, is_optional, price_override nullable)
- `product_relations` (id, product_id → products, related_product_id → products, relation_type, display_order); unique `(product_id, related_product_id, relation_type)`
- `size_charts` (id, tenant_id, name, scope_category_id nullable → categories, scope_brand_id nullable → brands)
- `size_chart_rows` (id, size_chart_id → size_charts, size_label, measurements_json)

## QA checklist

- Generating variants twice with an overlapping option selection doesn't duplicate existing SKU rows.
- Removing the last remaining variant of a Published product is blocked — a Published product must always have ≥1 variant.
- A bundle cannot include itself as a component, directly or transitively.
- A `ProductOptionValue.priceModifier` is present in the product's read model for Task Group 10 to surface — verified here at the data level, not the storefront display itself.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Bundle nesting (a bundle containing another bundle) — default to simple-products-only as bundle components in v1; reject a bundle used as a component. Revisit only if a real catalog needs nested kits.
