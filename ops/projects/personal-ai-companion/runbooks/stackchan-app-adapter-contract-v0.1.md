# StackChan App Adapter Contract v0.1

Status: L1 local design contract only. This document defines a future
Bridge-to-StackChan app-adapter boundary; it neither enables nor validates a
device capability.

## Route Lock

```yaml
task_id: PAC-CONTRACT-BRIDGE-STACKCHAN-V1
risk_level: L1
route_lock:
  target_project: personal-ai-companion
  target_surface: ops/projects/personal-ai-companion/runbooks/stackchan-app-adapter-contract-v0.1.md
  project_root: projects/products/personal-ai-companion
  route_evidence: explicit PAC-CONTRACT-BRIDGE-STACKCHAN-V1 assignment
  forbidden_surfaces: bridge, device, network commands, tokens, service restart, firmware, configuration, Git, GitHub
reason: define a bounded capability and lifecycle contract before any future L3 integration
rollback: delete this document only; no runtime state exists to roll back
verification: read-only source and runbook cross-check; no product test, bridge, device, or network operation
```

## Authority And Evidence Boundary

The active program-control runbook is the authority for current status. Its
dated fact table overrides optimistic wording in historical reports or static
source. In particular, a schema, fixture, mock, local unit test, or historical
repair record is not a device acknowledgement or a physical observation.

| Capability | Current primary status | Confirmed boundary | Not permitted to claim |
| --- | --- | --- | --- |
| Screen | `producer accepted` | One bounded neutral-expression producer request was accepted. | That the device polled, acknowledged, or displayed it; that the screen is repaired. |
| Audio | `planned` | No current capability acceptance. | Playback, mute/stop behavior, or hardware acknowledgement. |
| Motion | `planned` | No current capability acceptance. | Servo movement, safe range, neutral return, or hardware acknowledgement. |
| Touch | `planned` | No current device-event acceptance. | Sensor input, bridge delivery, or an app reaction caused by hardware. |
| Camera | `planned` | No current capability acceptance. | Capture, indication, retention/deletion, media transfer, or hardware acknowledgement. |

`producer accepted` is producer-side evidence only. It is weaker than
`device-ack verified`, which is weaker than `field-confirmed`. The current
acknowledgement diagnostic saw no matching device poll or acknowledgement in
its bounded passive window; it established no root cause.

All non-screen rows are future L3 work. They require a separately scoped task,
an explicit `进入修复阶段` gate, a fresh safety and rollback plan, and new evidence.
Nothing in this document authorizes a producer send, poll, acknowledgement,
firmware change, service action, or hardware test.

## Contract Scope And Version Boundaries

The app adapter is the future local boundary between an application producer
and the Bridge. It normalizes capability intent, correlation, TTL, and evidence
without silently treating the two existing protocol families as equivalent.

| Surface | What local evidence establishes | What it does not establish |
| --- | --- | --- |
| `pac.app_bridge.v0.1` | A separate App-to-Bridge, offline-mock envelope with app acknowledgement, safe fallback, and no local-network dispatch. | A device command, device acknowledgement, or a transport mapping to this adapter. |
| `stackchan.command.v0.1` / `stackchan.event.v0.1` | A local command/event grammar and in-memory or optional durable queue semantics. | Current device capability or a transport rule for v0.2 DTOs. |
| `stackchan.wire.v0.2` DTOs | Strict offline schemas for `expression`, `motion`, `action`, `speak`, `camera_capture`, and `status`, plus result schemas. | A wired route, queue, client, device acknowledgement, or field result. |
| Static v0.2 lifecycle source | A local-memory reference lifecycle whose capabilities are explicitly reported as `declared`. | TTL enforcement, durable delivery, a current accepted integration, or hardware behavior. |
| iOS previews, mocks, fixtures, and historical records | Local/mock or historical design evidence only. | A real StackChan screen, speaker, servo, sensor, or camera result. |

The future adapter MUST record the selected protocol version and queue mode on
every lifecycle record. It MUST NOT inherit v0.1 delivery rules for a v0.2 DTO,
or infer that a v0.2 schema type has a physical implementation.

