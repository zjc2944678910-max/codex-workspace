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
- `ops/`: operator-facing durable docs, manifests, reports, and runbooks
- `projects/`: actual project trees grouped by role
- `scratch/`: temporary outputs and disposable working material
- `inbox/`: unprocessed local imports, ignored by git
- `handoffs/`: cross-tool or cross-session summaries, ignored by git
- `archive/`: retired documents, cleanup records, and snapshots
- `state/`: local machine state and review/staging residue

## Daily Entry Points

- `PROJECTS.md`: generated short project index for routing at session start
- `DAILY.md`: short-lived day/session notes before promotion into durable docs
- `docs/decisions/workspace-decisions.md`: durable workspace-level decisions

## Workspace Tools

- Long-task CLI:
  - `node docs/workspace/codex-long-task.mjs --help`
- Project registration:
  - `node docs/workspace/codex-register-project.mjs --help`
  - `node docs/workspace/codex-register-project.mjs --regen`
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

Registered project records live in:

- `ops/projects/<project>/README.md`
- `PROJECTS.md` as the generated short human project index

Prefer the registration helper for new durable project surfaces:

```bash
node docs/workspace/codex-register-project.mjs --slug <slug> --name "<Name>" --kind product
```

Use `ops/projects/PROJECT_TEMPLATE.md` only when the helper is unavailable or a
project needs unusual hand-authored structure. Registered projects are
discovered from `ops/projects/*/README.md`; none is the workspace default.

## Default Daily Root

- Use `codex-workspace` as the default root for future Codex sessions.
- Do not rename this root to `codex-workplace`; that spelling is non-canonical.
- Treat the old `-/` workspace as legacy reference only.
- Return to the old root only when you need to verify migration completeness or inspect historical residue that has not been promoted into the new workspace.

## Placement Rules

> Since 2026-06-22, codex-workspace is the single physical home for ALL project
> code (each project = its own git repo + GitHub remote = backup).
> claude-workspace reaches it via local git-ignored symlinks. The register tool
> auto-creates the claude symlink (`docs/workspace/symlink-projects-to-claude.sh`,
> idempotent + dangling-link repair). See `docs/decisions/workspace-decisions.md`.

- New product codebases go in `projects/products/<name>/`
- New infrastructure or deployment projects go in `projects/infrastructure/<name>/`
- New research, benchmark, or competition work goes in `projects/research/<name>/`
- New import/export or migration trees go in `projects/migrations/<name>/`
- Project-specific operator material goes in `ops/projects/<name>/`
- Project-specific state that is not source code goes in `state/project-data/<name>/`
- Temporary project output goes in `scratch/projects/<name>/`
- Shared temporary material that is not clearly project-owned goes in `scratch/shared/`
- Imported raw material that has not been processed goes in `inbox/`
- Cross-tool or cross-session handoff summaries go in `handoffs/`
- Cleanup records, snapshots, and retired material go in `archive/`
- Local mirrors, evidence, logs, quarantine, and rollback bundles stay under
  ignored `ops/projects/<name>/...` subdirectories unless a runbook explicitly
  promotes a durable summary.

## Registration Rule

Long-lived project surfaces under `projects/*/*` must be registered via
`ops/projects/<project>/README.md`.  See
`docs/workspace/project-registry.json` for the machine-readable registry and
`docs/workspace/project-surfaces.md` for the human-readable summary.

## Scratch-First Rule

Tests, scaffolds, and one-off experiments must start in
`scratch/projects/<name>/` until they are promoted to `projects/` with a
corresponding `ops/projects/<name>/README.md`.

See `WORKSPACE_MAP.md` for legacy-to-current path mapping.
