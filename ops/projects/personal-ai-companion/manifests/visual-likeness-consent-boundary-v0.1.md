# Visual Likeness Consent Boundary v0.1

Date: 2026-07-11  
Status: `owner-attested active` for a future local visual-likeness slice

## Record Scope

The project owner attests that the partner whose likeness may be represented
has agreed to use of her visual likeness in this personal AI companion project.
This is an owner-reported attestation, not independently verified consent
evidence. This repository intentionally stores no subject name, image, contact
detail, consent text, or other identifying material.

| Field | Value |
| --- | --- |
| Record ID | `PAC-VLC-20260711-01` |
| Included scope | A future visual-likeness design or asset slice for this personal project |
| Repository identity data | None |
| Repository consent evidence | None; maintained privately by the owner |
| Current implementation status | No likeness asset has been collected, generated, uploaded, or rendered |
| Revocation | The represented person or owner may revoke this attestation at any time |

## Boundaries That Remain Separate

This attestation does not itself authorize:

- voice or vocal-likeness use;
- writing-style, mannerism, biography, relationship-history, or private-chat
  use;
- collection, upload, retention, or training on personal material;
- third-party provider processing or publication; or
- display on a real device, physical output, or any live hardware action.

Each of those areas requires its own bounded task, source-material rules,
retention/deletion treatment, and any applicable L3 gate. The current
non-human SwiftUI companion mark remains a separate local mock and must not be
presented as the partner's likeness.

## Future Visual Asset Intake Gate

Before a future task accepts a visual asset, it must record the minimum
non-identifying operational facts outside this repository as appropriate:

1. the intended visual surface and whether it is local-only or involves a
   provider/device;
2. the owner-approved source-material boundary and allowed derivations;
3. storage, access, retention, deletion, and revocation handling; and
4. a rollback path that removes the resulting local assets without touching
   unrelated memory or device state.

On revocation, stop new use immediately. Any derived assets must be handled by
the scoped deletion/retention plan; this repository retains only this anonymous
boundary record, not the assets or identifying evidence.

## Status Language

Safe wording is: "the owner has attested consent for a future visual-likeness
slice." It is not evidence that voice, text style, private data, real-device
display, or an end-to-end companion likeness feature has been implemented.
