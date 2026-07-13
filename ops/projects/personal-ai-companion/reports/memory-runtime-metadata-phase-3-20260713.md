# PAC Memory Runtime Metadata Phase 3

Date: 2026-07-13

## Scope And Authority

This was an L3-authorized local source and synthetic-database implementation
only. Product work was isolated on
`codex/pac-memory-runtime-metadata-phase-3` from baseline
`6feb14252eee46f30912034652ef8efb5c4742e5`. The product result is
`f758875565bab57fa8bbf614b0da9f6cf82f6801`.

The authorization did not include the canonical checkout, any existing or real
database, private chats/profile/health data, vault material, live/NAS/cloud
systems, service restarts, deployment, retention execution, or deletion.

## Implemented

- Migration `0003_add_memory_atom_runtime_metadata` additively adds nullable
  `fact_key` and `expires_at_ms` columns to `memory_atoms`.
- `MemoryAtom`, row deserialization, candidate writes, review-candidate writes,
  and serialized outputs carry both fields. Rows without the new columns and
  legacy NULL values read as `None`.
- The existing bounded review-turn rule persists its already-derived
  `fact_key`. Ordinary candidate ingest only persists a key when the existing
  canonical-text rule can derive one; it does not add broad NLP inference or
  automatic ordinary-chat extraction.
- `expires_at_ms` defaults to `None` and is accepted only as an explicit local
  service/store input after integer and SQLite-range validation. Invalid values
  fail before service writes. No scheduler, retention executor, or expiry
  deletion was added.
- Recall uses durable `fact_key` before query scoring. Only a NULL key uses the
  pre-existing bounded parser fallback. The old value therefore cannot become
  current merely because query wording names it.
- Recall passes one reference timestamp to both store reads and local
  inspection. The store filters expired or malformed non-NULL expiry metadata
  in SQL; inspection remains a second fail-closed guard. NULL remains
  non-expiring metadata.
- The store now places requested status filtering in SQL before loading rows,
  so a promoted recall query does not load rejected/candidate payload rows and
  disclosure gates remain upstream of authorized content inspection.
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
  the bounded parser fallback.
- Expired newest values fall back to a live prior fact without deleting the
  expired atom; expired-only recall returns no memory and does not increase the
  existing `blocked_count` contract.
- Existing and expanded memory tests cover duplicate/conflict behavior,
  scope/privacy/never-quote projection, protected-store fail-closed behavior,
  migration history, and API-compatible additive response fields.
- Commands run in the isolated worktree: focused relevant suite `109 passed`,
  `tests/test_memory_*.py` `410 passed`, full pytest `1062 passed`, changed
  scope Ruff, `compileall`, and `git diff --check`. The test process emitted
  one existing Starlette TestClient deprecation warning.
- GitNexus staged and compare checks found exactly the expected eight product
  files. The shared memory contract is correctly reported CRITICAL in graph
  reach; manual migration, serialization, disclosure, and expiry review plus
  the full suite were completed before commit.

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

- Product rollback anchor: `6feb14252eee46f30912034652ef8efb5c4742e5`.
- Ops rollback anchor: `2e45b62f9a6343f6788015a999849debff41e8fa`.
- No merge or push was performed. Rollback is deleting the isolated Phase 3
  branches/worktrees or resetting them to their stated anchors; it requires no
  database action.
