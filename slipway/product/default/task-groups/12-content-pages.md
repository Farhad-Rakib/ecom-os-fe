# Task Group 12: Content Pages

## Features covered

2. Content Pages

## Tasks

- Domain entity `ContentPage` (tenant-scoped) and enum `ContentPageStatus { Draft, Published }` — a page's own lifecycle, deliberately not a reuse of Catalog's `ProductStatus` (no Archived/PendingReview concept applies to a static page).
- EF configuration, repository, migration.
- `ContentPagesController`.
- Permission `storefront-pages.manage`.
- Add this group's permission + a "Pages" menu entry (parented under "Storefront", from Task Group 11) to `StorefrontConfigModule.cs`.
- Admin FE: a list page plus a dedicated editor page for the body content (a small edit-in-modal doesn't give a rich text body enough room — same reasoning `ProductEditorPage.tsx` being a full page, not a modal, already reflects for Catalog).

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/content-pages?search=&page=&pageSize=` | — | `ApiResponse<PagedResult<ContentPageDto>>` |
| GET | `/api/v1/content-pages/{id}` | — | `ApiResponse<ContentPageDto>` |
| POST | `/api/v1/content-pages` | `{ title, slug, bodyHtml, seoTitle, seoDescription }` | `ApiResponse<ContentPageDto>` |
| PUT | `/api/v1/content-pages/{id}` | same shape | `ApiResponse<ContentPageDto>` |
| DELETE | `/api/v1/content-pages/{id}` | — | `NoContent` |
| POST | `/api/v1/content-pages/{id}/publish` | — | `ApiResponse<ContentPageDto>` |
| POST | `/api/v1/content-pages/{id}/unpublish` | — | `ApiResponse<ContentPageDto>` |

All `[Authorize(Policy = Permissions.StorefrontPagesManage)]`. A page is created as `Draft`; `publish`/`unpublish` are explicit actions, not a status field on the write DTO — same shape as Catalog's `Publish`/`Archive` endpoints.

## FE pages/components

- `features/storefront/pages/ContentPagesPage.tsx` — **new**. `DataTable` list (title, slug, status, updated date) with row actions: Edit, Publish/Unpublish (mirrors `ProductsPage.tsx`'s status-conditional row actions), Delete.
- `features/storefront/pages/ContentPageEditorPage.tsx` — **new**. Full-page editor: title, slug, body content, SEO title/description, plus a Publish/Unpublish action — same structural pattern as `ProductEditorPage.tsx` (route param for edit, `/storefront/pages/new` for create).
- Router: `/storefront/pages`, `/storefront/pages/:id`, `/storefront/pages/new`, all wrapped in `<PermissionGuard permissions={['storefront-pages.manage']}>`.

## DB design

No dependency on other groups in this PRD.

- `content_pages` (id, tenant_id, title, slug, body_html, seo_title, seo_description, status, created_at, created_by, updated_by, updated_at); unique `(tenant_id, slug)`

## QA checklist

- A duplicate slug within the same tenant is rejected; the same slug is allowed across two different tenants (tenant-scoped uniqueness, same pattern as `Category`'s per-taxonomy slug check).
- A page can be saved as Draft, edited further, and published later — publishing isn't required at creation time.
- A published page can be unpublished back to Draft without losing its content.
- Deleting a page removes it outright — no version history, no soft delete.
- A page's SEO title/description can differ from its display title (independent fields).

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Rich text body editor choice on the FE. No rich-text editor dependency exists anywhere in `ecom-os-fe` yet (Catalog's own description fields are plain `<textarea>`s) — introducing one (e.g. TipTap, Quill) is a new dependency and should be recorded as a decision if chosen, per `coding-standards.md`. A plain textarea that stores/round-trips raw HTML is an acceptable minimal starting point if a library isn't wanted yet; either way, `bodyHtml` is stored as a plain string on the backend regardless of what produces it.
- This group does not need to worry about a menu item referencing one of its pages (that dependency runs the other way — Task Group 15 depends on this group, not vice versa). The "what happens to a menu item when its target page is deleted" question is Task Group 15's to solve.
