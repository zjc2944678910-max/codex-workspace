# Native Google Owner Lifecycle Acceptance

- Date: 2026-07-14
- Task: `PAC-NATIVE-GOOGLE-OWNER-ACCEPTANCE`
- Risk level: `L3 repair execution`, L2 evidence first
- Route lock: Xiaoxin native Google auth, Xiaoxin token/session lifecycle, and
  owner-scoped account continuity only
- Status: blocked on one owner identity/logout checkpoint; no repair applied

## Authorization And Safety Boundary

The parent task explicitly authorized repair mode for this acceptance slice.
The pass began read-only and permitted a live change only when necessary for
the lifecycle matrix. It did not read or record Google credentials, ID/access/
refresh tokens, cookies, nonces, API keys, raw email addresses, OIDC subjects,
object content, or complete user identifiers.

No account, credential, history, storage object, schema row, or retained email
credential was deleted. Built-in email and SMS OTP remained disabled. No
StackChan, Memory, HealthKit, firmware, unrelated host, Cloudflare, DNS, or VPS
configuration was touched.

## Evidence Classification

### Automated And Live Evidence

- Public `/healthz` and `/readyz` passed. The running image remained
  `xiaoxin-cloud-api:20260713T0137-native-google`; native Google and Authentik
  were available, and email/OTP were disabled.
- Sanitized live aggregates showed three users: one password-only user and two
  separate one-provider OIDC users. No user had both external providers. The
  native-Google and Authentik users had different normalized-email
  fingerprints.
- Before relaunch, the active native-Google refresh family had 10 token
  versions: 9 used and 1 unused. The stored App session was older than the
  public 300-second access-token TTL.
- After one authorized App relaunch, the same family had 11 token versions: 10
  used and 1 unused. No other family changed. This proves one real automatic
  refresh and rotation without exposing token material.
- The App restored directly to its authenticated UI and retained one local
  conversation. This proves local continuity for the current native-Google
  owner only, not continuity with the earlier Authentik owner.
- All three live owners had zero cloud-storage objects. Therefore no historical
  cloud object existed for a real continuity round trip.
- Focused Python verification passed 25 Google/token/storage tests. These cover
  one-time Google nonce exchange, verified-email linking policy, refresh
  rotation and reuse-family revocation, logout invalidating current access and
  refresh tokens, access expiry, and owner-scoped storage isolation.
- `PersonalAICompanionAppFlowSmoke` passed. It covers expired-session refresh,
  local session removal on sign-out, pending remote-revocation retry, multiple
  account queues, and crash recovery.
- The full Python suite passed `1080` tests with one pre-existing deprecation
  warning. The Swift App target build and iOS Simulator Host build succeeded;
  the Host build ended with `** BUILD SUCCEEDED **`.

### Owner-Observed Evidence

- Historical evidence records that the owner completed a real native Google
  exchange and that an App restart entered through the restored session.
- No new owner-observed logout, Google account selection, remote invalidation,
  or re-login step was completed in this pass.

### Unconfirmed

- Whether the Google account currently shown by the App is the intended
  original account.
- Original Authentik owner to native-Google owner continuity.
- Historical data continuity across those two distinct users.
- Live rejection of both old access and refresh tokens after App logout.
- App local-session clearing followed by re-login to the intended same owner.

## Acceptance Matrix

| Item | Result | Evidence and limit |
| --- | --- | --- |
| 1. Expected original Google account, no duplicate | **Blocked** | Native Google and Authentik are separate users with different email fingerprints. Owner identity choice is required before any repair judgment. |
| 2. Historical owner data continuity and isolation | **Partially confirmed** | Automated storage isolation passed and live owners had zero cloud objects. Current native owner retained local history. Cross-user historical continuity is unconfirmed. |
| 3. Expired access token auto-refresh and rotation | **Confirmed** | One live family advanced `10/9/1 -> 11/10/1` for total/used/unused versions; no other family changed. |
| 4. Remote/session invalidation rejects old tokens | **Automated only** | Python tests prove both old token classes fail after family revocation. The equivalent live App logout remains pending. |
| 5. App logout clears local state; same-account re-login restores data | **Automated only / live pending** | Swift smoke proves local-first clearing and retry-safe revocation. Live logout/re-login requires owner confirmation and Google UI selection. |
| 6. Evidence labels remain distinct | **Confirmed** | This report separates automated/live, owner-observed, and unconfirmed evidence. |

## Root-Cause Judgment

The safe linking rule is working as implemented: a new verified external
identity may reuse an existing OIDC-backed user only when normalized verified
email matches. Password-only credentials are intentionally excluded. Because
the native and Authentik email fingerprints differ, the service created or
retained separate owners instead of performing an unsafe cross-email merge.

This is a reproduced account-continuity blocker, but it is not currently a
proven code defect. The missing fact is owner intent: either a different Google
account was selected, or both external identities belong to the owner despite
different verified emails. The latter cannot be inferred from database state.

## Live Change Card And Rollback State

The only live mutation was the standard refresh rotation triggered by launching
the existing expired App session.

- Target: the current native-Google refresh family.
- Reason: acceptance item 3.
- Risk: consume one current refresh token and replace it once.
- Rollback: old tokens must not be restored; the replacement remains the sole
  current token. Stop on HTTP error, owner/family drift, or multiple-family
  change.
- Verification: exactly one family changed, exactly one used version was added,
  and exactly one unused current version remained.
- Result: passed; no rollback invoked or required.

## Minimum Owner Checkpoint

1. Confirm whether the Google account currently shown in the App is the intended
   original account. Do not send the email address or any credential; answer
   only `是预期原账号` or `不是预期原账号`.
2. Confirm the pending UI action with `确认退出当前小芯账号并继续验收`. This
   permits one App logout, which deletes the local session and revokes its live
   refresh family.
3. After logout, the owner must personally choose the intended Google account
   in Google's UI. Codex will not enter, request, or inspect credentials.

If the current account is not the intended one, re-login with the intended
Google account is the next safe path; do not merge users. If it is intended but
must inherit the different-email Authentik owner, stop before repair. A separate
identity-binding plan must first prove control of both identities, create a
verifiable database backup, preserve both account/data identities, define the
exact OIDC/storage ownership move, and provide a rollback query. The current
authorization does not substitute for that missing ownership proof.

## Independent Review Gap

Claude review was attempted with only sanitized evidence, but the local reviewer
was not logged in. Sub2API tools were not available in this session. No model
review claim is used as evidence or acceptance.
