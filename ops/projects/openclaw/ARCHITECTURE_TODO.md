# OpenClaw Architecture TODO

Last updated: 2026-05-02
Companion file: `DEPLOYMENT_LEDGER.md`

## Purpose

This file is the architecture and enhancement control board for production OpenClaw.

Use this file when the task is about:

- system design
- runtime architecture
- memory/session evolution
- observability and trace improvements
- maintainability upgrades
- hardening and recovery work
- prioritizing what to build next

Use `OPENCLAW_DEPLOYMENT_LEDGER.md` for deployment truth, live paths, service topology, backups, and operational facts.

No architecture-affecting change is complete until this file and/or `OPENCLAW_DEPLOYMENT_LEDGER.md` is updated in the same work session.

If a task changes runtime behavior, capability coverage, trace/session semantics, memory/write flow, recovery model, priorities, or known pitfalls, reflect that here before closing the task.

## Documentation Sync Contract

Treat this as mandatory:

- update this file after every meaningful architecture or capability change
- update `OPENCLAW_DEPLOYMENT_LEDGER.md` in the same session when the change also alters live runtime facts or operational workflow
- if you fixed a bug but also changed what is now true about the system, document the new truth here
- if docs were not updated, the change is not finished

## Current Truth Snapshot

- current benben gateway: `openclaw-benben.service`
  - state root: `/var/lib/openclaw-benben/.openclaw`
  - workspace root: `/var/lib/openclaw-benben/.openclaw/workspace`
  - live HTTP / websocket endpoint: `127.0.0.1:18792`
- retired old benben gateway: `openclaw-gateway.service`
  - inactive/retired as of 2026-05-02
  - no longer carries benben Feishu or Telegram production traffic
  - `/var/lib/openclaw/.openclaw` is rollback/historical state, not the current benben truth source
- current benben memory truth:
  - `OPENCLAW_MEMORY_V4_MODE=authoritative`
  - Memory V4 is the only live memory truth source for benben
  - current benben workspace top-level `memory_v*` contains only `memory_v4`
  - `memory_v2` and `memory_v3` were archived under `/var/lib/openclaw-benben/.openclaw/archives/memory-legacy-20260502T100201+0800/`
  - V2/V3 helper and direct-call paths now hard-stop or skip under V4 authoritative mode
  - historical V2/V3 notes below are retained as dated history unless explicitly marked current after 2026-05-02
- adminAI remains a separate service and state tree: `openclaw-adminai-gateway.service`, `/var/lib/openclaw-adminai/.openclaw`
- cloud main default on benben/adminAI: `anyone/gpt-5.4`
- explicit cloud routes:
  - bare `/codex` -> `openai-codex/gpt-5.4`
  - bare `/anyone` -> `anyone/gpt-5.4`
  - bare `/main`, `/new`, `/reset` -> `anyone/gpt-5.4`
- current explicit Anyone contract is bare `/anyone`
  - `/model anyone` is not the stable operator contract for this live setup
- `/status` current truth:
  - ordinary fresh cloud turns on benben/adminAI now run `anyone/gpt-5.4`
  - bare `/codex` still reports and runs `openai-codex/gpt-5.4`
  - fresh Anyone-default `/status` now reports `anyone/gpt-5.4` on benben/adminAI
- local-direct truth:
  - bare `/lite` / `/local` persist `routingModeOverride="local_direct"`
  - request-scoped local failures fail-soft to `anyone/gpt-5.4`
  - session-scoped local failures fail-closed

## Current Architecture Snapshot

### Live production surfaces

- runtime package: `/usr/lib/node_modules/openclaw/dist/*.js`
- current benben mutable config: `/var/lib/openclaw-benben/.openclaw/openclaw.json`
- current benben workspace logic: `/var/lib/openclaw-benben/.openclaw/workspace/tools/*.mjs`
- current benben Memory V4 state: `/var/lib/openclaw-benben/.openclaw/workspace/memory_v4/`
- current benben trace output: `/var/lib/openclaw-benben/.openclaw/workspace/memory-admin/trace/`
- adminAI mutable config: `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
- retired old gateway rollback/historical root: `/var/lib/openclaw/.openclaw`

### 2026-05-02 Memory V4 convergence and old-gateway retirement

- completed:
  - new benben runs independently from `/var/lib/openclaw-benben/.openclaw`
  - Memory V4 is authoritative and is the only live memory truth source
  - live benben workspace no longer has top-level `memory_v2` or `memory_v3`
  - legacy Memory V2/V3 directories were archived under `/var/lib/openclaw-benben/.openclaw/archives/memory-legacy-20260502T100201+0800/`
  - old `openclaw-gateway.service` is inactive/retired and is no longer a live benben dependency
  - vNext benben plugin paths depend on the benben workspace, not the old gateway workspace
- architecture truth after the convergence:
  - V2/V3 are rollback archaeology only for current benben
  - direct V2 helper calls must skip or hard-stop while `OPENCLAW_MEMORY_V4_MODE=authoritative`
  - memory governance, event, and standard maintenance writes land in Memory V4
  - local profile facts remain prompt context only; they are not an alternate memory truth source
  - adminAI remains isolated from this benben memory truth decision
- verification evidence recorded in `DEPLOYMENT_LEDGER.md`:
  - `openclaw-benben.service` active and health OK on `127.0.0.1:18792`
  - `node --check` passed for the patched live helper paths
  - direct V2 helper probes skipped without recreating V2/V3
  - governance write gate wrote `memory_v4/memory_v4.db`
  - memory event and standard oneshots did not recreate V2/V3
- rollback boundary:
  - restoring V2/V3 from archives is now a deliberate rollback operation, not a normal runtime path
  - old gateway state under `/var/lib/openclaw/.openclaw` should not be used to answer current benben memory questions

### 2026-04-22 Anyone default repair

- completed:
  - benben/adminAI default cloud lane remains `anyone/gpt-5.4`
  - `/codex` still hard-switches to `openai-codex/gpt-5.4`
  - workspace provider-registry + memory-review transport now understand `anyone`
  - benben session-review manual run now records `model=anyone/gpt-5.4`
  - owner long-term routing now treats `我想去香港读研吗` as an owner-profile query and widens owner planning reads to include `owner-current`
  - benben transcript update paths now refresh `session-journal` again, and fresh smoke writes `session_journal` events back into trace/latest metadata
- still open:
  - “香港读研”这类 owner planning 问题的 live answer 仍偏保守；路由已修正，但 stable/current 事实整合和回答力度仍需单独优化

### Memory stack shape

- Memory V4 is the canonical working memory, recall, governance, and maintenance surface for current benben
- the old V2/V3 filesystem trees are archived and absent from the current benben workspace top level
- stable/current/recent answer truth must resolve through Memory V4, not a parallel V2/V3 layer
- write gating exists and writes to Memory V4 under authoritative mode
- recall routing exists and must not silently fall back to V2/V3 for current benben

### Session / trace shape

- session journal exists
- replay payloads exist
- runtime-integrated session recovery now exists via `tools/session-recovery-helper.mjs` plus live session bundle hooks
- `memory_search` now emits `memory_recall`
- trace file is already useful for debugging recall and write flow
- `trace-inspect.mjs` now surfaces recall provenance fields from `memory_recall`, not just ids and refs

## Completed Work

### Already done in workspace logic

- session journal + replay
- replay recovery + safe store repair
- memory write contract metadata
- trace helper and trace event sink
- operator trace inspection tool
- maintenance checkpoint + idempotency
- adaptive recall injection
- unified owner-memory scoped retrieval for `agent:main:main`
- privacy manifest support plus disclosure filtering
- relationship section auto-discovery fallback for incomplete people-index metadata
- verified-cache preamble stripping plus fact-biased snippet selection
- visible/blocked recall-hit de-duplication

### Already done in runtime / gateway path

- richer run context plumbing
- `memory_search` recall trace emission
- session journal refresh now runs from live session lifecycle metadata updates
- missing session-store keys can now auto-recover from replay when transcript evidence still exists
- non-channel path trace correlation improvements
- `session_id` fix for non-channel `openclaw agent` recall traces
- active run-context fallback for missing `currentMessageId` / `traceId` in `memory_search`
- stronger `memory_search` contract wording for “remember / forgot / exams / plans / gifts / preferences” questions
- top-of-prompt `Memory Grounding Rule` in workspace `AGENTS.md`
- live end-to-end verification for:
  - `chat.send`
  - gateway RPC `agent`
  - cron manual run

### Strongest verified result so far

Latest verified recall trace includes:

- non-null `trace_id`
- non-null `session_id`
- non-null `source_event_id`
- non-null `message_id`
- non-null `session_entry_source`
- non-null `speaker_resolution_source`
- non-null `query_normalized_to`
- non-null `candidate_pool_counts`
- non-null `disclosure_decision`

That means the recall trace chain is now production-useful both for continuity and for scope/provenance debugging.

Additional verified point:

- deterministic runtime harness proved that a registered run context can be recovered by `memory_search` using `sessionKey` / `sessionId` fallback when explicit tool context is missing
- live entrypoint verification on `2026-04-01` also proved:
  - `chat.send` emitted `memory_recall` with non-null `trace_id`, `session_id`, and `source_event_id`
  - gateway RPC `agent` emitted `memory_recall` with non-null `trace_id`, `session_id`, and `source_event_id`
  - cron emitted `memory_recall` with non-null `trace_id`, `session_id`, and `source_event_id`
- `runMemoryWriteGate` now resolves inherited root trace context from `trace-latest.json` using `source_event_id` / `session_id` / related metadata
- manual smoke on `2026-04-01` proved one root trace can now contain both `memory_recall` and downstream `memory_write` for session `ef356e15-a909-4e5e-b0fe-f2439affe688`
- `session-recovery-helper.mjs` now proves two recovery behaviors:
  - a missing store key can be repaired from replay + transcript evidence without manual `sessions.json` editing
  - a conflicting live production key is not overwritten unless `--force` is explicitly used
- live gateway verification on `2026-04-01` now also proves:
  - owner direct `main` gift recall hits `memory/stable/relationships/guoyixuan/gifts.md`
  - owner direct `main` exam recall hits `memory/stable/self/life-planning.verified.md`
  - final answer correctness depends on snippet quality, not just route/scope correctness
- direct `trace-inspect` verification on `2026-04-02` now also proves:
  - exam smoke run `630d4a68-fe28-4572-8ce0-9885d1590350` exposes `session_entry_source = session_store` and `speaker_resolution_source = origin.from`
  - gift smoke run `d45819b5-948e-4c4f-b4e5-9f6de8098da0` exposes non-empty `query_normalized_to`, populated `candidate_pool_counts`, and `disclosure_decision = allow_all`

## Priority Queue

### Newly documented OAuth auth-store split for benben/adminAI

The 2026-04-16 Codex account switch exposed an operational coupling risk: benben and adminAI run as separate systemd services with separate service users and separate live auth stores. A successful OAuth switch for `openclaw-gateway.service` does not change `openclaw-adminai-gateway.service`.

- live auth stores are independent:
  - benben uses `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json`
  - adminAI uses `/var/lib/openclaw-adminai/.openclaw/agents/main/agent/auth-profiles.json`
- user-visible quota errors can be service-specific:
  - adminAI may still return an old `openai-codex` usage-limit error after benben has already been switched and verified
  - direct provider probes must use the same service user's auth file as the bot that produced the failure
- runbook improvement:
  - account-switch work should identify the target bot and service unit before editing auth
  - if both bots should share a Codex account, update both live stores intentionally and preserve each instance's non-Codex profiles
  - after writing auth, clear per-profile failure state and restart the affected unit so in-memory rate-limit cooldowns do not survive the switch

### Newly completed adminAI lifecycle and host-status repair

The 2026-04-16 adminAI screenshot proved a lifecycle-control gap, not a planned memory-boundary change. A bare `/new` must never rely on model generation; it must clear route state and return the synthetic lifecycle reply before any prompt can load workspace context.

- current lifecycle truth:
  - gateway RPC and Feishu reply/runtime paths both keep bare `/new` and `/reset` as lifecycle commands, not chat turns
  - reply-runtime `/new` / `/reset` now treats an already accepted `resetTriggered` state as sufficient for the fast lifecycle reply
  - this prevents a reset/new turn from falling into `buildBareSessionResetPrompt()` and producing model-authored startup text that can echo local-lite profile facts
- current host-status truth:
  - `/usr/local/bin/openclaw-host-status` is no longer a symlink into benben's private workspace
  - it is a root-owned dispatcher that selects the invoking service user's own workspace tool first
  - adminAI and benben can both run host-status without crossing each other's `/var/lib/openclaw*` private directory boundary
- validation locked:
  - adminAI `/new` smoke returns `durationMs=0`, `provider=openai-codex`, `model=gpt-5.4`
  - benben `/new` smoke returns the same cloud lifecycle result
  - adminAI real-agent host-status smoke returns a NAS summary instead of `command not found`
- remaining non-code capability issue:
  - QQBot still reports `/gateway` source IP not whitelisted in live journals
  - treat that as an external QQBot console/network whitelist repair, not as an OpenClaw sudo, memory, or runtime tool regression

### Newly completed QQBot operator/status/proxy alignment

The 2026-04-16 adminAI follow-up showed a separate channel-tooling drift: the gateway services had QQBot credentials and were trying to connect, but operator/status/health commands did not consistently inherit the same root-only env and service identity. That made adminAI look more broken than it was.

- current wrapper truth:
  - `/usr/local/bin/openclaw` loads the target service's gateway env plus service-specific QQBot env before status/tool/health calls
  - benben uses `/etc/openclaw/qqbot.env`
  - adminAI uses `/etc/openclaw/adminai-qqbot.env`
  - nested tool calls keep `OPENCLAW_SERVICE_HOME`, `OPENCLAW_SERVICE_TMPDIR`, `OPENCLAW_GATEWAY_ENV_FILE`, `OPENCLAW_BIN`, required-channel values, health env pointers, QQBot credentials, and QQBot canary targets
- current operator truth:
  - `openclaw status --json` and `openclaw-adminai status --json` now report `QQ Bot: configured`
  - `openclaw tool channel-delivery-canary --channel all --dry-run --json` and the adminAI equivalent are healthy across Telegram, Feishu, and `qqbot_c2c`
  - `qqbot-runtime-helper.mjs` now parses JSON after plugin registration noise and also reads JSON from `execFile` stdout when the child exits non-zero
  - healthcheck therefore reports the real state, `qqbot_probe_attention`, instead of wrapper/parser artifacts like `qqbot_probe_missing`
- current proxy truth:
  - QQ domains are no longer in gateway `NO_PROXY`
  - Feishu/Lark domains stay in `NO_PROXY`
  - QQBot production gateway traffic is intended to leave through the `127.0.0.1:18988` proxy path
  - live evidence on 2026-04-16: direct NAS egress was `182.119.180.190`, proxy egress was `45.56.183.242`
- remaining external blocker:
  - both live gateway services still obtain QQBot access tokens successfully and then fail production `/gateway` with `接口访问源IP不在白名单`
  - QQBot sandbox gateway probes succeed and receive READY, so credentials/tooling are valid
  - the remaining repair is to add `45.56.183.242` to the QQBot production source-IP whitelist for both apps, or explicitly use/whitelist direct `182.119.180.190` if the platform must bypass the proxy
  - until production `/gateway` connects, `openclaw-healthcheck.service` and `openclaw-adminai-healthcheck.service` should remain red with `qqbot_probe_attention`

### Newly completed QQ optionalization and bootstrap-size cleanup

After the operator clarified that QQ is not normally used, the architecture was simplified: QQBot is retained as prepared tooling but is no longer a required live channel. Feishu and Telegram are the active health-gated channels.

- current channel architecture:
  - benben and adminAI require Feishu and Telegram for health/config guard
  - QQBot is disabled in both live configs and must not start its production `/gateway` loop
  - QQBot env/drop-ins and helper tools may remain installed for future activation
  - reactivation must first resolve QQ platform source-IP whitelist and then intentionally re-add QQBot to config/required/health
- current health architecture:
  - `openclaw-healthcheck.service` and `openclaw-adminai-healthcheck.service` no longer run QQBot runtime-health as an extra required check
  - healthcheck success now reflects the channels the operator actually uses: Feishu and Telegram
  - QQ platform whitelist drift can no longer make the whole OpenClaw deployment look failed while Feishu/Telegram are healthy
- bootstrap cleanup:
  - `AGENTS.md` is now a compact current-truth bootstrap under the OpenClaw injected-context limit
  - long incident history remains in `OPENCLAW_DEPLOYMENT_LEDGER.md` and `OPENCLAW_ARCHITECTURE_TODO.md`
  - this avoids runtime warnings such as `workspace bootstrap file AGENTS.md is ... (limit 20000); truncating in injected context`
- metadata cleanup:
  - benben base systemd unit metadata now aligns with the installed package version `2026.4.9`

### Newly completed local-direct `/lite` semantic restoration

This section supersedes the earlier bare `/lite` `/model local` notes. The desired 2026-04-12/13 behavior is restored: cloud `main` remains the default, while explicit local mode is a separate minimal direct-chat route backed by Mac `ollama/huihui_ai/qwen3.5-abliterated:9b`.

- current lane split:
  - `main` complex lane now defaults to `anyone/gpt-5.4`
  - configured main-session fallbacks remain:
    - `deepseek/deepseek-chat`
    - `mimo/mimo-v2-flash`
    - `openrouter/xiaomi/mimo-v2-pro`
  - legacy official Codex remains available as an explicit cloud route: `openai-codex/gpt-5.4`
  - request-scoped local-lite remains plugin-driven via `/lite <message>`, `/local <message>`, `本地...`, and `日常...`
  - session-scoped local mode is now `routingModeOverride = "local_direct"` rather than a `providerOverride/modelOverride` on the `main` session
- route semantics:
  - bare `/lite` and bare `/local` enable `local_direct` and return a `durationMs=0` synthetic control reply
  - later ordinary messages in that session call Mac Qwen 9B with a raw single-turn payload: the user's text is forwarded as the only chat message, without an OpenClaw-added system prompt or summary
  - the local-direct path bypasses memory search, tools, planning, file/code affordances, session review, and the full `main` agent prompt
  - bare `/main`, bare `/codex`, bare `/anyone`, bare `/new`, and bare `/reset` clear `local_direct`
  - bare `/new` and `/reset` remain lifecycle commands and return to the cloud default `anyone/gpt-5.4`
  - bare `/main` returns to the cloud default `anyone/gpt-5.4`
  - bare `/codex` explicitly switches to `openai-codex/gpt-5.4`
  - bare `/anyone` explicitly switches to `anyone/gpt-5.4`
- failure semantics:
  - request-scoped local-lite remains fail-soft and may fall through to `anyone/gpt-5.4`
  - session-scoped `local_direct` is fail-closed: if the Mac tunnel/model/hot probe/content check fails, OpenClaw returns a visible “本地模型当前不可用” message and keeps the session in local mode
  - thinking-only or empty-content responses are never counted as local success
  - the reply-runtime hot probe budget is now `5000ms`; chat timeout is disabled (`0` = no OpenClaw-side abort), and timeout logs still name the failing endpoint when a timeout is configured
- tiny trusted-memory layer:
  - the local Mac path may add one tiny curated system note derived from `workspace/local-lite/profile.json`
  - this card is local-only and separate from the main memory tree
  - only fixed whitelisted fields are rendered from the JSON card, not arbitrary prose
  - the currently allowed examples are identity, relationship, nicknames, birthdays, school/major, and a single stable device/environment fact
  - code also caps what is actually rendered from that card, so accidental file growth does not automatically become local-model context
  - if the needed fact is not in that file, the model should answer `不知道` / `不确定` rather than guess
- runtime surfaces now carrying this design:
  - gateway control: `server.impl-BxLfE9ri.js`
  - dispatch/plugin event context: `dispatch-CFaSnCVe.js`
  - command/status display: `status-vq7yuJ1g.js`
  - gateway `agent` RPC local-direct short-circuit: `agent-command-8TL7BESJ.js`
  - plugin request-scoped local mode only: `local-lite-lane/index.js`
- Mac reverse-tunnel operation:
  - LaunchAgent `ai.openclaw.ollama-reverse-tunnel` now runs `/Users/zhangjincheng/.openclaw/bin/ollama-reverse-tunnel-loop.sh`
  - the wrapper reconnects the same `127.0.0.1:11436:127.0.0.1:11434` reverse forward every `3s` after SSH/proxy-chain disconnects
  - this is an operational hardening of the existing reverse tunnel, not an architecture change to the model route
- live verification:
  - adminAI and benben bare `/lite` both entered `local_direct`
  - ordinary follow-up “你是什么模型？” returned `ollama/huihui_ai/qwen3.5-abliterated:9b` through `provider=ollama`, `routingMode=local_direct` in about `3.6-4.1s`
  - `/main`, `/new`, and `/reset` cleared the marker and reported/stored `openai-codex/gpt-5.4`
  - `11436/api/ps` showed Qwen 9B hot at `context_length=32768`
  - `11435/healthz` included both `huihui_ai/qwen3.5-abliterated:9b` and `qwen2.5vl:7b`
  - relay chat to Qwen 9B with `think:false` returned non-empty `OK`
  - relay text smoke to `qwen2.5vl:7b` returned `OK`, so the image relay whitelist path did not regress
- payload parity follow-up:
  - request-scoped `local-lite-lane`, reply-runtime `local_direct`, and gateway agent RPC `local_direct` now all send top-level `think:false`, top-level `keep_alive=24h`, and `options.num_ctx=32768`
  - gateway agent RPC now treats `LOCAL_DIRECT_CHAT_TIMEOUT_MS=0` the same way as the reply runtime: no chat timer is armed, while an upstream abort signal is still honored
  - this is a transport/stability alignment only; it does not change memory boundaries, routing semantics, timeouts, or failover behavior
- remaining risk:
  - `2026-04-15 12:12 CST` follow-up showed NAS load had recovered to about `load1=0.55`, but swap remained historically high at about `6.5GiB` with no active `si/so`
  - the architecture risk is now mostly reverse-tunnel continuity and NAS load, not model-selection semantics

### Newly completed local-direct latency stabilization

Live `2026-04-15 19:17-19:25 CST` evidence showed a distinct failure mode after the semantic restoration: the route was correct and the model stayed hot, but ordinary local-direct turns could still degrade into `50-60s` local generations because the reply runtime had no explicit generation cap. The fail-closed policy then surfaced only as `request failed`, which looked like a broken tunnel even when the tunnel and `11436/api/ps` were healthy.

- observed evidence:
  - `11436/api/ps` remained healthy and kept reporting `huihui_ai/qwen3.5-abliterated:9b` hot at `context_length=32768`
  - benben journal logged `local_direct reply failed: This operation was aborted`
  - direct NAS `/api/chat` replay with the old payload showed:
    - `你可以干什么啊` about `59944ms`
    - `写一个长篇黄色小说` about `51654ms`
- completed repair:
  - hot probe budget was widened from `2500ms` to `5000ms`
  - timeout messages now distinguish `/api/ps` vs `/api/chat`
  - the short-lived short-answer shaping experiment was later explicitly removed by operator request
  - current live design favors fidelity over shaping:
    - local-direct sends only the raw user turn to Mac Qwen 9B
    - request-scoped `local-lite` now follows the same raw-pass-through payload shape
    - no OpenClaw-added system prompt, no summary injection, no temperature override, and no `num_predict` cap remain on the live local path
    - `think:false`, `num_ctx=32768`, and `keep_alive=24h` remain as transport/stability guardrails rather than content shaping
    - local chat timeout is disabled (`0`), so the remaining wait time is governed by Ollama/model generation itself rather than an OpenClaw abort
- effect:
  - local-direct now behaves much closer to “directly asking the Mac terminal model” than to a curated OpenClaw local persona
  - `2026-04-15 11:15 CST` follow-up disabled NAS-local `ollama.service` and removed keepwarm's `After/Wants=ollama.service`; local NAS `11434/api/ps` had no loaded models, so the current high load is not from an active e2b runner
  - the same load triage found about `194` long-running `soffice.bin` processes under Stirling PDF/LibreOffice; handle that as a separate process-leak/job-backlog incident if load remains high

### Historical OpenClaw audit remediation

- keepwarm is no longer tied to the retired NAS-local e2b naming or dead `11434` path:
  - active timer/service: `openclaw-qwen9b-keepwarm.timer` / `openclaw-qwen9b-keepwarm.service`
  - legacy `openclaw-ollama-e2b-keepwarm.timer` is disabled/inactive
  - `ollama-keepwarm.sh` now selects its endpoint after parsing `--base-url`, so the live unit actually warms `http://127.0.0.1:11436`
  - live journal shows repeated successful warm runs with `model=huihui_ai/qwen3.5-abliterated:9b`, `keep_alive=24h`
- relay architecture now matches NAS-local Ollama retirement:
  - `LOCAL_OLLAMA_BASE=` and `localEnabled=false`
  - remote whitelist remains exactly `qwen2.5vl:7b,huihui_ai/qwen3.5-abliterated:9b`
  - `/api/tags` and `/api/ps` publish only whitelisted remote models, not every model visible on the Mac
  - non-whitelisted Mac models return `404` through the relay
  - `local-lite` plugin still uses direct `11436` for hot-state truth; relay `11435` remains the provider/whitelist surface for OpenClaw provider calls and image routing
- gateway/systemd drift closed:
  - disabled `device-pair` plugin config was removed from both live configs, eliminating startup warning noise
  - benben required-channel guard now matches env truth: `feishu,telegram,qqbot`
  - adminAI base unit and drop-in both report `OPENCLAW_SERVICE_VERSION=2026.4.9`
  - benben `TasksMax` is now `2048` instead of `512`
- verification after remediation:
  - both OpenClaw gateway services active and health endpoints live
  - both configs validate as `valid=true`
  - channel status at the time of this 2026-04-15 remediation had Telegram running, QQBot running/connected, and Feishu running
  - superseded 2026-04-16 evidence shows QQBot production `/gateway` is now blocked by source-IP whitelist; see the 2026-04-16 QQBot operator/status/proxy alignment section above
  - benben/adminAI `/lite -> 只回复OK -> /main` smoke succeeds through Mac Qwen 9B in about `3.1s` / `2.7s`, then returns to `openai-codex/gpt-5.4`
  - both service users still have `sudo -n`; current broad `NOPASSWD:ALL` is an operational/security risk to revisit only with explicit approval

### Historical Feishu bare `/lite` reply-path alignment

- architectural drift that remained after the earlier local-direct rollout:
  - gateway RPC/control surfaces (`server.impl-BxLfE9ri.js`, `dispatch-CFaSnCVe.js`, `agent-command-8TL7BESJ.js`) already understood bare `/lite` / `/local` as `routingModeOverride="local_direct"`
  - but Feishu inbound DMs route through `monitor-CcQ_3z5A.js -> reply-BwK-bN2w.js`
  - that reply/runtime path only had bare lifecycle handling for `/new` and `/reset`
- practical consequence observed on `2026-04-15 12:25 CST`:
  - Feishu DM `/lite` logged `dispatching to agent (session=agent:main:main)` instead of returning a synthetic control reply
  - the message then behaved like a one-turn request-scoped local-lite prefix
  - the following ordinary turn remained on default cloud `openai-codex/gpt-5.4`
- architecture fix now applied:
  - `reply-BwK-bN2w.js` now parses bare `/lite`, `/local`, `/main`, and `/codex`
  - it persists/clears `routingModeOverride` in the reply/runtime session-init layer itself
  - it returns a synthetic control reply for bare route-mode changes instead of letting those commands fall through to ordinary chat
  - unauthorized bare route commands are filtered the same way as other control commands
- consequence:
  - Feishu/QQ/Telegram inbound paths and gateway RPC/CLI paths now share the same persistent local-direct semantics
  - bare `/lite` should no longer degrade into a one-turn local-lite persona reply on the reply/runtime path

### Historical Feishu `local_direct` ordinary-turn execution alignment

- a second-order drift remained after the `13:19 CST` control-plane fix:
  - bare `/lite` on Feishu had started returning the correct synthetic local-direct control reply
  - the main session store now did persist `routingModeOverride="local_direct"`
  - but the following ordinary Feishu turn still went through the default cloud `main` reply path
- root cause:
  - `reply-BwK-bN2w.js` had route-marker persistence, but it still lacked an ordinary-turn execution branch keyed on `routingModeOverride="local_direct"`
  - the architecture therefore had a split-brain:
    - control-plane semantics were already local-direct
    - content-generation semantics for Feishu ordinary turns were still cloud-main
  - `agent-command-8TL7BESJ.js` also carried an over-strict local-direct hot probe that required `context_length >= 32768`, even though live `11436/api/ps` can omit that field
- architecture fix now applied:
  - `reply-BwK-bN2w.js` now short-circuits ordinary non-slash turns when the persisted session marker is `local_direct`
  - that reply-path branch directly calls NAS `127.0.0.1:11436/api/chat` with:
    - `think:false`
    - `keep_alive=24h`
    - `num_ctx=32768`
    - a system prompt that explicitly self-identifies as `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - `agent-command-8TL7BESJ.js` now matches the hot model by name / alias instead of requiring a `context_length` field
- resulting architecture truth:
  - bare `/lite` / `/local` now have both control-plane and ordinary-turn execution-plane parity on Feishu inbound traffic
  - later ordinary turns in a `local_direct` Feishu session now stay on the minimal local payload instead of re-entering the full cloud `main` lane
  - the only remaining proof point is a fresh real Feishu DM after the patch, not a new code-path decision

### Historical Feishu `local_direct` body-source correction

- the `16:36 CST` screenshot proved the previous fix was still incomplete:
  - the `local_direct` marker was already persisted in the main session store
  - but the next ordinary Feishu turn still answered from cloud `main`
- root cause:
  - the reply-path ordinary-turn branch read the local variable `bodyStripped`
  - in `initSessionState()`, ordinary non-reset turns leave that local variable undefined and only materialize the cleaned prompt body in `sessionCtx.BodyStripped`
  - the architecture bug was therefore not timeout, not model fallback, and not missing persistence; it was a wrong in-memory source for the ordinary-turn body
- architecture fix:
  - the reply-path local-direct branch now reads:
    - `sessionCtx.BodyStripped ?? sessionCtx.BodyForAgent ?? sessionCtx.Body`
  - this makes persisted `local_direct` sessions actually consume the same normalized user text that the rest of the reply runtime sees
- resulting truth:
  - persisted `local_direct` on Feishu now has:
    - control-plane parity
    - session-persistence parity
    - ordinary-turn body extraction parity
  - if a later failure still appears, it should now be a real local-direct transport/model issue, not another local variable / control-plane mismatch

### Historical Feishu bare lifecycle export compatibility repair

- a separate lifecycle regression appeared after the reply-path bundle edits:
  - bare `/new` on Feishu at `16:46 CST` produced no visible reply
  - live journal showed a synchronous runtime error, not timeout:
    - `TypeError: resolveBoundAcpThreadSessionKey is not a function`
- root cause:
  - the current minified `targets-B7m5QZs_.js` bundle exports `resolveBoundAcpThreadSessionKey` as the short symbol `n`
  - reply runtime had regressed to assuming the long export name always existed
  - architecture effect: bare lifecycle control commands could crash before their synthetic reply was emitted, even though the surrounding reset/new logic was otherwise correct
- architecture fix:
  - reply runtime now resolves:
    - `targetsModule.resolveBoundAcpThreadSessionKey ?? targetsModule.n`
  - it only calls the helper when the resolved value is actually a function
  - this restores compatibility with the currently minified bundle surface and prevents lifecycle commands from disappearing silently

### Historical cloud-main + Mac Qwen 9B local-lite architecture pivot

This section is retained as the 2026-04-14 pivot history. The 2026-04-15 `local_direct` section above supersedes its bare `/lite` `/model local` semantics.

- the default architecture is now intentionally split into two lanes instead of forcing one model to carry every responsibility:
  - `main` complex lane:
    - `agents.defaults.model.primary = openai-codex/gpt-5.4`
    - `agents.defaults.model.fallbacks = []`
    - owns memory, tools, planning, code, file work, long context, and session lifecycle defaults
  - `local-lite` daily-chat lane:
    - plugin `local-lite-lane`
    - config list entry `local_lite`
    - target model `ollama/huihui_ai/qwen3.5-abliterated:9b`
    - legacy model alias `local` should resolve to the same Qwen 9B target, not to retired NAS `e2b`
    - plugin base URL `http://127.0.0.1:11436`
    - default serving context `32768`
    - no full tool schema
    - no memory-search payload
    - no session review / slug / heavy main-agent prompt surface
