# Task Group 14: Homepage Hero Banner

## Features covered

4. Homepage Hero Banner

## Tasks

- Domain enum `LinkTargetType` (`EcomOs.Domain.Enums`) — the **shared** target-kind vocabulary this group introduces and Task Group 15 (Navigation Menus) reuses unchanged. This group only allows a subset of it (see below); Task Group 15 uses the full set. Append-only ordering if extended later, for the same reason `ProductStatus.PendingReview` was appended rather than inserted this session — avoids renumbering already-stored values:
  `Category, Product, Brand, Collection, ContentPage, CustomUrl, Taxonomy`
  (Taxonomy listed last because this group has no use for it and Task Group 15 is what actually needs it — still fine to declare here since it's just an enum member, not a behavior).
- Domain entity `HeroBanner` (tenant-scoped, exactly one row per tenant): `ImageUrl`, `Headline`, `Subtext?`, `LinkTargetType?`, `LinkTargetId?`, `LinkCustomUrl?`. The CTA is entirely optional (`LinkTargetType` null means "no CTA").
- **`LinkTargetId` has no database-level foreign key** — it's polymorphic; which table it points into depends on `LinkTargetType`, and no single FK constraint can express that. Referential integrity is enforced in the application layer: the service validates the target exists (tenant-scoped) before saving, and `GET` resolves the target at read-time, returning `targetMissing: true` on the DTO instead of erroring if it's since been deleted — see QA checklist. Task Group 15 reuses this exact resolution approach.
- EF configuration, repository, migration.
- `HeroBannerController`.
- Permission `storefront-banner.manage`.
- Add this group's permission + a "Hero Banner" menu entry (parented under "Storefront") to `StorefrontConfigModule.cs`.
- Admin FE: a single settings-style page, plus a reusable link-target picker component this group builds and Task Group 15 also uses.

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/storefront/hero-banner` | — | `ApiResponse<HeroBannerDto?>` (`null` if unset — never 404) |
| PUT | `/api/v1/storefront/hero-banner` | `{ headline, subtext?, linkTargetType?, linkTargetId?, linkCustomUrl? }` | `ApiResponse<HeroBannerDto>` |
| POST | `/api/v1/storefront/hero-banner/image` | multipart `file` | `ApiResponse<HeroBannerDto>` |

All `[Authorize(Policy = Permissions.StorefrontBannerManage)]`. `PUT` upserts the tenant's single row. Server-side validation: if `linkTargetType` is `CustomUrl`, `linkCustomUrl` must be set and `linkTargetId` must be null; for any other non-null `linkTargetType`, `linkTargetId` must be set and `linkCustomUrl` must be null; **`linkTargetType` of `Taxonomy` or `Brand` is rejected with 400** — this feature's CTA only supports Category, Product, Collection, or a custom URL, per the PRD's explicit scope (Task Group 15's menu items support the full set).

## FE pages/components

- `features/storefront/pages/HeroBannerPage.tsx` — **new**. Image upload, headline/subtext inputs, and a CTA section: a target-kind selector (Category / Product / Collection / Custom URL / None) plus a dependent picker that changes based on the selected kind (category dropdown, product search-select reusing Task Group 13's product search, collection dropdown reusing Task Group 13's `GET /collections`, or a plain URL text field).
- The target-kind-selector + dependent-picker pairing is built as a reusable `LinkTargetPicker` component (not page-specific) — Task Group 15 reuses it for menu items, just with two more kind options enabled (Taxonomy, Brand) and a Content Page option (Task Group 12) added on top.
- Router: `/storefront/hero-banner`, wrapped in `<PermissionGuard permissions={['storefront-banner.manage']}>`.

## DB design

Depends on Task Group 13's `product_collections` table existing for `Collection`-typed targets to be meaningfully validated/tested — not a hard DB foreign key (see Tasks), so no strict migration-order requirement, but build after Task Group 13.

- `hero_banners` (id, tenant_id, image_url, headline, subtext nullable, link_target_type nullable int, link_target_id nullable bigint, link_custom_url nullable varchar, created_at, created_by, updated_by, updated_at); unique `(tenant_id)`

## QA checklist

- `linkTargetType = CustomUrl` requires `linkCustomUrl` and rejects a set `linkTargetId`.
- Any other non-null `linkTargetType` requires `linkTargetId` and rejects a set `linkCustomUrl`.
- `linkTargetType = Taxonomy` or `Brand` is rejected (400) — out of scope for this feature specifically.
- `GET` returns `targetMissing: true` (not an error) when the referenced Category/Product/Collection has since been deleted.
- `PUT` on a tenant with no existing row creates one (upsert).
- Subtext and the whole CTA (`linkTargetType` + its target) are optional; only `imageUrl` and `headline` are required to save.
- Exactly one `hero_banners` row can exist per tenant — a second `PUT` updates the same row, never inserts a second.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

None beyond what's already called out above.
