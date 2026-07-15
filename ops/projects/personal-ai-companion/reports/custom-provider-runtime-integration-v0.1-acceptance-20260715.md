# PAC Custom Provider Runtime Integration v0.1 Acceptance 2026-07-15

- Status: accepted local/synthetic runtime integration
- Task level: L1 local cross-module, auth/security-sensitive implementation
- Product commit: `295687f894f3005d6602a42ec0dfeeaf7f4661c2`
- Remote state: product `main` and `origin/main` matched after push
- Manifest:
  [custom-provider-runtime-integration-v0.1.md](../manifests/custom-provider-runtime-integration-v0.1.md)

## Scope And Safety Boundary

The accepted slice composes the 9A encrypted Registry into an explicit runtime
lifecycle, an injected-executor adapter, an owner-authenticated redacted Cloud
API, and a default-off iOS status/selection client. It also connects the adapter
to a conditional synthetic HTTP runtime route so the Cloud route and executor
are proven as one chain rather than separate unit-only surfaces.

No real Provider, endpoint, credential, prompt, response, private data, health
record, device, NAS, VPS, cloud service, deployment, signing configuration, or
production state was read or changed. Product-local untracked control and
rollback material that predated the task remained outside the commit.

## Accepted Security Properties

- The caller supplies KEK bytes and owns `ProviderRuntimeResources`; the Cloud
  app borrows resources and does not close them.
- `OPEN -> CLOSING -> CLOSED` drains active Registry leases, closes Registry
  storage, then zeroizes the cipher's internal key copies. A lease owner cannot
  close itself and deadlock; terminal state/notification still occurs when
  Registry or cipher close fails.
- The runtime adapter accepts only an explicit executor. It resolves once,
  executes once, returns no raw metadata, and performs no network-failure
  fallback in the same request.
- Provider HTTP routes require both current Bearer authentication and a trusted
  owner context. Resources, prompts, and executors are not touched for valid
  unauthenticated or non-owner requests.
- Private configuration and prompt inputs use strict write-only models;
  endpoint, credential, endpoint path, and private runtime model values never
  appear in API responses, public errors, reprs, OpenAPI response schemas, or
  iOS DTOs.
- The runtime request cannot carry `privacy_class`; the route fixes it to
  `normal`. Sensitive or unknown fields fail validation before execution.
- The runtime route exists only when an executor is injected. Startup,
  OpenAPI generation, and management CRUD do not call the executor and provide
  no default network behavior.
- iOS Provider support is unavailable unless
  `XiaoxinProviderRegistryEnabled` is explicitly enabled. It reuses the existing
  API base URL and authenticated session, retries one `401` once, and ends the
  session after a second rejection.
- iOS selection responses are bound to the requested profile and chat
  capability. Direct/fallback IDs, flags, reason codes, selected health, and
  capability availability must be mutually consistent.
- The phone never stores or displays a Provider endpoint, API credential, or
  private runtime model.

## Review Findings Closed

Independent bounded review found four completion issues before acceptance:

1. `ProviderRuntimeResources.close()` could wait on a lease held by the same
   thread, and a cipher-close exception could strand concurrent closers in
   `CLOSING`. Thread-owned lease accounting, outer terminal notification, fixed
   failure propagation, and concurrency tests close both paths.
2. iOS disabled selection for an unavailable requested profile, making an
   explicit server fallback unreachable. Direct availability and server
   selection-request eligibility are now separate predicates, including the
   real Status button gate.
3. Strict Codable checked field shape but did not bind a selection response to
   the request or enforce direct/fallback semantic consistency. Decoder and
   client checks now reject all mismatches.
4. The adapter and Cloud owner API were separate chains, so the planned
   synthetic route execution was not proven. The conditional owner-only
   `POST /v1/providers/{profile_id}/runtime/chat` route now invokes the injected
   adapter/executor exactly once.

The final backend/security and iOS reviews found no remaining P0/P1.

## Verification

Focused Provider runtime tests:

```text
22 passed in 0.10s
```

Provider runtime and Cloud Provider API tests:

```text
33 passed, 1 warning in 2.65s
```

Full product suite:

```text
1417 passed, 1 warning in 57.30s
```

The warning is the existing Starlette `TestClient`/`httpx` deprecation notice.

Swift verification:

- the App target built;
- `PersonalAICompanionAppFlowSmoke` passed;
- `PersonalAICompanionMockSafetySmoke` passed;
- the previously drifting `PersonalAICompanionPreviewStateSmoke` passed; and
- every Swift package executable passed: `44/44`.

Additional checks:

- Targeted Ruff and Ruff format checks passed for all 9B Python source/tests.
- Python compileall and `git diff --cached --check` passed.
- The full Python suite and Swift executable sweep covered the Swift
  package-wide blast radius reported by GitNexus.
- GitNexus staged detection reported `18` actual task files, `289` indexed
  changed symbols, `20` affected processes, and `critical` because Swift target
  file-level imports inflated the graph. It also falsely attributed the staged
  root/iOS README change to `deploy/xiaoxin/README.md`; Git's staged list
  confirmed that file was not changed. The high graph result was disclosed
  before editing/commit and was not ignored: all Swift executables and the full
  Python suite passed, and two bounded final reviews found no P0/P1.
- A full-repository Ruff scan reports 22 pre-existing, unrelated findings in
  scripts, StackChan wire code, style evaluation, and one memory test. Targeted
  9B Ruff checks are clean; no unrelated lint file was modified.

## Index State

`npx gitnexus analyze --embeddings --skip-agents-md` reported the repository
indexed successfully, then returned exit code `1` from the known local mutex
shutdown failure. The written state is confirmed independently:
`.gitnexus/meta.json` records commit `295687f`, `10476` nodes, `83585` edges,
`300` processes, and `4999` embeddings; `npx gitnexus status` reports the index
up to date.

## Residual Risk And Rollback

- This slice has no default executor or trusted health prober. A newly created
  profile remains unknown and non-executable until a trusted backend component
  records health through the internal Registry boundary.
- The existing `owner_private` Chat flow is not routed through the `normal`-only
  custom-provider runtime. iOS selection is status/decision wiring, not live
  Chat activation.
- The cipher zeroizes its own mutable key copies. Immutable KEK bytes retained
  by the caller remain the caller's lifecycle responsibility.
- FastAPI parses malformed JSON before router dependencies and may return a
  generic `422`; valid JSON still authenticates before Registry/executor access,
  no request value is echoed, and deployment-edge body-size limits remain a
  separate requirement.
- No real endpoint compatibility, retry policy, health probe, network latency,
  provider response behavior, or deployment configuration has been tested.
- Source rollback is to revert product commit `295687f`. No data, service, or
  deployment rollback exists because none was changed.

## Acceptance Judgment

`PAC-CUSTOM-PROVIDER-RUNTIME-INTEGRATION` is complete for the bounded local and
synthetic 9B scope. It does not accept a live Provider or complete the wider MCP,
phone-action, health-source, Personal Team device, or production integration
program. Its statement that `PAC-MCP-GATEWAY-READONLY` was next is historical;
that bounded task was subsequently accepted at product `2dc2948`. The current
queue item is `PAC-IOS-SUPPORTED-APP-ACTION`.
