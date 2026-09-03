# Workspace Tools

Workspace-level runbooks, long-task CLI, and hygiene tools.
Policy: `AGENTS.md`. Worker contract: `WORKER.md`.

## Quick Links

| Tool | Purpose |
| --- | --- |
| `codex-long-task.mjs` | Unified long-task CLI: init, append, repair, recheck, close |
| `harness-contract.md` | Cross-cutting workspace harness contract for routing, permissions, tasks, verification, memory, and workers |
| `daily-workflow.md` | Entry point for `L0 tiny` fast path, ordinary short-task workflow, capability defaults, and long-task escalation |
| `project-knowledge-map.md` | Searchable map of project docs, route tokens, decisions, runbooks, and model-review playbooks |
| `model-review-packets.md` | Reusable evidence packets for default Opus 5 and exceptional Fable 5 read-only review |
| `codex-register-project.mjs` | Register a durable project surface and regenerate the root `PROJECTS.md` index |
| `find-project.mjs` | Search the project registry by slug, alias, service, host, or route token |
| `token-budget.md` | Profile selection, agent budget, output limits, evidence pointers, decision reuse, and GitNexus-first rules |
| `codex-long-task-runbook.md` | **Canonical** operational long-task workflow for multi-slice work, handoff state, and repair loops |
| `codex-hooks.md` | Repo-local Codex hook guardrails, verification, and rollback |
| `codex-multi-agent-long-task-template.md` | Non-canonical prompt examples and layout reference |
| `repo-hygiene.mjs` | Workspace root hygiene, project route metadata drift checks, and checkpointing |
| `skill-hygiene.mjs` | Active local skill frontmatter, naming, duplicate, and stale-marker checks |
| `gitnexus-refresh.mjs` | Refresh the workspace GitNexus index without regenerating stale agent docs; preserve embeddings and validate metadata against HEAD |
| `workspace-disk-report.mjs` | Classify disk hotspots before cleanup |
| `workspace-health.mjs` | Compact health summary for hygiene, disk hotspots, route drift, and Codex workflow drift checks |
| `workspace-deep-audit.mjs` | Read-only full disk inventory for generated caches, incomplete downloads, source snapshots, and completed runs |
| `codex-run-retention.mjs` | Plan or explicitly apply status-aware rotation for shared or project `codex-runs` |
| `playwright-scratch.sh` | Run Playwright CLI from `scratch/shared/playwright-cli/<label>/` instead of the repo root |
| `project-registry.json` | Machine-readable workspace project registry and hook routing metadata |
| `project-surfaces.md` | Human-readable project surfaces and GitNexus status |
| `workspace-health-acknowledgements.json` | Known nested git dirty reminders that stay visible without forcing attention |
| `scratch-retention.json` | Scratch retention manifest with per-path policy |
| `state-retention.json` | State retention manifest with per-path policy for ignored machine-local state |
| `../reports/workspace-skill-audit-2026-08-20.md` | Active-skill inventory, archive map, and naming/risk policy |
| `../../PROJECTS.md` | Generated short project map for session startup |
| `../../DAILY.md` | Short-lived session/day notes before promotion |
| `../decisions/workspace-decisions.md` | Durable workspace-level decisions |

## Workflow Entry Points

- Start with `daily-workflow.md` for ordinary work. Use its `L0 tiny` fast path
  for simple questions, small docs edits, typos, and lightweight checks.
- Use `../../PROJECTS.md` as the short project map when choosing a route.
- Use `../../DAILY.md` for short-lived notes; promote durable facts into
  project ops READMEs or `../decisions/workspace-decisions.md`.
- Use `harness-contract.md` when introducing a new agent, worker flow, hook, or
  runbook. It explains how the workspace harness layers fit together; keep
  `daily-workflow.md` as the day-to-day entry point.
- Use `token-budget.md` when deciding whether to use `fast`, `standard`, or
  `audit`, or when evidence and command output may bloat the main context.
- Escalate to `codex-long-task-runbook.md` only when work spans multiple slices,
  needs handoff state, or enters repeated repair loops.
- Keep workspace-local active skills narrow and descriptive. Generated
  cluster/timestamp snapshots belong in the local archive, not in active
  discovery; use `node docs/workspace/skill-hygiene.mjs --json` before promoting
  a new one.
- Use `workspace-health.mjs` for policy, hygiene, or cleanup validation. It is
  not a required preflight for `L0 tiny` work.

## Project Registration

Register a new durable project surface:

```bash
node docs/workspace/codex-register-project.mjs --slug <slug> --name "<Name>" --kind product
```

Regenerate the root project index after registry-only edits:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Health Check

```bash
node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12
```

This also checks Codex workflow drift such as notification wrapper wiring,
Bark/Telegram policy, the daily health automation, and the paused mobile bridge
heartbeat. It separately scans nested git repositories under `projects/` so a
clean workspace-index repo cannot hide dirty project worktrees. The current
policy allows the daily workspace health automation to be `ACTIVE` or
intentionally `PAUSED`; missing or unknown automation state remains
attention-worthy. It reports only booleans and status strings, never
notification secrets. Known nested dirty states can be recorded in
`workspace-health-acknowledgements.json`; run with `--strict` to ignore those
acknowledgements. Large scratch paths reported here are candidates for later
review, not automatic deletion targets. Scratch retention decisions come from
`scratch-retention.json`; state retention decisions come from
`state-retention.json`. A healthy report should load both manifests and show
`retention_gaps: 0` plus `state_retention_gaps: 0`, with unacknowledged
`nested_git_dirty: 0`.

