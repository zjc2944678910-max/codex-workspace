# PAC Memory/Privacy Readiness Map

Date: 2026-07-11

Status: L1 read-only architecture map. This report does not inspect `memory.db`,
`data/`, state, key material, real chats, services, or network state.

Historical snapshot note (updated 2026-07-15): this report preserves the bounded
source map and next-task decision made on 2026-07-11. The retention-inventory
bridge and later synthetic snapshot/admission work were subsequently completed,
so the `Exactly One Safe Next Implementation Task` section below is superseded
and must not be treated as the current queue. Use the project
[README](../README.md), product `main@72258a1`, and the dated
[Phase 4 readiness update](memory-phase-4-readiness-20260714.md) for current facts
and remaining production boundaries.

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: memory/privacy readiness map and next safe local slice
- project_root: `projects/products/personal-ai-companion`
- ops_root: `ops/projects/personal-ai-companion`
- forbidden surfaces: `memory.db` and sidecars, `data/`, `.env*`, `state/`, raw
  chats, profile material, real API/service state, migration execution, Git,
  GitHub, and external models.

## Method And Evidence Boundary

GitNexus was checked first. `personal-ai-companion` is not an indexed repository,
so this pass did not run `analyze` or reindex. It instead read only the bounded
source, synthetic-test, and memory ops-document paths named in the task.

The test files contain 201 statically discovered test functions across the
reviewed memory/privacy/router surface. They were not executed in this pass, so
the table distinguishes source-backed implementation from historical test-pass
claims. No test, database, runtime, or service command was run.

Older planning documents are useful design intent, not proof of current behavior.
In particular, the 2026-07-08 readiness document describes prompt projection,
owner-gated reads, consent hydration, class policies, export summary, and rate
limits as future work. Current source now contains counterparts for those
controls; this report treats the current source and tests as authoritative for
local behavior and retains the document only for planned runtime gates.

## Evidence Table

| Surface | Confirmed implemented and locally tested surface | Planned or unknown from this bounded review | L3-gated runtime/data work |
| --- | --- | --- | --- |
| Memory store | `MemoryStore` defaults to `:memory:` and holds messages, deltas, atoms, reviews, consent records, class policies, audit logs, and usage data. The migration registry has v1/v2 schema definitions. See `src/personal_ai_companion/memory/store.py:233-255`, `src/personal_ai_companion/memory/migrations.py:53-162`, and synthetic coverage in `tests/test_memory_service.py` and `tests/test_memory_migrations.py`. | This pass did not inspect API wiring or any database instance. The current `MemoryAtom` contract is plaintext-inline only; it has no persisted vault location, handle, or expiry fields. See `store.py:85-119`. | Opening, querying, writing, migrating, exporting, or backing up a real store; any data backfill; and any real schema adoption. The protected-store code deliberately refuses automatic migration of the project database: `migrations.py:304-356`. |
| Privacy projection | `MemoryDisclosure` is payload-free; `PrivacyKernel` denies never-quote, sensitive-fact, vault-associated, and non-inline material before disclosure. `ModelRouter` projects only after that gate. See `contracts.py:30-114`, `privacy.py:34-116`, and `model_router.py:284-324`. Static test coverage includes kernel gate cases and denied-content-getter cases in `tests/test_core_kernels.py` and `tests/test_model_router.py`. | Public API call paths and all runtime callers were out of scope, so end-to-end enforcement beyond the reviewed service/router boundary is unconfirmed. | Any actual routing of private prompts to a configured cloud provider or a physical-device output. `ModelRouter.select()` has a private-cloud branch when configuration permits it; no configuration was read here: `model_router.py:79-131`. |
| Vault crypto and key handling | Vault primitives create wrapped key bundles, encrypt/decrypt with authenticated metadata, and expose an explicitly injected, locked-by-default keyring and text codec. Rotation planning is mutation-free. See `vault.py:513-637`, `key_session.py:39-204`, `keyring.py:31-274`, `vault_record.py:219-285`, and `vault_rotation.py:168-230`. Synthetic coverage is in `tests/test_memory_vault.py`, `test_memory_key_session.py`, `test_memory_keyring.py`, `test_memory_vault_record.py`, and `test_memory_vault_rotation.py`. | No reviewed source connects `MemoryVaultCodec` or `VaultKeyring` to `MemoryStore` or `MemoryService`; no vault-entry, access-log, or key-version schema appears in the current migration registry. | Generating, loading, writing, unlocking, rotating, or retiring real keys; creating persistent vault records; re-encrypting historical payloads; or testing recovery with real material. |
| Retention | `plan_retention()` is a pure metadata-only dry-run planner. It returns L3-required proposed actions and explicitly marks real purge, secure delete, key destruction, and vacuum as forbidden. See `retention.py:1-177`, `retention.py:355-550`, and `tests/test_memory_retention.py`. The test suite also asserts that the planner imports neither store, migrations, nor service. | No reviewed adapter supplies live store metadata to the planner, and no executor, scheduler, retention inventory reader, or audit-application path was found. The ops manifest still leaves detailed lifecycle policy as a plan: `manifests/memory-layer-v0.1.md:477-535`. | Any actual cleanup, compaction, index/vector removal, vault deletion, scheduler activation, or retention run against private state. |
| Deletion | The current service requires owner confirmation before calling `MemoryStore.soft_delete`; the store marks an atom deleted and excludes it from normal search. See `service.py:229-236` and `store.py:562-590`; synthetic behavior is covered in `tests/test_memory_service.py`. | No permanent-delete implementation or verified grace-period executor was found in the reviewed paths. A retention plan is not an execution result. | Permanent deletion, secure wipe, key destruction, or deletion against a real backup/vault/database. These require a distinct L3 point-of-no-return decision. |
| Embeddings and vector retrieval | Within the allowed source surface, no embedding generation, vector storage, similarity retrieval, or vector client exists. The only vector references are retention resource/action labels, which do not execute work: `retention.py:59-79`, `retention.py:355-381`. | Database choice, embedding model/dimensions, and NAS responsibilities remain explicit open decisions in `ARCHITECTURE_TODO.md:6471-6482`. | Creating indexes or embeddings from private data, sending text to an embedding/cloud service, persisting vectors, or deleting a real derived index. |
| Admin and consent surfaces | `MemoryService` has owner-gated admin search/reviews/explain wrappers, metadata-only summary output, class-policy actions, consent grant/revoke, startup consent hydration, and operation-scoped rate limiting. See `service.py:250-480`; source-backed tests are in `tests/test_memory_service.py` and `tests/test_model_router.py`. The store persists consent and policy metadata in its local schema: `store.py:413-539`. | API/UI bindings, evidence capture UX, owner identity provisioning, and whether direct service methods are exposed safely were not reviewed. `explain()` itself is not an owner gate; callers must use the admin wrapper or an equivalent boundary. | Recording genuine user consent, exposing actual admin data, revoking or changing real user policy, and sending protected data to any cloud or device endpoint. |

