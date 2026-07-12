# StackChan Wire Contract v0.2 Offline Acceptance Runbook

Status: offline DTO and local lifecycle-source acceptance only. Local v0.2
handler routes now exist in product source, but this runbook neither starts nor
contacts a bridge, LAN endpoint, StackChan device, firmware, database,
Keychain, token, or environment file and does not claim those routes are
deployed.

## Purpose And Scope

`stackchan.wire.v0.2` is a closed DTO and canonical-JSON contract for a future
producer and StackChan client. It is a successor contract, not evidence that
the deployed `stackchan.command.v0.1` bridge path transports v0.2 payloads.

This runbook accepts local schema compatibility between the canonical fixture
and the Python and Swift DTO implementations. Separate local source and tests
also cover an in-memory v0.2 enqueue/poll/ack/result lifecycle in
`scripts/stackchan_bridge.py`. That source fact does not authorize deploying or
starting it, writing a queue, making an HTTP request, enabling iOS transport,
controlling a device, transferring media, or field testing.

## Evidence Sources

| Surface | Local evidence | Role in this acceptance |
| --- | --- | --- |
| Prior protocol | `ops/projects/personal-ai-companion/runbooks/stackchan-command-protocol-v0.1.md` | v0.1 has a separate command/event bridge contract; it is not the v0.2 wire transport. |
| Canonical fixture | `projects/products/personal-ai-companion/fixtures/stackchan/wire-contract-v0.2.json` | Only golden input for v0.2 commands, results, and declared rejection cases. |
| Python DTO | `projects/products/personal-ai-companion/src/personal_ai_companion/stackchan/wire_contract.py` | Strict validation, defensive DTO copies, and sorted compact UTF-8 canonical JSON. The module explicitly has no routes, sockets, queues, or iOS transport. |
| Python test | `projects/products/personal-ai-companion/tests/test_stackchan_wire_contract.py` | Fixture version check, DTO canonical round-trip, invalid-case rejection, private speaker rejection, and defensive-copy assertions. |
| Swift DTO | `projects/products/personal-ai-companion/ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Models/StackChanWireContract.swift` | Strict Codable DTO validation and canonical JSON implementation. |
| Swift smoke | `projects/products/personal-ai-companion/ios/PersonalAICompanion/Sources/PersonalAICompanionWireContractSmoke/main.swift` | Reads the same fixture, compares command/result canonical JSON, and requires invalid payloads to fail. |
| Swift package entry | `projects/products/personal-ai-companion/ios/PersonalAICompanion/Package.swift` | Registers only the local `PersonalAICompanionWireContractSmoke` executable target. |
| Local lifecycle source | `projects/products/personal-ai-companion/scripts/stackchan_bridge.py` | Defines authenticated v0.2 capability, enqueue, poll, ack, result-record, and result-read handlers backed by local memory. No accepted deployment or device client is implied. |
| Local lifecycle tests | `projects/products/personal-ai-companion/tests/test_stackchan_v02_bridge_lifecycle.py` | Exercises route authentication, correlation, capacity, poll/ack/result ordering, and protocol separation in process. It does not test a live listener or device. |

## Contract Coverage

Fixture version: `stackchan.wire.fixture.v0.2`.

Protocol version: `stackchan.wire.v0.2`.

The fixture is canonical/golden only when all listed valid payloads round-trip
to exactly the sorted, compact JSON emitted from the fixture payload. It is not
a captured device trace and must not be regenerated from a bridge or device
during offline acceptance.

| Message kind | Golden cases | Covered meaning |
| --- | --- | --- |
| Command | `expression_happy`, `motion_nod`, `action_idle` | Display expression plus bounded motion/action with watchdog idle values. |
| Command | `speak_public_safe_low_volume` | Public-safe speaker output with a maximum volume of 12%; private content is rejected. |
| Command | `camera_single_low_resolution` | One owner-private low-resolution capture request, 320x240 maximum, metadata-only result contract, no upload. |
| Command | `status_minimal` | Device status request for battery, network, and firmware. |
| Result | `expression_ack` | `ack` outcome `ok`, with acknowledged command type and result code. |
| Result | `status_result` | `status` outcome `ok`, with bounded status metadata. |
| Result | `camera_capture_result_metadata_only` | `camera_capture` outcome `ok`, with capture id, dimensions, media type, and expiry only; no bytes or URL. |
| Result | `camera_error` | `error` outcome for unavailable capture with bounded code and retryability. |

