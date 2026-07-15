# PAC Health Manual Export Normalization v0.1

- Status: accepted local synthetic/fixture-only contract
- Date: 2026-07-15
- Task: `PAC-HEALTH-MANUAL-EXPORT-NORMALIZATION`
- Product source: `main@0665fd3`
- Acceptance report:
  [health-manual-export-normalization-v0.1-acceptance-20260715.md](../reports/health-manual-export-normalization-v0.1-acceptance-20260715.md)

## Selected Boundary

`ManualHealthExportNormalization` accepts a bounded, already aggregated JSON
mapping. It maps exactly five documented Apple Health export record markers to
the existing canonical families:

| Export marker | Canonical family |
| --- | --- |
| `HKQuantityTypeIdentifierStepCount` | `steps` |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | `active_energy` |
| `HKQuantityTypeIdentifierHeartRate` | `heart_rate` |
| `HKCategoryTypeIdentifierSleepAnalysis` | `sleep` |
| `Workout` | `workouts` |

Input order is not authoritative. The normalizer requires complete, unique
coverage and emits the existing family order:

```text
steps, active_energy, heart_rate, sleep, workouts
```

The idempotency key becomes the deterministic snapshot ID. The existing
`HealthSourceSnapshot` validation, SHA-256 content digest, freshness,
deduplication, and source-conflict rules remain authoritative.

## Fail-Closed Rules

- Source identity, adapter identity/version, consent scope, and contract
  version are fixed.
- Unknown, missing, or duplicate export markers are rejected.
- File paths, ZIP/XML content, raw records, numeric health samples, URLs,
  tokens, and transport hints are not fields in the contract.
- Invalid windows, capture times, trend/summary pairs, oversized JSON, and
  noncanonical metadata fail with fixed error codes that do not echo rejected
  values.

## Explicit Non-Scope

This slice does not read a file, open or inspect an Apple Health ZIP, parse
`export.xml`, access HealthKit, request permission, sign or install an App,
enable the inert Swift manual-export adapter, open a network connection, add an
API route, invoke MCP, transmit health data, call a model, or expose iOS UI.

## Accepted Product Files

- `src/personal_ai_companion/integrations/health_manual_export.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `fixtures/integrations/v0.1/health-manual-export.json`
- `tests/test_health_manual_export.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`

## Superseded Next Boundary

`PAC-HEALTH-OFF-DEVICE-CONSENT-CONTRACT` was accepted at product `bff7398`; see
its [manifest](health-off-device-consent-contract-v0.1.md) and [acceptance
report](../reports/health-off-device-consent-contract-v0.1-acceptance-20260715.md).
Collection/import scopes remain separate from off-device consent. The current
next local candidate is `PAC-HEALTH-ANALYSIS-CONTRACT`, while Personal Team
signing and real-device health access remain a separate optional manual gate.
