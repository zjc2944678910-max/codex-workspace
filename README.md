# codex-workspace

This directory is a long-lived Codex workspace root.

It is designed to keep project code, operator evidence, temporary outputs, and machine-local state separated so future Codex sessions can locate the right surface quickly.

## Main Areas

- `docs/`: long-lived workspace-level documentation
- `ops/`: operator-facing mirrors, evidence, logs, rollback bundles
- `projects/`: actual project trees grouped by role
- `scratch/`: temporary outputs and disposable working material
- `archive/`: retired documents, cleanup records, and snapshots
- `state/`: local machine state and review/staging residue

## Project Defaults

- Product project: `projects/products/<name>/`
- Infrastructure project: `projects/infrastructure/<name>/`
- Research project: `projects/research/<name>/`
- Migration reference: `projects/migrations/<name>/`

## OpenClaw Defaults

- Mainline code: `projects/products/openclaw/nas-openclaw-v22`
- Migration reference: `projects/migrations/openclaw-mac-migration`
- Project data/state: `state/project-data/openclaw`
- Operator truth and mirrors: `ops/projects/openclaw`

See `WORKSPACE_MAP.md` for legacy-to-current path mapping.
