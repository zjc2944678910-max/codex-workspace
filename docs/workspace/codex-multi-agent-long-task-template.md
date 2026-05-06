# Codex Multi-Agent Long Task Template

This template adapts the Ralph-style long-running agent loop to the current
`codex-workspace` configuration.

It is designed for long local engineering tasks where Codex should keep working
through exploration, review, implementation, verification, and small repair
loops without losing state.

## Fit With Current Workspace

Current confirmed configuration:

- Root workspace is an index, not the product repo.
- Product code changes should happen in the relevant project repo.
- Default workflow is `探索 -> 审查 -> 实施 -> 验证`.
- Standard agents already exist:
  - `repo_mapper`: read-only mapping before changes.
  - `review_guard`: read-only risk review.
  - `docs_checker`: read-only framework/API/version check.
  - `surgical_fixer`: smallest safe implementation fix.
  - `refactor_worker`: bounded refactor only after explicit approval.
  - `verifier`: focused reproduction and validation.
- Agent depth is `max_depth = 1`, so the main Codex agent must be the only
  orchestrator. Child agents should not delegate further.
- Long task state should live in `scratch/projects/<project>/` or another
  explicit scratch/state surface unless the project repo has its own accepted
  task-state convention.

## Core Idea

Do not make one giant conversation hold the whole task.

Use the main Codex conversation as the orchestrator. It keeps a compact ledger,
routes focused work to child agents, and reads only the summaries or file paths
needed for the next decision. Each child agent gets a narrow context window and
writes its result to a stable file.

The key adaptation from the video:

- Ralph loop: an external script starts new sessions and uses files as memory.
- Codex loop: the main agent starts scoped child agents and uses files as the
  task ledger, evidence store, and handoff protocol.

## Run Directory

Create one run directory per long task:

```text
scratch/projects/<project>/codex-runs/<YYYYMMDD-HHMM>-<task-slug>/
```

If the task is not project-specific, use:

```text
scratch/shared/codex-runs/<YYYYMMDD-HHMM>-<task-slug>/
```

Recommended layout:

```text
<run-root>/
  00-request.md
  01-confirmed-context.md
    Route Lock: target_project, target_surface, project_root, route_evidence, forbidden_surfaces
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
    <task-id>/
      mapper-brief.md
      mapper-result.md
      review-brief.md
      review-result.md
      dev-brief.md
      dev-result.md
      verify-brief.md
      verify-result.md
      repair-1-brief.md
      repair-1-result.md
```

The run directory is disposable coordination state unless explicitly promoted
into `docs/`, `ops/`, or the project repo.

To initialize this layout automatically, use:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project <project> \
  --project-root <absolute-project-root> \
  --slug <task-slug> \
  --task "<task goal>"
```

See `docs/workspace/codex-long-task-runbook.md` for the operational runbook.

To append a development and verification slice to an existing run, use:

```bash
node docs/workspace/codex-long-task.mjs append \
  --run-root <run-root> \
  --scope "<implementation slice>" \
  --owned "<file-or-module>" \
  --acceptance "<criterion>"
```

To start a bounded repair loop after verification fails, use:

```bash
node docs/workspace/codex-long-task.mjs repair \
  --run-root <run-root> \
  --verify-result <run-root>/agents/<verify-task-id>/verify-result.md \
  --expected "<expected behavior>"
```

To send a completed repair back to the same verifier, use:

```bash
node docs/workspace/codex-long-task.mjs recheck \
  --run-root <run-root> \
  --repair-result <run-root>/agents/<dev-task-id>/repair-<n>-result.md
```

To close a slice after verifier output, use:

```bash
node docs/workspace/codex-long-task.mjs close \
  --run-root <run-root> \
  --result <run-root>/agents/<verify-task-id>/recheck-<n>-result.md
