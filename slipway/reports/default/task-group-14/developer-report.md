# Implementation Report: Task Group 14 — Homepage Hero Banner (variant: default)

## What changed

Frontend only — the backend (`HeroBannerController`, `hero_banners` table, `LinkTargetType` enum, `storefront-banner.manage` permission) was already implemented in `ecom-os-be`.

- `src/features/storefront/components/LinkTargetPicker.tsx` — **new, shared component** this task group builds and Task Group 15 reuses, per the spec. A target-kind `<select>` (scoped to whatever `allowedKinds` the caller passes) plus a dependent picker that changes shape per kind: `<select>` dropdowns for Category/Taxonomy/Brand/Collection/ContentPage (each backed by that entity's existing list endpoint), an `Autocomplete` search-select for Product (mirrors Catalog's product-search composition, plus a byId lookup so an already-selected product still shows its label even before the admin searches), and a plain URL text input for CustomUrl. `LinkTargetType`'s int values (`Category=0`...`Taxonomy=6`) are hardcoded to match `EcomOs.Domain.Storefront.Enums.LinkTargetType` exactly, confirmed via a direct backend code read (no `JsonStringEnumConverter` is registered — the enum serializes as a raw int, not a string).
- `src/features/storefront/pages/HeroBannerPage.tsx` — **new**. Image upload (own multipart upload class, same split-instance pattern as Task Group 11's `StorefrontBrandingUploadApi`), headline/subtext inputs, and `LinkTargetPicker` restricted to `['Category', 'Product', 'Collection', 'CustomUrl']` with `allowNone` (matches the backend validator's `AllowedTargetTypes` set exactly — Brand/Taxonomy are excluded here on purpose, confirmed against `UpdateHeroBannerCommandValidator.cs`). Shows an amber warning banner when the loaded `targetMissing` flag is true.
- `src/app/router/index.tsx` — added `storefront/hero-banner`, behind `<PermissionGuard permissions={['storefront-banner.manage']}>`.

## Tests added

No test runner configured in this repo (same known gap as prior task groups). Verified via `tsc --noEmit -p tsconfig.app.json` (clean) and `vite build` (clean).

## Deviations from the design

- **Save and image-upload mutations write the response DTO straight into the React Query cache instead of invalidating-and-refetching** — same reasoning as Task Group 11's Branding page (avoids a flash where an uploaded image briefly reverts before a background refetch completes). Not a design deviation, an implementation detail.
- `LinkTargetPicker` was built generically (an `allowedKinds` prop) rather than hardcoding Hero Banner's 4-kind subset into the component itself, specifically so Task Group 15 can reuse it unmodified with its own (larger) subset — this is what the task group's own spec asks for ("a reusable `LinkTargetPicker` component... Task Group 15 reuses it, just with two more kind options enabled").

## Blockers

None. Not exercised against a live backend in this pass — see Task Group 11's report for the same note on verification scope. Recommend a `/qa` pass, in particular the CustomUrl vs. other-kind mutual-exclusivity validation (AC1/AC2, enforced server-side by `UpdateHeroBannerCommandValidator`) and the `targetMissing` read-time flag after deleting a linked Category/Product/Collection.
