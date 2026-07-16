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
  source of truth and GitHub default branch are `main` at `54a069a`; redundant
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
  the bounded local/mock MCP gateway slice accepted at product `2dc2948`, the
  first bounded iOS system-share action accepted at product `7547d8a`, the
  additive health-source seam accepted at product `b6209a7`, the owner-summary
  intake contract accepted at product `4a8b52e`, fixture-only manual-export
  normalization accepted at product `0665fd3`, and the default-off off-device
  consent contract accepted at product `bff7398`. Product `c0cd301` adds the
  local qualitative health-analysis contract with controlled explanation,
  uncertainty, and categorical chart metadata. Product `2360cba` adds the
  explicitly injected, default-absent owner Shortcut analysis API over those
  accepted contracts. Product `09b86c7` adds the fixed local 21+7-day Shortcut
  aggregation policy and an owner-buildable recipe that stops at JSON preview.
  Product `7905b12` adds the local/default-off owner-bound credential scoped
  only to Shortcut analysis, with digest-only persistence and individual
  revocation; it adds no real issuance, phone storage/action, or deployment.
  Product `c550d4b` adds the independently default-off iOS Provider-management
  and exact local read-only MCP call UI, plus revision-safe Provider deletion.
  It is accepted only for local synthetic/Simulator use; no real Provider,
  secret, remote MCP server, deployment, or private data was exercised.
  Product `54a069a` adds six strictly typed Chat proposals for alarm creation,
  calendar-event creation, reminder creation, and Apple Music play/pause/next.
  Every proposal requires an explicit owner confirmation and expires within
  five minutes. Personal Team build, install, and launch are confirmed, while
  real permission prompts and native side effects remain unconfirmed.
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
  passed `21` focused MCP tests and `1438` full Python tests at feature anchor
  product `main@2dc2948`, with the same Python warning.
  The [supported App action acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md)
  passed `26` focused phone-contract tests, `1439` full Python tests, all
  `44/44` Swift smoke executables, and an unsigned Simulator Host build at
  product `main@7547d8a`, with the same Python warning.
  The order 12 health-source acceptance passed `24` focused health tests,
  `1439` full Python tests, all `44/44` Swift smoke executables, Core/App
  builds, and an unsigned Simulator Host build at the order-12 anchor product
  `main@b6209a7`.
  The owner-summary follow-up is accepted at product `main@4a8b52e`: its
  focused intake tests passed `36`, the combined health checks passed `60`,
  and the full Python suite passed `1475` with the same existing warning. It
  changes no Swift target, transport, device, or cloud behavior.
  The fixture-only [manual-export normalization acceptance](reports/health-manual-export-normalization-v0.1-acceptance-20260715.md)
  is accepted at product `main@0665fd3`: its focused tests passed `43`, the
  combined health checks passed `103`, and the full Python suite passed `1518`
  with the same warning. It changes no Swift adapter, file intake, device,
  network, or cloud behavior.
  The [off-device consent acceptance](reports/health-off-device-consent-contract-v0.1-acceptance-20260715.md)
  is accepted at product `main@bff7398`: its focused tests passed `55`, the
  combined health checks passed `158`, and the full Python suite passed `1573`
  with the same warning. It adds no network/API route, model execution, consent
  persistence, authenticated-chat wiring, Swift source, or iOS UI.
  The [qualitative analysis acceptance](reports/health-analysis-contract-v0.1-acceptance-20260715.md)
  is accepted at product `main@c0cd301`: its focused tests passed `65`, the
  combined health checks passed `223`, and the full Python suite passed `1638`
  with the same warning. It adds no free-form narrative, numeric health value,
  provider/model execution, network/API route, persistence, chat wiring, Swift
  source, or iOS UI.
  The [owner Shortcut analysis API acceptance](reports/health-owner-shortcut-analysis-api-v0.1-acceptance-20260715.md)
  is accepted at product `main@2360cba`: `16` focused API tests, `349` combined
  Cloud/health tests, and `1654` full Python tests passed with the same warning.
  The route is absent unless both its service and trusted owner resolver are
  injected; no deployed composition, Shortcut recipe/token handoff, persistence,
  provider/model execution, chat wiring, Swift source, or iOS UI was added.
  The [owner Shortcut aggregation acceptance](reports/health-owner-shortcut-aggregation-v0.1-acceptance-20260716.md)
  is accepted at product `main@09b86c7`: `34` focused aggregation tests, `273`
  combined health-chain tests, and `1688` full Python tests passed with the same
  warning. It adds a pure local policy and reference recipe, but no installed
  Shortcut, real sample read, credential, HTTP call, deployment, Swift source,
  or iOS UI.
  The [Shortcut-scoped credential acceptance](reports/health-shortcut-scoped-credential-v0.1-acceptance-20260716.md)
  is accepted at product `main@7905b12`: `10` dedicated credential tests, `283`
  combined health-chain tests, and `1698` full Python tests passed with the same
  warning. Analysis now accepts only the dedicated owner-bound credential when
  explicitly composed; account access/refresh tokens cannot authorize it. No
  real issuance/handoff, HTTPS action, deployment, expiry/rotation, rate limit,
  Swift source, iOS UI, or real health transfer was added.
  The [conversational native-action acceptance](reports/ios-conversational-native-actions-v0.1-acceptance-20260716.md)
  is accepted at product `main@54a069a`: full Swift/App builds, the affected
  smoke set, Simulator and Personal Team device builds, device install/launch,
  synthetic mobile/tablet/accessibility visual QA, and `1711` Python tests
  passed. Media search is limited to the owner's system library; no real alarm,
  event, reminder, playback effect, permission prompt, or deployment was used.
  The owner field-confirmed one `happy` transaction and one safety-terminal
  `neutral` transaction with separate correlated acknowledgements; the final
  Bridge queue depth was `0`.
  The 2026-07-14 owner-acceptance pass confirmed a real expired-session refresh
  and refresh-token rotation. The owner then confirmed the selected Google
  account was the intended original account; sanitized live evidence showed the
  resulting owner has both native-Google and Authentik identities. App logout
  cleared local state, but its remote call returned `401` and exposed an iOS
  defect that discarded the unresolved pending marker. Repair commit `b8462a9`
  is retained in current `main@54a069a`, and the single orphan family was
  revoked under a verified database backup. Same-account re-login and
  historical-data recovery remain owner-observed checkpoints. See the
  [acceptance report](reports/native-google-owner-acceptance-20260714.md).
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: no post-native-actions implementation slice is currently selected.
  `PAC-IOS-CONVERSATIONAL-NATIVE-ACTIONS` is accepted locally at product
  `54a069a` as queue order 13. Chat can propose only the six fixed native action
  kinds and can execute one only after the owner taps confirm; Simulator uses a
  mock executor and the real adapter remains permission- and availability-gated.
  `PAC-HEALTH-SHORTCUT-SCOPED-CREDENTIAL` is accepted locally at product
  `7905b12`, completing the bounded sequence from the health-source boundary;
  fixture-only owner summary/manual normalization; off-device consent;
  qualitative analysis; default-absent analysis API; local aggregation recipe;
  and strict route-scoped authentication. These slices follow the accepted
  `PAC-IOS-SUPPORTED-APP-ACTION`. The supported action is limited to one
  fixed public capability card sent through the owner-visible system share
  sheet; it creates no app receipt/audit and cannot observe cancellation or
  target completion. The health contracts are synthetic and transport-free;
  they do not read a file, open a network connection, invoke a Shortcut, call a
  model, or expose iOS UI. The analysis contract adds only fingerprint-bound,
  non-diagnostic categorical metadata. The owner-only API composes those
  contracts but has no default route mount, health persistence, model prose, or
  chart. The 12F policy and reference recipe build only local
  qualitative JSON; they do not install/run a Shortcut, query a real phone, or
  call the API. Order 12G adds a dedicated revocable opaque credential scoped
  only to health analysis, but it adds no real issuance/handoff or phone HTTP
  action. Existing access/refresh tokens cannot authorize analysis and must not
  be embedded in Shortcuts. Selecting a deployed health route, real credential,
  HTTPS action, or real transfer is separate L3 work.
  A Personal Team device build, install, and launch are confirmed for the
  current Host, but no real AlarmKit, EventKit, reminder, media-library, or
  playback action was executed.
  The MCP slice remains limited to one local,
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

