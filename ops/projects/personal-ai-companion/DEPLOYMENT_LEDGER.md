# Personal AI Companion Deployment Ledger

## Current Recorded Baseline

- Latest completed automated live verification in this ledger: 2026-07-14.
- The bounded App-to-StackChan LCD v0.1 field sequence is complete: the owner
  observed `happy` after its correlated acknowledgement, then observed
  safety-terminal `neutral` after its separate correlated acknowledgement.
  Final Bridge queue depth was `0`. Durable source is pushed at product commit
  `9dbfafc`; this is not evidence for repeated reliability or any non-LCD
  capability.
- Latest verified Xiaoxin API image:
  `xiaoxin-cloud-api:20260713T0137-native-google`.
- `xiaoxin-cloud-api:20260712T2352-google-state` remains the immediate API
  rollback image. The earlier email and direct-flow images remain historical
  anchors.
- The durable canonical product lineage is committed and pushed on the GitHub
  default branch `main` at `b8462a9`. Redundant compatibility refs
  `codex/initial-private-publish` and `codex/pac-google-logout-revocation-fix`
  were retired after the fast-forward promotion.
- Native Google Sign-In is deployed. The 2026-07-14 lifecycle pass confirmed a
  real refresh rotation, the intended Google account, same-owner Google and
  Authentik binding, local logout cleanup, and target-only orphan-family
  revocation. Same-account re-login and direct live replay of deleted old token
  values remain unconfirmed.
- Built-in email registration and password login are currently disabled because
  the initial flow did not verify mailbox ownership before issuing tokens. The
  retained email account and its data were not deleted.

## 2026-07-14: Native Google Logout Repair And Orphan-Family Revocation

Task level: `L3 repair execution` after L2 evidence.
Authorization: the owner explicitly said `进入修复阶段` for the iOS
`401`/pending-marker defect and the single family created by this acceptance
run. No deployment, restart, config change, schema change, account merge, or
account/data deletion was authorized or performed.

### Confirmed Defect And Code Repair

- The App logout UI cleared the local session, but `/v1/auth/logout` returned
  `401 invalid_refresh_token`; the newly created family remained active.
  Keychain then showed `session=0` and `pending=0`.
- Confirmed client defect: `revokePendingSession` treated `401` as resolved and
  removed the pending marker even though no server revocation occurred.
- Exact credential mutation or mismatch point is unconfirmed because the local
  value was securely deleted and neither request bodies nor token digests were
  logged or re-read.
- Product commit `b8462a9` maps `invalid_refresh_token` distinctly, retains the
  pending marker after every error or non-`204` 2xx response, accepts only HTTP
  `204` as logout success, and adds exchange-to-persist-to-view-model-to-signout,
  `401`, `202`, crash-recovery, and server logout coverage.
- Verification passed: focused Google/token tests `20`, full Python `1161`,
  targeted Ruff, AppFlow smoke, Swift App target build, and Simulator Host
  build. GitNexus `detect_changes` reported only the three intended product
  files at high auth-flow risk. The repaired Host was installed on
  `PAC-Identity-Gate-QA`; fresh UI was signed out and Keychain remained `0/0`.

### Live Backup And Transaction

- The first dump attempt at
  `/var/backups/xiaoxin-auth/20260714T141835+0800/pac-google-orphan-family-revoke`
  failed before a usable dump because of an invalid `pg_dump` argument. It did
  not modify the database and is not a rollback anchor.
- Verified backup:
  `/var/backups/xiaoxin-auth/20260714T141922+0800/pac-google-orphan-family-revoke`.
  It contains a PostgreSQL custom-format dump plus sanitized before/after family
  and aggregate snapshots. `pg_restore --list` and `SHA256SUMS` passed; dump
  SHA-256 is
  `d59e335d49d727ce6ccb91f744fe92b588cf26f0ea196437158c83e88935aaeb`.
- The transaction located exactly one active family using owner ref
  `d07f3d8eda88`, family ref `b18f957e7597`, exact creation time
  `2026-07-14T13:30:00+08:00`, native-Google identity membership, and token
  counts `1 total / 0 used / 1 unused`. It locked the candidate and required
  `UPDATE rowcount=1`; otherwise the transaction would have rolled back.
