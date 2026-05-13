# Workspace Tools

Workspace-level runbooks, long-task CLI, and hygiene tools.
Policy: `AGENTS.md`. Worker contract: `WORKER.md`.

## Quick Links

| Tool | Purpose |
| --- | --- |
| `codex-long-task.mjs` | Unified long-task CLI: init, append, repair, recheck, close |
| `codex-long-task-runbook.md` | **Canonical** operational long-task workflow |
| `codex-hooks.md` | Repo-local Codex hook guardrails, verification, and rollback |
| `codex-multi-agent-long-task-template.md` | Non-canonical prompt examples and layout reference |
| `repo-hygiene.mjs` | Workspace root hygiene checks and checkpointing |
| `workspace-disk-report.mjs` | Classify disk hotspots before cleanup |
| `workspace-health.mjs` | Compact health summary combining hygiene and disk checks |
| `codex-run-retention.mjs` | Rotate `scratch/shared/codex-runs` into cleanup archive |
| `project-registry.json` | Machine-readable workspace project registry |
| `project-surfaces.md` | Human-readable project surfaces and GitNexus status |
| `scratch-retention.json` | Scratch retention manifest with per-path policy |

## Health Check

```bash
node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12
```

## Run Tests

```bash
node --test docs/workspace/*.test.mjs
```
