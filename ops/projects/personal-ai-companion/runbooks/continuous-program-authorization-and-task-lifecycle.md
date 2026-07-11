# Personal AI Companion Continuous Program Authorization And Task Lifecycle

Date: 2026-07-11
Status: active program-control runbook, synchronized after bounded hardware field verification

## Scope And Source Of Truth

This runbook controls only the `personal-ai-companion` program surface. It
aligns current ops facts with the master-directed program and does not replace
task-specific Route Locks, repair gates, or safety review.

- Master task thread: `019f4c90-d7a0-7be0-a167-3a07838aa68c`
- Inherited evidence: StackChan hardware audit, iOS mock implementation/QA,
  StackChan preflight, HealthKit audit, the earlier L3-S1 screen transaction,
  and the later bounded hardware field verification in task
  `019f4fc2-69ac-7532-bc63-e35b1323ccd5`.
- Historical reports/manifests may retain prior claims. This runbook's dated
  fact table and explicit status vocabulary control current planning.

## Evidence And Status Vocabulary

Use exactly one primary status for each stated result. A later status may be
added only with evidence for that exact result.

| Status | Meaning | Insufficient evidence |
| --- | --- | --- |
| `planned` | Defined scope; no qualifying execution evidence. | A design, TODO, or prior authorization. |
| `local/mock verified` | Local source, simulator, fixture, or mock test passed without a live target. | Real device, live network, system permission, or physical observation. |
| `producer accepted` | The local producer generated an accepted bounded output. | Device receipt, device ack, or physical effect. |
| `device-ack verified` | The intended device/result protocol produced a matching acknowledgement. | Human observation of the requested physical/display effect. |
| `field-confirmed` | The intended effect was physically observed in the specified field context. | A producer result or protocol acknowledgement alone. |
| `blocked` | A required dependency, authority, safety gate, or contradiction prevents work. | Mere preference to defer. |

### Current Fact Table

| Area | Current status | Confirmed evidence | Unconfirmed boundary |
| --- | --- | --- | --- |
| StackChan screen | `field-confirmed` | The manual Bridge/device path recorded enqueue, device poll, matching `result=ok`, and owner-observed `PAC Expression / happy`. | The iOS App and mock App adapter did not drive it; native avatar rendering, continuous boot polling, and repeated reliability remain unconfirmed. |
| StackChan audio | `field-confirmed` | The owner heard the bounded public-safe phrase `测试成功`; the run recorded `result=ok`, used runtime volume `40/255`, then stopped and muted output. | This is not a general volume policy, microphone result, repeated-play reliability result, or iOS voice path. |
| StackChan X/Y servos | `field-confirmed` | Each axis completed one low-speed movement of about `+5 degrees -> original position`, with owner observation; torque and power were disabled afterward. | The check used the direct official device driver, not the v0.1 placeholder or App adapter. A full calibrated motion envelope, endurance, and autonomous control remain unconfirmed. |
| StackChan head touch | `field-confirmed` | Direct sampling observed press/release across all three zones and returned to `[0, 0, 0]`. | No device-to-Bridge event, App consumption, deduplication, or App reaction was verified. |
| StackChan camera | `field-confirmed` | One local `160x120` JPEG frame was captured, inspected locally, removed from the temporary path, and the camera was deinitialized. | The owner did not see an indicator, so whether a visible activity indicator activated is unverified. No App/Bridge camera command, retention workflow, repeated capture, or external transfer was verified. |
| StackChan App/adapter integration | `blocked` | The authenticated Bridge and bounded device/manual execution paths have real evidence. | The iOS App, `pac.app_bridge.v0.1`, and the future StackChan App adapter did not drive the accepted hardware checks. `App -> Bridge -> StackChan -> device` remains unverified and requires a separate design, gate, and rollback. |
| iOS mock UX | `local/mock verified` | Mock-only package/smoke evidence and an unsigned local Simulator Host pass are recorded. | Signing, provisioning, real device, live LAN, Keychain, and StackChan integration remain unconfirmed. |
| iOS real integration | `blocked` | Pre-live contracts preserve mock fallback. | Explicit owner decisions and a bounded L3 slice are required. |
| HealthKit | `blocked` | Mock permission and design-time rollback/scope evidence exist. | System consent, entitlement/signing, and real health data collection are unconfirmed and prohibited here. |
| Memory/privacy | `local/mock verified` | Local design and readiness documentation exist. | Raw private-data inspection/export, runtime data/schema change, and real migration require a separate authorized scope. |
| Style/persona | `local/mock verified` | Local synthetic style mechanisms/evaluations are historical evidence. The owner has attested consent for a future visual-likeness slice; no identifying material is tracked. | Voice, writing style, private chats, provider upload, real-device display, revocation handling, and private-data boundaries remain separate gates. |

## Time-Bounded Authorization Ledger

### Delegated Program Authority

| Field | Value |
| --- | --- |
| Granted by | Current master direction only. |
| Valid until | `2026-07-11T11:22:52+08:00` |
| Scope | Per-task, repair-gated, bounded local/lab execution under the current master. |
| Start condition | The task verifies that the expiry has not passed, records its Route Lock, and passes every listed manual gate. |
| Expiry action | Stop before any state-changing step; report `blocked` to the master and request renewed explicit authority. |

This authorization does **not** pre-authorize:

- app signing, provisioning, or App Store submission;
- external deployment or Git/GitHub action;
- creation, export, rotation, or disclosure of real credentials;
- raw private-data export or permanent destructive deletion;
- HealthKit system consent or collection of real health data;
- identity/personality imitation based on unapproved private material; or
- uncontrolled physical motion, camera capture, or audio outside a separately
  scoped safety slice.

### Completed Task-Specific Hardware Authority

