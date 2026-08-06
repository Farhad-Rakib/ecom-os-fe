# QA

Independently verify, through actually running tests rather than
taking `/implement`'s word for it, that a task group's implementation
meets every acceptance criterion for the PRD features it covers, plus
every item on the task group's own QA checklist — and surface what
unit tests alone don't cover.

## Important guidelines

- Run the actual test command and capture its real output. "Tests
  pass" without the command and output behind it is not evidence.
- Walk both the PRD acceptance criteria and the task group's QA
  checklist one item at a time — an item you couldn't verify is a gap
  to report, not a pass by default.
- Make defects reproducible: concrete steps, not a vague symptom.

## Process

### Step 1 — Find the task group

Use `$ARGUMENTS` as the task group number/slug, or the most recently
implemented one (the highest-numbered `implement` entry in
`slipway/memory/progress.md`). Read the task group file (for its QA
checklist and the feature numbers it covers), the corresponding
features in `slipway/product/prd.md` (for their acceptance criteria),
and `slipway/reports/task-group-<NN>/developer-report.md`.

### Step 2 — Run the test suite

Execute the project's actual test command. If you don't know it, check
`slipway/product/tech-stack.md`, then the project's own config
(package.json scripts, a Makefile, etc.) before asking the user.
Capture the real output.

### Step 3 — Verify each acceptance criterion and checklist item

For each acceptance criterion (from the PRD features this group
covers) and each item on the task group's own QA checklist, state how
you checked it and what you observed. Look past what the unit tests
already cover — integration paths, boundary values, error conditions,
and interactions between features within the group are your job
specifically.

### Step 4 — Write `qa-report.md`

```markdown
# QA Report: Task Group <NN> — <title>

## Test suite result

[command run, pass/fail, real output summary]

## Acceptance criteria

| # | Feature | Criterion | Verdict | Evidence |
|---|---|---|---|---|
| 1 | ... | ... | pass/fail | how you checked, what you saw |

## QA checklist

| Item | Verdict | Evidence |
|---|---|---|

## Defects found

[each with concrete reproduction steps — or "none"]
```

Write it to `slipway/reports/task-group-<NN>/qa-report.md`.

### Step 5 — Update memory

Append a one-line entry to `slipway/memory/progress.md`:
`- <date> — qa — task-group-<NN>: <N>/<M> acceptance criteria passed,
<X>/<Y> checklist items verified`.

## Rules

- Never modify source code or tests to make a run pass.
- An acceptance criterion or checklist item with no way to verify it
  is a finding, not a pass by default.
- If a test is flaky, report that explicitly — don't quietly rerun
  until it's green and only report the pass.
- Don't attempt to fix a defect you find — report it precisely and
  stop; that's a `/implement` pass, not this one.

## Tips

- A table of criteria/checklist items and their evidence is a verdict.
  "Looks good" is not.
