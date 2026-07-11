# Memory Retention Snapshot Admission Design

Date: 2026-07-11  
Status: `local/mock verified` L1 synthetic admission/composition contract; no real source, store, schema, inventory, planner run, or retention action is authorized

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: this report only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: current source inspection finds `plan_retention()` defined in
  `src/personal_ai_companion/memory/retention.py`, direct
  `RetentionInventoryMetadata(...)` construction in synthetic planner tests,
  the local synthetic adapter, and the pure synthetic admission facade; no
  production call site for `plan_retention()`.
- forbidden_surfaces: all product code and tests; other ops documents; Git and
  GitHub; DB/data/state; environment and credentials; network/services; devices;
  HealthKit; schemas and migrations; retention planning against real data;
  retention execution/deletion; and deploy.

## Confirmed Current Facts

1. `RetentionInventoryMetadata` and `plan_retention()` are an existing pure,
   dry-run planner contract. The DTO has defaults for expiry, holds, and planner
   booleans, and the planner accepts direct instances of that DTO.
2. The current direct-DTO path remains useful for pure and synthetic planner
   tests. It is not a production admission guarantee, a provenance guarantee, or
   evidence that an input describes a real atom or resource.
3. `InlineRetentionMetadataView` is a local, payload-free synthetic adapter. It
   validates its caller-supplied inline view before creating a planner DTO, but
   it is not an authoritative producer or a general trusted-snapshot boundary.
4. `retention_admission.py` and its isolated synthetic tests now provide a pure
   local admission/composition contract. It validates explicit caller-owned
   schema/authority/lifecycle/freshness constraints, policy/times, nine strict
   hold/planner booleans, and the current one-way payload/resource rules. It
   neither imports nor calls `plan_retention()`, a store, or a runtime surface.
5. `TrustedRetentionSnapshot` retains admitted `captured_at_ms` and
   `max_freshness_ms`. Composition requires caller-supplied `now_ms` and rejects
   invalid reference time, future capture, stale snapshots, same-identity
   conflicting revisions, and same-revision contradictory metadata with empty
   metadata. These are intentionally per-snapshot/per-identity checks only;
   they do not create a global authority or cross-identity invariant.
6. Current inspected source has no production caller of `plan_retention()` and
   no source that can produce one complete, authoritative real snapshot. In
   particular, the existing `ClassPolicy` has different fields and semantics
   from `RetentionPolicy`, legal/owner holds, and the planner booleans.
7. An external advisor supplied abstract, read-only suggestions only. It is not
   a source of truth, did not inspect a real inventory, and supplies no authority
   for this design or a future runtime decision.

## Contract Decision

`RetentionInventoryMetadata` and `plan_retention()` remain unchanged. The
bounded local synthetic implementation now supplies a pure, metadata-only
admission facade before a synthetic projection can yield the planner DTO exposed
as `.metadata`. The types below are implemented only in that local synthetic
surface; they create no producer, schema, persistence format, or runtime path.

| Conceptual type | Role | May reach the planner? |
| --- | --- | --- |
| `RawRetentionSnapshotProjection` | Untrusted, complete candidate metadata from a caller-owned synthetic input or a future producer/projection. | No. |
| `RetentionAdmissionResult` | Pure accepted/rejected outcome with safe structured metadata. | No. |
| `TrustedRetentionSnapshot` | Immutable admitted wrapper that retains `.metadata` plus non-sensitive `captured_at_ms`, the admitted `max_freshness_ms`, and only contract-version information needed to interpret those fields. Its `.metadata` is the only local synthetic composition input. | Not in the implemented synthetic module; a future real route would require its own L3 authorization. |

The implemented local composition rule is narrow: composition requires its
caller to supply `now_ms` and revalidates each snapshot against its retained
`captured_at_ms` and admitted `max_freshness_ms` before returning any metadata.
It does not invoke the planner. A future real composition route may pass only an
accepted `TrustedRetentionSnapshot.metadata` to `plan_retention()`, but that
route is not implemented or authorized. This does not and cannot prevent current
tests or other deliberate pure callers from directly constructing a planner DTO.
A Python wrapper or private constructor is not, by itself, a security boundary;
producer and composition ownership must enforce any future routing rule.

