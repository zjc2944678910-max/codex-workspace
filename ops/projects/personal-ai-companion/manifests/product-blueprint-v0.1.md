# Personal AI Companion Product Blueprint v0.1

Date: 2026-07-16
Status: north-star planning manifest

## North Star

Build a private, single-owner personal AI companion that becomes more useful
and emotionally familiar over time. The product should combine a strong
local/private memory system, a consented style profile, a phone app, and an
embodied StackChan presence so the companion can talk, remember, notice
context, and adapt its tone without exposing private data unnecessarily.

This is a personal-use product, not a multi-tenant SaaS or an App Store product
by default. Owner identity, authentication, and audit boundaries still remain
mandatory even though there is only one intended human user.

The target feeling is not a generic chatbot. It should feel like a trusted,
available companion that knows the owner's preferences, routines, health
signals, devices, and boundaries.

## Core Product Pillars

- Style and personality: continue the synthetic style-rule expansion toward
  roughly 100 bounded daily-companion categories before treating the style layer
  as stable.
- Memory: keep long-term memory inspectable, explainable, deletable, and scoped
  by identity, device, channel, and consent.
- Embodiment: use StackChan as a physical front end for presence, display,
  simple actions, voice, and camera-related experiences, not as the model host.
- Mobile control: use an iOS app for private chat, device control, permissioned
  health summaries, supported App Intents/Shortcuts actions, integration status,
  and owner-visible settings.
- Extensibility: add owner-configured model/API providers and allowlisted MCP
  tools through the backend relay, with secrets kept off the phone and explicit
  confirmation for side effects.
- Private infrastructure: use NAS for private storage/search/local jobs and VPS
  only for narrow relay or remote-access roles that do not require raw private
  data exposure.

The provider and MCP controls above are target architecture, not current MVP
surface. The current iOS navigation exposes private chat, device/health status,
and the fixed supported share action; it does not expose custom-provider
selection or MCP invocation controls.

## Component Boundaries

| Component | Owns | Does Not Own |
| --- | --- | --- |
| `personal-ai-companion` API | interaction envelopes, model routing, provider registry, MCP gateway, memory gates, usage ledger | raw phone access, direct public exposure |
| Style profile layer | bounded response-shape rules, diagnostics, rewrite guidance | pretending to be a real person without consent, raw chat truth |
| StackChan | embodied display/voice/action front end, local device status, simple launchers | secrets, memory database, primary model inference |
| iOS app | current chat UI, device controls, health-source status, supported phone-action launchers, owner settings; future provider/MCP UI remains planned | provider secrets, custom-provider selection and MCP invocation in the current MVP, arbitrary MCP execution, unpermissioned phone data, arbitrary app/message reading or background control |
| Provider registry + MCP gateway | encrypted server-side provider credentials, capability discovery, allowlisted MCP connections/tools, timeout/audit policy | silently enabling tools, exposing saved credentials to iOS, bypassing `ToolGate` |
| Health-source adapters | normalize owner-approved health inputs into the five canonical summary families | clinical diagnosis, hidden collection, treating inferred mood as fact |
| Memory service | session context, candidate memories, promoted atoms, deletion/explain flows | irreversible hidden learning, unreviewed sensitive memory promotion |
| NAS | private persistence, backups, search/vector jobs, optional local summaries | default internet-facing API |
| VPS | optional secure relay, remote reachability, queue/control plane | raw private memory store, broad device/admin control |

## Current Confirmed State

