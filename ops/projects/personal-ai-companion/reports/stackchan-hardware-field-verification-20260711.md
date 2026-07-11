# StackChan Hardware Field Verification - 2026-07-11

Status: accepted field evidence for bounded standalone hardware checks.

## Evidence Source

- Completed task: `codex://threads/019f4fc2-69ac-7532-bc63-e35b1323ccd5`
- Verification date: 2026-07-11
- Target: the local StackChan device and authenticated local Bridge used by the
  `personal-ai-companion` project.
- This report is a documentation closeout from the completed task. It did not
  repeat a device, Bridge, serial, camera, audio, or motion operation.

## Accepted Results

| Capability | Accepted evidence | Primary status | Boundary |
| --- | --- | --- | --- |
| Screen | A bounded `happy` expression was enqueued, polled by the device, acknowledged with a correlated `result=ok`, and visibly displayed as `PAC Expression / happy`. | `device-ack verified` and `field-confirmed` | This verifies the manual `Bridge -> v0.1 device polling client -> LCD` path, not the iOS App, the mock App adapter, boot-time continuous polling, or a native avatar renderer. |
| Audio | The public-safe phrase `测试成功` was generated and played through the Bridge/device path. The owner heard it. The successful run used runtime volume `40/255`, returned `result=ok`, then executed stop and mute. | `device-ack verified` and `field-confirmed` | This is one bounded playback result, not an approved general volume policy, repeated-play reliability result, microphone result, or iOS voice path. |
| X/Y servos | Each axis completed one low-speed movement relative to its measured position, approximately `+5 degrees -> original position`, and the owner observed movement and return. Torque was disabled and servo power was removed afterward. | `field-confirmed` through the direct official device driver | This was not the v0.1 placeholder `motion/action`, the v0.2 App adapter, a calibrated full motion envelope, endurance testing, or autonomous motion. An earlier pre-action position read returned no value, so that attempt stopped before torque or movement; later repeated reads stabilized and the two accepted actions completed and returned. Future control must retain this fail-closed pre-read gate. |
| Three-zone head touch | Direct sampling observed press and release states across the three touch zones, including single and combined contacts, and returned to `[0, 0, 0]`. | `field-confirmed` sensor input | This does not prove a device-to-Bridge touch event, App consumption, deduplication, or an App reaction. |
| Camera | One `160x120` JPEG frame was captured successfully (`1610` bytes), inspected locally, then removed from the local temporary path. The camera was deinitialized. | `field-confirmed` bounded direct capture | No third-party upload or device-flash persistence was reported. The owner did not see an indicator during the bounded checks, so whether a visible activity indicator activated is unverified. This does not prove an App/Bridge camera command path or retention workflow. |

## Final Safety State

The completed task's final read-only health check reported:

- Bridge healthy;
- command queue depth `0`, with no pending command;
- servo torque disabled and servo power off;
- camera deinitialized/off;
- audio stopped and muted;
- serial session closed.

Serial closure is session-scoped. The verification made no persistent serial
access-control or lock change.

This safe-state record is the end state of that completed verification session.
It is not permission to repeat any hardware action.

## Explicitly Not Proven

- `iOS App -> Bridge -> StackChan -> device` end-to-end integration;
- a real `LANBridgeClient`, credential/Keychain path, signing, or real-iPhone
  operation;
- the current mock-only `pac.app_bridge.v0.1` or StackChan App adapter driving
  any of these physical results;
- continuous boot-time command polling, unattended operation, stress testing,
  long-duration reliability, or recovery after arbitrary failure;
- whether a visible camera activity indicator activated;
- HealthKit, real memory data, NAS, VPS, or production deployment.

The earlier producer-only and acknowledgement-diagnostic reports remain valid
records of their earlier bounded windows. Their current-status conclusions are
superseded by this later field evidence. Any repeat, expansion, or end-to-end
hardware execution requires a new task-specific L3 gate and fresh explicit
authorization.

## Prior Reports And Revalidation

This record updates the current-status conclusion of these earlier bounded
records without rewriting what each task observed at its own time:

- [StackChan acknowledgement diagnostic](stackchan-ack-diagnostic-20260710.md)
- [StackChan screen mock pages](stackchan-screen-mock-pages-20260711.md)
- [StackChan screen mock pages design](stackchan-screen-mock-pages-design-20260711.md)
- [iOS touch-reaction mock design](ios-touch-reaction-mock-design-20260711.md)

The accepted statuses are point-in-time evidence. A firmware, device-driver,
hardware wiring, servo calibration, Bridge protocol/client, or relevant safety
configuration change invalidates reuse of the affected result until a fresh,
task-specific L3 verification is authorized and completed.
