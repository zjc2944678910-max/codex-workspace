# openclaw-benben Implementation Plan

Date: 2026-04-26
Status: updated 2026-04-27 after local vNext core checkpoint

## Goal

Create a new `openclaw-benben` instance that replaces the current patched benben runtime only after feature parity, Memory V4 correctness, identity separation, privacy boundaries, and real Feishu conversation testing pass.

This is not a blind clone of old OpenClaw. The old instance is an evidence source and rollback anchor.

## Hard Boundaries

- Do not rebuild `adminAI` in Phase 1.
- Do not enable Telegram production delivery until Phase 2.
- Do not run two active production Feishu webhook consumers for the same benben bot.
- Do not print or commit secrets.
- Do not use V2/V3/projection/transcript/raw archive as answer truth.
- Do not copy old broad execution permissions into vNext.
- Do not stop or delete the old instance until vNext passes acceptance and a rollback path is tested.

## Phase 1: Local Core Skeleton

Deliverables:

- `MessageEnvelope` module.
- `IdentityKernel` with owner, partner, assistant, group, and unknown-person entities.
- `PrivacyKernel` with owner/private/partner/couple/group/project scopes.
- `MemoryKernel` wrapper around V4 canonical recall and Session Delta.
- `UsageLedger` schema and append-only writer.
- `ToolGate` policy module.
- Unit tests for identity, pronouns, memory scope, privacy, usage, and tool gates.

Acceptance:

- Owner/partner/assistant are never inferred from pronouns alone when channel identity is available.
- Group memory disclosure is blocked or summarized safely.
- Memory V4 answer path exposes `legacy_fallback_used=false`.
- Tool side effects require owner confirmation.

Status 2026-04-27:

- Completed locally in product repo commit `3164adc2fd834b311691be0ef51af03ff3fbeec2`.
- Latest local checkpoint with synthetic shadow-preflight suite:
  `d9018318d75b41f64b39355ed17735ec6971fb0a`.
- Latest local checkpoint with dry-run persona kernel:
  `7a8811368e89843213410963f1baa2e9e3a64e77`.
- Latest local checkpoint with ordinary-message dry-run answer planner:
  `d9a8a8d924f33e3ed1e908a4ce8c70a0f6767c5d`.
- Latest local checkpoint with sanitized model-prompt planner:
  `facaeeb1ae4a8a258809ead7968c231a57fd53e2`.
- Latest local checkpoint with dry-run response composer:
  `b2a0fa46c579db2cf7de81d5cf33d65b8f8e29d4`.
- Latest local checkpoint with dry-run model execution planner:
  `625b29da0954d4d6c5a901fbf0954ea72e4611b3`.
- Latest local checkpoint with dry-run tool execution planner:
  `6915cb64fb3708c248210753e60bfa0ac8ce40b8`.
- Code location: `workspace/tools/openclaw-benben/`.
- Test location: `workspace/tools/tests/openclaw-benben/`.
- Implementation uses plain MJS and `node:test`; no new framework was introduced.
- Scope includes message envelope, identity kernel, privacy kernel, Memory V4 wrapper,
  usage ledger, tool gate, Feishu dry-run adapter, command router, memory command
  planner, persona kernel, ordinary-message answer planner, sanitized
  model-prompt planner, model execution planner, response composer, tool execution
  planner, turn runner, dry-run CLI, and README.

## Phase 2: Feishu Runtime And Commands

Deliverables:

- Feishu adapter using the new envelope.
- `/new` and `/reset`.
- `/status`.
- `/usage`.
- model switch commands.
- `/memory search/show/edit/delete/approve/reject/explain`.
- Trace writer for every delivered turn.

Acceptance:

- Owner DM answers identity correctly.
- Partner DM binds to partner correctly.
- Ordinary group does not leak private facts.
- `/new` preserves approved short-term continuity.
- `/status` and `/usage` return without touching secret values.

Status 2026-04-27:

- Partially completed as local dry-run runtime only.
- Feishu adapter is dry-run only: no production ingress and no send.
- `/new`, `/reset`, `/status`, `/usage`, model switches, and `/memory` planner are
  implemented as plans only.
- `/memory edit/delete/approve/reject` require owner confirmation and do not commit.
- Trace/report surfaces are sanitized and keep confirmation metadata without raw
  memory payload.
- Synthetic dry-run suite covers owner DM, partner DM, project group, memory
  mutation confirmation, ordinary-message answer planning, and unknown sender
  denial without Feishu ingress.
- Persona identity replies for `你是谁` are implemented locally as dry-run plans
  without model calls or memory recall.
- Ordinary non-command messages now produce a structured answer plan first. The
  plan selects audience, answer style, default `anyone/gpt-5.4` route, and
  Memory V4 recall policy while keeping model calls disabled and delivery off.
- The model-prompt planner emits a prompt contract and sanitized metadata only:
  no raw prompt is materialized, no model call is enabled, and raw user text or
  Memory V4 answer text is not written to trace/report.
- The model execution planner emits a provider/request contract only: provider,
  model, timeout, fallback, idempotency, and usage estimate metadata are planned
  while provider request materialization and network calls stay disabled.
- The response composer emits a delivery contract and sanitized metadata only:
  candidate reply text is hashed/length-counted, response caps and sanitizer
  policies are recorded, and dry-run `safe_to_send` remains false.
- The tool execution planner gates proposed actions through `ToolGate` but never
  executes them. Raw action args are not persisted; commands and target paths are
  recorded only as hashes plus coarse risk-shape metadata.
- Memory recall for ordinary messages is still opt-in in local dry-run and is
  blocked for unknown direct senders and ordinary groups.
- Real Feishu tests are not started; enabling any Feishu test ingress remains L3.

## Phase 3: Web Console And Operator UX