The later hardware field-verification task is a completed historical execution,
not an extension of the expired delegated program window.

| Field | Value |
| --- | --- |
| Source task | `019f4fc2-69ac-7532-bc63-e35b1323ccd5` |
| Entry and gates | The owner explicitly entered the repair phase in that task and then provided the sequential confirmations used for its bounded screen, audio, servo, touch, and camera checks. |
| Executed scope | Only the checks and recovery actions recorded in [the field-verification report](../reports/stackchan-hardware-field-verification-20260711.md). |
| Terminal state | Authority consumed and closed after the recorded queue-`0`, servos-off, camera-off, audio-muted, serial-closed safe state. |
| Reuse | Prohibited. A repeat, expansion, or App end-to-end execution requires a fresh task-specific L3 gate and new explicit authorization. |

## Mandatory Task Protocol

Every future task, including documentation synchronization, must state its
risk level, rationale, execution strategy, and one Route Lock before work.
Each implementation task owns one unique, non-overlapping surface only.

Required task packet:

```yaml
task_id: PAC-<area>-<slice>
risk_level: L0 | L1 | L2 | L3
route_lock:
  target_project: personal-ai-companion
  target_surface: one bounded surface
  project_root: projects/products/personal-ai-companion
  route_evidence: explicit master/user request and current queue item
  forbidden_surfaces: all non-owned code, data, devices, services, and credentials
reason: why this exact slice is needed now
acceptance_criteria: observable and bounded
risk: failure and privacy/safety impact
rollback: exact reversible action or explicit no-change proof
verification: evidence needed for the claimed status
expiry_check: before each state-changing step for L3
no_scope_expansion_stop: stop on new surface, ambiguity, or contradictory evidence
```

Additional mandatory constraints:

- L2 remains read-only. L3 begins only after the user explicitly says
  `进入修复阶段` for the intended state-changing slice.
- A task must not read raw private data, credentials, device identifiers, or
  endpoint details unless its Route Lock expressly permits the minimum needed
  evidence and the master has authorized it.
- A task report is compact: status, owned files/surface, evidence/checks,
  blockers, rollback/no-change statement, residual risk, and best next task.
- Contradictory evidence overrides optimistic inference. Stop and report
  `blocked`; do not silently change targets or broaden scope.

## Completion Callback To The Master

Local L0/L1 task slices default to bounded internal subagents. Each subagent
returns exactly one terminal compact report to the master through the
collaboration channel when its assigned slice finishes. Do not create a
separate task thread solely to deliver this completion callback.

Required payload fields: `status`, `task_id`, `owned_surface`, `verification`,
`blockers`, and `best_next_task`. Do not send progress callbacks or repeated
status updates. Do not create a per-task automation or heartbeat. The master
waits for the terminal return, then performs one read-only acceptance pass; it
does not repeatedly poll task status.

This coordination rule does not change any safety boundary: Route Locks remain
mandatory, L2 remains read-only, and L3 still requires its explicit manual
repair authority and task-specific gates. An internal subagent receives only
its assigned bounded scope; it never gains broad live-repair authority.

## Non-Overlapping Next-Task Queue

The listed order is dependency order, not permission to start all work at once.
`PAC-DOCS-SYNC` must be completed before every implementation wave. The earlier
standalone screen, audio, servo, touch, and camera slices are completed evidence
and are no longer pending queue items. Repeating them is new L3 work, not a
continuation of the completed session.

| Order | Task ID | Level | Scope and dependencies | Manual gates / owned surface |
| --- | --- | --- | --- | --- |
| 0 | `PAC-DOCS-SYNC` | L1 | Precedes every implementation wave; reconcile current facts, ledger, and queue. | Documentation-only Route Lock; assigned ops docs only. |
| 1 | `PAC-IOS-MOCK-UX-CLOSEOUT` | L1 | Review and checkpoint the current mock-only iOS work before any real integration design. | SwiftUI/package and local tests only; no network, credential, signing, system permission, or hardware action. |
| 2 | `PAC-IOS-REAL-INTEGRATION-PREFLIGHT` | L2 | Requires accepted mock UX and a read-only mapping of LAN transport, protocol translation, credentials, signing, and rollback. | Read-only evidence and design only; no Bridge/device request or credential read. |
| 3 | `PAC-IOS-STACKCHAN-SCREEN-E2E` | L3 | Requires completed preflight, renewed explicit authorization, and a fresh one-capability safety/rollback packet. | One `App -> Bridge -> StackChan -> LCD` path; preserve mock fallback; no automatic expansion to audio, servo, touch, or camera. |
| 4 | `PAC-HEALTHKIT-SCOPE` | L3 | Requires explicit owner-selected categories, consent copy, minimization, and revocation/rollback plan. | Explicit repair gate; one system authorization/collection slice; no medical inference expansion. |
| 5 | `PAC-MEMORY-PRIVACY` | L1/L3 | L1 only for isolated code/test/docs with temporary data; L3 for existing data, schema, migration, or runtime state. | One named memory policy/migration surface; no raw private export. |
| 6 | `PAC-STYLE-PERSONA` | L1 | Requires documented consent, revocation, approved-source boundary, and a synthetic evaluation plan. | One local rule/evaluation surface; no unapproved-person imitation. |

## Stop Rules

Stop immediately and send the single terminal callback with `blocked` when any
of these happens:

1. The authorization expiry has passed, or an L3 state-changing step cannot
   prove the fresh expiry check.
2. The task needs an unlisted surface, private data, credential, device detail,
   service action, signing/provisioning, deployment, or physical capability.
3. Evidence contradicts the selected task's status, dependency, or safety
   assumption.
4. A required manual gate, rollback path, verification target, or master
   selection is missing.

The next action after a stop is documentation synchronization and a master
decision, not speculative repair.
