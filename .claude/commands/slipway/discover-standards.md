# Discover Standards

Extract the conventions an existing codebase already follows into
documented standards under `slipway/standards/` — for onboarding a
project that has real history and implicit conventions, not just a
fresh template bootstrap. Useful the first time Slipway is installed
into an existing codebase (`project-install.sh` was run against
something that already had code), where `slipway/standards/` starts
empty or thin.

## Important guidelines

- Extract what the codebase *actually does*, not what a generic best
  practice says it should do. A convention this codebase consistently
  violates is not a standard, whatever a style guide elsewhere says.
- Prefer patterns repeated across multiple files over a one-off. A
  single unusual file is a data point, not a convention.
- Use the AskUserQuestion tool to confirm anything genuinely
  ambiguous (two competing patterns, roughly equally common) rather
  than picking one silently.

## Process

### Step 1 — Survey the codebase

Read a representative sample across the project: naming conventions,
file/module organization, error-handling patterns, testing patterns,
and the actual tech stack in use (read the dependency manifest —
package.json, *.csproj, requirements.txt, go.mod, whatever applies).

### Step 2 — Check what's already documented

Read `slipway/standards/*.md` if any exist. Only propose additions or
corrections — don't regenerate files that already accurately describe
the codebase.

### Step 3 — Draft or update standards files

At minimum, populate or update:
- `tech-stack.md` — what's actually used, not what the framework's
  defaults suggest
- `coding-standards.md` — naming, error handling, testing conventions
  actually followed, with a real example from the codebase for
  anything non-obvious

Add more files if the codebase has conventions that don't fit either
(e.g. an API-design-standards.md for a project with a large public
API surface) — but don't create a file with nothing real to put in it.

### Step 4 — Confirm before overwriting

If a standards file already exists and your findings would
meaningfully change it (not just append), summarize the proposed
change and ask via AskUserQuestion before overwriting.

### Step 5 — Regenerate the index

Run `/index-standards` (or follow its process directly) once files are
written.

## Rules

- Never invent a convention the codebase doesn't actually exhibit,
  even if it's a reasonable one — that's a recommendation for the user
  to decide on, not a discovered standard.
- Cite where a convention comes from (a real file/pattern) when it's
  not obvious, the same way `/shape-spec` cites rationale for
  decisions.

## Tips

- This command is about *description*, not *prescription* — you're
  writing down what the codebase already does so future commands
  match it, not proposing how it should change.
