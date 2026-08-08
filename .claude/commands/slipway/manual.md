# Manual

Produce a user-facing manual for an implemented task group by actually
running the app and capturing real screenshots of each flow — a record
of what the running app actually shows, not a description of intended
behavior.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

## Important guidelines

- Screenshot the real, running app — never fabricate or describe a
  screenshot you didn't actually capture.
- Write for someone using the product, not someone reviewing the
  code: plain numbered steps, one action per step, a screenshot after
  each significant state change.
- If a flow can't be reached or breaks while producing the manual,
  that's a defect to report, not something to write around or fake.
- If this variant is multi-tenant, run flows as a specific tenant and
  say which one in the manual — screenshots implicitly showing one
  tenant's data shouldn't be presented as tenant-agnostic.

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

Read the task group file (for the pages/flows it covers) and its
`slipway/reports/<variant>/task-group-<NN>/developer-report.md`.

### Step 3 — Launch and drive the app

Use the `run` skill to start the app — for a variant whose target
codebase branches by architecture (e.g. separate service directories
for a microservices variant), make sure you launch the right one.
Walk through each user-facing flow this task group covers, in the
order a real user would encounter them, taking a screenshot at each
meaningful step (after navigation, after a form submission, after a
state change). If a flow requires data that doesn't exist yet (seed
data, a prior step's output), set it up rather than skipping the flow
silently.

### Step 4 — Save screenshots

Save captured screenshots to
`slipway/reports/<variant>/task-group-<NN>/manual-assets/<step-slug>.png`.

### Step 5 — Write `user-manual.md`

```markdown
# User Manual: Task Group <NN> — <title> (variant: <variant>)

## <flow name>

1. <action> — ![<description>](manual-assets/<file>.png)
2. <action> — ![<description>](manual-assets/<file>.png)

<!-- repeat per step, then per flow this task group covers -->
```

Write it to `slipway/reports/<variant>/task-group-<NN>/user-manual.md`.

### Step 6 — Update memory

Append a one-line entry to `slipway/memory/<variant>/progress.md`:
`- <date> — manual — task-group-<NN>: <N> flow(s) documented`.

## Rules

- Never skip a flow the task group covers without saying so explicitly
  in the manual (e.g. "requires seed data not available in this
  environment — see Blockers").
- Never screenshot a broken/error state and present it as the correct
  result — report it as a defect for that flow and stop documenting
  that flow specifically.
- Don't touch source code — this is documentation only.

## Tips

- A screenshot with no caption explaining what changed is not useful —
  pair every image with the one-line action that produced it.
- If the app needs auth to reach a flow, note what account/role you
  used so the manual's steps are reproducible by someone else.
