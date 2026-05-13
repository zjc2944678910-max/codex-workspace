# Workspace Tools

Workspace-level runbooks, long-task CLI, and hygiene tools.
Policy: `AGENTS.md`. Worker contract: `WORKER.md`.

## Quick Links

| Tool | Purpose |
| --- | --- |
| `codex-long-task.mjs` | Unified long-task CLI: init, append, repair, recheck, close |
| `daily-workflow.md` | Default short-task workflow plus capability defaults for GitNexus, skills, inline review comments, and long-task escalation |
| `codex-long-task-runbook.md` | **Canonical** operational long-task workflow |
| `codex-hooks.md` | Repo-local Codex hook guardrails, verification, and rollback |
| `codex-multi-agent-long-task-template.md` | Non-canonical prompt examples and layout reference |
| `repo-hygiene.mjs` | Workspace root hygiene, project route metadata drift checks, and checkpointing |
| `workspace-disk-report.mjs` | Classify disk hotspots before cleanup |
| `workspace-health.mjs` | Compact health summary combining hygiene, disk, and Codex workflow drift checks |
| `codex-run-retention.mjs` | Rotate `scratch/shared/codex-runs` into cleanup archive |
| `project-registry.json` | Machine-readable workspace project registry and hook routing metadata |
| `project-surfaces.md` | Human-readable project surfaces and GitNexus status |
| `scratch-retention.json` | Scratch retention manifest with per-path policy |

## Health Check

```bash
node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12
```

This also checks Codex workflow drift such as notification wrapper wiring,
Bark/Telegram policy, the daily health automation, and the paused mobile bridge
heartbeat. It reports only booleans and status strings, never notification
secrets.

Explain project route metadata drift:

```bash
node docs/workspace/repo-hygiene.mjs --repo "$PWD" --explain-mismatch
```

## Phone Notifications

Codex completion notifications use the global wrapper:

```text
/Users/zhangjincheng/.codex/tools/codex-turn-ended-notify.sh
```

The default phone channel is Bark. Telegram credentials may stay configured for
future mobile-continuation work, but Telegram completion notifications are off
by default. The wrapper can include a compact workspace-health warning in the
phone notification when health status becomes `attention`.

## Run Tests

```bash
node --test docs/workspace/*.test.mjs
```
