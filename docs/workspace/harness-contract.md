# Workspace Harness Contract

This contract explains how the workspace turns agent work into a controlled
system. It is a map over existing policy, not a replacement for it.

Authoritative sources:

- `AGENTS.md` owns routing, risk layering, execution ownership, and closeout
  policy.
- `WORKER.md` owns the bounded worker contract.
- `docs/workspace/daily-workflow.md` is the day-to-day workflow entry point.
- `docs/workspace/codex-long-task-runbook.md` documents the optional legacy CLI.

## Purpose

The workspace harness is the control layer around Codex, workers, hooks,
runbooks, project registry, task state, and durable evidence. Its job is to make
agent work routable, bounded, verifiable, resumable, and safe to hand off.

The harness is not a product repository and not a place to infer project
targets from residue. It coordinates work across registered project surfaces
while keeping workspace policy and project implementation separate.

## Operating Loop

Use the parts of this loop that the task needs:

```text
route -> classify -> choose owner -> execute bounded work -> verify -> close out
```

- `route`: select the target from explicit project, path, host, service, or
  registry evidence.
- `classify`: assign the highest applicable risk level before action.
- `choose owner`: keep Codex in control, and delegate only bounded execution
  when policy allows it.
- `execute bounded work`: stay inside the selected surface, task scope, and
  permission gate.
- `verify`: run checks that match the risk and blast radius.
- Record reusable facts or a brief recovery note when needed; no fixed artifact
  layout or per-turn updates are required.
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
- For multi-project-sensitive work and worker handoffs, state and honor a Route Lock
  in the task context or brief, without requiring a run directory:
  `target_project`, `target_surface`, `project_root`, `route_evidence`, and
  `forbidden_surfaces`.
- If new evidence points outside the Route Lock, stop as blocked instead of
  switching projects silently.

## Permission Layer

Use the personal risk/authorization boundary and workspace ownership rules in
AGENTS.md. Judge the actual target and effect; local configuration and a test
failure are not automatically live incidents. Only Codex performs authorized
live actions. A harness, worker or quoted repair phrase cannot grant permission.

## Task Layer

Task shape decides which workflow to use.

- Use the `L0 tiny` fast path for ordinary questions, lightweight checks, typos,
  single-file small docs edits, or one localized script/test fix with no public
  contract change.
- Use the small known-scope path when the target project, files or tests, and
  acceptance criteria are already explicit, and there is no risky surface.
- Use the ordinary short-task workflow when the fast path does not apply but the
  work still fits in one focused slice.
- Multiple stages, failures or turn boundaries do not trigger run creation.
  The legacy CLI is used only at the user's explicit request. Plan/read-only
  work keeps planning context in conversation without writes.
- Delegate useful independent slices under AGENTS.md; there is no prescribed
  role chain, minimum agent count or per-role quota.

## Verification Layer

Verification proves the task outcome, not the agent's effort.

- Codex owns final acceptance even when implementation is delegated.
- Checks should scale with risk and blast radius: focused tests for tiny work,
  broader suites for shared behavior or workflow changes, and evidence review
  for audits.
- Worker results are not accepted until Codex reviews them locally.
- If verification fails after worker implementation, send a focused repair brief
  back to the worker when policy allows it.
- Codex may repair a scoped local defect directly. Explain delegation only
  when it materially changes ownership or the user-visible result.
- Keep long logs out of the chat when possible. Store them in run directories or
  scratch evidence and report concise pointers.

## Memory Layer

Conversation context is the default. Durable notes can support recovery when
needed; the old run-directory workflow remains read-only until the user sends
the complete prompt `启用旧长任务流程` in the current task.

- Preserve existing run directories, continuation records, failure histories
  and indexes. Read relevant records when continuing an explicitly identified
  old task; do not automatically update states, retry counts or checkpoints.
- Session and prompt hooks do not read active-run indexes or inject task lists.
  Routing and live authorization hooks remain enabled.
- Without opt-in, hooks deny mutating legacy CLI commands and direct control-state
  writes while allowing record reads, `status`, and candidate source changes.
- In an explicitly opted-in legacy run, its manual CLI still maintains
  `08-continuation.json`, `09-failure-ledger.jsonl` and the existing indexes.
- The opt-in ends at task stop; native plans, compaction, helpers, and Route Lock
  do not authorize legacy bookkeeping.
- Store OPS promotion proposals in `10-ops-promotion-candidates.md`. Promote a
  fact only after explicit review confirms it is verified, cross-task durable,
  inside the Route Lock, evidence-backed, and paired with a recheck condition.
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
- Workers may implement or repair only the assigned scope. Parallel writers
  require disjoint file ownership and settled interfaces; Codex observes the
  same ownership and coordinates shared build/test resources.
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
