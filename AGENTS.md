# Codex Workspace Policy

This root is a workspace-index, not a primary product repository.

## Canonical Project Paths

- Current workspace root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- Current workspace GitHub repo: `zjc2944678910-max/codex-workspace`
- Legacy local workspace root: `/Users/zhangjincheng/Documents/GitHub/-`
- Current OpenClaw mainline: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- OpenClaw migration reference: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/migrations/openclaw-mac-migration`
- OpenClaw sidecar state: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/openclaw`
- OpenClaw operator docs and mirrors: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/openclaw`
- Current live OpenClaw SSH alias for audits/repairs: `oc-nas`

These are named reference surfaces, not default work targets.

## Root Responsibilities

The root repository should only track:

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/`
- `README.md`
- `WORKSPACE_MAP.md`
- `docs/`
- `ops/README.md`
- `ops/projects/README.md`
- `ops/projects/openclaw/README.md`
- `ops/projects/openclaw/DEPLOYMENT_LEDGER.md`
- `ops/projects/openclaw/ARCHITECTURE_TODO.md`
- `ops/projects/openclaw/manifests/`

The root repository must not track:

- `projects/`
- `scratch/`
- `archive/`
- `state/`
- `ops/projects/openclaw/mirrors/`
- `ops/projects/openclaw/evidence/`
- `ops/projects/openclaw/logs/`
- `ops/projects/openclaw/quarantine/`
- `ops/projects/openclaw/rollback/`

## Placement Rules

- Product projects go in `projects/products/<name>/`
- Infrastructure projects go in `projects/infrastructure/<name>/`
- Research work goes in `projects/research/<name>/`
- Migration or import/export work goes in `projects/migrations/<name>/`
- Project operator materials go in `ops/projects/<name>/`
- Project-specific state goes in `state/project-data/<name>/`
- Project temporary outputs go in `scratch/projects/<name>/`
- Shared temporary outputs go in `scratch/shared/`
- Local machine state, staging residue, and review residue go in `state/`

## Working Rule

Project routing comes before implementation workflow.

- First identify the explicit target project, repo, path, service, host alias, or config surface from the user request.
- Do not infer `OpenClaw` just because this workspace contains many `OpenClaw` docs, manifests, mirrors, or ops materials.
- Route into `OpenClaw` only when the user explicitly mentions `OpenClaw` or `open claw`, mentions `oc-nas`, provides a matching path or service name, or asks for a file that belongs to that surface.
- If the request is generic or the project is unnamed, stay at the workspace-index level until the target surface is identified.
- After the target is identified, enter the relevant project repository or ops/config surface directly instead of treating this root as the codebase.

## Codex Subagent Workflow

- Default workflow: `探索 -> 审查 -> 实施 -> 验证`
- Treat an ordinary task request as permission for Codex to analyze, split, execute, and verify on its own.
- Do not wait for the user to describe the agent split unless the ambiguity is material and risky.
- Treat every new unrelated user turn as a fresh routing checkpoint.
- Re-evaluate whether subagents would help on every turn, including follow-ups in the same thread.
- Do not anchor to the previous turn's routing decision if the task becomes broader, deeper, or enters a new stage.
- Messages like `continue`、`继续`、`再看看` or scope expansions require a continuation check first, then a routing judgment only for the unfinished delta.
- Codex should choose and invoke the needed subagents proactively. The user does not need to name agents.
- Only skip subagents for tiny, isolated, low-risk tasks.
- Non-trivial tasks should start with `repo_mapper`.
- If the route is unclear, default to `repo_mapper` first instead of asking the user which agent to use.
- For complex, long, or multi-threaded tasks, Codex may create temporary fit-for-purpose subagents beyond the standard set.
- Prefer the standard agents first. Create temporary specialists only when the standard roles do not fit cleanly.
- Every temporary specialist must have one explicit role, a narrow scope, and a clear stop condition.
- Do not let temporary write-capable specialists overlap on the same files or responsibility.
- Temporary read-only specialists may run in parallel when they reduce uncertainty materially.
- Before any code change, run `review_guard`.
- If framework, library, API, or version semantics are unclear, run `docs_checker` first.
- Default to `surgical_fixer` and the smallest defensible change.
- Use `refactor_worker` only with explicit refactor approval. Preserve behavior unless the task says otherwise.
- After changes, use `verifier` to reproduce or run the smallest useful tests.
- Keep concurrency conservative: at most one write-capable agent at a time. Parallelize only independent read-only work.
- Separate confirmed facts, hypotheses, and recommendations.

## Compaction And Continuation Recovery

- After context compaction, interruption, model retry, or a long-running background-agent handoff, do not restart the task from the beginning.
- First reconstruct a compact continuation checkpoint from the available thread state: user goal, confirmed facts, completed stages, active or completed agents, files already inspected or changed, blockers, and the next single action.
- If prior state is incomplete, inspect local git status, recent terminal output, and relevant files before rerunning broad mapping or review.
- Do not relaunch `repo_mapper`, `review_guard`, `docs_checker`, or `verifier` for the same scope unless their prior result is missing, stale, or explicitly contradicted.
- Resume from the smallest unfinished delta and state what is being skipped because it was already completed.
- Before any risky or live-changing continuation, preserve the existing L2/L3 gate rules.

## Agent Boundaries

- `repo_mapper`: read-only mapping of entry points, execution chain, impact surface, related files, and nearby tests. No code changes.
- `review_guard`: read-only review of correctness, regressions, edge cases, security, and missing tests. No implementation.
- `docs_checker`: read-only verification of framework, library, API, and version semantics. No code changes.
- `surgical_fixer`: minimal fix only. Avoid refactors and unrelated cleanup.
- `refactor_worker`: bounded structural refactor only when approved. Preserve behavior by default.
- `verifier`: reproduction and validation only. Do not lead fix design.

## Temporary Specialists

- Use a temporary specialist only for a clearly bounded gap that the standard agents do not cover well.
- Good examples: log triage, schema tracing, build break isolation, migration diff review, test gap mapping.
- A temporary specialist should usually be read-only unless one bounded write task clearly benefits from isolation.
- A temporary specialist must not silently expand into broad refactoring or cross-cutting edits.

## Default Invocation

- Short default phrase: `按项目默认协作流自行分析、拆解、执行和验证。`
- Equivalent short phrase: `你自己分析并选择合适子 agent 处理。`
- Equivalent short phrase: `按默认工作流处理，必要时自行创建临时 specialist。`

## Final Output Format

Use this fixed order:

- `已确认事实`
- `修改内容`
- `验证结果`
- `剩余风险`
- `下一步建议`
