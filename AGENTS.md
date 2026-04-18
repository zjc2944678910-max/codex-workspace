# Codex Workspace Policy

This root is a workspace-index, not a primary product repository.

## Canonical Project Paths

- Current OpenClaw mainline: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/openclaw/main/nas-openclaw-v22`
- OpenClaw migration reference: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/openclaw/migration/openclaw-mac-migration`
- OpenClaw sidecar state: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/openclaw/sidecar-state`
- OpenClaw operator docs and mirrors: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/openclaw`

## Root Responsibilities

The root repository should only track:

- `AGENTS.md`
- `README.md`
- `WORKSPACE_MAP.md`
- `docs/`
- `ops/openclaw/README.md`
- `ops/openclaw/OPENCLAW_DEPLOYMENT_LEDGER.md`
- `ops/openclaw/OPENCLAW_ARCHITECTURE_TODO.md`
- `ops/openclaw/manifests/`

The root repository must not track:

- `projects/`
- `scratch/`
- `archive/`
- `state/`
- `ops/openclaw/mirrors/`
- `ops/openclaw/evidence/`
- `ops/openclaw/logs/`
- `ops/openclaw/quarantine/`

## Placement Rules

- New OpenClaw mainline work goes in `projects/openclaw/main/<name>/`
- OpenClaw migration or import/export work goes in `projects/openclaw/migration/<name>/`
- Platform projects go in `projects/platform/<name>/`
- Non-OpenClaw projects go in `projects/non-openclaw/<name>/`
- OpenClaw temporary outputs go in `scratch/openclaw/`
- Non-OpenClaw temporary outputs go in `scratch/misc/`
- Local machine state, staging residue, and review residue go in `state/`

## Working Rule

When asked to modify OpenClaw code, enter the main project repository directly and work there instead of treating this root as the codebase.
