# Personal AI Companion Deployment Ledger

## 2026-08-09 iOS Calendar Anti-Hallucination Hotfix

Task level: `L3 repair execution` after owner-visible false calendar claims and
explicit authorization. Scope was limited to iOS calendar intent routing,
local fail-closed behavior, signed same-bundle installation, and verification.
Cloud API, database, Mac services, robot configuration, and firmware were
unchanged.

- Confirmed the screenshot response was produced by the older installed App:
  the request fell through to model Chat, which had no EventKit evidence but
  invented a 10:00 client meeting and a 15:30 hospital follow-up.
- Supported personal calendar queries, including `看一下明天的日程`,
  `告诉我明天的行程`, `明天的安排是什么`, and `列出后天的日程`, now create a
  bounded local EventKit read proposal before any Chat request.
- A clear calendar query that cannot be safely parsed, such as
  `请告诉我下周的日程`, now fails closed on-device with a no-guessing response.
  Tests assert that neither supported nor fail-closed calendar paths create a
  Bridge/Cloud Chat request. Ordinary conversational uses of `安排` remain Chat.
- Owner-visible acceptance then exposed a matching write defect:
  `帮我记录一下明天早上八点上课` fell through to model Chat, which falsely
  claimed it had recorded and would remind the owner. The write hotfix treats
  a record directive with a concrete time as a local calendar event, cleans the
  title to `上课`, preserves explicit confirmation, and fails closed rather
  than letting an unexecuted system-write request claim success.
- Verification passed 11 focused tests, the complete 127-test Swift suite,
  diff checks, signed device build, strict code-sign validation, and a stable
  post-install process check.
- Installed executable SHA-256 is
  `06a811c3da41e901252b9c6a6944c225d6cea68358a55b8cc767c29b0296ae5c`,
  CDHash `693becb1fd3e3cc22c8d3a62fbfae6805dfb7bf6`, bundle
  `xyz.nodezjc12348888.xiaoxin`, Team ID `Y38TU585HM`, device container
  `FD4C145A-5A3F-4F85-B426-E9B33069DB59`, and launch PID `2244`.
- Exact before/after source, installed-before and installed-after signed Apps,
  hashes, and rollback directions are stored under
  `state/project-data/personal-ai-companion/rollback/calendar-anti-hallucination-20260809T205924+0800`.
  Owner-visible EventKit output after confirmation remains the final manual
  acceptance checkpoint.

## 2026-08-09 Robot Microphone Disabled

Task level: `L3 repair execution` after current-state confirmation and explicit
owner authorization. Scope was limited to the Mac realtime LaunchAgent's robot
microphone path. iOS, Cloud API, database, credentials, provider selection, and
robot firmware were unchanged.

- Confirmed pre-change state was `PAC_ROBOT_MIC_ENABLED=1` with
  `PAC_ROBOT_MIC_WAKE_WORD_REQUIRED=0`, which admitted robot microphone audio
  without a wake-word gate.
- The durable deployment source and loaded LaunchAgent now set
  `PAC_ROBOT_MIC_ENABLED=0`. The loaded machine-specific LaunchAgent also sets
  the dependent `PAC_ROBOT_MIC_CLOUD_RESPONSE_ENABLED=0`; the source template
  already defaults that absent setting to disabled.
- The first restart correctly failed configuration validation while the
  dependent cloud-response switch was still enabled. After disabling that
  robot-microphone-only switch, the LaunchAgent loaded successfully as PID
  `81026` and remained stable through the final check.
- Final `/healthz` returned HTTP `200`. Robot microphone enabled, connected,
  listening, conversation mode, cloud response, and local KWS all reported
  `false`; UDP port `18772` had no listener. The normal realtime service still
  listened on `192.168.2.1:18770`, and robot audio output remained configured.
- Exact before/after configs, hashes, validation facts, and rollback directions
  are stored under
  `state/project-data/personal-ai-companion/rollback/robot-mic-disable-20260809T204007+0800`.

## 2026-08-09 iOS Local Time And Conversational Calendar Repair

Task level: `L3 repair execution` after a bounded L2 routing audit and explicit
owner authorization. Scope was limited to the signed same-bundle iPhone Chat
path. Cloud API, database, credentials, Provider selection, Direct Voice, Mac
services, robot firmware, and wake-word state were unchanged.

- Current-time, current-date, and weekday questions are now answered from the
  iPhone clock before any Chat transport. Focused tests prove that these turns
  produce zero Bridge/Cloud Chat requests.
- Calendar reads remain local EventKit actions with explicit confirmation.
  Natural questions such as `我明天忙吗` and `后天有空吗` now resolve to the
  bounded one-day calendar read instead of ordinary model Chat.
- Calendar and reminder writes now accept bounded natural forms including
  `帮我记录事件`, `帮我记录明天下午3点开会`, and
  `帮我把明天下午3点开会加到日历`. Missing title or time stays on-device and
  produces a follow-up question; a completed proposal still requires the
  existing explicit owner confirmation before EventKit writes.
- Verification passed 9 focused local-action tests, the complete 125-test Swift
  suite, strict code-sign verification, and diff checks. GitNexus reported the
  expected high-risk Chat/parser surface; snapshot comparison isolated this
  repair to `ChatViewModel.swift`, `ConversationalSystemActions.swift`, and the
  bounded calendar action tests inside the pre-existing dirty product tree.
- Installed signed App executable SHA-256 is
  `6734afdc1aa0aee236dba3415e5c0687f69ddba585efa1b366418b74ddeced5d`,
  CDHash `5b634efb355096e45c74d4d74764e8d31918d857`, bundle
  `xyz.nodezjc12348888.xiaoxin`, and Team ID `Y38TU585HM`. Installation
  succeeded at device container
  `CD394FF0-3B09-4F61-A3C2-756ADA9CA8B1`. The first launch was denied while
  the device was locked; retry succeeded and the process remained alive as PID
  `2194` after a five-second check.
- Private rollback evidence is under
  `state/project-data/personal-ai-companion/rollback/ios-local-actions-20260809T201757+0800`.
  It retains the accepted pre-repair App (executable SHA-256
  `02131e3feddf95d1dee2f904bbef0e18cf8cb093de01f6e9379eb37374d1de76`),
  the candidate App, and exact bounded pre-repair source copies. Routine
  rollback reinstalls the retained pre-repair App and restores only those
  bounded source files.

## 2026-08-09 Real Text Streaming And First-Delta Repair

Task level: `L3 repair execution` after an L2 source/live latency audit and
explicit owner authorization. Scope was limited to ordinary authenticated text
streaming in the Cloud API and the signed same-bundle iPhone App. Database,
credentials, Provider selection, Direct Voice, Mac services, robot firmware,
and wake-word state were unchanged.

- Previous image: `xiaoxin-cloud-api:20260809T155404-chat-tools`, image ID
  `sha256:32553c7614367027c8de91669b21a573c5a1b7f6324b57d25822ad5f9e003a40`.
- Current image: `xiaoxin-cloud-api:20260809T194200-real-streaming`, image ID
  `sha256:0285320a3549a1fdbf8b1e42c11a609855fb0dee510b6f0175240ebd8e70c3e7`.
  It overlays only `cloud/chat_stream.py` and `realtime/turn.py` on the previous
  immutable image.
- Ordinary immediate text streams now request the existing non-thinking
  provider control, which the DeepSeek executor converts to explicit disabled
  thinking without storing the control text. A Provider stream that is absent
  or fails before its first delta now goes directly to the true relay streamer;
  it cannot call the synchronous Provider reply and emit the full answer as one
  fake delta.
- The iPhone App now publishes each server delta directly into the active
  assistant message. The discarded 45 ms presentation queue and artificial
  sleeps are absent. Installed App executable SHA-256 is
  `02131e3feddf95d1dee2f904bbef0e18cf8cb093de01f6e9379eb37374d1de76`,
  CDHash `f4232dde72246649af1c6af00944b619e59d283e`; it launched as PID `2173`.
- Public real-provider acceptance returned the first model delta in `2464.1`
  ms, emitted `66` model deltas for `112` characters, and completed in `3573.9`
  ms. The comparable pre-repair probe first delta was about `6469.3` ms. The
  acceptance request was temporary; Chat SQLite counts remained exactly
  `30` messages, `2` memory atoms, and `105` model-usage rows.
