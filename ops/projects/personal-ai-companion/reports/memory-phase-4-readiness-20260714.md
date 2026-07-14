# PAC Memory Phase 4 Production Readiness

Date: 2026-07-14

Status: independent L1 readiness design and source audit complete; production
memory integration is not ready as one bundled change

## Decision

Do not authorize "Memory Phase 4" as a single production implementation.
The current canonical product has useful memory safety seams, but the evidence
does not establish a production memory system: ordinary chat does not produce
memory candidates, real database compatibility is unknown, vault primitives are
not connected to the store, semantic retrieval is absent, retention has no
authoritative producer or executor, and the memory owner checks are not an
end-to-end authenticated owner boundary.

The recommended first slice is `PAC-MEMORY-PHASE-4A-OPT-IN-ADMISSION`: a pure,
local, synthetic-only ordinary-chat opt-in admission contract. It must require
an explicit structured opt-in, reuse the bounded turn-review normalization,
default to skip, perform no store or network action, and expose only fixed reason
codes in diagnostics. Candidate persistence and `/v1/chat` enablement are later,
separately authorized slices.

This ordering resolves the producer contract before creating more durable data,
vault records, embeddings, deletion obligations, or owner-visible controls.

## Scope, Route Lock, And Authority

- Task level: L1 local planning and documentation. Any real database, private
  data, key, NAS, cloud, or live-runtime evidence remains read-only or blocked;
  this task performed no L3 action.
