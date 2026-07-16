# iOS Host Chat And StackChan Composition v0.1

Status: accepted and pushed at product `1abf23a`; local/default-off.

## Accepted Boundary

- The formal Host still enters the package through
  `PersonalAICompanionAppContent`, and authenticated Chat is constructed only
  inside the signed-in identity branch.
- A source contract now locks the complete Chat composition path:
  `Host -> IdentityGate -> XiaoxinChatClientFactory -> SignedInAppContent ->
  AppEnvironment -> ChatViewModel`.
- `XiaoxinAuthenticatedChatEnabled` is explicit `false` in the formal Host
  plist. The factory gate is evaluated before API endpoint and client
  construction.
- StackChan status has an independent explicit-false gate, fixed empty default
  device ID, strict local HTTP endpoint policy, paired-Bridge credential
  readiness check, and lazy session construction.
- The StackChan factory has injectable local test seams. Its behavior tests
  prove that default-off and invalid configuration construct no credential
  provider or session, missing/malformed credentials construct no session, and
  valid configuration creates only an idle ViewModel with zero requests.
- `RootView` owns the signed-in status ViewModel. The status screen exposes
  only battery, network, uptime, and bounded printable firmware after an
  explicit refresh. It performs no automatic polling or status call from
  `.task`, pull-to-refresh, foreground entry, or background work.
- First refresh performs one enqueue and one fetch. A pending follow-up performs
  one fetch only. Accepted enqueue state survives fetch failure; cancellation,
  reentry, stale completion, ready-to-new-command, page disappearance,
  backgrounding, and sign-out are covered by local state-machine behavior.
- LCD control remains the separate v0.1 `happy`/`neutral` allowlist. Status uses
  the v0.2 read-only status contract and only shares the explicitly paired
  StackChan Bridge principal, never a Cloud account token.

## Explicit Exclusions

- Both feature flags remain disabled in the formal Host configuration.
- No real account token, Keychain item, URL session request, Cloud request,
  Bridge listener, LAN request, iPhone request, StackChan command, or private
  data was used for acceptance.
- No image build, deployment, public endpoint change, firmware change,
  background polling, audio, motion, camera, touch, health transmission, or
  memory-candidate enablement is accepted.
- The accepted source is committed and pushed at product `1abf23a`.
- Cancellation while an enqueue has reached the Bridge but before its response
  returns remains an unavoidable delivery-ambiguity window; no live reliability
  claim is made.
