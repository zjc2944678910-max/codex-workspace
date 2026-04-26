# openclaw-benben Implementation Plan

Date: 2026-04-26
Status: draft after Phase 0 read-only inventory

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

## Open Questions Before Phase 5

- Exact vNext package location in the repo.
- Whether to use TypeScript or stay with MJS for fastest integration.
- Whether the new service should use a new gateway port or a profile-derived port.
- Whether to keep old control UI origin list or reduce it.
- Whether to copy old local-lite/ollama routes in Phase 1 or defer them.
- Whether to import existing Memory V4 DB as-is or rebuild a reviewed vNext DB from approved atoms.