- Target project: `personal-ai-companion`.
- Owned surface: this report only.
- Read-only product source:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`.
- Product source of truth: `codex/initial-private-publish` at `b536b24`.
- Workspace baseline: `af89c2d`.
- Forbidden surfaces preserved: Google auth, token/session, cloud account,
  owner storage, iOS identity, StackChan live, HealthKit live, other projects,
  shared project README/TODO/ledger, product writes, real databases, `.env`,
  real chat/profile/account data, keys, logs, rollback material, and services.

The historical Phase 3 L3 authority did not carry into this task. Quoting an L3
template below is not authorization to execute it.

## Evidence Boundary

Reviewed workspace evidence:

- [Memory Quality Phase 2](./memory-recall-quality-phase-2-20260713.md)
- [Memory Runtime Metadata Phase 3](./memory-runtime-metadata-phase-3-20260713.md)
- [Memory Vault Rollout Gate](../runbooks/memory-vault-rollout-gate.md)
- [Memory Retention Admission](./memory-retention-admission-implementation-20260711.md)
- [Memory Retention Inventory Bridge](./memory-retention-inventory-bridge-20260711.md)
- [Memory Retention Hold/Snapshot Design](./memory-retention-hold-snapshot-design-20260711.md)
- [Memory Layer v0.1 Implementation Readiness](../manifests/memory-layer-v0.1-implementation-readiness.md)

Reviewed source and tests at `b536b24`:

- `memory/service.py`, `store.py`, `migrations.py`, `contracts.py`,
  `recall_quality.py`, `turn_review.py`
- `memory/retention.py`, `retention_inventory.py`,
  `retention_admission.py`
- `memory/vault.py`, `vault_record.py`, `key_session.py`, `keyring.py`,
  `vault_rotation.py`
- `core/privacy.py`, `core/identity.py`, and memory routes in `api/app.py`
- related `tests/test_memory_*.py`, privacy, routing, and API tests

No real/private data or runtime state was opened. Existing test results cited
below are prior recorded evidence or source-level test inspection, not a claim
that this task reran product tests against private or live state.

Sub2API discovery was attempted from the available tool surface, but no
`sub2api_model_pool` or tool-discovery call was available in this task. The
architecture judgment therefore remains Codex's local evidence-based decision,
without an external-model acceptance claim.

## Classification Vocabulary

The status labels below are intentionally distinct:

- `implemented`: code is present on the canonical product commit.
- `synthetic-verified`: behavior is covered only with synthetic values,
  in-memory SQLite, or temporary databases.
- `designed-not-wired`: a contract, planner, primitive, or runbook exists but
  has no production Store/Service/API execution path.
- `missing`: no implementation for the stated production capability was found.
- `real-data/L3`: confirmation or execution requires a separately authorized
  real-state operation. Nothing in this report grants that authority.

## Structural Map

GitNexus was queried against indexed repository `personal-ai-companion` at
`b536b24`. No symbol was edited.

| Boundary | Graph/source result | Readiness meaning |
| --- | --- | --- |
| Ordinary chat ingest | `_chat_response -> MemoryService.ingest`; the call at `api/app.py:139` supplies only `recorded_at_ms`, not `memory_text` | Ordinary chat writes context/session data but creates no memory candidate |
| Explicit candidate ingest | `memory_ingest -> ingest`; `memory_review_turn -> review_turn` | Candidate creation exists only behind explicit memory surfaces |
| Recall | `_chat_response` and `memory_recall` call `MemoryService.recall` | Runtime recall is wired, but it is lexical and inline-only |
| Fact identity/expiry | `recall` loads metadata first, applies disclosure/class checks, then loads authorized content; `fact_key` and `expires_at_ms` participate in conflict/expiry filtering | Implemented and synthetic/temp-DB verified; expired rows are hidden, not deleted |
| Privacy gate | `PrivacyKernel.can_disclose_memory` blocks `never_quote`, sensitive facts, vault-associated/non-inline payloads, and unauthorized scopes before content load | Strong local fail-closed seam; not proof of authenticated caller identity |
| Retention | GitNexus found no `src/` caller of `plan_retention`, `to_retention_inventory`, or the admission/composition boundary; callers were tests only | Planner/admission/inventory are designed-not-wired |
| Vault | Source import graph remains inside `vault`, `key_session`, `keyring`, `vault_record`, and `vault_rotation`; no Store/Service/API importer exists | Crypto and key-session primitives are isolated, not at-rest wiring |

The graph results agree with direct source inspection and the Phase 2/3 reports.

## Current Capability Classification

| Capability | Status | Confirmed evidence | Not established |
| --- | --- | --- | --- |
| Memory schema and migration engine | implemented + synthetic-verified | Registered migrations v1-v3; v3 adds nullable `fact_key` and `expires_at_ms`; planning is metadata-only and apply is transactional | Real DB version, integrity, backup-restorability, and migration outcome |
| Protected database gate | implemented + synthetic-verified | Protected paths open read-only and must already be registered/latest/no-op | It intentionally cannot upgrade an old protected real DB |
| Explicit candidate ingest/review | implemented + synthetic-verified | Owner/actor, scope, privacy class, consent, size, class policy, duplicate/conflict, and confirmation checks exist | Ordinary-chat opt-in producer and production owner binding |
| Ordinary-chat memory producer | missing | `/v1/chat` calls `ingest()` without candidate text | Opt-in semantics, admission result, idempotent candidate write, rollout control |
| Recall/fact identity/expiry | implemented + synthetic-verified | Metadata-first privacy gate, durable fact identity, canonical winner selection, lexical rank, expiry suppression | Runtime expiry producer, semantic retrieval, real-data quality, deletion |
| Vault crypto and key sessions | implemented + synthetic-verified | AAD-bound encryption, locked-by-default exact-key routing, atomic `0600` bundle writes, future-write rotation, non-mutating rotation plan | Store schema, payload routing, key custody, unlock/recovery service, historical rekey |
| Vault at-rest integration | designed-not-wired | Rollout gate and privacy suppression contracts exist | Vault tables/handles/access log, dual-read/write, data movement, backup/key separation |
| Semantic/vector retrieval | missing | Only lexical token/rank logic exists; `vector_resource_exists` is retention metadata, not an index | Embedding model, schema/index, authorization-before-embedding, retrieval/fallback, deletion |
| Retention planning/admission | implemented + synthetic-verified + designed-not-wired | Pure payload-free planner, snapshot admission, holds, resource dependency plan, fixed L3 boundary | Authoritative producer, scheduler, executor, Store integration |
| Delete API | implemented as soft delete | Owner confirmation changes status/deleted timestamp and recall excludes the row | Physical deletion, SQLite page/WAL proof, vault/vector/cache/backup deletion |
| Owner-visible memory admin | implemented + synthetic-verified at service boundary | Search/review/explain/export/class-policy gates and metadata audit exist | End-to-end authenticated owner identity; POST envelopes are caller-supplied and local GETs synthesize owner after a loopback-host check |
| Backup/restore | designed-not-wired | Vault rollout gate defines backup, checksum, scratch restore, and rollback evidence | Product backup tool, restore harness, real restore rehearsal, recovery-time proof |
| Observability | partially implemented | Metadata-only audit rows, model usage counts, fixed deny reasons, in-memory rate limiting | Vault access audit, retention execution journal, durable metrics/alerts, SLOs, redaction-negative monitoring |

## Key Findings And Risks

### 1. Producer Risk Comes Before Retrieval Quality

`MemoryService.ingest()` can persist an explicitly supplied candidate and
`review_turn()` can normalize a narrow preference-like turn. However ordinary
chat only records `conversation_messages` and `session_deltas`; it does not call
the review producer or pass candidate content. Enabling inference directly in
`/v1/chat` would expand durable private-data collection before owner identity,
retention, hard delete, backup, and vault boundaries are accepted.

The first producer must therefore be explicit opt-in and review-required. It
must never auto-promote, infer consent from conversational wording, or turn all
ordinary chat into candidate memory.

### 2. Migration Mechanism Is Safer Than Migration Readiness

The migration registry and transaction behavior are strong local foundations.
They prove that known synthetic schemas can be planned and upgraded and that
injected failures roll back. They do not prove that a real database is the
expected file, has the expected schema, is restorable, has enough space, or can
be upgraded under real writer behavior.

The protected-database gate also requires an already-latest no-op schema. That
is a deliberate safety boundary, not a live migration procedure. No vault,
vector, retention-snapshot, or execution-journal schema is currently registered.

### 3. Vault Primitives Do Not Mean Encrypted Storage

`MemoryVaultCodec` and `VaultKeyring` are imported only by vault-local helpers
and tests. Current `conversation_messages.text`, `session_deltas.statement`, and
`memory_atoms.content` remain inline text columns. A production at-rest claim
would need an explicit data-class map covering those columns, review artifacts,
indices, WAL/temp files, backups, exports, and logs.

Rotation currently changes the active key for future encryption only. There is
no historical re-encryption executor, key custody/recovery integration, or
proof that old records remain recoverable after a real process restart.

### 4. Semantic Retrieval Creates New Sensitive Copies

There is no embedding/vector implementation. Adding one before authorization
and deletion semantics are resolved would create a derived representation that
must inherit scope, class, consent, expiry, fact identity, vault association,
and delete obligations. Query embedding and candidate embedding must occur only
after the same metadata authorization boundary; unauthorized payloads must not
be loaded merely to score them.

### 5. Retention Is a Plan, Not Enforcement

The retention modules intentionally have no Store or runtime dependency. They
can produce deterministic delete plans with legal/owner hold precedence and
ordered derived-resource actions. The current atom/schema cannot authoritatively
supply the complete policy, hold, payload-location, and resource-existence
snapshot.

The current delete path is soft delete. No executor proves removal from the
atom, inline payload, cache, index, vector, vault, WAL/free pages, or backups.
`VACUUM`, `secure_delete`, key destruction, and real purge are explicitly marked
L3-forbidden by the planner rather than implemented.

### 6. Memory Owner Checks Assume Trusted Identity Input

The service correctly denies non-owner envelopes before admin reads. That is a
useful policy kernel, not authentication. POST memory routes construct identity
from caller-supplied envelope fields. Compatibility GET routes accept a
loopback-like client host and then synthesize the owner entity. This task did
not inspect or modify Google auth, tokens, sessions, cloud accounts, owner
storage, or iOS identity, so no end-to-end owner claim is made.

Production memory admin must wait for the separate owner-acceptance task to
publish an accepted, trusted identity contract. This report does not pre-judge
or expand that task.

### 7. Recovery And Operations Are Not Yet Testable End To End

The rollout runbook has strong backup/checksum/scratch-restore gates, but the
product has no memory-specific backup/restore implementation or accepted
restore-time objective. Existing audit rows do not prove durable metrics,
alerts, deletion journals, vault access logs, or negative leakage scans.

## Minimal Independently Authorized Slices

Each slice has its own acceptance and rollback boundary. Later slices may not
inherit authorization from earlier ones.

| Slice | Scope and evidence target | Dependencies | Rollback | Authority |
| --- | --- | --- | --- | --- |
| 4A opt-in admission | Pure `ordinary chat + explicit structured opt-in -> skip/eligible` contract; bounded normalization; no Store/API wiring | Current turn-review and privacy contracts | Revert one source/test commit; no data rollback | L1 local/synthetic |
| 4B candidate-write wiring | Temp-DB-only call from chat orchestration to existing review-required candidate path; feature default off; idempotent source event | 4A; accepted trusted-owner input contract; failure isolation | Disable flag and revert; temp DB discarded | L1 source/temp DB; live enablement is separate L3 |
| 4C real DB migration readiness | Target-specific identity, backup, checksum, restored scratch copy, schema-only preflight, migration rehearsal, count-only reconciliation | Accepted schema manifest; writer plan; stop owner | Restore verified byte-level backup; keep new path disabled | Real DB open/write is L3 under the vault gate |
| 4D vault persistence and key lifecycle | First register vault schema on synthetic/temp DB; then dual-write/read rehearsal; separately decide custody, unlock, recovery, rotation, historical rekey | 4C rehearsal; owner/admin gate; projection; retention model | Disable vault path; preserve inline source until acceptance; restore backup after live error | Local fixtures L1; any real key/DB/data action L3 |
| 4E semantic retrieval | In-memory/synthetic interface first; authorize metadata before content/embedding; lexical fallback; no real backfill | Stable producer, fact identity, vault classification, delete contract | Disable vector path and rebuild disposable index | Source/test L1; real embedding/backfill/index writes L3 |
| 4F authoritative retention producer | Temp-DB projection with explicit policy/hold/resource provenance and admission token; still dry-run only | Final schema map for inline/vault/vector/audit resources | Disable producer; no data mutation | L1 temp DB; real inventory read requires fresh gate |
| 4G retention executor and hard-delete proof | Execution journal, dependency order, fault injection, idempotence, then scratch-copy proof before any real delete | 4C, 4D, 4E, 4F; backup restore; legal/owner hold authority | Restore backup where possible; deletion/key destruction has an explicit point of no return | Any real delete, vacuum, key action, or service change L3 |
| 4H owner-visible admin binding | Bind memory policy kernel to accepted trusted owner context; remove/disable unsafe compatibility behavior for production; audit every admin read/mutation | Separate owner-acceptance result; no auth design is owned here | Disable admin exposure and revert route binding | Separate auth-owned authorization; live config/deploy L3 |
| 4I backup/restore and observability | Synthetic backup/restore harness and metadata-only event schema first; later real restore rehearsal, alerts, deletion/vault journals | Schema and key-custody map; protected evidence location | Disable exporters; retain protected evidence per policy | Synthetic L1; real backup/restore/service changes L3 |

Recommended order is `4A -> 4B -> 4H -> 4C -> 4D -> 4F -> 4E -> 4G`,
with `4I` beginning as a synthetic harness before 4C and expanding alongside each
later slice. Semantic retrieval comes after lifecycle/resource identity because
vectors add another copy that retention must delete.

## Recommended First Slice: 4A Opt-In Admission

### Contract

The slice should introduce one pure admission result with fixed fields:

- `status`: `skip`, `eligible`, or `deny`
- `reason_code`: closed enum, never raw text
- normalized `memory_type`, `scope`, `privacy_class`, `fact_key`, and bounded
  candidate content only when `eligible`
- `requires_owner_review=true` for every eligible result
- no atom ID, event/session ID, filesystem path, key, or storage locator

Inputs should be limited to an already-constructed interaction envelope, an
explicit structured opt-in supplied by a trusted caller contract, and a fixed
reference time if needed. The producer must not treat conversational similarity,
"remember" wording alone, model output, or prior consent as opt-in.

### Admission Rules

1. Default, missing, malformed, replay-conflicting, or ambiguous opt-in: skip or
   deny without a candidate.
2. Only owner actor plus owner viewer is eligible; other identities fail before
   candidate text is returned.
3. Reuse the existing allowlisted memory types/scopes/privacy classes, length
   bound, sensitive-scope consent requirement, credential rejection, and
   class-policy denial.
4. Use bounded deterministic normalization only. Broad NLP/model extraction is
   not part of 4A.
5. Never promote automatically. Candidate persistence is not part of 4A.
6. Diagnostics contain reason codes and counts only; no text, fact key, IDs, or
   provenance.

### Acceptance Criteria

- Non-opted ordinary chat yields `skip` and zero Store calls.
- Explicit opt-in with an allowlisted synthetic preference yields one stable
  eligible result and requires review.
- Unknown/non-owner, missing consent, credential-like, overlong, malformed,
  sensitive-scope mismatch, and class-disabled inputs yield no candidate.
- Replaying an identical synthetic event is deterministic; a conflicting
  replay fails closed.
- Property-poison tests prove denied paths do not read candidate payload.
- Static import/spy checks prove no Store, SQLite, filesystem, network, model,
  vault, migration, retention, auth, or service dependency.
- Existing memory/privacy/turn-review tests remain green.

### Non-Goals

No `/v1/chat` wiring, candidate write, feature-flag change, schema change,
database access, private-data test, prompt change, auth change, vault action,
embedding, retention action, deployment, or service control.

## Data Minimization Strategy

- Explicit opt-in is per turn and defaults false; consent and prior opt-ins are
  not reused as blanket collection authority.
- Generate a bounded normalized fact/preference, never a raw transcript copy,
  multi-turn window, assistant reply, model rationale, or hidden chain of
  thought.
- Keep candidate status review-required and store nothing additional on denied
  or skipped paths.
- Preserve only the minimum provenance required for idempotence and audit; keep
  operational metrics payload-free and use fixed reason codes.
- Authorize metadata before reading content for recall, admin, embedding,
  projection, export, and retention inventory construction.
- Do not embed `never_quote`, sensitive, vault-associated, expired, deleted,
  disabled, or unauthorized content.
- Treat vectors, caches, indices, vault records, WAL/temp files, backups, and
  audit artifacts as retention resources with explicit owners and lifecycles.
- Keep backups and keys in separate custody. A backup is sensitive data, not a
  lower-risk diagnostic artifact.
- Never place content, credentials, passphrases, VMKs, ciphertext, nonces, full
  key/handle/atom/event/session IDs, or private paths in normal logs/reports.

## Test And Acceptance Matrix

| Area | Local unit/synthetic | Temp-DB integration | Real-state acceptance |
| --- | --- | --- | --- |
| Opt-in producer | Default-skip, explicit opt-in, identity/consent/class/credential/length denials, deterministic normalization, poison payload | 4B only: exactly one review-required candidate, replay idempotence, chat survives isolated memory failure | Owner-approved canary counts with no payload logs; separate L3 enablement |
| Migration | Registry checksum, legacy v1/v2/v3 plans, unknown/tampered schema refusal, injected rollback, concurrent stale-plan refusal | Backup-copy upgrade and restart with aggregate reconciliation | Approved target identity, writer state, backup+restore checksum, schema fingerprint, rollback drill |
| Vault | AAD mismatch/tamper, locked/closed keyring, no plaintext serialization/logging, future-write rotation | Synthetic Store dual-write/read, process restart, old-key recovery, fault injection | Approved custody/recovery, real backup separation, batch counts, negative leakage scan |
| Recall/vector | Current lexical/fact/expiry/privacy regressions; synthetic vector authorization and lexical fallback | Disposable index build/rebuild; conflict/expiry/disabled filtering | Bounded quality evaluation on separately approved data; no raw examples in evidence |
| Retention | Admission freshness, holds, resource ordering, conflict/fail-closed, executor idempotence with fakes | Scratch-copy journal, failure at every dependency, retry/rollback, zero residual derived resources | Approved aggregate before/after proof including DB pages/WAL, vault/vector/cache, backup policy |
| Memory admin | Service gate before Store read, confirmation, rate limit, payload-free audit | Trusted-identity adapter tests owned with the accepted auth contract; compatibility route disabled in production mode | Forged/expired/non-owner session denial and owner acceptance, handled by the separate auth task |
| Backup/observability | Deterministic event schema, redaction-negative tests, checksum/restore harness on synthetic DB | Restored copy starts and passes schema/count/recovery tests | Protected evidence packet, alert exercise, restore-time measurement, stop-owner sign-off |

No live acceptance may use raw chat excerpts or row-level identifiers in the
ordinary task transcript.

## Slice-Level Stop Conditions

Stop the current slice and preserve payload-free evidence if any of these occurs:

- Product source no longer matches the approved baseline and the drift affects
  memory, identity, privacy, storage, routing, migration, vault, or retention.
- Work crosses into Google auth/token/session/cloud account/owner storage/iOS
  identity before the parallel owner-acceptance task publishes its contract.
- A non-opted chat can create a candidate, an eligible candidate can auto-promote,
  or a denied path reads/persists candidate content.
- A real DB, backup, key, private record, log, or service would be opened or
  changed without a fresh exact Route Lock and required authority.
- Target identity, schema history/fingerprint, writer state, backup checksum,
  restored-copy checksum, free space, or rollback owner is missing or differs.
- A vault/key design lacks custody separation, restart recovery, old-key
  recovery, lock/close behavior, or negative plaintext/logging proof.
- Vector creation occurs before authorization, or vector/cache/index deletion
  cannot be reconciled with the atom/vault lifecycle.
- Retention metadata cannot prove policy/hold/resource provenance, a planner
  result is truncated/ambiguous, or an executor action is non-idempotent.
- Any hard-delete proof excludes WAL/free pages, derived resources, vault data,
  or the approved backup-retention decision.
- Any test needs real payload output, credentials, unredacted IDs, or a widened
  project route to diagnose a failure.

A stop does not authorize a repair retry or a broader slice.

## Explicit L3 Repair Gate

The following actions always stop at plan until the user gives fresh authority
in the then-current task by saying `进入修复阶段` and names one slice:

- opening, backing up, restoring, querying, migrating, or writing a real
  `memory.db` under the current vault gate;
- pausing writers, changing runtime config, enabling a producer, restarting a
  service, deploying, or changing live routes;
- creating/reading/writing/unlocking/rotating/destroying keys or moving real
  content into/out of a vault;
- real embedding/index/backfill work, retention inventory against real data,
  hard delete, purge, `secure_delete`, `VACUUM`, or backup retirement.

An acceptable future L3 authorization must identify all blanks, not merely use
the phrase:

```text
进入修复阶段。授权 PAC-MEMORY-PHASE-4-<SLICE-ID>，仅针对
<exact target and canonical path>, in <time window>, with <stop owner>.
Allowed actions: <exact read/write/service/key actions>.
Required backup/restore evidence: <destination boundary, checksum, restore test>.
Rollback point and method: <exact point and method>.
Forbidden: all other Phase 4 slices, raw/private output, auth/cloud expansion,
and any action after a listed stop condition.
```

Authorization for one slice does not authorize the next slice. Historical L3
phrases, migration approval, or deployment approval cannot be reused.

## Next Authorization Text

The recommended next task is L1 and should not use the L3 phrase:

```text
授权执行 PAC-MEMORY-PHASE-4A-OPT-IN-ADMISSION：在独立产品 worktree
中实现并合成验证纯本地 ordinary-chat 显式 opt-in admission contract。
仅允许修改该 contract 及其聚焦测试；默认 skip、无 Store/API/runtime
接线、无 candidate 写入、无真实数据、无 auth/cloud/vault/vector/retention
执行。Codex 复核 GitNexus 影响、全部相关测试和单提交 diff 后再验收。
```

## Final Readiness Judgment

- Recommended first slice: 4A pure opt-in admission, L1 local/synthetic only.
- Ready now: bounded source work and synthetic/temp-DB validation of separately
  authorized contracts.
- Not ready now: ordinary-chat candidate writes in a live path, real migration,
  vault at rest, semantic retrieval, retention execution/hard delete, production
  memory admin exposure, or recovery/observability acceptance.
- Highest residual risks: untrusted owner identity input at the memory boundary,
  additional private-data collection before deletion/recovery proof, key-loss or
  partial-vault migration, derived-vector deletion gaps, and irreversible purge
  without a verified restore.

Phase 4 should advance only through individually accepted slices with independent
rollback evidence. A single production-memory rollout would collapse too many
authorization, privacy, storage, cryptographic, and irreversible-deletion
boundaries into one change.
