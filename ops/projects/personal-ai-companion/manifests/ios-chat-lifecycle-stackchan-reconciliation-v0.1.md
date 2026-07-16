# iOS Chat Lifecycle And StackChan Reconciliation v0.1

Status: accepted and pushed at product `1abf23a`; local/default-off.

## Accepted Boundary

- The authenticated Chat factory has an internal injectable composition path.
  Its explicit gate and service-URL allowlist run before URL session creation.
- Four synthetic XCTest cases execute the factory lifecycle without reading
  the formal Host bundle, Keychain, or a real API: default-off, invalid URL,
  `401 -> 200` identity refresh, and `401 -> 401` session rejection.
- Successful Chat refresh updates the signed-in IdentityGate session exactly
  once and publishes the authenticated reply through `ChatViewModel`.
  A second `401` signs IdentityGate out and leaves ChatViewModel with its fixed
  public failure state and no stuck sending state.
- StackChan status now distinguishes no submission, uncertain enqueue, and
  accepted enqueue. Cancellation before the POST response retains the command.
- A retry before the five-second local deadline reuses the exact command ID and
  idempotency key. A retry at or after the deadline creates a new command.
- Late completion from the old enqueue cannot overwrite a replacement ready
  result. A ready result clears retained submission state so the next manual
  refresh creates a new command.

## Explicit Exclusions

- `XiaoxinAuthenticatedChatEnabled` and `StackChanV02StatusEnabled` remain
  explicit `false` in the formal Host plist.
- No real account token, Keychain item, Cloud request, LAN request, Bridge
  listener, iPhone, StackChan, or private data was used for acceptance.
- No deployment, image build, background polling, firmware
  change, audio, motion, camera, touch, health transfer, or memory enablement is
  accepted.
- Pairing-safe AppContent identity ownership is completed by the later 14C
  slice in the same product commit.
- Bridge-side expired-command cleanup is completed by the later 14D slice in
  the same product commit.
