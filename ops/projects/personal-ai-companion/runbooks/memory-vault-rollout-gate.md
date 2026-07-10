# Memory Vault Rollout Gate

Date: 2026-07-10

Status: L1 pre-rollout gate only. This runbook is not an execution procedure.

## Route Lock And Safety Boundary

- Target project: `personal-ai-companion`
- Product root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Owned document: `ops/projects/personal-ai-companion/runbooks/memory-vault-rollout-gate.md`
- Forbidden in this L1 pass: `memory.db`, `.env*`, `state/`, real chat/profile
  data, key material, DB/schema writes, services, network, Git, and GitHub.

No action in this document authorizes access to a real database or key. Every
action that opens a real `memory.db`, reads or creates key material, writes a
backup, changes schema/data, pauses writers, or changes a running service is L3
and requires the user to say `进入修复阶段` in the then-current task. If that
authorization is absent, record the proposed action as pending and stop.

## Confirmed Readiness Evidence

The following is confirmed from source and synthetic tests only, not from a
real store or secret:

- The present migration registry contains the initial memory tables and a
  `class_policies` migration, but no vault-entry/key-version/access-log schema:
  `src/personal_ai_companion/memory/migrations.py:53-162`.
- A protected project database has a read-only preflight: it opens SQLite with
  `mode=ro`, sets `query_only=ON`, and rejects anything other than a registered,
  latest, no-op schema state:
  `src/personal_ai_companion/memory/migrations.py:304-356`.
- Schema inspection is documented and implemented as schema/version metadata
  only, never memory-content reads; migration planning is deterministic and
  non-mutating:
  `src/personal_ai_companion/memory/migrations.py:634-844`.
- Applying a migration begins an immediate transaction and rolls back on an
  exception; it is still a state-changing operation and therefore L3:
  `src/personal_ai_companion/memory/migrations.py:874-922`.
- Vault records bind owner, atom, handle, scope, privacy class, and content
  version as authenticated associated data (AAD):
  `src/personal_ai_companion/memory/vault.py:201-281` and
  `src/personal_ai_companion/memory/vault.py:588-637`.
- The codec serializes no plaintext field, does not discover/persist keys, and
  requires exact AAD equality when decrypting:
  `src/personal_ai_companion/memory/vault_record.py:141-285`.
- Key bundles are generated from a random VMK wrapped by an Argon2id-derived
  KEK; file writes are explicit and use an atomic `0600` path:
  `src/personal_ai_companion/memory/vault.py:513-585` and
  `src/personal_ai_companion/memory/vault.py:713-753`.
- A keyring starts with locked sessions, routes decryption to an exact key id,
  and rotation selects an already-unlocked key only for future encryption; it
  does not re-encrypt historical payloads:
  `src/personal_ai_companion/memory/keyring.py:31-40` and
  `src/personal_ai_companion/memory/keyring.py:122-175`.
- Rotation planning only classifies a record as `current` or `rekey_required`;
  it decrypts, encrypts, unlocks, rotates, persists, and mutates nothing:
  `src/personal_ai_companion/memory/vault_rotation.py:1-6` and
  `src/personal_ai_companion/memory/vault_rotation.py:168-215`.
- Synthetic tests assert rotation planning writes no files and that its plan,
  exceptions, representations, and logs do not expose plaintext, passphrases,
  key identifiers, or AAD handles:
  `tests/test_memory_vault_rotation.py:107-121`,
  `tests/test_memory_vault_rotation.py:263-321`.

The existing readiness document identifies prompt projection, owner gates,
consent hydration, ingest validation, class policy, export summary, and
metadata-only audit as work to complete before vault migration:
`ops/projects/personal-ai-companion/manifests/memory-layer-v0.1-implementation-readiness.md:47-64`.
It separately classifies real DB, key, data movement, writer, service, and
deployment work as L3:
`ops/projects/personal-ai-companion/manifests/memory-layer-v0.1-implementation-readiness.md:211-226`.

## Gate A: Authorization Before Any Real-State Access

The rollout owner must approve all of the following in a single L3 change brief
after saying `进入修复阶段`:

1. Exact target database identity and local filesystem boundary. Do not infer a
   target from a filename, symlink, environment variable, or historical path.
2. Authorized operator, time window, intended change, and a named stop owner.
3. Whether writers may be paused, and the permitted service-control mechanism.
4. Backup destination, retention period, access boundary, checksum algorithm,
   and restore location. A backup may contain sensitive plaintext and is not a
   lower-risk artifact.
5. Approved key custody model, recovery owner(s), and key-loss policy. A
   passphrase, VMK, wrapped bundle, or key identifier must never be put in the
   task transcript, ticket, ordinary logs, source control, or diagnostic bundle.
6. Approved migration manifest: intended schema version, additive DDL, expected
   row/handle counts, and the exact verification/rollback evidence to capture.

Missing, ambiguous, expired, or partially approved authority is a hard stop.
Do not issue a backup command, open the DB, inspect a key file, or pause a
writer while Gate A is incomplete.

## Gate B: Backup And Read-Only Preflight

After L3 authorization, execute this phase only against the approved target and
without displaying content:

