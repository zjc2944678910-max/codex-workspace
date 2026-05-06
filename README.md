# codex-workspace

This directory is a long-lived Codex workspace root.

It is designed to keep project code, operator evidence, temporary outputs, and machine-local state separated so future Codex sessions can locate the right surface quickly.

## Canonical Identity

- Local root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- GitHub repo: `zjc2944678910-max/codex-workspace`
- Canonical name: `codex-workspace`
- Non-canonical names: `codex-workplace`, `-/`

Use this repository as the default Codex workspace index. The legacy local `-/` directory is retained only as a historical reference and migration fallback surface.

## Main Areas

- `docs/`: long-lived workspace-level documentation
- `ops/`: operator-facing mirrors, evidence, logs, rollback bundles
- `projects/`: actual project trees grouped by role
- `scratch/`: temporary outputs and disposable working material
- `archive/`: retired documents, cleanup records, and snapshots
- `state/`: local machine state and review/staging residue

## Workspace Tools

- Long-task CLI:
  - `node docs/workspace/codex-long-task.mjs --help`
- Tool index:
  - `docs/workspace/README.md`
- Long-task runbook:
  - `docs/workspace/codex-long-task-runbook.md`

## Project Types

- Product project: `projects/products/<name>/`
- Infrastructure project: `projects/infrastructure/<name>/`
- Research project: `projects/research/<name>/`
- Migration reference: `projects/migrations/<name>/`

## Explicit Project Routing

Do not assume any single project by default from this workspace root.

Use named project surfaces only when the task explicitly targets them.
For long tasks, record the chosen project and surface in the run directory's
Route Lock before delegating to child agents.

OpenClaw surfaces:

- Mainline code: `projects/products/openclaw/nas-openclaw-v22`
- Migration reference: `projects/migrations/openclaw-mac-migration`
- Project data/state: `state/project-data/openclaw`
- Operator truth and mirrors: `ops/projects/openclaw`

## Default Daily Root

- Use `codex-workspace` as the default root for future Codex sessions.
- Do not rename this root to `codex-workplace`; that spelling is non-canonical.
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
