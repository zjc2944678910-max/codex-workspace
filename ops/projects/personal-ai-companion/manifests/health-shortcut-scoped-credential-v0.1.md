# PAC Health Shortcut Scoped Credential v0.1

- Status: accepted local/default-off authentication boundary
- Date: 2026-07-16
- Order: `12G`
- Task: `PAC-HEALTH-SHORTCUT-SCOPED-CREDENTIAL`
- Product source: `main@7905b12`
- Acceptance report:
  [health-shortcut-scoped-credential-v0.1-acceptance-20260716.md](../reports/health-shortcut-scoped-credential-v0.1-acceptance-20260716.md)

## Accepted Boundary

Order 12G replaces the previously accepted 12E analysis-route authentication
whenever the health analysis service and trusted owner resolver are explicitly
composed. `POST /v1/health/shortcut-analysis` then accepts only a dedicated
`health:shortcut-analysis` credential. Account access tokens and refresh tokens
cannot authorize analysis, and a scoped credential cannot authorize any other
protected API.

The composition signature remains unchanged. The credential service is built
inside `create_cloud_app`, while all analysis and credential-management routes
remain absent unless the caller injects both the health analysis service and
trusted owner resolver. This is a strict local source upgrade of 12E, not a
second fallback authentication mode.

## Credential Contract

- Token format: `pac_hsc_v1_` plus 64 URL-safe ASCII characters.
- Fixed scope: `health:shortcut-analysis`.
- Digest:
  `SHA256("xiaoxin-health-shortcut-analysis-credential-v1\0" + token)`.
- Plaintext is returned only by the successful issuance response and is marked
  sensitive/non-representable in the response model.
- Persistence contains only credential ID, owner user ID, digest, creation time,
  and optional revocation time.
- Every successful verification re-runs the trusted single-owner resolver and
  confirms both cloud user ID and canonical owner entity ID.

## Management And Analysis Routes

- `POST /v1/health/shortcut-credentials` uses the normal account access token
  plus trusted owner policy and returns one new plaintext credential once.
- `GET /v1/health/shortcut-credentials` returns metadata only; token and digest
  are absent.
- `DELETE /v1/health/shortcut-credentials/{credential_id}` individually revokes
  one owner-bound credential. Revoked, unknown, and repeated canonical UUIDs
  share idempotent `204` behavior; malformed UUID syntax remains the fixed
  redacted `422 invalid_request` contract.
- `POST /v1/health/shortcut-analysis` accepts the scoped credential only.
- Missing, malformed, unknown, or revoked credentials fail closed with fixed
  non-echoing authentication errors before the health body is parsed.

Issuance, listing, and analysis responses are non-cacheable. Sensitive token or
digest values are absent from list/revoke responses, errors, model `repr`, and
OpenAPI examples/defaults. The OpenAPI document uses separate account and
Shortcut bearer schemes.

## Persistence And Revocation

`cloud_health_shortcut_credentials` is an additive table created by the existing
Cloud metadata initialization path. SQLite writes remain serialized through the
repository write guard; row locking is requested for database engines that
support it. Revocation affects future authentication after commit. An analysis
request that already passed authentication may finish.

Deleting the owner cascades credential deletion. Reopening the SQLite database
preserves active/revoked metadata and verification behavior. Health analysis
itself still writes no health data.

## Explicit Non-Scope

This acceptance does not deploy a route, issue a real credential, configure
HTTPS, install or execute a Shortcut, add `Get Contents of URL`, read HealthKit,
transmit real health data, add Swift/iOS UI or Keychain storage, or connect
authenticated chat, providers, MCP, or a free-form model narrative.

The first local credential version has no expiry, rotation workflow, last-used
writeback, durable audit, per-credential/IP rate limit, or replay suppression.
Before any real issuance or deployment, HTTPS, bounded rate limiting, a
finite-lifetime or rotation policy, owner-approved credential handoff/storage,
and deployment rollback must be reviewed under the L3 gate.

## Accepted Product Files

- `src/personal_ai_companion/cloud/health_credentials.py`
- `src/personal_ai_companion/cloud/database.py`
- `src/personal_ai_companion/cloud/health_api.py`
- `src/personal_ai_companion/cloud/app.py`
- `tests/test_cloud_health_credentials.py`
- `tests/test_cloud_health_analysis.py`
- `README.md`
- `ios/PersonalAICompanion/README.md`
- `ios/PersonalAICompanion/BUILD_NOTES.md`
- `ios/PersonalAICompanion/INTEGRATION_DESIGN.md`
- `ios/PersonalAICompanion/Shortcuts/health-owner-summary-v0.1.md`

## Current Continuation

No post-12G implementation slice is selected by this acceptance. Order 13
remains an optional/deferred Personal Team device gate and is not required for
the fallback path. Real issuance, an HTTPS Shortcut call, or deployment is L3
and requires the owner to say `进入修复阶段` for that named slice. Provider/MCP
iOS controls remain separate local product work and are not implied by 12G.
