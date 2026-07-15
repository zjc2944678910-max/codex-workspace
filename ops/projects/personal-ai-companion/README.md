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

- Current status: Mixed local/live, single-owner personal product. The product
  source of truth and GitHub default branch are `main` at `72258a1`; redundant
  compatibility refs `codex/initial-private-publish` and
  `codex/pac-google-logout-revocation-fix` were retired after the earlier
  fast-forward promotion. The canonical source retains the Xiaoxin iOS,
  five-type HealthKit, cloud auth, branding, owner-scoped storage, bounded
  StackChan LCD v0.1 E2E, synthetic-verified memory phases, the default-off
  Phase 4A/4B opt-in candidate writer, and now a source-gated authenticated chat
  path that is off by default. When enabled, non-temporary turns persist
  atomically and expired bounded context is pruned at startup and periodically;
  temporary turns skip persistence. No live chat vertical has been accepted.
  Historical and source-local evidence is not proof of current live health.
  The 2026-07-15 local full-suite check passed `1197` tests with one
  existing Starlette/TestClient warning.
  The owner field-confirmed one `happy` transaction and one safety-terminal
  `neutral` transaction with separate correlated acknowledgements; the final
  Bridge queue depth was `0`.
  The 2026-07-14 owner-acceptance pass confirmed a real expired-session refresh
  and refresh-token rotation. The owner then confirmed the selected Google
  account was the intended original account; sanitized live evidence showed the
  resulting owner has both native-Google and Authentik identities. App logout
  cleared local state, but its remote call returned `401` and exposed an iOS
  defect that discarded the unresolved pending marker. Repair commit `b8462a9`
  is retained in current `main@72258a1`, and the single orphan family was
  revoked under a verified database backup. Same-account re-login and
  historical-data recovery remain owner-observed checkpoints. See the
  [acceptance report](reports/native-google-owner-acceptance-20260714.md).
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Freeze the provider/MCP/phone-action/health-source contracts,
  then implement one custom OpenAI-compatible provider profile and one
  allowlisted read-only MCP vertical before widening integrations. The owner may
  separately perform one
  same-account Google re-login to finish the remaining lifecycle checkpoint;
  Codex must not enter or inspect credentials. The bounded App-to-StackChan
  v0.1 LCD slice is accepted and closed; any repeat field execution, reliability
  run, live allowlist expansion, or additional hardware capability is a new task
  with a fresh risk gate. Keep every live change and rollback anchor in
  `DEPLOYMENT_LEDGER.md`.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. For live surfaces, provide only bounded, redacted, read-only evidence. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Current Program Control State (2026-07-15)

This section is the current ops-level fact index. It supersedes contradictory
completion wording in older manifests, reports, and running logs; those older
documents remain historical evidence, not an authorization to repeat live
actions. Status labels are defined in the [continuous program
runbook](runbooks/continuous-program-authorization-and-task-lifecycle.md).

