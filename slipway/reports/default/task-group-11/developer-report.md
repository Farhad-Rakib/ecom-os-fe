# Implementation Report: Task Group 11 — Storefront Branding & Site Identity (variant: default)

## What changed

Frontend only — the backend (`StorefrontBrandingController`, `storefront_branding` table, `storefront-branding.manage` permission, `StorefrontConfigModule.cs` menu entries) was already implemented in `ecom-os-be`.

- `src/features/storefront/pages/BrandingPage.tsx` — **new**. A single settings-style form (not `DataTable`), matching the task group's own FE section: site title, tagline, six social link inputs (all optional), and two independent `ImageUpload` zones (favicon, logo). `StorefrontBrandingApi` (`fetch`/`update`) and a separate `StorefrontBrandingUploadApi` (multipart, `uploadFavicon`/`uploadLogo`) mirror Catalog's own `ProductApi`/`ProductMediaUploadApi` split — a JSON-default `BaseRepository` instance can't be reused for multipart uploads.
- `src/app/router/index.tsx` — added `storefront/branding`, wrapped in `<PermissionGuard permissions={['storefront-branding.manage']}>`.
- `src/app/layouts/components/Sidebar.tsx` — added `store`/`palette`/`file-text`/`layout-grid`/`image` to the `iconMap` (`menu` was already mapped). `StorefrontConfigModule.cs`'s menu entries use these five icon strings; without the mapping, the backend-driven sidebar would silently render no icon for the whole "Storefront" section and four of its five children (`getIcon` falls back to `Icons[iconName]` directly, which only resolves for names that already match a `lucide-react` export like `Menu`, not hyphenated ones like `file-text`).

## Tests added

No test runner is configured in this repo (same gap noted in Task Group 01's own report — no `*.test.tsx` convention exists to follow). Verified via `tsc --noEmit -p tsconfig.app.json` (clean) and `vite build` (clean, pre-existing chunk-size warning only, unrelated to this change).

## Deviations from the design

- **Upload mutations write the response DTO directly into the React Query cache (`setQueryData`) instead of just invalidating.** Both upload endpoints return the full, fresh `StorefrontBrandingDto` in their response; using it directly avoids a visible flash where the just-uploaded image would briefly revert to the old one while waiting on a background refetch. Narrow implementation choice, not a design deviation — the API contract is unchanged.
- Everything else follows the task group's design as written: upsert-on-write (no separate "create" step), independent favicon/logo columns and endpoints, no required social links.

## Blockers

None. Not exercised against a live backend in this pass (no local Postgres instance available in this session) — verification was `tsc`/`vite build` only, consistent with how prior FE-only implement passes in this project have been verified (see Task Group 01's report). Recommend a `/qa` or manual click-through pass against a running `ecom-os-be` before considering this feature done end-to-end.
