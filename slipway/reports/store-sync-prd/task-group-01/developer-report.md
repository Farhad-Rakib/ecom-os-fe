# Implementation Report: Task Group 01 — Store Connection (variant: store-sync-prd)

## What changed

- `src/features/store-sync/pages/StoreConnectionPage.tsx` (new) — the
  sole FE file this task group adds, per its "FE pages/components"
  section ("sole page this group adds"). Contains, all inline as the
  task group's Tasks section specifies:
  - `StoreConnectionStatusDto`, `CatalogSyncResultDto`,
    `OrderSyncResultDto` interfaces.
  - `SUPPORTED_PLATFORMS` constant — one entry (`Shopify`), each entry
    carrying its own `credentialFields` array
    (`shopDomain`/`accessToken`), per `decisions.md`'s recorded
    reasoning.
  - `StoreSyncApi extends BaseRepository` (`super('/store-sync')`)
    with `getConnection`/`connect`/`disconnect`/`syncCatalog`/
    `syncOrders`, matching `site-settings.api.ts`'s
    `if (!res.success) throw new Error(res.message)` pattern (skipped
    for `disconnect()`, which is a 204 No Content with no envelope
    body).
  - `StoreConnectionPage` component: not-connected state renders the
    platform selector + credential form; connected state renders a
    status card (Platform, Status badge, both Last Synced timestamps
    formatted via `toLocaleString()` or "Never") plus Disconnect
    (behind `ConfirmDialog`) and two independent Sync-now buttons with
    their own inline result panels (counts, plus an amber "records
    failed, will retry automatically" line when `failedRecords > 0`,
    styled as a warning, not an error). The masked `accessToken` field
    uses `ProfilePage.tsx`'s exact show/hide pattern
    (`type={show ? 'text' : 'password'}`, `Eye`/`EyeOff` toggle
    button). `inputCls`/`labelCls` constants copied verbatim from
    `SiteSettingsPage.tsx`/`ProfilePage.tsx`.
  - A 400 from `connect` is caught in the mutation's `onError` and
    written to local `connectError` state, rendered inline above the
    submit button (`err?.response?.data?.message || err.message`,
    same extraction pattern as every other mutation in this repo) —
    not a toast. Disconnect/sync-now failures use `toast.error`
    (no acceptance criterion requires those inline, and every other
    mutation-error path in this repo toasts).
- `src/app/router/index.tsx` — added one import
  (`StoreConnectionPage`) and one route entry,
  `store-sync/connection`, wrapped in
  `<PermissionGuard permissions={['store-sync.manage']}>`, appended
  after the `orders/:id` route the concurrent `order-management-prd`
  task group had already added by the time I edited this file (its
  import block and route array were already present; I only added my
  own lines, nothing else in the file was touched).

No other files were created or modified.

## Tests added

None — per this repo's stated verification bar (no test framework
exists; `package.json` has no test script, zero `.test.`/`.spec.`
files in `src/`), verification here is `tsc --noEmit` + `vite build`
plus manual QA-checklist review:

- **AC1** (connect with valid credentials shows connected status;
  failure shows inline error, form stays visible): `connectMutation`
  updates the query cache with the response DTO on success (switching
  the page to the connected view without a refetch); `onError` writes
  to `connectError`, rendered inline, the form itself is unconditional
  JSX so it never unmounts on error.
- **AC2** (connected view shows platform/status/both timestamps,
  "Never" if null): `formatDate()` returns `'Never'` for `null`, the
  status card renders all four fields from `StoreConnectionStatusDto`
  unconditionally when a connection exists.
- **AC3** (disconnect flips to Disconnected, no sync actions until
  reconnected): `isActiveConnection = connection?.status ===
  'Connected'` gates both Sync-now buttons and the Disconnect button
  together; after a successful disconnect the connection query is
  invalidated and refetched, so the card reflects `Disconnected` and
  those buttons disappear, replaced by the reconnect form (see
  Deviations).
