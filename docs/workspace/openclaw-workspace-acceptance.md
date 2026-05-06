# OpenClaw Workspace Acceptance

Updated: 2026-04-18

This checklist records what has already been migrated into `codex-workspace`,
what remains intentionally legacy-only, and which paths should be used when a
task explicitly targets OpenClaw. It is an OpenClaw-specific reference, not a
workspace-wide default routing rule.

## Accepted In New Workspace

These surfaces are present and should be treated as the new canonical layout:

- Workspace index root:
  - `AGENTS.md`
  - `README.md`
  - `WORKSPACE_MAP.md`
- OpenClaw product project:
  - `projects/products/openclaw/nas-openclaw-v22/`
- OpenClaw migration reference:
  - `projects/migrations/openclaw-mac-migration/`
- OpenClaw project data / state:
  - `state/project-data/openclaw/`
- OpenClaw operator truth and local mirrors:
  - `ops/projects/openclaw/`
- OpenClaw scratch output:
  - `scratch/projects/openclaw/`
- Other project trees:
  - `projects/products/qigate/`
  - `projects/infrastructure/nas-platform/`
  - `projects/research/mathorcup_D/`

## Imported Durable Docs

The following long-lived documents from the old workspace have been imported and should now be read from the new workspace:

- `docs/reports/openclaw_claude_code_assessment_20260401.md`
- `docs/reports/security_best_practices_report.md`
- `docs/reports/knowledge-layer-inventory-20260322.md`
- `docs/reports/legacy-runtime-inventory-20260322.md`
- `docs/runbooks/openclaw-sre-troubleshooting-runbook.md`
- `docs/runbooks/openclaw-upgrade-impact-assessment.md`
- `ops/projects/openclaw/manifests/runtime-patch-inventory.md`
- `ops/projects/openclaw/manifests/write-safety-notes.md`

## Intentionally Left Legacy-Only

These areas still exist only in the old workspace root and remain reference-only for now:

- Old root repository history and dirty worktree state
- Historical cleanup residue not reclassified into the new structure
- Old root `.codex-remote-openclaw/docs/` historical copies already archived during cleanup
- Any remaining old absolute-path references embedded inside historical reports, eval outputs, or generated JSON snapshots

These are not considered migration failures unless they contain unique canonical information missing from the new workspace.

## OpenClaw Working Defaults

If the task explicitly targets OpenClaw, use these paths:

- For OpenClaw mainline code changes:
  - `projects/products/openclaw/nas-openclaw-v22/`
- For OpenClaw operator docs, mirrors, evidence, rollback:
  - `ops/projects/openclaw/`
- For OpenClaw sidecar/state data:
  - `state/project-data/openclaw/`
- For OpenClaw temporary outputs:
  - `scratch/projects/openclaw/`
- For migration/import-export reference work:
  - `projects/migrations/openclaw-mac-migration/`

## Remaining Follow-Up

- Keep the legacy root `-/` as read-only reference until the new workspace has been used successfully for a sustained period.
- If a later audit finds a missing canonical document in the old workspace, import it into:
  - `docs/reports/`
  - `docs/runbooks/`
  - or `ops/projects/openclaw/manifests/`
  depending on its role.
- Do not reintroduce old absolute paths into new entrypoint docs.
