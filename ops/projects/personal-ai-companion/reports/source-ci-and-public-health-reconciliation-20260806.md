# Personal AI Companion Source, CI, And Public Health Reconciliation

Date: 2026-08-06

Task level: `L2` for the point-in-time public read-only checkpoint, with local
`L1` source, test, CI, and documentation remediation.

## Route And Safety Boundary

- Product source: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Workspace ops surface: `ops/projects/personal-ai-companion`
- The route lock excluded NAS/VPS/device shells, production files, live
  configuration, databases, credentials, tunnels, restarts, and deployments.
- The exact production repair phrase was not supplied, so no live repair gate
  was opened.

## Confirmed Source State

- The product repository began clean at `42d55eb1c25d7635b896ba7c6cb78f29cac1704c`.
- The workspace repository began clean at
  `6644f6be329149fe648dcf74af1110ee6649a1d0`.
- Product `main` and `origin/main` now point to `3ca3a0b4978af09877c6bd89423b6cc4da5f1a2e`.
- The final product history contains the source/CI guardrails, GitNexus
  metadata synchronization, the background-commit test race fix, and the
  WebSocket TestClient lifecycle fix.

## Public Read-Only Checkpoint

The checkpoint was taken around 2026-08-05 22:58 +08:00 over HTTPS. TLS
certificate verification passed. Only GET requests were used; no token or
cookie was supplied and no state-changing route was called.

| Endpoint | Result | Confirmed evidence |
| --- | --- | --- |
| `/healthz` | HTTP 200 | `status=ok`, `service=xiaoxin-cloud`, `database=ok`, `storage=ok` |
| `/readyz` | HTTP 200 | `status=ready`; login, Google, OIDC, token, and storage flags true; email/OTP false |
| `/v1/auth/capabilities` | HTTP 200 | Google native nonce, Authentik OIDC/PKCE, token/storage, and direct voice `pac.direct.voice.v1` available; email/OTP unavailable |

This is evidence about the public control-plane surface at one point in time.
It does not prove the current private image/container, PostgreSQL/SQLite rows,
provider account availability, deployment provenance, firmware, microphone/AEC,
or physical playback state.

## Local Remediation

- Added a PR/push `main` CI workflow with read-only permissions, concurrency
  cancellation, pinned `actions/checkout` and `astral-sh/setup-uv` revisions,
  frozen `uv.lock` installation, architecture budgets, and Python 3.11/3.12.
- Added `docs/architecture-maintenance.md` and
  `scripts/check_architecture_budgets.py` with temporary ceilings for the six
  largest architecture hotspots. No broad extraction was hidden in this slice.
- Added a regression proving native TTS stream construction and first-generator
  iteration leave the asyncio event loop responsive.
- Stabilized two Python 3.12 server-side test handlers by closing their test
  writers in `finally`; production transport code was not changed.
- Made the background memory-commit assertion wait for the commit event, while
  retaining the separate test that proves metrics are not delayed by commit.
- Made the CoreS3 WebSocket integration test enter `TestClient` explicitly so
  the endpoint and its cleanup share the managed lifespan/portal.
- Updated the package description, README, realtime repair note, and source
  maintenance guidance to match the actual owner-scoped product.

## Verification

- Local Python 3.11: `2740 passed, 1 skipped, 1 warning`.
- Local Python 3.12: `2740 passed, 1 skipped, 1 warning`.
- Realtime app file: `42 passed` on both Python versions.
- The repaired WebSocket test passed 10 consecutive runs on each Python
  version locally (20/20 total).
- `uv lock --check`: passed; 62 packages resolved.
- Architecture budget checker: passed. Current counts remain below the six
  ceilings documented in `docs/architecture-maintenance.md`.
- Workflow YAML parse and `git diff --check`: passed.
- GitNexus staged checks: LOW risk, zero affected execution processes; the
  refreshed product index reports 300 flows and no embeddings.
- Hosted GitHub Actions run
  [31078474152](https://github.com/zjc2944678910-max/personal-ai-companion/actions/runs/31078474152):
  Python 3.11 and Python 3.12 both passed the full suite, dependency lock, and
  architecture budget gate.

## Residual Risks And Next Gates

- The existing Starlette/TestClient deprecation warning remains; it is not
  introduced by this slice and is tracked for a future dependency decision.
- No Swift build, firmware build, physical device run, room AEC check, owner
  barge-in check, or provider-account health check was performed here.
- The first real iPhone microphone/AEC turn and persistent LaunchAgent bootstrap
  remain explicit field gates in the realtime acceptance record.
- Public health/readiness/auth capabilities should be rechecked read-only before
  any future claim about current live state. A source commit or successful CI
  run does not imply deployment.

## Rollback Boundary

- Source rollback is a normal Git revert of the final product source commits
  and the workspace documentation commit; no runtime rollback is needed because
  this task performed no live mutation.
- The historical deployment ledger remains the authority for any actual image,
  database, device, or service rollback target.
