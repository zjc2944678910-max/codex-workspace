# Personal AI Companion Architecture Decisions

Date: 2026-07-04; amended 2026-07-15
Status: initial project memory with current direction amendment
Source: conversation planning notes; no raw private chat logs were read or stored.

## Decision Summary

Create a separate product project, `personal-ai-companion`, for the user's
StackChan/iOS/NAS personal AI companion. The project should not drift into the
existing OpenClaw/benben live infrastructure or Sub2API ops surfaces unless the
user explicitly asks about those systems.

The first useful build is not model fine-tuning or firmware hacking. The first
useful build is a local relay plus memory-service that can speak OpenAI-style
chat APIs, route models, and manage long-term memory safely.

## 2026-07-15 Direction Amendment

The following decisions supersede any earlier implication that paid iOS
distribution or HealthKit is required for the personal MVP:

- The intended deployment is single-owner and personal-use. Keep owner
  authentication, privacy scoping, and audit logs, but do not design billing,
  organizations, public onboarding, or multi-tenant administration.
- Do not require paid Apple Developer Program membership now. Use Xcode
  Personal Team for owner-device testing and accept periodic re-provisioning;
  TestFlight and App Store distribution are deferred.
- Apple's current capability matrix lists basic HealthKit for free Apple
  Developer accounts, but it remains an optional, unconfirmed device adapter.
  No chat, memory, provider, MCP, or StackChan feature may depend on HealthKit
  being available. HealthKit collection authorization and any off-device or
  cloud-chat transmission are separate owner-visible gates; source permission
  alone never authorizes transmission.
- Introduce a `HealthSource` boundary. Normalize HealthKit, owner-run
  Shortcuts/webhooks, manual Apple Health exports, and selected third-party
  wearable/provider APIs into only five canonical families: steps, active
  energy, heart rate, sleep, and workouts.
- Introduce a backend custom-provider registry for OpenAI-compatible endpoints,
  Gemini, Claude, Sub2API, and Ollama/NAS profiles. Store credentials encrypted
  on the backend; iOS may select profiles and view capabilities but may not read
  saved secrets. A fallback may call only an owner-allowlisted provider that is
  compatible with the request privacy class; otherwise provider failure returns
  an error without invoking another provider.
- Run MCP primarily in the backend relay. Connections and tools are allowlisted,
  read-only by default, time-bounded, and audited. `ToolGate` confirmation is
  mandatory for state-changing tools. iOS owns status, selection, argument, and
  confirmation UI, not arbitrary MCP server execution.
- Phone-app actions may use App Intents, Shortcuts, URL schemes, universal
  links, and share sheets only when the target app supports them. Arbitrary
  background control, cross-app data reading, and unsupported automation remain
  outside the product boundary.
- The original Gemini Flash default was superseded on 2026-07-05. The latest
  documented default companion cloud route is `claude-opus-4-6-thinking`;
  Gemini remains an available provider route. The private local-first Mac route
  uses `huihui_ai/qwen3.5-abliterated:9b`, while private-cloud routing remains
  conditional on explicit owner policy/config. These are source/config
  decisions, not proof of current live provider health.

