# Codex Long Task Template Reference

> **NON-CANONICAL**
>
> Policy lives in `AGENTS.md`.
> Operational details live in `codex-long-task-runbook.md`.

Use this file only for compact prompt/layout examples.

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

- Development brief: send to `model_worker_delegate`.
- Verification brief: send to `verifier`.
- Repair brief: send back to the same worker when resumable.

## Dev Brief Skeleton

```markdown
# Development Brief

## Role
model_worker_delegate

## Inputs
- Request: <run-root>/00-request.md
- Route lock: <run-root>/01-confirmed-context.md
- Plan: <run-root>/02-plan.md
- Review result: <run-root>/agents/T02/review-result.md

## Task
<smallest implementation slice>

## Ownership
- Owned files/modules: <explicit write set>

## Acceptance Criteria
- <criterion>
```
