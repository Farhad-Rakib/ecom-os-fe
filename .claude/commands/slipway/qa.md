# QA

Independently verify, through actually running tests rather than
taking `/implement`'s word for it, that a task group's implementation
meets every acceptance criterion for the PRD features it covers, plus
every item on the task group's own QA checklist — and surface what
unit tests alone don't cover.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

## Important guidelines

- Run the actual test command and capture its real output. "Tests
  pass" without the command and output behind it is not evidence.
- Walk both the PRD acceptance criteria and the task group's QA
  checklist one item at a time — an item you couldn't verify is a gap
  to report, not a pass by default.
- Make defects reproducible: concrete steps, not a vague symptom.

## Process

### Step 1 — Resolve the variant and task group

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest as `<group>`. If `variants.md` has exactly one
row, use that row and treat all of `$ARGUMENTS` as `<group>`. If
`variants.md` has more than one row and no leading slug matches one,
list the variants and ask via AskUserQuestion which one to QA.

Use `<group>` as given (number/slug), or default to the most recently
implemented one for this variant (the highest-numbered `implement`
entry in `slipway/memory/<variant>/progress.md`).

### Step 2 — Read context

Read the task group file (for its QA checklist and the feature numbers
it covers), the corresponding features in
`slipway/product/<variant>/prd.md` (for their acceptance criteria),
and `slipway/reports/<variant>/task-group-<NN>/developer-report.md`.

### Step 3 — Run the test suite

Execute the project's actual test command. If you don't know it, check
`slipway/product/<variant>/tech-stack.md`, then the project's own
config (package.json scripts, a Makefile, etc.) before asking the
user. Capture the real output.

### Step 4 — Verify each acceptance criterion and checklist item

For each acceptance criterion (from the PRD features this group
covers) and each item on the task group's own QA checklist, state how
you checked it and what you observed. Look past what the unit tests
already cover — integration paths, boundary values, error conditions,
and interactions between features within the group are your job
specifically. If the task group's QA checklist includes a
tenant-isolation check, verify it by actually attempting the
cross-tenant access, not by inspecting the code and assuming it holds.

### Step 5 — Write `qa-report.md`

```markdown
# QA Report: Task Group <NN> — <title> (variant: <variant>)

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

Write it to `slipway/reports/<variant>/task-group-<NN>/qa-report.md`.

### Step 6 — Update memory

Append a one-line entry to `slipway/memory/<variant>/progress.md`:
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
