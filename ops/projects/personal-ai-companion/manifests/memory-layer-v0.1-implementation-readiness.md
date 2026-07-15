# Memory Layer v0.1 Implementation Readiness

Date: 2026-07-08
Status: implementation-readiness plan
Risk level: L1 read-only code planning and local documentation

Historical planning snapshot note (updated 2026-07-15): this manifest preserves
the gaps and ordering observed on 2026-07-08. The prompt projection, owner-gated
admin, consent, class-policy, export, audit, and related predecessor controls
described below as future work subsequently landed in source. The old readiness
summary is not the current task queue. Use the project
[README](../README.md), current product `main@4a8b52e`, and the dated
[Phase 4 readiness update](../reports/memory-phase-4-readiness-20260714.md) for
current facts and remaining production boundaries.

## Scope And Route Lock

- Target project: `personal-ai-companion` memory architecture
- Product root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Ops docs:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- State root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion`
- Baseline architecture:
  `ops/projects/personal-ai-companion/manifests/memory-layer-v0.1.md`

This pass is planning-only. It did not open, query, export, migrate, or inspect
`memory.db`; it did not read real chat logs, profile exemplars, cleaned samples,
HealthKit data, API keys, `.env` files, state logs, bridge tokens, or runtime
state. It did not deploy, restart services, change DB schema, move data, or
generate encryption keys.

## Source Contracts Reviewed

Safe source files only:

- `src/personal_ai_companion/core/envelope.py`
- `src/personal_ai_companion/core/identity.py`
- `src/personal_ai_companion/core/privacy.py`
- `src/personal_ai_companion/memory/store.py`
- `src/personal_ai_companion/memory/service.py`
- `src/personal_ai_companion/api/app.py`
- `src/personal_ai_companion/routing/model_router.py`
- `tests/test_core_kernels.py`
- `tests/test_memory_service.py`
- selected synthetic API tests in `tests/test_api_app.py`

Avoided:

- `memory.db` and all DB contents
- `data/`, imported chat material, processed profiles, exemplars, and samples
- HealthKit data, API keys, `.env*`, state logs, bridge tokens, NAS/VPS state,
  Cloudflare state, and any running service control

## Current Code vs v0.1 Gaps

| Area | Current code | v0.1 target | Gap | Phase |
| --- | --- | --- | --- | --- |
| Prompt projection | `ModelRouter._memory_lines()` renders `- {memory.content}` for each recalled atom. | Prompt packs must respect `prompt_projection`, suppress vault payloads, and avoid `never_quote`. | No prompt-safe projection boundary; future vault/suppressed atoms would leak if handed to router. | L1 P0 |
| Admin search | `GET /v1/memory/search` calls `service.store.search_memories()` directly over candidate/promoted/rejected atoms. | Owner-gated admin search with envelope, pagination, class/layer filters, sensitivity caps, audit. | No envelope, owner gate, policy trace, or abuse guard. | L1 P1 |
| Review list | `GET /v1/memory/reviews` calls `service.list_reviews()` directly. | Owner-only review queue. | No envelope or owner gate. | L1 P1 |
| Explain | `GET /v1/memory/{atom_id}/explain` calls `service.explain(atom_id)` without viewer context. | Owner-gated explain with class, layer, consent, retention, projection, redacted vault handle. | No envelope gate; metadata is sparse. | L1 P1 |
| Consent hydration | `MemoryStore.active_consent_scopes()` exists, but `MemoryService.__init__()` does not hydrate `PrivacyKernel.active_consents`. | Consent survives service restart and revocation wins. | Consents are active only in the current service instance unless injected manually. | L1 P2 |
| Ingest validation | `MemoryService.ingest()` writes raw L1 message/session delta and optional candidate with caller-provided `memory_text`, `memory_type`, `scope`, `privacy_class`. | Classification, scope, sensitivity, and normalization gates before candidate promotion. | No enum validation, scope consistency check, class policy check, normalization gate, or vault router. | L1 P2/L3 |
| Speaker blocks | `PrivacyKernel.SPEAKER_BLOCKED_SCOPES` blocks `health_private`, `style_training`, `memory_maintenance`, and `partner_private`. | Also block `sensitive_fact`, vault-backed atoms, and girlfriend/style source details; summary-only for selected shared scopes. | Scope-only blocking exists; class/vault/projection blocking is not modeled yet. | L1 P0/P2 |
| Class policy | No class policy model or storage. | Owner can disable ingest/recall/export per memory class without deleting data. | Missing policy model, checks, API, audit, tests. | L1 P3 |
| Disable-class API | Not implemented. | `POST /v1/memory/disable-class`. | Missing endpoint and service/store support. | L1 P3 |
| Export summary | Not implemented. | Owner-only counts and redacted inventory, no raw vault data. | Missing endpoint, summarizer, redaction, disabled-class handling. | L1 P4 |
| Vault | No `vault_entries`, `vault_handle`, encryption key ref, vault access log. | Separate encrypted sensitive data vault with opaque handles. | Requires schema, key, data movement, and migration planning. | L3 only |
| Retention metadata | `conversation_messages` uses `created_at_ms`; pruning is cutoff-based. `session_deltas` has `expires_at_ms` but current insert does not set it. | L1 rows carry expiry; sensitive L1 has shorter TTL. | Existing pruning works for chat context, but per-row/per-class TTL is incomplete. | L1 P2/L3 |
| Audit | `memory_audit_logs` records status changes and delete. | Search, explain, review list, disable-class, export-summary, speaker disclosure, denials, vault reads audited without content. | Audit surface is too narrow. | L1 P2/P3 |
| Rate/abuse guard | None observed. | Prevent repeated recall/search enumeration. | No operation-scoped limiter or test seam. | L1 P3 |

## Implementation Priority

### P0: Prompt Projection Guard

Why first: recalled atoms are injected into prompts through
`ModelRouter._memory_lines()`. A future vault-backed or suppressed atom must not
rely only on upstream recall filtering.

File-level plan:

- `src/personal_ai_companion/routing/model_router.py`
  - Replace raw `_memory_lines()` rendering with a prompt-safe projection helper.
  - Suppress `privacy_class=never_quote`.
  - Suppress or redact content matching planned vault handles, such as
    `[VAULT:<handle>]`.
  - Keep current behavior for ordinary promoted non-sensitive atoms.
- `tests/test_model_router.py`
  - Add tests that safe atoms appear, `never_quote` atoms are suppressed, vault
    handles are not projected, and mixed safe/unsafe atom lists produce only
    safe prompt text.

No schema or DB migration is needed.

### P1: Owner-Gated Admin Reads

Recommended shape: convert admin reads to POST endpoints with an
`InteractionEnvelope` in the body. These endpoints appear local and not yet
publicly stable, so consistency with existing `/v1/memory/ingest` and
`/v1/memory/recall` is more valuable than preserving GET shape.

File-level plan:

- `src/personal_ai_companion/memory/service.py`
  - Add owner-gated `search_admin(envelope, query, limit, statuses)`.
  - Add owner-gated `list_reviews(envelope, status, limit)`.
  - Change or wrap `explain(envelope, atom_id)` so non-owner callers get denial
    before memory details are loaded.
  - Return structured denial results rather than raw exceptions.
- `src/personal_ai_companion/api/app.py`
  - Add `POST /v1/memory/search`.
  - Add `POST /v1/memory/reviews`.
  - Add `POST /v1/memory/{atom_id}/explain` or equivalent body-bearing route.
  - Keep old GET routes only as local compatibility wrappers if they are
    explicitly owner-authenticated, otherwise mark them deprecated/disabled.
- `tests/test_api_app.py`
  - Non-owner search/reviews/explain return a denial shape or 403.
  - Owner search/reviews/explain succeed.
  - Gate failure happens before store read where practical, using a fake store
    or service seam.

No schema or DB migration is needed.

### P2: Consent Hydration, Ingest Validation, And Retention Seams

File-level plan:

- `src/personal_ai_companion/memory/service.py`
  - Add optional startup hydration of active consent scopes from
    `MemoryStore.active_consent_scopes(owner_entity_id)`.
  - Default to no active consents when the owner id is absent or hydration fails.
  - Validate known `privacy_class`, known scope, and basic actor/scope
    consistency before candidate creation.
  - Add a small normalization gate seam that can initially reject long verbatim
    candidates or mark them review-required without trying to auto-migrate data.
- `src/personal_ai_companion/memory/store.py`
  - Add helpers for audit append/read using existing `memory_audit_logs`.
  - Optionally add methods to set `expires_at_ms` for new in-memory/test
    session deltas; do not migrate existing DB contents in this phase.
- `tests/test_memory_service.py`
  - Consent grant persists in a test store and hydrates into a new service.
  - Revocation wins after hydration.
  - Unknown `privacy_class` or impossible actor/scope pairing is rejected.
  - Sensitive/speaker-origin candidate paths default conservative.

No production `memory.db` schema migration in this phase. Any code-level table
addition must be tested against `:memory:` or a temporary DB only.

### P3: Class Policy And Disable-Class

L1 implementation can start with an in-memory `ClassPolicy` registry on
`MemoryService`. Persistence across restarts is useful but not required for the
first safe code slice unless it uses test/temp DB only.

File-level plan:

- `src/personal_ai_companion/memory/service.py`
  - Add `ClassPolicy` dataclass.
  - Add `disable_class(envelope, memory_class, action, scope, duration, reason,
    confirmed)`.
  - Check policies in `ingest`, `recall`, admin search, and export summary.
  - Re-enable restores visibility; disable does not edit or delete atoms.
- `src/personal_ai_companion/api/app.py`
  - Add `POST /v1/memory/disable-class`.
- `src/personal_ai_companion/core/privacy.py`
  - Extend `can_mutate_memory()` to include `disable_class` and
    `export_summary` as owner-only actions.
- `tests/test_memory_service.py` and `tests/test_api_app.py`
  - Disable blocks ingest.
  - Disable suppresses recall/search/export.
  - Re-enable restores visibility.
  - Atom content/status/timestamps are unchanged by disable.
  - Unknown class gives validation error with no partial state change.

Persistent class policies that require new tables on the existing local DB are
L3 until explicitly authorized.

### P4: Export Summary

File-level plan:

- `src/personal_ai_companion/memory/service.py`
  - Add owner-only `export_summary(envelope, filters, include_redacted_examples)`.
  - Return counts by status, memory type/class, scope, privacy class, disabled
    class state, oldest/newest timestamps, and review counts.
  - Redacted examples are off by default; if enabled, truncate and suppress
    vault-handle-like content.
- `src/personal_ai_companion/api/app.py`
  - Add `POST /v1/memory/export-summary`.
- `tests/test_api_app.py`
  - Non-owner denied.
  - Owner gets counts and no raw content by default.
  - Disabled classes appear as suppressed metadata.
  - Vault-handle-like content is never exported as raw content.

No DB migration is needed for count-only summaries over current tables.

### P5: Audit And Rate/Abuse Guard

File-level plan:

- `src/personal_ai_companion/memory/service.py`
  - Add audit events for denials, successful admin reads, disable-class, export
    summary, and prompt/speaker suppression decisions.
  - Add a small operation-scoped rate limiter seam, initially in-memory and
    injectable for tests.
- `src/personal_ai_companion/memory/store.py`
  - Reuse `memory_audit_logs` for append-only metadata; do not include content.
- `tests/test_memory_service.py`
  - Denials and owner reads write audit entries.
  - Audit entries contain actor/action/reason/timestamp and no content.
  - Rate limit blocks search/recall enumeration without mutating data.

This is L1 if purely local/in-memory. Durable audit retention policy and
append-only hardening against live DB are L3.

## L3-Only Migration Or Repair Work

These items must stop at plan until the user explicitly says
`进入修复阶段`:

- Opening, querying, exporting, or migrating the existing `memory.db`.
- Any schema write against the existing local `memory.db`.
- Creating `vault_entries`, `vault_access_logs`, `vault_key_versions`, or
  persistent `class_policies` in the existing DB.
- Generating, storing, rotating, or migrating encryption keys.
- Moving existing atom payloads into a vault.
- Replacing L2 content with vault handles for existing rows.
- Running data backfills, classification jobs, or count reports against the
  existing DB.
- Freezing writers, restarting services, or changing running service config.
- NAS/VPS/Cloudflare deployment, sync, relay, storage, backup, or exposure work.

## Suggested Test Plan

### Prompt Projection

- Safe ordinary promoted atom appears in prompt memory lines.
- `privacy_class=never_quote` atom is suppressed.
- `[VAULT:<handle>]`-shaped content is redacted or suppressed.
- Mixed safe/unsafe atom list yields only safe prompt text.
- Speaker prompt generation remains safe even if a future caller passes an
  unsafe atom list.

### Owner Gates

- Non-owner search returns denial and no memory list.
- Owner search returns matching atoms.
- Non-owner review list is denied.
- Owner review list succeeds.
- Non-owner explain is denied.
- Owner explain includes provenance metadata.
- Missing atom explain returns clean not-found without stack trace leakage.

### Speaker Blocks

- StackChan speaker blocks `health_private`.
- StackChan speaker blocks `partner_private`.
- StackChan speaker blocks `style_training`.
- StackChan speaker blocks `memory_maintenance`.
- StackChan speaker blocks `never_quote`.
- StackChan speaker blocks vault-handle-like projected content.
- Group-safe content remains allowed.

### Consent Hydration

- Service with hydrated owner consents can recall consented `style_training`.
- Service without hydration blocks `style_training`.
- Revoked consent remains revoked after hydration.
- Missing consent blocks sensitive recall and writes an audit denial.

### Class Disable

- Disable class blocks new ingest for that class.
- Disable class suppresses recall.
- Disable class suppresses admin search.
- Disable class appears as suppressed counts in export summary.
- Re-enable restores visibility without mutating atom content/status/timestamps.

### Export Redaction

- Summary returns counts and date ranges only by default.
- Redacted examples are off by default.
- Redacted examples, when enabled, are truncated.
- Vault-handle-like content never appears as raw export content.
- Disabled classes are counted but marked suppressed.

### Audit And Abuse Guard

- Denied admin action writes metadata-only audit entry.
- Successful owner admin action writes metadata-only audit entry.
- Disable-class and export-summary are audited.
- Audit read, if exposed, is owner-gated.
- Search/recall rate limit is operation-scoped and does not mutate data.

## Future L3 Migration Checklist

This checklist is inert in L1. It becomes actionable only after explicit repair
authorization.

1. Confirm the repair phrase and re-state L3 scope.
2. Stop or pause writers only after approval.
3. Create a byte-level backup of `memory.db`.
4. Verify backup checksum.
5. Restore the backup to a scratch DB before touching live DB.
6. Run schema-only inventory and integrity checks on an approved copy.
7. Produce count-only reports; do not display or export content.
8. Review additive schema plan for new columns/tables.
9. Confirm key management design before any vault table or payload migration.
10. Run migration dry-run on a copy.
11. Verify handle counts, redaction, and decryptability on the copy.
12. Run full memory/privacy/API test suite on the copy.
13. Prepare rollback instructions and owner sign-off.
14. Touch live DB only after copy migration and rollback verification pass.
15. Halt immediately on integrity failure, count mismatch, unknown schema, key
    failure, decrypt failure, or service health uncertainty.

## Readiness Summary

The next safe implementation slice is not vault migration. It is:

1. Prompt-safe memory projection.
2. Owner-gated search/reviews/explain.
3. Consent hydration and basic ingest validation.
4. Class disable.
5. Export summary.
6. Audit and rate-limit seams.

Everything involving existing `memory.db` contents, persistent schema migration,
vault encryption, key handling, data movement, service restart, NAS, VPS, or
Cloudflare remains L3 and must wait for explicit repair authorization.
