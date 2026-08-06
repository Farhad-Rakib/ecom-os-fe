# Decisions

## 2026-08-05 — shape-spec — task-group-03

`attribute_definitions.tenant_id` is non-null — no platform-global/shared attributes in v1. Alternatives considered: a nullable `tenant_id` so common attributes (e.g. "Color") could be defined once and reused across tenants. Why this one: the platform's EF Core `ApplicationDbContext` applies a global query filter (`e.TenantId == CurrentTenantId`) to every `ITenantEntity`; a null-tenant row would need special-casing that nothing else in the codebase does, and the PRD didn't ask for cross-tenant attribute sharing.

## 2026-08-05 — shape-spec — task-group-10

Storefront tenant resolution reads the request `Host` header and looks it up against the existing `TenantDomain` entity, via a new anonymous-only middleware — it does not reuse the authenticated admin app's tenant-resolution path. Alternatives considered: trusting a client-supplied `X-Tenant-Id` header, the same mechanism the authenticated admin app uses. Why this one: `X-Tenant-Id` is only trustworthy because the admin app's caller is already authenticated; on a fully anonymous endpoint, trusting a client-supplied header would let anyone read any tenant's catalog by setting it to an arbitrary value. `TenantDomain` already exists specifically for this (its own code comment: resolving a tenant "from an inbound Host header" before any tenant context exists), so this reuses an existing, purpose-built entity rather than inventing a new one.

## 2026-08-05 — shape-spec — task-group-02

The product editor (`ProductEditorPage.tsx`) is a bespoke page, not built on the shared `DynamicForm` component every other admin feature uses. Alternatives considered: force product editing through `DynamicForm`'s static, build-time field array, matching every existing feature. Why this one: `DynamicForm`'s field list is fixed at build time; a product's actual field set depends on its category's attribute set (Task Group 03), resolved at runtime, plus a generated variant matrix (Task Group 04) — neither is expressible as a flat, pre-declared field array. `DataTable` is still reused inside this page wherever its rows genuinely are tabular (variant matrix, bundle items).

## 2026-08-05 — shape-spec — task-group-02

Publishing a product requires a separate `catalog-products.publish` permission from `catalog-products.manage`, rather than following the codebase's existing one-policy-per-controller convention. Alternatives considered: a single `catalog-products.manage` policy gating every product action, matching `TenantsController`/`SubscriptionPlansController` today. Why this one: Catalog is the platform's first genuinely multi-role merchandising workflow (a draft an editor can touch vs. an explicit approve-to-publish step) — flagged as still open for confirmation in Task Group 02 before implementation, since Task Groups 04/07/09 assume both permissions already exist in seed data.

## 2026-08-05 — shape-spec — task-group-02 / task-group-05

`product_variants.quantity_on_hand` ships as a temporary single-number stock field in Task Group 02, replaced by Task Group 05's per-warehouse `inventory_items` (migration drops the column and backfills a default warehouse). Alternatives considered: build multi-warehouse inventory from the start, avoiding building stock tracking twice. Why this one: the PRD (Feature 2) explicitly scopes single-warehouse stock as the publishable baseline and defers multi-location to Feature 5; blocking all of Task Groups 02–04 on inventory design being finished first costs more than the small migration this creates.

## 2026-08-05 — implement — task-group-01

`GET /api/v1/categories` requires `taxonomyId` and matches `parentCategoryId` by strict equality, including `null` (omitted = roots of that taxonomy), rather than the task group's literal both-optional shape. Alternatives considered: `taxonomyId` optional, `parentCategoryId` only filtering when present (i.e. omitted = every level flattened together). Why this one: no designed UI needs "every level of every taxonomy in one flat list" — the tree view needs exactly "roots of taxonomy X" or "children of node Y", which equality-with-null gives directly from a single endpoint shape; a taxonomy-optional flat listing would be dead code with no caller.

## 2026-08-05 — implement — task-group-01

Category reordering in the admin UI is up/down buttons per row (calling the existing `POST /categories/{id}/reorder`), not drag-and-drop. Alternatives considered: a drag-and-drop tree, which the task group's FE section left open ("new component... `DataTable` doesn't support drag order"). Why this one: buttons satisfy the same acceptance criterion (order persists, reflected on reload) with far less client complexity than wiring a drag library into a lazily-loaded recursive tree; worth revisiting only if a real catalog needs to reorder long sibling lists where clicking up/down repeatedly becomes impractical.

