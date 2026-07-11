# iOS Touch-Reaction Mock Design Record

**Status:** local/mock source/build/smoke accepted; visual QA pending

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/reports/ios-touch-reaction-mock-design-20260711.md`
  only
- project_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: a local-only gentle-touch mock was accepted after a read-only
  protocol map confirmed no device-side touch producer, firmware contract, or
  field evidence.
- forbidden_surfaces: bridge/device/network/credentials, touch-wire events,
  physical sensor, servo, audio, camera, firmware, configuration, restart,
  deploy, signing, HealthKit, real data, real-person likeness, and all actual
  hardware operation.

## Confirmed Local Mock

The mock has exactly this local UI state transition:

```text
idle -> simulatedGentleAcknowledgement -> idle
```

`DeviceTouchReactionState` is local view-model state. The view uses a local
`touchAcknowledgementCycle` task identity; it does not use `.rawValue` to
drive that task. The `模拟轻触` control is a repeatable 44 pt `hand.tap` button.
It leaves no event envelope, bridge request, queue entry, or retained command.

The acknowledgement is static for 0.8 seconds with Reduce Motion and for 1.1
seconds otherwise, then clears back to `idle`. Cancellation also clears only
local UI state. This is not a timer-driven device action or background task.

Inside the virtual-screen preview, the acknowledgement is a compact,
non-human halo/sparkle treatment. It retains `本地预览 · 仅模拟` and the explicit
qualification `不代表传感器`.

## Accepted Scope And Checks

The accepted local-only implementation scope was limited to:

- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupport/ViewModels/DeviceControlViewModel.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/DeviceControlView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/AppSupportActionSmoke.swift`

Delegated local checks recorded as passed:

- `swift build --target PersonalAICompanionApp`
- `swift run PersonalAICompanionRootTabStateSmoke`
- `swift run PersonalAICompanionAppSupportActionSmoke`
- `swift run PersonalAICompanionMockSafetySmoke`

Static source acceptance confirmed that invoking the local touch acknowledgement
does not use a bridge touch path. The action smoke also preserves the existing
mock expression, motion, and camera request-order assertions while verifying
the touch state transition leaves `MockLANBridgeClient.sentRequests` unchanged.

## Explicitly Not Proven

This evidence establishes local source/build/smoke behavior only. It does not
show a physical touch, sensor event, real StackChan display change, producer
acceptance, device acknowledgement, field observation, real iPhone render,
servo movement, audio, microphone, camera, firmware interaction, or HealthKit
behavior. It does not imply that a person felt, expressed, or received touch.

The separate real-screen status remains `producer accepted`; device ack and
field observation remain unconfirmed.

## Visual QA And One Immediate Next Task

No fresh iPhone 16 Pro Max visual verdict exists. The supplied iPhone 17e
screenshot is not target evidence. Local Simulator visual QA remains pending
until the Mac is manually unlocked.

The exactly-one immediate next task is
`PAC-IOS-IPHONE16PM-MOCK-VISUAL-QA`: L1, unsigned iPhone 16 Pro Max
Simulator/mock-only QA after manual Mac unlock. It must inspect default and
`xLarge` typography, the chat header, companion mark, virtual screen, and
touch acknowledgement without accessing a real phone, StackChan, bridge, LAN,
credential, signing, HealthKit, or hardware capability.
