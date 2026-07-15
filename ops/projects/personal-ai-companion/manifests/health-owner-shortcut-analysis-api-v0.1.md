# PAC Health Owner Shortcut Analysis API v0.1

- Status: accepted local/synthetic, default-absent API slice
- Date: 2026-07-15
- Task: `PAC-HEALTH-OWNER-SHORTCUT-ANALYSIS-API`
- Product source: `main@2360cba`
- Acceptance report:
  [health-owner-shortcut-analysis-api-v0.1-acceptance-20260715.md](../reports/health-owner-shortcut-analysis-api-v0.1-acceptance-20260715.md)

## Selected Boundary

The selected no-paid-membership continuation is an owner-authenticated Cloud
API over the already accepted qualitative contracts:

```text
12A OwnerHealthSummaryIntake
  -> HealthSourceSnapshot
  -> 12C HealthOffDeviceSummaryEnvelope
  -> 12D HealthAnalysisRequest
  -> 12D HealthAnalysisResponse
```

`POST /v1/health/shortcut-analysis` exists only when a caller injects both a
dedicated `HealthShortcutAnalysisService` and the trusted owner resolver into
`create_cloud_app`. The ordinary factory injects neither, so the route is absent
by default. No production composition, environment flag, deployment, or iOS
client was added.

## Request And Authorization

The strict request version is
`pac.health_owner_shortcut_analysis.v0.1`. It contains exactly:

- one complete 12A owner Shortcut intake;
- one separate transfer request UUID and idempotency UUID;
- literal Boolean off-device consent;
- the millisecond time of that single-request consent.

Source, adapter, and import-consent fields remain fixed by 12A. The service fixes
the 12C destination, purpose, privacy scope, transfer-consent scope, and consent
mode. It uses the submitted consent time as both the transfer creation time and
the 12D request time, then derives the existing five-minute expiry. A retry
therefore cannot extend authorization and retains the same request fingerprint.
The server's separately injected millisecond clock must still fall inside that
window before a response is built.

The idempotency key is content/request identity only. There is no durable replay
store, exactly-once execution, or claim that a duplicate was suppressed.

## HTTP And Privacy Boundary

- bearer authentication and trusted single-owner resolution run before the
  request body is streamed;
- the body is strict UTF-8 `application/json`, capped at 20 KiB, and rejects
  duplicate keys, malformed/deep JSON, unknown fields, widened nested shapes,
  invalid UUIDs, and invalid health contracts with fixed non-echoing errors;
- `false`, future, not-yet-active, or expired transfer consent fails closed;
- the response is the existing exact 12D categorical response and sets
  `Cache-Control: no-store`, `Pragma: no-cache`, and `nosniff`;
- source ID, adapter ID, source revision, raw samples, numeric measurements,
  credentials, endpoint, provider, model, and prompt fields are absent;
- the service has no database or other persistence dependency.

## Explicit Non-Scope

This slice does not create or install an iPhone Shortcut, obtain or refresh a
bearer token for Shortcuts, read Apple Health samples, parse `export.xml`,
aggregate raw records into baseline/trend codes, prove a real consent UI gesture,
call Claude or another model, generate free-form prose, render a chart, provide
medical advice, wire authenticated chat, expose iOS UI, persist health or
consent data, rate-limit a deployed public route, or change live state.

Real Apple `export.xml` contains raw records and cannot honestly map directly to
the accepted 12B pre-aggregated qualitative DTO. Any later export path needs a
separate bounded decoder plus an explicit aggregation/baseline policy before it
can produce the five qualitative families.

## Accepted Product Files

- `src/personal_ai_companion/cloud/health_api.py`
- `src/personal_ai_companion/cloud/app.py`
- `tests/test_cloud_health_analysis.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`

## Current Continuation

No later implementation slice is selected. The next practical design choice is
between an owner-visible Shortcut recipe/token handoff and a separately
consented controlled model-narrative adapter. Either requires a new scope. A
real export decoder/aggregator remains independent and lower priority because it
does not yet provide the practical no-membership path.
