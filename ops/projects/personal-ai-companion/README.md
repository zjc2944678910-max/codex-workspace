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
  source of truth and GitHub default branch are `main` at `7547d8a`; redundant
  compatibility refs `codex/initial-private-publish` and
  `codex/pac-google-logout-revocation-fix` were retired after the earlier
  fast-forward promotion. The canonical source retains the Xiaoxin iOS,
  five-type HealthKit, cloud auth, branding, owner-scoped storage, bounded
  StackChan LCD v0.1 E2E, synthetic-verified memory phases, the default-off
  Phase 4A/4B opt-in candidate writer, and now a source-gated authenticated chat
  path that is off by default. When enabled, non-temporary turns persist
  atomically and expired bounded context is pruned at startup and periodically;
  temporary turns skip persistence, and that authenticated route explicitly
  disables candidate writes. The same baseline now includes the accepted,
  transport-free provider/MCP/phone-action/health-source v0.1 contract package,
  the local encrypted custom-provider registry core, the bounded synthetic 9B
  runtime/owner API and redacted iOS provider status/selection integration, and
  the bounded local/mock MCP gateway slice accepted at product `2dc2948`, and
  the first bounded iOS system-share action accepted at product `7547d8a`.
  No live chat or live remote optional-integration vertical has been accepted.
  Historical and source-local evidence is not proof of current live health.
  The [integration-contract acceptance](reports/integration-contracts-v0.1-acceptance-20260715.md)
  passed `1299` tests at product `main@65d47b5`, with one existing
  Starlette/TestClient warning.
  The later [registry-core acceptance](reports/custom-provider-registry-v0.1-acceptance-20260715.md)
  passed `1384` tests at product `main@ad18cd0`, with the same warning.
  The [runtime-integration acceptance](reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md)
  passed `1417` tests and all `44` Swift executables at product
  `main@295687f`, with the same Python warning.
  The [MCP gateway acceptance](reports/mcp-gateway-readonly-v0.1-acceptance-20260715.md)
  passed `21` focused MCP tests and `1438` full Python tests at product
  `main@2dc2948`, with the same Python warning.
  The [supported App action acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md)
  passed `26` focused phone-contract tests, `1439` full Python tests, all
  `44/44` Swift smoke executables, and an unsigned Simulator Host build at
  product `main@7547d8a`, with the same Python warning.
  The owner field-confirmed one `happy` transaction and one safety-terminal
  `neutral` transaction with separate correlated acknowledgements; the final
  Bridge queue depth was `0`.
  The 2026-07-14 owner-acceptance pass confirmed a real expired-session refresh
  and refresh-token rotation. The owner then confirmed the selected Google
  account was the intended original account; sanitized live evidence showed the
  resulting owner has both native-Google and Authentik identities. App logout
  cleared local state, but its remote call returned `401` and exposed an iOS
  defect that discarded the unresolved pending marker. Repair commit `b8462a9`
  is retained in current `main@2dc2948`, and the single orphan family was
  revoked under a verified database backup. Same-account re-login and
  historical-data recovery remain owner-observed checkpoints. See the
  [acceptance report](reports/native-google-owner-acceptance-20260714.md).
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: start `PAC-HEALTH-SOURCE-ABSTRACTION` after the accepted
  local `PAC-IOS-SUPPORTED-APP-ACTION` slice. The supported action is limited to
  one fixed public capability card sent through the owner-visible system share
  sheet; it creates no app receipt/audit and cannot observe cancellation or
  target completion. The MCP slice remains limited to one local,
  allowlisted, read-only information tool with bounded timeout/output,
  metadata-only audit, and failure isolation. Keep remote MCP servers,
  state-changing tools, arbitrary iOS MCP execution, sensitive provider privacy
  classes, and real provider endpoints blocked. The owner may
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
| iOS product | Product `main` and the remote default branch are pushed at canonical `7547d8a`. Logout accepts only HTTP `204` as remote-revocation success and retains pending markers for `401`, `202`, and temporary failures. Authenticated chat is source-gated and off by default; when enabled, non-temporary turns persist atomically, temporary turns skip persistence, and expired bounded context is pruned at startup and periodically. The provider inventory/status client is separately default-off, owner-authenticated, and accepts only strict redacted responses. The supported App action is a fixed public `ShareLink` card in Status; it has no receipt/audit/completion observation. The [order 11 acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md) passed `1439` Python tests and all `44` Swift executables with one existing Python warning. | No live authenticated-chat vertical or account deletion is accepted. Custom-provider selection does not route the existing `owner_private` Chat flow through a `normal` provider. The product is personal/single-owner; public onboarding, multi-tenant administration, TestFlight, and App Store distribution are not current goals. The 12 expressions are App-local preview assets only; they are not a 12-expression live-device protocol. |
| Health sources / Apple membership | The committed iOS host requests read-only access only for steps, active energy, heart rate, sleep, and workouts. The iOS source can construct one bounded, trend-only chat-context summary from the same five families when both owner controls are enabled. Product `65d47b5` adds a transport-free, attributed five-family `HealthSourceSnapshot` contract with deterministic hashes and conflict-safe composition. Apple's current capability table lists basic HealthKit for free Apple Developer accounts, so Xcode Personal Team device testing remains possible without paid membership. | The new contract is not an adapter and is not wired to HealthKit or cloud chat. HealthKit collection authorization and off-device transmission are separate gates. No real-device read, real health-data acceptance, or authenticated cloud-chat health-summary transmission is accepted. Personal Team profiles expire after seven days and require periodic rebuild/reinstall; they do not provide TestFlight or App Store distribution. Shortcut/webhook, manual Apple Health export, and third-party provider adapters are planned, not implemented. |
| Provider, MCP, and phone-app integrations | Product `65d47b5` freezes the strict integration contracts and `ad18cd0` adds the encrypted registry core. Product `295687f` adds explicit caller-owned KEK/resource lifecycle, an injected-executor runtime, owner-authenticated CRUD/selection/fallback and conditional `normal` runtime routes, plus default-off redacted iOS status/selection. Product `2dc2948` adds the owner-authenticated local MCP gateway with exactly `server.local.context/context.today`, bounded execution, and metadata-only audit. Product `7547d8a` adds exactly one fixed public `companion.share_capabilities -> system.share_sheet` handoff through SwiftUI `ShareLink`. See the [9B manifest](manifests/custom-provider-runtime-integration-v0.1.md), [MCP manifest](manifests/mcp-gateway-readonly-v0.1.md), and [supported-action manifest](manifests/ios-supported-app-action-v0.1.md). | No KEK loader/rotation service, default provider network executor, trusted provider health prober, real provider/endpoint/credential, remote MCP server, state-changing MCP execution, durable audit store, live reconfiguration, deployment, or sensitive privacy class is accepted. The phone still cannot run arbitrary MCP servers or receive stored secrets. The share action does not read private cross-app data, observe cancellation, create a receipt/audit, or confirm target completion. General phone-app actions, arbitrary app control, background cross-app automation, and reading messages/notifications remain impossible or out of scope. |
| Xiaoxin cloud/auth | The running image remains `xiaoxin-cloud-api:20260713T0137-native-google`; health/readiness/capabilities pass with Google and Authentik available and email/OTP disabled. The owner confirmed the selected Google account was the intended original account, and sanitized live evidence showed both external identities on owner `d07f...`. Automatic refresh/rotation was confirmed earlier. Logout cleared Simulator Keychain state but returned `401`; the resulting single orphan family `b18f...` was revoked at `2026-07-14T14:22:57+08:00` under a verified backup. All other families and account/data counts remained unchanged. | Direct replay of the securely deleted old access/refresh credentials was not performed; rejection is supported by the inactive live family plus automated tests, not a live token replay. Same-account re-login and historical-data recovery remain unconfirmed. The retained email credential was not deleted. See [the acceptance report](reports/native-google-owner-acceptance-20260714.md). |
| Memory/privacy | Product `main` at `2dc2948` retains Phase 2 canonical recall selection, Phase 3 nullable `fact_key`/`expires_at_ms` persistence and metadata-first disclosure, plus Phase 4A/4B explicit opt-in admission and candidate-write wiring through `78103de`. The ordinary-chat writer is default-off and fails closed without a trusted owner resolver. The authenticated cloud-chat route is also off by default and explicitly disables candidate writes; when enabled, non-temporary turns persist bounded conversation context, temporary turns skip persistence, and expired context is pruned at startup and periodically. The [current full verification](reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md) passed `1417` Python tests at the pre-MCP `295687f` baseline; the subsequent MCP change does not alter memory behavior. See [the Phase 3 report](reports/memory-runtime-metadata-phase-3-20260713.md) and [Phase 4 readiness/update](reports/memory-phase-4-readiness-20260714.md). | This is committed product source, not a live authenticated-chat/long-term-memory integration or evidence of a real-database migration. Automatic extraction without explicit opt-in, production trusted-owner binding, semantic/vector retrieval, broad automatic conflict resolution, vault-at-rest store wiring, authoritative retention execution, hard deletion, memory runtime auth/admin UI, and real NAS/health-source/cloud memory authorization remain unimplemented or unconfirmed. |
| Style/persona | Local style mechanisms and synthetic evaluation surfaces are historical implementation evidence. The owner has attested consent for a future visual-likeness slice; no identifying material or consent text is stored here. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data use remain separate gates. |

