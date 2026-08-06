# Task Group 06: Pricing, Tax & Scheduled Sales

## Features covered

6. Pricing, Tax & Scheduled Sales

## Tasks

- Domain entities: `TaxClass`, `PriceList`, `PriceListEntry`
- `ALTER TABLE products` — add the FK constraint on the `tax_class_id` column left nullable/unconstrained since Task Group 02
- Effective-price resolution service (base price vs. active price-list entries)
- `TaxClassesController`, `PriceListsController`
- Permission `catalog-pricing.manage`
- Admin FE: tax class manager, price list manager with entry editor

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET/POST | `/api/v1/tax-classes` | `{ code, name, description }` | `ApiResponse<TaxClass[]>` |
| PUT/DELETE | `/api/v1/tax-classes/{id}` | same shape | `ApiResponse<TaxClass>` / `NoContent` |
| GET/POST | `/api/v1/price-lists` | `{ code, name, currency, channelId?, customerGroup? }` | `ApiResponse<PriceList[]>` |
| PUT/DELETE | `/api/v1/price-lists/{id}` | same shape | `ApiResponse<PriceList>` / `NoContent` |
| GET/POST/PUT/DELETE | `/api/v1/price-lists/{id}/entries` | `{ productVariantId, price, minQuantity, validFromUtc?, validToUtc? }` | `ApiResponse<PriceListEntry[]>` |
| GET | `/api/v1/products/{id}/effective-price?currency=&quantity=&channelId=&at=` | — | `ApiResponse<EffectivePrice>` — used by both the admin preview and Task Group 10's storefront read |

`[Authorize(Policy = Permissions.CatalogPricingManage)]` at class level.

## FE pages/components

- `features/catalog/pages/TaxClassesPage.tsx` — `DataTable` + `DynamicForm` modal.
- `features/catalog/pages/PriceListsPage.tsx` — list + detail view; entries shown as an editable `DataTable` (variant picker, price, min quantity, date range).
- `ProductEditorPage.tsx`'s variant rows show a "View pricing" link into the relevant price-list entries rather than duplicating price-list editing inline.

## DB design

Depends on Task Group 02 (`products`, `product_variants`).

- `tax_classes` (id, tenant_id, code, name, description); unique `(tenant_id, code)`
- `products.tax_class_id` gains its FK constraint → `tax_classes(id)` (column already existed, nullable, unconstrained, since Task Group 02)
- `price_lists` (id, tenant_id, code, name, currency, channel_id nullable, customer_group nullable); unique `(tenant_id, code)`
- `price_list_entries` (id, price_list_id → price_lists, product_variant_id → product_variants, price, min_quantity default 1, valid_from_utc nullable, valid_to_utc nullable)

## QA checklist

- A sale price outside its `valid_from`/`valid_to` window never appears as the effective price, including at the exact boundary second — inclusive/exclusive rule is explicit and tested.
- Two overlapping price-list entries for the same variant/currency/quantity resolve deterministically per the precedence rule below (once decided) — never ambiguously.
- Effective-price resolution is timezone-consistent (UTC) regardless of tenant or shopper locale.
- A variant sold in two currencies shows the correct price for each without duplicating the product record.

## Blocking open questions

- **Precedence when multiple `price_list_entries` could apply to the same variant simultaneously** (e.g. a channel price and a scheduled sale both active at once). The PRD doesn't specify a resolution order, and this determines the *shape* of the effective-price algorithm, not just a parameter — must be decided before implementation. Candidate rule to confirm or replace: most-specific-wins (an entry matching channel + customer group beats a currency-only entry; among equally specific entries, the lower price wins).

## Deferred / safe-to-resolve-during-implementation

- Multi-currency rounding — default to standard 2-decimal rounding per ISO currency code; revisit only if a zero-decimal currency (e.g. JPY) is needed.
