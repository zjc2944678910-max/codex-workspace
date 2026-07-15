# PAC Health Manual Export Normalization v0.1 Acceptance 2026-07-15

- Status: accepted local synthetic/fixture-only scope
- Task level: L1 local cross-file contract implementation
- Product commit: `0665fd3`
- Product remote state: `main` and `origin/main` matched after push
- Manifest:
  [health-manual-export-normalization-v0.1.md](../manifests/health-manual-export-normalization-v0.1.md)

## Scope And Safety Boundary

This acceptance adds one transport-free normalizer for a documented,
pre-aggregated manual Apple Health export summary. It does not read or parse a
real export file and does not change the disabled Swift manual-export adapter.

No private health sample, credential, endpoint, file path, ZIP/XML content,
network connection, API route, device, signing state, HealthKit permission,
MCP invocation, provider selection, cloud route, database, NAS/VPS service, or
deployment was read or changed. Product-local untracked control material
remained outside the commit.

## Implementation And Contract Checks

- Added a fixed five-marker-to-family map with order-independent input and
  canonical output.
- Added immutable/slotted DTOs with fixed source attribution, consent scope,
  idempotency, and non-echoing validation failures.
- Reused the existing snapshot window validation, content digest, freshness,
  deduplication, and source-conflict boundaries without modifying those shared
  contracts.
- Added one synthetic fixture containing no real identifiers or health values.
- Kept file paths, raw records, ZIP/XML, URLs, tokens, and transport fields out
  of the accepted schema.

## Verification

```text
tests/test_health_manual_export.py: 43 passed
manual export + owner intake + health contract: 103 passed
full Python suite: 1518 passed, 1 warning
```

Targeted Ruff, Ruff format, Python compile, and `git diff --check` passed. The
warning is the existing Starlette `TestClient`/`httpx` deprecation notice.
GitNexus staged-change detection reported low risk and no affected execution
process. The shared `HealthSourceSnapshot` impact report was medium because it
has seven direct dependents, but this slice consumes rather than modifies it.

Sub2API review was skipped because the MCP server was not configured in this
session; Codex completed local review and verification instead. No Swift source
changed, so this acceptance does not claim a new Swift or device result.

## Residual Risk And Rollback

The accepted shape is not an Apple XML decoder and does not prove compatibility
with a real `export.xml`. Filesystem intake, ZIP safety, XML entity handling,
record aggregation, owner consent UI, iOS adapter availability, HealthKit
authorization, off-device transmission, model analysis, and charts remain
unimplemented or separately gated.

Rollback is a source revert of product commit `0665fd3`; no data, service,
signing, deployment, or external-intake rollback exists because none was
changed.

## Acceptance Judgment

`PAC-HEALTH-MANUAL-EXPORT-NORMALIZATION` is complete for the bounded local
synthetic scope. It closes order 12B without claiming a real import path or a
Claude-like health-analysis vertical.
