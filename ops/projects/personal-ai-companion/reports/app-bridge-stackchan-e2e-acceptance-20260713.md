# App-Bridge-StackChan LCD E2E Acceptance — 2026-07-13

## Scope And Evidence Boundary

- Task: `PAC-IOS-STACKCHAN-SCREEN-E2E`
- Field phase: historical L3 repair execution under explicit owner
  authorization.
- Engineering closeout: L1, local source/tests/Git/docs only.
- Accepted live slice: v0.1 LCD
  `happy -> correlated ACK -> neutral -> correlated ACK`.
- Safety terminal: `neutral` is mandatory.

The engineering closeout did not contact or operate the Bridge, StackChan,
device, LAN service, Keychain contents, token, database, NAS, VPS, or cloud.
It relies on the already-recorded field result and independently validates the
durable source tree.

## Field-Confirmed Facts

The owner confirmed all of the following during the authorized field phase:

1. The App submitted `happy` through the bounded v0.1 path.
2. The result lookup returned the correlated acknowledgement for that command.
3. The owner observed the StackChan display change to `happy`.
4. The App submitted `neutral` through the same bounded path.
5. The result lookup returned the separate correlated acknowledgement for the
   neutral command.
6. The owner observed the final display change to `neutral`.
7. Final Bridge queue depth was `0`.

These facts establish one successful bounded sequence. They do not establish
repeat reliability, unattended behavior, or any broader capability.

## Durable Source Integration

Product branch `codex/initial-private-publish` is pushed at commit `1439dee`.
The commit contains:

- App Bridge injection and LCD result lookup UI;
- live ViewModel allowlisting limited to `happy` and `neutral`;
- Keychain-backed credential-provider code without committed credentials;
- the fail-closed `LCDScreenE2ELANBridgeClient`;
- Host pairing/injection, local-network plist declarations, Xcode project,
  shared `StackChanLCDE2EUI` scheme, and UI test source;
- the Python LCD adapter with bounded TTL, record retention, idempotency, and
  ACK/device/command correlation;
- authenticated `/app/v0.1/lcd/commands` and
  `/app/v0.1/lcd/results/{bridge_request_id}` Bridge routes;
- focused adapter and loopback durability tests.

No real Bridge address, token, credential, build output, rollback copy, or
private log is present in the product commit. The committed Host endpoint is
empty by default and therefore fail-closed until a local build supplies an
endpoint and the owner pairs a credential.

## Review Findings And Fixes

The L1 closeout review found and fixed three source-level defects before
acceptance:

- inconsistent top-level/body ACK command IDs now fail closed with a correlation
  error;
- pending and completed idempotent replays now preserve accepted/done semantics
  across the Bridge and Swift client;
- the field LAN address was removed from the durable plist and the Host now
  rejects an empty endpoint.

The live UI also hides audio, motion, and camera controls when using the bounded
LCD client. Local touch and expression previews remain explicitly labeled as
local simulations.

## Independent Local Verification

All verification used an exported clean Git index and did not run a real-device
test:

- focused E2E/Bridge Python tests: `36 passed`;
- complete locked Python environment: `1079 passed`, with one existing
  FastAPI/Starlette TestClient deprecation warning;
- Ruff on all changed Python files: passed;
- Python `compileall` for `src` and `scripts`: passed;
- `swift build --target PersonalAICompanionApp`: passed;
- `PersonalAICompanionAppSupportActionSmoke`: passed;
- `PersonalAICompanionAppFlowSmoke`: passed;
- `PersonalAICompanionMockSafetySmoke`: passed;
- `PersonalAICompanionCoreSmoke`: passed, including fail-closed LCD-client
  checks that stop before URLSession when no credential exists;
- `StackChanLCDE2EUI` generic iOS Simulator `build-for-testing`: passed; no
  UI test or device test was run;
- `git diff --check`: passed;
- GitNexus staged impact: `MEDIUM`, 18 files, one affected flow. Swift symbol
  parsing remained unavailable, so Swift acceptance rests on source review,
  compilation, smoke tests, and Simulator build-for-testing.

Full-repository Ruff is not clean for 22 pre-existing findings in unrelated
style/import/wire-contract files. Those files were not changed or included in
this bounded product commit.

## Local Preview Versus Live Protocol

The App contains 12 local-preview expression families with four coherent frames
per expression. This is visual App content only. It does not change the real
v0.1 live allowlist, which remains exactly:

- `happy`
- `neutral`

The 12-state preview is not evidence of a 12-expression device protocol.

## Not Accepted

This acceptance does not cover audio, servo or other motion, camera, touch
hardware, memory, HealthKit, automatic/background polling, firmware, other
hardware, repeated reliability, unattended operation, real-device signing,
App Store distribution, or a broader production deployment. Any repeat live
execution or scope expansion requires a new task and fresh risk authorization.