A future L3 mapping must first preserve the App-to-Bridge contract's
mock-only/no-network gate until that gate is separately replaced. Its app
acknowledgement remains distinct from a device poll/ack/result; the two may be
correlated later but must never be treated as the same evidence. The App
contract's ingress TTL is also a separate record from any selected device queue
TTL until a future mapping explicitly defines their relationship.

## Common Correlation Contract

The following fields form the minimum future adapter record. Existing v0.1 and
v0.2 schemas use different exact envelopes; this is a normalized adapter record
and is not an instruction to change either schema today.

| Field | Rule |
| --- | --- |
| `command_id` | Immutable command correlation identifier. It is never reused while an active record, completion tombstone, or evidence retention record exists. |
| `idempotency_key` | Stable producer retry key. The same key with the same canonical intent returns the original command identity and terminal state. The same key with different intent is a conflict. |
| `capability` | One of `screen`, `audio`, `motion`, `camera`, or the inbound-only `touch`. A command cannot fan out across capability classes. |
| `target_device_id` | Must match the receiving device identity in a poll, ack, result, or event. |
| `created_at_ms`, `ttl_ms`, `expires_at_ms` | Bridge-validated timing. For a v0.2 command, retain the closed rule `expires_at_ms = created_at_ms + ttl_ms`. |
| `attempt_id` | Distinguishes a delivery attempt from the command identity. It is mandatory when a queue lease/redelivery model is used. |
| `protocol_version`, `queue_mode` | Mandatory evidence context; values such as v0.1 in-memory, v0.1 durable, or v0.2 local-memory must not be conflated. |
| `evidence_stage` | One of `producer_accepted`, `polled`, `acked`, `result_recorded`, `expired`, `cancelled`, or `dead_letter`; it is not a field-confirmation label. |

All future capability commands in this adapter contract require an
acknowledgement. Existing v0.1 `requires_ack=false` behavior is not a valid
shortcut for these capabilities.

### Future Stop Control

Stop or rollback is an adapter control intent, not a currently implemented
wire message. A future L3 slice must version and implement it explicitly.

```json
{
  "control_id": "ctl_<unique>",
  "operation": "stop",
  "capability": "audio|motion|screen|camera",
  "target_command_id": "cmd_<existing>",
  "reason": "owner_cancel|safety_timeout|rollback",
  "idempotency_key": "stable-control-key"
}
```

This is a control-plane shape only. It must not be sent to the current bridge
or device. Before an L3 implementation, it needs an exact protocol mapping,
device-side effect, acknowledgement/result rules, and a tested rollback path.
For `touch`, stop means canceling or ignoring the local consumer action; a
producer must not issue a physical command merely to suppress an input event.

## Target Lifecycle

### Command State Machine

The target lifecycle separates producer acceptance, transport receipt, and
execution evidence. A capability never advances its program status merely
because it reaches a later internal state.

```text
created
  -> validated
  -> producer_accepted              (producer-side evidence only)
  -> queued
  -> pending
  -> polled [-> leased when durable]
  -> acked
  -> result_recorded
  -> completed | partial | rejected

queued | pending | polled | leased | acked
  -> expired

queued | pending | polled | leased
  -> cancelled | superseded | dead_letter

polled | leased
  -> pending                        (only a redeliverable capability, before TTL)
```

`leased` applies only when the selected queue implementation supports leases:
the local v0.1 durable queue does, while the static v0.2 local-memory reference
lifecycle does not. That v0.2 reference also has no clock-based TTL expiry
enforcement; the state machine's TTL checkpoints apply only to a future adapter
that implements this full contract.

