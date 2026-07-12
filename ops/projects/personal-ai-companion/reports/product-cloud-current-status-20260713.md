# Personal AI Companion Product And Cloud Status

- Date: 2026-07-13
- Product name: `小芯` (`Xiaoxin`)
- Status: all three tasks complete; native Google deployed, built-in email disabled, and owner-driven real-account acceptance pending

## Scope And Evidence

This report reconciles one continuous implementation line across these Codex
tasks:

1. `019f4fc6-509f-7503-afca-66460a81e1bb`
2. `019f5131-c61f-7bf3-96da-7b4a843db7e4`
3. `019f53e3-4888-7dd1-9dbe-7e7e69354cc6`

All three tasks are complete. The third task deployed native Google Sign-In and
then disabled built-in email registration/login; completing a real native
Google account exchange is now a separate owner-driven acceptance step. Thread
statements were cross-checked against local Git state, the dirty product-polish
worktree, the project deployment ledger, live NAS/container state, public
endpoints, Google Cloud OAuth configuration, and Simulator evidence. No Google
credential or private account data was entered during this documentation pass.

## Current Truth

| Surface | Current fact | Boundary |
| --- | --- | --- |
| Canonical product checkout | `codex/initial-private-publish` is clean at `934cec1`; it contains the merged local memory-review seam. | It does not contain the later Xiaoxin iOS, HealthKit, cloud-auth, or branding work. |
| Product-polish worktree | `codex/pac-ios-product-polish` is based at `3019a8c` and has a large uncommitted change set containing the iOS/product/cloud work below. | All three tasks are idle, but the worktree still needs a bounded secrets/generated-artifact review and split commits before convergence; do not merge, clean, reset, archive, or commit it wholesale. |
| Live cloud baseline | The 2026-07-13 repair deployed `xiaoxin-cloud-api:20260713T0137-native-google`. Public API/database/storage, native Google capability and nonce issuance, dedicated JWKS proxying, and Authentik fallback were freshly verified. A follow-up repair disabled unverified email registration/login; both email routes now return 503 and the App button is gray and disabled. OTP remains disabled. | A real native Google account exchange, refresh, and logout remain pending. The retained email credential was not deleted. See [the deployment ledger](../DEPLOYMENT_LEDGER.md) for exact images, backups, verification, and rollback. |
| Workspace documentation | The deployment ledger exists as a new workspace file and records the initial auth deployment, dedicated Authentik Google-flow repair, native Google deployment, and email-disable follow-up. | At capture time it had not yet been committed to the workspace repository. |
| Native Google migration | Google iOS client `小芯 iOS` now exists for `xyz.nodezjc12348888.xiaoxin`; the App uses GoogleSignIn `9.2.0`; the backend verifies signature, audience, authorized party, issuer, time claims, nonce, and verified email. Native Google is deployed as the preferred path, with Authentik retained as rollback. Local verification passed 57 cloud tests, Ruff, Swift smoke, and the final Simulator build. The installed App opens `accounts.google.com` with `继续前往小芯` directly and does not render Authentik first. | No credentials were entered. Native token exchange, refresh, and logout are not accepted until the owner completes the Google screen. Built-in email auth is intentionally unavailable pending mailbox verification. |

## Task Lineage

### 1. Local iOS Product Pass

Task `019f4fc6-509f-7503-afca-66460a81e1bb` moved the unsigned local iOS host
from a contract-style mock toward a usable product shell. Durable outcomes in
the dirty worktree include:

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

These changes were explicitly left uncommitted and unpushed on
`codex/pac-ios-product-polish`.

### 2. HealthKit Expansion And Visual Closeout

Task `019f5131-c61f-7bf3-96da-7b4a843db7e4` continued the same worktree. Its
most durable addition is the real read-only HealthKit adapter:

- the formal iOS host uses the HealthKit provider; previews, macOS, and tests
  keep mock providers;
- one App action starts the complete system authorization sequence, while the
  UI states clearly that Apple still makes the owner approve individual items;
- the recorded iOS 26.5 Simulator registry found 215 ordinary and 3 per-object
  request types across 15 product-facing categories;
- invalid correlation and medication-dose authorization paths were filtered;
- interruption of a per-object flow is represented as partial/retryable, not
  as full authorization;
- chat context receives only local summaries for steps, active energy, average
  heart rate, sleep duration, and workout count/duration;
- raw ECG, clinical, medication, reproductive, and symptom records are not
  inserted into chat context;
- the recorded closeout passed 44/44 smoke checks, Swift build, Simulator Host
  build/install/launch, entitlement checks, and privacy-description checks.

No real-device authorization, signed distribution, regional Health Records,
or real health-data collection was accepted. Requesting roughly 218 readable
types while consuming five summary families is also an App Store
minimum-permission risk that needs a product decision before release.

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
`exp`, nonce, and `email_verified`, and merges accounts by verified email.

The NAS cannot reach Google's JWKS endpoint directly. A dedicated,
credential-free proxy setting now routes only JWKS downloads through the
existing VPS HTTP proxy; HTTPX environment proxy inheritance is disabled so the
legacy OIDC client is not rerouted. Candidate and running-container proxy probes
passed. Public readiness reports native Google and Authentik OIDC available.
The new App and old Bundle ID coexist on the Simulator, and tapping Google
reaches the Google email screen directly. A follow-up repair disabled built-in
email registration/login because it did not verify mailbox ownership before
issuing tokens; its App button is now gray and non-clickable. The owner must
still complete the Google screen before native token issuance, refresh rotation,
and logout can be accepted.

## Durable Product Decisions

- User-facing name: `小芯` (`Xiaoxin`).
- Authentication: native Google is the active path, Authentik is retained as
  rollback, and built-in email plus paid SMS OTP are disabled.
- Google migration: native SDK is the target, with the current Authentik path
  retained temporarily as rollback/fallback.
- Account continuity: merge by verified email; do not create a second account
  for an existing verified identity.
- HealthKit: read-only, owner-controlled, local aggregation; raw sensitive
  health records do not become chat content.
- Local chat history: inspectable, deletable, and exportable by the owner.
- Memory: ordinary `/v1/chat` automatic extraction remains disabled; the
  committed memory path is still the explicit candidate/review/promotion seam
  described in `memory-layer-current-status-20260711.md`.
- StackChan: the iOS-to-device path is still not end-to-end despite separate
  standalone hardware evidence.

## Convergence Debt

The principal project risk is now source-of-truth divergence:

1. `934cec1` is the clean, tested memory baseline.
2. The product UI, HealthKit, cloud server, auth, icon, and native Google work
   live in one large dirty worktree based on the older `3019a8c` commit.
3. Some code derived from that worktree has been deployed, but the product repo
   does not yet contain a corresponding committed revision.
4. The native Google deployment is represented only in the dirty worktree and
   dated NAS backup/image evidence; real-account acceptance is still pending.

The three tasks are now idle. Closeout should be a separate L1 convergence pass:
review secrets and generated artifacts, split the work into bounded commits,
rerun Python/Swift/Xcode verification, then rebase or merge onto `934cec1`.
Any deployment or live configuration follow-up remains L3 and needs fresh
task-specific authorization.

## References

- [Project README](../README.md)
- [Architecture TODO](../ARCHITECTURE_TODO.md)
- [Deployment ledger](../DEPLOYMENT_LEDGER.md)
- [Memory-layer current status](memory-layer-current-status-20260711.md)