- route semantics are now split between request-scoped and session-scoped local chat:
  - bare `/lite` and bare `/local` enable `routingModeOverride="local_direct"`; they are not `/model local` aliases and do not write `providerOverride/modelOverride`
  - `/local <message>` / `/lite <message>` / `本地...` / `日常...` try the lightweight local lane for that turn
  - ordinary non-prefixed turns in a persisted `local_direct` session bypass `local-lite-lane` and go straight to the raw local-direct runtime path, so the session-local mode has a single fail-closed executor
  - `/main` / `/codex` force the cloud lane
  - bare `/new` and `/reset` return to cloud `anyone/gpt-5.4`, not to local-lite
  - bare everyday chat also stays on cloud `main`; the Mac local model is not the default session route
- warm architecture is now evidence-based:
  - observed live hot direct chat on `2026-04-14`: about `1.5-1.7s` for a trivial `POST /api/chat` through NAS `127.0.0.1:11436`
  - architecture consequence:
    - Qwen 9B on the Mac is acceptable as a pre-warmed lightweight lane
    - the model is still not the default all-purpose session model
- keepwarm architecture was tightened around those facts:
  - timer stays every `2 min`
  - keep-alive target stays `24h`
  - active timer/service is now `openclaw-qwen9b-keepwarm.timer` / `openclaw-qwen9b-keepwarm.service`
  - the legacy `openclaw-ollama-e2b-keepwarm.timer` name is disabled/inactive to avoid future e2b/Qwen operator confusion
  - tracked keepwarm unit now allows a `240s` warm window and `300s` service timeout
  - live keepwarm requests now send `think:false` and `num_ctx=32768`
  - tracked warm resource gates now use `load1 <= 12` plus a softer high-swap rule:
    - `swap_used_percent <= 75` is still the first screen
    - but warm is still allowed when `MemAvailable >= 6291456 KiB` and `SwapFree >= 2097152 KiB`
  - plugin-side resource gates now block only cold warm attempts; they no longer block already-hot local replies
  - plugin warm retry spacing was widened to `240000ms` so repeated user turns do not start overlapping long cold warms
- provider/relay architecture is now explicitly split:
  - relay `11435` remains the OpenClaw provider and whitelist surface
  - `local-lite` plugin itself probes/chats against `11436` because relay `/api/ps` is not reliable for remote hot-state truth
  - relay whitelist now includes both `qwen2.5vl:7b` and `huihui_ai/qwen3.5-abliterated:9b`
  - after NAS-local Ollama retirement, relay local upstream is disabled (`LOCAL_OLLAMA_BASE=`, `localEnabled=false`); `/api/tags` and `/api/ps` are filtered to the remote whitelist
- response-shape guardrail is now explicit:
  - local-lite chat and warm payloads must send top-level `think:false`
  - thinking-only or empty-content replies are local failures and must fall through to `anyone/gpt-5.4`
- context policy is now explicit:
  - `32768` is the default live local-lite context because it is already validated and fits the short-payload lane
  - `65536` is preserved only as a manual heavy-history experiment and is not the default serving value
- remaining architectural risk is narrow and explicit:
  - if Qwen 9B falls cold or is evicted, local-lite still depends on keepwarm and cloud fallthrough correctness
  - if `ollama /api/ps` lies during a partial load window, local-lite can still misclassify a half-ready model
  - current generic CLI smoke only proved cloud fallthrough, not a supported-channel `/local` hit; that end-to-end proof remains an operator follow-up item
  - the Mac reverse tunnel is still a live dependency: when LaunchAgent `ai.openclaw.ollama-reverse-tunnel` dropped with exit `255`, gateway logs showed `hot probe failed; falling through to cloud (TypeError: fetch failed)` before resource-gate fallthrough
  - Feishu slash lifecycle commands can arrive with wrapped inbound context; runtime lifecycle detection therefore has to normalize wrapped `/new` / `/reset` bodies before deciding whether to reset or to fall through
  - that normalization has to exist in both layers:
    - reply/runtime lifecycle handling
    - gateway `server.impl-*` agent RPC pre-dispatch handling
  - patching only the reply/runtime layer is insufficient; `2026-04-14 23:31 CST` wrapped-body smoke (`cc和xx的openclaw\n/new`) still launched a real `gpt-5.4` run until `server.impl-BxLfE9ri.js` was hot-fixed to use the same lifecycle extraction logic
  - current live probe sensitivity was narrowed on `2026-04-14 19:20 CST`:
    - observed on `2026-04-14 19:14 CST`, NAS `127.0.0.1:11436/api/ps` took about `1119ms` while the old plugin `hotProbeTimeoutMs` was `600ms`
    - live configs were updated to `hotProbeTimeoutMs=2500`; the cold-path guard `maxLoad1=12` stayed unchanged
    - follow-up harness verification with the real live config returned local `/local 只回复OK` on both live instances with zero agent events, even while NAS load average stayed around `68`
    - observed timings were about `3.55s` on benben and `2.70s` on adminAI
    - architecture consequence: hot local replies now have enough probe headroom under current NAS load, while cold local warm/serve remains intentionally conservative
    - remaining sensitivity is therefore mostly tunnel health or much slower future `/api/ps` behavior, not the current route wiring
  - a separate `2026-04-14 23:12 CST` benben session exposed a narrower gap for persistent bare `/lite` session overrides:
    - transcript evidence showed `Model switched to local (ollama/huihui_ai/qwen3.5-abliterated:9b)` followed by `502 {"error":"relay upstream unavailable: <urlopen error [Errno 111] Connection refused>"}`
    - architecture consequence: request-scoped `local-lite` fallthrough was already correct, but persistent bare `/lite` session overrides also needed an explicit `main`-agent fallback override to `openai-codex/gpt-5.4`
  - `2026-04-15 08:43-08:49 CST` closed another command-plane gap for persistent bare `/lite`:
    - live evidence showed Feishu bare `/lite` and wrapped `<prefix>\n/lite` were still reaching ordinary `agent:main:main` chat generation because gateway `server.impl-BxLfE9ri.js` only had synthetic pre-dispatch handling for `/new` and `/reset`
    - historical hotfix first added a gateway bare-`/lite` extractor that persisted a session model override and returned a `durationMs=0` synthetic control reply
    - post-hotfix benben/adminAI harness checks confirmed both exact bare `/lite` and wrapped `...\n/lite` now hit the control plane instead of the content-generation plane
  - semantic consequence that now needs to stay explicit in operator docs:
    - that 2026-04-15 08:43 CST hotfix is now superseded; bare `/lite` / `/local` currently enable `routingModeOverride="local_direct"` instead of a `main`-session model override
    - request-scoped `/lite <message>` and `/local <message>` still use the minimal local-lite payload path
    - later ordinary follow-up turns after bare `/lite` now use the minimal direct local payload, so they stay close to the request-scoped local-lite path instead of launching the full `main` agent prompt
  - `2026-04-15 08:05 CST` live triage found the Mac reverse-tunnel LaunchAgent loaded but `not running`; `launchctl bootout/bootstrap/kickstart` restored NAS `127.0.0.1:11436`
  - `2026-04-15 08:11-08:13 CST` controlled-failure verification confirmed the hardened design:
    - after deliberately stopping the reverse tunnel until `127.0.0.1:11436` returned `connection refused`, benben/adminAI ordinary turns in already-local-switched `main` sessions still returned `OK` through `openai-codex/gpt-5.4`
    - bare `/new` on both instances then reset back to the default cloud `main` lane
  - therefore the local-lite lane must be treated as best-effort and cloud fallthrough must remain correct
- image architecture remains unchanged by this pivot:
  - primary `ollama/qwen2.5vl:7b`
  - transport `Mac 11434 -> NAS 11436 -> relay 11435`
  - fallback `openrouter/xiaomi/mimo-v2-omni`

### Historical NAS-local Gemma e2b fast-fail and Mac image relay recovery

- main-chat architecture on both live instances now resolves through the same NAS-local default path:
  - `agents.defaults.model.primary = ollama/huihui_ai/gemma-4-abliterated:e2b`
  - NAS-local Ollama model `huihui_ai/gemma-4-abliterated:e2b`
  - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:e2b"].alias = "local"`
  - provider `contextWindow = 2048`
  - `agents.defaults.timeoutSeconds = 20`
  - `agents.defaults.llm.idleTimeoutSeconds = 20`
- default automatic text fallback order is intentionally single-step:
  - `openai-codex/gpt-5.4-mini`
- default image routing remains desktop-local first:
  - primary `ollama/qwen2.5vl:7b`
  - fallback `openrouter/xiaomi/mimo-v2-omni`
  - transport `Mac 127.0.0.1:11434 -> NAS 127.0.0.1:11436 -> relay 127.0.0.1:11435`
  - relay remote whitelist is narrowed to `qwen2.5vl:7b`
- slash/session truth after the follow-up:
  - runtime alias surface now matches the operator shortcut names directly:
    - `/codex`, `/mini`, `/flash`, `/hunter`, `/healer`, `/claude`, `/deepseek`, `/gpt4omini`, `/local`
  - `/local` is now the canonical main-session switch for the NAS-local e2b lane
  - `/qw` and `/gemma` are retired from the current live default relay surface
  - bare `/new` and `/reset` now resolve through the same default-model path and return to NAS-local e2b
  - `agents.defaults.timeoutSeconds=20` and `agents.defaults.llm.idleTimeoutSeconds=20` are the retained fast-fail guardrails for the NAS-local default path
  - live NAS evidence showed the previous 64K e2b context still loaded Ollama runner with `CONTEXT 65536` for multiple minutes; the current default path is capped at 2048 to avoid re-entering that path
  - follow-up smoke showed OpenClaw then blocks the 2048 e2b route before generation because the runtime requires at least 16000 context tokens; normal text replies currently succeed through the single Codex-mini fallback, not through NAS-local e2b generation
- validated live config truth now covers both instances:
  - benben/adminAI both show `primary = ollama/huihui_ai/gemma-4-abliterated:e2b`
  - benben/adminAI both map `local` to `ollama/huihui_ai/gemma-4-abliterated:e2b`
  - benben/adminAI both preserve the same single Codex-mini fallback order
  - benben/adminAI both use the same Mac image primary route and Mimo Omni image fallback
- 2026-04-14 rollback follow-up:
  - the temporary `main.tools.byProvider.ollama` slim-down was rolled back from live and source after shortcut behavior regressed
  - both live instances were returned to the nearest restorable early-morning baseline before further model changes were reapplied
  - the old NAS-local legacy id was then replaced on active live surfaces with `ollama/huihui_ai/gemma-4-abliterated:e2b`
  - `/local` now resolves to the new NAS-local abliterated e2b route, and the same route is also the current default main-chat lane
- live channel-dispatch follow-up after the Qwen pivot:
  - a user-visible Feishu no-reply case was not caused by Qwen timeout or Mac memory pressure
  - Feishu did receive the direct-message `/new`, but gateway dispatch died before model execution with `TypeError: resolveBoundAcpThreadSessionKey is not a function`
  - live `reply-BwK-bN2w.js` now resolves the minified target export as `targetsModule.resolveBoundAcpThreadSessionKey ?? targetsModule.n`, so bare `/new` and `/reset` dispatch can reach the synthetic control-reply path again
  - this remains a live dist hotfix until the current chunked reply-runtime source snapshot is captured in the bundle-management pipeline
- operational warning:
  - full 64K-capable OpenClaw prompts exceeded the fast-fail budget under NAS CPU/memory pressure and are no longer the default e2b path
  - NAS-local e2b remains high risk as a real serving model: direct `num_ctx=256` and `num_ctx=2048` probes timed out without first bytes under live load, and the 2048 OpenClaw route is only useful as a fast-fallback guardrail
  - the intended behavior is now fast fallback to Codex mini, not waiting through a long Ollama cold-start
  - keepwarm is best-effort and resource-gated; host sleep, model eviction, restart, load, or memory pressure can still prevent NAS e2b from warming

### Historical desktop-local Gemma 26B main-chat cutover

- main-chat architecture on both live instances now resolves through the same four-layer path:
  - `agents.defaults.model.primary = ollama/huihui_ai/gemma-4-abliterated:26b`
  - NAS relay `127.0.0.1:11435`
  - Mac reverse tunnel `127.0.0.1:11436 -> 127.0.0.1:11434`
  - local Mac Ollama model `huihui_ai/gemma-4-abliterated:26b`
- default automatic text fallback order is now:
  - `openai-codex/gpt-5.4-mini`
  - `deepseek/deepseek-chat`
  - `mimo/mimo-v2-flash`
  - `openrouter/xiaomi/mimo-v2-pro`
- default image routing remains desktop-local first:
  - primary `ollama/qwen2.5vl:7b`
  - fallback `openrouter/xiaomi/mimo-v2-omni`
- slash/session truth after the cutover:
  - `/gemma` is the canonical main-session switch for desktop-local Gemma 26B
  - `/local` remains a legacy manual route to `ollama/huihui_ai/gemma-4-abliterated:e2b`
  - bare `/new` and `/reset` resolve through the same default-model path, so they now return to Gemma 26B and then fall back to Codex mini if the desktop-local path is unavailable
  - the Gemma 26B configured model entry now pins `params.thinking=off`, and `agents.defaults.llm.idleTimeoutSeconds=120` is the runtime guardrail for slash/reset flows that otherwise wait longer than 60 seconds for the first visible token from Mac-local Ollama
  - validated live slash behavior now covers both instances:
    - benben bare `/gemma`, bare `/new`, bare `/reset` all complete on Gemma 26B
    - adminAI bare `/gemma`, bare `/new`, bare `/reset` all complete on Gemma 26B when invoked through the instance launcher `/usr/local/bin/openclaw-adminai`
  - validated live status behavior now also covers both instances:
    - benben fresh session `gemma-status-20260414p` completed `/new -> /status` and reported the current session model as Gemma 26B
    - adminAI `/status` via `/usr/local/bin/openclaw-adminai` reports the same current-model truth
    - later verification showed the `/status` turn itself can run through `openai-codex/gpt-5.4-mini`; status output is model-state evidence, not main-chat generation evidence
  - validated normal main-chat generation after the lifecycle hotfix now covers both instances:
    - benben session `codex-final-benben-chat-20260414a` returned `OK` through `ollama/huihui_ai/gemma-4-abliterated:26b`
    - adminAI session `codex-final-adminai-chat-20260414a` returned `OK` through `ollama/huihui_ai/gemma-4-abliterated:26b`
  - later fresh-session verification exposed a startup gap that was later closed by the 2026-04-14 bundle follow-up:
    - fresh benben/adminAI `/new` and follow-up `/status` can still hit `FailoverError: LLM request timed out.` on the Gemma startup turn
    - when that happens, runtime emits a recovery answer through `openai-codex/gpt-5.4-mini`, while `session_status` still reports the underlying session model as `ollama/huihui_ai/gemma-4-abliterated:26b`
    - live `agents.defaults.timeoutSeconds=180` and then `300` were both tested and then rolled back; they only delayed failover to roughly `193s` and `310s`, and did not make fresh `/new` complete on Gemma
  - validated offline fallback behavior now also covers both instances:
    - a full isolated temp-home harness with copied config plus `ollama.baseUrl=http://127.0.0.1:9` makes benben `/new` fall back to `openai-codex/gpt-5.4-mini`
    - the same full isolated harness makes adminAI `/new` fall back to `openai-codex/gpt-5.4-mini`
    - for fallback simulation, overriding only `OPENCLAW_CONFIG_PATH`/root is not strong enough evidence; isolate `HOME` and service-home too
  - operator warning:
    - a reused old smoke session can show one Codex-mini recovery answer on `/status` if the status turn itself times out after `session_status`
    - treat that as session-state recovery noise; verify default-model truth with a fresh session instead of replaying the older smoke id
- memory/review/class-B/cron defaults were intentionally left alone:
  - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4-mini`
  - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
  - `OPENCLAW_SESSION_MEMORY_REVIEW_MODEL=gpt-5.4`
- a restart-only reliability gap surfaced during this rollout and is now closed:
  - adminAI had an older `openclaw-config-guard guard --config ...` drop-in form that no longer matches the current CLI
  - the drop-in was corrected so restarts are again safe

What is now closed:

- the old benben/adminAI main-chat default of `openai-codex/gpt-5.4-mini`
- the old relay whitelist that only exposed remote `qwen2.5vl:7b`
- the old doc drift where benben/adminAI/staging disagreed about `/gemma`, `/new`, `/reset`, and the default image route
- the old slash-command reliability gap where bare `/gemma` or `/new` could fall back to Codex mini after the default 60s LLM idle-timeout despite the Gemma route itself being healthy

What remains open:

- the Mac reverse tunnel is now a hard dependency for the desktop-local primary path; outage handling is correct because text falls back to Codex mini and image falls back to Mimo Omni, but tunnel health remains an operational concern
- `huihui_ai/gemma-4-abliterated:26b` on the Ollama chat API emits `message.thinking`; smoke tooling must give it enough token budget or parse thinking-aware responses when verifying visible output
- relay `/api/tags` is not the canonical proof of remote-model presence; use `healthz` plus direct `127.0.0.1:11436/api/tags` when validating the desktop-local model path
- second-instance operator automation should keep using the dedicated launcher surface (`openclaw-adminai ...`) instead of ad-hoc generic CLI env overrides when evidence needs to be instance-specific

What is now closed by the 2026-04-14 follow-up:

- the former bare `/new` and `/reset` startup-timeout path is now closed by the 2026-04-14 live bundle hotfix:
  - architecture decision:
    - bare session-lifecycle commands are control-plane operations, not content-generation prompts
    - the CLI/gateway `agent` RPC path must reset/new the session and return a synthetic completed control reply without launching the default model
  - live `server.impl-BxLfE9ri.js` now handles empty-tail `/new` and `/reset` by returning:
    - `✅ New session started. Default model: \`ollama/huihui_ai/gemma-4-abliterated:26b\`. What do you want to do next?`
    - `✅ Session reset. Default model: \`ollama/huihui_ai/gemma-4-abliterated:26b\`. What do you want to do next?`
  - reply/chat runtime paths also have a bare `/new` and `/reset` short-circuit in the tracked `reply-runtime-v1` patch surface
  - raising `agents.defaults.timeoutSeconds` remains explicitly not the fix for bare lifecycle commands; the `180` and `300` experiments only delayed failover and were reverted
  - `/status` remains a real model/session-status turn and should still be treated as normal main-chat model latency risk, not as proof that `/new` or `/reset` regressed
  - source-management gap:
    - the reply/chat-path fix is represented in staging patch artifacts
    - the decisive CLI/gateway fix currently exists as live dist truth in `server.impl-BxLfE9ri.js`; no tracked staging source snapshot for that file was found, so a future bundle-management pass should capture it upstream

### Historical channel canary state-consistency and gateway version-sync pass

- channel canary state is no longer a one-slot “latest result only” blob:
  - current run health now lives separately from retained failure history
  - state keeps `last_success_at` and `last_failure_at` independently
  - each execution appends to `memory-admin/logs/channel-delivery-canary-history.jsonl`
- ops surfaces now consume the canary state in a recovery-aware way:
  - `memory-health-summary.mjs` reads the v2 canary shape
  - `memory-ops-dashboard.mjs` refreshes when canary state/history changed instead of trusting a stale cached health summary
  - a later successful canary run no longer keeps the whole dashboard red just because an older failure happened earlier that day
- canary trigger provenance is now explicit in the service path:
  - `tools/openclaw-cli-wrapper.sh` preserves `INVOCATION_ID`, `OPENCLAW_CANARY_TRIGGER_SOURCE`, and `OPENCLAW_TRIGGER_SOURCE` through node-tool execution
  - `openclaw-channel-canary.service` now pins `OPENCLAW_CANARY_TRIGGER_SOURCE=systemd_service`
  - live state/history now distinguish a systemd-triggered run from a manual probe
- gateway version metadata drift is now handled as overlayed config, not base-unit surgery:
  - both gateway units read `95-service-version.conf`
  - package-root truth and systemd self-reported version now agree on `2026.4.9`

What is now closed:

- the old “later success erases the observable evidence of an earlier failure” canary state model
- the old “dashboard may reuse a stale health summary even after a new canary run” cache hole
- the old main/adminAI gateway service-version string drift
- the old adminAI health env permission drift

What remains open:

- `deployment-verify --with-smoke` still reports `session_route_guard_failed`
- `deployment-verify --with-smoke` still reports `recent_preflight_trace_missing`
- those two checks should now be treated as a separate verify/runtime contract repair task, not folded back into canary delivery or service-version work

### Historical slash-command Chinese localization and privilege opening

- user-facing slash-command reply builders are no longer English-first:
  - status and command listing surfaces
  - model / queue / directive reply surfaces
  - ACP help / error / status surfaces
  - tools / context / usage / plugins / mcp / tasks / tts surfaces
  - agents / subagents surfaces
- the live localization mechanism is now a runtime bundle patch system rather than a one-off manual dist edit:
  - patcher: `.codex-remote-openclaw/tools/openclaw_apply_zh_runtime_patch.py`
  - ruleset generator: `.codex-remote-openclaw/tools/openclaw_refresh_zh_runtime_rules.py`
  - ruleset: `.codex-remote-openclaw/tools/openclaw_zh_runtime_patch_rules.json`
  - startup hooks:
    - `.codex-remote-openclaw/systemd/openclaw-gateway.service.d/90-zh-runtime-patch.conf`
    - `.codex-remote-openclaw/systemd/openclaw-adminai-gateway.service.d/90-zh-runtime-patch.conf`
- architecture truth after the hardening pass:
  - runtime patching must be idempotent across repeated restarts
  - only user-facing strings may be localized
  - code property keys such as `*Usage`, `withFileTypes`, and internal enum values such as `failed` must remain untouched
  - every refreshed ruleset must pass three checks before production rollout:
    - clean-bundle replay
    - `node --check`
    - second-start idempotency
- operator capability model is now intentionally broader on both live instances:
  - `tools.exec.ask = off`
  - `approvals.exec.enabled = false`
  - `tools.fs.workspaceOnly = false`
  - `tools.exec.applyPatch.workspaceOnly = false`
  - `commands.bash = true`
  - both service users have `sudo -n`
  - both workspace `AGENTS.md` files explicitly permit `sudo` for host and code changes when needed
- what is now closed:
  - the old “fixed once, then upstream update or restart reverts back to English” failure mode
  - the old “operator agents cannot actually inspect or repair the real host” failure mode
- remaining architecture debt:
  - bundle-hash drift still requires regenerating the ruleset from a fresh orig/zh snapshot when upstream package structure changes materially
  - this patch layer is operationally stable, but it is still a live dist rewrite rather than a first-class upstream localization extension point

### Historical dual-instance uplift gate

- benben/adminAI dual-instance scoring is no longer blocked by stale summary reads:
  - `openclaw-dual-instance-scorecard.mjs` now reuses the refreshed benben health truth and can also render a separate `24h + fixture` preview layer
- benben session-review architecture now has a broader deterministic pre-model fast path:
  - `owner` current / long-term-anchor short forms
  - `partner` shared current-state short forms
  - `couple` shared current-state + durable/plan combos
  all now land as `rule_lightweight_capture` instead of falling through to model review / rule rescue
- benben retry accounting is now consistent across surfaces:
  - `capture_efficiency`
  - top-level `session_review.retry_recommended_7d`
  - `retrieval_efficiency.last_7d.retry_recommended_rate`
  all now exclude retired retry-tail debt and only reflect real remaining model-review retries
- new preview-only validation surface now exists:
  - `workspace/tools/session-memory-review-fixture-preview.mjs`
  - `workspace/memory-admin/meta/session-memory-review-fixture-preview.json`
  - `workspace/memory-admin/reports/session-memory-review-fixture-preview.md`

Architecture truth after this pass:

### Historical deployment-verify hardening and smoke parity closure

- `deployment-verify.mjs` no longer treats a single transient `openai_class_b` fallback as an automatic hard failure:
  - the check still requires `codex_class_b` for success
  - it now performs one targeted retry only when the first selfcheck is structurally healthy but degraded to `openai_class_b*`
  - this preserves the intended gateway-cron contract while reducing false negatives from momentary transport wobble
- `deployment-verify` report shape is now more diagnostic for memory-review incidents:
  - `review.review_error_reason`
  - `review.review_error_detail`
  - `attempts`
  - `recovered_after_retry`
  are carried into the top-level `memory_review` section
- live verification on `2026-04-12` now has two new post-hardening reports:
  - `deployment-verify-20260412145128`
  - `deployment-verify-20260412145231`
- architecture truth after the latest live run:
  - `memory_review` is back on `gateway_cron`
  - `review_mode = codex_class_b`
  - current verify is fully green with `failures = []`
  - `gift_memory` and `exam_memory` both emitted anchored `memory_recall` evidence in the latest confirming run

What is now closed:

- the old “one transient memory-review transport wobble turns deployment verify red with no retry and poor diagnostics” failure mode
- the old “gift_memory may answer correctly but still fail to leave a trace in the latest verify run” deployment-blocking ambiguity
- the old gap where verify surfaced only `memory_review_failed` without enough inline context to distinguish fallback from a true runtime break

What remains open:

- `recovery_auto` is still `supported = false` with `reason = auto_recovery_runtime_export_unavailable`
- operator recovery still reports a live store/transcript conflict on historical session `68979494-78c5-42a4-9111-290221b026dd`
- those recovery items are now separate continuity/runtime debt; they are no longer part of the deployment-verify blocker set

- `7d live` and `24h + fixture preview` must be treated as separate readiness layers
- preview is now green:
  - fixture replay `5/5`
  - combined `24h + fixture` capture uplift gate `ready=true`
  - scorecard preview `benben=10 / adminAI=10 / overall=10`
- live is not yet green:
  - latest `7d live` scorecard remains `benben=9.1 / adminAI=10 / overall=9.5`
  - remaining live-only drags are still:
    - `session_capture_rate_7d`
    - `captured_from_rule_lightweight_7d`

What is closed:

- old retry debt no longer drags live summary / retrieval numbers
- scorecard no longer needs guesswork about whether it read an outdated benben summary
- deterministic rule-lightweight capture coverage is broad enough to prove the intended uplift path under curated replay

What remains open:

- keep collecting real benben traffic until the `7d live` layer catches up with the preview layer
- do not change fallback order while waiting for live convergence
- do not move historical sidecar past `shadow_retrieve` during this observation window
- do not let preview-only evidence be reported as if it were already `7d live`

### Historical Mac-local vision cutover

- default image understanding is no longer NAS-local and no longer cloud-first
- production image routing is now:
  - `ollama/qwen2.5vl:7b` on the Mac as primary
  - `openrouter/xiaomi/mimo-v2-omni` as fallback
- this applies to both benben and `adminAI`
- text defaults were intentionally left unchanged

Architecture truth after the change:

- OpenClaw still exposes only one practical `ollama` provider surface in config, so clean separation required a relay layer instead of a direct provider swap
- the live design is now a split-path relay:
  - image requests for `qwen2.5vl:7b` are forwarded to the Mac-hosted Ollama
  - other `ollama` requests stay on the NAS-local Ollama
- this preserves:
  - local text experiments on NAS
  - current text defaults and slash-command behavior
  - automatic image fallback when the Mac is unavailable

Important design deviation from the original plan:

- the intended transport was `Tailscale`
- the deployed transport is currently `SSH reverse tunnel`
- this is a pragmatic runtime-equivalent substitute, not the originally desired network architecture

What is now closed:

- the earlier NAS-local vision bottleneck is no longer the default production path
- `qwen2.5vl:7b` on the Mac has been verified both locally and through the NAS relay with the same screenshot payload
- the user’s latest image reply has positive evidence of using the Mac local path rather than immediately using the cloud fallback

Remaining architecture debt after the cutover:

- replace the reverse-tunnel transport with first-class `Tailscale` once macOS system approval / privileged install is acceptable
- decide whether image ingress should standardize pre-processing for very large source images before they hit the model
- if future product direction wants more explicit operator control, add a visible “local vision / cloud vision” status surface rather than relying only on logs and fallback behavior

### Historical upgrade gate for upstream `v2026.4.9`

- upgrade impact assessment is now codified in:
  - `workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
- latest formal preflight is:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.md`
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.json`
- current decision is:
  - `baseline_ready`
- what changed after the first `no_go` snapshot:
  - adminAI live workspace had stale runtime-guard artifacts
  - syncing the repo-validated manifest / snapshots / observe helpers was enough to restore `verify_state=already_patched`
  - no live `pi-embedded` code change was needed; this was baseline-control repair only
- architecture truth clarified by this assessment:
  - canonical benben memory runtime is still `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
  - `gateway-cli` also imports `/usr/lib/node_modules/openclaw/dist/runtime-BF_KUcJM.js`, but that helper runtime must not be mistaken for the main benben memory-search hook surface
  - naive “first runtime imported by gateway-cli” discovery is not safe enough for future upgrade tooling
- next architecture requirement before any upstream package move:
  - keep using `runtime-D_ihCv7c.js` as the canonical benben memory runtime in all upgrade checks
  - use the new `baseline_ready` preflight report as the upgrade-before snapshot
  - only then start a true `post` compare for `v2026.4.9`

### Historical hybrid-memory rollout status

- benben now has a live historical sidecar in `shadow_index`, so index + telemetry are no longer just repo-local
- supersession note:
  - this section is retained as 2026-04 history and is superseded for current benben by the 2026-05-02 Memory V4 convergence above
- 2026-04 live architecture truth after the rollout:
  - `memory_v2` remains the only truth layer
  - sidecar is currently evidence infrastructure only
  - live health/summary now observe sidecar freshness, source counts, and future fallback metrics
