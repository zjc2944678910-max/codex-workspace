# <Project Name> Ops Surface

This directory is the operator-facing surface for `<project-slug>`.

## Routing Evidence

- Project name:
- Aliases:
- Registry routing keywords:
- Main code:
- Ops surface:
- State/data:
- Scratch:
- Reports:
- Runbooks:
- Live host aliases:
- Service names:
- Registry risk profile:

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror the machine-readable fields for this project in
`docs/workspace/project-registry.json`. Keep this README human-facing and keep
the registry entry script-friendly.

## Ops Quality Baseline

- Current status: Registered `<kind>` surface for `<project-slug>`. State only
  confirmed facts here; do not treat this README as proof of current live
  health without fresh evidence.
- Risk gate: Use L0/L1 for local docs/code/research. If the registry risk
  profile is `live_infra` or `live_product`, use L2 read-only first and require
  `进入修复阶段` before any state-changing repair.
- Common commands:
  - `node docs/workspace/find-project.mjs <project-slug>`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks
    once confirmed.
- Next useful work: Keep routing facts synced with the registry; add confirmed
  project commands/runbooks; promote durable facts out of scratch/session notes.
- Model review guidance: Use
  [`model-review-packets.md`](../../docs/workspace/model-review-packets.md) for
  Sub2API or Claude review packets. Never send secrets, private configs,
  cookies, tokens, or unbounded logs.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md`
- `reports/`
- `runbooks/`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are local-only
by default and are not part of the workspace-index repository surface.
