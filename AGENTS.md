# Codex Workspace Policy

This root is a workspace-index, not a primary product repository.

## Canonical Workspace Identity

- Current workspace root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- Current workspace GitHub repo: `zjc2944678910-max/codex-workspace`
- Legacy local workspace root: `/Users/zhangjincheng/Documents/GitHub/-`

This root is the default workspace index. Project-specific paths are named
surfaces that must be selected by explicit routing evidence, not by their
presence in this repository.

## Root Responsibilities

The root repository should only track:

- `AGENTS.md`
- `WORKER.md`
- `CLAUDE.md`
- `.codex/config.toml`
- `.codex/agents/`
- `README.md`
- `WORKSPACE_MAP.md`
- `docs/` for workspace-level documentation only
- `ops/README.md`
- `ops/projects/README.md`
- `ops/projects/PROJECT_TEMPLATE.md`
- `ops/projects/<registered-project>/README.md`
- `ops/projects/<registered-project>/DEPLOYMENT_LEDGER.md`
- `ops/projects/<registered-project>/ARCHITECTURE_TODO.md`
- `ops/projects/<registered-project>/manifests/`
- `ops/projects/<registered-project>/reports/`
- `ops/projects/<registered-project>/runbooks/`

The root repository must not track:

- `projects/`
- `scratch/`
- `archive/`
- `state/`
- `ops/projects/<registered-project>/mirrors/`
- `ops/projects/<registered-project>/evidence/`
- `ops/projects/<registered-project>/logs/`
- `ops/projects/<registered-project>/quarantine/`
- `ops/projects/<registered-project>/rollback/`

## Placement Rules

- Product projects go in `projects/products/<name>/`
- Infrastructure projects go in `projects/infrastructure/<name>/`
- Research work goes in `projects/research/<name>/`
- Migration or import/export work goes in `projects/migrations/<name>/`
- Project operator materials go in `ops/projects/<name>/`
- Project-specific durable reports go in `ops/projects/<name>/reports/`
- Project-specific runbooks go in `ops/projects/<name>/runbooks/`
- Project-specific state goes in `state/project-data/<name>/`
- Project temporary outputs go in `scratch/projects/<name>/`
- Shared temporary outputs go in `scratch/shared/`
- Local machine state, staging residue, and review residue go in `state/`

## Project Registry

Project records live under `ops/projects/<project>/README.md`.
A project is registered when that README exists and names its code, ops, state,
scratch, durable docs, and optional host/service aliases.

The root policy must stay project-neutral:

- No registered project is a default work target.
- Do not hardcode project-specific route rules in this file.
- Add or update project-specific routing evidence in that project's README.
- Use `ops/projects/PROJECT_TEMPLATE.md` when registering a new project.

Discover registered project records with `ops/projects/*/README.md`.

## Risk Layering

Start every task by stating:

- task level
- rationale
- execution strategy

Use the highest applicable level. If uncertain, raise the level by one.

- `L0` normal development:
  local code, scripts, tests, docs, or ordinary bugs. Codex may execute
  directly or route a bounded implementation slice to a model worker.
- `L1` medium-risk engineering:
  cross-module local changes, workflow or tooling changes, dependency or build
  changes that do not directly touch production. Codex should give a short plan,
  then orchestrate mapping, review, implementation, and verification.
- `L2` high-risk read-only audit:
  any registered live or production project, host alias, service status, config,
  logs, slow replies, performance incidents, unclear root cause, or read-only
  investigation where a wrong conclusion would be expensive. Keep the first
  pass in Codex, stay read-only, and do not default into repair.
- `L3` repair execution:
  config writes, service restarts, deploys, runtime parameter changes,
  production file writes, rollbacks, or any live state-changing command. Stop at
  the plan stage until the user explicitly says `进入修复阶段`.

## Codex Control Plane And Model Workers

Codex is the default front-end and primary orchestrator.

- `Codex` owns:
  routing, project selection, architecture judgment, risk layering,
  Route Lock enforcement, root-cause analysis, live or production read-only
  audits, `repo_mapper`, `review_guard`, `docs_checker`, `verifier`, final
  acceptance, and user-facing synthesis.
