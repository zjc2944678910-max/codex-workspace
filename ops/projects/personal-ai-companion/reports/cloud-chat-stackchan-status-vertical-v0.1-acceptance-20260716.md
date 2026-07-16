# Cloud Chat And StackChan Status Vertical v0.1 Acceptance

Date: 2026-07-16

- Product commit: local `8dd90ae feat(integration): wire cloud chat and StackChan status`
- Remote baseline: product `origin/main@0e53f74`
- Manifest: [cloud-chat-stackchan-status-vertical-v0.1.md](../manifests/cloud-chat-stackchan-status-vertical-v0.1.md)

## Accepted Result

The product now has the first local source-level verticals for the deployed
Cloud factory to construct its existing authenticated Chat route and for an iOS
caller to issue a read-only StackChan wire v0.2 status request. Both remain
explicitly gated and default off. The Cloud route requires a real configured
owner, isolated memory database, account tokens, and credentialed HTTPS relay;
the StackChan client remains outside all App/UI/Host factories and never polls
automatically.

Independent review found and the accepted patch repaired relay-key bypass,
Cloud/chat SQLite aliasing, falsey Health resolver fallback, missing owner
existence checks, unbounded relay reads, insecure deployed relay URLs, buffered
StackChan responses, redirect following, incomplete enqueue replay handling,
and status request/result field drift.

## Verification

- Full Python suite: `1761 passed, 1 existing Starlette/TestClient warning`.
- Full Swift package build: passed.
- New StackChan v0.2 status transport smoke: passed.
- Existing wire-contract, Bridge-factory, and Core smoke executables: passed.
- Ruff lint and format checks: passed.
- Compose static expansion and `git diff --check`: passed.
- GitNexus staged change detection: LOW risk, zero affected execution flows.

No live service, real credential, real health data, iPhone network request,
Bridge listener, or physical device was contacted. Deployment, UI injection,
field verification, and push remain separate actions.
