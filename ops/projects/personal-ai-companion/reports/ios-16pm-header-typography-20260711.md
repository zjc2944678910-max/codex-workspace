# iPhone 16 Pro Max Header and Typography Local Mock Verification

**Status:** local/mock verified

## Scope

Route Lock:

- target_project: `personal-ai-companion`
- target_surface: iPhone 16 Pro Max mock header and typography evidence record
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`

This record covers only the locally built, unsigned iPhone 16 Pro Max Simulator
Host mock UI on iOS 26.5. It does not establish a result on a physical iPhone
16 Pro Max.

## Accepted Local Mock Changes

- `RootView` caps Dynamic Type to the `xSmall...xLarge` range. Normal chat
  rendering is approximately a 17pt body scale; an extreme system text setting
  remains inside that cap.
- The chat route no longer shows visible `AI 伴侣` title text. It uses a compact
  native `sparkles` companion mark with the accessibility label `对话`.
- The menu and new-chat targets remain 44pt. Titles on non-chat routes are
  unchanged.
- The companion mark is a local, non-human, non-brand mock UI symbol. It has no
  asset file and is not a real-person avatar.

## Local Verification

- The `PersonalAICompanionApp` Swift build completed for the unsigned iPhone 16
  Pro Max Simulator Host.
- `RootTab`, `AppSupport`, and `MockSafety` smoke checks completed.
- Normal and extreme local captures showed no text/control overlap and kept the
  composer visible.

## Boundaries And Residual Risk

- This is not validation on a physical iPhone 16 Pro Max, nor a release-signing
  result.
- It does not validate HealthKit, LAN connectivity, StackChan hardware, voice,
  camera, servo behavior, or any real device integration.
- No real-person/avatar asset was created or reviewed. Any real-person likeness
  or avatar requires a separately approved visual and consent boundary.
- The neutral `sparkles` mark is only a local mock UI treatment; it must not be
  represented as a validated personal likeness or physical-device display.
