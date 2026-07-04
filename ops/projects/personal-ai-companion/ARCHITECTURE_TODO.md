# Personal AI Companion Architecture TODO

## Near Term

- Completed 2026-07-04: initial FastAPI/Python + SQLite local skeleton under
  `projects/products/personal-ai-companion`.
- Completed 2026-07-04: first `InteractionEnvelope`, `IdentityKernel`,
  `PrivacyKernel`, `MemoryStore`, `MemoryService`, and mock `ModelRouter`.
- Completed 2026-07-04: local endpoints for `/v1/chat`, `/v1/admin/usage`,
  `/v1/memory/ingest`, `/v1/memory/recall`, `/v1/memory/search`,
  `/v1/memory/{id}/explain`, promote, reject, and delete.
- Completed 2026-07-04: unit tests for identity binding, privacy scopes,
  StackChan speaker delivery, owner-confirmed memory promotion/deletion, and
  mock model routing.
- Next: decide whether to keep SQLite for the next iteration or introduce a
  migration layer before adding embeddings.
- Next: add candidate review queue objects and consent records as first-class
  tables, not only policy gates.
- Next: add a tiny local dev server smoke test once dependencies are installed.

## Later

- Add STT/TTS and StackChan device registration.
- Add Memory Admin UI/API.
- Add iOS app permission flows for HealthKit/EventKit/AlarmKit/App Intents.
- Add NAS local model adapter.
- Add chat-log import and consented style profile pipeline.

## Decisions To Revisit

- Database choice: Postgres + pgvector vs SQLite for the first local MVP.
- Embedding model and vector dimensions.
- Whether StackChan should stream audio directly or upload utterance chunks.
- Whether NAS local model should handle embeddings, summarization, or both.
- How explicit consent should be captured for style-profile training/import.
