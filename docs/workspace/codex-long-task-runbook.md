# Codex Long Task Runbook

This is the manual for the optional legacy run-directory workflow. Use it only
when the user explicitly requests that workflow. Ordinary tasks use conversation
plans and progress, with brief recovery notes when needed. AGENTS.md owns policy.

## When To Use

Multiple implementation slices, helpers, test failures and turn boundaries do
not opt a task into this workflow. Do not initialize or checkpoint automatically.
Plan/read-only tasks retain planning context in the conversation.

When the user continues a specific old task, read the relevant records without
automatically updating them or restarting this workflow. Preserve old states,
retry budgets and evidence. The commands below remain compatible for explicit
manual use.

Do not use this to bypass L2/L3 gates. Choose the target project from explicit
user evidence first; do not default `--project` to any registered project.

## Before Explicit Opt-In

Before creating the run, confirm the route and risk level. Live, NAS, OpenClaw,
deploy, auth, secrets, and config-heavy work still follows `AGENTS.md`; a run
directory never opens L3 repair by itself.

## Initialize

Preferred entrypoint:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project sample-product \
  --project-root /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/sample-product \
  --slug feature-flag-sync \
  --task "Implement feature flag sync"
```

Shared run:

```bash
node docs/workspace/codex-long-task.mjs init \
  --shared \
  --slug agent-template-research \
  --task "Research and summarize agent template options"
```

Dry run:

```bash
node docs/workspace/codex-long-task.mjs init \
  --project sample-product \
  --slug demo \
  --task "Demo long task" \
  --dry-run \
  --json
```

The init command creates:

- state docs: `00-request.md` through `07-agent-registry.md`
- compact continuation: `08-continuation.json`
- append-only failure history: `09-failure-ledger.jsonl`
- run-local OPS proposals: `10-ops-promotion-candidates.md`
- first handoff briefs: `agents/T01/mapper-brief.md`,
  `agents/T02/review-brief.md`
- reusable templates: `brief-templates/dev-brief.md`,
  `verify-brief.md`, `repair-brief.md`

Project runs are registered below the project's registry `state_data` path.
Shared runs use
`state/project-data/workspace/codex-long-tasks/index.json`. The index keeps
active state and failure-chain identity across runs so creating a new run does
not reset the retry budget.

Before any handoff, fill the Route Lock in `01-confirmed-context.md`:
`target_project`, `target_surface`, `project_root`, `route_evidence`,
`forbidden_surfaces`.

## First Fill-In Pass

Update:

- `00-request.md`: exact goal and user constraints
- `01-confirmed-context.md`: risk level, Route Lock, confirmed facts, hypotheses
- `02-plan.md`: strategy and implementation slices
- `03-task-ledger.md`: task IDs and statuses
- `04-risk-register.md`: risks, rollback idea, open questions
- `05-decisions.md`: decisions future agents must honor

## Main Loop

1. Use the lightest safe path for each slice.
2. Map with `repo_mapper` only when entry points, contracts, or impact surface
   are unclear.
3. Review with `review_guard` only when correctness, regression, security,
   rollback, or missing-test risk needs a separate pass; use `docs_checker` only
   for unclear API, framework, or version semantics.
4. Implement directly or delegate useful independent slices under AGENTS.md.
   Generated role placeholders are not a mandatory chain.
5. Verify locally for known-scope slices; use `verifier` when reproduction,
   regression confidence, or independent validation is worth the extra context.
6. For explicitly requested manual state updates, keep the ledger and evidence
   consistent with the CLI protocol.
7. Use `checkpoint` when requested as part of this opted-in workflow; no
   per-slice or per-turn checkpoint cadence applies to ordinary tasks.

All agent briefs should request compact results: conclusion, changed files,
commands run, key outcomes, evidence pointers, risks, and followups only. Keep
long logs and source excerpts in files when they are needed as evidence.

Agent choice and concurrency follow AGENTS.md. Do not automatically execute the
full mapper/review/worker/verifier chain; choose passes for independent evidence.

Decision reuse:

- Record confirmed routes, entry points, commands, contracts, and stable
  architecture facts in `05-decisions.md`.
- Reuse those facts before re-exploring; recheck only when a related file
  changed, an index is stale, a command fails, or new evidence contradicts the
  ledger.

Append a ready development/verification pair:

```bash
node docs/workspace/codex-long-task.mjs append \
  --run-root <run-root> \
  --scope "Implement feature flag sync" \
  --owned "src/feature-flags.ts" \
  --owned "tests/feature-flags.test.ts" \
  --acceptance "feature flag changes are persisted" \
  --acceptance "focused tests pass"
```

This creates `agents/Txx/dev-brief.md`, `agents/Tyy/verify-brief.md`, and
appends both ledger rows. The legacy `model_worker_delegate` label is retained
for compatibility; when delegation is useful, map it to the available `worker`
role under current AGENTS.md. Codex may also implement a scoped local change
directly. Unused mapper/review placeholders do not block implementation.

## Checkpoint And Resume

Record the compact continuation:

```bash
node docs/workspace/codex-long-task.mjs checkpoint \
  --run-root <run-root> \
  --phase verification \
  --active-slice T03 \
  --next-action "Run the focused verifier" \
  --evidence-file <run-root>/agents/T03/dev-result.md
