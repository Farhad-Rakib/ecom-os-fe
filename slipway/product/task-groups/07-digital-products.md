# Task Group 07: Digital Products

## Features covered

7. Digital Products

## Tasks

- Domain entity `DigitalAsset`; `ALTER TABLE product_variants ADD is_digital`
- Extend the variant editor with a conditional digital-delivery section
- Permission: reuses `catalog-products.manage` (a variant-editing action, not a new admin area)

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/products/{id}/variants/{variantId}/digital-asset` | `{ fileUrl, fileName, maxDownloads?, expiryDays?, licenseKeyPoolId? }` | `ApiResponse<DigitalAsset>` |

`[Authorize(Policy = Permissions.CatalogProductsManage)]`.

Actual file delivery to a paying customer (signed download links, license-key allocation) is **not** part of this group — it's a checkout-adjacent concern that has nowhere to live until an order system exists, which is product-wide out of scope. This group only lets a merchandiser attach what a variant *would* deliver.

## FE pages/components

- `ProductEditorPage.tsx`'s variant row editor (Task Group 04's `VariantMatrixGrid`) gains a conditional "Digital delivery" section, shown only when the variant's `is_digital` flag (or its product's `ProductType.is_digital`) is set: file upload/URL field, max downloads, expiry days.

## DB design

Depends on Task Group 02 (`product_variants`).

- `digital_assets` (id, tenant_id, product_variant_id → product_variants [unique], file_url, file_name, max_downloads nullable, expiry_days nullable, license_key_pool_id nullable [placeholder text/id reference only — no key-generation/allocation system exists or is being built here])
- `ALTER TABLE product_variants ADD COLUMN is_digital BOOLEAN DEFAULT FALSE` — variant-level, not just product-level, so a single product can mix physical and digital variants (AC3)

## QA checklist

- Marking a variant digital hides/clears its weight and dimensions fields from publish validation.
- A mixed product (one physical variant, one digital variant) publishes successfully, each variant validated against its own rules.
- A digital variant without a `digital_asset` row cannot be published (mirrors the "at least one image" style of guard from Task Group 02).

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- License-key pool management (generating/allocating unique keys per sale) is out of scope until an order system exists to trigger allocation. `digital_assets.license_key_pool_id` is a placeholder reference field only in this group.
