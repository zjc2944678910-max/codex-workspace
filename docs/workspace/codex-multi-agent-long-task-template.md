# Codex Long Task Template Reference

> **NON-CANONICAL**
>
> Policy lives in `AGENTS.md`.
> Operational details live in `codex-long-task-runbook.md`.
> State writes require the exact current-task opt-in documented there.

Use this file only for compact prompt/layout examples.

Follow the current `AGENTS.md` for workflow, model, and concurrency choices.
Root may inspect, implement, repair, and verify directly. Helpers are optional;
the files below do not prescribe a full agent chain.

## Minimal Run Layout

```text
<run-root>/
  00-request.md
  01-confirmed-context.md
  02-plan.md
  03-task-ledger.md
  04-risk-register.md
  05-decisions.md
  06-final-summary.md
  07-agent-registry.md
  brief-templates/
    dev-brief.md
    verify-brief.md
    repair-brief.md
  agents/
    T01/mapper-brief.md
    T02/review-brief.md
    T03/dev-brief.md
    T04/verify-brief.md
```

## Handoff Defaults

```bash
node docs/workspace/codex-long-task.mjs init --project <name> --task "<goal>"
node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "<slice>"
```

- Development brief: root may execute it directly or delegate when a bounded
  helper contribution is useful. `model_worker_delegate` is a backward-compatible
  legacy label mapped to an available worker when delegation is chosen.
- Verification brief: root may verify directly or use an optional verifier.
- Repair brief: root may repair directly or delegate it to an available worker.
- Refactoring requires explicit root authorization in the applicable brief.
- All results should stay compact: conclusion, changed files, commands run, key
  outcomes, evidence pointers, risks, and followups only.
- Reuse `05-decisions.md` before re-exploring; recheck only when drift evidence
  appears.

## Dev Brief Skeleton

```markdown
# Development Brief

## Role
model_worker_delegate

## Inputs
- Request: <run-root>/00-request.md
- Route lock: <run-root>/01-confirmed-context.md
- Plan: <run-root>/02-plan.md

## Task
<smallest implementation slice>

## Ownership
- Owned files/modules: <explicit write set>

## Acceptance Criteria
- <criterion>

## Return
summary: <compact result>
changed_files: <paths or empty>
tests_run: <commands or checks>
risks: <residual risks or empty>
followups: <optional next steps or empty>
evidence_pointers: <path:line finding list>
```
