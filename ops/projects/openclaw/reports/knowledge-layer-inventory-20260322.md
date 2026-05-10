# Knowledge Layer Inventory (2026-03-22)

## Current Classification

| File | Class | Runtime Status | Notes |
| --- | --- | --- | --- |
| `memory/knowledge/README.md` | governance_only | not_runtime | Layer map only. |
| `memory/knowledge/runtime/daily-memory-policy.md` | runtime_relevant | on_demand_only | Needed when daily path behavior is part of the task. |
| `memory/knowledge/runtime/cost-control-rules.md` | runtime_relevant | on_demand_only | Small runtime-facing routing/cost rules. |
| `memory/knowledge/runtime/operator-baseline.md` | runtime_relevant | on_demand_only | Small operator/node baseline for live repair and node self-check tasks. |
| `memory/knowledge/runtime/user-preferences.md` | runtime_relevant | on_demand_only | User-level operating preferences for routing and change style. |
| `memory/routing/models-routing.md` | runtime_support | on_demand_only | Routing support doc. Not part of the normal conversational truth surface. |
| `memory/knowledge/governance/control-plane-local-tools.md` | governance_only | not_runtime | Maintenance/control guidance. |
| `memory/knowledge/governance/deployment-baseline.md` | governance_only | not_runtime | Deployment baseline, not live memory truth. |
| `memory/knowledge/governance/legacy-memory-boundary.md` | governance_only | not_runtime | Cleanup/audit boundary rule. |
| `memory/knowledge/governance/memory-governance.md` | governance_only | not_runtime | Memory policy, audits, source priority. |
| `memory/knowledge/governance/memory-write-path.md` | governance_only | not_runtime | Write-routing policy for maintenance. |
| `memory/knowledge/governance/observer-pipeline.md` | governance_only | not_runtime | Observer/reporting workflow only. |
| `memory/knowledge/archive/current-openclaw-architecture.md` | archive_only | not_runtime | Historical architecture snapshot. |
| `memory/knowledge/archive/legacy-cleanup-minimal-plan.md` | archive_only | not_runtime | Superseded cleanup note retained for traceability. |

## Result

- `memory/knowledge/` is no longer a flat active layer.
- Default runtime should only ever consider `memory/knowledge/runtime/*`, and only on explicit topic match.
- Runtime knowledge live set is intentionally small:
  - `memory/knowledge/runtime/daily-memory-policy.md`
  - `memory/knowledge/runtime/cost-control-rules.md`
  - `memory/knowledge/runtime/operator-baseline.md`
  - `memory/knowledge/runtime/user-preferences.md`
  - `memory/routing/models-routing.md` as routing support, not normal memory truth
- Governance and archive materials stay available for maintenance, audit, and rollback, but are no longer mixed into the live knowledge layer.