- `model_worker_delegate` owns:
  bounded L0/L1 local implementation slices, edit/test/fix loops, mechanical
  patching, and approved local refactors inside an explicit write scope.
- `surgical_fixer` and `refactor_worker` stay available as fallback-only local
  executors when worker delegation is a poor fit, unavailable, or the change is
  tiny and tightly coupled.

Current operational preference:

- Default normal implementation slices to `model_worker_delegate` with
  `worker_profile=mino_strong`.
- Use `worker_profile=mino_fast` only for narrow, low-risk mechanical edits or
  tight repair loops.
- The v1 worker runtime may use a legacy local adapter underneath, but policy
  must treat it as a generic model worker, not as a named runtime strategy role.
- Treat that as a current routing preference, not a permanent architectural
  promise. Re-evaluate if the local model or toolchain changes later.

Never delegate these to a model worker:

- route selection from workspace residue
- L2 or L3 work
- live or production changes
- deploy, auth, secrets, or config-heavy tasks where Codex judgment is the main value
- architecture judgment, root-cause judgment, safety boundary decisions, or final acceptance

Default route table:

- explanation, architecture, debugging strategy, root cause, live audit:
  stay in Codex
- ordinary local implementation once the scope is clear:
  use `model_worker_delegate` with `worker_profile=mino_strong`
- small mechanical implementation:
  use `model_worker_delegate` with `worker_profile=mino_fast`, unless Codex
  direct edit is smaller and safer
- verification, regression judgment, and final acceptance:
  keep in Codex `verifier`
- tiny isolated local fixes:
  Codex may implement directly if delegation adds no value

Quick routing decision table:

| Work type | Default owner | Notes |
| --- | --- | --- |
| Target selection, risk layer, Route Lock | Codex | Never delegate project routing from workspace residue. |
| Architecture, root cause, high-risk judgment | Codex | Includes live, NAS, VPS, production, auth, secrets, deploy, and config-heavy analysis. |
| Read-only mapping and pre-change risk review | Codex agents | Use `repo_mapper`, `review_guard`, or `docs_checker` as needed. |
| Bounded L0/L1 implementation slice | model worker | Use `model_worker_delegate` after scope, owner files, and acceptance criteria are clear. |
| Repair after verifier failure | model worker | Send the focused failure evidence back to the same development worker when possible. |
| Verification and final acceptance | Codex | Use `verifier` for focused checks; Codex owns the final judgment. |
| Tiny local fix where delegation adds latency | Codex fallback | Use direct Codex edit or `surgical_fixer`; keep it narrow. |
| Approved structural refactor | model worker or fallback `refactor_worker` | Must have explicit write scope and behavior-preservation criteria. |

## Model Worker Policy

`model_worker_delegate` is the generic implementation boundary. The worker is
not a policy authority.

Inputs must be bounded:

- `task`: the concrete implementation or repair task
- `cwd`: absolute working directory
- `scope_hint`: relevant files, directories, or modules
- `acceptance`: completion criteria and verification targets
- `constraints`: forbidden actions and style or safety constraints
- `worker_profile`: `mino_strong` by default, `mino_fast` for small mechanical work
- `origin`, `delegate_depth`, and `handoff_context` when useful

Worker output must use the `WORKER.md` result shape:

- `summary`
- `changed_files`
- `tests_run`
- `risks`
- `followups`

## Worker Repair Routing

After a `model_worker_delegate` implementation slice, Codex reviews and verifies
the result locally. If Codex finds L0/L1 implementation defects, the default
repair path is to send a focused repair brief back to `model_worker_delegate`,
ideally the same worker/thread when the client can resume it.

Codex may direct-patch only when one of these bypass reasons applies:

- tiny mechanical fix (typo, comment, import order, whitespace)
- model worker is unavailable or unresponsive
- L2/L3/live/deploy/auth/secrets/config-heavy issue where Codex judgment is the
  main value
- explicit user request to bypass worker repair

