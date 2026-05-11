# Daily Workflow Quickstart

Policy: `AGENTS.md`. Worker contract: `WORKER.md`.
Long-task details: `codex-long-task-runbook.md`.

## Short Task

1. Route from explicit project/path/service evidence.
2. Classify risk. Keep generic requests at workspace-index level.
3. For ordinary implementation, delegate a bounded slice to
   `model_worker_delegate`; Codex verifies and accepts.
4. For tiny fixes, architecture, root cause, safety, live/deploy/auth/secrets,
   keep the work in Codex.
5. If worker output fails verification, send a focused repair brief back to the
   worker unless a `why_no_worker` bypass applies.

## Long Task

```bash
node docs/workspace/codex-long-task.mjs init --project <name> --task "<goal>"
node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "<slice>"
node docs/workspace/codex-long-task.mjs repair --run-root <run-root> --verify-result <path>
node docs/workspace/codex-long-task.mjs recheck --run-root <run-root> --repair-result <path>
node docs/workspace/codex-long-task.mjs close --run-root <run-root> --result <path>
```

Use a Route Lock before handoffs. Keep long logs in the run directory.

## Hygiene

- Auto hygiene is whitelist-gated by `repo-hygiene.mjs`.
- Pause grouped work:
  `~/.codex/tools/codex-repo-hygiene-guard.sh pause --repo <repo> --minutes 30`