## 2026-08-05 — implement — task-group-01

EF Core migrations for this repo are generated with both `--project` and `--startup-project` pointed at `EcomOs.Persistence`, not `EcomOs.Api` as `README.md` currently documents. Alternatives considered: adding a `Microsoft.EntityFrameworkCore.Design` package reference to `EcomOs.Api.csproj` so the documented command works as written. Why this one: `EcomOs.Persistence` already ships `ApplicationDbContextFactory` (an `IDesignTimeDbContextFactory<ApplicationDbContext>`) specifically so migration tooling doesn't need a fully-configured host — pointing `dotnet ef` at it directly works today with zero dependency changes, whereas editing `EcomOs.Api.csproj` would be a dependency change outside this task group's declared scope for a documentation mismatch, not a code defect. `README.md`'s command should be corrected separately.

## 2026-08-06 — implement — task-group-02

`product_variants`' price/currency/stock fields are set via the same `POST /products` and `PUT /products/{id}` request bodies as the product's own fields, not a separate variant endpoint. Alternatives considered: adding a dedicated `PUT /products/{id}/variant` endpoint, or deferring price entirely to Task Group 04. Why this one: this task group's own endpoint table lists no variant-specific route for the single-default-variant model it covers, yet its own Publish acceptance criterion requires a price — a separate endpoint would be new API surface the spec never asked for, and deferring price to TG04 would make Publish permanently unreachable within this task group's scope. `ProductService` creates/updates the linked default variant transactionally alongside the product; TG04's real variant matrix gets its own dedicated endpoints and isn't blocked by this.

## 2026-08-06 — implement — task-group-02

`ProductEditorPage`'s category picker eagerly walks and flattens every taxonomy's full category tree (via the existing `categoryApi.getPaged`, now exported from `CategoriesPage.tsx`) instead of reusing `CategoriesPage`'s lazy per-level accordion. Alternatives considered: reusing the lazy tree component as-is. Why this one: the picker needs the whole tree visible at once so a merchandiser can check any node immediately; a lazy accordion is right for the tree-*management* page (expand what you're editing) but wrong for a *selection* UI where hunting through collapsed levels to find one category would be worse UX than one scrollable flat list.

## 2026-08-06 — implement — task-group-03

`AttributeSetBuilder`'s member assignment uses up/down reorder buttons, not drag-and-drop, even though the task group's own FE section calls for "drag-reorder." Alternatives considered: adding a drag-and-drop library for this one component. Why this one: `DataTable` still has no drag-order support, and Task Group 01 already made and recorded this exact tradeoff for Category reordering (buttons satisfy the same "order persists" acceptance behavior with far less client complexity than wiring a drag library into one component) — worth revisiting only if a real attribute set needs reordering long member lists where clicking repeatedly becomes impractical.

## 2026-08-06 — implement — task-group-04

The size-chart admin page only lets an admin scope a chart to a Brand, not a Category, even though the backend fully supports `scopeCategoryId`. Alternatives considered: reusing `ProductEditorPage`'s eager-flatten category picker for this screen too. Why this one: that picker was built for multi-select category *assignment* on a product; a size chart needs a single-select category *scope* picker, which is different enough (and this is a lower-traffic admin screen) that duplicating/adapting it wasn't judged worth the added surface for this pass. Category-scoped charts are reachable via direct API call today; flagged as a FE gap to close later, not a backend limitation.

## 2026-08-06 — implement — task-group-05

`InventoryPage`'s "Add Stock Record" action only appears when the page is pre-filtered to one variant (via the Variants grid's `?variantId=` link), not as a general product/variant picker from the main page. Alternatives considered: a standalone product+variant search on the Inventory page itself, usable with no prior context. Why this one: per this task group's own FE note, `ProductEditorPage`'s Variants section already "links out to per-variant inventory rather than duplicating the grid inline" -- that link is the intended entry point into managing a specific variant's stock, so building a second, parallel discovery path wasn't worth the added UI for this pass.
