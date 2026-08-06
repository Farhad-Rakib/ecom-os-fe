# Task Group 05: Multi-Location Inventory

## Features covered

5. Multi-Location Inventory

## Tasks

- Domain entities: `Warehouse`, `InventoryItem`
- Migration: drop `product_variants.quantity_on_hand`, backfill into each tenant's default warehouse
- `WarehousesController`, `InventoryController`
- Permission `catalog-inventory.manage`
- Admin FE: warehouse manager, inventory grid with low-stock indicator

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET/POST | `/api/v1/warehouses` | `{ code, name, address, isDefault }` | `ApiResponse<Warehouse[]>` |
| PUT/DELETE | `/api/v1/warehouses/{id}` | same shape | `ApiResponse<Warehouse>` / `NoContent` |
| GET | `/api/v1/inventory?variantId=&warehouseId=&belowReorderPoint=` | — | `ApiResponse<InventoryItem[]>` |
| PUT | `/api/v1/inventory/{variantId}/{warehouseId}` | `{ quantityOnHand, reorderPoint?, reorderQuantity?, backorderAllowed, preorderAvailableAtUtc?, lotNumber?, expiryDateUtc? }` (upsert) | `ApiResponse<InventoryItem>` |
| GET | `/api/v1/inventory/low-stock` | — | `ApiResponse<InventoryItem[]>` — items at/under `reorder_point` |

`[Authorize(Policy = Permissions.CatalogInventoryManage)]` at class level.

## FE pages/components

- `features/catalog/pages/WarehousesPage.tsx` — `DataTable` + `DynamicForm` modal.
- `features/catalog/pages/InventoryPage.tsx` — `DataTable` with a warehouse filter, inline quantity editing, low-stock indicator pill.
- `ProductEditorPage.tsx`'s Variants section (Task Group 04) links out to per-variant inventory rather than duplicating the grid inline.

## DB design

Depends on Task Group 02 (`product_variants`).

- `warehouses` (id, tenant_id, code, name, address, is_default); unique `(tenant_id, code)`
- `inventory_items` (id, tenant_id, product_variant_id → product_variants, warehouse_id → warehouses, quantity_on_hand, quantity_reserved, reorder_point nullable, reorder_quantity nullable, backorder_allowed, preorder_available_at_utc nullable, lot_number nullable, expiry_date_utc nullable); unique `(product_variant_id, warehouse_id, lot_number)`, with a filtered unique index treating `lot_number IS NULL` as a single row per `(product_variant_id, warehouse_id)` for non-perishables

Migration: for every tenant, create a default `Warehouse` if none exists, drop `product_variants.quantity_on_hand`, backfill its value into that warehouse's `inventory_items` row per variant — explicit data-preserving step, not a bare column drop.

## QA checklist

- Available quantity shown anywhere in the admin UI is `quantity_on_hand − quantity_reserved`, never the raw on-hand number.
- A variant with zero available stock across all warehouses and `backorder_allowed = false` is flagged not purchasable (contract check ahead of Task Group 10).
- The Group 02→05 migration preserves each variant's total quantity in the tenant's default warehouse — no silent stock loss.
- The same variant can show different available quantities at two different warehouses simultaneously.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Reservation release on cart abandonment/expiry is out of scope — no cart/checkout system exists yet (product-wide out of scope). `quantity_reserved` is defined here but nothing in Catalog writes to it until that system exists.