```

## File Protocol

All agents communicate through files and short terminal responses.

### Parent Writes

The main agent writes briefs before delegating:

- `*-brief.md`: exact task, scope, allowed files, forbidden actions, expected
  output file, and stop condition.
- `01-confirmed-context.md`: includes the Route Lock that every child agent
  must honor.
- `03-task-ledger.md`: task IDs, status, owner agent, file scope, retries, and
  verification state.
- `04-risk-register.md`: confirmed risks, hypotheses, rollback idea, and
  unresolved questions.
- `05-decisions.md`: decisions that future agents must honor.
- `07-agent-registry.md`: child agent IDs or session handles needed to resume
  the same developer/verifier during repair loops.

### Child Writes

Child agents write results:

- `*-result.md`: concise result with evidence, changed files if any, commands
  run, gaps, and next recommendation.
- They should return only the result path plus a one-line status to the main
  agent, unless blocked.

### Output Rule

Prefer:

```text
result: <run-root>/agents/T03/verify-result.md
status: fail
```

Avoid sending large implementation details or full test logs into the main
conversation. Put them in files and return paths.

## Route Lock

Before any child-agent handoff, record the locked target in
`01-confirmed-context.md`:

```markdown
## Route Lock

- target_project: <project-or-shared>
- target_surface: <repo/path/config/ops surface selected by the request>
- project_root: <absolute project root, or N/A for workspace-index/shared work>
- route_evidence: <exact user phrase, path, service, host alias, repo, or config surface>
- forbidden_surfaces: <projects/repos/ops/state/scratch paths outside the locked target>
```

Child agents must work only inside `target_surface` and `project_root`. If new
evidence points to another project or surface, they must return `blocked` and
explain the mismatch instead of switching targets.

## Task Ledger Template

Use `03-task-ledger.md`:

```markdown
# Task Ledger

| ID | Status | Agent | Scope | Inputs | Outputs | Retries | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | pending | repo_mapper | auth flow map | 00-request.md | agents/T01/mapper-result.md | 0 |  |
| T02 | pending | review_guard | pre-change risk | 02-plan.md | agents/T02/review-result.md | 0 |  |
```

Allowed statuses:

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

## Agent Registry Template

Use `07-agent-registry.md` whenever the client exposes reusable child-agent
IDs, session IDs, or nicknames.

```markdown
# Agent Registry

| Task ID | Role | Agent Name | Agent ID | Created For | Resume Rule | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T04 | development | surgical_fixer | <id> | implement login fix | send repair briefs back here | active |
| T05 | verification | verifier | <id> | verify login fix | send recheck briefs back here | active |
```

If the client cannot resume a child agent, write that limitation in this file
and include the prior `dev-result.md` or `verify-result.md` as the first input
to the replacement agent.

## Main Orchestrator Prompt

Use this as the user-facing command for a long task:

```text
按项目默认协作流处理这个长任务。你是主编排 agent。

先做风险分层并声明 task level、rationale、execution strategy。
如果任务属于 L2/L3，遵守只读审计或修复门禁。

为本任务创建一个 run directory，并通过文件维护任务状态。
主 agent 只负责：
1. 确认目标、约束、风险层级和项目路径，并写入 Route Lock。
2. 创建并维护 00-request.md、01-confirmed-context.md、02-plan.md、03-task-ledger.md、04-risk-register.md、05-decisions.md。
3. 调度 repo_mapper、review_guard、docs_checker、surgical_fixer/refactor_worker、verifier。
4. 读取必要的 result 文件，更新 ledger，决定下一步。
5. 控制修复循环，最多 3 次。
6. 生成最终总结。

主 agent 不要把大段实现结果、测试日志或长文件内容塞进对话上下文。
子 agent 必须把结果写入 run directory，只向主 agent 返回结果文件路径和状态。

默认流程：
1. repo_mapper 做只读探索。
2. 主 agent 基于探索结果写计划。
3. review_guard 做改前风险审查。
4. 如果涉及框架/API/版本语义，docs_checker 先验证。
5. surgical_fixer 执行最小实现；只有明确批准重构时才用 refactor_worker。
6. verifier 运行最小有用验证。
7. 如果验证失败，把失败信息交回同一个开发 agent 修复；再交回同一个 verifier 验收。
8. 每轮修复后更新 task ledger 和 risk register。
9. 最终按 AGENTS.md 的固定格式输出。
```

## Planner Agent Template

Use `repo_mapper` for codebase exploration. If a dedicated planner is needed in
a future config, keep it read-only and use this prompt shape.

```text
Role: planning/read-only mapper