| State | Meaning | Required evidence / rule |
| --- | --- | --- |
| `producer_accepted` | The application producer accepted the bounded intent. | Does not prove the Bridge stored it, the device polled, or the device acted. This is the current screen ceiling. |
| `queued` / `pending` | The adapter accepted one canonical command and made it eligible for delivery. | Record `command_id`, idempotency identity, timing, capability, protocol version, and queue mode without sensitive body content. |
| `polled` | The Bridge returned the command to the matching device identity. | Record poll time and attempt identity. It is not an acknowledgement. |
| `leased` | A durable queue assigned an active lease to the matching device. | Record lease expiry and attempt. This state only applies when durable mode is selected. |
| `acked` | A valid, correlated acknowledgement was received. | Require command ID, device ID, protocol-compatible ack/result ID, and active lease where durable mode requires one. It proves protocol receipt, not physical effect. |
| `result_recorded` | A valid, correlated execution result was stored. | Preserve bounded metadata and outcome. A result may be `ok`, `partial`, `rejected`, `expired`, or `error`; it is still not field observation. |
| `completed` / `partial` / `rejected` | Terminal result interpretation. | A capability-specific result must state the applied scope or rejection reason. No terminal result upgrades to `field-confirmed` without physical observation. |
| `expired` | TTL won before a valid terminal completion. | No later poll, retry, or success transition is allowed. Late evidence is retained only as a diagnostic record. |
| `cancelled` / `superseded` | A future, valid stop or newer screen command ended pending work. | The adapter records the control correlation and whether device-side stop was actually acknowledged. |
| `dead_letter` | A durable or policy terminal failure ended the command. | Preserve the bounded reason, not body content or media. |

`ack` and `result` are deliberately distinct concepts. A v0.1 acknowledgement
can carry its terminal outcome. A v0.2 acknowledgement and a non-ack result
can be separate records. The adapter must preserve their arrival order and
protocol version. A matching ack never substitutes for a field observation.

### Inbound Touch Event Lifecycle

Touch is device-to-Bridge input, not an app-to-device command. Its target
lifecycle is separate to prevent accidental command fan-out:

```text
device event created
  -> bridge validates event_id and device identity
  -> bridge deduplicates within bounded retention
  -> event recorded
  -> app consumes or explicitly ignores it
  -> optional protocol receipt acknowledgement
  -> retained diagnostic record expires
```

Every distinct physical touch, if a future device path exists, needs a unique
`event_id`; duplicate delivery of the same ID is a no-op. Identical gesture
values with different event IDs are distinct events. Debounce timing, event
retention, and any user-visible reaction remain future L3 design choices. An
inbound touch event must not automatically enqueue audio, motion, camera, or
screen work.

## TTL, Lease, Ack, And Result Rules

### Timing And Expiry

1. A v0.2 command's `ttl_ms` is structurally bounded to 1,000 through 30,000
   ms, and `expires_at_ms` must equal `created_at_ms + ttl_ms`. The current
   DTO validation establishes these field constraints only.
2. The future adapter MUST check expiry at enqueue, before poll, before lease
   renewal/requeue, and before accepting a terminal transition. The current
   v0.2 local-memory reference lifecycle does not perform this clock-based
   expiry maintenance, so it is not sufficient evidence of this rule.
3. A command that is already expired is rejected or terminally recorded as
   `expired`; it must not be returned by poll. Expiry wins over pending,
   polled, and leased states.
4. An acknowledgement or result arriving after expiry is a `late_ack` or
   `late_result` diagnostic. It must not revive the command, consume a retry,
   or be counted as a successful capability execution.
5. `camera_capture` media metadata may advertise an expiry no later than
   60,000 ms after completion under the v0.2 schema. The current contract is
   metadata-only and does not authorize media bytes, URLs, or transfer.

### Delivery And Retry

| Capability | Future delivery rule | Retry / replay rule |
| --- | --- | --- |
| Screen | One ordered expression request at a time per device. | Redelivery may be allowed only before TTL and only when the adapter records the same command and sequence order. A newer superseding screen command must prevent an older pending expression from being delivered later. |
| Audio | At-most-once physical delivery. | Never automatically replay after a poll/lease or lost ack. A lost ack produces delivery uncertainty, not a second utterance. |
| Motion | At-most-once physical delivery. | Never automatically replay after a poll/lease or lost ack. A duplicate mechanical action is unsafe until a separately reviewed mechanical envelope proves otherwise. |
| Touch | At-least-once transport delivery to the app is acceptable only with event-ID deduplication. | A duplicate event ID is a no-op. No physical command retry follows a touch event. |
| Camera | At-most-once capture attempt. | Never automatically issue a second physical capture after poll/lease or lost ack. A retry needs a new owner-authorized command identity. |

