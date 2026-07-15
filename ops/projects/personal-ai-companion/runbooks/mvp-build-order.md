# MVP Build Order

Use this runbook when starting implementation so the project does not drift
into firmware work, model training, or live/NAS repair too early.

Current baseline (2026-07-15): product `main@2360cba` contains a source-gated
authenticated iOS-to-cloud chat path that is off by default. When enabled with
its trusted dependencies, non-temporary turns persist atomically, temporary
turns skip persistence, and expired bounded context is pruned at startup and
periodically. That authenticated route explicitly disables memory-candidate
writes. The same baseline contains the accepted transport-free integration
contracts plus the local encrypted custom-provider registry and bounded 9B
runtime integration. It has an owner-authenticated redacted Provider API,
default-off backend/local iOS status/selection wiring, and an injected-executor
synthetic `normal` route, but no default network transport or live
optional-integration vertical. The current iOS MVP navigation does not expose
custom-provider selection or MCP controls.
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

The order 11 iOS action is now accepted at product `7547d8a`: Status exposes
only the fixed public `companion.share_capabilities -> system.share_sheet`
card through SwiftUI `ShareLink`. The order 11 acceptance passed `26` focused
phone-contract tests, `1439` full Python tests, and all `44/44` Swift smoke
executables, with one existing warning. The system handoff creates no app
receipt/audit and cannot observe cancellation or target completion.

Order 12 is now accepted as a local additive source boundary. The iOS Core
catalog keeps the five canonical families in Python-contract order, declares
HealthKit as an optional implemented-code adapter, and exposes owner-run
Shortcut/webhook, manual Apple Health export, and selected third-party entries
as planned, disabled-by-default fallbacks. Planned entries are inert typed
unavailable adapters; no file import, network intake, HealthKit query, signing,
or cloud transmission is part of this acceptance. The formal Host retains its
legacy HealthKit provider injection for compatibility, but construction alone
does not request authorization or read a sample. See the [order 12 manifest](../manifests/health-source-abstraction-v0.1.md)
and [acceptance report](../reports/health-source-abstraction-v0.1-acceptance-20260715.md).
The Python
`pac.health_source.v0.1` DTO remains authoritative for numeric windows,
cryptographic content hashes, freshness, and multi-source conflict composition.
The owner-summary follow-up is accepted at product `4a8b52e`: `36` focused
intake tests, `60` combined health tests, and `1475` full Python tests passed
with the existing warning. It remains transport-free and does not read a file,
open a network connection, invoke a Shortcut, transmit to cloud chat, or expose
an iOS UI. The fixture-only manual-export normalizer is accepted at product
`0665fd3`: `43` focused tests, `103` combined health tests, and `1518` full
Python tests passed with the same warning. It consumes only a pre-aggregated
synthetic mapping; it does not read a file/ZIP/XML, enable the Swift adapter,
open a network connection, transmit to cloud chat, or expose an iOS UI. The
default-off off-device consent envelope is accepted at product `bff7398`: `55`
focused tests, `158` combined health tests, and `1573` full Python tests passed.
It requires literal `true` single-request transfer consent, complete qualitative
five-family content, and a five-minute maximum lifetime while stripping source
and adapter identity. It adds no transport, model call, consent persistence,
authenticated-chat wiring, Swift source, or iOS UI. Product `c0cd301` adds the
local model-agnostic analysis contract: `65` focused, `223` combined health,
and `1638` full Python tests passed. It binds a validated 12C envelope to one
request fingerprint and emits only controlled explanation codes, explicit
qualitative uncertainty, and categorical chart metadata. It adds no free-form
narrative, numeric health values, provider/model execution, network/API route,
  persistence, chat wiring, Swift source, or iOS UI. Product `2360cba` adds the
  explicitly injected owner Shortcut analysis API: `16` focused, `349` combined
  Cloud/health, and `1654` full Python tests passed. It fixes the transfer window
  to the submitted consent time and returns the existing exact 12D categorical
  response, but has no default mount, deployed composition, Shortcut recipe/token
  handoff, persistence, replay store, provider/model narrative, chat, Swift, or
  iOS UI. No later implementation slice is selected; the Personal Team device
  gate remains optional/deferred.

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

## Accepted Continuation 4: Supported Phone-App Action

The first action is accepted at product `7547d8a` for local/mock/Simulator
scope. See the [manifest](../manifests/ios-supported-app-action-v0.1.md) and
[acceptance report](../reports/ios-supported-app-action-v0.1-acceptance-20260715.md).
It uses exactly one iOS-supported surface:

- `companion.share_capabilities -> system.share_sheet`;
- SwiftUI `ShareLink` with a compile-time fixed public capability card; and
- a read-only effect with no app-level confirmation.

The production path does not create a receipt or durable audit, observe owner
cancellation, or confirm target-app completion. The mock handoff provider is
contract-test-only, and its `targetCompletionConfirmed` value is always false.
The Python test checks compatible semantics, not Swift/Python fixture parity.
App Intents, Shortcuts, URL schemes, reminders, dynamic sharing, state changes,
notification reading, arbitrary background control, private cross-app data, and
real-device execution remain out of scope.