- The target became revoked at `2026-07-14T14:22:57+08:00`. All other family
  snapshot rows were byte-identical. Counts changed only from `4 active / 2
  revoked` to `3 active / 3 revoked`; users `3`, identities `3`, storage objects
  `0`, and retained email credentials `1` were unchanged.
- Public health, readiness, and capabilities remained healthy. Google and
  Authentik stayed available; built-in email and OTP stayed disabled.

### Rollback State And Limits

- Database rollback was not invoked. The family revocation is intentionally
  irreversible; normal recovery is a user-controlled same-account Google
  re-login. The full dump is a disaster-recovery anchor, not a routine way to
  re-enable one family.
- The pre-install QA `.app` is retained under excluded scratch material. The
  final repaired build is installed and signed out; no Simulator data reset was
  performed.
- Direct requests using the deleted old access/refresh values were not replayed.
  Live rejection is supported by the inactive family and server contract, and
  automated tests directly prove both token classes are rejected after family
  revocation; direct live token replay remains unconfirmed.

## 2026-07-14: Native Google Owner Acceptance Checkpoint (Historical)

Task level: `L3 repair execution` with an L2-first evidence pass.
Authorization: the parent task explicitly entered repair mode for the Xiaoxin
native-Google lifecycle slice. At this historical checkpoint no production
repair had yet been justified or applied; the later section above supersedes
its current-state conclusions.

### Read-Only Baseline

- Public health and readiness passed. The running image remained
  `xiaoxin-cloud-api:20260713T0137-native-google`; native Google and Authentik
  were available, while built-in email and OTP remained disabled.
- Sanitized database aggregates showed three user records: one password-only
  record and two distinct one-provider OIDC records. No user had both the
  native-Google and Authentik identities. Their normalized-email fingerprints
  differed. No email, subject, token, object content, or complete identifier was
  read or recorded.
- All three owners had zero cloud-storage objects, so live historical cloud-data
  continuity could not be proven by an object round trip. Local App history was
  visible after session restoration, but that does not prove continuity with
  the earlier Authentik owner.

### Authorized Live Acceptance Action

- Target: launch the already installed App with an existing native-Google
  session older than the public 300-second access-token TTL.
- Reason: verify automatic refresh and rotation without exporting credentials.
- Risk: consume and rotate exactly one refresh token in the current family.
- Rollback: do not restore the old token; retain the newly rotated current token
  and stop on any owner/family drift or HTTP failure.
- Verification: compare only sanitized family version/used/unused counts before
  and after launch, then inspect the authenticated UI state.
- Result: the same family advanced from 10 to 11 token versions, used versions
  advanced from 9 to 10, and unused current versions remained exactly 1. No
  other family changed. The App restored directly and displayed its local
  history.

### Stop Condition And Residual Risk

- The current native-Google account cannot be declared the original account
  because it is not attached to the earlier Authentik user. Different verified
  email fingerprints also prevent the existing safe auto-link rule from
  joining them.
- No database link, identity move, account merge, storage move, code change,
  config change, service restart, or deployment was performed.
- App logout would delete the local session and revoke the active live family.
  That UI action awaits explicit action-time owner confirmation. Re-login then
  requires the owner to select the intended Google account in Google's UI.
- See
  [native-google-owner-acceptance-20260714.md](reports/native-google-owner-acceptance-20260714.md)
  for the evidence matrix and exact remaining checkpoint.

## 2026-07-13: StackChan LCD Bridge Replacement And Bounded E2E Acceptance

Task level: `L3 repair execution`, followed by `L1 engineering closeout`.
Authorization: the owner explicitly entered repair mode for the bounded live
slice. The later closeout reused existing evidence and made no Bridge, device,
LAN-service, credential, or deployment request.

### Live Change And Field-Confirmed Result

