# Personal AI Companion Ops Surface

This directory is the operator-facing surface for `personal-ai-companion`.

## Routing Evidence

- Project name: `Personal AI Companion`
- Aliases: `stackchan-ai`, `stackchan-companion`, `personal-ai-companion`, `ai-companion`, `长期记忆助手`, `桌面AI伴侣`
- Registry routing keywords: `StackChan`, `memory-service`, `长期记忆`, `个人AI伴侣`, `女友风格`, `HealthKit`, `AlarmKit`, `personal-ai-companion`, `Personal AI Companion`, `stackchan-ai`, `stackchan-companion`, `ai-companion`, `长期记忆助手`, `桌面AI伴侣`
- Main code: `projects/products/personal-ai-companion`
- Ops surface: `ops/projects/personal-ai-companion`
- State/data: `state/project-data/personal-ai-companion`
- Scratch: `scratch/projects/personal-ai-companion`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered product surface for `personal-ai-companion`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; add project-specific commands or runbooks when they become confirmed; promote durable conclusions out of scratch/session notes.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Current Program Control State (2026-07-11)

This section is the current ops-level fact index. It supersedes contradictory
completion wording in older manifests, reports, and running logs; those older
documents remain historical evidence, not an authorization to repeat live
actions. Status labels are defined in the [continuous program
runbook](runbooks/continuous-program-authorization-and-task-lifecycle.md).

| Surface | Confirmed current fact | Not confirmed / not authorized |
| --- | --- | --- |
| StackChan hardware | Bounded standalone checks are `field-confirmed` for the LCD expression path, audible playback, X/Y servo movement and return, active three-zone head-touch transitions, and one local low-resolution camera frame. The completed session ended with queue depth `0`, servos powered off, camera off, audio muted, and serial closed. See [the field-verification report](reports/stackchan-hardware-field-verification-20260711.md). | Whether a visible camera activity indicator activated was not verified. Repeated/unattended reliability, a full motion envelope, continuous boot polling, and any repeat execution remain unconfirmed and unauthorized. |
| StackChan App integration | The authenticated Bridge and bounded device-side/manual paths have real evidence. | `iOS App -> Bridge -> StackChan -> device` is not connected end to end. The current App-to-Bridge and App-adapter implementations remain mock/contract surfaces and must not inherit the standalone hardware result. |
| iOS MVP | Mock-only SwiftUI/package evidence and an unsigned Simulator Host pass exist locally. | Real LAN transport, real credentials/Keychain, signing, entitlements, real-device behavior, and real StackChan integration are blocked. |
| HealthKit | Mock permission states and design-time scope/rollback packets exist. | System consent, entitlement/signing, collection, and use of real health data are unconfirmed and outside the present program authority. |
| Memory/privacy | Product checkout `121334c` has a locally verified memory MVP: chat-integrated short-term context, reviewed candidate-to-promoted atoms, scoped recall/privacy projection, owner-confirmed admin/consent/class-policy flows, protected migration checks, isolated vault primitives, and synthetic retention admission/planning. Focused current-checkout verification passed `435` tests; see [the current memory-layer status](reports/memory-layer-current-status-20260711.md). | No real/private database or data path was inspected or validated. Vault-at-rest store wiring, an authoritative retention producer/executor, hard deletion, semantic/vector retrieval, automatic normalization/conflict handling, runtime authentication/admin UI, NAS/HealthKit/cloud authorization remain unimplemented or unconfirmed. Commit `3019a8c` adds a synthetic persona-memory summary contract but is not in the current checkout; dirty iOS product-polish work is excluded. |
| Style/persona | Local style mechanisms and synthetic evaluation surfaces are historical implementation evidence. The owner has attested consent for a future visual-likeness slice; no identifying material or consent text is stored here. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data use remain separate gates. |

The 12-hour authorization documented in the runbook expired at
`2026-07-11T11:22:52+08:00`. Its task protocol, stop rules, and non-overlapping
queue are in
[continuous-program-authorization-and-task-lifecycle.md](runbooks/continuous-program-authorization-and-task-lifecycle.md).
The later field-verification session used its own explicit repair entry and
sequential owner confirmations; that task-specific authority was consumed and
closed when the session returned the device to its recorded safe state. It does
not renew the expired program authority. No new or repeated L3 work may start
until the owner gives fresh explicit authorization for the named slice.

## Stable Docs

- `README.md`
- `manifests/product-blueprint-v0.1.md`
- `manifests/architecture-decisions-2026-07-04.md`
- `manifests/memory-layer-v0.1.md`
- `manifests/memory-layer-v0.1-implementation-readiness.md`
- `manifests/persona-memory-contract-v0.1.md`
- `manifests/app-bridge-contract-v0.1.md`
- `manifests/visual-likeness-consent-boundary-v0.1.md`
- `runbooks/mvp-build-order.md`
- `runbooks/stackchan-local-bridge.md`
- `runbooks/stackchan-command-protocol-v0.1.md`
- `runbooks/stackchan-app-adapter-contract-v0.1.md`
- `runbooks/continuous-program-authorization-and-task-lifecycle.md`
- `reports/memory-layer-current-status-20260711.md`
- `reports/stackchan-hardware-field-verification-20260711.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Product Intent

`personal-ai-companion` is the dedicated project for the StackChan/iOS/NAS
personal AI companion discussed on 2026-07-04.

The intended product is a private assistant and desktop companion with:

- StackChan as a small embodied front end, not the main model host.
- A user-owned relay server as the control plane and model router.
- Cloud model routes for Gemini and Claude via the user's gateway.
- Optional NAS local model routes for private/offline or lightweight work.
- A long-term memory system that is inspectable, explainable, and forgettable.
- An iOS companion app that uses permission-scoped integrations only.
- Optional chat-log style modeling only with explicit consent from the person
  being modeled.

## Routing Guardrails

- Mentions of `StackChan`, `桌面AI伴侣`, `个人AI伴侣`, this memory-service
  design, HealthKit/AlarmKit integration for the companion app, or girlfriend
  style-profile planning should route here.
- OpenClaw/benben is a design reference only. Do not route this product to
  `ops/projects/openclaw` unless the user explicitly asks about OpenClaw,
  benben, oc-nas, or an OpenClaw file/path/service.
- Sub2API is a model gateway dependency/reference only. Do not route this
  product to `ops/projects/sub2api` unless the user explicitly asks about
  Sub2API gateway operations, live health, routing, or deployment.
- If the relay server, NAS deployment, DNS, or production app is later made
  live, re-evaluate the risk profile before state-changing work. Until then,
  local docs and code are L0/L1.

## Current Architecture Decision

Use the benben vNext ideas as patterns, not as a service clone:

- `InteractionEnvelope`: normalize every inbound event before memory/model work.
- `IdentityKernel`: bind user, girlfriend/partner, assistant, device, and
  relationship identities structurally.
- `PrivacyKernel`: filter memory by viewer, device, delivery mode, and consent.
- `MemoryService`: separate short-term session deltas, candidate memories,
  review queues, and promoted long-term memory atoms.
- `MemoryAdmin`: owner-visible search, explain, approve, reject, delete, and
  forget flows.
- `ToolGate`: require explicit owner confirmation for state-changing actions.

The first implementation should build the relay and memory-service locally
before changing StackChan firmware or deploying anything to NAS.

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are
local-only by default and are not part of the workspace-index repository
surface.
