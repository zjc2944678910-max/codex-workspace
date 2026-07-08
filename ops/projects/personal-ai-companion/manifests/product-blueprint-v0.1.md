# Personal AI Companion Product Blueprint v0.1

Date: 2026-07-08
Status: north-star planning manifest

## North Star

Build a private personal AI companion that becomes more useful and emotionally
familiar over time. The product should combine a strong local/private memory
system, a consented style profile, a phone app, and an embodied StackChan
presence so the companion can talk, remember, notice context, and adapt its
tone without exposing private data unnecessarily.

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
  health summaries, and owner-visible settings.
- Private infrastructure: use NAS for private storage/search/local jobs and VPS
  only for narrow relay or remote-access roles that do not require raw private
  data exposure.

## Component Boundaries

| Component | Owns | Does Not Own |
| --- | --- | --- |
| `personal-ai-companion` API | interaction envelopes, model routing, memory gates, usage ledger | raw phone access, direct public exposure |
| Style profile layer | bounded response-shape rules, diagnostics, rewrite guidance | pretending to be a real person without consent, raw chat truth |
| StackChan | embodied display/voice/action front end, local device status, simple launchers | secrets, memory database, primary model inference |
| iOS app | chat UI, device controls, HealthKit authorization, owner settings | unpermissioned phone data, arbitrary app/message reading |
| Memory service | session context, candidate memories, promoted atoms, deletion/explain flows | irreversible hidden learning, unreviewed sensitive memory promotion |
| NAS | private persistence, backups, search/vector jobs, optional local summaries | default internet-facing API |
| VPS | optional secure relay, remote reachability, queue/control plane | raw private memory store, broad device/admin control |

## Current Confirmed State

- Local `/v1/chat` and memory skeleton exist.
- Style-profile work is active in thread
  `019f4054-6b58-74c1-ad8f-30354bffaf9b`; do not interrupt it unless the user
  explicitly redirects.
- StackChan is on official UIFlow2 StackChan v2.4.8 and can reach the local
  authenticated bridge.
- StackChan has verified manual entries for connectivity and short text chat.
- StackChan boot-time auto-start currently performs only the
  `DEVICE_CONNECTED` handshake.
- StackChan command protocol v0.1 now runs on the local authenticated bridge and
  has removable device files for manual polling. It covers `boot` events,
  `status`, `expression`, safe placeholder `motion/action`, public-safe
  `speak` through bridge-generated local WAV playback, `ack`, and `error`
  envelopes. It is not yet wired into boot auto-start, physical servo control,
  durable queues, or redelivery.
- Full voice, camera, continuous command polling, iOS app, HealthKit, NAS, and
  VPS production integration remain future phases.

## Phase Map

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
- Add HealthKit only through explicit user authorization and visible settings.
- Represent health signals as context and trends, not as certain emotion labels.

Acceptance anchors:

- User can inspect and disable each permissioned data source.
- Health-derived context is labeled as inference, not fact.
- The app can control StackChan through the relay without exposing raw secrets.

### Phase 3: Memory And Health Intelligence

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

### Phase 4: NAS And VPS Roles

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
- HealthKit data must be permission-scoped, locally inspectable, and deletable.
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

- Decide when the style-category thread has enough coverage to freeze a v1
  response-shape baseline.
- Decide whether the next StackChan repair should prioritize continuous polling
  auto-start, physical servo action mapping, richer voice selection, or durable
  command queue/redelivery.
- Decide the iOS MVP surface: text chat first, device control first, or health
  permission flow first.
- Decide memory storage hardening before widening always-on use: schema
  migration, encryption/key handling, and retention classes.
