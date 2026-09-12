# Codex Workspace Policy

This root is a workspace index, not a primary product repository.

## Workspace Identity And Routing

- Workspace root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- GitHub repo: `zjc2944678910-max/codex-workspace`
- Legacy local workspace root: `/Users/zhangjincheng/Documents/GitHub/-`

Project-specific paths are named surfaces. Select them only from explicit
routing evidence, not from historical residue in this repository.

Track only workspace-level control files:

- `AGENTS.md`, `WORKER.md`, `CLAUDE.md`
- `.codex/config.toml`, `.codex/hooks.json`, `.codex/agents/`, `.codex/hooks/`
- `README.md`, `WORKSPACE_MAP.md`, `PROJECTS.md`, `MOC.md`, `DAILY.md`
- `docs/` for workspace-level docs
- `ops/README.md`, `ops/projects/README.md`, `ops/projects/PROJECT_TEMPLATE.md`
- `ops/projects/<project>/README.md`
- `ops/projects/<project>/DEPLOYMENT_LEDGER.md`
- `ops/projects/<project>/ARCHITECTURE_TODO.md`
- `ops/projects/<project>/manifests/`
- `ops/projects/<project>/reports/`
- `ops/projects/<project>/runbooks/`

Do not track local code, state, evidence, logs, rollback data, or mirrors:

- `projects/`, `scratch/`, `archive/`, `state/`, `inbox/`, `handoffs/`
- `ops/projects/<project>/mirrors/`, `evidence/`, `logs/`, `quarantine/`, `rollback/`

Placement defaults:

- Product code: `projects/products/<name>/`
- Infrastructure: `projects/infrastructure/<name>/`
- Research: `projects/research/<name>/`
- Migration/import/export: `projects/migrations/<name>/`
- Durable project ops docs: `ops/projects/<name>/`
- Project state: `state/project-data/<name>/`
- Temporary outputs: `scratch/projects/<name>/` or `scratch/shared/`
- Imported raw material: `inbox/`
- Cross-tool handoff summaries: `handoffs/`

Project routing comes before implementation workflow.

- Registered projects live under `ops/projects/<project>/README.md`.
- `docs/workspace/project-registry.json` is the machine-readable routing source
  for scripts and hooks.
- `PROJECTS.md` is the generated short human project index. Regenerate it with
  `node docs/workspace/codex-register-project.mjs --regen`.
- No registered project is a default work target.
- Keep root policy project-neutral. Put project-specific aliases and routing
  facts in the project registry and the matching ops README.
- Route into a project only when the user names the project, a registered alias
  or host/service, a matching path, or a file inside that project surface.
- If the request is generic or unnamed, stay at the workspace-index level.
- After selecting a target, work directly in the project repo or ops/config
  surface instead of treating this root as the codebase.
- For multi-project-sensitive work and worker handoffs, state and honor a Route Lock
  in the task context or brief; no run directory is required:
  `target_project`, `target_surface`, `project_root`, `route_evidence`,
  `forbidden_surfaces`.
- If new evidence points outside the Route Lock, stop as blocked instead of
  switching targets silently.

## Task Risk And Ownership

Personal defaults and the live repair boundary live in `~/.codex/AGENTS.md`.
Classify substantive tasks from the actual target and action; state level,
rationale, and strategy briefly. Ordinary questions can be answered naturally.
Local source/config edits are L0/L1 unless they change a running system. Words
such as timeout, performance, logs, or a product name inside quoted policy do
not by themselves route a task to a live project or open a repair gate.

- L0 tiny and small known-scope L0/L1: Codex works directly with focused checks.
- Local L0/L1: work directly or delegate useful independent slices when this
  improves completion time or quality. Task size alone does not require a helper.
  Do not create work just to use an agent.
- L2: gather and judge evidence read-only. A bounded helper may map,
  review, or verify local evidence; it never performs live operations.
- L3: actual live/service/device changes require the user's explicit
  `进入修复阶段` authorization for the scoped task before execution.

Codex owns routing, architecture/root-cause/safety judgment, secrets, repair
scope, rollback choice, live operations, and final acceptance. Helpers can
supply evidence and recommendations without becoming the decision authority.
Local patch-preparation slices may be delegated after an L3 gate is open;
production writes, deploys, firmware, service operations, databases and
rollbacks remain Codex-only.

## Optional Delegation

