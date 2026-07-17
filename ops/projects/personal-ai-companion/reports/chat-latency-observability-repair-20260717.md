# Authenticated Chat Latency Observability Repair

Date: 2026-07-17

Status: the latency observability path is deployed and accepted for two
correlated temporary Chat measurements. Attribution is complete; no model,
timeout, relay, streaming, database, Health, Provider/MCP, StackChan, VPS, or
Cloudflare change was made.

## Authorization And Scope

- Task level: L3 repair execution after the owner explicitly said
  `进入修复阶段`.
- Live changes were limited to an immutable Xiaoxin API image, API-only
  recreation, and replacement of the same-bundle signed iOS App.
- At most three owner-triggered temporary Chat turns were allowed. Three were
  used: the first confirmed the business response but exposed missing log-sink
  integration; the next two produced complete correlated timings.
- No automated Chat request, real credential replay, standard-mode acceptance,
  model switch, timeout change, database migration, account mutation, commit,
  or push was performed.

## Accepted Deployment

- Current API image:
  `xiaoxin-cloud-api:20260717T170800-chat-latency`, NAS image ID
  `sha256:1b785f1a4336175186d86ca0d46232c8e5c6c76f22e04a5bee1bde9a8ee0015d`.
- Current API container:
  `f20a286a6f31e3b27b582d0b4066f8898018d1956aea8dc5785341de9aa8ab94`.
- PostgreSQL container remained unchanged:
  `bff211a48f2922d0c3351bed1d6a8b4f10b72ed578b92c34477f75f33ddb072a`.
- Signed App:
  `scratch/projects/personal-ai-companion/ios-chat-latency-candidate-20260717T170800/artifacts/DerivedData/Build/Products/Debug-iphoneos/PersonalAICompanionHost.app`.
  Bundle ID is `xyz.nodezjc12348888.xiaoxin`, Team ID is `Y38TU585HM`,
  and the Host binary SHA-256 is
  `d3c9e66b47ea5ab10a235003ae569b401fbff66bc84ad2545e2f15bde8db91c3`.
- Both authenticated Chat and StackChan status gates remain enabled in the
  installed field App. Existing login data survived both same-bundle
  replacements.

The first observability image,
`xiaoxin-cloud-api:20260717T135348-chat-latency`, calculated trace headers and
`Server-Timing` correctly but wrote server evidence to an unconfigured module
logger. The iOS App used unified OSLog, which `devicectl --console` does not
forward. The superseding image routes latency evidence through
`uvicorn.error`; the iOS diagnostic build mirrors the same content-free
values to stdout. No request or response contract changed.

## Correlated Measurements

Both accepted samples were owner-triggered in `临时对话`, returned HTTP
`200`, matched the same random trace ID on iOS and API, and were accepted by
the client only with `memory_status=ephemeral`.

| Metric | Sample 2 | Sample 3 |
| --- | ---: | ---: |
| Client total | 5281.3 ms | 10382.5 ms |
| Token lookup inside Chat | 0.35 ms | 0.04 ms |
| Client HTTP | 5278.9 ms | 10381.2 ms |
| Server API | 4590.5 ms | 9624.7 ms |
| Pre-model | 0.13 ms | 0.11 ms |
| Model phase | 4589.9 ms | 9624.2 ms |
| Post-model | 0.03 ms | 0.01 ms |
| Relay total | 4567.7 ms | 9610.4 ms |
| Relay connect/send | 375.5 ms | 362.4 ms |
| Relay wait for headers | 4192.1 ms | 9248.0 ms |
| Relay read body | 0.08 ms | 0.05 ms |
| Client HTTP minus server API | 688.4 ms | 756.5 ms |

The two instrumented client totals averaged `7.832 s` and ranged from
`5.281 s` to `10.383 s`. Relay header wait increased by `5.056 s`; this
accounts for about 99% of the `5.101 s` sample-to-sample total increase.

## Judgment

Confirmed:

- Token retrieval is not the latency source in either correlated Chat turn.
  Both completed on attempt 1 without an in-turn `401` or refresh.
- API pre-model, post-model, JSON decode, and response-body read are negligible.
- The dominant and variable component is waiting for the relay response headers
  during the model phase. It represented about 92% and 96% of relay time.
- The iPhone/public path contributes a comparatively stable secondary cost of
  about `0.69-0.76 s`.
- The current non-streaming contract waits for the complete upstream response
  and full JSON before the UI changes from pending to reply. It therefore makes
  the whole model wait visible as an unprogressed pause.
- The earlier `16.3 s` completion-to-completion interval mixed launch/session
  refresh and owner interaction with Chat because request-start evidence did
  not yet exist. It is not a valid pure Chat RTT.

Unconfirmed:

- Available evidence cannot separate relay queueing from provider-side model
  inference inside the response-header wait.
- Time to first model token is not measurable because the relay/API/iOS path is
  non-streaming.
- Two instrumented turns establish the dominant stage but not a latency SLO or
  long-run percentile distribution.

## Persistence Drift And Integrity

- Before this repair, read-only preflight found
  `conversation_messages=4`, `model_usage_logs=2`,
  `session_deltas=0`, and `memory_atoms=0`.
- The persisted rows belong to one session and were created around
  `2026-07-17T12:51:19-12:51:52+08:00`. Their content, owner identifier, and
  conversation identifier were not read.
- This is new evidence that standard-mode persistence was exercised outside the
  original accepted temporary turn. It is not a standard persisted Chat
  acceptance.
- All three temporary turns in this repair left the exact `4/0/0/2` baseline
  unchanged. Final API and DB health are `healthy`, restart counts are zero,
  and recent traceback/error count is zero.

## Verification

- First isolated candidate: `1772` full Python tests, `62` focused tests,
  and `30` Swift tests passed.
- Log-sink repair candidate: `62` focused Python tests, `30` Swift tests,
  Ruff, compileall, codesign, plist gate/endpoint checks, image source hashes,
  default gate-off probe, archive integrity, public health/auth parity, and
  API-only cutover checks passed.
- GitNexus reports LOW impact for the two concrete server functions and
  CRITICAL class-level iOS impact due the package-wide shared import surface.
  The complete Swift suite and signed device build were therefore mandatory.
- Claude review was retried and remained unavailable because the local CLI is
  not logged in. Sub2API tools were not available.

## Rollback And Next Decision

Verified root-only rollback anchors:

- `/var/backups/xiaoxin-auth/20260717T164318+0800/chat-latency-before`
- `/var/backups/xiaoxin-auth/20260717T171455+0800/chat-latency-logfix-before`

Restore the selected backup environment, validate Compose, and recreate only
the API. Keep PostgreSQL and Chat SQLite data untouched during routine rollback.
Reinstall the prior accepted same-bundle App if iOS rollback is required.

Two earlier backup attempts at `16:41:28` and `16:42:08` stopped before a
complete manifest because this NAS Docker engine cannot `docker cp` files
from container tmpfs. They remain root-only incomplete evidence and are not
rollback anchors.

The smallest actual-latency experiment is a separately authorized model/config
comparison, with response quality and cost as explicit acceptance criteria.
The smallest perceived-latency improvement is an immediate pending indicator;
end-to-end streaming would additionally reduce time to first visible content
but is a larger API/iOS contract slice. No such change is authorized by this
report.
