# Shape Spec

Read one architecture variant's approved PRD
(`slipway/product/<variant>/prd.md`) and produce a technical design
broken into **task groups** — batches of related features designed and
built together — precise enough that `/implement` never has to make an
architectural call mid-build. If `/implement` would have to guess at a
structural decision, that's a gap in this design, not a judgment call
it should make.

`$ARGUMENTS` is `[<variant>]` — see Step 1 for how it's resolved. This
is the command where the architecture actually matters: the same
feature list can produce very different task groups depending on
whether the variant is a modular monolith or microservices, single- or
multi-tenant — module/service boundaries, tenant-scoping in the DB
design, and inter-service API shapes are all decided here, per
variant, even when two variants share an identical PRD.

Unlike a single-feature spec, this command does **not** auto-continue
into `/implement`: task groups need their own manual review before any
code gets written, since one group's design (a schema choice, an API
shape) can commit the whole system to something the next group has to
live with. You trigger each group's implementation explicitly later,
by number, once you're ready for that specific group.

## Important guidelines

- Design at the level a developer needs — name actual
  endpoints/tables/components, not abstract boxes and arrows.
- Group features by what makes sense to design and build as one unit
  (shared data model, one user flow, one API surface), not by
  arbitrary count. A group can be a single feature or several.
- Let the variant's architecture actually shape the grouping: a
  microservices variant's groups typically align with service
  boundaries; a modular-monolith variant's groups align with internal
  module boundaries instead. Don't design a microservices variant as
  if it were a monolith split into files, or vice versa.
- Write down *why*, not just *what*, for every non-obvious choice.
- Use AskUserQuestion if the PRD leaves a structural decision genuinely
  open — don't silently pick one.

## Process

### Step 1 — Resolve the variant

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

Parse a leading variant slug from `$ARGUMENTS`:

- Matches an existing row → use it.
- No slug given, and `variants.md` has exactly one row → use that row.
- No slug given, and `variants.md` has more than one row → list the
  variants and ask via AskUserQuestion which one to shape a spec for.
- Slug given but not found → list the existing variants and stop.

### Step 2 — Read the PRD

Read `slipway/product/<variant>/prd.md`. If it doesn't exist, stop and
tell the user to run `/plan-product <variant> "..."` first. Confirm
`slipway/memory/<variant>/progress.md` has a
`plan-product — prd: approved` entry for this variant — if not, tell
the user the PRD hasn't been approved yet and stop.

### Step 3 — Read context

Read `slipway/product/<variant>/tech-stack.md`,
`slipway/standards/coding-standards.md` (if present — shared across
variants), and `slipway/memory/<variant>/decisions.md` (if it exists)
— a new group's design that contradicts a standing decision for this
variant without acknowledging it is a bug in the design, not a
stylistic choice.

### Step 4 — Group features into task groups

Partition the PRD's numbered features into task groups, grouped by
shared data model or user flow *and* by this variant's architecture
(see Important guidelines) — not by an arbitrary feature count. Number
groups in build order (dependencies first: e.g. auth/accounts before
transactions, transactions before reports). Note which existing task
groups (if any, from a prior `/shape-spec` run on this variant) are
already implemented, so a newly added feature from `/scope-feature`
can be folded into a new group rather than reopening a finished one.

Task group numbers are scoped to the variant — `02` in
`modular-monolith-mt` and `02` in `microservice-mt` are unrelated
groups, even if they happen to cover the same PRD feature.

### Step 5 — Design each group

For each task group, cover:

- **Tasks** — the concrete pieces of work in this group
- **API endpoints** — method, path, request/response shape. For a
  microservices variant, also name which service owns each endpoint
  and how services in this group call each other (sync HTTP, async
  event, etc.).
