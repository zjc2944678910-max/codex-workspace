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
  now includes 24 local interaction exemplars from ShareGPT preview, writes
  `girlfriend_style_profile.json`, `girlfriend_runtime_prompt.txt`,
  `girlfriend_style_skill.md`, and `style_eval_baseline.json`, and can be enabled
  at runtime with `STYLE_PROFILE_PATH` plus `scope=style_chat`,
  `girlfriend_style`, or `partner_style`.
- Completed 2026-07-05: added the first runtime style consistency loop. Style
  chat now generates a draft, scores it locally against the profile, and when
  below `STYLE_REWRITE_THRESHOLD` asks the same model for up to
  `STYLE_REWRITE_MAX_ATTEMPTS` style-only rewrites. A candidate is accepted only
  when it improves the local score by at least `STYLE_REWRITE_MIN_DELTA`;
  otherwise the current best draft is kept.
- Completed 2026-07-06: runtime style prompts now dynamically select a small
  set of local `user -> partner` interaction exemplars by current user message
  intent/overlap, and the same relevant examples are used for both the initial
  generation prompt and the style rewrite prompt. Exemplar text remains local
  prompt context only and is not returned in the API response.
- Completed 2026-07-06: expanded the local interaction exemplar bank from
  24 examples across 6 categories to 72 examples across 9 categories, adding
  conflict repair, practical help, and access-boundary response shapes. The
  default rewrite threshold is now `0.80` so borderline but technically passing
  style replies get one more chance to become shorter and more profile-like.
  Latest Opus `/v1/chat` full eval passed 8/8 with average style score `0.879`;
  boundary and practical-help scenarios both reached `0.887`.
- Completed 2026-07-05: added a synthetic offline style evaluation suite under
  `style_profile/eval_suite/`. It covers daily chat, comfort, playful teasing,
  affection, care, mild conflict, practical help, and phone-access boundary
  scenarios, with `style_eval_suite.json`, `style_eval_outputs_template.json`,
  and report generation via `scripts/build_style_eval_suite.py`.
- Completed 2026-07-05: added `scripts/run_style_eval_candidates.py` for direct
  mock/Ollama/cloud candidate generation and scoring. Updated interaction
  profile full eval with `claude-opus-4-6-thinking`: 8/8 synthetic scenarios
  passed, average style score 0.835. A follow-up boundary-specific prompt rule
  improved the phone-access boundary smoke from 0.705 to 0.828.
- Completed 2026-07-06: added `scripts/run_style_chat_api_eval.py` to exercise
  the real `/v1/chat` `scope=style_chat` path in batch. Mock API eval passed
  8/8 with average style score 0.871 and one rewrite applied; Opus daily API
  smoke passed with score 0.828 and no rewrite needed.
- Completed 2026-07-06: expanded the synthetic style regression suite from
  8 to 36 scenarios across 9 categories: daily, comfort, playful, affection,
  care, conflict, practical help, access-boundary, and questions. Added a
  `no_medical_diagnosis` guardrail for care scenarios and tightened rewrite
  prompting for short practical-help and comfort replies. The style rewrite loop
  can now use small intermediate improvements as the next rewrite draft while
  still only accepting a returned reply that clears `STYLE_REWRITE_MIN_DELTA`.
  Latest Opus `/v1/chat` full eval passed 36/36 at threshold `0.80`, average
  style score `0.892`, with 2 rewrites attempted and applied.
- Completed 2026-07-06: added explicit response-shape guidance for all
  9 interaction categories, so daily, comfort, care, playful, affection,
  question, conflict, help, and boundary prompts now each carry category-specific
  tone/length/safety hints in addition to selected local exemplars. The offline
  candidate evaluator now mirrors the runtime multi-attempt rewrite loop and
  records whether a rewrite candidate became only the next working draft or the
  final accepted reply. Regenerated the local profile/skill bundle and eval
  suite with zero external model calls. Current Opus `/v1/chat` full eval passed
  36/36 at threshold `0.80`, average style score `0.880`, with 2 rewrites
  attempted and applied.