- Replaced the stale private Bridge listener only after confirming the existing
  v0.1 queue was empty. The replacement retained the existing private listener,
  owner-only boundary, allowlist, token-file reference, and queue configuration.
- Verified the replacement listener reported `stackchan.command.v0.1`, exposed
  the authenticated LCD command/result routes, and initially had queue depth
  `0`.
- The owner then completed exactly one App-driven `happy` transaction and
  confirmed its correlated ACK and visible screen change.
- The owner completed exactly one App-driven `neutral` transaction and
  confirmed its separate correlated ACK and visible screen change.
- The final safety state was `neutral`; final Bridge queue depth was `0`.

### Durable Source And Local Verification

- Product commit `9dbfafc` on `codex/initial-private-publish` contains the
  bounded App client and injection seam, Keychain credential provider,
  fail-closed Host configuration, authenticated `/app/v0.1/lcd/commands` and
  `/app/v0.1/lcd/results/{bridge_request_id}` routes, ACK correlation,
  idempotency/TTL handling, Simulator-only UI test target, and focused tests.
- Independent local closeout passed `37` focused E2E/Bridge tests and
  `1080` full Python tests, targeted Ruff, Python compileall, App target build,
  four Swift smoke products, and Simulator `build-for-testing` for
  `StackChanLCDE2EUI`.
- The pre-change Bridge source remains as a SHA-256-verified local rollback
  anchor in excluded product-worktree rollback material. It is not product
  source and was not committed during closeout.

### 2026-07-14 Local ACK Route Hardening

- A local independent review reproduced that a `/stackchan/events` ACK with
  mismatched top-level and body command IDs could bypass LCD verification and
  be accepted as a generic event.
- Product commit `9dbfafc` validates every ACK event before routing decisions.
  The malformed event now returns HTTP `409` with
  `command_correlation_mismatch`; the queued command and pending LCD result are
  unchanged.
- A real loopback HTTP regression covers the route. This was source/test work
  only: no Bridge, device, LAN service, credential, database, or deployment was
  accessed or changed.

### Boundary And Residual Risk

- The real v0.1 live allowlist remains exactly `happy` and `neutral`.
- The 12 App expression families and their four-frame animations are local
  preview assets only; they were not sent to the device as a 12-state protocol.
- This acceptance does not cover audio, motion, camera, touch, memory,
  HealthKit, automatic/background polling, firmware, other hardware, repeated
  reliability, unattended operation, real-device signing, App Store release,
  or broader production deployment.
- Any repeat live command, Bridge replacement, reliability run, or capability
  expansion is a new task and requires a fresh risk gate and rollback review.

## 2026-07-13: Native Google Sign-In Dual-Track Deployment

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode and separately confirmed
creation of the production iOS OAuth client.
Live scope: Xiaoxin API on `oc-nas`, its existing VPS HTTP proxy tunnel, Google
Auth Platform project `xiaoxin-502211`, the public Xiaoxin endpoints, and the
`PAC-Identity-Gate-QA` Simulator. Authentik configuration was not changed.

### Changes

- Created Google iOS OAuth client `小芯 iOS` for Bundle ID
  `xyz.nodezjc12348888.xiaoxin`; retained the existing Web OAuth client as the
  Google SDK `serverClientID`.
- Added the official GoogleSignIn iOS SDK, the reversed Google callback scheme,
  and a native App flow that prefers Google nonce/ID-token exchange while
  retaining Authentik as automatic fallback and email as a visible fallback.
- Added `POST /v1/auth/google/nonce` and `POST /v1/auth/google/exchange`, with an
  additive one-time nonce table and strict signature, `aud`, `azp`, `iss`,
  `iat`, `exp`, nonce, and `email_verified` checks.
- Verified-email matching reuses existing email or Authentik users instead of
  creating a second Xiaoxin account.
- Added `XIAOXIN_GOOGLE_JWKS_PROXY_URL` for Google public-key downloads only.
  The URL is credential-free and validated as an explicit HTTP(S) proxy origin;
  HTTPX environment proxy inheritance is disabled so Authentik traffic is not
  rerouted.
