# iOS Touch-Reaction Mock Design Record

**Status:** planned

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/reports/ios-touch-reaction-mock-design-20260711.md`
  only
- project_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: the read-only v0.1 map names a future touch capability but
  confirms no device-side touch producer, firmware contract, or field evidence;
  the owner requested a gentle touch reaction.
- forbidden_surfaces: product code/tests outside the stated future scope, other
  docs, Git/GitHub, bridge/device/network/credentials, touch-wire events,
  physical sensor, servo, audio, camera, firmware, configuration, restart,
  deploy, signing, HealthKit, real data, and real-person likeness.

## Proposed Local-Only State

The mock has exactly this local UI state transition:

```text
idle -> simulatedGentleAcknowledgement -> idle
```

The action is labelled `模拟轻触`. It is not named after a head, body, sensor,
or touch-hardware surface. It is local view-model state only: it must not form
an event envelope or call a LAN bridge.

The control is a repeatable, 44 pt `hand.tap` button. A successful local press
shows the acknowledgement and then returns to `idle`; this auto-return is a
local UI transition only. With Reduce Motion enabled, the acknowledgement is
static or returns instantly. It must not start a long-running animation,
background task, timer-driven device action, or retained command.

## Visual Thesis

Inside the existing virtual-screen preview, show a compact, non-human soft
sparkle or halo acknowledgement. Keep the permanent marker
`本地预览 · 仅模拟` and add the explicit qualification `不代表传感器` beside the
touch-preview state.

The acknowledgement is a visual UI convention only. It must not claim that a
sensor was touched, that a physical body reacted, or that a person felt
shyness. It uses no portrait, face, voice, private exemplar, or real-person
likeness.

## Non-Hardware Boundary

This mock state must not trigger, enqueue, or imply any of the following:

- a display-pattern command or a real StackChan screen update;
- motion, servo, speaker, microphone, or camera behavior;
- a touch-wire event, physical sensor read, firmware interaction, or queue
  operation; or
- producer acceptance, device acknowledgement, or field observation.

Changing this local preview therefore changes no current real StackChan fact.
The prior real-screen status remains separately `producer accepted`; device ack
and field observation remain unconfirmed.

## Proposed L1 Implementation Scope

The future local-only implementation is limited to exactly:

- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupport/ViewModels/DeviceControlViewModel.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/DeviceControlView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/AppSupportActionSmoke.swift`

The view model should expose the two-state sequence without importing a bridge
or command type. The view should render the state, the permanent mock marker,
and the Reduce Motion behavior. The action smoke must prove the sequence and
that invoking `模拟轻触` leaves `MockLANBridgeClient.sentRequests` unchanged.
It must also retain the existing mock expression, motion, and camera
request-order assertions without regression.

## Required Verification

Before this record can move beyond `planned`, the future implementation task
must pass all of the following locally:

- `swift build --target PersonalAICompanionApp`;
- `swift run PersonalAICompanionAppSupportActionSmoke`; and
- `swift run PersonalAICompanionMockSafetySmoke`.

Visual QA is a separate, later local Simulator/mock check after the Mac is
unlocked. It is not real-iPhone or real-hardware evidence.

## Exactly One Next Task

`PAC-IOS-TOUCH-REACTION-MOCK` is the sole next task. It is an L1,
local-only implementation of the scope and verification above. It must not
access a bridge, device, network, credential, touch hardware, physical sensor,
audio, servo, camera, firmware, configuration, signing, HealthKit, or real
data.
