# Implementation Report: Task Group 03 — Email Configuration, Templates & Delivery Log (variant: fulfilment-readiness-prd)

## What changed

- `notifications/notifications.api.ts` — **new**. Types and repository for settings, templates and
  deliveries, plus the shared `templateLabel` map.
- `notifications/pages/EmailSettingsPage.tsx` — **new**. SMTP form following the
  `CourierConnectionPage` credential pattern exactly: the password is never populated from the
  server, the field is cleared after a save, and a blank field keeps the stored secret. Platform-default
  banner, revert action behind a confirm, and a send test that surfaces the server's own reason.
- `notifications/pages/EmailTemplatesPage.tsx` — **new**. Template list with per-row enable/disable
  and an editor showing that template's available `{{tokens}}`, plus a note that an unrecognised
  token is left visible rather than blanked.
- `notifications/pages/EmailDeliveryLogPage.tsx` — **new**. Filterable by status and order, retry on
  anything not yet sent, and `Abandoned` styled distinctly from `Failed`.
- `orders/components/OrderNotificationsPanel.tsx` — built under FE task group 01, satisfies this
  group's AC7.
- `app/router/index.tsx` — three routes under `notifications.manage`.

## Verification

`npm run typecheck` and `npm run build` clean; all four new files lint with zero errors.

## Deviations from the design

1. **The template enable/disable toggle re-fetches the template before saving**, because the update
   endpoint takes the full template. Invisible to the user; worth a dedicated endpoint if the list
   ever grows.
2. **No preview pane.** Explicitly out of scope in the PRD; the body is a monospace textarea.

## Blockers

None.
