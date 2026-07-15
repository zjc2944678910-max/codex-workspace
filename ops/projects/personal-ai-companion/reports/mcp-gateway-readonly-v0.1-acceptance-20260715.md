# PAC MCP Gateway Read-only v0.1 Acceptance 2026-07-15

- Status: accepted local/mock gateway slice
- Task level: L1 local cross-module, auth/security-sensitive implementation
- Product commit: `2dc29486e49b4830c431b312060e80e067b3bda9`
- Remote state: product `main` and `origin/main` matched at the product commit
- Manifest:
  [mcp-gateway-readonly-v0.1.md](../manifests/mcp-gateway-readonly-v0.1.md)

## Scope And Safety Boundary

The accepted implementation adds a caller-owned `MCPGateway` around the strict
`pac.mcp.v0.1` contracts and one deterministic local tool:
`server.local.context/context.today`. It accepts one printable IANA timezone and
reads only a caller-owned clock. When a gateway and trusted owner resolver are
explicitly injected, the Cloud app exposes owner-authenticated
`GET /v1/mcp/servers` and `POST /v1/mcp/call` routes.

No remote MCP server, network transport, real endpoint, credential, health
probe, iOS MCP runtime, HealthKit data, private data, NAS/VPS service, deployed
image, signing configuration, or production state was read or changed. The
product repository's pre-existing untracked control/rollback files remained
outside the commit.

## Accepted Security Properties

- The gateway has no default transport, discovery client, executor, or secret
  loader. The composition root injects the executor, clock, limits, and audit
  sink explicitly.
- Bearer authentication and trusted single-owner binding run before gateway
  access. The routes are absent unless the required dependencies are injected.
- Server/tool allowlist, enabled state, credential state, health, read-only
  effect, strict arguments, request window, and expiry are checked before tool
  execution.
- Admission and tool execution are bounded by default to `1s` and `2s`, with
  concurrency `1` and `16 KiB` input/output limits. Timeout/cancellation paths
  retain permit ownership until the background executor task actually finishes.
- TTL idempotency reservations prevent duplicate execution and roll back on
  failures that occur before execution begins. Duplicate requests return a
  fixed conflict code and do not replay a cached result.
- `context.today` performs its own exact argument validation; caller-supplied
  JSON Schema is never interpreted as executable policy.
- State-changing tools are rejected. No `ToolGate`, Provider fallback, main
  `ChatRuntime`, or `ModelRouter` path is invoked by this slice.
- Audit events are metadata-only and bounded: identifiers, effect, fixed
  outcome/reason, latency, output byte count, and timestamp. Arguments, result,
  exception text, credentials, URLs, and raw tool payloads are excluded.
- Close rejects while active call/task/audit work remains, and the caller owns
  final gateway shutdown. Cloud lifespan does not silently close an injected
  gateway.

## Verification

Focused MCP gateway and Cloud route tests:

```text
21 passed
```

Full product Python suite, run through the project's `.venv`:

```text
1438 passed, 1 warning in 59.87s
```

The warning is the existing Starlette `TestClient`/`httpx` deprecation notice.

Additional checks:

- Targeted Ruff check and format checks for the MCP implementation and tests
  passed. A full-repository Ruff scan still reports unrelated baseline
  findings outside this slice.
- Python compileall and `git diff --check` passed.
- GitNexus product index refresh completed with embeddings; `npx gitnexus status`
  reports indexed commit `2dc2948` and current commit `2dc2948` as up-to-date.
- Product staged detection before commit reported `7` files, low risk, and no
  affected processes.
- Independent bounded security review found no P0 or P1 issue.

## Residual Risk And Follow-ups

- FastAPI/ASGI or a reverse proxy still needs an explicit request-body limit
  before JSON parsing. The domain layer rejects oversized arguments after
  parsing.
- The default audit implementation is bounded/injected, not a durable audit
  store. A future persistent sink needs its own privacy and retention review.
- The single-user gateway bounds active execution but does not provide a
  distributed queue or cross-process idempotency guarantee.
- A future multi-profile composition must make the profile-discovery versus
  enablement projection contract explicit before exposing additional profiles.
- No arbitrary MCP discovery, remote transport, state-changing tool, iOS
  execution, automatic main-Chat/provider invocation, real private data, or
  deployment is authorized by this report.

Source rollback is to revert product commit `2dc2948`; no data, service, or
deployment rollback exists because the accepted work was local and synthetic.

## Acceptance Judgment

`PAC-MCP-GATEWAY-READONLY` is complete for the bounded local/mock scope. The
next queue item is `PAC-IOS-SUPPORTED-APP-ACTION`, which must remain
mock/Simulator-first and use a supported App Intent, Shortcut, URL/universal
link, or share-sheet surface rather than arbitrary app control.
