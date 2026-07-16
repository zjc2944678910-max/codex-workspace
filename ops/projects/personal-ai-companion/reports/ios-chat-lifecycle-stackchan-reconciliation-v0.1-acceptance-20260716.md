# iOS Chat Lifecycle And StackChan Reconciliation v0.1 Acceptance

Date: 2026-07-16

- Product revision: `1abf23a`
- Remote baseline: product `origin/main@1abf23a`
- Manifest: [ios-chat-lifecycle-stackchan-reconciliation-v0.1.md](../manifests/ios-chat-lifecycle-stackchan-reconciliation-v0.1.md)

## Accepted Result

The default-off iOS Host composition now has executable lifecycle coverage for
the authenticated Chat factory rather than relying only on a source-order
contract. Synthetic URLProtocol responses prove the real factory/client,
IdentityGate, and ChatViewModel path refreshes one rejected token and signs out
after a second rejection without making an external request.

StackChan status now reconciles the enqueue-response ambiguity window. It keeps
an uncertain command across cancellation, retries the same idempotent command
before expiry, replaces it at the local deadline, and rejects late completion
from an older operation generation.

## Verification

- `swift test`: `8` passed.
- `swift run PersonalAICompanionAppSupportSmoke`: passed, including controlled
  enqueue cancellation, replacement, stale completion, and TTL boundaries.
- `swift run PersonalAICompanionAppFlowSmoke`: passed.
- `swift run PersonalAICompanionMockSafetySmoke`: passed.
- `swift run PersonalAICompanionRootTabStateSmoke`: passed.
- `swift run PersonalAICompanionStackChanV02StatusTransportSmoke`: passed.
- `swift run PersonalAICompanionBridgeFactorySmoke`: passed.
- `swift build`: passed.
- `plutil -lint XcodeHost/Info.plist`: passed.
- Formal Host generic iOS Simulator build with independent DerivedData and code
  signing disabled: passed; package dependencies resolved from local cache.

- Product and workspace `git diff --check`: passed.
- Final GitNexus detection completed for the tracked product diff: `13` files,
  `191` indexed symbols, and `26` expected Root/Chat/AppSupport flows. Its
  count-based risk is `critical`; review found no unrelated flow. GitNexus does
  not include new untracked source, test, manifest, or report files, so those
  were reviewed through status, source inspection, and executable verification.

No live service, real credential, iPhone network request, Bridge, or physical
device was contacted. Live enablement, field testing, and deployment remain
separate actions. The accepted source is committed and pushed at product
`1abf23a`.
