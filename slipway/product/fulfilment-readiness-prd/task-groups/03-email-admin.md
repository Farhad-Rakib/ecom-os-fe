# Task Group 03: Email Configuration, Templates & Delivery Log

## Features covered

3. Email Configuration, Templates & Delivery Log

Depends on backend task groups 04 and 05.

## Tasks

- **New** `src/features/notifications/` with a shared repository for
  the settings, template and delivery endpoints.
- **New** `EmailSettingsPage.tsx` — sender name/address, SMTP host,
  port, username, password and SSL. **The password follows
  `CourierConnectionPage`'s credential pattern exactly**: the API
  returns only `hasSmtpPassword`, the field is cleared after a
  successful save, and a stored value is never rendered. A banner
  states when the tenant is on the platform default; a
  revert-to-default action removes their own settings. A send-test
  action takes a recipient and surfaces the specific failure text.
- **New** `EmailTemplatesPage.tsx` — the template list with per-row
  enable/disable, and an editor for subject and body with the
  template's available `{{tokens}}` listed beside the field so a
  tenant can see what they may substitute.
- **New** `EmailDeliveryLogPage.tsx` — the log, filterable by status
  and order id, with a retry action on failed rows. An `Abandoned`
  row is styled distinctly from one still retrying — the difference
  is the whole point of the status.
- `OrderDetailPage.tsx` — a "Customer notifications" panel listing
  what was sent to the buyer, when, to which address, and any failure.
- All three new routes under `/notifications/*`, guarded by
  `notifications.manage`.

## API endpoints consumed

`GET|PUT|DELETE /notifications/email-settings`,
`POST /notifications/email-settings/test`,
`GET|PUT /notifications/templates[/{key}]`,
`GET /notifications/deliveries`,
`POST /notifications/deliveries/{id}/retry`,
`GET /orders/{id}/notifications`.

## FE pages/components

Listed under Tasks — this group is entirely FE.

## DB design

N/A.

## QA checklist

- The SMTP password is never populated into the form from the server,
  including after a save and a page reload.
- A tenant with no settings sees the platform-default banner; after
  saving their own it disappears; after reverting it returns.
- A failing send test shows the server's specific reason, not a
  generic toast.
- Disabling one template does not change the others.
- An unknown token typed into a template is accepted by the form —
  the backend leaves it visibly intact rather than erroring, and the
  UI must not pretend to validate what it cannot.
- The delivery log filters by status and by order, and a retry updates
  the row without a full reload.
- An abandoned row is distinguishable from a failed-but-retrying one.
- The order notification panel renders for an order with no messages
  yet, and for one whose message failed.
- Routes are unreachable without `notifications.manage`.
- Light and dark themes on all three screens.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the template editor gets a monospace font and a preview
  pane. A preview against real order data is explicitly out of scope;
  a static render of the raw body is optional.