- **AC4** (catalog/order sync independently triggerable, each shows
  its own result, non-blocking warning on `failedRecords > 0`):
  `catalogSyncMutation`/`orderSyncMutation` are wired to separate
  buttons and separate result state (`catalogSyncResult`/
  `orderSyncResult`), each rendering its own counts and its own
  conditional amber warning line — no shared/blocking state between
  the two.
- **AC5** (`tsc`/`vite build` clean; no other page's behavior
  changes): see Blockers/verification output below; `git status`
  confirms only `StoreConnectionPage.tsx` (new) and an additive diff
  to `router/index.tsx` changed.

Manual QA-checklist walkthrough (code-level, no live backend available
in this environment):
- No-connection state renders only the connect form — confirmed by
  the `hasNoConnection` branch being the sole render path when all
  four DTO fields are `null`.
- Invalid-credential 400 keeps the form mounted with the message
  inline — confirmed (see AC1 above).
- Disconnected-but-previously-connected state hides Sync/Disconnect
  and shows only the reconnect form — confirmed by `isActiveConnection`
  gating those three actions together while the status card (with
  `Disconnected` badge) still renders whenever `!hasNoConnection`.
- Sync-now with `failedRecords > 0` renders an amber, non-error-styled
  line, not a toast — confirmed (mutation `onSuccess` never toasts;
  only `onError` toasts).
- Disconnect requires the `ConfirmDialog` — the button only calls
  `setShowDisconnectConfirm(true)`; `disconnectMutation.mutate()` is
  wired to `ConfirmDialog`'s `onConfirm`, not the button's `onClick`.

## Deviations from the design

1. **Reconnect-form visibility (task group's own "Deferred /
   safe-to-resolve" item):** implemented the suggested resolution
   literally — when a connection row exists but
   `status !== 'Connected'`, the status card still renders (read-only,
   no Sync/Disconnect actions) and the same connect form renders below
   it, unlabeled differently only by its heading ("Reconnect Store"
   vs. "Connect a Store"), submitting to the same `POST /connection`.
   No pre-fill, per the task group's own note that
   `EncryptedCredentials` isn't returned to the FE.
2. **Sidebar/nav entry — not added, flagging as a real discrepancy,
   not a silent skip.** The task group's Tasks section says to add a
   sidebar entry "the same way Orders' link was added in
   `order-management-prd` task-group-01," and both task groups assume
   a static FE "nav config file" exists that other features' links
   were added to. I verified this assumption against the actual
   codebase: this repo's sidebar (`src/app/layouts/components/
   Sidebar.tsx`) renders menu items entirely from
   `menuApi.getMenuItems()`/`getAllMenuItems()` — a backend-driven,
   database-backed menu tree managed at runtime via
   `src/features/menu/pages/MenuPage.tsx` (Menu Management admin UI).
   There is no static array, JSON, or config file anywhere in this
   repo's `src/` that lists nav entries by feature — I grep'd for one
   (menu-item-shaped literals, seed files, "Storefront"/"Catalog"
   string literals outside the dynamic menu code) and found none. So
   "add a Store Sync entry the same way Orders' link was added" has no
   FE code-level equivalent to perform: a tenant admin adds it via the
   Menu Management page after this feature ships, not via a
   code change. Per Step 5 (design is wrong, not just underspecified —
   it assumes a file that doesn't exist), I did not invent a config
   file or touch `MenuPage.tsx`/menu seed data (which is backend/DB
   state this repo doesn't own) to work around it. This does not block
   any acceptance criterion — the route (`store-sync/connection`) is
   registered and reachable directly, and none of Feature 1's five ACs
   mention the sidebar. Flagging for whoever picks this up: either
   note in product docs that "nav entries are added via Menu
   Management at runtime, not in code" (fixing the assumption for
   every future task group that repeats it), or add a Store Sync
   `MenuItem` through that admin UI post-deploy.

## Blockers

None. `npx tsc --noEmit -p tsconfig.app.json` shows exactly one
pre-existing, unrelated error in `src/features/storefront/pages/
BrandingPage.tsx:293` (confirmed via `git status`/`git log` — that
file has no local modifications and the error traces to commit
`ffc4539`, predating this task group). `npx vite build` completes
with zero errors.
