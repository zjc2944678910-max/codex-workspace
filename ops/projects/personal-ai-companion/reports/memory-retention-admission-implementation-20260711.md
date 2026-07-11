# Memory Retention Admission Implementation Record

Date: 2026-07-11  
Status: `local/mock verified` synthetic-only L1 implementation  
Real integration status: `blocked pending a separately authorized L3 preflight`

## Route Lock

- target_project: `personal-ai-companion`
- target_surface: synthetic retention admission/composition evidence only
- project_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- route_evidence: master static acceptance and independent read-only review
  after the composition freshness repair.
- forbidden_surfaces: all real producers, stores/DBs, schemas, migrations,
  data/state, raw private material, credentials, network/services, devices,
  HealthKit, retention planning against real data, retention execution/deletion,
  deployment, Git, and GitHub.

## Confirmed Synthetic Implementation

`retention_admission.py` and its isolated test suite implement a pure,
payload-free synthetic admission/composition contract. It validates only
caller-owned metadata constraints:

- supported snapshot schemas and capture authorities;
- an explicitly eligible planning lifecycle and admitted freshness bound;
- policy and timestamp coherence;
- exact `type(flag) is bool` validation for legal hold, owner hold, and the
  seven planner booleans; and
- the current one-way payload/resource coherence rule. It does not add a
  bidirectional requirement that a matching `INLINE` or `VAULT` resource flag
  must be true.

The module neither imports nor calls `plan_retention()`, a store, or a runtime
surface. It does not perform a producer read, persistence, network operation,
or retention action.

`TrustedRetentionSnapshot` retains non-sensitive `captured_at_ms` and its
admitted `max_freshness_ms`. Composition requires explicit `now_ms` and returns
empty metadata when the composition reference time is invalid, a captured time
is in the future, a snapshot is stale, the same identity has conflicting
revisions, or the same identity and revision have contradictory metadata.
Those checks intentionally do not assert global authority consistency or
cross-identity consistency.

## Verification

- `PYTHONPATH=src pytest -q tests/test_memory_retention_admission.py
  tests/test_memory_retention.py tests/test_memory_retention_inventory.py`:
  `195 passed`.
- `python -m compileall -q
  src/personal_ai_companion/memory/retention_admission.py`: passed.
- `ruff check` for the synthetic admission implementation and its isolated test:
  passed.
- Independent read-only review found no blocking defect in the synthetic
  contract.

These checks establish only local synthetic behavior. They do not prove a real
producer exists, a store/schema can supply authoritative data, or a planner or
retention executor has processed real data.

## Preserved Boundary

The raw planner's direct DTO behavior remains intentionally test-compatible.
The synthetic admission surface does not disable, wrap, or make that direct
path a production admission guarantee. No real producer, inventory, store,
schema, migration, data, backup, retention execution, or deletion work occurred.

## Manual L3 Gate

No next task is scheduled. The recommended distinct real-stage candidate is
`PAC-MEMORY-RETENTION-PRODUCER-L3-PREFLIGHT`, which remains a manual L3 gate.
It may be proposed only after fresh explicit owner authorization names the
target data, allowed store/schema reads and writes, backup/rollback treatment,
time window, and stop owner.

That preflight must receive its own Route Lock and explicit stop conditions. It
does not authorize production integration, planner invocation against real data,
retention execution, or deletion.
