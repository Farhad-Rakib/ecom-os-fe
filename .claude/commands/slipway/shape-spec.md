# Shape Spec

Read the approved, whole-product PRD (`slipway/product/prd.md`) and
produce a technical design broken into **task groups** — batches of
related features designed and built together — precise enough that
`/implement` never has to make an architectural call mid-build. If
`/implement` would have to guess at a structural decision, that's a
gap in this design, not a judgment call it should make.

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
- Write down *why*, not just *what*, for every non-obvious choice.
- Use AskUserQuestion if the PRD leaves a structural decision genuinely
  open — don't silently pick one.

## Process

### Step 1 — Read the PRD

Read `slipway/product/prd.md`. If it doesn't exist, stop and tell the
user to run `/plan-product` first.

### Step 2 — Read context

Read `slipway/product/tech-stack.md`,
`slipway/standards/coding-standards.md` (if present), and
`slipway/memory/decisions.md` (if it exists) — a new group's design
that contradicts a standing decision without acknowledging it is a bug
in the design, not a stylistic choice.

### Step 3 — Group features into task groups

Partition the PRD's numbered features into task groups, grouped by
shared data model or user flow — not by an arbitrary feature count.
Number groups in build order (dependencies first: e.g. auth/accounts
before transactions, transactions before reports). Note which existing
task groups (if any, from a prior `/shape-spec` run) are already
implemented, so a newly added feature from `/scope-feature` can be
folded into a new group rather than reopening a finished one.

### Step 4 — Design each group

For each task group, cover:

- **Tasks** — the concrete pieces of work in this group
- **API endpoints** — method, path, request/response shape
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
  group 01")
- **QA checklist** — specific things QA must verify beyond the PRD's
  acceptance criteria (edge cases, cross-feature interactions within
  the group)

Label every open question explicitly as blocking (stops
implementation) or safe-to-resolve-during-implementation — don't make
`/implement` or the human re-triage your uncertainty.

### Step 5 — Write one file per task group

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
another group]

## QA checklist

[bullets]

## Blocking open questions

[or "none"]

## Deferred / safe-to-resolve-during-implementation

[or "none"]
```

Write each to `slipway/product/task-groups/<NN>-<slug>.md`.

### Step 6 — Record architectural decisions

For every non-obvious choice in a group's design (a new dependency, a
schema decision, a pattern chosen over an alternative), append an
entry to `slipway/memory/decisions.md` (create it with a `# Decisions`
header if it doesn't exist):

```markdown
## <date> — shape-spec — task-group-<NN>

<the decision>. Alternatives considered: <...>. Why this one: <...>.
```

### Step 7 — Pause for review

List the task groups created (number, title, feature numbers covered)
and ask via AskUserQuestion whether to approve all of them, revise a
specific group, or stop. Do **not** continue into `/implement` — the
user triggers each group's implementation explicitly, by number, when
they're ready for that group specifically.

### Step 8 — Record approval

**Only if approved**, append one line to `slipway/memory/progress.md`:
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

## Tips

- A task group should be small enough that `/implement` can build it
  in one pass, but large enough that splitting it further would just
  create artificial dependencies between groups.
- Concrete file/module/table names and short declarative sentences
  beat abstract diagrams-in-prose.
