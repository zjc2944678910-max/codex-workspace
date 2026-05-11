# Codex Workspace Policy

This root is a workspace index, not a primary product repository.

## Workspace Identity

- Workspace root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- GitHub repo: `zjc2944678910-max/codex-workspace`
- Legacy local workspace root: `/Users/zhangjincheng/Documents/GitHub/-`

Project-specific paths are named surfaces. Select them only from explicit
routing evidence, not from historical residue in this repository.

## Root Tracking Policy

Track only workspace-level control files:

- `AGENTS.md`, `WORKER.md`, `CLAUDE.md`
- `.codex/config.toml`, `.codex/agents/`
- `README.md`, `WORKSPACE_MAP.md`
- `docs/` for workspace-level docs
- `ops/README.md`, `ops/projects/README.md`, `ops/projects/PROJECT_TEMPLATE.md`
- `ops/projects/<project>/README.md`
- `ops/projects/<project>/DEPLOYMENT_LEDGER.md`
- `ops/projects/<project>/ARCHITECTURE_TODO.md`
- `ops/projects/<project>/manifests/`
- `ops/projects/<project>/reports/`
- `ops/projects/<project>/runbooks/`

Do not track local code, state, evidence, logs, rollback data, or mirrors:

- `projects/`, `scratch/`, `archive/`, `state/`
- `ops/projects/<project>/mirrors/`, `evidence/`, `logs/`, `quarantine/`, `rollback/`

Placement defaults:

- Product code: `projects/products/<name>/`
- Infrastructure: `projects/infrastructure/<name>/`
- Research: `projects/research/<name>/`
- Migration/import/export: `projects/migrations/<name>/`
- Durable project ops docs: `ops/projects/<name>/`
- Project state: `state/project-data/<name>/`
- Temporary outputs: `scratch/projects/<name>/` or `scratch/shared/`

## Project Routing

Project routing comes before implementation workflow.

- Registered projects live under `ops/projects/<project>/README.md`.
- No registered project is a default work target.
- Keep root policy project-neutral; put project-specific aliases and routing
  facts in that project's README.
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

## Risk Levels

Use the highest applicable risk level. If uncertain, raise the level by one.
For substantive work, state the task level, rationale, and execution strategy
before acting. Simple questions can be answered naturally.

| Level | Meaning | Required behavior |
| --- | --- | --- |
| `L0` | Local docs, scripts, tests, ordinary bugs, tiny fixes | Codex may answer or edit directly; use worker only when it reduces effort. |
| `L1` | Cross-file local edits, workflow/tooling changes, local refactors, dependency/build/CI script changes without production impact | Give a short plan, then map/review/implement/verify as needed. |
| `L2` | High-risk read-only audit: live/production/NAS/VPS/OpenClaw, logs, service status, config, slow replies, unclear root cause, expensive wrong conclusion | Codex keeps first pass read-only. Do not modify, restart, patch, deploy, or default into repair. |
| `L3` | State-changing repair: config writes, service restarts, deploys, runtime changes, production file writes, rollback | Stop at plan stage until the user explicitly says `进入修复阶段`. |

Keep confirmed evidence, hypotheses, and next actions separate. Never present
guesses as facts.

## Codex Control Plane And Model Workers

Codex is the only control plane.

| Work type | Default owner |
| --- | --- |
| Project routing, risk layer, Route Lock | Codex |
| Architecture, root cause, safety, security boundary, live/deploy/auth/secrets/config-heavy judgment | Codex |
| Read-only mapping or pre-change risk review | Codex agents: `repo_mapper`, `review_guard`, `docs_checker` |
| Tiny isolated fix where delegation adds latency | Codex direct edit, or fallback `surgical_fixer` |
| Bounded L0/L1 implementation, multi-file patch, test/fix loop | `model_worker_delegate` with `worker_profile=mino_strong` |
| Small mechanical implementation or tight repair loop | `model_worker_delegate` with `worker_profile=mino_fast` |
| Verification, regression judgment, final acceptance, user synthesis | Codex, optionally `verifier` |

Never delegate these to a model worker:

- project routing from workspace residue
- L2/L3 work
- live or production changes
- deploy, auth, secrets, or config-heavy work
- architecture, root-cause, safety, or final acceptance judgment

The v1 worker runtime may use a legacy adapter underneath, but policy treats it
only as a generic model worker. `CLAUDE.md` is a legacy adapter shim, not a
strategy source.

## Worker Handoff Contract

`model_worker_delegate` is for bounded execution only. Worker instructions live
in `WORKER.md`.

Pass a bounded brief with:

- concrete task
- `cwd`
- owned scope or `scope_hint`
- acceptance criteria
- constraints and forbidden actions
- `worker_profile`: `mino_strong` by default, `mino_fast` for narrow mechanical work

Codex must review worker results before presenting completion.

## Worker Repair Routing

After worker implementation, Codex verifies locally. If Codex finds L0/L1
implementation defects, default repair goes back to `model_worker_delegate`,
ideally the same worker/thread when resumable.

Codex may bypass worker repair only for:

- tiny mechanical fix
- worker unavailable or unresponsive
- L2/L3/live/deploy/auth/secrets/config-heavy issue
- explicit user request to bypass worker repair

When Codex bypasses worker repair, include `why_no_worker` in the final result.
Long-task repair loops follow `docs/workspace/codex-long-task-runbook.md`.

## Long Tasks And Recovery

Use long-task state only when chat memory would become messy.

- Canonical runbook: `docs/workspace/codex-long-task-runbook.md`
- CLI: `node docs/workspace/codex-long-task.mjs`
- Codex owns request/context/plan/ledger/risk/decisions/final summary.
- Worker owns default development and repair slices.
- Keep repair loops to 3 attempts per slice before `blocked` or `deferred`.

Continuation triggers include `continue`, `继续`, `接着`, `再看看`,
context compaction, interruption, retry, and long-running handoff recovery.
Reconstruct state from git status, recent outputs, relevant files, and run
directories. Resume from the smallest unfinished delta and preserve L2/L3 gates.

## Output Rules

- Ordinary questions: answer naturally and briefly.
- L0 tiny edits: summarize change and verification.
- L1 code/workflow changes: include confirmed facts, changes, verification,
  residual risks, and next steps.
- L2/L3, audit, review, and final acceptance: keep structured output and
  separate evidence, hypotheses, risks, and next actions.
