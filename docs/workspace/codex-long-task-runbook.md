# Codex Long Task Runbook

Use this runbook when a task is large enough that chat-only memory would become
messy, but it is still local engineering work.

For the design rationale and agent prompt templates, see
`docs/workspace/codex-multi-agent-long-task-template.md`.

## When To Use

Use a long-task run directory for:

- multi-step implementation work
- broad debugging with several hypotheses
- work that needs mapping, review, implementation, and verification
- tasks likely to need one or more repair loops

Do not use this as a shortcut around L2/L3 gates. Production audits and repairs
still follow `AGENTS.md`.

Choose the target project from the user request first. Do not default
`--project` to `openclaw`; use `openclaw` only when the task explicitly
targets that surface.

## Initialize A Run

Preferred unified entrypoint:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project sample-product \
  --project-root /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/sample-product \
  --slug feature-flag-sync \
  --task "Implement feature flag sync"
```

Project-specific run:

```bash
node docs/workspace/codex-long-task-init.mjs \
  --project sample-product \
  --project-root /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/sample-product \
  --slug feature-flag-sync \
  --task "Implement feature flag sync"
```

Shared run:

```bash
node docs/workspace/codex-long-task-init.mjs \
  --shared \
  --slug agent-template-research \
  --task "Research and summarize agent template options"
```

Dry run:

```bash
node docs/workspace/codex-long-task-init.mjs \
  --project sample-product \
  --slug demo \
  --task "Demo long task" \
  --dry-run \
  --json
```

The script prints the new `run_root`.

It also seeds `agents/T01/mapper-brief.md` and
`agents/T02/review-brief.md` so the first mapper and review handoffs are ready
without manual directory setup.

It also creates reusable templates:

- `brief-templates/dev-brief.md`
- `brief-templates/verify-brief.md`
- `brief-templates/repair-brief.md`

## First Fill-In Pass

Before delegating any work, fill or update:

- `00-request.md`: exact user goal and constraints
- `01-confirmed-context.md`: risk level, project root, confirmed facts, hypotheses
- `02-plan.md`: current plan and implementation slices
- `03-task-ledger.md`: task IDs and statuses
- `04-risk-register.md`: risks, rollback idea, open questions
- `05-decisions.md`: decisions future agents must honor

## Main Agent Loop

1. State the risk layer and execution strategy.
2. Create or locate the run directory.
3. Use `repo_mapper` for non-trivial code mapping.
4. Write the mapper result path into `03-task-ledger.md`.
5. Ask `review_guard` for pre-change risk review.
6. Use `docs_checker` if API, framework, or version behavior is unclear.
7. Use `surgical_fixer` for the smallest safe implementation slice.
8. Use `verifier` for the smallest useful validation.
9. Update `06-final-summary.md` as the task converges.

When moving from review into implementation, copy
`brief-templates/dev-brief.md` into `agents/<task-id>/dev-brief.md`, then fill
the write set and acceptance criteria. Do the same with
`brief-templates/verify-brief.md` for the verifier.

You can also append a ready-to-fill development and verification pair with:

```bash
node docs/workspace/codex-long-task.mjs append \
  --run-root <run-root> \
  --scope "Implement feature flag sync" \
  --owned "src/feature-flags.ts" \
  --owned "tests/feature-flags.test.ts" \
  --acceptance "feature flag changes are persisted" \
  --acceptance "focused tests pass"
```

This creates the next `agents/Txx/dev-brief.md` and
`agents/Tyy/verify-brief.md`, then appends both rows to `03-task-ledger.md`.

## Repair Loop

If verification fails:

1. Mark the task `needs_fix` in `03-task-ledger.md`.
2. Write `repair-N-brief.md` under that task's `agents/<task-id>/` directory.
3. Send the repair brief back to the same development agent if its ID is known.
4. Send the repaired result back to the same verifier if its ID is known.
5. Record IDs and resume rules in `07-agent-registry.md`.
6. Stop after 3 failed repair attempts and mark the task `blocked` or `deferred`.

If the client cannot resume the same child agent, give the replacement agent the
previous `dev-result.md`, `verify-result.md`, and latest repair brief as input.

You can generate the repair brief and update the ledger with:

```bash
node docs/workspace/codex-long-task.mjs repair \
  --run-root <run-root> \
  --verify-result <run-root>/agents/T04/verify-result.md \
  --expected "focused tests pass"
```

The tool infers the verifier task from the result path, finds the development
task from `03-task-ledger.md`, writes `agents/<dev-task>/repair-N-brief.md`,
marks the development row `needs_fix`, and marks the verifier row `blocked`
while it waits for the repair.

After the repair agent writes `repair-N-result.md`, send the result back to the
same verifier with:

```bash
node docs/workspace/codex-long-task.mjs recheck \
  --run-root <run-root> \
  --repair-result <run-root>/agents/T03/repair-1-result.md
```

The tool infers the development task and repair number from the repair result
path, finds the verifier task from `03-task-ledger.md`, writes
`agents/<verify-task>/recheck-N-brief.md`, and marks both rows `verifying`.

When the verifier writes `verify-result.md` or `recheck-N-result.md`, close the
slice with:

```bash
node docs/workspace/codex-long-task.mjs close \
  --run-root <run-root> \
  --result <run-root>/agents/T04/recheck-1-result.md
```

If the result status is `pass`, the tool marks the development row `verified`
and the verifier row `done`. If it is `fail`, it marks the development row
`needs_fix`, marks the verifier row `blocked`, and points back to the repair
tool.

## Status Discipline

Use these statuses in `03-task-ledger.md`:

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

At the end:

- update `06-final-summary.md`
- report changed files
- report verification commands and outcomes
- separate confirmed facts, hypotheses, and residual risks
- keep the final chat answer in the `AGENTS.md` section order
