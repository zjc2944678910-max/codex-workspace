# PAC Custom Provider Runtime Integration v0.1

- Status: accepted local/synthetic integration
- Date: 2026-07-15
- Task: `PAC-CUSTOM-PROVIDER-RUNTIME-INTEGRATION`
- Product source: `main@295687f894f3005d6602a42ec0dfeeaf7f4661c2`
- Acceptance report:
  [custom-provider-runtime-integration-v0.1-acceptance-20260715.md](../reports/custom-provider-runtime-integration-v0.1-acceptance-20260715.md)

## Accepted Boundary

The accepted 9B slice adds:

- explicit caller-owned Provider runtime resources with injected KEK material,
  active-lease draining, Registry close before cipher zeroization, reentrant
  close rejection, and fixed failure propagation to concurrent closers;
- a request-scoped runtime adapter that resolves exactly once and invokes one
  caller-injected executor, with no default transport or network client;
- owner-authenticated Provider CRUD, selection, exact fallback-policy, and
  conditional runtime-chat routes over caller-owned resources;
- a server-fixed `normal` runtime request with write-only prompt fields, public
  response aliases, and no same-request fallback after executor failure;
- a default-off iOS Provider client and Status surface that reuse the existing
  authenticated session while accepting only strict redacted DTOs; and
- server-authoritative direct/fallback selection, including an unavailable
  requested profile entering an explicit healthy fallback policy.

Provider creation remains unknown-health until a trusted backend component
records health through the internal Registry boundary. This slice exposes no
owner-writable health result route.

## Fail-Closed Rules

- Provider routes exist only when resources and the trusted owner resolver are
  both injected; the runtime route additionally requires an injected executor.
- Bearer authentication and trusted-owner binding run before Registry or
  executor access.
- Runtime requests cannot submit a privacy class. The server fixes the class to
  `normal`; `sensitive_fact`, `never_quote`, and unknown request fields fail
  before execution.
- Disabled, missing-credential, unknown-health, unallowlisted fallback, and
  unavailable-capability states do not invoke the executor.
- Executor failure and invalid responses return fixed public codes and never
  trigger another Provider in the same request.
- iOS rejects unknown response fields, request/response profile or capability
  mismatch, contradictory fallback metadata, and an unavailable selected
  snapshot.
- The phone receives no endpoint, credential, private runtime model, or raw
  Provider error.

## Explicit Non-Scope

This acceptance does not add or accept:

- environment/argument/`.env` KEK loading, KEK persistence, a rotation service,
  or a production key-management runbook;
- a default OpenAI-compatible executor, trusted health prober, real Provider,
  real endpoint, real credential, live probe, or network compatibility result;
- `ModelRouter`, `ChatRuntime`, `OpenAICompatibleClient`, or existing
  `owner_private` Chat-flow integration;
- sensitive privacy classes, live reconfiguration, deployment, NAS/VPS/cloud
  changes, device actions, signing, or real data; or
- MCP execution, supported phone-app actions, or non-HealthKit health adapters.

## Accepted Files

- `README.md`
- `ios/PersonalAICompanion/README.md`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/App/PersonalAICompanionApp.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Identity/XiaoxinProviderClientFactory.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/RootView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/Views/StatusView.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppFlowSmoke/AppFlowSmoke.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppFlowSmoke/XiaoxinProviderAPIClientSmoke.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionAppSupport/ViewModels/ProviderSettings.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionMockSafetySmoke/MockSafetyExpectedValues.swift`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionPreviewStateSmoke/PreviewStateExpectedValues.swift`
- `src/personal_ai_companion/cloud/app.py`
- `src/personal_ai_companion/cloud/provider_api.py`
- `src/personal_ai_companion/providers/__init__.py`
- `src/personal_ai_companion/providers/lifecycle.py`
- `src/personal_ai_companion/providers/runtime.py`
- `tests/test_cloud_providers.py`
- `tests/test_provider_runtime.py`

The PreviewState expectation change only reconciles the existing `happy`
default with a stale `neutral` label; it is not a Provider behavior change.

## Verification Anchor

- Provider runtime: `22 passed`
- Provider runtime plus Cloud Provider API: `33 passed, 1 warning`
- Full Python suite: `1417 passed, 1 warning`
- Swift App/AppFlow/MockSafety/PreviewState focused builds and runs: passed
- All Swift package executables: `44/44 passed`
- Targeted Ruff and Ruff format checks for 9B Python files: passed
- Python compileall and staged diff check: passed
- Final bounded security reviews: no remaining P0/P1
- Product `main` and `origin/main`: matched at `295687f`

The Python warning is the existing Starlette `TestClient`/`httpx` deprecation
warning. A full-repository Ruff scan still reports 22 unrelated baseline
findings in pre-existing style/scripts/wire/memory files; no 9B file is among
those findings.

## Next Boundary

The following sentence is a historical snapshot from the 9B acceptance and is
superseded by the 2026-07-15 MCP gateway acceptance:

> The next queue item is `PAC-MCP-GATEWAY-READONLY`: one local, allowlisted,
> read-only information tool with timeout, output bounds, metadata-only audit,
> and failure isolation.

The historical queue recorded that bounded task as complete at product `2dc2948`;
the next task was `PAC-IOS-SUPPORTED-APP-ACTION`, now accepted at product
`7547d8a` as a separate fixed public system-share handoff. Any real custom-provider
executor/health prober, main Chat integration, sensitive privacy class, or
deployment remains a separate task with a fresh trust and risk review.
