# Daily Workflow Quickstart

Policy: `AGENTS.md`. Worker contract: `WORKER.md`.
Optional legacy long-task CLI: `codex-long-task-runbook.md` (explicit opt-in only).

## Supported Codex Client

This workspace targets ChatGPT desktop's bundled Codex CLI 0.153.4. For CLI
work here, invoke `/Applications/ChatGPT.app/Contents/Resources/codex` directly.
The older Codex.app and PATH CLI 0.144 installations remain installed but do
not support this workspace's current `[agents]` configuration. The user chooses
the primary model and reasoning effort per task or through their global defaults;
workspace config does not override either setting.
Some CLI V2 sessions expose no named-role selector. Follow WORKER.md's explicit
model/effort fallback rather than assuming custom role files were applied.

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
5. Close out with concise changes, verification and residual risk.

Escalate to the ordinary short-task workflow when the task touches multiple
files or modules, shared core logic, API routes, dependency/build/CI behavior,
unclear project routing, or a test/fix loop. Apply L2/L3 to the actual live target or effect, not
keywords in local source, skill documents, tests or quoted examples.

## Short Task

Use this when the fast path does not apply.

1. Route from explicit project/path/service evidence.
2. Classify risk. Keep generic requests at workspace-index level.
3. Apply AGENTS.md ownership: work directly or delegate independent slices
   when useful. Size alone does not require a helper.
4. Send the helper owned files, constraints, acceptance criteria and a Route Lock
   in its brief; do not mandate a whole agent chain.
5. Codex reviews evidence, runs focused checks and resolves remaining defects.
6. Close out with confirmed results and remaining limitations.

## Project Registration

Use this when the user asks to create or onboard a durable project surface.

1. Choose a slug, display name, kind, risk profile, and routing aliases.
2. Run the helper:

```bash
node docs/workspace/codex-register-project.mjs --slug <slug> --name "<Name>" --kind product
```

3. Review `PROJECTS.md`, `docs/workspace/project-registry.json`, and
   `ops/projects/<slug>/README.md`.
4. Run focused tests plus `workspace-health` for policy or routing changes.

Use `--ops-only` for services that have durable ops docs in this workspace but
no local code root.

## Daily Notes

- Put short-lived session notes in `DAILY.md`.
- Promote durable workspace decisions into
  `docs/decisions/workspace-decisions.md`.
- Promote durable project facts into `ops/projects/<slug>/README.md`.
- Keep raw imports in ignored `inbox/` and cross-tool summaries in ignored
  `handoffs/`.

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
| Local implementation with useful independent work | Choose an appropriate helper under AGENTS.md, or implement directly; verify the result before acceptance. |
| Workspace policy, hygiene, or routing metadata change | Use focused review plus `node --test docs/workspace/*.test.mjs` and `workspace-health` after edits. |
| PDF, Word, spreadsheet, presentation, Figma, Sentry, Playwright, OpenAI docs, security, cleanup, or notification task | Use a matching skill when its actual workflow applies; apply workspace routing and risk gates. For Playwright CLI from this workspace root, launch via `docs/workspace/playwright-scratch.sh --label <label> -- ...` so `.playwright-cli/` stays under `scratch/shared/`. |
| Review with a concrete file/line finding | Prefer `::code-comment{...}` for actionable line-specific feedback. |
| Architecture, process, testing strategy, or cross-file review concern | Use normal review text with findings, residual risks, and testing gaps. |

For frontend or local web UI work, verify with Browser or Playwright when a
target is available. Use Chrome only when the task needs the user's real
logged-in profile, cookies, extensions, or an existing remote tab. Use
`Computer Use` only for desktop-app workflows without a reliable CLI, API, or
browser surface.

## Token Budget

- Keep the user's selected main model and reasoning strength. The optional
  profiles in `token-budget.md` are explicit choices, not automatic overrides.
- Use only as many helpers as useful independent work needs, within the
  configured limit and actual runtime capacity. Follow AGENTS.md for models,
  concurrent file ownership and batch scheduling; do not fill every role.
- Agents and workers should return only conclusions, changed files, commands
  run, key outcomes, risks, followups, and evidence pointers. Do not request long
  source excerpts, full diffs, or large logs unless they are the evidence under
  review.
- Keep command output bounded: target paths, use `rg -n` with specific terms,
  read file ranges, prefer `git diff --stat` or scoped diffs first, and summarize
  test failures to the first failing block plus the final summary.
- Prefer file pointers over pasted context: path, line number, conclusion,
  evidence summary, and next action.
- Reuse `docs/decisions/workspace-decisions.md`, long-task `05-decisions.md`,
  project ops READMEs, and GitNexus results before re-exploring; recheck only
  when there is drift evidence.
- Leave a brief recovery note when needed; there is no required layout or
  per-turn bookkeeping cadence.

## Long Task

Use conversation plans and progress updates for ordinary multi-stage work.
Do not automatically initialize runs, checkpoint, or show active-task indexes
because a task spans turns or verification fails. Read relevant old records
when the user continues a specific task; that alone does not opt into updates.

Legacy state is read-only by default. Ordinary reads and `status` remain
available. Only after the user sends the complete prompt `启用旧长任务流程` in
the current task, use the following mutating commands and the runbook:

```bash
node docs/workspace/codex-long-task.mjs init --project <name> --task "<goal>"
node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "<slice>"
node docs/workspace/codex-long-task.mjs checkpoint --run-root <run-root> --phase <phase> --next-action "<next>"
node docs/workspace/codex-long-task.mjs status --run-root <run-root>
node docs/workspace/codex-long-task.mjs resume --project <name>
node docs/workspace/codex-long-task.mjs repair --run-root <run-root> --verify-result <path>
node docs/workspace/codex-long-task.mjs recheck --run-root <run-root> --repair-result <path>
node docs/workspace/codex-long-task.mjs close --run-root <run-root> --result <path>
node docs/workspace/codex-long-task.mjs reopen --run-root <run-root> --evidence-fact "<new fact>" --evidence-file <path> --hypothesis "<new hypothesis>" --approach "<new approach>"
node docs/workspace/codex-long-task.mjs finalize --run-root <run-root>
```

For explicitly opted-in runs, the CLI preserves its existing state protocol
and retry limits. These constraints do not impose bookkeeping on other tasks.
Keep existing run states and counters unchanged unless their update is requested.
The opt-in ends when the task stops and can be revoked with `停用旧长任务流程`,
`关闭旧长任务流程`, or `取消旧长任务流程`.

## Hygiene

- Auto hygiene is whitelist-gated by `repo-hygiene.mjs`.
- Keep project routing metadata in `docs/workspace/project-registry.json`; keep
  `ops/projects/<project>/README.md` as the human-facing route record.
- Regenerate `PROJECTS.md` with
  `node docs/workspace/codex-register-project.mjs --regen` after registry-only
  edits.
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
