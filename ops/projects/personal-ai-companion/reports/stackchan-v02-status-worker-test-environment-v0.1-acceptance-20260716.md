# StackChan v0.2 Status Worker Test Environment v0.1 Acceptance

Date: 2026-07-17

- Product base: `1abf23a`
- Product revision: uncommitted local worktree
- Remote baseline: product `origin/main@1abf23a`
- Manifest: [stackchan-v02-status-worker-test-environment-v0.1.md](../manifests/stackchan-v02-status-worker-test-environment-v0.1.md)

## Accepted Result

The previously absent test-machine consumer now exists as a bounded,
status-only v0.2 worker. It validates the closed Bridge poll response and
command envelope, freezes the read-only machine result in an owner-only SQLite
journal, submits that primary result, and only then ACKs the command. Exact
payloads survive worker restart and ambiguous response loss.

The implementation fails closed on non-status commands, unrepresentable status
fields, public or hostname-based endpoints, redirects, malformed or oversized
responses, credential/journal permission drift, correlation mismatch, and
terminal HTTP errors. Only transport and 5xx failures retry, with a fixed
three-retry cap and the original TTL boundary.

The physical-device session also repaired the App result lifecycle. One manual
refresh now performs a bounded foreground poll for the accepted command instead
of requiring a second owner tap after the device result arrives. It attempts at
most nine reads at 500 ms intervals, remains cancellable on page exit, and does
not add launch-time, background, or unprompted polling.

## Field Evidence

- A signed current-source build was installed and launched on an iPhone 15 Pro
  Max with temporary, non-committed status configuration. Authenticated Cloud
  Chat remained disabled.
- The Mac Bridge allowlist contained only the Mac, iPhone, and StackChan test
  addresses. The credential remained runtime-only; the pairing clipboard was
  cleared immediately.
- The UIFlow2 worker ran from the CoreS3 `/flash` test files without modifying
  `boot.py`, `main.py`, display, motion, audio, camera, or touch behavior.
- The accepted command produced `202` enqueue, bounded `404` pending reads,
  `202` primary status submission, `200` App result retrieval, and `200` ACK
  for one command and device identity.
- The owner-observed iOS result was battery `100%`, network `Wi-Fi`, uptime
  `94 hours 1 minute`, and firmware `uiflow2-v2.4.8`.
- The worker exited after processing the command, Bridge queue depth returned
  to `0`, and no automatic follow-up request was observed.
- The non-sensitive screenshot is retained outside Git under
  `state/project-data/personal-ai-companion/field-evidence/`.

## Verification

- Focused CPython/UIFlow2 status-worker tests: `30` passed.
- All StackChan Python tests: `125` passed.
- Full Python suite: `1796` passed with the one existing Starlette/TestClient
  deprecation warning.
- Ruff targeted static check: passed.
- Product and workspace `git diff --check`: passed.
- Swift XCTest: `16` passed.
- `PersonalAICompanionStackChanV02StatusTransportSmoke`: passed.
- `PersonalAICompanionAppSupportSmoke`: passed, including automatic
  pending-to-ready convergence and bounded pending exhaustion.
- Formal Host values remain `StackChanV02StatusEnabled=false`, empty Bridge URL,
  empty status device ID, and `XiaoxinAuthenticatedChatEnabled=false`.
- Independent read-only review findings for retry classification, non-status
  ACK, journal permissions/symlinks, metadata subset, hostname resolution,
  token-file safety, and ACK response-loss recovery were repaired and covered.

This acceptance is limited to one owner-triggered test-LAN status read. It does
not accept unattended worker/Bridge operation, Bridge restart durability,
clock-skew tolerance, production configuration, public access, deployment,
Cloud Chat, other device commands, commit, or push.

A separately authorized continuous-runtime follow-up is recorded in
[stackchan-v02-status-continuous-runtime-acceptance-20260717.md](stackchan-v02-status-continuous-runtime-acceptance-20260717.md).
That report does not retroactively broaden this original one-shot test-session
boundary.
