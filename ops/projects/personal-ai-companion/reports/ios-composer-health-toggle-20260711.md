# iOS Composer Mock Health Toggle Record

Date: 2026-07-11  
Status: `local/mock verified`

## Owned Surface

This record covers the local iOS mock health-toggle change in `ChatView` only.
It records completed local verification; it does not change product code or
broaden the HealthKit, device, network, signing, or hardware surfaces.

## Confirmed Change

The root dynamic-type cap corrected main-page overflow, but the system `Menu`
opened from the composer plus button did not inherit that cap. Its extreme-size
overlay could obscure the composer.

`ChatView` replaced that `Menu`/`Toggle` with a direct, 44 pt mock-only button:

- off state: plus icon;
- on state: `checkmark.circle.fill`;
- disabled unless the local mock health context is enabled; and
- accessible label, hint, and value are present.

The inline mock disclosure remains visible while the toggle is on.

## Local Verification

The following local checks passed:

- `swift build`;
- `AppSupportActionSmoke`;
- `MockSafetySmoke`; and
- local iPhone 17e Simulator coverage at
  `accessibility-extra-extra-extra-large`, in both toggle states.

In those Simulator checks, the composer remained visible and no system popup
appeared.

## Boundaries And Residual Risk

This is mock-only evidence. Scratch evidence existed temporarily under `/tmp`;
it is not claimed as a durable artifact.

An external Mac lock prevented restoration of a local Simulator mock-toggle
state. That state, if still on, exists only in the Simulator and is not real
HealthKit or a state outside it.

No true HealthKit authorization or data access, signing, LAN connection,
hardware interaction, or real-device validation occurred. Those outcomes
remain unconfirmed.

## Rollback / Next Task

No runtime, device, credential, or service state was changed by this evidence
record. Any future HealthKit work needs separately selected scope and explicit
authorization; it must not treat this mock verification as system-permission or
real-data validation.
