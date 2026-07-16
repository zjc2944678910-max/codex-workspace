# PAC iOS Conversational Native Actions v0.1 Acceptance 2026-07-16

- Status: accepted local/synthetic; device build/install confirmed
- Task level: L1 local cross-module product implementation
- Product commit: `54a069a`
- Remote state: product `main` and `origin/main` matched at `54a069a`
- Manifest:
  [ios-conversational-native-actions-v0.1.md](../manifests/ios-conversational-native-actions-v0.1.md)

## Scope And Safety Boundary

This acceptance adds conversation-driven alarm, calendar, reminder, and Apple
Music controls to the iOS Chat surface. A strict local parser creates a bounded
proposal, and an injected executor runs only after an explicit owner tap.
Simulator verification uses a mock executor; the real iOS adapter is isolated
to AlarmKit, EventKit, and MediaPlayer.

No real system action or permission prompt was executed. No live Provider,
secret, remote MCP server, private/health data, NAS/VPS/Cloudflare state,
deployed service, production database, or real backend configuration was read
or changed. Existing dirty deployment, Alembic, cloud, health, and database
files remained outside the product commit.

## Accepted Security And Behavior Properties

- The allowlist contains exactly six typed action kinds and no generic tool
  schema or dynamic target.
- Every action requires confirmation and expires within five minutes.
- Invalid, expired, denied, unsupported, unavailable, not-found, and execution
  failures use fixed public messages without raw framework errors.
- Calendar uses write-only event access; reminder access is separate; AlarmKit
  is availability-gated.
- Apple Music control uses MediaPlayer and owner media-library search so the
  free Personal Team build remains supported without a MusicKit App ID service.
- Ambiguous text such as `我想听你说说今天的安排` remains ordinary Chat.
- Simulator-only preview arguments cannot reach native system services.
- Default Chat, health, StackChan, memory, Provider, MCP, and login paths keep
  their existing clients and authentication boundaries.

## Verification

Local verification passed:

- full `swift build` and `PersonalAICompanionApp` target build;
- action, AppSupport, transient-state, AppFlow, public-error,
  health-permission, bridge-factory, preview, input-boundary, root-tab,
  MockSafety, and IntegrationDesign smoke;
- locally signed iPhone 17 Pro Simulator Host build;
- Personal Team iPhone 15 Pro Max Host build, install, and launch;
- `plutil` and `git diff --check`; and
- full Python suite: `1711 passed, 1 existing Starlette/TestClient warning`.

The Python result also confirms the previously reported Alembic/Docker test
failure is absent in the current preserved worktree. Those unrelated repair
files were not included in product commit `54a069a`.

Visual QA used synthetic action proposals on iPhone 17 Pro and iPad Pro 13-inch
at normal text size, plus an accessibility Dynamic Type pass. Normal layouts
showed no overlap, truncation, or blank content. Accessibility content remained
scrollable and contained; actions below the initial viewport require scrolling.

GitNexus staged detection reported 15 files, 207 indexed symbols, 35 affected
flows, and CRITICAL transitive risk. Direct risk centered on `ChatViewModel`,
`AppEnvironment`, Chat UI, and smoke entry points. The complete Swift build,
focused flow regression set, two Host builds, and synthetic visual QA cover the
identified blast radius. Sub2API tools were unavailable; no external model saw
private data or configuration.

## Residual Risk And Rollback

- Device build/install is confirmed, but no real alarm, event, reminder, media
  authorization, or playback effect was executed.
- Media search covers the owner's system media library, not the full Apple
  Music catalog.
- Natural-language parsing is deterministic and intentionally narrow; more
  flexible model-generated proposals require a separate typed-contract slice.
- AlarmKit behavior below its supported iOS version remains fixed
  `unsupportedSystem`.

Rollback is to revert product commit `54a069a` and reinstall the prior signed
App. No live-state rollback is required because this task changed no deployed
service, database, secret, or real data.

## Acceptance Judgment

`PAC-IOS-CONVERSATIONAL-NATIVE-ACTIONS` is complete for the bounded local,
explicit-confirmation, Personal Team-compatible scope. Real native side-effect
evidence, catalog-wide MusicKit, background automation, and deployment remain
unaccepted.
