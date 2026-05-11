# Codex Long Task Runbook

Use this when chat-only memory would get messy. Policy gates live in
`AGENTS.md`; this file only describes the run-directory workflow.

## When To Use

Use a long-task run for multi-step local engineering, broad debugging,
map/review/implement/verify work, or tasks likely to need repair loops.

Do not use this to bypass L2/L3 gates. Choose the target project from explicit
user evidence first; do not default `--project` to any registered project.

## Initialize

Preferred entrypoint:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project sample-product \
  --project-root /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/sample-product \
  --slug feature-flag-sync \
  --task "Implement feature flag sync"
```

Shared run:

```bash
node docs/workspace/codex-long-task.mjs init \
  --shared \
  --slug agent-template-research \
  --task "Research and summarize agent template options"
```

Dry run:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project sample-product \
  --slug demo \
  --task "Demo long task" \
  --dry-run \
  --json
```

The init command creates:

- state docs: `00-request.md` through `07-agent-registry.md`
- first handoff briefs: `agents/T01/mapper-brief.md`,
  `agents/T02/review-brief.md`
- reusable templates: `brief-templates/dev-brief.md`,
  `verify-brief.md`, `repair-brief.md`

Before any handoff, fill the Route Lock in `01-confirmed-context.md`:
`target_project`, `target_surface`, `project_root`, `route_evidence`,
`forbidden_surfaces`.

## First Fill-In Pass

Update:

- `00-request.md`: exact goal and user constraints
- `01-confirmed-context.md`: risk level, Route Lock, confirmed facts, hypotheses
- `02-plan.md`: strategy and implementation slices
- `03-task-ledger.md`: task IDs and statuses
- `04-risk-register.md`: risks, rollback idea, open questions
- `05-decisions.md`: decisions future agents must honor

## Main Loop

1. Map non-trivial surfaces with `repo_mapper`.
2. Review risk with `review_guard`; use `docs_checker` only for unclear API,
   framework, or version semantics.
3. Send bounded implementation slices to `model_worker_delegate` by default.
4. Verify with Codex-side `verifier`.
5. Update ledger, decisions, and `06-final-summary.md` as state changes.

Append a ready development/verification pair:

```bash
node docs/workspace/codex-long-task.mjs append \
  --run-root <run-root> \
  --scope "Implement feature flag sync" \
  --owned "src/feature-flags.ts" \
  --owned "tests/feature-flags.test.ts" \
  --acceptance "feature flag changes are persisted" \
  --acceptance "focused tests pass"
```

This creates `agents/Txx/dev-brief.md`, `agents/Tyy/verify-brief.md`, and
appends both ledger rows. The default development executor remains
`model_worker_delegate`.

## Repair Loop

Default loop:

```text
Codex verifier/review finding -> worker repair brief -> Codex recheck
```

If verification fails:

1. Generate a focused repair brief with the exact failing evidence.
2. Send it back to `model_worker_delegate`, preferably the same worker/thread.
3. Send the repair result back to the same verifier when resumable.
4. Stop after 3 failed repair attempts and mark the slice `blocked` or
   `deferred`.

Generate a repair brief:

```bash
node docs/workspace/codex-long-task.mjs repair \
  --run-root <run-root> \
  --verify-result <run-root>/agents/T04/verify-result.md \
  --expected "focused tests pass"
```

Codex may direct-patch only when a bypass reason from `AGENTS.md` applies. If
that happens, final output must include `why_no_worker`.

Recheck after worker repair:

```bash
node docs/workspace/codex-long-task.mjs recheck \
  --run-root <run-root> \
  --repair-result <run-root>/agents/T03/repair-1-result.md
```

Close the slice:

```bash
node docs/workspace/codex-long-task.mjs close \
  --run-root <run-root> \
  --result <run-root>/agents/T04/recheck-1-result.md
```

## Ledger Statuses

Use:

- `pending`
- `mapping`
- `mapped`
- `reviewing`
- `ready`
- `implementing`
- `needs_fix`
- `verifying`
- `verified`
- `blocked`
- `deferred`
- `done`

## Finalize

At the end, update `06-final-summary.md` with the outcome, changed files,
verification, residual risks, and next steps. Keep detailed logs in the run
directory, not the parent conversation.
