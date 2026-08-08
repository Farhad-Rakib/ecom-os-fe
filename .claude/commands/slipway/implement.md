# Implement

Take one approved task group from one architecture variant and produce
working, tested code, scoped strictly to it. Execution, not judgment
about what should be built — if the task group's design doesn't answer
a question you need answered to proceed correctly, that's a
stop-and-report situation, not a "use your best judgment" one.

`$ARGUMENTS` is `[<variant>] <group>` — `<group>` is the task group's
number or slug (e.g. `2` or `02-transactions`); `<variant>` is
resolved per Step 1.

## Important guidelines

- Read the task group and the PRD features it covers together — the
  task group gives the shape of the change (API/FE/DB), the PRD's
  acceptance criteria for those features tell you what "done" means.
- Implement only what this task group covers, even if you can see a
  bigger improvement nearby — note it in the report as a future idea,
  don't fold it in.
- Every new or changed behavior needs a test that would fail without
  the change.
- If this variant is multi-tenant, every test touching tenant data
  needs at least one case that proves isolation (tenant A can't read
  or write tenant B's data) — the task group's DB design states the
  isolation strategy; treat a missing isolation test the same as a
  missing acceptance-criteria test.

## Process

### Step 1 — Resolve the variant

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest of `$ARGUMENTS` as `<group>`. If `variants.md`
has exactly one row, treat the whole of `$ARGUMENTS` as `<group>` and
use that row. If `variants.md` has more than one row and no leading
slug matches one, list the variants and ask via AskUserQuestion which
one `<group>` refers to — don't guess when group numbers collide
across variants (e.g. `02` exists in more than one variant).

### Step 2 — Find the task group

Resolve `<group>` to a file under
`slipway/product/<variant>/task-groups/` by number or slug (e.g. `2`
or `02` both match `02-transactions.md`). If
`slipway/product/<variant>/task-groups/` doesn't exist at all, stop
and tell the user to run `/shape-spec <variant>` first. If the
number/slug given doesn't match any file, list the available task
groups for this variant and stop. Check
`slipway/memory/<variant>/progress.md` for a `shape-spec —
task-groups: approved` entry — if it's missing, tell the user the task
groups haven't been approved yet and stop (run `/status <variant>` if
they want the full picture first).

### Step 3 — Read context

Read the task group file, the specific PRD features it lists (from
`slipway/product/<variant>/prd.md`'s `## Features` section — not the
whole PRD blindly), and
`slipway/standards/coding-standards.md`/`tech-stack.md` if present
(shared across variants), plus
`slipway/product/<variant>/tech-stack.md` for anything this variant
overrides.

### Step 4 — Implement

Follow the task group's design and sequencing: DB changes first if it
notes a migration-order dependency on another group, then API
endpoints, then FE pages/components. For each acceptance criterion in
the features this group covers, write the test that would fail
without the change.

### Step 5 — Handle design gaps honestly

- If the task group is ambiguous about *how* to implement a specific
  piece, and a narrow, reasonable interpretation exists that doesn't
  foreclose other groups — take it, and note the interpretation in
  your report.
- If implementation reveals the design is actually *wrong* (not just
  underspecified — assumes something that doesn't exist, contradicts
  itself, conflicts with a group already built), stop and report the
  discrepancy. Do not patch around it with your own improvised
  mini-design.

### Step 6 — Write `developer-report.md`

```markdown
# Implementation Report: Task Group <NN> — <title> (variant: <variant>)

## What changed

[files touched, mapped to the task group's Tasks/API/FE/DB sections]

## Tests added

[what they verify, mapped to the PRD acceptance criteria for the
features this group covers]

## Deviations from the design

[any interpretation you made, and why — or "none"]

## Blockers

[anything that stopped you — or "none"]
```

Write it to
`slipway/reports/<variant>/task-group-<NN>/developer-report.md`.

### Step 7 — Update memory

Append a one-line entry to `slipway/memory/<variant>/progress.md`
(create with a `# Progress` header if needed):
`- <date> — implement — task-group-<NN>: <one-line summary>`.

Only if you made a genuine architectural choice while implementing
(not a routine implementation detail — a real pick between viable
approaches within the task group's boundaries), also append an entry
to `slipway/memory/<variant>/decisions.md`, same format `/shape-spec`
uses.

### Step 8 — Report, don't auto-chain

Tell the user implementation is done and summarize the report. Let
them decide when to run `/qa`, `/review`, `/manual`, etc. — don't
invoke any of them yourself.

## Rules

- Never modify files outside the task group's declared scope.
- Never weaken, skip, or delete an existing test to make the suite
  pass.
- Never push directly to a default/protected branch — if this project
  uses git branches, work on a feature branch and say so in the
  report.
- Never silently deviate from the approved task group design.
- Never implement a task group against the wrong variant's code path —
  if the target codebase itself branches by variant (e.g. separate
  service directories for a microservices variant vs. a single app for
  a monolith variant), confirm you're editing the right one before
  writing anything.

## Tips

- Be precise and boring in the report. "Changed X to Y because Z"
  beats a narrative of your process — the reviewer wants facts they
  can verify against the diff.