Input:
- User request: <run-root>/00-request.md
- Confirmed context: <run-root>/01-confirmed-context.md
- Route Lock: <run-root>/01-confirmed-context.md
- Project root: <absolute project path>

Task:
Map the real implementation surface for this request inside the locked target.
Identify entry points, files, symbols, call chains, data contracts, nearby tests,
and likely blast radius.

Constraints:
- Read-only.
- Do not edit files.
- Honor the Route Lock.
- Explore only target_surface/project_root from the Route Lock.
- If evidence points outside the Route Lock, return blocked and explain; do not switch projects.
- Separate confirmed facts from hypotheses.
- Prefer concrete paths and commands over abstract advice.
- Do not design a broad refactor unless explicitly asked.

Write:
- <run-root>/agents/<task-id>/mapper-result.md

Return only:
result: <path>
status: mapped | blocked
```

Recommended `mapper-result.md` sections:

```markdown
# Mapper Result

## Confirmed Facts
## Impact Surface
## Relevant Files
## Nearby Tests
## Hypotheses
## Recommended Implementation Slices
## Open Questions
```

## Review Agent Template

Use `review_guard` before implementation and optionally after implementation.

```text
Role: risk reviewer

Input:
- Request: <run-root>/00-request.md
- Route Lock: <run-root>/01-confirmed-context.md
- Plan: <run-root>/02-plan.md
- Ledger: <run-root>/03-task-ledger.md
- Mapper result: <run-root>/agents/<mapper-task>/mapper-result.md

Task:
Review the plan for correctness, regressions, edge cases, security exposure,
missing tests, rollback concerns, and unclear assumptions.

Constraints:
- Read-only.
- Do not implement.
- Honor the Route Lock.
- Review only target_surface/project_root from the Route Lock.
- If the plan relies on another project or surface, return blocked and explain.
- Lead with findings.
- Ground every finding in concrete files, paths, contracts, or missing evidence.

Write:
- <run-root>/agents/<task-id>/review-result.md

Return only:
result: <path>
status: pass | changes_requested | blocked
```

## Docs Checker Template

Use `docs_checker` when a change depends on framework, library, API, or version
semantics.

```text
Role: authoritative docs checker

Input:
- Question: <specific API/framework/version question>
- Route Lock: <run-root>/01-confirmed-context.md
- Project dependency evidence: <package/config files>
- Plan: <run-root>/02-plan.md

Task:
Verify the relevant semantics for the locked target against authoritative
documentation or local version evidence.

Constraints:
- Read-only.
- Honor the Route Lock.
- Check only dependencies and version evidence for target_surface/project_root.
- Do not guess from memory when documentation can answer it.
- Report exact version-sensitive constraints.

Write:
- <run-root>/agents/<task-id>/docs-result.md

Return only:
result: <path>
status: confirmed | contradicted | blocked
```

## Development Agent Template

Use `surgical_fixer` for normal fixes and scoped implementation. Use
`refactor_worker` only after explicit refactor approval.

```text
Role: implementation worker

Input:
- Request: <run-root>/00-request.md
- Confirmed context: <run-root>/01-confirmed-context.md
- Route Lock: <run-root>/01-confirmed-context.md
- Plan slice: <run-root>/agents/<task-id>/dev-brief.md
- Decisions: <run-root>/05-decisions.md
- Relevant mapper/review/docs result files.

Task:
Implement only the assigned slice.

Ownership:
- You own only these files/modules: <explicit write set>
- Other agents may be working elsewhere. Do not revert or overwrite unrelated
  changes. Work with existing local changes.

