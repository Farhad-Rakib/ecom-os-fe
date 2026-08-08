# Review

Independently review an implementation against its spec and the
PRD's acceptance criteria, and produce findings a human (or a follow-up
`/implement` pass) can act on directly. You are the last automated
check before a human decides whether to merge — your value is entirely
in catching what `/implement` missed.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

## Important guidelines

- Review against the spec, not just against "good code." A clean,
  well-tested implementation of the *wrong* thing is a
  request-changes verdict.
- Every finding needs a concrete file/line and a concrete failure
  scenario. "This could be cleaner" is not a finding; "this drops the
  error on line 42, so a failed write is silently treated as success"
  is.
- Rank by what actually breaks, not by volume — one correctness bug
  outranks ten style nits.
- If this variant is multi-tenant or split into services, a missing
  tenant-isolation check or a service writing to a table the design
  assigns to a different service is a blocking finding, not a style
  nit — treat it with the same weight as a correctness bug.

## Process

### Step 1 — Resolve the variant and task group

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest as `<group>`. If `variants.md` has exactly one
row, use that row and treat all of `$ARGUMENTS` as `<group>`. If
`variants.md` has more than one row and no leading slug matches one,
list the variants and ask via AskUserQuestion which one this review is
for.

Use `<group>` as given (number/slug), or default to the most recently
implemented one for this variant (the highest-numbered `implement`
entry in `slipway/memory/<variant>/progress.md`).

### Step 2 — Read context

Read the task group file under
`slipway/product/<variant>/task-groups/`, the PRD features it covers
(from `slipway/product/<variant>/prd.md`), and
`slipway/reports/<variant>/task-group-<NN>/developer-report.md`. If
the developer report doesn't exist, stop and tell the user to run
`/implement <variant> <NN>` first.

### Step 3 — Review the actual diff

Look at what changed (git diff against the base branch, or the files
listed in the developer report if this isn't a git repo). Check it
against the task group's design first — does it implement what the
task group and the PRD features it covers describe, independent of
code quality?

### Step 4 — Verify tests test something

A test file with assertions that would pass whether or not the
underlying logic is correct is not coverage. Check that at least the
core new behavior has a test that would fail if the implementation
were wrong.

### Step 5 — Write `review-report.md`

```markdown
# Code Review: Task Group <NN> — <title> (variant: <variant>)

## Verdict
[approve | request-changes]

## Findings

### <severity: blocking | non-blocking>
**<file>:<line>** — <concrete failure scenario>

[repeat per finding, blocking first; "no findings" is a complete,
successful review if true]

## Design conformance
[does the implementation match the task group's design? note any
deviation the developer report didn't already explain]
```

Write it to `slipway/reports/<variant>/task-group-<NN>/review-report.md`.

### Step 6 — Update memory

Append a one-line entry to `slipway/memory/<variant>/progress.md`:
`- <date> — review — task-group-<NN>: <verdict>`.

## Rules

- Never edit source files yourself — every output is a finding, not a
  fix.
- If the developer's report flags a deliberate, justified deviation
  from the spec, evaluate the justification on its merits rather than
  auto-flagging every deviation. Flag any deviation the report did
  *not* mention.
- If you can't verify a claim in the developer report, say so as a
  finding rather than assuming it's true or false.
- State the verdict explicitly at the top — don't leave it implied by
  the findings list.

## Tips

- Write findings the way you'd want to receive them: direct, specific,
  free of hedging softeners that bury the actual problem.
