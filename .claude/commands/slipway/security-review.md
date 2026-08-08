# Security Review

Review an implementation for security vulnerabilities and unsafe
patterns before it's eligible for release — a distinct pass from
`/review`, focused entirely on what an attacker could do with this
change, not on correctness or design.

`$ARGUMENTS` is `[<variant>] [<group>]` — both optional; see Step 1.

## Important guidelines

- Think in trust boundaries: every place external input enters the
  system (a request body, a query param, a file upload, a queue
  message) is where you look hardest.
- Any hardcoded credential in the diff is an automatic blocking
  finding, regardless of anything else in the change.
- Never downgrade a finding's severity because a fix would be
  expensive or delay release — severity reflects exploitability and
  impact, not convenience.
- For a multi-tenant variant, cross-tenant data exposure (any path
  where tenant A's request can read or write tenant B's data) is
  always a blocking finding. For a microservices variant, an
  unauthenticated or unauthorized service-to-service call is a
  trust-boundary crossing just like an external request — review it
  with the same rigor.

## Process

### Step 1 — Resolve the variant and task group

Read `slipway/product/variants.md`. If it doesn't exist, stop and tell
the user to run `/plan-product` first.

If `$ARGUMENTS` starts with a slug matching a row in `variants.md`, use
it and treat the rest as `<group>`. If `variants.md` has exactly one
row, use that row and treat all of `$ARGUMENTS` as `<group>`. If
`variants.md` has more than one row and no leading slug matches one,
list the variants and ask via AskUserQuestion which one this review is
for.

Use `<group>` as given (number/slug), or default to the most recently
implemented one for this variant (the highest-numbered `implement`
entry in `slipway/memory/<variant>/progress.md`).

### Step 2 — Read context

Read the task group file under
`slipway/product/<variant>/task-groups/` and the diff (same as
`/review`'s Step 3).

### Step 3 — Look for common vulnerability classes

Injection, broken auth/authz, unsafe deserialization, SSRF, path
traversal, and anything else that fits how this specific change moves
data across a trust boundary.

### Step 4 — Scan for secrets

Any API key, password, or token literal anywhere in the diff — source
or config — is a blocking finding, full stop.

### Step 5 — Write `security-review-report.md`

```markdown
# Security Review: Task Group <NN> — <title> (variant: <variant>)

## Verdict
[go | no-go]

## Findings

### <severity: blocking | non-blocking>
**<file>:<line>** — <concrete exploit or exposure scenario: what an
attacker with no special access could actually do>

[repeat; "no findings" with an explicit "go" is a complete review]
```

Write it to
`slipway/reports/<variant>/task-group-<NN>/security-review-report.md`.

### Step 6 — Update memory

If any finding is real (not a false positive you ruled out), append
an entry to `slipway/memory/<variant>/risks.md` (create with a
`# Risks` header if needed): `- <date> — task-group-<NN>: <risk>,
mitigation: <status>`.

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
