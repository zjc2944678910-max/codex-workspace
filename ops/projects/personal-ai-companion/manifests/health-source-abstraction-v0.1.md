# PAC Health Source Abstraction v0.1

- Status: accepted local/mock/Simulator-first additive seam
- Date: 2026-07-15
- Task: `PAC-HEALTH-SOURCE-ABSTRACTION`
- Product source: `main@b6209a74c27b6c384c853d17a47b05d3fb43a1aa`
- Acceptance report:
  [health-source-abstraction-v0.1-acceptance-20260715.md](../reports/health-source-abstraction-v0.1-acceptance-20260715.md)

## Selected Boundary

The iOS Core now exposes one source catalog and one additive adapter protocol
for the five canonical health families:

```text
steps, active_energy, heart_rate, sleep, workouts
```

`HealthSourceCatalog` names source kind, adapter identity/version, source
revision, intake mode, readiness, consent scope, owner-action requirement, and
the explicit `isEnabledByDefault` flag. All descriptors are disabled by
default, including Apple Health.

`HealthSourceAdapter` preserves the existing `HealthSummaryProviding` call
surface and adds an attributed summary wrapper. The wrapper carries source
attribution, adapter/source revision, capture time, consent scope, a non-secret
content fingerprint, and a structured deduplication identity. Family order is
canonical and duplicate, empty, unsupported, or malformed snapshots fail
closed.

## Source Readiness

| Source | Readiness | Intake | Current boundary |
| --- | --- | --- | --- |
| Apple Health / HealthKit | implemented code adapter | system permission | No authorization, device result, or real sample is accepted. |
| Owner Shortcut/webhook | planned | owner initiated | Typed unavailable adapter only; no network or Shortcut invocation. |
| Manual Apple Health export | planned | manual import | Typed unavailable adapter only; no file read or parser. |
| Selected third-party adapter | planned | future adapter | No provider, endpoint, credential, or transport. |
| Synthetic mock | test only | synthetic | Deterministic SwiftPM/Preview contract path. |

The formal iOS Host retains its existing HealthKit provider injection when no
provider is supplied for compatibility with the old app surface. Constructing
that provider does not request authorization or read a sample. The catalog
flag is the source-selection policy; replacing the formal-host default with an
explicit owner source-choice gate is a later task.

## Explicit Non-Scope

- Paid Apple Developer Program membership, Personal Team signing, provisioning,
  TestFlight, App Store distribution, or a signed-device result;
- HealthKit authorization, real health samples, manual export parsing,
  Shortcut/webhook delivery, third-party API access, or background collection;
- file, network, MCP, provider, or cloud-chat health intake;
- Swift/Python fixture or payload parity. The Python `pac.health_source.v0.1`
  contract remains authoritative for numeric windows, SHA-256 content hashes,
  freshness, and multi-source conflict composition;
- changing the existing `HealthSummaryProviding` or `HealthContextSnapshot`
  API.

## Accepted Product Files

- `ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Models/HealthSourceModels.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Protocols/HealthSourceAdapting.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/HealthKit/HealthKitHealthProvider.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Mocks/MockHealthSummaryProvider.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionHealthPermissionGateSmoke/HealthPermissionGateSmoke.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionHealthPermissionGateSmoke/HealthPermissionGateSmokeAssertions.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionMockSafetySmoke/MockSafetyExpectedValues.swift`
- `README.md`, `ios/PersonalAICompanion/README.md`,
  `ios/PersonalAICompanion/INTEGRATION_DESIGN.md`, and
  `ios/PersonalAICompanion/BUILD_NOTES.md`

## Verification Anchor

- Health-focused Python tests: `24 passed`.
- Full product Python suite: `1439 passed, 1 warning`; the warning is the
  existing Starlette `TestClient`/`httpx` deprecation notice.
- SwiftPM package dump, Core typecheck, and `PersonalAICompanionApp` target
  build passed.
- All `44/44` Swift smoke executables passed, including catalog ordering,
  source attribution, deduplication, empty/unsupported family rejection,
  invalid capture-time rejection, and planned-fallback unavailability.
- `PersonalAICompanionIntegrationDesignSmoke` and
  `PersonalAICompanionMockSafetySmoke` passed.
- Unsigned iPhone 17 Pro Simulator Host build passed with
  `CODE_SIGNING_ALLOWED=NO` and `CODE_SIGNING_REQUIRED=NO`.
- `git diff --cached --check` and final product diff checks passed.

## Residual Risk And Rollback

The Swift fingerprint is a non-secret local metadata fingerprint, not the
Python contract's cryptographic content hash. Numeric windows, freshness, and
multi-source composition remain unimplemented in Swift. The formal Host's
legacy HealthKit injection can still present the system-health UI until a later
explicit source-choice gate is designed; this acceptance does not treat that
as authorization or data access.

Rollback is a source revert of product commit `b6209a74`; no data, service,
signing, deployment, or external-intake rollback is required because this
slice changed only local source, tests, and documentation.

## Acceptance Judgment

`PAC-HEALTH-SOURCE-ABSTRACTION` is complete for the bounded local/mock/
Simulator-first scope. It establishes the additive source seam and the
owner-initiated fallback plan without buying paid membership or claiming real
HealthKit, export, Shortcut, third-party, MCP, provider, or cloud behavior.
