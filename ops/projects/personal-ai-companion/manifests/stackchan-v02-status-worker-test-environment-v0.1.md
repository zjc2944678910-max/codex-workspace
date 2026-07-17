# StackChan v0.2 Status Worker Test Environment v0.1

Status: field-accepted/default-off worktree based on product `1abf23a`.

## Accepted Boundary

- A new status-only worker completes the missing test-machine side of the iOS
  status path: dedicated-device poll, frozen primary result, status/error POST,
  then acknowledgement.
- Frozen primary and ACK payloads are persisted in an owner-only SQLite journal
  before submission. Response-loss and process-restart replay reuses the exact
  result IDs, timestamps, outcome, and metadata.
- The read-only collector exposes only battery percentage when present, Wi-Fi
  state, uptime, and an explicit bounded firmware label. It performs no device
  actuation.
- `temperature` and `heap` requests are rejected because the current v0.2 result
  schema cannot represent them. Any non-status command stops without ACK.
- Bridge endpoints must be literal loopback/private/link-local IP HTTP URLs.
  Redirects, hostnames, public IPs, URL credentials, paths, queries, fragments,
  unknown response fields, oversized bodies, and correlation drift fail closed.
- Credentials remain runtime-only. Token files and journal directories/files
  must be regular, owner-matched, owner-only, and non-symlinked.
- Only transport failures and 5xx responses retry, at most three consecutive
  times and never beyond the original command TTL. All terminal errors stop.
- The field runbook fixes a single manual refresh sequence, rollback steps, and
  stop conditions without enabling the checked-in iOS flags.
- One manual iOS refresh performs at most nine foreground result reads at
  500 ms intervals for the same command. Page exit cancels the task; there is
  no launch-time, background, or unprompted status request.
- The 2026-07-17 field session completed one signed iPhone -> Mac Bridge ->
  UIFlow2 StackChan roundtrip with one command, a primary status result before
  ACK, a terminal App `200` read, and final Bridge queue depth zero.

## Explicit Exclusions

- The checked-in iOS plist and Cloud Chat gate remain unchanged/default-off.
  The accepted field run used only temporary build settings, runtime-only
  Bridge configuration, and the existing owner pairing Keychain boundary.
- The Bridge v0.2 lifecycle remains in-memory across Bridge restart; the worker
  journal does not make Bridge restart durable.
- No motion, display, audio, camera, touch, health, memory, Cloud Chat,
  background polling, unattended reliability, production service install,
  deployment, commit, or push is accepted.
