# Task Group 01 — Customer Directory & Status UI — Developer Report

**Status:** complete. `tsc --noEmit` and `vite build` both clean.
Uncommitted on `dev`.

## Files added

- `src/features/customers/pages/CustomersPage.tsx` — paged searchable
  list, `CustomerApi`/`customerApi` on `/admin/customers`, exported
  DTOs and `customerName`
- `src/features/customers/pages/CustomerDetailPage.tsx` — profile,
  addresses, order history, status panel with audit trail

## Files changed

- `src/app/router/index.tsx` — `customers`, `customers/:id` under
  `<PermissionGuard permissions={['customers.manage']}>`

## Decisions

**One search box, not four.** The backend matches a single term across
email, first name, last name and phone, because an admin on a support
call has one piece of information and does not know which field it
belongs to. The UI does not second-guess that with separate inputs.

**The deactivation dialog states the session consequence plainly** —
"will be signed out everywhere immediately". That is exactly what
happens (the backend revokes refresh tokens *and* rejects the access
token already in their browser), and it is not something an admin
would otherwise expect from a status toggle.

**The status audit row is absent, not blank, for an untouched
account.** That is what distinguishes "has always been active" from
"was deactivated and later restored".

**A deactivated customer is visibly marked in both views**, not merely
filtered out of the default list.

## Note

`statusChangedByUserId` renders as `user #{id}`. The backend records
the staff user id and this repo has no bulk user-name lookup on that
path; resolving it to a name would need either a join backend-side or a
second request per row. Left as-is deliberately — it is an audit
detail, not a primary surface.
