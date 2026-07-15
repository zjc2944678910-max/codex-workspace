# PAC Health Owner Summary Contract v0.1

- Status: accepted local synthetic/transport-free contract
- Date: 2026-07-15
- Task: `PAC-HEALTH-OWNER-SUMMARY-CONTRACT`
- Product source: `main@4a8b52e0d966e5bf5db3009a8ad8a3178485cd8f`
- Acceptance report:
  [health-owner-summary-contract-v0.1-acceptance-20260715.md](../reports/health-owner-summary-contract-v0.1-acceptance-20260715.md)

## Selected Boundary

`OwnerHealthSummaryIntake` defines the compact JSON shape that a future
owner-run Shortcut/webhook could author. It is an immutable Python DTO that
materializes the existing `pac.health_source.v0.1` `HealthSourceSnapshot` and
keeps the canonical family order:

```text
steps, active_energy, heart_rate, sleep, workouts
```

Source metadata is fixed to `owner_shortcut_webhook` with adapter
`owner.shortcut-webhook`, version `v0.1`, and consent scope
`owner_initiated_import`. A canonical UUID idempotency key becomes the
deterministic snapshot identity. The existing SHA-256 content digest and
snapshot validation remain authoritative.

## Fail-Closed Rules

- Unknown fields, raw samples, URLs, tokens, transport hints, duplicate or
  noncanonical families, invalid clocks, invalid windows, and oversized JSON
  are rejected with fixed error codes.
- Validation errors never echo a source revision, URL, token, or raw sample.
- The DTO exposes no endpoint, credential, file path, network route, Shortcut
  invocation, cloud transmission, or iOS UI.
- The fixture under the product `fixtures/integrations/v0.1/` directory is
  synthetic and contains no real health values or identifiers.

## Explicit Non-Scope

This contract does not parse Apple Health XML/ZIP exports, read a file, open a
socket, receive a webhook, invoke a Shortcut, request HealthKit permission,
access a device, sign an App, call MCP, select a provider, or send health data
to cloud chat. Those actions require separate tasks and owner-visible gates.

## Accepted Product Files

- `src/personal_ai_companion/integrations/health_intake.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `fixtures/integrations/v0.1/health-owner-shortcut.json`
- `tests/test_health_intake.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`

## Next Boundary

The next local candidate is `PAC-HEALTH-MANUAL-EXPORT-NORMALIZATION`: synthetic
mapping fixtures for a documented manual-export shape. It must reuse the
existing snapshot validation/hash/freshness/conflict boundary and must not read
a real export file or add a network, cloud, or iOS intake path.
