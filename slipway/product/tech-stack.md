# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — this feature
extends the existing Olympus-templated stack, no new platform choices.

## Frontend (admin)

React — `ecom-os-fe`, the existing back-office app. Catalog management
screens (products, categories, attributes, inventory, pricing) are new
features added to it.

## Frontend (storefront)

N/A — not yet built. A separate, tenant-facing application consumes
Feature 9 (Public Storefront Catalog API); its framework is to be
determined when that project starts and is not a dependency of this
PRD.

## Backend

.NET Core Web API, multi-tenant — `ecom-os-be`, the existing Clean
Architecture solution (Domain / Application / Infrastructure /
Persistence / Api). Catalog is a new bounded area within it, following
the same layering as existing modules (Tenants, Menu, Subscriptions).

## Database

Postgres or SqlServer — fixed by the `olympus-core` template's
multi-tenancy setup at generation time, not a per-feature choice.

## Other

- **Redis** — storefront response caching for Feature 9, via the
  platform's existing `Caching:UseRedis` toggle.
- **Event bus** (in-process or RabbitMQ) — cache invalidation on
  catalog writes, via the platform's existing `Integration:UseRabbitMq`
  toggle.

## Conventions

- Prefer the smallest dependency that solves the problem over a
  framework that solves problems you don't have yet.
- Every new dependency is a decision — record why in
  `slipway/memory/decisions.md`, not just that it was added.
