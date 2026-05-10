# Legacy / Duplicate Inventory (2026-03-22)

## Current Status

| Path | Status | Runtime Role | Notes |
| --- | --- | --- | --- |
| `memory/stable/self/identity.md` | keep_live | default_runtime | Canonical self core. |
| `memory/stable/self/principles.md` | keep_live | default_runtime | Canonical self core. |
| `USER.md` | keep_live | on_demand_reference | Startup/operator entry card. Not default runtime. |
| `memory/stable/people/guoyixuan.md` | keep_live | scoped_runtime | Canonical partner person file. |
| `memory/stable/relationships/guoyixuan.md` | keep_live | scoped_runtime | Canonical partner relationship file. |
| `memory/stable/groups/group-feishu-oc_09fc1db3bc1395f79383cb2d66ad310f.md` | keep_live | scoped_runtime | Canonical couple-group file. |
| `memory/stable/relationship-guoyixuan.md` | fallback_only | fallback_audit_only | Legacy relationship compatibility card. |
| `memory/stable/identity.md` | fallback_only | fallback_audit_only | Legacy self compatibility file. |
| `memory/stable/preferences.md` | archive_only | rollback_audit_only | Legacy self preference snapshot; no longer needed as fallback. |
| `memory/stable/projects.md` | fallback_only | fallback_audit_only | Legacy self compatibility file. |
| `memory/stable/devices.md` | fallback_only | fallback_audit_only | Legacy self compatibility file. |
| `memory/stable/workflow.md` | fallback_only | fallback_audit_only | Legacy workflow card; canonical principles stay in `memory/stable/self/principles.md`, node/operator runbook moved to `memory/knowledge/runtime/operator-baseline.md`. |
| `memory/stable/stable-profile.md` | archive_only | rollback_audit_only | Legacy self summary card; retained only for rollback traceability. |
| `memory/stable/defaults.json` | keep_live | referenced_not_direct_runtime_text | Canonical structured defaults. |
| `memory/stable/people/zhangjincheng.md` | retirement_candidate | not_default_runtime | Duplicates self identity/principles enough to stop default reads; keep until a later retirement pass. |
| `tools/backups/` | archive_only | never_runtime | Rollback material only. |
| `migration-backups/` | archive_only | never_runtime | Migration snapshots only. |

## Runtime Hit Check

- Default runtime should hit only:
  - `MEMORY.md`
  - `memory/stable/self/identity.md`
  - `memory/stable/self/principles.md`
  - scoped `people/*`, `relationships/*`, `groups/*`
  - `memory/YYYY-MM-DD.md` on recent-context match
- `USER.md` is no longer default runtime. It is only fetched on explicit self/defaults/user-positioning queries.
- All legacy self cards and `memory/stable/relationship-guoyixuan.md` are fallback/audit only.

## Relationship Dual-Track Decision

- Live canonical relationship file: `memory/stable/relationships/guoyixuan.md`
- Legacy compatibility file: `memory/stable/relationship-guoyixuan.md`
- 0.7 rule: canonical file stays scoped runtime; legacy file stays fallback/audit only.

## Backup / .bak Check

- No live `*.bak`, `*.bak-*`, or `*.orig` files remain under the current workspace tree.
- Archived rollback residue moved out of the active tree:
  - `tools/runtime-phase1-cutover.mjs.bak.compat-fix.20260322T134241Z`
  - archived at `/root/backups/workspace-residuals-20260322/runtime-phase1-cutover.mjs.bak.compat-fix.20260322T134241Z`
- Historical rollback material exists as directories: `tools/backups/` and `migration-backups/`.

## Fallback 7-Pack Check (2026-03-23)

| Path | Current State | Default Runtime Hit | Archive-Only Ready | Notes |
| --- | --- | --- | --- | --- |
| `memory/stable/identity.md` | fallback_only | no | not_yet | Covered by `memory/stable/self/identity.md`, but keep until fallback log stays quiet for a longer window. |
| `memory/stable/preferences.md` | archive_only | no | ready_now | Canonical preferences/defaults are already covered by self principles and defaults. |
| `memory/stable/projects.md` | fallback_only | no | not_yet | Current work should land in `memory/YYYY-MM-DD.md`; durable direction belongs in self core. |
| `memory/stable/devices.md` | fallback_only | no | not_yet | Device facts can still be needed for audit/fallback until replacements stabilize. |
| `memory/stable/workflow.md` | fallback_only | no | not_yet | Workflow guidance is partly absorbed by `self/principles.md`, but fallback log is not yet cold long enough. |
| `memory/stable/stable-profile.md` | archive_only | no | ready_now | Legacy index card now duplicates canonical self files enough to archive. |
| `memory/stable/relationship-guoyixuan.md` | fallback_only | no | not_yet | Default runtime uses `memory/stable/relationships/guoyixuan.md`; legacy card stays fallback/audit only. |

## Archive Gate For Fallback 7-Pack

Move a fallback file from `fallback_only` to `archive_only` only after all of these stay true over a sustained observation window:

- default runtime `compatibility_hit_rate` remains `0`
- `memory-admin/logs/memory-compatibility-fallback.jsonl` has no new hits
- canonical replacements in self/person/relationship/group files keep answering the same scoped needs
- event / promotion / draft pipeline continues writing normally without needing the legacy file for recovery