- Deployed `xiaoxin-cloud-api:20260713T0137-native-google` with native Google,
  legacy Authentik OIDC, and email login all enabled. SMS OTP remains disabled.

### Backups And Evidence

- NAS backup root:
  `/var/backups/xiaoxin-auth/20260713T013711+0800/native-google-before`
- The root contains the pre-change PostgreSQL dump, cloud source, `.env`,
  Compose, dependency files, prior image record, and before/after health and
  capability responses. Files are mode `0600`; directories are mode `0700`.
- Pre-change image: `xiaoxin-cloud-api:20260712T2352-google-state`.
- Local repair workspace:
  `scratch/projects/personal-ai-companion/native-google-repair-20260713T013711+0800`
- The old Simulator Bundle ID `com.local.personal-ai-companion` remains
  installed with its separate data container. It was not deleted or migrated.

### Verification

- Focused cloud regression passed `57` tests; targeted Ruff and
  `git diff --check` passed.
- The final iOS Simulator build succeeded with GoogleSignIn `9.2.0`. Its built
  plist contains the production Bundle ID, iOS Client ID, Web server Client ID,
  legacy `xiaoxin` scheme, and reversed Google scheme.
- Candidate and running containers fetched Google's JWKS through the dedicated
  proxy. The API container cannot reach Google directly, so this proxy check is
  a deployment requirement rather than an optional optimization.
- The new image is running healthy; the deployment status is `complete`; the
  Xiaoxin reverse tunnel is active. Public health reports API, database, and
  storage `ok`.
- Public readiness and capabilities report native Google, Authentik OIDC, email,
  tokens, and storage available; OTP remains unavailable. Public nonce issuance
  returns a 300-second, 43-character nonce.
- The legacy Authentik start route still preserves its dedicated flow, callback,
  matching state, and PKCE `S256`; an invalid email request still reaches the
  live route and returns HTTP 422.
- The newly installed App displays the official Google button. Tapping it opens
  `accounts.google.com` with `继续前往小芯` directly, without rendering an
  Authentik intermediate page.

### Rollback

Restore the backed-up cloud files, `.env`, Compose, dependency files, and image
record from the NAS backup root, then recreate only the API:

```bash
cd /volume1/docker/stacks/apps-xiaoxin/deploy/xiaoxin
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml config --quiet
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml up -d --no-deps --force-recreate api
```

The deployment script contains the same automatic rollback and did not invoke
it. The new nonce table is additive; an API-image rollback may leave it unused.
Restore the database dump only for disaster recovery or a deliberate schema
rollback, not as the first recovery action.

### Residual Risk

- No Google credentials were entered during automated acceptance. Subsequently,
  the owner confirmed a real native exchange and direct App entry after restart.
  Original-account and historical-data continuity, forced refresh rotation,
  remote invalidation/logout, and the complete logout/re-login matrix remain
  independently unconfirmed.
- Native Google login depends on the existing NAS-to-VPS proxy listener at
  `172.20.0.1:18989` for key refresh. Cached keys reduce request frequency but
  do not remove that dependency during Google key rotation.
- At the 2026-07-13 deployment, the source came from the dirty product-polish
  worktree. That source lineage was later committed at `b9a5d7b`, was present by
  StackChan landing commit `9dbfafc`, and remains in current canonical
  `b8462a9`. Exact byte-for-byte or
  build-provenance correspondence between the running image and a specific
  commit remains unconfirmed without independent evidence. A signed real-device
  or App Store build also remains unconfirmed.

## 2026-07-13: Unverified Email Authentication Disabled

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode after choosing to close
the email registration/login surface and leave its App button disabled.
Live scope: Xiaoxin API configuration on `oc-nas`, public auth capabilities and
routes, and the `PAC-Identity-Gate-QA` Simulator. No database, user, Authentik,
Google Cloud, tunnel, or product-code change was made.

### Reason And Change

- The initial email registration path validated syntax, password strength, and
  rate limits, but created a password account and issued Xiaoxin tokens without
  proving mailbox ownership.
