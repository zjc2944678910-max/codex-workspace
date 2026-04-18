# Codex Workspace Policy

This root is a workspace-index, not a primary product repository.

## Canonical Project Paths

- Current OpenClaw mainline: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- OpenClaw migration reference: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/migrations/openclaw-mac-migration`
- OpenClaw sidecar state: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/openclaw`
- OpenClaw operator docs and mirrors: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/openclaw`

## Root Responsibilities

The root repository should only track:

- `AGENTS.md`
- `README.md`
- `WORKSPACE_MAP.md`
- `docs/`
- `ops/README.md`
- `ops/projects/README.md`
- `ops/projects/openclaw/README.md`
- `ops/projects/openclaw/DEPLOYMENT_LEDGER.md`
- `ops/projects/openclaw/ARCHITECTURE_TODO.md`
- `ops/projects/openclaw/manifests/`

The root repository must not track:

- `projects/`
- `scratch/`
- `archive/`
- `state/`
- `ops/projects/openclaw/mirrors/`
- `ops/projects/openclaw/evidence/`
- `ops/projects/openclaw/logs/`
- `ops/projects/openclaw/quarantine/`
- `ops/projects/openclaw/rollback/`

## Placement Rules

- Product projects go in `projects/products/<name>/`
- Infrastructure projects go in `projects/infrastructure/<name>/`
- Research work goes in `projects/research/<name>/`
- Migration or import/export work goes in `projects/migrations/<name>/`
- Project operator materials go in `ops/projects/<name>/`
- Project-specific state goes in `state/project-data/<name>/`
- Project temporary outputs go in `scratch/projects/<name>/`
- Shared temporary outputs go in `scratch/shared/`
- Local machine state, staging residue, and review residue go in `state/`

## Working Rule

When asked to modify project code, enter the relevant project repository directly and work there instead of treating this root as the codebase.
