# MVP Build Order

Use this runbook when starting implementation so the project does not drift
into firmware work, model training, or live/NAS repair too early.

Current baseline (2026-07-15): product `main@72258a1` contains a source-gated
authenticated iOS-to-cloud chat path that is off by default. When enabled with
its trusted dependencies, non-temporary turns persist atomically, temporary
turns skip persistence, and expired bounded context is pruned at startup and
periodically. No live chat vertical has been accepted. A local full-suite check
passed `1197` tests with one existing Starlette/TestClient warning. Steps 1-5
below preserve the original dependency order; current status remains
authoritative in the project README and `ARCHITECTURE_TODO.md`.

## Route Lock Template

For long implementation turns, use:

```yaml
target_project: personal-ai-companion
target_surface: local product + ops docs
project_root: /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion
ops_root: /Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion
route_evidence:
  - personal-ai-companion registry entry
  - StackChan / personal AI companion / memory-service request
forbidden_surfaces:
  - ops/projects/openclaw unless explicitly asked
  - ops/projects/sub2api unless explicitly asked
  - live NAS/VPS/service state unless repair gate is opened
```

## Step 1: Local Relay Skeleton

Build locally first.

Minimum modules:

- `api-gateway`
- `model-router`
- `chat-orchestrator`
- `usage-ledger`

Minimum endpoints:

```text
POST /v1/chat
GET  /v1/admin/usage
```

## Step 2: Memory-Service Core

Implement before iOS and before chat-log style work.

Minimum modules:

- `InteractionEnvelope`
- `IdentityKernel`
- `PrivacyKernel`
- `MemoryWritePipeline`
- `MemoryRecallPipeline`
- `MemoryAdmin`

Minimum endpoints:

```text
POST   /v1/memory/ingest
POST   /v1/memory/recall
GET    /v1/memory/search
GET    /v1/memory/{id}/explain
POST   /v1/memory/{id}/promote
POST   /v1/memory/{id}/reject
DELETE /v1/memory/{id}
```

## Step 3: Voice And StackChan

Only after `/v1/chat` and memory gates work.

Minimum endpoints:

```text
POST /v1/voice/stt
POST /v1/voice/tts
POST /v1/devices/register
```

Default behavior:

- StackChan uses the server relay as its only model/token holder.
- Sensitive memory is blocked from speaker output unless explicitly allowed.
- Firmware changes are a fallback if custom base URL configuration is missing.

## Step 4: iOS Companion

Keep all integrations permission-scoped.

Allowed targets:

- Optional HealthKit summaries with user-granted categories.
- EventKit reminders/calendar with authorization.
- AlarmKit for app-owned alarms where supported.
- Shortcuts/App Intents for explicit user-triggered actions.
- Provider-profile and MCP capability/status UI that never returns stored
  credentials to the phone.

Personal-use constraint:

- Use Xcode Personal Team for owner-device development first.
- Expect seven-day provisioning expiry and periodic rebuild/reinstall.
- Do not make paid Apple Developer Program membership, TestFlight, or App Store
  distribution an MVP dependency.

Explicitly out of scope:

- Reading WeChat, QQ, other apps, all notifications, or arbitrary phone data.
- Running arbitrary untrusted MCP servers on the phone.
- Controlling another app unless it exposes a supported App Intent, Shortcut,
  URL scheme, universal link, or share-sheet action.

## Step 5: NAS Local Model

Add as an optional route after the relay contract is stable.

Good first uses:

- Private summarization.
- Memory candidate extraction.
- Offline fallback.
- Low-cost review jobs.

Do not rely on the NAS local model as the primary emotional dialogue model
unless hardware benchmarks prove quality and latency are good enough.

## Deferred Track: Chat-Log Import And Style Profile

Do this late and conservatively. It does not block the current provider, MCP,
phone-action, health-source, or Personal Team continuation below.

Requirements:

