# OpenClaw Ops Surface

This directory is the operator-facing surface for OpenClaw.

## Stable Docs

- `OPENCLAW_DEPLOYMENT_LEDGER.md`
- `OPENCLAW_ARCHITECTURE_TODO.md`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `mirrors/`: local mirrors of systemd units, tools, and runtime-live artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy operator artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, and `quarantine/` are local-only by default and are not part of the workspace-index repository surface.