## Shared-Contract Risks

1. `MemoryAtom` is the central cross-module contract, but it currently models
   inline plaintext and lacks vault/retention metadata. `MemoryDisclosure` has
   forward-compatible defaults that treat absent payload-location metadata as
   inline (`contracts.py:38-55`). Any future vault migration must update the
   store schema, `MemoryAtom`, disclosure/projection, retention inventory, and
   service/API bindings as one reviewed contract rather than adding a vault
   field in isolation.
2. The service can persist incoming text and candidate text when invoked
   (`service.py:69-136`); this was not invoked here. Existing local tests show
   conservative candidate review and disclosure behavior, but they do not prove
   real-data consent or runtime ingress controls.
3. Retention planning intentionally has no dependency on store/service/migration
   code (`tests/test_memory_retention.py:369-374`). That is a useful safety
   boundary, but also means a plan cannot currently demonstrate cleanup of an
   actual row or derived resource.
4. Static routing retains a configuration-controlled private-cloud path for
   sensitive scopes (`model_router.py:79-131`). No environment/configuration was
   inspected, so whether that branch is enabled is unconfirmed. A local-first
   unit test is not proof that a real private prompt stays local.
5. The implementation-readiness document is partially stale relative to source.
   It should not be used alone to decide whether a predecessor control exists;
   a future L2/L3 gate must re-check current source, focused tests, and the
   actual target state before any real-data change.

## Test Coverage Observed

Static coverage exists for migrations and protected-store behavior; candidate
review/promotion/recall, consent hydration and policy disable; disclosure and
prompt projection; retention planning; vault bundle/session/keyring/record
behavior; and rotation planning. The 201 count is a source-file discovery count,
not a pass result. No live database, cloud, device, HealthKit, or private
material test is represented by this evidence.

## Exactly One Safe Next Implementation Task

`PAC-MEMORY-RETENTION-INVENTORY-BRIDGE` (L1, synthetic-only)

Owned files only:

- `src/personal_ai_companion/memory/retention_inventory.py` (new)
- `tests/test_memory_retention_inventory.py` (new)

Implement one pure adapter that converts an explicitly supplied inline
`MemoryAtom` metadata view into `RetentionInventoryMetadata`. The adapter must
read only atom id, memory type, scope, privacy class, lifecycle timestamps, and
the caller-supplied `RetentionPolicy`; it must not read content, source event,
source session, database connection, keyring, environment, or filesystem.
It must reject soft-deleted or malformed inputs without planning a deletion.

Focused acceptance tests must use only synthetic objects and must prove:

1. Correct metadata-only mapping for a valid inline atom and caller-supplied
   policy.
2. A probe whose content/provenance properties raise is never read.
3. Deleted or malformed atoms fail closed.
4. The module has no store, service, migration, keyring, SQLite, filesystem, or
   network dependency, and it makes no retention execution call.

This slice creates a narrow, testable handoff into the existing dry-run planner;
it does not add a migration, executor, API route, schedule, vault integration,
embedding, or real database access.

## Human And Manual Gates

| Action class | Required gate before work begins |
| --- | --- |
| Genuine private data | A new explicit owner-approved scope that names the data class, target boundary, allowed reads/writes, retention, operator/time window, and stop owner. Do not infer it from an earlier local test or generic authorization. |
| Real schema or migration | Explicit L3 repair authorization, approved target identity, backup/restore plan, read-only preflight, scratch rehearsal, additive manifest, rollback evidence, and a named writer/service-control window. See `runbooks/memory-vault-rollout-gate.md:74-211`. |
| Real key material | Explicit L3 key-custody/recovery/rotation decision, protected storage boundary, unlock lifecycle, and no secret material in ordinary logs or transcripts. See `memory-vault-rollout-gate.md:126-150`. |
| Cloud transmission | Explicit owner approval for the data scope, provider and endpoint, egress classification/projection, retention/logging policy, and verification that a local-only or cloud branch actually matches that approval. |
| Permanent deletion | A separate explicit L3 point-of-no-return authorization that identifies the target class/resource, confirms backup/rollback implications, specifies verification evidence, and forbids improvised secure-delete/key-destruction steps. |

## Conclusion

The safe implementation frontier is a payload-free retention-inventory bridge,
not vault persistence or real data handling. The current source is materially
ahead of portions of the historical readiness plan, but there is still no
evidence in this pass of real-store integration, runtime consent UX, vault-store
wiring, retention execution, vector retrieval, cloud authorization, or
permanent deletion.
