# iOS Authenticated Chat Live Readiness

Date: 2026-07-17

Status: L3 deployment and one owner-triggered temporary authenticated Chat turn
accepted. Standard persisted Chat and latency optimization remain unaccepted.

Follow-up: the
[latency observability repair](chat-latency-observability-repair-20260717.md)
deployed content-free iOS/API/relay timing and supersedes the `16.3`-second
completion-gap interpretation. Standard persisted Chat remains unaccepted, but
later read-only preflight found existing persisted rows as documented there.

## L3 Live Acceptance Result

### Deployment

- The owner explicitly entered the repair stage for this Chat deployment.
- The current iPhone profile matched exactly one Cloud owner before enablement;
  no full owner identifier, token, or relay credential was printed.
- Fresh verified backup:
  `/var/backups/xiaoxin-auth/20260717T120205+0800/authenticated-chat-before`.
- Loaded and deployed `xiaoxin-cloud-api:20260717T114059-chat-candidate`.
  The NAS-normalized image ID is
  `sha256:181d700a922518376b41a991c512456dc8c6cba1c3f044901ae79f76f8c843f1`.
- The API container is
  `d00fde12324ea0245ffab9731f92f77a93fcfb05af1be186fe143fa6b216ab5e`.
  The PostgreSQL container remained unchanged at
  `bff211a48f2922d0c3351bed1d6a8b4f10b72ed578b92c34477f75f33ddb072a`.
- Compose gained only the reviewed Chat environment and isolated
  `xiaoxin-cloud_xiaoxin-chat-memory` volume. The private environment remains
  root-only at mode `0600`; credential values were not copied into evidence.
- Server cutover was performed with Chat off first, then Chat was enabled only
  after health/auth parity and route-off checks passed.
- The signed combined Chat and StackChan status App was installed with the
  existing Bundle ID. The existing signed-in session survived replacement;
  launch completed a token refresh with HTTP `200`.

### Real Temporary Turn

- The owner selected `临时对话` and sent one public-safe correlation request.
- The App displayed the exact correlated reply `临时对话联调成功`.
- API access evidence records one `POST /v1/chat` response with HTTP `200` at
  `2026-07-17T12:26:42+08:00`.
- The iOS client displays a temporary response only when the returned
  conversation ID matches and `memory_status` is exactly `ephemeral`.
- Post-turn SQLite integrity is `ok`; `conversation_messages`,
  `session_deltas`, `memory_atoms`, and `model_usage_logs` all remain at zero.
- No StackChan command was produced by the Chat turn; Bridge queue depth stayed
  zero.

### Combined App Regression And Latency

- After Chat acceptance, the first StackChan refresh failed before reaching the
  Bridge. Safari could not reach the same private endpoint and Bridge logs
  contained no iPhone request. Mac Bridge health, listener, allowlist, and the
  iPhone LAN neighbor entry were intact.
- This matched the already documented stale iPhone VPN/Wi-Fi route residual.
  Reconnecting iPhone Wi-Fi restored two direct `/healthz` requests from the
  allowlisted iPhone address, both HTTP `200`; no App, Bridge, token, worker, or
  server change was required.
- The next single manual refresh completed the full iPhone enqueue `202` ->
  worker poll `200` -> result upload `202` -> iPhone result read `200` -> ACK
  `200` chain. The UI displayed battery `100%`, network `Wi-Fi`, uptime
  `3 hours 18 minutes`, and firmware `uiflow2-v2.4.8`; queue depth returned to
  zero.
- The observed Chat roundtrip was slow. The token refresh completed at
  `12:26:26+08:00` and Chat returned at `12:26:42+08:00`, a measured interval
  of about `16.3` seconds. Connectivity and correctness passed; latency
  optimization remains a separate repair slice.
- Final public `/healthz` and `/readyz` return `200`; `GET /v1/chat` returns
  `405`, confirming the enabled POST-only route. API and database containers
  remain healthy with no Chat traceback.

## Route Lock And Scope

- Project: `personal-ai-companion`.
- Local source: `projects/products/personal-ai-companion`.
- Live read-only surfaces: public Xiaoxin HTTPS endpoints and
  `home-nas-wg` container/config metadata.
- Candidate scope: authenticated text Chat, one fixed owner, one isolated Chat
  memory store, and the existing HTTPS relay contract.
- Excluded: StackChan runtime changes, Health, Provider/MCP, display, motion,
  audio, camera, touch, VPS/Cloudflare/tunnel changes, account merges/deletes,
  database migrations, and public deployment.

