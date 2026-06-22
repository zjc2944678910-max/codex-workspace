# NAS Platform Ops Surface

This directory is the operator-facing surface for NAS Platform.

## Routing Evidence

- Project name: `NAS Platform`
- Aliases: `nas-platform`, `oc-nas`
- Registry routing keywords: `NAS Platform`, `nas-platform`, `oc-nas`
- Main code: `projects/infrastructure/nas-platform`
- Ops surface: `ops/projects/nas-platform`
- Reports: `ops/projects/nas-platform/reports`
- Runbooks: `ops/projects/nas-platform/runbooks`
- Live host aliases: `oc-nas`
- Service names: `nas-platform`
- Registry risk profile: `live_infra`
- GitNexus status: unknown; local code root is not a standalone git repository

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Stable Docs

- `README.md`
- `reports/`
- `runbooks/`
- `runbooks/nas-wg-ssh-access.md`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are local-only
by default and are not part of the workspace-index repository surface.
