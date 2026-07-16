# Health Shortcut Hardening v0.1

Status: source accepted at product `5225740`; backend dark-deployed from the
pre-closeout candidate with the health route disabled.

## Scope

This slice hardens the existing owner-only Shortcut analysis path without
widening its health-data contract:

- additive Alembic revision `20260716_0001`;
- finite-lifetime scoped credentials with atomic rotation and bounded overlap;
- credential and HMAC-derived client-IP rate limits reserved before body read;
- fixed metadata-only audit events with bounded retention;
- a strict pre-buffer 20 KiB streamed-request ceiling;
- default-off deployed composition requiring one canonical owner and a
  dedicated audit HMAC secret;
- frozen container dependencies and an allowlisted Docker build context.

## Security Invariants

- Account access and refresh tokens cannot authorize Shortcut analysis.
- The scoped credential is returned only on issue or rotation; only its
  domain-separated digest persists.
- Raw IP addresses, bearer values, token digests, health request bodies, and
  health projections never enter the audit table.
- Credential and IP limits are transactionally serialized for PostgreSQL and
  guarded for SQLite tests.
- Expired, revoked, legacy null-expiry, and post-overlap credentials fail
  closed with the same public invalid-credential boundary.
- Audit retention pruning runs during authentication and every credential
  issue, rotation, or revocation transaction.
- The request-size check rejects an oversized stream chunk before extending
  the application buffer.
- The deployed factory exposes no health route unless the explicit enable
  flag, owner UUID, audit HMAC secret, migrated schema, analysis service, and
  trusted owner resolver are all present.

## Deployment State

The additive schema and pre-closeout candidate were deployed as
`xiaoxin-cloud-api:20260716T111947-health-dark`. The route remained disabled and
returned `404`; both new tables contained zero rows. Product `5225740` adds the
post-deployment request-buffer and management-retention repairs and has not
been rebuilt or redeployed. Enabling the route therefore requires a separate
reviewed deployment from `5225740` or a descendant.

## Explicit Exclusions

This manifest does not accept or authorize:

- route enablement or a new deployment;
- real scoped-credential issuance, handoff, or phone storage;
- HealthKit authorization or real sample reads;
- Shortcut installation or execution;
- phone HTTPS submission or real health transfer;
- free-form model analysis, chart UI, replay persistence, or chat wiring.