## Pre-Deployment Live State (Historical)

The facts in this section were captured before the accepted L3 cutover above.
They are retained as the deployment baseline, not as current live state.

- Public `/healthz`, `/readyz`, and `/v1/auth/capabilities` return `200`.
  Google, Authentik, and account tokens are available; email/OTP remain off.
- Public `GET /v1/chat` returns `404`; API docs remain disabled/`404`.
- API container `xiaoxin-cloud-api-1` is healthy on
  `xiaoxin-cloud-api:20260716T111947-health-dark`, image
  `sha256:d84a3b7aaba4dc69260b9b0bc62673bb9fdc14e25446edd6ae7fa523aef9fa46`.
- Live Chat gate, owner, memory path, relay URL, and relay key are all absent or
  false. Only `/data/storage` is mounted; no Chat volume exists.
- The API keeps a read-only root filesystem, drops all capabilities, and uses
  `no-new-privileges`.
- Compose files are under
  `/volume1/docker/stacks/apps-xiaoxin/deploy/xiaoxin/`; the current base file
  predates the Chat environment and volume entries. The NAS override only
  selects `Dockerfile.nas`.
- Compose uses `/volume1/docker/stacks/apps-xiaoxin/.env`, confirmed by the
  container label. The file is `0600 root:root`; its values were not printed.
- The Cloud database has three user rows. The Chat owner cannot be inferred
  safely and must be matched to the current iPhone profile with exactly one
  database result before any gate is enabled.
- The owner-only local product environment has a relay URL and key configured
  and selects `claude-opus-4-6-thinking`; no credential value was printed.

## Source And Impact Evidence

- The iOS Host endpoint is `https://xiaoxin.nodezjc12348888.xyz`; the checked-in
  Chat gate remains false.
- `XiaoxinChatClientFactory` evaluates the gate before endpoint, URLSession, or
  token-provider creation. The authenticated client sends only text,
  conversation ID, and temporary mode; it refreshes once after `401` and rejects
  the session after a second `401`.
- `create_deployed_cloud_app` fails closed without account tokens, one existing
  owner, an existing absolute isolated memory directory, a distinct Cloud DB,
  and a credentialed HTTPS relay. Candidate writes remain disabled.
- GitNexus reports LOW impact for the factory and MEDIUM impact for deployed
  composition. The whole dirty product worktree is CRITICAL because it spans
  multiple modules. A class-level iOS query also reports CRITICAL due to the
  shared AppSupport import surface; method-level evidence reduces the real Chat
  call path to `send -> perform` plus factory/test/smoke entry points. Full Swift
  verification is therefore mandatory.

## Local Candidates

### Server

- Detached source:
  `scratch/projects/personal-ai-companion/chat-live-candidate-20260717` at
  `1abf23a`, plus only the five shared Chat contract source/test files.
- Image: `xiaoxin-cloud-api:20260717T114059-chat-candidate`.
- Image ID:
  `sha256:449a7b7dfa6f219896f3a82f97c08453a81d78e679b75c0fc7cc433527ccf7eb`.
- Platform/entry: Linux amd64, non-root `xiaoxin`, deployed factory entrypoint.
- Gate-off image probe confirms `chat_available=false` and no `/v1/chat` route.
- The image schema SHA-256 matches the isolated source exactly:
  `fdc9b681caaac2ccb352b5f10745a7565c301a6da8c42932a688806cb410be3c`.
- Gzip archive:
  `scratch/projects/personal-ai-companion/chat-live-candidate-20260717/artifacts/xiaoxin-cloud-api-20260717T114059-chat-candidate.tar.gz`.
- Archive: `76,372,295` bytes, SHA-256
  `76a49177a9770926ce4b996f238b87ffcbfd41c50f4dbc7bba69b89594b9ce5a`;
  gzip integrity passes.

### iOS

- Detached source:
  `scratch/projects/personal-ai-companion/ios-chat-status-candidate-20260717` at
  `1abf23a`, plus the accepted StackChan iOS repair and shared Chat contract.
- Scratch-only Host plist preserves the accepted StackChan endpoint/device/gate
  and enables authenticated Chat against the existing HTTPS API. The canonical
  product plist remains default-off.
- Signed App:
  `scratch/projects/personal-ai-companion/ios-chat-status-candidate-20260717/artifacts/DerivedData/Build/Products/Debug-iphoneos/PersonalAICompanionHost.app`.
