# Document

Produce or update user-facing and API-reference documentation for an
implemented change, grounded in what was actually built — the
documentation counterpart to `/implement`, which only handles inline
code comments.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

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
- If this product has more than one architecture variant, say which
  variant the documentation describes wherever the behavior differs by
  variant (e.g. a deploy/setup section, an API base path) — don't
  write it as if only one variant exists.

## Process

### Step 1 — Resolve the variant and task group

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest as `<group>`. If `variants.md` has exactly one
row, use that row and treat all of `$ARGUMENTS` as `<group>`. If
`variants.md` has more than one row and no leading slug matches one,
list the variants and ask via AskUserQuestion which one to document.

Use `<group>` as given (number/slug), or default to the most recently
implemented one for this variant (the highest-numbered `implement`
entry in `slipway/memory/<variant>/progress.md`).

### Step 2 — Read context

Read the task group file under
`slipway/product/<variant>/task-groups/` and
`slipway/reports/<variant>/task-group-<NN>/developer-report.md`.

### Step 3 — Decide if there's anything to document

If the change has no user-facing or API-visible surface, skip to
Step 6 and say so in the report.

### Step 4 — Write or update documentation

Update the project's existing docs (wherever they conventionally
live — check for a `docs/` directory, a `README.md` section, or ask if
neither exists) rather than creating a parallel, disconnected set of
files. Scope your edits to what this change actually affects. If the
project documents multiple variants side by side, follow its existing
convention for that rather than inventing a new one.

### Step 5 — Verify examples

Any code sample you write must be checked against the real,
implemented interface — not the pre-implementation spec.

### Step 6 — Write `docs-report.md`

```markdown
# Documentation Report: Task Group <NN> — <title> (variant: <variant>)

## What was documented
[files touched, or "nothing — no user-facing/API surface, because..."]

## Left undocumented, and why
[or "n/a"]
```

Write it to `slipway/reports/<variant>/task-group-<NN>/docs-report.md`.

### Step 7 — Update memory

Append a one-line entry to `slipway/memory/<variant>/progress.md`:
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