Reference facts are recorded in Apple's
[membership comparison](https://developer.apple.com/support/compare-memberships/)
and [iOS capability matrix](https://developer.apple.com/help/account/reference/supported-capabilities-ios/).

## Product Shape

Target components:

- StackChan/CoreS3 class desktop robot as an embodied voice/display front end.
- User-owned relay server as the control plane.
- Gemini and Claude routes through the user's gateway for cloud inference, with
  an owner-configurable provider registry planned for additional endpoints.
- Optional NAS local model for private/offline/lightweight tasks.
- iOS app for chat, voice, optional multi-source health summaries,
  reminders/calendar, AlarmKit, provider/MCP controls, and Shortcuts/App Intents
  where supported.
- Long-term memory with review, provenance, privacy gates, and deletion.
- Optional style profile from uploaded chat logs only when consent is recorded.

## Feasibility Decisions

Confirmed feasible:

- StackChan can be used as a Wi-Fi/BLE AI terminal, with firmware adaptation if
  the seller firmware cannot configure a custom OpenAI-compatible base URL.
- A server relay can expose `/v1/chat` and route to Gemini, Claude, and later
  NAS local models.
- MCP and custom API providers do not depend on Apple program membership when
  their runtime and credentials remain in the backend relay.
- NAS local models are useful for privacy/offline summarization and fallback,
  not as the primary high-quality emotional dialogue engine.
- Long-term memory should be implemented as a service, not by hoping the model
  "learns" invisibly.
- iOS can integrate through permission-scoped APIs such as HealthKit, EventKit,
  AlarmKit, Shortcuts, and App Intents. Personal Team provisioning is suitable
  for owner-device development but expires periodically and does not provide
  TestFlight or App Store distribution.

Hard limits:

- iOS cannot read arbitrary phone data, WeChat, QQ, other app notifications, or
  all system information.
- iOS cannot make an unsupported app expose automation or permit a backend MCP
  tool to bypass iOS permissions and foreground/user-confirmation rules.
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

The Phase 1-6 list below is the original target sequence plus the 2026-07-15
direction amendment. It is not the current completion ledger or permission to
execute a task. Current facts and queue order live in the project `README.md`
and `ARCHITECTURE_TODO.md`.

Phase 1:

- Register the project and preserve this architecture record.
- Build local relay skeleton and `/v1/chat` route.
- Build `InteractionEnvelope`, `IdentityKernel`, and `PrivacyKernel`.
- Build memory tables and `/v1/memory/ingest`, `/v1/memory/recall`.
- The initial 2026-07-04 plan used Gemini Flash as the default and Claude for
  complex reasoning through the server-side router. The direction amendment
  above records the later default-route decision.

Phase 2:

- Add STT/TTS and StackChan integration.
- Add basic Memory Admin UI/API: search, explain, approve, reject, delete.
- Add model usage ledger.

Phase 3:

- Add iOS companion app with chat, optional `HealthSource` summaries, EventKit
  reminders, AlarmKit where available, and Shortcuts/App Intents.
- Add NAS local model route for private/offline summaries.

Phase 4:

- Define provider-profile, MCP capability/tool-call, phone-action, and
  normalized health-source contracts.
- Add the custom-provider registry and iOS profile/capability settings without
  returning stored secrets to the phone.
- Add one allowlisted, read-only backend MCP vertical with timeout and audit
  coverage.

Status amendment (2026-07-15): the first Phase 4 bullet is complete at product
`65d47b5`; the accepted schema baseline is
[integration-contracts-v0.1.md](integration-contracts-v0.1.md). The local
custom-provider registry core is separately complete at product `ad18cd0`; see
[custom-provider-registry-v0.1.md](custom-provider-registry-v0.1.md). KEK
lifecycle, authenticated API, router/client execution, iOS settings, and MCP
runtime remain planned and are not implied by either acceptance.

Phase 5:

- Add one supported phone-app action through a mock/Simulator-first App
  Intent/Shortcut or URL/universal-link/share-sheet path.
- Add a non-HealthKit health adapter while preserving the same five canonical
  summary families.
- Run separate Personal Team device acceptance; do not block these backend
  integrations on paid program membership.

Phase 6:

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
- Do not run arbitrary MCP servers on iOS or expose stored provider credentials
  to the app.
- Do not make paid distribution or any one health-data source a prerequisite
  for the personal MVP.

## Integrated Target Acceptance Anchors

These are acceptance anchors for the integrated personal-use target. The
provider, MCP, phone-action, and multi-source health anchors apply only after
their later phases land; they are not requirements retroactively satisfied by
the earlier core MVP.

- A local client can send a chat turn to the relay and get a model response.
- The same turn produces a stored conversation message and optional session
  delta.
- Memory recall returns only facts allowed by the envelope scope.
- StackChan delivery mode blocks sensitive facts by default.
- The owner can inspect and delete a promoted memory.
- Usage logging identifies provider/model/session/device without exposing
  secrets or private raw prompts.
- The owner can disable a provider, MCP server/tool, phone action, or health
  source independently without breaking the default chat path.
- Every state-changing tool or phone action presents an owner-visible preview
  and requires explicit confirmation before execution.
