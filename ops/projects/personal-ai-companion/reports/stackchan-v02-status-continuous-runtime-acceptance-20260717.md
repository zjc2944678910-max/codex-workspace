# StackChan v0.2 Status Continuous Runtime Acceptance

Date: 2026-07-17

Status: local continuous runtime, worker journal/config hardening, one physical
cold boot, one owner-triggered iPhone status roundtrip, and foreground snapshot
retention are accepted within the status-only scope.

## Authorization And Scope

The owner explicitly authorized `进入持续运行修复阶段，允许配置 Bridge 和
worker 自启动`. The repair was limited to the local Mac Bridge LaunchAgent,
the current CoreS3 `/flash` status worker/daemon, and the matching project
source, state, scratch, and ops surfaces. NAS, cloud, other devices, display,
motion, audio, camera, and touch behavior remained out of scope.

## Accepted Changes

- The UIFlow2 worker classifies HTTP 5xx as retryable
  `server_unavailable` and HTTP 4xx as terminal `request_rejected` before body
  parsing.
- The worker persists the complete validated command with its frozen result and
  ACK. A replay must match the full command, including timing, body, and privacy;
  reused IDs with changed content fail closed.
- A journal is removed only after a `200` ACK and strict correlated response
  validation. Transport/5xx ambiguity keeps the byte-equivalent replay, while a
  successful empty poll clears an obsolete journal. Two different commands can
  therefore complete inside the first command's TTL without stopping the daemon.
- Status commands require the exact owner-private/local-only privacy object with
  three literal `false` data flags. The Bridge URL, device ID, and firmware label
  now come from `pac` NVS keys and are validated before token, network, clock, or
  journal access. The worker source no longer contains the current endpoint or
  device identity.
- `/flash/apps/04_pac_v02_status_daemon.py` repeatedly invokes the existing
  status-only `run_once()`, resets backoff after success, and retries only
  transport/5xx errors at `1, 2, 4, 8, 16, 30` second capped delays.
- Successful empty v0.2 command polls no longer grow Bridge access logs.
  Command-bearing polls, errors, result/ACK, health, and other routes remain
  logged.
- User LaunchAgent
  `xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge` starts the Bridge
  at login and restarts it after abnormal exit. Its allowlist is exactly the
  Mac `.225`, StackChan `.215`, and iPhone `.132`; memory, recent context, and
  retention limits remain zero; scope remains owner-private; reply limit
  remains 180; local speak-audio remains enabled.
- The LaunchAgent reads the credential only from the existing owner-only token
  file. Unrelated GUI launchd Sub2API and SSH environment variables are
  explicitly shadowed with empty values for this process.
- The existing flag-gated boot hook, network-first initialization,
  `boot_option=2`, and three-second Ctrl-C window remain intact. Exactly one
  `boot.py` line changed: the app target moved from
  `/flash/apps/00_pac_bridge_demo.py` to
  `/flash/apps/04_pac_v02_status_daemon.py`.

## Verification

- Focused UIFlow2 worker/daemon tests: `66` passed.
- All StackChan Python tests: `186` passed.
- Full Python suite: `1857` passed with one existing Starlette/httpx
  deprecation warning.
- Touched-file Ruff, syntax, and diff whitespace checks: passed. A broader
  StackChan Ruff sweep still finds the pre-existing unused `producer` variable
  in `wire_contract.py:308`; this repair did not alter it.
- Swift XCTest: `17` passed. A dedicated test confirms page-exit cancellation
  interrupts the inter-poll sleep without issuing another fetch or surfacing a
  failure. AppSupport, MockSafety, and StackChan v0.2 status transport smokes
  passed.
- Final closeout reran `15` StackChan-status-prefixed Swift tests and `94`
  focused Bridge/worker/reliability Python tests; both sets passed. The active
  diagnostic console launch was then stopped, the previously verified clean
  snapshot-retention Host build was reinstalled on the iPhone, and the App was
  launched normally without console capture. The device process remained
  present, Bridge health remained `ok`, and queue depth remained zero.
- LaunchAgent plist lint, absolute paths, owner-only state permissions, health,
  single listener, PID file, stdout/stderr permissions, and empty stderr all
  passed.
- Forced Bridge `SIGKILL` changed the PID and launchd restored a healthy single
  listener with queue depth zero.
- The device worker and daemon were installed and read back byte-identically:
  worker SHA-256 `9699b2c0808782d03496d7201b4223eb2dd86cd304c00da0e9739ea16d59532b`;
  daemon SHA-256 `d21f40dd27c01b19b25addb52f81224e7220d439630121342558b96fa29a457a`.