The compact report also exposes three low-cost governance fields:
`missing_active_retention_paths`, `long_task_completion_candidates`, and
`project_documentation_mismatches`. Missing active retention paths and
deterministic registry/documentation drift affect overall health. Completion
candidates are advisory only: they identify active runs whose phase or next
action explicitly looks terminal, but never mark the workspace unhealthy by
themselves. Here, a missing active retention path means an entry explicitly
marked `active: true` in a retention manifest whose declared path is absent;
it does not mean every on-disk path needs its own active entry.

For predictable runtime, size inventory excludes known dependency, build, and
cache directories. Obvious-garbage sampling also excludes ignored bulk roots
`archive/`, `scratch/`, and `state/`; the JSON field
`garbage_scan_excluded_roots` makes that boundary explicit.

Run the separate deep audit when a real on-disk inventory is needed:

```bash
node docs/workspace/workspace-deep-audit.mjs --repo "$PWD" --limit 25
node docs/workspace/workspace-deep-audit.mjs --repo "$PWD" --json
```

Unlike the fast health check, this walks generated/build/cache directories and
reports actual allocated and logical usage. It separately classifies stale
`*.incomplete` downloads, generated caches, source snapshots that contain
generated children, and completed long-task artifacts. Its
`estimated_reclaimable_bytes` is a deduplicated review estimate, not permission
to delete anything; rollback and worktree paths are protected from cleanup
candidacy. The command has no mutation flag and is always read-only.

## Codex Run Retention

Retention is dry-run by default. Inspect the shared run plan, or select a
project-scoped/explicit run root:

```bash
node docs/workspace/codex-run-retention.mjs --repo "$PWD"
node docs/workspace/codex-run-retention.mjs --repo "$PWD" --project personal-ai-companion
node docs/workspace/codex-run-retention.mjs --repo "$PWD" --run-root scratch/projects/personal-ai-companion/codex-runs --json
```

Only an explicit `--apply` moves terminal runs into the cleanup archive:

```bash
node docs/workspace/codex-run-retention.mjs --repo "$PWD" --project personal-ai-companion --apply
```

Latest and manifest `keep` entries remain in place. Active, blocked,
awaiting-user, non-terminal, missing-state, and invalid-state runs are protected
regardless of age. `--run-root` and `--project` are mutually exclusive, and the
run root must be a `codex-runs` directory inside this workspace. Apply mode
rechecks the continuation, long-task index, and explicit keep list immediately
before moving anything, recomputes the current `keep_latest` boundary, and
requires every planned item to pass one complete preflight. Duplicate index
records fail closed. Run and archive paths are resolved against symbolic links;
the archive destination must remain under this workspace's `archive/` tree,
and every destination is checked again immediately before its rename.

## Project Search

```bash
node docs/workspace/find-project.mjs 笨笨
node docs/workspace/find-project.mjs codex_antigravity --json
```

Searches the registry by slug, alias, route keyword, service, host, and code or
ops path, then prints risk gate, ops README, code roots, runbooks, and reports.

Explain project route metadata drift:

```bash
node docs/workspace/repo-hygiene.mjs --repo "$PWD" --explain-mismatch
```

Use this drift explainer whenever a project alias, surface, live host, service
name, risk profile, or GitNexus status changes. The registry remains the
machine-readable source, and `ops/projects/<project>/README.md` remains the
human-facing route record.

## Phone Notifications

Codex completion notifications use the global wrapper:

```text
/Users/zhangjincheng/.codex/tools/codex-turn-ended-notify.sh
```

The active notification strategy is wrapper + Bark: `~/.codex/config.toml`
points only at the wrapper, Bark stays enabled for phone push, and Telegram
completion notifications stay disabled by default. Telegram credentials may
stay configured for future mobile-continuation work, but `telegram.enabled`
should remain `false` unless that channel is deliberately reactivated. The
wrapper can include a compact workspace-health warning in the phone notification
when health status becomes `attention`.

## State Retention

Machine-local state lives under ignored `state/` paths. Use
`state-retention.json` to record owner, purpose, activity, retention window, and
disposition for large or operationally important state directories. The health
check flags state paths above the threshold when they have no manifest entry,
and flags manifest entries whose `last_active` exceeds `retention_days`.

## Playwright

When using Playwright CLI from this workspace root, run it through the
scratch wrapper so `.playwright-cli/` state lands under `scratch/shared/`
instead of the repository root:

```bash
docs/workspace/playwright-scratch.sh --label workspace-root -- open https://example.com --headed
docs/workspace/playwright-scratch.sh --label workspace-root -- snapshot
```

## Run Tests

```bash
node --test docs/workspace/*.test.mjs
```