- Native Google account linking searches existing password credentials by the
  verified Google email. Allowing unverified password registrations therefore
  created an account-preclaim risk.
- A read-only aggregate check found two users, one email credential, one OIDC
  identity, and zero users shared by both credential types. No email addresses
  or private records were read.
- Set `XIAOXIN_EMAIL_AUTH_ENABLED=false` and recreated only the API. The image
  remains `xiaoxin-cloud-api:20260713T0137-native-google`.

### Backups And Verification

- NAS backup root:
  `/var/backups/xiaoxin-auth/20260713T020019+0800/email-disable-before`
- The root contains the prior `.env`, Compose file, image record, and
  before/after health, readiness, and capability responses. Files are mode
  `0600`; the deployment status is `complete`.
- Public health still reports API, database, and storage `ok`. Readiness reports
  Google and legacy OIDC available, email and OTP unavailable, and login still
  available overall.
- Public capabilities report
  `email={available:false,registration:false}`. Valid-shaped email registration
  and login requests both return HTTP 503 with `email_auth_unavailable`.
- Native Google nonce issuance still returns a 300-second, 43-character nonce;
  the existing image is healthy and the Xiaoxin tunnel remains active.
- After App restart, the Google button is enabled. The `注册 / 登录` button is
  visibly gray, exposed as disabled to accessibility, and a click is a no-op.

### Rollback And Residual Risk

Restore `xiaoxin.env` and `compose.yaml` from the backup root, validate Compose,
and recreate only the API to re-enable the previous email behavior. No database
restore is required.

The retained email credential and its data remain in the database. Its owner
cannot start a new password session while email auth is disabled, although
already-issued access/refresh tokens continue under the existing token rules.
Email registration must not be reopened until mailbox verification and safe
Google-linking behavior are implemented and separately accepted.

## 2026-07-12: Xiaoxin Google OAuth And Email Authentication

Task level: `L3 repair execution`
Authorization: the owner explicitly entered repair mode and approved the Google
user-data policy / production audience confirmation.
Live scope: Xiaoxin API on `oc-nas`, Authentik on `oc-nas`, the RackNerd VPS SSH
tunnel entry, Google Auth Platform project `xiaoxin-502211`, and the public
`auth.nodezjc12348888.xyz` / `xiaoxin.nodezjc12348888.xyz` endpoints.

### Changes

- Published the Google OAuth application from testing to production audience.
- Created and enabled the Authentik Google OAuth source and bound it to
  `default-authentication-identification`, so the login flow now presents
  `Continue with Google` while retaining the email/username field.
- Configured the Authentik application/provider pair for Xiaoxin authorization
  code flow with PKCE and the exact callback `xiaoxin://oauth/callback`.
- Replaced the Xiaoxin provider's default `email_verified=false` scope with the
  Xiaoxin-specific `Xiaoxin Google verified email` mapping. It reports a
  verified email only when the Authentik user has source slug `google`.
- Routed Authentik outbound Google requests through the existing VPS SOCKS
  bridge because the NAS cannot reach Google directly.
- Updated the Xiaoxin API OIDC HTTP client to send the explicit user agent
  `xiaoxin-cloud/1.0`, avoiding Cloudflare 1010 rejection of Python's default
  user agent.
- Deployed `xiaoxin-cloud-api:20260712T2206-email-auth`, enabling real email
  registration/login with scrypt password hashes and bounded per-email/per-IP
  rate limits.
- Kept SMS OTP disabled.
- Hardened the three NAS reverse SSH tunnels with keepalives/retry limits and
  removed the unused Xiaoxin-local `172.19.0.1:18989` forward. The required
  VPS-side `127.0.0.1:29147` reverse API listener remains active.

### Backups And Evidence

- NAS repair root: `/var/backups/xiaoxin-auth/20260712T181613+0800`
- Full pre-repair Authentik/PostgreSQL/config/tunnel backup is retained under
  that root.
- Pre-Google-stage-bind Authentik dump:
  `authentik-before-google-stage-bind.sql` (`0600`).
