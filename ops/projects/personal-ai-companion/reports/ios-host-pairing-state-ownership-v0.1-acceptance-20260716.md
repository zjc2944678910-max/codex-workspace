# iOS Host Pairing State Ownership v0.1 Acceptance

Date: 2026-07-16

- Product revision: `1abf23a`
- Remote baseline: product `origin/main@1abf23a`
- Manifest: [ios-host-pairing-state-ownership-v0.1.md](../manifests/ios-host-pairing-state-ownership-v0.1.md)

## Accepted Result

Pairing no longer rebuilds the signed-in iOS tree. The Host keeps one stable
Bridge router, replaces only its target, and sends a presentation revision that
does not participate in SwiftUI identity. Chat draft, temporary conversation,
messages, Device pending LCD result, and the deferred StackChan status ViewModel
survive replacement.

Request correlation is origin-bound. Pending results remain on the originating
Bridge, terminal and capacity-evicted IDs fail closed, and a reused active ID
cannot overwrite the prior binding. The independent review found and repaired
the earlier silent fallback to the replacement Bridge.

StackChan status now resolves the current paired credential and URL session
only after a manual refresh. Construction, pairing, token rotation, and ordinary
view lifecycle make zero automatic status requests.

## Verification

- `swift test`: `16` passed, including `7` stable-router/state-ownership tests,
  `5` deferred status-factory tests, and `4` Chat identity-lifecycle tests.
- `swift run PersonalAICompanionAppSupportSmoke`: passed.
- `swift run PersonalAICompanionMockSafetySmoke`: passed.
- `swift run PersonalAICompanionAppFlowSmoke`: passed.
- `swift run PersonalAICompanionRootTabStateSmoke`: passed.
- `swift run PersonalAICompanionStackChanV02StatusTransportSmoke`: passed.
- `swift run PersonalAICompanionBridgeFactorySmoke`: passed.
- `swift build`: passed.
- `plutil -lint XcodeHost/Info.plist`: passed.
- Formal Host generic iOS Simulator build with fresh independent DerivedData and
  code signing disabled: passed; dependencies resolved from local cache.
- Product and workspace `git diff --check`: passed.
- Final product GitNexus detection covered the tracked diff: `16` files, `251`
  indexed symbols, and `43` expected Root/Chat/Device/Smoke flows. Its aggregate
  risk is `critical`, driven by shared AppEnvironment/Device and file-level Swift
  graph expansion. New untracked router, status factory/ViewModel, tests,
  manifests, and reports are absent from GitNexus and were reviewed through
  source inspection and executable verification.

Both Host gates remain false. No product API, real credential, LAN Bridge,
physical device, live enablement, or deployment was used. The accepted source
is committed and pushed at product `1abf23a`.
