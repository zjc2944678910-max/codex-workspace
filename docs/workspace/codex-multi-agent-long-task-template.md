# Codex Multi-Agent Long Task Template

> **NON-CANONICAL REFERENCE**
>
> Use this file for prompt snippets and layout examples only.
> Workspace policy lives in `AGENTS.md`.
> The canonical operational procedure lives in `codex-long-task-runbook.md`.

## What This File Is For

Use this reference when you need a compact example of:

- long-task run-directory layout
- the parent/worker split
- the default brief/result shape

Do not copy policy from here into new documents. If this file disagrees with
`AGENTS.md` or `codex-long-task-runbook.md`, those canonical files win.

## Default Split

- `Codex`:
  route, risk-layer, write Route Lock, map, review, verify, accept, summarize
- `Claude Code worker` via `claude_codegen_delegate`:
  implement the default development slice and repair loop
- `surgical_fixer` / `refactor_worker`:
  fallback-only local executors when Codex explicitly chooses them

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
    T01/mapper-result.md
    T02/review-brief.md
    T02/review-result.md
    T03/dev-brief.md
    T03/dev-result.md
    T04/verify-brief.md
    T04/verify-result.md
```

## Parent Responsibilities

The parent Codex agent owns:

- `00-request.md` through `05-decisions.md`
- Route Lock and risk-layer declaration
- ledger status updates
- delegating the implementation slice
- final verification and user-facing closeout

## Worker Handoff Defaults

Use the existing CLI to generate briefs:

```bash
node docs/workspace/codex-long-task.mjs init --project <name> --task "<goal>"
node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "<slice>"
```

Default interpretation:

- development brief -> send to `claude_codegen_delegate`
- verification brief -> send to `verifier`
- repair brief -> send back to the same development worker

## Example Dev Brief Skeleton

```markdown
# Development Brief

## Role
claude_codegen_delegate

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

## Example Result Shape

Prefer a compact result:

```text
result: <run-root>/agents/T03/dev-result.md
status: implemented
changed_files: <comma-separated paths>
```

Keep long logs in files, not in the parent conversation.
