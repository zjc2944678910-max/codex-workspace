# StackChan v0.2 Lifecycle Hardening v0.1

Status: accepted and pushed at product `1abf23a`; local/default-off.

## Accepted Boundary

- The in-memory `WireV02Lifecycle` uses an injectable Unix epoch-millisecond
  clock. Production uses wall-clock time because the wire contract carries
  absolute `expires_at_ms` values.
- Enqueue, poll, acknowledgement, result recording, and result lookup perform
  expiration cleanup inside the same lifecycle `RLock` as their state change.
- `now >= expires_at_ms` removes the command, state, idempotency key, per-command
  results, and global result-ID correlation indexes atomically.
- Cleanup frees bounded lifecycle capacity and allows a new command to claim a
  released idempotency key without exposing partial old indexes.
- A command already expired at admission returns `410 command_expired` and is
  never stored. Late acknowledgement/result writes return
  `404 command_not_found`; a result lookup after cleanup returns
  `404 request_not_found` rather than remaining pending.
- Exact result replay remains idempotent. Reusing the same result ID and command
  ID with changed content now returns the existing `409 result_conflict` and
  preserves the originally stored result.
- The v0.1 in-memory/durable queues, LCD adapter, Chat result cache, and wire
  schema remain unchanged.

## Explicit Exclusions

- Cleanup is operation-triggered; it does not add a background thread. During
  complete inactivity expired objects may remain allocated until the next v0.2
  lifecycle operation, within the existing `128`-command bound.
- Cleanup keeps no expired-command tombstone. Late evidence is fail-closed with
  `404` and has no separate expired-versus-unknown diagnostic.
- Producer/Bridge wall-clock skew can move effective expiry. No clock
  synchronization protocol was added.
- No API enablement, Bridge service start/restart, real credential, LAN request,
  iPhone, StackChan, or deployment is accepted.
