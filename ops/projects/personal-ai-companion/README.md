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

- Current status: Mixed local/live product. The canonical product checkout is clean at `934cec1`; a separate dirty `codex/pac-ios-product-polish` worktree contains the uncommitted iOS, HealthKit, cloud-auth, and branding work. The Xiaoxin API and authentication endpoints have native-Google dual-track deployment evidence dated 2026-07-13; a real native account exchange remains pending owner input. Dated deployment evidence is not proof of current live health.
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Complete one owner-driven native Google account exchange and verify account continuity, refresh, and logout. Then independently review and checkpoint the dirty product-polish worktree in bounded commits before converging it onto `934cec1`. Keep every live change and rollback anchor in `DEPLOYMENT_LEDGER.md`.
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
| StackChan App integration | The authenticated Bridge and bounded device-side/manual paths have real evidence. | `iOS App -> Bridge -> StackChan -> device` is not connected end to end. The current App-to-Bridge and App-adapter implementations remain mock/contract surfaces and must not inherit the standalone hardware result. |
| iOS product | The dirty `codex/pac-ios-product-polish` worktree at base commit `3019a8c` contains the local product pass: Xiaoxin branding and icon, local chat history with view/delete/export, device-cover import with bounded re-encoding/metadata removal, identity gate, keyboard/layout QA, and extensive Simulator/build/smoke evidence. See [the 2026-07-13 mainline report](reports/product-cloud-current-status-20260713.md). | None of this work is committed on that branch or present in the clean `934cec1` product checkout. Real-device signing, App Store distribution, production convergence, and App-to-StackChan end-to-end behavior remain unconfirmed. All three source tasks are now idle; the worktree is ready for a separate bounded closeout review, not a wholesale commit. |
| HealthKit | The dirty product-polish worktree contains a real read-only HealthKit adapter, entitlement/privacy declarations, a one-action system authorization sequence covering 15 categories, and a local summary boundary that sends only steps, activity energy, average heart rate, sleep duration, and workout count/duration into chat context. The recorded iOS 26.5 Simulator run discovered 215 standard and 3 per-object request types; build and 44/44 smoke evidence passed. | Apple still requires per-item owner consent; the callback cannot prove every item was granted. No real-device, signed distribution, regional Health Records, or real health-data read was accepted here. The very broad request surface carries App Store minimum-permission review risk, and the implementation remains uncommitted in the dirty worktree. |
| Xiaoxin cloud/auth | The 2026-07-13 task-specific L3 repair deployed native Google nonce/ID-token exchange as image `xiaoxin-cloud-api:20260713T0137-native-google`. A follow-up L3 repair disabled built-in email registration/login because mailbox ownership was not verified before token issuance. Public API/database/storage, Google JWKS proxying, native nonce issuance, legacy OIDC, disabled email routes, and the gray non-clickable App email button are freshly verified. SMS OTP remains disabled. See [the deployment ledger](DEPLOYMENT_LEDGER.md). | A real native Google account exchange, refresh rotation, and logout are not yet confirmed. The retained email credential is not deleted, but new password sessions are unavailable. The deployed source is not represented by a committed product revision, and signed real-device/App Store behavior remains unconfirmed. |
| Memory/privacy | Product branch `codex/initial-private-publish` was locally fast-forwarded from `121334c` to `934cec1`. The current checkout now includes the synthetic App/bridge foundations, persona-memory summary, explicit review-turn seam, bounded NFKC/compositional opt-out handling, targeted mixed-script credential blocking including compact Chinese `是/为` assignments, raw-free skip responses/audit, and a one-way transactional atom/review state machine. Post-merge verification passed `983` full Python tests, built the Swift App target, and passed AppFlow smoke; the focused branch evidence remains `24` seam and `447` related memory/privacy/API tests. See [the current memory-layer status](reports/memory-layer-current-status-20260711.md). | The fast-forward is local and has not been pushed; it is not live integration. The language/credential rules are deliberately bounded, not an exhaustive natural-language security classifier; obfuscation/confusables beyond NFKC and multi-process contention were not stress-tested. No real/private database or data path was inspected or validated. Automatic ordinary-chat extraction, semantic/vector retrieval, automatic conflict resolution, vault-at-rest store wiring, an authoritative retention producer/executor, hard deletion, memory-specific runtime authentication/admin UI, and real NAS/HealthKit/cloud memory authorization remain unimplemented or unconfirmed. Dirty iOS product-polish work is excluded. |
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
- `reports/product-cloud-current-status-20260713.md`
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

That local-first sequence was the original build order. The memory baseline is
now committed locally and Xiaoxin cloud/auth has dated live deployment evidence;
all further live work still requires the current L2/L3 gates above.

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