This is consistent with the local durable-queue safety split that currently
classifies `status` and `expression` as redeliverable and `speak`, `motion`,
`action`, `servo`, and `camera` as at-most-once. That local classification is
not hardware validation. The naming difference between v0.2 `camera_capture`
and the durable queue's `camera` must be explicitly reconciled in a future L3
implementation rather than assumed equivalent.

### Ack And Result Correlation

1. The adapter MUST require a matching `command_id` and device identity for an
   ack or result. A result type that represents a command-specific outcome
   must also match the command capability/type.
2. Durable mode additionally requires the active `lease_id` and lease owner.
   A stale, missing, or wrong lease is a conflict, not a completion.
3. Repeating the exact same valid acknowledgement/result ID for the same
   command is idempotent and returns the original terminal state with a
   duplicate marker. Reusing that ID for another command is a conflict.
4. A non-ack result may be recorded before or after an ack only when the
   underlying protocol permits it; the adapter records the observed order.
   Completion claims require the capability's required ack condition as well
   as the result. A v0.1 ack-with-outcome is recorded as both receipt and
   terminal outcome.
5. `/events`-style device event receipt is not a substitute for a command
   acknowledgement. This is a confirmed diagnostic boundary, not a proposal.

## Capability Matrix

The request shapes below are schema mappings or future adapter requirements,
not commands that have been sent or accepted by hardware.

| Capability | Direction and normalized request | Stop / rollback requirement | Idempotency and evidence requirement | Current status |
| --- | --- | --- | --- | --- |
| Screen | App -> Bridge -> device. Candidate v0.2 `expression` with `delivery.channel=display`, bounded name/duration; the accepted historical producer used a neutral expression. | Future control intent returns the display to `neutral`; a newer screen intent may supersede only an undelivered older one. No device-side rollback is currently confirmed. | Same canonical intent/key deduplicates. Record producer, poll, ack, result, and any physical observation separately. | `producer accepted` only. |
| Audio | App -> Bridge -> device. Candidate v0.2 `speak` with `delivery.channel=speaker`; public-safe privacy, text, language, interrupt, and capped volume are schema constraints. | Future scoped audio stop/mute must halt the active utterance and report whether it was applied. Partial playback is not reversible. | At-most-once after delivery begins; never replay on lost ack. Audio evidence must not expose spoken private text. | `planned`, future L3 only. |
| Motion | App -> Bridge -> device. Candidate v0.2 `motion` with high-level action, bounded repeat, and watchdog idle; raw PWM is not valid v0.2 input. | Future stop must halt active motion and then request a pre-calibrated neutral pose. The safety envelope, range, rate, and neutral calibration are not yet defined. | At-most-once after delivery begins; never replay on lost ack. Evidence requires safety interlock state and a matching result before any field observation can be considered. | `planned`, future L3 only. |
| Touch | Device -> Bridge -> app. Candidate v0.1 `touch`/`button` event with region, gesture, event ID, device ID, and timestamp. There is no v0.2 touch command. | No physical stop command. The app may cancel or ignore its local reaction; touch must not trigger uncontrolled command fan-out. | Deduplicate by `event_id` in bounded retention; distinct event IDs remain distinct even if gesture text matches. Evidence is device-event receipt, not a simulated UI action. | `planned`, future L3 only. |
| Camera | App -> Bridge -> device. Candidate v0.2 `camera_capture`: single, low resolution, owner-private, local-only, EXIF stripped, external upload forbidden. | Future cancel invalidates a pending capture; if capture has begun, safely discard any uncommitted output and record the terminal reason. Visible indication, consent, retention, and deletion must be specified in L3. | At-most-once capture attempt; never auto-retry after delivery begins. Result is metadata-only, with no bytes or URL. | `planned`, future L3 only. |

### Screen

The current accepted fact is strictly the producer-side neutral-expression
request. It does not establish a queue record, a device poll, a matching ack,
or field observation. A future screen L3 slice must:

1. serialize screen state per target device and reject or mark superseded an
   older undelivered expression after a newer intent is accepted;
2. define `neutral` as the rollback baseline without calling it physically
   applied until a matching result and field observation exist;
