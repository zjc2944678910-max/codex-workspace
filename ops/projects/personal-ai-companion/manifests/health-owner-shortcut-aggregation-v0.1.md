# PAC Health Owner Shortcut Aggregation v0.1

- Status: accepted local/synthetic aggregation and owner-buildable recipe
- Date: 2026-07-16
- Order: `12F`
- Task: `PAC-HEALTH-OWNER-SHORTCUT-RECIPE`
- Product source: `main@09b86c7`
- Acceptance report:
  [health-owner-shortcut-aggregation-v0.1-acceptance-20260716.md](../reports/health-owner-shortcut-aggregation-v0.1-acceptance-20260716.md)

## Selected Boundary

This no-paid-membership continuation freezes the local transformation that was
missing between an owner-run Apple Shortcut and the accepted 12A intake:

```text
owner-approved Apple Health actions (future phone execution)
  -> 28 caller-produced daily aggregates, kept on the phone
  -> 12F fixed qualitative aggregation policy
  -> 12A OwnerHealthSummaryIntake
  -> 12E owner analysis API (not called by this slice)
```

The product contains a pure Python reference implementation, one synthetic
fixture, and an owner-buildable Apple Shortcuts action recipe. No signed or
installed `.shortcut` export is claimed.

## Fixed Aggregation Policy

- exactly 21 complete local baseline days followed by seven complete current
  days;
- at least 10 baseline values, four current values, and two values in each of
  the first/last three-day trend groups;
- daily values, medians, and the 90%/110% thresholds use six-decimal
  `ROUND_HALF_UP` normalization;
- current median relative to baseline median produces
  `below_baseline`, `within_baseline`, or `above_baseline`;
- last-three-day median relative to first-three-day median produces
  `decreasing`, `stable`, or `increasing`;
- exact -10% and +10% boundaries are outside the stable/within band;
- a zero reference maps zero to stable/within and a positive value to
  increasing/above;
- any coverage failure makes both codes `insufficient_data`;
- output order is exactly steps, active energy, heart rate, sleep, and workouts.

The Python DTO validates adjacency and 20-to-28-hour day lengths so 23/25-hour
DST days are representable. Epoch milliseconds do not carry a time zone, so
local-midnight alignment remains an explicit caller precondition rather than a
server-proven fact.

## Shortcut Collection Rules

The reference recipe requires one stable owner-selected source per family for
all 28 days. It must not combine overlapping phone, watch, or third-party
samples. Sleep excludes `inBed`, merges non-overlapping asleep/core/deep/REM
intervals, and fails closed if safe merging is unavailable.

Apple Health read denial and an empty readable result cannot be reliably
distinguished by a Shortcut. Therefore an empty result is always missing; zero
is accepted only when an action returns an explicit numeric zero. Missing data
is never converted into healthy-looking activity.

The recipe converts all four intake/transfer UUIDs to lowercase, creates the
strict 12E JSON locally, and asks for a separate off-device confirmation before
building the transfer block. It stops at `Show Result`/`Quick Look` and contains
no URL or credential.

## Privacy And Failure Boundary

- daily numeric values exist only in the caller-provided local aggregation
  input and never appear in 12A output;
- fixed errors and representations do not echo timestamps or values;
- source names are local recipe choices and are not emitted;
- no file, HealthKit client, network connection, API call, model/provider,
  database, chat, Swift target, iOS navigation, or live state is touched;
- retries with identical caller IDs, timestamps, and aggregates are
  deterministic, but no exactly-once claim is added.

## Accepted Product Files

- `src/personal_ai_companion/integrations/health_shortcut_aggregation.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `fixtures/integrations/v0.1/health-shortcut-aggregation.json`
- `tests/test_health_shortcut_aggregation.py`
- `ios/PersonalAICompanion/Shortcuts/health-owner-summary-v0.1.md`
- `README.md`
- `ios/PersonalAICompanion/README.md`
- `ios/PersonalAICompanion/BUILD_NOTES.md`
- `ios/PersonalAICompanion/INTEGRATION_DESIGN.md`

## Explicit Non-Scope

This slice does not prove that a real iOS version exposes every documented
Shortcut action, read real Health samples, establish permission state, install
or sign a Shortcut, issue or store a credential, call the 12E route, deploy a
health endpoint, parse Apple `export.xml`, persist health/consent data, render
analysis, or provide medical advice.

## Current Continuation

The next selected design slice is `12G`: a dedicated opaque credential scoped
only to `health:shortcut-analysis`, stored server-side as a domain-separated
digest, individually revocable, and rejected by every other API. The ordinary
five-minute access token is unsuitable for recurring automation, and the
rotating full-account refresh token must never be stored in Apple Shortcuts.
Source implementation remains local/default-off; any deployment, real token
issuance, public route composition, or real health transmission requires a
separate L3 gate.
