# Implementation Report: Task Group 12 — Content Pages (variant: default)

## What changed

Frontend only — the backend (`ContentPagesController`, `content_pages` table, `storefront-pages.manage` permission) was already implemented in `ecom-os-be`.

- `src/features/storefront/pages/ContentPagesPage.tsx` — **new**. `DataTable` list (title, slug, status badge, updated date) with row actions Edit/Publish/Unpublish (status-conditional, same pattern as Catalog's `ProductsPage.tsx`) and Delete. `ContentPageApi` class exported alongside the page, following the established convention of sibling pages importing a feature's api/DTOs from its list-page file (e.g. `ProductEditorPage.tsx` importing `categoryApi` from `CategoriesPage.tsx`).
- `src/features/storefront/pages/ContentPageEditorPage.tsx` — **new**. Full-page editor (title, auto-derived-but-editable slug, plain-`<textarea>` body, SEO title/description), plus a Publish/Unpublish action once a page exists — same structural pattern as `ProductEditorPage.tsx` (route param for edit, `/storefront/pages/new` for create).
- `src/app/router/index.tsx` — added `storefront/pages`, `storefront/pages/new`, `storefront/pages/:id`, all behind `<PermissionGuard permissions={['storefront-pages.manage']}>`.

## Tests added

No test runner configured in this repo (same known gap as Task Group 11). Verified via `tsc --noEmit -p tsconfig.app.json` (clean) and `vite build` (clean).

## Deviations from the design

- **Slug auto-derives from the title until the admin edits the slug field directly**, then stops auto-deriving (a `slugTouched` flag). The task group didn't specify slug-generation behavior; this is a narrow, additive UX choice that doesn't foreclose anything — the admin can always override the slug, and on edit of an existing page `slugTouched` starts `true` so the loaded slug is never silently rewritten.
- Rich text body is a plain `<textarea>` storing raw HTML in `bodyHtml`, per the task group's own explicitly-endorsed fallback ("a plain textarea that stores/round-trips raw HTML is an acceptable minimal starting point if a library isn't wanted yet"). No rich-text editor dependency was added — none exists elsewhere in this repo, and the task group flagged that adding one would be a recordable dependency decision, not a default.

## Blockers

None. Not exercised against a live backend in this pass — see Task Group 11's report for the same note on verification scope. Recommend a `/qa` or manual pass, in particular to confirm the duplicate-slug-within-tenant rejection (AC2) surfaces a usable error message on this form.
