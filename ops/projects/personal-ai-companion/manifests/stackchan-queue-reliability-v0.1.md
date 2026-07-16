# StackChan Queue Reliability v0.1

Status: tests-only acceptance at product `0e53f74`.

## Accepted Boundary

- Deterministic in-process v0.2 batch coverage for two device IDs.
- Enqueue/poll isolation, idempotency conflict, ACK/result replay, and stable
  result retrieval.
- Temporary-SQLite restart coverage for lease recovery, duplicate ACK replay,
  expiry to dead letter, and final active depth zero.

## Explicit Exclusions

- No production queue or Bridge source changed.
- No socket, hardware, real credential, sleep, wall clock, deployment, or
  repeat field execution.
- v0.2 durable persistence and unattended device reliability are not claimed.
