# Implementation Report: Task Group 17 — Branding Settings Extensions UI (variant: default)

## What changed

- `src/features/storefront/pages/BrandingPage.tsx`:
  - `StorefrontBrandingDto`/`BrandingWriteDto`: added `productGridColumns:
    number`, `announcementText: string | null`, `announcementEnabled:
    boolean`.
  - `FormState`/`emptyForm`/`toFormState`: added local state for all
    three, defaulting to `4`/`''`/`false` (matches `ecom-os-be` Task
    Group 18's own defaults).
  - New "Storefront Display" section (between Tagline and Social
    Links): a bounded `<select>` for grid columns (options `2`-`6`
    only — an out-of-range value is structurally unreachable, no
    separate numeric validation needed), an announcement text input
    (`maxLength={300}`), and a checkbox toggle.
  - Client-side guard: the "Show announcement bar" checkbox is
    `disabled` whenever the announcement text is blank
    (`canEnableAnnouncement`), and clearing the text while enabled
    automatically unchecks it — mirrors the backend's write-time
    rejection of `enabled: true` with empty text, so the form can't
    produce an invalid combination in the first place.
  - `handleSubmit`'s `saveMutation.mutate(...)` payload: added the
    three fields.
  - No API module change beyond the DTO interfaces — `StorefrontBrandingApi`
    stays as-is (fields ride along in the same `update()` call).

## Tests added

No test suite exists for this page (consistent with this repo's
established verification bar for Storefront Configuration pages —
`tsc`/`vite build` only, per Task Groups 11-16's precedent). Verified:
`tsc --noEmit` clean, `vite build` clean.

## Deviations from the design

None — implemented exactly as specified in
`slipway/product/default/task-groups/17-branding-settings-extensions-ui.md`.

## Blockers

None. No live-backend click-through this pass (none available
in-session), consistent with every prior Storefront Configuration FE
task group in this repo.
