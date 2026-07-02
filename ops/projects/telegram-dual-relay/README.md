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

## Ops Quality Baseline

- Current status: Registered live infrastructure surface for `telegram-dual-relay`. Treat this README as routing and durable context, not proof of current live health; collect fresh L2 evidence before judging runtime state.
- Risk gate: L2 read-only for live status, logs, SSH evidence, config inspection, and root-cause analysis. L3 state-changing repair requires the explicit phrase `进入修复阶段`.
- Common commands:
  - `node docs/workspace/find-project.mjs telegram-dual-relay`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; promote durable findings into this README, runbooks, reports, or ledgers after read-only audits; write an explicit L3 plan only after the repair gate opens.
- Model review guidance: Use Claude review or Sub2API only with bounded, redacted, read-only evidence. Do not send credentials, private configs, cookies, tokens, or unbounded logs. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

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
