# Custom Provider Main Chat Wiring

- Status: deployed to the owner-only API and signed iPhone App
- Task level: `L3 repair execution` in the authorized local product slice
- Project: `personal-ai-companion`
- Route lock: product source plus this project's ops surface only

## Confirmed Changes

- Authenticated Chat can receive an injected server-side `ChatProviderRouter`.
- `default_fast_route` selects the configured fast profile, even when the
  historical relay default model is named Opus.
- `complex_or_long_prompt`, owner-authorized private Opus, and explicit Opus
  routes select the configured Opus profile.
- Provider runtime execution reuses `ProviderRuntimeResources`,
  `ProviderRuntimeAdapter`, and `OpenAICompatibleHTTPExecutor`.
- A Provider model call is attempted once. The in-memory circuit opens after a
  bounded failure threshold and blocks later Provider attempts until its
  cooldown; it does not retry the current request.
- Provider failure or invalid response falls back to the existing relay once.
  The client never supplies endpoint, credential, or profile routing data.
- The existing authenticated iOS Provider management form accepts the Provider
  URL, endpoint path, runtime model ID, and API credential once. The form clears
  private fields on submit, cancellation, backgrounding, and dismissal. The
  owner selects a healthy profile in the App; `/select` now persists that choice
  in the owner-scoped server registry, and authenticated `/v1/chat` reads only
  that server-side profile ID.
- The flag `XIAOXIN_CHAT_PROVIDER_ENABLED` is default-off. Enabling it requires
  a separate registry database path, server-side registry owner, server-only
  base64url 32-byte key, and key ID. Fast/Opus profile IDs remain optional
  compatibility defaults; App-managed selection is the normal path. Provider
  resources close with the deployed app lifespan.
- Memory recall, approved prompt construction, girlfriend/partner style
  injection, persistence, and privacy admission were not changed.

## Verification

Focused tests:

```text
132 passed, 1 warning
```

The focused set covers authenticated `/v1/chat` Provider success, relay
fallback, route-profile selection, default-fast/Opus distinction, circuit
isolation, response/error boundaries, server-side selection persistence across
registry reopen/delete, App-selected profile routing without environment profile
IDs, and incomplete server configuration.
The warning is the existing Starlette/httpx deprecation warning.

Additional checks:

- Python compileall passed for the modified source.
- Ruff passed for the modified source and focused tests.
- Full Python suite passed `1879` tests; SwiftPM package tests passed `30/30`,
  and `PersonalAICompanionAppFlowSmoke` passed.
- No real Provider profile, endpoint, credential, Provider probe, or Chat
  request was used. No commit or push was performed.
- GitNexus impact was run before editing. `_call_model` reported HIGH because
  it is shared by authenticated Chat and voice Chat; `ChatRuntime`, deployed
  composition, and Provider runtime were separately reviewed at MEDIUM/HIGH
  blast radius as applicable.
- Final `gitnexus_detect_changes({scope:"all"})` reported `critical` for the
  whole dirty product worktree because it also includes pre-existing iOS
  DeviceControl changes and unrelated dirty files. The task-owned Python
  scope is the Chat/Provider path listed above; those unrelated changes were
  preserved and not reverted.

## Rollback And Residual Risk

- Source rollback is removal of the new optional Chat Provider injection and
  flag/config fields; with the flag false, relay Chat remains the active path.
- The immediate API rollback image is
  `xiaoxin-cloud-api:20260717T2120-provider-app`. The matching root-only backup
  is `/var/backups/xiaoxin-auth/20260717T214854+0800/provider-probe-before`.
- A newly saved unknown-health profile can be probed only by the owner's
  explicit `验证并选择` action. That action sends one fixed minimal request,
  records healthy only after a valid response, and does not retry or select on
  failure. Real Provider compatibility, latency, cost, and endpoint behavior
  remain unconfirmed.
- The circuit is process-local and resets on API restart. It is an isolation
  guard, not a durable health source.

## Live Deployment Completion 2026-07-17

