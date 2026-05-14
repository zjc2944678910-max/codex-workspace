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

## Small Known-Scope Path

Use this before delegating when the user or repo context already identifies the
target project, files or tests, acceptance criteria, and there is no API route,
deploy, auth, secret, live, production, or cross-module uncertainty.

Default behavior:

1. Keep ownership in Codex.
2. Read only the relevant files and nearby tests.
3. Make the scoped change directly.
4. Run focused verification.
5. Close out with concise changes, verification, residual risk, and `why_no_worker`
   only when policy would otherwise expect a worker.

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
   `Codex route/judge -> lightest safe path -> implement or delegate -> focused verification -> Codex accepts`.
4. Keep the work in Codex when the task is tiny, known-scope, or the main value
   is diagnosis, architecture, safety, L2/L3, live, deploy, auth, secrets, or
   config-heavy judgment.
5. Open `repo_mapper`, `review_guard`, `model_worker_delegate`, or `verifier`
   only when the call chain, contracts, cross-module risk, repeated repair risk,
   or handoff state justify the extra tokens.
6. For delegated implementation, send a bounded slice to `model_worker_delegate`
   with owned scope, acceptance criteria, constraints, and compact output
   requirements.
7. Verify locally or with `verifier`, then either accept or send a focused
   repair brief back to the worker unless a `why_no_worker` bypass applies.
8. Close out with confirmed facts, verification, residual risks, and next steps.

## Capability Defaults

Use these as default checks before choosing tools. They support the workflow;
they do not replace routing, risk classification, worker ownership, or final
Codex acceptance.

| Situation | Default capability |
| --- | --- |
| `L0 tiny` question, typo, single-file small docs update, lightweight status check, or isolated script/test tweak | Codex handles directly. Skip Route Lock, GitNexus, model workers, and workspace-health unless the task evidence needs them. |
| Small known-scope L0/L1 edit with explicit files/tests and no risky surface | Codex handles directly with focused local verification. |
| L1 multi-file change, shared core function, cross-module refactor, API route, unknown call chain, or unclear contract | Check GitNexus `list_repos`; if the target repo is indexed, use `query`, `context`, and `impact`. For API routes, prefer `api_impact`. |
| GitNexus target missing or stale | Record `GitNexus unavailable/stale`, then fall back to `rg`, focused tests, and local review. |
| Non-tiny local implementation with unknown call chain, cross-module risk, repetitive edits, mechanical refactor, or test/fix loop | Send a bounded slice to `model_worker_delegate` when available, then verify locally before acceptance. |
| Workspace policy, hygiene, or routing metadata change | Use focused review plus `node --test docs/workspace/*.test.mjs` and `workspace-health` after edits. |
| PDF, Word, spreadsheet, presentation, Figma, Sentry, Playwright, OpenAI docs, security, cleanup, or notification task | Use the matching skill first, then apply workspace routing and risk gates. For Playwright CLI from this workspace root, launch via `docs/workspace/playwright-scratch.sh --label <label> -- ...` so `.playwright-cli/` stays under `scratch/shared/`. |
| Review with a concrete file/line finding | Prefer `::code-comment{...}` for actionable line-specific feedback. |
| Architecture, process, testing strategy, or cross-file review concern | Use normal review text with findings, residual risks, and testing gaps. |

For frontend or local web UI work, verify with Browser or Playwright when a
target is available. Use Chrome only when the task needs the user's real
logged-in profile, cookies, extensions, or an existing remote tab. Use Computer
Use only for desktop-app workflows without a reliable CLI, API, or browser
surface.

## Token Budget

- Use the `fast` profile for ordinary questions, tiny edits, and known-scope
  local fixes; use `standard` for default development; use `audit` for L2,
  architecture, complex root cause, production audits, and hard regressions.
- L0 and small known-scope L1 use zero agents by default. Ordinary L1 should use
  at most one helper agent unless two or more risk signals are present: unknown
  call chain, cross-module contract, API route, security/auth/secret boundary,
  flaky or failing verification, broad refactor, or repeated repair.
- Agents and workers should return only conclusions, changed files, commands
  run, key outcomes, risks, followups, and evidence pointers. Do not request long
  source excerpts, full diffs, or large logs unless they are the evidence under
  review.
- Keep command output bounded: target paths, use `rg -n` with specific terms,
  read file ranges, prefer `git diff --stat` or scoped diffs first, and summarize
  test failures to the first failing block plus the final summary.
- Prefer file pointers over pasted context: path, line number, conclusion,
  evidence summary, and next action.
- Reuse `05-decisions.md`, project ops READMEs, and GitNexus results before
  re-exploring; recheck only when there is drift evidence.
- Prefer long-task run files for durable state before the chat context becomes
  large.

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
