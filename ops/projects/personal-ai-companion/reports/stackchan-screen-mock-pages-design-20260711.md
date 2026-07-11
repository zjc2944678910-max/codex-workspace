# StackChan Screen Mock Pages Design Record

**Status:** local/mock verified

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: `ops/projects/personal-ai-companion/reports/stackchan-screen-mock-pages-design-20260711.md` only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: the read-only map confirms six-expression iOS local mock
  coverage but no virtual multi-page screen, while the user requested multiple
  robot-screen pages.
- forbidden_surfaces: all product code/tests, other docs, Git/GitHub,
  bridge/device/network, credentials/env, audio/servo/camera/touch actions,
  firmware/config/restart/deploy, signing, and HealthKit/real data.

## Local-Only Design

### Visual Thesis

`DeviceControlView` will contain a compact dark robot-screen preview. The
selected expression is the visual anchor. The preview has no likeness or avatar
and must not imply that a device is connected.

### Pages

| Page | Local mock content | Boundary |
| --- | --- | --- |
| `表情` | The currently selected mock expression. | Existing expression action remains mock-only. |
| `聆听` | A pure visual listening preview. | It explicitly says that it does not enable the microphone. |
| `状态` | A local mock summary only. | It contains no bridge or device-derived status. |

Every page permanently and clearly displays the marker: `本地预览 · 仅模拟`.

### Interaction And Motion

- Page selection is pure `DeviceControlViewModel` state. The selector makes
  zero bridge requests.
- The actual expression button retains its existing mock-command semantics. It
  must not be upgraded into proof of a real-device expression.
- Page changes use a restrained 0.2--0.25 second fade.
- The listening pulse runs only when Reduce Motion is off; otherwise it is
  static.
- The preview is a compact control surface, not a decorative hero or card
  layout.

## Completed Local Implementation Scope

The local mock implementation changed exactly these files:

- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupport/ViewModels/DeviceControlViewModel.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/DeviceControlView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/AppSupportActionSmoke.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/ActionSmokeSnapshots.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupportActionSmoke/ActionSmokeExpectedValues.swift`

## Confirmed Local Verification

- `swift build --target PersonalAICompanionApp` passed.
- `swift run PersonalAICompanionAppSupportActionSmoke` passed.
- `swift run PersonalAICompanionMockSafetySmoke` passed.
- The action smoke covers the default page and each of `表情`, `聆听`, and
  `状态`; all four states leave `MockLANBridgeClient.sentRequests` unchanged.
  Existing mock expression, motion, and camera request-order semantics remain
  covered independently.

## Confirmed Local Behavior

- The preview now contains three controlled local pages: `表情`, `聆听`, and
  `状态`.
- `本地预览 · 仅模拟` is permanently visible. The preview has no avatar and
  makes no real-screen claim.
- Selection is held in local view-model state. It does not issue a bridge
  request.
- `聆听` is visual-only and explicitly says that it does not enable the
  microphone.
- Static source inspection confirmed the page `Binding` reads selected state
  and writes through `selectScreenPreviewPage`; `.id` plus
  `.transition(.opacity)` are protected by a Reduce Motion gate. Accessibility
  labels are present for the relevant controls.
- Earlier external-review concerns were summary-level observations only. They
  were not confirmed by the inspected source.

## Visual QA Still Required

The host Mac was locked and no live Simulator window was available. Therefore
this record does not claim visual QA, iPhone 16 Pro Max coverage, or gesture
verification. Those remain local Simulator/mock-only work after manual unlock.

## Status Boundary

This local/mock verification changes no real device fact. The existing StackChan
display status remains `producer accepted`; device acknowledgement and field
observation remain unconfirmed. This local mock does not send an expression and
does not establish producer acceptance, device acknowledgement, or a
field-confirmed screen result.

## Exactly One Next Task

`PAC-STACKCHAN-SCREEN-MOCK-PAGES-VISUAL-QA` is the sole next task. It is an L1,
local Simulator/mock-only visual QA task after manual unlock. It must not access
a bridge, device, network, credential, microphone, speaker, servo, camera,
touch hardware, firmware, configuration, signing, HealthKit, or real data.
