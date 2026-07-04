# Personal AI Companion Architecture TODO

## Near Term

- Decide implementation stack for the local relay: FastAPI/Python or Node.
- Define the first `InteractionEnvelope` schema.
- Create initial DB migration for entities, devices, sessions, messages,
  session deltas, candidate atoms, memory atoms, review items, consent records,
  and usage logs.
- Build `/v1/chat` with model router stubs.
- Build `/v1/memory/ingest` and `/v1/memory/recall`.
- Add tests for identity binding, privacy scopes, StackChan speaker delivery,
  and memory deletion.

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