3. preserve a correlation chain from producer acceptance through poll, ack,
   result, and any separately recorded observation; and
4. keep screen retries bounded by TTL and idempotency rather than generating
   new expressions under the same producer retry.

### Audio

The v0.2 schema constrains `speak` to public-safe content and a maximum volume
of 20 percent. The golden fixture's 12 percent example is a fixture choice, not
the universal contract maximum. A future L3 audio slice must define a scoped
stop acknowledgement, no-replay behavior after physical delivery begins,
privacy-safe diagnostics, and a mute/stop rollback that does not reveal text.
Neither local audio code nor a historical v0.1 report proves current playback.

### Motion

The v0.2 schema supplies high-level actions, `repeat` in the range 1 through
2, and a watchdog idle delay in the range 500 through 5,000 ms. It deliberately
does not define raw PWM. These are input bounds, not a mechanical safety proof.
A future L3 motion slice must define calibrated safe range, rate, collision and
power interlocks, the exact neutral pose, stop timeout, and an owner-visible
rollback result before sending any motion. The existing v0.2 `action.stop` and
`action.reset_pose` schema values are not proof that a device implements a
scoped stop or neutral return.

### Touch

Touch is the only listed inbound capability. Local iOS touch reactions are
mock-only state transitions and leave no bridge request, queue entry, device
event, or hardware evidence. A future L3 touch slice must define event-ID
generation, bounded dedup retention, debounce, event privacy, app-consumer
behavior, and explicit proof that no input automatically fans out to motion,
audio, camera, or other state-changing work.

### Camera

The v0.2 DTO allows only one low-resolution capture up to 320x240, requires
EXIF stripping, forbids external upload, and permits only metadata in the
result. It is not a capture path. A future L3 camera slice must separately
authorize capture consent and visible indication, implement cancellation and
secure deletion, define bounded retention, and prove that raw media cannot
appear in queue snapshots, results, logs, or external routes. A metadata-only
result is still not a device or field confirmation without the matching L3
evidence chain.

## Error And Outcome Registry

The `E_ADAPTER_*` values below are normative names for a future adapter. They
are not current bridge response codes and must not be assumed routable today.
Existing local v0.2 validation uses its own declared values such as
`unsupported_capability`, `validation_failed`, `device_busy`,
`capture_unavailable`, and `internal_error`.

| Code | Meaning | Required handling | Automatic retry |
| --- | --- | --- | --- |
| `E_ADAPTER_VALIDATION_FAILED` | Envelope, capability body, privacy, or timing is invalid. | Reject before enqueue; retain bounded field-level reason only. | No; producer must create corrected intent. |
| `E_ADAPTER_UNSUPPORTED_CAPABILITY` | Capability has no enabled L3 implementation for the selected device/version. | Reject without queue entry. | No. |
| `E_ADAPTER_IDEMPOTENCY_CONFLICT` | Same idempotency key has different canonical intent, or an active identity conflicts. | Return original command ID only for identical intent; otherwise reject. | No. |
| `E_ADAPTER_CAPACITY_EXHAUSTED` | Safe queue/result capacity is unavailable. | Reject without evicting active unacknowledged work. | Producer may retry only with the same key before TTL, subject to backoff. |
| `E_ADAPTER_TTL_EXPIRED` | TTL elapsed before terminal completion. | Terminally expire and block new delivery. | No. |
| `E_ADAPTER_TTL_TOO_SHORT_TO_LEASE` | Remaining TTL cannot cover the minimum useful lease. | Terminally expire before poll. | No. |
| `E_ADAPTER_LEASE_CONFLICT` | Ack/result lacks the active durable lease or correct lease owner. | Reject completion; preserve active state until normal expiry/maintenance. | No blind retry. |
| `E_ADAPTER_ACK_CORRELATION_MISMATCH` | Command, device, capability/type, or result identity does not match. | Reject without state transition. | No. |
| `E_ADAPTER_LATE_ACK` / `E_ADAPTER_LATE_RESULT` | Ack/result arrived after expiry or a terminal cancellation. | Record diagnostic only; do not resurrect work. | No. |
| `E_ADAPTER_RESULT_CONFLICT` | Result ID is reused for another command or contradicts a terminal result. | Reject without overwriting evidence. | No. |
| `E_ADAPTER_STOP_UNSUPPORTED` | A requested stop has no capability-specific L3 implementation. | Reject without sending a fallback device action. | No. |
| `E_ADAPTER_STOP_TOO_LATE` | The target is already terminal or the physical effect cannot be reversed. | Record bounded terminal state and required follow-up. | No automatic retry. |
| `E_ADAPTER_SAFETY_INTERLOCK` | Motion/camera/audio safety or consent precondition is absent. | Reject before delivery and record which policy gate failed. | No. |
| `E_ADAPTER_EVENT_DUPLICATE` | An inbound touch event ID was already recorded. | Return idempotent receipt; do not invoke the app action twice. | Not applicable. |
| `E_ADAPTER_CAPTURE_POLICY` | Camera metadata/media/privacy policy is violated. | Reject and prevent storage or transfer of media. | No. |
| `E_ADAPTER_DEVICE_BUSY` / `E_ADAPTER_CAPTURE_UNAVAILABLE` | Device reports bounded temporary inability. | Record correlated result. | Only screen/status may be reconsidered before TTL; audio, motion, and camera never auto-replay. |
| `E_ADAPTER_INTERNAL` | Adapter cannot safely determine an outcome. | Fail closed, preserve bounded diagnostic correlation, and do not infer device success. | No automatic physical retry. |

