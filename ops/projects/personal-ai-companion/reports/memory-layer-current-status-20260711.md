# Personal AI Companion Memory Layer Current Status

Date: 2026-07-11

Status: `local MVP core verified`; current-checkout synthetic ingest seam
verified; real/private-data integration not started

Superseded current-state note (updated 2026-07-14): this report is retained as
the historical ingest-seam baseline. Product `main` is now canonical at
`b8462a9`; it includes Memory Quality Phase 2, Runtime Metadata Phase 3, and the
default-off Phase 4A/4B opt-in candidate writer. Use the project
[README](../README.md) for current facts and
[memory-phase-4-readiness-20260714.md](memory-phase-4-readiness-20260714.md) for
the remaining production boundary. No live memory deployment or real-database
migration followed from those source changes.

## Evidence Boundary

This report records the current local implementation and verification state. It
does not inspect or modify a real `memory.db`, private chats, profile material,
HealthKit data, credentials, key material, a running service, NAS, or a device.

- Current product checkout: `codex/initial-private-publish` at `934cec1`,
  locally fast-forwarded from `121334c`; not pushed
- Clean foundations worktree: `codex/pac-mock-foundations` at `3019a8c`
- Source ingest-seam worktree: `codex/pac-memory-ingest-seam` at the same
  `934cec1`, a clean successor of `32b9d96`, `4a3a7df`, and `3019a8c`
- Dirty product-polish worktree: `codex/pac-ios-product-polish` at `3019a8c`
- Pre-fast-forward `121334c` focused verification: `435 passed, 1 warning` in the
  project `.venv`; the warning is the known Starlette/httpx TestClient
  deprecation.
- Pre-fast-forward `121334c` full verification: `897 passed`.
- Full clean successor-worktree verification: `958 passed`.
- Successor-only Approved Persona Memory Summary focused verification:
  `17 passed`.
- Pre-repair ingest-seam verification at `4a3a7df`: `59 passed, 1 warning`
  focused and `975 passed, 1 warning` full.
- Repaired ingest-seam verification at `32b9d96`: seam file passed
  `21 passed, 1 warning in 0.81s`; related memory/privacy/API tests passed
  `444 passed, 1 warning in 7.79s`; the full Python suite passed
  `980 passed, 1 warning in 59.06s`.
- Compact-Chinese-copula repair verification at `934cec1`: seam file passed
  `24 passed, 1 warning in 0.74s`; related memory/privacy/API tests passed
  `447 passed, 1 warning in 7.49s`; the full Python suite passed
  `983 passed, 1 warning in 56.80s`.
- Post-fast-forward verification in the current product checkout:
  `983 passed, 1 warning in 57.72s`; Swift target `PersonalAICompanionApp` built
  successfully and `PersonalAICompanionAppFlowSmoke` passed.
- System `/opt/anaconda3/bin/ruff` checked every touched Python file and reported
  `All checks passed!`; `git diff --check` also passed before the product commit.

The ingest-seam tests used explicit synthetic strings plus `:memory:` and
temporary-directory SQLite. The post-fast-forward Swift checks compiled and ran
mock-only package code. No verification touched a persistent project database,
a real `memory.db`, private data, a real device, retention execution, or an
external runtime. The warning in the new test runs is the same known
Starlette/httpx TestClient deprecation.

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

## Current-Checkout Additions And Excluded Uncommitted Work

Commit `3019a8c` is a direct successor of the pre-fast-forward `121334c` and is
now included in the current product checkout. Its memory-related addition is the
synthetic-only Approved Persona Memory Summary policy. The same commit also adds
strict App-to-Bridge DTO and offline mock-dispatch contracts. These are locally
verified current-checkout contracts, not live-integration capability.

Product commit `4a3a7df` is a clean successor of `3019a8c` on
`codex/pac-memory-ingest-seam`. Product repair commit `32b9d96` is its clean
successor, and compact-Chinese-copula repair commit `934cec1` is now both the
source branch tip and the local `codex/initial-private-publish` checkout tip.
Together they add a local, explicit
`POST /v1/memory/review-turn` path with these verified synthetic behaviors:

- deterministic Chinese/English preference normalization for a deliberately
  narrow rule set;
- NFKC-normalized, compositional Chinese opt-out handling for the verified
  negative/courtesy/object/remember-save forms, while preserving the existing
  English opt-out behavior;
- targeted mixed Chinese/English `PIN`, token, password, and API-key value
  handling, including full-width forms and compact Chinese `是/为` assignments,
  while keeping English `is` word/space-delimited and without blocking the
  verified token/password discussion phrases;
- verified opt-out, credential-like, sensitive-identity, ambiguous, and
  overlong handling that creates no candidate, review, conversation, or session
  payload rows and does not return or audit the raw tested values;
- strict health review through a fixed non-raw placeholder, `health_private`
  scope, active `health_read` consent, P1 owner review, and a
  `sensitive_fact` disclosure block for prompt and speaker paths;
- owner-only candidate creation, atomic candidate/review persistence, source
  event/session provenance, event replay idempotency, canonical duplicate
  handling, and deterministic P1 conflict flags;
- no recall before explicit owner-confirmed promotion, owner-private recall
  after promotion, and partner-viewer denial;
- a minimal one-way review state machine: candidate can enter promoted or
  rejected once; repeat/reverse operations and operations after deleted return
  stable `ok=false` domain results instead of changing state or producing a 500;
  successful atom/review/audit updates share one SQLite transaction, delete
  aligns every linked review, and a forced audit failure rolls back atom and
  review together.

The endpoint is opt-in. Ordinary `/v1/chat` behavior is unchanged and does not
automatically extract or promote memory. Conflict detection creates a review
signal; it does not choose a winner or supersede an existing fact.

The privacy matcher is a bounded deterministic guard, not a claim of broad
natural-language credential or consent classification. Untested languages,
novel paraphrases, deliberate obfuscation, and Unicode confusables outside NFKC
remain unconfirmed. The compare-and-set status guard is implemented, but
multi-process contention was not stress-tested in this slice.

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
- The current-checkout ingest seam has narrow deterministic normalization, exact
  canonical duplicate handling, bounded opt-out/credential rules, and conflict
  flagging only when explicitly called. There is still no automatic extraction
  from ordinary chat, broad fact parser, exhaustive multilingual privacy
  classifier, semantic deduplication, or automatic conflict resolution.
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
| Persona summary and App bridge memory contract | `local current checkout, synthetic verified` |
| Explicit conversation-turn review seam and one-way review state | `local current checkout, synthetic verified` |
| iOS history controls | `uncommitted, smoke verified` |
| Real/private-data long-term operation | `not started / not verified` |

For planning only, the local/core contract surface is roughly two-thirds built,
while readiness for durable daily use with real private data is materially
lower. This estimate is not an acceptance metric and must not replace the
layered statuses above.

## Historical Recommended Next Order (Superseded)

1. Keep the local `934cec1` fast-forward and its synthetic/mock boundary intact;
   pushing or publishing the product branch remains a separate unperformed
   decision.
2. Review and commit the dirty iOS product-polish slice separately; do not mix
   it with backend memory acceptance.
3. Extend only the synthetic privacy corpus with additional paraphrase,
   confusable, property/fuzz, and multi-connection contention tests; keep every
   new matcher bounded and do not auto-supersede conflicting facts.
4. Define the authoritative retention producer boundary and connect it only to
   dry-run planning with synthetic/temp-store evidence.
5. Prepare a separate L3 preflight before any real database, schema, key,
   private-data, retention-execution, hard-delete, cloud, or NAS change. No such
   work is authorized by this report.

## Drift Rule

Current entry documents must not use this historical report as the current
memory source. They should link to
[memory-runtime-metadata-phase-3-20260713.md](memory-runtime-metadata-phase-3-20260713.md).
The body above retains its 2026-07-11 scope and wording as evidence; update the
ops README, Phase 3 report, and the top current-state section of
`ARCHITECTURE_TODO.md` together when the current integration boundary changes.
