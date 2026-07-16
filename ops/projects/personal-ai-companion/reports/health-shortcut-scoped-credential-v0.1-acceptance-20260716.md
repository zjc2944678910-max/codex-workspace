# PAC Health Shortcut Scoped Credential v0.1 Acceptance

- Date: 2026-07-16
- Order: `12G`
- Task: `PAC-HEALTH-SHORTCUT-SCOPED-CREDENTIAL`
- Product commit: `7905b1235f01a01b4baeeef1ad7ddc8a83b58b58`
- Branch: `main`
- Result: accepted for the bounded local/default-off authentication scope
- Manifest:
  [health-shortcut-scoped-credential-v0.1.md](../manifests/health-shortcut-scoped-credential-v0.1.md)

## Accepted Result

Product `main@7905b12` adds an owner-bound opaque credential scoped only to
`POST /v1/health/shortcut-analysis`. The token is returned once, stored only as
a domain-separated digest, individually revocable, and verified before health
request parsing. The trusted owner resolver is re-applied after credential
verification.

The same explicit 12E composition now mounts account-authenticated issue/list/
revoke routes and strictly switches analysis to the scoped credential. Normal
access and refresh tokens are rejected by analysis; the scoped token is rejected
by account, storage, refresh/logout, and credential-management routes. The
ordinary Cloud factory still exposes no health analysis or credential route.

No real health data, production credential, endpoint, device, deployment
setting, live database, provider/model request, MCP call, or iOS action was
used. Test credentials existed only in synthetic temporary databases.

## Verification

```text
dedicated credential tests: 10 passed
credential + analysis focused tests: 26 passed
all Cloud tests: 136 passed
12A-12G health chain: 283 passed
full Python suite: 1698 passed, 1 existing warning
```

Ruff `0.12.0` lint, local-file format checks, targeted `compileall`, and
`git diff --check` passed. `app.py` and `database.py` retain pre-existing
whole-file Ruff format drift and were not mechanically reformatted. The warning
is the existing Starlette `TestClient`/`httpx` deprecation notice.

GitNexus pre-change impact marked `create_cloud_app` `HIGH` with `18` direct
callers and `51` total three-level dependents. `CloudRepository` was `MEDIUM`;
the health router symbol was `LOW`, with dynamic FastAPI composition understood
to be under-counted. Full Cloud and full Python regression covered the shared
entry point. Final staged detection reported `LOW`, `11` intended product files,
and `0` affected execution flows.

The product commit was pushed to `origin/main`. The rebuilt product index is
up-to-date at `7905b12` with `411` files, `11,255` nodes, `87,155` edges, `300`
flows, and `5,390` embeddings. GitNexus emitted its known libc++ mutex exception
only after reporting successful indexing; both `gitnexus status` and
`.gitnexus/meta.json` confirm the final commit anchor.

## Review

The bounded read-only security review confirmed the token-type isolation,
domain-separated digest, trusted-owner recheck, independent revocation,
separate OpenAPI bearer scheme, and non-echoing errors. It raised the activation
boundary as a possible compatibility issue; that concern was closed by the
explicit 12G contract decision to strictly upgrade any composed 12E route while
keeping the default factory route-absent and leaving `create_cloud_app`'s
signature unchanged.

A final reviewer completion attempt returned an external `502` after its partial
pass, so no additional final-review conclusion is claimed. Sub2API tools were
not exposed in this session.

## Residual Risk And Rollback

The reusable bearer can be replayed if stolen. It has no expiry, rotation,
last-used writeback, rate limit, or durable audit. Concurrency relies on the
existing local write guard and database row-lock semantics without a dedicated
parallel stress test. HTTPS, finite lifetime/rotation, bounded rate limiting,
owner-approved handoff/storage, and deployment rollback are hard gates before
real issuance.

Rollback is a source revert of product commit `7905b12`. No deployment, real
credential row, phone configuration, or live health transfer occurred, so no
live rollback was needed. A future deployed rollback must explicitly revoke
issued credentials and account for the additive credential table rather than
assuming a source revert removes persisted state.

## Acceptance Judgment

`PAC-HEALTH-SHORTCUT-SCOPED-CREDENTIAL` is complete for order 12G's local and
default-off scope. It closes the unsafe proposal to put ordinary account tokens
in Apple Shortcuts without claiming that the phone can call a deployed Xiaoxin
health service today.
