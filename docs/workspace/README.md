# Workspace Tools

Workspace-level runbooks, long-task CLI, and hygiene tools.
Policy: `AGENTS.md`. Worker contract: `WORKER.md`.

## Quick Links

| Tool | Purpose |
| --- | --- |
| `codex-long-task.mjs` | Unified long-task CLI: init, append, repair, recheck, close |
| `codex-long-task-runbook.md` | **Canonical** operational long-task workflow |
| `codex-multi-agent-long-task-template.md` | Non-canonical prompt examples and layout reference |
| `repo-hygiene.mjs` | Workspace root hygiene checks and checkpointing |
| `workspace-disk-report.mjs` | Classify disk hotspots before cleanup |

## Run Tests

```bash
node --test docs/workspace/*.test.mjs
```
