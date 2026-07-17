# Chat Sonnet Default Experiment

Date: 2026-07-17

Status: rejected as the default model under the current latency acceptance
criteria; the live API was rolled back to the prior Opus default.

## Scope And Authorization

- Task level: `L3 repair execution`.
- Authorized change: replace only `RELAY_DEFAULT_MODEL` with
  `claude-sonnet-4-6`; preserve the existing complex-request Opus route.
- Maximum allowed live turns: three owner-triggered temporary Chat turns.
- No automated Chat request was sent. No App reinstall, database restore, code
  change, Health, Provider/MCP, StackChan, VPS, or Cloudflare change was made.

## Baseline

The owner-confirmed pre-experiment Chat baseline was:

```text
conversation_messages=6
session_deltas=0
memory_atoms=0
model_usage_logs=3
```

A verified root-only rollback backup was used:
`/var/backups/xiaoxin-auth/20260717T174041+0800/sonnet-experiment-before`.

## Sonnet Measurements

Both owner-triggered requests were short, ordinary temporary turns. Both used
attempt 1, returned HTTP 200, matched the client trace, and completed through
the client's temporary-response contract (`memory_status=ephemeral`). API
telemetry marked both requests `temporary=true`.

| Sample | Client total | API | Model phase | Relay wait headers | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 4556.6 ms | 2534.1 ms | 2533.5 ms | 2138.0 ms | pass |
| 2 | 10324.3 ms | 8090.7 ms | 8090.2 ms | 7700.3 ms | hard fail |

The first sample was below the `5.5 s` median target and `8 s` per-sample
maximum. The second sample exceeded the hard `8 s` maximum, so the third
allowed sample was not sent. The two-sample median was approximately `7440.4
ms`, also above target. The variable wait remained the relay/model response
header phase; API pre-model, post-model, decode, and body-read work remained
negligible.

## Rollback And Post-Checks

The first rollback command exited before copying because it matched the backup
manifest path too strictly (`./xiaoxin.env`). It caused no state change. A
second attempt verified the backup SHA, atomically restored the environment,
validated Compose, and recreated only the API.

Post-rollback checks passed:

- Default model: `claude-opus-4-6-thinking`.
- Sonnet alias: `claude-sonnet-4-6`.
- Complex Opus alias: `claude-opus-4-6-thinking`.
- API image unchanged; API healthy with restart count zero.
- PostgreSQL container identity unchanged.
- `/healthz=200`, `/readyz=200`, `GET /v1/chat=405`,
  `/v1/auth/capabilities=200`, `/v1/auth/me=401`.
- Recent traceback/error/5xx count: zero.
- Chat baseline remained exactly `6/0/0/3` after both turns and rollback.
- No third Chat turn was sent.

## Judgment

Sonnet was functional and preserved the temporary Chat contract, but it did
not meet the current latency SLO because one of two samples exceeded the hard
maximum and the median also failed. The owner did not provide a separate
quality/tone acceptance statement before the latency failure, so quality is not
independently accepted or rejected by this experiment.

The retained default is Opus. Any next latency work should be a separately
named slice, with streaming/perceived-latency or relay/provider investigation
considered independently from default-model selection.

No commit or push was performed.
