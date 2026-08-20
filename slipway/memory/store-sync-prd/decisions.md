# Decisions

## 2026-08-19 — shape-spec — task-group-01

Platform selector driven by a `SUPPORTED_PLATFORMS` constant (one
entry, Shopify, each carrying its own credential-field list) rather
than a hardcoded Shopify-only form. Alternatives considered: build the
connect form directly against Shopify's two fields with no abstraction,
since v1 truly only supports one platform. Why not: the backend PRD
itself requires the platform-selection step to "not assume Shopify is
the only option that will ever exist" (product-wide scope note) — the
FE mirrors that same constraint at effectively zero extra cost (one
array with one entry today).

## 2026-08-19 — shape-spec — task-group-02

Split into its own task group rather than folded into task-group-01,
even though it's small. Alternatives considered: one combined group
covering both features. Why not: task-group-02 has a hard build-order
dependency on `order-management-prd` task-group-01 already being
implemented (it edits files that variant creates), which
task-group-01 (Store Connection) does not share at all — keeping them
separate makes that dependency explicit and lets Store Connection ship
independently if `order-management-prd`'s FE work were ever delayed.
