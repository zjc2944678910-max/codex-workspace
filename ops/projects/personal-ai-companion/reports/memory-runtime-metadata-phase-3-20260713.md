# PAC Memory Runtime Metadata Phase 3

Date: 2026-07-13

Status: accepted; product source branch and canonical branch are pushed at
`199638a`; ops acceptance commit `3ca15bd` is pushed to its source branch and
workspace `main`

## Scope And Authority

This was an L3-authorized local source and synthetic-database implementation
only. Product work was isolated and accepted on
`codex/pac-memory-runtime-metadata-phase-3` from baseline
`6feb14252eee46f30912034652ef8efb5c4742e5`. The product results are initial
implementation `f758875565bab57fa8bbf614b0da9f6cf82f6801` and local repair
`1d38c3d1053c47f5fd33b22cf1a43f799b30f0ad`, followed by source-event replay
repair `199638ab929c5f30008f203d31e2c8db502b4279`.

The authorization did not include the canonical checkout, any existing or real
database, private chats/profile/health data, vault material, live/NAS/cloud
systems, service restarts, deployment, retention execution, or deletion.
The later fast-forward was a separate L1 Git integration of already accepted
source. It did not expand the original L3 authority or authorize any excluded
data/runtime action.

## Implemented

- Migration `0003_add_memory_atom_runtime_metadata` additively adds nullable
  `fact_key` and `expires_at_ms` columns to `memory_atoms`.
- `MemoryAtom`, row deserialization, candidate writes, review-candidate writes,
  and serialized outputs carry both fields. Rows without the new columns and
  legacy NULL values read as `None`.
- The existing bounded review-turn rule persists its already-derived
  `fact_key`. Recall and review conflict selection prefer durable identity; a
  NULL key alone uses the bounded parser fallback. Malformed non-NULL metadata
  does not silently fall back to payload parsing. Ordinary candidate ingest only
  persists a key when the existing canonical-text rule can derive one; it does
  not add broad NLP inference or automatic ordinary-chat extraction.
- `expires_at_ms` defaults to `None` and is accepted only as an explicit local
  service/store input after integer and SQLite-range validation. Invalid values
  fail before service writes. The explicit owner-gated `/v1/memory/ingest` API
  forwards a valid value, keeps missing input as NULL, and returns HTTP 400 with
  `invalid_runtime_expiry` for bool, float, negative, or overflow input. No
  scheduler, retention executor, expiry deletion, or ordinary-chat inference
  was added.
- Recall uses durable `fact_key` before query scoring. Only a NULL key uses the
  pre-existing bounded parser fallback. The old value therefore cannot become
  current merely because query wording names it.
- Source-event replay is expiry-independent: a matching event ID remains a
  durable idempotency record even after its atom expires, returning the original
  duplicate or the fail-closed `source_event_candidate_conflict` without a new
  row. Only the active review duplicate/conflict set and recall receive the
  reference timestamp and filter expired or malformed non-NULL expiry metadata.
  Inspection remains a second fail-closed guard. NULL remains non-expiring
  metadata.
- Recall is metadata-first: the initial SQL query selects only atom identity,
  disclosure/class metadata, expiry, fact identity, confidence, and timestamp.
  Class policy plus `MemoryDisclosure` run before a second query loads content
  for already-authorized atom IDs. SQLite authorizer and trace coverage confirm
  an unknown viewer never reads a private promoted `memory_atoms.content`
  column. Requested statuses still filter in SQL.
- Privacy-denied metadata is not query-scored and `RecallResult.blocked_count`
  is intentionally `0` for that path. Retaining the former query-hit count
  would require denied payload reads or disclose denied-memory metadata. A
  separately authorized payload may still be filtered later by ModelRouter,
  whose own `blocked_memory_count` remains a distinct projection metric.
- The protected-store gate remains fail-closed: a protected database must
  already be registered at the now-latest schema and cannot be auto-migrated.

## Synthetic And Temporary-DB Verification

- Registered v2 synthetic schema upgrade to v3 preserves a legacy atom with
  NULL metadata; a temporary database restart preserves a durable `fact_key`
  and the maximum valid SQLite timestamp.
- Invalid, boolean, negative, and overflow expiry inputs are rejected before a
  candidate row is written.
- Review candidate -> persisted `fact_key` -> promote -> recall is covered.
  Persisted identity wins before query wording, while NULL legacy identity uses
  the bounded parser fallback; different non-NULL keys do not use content
  fallback. Expired duplicate/conflict candidates do not block a replacement or
  escalate its review priority, and the expired atom remains undeleted.
- Expired newest values fall back to a live prior fact without deleting the
  expired atom; expired-only recall returns no memory and does not increase the
  existing `blocked_count` contract.
- Expired source-event replay coverage proves that the same event with the same
  candidate remains a duplicate, the same event with changed content remains
  fail-closed, and a different event can create a replacement through the
  expiry-filtered active candidate set. Each case preserves the expired atom
  and prevents source-event row growth for the replayed ID.
- Existing and expanded memory tests cover duplicate/conflict behavior,
  scope/privacy/never-quote projection, protected-store fail-closed behavior,
  migration history, metadata-first authorizer/read order, and API-compatible
  additive response fields.
- Commands run in the isolated worktree: focused source-event regressions
  `3 passed`, complete review-turn file `32 passed`, `tests/test_memory_*.py`
  `419 passed`, and full pytest `1072 passed`; changed scope Ruff,
  `compileall`, and `git diff --check` also passed. The test process emitted one
  existing Starlette TestClient deprecation warning.
- GitNexus staged and compare checks found exactly the expected three
  source-event repair product files. The shared memory contract is correctly
  reported CRITICAL in graph reach (60 changed symbols; 63 staged and 55 compare
  affected); manual metadata/read-order, serialization, disclosure, identity,
  expiry, replay, and API review plus the full suite were completed before
  commit.

## Unconfirmed And L3-Excluded

- No real `memory.db` or other existing database was opened, inspected,
  migrated, or changed. The protected-store coverage used only temporary test
  files.
- No real runtime producer, private-data ingestion, retention policy executor,
  scheduler, hard delete, vault/key wiring, vector/semantic recall, or ordinary
  `/v1/chat` automatic extraction was enabled.
- No NAS/VPS/live/cloud access, service restart, deployment, configuration
  change, or credential/private-material access occurred.
- This is a bounded local memory metadata seam, not a claim that production
  memory integration or real-data migration is complete.

## Rollback

- Phase 3-only product rollback anchor:
  `6feb14252eee46f30912034652ef8efb5c4742e5`.
- Entire Phase 2+3 integration rollback anchor:
  `e15e553e2aed5739de37f7f6a05e954c06a80b1b`.
- Ops rollback anchor: `2e45b62f9a6343f6788015a999849debff41e8fa`.
- The source branch `codex/pac-memory-runtime-metadata-phase-3` was pushed as a
  rollback/evidence anchor, and remote canonical
  `codex/initial-private-publish` was fast-forwarded from `e15e553` to
  `199638a`. No deployment or database action was performed.
- A shared-branch rollback should revert the Phase 2/3 product commits rather
  than rewrite remote history. The isolated worktrees may still be removed
  after integration; no database rollback is required because no real database
  was opened or migrated.
