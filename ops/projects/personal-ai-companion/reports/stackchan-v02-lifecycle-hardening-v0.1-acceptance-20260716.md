# StackChan v0.2 Lifecycle Hardening v0.1 Acceptance

Date: 2026-07-16

- Product revision: `1abf23a`
- Remote baseline: product `origin/main@1abf23a`
- Manifest: [stackchan-v02-lifecycle-hardening-v0.1.md](../manifests/stackchan-v02-lifecycle-hardening-v0.1.md)

## Accepted Result

Expired v0.2 commands no longer occupy the Bridge lifecycle forever or remain
eligible for repeated device polling. Every stateful lifecycle entry point now
performs one atomic expiration pass before conflict, capacity, delivery, result,
or lookup handling. All five correlation/index surfaces are removed together.

The exact expiry boundary is deterministic: one millisecond before expiry the
command remains available; at expiry it is gone. Admission of an already
expired command is explicit `410`, and late ACK/result/read paths fail closed.
Concurrent replacement after expiry admits exactly one claimant for the released
idempotency key.

Result replay is also tightened: only an equal payload is a duplicate. A changed
payload with the same result ID is a conflict and cannot mutate the stored
record.

## Verification

- Focused v0.2 lifecycle/reliability tests: `14` passed.
- All StackChan Python tests: `95` passed.
- Full Python suite: `1766` passed with the one existing
  Starlette/TestClient deprecation warning.
- Ruff targeted static check: passed.
- `swift test`: `16` passed.
- `swift run PersonalAICompanionStackChanV02StatusTransportSmoke`: passed.
- Product `git diff --check`: passed.
- Final cumulative product GitNexus detection covered `19` tracked files,
  `297` indexed symbols, and `46` expected flows. Aggregate risk is `critical`
  because the worktree also contains the prior shared iOS composition changes;
  pre-change impact for each modified v0.2 lifecycle method was `LOW`, with
  `do_POST` or `do_GET` as the only direct caller.

No real product API, credential, Bridge process, LAN endpoint, iPhone, or
physical StackChan was contacted. Enablement, service changes, field testing,
and deployment remain separate actions. The accepted source is committed and
pushed at product `1abf23a`.
