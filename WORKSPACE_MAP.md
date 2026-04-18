# Workspace Map

This file maps the old workspace root to the new `codex-workspace` layout.

## Legacy Root

- Old root: `/Users/zhangjincheng/Documents/GitHub/-`
- New root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`

## Mapping

- Old `AGENTS.md`
  - New `AGENTS.md`
- Old `README.md`
  - New `README.md`
- Old `docs/reports/*`
  - New `docs/reports/*`
- Old `.codex-remote-openclaw/*`
  - New `ops/projects/openclaw/*`
- Old `projects/openclaw/main/nas-openclaw-v22`
  - New `projects/products/openclaw/nas-openclaw-v22`
- Old `projects/openclaw/migration/openclaw-mac-migration`
  - New `projects/migrations/openclaw-mac-migration`
- Old `projects/openclaw/sidecar-state`
  - New `state/project-data/openclaw`
- Old `projects/platform/nas-platform`
  - New `projects/infrastructure/nas-platform`
- Old `projects/non-openclaw/qigate`
  - New `projects/products/qigate`
- Old `projects/non-openclaw/mathorcup_D`
  - New `projects/research/mathorcup_D`
- Old `scratch/output/qqbot`
  - New `scratch/projects/openclaw/output/qqbot`
- Old `scratch/output/雅七3月国旗班材料`
  - New `scratch/projects/misc/output/雅七3月国旗班材料`
- Old `scratch/tmp/spreadsheets`
  - New `scratch/projects/misc/tmp/spreadsheets`
- Old cleanup archive
  - New `archive/cleanup/2026-04-18`

## Role Guide

- Use this root as the workspace index.
- Use project repositories under `projects/` for actual code changes.
- Use `ops/projects/<project>/` for operator docs and mirrors.
- Use `state/project-data/<project>/` for sidecar or project data that is not project source.
- Treat the legacy root as read-only reference until the new workspace is verified.
