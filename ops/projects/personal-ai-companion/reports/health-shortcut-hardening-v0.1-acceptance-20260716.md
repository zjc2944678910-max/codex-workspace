# Health Shortcut Hardening v0.1 Acceptance

Date: 2026-07-16

## Accepted Source

- Product commit: `5225740 feat(health): harden shortcut deployment`
- Branch: `main`
- Remote: `origin/main` contains `5225740`
- Alembic head: `20260716_0001`

The accepted source adds credential expiry, one atomic rotation with a short
overlap, transactionally reserved credential/IP limits, HMAC-derived IP audit
keys, fixed metadata-only audit outcomes, bounded retention, default-off
deployment composition, and container/migration wiring.

The repair review found that the original streamed request limit appended each
ASGI chunk before checking the 20 KiB ceiling. Product `5225740` checks the
remaining capacity first and includes a guarded-buffer regression. The same
review found that audit retention cleanup was triggered only by analysis
authentication; it now runs inside authentication, issue, rotation, and
revocation transactions.

## Verification

- Focused health API, credential, and migration tests: `38 passed`.
- Full Python suite: `1713 passed, 1 existing Starlette/TestClient warning`.
- Targeted Ruff checks: passed.
- Targeted Ruff format check: passed.
- Python compileall: passed.
- `uv run alembic -c alembic.ini heads`: `20260716_0001 (head)`.
- `git diff --check`: passed.
- GitNexus staged result: `LOW`, `0` affected execution flows, `22` files.
- GitNexus pre-edit impact for `_read_submission`: `LOW`, one direct caller
  (`analyze_shortcut_summary`).

Claude review was requested as a bounded read-only second opinion but did not
run because the local Claude CLI was not logged in. No Claude findings are
claimed. Sub2API tools were unavailable in the session.

## Dark Deployment Evidence

The earlier authorized deployment installed
`xiaoxin-cloud-api:20260716T111947-health-dark`, applied the additive revision,
and recreated only the API. The database container ID remained unchanged. The
recorded post-cutover checks found both new tables empty, internal/public
health/readiness/capabilities at HTTP 200, and the Shortcut analysis route at
HTTP 404 because the feature flag remained false.

That image predates the two post-audit repairs in `5225740`. This is not an
active exposure while the route remains absent, but the current image must not
be enabled. A separately authorized rebuild and API-only redeployment from
`5225740` or a reviewed descendant is required before any credential issuance
or phone validation.

## Remaining Gates

- No real HealthKit permission or sample was read.
- No Shortcut was installed or executed.
- No real scoped credential was issued, handed off, or stored on a phone.
- No phone HTTPS request or real health transfer occurred.
- No route enablement, post-repair image build, or post-repair redeployment is
  accepted by this report.
