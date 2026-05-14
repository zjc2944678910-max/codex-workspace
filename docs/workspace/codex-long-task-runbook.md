# Codex Long Task Runbook

Use this when chat-only memory would get messy or a task no longer fits the
short-task workflow in `daily-workflow.md`. Policy gates live in `AGENTS.md`;
this file only describes the run-directory workflow.

## When To Use

Use a long-task run for multi-step local engineering, broad debugging,
map/review/implement/verify work, or tasks likely to need repair loops.

Do not use this to bypass L2/L3 gates. Choose the target project from explicit
user evidence first; do not default `--project` to any registered project.

## When To Escalate From Daily Workflow

Stay on the short-task path for ordinary local work. Start a run directory when
the task needs multiple implementation slices, spans repos or broad modules,
needs more than two continuation/recovery turns, requires worker repair, or a
verification failure starts a repair loop.

Before creating the run, confirm the route and risk level. Live, NAS, OpenClaw,
deploy, auth, secrets, and config-heavy work still follows `AGENTS.md`; a run
directory never opens L3 repair by itself.

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

1. Use the lightest safe path for each slice.
2. Map with `repo_mapper` only when entry points, contracts, or impact surface
   are unclear.
3. Review with `review_guard` only when correctness, regression, security,
   rollback, or missing-test risk needs a separate pass; use `docs_checker` only
   for unclear API, framework, or version semantics.
4. Send bounded implementation slices to `model_worker_delegate` when the work
   is broad, repetitive, cross-module, or likely to need repair.
5. Verify locally for known-scope slices; use `verifier` when reproduction,
   regression confidence, or independent validation is worth the extra context.
6. Update ledger, decisions, and `06-final-summary.md` as state changes.

All agent briefs should request compact results: conclusion, changed files,
commands run, key outcomes, evidence pointers, risks, and followups only. Keep
long logs and source excerpts in files when they are needed as evidence.

Agent budget:

- L0 and small known-scope L1 slices use zero agents by default.
- Ordinary L1 slices use at most one helper agent.
- Run the full mapper/review/worker/verifier chain only when at least two risk
  signals are present: unknown call chain, cross-module contract, API route,
  security/auth/secret boundary, flaky or failing verification, broad refactor,
  repeated repair, or messy handoff state.

Decision reuse:

- Record confirmed routes, entry points, commands, contracts, and stable
  architecture facts in `05-decisions.md`.
- Reuse those facts before re-exploring; recheck only when a related file
  changed, an index is stale, a command fails, or new evidence contradicts the
  ledger.

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
