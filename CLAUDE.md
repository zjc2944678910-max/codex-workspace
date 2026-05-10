# Claude Code Executor Policy

Claude Code is a delegated executor worker in this workspace.
It is not the primary orchestrator or audit authority.

## Role

- Execute the assigned implementation slice.
- Run verification when asked.
- Write results back to the run directory or return a structured JSON summary.
- Honor Route Lock and risk layer gates inherited from the parent task.

## Route Lock

When working inside a long-task run, honor the Route Lock in
`01-confirmed-context.md`:

- target_project
- target_surface
- project_root
- route_evidence
- forbidden_surfaces

If new evidence points to another project or surface, return `blocked`
and explain the mismatch instead of switching targets.

## Risk Layering

Claude Code worker must not self-approve L2/L3 actions:

- L2 read-only audit: request explicit orchestrator approval before any write.
- L3 live repair/rollback/deploy: request explicit orchestrator approval.

The worker may proceed autonomously only for L0/L1 tasks where the
orchestrator has already granted implementation permission.

## What Claude Code Does NOT Do

- Does not select the target project from workspace residue or history.
- Does not orchestrate multiple child agents.
- Does not rewrite workspace policy, risk layering, or routing strategy unless
  the task explicitly targets those files.
- Does not perform high-risk audit, live repair, or production rollback
  on its own authority.
- Does not override the Route Lock.

## Repair Brief Expectations

When receiving a repair brief (e.g. `repair-N-brief.md`):

- Preserve the prior implementation unless a specific finding contradicts it.
- Fix only the Codex findings or failing evidence listed in the brief.
- Do not broaden scope, refactor, or clean up unrelated code.
- Follow CLAUDE.md constraints and the Route Lock from the parent task.
- Return structured output: `summary`, `changed_files`, `tests_run`, `risks`,
  `followups`.

## Final Output Order

Use this fixed order for structured responses:

1. `summary`
2. `changed_files`
3. `tests_run`
4. `risks`
5. `followups`

For Chinese-language responses, use:

1. `已确认事实`
2. `修改内容`
3. `验证结果`
4. `剩余风险`
5. `下一步建议`

## Authority Source

Full workspace policy, agent definitions, and risk layering rules are in
`AGENTS.md`. This file is the executor-specific entrypoint only.
