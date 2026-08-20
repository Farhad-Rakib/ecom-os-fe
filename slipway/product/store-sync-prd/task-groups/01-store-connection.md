# Task Group 01: Store Connection

## Features covered

1. Store Connection

## Tasks

- New feature folder `src/features/store-sync/pages/`.
- `src/features/store-sync/pages/StoreConnectionPage.tsx` —
  `StoreConnectionStatusDto` inline; a `StoreSyncApi extends
  BaseRepository` class (`super('/store-sync')`) with `getConnection`
  (`GET /connection`), `connect` (`POST /connection`), `disconnect`
  (`DELETE /connection`), `syncCatalog` (`POST /catalog/sync`),
  `syncOrders` (`POST /orders/sync`).
- Two view states in one page component, switched on whether
  `getConnection()` returns all-`null` fields:
  - **Not connected**: a form — platform `<select>` (options driven by
    a `SUPPORTED_PLATFORMS` constant with exactly one entry, `Shopify`,
    each entry carrying its own credential-field list, so a second
    platform later only needs a new entry, not a rewritten form),
    `shopDomain` (plain text input), `accessToken` (masked
    password-style input with show/hide toggle, per
    `tech-stack.md`/`ProfilePage.tsx`'s existing pattern). Submits via
    the `connect` mutation; a 400 error's message rendered inline
    above the submit button, not a toast (the form stays visible with
    the error in context, matching how validation errors are usually
    shown on this repo's settings-style forms).
  - **Connected**: a status card (Platform, Status badge, Last Catalog
    Synced At, Last Order Synced At — each formatted or "Never"), a
    **Disconnect** button behind `ConfirmDialog`
    (`src/components/ui/Dialog/ConfirmDialog.tsx`), and two **Sync
    now** buttons (Catalog, Orders) each independently wired to their
    own mutation, each showing its own inline result summary
    (`X categories / Y products synced` or `Z orders synced`, plus `⚠
    N records failed, will retry automatically` when
    `failedRecords > 0`) after completion, cleared on next fetch.
  - Both Sync-now buttons and Disconnect are only rendered when
    `status === 'Connected'` — matches the backend's own 404/409
    rejection for a missing/disconnected connection, so the UI never
    offers an action guaranteed to fail.
- Route registration: `store-sync/connection`, wrapped in
  `<PermissionGuard permissions={['store-sync.manage']}>` (backend's
  existing policy is `Permissions.StoreSyncManage` =
  `"store-sync.manage"` — reuse verbatim).
- Sidebar/nav entry: "Store Sync" (or similar, implementer's call on
  exact label) added the same way Orders' link was added in
  `order-management-prd` task-group-01.

## API endpoints

Consumed only, all pre-existing on `ecom-os-be` (`store-sync-prd`, all
3 task groups) — no backend changes:

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/store-sync/connection` | — | `ApiResponse<StoreConnectionStatusDto>` |
| POST | `/store-sync/connection` | `{ platform, credentialFields: { shopDomain, accessToken } }` | `ApiResponse<StoreConnectionStatusDto>` |
| DELETE | `/store-sync/connection` | — | 204 |
| POST | `/store-sync/catalog/sync` | — | `ApiResponse<{ categoriesSynced, productsSynced, failedRecords, syncedAt }>` |
| POST | `/store-sync/orders/sync` | — | `ApiResponse<{ ordersSynced, failedRecords, syncedAt }>` |

## FE pages/components

- `StoreConnectionPage.tsx` (new, sole page this group adds) — see
  Tasks for both view states in full detail. No shared list/table
  component needed (this is a single-record settings page, closer in
  shape to `SiteSettingsPage.tsx` than to `ProductsPage.tsx`).

## DB design

N/A — this repo has no database, and this task group makes no backend
changes.

## QA checklist

- With no connection, only the connect form is visible; submitting
  with a valid `shopDomain`/`accessToken` (against a real or
  test-doubled backend) shows the connected status card afterward.
- Submitting with an invalid/missing credential shows the backend's
  own error message inline, and the form remains on screen (not
  navigated away, not silently cleared).
- With a connection present but `Status: Disconnected`, neither Sync
  button nor Disconnect is rendered — only whatever reconnect affordance
  the design provides (implementer's call: reuse the same connect form,
  since `POST /connection` again is how a disconnected tenant
  reconnects per the backend's own semantics — resets both
  `LastSyncedAt` cursors, which the UI should reflect after success).
- Triggering "Sync now" (Catalog) shows the returned counts; triggering
  it again with `failedRecords > 0` in the response shows the warning
  copy, not an error-styled toast.
- Disconnecting requires going through the confirm dialog — a stray
  click on the button alone does not disconnect.
- `tsc`/`vite build` clean; no other page's behavior changes.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Exact copy/wording for the sync-result summaries and the "Never"
  placeholder — implementer's call, no acceptance criterion depends on
  specific wording.
- Whether reconnecting after a disconnect reuses the same connect form
  or a slightly different one (e.g. pre-filled `shopDomain`) — the
  backend has no concept of "remembered" prior credentials
  (`EncryptedCredentials` isn't returned to the FE), so there's nothing
  to pre-fill regardless; a plain reuse of the same empty form is the
  simplest correct choice.
