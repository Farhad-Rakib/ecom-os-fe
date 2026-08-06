# Implementation Report: Task Group 01 — Taxonomy & Brands

## What changed

**Backend (`ecom-os-be`, branch `catalog/task-group-01-taxonomy-brands`)**

- Domain (`EcomOs.Domain/Entities/`): `Taxonomy.cs`, `Category.cs` (self-referencing, `AssignParent` guards against a category parenting itself), `Brand.cs`. All three follow the existing `BaseEntity` + `ITenantEntity` convention, private setters, validation in the constructor.
- Persistence:
  - `Configurations/TaxonomyConfiguration.cs`, `CategoryConfiguration.cs`, `BrandConfiguration.cs` — table names, max lengths, unique indexes (`tenant_id+key`, `tenant_id+taxonomy_id+slug`, `tenant_id+slug` respectively), `Restrict` delete behavior on both of Category's FKs (parent and taxonomy) so a cascading delete can never silently erase a subtree.
  - `Context/ApplicationDbContext.cs` — added `Taxonomies`/`Categories`/`Brands` `DbSet`s. No other changes needed here: the tenant query filter and audit logging already apply automatically to any new `ITenantEntity`.
  - `Repositories/TaxonomyRepository.cs`, `CategoryRepository.cs`, `BrandRepository.cs` — implement the new `ITaxonomyRepository`/`ICategoryRepository`/`IBrandRepository` (added to `Application/Common/Interfaces/`). `CategoryRepository.WouldCreateCycleAsync` walks the parent chain from a candidate new-parent looking for the category itself.
  - `Migrations/Postgres/20260805140932_AddCatalogTaxonomyBrands.cs` — generated via `dotnet ef migrations add` (not hand-written), creates `taxonomies`, `categories`, `brands`.
  - `DependencyInjection.cs` (Persistence) — registered the three new repositories.
- Application (`EcomOs.Application/Catalog/`): `Dtos/TaxonomyDto.cs`, `CategoryDto.cs`, `BrandDto.cs`; `ITaxonomyService`/`TaxonomyService`, `ICategoryService`/`CategoryService`, `IBrandService`/`BrandService`. Registered in `DependencyInjection.cs` (Application).
- `Application/Security/Permissions.cs` — added `CatalogTaxonomyManage = "catalog-taxonomy.manage"`.
- `Application/ModuleSystem/CatalogModule.cs` — **new module**, `ModuleKind.Business` (subscription-plan-gated, not auto-entitled like Core). Declares the new permission and three menu entries (`Catalog` parent, `Categories`, `Brands`). Discovered automatically by `ModuleHost` — no changes needed to `RbacSeeder`, `DefaultMenuSeeder`, or `Program.cs`.
- `EcomOs.Api/Controllers/`: `TaxonomiesController.cs`, `CategoriesController.cs`, `BrandsController.cs` — match the existing `ApiResponse<T>`/`[ApiVersion]`/`CreatedAtAction` conventions exactly (modeled on `SubscriptionPlansController`).

**Frontend (`ecom-os-fe`, branch `catalog/task-group-01-taxonomy-brands`)**

