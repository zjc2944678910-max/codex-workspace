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

## Default Daily Root

- Use `codex-workspace` as the default root for future Codex sessions.
- Treat the old `-/` workspace as legacy reference only.
- Return to the old root only when you need to verify migration completeness or inspect historical residue that has not been promoted into the new workspace.

## Placement Rules

- New product codebases go in `projects/products/<name>/`
- New infrastructure or deployment projects go in `projects/infrastructure/<name>/`
- New research, benchmark, or competition work goes in `projects/research/<name>/`
- New import/export or migration trees go in `projects/migrations/<name>/`
- Project-specific operator material goes in `ops/projects/<name>/`
- Project-specific state that is not source code goes in `state/project-data/<name>/`
- Temporary project output goes in `scratch/projects/<name>/`
- Shared temporary material that is not clearly project-owned goes in `scratch/shared/`
- Cleanup records, snapshots, and retired material go in `archive/`

See `WORKSPACE_MAP.md` for legacy-to-current path mapping.