- Pre-Xiaoxin-verified-email Authentik dump:
  `authentik-before-xiaoxin-verified-email.sql` (`0600`).
- Pre-email Xiaoxin API backup and database dump: `email-before/`.
- Pre-final-tunnel unit: `tunnel-final-before/xiaoxin-vps-tunnel.service`.
- VPS backup: `/root/codex-repair-xiaoxin-auth-20260712T181613+0800/backup`
- Local repair workspace:
  `scratch/projects/personal-ai-companion/auth-google-repair-20260712T181613+0800`
  (contains root-only credential artifacts; never commit or publish it).

### Verification

- Google Auth Platform audience status is `Production`.
- Authentik Google source login redirects to `accounts.google.com`; the default
  authentication flow visibly presents the Google button and email/username
  input.
- Public Authentik discovery is available, advertises the Xiaoxin issuer, and
  supports `S256` PKCE.
- Xiaoxin API image is `xiaoxin-cloud-api:20260712T2206-email-auth`; the
  container is running and healthy.
- Public `/healthz` reports API, database, and storage `ok`.
- Public `/v1/auth/capabilities` reports OIDC available, email registration and
  login available, and OTP unavailable.
- Invalid empty email registration reaches the real route and returns HTTP 422
  instead of the prior 404.
- Public OIDC start returns Authentik authorization, exact Xiaoxin callback,
  and `code_challenge_method=S256`.
- Focused local tests passed: 11 email/capability/OIDC tests. One existing
  Starlette deprecation warning remains.