- Completed 2026-07-06: added memory-context style regression coverage. Natural
  Chinese memory recall now tokenizes ASCII words plus CJK bigrams, so promoted
  Chinese memories can be recalled from unspaced Chinese user questions. The
  synthetic style suite now has 42 scenarios, including 6 approved-memory
  context turns seeded through the local memory API and promoted before the chat
  turn. Memory-context guardrails require the reply to naturally use a relevant
  synthetic approved-memory detail without turning into a report. Current Opus
  `/v1/chat` full eval passed 42/42 at threshold `0.80`, average style score
  `0.881`, with 5 rewrites attempted and applied.
- Completed 2026-07-06: added multi-turn continuity support for style chat.
  Successful assistant replies are now recorded as short same-session context
  messages, scoped to the current actor, and follow-up style prompts receive a
  bounded read-only recent-context block for emotional carryover only. The API
  style eval now isolates each scenario with its own session key and supports
  synthetic `setup_turns`; the suite now has 45 scenarios, including 3 multi-turn
  continuity checks. Current Opus `/v1/chat` full eval passed 45/45 at threshold
  `0.80`, average style score `0.888`, with 4 rewrites attempted and applied.
- Completed 2026-07-06: added local retention and pruning for transient
  same-session conversation context. `/v1/chat` now uses server time to prune
  `conversation_messages` before prompt construction, defaults to a 24-hour
  window via `CONVERSATION_CONTEXT_RETENTION_HOURS`, supports per-request
  `conversation_context_retention_hours`, and treats `0` as fully disabling
  recent-context prompting. Pruning is limited to transient conversation rows and
  does not delete promoted `memory_atoms`. Verification: focused retention/API
  tests passed 64/64, full suite passed 98/98, mock `/v1/chat` style eval passed
  45/45, and Opus continuity smoke passed 3/3 with average style score `0.897`.
- Completed 2026-07-06: added deterministic anti-pattern scoring for runtime
  style consistency. `score_text_against_profile` now reports base score,
  anti-pattern score, penalty, and matched categories for assistant identity
  framing, formal scaffolding, markdown/list formatting, template helper
  phrasing, formal directives, and fake access claims. Runtime style rewrites
  now receive those diagnostics, so compact but AI-like replies such as
  `我理解你` no longer pass only because they match the target length. Regenerated
  the local profile/skill bundle and synthetic eval suite with zero external
  model calls. Verification: focused style/API tests passed 69/69, full suite
  passed 101/101, mock `/v1/chat` style eval passed 45/45, and Opus 8-scenario
  anti-pattern smoke passed 8/8 with average style score `0.880`.
- Completed 2026-07-06: added dynamic one-turn style exemplar selection. Runtime
  prompts now map the current user message intent to relevant local style
  exemplar categories instead of always injecting the same global short snippets:
  comfort/care/conflict use comfort plus short reactions, playful uses playful
  plus questions, affection uses affection plus short reactions, and
  help/boundary/question use question plus short reactions. Regenerated the
  local profile/skill bundle and synthetic eval suite with zero external model
  calls. Verification: focused style/API tests passed 72/72, full suite passed
  104/104, mock `/v1/chat` style eval passed 45/45, and Opus 8-scenario dynamic
  style-exemplar smoke passed 8/8 with average style score `0.877`.
- Completed 2026-07-06: tightened intent disambiguation for style and
  interaction exemplar selection. Standalone `是不是` no longer marks a turn as
  conflict; playful cues such as `偷笑` / `你...笑我` route to playful exemplars,
  affection questions stay affection-shaped, true insecurity terms such as
  `不想理` / `不在乎` remain conflict-shaped, and `难过` now routes to comfort.
  Interaction exemplar selection now fills only from compatible categories
  instead of arbitrary text-overlap categories, reducing off-topic prompt
  leakage. Regenerated the local profile/skill bundle and synthetic eval suite
  with zero external model calls. Verification: focused style/API tests passed
  74/74, full suite passed 106/106, mock `/v1/chat` style eval passed 45/45, and
  Opus 6-scenario intent-disambiguation smoke passed 6/6 with average style
  score `0.907`.
