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

## Capability Defaults

Use these as default checks before choosing tools. They support the workflow;
they do not replace routing, risk classification, worker ownership, or final
Codex acceptance.

| Situation | Default capability |
| --- | --- |
| L1 multi-file change, core function, cross-module refactor, API route, or unknown call chain | Check GitNexus `list_repos`; if the target repo is indexed, use `query`, `context`, and `impact`. For API routes, prefer `api_impact`. |
| GitNexus target missing or stale | Record `GitNexus unavailable/stale`, then fall back to `rg`, focused tests, and local review. |
| Tiny edit, typo, small docs update, or isolated script tweak | Skip GitNexus unless the user asks for impact analysis. |
| PDF, Word, spreadsheet, presentation, Figma, Sentry, Playwright, OpenAI docs, security, cleanup, or notification task | Use the matching skill first, then apply workspace routing and risk gates. |
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
