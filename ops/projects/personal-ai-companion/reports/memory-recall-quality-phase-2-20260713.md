# PAC Memory Quality Phase 2

Date: 2026-07-13

Status: implemented and synthetic-verified; real-data/runtime-retention integration unconfirmed

## Scope And Evidence Boundary

- Product branch: `codex/pac-memory-quality-phase-2`
- Product baseline: `e15e553`
- Product implementation commit: `e764b2f`
- Product worktree:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/worktrees/pac-memory-quality-phase-2`

This task used only source, synthetic `MemoryAtom` values, and an in-memory or
temporary local test environment. It did not read, query, import, migrate, or
export a real `memory.db`, private chat, profile, HealthKit record, credential,
key, NAS/VPS state, cloud database, or live service. It did not invoke ordinary
`/v1/chat` memory extraction, retention/deletion execution, deployment, or any
external data transfer.

## Implemented

- `memory.recall_quality` supplies a pure local inspection contract. It accepts
  caller-supplied, already-authorized candidates and returns selected atom IDs,
  payload-free explanations, and stable metrics. It performs no Store, network,
  filesystem, promotion, delete, or retention action.
- The inspection contract deterministically ranks by query-token overlap,
  candidate precision, confidence, recency, and atom ID. It rejects unmatched
  candidates, expired caller-supplied metadata, canonical duplicates, and
  lower-ranked conflicting canonical preference facts without mutating either
  record.
- `MemoryService.recall()` retains its existing class-policy and
  `PrivacyKernel` disclosure checks before converting an allowed memory into a
  recall-quality candidate. The API-visible `RecallResult` shape did not
  change. Existing audit behavior is unchanged.
- `MemoryStore.search_memories()` reuses the same token/rank calculation, so
  recall and owner-admin search share deterministic lexical ordering.

The existing owner-admin search/review/explain surfaces remain the only admin
interfaces. No new route or public inspection endpoint was added.

## Synthetic Verification

`tests/test_memory_recall_quality.py` asserts a deterministic five-candidate
evaluation with one selected relevant match and stable exclusion metrics:

| Category | Verified synthetic result |
| --- | --- |
| Relevant hit | Selected |
| Irrelevant candidate | `query_no_overlap` |
| Duplicate | `duplicate_of:<atom_id>` |
| Canonical preference conflict | `conflict_superseded_by:<atom_id>` |
| Caller-supplied expired metadata | `expired` |
| Scope isolation | Unknown identity receives only `group_safe_shared` candidate |
| Sensitive / forbidden projection | `sensitive_fact`, `never_quote`, and private scope candidates are not returned |

Verification in the isolated worktree:

- focused new/service/turn-review tests: `54 passed, 1 warning`;
- all `tests/test_memory_*.py`: `446 passed, 1 warning`;
- full Python suite: `1044 passed, 1 warning`;
- changed-scope Ruff and `compileall`: passed;
- `git diff --check`: passed.

The warning is the pre-existing FastAPI TestClient Starlette/httpx deprecation.

## Unconfirmed And Excluded

- Current `MemoryAtom` and its store schema do not expose an `expires_at_ms`
  producer. The expired synthetic case is a forward-compatible inspection
  contract only; it is not proof of runtime memory expiry, scheduling,
  retention, or deletion.
- This is lexical ranking plus bounded canonical preference conflict handling,
  not semantic/vector retrieval, broad fact extraction, or general automatic
  conflict resolution.
- No real owner consent, private-data handling, persisted vault projection,
  runtime authorization, or deployed behavior was inspected or validated.
- Ordinary `/v1/chat` remains outside this task and has not been enabled for
  automatic extraction or promotion.
