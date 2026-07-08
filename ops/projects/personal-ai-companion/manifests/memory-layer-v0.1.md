# Personal AI Companion Memory Layer v0.1

Date: 2026-07-08
Status: architecture baseline
Risk level: L1 local architecture and documentation

## Route Lock

- Target project: `personal-ai-companion` memory architecture
- Product root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Ops docs:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- State root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion`
- Forbidden active style thread: `019f4054-6b58-74c1-ad8f-30354bffaf9b`

This document is design-only. It does not read, export, query, migrate, or
inspect `memory.db`; it does not read real chat logs, profile exemplars, clean
samples, HealthKit data, API keys, environment files, bridge logs, or bridge
tokens.

## Purpose

The memory layer must make the companion useful without making private data
invisible, irreversible, or over-shared. v0.1 splits memory into three explicit
layers:

1. Short-term context: recent session continuity and scratch state.
2. Long-term memory atoms: reviewed, normalized facts with provenance.
3. Sensitive data vault: encrypted sensitive payloads referenced by opaque
   handles.

The current local code already has `InteractionEnvelope`, `IdentityKernel`,
`PrivacyKernel`, `MemoryService`, `MemoryStore`, SQLite persistence,
candidate/promoted atom status, review items, consent records, recent context,
and owner-confirmed promote/reject/delete flows. v0.1 keeps those names and
turns their implicit boundaries into explicit data contracts.

## Existing Contract Snapshot

Confirmed from safe source inspection only:

- Inbound events normalize through `InteractionEnvelope`.
- Identity resolution is structural through `IdentityKernel`.
- Privacy gates run through `PrivacyKernel`.
- The current store creates `conversation_messages`, `session_deltas`,
  `memory_atoms`, `memory_audit_logs`, `model_usage_logs`, `review_items`, and
  `consent_records`.
- `/v1/chat` writes recent context, recalls promoted memories, builds a prompt,
  records usage, and stores a short assistant reply for continuity.
- `/v1/memory/ingest` can create a candidate atom plus review item.
- `/v1/memory/recall` searches promoted atoms and applies the privacy kernel.
- Promote, reject, and delete require owner memory-admin status and
  confirmation.
- `conversation_messages` retention is already configurable on `/v1/chat` and
  defaults to a 24-hour window.

Known gaps for v0.1:

- L1 to L2 promotion lacks a formal normalization gate.
- Current `scope`, `privacy_class`, and `memory_type` mix access, function,
  sensitivity, and persona concerns.
- There is no separate vault table or vault handle.
- Search, reviews, and explain endpoints currently need envelope/owner gates
  before they become non-local or user-facing admin APIs.
- Consent records exist, but the current service does not yet hydrate the
  privacy kernel's active consent set from stored consent records on startup.
- Runtime export and disable-class APIs do not exist yet.

## Design Principles

- Default deny. A memory is not recalled, spoken, exported, or sent to a model
  unless a policy allows it.
- Raw text is temporary. Short-term context may contain raw user text; long-term
  atoms should contain concise normalized facts, not transcript chunks.
- Classification and sensitivity are separate axes. A `chat_summary` can be
  low-risk or sensitive depending on contents and source.
- Speaker output is stricter than private screen output.
- The owner can inspect, explain, disable, export summaries, and delete.
- Unknown identities get only `group_safe_shared` content.
- The VPS is not a private memory store. NAS may become private storage later,
  but only behind encryption, auth, audit, and explicit deployment planning.
- Sensitive vault data is referenced by handle. Prompt packs receive summaries
  or handles only unless an owner-unlocked policy explicitly allows more.

## Layer Model

| Layer | Name | Purpose | May contain raw text | Default persistence | Prompt exposure |
| --- | --- | --- | --- | --- | --- |
| L1 | Short-term context | Recent turns, session continuity, scratch deltas | Yes, minimized | 24h default, shorter for sensitive scopes | Bounded recent context only |
| L2 | Long-term memory atoms | Reviewed preferences, events, relationships, summaries, stable device facts | No, normalized facts only | Until owner delete or class retention review | Policy-filtered memory pack |
| L3 | Sensitive data vault | Health details, intimate/private facts, secrets, high-risk source payloads | Yes, encrypted separately | Owner-controlled | Suppressed, summary, or handle-only by default |

### L1 Short-Term Context

Current tables: `conversation_messages` and `session_deltas`.

v0.1 target fields:

- `context_id`
- `event_id`
- `session_key`
- `actor_entity_id`
- `viewer_entity_id`
- `assistant_entity_id`
- `channel`
- `device_id`
- `delivery_mode`
- `text`
- `scope`
- `memory_class_hint`
- `sensitivity_hint`
- `created_at_ms`
- `expires_at_ms`
- `source_kind`

Rules:

- L1 is the only layer allowed to store raw conversation text by default.
- L1 rows must have `expires_at_ms`.
- Health, sensitive, and vault-grade L1 rows use a shorter TTL than ordinary
  chat.
- Session deltas inherit the strictest sensitivity and scope of their source
  events.
- L1 pruning must not delete L2 atoms or L3 vault entries.
- L1 rows are not exported except as owner-requested summaries.

### L2 Long-Term Memory Atoms

Current table: `memory_atoms`, currently used for both candidate and promoted
atoms.

v0.1 target fields:

- `atom_id`
- `content`
- `memory_class`
- `access_scope`
- `functional_mode`
- `persona_scope`
- `sensitivity`
- `storage_layer`
- `status`
- `confidence`
- `recall_policy`
- `prompt_projection`
- `retention_policy`
- `expires_at_ms`
- `source_event_id`
- `source_session_key`
- `source_kind`
- `source_hash`
- `consent_record_id`
- `review_id`
- `vault_handle`
- `device_id`
- `entity_ids`
- `dedup_key`
- `version`
- `created_at_ms`
- `updated_at_ms`
- `deleted_at_ms`

Rules:

- L2 atoms are normalized facts. They should not store long verbatim quotes.
- Every L2 atom has provenance, even when source text has expired from L1.
- Candidate atoms are not recall truth until promoted.
- Promotion requires a normalization check, owner confirmation, and an audit
  event.
- Recalled atoms must pass both atom policy and delivery policy.
- L2 atoms that point to sensitive payloads store `vault_handle`, not the
  payload.

### L3 Sensitive Data Vault

New table family: `vault_entries`, `vault_access_logs`, and optional
`vault_key_versions`.

v0.1 target fields for `vault_entries`:

- `vault_handle`
- `vault_class`
- `access_scope`
- `sensitivity`
- `encrypted_blob`
- `encryption_key_ref`
- `encryption_algo`
- `source_event_id`
- `source_hash`
- `consent_record_id`
- `retention_policy`
- `created_at_ms`
- `updated_at_ms`
- `deleted_at_ms`

Rules:

- Vault entries are encrypted separately from L2 atoms.
- L2 prompt packs get at most a safe summary or opaque `vault_handle`.
- Every vault read is owner-only, consent-checked, and audit-logged.
- StackChan speaker output never receives vault payloads.
- VPS relay never stores vault payloads or decrypted vault summaries.
- Encryption key design and key migration are L3 repair work and must stop at a
  plan until explicitly authorized.

## Classification

The classification model has orthogonal axes:

- `memory_class`: what kind of information this is.
- `access_scope`: who may see it.
- `functional_mode`: why it was produced or how it is used.
- `sensitivity`: exposure risk.
- `storage_layer`: L1, L2, or L3.
- `retention_policy`: how long it lasts.
- `recall_policy`: when it can be recalled.
- `prompt_projection`: whether the prompt sees full, summary, handle, or none.
- `source_kind`: direct statement, inference, import, system observation, or
  owner edit.
- `consent_requirement`: none, explicit required, explicit granted, or denied.

### Memory Classes

| Class | Default layer | Default sensitivity | Examples of allowed abstract content | Speaker rule | Retention |
| --- | --- | --- | --- | --- | --- |
| `preference` | L2 | confidential if owner-private | Food, reply style, schedule preference | Allowed only if not sensitive and owner presence is trusted | Indefinite, 180d review |
| `event` | L2 | internal or confidential | A dated appointment, trip, milestone | Summary-only unless group-safe | Indefinite, 365d stale review |
| `relationship` | L2 | confidential | Entity links, consented relationship labels, boundaries | Block partner-private; summary-only couple-shared | 90d review |
| `health_trend` | L3 summary plus optional L2 trend atom | secret | Sleep/activity trend labels, never raw readings by default | Blocked | Raw 30d max, trends 365d suggested |
| `device_status` | L1, sometimes L2 | internal | Device online/offline, battery, firmware capability | Allowed if group-safe | 30d max unless stable capability |
| `chat_summary` | L1 or L2 summary | inherits strictest source sensitivity | Owner-visible session digest | Summary-only if shared; blocked if sensitive | 30d to 365d by scope |
| `sensitive_fact` | L3 plus optional L2 handle | secret | Health, intimate, financial, credential-adjacent, safety-critical facts | Blocked | Owner-controlled |
| `style_signal` | L2 or L3 depending on source | confidential to secret | Consented style rules, abstract response-shape notes | Blocked for training/source details | Owner-controlled, consented |

Strictest-class wins. If a `chat_summary` contains health or sensitive content,
split it into a safe summary atom plus a vault entry, or classify the whole item
as vault-backed.

## Ingest Pipeline

```text
InteractionEnvelope
-> IdentityKernel
-> source and class disabled check
-> L1 context write with TTL
-> candidate extraction
-> normalization gate
-> sensitivity and vault router
-> candidate atom or vault-backed atom
-> review item
-> owner review
-> promoted L2 atom or L3 handle
```

The normalization gate is mandatory before L2 candidate creation:

- Reject or vault-route long verbatim text.
- Convert user text into concise facts.
- Mark inferred facts as `source_kind=inference`.
- Assign `memory_class`, `access_scope`, `sensitivity`, `retention_policy`, and
  `prompt_projection`.
- Attach provenance by ID and hash rather than retaining raw source text.
- Route health, intimate, credential-adjacent, financial, and consent-sensitive
  material to L3 or review, not directly to L2 recall.

## API Draft

All admin APIs must accept or derive an `InteractionEnvelope` and enforce
owner/admin status unless explicitly safe for non-owner users.

### `POST /v1/memory/ingest`

Purpose: receive a memory candidate or event and route it through classification
and review.

Request fields:

- `envelope`
- `text` or `memory_text`
- `memory_class_hint`
- `access_scope_hint`
- `sensitivity_hint`
- `source_kind`
- `source_event_id`
- `consent_record_id`
- `disable_raw_l1`
- `ttl_override_hours`

Behavior:

- Always normalize the envelope first.
- Check class/source disable policies before writing.
- Write L1 context only when the retention policy allows it.
- Create L2 candidates only after normalization.
- Route vault-grade material to L3 handle plus review item.
- Return candidate IDs, vault handles if any, review IDs, and policy decisions.
- Do not promote automatically.

### `POST /v1/memory/recall`

Purpose: build a scoped memory pack for a given turn.

Request fields:

- `envelope`
- `query`
- `memory_classes`
- `max_sensitivity`
- `include_summaries`
- `limit`
- `delivery_mode`

Behavior:

- Search only promoted atoms.
- Apply disabled-class policy.
- Apply atom-level `recall_policy`.
- Apply `PrivacyKernel` for viewer, scope, consent, channel, and delivery.
- Apply speaker hard blocks after recall and before prompt construction.
- Return `memories`, `blocked_count`, `policy_trace`, and `memory_pack_id`.
- Never return vault payloads through recall.

### `GET /v1/memory/{atom_id}/explain`

Purpose: show why a memory exists and how it may be used.

Behavior:

- Owner-only by default.
- Return class, scope, sensitivity, layer, status, confidence, provenance IDs,
  review state, consent state, retention rule, recall policy, and prompt
  projection.
- For vault-backed atoms, return only a redacted handle and audit metadata.
- Do not return expired L1 source text.

### `DELETE /v1/memory/{atom_id}`

Purpose: owner-confirmed deletion.

Behavior:

- Owner-only.
- Requires explicit confirmation.
- Soft-delete L2 atoms first and hide them from recall immediately.
- If the atom has a vault handle, delete or tombstone the vault entry according
  to the vault deletion policy.
- Write an audit event that records action metadata, not the deleted content.
- Future v0.1 implementation should support hard-delete after a 30-day L2 grace
  period; L3 may be immediate hard-delete by owner request.

### `POST /v1/memory/disable-class`

Purpose: stop ingest, recall, or export for a class without deleting existing
data.

Request fields:

- `envelope`
- `memory_class`
- `action`: `disable_ingest`, `disable_recall`, `disable_export`,
  `disable_all`, or `enable`
- `scope`
- `duration_hours`
- `reason`
- `confirmed`

Behavior:

- Owner-only and confirmation-gated.
- Persist to a new `class_policies` table.
- Apply in `ingest`, `recall`, admin search, and export summary.
- Does not delete existing atoms.
- Writes an audit event.

### `POST /v1/memory/export-summary`

Purpose: owner-visible, privacy-preserving memory inventory.

Request fields:

- `envelope`
- `memory_classes`
- `scopes`
- `include_counts`
- `include_redacted_examples`
- `include_vault_inventory`
- `format`: `json` or `markdown`

Behavior:

- Owner-only.
- Default export is a summary, not raw memory dump.
- Include counts by class, scope, status, sensitivity, retention state, and
  disabled class policy.
- Include redacted sample text only with explicit opt-in and only for L2
  non-vault atoms.
- Vault export lists handles, classes, timestamps, and access logs, not payload.
- VPS must not receive or cache export files.

### Existing Endpoints To Harden

- `/v1/memory/search`: require envelope, owner/admin check, pagination, class
  filters, layer filters, and sensitivity caps.
- `/v1/memory/reviews`: require owner/admin check.
- `/v1/memory/{atom_id}/explain`: require owner/admin check or a restricted
  non-owner explanation policy.
- `/v1/consent/grant` and `/v1/consent/revoke`: persist consent scope and hydrate
  active consent state on service startup.

## Privacy Rules

### iOS Private Chat

Allowed:

- Owner-private L2 atoms.
- Owner-unlocked vault summaries or vault payload access when explicitly
  requested and consented.
- Health trends only when HealthKit permission and `health_read` consent are
  active.
- Memory admin search, explain, delete, disable class, and export summary.

Blocked by default:

- Partner-private content unless the current viewer is allowed by scope.
- Raw style-training sources.
- Unknown identity access.
- Vault payload export without explicit owner confirmation.

### StackChan Speaker

Allowed:

- `group_safe_shared`.
- Non-sensitive owner-private content only when owner identity and local
  presence are trusted.
- `couple_shared` and `partner_style` as summary-only when safe.
- Device status that is not private.

Hard blocked:

- `health_private`
- `partner_private`
- `style_training`
- `memory_maintenance`
- `girlfriend_style` source/profile details
- `sensitive_fact`
- Any vault payload or vault-derived detail

Rule: speaker filtering is a code gate, not a prompt instruction. If presence is
unknown, StackChan behaves as a shared-room device and receives only
group-safe content.

### NAS Storage

Allowed future role:

- Private persistent storage.
- Encrypted L2 and L3 data.
- Local search/vector indexes.
- Backups and local summarization jobs.
- Audit logs without raw prompt replay.

Required controls before live use:

- Local-only or authenticated network boundary.
- Encryption at rest for L2 and separate encryption for L3.
- Access logs for vault reads.
- Backup and rollback ledger.
- No broad internet-facing API.

NAS deployment, service changes, key provisioning, or data movement are not part
of this document's execution scope.

### VPS Relay

Allowed:

- Narrow relay or queue metadata.
- Opaque envelope IDs.
- Provider routing status.
- Short-lived delivery coordination.
- Access logs with no content.

Blocked:

- Raw message body.
- Memory atom content.
- Vault payloads.
- Health values or health summaries.
- Consent records.
- Style-training sources.
- Export files.

Default retention for relay metadata: 15 minutes or less. VPS access logs may
retain connection metadata for up to 7 days, with no message content.

## Retention Strategy

| Data kind | Default retention | Max without explicit override | Deletion model |
| --- | --- | --- | --- |
| L1 ordinary context | 24h | 72h | Hard-delete on TTL |
| L1 health or sensitive context | 1h | 24h | Hard-delete or vault-route |
| Session deltas | Same as source L1 | 72h | Hard-delete |
| Preference atoms | Indefinite | Owner-controlled | Soft-delete, then hard-delete after grace |
| Event atoms | Indefinite with stale review | Owner-controlled | Soft-delete, then hard-delete after grace |
| Relationship atoms | Review every 90d | Owner-controlled | Soft-delete, then hard-delete after grace |
| Device status | 30d | 90d | Hard-delete or compact |
| Chat summaries | 30d default, 365d for owner-promoted summaries | Owner-controlled | Compact or soft-delete |
| Raw health readings | 30d after aggregation | 30d | Hard-delete |
| Health trend summaries | 365d suggested | Owner-controlled | Vault delete or owner review |
| Sensitive vault facts | Owner-controlled | Owner-controlled | Owner-confirmed hard-delete |
| Audit metadata | 365d | Owner-controlled | Metadata-only delete/compact |
| VPS relay metadata | 15m | 15m | Hard-delete |
| VPS access logs | 7d | 30d with explicit policy | Delete/rotate |

L2 soft-delete grace is planned as 30 days. Deleted atoms must disappear from
recall immediately. Vault deletion may be immediate hard-delete by explicit
owner request because a grace period can conflict with privacy expectations.

## Migration Route From Current `memory.db`

This section is a future plan only. It does not execute migration and does not
inspect the current database.

### Preconditions

- Explicit L3 repair authorization for schema migration or data movement.
- Stop or pause local writers.
- Confirm no active style-thread work depends on the database.
- Create rollback location outside tracked docs.
- Confirm encryption/key plan before any vault migration.
- Confirm tests and smoke checks to run after migration.

### Phase 0: Snapshot And Freeze

- Stop writes.
- Make a byte-level backup of the database.
- Record file checksum and table row counts.
- Record current application version and migration script version.
- Stop if backup, checksum, or row-count recording fails.

### Phase 1: Additive Schema

- Add new columns to existing tables only when safe.
- Create new tables: `class_policies`, `vault_entries`, `vault_access_logs`,
  `migration_log`, and optional `schema_meta`.
- Do not drop old columns.
- Keep old code path available until cutover is verified.

### Phase 2: Metadata-Only Classification

Use existing columns, not content inspection, for conservative first-pass
classification:

- `scope=health_private` or `memory_type` health-related -> `health_trend` or
  `sensitive_fact`, L3 review.
- `scope=style_training` or style-related type -> `style_signal`, consented L3
  or L2 summary review.
- `scope=partner_private` -> confidential relationship or sensitive review.
- `privacy_class=never_quote` -> suppressed projection and review.
- `memory_type=preference` -> L2 `preference`.
- `memory_type=event` -> L2 `event`.
- `memory_type=relationship` -> L2 `relationship`.
- `memory_type=device_status` -> L1 or short-retention L2.
- Unknown or free-text `memory_type=fact` -> L2 candidate review, not automatic
  vault and not automatic speaker-safe.

Stop if classification counts do not sum to original counts, if unknown schema
columns appear, or if any rule would require reading real payloads before the
approved migration phase.

### Phase 3: Vault Migration Planning

- Design encryption key storage.
- Decide whether sensitive existing atom payloads are moved into encrypted
  `vault_entries` or quarantined for owner review.
- Replace L2 content with safe summary or `[VAULT:<handle>]` only after
  encrypted vault write verifies.
- Audit all vault moves.
- Stop if key creation, encryption verification, or row-count parity fails.

### Phase 4: Review Queue And Cutover

- Mark migrated sensitive or ambiguous items as review-needed.
- Keep old promoted atoms visible only if they pass the new policy gates.
- Run focused tests for recall, speaker blocks, delete, explain, disabled class,
  and export summary.
- Cut over only after owner confirms export summary and review counts look
  reasonable.

### Rollback

- Restore the byte-level backup.
- Repoint local app to the previous database path.
- Keep migration logs and failed schema copy for offline diagnosis.
- Never roll forward from a partially encrypted vault state without verifying
  handle counts and decryptability.

## Acceptance Checks For v0.1 Implementation

Documentation acceptance:

- The three layers are named and have data models.
- The seven required classes are defined.
- API drafts cover ingest, recall, explain, delete, disable class, and export
  summary.
- iOS, StackChan, NAS, and VPS visibility rules are explicit.
- Retention policy names concrete durations.
- Migration is plan-only and states no `memory.db` access occurred in this
  design thread.

Future implementation acceptance:

- Unit tests cover class disable for ingest and recall.
- Unit tests cover speaker hard blocks for health, partner-private, style
  training, memory maintenance, and vault-backed atoms.
- Unit tests prove `search`, `reviews`, and `explain` are owner-gated.
- Recall never returns vault payloads.
- Export summary returns counts and redacted inventory, not raw vault data.
- Consent state hydrates from stored records on startup.
- L1 retention cleanup deletes context without deleting promoted atoms.
- Migration dry-run reports counts only and can run without content export.
- StackChan speaker recall and spoken-output decisions are audit-logged without
  storing sensitive payloads.
- Recall APIs have rate limits or abuse guards so an allowed client cannot
  enumerate memory through repeated queries.

## Open Decisions

- Whether to keep candidate atoms in `memory_atoms.status=candidate` or split a
  separate `candidate_atoms` table.
- Exact encryption and key-storage mechanism for L3.
- Exact consent-record schema, revocation behavior, and cascade rules for atoms
  and vault handles tied to revoked consent.
- Exact normalization gate behavior: quote limits, entity extraction, fact
  decomposition, rejection, retry, and review escalation.
- Whether ordinary L1 default remains 24h or expands to 72h after more use.
- Whether NAS search uses SQLite FTS, vector search, or both.
- Whether owner export ever supports raw L2 export, or only summaries.
- How StackChan presence detection should prove that owner-private speech is
  safe in a room.
- How owner-initiated reclassification works when a memory is too strict, too
  broad, or mapped to the wrong class.
- The migration dry-run runbook and rollback verification test to require
  before any future schema/data migration.