- A bounded three-iteration daemon run completed over the real Wi-Fi/token/
  Bridge path. Three empty polls produced no access-log growth.
- Live boot SHA-256 is
  `468b3b1897b41898ef83432d453dbe81e7de9a29b6cf26cc171a6625ed5d17ee`.
  Its diff from the immediate pre-switch backup is exactly the one app-target
  line. `/flash/main.py`, the flag, old app, and NVS state remained unchanged.
- Soft reset captured the new daemon launch marker. An automatic post-reset
  status roundtrip returned battery `100`, network `wifi`, firmware
  `uiflow2-v2.4.8`, an integer uptime, ACK `accepted`, and queue depth zero.
- With the Bridge unloaded for six seconds, the running daemon remained alive.
  After the LaunchAgent returned, a second automatic roundtrip succeeded with
  ACK accepted and queue depth zero, without resetting the device.
- Before the journal/config hardening deploy, the old worker, unchanged daemon,
  and existing journal were backed up with owner-only permissions. The three new
  runtime NVS keys were confirmed absent before they were written; only the token
  length was recorded.
- The hardening soft-reset capture observed the PAC daemon launch marker but
  started too late to retain the earlier Wi-Fi marker. Two different automatic
  commands then completed within one TTL, both reporting `network_state=wifi`,
  ACK `accepted`, and queue depth zero. This confirms network-first execution and
  directly closes the stale-journal daemon-exit defect without overstating the
  partial serial capture.
- The owner physically disconnected and restored StackChan power without
  manually starting a UIFlow App. The later signed-iPhone refresh completed
  against the automatically started status daemon.
- Final field command
  `cmd_ios_status_897061f0-3723-4142-939f-953af77ed2b1` completed the exact
  iPhone enqueue `202` -> worker poll `200` -> result upload `202` -> iPhone
  result read `200` -> ACK `200` sequence. The UI displayed battery `100%`,
  network `Wi-Fi`, uptime `1 hour 46 minutes`, and firmware
  `uiflow2-v2.4.8`; Bridge queue depth returned to zero.
- After that result, the owner switched to Safari for three seconds and returned
  without refreshing. All four fields remained visible, and the Bridge observed
  no second iPhone enqueue. This accepts the completed-snapshot retention fix
  without accepting background or unprompted polling.
- During diagnosis, the signed debug App reported two `NSURLErrorDomain -1001`
  timeouts followed by `-1004` cannot-connect, with
  `local_network_prohibited=false`. Disabling the Shadowrocket packet tunnel
  alone did not recover the path; reconnecting iPhone Wi-Fi did. The next manual
  refresh then completed normally. This is recorded as an iPhone LAN/VPN route
  residual, not as a Bridge, worker, or local-network-permission failure.

## Evidence And Rollback

- Immediate pre-write backup:
  `scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-before-write-20260717-012121/`
- Immediate pre-boot-switch backup:
  `scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-before-boot-switch-20260717-012552/`
- Read-back after boot switch:
  `scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-after-boot-switch-20260717/`
- Immediate pre-worker-hardening backup:
  `scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-before-worker-hardening-20260717-021652/`
- Deterministic device rollback uses `device_switch_boot_target.py` with the
  installed boot source as `--expected-current` and the pre-switch boot backup
  as `--replacement`.
- Mac rollback unloads the LaunchAgent. It does not stop or modify the separate
  loopback upstream at `127.0.0.1:8768` and does not delete the token/state
  directory.
- Worker-hardening rollback restores the backed-up worker and removes the three
  newly introduced `pac` NVS keys; boot, main, daemon, flag, boot option, and
  token remain unchanged.
- Local field screenshot:
  `state/project-data/personal-ai-companion/field-evidence/stackchan-v02-status-ios-cold-boot-retention-20260717.png`

## Residual Validation

One physical StackChan power-cycle and one later owner-triggered iPhone refresh
are confirmed. This does not establish repeated cold-boot reliability. A stale
iPhone VPN/Wi-Fi route blocked the local Bridge until Wi-Fi was reconnected, so
Shadowrocket local-subnet bypass behavior and route recovery remain operational
risks. Fixed DHCP addresses and producer/Bridge/worker clock skew also remain
residual risks. No public endpoint, cloud deployment, background iPhone
polling, other device command, commit, or push is accepted by this report.
