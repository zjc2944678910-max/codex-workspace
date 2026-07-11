# Companion Avatar and Persona Boundary

**Status:** proposed local/mock direction only

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/reports/companion-avatar-and-persona-boundary-20260711.md`
  only
- project_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: the owner asked whether the avatar should change and asked for
  an affectionate companion direction; the scoped chat header currently uses a
  generic system mark.
- forbidden_surfaces: product code, all other project docs, real-person
  likeness/portrait/voice, private images, image generation, bridge/device/
  network/credentials, real hardware, Git/GitHub, configuration, deploy, and
  signing.

## Confirmed Source Facts

- `RootView.swift` renders the chat header with the system image
  `sparkles`; its accessibility label is `对话`. It does not render visible
  `AI 伴侣` text in that header.
- `AppSidebarView.swift` currently renders `AI 伴侣` as the drawer heading and
  `本地 mock` beside it.
- `AppNavigationCatalog.swift` makes `chat` the default route and describes
  the current app routes as mock-only metadata.
- The scoped source review found no supplied portrait, name, voice, biography,
  consent record, or real-person visual asset. This is a statement about the
  reviewed header/navigation scope, not a claim about every repository file.

## Design Proposal: Local Companion Mark

Use a small, reusable, non-human companion mark in the chat header and drawer:
two offset four-point glints with a restrained warm/cool accent pair. It should
read as a presence cue rather than a face, portrait, gendered character, or
personality claim. Keep it compact at the existing header scale and retain the
current 44 pt navigation/new-chat controls.

The mark is a local UI treatment only. It has no photograph, face, body,
name, voice, biography, simulated relationship history, or claim to represent
a particular person. Accessibility text should say `本地陪伴标记，非真人头像`.
The drawer may place the same mark before the existing product name so the two
surfaces are visually consistent, while preserving `本地 mock` as the mode
boundary.

No automatic animation, voice, message-content change, memory write, device
command, or persona inference is part of this proposal. Affectionate tone,
when later designed, must remain a product writing choice rather than a claim
to imitate an identifiable individual.

## Later Local Mock Task

`PAC-COMPANION-MARK-LOCAL-MOCK` would be an L1 local-only UI task limited to
these exact candidate files:

- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/CompanionPresenceMark.swift`
  (new reusable non-human SwiftUI mark; no bitmap or generated asset);
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/RootView.swift`;
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/AppSidebarView.swift`.

Acceptance would require the mark to remain non-human and local-only, keep the
chat header free of visible `AI 伴侣` text, preserve the current navigation
behavior and accessibility, respect the existing Dynamic Type cap, and add no
bridge, media, credential, network, HealthKit, or hardware dependency. Local
Simulator visual QA would remain mock evidence only, not physical iPhone or
real-device proof.

## Prohibited and Unconfirmed Areas

No evidence currently establishes a real-person avatar, a partner's identity,
permission to imitate a person, consent to use likeness or voice, or a voice
model. No relationship trait, appearance, name, or preference is inferred by
this record.

Do not use a real person's photo, illustration derived from a person, name,
voice, speech pattern, or biographical detail merely because an affectionate
companion is desired. Do not generate, collect, upload, train on, retain, or
play such material under the local mock task.

## Real Identity or Voice Gate

The separate next step for any real-person direction is
`PAC-COMPANION-IDENTITY-VOICE-INTAKE`, an intake-only task with no asset
processing. Before a later implementation can be scoped, the owner must
explicitly provide or approve all of the following for each person represented:

- the intended identity and whether the result must be recognizably that
  person;
- affirmative consent from the depicted or voiced person for the named app and
  exact visual/voice uses;
- authorized source material and the allowed derivation, storage, access,
  retention, and deletion/revocation rules;
- allowed output surfaces, sharing limits, and any restrictions on imitation;
  and
- the intended technical path, including whether any provider upload, account,
  device microphone/speaker, or real hardware is involved.

Any later task that processes identity material, uses a voice provider, changes
live configuration, or drives a real speaker/device must be separately risk
classified and explicitly authorized. If it reaches live state or hardware, it
is at least L3 and remains outside this record.
