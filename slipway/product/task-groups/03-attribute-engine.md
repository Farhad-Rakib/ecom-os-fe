# Task Group 03: Attribute Engine

## Features covered

3. Configurable Attribute Sets

## Tasks

- Domain entities: `AttributeGroup`, `AttributeDefinition`, `AttributeOption`, `AttributeSet`, `AttributeSetAttribute`, `ProductAttributeValue`
- `ALTER TABLE categories ADD attribute_set_id`, `ALTER TABLE products ADD attribute_set_id` (override)
- Dynamic-schema resolution endpoint the product editor renders against
- `AttributesController`, `AttributeSetsController`
- Permission `catalog-attributes.manage`
- Admin FE: attribute manager, attribute-set builder, and a new dynamic value-form component consumed by `ProductEditorPage`

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/attributes` | — | `ApiResponse<AttributeDefinition[]>` |
| POST | `/api/v1/attributes` | `{ attributeGroupId, code, name, dataType, unit?, isVariantDefining, isFilterable, isSearchable, isComparable, isRequired, validationRegex?, minValue?, maxValue? }` | `ApiResponse<AttributeDefinition>` |
| PUT | `/api/v1/attributes/{id}` | same shape | `ApiResponse<AttributeDefinition>` |
| GET/POST | `/api/v1/attributes/{id}/options` | `{ value, label, swatchHex?, imageUrl? }` | `ApiResponse<AttributeOption[]>` |
| PUT/DELETE | `/api/v1/attributes/{id}/options/{optionId}` | — | `ApiResponse<AttributeOption>` / `NoContent` |
| GET/POST | `/api/v1/attribute-sets` | `{ name, productTypeId }` | `ApiResponse<AttributeSet[]>` |
| PUT | `/api/v1/attribute-sets/{id}` | — | `ApiResponse<AttributeSet>` |
| PUT | `/api/v1/attribute-sets/{id}/attributes` | `{ members: [{ attributeDefinitionId, displayOrder, isRequiredOverride? }] }` (bulk replace) | `ApiResponse<AttributeSet>` |
| GET | `/api/v1/categories/{id}/effective-attribute-set` | — | `ApiResponse<AttributeSet>` — category default |
| GET | `/api/v1/products/{id}/attribute-values` | — | `ApiResponse<ProductAttributeValueSet>` — shaped for the dynamic form |
| PUT | `/api/v1/products/{id}/attribute-values` | `{ values: [{ attributeDefinitionId, variantId?, value }] }` (bulk) | `ApiResponse<ProductAttributeValueSet>` |

`[Authorize(Policy = Permissions.CatalogAttributesManage)]` at class level.

## FE pages/components

- `features/catalog/pages/AttributesPage.tsx` — `DataTable` + `DynamicForm` modal (data type, unit, flags are a flat field list — fits the generic form directly).
- `features/catalog/pages/AttributeSetsPage.tsx` — **new** `AttributeSetBuilder` component: assign attributes to a set with drag-reorder and per-member required override. `DataTable`/`DynamicForm` don't cover ordered multi-select assignment.
- `ProductEditorPage.tsx` (Task Group 02) gains a "Specifications" section: fetches the effective attribute set for the product's category (or its own override) and renders one control per attribute via a **new** `AttributeValueForm` component that maps `dataType` → control (Select/MultiSelect from `attribute_options`, swatch picker for Color, numeric input with unit suffix for Measurement, rich text for RichText, etc.). This is schema-driven at runtime, which is exactly what `DynamicForm`'s build-time field array can't express — see `decisions.md`.

## DB design

Depends on Task Group 01 (`categories`) and Task Group 02 (`products`) for the `ALTER TABLE` statements.

- `attribute_groups` (id, tenant_id, code, name, display_order)
- `attribute_definitions` (id, tenant_id, attribute_group_id → attribute_groups, code, name, data_type, unit nullable, is_variant_defining, is_filterable, is_searchable, is_comparable, is_required, validation_regex nullable, min_value nullable, max_value nullable, display_order); unique `(tenant_id, code)`. **`tenant_id` is non-null — no platform-global attributes in v1**, see `decisions.md`.
- `attribute_options` (id, attribute_definition_id → attribute_definitions, value, label, swatch_hex nullable, image_url nullable, display_order); unique `(attribute_definition_id, value)`
- `attribute_sets` (id, tenant_id, name, product_type_id → product_types)
- `attribute_set_attributes` (id, attribute_set_id → attribute_sets, attribute_definition_id → attribute_definitions, display_order, is_required_override nullable); unique `(attribute_set_id, attribute_definition_id)`
- `product_attribute_values` (id, tenant_id, product_id nullable, product_variant_id nullable, attribute_definition_id → attribute_definitions, text_value nullable, number_value nullable, bool_value nullable, date_value nullable, attribute_option_id nullable); check constraint: exactly one of `product_id` / `product_variant_id` is non-null; app-level validation that exactly one typed-value column is populated, matching the attribute's `data_type`
- `ALTER TABLE categories ADD COLUMN attribute_set_id BIGINT NULL` → `attribute_sets(id)`
- `ALTER TABLE products ADD COLUMN attribute_set_id BIGINT NULL` → `attribute_sets(id)` (null = inherit category default; set = explicit override)

## QA checklist

- Changing a category's attribute set doesn't delete a product's already-entered values for attributes still present in the new set; values for removed attributes are hidden, not deleted, and reappear if the attribute is re-added.
- A Decimal attribute rejects non-numeric input both client- and server-side, respecting `minValue`/`maxValue`.
- Two attribute definitions in the same tenant can't share a `code`.
- Deleting/deactivating an attribute still referenced by `product_attribute_values` on a Published product doesn't orphan those rows or break the product's storefront rendering.
- A product-level `attribute_set_id` override actually overrides its category's default in the editor and in `effective-attribute-set` resolution.

## Blocking open questions

None — the platform-global-attribute question is resolved (not supported in v1) and recorded in `decisions.md`.

## Deferred / safe-to-resolve-during-implementation

- Attribute deletion policy: hard-block if referenced anywhere, vs. soft-deactivate (`is_active` flag) and hide from new forms while preserving history. Default to soft-deactivate as the less destructive option; confirm during implementation.
