# Native Google Owner Lifecycle Acceptance

- Date: 2026-07-14
- Task: `PAC-NATIVE-GOOGLE-OWNER-ACCEPTANCE`
- Risk level: `L3 repair execution`, L2 evidence first
- Route lock: Xiaoxin native Google auth, token/session lifecycle, and
  owner-scoped account continuity only
- Status: repair complete; same-account re-login checkpoint remains unconfirmed

## Authorization And Safety Boundary

The owner explicitly entered repair mode for two bounded changes: repair the
iOS `401`/pending-revocation behavior and revoke only the orphan refresh family
created by this acceptance run. No account merge/deletion, identity move,
history or storage deletion, schema change, config change, restart, deployment,
App Store action, email enablement, or OTP enablement was authorized or
performed.

No Google credential, ID/access/refresh token, cookie, nonce, API key, raw email,
OIDC subject, token digest, object content, or complete user/family identifier
was read into evidence or output. The old credentials were not reconstructed or
replayed after secure local deletion.

## Evidence Classification

### Automated And Live Evidence

- The running image remained `xiaoxin-cloud-api:20260713T0137-native-google`.
  Public health, readiness, and capabilities passed before and after repair;
  native Google and Authentik remained available, while email/OTP stayed off.
- A prior expired-session launch rotated one live family from `10/9/1` to
  `11/10/1` total/used/unused tokens without changing another family.
- The account selected at `13:30 +08` created one new active family under owner
  ref `d07f3d8eda88`. Sanitized identity metadata showed that owner has both the
  Authentik and native-Google providers. The family had `1/0/1` token counts.
- App logout returned to the signed-out UI and Keychain showed `session=0` and
  `pending=0`, but `/v1/auth/logout` returned `401 invalid_refresh_token`; the
  target family remained active. Other families and service health did not
  change.
- A verified PostgreSQL custom-format backup was created at
  `/var/backups/xiaoxin-auth/20260714T141922+0800/pac-google-orphan-family-revoke`.
  `pg_restore --list` and checksums passed. Dump SHA-256 is
  `d59e335d49d727ce6ccb91f744fe92b588cf26f0ea196437158c83e88935aaeb`.
- A transaction matched exactly one candidate by owner/family refs, exact
  creation time, Google identity membership, active/reuse state, and `1/0/1`
  token counts. It locked the row, required `rowcount=1`, and revoked family ref
  `b18f957e7597` at `2026-07-14T14:22:57+08:00`.
- All non-target family snapshot rows were byte-identical. Aggregate counts
  changed only from `4 active / 2 revoked` to `3 active / 3 revoked`; users `3`,
  identities `3`, cloud objects `0`, and retained email credentials `1` were
  unchanged.
- Final QA install on `PAC-Identity-Gate-QA` displayed the signed-out Xiaoxin
  identity gate. The Google button was available, email login remained disabled,
  and Keychain session/pending counts remained `0/0`. No login was attempted.

### Automated Code Evidence

- Product commit `b8462a9` on
  `codex/pac-google-logout-revocation-fix` is pushed. It maps
  `invalid_refresh_token` separately and retains pending revocation after every
  error or unexpected non-`204` 2xx response. Only HTTP `204` clears the marker.
- AppFlow smoke covers Google exchange -> decode -> persist ->
  `IdentityGateViewModel` -> sign-out request and asserts that logout submits
  the refresh credential returned by that exchange. It also covers `401`, empty
  `202`, `503`, multi-account queues, and crash recovery.
- The server Google test immediately logs out after exchange and proves both the
  issued access and refresh credentials are rejected afterward.
- Verification passed: focused Google/token tests `20`, full Python `1161`,
  targeted Ruff, `PersonalAICompanionAppFlowSmoke`, Swift App target build, and
  Simulator Host build. The final Host ended with `** BUILD SUCCEEDED **`.
- GitNexus `detect_changes` reported three intended files at high auth-flow
  risk. Generic test helper names produced unrelated graph matches, but no
  Memory or other forbidden file changed.

### Owner-Observed Evidence

- The owner completed Google account selection and explicitly confirmed that
  the selected account was the intended original account. The App returned to
  the main conversation UI with the expected profile.
