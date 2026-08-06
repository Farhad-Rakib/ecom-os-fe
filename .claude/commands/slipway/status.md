# Status

Report exactly where this project's pipeline currently stands — what's
approved, what's implemented, what's still pending per task group —
and recommend the single next command to run. Read-only: computed
fresh from what's actually on disk (`prd.md`, `task-groups/`,
`progress.md`) every time, never from a separately-maintained snapshot
that could drift out of sync with reality.

## Important guidelines

- Never guess at status — if a file or a `progress.md` entry doesn't
  exist, the corresponding stage genuinely hasn't happened, not
  "probably hasn't."
- Report state, don't take action — this command never writes to
  `prd.md`, a task group file, or triggers any other command itself.
- If something looks inconsistent (e.g. a `qa-report.md` exists but no
  `implement` entry in `progress.md`), surface that explicitly rather
  than silently picking one signal over the other.

## Process

### Step 1 — Check the PRD

Does `slipway/product/prd.md` exist?

- **No** → report: "No PRD yet. Next: `/plan-product \"<describe your
  product>\"`." Stop here.
- **Yes** → check `slipway/memory/progress.md` for a
  `plan-product — prd: approved` entry.
  - **Not found** → report: "PRD drafted (`slipway/product/prd.md`,
    `<N>` features) but not yet approved. Next: review it and approve,
    revise, or re-run `/plan-product`." Stop here.
  - **Found** → note the approval date and feature count, continue.

### Step 2 — Check task groups

Does `slipway/product/task-groups/` contain any files?

- **No** → report: "PRD approved (`<date>`). No task groups yet. Next:
  `/shape-spec`." Stop here.
- **Yes** → check `slipway/memory/progress.md` for a
  `shape-spec — task-groups: approved` entry.
  - **Not found** → report: "Task groups drafted (`<list>`) but not yet
    approved. Next: review and approve, revise, or re-run
    `/shape-spec`." Stop here.
  - **Found** → note the approval date and group list, continue.

### Step 3 — Determine each task group's stage

For every file under `slipway/product/task-groups/`, scan
`slipway/memory/progress.md` for entries matching that group's number
(`task-group-<NN>`) and determine which of these have happened, in
this order: `implement`, `review`, `security-review`, `qa`, `manual`,
`document`, `release`. A stage with no matching entry hasn't happened
yet — don't infer partial completion from a later stage's presence.

### Step 4 — Report

```markdown
## Pipeline status

PRD: approved <date> (<N> features) — slipway/product/prd.md
Task groups: approved <date> (<N> groups)

| Group | Implemented | Review | Security | QA | Manual | Document | Release |
|---|---|---|---|---|---|---|---|
| 01-<slug> | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— | <date>/— |
[one row per task group]

## Next

<the single most useful next command, based on the least-progressed
group closest to the front — e.g. "Group 02 hasn't been implemented
yet: run `/implement 02`." or "Group 01 is implemented but not
reviewed: run `/review 01`.">
```

If every group is fully released, report that plainly instead of
forcing a "next" recommendation: "All task groups released. No
pending work — run `/scope-feature` to add something new, or
`/plan-product` again if the product's direction has genuinely
changed."

## Rules

- Never write to any project file — this command only reads
  `prd.md`, `task-groups/*.md`, and `progress.md`.
- Never assume a stage happened because a later one did — check each
  independently against `progress.md`.
- If `progress.md` doesn't exist at all yet, that itself is a valid
  status ("nothing recorded yet") — say so rather than erroring.

## Tips

- This is the command to run first thing when picking the project back
  up after time away — it tells you exactly what you were about to do
  next, without you having to remember or re-read every file yourself.
