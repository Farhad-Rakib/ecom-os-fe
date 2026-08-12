# Task Group 16: Hero Banner List UI

## Features covered

7. Multi-Banner Hero Carousel & Public Storefront Read API — Branding,
   Hero Banners & Brand Directory (this repo's scope: the admin Hero
   Banner UI rewrite only — the public read endpoints and the
   single-to-list backend migration are `ecom-os-be`'s Task Group 17)

## Tasks

- Rewrite `src/features/storefront/pages/HeroBannerPage.tsx` from a
  single-banner upsert form to a list view, mirroring
  `StorefrontMenusPage.tsx`'s existing list+reorder+modal pattern as
  closely as this flat (non-hierarchical) list allows.
- New local DTOs (exported `interface`s in the same file, same
  convention as today's `HeroBannerDto`/`HeroBannerWriteDto` and
  `StorefrontMenusPage.tsx`'s `MenuItemDto`/`MenuItemPosition`):
  - `HeroBannerDto { id: number; imageUrl: string; headline: string; subtext: string | null; linkTargetType: number | null; linkTargetId: number | null; linkCustomUrl: string | null; displayOrder: number; targetMissing: boolean }`
  - `HeroBannerWriteDto { headline: string; subtext: string | null; linkTargetType: number | null; linkTargetId: number | null; linkCustomUrl: string | null }` (no `id`/`displayOrder`/`targetMissing`, matching `MenuItemWriteDto`'s convention)
  - `HeroBannerPosition { id: number; displayOrder: number }` (no
    `parentItemId` — this list has no hierarchy, unlike Menus)
- `HeroBannerApi extends BaseRepository` (base path
  `/storefront/hero-banners`, plural — matches `ecom-os-be` Task Group
  17's renamed route): `list()` → `GET ''`, `create(dto)` → `POST ''`,
  `update(id, dto)` → `PUT '/{id}'`, `delete(id)` → `DELETE '/{id}'`,
  `reorder(positions)` → `POST '/reorder'` with body `{ items:
  positions }` (same wrapper-key convention as
  `StorefrontMenuApi.reorder`). Separate `HeroBannerUploadApi` (same
  base path, multipart): `uploadImage(id, file)` → `POST
  '/{id}/image'`.
- React Query key moves from the singular `['storefront',
  'hero-banner']` to `['storefront', 'hero-banners']` (list).
- List rendering per row: thumbnail (or a placeholder if `imageUrl` is
  empty — see image-upload note below), headline, a short subtext
  excerpt, a plain-text CTA summary derived from the link fields (e.g.
  "Links to: Category — Shoes" / "Custom URL: /sale" / "No link"), the
  `targetMissing` warning inline on that row only (not page-level,
  since multiple banners can now exist independently), up/down reorder
  buttons (`ArrowUp`/`ArrowDown`, disabled at list boundaries — no
  indent/outdent, this list is flat), Edit and Delete actions, plus an
  "Add Banner" button.
- Reorder: identical mechanics to `StorefrontMenusPage.tsx`'s
  `moveSibling`/`recomputePositions` — swap the moved item with its
  neighbor locally, recompute `displayOrder` 0..n for the whole list,
  submit the full array via `reorderMutation`, invalidate the query on
  success (no independent optimistic-reorder state kept).
- Delete: same `ConfirmDialog` pattern as Menus (`isOpen`/`onClose`/
  `onConfirm`/`title`/`message`/`confirmText="Delete"`/
  `variant="danger"`).
- Editor: a shared `HeroBannerForm` component (mirrors `MenuItemForm`)
  hosted in a `Modal` (`size="md"`), used for both add and edit,
  `key={editItem.id}` on edit to reset local state per item — same
  pattern as `MenuItemForm`. Fields: headline input, subtext textarea,
  `LinkTargetPicker` reused **unchanged**
  (`allowedKinds={['Category','Product','Collection','CustomUrl']}`,
  `allowNone`) — confirmed multi-instance-safe (no global state), so
  reusing it inside a list-item editor needs no changes to the
  component itself.
- **Image upload is edit-mode-only.** Uploading targets
  `/storefront/hero-banners/{id}/image`, which requires an `id` that
  doesn't exist until the content row has been created — so the
  `ImageUpload` control is hidden while creating a new banner (create
  submits content only, closes the modal) and shown once editing an
  existing row. This is the same content-then-image two-step the
  backend already has today, just made an explicit two-click flow in
  the UI now that it applies per-row instead of per-tenant.
- No routing change: `storefront/hero-banner` (singular path segment
  in `router/index.tsx`, `PermissionGuard permissions={['storefront-
  banner.manage']}`) keeps working as-is — only `HeroBannerPage`'s
  internals change. The path staying singular while the API base path
  becomes plural is a deliberate no-op (a URL slug is not required to
  mirror its API's pluralization) — not an inconsistency to fix.

## API endpoints (consumed — owned by `ecom-os-be` Task Group 17)

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v{version}/storefront/hero-banners` | list |
| POST | `/api/v{version}/storefront/hero-banners` | create |
| PUT | `/api/v{version}/storefront/hero-banners/{id}` | update content |
| DELETE | `/api/v{version}/storefront/hero-banners/{id}` | delete |
| POST | `/api/v{version}/storefront/hero-banners/{id}/image` | upload image |
| POST | `/api/v{version}/storefront/hero-banners/reorder` | reorder |

## FE pages/components

- `HeroBannerPage.tsx` — full rewrite (list + modal editor), as
  described above. This *is* the feature's entire admin-visible
  surface; there is no separate editor route (matches today's
  precedent of Hero Banner and Storefront Menus both being single-
  route pages, unlike Content Pages/Collections which do have a
  dedicated editor route).
- New (in-file, not separate components unless the implementer finds
  the file unwieldy — not mandated either way): `HeroBannerForm`,
  a small `HeroBannerRow` presentational row.
- Reused unchanged: `LinkTargetPicker`, `ImageUpload`, `ConfirmDialog`,
  `Modal`, `BaseRepository`.

## DB design

N/A — this repo has no database. The schema change (adding
`DisplayOrder` to `hero_banners`, migration order, tenant isolation)
is entirely `ecom-os-be` Task Group 17's scope; this task group is a
pure API consumer.

## QA checklist

- Create, edit, delete, and reorder all work end to end against a live
  `ecom-os-be` once its Task Group 17 is deployed.
- A tenant that had exactly one banner under the old model sees it as
  the only item in the new list view after the backend migration runs
  — no FE-side migration step is needed, just confirm the list renders
  correctly against real post-migration data.
- The image-upload control is genuinely absent (not just visually
  hidden while still submittable) while creating a new banner, and
  appears once that banner has been saved and is being edited.
- `targetMissing` shows on exactly the affected row when only one of
  several banners has a broken link target — not a page-wide banner.
- Reorder buttons are disabled at the correct list boundaries (first
  item's Up, last item's Down).
- Delete requires confirmation via `ConfirmDialog`, matching
  `StorefrontMenusPage.tsx`'s UX exactly.
- `tsc --noEmit` and `vite build` are both clean.

## Blocking open questions

None — this closely mirrors the already-shipped `StorefrontMenusPage.tsx`
precedent, which already resolved every structural question a flat
(non-hierarchical) reorderable list raises here.

## Deferred / safe-to-resolve-during-implementation

- Whether creating a new banner automatically reopens it in edit mode
  (so an admin can attach an image in one continuous flow) versus
  requiring a second click on the newly created row from the list —
  either satisfies this task group's acceptance criteria; pick
  whichever is the smaller diff and note the choice in the developer
  report.
- The exact wording/format of each row's plain-text CTA summary (e.g.
  "Links to: Category — Shoes") is an implementation detail, not
  specified further here.