- Local verification passed `2759` Python tests with one skip and the existing
  Starlette warning, all `119` Swift tests, focused Cloud/iOS streaming suites,
  Ruff, signed device build, code-sign verification, and diff checks. After
  cutover, API/database health passed with zero restarts, the database container
  ID remained unchanged, public health/readiness/capabilities passed, and no new
  API traceback/error was found.
- Root-only remote rollback evidence is under
  `/var/backups/xiaoxin-auth/20260809T194200+0800/real-streaming-before`; the
  retained signed pre-repair App and bounded source copies are under the private
  workspace rollback area. Routine rollback restores the previous image in the
  environment and recreates only the API, then reinstalls the retained App if
  needed. Owner-visible confirmation that text visibly grows on the physical
  screen remains the final manual UX check.

## 2026-08-09 Cloud Chat Time And Tavily Tools

Task level: `L3 repair execution` after a current-state L2 audit and explicit
owner authorization. The deployment was API-only and preserved the existing
database, Provider selection, Direct Voice configuration, Mac/iPhone runtime,
and robot firmware.

- Previous image:
  `xiaoxin-cloud-api:20260802T230359-deepseek-voice-low-latency`, image ID
  `sha256:fff71937e8609baddb8694e00515e976f222acaff1e137a41feef58ac323c5be`.
- Current image: `xiaoxin-cloud-api:20260809T155404-chat-tools`, image ID
  `sha256:32553c7614367027c8de91669b21a573c5a1b7f6324b57d25822ad5f9e003a40`.
  It overlays only the bounded time/search tool module plus the non-streaming
  and streaming Chat integration files on the previous image.
- Production Compose now passes the root-only Tavily credential and explicit
  `Asia/Shanghai` companion timezone. The environment remains mode `0600`,
  root-owned, and contains one line for each new setting.
- Technical acceptance passed public health/readiness/auth capabilities, exact
  candidate hashes, a current-time tool probe, and a real Tavily probe with five
  bounded HTTP(S) results. The API and unchanged database container are healthy
  with zero restarts; Chat SQLite aggregate counts were identical before and
  after, and no new API traceback/error was found.
- Local acceptance passed `2759` Python tests with one skip and the existing
  Starlette deprecation warning, plus Ruff, lock, plist, and diff checks. The
  prior wake-word-disabled runtime test expectation was aligned with the
  owner-approved configuration.
- Verified root-only rollback evidence is stored at
  `/var/backups/xiaoxin-auth/20260809T155404+0800/chat-tools-before`; the private
  workspace manifest is under the project state rollback area. Routine rollback
  restores the prior environment/Compose and recreates only the API from the
  previous DeepSeek image. PostgreSQL and Chat SQLite backups are retained as
  consistency anchors.
- Owner-visible iPhone prompts for current time and explicit web search remain
  the final manual acceptance at this checkpoint.

## 2026-08-09 Owner Mac Realtime And Signed iPhone Repair

Task level: `L3 repair execution` after explicit owner authorization. Scope was
limited to installing the signed same-bundle iPhone App and reloading the
owner-Mac realtime LaunchAgent. Public Cloud Chat, database, credentials,
robot firmware, NAS, and VPS state were unchanged.

- The signed iPhone build installed and launched successfully; the process
  remained alive after acceptance. Its calendar usage descriptions are present.
- The owner-Mac realtime LaunchAgent required one explicit kickstart after
  bootstrap registered the job without starting it. It is now running and its
  health reports the model prewarmed plus the robot microphone connected and
  listening.
- Wake-word gating and the local KWS model are both disabled. The robot
  microphone transport remains enabled, so ordinary realtime audio is retained
  without reserving runtime for the discarded wake path.
- An authenticated live WebSocket probe confirmed session configuration,
  text-input acceptance, and handoff to the external-response path. Focused
  verification passed 8 Python realtime/tool tests, 3 calendar Swift tests,
  and 10 device-conversation observer Swift tests. A real Tavily probe returned
  five bounded HTTP(S) results.
- Current-time and Tavily enrichment are verified in local source, but the
  signed App's Chat and external voice response still target the public Cloud
  API. No Cloud deployment was authorized in this repair, so those two tools
  are not recorded as live on the phone yet. Direct-voice observer preview is
  also code-verified but remains inactive while the direct-voice service mode
  is disabled.
- Private rollback evidence is retained under the workspace state area with
  the pre-repair LaunchAgent plist, prior signed App, pre/post health responses,
  source patch, and a narrow rollback manifest.

## 2026-08-06 Read-Only Public Checkpoint And Source CI Baseline

Task level: `L2 read-only public checkpoint` plus local `L1` source, test, CI,
and documentation work. No production repair gate was opened and no live
service, database, credential, tunnel, image, iPhone, or StackChan state was
changed.

- Product `main` and `origin/main` are synchronized at `3ca3a0b`. This source
  hash is not deployment evidence; the current private image/container and
  device runtime were not inspected.
- Around 2026-08-05 22:58 +08:00, HTTPS with certificate verification passed
  for the public `/healthz`, `/readyz`, and `/v1/auth/capabilities` routes.
  Each returned HTTP 200. `/healthz` reported service/database/storage `ok`;
  `/readyz` reported `ready` with login, Google, OIDC, token, and storage
  capabilities while email/OTP remained unavailable; the capabilities route
  advertised Google native nonce, Authentik OIDC/PKCE, token/storage,
  direct-voice `pac.direct.voice.v1`, and no email/OTP.
- The checkpoint used only GET requests and did not send credentials or issue
  a state-changing request. It confirms the public control-plane surface at
  that moment, not private database rows, provider account health, image
  provenance, firmware, or physical audio/AEC behavior.
