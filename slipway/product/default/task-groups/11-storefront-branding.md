# Task Group 11: Storefront Branding & Site Identity

## Features covered

1. Storefront Branding & Site Identity

## Tasks

- Create `StorefrontConfigModule.cs` (`EcomOs.Application.ModuleSystem`, implements `IOlympusModule`) — `Key: "storefront-config"`, `Kind: Business`, `Dependencies: ["catalog"]` (later groups in this PRD reference Category/Product/Brand). Every later task group in this PRD (12-15) adds its own permissions/menus to this same file, not a new module per group — same pattern `CatalogModule.cs` already uses.
- Domain entity `StorefrontBranding` (tenant-scoped, exactly one row per tenant — see DB design).
- EF configuration, repository, migration.
- `StorefrontBrandingController`.
- Permission `storefront-branding.manage`.
- Admin FE: a single settings-style page (not a list) under a new "Storefront" nav section.

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/storefront/branding` | — | `ApiResponse<StorefrontBrandingDto>` (defaults/nulls if the tenant has no row yet — never 404) |
| PUT | `/api/v1/storefront/branding` | `{ siteTitle, tagline?, facebookUrl?, instagramUrl?, twitterUrl?, youtubeUrl?, tiktokUrl?, linkedinUrl? }` | `ApiResponse<StorefrontBrandingDto>` |
| POST | `/api/v1/storefront/branding/favicon` | multipart `file` | `ApiResponse<StorefrontBrandingDto>` |
| POST | `/api/v1/storefront/branding/logo` | multipart `file` | `ApiResponse<StorefrontBrandingDto>` |

All `[Authorize(Policy = Permissions.StorefrontBrandingManage)]`. GET/PUT/upload all upsert the tenant's single row (create it on first write) rather than requiring a separate "create" step — same nullable-GET, upsert-PUT pattern Task Group 07 used for `DigitalAsset`.

## FE pages/components

- `features/storefront/pages/BrandingPage.tsx` — **new**. A single settings form (not `DataTable`): site title, tagline, 6 social link fields (all optional), a favicon upload zone, a logo upload zone — each upload independent of the other and of the text fields.
- Router: `/storefront/branding`, wrapped in `<PermissionGuard permissions={['storefront-branding.manage']}>`.
- New "Storefront" menu section (data-driven via `StorefrontConfigModule.Menus`, same as Catalog's own section) — this group adds the "Storefront" parent entry and its own "Branding" child; groups 12-15 add their own children under it.

## DB design

No dependency — first group in this PRD.

- `storefront_branding` (id, tenant_id, favicon_url nullable, logo_url nullable, site_title, tagline nullable, facebook_url nullable, instagram_url nullable, twitter_url nullable, youtube_url nullable, tiktok_url nullable, linkedin_url nullable); unique `(tenant_id)`

Image uploads reuse the existing `IFileStorageService.SaveAsync` (same mechanism Catalog product media already uses) — no new storage infrastructure. Re-uploading overwrites the stored URL column; the previous file is not deleted from disk, matching how `ProductService.DeleteMediaAsync` already leaves the underlying file in place (not a new gap this group introduces).

## QA checklist

- Uploading a favicon then a logo doesn't clobber the other's URL (independent columns, independent endpoints).
- `PUT` on a tenant with no existing row creates one (upsert), not a 404.
- Saving with every social link blank is valid — none are required.
- Re-uploading a favicon updates `FaviconUrl` in one call, no separate "clear first" step needed.
- Two tenants can each set completely independent branding without interfering (tenant-scoped row).

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Image format/size limits for favicon and logo — default to reusing `ProductService`'s existing `AllowedImageContentTypes` (jpeg/png/webp/gif) rather than inventing new rules.
