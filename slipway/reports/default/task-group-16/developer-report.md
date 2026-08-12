# Implementation Report: Task Group 16 — Hero Banner List UI (variant: default)

## What changed

- `src/features/storefront/pages/HeroBannerPage.tsx` — full rewrite from a
  single-banner upsert form to a list view, mirroring
  `StorefrontMenusPage.tsx`'s list+reorder+modal pattern (flat, no
  indent/outdent since this list has no hierarchy):
  - DTOs: `HeroBannerDto` (now has `id`/`displayOrder`, no longer the
    singular shape), `HeroBannerWriteDto` (content-only, matches
    `MenuItemWriteDto`'s convention), `HeroBannerPosition` (`{ id,
    displayOrder }`, no `parentItemId`).
  - `HeroBannerApi extends BaseRepository` (base path
    `/storefront/hero-banners`): `list()` → `GET ''`, `create(dto)` →
    `POST ''`, `update(id, dto)` → `PUT '/{id}'`, `remove(id)` → `DELETE
    '/{id}'`, `reorder(positions)` → `POST '/reorder'` with `{ items:
    positions }`. Separate `HeroBannerUploadApi` (same base path,
    multipart): `uploadImage(id, file)` → `POST '/{id}/image'`.
  - React Query key moved from `['storefront', 'hero-banner']` to
    `['storefront', 'hero-banners']`.
  - `HeroBannerForm` (shared add/edit component, hosted in a `Modal`
    `size="md"`, `key={editItem.id}` on edit): headline input, subtext
    textarea, `LinkTargetPicker` reused unchanged (`allowedKinds={['Category',
    'Product', 'Collection', 'CustomUrl']}`, `allowNone`). The
    `ImageUpload` control only renders when `editItem` is non-null (i.e.
    editing an existing, already-created banner) — absent entirely (not
    just visually hidden) while creating a new banner.
  - `HeroBannerRow` presentational row: thumbnail (or a placeholder icon
    when `imageUrl` is empty), headline, subtext excerpt, a plain-text CTA
    summary line, inline `targetMissing` warning on that row only, Up/Down
    reorder buttons (disabled at list boundaries), Edit, Delete.
  - Reorder mechanics mirror `moveSibling`: swap the moved item with its
    neighbor in the locally sorted list, recompute the whole list's
    `displayOrder` 0..n, submit the full `HeroBannerPosition[]` via
    `reorderMutation`, invalidate the query on success — no independent
    optimistic-reorder state.
  - Delete uses `ConfirmDialog` with the same prop pattern as
    `StorefrontMenusPage.tsx` (`title="Delete Banner"`,
    `confirmText="Delete"`, `variant="danger"`).
  - All list mutations (create/update/delete/reorder) now use
    `invalidateQueries`, not `setQueryData` — the prior single-row
    `setQueryData` optimization (2026-08-09 decision) no longer applies to
    a list of N independent rows; this matches the codebase-wide
    convention used by Content Pages/Collections/Menus.

No other files were touched — `LinkTargetPicker.tsx`, `StorefrontMenusPage.tsx`,
`ImageUpload`, `ConfirmDialog`, `Modal`, `BaseRepository`, and
`router/index.tsx`'s `storefront/hero-banner` route are all unchanged, as
scoped.

## Tests added

No test runner/framework is configured in this repo (no `test` script in
`package.json`, no existing `*.test.tsx`/`*.spec.tsx` files anywhere in
`src/`) — consistent with how Task Groups 11-15 were verified here.
Verification for this pass is `tsc --noEmit` (via `npm run typecheck`) and
`vite build` (via `npm run build`), both clean (see below), plus a manual
read-through mapping each row of behavior against the task group's Tasks
and QA checklist sections and this repo's PRD's 3 acceptance criteria for
Feature 7:
1. Create/edit/delete/reorder for multiple banners, with `LinkTargetPicker`
   reused unchanged — implemented as described above.
2. A tenant with one pre-existing banner sees it as the first (only) item
   of the new list — this is a pure FE list-rendering change over
   whatever the `GET /storefront/hero-banners` endpoint returns post-
   migration; no FE-side migration step exists to write, matching the
   task group's own QA note.
3. `tsc`/`vite build` clean, no other admin page touched — confirmed
   below; `git status`/`git diff --stat` show only this one file changed
   under `src/`.

This wasn't exercised against a live backend — no `ecom-os-be` instance
was available in this session, same as Task Groups 11-15's noted
verification bar for this repo.

## Deviations from the design

- The plain-text CTA summary is rendered from the link fields alone
  (`"No link"` / `"Custom URL: {url}"` / `"Links to: {Kind} #{id}"`),
  without resolving the target's display name (e.g. a category's actual
  name). The task group's own example wording ("Links to: Category —
  Shoes") implied a resolved name, but explicitly deferred the exact
  format as an implementation detail. Resolving names would require
  fetching every distinct category/product/collection referenced across
  the whole banner list up front (new, unscoped queries beyond reusing
  `LinkTargetPicker` "unchanged"), which is disproportionate for a list
  that's typically a handful of rows; the kind+id form still tells the
  admin unambiguously what a row targets.
- Per the task group's own "safe to resolve" list: a newly created banner
  is *not* auto-reopened in edit mode after creation — creating closes
  the modal, and the admin clicks Edit on the new row to attach an image.
  Chosen as the smaller diff (matches this repo's existing Content Pages
  create→edit precedent) over adding auto-reopen state.
- `HeroBannerApi`'s delete method is named `remove`, not `delete` — `delete`
  collides with `BaseRepository.delete`'s signature (`<T>(url: string,
  ...)`) when overridden with a narrower `(id: number)` signature,
  producing a TS2416 error. `StorefrontMenusPage.tsx`'s equivalent
  (`StorefrontMenuApi`) has the same constraint and names its method
  `deleteItem` for the same reason.

## Blockers

None.