Constraints:
- Smallest defensible change.
- Honor the Route Lock.
- Change only files in target_surface/project_root and the assigned write set.
- If the required fix belongs to another project or surface, return blocked and explain.
- No unrelated cleanup.
- Preserve public behavior unless the brief explicitly says behavior changes.
- If the task is broader than the assigned slice, stop and report why.
- Update only the files needed for this slice.

Write:
- Code changes in the project repo.
- <run-root>/agents/<task-id>/dev-result.md

Return only:
result: <path>
status: implemented | blocked
changed_files: <comma-separated paths>
```

Recommended `dev-result.md` sections:

```markdown
# Development Result

## Status
## Changed Files
## What Changed
## Commands Run
## Known Gaps
## Notes For Verifier
```

## Verification Agent Template

Use `verifier` after each implementation slice.

```text
Role: verifier

Input:
- Request: <run-root>/00-request.md
- Route Lock: <run-root>/01-confirmed-context.md
- Dev result: <run-root>/agents/<dev-task>/dev-result.md
- Plan: <run-root>/02-plan.md
- Expected behavior: <specific acceptance criteria>

Task:
Reproduce or validate the assigned behavior with the smallest useful checks.

Constraints:
- Verify, do not redesign.
- Honor the Route Lock.
- Validate only target_surface/project_root from the Route Lock.
- If verification requires another project or surface, return blocked and explain.
- Do not make product code changes unless explicitly asked for a test-only fix.
- Report exact commands and outcomes.
- Separate confirmed failures from suspected failures.

Write:
- <run-root>/agents/<task-id>/verify-result.md

Return only:
result: <path>
status: pass | fail | blocked
```

Recommended `verify-result.md` sections:

```markdown
# Verification Result

## Status
## Commands
## Passing Evidence
## Failing Evidence
## Coverage Gaps
## Recommendation
```

## Repair Loop Rules

Use a bounded repair loop per task slice.

1. Verification fails.
2. Main agent reads the failing verifier result.
3. Main agent updates `03-task-ledger.md` status to `needs_fix`.
4. Main agent writes `repair-N-brief.md` with:
   - exact failing evidence
   - expected behavior
   - files changed in the previous dev attempt
   - constraints that still apply
5. Send the repair brief back to the same development agent when possible.
6. Send the repair result back to the same verifier when possible.
7. Repeat up to 3 times.
8. If still failing after 3 attempts, mark task `blocked` or `deferred` and
   leave a compact human-readable diagnosis.

Rule of thumb:

- Same developer fixes its own bug because it has the implementation context.
- Same verifier checks the fix because it has the failure context.
- New agents are for new task slices, not for avoidable repair churn.

## Parallelism Rules

Keep concurrency conservative:

- Parallelize read-only mapping/review only when scopes are independent.
- Use at most one write-capable agent at a time.
- Never assign overlapping write sets.
- Do not let child agents spawn more child agents.
- Main agent owns all routing, ledger updates, and final synthesis.

## Context Discipline

The main agent should keep these in conversation:

- current task ID
- risk level
- current status
- next action
- result file paths
- only the smallest evidence snippets needed for decisions

Everything else goes into files.

## Final Response Contract

End with the workspace-required sections:

```markdown
**已确认事实**

**修改内容**

**验证结果**

**剩余风险**

**下一步建议**
```

For implementation tasks, include:

- changed files
- verification commands and results
- unresolved risks
- rollback idea

For read-only tasks, state that no files were modified except intentional
scratch/docs outputs.

## Minimal Invocation Examples

Ordinary implementation:

```text
按项目默认协作流处理，使用 Codex 多智能体长任务模板。目标是 <goal>。
项目路径是 <project-root>。请创建 run directory，按探索、审查、实施、验证推进。
```

Long but read-only investigation:

```text
按 Codex 多智能体长任务模板做只读调查。不要修改代码。目标是 <goal>。
把证据、假设和建议分开，结果写入 run directory。
```

Refactor after approval:

```text
我批准做一个有边界的重构。按 Codex 多智能体长任务模板处理。
重构范围限定为 <scope>，行为必须保持不变，先让 review_guard 审查风险。
```
