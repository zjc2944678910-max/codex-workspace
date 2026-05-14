# Workspace Cleanup Manifest - 2026-05-14

Scope: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`

This is a conservative cleanup candidate manifest. It records what can be kept,
deleted, archived, or requires confirmation. It does not authorize deleting
project code, live rollback backups, operator evidence, repo mirrors, or
unconfirmed scratch work.

## Evidence

- `node docs/workspace/workspace-disk-report.mjs`
- `du -sh` on major scratch paths
- `find scratch` for `.DS_Store`, `Thumbs.db`, `*.pyc`, and `__pycache__`
- Workspace policy in `AGENTS.md`
- Scratch retention manifest in `docs/workspace/scratch-retention.json`

## Keep

| Path | Size | Reason |
| --- | ---: | --- |
| `projects/` | 1.1G | Project source or reference trees. |
| `ops/` | 106M | Workspace operator documentation. |
| `ops/projects/openclaw/rollback` | 101M | Live rollback backup; must not be deleted by cleanup. |
| `docs/` | 212K | Workspace source of truth. |
| `.codex/` | 92K | Workspace source of truth. |
| `projects/infrastructure/nas-platform` | 90K | Registered infrastructure project source. |
| `projects/research/cumcm-2026-workbench` | 14M | Registered research project source. |

## Delete

| Candidate | Size | Reason | Action |
| --- | ---: | --- | --- |
| Obvious garbage files | 259K, 31 files | `.DS_Store`, `Thumbs.db`, `__pycache__`, or `.pyc` patterns. | Delete only after explicit cleanup confirmation. |

The focused `find scratch` check did not find obvious garbage under `scratch/`
at the time of this report. The disk report's obvious garbage count may include
ignored generated files elsewhere in the workspace.

## Archive

| Path | Size | Reason | Action |
| --- | ---: | --- | --- |
| `archive/` | 570M | Existing retired material. | Keep as archive, not an active cleanup target. |
| `ops/projects/openclaw/quarantine` | 552K | Operator evidence or quarantine. | Keep archived under ops unless a project-specific review says otherwise. |
| `ops/projects/openclaw/evidence` | 12K | Operator evidence. | Keep archived under ops unless a project-specific review says otherwise. |

## Ask

| Path | Size | Reason | Recommended next action |
| --- | ---: | --- | --- |
| `scratch/projects/openai-responses-starter-sub2api` | 776M by `du`, 675M by disk report | Active scratch prototype. Largest contents are `node_modules` (498M) and `.next` (277M). | Confirm whether this prototype is still active. If inactive, delete generated `node_modules` and `.next` or archive the source-only prototype. |
| `scratch/shared` | 127M | Shared scratch output. | Review before pruning; keep active long-task and reference artifacts. |
| `scratch/shared/codex-runs` | 94M | Long-task run artifacts. Current rotation keeps `20260502-1251-nas-utilization-optimization`. | Use `codex-run-retention.mjs` dry run before any rotation. |
| `scratch/projects/openclaw` | 78M by `du`, 73M by disk report | Active OpenClaw scratch. Largest item is `memory-v4-migration` (58M). | Keep unless the OpenClaw project explicitly closes the migration/evidence window. |
| `scratch/shared/hatch-pet` | 22M | Active evaluation-window scratch. | Keep through current evaluation window; archive if no follow-up. |
| `scratch/projects/codexplusplus` | 17M | Temporary workspace output not currently in retention manifest. | Decide whether to register, archive, or prune after owner review. |
| `state/` | 6.6M | Local machine state. | Keep unless a state-specific review identifies obsolete staging/review data. |

## Recommended Cleanup Order

1. Confirm whether `scratch/projects/openai-responses-starter-sub2api` is still
   active. The safest first reclaim is generated output only:
   `node_modules` and `.next`.
2. Run `codex-run-retention.mjs` in dry-run mode before rotating
   `scratch/shared/codex-runs`.
3. Keep OpenClaw scratch and rollback/evidence paths unless a project-specific
   cleanup explicitly authorizes archive or prune.
4. Delete only obvious garbage after explicit confirmation.

## Safety Notes

- Do not delete `ops/projects/openclaw/rollback`.
- Do not delete source trees under `projects/`.
- Do not delete operator evidence, quarantine, mirrors, or live rollback bundles.
- Do not treat untracked status as proof that a path is safe to remove.