Deliverables:

- Web console MVP.
- Memory admin UI for owner.
- Usage dashboard.
- Scheduled job dashboard.
- Trace viewer.
- File manager with confirmation gates.

Acceptance:

- Owner can inspect and correct memory.
- Owner can see why an answer did or did not use memory.
- File actions that mutate state require explicit confirmation.

## Phase 4: Automation And Tools

Deliverables:

- Heartbeat runner.
- One-shot reminders.
- Recurring jobs.
- Auto summaries.
- Long-term planning surfaces.
- NAS file and local execution tools under `ToolGate`.

Acceptance:

- Reminder creation works.
- Heartbeat can run without spamming.
- Auto summaries create reviewable candidates, not unreviewed durable facts.
- Shell/service/config changes remain L3-gated.

## Phase 5: NAS Shadow Deployment

This phase becomes L3 once executed on NAS.

Deliverables:

- NAS user/service layout for `openclaw-benben`.
- Separate state root: `/var/lib/openclaw-benben/.openclaw`.
- Separate env root: `/etc/openclaw-benben`.
- Separate service: `openclaw-benben.service`.
- Redacted secret migration from old sources.
- Shadow service running without production Feishu ingress.
- Rollback snapshot.

Acceptance:

- Old `openclaw-gateway.service` remains untouched and active unless a cutover gate says otherwise.
- New service can start on a separate port.
- New service can run dry-run/CLI-delivered Feishu tests without owning the production webhook.
- No secret values appear in logs or reports.

Status 2026-04-27:

- Initial NAS shadow bootstrap was completed earlier and recorded in
  `openclaw-benben-shadow-bootstrap-20260426.json`.
- NAS shadow is synced through the earlier dry-run suite checkpoint, not through
  the persona, answer-plan, prompt-plan, model-execution, response-composer, or
  tool-execution local checkpoints.
- Any sync to `/var/lib/openclaw-benben/.openclaw/workspace` remains L3 and needs
  explicit `进入修复阶段` authorization.

## Phase 6: Production Feishu Cutover

This phase is L3 and requires repair gate checklist plus final preflight.

Deliverables:

- Old production Feishu ingress parked.
- New `openclaw-benben` Feishu ingress active.
- Only approved services restarted.
- Full real Feishu acceptance report.
- Rollback verified.

Acceptance:

- 20+ visible owner DM turns.
- Partner DM identity and privacy test.
- Ordinary group privacy test.
- `/new` continuity test.
- Long-term memory recall test for owner, partner, relationship, preferences, exams, gifts, and communication rules.
- `/status` and `/usage` test.
- Trace confirms no V2/V3 fallback and no raw archive truth surface.

## Phase 7: Telegram Phase 2

Deliverables:

- Telegram bot token migration.
- Telegram adapter using the same message envelope.
- Telegram DM/group privacy tests.

Acceptance:

- Telegram uses the same identity, privacy, memory, usage, and tool-gate infrastructure.
- Telegram does not create a separate memory truth chain.

## First Engineering Task

Implement the local core skeleton first, not the NAS service first.

Recommended first files:

- `packages/openclaw-benben/src/envelope.ts`
- `packages/openclaw-benben/src/identity.ts`
- `packages/openclaw-benben/src/privacy.ts`
- `packages/openclaw-benben/src/memory.ts`
- `packages/openclaw-benben/src/usage-ledger.ts`
- `packages/openclaw-benben/src/tool-gate.ts`
- `packages/openclaw-benben/tests/identity.test.ts`
- `packages/openclaw-benben/tests/privacy.test.ts`
- `packages/openclaw-benben/tests/memory.test.ts`

If the existing repo remains plain JS/MJS, use the equivalent `.mjs` layout instead of TypeScript.

Actual 2026-04-27 code layout:

- `workspace/tools/openclaw-benben/message-envelope.mjs`
- `workspace/tools/openclaw-benben/identity-kernel.mjs`
- `workspace/tools/openclaw-benben/privacy-kernel.mjs`
- `workspace/tools/openclaw-benben/memory-v4-wrapper.mjs`
- `workspace/tools/openclaw-benben/usage-ledger.mjs`
- `workspace/tools/openclaw-benben/tool-gate.mjs`
- `workspace/tools/openclaw-benben/tool-execution-kernel.mjs`
- `workspace/tools/openclaw-benben/feishu-adapter.mjs`
- `workspace/tools/openclaw-benben/command-router.mjs`
- `workspace/tools/openclaw-benben/memory-command-router.mjs`
- `workspace/tools/openclaw-benben/turn-runner.mjs`
- `workspace/tools/openclaw-benben/persona-kernel.mjs`
- `workspace/tools/openclaw-benben/answer-plan-kernel.mjs`
- `workspace/tools/openclaw-benben/model-prompt-kernel.mjs`
- `workspace/tools/openclaw-benben/model-executor-kernel.mjs`
- `workspace/tools/openclaw-benben/response-composer-kernel.mjs`
- `workspace/tools/openclaw-benben/dry-run-cli.mjs`
- `workspace/tools/openclaw-benben/dry-run-suite.mjs`
- `workspace/tools/openclaw-benben/index.mjs`
- `workspace/tools/openclaw-benben/fixtures/*.json`
- `workspace/tools/tests/openclaw-benben/*.test.mjs`

## Open Questions Before Phase 5

- Whether to keep `workspace/tools/openclaw-benben/` as the long-term package
  location or later promote it to a package boundary.
- Whether the new service should use a new gateway port or a profile-derived port.
- Whether to keep old control UI origin list or reduce it.
- Whether to copy old local-lite/ollama routes in Phase 1 or defer them.
- Whether to import existing Memory V4 DB as-is or rebuild a reviewed vNext DB from approved atoms.
