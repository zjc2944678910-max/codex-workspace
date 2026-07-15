# PAC Custom Provider Registry Core v0.1

- Status: accepted local core
- Date: 2026-07-15
- Task: `PAC-CUSTOM-PROVIDER-REGISTRY-CORE`
- Product source: `main@ad18cd0ae6a5d3aedfba4ad9e149bf08da3b191e`
- Acceptance report:
  [custom-provider-registry-v0.1-acceptance-20260715.md](../reports/custom-provider-registry-v0.1-acceptance-20260715.md)

## Accepted Boundary

The accepted core is a standalone, transport-free backend registry. It adds:

- strict OpenAI-compatible provider definitions with a redacted
  `ProviderProfile` projection;
- a Provider-specific envelope-encryption domain using a random per-record DEK,
  AES-256-GCM payload encryption, and an externally injected 32-byte KEK;
- a dedicated versioned SQLite schema with mode `0600`, exact schema checks,
  wrap-nonce uniqueness, optimistic revisions, and atomic mutation plus audit;
- initial disabled, credential-missing, and not-checked health state mapping;
- synthetic health updates that keep provider and capability availability
  consistent;
- exact `normal` privacy-class plus capability fallback policies with ordered,
  bounded, unique profile allowlists; and
- metadata-only audit events and fixed non-disclosing error codes.

Endpoint, credential, endpoint path, timeout, and runtime model values are
encrypted. Public list/get/decision projections expose only the profile alias,
capability/health state, revisions, and fallback decision metadata.

## Fail-Closed Rules

- A profile is selectable only when its requested capability is healthy or
  degraded and its required credential is configured.
- Fallback has no default and requires an exact persisted owner policy.
- Missing identities, disabled profiles, missing credentials, unknown health,
  authentication/configuration failures, and cryptographic failures never
  fall through to another provider.
- Registry v0.1 rejects `sensitive_fact` and `never_quote` before direct or
  fallback resolution. A later trust and consent model must exist before this
  boundary can widen.
- A damaged or wrongly keyed eligible fallback candidate stops resolution; the
  registry does not skip it and silently select the next candidate.

## Explicit Non-Scope

This acceptance does not add or accept:

- a KEK loader, persisted KEK, operator rotation runbook, environment binding,
  or production key lifecycle;
- an API route, authentication/owner endpoint, `ModelRouter` integration,
  `OpenAICompatibleClient` integration, retry executor, or network call;
- an iOS settings/status/profile-selection screen;
- a real provider, real endpoint, real credential, real prompt, or live probe;
- Gemini/Claude/Sub2API/Ollama/NAS runtime adapters; or
- deployment, NAS/VPS, cloud, device, signing, or production configuration.

The code proves encrypted SQLite persistence only when the Provider KEK remains
separate from the database. It does not protect plaintext already present in
process memory, core dumps, a simultaneously compromised host and KEK, database
rollback, deleted-page forensics, old backups, or audit truncation by a host
administrator.

## Accepted Files

- `src/personal_ai_companion/providers/__init__.py`
- `src/personal_ai_companion/providers/models.py`
- `src/personal_ai_companion/providers/crypto.py`
- `src/personal_ai_companion/providers/registry.py`
- `fixtures/providers/v0.1/registry.json`
- `tests/test_provider_crypto.py`
- `tests/test_provider_registry.py`
- the bounded product README update

All fixtures use only synthetic `.invalid` endpoints and test credentials.

## Verification Anchor

- Provider crypto/registry: `85 passed`
- Provider/router/privacy/core pattern regression: `136 passed`
- Full product suite: `1384 passed, 1 warning`
- Ruff and Ruff format check: passed
- Python compileall: passed
- GitNexus staged change detection: low risk, no affected execution flow
- Product `main` and `origin/main`: matched at `ad18cd0`

The warning is the existing Starlette `TestClient`/`httpx` deprecation warning.

## Next Boundary

`PAC-CUSTOM-PROVIDER-RUNTIME-INTEGRATION` is a separate 9B task. It must first
design a secret-safe runtime adapter and KEK lifecycle, then add authenticated
backend owner APIs and redacted iOS selection/status in bounded synthetic or
mock form. It must not reuse the existing plaintext-repr runtime config as a
public DTO or widen beyond `normal` without a reviewed provider-trust and
consent model.
