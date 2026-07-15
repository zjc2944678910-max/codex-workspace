# Personal AI Companion Product Blueprint v0.1

Date: 2026-07-15
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

## Component Boundaries

| Component | Owns | Does Not Own |
| --- | --- | --- |
| `personal-ai-companion` API | interaction envelopes, model routing, provider registry, MCP gateway, memory gates, usage ledger | raw phone access, direct public exposure |
| Style profile layer | bounded response-shape rules, diagnostics, rewrite guidance | pretending to be a real person without consent, raw chat truth |
| StackChan | embodied display/voice/action front end, local device status, simple launchers | secrets, memory database, primary model inference |
| iOS app | chat UI, device controls, health-source status, provider/profile selection, MCP tool status and confirmations, supported phone-action launchers, owner settings | provider secrets, arbitrary MCP execution, unpermissioned phone data, arbitrary app/message reading or background control |
| Provider registry + MCP gateway | encrypted server-side provider credentials, capability discovery, allowlisted MCP connections/tools, timeout/audit policy | silently enabling tools, exposing saved credentials to iOS, bypassing `ToolGate` |
| Health-source adapters | normalize owner-approved health inputs into the five canonical summary families | clinical diagnosis, hidden collection, treating inferred mood as fact |
| Memory service | session context, candidate memories, promoted atoms, deletion/explain flows | irreversible hidden learning, unreviewed sensitive memory promotion |
| NAS | private persistence, backups, search/vector jobs, optional local summaries | default internet-facing API |
| VPS | optional secure relay, remote reachability, queue/control plane | raw private memory store, broad device/admin control |

## Current Confirmed State

- Product `main@65d47b5` contains a source-gated authenticated chat path that is
  off by default. When enabled with its trusted dependencies, non-temporary
  turns persist atomically, temporary turns skip persistence, and expired
  bounded context is pruned at startup and periodically. That authenticated
  route explicitly disables memory-candidate writes. The same baseline freezes
  the transport-free v0.1 provider, MCP, phone-action, and five-family
  health-source contracts. No live chat or optional-integration vertical has
  been accepted. The [2026-07-15 contract acceptance](../reports/integration-contracts-v0.1-acceptance-20260715.md)
  passed `1299` tests at that exact commit with one existing
  Starlette/TestClient warning.
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
  `main@65d47b5`. This does not establish continuous boot polling, unattended
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
- Owner-configurable custom API providers, an MCP gateway/UI, general phone-app
  actions, health-source fallbacks, continuous StackChan command polling,
  production voice/camera workflows, and NAS/VPS production integration remain
  future phases.

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
- Let iOS show MCP connection/tool status, choose an allowed tool, collect
  arguments, and present confirmation. Do not run arbitrary untrusted MCP
  servers directly on the phone.

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
  source rather than the only health path.
- Add owner-triggered fallback adapters in this order: Shortcuts/webhook,
  manual Apple Health export, then selected wearable/provider APIs.
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
  contracts accepted at product `65d47b5` as the schema baseline. Runtime
  registries, adapters, execution paths, and settings screens remain separate
  tasks and must not widen those contracts silently.
- Select the first custom-provider vertical. The recommended first target is
  one synthetic OpenAI-compatible profile with server-side secret storage and
  an explicit owner-configured fallback allowlist. Without an allowed fallback,
  provider failure must return an error without invoking another provider.
- Select the first MCP vertical. The recommended first target is one local,
  allowlisted, read-only information tool with timeout and audit coverage.
- Select the first phone action from a target app that already exposes a
  Shortcut/App Intent, and verify it in mock/Simulator form before real-device
  execution.
- Decide whether the first health fallback should be a user-run Shortcut or a
  manual Apple Health export importer; both must map only to the five canonical
  families.
- Run a separate Personal Team signed-device acceptance when the owner is ready;
  paid distribution remains a future product decision, not a blocker.
- Decide when the synthetic style categories have enough coverage to freeze a
  v1 response-shape baseline; do not infer that decision from an old thread
  status.
- Decide memory storage hardening before widening always-on use: schema
  migration, encryption/key handling, and retention classes.