### Per-Identity Revision And Per-Snapshot Freshness Invariants

An admitted snapshot's opaque inventory identity and monotonic revision remain
paired all the way through batch composition. Before any planner DTO is handed
to the planner, composition must reject a batch containing the same opaque
inventory identity at conflicting revisions, even when the corresponding planner
DTO metadata would otherwise compare equal. The existing planner's duplicate
handling cannot supply this guarantee: `RetentionInventoryMetadata` deliberately
has no revision field, so revision information has already been lost at that
boundary. Composition therefore owns this fail-closed check before planner
invocation; it must never merge, select, or silently replace a conflicting
revision.

Composition also owns a per-snapshot freshness check. Its caller supplies
`now_ms`; before returning any `.metadata`, it must reject a snapshot whose
retained `captured_at_ms` is in the future relative to that composition time, or
whose age exceeds its retained admitted `max_freshness_ms`. A composition
rejection returns empty metadata, invokes no planner, and mutates nothing.

These are intentionally limited guarantees: per-identity revision conflict and
per-snapshot freshness only. They do not create a global snapshot-consistency
guarantee per capture authority, across identities, or across a batch. No new
cross-batch invariant is introduced by this design.

## Required Raw Projection Contract

Every `RawRetentionSnapshotProjection` field below is required, explicit, and
has no admission default. It is metadata only.

| Required category | Admission requirement | Explicitly not permitted |
| --- | --- | --- |
| Opaque identity | Stable content-independent atom or inventory identity. | Personal identifiers, content, or storage locators. |
| Snapshot identity | Snapshot schema version and monotonic per-atom revision. | Missing, guessed, or silently upgraded version/revision. |
| Capture provenance | Capture time plus named capture authority and authority version. | Unnamed authority, caller assumption, credential, key, or token. |
| Planning lifecycle | One explicitly defined lifecycle value from the future eligibility contract. | Reusing a free-text status by assumption or inferring eligibility from deletion state alone. |
| Planner metadata | Current required scope, memory type, privacy class, created/updated timestamps, `RetentionPolicy`, and its exact expiry representation. | `ClassPolicy` substitution, inferred policy, implicit expiry, or borrowed metadata from another read. |
| Payload classification | Explicit `PayloadLocationCode`-equivalent classification. | Payload bytes, text, summaries, embeddings, vault handles, paths, or database locators. |
| Holds | Exact strict booleans for `legal_hold` and `owner_hold`. | Truthy/falsy coercion, lifecycle-derived holds, or fallback `False`. |
| Planner booleans | Exact strict booleans for `cache_resource_exists`, `index_resource_exists`, `vector_resource_exists`, `vault_resource_exists`, `atom_resource_exists`, `inline_resource_exists`, and `audit_record_exists`. `audit_record_exists` remains an audit recommendation signal, not a deletion resource fact. | Omission, coercion, identity/status inference, or caller defaults. |

The projection must never carry content, payloads, source-event/session or
conversation provenance, file/database/vault locators, credential material, or
key-management material. The capture authority must make one coherent
per-atom/revision assertion; admission must not combine fields from different
reads or revisions.

Structural validation of an opaque identity can check only shape and bounded
syntax. It cannot prove that a supplied value is non-PII, content-independent,
or not a storage locator. Those properties are an explicit capture-authority
assertion under the future producer contract, not a validation outcome. A future
admission implementation must reject an unsupported or untrusted
capture-authority assertion without treating a syntactically valid identity as
safe.

### Payload/Resource Coherence Matrix

Admission must validate the current planner's one-way payload/resource
coherence exactly and must never infer a resource flag from `payload_location`.
The current planner permits an explicitly false matching resource flag; it only
rejects a true vault resource outside `VAULT` and a true inline resource outside
`INLINE`. All other planner booleans remain independently explicit and are not
made true or false by this matrix. This design adds no bidirectional requirement:
an `INLINE` or `VAULT` payload location does not require its matching resource
flag to be true.

