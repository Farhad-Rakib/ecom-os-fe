# Decisions

## 2026-08-19 — shape-spec — task-group-01

The backend's `OrderStatusTransitions.AllowedFrom` matrix is
hand-mirrored client-side as a plain `ALLOWED_TRANSITIONS` constant,
rather than fetched from a new endpoint or hardcoded per-status
`if`/`switch` branches inline in the component. Alternatives
considered: (1) add a new backend endpoint exposing the matrix so the
FE never duplicates it; (2) skip mirroring entirely and let the
`<select>` always offer all 7 statuses, relying only on the backend's
400 rejection. Why neither: (1) is a new backend surface for a static,
rarely-changing table — disproportionate for what it solves, and this
task group is scoped to FE-only per its own PRD; (2) would let an
admin pick a doomed transition and only find out after submitting,
which is worse UX than the cost of a small duplicated constant. Chose
the mirror, with an explicit maintenance note in the task group file
flagging it as the one piece of duplicated backend logic in this
group.

Single flat feature folder (`src/features/orders/pages/`, no
`components/` subfolder yet) rather than pre-splitting into smaller
components. Alternatives considered: extracting a shared
`OrderStatusBadge` component up front. Why not: `ProductsPage.tsx`
itself keeps its status-badge logic inline until a second consumer
actually needs it; `OrderDetailPage.tsx` reusing `OrdersPage.tsx`'s
exported `statusBadgeClasses` constant is enough for two consumers
without a full component extraction — matches this codebase's own
default of not extracting until a third use appears.

## 2026-08-19 — implement — task-group-01

Added an optional `onRowClick` prop to the shared `DataTable.tsx`
rather than faking row-click with a `rowActions` "View" button.
Alternatives considered: (1) a `rowActions` entry with an eye icon,
matching `ProductsPage.tsx`'s existing pattern exactly with zero
shared-component changes; (2) wrap each `<td>`'s content in a `Link`.
Why not: (1) doesn't satisfy "row click navigates to detail" as
literally specified — it's a button click, not a row click; (2) would
require touching every column's `render` output instead of one prop.
Chose a minimal, backward-compatible, opt-in prop (default `undefined`
= no behavior change for existing consumers like `ProductsPage.tsx`,
verified via `tsc`/`vite build`) since the task group's FE design
explicitly calls for whole-row-click navigation and the shared table
had no mechanism for it at all.