## Current Program Control State (2026-07-16)

This section is the current ops-level fact index. It supersedes contradictory
completion wording in older manifests, reports, and running logs; those older
documents remain historical evidence, not an authorization to repeat live
actions. Status labels are defined in the [continuous program
runbook](runbooks/continuous-program-authorization-and-task-lifecycle.md).

| Surface | Confirmed current fact | Not confirmed / not authorized |
| --- | --- | --- |
| StackChan hardware | Bounded standalone checks are `field-confirmed` for the LCD expression path, audible playback, X/Y servo movement and return, active three-zone head-touch transitions, and one local low-resolution camera frame. The completed session ended with queue depth `0`, servos powered off, camera off, audio muted, and serial closed. See [the field-verification report](reports/stackchan-hardware-field-verification-20260711.md). | Whether a visible camera activity indicator activated was not verified. Repeated/unattended reliability, a full motion envelope, continuous boot polling, and any repeat execution remain unconfirmed and unauthorized. |
| StackChan App integration | On 2026-07-13 the owner observed the App-driven v0.1 sequence `happy -> correlated ACK -> neutral -> correlated ACK`; the final screen was `neutral` and Bridge queue depth was `0`. Durable source is pushed at product commit `9dbfafc`; malformed ACK-like events are now rejected by the real `/stackchan/events` HTTP route with queue/result state unchanged. The source also contains the App client, Keychain-backed credential seam, authenticated command/result routes, TTL/idempotency handling, Host injection, and Simulator-only UI build target. See [the acceptance report](reports/app-bridge-stackchan-e2e-acceptance-20260713.md). | This accepts one bounded sequence, not repeated/unattended reliability or a production deployment expansion. The real v0.1 live allowlist remains only `happy` and `neutral`; audio, motion, camera, touch, memory, HealthKit, background polling, firmware, and other hardware remain outside this slice. |
| iOS product | Product `main` and the remote default branch are pushed at canonical `54a069a`. Logout retains the existing revocation safeguards and authenticated cloud chat remains source-gated/off by default. Status conditionally exposes single-owner Provider create/replace/delete/validation and the exact local read-only MCP call behind independent default-off bundle gates; the formal `Info.plist` enables neither. Chat now recognizes exactly six local native-action proposals, requires a confirmation tap, and preserves ordinary Chat for ambiguous or unrecognized text. Personal Team build/install/launch are confirmed. | No live authenticated-chat vertical or account deletion is accepted. Provider validation does not route existing Chat through a custom Provider. No real native-action permission or side effect, Provider secret/server or MCP server evidence, remote/state-changing MCP, deployment, public onboarding, multi-tenant administration, TestFlight, or App Store distribution is accepted. |
| Health sources / Apple membership | Product `b6209a7` is the order-12 source-seam anchor; products `4a8b52e`, `0665fd3`, `bff7398`, and `c0cd301` add the owner intake, fixture-only manual-export normalization, single-request off-device consent, and qualitative analysis contracts. Product `2360cba` adds the explicitly injected owner-only API, `09b86c7` adds the fixed 21+7-day local aggregation policy/reference recipe, and `7905b12` adds the dedicated owner-bound credential scoped only to analysis with digest-only persistence and individual revocation. HealthKit remains optional implemented code; no paid Apple Developer Program membership is assumed for the personal MVP. | No real HealthKit authorization/sample result, real `export.xml`/ZIP/file parsing, installed/executed iPhone Shortcut, real credential issuance/handoff/storage, phone HTTP action, HTTPS/rate-limited deployed health route, credential expiry/rotation, third-party adapter, consent persistence/UI, authenticated cloud-chat health transmission, provider/model narrative, durable replay protection, free-form analysis, or chart UI is accepted. The Python module cannot prove local-midnight alignment, and automated tests do not prove real Shortcuts action availability. Collection/import scopes cannot substitute for off-device transfer consent. The Personal Team confirmation at `54a069a` covers the current Host build/install only, not HealthKit behavior. |
| Provider, MCP, and phone-app integrations | Product `65d47b5` freezes the strict contracts, `ad18cd0` adds the encrypted registry, `295687f` adds the bounded owner/runtime API, and `2dc2948` adds exactly `server.local.context/context.today`. Product `c550d4b` adds default-off single-owner Provider management and the exact read-only MCP call UI; saved private fields never return to iOS and arbitrary MCP inputs are unreachable. Product `7547d8a` adds the fixed public share-sheet handoff, and `54a069a` adds confirmed-before-execution local AlarmKit/EventKit/MediaPlayer actions with owner-library-only media search. See the [owner-tools manifest](manifests/ios-owner-tools-v0.1.md), [owner-tools acceptance](reports/ios-owner-tools-v0.1-acceptance-20260716.md), and [native-action acceptance](reports/ios-conversational-native-actions-v0.1-acceptance-20260716.md). | No KEK loader/rotation service, default Provider executor, trusted health prober, real Provider/endpoint/credential, remote MCP server, state-changing MCP execution, durable audit store, live reconfiguration, catalog-wide MusicKit, background automation, deployment, or sensitive privacy class is accepted. The phone cannot run arbitrary MCP servers or receive stored secrets, and no real native side effect was used for acceptance. |
| Xiaoxin cloud/auth | The running image remains `xiaoxin-cloud-api:20260713T0137-native-google`; health/readiness/capabilities pass with Google and Authentik available and email/OTP disabled. The owner confirmed the selected Google account was the intended original account, and sanitized live evidence showed both external identities on owner `d07f...`. Automatic refresh/rotation was confirmed earlier. Logout cleared Simulator Keychain state but returned `401`; the resulting single orphan family `b18f...` was revoked at `2026-07-14T14:22:57+08:00` under a verified backup. All other families and account/data counts remained unchanged. | Direct replay of the securely deleted old access/refresh credentials was not performed; rejection is supported by the inactive live family plus automated tests, not a live token replay. Same-account re-login and historical-data recovery remain unconfirmed. The retained email credential was not deleted. See [the acceptance report](reports/native-google-owner-acceptance-20260714.md). |
| Memory/privacy | Product `main@54a069a` retains Phase 2 canonical recall selection, Phase 3 nullable `fact_key`/`expires_at_ms` persistence and metadata-first disclosure, plus Phase 4A/4B explicit opt-in admission and candidate-write wiring through `78103de`. The ordinary-chat writer is default-off and fails closed without a trusted owner resolver. The authenticated cloud-chat route is also off by default and explicitly disables candidate writes; when enabled, non-temporary turns persist bounded conversation context, temporary turns skip persistence, and expired bounded context is pruned at startup and periodically. The 12F/12G, owner-tools, and native-action changes preserve the memory boundary. See [the Phase 3 report](reports/memory-runtime-metadata-phase-3-20260713.md) and [Phase 4 readiness/update](reports/memory-phase-4-readiness-20260714.md). | This is committed product source, not a live authenticated-chat/long-term-memory integration or evidence of a real-database migration. Automatic extraction without explicit opt-in, production trusted-owner binding, semantic/vector retrieval, broad automatic conflict resolution, vault-at-rest store wiring, authoritative retention execution, hard deletion, memory runtime auth/admin UI, and real NAS/health-source/cloud memory authorization remain unimplemented or unconfirmed. |
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
  provider/MCP/phone-action/health-source schema package, including the
  owner-authored `OwnerHealthSummaryIntake` contract.
