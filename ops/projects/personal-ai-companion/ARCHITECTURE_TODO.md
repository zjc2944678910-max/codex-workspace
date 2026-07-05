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
- Completed 2026-07-05: isolated `.venv` with FastAPI/uvicorn/httpx/pytest.
- Completed 2026-07-05: real local API smoke on `127.0.0.1:8767` for
  `/v1/chat`, consent grant, review queue, memory promote, and memory recall.
- Completed 2026-07-05: `review_items` and `consent_records` are first-class
  SQLite tables with service/API coverage.
- Next: decide whether to keep SQLite for the next iteration or introduce a
  migration layer before adding embeddings.
- Next: add explicit DB migration/versioning before the schema grows further.
- Next: add true model adapter boundaries for Gemini/Claude without putting
  provider secrets in the repo.

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
