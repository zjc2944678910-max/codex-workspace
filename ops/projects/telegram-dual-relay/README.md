# Telegram Dual Relay Ops Surface

This directory is the operator-facing surface for Telegram Dual Relay.

## Routing Evidence

- Project name: `Telegram Dual Relay`
- Aliases: `telegram-dual-relay`
- Registry routing keywords: `Telegram Dual Relay`, `telegram-dual-relay`
- Main code: `projects/infrastructure/telegram-dual-relay`
- Ops surface: `ops/projects/telegram-dual-relay`
- State/data: `state/project-data/telegram-dual-relay`
- Reports: `ops/projects/telegram-dual-relay/reports`
- Runbooks: `ops/projects/telegram-dual-relay/runbooks`
- Live host aliases: `oc-nas`
- Service names: `telegram-dual-relay`
- Registry risk profile: `live_infra`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Stable Docs

- `README.md`
- `reports/`
- `runbooks/`

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
