# Personal AI Companion Product And Cloud Status

- Date: 2026-07-13
- Product name: `小芯` (`Xiaoxin`)
- Status: all three source tasks complete; native Google login is owner-confirmed,
  the iOS/cloud convergence remains anchored at `e15e553`, canonical product
  source is pushed at `199638a` after a source-only memory fast-forward, and the
  first StackChan E2E slice is statically preflighted but not accepted end to end

This is the dated iOS/cloud closeout snapshot, with a later source-only memory
addendum. The 2026-07-14
[native Google owner-acceptance report](native-google-owner-acceptance-20260714.md)
supersedes this report's statements that forced refresh was unconfirmed. Use
the project [README](../README.md) and deployment ledger for current
cross-thread and live routing facts.

## Scope And Evidence

This report reconciles one continuous implementation line across these Codex
tasks:

1. `019f4fc6-509f-7503-afca-66460a81e1bb`
2. `019f5131-c61f-7bf3-96da-7b4a843db7e4`
3. `019f53e3-4888-7dd1-9dbe-7e7e69354cc6`

All three tasks are complete. The third task deployed native Google Sign-In and
then disabled built-in email registration/login. The owner subsequently
completed a real native Google exchange and confirmed direct App entry after
relaunch. A later pass confirmed real refresh rotation but found native Google
and Authentik attached to separate users with different normalized-email
fingerprints. Account continuity, remote logout, and re-login remain manual
acceptance gaps. The original report cross-checked its live
claims against the project deployment ledger, dated NAS/container and public
endpoint evidence, Google Cloud OAuth configuration, and Simulator evidence.
This closeout update rechecked local Git, tests, builds, and ops documents only;
it did not inspect live state or enter Google credentials or private account
data.

## Recorded Closeout Truth With Source Addendum

| Surface | Recorded fact | Boundary |
| --- | --- | --- |
| Canonical product source | Remote `codex/initial-private-publish` is pushed at `199638a`. It includes Cloud commit `b9a5d7b`, iOS commit `e15e553`, the earlier memory seam, Phase 2 recall quality, and Phase 3 runtime metadata. The local canonical checkout retains separate uncommitted StackChan E2E work and was not modified by the fast-forward. | This is committed product source. The memory-only advance was not deployed and is not proof that current live health matches dated evidence. |
| Product-polish worktree | `codex/pac-ios-product-polish` is clean at `12663dd` and retained as a rollback/source anchor. The converged branch was built from `934cec1` and fast-forwarded into the canonical branch without a merge commit. | The source branch is not the canonical deployment branch and should not be merged again. |
| Live cloud baseline | The 2026-07-13 repair deployed `xiaoxin-cloud-api:20260713T0137-native-google`. On 2026-07-14 public health/readiness still passed, Google and Authentik remained available, email/OTP remained disabled, and one expired-session App relaunch rotated exactly one live refresh family while preserving one current unused token. | Native Google and Authentik are attached to separate users with different normalized-email fingerprints. Account/data continuity is blocked; remote logout and re-login remain pending. The retained email credential was not deleted. See [the deployment ledger](../DEPLOYMENT_LEDGER.md). |
| Workspace documentation | Deployment and architecture facts through the native-Google/email-disable line were committed in `dc35f3a`; the later workspace docs record product closeout, E2E preflight, and memory Phase 2/3 acceptance separately. | The memory docs pass makes no live change and does not update the deployment ledger. |
| Native Google migration | Google iOS client `小芯 iOS` exists for `xyz.nodezjc12348888.xiaoxin`; the App pins GoogleSignIn `9.2.0`; the backend verifies signature, audience, authorized party, issuer, time claims, nonce, and verified email. Native Google is preferred with Authentik rollback. The owner completed a real exchange; the later pass confirmed direct expired-session refresh and restoration. | Direct restoration does not prove original-account/data continuity. The current native identity is not bound to the legacy Authentik user. Remote logout and subsequent re-login were not directly observed. Built-in email auth remains unavailable pending mailbox verification. |

## Task Lineage

