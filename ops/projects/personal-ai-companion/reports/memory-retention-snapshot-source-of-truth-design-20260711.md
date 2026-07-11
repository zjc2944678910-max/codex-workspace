# Memory Retention Snapshot Source-of-Truth Design

Date: 2026-07-11  
Status: L1 local design-only; no real inventory or retention action is authorized

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: this report only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- forbidden_surfaces: all product code and tests; all other ops documents; Git and
  GitHub; DB/data/state; environment and credentials; network/services; devices;
  HealthKit; migrations; retention execution/deletion; and deploy.

## Current Evidence

`RetentionInventoryMetadata` is the existing dry-run planner input, and the
planner can accept that DTO directly. Its fields include an explicit
`RetentionPolicy`/expiry, legal and owner holds, payload-location
classification, and seven planner booleans. Legal/owner holds and the seven
planner booleans currently have defaults in the DTO; the current planner does
not itself require a complete trusted snapshot at runtime.

1. `cache_resource_exists`
2. `index_resource_exists`
3. `vector_resource_exists`
4. `vault_resource_exists`
5. `atom_resource_exists`
6. `inline_resource_exists`
7. `audit_record_exists`

The first six names are resource-existence booleans. `audit_record_exists` is
instead an audit-retention/redaction recommendation signal: it does not create
a resource deletion action. The seven names must therefore be described as
planner booleans, not collectively as resource-existence facts.

The local synthetic `InlineRetentionMetadataView` is an existing payload-free
adapter boundary. It accepts only `candidate` or `promoted` inline lifecycle
eligibility, rejects deleted, non-inline, or malformed input before planning,
and copies metadata into the planner DTO. It is neither a trusted snapshot nor
a real source of truth. Its lifecycle eligibility is not a general planning
admission rule: current store status is free text, so a future trusted snapshot
must separately define and validate the lifecycle set that may enter planning.

The current `MemoryAtom`/schema contract has atom identity, lifecycle status,
timestamps, and deleted timestamp, but it does not provide one authoritative,
coherent per-atom assertion for legal/owner holds, retention policy/expiry,
payload location, and the seven planner booleans. Neither `MemoryAtom`, the
current adapter, nor the planner has snapshot schema version, revision, capture
authority, capture timestamp, or freshness semantics. No reviewed source
currently mints the proposed assertion. The absence is a source-of-truth gap,
not permission to infer missing facts from the existing atom or adapter
defaults.

`store.ClassPolicy` must not be automatically mapped to `RetentionPolicy`,
legal hold, or owner hold. Those concepts have different semantics; any future
relationship would need an explicit, separately verified contract.

An external advisor supplied abstract, read-only design advice only. It is not
a source of truth, did not inspect a real inventory, and did not receive
private payloads, credentials, or runtime state.

## Contract Decision

Before a future trusted producer or projection is admitted to create planner
DTOs, it must mint one immutable, metadata-only, per-atom
`TrustedRetentionSnapshot`. Complete-snapshot admission is a precondition for
that future producer/projection entry boundary, not a current planner runtime
guarantee and not a property of the existing adapter. This is a conceptual
contract decision only: it does not introduce a class, schema, persistence
format, or implementation in this task.

The capture authority must make one complete and coherent metadata assertion
for a single atom/revision. It must not derive holds or planner booleans from
`MemoryAtom.status`, atom ID, disclosure fallbacks, or caller defaults. The
planner contract remains unchanged: this phase neither changes its booleans nor
introduces tri-state values.

## Required Snapshot Content

The future `TrustedRetentionSnapshot` contract must contain only these
metadata categories:

- opaque atom or inventory identity, never a storage locator or personal
  identifier;
- snapshot schema version and a monotonic per-atom revision;
- capture timestamp;
- named capture authority and its version;
- lifecycle status and deleted timestamp;
- explicit `RetentionPolicy` and expiry metadata;
- strict boolean legal and owner holds;
- exactly the seven named planner booleans from the current planner contract,
  with `audit_record_exists` retained solely as the audit-retention/redaction
  recommendation signal described above; and
- payload-location classification only.

The capture authority is responsible for supplying the whole set together. A
consumer may validate a snapshot but may not fill a missing field from a
different read, an older DTO, a lifecycle label, an ID convention, or a
default.

## Forbidden Fields And Inputs

The snapshot must never include or require:

- memory content, text, payload bytes, summaries, embeddings, or derived
  content;
- source event IDs, source session IDs, conversation identifiers, or
  provenance payloads;
- filesystem/database paths, resource locators, vault handles, or storage
  addresses;
- keys, credentials, tokens, key versions, or key-management material; or
- caller-invented hold/planner-boolean values, disclosure fallbacks, or identity-based
  inferences.

## Failure And Staleness Rule

Only a complete, internally coherent, current future trusted snapshot accepted
by its named capture authority may reach `RetentionInventoryMetadata` through
the future producer/projection admission boundary. A partial, unknown,
malformed, conflicting, or stale future snapshot must be rejected before
planner DTO creation; it must not be converted with fallback values and must
not yield a retention plan. This future rule does not alter the current
planner's direct-DTO behavior.

This design deliberately does not set a freshness interval or an atomic-read
mechanism. Future work at the actual storage boundary must separately establish
how revision comparison, atomicity, capture authority versioning, refresh, and
staleness are determined. Until then, no snapshot may be treated as fresh by
assumption.

## Non-Goals And L3 Boundary

This report designs neither batch, scheduler, executor, persistence, cache,
nor retention-run semantics. It does not authorize snapshot storage/caching,
database reads/writes, schema work, migration, real inventory connection,
retention planning against real data, deletion, key operations, or deployment.

Evidence currently proves that no real snapshot producer exists. Any real
store/schema integration, inventory/retention/deletion activity, or source
producer implementation remains L3. It requires a separate explicit manual
gate, target-specific Route Lock, backup and rollback plan, and verification
plan before execution.

## Exactly One Next Task

`PAC-MEMORY-RETENTION-SNAPSHOT-ADMISSION-DESIGN` (L1, local design-only):
define the future producer/projection admission boundary that prevents
unverified raw DTO input from reaching planning. Make no code, schema, DB,
real-data, or retention-execution change.