- Completed 2026-07-06: added rhythm-aware scoring and profile-length-aligned
  style exemplar selection for the girlfriend-style profile. The local scorer
  now reports `rhythm_score`, `rhythm_penalty`, and diagnostics for sentence
  units, clause count, comma chains, newlines, list density, leading vocatives,
  and short boundary replies. Multi-clause chatty explanations such as
  `好呀，我陪你想想` now fall below the rewrite threshold, while compact
  boundary/practical replies and natural vocative commas remain valid. The
  exemplar bank now targets the profile's own p75 reply length instead of a
  fixed 12-character target; regenerated examples average about 7 chars and the
  positive exemplar baseline is `0.848`. Regenerated the local profile/skill
  bundle and synthetic eval suite with zero external model calls. Verification:
  focused style/API tests passed 80/80, full suite passed 112/112, mock
  `/v1/chat` style eval passed 45/45 with average style score `0.850`, and
  Opus 6-scenario rhythm/exemplar smoke passed 6/6 with average style score
  `0.882`.
- Completed 2026-07-06: added interaction response texture statistics and
  context-aware texture scoring. The profile now records per-category local
  response texture for categories with at least 3 interaction examples, including
  average/p75 reply length, single-beat rate, common reply moves, and common
  particles. Runtime prompts use those texture stats as behavior guidance, and
  `score_text_against_profile(..., user_text=...)` now reports conservative
  `context_texture_score`, `context_texture_penalty`, and diagnostics for the
  current user-message intent. The scoring path only penalizes directly detected
  intent categories and skips categories with insufficient local samples; in the
  current profile boundary has only 2 examples, so boundary texture remains prompt
  hint only instead of a hard scoring rule. Regenerated the local profile/skill
  bundle and synthetic eval suite with zero external model calls. Current
  interaction exemplar counts are 66 total: affection/care/comfort/conflict/
  daily/help/playful/question each have 8, boundary has 2. Verification: focused
  style/router/eval tests passed 69/69, full suite passed 121/121, mock
  `/v1/chat` style eval passed 45/45 with average style score `0.849`, and Opus
  6-scenario context-texture smoke passed 6/6 with average style score `0.896`.
- Completed 2026-07-06: added lexical texture profiling for opener and vocative
  patterns. The girlfriend-style profile now records abstract opener category
  distribution, leading/any-vocative rates, vocative category distribution, and
  generic greeting rate without newly mining raw low-frequency private phrases.
  Current local profile shows direct starts at `0.7343`, generic greeting starts
  at `0.0003`, leading vocatives at `0.0185`, and any-vocative turns at `0.0332`;
  runtime prompts now use this as soft guidance to avoid assistant-like
  `你好/您好` openings and avoid forcing pet names into every reply. Added a
  narrow `generic_greeting` anti-pattern while preserving natural phrases such as
  `你好可爱`. Regenerated the local profile/skill bundle and synthetic eval suite
  with zero external model calls. Verification: focused style/router/eval tests
  passed 71/71, full suite passed 123/123, mock `/v1/chat` style eval passed
  45/45 with average style score `0.849`, and Opus 6-scenario lexical-texture
  smoke passed 6/6 with average style score `0.896`; none of the 6 Opus smoke
  replies started with a vocative or generic greeting.
- Completed 2026-07-06: raised the ShareGPT preview import cap from 500 to 1000
  sessions and added `sharegpt_preview_limit` to the import report. The current
  local import now keeps 665 preview rows. Audited the extra boundary candidates
  and tightened boundary exemplar extraction to require an actual reply-side
  boundary refusal, which removed noisy false positives such as reassurance
  replies to access requests. Current interaction exemplar counts are 64 total:
  affection/care/comfort/conflict/daily/help/playful/question each have 8, and
  boundary has 0 verified local examples. Boundary therefore stays as
  prompt-level safety/short-refusal guidance, not mined texture scoring. Profile
  regeneration made zero external model calls. Verification: focused import/style
  tests passed 45/45, full suite passed 124/124, mock `/v1/chat` style eval
  passed 45/45 with average style score `0.849`, and Opus 6-scenario strict
  boundary smoke passed 6/6 with average style score `0.896`.
- Next: decide whether to keep SQLite for the next iteration or introduce a
  migration layer before adding embeddings.
- Next: add explicit DB migration/versioning before the schema grows further.
- Next: add at-rest encryption/key-management decisions for stored conversation
  context before widening always-on use.

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
