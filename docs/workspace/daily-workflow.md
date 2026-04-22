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

## Keep-First Clean

- When a Codex turn ends inside the workspace root or the OpenClaw mainline repo, the local `turn-ended` hook now runs repo hygiene automatically.
- The hygiene rule is keep-first:
  - preserve real source changes
  - prune only explicit disposable outputs
  - if source changes remain, create a local checkpoint commit so the repo returns to clean
- Root workspace checkpointing is whitelist-gated:
  - only paths allowed by the workspace-index policy are eligible for auto checkpoint
  - if a non-trackable path appears, the repo stays dirty on purpose instead of silently committing it
- If you are intentionally doing a hand-grouped multi-commit sequence, pause auto hygiene first:
  - `~/.codex/tools/codex-repo-hygiene-guard.sh pause --repo <repo> --minutes 30 --reason manual-split-commit`
  - `~/.codex/tools/codex-repo-hygiene-guard.sh resume --repo <repo>`

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
