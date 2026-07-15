# App -> Bridge -> StackChan LCD E2E Preflight

Date: 2026-07-13

Status: L2 static/read-only preflight complete. L3 implementation and field
execution are not authorized.

Historical supersession note (updated 2026-07-15): this dated preflight is
retained as evidence for the pre-execution decision and gates. The later
[acceptance report](app-bridge-stackchan-e2e-acceptance-20260713.md) records one
completed, bounded App-driven LCD sequence. Product commits and branch state
described below are evidence for that window; use the project
[README](../README.md) and current product `main@4a8b52e` for current facts. The blocked
wording below is historical and does not authorize repeating the field action.

## Route Lock

- Target project: `personal-ai-companion`
- Product source: `projects/products/personal-ai-companion`
- Ops source: `ops/projects/personal-ai-companion`
- Scope: one future iOS-to-LCD expression transaction only
- Forbidden in this preflight: Bridge or device requests, token reads, live
  configuration, allowlist changes, service changes, device-client execution,
  firmware writes, and hardware actions

No Bridge, NAS/VPS, StackChan device, credential, or real data was accessed for
this report. Current live listener, route version, queue depth, allowlist, and
device-client presence therefore remain unconfirmed until a separate bounded
L2 checkpoint immediately before execution.

## Decision

The first E2E slice should use the independently field-confirmed
`stackchan.command.v0.1` LCD path. It should not make `stackchan.wire.v0.2` the
first field path: v0.2 has local route/lifecycle source and tests, but no
accepted deployment, device client, or clock-based TTL evidence.

The future transaction is limited to:

```text
iOS expression(.happy)
  -> App-facing Bridge enqueue/result adapter
  -> stackchan.command.v0.1 expression happy
  -> one manual device-client poll
  -> correlated stackchan.event.v0.1 ack(result=ok)
  -> App terminal state
  -> expression neutral
  -> second correlated ack and owner-observed neutral screen
```

The final `neutral` transaction is mandatory. The last-recorded manual device
client source does not use `duration_ms` to restore the prior screen; the
device-resident source remains unconfirmed in this read-only preflight. A
successful `happy` ack alone is therefore not a safe terminal state.

## Confirmed Static State

| Segment | Confirmed current state | Evidence ceiling |
| --- | --- | --- |
| iOS App -> Bridge | The App factory selects `MockLANBridgeClient`; `DisabledRealLANBridgeClient` fails closed. Expression actions return mock receipts. | No endpoint, socket, `URLSession` Bridge transport, Bridge credential, or physical result. |
| App bridge contract | Python DTOs, fixed fixtures, and `OfflineMockDispatcher` implement `pac.app_bridge.v0.1` locally. `local_network` is rejected before dispatch. | No route or live adapter; the Swift seam is not the Python contract implementation. |
| Bridge -> StackChan v0.1 | The authenticated enqueue/poll/ack grammar and a manual one-shot device client exist. One LCD `happy` path was separately device-ack verified and owner field-confirmed. | Not driven by the iOS App; not a continuous boot client or repeat-reliability result. |
| Bridge v0.2 | Local source exposes v0.2 capabilities, enqueue, poll, ack, result-record, and result-read lifecycles with local tests. | No accepted live deployment, v0.2 device client, TTL maintenance, or hardware evidence. |

## Required Correlation Contract

The adapter must preserve distinct identities:

| Identity | Owner and use |
| --- | --- |
| App `command_id` | Stable logical App command identity. |
| App `idempotency_key` | Retry identity for one immutable App submission. |
| `bridge_request_id` | Bridge-owned App result-poll correlation identity. |
| Device `command_id` | Bridge/device v0.1 queue and ack identity. |

None of these identifiers may be copied into another field merely to simplify
the implementation. One adapter record must map them and retain the immutable
fingerprint.

The first expression maps to:

- App intent: `.expression(.happy)`
- v0.1 type: `expression`
- body: `name=happy`, `duration_ms=1500`
- delivery: `display`
- device acknowledgement required: `true`
- App privacy metadata: preserve owner-private/screen scope in the adapter
  record; send only the non-sensitive expression name to the device
- prohibited payload: memory, PII, health data, chat text, media, credential,
  endpoint, or raw error

