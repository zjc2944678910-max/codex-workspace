# OpenClaw Manifests

This directory holds durable OpenClaw operator manifests. Keep the top level for
stable inventory, design, safety, and acceptance documents. Date-stamped
execution, candidate, preflight, and repair manifests should live under
`archive/<period-or-batch>/` once the batch is no longer the active working set.

## Top-Level Anchors

- `old-benben-feature-inventory.md`
- `old-benben-secret-inventory.redacted.json`
- `old-benben-service-inventory.json`
- `openclaw-benben-implementation-plan.md`
- `openclaw-benben-vnext-design.md`
- `runtime-patch-inventory.md`
- `workspace-acceptance.md`
- `write-safety-notes.md`

## Archived Batches

- `archive/2026-04-benben-shadow-vnext/`: historical Benben shadow/vNext
  candidate, execution, preflight, repair, benchmark, and handoff manifests
  from April 2026.

Some archived JSON files preserve absolute paths from the original run evidence.
Those paths are historical facts and should not be rewritten during archival
moves.

## Policy

- Do not delete live repair evidence or rollback references from this tree.
- Prefer adding a short top-level anchor or roll-up before adding another large
  batch of date-stamped manifests.
- Move completed historical batches into `archive/` with `git mv` so links can
  be reviewed in the same change.
