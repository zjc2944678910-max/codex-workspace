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

Default multi-model workflow:

1. Tiny L0 tasks stay in Codex: simple answers, command output, obvious local
   facts, one-file small edits, and small known-scope fixes.
2. Small known-scope L0/L1 implementation may stay in Codex when the files,
   tests, and acceptance criteria are explicit and no risky surface is involved.
3. Non-tiny local implementation uses bounded workers or subagents when useful:
   Codex maps the scope, assigns a concrete owned slice, reviews returned
   changes, and verifies locally before acceptance.
   Prefer the local Claude Code worker path for strong implementation slices
   when it is available; its strong default is `claude-opus-4-8` with the
   highest supported CLI effort, `max`.
4. Sub2API is a proactive read-only advisor for non-tiny planning, architecture,
   implementation advice, patch drafts, code review, research, writing, UX, and
   creative polish. It may suggest code, but Codex or a bounded local worker
   applies changes.
5. Claude review is a proactive read-only second-opinion reviewer for subtle
   evidence, architecture or root-cause judgment, L2 read-only audit conclusions,
   shared contracts, security-sensitive surfaces, user-facing behavior,
   hard-to-roll-back changes, and important pre-merge reviews.
6. Codex owns the final synthesis every time: reconcile model disagreements,
   verify claims against local or live evidence, run focused tests when useful,
   and report residual risk.

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

Claude review is a proactive read-only review partner, not an implementation
worker. Codex may call `claude_review_delegate` without asking when an
independent second opinion would materially reduce risk: subtle evidence
interpretation, architecture or root-cause judgment, live/NAS/VPS/OpenClaw
read-only audit conclusions, shared-contract changes, security-sensitive
surfaces, user-facing behavior, hard-to-roll-back changes, or important
pre-merge reviews. Keep reviews bounded by explicit `source_of_truth`, scope,
constraints, and forbidden actions. Codex still gathers local/live evidence,
verifies any returned claims, owns final acceptance, and writes the user-facing
synthesis.

Do not use Claude review for routine explanations, tiny local facts, normal
implementation, bug fixes, test-writing loops, low-value convenience
cross-checks, or the initial evidence-gathering pass of a live/NAS/VPS/OpenClaw
investigation. For L2/L3 surfaces, Claude review remains read-only only; it does
not authorize config writes, restarts, deploys, database writes, deletes, or
production file changes.

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

## Sub2API External Model Pool

The user's Sub2API gateway is a trusted external model pool for advisory
reasoning, drafting, review, and model comparison. Because its MCP tools may be
deferred, Codex must explicitly discover them before relying on this policy.

Run `tool_search` for `sub2api_model_pool` or `sub2api` early when any of these
are true:

- The user mentions Sub2API, `sub2api`, `中转站`, model pool, external models,
  big models, Gemini, Claude, Opus, Sonnet, Antigravity, or asks why Codex is
  or is not using them.
- The task is non-tiny and involves architecture, root cause, code review,
  implementation advice, test design, complex planning, research, writing,
  frontend/creative polish, or high-value second opinion.
- Codex is about to make a user-facing artifact where an independent planning,
  review, or polish pass would materially improve quality.

If the tools are available, use `sub2api_delegate_task` or `sub2api_chat` as a
bounded read-only advisor. Prefer the configured defaults, which currently route
all task types to `claude-opus-4-6-thinking` because the Gemini/Antigravity
Gemini lanes have recently failed smoke tests with upstream account/location
errors. Use Gemini only by explicit model override or after a fresh smoke test
confirms that route is healthy again. Codex still owns local evidence gathering,
shell commands, file edits, verification, safety judgment, and final synthesis.

Keep the small-task fast path: do not call Sub2API for obvious local facts,
simple command output, tiny typo fixes, or one-file known-scope edits unless the
user explicitly asks to use the model pool. Never send credentials, tokens,
cookies, raw private configs, or large unbounded logs to Sub2API. For
live/NAS/VPS/OpenClaw/Sub2API operations, keep L2 read-only and L3 repair gates:
external models may review bounded non-secret evidence, but they do not approve
or execute config writes, restarts, deploys, database writes, or production file
changes.

If discovery fails or the model pool is unavailable, continue locally when safe
and mention the skipped Sub2API step in the final response for non-tiny tasks.

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **codex-workspace** (2335 symbols, 3266 relationships, 66 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/codex-workspace/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/codex-workspace/context` | Codebase overview, check index freshness |
| `gitnexus://repo/codex-workspace/clusters` | All functional areas |
| `gitnexus://repo/codex-workspace/processes` | All execution flows |
| `gitnexus://repo/codex-workspace/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
