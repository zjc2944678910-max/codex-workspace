# Standard Chat Memory And Girlfriend-Style Repair

Date: 2026-07-17

Status: the requested owner-only standard Chat integration is live and
server-side accepted. The client visual confirmation is recorded as an open
owner-observed checkpoint because no saved iOS console capture was available
for the final turn.

## Authorization And Scope

- Task level: `L3 repair execution` after the owner explicitly said
  `进入修复阶段`.
- Live scope was limited to the authenticated Xiaoxin Chat API image,
  read-only girlfriend-style profile mount, isolated Chat SQLite storage, and
  the same-bundle signed iOS Chat client.
- Health, Provider/MCP, StackChan, VPS, Cloudflare, device actions, account
  mutation, database schema migration, commit, and push were outside this
  slice.
- No new Chat request was sent by Codex; all Chat turns below were triggered by
  the owner in the iOS App.

## Implemented Contract

- Standard authenticated Chat uses persistent memory mode and returns
  `memory_status=enabled`.
- A standard turn sends `memory_opt_in={"requested":true}` only when the
  owner has enabled the iOS memory setting. Temporary Chat never sends this
  opt-in and remains ephemeral.
- Candidate extraction runs only after a successful, non-empty model reply.
  Candidates remain review-required and are never auto-promoted.
- The authenticated runtime injects the read-only `girlfriend_style` profile
  into the model prompt. The profile is mounted at
  `/data/style-profile/girlfriend_style_profile.json` with read-only access.
- The iOS Chat transport timeout is 90 seconds. The response still requires a
  matching conversation ID, the expected memory status, and a non-empty reply.

## Live Deployment Evidence

- API image: `xiaoxin-cloud-api:20260717T184100-chat-memory-style`.
- API and PostgreSQL containers were healthy with restart count `0`.
- Public `/healthz`, `/readyz`, and `/v1/auth/capabilities` each returned
  HTTP `200`; `GET /v1/chat` returned the expected `405` method response.
- API rootfs remained read-only, `no-new-privileges` remained enabled, and all
  Linux capabilities remained dropped.
- The style profile existed in the read-only mount and reported profile ID
  `girlfriend_style`.
- The active default model remained `claude-opus-4-6-thinking`; the rejected
  Sonnet experiment and its `6/0/0/3` rollback baseline were unchanged by this
  slice.

## Owner-Triggered Standard Chat Evidence

The pre-turn evidence was:

```text
conversation_messages=12
session_deltas=3
memory_atoms=2
open_reviews=2
model_usage_logs=6
```

After the owner sent the final preference turn in the updated App, the
read-only database check was:

```text
conversation_messages=14
session_deltas=4
memory_atoms=2
open_reviews=2
model_usage_logs=7
```

The delta is exactly one successful standard turn: one user/assistant message
pair, one session delta, and one usage record. The two memory atoms remained
`preference / owner_private / candidate`, and both review items remained open;
there was no automatic promotion.

The API timing log for the final turn reported:

```text
status=200
api_ms=4292.732
model_phase_ms=4211.091
temporary=False
```

The matching relay timing was approximately `4187.903 ms` total with a
`3808.366 ms` response-header wait. No traceback was present. This is below
the repaired 90-second iOS transport timeout and explains why the prior
30-second failure surface was not expected on this turn.

## Verification

- Focused Python regression: `122 passed`, one existing Starlette deprecation
  warning.
- `git diff --check` passed.
- The signed same-bundle iOS build was previously verified and installed with
  the existing login session retained; source inspection confirms the 90
  second timeout and standard-only opt-in wire behavior.
- Server evidence proves the final request completed successfully. A saved
  iOS console line proving the UI rendered the final reply was not available,
  so the client-visible portion remains owner-confirmed but not independently
  recorded.

## Rollback And Residual Risk

- API rollback: restore the root-only `20260717T184100+0800/chat-memory-style-before`
  backup and recreate only the API. Keep the Chat SQLite volume intact unless
  disaster recovery is explicitly required.
- iOS rollback: reinstall the prior accepted same-bundle App without clearing
  Keychain or the local login session.
- The relay/provider response-header wait remains variable (roughly 3.8 to
  50 seconds in the observed samples). Streaming and model/provider changes
  are separate repair slices and were not silently enabled.
- Client visual acknowledgement of the final turn is the only remaining
  acceptance gap in this report. It does not weaken the server-side evidence
  that memory/style wiring and candidate authorization executed.

## Next Slice

Do not broaden this repair. The next value-ordered slice is a separately
authorized quality/latency decision: either a pending/streaming UI improvement
or a bounded relay/provider latency investigation. Standard long-term recall,
Health, Provider/MCP, device actions, and release publication remain separate
acceptance tracks.
