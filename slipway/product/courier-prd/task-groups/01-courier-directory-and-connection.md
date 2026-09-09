# Task Group 01: Courier Directory & Connection UI

## Features covered

1. Courier Directory UI
2. Courier Connection UI

## Tasks

- New `src/features/courier/pages/CouriersPage.tsx` — list + create/edit
  modal + activate/deactivate, using the shared `DataTable` and the
  `BaseRepository` API-class convention (`CourierApi extends
  BaseRepository`, instantiated once as `courierApi`), matching
  `OrdersPage.tsx`'s inline-DTO structure exactly.
- New `src/features/courier/pages/CourierConnectionPage.tsx` —
  settings-shaped, closer to `StoreConnectionPage.tsx` than to a list
  page: credential fields, test-connection, disconnect, status.
- A `SUPPORTED_INTEGRATIONS` constant driving the integration selector
  and its credential fields — same call `store-sync-prd` made with
  `SUPPORTED_PLATFORMS`, so Pathao/RedX later is a new entry rather
  than a rewritten form. v1 entries: `Manual` (no credentials) and
  `Steadfast` (apiKey, secretKey, webhookToken).
- Routes `couriers` and `couriers/:id/connection` in
  `src/app/router/index.tsx`, both under
  `<PermissionGuard permissions={['courier.manage']}>`.
- Export `CourierDto`/`CourierIntegration` from `CouriersPage.tsx` for
  task group 02's dispatch picker to import — the same
  export-from-the-list-page pattern `OrdersPage.tsx` already uses.

## API endpoints consumed

| Method | Path | Purpose |
|---|---|---|
| GET | `/couriers?includeInactive` | list |
| GET | `/couriers/{id}` | detail |
| POST | `/couriers` | create |
| PUT | `/couriers/{id}` | update |
| PATCH | `/couriers/{id}/active` | activate/deactivate |
| POST | `/couriers/{id}/connection` | save credentials |
| POST | `/couriers/{id}/connection/test` | test |
| DELETE | `/couriers/{id}/connection` | disconnect |

All shipped and tested backend-side.

## FE pages/components

- `CouriersPage.tsx` (new) — table of name / integration / connection
  status / active, row-click to the connection page, a create/edit
  modal, and an activate/deactivate action with `ConfirmDialog`.
- `CourierConnectionPage.tsx` (new) — per-courier credentials form,
  masked password inputs, Test Connection button surfacing the
  backend's own message, Disconnect with confirmation, and the stored
  `lastFailureReason` shown when the status is `Failed`.
- A `Manual` courier must show **no credential fields at all** and no
  connection status warning — the backend models this as
  `NotApplicable`, distinct from `NotConnected`.

## DB design

N/A — this repo has no database.

## QA checklist

- Creating a courier with a duplicate name shows the backend's 409
  message rather than a generic failure.
- A `Manual` courier shows no credential fields and is not presented
  as misconfigured.
- A saved credential is never rendered back in readable form, before
  or after a reload.
- Test Connection surfaces the backend's specific failure text.
- A deactivated courier is visibly distinct and hidden unless
  "include inactive" is on.
- Typecheck and build clean.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the connection form lives on its own route or in a drawer on
  the list page — route is specified above; a drawer would work too.
