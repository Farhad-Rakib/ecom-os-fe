# Task Group 01: Customer Directory & Status UI

## Features covered

1. Customer Directory UI
2. Customer Account Status UI

## Tasks

- New `src/features/customers/pages/CustomersPage.tsx` — paged,
  searchable list via the shared `DataTable`, `CustomerApi extends
  BaseRepository` on `/admin/customers`, inline DTOs, matching
  `OrdersPage.tsx`'s structure.
- New `src/features/customers/pages/CustomerDetailPage.tsx` — profile,
  saved addresses, order history, account status with its audit trail
  (who changed it, when), and Deactivate/Reactivate behind a
  `ConfirmDialog`.
- One search box, not four: the backend matches a single term across
  email, first name, last name and phone.
- An "include inactive" toggle; the default list excludes deactivated
  accounts.
- Row-click through to detail; each order row links to
  `/orders/{id}`.
- Routes `customers` and `customers/:id` under
  `<PermissionGuard permissions={['customers.manage']}>`.
- Deactivation is a **destructive-feeling** action: the confirm dialog
  must say plainly that it ends the customer's live sessions
  immediately, because it does.

## API endpoints consumed

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/customers?search&includeInactive&page&pageSize` | list |
| GET | `/admin/customers/{id}` | detail incl. addresses + orders |
| PATCH | `/admin/customers/{id}/active` | deactivate/reactivate |

## FE pages/components

- `CustomersPage.tsx` (new) — name / email / phone / status columns.
- `CustomerDetailPage.tsx` (new) — profile card, addresses list, order
  history table, status panel.
- A deactivated customer must be visibly distinct in both views, not
  merely absent.

## DB design

N/A.

## QA checklist

- Searching a partial name, an email, and a phone each find the
  customer.
- A search matching nothing shows the empty state, not an error.
- Deactivating asks for confirmation and states the session
  consequence.
- A deactivated customer's orders remain visible on their detail page.
- The status audit (who/when) is shown, and absent for a customer
  whose status was never changed.
- Typecheck and build clean.

## Blocking open questions

None.

## Deferred / safe-to-resolve-during-implementation

- Whether the order history on the detail page links out or expands
  inline — link out.
