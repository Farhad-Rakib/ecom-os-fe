# Tech Stack (olympus)

Fixed by the Olympus templates — `/plan-product` should confirm this
as-is rather than asking frontend/backend/database from scratch.

## Frontend

React — from [olympus-react](https://github.com/Farhad-Rakib/olympus-react).

## Backend

.NET Core Web API, multi-tenant — from
[olympus-core](https://github.com/Farhad-Rakib/olympus-core).

## Database

Fixed by the `olympus-core` template's multi-tenancy setup — not a
per-project choice, so there's nothing to ask here. See that repo for
the exact engine/config in use.

## Conventions

- Prefer the smallest dependency that solves the problem over a
  framework that solves problems you don't have yet.
- Every new dependency is a decision — record why in
  `slipway/memory/decisions.md`, not just that it was added.