## Accepted Continuation 5: Health-Source Abstraction (`completed 2026-07-15`)

Make HealthKit one adapter behind a shared `HealthSource` boundary. The order
12 manifest and report record the accepted local slice.

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

The Swift attributed-summary seam retains source attribution, adapter/source
revision, collection time, owner consent scope, a non-secret content
fingerprint, and structural deduplication identity. The existing Python DTO
continues to own exact window/hash/freshness/conflict semantics; no
Swift/Python fixture parity is claimed. Disabling one adapter must not disable
chat, memory, or another health source.

The first fallback entries are owner-run Shortcut/webhook and manual Apple
Health export, followed by selected third-party adapters. They are represented
as planned inert adapters that fail closed with a typed unavailable result.
The owner-summary contract is accepted separately as a transport-free
fixture/test boundary; it does not enable intake. The Python fixture-only
manual-export normalizer is also accepted, but does not enable the Swift adapter
or any file/ZIP/XML intake. Later filesystem, network, or owner-approval work
requires a separate task and review.

## Accepted Continuation 6: Owner Summary Contract (`completed 2026-07-15`)

The product `4a8b52e` implementation keeps fixed owner-Shortcut source
attribution, canonical five-family projections, deterministic conversion to the
existing Python health snapshot, and non-echoing validation errors. It adds no
file import, HTTP, webhook route, Shortcut invocation, cloud-chat transmission,
or iOS UI. See the owner-summary manifest and acceptance report.

## Accepted Continuation 7: Manual Export Normalization (`completed 2026-07-15`)

Product `0665fd3` accepts only a synthetic mapping from five documented manual
Apple Health export markers to the canonical families. It reuses existing
snapshot validation, content hashing, freshness, deduplication, and conflict
boundaries. The acceptance passed `43` focused tests, `103` combined health
tests, and `1518` full Python tests. See the [manifest](../manifests/health-manual-export-normalization-v0.1.md)
and [acceptance report](../reports/health-manual-export-normalization-v0.1-acceptance-20260715.md).
It reads no real export file, parses no ZIP/XML, enables no Swift adapter, and
adds no network route, cloud transmission, model execution, or iOS UI.

## Accepted Continuation 8: Off-Device Health Consent Contract (`completed 2026-07-15`)

Product `bff7398` accepts one separate, default-off and single-request
`HealthOffDeviceSummaryEnvelope`. Missing or `false` consent fails closed;
collection/import and memory consent scopes cannot substitute for
`owner_health_summary_transfer`. The envelope requires the complete canonical
five-family qualitative summary, verifies its content digest, strips source and
adapter identity, and expires within five minutes. See the [manifest](../manifests/health-off-device-consent-contract-v0.1.md)
and [acceptance report](../reports/health-off-device-consent-contract-v0.1-acceptance-20260715.md).
It does not transmit data, add an API route, call a provider/model, persist
consent, modify authenticated chat, change Swift source, or expose iOS UI.

## Accepted Continuation 9: Health Analysis Contract (`completed 2026-07-15`)

Product `c0cd301` accepts a model-agnostic, non-diagnostic synthetic
request/response schema. The request consumes a valid off-device envelope only
during its authorization window; the response binds to its fingerprint, ID,
window, digest, and exact five-family projections. Explanation and uncertainty
remain controlled codes, and chart metadata is categorical only. See the
[manifest](../manifests/health-analysis-contract-v0.1.md) and [acceptance
report](../reports/health-analysis-contract-v0.1-acceptance-20260715.md).
No provider/model execution, free-form narrative, network/API route,
persistence, authenticated-chat wiring, real health data, Swift source, or iOS
UI is accepted.

## Accepted Continuation 10: Owner Shortcut Analysis API (`completed 2026-07-15`)

Product `2360cba` accepts the explicitly injected owner-only
`POST /v1/health/shortcut-analysis` composition. It validates a strict 20 KiB
12A owner summary plus a separate single-request transfer assertion, fixes the
12C five-minute window to the submitted consent time, and returns the exact 12D
categorical response with no-cache headers. Bearer and trusted-owner checks run
before body streaming. The service has no database dependency, and the route is
absent unless both the dedicated service and owner resolver are injected. See
the [manifest](../manifests/health-owner-shortcut-analysis-api-v0.1.md) and
[acceptance report](../reports/health-owner-shortcut-analysis-api-v0.1-acceptance-20260715.md).

This is not a deployed health path. It adds no iPhone Shortcut, token handoff,
raw Apple sample intake, real export parser/aggregator, consent persistence,
replay suppression, rate-limited public composition, model narrative, chat,
Swift, or iOS UI.

## Optional Continuation 11: Personal Team Device Acceptance

Run this only after the backend contracts and mock paths are stable, and only
if the owner chooses to pursue a short-lived Personal Team device check. It is
  optional/deferred, is not required for the accepted health input/API contracts,
  and does not require paid membership.

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
  transmission. The accepted 12C envelope is a local structural gate, not proof
  of persisted consent, transport, model execution, or completed transmission.
- The default chat route remains usable when custom providers, MCP, phone
  actions, HealthKit, or other health sources are disabled.
