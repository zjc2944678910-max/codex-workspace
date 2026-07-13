# Personal AI Companion Ops Surface

This directory is the operator-facing surface for `personal-ai-companion`.

## Routing Evidence

- Project name: `Personal AI Companion`
- Aliases: `stackchan-ai`, `stackchan-companion`, `personal-ai-companion`, `ai-companion`, `xiaoxin`, `小芯`, `长期记忆助手`, `桌面AI伴侣`
- Registry routing keywords: `StackChan`, `memory-service`, `长期记忆`, `个人AI伴侣`, `女友风格`, `HealthKit`, `AlarmKit`, `personal-ai-companion`, `Personal AI Companion`, `stackchan-ai`, `stackchan-companion`, `ai-companion`, `Xiaoxin`, `xiaoxin`, `小芯`, `xiaoxin.nodezjc12348888.xyz`, `auth.nodezjc12348888.xyz`, `长期记忆助手`, `桌面AI伴侣`
- Main code: `projects/products/personal-ai-companion`
- Ops surface: `ops/projects/personal-ai-companion`
- State/data: `state/project-data/personal-ai-companion`
- Scratch: `scratch/projects/personal-ai-companion`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `xiaoxin.nodezjc12348888.xyz`, `auth.nodezjc12348888.xyz`
- Service names: `xiaoxin-cloud-api`, `xiaoxin-vps-tunnel.service`
- Registry risk profile: `live_product`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Mixed local/live product. The remote canonical product branch
  `codex/initial-private-publish` is pushed at `199638a`. It retains the Xiaoxin
  iOS, five-type HealthKit, cloud-auth, branding, and owner-scoped storage work
  from the `e15e553` convergence, then adds the synthetic-verified memory quality
  and runtime-metadata phases. The local canonical checkout retains unrelated
  uncommitted StackChan E2E work and was not modified by the memory fast-forward.
  The owner completed a real native Google exchange and confirmed direct App
  entry after relaunch. Dated deployment evidence is not proof of current live
  health.
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Independently verify account continuity, forced token
  refresh, remote logout, and re-login. The static App-to-StackChan preflight is
  complete; implementing or executing its v0.1 LCD `happy -> neutral` slice is
  L3 and still requires fresh exact authorization. Keep every live change and
  rollback anchor in `DEPLOYMENT_LEDGER.md`.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. For live surfaces, provide only bounded, redacted, read-only evidence. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Current Program Control State (2026-07-13)

This section is the current ops-level fact index. It supersedes contradictory
completion wording in older manifests, reports, and running logs; those older
documents remain historical evidence, not an authorization to repeat live
actions. Status labels are defined in the [continuous program
runbook](runbooks/continuous-program-authorization-and-task-lifecycle.md).

