# MathorCup-D Ops Surface

This directory is the operator-facing surface for MathorCup D题 (fixed-vehicle multi-truck packing).

## Routing Evidence

- Project name: `MathorCup-D`
- Aliases: `mathorcup-d`, `mathorcup_D`, `MathorCup_D_repo`
- Main code: `projects/research/mathorcup_D`
- Additional reference: `projects/products/MathorCup_D_repo`
- Ops surface: `ops/projects/mathorcup-d`
- Scratch staging archive: `archive/cleanup/2026-05-11-scratch-retention/scratch/projects/mathorcup-upload`
- Reports: `ops/projects/mathorcup-d/reports`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

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
