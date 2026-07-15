# PAC Health Off-Device Consent Contract v0.1 Acceptance 2026-07-15

- Status: accepted local synthetic/fixture-only scope
- Task level: L1 local cross-file privacy contract implementation
- Product commit: `bff7398`
- Product remote state: `main` and `origin/main` matched after push
- Manifest:
  [health-off-device-consent-contract-v0.1.md](../manifests/health-off-device-consent-contract-v0.1.md)

## Scope And Safety Boundary

This acceptance adds one transport-free envelope for a complete, qualitative
five-family health summary. It separates source collection/import scopes from a
literal, single-request off-device consent assertion and enforces a five-minute
maximum consent/request window.

No private health sample, credential, endpoint, provider/model prompt or result,
network connection, API route, database, iOS/Swift source, HealthKit permission,
device/signing state, NAS/VPS service, deployment, or live state was read or
changed. Product-local untracked control material remained outside the commit.

## Implementation And Contract Checks

- A missing, non-boolean, or `false` transfer assertion cannot form a valid
  envelope.
- `owner_initiated_import` and `health_read` cannot substitute for the dedicated
  `owner_health_summary_transfer` scope.
- The envelope requires exactly five immutable qualitative projections in the
  canonical order and verifies their source-independent SHA-256 digest.
- `for_snapshot` rejects a future capture and strips source, adapter, revision,
  and snapshot identity from the serialized result.
- Unknown sensitive/transport fields, oversized/cyclic/non-JSON shapes,
  noncanonical UUIDs, invalid times, stale consent, expiry violations, family
  mismatch, and digest mismatch fail with fixed non-echoing errors.
- `validate_authorization` checks only the bounded time window and performs no
  transfer or mutation.

## Verification

```text
tests/test_health_off_device_consent.py: 55 passed
health source + intake + manual export + off-device consent: 158 passed
full Python suite: 1573 passed, 1 warning
```

Targeted Ruff, Ruff format, Python compile, and `git diff --check` passed. The
warning is the existing Starlette `TestClient`/`httpx` deprecation notice.
GitNexus pre-change impact was medium for the consumed `HealthSourceSnapshot`
and `HealthTrendProjection` symbols (`10` direct dependents each, `0` affected
processes); neither existing symbol was modified. Staged-change detection was
low risk with `0` affected processes.

Sub2API tools were unavailable in this session. The bounded local Claude review
was attempted but returned `Not logged in`, so no Claude finding is claimed.
Codex completed local source review and verification. No Swift source changed,
so this acceptance does not claim a new Swift build or device result.

## Residual Risk And Rollback

The envelope proves only that its caller supplied a structurally valid consent
assertion. It does not prove the real owner performed a UI gesture, persist or
revoke consent, provide replay protection without a future store, authenticate a
transport, call Claude or another model, generate medical advice, produce
charts, or complete an off-device transfer.

Rollback is a source revert of product commit `bff7398`; no data, service,
signing, deployment, or network rollback exists because none was changed.

## Acceptance Judgment

`PAC-HEALTH-OFF-DEVICE-CONSENT-CONTRACT` is complete for the bounded local
synthetic scope. It closes order 12C without claiming a Claude-like health
analysis path, authenticated-chat wiring, or real health transmission.