Future results use the v0.2 outcome vocabulary where applicable: `ok`,
`partial`, `rejected`, `expired`, and `error`. `ok` means only the declared
protocol operation succeeded. It cannot by itself change a program status to
`field-confirmed`.

## Observable Evidence Contract

| Claim | Minimum bounded evidence | Insufficient evidence |
| --- | --- | --- |
| `local/mock verified` | A fixture, local test, simulator, or mock result with no live target. | A conclusion about real device behavior. |
| `producer accepted` | Producer-side accepted record with command correlation and bounded intent. | Queue acceptance, poll, ack, result, or observation. |
| `device-ack verified` | Matching command/device correlation plus a valid ack under the active protocol and lease rules. | An event receipt, a mock ack, or an uncorrelated log. |
| `result recorded` | Matching, bounded result metadata and outcome. | Physical observation or media bytes outside policy. |
| `field-confirmed` | A separately authorized physical observation tied to the same command/capability/time window, after required ack/result evidence. | Producer acceptance, a local test, an ack alone, or a historical report. |

For every future L3 capability, the evidence record must contain command/event
ID, capability, protocol version, queue mode, target device identity, timing,
terminal state/reason, and a privacy-safe summary. It must omit tokens, raw
audio text, private memory, raw camera media, and unbounded logs.

## Fixture And Test Plan

These are recommendations for a future local implementation. They do not ask
the current task to edit code or execute tests. All fixture identifiers should
be synthetic and must not contain a token, real device detail, private text, or
camera media.

### Existing Local Evidence To Preserve

| Surface | Existing coverage to preserve | Boundary |
| --- | --- | --- |
| `tests/test_stackchan_wire_contract.py` | Canonical v0.2 DTO round trips, declared invalid cases, private speak rejection, defensive copies. | Offline schema only. |
| `tests/test_stackchan_v02_bridge_lifecycle.py` | In-memory enqueue/poll/ack/result correlation, declared capabilities, capacity behavior, metadata-only camera result, at-least-once polling until ack. | Local source behavior only; no current expiry maintenance or hardware evidence. |
| `tests/test_stackchan_protocol.py` | v0.1 enqueue/poll/ack/expiry/idempotency and no-default-redelivery behavior. | Historical/local protocol behavior, not a v0.2 or device acceptance claim. |
| `tests/test_stackchan_bridge_durability.py` | Durable queue leases, TTL terminal handling, attempts/backoff, tombstones, and at-most-once safety behavior. | Local persistence behavior only. |

### Required New Contract Fixtures

1. **Common command identity**: identical idempotency key plus canonical intent
   returns the original command identity; the same key plus changed capability,
   body, target, timing, or privacy is `E_ADAPTER_IDEMPOTENCY_CONFLICT`.