- The first Provider-enabled deployment used
  `xiaoxin-cloud-api:20260717T2120-provider-app` and created the isolated
  `xiaoxin-cloud_xiaoxin-provider-registry` volume. Its first API start exposed
  a root-owned-volume permission defect; changing only that new volume to
  `0700`, UID/GID `10001:10001`, restored health. The API restart count from
  that bounded incident reached `22` and then remained stable.
- Before the probe follow-up, a second root-only backup captured the private
  environment, Compose files, current image metadata, Provider registry, Chat
  memory, and PostgreSQL dump at
  `/var/backups/xiaoxin-auth/20260717T214854+0800/provider-probe-before`.
- The current API image is
  `xiaoxin-cloud-api:20260717T2150-provider-probe`, NAS image ID
  `sha256:5316d0234d1d09c97cd5559a9d89ece9dd446557959b59831548f2cdf56fbcc6`.
  The API was recreated alone; the PostgreSQL container ID was unchanged.
- Post-deploy checks passed: API healthy with restart count `0`,
  `/healthz=200`, `/readyz=200`, unauthenticated `/v1/providers=401`, and
  `GET /v1/chat=405`. No recent traceback/error marker was found.
- The isolated signed App candidate contains only `OwnerToolsViews.swift`,
  `OwnerTools.swift`, `ProviderSettings.swift`, and `Info.plist` changes over
  product `923b04e`. Both Provider and authenticated Chat gates are true,
  codesign verification passed, and the Host binary SHA-256 is
  `4896d9f7c248621ab68032ddc44c0bcf9b3e6bb549387f4b8826da8f76cae7e8`.
  It was installed and launched on the connected owner iPhone under the
  existing Bundle ID.
- Real request count for this deployment acceptance: Provider probe `0`, main
  Chat `0`. The first real probe remains an explicit owner action after the
  owner enters a Provider URL, API key, and model ID in the App.

## Owner Provider Model Inventory 2026-07-17 22:25 +08:00

- Before the live registry write, an online SQLite backup of the two existing
  healthy profiles was stored at
  `/var/backups/xiaoxin-auth/20260717T222510+0800/provider-models-before/provider.db`
  with root-only permissions.
- One bounded authenticated `GET /v1/models` request was sent server-side using
  the already encrypted `claude-opus-4.6` profile. It returned 13 valid model
  IDs. No credential, endpoint, private environment value, or response beyond
  the public model IDs was printed.
- Twelve missing model profiles were created. The existing template model was
  skipped, `deepseek-chat` was unchanged, and the registry now contains 14
  profiles total.
- Every new profile retains health `unknown`; none was falsely marked healthy.
  A server-side comparison confirmed that URL, endpoint path, credential kind,
  credential, and timeout match the encrypted template, while each runtime
  model ID matches its new profile ID.
- The server-side selected profile remained `deepseek-chat`. API health stayed
  healthy with restart count `0`. This inventory operation sent zero Chat
  requests; API logs contained two Chat POSTs since the earlier API deployment.

## Earlier Deployment Preflight Snapshot (2026-07-17, before Provider deployment)

- At this earlier checkpoint, read-only SSH evidence from `home-nas-wg`
  confirmed the then-current API container was healthy on
  `xiaoxin-cloud-api:20260717T184100-chat-memory-style`.
- The root-only deployment environment is mode `0600 root:root`. Only
  presence/absence was checked; no private values were printed.
- The environment has no `XIAOXIN_CHAT_PROVIDER_*` entries, and no Provider
  registry database was found under the Xiaoxin stack path.
- No backup, image build, file transfer, environment write, container
  recreation, deployment, or real Chat request was performed.
- Activation was blocked at this checkpoint until an operator provisioned a server-side Provider
  registry, registry owner ID, KEK, and the corresponding profile health and
  credential records through the approved secret-handling path. The signed App
  build also needed its existing `XiaoxinProviderRegistryEnabled` gate enabled;
  the checked-in Host kept that gate false at this earlier checkpoint. The
  deployment evidence above supersedes this preflight state.
