# Personal AI Companion Memory Layer Current Status

Date: 2026-07-11

Status: `local MVP core verified`; real/private-data integration not started

## Evidence Boundary

This report records the current local implementation and verification state. It
does not inspect or modify a real `memory.db`, private chats, profile material,
HealthKit data, credentials, key material, a running service, NAS, or a device.

- Current product checkout: `codex/initial-private-publish` at `121334c`
- Clean successor worktree: `codex/pac-mock-foundations` at `3019a8c`
- Dirty product-polish worktree: `codex/pac-ios-product-polish` at `3019a8c`
- Focused current-checkout verification: `435 passed, 1 warning` in the
  project `.venv`; the warning is the known Starlette/httpx TestClient
  deprecation.
- Full current-checkout verification from the same review wave: `897 passed`.
- Full clean successor-worktree verification: `958 passed`.
- Successor-only Approved Persona Memory Summary focused verification:
  `17 passed`.

The first focused API collection attempt used an unsuitable system Python that
did not have FastAPI. The project `.venv` rerun passed; this was an environment
selection error, not a product test failure.

## Confirmed In The Current Product Checkout

The memory layer is beyond a design-only prototype. The local MVP core has a
tested path from conversation handling into memory and back into a guarded
prompt:

1. Chat normalizes the interaction envelope and records bounded recent
   conversation context.
2. `MemoryService` can create reviewable candidates and persist session deltas.
3. Owner-confirmed review actions promote, reject, or soft-delete atoms.
4. Recall searches promoted atoms only, applies scope and consent rules, and
   passes disclosures through `PrivacyKernel`.
5. `ModelRouter` projects only permitted memory into the prompt.

The current checkout also contains and tests:

- SQLite v1/v2 schemas and protected-store checks that refuse unsafe automatic
  migration of a protected database;
- short-term conversation retention and pruning;
- owner-gated search, review, explain, class-policy, consent, metadata-only
  summary, and rate-limit surfaces;
- prompt and speaker disclosure controls for sensitive, vault-associated, and
  `never_quote` material;
- isolated encrypted-vault, key-session, keyring, encrypted-record, and key
  rotation-planning primitives;
- pure, payload-free retention planning, inventory projection, snapshot
  admission, and snapshot composition contracts.

These are local source and synthetic/temp-database results. They do not prove a
deployed or privately populated memory service.

## Branch-Only And Uncommitted Work

Commit `3019a8c` is a direct successor of `121334c`, but it is not in the
current product checkout. Its memory-related addition is the synthetic-only
Approved Persona Memory Summary policy. The same commit also adds strict
App-to-Bridge DTO and offline mock-dispatch contracts. These may be described
as branch-only and locally verified, not as current-checkout or live-integration
capability.

The dirty `pac-ios-product-polish` worktree adds local JSON chat-history
persistence, restore, delete, and export UI behavior. It builds and its AppFlow
smoke passes, but it is uncommitted and excluded from current product status.

## Material Gaps

The following prevent the current implementation from being called a complete,
real-use long-term memory system:

- `MemoryAtom` and the current store schema still persist atom content inline;
  vault crypto is not wired into `MemoryStore`, `MemoryService`, or a persistent
  vault schema.
- Retrieval uses token overlap and recency. There is no embedding generation,
  vector store, or semantic ranking path.
- There is no automatic fact extraction, normalization, deduplication, or
  conflict-resolution pipeline for ordinary conversation turns.
- Delete is a soft-delete operation. There is no grace-period hard-delete,
  secure-delete, or retention executor.
- Retention has synthetic metadata admission and dry-run planning, but no
  authoritative real-store producer, scheduler, or executor.
- Runtime identity authentication, owner provisioning, and a real memory admin
  UI are not complete.
- No real/private database, private chat corpus, cloud authorization, NAS
  persistence, HealthKit path, or device disclosure path was verified.

## Completion Judgment

Use layered status instead of one percentage:

| Layer | Current judgment |
| --- | --- |
| Local memory contracts and core chat loop | `verified MVP` |
| Privacy, consent, review, and owner controls | `locally verified` |
| Vault and retention safety primitives | `locally verified, not store-wired` |
| Persona summary and App bridge memory contract | `branch-only, synthetic verified` |
| iOS history controls | `uncommitted, smoke verified` |
| Real/private-data long-term operation | `not started / not verified` |

For planning only, the local/core contract surface is roughly two-thirds built,
while readiness for durable daily use with real private data is materially
lower. This estimate is not an acceptance metric and must not replace the
layered statuses above.

## Recommended Next Order

1. Review and converge the clean `3019a8c` successor commit into the selected
   product branch, preserving its synthetic/mock boundary.
2. Review and commit the dirty iOS product-polish slice separately; do not mix
   it with backend memory acceptance.
3. Add a local, synthetic-safe conversation-to-candidate extraction and
   normalization seam with an end-to-end temp-database test. It should produce
   reviewable candidates, not silently promote memories.
4. Define the authoritative retention producer boundary and connect it only to
   dry-run planning with synthetic/temp-store evidence.
5. Prepare a separate L3 preflight before any real database, schema, key,
   private-data, retention-execution, hard-delete, cloud, or NAS change. No such
   work is authorized by this report.

## Drift Rule

Current entry documents should link to this report. Historical dated plans and
implementation records should retain their original scope and wording. Update
this report, the ops README, and the top current-state section of
`ARCHITECTURE_TODO.md` together whenever the selected product checkout, focused
test result, or integration boundary changes.
