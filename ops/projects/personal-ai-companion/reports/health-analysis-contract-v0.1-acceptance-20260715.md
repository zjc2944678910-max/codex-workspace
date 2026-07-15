# PAC Health Analysis Contract v0.1 Acceptance 2026-07-15

- Status: accepted local synthetic/fixture-only scope
- Task level: L1 local cross-file contract implementation
- Product commit: `c0cd301`
- Product remote state: `main` and `origin/main` matched after push
- Manifest:
  [health-analysis-contract-v0.1.md](../manifests/health-analysis-contract-v0.1.md)

## Scope And Safety Boundary

This acceptance adds one model-agnostic request/response DTO pair for the
already accepted five-family qualitative health summary. The request consumes a
valid 12C off-device envelope during its authorization window; the response is
bound to the exact request, content digest, observation window, and projections.

No private health sample, measured value, credential, endpoint, provider/model
prompt or result, free-form narrative, network connection, API route, database,
authenticated-chat path, iOS/Swift source, HealthKit permission, device/signing
state, deployment, or live state was read or changed. Product-local untracked
control material remained outside the commit.

## Implementation And Contract Checks

- Request construction validates the nested 12C envelope authorization and
  fingerprints its complete canonical serialization.
- Response binding checks request ID/fingerprint, response timing, window,
  digest, and all five exact projections.
- Nine sufficient baseline/trend combinations and `insufficient_data` map to
  controlled explanation codes; no arbitrary explanation text is accepted.
- Sufficient data stays explicitly `limited`; insufficient data is
  `unavailable`. Reason codes are fixed and ordered.
- Chart metadata is categorical and fixed. It carries family order, trend,
  baseline band, and missing-data semantics without numeric health values.
- Unknown model/medical/transport/raw fields, oversized/cyclic JSON, invalid
  fixed metadata, family mismatch, digest mismatch, and binding mismatch fail
  with non-echoing errors.
- DTOs are frozen, slotted, and redacted in `repr`.

## Verification

```text
tests/test_health_analysis_contract.py: 65 passed
health source + intake + manual export + off-device consent + analysis: 223 passed
full Python suite: 1638 passed, 1 warning
```

Targeted Ruff, Ruff format, Python compile, and `git diff --check` passed. The
warning is the existing Starlette `TestClient`/`httpx` deprecation notice.
GitNexus pre-change impact for the consumed
`HealthOffDeviceSummaryEnvelope` was low (`1` direct importer and `0` affected
processes); staged-change detection was also low risk with `0` affected
processes.

Sub2API tools were unavailable in this session. The bounded local Claude review
was attempted but returned `Not logged in`, so no Claude conclusion is claimed.
An internal read-only review found no correctness, privacy, or contract blocker;
its suggested fingerprint and response-binding test gaps were added before the
final verification.

No Swift source changed, so this acceptance does not claim a new Swift build,
Simulator result, signed-device result, or HealthKit authorization.

## Residual Risk And Rollback

Parsing `HealthAnalysisResponse.from_dict()` proves only structural and content
self-consistency. A future consumer must call `validate_for(request)` before
trusting request identity or authorization timing. There is no current consumer
or runtime wiring.

The controlled codes do not provide Claude-like narrative analysis, medical
judgment, real chart rendering, or provider execution. The nested 12C envelope
still proves only a structurally valid consent assertion, not a real UI gesture
or persistent/revocable consent record.

Rollback is a source revert of product commit `c0cd301`; no data, service,
signing, deployment, or network rollback exists because none was changed.

## Acceptance Judgment

`PAC-HEALTH-ANALYSIS-CONTRACT` is complete for the bounded local synthetic
scope. It closes order 12D without claiming model execution, cloud health
transmission, authenticated-chat support, narrative generation, or chart UI.