- Product `main@7905b12` contains a source-gated authenticated chat path that is
  off by default. When enabled with its trusted dependencies, non-temporary
  turns persist atomically, temporary turns skip persistence, and expired
  bounded context is pruned at startup and periodically. That authenticated
  route explicitly disables memory-candidate writes. The same baseline retains
  the transport-free v0.1 provider, MCP, phone-action, and five-family
  health-source contracts and adds the local custom-provider registry/runtime
  slice with encrypted SQLite persistence, explicit KEK/resource lifecycle,
  synthetic health, owner API, redacted iOS selection/status, injected executor,
  and `normal`-only routing. Product `2dc2948` additionally accepts one local,
  caller-injected, read-only MCP gateway tool, `server.local.context/context.today`,
  with bounded execution and metadata-only audit. No live chat or live remote
  optional-integration vertical has been accepted. The [2026-07-15 runtime
  acceptance](../reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md)
  passed `1417` Python tests and all `44` Swift executables at the pre-MCP
  `295687f` baseline, with one existing Starlette/TestClient warning. The [MCP
  acceptance](../reports/mcp-gateway-readonly-v0.1-acceptance-20260715.md)
  passed `21` focused MCP tests and `1438` full Python tests at `2dc2948`. The
  subsequent order 11 acceptance at product `7547d8a` adds exactly one fixed
  public `companion.share_capabilities -> system.share_sheet` handoff through
  SwiftUI `ShareLink`, with `1439` full Python tests and all `44/44` Swift smoke
  executables passing. The system handoff has no app receipt, durable audit,
  cancellation observation, or target-completion proof. Product `b6209a7`
  carries that action and accepts the additive health-source seam with `24`
  focused health tests, `1439` full Python tests, all `44/44` Swift smokes,
  and an unsigned Host build. Product `4a8b52e` adds the fixture-only
  owner-summary contract, product `0665fd3` adds fixture-only manual-export
  normalization, product `bff7398` adds the default-off off-device consent
  envelope, and product `c0cd301` adds the local qualitative analysis contract.
  Product `2360cba` adds an explicitly injected, default-absent owner Shortcut
  analysis API over those contracts. Its acceptance passed `16` focused, `349`
  combined Cloud/health, and `1654` full Python tests. Product `09b86c7` adds the
  fixed 21+7-day local aggregation policy and owner-buildable Shortcut recipe;
  `34` focused aggregation tests, `273` combined health-chain tests, and `1688`
  full Python tests passed. Product `7905b12` adds the dedicated owner-bound
  credential accepted only by the composed analysis route; `10` credential,
  `283` combined health-chain, and `1698` full Python tests passed. The route
  still has no default mount or deployed composition. The recipe stops at local
  JSON preview and contains no URL, credential, HTTP action, model execution,
  free-form narrative, authenticated-chat health context, chart UI, Swift/iOS
  caller, installed Shortcut, or real-data acceptance. The credential table
  persists only owner binding, digest, and lifecycle metadata.
- Style-profile mechanisms and synthetic evaluation surfaces exist, but no
  thread-running claim is durable product state. New style work must use the
  current queue and a fresh consent/scope check.
- StackChan is on official UIFlow2 StackChan v2.4.8 and can reach the local
  authenticated bridge.
- StackChan has verified manual entries for connectivity and short text chat.
- StackChan boot-time auto-start currently performs only the
  `DEVICE_CONNECTED` handshake.
- StackChan command protocol v0.1 now runs on the local authenticated bridge and
  has removable device files for manual polling. It covers `boot` events,
  `status`, `expression`, safe placeholder `motion/action`, public-safe
  `speak` through bridge-generated local WAV playback, `ack`, and `error`
  envelopes. A bounded 2026-07-11 session field-confirmed the manual
  Bridge/device LCD and audio paths. One bounded App-to-Bridge-to-StackChan LCD
  path was later field-accepted for the sequence
  `happy -> correlated ACK -> neutral -> correlated ACK`, retained through
  product commit `9dbfafc` and current
  `main@7905b12`. This does not establish continuous boot polling, unattended
  reliability, or App integration for audio, motion, touch, or camera.
- Separate direct-device checks field-confirmed low-speed X/Y servo movement and
  return, three-zone head-touch input, and one local low-resolution camera
  frame. Those checks did not use the v0.1 `motion/action` placeholder, the
  mock-only App adapter, or an iOS transport. Whether a visible camera activity
  indicator activated was not verified. See
  [the field-verification report](../reports/stackchan-hardware-field-verification-20260711.md).
- The iOS host already contains the bounded, read-only five-family HealthKit
  adapter for steps, active energy, heart rate, sleep, and workouts. The source
  can construct a bounded trend-only chat summary when both owner controls are
  enabled, but the authenticated cloud-chat client does not accept that health
  context. Real-device authorization, real health-data acceptance, and
  off-device health-summary transmission remain unconfirmed.