1. Capture immutable pre-change evidence: DB canonical path and file identity,
   operator/time, application revision, migration-registry checksum, free-space
   check, and writer/service state. Record metadata only.
2. Create an approved byte-level backup using the authorized mechanism. Record
   its path only in the protected evidence location, size, checksum, creation
   time, restrictive permissions, and independent checksum verification.
3. Restore that backup to an isolated scratch location. Verify the restored
   copy's checksum against the backup before any schema or data work.
4. Run protected-store read-only preflight on the approved DB and the scratch
   copy. Require `status=ready`, `source=registered`, latest version, no pending
   or bootstrap migrations, and a no-op plan, matching the code contract at
   `migrations.py:304-328`.
5. Run schema-only inspection and collect its schema fingerprint plus migration
   ids. Do not issue SQL selecting atom, message, review, consent, audit, or
   vault payload columns. The permitted inspection boundary is
   `migrations.py:634-844`.
6. Produce only approved aggregate counts on the scratch copy, with no content,
   IDs, handles, source-event references, or query text in output. Count values
   are rollback/verification evidence, not an authorization to migrate.

Stop immediately if a database cannot be proven to be the approved target, the
backup or restored-copy checksum differs, the preflight is blocked, the schema
is unregistered/stale/unknown, filesystem permissions are unsafe, a writer is
active outside the approved window, or any command would expose contents.

## Gate C: Key Governance Decision

Before a vault table, encrypted record, or key bundle exists, the owner must
choose and document, in protected L3 evidence, all of the following:

- Custody: a supported local secret store or an approved offline operator-held
  bundle; never `.env`, source control, or a shared runtime directory.
- Separation: database backup access alone must not silently grant VMK or
  passphrase access. Recovery access must be separately controlled.
- Creation and persistence: one active key id, bundle destination, `0600`
  permission verification, key-id inventory, and no passphrase/VMK retention in
  logs. The code can create a bundle and atomically write it, but that capability
  is not a deployment design or authorization.
- Unlock lifecycle: explicit authorized unlock, minimum duration, lock/close
  action after each phase, and handling for process failure. The keyring API
  supports explicit unlock and lock/close, but it has no persistent key-store
  integration: `src/personal_ai_companion/memory/keyring.py:122-250`.
- Rotation: trigger, approver, old-key retention window, recovery test, and
  rollback boundary. `rotate_active()` affects future encryption only; a
  separate approved re-encryption design is required for old records.
- Loss/compromise: a pre-approved stop/containment plan. Do not improvise key
  generation, replacement, deletion, or re-encryption during an incident.

No key decision, no vault rollout. A missing recovery test is a hard stop.

## Gate D: Staged Migration Plan

All stages below require Gate A-C and explicit L3 authorization. They are
sequenced decision points, not commands in this L1 document.

### Stage 0: Scratch Rehearsal

Apply the approved additive schema/data procedure only to the restored scratch
copy. Before advancing, record the schema fingerprint before/after, migration
ids/checksums, aggregate count reconciliation, and test results. Stop on any
non-additive DDL, unknown schema object, transaction failure, or count mismatch.

### Stage 1: Vault Record Rehearsal

Use synthetic fixtures and approved scratch-only representative records to prove
AAD binding, no-plaintext serialization, access denial, and decryption/recovery.
Before advancing, produce a metadata-only pass/fail report with no payload,
handle, key id, or source id. Stop if an AAD mismatch is accepted, decryption or
redaction fails, or plaintext reaches logs.

### Stage 2: Rotation Rehearsal

Classify records with the non-mutating planner, then test the separately
approved rekey procedure on scratch. Before advancing, record only aggregate
`current`/`rekey_required` results, a recovery test, the old/new key retention
decision, and the unchanged backup checksum. Stop on planner/result drift, an
inaccessible old key, a failed recovery test, or any unapproved historical
rewrite.

### Stage 3: Live Schema Cutover

Pause writers only as explicitly approved; re-run backup and read-only preflight,
then apply only the accepted schema plan. Before advancing, record before/after
schema fingerprints, the migration result, service/writer status, and backup
checksum. Stop if preflight changed since rehearsal, the plan is stale, writer
state is uncertain, or migration errors.

### Stage 4: Controlled Data Migration

Move only the approved sensitivity class/batch, retain original rollback
evidence, and replace references only after per-batch validation. Before
advancing, record batch identifier, input/output aggregate counts, vault-handle
counts, no-content audit, and recovery result. Stop on a count mismatch,
duplicate/missing handle, unauthorized class, decryption failure, or log
leakage.

### Stage 5: Limited Enablement

Enable only the approved read path with projection, owner, consent, class, and
audit controls already verified. Before acceptance, capture owner approval,
suppression/denial tests, service health, and metadata-only audit samples. Stop
if any vault payload reaches a prompt, speaker, or export path, or an owner
gate, consent check, or audit fails.

The present implementation readiness plan says the safer predecessor work is
prompt-safe projection, owner-gated reads, consent hydration, ingest
validation, class disable, export summary, and audit/rate-limit seams:
`memory-layer-v0.1-implementation-readiness.md:312-325`. Gate D cannot treat
their design intent as completed behavior; L3 entry must verify their actual
implementation and tests at that time.