The main agent chooses zero or more helpers from useful independent work, up to
the configured subagent limit and the current runtime's available capacity.
The limit excludes the main agent; it is a ceiling, not a target. Reuse helpers
or work in batches when capacity is lower. Do not automatically run a full
mapper/review/worker/verifier chain or wait for unrelated results.

Roles and model defaults live in `.codex/agents/` and `.codex/config.toml`:

- `repo_mapper`, `docs_checker`: bounded code exploration and source lookup.
- `surgical_fixer`, `verifier`: known small repairs and focused verification.
- `worker`, `refactor_worker`: implementation and explicitly scoped refactors.
- `review_guard`: an optional separate correctness and regression review.
- `independent_reviewer`: fresh-context review of unresolved material risks or
  conflicting evidence; not a routine extra pass after another review.

When the runtime exposes a named-role selector, use it. Some V2 clients expose
only task names and model/effort overrides: read the selected role file, pass
its model and effort explicitly, and include its scope and constraints in the
bounded brief. Always supply the runtime's required task name. Do not claim
that a role's sandbox setting is enforced when the client does not expose or
confirm it; disclose the limitation and keep the assigned actions within scope.

Assign non-overlapping file ownership and acceptance criteria before concurrent
writes. Parallel implementation requires settled shared interfaces. Serialize
overlapping files, unsettled interfaces and dependent changes; the main agent
honors the same ownership. Coordinate test artifacts and shared build resources.
When a slice exceeds a helper's scope, return evidence for the main agent to
reassign or handle directly instead of repeatedly trying the same approach.
Only the main agent may dispatch helpers. Helpers must not spawn descendants
or use extra processes to bypass capacity limits.

- Send a concise task brief and relevant evidence instead of the full history.
- See [WORKER.md](WORKER.md) for the handoff format.
- For a specifically useful external second opinion, read
  [advisor guidance](docs/workspace/advisor-review.md). Claude is read-only.
  If unavailable, Codex continues; do not use Sub2API or another relay pool.

## Impact And Verification

Analyze impact before changing shared interfaces, route handlers, or performing
cross-module refactors. Use source callers, contracts, focused tests, and a
fresh GitNexus index when available. Local changes with known callers do not
require graph calls. Tool availability must not replace engineering judgment.

For indexed work, prefer focused `query`, `context`, `impact` or `api_impact`
when they resolve an uncertainty. Treat graph links as candidate impact, not
proof that a caller will break. Investigate HIGH/CRITICAL results against the
actual diff; report material risk before proceeding. Check dynamic references
and compatibility paths in source. Before commit, review the scoped diff and
use `detect_changes` when the index is relevant and usable.

Missing/stale GitNexus: disclose the limitation and use source search/tests.
Never rebuild an index during a read-only or Plan-mode task. Authorized local
index maintenance uses `node docs/workspace/gitnexus-refresh.mjs`; this wrapper
preserves existing embeddings and skips generated AGENTS.md. Do not infer that
a stale warning authorizes maintenance. Review all rename previews, including
graph edits, preserve unrelated dirty changes, and apply only in an authorized
implementation phase with scoped rollback evidence.

Run checks that prove requested behavior. Do not require a fixed test count or
repeat broad suites without a changed risk. Passing code tests, deployment,
service health, and real device/user acceptance are distinct evidence layers.
Do not claim an unverified layer is complete. See
[daily workflow](docs/workspace/daily-workflow.md) for routine commands.

## Durable Work And Closeout

Use conversation plans and progress updates by default. Multiple stages,
turn boundaries, helpers and test failures do not require run directories,
bookkeeping or checkpoints. When interruption recovery needs a durable note,
keep it brief; no fixed file layout or per-turn update cadence is required.

The legacy long-task CLI is opt-in: use it only when the user explicitly asks
for that workflow. Its [manual runbook](docs/workspace/codex-long-task-runbook.md)
describes the existing commands. Do not auto-initialize runs or inject active-run
reminders. In Plan/read-only work, retain planning context in the conversation.

When the user continues a specific old task, read its relevant continuation and
failure records. Preserve historical evidence, states and retry counts; do not
automatically update them or re-enable the old workflow merely because a run
exists. Never silently switch targets.

Prefer compact evidence pointers. Report outcome, meaningful verification, and
remaining limitations; separate facts from hypotheses. Mention delegation only
when it changes ownership or status. Keep models and context settings in config,
not duplicated prose. Budget guidance: [token budget](docs/workspace/token-budget.md).
