# Personal AI Companion Memory Layer Current Status

Date: 2026-07-11

Status: `local MVP core verified`; branch-only synthetic ingest seam verified;
real/private-data integration not started

## Evidence Boundary

This report records the current local implementation and verification state. It
does not inspect or modify a real `memory.db`, private chats, profile material,
HealthKit data, credentials, key material, a running service, NAS, or a device.

- Current product checkout: `codex/initial-private-publish` at `121334c`
- Clean successor worktree: `codex/pac-mock-foundations` at `3019a8c`
- Synthetic ingest-seam worktree: `codex/pac-memory-ingest-seam` at `4a3a7df`,
  a clean direct successor of `3019a8c`
- Dirty product-polish worktree: `codex/pac-ios-product-polish` at `3019a8c`
- Focused current-checkout verification: `435 passed, 1 warning` in the
  project `.venv`; the warning is the known Starlette/httpx TestClient
  deprecation.
- Full current-checkout verification from the same review wave: `897 passed`.
- Full clean successor-worktree verification: `958 passed`.
- Successor-only Approved Persona Memory Summary focused verification:
  `17 passed`.
- Ingest-seam focused verification: `59 passed, 1 warning`.
- Ingest-seam full Python verification: `975 passed, 1 warning in 54.34s`.
- Ingest-seam `compileall` verification passed. The shared project `.venv` does
  not include `ruff`; system `/opt/anaconda3/bin/ruff` checked all touched
  Python files and reported `All checks passed!`.

The ingest-seam tests used explicit synthetic strings and `:memory:` SQLite.
They did not touch Swift, a file-backed database, a real `memory.db`, private
data, retention execution, or an external runtime. The warning in both new test
runs is the same known Starlette/httpx TestClient deprecation.

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

Product commit `4a3a7df` is a clean successor of `3019a8c` on
`codex/pac-memory-ingest-seam`. It adds a local, explicit
`POST /v1/memory/review-turn` path with these verified synthetic behaviors:

- deterministic Chinese/English preference normalization for a deliberately
  narrow rule set;
- explicit opt-out, credential-like, sensitive-identity, ambiguous, and
  overlong turn handling that creates no candidate, review, conversation, or
  session payload rows;
- strict health review through a fixed non-raw placeholder, `health_private`
  scope, active `health_read` consent, P1 owner review, and a
  `sensitive_fact` disclosure block for prompt and speaker paths;
- owner-only candidate creation, atomic candidate/review persistence, source
  event/session provenance, event replay idempotency, canonical duplicate
  handling, and deterministic P1 conflict flags;
- no recall before explicit owner-confirmed promotion, review-status closure on
  promote/reject, owner-private recall after promotion, and partner-viewer
  denial.

The endpoint is opt-in. Ordinary `/v1/chat` behavior is unchanged and does not
automatically extract or promote memory. Conflict detection creates a review
signal; it does not choose a winner or supersede an existing fact.

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
- The branch-only ingest seam has narrow deterministic normalization, exact
  canonical duplicate handling, and conflict flagging only when explicitly
  called. There is still no automatic extraction from ordinary chat, broad fact
  parser, semantic deduplication, or automatic conflict resolution.
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
| Explicit conversation-turn review seam | `branch-only, synthetic verified` |
| iOS history controls | `uncommitted, smoke verified` |
| Real/private-data long-term operation | `not started / not verified` |

For planning only, the local/core contract surface is roughly two-thirds built,
while readiness for durable daily use with real private data is materially
lower. This estimate is not an acceptance metric and must not replace the
layered statuses above.

## Recommended Next Order

1. Review and converge `3019a8c` plus the clean `4a3a7df` successor into the
   selected product branch, preserving their synthetic/mock boundary.
2. Review and commit the dirty iOS product-polish slice separately; do not mix
   it with backend memory acceptance.
3. Add a separate synthetic-only review state-machine slice that prevents
   invalid re-promotion/rejection transitions and requires an explicit owner
   decision for conflicting candidates; do not auto-supersede facts.
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
