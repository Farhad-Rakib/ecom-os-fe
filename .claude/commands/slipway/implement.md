# Implement

Take one approved task group (`$ARGUMENTS` = its number or slug, e.g.
`2` or `02-transactions`) and produce working, tested code, scoped
strictly to it. Execution, not judgment about what should be built —
if the task group's design doesn't answer a question you need
answered to proceed correctly, that's a stop-and-report situation, not
a "use your best judgment" one.

## Important guidelines

- Read the task group and the PRD features it covers together — the
  task group gives the shape of the change (API/FE/DB), the PRD's
  acceptance criteria for those features tell you what "done" means.
- Implement only what this task group covers, even if you can see a
  bigger improvement nearby — note it in the report as a future idea,
  don't fold it in.
- Every new or changed behavior needs a test that would fail without
  the change.

## Process

### Step 1 — Find the task group

Resolve `$ARGUMENTS` to a file under `slipway/product/task-groups/` by
number or slug (e.g. `2` or `02` both match
`02-transactions.md`). If `slipway/product/task-groups/` doesn't exist
at all, stop and tell the user to run `/shape-spec` first. If the
number/slug given doesn't match any file, list the available task
groups and stop. Check `slipway/memory/progress.md` for a
`shape-spec — task-groups: approved` entry — if it's missing, tell the
user the task groups haven't been approved yet and stop (run
`/status` if they want the full picture first).

### Step 2 — Read context

Read the task group file, the specific PRD features it lists (from
`slipway/product/prd.md`'s `## Features` section — not the whole PRD
blindly), and `slipway/standards/coding-standards.md`/`tech-stack.md`
if present.

### Step 3 — Implement

Follow the task group's design and sequencing: DB changes first if it
notes a migration-order dependency on another group, then API
endpoints, then FE pages/components. For each acceptance criterion in
the features this group covers, write the test that would fail
without the change.

### Step 4 — Handle design gaps honestly

- If the task group is ambiguous about *how* to implement a specific
  piece, and a narrow, reasonable interpretation exists that doesn't
  foreclose other groups — take it, and note the interpretation in
  your report.
- If implementation reveals the design is actually *wrong* (not just
  underspecified — assumes something that doesn't exist, contradicts
  itself, conflicts with a group already built), stop and report the
  discrepancy. Do not patch around it with your own improvised
  mini-design.

### Step 5 — Write `developer-report.md`

```markdown
# Implementation Report: Task Group <NN> — <title>

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
`slipway/reports/task-group-<NN>/developer-report.md`.

### Step 6 — Update memory

Append a one-line entry to `slipway/memory/progress.md` (create with a
`# Progress` header if needed):
`- <date> — implement — task-group-<NN>: <one-line summary>`.

Only if you made a genuine architectural choice while implementing
(not a routine implementation detail — a real pick between viable
approaches within the task group's boundaries), also append an entry
to `slipway/memory/decisions.md`, same format `/shape-spec` uses.

### Step 7 — Report, don't auto-chain

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

## Tips

- Be precise and boring in the report. "Changed X to Y because Z"
  beats a narrative of your process — the reviewer wants facts they
  can verify against the diff.
