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

- Current status: Mixed local/live, single-owner personal product. Local product
  `main` and the GitHub default branch are at `1abf23a`. Product `1abf23a`
  adds the 14A default-off iOS Host Chat composition
  and StackChan status injection, followed by 14B executable Chat identity
  lifecycle and StackChan enqueue/TTL reconciliation tests, and 14C stable
  pairing ownership with origin-bound Bridge request correlation. Order 14D
  adds atomic Bridge v0.2 expiry cleanup and strict result replay. The current
  uncommitted 14E worktree adds the missing status-only test-machine worker,
  frozen SQLite result journal, bounded retry policy, and field runbook. Its
  2026-07-17 signed-iPhone field session is accepted for one owner-triggered
  four-field status read with final queue depth zero. A separately authorized
  continuous-runtime repair now installs a user LaunchAgent and a status-only
  CoreS3 boot daemon. Soft reset, forced Bridge restart, six-second Bridge
  outage recovery, two automatic status roundtrips, and final queue depth zero
  are accepted. The follow-up worker hardening stores and compares the complete
  command, clears journals only after validated ACK or a successful empty poll,
  validates the exact privacy object, and moves endpoint/device/firmware values
  to strict runtime NVS. Two different commands completed inside one TTL after
  deployment. One physical power-cycle and a later owner-triggered iPhone
  refresh are accepted. The four-field snapshot remained visible after a
  three-second Safari roundtrip without issuing a second command. Repeated cold
  boots and iPhone VPN/LAN route recovery remain explicit residuals.
  Redundant
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
  Product `5225740` adds the accepted Shortcut security hardening: additive
  Alembic ownership, finite expiry, atomic rotation, credential/IP limits,
  metadata-only audit with bounded retention, strict pre-buffer request sizing,
  and default-off deployed composition. The additive schema remains deployed
  with the health route disabled/404 and zero credential/audit rows. The
  current Chat image is a reviewed descendant of this source; no real health
  credential or phone request is accepted.
  Product `c550d4b` adds the independently default-off iOS Provider-management
  and exact local read-only MCP call UI, plus revision-safe Provider deletion.
  It is accepted only for local synthetic/Simulator use; no real Provider,
  secret, remote MCP server, deployment, or private data was exercised.
  Product `54a069a` adds six strictly typed Chat proposals for alarm creation,
  calendar-event creation, reminder creation, and Apple Music play/pause/next.
  Every proposal requires an explicit owner confirmation and expires within
  five minutes. Personal Team build, install, and launch are confirmed, while
  real permission prompts and native side effects remain unconfirmed.
  Product `9ebda8c` adds a caller-opt-in, still-unwired OpenAI-compatible HTTP
  executor with strict HTTPS/redirect/response/error boundaries. Product
  `3448e84` adds owner-only metadata retention aggregates without reading
  memory content or executing retention. Product `0e53f74` adds deterministic
  two-device and SQLite-restart StackChan reliability coverage without changing
  production Bridge/queue source. Product `8dd90ae` adds default-off
  deployed `ChatRuntime` composition with independent Chat/Health owners,
  credentialed HTTPS relay and dedicated-memory gates, plus an isolated iOS
  StackChan v0.2 status enqueue/fetch transport. Product `1abf23a` adds
  explicit-false Host gates, complete signed-in Chat composition
  checks, and manual-only StackChan status UI/Host injection. The uncommitted
  field repair adds only bounded foreground result polling after that manual
  action, with no background or unprompted polling. It also adds synthetic
  factory-to-IdentityGate Chat refresh/rejection
  coverage, idempotent status enqueue recovery, pairing-safe StateObject
  ownership, and deferred status credential resolution. See the
  [14A acceptance](reports/ios-host-chat-stackchan-composition-v0.1-acceptance-20260716.md),
  [14B acceptance](reports/ios-chat-lifecycle-stackchan-reconciliation-v0.1-acceptance-20260716.md),
  [14C acceptance](reports/ios-host-pairing-state-ownership-v0.1-acceptance-20260716.md),
  [14D acceptance](reports/stackchan-v02-lifecycle-hardening-v0.1-acceptance-20260716.md),
  [14E acceptance](reports/stackchan-v02-status-worker-test-environment-v0.1-acceptance-20260716.md),
  and the [continuous-runtime acceptance](reports/stackchan-v02-status-continuous-runtime-acceptance-20260717.md).
  The committed combined baseline passes `1766` Python
  tests with the existing warning. The current uncommitted worktree passes
  `1857` Python tests, `186` StackChan tests, and `17` Swift tests. The added
  XCTest covers cancellation during the bounded StackChan inter-poll sleep and
  confirms that no second fetch or false failure is published.
  On 2026-07-17 the owner-only authenticated Chat deployment and signed iOS
  composition accepted one public-safe temporary turn with a correlated reply,
  `memory_status=ephemeral`, zero Chat-table persistence, and a post-install
  StackChan status refresh. Standard persisted Chat and every remote optional
  integration remain unaccepted. See the
  [live-readiness report](reports/ios-authenticated-chat-live-readiness-20260717.md).
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
  The [Shortcut hardening acceptance](reports/health-shortcut-hardening-v0.1-acceptance-20260716.md)
  is accepted at product `main@5225740`: `38` focused tests and `1713` full
  Python tests passed with the same warning, plus targeted lint/format,
  compileall, Alembic-head, and GitNexus staged checks. The additive schema and
  pre-closeout candidate are dark-deployed with zero credential/audit rows and
  a disabled/404 route; `5225740` itself has not been rebuilt or redeployed.
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
  is retained in current `main@1abf23a`, and the single orphan family was
  revoked under a verified database backup. Same-account re-login and
  historical-data recovery remain owner-observed checkpoints. See the
  [acceptance report](reports/native-google-owner-acceptance-20260714.md).
