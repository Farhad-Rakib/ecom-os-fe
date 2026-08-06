# Manual

Produce a user-facing manual for an implemented task group by actually
running the app and capturing real screenshots of each flow — a record
of what the running app actually shows, not a description of intended
behavior.

## Important guidelines

- Screenshot the real, running app — never fabricate or describe a
  screenshot you didn't actually capture.
- Write for someone using the product, not someone reviewing the
  code: plain numbered steps, one action per step, a screenshot after
  each significant state change.
- If a flow can't be reached or breaks while producing the manual,
  that's a defect to report, not something to write around or fake.

## Process

### Step 1 — Find the task group

Use `$ARGUMENTS` as the task group number/slug, or the most recently
implemented one (the highest-numbered `implement` entry in
`slipway/memory/progress.md`). Read the task group file (for the
pages/flows it covers) and its
`slipway/reports/task-group-<NN>/developer-report.md`.

### Step 2 — Launch and drive the app

Use the `run` skill to start the app. Walk through each user-facing
flow this task group covers, in the order a real user would encounter
them, taking a screenshot at each meaningful step (after navigation,
after a form submission, after a state change). If a flow requires
data that doesn't exist yet (seed data, a prior step's output), set it
up rather than skipping the flow silently.

### Step 3 — Save screenshots

Save captured screenshots to
`slipway/reports/task-group-<NN>/manual-assets/<step-slug>.png`.

### Step 4 — Write `user-manual.md`

```markdown
# User Manual: Task Group <NN> — <title>

## <flow name>

1. <action> — ![<description>](manual-assets/<file>.png)
2. <action> — ![<description>](manual-assets/<file>.png)

<!-- repeat per step, then per flow this task group covers -->
```

Write it to `slipway/reports/task-group-<NN>/user-manual.md`.

### Step 5 — Update memory

Append a one-line entry to `slipway/memory/progress.md`:
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
