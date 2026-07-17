# Standard Persisted Chat And Long-Term Memory Preflight

Date: 2026-07-17

Status: read-only preflight complete. No live state, database, App, or product
code was changed by this preflight.

## Current Boundary

The deployed authenticated `/v1/chat` route maps `temporary=true` to
`ChatMemoryMode.EPHEMERAL` and all non-temporary requests to
`ChatMemoryMode.BOUNDED`. The route passes `allow_candidate_write=False`.

Therefore a non-temporary request can persist bounded conversation context and
one usage record, but it cannot create or promote long-term `memory_atoms`.
This is not yet an accepted standard persisted Chat workflow and is not a real
long-term memory workflow.

The existing girlfriend-style implementation is also not active in the current
deployed composition. The route passes `style_rewrite=True`, but
`create_deployed_cloud_app` constructs `ModelRouter` without a style profile or
profile path. With no loaded profile, the router's style evaluation and rewrite
path are disabled. The local style profile, scoring, revision prompt, and
consent-boundary code remain available and must be included in the next
companion Chat slice rather than deferred as unrelated polish.

The shared runtime already has a separate `PERSISTENT` mode. In that mode it
prunes bounded context, ingests the envelope, optionally invokes the candidate
writer, recalls approved memory, records usage, and records the assistant
reply. The authenticated route deliberately does not expose that mode or the
candidate writer today.

## Confirmed Local Evidence

- The authenticated response contract is `memory_status=ephemeral` for
  temporary turns and `memory_status=enabled` for memory-enabled turns.
- Bounded success persistence is one SQLite transaction containing prune, user
  message, assistant message, and usage-log writes.
- Bounded failure tests cover rollback at each write stage.
- Temporary Chat has no `conversation_messages`, `session_deltas`,
  `memory_atoms`, or `model_usage_logs` side effects.
- Candidate writing is feature-off by default and has trusted-owner and
  consent/review gates in the local implementation.
- Focused local verification passed: `66 passed`, one existing deprecation
  warning only.

## Material Gaps For Real Long-Term Memory

- The deployed route does not enable ordinary-chat candidate extraction.
- Candidate atom content is still inline; vault crypto is not wired into the
  persistent memory store/service.
- There is no automatic ordinary-chat extraction, semantic deduplication,
  embedding/vector retrieval, retention executor, secure deletion, or complete
  owner memory-admin workflow.
- No real/private long-term memory turn has been accepted. The current live
  Chat baseline remains `6/0/0/3`.

## Recommended Slice Order

### Slice A: Local Owner-Companion Chat Contract

Keep this local and synthetic first. Expose no new live capability. Include the
existing persona implementation and approved-memory recall in the same
contract; do not silently enable real candidate writes. Acceptance:

1. A non-temporary authenticated-style harness turn returns
   `memory_status=enabled` and receives a loaded girlfriend-style profile.
2. Style evaluation reports the expected profile identity, and a below-threshold
   draft follows the existing bounded revision path without leaking raw source
   samples.
3. An approved, scope-compatible memory is recalled and projected into the
   prompt; unapproved or disallowed memory remains absent.
4. A successful turn atomically adds exactly two conversation rows and one
   usage row, while `memory_atoms` remains unchanged.
5. A following same-session turn receives bounded recent context.
6. Model failure, empty reply, and every persistence-stage failure leave the
   pre-turn counts unchanged.
7. Candidate creation remains explicit-opt-in and owner-review gated; it is not
   switched on merely by loading the persona.
8. Focused tests and the full local suite pass without product or ops drift.

### Slice B: Separate Owner-Approved Live Persisted Turn

This is a later L3 repair card, not authorized by this preflight. It requires a
fresh root-only backup, explicit expected count deltas from `6/0/0/3`, a named
session and retention decision, health/auth/security parity checks, and an
acknowledged fact that routine API rollback cannot erase intentionally persisted
Chat rows.

### Slice C: Real Long-Term Memory Admission

Only after Slice A and a deliberate data-retention decision: wire the existing
owner-review candidate path to a real owner boundary, then separately address
vault-backed atom storage, retention execution, secure deletion, and semantic
recall. Each is its own acceptance slice; none is implied by standard Chat.

## Decision

The next implementation target should be Slice A, local-only owner-companion
Chat contract coverage. Do not enable candidate writes, change the live route,
write the real database, or issue a real persisted Chat request without a new
explicit `进入修复阶段` authorization for that named slice.
