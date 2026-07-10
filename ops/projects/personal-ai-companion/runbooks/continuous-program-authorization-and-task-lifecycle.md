# Personal AI Companion Continuous Program Authorization And Task Lifecycle

Date: 2026-07-10  
Status: active program-control runbook

## Scope And Source Of Truth

This runbook controls only the `personal-ai-companion` program surface. It
aligns current ops facts with the master-directed program and does not replace
task-specific Route Locks, repair gates, or safety review.

- Master task thread: `019f4c90-d7a0-7be0-a167-3a07838aa68c`
- Inherited evidence: StackChan hardware audit, iOS mock implementation/QA,
  StackChan preflight, HealthKit audit, and L3-S1 screen transaction as named
  by the master assignment.
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
| StackChan display | `producer accepted` | L3-S1 accepted one neutral-expression producer. | Device ack and field observation remain unconfirmed; never call it a screen repair. |
| StackChan broader capability | `planned` | Earlier reports are historical protocol/repair evidence only. | Audio, motion/servo, touch, camera, boot behavior, and renewed live execution need their own slices. |
| iOS mock UX | `local/mock verified` | Mock-only package/smoke evidence and an unsigned local Simulator Host pass are recorded. | Signing, provisioning, real device, live LAN, Keychain, and StackChan integration remain unconfirmed. |
| iOS real integration | `blocked` | Pre-live contracts preserve mock fallback. | Explicit owner decisions and a bounded L3 slice are required. |
| HealthKit | `blocked` | Mock permission and design-time rollback/scope evidence exist. | System consent, entitlement/signing, and real health data collection are unconfirmed and prohibited here. |
| Memory/privacy | `local/mock verified` | Local design and readiness documentation exist. | Raw private-data inspection/export, runtime data/schema change, and real migration require a separate authorized scope. |
| Style/persona | `local/mock verified` | Local synthetic style mechanisms/evaluations are historical evidence. | No real-person imitation from unapproved private material; consent/revocation and private-data boundaries remain required. |

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

Each future task sends exactly one terminal compact callback using
`codex_app__send_message_to_thread` to master thread
`019f4c90-d7a0-7be0-a167-3a07838aa68c`.

Required payload fields: `status`, `task_id`, `owned_surface`, `verification`,
`blockers`, and `best_next_task`. Do not send progress callbacks or repeated
status polling. Do not create task-owned recurring automation. The parent
master owns the single-use automation fallback.

## Non-Overlapping Next-Task Queue

The listed order is dependency order, not permission to start all work at once.
`PAC-DOCS-SYNC` must be completed before every implementation wave. Start the
first eligible item only after the master selects it and confirms its gates.

| Order | Task ID | Level | Scope and dependencies | Manual gates / owned surface |
| --- | --- | --- | --- | --- |
| 0 | `PAC-DOCS-SYNC` | L1 | Precedes every implementation wave; reconcile current facts, ledger, and queue. | Documentation-only Route Lock; assigned ops docs only. |
| 1 | `PAC-STACKCHAN-ACK-DIAG` | L2 | Requires L3-S1 producer evidence; read-only investigation of missing display acknowledgement. | No device write/restart; acknowledgement evidence only. |
| 2 | `PAC-STACKCHAN-AUDIO` | L3 | Requires docs sync, review of diagnostics, fresh expiry check. | Explicit repair gate; one bounded audio route with mute/stop rollback. |
| 3 | `PAC-STACKCHAN-MOTION` | L3 | Requires audio outcome review and an explicit physical safety envelope. | Explicit repair gate; one servo/motion mapping, neutral-position rollback, no uncontrolled motion. |
| 4 | `PAC-STACKCHAN-TOUCH` | L3 | Requires motion safety outcome and a single input behavior specification. | Explicit repair gate; one touch event path, no command fan-out. |
| 5 | `PAC-STACKCHAN-CAMERA` | L3 | Requires explicit capture consent, visible indication, retention/deletion policy. | Explicit repair gate; one camera path, no unbounded capture/export. |
| 6 | `PAC-IOS-MOCK-UX` | L1 | Independent of live StackChan work but still follows docs sync. | Mock-only SwiftUI/package UI; no network, credential, signing, or system permission surface. |
| 7 | `PAC-IOS-REAL-INTEGRATION` | L3 | Requires accepted mock UX and named decisions for LAN, credential storage, signing, and rollback. | Explicit repair gate; one real integration seam; preserve mock fallback. |
| 8 | `PAC-HEALTHKIT-SCOPE` | L3 | Requires explicit owner-selected categories, consent copy, minimization, and revocation/rollback plan. | Explicit repair gate; one system authorization/collection slice; no medical inference expansion. |
| 9 | `PAC-MEMORY-PRIVACY` | L1/L3 | L1 only for isolated code/test/docs with temporary data; L3 for existing data, schema, migration, or runtime state. | One named memory policy/migration surface; no raw private export. |
| 10 | `PAC-STYLE-PERSONA` | L1 | Requires documented consent, revocation, approved-source boundary, and a synthetic evaluation plan. | One local rule/evaluation surface; no unapproved-person imitation. |

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
