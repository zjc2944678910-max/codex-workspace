# PAC iOS Supported App Action v0.1

- Status: accepted local/mock/Simulator-first
- Date: 2026-07-15
- Task: `PAC-IOS-SUPPORTED-APP-ACTION`
- Product source: `main@7547d8a57d239d32716632210e4da6431fa0ea98`
- Acceptance report:
  [ios-supported-app-action-v0.1-acceptance-20260715.md](../reports/ios-supported-app-action-v0.1-acceptance-20260715.md)

## Selected Boundary

The slice supports exactly one owner-visible, read-only system handoff:

```text
action_id: companion.share_capabilities
target_app_id: system.share_sheet
invocation_kind: share_sheet
effect_kind: read_only
requires_confirmation: false
```

The Status screen uses SwiftUI `ShareLink` to expose a compile-time fixed
public capability card. The card contains no user, conversation, health,
provider, device, account, credential, endpoint, or other runtime data.

## Receipt And Audit Boundary

The production `ShareLink` path is deliberately not wired to the mock receipt
provider or the Python `PhoneActionOutcome` contract. The system handoff does
not generate an app receipt, persist an audit event, observe owner cancellation,
or confirm that a target app received or completed anything.

`MockPhoneActionHandoffProvider` exists only for deterministic contract smoke.
It reports local validation as `handed_off` or `failed`; every receipt keeps
`targetCompletionConfirmed == false`. The Python test exercises compatible
read-only/handoff-only semantics, not Swift/Python payload, fingerprint, or
wire-fixture parity.

## Explicit Non-Scope

- App Intents, Shortcuts, URL schemes, universal links, reminders, EventKit,
  background control, dynamic sharing, or state-changing phone actions;
- notification reading, arbitrary cross-app control, private cross-app data,
  or target-app acknowledgement;
- real device execution, Apple Developer signing, distribution, TestFlight,
  App Store submission, or external service state;
- durable audit storage, cancellation/completion telemetry, or a claim that a
  `handed_off` contract outcome equals target-app completion.

## Accepted Files

- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/StatusView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupport/ViewModels/SupportedPhoneActionCatalog.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/AppSupportActionSmoke.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionMockSafetySmoke/MockSafetyExpectedValues.swift`
- `tests/test_integration_phone.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`
- `ios/PersonalAICompanion/INTEGRATION_DESIGN.md`
- `ios/PersonalAICompanion/BUILD_NOTES.md`

## Verification Anchor

- `tests/test_integration_phone.py`: `26 passed`
- Full Python suite: `1439 passed, 1 warning`; the warning is the existing
  Starlette `TestClient`/`httpx` deprecation notice.
- SwiftPM package dump, Core typecheck, App target build, and all `44/44` Swift
  smoke executables passed.
- `PersonalAICompanionAppSupportActionSmoke` covers the supported catalog,
  unsupported action, empty payload, oversized payload, fixed payload bounds,
  sensitive-shape denylist, and the false completion invariant.
- `PersonalAICompanionMockSafetySmoke` passed with the new catalog in its
  production-file inventory.
- An unsigned iPhone 17 Pro Simulator Host build passed with
  `CODE_SIGNING_ALLOWED=NO`. No simulator app was launched or external target
  selected for this acceptance.
- Targeted Ruff check for `tests/test_integration_phone.py` passed. The full
  repository Ruff baseline retains unrelated findings outside this slice.
- Product staged GitNexus detection covered the expected files with no affected
  production execution flow; the product index is refreshed to the final commit
  and reports up-to-date status.
- Independent read-only review found no P0/P1 issue. It identified only the
  future-use risk that the mock provider is not a dynamic-content sanitizer; the
  production path uses a fixed literal and does not call it.

## Residual Risk And Rollback

If a future slice allows dynamic sharing, it must add structured content policy,
UTF-8 byte limits, and a new review before reusing the mock/provider seam. The
current fixed card does not expose that risk. Rollback is to revert product
commits `7547d8a` and `64ac209`; no data, service, signing, or deployment
rollback exists because this acceptance changed only local source/docs.

## Acceptance Judgment

`PAC-IOS-SUPPORTED-APP-ACTION` is complete for the bounded local/mock/Simulator
scope. The next queue item is `PAC-HEALTH-SOURCE-ABSTRACTION`. No real target-app
execution, cancellation observation, receipt, audit, or target completion is
accepted by this manifest.
