# PAC Health Analysis Contract v0.1

- Status: accepted local synthetic/fixture-only contract
- Date: 2026-07-15
- Task: `PAC-HEALTH-ANALYSIS-CONTRACT`
- Product source: `main@c0cd301`
- Acceptance report:
  [health-analysis-contract-v0.1-acceptance-20260715.md](../reports/health-analysis-contract-v0.1-acceptance-20260715.md)

## Selected Boundary

`HealthAnalysisRequest` and `HealthAnalysisResponse` define a transport-free,
model-agnostic boundary for explaining an already accepted qualitative health
summary. The request can contain only a valid
`HealthOffDeviceSummaryEnvelope` and must be created during that envelope's
authorization window.

The request fixes these values:

| Field | Required value |
| --- | --- |
| `version` | `pac.health_analysis.v0.1` |
| `analysis_kind` | `qualitative_wellness_explanation` |
| `safety_scope` | `non_diagnostic` |
| `summary` | valid, complete 12C off-device envelope |

Its canonical SHA-256 fingerprint binds the request time and the complete
serialized envelope, including request identity, transfer-consent metadata,
observation window, content digest, and all five qualitative projections.

## Controlled Response

The response is standalone only as a structurally self-consistent DTO. Before a
consumer trusts it, `validate_for(request)` must bind all of these values:

- request ID and canonical request fingerprint;
- completion time at/after request creation and before envelope expiry;
- observation-window start and end;
- source-independent health content digest;
- exact complete projections in canonical order: `steps`, `active_energy`,
  `heart_rate`, `sleep`, and `workouts`.

Each family contains the original `HealthTrendProjection`, its canonical chart
order, and one controlled explanation code. Sufficient projections use the
Cartesian baseline/trend code, for example `above_baseline_increasing` or
`within_baseline_stable`. Insufficient input uses only `insufficient_data`.
There is no free-form narrative field.

Uncertainty is explicit and non-numeric:

- sufficient qualitative input is `limited` with
  `qualitative_summary_only`;
- insufficient input is `unavailable` with
  `qualitative_summary_only` plus `insufficient_data`.

Chart metadata is fixed to `five_family_qualitative_trend`, `health_family`,
`baseline_band`, and categorical values with `insufficient_data` as the missing
marker. It cannot carry raw samples, measured values, inferred confidence
probabilities, diagnoses, or medical advice.

## Strict Validation

Request and response payloads are bounded to 16 KiB. Unknown fields,
malformed/cyclic/non-JSON shapes, unsafe timestamps, invalid UUIDs or digests,
expired authorization, incomplete/reordered/duplicate families, explanation or
uncertainty mismatch, chart widening, content mismatch, and request/response
binding mismatch fail closed with fixed non-echoing error codes. DTOs are
frozen and slotted, and their representations redact identifiers, timestamps,
fingerprints, digests, projections, explanation codes, and uncertainty values.

## Explicit Non-Scope

This contract does not generate health prose, diagnose a condition, provide
medical advice, read HealthKit, parse an Apple export, select or call Claude or
another model, open a network connection, add an API route, persist a request or
response, wire authenticated chat, create a chart, expose iOS UI, modify Swift
source, sign/install an App, or use real health data. It also does not prove a
real owner performed a consent UI gesture; it validates only the accepted 12C
DTO and its bounded authorization window.

## Accepted Product Files

- `src/personal_ai_companion/integrations/health_analysis.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `fixtures/integrations/v0.1/health-analysis.json`
- `tests/test_health_analysis_contract.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`

## Current Continuation

The separately accepted
[`PAC-HEALTH-OWNER-SHORTCUT-ANALYSIS-API`](health-owner-shortcut-analysis-api-v0.1.md)
now consumes this contract behind an explicitly injected owner-authenticated
route at product `2360cba`. It retains the controlled categorical response and
adds no model, persistence, chat, Swift, iOS, or live deployment path. Personal
Team device acceptance remains optional/deferred and is not required by the
fallback path. Any Shortcut recipe/token handoff, model execution, narrative
rendering, real export aggregation, real-data use, Swift/iOS surface, chart UI,
or deployment requires a new scope and acceptance.
