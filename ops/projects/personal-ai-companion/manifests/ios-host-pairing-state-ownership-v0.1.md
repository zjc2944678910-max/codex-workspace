# iOS Host Pairing State Ownership v0.1

Status: accepted and pushed at product `1abf23a`; local/default-off.

## Accepted Boundary

- The formal Host owns one stable `ReloadableLANBridgeClient`. Pairing replaces
  its target client instead of assigning a new AppContent identity.
- `bridgeRevision` is presentation-only. It synchronizes AppEnvironment and
  Device status descriptions and is never used as a SwiftUI `.id`.
- IdentityGate, AppEnvironment, ChatViewModel, DeviceControlViewModel, and
  StackChanStatusViewModel keep their object identity across Bridge replacement.
  Chat draft, temporary-conversation state, messages, and pending LCD request
  correlation therefore remain in memory.
- Each Chat or LCD request is bound to the Bridge that created its request ID.
  Pending results continue to poll that Bridge after replacement. Terminal and
  capacity-evicted IDs enter a bounded retired-ID set and fail closed instead of
  falling through to the replacement Bridge.
- A Bridge request-ID collision fails with an explicit router error and does
  not overwrite the existing active binding. Active bindings and retired IDs
  are each bounded to `128` entries.
- A valid StackChan status configuration creates one stable idle ViewModel
  without reading pairing credentials or creating a URL session. The latest
  paired credential and a fresh session are resolved only for an explicit
  manual refresh, so the same ViewModel can recover after pairing and use a
  rotated credential while retaining pending command correlation.

## Explicit Exclusions

- `XiaoxinAuthenticatedChatEnabled` and `StackChanV02StatusEnabled` remain
  explicit `false` in the formal Host plist.
- No real account token, Keychain item, Cloud request, LAN request, Bridge
  listener, iPhone, StackChan, or private data was used for acceptance.
- No deployment, image build, background polling, firmware
  change, audio, motion, camera, touch, health transfer, or memory enablement is
  accepted.
- A request-ID collision can leave the second Bridge command accepted but
  intentionally uncorrelated; the router reports failure rather than risking a
  cross-Bridge result. Real Bridge request IDs are expected to remain unique.
- Bridge-side expired-command cleanup is completed by the later 14D slice in
  the same product commit.
