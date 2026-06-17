# Workspace Harness Contract

This contract explains how the workspace turns agent work into a controlled
system. It is a map over existing policy, not a replacement for it.

Authoritative sources:

- `AGENTS.md` owns routing, risk layering, execution ownership, and closeout
  policy.
- `WORKER.md` owns the bounded worker contract.
- `docs/workspace/daily-workflow.md` is the day-to-day workflow entry point.
- `docs/workspace/codex-long-task-runbook.md` is the canonical long-task
  operating runbook.

## Purpose

The workspace harness is the control layer around Codex, workers, hooks,
runbooks, project registry, task state, and durable evidence. Its job is to make
agent work routable, bounded, verifiable, resumable, and safe to hand off.

The harness is not a product repository and not a place to infer project
targets from residue. It coordinates work across registered project surfaces
while keeping workspace policy and project implementation separate.

## Operating Loop

Every substantive task should move through this loop:

```text
route -> classify -> choose owner -> execute bounded work -> verify -> record durable facts -> close out
```

- `route`: select the target from explicit project, path, host, service, or
  registry evidence.
- `classify`: assign the highest applicable risk level before action.
- `choose owner`: keep Codex in control, and delegate only bounded execution
  when policy allows it.
- `execute bounded work`: stay inside the selected surface, task scope, and
  permission gate.
- `verify`: run checks that match the risk and blast radius.
- `record durable facts`: put reusable evidence and decisions in the right
  workspace or project record.
- `close out`: report confirmed facts, verification, residual risks, and next
  steps at the level the task deserves.

## Routing Layer

Routing decides where work is allowed to happen.

- Start at the workspace-index level for generic or unnamed requests.
- Route into a project only from explicit evidence: a named project, registered
  alias, path, host, service, or file inside a project surface.
- Use `docs/workspace/project-registry.json` as the machine-readable source for
  routing metadata.
- Use `ops/projects/<project>/README.md` as the human-facing route record.
- Use `PROJECTS.md` as the short human project index and
  `docs/workspace/project-surfaces.md` as the richer surface summary.
- For long tasks and worker handoffs, write and honor a Route Lock:
  `target_project`, `target_surface`, `project_root`, `route_evidence`, and
  `forbidden_surfaces`.
- If new evidence points outside the Route Lock, stop as blocked instead of
  switching projects silently.

## Permission Layer

Permissions decide what actions are allowed after routing.

- `L0`: local docs, scripts, tests, tiny fixes, and ordinary bugs. Codex may
  execute directly and verify with focused checks.
- `L1`: cross-file local edits, workflow/tooling changes, local refactors, and
  dependency, build, or CI changes without production impact. Plan briefly,
  implement or delegate within scope, verify, and report risks.
- `L2`: high-risk read-only audits for live, production, NAS, VPS, OpenClaw,
  logs, service status, config, slow replies, unclear root cause, or expensive
  wrong conclusions. Gather and judge evidence locally. Do not modify, restart,
  patch, deploy, or repair by default.
- `L3`: state-changing repair, including config writes, service restarts,
  deploys, runtime changes, production file writes, rollback, or any live-state
  change. Stop at the plan until the user explicitly says `进入修复阶段`.

Live, deploy, auth, secrets, rollback, service restart, and production
state-changing work must never be delegated to a model worker. If a task crosses
one of those boundaries, Codex keeps routing, safety judgment, and final
acceptance.

## Task Layer

Task shape decides which workflow to use.

- Use the `L0 tiny` fast path for ordinary questions, lightweight checks, typos,
  single-file small docs edits, or one localized script/test fix with no public
  contract change.
- Use the small known-scope path when the target project, files or tests, and
  acceptance criteria are already explicit, and there is no risky surface.
- Use the ordinary short-task workflow when the fast path does not apply but the
  work still fits in one focused slice.
- Escalate to long-task run directories when work spans multiple slices, needs
  handoff state, has repeated repair, or risks losing durable context.
- Use the full mapper -> review -> worker -> verifier chain only when
  independent passes materially reduce risk.

## Verification Layer

Verification proves the task outcome, not the agent's effort.

- Codex owns final acceptance even when implementation is delegated.
- Checks should scale with risk and blast radius: focused tests for tiny work,
  broader suites for shared behavior or workflow changes, and evidence review
  for audits.
- Worker results are not accepted until Codex reviews them locally.
- If verification fails after worker implementation, send a focused repair brief
  back to the worker when policy allows it.
- If Codex bypasses expected worker repair, the closeout must include
  `why_no_worker`.
- Keep long logs out of the chat when possible. Store them in run directories or
  scratch evidence and report concise pointers.

## Memory Layer

Memory keeps work resumable and prevents the chat from becoming the system of
record.

- Put long-task state in the run directory created by
  `docs/workspace/codex-long-task.mjs`.
- Store reusable decisions in `05-decisions.md` for long tasks.
- Store stable project routing, commands, and architecture facts in the matching
  `ops/projects/<project>/README.md`.
- Store cleanup, audit, or hygiene evidence in project reports, manifests, or
  run directories as appropriate.
- Keep temporary outputs under `scratch/` or approved project state paths, not
  as tracked workspace source.
- Reuse durable facts before re-exploring, and recheck only when there is drift
  evidence.

## Worker Layer

Workers execute bounded slices. They do not own the harness.

- Codex owns routing, risk classification, architecture judgment, safety,
  verification judgment, and final user synthesis.
- Workers may implement or repair only the assigned scope.
- Workers must honor Route Lock, inherited risk gates, approved write scope, and
  `WORKER.md`.
- Workers must return compact results: summary, changed files, tests run,
  evidence pointers, risks, and followups.
- Workers must stop as blocked if the task requires forbidden work or points
  outside the Route Lock.
- Workers must not broaden scope, refactor opportunistically, clean unrelated
  files, delegate again, or make final acceptance judgments.

## Using This Contract

Before starting a task, check:

1. Is the target routed from explicit evidence?
2. Is the highest applicable risk level stated?
3. Is the owner clear: Codex direct, bounded worker, verifier, or read-only
   audit?
4. Is the allowed write surface clear, or is the task read-only?
5. Is the verification plan proportional to risk?
6. Is durable state needed outside the chat?
7. Does the closeout need confirmed facts, evidence, risks, rollback idea, or
   next steps?

If a future agent cannot answer these questions from the task context and
workspace records, it should pause and gather evidence before acting.