- The source CI workflow is now present and pinned. Final hosted run
  [31078474152](https://github.com/zjc2944678910-max/personal-ai-companion/actions/runs/31078474152)
  passed Python 3.11 and 3.12 after fixing two platform-exposed test races.
- Detailed evidence and residual boundaries are in the
  [source, CI, and public-health reconciliation report](reports/source-ci-and-public-health-reconciliation-20260806.md).

## Current Recorded Baseline

- The following 2026-07-21 statement is historical scope evidence, not a
  current public-health claim: that realtime slice recorded no accepted
  standalone Mac service, iPhone realtime token, StackChan PCM worker/NVS
  token, signed App install, or physical realtime session at its checkpoint.
- The current public checkpoint above does not supersede any private deployment
  anchor below; it only records what the public control-plane returned on the
  probe date.
- Latest completed owner-visible live verification in this ledger: 2026-07-17.
- The owner-only custom Provider bridge is live in
  `xiaoxin-cloud-api:20260717T2150-provider-probe`, NAS image ID
  `sha256:5316d0234d1d09c97cd5559a9d89ece9dd446557959b59831548f2cdf56fbcc6`.
  The signed same-bundle App exposes the URL/API-key/model form and allows an
  unknown-health profile to execute one explicit `验证并选择` probe. Success
  records server-side health and selection; failure does not retry or select.
  Local verification passed `1879` Python tests, `30/30` Swift tests, and the
  AppFlow smoke. Live health/readiness/auth-method boundaries passed with an
  unchanged PostgreSQL container. Provider probe and main Chat request counts
  remained `0`; real Provider compatibility is unconfirmed. Backup and
  rollback evidence is recorded in the
  [Provider Chat wiring report](reports/custom-provider-chat-wiring-20260717.md).
- The owner requested a server-side expansion of the multi-model Provider
  inventory. After a root-only online registry backup, one bounded `/v1/models`
  request returned 13 model IDs; 12 missing profiles were created by reusing
  the encrypted endpoint/credential configuration without exposing it. The
  registry now contains 14 profiles, all 12 new entries remain `unknown` until
  explicitly validated, `deepseek-chat` remains selected, and the API remains
  healthy with zero restarts. This inventory operation sent no Chat request.
- Latest Chat model experiment (2026-07-17) is recorded in
  [the Sonnet experiment report](reports/chat-sonnet-default-experiment-20260717.md).
  The temporary Sonnet default passed one sample at `4556.6 ms` but failed the
  hard `8 s` maximum on the second at `10324.3 ms`; the third allowed sample was
  not sent. The API was rolled back to the Opus default using the verified
  `sonnet-experiment-before` backup. Current model configuration is default
  `claude-opus-4-6-thinking`, Sonnet alias `claude-sonnet-4-6`, and complex Opus
  alias `claude-opus-4-6-thinking`. The current Chat baseline is
  `conversation_messages=6`, `session_deltas=0`, `memory_atoms=0`,
  `model_usage_logs=3`; API/DB health and identity checks passed. No commit or
  push was performed.
- The bounded App-to-StackChan LCD v0.1 field sequence is complete: the owner
  observed `happy` after its correlated acknowledgement, then observed
  safety-terminal `neutral` after its separate correlated acknowledgement.
  Final Bridge queue depth was `0`. Durable source is pushed at product commit
  `9dbfafc`; this is not evidence for repeated reliability or any non-LCD
  capability.
- Earlier latency-observability API image retained as a verified rollback and
  evidence anchor, not as the current image:
  `xiaoxin-cloud-api:20260717T170800-chat-latency`, NAS-normalized image ID
  `sha256:1b785f1a4336175186d86ca0d46232c8e5c6c76f22e04a5bee1bde9a8ee0015d`.
- `xiaoxin-cloud-api:20260717T135348-chat-latency` is the immediate rollback for
  that latency image. `xiaoxin-cloud-api:20260717T114059-chat-candidate`,
  `xiaoxin-cloud-api:20260716T111947-health-dark`,
  `xiaoxin-cloud-api:20260713T0137-native-google`, and
  `xiaoxin-cloud-api:20260712T2352-google-state` remain older rollback anchors;
  earlier email and direct-flow images remain historical.
- The durable canonical product source and GitHub default branch are
  `main@7754727` before the current uncommitted privacy/documentation repair.
  The deployed Provider candidate was built over product `923b04e`; older
  running-image source `1abf23a`, deployment anchor `72258a1`, logout repair
  `b8462a9`, iOS owner tools `c550d4b`, and native actions `54a069a` remain in
  the recorded lineage. Redundant compatibility refs
  `codex/initial-private-publish` and `codex/pac-google-logout-revocation-fix`
  were retired after the fast-forward promotion.
- Native Google Sign-In is deployed. The 2026-07-14 lifecycle pass confirmed a
  real refresh rotation, the intended Google account, same-owner Google and
  Authentik binding, local logout cleanup, and target-only orphan-family
  revocation. Same-account re-login and direct live replay of deleted old token
  values remain unconfirmed.
- Built-in email registration and password login are currently disabled because
  the initial flow did not verify mailbox ownership before issuing tokens. The
  retained email account and its data were not deleted.
- Health Shortcut hardening is dark-deployed with the route disabled. The
  additive credential and metadata-only audit schema is present, but both
  tables contain zero rows and no real scoped credential has been issued.
- The earlier Chat-latency image was built from `1abf23a`, a reviewed descendant
  of product `5225740`, so that image includes the pre-buffer stream-size
  enforcement and management-path audit-retention repairs. The later recorded
  Provider image is identified at the top of this baseline. The Health route
  remains explicitly disabled/404 with zero credential and audit rows.
- Owner-only authenticated Chat is enabled for one matched Cloud owner with an
  isolated Chat memory volume and credentialed HTTPS relay. Latency telemetry
  now correlates iOS, API, and relay phases without logging content or identity.
  Three repair-stage temporary turns left the preflight table baseline unchanged
  at `conversation_messages=4`, `model_usage_logs=2`,
  `session_deltas=0`, and `memory_atoms=0`. The existing persisted rows are
  evidence that standard mode was exercised outside the original temporary
  acceptance. The later standard Chat memory/style acceptance below supersedes
  this latency-stage preflight state.
- The signed field App contains both authenticated Chat and StackChan status,
  plus content-free Chat latency console evidence.
  One post-install StackChan refresh completed after reconnecting stale iPhone
  Wi-Fi routing; the Bridge queue returned to zero. The stale VPN/Wi-Fi route
  remains an operational residual. Two correlated Chat samples now complete in
  `5.281-10.383` seconds; relay/model response-header wait is the dominant and
  variable stage. See the
  [latency repair report](reports/chat-latency-observability-repair-20260717.md).

- The 2026-07-17 standard Chat memory/style repair is live in
  `xiaoxin-cloud-api:20260717T184100-chat-memory-style`. Standard authenticated
  turns now persist atomically, send explicit candidate-memory consent only
  when the owner enables the iOS setting, keep candidates review-required, and
  inject the read-only `girlfriend_style` profile. The iOS client uses a
  90-second Chat transport timeout. A final owner-triggered standard turn
  increased the sanitized Chat counts from `12/3/2/2/6` to `14/4/2/2/7`
  (messages/session deltas/memory atoms/open reviews/usage logs); the two
  preference candidates remained open and unpromoted. The API returned `200`
  in about `4.29 s`, with no traceback, and API/DB restart counts remained
  zero. The server-side integration is accepted; a saved iOS console capture
  of the final visible reply was unavailable, so that client-visible check is
  retained as an owner-observed residual. See the
  [standard Chat memory/style repair report](reports/standard-chat-memory-style-repair-20260717.md).

## 2026-07-17: Authenticated Chat Latency Observability Repair

Task level: `L3 repair execution` after a bounded L2 latency audit and explicit
owner authorization. The change added content-free trace correlation and
timings only; model, timeout, memory, persistence, retry, Health, Provider/MCP,
StackChan, VPS, Cloudflare, and database behavior remained unchanged.

### Deployment And Verification

- Current image:
  `xiaoxin-cloud-api:20260717T170800-chat-latency`, API container
  `f20a286a6f31e3b27b582d0b4066f8898018d1956aea8dc5785341de9aa8ab94`.
  PostgreSQL stayed at
  `bff211a48f2922d0c3351bed1d6a8b4f10b72ed578b92c34477f75f33ddb072a`.
- Root-only rollback anchors:
  `/var/backups/xiaoxin-auth/20260717T164318+0800/chat-latency-before` and
  `/var/backups/xiaoxin-auth/20260717T171455+0800/chat-latency-logfix-before`.
  PostgreSQL dump, Chat SQLite online backup, and manifests passed.
- The signed same-bundle App preserved its login data. Its Host binary SHA-256
  is `d3c9e66b47ea5ab10a235003ae569b401fbff66bc84ad2545e2f15bde8db91c3`.
- Local verification passed `1772` full Python tests on the first candidate,
  `62` focused Python tests and `30` Swift tests on the final log-sink
  candidate, plus Ruff, compileall, codesign, image source hash, archive, public
  health/auth, and API-only cutover checks.

### Live Attribution

- Correlated temporary samples completed in `5281.3 ms` and `10382.5 ms`.
  Token lookup was below `0.4 ms`; API/model phases were `4590.5/4589.9 ms`
  and `9624.7/9624.2 ms`.
- Relay waits for response headers were `4192.1 ms` and `9248.0 ms`.
  Their `5.056 s` increase explains about 99% of the total sample variation.
- Client HTTP minus API time was a secondary, steadier `688.4-756.5 ms`.
  Pre/post-model, decode, and body-read work were negligible.
- The dominant wait is therefore upstream of local API processing and inside
  the relay/model response-header interval. Current evidence cannot distinguish
  relay queueing from provider model inference.
- The non-streaming UI exposes the entire wait before showing the complete JSON
  reply. Streaming or a model/config comparison requires a separately named
  repair decision.
- All temporary repair turns left the exact `4/0/0/2` Chat-table baseline
  unchanged. Final API/DB health is good, restart counts are zero, and no recent
  traceback/error was found.

Detailed evidence, limitations, and rollback are in the
[latency repair report](reports/chat-latency-observability-repair-20260717.md).

## 2026-07-17: Authenticated Chat And Combined iOS Field Acceptance

Task level: `L3 repair execution` after L2 evidence, local candidate
verification, and explicit owner authorization. Live scope was limited to the
Xiaoxin API image and Chat configuration, an isolated Chat volume, API-only
recreation, and installation of the signed combined Chat/StackChan iOS App.
Health, Provider/MCP, display, motion, audio, camera, touch, VPS, Cloudflare,
tunnel configuration, database schema, account mutation, and standard
persisted Chat were excluded.

### Backup And Deployment

- Fresh verified root-only backup:
  `/var/backups/xiaoxin-auth/20260717T120205+0800/authenticated-chat-before`.
  It contains Compose, the byte-preserved NAS override, private environment,
  container/image metadata, PostgreSQL dump, and the Chat-off intermediate
  state.
- The candidate archive transferred and checksum-verified before load. The
  deployed image is `xiaoxin-cloud-api:20260717T114059-chat-candidate`; the API
  container ID is
  `d00fde12324ea0245ffab9731f92f77a93fcfb05af1be186fe143fa6b216ab5e`.
- The PostgreSQL container remained unchanged at
  `bff211a48f2922d0c3351bed1d6a8b4f10b72ed578b92c34477f75f33ddb072a`.
- Compose gained only the reviewed Chat image/environment/mount additions and
  the isolated `xiaoxin-cloud_xiaoxin-chat-memory` volume. The deployment
  environment remains `0600 root:root`; no token, relay key, or full owner UUID
  was printed.
- The server was recreated with Chat explicitly off first. Health, readiness,
  auth parity, unchanged DB identity, mount/security settings, and route
  absence passed before a second API-only recreation enabled Chat. Public
  `GET /v1/chat` then changed from `404` to the expected `405`.
- The signed combined App installed with the existing Bundle ID and retained
  the existing signed-in session. App launch completed token refresh with HTTP
  `200`; neither Chat nor StackChan sent an unprompted request.

### Owner-Visible Verification

- The owner selected temporary mode and sent one public-safe message. API logs
  record `POST /v1/chat` HTTP `200` at `2026-07-17T12:26:42+08:00`; the App
  displayed the exact correlated reply `临时对话联调成功`.
- The client rejects a temporary response unless its conversation ID matches
  and `memory_status=ephemeral`. Post-turn SQLite integrity is `ok`, while
  `conversation_messages`, `session_deltas`, `memory_atoms`, and
  `model_usage_logs` remain zero.
- The interval from the same-turn token refresh completion to Chat completion
  was about `16.3` seconds. The request was correct and stable but subjectively
  slow; no performance configuration was changed during acceptance.
- The first post-Chat StackChan refresh and a Safari health probe timed out
  before reaching the Bridge. Mac listener, allowlist, process, and health were
  intact. Reconnecting iPhone Wi-Fi restored two iPhone `/healthz` requests,
  both HTTP `200`, matching the known stale VPN/Wi-Fi route residual.
- The next single manual refresh completed iPhone enqueue `202`, worker poll
  `200`, result upload `202`, iPhone result read `200`, and ACK `200`. The UI
  displayed battery `100%`, network `Wi-Fi`, uptime `3 hours 18 minutes`, and
  firmware `uiflow2-v2.4.8`; final Bridge queue depth was zero.
- Final public health/readiness passed, the API and DB remained healthy, and no
  Chat traceback or StackChan command from the Chat turn was found.

### Rollback And Residual Risk

- Server rollback restores the retained backup's Compose/environment and prior
  image, then recreates only the API. Keep the new Chat volume and temporary
  archives intact during routine rollback; do not restore the PostgreSQL dump
  unless disaster recovery is required.
- iOS rollback App:
  `scratch/projects/personal-ai-companion/stackchan-continuous-20260717/ios-status-snapshot-retention-20260717-1018/DerivedData/Build/Products/Debug-iphoneos/PersonalAICompanionHost.app`.
- Standard persisted Chat, repeated Chat latency, streaming, model selection,
  repeated cold-boot reliability, automatic iPhone VPN/LAN route recovery, and
  App Store/TestFlight distribution remain unaccepted. No commit or push was
  performed by this deployment acceptance.

## 2026-07-16: Health Shortcut Security Hardening Dark Deployment

Task level: `L3 repair execution` after L2 evidence, local verification, and
explicit owner authorization for the `home-nas-wg` dark-deployment slice.
Live scope was limited to the Xiaoxin API image, the additive Alembic revision,
and API-only recreation. The health route remained disabled. The database
container, credential issuance, phone/HealthKit/Shortcut actions, VPS,
Cloudflare, and tunnel services were outside the deployment scope.

### Changes

- Restored the Mac's existing owner-only WireGuard client path and used
  `home-nas-wg` for deployment transport. No NAS, VPS, Cloudflare, or remote
  firewall configuration was changed during that client repair.
- Uploaded and verified the fixed gzip image archive, then loaded
  `xiaoxin-cloud-api:20260716T111947-health-dark`. The archive SHA-256 is
  `cd93ad33a71e2ee5d18f246ecb77aeabc75a81a7c77bee6662fde799f3997222`.
  The NAS platform-image ID is
  `sha256:d84a3b7aaba4dc69260b9b0bc62673bb9fdc14e25446edd6ae7fa523aef9fa46`;
  its normalized architecture, startup configuration, and RootFS matched the
  locally inspected image. The differing local top-level ID was the containerd
  image-index digest, not a content mismatch.
- Installed only the reviewed source, Alembic, and deployment-file allowlist.
  The NAS Compose overlay remained byte-identical. The private environment was
  changed only for the immutable API image tag and explicit
  `XIAOXIN_HEALTH_SHORTCUT_ENABLED=false`; all unrelated lines were identical.
- Applied Alembic revision `20260716_0001` and recreated only the API. The
  PostgreSQL container ID remained unchanged.

### Verification

- Pre-deployment local verification passed: `1711` full Python tests and `147`
  focused cloud tests. Container migration, default-off, and security checks
  also passed before live execution.
- Post-deployment source review repaired the stream-buffer ordering and audit
  retention trigger coverage. Product `5225740` then passed `38` focused tests,
  `1713` full Python tests with the existing warning, targeted lint/format,
  compileall, Alembic-head, and staged GitNexus checks. This source has not been
  rebuilt or redeployed.
- The migration created the 9-column scoped-credential table, the 7-column
  metadata-only audit table, all 6 required indexes, and the owner cascade
  foreign key. Both tables contained zero rows after API startup.
- The new API container is healthy, uses a read-only root filesystem, drops all
  capabilities, retains `no-new-privileges`, and publishes only on loopback.
  No startup traceback or residual one-off migration container was found.
- Internal and public `/healthz`, `/readyz`, and `/v1/auth/capabilities`
  returned HTTP 200. Public TLS verification passed. Internal and public
  `POST /v1/health/shortcut-analysis` returned HTTP 404, confirming the dark
  route remained absent.
- The original backup, the immediate pre-install source/environment backup,
  and the cutover rollback set all passed checksum verification.

### Rollback And Remaining Gates

- Primary backup:
  `/var/backups/xiaoxin-auth/20260716T111947+0800/health-dark-before`.
  It retains the original stack, private environment, database dump, candidate
  evidence, and API-only cutover rollback files under root-only permissions.
- Routine rollback restores the prior image/environment/Compose and recreates
  only the API. The additive schema is left unused; normal rollback must not
  run an Alembic downgrade. The database dump remains disaster-recovery only.
- This deployment proves the additive schema and default-off backend cutover,
  not parity with the later accepted source `5225740`. It does not prove
  real-device HealthKit authorization, real health-data minimization, Shortcut
  installation/execution, real scoped-credential handoff, or a phone HTTPS
  request. A post-repair image rebuild/deployment and those owner-visible
  checkpoints remain independent gates.

## 2026-07-16: Health Dark Deployment Stopped Before Cutover (Historical)

This section records the earlier fallback-path attempt. The later completed
deployment above supersedes its then-current residual checks and next action.

Task level: `L3 repair execution` after L2 evidence and local verification.
Authorization: the owner explicitly said `进入修复阶段`, confirmed the
`home-nas` fallback dark-deployment slice, and extended its execution window to
two hours. The approved scope was a fresh backup, gzip image transfer, additive
Alembic migration, and API-only recreation with the health route kept disabled.
Database-container recreation, credential issuance, phone/HealthKit/Shortcut
actions, tunnel changes, and Cloudflare changes were outside the slice.

### Completed Evidence

- Verified pre-change backup:
  `/var/backups/xiaoxin-auth/20260716T111947+0800/health-dark-before`.
  The root is owner-only and contains the live stack, private environment,
  runtime anchors, and a custom-format PostgreSQL dump. Dump listing and
  checksums passed before transfer began.
- The locally verified candidate image was
  `xiaoxin-cloud-api:20260716T111947-health-dark`, image ID
  `sha256:eaa4d56c933aed4b29d72ea258fb586ce7aa72ecc2f4a2e078e0600e5bf07136`.
- The single `docker save | gzip -1 | ssh ... docker load` transfer remained
  connected but did not complete its remote image-ID equality check within the
  safe execution margin. It was terminated at the declared `13:20 +08:00`
  stop point after approximately 99 minutes. No second transfer was started.
- No deployment files or environment values were installed, Alembic was not
  run, and neither the API nor database container was recreated.
- After the stop, public HTTPS checks returned `200` for `/healthz`, `/readyz`,
  and `/v1/auth/capabilities`; `POST /v1/health/shortcut-analysis` returned
  `404`. This confirms the user-visible baseline remained available and the
  health route remained disabled.

### Stop Condition And Residual Checks

- A separate SSH read-only probe during the saturated transfer and the final
  post-stop SSH probe both timed out during banner exchange before any remote
  command ran. Per the approved stop condition, no SSH retry or L3 action was
  attempted afterward.
- The previously observed API image and database container were not changed by
  this run, but their final internal IDs were not re-read after the stop.
- Whether the interrupted `docker load` left untagged layers, and whether the
  candidate tag is absent, remain unconfirmed. A future slice must begin with a
  fresh read-only SSH/disk/image/container preflight and a new bounded window.
- A local restart artifact was prepared under excluded scratch storage as a
  `0600` gzip archive (`76,350,922` bytes), SHA-256
  `cd93ad33a71e2ee5d18f246ecb77aeabc75a81a7c77bee6662fde799f3997222`.
  It contains the already verified image and no deployment environment or
  credential material. A future slice may transfer it resumably, verify the
  full checksum, and only then invoke `docker load`.
- The verified backup remains the rollback anchor. No rollback was invoked
  because no config, schema, or running-container cutover occurred.

## 2026-07-14: Native Google Logout Repair And Orphan-Family Revocation

Task level: `L3 repair execution` after L2 evidence.
Authorization: the owner explicitly said `进入修复阶段` for the iOS
`401`/pending-marker defect and the single family created by this acceptance
run. No deployment, restart, config change, schema change, account merge, or
account/data deletion was authorized or performed.

### Confirmed Defect And Code Repair

- The App logout UI cleared the local session, but `/v1/auth/logout` returned
  `401 invalid_refresh_token`; the newly created family remained active.
  Keychain then showed `session=0` and `pending=0`.
- Confirmed client defect: `revokePendingSession` treated `401` as resolved and
  removed the pending marker even though no server revocation occurred.
- Exact credential mutation or mismatch point is unconfirmed because the local
  value was securely deleted and neither request bodies nor token digests were
  logged or re-read.
- Product commit `b8462a9` maps `invalid_refresh_token` distinctly, retains the
  pending marker after every error or non-`204` 2xx response, accepts only HTTP
  `204` as logout success, and adds exchange-to-persist-to-view-model-to-signout,
  `401`, `202`, crash-recovery, and server logout coverage.
- Verification passed: focused Google/token tests `20`, full Python `1161`,
  targeted Ruff, AppFlow smoke, Swift App target build, and Simulator Host
  build. GitNexus `detect_changes` reported only the three intended product
  files at high auth-flow risk. The repaired Host was installed on
  `PAC-Identity-Gate-QA`; fresh UI was signed out and Keychain remained `0/0`.

### Live Backup And Transaction

- The first dump attempt at
  `/var/backups/xiaoxin-auth/20260714T141835+0800/pac-google-orphan-family-revoke`
  failed before a usable dump because of an invalid `pg_dump` argument. It did
  not modify the database and is not a rollback anchor.
- Verified backup:
  `/var/backups/xiaoxin-auth/20260714T141922+0800/pac-google-orphan-family-revoke`.
  It contains a PostgreSQL custom-format dump plus sanitized before/after family
  and aggregate snapshots. `pg_restore --list` and `SHA256SUMS` passed; dump
  SHA-256 is
  `d59e335d49d727ce6ccb91f744fe92b588cf26f0ea196437158c83e88935aaeb`.
- The transaction located exactly one active family using owner ref
  `d07f3d8eda88`, family ref `b18f957e7597`, exact creation time
  `2026-07-14T13:30:00+08:00`, native-Google identity membership, and token
  counts `1 total / 0 used / 1 unused`. It locked the candidate and required
  `UPDATE rowcount=1`; otherwise the transaction would have rolled back.
- The target became revoked at `2026-07-14T14:22:57+08:00`. All other family
  snapshot rows were byte-identical. Counts changed only from `4 active / 2
  revoked` to `3 active / 3 revoked`; users `3`, identities `3`, storage objects
  `0`, and retained email credentials `1` were unchanged.
- Public health, readiness, and capabilities remained healthy. Google and
  Authentik stayed available; built-in email and OTP stayed disabled.

### Rollback State And Limits

- Database rollback was not invoked. The family revocation is intentionally
  irreversible; normal recovery is a user-controlled same-account Google
  re-login. The full dump is a disaster-recovery anchor, not a routine way to
  re-enable one family.
- The pre-install QA `.app` is retained under excluded scratch material. The
  final repaired build is installed and signed out; no Simulator data reset was
  performed.
- Direct requests using the deleted old access/refresh values were not replayed.
  Live rejection is supported by the inactive family and server contract, and
  automated tests directly prove both token classes are rejected after family
  revocation; direct live token replay remains unconfirmed.

## 2026-07-14: Native Google Owner Acceptance Checkpoint (Historical)

Task level: `L3 repair execution` with an L2-first evidence pass.
Authorization: the parent task explicitly entered repair mode for the Xiaoxin
native-Google lifecycle slice. At this historical checkpoint no production
repair had yet been justified or applied; the later section above supersedes
its current-state conclusions.

### Read-Only Baseline

- Public health and readiness passed. The running image remained
  `xiaoxin-cloud-api:20260713T0137-native-google`; native Google and Authentik
  were available, while built-in email and OTP remained disabled.
- Sanitized database aggregates showed three user records: one password-only
  record and two distinct one-provider OIDC records. No user had both the
  native-Google and Authentik identities. Their normalized-email fingerprints
  differed. No email, subject, token, object content, or complete identifier was
  read or recorded.
- All three owners had zero cloud-storage objects, so live historical cloud-data
  continuity could not be proven by an object round trip. Local App history was
  visible after session restoration, but that does not prove continuity with
  the earlier Authentik owner.

### Authorized Live Acceptance Action

- Target: launch the already installed App with an existing native-Google
  session older than the public 300-second access-token TTL.
- Reason: verify automatic refresh and rotation without exporting credentials.
- Risk: consume and rotate exactly one refresh token in the current family.
- Rollback: do not restore the old token; retain the newly rotated current token
  and stop on any owner/family drift or HTTP failure.
- Verification: compare only sanitized family version/used/unused counts before
  and after launch, then inspect the authenticated UI state.
- Result: the same family advanced from 10 to 11 token versions, used versions
  advanced from 9 to 10, and unused current versions remained exactly 1. No
  other family changed. The App restored directly and displayed its local
  history.

### Stop Condition And Residual Risk

- The current native-Google account cannot be declared the original account
  because it is not attached to the earlier Authentik user. Different verified
  email fingerprints also prevent the existing safe auto-link rule from
  joining them.
- No database link, identity move, account merge, storage move, code change,
  config change, service restart, or deployment was performed.
- App logout would delete the local session and revoke the active live family.
  That UI action awaits explicit action-time owner confirmation. Re-login then
  requires the owner to select the intended Google account in Google's UI.
- See
  [native-google-owner-acceptance-20260714.md](reports/native-google-owner-acceptance-20260714.md)
  for the evidence matrix and exact remaining checkpoint.

## 2026-07-13: StackChan LCD Bridge Replacement And Bounded E2E Acceptance

Task level: `L3 repair execution`, followed by `L1 engineering closeout`.
Authorization: the owner explicitly entered repair mode for the bounded live
slice. The later closeout reused existing evidence and made no Bridge, device,
LAN-service, credential, or deployment request.

### Live Change And Field-Confirmed Result

- Replaced the stale private Bridge listener only after confirming the existing
  v0.1 queue was empty. The replacement retained the existing private listener,
  owner-only boundary, allowlist, token-file reference, and queue configuration.
- Verified the replacement listener reported `stackchan.command.v0.1`, exposed
  the authenticated LCD command/result routes, and initially had queue depth
  `0`.
- The owner then completed exactly one App-driven `happy` transaction and
  confirmed its correlated ACK and visible screen change.
- The owner completed exactly one App-driven `neutral` transaction and
  confirmed its separate correlated ACK and visible screen change.
- The final safety state was `neutral`; final Bridge queue depth was `0`.

### Durable Source And Local Verification

- Product commit `9dbfafc` on `codex/initial-private-publish` contains the
  bounded App client and injection seam, Keychain credential provider,
  fail-closed Host configuration, authenticated `/app/v0.1/lcd/commands` and
  `/app/v0.1/lcd/results/{bridge_request_id}` routes, ACK correlation,
  idempotency/TTL handling, Simulator-only UI test target, and focused tests.
- Independent local closeout passed `37` focused E2E/Bridge tests and
  `1080` full Python tests, targeted Ruff, Python compileall, App target build,
  four Swift smoke products, and Simulator `build-for-testing` for
  `StackChanLCDE2EUI`.
- The pre-change Bridge source remains as a SHA-256-verified local rollback
  anchor in excluded product-worktree rollback material. It is not product
  source and was not committed during closeout.

### 2026-07-14 Local ACK Route Hardening

- A local independent review reproduced that a `/stackchan/events` ACK with
  mismatched top-level and body command IDs could bypass LCD verification and
  be accepted as a generic event.
- Product commit `9dbfafc` validates every ACK event before routing decisions.
  The malformed event now returns HTTP `409` with
  `command_correlation_mismatch`; the queued command and pending LCD result are
  unchanged.
- A real loopback HTTP regression covers the route. This was source/test work
  only: no Bridge, device, LAN service, credential, database, or deployment was
  accessed or changed.

### Boundary And Residual Risk

- The real v0.1 live allowlist remains exactly `happy` and `neutral`.
- The 12 App expression families and their four-frame animations are local
  preview assets only; they were not sent to the device as a 12-state protocol.
- This acceptance does not cover audio, motion, camera, touch, memory,
  HealthKit, automatic/background polling, firmware, other hardware, repeated
  reliability, unattended operation, real-device signing, App Store release,
  or broader production deployment.
- Any repeat live command, Bridge replacement, reliability run, or capability
  expansion is a new task and requires a fresh risk gate and rollback review.

## 2026-07-13: Native Google Sign-In Dual-Track Deployment

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode and separately confirmed
creation of the production iOS OAuth client.
Live scope: Xiaoxin API on `oc-nas`, its existing VPS HTTP proxy tunnel, Google
Auth Platform project `xiaoxin-502211`, the public Xiaoxin endpoints, and the
`PAC-Identity-Gate-QA` Simulator. Authentik configuration was not changed.

### Changes

- Created Google iOS OAuth client `小芯 iOS` for Bundle ID
  `xyz.nodezjc12348888.xiaoxin`; retained the existing Web OAuth client as the
  Google SDK `serverClientID`.
- Added the official GoogleSignIn iOS SDK, the reversed Google callback scheme,
  and a native App flow that prefers Google nonce/ID-token exchange while
  retaining Authentik as automatic fallback and email as a visible fallback.
- Added `POST /v1/auth/google/nonce` and `POST /v1/auth/google/exchange`, with an
  additive one-time nonce table and strict signature, `aud`, `azp`, `iss`,
  `iat`, `exp`, nonce, and `email_verified` checks.
- Verified-email matching reuses existing email or Authentik users instead of
  creating a second Xiaoxin account.
- Added `XIAOXIN_GOOGLE_JWKS_PROXY_URL` for Google public-key downloads only.
  The URL is credential-free and validated as an explicit HTTP(S) proxy origin;
  HTTPX environment proxy inheritance is disabled so Authentik traffic is not
  rerouted.
- Deployed `xiaoxin-cloud-api:20260713T0137-native-google` with native Google,
  legacy Authentik OIDC, and email login all enabled. SMS OTP remains disabled.

### Backups And Evidence

- NAS backup root:
  `/var/backups/xiaoxin-auth/20260713T013711+0800/native-google-before`
- The root contains the pre-change PostgreSQL dump, cloud source, `.env`,
  Compose, dependency files, prior image record, and before/after health and
  capability responses. Files are mode `0600`; directories are mode `0700`.
- Pre-change image: `xiaoxin-cloud-api:20260712T2352-google-state`.
- Local repair workspace:
  `scratch/projects/personal-ai-companion/native-google-repair-20260713T013711+0800`
- The old Simulator Bundle ID `com.local.personal-ai-companion` remains
  installed with its separate data container. It was not deleted or migrated.

### Verification

- Focused cloud regression passed `57` tests; targeted Ruff and
  `git diff --check` passed.
- The final iOS Simulator build succeeded with GoogleSignIn `9.2.0`. Its built
  plist contains the production Bundle ID, iOS Client ID, Web server Client ID,
  legacy `xiaoxin` scheme, and reversed Google scheme.
- Candidate and running containers fetched Google's JWKS through the dedicated
  proxy. The API container cannot reach Google directly, so this proxy check is
  a deployment requirement rather than an optional optimization.
- The new image is running healthy; the deployment status is `complete`; the
  Xiaoxin reverse tunnel is active. Public health reports API, database, and
  storage `ok`.
- Public readiness and capabilities report native Google, Authentik OIDC, email,
  tokens, and storage available; OTP remains unavailable. Public nonce issuance
  returns a 300-second, 43-character nonce.
- The legacy Authentik start route still preserves its dedicated flow, callback,
  matching state, and PKCE `S256`; an invalid email request still reaches the
  live route and returns HTTP 422.
- The newly installed App displays the official Google button. Tapping it opens
  `accounts.google.com` with `继续前往小芯` directly, without rendering an
  Authentik intermediate page.

### Rollback

Restore the backed-up cloud files, `.env`, Compose, dependency files, and image
record from the NAS backup root, then recreate only the API:

```bash
cd /volume1/docker/stacks/apps-xiaoxin/deploy/xiaoxin
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml config --quiet
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml up -d --no-deps --force-recreate api
```

The deployment script contains the same automatic rollback and did not invoke
it. The new nonce table is additive; an API-image rollback may leave it unused.
Restore the database dump only for disaster recovery or a deliberate schema
rollback, not as the first recovery action.

### Residual Risk

- No Google credentials were entered during automated acceptance. Subsequently,
  the owner confirmed a real native exchange and direct App entry after restart.
  Original-account and historical-data continuity, forced refresh rotation,
  remote invalidation/logout, and the complete logout/re-login matrix remain
  independently unconfirmed.
- Native Google login depends on the existing NAS-to-VPS proxy listener at
  `172.20.0.1:18989` for key refresh. Cached keys reduce request frequency but
  do not remove that dependency during Google key rotation.
- At the 2026-07-13 deployment, the source came from the dirty product-polish
  worktree. That source lineage was later committed at `b9a5d7b`, was present by
  StackChan landing commit `9dbfafc`, and was recorded in then-current
  `main@72258a1`; current product authority is `main@1abf23a`. Exact byte-for-byte or
  build-provenance correspondence between the running image and a specific
  commit remains unconfirmed without independent evidence. A signed real-device
  or App Store build also remains unconfirmed.

## 2026-07-13: Unverified Email Authentication Disabled

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode after choosing to close
the email registration/login surface and leave its App button disabled.
Live scope: Xiaoxin API configuration on `oc-nas`, public auth capabilities and
routes, and the `PAC-Identity-Gate-QA` Simulator. No database, user, Authentik,
Google Cloud, tunnel, or product-code change was made.

### Reason And Change

- The initial email registration path validated syntax, password strength, and
  rate limits, but created a password account and issued Xiaoxin tokens without
  proving mailbox ownership.
- Native Google account linking searches existing password credentials by the
  verified Google email. Allowing unverified password registrations therefore
  created an account-preclaim risk.
- A read-only aggregate check found two users, one email credential, one OIDC
  identity, and zero users shared by both credential types. No email addresses
  or private records were read.
- Set `XIAOXIN_EMAIL_AUTH_ENABLED=false` and recreated only the API. The image
  remains `xiaoxin-cloud-api:20260713T0137-native-google`.

### Backups And Verification

- NAS backup root:
  `/var/backups/xiaoxin-auth/20260713T020019+0800/email-disable-before`
- The root contains the prior `.env`, Compose file, image record, and
  before/after health, readiness, and capability responses. Files are mode
  `0600`; the deployment status is `complete`.
- Public health still reports API, database, and storage `ok`. Readiness reports
  Google and legacy OIDC available, email and OTP unavailable, and login still
  available overall.
- Public capabilities report
  `email={available:false,registration:false}`. Valid-shaped email registration
  and login requests both return HTTP 503 with `email_auth_unavailable`.
- Native Google nonce issuance still returns a 300-second, 43-character nonce;
  the existing image is healthy and the Xiaoxin tunnel remains active.
- After App restart, the Google button is enabled. The `注册 / 登录` button is
  visibly gray, exposed as disabled to accessibility, and a click is a no-op.

### Rollback And Residual Risk

Restore `xiaoxin.env` and `compose.yaml` from the backup root, validate Compose,
and recreate only the API to re-enable the previous email behavior. No database
restore is required.

The retained email credential and its data remain in the database. Its owner
cannot start a new password session while email auth is disabled, although
already-issued access/refresh tokens continue under the existing token rules.
Email registration must not be reopened until mailbox verification and safe
Google-linking behavior are implemented and separately accepted.

## 2026-07-12: Xiaoxin Google OAuth And Email Authentication

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode and approved the Google
user-data policy / production audience confirmation.
Live scope: Xiaoxin API on `oc-nas`, Authentik on `oc-nas`, the RackNerd VPS SSH
tunnel entry, Google Auth Platform project `xiaoxin-502211`, and the public
`auth.nodezjc12348888.xyz` / `xiaoxin.nodezjc12348888.xyz` endpoints.

### Changes

- Published the Google OAuth application from testing to production audience.
- Created and enabled the Authentik Google OAuth source and bound it to
  `default-authentication-identification`, so the login flow now presents
  `Continue with Google` while retaining the email/username field.
- Configured the Authentik application/provider pair for Xiaoxin authorization
  code flow with PKCE and the exact callback `xiaoxin://oauth/callback`.
- Replaced the Xiaoxin provider's default `email_verified=false` scope with the
  Xiaoxin-specific `Xiaoxin Google verified email` mapping. It reports a
  verified email only when the Authentik user has source slug `google`.
- Routed Authentik outbound Google requests through the existing VPS SOCKS
  bridge because the NAS cannot reach Google directly.
- Updated the Xiaoxin API OIDC HTTP client to send the explicit user agent
  `xiaoxin-cloud/1.0`, avoiding Cloudflare 1010 rejection of Python's default
  user agent.
- Deployed `xiaoxin-cloud-api:20260712T2206-email-auth`, enabling real email
  registration/login with scrypt password hashes and bounded per-email/per-IP
  rate limits.
- Kept SMS OTP disabled.
- Hardened the three NAS reverse SSH tunnels with keepalives/retry limits and
  removed the unused Xiaoxin-local `172.19.0.1:18989` forward. The required
  VPS-side `127.0.0.1:29147` reverse API listener remains active.

### Backups And Evidence

- NAS repair root: `/var/backups/xiaoxin-auth/20260712T181613+0800`
- Full pre-repair Authentik/PostgreSQL/config/tunnel backup is retained under
  that root.
- Pre-Google-stage-bind Authentik dump:
  `authentik-before-google-stage-bind.sql` (`0600`).
- Pre-Xiaoxin-verified-email Authentik dump:
  `authentik-before-xiaoxin-verified-email.sql` (`0600`).
- Pre-email Xiaoxin API backup and database dump: `email-before/`.
- Pre-final-tunnel unit: `tunnel-final-before/xiaoxin-vps-tunnel.service`.
- VPS backup: `/root/codex-repair-xiaoxin-auth-20260712T181613+0800/backup`
- Local repair workspace:
  `scratch/projects/personal-ai-companion/auth-google-repair-20260712T181613+0800`
  (contains root-only credential artifacts; never commit or publish it).

### Verification

- Google Auth Platform audience status is `Production`.
- Authentik Google source login redirects to `accounts.google.com`; the default
  authentication flow visibly presents the Google button and email/username
  input.
- Public Authentik discovery is available, advertises the Xiaoxin issuer, and
  supports `S256` PKCE.
- Xiaoxin API image is `xiaoxin-cloud-api:20260712T2206-email-auth`; the
  container is running and healthy.
- Public `/healthz` reports API, database, and storage `ok`.
- Public `/v1/auth/capabilities` reports OIDC available, email registration and
  login available, and OTP unavailable.
- Invalid empty email registration reaches the real route and returns HTTP 422
  instead of the prior 404.
- Public OIDC start returns Authentik authorization, exact Xiaoxin callback,
  and `code_challenge_method=S256`.
- Focused local tests passed: 11 email/capability/OIDC tests. One existing
  Starlette deprecation warning remains.
- `PersonalAICompanionAppFlowSmoke` passed, and the Swift package App target
  built successfully (with Swift's non-blocking automatic-product warning).
- VPS `127.0.0.1:29147` is listening and serves the Xiaoxin health endpoint;
  the final NAS tunnel unit is active with zero restarts.
- A real Google account completed source enrollment as external, non-admin user
  `zjc2944678910`. The Google source is attached only to this user; `akadmin`
  has no source connection.
- A real authorization-code exchange completed with HTTP 200, PKCE `S256`, the
  expected Google email and display name, and both access and refresh tokens.
  The one-time authorization codes and returned tokens were not displayed or
  retained.

### Rollback

Email/API rollback anchor:

```text
/var/backups/xiaoxin-auth/20260712T181613+0800/email-before
xiaoxin-cloud-api:20260712T2136-oidc-ua
```

Restore `email-before/xiaoxin.env`, `xiaoxin-compose.yaml`, and the backed-up
cloud source files to `/volume1/docker/stacks/apps-xiaoxin`, remove the newly
added `email_auth.py`, then recreate only the API with:

```bash
cd /volume1/docker/stacks/apps-xiaoxin/deploy/xiaoxin
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml up -d --no-deps --force-recreate api
```

Tunnel rollback anchor:

```text
/var/backups/xiaoxin-auth/20260712T181613+0800/tunnel-final-before/xiaoxin-vps-tunnel.service
```

Restore that file to `/etc/systemd/system/xiaoxin-vps-tunnel.service`, run
`systemctl daemon-reload`, and restart only `xiaoxin-vps-tunnel.service`.

The Authentik Google stage binding can be rolled back by removing source slug
`google` from `default-authentication-identification`; use the retained
pre-binding dump only for full-database disaster recovery, not as the first
rollback choice.

### Residual Risk

- External Authentik users are intentionally denied access to Authentik's
  internal user-settings interface. That `Permission denied` page is not an
  application-login failure; the iOS callback and Xiaoxin token exchange are
  the supported completion path.
- Rolling back the API image leaves the newly created email-auth tables unused;
  restoring the database dump is only necessary if those tables must also be
  removed and no post-deployment user data needs preservation.
- Credential and environment artifacts in the local repair workspace and NAS
  backups are sensitive and must remain untracked with restrictive permissions.

## 2026-07-12 Google Direct Login Repair

### Root Cause

- `/v1/auth/oidc/start` returned Authentik's generic authorization endpoint, so
  tapping `使用 Google 继续` first rendered the Authentik loading shell.
- The iOS `ASWebAuthenticationSession` reused browser state, which could expose
  the flow to an unrelated authenticated Authentik administrator session.
- The first dedicated-flow API image nested the OIDC request under `next` but
  omitted the duplicate top-level `state` required by the existing iOS
  fail-closed response parser. The App rejected that response before opening
  the browser; the follow-up image restored the existing contract.

### Changes

- Created Authentik flow `xiaoxin-google-authentication` with authentication
  requirement `require_unauthenticated` and one Identification stage containing
  only source slug `google`, no user fields, and no passwordless flow. Authentik
  2026.2.1 therefore auto-redirects to Google.
- Bound the Xiaoxin OAuth2 provider's authentication flow to that dedicated
  flow without changing the shared default authentication flow.
- Added `XIAOXIN_OIDC_LOGIN_FLOW_URL`. The API accepts only a clean, same-origin
  HTTPS Authentik `/if/flow/<slug>/` URL and wraps the original authorization
  request as a relative `next` value.
- Preserved `state`, `nonce`, the exact `xiaoxin://oauth/callback`, and PKCE
  `S256`; the same `state` is exposed at both outer and inner levels for the iOS
  parser, while the code verifier remains server-only.
- Set `ASWebAuthenticationSession.prefersEphemeralWebBrowserSession = true` so
  Xiaoxin login cannot reuse an Authentik administrator cookie.
- Final live image: `xiaoxin-cloud-api:20260712T2352-google-state`.
  Intermediate image `xiaoxin-cloud-api:20260712T2334-google-direct` is retained
  only as a rollback/debug anchor.

### Verification

- Public health reports API, database, and storage `ok`; capabilities still
  report OIDC and email available, SMS OTP unavailable, and storage available.
- Public OIDC start returns outer path
  `/if/flow/xiaoxin-google-authentication/` with only `next` and `state`; the
  relative inner authorization request retains callback, nonce, matching state,
  and `code_challenge_method=S256`, with no code verifier.
- A clean in-app browser session reached `accounts.google.com` and displayed the
  Google account login UI.
- The rebuilt App was installed on Simulator `PAC-Identity-Gate-QA`; tapping
  `使用 Google 继续` opened `accounts.google.com` and displayed Google's email
  login field. No credentials were entered and no login was submitted.
- The only Google source connection remains external, non-admin user
  `zjc2944678910`; `akadmin` has zero source connections.
- Focused Python verification passed: 18 tests. Ruff passed. Swift AppFlow smoke
  passed with a dedicated-flow response fixture. The Simulator Host Xcode build
  succeeded.

### Backups And Rollback

- Full direct-flow pre-change backup:
  `/var/backups/xiaoxin-auth/20260712T181613+0800/google-direct-before-20260712T233442+0800`
  contains both PostgreSQL dumps, API files, `.env`, Compose, and the prior image
  record.
- Top-level-state pre-change backup:
  `/var/backups/xiaoxin-auth/20260712T181613+0800/google-state-before-20260712T235249+0800`
  contains the Xiaoxin database dump, OIDC source, `.env`, and prior image
  record.
- Full rollback: restore the first backup's API files, `.env`, and Compose,
  recreate only the API using its recorded image, then run the retained
  `rollback-xiaoxin-google-direct.py` through the Authentik shell. Use the
  Authentik database dump only for disaster recovery.
- A narrow rollback of only the final state-compatibility image returns to
  `xiaoxin-cloud-api:20260712T2334-google-direct`, but that image is incompatible
  with the current iOS parser and is not a user-facing recovery target.

### Residual Risk

- Authentik's shell can be visible briefly while its JavaScript loads and
  auto-redirects the single source. Browser and Simulator verification both
  completed the transition to Google; eliminating the shell entirely would
  require a custom Authentik server endpoint or an additional dedicated login
  host and is outside this repair.
- Ephemeral web authentication intentionally avoids persistent Authentik and
  Google browser cookies. Users may need to select or enter their Google account
  more often, in exchange for preventing accidental administrator linking.

## 2026-07-21 Local Realtime Conversation Repair

Task level: `L3 repair execution`
Authorization: the owner explicitly said `进入修复阶段` and authorized the
three-stage realtime conversation repair through completion.
Live scope: the owner's Mac, signed iPhone 15 Pro Max build, and private-LAN
StackChan/CoreS3 only. No NAS, cloud image, public endpoint, or provider
credential was changed.

### Changes

- Installed `pac_realtime_audio_worker.py` on CoreS3 and provisioned a dedicated
  token plus port in short ESP32 NVS keys. The existing v0.2 status worker,
  `/flash/main.py`, and `/flash/boot.py` were not replaced.
- Updated only the existing status daemon entry so its production boot path
  starts the realtime worker in a separate thread while preserving the old
  status loop.
- Built, signed, installed, and launched the iOS Host with the private-LAN
  realtime endpoint and no embedded token.
- Stored distinct Mac-facing and robot-facing credentials in macOS Keychain.
  The installed LaunchAgent plist contains no credential value.
- Backed up the protected local `memory.db`, then applied its single registered
  v2 -> v3 migration. The post-migration plan is a latest-schema no-op and
  SQLite integrity remains `ok`.
- Started the Mac realtime WebSocket manually for field validation. Its health
  reports realtime enabled with robot-audio and v0.2 presence lanes configured.

### Verification

- Physical CoreS3 smoke: `ok=true`, 84 ACKs, playback ACK, mute ACK, exact
  cancel ACK, four starts, and successful forced reconnect; elapsed 6960.5 ms.
- Python: `1973 passed`, with the existing Starlette/TestClient deprecation
  warning only.
- Swift: `36 passed`; focused realtime/source lint is clean; MockSafety and
  signed device install/launch passed earlier in the same repair session.
- The old v0.2 Bridge remained healthy with queue depth zero, and CoreS3 port
  `18771` plus Mac realtime port `18770` were reachable on the private LAN.
- A VAD-shaped synthetic 16 kHz WebSocket turn completed real Azure SDK STT,
  warmed local 2B streaming, Azure SDK raw-PCM TTS, and physical robot
  delivery. Metrics were `stt_final_ms=261.2`,
  `model_first_delta_ms=519.9`, `first_audio_ms=1686.7`, and
  `completed_ms=3609.3`.
- A 5.568-second synthesized Chinese phrase submitted 56/56 100 ms slices with
  a maximum device interval of 133 ms and zero intervals over 150 ms. Three
  additional 2-second runs also had zero intervals over 150 ms.
- A physical speaking turn returned robot cancel ACK plus `turn.interrupted`
  in 56.9 ms with zero stale model deltas and returned the v0.2 presence queue
  to zero.
- Relay TLS verification was repaired with the environment's trusted CA bundle,
  but the configured Claude and Gemini routes returned HTTP 503 with
  `No available accounts`. The realtime service is therefore pinned to a
  warmed no-thinking, 30-minute-kept-alive local 2B model for this field state.

### Backups And Rollback

- CoreS3 backups are under
  `scratch/projects/personal-ai-companion/realtime-v1-20260721-*`, including
  pre-worker and pre-daemon copies.
- The v2 SQLite backup is under
  `state/project-data/personal-ai-companion/rollback/realtime-v1-20260721-before-memory-v3/`.
- Stop/unload only the realtime Mac service, remove only the realtime worker
  and its two NVS keys, and disable the iOS realtime control. Continue using
  the unchanged complete-WAV and v0.2 command paths.

### Residual Acceptance

- At this checkpoint the iPhone had not yet established its first authenticated
  realtime WebSocket session. Actual-room microphone/AEC, audible robot reply,
  owner barge-in, provider first-audio latency, and voiceprint calibration were
  therefore not yet accepted.
- The VAD-shaped synthetic physical route now meets the 1-2 second first-audio
  target at 1686.7 ms. Actual-room iPhone microphone/AEC timing remains an
  owner-observation item.
- The LaunchAgent file was installed but its `launchctl bootstrap` was still
  held by the workspace's current-session repair gate. The manually launched
  service is validation evidence, not persistent-start acceptance.

## 2026-07-27 Through 2026-07-30 Sanitized Deployment Summary

Task level: `L3 repair execution`.
Authorization: the owner explicitly approved the corresponding deployment and
repair sessions. This entry is a historical summary, not evidence of current
service health.

### Durable Outcomes

- Provider management work covered batch creation, partial updates, deletion,
  row interaction, and streamed responses across the cloud and signed App
  surfaces.
- Cloud voice work consolidated the response path and hardened long-response
  streaming, delivery continuity, and completion handling.
- CoreS3 voice work established the native pipeline baseline and iterated on
  interruption handling, audio/text synchronization, progressive latency,
  canonical long-response delivery, and a staged direct-voice path.
- The owner-authorized sessions included focused source tests, API checks,
  signed-App checks, and bounded physical-device verification appropriate to
  each change.

### Public Documentation Boundary

- Exact endpoints, network addresses, ports, device and user identifiers,
  service identifiers, local and backup paths, process/container identifiers,
  provisioning details, and artifact or image hashes are intentionally omitted.
- This summary adds no exact rollback targets. Related 2026-07-27 through
  2026-07-30 detailed evidence is retained locally under the workspace evidence
  and rollback rules.
- Credentials were not recorded in this public summary.

### Rollback And Residual Acceptance

- Each live change retained a targeted rollback path to the prior verified
  artifact or configuration. Exact commands and locations remain private.
- Physical audio quality and latency depend on the actual device, room, and
  network conditions and must be re-verified before a future live change.
- Candidate work that did not satisfy its hardware gate was returned to the
  prior stable path. Acoustic-echo promotion, real external-provider latency,
  and the originally recorded environment/tooling gaps remained unaccepted.
- This summary records completed historical work only; it must not be used as
  a substitute for a fresh read-only audit of current runtime state.
