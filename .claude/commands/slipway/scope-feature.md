# Scope Feature

Add one new feature to an already-approved product PRD — for scope
discovered *after* `/plan-product`'s initial pass (a new idea, a
request that came in later), not for standing up a brand-new product
(that's `/plan-product`'s job, and it covers a whole feature breakdown
in one run). Applies the same rigor to this one addition that
`/plan-product` applies per feature.

`$ARGUMENTS` is `[<variant>] "<request>"` — an optional variant slug
(see Step 1 for how it's resolved) followed by the feature request.

## Important guidelines

- Use the AskUserQuestion tool for anything you need clarified — don't
  guess at scope or the target user.
- State explicitly what's **out** of scope, not just what's in — the
  next command should never have to infer a boundary.
- Every acceptance criterion must be independently verifiable. If you
  can't imagine the concrete check that verifies it, rewrite it until
  you can.
- This feature applies to *one* variant's PRD. If the same feature
  genuinely belongs in more than one architecture variant, run this
  command once per variant — don't silently fan it out yourself, since
  the scope boundary or acceptance criteria may need to differ by
  architecture even when the feature title doesn't.

## Process

### Step 1 — Resolve the variant

Read `slipway/product/variants.md`. If it doesn't exist, tell the user
to run `/plan-product` first — this command only adds to an existing
PRD, it doesn't create a product or its first variant.

Parse a leading variant slug from `$ARGUMENTS`:

- Matches an existing row → use it.
- No slug given, and `variants.md` has exactly one row → use that row.
- No slug given, and `variants.md` has more than one row → list the
  variants and ask via AskUserQuestion which one this feature is for.
- Slug given but not found → list the existing variants and stop; this
  command never creates a new variant (that's `/plan-product`'s job).

### Step 2 — Read context

Read `slipway/product/<variant>/prd.md`. If it doesn't exist, tell the
user to run `/plan-product <variant> "..."` first. Read
`slipway/memory/<variant>/decisions.md` if it exists, to check the
request against standing architectural decisions for this variant.

### Step 3 — Find the problem behind the request

The request is shorthand for a problem someone wants solved, not a
finished spec. Before describing a solution, state the underlying user
problem explicitly. If it's ambiguous who this is for or what "solved"
looks like, ask — don't assume.

### Step 4 — Draw the scope boundary

List what this feature covers and what it explicitly excludes,
including things an obvious next step might assume are included. If
narrowing the request to something shippable means dropping part of
what was literally asked for, say so plainly here.

### Step 5 — Write acceptance criteria

Each criterion needs a concrete check behind it — "the export
downloads a CSV with one row per record, including a header row" is a
criterion; "exporting should work well" is not.

### Step 6 — Append to `prd.md`

Number this feature continuing from the highest existing feature
number in `slipway/product/<variant>/prd.md`'s `## Features` section.
Append it in the same shape `/plan-product` uses for every other
feature:

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

### Step 7 — Pause for approval

Summarize the new feature and ask via AskUserQuestion whether to
approve it, revise it, or stop here.

### Step 8 — Record it

Once approved, append one line to `slipway/memory/<variant>/progress.md`
(create with a `# Progress` header if it doesn't exist):
`- <date> — scope-feature — feature <N>: <one-line summary>`. Tell the
user feature `<N>` (variant `<variant>`) is ready to be folded into a
task group by `/shape-spec <variant>` — either a new group, or an
existing one they haven't implemented yet.

## Rules

- Never make a technical implementation choice here — describe the
  problem and the desired outcome, not how to build it. That's
  `/shape-spec`'s job.
- Never fill a gap in the request with a guess about priority, revenue
  impact, or user volume — flag it as an open question instead.
- If the request duplicates or conflicts with an existing feature in
  `prd.md`, surface that explicitly rather than silently picking one.
- Never add a new row to `variants.md` from this command.

## Tips

- Write for a reader deciding whether to spend real engineering time
  on this — concrete problem, concrete criteria, honest about what you
  don't know.