### 1. Local iOS Product Pass

Task `019f4fc6-509f-7503-afca-66460a81e1bb` moved the unsigned local iOS host
from a contract-style mock toward a usable product shell. Durable outcomes in
the final `e15e553` product commit include:

- a cleaner chat surface and ChatGPT-inspired push drawer;
- local chat-history persistence with view, delete, export, and new-chat
  controls;
- bounded local-only mock replies without false real-connection claims;
- composer, keyboard, safe-area, message-width, gesture, Dynamic Type, and
  accessibility fixes validated on an iPhone 16 Pro Max Simulator;
- device-cover photo import with atomic local persistence, 1600-pixel JPEG
  re-encoding, metadata removal, delete handling, and restart recovery;
- repeated Swift build, smoke, simulator, screenshot, and `git diff --check`
  evidence.

These changes were later reviewed, committed in the bounded iOS slice, and
converged onto the canonical branch.

### 2. HealthKit Expansion And Visual Closeout

Task `019f5131-c61f-7bf3-96da-7b4a843db7e4` continued the same worktree. Its
most durable addition is the real read-only HealthKit adapter:

- the formal iOS host uses the HealthKit provider; previews, macOS, and tests
  keep mock providers;
- one App action starts the complete system authorization sequence, while the
  UI states clearly that Apple still makes the owner approve individual items;
- the final host requests only steps, active energy, heart rate, sleep, and
  workouts through one Apple authorization action;
- Health Records entitlement and clinical-purpose declarations were removed;
- chat context receives only local summaries for steps, active energy, average
  heart rate, sleep duration, and workout count/duration;
- raw ECG, clinical, medication, reproductive, and symptom records are not
  inserted into chat context;
- the recorded closeout passed 44/44 smoke checks, Swift build, Simulator Host
  build/install/launch, entitlement checks, and privacy-description checks.

No real-device authorization, signed distribution, or real health-data
collection was accepted. Apple still controls each per-type owner decision and
the callback cannot prove every requested read was granted.

### 3. Xiaoxin Identity And Cloud Line

Task `019f53e3-4888-7dd1-9dbe-7e7e69354cc6` renamed the product to `小芯`, added
the accepted local App icon, introduced the identity gate, and moved the cloud
path from preview behavior to a live service.

The 2026-07-12 live baseline established:

- public Xiaoxin API health reported API, database, and storage `ok`;
- real email registration/login was enabled with scrypt password hashing,
  bounded rate limits, and Keychain session storage in the App;
- SMS OTP was intentionally disabled and is not part of the product plan;
- Google OAuth production audience and Authentik PKCE integration were
  configured;
- an external non-admin Google account completed a real authorization-code
  exchange and received Xiaoxin access/refresh tokens;
- a dedicated unauthenticated Authentik flow now redirects to Google and an
  ephemeral iOS web-auth session prevents reuse of an administrator cookie;
- live image, tunnel state, backups, rollback anchors, and residual risks are
  recorded in `DEPLOYMENT_LEDGER.md`.

The dedicated Authentik flow still permits a brief Authentik shell while its
JavaScript loads. The 2026-07-13 repair implemented the accepted migration:

```text
Xiaoxin iOS -> native Google Sign-In -> Xiaoxin token verification/exchange
```

Google iOS client `小芯 iOS` was created for formal Bundle ID
`xyz.nodezjc12348888.xiaoxin`; the existing Web client remains the SDK server
client. The App now prefers the official native SDK and retains Authentik as an
automatic fallback. The backend uses one-time server nonces, refreshes JWKS on
unknown key rotation, validates signature plus `aud`, `azp`, `iss`, `iat`,
`exp`, nonce, and `email_verified`. Verified external identities may preserve
continuity by verified email; a password-only account is not treated as proof of
mailbox ownership and is never auto-merged by matching email.