| Surface | Confirmed current fact | Not confirmed / not authorized |
| --- | --- | --- |
| StackChan hardware | Bounded standalone checks are `field-confirmed` for the LCD expression path, audible playback, X/Y servo movement and return, active three-zone head-touch transitions, and one local low-resolution camera frame. The completed session ended with queue depth `0`, servos powered off, camera off, audio muted, and serial closed. See [the field-verification report](reports/stackchan-hardware-field-verification-20260711.md). | Whether a visible camera activity indicator activated was not verified. Repeated/unattended reliability, a full motion envelope, continuous boot polling, and any repeat execution remain unconfirmed and unauthorized. |
| StackChan App integration | On 2026-07-13 the owner observed the App-driven v0.1 sequence `happy -> correlated ACK -> neutral -> correlated ACK`; the final screen was `neutral` and Bridge queue depth was `0`. Durable source is pushed at product commit `9dbfafc`; malformed ACK-like events are now rejected by the real `/stackchan/events` HTTP route with queue/result state unchanged. The source also contains the App client, Keychain-backed credential seam, authenticated command/result routes, TTL/idempotency handling, Host injection, and Simulator-only UI build target. See [the acceptance report](reports/app-bridge-stackchan-e2e-acceptance-20260713.md). | This accepts one bounded sequence, not repeated/unattended reliability or a production deployment expansion. The real v0.1 live allowlist remains only `happy` and `neutral`; audio, motion, camera, touch, memory, HealthKit, background polling, firmware, and other hardware remain outside this slice. |
| iOS product | Product `main` and the remote default branch are pushed at canonical `72258a1`. Logout accepts only HTTP `204` as remote-revocation success and retains pending markers for `401`, `202`, and temporary failures. Authenticated chat is source-gated and off by default; when enabled, non-temporary turns persist atomically, temporary turns skip persistence, and expired bounded context is pruned at startup and periodically. The 2026-07-15 local full-suite check passed `1197` Python tests with one existing warning; prior AppFlow smoke, Ruff, Swift App build, and Simulator Host build evidence remains valid. | No live authenticated-chat vertical or account deletion is accepted. The product is personal/single-owner; public onboarding, multi-tenant administration, TestFlight, and App Store distribution are not current goals. The 12 expressions are App-local preview assets only; they are not a 12-expression live-device protocol. |
| Health sources / Apple membership | The committed iOS host requests read-only access only for steps, active energy, heart rate, sleep, and workouts. Chat receives the same five bounded local trend-summary families. Apple's current capability table lists basic HealthKit for free Apple Developer accounts, so Xcode Personal Team device testing remains possible without paid membership. The existing HealthKit adapter will become one optional adapter behind the planned `HealthSource` boundary. | Apple still requires per-item owner consent; the callback cannot prove every item was granted. Personal Team profiles expire after seven days and require periodic rebuild/reinstall; they do not provide TestFlight or App Store distribution. No real-device or real health-data read was accepted. Shortcut/webhook, manual Apple Health export, and third-party provider adapters are planned, not implemented. |
| Provider, MCP, and phone-app integrations | Existing model routing and the source-gated, default-off authenticated chat path provide a backend base. The accepted direction is a server-side custom-provider registry, backend MCP gateway, and iOS status/selection/confirmation UI. Supported phone actions are limited to App Intents, Shortcuts, URL schemes, universal links, and share sheets exposed by target apps. | Owner-configurable provider profiles, MCP connections/tools, their iOS UI, and general phone-app actions are not implemented. Stored provider/MCP secrets must not be returned to iOS. Arbitrary app control, background cross-app automation, and reading messages/notifications remain impossible or out of scope. |
| Xiaoxin cloud/auth | The running image remains `xiaoxin-cloud-api:20260713T0137-native-google`; health/readiness/capabilities pass with Google and Authentik available and email/OTP disabled. The owner confirmed the selected Google account was the intended original account, and sanitized live evidence showed both external identities on owner `d07f...`. Automatic refresh/rotation was confirmed earlier. Logout cleared Simulator Keychain state but returned `401`; the resulting single orphan family `b18f...` was revoked at `2026-07-14T14:22:57+08:00` under a verified backup. All other families and account/data counts remained unchanged. | Direct replay of the securely deleted old access/refresh credentials was not performed; rejection is supported by the inactive live family plus automated tests, not a live token replay. Same-account re-login and historical-data recovery remain unconfirmed. The retained email credential was not deleted. See [the acceptance report](reports/native-google-owner-acceptance-20260714.md). |
| Memory/privacy | Product `main` at `72258a1` retains Phase 2 canonical recall selection, Phase 3 nullable `fact_key`/`expires_at_ms` persistence and metadata-first disclosure, plus Phase 4A/4B explicit opt-in admission and candidate-write wiring through `78103de`. The ordinary-chat writer is default-off and fails closed without a trusted owner resolver. Authenticated chat is also off by default; when enabled, non-temporary turns persist atomically, temporary turns skip persistence, and expired bounded context is pruned at startup and periodically. Current full verification passed `1197` Python tests. See [the Phase 3 report](reports/memory-runtime-metadata-phase-3-20260713.md) and [Phase 4 readiness/update](reports/memory-phase-4-readiness-20260714.md). | This is committed product source, not a live authenticated-chat/long-term-memory integration or evidence of a real-database migration. Automatic extraction without explicit opt-in, production trusted-owner binding, semantic/vector retrieval, broad automatic conflict resolution, vault-at-rest store wiring, authoritative retention execution, hard deletion, memory runtime auth/admin UI, and real NAS/health-source/cloud memory authorization remain unimplemented or unconfirmed. |
| Style/persona | Local style mechanisms and synthetic evaluation surfaces are historical implementation evidence. The owner has attested consent for a future visual-likeness slice; no identifying material or consent text is stored here. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data use remain separate gates. |

