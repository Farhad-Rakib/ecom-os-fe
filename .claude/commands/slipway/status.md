# Status

Report exactly where this project's pipeline currently stands — per
architecture variant — what's approved, what's implemented, what's
still pending per task group — and recommend the single next command
to run. Read-only: computed fresh from what's actually on disk
(`variants.md`, `<variant>/prd.md`, `<variant>/task-groups/`,
`<variant>/progress.md`) every time, never from a separately-maintained
snapshot that could drift out of sync with reality.

`$ARGUMENTS` is `[<variant>]`, optional — see Step 1.

## Important guidelines

- Never guess at status — if a file or a `progress.md` entry doesn't
  exist, the corresponding stage genuinely hasn't happened, not
  "probably hasn't."
- Report state, don't take action — this command never writes to
  `prd.md`, a task group file, `variants.md`, or triggers any other
  command itself.
- If something looks inconsistent (e.g. a `qa-report.md` exists but no
  `implement` entry in `progress.md`), surface that explicitly rather
  than silently picking one signal over the other.

## Process

### Step 0 — Resolve scope

Check whether `slipway/product/variants.md` exists.

- **No** → report: "No PRD yet. Next: `/plan-product \"<describe your
  product>\"`." Stop here.
- **Yes, and `$ARGUMENTS` names a variant** → run Steps 1–4 for that
  variant only.
- **Yes, and `$ARGUMENTS` is empty, with exactly one row in
  `variants.md`** → run Steps 1–4 for that row (the common
  single-variant case — no need to make the user type a slug that has
  only one possible value).
- **Yes, and `$ARGUMENTS` is empty, with more than one row in
  `variants.md`** → run Steps 1–4 for *every* variant, each as its own
  report section, then a combined "Next" summary at the end (one
  recommended command per variant that has pending work, not just one
  overall).
- **Yes, but `$ARGUMENTS` names a variant not in `variants.md`** →
  list the existing variants and stop.

### Step 1 — Check the PRD

Does `slipway/product/<variant>/prd.md` exist?

- **No** → report: "No PRD yet for `<variant>`. Next: `/plan-product
  <variant> \"<describe your product>\"`." Stop here for this variant.
- **Yes** → check `slipway/memory/<variant>/progress.md` for a
  `plan-product — prd: approved` entry.
  - **Not found** → report: "PRD drafted
    (`slipway/product/<variant>/prd.md`, `<N>` features) but not yet
    approved. Next: review it and approve, revise, or re-run
    `/plan-product <variant>`." Stop here for this variant.
  - **Found** → note the approval date and feature count, continue.

### Step 2 — Check task groups

Does `slipway/product/<variant>/task-groups/` contain any files?

- **No** → report: "PRD approved (`<date>`). No task groups yet. Next:
  `/shape-spec <variant>`." Stop here for this variant.
- **Yes** → check `slipway/memory/<variant>/progress.md` for a
  `shape-spec — task-groups: approved` entry.
  - **Not found** → report: "Task groups drafted (`<list>`) but not yet
    approved. Next: review and approve, revise, or re-run
    `/shape-spec <variant>`." Stop here for this variant.
  - **Found** → note the approval date and group list, continue.

### Step 3 — Determine each task group's stage

For every file under `slipway/product/<variant>/task-groups/`, scan
`slipway/memory/<variant>/progress.md` for entries matching that
group's number (`task-group-<NN>`) and determine which of these have
happened, in this order: `implement`, `review`, `security-review`,
`qa`, `manual`, `document`, `release`. A stage with no matching entry
hasn't happened yet — don't infer partial completion from a later
stage's presence.

### Step 4 — Report (per variant)

```markdown
## Pipeline status — variant: <variant>

PRD: approved <date> (<N> features) — slipway/product/<variant>/prd.md
Task groups: approved <date> (<N> groups)

| Group | Implemented | Review | Security | QA | Manual | Document | Release |
|---|---|---|---|---|---|---|---|
| 01-<slug> | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— |
[one row per task group]

### Next (<variant>)

<the single most useful next command for this variant, based on the
least-progressed group closest to the front — e.g. "Group 02 hasn't
been implemented yet: run `/implement <variant> 02`." or "Group 01 is
implemented but not reviewed: run `/review <variant> 01`.">
```

If every group for a variant is fully released, report that plainly
instead of forcing a "next" recommendation: "All task groups released
for `<variant>`. No pending work — run `/scope-feature <variant>` to
add something new, or `/plan-product <variant>` again if this
variant's direction has genuinely changed."

When reporting more than one variant (Step 0's multi-variant case),
repeat this block per variant, then close with a combined list: one
line per variant naming its single recommended next command, so the
user can see all pending work across variants at a glance without
re-reading each section.

## Rules

- Never write to any project file — this command only reads
  `variants.md`, `<variant>/prd.md`, `<variant>/task-groups/*.md`, and
  `<variant>/progress.md`.
- Never assume a stage happened because a later one did — check each
  independently against `progress.md`.
- If `progress.md` doesn't exist at all yet for a variant, that itself
  is a valid status ("nothing recorded yet") — say so rather than
  erroring.
- Never blend two variants' task-group numbers into one table — even
  if both happen to have a "02", they're unrelated groups and get
  separate sections.

## Tips

- This is the command to run first thing when picking the project back
  up after time away — it tells you exactly what you were about to do
  next, per variant, without you having to remember or re-read every
  file yourself.
