# Plan Product

Analyze a natural-language product request (`$ARGUMENTS`, e.g. "build
a personal finance management system") and produce one comprehensive
PRD covering the *whole* product — problem, target users, and a full,
numbered feature breakdown with a scope boundary and acceptance
criteria per feature — precise enough for `/shape-spec` to design
from. Run this once per product. Re-run it only if the product's
actual direction changes; to add a single feature later without
redoing the whole thing, use `/scope-feature` instead.

## Important guidelines

- Analyze `$ARGUMENTS` first. Only use AskUserQuestion, one question at
  a time, for what's genuinely ambiguous or missing after that
  analysis — don't run a fixed interview script regardless of what the
  request already answered.
- Producing many features in one pass is not an excuse to make any of
  them vaguer than a single `/scope-feature` run would: each still
  needs an explicit in/out-of-scope boundary and acceptance criteria a
  human could verify independently.
- This command does not design *how* anything is built — no DB schema,
  no API shapes, no file/module names, no task grouping. That's
  `/shape-spec`'s job, one level down.

## Process

### Step 1 — Check for an existing PRD

Check whether `slipway/product/prd.md` already exists.

**If it exists**, ask via AskUserQuestion: replace it entirely, or
cancel (to add a single feature to an existing PRD, stop here and
point the user at `/scope-feature` instead — that's its job, not
this one's).

**If it doesn't exist**, proceed to Step 2.

### Step 2 — Understand the product

From `$ARGUMENTS`, identify: the core problem, who it's for, and what
makes this worth building over the obvious alternative. Ask via
AskUserQuestion, one at a time, only for what's genuinely unclear —
don't ask something the request already answered.

### Step 3 — Break it into features

Decompose the product into a numbered list of features that together
deliver a usable first version, plus what's explicitly deferred or not
planned at all. For each in-scope feature, work out:

- A one-line title
- The user-facing problem it solves
- In-scope / out-of-scope boundary — including anything an obvious
  next step might assume is included, but isn't
- Acceptance criteria — numbered, each independently verifiable

If a feature is too big to design as one unit later (spans multiple
unrelated data models or user flows), split it into separate numbered
features now rather than leaving one sprawling entry — `/shape-spec`
groups these features into task groups next, and a well-split feature
list is what makes that grouping meaningful instead of arbitrary.

### Step 4 — Tech stack

Check whether `slipway/standards/tech-stack.md` exists (installed from
a profile). If it exists, summarize it and ask whether this product
uses the same stack or differs. If it doesn't exist, ask them to
describe frontend, backend, database, and anything else load-bearing —
"N/A" is a fine answer for any of these.

### Step 5 — Write `prd.md`

```markdown
# <product name>: Product Requirements

## Problem

[core problem, from Step 2]

## Target users

[from Step 2]

## Why this approach

[differentiator, from Step 2]

## Out of scope (product-wide)

[deferred entirely, or explicitly not planned — from Step 3]

## Features

### 1. <feature title>

**Problem:** [the user-facing problem this specific feature solves]

**In scope:**
- [bullets]

**Out of scope:**
- [bullets]

**Acceptance criteria:**
1. [...]
2. [...]

### 2. <feature title>

[same shape]

<!-- one numbered entry per feature, in build order (dependencies first) -->
```

Write it to `slipway/product/prd.md`.

### Step 6 — Write `tech-stack.md`

Frontend / Backend / Database / Other, each "N/A" if not applicable,
from Step 4's answers. Write to `slipway/product/tech-stack.md`.

### Step 7 — Pause for approval

Do not proceed to `/shape-spec` automatically. Summarize the feature
list (numbers and titles only) and ask via AskUserQuestion whether to
approve the whole PRD, revise a specific feature, or stop.

### Step 8 — Record approval

**Only if approved**, append one line to `slipway/memory/progress.md`
(create with a `# Progress` header if it doesn't exist):
`- <date> — plan-product — prd: approved (<N> features)`. This is the
only record that the PRD was actually approved, not just written —
`/status` and `/shape-spec` both rely on it being there. If the user
instead chose to revise or stop, don't log anything.

## Rules

- Never invent a feature the request didn't ask for and didn't imply —
  note it instead as a suggestion, separate from the PRD itself.
- Never make a technical implementation choice here.
- If the request is contradictory, or a feature's scope genuinely
  can't be determined without more information, ask — don't guess and
  write the guess into the PRD as settled fact.

## Tips

- Number features in the order they'd actually need to be built
  (dependencies first) — `/shape-spec` uses this order as a default
  grouping signal.
- "To be defined" beats a confident-sounding invention for anything
  genuinely unknown.
- Brief per-feature entries are fine — this file can be revised later
  via `/scope-feature` (to add one feature) without re-running this
  whole command.
