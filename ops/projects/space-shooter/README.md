# Cosmic Guardian Ops Surface

This directory is the operator-facing surface for `space-shooter`.

## Routing Evidence

- Project name: `Cosmic Guardian`
- Aliases: `cosmic-guardian`, `太空射击`
- Registry routing keywords: `space-shooter`, `Cosmic Guardian`, `cosmic-guardian`, `太空射击`
- Main code: `projects/products/space-shooter`
- Ops surface: `ops/projects/space-shooter`
- State/data: `state/project-data/space-shooter`
- Scratch: `scratch/projects/space-shooter`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered product surface for `space-shooter`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs space-shooter`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - From the product root: `node server.mjs` if the local server is used

- Next useful work: Keep routing facts synced with the registry; add a short local runbook if the game server port becomes a confirmed contract.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
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

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are
local-only by default and are not part of the workspace-index repository
surface.
