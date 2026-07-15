# PAC Health Off-Device Consent Contract v0.1

- Status: accepted local synthetic/fixture-only contract
- Date: 2026-07-15
- Task: `PAC-HEALTH-OFF-DEVICE-CONSENT-CONTRACT`
- Product source: `main@bff7398`
- Acceptance report:
  [health-off-device-consent-contract-v0.1-acceptance-20260715.md](../reports/health-off-device-consent-contract-v0.1-acceptance-20260715.md)

## Selected Boundary

`HealthOffDeviceSummaryEnvelope` represents one explicit, short-lived intent to
use a qualitative health summary outside its collection source. A valid envelope
requires all of these fixed values:

| Field | Required value |
| --- | --- |
| `version` | `pac.health_off_device_consent.v0.1` |
| `destination_kind` | `authenticated_companion_cloud` |
| `purpose` | `conversation_health_context` |
| `privacy_scope` | `health_private` |
| `off_device_consent_scope` | `owner_health_summary_transfer` |
| `off_device_consent_mode` | `single_request` |
| `off_device_consent_granted` | literal JSON `true` |

Missing consent, `false`, collection scope `owner_initiated_import`, and memory
scope `health_read` all fail closed. Consent must not postdate envelope creation
or be more than five minutes old. The request itself expires within five
minutes and is inactive before creation and at/after expiry.

## Trend-Only Envelope

The builder consumes an already validated `HealthSourceSnapshot`, then copies
only its observation window, source-independent content digest, and complete
canonical five-family `HealthTrendProjection` sequence:

```text
steps, active_energy, heart_rate, sleep, workouts
```

The sequence remains qualitative: trend and baseline summary codes only. The
serialized envelope excludes source/snapshot/adapter identity, raw or numeric
samples, file/ZIP/XML data, endpoints, credentials, prompts, provider IDs, and
model IDs. Unknown fields, malformed/cyclic JSON, payloads above 16 KiB,
noncanonical identifiers, digest mismatch, incomplete/reordered families, and
invalid time windows are rejected with fixed non-echoing error codes.

## Explicit Non-Scope

This slice does not prove an owner identity or UI gesture, persist consent,
prevent replay without a future idempotency store, read HealthKit, parse an
export, open a network connection, add an API route, modify authenticated chat,
select or call a provider/model, store health data, create charts, expose iOS UI,
sign/install an App, or transmit a health summary. The current authenticated iOS
client still does not support health context.

## Accepted Product Files

- `src/personal_ai_companion/integrations/health_off_device.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `fixtures/integrations/v0.1/health-off-device-consent.json`
- `tests/test_health_off_device_consent.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`

## Superseded Next Boundary

`PAC-HEALTH-ANALYSIS-CONTRACT` was accepted at product `c0cd301`; see its
[manifest](health-analysis-contract-v0.1.md) and [acceptance
report](../reports/health-analysis-contract-v0.1-acceptance-20260715.md). It
adds controlled local explanation/uncertainty/chart metadata only. Real model
execution and narrative rendering remain later, separately reviewed work. The
explicitly injected owner Shortcut analysis API was subsequently accepted at
product `2360cba`; see its
[manifest](health-owner-shortcut-analysis-api-v0.1.md). It performs no default
or deployed transfer, persistence, authenticated-chat wiring, Shortcut/iOS
execution, or model call.
