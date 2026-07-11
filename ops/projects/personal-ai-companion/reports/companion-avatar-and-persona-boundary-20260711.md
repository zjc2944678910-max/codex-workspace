# Companion Avatar and Persona Boundary

**Status:** local/mock source/build/smoke accepted; visual QA pending

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/reports/companion-avatar-and-persona-boundary-20260711.md`
  only
- project_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: the owner asked whether the generic companion mark should
  change, while the accepted direction keeps it non-human and local-only.
- forbidden_surfaces: real-person likeness/portrait/voice, private images,
  image generation, bridge/device/network/credentials, real hardware,
  configuration, deploy, signing, HealthKit, real data, and identity-material
  processing.

## Confirmed Local Companion Mark

`CompanionPresenceMark` is a pure SwiftUI 20 pt mark with two offset glints.
It appears in the chat header and drawer. The chat header still contains no
visible `AI 伴侣` text; the drawer retains product and local-mock mode
orientation. Its one accessibility label is `本地陪伴标记，非真人头像`.

The mark is a local UI treatment, not a face, portrait, gendered character,
voice, biography, relationship history, or claim to represent a person. It
uses no external asset, person likeness, voice, network, bridge, hardware, or
message-content/memory behavior.

## Source/Smoke Evidence

The following delegated local checks were recorded as passed after the mark
existed, including a rerun of the root-tab state smoke:

- `swift build --target PersonalAICompanionApp`
- `swift run PersonalAICompanionRootTabStateSmoke`
- `swift run PersonalAICompanionMockSafetySmoke`

This evidence is only for the local mock source/build/smoke surface. It does
not establish a physical iPhone render, real StackChan behavior, actual
ChatGPT parity, real identity consent, a voice model, HealthKit behavior, or
any hardware result.

## Identity And Voice Boundary

No evidence establishes a real-person avatar, a partner identity, permission
to imitate a person, consent to use likeness or voice, or a voice model. Do
not use a real person's photo, illustration derived from a person, name, voice,
speech pattern, or biographical detail merely because an affectionate companion
is desired.

Any later real-person direction requires the separate
`PAC-COMPANION-IDENTITY-VOICE-INTAKE` intake-only task. Before later work can
be scoped, the owner must explicitly approve the identity, affirmative consent,
authorized source material, derivation/storage/access/retention/revocation
rules, output surfaces, sharing limits, and technical path. Processing identity
material, using a voice provider, changing live configuration, or driving a
real speaker/device requires separate risk classification and authorization;
live state or hardware is at least L3.

## Visual QA And One Immediate Next Task

No fresh iPhone 16 Pro Max visual verdict exists. The supplied iPhone 17e
screenshot is not target evidence. Local Simulator/mock visual QA remains
pending until manual Mac unlock.

The exactly-one immediate next task is
`PAC-IOS-IPHONE16PM-MOCK-VISUAL-QA`: L1, unsigned iPhone 16 Pro Max
Simulator/mock-only QA after manual Mac unlock. It will inspect the compact
mark at default and `xLarge` typography together with the icon-only chat
header, drawer orientation, and local virtual-screen/touch surfaces. It does
not authorize a real phone, StackChan, bridge, LAN, credential, signing,
HealthKit, real person, voice, or hardware capability.