```

Inspect or resume:

```bash
node docs/workspace/codex-long-task.mjs status --run-root <run-root>
node docs/workspace/codex-long-task.mjs resume --project sample-product
node docs/workspace/codex-long-task.mjs resume --run-root <run-root>
```

`resume --project` auto-selects only when exactly one active run exists. With
multiple active runs, pass `--run-root`. Corrupt state, an unfinished
transaction, or Route Lock drift returns an explicit conflict rather than
guessing. Old markdown-only runs can be inspected without modification; the
first later write lazily creates the new state files.

The OpenAI compact-response reference defines the compacted response output,
but does not document a guarantee that a local custom hook fires at compaction.
For explicitly continued old tasks, read their relevant recorded state. Session
and prompt hooks no longer inject active-run reminders.
See the [OpenAI compact response reference](https://developers.openai.com/api/reference/java/resources/responses/methods/compact).

## Repair Loop

Default loop:

```text
Codex verifier/review finding -> scoped repair (Codex or helper) -> recheck
```

Verifier failure results must include stable fields. Timestamps, log ordering,
case-only changes, and whitespace must not change their identity:

```text
failure_signature: <stable normalized failure identity>
failed_acceptance: <exact failed acceptance criterion>
```

If verification fails:

1. Generate a focused repair brief with the exact failing evidence.
2. Assign the repair to the same helper when useful, or let Codex repair
   a scoped local defect directly.
3. Send the repair result back to the same verifier when resumable.
4. Stop after exactly 3 failed repair attempts in epoch one and mark the run
   `blocked`.

Generate a repair brief:

```bash
node docs/workspace/codex-long-task.mjs repair \
  --run-root <run-root> \
  --verify-result <run-root>/agents/T04/verify-result.md \
  --expected "focused tests pass" \
  --hypothesis "the persisted write is skipped" \
  --approach "repair the persistence boundary"
```

Codex owns the repair and verification decision under AGENTS.md. No ceremonial
worker-bypass field is required. Preserve the existing failure budget.

Recheck after worker repair:

```bash
node docs/workspace/codex-long-task.mjs recheck \
  --run-root <run-root> \
  --repair-result <run-root>/agents/T03/repair-1-result.md
```

Close the slice:

```bash
node docs/workspace/codex-long-task.mjs close \
  --run-root <run-root> \
  --result <run-root>/agents/T04/recheck-1-result.md
```

`--max-repairs` remains parseable for old callers but only accepts `3`.
`--repair-number` must equal the next sequential attempt. Reusing the same
failure, hypothesis, approach, owned paths, or unchanged owned-file state is
rejected.

After the first three failures, epoch two can open only with all of: a new
normalized fact, a new evidence file inside the Route Lock whose content is
new, a new hypothesis, and a new approach:

```bash
node docs/workspace/codex-long-task.mjs reopen \
  --run-root <run-root> \
  --evidence-fact "the write races with shutdown" \
  --evidence-file <run-root>/evidence/new-race-proof.txt \
  --hypothesis "shutdown cancels the final write" \
  --approach "serialize shutdown after persistence"
```

Epoch two also has exactly 3 attempts. If all fail, the run becomes
`needs_user_decision`; the same slice cannot append or repair until the user
sets a new target.

## Ledger Statuses

Use:

- `pending`
- `mapping`
- `mapped`
- `reviewing`
- `ready`
- `implementing`
- `needs_fix`
- `verifying`
- `verified`
- `blocked`
- `deferred`
- `done`

## OPS Candidates And Finalize

OPS promotion has four gates: verified, useful across tasks, owned by the
current Route Lock project, and backed by evidence plus a recheck condition.
Running failures, raw logs, and temporary state never qualify.

```bash
node docs/workspace/codex-long-task.mjs ops-candidate \
  --run-root <run-root> \
  --type runbook \
  --target ops/projects/sample-product/runbooks/persistence.md \
  --fact "shutdown waits for the final persistence write" \
  --evidence-file <run-root>/agents/T04/recheck-1-result.md \
  --verified-at 2026-08-27T12:00:00+08:00 \
  --durability-basis "the invariant is enforced by the shared shutdown path" \
  --recheck-condition "recheck after shutdown or persistence changes" \
  --residual-risk "platform-specific cancellation remains untested"

node docs/workspace/codex-long-task.mjs finalize --run-root <run-root>
```

Allowed targets are the project README, reports, runbooks, architecture docs,
or deployment ledger. Both commands only update the run-local
`10-ops-promotion-candidates.md` and final summary. Codex must review a
candidate before explicitly editing OPS.

At the end, keep `06-final-summary.md` focused on outcome, changed files,
verification, residual risks, and next steps. Keep detailed logs in the run
directory, not the parent conversation.