- Risk gate: Local docs and isolated code remain L0/L1. Any NAS, VPS, Cloudflare, Google Cloud, public endpoint, live authentication, database, tunnel, or deployed-image inspection is L2 read-only; any state change is L3 and requires the exact phrase `进入修复阶段` for that named repair slice.
- Common commands:
  - `node docs/workspace/find-project.mjs personal-ai-companion`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: the temporary authenticated Chat vertical is accepted. The
  next bounded Chat step is read-only latency profiling of the observed
  roughly `16.3`-second response before any model, relay, timeout, or streaming
  change. A standard persisted turn remains a separate owner checkpoint. The
  Health route stays disabled and no real Health credential or request is
  selected.
  `PAC-IOS-CONVERSATIONAL-NATIVE-ACTIONS` is accepted locally at product
  `54a069a` as queue order 13 and is retained in current `main@1abf23a`. Chat
  can propose only the six fixed native action
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
  only to health analysis. Order 12H at `5225740` adds expiry/rotation,
  credential/IP limits, metadata-only bounded audit, Alembic, and a default-off
  deployment factory. Existing access/refresh tokens cannot authorize analysis
  and must not be embedded in Shortcuts. The live dark image remains route-off
  and predates the final 12H source fixes; rebuilding/redeploying it, enabling
  the route, issuing a real credential, making a phone HTTPS call, or sending
  real health data are separate L3 work.
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

## Current Program Control State (2026-07-17)

This section is the current ops-level fact index. It supersedes contradictory
completion wording in older manifests, reports, and running logs; those older
documents remain historical evidence, not an authorization to repeat live
actions. Status labels are defined in the [continuous program
runbook](runbooks/continuous-program-authorization-and-task-lifecycle.md).