- Bundle ID `xyz.nodezjc12348888.xiaoxin`; Team ID `Y38TU585HM`; strict code-sign
  verification passes.
- Host binary SHA-256:
  `49179ebff2b2c98c6ae99e13665fea7233efd98bc7305d4eb2f0015ee0811eed`.
- The App was subsequently installed and accepted as described in the live
  result above. The prior status-only App remains the iOS rollback artifact.

## Local Verification

- Server candidate: `63` focused Chat/relay/deployment tests and `1768` full
  Python tests pass. The only warning is the existing Starlette/httpx
  deprecation warning.
- Server candidate Ruff, Compose config with synthetic non-secret values,
  image source hashes, default-off route probe, gzip integrity, and diff
  whitespace checks pass.
- Chat-only candidate Swift package: `20` tests pass.
- Combined Chat/StackChan iOS candidate Swift package: `30` tests pass.
- Physical-device Xcode build and signing succeed. The final built plist has
  both StackChan status and authenticated Chat enabled with their intended
  endpoints.
- Claude independent review was attempted but did not run because the local
  Claude CLI is not logged in. Sub2API advisory tools were unavailable.

## L3 Repair Plan (Completed)

- Change target: API image, base Compose file, root-only Compose environment,
  a new isolated Chat volume, API-only recreation, and the signed iOS App.
- Reason: the source path is implemented and tested, but the live image and
  Compose stack predate Chat and the iOS gate remains false.
- Risks: wrong owner binding, credential scope expansion to NAS, external model
  cost/data transfer, API recreation outage, first-run Chat SQLite writes,
  iOS session rejection, and StackChan regression during App replacement.
- Rollback: restore the fresh Compose/environment backup and prior image, then
  recreate only API; keep DB untouched; leave the new Chat volume unused rather
  than deleting it. Reinstall the accepted status-only App if the iOS candidate
  fails.
- Verification: server-first dark cutover, health/readiness/auth parity, route
  absence while off, route presence while on, unchanged DB container ID,
  unchanged security settings, then iOS launch, StackChan preservation, and one
  owner-triggered public-safe temporary Chat turn.
- Authorization: granted when the owner explicitly entered the repair stage for
  this Chat scope. The sequence below was completed within that boundary.

## Executed Repair Sequence

1. Recheck public and SSH health, free space, container/image IDs, and archive
   checksum. Match the current iPhone account to exactly one existing Cloud user
   without printing PII or token material. Stop unless the match is unique.
2. Create a fresh root-only backup of Compose, NAS override, private environment,
   runtime metadata, and the current API cutover command. Do not alter the DB.
3. Transfer the prepared archive resumably, verify SHA-256, and load the image.
4. Install only the reviewed base Compose update. Keep the NAS override
   byte-identical. Add the owner, relay, model, image, and explicit
   `XIAOXIN_AUTHENTICATED_CHAT_ENABLED=false` values to the root-only environment.
5. Validate Compose and recreate only API. Confirm the new image and Chat mount,
   while public `/v1/chat` remains `404` and existing auth endpoints remain `200`.
6. Change only the server Chat gate to true and recreate only API. Confirm health,
   no traceback, unchanged DB container, and `GET /v1/chat` changes from `404` to
   method-not-allowed without sending a Chat body.
7. Install and launch the signed combined iOS App. Do not send automatically.
   Confirm the existing session and StackChan status surface remain available.
8. The owner selects temporary conversation mode and sends one public-safe test
   message. Accept only a correlated reply with `memory_status=ephemeral`.
   A normal persisted turn is a separate explicit checkpoint.

## Stop Conditions

- Any archive, image, source, Compose, or backup checksum mismatch.
- Owner lookup is zero, ambiguous, or differs from the iPhone profile.
- Any required relay value is missing or would need to be printed/copied through
  an unsafe channel.
- Compose diff exceeds the reviewed Chat image/environment/volume additions.
- DB container ID changes, API health/auth parity fails, TLS fails, route state is
  wrong for its gate, or API logs show startup/relay/auth traceback.
- iOS install loses the expected account, fails signing/launch, disables the
  accepted StackChan status path, or sends a request without an owner action.

No standard persisted Chat turn, account mutation, Health transmission,
Provider/MCP integration, device actuation, tunnel change, commit, or push was
performed by this acceptance. The checked-in iOS gates remain default-off; the
installed field build and live server environment are explicit deployment
state with the rollback anchors above.