- The owner observed no saved local conversations in this QA session and the
  page was in offline simulation mode. This is not evidence of recovered
  historical cloud data.
- The owner explicitly confirmed the one logout action before it was executed.

### Unconfirmed

- The exact point at which the App credential diverged from the server token
  digest. The credential had already been securely deleted and request bodies
  were not logged; no live login was reproduced to recover it.
- Direct live replay showing the old access and refresh credentials return
  `401`. The inactive family and server contract make them unusable, and
  automated tests directly exercise both classes, but the deleted live values
  were not replayed.
- Same-account Google re-login after logout and restoration of historical data.
  No live cloud objects existed, and the QA UI showed no saved local chats, so
  there is no historical object/chat round trip to claim.

## Acceptance Matrix

| Item | Result | Evidence and limit |
| --- | --- | --- |
| 1. Expected original Google account, no duplicate | **Confirmed** | Owner confirmed the selected account; sanitized live metadata showed Google and Authentik on owner `d07f...`, not a new owner. |
| 2. Historical owner data continuity and isolation | **Partially confirmed** | Same-owner binding and automated owner isolation passed. Live cloud-object count was zero and QA showed no saved chats, so historical recovery cannot be demonstrated. |
| 3. Expired access auto-refresh and rotation | **Confirmed** | One real family advanced `10/9/1 -> 11/10/1`; all other families stayed unchanged. |
| 4. Remote/session invalidation rejects old tokens | **Confirmed structurally; direct live replay unconfirmed** | Target family is inactive and server/automated tests reject both token classes. Deleted live values were not replayed. |
| 5. App logout clears local state; same-account re-login restores data | **Logout confirmed; re-login unconfirmed** | Fresh UI is signed out and Keychain is `0/0`. Re-login requires the owner to select the same Google account. |
| 6. Evidence labels remain distinct | **Confirmed** | Automated/live, owner-observed, and unconfirmed evidence are separated above. |

## Root-Cause Judgment

### Confirmed

- The logout request credential did not match a stored refresh-token digest;
  the server therefore returned `401 invalid_refresh_token` and did not revoke
  the family.
- iOS mapped that response to a resolved unauthorized state and removed the
  pending marker. This is a confirmed defect because the family remained active
  while local `session` and `pending` were both zero.
- The repaired client clears pending revocation only after exact HTTP `204`.

### Strongest Hypothesis

The strongest hypothesis is a credential mismatch between the refresh value
persisted after native Google exchange and the value submitted by sign-out.
The end-to-end smoke closes the untested exchange/persist/view-model/request
chain. The exact mutation, stale-read, or substitution point in the deleted live
session remains unconfirmed; there is insufficient evidence to choose among
those mechanisms.

## Backup And Rollback State

- The first dump attempt at
  `/var/backups/xiaoxin-auth/20260714T141835+0800/pac-google-orphan-family-revoke`
  failed on an invalid `pg_dump` argument before a usable dump existed. It did
  not mutate the database and is not a rollback anchor.
- The verified backup and sanitized before/after snapshots are retained under
  the `14:19:22` path above. No database rollback was invoked.
- Family revocation is irreversible. Normal recovery is user-controlled login
  with the same Google account; restoring the full dump is reserved for disaster
  recovery and is not a safe single-family undo.
- The pre-install QA `.app` is retained in excluded scratch material. The final
  repaired build is installed and no rollback was needed.

## Remaining Owner Checkpoint

The shortest remaining checkpoint is one user-controlled sign-in with the same
Google account. Codex must not enter or inspect credentials. After the App
returns, verify only that it maps to owner ref `d07f...`, shows the expected
profile, and does not expose another owner's data. Because current live cloud
object and QA local-chat counts are zero, report data recovery as not applicable
rather than inventing historical continuity evidence.

## Independent Review Gap

Claude review was attempted with bounded, secret-free repo evidence but the
local reviewer was not logged in. Sub2API tools were not exposed. No external
model claim is used as evidence. GitNexus re-indexed commit `b8462a9` and
preserved 4372 embeddings, then exited nonzero during analyzer shutdown with a
local mutex error; the updated meta/index is present and no lock was deleted.
