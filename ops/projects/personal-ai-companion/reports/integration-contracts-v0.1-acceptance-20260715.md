# PAC Integration Contracts v0.1 Acceptance 2026-07-15

- Status: accepted local source baseline
- Task level: L1 local cross-module contract work
- Product commit: `65d47b557e69a2abf8a3853541c1e8416790a0d9`
- Remote state: product `main` and `origin/main` matched after push
- Manifest: [integration-contracts-v0.1.md](../manifests/integration-contracts-v0.1.md)

## Scope And Safety Boundary

The accepted slice adds pure provider, MCP, phone-action, and health-source
contracts plus fixed synthetic fixtures and tests. It does not connect those
contracts to model routing, chat, iOS, App Bridge, HealthKit, an MCP runtime, a
provider endpoint, or any network client.

No credential, private prompt, real health sample, source locator, real phone
action, signing state, device, database, NAS, VPS, cloud service, or deployment
was read or changed. Product-local untracked control/rollback material that
predated the task remained outside the commit.

## Accepted Changes

- Added a shared strict-JSON layer with exact objects, finite bounded values,
  deep immutability, cycle rejection, canonical serialization, and SHA-256
  fingerprints.
- Added redacted provider profiles with closed availability/credential/health
  consistency.
- Added MCP server/tool declarations and execution authorization that is
  read-only by policy unless an exact, owner-bound, short-lived confirmation is
  present for a declared state-changing tool.
- Added phone request/preview/confirmation/outcome contracts limited to
  supported iOS handoff surfaces; outcomes cannot claim target completion.
- Added five-family qualitative health projections with source attribution,
  content hashes, deterministic ordering/deduplication, and conflict rejection.
- Added four canonical synthetic fixtures and `102` focused contract tests.
- Documented the contract-only boundary in the product README.

## Verification

Focused contracts:

```text
.venv/bin/python -m pytest -q \
  tests/test_integration_provider.py \
  tests/test_integration_mcp.py \
  tests/test_integration_phone.py \
  tests/test_integration_health.py

102 passed in 0.07s
```

Pattern regressions across App Bridge, retention/admission, persona disclosure,
cloud capabilities, and core kernels:

```text
198 passed, 1 warning in 1.46s
```

Full product suite:

```text
.venv/bin/python -m pytest -q
1299 passed, 1 warning in 57.68s
```

The warning is the existing Starlette `TestClient`/`httpx` deprecation notice.
It did not fail the suite.

Additional checks:

- Ruff: passed for the integration package and four new test modules.
- Python `compileall`: passed for the same source and tests.
- `git diff --cached --check`: passed before commit.
- Runtime dependency scan: no HTTP, socket, subprocess, environment, HealthKit,
  endpoint, credential, or secret-loading implementation was introduced.
- GitNexus staged change detection: `low` risk, `affected_count=0`, and no
  affected execution flows. Its README-name mapping included unrelated same-name
  index nodes, while Git's staged file list confirmed only the expected 16
  product files.

## Review Availability

The configured Sub2API advisor was unavailable for this task. A bounded Claude
review attempt could not run because the local Claude CLI was not logged in.
Codex therefore performed the combined contract review, added cross-family
corrections, and accepted the result only after focused, pattern, full-suite,
static, and staged-scope verification.

## Residual Risk And Maintenance

- These schemas have not yet been consumed by Swift or a runtime adapter;
  cross-language decoding will need its own golden-fixture acceptance when UI or
  adapter work begins.
- No JSON Schema engine executes MCP `input_schema` yet; this slice only bounds
  and preserves the declaration.
- GitNexus reindexing first encountered the local graph lock and was interrupted
  safely. A later `npx gitnexus analyze --embeddings` retry wrote the current
  product index. `npx gitnexus status` reports `65d47b5` as up to date, and
  `.gitnexus/meta.json` records `4678` embeddings. The retry process returned
  exit code `1` after its silent tail despite that confirmed on-disk result;
  the current Codex MCP process may need a restart before it serves the new
  in-memory graph.
- The only source rollback is to revert product commit `65d47b5`; no schema,
  data, service, or deployment rollback exists because none was changed.

## Acceptance Judgment

`PAC-INTEGRATION-CONTRACTS-V0.1` is complete for the local synthetic contract
scope. It unblocks planning and implementation of the custom-provider registry
and the first read-only MCP vertical, but it does not accept either runtime
integration, a phone action, a health adapter, or any live behavior.
