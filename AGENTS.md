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

The overall task keeps the highest applicable risk level, but delegation is
scoped per work slice. An L2/L3 label does not block a bounded Luna sidecar from
read-only mapping, local review, or non-production verification. After the L3
gate opens, one bounded local patch-preparation slice may also be delegated.
Codex alone performs live or external state changes and owns every safety,
rollback, and final-acceptance decision.

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

## Codex And Advisors

Codex is the control plane.

| Work type | Default owner |
| --- | --- |
| Project routing, risk layer, Route Lock | Codex |
| Architecture, root cause, safety, security boundary, live/deploy/auth/secrets/config-heavy judgment | Codex |
| Read-only mapping or pre-change risk review when the surface or contracts are unclear | Codex agents: `repo_mapper`, `review_guard`, `docs_checker` |
| `L0 tiny` question, check, or isolated fix | Codex direct |
| Small known-scope L0/L1 implementation with explicit files/tests and no risky surface | Codex direct |
| Non-tiny L0/L1 implementation, repair, or test loop | Codex automatically delegates one bounded slice to the appropriate Luna agent, then reviews and accepts the result |
| Bounded L2/L3 read-only mapping, local review, or non-production verification | Luna sidecar under a Codex-owned route and evidence boundary |
| L3 local patch preparation after the repair gate opens | Codex or one bounded Luna worker; Codex reviews every change |
| Live deploy, device write, restart, runtime mutation, or rollback | Codex only |
| Verification, regression judgment, final acceptance, user synthesis | Codex, optionally `verifier` |

Default non-tiny local-task path:

```text
Codex route/judge -> Luna handles a safe bounded slice -> Codex reviews -> Codex performs any gated live step -> focused verification -> Codex accepts
```

Default multi-model workflow:

1. Tiny L0 tasks stay in Codex: simple answers, command output, obvious local
   facts, one-file small edits, and small known-scope fixes.
2. Small known-scope L0/L1 implementation stays in Codex when the files, tests,
   and acceptance criteria are explicit and no risky surface is involved.
3. For every non-tiny local L0/L1 task, Codex automatically spawns one
   appropriate project Luna agent for a bounded mapping, implementation,
   review, or verification slice. The user does not need to request delegation.
   Codex waits for the result, checks the diff and evidence, and owns final
   acceptance. Prefer `repo_mapper`, `docs_checker`, `surgical_fixer`,
   `refactor_worker`, `review_guard`, or `verifier` according to the task.
4. For non-tiny L2/L3 work, Codex may delegate an independent read-only mapping,
   local review, or non-production verification slice without weakening the
   overall risk level. This is the default when the work is expected to exceed
   ten minutes, crosses two or more modules, or has two or more independent
   verification surfaces. After the L3 repair gate opens, one bounded local
   patch-preparation slice may be delegated with a disjoint write scope. Luna
   never performs the live or external state-changing step.
5. For a difficult local problem, Claude Code CLI with `claude-opus-5` may
   identify likely causes, edge cases, or recommended checks, but remains a
   bounded read-only advisor.
6. Claude review is a proactive read-only second-opinion path for subtle
   evidence, architecture or root-cause judgment, L2 read-only audit conclusions,
   shared contracts, security-sensitive surfaces, user-facing behavior,
   hard-to-roll-back changes, and important pre-merge reviews.
7. Codex owns the final synthesis every time: reconcile Luna results and any
   advice with local or live evidence, perform authorized repairs, run focused
   tests, and report residual risk.

Keep the work entirely in Codex when the task is `L0 tiny`, small known-scope
L0/L1, the main value is architecture, root-cause, safety, or final judgment,
or no safe independent slice exists. For L2/L3 work, Codex remains the control
plane and exclusive live-state executor, while safe read-only and local
non-production slices may use Luna. Auth, secrets, project routing, and
config-heavy judgment remain in Codex.

Agent budget:

- L0 tiny and small known-scope L1 default to zero agents.
- Non-tiny local L0/L1 defaults to one Luna helper agent. The instruction in
  this file is the standing request and authorization to spawn that agent
  automatically; the user does not need to repeat it in each task.
- Non-tiny L2/L3 defaults to one bounded read-only Luna sidecar when mapping,
  review, or local verification can proceed independently. After the L3 gate,
  at most one Luna worker may prepare a bounded local patch for Codex review.
- Ordinary L1 should use at most one helper agent unless two or more risk
  signals are present: unknown call chain, cross-module contract, API route,
  security/auth/secret boundary, flaky or failing verification, broad refactor,
  or repeated repair.
- At most two read-only Luna agents may run in parallel. Run at most one
  workspace-writing Luna agent at a time to avoid edit conflicts.
