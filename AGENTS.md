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
- `README.md`, `WORKSPACE_MAP.md`, `PROJECTS.md`, `DAILY.md`
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

## Risk Levels

Use the highest applicable risk level. If uncertain, raise the level by one.
For substantive work, state the task level, rationale, and execution strategy
before acting. Simple questions can be answered naturally.

| Level | Meaning | Required behavior |
| --- | --- | --- |
| `L0` | Local docs, scripts, tests, ordinary bugs, tiny fixes | Codex may answer or edit directly; use worker only when it reduces effort. |
| `L1` | Cross-file local edits, workflow/tooling changes, local refactors, dependency/build/CI script changes without production impact | Give a short plan, then map, review, implement, and verify as needed. |
| `L2` | High-risk read-only audit: live/production/NAS/VPS/OpenClaw, logs, service status, config, slow replies, unclear root cause, expensive wrong conclusion | Codex keeps first pass read-only. Do not modify, restart, patch, deploy, or default into repair. |
| `L3` | State-changing repair: config writes, service restarts, deploys, runtime changes, production file writes, rollback | Stop at the plan stage until the user explicitly says `进入修复阶段`. |

`L0 tiny` is the fast path for ordinary questions, lightweight state checks,
typos, single-file small docs edits, or one localized script/test fix with no
public contract change. For `L0 tiny`, Codex may answer or patch directly,
compress the level/rationale/strategy into one short line, and skip Route Lock,
GitNexus, model workers, and workspace health checks unless the task evidence
requires them.

Use a small known-scope path when the target project, files or tests, and
acceptance criteria are already explicit, and there is no API route, deploy,
auth, secret, live, production, or cross-module uncertainty. In that case Codex
may implement directly, run focused verification, and skip mapper/worker/verifier
handoffs unless new evidence raises the risk.

Escalate out of `L0 tiny` when the work touches multiple modules, shared core
logic, API routes, dependency/build/CI behavior, unclear project routing, or any
live/production/deploy/auth/secrets/config-heavy surface. The `L0 tiny` fast
path never overrides `L2` read-only or `L3` repair gates.

Keep confirmed evidence, hypotheses, and next actions separate. Never present
guesses as facts.

Default reasoning should stay light enough for daily work. Reserve `xhigh` for
L2 audits, architecture judgment, complex root-cause analysis, production
audits, hard regressions, or cases where failed reasoning is more expensive than
extra tokens.

Use Codex config profiles to avoid carrying one high-cost default into every
task:

- `fast`: ordinary questions, tiny edits, known-scope local fixes.
- `standard`: default local development and focused workflow work.
- `audit`: L2, architecture, complex root cause, production audits, hard
  regressions, or other expensive wrong-answer cases.

## Codex And Workers

Codex is the control plane.

| Work type | Default owner |
| --- | --- |
| Project routing, risk layer, Route Lock | Codex |
| Architecture, root cause, safety, security boundary, live/deploy/auth/secrets/config-heavy judgment | Codex |
| Read-only mapping or pre-change risk review when the surface or contracts are unclear | Codex agents: `repo_mapper`, `review_guard`, `docs_checker` |
| `L0 tiny` question, check, or isolated fix | Codex direct |
| Small known-scope L0/L1 implementation with explicit files/tests and no risky surface | Codex direct |
| Bounded non-tiny L0/L1 implementation with unknown call chain, cross-module risk, or likely repair loop | `model_worker_delegate` with `worker_profile=mino_strong` |
| Small mechanical implementation or tight repair loop | `model_worker_delegate` with `worker_profile=mino_fast` |
| Verification, regression judgment, final acceptance, user synthesis | Codex, optionally `verifier` |

Default short-task path:

```text
Codex route/judge -> choose the lightest safe path -> implement or delegate -> focused verification -> Codex accepts
```

Keep the work in Codex when the task is `L0 tiny`, small known-scope L0/L1, the
main value is diagnosis or judgment, or the request is L2/L3, live, deploy,
auth, secrets, or config heavy. Use mapper/review/worker/verifier only when an
unknown call chain, cross-module change, unclear contract, likely repair loop,
or messy handoff state makes the extra tokens worth it.

Agent budget:

- L0 and small known-scope L1 default to zero agents.
- Ordinary L1 should use at most one helper agent unless two or more risk
  signals are present: unknown call chain, cross-module contract, API route,
  security/auth/secret boundary, flaky or failing verification, broad refactor,
  or repeated repair.
- The full mapper -> review -> worker -> verifier chain is reserved for complex
  L1 and L2 read-only audit workflows where independent passes materially reduce
  risk.

Never delegate these to a model worker:

- project routing from workspace residue
- L2/L3 work
- live or production changes
- deploy, auth, secrets, or config-heavy work
- architecture, root-cause, safety, or final acceptance judgment

The v1 worker runtime may use a legacy adapter underneath, but policy treats it
only as a generic model worker. `CLAUDE.md` is a runtime shim, not a strategy
source.

## Worker Repair Loop

`model_worker_delegate` is for bounded execution only. Worker instructions live
in `WORKER.md`.

Pass a bounded brief with:

- concrete task
- `cwd`
- owned scope or `scope_hint`
- acceptance criteria
- constraints and forbidden actions
- `worker_profile`: `mino_strong` by default, `mino_fast` for narrow mechanical work
- compact output requirements: summary, changed files, tests run, risks, and
  followups plus evidence pointers only; no long source excerpts, full diffs, or
  large logs

## Token Budget

- Prefer file pointers over pasted context: path, line number, conclusion,
  evidence summary, and next action.
- Keep command output bounded. Default to targeted paths and line/range limits;
  summarize large test logs to the first failing block plus the final summary.
- Store durable evidence, decisions, verification results, and long logs in run
  directories or project ops docs; keep the conversation to pointers and
  decisions.
- Reuse confirmed decisions from `docs/decisions/workspace-decisions.md`,
  long-task `05-decisions.md`, or the project ops README before re-exploring.
  Recheck only when there is drift evidence.
- For indexed projects, prefer GitNexus `query`, `context`, `impact`, or
  `api_impact` before broad `rg`/file-reading sweeps.

Codex must review worker results before presenting completion.

After worker implementation, Codex verifies locally. If Codex finds L0/L1
implementation defects, default repair goes back to `model_worker_delegate`,
ideally the same worker or thread when resumable.

Codex may bypass worker repair only for:

- tiny mechanical fix
- worker unavailable or unresponsive
- L2/L3/live/deploy/auth/secrets/config-heavy issue
- explicit user request to bypass worker repair

When Codex bypasses worker repair, include `why_no_worker` in the final result.

Use long-task state only when chat memory would become messy.

- Canonical runbook: `docs/workspace/codex-long-task-runbook.md`
- CLI: `node docs/workspace/codex-long-task.mjs`
- Keep repair loops to 3 attempts per slice before `blocked` or `deferred`.
- Reconstruct continuation state from git status, recent outputs, relevant
  files, and run directories after interruption or compaction.

## Output And Closeout

- Ordinary questions: answer naturally and briefly.
- L0 tiny tasks: keep the closeout short; summarize the direct answer or edit
  and any focused verification.
- L1 code or workflow changes: include confirmed facts, changes, verification,
  residual risks, and next steps.
- L2/L3, audit, review, and final acceptance: keep structured output and
  separate evidence, hypotheses, risks, and next actions.

When useful, end with a compact status:

- completed
- confirmed
- unconfirmed
- risks
- next steps