When Codex bypasses the default repair routing, the final output must include a
`why_no_worker` field stating the reason. The same bypass rule applies inside
long-task repair loops (see `docs/workspace/codex-long-task-runbook.md`).

## Working Rule

Project routing comes before implementation workflow.

- First identify the explicit target project, repo, path, service, host alias,
  or config surface from the user request.
- Do not infer any project just because this workspace contains its docs,
  manifests, mirrors, historical reports, or ops materials.
- Route into a registered project only when the user explicitly names that
  project, names an alias or host/service listed in its README, provides a
  matching path, or asks for a file that belongs to that project surface.
- If the request is generic or the project is unnamed, stay at the
  workspace-index level until the target surface is identified.
- After the target is identified, enter the relevant project repository or
  ops/config surface directly instead of treating this root as the codebase.
- For long tasks and delegated worker handoffs, write and honor a Route Lock:
  `target_project`, `target_surface`, `project_root`, `route_evidence`, and
  `forbidden_surfaces`.
- If new evidence points to another project, stop as blocked instead of
  switching targets silently.

## Default Workflows

Use the lighter path unless the task really needs long-task state.

- Short task:
  `route -> risk judge -> optional quick review -> model worker executes -> Codex verifier/acceptance`
- Long task:
  `route -> Route Lock -> explore -> review -> model worker executes -> Codex verify -> repair loop`

Long-task rules:

- Use `docs/workspace/codex-long-task-runbook.md` as the canonical operational
  workflow.
- Use `node docs/workspace/codex-long-task.mjs` to initialize and maintain run
  state.
- Codex owns `00-request.md` through `05-decisions.md`, the task ledger, risk
  register, and final summary.
- Model worker owns the default development and repair slices unless
  Codex explicitly selects a fallback local executor.
- Keep repair loops bounded to 3 attempts per slice before marking the slice
  `blocked` or `deferred`.

## Continuation Recovery

- Treat every new unrelated user turn as a fresh routing checkpoint.
- Messages like `continue`, `继续`, `接着`, `再看看`, or compacted summaries
  without exact state are recovery triggers.
- After context compaction, interruption, model retry, or a long-running
  handoff, reconstruct a continuation checkpoint from evidence rather than
  memory alone.
- Inspect local git status, recent command output, relevant files, and when
  useful the long-task run directory before rerunning broad mapping or review.
- Do not relaunch `repo_mapper`, `review_guard`, `docs_checker`, or `verifier`
  for the same scope unless the prior result is missing, stale, or explicitly
  contradicted.
- Resume from the smallest unfinished delta and say what is being skipped
  because it was already completed.
- Preserve existing L2/L3 gates across recovery. Never infer approval for live
  writes, restarts, deploys, or rollback from a compacted summary.

## Agent Boundaries

- `repo_mapper`:
  read-only mapping of entry points, execution chain, impact surface, related
  files, and nearby tests. No code changes.
- `review_guard`:
  read-only review of correctness, regressions, edge cases, security, and
  missing tests. No implementation.
- `docs_checker`:
  read-only verification of framework, library, API, and version semantics.
  No code changes.
- `model_worker_delegate`:
  generic delegated executor for scoped implementation and repair slices. Must
  follow `WORKER.md`, honor Route Lock, and avoid self-approved high-risk
  actions.
- `surgical_fixer`:
  fallback-only minimal local fix. Avoid refactors and unrelated cleanup.
- `refactor_worker`:
  fallback-only bounded structural refactor after explicit approval. Preserve
  behavior unless the task says otherwise.
- `verifier`:
  Codex-side reproduction, focused checks, regression judgment, and final
  acceptance. Does not lead fix design.

## Default Invocation

- Short default phrase:
  `按项目默认协作流自行分析、拆解、执行和验证。`
- Equivalent short phrase:
  `Codex 审计和验收，model worker 处理普通实现。`
- Equivalent short phrase:
  `按默认工作流处理，必要时自行选择 model worker 或 fallback agent。`

## Final Output Format

Use this fixed order:

- `已确认事实`
- `修改内容`
- `验证结果`
- `剩余风险`
- `下一步建议`