| Explicit payload location | Explicit `inline_resource_exists` | Explicit `vault_resource_exists` | Admission result under current one-way coherence |
| --- | --- | --- | --- |
| `INLINE` | `true` or `false` | `false` | Allowed if every other required field is valid; no flag is inferred. |
| `INLINE` | `true` or `false` | `true` | Rejected: a vault resource is outside `VAULT`. |
| `VAULT` | `false` | `true` or `false` | Allowed if every other required field is valid; no flag is inferred. |
| `VAULT` | `true` | `true` or `false` | Rejected: an inline resource is outside `INLINE`. |
| `NONE` | `false` | `false` | Allowed if every other required field is valid; absence is explicit. |
| `NONE` | `true` | `true` or `false` | Rejected: a present inline resource has no matching location. |
| `NONE` | `false` | `true` | Rejected: a present vault resource has no matching location. |

`InlineRetentionMetadataView` remains a separate, synthetic, inline-only
adapter. Its existing inline constraints do not generalize this matrix and must
not be used as evidence that a future `VAULT` or `NONE` projection is trusted.

## Pure Admission And Composition Semantics

The implemented local synthetic admission facade is pure. The caller supplies
both `now_ms` and `max_freshness_ms`; admission does not consult a clock, a
store, a cache, a network service, or an environment variable. On acceptance it
retains the validated non-sensitive `captured_at_ms` and admitted
`max_freshness_ms` in the `TrustedRetentionSnapshot`, rather than relying on a
later caller to provide a new freshness bound. It validates all of the following
before it creates `TrustedRetentionSnapshot` or a planner DTO:

1. Every required field is present and has its strict contract type. In
   particular, holds and all seven planner booleans must satisfy `type(value) is
   bool`; integers, strings, `None`, and coercible values are rejected.
2. Schema version, revision, capture authority/version, and capture time are
   internally coherent and explicitly supported by the future caller-owned
   contract.
3. Capture age is within the caller-supplied freshness bound using the supplied
   `now_ms`; an absent, invalid, future-inconsistent, or stale assertion is not
   assumed fresh.
4. The named planning-lifecycle value is explicitly eligible. Unknown,
   deleted, contradictory, or otherwise undefined lifecycle state is rejected.
5. The policy/expiry pair, payload classification, holds, and planner booleans
   are complete and coherent for the same identity and revision. The
   payload/resource matrix above is checked from the caller-supplied explicit
   flags, without inference.
6. During composition, the identity/revision pair remains attached to every
   admitted snapshot until the batch-level conflict check completes. The same
   opaque identity at conflicting revisions is rejected before DTO construction
   for the planner, even if its DTO metadata would otherwise be equal. This is
   not a cross-identity or capture-authority consistency assertion.
7. Composition requires caller-supplied `now_ms` and revalidates every accepted
   snapshot before returning any metadata: invalid composition time, a capture
   time later than `now_ms`, freshness arithmetic overflow, or an age greater
   than the snapshot's retained admitted `max_freshness_ms` rejects that
   composition result with empty metadata and no planner invocation.
8. A `ClassPolicy` object or its fields cannot be auto-mapped into
   `RetentionPolicy`, expiry, a hold, or a planner boolean. Such an input is
   rejected unless a future separately reviewed contract supplies each required
   retention field explicitly.
9. No fallback/default inference is allowed, including from atom ID, status,
   a previous DTO, another projection, or current DTO defaults.

## Failure Semantics

An admission failure returns `AdmissionResult.rejected` with only safe,
structured rejection metadata: stable reason code/category, schema or contract
version where safe, and non-sensitive opaque identity/revision correlation when
needed for a caller's local handling. It must not include payload, locator,
provenance, credentials, or a raw projection dump.

Rejection construction must redact or omit raw supplied identity and metadata by
default. It may return a non-sensitive opaque correlation only when the caller
already owns that value and local handling genuinely requires it; validation
errors must not echo a raw identity, raw labels, field values, or a serialized
projection merely to explain why admission failed.

For every rejection, the facade returns no `TrustedRetentionSnapshot`, creates
no `RetentionInventoryMetadata`, invokes no planner, produces no retention
plan, and mutates nothing. This is a fail-closed admission result, not a claim
that an existing direct planner call is disabled.

## Synthetic Test Contract

