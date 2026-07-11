# iPhone 16 Pro Max Typography And Visual-QA Boundary

**Status:** planned

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: iPhone 16 Pro Max local mock typography and visual-QA record
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: owner-selected iPhone 16 Pro Max target; supplied simulator
  screenshot; current local Swift source; and the Mac-lock QA blocker.
- forbidden_surfaces: product code, any other project, Git/GitHub,
  Simulator/device operation, bridge/network/credentials, real hardware,
  HealthKit, configuration, service restart, deploy, and signing.

## Confirmed Evidence

- The intended local QA target is the unsigned, mock-only iPhone 16 Pro Max
  Simulator. This is not a physical-iPhone target.
- The supplied screenshot visibly labels its simulator `iPhone 17e` and
  `iOS 26.5`. It therefore cannot, by itself, accept or reject the current
  iPhone 16 Pro Max target render.
- Current source evidence only: the chat route has an icon-only `sparkles`
  header rather than visible `AI 伴侣` text; `ChatView` uses semantic `.body`
  for the chat message and composer text; and `RootView` applies the
  `.xSmall ... .xLarge` Dynamic Type ceiling.
- Current device-screen pages and gentle-touch acknowledgement are local mock
  UI surfaces only. They do not establish a sensor, microphone, speaker,
  camera, bridge, StackChan screen, acknowledgement, or field result.
- The local Reduce Motion touch repair changed only `DeviceControlView.swift`.
  Delegated checks passed `swift build --target PersonalAICompanionApp`,
  `swift run PersonalAICompanionAppSupportActionSmoke`, and
  `swift run PersonalAICompanionMockSafetySmoke`. Master source acceptance
  confirmed the acknowledgement cycle/cancellation guard and no bridge path.
  This is **local/mock source/build/smoke accepted** only.

## Unconfirmed Or Pending

- Source evidence is not a new visual result at the target device class.
- The Mac remains manually locked, so current visual QA cannot yet establish
  default-size or `xLarge` presentation, control fit, the icon-only chat
  header, or the absence of system Hover Text/accessibility-overlay confusion.
- This record establishes no real iPhone, ChatGPT implementation, real
  StackChan, HealthKit, signing, LAN, or hardware result.

## Required Next QA

`PAC-IOS-IPHONE16PM-MOCK-VISUAL-QA` may run only after the user manually
unlocks the Mac. Its scope is the unsigned iPhone 16 Pro Max Simulator mock at
default and `xLarge` text settings. It must check:

- the chat header has no visible `AI 伴侣` text;
- chat and composer text remain compact, readable, and within their controls;
- the local virtual-screen and gentle-touch preview remain clearly labelled as
  mock-only; and
- no system Hover Text or accessibility overlay is being mistaken for product
  UI.

It must not operate a real iPhone or StackChan, access a bridge or network,
change credentials or configuration, invoke HealthKit, sign an app, or expand
into audio, servo, camera, or touch hardware work.

## Verification Of This Record

This documentation synchronization used static source and existing local-QA
records only. No Simulator, device, bridge, network, credential, or product
code operation occurred.
