# Provider Privacy And Source Reconciliation Acceptance — 2026-07-20

## Decision

Accepted as an L1 local source repair. The shared Chat runtime now classifies
the prompt boundary before custom Provider execution, the Provider router
fails closed for anything other than exact `normal`, and owner-authorized
private-cloud routes remain on the configured Relay path. Product and ops
documentation now use the current source authority without changing live-state
authority.

## Authority And Scope

- Product repository: `projects/products/personal-ai-companion`
- Product base: `HEAD`, `main`, and `origin/main` all resolved to `7754727`
  before this uncommitted repair.
- Ops surface: `ops/projects/personal-ai-companion`
- Route lock: product source plus its matching ops documentation only.
- Forbidden and not performed: deployment, image build/push, service restart,
  Provider credential or endpoint access, live database access, Bridge/device
  command, firmware change, and any NAS/VPS/live-state mutation.
- Live deployment claims remain governed by `DEPLOYMENT_LEDGER.md`; source
  currency is not deployment evidence.

## Accepted Changes

1. The shared Chat runtime derives a Provider prompt privacy class from the
   selected route and every projected memory before invoking a custom Provider.
2. `owner_authorized_private_cloud_opus` is treated as private even when no
   memory is projected.
3. `ChatProviderRouter` requires an explicit privacy class, rejects non-normal
   input before adapter execution, and independently refuses the private-cloud
   route.
4. The accepted privacy class is passed through to the Provider runtime instead
   of being synthesized at the execution call.
5. Regression tests prove that private prompt boundaries cause zero custom
   Provider adapter calls and that the trusted Relay receives the private-cloud
   request.
6. The authenticated Chat request documentation now includes the existing
   strict `memory_opt_in` object and accurately describes review-only candidate
   admission.
7. Two Swift test-only concurrency repairs restore current compiler isolation
   and wait for the actual asynchronous completion boundary instead of racing
   equal-duration timers. Production Swift behavior is unchanged.
8. The ops source snapshot now records `7754727` as the pre-repair canonical
   product source and marks the old `1abf23a`/uncommitted-14E wording as
   historical.

## Changed Files

Product repository:

- `README.md`
- `src/personal_ai_companion/api/chat_runtime.py`
- `src/personal_ai_companion/providers/chat.py`
- `tests/test_cloud_chat.py`
- `tests/test_provider_chat.py`
- `ios/PersonalAICompanion/Tests/PersonalAICompanionAppTests/DeviceControlCommandSerializationTests.swift`
- `ios/PersonalAICompanion/Tests/PersonalAICompanionAppTests/ReloadableLANBridgeClientTests.swift`

Workspace ops repository:

- `ops/projects/personal-ai-companion/README.md`
- `ops/projects/personal-ai-companion/ARCHITECTURE_TODO.md`
- `ops/projects/personal-ai-companion/reports/provider-privacy-and-source-reconciliation-20260720.md`

Existing changes to `DEPLOYMENT_LEDGER.md` and the untracked
`reports/custom-provider-chat-wiring-20260717.md` are outside this repair and
were left untouched.

## Verification

- Provider/Cloud Chat focused Python tests after the final Provider change:
  `64 passed`, with one existing Starlette/httpx deprecation warning.
- Full Python suite: `1913 passed`, with the same single deprecation warning.
- Python bytecode compilation for `src` and `tests`: passed.
- Swift focused originating-Bridge completion test: `1 passed`.
- Full Swift package suite: `32 passed`, `0 failed`.
- Diff whitespace validation: passed before report creation and repeated during
  final closeout.
- Ruff: not run because the repository virtual environment does not contain the
  `ruff` module. No dependency was installed or changed for this repair.
- GitNexus pre-change impact: `ChatRuntime` was HIGH (9 direct, 77 total,
  3 modules), `ChatProviderRouter` was MEDIUM, `_call_model` and
  `_profile_for_route` were LOW, and the Swift test repair was LOW. The public
  `ChatRuntime.respond` signature and response shape were preserved.
- GitNexus final change detection found the expected seven product files and a
  MEDIUM shared-path impact: two indexed voice-chat flows pass through
  `ChatRuntime.respond`. Product Git status showed no additional changed file,
  and the final 1913-test suite passed against this exact source state.

## Residual Risk

- No real Provider, Relay, credential, deployment, or device path was exercised;
  the acceptance is local and synthetic.
- Ruff remains unconfirmed until the development environment provides it.
- The Starlette/httpx deprecation warning is pre-existing and does not fail the
  current tests, but dependency compatibility should be handled as a separate
  build/dependency task.
- The older chronological tables still contain historical source wording; the
  dated correction sections explicitly supersede those source-only statements
  while preserving historical live evidence.

## Rollback Boundary

Revert only the seven product files and three ops files listed above. No live
rollback, database migration, credential rotation, service action, or device
operation is required because none was performed.
