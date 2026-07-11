# Companion Mark Local Mock Record

**Status:** local/mock source/build/smoke accepted; visual QA pending

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/reports/companion-mark-local-mock-20260711.md`
  only
- project_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: the accepted non-human companion-mark implementation and the
  owner requirement to keep documentation aligned with its actual evidence.
- forbidden_surfaces: product behavior changes, external assets, real-person
  likeness/voice, private material, bridge/device/network/credentials, real
  hardware, HealthKit, configuration, services, deploy, signing, and Git/GitHub.

## Confirmed Local Mark

`CompanionPresenceMark` is a pure SwiftUI, 20 pt, two-glint non-human mark. It
appears in the chat header and drawer. The chat header has no visible
`AI 伴侣`; the drawer preserves the product name and local-mock mode orientation.
The mark has one accessibility label: `本地陪伴标记，非真人头像`.

It has no external asset, portrait, face, person likeness, voice, network,
bridge, or hardware dependency. It does not change message content, infer a
persona, create memory, or issue a device command.

## Source/Smoke Evidence

Delegated local checks recorded as passed after the mark existed:

- `swift build --target PersonalAICompanionApp`
- `swift run PersonalAICompanionRootTabStateSmoke` (rerun after the mark)
- `swift run PersonalAICompanionMockSafetySmoke`

These results establish only local source/build/smoke evidence. They do not
establish a physical iPhone render, a real StackChan screen, actual ChatGPT
parity, a real-person avatar or consent, voice behavior, HealthKit behavior, or
any real hardware result.

## Visual And Hardware Boundary

No fresh iPhone 16 Pro Max visual verdict exists. The supplied screenshot that
names iPhone 17e is not target evidence. Visual QA is pending after manual Mac
unlock and remains local Simulator/mock evidence only.

No real screen, touch sensor, audio, servo, camera, firmware, bridge, device
acknowledgement, or field observation is established by this record.

## Exactly One Immediate Next Task

`PAC-IOS-IPHONE16PM-MOCK-VISUAL-QA` is the only immediate next task: L1,
unsigned iPhone 16 Pro Max Simulator/mock-only QA after manual Mac unlock. It
must inspect the compact mark at default and `xLarge` typography, along with
the chat header, drawer, local virtual screen, and touch preview. It must not
access a real iPhone, StackChan, bridge, LAN, credential, signing, HealthKit,
real identity material, or hardware capability.
