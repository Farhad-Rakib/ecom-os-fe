# Scope Feature

Add one new feature (`$ARGUMENTS`) to an already-approved product PRD
— for scope discovered *after* `/plan-product`'s initial pass (a new
idea, a request that came in later), not for standing up a brand-new
product (that's `/plan-product`'s job, and it covers a whole feature
breakdown in one run). Applies the same rigor to this one addition
that `/plan-product` applies per feature.

## Important guidelines

- Use the AskUserQuestion tool for anything you need clarified — don't
  guess at scope or the target user.
- State explicitly what's **out** of scope, not just what's in — the
  next command should never have to infer a boundary.
- Every acceptance criterion must be independently verifiable. If you
  can't imagine the concrete check that verifies it, rewrite it until
  you can.

## Process

### Step 1 — Read context

Read `slipway/product/prd.md`. If it doesn't exist, tell the user to
run `/plan-product` first — this command only adds to an existing PRD,
it doesn't create one. Read `slipway/memory/decisions.md` if it
exists, to check the request against standing architectural decisions.

### Step 2 — Find the problem behind the request

`$ARGUMENTS` is shorthand for a problem someone wants solved, not a
finished spec. Before describing a solution, state the underlying user
problem explicitly. If it's ambiguous who this is for or what "solved"
looks like, ask — don't assume.

### Step 3 — Draw the scope boundary

List what this feature covers and what it explicitly excludes,
including things an obvious next step might assume are included. If
narrowing the request to something shippable means dropping part of
what was literally asked for, say so plainly here.

### Step 4 — Write acceptance criteria

Each criterion needs a concrete check behind it — "the export
downloads a CSV with one row per record, including a header row" is a
criterion; "exporting should work well" is not.

### Step 5 — Append to `prd.md`

Number this feature continuing from the highest existing feature
number in `prd.md`'s `## Features` section. Append it in the same
shape `/plan-product` uses for every other feature:

```markdown
### <N>. <feature title>

**Problem:** [...]

**In scope:**
- [bullets]

**Out of scope:**
- [bullets — be explicit, not just silent]

**Acceptance criteria:**
1. [...]
```

### Step 6 — Pause for approval

Summarize the new feature and ask via AskUserQuestion whether to
approve it, revise it, or stop here.

### Step 7 — Record it

Once approved, append one line to `slipway/memory/progress.md`
(create with a `# Progress` header if it doesn't exist):
`- <date> — scope-feature — feature <N>: <one-line summary>`. Tell the
user feature `<N>` is ready to be folded into a task group by
`/shape-spec` — either a new group, or an existing one they haven't
implemented yet.

## Rules

- Never make a technical implementation choice here — describe the
  problem and the desired outcome, not how to build it. That's
  `/shape-spec`'s job.
- Never fill a gap in the request with a guess about priority, revenue
  impact, or user volume — flag it as an open question instead.
- If the request duplicates or conflicts with an existing feature in
  `prd.md`, surface that explicitly rather than silently picking one.

## Tips

- Write for a reader deciding whether to spend real engineering time
  on this — concrete problem, concrete criteria, honest about what you
  don't know.
