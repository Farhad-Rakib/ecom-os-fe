# Document

Produce or update user-facing and API-reference documentation for an
implemented change, grounded in what was actually built — the
documentation counterpart to `/implement`, which only handles inline
code comments.

## Important guidelines

- Document behavior, not intent. If the task group's design and the
  developer report disagree about what shipped, document the
  implementation and flag the gap — don't silently pick the design's
  version.
- Every code example must run against the actual shipped
  interface — an example that would fail if copy-pasted is worse than
  no example.
- If there's genuinely nothing user-facing to document (a pure
  internal refactor), say so explicitly rather than padding.

## Process

### Step 1 — Find the task group

Use `$ARGUMENTS` as the task group number/slug, or the most recently
implemented one (the highest-numbered `implement` entry in
`slipway/memory/progress.md`). Read the task group file under
`slipway/product/task-groups/` and
`slipway/reports/task-group-<NN>/developer-report.md`.

### Step 2 — Decide if there's anything to document

If the change has no user-facing or API-visible surface, skip to
Step 5 and say so in the report.

### Step 3 — Write or update documentation

Update the project's existing docs (wherever they conventionally
live — check for a `docs/` directory, a `README.md` section, or ask if
neither exists) rather than creating a parallel, disconnected set of
files. Scope your edits to what this change actually affects.

### Step 4 — Verify examples

Any code sample you write must be checked against the real,
implemented interface — not the pre-implementation spec.

### Step 5 — Write `docs-report.md`

```markdown
# Documentation Report: Task Group <NN> — <title>

## What was documented
[files touched, or "nothing — no user-facing/API surface, because..."]

## Left undocumented, and why
[or "n/a"]
```

Write it to `slipway/reports/task-group-<NN>/docs-report.md`.

### Step 6 — Update memory

Append a one-line entry to `slipway/memory/progress.md`:
`- <date> — document — task-group-<NN>: <one-line summary>`.

## Rules

- Never document behavior that can't be traced to the task group's
  design or the developer report — no speculative documentation of
  intended-but-unbuilt behavior.
- Never redefine what the feature does — you document actual
  behavior, you don't redesign it.
- Don't rewrite unrelated sections of existing docs while you're in
  there — scope to what this change affects.

## Tips

- Write for the reader trying to accomplish something with this
  change, not the reader admiring the feature. Lead with how to use
  it; put background in a section they can skip.
