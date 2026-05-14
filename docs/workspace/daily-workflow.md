# Daily Workflow Quickstart

Policy: `AGENTS.md`. Worker contract: `WORKER.md`.
Long-task details: `codex-long-task-runbook.md`.

## Small Task Fast Path

Use this first for `L0 tiny` work: ordinary questions, lightweight state checks,
typos, single-file small docs edits, or one localized script/test fix with no
public contract change.

Default behavior:

1. Stay at the workspace-index level unless the user names a project, path, or
   service.
2. Classify as `L0 tiny` in one short line, or answer naturally when the task is
   only a simple question.
3. Keep ownership in Codex. Do not use model workers for tiny work by default.
4. Skip Route Lock, GitNexus, workspace-health, and long-task state unless the
   task evidence specifically needs one of them.
5. Verify with the smallest relevant check, then close out briefly.

Escalate to the ordinary short-task workflow when the task touches multiple
files or modules, shared core logic, API routes, dependency/build/CI behavior,
unclear project routing, or a test/fix loop. Any live, NAS, OpenClaw,
production, deploy, auth, secrets, or config-heavy signal still follows the
`L2`/`L3` gates in `AGENTS.md`.

## Short Task

Use this when the fast path does not apply.

1. Route from explicit project/path/service evidence.
2. Classify risk. Keep generic requests at workspace-index level.
3. Choose the execution owner:
   `Codex route/judge -> worker implements by default for non-tiny implementation -> verifier/Codex accepts`.
4. Keep the work in Codex when the task is tiny or the main value is diagnosis,
   architecture, safety, L2/L3, live, deploy, auth, secrets, or config-heavy judgment.
5. For ordinary non-tiny implementation, send a bounded slice to
   `model_worker_delegate` with owned scope, acceptance criteria, and constraints.
6. Verify locally or with `verifier`, then either accept or send a focused
   repair brief back to the worker unless a `why_no_worker` bypass applies.
7. Close out with confirmed facts, verification, residual risks, and next steps.

## Capability Defaults

Use these as default checks before choosing tools. They support the workflow;
they do not replace routing, risk classification, worker ownership, or final
Codex acceptance.

| Situation | Default capability |
| --- | --- |
| `L0 tiny` question, typo, single-file small docs update, lightweight status check, or isolated script/test tweak | Codex handles directly. Skip Route Lock, GitNexus, model workers, and workspace-health unless the task evidence needs them. |
| L1 multi-file change, shared core function, cross-module refactor, API route, or unknown call chain | Check GitNexus `list_repos`; if the target repo is indexed, use `query`, `context`, and `impact`. For API routes, prefer `api_impact`. |
| GitNexus target missing or stale | Record `GitNexus unavailable/stale`, then fall back to `rg`, focused tests, and local review. |
| Non-tiny local implementation, repetitive edits, mechanical refactor, or test/fix loop | Send a bounded slice to `model_worker_delegate` when available, then verify locally before acceptance. |
| Workspace policy, hygiene, or routing metadata change | Use focused review plus `node --test docs/workspace/*.test.mjs` and `workspace-health` after edits. |
| PDF, Word, spreadsheet, presentation, Figma, Sentry, Playwright, OpenAI docs, security, cleanup, or notification task | Use the matching skill first, then apply workspace routing and risk gates. For Playwright CLI from this workspace root, launch via `docs/workspace/playwright-scratch.sh --label <label> -- ...` so `.playwright-cli/` stays under `scratch/shared/`. |
| Review with a concrete file/line finding | Prefer `::code-comment{...}` for actionable line-specific feedback. |
| Architecture, process, testing strategy, or cross-file review concern | Use normal review text with findings, residual risks, and testing gaps. |

For frontend or local web UI work, verify with Browser or Playwright when a
target is available. Use Chrome only when the task needs the user's real
logged-in profile, cookies, extensions, or an existing remote tab. Use Computer
Use only for desktop-app workflows without a reliable CLI, API, or browser
surface.

## Long Task

Escalate to a run-directory workflow when the task spans multiple slices, needs
handoff state, or enters repeated repair loops. Keep ordinary tasks on the
short-task path above.

Escalate from the short-task path when any of these apply: multiple slices,
cross-repo or broad cross-module work, more than two continuation/recovery
turns, worker repair is needed, or verification failure starts a repair loop.

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
- Use `workspace-health` to evaluate large scratch paths and workflow drift
  during hygiene or policy work. Do not run it as a required preflight for
  `L0 tiny` tasks.
- Use `node docs/workspace/repo-hygiene.mjs --repo "$PWD" --explain-mismatch`
  to show the exact missing project, field, README, and values.
- Pause grouped work:
  `~/.codex/tools/codex-repo-hygiene-guard.sh pause --repo <repo> --minutes 30`

## Phone Closeout

- Completion notifications go through
  `/Users/zhangjincheng/.codex/tools/codex-turn-ended-notify.sh`.
- Bark is the default phone push channel.
- Telegram completion notifications are disabled by default, but credentials can
  remain in `~/.codex/notify-config.json` for a future mobile-continuation flow.
- The wrapper checks workspace health and adds a compact phone warning only when
  `workspace-health` reports `attention` or fails.
