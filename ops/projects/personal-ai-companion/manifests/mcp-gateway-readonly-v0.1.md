# PAC MCP Gateway Read-only v0.1

- Status: accepted local/mock
- Date: 2026-07-15
- Task: `PAC-MCP-GATEWAY-READONLY`
- Product source: `main@2dc29486e49b4830c431b312060e80e067b3bda9`
- Acceptance report:
  [mcp-gateway-readonly-v0.1-acceptance-20260715.md](../reports/mcp-gateway-readonly-v0.1-acceptance-20260715.md)

## Accepted Boundary

The accepted slice composes the strict `pac.mcp.v0.1` contracts into one
caller-owned, local-only gateway. Its complete allowlist contains exactly:

- server `server.local.context`;
- read-only tool `context.today`;
- one printable IANA timezone argument; and
- a deterministic local-clock result containing date, time, weekday, timezone,
  and the fixed `local_clock` source.

The gateway has no default transport or network client. The composition root
injects the executor, clock, limits, and metadata-only audit sink. The optional
Cloud routes exist only when both a caller-built `MCPGateway` and a trusted owner
resolver are injected:

```text
GET  /v1/mcp/servers
POST /v1/mcp/call
```

The routes require Bearer authentication and a trusted single-owner binding.
Discovery is a projection of declared profiles; it does not enable undeclared
servers or tools. The call route accepts the full read-only request contract and
uses fixed public error codes.

## Bounds And Fail-Closed Rules

- Default connection admission timeout is `1s`; default tool timeout is `2s`.
- Default concurrency is `1`; input and output are each bounded to `16 KiB`.
- Server/tool allowlist, enabled state, credential state, health, effect kind,
  strict arguments, request expiry, and request window are checked before the
  executor is called.
- A bounded TTL idempotency reservation prevents duplicate execution; a
  pre-execution failure releases the reservation, while an in-flight timeout or
  cancellation retains permit ownership until the executor task finishes.
- Tool output must be a finite JSON mapping within the output limit. The gateway
  does not execute arbitrary JSON Schema supplied by a caller.
- State-changing tools are rejected in this slice. No `ToolGate` execution is
  wired because no state-changing capability is enabled.
- Audit records contain only request/server/tool identifiers, effect, fixed
  outcome/reason, latency, output byte count, and timestamp. Arguments, results,
  exceptions, credentials, endpoint URLs, and raw tool payloads are not stored.
- `MCPGateway` is caller-owned. Cloud app lifespan does not close it; the
  composition root owns shutdown after active calls and audit work are drained.

## Explicit Non-Scope

This acceptance does not add or accept:

- remote MCP transport, remote discovery, arbitrary server/tool registration,
  or a default network executor;
- real provider endpoints, credentials, health probing, or private data;
- state-changing MCP execution, `ToolGate` previews, or automatic fallback to a
  different Provider/tool;
- arbitrary JSON Schema execution, automatic main-Chat invocation, or existing
  `ChatRuntime`/`ModelRouter` integration;
- iOS-side MCP server execution, stored-secret transfer, background automation,
  or a new iOS MCP runtime;
- a durable audit store, live reconfiguration, deployment, NAS/VPS changes, or
  production availability claims; or
- HealthKit reads, health-source adapters, or cloud transmission of health data.

## Accepted Files

- `README.md`
- `src/personal_ai_companion/cloud/app.py`
- `src/personal_ai_companion/cloud/mcp_api.py`
- `src/personal_ai_companion/integrations/__init__.py`
- `src/personal_ai_companion/integrations/mcp_gateway.py`
- `tests/test_cloud_mcp.py`
- `tests/test_mcp_gateway.py`

## Verification Anchor

- Focused MCP and Cloud MCP tests: `21 passed`
- Full product Python suite: `1438 passed, 1 warning`
- Targeted Ruff check and format checks for the MCP source/tests: passed
- Python compileall and `git diff --check`: passed
- GitNexus staged detection before product commit: `7` files, low risk,
  zero affected processes; product index refreshed with embeddings and is
  up-to-date at this commit.
- Independent bounded security review: no P0/P1 findings.

The warning is the existing Starlette `TestClient`/`httpx` deprecation notice.
The full-repository Ruff baseline still contains unrelated findings outside
this slice; no unrelated lint cleanup is part of this acceptance.

## Residual Risk And Rollback

- FastAPI/ASGI or a reverse proxy must enforce an HTTP body-size limit before
  JSON parsing; the domain gateway still rejects oversized arguments.
- The default audit sink is bounded/injected rather than durable, and an
  injected executor or sink remains the caller's lifecycle responsibility.
- The current single-user slice bounds active concurrency but does not promise a
  durable distributed queue or cross-process idempotency store.
- Discovery currently reflects the caller-supplied declared profile projection;
  future multi-profile composition must decide whether to filter output to the
  enabled allowlist before widening the contract.
- Source rollback is to revert product commit `2dc2948`. No data, service, or
  deployment rollback exists because none was changed.

## Acceptance Judgment

`PAC-MCP-GATEWAY-READONLY` is complete for the bounded local/mock scope. It does
not accept a remote MCP integration, a state-changing tool, an iOS MCP runtime,
or automatic Chat/provider invocation. Order 11 subsequently accepted the
separate fixed public system-share handoff; the next queue item is now
`PAC-HEALTH-SOURCE-ABSTRACTION`.
