# MVP Build Order

Use this runbook when starting implementation so the project does not drift
into firmware work, model training, or live/NAS repair too early.

Current baseline (2026-07-15): product `main@2dc2948` contains a source-gated
authenticated iOS-to-cloud chat path that is off by default. When enabled with
its trusted dependencies, non-temporary turns persist atomically, temporary
turns skip persistence, and expired bounded context is pruned at startup and
periodically. That authenticated route explicitly disables memory-candidate
writes. The same baseline contains the accepted transport-free integration
contracts plus the local encrypted custom-provider registry and bounded 9B
runtime integration. It has an owner-authenticated redacted Provider API,
default-off iOS status/selection, and an injected-executor synthetic `normal`
route, but no default network transport or live optional-integration vertical.
Product `2dc2948` also accepts the local/mock MCP gateway for exactly
`server.local.context/context.today`, with strict allowlisting, bounded
execution, idempotency/concurrency limits, and metadata-only audit. It adds no
remote transport, state-changing execution, iOS runtime, or main-Chat call.
A local full-suite check [passed `1417` tests](../reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md)
and all `44` Swift executables at the pre-MCP baseline with one existing
Starlette/TestClient warning. The latest MCP check [passed `21` focused MCP
tests and `1438` full Python tests](../reports/mcp-gateway-readonly-v0.1-acceptance-20260715.md)
with the same warning. The latest
documented default companion cloud route is `claude-opus-4-6-thinking`; the
private local-first Mac route uses `huihui_ai/qwen3.5-abliterated:9b`. Those are
source/config decisions, not live-provider health evidence. Steps 1-5 below
preserve the original architecture dependency order; current completion status
and task order remain authoritative in the project README and
`ARCHITECTURE_TODO.md`.

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

## Original Dependency Order

Steps 1-5 are a historical architecture sequence, not an unchecked build list
or authorization to repeat completed work. Use the `Current Continuation`
sections for the active planned sequence.

### Step 1: Local Relay Skeleton

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

### Step 2: Memory-Service Core

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

### Step 3: Voice And StackChan

Only after `/v1/chat` and memory gates work.

Current source voice endpoints:

```text
POST /v1/audio/transcriptions
POST /v1/audio/speech
POST /v1/voice/chat
```

The original `/v1/devices/register` target is not implemented. StackChan's
accepted LCD slice uses the separately authenticated App/Bridge routes recorded
in the project README; do not invent or expose a registration endpoint from
this historical sequence.

Default behavior:

- StackChan uses the server relay as its only model/token holder.
- Sensitive memory is blocked from speaker output unless explicitly allowed.
- Firmware changes are a fallback if custom base URL configuration is missing.

### Step 4: iOS Companion

Keep all integrations permission-scoped.

Allowed targets:

- Optional HealthKit summaries with user-granted categories.
- Treat HealthKit collection permission and any off-device/cloud-chat use as
  separate owner-visible gates. The authenticated cloud-chat client currently
  does not accept health context.
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

### Step 5: NAS Local Model

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

## Current Continuation 1: Integration Contracts (`completed 2026-07-15`)

Freeze additive v0.1 contracts before building settings screens or network
adapters:

- `ProviderProfile` and capability/health projection.
- `MCPServerProfile`, allowlisted `MCPToolCapability`, and `ToolCallRequest`.
- `PhoneActionRequest`, preview, confirmation, and outcome.
- `HealthSourceSnapshot` with source attribution and deduplication metadata.

Contract tests must use synthetic fixtures and must not require real provider
keys, MCP servers, health data, or phone apps.

Accepted result: product `65d47b5` freezes the four versioned families with
synthetic fixtures and `102` focused tests. See the
[contract manifest](../manifests/integration-contracts-v0.1.md) and
[acceptance report](../reports/integration-contracts-v0.1-acceptance-20260715.md).
This completion accepts schemas only; at that contract baseline, continuation 2
was the first runtime integration task.

## Accepted Continuation 2: Custom API Provider Registry

Build this in the backend relay, not as an iOS secret store.

9A core status: accepted at product `ad18cd0`. The standalone registry now has
Provider-specific envelope encryption, external KEK injection, exact schema and
nonce checks, optimistic revisions, synthetic health, redacted projections,
metadata-only audit, and an explicit `normal`-only fallback policy. See the
[manifest](../manifests/custom-provider-registry-v0.1.md) and
[acceptance report](../reports/custom-provider-registry-v0.1-acceptance-20260715.md).

9B status: accepted at product `295687f`. It adds a secret-safe injected
runtime adapter, explicit KEK/resource lifecycle, authenticated owner API,
redacted iOS status/selection, and one synthetic `normal` route. See the
[manifest](../manifests/custom-provider-runtime-integration-v0.1.md) and
[acceptance report](../reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md).
It does not modify live provider configuration, call a real endpoint, provide a
default network executor or health prober, route the main Chat surface, or widen
to sensitive privacy classes.

Future real adapters not accepted by 9B:

- One OpenAI-compatible custom endpoint.
- Existing Gemini/Claude routes represented through the same capability model.
- Later profiles for Sub2API and Ollama/NAS.

Requirements:

- Keep provider credentials encrypted at rest and never return them after
  registration.
- Let iOS select a provider/profile and view redacted status/capabilities only
  through the authenticated 9B owner API.
- Invoke a fallback provider only when the owner explicitly allowlists that
  provider for the request's privacy class. Otherwise return an error without
  invoking another provider.
- Audit configuration changes without logging secrets or private prompts.

## Accepted Continuation 3: Bounded Backend MCP Gateway

The first bounded slice is accepted at product `2dc2948`; it is local/mock only
and is not a general remote MCP implementation.

Requirements:

- Allowlist MCP servers and individual tools; discovery does not imply enablement.
- Read-only by default with explicit capability labels.
- Bound connection and tool-call timeouts, concurrency, and output size.
- Route every state-changing tool through `ToolGate` preview and explicit owner
  confirmation.
- Record metadata-only audit outcomes and keep tool failures isolated from chat.

Accepted implementation: `server.local.context/context.today` only, using a
caller-owned clock and explicit timezone input. Cloud routes are optional and
appear only when a caller-injected gateway and trusted owner resolver are both
present. The gateway validates `pac.mcp.v0.1`, request windows, health,
credentials, effect kind, and bounded TTL idempotency before execution; it uses
bounded admission/tool timeouts and records no arguments, results, exceptions,
credentials, or URLs. Audit is bounded/injected, not a durable audit store.

Remote transport/discovery, arbitrary JSON Schema execution, state-changing
`ToolGate` execution, iOS-side MCP runtime, automatic main-Chat/provider
fallback, live reconfiguration, deployment, and real private data remain
outside this acceptance. Any additional tool requires a new queue item.

The iOS app may later display server/tool status, collect arguments, and present
confirmation. It must not execute arbitrary MCP servers directly; this slice
does not add iOS MCP runtime wiring.

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
- The accepted MCP slice is limited to the local read-only tool above; its
  metadata-only audit is bounded/injected and does not prove a durable audit
  store or remote MCP health.
- All health adapters normalize only the five canonical families and preserve
  source attribution.
- Health-source authorization alone does not authorize off-device or cloud-chat
  transmission; that requires a separate owner-visible gate and acceptance.
- The default chat route remains usable when custom providers, MCP, phone
  actions, HealthKit, or other health sources are disabled.
