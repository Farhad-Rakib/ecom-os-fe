# Security Review

Review an implementation for security vulnerabilities and unsafe
patterns before it's eligible for release — a distinct pass from
`/review`, focused entirely on what an attacker could do with this
change, not on correctness or design.

## Important guidelines

- Think in trust boundaries: every place external input enters the
  system (a request body, a query param, a file upload, a queue
  message) is where you look hardest.
- Any hardcoded credential in the diff is an automatic blocking
  finding, regardless of anything else in the change.
- Never downgrade a finding's severity because a fix would be
  expensive or delay release — severity reflects exploitability and
  impact, not convenience.

## Process

### Step 1 — Find the task group

Use `$ARGUMENTS` as the task group number/slug, or the most recently
implemented one (the highest-numbered `implement` entry in
`slipway/memory/progress.md`). Read the task group file under
`slipway/product/task-groups/` and the diff (same as `/review`'s
Step 2).

### Step 2 — Look for common vulnerability classes

Injection, broken auth/authz, unsafe deserialization, SSRF, path
traversal, and anything else that fits how this specific change moves
data across a trust boundary.

### Step 3 — Scan for secrets

Any API key, password, or token literal anywhere in the diff — source
or config — is a blocking finding, full stop.

### Step 4 — Write `security-review-report.md`

```markdown
# Security Review: Task Group <NN> — <title>

## Verdict
[go | no-go]

## Findings

### <severity: blocking | non-blocking>
**<file>:<line>** — <concrete exploit or exposure scenario: what an
attacker with no special access could actually do>

[repeat; "no findings" with an explicit "go" is a complete review]
```

Write it to `slipway/reports/task-group-<NN>/security-review-report.md`.

### Step 5 — Update memory

If any finding is real (not a false positive you ruled out), append
an entry to `slipway/memory/risks.md` (create with a `# Risks` header
if needed): `- <date> — task-group-<NN>: <risk>, mitigation: <status>`.

## Rules

- Never edit source files — every output is a finding.
- Never wave off a finding because it's inconvenient to fix before
  release — report it at its real severity and let a human decide to
  accept the risk explicitly, on the record.
- If a finding depends on infrastructure you can't observe (e.g. "is
  this actually behind the auth gateway in production?"), say what you
  can't verify explicitly rather than assuming either answer.
- State an explicit go/no-go verdict — don't leave release-readiness
  for a human to infer from the findings list.

## Tips

- Write like the report will be read by someone deciding whether to
  ship today. Lead with anything release-blocking.