App enqueue acceptance is not device success. The App may show `queued` only
after Bridge acceptance and may show completion only after a matching device id
and device command id produce a valid v0.1 terminal acknowledgement.

## Missing Implementation

The future L3 implementation must add all of the following as one bounded
slice, while keeping mock mode as the default:

1. A real iOS Bridge client behind `LANBridgeClient`, with explicit live/mock
   selection and no silent success fallback.
2. A private fixed Bridge endpoint configuration for the first check. Bonjour
   discovery is deferred to avoid combining two integration changes.
3. A Bridge credential provider using a separate this-device-only Keychain
   item populated by one-time owner pairing. It must not reuse the Xiaoxin cloud
   login token or use source, plist values, `UserDefaults`, UI state, or logs.
4. App-facing enqueue and terminal-result routes that adapt to the existing
   v0.1 device queue without treating App acceptance as device acknowledgement.
5. A bounded completion/tombstone store. Current v0.1 ack removes work from the
   queue, so the App otherwise has no terminal result to query.
6. Exact duplicate replay, changed-payload conflict, wrong-device, late-ack,
   expiry, timeout, and neutral-rollback tests using one cross-language
   synthetic fixture corpus.
7. The required iOS local-network purpose string and a reviewed ATS/private-LAN
   policy. No local-network permission or transport policy is currently
   accepted for the App.

Suggested timing for this one-shot slice is a 2-second App-to-Bridge
acknowledgement wait and a device-terminal window no longer than 30 seconds. The
Bridge clock is the expiry authority. Device ack loss must not automatically
resend a physical command.

## Security And Operational Gaps

- Static Bridge source uses LAN HTTP, an IP allowlist, and a shared bearer token.
  The first App credential must be separately paired; widening the device token
  to the App is not an acceptable long-term design.
- Whether a real iPhone requires an allowlist change cannot be inferred from
  source. Simulator source identity also must be observed, not assumed.
- No endpoint or credential may appear in fixtures, screenshots, exported App
  state, test output, or ops reports.
- The first E2E must not include audio, motion, camera, touch, memory, HealthKit,
  automatic polling, background execution, or firmware changes.

## Final L2 Checkpoint Before L3

Without reading token contents or sending an authenticated request, confirm:

- the intended Bridge process/listener and route version;
- v0.1 queue mode and initial queue depth `0`;
- the narrow source allowlist behavior for the selected iPhone/Simulator path;
- the manual v0.1 device-client file and version still exist, without running it;
- the current App build has the intended local-network purpose/ATS policy;
- backup and rollback paths are writable and do not include credentials.

Any discrepancy stops the slice. It does not authorize a repair.

## L3 Gate And Acceptance

Implementation, live configuration, service changes, credential pairing, and
device execution require a fresh named authorization containing the exact
phrase `进入修复阶段`.

Acceptance requires all of the following:

1. Product source is clean and converged; mock fallback remains the default.
2. Synthetic happy/duplicate/conflict/TTL/wrong-device/late-ack/neutral tests
   pass across App and Bridge contracts.
3. Initial queue depth is `0` and a rollback anchor exists.
4. App sends `happy`; the manual device client runs once; the App receives the
   correlated terminal ack; the owner observes `happy`.
5. App sends `neutral`; the device client runs once; the App receives the
   correlated terminal ack; the owner observes `neutral`.
6. Final state is queue depth `0`, no unresolved completion, screen neutral, no
   audio, motion, camera, or touch command was emitted by this slice, and logs
   are free of tokens and private payloads. Retained completion/idempotency
   records may remain until their defined expiry.
7. Disabling the live client returns the App to an explicit mock state and never
   represents mock completion as a physical result.

## Rollback Boundary

Rollback must first close App ingress and disable the live client, then restore
the prior App build and Bridge source/config snapshot. App-adapter completion
and command-identity records created by the slice remain under their defined
retention policy so rollback does not reopen duplicate execution. The v0.1
device path remains in its prior state. Rollback must not delete shared
credentials, queues, databases, or unrelated device data.

## Status

- completed: static L2 protocol, identity, privacy, safety, and rollback design
- confirmed: selected first slice is one v0.1 LCD expression followed by neutral
- unconfirmed: current live Bridge/device readiness and all App-driven field behavior
- blocked by gate: implementation and execution until fresh `进入修复阶段`