## Stop Conditions And Escalation

At every stage, stop all further writes, preserve existing evidence, and report
the condition without payloads when any of these occurs:

- Unauthorized target, absent L3 phrase, scope drift, missing owner approval,
  or unapproved service/writer action.
- Backup/restore/checksum/permission failure, insufficient storage, or missing
  pre-change evidence.
- Read-only preflight rejects the store; schema fingerprint, migration history,
  expected version, or scratch rehearsal differs from the approved plan.
- Any schema, data, or key operation is not additive and explicitly reviewed.
- Key custody/recovery/rotation decision is incomplete, an unlock fails, or old
  encrypted data cannot be recovered during rehearsal.
- Integrity, AAD, count, handle, decryption, owner gate, consent, prompt
  projection, export redaction, or audit verification fails.
- Plaintext, passphrases, VMKs, wrapped key bundles, key identifiers, AAD
  metadata, source IDs, handles, or raw SQL/query text appears in a general log
  or user-facing report.

A stop is not permission to retry. The next action is a new bounded diagnosis
or an explicitly authorized revised L3 plan.

## Rollback Evidence And Decision Rules

Before the first live write, require a rollback packet containing:

- Immutable backup checksum and the separately tested restore location.
- Pre-change schema fingerprint, migration history/checksums, aggregate counts,
  service/writer state, application revision, and the exact approved manifest.
- Scratch rehearsal results that prove the backup can be restored and that the
  approved rollback state can start without the new vault path enabled.
- Key-to-record version mapping as protected metadata only; do not include key
  material, passphrases, or raw record metadata in ordinary evidence.
- Explicit point of no return. Until that point, rollback means restore the
  verified byte-level backup and keep the new write path disabled. After it,
  recovery must use the separately approved key-retention plan, never ad-hoc
  key deletion or record rewriting.

Rollback is mandatory after a live migration error, failed reconciliation,
failed recovery/decryption test, invalid projection/gate behavior, or a
security/logging breach. Do not delete the original backup or retire an old key
until the owner accepts the final verification packet and the documented
retention window ends.

## Verification Evidence Required For Acceptance

Acceptance requires a protected, content-free evidence packet containing:

1. Authorization record and exact L3 scope, including any writer pause.
2. Backup and restore checksums, timestamps, permissions, and restore test.
3. Read-only preflight outputs expressed as status/version/fingerprint only.
4. Approved versus observed migration ids/checksums and schema fingerprints.
5. Aggregate-only reconciliation by approved class/batch: source, encrypted
   record, handle, success, failure, and skipped counts. Do not emit row ids.
6. Synthetic and scratch tests for AAD mismatch rejection, altered ciphertext
   rejection, exact-key routing, lock/close behavior, current/rekey-required
   classification, and old-key recovery.
7. Integration tests proving vault-backed content is denied from unapproved
   prompt, speaker, search, explain, review, and export paths; only authorized
   owner flows may access explicitly approved redacted metadata.
8. Audit samples showing actor/action/outcome/timestamp/reason code only, plus
   a negative scan showing prohibited values did not enter logs.
9. Service/writer health before and after cutover, with no raw request/response
   content attached.

## Logging And Evidence Hygiene

Use event codes and aggregates. Prohibited in standard logs, reports, test
artifacts, screenshots, shell history, commit messages, and chat transcripts:

- plaintext or excerpts; raw memory, chat, profile, review, consent, or audit
  content; and raw SQL containing user data;
- passphrases, VMKs, wrapped key-bundle bytes, ciphertext, nonces, salts, full
  key ids, full AAD, atom ids, handle ids, event ids, or session keys;
- unredacted filesystem paths to backups or key bundles when those paths expose
  personal identity or secret-storage layout.

Use redacted stage/batch references, outcomes, counts, schema fingerprints, and
approved truncated hashes only. Preserve detailed evidence only in the approved
protected location with least-privilege access and a retention/deletion owner.
The existing synthetic tests provide a baseline that errors and logs should not
leak secret or record metadata:
`tests/test_memory_vault.py:366-400` and
`tests/test_memory_vault_rotation.py:284-321`.

## Current L3 Blockers And Next Safe Work

Current blockers are confirmed by the readiness plan, not inferred from a live
store:

1. No approved real-state authorization, target identity, backup plan, writer
   window, key custody/recovery policy, or rollback packet exists in this task.
2. Vault persistence, access logging, key-version storage, and real data
   movement are not established as an authorized rollout schema.
3. The prerequisite projection, admin-owner gating, consent hydration, ingest
   validation, class policy, export, audit, and abuse controls are described as
   implementation work, not confirmed live behavior.
4. There is no evidence in this L1 pass that an existing `memory.db` is at the
   registered latest schema, backup-restorable, or compatible with a vault
   rollout; it was deliberately not accessed.

The next safe action is L1 implementation and synthetic/temp-DB verification of
the predecessor controls named above, followed by a fresh L2/L3 authorization
review. Do not begin real rollout work until the user explicitly says
`进入修复阶段` and Gates A-C are complete.