- The bounded custom-provider registry/runtime, authenticated owner API,
  synthetic route, and default-off backend/local iOS status/selection slice are
  accepted; the current iOS MVP navigation does not expose provider selection.
  A real provider executor/health prober and main Chat integration
  remain future work. The first local/mock MCP gateway tool is accepted, while
  remote MCP transport, state-changing tools, arbitrary discovery, iOS-side
  execution, MCP controls in the current MVP, and automatic main-Chat invocation
  remain future work. Real/deployed health-source file or Shortcut intake,
  third-party adapters, model analysis, continuous
  StackChan command polling, production voice/camera workflows, and NAS/VPS
  production integration also remain future phases.

## Phase Map

These phases are capability-maturity bands, not completion percentages, task
authorization, or a claim that every item in a phase is complete. Phase 0 is
source/local verified; Phases 1 and 2 contain accepted bounded slices plus open
reliability/device gates; Phases 3 through 5 are primarily planned. Current task
status and order come from `ARCHITECTURE_TODO.md`.

### Phase 0: Local Companion Core

- Keep improving the style layer to the planned category target.
- Preserve privacy boundaries around chat-log-derived style work.
- Keep `/v1/chat`, memory, privacy, and usage contracts stable.

Acceptance anchors:

- Local tests and synthetic evals pass.
- No private samples are sent to external model advisors.
- Style rules remain bounded, testable, and reversible.

### Phase 1: StackChan Reliable Presence

- Keep the local bridge authenticated and LAN-only.
- Keep StackChan boot auto-start limited to a safe handshake until command
  polling and recovery behavior are designed.
- Add device command primitives gradually: display text, speak text, simple
  expression/action, camera capture, and status report.

Acceptance anchors:

- Device can recover through serial rollback.
- Secrets stay off the firmware filesystem except protected local token storage.
- Speaker output remains stricter than private iOS text output.

### Phase 2: iOS Companion App

- Build private chat and device-control UI first.
- Use the free Xcode Personal Team path for personal-device testing first. Do
  not make paid Apple Developer Program membership, TestFlight, or App Store
  distribution an MVP dependency.
- Keep HealthKit optional and request it only through explicit user
  authorization and visible settings.
- Keep HealthKit collection authorization separate from a default-off,
  owner-visible off-device health-summary transfer decision.
- Represent health signals as context and trends, not as certain emotion labels.

Acceptance anchors:

- User can inspect and disable each permissioned data source.
- Health-derived context is labeled as inference, not fact.
- The app can control StackChan through the relay without exposing raw secrets.
- A Personal Team build can be re-provisioned and reinstalled when its
  seven-day profile expires; distribution remains out of scope.

### Phase 3: Provider And MCP Extensibility

- Define a backend provider registry for OpenAI-compatible endpoints,
  first-class Gemini/Claude adapters, Sub2API, and Ollama/NAS profiles.
- Keep credentials encrypted and server-side. The iOS app selects a profile and
  displays capabilities/health but cannot retrieve a stored secret.
- Run MCP primarily through the backend relay. Allowlist servers and tools,
  default to read-only tools, apply timeouts and audit logs, and require
  `ToolGate` confirmation for every state-changing call.
- In a future UI phase, let iOS show MCP connection/tool status, choose an
  allowed tool, collect arguments, and present confirmation. The current MVP
  does not expose those controls. Do not run arbitrary untrusted MCP servers
  directly on the phone.

Acceptance anchors:

- A bad provider or MCP server fails closed without breaking the default chat
  route or invoking an unapproved fallback provider.
- Provider and tool capabilities are explicit and owner-visible.
- Audit records identify the provider/server/tool and outcome without recording
  credentials or unnecessary private payloads.

### Phase 4: Supported Phone Actions And Health Intelligence

- Invoke other phone apps only through supported iOS surfaces: App Intents,
  Shortcuts, URL schemes, universal links, and share sheets. A target app must
  expose a supported action; arbitrary background control remains impossible.
- Put phone actions behind the same allowlist, preview, confirmation, and audit
  boundaries as other state-changing tools.
- Introduce a `HealthSource` adapter boundary so HealthKit is one optional
  source rather than the only health path. The local order 12 slice now
  records attribution, consent, capture, content, and deduplication metadata
  without changing the existing summary API.