2. **TTL boundaries**: expired at enqueue; expiry just before poll; expiry while
   leased; TTL too short for a lease; ack/result exactly before expiry; and
   late ack/result after expiry. Assert that expiry cannot be reversed.
3. **Correlation**: wrong device, wrong capability/type, wrong lease, duplicate
   exact ack/result, reused result ID across commands, and result ordering for
   v0.1 ack-with-outcome versus v0.2 separate records.
4. **Capacity and retention**: active unacknowledged work is never silently
   evicted; acknowledged/tombstone/dead-letter retention remains bounded; no
   retained record leaks sensitive body/media content.
5. **Protocol separation**: a v0.2 DTO does not silently acquire v0.1 retry or
   expiry semantics, and a v0.1 event receipt cannot complete a v0.2 command.

### Required Capability Fixtures

| Capability | Positive synthetic fixture | Negative / safety fixture |
| --- | --- | --- |
| Screen | Neutral expression produces one ordered adapter intent, then a correlated fake poll/ack/result sequence. | Newer expression supersedes an undelivered older expression; duplicate retry does not create a second display intent; expiry blocks late delivery. |
| Audio | Public-safe short `speak` intent with a synthetic `partial`/`ok` result and no body text in diagnostics. | Private/memory/PII/health content rejected; volume over v0.2 cap rejected; stop unsupported before L3; lost ack cannot trigger replay. |
| Motion | High-level motion with valid repeat/watchdog plus synthetic neutral-stop result. | Raw PWM, unsafe range placeholder, missing interlock, duplicate replay, and neutral-stop failure all fail closed. |
| Touch | One event ID delivers once to a fake app consumer; a duplicate event ID is idempotent. | Simulated UI tap cannot count as device event; two different IDs remain distinct; input cannot fan out to a device command. |
| Camera | Single low-resolution, owner-private, local-only request and metadata-only synthetic result within media TTL. | Bytes/URL/EXIF/external-upload fields rejected; duplicate/lost ack cannot recapture; cancel path prevents later media retention. |

### Evidence-Label Regression Checks

Add a documentation or acceptance check that rejects status language equating
`local/mock verified`, `producer accepted`, or `device-ack verified` with
`field-confirmed`. It must also reject any fixture, mock, or historical v0.1
record used as proof that audio, motion, touch, or camera is hardware verified.

## L3 Gate And Rollback Requirements

Before implementing any row in the capability matrix, the assigned future task
must be L3 and must receive the explicit phrase `进入修复阶段`. Its plan must name
one capability, exact owned files/surfaces, selected protocol/version, queue
mode, TTL/ack semantics, safety and privacy preconditions, rollback action,
and evidence threshold. It must stop if the work expands to another capability
or conflicts with the active program-control status.

The immediate rollback for this L1 task is deletion of this runbook only. No
bridge, device, network, token, service, firmware, configuration, code, or Git
state was changed while creating it.

## Evidence Sources

- `ops/projects/personal-ai-companion/runbooks/continuous-program-authorization-and-task-lifecycle.md`
  is the status authority and establishes the L3 gates for audio, motion,
  touch, and camera.
- `ops/projects/personal-ai-companion/manifests/app-bridge-contract-v0.1.md`
  establishes the separate mock-only App-to-Bridge ingress, including app-ack
  versus device-ack and the local-network no-go boundary.
- `ops/projects/personal-ai-companion/reports/stackchan-ack-diagnostic-20260710.md`
  records the producer-accepted screen ceiling and missing matching ack.
- `ops/projects/personal-ai-companion/runbooks/stackchan-wire-contract-v0.2.md`
  establishes the offline DTO boundary.
- `ops/projects/personal-ai-companion/runbooks/stackchan-command-protocol-v0.1.md`
  describes the historical v0.1 command/event lifecycle and its distinct queue
  behavior.
- `projects/products/personal-ai-companion/src/personal_ai_companion/stackchan/wire_contract.py`
  and `durable_queue.py` provide read-only local schema and queue semantics.
- `projects/products/personal-ai-companion/scripts/stackchan_bridge.py` and the
  focused tests named above provide local reference-lifecycle evidence only.
