# Personal AI Companion Architecture Decisions

Date: 2026-07-04
Status: initial project memory
Source: conversation planning notes; no raw private chat logs were read or stored.

## Decision Summary

Create a separate product project, `personal-ai-companion`, for the user's
StackChan/iOS/NAS personal AI companion. The project should not drift into the
existing OpenClaw/benben live infrastructure or Sub2API ops surfaces unless the
user explicitly asks about those systems.

The first useful build is not model fine-tuning or firmware hacking. The first
useful build is a local relay plus memory-service that can speak OpenAI-style
chat APIs, route models, and manage long-term memory safely.

## Product Shape

Target components:

- StackChan/CoreS3 class desktop robot as an embodied voice/display front end.
- User-owned relay server as the control plane.
- Gemini and Claude routes through the user's gateway for cloud inference.
- Optional NAS local model for private/offline/lightweight tasks.
- iOS app for chat, voice, HealthKit summaries, reminders/calendar, AlarmKit,
  and Shortcuts/App Intents where supported.
- Long-term memory with review, provenance, privacy gates, and deletion.
- Optional style profile from uploaded chat logs only when consent is recorded.

## Feasibility Decisions

Confirmed feasible:

- StackChan can be used as a Wi-Fi/BLE AI terminal, with firmware adaptation if
  the seller firmware cannot configure a custom OpenAI-compatible base URL.
- A server relay can expose `/v1/chat` and route to Gemini, Claude, and later
  NAS local models.
- NAS local models are useful for privacy/offline summarization and fallback,
  not as the primary high-quality emotional dialogue engine.
- Long-term memory should be implemented as a service, not by hoping the model
  "learns" invisibly.
- iOS can integrate through permission-scoped APIs such as HealthKit, EventKit,
  AlarmKit, Shortcuts, and App Intents.

Hard limits:

- iOS cannot read arbitrary phone data, WeChat, QQ, other app notifications, or
  all system information.
- Chat logs should be imported manually by the user, cleaned, and scoped.
- Girlfriend-style modeling requires explicit consent and should be presented
  as a consented style/profile, not as the real person.

## OpenClaw/benben Reference Boundary

Borrow these ideas from benben vNext:

- `MessageEnvelope`, adapted here as `InteractionEnvelope`.
- `IdentityKernel` for structural speaker/viewer/assistant binding.
- `PrivacyKernel` for scoped memory disclosure.
- Memory V4-style canonical atoms as the long-term truth surface.
- Session deltas for short-term continuity.
- Candidate memories, review queues, promotion logs, conflicts, and source
  spans for auditable memory writes.
- Memory admin actions that are planned, confirmed, and audited.
- Tool-gated side effects.

Do not borrow these:

- Old broad execution permissions.
- V2/V3/projection/transcript/raw archive as answer truth.
- Feishu production webhook/service layout.
- OpenClaw live service state, secrets, or personal memory facts.
- Any automatic assumption that old benben facts apply to this project.

## Memory-Service Target Design

The core flow:

```text
StackChan/iOS/Web/import event
-> InteractionEnvelope
-> IdentityKernel
-> PrivacyKernel
-> Memory write pipeline
-> session_deltas + candidate_atoms + review_items
-> owner review / safe promotion
-> memory_atoms
-> scoped recall
-> Prompt Memory Pack
-> Gemini/Claude/NAS route
```

Core tables:

- `entities`
- `entity_aliases`
- `devices`
- `relations`
- `conversation_sessions`
- `conversation_messages`
- `session_deltas`
- `candidate_atoms`
- `memory_atoms`
- `review_items`
- `source_spans`
- `consent_records`
- `style_profiles`
- `memory_audit_logs`
- `health_snapshots`
- `tool_requests`
- `model_usage_logs`

Important privacy classes:

- `owner_private`
- `partner_private`
- `couple_shared`
- `health_private`
- `group_safe_shared`
- `style_training`
- `never_quote`

StackChan-specific rule: speaker delivery is more public than iOS private chat.
Do not read sensitive health, intimate, or style-training facts aloud unless the
current delivery mode and consent explicitly allow it.

## MVP Scope

Phase 1:

- Register the project and preserve this architecture record.
- Build local relay skeleton and `/v1/chat` route.
- Build `InteractionEnvelope`, `IdentityKernel`, and `PrivacyKernel`.
- Build memory tables and `/v1/memory/ingest`, `/v1/memory/recall`.
- Use Gemini Flash as default and Claude for complex reasoning through the
  server-side router.

Phase 2:

- Add STT/TTS and StackChan integration.
- Add basic Memory Admin UI/API: search, explain, approve, reject, delete.
- Add model usage ledger.

Phase 3:

- Add iOS companion app with chat, HealthKit summaries, EventKit reminders,
  AlarmKit where available, and Shortcuts/App Intents.
- Add NAS local model route for private/offline summaries.

Phase 4:

- Add chat-log import pipeline with consent records, cleaning, candidate
  extraction, and style profile generation.
- Consider LoRA/fine-tuning only after RAG/style-prompt quality is understood.

## Non-Goals For The First Build

- Do not train or fine-tune a girlfriend-style model first.
- Do not modify StackChan firmware until the server relay contract is stable.
- Do not deploy to NAS or production before local routes and privacy gates pass.
- Do not import raw chat logs directly into prompts as long-term truth.
- Do not create a live service that can perform side effects without owner
  confirmation.

## Acceptance Anchors

The first MVP is acceptable when:

- A local client can send a chat turn to the relay and get a model response.
- The same turn produces a stored conversation message and optional session
  delta.
- Memory recall returns only facts allowed by the envelope scope.
- StackChan delivery mode blocks sensitive facts by default.
- The owner can inspect and delete a promoted memory.
- Usage logging identifies provider/model/session/device without exposing
  secrets or private raw prompts.
