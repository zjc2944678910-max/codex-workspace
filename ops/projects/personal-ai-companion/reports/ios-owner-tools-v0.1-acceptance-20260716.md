# PAC iOS Owner Tools v0.1 Acceptance 2026-07-16

- Status: accepted local/synthetic, default-off
- Task level: L1 local cross-module product implementation
- Product commit: `c550d4b267e069cb6bbd82993c0869d2728cf2bb`
- Remote state: product `main` and `origin/main` matched at the product commit
- Manifest:
  [ios-owner-tools-v0.1.md](../manifests/ios-owner-tools-v0.1.md)

## Scope And Safety Boundary

This acceptance adds the single-owner iOS Provider-management and MCP-call
surfaces over the already accepted backend contracts. It also adds the missing
revision-CAS Provider delete operation required by the owner UI. The work used
only synthetic fixtures, mock clients, local Python tests, SwiftPM smoke, and
iOS Simulator builds/screenshots.

No live Provider, real credential, remote MCP server, private or health data,
NAS/VPS/Cloudflare state, deployed service, production database, or real-device
signing state was read or changed. Pre-existing dirty product files, including
deployment/Alembic/health/database work and untracked control files, remained
outside the product commit.

## Accepted Security Properties

- Provider responses remain strict and redacted. Private configuration is
  encoded only in create/update requests and is never decoded from responses.
- Update is complete private replacement; old secrets cannot be prefilled.
- Private inputs clear on every terminal or background form path.
- Delete is logical and metadata-audited, requires the expected revision,
  refuses fallback-referenced profiles, and leaves an ID-reuse tombstone.
- Local selection storage contains only a redacted profile ID and is cleared on
  logout, authentication rejection, update, and delete. It is not a durable
  backend routing decision.
- The owner clients reuse the existing session and one-refresh authentication
  flow. There is no second authentication or credential store.
- MCP discovery and execution are hard-bound to
  `server.local.context/context.today/read_only` and the exact timezone schema.
  Arbitrary server, URL, tool, schema, and argument inputs are unreachable.
- Both UI surfaces are independently capability-gated and off in the formal
  Host configuration. Ordinary Chat, health, StackChan, memory, and account
  startup do not require either service.
- Fixed safe messages cover 401/403/409/422/429/502/503/504 and network
  failures without returning raw exceptions or secrets.

## Verification

Provider registry and Cloud owner API:

```text
69 passed, 1 existing Starlette/TestClient warning
```

The complete Python suite reached:

```text
1710 passed, 1 failed, 1 warning
```

The one failure is outside this slice: `tests/test_cloud_deploy.py` still
expects the pre-Alembic Docker context allowlist while the preserved dirty
worktree already includes `alembic.ini` and `migrations/`. The owner-tools
commit did not stage or change that deployment surface. Targeted compileall and
`git diff --check` passed. Ruff was unavailable in the existing virtual
environment and no dependency was added to obtain it.

Swift verification passed:

- `swift package dump-package`;
- full `swift build`;
- `PersonalAICompanionCoreSmoke`;
- `PersonalAICompanionAppFlowSmoke`, including owner HTTP client contracts;
- `PersonalAICompanionSettingsPrivacySmoke`;
- `PersonalAICompanionMockSafetySmoke`;
- navigation metadata, root-tab, and route-view-factory smoke;
- Health permission and Bridge factory smoke; and
- an unsigned iPhone 17 Pro Simulator Host `xcodebuild`.

Visual QA used synthetic Provider and MCP success previews on iPhone 17 Pro
(`1206x2622`) and iPad Pro 13-inch (`2064x2752`). Provider was also checked at
the largest Dynamic Type category. The accessibility layout was adjusted after
the first pass exposed a compressed status label; the final screenshots showed
no overlap or text truncation. Screenshot files remain in the ignored workspace
scratch surface and were not committed.

GitNexus impact analysis reported HIGH/CRITICAL on shared Provider and Swift
symbols, dominated by package-level import expansion. Staged detection matched
the explicit 19-file product commit. Direct contracts were covered by the
focused Provider tests, AppFlow/MockSafety regressions, full Swift build, and
Host build. A bounded mapper and review guard completed. Sub2API tools were not
available, and the local Claude review path was not logged in; neither produced
an acceptance claim.

## Residual Risk And Rollback

- This is source and Simulator evidence only. Both formal gates remain off.
- No real Provider secret, endpoint, health result, or MCP server response was
  exercised; live capability and deployment remain unconfirmed.
- `/select` validates and audits but does not persist a backend selection or
  route existing Chat through the custom Provider.
- Provider delete is logical rather than proof of physical secure erasure.
- The full Python suite remains red because of the unrelated preserved deploy
  test drift described above.

Rollback is to revert product commit `c550d4b`. No live-state rollback is
required because this task changed no deployment, service, database, secret, or
real data.

## Acceptance Judgment

`PAC-IOS-OWNER-TOOLS-UI` is complete for the bounded local/synthetic,
default-off scope. It does not accept deployment, a real Provider, a real
secret, remote or state-changing MCP, or main-Chat Provider routing.
