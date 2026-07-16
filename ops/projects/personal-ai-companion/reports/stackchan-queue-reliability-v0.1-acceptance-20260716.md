# StackChan Queue Reliability v0.1 Acceptance

Date: 2026-07-16

- Product commit: `0e53f74 test(stackchan): add queue reliability regression`
- Remote: product `origin/main` contains `0e53f74`
- Manifest: [stackchan-queue-reliability-v0.1.md](../manifests/stackchan-queue-reliability-v0.1.md)

## Accepted Result

The new deterministic harness proves two-device isolation and replay behavior
for the in-process v0.2 Bridge, plus restart/expiry behavior for the existing
SQLite command queue. No production defect was exposed, so the accepted slice
is tests-only.

## Verification

- StackChan-focused suite: `90 passed`.
- Standalone new regression: `1 passed`.
- Final full Python suite: `1743 passed, 1 existing warning`.
- Ruff lint/format, compileall, and diff checks: passed.
- No hardware, socket, external service, or live state was used.

Repeated real-device reliability and v0.2 durable persistence remain separate
future gates.
