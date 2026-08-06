# Coding Standards (default)

Read by `/implement` and `/review` before they touch code. Override
this file (or add project-specific rules to it after install) rather
than expecting an agent to infer your conventions from the existing
code alone — inference is a fallback, not the primary source.

## General

- Match the existing style of the file you're editing over any
  abstract preference stated here — consistency within a file beats
  a "more correct" style that fragments the codebase.
- Prefer the smallest diff that correctly implements the change. Don't
  reformat, refactor, or "clean up" code outside the declared scope of
  the current spec/ticket.
- Every new or changed behavior needs a test that would fail without
  the change. A test that would pass either way isn't coverage.
- No commented-out code, no debug prints left behind, no TODOs without
  an owner and a reason they're deferred rather than done now.

## Naming

- Names describe what something is or does, not how it was
  implemented or when it was added ("temp", "new", "v2" are not names).

## Errors

- Never swallow an error silently. If a failure genuinely can't be
  handled at this layer, propagate it — don't catch-and-log-and-continue
  as if it succeeded.

## Comments

- Default to no comments. Add one only when it explains a non-obvious
  *why* (a constraint, a workaround, a subtle invariant) — never to
  restate what well-named code already says.