- `POST /v1/health/shortcut-analysis` is the accepted local/synthetic
  owner-only composition route. It exists only when both
  `HealthShortcutAnalysisService` and a trusted owner resolver are injected;
  the default factory exposes no route. In that composition it accepts only the
  dedicated `health:shortcut-analysis` credential. Account-authenticated
  `POST/GET /v1/health/shortcut-credentials` and
  `DELETE /v1/health/shortcut-credentials/{credential_id}` issue once, list
  metadata, and revoke individually. Only credential metadata/digest persists;
  health analysis still has no health-data persistence, model, chat, Swift/iOS
  caller, or deployed composition.
- `personal_ai_companion.integrations.mcp_gateway` is the accepted local-only
  MCP runtime for `server.local.context/context.today`; when a caller-injected
  gateway and trusted owner resolver are present, the Cloud app exposes
  `GET /v1/mcp/servers` and `POST /v1/mcp/call`. It has no default transport,
  remote discovery, state-changing tool, or durable audit store. The default-off
  iOS surface can call only the exact projected tool and accepts no arbitrary
  server, tool, URL, or schema input.
- The iOS Status surface exposes the fixed public
  `companion.share_capabilities -> system.share_sheet` action through SwiftUI
  `ShareLink`. The Chat surface separately recognizes the six fixed native
  action proposals accepted at `54a069a`; it executes only after explicit owner
  confirmation through the injected AlarmKit/EventKit/MediaPlayer adapter.