- Complex L1 and L2 read-only workflows may use mapper, Opus 5 review, and
  verifier passes when independent review materially reduces risk. Only
  exceptionally difficult reviews upgrade to Fable 5. Codex still performs
  repair.

Never delegate these outside Codex:

- project routing from workspace residue
- architecture, root-cause, safety, or final acceptance judgment
- L3 repair authorization, rollback choice, or live verification judgment
- live or production writes, deploys, device or firmware writes, service
  restarts, runtime parameter changes, database writes, or rollbacks
- auth, credential, secret handling, or config-heavy safety judgment

Do not add user-facing commentary solely to explain that Luna was not used.
Mention delegation when it materially changes current ownership, status, risk,
or what the user should expect next.

`WORKER.md` and `CLAUDE.md` remain legacy execution contracts, not the default
strategy. Do not treat Claude Code as an implementation worker.

## Claude Code Opus 5 / Fable 5 Advisor

Sub2API and other relay model pools are unavailable as advisors. Do not
discover, call, smoke-test, or fall back to them.

Use Claude Code CLI only when a bounded independent pass is worth the cost:

- difficult bug or root-cause diagnosis after Codex has gathered evidence
- architecture, shared-contract, security, or regression review
- important pre-merge or user-facing quality review
- bounded L2 evidence synthesis where an independent opinion lowers risk

The default model is `claude-opus-5`; use `review_tier=standard`. Reserve
`claude-fable-5` with `review_tier=extreme` for exceptionally difficult
root-cause, architecture, security, or hard-regression reviews. Use the highest
supported CLI effort, `max`. Prefer `claude_review_delegate` when its evidence
boundary fits. Preserve the user's configured Claude Code relay or
`claude-desktop-3p` provider environment; do not replace it with first-party
Anthropic auth. For direct CLI review, allow only the minimum read-only tools
(`Read`, `Grep`, and `Glob`) and use no tools for provided-evidence packets.

Claude returns findings, hypotheses, risks, and recommendations only. It must
not edit files, run state-changing commands, commit, deploy, restart services,
write databases, or perform repair. Codex verifies the advice, applies any
authorized fixes, runs tests, and owns final acceptance.

Keep every review bounded by explicit `source_of_truth`, scope, constraints,
acceptance criteria, and forbidden actions. Never send credentials, tokens,
cookies, private configs, complete secret-bearing environments, databases, or
unbounded logs.

For L2/L3 surfaces, Claude remains read-only and cannot open the repair gate.
A standalone `claude auth status` result is not authoritative for a
host-authenticated `claude-desktop-3p` session. Test the intended route with one
bounded no-tools call using the selected tier. If Codex cannot inherit the
desktop host credentials or that call fails once, continue with Codex alone and
report the unavailable advisory bridge. Do not fall back to Sub2API.

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

Codex reviews any helper or advisor result before presenting completion.
For L0/L1 implementation defects, Codex performs the repair and focused
verification. When diagnosis is genuinely difficult, Codex may send a bounded
read-only evidence packet to Claude Code Opus 5 for hypotheses or review,
upgrading to Fable 5 only when the review is exceptionally difficult, then
decides and applies the fix locally.

Long-task state is mandatory before the first boundary when any of these apply:

- the task is expected to need two or more implementation slices;
- the first cross-agent handoff is about to occur;
- the first verification failure needs a repair;
- the task is known to continue beyond the current turn.

Use `node docs/workspace/codex-long-task.mjs init` before that boundary. Write a
`checkpoint` after every slice result, verification failure, handoff, and before
ending a turn. Resume from `08-continuation.json`, `09-failure-ledger.jsonl`,
and the project long-task index instead of reconstructing state from chat.

- Canonical runbook: `docs/workspace/codex-long-task-runbook.md`
- CLI: `node docs/workspace/codex-long-task.mjs`
- A failure chain gets 3 repair attempts in epoch one. `reopen` may create one
  successor epoch only with a new evidence fact backed by a new in-route file,
  a new hypothesis, and a new approach.
- A second set of 3 failed repairs sets `needs_user_decision`; do not append or
  continue the same slice until the user sets a new target.
- Running failures, raw logs, and temporary state remain in the run. Only
  verified, cross-task-stable, in-route facts with evidence and a recheck
  condition may become `ops-candidate` entries; `finalize` never edits OPS.

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

This project is indexed by GitNexus as **codex-workspace** (2806 symbols, 3884 relationships, 67 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `node docs/workspace/gitnexus-refresh.mjs` from this workspace root.

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
node docs/workspace/gitnexus-refresh.mjs
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
node docs/workspace/gitnexus-refresh.mjs
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.agents/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.agents/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.agents/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.agents/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.agents/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.agents/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