- Add owner-triggered fallback adapters in this order: Shortcuts/webhook,
  manual Apple Health export, then selected wearable/provider APIs. The first
  two Swift adapters remain typed unavailable/inert seams. The fixture-only
  owner-authored Shortcut/webhook summary contract is accepted locally at
  product `4a8b52e`, and fixture-only manual-export normalization is accepted at
  product `0665fd3`; neither acceptance enables file/network intake or an iOS
  adapter.
- Treat the separate off-device consent envelope accepted at product `bff7398`
  as default-off and single-request only. Collection/import or memory consent
  cannot substitute for its literal transfer assertion; no transport or model
  execution is enabled.
- Treat the qualitative health-analysis contract accepted at product `c0cd301`
  as a local schema boundary only. Its request fingerprint and response binding
  cover the exact five qualitative families; explanation, uncertainty, and
  chart fields remain controlled categorical codes. It does not generate prose,
  execute a provider/model, expose an API/UI, persist health data, or wire chat.
- Treat the owner Shortcut analysis API accepted at product `2360cba` as a
  local/synthetic, explicitly injected composition boundary. It fixes one
  consent window and returns the existing exact categorical response, but has
  no default route mount, deployed composition, iPhone Shortcut, token handoff,
  durable replay store, provider/model narrative, chat, Swift, or iOS UI.
- Treat the order 12F aggregation accepted at product `09b86c7` as a fixed
  local transformation and reference recipe only. It uses 21 complete baseline
  days plus seven current days, fixed coverage gates, six-decimal half-up
  thresholds, conservative missing-data handling, and one stable source per
  family. The recipe ends at local JSON preview; it does not prove real
  Shortcuts actions, permissions, source availability, or phone execution.
- Treat order 12G, accepted at product `7905b12`, as the dedicated local and
  default-off authentication boundary for Shortcut analysis. Its owner-bound
  opaque credential is stored only as a domain-separated digest, returned once
  on issuance, individually revocable, and rejected by every other API. Account
  access and refresh tokens cannot authorize analysis and must never be embedded
  in an Apple Shortcut. Deployment, real issuance/handoff, expiry/rotation,
  rate limiting, public composition, and real health transmission remain
  separate work; live state change remains L3.
- Normalize every source only into the existing five families: steps, active
  energy, heart rate, sleep, and workouts.
- Separate short-term session context, long-term memory atoms, and health
  snapshots.
- Use health signals such as heart rate, sleep, activity, and time of day as
  probabilistic context for tone and timing.
- Require explicit owner controls for storing, deleting, and explaining
  sensitive health or relationship memories.

Acceptance anchors:

- Owner can search, explain, delete, and disable memory classes.
- Health data has retention and minimization rules.
- Mood inference is conservative and corrigible by user feedback.
- Disabling one source does not disable chat, memory, or other health sources.
- Duplicate samples from multiple sources are attributed and deduplicated.

### Phase 5: NAS And VPS Roles

- Use NAS for private data durability, backup, search/vector jobs, and optional
  local summarization.
- Use VPS only as a narrow relay or queue when remote access is needed.
- Reclassify any NAS/VPS live-state investigation as L2 read-only and any
  repair/deploy/restart/config write as L3.

Acceptance anchors:

- Raw private memory is not stored on VPS by default.
- Remote endpoints are authenticated, rate-limited, and auditable.
- Rollback and deployment ledgers exist before public or always-on exposure.

## Privacy And Consent Gates

- Do not read or export `.env`, API keys, raw private chats, `memory.db`, profile
  exemplars, or cleaned real samples unless a task explicitly requires local
  processing and the privacy route is clear.
- Do not send private samples, health data, memories, or credentials to external
  model advisors.
- Style modeling from chat logs must remain consent-scoped and revocable.
- Every health source must be permission-scoped, attributed, inspectable, and
  deletable; HealthKit remains optional.
- Provider and MCP credentials must remain encrypted on the backend and must
  never be returned to iOS after registration.
- MCP tools are read-only by default. Every state-changing MCP call and every
  phone-app action require an owner-visible preview and explicit `ToolGate`
  confirmation.
- StackChan speaker delivery must block sensitive memory by default.
- State-changing device, NAS, VPS, or deployment work requires the L3 repair
  gate and explicit authorization.

## Drift Guardrails

- This blueprint is the north-star document. It should change only when the
  product direction changes, with dated rationale.
