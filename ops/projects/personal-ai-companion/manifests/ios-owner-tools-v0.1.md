# PAC iOS Owner Tools v0.1

- Status: accepted local/synthetic, default-off
- Date: 2026-07-16
- Task: `PAC-IOS-OWNER-TOOLS-UI`
- Queue order: `10A`
- Product source: `main@c550d4b267e069cb6bbd82993c0869d2728cf2bb`
- Acceptance report:
  [ios-owner-tools-v0.1-acceptance-20260716.md](../reports/ios-owner-tools-v0.1-acceptance-20260716.md)

## Accepted Boundary

The Xiaoxin Status surface conditionally exposes two single-owner sheets:

- custom Provider management, gated by `XiaoxinProviderRegistryEnabled`; and
- the local read-only MCP tool, gated by `XiaoxinMCPEnabled`.

Both gates are absent from the formal Host `Info.plist`. Both clients require a
permitted API base URL, reuse the current Keychain-backed Xiaoxin session, and
perform at most one access-token refresh after `401`. Missing capability or
service configuration leaves the existing App available.

## Provider Rules

- Inventory and responses use strict redacted profile projections.
- The owner may create, completely replace, revision-delete, and validate/select
  a profile through the existing authenticated owner API.
- Saved URL, path, runtime model ID, and credential values are request-only.
  They are never returned, prefilled, logged, snapshotted, or stored in ordinary
  settings.
- Private form fields clear after save, failure, cancellation, backgrounding,
  and dismissal.
- Create/update reset health to unknown until a trusted backend health source
  records a result.
- Delete is logical, audited, revision-CAS protected, blocked while fallback
  policy references the profile, and does not permit profile-ID reuse.
- The phone retains only a redacted last-validated profile ID. The UI labels it
  as current-session validation. `/select` does not persist backend routing or
  rewire Chat.

## MCP Rules

- Discovery must return exactly one enabled server,
  `server.local.context`, and exactly one enabled read-only tool,
  `context.today`.
- The tool must require no confirmation and must expose the exact
  timezone-only schema with no additional properties.
- The iOS client constructs the server/tool/effect in code, sends only the
  device timezone, binds the response request ID, and accepts only the bounded
  local-clock result.
- SwiftUI exposes no generic URL, server, tool, schema, or argument input.
- No remote MCP transport, state-changing tool, automatic Chat invocation, or
  phone-side MCP runtime is accepted.

## Failure And Privacy Rules

- Unauthenticated, non-owner, stale/conflict, invalid request, overload,
  upstream failure, timeout, unavailable service, and network failures map to
  fixed public states without raw exception text.
- Provider secrets and private configuration never enter response models,
  display state, logs, screenshots, or exported state.
- Simulator previews contain synthetic data only and are compiled only for the
  simulator target environment.

## Explicit Non-Scope

This acceptance does not add a real Provider endpoint or credential, a trusted
Provider health prober, default Provider executor, main-Chat Provider routing,
remote MCP server, state-changing tool, deployment, production configuration,
real private/health data, TestFlight, or App Store distribution.

Source rollback is to revert product commit `c550d4b`. No service, database, or
deployment rollback exists because none was changed.