- **FE pages/components** — for every feature in this group, work
  through its acceptance criteria and name every page/component a user
  would actually touch to exercise them — new or changed, with what it
  does. If `tech-stack.md` declares a frontend, this section empty (or
  just "TBD") is a design gap, not a valid answer — a feature with
  acceptance criteria a human verifies almost always has a UI surface
  behind it. The only valid reason to leave it empty is the group is
  genuinely backend/infra-only (e.g. a migration, a cron job, an
  internal API another group's FE will consume later) — state that
  reason explicitly instead of leaving the section blank.
- **DB design** — tables/columns/relations, and migration order
  relative to other groups (e.g. "depends on the accounts table from
  group 01"). For a multi-tenant variant (`-mt` or however this
  product's variant labels it), state the tenant-isolation strategy
  per table (shared table + tenant_id column, schema-per-tenant,
  database-per-tenant) explicitly — don't leave it implied. For a
  microservices variant, note which service owns which tables; no
  table should be written to by more than one service.
- **QA checklist** — specific things QA must verify beyond the PRD's
  acceptance criteria (edge cases, cross-feature interactions within
  the group; for a multi-tenant variant, include at least one
  cross-tenant isolation check per group that touches tenant data)

Label every open question explicitly as blocking (stops
implementation) or safe-to-resolve-during-implementation — don't make
`/implement` or the human re-triage your uncertainty.

### Step 6 — Write one file per task group

```markdown
# Task Group <NN>: <group title>

## Features covered

[feature numbers + titles from prd.md]

## Tasks

[bulleted list]

## API endpoints

| Method | Path | Request | Response |
|---|---|---|---|

## FE pages/components

[bullets — new or changed]

## DB design

[tables/columns/relations; migration order note if it depends on
another group; tenant-isolation strategy per table if this variant is
multi-tenant]

## QA checklist

[bullets]

## Blocking open questions

[or "none"]

## Deferred / safe-to-resolve-during-implementation

[or "none"]
```

Write each to `slipway/product/<variant>/task-groups/<NN>-<slug>.md`.

### Step 7 — Record architectural decisions

For every non-obvious choice in a group's design (a new dependency, a
schema decision, a pattern chosen over an alternative), append an
entry to `slipway/memory/<variant>/decisions.md` (create it with a
`# Decisions` header if it doesn't exist):

```markdown
## <date> — shape-spec — task-group-<NN>

<the decision>. Alternatives considered: <...>. Why this one: <...>.
```

### Step 8 — Pause for review

List the task groups created (number, title, feature numbers covered)
and ask via AskUserQuestion whether to approve all of them, revise a
specific group, or stop. Do **not** continue into `/implement` — the
user triggers each group's implementation explicitly, by number, when
they're ready for that group specifically.

### Step 9 — Record approval

**Only if approved**, append one line to
`slipway/memory/<variant>/progress.md`:
`- <date> — shape-spec — task-groups: approved (<N> groups: 01-slug,
02-slug, ...)`. This is what lets `/status` and `/implement` confirm
the task groups were actually approved, not just drafted. If the user
instead chose to revise or stop, don't log anything.

## Rules

- Never write implementation code here. An illustrative snippet is
  fine if clearly marked non-normative.
- Never expand a group's scope beyond the features it lists from
  `prd.md` — a design solving a bigger problem than the PRD asked for
  is a defect, not a bonus.
- If a group's design conflicts with a decision in `decisions.md`, flag
  it as a blocking question rather than silently overriding it.
- If the PRD is ambiguous on a point a group's design depends on,
  that's a blocking open question for that group, not something to
  guess at.
- Never treat "FE pages/components" as optional boilerplate to fill in
  last — design it with the same rigor as the API table. An
  API-endpoints-only group for a feature with user-facing acceptance
  criteria is an incomplete design, not a backend-first draft to
  patch up later.
- Never let one variant's task-group design leak into another
  variant's directory or numbering — each variant's `task-groups/` is
  independent.

## Tips

- A task group should be small enough that `/implement` can build it
  in one pass, but large enough that splitting it further would just
  create artificial dependencies between groups.
- Concrete file/module/table names and short declarative sentences
  beat abstract diagrams-in-prose.
- If two variants share most of their PRD, it's normal for their task
  groups to *not* line up one-to-one — a monolith group spanning three
  features might become three separate service-owned groups in the
  microservices variant.
