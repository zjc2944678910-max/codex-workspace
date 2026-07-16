# Cloud Chat And StackChan Status Vertical v0.1

Status: local/default-off source acceptance at product `8dd90ae`.

## Accepted Boundary

- The deployed Cloud factory can compose the existing authenticated `/v1/chat`
  route with a concrete `ChatRuntime`, dedicated SQLite memory store, separate
  Chat and Health owner resolvers, and candidate-memory writes disabled.
- Chat activation fails closed unless the configured owner exists, account
  tokens are available, the memory path is absolute and separate from Cloud
  SQLite, and an HTTPS relay URL plus credential are configured.
- The default relay transport bounds successful response bodies to 1 MiB and
  requires JSON media type before decoding.
- Xiaoxin Compose keeps authenticated Chat off by default and gives Chat memory
  a dedicated persistent volume and backup/rollback boundary.
- iOS Core exposes an isolated StackChan wire v0.2 status transport with
  explicit enqueue and one-shot fetch calls. It uses strict local HTTP endpoint
  validation, a bearer credential provider, no redirect following, a 64 KiB
  streamed response limit, idempotent enqueue recovery, and exact
  command/device/requested-field correlation.
- The status transport is not installed by App, Host, a view model, or any
  factory. It performs no polling or background work unless a future caller
  explicitly invokes it.

## Explicit Exclusions

- No image build, deployment, public endpoint change, live credential, relay,
  Cloud request, Bridge listener, iPhone request, or physical StackChan command
  was used.
- No UI/Host injection, automatic status polling, background execution,
  firmware work, health transmission, or candidate-memory enablement is
  accepted.
- Product `8dd90ae` is local only in this acceptance; `origin/main` remains at
  `0e53f74` until a separate push is requested and succeeds.
- The GitNexus post-commit reindex was attempted with embeddings but could not
  acquire its local database lock. The required pre-commit staged change
  detection completed at LOW risk with zero affected execution flows.
