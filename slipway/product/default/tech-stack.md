# Tech Stack

Confirmed against `slipway/standards/tech-stack.md` — this module
extends the existing Olympus-templated stack, no new platform choices
for this repo specifically (the new storefront application, described
below, is a different repo's tech-stack decision).

## Frontend (admin)

React — `ecom-os-fe`, this repo, the existing back-office app. Order
Management's admin screens (Feature 8) are the only new feature added
to it for this product — everything customer-facing lives elsewhere.

## Frontend (storefront)

**Next.js (SSR/SSG), a new separate application/repo** — not yet
created, not this repo. Deliberately kept out of `ecom-os-fe`: a
public, SEO-sensitive, anonymous-by-default storefront has different
auth/rendering needs than this authenticated admin app. See
`ecom-os-be`'s `tech-stack.md` for the full reasoning (mirrored here).

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