- Explicit consent record for the person whose style is modeled.
- Import job with cleaning, deduplication, and redaction.
- Candidate extraction into `candidate_atoms`, not direct stable memory.
- Style profile that is labeled as a consented profile, not the real person.
- Owner-visible deletion and revocation path.

## Current Continuation 1: Integration Contracts

Freeze additive v0.1 contracts before building settings screens or network
adapters:

- `ProviderProfile` and capability/health projection.
- `MCPServerProfile`, allowlisted `MCPToolCapability`, and `ToolCallRequest`.
- `PhoneActionRequest`, preview, confirmation, and outcome.
- `HealthSourceSnapshot` with source attribution and deduplication metadata.

Contract tests must use synthetic fixtures and must not require real provider
keys, MCP servers, health data, or phone apps.

## Current Continuation 2: Custom API Provider Registry

Build this in the backend relay, not as an iOS secret store.

First adapters:

- One OpenAI-compatible custom endpoint.
- Existing Gemini/Claude routes represented through the same capability model.
- Later profiles for Sub2API and Ollama/NAS.

Requirements:

- Encrypt provider credentials at rest and never return them after registration.
- Let iOS select a provider/profile and view redacted status/capabilities.
- Invoke a fallback provider only when the owner explicitly allowlists that
  provider for the request's privacy class. Otherwise return an error without
  invoking another provider.
- Audit configuration changes without logging secrets or private prompts.

## Current Continuation 3: Backend MCP Gateway

Start with one local, allowlisted, read-only information tool.

Requirements:

- Allowlist MCP servers and individual tools; discovery does not imply enablement.
- Read-only by default with explicit capability labels.
- Bound connection and tool-call timeouts, concurrency, and output size.
- Route every state-changing tool through `ToolGate` preview and explicit owner
  confirmation.
- Record metadata-only audit outcomes and keep tool failures isolated from chat.

The iOS app may display server/tool status, collect arguments, and present
confirmation. It must not execute arbitrary MCP servers directly.

## Current Continuation 4: Supported Phone-App Actions

Implement one action at a time through an iOS-supported surface:

- App Intents or Shortcuts when the target app exposes them.
- URL schemes or universal links for supported deep links.
- Share sheets for owner-visible content handoff.

Use mock/Simulator acceptance before any real-device action. Require an
owner-visible preview and confirmation for state changes. Do not promise
arbitrary background control, notification reading, or private cross-app data
access.

## Current Continuation 5: Health-Source Abstraction

Make HealthKit one adapter behind a shared `HealthSource` boundary.

Canonical output remains limited to:

- steps;
- active energy;
- heart rate;
- sleep;
- workouts.

Add fallback adapters in this order:

1. Owner-run Shortcut/webhook.
2. Manual Apple Health export import.
3. Selected third-party wearable/provider APIs.

Each snapshot must retain source attribution, collection time, consent scope,
and deduplication identity. Disabling one adapter must not disable chat, memory,
or another health source.

## Current Continuation 6: Personal Team Device Acceptance

Run this only after the backend contracts and mock paths are stable.

- Verify owner-device installation and re-provision/reinstall recovery.
- Request only the existing five HealthKit read families if the owner chooses
  the HealthKit adapter.
- Keep real health-data review separate from signing/build verification.
- Record Personal Team limitations explicitly; do not treat the result as
  TestFlight, App Store, or distribution acceptance.
- Revisit paid membership only if distribution, longer-lived provisioning, or a
  paid-only capability becomes a real requirement.

## Verification Checklist

- Memory recall is scoped by envelope and privacy class.
- Unknown identity cannot access private memories.
- StackChan speaker output suppresses sensitive memory by default.
- Memory mutation requires owner confirmation.
- Usage logs do not include secret values.
- Raw chat logs are not used as answer truth.
- Provider credentials never round-trip back to iOS.
- MCP servers/tools and phone actions are allowlisted, independently disableable,
  and state changes require explicit confirmation.
- All health adapters normalize only the five canonical families and preserve
  source attribution.
- The default chat route remains usable when custom providers, MCP, phone
  actions, HealthKit, or other health sources are disabled.