| Surface | Confirmed current fact | Not confirmed / not authorized |
| --- | --- | --- |
| StackChan hardware | Bounded standalone checks are `field-confirmed` for the LCD expression path, audible playback, X/Y servo movement and return, active three-zone head-touch transitions, and one local low-resolution camera frame. The completed session ended with queue depth `0`, servos powered off, camera off, audio muted, and serial closed. The separate v0.2 status-only boot daemon is soft-reset, Bridge-recovery, and one physical-cold-boot status-read accepted without using those actuation surfaces. See [the field-verification report](reports/stackchan-hardware-field-verification-20260711.md) and [continuous-runtime acceptance](reports/stackchan-v02-status-continuous-runtime-acceptance-20260717.md). | Whether a visible camera activity indicator activated was not verified. Repeated actuation reliability, a full motion envelope, repeated cold-boot reliability, and any unattended display/motion/audio/camera/touch execution remain unconfirmed and unauthorized. |
| StackChan App integration | On 2026-07-13 the owner observed the App-driven v0.1 sequence `happy -> correlated ACK -> neutral -> correlated ACK`; the final screen was `neutral` and Bridge queue depth was `0`. Durable source is pushed at product commit `9dbfafc`; malformed ACK-like events are rejected with queue/result state unchanged. Product `0e53f74` adds deterministic two-device v0.2 replay coverage and SQLite restart/expiry coverage. Product `8dd90ae` adds the strict iOS v0.2 status transport. Pushed product `1abf23a` injects it after sign-in, keeps it manual/default-off, preserves state across pairing, and atomically removes expired v0.2 command/state/idempotency/result indexes. The uncommitted 14E worktree adds a status-only UIFlow2 consumer with durable frozen results, primary-before-ACK ordering, strict private-IP/token-file boundaries, bounded worker retries, and manual-triggered foreground iOS result polling. On 2026-07-17 the owner observed one signed-App v0.2 status command display `100%`, `Wi-Fi`, `94 hours 1 minute`, and `uiflow2-v2.4.8`; the result and ACK correlated and Bridge queue depth returned to `0`. The authorized continuous-runtime follow-up installs a user LaunchAgent and boot daemon, survives soft reset and forced Bridge restart, recovers after a six-second Bridge outage, and completes automatic status/ACK roundtrips with queue depth zero. The hardened worker now uses strict runtime NVS, full-command journal correlation, exact privacy validation, and validated-ACK journal cleanup; two distinct live commands completed inside one TTL without a daemon exit. After one physical cold boot, command `cmd_ios_status_897061f0-3723-4142-939f-953af77ed2b1` completed the signed-iPhone enqueue/result/ACK chain, displayed `100%`, `Wi-Fi`, `1 hour 46 minutes`, and `uiflow2-v2.4.8`, and returned queue depth to zero. The snapshot remained visible after a three-second Safari roundtrip with no second enqueue. See the [field acceptance](reports/app-bridge-stackchan-e2e-acceptance-20260713.md), [reliability acceptance](reports/stackchan-queue-reliability-v0.1-acceptance-20260716.md), [local vertical acceptance](reports/cloud-chat-stackchan-status-vertical-v0.1-acceptance-20260716.md), [14A acceptance](reports/ios-host-chat-stackchan-composition-v0.1-acceptance-20260716.md), [14B acceptance](reports/ios-chat-lifecycle-stackchan-reconciliation-v0.1-acceptance-20260716.md), [14C acceptance](reports/ios-host-pairing-state-ownership-v0.1-acceptance-20260716.md), [14D acceptance](reports/stackchan-v02-lifecycle-hardening-v0.1-acceptance-20260716.md), [14E acceptance](reports/stackchan-v02-status-worker-test-environment-v0.1-acceptance-20260716.md), and [continuous-runtime acceptance](reports/stackchan-v02-status-continuous-runtime-acceptance-20260717.md). | Repeated cold-boot reliability, iPhone VPN/LAN route recovery, producer/Bridge/worker clock-skew tolerance, and fixed-DHCP drift remain unconfirmed. Expiry cleanup is triggered by the next v0.2 operation rather than a background timer. The real v0.1 allowlist remains only `happy` and `neutral`; audio, motion, camera, touch, memory, HealthKit, background iPhone polling, and other hardware remain outside this slice. |
| iOS product | Local product `main` and remote `origin/main` are at `1abf23a`; the uncommitted field repair adds bounded same-command result polling after one manual status refresh. Product `1abf23a` locks formal Host Chat composition, keeps both new gates explicit-false, and gives the Host a stable reloadable Bridge router. Pairing preserves the signed-in StateObjects and status resolves the latest paired credential only after an owner action. On 2026-07-17 a current-source Personal Team build installed and launched on an iPhone 15 Pro Max, retained the existing signed-in session, completed one real temporary authenticated Chat turn, and then completed a real StackChan v0.2 status refresh after reconnecting stale iPhone Wi-Fi routing. The Chat reply correlated exactly and the status UI displayed `100%`, `Wi-Fi`, `3 hours 18 minutes`, and `uiflow2-v2.4.8`. | No standard persisted Chat turn, account deletion, real native-action permission or side effect, Provider secret/server or MCP server evidence, remote/state-changing MCP, public onboarding, multi-tenant administration, background or unprompted iPhone status operation, TestFlight, or App Store distribution is accepted. The checked-in status and Cloud Chat gates remain false; the enabled gates exist only in the signed field build. |
| Health sources / Apple membership | Product `b6209a7` is the order-12 source-seam anchor; products `4a8b52e`, `0665fd3`, `bff7398`, and `c0cd301` add the owner intake, fixture-only manual-export normalization, single-request off-device consent, and qualitative analysis contracts. Products `2360cba`, `09b86c7`, and `7905b12` add the default-absent API, fixed 21+7-day aggregation recipe, and dedicated analysis credential. Product `5225740` adds expiry/rotation, pre-body credential/IP limits, metadata-only bounded audit, strict pre-buffer request sizing, Alembic, and default-off deployment composition. The running Chat image is built from descendant `1abf23a`, so those final repairs are present; the additive schema remains dark-deployed with zero health credential/audit rows and a disabled/404 route. HealthKit remains optional implemented code; no paid Apple Developer Program membership is assumed. | No real HealthKit authorization/sample result, real export parsing, installed/executed Shortcut, real credential handoff/storage, phone HTTP action, third-party adapter, consent UI, authenticated-chat health transmission, model narrative, durable replay protection, free-form analysis, or chart UI is accepted. The Health route must remain disabled until a separate owner-authorized Health slice. Collection/import scopes cannot substitute for off-device transfer consent. |
| Provider, MCP, and phone-app integrations | Product `65d47b5` freezes the strict contracts, `ad18cd0` adds the encrypted registry, `295687f` adds the bounded owner/runtime API, and `2dc2948` adds exactly `server.local.context/context.today`. Product `c550d4b` adds default-off single-owner Provider management and the exact read-only MCP call UI. Product `9ebda8c` adds a caller-opt-in OpenAI-compatible HTTP executor with HTTPS, redirect, size, JSON-shape, and redacted-error boundaries; it is exported but not wired into an app or route. Product `7547d8a` adds the fixed public share-sheet handoff, and `54a069a` adds confirmed-before-execution local AlarmKit/EventKit/MediaPlayer actions. See the [Provider HTTP acceptance](reports/provider-http-executor-v0.1-acceptance-20260716.md) and [native-action acceptance](reports/ios-conversational-native-actions-v0.1-acceptance-20260716.md). | No default Provider executor wiring, trusted health prober, real Provider/endpoint/credential, main-Chat Provider route, remote MCP server, state-changing MCP execution, durable audit store, live reconfiguration, background automation, deployment, or sensitive privacy class is accepted. The phone cannot run arbitrary MCP servers or receive stored secrets, and no real native side effect was used for acceptance. |
| Xiaoxin cloud/auth | The running image is `xiaoxin-cloud-api:20260717T114059-chat-candidate`, NAS-normalized image ID `sha256:181d700a922518376b41a991c512456dc8c6cba1c3f044901ae79f76f8c843f1`. Health/readiness/capabilities pass; Google and Authentik remain available; email/OTP remain disabled; the health route remains absent/404. Owner-only authenticated Chat is enabled with one matched owner, an isolated Chat volume, account-token auth, credentialed HTTPS relay, response binding, and candidate writes disabled. One temporary iOS turn returned HTTP `200` and a correlated ephemeral reply. | Standard persisted Chat, latency optimization, direct replay of deleted old auth tokens, same-account re-login, historical-data recovery, real health credential issuance, and broader phone validation remain unconfirmed. The observed Chat interval was about `16.3` seconds, and stale iPhone VPN/Wi-Fi routing required a Wi-Fi reconnect before the post-install StackChan refresh. See the [deployment ledger](DEPLOYMENT_LEDGER.md), [live-readiness report](reports/ios-authenticated-chat-live-readiness-20260717.md), and [health hardening acceptance](reports/health-shortcut-hardening-v0.1-acceptance-20260716.md). |
| Memory/privacy | Product `main@1abf23a` retains Phase 2 canonical recall selection, Phase 3 nullable `fact_key`/`expires_at_ms` persistence and metadata-first disclosure, plus Phase 4A/4B explicit opt-in admission/candidate-write wiring. Product `3448e84` adds owner-only active/expired/no-expiry/suppressed retention aggregates from payload-free metadata with fail-closed degradation. The ordinary-chat writer remains default-off. The live owner-only Chat route accepted one temporary turn; the client required `memory_status=ephemeral`, candidate writes stayed off, SQLite integrity remained `ok`, and all four Chat business tables remained zero. Health hardening preserves the no-health-body-persistence boundary. | The aggregate is descriptive and does not prove retention execution. Standard persisted Chat, automatic extraction without explicit opt-in, semantic/vector retrieval, vault wiring, authoritative retention execution, hard deletion, and real health-source/cloud memory authorization remain unimplemented or unconfirmed. |
| Style/persona | Local style mechanisms and synthetic evaluation surfaces are historical implementation evidence. The owner has attested consent for a future visual-likeness slice; no identifying material or consent text is stored here. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data use remain separate gates. |

Apple membership constraints above are grounded in Apple's
[membership comparison](https://developer.apple.com/support/compare-memberships/)
and [supported iOS capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios/).

## Current Source Interfaces

- `POST /v1/chat` is the canonical relay Chat route. One owner-only temporary
  authenticated iOS turn is live-accepted with a correlated
  `memory_status=ephemeral` response and zero Chat-table persistence. Standard
  persisted turns and broader users remain outside that acceptance.
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
- `manifests/health-shortcut-hardening-v0.1.md`
- `manifests/provider-http-executor-v0.1.md`
- `manifests/memory-retention-summary-v0.1.md`
- `manifests/stackchan-queue-reliability-v0.1.md`
- `manifests/memory-layer-v0.1-implementation-readiness.md`
- `reports/`, including the current-baseline
  [integration-contract acceptance](reports/integration-contracts-v0.1-acceptance-20260715.md),
  the [supported App action acceptance](reports/ios-supported-app-action-v0.1-acceptance-20260715.md),
  the [owner-summary acceptance](reports/health-owner-summary-contract-v0.1-acceptance-20260715.md),
  and the [Shortcut hardening acceptance](reports/health-shortcut-hardening-v0.1-acceptance-20260716.md)

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
