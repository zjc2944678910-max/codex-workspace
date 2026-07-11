# PAC iOS Mock UX R2 Evidence Record

Date: 2026-07-11  
Primary status: `local/mock verified`

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: iOS mock UX R2 evidence record
- project_root: `projects/products/personal-ai-companion`
- owned surface: this report only
- forbidden surfaces: product source, runtime configuration, Simulator control,
  LAN or hardware targets, credentials, HealthKit, signing, and Git/GitHub

This record follows the normative [continuous program authorization and task
lifecycle runbook](../runbooks/continuous-program-authorization-and-task-lifecycle.md).

## Root Cause

The mock UI's root shell did not cap pathological Dynamic Type sizes. At an
extreme size, the header, Chinese welcome message, and composer all became too
large to remain usable.

## Confirmed Mock Result

The root shell now constrains Dynamic Type to `xSmall ... xxxLarge`. Local
Simulator visual evidence exists for both standard and extreme text sizes. In
those mock-only captures, the title, Chinese welcome message, and composer are
usable.

The upstream R2 acceptance also recorded passing local checks: `swift build`,
`PersonalAICompanionRootTabStateSmoke`, `PersonalAICompanionAppSupportSmoke`,
`PersonalAICompanionMockSafetySmoke`, an unsigned Simulator Host `xcodebuild`,
and `git diff --check` with no output. These are local/mock evidence, not a
real-device or production acceptance result.

## Drawer Evidence

The drawer menu visual and its accessibility close path were verified. The
accessibility check covered the menu, offline mock label, and close button.

The following runtime interactions are **not** end-to-end verified: left-edge
drag to open, overlay tap to close, and Escape to close. Shared Simulator
interaction was interrupted before those checks completed. This record does
not claim them complete.

## Local Evidence Artifacts

The following untracked local scratch artifacts are capture evidence only; they
are not tracked product facts:

- [standard chat capture](/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/ux-r2/chat-standard.png)
- [extreme text-size chat capture](/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/ux-r2/chat-extreme.png)
- [open drawer accessibility capture](/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/ux-r2/drawer-open-accessibility.png)

## Unverified And Out Of Scope

No real iPhone, signing or provisioning, live LAN connection, HealthKit
capability/permission/data, StackChan hardware control, or other real-device
integration was verified or attempted in this slice. The UI remains mock-only.

## Next Candidate

`PAC-IOS-DRAWER-GESTURE-QA` is an `L1` mock-only, narrow runtime-interaction
verification task. It may verify the left-edge drag, overlay tap, and Escape
paths, but must not implement changes unless it first finds a reproducible bug.