- `src/features/catalog/pages/TaxonomiesPage.tsx` — list + create modal (`DataTable`, no pagination — matches the API, which is a flat `GetAll`).
- `src/features/catalog/pages/BrandsPage.tsx` — paged, searchable `DataTable` + create/edit modals + delete confirm, modeled directly on `SubscriptionPlansPage.tsx`.
- `src/features/catalog/pages/CategoriesPage.tsx` — recursive `CategoryTreeLevel` component: each level fetches only its own children (`parentCategoryId` = the expanded node's id, or omitted for roots) and lazily renders its own children on expand. Reordering uses up/down buttons per row, not drag-and-drop (see Deviations).
- `src/app/router/index.tsx` — added `/catalog/taxonomies`, `/catalog/categories`, `/catalog/brands`, each behind `<PermissionGuard permissions={['catalog-taxonomy.manage']}>`.

## Tests added

**Backend** — 38 new tests (`dotnet test` — 81/81 passing, up from 43):
- `UnitTests/Domain/{Taxonomy,Category,Brand}Tests.cs` — constructor validation (blank slug/key/name rejected, slug/key lowercased), `Category.AssignParent` rejects self-parenting, `Update`/`Activate`/`Deactivate`/`SetDisplayOrder` behavior.
- `UnitTests/Application/{Taxonomy,Category,Brand}ServiceTests.cs` (with new `Fake{Taxonomy,Category,Brand}Repository` in `TestSupport/`, matching the existing `FakeTenantFeatureFlagRepository` pattern) — covers PRD acceptance criteria directly: a 3-level-deep tree can be built (AC1); two taxonomies can coexist (AC2); duplicate slug within one taxonomy is rejected but the same slug in a different taxonomy is fine (AC3, scoped per-taxonomy not global); a category can't become its own parent, directly or by reparenting under its own descendant (QA: circular parent rejected); deleting a category with children is blocked, and succeeds once they're removed (AC5, category half — see Deviations); sibling reorder persists and rejects a non-sibling id.
- `ModuleHostTests` (pre-existing, unmodified) now also exercises `CatalogModule` since it's discovered from the same assembly — still green, confirming the new permission is owned by exactly one module and doesn't collide with any existing one.

**Frontend** — no test runner is configured in this repo yet (no existing `*.test.tsx` anywhere to follow a convention from); verified instead via `tsc --noEmit` (clean) and `vite build` (clean, pre-existing chunk-size warning only). Flagging this gap rather than inventing a test setup outside this task group's scope.

## Deviations from the design

- **Category/Brand deletion only blocks on children, not on attached products** (task group's own DB design section already flagged this: `Product`/`ProductCategory` don't exist until Task Group 02). `CategoryService.DeleteAsync` and `BrandService.DeleteAsync` both have a comment marking where that check needs to be added once Group 02 ships — narrow, reasonable interpretation per the task group's own note, not a silent gap.
- **`GET /categories` requires `taxonomyId`** and treats `parentCategoryId` as an equality match (including `null` = roots), rather than the task group's literal `?taxonomyId=&parentCategoryId=` (both-optional) shape. A "flatten every level of every taxonomy" listing isn't something any designed UI needs, and the tree view needs exactly "roots of taxonomy X" / "children of node Y" — equality-with-null is what makes that work from a single endpoint.
- **Category reorder is up/down buttons, not drag-and-drop.** The task group's FE section flagged a "new component" for reordering without committing to a specific interaction; buttons satisfy the same acceptance criterion (order persists and is reflected on reload) with far less client complexity. Worth revisiting if a merchandiser workflow later needs reordering long sibling lists.
- **No FluentValidation validators added** — matches the `Subscriptions` feature's precedent (simpler features skip the `Validation/` folder), since entity constructors and service-level `AppException`s already cover every required-field and uniqueness rule exercised by the tests.
- **Migration generated with `--project`/`--startup-project` both pointed at `EcomOs.Persistence`**, not `EcomOs.Api` as `README.md` documents. `EcomOs.Api.csproj` doesn't reference `Microsoft.EntityFrameworkCore.Design`, so the documented command fails with "doesn't reference Microsoft.EntityFrameworkCore.Design" before it ever reaches this task group's code. `EcomOs.Persistence` already ships its own `IDesignTimeDbContextFactory` (`ApplicationDbContextFactory.cs`) specifically for this, so pointing the tooling at it directly works without touching any `.csproj`. Flagging this as a pre-existing environment gap, not something this task group should fix by adding a dependency to `EcomOs.Api` outside its declared scope.

## Blockers

None — Task Group 01 had no blocking open questions in its design.

**Not done, out of this task group's scope on purpose:** the `catalog` module isn't entitled to any tenant by default (`ModuleKind.Business`, same as any future business module) — a tenant needs it added to their subscription plan (existing `SubscriptionPlansController`/UI) before `Categories`/`Brands` appear in their nav or `catalog-taxonomy.manage` is grantable to a role. This is expected platform behavior, not a defect, but worth knowing before manually testing this end-to-end.