The negative golden cases must reject: speaker volume above the cap, a numeric
float volume, raw PWM motion, camera-result media leakage, non-positive TTL,
and a timestamp outside the JSON safe-integer range.

## State Vocabulary And Current Boundary

| State | Definition | v0.2 status evidenced by this runbook |
| --- | --- | --- |
| `defined` | Schema, constraints, and fixture are present in source. | Confirmed for the fixture plus Python and Swift DTOs. |
| `mock` | A local preview/test double exercises intent without a transport or device. | No v0.2 transport mock is accepted here. The Swift command-preview types are not proof of v0.2 transport. |
| `offline-tested` | The exact local DTO and lifecycle tests exit successfully against synthetic fixtures and in-process handlers. | Confirmed locally; no live listener or device is contacted. |
| `wired` | A concrete production path serializes, sends, receives, and consumes v0.2 DTOs. | Not evidenced. Handler routes exist in source, but no accepted deployment, v0.2 device client, iOS transport, or field path is claimed. |
| `field-confirmed` | A real device executes the wired path and records bounded, reviewable evidence. | Not evidenced. No LAN or device operation is part of this runbook. |

`defined` and the confirmed `offline-tested` result do not imply `wired` or
`field-confirmed`. In particular, the existing v0.1 bridge/device evidence is
not transferable to v0.2 without a separately approved integration change and
fresh field evidence.

## Strict Offline Procedure

Preconditions:

- Work from the existing local product checkout only.
- Do not start `scripts/stackchan_bridge.py`, do not use a LAN address, and do
  not access a StackChan device or firmware.
- Do not create or alter `.env`, token, Keychain, database, queue, or package
  registration state.
- Keep `fixtures/stackchan/wire-contract-v0.2.json` unchanged while accepting
  the DTOs.

Run the Python assertion suite from the product root:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion
.venv/bin/python -m pytest -q \
  tests/test_stackchan_wire_contract.py \
  tests/test_stackchan_v02_bridge_lifecycle.py
```

Run the Swift fixture smoke from the Swift package root:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/ios/PersonalAICompanion
swift run PersonalAICompanionWireContractSmoke
```

These commands are local schema tests only. They were rerun on 2026-07-13: the
Python wire/lifecycle set passed `13` tests and
`PersonalAICompanionWireContractSmoke` exited zero with
`StackChan wire v0.2 smoke passed`. This confirms only `offline-tested` status.

## Pass And Failure Rules

Mark `offline-tested` only when both commands exit zero and all of the following
hold:

1. Fixture and protocol versions equal `stackchan.wire.fixture.v0.2` and
   `stackchan.wire.v0.2`.
2. Every valid command and result canonicalizes identically in its respective
   Python and Swift verifier.
3. Each declared invalid case is rejected with its fixture-declared error code.
4. The Python private-content speaker rejection and defensive-copy assertions
   pass.
5. No fixture, DTO, Package registration, bridge, or device file is modified
   as part of the run.

Treat any non-zero exit, fixture read failure, canonical JSON mismatch, invalid
payload acceptance, unexpected rejection of a valid fixture, missing local
toolchain/virtual environment, or any modification outside this runbook as a
failure. A failed run remains `defined`; it must not be reported as
`offline-tested`, `wired`, or `field-confirmed`.

## Rollback Limits

This document-only change has one local rollback: delete
`ops/projects/personal-ai-companion/runbooks/stackchan-wire-contract-v0.2.md`.
It does not alter fixture, DTO, package, bridge, service, LAN, firmware,
device, database, secret, or runtime state.

If a later change registers a new Swift Package target or product, the rollback
must be a separate reviewed code change that restores the prior `Package.swift`
registration and any associated source files. Deleting this runbook alone does
not roll back such a registration, nor does it roll back any future bridge or
device integration.

## Next-Stage Repair Gate

The following are outside offline acceptance and require the user to explicitly
say `进入修复阶段` before any execution: deploying or enabling v0.2 bridge routes,
serializing v0.2 DTOs into a queue, enabling iOS/LAN transport, changing
authentication or endpoint configuration, writing device/firmware files,
starting or restarting a service, performing camera/media transfer, or sending
any command to a physical StackChan.

Before that phrase, the permissible next action is read-only review or local
offline DTO testing only. After it, create a scoped L3 repair plan with a
separate rollback record and collect fresh bounded evidence for `wired` and
then `field-confirmed`.
