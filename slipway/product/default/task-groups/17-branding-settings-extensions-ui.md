# Task Group 17: Branding Settings Extensions UI

## Features covered

8. Product Grid Column Configuration (this repo's scope: the admin
   control only — setting storage and public exposure are
   `ecom-os-be`'s Task Group 18)
9. Storefront Announcement / Promo Bar (this repo's scope: the text
   field + toggle only — the Branding entity change and public
   exposure are `ecom-os-be`'s Task Group 18)

Grouped together: both extend the same `BrandingPage.tsx` form against
the same `ecom-os-be` task group's API change.

## Tasks

- `src/features/storefront/pages/BrandingPage.tsx`:
  - `StorefrontBrandingDto` interface (lines 9-20): add
    `productGridColumns: number; announcementText: string | null;
    announcementEnabled: boolean`.
  - `BrandingWriteDto` (22-31): add the same three fields.
  - `FormState` (76-100) and its `emptyForm`/`toFormState` mapping:
    add local state for all three, `emptyForm` defaulting
    `productGridColumns: 4, announcementEnabled: false,
    announcementText: ''` (matches the backend's own defaults, not an
    independent choice).
  - New form controls, placed near the Site Title/Tagline fields
    (before the social-links section): a `<select>` for grid columns
    with exactly the options `2, 3, 4, 5, 6` (a bounded select makes an
    out-of-range value structurally impossible client-side, so no
    separate numeric min/max validation is needed to satisfy the
    backend's `[2,6]` constraint); a text input for the announcement
    message (`maxLength={300}`, matching the backend's
    `MaximumLength(300)`) paired with a checkbox/toggle for "Show
    announcement bar" bound to `announcementEnabled`.
  - Client-side guard mirroring the backend's cross-field rule: disable
    the "Show announcement bar" checkbox (or show an inline validation
    message) when `announcementText` is empty, so the form can't submit
    the invalid `enabled: true, text: empty` combination the backend
    rejects with a 400 — same "don't let the user hit a preventable
    error" standard as the rest of this page's existing required-field
    handling.
  - `StorefrontBrandingApi.update()`'s existing `update()` call needs
    no signature change — the three new fields ride along in the same
    `BrandingWriteDto` payload already being sent.
- No new API module — `StorefrontBrandingApi` stays defined inline in
  this page file, per this repo's existing convention for this page.

## API endpoints (consumed — owned by `ecom-os-be` Task Group 18)

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v{version}/storefront/branding` | load current settings, incl. the two new fields |
| PUT | `/api/v{version}/storefront/branding` | save settings, incl. the two new fields |

## FE pages/components

- `BrandingPage.tsx` — extended, not rewritten: two new fields added to
  the existing single-form page. No new route, no new component file.

## DB design

N/A — this repo has no database. The schema change (`storefront_branding`
gaining `product_grid_columns`/`announcement_text`/
`announcement_enabled`) is entirely `ecom-os-be` Task Group 18's scope;
this task group is a pure API consumer.

## QA checklist

- Grid column select only ever offers 2-6; selecting any value and
  saving round-trips correctly on reload.
- Setting an announcement message and enabling the toggle round-trips
  both together after save.
- Disabling the toggle without clearing the message preserves the
  message in the input (not cleared client-side) — re-enabling shows
  the same text.
- Attempting to enable the toggle with an empty message is prevented
  client-side (checkbox disabled or a clear inline message), never
  reaching the backend as an invalid request.
- `tsc --noEmit` and `vite build` are both clean; no other admin page's
  behavior changes as a result of this task group.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the grid-column control renders as a native `<select>` or a
  small custom stepper/segmented control is a pure presentation choice
  — either satisfies this task group's acceptance criteria as long as
  the value is structurally bounded to 2-6.