Existing planner and synthetic adapter tests remain unchanged. The local,
synthetic-only admission implementation has isolated unit coverage for the
following contract constraints:

- a complete coherent projection accepted with all values copied verbatim;
- each missing required field and each non-strict boolean rejected;
- malformed-but-present planner metadata rejected before a
  `RetentionInventoryMetadata` DTO is created: invalid inventory ID / opaque
  identity syntax; invalid scope, memory-type, or privacy-class labels; invalid
  timestamp types, ranges, or `created_at_ms`/`updated_at_ms` ordering; and an
  explicit expiry timestamp earlier than `created_at_ms`;
- each `RetentionPolicyCode` variant and its exact permitted expiry form:
  `EXPLICIT_EXPIRY` with an explicit expiry timestamp and no duration,
  `FROM_CREATED_AT` and `FROM_UPDATED_AT` with a valid duration and no explicit
  expiry, and `NEVER_EXPIRE` with neither duration nor expiry; plus invalid
  policy/expiry pairings and timestamp arithmetic overflow;
- every `INLINE`, `VAULT`, and `NONE` row in the payload/resource matrix,
  including allowed explicit-false matching flags and every rejected mismatched
  true-resource combination, without inferred flags; malformed or unsupported
  payload-location values and incoherent resource flags must likewise reject
  before DTO/planner construction, with no inferred location or resource flag;
- stale capture, invalid or unsupported `now_ms`, future-inconsistent capture
  time, invalid freshness bounds, and freshness arithmetic overflow rejected;
- unsupported snapshot-schema versions, unsupported capture-authority versions,
  and unsupported capture authorities rejected before a DTO can be created;
- mismatched identity/revision or conflicting assertions rejected; specifically,
  a composition batch containing the same opaque identity at two different
  revisions with otherwise identical planner metadata fails closed with empty
  metadata; the synthetic module contains no planner call;
- ineligible, unknown, deleted, or undefined planning lifecycle rejected;
- `ClassPolicy` input or automatic mapping rejected; and
- structurally valid but unsupported capture-authority identity assertions
  rejected without echoing raw supplied identity or metadata, with safe
  redaction/correlation behavior tested explicitly.

For every malformed-but-present input above, rejection tests must also prove
that returned rejection metadata does not echo the raw identity, raw labels,
raw source values, a serialized raw projection, or any payload. These tests
must use synthetic sentinel values so the no-echo assertion is deterministic;
they do not authorize a producer or real projection.

Pure composition tests prove that only accepted snapshots yield `.metadata`,
while rejected input yields empty metadata. The synthetic module has no planner
call. These tests remain synthetic and do not use a store, DB, schema, migration,
real inventory, credentials, network, or retention execution.

They must also admit one valid synthetic snapshot, then compose it with a
`now_ms` beyond its retained admitted freshness bound and prove a fail-closed
empty-metadata result. Invalid composition reference time and a retained capture
time future relative to composition `now_ms` likewise reject with empty metadata;
no planner invocation is present in this module.

## Non-Goals And L3 Boundary

The local synthetic implementation does not add a producer, snapshot store,
schema, revision source, atomic read, cache, scheduler, executor, inventory
reader, retention plan over real data, deletion, key operation, or deployment.
Current inspected source cannot produce a real input for this boundary.

Any future producer/store/schema/inventory work, planner invocation against real
data, or retention execution/deletion remains L3. It requires a separate
explicit manual gate, a new target-specific Route Lock, data/backup and
rollback treatment where relevant, and a verification plan. This report grants
none of those permissions.

## Real Integration Stop

No local follow-up is selected. The completed synthetic contract does not create
a real producer or authorize a store/schema/data integration. The recommended
next real-stage candidate is `PAC-MEMORY-RETENTION-PRODUCER-L3-PREFLIGHT`, but
it is **not scheduled** and must not be implemented from this report.

Before that distinct L3 preflight may begin, the owner must give fresh explicit
authorization that names the target data, allowed store/schema reads and writes,
backup/rollback treatment, time window, and stop owner. The preflight must carry
its own target-specific Route Lock and stop conditions. It does not itself
authorize a producer, planner invocation against real data, retention execution,
or deletion.
