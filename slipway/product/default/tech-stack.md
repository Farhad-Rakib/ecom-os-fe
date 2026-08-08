# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — this module
extends the existing Olympus-templated stack, no new platform choices.

## Frontend (admin)

React — `ecom-os-fe`, the existing back-office app. Storefront
Configuration screens (branding, content pages, collections, hero
banner, navigation menus) are new features added to it.

## Frontend (storefront)

N/A — not yet built. A separate, tenant-facing application will
eventually consume this module's configuration; its framework and the
public read API it would need are both out of scope of this PRD and
deferred until that project starts (same call the Catalog PRD made for
its own Feature 9).

## Backend

.NET Core Web API, multi-tenant — `ecom-os-be`, the existing Clean
Architecture solution (Domain / Application / Infrastructure /
Persistence / Api). Storefront Configuration is a new bounded area
within it, following the same layering as Catalog and other existing
modules.

## Database

Postgres or SqlServer — fixed by the `olympus-core` template's
multi-tenancy setup at generation time, not a per-feature choice.

## Other

- **File storage** — reuses the existing `IFileStorageService`
  (already used for Catalog product media) for favicon/logo/banner
  image uploads, rather than introducing a new upload mechanism.

## Conventions

- Prefer the smallest dependency that solves the problem over a
  framework that solves problems you don't have yet.
- Every new dependency is a decision — record why in
  `slipway/memory/decisions.md`, not just that it was added.