- `personal_ai_companion.providers` now includes the accepted local registry,
  explicit runtime-resource lifecycle, and injected-executor adapter. The Cloud
  composition root can expose owner-authenticated redacted management/selection
  plus conditional `normal` runtime routes. The current iOS Status UI can
  manage and select redacted profiles behind an explicit off-by-default flag.
  This is not a default network client, real-provider
  acceptance, health-probe authority, or main Chat route.
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
- `manifests/health-source-abstraction-v0.1.md`
- `manifests/health-owner-summary-contract-v0.1.md`
- `manifests/health-manual-export-normalization-v0.1.md`
- `manifests/health-off-device-consent-contract-v0.1.md`
- `manifests/health-analysis-contract-v0.1.md`
- `manifests/health-owner-shortcut-analysis-api-v0.1.md`
- `manifests/health-owner-shortcut-aggregation-v0.1.md`
- `manifests/health-shortcut-scoped-credential-v0.1.md`
- `manifests/memory-layer-v0.1-implementation-readiness.md`
- `reports/`, including the current-baseline
  [integration-contract acceptance](reports/integration-contracts-v0.1-acceptance-20260715.md),
  the [supported App action acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md),
  and the [owner-summary acceptance](reports/health-owner-summary-contract-v0.1-acceptance-20260715.md)

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
retained in current canonical `main` at `c550d4b`, together with a source-gated,
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
