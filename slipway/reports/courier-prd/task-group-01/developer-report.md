# Task Group 01 — Courier Directory & Connection UI — Developer Report

**Status:** complete. `tsc --noEmit` and `vite build` both clean.
Uncommitted on `dev`.

## Files added

- `src/features/courier/pages/CouriersPage.tsx` — list, create/edit
  modal, activate/deactivate, `CourierApi`/`courierApi`,
  `SUPPORTED_INTEGRATIONS`, and the exported `CourierDto` /
  `CourierIntegration` / status maps task group 02 imports
- `src/features/courier/pages/CourierConnectionPage.tsx` —
  settings-shaped credentials page

## Files changed

- `src/app/router/index.tsx` — `couriers` and
  `couriers/:id/connection`, both under
  `<PermissionGuard permissions={['courier.manage']}>`

## Decisions

**`SUPPORTED_INTEGRATIONS` drives the form, not a hardcoded Steadfast
one.** Adding Pathao or RedX later is a new entry in that array. Same
call `store-sync-prd` made with `SUPPORTED_PLATFORMS`.

**A `Manual` courier shows no credential fields and no warning.** The
backend models this as `NotApplicable`, distinct from `NotConnected`,
and the UI honours the distinction — its connection page says plainly
that there is nothing to connect, rather than looking like a
connection that is missing. The Connection row action is hidden for
manual couriers entirely.

**Changing a courier's integration warns before saving.** The backend
discards stored credentials when the integration changes; an admin
should know that before clicking save, not discover it after.

**Credential inputs are cleared from component state on success.** The
backend never returns them, so holding them locally afterwards would
be the only place they still exist in plaintext.

Backend error messages surface verbatim — a duplicate courier name
returns a 409 naming it, which is far more useful than "save failed".