| Surface | Confirmed current fact | Not confirmed / not authorized |
| --- | --- | --- |
| StackChan hardware | Bounded standalone checks are `field-confirmed` for the LCD expression path, audible playback, X/Y servo movement and return, active three-zone head-touch transitions, and one local low-resolution camera frame. The completed session ended with queue depth `0`, servos powered off, camera off, audio muted, and serial closed. See [the field-verification report](reports/stackchan-hardware-field-verification-20260711.md). | Whether a visible camera activity indicator activated was not verified. Repeated/unattended reliability, a full motion envelope, continuous boot polling, and any repeat execution remain unconfirmed and unauthorized. |
| StackChan App integration | The authenticated Bridge and bounded device-side/manual paths have real evidence. The 2026-07-13 static preflight selected the existing v0.1 LCD path for a future `happy -> ack -> neutral -> ack` slice. See [the preflight report](reports/app-bridge-stackchan-e2e-preflight-20260713.md). | `iOS App -> Bridge -> StackChan -> device` is not connected end to end. The App-facing adapter, credentials, result correlation, Bridge changes, and field execution remain L3 and unauthorized without fresh `进入修复阶段`. |
| iOS product | Remote product branch `codex/initial-private-publish` is pushed at `199638a`. The iOS/cloud product content remains the accepted `e15e553` convergence: Xiaoxin branding/icon, user-scoped local chat history and device covers, the identity gate, native Google plus Authentik rollback, and the reviewed logout-revocation queue. Its recorded evidence remains all `44/44` Swift smoke products, Core typecheck, App target build, and the iPhone 17 Pro Simulator Host build; the later memory-only source fast-forward passed `1072` Python tests. See [the 2026-07-13 mainline report](reports/product-cloud-current-status-20260713.md). | Real-device signing, App Store distribution, and App-to-StackChan end-to-end behavior remain unconfirmed. Legacy unscoped chat/cover files are preserved but deliberately not auto-migrated or loaded. The local canonical checkout has separate uncommitted StackChan E2E work. |
| HealthKit | The committed iOS host requests read-only access only for steps, active energy, heart rate, sleep, and workouts. Chat receives the same five bounded local trend-summary families. Health Records entitlement and clinical-purpose claims are absent; build and `44/44` smoke evidence passed. | Apple still requires per-item owner consent; the callback cannot prove every item was granted. No real-device, signed distribution, or real health-data read was accepted here. |
| Xiaoxin cloud/auth | The 2026-07-13 task-specific L3 repair deployed native Google nonce/ID-token exchange as image `xiaoxin-cloud-api:20260713T0137-native-google`. A follow-up L3 repair disabled built-in email registration/login because mailbox ownership was not verified before token issuance. The owner later completed a real native Google exchange and confirmed direct App entry after relaunch. Source is now committed at `b9a5d7b` and converged at `e15e553`. SMS OTP remains disabled. See [the deployment ledger](DEPLOYMENT_LEDGER.md). | Account/data continuity, a forced expired-token refresh, remote logout, and re-login were not directly verified by the owner. The retained email credential is not deleted, but new password sessions are unavailable. Signed real-device/App Store behavior remains unconfirmed. |
| Memory/privacy | Product branch `codex/initial-private-publish` is pushed at `199638a`. It contains the earlier explicit review/promotion and privacy seam plus Phase 2 canonical recall selection and Phase 3 nullable `fact_key`/`expires_at_ms` persistence, metadata-first disclosure, expiry filtering without deletion, and expiry-independent source-event replay. Independent acceptance passed `419` memory tests and `1072` full Python tests. See [the Phase 3 acceptance report](reports/memory-runtime-metadata-phase-3-20260713.md); the older [memory-layer status](reports/memory-layer-current-status-20260711.md) is retained as a historical baseline. | This is committed product source, not live memory integration or evidence of a real-database migration. No real/private database or data path was inspected. Automatic ordinary-chat extraction, semantic/vector retrieval, broad automatic conflict resolution, vault-at-rest store wiring, authoritative retention execution, hard deletion, memory runtime auth/admin UI, and real NAS/HealthKit/cloud memory authorization remain unimplemented or unconfirmed. |
| Style/persona | Local style mechanisms and synthetic evaluation surfaces are historical implementation evidence. The owner has attested consent for a future visual-likeness slice; no identifying material or consent text is stored here. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data use remain separate gates. |

The 12-hour authorization documented in the runbook expired at
`2026-07-11T11:22:52+08:00`. Its task protocol, stop rules, and non-overlapping
queue are in
[continuous-program-authorization-and-task-lifecycle.md](runbooks/continuous-program-authorization-and-task-lifecycle.md).
The later field-verification session, the 2026-07-12 Xiaoxin cloud/auth
deployment, and the 2026-07-13 native Google plus email-disable repairs each
used separate task-specific repair authorization. Their scope, backups,
verification, and rollback facts are historical evidence only; they do not
renew the expired program authorization or authorize another task. No new or
repeated L3 work may start until the owner gives fresh explicit authorization
for that named slice.

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
- `reports/memory-recall-quality-phase-2-20260713.md`
- `reports/memory-runtime-metadata-phase-3-20260713.md`
- `reports/product-cloud-current-status-20260713.md`
- `reports/app-bridge-stackchan-e2e-preflight-20260713.md`
- `reports/stackchan-hardware-field-verification-20260711.md`
- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Product Intent

`personal-ai-companion` is the dedicated project for the StackChan/iOS/NAS
personal AI companion discussed on 2026-07-04. The current user-facing product
name is `小芯` (`Xiaoxin`).

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
- Xiaoxin now has live API/authentication/DNS/tunnel surfaces. Route local code
  and docs as L0/L1, but treat any public endpoint, NAS, VPS, Cloudflare,
  Google Cloud, deployed image, database, or authentication investigation as
  L2 read-only and any change as L3 repair execution.

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

That local-first sequence was the original build order. The memory source through
Phase 3 is committed and pushed at canonical `199638a`, while Xiaoxin cloud/auth
has separate dated live deployment evidence; all further live work still
requires the current L2/L3 gates above.

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
