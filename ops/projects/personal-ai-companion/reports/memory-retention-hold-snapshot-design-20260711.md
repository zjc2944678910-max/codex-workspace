# Memory Retention Hold and Snapshot Adapter Design

Date: 2026-07-11  
Status: `local/mock verified` synthetic adapter follow-through; real inventory
integration remains `blocked pending a future authoritative producer and admission boundary`

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: this report only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- forbidden_surfaces: all product code and tests, other ops documents, Git and
  GitHub, DB/data/state, environment and credentials, network/services,
  devices, HealthKit, migrations, retention execution/deletion, and deploy.

## Confirmed Evidence

`RetentionInventoryMetadata` is the existing planner input contract. It has
boolean `legal_hold`, `owner_hold`, and seven planner booleans:
`cache_resource_exists`, `index_resource_exists`, `vector_resource_exists`,
`vault_resource_exists`, `atom_resource_exists`, `inline_resource_exists`, and
`audit_record_exists`. The first six are resource-existence booleans;
`audit_record_exists` is an audit-retention/redaction recommendation signal,
not a resource-deletion action. The planner rejects non-boolean values,
returns a dry-run result only, and suppresses an expired deletion plan for
either hold (with legal hold taking precedence when both are true).

The synthetic `InlineRetentionMetadataView` now supplies both holds and a
complete seven-planner-boolean snapshot explicitly and without
defaults. The adapter strictly requires `type(flag) is bool`, copies every
accepted flag verbatim to `RetentionInventoryMetadata`, and rejects a
non-`None` `deleted_at_ms` before a snapshot is created. It does not infer a
hold or resource from `candidate`/`promoted` lifecycle state. This is locally
tested synthetic behavior, not proof that a particular atom or inline resource
exists.

The current `MemoryAtom` and `memory_atoms` schema do not expose this complete
atom-level retention-inventory contract: they do not prove legal/owner holds,
the planner retention policy and expiry, payload location, or the seven
planner booleans as one verified snapshot. `store.ClassPolicy` must not be
automatically mapped to `RetentionPolicy`, legal hold, or owner hold; any
future relationship needs an explicit, separately verified contract.

The external advisor contributed read-only, abstract implementation advice
only. It is not a source of truth, did not inspect a real inventory, and did
not receive credentials, private payloads, or real runtime state.

## Implemented Synthetic Contract

1. Keep the existing `RetentionInventoryMetadata` boolean contract and the
   planner unchanged. This design does not introduce tri-state flags or change
   planner behavior.
2. The synthetic-only `InlineRetentionMetadataView` declares all of the
   following fields explicitly and without defaults:
   `legal_hold`, `owner_hold`, `cache_resource_exists`,
   `index_resource_exists`, `vector_resource_exists`,
   `vault_resource_exists`, `atom_resource_exists`,
   `inline_resource_exists`, and `audit_record_exists`.
3. Mapping rejects a missing constructor value, `None`, or any non-boolean
   value for every field. It must not coerce truthy/falsy values or rely on a
   DTO default. The rejection is fail-closed: no inventory DTO is returned.
4. After validation, the adapter copies every supplied hold and
   planner boolean verbatim to the matching
   `RetentionInventoryMetadata` field.
5. `candidate` and `promoted` remain only lifecycle eligibility states for an
   undeleted inline view. They must never establish a hold, establish resource
   or audit state, or change any supplied planner boolean. The adapter must not
   infer existence from status, atom ID, content, a disclosure fallback, or any
   other default.

This is a strict synthetic metadata boundary. A caller may provide a complete
synthetic snapshot for local planner tests, but this design does not identify
or authorize a future real source of truth. It also does not change the current
planner's direct DTO behavior or defaults.

## Verified Synthetic Coverage

The completed synthetic adapter tests cover the following cases:

- Every explicitly supplied `false` hold/planner boolean remains `false` after
  mapping; no false value is replaced by a default or inferred `true`.
- An expired item with `legal_hold=true` yields a planner `SKIP` result with
  the legal-hold reason; an expired item with only `owner_hold=true` yields
  the owner-hold reason; both true keep legal-hold precedence. None receives a
  delete plan.
- Omitted fields, `None`, strings, integers, and other non-boolean values for
  every new flag fail closed before planner input is created.
- For otherwise identical supplied snapshots, `candidate` and `promoted`
  preserve every hold/planner boolean exactly. Status must not mutate or
  derive any flag.
- Poisoned `content`, payload, provenance, source-event, source-session, and
  vault-handle properties are never read. The adapter must remain
  payload-free.
- Static import inspection confirms that the adapter continues to import no
  store, service, migration, keyring, vault, filesystem, database, network,
  or execution runtime module.
- Existing validation remains: only inline, non-deleted, valid lifecycle views
  can map; the adapter itself neither calls the planner nor mutates its input.

Recorded verification is 87 focused synthetic tests passed plus `compileall`
passed. These checks are local/mock evidence only.

## Non-Goals and L3 Boundary

This design does not change a store/schema, create a migration, read a real
inventory, establish an authoritative hold/policy/planner-boolean snapshot, connect
to data, or execute a retention plan. A local synthetic mapping result is not
evidence of real-store safety, safe deletion, or live retention enforcement.

Any real inventory/source-of-truth implementation, store integration,
persistence, scheduler, deletion, key action, or deployment remains out of
scope. No authoritative future producer or producer/projection admission
boundary exists, and no store, schema, or data work occurred. Real retention
execution is L3 and requires a separate explicit manual gate, target-specific
Route Lock, and verification plan.

## Exactly One Next Task

`PAC-MEMORY-RETENTION-SNAPSHOT-ADMISSION-DESIGN` (L1, local design-only) is
the sole proposed next task. It must define the future producer/projection
admission boundary that prevents unverified raw DTO input from reaching
planning, without changing code, a store, DB, schema, migration, real data,
network, credentials, runtime services, or retention execution. Any future
real storage integration or retention work is a separate L3 task with its own
manual gate.
