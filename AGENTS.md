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
- For long tasks and worker handoffs, write and honor a Route Lock:
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
- Non-tiny local L0/L1: automatically delegate one bounded independent slice to
  Luna, then review its result. This is the standing user request for delegation.
  Skip delegation when no useful independent slice exists or the task's value
  is entirely Codex-owned judgment. Do not create work just to use an agent.
- L2: gather and judge evidence read-only. A bounded Luna sidecar may map,
  review, or verify local evidence; it never performs live operations.
- L3: actual live/service/device changes require the user's explicit
  `进入修复阶段` authorization for the scoped task before execution.

Codex owns routing, architecture/root-cause/safety judgment, secrets, repair
scope, rollback choice, live operations, and final acceptance. Helpers can
supply evidence and recommendations without becoming the decision authority.
One bounded local patch-preparation slice may be delegated after an L3 gate is
open; production writes, deploys, firmware, service operations, databases and
rollbacks remain Codex-only.

## Luna And Optional Advisors

Use one useful mapping, implementation, review, or verification slice for
non-tiny local work. Ordinary L1 uses at most one helper; at most two read-only
helpers may overlap when independent risks justify it. Run only one writing
helper at a time and give it explicit ownership and acceptance criteria.
Do not automatically run a mapper/review/worker/verifier chain.

- `repo_mapper`, `docs_checker`: Luna with medium reasoning.
- `surgical_fixer`, `refactor_worker`, `review_guard`, `verifier`: Luna with xhigh.
- Small tasks and slices without an independent contribution remain local.
- See [WORKER.md](WORKER.md) for the handoff format.
- Only when a difficult review warrants a second opinion, read
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

Initialize a long-task run before multiple expected implementation slices,
a task known to span turns, or a verification failure requiring tracked repair.
A short independent review alone does not require a run. In Plan/read-only mode,
keep the plan and handoff context in conversation; do not initialize or checkpoint
files merely to satisfy workflow. For eligible execution tasks use
[the long-task runbook](docs/workspace/codex-long-task-runbook.md).

Once a run exists, checkpoint slice results, failures, handoffs, and before
ending a turn. Resume from `08-continuation.json` and `09-failure-ledger.jsonl`;
preserve existing retry budgets and active tasks. Record Route Lock before
handoffs (in the brief for short tasks). Never silently switch targets.

Prefer compact evidence pointers. Report outcome, meaningful verification, and
remaining limitations; separate facts from hypotheses. Mention delegation only
when it changes ownership or status. Keep models and context settings in config,
not duplicated prose. Budget guidance: [token budget](docs/workspace/token-budget.md).
