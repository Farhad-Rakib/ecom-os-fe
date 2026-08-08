# Release

Execute the actual release of a reviewed, security-checked,
QA-verified change through this project's own documented release
process. This is the one command in the pipeline with real,
hard-to-reverse, external side effects — it never takes an action on
an assumption it didn't verify first, and it never proceeds on
anything less than every precondition actually being met.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

## Important guidelines

- Check every precondition before taking a single external action.
  Not "probably fine" — an explicit pass/approve/go in each report.
- Always confirm with the user via AskUserQuestion immediately before
  the actual release action (tagging, deploying) — this is the one
  approval pause in the pipeline that must never be skipped, even if
  everything upstream looks clean.
- Never invent a release mechanism the project doesn't already
  document. If you can't find one, stop and ask rather than guessing
  at a deploy command.
- If this product has more than one architecture variant, each variant
  typically deploys to its own target (a different service, a
  different environment) — confirm you're releasing to the target that
  actually corresponds to `<variant>` before executing anything.

## Process

### Step 1 — Resolve the variant and task group

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest as `<group>`. If `variants.md` has exactly one
row, use that row and treat all of `$ARGUMENTS` as `<group>`. If
`variants.md` has more than one row and no leading slug matches one,
list the variants and ask via AskUserQuestion which one to release.

Use `<group>` as given (number/slug), or default to the most recently
implemented one for this variant (the highest-numbered `implement`
entry in `slipway/memory/<variant>/progress.md`).

### Step 2 — Verify preconditions

Read `slipway/reports/<variant>/task-group-<NN>/review-report.md`,
`security-review-report.md`, and `qa-report.md`. Confirm each verdict
is explicitly positive:

- review-report.md: `approve`
- security-review-report.md: `go`
- qa-report.md: all acceptance criteria `pass`

**If any is missing or not explicitly positive**, stop here. Report
exactly which precondition blocked the release and tell the user which
command to (re-)run. Do not proceed, do not ask for an override.

### Step 3 — Find the release process

Look for the project's own documented release process (a
`RELEASING.md`, a `CONTRIBUTING.md` section, CI/CD config, or ask the
user directly if none exists). If the project documents a separate
release process per variant (e.g. a different deploy target or
pipeline per service), use the one for `<variant>` specifically. Use
it exactly — this is not the place to improve on the process or invent
a step it doesn't call for.

### Step 4 — Confirm with the user

Summarize what's about to happen (variant, version/tag, deploy target)
and ask via AskUserQuestion for explicit go-ahead before taking any
external action.

### Step 5 — Execute

Follow the project's release process: changelog entry, version tag,
deploy. Narrate each action as you take it, in a form that supports
rollback — what it was, what it replaced, and the exact command or
process to undo it.

### Step 6 — Write `release-report.md`

```markdown
# Release Report: Task Group <NN> — <title> (variant: <variant>)

## Preconditions verified
[review: approve, security: go, qa: N/M pass — link/reference each report]

## What was released
[version/tag, deploy target]

## Rollback
[exact command or process to reverse this release]
```

Write it to `slipway/reports/<variant>/task-group-<NN>/release-report.md`.

### Step 7 — Update memory

Append to `slipway/memory/<variant>/progress.md`:
`- <date> — release — task-group-<NN>: released <version>`.
Update `slipway/memory/<variant>/state.md` (create/replace, it's a
snapshot, not a log) with the current release version and date.

## Rules

- Never proceed if any precondition report's verdict isn't explicitly
  positive — halt and report which one blocked it, never override or
  reinterpret a red verdict.
- Never retry a failed deploy automatically. A deploy failure needs a
  human to look at why before anything is attempted again.
- If an action partially completes before a later step fails, report
  exactly what state that leaves the system in — never leave that
  ambiguous for whoever responds next.
- If a precondition report exists but reviewed a different commit than
  what's currently about to be released, treat that as a failed
  precondition, not a pass.
- Never release one variant's task group against another variant's
  deploy target.

## Tips

- Write the report for the person who has to react to a problem with
  this release, not for a changelog audience. Precision about what
  happened and how to undo it matters more than a summary of why the
  change was good.
