# StackChan Screen Mock Pages Local Verification

> Later evidence note: these pages remain local/mock only. A separate manual
> Bridge/device session later field-confirmed the real LCD expression path; it
> did not run through these preview pages or the iOS App. See
> [stackchan-hardware-field-verification-20260711.md](stackchan-hardware-field-verification-20260711.md).

**Status:** local/mock verified

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: local iOS StackChan screen-preview evidence only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: local mock implementation and master static source inspection
- forbidden_surfaces: bridge/device/network, credentials/env, real StackChan,
  audio, servo, camera, touch, firmware, configuration, restart, deploy,
  signing, HealthKit, and real data

## Confirmed Local Mock Behavior

- The local preview has three selectable pages: `表情`, `聆听`, and `状态`.
- `本地预览 · 仅模拟` is permanently visible on the preview.
- Selection is controlled only by local state. It does not imply a device
  connection, real screen, or avatar.
- `聆听` is visual-only and explicitly states that it does not enable the
  microphone.

## Local Verification

The following passed:

- `swift build --target PersonalAICompanionApp`
- `swift run PersonalAICompanionAppSupportActionSmoke`
- `swift run PersonalAICompanionMockSafetySmoke`

The action smoke verifies that the default view and each page change leave
`MockLANBridgeClient.sentRequests` unchanged. Existing expression, motion, and
camera mock request-order semantics remain covered.

Master static inspection confirmed that page `Binding` reads selected state and
writes through `selectScreenPreviewPage`; `.id` plus `.transition(.opacity)`
use a Reduce Motion gate; and accessibility labels exist. Earlier external
review concerns were summary-level only and were not confirmed in the inspected
source.

## Status Boundary

This is **local/mock verified** only. It changes no StackChan producer, ack, or
field fact. The prior real-screen result remains separately `producer accepted`;
device acknowledgement and field observation remain unconfirmed. This record
does not claim the real screen is repaired or that a device displayed any page.

## Residual Visual Risk

The Mac was locked and no live Simulator window was available. No iPhone 16 Pro
Max visual QA was performed. The exactly-one next task is
`PAC-STACKCHAN-SCREEN-MOCK-PAGES-VISUAL-QA`: L1 local Simulator/mock-only QA
after manual unlock, with no bridge or device access.
