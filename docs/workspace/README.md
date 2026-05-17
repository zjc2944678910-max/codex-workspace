# Workspace Tools

Workspace-level runbooks, long-task CLI, and hygiene tools.
Policy: `AGENTS.md`. Worker contract: `WORKER.md`.

## Quick Links

| Tool | Purpose |
| --- | --- |
| `codex-long-task.mjs` | Unified long-task CLI: init, append, repair, recheck, close |
| `harness-contract.md` | Cross-cutting workspace harness contract for routing, permissions, tasks, verification, memory, and workers |
| `daily-workflow.md` | Entry point for `L0 tiny` fast path, ordinary short-task workflow, capability defaults, and long-task escalation |
| `token-budget.md` | Profile selection, agent budget, output limits, evidence pointers, decision reuse, and GitNexus-first rules |
| `codex-long-task-runbook.md` | **Canonical** operational long-task workflow for multi-slice work, handoff state, and repair loops |
| `codex-hooks.md` | Repo-local Codex hook guardrails, verification, and rollback |
| `codex-multi-agent-long-task-template.md` | Non-canonical prompt examples and layout reference |
| `repo-hygiene.mjs` | Workspace root hygiene, project route metadata drift checks, and checkpointing |
| `workspace-disk-report.mjs` | Classify disk hotspots before cleanup |
| `workspace-health.mjs` | Compact health summary for hygiene, disk hotspots, route drift, and Codex workflow drift checks |
| `codex-run-retention.mjs` | Rotate `scratch/shared/codex-runs` into cleanup archive |
| `playwright-scratch.sh` | Run Playwright CLI from `scratch/shared/playwright-cli/<label>/` instead of the repo root |
| `project-registry.json` | Machine-readable workspace project registry and hook routing metadata |
| `project-surfaces.md` | Human-readable project surfaces and GitNexus status |
| `scratch-retention.json` | Scratch retention manifest with per-path policy |

## Workflow Entry Points

- Start with `daily-workflow.md` for ordinary work. Use its `L0 tiny` fast path
  for simple questions, small docs edits, typos, and lightweight checks.
- Use `harness-contract.md` when introducing a new agent, worker flow, hook, or
  runbook. It explains how the workspace harness layers fit together; keep
  `daily-workflow.md` as the day-to-day entry point.
- Use `token-budget.md` when deciding whether to use `fast`, `standard`, or
  `audit`, or when evidence and command output may bloat the main context.
- Escalate to `codex-long-task-runbook.md` only when work spans multiple slices,
  needs handoff state, or enters repeated repair loops.
- Use `workspace-health.mjs` for policy, hygiene, or cleanup validation. It is
  not a required preflight for `L0 tiny` work.

## Health Check

```bash
node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12
```

This also checks Codex workflow drift such as notification wrapper wiring,
Bark/Telegram policy, the daily health automation, and the paused mobile bridge
heartbeat. The current policy allows the daily workspace health automation to be
`ACTIVE` or intentionally `PAUSED`; missing or unknown automation state remains
attention-worthy. It reports only booleans and status strings, never
notification secrets. Large scratch paths reported here are candidates for later
review, not automatic deletion targets. Scratch retention decisions come from
`scratch-retention.json`; a healthy report should load that manifest and show
`retention_gaps: 0`.

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
