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
- Completed 2026-07-05: local Mac Ollama adapter wired for private local-first
  chat, defaulting to `huihui_ai/qwen3.5-abliterated:9b`; `qwen2.5vl:7b`
  reserved as the visual model.
- Completed 2026-07-05: architecture decision set to Mac for local model
  inference and NAS for memory/search/backup/always-on storage.
- Completed 2026-07-05: OpenAI-compatible cloud relay adapter added for
  Gemini/Claude routes, configured only by environment variables and no
  committed provider secrets.
- Completed 2026-07-05: verified Sub2API `/v1/models`; default companion cloud
  route changed to `claude-opus-4-6-thinking` because Claude/Opus relay smokes
  passed while Gemini 3.5 Flash variants returned upstream location errors.
- Completed 2026-07-05: owner authorized private cloud processing; local
  companion now routes `health_private`, `style_training`, and
  `memory_maintenance` to `claude-opus-4-6-thinking` when
  `PRIVATE_CLOUD_ALLOWED=1`.
- Completed 2026-07-05: merged QQ/WeChat chat log imported locally from the
  combined source only; role-fixed output generated under ignored project data
  at `projects/products/personal-ai-companion/data/processed/full_merged_namefixed_20260705223515`
  with 28,242 messages, 17,340 style samples, 2,162 memory candidates, and 500
  capped ShareGPT preview sessions. No external model calls. Explicit source
  speaker mapping is `[QQ] 小老婆` + `[微信] a小煊咪` as partner and `[QQ] 我`
  as owner.
- Completed 2026-07-05: chat-log import now treats QQ file-capacity/SVIP
  notices as system messages for role inference and derivative outputs.
  `speaker:c67b5227a2` is confirmed as a service/system sender, not owner:
  8 total messages, 0 role-eligible messages, and no style/memory/ShareGPT
  derivative hits.
- Completed 2026-07-05: built the first local girlfriend-style profile/skill
  bundle from `full_merged_namefixed_20260705223515` under
  `style_profile/`. The profile uses 17,321 usable partner style samples,
  writes `girlfriend_style_profile.json`, `girlfriend_runtime_prompt.txt`,
  `girlfriend_style_skill.md`, and `style_eval_baseline.json`, and can be
  enabled at runtime with `STYLE_PROFILE_PATH` plus `scope=style_chat`,
  `girlfriend_style`, or `partner_style`.
- Completed 2026-07-05: added the first runtime style consistency loop. Style
  chat now generates a draft, scores it locally against the profile, and when
  below `STYLE_REWRITE_THRESHOLD` asks the same model for one style-only rewrite.
  The rewrite is accepted only when it improves the local score by at least
  `STYLE_REWRITE_MIN_DELTA`; otherwise the original draft is kept.
- Completed 2026-07-05: added a synthetic offline style evaluation suite under
  `style_profile/eval_suite/`. It covers daily chat, comfort, playful teasing,
  affection, care, mild conflict, practical help, and phone-access boundary
  scenarios, with `style_eval_suite.json`, `style_eval_outputs_template.json`,
  and report generation via `scripts/build_style_eval_suite.py`.
- Next: decide whether to keep SQLite for the next iteration or introduce a
  migration layer before adding embeddings.
- Next: add explicit DB migration/versioning before the schema grows further.
- Next: configure the real relay base URL/API key locally and run a non-secret
  cloud model smoke test.

## Later

- Add STT/TTS and StackChan device registration.
- Add Memory Admin UI/API.
- Add iOS app permission flows for HealthKit/EventKit/AlarmKit/App Intents.
- Add NAS memory/vector persistence plan.
- Add chat-log import and consented style profile pipeline.

## Decisions To Revisit

- Database choice: Postgres + pgvector vs SQLite for the first local MVP.
- Embedding model and vector dimensions.
- Whether StackChan should stream audio directly or upload utterance chunks.
- Whether NAS should handle embeddings, summarization, or only storage/search.
- How explicit consent should be captured for style-profile training/import.