- `PersonalAICompanionAppFlowSmoke` passed, and the Swift package App target
  built successfully (with Swift's non-blocking automatic-product warning).
- VPS `127.0.0.1:29147` is listening and serves the Xiaoxin health endpoint;
  the final NAS tunnel unit is active with zero restarts.
- A real Google account completed source enrollment as external, non-admin user
  `zjc2944678910`. The Google source is attached only to this user; `akadmin`
  has no source connection.
- A real authorization-code exchange completed with HTTP 200, PKCE `S256`, the
  expected Google email and display name, and both access and refresh tokens.
  The one-time authorization codes and returned tokens were not displayed or
  retained.

### Rollback

Email/API rollback anchor:

```text
/var/backups/xiaoxin-auth/20260712T181613+0800/email-before
xiaoxin-cloud-api:20260712T2136-oidc-ua
```

Restore `email-before/xiaoxin.env`, `xiaoxin-compose.yaml`, and the backed-up
cloud source files to `/volume1/docker/stacks/apps-xiaoxin`, remove the newly
added `email_auth.py`, then recreate only the API with:

```bash
cd /volume1/docker/stacks/apps-xiaoxin/deploy/xiaoxin
docker compose --env-file ../../.env -f compose.yaml -f compose.nas.yaml up -d --no-deps --force-recreate api
```

Tunnel rollback anchor:

```text
/var/backups/xiaoxin-auth/20260712T181613+0800/tunnel-final-before/xiaoxin-vps-tunnel.service
```

Restore that file to `/etc/systemd/system/xiaoxin-vps-tunnel.service`, run
`systemctl daemon-reload`, and restart only `xiaoxin-vps-tunnel.service`.

The Authentik Google stage binding can be rolled back by removing source slug
`google` from `default-authentication-identification`; use the retained
pre-binding dump only for full-database disaster recovery, not as the first
rollback choice.

### Residual Risk

- External Authentik users are intentionally denied access to Authentik's
  internal user-settings interface. That `Permission denied` page is not an
  application-login failure; the iOS callback and Xiaoxin token exchange are
  the supported completion path.
- Rolling back the API image leaves the newly created email-auth tables unused;
  restoring the database dump is only necessary if those tables must also be
  removed and no post-deployment user data needs preservation.
- Credential and environment artifacts in the local repair workspace and NAS
  backups are sensitive and must remain untracked with restrictive permissions.

## 2026-07-12 Google Direct Login Repair

### Root Cause

- `/v1/auth/oidc/start` returned Authentik's generic authorization endpoint, so
  tapping `使用 Google 继续` first rendered the Authentik loading shell.
- The iOS `ASWebAuthenticationSession` reused browser state, which could expose
  the flow to an unrelated authenticated Authentik administrator session.
- The first dedicated-flow API image nested the OIDC request under `next` but
  omitted the duplicate top-level `state` required by the existing iOS
  fail-closed response parser. The App rejected that response before opening
  the browser; the follow-up image restored the existing contract.

### Changes

- Created Authentik flow `xiaoxin-google-authentication` with authentication
  requirement `require_unauthenticated` and one Identification stage containing
  only source slug `google`, no user fields, and no passwordless flow. Authentik
  2026.2.1 therefore auto-redirects to Google.
- Bound the Xiaoxin OAuth2 provider's authentication flow to that dedicated
  flow without changing the shared default authentication flow.
- Added `XIAOXIN_OIDC_LOGIN_FLOW_URL`. The API accepts only a clean, same-origin
  HTTPS Authentik `/if/flow/<slug>/` URL and wraps the original authorization
  request as a relative `next` value.
- Preserved `state`, `nonce`, the exact `xiaoxin://oauth/callback`, and PKCE
  `S256`; the same `state` is exposed at both outer and inner levels for the iOS
  parser, while the code verifier remains server-only.
- Set `ASWebAuthenticationSession.prefersEphemeralWebBrowserSession = true` so
  Xiaoxin login cannot reuse an Authentik administrator cookie.
- Final live image: `xiaoxin-cloud-api:20260712T2352-google-state`.
  Intermediate image `xiaoxin-cloud-api:20260712T2334-google-direct` is retained
  only as a rollback/debug anchor.

### Verification

- Public health reports API, database, and storage `ok`; capabilities still
  report OIDC and email available, SMS OTP unavailable, and storage available.
- Public OIDC start returns outer path
  `/if/flow/xiaoxin-google-authentication/` with only `next` and `state`; the
  relative inner authorization request retains callback, nonce, matching state,
  and `code_challenge_method=S256`, with no code verifier.
- A clean in-app browser session reached `accounts.google.com` and displayed the
  Google account login UI.
- The rebuilt App was installed on Simulator `PAC-Identity-Gate-QA`; tapping
  `使用 Google 继续` opened `accounts.google.com` and displayed Google's email
  login field. No credentials were entered and no login was submitted.
- The only Google source connection remains external, non-admin user
  `zjc2944678910`; `akadmin` has zero source connections.
- Focused Python verification passed: 18 tests. Ruff passed. Swift AppFlow smoke
  passed with a dedicated-flow response fixture. The Simulator Host Xcode build
  succeeded.

### Backups And Rollback

- Full direct-flow pre-change backup:
  `/var/backups/xiaoxin-auth/20260712T181613+0800/google-direct-before-20260712T233442+0800`
  contains both PostgreSQL dumps, API files, `.env`, Compose, and the prior image
  record.
- Top-level-state pre-change backup:
  `/var/backups/xiaoxin-auth/20260712T181613+0800/google-state-before-20260712T235249+0800`
  contains the Xiaoxin database dump, OIDC source, `.env`, and prior image
  record.
- Full rollback: restore the first backup's API files, `.env`, and Compose,
  recreate only the API using its recorded image, then run the retained
  `rollback-xiaoxin-google-direct.py` through the Authentik shell. Use the
  Authentik database dump only for disaster recovery.
- A narrow rollback of only the final state-compatibility image returns to
  `xiaoxin-cloud-api:20260712T2334-google-direct`, but that image is incompatible
  with the current iOS parser and is not a user-facing recovery target.

### Residual Risk

- Authentik's shell can be visible briefly while its JavaScript loads and
  auto-redirects the single source. Browser and Simulator verification both
  completed the transition to Google; eliminating the shell entirely would
  require a custom Authentik server endpoint or an additional dedicated login
  host and is outside this repair.
- Ephemeral web authentication intentionally avoids persistent Authentik and
  Google browser cookies. Users may need to select or enter their Google account
  more often, in exchange for preventing accidental administrator linking.
