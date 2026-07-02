# MathorCup-D Ops Surface

This directory is the operator-facing surface for MathorCup D题 (fixed-vehicle multi-truck packing).

## Routing Evidence

- Project name: `MathorCup-D`
- Aliases: `mathorcup-d`, `mathorcup_D`, `MathorCup_D_repo`
- Registry routing keywords: `mathorcup-d`, `mathorcup_d`, `mathorcup`, `mathorcup_d_repo`
- Main code: `projects/research/mathorcup_D`
- Additional reference: `projects/products/MathorCup_D_repo`
- Ops surface: `ops/projects/mathorcup-d`
- Scratch staging archive: `archive/cleanup/2026-05-11-scratch-retention/scratch/projects/mathorcup-upload`
- Reports: `ops/projects/mathorcup-d/reports`
- Registry risk profile: `research_local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Ops Quality Baseline

- Current status: Registered research surface for `mathorcup-d`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs mathorcup-d`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; add project-specific commands or runbooks when they become confirmed; promote durable conclusions out of scratch/session notes.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Stable Docs

- `README.md`
- `reports/`

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
