# OpenClaw Ops Surface

This directory is the operator-facing surface for OpenClaw.

## Routing Evidence

- Project name: `OpenClaw`
- Aliases: `open claw`, `oc-nas`, `openclaw-mac-migration`
- Registry routing keywords: `openclaw`, `open claw`, `benben`, `adminai`, `openclaw-mac-migration`
- Main code: `projects/products/openclaw/nas-openclaw-v22`
- Migration reference: `projects/migrations/openclaw-mac-migration`
- State/data: `state/project-data/openclaw`
- Ops surface: `ops/projects/openclaw`
- Reports: `ops/projects/openclaw/reports`
- Runbooks: `ops/projects/openclaw/runbooks`
- Live host aliases: `oc-nas`
- Service names: `openclaw-gateway`, `openclaw-benben`
- Registry risk profile: `live_product`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Stable Docs

- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md`
- `manifests/workspace-acceptance.md`
- `reports/claude-code-assessment-20260401.md`
- `reports/knowledge-layer-inventory-20260322.md`
- `reports/legacy-runtime-inventory-20260322.md`
- `reports/security-best-practices-report-20260314.md`
- `runbooks/sre-troubleshooting-runbook.md`
- `runbooks/upgrade-impact-assessment.md`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of systemd units, tools, and runtime-live artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy operator artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, and `quarantine/` are local-only by default and are not part of the workspace-index repository surface.