- the key remaining architecture gap is now narrower and explicit:
  - production `memory_search` is running from `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
  - the earlier reply-bundle-oriented cutover logic is not sufficient for the current production topology
  - `shadow_retrieve` and `fallback_enabled` therefore still need a dedicated hook on the current runtime bundle path
- next architectural requirement:
  - add a production-safe cutover for the current `runtime-D_ihCv7c.js` memory-search flow so it can emit structured `historical_evidence` and honor the hybrid answer contract
  - keep adminAI isolated
  - keep benben fallback order unchanged
  - historical instruction at that time: keep `memory_v2` authoritative even after sidecar retrieval is enabled

### Historical current gap after Codex usage repair

- `usage codex/openai` now exists and truthfully reports local OpenClaw Codex/OpenAI usage, so the old “quota query falls back to session_status speculation” gap is closed
- live chat `/usage codex` is now also compatible through the `commands-handlers.runtime-*` cache-reader patch, so shell and in-chat surfaces share the same Codex usage cache
- live `/status` / `session_status` now also surface cached Codex quota windows plus cache update time for the active Codex model, so the old “status only shows token/context but no quota window” gap is closed
- the remaining architecture gap is narrower:
  - there is still no official OpenAI account remaining-credit integration
  - current `codex` usage only reports what OpenClaw itself logged locally
  - `/status` is now good for current-model window state, but it still must not be presented as official OpenAI account balance
  - if the product needs official OpenAI quota/billing truth inside chat, add a separate first-class provider adapter instead of reusing `session_status`
  - generic Chinese quota prompts now route correctly to provider usage, so the remaining gap is account-level truth rather than intent routing

### Historical main-lane auth drift gap

- the `openclaw 完全不回复` incident proved that the production main lane had a separate auth-drift failure mode:
  - canonical root auth store remained healthy
  - main agent auth store drifted empty/stale
  - main replies then failed or fell back even though Codex itself was still available
- this gap is now closed by a startup-time sync guard:
  - `workspace/tools/openclaw-auth-sync-guard.mjs`
  - systemd drop-in `openclaw-gateway.service.d/85-auth-sync-guard.conf`
- architecture truth after the fix:
  - root store `/var/lib/openclaw/.openclaw/auth-profiles.json` is the canonical source for `openai-codex:default`
  - main-agent store `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json` is now a synchronized execution copy, not an independent truth source
  - the sync replaces only the `openai-codex:default` profile and preserves unrelated provider profiles

### Historical command-dispatch drift gap

- the same incident also exposed a second gap unrelated to auth:
  - the usage-only runtime patch could remove `handleFastCommand` while preserving its reference in `loadCommandHandlers()`
  - slash commands like `/status` and `/new` then failed at dispatch with `ReferenceError: handleFastCommand is not defined`
- architecture truth after the fix:
  - the usage-only cutover is no longer considered complete unless adjacent command handlers are still present
  - `runtime-phase1-cutover.mjs` now treats `handleFastCommand` presence as part of the patch completeness contract
  - direct-command runtime integrity is now an explicit part of the status/usage patch surface, not an accidental side effect

### Historical memory-quality phase 2 gap

- `partner/couple` fresh shared-state evidence was underrepresented because low-risk `/new` review candidates only queued and did not auto-land
- owner `current/recent` also carried durable preference residue because daily mirror pushed preference-style notes straight into `state/current` and `context/recent`

Architecture truth after the fix:

- low-risk `owner/partner/couple` `current/recent` candidates now auto-apply directly through `applyMemoryV2ReviewCandidate(...)`
- manual queue is now reserved for:
  - `stable`
  - `private`
  - non-low-risk families
- daily mirror is now split cleanly:
  - evidence still lands in `memory_v2/context/evidence/*`
  - only `current_state` / `one_off_logistics` are allowed to materialize into `current/recent`
- owner `current/recent` normalization now behaves like an actual short-term layer instead of a second stable-preference bucket
- rollout replay proved the cleanup effect on live owner memory, and the latest verify report stayed green:
  - `memory-admin/reports/deployment-verify-20260409150939.md`

Residual follow-up:

- the stale-wrapper operator footgun is now closed in the helper itself:
  - `class-b-llm-task-runner.mjs` falls back to `workspace/tools/openclaw-cli-wrapper.sh` when an explicit wrapper env/path does not exist
- longer-term quality work remains the same:
  - increase real `partner/couple` fresh evidence yield
  - keep projection/verify semantics hard-gated
  - deepen privacy/disclosure semantics beyond the current helper-level blocklist

### Historical shared-current freshness-yield gap

- one residual quality gap remained after phase 2:
  - `/new` low-risk auto-apply was already immediate
  - but daily/event write paths could still lag one normalize/backfill cycle before `partner_shared` and `couple relationship current` both reflected the same fresh signal
  - mixed short-term shared-state notes with guidance such as `先别追问` / `给她一点空间` / `晚点再聊` could also drift into durable `boundary/repair_pattern` classification on the daily path instead of landing as `current_state`

Architecture truth after the fix:

- `memory-v2-helper.mjs` now treats mixed stage-like shared-state + response-guidance notes as `current_state` on daily/event write paths
- immediate mirroring is now symmetric across write paths:
  - `partner shared current` -> `couple relationship current`
  - `couple relationship current` -> `partner shared current`
- this symmetry now holds for:
  - direct daily mirror
  - event extraction / evidence replay
  - review-candidate apply
- normalize/backfill still remains the cleanup/rebuild path, but it is no longer required just to surface the counterpart fresh-current projection after a new write

Residual follow-up after this closure:

- live data can still be genuinely sparse; this fix improves freshness materialization, not evidence generation volume itself
- event extraction still has a narrower “what counts as durable enough to emit an event” front door than `/new` session-review rescue, so purely stage-like group notes without relationship keywords remain a possible future yield-expansion area
- `deployment-verify` smoke still depends on a healthy `agent:main:main` session envelope; after service restarts, degraded direct-session metadata can still create false red smoke until the main store entry is normalized back to canonical channel/origin fields

### Historical bare session-reset progress-noise gap

- Feishu direct-message long-task visibility was originally added as a generic transport-progress surface
- but bare `/new` and bare `/reset` already emit a visible `✅ New session started ...` notice before the startup/review turn continues
- the generic 12-second timer therefore produced a redundant second progress ping on almost every bare reset, which looked like a separate mysterious background task even though it was the same reset turn

Architecture truth after the fix:

- long-task visibility now inspects the raw inbound body before arming
- exact bare `/new` and `/reset` bypass the additive `仍在处理中` notice
- all other Feishu direct long-task cases still keep the visibility timer
- live verify after rollout stayed green:
  - `memory-admin/reports/deployment-verify-20260410023010.md`

Residual follow-up:

- if later UX tuning is needed for non-bare reset commands, handle that as a separate policy decision; this fix intentionally only exempts exact bare reset commands

### Recently Closed

#### 1. Deployment verification script

Status:

- completed on `2026-04-01`

Operator command:

- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report`

Verified by:

- report `memory-admin/reports/deployment-verify-20260401141830.md`
- report `memory-admin/reports/deployment-verify-20260401141830.json`
- exam smoke run `5e8bc5ae-0cf4-4494-bb6b-690eda27d495`
- gift smoke run `e49b805c-3115-4759-bc7b-8f3e55dad2aa`

What it now covers:

- service state
- live bundle/tool presence
- owner direct `main` session context health
- recovery helper inspect path
- recent preflight trace presence
- real exam/gift memory smoke with grounded answer and `preflight_memory_search_*` trace
- smoke trace now also fails verification when the same source event emits more than one `memory_recall`
- smoke trace now also fails verification when `recall_refs` are empty or missing `#L...` anchors

#### 2. Duplicate recall suppression after deterministic preflight

Status:

- completed on `2026-04-01` for owner direct `main` memory-question turns

Verified by:

- `exam_memory` run `3a60fe8d-35db-48cd-8cc3-bdc33c4d4851` now shows exactly one `memory_recall`
- `gift_memory` run `7af452ec-79a7-482f-aa5f-71e8be65ee17` now shows exactly one `memory_recall`
- full post-change verification report:
  - `memory-admin/reports/deployment-verify-20260401143929.md`
  - `memory-admin/reports/deployment-verify-20260401143929.json`

What changed:

- runtime now reuses the same-turn deterministic preflight payload for duplicate same-topic `memory_search` calls instead of executing a second live search
- this reduces cost and latency without changing the grounded answer path

#### 3. Add richer recall references when results are non-empty

Status:

- completed on `2026-04-01`

Verified by:

- `exam_memory` run `35b56d78-4851-4c87-a7d9-55c294339071` now passed the stricter smoke gate with exactly `1` `memory_recall` and `3` anchored `recall_refs`
- `gift_memory` run `db058dab-6385-421d-8a43-3d8fd0bfea7c` now passed the stricter smoke gate with exactly `1` `memory_recall` and `4` anchored `recall_refs`
- full post-change verification report:
  - `memory-admin/reports/deployment-verify-20260401152349.md`
  - `memory-admin/reports/deployment-verify-20260401152349.json`
- helper-level targeted check on `2026-04-01` preserved two same-file gift hits without explicit line metadata and produced:
  - `memory/stable/relationships/guoyixuan/gifts.md#L5-L6`
  - `memory/stable/relationships/guoyixuan/gifts.md#L11`

What changed:

- scoped recall de-duplication now keeps same-path candidates apart when they carry different snippets but no explicit line metadata yet
- helper trace-ref assembly now works from visible pre-dedupe recall hits instead of only the final path-collapsed recall list
- helper trace-ref assembly now backfills `#L...` anchors from snippet text when a recall result lacks `startLine` / `endLine`
- runtime trace emission now prefers helper-produced `traceRecallRefs` so richer refs survive into `memory_recall`
- deployment verification now asserts both `exactly one memory_recall` and `anchored recall_refs present` for real exam/gift smoke turns

#### 4. Lift replay recovery beyond operator tooling

Status:

- completed on `2026-04-01`

Verified by:

- runtime journal refresh smoke on `2026-04-01` refreshed `agent:main:main` into current session id `ef356e15-a909-4e5e-b0fe-f2439affe688`
- runtime auto-recovery smoke on `2026-04-01` then restored a temp missing store key for `agent:main:main` back to the same live session id
- full post-change verification report:
  - `memory-admin/reports/deployment-verify-20260401160631.md`
  - `memory-admin/reports/deployment-verify-20260401160631.json`
- stricter unified verify now passed with:
  - `Session Recovery Inspect = present_match`
  - `Session Recovery Auto Integration = restored yes`
  - `exam_memory` run `5975241b-2e84-44be-a057-84fbbead046d`
  - `gift_memory` run `b5358917-9f1b-42e9-af80-6f8501edf8fc`

What changed:

- `recordSessionMetaFromInbound` now refreshes the session-journal replay snapshot from the live session store so `memory-admin/meta/session-journal-latest.json` tracks the current session lifecycle instead of only offline working-capture output
- live `sessions-*.js` now exposes a runtime journal-refresh path and a runtime auto-recovery path for missing store keys
- transcript append now attempts safe replay-backed store repair before returning `unknown sessionKey`
- `session-recovery-helper.mjs` now provides `runSessionAutoRecovery` with transcript-required restore and dedicated `session_recovery_auto` trace events
- deployment verification now refreshes the live session journal snapshot first, then proves runtime auto-recovery can restore a temp missing store entry without regressing exam/gift recall smoke

#### 5. Surface richer recall provenance through trace-inspect and smoke verification

Status:

- completed on `2026-04-02`

Verified by:

- full verification report:
- `memory-admin/reports/deployment-verify-20260401230550.md`
- `memory-admin/reports/deployment-verify-20260401230550.json`
- `trace-inspect` exam smoke run `54295120-6fdb-4a56-9e4a-106e97f22f88` now shows:
  - `session_entry_source = session_store`
  - `speaker_resolution_source = origin.from`
  - populated `candidate_pool_counts`
- `trace-inspect` gift smoke run `cbc98fd2-dfc8-4108-8763-8e458162b0bc` now shows:
  - non-empty `query_normalized_to`
  - `disclosure_decision = allow_all`
  - anchored `recall_refs`

What changed:

- live `memory_recall` trace emission now carries `session_entry_source` and `speaker_resolution_source`
- `tools/trace-inspect.mjs` now surfaces:
  - `session_entry_source`
  - `speaker_resolution_source`
  - `query_normalized_to`
  - `candidate_pool_counts`
  - `disclosure_decision`
  - `disclosure_block_reason`
- deployment verification smoke now fails if those richer recall-provenance fields are missing on the preflight `memory_recall`
- deployment verification now skips journal-refresh mutation when session context is already degraded, so a bad `agent:main:main` alias does not overwrite the replay snapshot during a failing verify run
- production `agent:main:main` was repaired back to the Feishu owner-direct session `ef356e15-a909-4e5e-b0fe-f2439affe688` after a degraded heartbeat/local-CLI session temporarily polluted the alias

#### 6. Prevent owner-main alias downgrade from weak inbound session metadata

Status:

- completed on `2026-04-02`

Verified by:

- full verification report:
  - `memory-admin/reports/deployment-verify-20260401230550.md`
  - `memory-admin/reports/deployment-verify-20260401230550.json`
- deployment verification `Session Route Guard` now passes with:
  - `downgrade_preserved = yes`
  - `upgrade_promoted = yes`
  - `external_handoff_allowed = yes`
- pure-function guard now preserves a Feishu owner-direct alias against `webchat`/`cli` downgrade metadata while still allowing explicit external handoff to `telegram`

What changed:

- live `sessions-*.js` session metadata merge now preserves established external owner/direct route metadata when inbound patch context is `webchat`, `cli`, or other local helper context
- the same guard still allows explicit external route upgrade or handoff instead of freezing the alias permanently
- deployment verification now includes a pure-function route-guard regression so future bundle changes cannot silently reintroduce owner-main alias downgrade

### P1: currently clear

- no open P1 items remain after runtime replay recovery was integrated into the live session lifecycle on `2026-04-01`

### P2: medium-term architecture work

#### 7. Strengthen session lifecycle management beyond current recovery helper

Potential work:

- snapshot objects
- replay checkpoints
- compaction-aware resume state
- explicit session expiry or pruning rules
- runtime entrypoint hooks that can offer or trigger replay-backed resume safely

#### 8. Normalize provider adapter behavior

Potential work:

- unify retry policy
- unify request id handling
- unify stream parsing and error surfaces

Why:

- this improves production consistency more than UI or feature churn

#### 9. Managed MCP / plugin worker lifecycle

Potential work:

- controlled startup
- health checks
- shutdown discipline
- trace hooks around tool workers

### P3: do later or only if justified

#### 10. Heavy multi-agent orchestration

Not urgent because:

- current ROI is lower than session stability, recovery, and observability

#### 11. More complex daemon layers

Not urgent because:

- extra background complexity is easy to add and hard to debug
- operational clarity matters more right now

## Recommended Next Sequence

If continuing enhancement work, do it in this order:

1. strengthen session lifecycle management beyond the current recovery helper
2. normalize provider adapter behavior
3. managed MCP / plugin worker lifecycle

## Known Pitfalls

### 1. Do not mistake `cc` files for production

- `/home/cc` content is not the authoritative runtime

### 2. Do not edit bundle files without backup

- live runtime is under `/usr/lib/node_modules/openclaw/dist`

### 3. Do not trust relative assumptions about session stores

- session stores are under `.openclaw/agents/<agent>/sessions/sessions.json`
- store path lookup must respect `cfg.session.store` and `agentId`

### 4. Do not leave `/tmp/openclaw_patch_*` garbage behind

- clean deployment artifacts after each change

### 5. Do not overfocus on UI polish

- current leverage is in runtime stability, traceability, and recovery

### 6. Route correctness alone is not enough

- even when `memory_search` is called and the route/scope are correct, bad snippet ranking can still make the model answer as if memory were missing
- verified-cache metadata and heading lines must not outrank fact lines during recall packaging

## Verification Patterns

### Minimal runtime smoke

- use `sudo -u openclaw -H openclaw agent ... --json`

### Deterministic trace fallback smoke

- when prompt-based tool usage is unreliable, use a runtime harness that:
  - registers run context explicitly
  - executes `memory_search` directly
  - verifies `memory_recall` carried the expected `trace_id` and `source_event_id`

### Trace verification

- inspect `/var/lib/openclaw/.openclaw/workspace/memory-admin/trace/YYYY-MM-DD.jsonl`
- for one chain, prefer `/var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs` over hand-grepping JSONL
- preferred examples:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs --trace-id <trace_id> --json`
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs --session-key <session_key> --write-report`
- for cron traces specifically:
  - prefer `--session-id <run_session_id>` or `--source-event-id cron:<jobId>:<run_session_id>`
  - do not assume the trace `session_key` will equal the run-session key with `:run:<sessionId>`

### Recovery verification

- use `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs` before editing session stores by hand
- preferred examples:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs --session-key <session_key> --write-report --json`
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs --session-id <session_id> --write-report`
- for repair smoke:
  - prefer an isolated `--workspace` + `--state-dir` clone before touching production state
- never use `--force` on a production store conflict unless the overwrite is explicitly intended and separately verified

## Operator Tooling Status

### Trace inspection

- implemented at:
  - `/var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs`
- joins:
  - trace events
  - gate logs
  - session journal
- supports filters:
  - `trace_id`
  - `session_key`
  - `session_id`
  - `source_event_id`
  - `gate_log_id`
- can write durable reports to:
  - `/var/lib/openclaw/.openclaw/workspace/memory-admin/reports/`

### Session recovery

- implemented at:
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs`
- resolves:
  - replay metadata
  - transcript presence
  - session store state
- can:
  - inspect
  - propose resume commands
  - repair missing store keys
  - refuse unsafe overwrites by default
- emits:
  - recovery audit rows
  - trace events
  - Markdown / JSON reports

### Service verification

- `systemctl is-active openclaw-gateway.service`

## Definition Of Done For “Trace Is Good Enough”

Trace is good enough when all of the following are true:

- all primary run entrypoints emit recall trace consistently
- each recall trace has stable root identifiers
- recall-to-write correlation is inspectable without guesswork
- a future operator can answer “why did this memory write happen” in minutes, not hours

## Status Summary

### Strong

- memory layer maturity
- session journal foundation
- write governance
- basic recall tracing
- deployment knowledge capture

### Weakest remaining areas

- replay-driven resumability
- deployment verification automation
- recall-to-write correlation

## Known Gotchas

- cron trace normalization currently prefers the base key `agent:<agent>:cron:<jobId>` even when the cron run log shows `agent:<agent>:cron:<jobId>:run:<sessionId>`
- an explicit cron job `sessionKey` was not sufficient to force trace `session_key` away from the base cron key during the `2026-04-01` manual smoke

## 2026-04-08 - Dual Instance Isolation Status

### Completed

- second deployment boundary established:
  - `benben` = life assistant
  - `adminAI` = ops assistant
- second service root established:
  - `/var/lib/openclaw-adminai/.openclaw`
- second gateway established:
  - `18889`
- second browser control port established:
  - `18891`
- CLI routing fixed so human operator accounts no longer silently fall back to `~/.openclaw`
- service-env routing now keys off real instance state variables instead of only `OPENCLAW_ROOT`
- `adminAI` workspace cleaned to ops-only memory surface
- `adminAI` login user now has a dedicated local operator entry

### Still to do

- provision dedicated external channel credentials for `adminAI`
  - separate Telegram bot or allowlist surface
  - separate Feishu app or group policy
- build `adminAI`-specific ops memory schema further
  - `hosts/`
  - `services/`
  - `runbooks/`
  - `topology/`
  - `policies/`
  - `active-incidents/`
  - `active-tasks/`
- decide whether `adminAI` should keep any generic `memory/knowledge/*` documents beyond the new ops-only baseline
- define `adminAI` execution policy boundaries
  - low-risk auto-fix allowed
  - high-risk commands require explicit audit framing
- add dual-instance regression checks
  - prove `benben` never reads ops memory
  - prove `adminAI` never reads life-assistant memory
  - prove session / cron / recall / db trees never cross

### Architectural rule going forward

Do not model `adminAI` as a second persona inside the `benben` deployment. Keep it as a separate OpenClaw stack with its own service user, state root, gateway, memory, cron, and channel surface.

## 2026-04-08 - Memory v2 follow-up after live stabilization

### Newly closed

- `memory_v2` retrieval is now the live primary path for owner / partner / couple / private memory questions
- `/new` GPT-5.4 session review is live, health-scoped, and weekly-review-backed
- canonical-first write path is in place: canonical `memory_v2` targets first, legacy mirrors second
- weekly review now exposes personal/shared current counts and current memory gaps
- live couple-memory regression is healthy at the current checkpoint

### Current strongest result

The memory system is now mostly limited by data quality / data density, not by routing correctness.

### Highest-value next work

1. Increase extraction yield from real conversations for:
   - `owner personal current_state`
   - `partner personal current_state`
   - `partner shared current_state`
   - `couple relationship current_state`
2. Continue separating `owner persona` from `assistant operating contract`
3. Make `subjects/scopes` registry more authoritative so helper hardcoding becomes thinner
4. Add answer-level evals, not only route/path evals

### Product gap now

- the system already avoids most wrong hits / identity bleed / recall pollution
- the bigger remaining weakness is that fresh state still grows too slowly
- current live shape is roughly:
  - owner personal stable/current: usable
  - partner personal stable: usable
  - partner personal current: still sparse
  - partner shared current: still sparse
  - couple stable/shared plan: usable
  - couple relationship current: still sparse

### Rule for future work

Do not overfocus on couple-only memory anymore. Treat the target product as:

- one assistant for `owner`
- one assistant for `partner`
- one shared assistant for `couple`

All three memory axes must stay healthy together.

### 2026-04-08 follow-up note

- ordinary natural phrasing without explicit `最近/状态/记住` markers is now partially rescued by rule logic and prompt examples
- this lowers false negatives, but the remaining bottleneck is still real-session signal density, not routing bugs
- deep audit also closed two subtle quality bugs:
  - duplicate partner/couple preference facts in the rendered partner-preference projection
  - owner recent-state scope ordering that still let `memory/working/current.md` appear ahead of canonical owner current files
- transport rule update: memory-review staying on Codex/OpenAI quota now means the bounded Class-B path rides the OpenClaw gateway Codex execution surface (`openai-codex/gpt-5.4` via isolated cron agentTurn), not direct OpenAI/OpenRouter HTTP calls
- live ops drift also exposed one deployment rule that is now fixed: manual sync must preserve `openclaw:openclaw` ownership on writable runtime trees, or `couple_memory_eval` can fail with false `EACCES`
- memory-review model routing is now explicitly pinned to the Codex/OpenAI quota path by default; future work should treat any OpenRouter use here as an explicit operator override, not as auto-detection
- direct HTTP transport remains only as fallback/testing plumbing; future work should preserve gateway Codex as the default bounded-task transport for memory/session maintenance
- the remaining work after those fixes is product/data work, not another scope-order or projection-dedup correctness bug
- command-surface rule tightened after live regressions:
  - do not treat `/usage`, `/status`, and natural-language quota routing as separable hotfix targets
  - future runtime bundle edits must keep the full usage-provider helper block plus neighboring handlers (`handleUsageCommand`, `handleFastCommand`, `handleSessionCommand`) together
  - add or keep regression coverage for partially patched live bundles where the handler references exist but the helper definitions are missing

### 2026-04-09 live rollout result

- the originally queued product gaps are now live:
  - Feishu direct long-turn visibility
  - denser `partner shared current` / `couple relationship current`
  - repaired scoped preflight recall for owner exam / couple gift memory smoke
- live runtime shape after rollout:
  - Feishu direct turns may emit one additive `仍在处理中，我还在继续这条任务，处理完会直接回你。`
  - scoped memory recall again emits anchored refs plus populated `session_entry_source`, `speaker_resolution_source`, `query_normalized_to`, `candidate_pool_counts`, and `disclosure_decision`
  - owner-side gift questions can infer couple-shared targets without explicitly naming the partner
  - snippet ranking now prefers real `statement` lines over metadata / archived trim noise
- verified live by:
  - `tools/deployment-verify.mjs --with-smoke --write-report`
  - final green report: `memory-admin/reports/deployment-verify-20260409112747.md`

### 2026-04-09 memory data-quality hardening

- the data-quality debt found after the first rollout is now closed for the three concrete gaps that were still affecting user-facing memory behavior:
  - daily overwrite/compression risk
  - promotion queue maintenance-noise leakage
  - owner `current/recent` maintenance residue
- architecture truth after the hardening:
  - canonical daily writes are now lossless instead of “parse 5 sections then rewrite the whole file”
  - same-day repair now exists as a first-class operator entrypoint via `tools/daily-memory-repair.mjs`
  - one shared maintenance/noise classifier now gates all four stages that had previously drifted apart:
    - event extraction
    - promotion review
    - session review
    - memory_v2 normalize/apply
- live cleanup on `2026-04-09` proved that the new rules are not just forward-only:
  - `memory/2026-04-09.md` was repaired from `memory/events/2026-04-09.jsonl`
  - owner `memory_v2 current/recent` maintenance residue was cleaned by replay + normalize
  - `memory/pending/promotions.yaml` no longer retains maintenance candidates
- final post-hardening gate passed on live:
  - `memory-admin/reports/deployment-verify-20260409123616.md`
  - `memory-admin/reports/deployment-verify-20260409123616.json`

### 2026-04-09 follow-up: helper disclosure filtering + shared-current mirror parity

- a narrower but real privacy/helper gap is now partially closed:
  - scoped recall helper no longer exposes out-of-scope semantic hits as visible results by default
  - blocked semantic hits now surface through `blocked_by_privacy` plus `allow_partial` / `deny_all` disclosure states
  - this is still not a full privacy-aware semantic merge engine, but it is no longer true that helper disclosure is effectively hard-coded `allow_all`
- couple-current freshness also gained an architecture-level correctness fix:
  - async `normalizeMemoryV2Store(...)` now mirrors `partner_shared` fresh current/recent back into `couple relationship current/recent`, matching the sync normalize path
  - this closes a parity bug where one normalize path could silently thin `couple relationship current` even though the fresh shared signal already existed in `partner-shared`
- shared current-state evidence coverage is now broader:
  - not only sleep / reply-pace / pressure
  - also sensitivity / space / `先别追问` / `缓一缓再沟通` phrasing
- final post-follow-up gate passed on live:
  - `memory-admin/reports/deployment-verify-20260409124504.md`
  - `memory-admin/reports/deployment-verify-20260409124504.json`

### 2026-04-09 follow-up: projection freshness semantics aligned

- shared-current projection semantics are now less misleading operationally:
  - `partner shared current` / `couple relationship current` freshness is now based on projection-relevant signals, not all highlights in the underlying current file
  - this closes the “summary says no recent relationship signal but freshness still shows active highlights” drift
- architecture truth after the fix:
  - `latest_signal_observed_at` is the projection-relevant signal watermark
  - `current_layer_latest_observed_at` remains available separately for debugging current-file churn
  - the projection-count fields now represent relevant signals rather than unrelated anniversary/plan noise
- final post-follow-up gate passed on live:
  - `memory-admin/reports/deployment-verify-20260409124941.md`
  - `memory-admin/reports/deployment-verify-20260409124941.json`

### 2026-04-09 follow-up: projection replay discipline + shared-plan artifact compaction

- `couple current` no longer fans out a document-generation artifact chain into several near-duplicate active `shared_plan` highlights:
  - same-topic Feishu doc / 计划表 / 课表 / ICS generation summaries are compacted to one representative current highlight
  - this improves `couple current` readability without pretending the artifact flow is relationship-state evidence
- operational truth learned from the live re-check:
  - helper freshness semantics are not the same thing as persisted projection truth
  - after helper/projection changes, `memory-v2-backfill` (or another full normalize/projection rebuild) must run before reading `memory_v2/projections/*` as authoritative
  - legacy keys such as `latest_observed_at` / `active_highlight_count` in `couple-current-relationship.md` indicate stale projection content, not a successful rollout
- final post-follow-up gate passed on live:
  - `memory-admin/reports/deployment-verify-20260409125429.md`
  - `memory-admin/reports/deployment-verify-20260409125429.json`
- live replay re-check also confirmed the persisted projection output now matches the helper semantics:
  - `couple-current-relationship.md` emits `latest_signal_observed_at`, `current_layer_latest_observed_at`, and `active_signal_count=0`
  - latest confirmatory gate:
    - `memory-admin/reports/deployment-verify-20260409130032.md`
    - `memory-admin/reports/deployment-verify-20260409130032.json`
- additional live truth discovered after a deeper check:
  - for runtime-facing helper changes, replaying projections is not enough if the running gateway process still holds an older helper module in memory
  - real query traffic can then rewrite the projection back to stale semantics until `openclaw-gateway.service` is restarted
- final post-fix gate after gateway restart + replay:
  - `memory-admin/reports/deployment-verify-20260409130544.md`
  - `memory-admin/reports/deployment-verify-20260409130544.json`

### 2026-04-09 follow-up: deployment gate now asserts projection freshness semantics

- the live verification gate is now stricter, not just greener:
  - `deployment-verify` explicitly checks that `partner-shared-current.md` and `couple-current-relationship.md` have switched to the refreshed projection semantics
  - it rejects legacy freshness keys such as `latest_observed_at` / `active_highlight_count`
- this closes the operational blind spot exposed earlier:
  - previously smoke could still pass while the persisted projection semantics had silently regressed
  - now that regression class is part of the gate itself instead of relying on manual deep inspection
- latest confirmatory gate:
  - `memory-admin/reports/deployment-verify-20260409142359.md`
  - `memory-admin/reports/deployment-verify-20260409142359.json`

### 2026-04-09 follow-up: broader natural shared-state capture

- the shared current-state intake is now slightly closer to real conversation phrasing:
  - not only sleep / pressure / reply pace / sensitivity / space
  - also grievance / silence / coldness phrasing such as `委屈` / `不太想说话` / `冷淡` / `先哄`
- this enhancement spans both ends of the pipe:
  - session-review rule rescue can capture these phrases into `current_state`
  - `memory-v2-helper` can also interpret them as valid `partner shared current` / `couple relationship current` evidence
- latest confirmatory gate after rollout:
  - `memory-admin/reports/deployment-verify-20260409143019.md`
  - `memory-admin/reports/deployment-verify-20260409143019.json`

### Remaining work after the 2026-04-09 rollout

- fresh evidence yield is still the long-term bottleneck:
  - `partner personal current_state`
  - `partner shared current_state`
  - `couple relationship current_state`
  Projection density is better now, but it still cannot invent fresh state when recent capture volume is thin.
- helper-level privacy hardening is still incomplete:
  - current helper path now blocks out-of-scope semantic hits and can emit `allow_partial` / `deny_all`, but the merge logic is still path-level and not yet a full privacy-aware semantic ranking layer
  - future work should deepen that path without regressing smoke determinism
- current/recent quality is materially better after the hardening, but answer quality is still bounded by evidence density rather than by a remaining write-path overwrite bug
- keep the new recall ranking behavior regression-tested:
  - exam/gift smoke is now sensitive to snippet ranking around archived stable-trim lines
  - preserve explicit regression coverage for “statement beats archived metadata” and “owner gift infers couple current without explicit partner mention”

### 2026-04-10 follow-up: benben hybrid sidecar is live and the health contract is closed

- benben live state is no longer “working but degraded”; after the 2026-04-10 follow-up it is now:
  - `memory-health-summary`: `healthy`
  - `deployment-verify --with-smoke`: green
  - `couple_memory_eval`: `13/13`
  - `session_review`: healthy with `pending_reconcile_count=0`
  - `memory-audit`: `unauthorized_writes=0`
- architecture truth learned during the closure:
  - `seedAuthorizedMemoryState()` must rebuild from the current protected surface, not merge onto old tracked entries, otherwise archive-era tracked paths survive and create fake unauthorized-write alerts
  - `session-memory-review-selfcheck` must carry `tools/openclaw-cli-wrapper.sh` into its synthetic temp workspace, otherwise verify-only Class-B checks can fail even when live session review is already healthy
  - for benben’s historical sidecar, shadow-mode cross-scope filtering is a safety/coverage metric, not a user-facing failure; only `fallback_enabled` mode should treat recent cross-scope hits as a health red line
  - an explicit-history failure should not keep the sidecar unhealthy after a later successful query has already cleared `last_error` and advanced `last_status`
- current benben sidecar rollout truth:
  - mode stays `shadow_retrieve`
  - it is indexed and healthy on live
  - current filter pressure is still high (`cross_scope_filtered_count=88`), but this is now telemetry rather than a blocker because shadow mode never lets those candidates enter answer composition
- next architectural work is no longer “repair benben correctness”; it is now optional rollout/quality work:
  - improve subject / visibility hints for sidecar-indexed historical docs so `shadow_retrieve` produces fewer blocked candidates before any move to `fallback_enabled`
  - preserve the new health semantics so sidecar telemetry remains observable without regressing overall health into false attention
  - keep the selfcheck wrapper-copy path regression-tested, because `deployment-verify` depends on it even when day-to-day live review flows are already green

### 2026-04-10 follow-up 2: historical sidecar filter pressure is now materially lower on live

- the “reduce blocked candidates before any future `fallback_enabled` rollout” task is partially completed:
  - assistant-only / ops-like `session_transcript` docs are now excluded from the benben historical sidecar index
  - transcript subject / visibility inference now prefers user-originated lines instead of letting assistant-heavy residue dominate classification
  - `cross_scope_filtered_count` is no longer incremented for every filtered candidate; it now only tracks strong, explicit subject / visibility conflicts
- live result after reindex:
  - `session_transcripts: 33 -> 5`
  - `doc_count: 114 -> 86`
  - representative explicit-history queries now produce:
    - owner explicit history: `filtered=1`, `cross_scope=1`
    - couple explicit history: `filtered=0`, `cross_scope=0`
- importantly, benben did **not** move to `fallback_enabled`; current truth remains:
  - `historical_sidecar.mode=shadow_retrieve`
  - `historical_sidecar.status=healthy`
  - `memory-health-summary.overall_status=healthy`

What is still left if we keep pushing this area:

- the cumulative live counters are still historically inflated because `filtered_candidate_count` / `cross_scope_filtered_count` are append-only state, not reset-on-reindex gauges
  - if we want cleaner observability before a future rollout, add a windowed or per-query metric view rather than depending only on lifetime totals
- sidecar log-file ownership drift is now a known operational footgun:
  - if `memory-admin/logs/mempalace-sidecar.jsonl` stops being writable by `openclaw`, explicit-history `search` fails with `EACCES`
  - future hardening could include a lightweight writability self-check or atomic recreate path before append

### 2026-04-10 follow-up 3: generic explicit-history prompts no longer hit transcript noise

- the remaining `filtered=1 / cross_scope=1` owner explicit-history case has now been closed without changing rollout mode:
  - transcript indexing now skips synthetic cron/task prompts even if they masquerade as user lines
  - transcript indexing deduplicates the same session file across multiple session stores
  - explicit-history scoring strips meta-memory boilerplate and requires topic-bearing query content before sidecar candidates score
- updated live result after the second tightening:
  - `session_transcripts: 5 -> 1`
  - `doc_count: 86 -> 82`
  - generic owner explicit history: `candidate=0`, `filtered=0`, `cross_scope=0`
  - generic couple explicit history: `candidate=0`, `filtered=0`, `cross_scope=0`
  - `historical_sidecar.status` still `healthy`
  - `memory-health-summary.overall_status` still `healthy`

What still remains if we keep polishing before any future `fallback_enabled` move:

- the single remaining live `session_transcript` is now a real user-facing benben conversation rather than cron/task residue
  - if future retrieval quality work continues, the next question is not “how to remove ops noise” but “whether sidecar should keep any transcript docs at all for generic history prompts”
- cumulative counters remain append-only historical totals
  - current live `filtered_candidate_count=95` and `cross_scope_filtered_count=91` include old runs from before the cleanup
  - if operators need cleaner rollout truth, add per-query or rolling-window metrics instead of inferring from lifetime counters

### 2026-04-10 follow-up 4: recent-window sidecar observability is now live

- the observability gap above is now closed at the summary layer:
  - `mempalace-sidecar status --json` exposes `recent_window`
  - `memory-health-summary --json` mirrors that block and also forwards recent-window values into `retrieval_metrics`
  - markdown health summary now labels recent-window metrics separately from lifetime totals
- current benben live truth:
  - `historical_sidecar.status=healthy`
  - `historical_sidecar.mode=shadow_retrieve`
  - `historical_sidecar.recent_window.window_hours=24`
  - `historical_sidecar.recent_window.query_count=9`
  - `historical_sidecar.recent_window.filtered_candidate_count=4`
  - `historical_sidecar.recent_window.cross_scope_filtered_count=3`
  - `historical_sidecar.recent_window.explicit_history_failure_count=0`
  - lifetime totals are still visible for audit:
    - `filtered_candidate_count=95`
    - `cross_scope_filtered_count=91`
    - `explicit_history_failure_count=3`

What still remains after this:

- recent-window metrics are derived from the append-only sidecar log, not from a separately materialized rollup state
  - this is fine at current scale, but if the log grows large, a future compaction or daily rollup may be worth adding
- the remaining recent-window pressure (`filtered=4 / cross_scope=3` over 24h) is now clearly observable and bounded
  - if we ever want to move toward `fallback_enabled`, the next question is whether those 3 recent cross-scope filters are acceptable safety telemetry or deserve another round of query/index tuning

### 2026-04-10 follow-up 5: current-index-window observability is now live

- the remaining summary gap is closed:
  - `historical_sidecar.current_index_window` now reports only the queries/log events that happened since `indexed_at`
  - health summary no longer force-refreshes the sidecar index on every run; it reuses the current index within TTL so this baseline window remains meaningful
- current benben live truth:
  - `historical_sidecar.indexed_at=2026-04-10T10:02:42.192Z`
  - before a new probe query, `current_index_window.query_count=0`
  - after one explicit-history probe query, `current_index_window.query_count=1`
  - that same probe remained clean:
    - `filtered_candidate_count=0`
    - `cross_scope_filtered_count=0`
  - `memory-health-summary.overall_status` stayed `healthy`

What still remains after this:

- the summary/telemetry layer is now good enough to distinguish:
  - lifetime totals
  - recent 24h behavior
  - behavior since the current sidecar index baseline

### 2026-04-10 follow-up 6: sidecar log compaction / rollup is now implemented

- the operational follow-up above is now implemented:
  - `mempalace-sidecar.mjs` supports `compact`
  - stale raw log entries older than the retention window are rolled into `memory-admin/sidecar/mempalace/log-rollups.json`
  - recent raw entries remain in `memory-admin/logs/mempalace-sidecar.jsonl`
  - sidecar status and health summary now expose `historical_sidecar.log_rollup`
- current benben live truth after the first compact run:
  - `compacted=false`
  - `retention_hours=48`
  - `kept_raw_entry_count=10`
  - `kept_raw_since=2026-04-10T08:24:53.399Z`
  - `rolled_entry_count=0`
  - `day_count=0`
  - meaning: there was nothing old enough to roll yet, but the mechanism is live and its summary path is verified

What still remains after this:

- sidecar compaction is now an explicit capability, not yet a scheduled recurring maintenance step
  - if we want it to stay self-maintaining without operator intervention, the next optional move is to call `compact` from an existing low-frequency health/maintenance path instead of relying on manual invocation
- semantically, the benben sidecar is no longer blocked on correctness or observability
  - the remaining work is purely optional quality/operations tuning

### 2026-04-10 follow-up 7: sidecar compaction is now on the existing maintenance runner

- the optional operations follow-up above is now closed without adding any new timer/service:
  - `memory-maintenance-runner.sh` now runs `mempalace-sidecar.mjs compact --json` in `standard`
  - it also runs the same step in `deep`
  - each run persists a timestamped artifact under `memory-admin/meta/mempalace-sidecar-compact-*.json`
- this keeps the automation aligned with the existing benben maintenance cadence:
  - `standard` timer every 6h
  - `deep` timer on the existing daily calendar
- current benben live truth after a manual `standard` maintenance run with the new runner:
  - latest compact artifact:
    - `memory-admin/meta/mempalace-sidecar-compact-20260410-201529.json`
  - artifact payload:
    - `compacted=false`
    - `rolled_entry_count=0`
    - `kept_raw_entry_count=10`
    - `retention_hours=48`
  - health summary remained stable:
    - `source_mode=standard`
    - `historical_sidecar.status=healthy`
    - `memory-health-summary.overall_status=healthy`

What still remains after this:

- the sidecar is now self-maintaining enough for the current rollout phase
- remaining work, if any, is no longer automation plumbing
  - it is optional retrieval-quality tuning before any future `fallback_enabled` decision

### 2026-04-10 follow-up 8: offline `v2026.4.9` candidate audit says upgrade is not yet migratable

Current truth from the new `candidate` stage of `openclaw-upgrade-impact-assess.mjs`:

- candidate package:
  - `/tmp/openclaw-2026.4.9-stage.EEIpy7/package`
- baseline:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.json`
- decision:
  - `no_go`

Why it is blocked:

- benben custom memory semantics do not exist in the candidate package:
  - the candidate `memory_search` surface lives in `dist/extensions/memory-core/index.js`
  - our current live benben patch semantics are not there:
    - no `historical_evidence`
    - no `answer_summary_cn`
    - no `answer_debug_summary_cn`
    - no `answer_full_summary_cn`
    - no `hybrid_answer_guidance_cn`
  - translation: benben would lose the current evidence-only / explainability / hybrid-answer contract if we upgraded without first migrating the patch
- adminAI candidate `pi-embedded` is not patch-compatible with the current baseline:
  - candidate file: `pi-embedded-DZSqcPKt.js`
  - current managed baseline: `pi-embedded-BaSvmUpW.js`
  - candidate `preflight/verify` result:
    - `verify_state=unknown`
    - `base_match=false`
    - `patched_match=false`
    - `markers_ok=false`

Important architectural implication:

- the current live assumption “benben custom memory hook is centered on `runtime-D_ihCv7c.js`” is version-specific
- in `v2026.4.9`, the operative memory tool surface has effectively moved into the `memory-core` extension bundle
- so the next upgrade-enabling work is not live deployment
  - it is migration work:
    - re-port benben’s memory-phase patch semantics onto the new `extensions/memory-core/index.js` surface
    - re-port adminAI’s service-gated `pi-embedded` patch onto `pi-embedded-DZSqcPKt.js`

### 2026-04-10 follow-up 9: candidate migration is complete; next step is live upgrade execution, not more offline patch design

The migration items above are now closed in the repo and on the offline staging package:

- benben:
  - candidate `memory_search` custom semantics have been re-ported onto `dist/extensions/memory-core/index.js`
  - supporting tool:
    - `workspace/tools/memory-core-phase1-cutover.mjs`
  - artifacts:
    - `workspace/patches/runtime/memory-core-base-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/memory-core-patched-v2026.4.9-phase1.js`
    - `workspace/patches/runtime/memory-core-phase1-v2026.4.9.patch`
- adminAI:
  - candidate service-gated patch has been re-ported onto the real logic bundle `dist/pi-embedded-Vw-lS5ti.js`
  - the wrapper `pi-embedded-DZSqcPKt.js` should not be treated as the patch target
  - supporting tool:
    - `workspace/tools/adminai-pi-embedded-cutover.mjs`
  - candidate manifest:
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
  - artifacts:
    - `workspace/patches/runtime/pi-embedded-base-Vw-lS5ti.adminai-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/pi-embedded-patched-Vw-lS5ti.adminai-v2026.4.9-ops.js`
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-ops.patch`

Current validated state:

- offline candidate package:
  - `/tmp/openclaw-2026.4.9-stage.EEIpy7/package`
- latest candidate report:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-candidate-v2026.4.9-20260410-142636Z.json`
- decision:
  - `candidate_ready`

Therefore the architecture-level next step has changed:

- no longer needed:
  - more offline patch-shape analysis for `v2026.4.9`
- now needed:
  - plan and execute the actual live package upgrade on NAS
  - then run the `post` stage validation against the `baseline_ready` pre report

Remaining risk that still needs explicit handling during the live upgrade round:

- runtime bundle names still change between baseline and candidate:
  - benben runtime: `runtime-D_ihCv7c.js -> runtime-BXaxArxm.js`
  - adminAI wrapper: `pi-embedded-BaSvmUpW.js -> pi-embedded-DZSqcPKt.js`
- so the live rollout must treat this as a controlled bundle switch with post-upgrade validation, not as a hash-preserving in-place patch refresh

### 2026-04-11 follow-up 10: live upgrade round is closed; remaining work is baseline hygiene, not rollout execution

The `v2026.4.9` live rollout is now complete. The architecture-level state has changed from “prepare and execute live upgrade” to “maintain post-upgrade baselines”.

Closed items:

- live package replacement to `openclaw@2026.4.9`
- benben post-upgrade memory validation
- adminAI post-upgrade guarded runtime validation
- final `post` decision:
  - `go`

Latest post-upgrade evidence:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-024041Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-024041Z.md`

What still remains architecturally worth cleaning up:

- benben runtime marker audit
  - the old audit still expects pre-`v2026.4.9` runtime markers like `recall_refs:` and `candidate_pool_counts:` in the main runtime bundle
  - after the upgrade, benben’s real memory tool surface is on `dist/extensions/memory-core/index.js`
  - next cleanup should move the post-upgrade audit baseline from “old runtime markers” to the new `memory-core` truth surface
- adminAI policy probe semantics
  - current hard gates are healthy:
    - `transport_canary.ok=true`
    - `first_action=ocapp_diagnose`
    - `stop_on_ok=true`
  - the remaining drift is an auxiliary policy-probe boolean:
    - `should_use_memory_after_diagnose`
  - next cleanup can decide whether to:
    - harden the service-gated system prompt to make this deterministic, or
    - keep it as a warning-only semantic outside the rollout blocker set
- shared runtime route-guard patch management
  - `store-Cgl8QMzI.js` was patched directly on live package root to restore established external route preservation
  - this should eventually be converted from “live-only manual patch” into a repo-tracked artifact or helper, so future upgrades do not depend on ad hoc live edits

### 2026-04-11 follow-up 11: two post-upgrade cleanup items are now closed

Closed:

- benben memory-surface audit migration
  - `upgrade-impact-assess` no longer treats pre-`v2026.4.9` runtime markers as the only benben truth surface
  - current authoritative audit target is:
    - `dist/extensions/memory-core/index.js`
  - latest post report shows:
    - `benben_memory_surface_audit.ok=true`
- adminAI forced policy-probe parsing
  - the assess tool can now recover JSON from noisy remote command output
  - latest post report now captures the forced probe correctly and no longer falls back to stale observe state

Latest post-upgrade evidence after these cleanups:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-063555Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-063555Z.md`

Remaining architecture cleanup is now narrower:

- shared runtime route-guard patch management
  - still worth converting the live `store-Cgl8QMzI.js` edit into a repo-tracked artifact/helper
- bundle-resolution warning cleanup
  - current assess output still carries wrapper/reply fallback warnings
  - these are low priority because rollout is already `go`, but they can be tightened later if you want a cleaner steady-state report

### 2026-04-11 follow-up 12: shared runtime route-guard patch management is now closed

Closed:

- shared runtime route-guard patch management
  - the live `store-Cgl8QMzI.js` route-preservation fix is now represented in repo, not just on the NAS package root
  - managed artifacts are:
    - `workspace/tools/store-route-guard-cutover.mjs`
    - `workspace/tools/tests/store-route-guard-cutover.test.mjs`
    - `workspace/patches/runtime/store-base-Cgl8QMzI.route-guard-snippet.js`
    - `workspace/patches/runtime/store-patched-Cgl8QMzI.route-guard-snippet.js`
    - `workspace/patches/runtime/store-Cgl8QMzI.route-guard.patch`
  - helper replay against the reconstructed pre-patch snippet matches the live patched snippet, so future upgrades now have a concrete cutover artifact instead of an ad hoc live edit

Remaining architecture cleanup is now just low-priority warning tightening:

- bundle-resolution warning cleanup
  - `pi_embedded_candidate_fallback`
  - `reply_candidate_fallback`
  - `legacy_reply_bundle_changed`

### 2026-04-11 follow-up 13: bundle-resolution warning cleanup is now closed

Closed:

- bundle-resolution warning cleanup
  - `upgrade-impact-assess` now resolves:
    - `runtime-embedded-pi.runtime-* -> pi-embedded-Vw-lS5ti.js`
    - reply loader/runtime chain -> `reply-BwK-bN2w.js`
  - `legacy_reply_bundle_changed` is now suppressed when `memory-core` is already the benben truth surface

Latest post-upgrade evidence:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-070836Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-070836Z.md`

Remaining post-upgrade warning surface is no longer architectural:

- `systemd_openclaw-adminai-healthcheck.service_not_active:inactive`
  - expected outside active run windows for the timer-driven one-shot healthcheck service

### 2026-04-11 follow-up 14: formal post gate is green; remaining warning is service-gated policy semantics

Latest post-upgrade evidence:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-074153Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-074153Z.md`

Current state:

- decision:
  - `go`
- warnings:
  - `adminai_policy_probe_not_ok`

This is no longer a bundle-resolution or systemd-state problem. The remaining drift is only the adminAI policy-probe auxiliary boolean:

- `first_action_probe.should_use_memory_after_diagnose=false`

Core rollout gates remain healthy:

- `transport_canary.ok=true`
- `first_action=ocapp_diagnose`
- `stop_on_ok=true`

So the only remaining cleanup, if wanted, is product/policy-level:

- decide whether `should_use_memory_after_diagnose` must be forced back to `true`
- or keep treating it as a warning-only semantic outside the rollout blocker set

### 2026-04-11 follow-up 15: service-gated policy semantics cleanup is now closed

Closed:

- adminAI service-gated policy semantic drift
  - `pi-embedded` prompt now includes:
    - `should_use_memory_after_diagnose 必须视为 true`
  - live `pi-embedded-Vw-lS5ti.js` has been repatched and verified against the updated v2026.4.9 manifest
  - forced policy probe is back to:
    - `first_action=ocapp_diagnose`
    - `should_use_memory_after_diagnose=true`
    - `stop_on_ok=true`

Latest post-upgrade evidence:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.md`

Current state:

- decision:
  - `go`
- warnings:
  - none

### 2026-04-11 follow-up 16: post-upgrade steady-state pre baseline is now rebuilt

Closed:

- rebuild the `v2026.4.9` steady-state `pre` baseline after the live upgrade

What happened:

- the first post-upgrade `pre` rerun temporarily failed because benben had one newly discovered, unreconciled feishu group session:
  - `55d8bf0f-61dc-45a2-a6e1-633a095c90a6`
- that session was reviewed via the existing rule path and correctly discarded as:
  - `short_or_low_signal_session`
- after reconciliation:
  - `session_review.pending_reconcile_count=0`
  - `memory-health-summary.overall_status=healthy`

Latest steady-state evidence:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.json`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.md`

Current state:

- decision:
  - `baseline_ready`
- implication:
  - future drift compares can now use a post-upgrade steady-state baseline instead of the older pre-upgrade `20260410-133541Z` snapshot

### 2026-04-11 follow-up 17: transient lightweight session-review backlog is now auto-cleared by benben healthcheck

Closed:

- reduce the chance that a trivial new benben session temporarily flips `session_review.status=attention`

What changed:

- `session-memory-review.mjs` now supports:
  - `--reconcile-lightweight`
- `openclaw-healthcheck.sh` now best-effort calls that mode before heartbeat refresh

Guardrails:

- only lightweight sessions are eligible
- if rule capture is available, the helper can still auto-capture obvious current-state signals
- if a short session contains likely durable/model-sensitive markers such as:
  - communication boundary
  - shared plan
  - anniversary
  - long-term preference / planning
  it is intentionally left for the normal model-backed review flow
- reconcile failure/timeouts do not fail healthcheck; they only emit a warning and heartbeat still runs

Live outcome:

- no new timer/service was added
- `openclaw-healthcheck.timer` remains the only minute-level path
- current benben truth after rollout:
  - `memory-health-summary.overall_status=healthy`
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`

Implication:

- trivial low-signal session backlog should now self-clear quickly
- future session-review alerts are more likely to correspond to genuinely richer sessions that still need model review, rather than harmless one-line banter

### 2026-04-11 follow-up 18: session-review health telemetry now distinguishes lightweight backlog from model-review backlog

Closed:

- expose the new lightweight reconcile path in health telemetry so operators can tell whether a pending backlog is trivial or genuinely richer

What changed:

- `session-memory-review-status.json` now includes a `lightweight_reconcile` block with:
  - last run timestamps/status
  - attempt/success counters
  - last pending/candidate/skipped/reviewed counts
  - fast-track reasons
  - skip reasons
- `memory-health-summary` now surfaces:
  - `lightweight_reconcile.pending_candidate_count`
  - `lightweight_reconcile.pending_skipped_count`
  - `lightweight_reconcile.pending_skip_reasons`

Operational meaning:

- if `pending_reconcile_count > 0` and `pending_candidate_count > 0`
  - the minute-level lightweight path should be able to eat at least part of that backlog quickly
- if `pending_reconcile_count > 0` but `pending_candidate_count = 0`
  - the remaining sessions are probably richer/model-sensitive and should be left to the normal review path

Live state after rollout:

- benben `session-memory-review-status.json` now records:
  - `lightweight_reconcile.last_status=lightweight_reconcile_complete`
  - `lightweight_reconcile.total_attempts=1`
- benben `memory-health-summary` currently shows:
  - `pending_reconcile_count=0`
  - `lightweight_reconcile.pending_candidate_count=0`
  - `lightweight_reconcile.pending_skipped_count=0`
  - `overall_status=healthy`

### 2026-04-11 follow-up 19: operator dashboard now understands lightweight vs model-review session backlog

Closed:

- wire the new lightweight session-review telemetry into the main operator dashboard so triage no longer requires reading raw status files

What changed:

- `memory-ops-dashboard` now consumes `health.session_review.lightweight_reconcile`
- dashboard output now shows:
  - total pending reconcile count
  - lightweight-eligible pending count
  - model-review pending count
  - latest lightweight reconcile status/reviewed/skipped counts
  - fast-track reasons and pending skip reasons
- operator action hints now split cleanly:
  - lightweight-only backlog -> suggest `session-memory-review --reconcile-lightweight --json`
  - model-review/retry backlog -> keep `--reconcile-missed --json`
  - lightweight-only backlog does not add `session-memory-review-selfcheck`

Live truth:

- benben live `memory-ops-dashboard.md` currently shows:
  - `session review pending reconcile: 0 (lightweight=0, model_review=0)`
  - `session review lightweight reconcile: last status lightweight_reconcile_complete; reviewed=0; skipped=0; pending_eligible=0; pending_model_review=0`
- benben live `memory-ops-dashboard.json` currently reports:
  - `overall=healthy`
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`
  - `lightweight_reconcile.pending_candidate_count=0`
  - `lightweight_reconcile.pending_skipped_count=0`
- current operator actions remain low-noise:
  - only stable-trim apply is pending on the live dashboard

### 2026-04-11 follow-up 20: stable-trim no longer treats verified cache files as canonical trim work

Closed:

- remove the last dashboard operator action that was caused by `.verified.md` cache inflation instead of real canonical stable-file trim debt

What changed:

- `stable-usage-trim-review` now:
  - excludes `.verified.md` files from `listStableFiles()`
  - remaps observed scope hits on `.verified.md` back to canonical `.md` source paths
- this keeps stable-trim decisions aligned with durable source memory instead of transient verified cache companions

Live truth:

- benben live `memory-ops-dashboard.json` now shows:
  - `operator_actions=[]`
  - `stable_trim.recommendation_count=0`
  - `stable_trim.applyable_items=0`
  - `stable_trim.manual_review_items=0`
- benben live `memory-ops-dashboard.md` now shows:
  - `Stable Trim -> recommendations: 0`

Operational meaning:

- if stable-trim resurfaces later, it should now correspond to real source-memory cleanup work, not a temporary verified-cache side effect

### 2026-04-11 follow-up 21: human-readable status surface now matches session-review backlog contract

Closed:

- bring `memory-status-human` up to the same session-review vocabulary as health summary and ops dashboard

What changed:

- `memory-status-human` now renders:
  - `Session review: <status>; pending_reconcile=N (lightweight=X, model_review=Y); pending_retry=Z`
  - `Session review lightweight reconcile: <last_status>`
  - `Session review lightweight fast-track reasons`
  - `Session review lightweight pending skip reasons`
- `memory-status-human-state.json` now stores the corresponding structured `session_review` block
- the existing event-mode test was date-hardened so it no longer fails once a fixed historical working entry passes soft TTL

Live truth:

- benben live `memory-status-human.md` now shows:
  - `Session review: healthy; pending_reconcile=0 (lightweight=0, model_review=0); pending_retry=0`
  - `Session review lightweight reconcile: lightweight_reconcile_complete`
  - `Session review lightweight fast-track reasons: none`
  - `Session review lightweight pending skip reasons: none`
- benben live `memory-status-human-state.json` now reports:
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`
  - `pending_retry_count=0`
  - `lightweight_reconcile.pending_candidate_count=0`
  - `lightweight_reconcile.pending_skipped_count=0`

Operational meaning:

- operators no longer need to switch to health-summary/dashboard just to understand whether session-review backlog is trivial, model-sensitive, or absent

### 2026-04-11 follow-up 22: upgrade impact assessment now uses session-review backlog shape instead of flat pending count

Closed:

- bring `openclaw-upgrade-impact-assess` onto the same session-review contract as health summary / dashboard / human status

What changed:

- benben section of the upgrade assessment now records:
  - `session_review.pending_reconcile_count`
  - `session_review.pending_retry_count`
  - `session_review.lightweight_pending_count`
  - `session_review.model_review_pending_count`
  - `session_review.lightweight_only`
  - `session_review.health_gate_ok`
  - `session_review.health_gate_reason`
- pre/post decision logic now treats:
  - lightweight-only backlog as warning-only
  - model-review or retry backlog as blocker
- markdown report now shows:
  - `health gate: ok|blocked (...)`
  - `session_review: ... pending_reconcile=N (lightweight=X, model_review=Y); pending_retry=Z`

Latest formal verification:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.{md,json}`
- result:
  - `decision=baseline_ready`
  - `health gate: ok (healthy)`
  - `session_review: healthy; pending_reconcile=0 (lightweight=0, model_review=0); pending_retry=0`

Operational meaning:

- upgrade gating can now distinguish:
  - transient lightweight backlog that should self-clear
  - versus real unresolved session-review debt that should stop rollout

### 2026-04-11 follow-up 23: outward weekly review messaging now matches session-review backlog contract

Closed:

- bring the weekly memory-review sender onto the same session-review vocabulary as the local operator surfaces

What changed:

- `memory-review-send.py` weekly payload now carries:
  - `session_review_lightweight_pending_count`
  - `session_review_model_review_pending_count`
  - `session_review_lightweight_last_status`
  - `session_review_lightweight_fast_track_reasons`
  - `session_review_lightweight_pending_skip_reasons`
- weekly render now prints:
  - ``/new` 漏复核会话：当前 N 个（轻量可自动清 X 个，需模型复核 Y 个）``
  - ``/new` 轻量复核状态：...``
  - and, only when backlog exists, a dedicated `会话复核 backlog 分层` explanation block

Live truth:

- benben live `memory-weekly-review.md` now shows:
  - ``/new` 漏复核会话：当前 0 个（轻量可自动清 0 个，需模型复核 0 个）``
  - ``/new` 轻量复核状态：lightweight_reconcile_complete``
- current live weekly dry-run had zero backlog, so no backlog detail section was needed

Operational meaning:

- if session-review debt returns later, outbound weekly review messages will now say whether it is:
  - trivial minute-level cleanup
  - or real model-review debt

### 2026-04-11 follow-up 24: session-review KPI semantics now distinguish outcomes from attempts

Closed:

- remove the semantic bug where benben session-review 24h/7d capture and retry KPIs counted every retry attempt instead of latest per-session outcome
- remove the operator drift where `memory-status-human` could disagree with the persisted `memory-health-summary`

What changed:

- `memory-health-summary.mjs` now computes session-review capture efficiency from the latest user-facing record per `session_id` within each window
- raw process cost is preserved separately as `review_attempts`
- `memory-status-human.mjs` now consumes the persisted `memory-health-summary.json` snapshot when present
- operator text now renders capture efficiency as `attempts + captured + retry_rate`, not just rates

Live truth:

- benben live 7d session-review efficiency is now:
  - `review_attempts=21`
  - `reviewed_sessions=16`
  - `captured_sessions=3`
  - `retry_recommended=4`
  - `capture_rate=0.19`
  - `retry_rate=0.25`
- `memory-status-human` and `memory-health-summary` now both report `overall_status=healthy`

Operational meaning:

- future capture/retry tuning can now reason about two separate axes:
  - session outcome quality
  - review attempt cost

### 2026-04-11 follow-up 25: session-review observability no longer depends on surviving session files

Closed:

- retain bounded transcript evidence inside the session-review log so later rule tuning can inspect skipped/retried cases after session files rotate away

What changed:

- each session-review log record now stores:
  - `transcript_preview_excerpt`
  - `user_line_preview`
- this does not change review decisions; it only preserves enough debugging context for later capture tuning

Operational meaning:

- the next pass on benben capture-rate improvements can work from review-log evidence directly, instead of depending on the original `agents/*/sessions/*.jsonl` files still being present

### 2026-04-11 follow-up 26: short durable rule coverage now includes couple plans and anniversary reminders

Closed:

- expand benben lightweight rule rescue beyond current-state and personal-anchor cases

What changed:

- `session-memory-review.mjs` now rescues:
  - explicit couple `shared_plan` logistics
  - explicit couple `anniversary` reminder rules
- both feed the existing `durable_rule_capture_available` fast-track path

Live smoke truth:

- `我们五一一起去上海，这周先看预算和高铁票。` -> `couple / recent / shared_plan`
- `恋爱纪念日提前一周提醒我，当天也提醒。` -> `couple / stable / anniversary`

Operational meaning:

- the next capture-rate tuning round can move on from “missing obvious short joint plan/timepoint rules” and focus on the harder remaining misses

### 2026-04-11 follow-up 27: couple stable-rule rescue now covers the main low-ambiguity classes

Closed:

- expand benben short durable rule rescue from plans/timepoints into shared norms and repair sequences

What changed:

- explicit couple `decision_preference` lines now rescue into stable memory
- explicit couple `repair_pattern` lines now rescue into stable memory
- `shared_plan` rescue no longer steals long-term budget/shared-norm lines

Live smoke truth:

- `以后我们见面和出游都按学生预算来，别冲动花钱。` -> `couple / stable / decision_preference`
- `以后我们有摩擦先安抚，再复盘，不要上来争对错。` -> `couple / stable / repair_pattern`

Operational meaning:

- the remaining capture-rate gap is now less about “obvious one-line couple rules” and more about ambiguous, mixed, or multi-line sessions that still need model review

### 2026-04-11 follow-up 28: explicit one-line durable couple rules are now mostly covered

Closed:

- add the last obvious couple stable-rule rescues for `communication_style` and `boundary`

What changed:

- explicit couple communication-style lines now rescue into stable memory
- explicit couple boundary/harm-rule lines now rescue into stable memory
- durable boundary rules that mention `玩笑 / 角色扮演` are now allowed, while actual playful roleplay chatter is still filtered

Live smoke truth:

- `以后我们表达要真诚、细腻，最好带共同经历和故事线。` -> `couple / stable / communication_style`
- `以后不要把临时玩笑或角色扮演当长期规则，这样很容易误判。` -> `couple / stable / boundary`

Operational meaning:

- benben’s next capture-rate gains will have to come from ambiguous or mixed sessions, not from missing obvious one-line couple durable rules

### 2026-04-11 follow-up 29: session-review opportunity surface is now wired into benben operator views

Closed:

- derive a bounded “what should we tune next” surface from persisted session-review previews instead of reading raw transcript files ad hoc

What changed:

- `memory-health-summary` now exposes `session_review.opportunity_summary`
- current bucket set is intentionally narrow:
  - `transport_retry`
  - `mixed_current_state`
  - `durable_multiline`
- `memory-ops-dashboard` and `memory-status-human` now render the same opportunity counts and sample sessions
- sample rendering degrades gracefully for pre-preview legacy logs by showing `session <id>`

Current live truth:

- benben `overall_status=healthy`
- `session_review.opportunity_summary.last_7d.total_count=8`
- current live 7d opportunities are entirely `transport_retry`
- there are no live `mixed_current_state` or `durable_multiline` opportunities in the current 7d window

Operational meaning:

- the operator bottleneck has shifted from “unknown skip/retry backlog” to a clearly bounded retry cohort
- the next meaningful step is not more summary work; it is reducing or aging out the legacy transport-retry tail so semantic opportunity buckets become visible in live data

### 2026-04-11 follow-up 30: historical retry tail no longer pollutes current opportunity counts

Closed:

- separate actionable `transport_retry` from historical non-actionable retry records

What changed:

- session-review opportunity windows now only count `transport_retry` when the session is still pending retry
- non-actionable retry records are exposed as `historical_transport_retry_tail`
- dashboard/human/operator views now show both:
  - current actionable opportunities
  - historical retry tail

Current live truth:

- benben actionable opportunity window is now zeroed:
  - `total=0`
  - `transport_retry=0`
  - `mixed_current_state=0`
  - `durable_multiline=0`
- historical retry tail remains:
  - `historical_transport_retry_tail_count=8`
  - reasons: `gateway_transport_error`, `missing_api_key`, `fetch_error`, `http_error`

Operational meaning:

- the operator view is now honest about “what can be tuned now” versus “what is just old evidence”
- if we continue, the next step is no longer summary cleanup; it is deciding whether to compact/age out historical retry tail from KPI windows or to build a dedicated retry-tail audit tool

### 2026-04-11 follow-up 31: retry-tail audit tool is now the dedicated path for historical retry investigation

Closed:

- build a dedicated operator/debug path for historical session-review retry tail

What changed:

- new tool: `session-review-retry-tail-audit.mjs`
- new CLI entry:
  - `openclaw memory-ops retry-tail-audit --json`
- `memory-ops-dashboard` now records a dedicated `retry_tail_audit` section with:
  - `historical_tail_count`
  - `pending_retry_count`
  - `latest_retry_count`
  - `top_reasons`
  - report paths
- audit logic now matches health summary’s latest-distinct-session semantics and ignores synthetic `tmp-*` sessions

Current live truth:

- `retry_tail_audit.historical_tail_count=8`
- `pending_retry_count=0`
- top reasons:
  - `gateway_transport_error x3`
  - `missing_api_key x3`
  - `fetch_error x1`
  - `http_error x1`
- operator action now exposes `openclaw memory-ops retry-tail-audit --json`

Operational meaning:

- this line is now structurally complete:
  - health/dashboard/human status hold the high-level truth
  - retry-tail audit holds the drill-down
- the next step, if we continue, is no longer tooling. It is policy:
  - either age out this historical retry tail from daily operator focus
  - or explicitly burn it down as one-time operational debt

### 2026-04-11 follow-up 32: historical retry tail has been explicitly retired as one-time debt

Closed:

- burn down the 8-session historical retry tail instead of carrying it in daily operator surfaces

What changed:

- added retry-tail retirement support:
  - `openclaw memory-ops retry-tail-audit --retire-current --retire-note <text> --json`
- retirement is now durable:
  - retired session ids and metadata land in `session-review-retry-tail-retired.json`
  - every retirement event lands in `session-review-retry-tail-retired.jsonl`
- health/operator surfaces now honor the retired set and exclude it from current KPI windows

Current live truth:

- `retired_count=8`
- `session_review.opportunity_summary.last_7d.total_count=0`
- `historical_transport_retry_tail_count=0`
- `retry_tail_audit.historical_tail_count=0`
- `overall_status=healthy`

Operational meaning:

- retry-tail debt is no longer an open operator concern
- if we revisit those sessions later, it should be through the retired-state/log audit trail, not daily health views

### 2026-04-11 follow-up 33: retired retry-tail debt is now summarized in operator surfaces as audit-only context

Closed:

- avoid the binary choice between “hidden in raw json” and “reopened as active operator task”

What changed:

- retry-tail audit now publishes retained audit fields for retired debt:
  - latest retirement timestamp
  - top retired reasons
  - retired samples
- dashboard and human status now render retired retry debt as audit context only
- operator actions are still gated only by active retry-tail debt, not retired debt

Current live truth:

- `historical_tail_count=0`
- `retired_session_count=8`
- `retired_latest_at=2026-04-11T12:46:04.618Z`
- retired debt remains attributable to:
  - `gateway_transport_error`
  - `missing_api_key`
  - `fetch_error`
  - `http_error`

Operational meaning:

- the retry-tail line is now fully closed from a tooling perspective
- any remaining operator actions after this point should be treated as fresh session-review work, not retry-tail debt reopening

### 2026-04-11 follow-up 34: the remaining benben operator actions were stale report state, not live backlog

Closed:

- verify and clear the last two benben operator actions after retry-tail retirement

What changed:

- reran live session-review reconcile, session-review selfcheck, health summary, ops dashboard, and human status
- confirmed the visible actions were stale report state, not unresolved review debt

Current live truth:

- `session_review.status=healthy`
- `pending_reconcile_count=0`
- `pending_retry_count=0`
- `session-memory-review-selfcheck.ok=true`
- `memory-ops-dashboard.operator_actions=[]`

Operational meaning:

- benben currently has no remaining operator action on this line
- if new actions appear later, they should be treated as fresh live backlog rather than leftovers from the retired retry tail or stale report generation

### 2026-04-11 follow-up 35: adminAI portability baseline has been resynced to the current live `pi-embedded` bundle

Closed:

- remove the remaining `patched_drifted` portability ambiguity on adminAI after the live `pi-embedded` bundle picked up extra shared drift

What changed:

- replaced the managed `v2026.4.9` patched snapshot with the current live `pi-embedded-Vw-lS5ti.js`
- regenerated the matching patch file and manifest
- resynced those artifacts to adminAI live workspace
- refreshed runtime-guard documentation and dual-instance scorecard

Current live truth:

- `verify_state=already_patched`
- `patched_match=true`
- `markers_ok=true`
- `portability_ready=true`
- `openclaw-dual-instance-scorecard` now reports `adminai_verify_state=already_patched`

Operational meaning:

- adminAI’s remaining portability risk is back to “future upstream/live drift may happen again”, not “current baseline is already stale”
- the dual-instance operator view is again aligned with the actual runtime guard state

### 2026-04-11 follow-up 36: mixed durable couple rescue is now live on benben

Closed:

- the next `session_capture_rate` gap after single-line durable rescue: one-line mixed couple signals that carry both a current shared state and a durable shared rule

What changed:

- `session-memory-review.mjs` now extracts the durable clause from mixed lines instead of forcing a binary choice
- current behavior is:
  - keep the full line as `current_state`
  - rescue the durable clause as `decision_preference` or `repair_pattern`
- augmentation de-dup is stricter, so rule rescue no longer inflates already-covered model outputs

Validated:

- full local `session-memory-review.test.mjs` is green
- related operator regressions in `memory-phase1.test.mjs` are green
- benben live isolated smoke confirms:
  - mixed budget-pressure + long-term norm -> `current_state + decision_preference`
  - mixed relationship tension + repair norm -> `current_state + repair_pattern`

Remaining next step on this line:

- watch whether real live `capture_rate_7d` moves after organic traffic; if it does not, the next worthwhile target is no longer one-line rescue but multi-line/multi-turn durable synthesis

### 2026-04-11 follow-up 37: adjacent-line multiline durable synthesis is now live on benben

Closed:

- the first multi-line `session_capture_rate` gap after mixed one-line rescue: adjacent user lines where the durable rule is split across two short messages

What changed:

- `session-memory-review.mjs` now has an adjacent-line durable fallback for couple rules
- it only activates when single-line rescue is incomplete
- current live-covered pair cases:
  - split `decision_preference`
  - split `repair_pattern`
- pure current constraint lines like `我们最近预算有点紧。` no longer leak into `shared_plan`

Validated:

- full local session-review test file is green
- related operator regressions remain green
- benben live isolated smoke confirms both adjacent-line rescue paths work as intended

Remaining next step on this line:

- if `capture_rate_7d` still does not move after organic traffic, the remaining high-value gap is no longer adjacent multiline rescue but true multi-turn synthesis where the durable rule depends on conversational accumulation rather than two neighboring lines

### 2026-04-11 follow-up 38: the common three-turn `current + split durable` shape is now live on benben

Closed:

- the common short multi-turn gap after adjacent multiline rescue: user first states the current couple state, then unfolds the durable rule across the next two user lines

What changed:

- `session-memory-review.mjs` now extends clearly truncated durable clauses with the next user line when that continuation yields the same durable family
- current live-covered shapes now include:
  - one-line mixed rescue
  - adjacent split durable rescue
  - three-turn `current_state + split durable rule`

Validated:

- full local session-review tests are green
- operator regressions remain green
- benben live isolated smoke confirms both three-turn `decision_preference` and `repair_pattern` paths

Remaining next step on this line:

- if `capture_rate_7d` still stays flat after organic traffic, the next worthwhile target is no longer split-clause rescue at all, but broader multi-turn synthesis where no single durable clause exists until several turns are interpreted together

### 2026-04-11 follow-up 39: shared zh runtime patch safety is re-closed; the next blocker is benben live health, not adminAI portability

Closed:

- adminAI re-regression caused by the shared `zh runtime patch` mutating shared dist bundles after the earlier `pi-embedded` portability baseline was already green
- the concrete shared-runtime parse break on `extensions/memory-core/index.js`

What changed:

- the shared runtime patch ruleset now explicitly retires the `pi-embedded` match path / glob in source-of-truth
- the `memory-core` zh rule keeps valid JS syntax (`withFileTypes`) while preserving the phase1 cutover injection
- NAS live rules were resynced, shared `memory-core/index.js` was restored from managed baseline, and only `openclaw-adminai-gateway.service` was restarted

Validated:

- adminAI is back to the intended guarded state:
  - `verify_state=already_patched`
  - `transport_canary.ok=true`
  - `policy_probe.ok=true`
  - `policy_only_gate.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`
- dual-instance scorecard is again constrained only by benben, not by adminAI portability drift

Important truth split:

- `24h + fixture preview` is validated only for the benben capture-uplift path:
  - `fixture_passed_cases=5/5`
  - combined preview `session_capture_rate=0.75`
  - combined preview `captured_from_rule_lightweight=5`
  - combined preview `retry_recommended_rate=0`
  - preview `capture_uplift_gate.ready=true`
- `7d live` is still not closed:
  - benben `session_capture_rate_7d=0.18`
  - benben `captured_from_rule_lightweight_7d=0`

New blocker discovered while refreshing live truth:

- benben’s persisted `memory-health-summary.json` is no longer the earlier `healthy` snapshot
- as of `2026-04-11T22:15:07.544Z`, the live summary now says:
  - `overall_status=attention`
  - `issues=[\"2 rolled sessions missed auto review (lightweight=0, model_review=2)\"]`
- because scorecard correctness/operability still consume that live health layer, the current preview score remains `8.7`, not `>= 9.3`, even though the isolated `24h + fixture` capture-uplift preview itself is green

Remaining next step:

- treat the next task as benben live health cleanup plus real 7d capture uplift, not more adminAI work
- specifically:
  - clear the two rolled sessions missed auto review
  - keep driving real `captured_from_rule_lightweight_7d`
  - then rerun `memory-health-summary` and `openclaw-dual-instance-scorecard` to see whether `overall_status` returns from `attention` to `healthy`

### 2026-04-11 follow-up 40: benben live health cleanup is now closed; only 7d live capture uplift remains

Closed:

- the temporary benben live-health blocker discovered during scorecard refresh:
  - `2 rolled sessions missed auto review`

What changed:

- traced the two pending sessions to:
  - `41c4dadc-048e-498c-b07b-6e30b4030db7`
  - `22ee625b-41a4-4586-9e06-1cceadb813a5`
- confirmed both were cron maintenance transcripts about email/calendar巡检 and `porteden` permission failures
- reconciled them live with:
  - `session-memory-review.mjs --reconcile-missed --force-rule --json`
- both were correctly discarded as ops-only noise; no memory candidates were written

Validated:

- benben pending review backlog is now empty
- refreshed benben health summary now reports:
  - `overall_status=healthy`
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`
- sequentially refreshed dual-instance scorecard now reads the new health summary instead of the stale `attention` snapshot

Truth split after this cleanup:

- `24h + fixture preview` is now formally closed:
  - `benben=10 / adminAI=10 / overall=10`
  - `fixture_passed_cases=5/5`
  - `capture_uplift_gate.ready=true`
- `7d live` is not closed yet:
  - `benben=9.1 / adminAI=10 / overall=9.5`
  - remaining live gaps are still only:
    - `session_capture_rate_7d=0.16`
    - `captured_from_rule_lightweight_7d=0`

Remaining next step:

- stop treating health-state cleanup or adminAI portability as active work
- focus only on benben organic 7d uplift:
  - increase real `captured_from_rule_lightweight_7d`
  - let `session_capture_rate_7d` recover through live traffic
  - keep the current hard constraints unchanged while observing the next live window

### 2026-04-12 follow-up 41: separate strict 7d live truth from preview-only memory-core readiness

Closed:

- the lingering live-truth ambiguity where benben `7d live` still counted:
  - synthetic `tmp-*` session-review fixtures
  - `agent:main:cron:*` maintenance transcripts
- the preview ambiguity where a non-memory Telegram channel canary outage still dragged the `24h + fixture` score below `9.3`

Architecture updates:

- `session-memory-review.mjs`
  - `isUserFacingSessionRecord(...)` now excludes:
    - `tmp-*` session ids
    - synthetic `.../tmp/session-review-*.jsonl` transcripts
    - `agent:main:cron:*` maintenance sessions
  - this tighter filter automatically propagates into:
    - `memory-health-summary.mjs`
    - `openclaw-dual-instance-scorecard.mjs`
- `openclaw-dual-instance-scorecard.mjs`
  - preview mode now exposes:
    - `health_scope`
    - `ignored_external_blockers`
  - preview is allowed to ignore `channel_canary` only when:
    - fixture uplift gate is ready
    - `memory_v2_eval` is fully green
    - `owner_private_current` is green
    - session review is not stale
    - the only live health issue is channel canary attention

Current truth split:

- strict `7d live` as of `2026-04-12T02:47:15.813Z`:
  - `benben=7 / adminAI=10 / overall=8.2`
  - benben true live capture metrics:
    - `reviewed_sessions_7d=14`
    - `captured_sessions_7d=1`
    - `session_capture_rate_7d=0.07`
    - `captured_from_rule_lightweight_7d=0`
  - live gaps remain:
    - `benben_session_capture_rate_7d_below_target`
    - `benben_rule_lightweight_capture_7d_below_target`
- preview-only `24h + fixture` as of `2026-04-12T02:47:15.813Z`:
  - `benben=10 / adminAI=10 / overall=10`
  - `health_scope=memory_core_plus_24h_fixture`
  - `ignored_external_blockers=["channel_canary"]`
  - `fixture_passed_cases=5/5`
  - combined preview gate:
    - `session_capture_rate=0.75`
    - `captured_from_rule_lightweight=5`
    - `retry_recommended_rate=0`
    - `capture_uplift_gate.ready=true`

Important operational reading:

- do not read `preview=10` as “7d live is healthy again”
- preview now means:
  - memory-core uplift path is ready
  - fixture + 24h projection are green
  - the only ignored blocker is an explicitly surfaced external channel canary outage
- live remains the only source for deciding whether benben organic capture uplift has truly converged

Remaining next steps:

- keep adminAI portability and runtime isolation frozen; they are not the active bottleneck
- treat Telegram canary outage as a separate transport/network incident, not a reason to reopen memory-core design
- continue only on benben live uplift:
  - find new real user-facing sessions that should enter `rule_lightweight_capture`
  - let `captured_from_rule_lightweight_7d` and `session_capture_rate_7d` climb through genuine traffic
  - maintain the current preview-vs-live split in all future status reporting

### 2026-04-12 follow-up 42: NAS Telegram transport incident is closed; keep the signal-bridge fix as infrastructure, not memory-core work

Closed:

- the open benben Telegram canary transport incident

Architecture reading:

- the root bug was not “Telegram exit path completely unreachable”
- the material failure point was the Telegram runtime’s custom fetch compatibility:
  - grammY custom fetch passed a foreign `AbortSignal`
  - OpenClaw Telegram proxy path forwarded that into `undici.fetch`
  - `undici.fetch` rejected the signal before the proxied send could complete
- therefore the incident belonged to:
  - runtime transport compatibility
  - gateway / CLI environment parity
- it did not belong to:
  - benben memory-core retrieval design
  - session-review correctness
  - adminAI portability

Architecture decision now in effect:

- keep benben Telegram delivery on the local HTTP bridge path:
  - `http://127.0.0.1:18988`
- keep the fetch signal-bridge logic in the benben runtime hook:
  - `/etc/openclaw/global-proxy-hook.cjs`
- keep benben CLI / cron / tool invocations aligned with gateway runtime by exporting from `/etc/openclaw/gateway.env`:
  - `NODE_OPTIONS=--require=/etc/openclaw/global-proxy-hook.cjs`
  - `HTTP_PROXY / HTTPS_PROXY / ALL_PROXY`
  - `NO_PROXY` with Feishu/Lark bypasses

Guardrails:

- do not reopen Telegram transport work unless canary regresses again under the current hook + gateway env pairing
- do not reintroduce the earlier direct-SOCKS-for-all hook behavior; it is not needed for benben health recovery
- do not treat future benben score drag as a transport issue unless:
  - `channel-delivery-canary-state.json` regresses
  - `memory-health-summary.channel_canary.status` regresses from `healthy`

Remaining next steps:

- keep transport work closed and frozen
- continue only on the true remaining benben `7d live` uplift:
  - raise `session_capture_rate_7d`
  - raise `captured_from_rule_lightweight_7d`
  - keep retry rates at the current corrected zero-debt truth

### 2026-04-12 follow-up 43: benben current-state fast path now recognizes sender-backed short grievance in group chat, but the remaining live misses should stay unpromoted

Closed in this pass:

- one concrete benben live miss now lands through deterministic `rule_lightweight_capture` instead of falling through model discard

Architecture truth after the change:

- `session-memory-review.mjs` now has one extra current-state fast-path shape:
  - partner sender metadata is present in the transcript
  - the content is a short recent grievance like `今天cc没有说爱我`
  - the extracted memory is shared `partner current_state`
  - the canonical statement becomes:
    - `伴侣今天因为没听到“爱你”而有点委屈，宜先安抚再回应。`
- this is intentionally narrower than a general “any short emotional line counts” policy:
  - sender evidence is required
  - recent/short grievance shape is required
  - roleplay / hypothetical / sexual / long-term wording still blocks capture
- this changes benben memory-core capture coverage only
- it does not change:
  - fallback order
  - `memory_v2` authority
  - historical sidecar mode
  - adminAI runtime or schema isolation

Important rerun rule learned from this pass:

- historical group reset transcripts may later accumulate unrelated turns
- if a known live miss needs controlled rerun, do not replay the whole `.jsonl.reset.*` file blindly
- instead, slice the original relevant user/assistant pair and rerun that pair against the same `session_id`
- this is now the safe operational pattern for correcting one historical session-review verdict without overclassifying later appended chatter

What this proved on live benben:

- recovered session:
  - `55d8bf0f-61dc-45a2-a6e1-633a095c90a6`
- after controlled rerun:
  - `captured_from_rule_lightweight_7d` rose from `0` to `1`
  - `session_capture_rate_7d` rose from `0.07` to `0.13`
- but the remaining live misses that were inspected in the same pass were correctly left alone:
  - `65fcfa75-9a53-4990-937d-3123ff683be8` is `亲亲 -> NO_REPLY`
  - `e35bfb58-7f98-4d7d-ba80-9ca335974c5e` is startup/reset noise
  - `8168da32-f2b2-413b-9cfe-60b8b53bfc8f` is playful group banter

Architecture decision now in effect:

- do not widen current-state fast path just to absorb playful or low-value chatter
- future rule expansion must continue to be driven by real live misses with explicit support value, not by target-chasing
- the current truthful status split remains:
  - `24h + fixture preview` is green
  - `7d live` is improved but still below target

Remaining next steps:

- wait for more genuine benben traffic
- only add new fast-path shapes when a real missed session demonstrates recurring support value
- keep reporting `preview` and `7d live` separately until live traffic itself closes the remaining gap

### 2026-04-12 follow-up 44: owner short-lived current signals must not hide owner historical shareable current anchors

Closed in this pass:

- benben owner exam-stress fast path was kept
- the resulting `owner_private_current` correctness regression was removed at the projection layer instead of disabling the live capture

Architecture decision now in effect:

- for owner private self-state retrieval, short-lived `current_state` signals are allowed to appear
- but they must not fully suppress the historical shareable current anchors that still answer:
  - `你记得我最近在忙什么吗？`
- therefore `memory_v2/projections/owner-current.md` now keeps:
  - `current_state`
  - `recent_context`
  - `last_shareable_evidence`
  at the same time when all three are relevant

Why this change is correct:

- the new live miss `9094f61d-b0c7-4560-a234-43966ba91a79` is a genuine benben support signal and should stay captured
- the earlier projection behavior treated any owner current/recent signal as reason to hide `last_shareable_evidence`
- that caused `owner_private_current` to answer only the short-lived exam stress and drop the still-valid owner current anchors:
  - `港校授课型硕士申请`
  - `GPA、雅思`
- the fix preserves both truths:
  - the short-lived current distress remains available
  - the medium-horizon owner current mainline remains retrievable

Guardrails:

- do not widen owner current projection into a generic “dump all owner evidence” surface
- only keep deduped `last_shareable_evidence` entries alongside current/recent context
- do not remove the rule-lightweight owner exam-stress capture just to make scorecard green
- keep fallback order unchanged and keep `memory_v2` as benben’s only truth layer

Operational rule learned:

- when a new owner current fast path is introduced, always recheck:
  - `memory-v2-eval`
  - `owner_private_current`
  - `memory-health-summary`
  - `openclaw-dual-instance-scorecard`
- if the new current signal degrades `owner_private_current`, first prefer projection-level coexistence with historical shareable evidence over deleting the new live capture

Remaining next steps:

- continue only on the true remaining benben live gap:
  - raise `session_capture_rate_7d`
- do not revisit adminAI, Telegram transport, retry-tail debt, or fallback ordering unless a new regression appears

### 2026-04-12 follow-up 45: session review metrics must exclude operator / QA traffic, and owner personal fast paths may resolve subject from group sender metadata

Closed in this pass:

- benben `7d live` was brought from score-closed-but-not-green to fully green
- the remaining gap was not solved by changing fallback order or broadening adminAI scope
- it was solved by:
  - capturing one real owner warmth-concern signal from a group transcript
  - removing clear non-conversational operator / QA sessions from the live capture denominator

Architecture decision now in effect:

- session review capture-rate metrics must count only conversational memory opportunities
- the following must stay out of the benben `7d live` denominator when they produce no user-facing memory signal:
  - assistant-only canary output
  - `/new` startup bootstrap-only sessions
  - HEARTBEAT operator loops
  - explicit recall-probe / memory-echo validation sessions
- when old review logs do not include preview fields, health summary must recover the transcript from:
  - `session_file` if it still exists
  - otherwise the latest transcript matching the same `session_id`

Personal fast-path rule learned:

- group transcripts are allowed to emit owner / partner personal current-state captures when the sender can be resolved from message metadata
- this should stay narrow:
  - only when sender resolution is confident
  - only for explicit, support-relevant state
  - not for generic playful banter

Guardrails:

- do not treat raw `agent:main:main` as automatically operator-only or user-only; inspect transcript type
- do not exclude real conversational misses from the denominator just because they are low-signal
- do not force rule-lightweight counts upward by relabeling model-rule-rescue captures
- keep benben on `memory_v2` as the sole truth layer, with fallback order unchanged

Current truthful status split:

- `24h + fixture preview` is green
- `7d live` is now also green
- future work, if any, should be new uplift or regression response, not more denominator cleanup on this closed batch

### 2026-04-12 follow-up 46: do not assume “gateway up + websocket ready + canary green” means incoming chat dispatch is healthy

Architecture lesson:

- shared zh runtime patching can still break lazily loaded command/runtime bundles even when:
  - systemd service is `active`
  - Feishu websocket is `ready`
  - outgoing channel canary is green
- the concrete failing shape on live was:
  - incoming Feishu DM reached gateway
  - dispatch to `agent:main:main` began
  - lazy import of command/directive bundles exploded with syntax errors

Files that proved unsafe to keep in the shared zh patch ruleset:

- `commands-acp-*.js`
- `commands-status-*.js`
- `directive-handling.impl-*.js`

Guardrail now in effect:

- these shared lazy bundles should stay retired from the shared zh runtime patch rules unless they are regenerated from a verified clean orig/zh pair and revalidated with:
  - `node --check`
  - live `openclaw agent --agent main --message "/status" --json`
  - live natural-language `openclaw agent --agent main --message "请只回复OK，不要写别的。" --json`

Operational rule:

- if the symptom is:
  - real chat messages are received
  - but no reply is sent back
  - and logs show dispatch starts but dies before model execution
- check shared dist syntax first, before touching:
  - memory truth layers
  - scorecard / summary plumbing
  - channel auth / transport

### 2026-04-12 follow-up 47: the remaining deployment-verify debt is now closed, but by baseline migration plus live route-guard repair, not by reviving legacy trace emission

Closed:

- `deployment-verify --with-smoke` no longer reports:
  - `session_route_guard_failed`
  - `recent_preflight_trace_missing`

Architectural resolution:

- `session_route_guard_failed`
  - root cause was real live drift:
    - shared package root still had an unpatched `/usr/lib/node_modules/openclaw/dist/store-Cgl8QMzI.js`
    - the post-upgrade doc state that this fix was already live had become stale
  - resolution:
    - deploy `workspace/tools/store-route-guard-cutover.mjs` to NAS
    - reapply the maintained route-preservation cutover on the shared `store-Cgl8QMzI.js`
    - restart both gateway services so the shared dist change is actually used
- `recent_preflight_trace_missing`
  - root cause was not a broken trace lookup key
  - root cause was baseline drift:
    - current post-`v2026.4.9` live truth surface is `dist/extensions/memory-core/index.js`
    - the old verify gate still treated legacy runtime `memory_recall` trace emission as mandatory
    - on current live, smoke answers are still grounded, but `traceObserved=false` and the legacy trace emitter is absent from the active surface
  - resolution:
    - deployment verify now distinguishes:
      - `legacy_runtime_trace`
      - `memory_core_truth_surface`
    - only the former keeps `recent_preflight_trace_missing` as a hard failure
    - the latter is now treated as:
      - `supported=false`
      - `skipped=true`
      - `reason=trace_baseline_migrated_to_memory_core`

Why this matters:

- this closes a false-negative deployment blocker without pretending that full trace parity still exists
- current steady-state interpretation is:
  - route-guard correctness is again a hard invariant and is live-restored
  - legacy `memory_recall` trace parity is not currently part of the post-`v2026.4.9` hard gate
  - if we want that observability layer back, it needs a deliberate future port onto the active `memory-core` search path

Current verified state:

- `deployment-verify --with-smoke --write-report` is green again
- route guard live verification is green again
- both gateway services are active again after the shared dist repair
- no sudoers / custom sudo permission changes were made

### 2026-04-12 follow-up 48: observability parity is now restored on the active memory-core surface, but the legacy preflight prefix is not

Closed in this pass:

- the active benben `memory-core` surface now emits live `memory_recall` trace events again
- `deployment-verify --with-smoke --write-report` is green with:
  - `baseline=memory_core_trace_surface`
  - `supported=true`
  - `skipped=false`
  - `failures=[]`

Architectural resolution:

- the old phase1 cutover on `dist/extensions/memory-core/index.js` had only restored:
  - explainability payloads
  - historical evidence plumbing
  - scoped memory shaping
- it had **not** restored:
  - trace helper loading
  - session-store-backed session id recovery
  - live `memory_recall` emission
  - scope observe reuse
- the maintained `memory-core-phase1-cutover.mjs` now upgrades both:
  - an unpatched candidate surface
  - an already phase1-patched surface
- deployment verify was also lagging the restored surface:
  - it still hard-bound success to legacy `preflight_memory_search_...` ids
  - current `memory-core` traces now carry the current `call_...|fc_...` tool-call shape instead
  - verify now treats the current surface as `memory_core_trace_surface` and validates the presence of real `memory_recall` events plus current trace schema fields, rather than the retired prefix convention

What remains intentionally different from the legacy runtime:

- current active traces still do not recreate the exact old `source_event_id=runId` / `tool_call_id=preflight_memory_search_...` coupling
- per-run smoke trace correlation therefore uses:
  - direct `runId` match when available
  - otherwise a bounded session/time-window fallback over current `memory_recall` events
- this is good enough for deployment gating and operator verification, but it is not bit-for-bit parity with the old runtime trace shape

Why this is acceptable now:

- the important invariant is back:
  - the active `memory-core` search path produces inspectable recall traces with grounded refs and scope metadata
- the exact legacy prefix format is no longer architecturally required for correctness
- deployment verify is green for the right reason:
  - live recall traces exist on the active surface
  - route guard remains repaired
  - both gateways are running the repaired shared package root

If we want full historical shape parity later:

- add a deliberate compatibility layer that maps current `memory_search` executions back onto the old `runId/preflight_memory_search_...` naming contract
- only do this if a downstream consumer still materially depends on that exact prefix convention; it is no longer needed for the current deployment gate

### 2026-04-12 follow-up 49: session recovery parity is now restored on the active transcript surface, and the remaining recovery debt is closed

Closed in this pass:

- `recovery_auto` is live again on the current shared package root
- the stale operator recovery conflict on `agent:main:main` is closed
- `deployment-verify --with-smoke --write-report --json` is green with both:
  - `recovery.ok=true`
  - `recovery_auto.ok=true`

Architectural resolution:

- the old continuity/runtime debt after follow-up 48 had two separate causes:
  - `deployment-verify` was still looking for runtime auto-recovery exports only in `sessions*.js`
  - `session-journal-latest.json` was stale and still pinned `agent:main:main` to historical session `68979494-78c5-42a4-9111-290221b026dd`
- on the current `v2026.4.9` live package, the active runtime surface is `dist/transcript-BdAYvPnf.js`, not a `sessions*.js` bundle
- this pass resolves the mismatch in two places:
  - `deployment-verify.mjs` now resolves the live auto-recovery bundle from `transcript-*.js` first, with `sessions*.js` only as fallback
  - the active transcript bundle now carries the runtime bridge helpers:
    - `resolveRuntimeWorkspacePaths`
    - `refreshRuntimeSessionJournalSnapshot`
    - `attemptRuntimeSessionAutoRecovery`
- verify also performs a best-effort live journal refresh before evaluating operator recovery, so stale journal state no longer creates a false `present_conflict`

What the live proof now shows:

- explicit runtime refresh on `oc-nas` rewrote `memory-admin/meta/session-journal-latest.json` for `agent:main:main`
- the session pointer moved from the old recovery session `68979494-78c5-42a4-9111-290221b026dd` to the current store session `a968721b-88cb-498a-ba4e-c6a76f403de9`
- the final green report is:
  - `memory-admin/reports/deployment-verify-20260412151914.md`
  - `memory-admin/reports/deployment-verify-20260412151914.json`
- that report confirms:
  - `recovery.store.status=present_match`
  - `recovery.transcript.exists=true`
  - `recovery_auto.recovery_mode=runtime_auto`
  - `recovery_auto.trace_event_kind=session_recovery_auto`
  - `failures=[]`

Why this matters architecturally:

- the remaining red state was not a real shared-package-root split
- it was a surface-detection drift plus stale continuity metadata
- after this pass, both recovery paths are again aligned to the active runtime contract:
  - runtime auto-recovery lives on the active transcript bundle
  - operator recovery reads a refreshed journal view of the current store

What is intentionally left as-is:

- the transcript bundle is now the authoritative auto-recovery surface for the current package version
- no attempt was made to force the old `sessions*.js` export layout back into `v2026.4.9`
- no sudoers / custom sudo permission changes were made

### 2026-04-12 follow-up 50: Hermes-compatible skill/provider absorption now has a local compatibility layer, without changing live OpenClaw runtime contracts

Closed in this pass:

- the first Hermes-oriented compatibility surfaces now exist in local source
- OpenClaw has a formal read-only skill registry, provider registry, and Hermes adapter layer
- current live session / memory / gateway / runtime contracts remain unchanged

What was added locally:

- `workspace/tools/hermes-capability-matrix.mjs`
  - canonical `Hermes -> OpenClaw` translation matrix for:
    - skill discovery
    - skill metadata packaging
    - provider registration/auth
    - model selection/fallback
    - future execution/gateway/trajectory items
- `workspace/tools/skill-registry.mjs`
  - scans workspace `SKILL.md + _meta.json`
  - promotes `_meta.json` into a normalized metadata surface
  - emits both:
    - registry v2 entries
    - legacy-compatible skill views
  - classifies safety into:
    - `doc_only`
    - `local_tool`
    - `networked_tool`
    - `privileged_tool`
- `workspace/tools/provider-registry.mjs`
  - normalizes provider state from:
    - `auth-profiles.json`
    - env
    - config/default policy
  - formalizes the contract for:
    - `resolveAuthProfile`
    - `resolveModel`
    - `buildProviderTransport`
    - `classifyFailure`
    - `selectFallback`
    - `executeChat`
- `workspace/tools/hermes-adapter.mjs`
  - imports Hermes-style skill/provider descriptors as metadata-only compatibility entries
  - explicitly blocks phase-1 execution for anything above `doc_only` / `local_tool`

How existing behavior was kept compatible:

- `memory-llm-helper.mjs` still uses the legacy direct request path for real execution
- when `OPENCLAW_PROVIDER_REGISTRY_V2=1`, it now runs provider resolution in shadow mode:
  - old transport still sends the request
  - registry transport is resolved in parallel and compared for parity
- `openclaw-auth-sync-guard.mjs` now resolves profiles through the new provider-registry parsing path, but still preserves:
  - root auth store as canonical
  - target auth store sync semantics
  - existing `lastGood` / `usageStats` behavior

Important architectural boundary:

- this is not a Hermes runtime embedding
- Hermes is still treated as a design/source reference, not a live dependency
- no direct import of Hermes runtime state, memory, or session directories is allowed
- `openclaw skills`, `openclaw-cli-wrapper`, memory-review, deployment-verify, and gateway RPC behavior are intentionally unchanged at the user-visible contract level

Validation completed locally:

- new tests passed for:
  - skill registry discovery + missing-meta fallback
  - Hermes adapter skill/provider import behavior
  - provider registry resolution + fallback policy
  - auth sync through parsed provider ids
  - provider-registry shadow parity in `memory-llm-helper`
- dependent regression tests also stayed green:
  - `session-memory-review-selfcheck`
  - `deployment-verify`

What remains for a later live rollout phase:

- wire the skill registry into the actual `openclaw skills` surface instead of keeping it as a compatibility module
- move more provider-specific branch logic out of shell/runtime edges and into the registry contract
- add an execution-backend registry and trajectory/export adapter as a separate phase

### 2026-04-13 follow-up 51: the Hermes-compatible registry layer now emits a runtime-style skills snapshot and exposes provider shadow state through class-B/selfcheck surfaces

Closed in this pass:

- the skill registry can now emit a runtime-style `skillsSnapshot` candidate instead of only a raw registry dump
- class-B helper selection now reuses provider-registry codex model normalization
- session-memory-review selfcheck now surfaces provider shadow parity instead of hiding it inside `memory-llm-helper`

What was added locally:

- `workspace/tools/skill-registry.mjs`
  - now exports:
    - `buildResolvedSkillView`
    - `buildSkillsPrompt`
    - `buildSkillSnapshot`
  - `buildSkillSnapshot(...)` emits:
    - `prompt`
    - `skills`
    - `resolvedSkills`
    - `feature_flags`
    - registry shadow metadata
  - CLI now supports:
    - `--snapshot`
    - `--snapshot-version`
    - `--skill <name>`
- `workspace/tools/class-b-llm-task-runner.mjs`
  - `normalizeGatewayModel(...)` now resolves through provider-registry codex normalization instead of a local string heuristic
  - `resolveClassBExecutionMode(...)` now keys off the effective provider returned by the LLM transport view
- `workspace/tools/session-memory-review-selfcheck.mjs`
  - transport output now carries:
    - `effective_provider`
    - `auth_profile_id`
    - `shadow_registry`
  - direct-path normalized model selection now follows the effective provider, not only the legacy transport provider

Compatibility boundary that still holds:

- no live runtime bundle was patched in this pass
- no session / memory / gateway / recovery contract was changed
- the new skill snapshot is a source-level export surface for later runtime hookup, not an in-place replacement for the bundled `buildWorkspaceSkillSnapshot(...)` yet

Validation completed locally:

- new/updated tests passed for:
  - runtime-style skill snapshot prompt generation
  - Hermes import inclusion/exclusion at snapshot level
  - class-B execution mode selection via effective provider
  - session-memory-review selfcheck shadow parity exposure
- previous provider/auth/deployment regression tests stayed green in the same pass

### 2026-04-13 follow-up 52: runtime skill snapshot bridge now exists as a writable, verifiable handoff surface for later bundle hookup

Closed in this pass:

- OpenClaw now has a dedicated bridge that turns the Hermes-compatible skill registry into a file-backed runtime snapshot candidate
- the bridge verifies against the current runtime-facing `skillsSnapshot` contract shape instead of only dumping JSON
- registry fallback quality improved so body-only and multiline-frontmatter skills no longer degrade snapshot descriptions

What was added locally:

- `workspace/tools/runtime-skill-snapshot-bridge.mjs`
  - builds a runtime-facing snapshot candidate from:
    - local workspace skills
    - optional Hermes descriptor imports
  - supports:
    - `print`
    - `write`
    - `verify`
  - default output path:
    - `workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
  - verifies:
    - `prompt`
    - `skills`
    - `resolvedSkills`
    - prompt/name/location parity for each resolved skill
- `workspace/tools/skill-registry.mjs`
  - now infers descriptions from:
    - `## 描述` / `## Description` sections in body-only skills
    - multiline frontmatter scalars using `|` / `>-`

Validation completed locally:

- `runtime-skill-snapshot-bridge verify --workspace ... --json` is now green on the real local workspace skill set
- the default bridge output file was written successfully to:
  - `workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
- wider regression stayed green across:
  - provider registry
  - memory LLM helper
  - class-B runner
  - session review selfcheck
  - deployment verify

Why this matters for the next phase:

- the next runtime patch no longer needs to invent or infer a snapshot payload shape
- it only needs to decide when to read the bridge output instead of calling the bundled legacy `buildWorkspaceSkillSnapshot(...)`

### 2026-04-13 follow-up 53: runtime skill snapshot cutover is now scripted as a feature-flagged local bundle patch, but still not rolled into live runtime

Closed in this pass:

- OpenClaw now has a dedicated cutover tool that can patch a local reply bundle copy so runtime skills can read the bridge snapshot file under a flag
- the patch preserves the legacy `buildWorkspaceSkillSnapshot(...)` path as the fallback, so session / memory / gateway contracts are unchanged when the bridge file or flag is absent
- this is still a source-level / local-bundle preparation step, not a live NAS rollout

What was added locally:

- `workspace/tools/runtime-skill-snapshot-cutover.mjs`
  - analyzes an existing bundled runtime file for:
    - legacy skill snapshot callsites
    - bridge helper markers
    - feature flag markers
  - patches the bundle by:
    - replacing runtime callsites from `buildWorkspaceSkillSnapshot(...)` to `resolveWorkspaceSkillSnapshotWithBridge(...)`
    - injecting a helper block gated by `OPENCLAW_SKILL_REGISTRY_V2`
    - reading `OPENCLAW_RUNTIME_SKILLS_SNAPSHOT_FILE` or the default bridge output file
    - silently falling back to legacy `buildWorkspaceSkillSnapshot(...)` if the bridge is disabled, missing, or malformed
  - supports:
    - `status`
    - `verify`
    - `apply`
- `workspace/tools/tests/runtime-skill-snapshot-cutover.test.mjs`
  - validates against the real local `reply-base-C5LKjXcC.js` bundle shape
  - asserts:
    - 5 legacy callsites are replaced
    - helper injection markers exist
    - repeat patching is idempotent
    - `apply` writes a backup and reports `already_patched` on rerun

Compatibility boundary that still holds:

- no live bundle was patched in this pass
- no systemd / gateway / healthcheck / recovery behavior was changed
- the new runtime cutover only activates when:
  - the bundle has been explicitly patched
  - `OPENCLAW_SKILL_REGISTRY_V2` is enabled
  - a valid runtime skill snapshot file exists

### 2026-04-13 follow-up 54: reply runtime build pipeline now composes the stable patch snapshot and the optional Hermes skill cutover

Closed in this pass:

- OpenClaw now has a local reply-runtime build pipeline that can regenerate the stable patched bundle from `reply-base` + `reply-runtime-v1.patch`
- the same pipeline can optionally layer `runtime-skill-snapshot-cutover` on top, but only when explicitly requested
- the existing stable patched snapshot remains the default output; the skill-registry-v2 candidate is emitted as a separate derived file name

What was added locally:

- `workspace/tools/reply-runtime-build.mjs`
  - `status`
    - validates that manifest `base_hash` / `patched_hash` still match the local `reply-base` / `reply-patched` snapshots
    - surfaces optional cutover metadata and script availability
  - `verify`
    - rebuilds the reply bundle in a temp dir
    - by default asserts generated output still matches the stable patched snapshot
    - with explicit cutover enabled, asserts the cutover markers are present while the base runtime patch anchors remain intact
  - `build`
    - writes either:
      - the stable patched snapshot shape
      - or a separate `.skill-registry-v2.js` candidate when the cutover is enabled
- `workspace/patches/runtime/patch-manifest.json`
  - upgraded to the current local snapshot hashes
  - now carries:
    - `base_snapshot`
    - `patched_snapshot`
    - `target_basename`
    - `default_target`
    - `backup_suffix`
    - `optional_cutovers`
- `workspace/tools/tests/reply-runtime-build.test.mjs`
  - validates:
    - manifest parity for local base/patched snapshots
    - default build reproduces current stable patched snapshot
    - optional skill-registry-v2 build produces a separate cutover candidate
    - verify remains green for both stable and cutover paths

Compatibility boundary that still holds:

- no live NAS bundle was patched in this pass
- default local build output is still the existing stable `reply-patched-C5LKjXcC.js` shape
- the Hermes skill cutover is not part of the default runtime patch; it is an explicit derived candidate layered on top of the stable patch snapshot

### 2026-04-13 follow-up 55: runtime-patch-manager now understands the optional Hermes skill cutover as a first-class verify/apply state

Closed in this pass:

- the reply runtime patch manager no longer treats the skill-registry-v2 candidate as opaque drift
- `verify_state` can now distinguish:
  - `ready_to_apply`
  - `already_patched`
  - `optional_cutover_applied`
  - `patched_drifted`
- the manager can explicitly apply the optional cutover after the stable patch instead of forcing operators to reason about it as an out-of-band bundle mutation

What changed locally:

- `workspace/tools/runtime-patch-manager.mjs`
  - now reads the upgraded reply runtime manifest fields:
    - `base_snapshot`
    - `patched_snapshot`
    - `target_basename`
    - `default_target`
    - `backup_suffix`
    - `optional_cutovers`
  - `status`, `preflight`, and `verify` now return:
    - snapshot hash parity against manifest
    - `verify_state`
    - optional cutover states and markers
  - `apply` now supports:
    - stable patch only
    - stable patch + explicit `runtime-skill-snapshot-v1` layering
  - `rollback-base` continues to restore the manifest base snapshot even after the optional cutover path has been applied
- `workspace/tools/tests/runtime-patch-manager.test.mjs`
  - validates:
    - base target -> `ready_to_apply`
    - stable apply -> `already_patched`
    - stable + skill cutover apply -> `optional_cutover_applied`
    - `rollback-base` returns the target to `ready_to_apply`

Compatibility boundary that still holds:

- live NAS defaults are still the runtime manager’s default paths
- no automatic cutover enablement was introduced
- operators must still request the optional cutover explicitly; default `apply` behavior remains the stable runtime patch only

### 2026-04-13 follow-up 56: upgrade assess and SRE docs now understand `optional_cutover_applied` as a managed reply-runtime state

Closed in this pass:

- `openclaw-upgrade-impact-assess.mjs` now collects benben reply runtime patch status through `runtime-patch-manager.mjs`
- pre/post assessment markdown can now show benben runtime patch `verify_state` and optional cutover state directly
- reply bundle drift warnings are now suppressed when the observed change is the managed `runtime-skill-snapshot-v1` cutover instead of accidental drift

What changed locally:

- `workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - adds:
    - `resolveRuntimePatchVerifyState(...)`
    - `summarizeBenbenRuntimePatchPortability(...)`
    - `collectBenbenRuntimePatch(...)`
  - current pre/post summary now includes:
    - `benben.runtime_patch`
    - top-level `benben_runtime_patch`
  - `shouldWarnOnLegacyReplyBundleChange(...)` now suppresses `legacy_reply_bundle_changed` when benben runtime patch is in `optional_cutover_applied`
- `workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`
  - covers:
    - runtime patch verify-state inference
    - warning suppression for managed optional cutover drift
    - markdown rendering of benben runtime patch state
- docs updated:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
  - `workspace/memory-admin/reports/openclaw-sre-troubleshooting-runbook.md`
  - `workspace/memory-admin/reports/runtime-patch-inventory.md`

Compatibility boundary that still holds:

- no live package root or reply bundle was modified in this pass
- `optional_cutover_applied` is only a visibility/assessment improvement here; no automatic cutover rollout was introduced

### 2026-04-13 follow-up 57: candidate-stage upgrade assessment now gates on benben reply runtime patch compatibility too

Closed in this pass:

- `--stage candidate` no longer checks only benben memory surface + adminAI pi-embedded patch compatibility
- it now also asks whether the unpacked candidate `reply` bundle is compatible with the current managed benben runtime patch contract

What changed locally:

- `workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - adds `collectCandidateBenbenRuntimePatch(...)`
  - candidate summary now includes:
    - `candidate.benben_runtime_patch`
    - top-level `benben_runtime_patch`
  - candidate decision now blocks on:
    - `candidate_benben_runtime_patch_verify_state_invalid:<state>`
  - accepted candidate reply states are:
    - `ready_to_apply`
    - `already_patched`
    - `optional_cutover_applied`
- `workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`
  - candidate fixtures now cover benben runtime patch compatibility explicitly
- `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
  - candidate-stage docs now mention benben reply runtime patch compatibility as part of the gate

Compatibility boundary that still holds:

- this is still a source/local candidate-package assessment change only
- no live candidate package or NAS runtime was patched in this pass

### 2026-04-13 follow-up 58: benben reply runtime candidate migration now has a single-command rehearsal path

Closed in this pass:

- candidate compatibility no longer has to be reasoned about across three separate manual steps
- there is now a single local orchestration tool that clones the candidate package, replays the benben stable reply runtime patch, optionally layers Hermes skill snapshot cutovers, and re-runs the candidate gate after each scenario

What changed locally:

- `workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - adds a single-command rehearsal flow for benben reply runtime migration
  - default flow:
    - read-only raw candidate assessment
    - stable patch rehearsal on a cloned candidate root
    - stable + `runtime-skill-snapshot-v1` rehearsal on another cloned candidate root
  - records:
    - raw candidate decision
    - per-scenario patch verify transitions
    - per-scenario candidate gate decisions
    - source candidate immutability (`reply` hash before/after)
  - supports:
    - `--skip-optional-cutovers`
    - explicit `--enable-cutover`
    - `--write-report`
- `workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs`
  - validates:
    - raw candidate stays `ready_to_apply`
    - stable rehearsal reaches `already_patched` + `candidate_ready`
    - stable + Hermes cutover rehearsal reaches `optional_cutover_applied` + `candidate_ready`
    - original candidate bundle is not mutated by the rehearsal
- docs updated:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
  - `workspace/memory-admin/reports/runtime-patch-inventory.md`

Compatibility boundary that still holds:

- this is still a local/source rehearsal only; no live NAS runtime was modified
- the original candidate package root is treated as immutable input; all patch application happens on temp clones
- no default rollout behavior changed for the live reply runtime patch manager

### 2026-04-13 follow-up 59: candidate-stage upgrade assess now auto-runs the benben reply runtime rehearsal unless explicitly skipped

Closed in this pass:

- the unified candidate upgrade workflow no longer requires operators to remember a separate benben rehearsal command
- `openclaw-upgrade-impact-assess.mjs --stage candidate` now includes the benben reply runtime rehearsal result by default
- stable rehearsal failure now blocks candidate readiness; optional Hermes cutover failure is surfaced as a warning rather than a hard gate

What changed locally:

- `workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - adds:
    - `--skip-benben-runtime-rehearsal`
    - `runLocalJsonTool(...)`
    - `collectCandidateBenbenRuntimeRehearsal(...)`
  - candidate summary now includes:
    - `candidate.benben_runtime_rehearsal`
    - top-level `benben_runtime_rehearsal`
  - candidate decision behavior now distinguishes:
    - stable rehearsal blocked -> `candidate_benben_runtime_rehearsal_blocked:*` blocker
    - optional cutover rehearsal not ready -> `candidate_benben_runtime_optional_cutovers_not_ready` warning
    - source candidate mutated during rehearsal -> blocker
  - candidate markdown now renders a dedicated `Benben Runtime Rehearsal` section
- `workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - internal candidate assessments now set `skipBenbenRuntimeRehearsal=true` to avoid recursive self-invocation
- `workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`
  - now covers:
    - blocked stable rehearsal path
    - warning-only optional cutover rehearsal drift
    - candidate markdown rendering of rehearsal results
- docs updated:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
  - `workspace/memory-admin/reports/runtime-patch-inventory.md`

Compatibility boundary that still holds:

- this is still a local/source candidate workflow change only; no live NAS runtime was modified
- operators can still opt out and run the old static candidate gate via `--skip-benben-runtime-rehearsal`
- the optional Hermes cutover remains non-default and is not promoted to a hard rollout gate

### 2026-04-13 follow-up 60: Hermes Phase 1 now has operator-facing status surfaces instead of only repo-local compatibility modules

Closed in this pass:

- the remaining Phase 1 gap around “registry exists, but operators have no unified read surface” is now materially closed
- skill/provider registry status is now accessible through wrapper-level commands instead of only direct script calls
- Hermes metadata-only imports no longer fail runtime snapshot verification when a descriptor omits `skillPath`

What changed locally:

- `workspace/tools/skill-registry.mjs`
  - adds `buildSkillRegistrySummary(...)`
  - CLI now supports `--summary`
- `workspace/tools/provider-registry.mjs`
  - adds `buildProviderRegistrySummary(...)`
  - CLI now supports `--summary`
- `workspace/tools/hermes-adapter.mjs`
  - Hermes skill imports now fall back to the descriptor file path / parent dir when no explicit `skillPath` is provided
  - this keeps metadata-only imports verifiable in the runtime snapshot bridge
- `workspace/tools/hermes-compat-status.mjs`
  - new unified read-only status surface that aggregates:
    - capability matrix counts
    - Hermes import counts
    - skill registry summary
    - provider registry summary
    - runtime skill snapshot candidate/file verify state
  - supports:
    - `status`
    - `write-snapshot`
- `workspace/tools/openclaw-cli-wrapper.sh`
  - now exposes new operator surfaces:
    - `openclaw hermes status`
    - `openclaw hermes write-snapshot`
    - `openclaw providers status`
    - `openclaw skills registry`
    - `openclaw skills snapshot`
    - `openclaw skills write-snapshot`
    - `openclaw skills verify-snapshot`
  - unrecognized `openclaw skills ...` subcommands still pass through to the real OpenClaw binary
- tests added/updated:
  - `workspace/tools/tests/hermes-compat-status.test.mjs`
  - `workspace/tools/tests/skill-registry.test.mjs`
  - `workspace/tools/tests/provider-registry.test.mjs`
  - existing `workspace/tools/tests/hermes-adapter.test.mjs` still stays green with the new fallback behavior

What remains after this pass:

- the new Hermes-compatible surfaces are still read-only/operator-facing; they are not yet the default live runtime path
- `OPENCLAW_SKILL_REGISTRY_V2` and `OPENCLAW_PROVIDER_REGISTRY_V2` are still shadow/optional rollout switches
- Phase 2 items still remain separate:
  - execution-backend registry
  - trajectory/export adapter
  - live default cutover of runtime skill/provider resolution

Compatibility boundary that still holds:

- no live NAS runtime was modified in this pass
- no session / memory / gateway / recovery contract changed
- wrapper additions are read-only and additive; they do not replace the real OpenClaw runtime commands by default

### 2026-04-13 follow-up 61: Hermes Phase 2 now has local scaffolding for execution-backend discovery and trajectory export, without promoting either path to a live default

Closed in this pass:

- the remaining “Phase 2 still only exists as a note in the capability matrix” gap is now materially closed
- OpenClaw now has a read-only execution-backend registry that models the current gateway/local/SSH/Docker execution surfaces as a future Hermes-compatible adapter target
- OpenClaw now also has a read-only trajectory/export adapter that can normalize current trace/recovery/review/smoke evidence into a future training/eval export surface, while preserving existing trace and verify contracts as canonical

What changed locally:

- `workspace/tools/execution-backend-registry.mjs`
  - new read-only registry over:
    - `gateway_wrapper`
    - `local_shell`
    - `ssh_remote`
    - `docker_host`
  - records:
    - availability
    - missing runtime bins
    - consumer coverage
    - Hermes alignment
    - operator-readiness summary
- `workspace/tools/trajectory-export-adapter.mjs`
  - new read-only export adapter that:
    - prefers `memory-admin/trace/*.jsonl` when available
    - falls back to `memory-admin/reports/*deployment-verify*.json` and `*openclaw-upgrade-impact*.json` fixtures when trace files are absent in local source
  - normalizes:
    - `memory_recall`
    - `session_recovery`
    - `session_recovery_auto`
    - `memory_review`
    - `verify_smoke`
  - can optionally write a derived export snapshot to:
    - `workspace/memory-admin/meta/hermes-trajectory-export.json`
- `workspace/tools/hermes-compat-status.mjs`
  - now aggregates Phase 2 scaffolding as part of the unified Hermes status surface:
    - execution backend registry summary
    - trajectory export summary
    - `phase2_scaffolding.decision`
- `workspace/tools/openclaw-cli-wrapper.sh`
  - now exposes additional read-only operator commands:
    - `openclaw hermes backends`
    - `openclaw hermes trajectories`
    - `openclaw hermes export-trajectories`
- tests added/updated:
  - `workspace/tools/tests/execution-backend-registry.test.mjs`
  - `workspace/tools/tests/trajectory-export-adapter.test.mjs`
  - `workspace/tools/tests/hermes-compat-status.test.mjs`

Validation that passed locally:

- `node --check workspace/tools/execution-backend-registry.mjs`
- `node --check workspace/tools/trajectory-export-adapter.mjs`
- `node --check workspace/tools/hermes-compat-status.mjs`
- `sh -n workspace/tools/openclaw-cli-wrapper.sh`
- `node --test workspace/tools/tests/execution-backend-registry.test.mjs workspace/tools/tests/trajectory-export-adapter.test.mjs workspace/tools/tests/hermes-compat-status.test.mjs`
- `node --test workspace/tools/tests/skill-registry.test.mjs workspace/tools/tests/provider-registry.test.mjs workspace/tools/tests/hermes-adapter.test.mjs`
- existing candidate/runtime regression packs remain green after the new Phase 2 scaffolding was added

Architecture truth after this pass:

- Hermes-compatible capability absorption now has two layers:
  - Phase 1:
    - skill registry
    - provider registry
    - optional runtime skill snapshot cutover
    - candidate rehearsal / patch-manager / upgrade-gate integration
  - Phase 2 scaffolding:
    - execution-backend registry
    - trajectory/export adapter
- both new Phase 2 surfaces are still read-only:
  - they do not replace any live execution path
  - they do not change how the gateway or wrapper actually runs tasks
  - they do not change trace writing, verify semantics, or recovery semantics
- the existing OpenClaw runtime remains the hard source of truth:
  - session / memory / gateway / recovery contracts are unchanged
  - trace and verify outputs remain canonical; trajectory export is derived from them, not vice versa

What remains after this pass:

- `OPENCLAW_SKILL_REGISTRY_V2` is still not the live default runtime skill path
- `OPENCLAW_PROVIDER_REGISTRY_V2` is still not the live default provider resolution path
- the execution-backend registry is descriptive only; it is not yet wired into task dispatch selection
- the trajectory/export adapter is descriptive only; it is not yet wired into a first-class eval/training pipeline

Compatibility boundary that still holds:

- this pass is still source/local only
- no live NAS runtime, service unit, or sudo behavior was modified
- new wrapper commands are additive operator surfaces, not rollout switches

### 2026-04-13 follow-up 62: provider-registry is now the default primary read path for direct-chat memory transport in local source, with legacy fallback retained

Closed in this pass:

- provider absorption is no longer “shadow-only” inside the direct-chat memory helper path
- local source now treats provider-registry resolution as the default primary transport selection path for direct-chat memory LLM usage
- legacy transport logic is still retained as an automatic fallback when the registry-selected provider is not direct-chat safe or lacks usable auth

What changed locally:

- `workspace/tools/memory-llm-helper.mjs`
  - `resolveLlmTransport()` now:
    - resolves provider-registry transport first
    - uses it as the default selected transport when it is direct-chat capable and authenticated
    - falls back to legacy direct transport otherwise
  - transport payload now also carries:
    - `transport_source`
    - `legacy_transport`
    - always-on parity diff via `shadow_registry`
- `workspace/tools/session-memory-review-selfcheck.mjs`
  - selfcheck transport output now exposes:
    - `transport_source`
    - `legacy_transport`
  - markdown output now shows the transport source explicitly
- `workspace/tools/provider-registry.mjs`
  - provider summary now declares:
    - `default_resolution_mode = provider_registry_primary_with_legacy_fallback`
    - `provider_registry_default_read = true`
- `workspace/tools/hermes-compat-status.mjs`
  - provider section now renders the default resolution mode so operator status reflects actual source behavior instead of only feature-flag state
- tests updated:
  - `workspace/tools/tests/memory-llm-helper.test.mjs`
  - `workspace/tools/tests/session-memory-review-selfcheck.test.mjs`
  - `workspace/tools/tests/provider-registry.test.mjs`

Validation that passed locally:

- `node --check workspace/tools/memory-llm-helper.mjs`
- `node --check workspace/tools/session-memory-review-selfcheck.mjs`
- `node --check workspace/tools/provider-registry.mjs`
- `node --check workspace/tools/hermes-compat-status.mjs`
- `node --test workspace/tools/tests/memory-llm-helper.test.mjs workspace/tools/tests/session-memory-review-selfcheck.test.mjs workspace/tools/tests/provider-registry.test.mjs workspace/tools/tests/class-b-llm-task-runner.test.mjs workspace/tools/tests/deployment-verify.test.mjs workspace/tools/tests/hermes-compat-status.test.mjs`

Architecture truth after this pass:

- for direct-chat memory transport in local source, provider-registry is now effectively the main resolver
- `OPENCLAW_PROVIDER_REGISTRY_V2` still exists as a feature-flag surface in status/config, but it is no longer the sole switch determining whether provider-registry logic is used in `memory-llm-helper`
- this is still not a live rollout:
  - no NAS runtime package or service was changed
  - the effective change currently exists only in local source and local tool/test behavior
- fallback safety still holds:
  - if the registry-selected provider is not suitable for direct chat (for example `openai-codex`) or lacks usable auth, the helper falls back to legacy direct transport instead of hard-failing

What remains after this pass:

- skill-registry is still not the default live runtime skill path
- execution-backend registry is still descriptive and not yet used as the actual runtime dispatch selector
- trajectory/export adapter is still descriptive and not yet a first-class eval/training pipeline surface

### 2026-04-13 follow-up 63: reply runtime local build now defaults to the skill-registry-v2 cutover candidate, while preserving an explicit stable-only escape hatch

Closed in this pass:

- the local reply-runtime build path is no longer stable-first by default
- the manifest-level optional skill snapshot cutover is now the default local build/rebuild candidate for reply runtime artifacts
- a stable-only escape hatch still exists so operators can deliberately reproduce the pre-cutover patched snapshot when needed

What changed locally:

- `workspace/patches/runtime/patch-manifest.json`
  - `runtime-skill-snapshot-v1.default_enabled` is now `true`
- `workspace/tools/reply-runtime-build.mjs`
  - default build/verify preparation now automatically includes manifest-default cutovers
  - new `--stable-only` CLI escape hatch disables manifest-default cutovers for one build/verify invocation
  - `useDefaultCutovers: false` now preserves the old stable-only behavior for programmatic callers
- `workspace/tools/tests/reply-runtime-build.test.mjs`
  - now verifies:
    - default build emits a skill-registry-v2 candidate
    - stable-only still reproduces the old patched snapshot exactly
    - verify remains green for both paths

Validation that passed locally:

- `node --check workspace/tools/reply-runtime-build.mjs`
- `node --test workspace/tools/tests/reply-runtime-build.test.mjs workspace/tools/tests/runtime-patch-manager.test.mjs workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`

Architecture truth after this pass:

- local source now distinguishes three reply-runtime states more clearly:
  - base / unpatched
  - stable patched snapshot
  - default local candidate = stable patch + skill-registry-v2 cutover
- this is still a local build/rehearsal default, not a live runtime default:
  - runtime-patch-manager apply still does not silently change the live target unless a rollout step explicitly applies a cutover
  - live NAS bundle/service behavior remains unchanged in this session

What remains after this pass:

- skill-registry is still not the default live runtime skill path on `oc-nas`
- runtime-patch-manager/apply path and live rollout policy still need an explicit deployment decision before the same default is promoted beyond local build artifacts

### 2026-04-13 follow-up 64: rollout-grade reply-runtime tools now share one manifest-default cutover policy, and stable-only is an explicit opt-out

Closed in this pass:

- the reply-runtime patch manager, benben migration rehearsal, and candidate upgrade assessor now agree on how to interpret manifest `default_enabled` cutovers
- the previous split-brain is gone:
  - local build already preferred manifest-default cutovers
  - patch/apply/rehearsal/gating now model the same default target instead of silently treating every optional cutover as equal
- a stable-only path remains available, but it is now an explicit operator choice rather than an accidental side effect of inconsistent tooling

What changed locally:

- `workspace/tools/runtime-patch-manager.mjs`
  - added shared cutover selection logic
  - CLI `apply` now defaults to manifest-default cutovers unless `--stable-only` is passed
  - low-level array-based callers preserve legacy explicit-only semantics for backward safety
  - status/apply payloads now expose:
    - `default_enabled_cutovers`
    - `requested_cutovers_mode`
    - `requested_cutovers_blocking`
- `workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - scenario planning now derives requested cutovers from the same shared selection helper
  - added `--stable-only` alias for the stable-path-only rehearsal mode
  - overall summary now records whether requested cutovers are rollout-blocking defaults vs explicit extra rehearsals
  - manifest-default cutover failure now blocks the rehearsal outcome instead of collapsing into the old warning-only `ready_for_stable_only` posture
- `workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - candidate-stage assessment now understands the new rehearsal metadata
  - failed manifest-default benben cutovers become a candidate blocker
  - explicit extra cutover failures still stay warning-only
  - added `--benben-runtime-stable-only` so candidate gates can intentionally evaluate only the stable reply-runtime path

Validation that passed locally:

- `node --check workspace/tools/runtime-patch-manager.mjs`
- `node --check workspace/tools/benben-runtime-patch-rehearsal.mjs`
- `node --check workspace/tools/openclaw-upgrade-impact-assess.mjs`
- `node --test workspace/tools/tests/runtime-patch-manager.test.mjs workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`

Architecture truth after this pass:

- there is now a coherent three-level reply-runtime rollout model:
  - manifest-default cutovers = default rollout target
  - explicit extra cutovers = optional exploratory/extensions path
  - stable-only = deliberate operator escape hatch
- this matters because Hermes skill-registry-v2 is no longer just “available”; in local rollout tooling it is now treated as the default migration target whenever the manifest says so
- this is still not a live rollout:
  - no NAS package, service, or bundle was modified in this pass
  - the change is architectural consistency across local source/build/rehearsal/gating tools

What remains after this pass:

- live `oc-nas` still does not default to the skill-registry path at runtime
- provider-registry-primary local source behavior is still not deployed as live default behavior
- execution-backend registry and trajectory export remain modeled surfaces, not live production dispatch/eval contracts

### 2026-04-13 follow-up 65: Hermes live promotion now has a managed rollout helper and an explicit rollout-shell integration point

Closed in this pass:

- the missing “bridge” between local Hermes-compatible source work and actual live rollout mechanics
- the old gap where rollout knowledge was spread across:
  - runtime patch manager
  - runtime skill snapshot bridge
  - manual `/etc/openclaw/gateway.env` edits
  - operator memory

What changed locally:

- `workspace/tools/hermes-live-rollout.mjs`
  - new managed rollout helper for the benben gateway path
  - `status` reports:
    - desired Hermes flags
    - current gateway-env flags
    - runtime skill snapshot file parity
    - reply runtime patch state
    - concrete pending steps
  - `apply` performs only file/runtime patch mutations:
    - write/update `memory-admin/meta/skill-registry-runtime-snapshot.json`
    - append/replace a managed env block in the gateway env file
    - advance reply runtime to manifest-default cutover when needed
  - deliberate boundary:
    - no implicit `systemctl restart`
    - restart remains the caller’s responsibility
- `workspace/tools/live-rollout.sh`
  - now accepts:
    - `--enable-hermes-skill-runtime`
    - `--enable-hermes-provider-default`
  - when those flags are present, rollout gains a Hermes phase:
    - remote preflight status
    - post-sync Hermes apply
    - explicit gateway restart
    - Hermes readiness assertion in smoke
  - without those flags, rollout behavior remains unchanged
- `workspace/tools/openclaw-cli-wrapper.sh`
  - adds a read-only operator surface:
    - `openclaw hermes rollout-status`

Validation that passed locally:

- `node --check workspace/tools/hermes-live-rollout.mjs`
- `bash -n workspace/tools/live-rollout.sh`
- `sh -n workspace/tools/openclaw-cli-wrapper.sh`
- `node --test workspace/tools/tests/hermes-live-rollout.test.mjs workspace/tools/tests/runtime-patch-manager.test.mjs workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs workspace/tools/tests/reply-runtime-build.test.mjs`

Architecture truth after this pass:

- Hermes Phase 1 is no longer blocked on “how do we safely apply this on live”
- the benben path now has a coherent promotion contract:
  - source/build defaults
  - patch/rehearsal/candidate gating
  - managed live rollout helper
  - guarded live rollout shell entrypoint
- this still stops short of an executed live migration:
  - no NAS service/runtime was touched in this session
  - adminAI still does not have a separate Hermes live rollout helper
  - execution backend and trajectory export are still modeled layers, not live production enforcement points

What remains after this pass:

- actually execute the Hermes-enabled rollout on `oc-nas`
- verify post-restart live status / smoke / gateway behavior on NAS
- decide whether adminAI also needs its own persisted provider flag path or should stay untouched until it has a comparable runtime need

2026-04-13 architecture truth update after the real NAS rollout:

- the live rollout no longer depends on the legacy benben reply-runtime discovery path
  - old assumption:
    - parse `/usr/lib/node_modules/openclaw/dist/index.js`
    - resolve a `reply-*.js` bundle
  - this is no longer valid on current live package `v2026.4.9`
  - actual live layout uses:
    - `library-BnhG_Fxr.js`
    - `reply.runtime-BmVCNXoQ.js`
- because Hermes skill-registry cutover is fundamentally a skills-surface concern, the safer architecture is:
  - do **not** piggyback live Hermes promotion on the old reply-runtime patch manager
  - patch the current skills runtime bundle directly

What changed in source truth to support that:

- `workspace/tools/runtime-skill-snapshot-cutover.mjs`
  - now supports two bundle modes:
    - `legacy_reply`
    - `skills_module`
  - legacy reply mode remains compatible for local build / rehearsal flows
  - current live mode now patches the `buildWorkspaceSkillSnapshot(...)` definition directly in the skills bundle
  - the injected bridge remains feature-flagged on `OPENCLAW_SKILL_REGISTRY_V2`
- `workspace/tools/hermes-live-rollout.mjs`
  - no longer treats “reply bundle not found in index.js” as a terminal live blocker
  - it now resolves the current skills runtime bundle from dist by scanning `skills-*.js` for `buildWorkspaceSkillSnapshot(...)`
  - runtime patch status in Hermes rollout is now the direct skill-runtime cutover status

Observed live architecture on `oc-nas` after apply:

- runtime skill snapshot bridge target:
  - `/usr/lib/node_modules/openclaw/dist/skills-U3bcZf5o.js`
- Hermes rollout status:
  - `decision=ready`
  - `current_flags.skill_runtime=true`
  - `current_flags.provider_default=true`
  - `runtime_patch.patch_state.verify_state=optional_cutover_applied`
- snapshot plane:
  - `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
  - `verify_ok=true`
  - `in_sync_with_candidate=true`

Important architectural interpretation:

- Hermes Phase 1 is now live on benben/main
- the live safety model held:
  - feature flags persisted in gateway env
  - runtime cutover is explicit and backed up
  - snapshot file is materialized and parity-checked
  - gateway restart stayed explicit instead of hidden inside the apply tool
- the post-rollout `degraded` memory-ops state does **not** invalidate the Hermes promotion itself
  - the observed degradations are outside the Hermes cutover boundary
  - they come from pre-existing memory governance / session review debt

What remains after this real rollout:

- adminAI still does not have a separate Hermes live rollout helper
- `sync-live-workspace.sh` is functionally fixed, but still expensive over NAS:
  - even after excluding `.gitnexus` / local junk and fixing tar metadata, the observed full sync wall time in this session was `16m52s`
  - future work should split “tool-only hot sync” from “full workspace sync” as first-class paths
- execution backend registry and trajectory export remain modeled layers, not live enforced production paths

2026-04-13 post-rollout architecture state after live debt cleanup:

- the live benben/main path is no longer only “Hermes-ready”; it is now operationally converged again
  - `session-memory-review` pending reconcile count is cleared
  - `active_tasks.needs_attention` is cleared
  - `authorized-memory-state` has been reseeded against the current protected memory corpus
  - fresh `memory-audit-*`, `memory-health-summary-*`, and `memory-ops-dashboard-*` snapshots now resolve to `healthy`

Important interpretation:

- the earlier `degraded` state after Hermes rollout was not an architectural incompatibility between Hermes cutover and the existing OpenClaw memory plane
- it was a state-drift problem across three operational surfaces:
  - session review queue had stale pending items
  - active task review had stale triage
  - authorized memory state lagged behind the current protected corpus
- those three surfaces were closed without changing the Hermes rollout contract itself

Architecture truth after this cleanup:

- benben/main live contract is now:
  - gateway env flags persisted
  - runtime skill snapshot file materialized and parity-checked
  - live skills bundle cutover applied directly on `skills-U3bcZf5o.js`
  - memory governance state rebaselined to the current protected memory set
  - session review and active task sidecars back in sync with the health surface
- this is a stronger end-state than “Hermes live but dashboard still red”
  - the deployment path and the operational status path now agree again

What still remains strategically:

- adminAI still has no separate Hermes live promotion path
- protected-memory authorization is still coarse-grained when using `seed-protected`
  - future work should add a narrower “authorize audited legit drift only” mode so operators do not need to reseed the entire protected surface for benign drift
- `sync-live-workspace.sh` still needs a first-class minimal hot-sync mode
  - the current live fix makes full sync work reliably
  - it does not yet make it cheap

2026-04-13 follow-up: the two rollout gaps above are now closed.

What changed in source:

- added `workspace/tools/rollout-instance-config.sh`
  - normalizes `benben` vs `adminai`
  - centralizes defaults for:
    - workspace root
    - owner
    - gateway env file
    - gateway service
    - healthcheck service/timer
  - defines the safe allowlist for hot-sync paths
- `workspace/tools/sync-live-workspace.sh`
  - now supports `--instance benben|adminai`
  - now supports `--sync-profile full|hot`, `--hot-sync`, and repeated `--path`
  - hot-sync is intentionally constrained to tooling/runtime/doc paths rather than mutable memory state
  - hot-sync `auto` mode now prefers tar-over-ssh instead of per-path rsync
    - reason: on this NAS, remote rsync rejects the absolute destination path, and repeated rsync calls amplify the latency
  - hot-sync post-sync behavior is minimal:
    - fix ownership on just the synced paths
    - restore tool execute bits when `tools/*` was touched
    - refresh the runtime skill snapshot only when the skill-runtime flag is already enabled
    - skip recall rebuild, memory audit churn, and healthcheck restarts
- `workspace/tools/live-rollout.sh`
  - now supports `--instance benben|adminai`
  - uses instance-resolved gateway/healthcheck defaults instead of benben-only hardcoding

Architectural outcome:

- adminAI no longer needs a separate copy of `hermes-live-rollout.mjs`
  - the existing Hermes live rollout tool was already workspace/env parameterized
  - the missing layer was instance-aware orchestration
- the correct design is now:
  - one generic `hermes-live-rollout.mjs`
  - one shared instance config surface
  - instance-aware `live-rollout.sh` / `sync-live-workspace.sh`
  - instance-specific env + workspace roots

Observed live adminAI architecture after apply on `oc-nas`:

- workspace:
  - `/var/lib/openclaw-adminai/.openclaw/workspace`
- gateway env:
  - `/etc/openclaw/adminai-gateway.env`
- persisted flags:
  - `OPENCLAW_SKILL_REGISTRY_V2=1`
  - `OPENCLAW_PROVIDER_REGISTRY_V2=1`
- skill snapshot materialized:
  - `/var/lib/openclaw-adminai/.openclaw/workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
  - `verify_ok=true`
  - `in_sync_with_candidate=true`
- runtime patch status:
  - `verify_state=optional_cutover_applied`
  - still points at the shared dist bundle:
    - `/usr/lib/node_modules/openclaw/dist/skills-U3bcZf5o.js`

Interpretation:

- the old architecture note “adminAI still has no separate Hermes live promotion path” is no longer true
- the promotion path now exists, but it is intentionally not a forked helper
  - it is an instance-resolved use of the same Hermes rollout primitive
- the old note “sync-live-workspace still needs a first-class minimal hot-sync mode” is also no longer true
  - hot-sync now exists as a distinct, supported operational path

What actually remains strategically after this closure:

- protected-memory authorization is still coarse-grained when using `seed-protected`
  - future work should add a narrower “authorize audited legit drift only” mode so operators do not need to reseed the entire protected surface for benign drift

2026-04-13 adminAI healthcheck timeout debt is now closed.

Root cause:

- the per-minute `openclaw-adminai-healthcheck.service` was not timing out on HTTP gateway checks
- it was timing out inside the optional extra check:
  - `OPENCLAW_HEALTH_EXTRA_CHECK=.../adminai-codex-canary.mjs`
- because the health env also enabled policy probe by default:
  - `OPENCLAW_ADMINAI_CODEX_POLICY_PROBE_ENABLED=1`
- that meant one lightweight healthcheck invocation could synchronously try to run:
  - transport canary
  - policy probe
- historical observed durations from live state were already enough to explain the timeout:
  - transport canary success example: `~76s`
  - policy probe success example: `~52s`
  - healthcheck cap: `90s`

Architectural fix:

- `workspace/tools/openclaw-healthcheck.sh`
  - now accepts `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS`
  - arguments are appended only to the extra-check command path
  - default behavior remains unchanged for other instances
- `workspace/tools/install-openclaw-adminai-instance.sh`
  - adminAI health env generation now writes:
    - `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS="--policy-probe-enabled 0"`

Why this fix is the right boundary:

- it does **not** remove the adminAI policy probe feature
- it only removes policy probe from the synchronous path of the per-minute lightweight healthcheck
- policy probe still exists for:
  - explicit `adminai-codex-canary.mjs --policy-probe`
  - forced upgrade probes
  - dedicated operator verification paths
- the minute-level healthcheck goes back to being a fast liveness/heartbeat surface rather than a full policy regression job

Observed live outcome after apply on `oc-nas`:

- `/etc/openclaw/adminai-health.env` now contains:
  - `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS="--policy-probe-enabled 0"`
- direct env-sourced execution:
  - `adminai-codex-canary skipped_recent ...`
  - `heartbeat refreshed: memory/heartbeat-state.json`
  - no `status=124`
- systemd result:
  - `Result=success`
  - `ExecMainStatus=0`

What still remains strategically after this closure:

2026-04-13 protected-memory authorization is no longer coarse-grained by default.

What changed:

- `workspace/tools/memory-governance-helper.mjs`
  - now exposes `authorizeAuditedMemoryDrift(...)`
  - this takes the current or supplied audit payload as the source of truth
  - it can reauthorize only the audited paths the operator actually intends to bless
- `workspace/tools/memory-authorize-state.mjs`
  - now supports `--mode audit-drift`
  - can resolve the latest `memory-audit-*.json` automatically
  - supports targeted narrowing by:
    - `--path <relative>`
    - `--allow-kind <kind>`
    - `--dry-run`

Architectural consequence:

- the operator workflow now has three distinct authorization levels instead of two:
  - `managed-rollout`
    - reauthorize only the managed rollout memory surface
  - `audit-drift`
    - reauthorize only the audited drift entries the operator selected
  - `seed-protected`
    - full protected-surface rebaseline
- this is the missing middle layer that was absent before
  - operators no longer need to jump from “too narrow” straight to “reseed everything”

Why this matters:

- it reduces the blast radius of operational cleanup
- it keeps the protected-memory baseline more meaningful
- it makes authorization actions easier to explain after the fact because they can be tied back to:
  - a specific `memory-audit-*.json`
  - a specific subset of paths
  - a specific kind set

Observed live state after rollout of the tool:

- benben/main latest audit already reports zero unauthorized writes
- `memory-authorize-state.mjs --mode audit-drift --dry-run --json` on NAS now resolves the latest audit file and returns `count=0`
- the tool is present in both benben and adminAI workspaces for future targeted cleanup

What still remains strategically after this closure:

- there is no longer a major Hermes/open-memory rollout blocker in this thread

2026-04-13 operator-facing memory authorization is now closed as an architecture gap.

What changed:

- `workspace/tools/openclaw-cli-wrapper.sh`
  - now exposes `memory-authorize-state.mjs` through:
    - `openclaw memory-ops authorize-state ...`
- `workspace/memory-admin/reports/openclaw-sre-troubleshooting-runbook.md`
  - now treats `audit-drift` as the default first-response tool for protected-memory drift

Architectural consequence:

- the protected-memory authorization model is now complete across all three layers:
  - helper API:
    - `authorizeAuditedMemoryDrift(...)`
  - operator CLI:
    - `openclaw memory-ops authorize-state --mode audit-drift ...`
  - SRE guidance:
    - runbook now prefers `audit-drift --dry-run` before any reseed
- this removes the last “implemented in code, but not exposed operationally” gap from the authorization path
- adminAI follow-up also proved the runbook needed one more operational guardrail:
  - when no `memory-audit-*.json` exists yet, operators must generate an audit snapshot before `audit-drift`
  - that guidance is now part of the live SRE runbook rather than tribal knowledge
- adminAI now has an explicit initial protected-memory baseline instead of an implicit “everything is untracked” state

What is no longer true:

- the old state where `audit-drift` existed only as a low-level script invocation
- the old state where the SRE runbook still implicitly pushed operators toward coarse-grained rebaseline behavior

What remains strategically after this closure:

- there is still no need to change live sudo policy for this thread
- there is no remaining major Hermes / protected-memory architecture blocker in the current rollout line

2026-04-13 Hermes/provider hardening follow-up:

What is now closed:

- provider-registry is instance-aware
  - the old benben-only hardcoded auth/config root was the concrete reason adminAI `hermes status` failed with:
    - `EACCES: permission denied, open '/var/lib/openclaw/.openclaw/auth-profiles.json'`
  - that pathing bug is now closed in source and verified live
- execution-backend registry is now part of real class-B execution selection rather than documentation-only metadata
- workspace source manifest is now a first-class part of Hermes compat / rollout state
  - the system has a concrete, hash-based answer for “which local source files define this rollout surface?”

Architectural consequence:

- the “single source of truth” problem is materially reduced even though it is not eliminated
  - there is now an explicit manifest for the Hermes/runtime/operator source surface
  - compat status and rollout status both consume that manifest
  - live workspaces can regenerate the same manifest after hot/full sync
- the Phase 2 execution-backend abstraction has crossed from scaffolding into light runtime use
  - `class-b-llm-task-runner.mjs` now chooses its gateway execution surface through the backend registry
  - this is still conservative:
    - no live dispatch contract changed
    - it only centralizes selection logic

What remains intentionally not solved in this thread:

- the service-user-only path still does not have authoritative visibility into gateway env flags
  - `hermes rollout-status` can still report `current_flags=false` when run strictly as the service user
  - that is now best understood as an evidence boundary, not a provider/runtime regression
- adminAI source manifest still reports two missing files:
  - `patches/runtime/reply-runtime-v1.patch`
  - `tools/reply-runtime-build.mjs`
  - today this is descriptive, not blocking
  - if adminAI is expected to own a fully self-hosted reply-runtime patch pipeline later, the manifest profile should become instance-specific rather than shared

Recommended next step if this line is reopened:

- do not widen sudo
- instead add a narrow, read-only env introspection path for Hermes rollout status
  - e.g. a safe helper that exposes only:
    - `OPENCLAW_SKILL_REGISTRY_V2`
    - `OPENCLAW_PROVIDER_REGISTRY_V2`
    - resolved env file path
  - this would close the remaining `current_flags=false` evidence gap without reopening the broader sudo discussion

2026-04-13 benben default-model clarification:

- “默认是 mini” needs to be split into two layers:
  - operator expectation / light-path default
  - heavy review / class-B default
- before this change, benben/main had drifted so that its live light path was explicitly pinned in gateway env to:
  - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4`
- that made the main instance feel slower than adminAI even when the gateway itself was healthy

Architectural decision:

- restore the light-path default to `gpt-5.4-mini`
- keep the heavier lanes unchanged:
  - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
  - class-B / codex review lane still resolves to `openai-codex/gpt-5.4`

Why this split matters:

- if everything is globally flattened to `mini`, the main agent loses depth on review / heavier memory tasks
- if everything is globally flattened to `gpt-5.4`, the main agent feels sluggish for normal interactive turns
- the right boundary is:
  - light / default chat-adjacent memory work => `mini`
  - deep / review / class-B work => `gpt-5.4`

Local source was aligned so future drift is less likely:

- `provider-registry.mjs`
  - OpenAI light fallback => `gpt-5.4-mini`
  - OpenAI deep fallback => `gpt-5.4`
- `memory-maintenance-runner.sh`
  - maintenance light fallback => `gpt-5.4-mini`

Residual caveat:

- some operator selfchecks still surface `gpt-5.4`
- that is intentional when they are validating the class-B / codex lane
- do not use those selfchecks as proof that the benben light default failed to switch

2026-04-13 QQBot architecture line is now source-complete, but not credentialed-live:

Architectural correction captured in this pass:

- earlier QQ planning assumed current OpenClaw runtime lacked QQ support and would need a managed runtime uplift
- that assumption is now superseded by current live/package evidence:
  - current `v2026.4.9` CLI surfaces already expose built-in `qqbot`
- therefore the right architecture is **not**:
  - a custom QQ runtime patch pipeline
- the right architecture is:
  - productionization of the existing built-in `qqbot` channel through instance-aware env/config/health/canary/rollout tooling

What is now implemented in source:

- QQ channel helper layer:
  - `workspace/tools/qqbot-runtime-helper.mjs`
  - single place for:
    - benben/adminAI path resolution
    - QQ target syntax normalization
    - QQ env / config inspection
    - required-channel status
    - gateway drop-in detection
    - runtime probe parsing
- QQ lightweight health layer:
  - `workspace/tools/qqbot-runtime-health.mjs`
  - healthcheck-safe probe only
  - intentionally separated from message-send canary
- QQ rollout layer:
  - `workspace/tools/qqbot-live-rollout.mjs`
  - manages:
    - `openclaw.json` non-secret QQ config
    - `OPENCLAW_REQUIRED_CHANNELS`
    - `health.env` extra-check wiring
    - root-owned QQ env drop-in
    - adminAI config-guard parity drop-in
- QQ canary layer:
  - `workspace/tools/channel-delivery-canary.mjs`
  - QQ is now decomposed into two explicit surfaces:
    - `qqbot_c2c`
    - `qqbot_group`
  - this matches the operational truth that single-chat and group-chat delivery can fail independently
- instance-aware systemd install:
  - `workspace/tools/install-openclaw-channel-canary.sh`
  - now provisions per-instance canary service/timer names instead of assuming benben-only
- operator surface:
  - `openclaw qqbot runtime-health`
  - `openclaw qqbot rollout-status`
  - `openclaw qqbot apply`
- rollout orchestration:
  - `live-rollout.sh` now knows how to preflight/apply/smoke QQ
- verify surface:
  - `deployment-verify.mjs` now exposes QQ runtime + canary state without making QQ mandatory when not configured

Architectural consequence:

- QQ is now handled the same way as the stronger parts of this stack:
  - config lives in explicit instance-owned surfaces
  - secrets stay in root-owned env
  - healthcheck only probes runtime readiness
  - canary owns real message sends
  - rollout has a preflight/apply/smoke path
  - adminAI no longer has to rely on benben-only assumptions for channel canary naming or QQ env layout

What intentionally remains unfinished:

- no credentialed live QQ enablement happened in this thread
  - there is still no proof here that real QQ sandbox or production Bots have been created / approved / whitelisted
- no live end-to-end inbound QQ session proof yet
  - so `lastChannel=qqbot` / QQ-backed session continuity remains an activation-time verification item, not a source-complete fact
- no QQ channel-surface support beyond v1 scope
  - still intentionally out:
    - `qqbot:channel:*`
    - slash commands
    - multi-Bot shared instance routing

Recommended next step when QQ credentials are ready:

1. prepare root-owned env files:
   - `/etc/openclaw/qqbot.env`
   - `/etc/openclaw/adminai-qqbot.env`
2. run sandbox rollout first:
   - benben sandbox
   - adminAI sandbox
3. require these live proofs before production:
   - `qqbot-runtime-health.mjs --require-configured 1`
   - `channel-delivery-canary` success for:
     - `qqbot_c2c`
     - `qqbot_group`
   - `deployment-verify --with-smoke --write-report --json` remains green
4. only then widen required-channel enforcement on production gateways

Net assessment:

- QQBot architecture is now **production-shaped in source**
- it is **not yet production-proven live**
- the remaining gap is credentials / sandbox evidence, not missing scaffolding

2026-04-13 QQBot activation boundary refined:

What changed in this pass:

- QQ rollout is no longer modeled as a binary `status/apply` path.
- A new explicit `prepare` phase now exists in `workspace/tools/qqbot-live-rollout.mjs`.

Why this matters architecturally:

- before this pass, the first credentialed rollout had to create:
  - the QQ secret env file
  - the gateway env drop-in
  - the actual QQ activation config
- that coupled “plumbing creation” and “channel activation” into a single step
- now these are separated:
  - `prepare`
    - creates the root-owned `qqbot.env` template
    - installs the gateway `qqbot-env.conf` drop-in
    - enforces file modes
    - leaves channel config disabled
  - `apply`
    - still owns the real activation:
      - credentials must already exist
      - `channels.qqbot.enabled`
      - `allowFrom`
      - canary targets
      - health extra check
      - adminAI config-guard parity

Security / safety consequence:

- the first live QQ preparation step is now safe to run ahead of credentials
- `qqbot.env` creation is explicitly locked to `0600`
- gateway drop-ins are explicitly locked to `0644`
- this removes a real class of rollout bug where the secret env file could be created with permissive default umask-derived mode

Live architecture state after preparation on `oc-nas`:

- benben:
  - `qqbot.env` exists
  - gateway drop-in exists
  - remaining blockers are only activation-time facts:
    - credentials
    - allowFrom
    - canary targets
    - QQ config enablement
    - health extra check wiring
- adminAI:
  - `adminai-qqbot.env` exists
  - gateway drop-in exists
  - same activation blockers remain
  - plus:
    - `adminai` config-guard drop-in still intentionally waits for real QQ activation

Updated recommendation:

1. keep using `prepare` as the only safe pre-credential live step
2. do **not** set QQ health extra check before real credentials and `channels.qqbot.enabled`
3. do **not** write the adminAI config-guard QQ drop-in before the config actually carries QQ
4. next credentialed pass should start directly from:
   - filling `/etc/openclaw/qqbot.env`
   - filling `/etc/openclaw/adminai-qqbot.env`
   - then running `apply`

Net assessment update:

- QQBot is now not only source-complete, but also **live-prepared**
- the remaining gap is strictly the credentialed activation boundary

2026-04-13 QQ activation-state semantics tightened:

Problem this pass addressed:

- before this pass, the orchestration layer still treated QQ rollout state as effectively binary:
  - not ready
  - ready
- that was too coarse once `prepare` existed
- a host that already had:
  - root-owned QQ env templates
  - gateway QQ env drop-ins
  should not be described the same way as a host missing those surfaces entirely

What changed:

- `qqbot-live-rollout` status now exposes a third meaningful state:
  - `prepared_pending_activation`
- semantic meaning:
  - plumbing is present
  - credentials / allowFrom / targets / final config enablement are still missing
- this state is now the expected live resting point before credentialed activation

Why this matters:

- it lets rollout tooling reason about QQ in phase-aware terms
- it prevents the preflight layer from treating “prepared but waiting for credentials” as a hard orchestration failure
- it also makes handoff clearer:
  - operators can distinguish infra-prepared from actually enabled

Orchestration consequence:

- `live-rollout.sh` now has an explicit `--prepare-qqbot-only` mode
- remote preflight now accepts:
  - `rollout_required`
  - `prepared_pending_activation`
  - `ready`
- only the credentialed activation path should move a host from:
  - `prepared_pending_activation`
  - to `ready`

Current live architecture state on `oc-nas`:

- benben:
  - `prepared_pending_activation`
- adminAI:
  - `prepared_pending_activation`

Remaining architectural blocker is unchanged:

- the system is waiting on true activation inputs, not more scaffolding:
  - official QQ Bot credentials
  - `allowFrom`
  - c2c/group sandbox targets
  - final QQ config enablement
  - QQ health extra check
  - adminAI QQ config-guard drop-in at activation time

2026-04-13 QQBot activation path split is now explicit:

- there are now two evidence-backed QQ bot provisioning paths, and they are **not** equivalent:
  - `OpenClaw` quick-create page:
    - `https://q.qq.com/qqbot/openclaw/index.html`
    - produces convenience bots that explicitly say:
      - `该机器人仅供创建人使用，暂不支持进入群聊`
    - usable for c2c helper scenarios only
    - **not** acceptable as the target production path for benben/adminAI group rollout
  - formal Open Platform registration path:
    - `https://q.qq.com/#/register`
    - this is the required entry for real group-capable QQ bot onboarding
    - it introduces email account creation plus later subject/admin verification steps
- architectural consequence:
  - production QQ group chat is blocked on platform onboarding inputs, not on more local rollout scaffolding
  - the next gating action is user/platform completion of the formal registration flow, not more source plumbing

2026-04-13 QQ rollout source now matches the built-in `v2026.4.9` plugin contract:

- live evidence from `/usr/lib/node_modules/openclaw/dist/extensions/qqbot/openclaw.plugin.json` shows the bundled plugin schema supports:
  - `enabled`
  - `appId`
  - `clientSecret`
  - `clientSecretFile`
  - `allowFrom`
  - `accounts`
  - `defaultAccount`
- previous rollout assumptions around:
  - `connectionMode`
  - `dmPolicy`
  - `groupPolicy`
  were speculative and do not belong to the current bundled schema
- local source was corrected:
  - `workspace/tools/qqbot-live-rollout.mjs`
    - no longer writes those unsupported fields into `channels.qqbot`
- this removes a hidden activation-time risk:
  - formal QQ credentials can now be applied against schema-aligned config instead of a guessed config shape

Current architecture state after this correction:

- QQ source/rollout plumbing: ready
- QQ live preparation: ready
- QQ formal production activation: blocked on platform registration + real bot creation

2026-04-13 QQ formal control-plane exposure is additionally gated by `developer ready`:

- live frontend bundle evidence now shows the QQ platform has two bot control planes in play:
  - formal control plane:
    - create route:
      - `https://q.qq.com/#/apps/create?type=1`
    - bot console route:
      - `https://q.qq.com/qqbot/#/home?appid={{appid}}`
  - OpenClaw quick-create plane:
    - `https://q.qq.com/qqbot/openclaw/`
- however the current `q.qq.com/#/apps` bot page is coded to route differently depending on account readiness:
  - if `developer ready` is false:
    - bot create is forced to `openclawUrl`
    - bot card click is forced to `openclawUrl`
  - only the dedicated bot "高级设置" branch is intended to use the formal bot console route
- architectural consequence:
  - there is no clean way to finish production QQ group onboarding until the platform account reaches the formal developer-ready state
  - this is a platform-side gating rule, not an OpenClaw rollout/tooling gap
- current blocker is therefore more precise than before:
  - not just "QQ credentials missing"
  - but specifically:
    - account developer readiness / subject verification must be completed first
    - only after that does formal QQ bot create/manage stop collapsing back to the OpenClaw quick path

2026-04-13 QQ platform blocking condition is now narrowed from "not ready" to "developer ticket missing/invalid":

- live browser evidence reproduced a second gating layer beyond the frontend route split:
  - `https://q.qq.com/#/certification-form` is a real route and can be hit directly
  - but under the current session it falls back to `https://q.qq.com/#/`, which exposes the public login form instead of the certification flow
- the same browser session also degraded `#/apps` account metadata to placeholder `-` values
- in-page developer info fetch returned:
  - `code = -10001`
  - `msg = 票据验证失败，请重新登录`
- architecture consequence:
  - QQ production activation is not blocked only by missing subject data or missing bot credentials
  - it is currently blocked one layer earlier by the absence of a valid developer-authenticated platform session
  - until that ticket/session is restored, the certification route and formal bot control plane cannot be treated as operationally available inputs to the rollout path

2026-04-13 QQ platform state advanced from "invalid developer ticket" to "formal certification flow reachable":

- after a clean relogin, the platform account recovered:
  - non-placeholder operator identity
  - non-placeholder developer id
  - stable access to `https://q.qq.com/#/certification-form`
- this changes the architecture boundary again:
  - formal QQ onboarding is no longer blocked by platform session invalidity
  - it is now blocked by completion of the formal subject-certification inputs
- current evidence-backed certification branch is:
  - subject type: `个人`
  - verification mode: `人脸认证`
  - required gating inputs remaining on the platform side:
    - ID completion
    - phone number
    - SMS verification
- architectural consequence:
  - OpenClaw-side QQ rollout scaffolding remains ready
  - platform-side progress has now moved into the real certification workflow
  - the next meaningful transition point is not another login repair but the completion of formal subject verification so the formal bot control plane can be used to create group-capable QQ bots

2026-04-13 QQ architecture state advanced from "formal creation possible" to "formal bots + live secrets provisioned":

- the architecture boundary has changed again:
  - QQ is no longer blocked on bot object creation
  - two formal bots now exist in the official QQ control plane:
    - benben: `1903829002`
    - adminAI: `1903828233`
- the earlier architecture note saying no live QQ credentials had been supplied is now outdated:
  - QQ `AppID/AppSecret` pairs were generated in the platform console
  - they were provisioned into:
    - `/etc/openclaw/qqbot.env`
    - `/etc/openclaw/adminai-qqbot.env`
  - this means the remaining gap is not credential generation anymore
- platform preflight has partially closed:
  - current NAS egress IP was verified as `219.157.244.110`
  - adminAI whitelist save is confirmed
  - benben whitelist save is at the last QQ-admin confirmation step and should be treated as pending until explicitly rechecked
- the remaining architecture blocker is now narrower and more operational:
  - OpenClaw rollout tooling expects target IDs in the form:
    - `qqbot:c2c:<id>`
    - `qqbot:group:<id>`
  - current platform sandbox/browser state still only proves:
    - c2c sandbox membership by QQ `uin`
    - no populated group sandbox entries yet
  - there is still no end-to-end runtime evidence in this thread proving whether those final rollout IDs should be copied directly from platform UIN/group fields or captured from first inbound QQ events
- therefore the current architecture truth is:
  - QQ source / rollout / env scaffolding: ready
  - formal QQ bots: ready
  - QQ secrets on NAS: ready
  - QQ platform whitelist: partially ready
  - QQ target-ID capture for OpenClaw allowFrom/canary: still pending
  - final live `qqbot apply` activation: still pending

2026-04-13 QQ architecture boundary refined again: c2c runtime capture is unblockable, group target capture is still platform-gated

- architecture truth before this pass was muddied by a tooling gap:
  - formal QQ secrets already existed in root-owned env on NAS
  - but operator-side QQ tools were still acting as if credentials were missing
  - the reason was not missing secrets; it was that wrapper/node tooling delegated as the service user without first injecting the root-owned QQ env
- this is now fixed in source:
  - `workspace/tools/openclaw-cli-wrapper.sh`
    - resolves instance-aware `OPENCLAW_QQBOT_ENV_FILE`
    - resolves instance-aware service-root defaults from `gateway.env`, preventing `adminAI` QQ operator commands from accidentally executing against benben workspace/state
    - loads root-owned QQ env before delegating
    - forwards effective QQ credentials/targets into service-user tool execution
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - treats process env as an allowed effective QQ credential surface for runtime inspection tools
  - `workspace/tools/qqbot-sandbox-probe.mjs`
    - is now a first-class operator tool instead of an ad-hoc scratch script
    - wrapper command:
      - `openclaw qqbot sandbox-probe`
- architecture consequence:
  - "service user cannot read `qqbot.env`" is no longer equivalent to "QQ tooling cannot run"
  - root-owned secrets remain root-owned
  - operator tooling can still perform QQ runtime discovery via controlled env injection
- target-id semantics are now backed by official QQ event/document evidence rather than guesswork:
  - c2c runtime identity = `user_openid`
  - group runtime identity = `group_openid`
  - group message actor identity = `member_openid`
  - platform `uin` / `group_code` should therefore be treated only as control-plane references, not final OpenClaw rollout ids
- platform boundary changed in a less favorable way for groups:
  - formal bot sandbox currently supports c2c member configuration
  - but the same page now explicitly overlays:
    - `暂不支持群相关配置，敬请期待`
  - therefore group target capture cannot currently rely on the sandbox-config path for these formal bots
- current architecture state:
  - c2c target capture path:
    - technically ready once the operator can message the sandbox bot entry in QQ
  - group target capture path:
    - still blocked by QQ platform exposure, not by more OpenClaw scaffolding
- latest live evidence now proves the operator/runtime side of c2c capture is ready:
  - benben and adminAI both obtain QQ access tokens successfully
  - both reach sandbox gateway `READY`
  - therefore there is no remaining architecture blocker on:
    - root-owned QQ secret injection
    - QQ gateway authentication
    - websocket readiness
  - the only missing artifact for c2c rollout is a real inbound user event that carries `user_openid`
- next architecture-safe order:
  1. capture real `user_openid` for benben/adminAI through the sandbox probe
  2. enable only c2c QQ activation if needed
  3. treat `qqbot:group:<group_openid>` as pending until QQ platform exposes a workable group path for the formal bots

2026-04-13 QQ architecture boundary closed for formal c2c, but not for group:

- the earlier architecture assumption that formal QQ runtime activation was still pending is now outdated
- current live truth on `oc-nas` is:
  - benben formal bot:
    - c2c runtime active
    - websocket connected
    - real inbound `C2C_MESSAGE_CREATE` observed
    - real outbound final delivery observed
  - adminAI formal bot:
    - c2c runtime active
    - websocket connected
    - real inbound `C2C_MESSAGE_CREATE` observed
    - real outbound final delivery observed
- the key live architecture fix that enabled this was not a config toggle but a transport-boundary correction:
  - QQ traffic was incorrectly passing through the global proxy hook
  - Tencent gateway validated source IP against the QQ platform whitelist and rejected proxied `/gateway` requests
  - adding `qq.com` / `.qq.com` to the proxy bypass surface restored direct egress and made formal QQ websocket startup viable
- effective architecture state has therefore changed to:
  - QQ secrets on NAS: ready
  - QQ whitelist: ready for current c2c runtime
  - QQ formal bot c2c runtime: ready and live
  - QQ allowFrom / canary / required-channel rollout for benben/adminAI: ready and live
  - QQ runtime-health / probe parser: repaired for keyed `channels.qqbot` payloads
  - QQ group runtime: still not production-ready because the control plane still exposes:
    - `暂不支持群相关配置，敬请期待`
- next architecture work is now narrower:
  1. keep QQ formal c2c as the supported production path
  2. treat QQ group support as an external platform dependency, not an OpenClaw scaffolding gap
  3. if Tencent later opens the group control plane, reuse the existing target grammar:
     - `qqbot:group:<group_openid>`
     - no additional c2c transport redesign should be required

2026-04-13 QQ review follow-up: one architectural false-negative remains, two scaffolding bugs are closed

- confirmed open bug:
  - `qqbot-runtime-health` still relies on `probeQqbotRuntime()`
  - that helper shells `openclaw channels status --probe --json`
  - on `adminAI`, current gateway auth still answers that probe path with:
    - `missing scope: operator.read`
  - so the helper can emit `probe_output_not_json` even while the formal QQ bot is already:
    - websocket-connected
    - receiving `C2C_MESSAGE_CREATE`
    - sending final replies successfully
  - this is now the main remaining architecture mismatch between QQ runtime truth and QQ health/ops truth
- closed during the same audit:
  - c2c-only sandbox probe termination now respects `OPENCLAW_QQBOT_GROUP_SUPPORTED=0`
  - `required_channel_ok` no longer treats undeclared `OPENCLAW_REQUIRED_CHANNELS` as satisfied by instance defaults
- practical architecture implication:
  - formal QQ c2c transport is live-ready
  - QQ rollout/status scaffolding is more honest than before
  - but QQ runtime-health still needs one more probe-strategy redesign before it can be treated as the authoritative liveness source for `adminAI`

2026-04-13 QQ architecture follow-up: runtime-health false-negative closed

- the previous architecture gap between:
  - "formal QQ c2c is live"
  - and "adminAI runtime-health still reports probe_output_not_json"
  - is now closed
- source-of-truth change:
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - gateway-log parsing now understands the actual structured live log surface emitted by OpenClaw gateway:
      - subsystem `gateway/channels/qqbot`
      - subsystem `gateway/ws` probe failures such as `missing scope: operator.read`
    - log extraction now anchors on the latest reconnect/auth window (`Refreshing token`, `Starting gateway`) instead of assuming the old text-only startup banner
    - when the gateway log already proves the CLI probe path is auth-blocked, helper now treats gateway-log evidence as the authoritative runtime truth for QQ health
- architectural consequence:
  - `qqbot-runtime-health` is now allowed to derive liveness from two valid evidence sources:
    1. direct `channels status --probe --json`
    2. recent gateway-log evidence when direct probe is access-restricted
  - this keeps benben on the direct probe path
  - while allowing adminAI to remain healthy without granting extra `operator.read` scope just for liveness checks
- live architecture truth on `oc-nas` is now:
  - benben QQ runtime-health:
    - healthy via direct probe
  - adminAI QQ runtime-health:
    - healthy via gateway-log fallback
  - both systemd healthcheck oneshots:
    - `Result=success`
- remaining architecture boundary is therefore narrower again:
  - QQ c2c formal runtime: closed and production-usable
  - QQ health/ops truth: closed for both benben and adminAI
  - QQ group runtime: still externally platform-gated by Tencent control-plane exposure

2026-04-13 local repo hygiene boundary:

- current dirty-tree architecture is not "one project plus junk"; it is a mixed workspace with three real state buckets:
  - tracked staging implementation under `openclaw-mac-migration/staging/*`
  - handoff/evidence/operator state under `.codex-remote-openclaw/*`
  - active but currently untracked local OpenClaw source under `nas-openclaw-v22/*`
- because of that structure, "untracked" is not a safe proxy for "garbage"
- hard evidence from the local filesystem only supported deleting:
  - zero-byte root files with nonsensical names
  - one-off scratch files `check_util.py` and `util.py`
  - cache directories `__pycache__/`
- later evidence **did** justify deleting the root exported bundles:
  - `index.js`
  - `index.mjs`
  - `main-1fsOo4Rt.js`
  - `product-name-CKRilA27.js`
  - reason:
    - they were confirmed as unrelated Electron/Codex desktop export artifacts
    - there is no root Electron/Vite app in this repo
    - no real workspace path depended on them
  - outcome:
    - all four were moved to Trash
- architectural rule added at the repo root:
  - cleanup work must first separate:
    1. tracked real work
    2. intentional untracked source/evidence
    3. proven garbage
  - only bucket 3 may be auto-cleaned
- practical implication for future turns:
  - repo hygiene work should prefer documentation + classification over broad deletion
  - if provenance is ambiguous, preserve the file and mark it for manual review rather than "tidying" it away
  - once provenance becomes hard evidence, update the rule and clean decisively instead of keeping stale ambiguity around

2026-04-13 local repo hygiene implementation state:

- the repo boundary is now enforced in three distinct ways:
  - tracked implementation remains in the outer repo
  - local source/evidence mirrors are hidden through `.git/info/exclude`
  - proven replay/dump residue is removed
- validated local mirror buckets now explicitly include:
  - `nas-openclaw-v22/`
  - `.codex-remote-openclaw/systemd/`
  - `.codex-remote-openclaw/tools/`
  - `.codex-remote-openclaw/docs/`
- this is not guesswork:
  - staging untracked tool files were promoted only after confirming they are referenced by tracked staging code and mirrored in `nas-openclaw-v22`
  - handoff systemd mirrors were retained only after matching them against live `oc-nas` unit/drop-in content
  - the zh runtime patch rules file was retained as tracked truth only after matching it to the live file under `/usr/local/share/openclaw/`
- practical rule now locked:
  - if a file is inside a tracked source tree and has source references or live/handoff evidence, it must be tracked
  - if a file is a local mirror of live/handoff state but not part of the outer repo contract, hide it with local exclude
  - if a file is replay/dump residue with no continuing contract value, remove it

2026-04-14 main-chat default architecture pivot:

- target steady-state is now:
  - main chat primary:
    - `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - main chat context:
    - `contextWindow=65536`
  - main chat timeout guardrails:
    - `agents.defaults.timeoutSeconds=180`
    - `agents.defaults.llm.idleTimeoutSeconds=180`
  - main chat fallback_1 when the desktop-local route is unavailable:
    - `openai-codex/gpt-5.4-mini`
  - image primary:
    - `ollama/qwen2.5vl:7b`
  - image fallback when the desktop-local image route is unavailable:
    - `openrouter/xiaomi/mimo-v2-omni`
- this is intentionally narrower than a full local-first rewrite:
  - only the main chat default moves to desktop-local Qwen 9B 64K
  - memory/review/class-B/cron defaults stay on their existing Codex lanes
  - Hermes and QQ c2c behavior stay frozen
- routing consequence:
  - `/qw` becomes the canonical main-session shortcut for the desktop-local Qwen 9B 64K lane
  - `/gemma` remains the manual desktop-local 26B lane
  - `/new` and `/reset` should resolve back to the same Qwen-default route instead of an older Codex/Gemma-default route
  - legacy instance-specific `/local` shortcuts may remain where they already exist, but they are no longer the canonical path for the default local route
- current architectural blocker that had to be closed before the default switch can be trusted:
  - NAS relay health alone was not enough
  - at verification time, the relay still exposed only:
    - `remoteModels=["qwen2.5vl:7b"]`
  - and the Mac reverse tunnel was down:
    - `ai.openclaw.ollama-reverse-tunnel`
    - state `not running`
    - last exit code `255`
  - translation:
    - without relay whitelist expansion plus tunnel recovery, a default switch to any desktop-local Ollama model would point both live instances at a dead path
- architecture rule now locked:
  - any future desktop-local main-model change must be treated as a four-layer change, not a one-file config tweak:
    1. local model presence on the Mac
    2. NAS relay remote-model whitelist
    3. Mac reverse tunnel health
    4. benben/adminAI live default+fallback convergence

2026-04-16 local/cloud isolation follow-up:

- closed in this session:
  - explicit request-scoped local turns now use raw `local_direct` on all authoritative runtime paths
  - gateway/agent timestamp injection no longer hides `/lite` / `/local` / `本地...` / `日常...` from local-direct detection
  - plugin `before_dispatch` timestamp envelopes no longer let bare `/new` / `/reset` touch `local-lite-lane`
  - `/new` fast replies now also block the next ordinary turn from re-entering tiny-profile startup text
  - bare `/new` on bound `agent:main:main` sessions no longer falls through a late `/reset`-only fallback and into model generation
  - local unknown-fact replies are normalized to strict `不知道。` / `不确定。`
  - status/operator secret env leakage into journald is closed
- architectural truth to preserve:
  - explicit local turns are not just “lightweight cloud” turns
  - they are isolated local-direct turns and must not trigger cloud bootstrap context, cloud memory organization, session review, or silent cloud fallback
  - cloud full-memory behavior resumes only after returning to cloud lanes (`/main`, `/codex`, `/new`, `/reset`, or a normal non-local cloud turn)
- regression tests that should remain mandatory after any future runtime upgrade:
  - gateway/agent `/new -> ordinary follow-up`
  - bound main-session `/new -> /status`
  - timestamp-enveloped plugin event `body='[...]/new'` must not trigger `local-lite-lane` hot probe
  - gateway/agent request-scoped `/lite <message>`
  - reply/webhook request-scoped `/lite <message>`
  - session-scoped `/lite -> ordinary turn -> /main`
  - local unknown fact must stay `不知道。` / `不确定。`
  - secret-bearing env must not appear in journald during `openclaw status --json` / `openclaw-adminai status --json`
- remaining watch item:
  - any new ingress path that prepends metadata or timestamp envelopes must either preserve the raw leading local prefix or strip the envelope before local-direct detection

2026-04-16 late-night memory-core follow-up:

- closed in this session:
  - shared `memory_search` fallback no longer throws a second `ReferenceError` on the unavailable path
  - `scopedContext` now lives outside the `try` body in the maintained memory-core phase1 cutover source and in live `dist/extensions/memory-core/index.js`
- architectural truth to preserve:
  - `memory_search` error handling must always degrade to a grounded unavailable payload
  - the fallback path must not throw after a real retrieval failure, otherwise cloud main will answer from non-grounded context and look memory-confused
  - fresh `/new` cloud recall can legitimately cite `USER.md` and `memory/stable/self/*`; do not misclassify that as local-lite leakage unless local-lite-only facts appear without cloud sources
- regression tests that should remain mandatory after any future runtime upgrade:
  - `workspace/tools/tests/memory-core-phase1-cutover.test.mjs` must continue asserting that `scopedContext` is declared before the `try`
  - fresh `/new -> 你知道我要考试吗` should cite `memory/stable/self/life-planning.verified.md`
  - fresh `/new -> 你现在记忆里有什么啊` should cite cloud stable sources (`USER.md`, `memory/stable/self/*`) rather than drifting into uncited free-form recall

2026-04-17 adminAI ops-role follow-up:

- closed in this session:
  - adminAI no longer keeps semantic memory search or memory-flush compaction enabled by default
  - adminAI launcher-path replies now treat `内存状态` / `CPU 状态` / `磁盘状态` as NAS / VPS host-resource questions
  - adminAI launcher-path life-memory queries now refuse cross-instance personal recall instead of using benben-style memory
  - direct `openclaw-host-status` for adminAI no longer depends on a hard-coded benben SSH key path
- architectural truth to preserve:
  - adminAI is an ops-only instance; its main-agent role should stay aligned to host status, services, logs, tunnels, deploys, monitoring, and recovery
  - ops-only does not mean read-only: adminAI may keep broad authority to query config, modify config, restart services, and execute minimal necessary repairs inside the ops boundary
  - explicit ops requests should bias toward direct execution, not a second authorization prompt, when the live policy already grants the needed authority
  - internal direct/webchat sessions must not lose elevated ops authority purely because `ctx.Provider` is empty; elevated gating should be able to use `OriginatingChannel` / `Surface`
  - documented high-frequency ops helpers should exist as real commands in PATH, not just as shell-login aliases
  - self-restart actions for the current gateway should use delayed restart wrappers so the current reply can finish before the process exits
  - adminAI should not advertise or default to `memory status` / `memory-ops status` as its primary operator entry
  - host/resource questions should prefer `openclaw-host-status` over generic OpenClaw memory/admin tooling
  - service-user workspace tools must derive per-instance SSH defaults from the current service home, not from benben hard-coded paths
- regression tests / smoke that should remain mandatory after future runtime or config upgrades:
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-host-status --host all --summary`
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "内存状态" --json`
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "你知道我要考试吗" --json`
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai config validate --json`
- remaining watch item:
  - adminAI still retains broad exec/sudo power from the existing host policy; this repair intentionally fixed role behavior and host-status usability, but did not yet tighten the underlying privileged execution surface
  - if future model behavior drifts again on config/log/systemd requests, the first place to check is the shared `pi-embedded` adminAI ops prompt chunk and the `adminai-ops` workspace skill
  - benben memory health is now green again, but preserve this rule: internal `agent:main:explicit:*` audit/smoke sessions are not user-facing memory-review debt and must not be counted toward `rolled sessions missed auto review`
  - the session-review pending/debt path should prefer real external channel/origin context (`deliveryContext`, `lastChannel`, `origin.surface/provider`, concrete `agent:main:feishu:*` / `agent:main:telegram:*`) over broad `agent:main:*` pattern matching
  - if `stable-trim` resurfaces later on compat files, first check for ownership drift or freshly created manual backup files inside active `memory/stable/compat/`; the 2026-04-18 cleanup proved that a root-owned compat file and a temporary `.bak-codex-trimfix-*` rollback copy can both create false follow-up trim recommendations without indicating a live memory bug
  - retry-tail debt is now closed again (`historical_tail_count=0`); if it reappears later, treat it as a fresh audit signal and confirm whether it is truly active retry backlog or just another low-signal historical sample before retiring it

2026-04-21 Anyone.ai provider architecture note:

- new capability added:
  - both live instances now expose an optional `anyone` provider through the normal provider registry, backed by `ANYONE_API_KEY`
  - current live Anyone model refs:
    - `anyone/gpt-5.4`
    - `anyone/gpt-5.3-codex`
- architectural truth to preserve:
  - this note reflects the initial additive-only enablement phase and is superseded by the later same-day `Anyone main-lane architecture follow-up`
  - `anyone` first landed as an additive provider before the default-route cutover
  - keep Anyone credentials isolated in `ANYONE_API_KEY`; do not overload `OPENAI_API_KEY`, because other runtime helpers still depend on the canonical OpenAI env name
  - when a provider is added live, the matching repo source-of-truth config must be updated in the same session to avoid rollout drift
- regression / smoke to preserve after future config or package updates:
  - both live configs still contain `models.providers.anyone`
  - both gateway env files still carry the managed `ANYONE_API_KEY` block
  - both gateway services restart cleanly with the expected main-lane model for the current deployment phase
  - direct NAS-side `POST https://api.anyone.ai/v1/responses` using the live env key still returns a valid `gpt-5.4` response

2026-04-21 Anyone main-lane architecture follow-up:

- this note supersedes the earlier same-day statement that `anyone` was additive-only
- current cloud-lane truth:
  - the main default lane for both benben and adminAI is now `anyone/gpt-5.4`
  - the legacy official Codex lane remains available as `openai-codex/gpt-5.4`
  - bare `/codex` is no longer just “return to default cloud lane”; it is a dedicated legacy-Codex route
  - bare `/anyone` is now the dedicated explicit Anyone route
  - bare `/main`, `/new`, and `/reset` return to the current default cloud lane `anyone/gpt-5.4`
- runtime architecture truth to preserve:
  - config alone was insufficient to preserve `/codex` semantics after changing the default model
  - the decisive fix was in `server.impl-BxLfE9ri.js`:
    - bare route parsing now recognizes `/anyone`
    - bare `/codex` injects `modelAlias = "codex"`
    - bare `/anyone` injects `modelAlias = "anyone"`
    - synthetic bare-route replies now report the selected model ref when a bare route explicitly selected one, instead of always echoing the default model
  - this keeps default-route selection and explicit-route selection separate, which is the required architecture for future multi-cloud main-lane changes
- observed limitation:
  - `/model anyone` and `/model anyone/gpt-5.4` were not reliable enough in this live setup when moving back from legacy Codex; smoke showed the session store could remain pinned on `openai-codex/gpt-5.4`
  - therefore the stable user-facing contract is:
    - use bare `/anyone` for explicit Anyone switching
    - use bare `/codex` for explicit legacy Codex switching
- regression / smoke to preserve after future runtime or config changes:
  - fresh `/new` on benben/adminAI should resolve to `provider=anyone`, `model=gpt-5.4`
  - bare `/codex -> /status` on benben/adminAI should resolve to `provider=openai-codex`, `model=gpt-5.4`
  - bare `/anyone -> ordinary follow-up` on benben/adminAI should resolve to `provider=anyone`, `model=gpt-5.4`
  - bare `/main` after `/lite` should still resolve to the cloud default `anyone/gpt-5.4`

2026-04-21 Anyone status-surface note:

- the route cutover exposed a separate status-surface bug:
  - clear-route lifecycle actions can leave `providerOverride` / `modelOverride` as empty strings
  - the status builder must treat empty strings as absent, not as real selected provider/model values
- current architecture truth:
  - the stable status surface for the Anyone default lane now prefers:
    1. explicit override when present and non-empty
    2. session-recorded `modelProvider` / `model`
    3. configured default only as the last fallback
- regression / smoke to preserve:
  - fresh Anyone-default `/status` on benben/adminAI must report `模型：anyone/gpt-5.4`
  - the same fix must not break legacy Codex route reporting; `/codex -> /status` must still report `openai-codex/gpt-5.4`

2026-04-22 direct-main owner/couple memory_v2 routing note:

- runtime truth to preserve:
  - benben direct `agent:main:main` sessions can reach `memory_search` with the query already rewritten into third-person owner proxy forms such as `用户...`
  - the stable fix surface is `workspace/tools/memory-v2-helper.mjs`, not the legacy phase1 manifest fallback
- routing rule that must remain true:
  - for direct benben main sessions with unresolved sender, rewritten owner proxy queries (`用户...` / `user ...`) that match owner long-term, owner preference, or owner current intent and do not explicitly mention partner / assistant / couple must still classify into `memory_v2`
  - owner proxy recent/current questions should stay on `private_self_state`
  - owner proxy academic planning (`考试/备考/复习/学业/读研/申请/港校/香港/exam/study/grad/apply`) must stay on `owner_profile` so owner current plus stable owner are both available
  - rewritten couple planning questions must continue to land on `couple_current_state`
- durable memory rule:
  - long-term plans that should survive current-state decay must be promoted into `memory_v2/facts/stable/owner.yaml` as `long_term_anchor`
  - do not leave durable owner life-planning facts only in `owner-current.md`
- regression / smoke to preserve after future runtime or config changes:
  - local regression: `workspace/tools/tests/memory-v2.test.mjs`
    - unresolved direct main sender still treats owner proxy planning query as `owner_profile`
    - unresolved direct main sender keeps owner proxy academic planning on `owner_profile` instead of `private_self_state`
    - unresolved direct main sender still treats owner proxy preference query as `owner_profile`
    - unresolved direct main sender still treats owner proxy recent-state query as `private_self_state`
    - unresolved direct main sender still routes third-person couple planning query into `couple_current_state`
  - benben live smoke should keep returning `reason=memory_v2_scoped` for:
    - `那你知道我想去香港读研吗`
    - `用户是否想去香港读研 香港 读研 研究生 留学 想去香港`
    - `用户考试规划 学业 备考 复习 exam study plan`
    - `用户喜欢什么 偏好 习惯`
    - `用户最近在忙什么 近期 状态 计划`
    - `用户和对象最近计划什么时候见面 行程 安排`
- explicit non-goals:
  - do not loosen adminAI `ops-only`
  - do not re-open legacy manifest / self-topic fallback for this class of owner questions

2026-04-22 resolved owner-DM identity / planning note:

- runtime truth to preserve:
  - the real benben Feishu owner chat should be reasoned about as a resolved owner DM, not as `agent:main:main`
  - current canonical real-user session shape:
    - `serviceId=benben`
    - `routingLane=cloud`
    - `memoryPolicy=cloud_full`
    - `sessionKey=agent:main:feishu:default:direct:<owner-id>`
- routing rule that must remain true:
  - in a resolved owner DM, `你记得我的个人规划吗` must classify into `owner_profile`, not fall back to legacy manifest/self-only recall
  - in a resolved owner DM, rewritten owner-proxy queries such as `用户现在偏好什么` should still classify into `owner_profile`
  - in a resolved owner DM, partner-pronoun questions must not be swallowed by owner self/profile routing:
    - `用户最近和她在忙什么` -> `partner_current_shared`
    - `我想知道她最近备考怎么样` -> `partner_current_shared`
  - owner current-state routing should only win when the query is actually about recent/current state, not when it is asking stable preference/profile
- startup identity rule that must remain true:
  - `workspace/IDENTITY.md` and `workspace/USER.md` are part of the effective main-session self/user disambiguation surface
  - they must keep an explicit distinction between:
    - `你是谁 / 你叫什么 / 你能做什么` -> assistant (`笨笨`)
    - `我是谁 / 你知道我是谁吗` -> user (`张锦程`)
  - this is required because not every identity-style turn is guaranteed to rely on `memory_search`
- regression / smoke to preserve:
  - local regression: `workspace/tools/tests/memory-v2.test.mjs`
    - assistant identity query routes into `assistant_profile`
    - owner direct DM personal-planning query routes into `owner_profile`
    - resolved owner direct DM still treats owner proxy preference query as `owner_profile`
    - resolved owner direct DM routes partner pronoun recent query into `partner_current_shared`
    - resolved owner direct DM does not let partner pronoun planning query fall back to `owner_profile`
  - benben runtime smoke should keep succeeding for:
    - `你是谁`
    - `你知道我是谁吗`
    - `你记得我的个人规划吗`
    - `我想知道她最近备考怎么样`
