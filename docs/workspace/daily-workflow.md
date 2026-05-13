# Daily Workflow Quickstart

Policy: `AGENTS.md`. Worker contract: `WORKER.md`.
Long-task details: `codex-long-task-runbook.md`.

## Short Task

1. Route from explicit project/path/service evidence.
2. Classify risk. Keep generic requests at workspace-index level.
3. Choose the execution owner:
   `Codex route/judge -> worker implements by default -> verifier/Codex accepts`.
4. Keep the work in Codex when the task is tiny or the main value is diagnosis,
   architecture, safety, L2/L3, live, deploy, auth, secrets, or config-heavy judgment.
5. For ordinary implementation, send a bounded slice to
   `model_worker_delegate` with owned scope, acceptance criteria, and constraints.
6. Verify locally or with `verifier`, then either accept or send a focused
   repair brief back to the worker unless a `why_no_worker` bypass applies.
7. Close out with confirmed facts, verification, residual risks, and next steps.

## Long Task

Escalate to a run-directory workflow when the task spans multiple slices, needs
handoff state, or enters repeated repair loops. Keep ordinary tasks on the
short-task path above.

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
- Keep project routing metadata in `docs/workspace/project-registry.json`; keep
  `ops/projects/<project>/README.md` as the human-facing route record.
- `repo-hygiene.mjs` reports `project_route_metadata_mismatches` when registry
  route facts drift from the matching ops README.
- Use `node docs/workspace/repo-hygiene.mjs --repo "$PWD" --explain-mismatch`
  to show the exact missing project, field, README, and values.
- Pause grouped work:
  `~/.codex/tools/codex-repo-hygiene-guard.sh pause --repo <repo> --minutes 30`
