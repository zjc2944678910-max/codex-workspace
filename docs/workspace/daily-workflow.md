# Daily Workflow

## Default Entry

Start future work in:

- `/Users/zhangjincheng/Documents/GitHub/codex-workspace`

Treat this as the normal Codex root.

## Where To Work

- OpenClaw mainline code:
  - `projects/products/openclaw/nas-openclaw-v22/`
- OpenClaw operator docs, mirrors, evidence, rollback:
  - `ops/projects/openclaw/`
- OpenClaw sidecar or project state:
  - `state/project-data/openclaw/`
- Migration/reference work:
  - `projects/migrations/openclaw-mac-migration/`
- Temporary project output:
  - `scratch/projects/<project>/`

## When To Open The Legacy Root

Only return to:

- `/Users/zhangjincheng/Documents/GitHub/-/`

when you need to:

- compare a path that was not yet migrated
- verify historical residue or reports
- recover a missed document into the new workspace

Do not use the legacy root for new daily development by default.

## New Project Placement

- New product project:
  - `projects/products/<name>/`
- New infrastructure project:
  - `projects/infrastructure/<name>/`
- New research or competition project:
  - `projects/research/<name>/`
- New migration/import/export tree:
  - `projects/migrations/<name>/`
- New project ops material:
  - `ops/projects/<name>/`
- New project state data:
  - `state/project-data/<name>/`