Apple membership constraints above are grounded in Apple's
[membership comparison](https://developer.apple.com/support/compare-memberships/)
and [supported iOS capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios/).

## Current Source Interfaces

- `POST /v1/chat` is the canonical relay chat contract/source route. It must not
  be described as an accepted live authenticated iOS vertical.
- `POST /app/v0.1/lcd/commands` and
  `GET /app/v0.1/lcd/results/{bridge_request_id}` are the authenticated routes
  for the accepted bounded App-to-StackChan LCD slice.
- `POST /stackchan/events` is the device event/ACK correlation ingress used by
  that LCD slice.
- `personal_ai_companion.integrations` is the accepted, transport-free v0.1
  provider/MCP/phone-action/health-source schema package.
- `personal_ai_companion.integrations.mcp_gateway` is the accepted local-only
  MCP runtime for `server.local.context/context.today`; when a caller-injected
  gateway and trusted owner resolver are present, the Cloud app exposes
  `GET /v1/mcp/servers` and `POST /v1/mcp/call`. It has no default transport,
  remote discovery, state-changing tool, durable audit store, or iOS runtime.
- The iOS Status surface currently exposes only
  `companion.share_capabilities -> system.share_sheet` through SwiftUI
  `ShareLink`; the card is fixed/public, and the system handoff has no app
  receipt, durable audit, cancellation observation, or target-completion proof.
- `personal_ai_companion.providers` now includes the accepted local registry,
  explicit runtime-resource lifecycle, and injected-executor adapter. The Cloud
  composition root can expose owner-authenticated redacted management/selection
  plus conditional `normal` runtime routes, and iOS can show/select redacted
  profiles behind an explicit off-by-default flag. This is not a default network
  client, real-provider acceptance, health-probe authority, or main Chat route.
- The latest documented default companion cloud route is
  `claude-opus-4-6-thinking`; the private local-first Mac route uses
  `huihui_ai/qwen3.5-abliterated:9b`. These are source/config decisions, not
  proof of current provider availability or live health. Gemini remains an
  available route, not the latest documented default.

The 12-hour authorization documented in the runbook expired at
`2026-07-11T11:22:52+08:00`. Its status vocabulary, task protocol, and stop
rules remain in
[continuous-program-authorization-and-task-lifecycle.md](runbooks/continuous-program-authorization-and-task-lifecycle.md);
the current implementation queue is in `ARCHITECTURE_TODO.md`.
The later field-verification session, the 2026-07-12 Xiaoxin cloud/auth
deployment, and the 2026-07-13 native Google plus email-disable repairs each
used separate task-specific repair authorization. Their scope, backups,
verification, and rollback facts are historical evidence only; they do not
renew the expired program authorization or authorize another task. No new or
repeated L3 work may start until the owner gives fresh explicit authorization
for that named slice.

## Document Authority

Current authority:

- `README.md`: current fact index and risk boundary.
- `manifests/product-blueprint-v0.1.md`: current product direction.
- `ARCHITECTURE_TODO.md`: current engineering queue and dated implementation
  log.
- `DEPLOYMENT_LEDGER.md`: dated live-change and rollback history; it does not
  authorize repeat execution.

Normative contracts and active runbooks:

- `manifests/memory-layer-v0.1.md`
- `manifests/persona-memory-contract-v0.1.md`
- `manifests/app-bridge-contract-v0.1.md`
- `manifests/visual-likeness-consent-boundary-v0.1.md`
- `runbooks/mvp-build-order.md`
- `runbooks/stackchan-local-bridge.md`
- `runbooks/stackchan-command-protocol-v0.1.md`
- `runbooks/stackchan-app-adapter-contract-v0.1.md`
- `runbooks/continuous-program-authorization-and-task-lifecycle.md`

Dated planning and evidence snapshots:

- `manifests/architecture-decisions-2026-07-04.md`
- `manifests/integration-contracts-v0.1.md`
- `manifests/ios-supported-app-action-v0.1.md`
- `manifests/memory-layer-v0.1-implementation-readiness.md`
- `reports/`, including the current-baseline
  [integration-contract acceptance](reports/integration-contracts-v0.1-acceptance-20260715.md)
  and the [supported App action acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md)

When a dated report conflicts with the current authority above, preserve the
report as historical evidence and follow the newer current authority. A report
or expired runbook entry never authorizes repeating a live action.

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
retained in current canonical `main` at `2dc2948`, together with a source-gated,
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
