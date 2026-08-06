# Task Group 10: Public Storefront Catalog API

## Features covered

9. Public Storefront Catalog API

## Tasks

- Anonymous tenant resolution middleware for storefront routes, using the existing `TenantDomain` entity
- Read-only, cached projection endpoints over everything built in Task Groups 01–06
- Redis caching keyed by tenant + resource + filter hash, invalidated via the existing event bus on catalog writes
- Facet computation driven by `AttributeDefinition.is_filterable`

## Design

- **`StorefrontTenantResolutionMiddleware`** (new, `EcomOs.Api/Middleware`) applies only to `/api/v1/storefront/**`. Reads `Request.Host`, looks up `TenantDomain` (the entity is deliberately excluded from the ambient tenant query filter for exactly this purpose, per its own code comment), and calls `ICurrentTenantService.Set(tenantId, tenantSlug)`. An unmapped host returns `404`, not a generic auth error — this route family has no authenticated fallback.
- **Controllers are `[AllowAnonymous]`, no `[Authorize(Policy = ...)]` at all** — the first controllers in the codebase without one. This is a deliberate, explicit exception (tenant isolation comes from host resolution instead of a permission check), not an oversight — flag it as such in review.
- Every storefront query filters `status = Published` and, per variant, `track_inventory = false OR available_quantity > 0 OR backorder_allowed` at the repository level — never left to the client to filter.
- Cache key shape: `storefront:{tenantSlug}:{resource}:{filterHash}`. Writes in Task Groups 02/05/06 publish a `CatalogChangedEvent { TenantId, EntityType, EntityId }` via the platform's existing event bus (in-process or RabbitMQ per `Integration:UseRabbitMq`); a new `StorefrontCacheInvalidationHandler` subscribes and purges by tenant+resource-family prefix — coarse invalidation (a full resource-family flush per tenant), not per-key precision, since computing which `filterHash`es a given change affects isn't worth the complexity.

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/storefront/categories` | `?locale=` | `ApiResponse<CategoryTree>` |
| GET | `/api/v1/storefront/products` | `?categorySlug=&brandSlug=&attr[code]=value&priceMin=&priceMax=&q=&sort=&page=&pageSize=&locale=&currency=` | `ApiResponse<PagedResult<StorefrontProduct>>` |
| GET | `/api/v1/storefront/products/{slug}` | `?locale=&currency=` | `ApiResponse<StorefrontProductDetail>` |
| GET | `/api/v1/storefront/products/{slug}/facets` | `?categorySlug=` | `ApiResponse<Facet[]>` — filterable attributes + option counts for the current result set |

No `[Authorize]` policy on any of the above — see Design.

## FE pages/components

None in `ecom-os-fe` — this group is backend/infra-only by design. The storefront application that consumes this API doesn't exist yet; per `slipway/product/tech-stack.md`, its framework is explicitly TBD and out of this PRD's build. (Per `/shape-spec`'s own rule: this is the valid, stated reason for an empty FE section, not a gap.)

## DB design

No new tables — this group is a read/cache layer over Task Groups 01, 02, 03, 05, 06. Adds:
- `catalog_changed_events` outbox table if the in-process event bus needs durability across restarts (only if `Integration:UseRabbitMq = false`); otherwise no schema addition, matching the existing `IEventBus` dual-mode design.

Depends on Task Groups 01, 02, 03 at minimum (categories, products, attributes) to have anything to read; Task Groups 05/06 extend the response shape (stock/price) once implemented but aren't hard blockers for a first cut.

## QA checklist

- A request with an unrecognized `Host` header returns `404`, never falls through to any tenant's data.
- A product edited in the admin app is reflected in the storefront response within the stated freshness window even when Redis is warm — the cache actually invalidates, not just expires on TTL.
- Two tenants hitting the API through their respective domains concurrently never see cross-tenant data, including under identical category slugs across tenants (cache key collision stress).
- An attribute with `is_filterable = false` never appears in the `/facets` response even if `is_searchable = true`.
- A Draft or Archived product never appears in any storefront response, regardless of cache state.
- The API returns a valid empty result (not an error) for a tenant/category with zero products.

## Blocking open questions

None structurally. This group's completeness is gated by Task Groups 02/03/05/06 being implemented first — a sequencing dependency, not a design gap.

## Deferred / safe-to-resolve-during-implementation

- Full-text search implementation for `q=` (Postgres `tsvector` vs. an external engine) — already flagged as Open Decision #4 in `prd.md`. Ship a simple `tsvector`/`LIKE` match in v1; the endpoint contract doesn't change if the implementation is swapped later.