Apple membership constraints above are grounded in Apple's
[membership comparison](https://developer.apple.com/support/compare-memberships/)
and [supported iOS capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios/).

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
- `reports/memory-phase-4-readiness-20260714.md`
- `reports/product-cloud-current-status-20260713.md`
- `reports/native-google-owner-acceptance-20260714.md`
- `reports/healthkit-release-readiness-20260713.md`
- `reports/app-bridge-stackchan-e2e-preflight-20260713.md`
- `reports/app-bridge-stackchan-e2e-acceptance-20260713.md`
- `reports/stackchan-hardware-field-verification-20260711.md`
- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Product Intent

`personal-ai-companion` is the dedicated project for the StackChan/iOS/NAS
personal AI companion discussed on 2026-07-04. It is intended for one owner,
not as a public multi-tenant service. The current user-facing product name is
`小芯` (`Xiaoxin`).

The intended product is a private assistant and desktop companion with:

- StackChan as a small embodied front end, not the main model host.
- A user-owned relay server as the control plane and model router.
- Cloud model routes for Gemini and Claude via the user's gateway.
- An owner-configurable backend provider registry for OpenAI-compatible,
  Gemini/Claude, Sub2API, and Ollama/NAS profiles, with secrets kept off iOS.
- An allowlisted backend MCP gateway with read-only defaults, audit logs, and
  explicit confirmation for state-changing tools.
- Optional NAS local model routes for private/offline or lightweight work.
- A long-term memory system that is inspectable, explainable, and forgettable.
- An iOS companion app that uses permission-scoped integrations only, exposes
  supported phone actions, and treats HealthKit as one optional health source.
- Optional chat-log style modeling only with explicit consent from the person
  being modeled.

## Routing Guardrails

- Mentions of `StackChan`, `桌面AI伴侣`, `个人AI伴侣`, this memory-service
  design, HealthKit/AlarmKit integration, MCP/custom-provider integration for
  Xiaoxin, supported phone-app actions for the Xiaoxin companion app, or
  girlfriend style-profile planning should route here.
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
- `ProviderRegistry`: keep provider profiles/capabilities and encrypted
  credentials in the backend; iOS selects profiles without retrieving secrets.
- `MCPGateway`: broker only allowlisted servers/tools, read-only by default, with
  timeout, audit, and `ToolGate` enforcement.
- `HealthSource`: normalize optional HealthKit, Shortcut/webhook, manual export,
  and third-party inputs into the same five bounded health families.
- `PhoneActionGateway`: use only supported App Intents, Shortcuts, URL schemes,
  universal links, and share sheets; never promise arbitrary app control.

That local-first sequence was the original build order. Memory Phase 3 landed at
`199638a`; default-off Phase 4A/4B source followed through `78103de`. Both are
retained in current canonical `main` at `72258a1`, together with a source-gated,
default-off authenticated chat path. When enabled, non-temporary turns persist
atomically and expired bounded context is pruned at startup and periodically;
temporary turns skip persistence. No live chat vertical is accepted. Xiaoxin
cloud/auth has separate dated live deployment evidence. All further live work
still requires the current L2/L3 gates above.

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