- `ARCHITECTURE_TODO.md` remains the running engineering log, not the product
  vision.
- `runbooks/` contain repeatable procedures, not strategy.
- `reports/` contain evidence and repair history, not future plans.
- `manifests/architecture-decisions-2026-07-04.md` remains the initial decision
  snapshot; this blueprint is the current product framing.
- Any task involving OpenClaw, NAS, VPS, Cloudflare, or public deployment must
  re-check route and risk before acting.

## Immediate Next Decisions

- Treat the first bounded App-to-StackChan LCD seam as accepted and closed. Any
  repeat run, reliability expansion, continuous polling, or additional hardware
  capability is a new task with a fresh risk gate.
- Treat the v0.1 provider, MCP, phone-action, and normalized health-source
  contracts accepted at product `65d47b5` as the schema baseline.
- Treat the bounded custom-provider runtime integration accepted at product
  `295687f` as a local/synthetic owner-only slice. It adds explicit
  KEK/resource lifecycle, injected execution, authenticated redacted APIs, and
  default-off backend/local iOS selection/status without authorizing a real provider, default
  network transport, health-probe authority, main Chat routing, or sensitive
  privacy classes.
- Treat the local/mock MCP gateway accepted at product `2dc2948` as complete for
  `server.local.context/context.today`. It has no default transport, remote
  discovery, state-changing execution, iOS runtime, durable audit store, or
  automatic main-Chat invocation. Any additional MCP tool requires a new
  allowlist, scope, and acceptance.
- Treat the fixed public share-sheet action accepted at product `7547d8a` as the
  only current phone-action surface. Do not infer target-app completion,
  cancellation telemetry, receipt/audit support, or Swift/Python fixture parity
  from this handoff. Any App Intent, Shortcut, URL scheme, reminder, dynamic
  sharing, or state-changing action needs a new scope and acceptance.
- Treat the order 12 health-source seam accepted at product `b6209a7` as the
  current local boundary. Product `4a8b52e` adds the fixture-only owner-summary
  contract, product `0665fd3` adds fixture-only manual-export normalization, and
  product `bff7398` adds the default-off off-device consent envelope, and
  product `c0cd301` adds the local qualitative analysis contract, and product
  `2360cba` adds the explicitly injected owner Shortcut analysis API. Product
  `09b86c7` adds the fixed local aggregation policy and owner-buildable recipe,
  while `7905b12` adds the local/default-off scoped credential boundary.
  HealthKit is optional code only; owner Shortcut and Swift manual-export
  adapters remain inert and disabled by default. The formal Host's legacy
  HealthKit injection does not prove authorization or sample access. See the [order 12
  manifest](health-source-abstraction-v0.1.md), [owner-summary
  manifest](health-owner-summary-contract-v0.1.md), [manual-export
  manifest](health-manual-export-normalization-v0.1.md), [off-device consent
  manifest](health-off-device-consent-contract-v0.1.md), and [analysis
  manifest](health-analysis-contract-v0.1.md), [owner Shortcut API
  manifest](health-owner-shortcut-analysis-api-v0.1.md), [aggregation
  manifest](health-owner-shortcut-aggregation-v0.1.md), and [scoped credential
  manifest](health-shortcut-scoped-credential-v0.1.md).
- Keep `PAC-HEALTH-ANALYSIS-CONTRACT` and
  `PAC-HEALTH-OWNER-SHORTCUT-ANALYSIS-API` at their accepted controlled-code and
  default-absent boundaries, keep `PAC-HEALTH-OWNER-SHORTCUT-RECIPE` at its
  local preview-only boundary, and keep the accepted 12G credential boundary
  default-off. No post-12G implementation is selected. HTTP handoff, raw-record
  import, provider/model execution, narrative rendering, deployment, expiry or
  rotation, persistence beyond the credential record, authenticated-chat
  wiring, real health data, Swift source, and iOS UI all require separate scope.
- Run a separate optional Personal Team signed-device acceptance when the owner
  is ready; paid distribution is not a prerequisite for the fallback path.
- Decide when the synthetic style categories have enough coverage to freeze a
  v1 response-shape baseline; do not infer that decision from an old thread
  status.
- Decide memory storage hardening before widening always-on use: schema
  migration, encryption/key handling, and retention classes.
