# Plan Product

Analyze a natural-language product request and produce one
comprehensive PRD covering the *whole* product — problem, target
users, and a full, numbered feature breakdown with a scope boundary
and acceptance criteria per feature — precise enough for `/shape-spec`
to design from.

`$ARGUMENTS` is `[<variant>] "<request>"` — an optional architecture
**variant** slug (e.g. `modular-monolith-mt`), followed by the
natural-language request. Most products only ever need one variant and
never have to think about this; see Step 1. Run this once per variant.
Re-run it on an existing variant only if that variant's direction
genuinely changes; to add a single feature later without redoing the
whole thing, use `/scope-feature` instead; to add a *new* architecture
variant of an already-planned product, run this command again with a
new variant slug.

## Important guidelines

- Analyze the request first. Only use AskUserQuestion, one question at
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

## What a "variant" is

A variant is one architecture flavor of the *same product* — e.g. a
product shipped as a single-tenant modular monolith, a multi-tenant
modular monolith, and a multi-tenant microservices system. Variants
usually share most of their feature set but always get their own PRD,
tech stack, and (later) task groups, because `/shape-spec`'s technical
design genuinely differs by architecture even when the feature list
doesn't. `slipway/product/variants.md` is the registry of variants
that exist for this product; every other command resolves a `<variant>`
argument against it.

## Process

### Step 1 — Resolve the variant

Check whether `slipway/product/variants.md` exists.

**If it doesn't exist** — this is the first PRD for this product.
Don't ask a variant question up front; most products only need one.
Proceed as a normal single-variant product using the slug `default`,
and create `slipway/product/variants.md`:

```markdown
# Architecture Variants

| Slug | Label | Notes |
|---|---|---|
| default | <product name> | single architecture — see slipway/product/default/tech-stack.md |
```

Only skip the `default` slug and ask up front if the request *itself*
already states multiple architecture flavors are needed (e.g. "we need
this as both a single-tenant on-prem product and a multi-tenant SaaS
product") — in that case, ask via AskUserQuestion for this first
variant's slug (short, kebab-case, e.g. `single-tenant-mm`) and a
one-line label, and note in your response that more variants can be
added later by re-running `/plan-product <new-slug> "..."`.

**If it exists**, parse a leading variant slug from `$ARGUMENTS`:

- Matches an existing row → operate on that variant for the rest of
  this process.
- No slug given, and `variants.md` has exactly one row → use that row
  (the common case: zero extra friction for single-variant products).
- No slug given, and `variants.md` has more than one row → list the
  existing variants and ask via AskUserQuestion which one this request
  is for, or whether it's a new variant.
- Slug given but not found → ask via AskUserQuestion: add it as a new
  architecture variant (get a one-line label), or did they mean an
  existing one (typo)? If adding, append a row to `variants.md`.

From here, `<variant>` is resolved for every path in this process:
`slipway/product/<variant>/prd.md`,
`slipway/product/<variant>/tech-stack.md`,
`slipway/memory/<variant>/progress.md`.

### Step 2 — Check for an existing PRD on this variant

Check whether `slipway/product/<variant>/prd.md` already exists.

**If it exists**, ask via AskUserQuestion: replace it entirely, or
cancel (to add a single feature to an existing PRD, stop here and
point the user at `/scope-feature` instead — that's its job, not
this one's).

**If it doesn't exist**, and at least one *other* variant already has
an approved PRD, offer (AskUserQuestion) to start this variant's PRD
as a copy of that other variant's `prd.md` and `tech-stack.md` rather
than from a blank page — most architecture flavors of the same product
share the bulk of their feature set, and copying avoids re-specifying
what didn't change. If accepted, copy both files, then treat the rest
of this process as *revising* that copy: confirm with the user what's
added, removed, or changed for this variant specifically (e.g. a
single-tenant variant might drop a "tenant switcher" feature a
multi-tenant one needs), rather than re-deriving everything from
scratch. If declined, or no other variant exists yet, proceed to
Step 3 from a blank page.

### Step 3 — Understand the product

From the request, identify: the core problem, who it's for, and what
makes this worth building over the obvious alternative. Ask via
AskUserQuestion, one at a time, only for what's genuinely unclear —
don't ask something the request already answered. Skip what a copied
PRD (Step 2) already answers unchanged.

### Step 4 — Break it into features

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

### Step 5 — Tech stack

Check whether `slipway/standards/tech-stack.md` exists (installed from
a profile — shared across all variants as a baseline). If it exists,
summarize it and ask whether this variant uses the same stack or
differs (a microservices variant, for instance, often adds messaging
infrastructure a monolith variant doesn't need). If it doesn't exist,
ask them to describe frontend, backend, database, and anything else
load-bearing — "N/A" is a fine answer for any of these.

### Step 6 — Write `prd.md`

```markdown
# <product name> (<variant label>): Product Requirements

## Problem

[core problem, from Step 3]

## Target users

[from Step 3]

## Why this approach

[differentiator, from Step 3]

## Out of scope (product-wide)

[deferred entirely, or explicitly not planned — from Step 4]

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

Write it to `slipway/product/<variant>/prd.md`.

### Step 7 — Write `tech-stack.md`

Frontend / Backend / Database / Other, each "N/A" if not applicable,
from Step 5's answers. Write to `slipway/product/<variant>/tech-stack.md`.

### Step 8 — Pause for approval

Do not proceed to `/shape-spec` automatically. Summarize the feature
list (numbers and titles only) and ask via AskUserQuestion whether to
approve the whole PRD, revise a specific feature, or stop.

### Step 9 — Record approval

**Only if approved**, append one line to
`slipway/memory/<variant>/progress.md` (create with a `# Progress`
header if it doesn't exist):
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
- Never silently create a second variant. A `<variant>` slug that
  doesn't match `variants.md` always gets confirmed via AskUserQuestion
  before anything is written.

## Tips

- Number features in the order they'd actually need to be built
  (dependencies first) — `/shape-spec` uses this order as a default
  grouping signal.
- "To be defined" beats a confident-sounding invention for anything
  genuinely unknown.
- Brief per-feature entries are fine — this file can be revised later
  via `/scope-feature` (to add one feature) without re-running this
  whole command.
- Don't reach for a second variant speculatively. Add one only when a
  real architecture fork is needed — most products stay on `default`
  forever, and that's the expected, frictionless case.