The NAS cannot reach Google's JWKS endpoint directly. A dedicated,
credential-free proxy setting now routes only JWKS downloads through the
existing VPS HTTP proxy; HTTPX environment proxy inheritance is disabled so the
legacy OIDC client is not rerouted. Candidate and running-container proxy probes
passed. Public readiness reports native Google and Authentik OIDC available.
The formal Xiaoxin App reaches the Google email screen directly. A follow-up
repair disabled built-in email registration/login because it did not verify
mailbox ownership before issuing tokens; its App button is now gray and
non-clickable. The owner later completed the Google screen, received a Xiaoxin
session, and confirmed
direct entry after relaunch. The 2026-07-14 acceptance pass later confirmed one
real refresh rotation, but account/data continuity, remote logout, and re-login
remain unaccepted because the native and legacy identities are separate users.

## Durable Product Decisions

- User-facing name: `小芯` (`Xiaoxin`).
- Authentication: native Google is the active path, Authentik is retained as
  rollback, and built-in email plus paid SMS OTP are disabled.
- Google migration: native SDK is the target, with the current Authentik path
  retained temporarily as rollback/fallback.
- Account continuity: verified external identities may preserve continuity by
  verified email. Password-only credentials do not prove mailbox ownership and
  are never auto-merged by matching email.
- HealthKit: read-only, owner-controlled, and limited to steps, active energy,
  heart rate, sleep, and workouts; raw sensitive health records do not become
  chat content.
- Local chat history: inspectable, deletable, and exportable by the owner.
- Memory: ordinary `/v1/chat` automatic extraction remains disabled; the
  committed memory path is still the explicit candidate/review/promotion seam,
  now with canonical recall selection and persisted runtime metadata described
  in `memory-runtime-metadata-phase-3-20260713.md`.
- StackChan: the iOS-to-device path is still not end to end despite separate
  standalone hardware evidence. The selected first slice is v0.1 LCD
  `happy -> ack -> neutral -> ack` only.

## Convergence Closeout

The prior source-of-truth divergence is closed:

1. `e883a91` excludes local build, QA, GitNexus, and evidence artifacts.
2. `b9a5d7b` commits the Cloud auth/storage API and deployment template.
3. `e15e553` commits the iOS product, identity, five-type HealthKit adapter, and
   multi-account logout-revocation recovery.
4. The three commits were cherry-picked onto memory baseline `934cec1`, then
   fast-forwarded and pushed as `codex/initial-private-publish` at `e15e553`.

Final convergence verification passed `1041` Python tests, Cloud Ruff, lock and
Compose checks, all `44/44` Swift smoke products, Core typecheck, App target
build, plist/entitlement lint, sensitive-artifact scans, and an iPhone 17 Pro
Simulator Host build. Full-repo Ruff still reports the same 22 pre-existing
findings as `934cec1`; the closeout introduced no new Ruff finding.

After that iOS/cloud convergence, the cumulative memory Phase 2/3 line was
independently accepted and fast-forwarded into the same canonical branch at
`199638a`. Its source-only verification passed `419` memory tests and `1072`
full Python tests. No live image, service, private database, or deployment state
changed as part of that fast-forward.

## StackChan E2E Preflight

The static L2 preflight is complete. It selected the already field-evidenced
v0.1 LCD expression path for the first future App-driven slice:

```text
happy -> correlated ack -> neutral -> correlated ack
```

`neutral` is the mandatory safety terminal state. The App-facing Bridge client,
pairing credential, enqueue/result adapter, completion correlation, Bridge
changes, and field execution do not yet exist. Those actions are L3 and require
fresh exact `进入修复阶段`; the slice must not expand to audio, motion, camera,
touch, memory, health data, background polling, or firmware changes. See [the
preflight report](app-bridge-stackchan-e2e-preflight-20260713.md).

## References

- [Project README](../README.md)
- [Architecture TODO](../ARCHITECTURE_TODO.md)
- [Deployment ledger](../DEPLOYMENT_LEDGER.md)
- [Historical memory-layer baseline](memory-layer-current-status-20260711.md)
- [Memory Runtime Metadata Phase 3](memory-runtime-metadata-phase-3-20260713.md)
- [App-Bridge-StackChan E2E preflight](app-bridge-stackchan-e2e-preflight-20260713.md)
