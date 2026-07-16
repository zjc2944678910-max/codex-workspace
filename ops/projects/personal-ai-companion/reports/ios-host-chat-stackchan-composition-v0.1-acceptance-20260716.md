# iOS Host Chat And StackChan Composition v0.1 Acceptance

Date: 2026-07-16

- Product revision: `1abf23a`
- Remote baseline: product `origin/main@1abf23a`
- Manifest: [ios-host-chat-stackchan-composition-v0.1.md](../manifests/ios-host-chat-stackchan-composition-v0.1.md)

## Accepted Result

The iOS source now completes the local/default-off composition that order 14
intentionally excluded. Formal Host Chat wiring is protected by a composition
contract, while StackChan status is injected only after sign-in through a
separate gated factory and explicit user-triggered status UI.

The status factory was changed from a Bundle-only construction point to a
Bundle wrapper over an internal injectable composition method. Four XCTest
cases execute the default-off, invalid configuration, missing/malformed
credential, and valid-idle branches without reading a real Keychain or issuing
a request. Existing transport, correlation, Chat API, identity refresh,
ViewModel, Root lifecycle, Bridge factory, and mock-safety checks remain in
force.

## Verification

- `swift test --filter StackChanStatusClientFactoryTests`: `4` passed.
- `swift run PersonalAICompanionMockSafetySmoke`: passed.
- `swift run PersonalAICompanionAppFlowSmoke`: passed.
- `swift run PersonalAICompanionAppSupportSmoke`: passed.
- `swift run PersonalAICompanionRootTabStateSmoke`: passed.
- `swift run PersonalAICompanionStackChanV02StatusTransportSmoke`: passed.
- `swift run PersonalAICompanionBridgeFactorySmoke`: passed.
- `swift build --target PersonalAICompanionApp`: passed.
- Formal Host generic iOS Simulator build with independent DerivedData and code
  signing disabled: passed.
- `plutil -lint` and product/workspace `git diff --check`: passed.
- Final GitNexus detection completed for the tracked diff: `11` product files,
  `167` indexed symbols, and `19` expected Root/Smoke flows. Its count-based
  risk is `critical`; review found no unrelated flow. GitNexus does not include
  the new untracked factory, ViewModel, test, manifest, or report files, so
  those were reviewed separately through status/diff and focused verification.

No live service, real credential, real health data, iPhone network request,
Bridge listener, or physical device was contacted. Enabling either feature,
field verification, and deployment remain separate actions. The accepted source
is committed and pushed at product `1abf23a`.
