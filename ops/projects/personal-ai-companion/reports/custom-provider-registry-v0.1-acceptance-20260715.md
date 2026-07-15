# PAC Custom Provider Registry v0.1 Acceptance 2026-07-15

- Status: accepted local registry core
- Task level: L1 local cross-module, security-sensitive implementation
- Product commit: `ad18cd0ae6a5d3aedfba4ad9e149bf08da3b191e`
- Remote state: product `main` and `origin/main` matched after push
- Manifest: [custom-provider-registry-v0.1.md](../manifests/custom-provider-registry-v0.1.md)

## Scope And Safety Boundary

The accepted slice adds a local Provider registry, Provider-specific envelope
encryption, versioned SQLite persistence, synthetic health state, explicit
fallback policy, and metadata-only audit. It consumes the accepted provider
profile contract without modifying `OpenAICompatibleConfig`,
`OpenAICompatibleClient`, `ModelRouter`, `create_app`, any API route, or iOS.

No environment file, real credential, real provider, network endpoint, prompt,
response, private data, device, NAS, VPS, cloud service, deployment, or
production configuration was read or changed. Product-local untracked control
and rollback material that predated the task remained outside the commit.

## Accepted Security Properties

- Every private configuration receives a random 32-byte DEK and fresh 12-byte
  wrap and payload nonces.
- AES-256-GCM encrypts the private payload; an externally injected 32-byte KEK
  wraps the DEK through exact key-ID routing.
- Versioned AAD binds owner, profile, adapter, schema, and secret generation.
- SQLite stores the envelope, redacted metadata, fallback policy, and safe audit
  only. The database is mode `0600` and rejects schema drift or duplicate KEK
  wrap nonces.
- Wrong KEK/AAD/owner/profile/generation, envelope mutation, truncation,
  metadata mutation, unsupported schema, and corrupt storage fail closed with
  fixed errors and scrubbed exception chains.
- Profile/config writes use `BEGIN IMMEDIATE`, optimistic revision checks, and
  atomic audit. Two writers using the same revision produce exactly one winner.
- No fallback exists without an exact persisted policy. Only retry-eligible
  health/capability failure may enter that policy; identity, disabled,
  credential, unknown-health, authentication/configuration, and crypto failures
  stop.
- v0.1 accepts only `normal`; sensitive privacy classes are rejected before
  direct or fallback resolution.
- Public projections, reprs, errors, logs, audits, database bytes, and observed
  SQLite sidecars contained no synthetic endpoint, credential, private model,
  or private payload field names.

## Verification

Focused provider crypto and registry tests:

```text
85 passed in 0.18s
```

Provider/router/privacy/core pattern regression:

```text
136 passed in 0.65s
```

Full product suite:

```text
1384 passed, 1 warning in 58.26s
```

The warning is the existing Starlette `TestClient`/`httpx` deprecation notice.

Additional checks:

- Ruff and Ruff format check passed for the Provider package and new tests.
- Python compileall passed for the same source and tests.
- `git diff --cached --check` passed before commit.
- Static scans found no network, subprocess, environment, or logging dependency
  in the Provider package; every fixture endpoint is synthetic `.invalid`.
- GitNexus staged change detection reported low risk, eight changed files, no
  affected execution flow, and `affected_count=0`. Its README-name mapping
  again included unrelated same-name nodes, while Git's staged list confirmed
  only the expected product files.
- Independent contract/security review initially found two P1 issues: sensitive
  privacy classes were too broad and a conversion method could create an
  API-key-visible runtime DTO. Both were removed; the final review accepted the
  slice with no remaining P0/P1.

## Index State

`npx gitnexus analyze --embeddings` reported the repository indexed
successfully, then returned exit code `1` from the known local mutex shutdown
failure. The written state is confirmed independently: `.gitnexus/meta.json`
records commit `ad18cd0` and `4844` embeddings, and `npx gitnexus status`
reports the index up to date.

## Residual Risk And Rollback

- The KEK lifecycle, secure runtime adapter, authenticated configuration API,
  route execution, and iOS UI do not yet exist.
- Database encryption does not protect process memory, core dumps, a host plus
  KEK compromise, rollback, deleted pages, old backups, or administrator audit
  truncation.
- No real endpoint or provider compatibility has been tested.
- Source rollback is to revert product commit `ad18cd0`. No data, service, or
  deployment rollback exists because none was changed.

## Acceptance Judgment

`PAC-CUSTOM-PROVIDER-REGISTRY-CORE` is complete for the local synthetic 9A
scope. It does not complete the umbrella custom-provider feature. Runtime,
authenticated API, routing/client, key lifecycle, and iOS work remain the
separate 9B task `PAC-CUSTOM-PROVIDER-RUNTIME-INTEGRATION`.
