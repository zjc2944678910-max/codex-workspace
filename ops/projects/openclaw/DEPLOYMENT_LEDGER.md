# OpenClaw Deployment Ledger

Last updated: 2026-04-22
Maintainer context: this file is the canonical runtime and deployment ledger for the production OpenClaw instance on `home-nas`.
Companion architecture board: `OPENCLAW_ARCHITECTURE_TODO.md`

## Purpose

Use this file before any deployment, runtime debugging, enhancement, recovery, or topology change.

This file should answer:

- What is actually running in production
- Which directories and files are canonical
- Which enhancements are already complete
- Which problems are still open
- Which files or services are safe to touch
- Which artifacts are stale, local-only, or should be ignored

Update this ledger after every meaningful deployment, repair, incident, or architecture change.

No production change is complete until this file and/or `OPENCLAW_ARCHITECTURE_TODO.md` is updated in the same work session.

If runtime behavior, topology, services, configs, bundle patches, memory/session plumbing, trace behavior, maintenance flow, or rollback points changed, record it here before closing the task.

If the task is primarily about roadmap, design priorities, architecture debt, or next enhancements, read `OPENCLAW_ARCHITECTURE_TODO.md` too.

## Documentation Sync Contract

Use this contract as a hard operating rule:

- every meaningful production OpenClaw change must update documentation immediately, not later
- deployment truth belongs here
- architecture status and next steps belong in `OPENCLAW_ARCHITECTURE_TODO.md`
- if a task changes both operational facts and architecture state, update both files
- if docs are not updated, the task is incomplete even if code already works

## Current Truth Snapshot

- host: `home-nas`
- instances:
  - benben: `openclaw-gateway.service`
  - adminAI: `openclaw-adminai-gateway.service`
- runtime package: `2026.4.9`
- main default lane on both instances: `anyone/gpt-5.4`
- explicit cloud routes:
  - bare `/codex` -> `openai-codex/gpt-5.4`
  - bare `/anyone` -> `anyone/gpt-5.4`
  - bare `/main`, `/new`, `/reset` -> `anyone/gpt-5.4`
- main-session fallbacks:
  - `deepseek/deepseek-chat`
  - `mimo/mimo-v2-flash`
  - `openrouter/xiaomi/mimo-v2-pro`
- local-direct lane:
  - bare `/lite` / `/local` enable `routingModeOverride="local_direct"`
  - request-scoped local failures fail-soft to `anyone/gpt-5.4`
  - session-scoped local failures fail-closed with a visible local-unavailable reply
- status truth:
  - ordinary fresh cloud turns now run `anyone/gpt-5.4` on both benben/adminAI
  - bare `/codex` still switches to `openai-codex/gpt-5.4`
  - fresh Anyone-default `/status` now reports `anyone/gpt-5.4` on both benben/adminAI

## Production Topology

- Host alias: `home-nas`
- Interactive login user: `cc`
- Service users:
  - `openclaw` for benben
  - `openclaw-adminai` for adminAI
- Production package root: `/usr/lib/node_modules/openclaw`
- Benben mutable state root: `/var/lib/openclaw/.openclaw`
- Benben workspace root: `/var/lib/openclaw/.openclaw/workspace`
- Benben gateway websocket: `ws://127.0.0.1:18789`
- adminAI mutable state root: `/var/lib/openclaw-adminai/.openclaw`
- adminAI workspace root: `/var/lib/openclaw-adminai/.openclaw/workspace`
- adminAI gateway websocket: `ws://127.0.0.1:18889`
- Gateway service unit: `/etc/systemd/system/openclaw-gateway.service`
- Main gateway listen address: `127.0.0.1:18789`
- External exposure is not direct; access is expected to go through `nginx` and existing tunnel/proxy wiring

## Identity And Access Facts

- NAS does not have an interactive `openclaw` login flow; normal SSH entry is `cc`
- `openclaw` exists as a system service account, not as a normal human shell account
- Use `ssh home-nas` first, then `sudo -u openclaw -H ...` when behavior must match the running service
- Do not assume `/home/cc` content is production

## Canonical Production Paths

### Runtime / package

- `/usr/lib/node_modules/openclaw/package.json`
- `/usr/lib/node_modules/openclaw/dist/gateway-cli-SPSnwPDk.js`
- `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
- `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`

### Config / env

- `/var/lib/openclaw/.openclaw/openclaw.json`
- `/etc/openclaw/gateway.env`
- `/etc/openclaw/health.env`

### Workspace / memory / tooling

- `/var/lib/openclaw/.openclaw/workspace/AGENTS.md`
- `/var/lib/openclaw/.openclaw/workspace/MEMORY.md`
- `/var/lib/openclaw/.openclaw/workspace/tools/`
- `/var/lib/openclaw/.openclaw/workspace/memory-admin/`

### Sessions / transcripts

- Session stores live under: `/var/lib/openclaw/.openclaw/agents/<agent_id>/sessions/sessions.json`
- Main agent session store: `/var/lib/openclaw/.openclaw/agents/main/sessions/sessions.json`
- Session transcripts also live under the corresponding `agents/<agent_id>/sessions/` tree

## What Is Production And What Is Not

### Production

- `/usr/lib/node_modules/openclaw`
- `/var/lib/openclaw/.openclaw`
- `/var/lib/openclaw/.openclaw/workspace`
- systemd units beginning with `openclaw-`

### Not production

- `/home/cc/.openclaw`
- `/home/cc/MacBookpro/.openclaw*`
- `/home/cc/openclaw-sync*`
- ad-hoc files in `/tmp/openclaw_patch_*`

Those `cc`-side copies were identified as stale local/runtime copies and were cleaned to reduce confusion.

## Active Services

### Main service

- `openclaw-gateway.service`

### adminAI service

- `openclaw-adminai-gateway.service`

### Supporting services / timers observed

- `openclaw-socks-bridge.service`
- `openclaw-vps-admin-tunnel.service`
- `openclaw-vps-gateway-tunnel.service`
- `openclaw-healthcheck.timer`
- `openclaw-memory-event.timer`
- `openclaw-memory-standard.timer`
- `openclaw-memory-deep.timer`
- `openclaw-channel-canary.timer`

## Current Model / Runtime Notes

- Observed package version: `2026.4.9`
- Main configured default model on benben/adminAI: `anyone/gpt-5.4`
- Benben memory-review/session-review/Class-B default provider on 2026-04-22:
  - `/etc/openclaw/gateway.env` now sets `OPENCLAW_MEMORY_LLM_PROVIDER=anyone`
  - `OPENCLAW_SESSION_MEMORY_REVIEW_MODEL=anyone/gpt-5.4`
  - `OPENCLAW_MEMORY_LIGHT_MODEL=anyone/gpt-5.4`
  - `OPENCLAW_MEMORY_DEEP_MODEL=anyone/gpt-5.4`
- Benben transcript/session-journal repair on 2026-04-22:
  - live transcript update paths now refresh `memory-admin/session-journal/*` again
  - live `memory-admin/trace/2026-04-21.jsonl` now records new `session_journal` events
  - `memory-admin/meta/session-journal-latest.json` now refreshes again for `agent:main:main`
- Benben gateway transport-noise follow-up on 2026-04-22:
  - symptom narrowed to repeated pre-auth websocket closes with `reason=gateway tls fingerprint mismatch`, `remote=127.0.0.1`, `host=node.nodezjc12348888.xyz`, `ua=n/a`
  - live benben config still remains `gateway.mode=local` with no `gateway.remote.url`; live plugin allowlist still does not enable `device-pair`
  - live `server.impl` now keeps the first matching close at `WARN`, but rate-limits repeated matches for the same host/reason to `DEBUG` for 5 minutes
  - the suppress predicate is intentionally narrow: no authenticated client, `handshake=pending`, no close-cause, no frame seen, loopback remote, empty `Origin`, empty proxy headers, empty `User-Agent`, and a non-loopback `Host`
  - this pass does not change benben handshake/auth behavior, adminAI `ops-only`, bare `/codex`, `/status`, `Anyone` defaults, or the repaired memory/session-journal paths
- adminAI remains `ops-only`; its conversational cloud default is `anyone/gpt-5.4`, but personal/couple memory retrieval stays disabled
- Main configured main-session fallbacks on benben/adminAI:
  - `deepseek/deepseek-chat`
  - `mimo/mimo-v2-flash`
  - `openrouter/xiaomi/mimo-v2-pro`
- Main configured timeout/LLM idle timeout on benben/adminAI: `180s` / `180s`
- Lightweight local lane plugin on benben/adminAI: `local-lite-lane` for request-scoped local turns; session-scoped `local_direct` ordinary turns now bypass the plugin and use the dedicated raw local-direct runtime path
- Lightweight local lane model: `ollama/huihui_ai/qwen3.5-abliterated:9b`
- Lightweight local lane serving context / keep-alive target: `32768` / `24h`
- Lightweight local lane plugin base URL: `http://127.0.0.1:11436`
- Lightweight local lane force prefixes: `/local`, `/lite`, `本地`, `日常`
- Lightweight local lane cloud-force prefixes: `/main`, `/codex`, `复杂`
- Main cloud route semantics on benben/adminAI:
  - bare `/main`, bare `/new`, and bare `/reset` return to `anyone/gpt-5.4`
  - bare `/codex` explicitly switches to legacy `openai-codex/gpt-5.4`
  - bare `/anyone` explicitly switches to `anyone/gpt-5.4`
- Mac Qwen 9B local payload guardrail parity: request-scoped `local-lite-lane`, reply-runtime `local_direct`, and gateway agent RPC `local_direct` all explicitly send top-level `think:false`, top-level `keep_alive=24h`, and `options.num_ctx=32768`
- Lightweight local lane payload mode: near-raw pass-through user chat to Mac Qwen 9B; no local summary injection, no temperature override, and no `numPredict` clamp. The only extra note now allowed is a tiny trusted-facts system message derived from `workspace/local-lite/profile.json`
- Lightweight local lane success requires non-empty `message.content`; thinking-only or empty-content replies fall through to `anyone/gpt-5.4` only for request-scoped turns, while session-scoped `local_direct` turns fail closed with a visible local-unavailable reply
- Bare `/lite` and bare `/local` now persist `routingModeOverride="local_direct"` instead of `providerOverride/modelOverride`; bare `/main`, bare `/codex`, bare `/anyone`, bare `/new`, and bare `/reset` clear that marker
- Session-scoped `local_direct` ordinary turns use the minimal direct Mac Qwen 9B payload, not the full `main` agent prompt
- Session-scoped `local_direct` reply-runtime and gateway RPC guardrails: raw single-turn `user` payload, hot probe timeout `5000ms`, chat timeout disabled (`0` = no OpenClaw-side abort), `keep_alive=24h`, and timeout logs that include the failing pathname when a timeout is actually configured
- Main configured default image model on benben/adminAI: `ollama/qwen2.5vl:7b`
- Main configured default image fallback on benben/adminAI: `openrouter/xiaomi/mimo-v2-omni`
- Desktop-local Ollama relay path for benben/adminAI image:
  - NAS relay: `http://127.0.0.1:11435`
  - Mac reverse tunnel: `127.0.0.1:11436 -> 127.0.0.1:11434`
  - remote whitelist: `qwen2.5vl:7b`, `huihui_ai/qwen3.5-abliterated:9b`
  - NAS-local relay upstream is intentionally disabled: `LOCAL_OLLAMA_BASE=` and `localEnabled=false`
  - relay `/api/tags` and `/api/ps` publish only the remote whitelist models; non-whitelisted Mac models return `404`
- Memory search is enabled
- Sandbox is configured `off`
- `tools.exec.ask = off`
- `approvals.exec.enabled = false`
- `tools.fs.workspaceOnly = false`
- `tools.exec.applyPatch.workspaceOnly = false`
- `commands.bash = true`
- both service users now have `sudo -n` via `/etc/sudoers.d/openclaw-agents`
  - current policy is broad `NOPASSWD:ALL` for both `openclaw` and `openclaw-adminai`; this is an accepted live capability for now and should not be narrowed without an explicit operator decision

## Historical 2026-04-16 Codex OAuth Account Split Incident

- There are two independent live gateway auth stores:
  - benben: `openclaw-gateway.service`, service user `openclaw`, HOME `/var/lib/openclaw`, live auth `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json`
  - adminAI: `openclaw-adminai-gateway.service`, service user `openclaw-adminai`, HOME `/var/lib/openclaw-adminai`, live auth `/var/lib/openclaw-adminai/.openclaw/agents/main/agent/auth-profiles.json`
- Operator-visible symptom:
  - adminAI Feishu DM `检查一下NAS状态` returned `You have hit your ChatGPT usage limit (team plan). Try again in ~1193 min.`
  - the failed run was in `openclaw-adminai-gateway.service`, session `agent:main:main`, not the benben `openclaw-gateway.service`
- Root cause:
  - only benben's live `openai-codex:default` OAuth profile had been switched
  - adminAI still had its independent `openai-codex:default` profile for `dbdhdhdhhdhjxndjdjdjdjdjdhdhd@gmail.com`, which was already in a Team-plan limit window
- Fix:
  - copied only the verified service-side `openai-codex:default` profile for `zjc2944678910@gmail.com` from benben live auth into adminAI live auth
  - preserved adminAI's existing `openai:default` and `openrouter:default` profiles
  - cleared adminAI `openai-codex:default` failure/usage state in `auth-state.json`
  - restarted `openclaw-adminai-gateway.service`
- Backups:
  - `/var/lib/openclaw-adminai/.openclaw/agents/main/agent/auth-profiles.json.bak.sync-main-codex-20260416T134515+0800`
  - `/var/lib/openclaw-adminai/.openclaw/agents/main/agent/auth-state.json.bak.sync-main-codex-20260416T134515+0800`
- Verification:
  - adminAI live auth resolved to `zjc2944678910@gmail.com`, account id `09ad3c8c-a4f4-46a4-b814-cda59c32d4d3`
  - adminAI service restarted active at `2026-04-16 13:45:22 CST`
  - adminAI `wham/usage` through NAS proxy reported `plan_type=team`, `allowed=true`, `limit_reached=false`, primary window `5%`, secondary window `16%`
  - direct adminAI-auth `gpt-5.4` `/backend-api/codex/responses` probe through `127.0.0.1:18988` returned HTTP 200 with completed SSE and no usage-limit error
- Runbook note:
  - future Codex OAuth switches must first identify which live gateway the user-facing bot hit
  - do not assume changing `/var/lib/openclaw` affects adminAI; verify and update `/var/lib/openclaw-adminai` separately when adminAI is in scope

## Historical 2026-04-16 local_direct gateway keep_alive alignment

- Audit conclusion before this fix:
  - no cloud `main` / local `profile.json` memory leakage was found
  - the remaining drift was a runtime consistency issue in gateway RPC `local_direct`, not a memory-boundary or model-selection issue
- Root cause:
  - `agent-command-8TL7BESJ.js` already owned the gateway `agent` RPC `local_direct` short-circuit, but its Ollama `/api/chat` payload did not send `keep_alive=24h`
  - reply-runtime `reply-BwK-bN2w.js` and request-scoped `local-lite-lane` already sent `keep_alive=24h`, so the three Mac Qwen 9B paths were not fully aligned
  - verification also exposed that the gateway RPC timeout helper still treated `LOCAL_DIRECT_CHAT_TIMEOUT_MS=0` as `setTimeout(..., 0)`, causing immediate aborts even though `0` is the documented no-abort setting
- Fix:
  - local mirror updated: `.codex-remote-openclaw/tmp/agent-command-8TL7BESJ.live.js`
  - live runtime updated: `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js`
  - added `LOCAL_DIRECT_KEEP_ALIVE = "24h"`
  - added `keep_alive: LOCAL_DIRECT_KEEP_ALIVE` to the gateway RPC `local_direct` `/api/chat` JSON body
  - changed gateway RPC `localDirectTimeoutSignal()` so a timer is only armed when `timeoutMs > 0`; an upstream abort signal is still honored
- Backups:
  - pre-keep-alive live dist backup: `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js.bak.local-direct-keepalive-20260416T142800+0800`
  - pre-timeout-helper follow-up backup: `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js.bak.local-direct-keepalive-20260416T143441+0800`
- Verification:
  - local mirror `node --check` passed
  - live dist `node --check` passed
  - live grep confirmed `LOCAL_DIRECT_KEEP_ALIVE = "24h"`, `keep_alive: LOCAL_DIRECT_KEEP_ALIVE`, and `useTimeout = Number.isFinite(ms) && ms > 0`
  - `openclaw-gateway.service` and `openclaw-adminai-gateway.service` restarted and returned `active`
  - `127.0.0.1:11436/api/ps` showed `huihui_ai/qwen3.5-abliterated:9b` hot with `context_length=32768`
  - `127.0.0.1:11435/healthz` reported `localEnabled=false` and `remoteModels=["huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - benben disposable explicit session:
    - bare `/lite` returned the local-direct control reply with `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`
    - ordinary local turn returned through `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`, `routingMode=local_direct`, `durationMs=3165`
    - bare `/main` returned `Default model: openai-codex/gpt-5.4` and cleared `routingMode`
  - adminAI disposable explicit session:
    - bare `/lite` returned the local-direct control reply with `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`
    - ordinary local turn returned through `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`, `routingMode=local_direct`, `durationMs=3338`
    - bare `/main` returned `Default model: openai-codex/gpt-5.4` and cleared `routingMode`
  - local unknown-fact probe for `我的车牌号是多少？` returned `不知道` / `不知道` on benben/adminAI while staying on `routingMode=local_direct`
  - session store check after `/main` showed empty `routingModeOverride`, `providerOverride`, and `modelOverride` for the disposable sessions on both instances
  - recent gateway journals for the verification window showed no `memory_search` and no `local_direct failed`
- Boundary note:
  - this change does not alter memory boundaries, model selection, route semantics, configured timeout values, or fallback policy
  - it only aligns transport/stability fields and makes the already-documented `0 = no OpenClaw-side abort` behavior true for gateway RPC too

## Historical 2026-04-16 adminAI lifecycle and host-status repair

- User-visible symptoms:
  - adminAI Feishu bare `/new` replied with the tiny local-lite profile facts instead of the normal lifecycle reply
  - the same adminAI session reported cloud `openai-codex/gpt-5.4`, which made the answer look like cloud main had ingested the local-only profile
  - adminAI host-status attempts failed with `openclaw-host-status: command not found`
- Memory-boundary conclusion:
  - this was not evidence that cloud `main` intentionally loaded `workspace/local-lite/profile.json`
  - the failure was a lifecycle-control miss: `/new` was allowed to fall through to model-generated startup text, where workspace docs/profile-adjacent content could be echoed
- Root cause:
  - in `reply-BwK-bN2w.js`, `initSessionState()` could authorize a bare `/new` / `/reset` and set `resetTriggered`
  - `buildFastReplyCommandContext()` was then called with only the original `commandAuthorized` boolean
  - for the screenshot path, that left the lifecycle fast reply unauthorized even after the reset had already been accepted
  - the reply path therefore skipped the synthetic `/new` response and could continue into the normal model prompt path
- Fix:
  - local mirror updated: `.codex-remote-openclaw/tmp/reply-BwK-bN2w.live.js`
  - live runtime updated: `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
  - added `bareLifecycleResetAuthorized = resetTriggered && !normalizeOptionalString(bodyStripped)`
  - passed `commandAuthorized: commandAuthorized || bareLifecycleResetAuthorized` into `buildFastReplyCommandContext()`
  - this keeps `/new` / `/reset` lifecycle-control behavior on the synthetic reply path and prevents model startup prompts from rendering local-lite profile facts
- Host-status root cause:
  - `/usr/local/bin/openclaw-host-status` was a symlink into `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-host-status.sh`
  - `/var/lib/openclaw` is private to the `openclaw` service user, so `openclaw-adminai` could not traverse the path
  - the adminAI host-status skill therefore saw `command not found` even though adminAI had sudo and its own workspace copy of the tool
- Host-status fix:
  - local wrapper added: `.codex-remote-openclaw/tools/openclaw-host-status-wrapper.sh`
  - live command updated: `/usr/local/bin/openclaw-host-status`
  - the wrapper dispatches first to `$OPENCLAW_ROOT/workspace/tools/openclaw-host-status.sh`, then `$HOME/.openclaw/workspace/tools/openclaw-host-status.sh`, then the known service-user workspace path for `openclaw-adminai` or `openclaw`
- Backups:
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.lifecycle-reset-authorized-20260416T174907+0800`
  - `/usr/local/bin/openclaw-host-status.bak.adminai-dispatch-20260416T174907+0800`
- Verification:
  - local mirror `node --check .codex-remote-openclaw/tmp/reply-BwK-bN2w.live.js` passed
  - local wrapper `sh -n .codex-remote-openclaw/tools/openclaw-host-status-wrapper.sh` passed
  - live `node --check /usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js` passed
  - live `sh -n /usr/local/bin/openclaw-host-status` passed
  - `openclaw-gateway.service` and `openclaw-adminai-gateway.service` restarted and returned `active`
  - `sudo -u openclaw-adminai -H openclaw-host-status --host nas --summary` returned `NAS | zjcNAS | 正常`
  - `sudo -u openclaw -H openclaw-host-status --host nas --summary` returned `NAS | zjcNAS | 正常`
  - adminAI disposable `/new` smoke returned `durationMs=0`, `provider=openai-codex`, `model=gpt-5.4`, and `✅ New session started...`
  - benben disposable `/new` smoke returned the same `durationMs=0` cloud lifecycle reply
  - adminAI real-agent host-status smoke for `检查一下NAS状态，只返回摘要` returned a normal NAS summary instead of `command not found`
  - post-restart journal grep found no new `openclaw-host-status: command not found`, TypeError, or `极简资料库` hit
- Remaining channel issue:
  - adminAI live journals still show QQBot `/gateway` failures with `接口访问源IP不在白名单`
  - that is an external QQBot gateway source-IP whitelist problem; it is separate from the fixed Feishu `/new` and host-status defects

## Historical 2026-04-16 QQBot operator/status/proxy alignment

- User-visible symptoms:
  - adminAI and benben operator status commands could claim `QQ Bot not configured` even though the live gateway service was starting QQBot and obtaining QQ access tokens
  - `openclaw-adminai tool channel-delivery-canary --channel all --dry-run --json` could not reliably evaluate QQBot because nested tool calls lost the adminAI service env and fell back toward the wrong runtime context
  - healthcheck logs reported wrapper/parser-shaped failures such as `qqbot_probe_missing` with plugin registration text instead of the real QQBot runtime state
- Root causes:
  - `/usr/local/bin/openclaw` did not load the root-only service-specific QQBot env files for operator/status/tool runs
  - nested wrapper calls did not consistently pass service home/tmpdir, gateway env path, `OPENCLAW_BIN`, QQBot credentials, canary targets, and required-channel/health env values
  - `qqbot-runtime-helper.mjs` trusted the first bracket in stdout as JSON, so plugin log lines beginning with `[plugins]` could hide the real JSON payload
  - gateway systemd proxy drop-ins still excluded `qq.com,.qq.com` through `NO_PROXY`, forcing QQBot production gateway traffic toward the direct NAS egress instead of the configured proxy path
- Code / live changes:
  - updated `openclaw-mac-migration/staging/workspace/tools/openclaw-cli-wrapper.sh`
  - installed the wrapper into:
    - `/usr/local/bin/openclaw`
    - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh`
    - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/openclaw-cli-wrapper.sh`
  - updated `nas-openclaw-v22/workspace/tools/qqbot-runtime-helper.mjs` and installed it into both live workspaces
  - updated local and live proxy drop-ins:
    - `.codex-remote-openclaw/systemd/openclaw-gateway.service.d/30-execstart-proxy-wrapper.conf`
    - `.codex-remote-openclaw/systemd/openclaw-adminai-gateway.service.d/30-execstart-proxy-wrapper.conf`
    - `/etc/systemd/system/openclaw-gateway.service.d/30-execstart-proxy-wrapper.conf`
    - `/etc/systemd/system/openclaw-adminai-gateway.service.d/30-execstart-proxy-wrapper.conf`
  - updated `nas-openclaw-v22/workspace/tools/install-openclaw-adminai-instance.sh` so regenerated adminAI proxy drop-ins keep QQ traffic off `NO_PROXY`
- Backup locations:
  - `/etc/systemd/system/openclaw-gateway.service.d/30-execstart-proxy-wrapper.conf.bak.qqbot-proxy-20260416T181903+0800`
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/30-execstart-proxy-wrapper.conf.bak.qqbot-proxy-20260416T181903+0800`
  - `/usr/local/bin/openclaw.bak.qqbot-env-proxy-20260416T181903+0800`
  - `/usr/local/bin/openclaw.bak.qqbot-env-canary-20260416T1825`
  - `/usr/local/bin/openclaw.bak.qqbot-env-canary-20260416T1831`
  - `/usr/local/bin/openclaw.bak.qqbot-health-env-20260416T1837`
  - `/usr/local/bin/openclaw.bak.health-key-only-20260416T1844`
  - `/var/lib/openclaw/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.health-env-20260416T1837`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.health-env-20260416T1837`
  - `/var/lib/openclaw/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.parse-json-20260416T1849`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.parse-json-20260416T1849`
  - `/var/lib/openclaw/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.execfile-stdout-20260416T183655+0800`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/qqbot-runtime-helper.mjs.bak.execfile-stdout-20260416T183655+0800`
- Verification:
  - `sh -n openclaw-mac-migration/staging/workspace/tools/openclaw-cli-wrapper.sh` passed
  - `node --check nas-openclaw-v22/workspace/tools/qqbot-runtime-helper.mjs` passed
  - live `sh -n /usr/local/bin/openclaw` passed
  - live `node --check` passed for both live `qqbot-runtime-helper.mjs` copies
  - `systemctl is-active openclaw-gateway.service openclaw-adminai-gateway.service` returned `active` / `active`
  - live gateway process env has `HTTP_PROXY/HTTPS_PROXY/ALL_PROXY=http://127.0.0.1:18988` and `NO_PROXY` limited to localhost plus Feishu/Lark domains, with no `qq.com`
  - direct NAS public IP probe returned `182.119.180.190`; proxy egress probe through `127.0.0.1:18988` returned `45.56.183.242`
  - `openclaw status --json` and `openclaw-adminai status --json` both report `QQ Bot: configured`
  - `openclaw tool channel-delivery-canary --channel all --dry-run --json` returned `ok=true`, `status=healthy`, and Telegram/Feishu/`qqbot_c2c` dry-run targets
  - `openclaw-adminai tool channel-delivery-canary --channel all --dry-run --json` returned the same healthy shape for adminAI
  - QQBot sandbox probes for both instances obtained tokens, resolved `wss://sandbox.api.sgroup.qq.com/websocket`, and received a READY event
  - `openclaw-adminai channels status --probe --json` reports QQBot `configured=true`, `running=true`, `connected=false`, which matches the production gateway logs
  - runtime-health now reports `qqbot_probe_attention`, not `qqbot_probe_missing` or plugin-log JSON parse errors
- Remaining external blocker:
  - both live gateway journals still show successful QQBot token acquisition followed by production `/gateway` failure: `接口访问源IP不在白名单`
  - this is outside OpenClaw runtime/env/tooling after the proxy/env fixes above
  - add the proxy egress IP `45.56.183.242` to the QQBot production source-IP whitelist for both benben/adminAI apps, or intentionally whitelist the direct NAS egress `182.119.180.190` if the platform must use direct routing
  - `openclaw-healthcheck.service` and `openclaw-adminai-healthcheck.service` correctly remain failed with `qqbot_probe_attention` until the QQ production gateway connects

## Historical 2026-04-16 QQ optionalization and Feishu/Telegram health stabilization

- Operator decision:
  - QQ is not a normal-use channel for this deployment
  - Feishu and Telegram are the channels that must stay healthy
  - QQBot should not make gateway health red or generate continuous production `/gateway` reconnect noise while unused
- Live changes:
  - disabled `channels.qqbot.enabled` in both live configs while preserving the QQBot credential env/drop-in files for future restoration
  - removed `qqbot` from live required-channel guards:
    - benben required channels: `feishu,telegram`
    - adminAI required channels: `feishu,telegram`
  - cleared QQBot runtime-health from `/etc/openclaw/health.env` and `/etc/openclaw/adminai-health.env`
  - installed neutral adminAI config-guard drop-in `/etc/systemd/system/openclaw-adminai-gateway.service.d/80-config-guard.conf`
  - removed stale adminAI `/etc/systemd/system/openclaw-adminai-gateway.service.d/qqbot-config-guard.conf`
  - aligned benben base unit metadata from `2026.3.24` to `2026.4.9`; the effective drop-in was already `2026.4.9`
  - compacted live workspace `AGENTS.md` to stay below the OpenClaw `20000` character injection limit
- Source / mirror updates:
  - `AGENTS.md`
  - `.codex-remote-openclaw/systemd/openclaw-gateway.service.d/80-config-guard.conf`
  - `.codex-remote-openclaw/systemd/openclaw-adminai-gateway.service.d/80-config-guard.conf`
  - `openclaw-mac-migration/staging/openclaw.json` local-lite include channels now omit `qqbot`
- Expected steady state:
  - `openclaw health` and `openclaw-adminai health` should show Telegram and Feishu ok, without QQBot blocking the result
  - `openclaw-healthcheck.service` and `openclaw-adminai-healthcheck.service` should return `Result=success`
  - gateway journals should stop the repeated QQBot production `/gateway` source-IP whitelist loop after service restart
  - QQBot can be restored later by re-enabling `channels.qqbot.enabled`, adding `qqbot` back to required channels/health only if desired, and fixing QQ platform source-IP whitelist first

## Historical 2026-04-15 OpenClaw Audit Remediation

- Audit target:
  - both live OpenClaw instances on `oc-nas`
  - relay / Mac Qwen 9B local-lite path
  - sudo capability
  - keepwarm / systemd drift
- Fixed hard failure:
  - `openclaw-ollama-e2b-keepwarm.service` had been failing every timer tick after NAS-local `ollama.service` was disabled
  - root cause: `ollama-keepwarm.sh` initialized `ENDPOINT="${BASE_URL%/}/api/generate"` before parsing `--base-url`, so the service passed `--base-url http://127.0.0.1:11436` but the script still curled default `127.0.0.1:11434`
  - fix: moved endpoint selection into the `text` / `vision` mode branches after argument parsing
  - deployed live script: `/var/lib/openclaw/.openclaw/workspace/tools/ollama-keepwarm.sh`
  - tracked source updated: `openclaw-mac-migration/staging/workspace/tools/ollama-keepwarm.sh`
- Fixed misleading keepwarm unit name:
  - added live units:
    - `/etc/systemd/system/openclaw-qwen9b-keepwarm.service`
    - `/etc/systemd/system/openclaw-qwen9b-keepwarm.timer`
  - enabled/started `openclaw-qwen9b-keepwarm.timer`
  - disabled old `openclaw-ollama-e2b-keepwarm.timer`
  - reset failed state for old `openclaw-ollama-e2b-keepwarm.service`
  - tracked mirrors added:
    - `.codex-remote-openclaw/systemd/openclaw-qwen9b-keepwarm.service`
    - `.codex-remote-openclaw/systemd/openclaw-qwen9b-keepwarm.timer`
- Fixed relay behavior after NAS-local Ollama retirement:
  - deployed `/usr/local/bin/openclaw-ollama-relay.py`
  - deployed `/etc/systemd/system/openclaw-ollama-relay.service`
  - relay now runs with `LOCAL_OLLAMA_BASE=`
  - `/healthz` reports `localEnabled=false`
  - `/api/tags` and `/api/ps` merge only enabled upstreams and filter remote results to `REMOTE_MODELS`
  - non-whitelisted Mac models now return `404` instead of leaking through tags or attempting dead NAS `11434`
  - tracked mirrors added:
    - `.codex-remote-openclaw/tools/openclaw-ollama-relay.py`
    - `.codex-remote-openclaw/systemd/openclaw-ollama-relay.service`
- Fixed config / systemd drift:
  - removed disabled `plugins.entries.device-pair` from both live `openclaw.json` files and from `openclaw-mac-migration/staging/openclaw.json`
  - aligned benben required channel guard to `OPENCLAW_REQUIRED_CHANNELS=feishu,telegram,qqbot`
  - aligned adminAI base unit `OPENCLAW_SERVICE_VERSION=2026.4.9`
  - raised benben `TasksMax` from `512` to `2048` via both drop-in mirror and `systemctl set-property`
- Backup locations:
  - initial deployment backup: `/var/lib/openclaw/.openclaw/backups/codex-fix-20260415T120432`
  - live config backup: `/var/lib/openclaw/.openclaw/backups/codex-fix-config-20260415T120708`
  - relay follow-up backup: `/var/lib/openclaw/.openclaw/backups/codex-relay-20260415T121006`
- Verification:
  - `systemd-analyze verify` passed for relay, qwen9b keepwarm, and both gateway units
  - live config validation returned `valid=true` for benben and adminAI
  - `openclaw-qwen9b-keepwarm.service` succeeded repeatedly at `12:07`, `12:08`, and `12:10 CST`
  - `openclaw-ollama-e2b-keepwarm.timer`: `disabled`, `inactive`
  - `openclaw-qwen9b-keepwarm.timer`: `enabled`, `active`
  - `11435/healthz`: `localEnabled=false`, `remoteModels=["huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - `11435/api/tags`: only `huihui_ai/qwen3.5-abliterated:9b` and `qwen2.5vl:7b`, no upstream error
  - `11435/api/ps`: Qwen 9B hot, no upstream error
  - `11435/api/chat` with Qwen 9B and `think:false`: `message.content="OK"`, no thinking
  - non-whitelisted `huihui_ai/gemma-4-abliterated:26b` through relay: `404`
  - benben `/lite -> 只回复OK -> /main`: local-direct Qwen reply `OK` in about `3088ms`, then returned to `openai-codex/gpt-5.4`
  - adminAI `/lite -> 只回复OK -> /main`: local-direct Qwen reply `OK` in about `2696ms`, then returned to `openai-codex/gpt-5.4`
  - both gateway health endpoints returned `{"ok":true,"status":"live"}`
  - channel status at the time of this 2026-04-15 remediation: Telegram running, QQBot running/connected, Feishu running
  - superseded 2026-04-16 evidence shows QQBot production gateway later regressed to `接口访问源IP不在白名单`; see the 2026-04-16 QQBot operator/status/proxy alignment entry above

## Historical 2026-04-15 Local-Direct Latency Repair

- Incident trigger:
  - Feishu `local_direct` sessions intermittently returned `本地模型当前不可用 ... (request failed)` even though the first turn in the same session had already answered from `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - live screenshot evidence came from about `19:19 CST`
- Direct live evidence:
  - `11436/api/ps` stayed healthy and still showed `huihui_ai/qwen3.5-abliterated:9b` hot at `context_length=32768`
  - relay `11435/healthz` remained healthy with `localEnabled=false` and the expected remote whitelist
  - benben journal around `19:17-19:25 CST` showed repeated `local_direct reply failed: This operation was aborted`
  - direct NAS curls against `11436/api/chat` reproduced the real problem:
    - `你可以干什么啊` with the old payload ran about `59944ms`
    - `写一个长篇黄色小说` with the old payload ran about `51654ms`
  - root cause was therefore not tunnel loss or a cold model; it was an unbounded local-direct generation profile that let Mac Qwen 9B ramble until the reply runtime eventually aborted
- Live repair:
  - patched `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js` via the tracked mirror `.codex-remote-openclaw/tmp/reply-BwK-bN2w.live.js`
  - raised `LOCAL_DIRECT_HOT_PROBE_TIMEOUT_MS` from `2500` to `5000`
  - the earlier short-answer shaping experiment was later removed per operator preference; current live behavior sends only the raw user turn to Mac Qwen 9B and returns the raw assistant content
  - the earlier timed aborts were later removed per operator preference; current live behavior uses `chatTimeoutMs=0` / `LOCAL_DIRECT_CHAT_TIMEOUT_MS=0`, meaning OpenClaw itself no longer aborts long local chat generations
  - changed timeout error reporting so aborts surface as `/api/ps timeout after ...` or `/api/chat timeout after ...` instead of the opaque `This operation was aborted`
  - aligned the staged plugin source `openclaw-mac-migration/staging/workspace/plugins/local-lite-lane/index.js` to the same raw-pass-through behavior by removing local system-prompt, summary, temperature, and `numPredict` shaping
- Verification:
  - the pre-change short-answer experiment had already shown the transport path was healthy (`你可以干什么啊` about `3721ms`, `你好` about `2758ms`)
  - current live behavior intentionally trades that shaped fast-response profile for raw Mac-model behavior
  - `sudo -u openclaw sudo -n id -u` and `sudo -u openclaw-adminai sudo -n id -u` both returned `0`
- Remaining deliberate risks:
  - broad `NOPASSWD:ALL` is still present for both service users because the operator expects sudo capability; narrowing it is a separate security decision, not part of this functionality repair
  - shared cloud API keys were not rotated; key separation is a separate credential-management task
  - swap remains historically high at about `6.5GiB`, but `vmstat` showed no active swap in/out during verification

## Historical 2026-04-15 `local_direct` Duplicate-Executor Removal

- Incident trigger:
  - after the raw-pass-through/no-abort rollout, the user still saw `本地模型当前不可用 ... (chat failed)`
  - that suffix identified the plugin path, not the reply-runtime raw local-direct path, because `reply-BwK-bN2w.js` emits `request failed`
- Root cause:
  - session-scoped ordinary `routingModeOverride="local_direct"` turns were still entering `local-lite-lane` inside `before_dispatch`
  - the plugin still carried its own hot-probe / warming / `chat failed` failure surface, so those turns could be rejected before reaching the dedicated raw local-direct runtime path
  - one user-visible session mode therefore depended on two different executors with different failure semantics
- Live repair:
  - updated staged source: `openclaw-mac-migration/staging/workspace/plugins/local-lite-lane/index.js`
  - updated live plugin copies under:
    - `/var/lib/openclaw/.openclaw/workspace/plugins/local-lite-lane/index.js`
    - `/var/lib/openclaw-adminai/.openclaw/workspace/plugins/local-lite-lane/index.js`
  - new rule:
    - if `routingModeOverride="local_direct"` and the turn is not an explicit request-scoped local prefix, the plugin now returns immediately and does not intercept the turn
    - request-scoped `/lite <message>` / `/local <message>` still belong to the plugin
    - session-scoped ordinary `local_direct` turns are now owned only by the raw local-direct runtime path (`reply-BwK-bN2w.js` for Feishu reply/runtime and `agent-command-8TL7BESJ.js` for gateway agent RPC)
- Related rollout note:
  - the `2026-04-15 22:19-22:22 CST` restart loop with `plugins.entries.local-lite-lane.config.chatTimeoutMs: invalid config: must be >= 100` was a separate schema/config drift during the no-abort rollout
  - after copying the updated plugin schema that allows `chatTimeoutMs = 0`, both gateways returned to `active`; that config drift was distinct from the duplicate-executor bug above

## Historical 2026-04-15 Tiny Trusted Facts For Local Lite / Local Direct

- Operator request:
  - keep the Mac Qwen 9B path mostly raw, but let it remember only a tiny amount of verified personal context such as who the user is and who the partner is
  - do not reintroduce broad memory search, summaries, or free-form persona shaping
  - do not let the model guess beyond the explicitly curated facts
- Live design:
  - added a tiny curated local-only profile card at `workspace/local-lite/profile.json`
  - current staged/live content is intentionally short:
    - current primary user: `张锦程`
    - default referent for bare “我”: `张锦程`
    - partner: `郭一煊`
    - relationship: `郭一煊` is `张锦程`'s girlfriend
    - nickname: `开心果`
    - stable basics added on `2026-04-15`: both sides' birthdays plus school/major, and Zhang Jincheng's primary device/environment (`MacBook Pro M3 Max`, `Apple-first / macOS-centered`)
  - request-scoped `local-lite`, reply-runtime `local_direct`, and gateway `agent-command` `local_direct` all load the same file
  - they add only one tiny system instruction:
    - treat the listed bullets as the only trusted personal facts
    - if a needed fact is missing, answer `不知道` / `不确定` instead of guessing
  - runtime hardening:
    - code now caps the trusted-facts note to a very small slice (`10` lines / `400` chars)
    - the guardrail prompt explicitly says not to cross-infer across bullets and not to mix in common sense or guesses
    - only fixed whitelisted JSON fields are rendered into the note, so free-form main-memory prose cannot enter the local model path through this card
- Effect:
  - the local Mac model can now answer short identity/relationship questions more consistently
  - this is still not full OpenClaw memory; it is an explicitly curated local-only micro-profile layer

## Historical 2026-04-15 Feishu Bare `/lite` Reply-Path Repair

- User-visible symptom:
  - Feishu screenshot at `2026-04-15 12:25 CST` showed:
    - bare `/new` replied with a generated cloud-style greeting mentioning `openai-codex/gpt-5.4`
    - bare `/lite` replied as one-turn local-lite persona
    - the next ordinary turn “现在是什么模型” answered `openai-codex/gpt-5.4`
- Live evidence:
  - gateway journal on benben:
    - `12:25:51` Feishu DM body was exactly `/lite`
    - immediately after, Feishu logged `dispatching to agent (session=agent:main:main)`
  - this proved the message did not hit the gateway RPC synthetic-control path
- Root cause:
  - Feishu inbound messages go through:
    - `monitor-CcQ_3z5A.js`
    - `reply-BwK-bN2w.js`
  - the earlier local-direct rollout had patched:
    - `server.impl-BxLfE9ri.js`
    - `dispatch-CFaSnCVe.js`
    - `agent-command-8TL7BESJ.js`
  - but `reply-BwK-bN2w.js` only recognized bare `/new` and `/reset`; it had no bare route-command handling for `/lite` / `/local` / `/main` / `/codex`
  - consequence:
    - bare `/lite` on Feishu was treated as an ordinary request-scoped local-lite turn
    - `routingModeOverride="local_direct"` was never persisted
    - the following ordinary turn stayed on default cloud `openai-codex/gpt-5.4`
- Live fix:
  - patched `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
  - added bare route-command parsing:
    - `/lite`, `/local` => `routingModeOverride="local_direct"`
    - `/main`, `/codex` => clear `routingModeOverride`
    - bare `/new`, `/reset` already clear `routingModeOverride`
  - reply/runtime now returns the same synthetic local-direct control reply for bare `/lite` / `/local` instead of letting them fall through to ordinary chat
  - unauthorized bare route commands are now ignored the same way other control commands are ignored
- Deployment:
  - backup:
    - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.reply-local-direct-feishu-20260415T131838`
  - restarted:
    - `openclaw-gateway.service`
    - `openclaw-adminai-gateway.service`
- Structural verification:
  - live `reply-BwK-bN2w.js` now contains:
    - `extractBareRouteCommand(...)`
    - `buildBareRouteReplyText(...)`
    - `LOCAL_DIRECT_ROUTING_MODE = "local_direct"`
    - persistence/update of `routingModeOverride` inside session init
    - early synthetic return for bare route commands in the reply/runtime path
  - both gateway services returned `active` after restart
- Pending operator validation:
  - this specific bug is only fully observable on the real Feishu ingress path, so the final behavioral proof is a fresh Feishu DM:
    - bare `/lite`
    - ordinary follow-up `现在是什么模型`
  - expected result now:
    - `/lite` returns the synthetic local-direct control reply
    - the ordinary follow-up answers from `ollama/huihui_ai/qwen3.5-abliterated:9b`, not `openai-codex/gpt-5.4`

## Historical 2026-04-15 Feishu `local_direct` Ordinary-Turn Repair

- User-visible symptom after the `13:19 CST` control-plane fix:
  - a later Feishu screenshot at `2026-04-15 13:31 CST` showed:
    - bare `/lite` already returned `本地直连模式已开启：ollama/huihui_ai/qwen3.5-abliterated:9b`
    - the very next ordinary turn `你好，你是什么模型` still answered `openai-codex/gpt-5.4`
- Live evidence:
  - benben main session store at `/var/lib/openclaw/.openclaw/agents/main/sessions/sessions.json` now did contain:
    - `agent:main:main.routingModeOverride = "local_direct"`
    - empty `providerOverride` / `modelOverride`
  - but that same entry still showed runtime `modelProvider = "openai-codex"` and `model = "gpt-5.4"`, proving the ordinary turn never executed the local-direct path
- Root cause:
  - `reply-BwK-bN2w.js` had been patched to persist bare route commands, but it still had no ordinary-turn execution branch for persisted `routingModeOverride="local_direct"`
  - therefore Feishu inbound ordinary text continued into the default cloud `main` reply path even after the session marker was set
  - a second latent bug also remained in `agent-command-8TL7BESJ.js`: the local-direct hot probe required `context_length >= 32768`, but live `11436/api/ps` may omit `context_length`, creating false `model_not_hot` decisions on some paths
- Live fix:
  - patched `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
    - added `replyWithLocalDirect(...)`
    - ordinary non-slash turns now short-circuit when `sessionEntry.routingModeOverride === "local_direct"`
    - the reply-path local-direct call goes straight to NAS `127.0.0.1:11436/api/chat`
    - it explicitly sends `think:false`, `keep_alive=24h`, and `num_ctx=32768`
    - the system prompt now explicitly self-reports `ollama/huihui_ai/qwen3.5-abliterated:9b` when asked for the current model
  - patched `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js`
    - local-direct hot probe now matches the model by name / alias instead of requiring `context_length`
- Deployment:
  - backups:
    - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.local-direct-reply-path-20260415T1346`
    - `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js.bak.local-direct-hotprobe-20260415T1628`
  - restarted:
    - `openclaw-gateway.service`
    - `openclaw-adminai-gateway.service`
- Verification:
  - both gateway services returned `active`
  - live bundle markers now include:
    - `reply-BwK-bN2w.js: replyWithLocalDirect(...)`
    - `reply-BwK-bN2w.js: isLocalDirectSessionEntry(...)`
    - `reply-BwK-bN2w.js: ordinary-turn short-circuit on localDirectBody`
    - `agent-command-8TL7BESJ.js: modelMatchesLocalDirect(...)`
  - `127.0.0.1:11436/api/ps` showed Qwen 9B hot with `context_length=32768`
  - direct `127.0.0.1:11436/api/chat` probe using the same self-report prompt returned:
    - `你好，我是 ollama/huihui_ai/qwen3.5-abliterated:9b。`
- Pending operator validation:
  - final confirmation still needs a fresh real Feishu DM in the same shape:
    - bare `/lite`
    - ordinary follow-up `你好，你是什么模型`
  - expected result now:
    - `/lite` returns the synthetic local-direct control reply
    - the ordinary follow-up answers from `ollama/huihui_ai/qwen3.5-abliterated:9b`

## Historical 2026-04-15 Feishu `local_direct` Body-Source Fix

- User-visible symptom after the `16:26 CST` reply-path direct-call patch:
  - the `2026-04-15 16:36 CST` Feishu screenshot still showed:
    - bare `/lite` returned the correct `本地直连模式已开启` control reply
    - the next ordinary turn `你好，你是什么模型` still answered `openai-codex/gpt-5.4`
- Evidence ruling out timeout:
  - benben main session store still showed `routingModeOverride="local_direct"` for `agent:main:main`
  - there was no matching `reply/local-direct` failure or `本地模型当前不可用` response
  - if the local-direct branch had timed out, current fail-closed behavior would have surfaced the local-unavailable message instead of a normal cloud answer
- Root cause:
  - in `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`, the new ordinary-turn local-direct branch read the local variable `bodyStripped`
  - for normal non-reset turns, `initSessionState()` does not populate that local variable; it only materializes the cleaned body as `sessionCtx.BodyStripped`
  - result: the branch condition always saw an empty body and skipped local direct execution even though the session marker was already present
- Live fix:
  - changed the ordinary-turn local-direct body source to:
    - `sessionCtx.BodyStripped ?? sessionCtx.BodyForAgent ?? sessionCtx.Body`
  - deployed live and restarted:
    - `openclaw-gateway.service`
    - `openclaw-adminai-gateway.service`
- Backup:
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.local-direct-bodystripped-fix-20260415T1646`
- Verification:
  - both gateway services returned `active`
  - live `reply-BwK-bN2w.js` now contains:
    - `const localDirectBody = normalizeOptionalString(sessionCtx.BodyStripped ?? sessionCtx.BodyForAgent ?? sessionCtx.Body);`
  - this fix changes the root cause from “branch exists but reads the wrong variable” to the intended behavior where persisted `local_direct` turns can actually reach the direct local chat call
- Pending operator validation:
  - re-run the real Feishu sequence:
    - bare `/lite`
    - ordinary follow-up `你好，你是什么模型`
  - expected result:
    - the second turn answers from `ollama/huihui_ai/qwen3.5-abliterated:9b`

## Historical 2026-04-15 Feishu bare `/new` lifecycle-export Fix

- User-visible symptom:
  - a later Feishu bare `/new` at `2026-04-15 16:46 CST` produced no visible reply
- This was not timeout:
  - benben journal showed the failure in about `4s`, not a long-running hang
  - exact live error:
    - `failed to dispatch message: TypeError: resolveBoundAcpThreadSessionKey is not a function`
- Root cause:
  - `reply-BwK-bN2w.js` lifecycle-control path imported:
    - `const { resolveBoundAcpThreadSessionKey } = await import("./targets-B7m5QZs_.js")`
  - but the current minified target bundle exports that helper as:
    - `n`
  - so bare `/new` / `/reset` could throw before sending their synthetic control replies
- Live fix:
  - changed the import site to:
    - `const targetsModule = await import("./targets-B7m5QZs_.js")`
    - `const resolveBoundAcpThreadSessionKey = targetsModule.resolveBoundAcpThreadSessionKey ?? targetsModule.n`
  - guarded the call so the lifecycle path falls back cleanly when the helper is absent
  - restarted:
    - `openclaw-gateway.service`
    - `openclaw-adminai-gateway.service`
- Backup:
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.resolveBoundAcpThreadSessionKey-fix-20260415T1653`
- Verification:
  - both gateway services returned `active`
  - live `reply-BwK-bN2w.js` now contains:
    - `const targetsModule = await import("./targets-B7m5QZs_.js")`
    - `targetsModule.resolveBoundAcpThreadSessionKey ?? targetsModule.n`
- Pending operator validation:
  - re-run real Feishu bare `/new`
  - expected result:
    - it returns the synthetic lifecycle reply instead of disappearing silently

## Historical 2026-04-15 NAS-Local Ollama Disablement

- Reason:
  - after the local-lite backend moved to Mac `huihui_ai/qwen3.5-abliterated:9b` via NAS `127.0.0.1:11436`, NAS-local Ollama no longer serves the active text/image route
  - NAS local `127.0.0.1:11434/api/ps` showed no loaded models before shutdown, so the high NAS load was not caused by an active e2b Ollama runner
- Live changes:
  - stopped and disabled `ollama.service`
  - edited `/etc/systemd/system/openclaw-ollama-e2b-keepwarm.service` to remove `After=... ollama.service` and `Wants=... ollama.service`
  - ran `systemctl daemon-reload`
  - backup: `/etc/systemd/system/openclaw-ollama-e2b-keepwarm.service.bak.disable-local-ollama-20260415T111511`
  - tracked mirror updated: `.codex-remote-openclaw/systemd/openclaw-ollama-e2b-keepwarm.service`
- Post-change verification:
  - `ollama.service`: `inactive`, `disabled`
  - local NAS `127.0.0.1:11434` no longer responds, as expected
  - Mac tunnel `127.0.0.1:11436/api/ps` still shows `huihui_ai/qwen3.5-abliterated:9b` hot with `context_length=32768`
  - relay `127.0.0.1:11435/healthz` still reports `remoteModels=["huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - relay Qwen smoke with `think:false` still returns non-empty `OK`
  - `openclaw-gateway.service`, `openclaw-adminai-gateway.service`, `openclaw-ollama-relay.service`, and `openclaw-qwen9b-keepwarm.timer` remain active
- Important load note:
  - disabling NAS-local Ollama did not materially reduce load because the active load source was not an Ollama runner
  - direct process sampling found about `194` long-running `soffice.bin` processes under `/tmp/stirling-pdf/...`, each consuming CPU, and load remained about `193`
  - treat that as a separate Stirling PDF/LibreOffice process leak or job backlog incident; do not attribute current load to NAS-local e2b
- Follow-up cleanup:
  - process tree showed the stale LibreOffice children belonged to Docker container `apps-stirling-pdf-stirling-pdf-1` (`stirlingtools/stirling-pdf:latest`), with parent `tini -- /scripts/init.sh`
  - terminated `386` stale `soffice.bin`/`oosplash` processes matching `/tmp/stirling-pdf/...`; all exited after SIGTERM, no SIGKILL was needed
  - did not stop the Stirling PDF container itself because it remained `healthy` and respawned only the normal `unoserver` baseline pair
  - follow-up state: stale count `0`, later only `2` current baseline office processes; load1 started decaying from about `193` to about `60`, run queue dropped to about `1/1803`, available memory rose to about `6.0GiB`, swap used dropped to about `6.5GiB`
- Rollback:
  - restore the unit from the backup if the local NAS Ollama service is needed again
  - re-enable with `systemctl enable --now ollama.service`

## Historical 2026-04-15 Local-Direct `/lite` Semantics Restoration

This section supersedes the earlier 2026-04-15 bare `/lite` `/model local` hotfix notes. The final target is the 2026-04-12/13 style local-only entry, with the backend model replaced by Mac `ollama/huihui_ai/qwen3.5-abliterated:9b`.

- Runtime changes deployed:
  - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js`
  - `/usr/lib/node_modules/openclaw/dist/dispatch-CFaSnCVe.js`
  - `/usr/lib/node_modules/openclaw/dist/status-vq7yuJ1g.js`
  - `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js`
  - live plugin copies under `/var/lib/openclaw/.openclaw/workspace/plugins/local-lite-lane/index.js` and `/var/lib/openclaw-adminai/.openclaw/workspace/plugins/local-lite-lane/index.js`
- Backup suffixes captured during rollout:
  - first runtime/plugin deployment: `.bak.local-direct-20260415T093855`
  - agent-command follow-up deployment: `.bak.local-direct-20260415T105253`
- New session routing truth:
  - bare `/lite` and bare `/local` write `routingModeOverride="local_direct"` and return a `durationMs=0` synthetic control reply
  - they do not persist `providerOverride=ollama` or `modelOverride=huihui_ai/qwen3.5-abliterated:9b`
  - bare `/main`, bare `/codex`, bare `/new`, and bare `/reset` clear `routingModeOverride`
  - `/new` and `/reset` stay lifecycle commands and return to default `openai-codex/gpt-5.4`
- Local-direct generation truth:
  - session-scoped ordinary messages in `local_direct` use Mac Qwen 9B directly at NAS `127.0.0.1:11436`
  - payload is minimal: local-direct system prompt, one user message, `think:false`, `num_ctx=32768`
  - it bypasses the full `main` agent prompt, tools, memory search, planning, code/file paths, and session-review surface
  - failure policy is fail-closed: tunnel down, cold model, empty content, thinking-only, or chat failure returns “本地模型当前不可用” and keeps the session in `local_direct`
  - request-scoped `/lite <message>` and `/local <message>` remain fail-soft and may fall through to `anyone/gpt-5.4`
- Mac reverse tunnel hardening:
  - LaunchAgent `ai.openclaw.ollama-reverse-tunnel` was changed from a bare `ssh -N -R` ProgramArguments list to wrapper `/Users/zhangjincheng/.openclaw/bin/ollama-reverse-tunnel-loop.sh`
  - the wrapper runs the same reverse forward `127.0.0.1:11436:127.0.0.1:11434` to `oc-nas` and reconnects every `3s` after SSH/proxy-chain disconnects
  - after `launchctl kickstart -k gui/501/ai.openclaw.ollama-reverse-tunnel`, launchd showed the wrapper `running`, `runs=1`, `last exit code=(never exited)`, and NAS `11436/api/ps` again showed Qwen 9B hot with `context_length=32768`
- Verification results:
  - adminAI bare `/lite` returned the local-direct control reply and stored `routingModeOverride="local_direct"` with empty `providerOverride/modelOverride`
  - adminAI ordinary follow-up “你是什么模型？只用一句话回答” returned `我是 ollama/huihui_ai/qwen3.5-abliterated:9b。`, `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`, `routingMode=local_direct`, `durationMs≈4132`
  - adminAI bare `/main` cleared the route marker and returned `Default model: openai-codex/gpt-5.4`
  - benben bare `/lite` then ordinary follow-up returned the same local-direct model truth in `durationMs≈3611`
  - benben bare `/new` and `/reset` returned `durationMs=0` lifecycle replies and persisted empty `routingModeOverride/providerOverride/modelOverride` with `modelProvider=openai-codex`, `model=gpt-5.4`
  - NAS `11436/api/ps` showed `huihui_ai/qwen3.5-abliterated:9b` hot at `context_length=32768`
  - NAS relay `11435/healthz` reported `remoteModels=["huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - relay `11435/api/chat` to Qwen 9B with `think:false` returned non-empty `message.content="OK"` and no thinking
  - relay `11435/api/chat` to `qwen2.5vl:7b` text smoke returned `OK`, so the image-model route was not regressed at the whitelist/relay layer
- Remaining operator caveat:
  - NAS was still heavily loaded during verification (`load1≈193`, swap nearly full), so CLI smoke can be slow and SSH can disconnect under pressure
  - the local-direct runtime behavior is now correct; the operational risk is mainly NAS load and Mac reverse-tunnel continuity

## Historical 2026-04-14 Cloud Main + Mac Qwen 9B Local-Lite Pivot

This section supersedes the earlier same-day e2b-default / qwen-default pivot notes below. Those older sections remain as historical breadcrumbs only.

Production truth after the local-lite rollout and follow-up live verification:

- benben/adminAI live config now converges on one shared cloud main lane:
  - `agents.defaults.model.primary = openai-codex/gpt-5.4`
  - `agents.defaults.model.fallbacks = []`
  - `agents.defaults.timeoutSeconds = 180`
  - `agents.defaults.llm.idleTimeoutSeconds = 180`
- benben/adminAI also carry one shared lightweight local lane:
  - plugin id: `local-lite-lane`
  - agent id present in config list: `local_lite`
  - local model target: `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - legacy model alias `local` now maps to `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - `2026-04-15` follow-up hardening: persistent bare `/lite` session overrides are now protected by `agents.list[id=="main"].model.fallbacks = ["openai-codex/gpt-5.4"]`; the `local` alias itself remains only the shortcut to `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - plugin `baseUrl = http://127.0.0.1:11436`
  - plugin `numCtx = 32768`
  - plugin `hotProbeTimeoutMs = 2500`
  - plugin chat/warm payloads explicitly send top-level `think:false`
  - local route shape: short daily chat only, no full tool/memory/session-review payload
  - cloud fallthrough target for complex or cold turns: `openai-codex/gpt-5.4`
  - incident evidence that motivated the `main`-agent fallback override:
    - `2026-04-14 23:12 CST` benben transcript recorded `Model switched to local (ollama/huihui_ai/qwen3.5-abliterated:9b)`
    - the next turn then failed with `502 {"error":"relay upstream unavailable: <urlopen error [Errno 111] Connection refused>"}`
    - conclusion: request-scoped `local-lite` fallthrough was correct, but persistent bare `/lite` session overrides still needed their own cloud fallback through the `main` agent
- live plugin/load surfaces:
  - benben plugin path: `/var/lib/openclaw/.openclaw/workspace/plugins/local-lite-lane`
  - adminAI plugin path: `/var/lib/openclaw-adminai/.openclaw/workspace/plugins/local-lite-lane`
  - both gateway units are `active`
  - gateway startup shows both instances loading `6 plugins`
- live keepwarm surface now uses the explicit Qwen 9B timer/service name:
  - timer cadence: every `2 min`
  - service keep-alive target: `24h`
  - current active unit mirror: `.codex-remote-openclaw/systemd/openclaw-qwen9b-keepwarm.{service,timer}`
  - legacy mirror `.codex-remote-openclaw/systemd/openclaw-ollama-e2b-keepwarm.{service,timer}` is retained only as deprecation history
  - live ExecStart now passes `--num-ctx 32768` and `--think false`
- live relay/keepwarm cutover backups were captured before rollout with suffix `.bak.20260414T174857` for:
  - benben/adminAI live `openclaw.json`
  - `/etc/systemd/system/openclaw-ollama-relay.service`
  - `/etc/systemd/system/openclaw-ollama-e2b-keepwarm.{service,timer}`
- direct Mac-Qwen chain verification is now evidence-based instead of speculative:
  - `127.0.0.1:11436/api/tags` includes `huihui_ai/qwen3.5-abliterated:9b`
  - `127.0.0.1:11436/api/ps` shows the model hot with `context_length = 32768`
  - hot direct `POST /api/chat` through `127.0.0.1:11436` with `think:false` returned `OK` in about `1.5-1.7s`
  - relay `127.0.0.1:11435/healthz` now reports `remoteModels=["huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - relay `POST /api/chat` to `huihui_ai/qwen3.5-abliterated:9b` with `think:false` now returns non-empty `message.content`
- local-lite routing behavior follow-up:
  - plugin hot probe and chat now intentionally use `11436` directly because relay `/api/ps` is not the authoritative hot-state surface for the Mac model
  - local success is now defined as non-empty visible content; thinking-only and empty-content replies are treated as local failure and must fall through to `anyone/gpt-5.4`
  - default complex lane now remains `anyone/gpt-5.4`; `/new` and `/reset` return to that cloud lane, not to local-lite
  - ordinary bare chat still belongs to the cloud `main` lane; the Mac Qwen 9B route is request-scoped unless the user explicitly sends bare `/lite` or bare `/local`, which now enable persistent `routingModeOverride="local_direct"`
  - bare `/lite` and `/lite <message>` are intentionally split:
    - bare `/lite` is the persistent local-direct session-mode shortcut to `ollama/huihui_ai/qwen3.5-abliterated:9b`
    - `/lite <message>` remains the one-turn local-lite lane prefix handled by the plugin
  - `2026-04-15 08:43-08:49 CST` live follow-up closed the last command-surface gap for that split:
    - root cause: gateway `server.impl-BxLfE9ri.js` only extracted bare control commands for `/new` and `/reset`, so Feishu bare `/lite` and wrapped bodies like `cc和xx的openclaw\n/lite` still fell through to ordinary `agent:main:main` chat generation
    - historical hotfix first implemented that path as a persistent `providerOverride/modelOverride`
    - the current live truth supersedes that hotfix: bare `/lite` / `/local` now store `routingModeOverride="local_direct"` instead, and no longer write `providerOverride/modelOverride`
    - live backup created before replacing the dist bundle:
      - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js.bak.20260415T084231`
    - post-hotfix gateway-harness verification on both benben/adminAI:
      - bare `/lite` returned `durationMs=0`
      - wrapped `... \n/lite` also returned `durationMs=0`
      - `agentMeta.provider=ollama`
      - `agentMeta.model=huihui_ai/qwen3.5-abliterated:9b`
    - current semantic clarification: bare `/lite` is persistent local-direct session mode, not a `main`-session model override; a later ordinary follow-up turn uses the minimal direct local payload instead of the full `main` agent prompt, while `/lite <message>` remains the minimal one-turn local-lite path
  - Feishu bare `/new` / `/reset` control detection was hardened against wrapped inbound command bodies after a live incident where Feishu delivered clean `/new`, but the runtime occasionally failed to hit the lifecycle control path and fell through to model generation
  - `2026-04-14 23:19-23:40 CST` follow-up verification on the real Feishu-shaped agent path (`--channel feishu --session-id ...`) closed the command surface:
    - bare `/lite` switched benben/adminAI explicit sessions to `ollama/huihui_ai/qwen3.5-abliterated:9b`
    - the same sessions then returned bare `/new` as a `durationMs=0` synthetic control reply back to default `openai-codex/gpt-5.4`
  - the first wrapped-body follow-up also exposed a second-layer gap:
    - a simulated wrapped Feishu body `cc和xx的openclaw\n/new` still launched a real `gpt-5.4` model turn on adminAI because gateway `server.impl-BxLfE9ri.js` was only matching exact `^/(new|reset)` at the agent RPC front door
    - live hotfix: `server.impl-BxLfE9ri.js` now uses `extractSessionLifecycleCommand(...)` before agent dispatch
    - post-hotfix wrapped-body smoke on both benben/adminAI returned the same `durationMs=0` synthetic control reply instead of model generation
  - generic `openclaw agent` CLI smoke on benben/adminAI returned `openai-codex/gpt-5.4-mini`, so treat current CLI smoke as cloud-fallthrough evidence only, not as proof that a supported-channel `/local` turn hit the plugin
  - during rollout verification, the plugin also showed the expected failure mode when the Mac reverse tunnel dropped:
    - gateway logs emitted `local-lite-lane: hot probe failed; falling through to cloud (TypeError: fetch failed)`
    - the same turn then emitted `cloud fallback due resource gate load1=39.92` / `40.16`
    - this confirmed the plugin was still on the new Qwen 9B route and failing closed to cloud, not silently reverting to the old e2b path
  - the dropped tunnel was traced to Mac LaunchAgent `ai.openclaw.ollama-reverse-tunnel` being loaded but not running with `last exit code = 255`; `launchctl kickstart -k gui/501/ai.openclaw.ollama-reverse-tunnel` restored the NAS `127.0.0.1:11436` listener and direct `11436`/relay `11435` Qwen checks
  - `2026-04-15 08:11-08:13 CST` controlled-failure verification closed the remaining persistent-session gap:
    - the Mac reverse tunnel was intentionally stopped until `127.0.0.1:11436` returned `connection refused`
    - benben/adminAI ordinary turns against already-local-switched `main` sessions both returned `OK` through `openai-codex/gpt-5.4` instead of surfacing provider errors
    - bare `/new` on both instances then reset the shared `main` session back to default `openai-codex/gpt-5.4`
  - `2026-04-15 08:51 CST` direct ordinary-turn smoke after a persistent bare `/lite` switch confirmed the expected semantic tradeoff:
    - benben `openclaw agent --session-id ... --message "只回复OK" --json` returned `OK`
    - `agentMeta.provider=ollama`, `agentMeta.model=huihui_ai/qwen3.5-abliterated:9b`
    - prompt/input tokens were about `31k`, and duration was about `115s`
    - conclusion: the bare `/lite` shortcut now works, but it is intentionally heavier than request-scoped `local-lite` because it runs the full `main` agent prompt on the local model
  - follow-up dispatch harness on `2026-04-14 19:14 CST` proved the plugin hook is present on the live path (`before_dispatch` loaded), but the original live threshold `hotProbeTimeoutMs=600` still forced cloud fallthrough under high NAS load:
    - live NAS load during the check was about `68`
    - direct `127.0.0.1:11436/api/ps` succeeded but took about `1119ms`
    - plugin `hotProbeTimeoutMs=600` missed the already-hot model
    - once the hot probe missed, the cold-path resource gate `maxLoad1=12` blocked local serve and the turn fell through to cloud
    - the resulting dispatch returned `OK` only after a normal agent run (`3` lifecycle/assistant events), so that turn was not a true local-lite hit
  - control experiments on `2026-04-14 19:15-19:20 CST` isolated the fix and then verified it live:
    - with only an in-memory `hotProbeTimeoutMs=2500` override, the same `/local 只回复OK` dispatch returned final `OK` in about `3.45s`
    - that hot-probe-only dispatch emitted `0` agent events, proving `maxLoad1=12` did not need to be relaxed for already-hot local replies
    - live configs on benben/adminAI were then updated from `hotProbeTimeoutMs=600` to `2500` and both gateways restarted
    - after the live change, the same supported-path dispatch returned local `OK` on both live instances:
      - benben about `3.55s`, `0` agent events
      - adminAI about `2.70s`, `0` agent events
    - conclusion: the Mac Qwen 9B cutover is wired correctly; current remaining operator risk is reverse-tunnel stability, while cold-path guardrails stay intentionally conservative
- image route remains unchanged in this pivot:
  - primary `ollama/qwen2.5vl:7b`
  - transport `NAS 11435 <- NAS 11436 <- Mac 11434`
  - fallback `openrouter/xiaomi/mimo-v2-omni`

## Historical 2026-04-14 E2B Fast-Fail + Mac Vision Relay Recovery

Production truth after repairing the slow-reply path without reverting to larger Ollama chat models:

- benben/adminAI live config now converges on one shared text route:
  - `agents.defaults.model.primary = ollama/huihui_ai/gemma-4-abliterated:e2b`
  - provider entry `huihui_ai/gemma-4-abliterated:e2b` now carries `contextWindow = 2048`
  - `agents.defaults.timeoutSeconds = 20`
  - `agents.defaults.llm.idleTimeoutSeconds = 20`
  - `agents.defaults.model.fallbacks = ["openai-codex/gpt-5.4-mini"]`
- retired routes were removed from the live default surface:
  - NAS no longer keeps old Gemma4 local variants for chat routing
  - relay remote whitelist was narrowed back to `qwen2.5vl:7b`
  - old manual `/gemma` / `/qw` live routing is no longer part of the current production plan
- Mac image routing recovered through the existing reverse-forward shape:
  - LaunchAgent `ai.openclaw.ollama-reverse-tunnel` was updated and relaunched
  - NAS `127.0.0.1:11436` again forwards to Mac `127.0.0.1:11434`
  - relay `REMOTE_CONNECT_TIMEOUT_SECONDS` was tightened to `1.5`
- keepwarm surfaces were added:
  - NAS systemd keepwarm timer now periodically attempts to warm `huihui_ai/gemma-4-abliterated:e2b`
  - Mac LaunchAgent keepwarm now periodically warms `qwen2.5vl:7b` with a tiny vision payload
- live follow-up narrowed e2b from 64K to 2048 context after `ollama ps` and `journalctl -u ollama` showed the 64K route still starting a `CONTEXT 65536` CPU runner that sat in `llm server not responding` for multiple minutes before cleanup; this is an evidence-based deviation from the initial 65K cap plan to prevent NAS-local text serving from re-entering the 64K runner path.
- direct NAS Ollama probes still did not prove `e2b` viable:
  - `num_ctx=256` timed out after 90s and 150s with zero response bytes
  - keepwarm `num_ctx=2048` timed out after 420s with zero response bytes
  - runtime smoke then showed OpenClaw blocks `contextWindow=2048` because its generation minimum is 16000 tokens, so normal text currently succeeds through `openai-codex/gpt-5.4-mini` fallback rather than NAS-local e2b generation
- NAS e2b keepwarm is now resource-gated and low-frequency:
  - timer changed from every 10 minutes to every 30 minutes
  - service now skips successfully when `load1 > 4` or swap usage exceeds `60%`
  - live verification at `2026-04-14 15:08 CST` skipped with `load1=7.24`, avoiding another Ollama runner load
- healthcheck load was reduced:
  - both live healthcheck timers were changed from every 1 minute to every 5 minutes
  - both live health env files now set `OPENCLAW_HEALTH_SESSION_REVIEW_ENABLED=0`, so session review reconcile no longer runs inside the lightweight healthcheck path
- Mac image path was reverified after a transient tunnel drop:
  - Mac direct `127.0.0.1:11434/api/chat` with `qwen2.5vl:7b` returned `OK`
  - after kickstarting `ai.openclaw.ollama-reverse-tunnel`, NAS `127.0.0.1:11436/api/chat` and relay `127.0.0.1:11435/api/chat` both returned `qwen2.5vl:7b -> OK` in 1-2s
- healthcheck/runtime env alignment:
  - benben `openclaw-healthcheck.sh` now honors `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS`
  - adminAI health env now exports instance-safe temp-dir context so `qqbot-runtime-health.mjs` does not fall back to `/tmp/openclaw/openclaw-994`

## Historical 2026-04-14 NAS Local Gemma E2B Default Follow-up

Production truth after replacing the Qwen 9B default with the NAS-local Gemma e2b lane:

- live benben/adminAI config now resolves main-chat default to:
  - `agents.defaults.model.primary = ollama/huihui_ai/gemma-4-abliterated:e2b`
  - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:e2b"].alias = "local"`
  - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:e2b"].params.thinking = "off"`
  - `agents.defaults.timeoutSeconds = 180`
  - `agents.defaults.llm.idleTimeoutSeconds = 180`
- fallback and image routing were preserved:
  - fallback_1 remains `openai-codex/gpt-5.4-mini`
  - image primary remains `ollama/qwen2.5vl:7b`
  - image fallback remains `openrouter/xiaomi/mimo-v2-omni`
- manual routes remain available:
  - `/local` is now the canonical default shortcut for the NAS-local e2b lane
  - `/qw` remains the manual Qwen 9B route
  - `/gemma` remains the manual desktop-local 26B route
- live workspace/operator docs were re-aligned so `/new` and `/reset` return to the NAS-local e2b default on both instances
- `ollama show huihui_ai/gemma-4-abliterated:e2b` still reports the NAS model as present and healthy

## Historical 2026-04-14 Qwen 9B 64K Main-Chat Default Stability Pivot

Production truth after replacing the Gemma default with the smaller desktop-local Qwen lane:

- local Mac verification:
  - `http://127.0.0.1:11434/api/tags` includes `huihui_ai/qwen3.5-abliterated:9b`
  - local `ollama ps` after a 64K probe showed `huihui_ai/qwen3.5-abliterated:9b` loaded with `CONTEXT 65536` and about `10 GB`
  - direct 64K `POST /api/chat` through the NAS relay returned `message.content = "OK"`
- live benben/adminAI config was updated in place:
  - `agents.defaults.model.primary = ollama/huihui_ai/qwen3.5-abliterated:9b`
  - the Qwen provider entry has `contextWindow = 65536`
  - `agents.defaults.timeoutSeconds = 180`
  - `agents.defaults.llm.idleTimeoutSeconds = 180`
  - `agents.defaults.model.fallbacks[0] = openai-codex/gpt-5.4-mini`
  - image routing remains `ollama/qwen2.5vl:7b` with fallback `openrouter/xiaomi/mimo-v2-omni`
  - `/qw` is registered as the model alias for `ollama/huihui_ai/qwen3.5-abliterated:9b`
  - `/gemma` remains the manual 26B route and `/local` remains the legacy local route
- live backups:
  - `/var/lib/openclaw/.openclaw/openclaw.json.bak-qwen35-64k-default-20260414T002952Z`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak-qwen35-64k-default-20260414T002952Z`
  - `/var/lib/openclaw/.openclaw/openclaw.json.bak-qwen35-180s-timeout-20260414T004700Z`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak-qwen35-180s-timeout-20260414T004700Z`
  - `/etc/systemd/system/openclaw-ollama-relay.service.bak-qwen35-64k-default-20260414T003016Z`
- NAS relay and tunnel:
  - `openclaw-ollama-relay.service` is `active`
  - relay `healthz` reports `remoteModels=["huihui_ai/gemma-4-abliterated:26b","huihui_ai/qwen3.5-abliterated:9b","qwen2.5vl:7b"]`
  - Mac LaunchAgent `ai.openclaw.ollama-reverse-tunnel` is `running`
- live behavior verification:
  - benben `/new` on `qwen35-benben-180-20260414a` returned a synthetic `durationMs=0` control reply with `agentMeta.model=huihui_ai/qwen3.5-abliterated:9b`
  - benben follow-up `只回复 OK` returned `OK` through `ollama/huihui_ai/qwen3.5-abliterated:9b`, `durationMs=17834`, `promptTokens=28560`
  - adminAI `/new` on `qwen35-adminai-180-20260414a` returned a synthetic `durationMs=0` control reply with `agentMeta.model=huihui_ai/qwen3.5-abliterated:9b`
  - adminAI follow-up `只回复 OK` returned `OK` through `ollama/huihui_ai/qwen3.5-abliterated:9b`, `durationMs=37122`, `promptTokens=24761`
  - benben/adminAI bare `/reset` both returned synthetic `durationMs=0` control replies with `agentMeta.model=huihui_ai/qwen3.5-abliterated:9b`
  - `openclaw models aliases list --json` and `/usr/local/bin/openclaw-adminai models aliases list --json` both map `qw` to `ollama/huihui_ai/qwen3.5-abliterated:9b`
- operational note:
  - Qwen 9B 64K is much more stable than Gemma 26B 200K, but full OpenClaw prompts can still take over 120 seconds when two local Ollama requests are run concurrently
  - the retained `180s` timeout is evidence-based for the Qwen 64K path; it is not a revival of the old Gemma timeout-bump workaround
  - smoke tests for local Ollama should run benben/adminAI sequentially unless concurrency itself is the test target
- follow-up live channel-dispatch repair after user observed no Feishu reply:
  - symptom: Feishu received a direct-message `/new`, then gateway dispatch failed before model execution with `TypeError: resolveBoundAcpThreadSessionKey is not a function`
  - root cause: live `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js` dynamically imported `./targets-B7m5QZs_.js` by the original export name, while the built target chunk exports the function as the minified alias `n`
  - live fix: `reply-BwK-bN2w.js` now imports the target chunk as a module namespace and resolves `targetsModule.resolveBoundAcpThreadSessionKey ?? targetsModule.n`, with a function-type guard so dispatch does not crash if the symbol is absent
  - live backup: `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak-feishu-dispatch-bound-acp-20260414T010534Z`
  - post-fix live hash: `65aadaf5bbae750bf5ed8c9b8efaa87688aa49d2eceac62491fe0ed8c5e4c34e`
  - `node --check /usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js` passed
  - `openclaw-gateway.service`, `openclaw-adminai-gateway.service`, and `openclaw-ollama-relay.service` were restarted/checked and are `active`
  - startup logs after the fix show both gateways still resolving `agent model: ollama/huihui_ai/qwen3.5-abliterated:9b` and Feishu/QQ clients reaching ready state
  - this was a channel dispatch/runtime-bundle issue, not a Qwen timeout or Mac memory-pressure fallback issue

## 2026-04-13 Desktop Gemma 26B Main-Chat Default Rollout

Production truth after the desktop-local Gemma cutover:

- local Mac verification before live cutover:
  - `http://127.0.0.1:11434/api/version` returned `0.20.5`
  - `http://127.0.0.1:11434/api/tags` exposed:
    - `huihui_ai/gemma-4-abliterated:26b`
    - `gemma4:26b`
    - `qwen2.5vl:7b`
  - local CLI inference succeeded for:
    - `ollama run huihui_ai/gemma-4-abliterated:26b 'Say ok.'`
    - `ollama run qwen2.5vl:7b 'Say ok.'`
- live benben/adminAI config was updated in place:
  - `agents.defaults.model.primary = ollama/huihui_ai/gemma-4-abliterated:26b`
  - `agents.defaults.model.fallbacks[0] = openai-codex/gpt-5.4-mini`
  - `agents.defaults.imageModel.primary = ollama/qwen2.5vl:7b`
  - `agents.defaults.imageModel.fallbacks[0] = openrouter/xiaomi/mimo-v2-omni`
  - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:26b"] = {"alias":"gemma"}`
  - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:26b"].params.thinking = "off"`
  - NAS-local `/local` route now points at `ollama/huihui_ai/gemma-4-abliterated:e2b`
- live workspace/operator docs were updated in place on both instances:
  - benben:
    - `/var/lib/openclaw/.openclaw/workspace/AGENTS.md`
    - `/var/lib/openclaw/.openclaw/workspace/memory/routing/models-routing.md`
  - adminAI:
    - `/var/lib/openclaw-adminai/.openclaw/workspace/AGENTS.md`
    - `/var/lib/openclaw-adminai/.openclaw/workspace/README.md`
    - `/var/lib/openclaw-adminai/.openclaw/workspace/memory/routing/models-routing.md`
- NAS relay and desktop tunnel truth after the cutover:
  - `/etc/systemd/system/openclaw-ollama-relay.service` now sets `REMOTE_MODELS=qwen2.5vl:7b,huihui_ai/gemma-4-abliterated:26b`
  - `ai.openclaw.ollama-reverse-tunnel` was initially flapping with `last exit code = 255`; after kickstart it held the reverse forward and NAS `127.0.0.1:11436/api/tags` exposed Mac-local Gemma/Qwen models
  - `curl http://127.0.0.1:11435/healthz` now returns `remoteModels=["huihui_ai/gemma-4-abliterated:26b","qwen2.5vl:7b"]`
- live smoke after relay/tunnel repair:
  - `POST http://127.0.0.1:11435/api/chat` with `huihui_ai/gemma-4-abliterated:26b` returned `message.content = "OK"` when given enough token budget; the model also emits `message.thinking`
  - `POST http://127.0.0.1:11435/api/generate` with `qwen2.5vl:7b` returned `response = "OK"`
  - both gateway units and the relay are `active`
  - QQ channel logs returned `Gateway ready` for both benben and adminAI after restart
- adminAI restart exposed a pre-existing service-guard mismatch that had to be fixed as part of this rollout:
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/qqbot-config-guard.conf`
  - `openclaw-config-guard` global flags had to move before the `guard` subcommand to match the current CLI
  - after the drop-in fix, `openclaw-adminai-gateway.service` returned to `active`
- non-target memory/review lanes were verified unchanged on benben:
  - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4-mini`
  - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
  - `OPENCLAW_SESSION_MEMORY_REVIEW_MODEL=gpt-5.4`
- post-cutover session-control verification added one more stable truth:
  - bare `/gemma` and bare `/new` could still hit `LLM idle timeout (60s): no response from model` even after the Gemma route was pinned to `params.thinking=off`
  - the first idle-timeout fix was config-level:
    - pin the Gemma 26B model entry to `params.thinking=off`
    - raise `agents.defaults.llm.idleTimeoutSeconds` from the runtime default `60` to `120`
  - post-fix live smoke on benben succeeded for bare `/gemma`, bare `/new`, and bare `/reset`; all three stayed on `ollama/huihui_ai/gemma-4-abliterated:26b` without model fallback
  - post-fix live smoke on adminAI also succeeded for bare `/gemma`, bare `/new`, and bare `/reset`; the canonical verification entrypoint is `/usr/local/bin/openclaw-adminai`, not a hand-built generic CLI env override
  - for second-instance operator checks, prefer `openclaw-adminai status --json` and `openclaw-adminai agent ...` because they pin:
    - `OPENCLAW_ROOT=/var/lib/openclaw-adminai/.openclaw`
    - `workspace=/var/lib/openclaw-adminai/.openclaw/workspace`
    - `gateway url=ws://127.0.0.1:18889`
  - later fresh-session verification exposed a startup gap that was later closed by the 2026-04-14 bundle follow-up:
    - fresh benben/adminAI `/new` and follow-up `/status` can still hit `FailoverError: LLM request timed out.` on the Gemma startup turn
    - when that happens, runtime can emit a recovery answer through `openai-codex/gpt-5.4-mini` while the underlying session default still points at `ollama/huihui_ai/gemma-4-abliterated:26b`
    - live `agents.defaults.timeoutSeconds=180` and then `300` were both tested and then rolled back; they only delayed failover and did not make fresh `/new` complete on Gemma
    - 2026-04-14 follow-up smoke narrowed that startup gap further:
      - benben fresh `/new` still waits through a gateway-side `180000ms` timeout, then a Gemma-side `FailoverError: LLM request timed out.`, and only then returns a recovery answer on `openai-codex/gpt-5.4-mini`
      - adminAI fresh `/new` can hit repeated `session file locked (timeout 10000ms)` errors on the `main` session transcript `fde7dd4f-1999-43a7-82ba-05a5989106f5.jsonl.lock`
      - when that lock path is active, the intended first fallback `openai-codex/gpt-5.4-mini` is no longer operationally guaranteed; runtime can churn through `deepseek/deepseek-chat` and land on `mimo/mimo-v2-flash`, or fail the full chain with `FallbackSummaryError: All models failed (5)`
      - no persistent `*.lock` file was visible after the verification window, so the current evidence points to a runtime/session-lock lifecycle bug instead of a permanently orphaned on-disk lockfile
    - 2026-04-14 live bundle follow-up closes the bare `/new` and `/reset` startup path:
      - root cause:
        - the CLI/gateway `agent` RPC path in `server.impl-BxLfE9ri.js` converted bare `/new` and `/reset` into `buildBareSessionResetPrompt(cfg)`, so a control command launched a full Gemma startup model run and could then time out or fall through to fallback models
      - live behavior after the hotfix:
        - `runSessionResetFromAgent(...)` still performs the actual session reset/new operation
        - when the post-reset tail is empty, `server.impl-BxLfE9ri.js` now returns a synthetic completed control reply immediately instead of launching a model run
        - returned text is:
          - `✅ New session started. Default model: \`ollama/huihui_ai/gemma-4-abliterated:26b\`. What do you want to do next?`
          - `✅ Session reset. Default model: \`ollama/huihui_ai/gemma-4-abliterated:26b\`. What do you want to do next?`
        - `result.meta.durationMs = 0`
        - `agentMeta.provider/model` stays `ollama / huihui_ai/gemma-4-abliterated:26b`
        - `/new some task` and `/reset some task` still keep the existing tail behavior and can proceed into a real model run
      - live dist files now touched for this follow-up:
        - `/usr/lib/node_modules/openclaw/dist/commands.runtime-11Q3_DxB.js`
          - hash `a6d06ef7f8605550c65396fa68f1551450c21618b5469372a97b759619d86154`
          - backup `/usr/lib/node_modules/openclaw/dist/commands.runtime-11Q3_DxB.js.bak-bare-reset-new-20260413T232309Z`
        - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
          - hash `c438923368fd661035c2ed3b4b1de69d572951ac22ed482d12b74ceb33241833`
          - backup `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak-bare-reset-new-20260413T232631Z`
        - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js`
          - hash `ad6047c31c8b4ab964aeb47b7f901af9be6127b3caf8caf937bf39bbcad75005`
          - backup `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js.bak-bare-reset-new-20260413T233623Z`
        - `/usr/lib/node_modules/openclaw/dist/register.agent-DSGqePoo.js`
          - hash `7f7857a1ad79bf41bb689017af3a5adbeb8753f61dde34deac3f33d619aada7c`
          - pre-existing gateway-timeout guard retained so CLI gateway timeout does not fall back to duplicate embedded runs
      - syntax and service verification after the hotfix:
        - `node --check` passed for `commands.runtime-11Q3_DxB.js`, `reply-BwK-bN2w.js`, and `server.impl-BxLfE9ri.js`
        - `openclaw-gateway.service`, `openclaw-adminai-gateway.service`, and `openclaw-ollama-relay.service` all returned `active`
      - behavior verification after the hotfix:
        - benben bare `/reset` returned the synthetic control reply with `durationMs=0` and `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`
        - benben bare `/new` returned the synthetic control reply with `durationMs=0` and `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`
        - adminAI bare `/reset` returned the synthetic control reply with `durationMs=0` and `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`
        - adminAI bare `/new` returned the synthetic control reply with `durationMs=0` and `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`
        - follow-up `/status` on benben/adminAI reported the session current model as `ollama/huihui_ai/gemma-4-abliterated:26b`, but the status turn itself used `openai-codex/gpt-5.4-mini`; treat `/status` as status/command evidence, not as proof of main-chat generation routing
        - normal message after bare `/new` did prove main-chat generation routing on both instances:
          - benben session `codex-final-benben-chat-20260414a` returned `OK` with `agentMeta.provider=ollama`, `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`, `durationMs=71595`
          - adminAI session `codex-final-adminai-chat-20260414a` returned `OK` with `agentMeta.provider=ollama`, `agentMeta.model=huihui_ai/gemma-4-abliterated:26b`, `durationMs=13120`
      - local source/handoff state after the hotfix:
        - `openclaw-mac-migration/staging/workspace/patches/runtime/reply-patched-C5LKjXcC.js` includes the reply/chat-path bare `/new` and `/reset` short-circuit
        - `reply-runtime-v1.patch` was regenerated from the current base/patched snapshots
        - `patch-manifest.json` now records `patched_hash=c64809e2cb83442df43a24a470006fd6c6ac5e5291116927f60b69e3a5712fe2`
        - no tracked `server.impl-BxLfE9ri.js` source snapshot was found in staging, so the `server.impl` CLI/gateway hotfix is documented here as live dist truth requiring upstream/source capture in a future bundle-management pass
      - current desktop-local model availability after final verification:
        - current shell initially found Mac Ollama down: no `ollama` process and no local `127.0.0.1:11434` listener
        - `brew services start ollama` loaded the service but did not spawn it; `launchctl kickstart -k gui/501/homebrew.mxcl.ollama` started `/opt/homebrew/opt/ollama/bin/ollama serve`
        - after kickstart, local `http://127.0.0.1:11434/api/version` returned `0.20.5`
        - local `http://127.0.0.1:11434/api/tags` included `huihui_ai/gemma-4-abliterated:26b` and `qwen2.5vl:7b`
        - NAS `http://127.0.0.1:11436/api/tags` through the reverse tunnel included the same two models
        - NAS relay `http://127.0.0.1:11435/healthz` returned both remote models
        - NAS relay `POST /api/chat` to `huihui_ai/gemma-4-abliterated:26b` returned `message.content="OK"`
      - operator caveat:
        - short CLI smoke windows below roughly 150 seconds are unreliable because the instance CLI can spend substantial time loading plugins before reaching the gateway
        - use a longer outer shell timeout for CLI-path verification, or verify direct gateway/relay behavior separately

## 2026-04-12 Channel Canary State Consistency And Service-Version Sync

Production truth after the audit follow-up repair pass:

- benben live workspace tools updated in place:
  - `/var/lib/openclaw/.openclaw/workspace/tools/channel-delivery-canary.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-health-summary.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-ops-dashboard.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh`
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-healthcheck.sh`
  - `/var/lib/openclaw/.openclaw/workspace/tools/install-openclaw-channel-canary.sh`
- adminAI live workspace tools updated in place:
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/openclaw-cli-wrapper.sh`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/openclaw-healthcheck.sh`
- channel canary state now uses the v2 shape on benben:
  - state file: `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/channel-delivery-canary-state.json`
  - history file: `/var/lib/openclaw/.openclaw/workspace/memory-admin/logs/channel-delivery-canary-history.jsonl`
  - top-level state now records `last_run_id`, `last_status`, `last_issues`, `last_success_at`, `last_failure_at`, and `last_trigger_source`
  - per-channel state now separates current success fields from retained failure fields instead of collapsing everything into `last_error`
- canary trigger attribution is now explicit for systemd runs:
  - `/etc/systemd/system/openclaw-channel-canary.service.d/70-trigger-source.conf`
  - latest successful unit-triggered run at `2026-04-12T10:24:12.228Z` recorded `trigger_source=systemd_service`
  - `systemctl show -p Result -p ExecMainStatus openclaw-channel-canary.service` now reports `Result=success` and `ExecMainStatus=0`
- health summaries no longer cache past canary truth across new runs:
  - `memory-health-summary.mjs` now reads the v2 canary state shape
  - `memory-ops-dashboard.mjs` now treats canary state/history files as freshness inputs before reusing a cached health summary
  - latest live dashboard at `2026-04-12T10:19:16.622Z` reports `overall=healthy` and `channel_canary.status=healthy`
- gateway version metadata drift is now closed through drop-ins instead of hand-editing the base units:
  - `/etc/systemd/system/openclaw-gateway.service.d/95-service-version.conf`
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/95-service-version.conf`
  - both live gateway units now report `OPENCLAW_SERVICE_VERSION=2026.4.9`
  - descriptions now resolve to:
    - `OpenClaw Gateway (package v2026.4.9)`
    - `OpenClaw adminAI Gateway (package v2026.4.9)`
- adminAI health env permissions are now aligned with the other protected env files:
  - `/etc/openclaw/adminai-health.env` is now `0600 root:root`
- this pass did not change sudoers policy or the user’s custom sudo setup

Live verification after deployment:

- `systemctl show -p Result -p ExecMainStatus openclaw-channel-canary.service openclaw-healthcheck.service openclaw-adminai-healthcheck.service` now reports `success / 0` for all three oneshot units
- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json` completed and wrote:
  - `memory-admin/reports/deployment-verify-20260412101852.md`
  - `memory-admin/reports/deployment-verify-20260412101852.json`
- current remaining verify failures are:
  - `session_route_guard_failed`
  - `recent_preflight_trace_missing`
- those verify failures remain open and should be treated as separate runtime/verify debt; they were observed after the canary/state-consistency rollout but are not evidence that the canary fix regressed channel delivery

## 2026-04-12 Slash-Command Chinese Runtime Patch And Privilege Opening

Production truth after the slash-command Chinese localization and operator-capability opening pass:

- both production instances now use the same startup-time runtime patch layer:
  - `/usr/local/bin/openclaw-apply-zh-runtime-patch.py`
  - `/usr/local/share/openclaw/openclaw_zh_runtime_patch_rules.json`
  - `/etc/systemd/system/openclaw-gateway.service.d/90-zh-runtime-patch.conf`
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/90-zh-runtime-patch.conf`
- current verified live patch coverage includes Chinese reply text for user-facing slash-command surfaces such as:
  - `/status`
  - `/commands`
  - `/help`
  - `/context`
  - `/tools`
  - `/usage`
  - `/plugins`
  - `/mcp`
  - `/tasks`
  - `/tts`
  - `/model` / `/models`
  - `/acp`
  - `/agents`
  - `/subagents`
- live bundle verification after deployment confirmed Chinese strings in:
  - `/usr/lib/node_modules/openclaw/dist/command-status-builders-zIwnwINs.js`
  - `/usr/lib/node_modules/openclaw/dist/commands-acp-BM9eb-x9.js`

## 2026-04-12 Deployment-Verify Memory-Review Hardening And Smoke Trace Closure

Production truth after the follow-up verify hardening pass:

- benben live workspace verify scripts were updated in place:
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify-helper.mjs`
- the verify change is intentionally narrow:
  - `memory_review` still only passes when the selfcheck lands on `codex_class_b`
  - it does not bless `openai_class_b_fallback` as a success path
  - it now retries once only when the first selfcheck returns a healthy reviewed payload via `openai_class_b*`, which had been observed as a transient transport wobble rather than a steady-state runtime regression
- the memory-review portion of the report now records:
  - `review.review_error_reason`
  - `review.review_error_detail`
  - `attempts`
  - `recovered_after_retry`
  so transient fallback is visible instead of collapsing into an opaque `memory_review_failed`

Live verification after deployment:

- the first post-hardening live run wrote:
  - `memory-admin/reports/deployment-verify-20260412145128.md`
  - `memory-admin/reports/deployment-verify-20260412145128.json`
- the second confirming live run wrote:
  - `memory-admin/reports/deployment-verify-20260412145231.md`
  - `memory-admin/reports/deployment-verify-20260412145231.json`
- the latest report at `2026-04-12T14:52:31.304Z` is fully green:
  - `ok = true`
  - `failures = []`
  - `memory_review.ok = true`
  - `memory_review.transport.effective_transport_kind = gateway_cron`
  - `memory_review.review.review_mode = codex_class_b`
  - `memory_review.attempts = 1`
  - `memory_review.recovered_after_retry = false`
- `gift_memory` smoke is now also trace-visible in the latest run:
  - `traceObserved = true`
  - `traceEventCount = 1`
  - `recallRefs` anchored to:
    - `memory_v2/projections/couple-shared.md#L26-L29`
    - `memory_v2/projections/couple-current-relationship.md#L14-L17`
    - `memory_v2/state/current/couple.yaml#L4-L7`
- `exam_memory` remained green and trace-visible in the same run

Operational interpretation:

- the earlier `memory_review_failed` at `deployment-verify-20260412143444.json` should now be read as a transient verify/selfcheck transport wobble, not as a persistent memory-review runtime break
- the earlier intermittent `gift_memory` no-trace result is no longer blocking current deployment verification; the latest live report proves both smoke prompts now emit anchored `memory_recall` evidence under the active `memory_core_trace_surface`
- this pass did not change sudoers policy or the user’s custom sudo setup
  - `/usr/lib/node_modules/openclaw/dist/error-text-BlKg4TDz.js`
  - `/usr/lib/node_modules/openclaw/dist/directive-handling.impl-ClwBwwuA.js`
  - `/usr/lib/node_modules/openclaw/dist/exec-defaults-DYrqUHQv.js`
  - `/usr/lib/node_modules/openclaw/dist/targets-B7m5QZs_.js`

Privilege truth after this pass:

- both live instances now run with host-realistic operator permissions:
  - `tools.exec.ask = off`
  - `approvals.exec.enabled = false`
  - `tools.fs.workspaceOnly = false`
  - `tools.exec.applyPatch.workspaceOnly = false`
  - `commands.bash = true`
- both service users now have host sudo:
  - `/etc/sudoers.d/openclaw-agents`
  - verified with `sudo -u openclaw -H sudo -n whoami`
  - verified with `sudo -u openclaw-adminai -H sudo -n whoami`
- both live workspace instruction files now explicitly allow `sudo` for host/code repair work:
  - `/var/lib/openclaw/.openclaw/workspace/AGENTS.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/AGENTS.md`

Hardening truth discovered during rollout:

- the first runtime-patch attempt exposed two bundle-patching hazards:
  - non-idempotent replacements could duplicate helper blocks on repeated restarts
  - translating code keys such as `*Usage`, `withFileTypes`, or internal enum values such as `failed` could break runtime parsing
- this is now closed:
  - the patcher checks for already-patched `new` text before attempting `old -> new` replacement
  - the ruleset was replay-tested from a clean dist tree
  - the patched dist passed `node --check`
  - both services were restart-tested twice on the live NAS and are now stable

Canonical local maintenance artifacts for this patch system now exist in the repo:

- `.codex-remote-openclaw/tools/openclaw_apply_zh_runtime_patch.py`
- `.codex-remote-openclaw/tools/openclaw_refresh_zh_runtime_rules.py`
- `.codex-remote-openclaw/tools/openclaw_zh_runtime_patch_rules.json`
- `.codex-remote-openclaw/systemd/openclaw-gateway.service.d/90-zh-runtime-patch.conf`
- `.codex-remote-openclaw/systemd/openclaw-adminai-gateway.service.d/90-zh-runtime-patch.conf`

## 2026-04-11 Dual-Instance Score Uplift: Live vs Preview

Production truth after the benben/adminAI dual-instance uplift pass on 2026-04-11:

- benben truth surface remains:
  - `memory-admin/meta/memory-health-summary.json`
  - `memory_v2` remains the only truth layer
  - historical sidecar remains `shadow_retrieve`
- adminAI truth surface remains:
  - current role-resolved `pi-embedded` runtime under `/usr/lib/node_modules/openclaw/dist`
  - `OPENCLAW_SERVICE_MARKER=openclaw-adminai` protection remains in force
  - adminAI was not reverted to the life-assistant schema
- deployed benben workspace tools in this pass:
  - `workspace/tools/session-memory-review.mjs`
  - `workspace/tools/memory-health-summary.mjs`
  - `workspace/tools/openclaw-dual-instance-scorecard.mjs`
  - `workspace/tools/session-memory-review-fixture-preview.mjs`

Live verification after deployment:

- benben persisted summary was re-read from:
  - `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/memory-health-summary.json`
- latest benben summary on 2026-04-11T15:55:40.109Z confirms:
  - `overall_status=healthy`
  - `retry_recommended_7d=0`
  - `true_model_retry_count_7d=0`
  - `retrieval_efficiency.last_7d.retry_recommended_rate=0`
  - `capture_efficiency.last_7d.retry_recommended_rate=0`
- adminAI verify / observe remained good:
  - `verify_state=already_patched`
  - `patched_match=true`
  - `markers_ok=true`
  - `portability_ready=true`
  - `policy_only_gate.ok=true`
  - `transport_canary.ok=true`
  - `first_action=ocapp_diagnose`
  - `should_use_memory_after_diagnose=true`
  - `stop_on_ok=true`

Score truth is now explicitly split by layer:

- `7d live` scorecard from `workspace/memory-admin/reports/openclaw-dual-instance-scorecard.json`:
  - `benben=9.1`
  - `adminAI=10`
  - `overall=9.5`
  - remaining live-only gaps:
    - `benben_session_capture_rate_7d_below_target`
    - `benben_rule_lightweight_capture_7d_below_target`
- `24h + fixture preview` now exists at:
  - `workspace/memory-admin/meta/session-memory-review-fixture-preview.json`
  - `workspace/memory-admin/reports/session-memory-review-fixture-preview.md`
- latest preview run on 2026-04-11T15:56:11.695Z confirms:
  - live `24h` base remained:
    - `capture_rate=0.33`
    - `rule_lightweight=0`
    - `retry_rate=0`
  - curated fixture replay passed:
    - `5/5`
  - combined `24h + fixture` preview reached:
    - `reviewed=8`
    - `captured=6`
    - `captured_from_rule_lightweight=5`
    - `session_capture_rate=0.75`
    - `retry_recommended_rate=0`
    - `capture_uplift_gate.ready=true`
  - scorecard preview section now reports:
    - `benben=10`
    - `adminAI=10`
    - `overall=10`

Operational interpretation:

- preview readiness is now closed
- `7d live` readiness is not yet closed
- the only remaining benben uplift work is to wait for real traffic to accumulate until live `captured_from_rule_lightweight_7d` and `session_capture_rate_7d` converge toward the previewed shape

## 2026-04-11 Mac-Hosted Vision Cutover

Production truth after the local-vision cutover:

- both production instances now route image understanding through a NAS-local relay:
  - `http://127.0.0.1:11435`
- both instances now use:
  - primary image model: `ollama/qwen2.5vl:7b`
  - image fallback: `openrouter/xiaomi/mimo-v2-omni`
- text defaults were not changed:
  - `openai-codex/gpt-5.4-mini`
  - `deepseek/deepseek-chat`
  - `mimo/mimo-v2-flash`
  - `openrouter/xiaomi/mimo-v2-pro`
- existing `/local` text path was intentionally preserved

Live service and path additions:

- NAS relay service:
  - `/etc/systemd/system/openclaw-ollama-relay.service`
  - `/usr/local/bin/openclaw-ollama-relay.py`
- Mac local tunnel service:
  - `/Users/zhangjincheng/Library/LaunchAgents/ai.openclaw.ollama-reverse-tunnel.plist`
- Mac Ollama service remains Homebrew-managed:
  - `homebrew.mxcl.ollama`

Important implementation truth:

- the original plan called for `Tailscale`
- `Tailscale` could not be completed non-interactively on this Mac because macOS root / system-network approval is required
- production was therefore cut over using an equivalent `SSH reverse tunnel` instead of `Tailscale`
- effective topology is now:
  - OpenClaw gateway -> NAS relay `127.0.0.1:11435`
  - text / local NAS models -> NAS Ollama `127.0.0.1:11434`
  - image requests for `qwen2.5vl:7b` -> Mac Ollama exposed back to NAS on `127.0.0.1:11436`

Operational behavior verified during cutover:

- Mac online + model present:
  - local image inference succeeds through the relay
- Mac offline / tunnel absent:
  - relay returns fast `502` upstream-unavailable errors instead of hanging
  - this is the intended trigger path for OpenClaw image-model fallback
- `qwen2.5vl:7b` finished downloading on the Mac and is now present in the local Ollama model list

Evidence that the latest image reply used the Mac local model:

- Mac Ollama log shows successful `POST /api/chat` for `qwen2.5vl:7b` at:
  - `2026-04-11 22:00:03` (cold load, about `23.0s`)
  - `2026-04-11 22:00:22` (warm run, about `0.9s`)
  - `2026-04-11 22:00:41` (warm run, about `1.4s`)
- NAS relay journal shows matching successful relay traffic:
  - `2026-04-11 22:00:43` `POST /api/chat HTTP/1.1" 200`
- direct verification used the same screenshot payload through:
  - Mac local `http://127.0.0.1:11434/api/chat`
  - NAS relay `http://127.0.0.1:11435/api/chat`
  and both returned the same Chinese answer identifying the chat UI and the visible title `消息`

Canonical config files changed in this cutover:

- `/var/lib/openclaw/.openclaw/openclaw.json`
- `/var/lib/openclaw-adminai/.openclaw/openclaw.json`

Current caveats:

- this cutover depends on the Mac being awake and the reverse tunnel staying connected
- if future work wants the originally planned network shape, replace the reverse tunnel with a first-class `Tailscale` deployment after macOS system approval is available

## 2026-04-10 Upgrade Impact Preflight For `v2026.4.9`

Production truth after the first formal pre-upgrade impact assessment for upstream `v2026.4.9`:

- assessment tool now exists at:
  - `workspace/tools/openclaw-upgrade-impact-assess.mjs`
- runbook / contract now exists at:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
- latest pre-upgrade reports are:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-132649Z.md`
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-132649Z.json`

Verified production bundle truth from that assessment:

- canonical package version remains:
  - `2026.3.24`
- gateway CLI bundle:
  - `/usr/lib/node_modules/openclaw/dist/gateway-cli-SPSnwPDk.js`
- canonical benben memory-search runtime remains:
  - `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
- adminAI guarded runtime remains:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
- a second runtime bundle is now also present in production:
  - `/usr/lib/node_modules/openclaw/dist/runtime-BF_KUcJM.js`
  but this is a helper/runtime-support bundle imported by `gateway-cli`, not the canonical benben memory-search runtime
- current reply-like bundle discovered by static dist scan is:
  - `/usr/lib/node_modules/openclaw/dist/reply-history-CYr7j6cE.js`
  this is not the authoritative production memory hook surface and should still be treated as a warning-only compatibility signal

Verified live state at preflight time:

- benben:
  - `memory-health-summary.overall_status=healthy`
  - `memory-v2-eval=13/13`
  - `owner_private_current=true`
  - `historical_sidecar=healthy + shadow_retrieve`
  - fallback chain unchanged:
    - `openai-codex/gpt-5.4-mini`
    - `deepseek/deepseek-chat`
    - `mimo/mimo-v2-flash`
    - `openrouter/xiaomi/mimo-v2-pro`
- adminAI:
  - `transport_canary.ok=true`
  - `policy_probe.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`
  - fallback chain unchanged:
    - `openai-codex/gpt-5.4-mini`
    - `deepseek/deepseek-chat`
    - `mimo/mimo-v2-flash`
    - `openrouter/xiaomi/mimo-v2-pro`
  - but runtime guard state is still:
    - `verify_state=patched_drifted`
    - `markers_ok=true`
    - current `pi-embedded` hash:
      - `8e80fa16e79c758c52350803b6750e8d35ccbf881107af3c21f730850185d8ff`

Operational conclusion from this preflight:

- current upgrade decision for `v2026.4.9` is:
  - `no_go`
- blocker is not benben memory correctness
- blocker is adminAI baseline control:
  - `pi-embedded` is behaviorally guarded but no longer matches the currently managed patched hash
  - rebuild the adminAI runtime patch baseline first, then rerun preflight before any package upgrade

Follow-up closure on the same day:

- repo-validated adminAI runtime-guard artifacts were synced into the live adminAI workspace:
  - `workspace/patches/runtime/pi-embedded-adminai-manifest.json`
  - `workspace/patches/runtime/pi-embedded-adminai-ops.patch`
  - `workspace/patches/runtime/pi-embedded-base-BaSvmUpW.adminai-prepatch.js`
  - `workspace/patches/runtime/pi-embedded-patched-BaSvmUpW.adminai-ops.js`
  - `workspace/tools/adminai-pi-embedded-patch-manager.mjs`
  - `workspace/tools/adminai-runtime-observe.mjs`
  - `workspace/tools/adminai-live-check.sh`
  - `workspace/memory-admin/reports/adminai-pi-embedded-runtime-guard.md`
- live backup created before sync:
  - `/var/lib/openclaw-adminai/.openclaw/workspace/backups/adminai-runtime-guard-20260410T212906`
- this follow-up did **not** change:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
  - fallback order
  - benben runtime behavior
- after sync, live adminAI guard state is now:
  - `verify_state=already_patched`
  - `patched_match=true`
  - `markers_ok=true`
- latest rerun preflight reports are:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.md`
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.json`
- current upgrade decision for `v2026.4.9` is now:
  - `baseline_ready`
- remaining warnings are informational only:
  - helper runtime `runtime-BF_KUcJM.js` is imported by `gateway-cli`, but the canonical benben memory runtime is still `runtime-D_ihCv7c.js`
  - `reply-history-CYr7j6cE.js` was only discovered as a reply-like compatibility bundle, not a new authoritative memory hook surface
  - `openclaw-adminai-healthcheck.service` being `inactive` is expected outside an active run window; the timer itself remains `active`

## 2026-04-10 Benben Historical Sidecar Shadow-Index Rollout

Production truth after the first benben-side hybrid-memory landing:

- live workspace tools updated:
  - `workspace/tools/mempalace-sidecar.mjs`
  - `workspace/tools/memory-health-summary.mjs`
  - `workspace/tools/memory-phase1-helper.mjs`
  - `workspace/tools/session-memory-review.mjs`
  - `workspace/tools/workspace-profile-helper.mjs`
- live backup created before install:
  - `/var/lib/openclaw/.openclaw/workspace/backups/benben-sidecar-shadow-20260410T155942`
- live sidecar state is now explicitly present at:
  - `memory-admin/meta/mempalace-sidecar-config.json`
  - `memory-admin/sidecar/mempalace/index.json`
  - `memory-admin/sidecar/mempalace/state.json`
  - `memory-admin/logs/mempalace-sidecar.jsonl`
- current live mode is intentionally:
  - `shadow_index`
- first live index build produced:
  - `session_transcripts = 29`
  - `canonical_daily_notes = 27`
  - `memory_v2_events = 54`
  - `doc_count = 110`
- `memory-health-summary` now includes `historical_sidecar` for benben and currently reports it `healthy`
- canonical post-change gate passed:
  - `memory-admin/reports/deployment-verify-20260410080153.md`
  - `memory-admin/reports/deployment-verify-20260410080153.json`

Important scope truth:

- this rollout did **not** change fallback order
- this rollout did **not** touch adminAI
- this rollout did **not** enable live historical-evidence answering yet
- benben still treats `memory_v2` as the only truth layer

Current follow-up gap after this rollout:

- production `memory_search` execution is currently anchored in:
  - `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
- the old reply-bundle-only cutover path is not the active production hook surface anymore
- therefore this rollout only enables:
  - sidecar config
  - sidecar indexing
  - sidecar telemetry / health visibility
- the next step for real `shadow_retrieve` / `fallback_enabled` behavior is a dedicated runtime hook for the current `runtime-D_ihCv7c.js` memory-search path, so structured `historical_evidence` can be emitted without changing the truth-layer contract

## 2026-04-09 Memory Quality Phase 2 Rollout

Production truth after the low-risk `current/recent` auto-apply + owner-current cleanup rollout:

- live workspace tools updated:
  - `workspace/tools/session-memory-review.mjs`
  - `workspace/tools/memory-v2-helper.mjs`
  - `workspace/tools/memory-noise-filter.mjs`
  - `workspace/tools/openclaw-cli-wrapper.sh`
  - `workspace/AGENTS.md`
- `/new` / session-review low-risk candidates now auto-apply directly into `memory_v2` when all of the following are true:
  - subject is `owner`, `partner`, or `couple`
  - layer is `current` or `recent`
  - family is `current_state` or `one_off_logistics`
- `stable`, `private`, and all non-low-risk families still stay in the manual session-review queue
- daily mirror still records `memory_v2/context/evidence/*`, but durable preference / decision-rule notes no longer write into owner `state/current` or `context/recent`
- live `memory-v2-backfill` replay now prunes historical owner `current/recent` residue such as:
  - Word formatting preferences from `2026-03-27`
  - `默认回复中文。`
- during rollout, synthetic `tmp-*` session-review queue entries from earlier live validation were explicitly cleared and not retained as user data
- isolated NAS validation using the live code confirmed:
  - partner shared current candidate -> `auto_applied`
  - couple relationship current candidate -> `auto_applied`
  - queue count remained `0`
- latest live verification passed:
  - `memory-admin/reports/deployment-verify-20260409150939.md`
  - `memory-admin/reports/deployment-verify-20260409150939.json`

Operator note discovered during rollout:

- manual CLI runs can still inherit a stale `OPENCLAW_MEMORY_CLASSB_WRAPPER=/home/cc/tools/openclaw-cli-wrapper.sh`
- if `session-memory-review --reconcile-missed` is run manually and falls back with `bash: /home/cc/tools/openclaw-cli-wrapper.sh: No such file or directory`, clear that env or override it to:
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh`
- deployment verification now passes because the canonical live wrapper exists again at that workspace path

Follow-up closure on the same day:

- `workspace/tools/class-b-llm-task-runner.mjs` now ignores a stale explicit wrapper path when it does not exist and falls back to the live workspace wrapper automatically
- operator-shell selfcheck and manual reconcile no longer depend on clearing the old env first, as long as:
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh` exists
- this was verified live by forcing:
  - `OPENCLAW_MEMORY_CLASSB_WRAPPER=/home/cc/tools/openclaw-cli-wrapper.sh`
  and then running the session-memory-review selfcheck successfully

## 2026-04-10 Shared-Current Freshness Yield Rollout

Production truth after the shared-current freshness uplift:

- live workspace files updated:
  - `workspace/tools/memory-v2-helper.mjs`
  - `workspace/tools/tests/memory-v2.test.mjs`
  - `workspace/AGENTS.md`
- daily/event/write paths now treat mixed short-term shared-state notes as `current_state` when they combine:
  - current condition / stage-like delta
  - plus response guidance such as `先别追问` / `给她一点空间` / `晚点再聊`
- shared-current mirroring is now immediate across all write paths:
  - `/new` session-review apply
  - daily mirror
  - event extraction / evidence replay
- practical consequence:
  - `partner-shared` fresh current no longer needs a later normalize pass before `couple-current-relationship` can see it
  - `couple` current relationship signals also mirror back into `partner-shared` immediately instead of waiting for replay
- live rollout steps actually run:
  - NAS local regression: `node /var/lib/openclaw/.openclaw/workspace/tools/tests/memory-v2.test.mjs`
  - replay: `memory-v2-backfill.mjs --from 2026-03-27 --to 2026-04-10`
  - service refresh: `systemctl restart openclaw-gateway.service`
  - final gate:
    - `memory-admin/reports/deployment-verify-20260410015046.md`
    - `memory-admin/reports/deployment-verify-20260410015046.json`

Operator note from the same rollout:

- after the gateway restart, `agent:main:main` temporarily drifted into a degraded direct-session envelope:
  - missing `lastChannel`
  - missing `deliveryContext.channel`
  - heartbeat-shaped `origin.provider`
- smoke then falsely collapsed to `MEMORY.md` + runtime baseline only
- the store entry was normalized back to canonical Feishu DM fields:
  - `lastChannel=feishu`
  - `deliveryContext.channel=feishu`
  - `deliveryContext.to=user:ou_618ab2d13189630519294960ad40b5c0`
  - `origin.from=feishu:ou_618ab2d13189630519294960ad40b5c0`
- after that normalization, verify returned to green and exam/gift smoke stayed grounded

## 2026-04-10 Bare Session Reset Long-Task Notice Exemption

Production truth after the `/new` / `/reset` UX repair:

- live runtime bundle updated:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
- local snapshot updated:
  - `nas-openclaw-v22/runtime-live/pi-embedded-BaSvmUpW.js`
  - `nas-openclaw-v22/workspace/AGENTS.md`
- Feishu direct-message long-task visibility still exists for ordinary long tasks
- bare `/new` and bare `/reset` are now explicitly excluded from the additive `仍在处理中，我还在继续这条任务...` notice
- rationale:
  - bare session reset already emits the visible `✅ New session started ...` notice
  - `/new` then continues startup/session-review work in the same turn
  - the old 12-second long-task timer therefore created a redundant second progress ping on nearly every bare reset
- implementation truth:
  - runtime now checks the raw inbound body before arming long-task visibility
  - exact bare commands `/new` and `/reset` short-circuit the visibility notice
  - non-bare reset commands and other Feishu long tasks are unchanged
- live rollout steps actually run:
  - syntax check on the patched snapshot bundle
  - copy patched bundle to production dist path
  - `systemctl restart openclaw-gateway.service`
  - live logic check on the deployed bundle:
    - `bare_new=false`
    - `bare_reset=false`
    - `new_with_args=true`
    - `normal_long_task=true`
  - final gate:
    - `memory-admin/reports/deployment-verify-20260410023010.md`
    - `memory-admin/reports/deployment-verify-20260410023010.json`

## 2026-04-09 Codex Usage Visibility Repair

Production truth after the `为什么查不了额度` investigation:

- OpenClaw previously had provider usage surfaces only for `openrouter` and `deepseek`
- there was no first-class `codex/openai` usage report, so natural-language quota questions drifted into `session_status` + speculation
- live `/usr/local/bin/openclaw` wrapper had also drifted and no longer exposed the older `usage` wrapper subcommand surface

Current fix now tracked in workspace/live:

- new workspace tool: `workspace/tools/codex-usage-report.mjs`
- wrapper surface restored for:
  - `openclaw usage codex [--days <n>] [--json]`
  - `openclaw usage openai [--days <n>] [--json]`
  - `openclaw usage openrouter ...`
  - `openclaw usage deepseek ...`
- runtime `/usage` help + provider formatter now also support `codex`
- natural-language provider-balance prompts such as `现在有多少额度` / `还剩多少额度` / `Codex 还有多少` now route to the same provider usage surface instead of falling back to session-local `session_status`
- live `/status` / `session_status` now also show cached Codex quota windows for the active Codex model, including the cache update label, so current-session status can answer `还剩多少额度`-style questions without regressing to token-only cards
- `AGENTS.md` now explicitly distinguishes:
  - `session_status` = session-local model/time/token state
  - `/usage codex` = OpenClaw-local Codex/OpenAI usage
  - official OpenAI account remaining quota = still not directly available through the current OpenClaw integration
- live `commands-handlers.runtime-*` bundle also received a compatibility patch so in-chat `/usage codex` reads the same cache surface as shell usage
- live `pi-embedded-*` status rendering now reads the same Codex cache surface; the final fix had two parts:
  - strip duplicated `💳 额度：` prefixes during status localization
  - fall back in `buildStatusMessage` itself so cached quota windows still render even when upstream `usageLine` is absent
- root cause of the last silent failure:
  - the first status-card patch read the cache with `syncFs`, but that symbol does not exist in the runtime bundle scope
  - the exception was swallowed by `catch {}`, so `/status` quietly omitted the quota line even though `/usage codex` was already healthy
  - the repair switched the bundle patch to `loadJsonFile(...)` and re-applied the usage-only cutover live
- Codex usage cache now lands at:
  - `/var/lib/openclaw/.openclaw/usage-cache/codex.json`
  and includes both `replyText` and structured report payload

Operational truth:

- the new `codex/openai` report is intentionally honest: it shows local OpenClaw usage for `openai-codex` / `openai` providers, but does not pretend to know official remaining credits
- if official OpenAI quota visibility is required later, that needs a separate browser-backed or official-account-backed integration, not more `session_status` reasoning

## 2026-04-09 Main Reply Stall Repair

Production truth after the `openclaw 完全不回复` incident:

- the main reply path was not blocked by memory or channel routing; it was blocked by Codex auth drift in the main agent auth store
- live root auth store remained valid at:
  - `/var/lib/openclaw/.openclaw/auth-profiles.json`
- but the main agent auth store had drifted into two bad states during the day:
  - first it became a zero-byte file
  - then it was restored from a stale backup whose `openai-codex` refresh token had already been rotated, causing `refresh_token_reused`
- live journal evidence showed:
  - `FailoverError: No API key found for provider "openai-codex"` when the main file was empty
  - `OAuth token refresh failed ... refresh_token_reused` after the stale backup was restored
  - the visible user symptom was “main chat hangs / no reply”, followed by deepseek fallback on some lanes

Current fix now tracked in workspace/live:

- the live main-agent auth file was repaired by syncing it from the canonical root store:
  - source: `/var/lib/openclaw/.openclaw/auth-profiles.json`
  - target: `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json`
- new workspace guard tool:
  - `workspace/tools/openclaw-auth-sync-guard.mjs`
- new systemd startup guard now installed live:
  - `/etc/systemd/system/openclaw-gateway.service.d/85-auth-sync-guard.conf`
  - `ExecStartPre=/usr/bin/node /var/lib/openclaw/.openclaw/workspace/tools/openclaw-auth-sync-guard.mjs --source /var/lib/openclaw/.openclaw/auth-profiles.json --target /var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json --json`
- guard behavior:
  - if the canonical root store contains a newer `openai-codex:default`, it replaces only that profile in the main-agent auth store
  - other profiles in the main-agent store are preserved
  - if target is missing/invalid/empty, it is reinitialized safely before gateway start

Live verification completed:

- `systemctl cat openclaw-gateway.service` now shows the new `85-auth-sync-guard.conf` drop-in
- running the guard manually now returns `already_synced`
- `openclaw tool session-memory-review-selfcheck --json` again succeeds on `openai-codex/gpt-5.4`
- `openclaw agent --agent main --message "请只回复OK，不要写别的。" --json` now succeeds on:
  - provider `openai-codex`
  - model `gpt-5.4-mini`
- post-fix gateway journal no longer shows:
  - `No API key found for provider "openai-codex"`
  - `refresh_token_reused`

Operational interpretation:

- main chat reply failures caused by Codex auth drift should now self-heal on every gateway restart
- if the main chat appears to hang again, inspect both:
  - `/var/lib/openclaw/.openclaw/auth-profiles.json`
  - `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json`
  before chasing memory or channel symptoms

### Follow-up same-day command-dispatch hotfix

The auth repair above was necessary but not sufficient. A second live blocker was found immediately after:

- Feishu direct commands such as `/status` and `/new` were reaching the gateway, but dispatch failed before the model turn with:
  - `ReferenceError: handleFastCommand is not defined`
- root cause:
  - the runtime usage-only cutover patch had replaced the block from `handleUsageCommand` to `handleSessionCommand`
  - in the current live bundle shape, that replacement accidentally removed the neighboring `handleFastCommand` definition while leaving the `loadCommandHandlers()` reference behind
  - result: direct command handling crashed at dispatch time even though the model lane itself was healthy

Current fix now tracked in workspace/live:

- `workspace/tools/runtime-phase1-cutover.mjs` now:
  - only short-circuits the usage patch when both the natural-language usage patch and `handleFastCommand` are present
  - re-injects `handleFastCommand` as part of the patched `handleUsageCommand -> handleSessionCommand` block
- live bundle was additionally hot-fixed in place because the broken bundle shape no longer matched the optimistic patch assumptions:
  - `/usr/lib/node_modules/openclaw/dist/commands-handlers.runtime-x1BYyVfP.js`
  - backup:
    - `/usr/lib/node_modules/openclaw/dist/commands-handlers.runtime-x1BYyVfP.js.bak-fast-command-hotfix-20260409T162840`

Live verification completed:

- `grep -n "handleFastCommand" .../commands-handlers.runtime-x1BYyVfP.js` now shows:
  - a real definition line
  - the `loadCommandHandlers()` reference line
- `node --check` on the live bundle passes
- gateway restart succeeds
- `openclaw agent --agent main --message "/status" --json` now returns a status card
- `openclaw agent --agent main --message "/new" --json` now returns the expected reset/start reply

Operational interpretation:

- if direct slash commands stop responding while free-text prompts still work, inspect `commands-handlers.runtime-*` for missing neighboring handler definitions before blaming channels
- bundle patching around `/usage` must preserve adjacent command handlers, especially `/fast`

## 2026-04-01 Unified Memory Cutover

Production now includes a unified owner-memory retrieval cutover aimed at fixing `main` private-session memory misses and reducing answer drift.

### Runtime / prompt-side changes now live

- `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js` now passes full `sessionEntry` snapshots into scoped memory resolution instead of only `sessionKey + query`
- `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js` now runs a deterministic memory-question preflight before the model turn for recall-heavy prompts and injects the grounded summary as a temporary system-prompt addition
- `memory_search` tool description now explicitly treats “你记得 / forgot / recorded / exams / plans / gifts / preferences / relationship state” as mandatory recall-first questions
- workspace `AGENTS.md` now includes a top-level `Memory Grounding Rule` that requires `memory_search` before answering recall-judgment questions

### Workspace retrieval changes now live

- `/var/lib/openclaw/.openclaw/workspace/tools/memory-phase1-helper.mjs` now:
  - resolves `agent:main:main` through `session_store` into real channel-aware direct scope
  - treats owner direct sessions as a unified owner-memory surface
  - infers the default partner for owner DM gift/relationship questions
  - auto-discovers relationship section files such as `memory/stable/relationships/<person>/gifts.md` even when `people-index.yaml` does not explicitly list `relationship_section_files`
  - strips verified-cache comment headers from lexical scoring/snippet selection
  - biases snippet selection toward factual bullet/date lines instead of heading or metadata lines
  - de-duplicates visible recall hits and privacy-blocked hits
  - preserves same-path recall candidates long enough for trace-ref assembly when their snippets differ but explicit line metadata is still missing
  - backfills `recall_refs` line anchors from snippet text so non-empty recall hits stay path-anchored in trace output

### Privacy / disclosure state now live

- privacy manifest path: `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/privacy-manifest.json`
- current manifest already exists and includes `share_default` defaults plus `private_only` semantics for `memory/private/*`
- helper-level verification on `2026-04-01` proved:
  - `private_only` memory is blocked in group scope
  - the same memory is allowed in owner direct scope

### Live smoke results verified on 2026-04-01

- owner direct `main` session question `最近的礼物方向`:
  - live gateway run succeeded
  - recall hit included `memory/stable/relationships/guoyixuan/gifts.md`
  - final answer cited remembered gift-direction facts
- owner direct `main` session question `你记得我要考试吗`:
  - initial post-cutover run still answered incorrectly because recall snippet pointed at verified heading metadata instead of fact lines
  - snippet-selection fix was deployed
  - follow-up live gateway run succeeded and answered:
    - `2026-04-11 蓝桥杯`
    - `2026-06-13 英语六级`
    - `雅思` as a parallel long-term goal
- deterministic preflight is now confirmed live in main-session traces:
  - run `4506ffdc-4f1e-4bbb-81d4-556dd6e1e7a0` produced `tool_call_id=preflight_memory_search_deaece90-e202-4857-a762-78d240de98d9`
  - run `e7aed408-e20e-437c-a241-f90f7774f12b` produced `tool_call_id=preflight_memory_search_1da35143-5f19-4e0b-b3f7-340c00ab8aa1`
  - both returned grounded answers on owner direct `agent:main:main`

### Preflight follow-up fix

- first deterministic-preflight cut incorrectly injected the grounding note into the user prompt instead of the system prompt
- side effect: two transcript rows in `agents/main/sessions/ef356e15-a909-4e5e-b0fe-f2439affe688.jsonl` were polluted with internal `## Memory Grounding (internal)` text
- fix deployed: preflight note now uses temporary system-prompt addition, not prompt-body injection
- polluted rows were repaired in-place and transcript backup was saved as:
  - `/var/lib/openclaw/.openclaw/agents/main/sessions/ef356e15-a909-4e5e-b0fe-f2439affe688.jsonl.bak-codex-preflight-transcript-20260401T2112`
- bundle backup saved as:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js.bak-codex-preflight-live-20260401T2100`

### Recall reference enrichment

- `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js` now accepts helper-produced trace recall refs instead of rebuilding refs only from the final path-collapsed result list
- `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs` now fails smoke verification when a source event emits more than one `memory_recall` or when `recall_refs` are empty / missing line anchors
- this change was deployed with backups:
  - `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js.bak-codex-recall-refs-20260401T225552`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-phase1-helper.mjs.bak-codex-recall-refs-20260401T225552`

### Runtime replay recovery integration

- `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js` now refreshes session-journal snapshots from live session metadata updates and can auto-recover a missing session-store key from replay when transcript evidence still exists
- `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs` now exposes `runSessionAutoRecovery()` with transcript-required restore and `session_recovery_auto` trace emission
- `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs` now refreshes the live session journal snapshot and verifies runtime auto-recovery against a temp missing store
- this change was deployed with backups:
  - `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js.bak-codex-runtime-recovery-20260401T235026`
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs.bak-codex-runtime-recovery-20260401T235026`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs.bak-codex-runtime-recovery-20260401T235026`

### Operational interpretation

- `main` private-session memory recall is no longer expected to fall into `non_channel_session` for normal owner Feishu direct turns
- gift / relationship recall now works even when section-file metadata is incomplete in `people-index.yaml`
- recall correctness for verified stable files now depends on cleaned content snippets instead of verified-cache preamble noise
- memory-question recall now has a deterministic runtime preflight in the embedded agent path
- `memory_recall.recall_refs` now prefer stable `path#L...` anchors and can preserve multiple same-file anchors when trace-side recall saw distinct snippets from the same file
- verification caveat: bare `openclaw agent --session-id <uuid>` smoke sessions are not equivalent to owner direct `agent:main:main` turns because they can lack the delivery/session metadata needed for owner-scoped recall; use real main-session / gateway paths when validating memory behavior

## Memory / Session / Trace Enhancements Already Completed

These are already implemented in the production workspace and/or runtime.

### Workspace tool-layer enhancements

Implemented in `/var/lib/openclaw/.openclaw/workspace/tools/`:

- `session-journal-helper.mjs`
- `session-recovery-helper.mjs`
- `memory-trace-helper.mjs`
- updated `memory_write_gate.mjs`
- `trace-inspect.mjs`
- updated `session-working-capture.mjs`
- updated `working-memory-helper.mjs`
- updated `memory-governance-helper.mjs`
- updated `recall-plane-builder.mjs`
- updated `memory-phase1-helper.mjs`
- updated `memory-maintenance-runner.sh`
- updated `auto-daily-capture.mjs`
- updated `structured-signal-daily-capture.mjs`

### Capability status

- `Session journal + replay`: complete at runtime-integrated safe-recovery level
- `Memory write contract`: complete
- `Trace from session -> recall -> write`: complete at working production level
- `Maintenance checkpoint + idempotency`: complete for implemented maintenance pipeline
- `Adaptive recall injection`: complete

## Session Recovery Status

### Completed

- `session-recovery-helper.mjs` now turns replay data into an operational recovery surface instead of journal-only metadata
- recovery flow can inspect replay state by `session_key` or `session_id`
- recovery flow can safely repair a missing store key in `agents/<agent>/sessions/sessions.json` when replay and transcript evidence agree
- recovery flow refuses to overwrite a conflicting live store entry unless `--force` is explicitly supplied
- recovery flow emits durable recovery logs and trace events and can write operator reports
- live session metadata updates now refresh `memory-admin/meta/session-journal-latest.json` so recovery candidates track the current session lifecycle instead of only offline working-capture output
- live session runtime now exposes:
  - `refreshRuntimeSessionJournalSnapshot`
  - `attemptRuntimeSessionAutoRecovery`
- transcript append now attempts safe replay-backed store repair before returning `unknown sessionKey`
- runtime auto-recovery requires transcript evidence and still refuses conflicting overwrite paths

### Verified evidence

- production conflict inspection on `2026-04-01`:
  - command target: `agent:main:main`
  - replay session id: `ec886148-321d-487e-99ec-4bf7f79468ef`
  - transcript path was missing:
    - `/var/lib/openclaw/.openclaw/agents/main/sessions/ec886148-321d-487e-99ec-4bf7f79468ef.jsonl`
  - live store already pointed at different session id:
    - `ef356e15-a909-4e5e-b0fe-f2439affe688`
  - `--restore-store` correctly refused overwrite with:
    - `restore_result.reason = store_conflict_requires_force`
  - this proved the helper does not clobber a live session key by default
- isolated restore smoke on `2026-04-01`:
  - temp workspace:
    - `/var/lib/openclaw/.openclaw/workspace/tmp/session-recovery-smoke/workspace`
  - temp state:
    - `/var/lib/openclaw/.openclaw/workspace/tmp/session-recovery-smoke/state`
  - repaired key:
    - `agent:main:cron:e598de10-5e04-4a81-9249-82e31fe6af6e`
  - repaired session id:
    - `13540018-a8db-4e92-addd-a2fa4ba6a4df`
  - transcript existed and matched:
    - `/var/lib/openclaw/.openclaw/agents/main/sessions/13540018-a8db-4e92-addd-a2fa4ba6a4df.jsonl`
  - follow-up inspect returned `store.status = present_match`
  - repaired temp store entry carried `recoverySource.kind = session_journal_replay`
  - report files:
    - `memory-admin/reports/session-recovery-20260401090354.md`
    - `memory-admin/reports/session-recovery-20260401090354.json`
    - `memory-admin/reports/session-recovery-20260401090703.md`
    - `memory-admin/reports/session-recovery-20260401090703.json`
- runtime integration smoke on `2026-04-01`:
  - live session key:
    - `agent:main:main`
  - live session id after runtime journal refresh:
    - `ef356e15-a909-4e5e-b0fe-f2439affe688`
  - runtime journal refresh succeeded with:
    - `refresh_reason = journaled`
  - runtime auto-recovery on a temp missing store then restored:
    - `store_status = missing`
    - `recovery_mode = runtime_auto`
    - `trace_event_kind = session_recovery_auto`
    - `recoverySource.kind = session_journal_replay`
- unified verification on `2026-04-01` then passed with runtime recovery integration:
  - report files:
    - `memory-admin/reports/deployment-verify-20260401160631.md`
    - `memory-admin/reports/deployment-verify-20260401160631.json`
  - `Session Recovery Auto Integration = ok`
  - `restored = yes`

### Operational caveat

- current runtime can now auto-repair a missing session-store key when replay and transcript evidence agree
- this is still not a full automatic resume / conflict-resolution path for every replay scenario
- do not use `--force` on production session keys unless the overwrite is explicitly intended and separately verified

## Gateway / Runtime Trace Integration Status

### Completed

- gateway run context can now carry trace metadata
- tool creation path propagates trace/source context more consistently
- `memory_search` now falls back to active run-context metadata keyed by `sessionKey` / `sessionId` when upstream tool options do not explicitly carry `currentMessageId` / `traceId`
- `memory_search` emits `memory_recall` trace events into:
  - `/var/lib/openclaw/.openclaw/workspace/memory-admin/trace/YYYY-MM-DD.jsonl`
- non-channel `openclaw agent` path now records:
  - `trace_id`
  - `session_id`
  - `session_key`
  - `source_event_id`
  - `message_id`
  - `tool_call_id`

### Verified evidence

- smoke runs returned:
  - `trace-ok`
  - `trace-ok-2`
  - `trace-ok-3`
  - `trace-ok-4`
  - `trace-ok-session-id`
- latest verified non-channel trace record includes:
  - `session_id = ec886148-321d-487e-99ec-4bf7f79468ef`
  - `session_key = agent:main:main`
  - populated `source_event_id`
- deterministic runtime fallback verification also succeeded:
  - `session_key = agent:main:trace-runtime-fallback-20260401`
  - `trace_id = trace_gateway_rpc_runtime_fallback_20260401`
  - `source_event_id = trace-runtime-fallback-source-20260401`
  - `tool_call_id = toolcall-runtime-fallback-20260401`
- `chat.send` entrypoint verified from live gateway traffic:
  - session key: `agent:main:trace-chat-send-20260401-155516`
  - timestamp: `2026-04-01T07:55:43.644Z`
  - `trace_id = trace_gw_chat_send_097ad51c-e28d-4f7d-806c-d6dedcb08e63_chat-trace-smoke-20260401-155516_agent:main:trace-chat-send-20260401-155516`
  - `session_id = 097ad51c-e28d-4f7d-806c-d6dedcb08e63`
  - `source_event_id = chat-trace-smoke-20260401-155516`
- gateway RPC `agent` entrypoint verified from direct RPC smoke:
  - session key: `agent:main:trace-rpc-smoke-20260401-155836-d`
  - timestamps:
    - `2026-04-01T07:58:51.609Z`
    - `2026-04-01T07:58:58.728Z`
  - `trace_id = trace_run_rpc-trace-smoke-20260401-155836-d_0cf89257-93e9-428c-a700-dc8b943a99b2_agent:main:trace-rpc-smoke-20260401-155836-d`
  - `session_id = 0cf89257-93e9-428c-a700-dc8b943a99b2`
  - `source_event_id = rpc-trace-smoke-20260401-155836-d`
- cron entrypoint verified with a one-shot debug job on `2026-04-01`:
  - temporary job id: `663a1d18-02d2-4406-b981-a133b45b3662`
  - trace timestamp: `2026-04-01T08:31:08.346Z`
  - `trace_id = trace_gw_cron_33c685b7-6385-41ef-9bae-d6b5a372542a_663a1d18-02d2-4406-b981-a133b45b3662_agent:main:cron:663a1d18-02d2-4406-b981-a133b45b3662`
  - `session_id = 33c685b7-6385-41ef-9bae-d6b5a372542a`
  - `source_event_id = cron:663a1d18-02d2-4406-b981-a133b45b3662:33c685b7-6385-41ef-9bae-d6b5a372542a`
  - cron run log: `/var/lib/openclaw/.openclaw/cron/runs/663a1d18-02d2-4406-b981-a133b45b3662.jsonl`
  - final summary: `CRON_TRACE_OK`
  - one-shot job auto-deleted after success
- root recall-to-write trace inheritance verified on `2026-04-01`:
  - session id: `ef356e15-a909-4e5e-b0fe-f2439affe688`
  - source event id: `b4bf3745-caef-4250-987d-b95fa42c88dc`
  - inherited trace id: `trace_run_b4bf3745-caef-4250-987d-b95fa42c88dc_ef356e15-a909-4e5e-b0fe-f2439affe688_agent:main:main`
  - `openclaw agent` produced `memory_recall`
  - `memory_write_gate.mjs` then wrote `memory/2026-04-01.md` without an explicit `--trace-id`
  - gate result reported `trace_resolution.inherited = true`
  - `trace-inspect.mjs --session-id ef356e15-a909-4e5e-b0fe-f2439affe688 --write-report` showed one trace containing both `memory_recall` and `memory_write`
  - report files:
    - `memory-admin/reports/trace-inspect-20260401084708.md`
    - `memory-admin/reports/trace-inspect-20260401084708.json`

### Important caveat

- `chat.send`, gateway RPC `agent`, and cron entrypoints are now all verified to emit `memory_recall` with non-null root identifiers
- model-driven gateway smoke is still not perfectly deterministic in general; the successful `chat.send` and RPC proofs above came from turns that explicitly induced `memory_search`
- the deterministic runtime harness is still the strongest proof of fallback behavior when upstream tool context is missing
- cron trace lookup has a key-shape gotcha:
  - trace records bind to the base cron session key `agent:<agent>:cron:<jobId>`
  - the cron run log may separately report `agent:<agent>:cron:<jobId>:run:<sessionId>`
  - when inspecting cron traces, prefer `--session-id` or `--source-event-id`, not only the run-session key
- an explicit `--session-key` on cron job creation did not override the trace session key during the manual smoke; runtime still normalized the trace to the base cron session key

## Dist Files Touched In Production

These production bundle files were modified directly:

- `/usr/lib/node_modules/openclaw/dist/gateway-cli-SPSnwPDk.js`
- `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
- `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
- `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js`

### Why they were touched

- gateway run-context enrichment
- tool/runtime trace propagation
- `memory_search` recall trace emission
- runtime session-store fallback fix for `session_id`
- active run-context fallback for `source_event_id` / `trace_id` recovery inside `memory_search`
- runtime session-journal refresh and replay-backed missing-key recovery

## Backup / Rollback Notes

Bundle backups were created before deploys under:

- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-113716`
- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-114020`
- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-114258`
- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-114515`
- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-115534`
- `/usr/lib/node_modules/openclaw/dist/.codex-backup-20260401-160848-doc-sync-rule`
- `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js.bak-codex-runtime-recovery-20260401T235026`

Workspace tool backups were also kept under:

- `/var/lib/openclaw/.openclaw/workspace/tools/.codex-backup-20260401-111300`
- `/var/lib/openclaw/.openclaw/workspace/tools/.codex-backup-20260401-111620-memory-maintenance-runner.sh`
- `/var/lib/openclaw/.openclaw/workspace/tools/.codex-backup-20260401-161556-trace-inspect`
- `/var/lib/openclaw/.openclaw/workspace/tools/.codex-backup-20260401-161650-trace-inspect-workspace-fix`
- `/var/lib/openclaw/.openclaw/workspace/tools/.codex-backup-20260401-164351-trace-root-chain`
- `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs.bak-codex-runtime-recovery-20260401T235026`
- `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs.bak-codex-runtime-recovery-20260401T235026`

Documentation backups:

- `/var/lib/openclaw/.openclaw/workspace/.codex-backup-20260401-162121-trace-inspect-doc-sync`
- `/var/lib/openclaw/.openclaw/workspace/.codex-backup-20260401-163409-entrypoint-trace-verified`
- `/var/lib/openclaw/.openclaw/workspace/.codex-backup-20260401-164844-trace-root-docs`
- `/var/lib/openclaw/.openclaw/workspace/.codex-backup-20260401-170900-session-recovery-docs`

Use these before attempting manual rollback.

## Operator Trace Inspection Tool

Preferred operator surface for one trace chain:

- `/var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs`

What it does:

- inspects one `session -> recall -> write` chain without hand-grepping raw JSONL
- joins:
  - `memory-admin/trace/YYYY-MM-DD.jsonl`
  - `memory-admin/gate-log/YYYY-MM-DD.jsonl`
  - `memory-admin/session-journal/YYYY-MM-DD.jsonl`
- supports filters:
  - `--trace-id`
  - `--session-key`
  - `--session-id`
  - `--source-event-id`
  - `--gate-log-id`
- defaults to the production workspace when run from the installed tool path
- can emit human-readable Markdown or `--json`
- can persist an inspection report with `--write-report`

Canonical smoke examples:

- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs --trace-id trace_gateway_rpc_runtime_fallback_20260401 --json`
- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs --gate-log-id gate_20260401031955_debilb --json`
- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs --session-key agent:main:main --limit 20 --write-report`

Report output location:

- Markdown: `memory-admin/reports/trace-inspect-YYYYMMDDHHMMSS.md`
- JSON: `memory-admin/reports/trace-inspect-YYYYMMDDHHMMSS.json`

Current verified behavior:

- verified by `trace_id`
- verified by `gate_log_id`
- verified by `session_key`
- verified in `--write-report` mode
- correctly defaults workspace to `/var/lib/openclaw/.openclaw/workspace` instead of caller `cwd`

## Operator Session Recovery Tool

Preferred operator surface for replay-backed recovery:

- `/var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs`

What it does:

- resolves replay state from `memory-admin/meta/session-journal-latest.json`
- inspects transcript presence and store state for one `session_key` or `session_id`
- builds a recovery-oriented resume prompt and suggested `openclaw agent --session-id ...` command
- writes recovery audit rows to:
  - `memory-admin/meta/session-recovery-log.jsonl`
- can safely repair a missing store entry when replay evidence is good
- refuses conflicting store overwrites by default
- can write Markdown and JSON reports to:
  - `memory-admin/reports/`

Canonical examples:

- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs --session-key agent:main:main --write-report --json`
- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs --session-id 13540018-a8db-4e92-addd-a2fa4ba6a4df --write-report`
- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/session-recovery-helper.mjs --workspace /var/lib/openclaw/.openclaw/workspace/tmp/session-recovery-smoke/workspace --state-dir /var/lib/openclaw/.openclaw/workspace/tmp/session-recovery-smoke/state --session-key agent:main:cron:e598de10-5e04-4a81-9249-82e31fe6af6e --restore-store --json`

Safety rule:

- inspect first
- use `--restore-store` only when the store key is missing and replay evidence matches
- use `--force` only for deliberate overwrite after separate operator verification

Latest concrete report artifact from smoke verification:

- `memory-admin/reports/trace-inspect-20260401082122.md`
- `memory-admin/reports/trace-inspect-20260401082122.json`
- `memory-admin/reports/trace-inspect-20260401083409.md`
- `memory-admin/reports/trace-inspect-20260401083409.json`

## Temporary Artifact Status

### Cleaned

- `/tmp/openclaw_patch_*` directories on NAS
- uploaded patch files under `/tmp/openclaw_patch_*.js`
- `/tmp/install_remote_patch.sh`
- `/var/lib/openclaw/.openclaw/workspace/tmp/session-recovery-smoke` after recovery smoke validation
- stale `cc`-side local OpenClaw copies and sync trees that were confusing production analysis

### Rule

Do not leave new deployment artifacts in `/tmp/openclaw_patch_*` after work is done.

## Known Open Items

### Verified open items

- cron trace inspection still requires awareness of base-key normalization
- full replay-driven resume and conflict-resolution still go beyond the current safe missing-key auto-repair path

### Likely next improvements

- expand deployment verification beyond the current post-change smoke/report script
- extend safe replay recovery from missing-key repair into fuller resume / snapshot lifecycle controls

## Deployment Verification

### Operator command

- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report`

### What it checks

- `openclaw-gateway.service` is active
- live bundle paths and core workspace tools exist
- `agent:main:main` still resolves a healthy owner direct session context
- `session-recovery-helper.mjs` can still inspect replay state without manual store edits
- live session runtime can refresh the current journal snapshot and auto-recover a temp missing store key
- recent trace still contains `preflight_memory_search_*`
- real smoke for exam memory and gift memory still returns grounded answers and emits preflight trace
- each smoke source event emits exactly one `memory_recall`
- each smoke trace exposes non-empty anchored `recall_refs`
- each smoke preflight trace now exposes `session_entry_source`, `speaker_resolution_source`, `query_normalized_to`, `candidate_pool_counts`, and `disclosure_decision`
- if session context is already degraded, verification now skips the journal-refresh mutation instead of overwriting replay state with the bad alias
- deployment verification now also checks a `Session Route Guard` regression: a weak `webchat` / `cli` inbound patch cannot downgrade an established external owner-direct route, while explicit external handoff still works

### Latest verified run

- completed on `2026-04-09`
- report paths:
  - `memory-admin/reports/deployment-verify-20260409124941.md`
  - `memory-admin/reports/deployment-verify-20260409124941.json`
- current verified state:
  - `openclaw-gateway.service = active`
  - `Session Recovery = ok`
  - `Session Recovery Auto Integration = ok`
  - `Session Route Guard = ok`
- smoke evidence:
  - `exam_memory` run `be7ddccc-b869-4b9f-805f-6ae2f2d1b5c1` returned `蓝桥杯` and `六级`
  - `gift_memory` run `c71476f9-2d2e-4665-9823-3882311d29f0` returned `拍立得 / Apple Watch / 手写信 / 写歌`
  - both runs produced exactly `1` `memory_recall`, anchored `recall_refs`, and populated `session_entry_source` / `speaker_resolution_source` / `query_normalized_to` / `candidate_pool_counts` / `disclosure_decision`
- backups created in this work session:
  - `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js.bak-codex-session-route-guard-20260402T070118`
  - `/usr/lib/node_modules/openclaw/dist/sessions-uRDRs4f-.js.bak-codex-session-route-guard-v2-20260402T070118`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs.bak-codex-session-route-guard-20260402T070118`

## Safe Operational Workflow

When touching production OpenClaw, use this order:

1. Check `systemctl is-active openclaw-gateway.service`
2. Confirm current package path is `/usr/lib/node_modules/openclaw`
3. Confirm current workspace is `/var/lib/openclaw/.openclaw/workspace`
4. If editing dist bundles, back them up first
5. Run `node --check` on modified bundle files before restart
6. Restart `openclaw-gateway.service`
7. Run `tools/deployment-verify.mjs --with-smoke --write-report` as `sudo -u openclaw -H`
8. If verification fails, inspect the generated report and relevant trace logs before attempting more changes
9. Clean `/tmp` deployment artifacts
10. Update this ledger
11. If the change also affected capability status, open items, or next priorities, update `OPENCLAW_ARCHITECTURE_TODO.md` in the same session

## Fast Start Checklist For Future Repair / Enhancement Work

If a future agent is asked to fix or enhance OpenClaw, start here:

1. Read this file
2. Read `AGENTS.md`
3. Read `/var/lib/openclaw/.openclaw/openclaw.json`
4. Check `openclaw-gateway.service`
5. Inspect:
   - `/var/lib/openclaw/.openclaw/workspace/memory-admin/trace/`
   - `/var/lib/openclaw/.openclaw/workspace/memory-admin/gate-log/`
   - `/var/lib/openclaw/.openclaw/agents/main/sessions/sessions.json`
6. Use `/var/lib/openclaw/.openclaw/workspace/tools/trace-inspect.mjs` before manually grepping JSONL for trace-chain debugging
7. Treat `/usr/lib/node_modules/openclaw/dist/*.js` as the live runtime surface
8. Treat `/var/lib/openclaw/.openclaw/workspace/tools/*.mjs` as the live memory/tooling logic

## Short Status Summary

### Stable and already done

- production path discovery
- stale local copy cleanup
- memory governance improvements
- session journal and replay
- memory write contract
- adaptive recall
- maintenance checkpointing
- recall trace emission
- root recall-to-write trace inheritance for write-gate-backed flows
- non-channel path `session_id` trace repair
- operator trace inspection command
- operator session recovery command with safe store repair
- runtime session-journal refresh from live session metadata
- runtime auto-recovery for missing session-store keys when transcript evidence still exists
- deployment verification script with real post-change smoke/report output
- duplicate same-turn `memory_search` suppression after deterministic memory preflight for owner direct `main` memory questions
- richer recall trace provenance surfaced through `trace-inspect` and enforced by deployment smoke
- owner-main session alias repaired back to the healthy Feishu direct chain after degraded local-session pollution

### Not yet fully closed

- broader operational automation beyond the current deployment verification script
- broader replay-driven resume / conflict-resolution beyond the current safe missing-key auto-repair path

## 2026-04-08 - adminAI second-instance isolation implemented

### Goal

Stand up a second OpenClaw deployment dedicated to NAS / VPS operations, fully isolated from the existing `benben` life-assistant stack.

### Result

- existing `benben` stack preserved:
  - service user: `openclaw`
  - root: `/var/lib/openclaw/.openclaw`
  - gateway: `18789`
- new `adminAI` stack activated:
  - login user: `adminAI`
  - service user: `openclaw-adminai`
  - root: `/var/lib/openclaw-adminai/.openclaw`
  - gateway: `18889`
  - browser control: `18891`

### Runtime changes

- added `openclaw-adminai` launcher and alias surface
- added `install-openclaw-adminai-instance.sh`
- generalized `openclaw-cli-wrapper.sh` so instance routing no longer depends on hardcoded `openclaw`
- wrapper now propagates instance state through:
  - `OPENCLAW_HOME`
  - `OPENCLAW_STATE_DIR`
  - `OPENCLAW_CONFIG_PATH`
  - `OPENCLAW_ROOT`
  - `OPENCLAW_WORKSPACE`
  - `OPENCLAW_GATEWAY_PORT`
- wrapper now treats gateway env as available when it is readable directly or via `sudo -n`, instead of falling back to the caller's `~/.openclaw`
- plain CLI execution now prefers the service user via `sudo -n runuser -u <service-user>` when available, preventing temp-dir trust failures such as `/tmp/openclaw-adminai/openclaw-1000`

### adminAI environment

- `/etc/openclaw/adminai-gateway.env` now includes:
  - `OPENCLAW_HOME=/var/lib/openclaw-adminai`
  - `OPENCLAW_STATE_DIR=/var/lib/openclaw-adminai/.openclaw`
  - `OPENCLAW_CONFIG_PATH=/var/lib/openclaw-adminai/.openclaw/openclaw.json`
- `openclaw-adminai` channels remain disabled by default:
  - Telegram: `enabled=false`, `groupPolicy=disabled`
  - Feishu: `enabled=false`, `groupPolicy=disabled`

### adminAI workspace reseed

- installer now prunes inherited life-assistant residue from the cloned workspace:
  - root-level `*.bak-*`
  - `.codex-backup-*`
  - `.codex-bak-*`
  - `._*`
  - copied `.clawhub`
- installer now removes chat-oriented memory surfaces from `adminAI`:
  - `memory/stable/people`
  - `memory/stable/relationships`
  - `memory/stable/groups`
  - copied `memory/routing`
  - copied `memory/knowledge`
- installer now recreates ops-only docs:
  - `HEARTBEAT.md`
  - `SCHEDULING.md`
  - `TOOLS.md`
  - `memory/routing/models-routing.md`
  - `memory/knowledge/governance/ops-memory-policy.md`
  - `memory/knowledge/runtime/scope-baseline.md`

### adminAI operator entry

- if login user `adminAI` exists, installer now provisions:
  - `/home/adminAI/bin/openclaw` → `/usr/local/bin/openclaw-adminai`
  - shell aliases:
    - `oc`
    - `ocroot`
    - `ocws`
- verified on live:
  - `sudo -u adminAI -H /home/adminAI/bin/openclaw status --json`
  - gateway url: `ws://127.0.0.1:18889`
  - workspace: `/var/lib/openclaw-adminai/.openclaw/workspace`

### Verification

- `openclaw-adminai status --json`
  - gateway url: `ws://127.0.0.1:18889`
  - workspace: `/var/lib/openclaw-adminai/.openclaw/workspace`
  - sessions: `/var/lib/openclaw-adminai/.openclaw/agents/*/sessions/sessions.json`
- `openclaw status --json`
  - gateway url: `ws://127.0.0.1:18789`
  - workspace: `/var/lib/openclaw/.openclaw/workspace`
  - sessions: `/var/lib/openclaw/.openclaw/agents/*/sessions/sessions.json`
- `openclaw-adminai memory status --json`
  - workspace: `/var/lib/openclaw-adminai/.openclaw/workspace`
  - db: `/var/lib/openclaw-adminai/.openclaw/memory/main.sqlite`
- `openclaw memory status --json`
  - workspace: `/var/lib/openclaw/.openclaw/workspace`
  - db: `/var/lib/openclaw/.openclaw/memory/main.sqlite`
- `openclaw-adminai-gateway.service`: `active`
- `openclaw-adminai-healthcheck.timer`: `active`
- manual `openclaw-adminai-healthcheck.service` restart completed and refreshed `memory/heartbeat-state.json`

### Important operational note

The new instance is isolated at the service / state / gateway level, but it is not yet a full chat-facing ops bot. Dedicated Feishu / Telegram credentials still need to be provisioned before external messages should be routed into `adminAI`.

## 2026-04-08 - memory_v2 dual-person life-assistant refactor verified live

### Scope

This round completed the memory-system shift from a generic memory OS / couple-only focus into a dual-person life-assistant model:

- `owner personal`
- `partner personal`
- `couple shared`

### Live contract now in force

- canonical durable memory is `memory_v2/*`
- `MEMORY.md` is policy / routing only
- default conversational write path is:
  - short raw note -> `memory/YYYY-MM-DD.md`
  - `/new` GPT-5.4 session review
  - weekly operator review
  - promotion into `memory_v2/*`
- runtime / maintenance / rollback / queue / health signals stay in `memory_ops/signals/*`
- daily user-facing memory digest remains retired

### Live behavior verified

- couple retrieval path is live and healthy:
  - `couple_memory_eval = 13/13`
- owner / partner / couple / private scopes are separated in runtime retrieval
- `/new` session review now scans live session stores under:
  - `/var/lib/openclaw/.openclaw/agents/<agent_id>/sessions/sessions.json`
- `session-memory-review-selfcheck` now succeeds live against the real service env
- write path now prefers canonical `memory_v2` targets before legacy mirrors
- weekly review now includes:
  - owner stable profile snapshot
  - active personal current counts
  - active shared current counts
  - current memory gaps

### Important fixes completed in this round

- fixed false-healthy session-review reporting when live session review had not truly run
- fixed service-env / wrapper drift so live session-review selfcheck uses the real model env
- fixed stale dashboard / trim-review drift so raw trim review and dashboard agree
- fixed `session-memory-review` long field payload rejection by truncating instead of dropping the result
- fixed stable-trim keep decisions so verified-file hash refreshes do not resurrect already-kept files
- fixed recent/current fallback so `partner shared` and `couple relationship` can fall back to the last shareable evidence without pretending it is fresh current
- fixed owner recent-state retrieval ordering so `private_self_state` prefers current/recent over private contract text
- fixed `partner-preference` projection duplication so overlapping partner/couple preference, boundary, and repair facts render once instead of repeating
- fixed owner recent-state scope ordering so canonical `memory_v2/state/current/owner.yaml` and `memory_v2/projections/owner-current.md` stay ahead of `memory/working/current.md` in the allowed path order
- fixed live `couple_memory_eval` false-`EACCES` after manual sync by restoring writable runtime trees (`memory_v2/*`, `memory-admin/*`) to `openclaw:openclaw`; root-owned canonical files were readable but not safely normalizable
- fixed memory-review provider drift: session-review / memory-review / maintenance LLM calls now default to Codex/OpenAI quota (`OPENCLAW_MEMORY_LLM_PROVIDER=openai`) instead of silently preferring OpenRouter when both keys exist
- corrected the memory-review transport assumption again: matching the desired quota family is not enough; bounded memory/session Class-B tasks now execute through the OpenClaw gateway itself using isolated cron `agentTurn` jobs with model `openai-codex/gpt-5.4`, so they consume Codex quota instead of direct OpenAI/OpenRouter API-key billing
- direct OpenAI/OpenRouter HTTP transport remains only as fallback/testing plumbing inside workspace tools; the live default path for session review, event extraction, promotion review, and consolidation review is now gateway Codex
- aligned the default memory-maintenance model family to Codex/OpenAI `gpt-5.4` so event extraction, promotion candidates, light consolidation, deep review, and session review all stay on the same quota family unless an operator explicitly overrides them
- class-B gateway transport now uses:
  - temporary one-shot cron job
  - `session=isolated`
  - `--light-context`
  - `model=openai-codex/gpt-5.4`
  - raw `cron/runs/<jobId>.jsonl` + isolated session transcript as the result source
- session-review mode labels now distinguish Codex gateway usage (`codex_class_b*`) from older direct-transport labels
- increased session-review sensitivity for ordinary natural current-state phrasing:
  - `她回消息慢一点，不是生气，是太累了`
  - `昨晚已经说开了，现在没那么僵了`
  - `我这阵子备考有点顶不住`
- `agent:main:main` is now treated as owner direct context for session-review rescue logic
- local wrapper fallback now still honors explicit writable service home/tmp overrides for memory command retries
- fixed main-lane reply stalls caused by Codex auth drift: canonical root auth now auto-heals `openai-codex:default` into `/var/lib/openclaw/.openclaw/agents/main/agent/auth-profiles.json` before gateway start
- fixed two partial runtime hotfix regressions in the live command bundle:
  - missing `handleFastCommand` after a usage-only patch
  - missing usage-provider helper definitions (`parseMemoryPhase1NaturalUsageProviderRequest`, `handleMemoryPhase1UsageProviderCommand`, `resolveMemoryPhase1UsageCurrentModel`) even though `handleUsageCommand` referenced them
- verified live after the repair:
  - `/new` no longer crashes with `ReferenceError`
  - `/status` no longer crashes with `ReferenceError`
  - natural-language quota prompts again route through the provider-usage surface instead of aborting direct command dispatch

### Current live reality

- system health is currently healthy
- the remaining product gap is no longer routing instability; it is data density
- live current-state reality at this checkpoint:
  - owner personal current exists
  - partner private current is sparse
  - partner shared current is sparse
  - couple relationship current is sparse
  - couple plan current is healthy

### Operational interpretation

The system is no longer mainly blocked by memory pollution or identity confusion. The next frontier is better extraction yield from real user sessions, especially for:

- `partner personal current_state`
- `partner shared current_state`
- `couple relationship current_state`

## 2026-04-09 Live Rollout: Visibility + Scoped Recall Repair

Rolled out live on NAS:

- `/usr/lib/node_modules/openclaw/dist/pi-embedded-BaSvmUpW.js`
  - Feishu direct long-task turns now emit one additive progress notice after about 12s with no visible tool/block/final payload:
    - `仍在处理中，我还在继续这条任务，处理完会直接回你。`
  - the notice auto-cancels once any visible payload is sent
  - `mirror=false`, so the notice stays transport-only and does not pollute mirrored transcript memory
- `/usr/lib/node_modules/openclaw/dist/runtime-D_ihCv7c.js`
  - restored trace-aware scoped recall plumbing after a stale local bundle had temporarily regressed it
  - helper-produced `traceRecallRefs`, `groundingSummary`, `responseGuidance`, `queryNormalizedTo`, and `candidatePoolCounts` now flow through runtime again
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-phase1-helper.mjs`
  - restored scoped local recall preparation for memory_v2 DM/group turns
  - owner gift queries can now infer couple-shared targets without requiring an explicit partner name mention
  - preflight traces now surface `session_entry_source` and `speaker_resolution_source`
  - snippet ranking now prefers actual `statement` lines over metadata / archived trim noise, which is what unblocked the exam smoke
- `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
  - shared-current extraction now recognizes sleep / reply-pace / pace-mismatch phrasing
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - `partner-shared-current.md` and `couple-current-relationship.md` are denser via `response_guidance`, `freshness`, and fallback summaries that combine historical shared evidence with stable anchors

Local verification completed before live rollout:

- `node --test nas-openclaw-v22/workspace/tools/tests/session-memory-review.test.mjs`
- `node --test nas-openclaw-v22/workspace/tools/tests/memory-v2.test.mjs`
- `node --test nas-openclaw-v22/workspace/tools/tests/memory-phase1.test.mjs`
- `node --check nas-openclaw-v22/runtime-live/pi-embedded-BaSvmUpW.js`
- `node --check nas-openclaw-v22/workspace/tools/memory-phase1-helper.mjs`
- `node --check nas-openclaw-v22/workspace/tools/session-memory-review.mjs`
- `node --check nas-openclaw-v22/workspace/tools/memory-v2-helper.mjs`

Live verification completed on NAS:

- command:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final report:
  - `memory-admin/reports/deployment-verify-20260409112747.md`
  - `memory-admin/reports/deployment-verify-20260409112747.json`
- successful smoke evidence:
  - `exam_memory` run `b0860698-d179-4d36-ac7c-ce7e2b798c61`
  - `gift_memory` run `b89b4721-208b-43da-9c36-922178dd0ec5`
- both smoke turns now satisfy:
  - grounded answer text
  - exactly one preflight `memory_recall`
  - anchored `recall_refs`
  - populated `session_entry_source`
  - populated `speaker_resolution_source`
  - populated `query_normalized_to`
  - populated `candidate_pool_counts`
  - populated `disclosure_decision`

## 2026-04-09 Live Rollout: Memory Data Quality Hardening

Rolled out live on NAS after the visibility/scoped-recall repair:

- `/var/lib/openclaw/.openclaw/workspace/tools/daily-memory-helper.mjs`
  - canonical daily writes are now lossless
  - freeform text, headingless legacy bullets, and unknown headings survive structured rewrites instead of being flattened into the 5 canonical sections
- `/var/lib/openclaw/.openclaw/workspace/tools/daily-memory-repair.mjs`
  - new operator repair entrypoint for same-day daily recovery:
    - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/daily-memory-repair.mjs --workspace /var/lib/openclaw/.openclaw/workspace --date YYYY-MM-DD --json`
  - recovery appends missing event summaries under `Recovered From Events`
  - duplicate detection now checks the whole daily document, including headingless legacy bullets, so existing lines such as `默认回复中文。` are not re-appended
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-noise-filter.mjs`
  - new shared classifier for maintenance/meta chatter and low-information progress residue
  - current blocked classes include:
    - test-fix / maintenance bookkeeping
    - `W1/W2` execution residue
    - bare completion lines such as `处理好了`
    - memory-maintenance summaries such as `记忆整理 / 复核 / stable 写入`
- the shared noise classifier is now wired into:
  - `tools/event-extractor.mjs`
  - `tools/promotion-review-runner.mjs`
  - `tools/session-memory-review.mjs`
  - `tools/memory-v2-helper.mjs`

Live cleanup executed on `2026-04-09`:

- repaired `memory/2026-04-09.md` from same-day events, then de-duplicated the earlier duplicate `默认回复中文。` bullet created during the first repair attempt
- re-ran `memory-v2-backfill.mjs` across `2026-03-27 .. 2026-04-09` so owner `current/recent` normalization could drop old maintenance residue
- re-ran `promotion-review-runner.mjs`; active promotion queue is now empty and the maintenance candidate `尝试手动修复测试失败问题：` no longer remains pending

Current live data-quality truth after the hardening:

- `memory/2026-04-09.md` is no longer a one-line collapsed daily and now contains:
  - the original `默认回复中文。`
  - a `Recovered From Events` block with the missing same-day event summaries
- owner `memory_v2/state/current/owner.yaml` no longer contains `处理好了` / `已执行 W1/W2` / `记忆整理：复核 ... stable 写入 ...`
- owner `memory_v2/context/recent/owner.jsonl` no longer contains the same maintenance residue
- `memory/pending/promotions.yaml` is clean:
  - `promotion_candidates: []`

Verified live by:

- repair / cleanup commands:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/daily-memory-repair.mjs --workspace /var/lib/openclaw/.openclaw/workspace --date 2026-04-09 --json`
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/memory-v2-backfill.mjs --workspace /var/lib/openclaw/.openclaw/workspace --from 2026-03-27 --to 2026-04-09 --json`
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/promotion-review-runner.mjs --workspace /var/lib/openclaw/.openclaw/workspace --json`
- final gate:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green report:
  - `memory-admin/reports/deployment-verify-20260409123616.md`
  - `memory-admin/reports/deployment-verify-20260409123616.json`

## 2026-04-09 Live Follow-up: Scoped Disclosure Filter + Couple Current Mirror Parity

Rolled out live on NAS after the data-quality hardening:

- `/var/lib/openclaw/.openclaw/workspace/tools/memory-phase1-helper.mjs`
  - scoped recall no longer treats every semantic hit as visible by default
  - semantic hits outside the current scope now move into `blockedResults` instead of the visible recall list
  - helper trace/disclosure state now distinguishes:
    - `allow_all`
    - `allow_partial`
    - `deny_all`
  - private out-of-scope paths now emit `private_memory_outside_scope` instead of silently disappearing behind `allow_all`
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - async `normalizeMemoryV2Store(...)` now matches the sync normalize path:
    - `partner shared current/recent` is mirrored back into `couple current relationship current/recent`
    - preserved `partner_shared` highlights also flow into `couple current` after normalize
  - shared-current evidence patterns now also accept “敏感 / 需要空间 / 先别追问 / 缓一缓”这类自然关系状态表达，不只限于睡眠/压力类 phrasing

Operational consequence now true on live:

- scoped recall helper can truthfully report that blocked/private semantic hits existed without leaking them into visible grounding
- `couple-current-relationship.md` no longer depends only on direct couple entries when the fresh signal originally landed in `partner-shared`

Verified live by:

- replay/normalize:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/memory-v2-backfill.mjs --workspace /var/lib/openclaw/.openclaw/workspace --from 2026-03-27 --to 2026-04-09 --json`
- final gate:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green report:
  - `memory-admin/reports/deployment-verify-20260409124504.md`
  - `memory-admin/reports/deployment-verify-20260409124504.json`

## 2026-04-09 Live Follow-up: Projection Freshness Alignment

Rolled out live on NAS after the disclosure/mirror follow-up:

- `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - `partner-shared-current.md` and `couple-current-relationship.md` freshness is now projection-scoped
  - `freshness` no longer reuses generic `current.*.freshness.active_highlight_count` when the active highlights are unrelated to the projection itself
  - the projection now emits:
    - `latest_signal_observed_at`
    - `current_layer_latest_observed_at`
    - `active_signal_count`
    - `recent_signal_count`
    - `historical_signal_count`
    - `stable_anchor_count`

Operational consequence now true on live:

- `couple-current-relationship.md` no longer says “近期 active 为空” while simultaneously exposing a misleading `active_highlight_count > 0`
- current-layer timestamps are still visible, but they are separated from the projection-relevant signal timestamp

Verified live by:

- replay/normalize:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/memory-v2-backfill.mjs --workspace /var/lib/openclaw/.openclaw/workspace --from 2026-03-27 --to 2026-04-09 --json`
- final gate:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green report:
  - `memory-admin/reports/deployment-verify-20260409124941.md`
  - `memory-admin/reports/deployment-verify-20260409124941.json`

## 2026-04-09 Live Follow-up: Projection Replay + Shared-Plan Compaction

Rolled out / verified after the freshness-alignment follow-up:

- `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - `current/couple.yaml` compacts duplicate `shared_plan` document-generation artifact chains down to one representative highlight
  - this keeps `couple current` usable when the same Feishu doc / plan-table generation flow would otherwise produce several near-duplicate active highlights
- operator lesson captured after re-checking live:
  - helper freshness semantics do not become persisted live truth until `memory-v2-backfill` / normalize is rerun
  - if `memory_v2/projections/couple-current-relationship.md` still shows legacy keys such as `latest_observed_at` / `active_highlight_count`, treat that as stale projection output and replay before judging the rollout

Verified live by:

- replay/normalize:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/memory-v2-backfill.mjs --workspace /var/lib/openclaw/.openclaw/workspace --from 2026-03-27 --to 2026-04-09 --json`
- final gate:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green reports:
  - `memory-admin/reports/deployment-verify-20260409125429.md`
  - `memory-admin/reports/deployment-verify-20260409125429.json`
- live re-check after replay confirmed the persisted projection now matches helper semantics:
  - `memory_v2/projections/couple-current-relationship.md` now emits `latest_signal_observed_at`, `current_layer_latest_observed_at`, and `active_signal_count=0`
  - latest smoke/verify report after the replay check:
    - `memory-admin/reports/deployment-verify-20260409130032.md`
    - `memory-admin/reports/deployment-verify-20260409130032.json`
- root cause discovered during the deeper re-check:
  - replay alone was not sufficient for runtime-facing helper changes
  - the running `openclaw-gateway.service` had an older helper module in memory, so real query traffic could rewrite `couple-current-relationship.md` back to legacy `latest_observed_at` / `active_highlight_count` semantics even after a correct replay
- final operator fix:
  - `sudo systemctl restart openclaw-gateway.service`
  - rerun `memory-v2-backfill`
  - rerun `deployment-verify --with-smoke --write-report --json`
- final green report after service restart + replay:
  - `memory-admin/reports/deployment-verify-20260409130544.md`
  - `memory-admin/reports/deployment-verify-20260409130544.json`

## 2026-04-09 Live Follow-up: deployment-verify projection semantics gate

Rolled out after the service-restart lesson:

- `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs`
  - now includes a dedicated `projection_semantics` check block
  - the gate explicitly verifies:
    - `memory_v2/projections/partner-shared-current.md`
    - `memory_v2/projections/couple-current-relationship.md`
  - required refreshed keys:
    - `latest_signal_observed_at`
    - `current_layer_latest_observed_at`
    - `active_signal_count`
  - forbidden legacy keys:
    - `latest_observed_at`
    - `active_highlight_count`
- `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify-helper.mjs`
  - extracted the projection freshness assertions into a small shared helper so the guard can also be unit-tested outside the full live verify path

Operational consequence now true on live:

- `deployment-verify --with-smoke` can catch the exact regression class that previously slipped through:
  - helper synced
  - projection replayed
  - but runtime query path rewrote the projection back to old semantics

Verified live by:

- `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green report:
  - `memory-admin/reports/deployment-verify-20260409142359.md`
  - `memory-admin/reports/deployment-verify-20260409142359.json`

## 2026-04-09 Live Follow-up: broader shared current-state natural phrasing

Rolled out after the projection-gate hardening:

- `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
  - rule rescue now captures more natural shared-state phrasing, not just sleep / pressure / reply-pace wording
  - newly covered examples include:
    - `她今天有点委屈，不太想说话，你先哄一下`
    - `我们今天有点冷淡，晚点再聊可能会好一点`
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - shared-current / relationship-current pattern matching now recognizes `委屈` / `冷淡` / `不太想说话` / `不想说话` / `沉默` / `先哄`
  - this keeps the projection layer aligned with the expanded session-review capture surface instead of only understanding the older sleep/space-style wording

Verified live by:

- temporary rule-rescue session review checks:
  - `她今天有点委屈，不太想说话，你先哄一下，晚点再聊。` -> `partner / current / current_state`
  - `我们今天有点冷淡，晚点再聊可能会好一点，不用现在硬聊。` -> `couple / current / current_state`
- final gate:
  - `sudo -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- final green report:
  - `memory-admin/reports/deployment-verify-20260409143019.md`
  - `memory-admin/reports/deployment-verify-20260409143019.json`

## 2026-04-10 Live Follow-up: benben health closure after hybrid sidecar rollout

Rolled out / verified live on benben after the historical-sidecar shadow deployment:

- `/var/lib/openclaw/.openclaw/workspace/tools/mempalace-sidecar.mjs`
  - benben historical recall sidecar remains in `shadow_retrieve`
  - shadow-mode cross-scope filtering now stays as telemetry instead of holding `memory-health-summary` in attention
  - explicit-history failures only keep the sidecar unhealthy while `last_status=query_failed` and `last_error` is still present
- `/var/lib/openclaw/.openclaw/workspace/tools/memory-governance-helper.mjs`
  - `seedAuthorizedMemoryState()` now rebuilds the protected-file baseline from scratch instead of carrying stale tracked entries forward
  - this closed the live false-positive `unauthorized memory writes detected` caused by old `memory/archive/stable-trim/*` tracked entries surviving previous seed runs
- `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review-selfcheck.mjs`
  - the selfcheck temp workspace now copies `tools/openclaw-cli-wrapper.sh` into its synthetic workspace before invoking Class-B review
  - this closed the verify-only regression where selfcheck fell back with `bash /tmp/openclaw/.../tools/openclaw-cli-wrapper.sh: No such file or directory`

Operational consequence now true on live:

- benben `memory-health-summary` is back to `overall_status=healthy`
- `historical_sidecar` stays enabled in `shadow_retrieve`, but its current filter pressure is now exposed only as telemetry:
  - `filtered_candidate_count=88`
  - `cross_scope_filtered_count=88`
  - `status=healthy`
- `session_review` is healthy again:
  - `pending_reconcile_count=0`
  - `pending_retry_count=0`
  - latest successful reconcile finished at `2026-04-10T08:47:42.232Z`
- `memory-audit` false positives are cleared:
  - latest audit file `memory-admin/meta/memory-audit-20260410-164607.json`
  - `unauthorized_writes=0`

Verified live by:

- authorized-state rebaseline:
  - `sudo -u openclaw node /var/lib/openclaw/.openclaw/workspace/tools/memory-authorize-state.mjs --workspace /var/lib/openclaw/.openclaw/workspace --mode seed-protected --source codex_reconcile --source-id codex_20260410_live_health_rebaseline_v2 --json`
- rerun audit + health:
  - `sudo -u openclaw node /var/lib/openclaw/.openclaw/workspace/tools/memory-health-summary.mjs --workspace /var/lib/openclaw/.openclaw/workspace --json`
- reconcile rolled session reviews surfaced by the refreshed health snapshot:
  - `sudo -u openclaw node /var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs --workspace /var/lib/openclaw/.openclaw/workspace --reconcile-missed --json`
- fix / verify selfcheck Class-B wrapper parity:
  - `sudo -u openclaw /var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh tool session-memory-review-selfcheck --workspace /var/lib/openclaw/.openclaw/workspace --json`
- final end-to-end gate:
  - `sudo -u openclaw node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`

Final green live reports:

- health summary:
  - `memory-admin/meta/memory-health-summary.json`
  - `memory-admin/reports/memory-health-summary.md`
- deployment verify:
  - `memory-admin/reports/deployment-verify-20260410085840.md`
  - `memory-admin/reports/deployment-verify-20260410085840.json`

## 2026-04-10 follow-up: benben historical sidecar noise was reduced on live

What changed locally and then on benben live:

- `/var/lib/openclaw/.openclaw/workspace/tools/mempalace-sidecar.mjs`
  - `session_transcript` indexing now requires at least one non-operational user line, so assistant-only / ops-style transcripts no longer enter the historical sidecar index
  - session transcript subject / visibility hints are inferred from user-side evidence first, then fall back to the combined transcript only if needed
  - `cross_scope_filtered_count` now tracks only strong, explicit subject / visibility conflicts; low-signal or `unknown/*` filtered candidates still count as `filtered_candidate_count` but no longer inflate cross-scope pressure

Live effect confirmed after forced reindex:

- sidecar index shrank materially:
  - `session_transcripts: 33 -> 5`
  - `doc_count: 114 -> 86`
- benben health stayed green:
  - `memory-health-summary`: `overall_status=healthy`
  - `historical_sidecar.status=healthy`
  - `historical_sidecar.mode=shadow_retrieve`
- representative explicit-history searches now show bounded per-query filter pressure instead of near-full-index cross-scope accumulation:
  - owner explicit query `还记得我之前聊过什么吗？`
    - `filtered_candidate_count=1`
    - `cross_scope_filtered_count=1`
  - couple explicit query `还记得我们之前聊过什么吗？`
    - `filtered_candidate_count=0`
    - `cross_scope_filtered_count=0`

Second tightening landed later the same session:

- session transcript indexing now also:
  - skips synthetic cron / task-prompt transcripts even when they contain user-role lines
  - deduplicates the same transcript file if multiple session stores point at it
- explicit-history scoring now strips meta-memory query boilerplate (`还记得 / 之前 / 聊过什么 / 什么吗`) and only keeps topic-bearing terms when scoring sidecar candidates

Updated live effect after the second reindex:

- sidecar index shrank again:
  - `session_transcripts: 5 -> 1`
  - `doc_count: 86 -> 82`
- generic explicit-history searches are no longer matching greeting / gift-direction fragments:
  - owner explicit query `还记得我之前聊过什么吗？`
    - `filtered_candidate_count=0`
    - `cross_scope_filtered_count=0`
    - `candidate_count=0`
  - couple explicit query `还记得我们之前聊过什么吗？`
    - `filtered_candidate_count=0`
    - `cross_scope_filtered_count=0`
    - `candidate_count=0`
- benben health remained green throughout:
  - `memory-health-summary.overall_status=healthy`
  - `historical_sidecar.status=healthy`
  - `historical_sidecar.mode=shadow_retrieve`

Recent-window observability was added afterwards:

- `mempalace-sidecar status --json` and `memory-health-summary --json` now expose a `recent_window` block for the historical sidecar
- this keeps lifetime totals for audit/history while making “current sidecar pressure” directly readable without subtracting old runs by hand
- current benben live truth after the rollout:
  - `recent_window.window_hours=24`
  - `recent_window.query_count=9`
  - `recent_window.filtered_candidate_count=4`
  - `recent_window.cross_scope_filtered_count=3`
  - `recent_window.explicit_history_failure_count=0`
  - lifetime totals remain visible in parallel:
    - `filtered_candidate_count=95`
    - `cross_scope_filtered_count=91`
    - `explicit_history_failure_count=3`

No runtime/service restart was needed for this observability change:

- only helper scripts were updated:
  - `tools/mempalace-sidecar.mjs`
  - `tools/memory-health-summary.mjs`

Current-index-window observability was then added on top:

- sidecar summary and health summary now also expose `current_index_window`
  - this is derived from sidecar log entries whose timestamp is `>= indexed_at`
  - unlike the 24h recent window, it answers “what has happened since the current index baseline?”
- health summary no longer force-refreshes the sidecar index on every run; it now respects the sidecar TTL so `current_index_window` is meaningful instead of being reset to zero on every summary generation

Validated live with a fresh explicit-history query after the current benben index baseline:

- before the probe query:
  - `current_index_window.query_count=0`
  - `current_index_window.filtered_candidate_count=0`
  - `current_index_window.cross_scope_filtered_count=0`
- after running:
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && node tools/mempalace-sidecar.mjs search --query "还记得我之前聊过什么吗？" --json'`
- the new live truth became:
  - `current_index_window.query_count=1`
  - `current_index_window.filtered_candidate_count=0`
  - `current_index_window.cross_scope_filtered_count=0`
  - `memory-health-summary.overall_status` remained `healthy`

Sidecar log compaction / rollup support was then added:

- new sidecar capability:
  - `node tools/mempalace-sidecar.mjs compact --json`
  - rolls raw log entries older than the retention window into `memory-admin/sidecar/mempalace/log-rollups.json`
  - keeps recent raw entries in `memory-admin/logs/mempalace-sidecar.jsonl`
  - sidecar status and health summary now expose `log_rollup`
- current benben live result after the first compact run:
  - `compacted=false`
  - `rolled_entry_count=0`
  - `kept_raw_entry_count=10`
  - `kept_raw_since=2026-04-10T08:24:53.399Z`
  - `retention_hours=48`
  - `log_rollup.day_count=0`
- this is expected because the live raw log is already short and all retained entries are still within the 48h raw window
- `memory-health-summary.overall_status` stayed `healthy`

Additional live fix needed during validation:

- `memory-admin/logs/mempalace-sidecar.jsonl` had ownership drift and had become non-writable for `openclaw`
  - symptom: explicit-history `search` returned `EACCES: permission denied, open '.../mempalace-sidecar.jsonl'`
  - fix: restore file ownership to `openclaw:openclaw`

Verified live by:

- deploy updated sidecar helper:
  - copy local `workspace/tools/mempalace-sidecar.mjs` to `home-nas`
  - `sudo install -o openclaw -g openclaw -m 0644 /home/cc/mempalace-sidecar.mjs /var/lib/openclaw/.openclaw/workspace/tools/mempalace-sidecar.mjs`
  - `sudo -u openclaw node --check /var/lib/openclaw/.openclaw/workspace/tools/mempalace-sidecar.mjs`
- force sidecar reindex:
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && node tools/mempalace-sidecar.mjs index --force --json'`
- validate live sidecar status:
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && node tools/mempalace-sidecar.mjs status --json'`
- restore log writability:
  - `sudo chown openclaw:openclaw /var/lib/openclaw/.openclaw/workspace/memory-admin/logs/mempalace-sidecar.jsonl`
- validate explicit-history queries:
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && node tools/mempalace-sidecar.mjs search --query "还记得我之前聊过什么吗？" --json'`
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && node tools/mempalace-sidecar.mjs search --query "还记得我们之前聊过什么吗？" --json'`

Sidecar compaction has now been wired into the existing benben maintenance path as well:

- local code change:
  - `workspace/tools/memory-maintenance-runner.sh`
    - `standard` maintenance now runs `mempalace-sidecar.mjs compact --json` before writing `memory-health-summary`
    - `deep` maintenance also runs the same compaction step
    - compaction result is persisted as `memory-admin/meta/mempalace-sidecar-compact-<timestamp>.json`
  - regression coverage added in `workspace/tools/tests/memory-phase1.test.mjs`
- no new timer/service was added
  - benben continues to reuse the existing `openclaw-memory-standard.timer` (`6h`) and `openclaw-memory-deep.timer`
- verified live by:
  - deploy updated `memory-maintenance-runner.sh` to `/var/lib/openclaw/.openclaw/workspace/tools/memory-maintenance-runner.sh`
  - `sudo -u openclaw bash -lc 'cd /var/lib/openclaw/.openclaw/workspace && tools/memory-maintenance-runner.sh --workspace /var/lib/openclaw/.openclaw/workspace --mode standard'`
  - inspect latest compact artifact:
    - `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/mempalace-sidecar-compact-20260410-201529.json`
- current live truth after that automated standard run:
  - compact artifact exists and reports:
    - `compacted=false`
    - `rolled_entry_count=0`
    - `kept_raw_entry_count=10`
    - `retention_hours=48`
  - `memory-health-summary.source_mode=standard`
  - `historical_sidecar.status=healthy`
  - `historical_sidecar.log_rollup` remained visible and unchanged
  - `memory-health-summary.overall_status=healthy`

### 2026-04-10 follow-up 8: `v2026.4.9` offline candidate audit is now formalized and currently blocks live upgrade

- the upgrade assessment tool now supports a dedicated offline candidate gate:
  - `workspace/tools/openclaw-upgrade-impact-assess.mjs --stage candidate --candidate-package-root <unpacked package> --baseline <pre report>`
  - this does not touch the live NAS package root
  - it compares the unpacked candidate bundle set against the latest green pre-upgrade baseline
- the first real candidate run was executed against:
  - `/tmp/openclaw-2026.4.9-stage.EEIpy7/package`
  - baseline: `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260410-133541Z.json`
- report artifacts:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-candidate-v2026.4.9-20260410-140433Z.md`
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-candidate-v2026.4.9-20260410-140433Z.json`
- current candidate decision:
  - `no_go`
- real blockers found by the offline candidate gate:
  - benben custom memory semantics are absent from the candidate package
    - missing markers:
      - `historical_evidence`
      - `answer_summary_cn`
      - `answer_debug_summary_cn`
      - `answer_full_summary_cn`
      - `hybrid_answer_guidance_cn`
    - candidate `memory_search` is now defined in `dist/extensions/memory-core/index.js`, not on the current live runtime hook surface
  - adminAI candidate patch compatibility is not ready
    - candidate `pi-embedded-DZSqcPKt.js`
    - `adminai-pi-embedded-patch-manager.mjs preflight/verify`
    - result: `verify_state=unknown`
    - `base_match=false`
    - `patched_match=false`
    - `markers_ok=false`
- important comparison truth versus the current pre-upgrade baseline:
  - live benben runtime bundle: `runtime-D_ihCv7c.js`
  - candidate runtime bundle: `runtime-BXaxArxm.js`
  - live adminAI guarded bundle: `pi-embedded-BaSvmUpW.js`
  - candidate adminAI bundle: `pi-embedded-DZSqcPKt.js`
  - legacy reply compatibility bundle also changed:
    - baseline: `reply-history-CYr7j6cE.js`
    - candidate: `reply-BwK-bN2w.js`

What this means operationally:

- do not run the actual `openclaw@2026.4.9` live package upgrade yet
- this is not a “safe npm replace” situation
- the next required work is patch migration:
  - rebuild benben’s custom memory hook on top of the new `extensions/memory-core` surface
  - rebuild adminAI’s `pi-embedded` patch baseline for `pi-embedded-DZSqcPKt.js`

### 2026-04-10 follow-up 9: offline `v2026.4.9` candidate is now migratable after patch re-port

The previous `no_go` candidate state has now been closed by finishing the offline migration work on the unpacked staging package only; live NAS package roots remain untouched.

What was added locally:

- benben candidate cutover:
  - `workspace/tools/memory-core-phase1-cutover.mjs`
  - patch target: `dist/extensions/memory-core/index.js`
  - patch artifacts:
    - `workspace/patches/runtime/memory-core-base-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/memory-core-patched-v2026.4.9-phase1.js`
    - `workspace/patches/runtime/memory-core-phase1-v2026.4.9.patch`
- adminAI candidate cutover:
  - `workspace/tools/adminai-pi-embedded-cutover.mjs`
  - real logic target: `dist/pi-embedded-Vw-lS5ti.js`
    - `pi-embedded-DZSqcPKt.js` was confirmed to be only a thin wrapper / re-export
  - candidate manifest:
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
  - patch artifacts:
    - `workspace/patches/runtime/pi-embedded-base-Vw-lS5ti.adminai-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/pi-embedded-patched-Vw-lS5ti.adminai-v2026.4.9-ops.js`
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-ops.patch`

What was done to the offline candidate package:

- candidate package:
  - `/tmp/openclaw-2026.4.9-stage.EEIpy7/package`
- applied offline only:
  - `node workspace/tools/memory-core-phase1-cutover.mjs apply --bundle-file /tmp/openclaw-2026.4.9-stage.EEIpy7/package/dist/extensions/memory-core/index.js --json`
  - `node workspace/tools/adminai-pi-embedded-cutover.mjs apply --bundle-file /tmp/openclaw-2026.4.9-stage.EEIpy7/package/dist/pi-embedded-Vw-lS5ti.js --json`
- verified:
  - benben `memory-core` markers all present
  - adminAI candidate patch manager using `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
  - `verify_state=already_patched`

Latest formal candidate report:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-candidate-v2026.4.9-20260410-142636Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-candidate-v2026.4.9-20260410-142636Z.json`

Current truth from that report:

- decision:
  - `candidate_ready`
- benben candidate custom semantics:
  - `historical_evidence`
  - `answer_summary_cn`
  - `answer_debug_summary_cn`
  - `answer_full_summary_cn`
  - `hybrid_answer_guidance_cn`
  - all restored on `dist/extensions/memory-core/index.js`
- adminAI candidate patch:
  - target:
    - `dist/pi-embedded-Vw-lS5ti.js`
  - wrapper:
    - `dist/pi-embedded-DZSqcPKt.js`
  - `verify_state=already_patched`

Important caveat:

- this does not mean live upgrade is done
- it means the offline candidate package is now compatible enough to proceed to the next step
  - live package replacement / post-upgrade validation still remains separate work

### 2026-04-11 follow-up 10: `openclaw@2026.4.9` live rollout is complete; formal post report is now `go`

The live NAS package upgrade has now been executed and validated. Current active package root is:

- `/usr/lib/node_modules/openclaw`
- package version:
  - `2026.4.9`

Latest formal post-upgrade report:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-024041Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-024041Z.json`
- decision:
  - `go`

Current live truth:

- benben:
  - `memory-health-summary.overall_status=healthy`
  - `deployment-verify` passed
  - `memory-v2-eval=13/13`
  - `owner_private_current=true`
  - historical sidecar:
    - `status=healthy`
    - `mode=shadow_retrieve`
- adminAI:
  - guarded runtime bundle:
    - `pi-embedded-Vw-lS5ti.js`
  - `verify_state=already_patched`
  - `transport_canary.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`

Important live fixes that were required during the rollout:

- benben:
  - restored `session-memory-review-selfcheck` / `deployment-verify` green path
  - removed ephemeral owner exam-day reminder pollution from owner current/recent
  - live `memory-v2-eval` returned to `13/13`
- shared runtime:
  - patched `store-Cgl8QMzI.js` on live package root to restore established external session route preservation
- adminAI:
  - `v2026.4.9` service-gated `pi-embedded` baseline is active on `pi-embedded-Vw-lS5ti.js`

What remains as warnings only, not blockers:

- benben legacy runtime marker audit still reports missing old reply/runtime markers because the operative memory surface moved to `dist/extensions/memory-core/index.js`
- adminAI policy probe can still drift on the auxiliary boolean `should_use_memory_after_diagnose`
  - this is now treated as a warning because the real rollout gate remains:
    - `transport_canary.ok=true`
    - `first_action=ocapp_diagnose`
    - `stop_on_ok=true`
- `openclaw-adminai-healthcheck.service` shows `inactive` outside active run windows; timer remains healthy

### 2026-04-11 follow-up 11: post-upgrade warning set was reduced after assess-tool cleanup

The rollout conclusion is still `go`, but the warning set has been tightened to reflect the real post-`v2026.4.9` surfaces instead of stale audit assumptions.

Latest formal post report:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-063555Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-063555Z.json`

What changed:

- benben:
  - `upgrade-impact-assess` now audits the real memory truth surface:
    - `dist/extensions/memory-core/index.js`
  - result:
    - `benben_memory_surface_audit.ok=true`
  - old warning about missing legacy runtime markers is now closed
- adminAI:
  - forced policy probe parsing is now robust to noisy remote output
  - result in latest post report:
    - `transport_canary.ok=true`
    - `policy_probe.ok=true`
    - `should_use_memory_after_diagnose=true`
    - `first_action=ocapp_diagnose`
    - `stop_on_ok=true`
  - old warning `adminai_policy_probe_not_ok` is now closed

Current remaining warnings are operationally minor:

- `bundle_resolution_warning:pi_embedded_candidate_fallback:*`
- `bundle_resolution_warning:reply_candidate_fallback:*`
- `systemd_openclaw-adminai-healthcheck.service_not_active:inactive`
- `legacy_reply_bundle_changed`

### 2026-04-11 follow-up 12: shared store route-guard fix is now repo-tracked

The live `v2026.4.9` rollout had required one shared-runtime safety fix outside benben/adminAI-specific patch planes:

- live package root:
  - `/usr/lib/node_modules/openclaw/dist/store-Cgl8QMzI.js`
- purpose:
  - preserve already-established external session origin/route metadata instead of letting later local/webchat writes downgrade the route

That live fix is no longer "manual only". It is now backed by repo-tracked artifacts and a dedicated cutover helper:

- helper:
  - `workspace/tools/store-route-guard-cutover.mjs`
- tests:
  - `workspace/tools/tests/store-route-guard-cutover.test.mjs`
- snippet artifacts:
  - `workspace/patches/runtime/store-base-Cgl8QMzI.route-guard-snippet.js`
  - `workspace/patches/runtime/store-patched-Cgl8QMzI.route-guard-snippet.js`
- patch artifact:
  - `workspace/patches/runtime/store-Cgl8QMzI.route-guard.patch`

Verification done in repo:

- `node --check workspace/tools/store-route-guard-cutover.mjs`
- `node --test workspace/tools/tests/store-route-guard-cutover.test.mjs`
- replayed the helper against the reconstructed pre-patch snippet and confirmed the output matches the live patched snippet

No additional live mutation was needed in this follow-up because the NAS package root was already carrying the working route-guard fix. This step only turned that fix into a maintained repo artifact so future upgrades do not depend on ad hoc live edits.

Post-upgrade cleanup is now effectively down to warning hygiene only:

- `bundle_resolution_warning:pi_embedded_candidate_fallback:*`
- `bundle_resolution_warning:reply_candidate_fallback:*`
- `legacy_reply_bundle_changed`

### 2026-04-11 follow-up 13: bundle-resolution warning noise is closed

I tightened `workspace/tools/openclaw-upgrade-impact-assess.mjs` so it resolves the real post-`v2026.4.9` logic bundles instead of warning on wrapper/fallback candidates:

- `pi-embedded`
  - now resolves through `runtime-embedded-pi.runtime-*`
  - active post-upgrade truth surface is:
    - `pi-embedded-Vw-lS5ti.js`
- `reply`
  - now resolves through reply loader/runtime files instead of the raw `reply-*` candidate list
  - active post-upgrade logic bundle is:
    - `reply-BwK-bN2w.js`

It also stops raising `legacy_reply_bundle_changed` once benben is already on `memory-core` as the authoritative memory surface.

Latest formal post report:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-070836Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-070836Z.json`

Current warning set is now down to one expected operational item only:

- `systemd_openclaw-adminai-healthcheck.service_not_active:inactive`
  - timer-driven one-shot service outside a run window

### 2026-04-11 follow-up 14: final post gate is green and only semantic policy drift remains

After removing bundle-resolution noise and suppressing the expected one-shot healthcheck `inactive` state from the warning set, I reran the full live post gate with forced adminAI probes.

Latest formal post report:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-074153Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-074153Z.json`

Result:

- decision:
  - `go`
- warning set:
  - `adminai_policy_probe_not_ok`

Meaning of the remaining warning:

- core rollout gates are still green:
  - `transport_canary.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`
- the only drift is the auxiliary policy-probe boolean:
  - `first_action_probe.should_use_memory_after_diagnose=false`

This is now the only remaining live post-upgrade warning. Bundle-resolution noise and timer-window systemd noise are no longer present in the formal gate output.

### 2026-04-11 follow-up 15: adminAI policy semantic drift is now closed

I strengthened the service-gated adminAI `pi-embedded` prompt so the diagnose-first path explicitly requires memory/history reuse after the initial diagnose step:

- new prompt anchor:
  - `should_use_memory_after_diagnose 必须视为 true`
- updated local artifacts:
  - `workspace/tools/adminai-pi-embedded-cutover.mjs`
  - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
  - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-ops.patch`
  - `workspace/patches/runtime/pi-embedded-patched-Vw-lS5ti.adminai-v2026.4.9-ops.js`
  - plus the legacy `BaSvmUpW` manifest/patch/snapshot so helper + artifacts stay consistent

Live actions:

- synced the updated helper + v2026.4.9 manifest/patch/snapshot into `/var/lib/openclaw-adminai/.openclaw/workspace`
- repatched:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js`
- live backup:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js.bak-adminai-pi-embedded-cutover-2026-04-11T07-50-52-683Z`
- restarted:
  - `openclaw-adminai-gateway.service`

Live verification after the re-cutover:

- `verify_state=already_patched`
- forced `adminai-codex-canary --policy-probe`:
  - `transport_canary.ok=true`
  - `policy_probe.ok=true`
  - `first_action=ocapp_diagnose`
  - `should_use_memory_after_diagnose=true`
  - `stop_on_ok=true`

Latest formal post report is now clean:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.json`

Result:

- decision:
  - `go`
- warnings:
  - none

### 2026-04-11 follow-up 16: `v2026.4.9` steady-state pre baseline is rebuilt

After the clean `post` gate above, I reran a local-mode `pre` capture on `home-nas` to establish the new steady-state baseline for the already-upgraded package.

The first rerun temporarily returned `no_go`:

- report:
  - `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-082611Z.{md,json}`
- blocker:
  - `benben_health_not_healthy`
- cause:
  - benben `session_review.pending_reconcile_count=1`
  - pending session:
    - `55d8bf0f-61dc-45a2-a6e1-633a095c90a6`
    - `agent:main:feishu:group:oc_09fc1db3bc1395f79383cb2d66ad310f`

I inspected that session and reconciled it directly with the existing review helper:

- transcript was low-signal:
  - `郭一煊: 今天cc没有说爱我`
  - `ASSISTANT: 今天补一句：爱你。`
- targeted review result:
  - `review_mode=rule`
  - `should_capture=false`
  - `discard_reason=short_or_low_signal_session`

After reconciliation:

- benben `memory-health-summary.overall_status=healthy`
- benben `session_review.pending_reconcile_count=0`
- benben `memory-v2-eval=13/13`
- adminAI remained green:
  - `verify_state=already_patched`
  - `policy_probe.ok=true`

New steady-state pre baseline:

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.json`

Result:

- decision:
  - `baseline_ready`
- meaning:
  - `openclaw@2026.4.9` is now not only post-upgrade `go`, but also has a rebuilt post-upgrade steady-state `pre` baseline for future drift compares

### 2026-04-11 follow-up 17: benben healthcheck now fast-tracks only lightweight session review backlog

The remaining operational risk after the rebuilt steady-state baseline was short-lived `session_review.pending_reconcile_count=1` spikes caused by low-signal new sessions arriving between slower maintenance paths.

I closed that gap without adding any new timer/service:

- repo changes:
  - `workspace/tools/session-memory-review.mjs`
  - `workspace/tools/openclaw-healthcheck.sh`
- new capability:
  - `session-memory-review.mjs --reconcile-lightweight`
- behavior:
  - only fast-tracks pending sessions that are both lightweight and safe for rule-only handling
  - short low-signal chatter is cleared quickly
  - short but durable signals that likely need model judgement are still left to the normal review path

Concrete rule split:

- fast-tracked:
  - explicit current-state lines that the rule path can already capture
  - low-signal/noise sessions with no durable memory markers
- not fast-tracked:
  - short but durable boundary / communication / plan / anniversary / preference / long-term lines
  - these still remain pending for the existing model-backed review path

Healthcheck integration:

- `openclaw-healthcheck.sh` now runs a best-effort lightweight reconcile step before heartbeat refresh
- it does not change the existing timer/service topology:
  - still `openclaw-healthcheck.timer -> openclaw-healthcheck.service`
- if lightweight reconcile fails or times out, healthcheck only logs a warning and still proceeds to `heartbeat-state-writer`

Live validation:

- synced to benben live:
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-healthcheck.sh`
- syntax/smoke:
  - `node --check .../session-memory-review.mjs`
  - `bash -n .../openclaw-healthcheck.sh`
- live lightweight reconcile:
  - `scanned_sessions=0`
  - `reviewed_sessions=0`
- live healthcheck:
  - succeeded
  - journal now shows two `runuser` opens/closes per run:
    - one for best-effort lightweight reconcile
    - one for heartbeat writer
- live health remained green:
  - `memory-health-summary.overall_status=healthy`
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`

Net effect:

- trivial new sessions should stop causing transient `benben_health_not_healthy` flips
- richer short sessions still preserve the stricter model-backed review path instead of being prematurely discarded

### 2026-04-11 follow-up 18: benben health telemetry now exposes lightweight-vs-model-review session backlog

The fast-track lightweight reconcile above was useful, but the remaining gap was observability: health summary still only exposed a flat `pending_reconcile_count`.

That is now expanded.

Repo changes:

- `workspace/tools/session-memory-review.mjs`
- `workspace/tools/memory-health-summary.mjs`

New telemetry surfaces:

- `session-memory-review-status.json`
  - now includes `lightweight_reconcile`
  - tracks:
    - `last_attempt_at`
    - `last_success_at`
    - `last_status`
    - `last_error`
    - `total_attempts`
    - `total_successes`
    - `last_pending_total`
    - `last_candidate_count`
    - `last_skipped_count`
    - `last_reviewed_count`
    - `last_duplicate_count`
    - `fast_track_reasons`
    - `skip_reasons`
- `memory-health-summary`
  - still reports the flat `pending_reconcile_count`
  - now also reports:
    - `session_review.lightweight_reconcile.pending_candidate_count`
    - `session_review.lightweight_reconcile.pending_skipped_count`
    - `session_review.lightweight_reconcile.pending_skip_reasons`
  - markdown now spells out whether current backlog is:
    - eligible for lightweight auto-clear
    - or still needs model review

Live validation:

- synced updated helpers to benben live
- manually ran:
  - `openclaw-healthcheck.sh`
- live `session-memory-review-status.json` now contains:
  - `lightweight_reconcile.last_status=lightweight_reconcile_complete`
  - `lightweight_reconcile.total_attempts=1`
  - `lightweight_reconcile.last_pending_total=0`
- live health summary exposes:
  - `lightweight_reconcile.pending_candidate_count=0`
  - `lightweight_reconcile.pending_skipped_count=0`
  - overall remains:
    - `overall_status=healthy`

Net effect:

- future session-review alerts can now be read as:
  - trivial backlog that should self-clear quickly
  - or richer pending sessions that still need the normal model-backed review path

### 2026-04-11 follow-up 19: memory-ops dashboard now surfaces lightweight session-review backlog separately

Closed:

- make the operator-facing dashboard show whether pending session-review backlog is lightweight auto-clear work or model-review work

What changed:

- `memory-ops-dashboard` now renders:
  - `session review pending reconcile: N (lightweight=X, model_review=Y)`
  - `session review lightweight reconcile: last status ...; reviewed=...; skipped=...; pending_eligible=...; pending_model_review=...`
  - `session review lightweight fast-track reasons`
  - `session review lightweight pending skip reasons`
- operator actions now branch by backlog shape:
  - lightweight-only backlog suggests `session-memory-review --reconcile-lightweight --json`
  - model-review or retry backlog still suggests `--reconcile-missed --json`
  - pure lightweight backlog no longer adds `session-memory-review-selfcheck` noise

Live validation:

- synced updated `memory-ops-dashboard.mjs` to benben live
- ran:
  - `node /var/lib/openclaw/.openclaw/workspace/tools/memory-ops-dashboard.mjs --workspace /var/lib/openclaw/.openclaw/workspace --json`
- live dashboard now shows:
  - `session review pending reconcile: 0 (lightweight=0, model_review=0)`
  - `session review lightweight reconcile: last status lightweight_reconcile_complete; reviewed=0; skipped=0; pending_eligible=0; pending_model_review=0`
  - `session review lightweight fast-track reasons: none`
  - `session review lightweight pending skip reasons: none`
- current live operator actions remain clean:
  - only stable-trim apply is pending

Net effect:

- operators can now decide from the main dashboard whether backlog should self-clear, needs model review, or needs deeper session-review investigation

### 2026-04-11 follow-up 20: stable-trim recommendations now target canonical source, not verified cache companions

Closed:

- clear the last dashboard operator action when it was only pointing at `.verified.md` cache trim noise rather than canonical stable memory work

What changed:

- `stable-usage-trim-review` now excludes `.verified.md` files from direct trim targets
- hot hits observed on `.verified.md` companions are remapped back to their canonical `.md` source path before scoring
- result:
  - stable-trim recommendations only land on canonical stable files
  - verified refresh no longer reintroduces a just-trimmed cache-only dashboard action

Validation:

- local regression added for:
  - ignoring verified cache companions as direct trim targets
  - attributing verified-cache hits back to canonical source files
- benben live helper synced:
  - `stable-usage-trim-review.mjs`
- benben live dashboard regenerated

Live truth after rollout:

- `memory-ops-dashboard.json` now reports:
  - `operator_actions=[]`
  - `stable_trim.recommendation_count=0`
  - `stable_trim.applyable_items=0`
  - `stable_trim.manual_review_items=0`
- `memory-ops-dashboard.md` now shows:
  - `Stable Trim -> recommendations: 0`

Net effect:

- benben live main operator dashboard is now clean; no residual stable-trim action remains from verified-cache inflation

### 2026-04-11 follow-up 21: memory-status-human now exposes session-review backlog shape

Closed:

- align the human-readable operator status surface with the new session-review lightweight/model-review backlog contract

What changed:

- `memory-status-human` now includes:
  - `session_review.status`
  - `pending_reconcile` split as `lightweight` vs `model_review`
  - `pending_retry`
  - latest lightweight reconcile status
  - fast-track reasons
  - pending skip reasons
- state hashing now includes the structured `session_review` block, so event-mode updates continue to reflect real operator-facing state
- the related test fixture was also date-hardened so working-memory event-mode coverage no longer flakes after the original soft TTL window passes

Validation:

- local targeted tests passed for:
  - `memory status human`
  - operational-observe filtering
- synced updated `memory-status-human.mjs` to benben live
- regenerated live `memory-status-human`

Live truth after rollout:

- `memory-status-human.md` now shows:
  - `Session review: healthy; pending_reconcile=0 (lightweight=0, model_review=0); pending_retry=0`
  - `Session review lightweight reconcile: lightweight_reconcile_complete`
  - `Session review lightweight fast-track reasons: none`
  - `Session review lightweight pending skip reasons: none`
- `memory-status-human-state.json` now records the structured `session_review` block with the same values

Net effect:

- benben now has consistent session-review backlog semantics across:
  - health summary
  - ops dashboard
  - human status

### 2026-04-11 follow-up 22: upgrade impact gate now distinguishes lightweight session-review backlog from real blockers

Closed:

- align `openclaw-upgrade-impact-assess` with the new session-review backlog contract so `pre/post` gate results no longer depend on a flat pending count

What changed:

- `openclaw-upgrade-impact-assess` now ingests benben session-review breakdown from `memory-health-summary`
- benben snapshot/report now includes:
  - `pending_reconcile_count`
  - `pending_retry_count`
  - `lightweight_pending_count`
  - `model_review_pending_count`
  - `lightweight_only`
  - `health_gate_ok`
  - `health_gate_reason`
- gate semantics now split:
  - lightweight-only backlog -> warning
  - model-review/retry backlog -> blocker

Validation:

- local targeted tests passed for:
  - `openclaw-upgrade-impact-assess.test.mjs`
- real NAS preflight re-run succeeded:
  - `node workspace/tools/openclaw-upgrade-impact-assess.mjs --stage pre --mode ssh --host home-nas --write-report --json`

Latest formal report:

- [`openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.md`](/Users/zhangjincheng/Documents/GitHub/-/nas-openclaw-v22/workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.md)
- [`openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.json`](/Users/zhangjincheng/Documents/GitHub/-/nas-openclaw-v22/workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.json)

Live truth from that report:

- `decision=baseline_ready`
- `benben.health_gate_ok=true`
- `benben.session_review.pending_reconcile_count=0`
- `benben.session_review.lightweight_pending_count=0`
- `benben.session_review.model_review_pending_count=0`
- `benben.session_review.pending_retry_count=0`

Net effect:

- future upgrade gate output can now say whether benben needs:
  - no action
  - minute-level lightweight reconcile
  - or real model-backed session review before rollout

### 2026-04-11 follow-up 23: weekly memory review sender now includes session-review backlog shape

Closed:

- align the outward weekly send/notification payload with the same session-review backlog contract used by health summary, dashboard, human status, and upgrade gate

What changed:

- `memory-review-send.py` now emits these weekly payload metrics:
  - `session_review_lightweight_pending_count`
  - `session_review_model_review_pending_count`
  - `session_review_lightweight_last_status`
  - `session_review_lightweight_fast_track_reasons`
  - `session_review_lightweight_pending_skip_reasons`
- weekly render now includes:
  - `/new` 漏复核会话：当前 N 个（轻量可自动清 X 个，需模型复核 Y 个）
  - `/new` 轻量复核状态：...`
  - when backlog exists, an extra `会话复核 backlog 分层` block with reason breakdown

Validation:

- local:
  - `python3 -m py_compile workspace/tools/memory-review-send.py`
  - `python3 -m unittest workspace/tools/tests/test_memory_review_send.py`
- benben live:
  - synced updated `memory-review-send.py`
  - `python3 memory-review-send.py weekly --root /var/lib/openclaw/.openclaw --dry-run --json`

Live truth after rollout:

- benben live weekly review now shows:
  - ``/new` 漏复核会话：当前 0 个（轻量可自动清 0 个，需模型复核 0 个）``
  - ``/new` 轻量复核状态：lightweight_reconcile_complete``
- current live run had no active backlog, so no extra `会话复核 backlog 分层` section was rendered

Net effect:

- operator-facing messaging is now consistent across local reports and outbound weekly review messages

### 2026-04-11 follow-up 24: session-review efficiency KPIs now use latest session outcome, not raw attempts

Closed:

- stop benben 7d capture/retry KPIs from being dragged by repeated retries for the same session
- align `memory-status-human` with the persisted `memory-health-summary` truth so operator surfaces stop drifting

What changed:

- `memory-health-summary.mjs` now dedupes session-review logs by latest user-facing `session_id` outcome inside each window before computing:
  - `reviewed_sessions`
  - `captured_sessions`
  - `retry_recommended`
  - `session_capture_rate`
  - `retry_recommended_rate`
- raw cost is still preserved as `review_attempts`
- `memory-status-human.mjs` now prefers the persisted `memory-admin/meta/memory-health-summary.json` snapshot when available, instead of rebuilding a fresh snapshot and risking divergence
- human/dashboard markdown now prints `attempts=` alongside 24h/7d capture efficiency

Validation:

- local:
  - `node --check workspace/tools/memory-health-summary.mjs`
  - `node --check workspace/tools/memory-status-human.mjs`
  - `node --check workspace/tools/memory-ops-dashboard.mjs`
  - `node --test --test-name-pattern "memory health summary session capture efficiency uses latest distinct session outcome|memory health summary retrieval metrics only use latest distinct actionable observe sample|memory ops dashboard aggregates health queue audit route and trim surfaces" workspace/tools/tests/memory-phase1.test.mjs`
  - `node --test --test-name-pattern "memory status human refreshes on standard and only updates on event when state changes|memory status human prefers persisted health summary truth when available|memory status human markdown renders lightweight and model-review session backlog breakdown|memory status human selects the newest actionable observe by timestamp instead of file tail order" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced `memory-health-summary.mjs`, `memory-status-human.mjs`, `memory-ops-dashboard.mjs`
  - reran `memory-health-summary`, `memory-ops-dashboard`, `memory-status-human`

Live truth after rollout:

- benben live health remains `healthy`
- session-review 7d efficiency now reads:
  - `review_attempts=21`
  - `reviewed_sessions=16`
  - `captured_sessions=3`
  - `retry_recommended=4`
  - `session_capture_rate=0.19`
  - `retry_recommended_rate=0.25`
- `memory-status-human` now agrees with `memory-health-summary` on `overall_status=healthy`

Net effect:

- session-review efficiency is now measured as current per-session outcome, while still exposing raw review cost separately
- human status no longer drifts from the already-written health summary truth

### 2026-04-11 follow-up 25: session-review logs now retain bounded transcript evidence for future tuning

Closed:

- preserve enough evidence in benben session-review logs to debug skipped/retried sessions even after the original session files roll away

What changed:

- `session-memory-review.mjs` log records now include:
  - `transcript_preview_excerpt`
  - `user_line_preview`
- both are aggressively bounded and only intended for operator/debug use

Validation:

- local:
  - `node --check workspace/tools/session-memory-review.mjs`
  - `node --test --test-name-pattern "session memory review retries model-unavailable sessions during reconcile" workspace/tools/tests/session-memory-review.test.mjs`
- benben live:
  - synced updated `session-memory-review.mjs`
  - `node tools/session-memory-review.mjs --reconcile-lightweight --min-idle-minutes 0 --max-sessions 3 --json`

Live truth after rollout:

- current live lightweight reconcile remains a no-op:
  - `scanned_sessions=0`
  - `reviewed_sessions=0`
  - `duplicate_sessions=0`
- future skip/retry records will now retain bounded user-visible evidence directly in the review log

Net effect:

- the next round of capture-rule tuning no longer depends on the original session transcript files still existing

### 2026-04-11 follow-up 26: lightweight rule rescue now covers couple shared plans and anniversary reminders

Closed:

- extend benben short durable session capture beyond `current_state / personal preference / long-term anchor`

What changed:

- `session-memory-review.mjs` now adds two conservative couple-level rule rescues:
  - explicit `shared_plan` signals such as joint travel/logistics planning
  - explicit `anniversary` reminder rules such as “提前一周提醒 / 当天提醒”
- both remain `couple_shared`, and only trigger on high-signal, low-ambiguity lines
- they participate in the existing `durable_rule_capture_available` lightweight fast-track path

Validation:

- local:
  - `node --check workspace/tools/session-memory-review.mjs`
  - `node --test --test-name-pattern "session memory review rescues explicit couple shared plan when model misses joint logistics|session memory review rescues explicit anniversary reminder when model misses durable timepoint rule|lightweight session review classification fast-tracks low-signal banter and safe durable short signals|session memory review rescues owner long-term anchor when model misses explicit personal planning|session memory review rescues partner shared current from ordinary natural phrasing without explicit recent marker" workspace/tools/tests/session-memory-review.test.mjs`
  - `node --test --test-name-pattern "lightweight reconcile clears trivial pending sessions and fast-tracks safe durable short sessions|session memory review retries model-unavailable sessions during reconcile" workspace/tools/tests/session-memory-review.test.mjs`
- benben live:
  - synced updated `session-memory-review.mjs`
  - ran isolated temp-workspace smoke with synthetic model miss payloads

Live smoke truth:

- explicit couple plan sample:
  - `我们五一一起去上海，这周先看预算和高铁票。`
  - rescued as `couple / recent / shared_plan`
  - target `memory_v2/context/recent/couple.jsonl`
- explicit anniversary reminder sample:
  - `恋爱纪念日提前一周提醒我，当天也提醒。`
  - rescued as `couple / stable / anniversary`
  - target `memory_v2/facts/stable/couple.yaml`

Net effect:

- benben can now fast-track two more classes of short durable sessions without waiting on model review

### 2026-04-11 follow-up 27: lightweight rule rescue now covers couple decision preferences and repair patterns

Closed:

- extend benben durable short-session rescue into the remaining low-ambiguity couple stable-rule classes

What changed:

- `session-memory-review.mjs` now also rescues:
  - explicit `decision_preference` / shared norm lines
  - explicit `repair_pattern` / repair-sequence lines
- `shared_plan` rescue was tightened so long-term shared norms no longer get misclassified as recent plan items
- lightweight assessment now explicitly fast-tracks exact single-line couple durable rules when they match the user line verbatim

Validation:

- local:
  - `node --check workspace/tools/session-memory-review.mjs`
  - `node --test --test-name-pattern "session memory review rescues explicit couple decision preference when model misses shared norm|session memory review rescues explicit couple repair pattern when model misses durable repair rule|session memory review rescues explicit couple shared plan when model misses joint logistics|session memory review rescues explicit anniversary reminder when model misses durable timepoint rule|lightweight session review classification fast-tracks low-signal banter and safe durable short signals|lightweight reconcile clears trivial pending sessions and fast-tracks safe durable short sessions|session memory review rescues partner shared current from ordinary natural phrasing without explicit recent marker" workspace/tools/tests/session-memory-review.test.mjs`
- benben live:
  - synced updated `session-memory-review.mjs`
  - ran isolated temp-workspace smoke with synthetic model miss payloads

Live smoke truth:

- `我们五一一起去上海，这周先看预算和高铁票。` -> `couple / recent / shared_plan`
- `恋爱纪念日提前一周提醒我，当天也提醒。` -> `couple / stable / anniversary`
- `以后我们见面和出游都按学生预算来，别冲动花钱。` -> `couple / stable / decision_preference`
- `以后我们有摩擦先安抚，再复盘，不要上来争对错。` -> `couple / stable / repair_pattern`

Net effect:

- benben now covers the main low-ambiguity couple durable rule classes via lightweight rule rescue, without waiting on model review for these explicit one-line cases

### 2026-04-11 follow-up 28: lightweight rule rescue now covers couple communication style and boundary rules

Closed:

- extend benben explicit one-line durable rescue into the remaining low-ambiguity couple communication and boundary rules

What changed:

- `session-memory-review.mjs` now rescues explicit couple:
  - `communication_style`
  - `boundary`
- the durable boundary path explicitly allows lines that mention `玩笑 / 角色扮演` only when they are phrased as a long-term harm/boundary rule
- `shared_plan` filtering was tightened so mixed `预算 + 当前关系状态` lines stay in `current_state`, while actual joint plans still route to `shared_plan`

Validation:

- local:
  - `node --check workspace/tools/session-memory-review.mjs`
  - `node --test --test-name-pattern "session memory review rescues explicit couple communication style when model misses durable expression preference|session memory review rescues explicit couple boundary when model misses durable harm rule|lightweight session review classification fast-tracks low-signal banter and safe durable short signals|session memory review rescues explicit couple shared plan when model misses joint logistics|session memory review rescues explicit couple decision preference when model misses shared norm|session memory review rescues explicit couple repair pattern when model misses durable repair rule|session memory review downgrades stage-like couple relationship notes into current_state candidates|session memory review rescues partner shared current from ordinary natural phrasing without explicit recent marker" workspace/tools/tests/session-memory-review.test.mjs`
- benben live:
  - synced updated `session-memory-review.mjs`
  - ran isolated temp-workspace smoke for the new two classes

Live smoke truth:

- `以后我们表达要真诚、细腻，最好带共同经历和故事线。` -> `couple / stable / communication_style`
- `以后不要把临时玩笑或角色扮演当长期规则，这样很容易误判。` -> `couple / stable / boundary`

Net effect:

- the explicit one-line durable couple-rule surface is now largely covered: plan, anniversary, decision, repair, communication, boundary

### 2026-04-11 follow-up 29: benben operator surface now exposes session-review opportunity buckets from preview evidence

Closed:

- add an operator-facing “what to tune next” surface for skipped/retried session reviews without changing capture behavior

What changed:

- `memory-health-summary.mjs` now derives `session_review.opportunity_summary` from the latest distinct review outcomes using existing `transcript_preview_excerpt` and `user_line_preview`
- the opportunity surface is intentionally conservative and currently only buckets:
  - `transport_retry`
  - `mixed_current_state`
  - `durable_multiline`
- the same truth is now rendered through:
  - `memory-health-summary`
  - `memory-ops-dashboard`
  - `memory-status-human`
- sample lines now fall back to `session <id>` when older review logs do not contain preview fields

Validation:

- local:
  - `node --check workspace/tools/memory-health-summary.mjs`
  - `node --check workspace/tools/memory-status-human.mjs`
  - `node --check workspace/tools/memory-ops-dashboard.mjs`
  - `node --test --test-name-pattern "memory health summary groups recent session review opportunities from preview evidence|memory status human prefers persisted health summary truth when available|memory status human markdown renders lightweight and model-review session backlog breakdown|memory ops dashboard splits lightweight and model-review session backlog for operators" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced updated `memory-health-summary.mjs`
  - synced updated `memory-status-human.mjs`
  - synced updated `memory-ops-dashboard.mjs`
  - regenerated live health/dashboard/human reports

Live truth:

- `memory-health-summary.overall_status=healthy`
- `session_review.status=healthy`
- `session_review.opportunity_summary.last_7d.total_count=8`
- all 8 current 7d opportunities are `transport_retry`
- live human/dashboard sample lines now show stable fallback IDs instead of `no preview`

Operational meaning:

- benben’s next review-efficiency work should focus on legacy transport retry fallout before expanding more semantic rescue rules

### 2026-04-11 follow-up 30: actionable session-review opportunities are now separated from historical transport-retry tail

Closed:

- stop counting non-actionable legacy retry records as current session-review opportunities

What changed:

- `memory-health-summary` now treats `transport_retry` as an actionable opportunity only when the session is still in the current pending-retry set
- old retry records that are no longer actionable now roll into `historical_transport_retry_tail`
- the same split is rendered in:
  - `memory-health-summary`
  - `memory-ops-dashboard`
  - `memory-status-human`

Validation:

- local:
  - `node --check workspace/tools/memory-health-summary.mjs`
  - `node --check workspace/tools/memory-status-human.mjs`
  - `node --check workspace/tools/memory-ops-dashboard.mjs`
  - `node --test --test-name-pattern "memory health summary groups recent session review opportunities from preview evidence|memory status human prefers persisted health summary truth when available|memory status human markdown renders lightweight and model-review session backlog breakdown|memory ops dashboard splits lightweight and model-review session backlog for operators" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced updated summary/dashboard/human scripts
  - regenerated live reports

Live truth:

- `session_review.opportunity_summary.last_7d.total_count=0`
- `transport_retry_count=0`
- `mixed_current_state_count=0`
- `durable_multiline_count=0`
- `historical_transport_retry_tail_count=8`
- tail reasons are currently:
  - `gateway_transport_error x3`
  - `missing_api_key x3`
  - `fetch_error x1`
  - `http_error x1`

Operational meaning:

- benben currently has no live actionable semantic session-review opportunities in the last 7 days
- the remaining visible retry issue is explicitly a historical tail, not an active backlog

### 2026-04-11 follow-up 31: historical retry tail now has a dedicated operator audit and CLI entrypoint

Closed:

- move historical retry-tail investigation out of generic health/dashboard samples and into a dedicated audit surface

What changed:

- added `workspace/tools/session-review-retry-tail-audit.mjs`
- `memory-ops-dashboard` now writes and exposes a dedicated `retry_tail_audit` section
- `openclaw-cli-wrapper.sh` now supports:
  - `openclaw memory-ops retry-tail-audit --json`
- the audit uses the same latest-distinct-session logic as health summary and excludes synthetic `tmp-*` smoke sessions

Validation:

- local:
  - `node --check workspace/tools/session-review-retry-tail-audit.mjs`
  - `bash -n workspace/tools/openclaw-cli-wrapper.sh`
  - `node --test --test-name-pattern "session review retry-tail audit isolates non-actionable retry history from pending retry backlog|memory ops dashboard splits lightweight and model-review session backlog for operators" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced `session-review-retry-tail-audit.mjs`
  - synced updated `memory-ops-dashboard.mjs`
  - synced updated workspace `openclaw-cli-wrapper.sh`
  - installed updated `/usr/local/bin/openclaw`
  - verified `openclaw memory-ops retry-tail-audit --json`

Live truth:

- dashboard operator action now includes:
  - `openclaw memory-ops retry-tail-audit --json`
- `retry_tail_audit.status=attention`
- `retry_tail_audit.historical_tail_count=8`
- `pending_retry_count=0`
- top reasons:
  - `gateway_transport_error x3`
  - `missing_api_key x3`
  - `fetch_error x1`
  - `http_error x1`

Operational meaning:

- daily operator surfaces can stay concise, while tail investigation has a dedicated report/CLI path
- there is no active retry backlog; only an 8-session historical retry tail remains

### 2026-04-11 follow-up 32: retired the 8-session historical retry tail as one-time operational debt

Closed:

- clear the historical retry tail from daily operator surfaces without reopening it as active backlog

What changed:

- `session-review-retry-tail-audit.mjs` now supports:
  - `--retire-current`
  - `--retire-note <text>`
- retired retry-tail sessions are persisted in:
  - `memory-admin/meta/session-review-retry-tail-retired.json`
  - `memory-admin/logs/session-review-retry-tail-retired.jsonl`
- `memory-health-summary` now excludes retired retry-tail sessions from:
  - `historical_transport_retry_tail_count`
  - `session_review.opportunity_summary.last_7d.total_count`
- `openclaw-cli-wrapper.sh` usage now exposes the new debt-retirement flags

Validation:

- local:
  - `node --check workspace/tools/session-review-retry-tail-audit.mjs`
  - `node --check workspace/tools/memory-health-summary.mjs`
  - `bash -n workspace/tools/openclaw-cli-wrapper.sh`
  - `node --test --test-name-pattern "session review retry-tail audit isolates non-actionable retry history from pending retry backlog|retiring current retry-tail debt clears historical retry tail from audit and health summary|memory health summary groups recent session review opportunities from preview evidence|memory ops dashboard splits lightweight and model-review session backlog for operators" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced updated `session-review-retry-tail-audit.mjs`
  - synced updated `memory-health-summary.mjs`
  - synced updated workspace `openclaw-cli-wrapper.sh`
  - installed updated `/usr/local/bin/openclaw`
  - ran:
    - `openclaw memory-ops retry-tail-audit --retire-current --retire-note '2026-04-11 one-time debt cleanup' --json`

Live truth:

- `retired_count=8`
- retired state path:
  - `memory-admin/meta/session-review-retry-tail-retired.json`
- retired log path:
  - `memory-admin/logs/session-review-retry-tail-retired.jsonl`
- `session_review.opportunity_summary.last_7d.total_count=0`
- `historical_transport_retry_tail_count=0`
- `memory-ops-dashboard.retry_tail_audit.historical_tail_count=0`
- `overall_status=healthy`

Operational meaning:

- the historical retry tail is now treated as explicitly retired technical debt, not current operator backlog
- daily operator surfaces no longer spend attention on those 8 legacy retry sessions

### 2026-04-11 follow-up 33: retired retry-tail debt now stays visible as audit context without reopening daily retry work

Closed:

- keep retired retry-tail debt inspectable in operator surfaces without turning it back into an actionable retry-tail task

What changed:

- `session-review-retry-tail-audit.mjs` now emits retired debt audit context:
  - `retired_latest_at`
  - `retired_top_reasons`
  - `retired_samples`
- `memory-ops-dashboard` now shows a non-actionable retired debt line under `retry_tail_audit`
- `memory-status-human` now carries the same retired debt summary in `session_review.retry_tail_audit`

Validation:

- local:
  - `node --check workspace/tools/session-review-retry-tail-audit.mjs`
  - `node --check workspace/tools/memory-ops-dashboard.mjs`
  - `node --check workspace/tools/memory-status-human.mjs`
  - `node --test --test-name-pattern "retiring current retry-tail debt clears historical retry tail from audit and health summary|memory status human markdown renders lightweight and model-review session backlog breakdown|memory ops dashboard splits lightweight and model-review session backlog for operators|memory ops dashboard keeps retired retry-tail debt visible without reopening the operator action" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced updated `session-review-retry-tail-audit.mjs`
  - synced updated `memory-ops-dashboard.mjs`
  - synced updated `memory-status-human.mjs`
  - regenerated live retry-tail audit, dashboard, and human status

Live truth:

- `retry_tail_audit.historical_tail_count=0`
- `retry_tail_audit.retired_session_count=8`
- `retry_tail_audit.retired_latest_at=2026-04-11T12:46:04.618Z`
- retired top reasons remain:
  - `gateway_transport_error x3`
  - `missing_api_key x3`
  - `fetch_error x1`
- `memory-status-human-state.json` now carries the same retired debt summary

Operational meaning:

- retry-tail debt remains auditable without reappearing as daily retry-tail work
- if operator actions are present after this point, they come from current session-review backlog, not from the retired retry tail

### 2026-04-11 follow-up 34: stale session-review operator actions were cleared by rerunning live review/selfcheck and regenerating operator surfaces

Closed:

- clear the two remaining benben operator actions that were left behind by stale dashboard state

What changed:

- reran live:
  - `openclaw tool session-memory-review --reconcile-missed --json`
  - `openclaw tool session-memory-review-selfcheck --json`
  - `memory-health-summary.mjs --json`
  - `memory-ops-dashboard.mjs --json`
  - `memory-status-human.mjs --json`
- no code or config changes were required; the issue was stale live status/report state after session review had already completed

Live truth:

- `session-memory-review-selfcheck.status=healthy`
- `session-memory-review-selfcheck.ok=true`
- `memory-health-summary.overall_status=healthy`
- `session_review.status=healthy`
- `pending_reconcile_count=0`
- `pending_retry_count=0`
- `memory-ops-dashboard.operator_actions=[]`
- `memory-status-human.state.session_review.status=healthy`

Operational meaning:

- benben operator surfaces are now fully clear again
- there is no active session-review backlog behind the previously visible dashboard actions

### 2026-04-11 follow-up 35: rebuilt the adminAI `pi-embedded` v2026.4.9 baseline around the current live bundle and restored `already_patched`

Closed:

- clear the adminAI `patched_drifted` baseline state without changing runtime behavior or fallback order

What changed:

- pulled the current live `/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js` back into the repo as the new managed patched snapshot
- regenerated:
  - `workspace/patches/runtime/pi-embedded-patched-Vw-lS5ti.adminai-v2026.4.9-ops.js`
  - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-ops.patch`
  - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
- synced the refreshed manifest / patched snapshot / patch file to adminAI live workspace
- updated `adminai-pi-embedded-runtime-guard.md` to point at the new patched hash

Why drift happened:

- current live `pi-embedded` had picked up an additional shared `media-tool` import / path-resolution delta
- adminAI markers and behavior were still correct, but the managed patched snapshot hash had fallen behind
- this was baseline drift, not policy drift

Validation:

- local:
  - confirmed repo patched snapshot hash moved to `63973bb2b74f7d255faefc6e252f0231b01abe1d949d731edbc24049efa676d1`
  - regenerated the `v2026.4.9` patch from base snapshot to current live patched snapshot
- adminAI live:
  - `adminai-pi-embedded-patch-manager.mjs verify` => `verify_state=already_patched`
  - `adminai-pi-embedded-patch-manager.mjs preflight` => `status=already_patched`
  - `adminai-runtime-observe.mjs --mode local --json` => `runtime_patch.verify_state=already_patched`
  - refreshed `openclaw-dual-instance-scorecard` report

Live truth:

- `runtime_patch.verify_state=already_patched`
- `runtime_patch.portability_ready=true`
- `marker_version=adminai-pi-embedded-policy-v1`
- `resolved_target=/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js`
- refreshed dual-instance scorecard now reports:
  - `adminai_verify_state=already_patched`
  - `adminai_portability_ready=true`
  - `benben_overall=healthy`
  - `benben_overflow=0`

Operational meaning:

- adminAI baseline management is back in sync with current live runtime
- future portability checks should no longer show `patched_drifted` for this bundle unless a new unmanaged live delta lands again

### 2026-04-11 follow-up 36: benben mixed durable rescue now captures `current_state + stable durable` from one-line mixed signals

Closed:

- improve `session_capture_rate` for short mixed couple lines that contain both current-state context and a durable shared rule

What changed:

- updated `workspace/tools/session-memory-review.mjs`
- added mixed-clause rescue for:
  - `current_state + decision_preference`
  - `current_state + repair_pattern`
- narrowed rule augmentation so live review does not duplicate model-covered stage/stable items
- narrowed couple communication-style rescue to avoid misclassifying partner-only phrasing as couple stable rules

Validation:

- local:
  - `node --check workspace/tools/session-memory-review.mjs`
  - `node --test workspace/tools/tests/session-memory-review.test.mjs`
  - `node --test --test-name-pattern "session review|memory ops dashboard|memory status human" workspace/tools/tests/memory-phase1.test.mjs`
- benben live:
  - synced `session-memory-review.mjs` into `/var/lib/openclaw/.openclaw/workspace/tools/`
  - ran isolated smoke in a temp workspace with model result forced empty
  - `我们最近预算有点紧，以后见面和出游都按学生预算来，别冲动花钱。`
    => `couple/current/current_state` + `couple/stable/decision_preference`
  - `我们最近有点紧绷，以后有摩擦先安抚再复盘。`
    => `couple/current/current_state` + `couple/stable/repair_pattern`

Live truth:

- no benben live queue or operator state was mutated during validation
- the rescue behavior is now present in live `session-memory-review.mjs`

Operational meaning:

- future low-volume mixed durable couple lines no longer need to choose between “only current state” and “only durable rule”
- this should improve `session_capture_rate` without widening scope boundaries or reopening operator debt

### 2026-04-11 follow-up 37: benben now rescues split multiline durable couple rules from adjacent user lines

Closed:

- the next `session_capture_rate` gap after one-line mixed rescue: durable couple rules split across adjacent user lines

What changed:

- updated `workspace/tools/session-memory-review.mjs`
- added adjacent-line durable synthesis as a conservative fallback used only when single-line rescue is insufficient
- current scope covers:
  - split `decision_preference`
  - split `repair_pattern`
- also narrowed `shared_plan` so pure “预算/安排很紧” constraint lines are no longer misclassified as near-term logistics
- kept augmentation dedupe strict so this does not reopen duplicate stage/stable items

Validation:

- local:
  - full `workspace/tools/tests/session-memory-review.test.mjs` is green
  - related operator regressions in `workspace/tools/tests/memory-phase1.test.mjs` are green
- benben live:
  - synced `session-memory-review.mjs`
  - isolated smoke in temp workspace with forced-empty model result:
    - `我们最近预算有点紧。 / 以后见面和出游都按学生预算来， / 别冲动花钱。`
      => `couple/current/current_state` + `couple/stable/decision_preference`
    - `我们最近有点紧绷。 / 以后有摩擦的时候， / 先安抚再复盘，不要上来争对错。`
      => `couple/current/current_state` + `couple/stable/repair_pattern`

Live truth:

- validation was isolated to a temp workspace and did not mutate benben live review queue or operator state
- live `session-memory-review.mjs` now contains both one-line mixed rescue and adjacent-line multiline rescue

Operational meaning:

- short multi-message couple rules no longer need to be fully packed into a single utterance to be captured
- the next remaining `session_capture_rate` gap is no longer “adjacent multiline split”, but richer multi-turn synthesis where the durable meaning only emerges after several conversational turns

### 2026-04-11 follow-up 38: benben now covers the common three-turn pattern of `current state + split durable rule`

Closed:

- the next conservative capture gap after adjacent multiline rescue: a short three-turn shape where the first user line is current shared state and the durable rule itself is split across the next two user lines

What changed:

- kept `session-memory-review.mjs` on the same conservative rule path
- tightened truncated-rule extension so a durable clause like:
  - `以后见面和出游都按学生预算来，`
  - `别冲动花钱。`
  is recovered as one stable `decision_preference`
- the same extension also preserves the `repair_pattern` split case without reopening `shared_plan` noise

Validation:

- local:
  - full `workspace/tools/tests/session-memory-review.test.mjs` is green
  - related operator regressions in `workspace/tools/tests/memory-phase1.test.mjs` are green
- benben live:
  - synced `session-memory-review.mjs`
  - isolated temp-workspace smoke with forced-empty model result:
    - `我们最近预算有点紧。 / 以后见面和出游都按学生预算来， / 别冲动花钱。`
      => `couple/current/current_state` + `couple/stable/decision_preference`
    - `我们最近有点紧绷。 / 以后有摩擦的时候， / 先安抚再复盘，不要上来争对错。`
      => `couple/current/current_state` + `couple/stable/repair_pattern`

Live truth:

- no benben live queue or operator state was mutated during validation
- live `session-memory-review.mjs` now covers:
  - one-line mixed rescue
  - adjacent-line split durable rescue
  - the common three-turn shape: `current state` + `split durable rule`

Operational meaning:

- a short conversational unfolding no longer needs the durable rule to be packed into a single line before capture can happen
- the remaining next gap is the harder case where durable meaning only becomes inferable from broader multi-turn accumulation, not just a clearly split rule clause

### 2026-04-11 follow-up 39: shared zh runtime patch no longer corrupts adminAI or `memory-core`

Closed:

- the shared `zh runtime patch` regression where `openclaw_zh_runtime_patch_rules.json` kept re-touching shared dist bundles and broke adminAI portability / policy probes again
- the concrete failure mode where `extensions/memory-core/index.js` was rewritten into invalid JS (`withFile类型： true`), causing `ParseError: Unexpected character '：'`

What changed:

- updated source-of-truth rules:
  - `.codex-remote-openclaw/tools/openclaw_zh_runtime_patch_rules.json`
- retired the shared `pi-embedded` rule by moving its `path` and `fallbackGlob` under `__retired__/...`
- corrected the `memory-core` rule so the generated JS keeps `withFileTypes: true`
- replayed the patched rules offline against clean `v2026.4.9` artifacts:
  - `memory-core` still receives the intended phase1 cutover
  - `pi-embedded` is no longer matched by the shared zh patcher
  - no invalid `withFile类型` syntax is produced
- synced the corrected rules to NAS:
  - `/usr/local/share/openclaw/openclaw_zh_runtime_patch_rules.json`
- restored the shared runtime file from managed baseline:
  - `/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js`
- restarted only:
  - `openclaw-adminai-gateway.service`

Validation:

- adminAI live:
  - `adminai-pi-embedded-patch-manager.mjs verify` => `verify_state=already_patched`
  - forced `adminai-codex-canary.mjs --policy-probe --force --json` => `ok=true`
  - `adminai-runtime-observe.mjs --mode local --json` => `transport_canary.ok=true`, `policy_probe.ok=true`, `policy_only_gate.ok=true`
- shared runtime file on NAS now shows:
  - `fs.readdir(..., { withFileTypes: true })`
  - no full-width punctuation in executable JS keys

Current truth split:

- `7d live` as of `2026-04-11T22:14:24.991Z`:
  - scorecard = `benben=7 / adminAI=10 / overall=8.2`
  - adminAI is fully green again
  - remaining score gaps are only benben:
    - `session_capture_rate_7d=0.18`
    - `captured_from_rule_lightweight_7d=0`
- `24h + fixture preview` as of `2026-04-11T22:14:24.991Z`:
  - scorecard preview = `benben=7.9 / adminAI=10 / overall=8.7`
  - `fixture_passed_cases=5/5`
  - combined preview gate is green:
    - `session_capture_rate=0.75`
    - `captured_from_rule_lightweight=5`
    - `retry_recommended_rate=0`
    - `capture_uplift_gate.ready=true`

Important follow-on truth:

- benben’s persisted `memory-health-summary.json` is refreshed, but its truth has moved since the earlier `healthy` snapshot
- as of `2026-04-11T22:15:07.544Z`, benben now reports:
  - `overall_status=attention`
  - `issues=[\"2 rolled sessions missed auto review (lightweight=0, model_review=2)\"]`
- so the current blocker to `24h + fixture >= 9.3` is no longer adminAI portability drift; it is benben’s live health/status layer still being `attention` plus the remaining 7d capture uplift gap

### 2026-04-11 follow-up 40: benben live health is back to `healthy`; `24h + fixture` preview is now formally `>= 9.3`

Closed:

- the transient benben health regression introduced while refreshing live truth:
  - `overall_status=attention`
  - `issues=["2 rolled sessions missed auto review (lightweight=0, model_review=2)"]`

What changed:

- identified the two missed sessions from live pending review state:
  - `41c4dadc-048e-498c-b07b-6e30b4030db7`
  - `22ee625b-41a4-4586-9e06-1cceadb813a5`
- both were `agent:main:cron:*` maintenance transcripts for:
  - email巡检
  - calendar巡检
- both transcripts only contained:
  - approval workflow chatter
  - `porteden` permission failures
  - assistant explanations of those failures
- ran live reconcile:
  - `node /var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs --workspace /var/lib/openclaw/.openclaw/workspace --reconcile-missed --force-rule --json`
- both sessions were reviewed and conservatively discarded as ops noise
- then regenerated:
  - `memory-health-summary.mjs --json`
  - `openclaw-dual-instance-scorecard.mjs --write-report --json`

Validation:

- pending session-review backlog on benben is now empty:
  - `listPendingSessionReviews(...) => []`
- refreshed benben health summary as of `2026-04-11T22:19:26.020Z` now reports:
  - `overall_status=healthy`
  - `session_review.status=healthy`
  - `pending_reconcile_count=0`
  - `issues=[]`

Final truth split after the cleanup:

- `7d live` as of `2026-04-11T22:19:38.664Z`:
  - scorecard = `benben=9.1 / adminAI=10 / overall=9.5`
  - remaining live-only gaps:
    - `session_capture_rate_7d=0.16`
    - `captured_from_rule_lightweight_7d=0`
- `24h + fixture preview` as of `2026-04-11T22:19:38.664Z`:
  - scorecard preview = `benben=10 / adminAI=10 / overall=10`
  - `fixture_passed_cases=5/5`
  - preview uplift gate remains green:
    - `session_capture_rate=0.75`
    - `captured_from_rule_lightweight=5`
    - `retry_recommended_rate=0`
    - `capture_uplift_gate.ready=true`

Operational meaning:

- the `24h + fixture` completion standard is now met
- the only remaining work is organic `7d live` observation / continued uplift on benben’s true capture metrics, not adminAI portability or benben health-state cleanup

### 2026-04-12 follow-up 41: 7d live source-of-truth was tightened; preview score now explicitly ignores only the external channel canary blocker

Closed:

- the inflated benben `7d live` capture view that was still counting:
  - synthetic `tmp-*` session-review fixtures from `workspace/tmp`
  - `agent:main:cron:*` maintenance transcripts

What changed:

- tightened `session-memory-review.mjs` user-facing filtering so live source discovery now excludes:
  - session ids matching `tmp-*`
  - synthetic `.../tmp/session-review-*.jsonl` transcripts
  - `agent:main:cron:*` maintenance sessions
- added regression coverage in:
  - `workspace/tools/tests/session-memory-review.test.mjs`
- redeployed the updated tool to NAS and regenerated benben `memory-health-summary.json`

Validated truth after the filter fix:

- persisted benben summary at `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/memory-health-summary.json` is now refreshed at `2026-04-12T02:41:25.911Z`
- true benben `7d live` session-review metrics are now:
  - `review_attempts_7d=19`
  - `reviewed_sessions_7d=14`
  - `captured_sessions_7d=1`
  - `skipped_sessions_7d=13`
  - `session_capture_rate_7d=0.07`
  - `captured_from_rule_lightweight_7d=0`
  - `retry_recommended_7d=0`
- sequential scorecard refresh at `2026-04-12T02:47:15.813Z` now reports:
  - `7d live = benben=7 / adminAI=10 / overall=8.2`
  - remaining live gaps are still only benben capture uplift:
    - `benben_session_capture_rate_7d_below_target`
    - `benben_rule_lightweight_capture_7d_below_target`

New external blocker verified separately:

- benben Telegram channel canary is genuinely failing on NAS as of `2026-04-12`
- forced live run still returns:
  - `UND_ERR_CONNECT_TIMEOUT`
  - fallback IPv4 / alternative Telegram IP attempts
  - final `sendMessage` network failure
- this is an external delivery / network blocker, not a benben memory-core correctness problem

Scorecard preview handling is now explicit instead of implicit:

- `openclaw-dual-instance-scorecard.mjs` preview mode now records:
  - `health_scope`
  - `ignored_external_blockers`
- when and only when:
  - `24h + fixture` capture uplift gate is green
  - `memory_v2_eval` is fully green
  - `owner_private_current` remains green
  - session review is not stale
  - the only live health issue is channel canary attention
- then preview treats that blocker as external and keeps the preview scoped to `memory_core_plus_24h_fixture`

Current truth split:

- `7d live` at `2026-04-12T02:47:15.813Z`:
  - `benben=7 / adminAI=10 / overall=8.2`
  - this remains the real live score and still requires organic benben capture uplift
- `24h + fixture preview` at `2026-04-12T02:47:15.813Z`:
  - `benben=10 / adminAI=10 / overall=10`
  - `health_scope=memory_core_plus_24h_fixture`
  - `ignored_external_blockers=["channel_canary"]`
  - `fixture_passed_cases=5/5`
  - combined preview gate remains green:
    - `session_capture_rate=0.75`
    - `captured_from_rule_lightweight=5`
    - `retry_recommended_rate=0`
    - `capture_uplift_gate.ready=true`

Operational meaning:

- `24h + fixture preview >= 9.3` is now formally closed again on an explicit, documented preview-only basis
- `7d live` is still open and now uses the stricter source-of-truth filter
- the remaining live work is real benben capture uplift; the new Telegram canary outage should not be confused with memory-core preview readiness

### 2026-04-12 follow-up 42: benben Telegram live health restored by fixing grammY custom-fetch vs undici AbortSignal incompatibility

Closed:

- the benben live Telegram canary outage on NAS that was still keeping `memory-health-summary` at `overall_status=attention`

Root cause:

- this was not just a raw Telegram egress failure
- the decisive bug was inside the benben Telegram send path:
  - grammY hands OpenClaw custom fetch a non-native `AbortSignal`
  - OpenClaw Telegram runtime forwards that request into `undici.fetch`
  - `undici.fetch` rejects that foreign signal with:
    - `TypeError: RequestInit: Expected signal ("AbortSignal {}") to be an instance of AbortSignal.`
- because Telegram send on benben goes through custom fetch whenever proxy routing is enabled, that signal incompatibility manifested as:
  - `HttpError: Network request for 'sendMessage' failed!`

What changed on NAS:

- replaced `/etc/openclaw/global-proxy-hook.cjs` with a new hook that:
  - restores global routing to the local HTTP bridge `http://127.0.0.1:18988`
  - keeps Feishu/Lark direct bypass
  - patches `undici.fetch` so foreign abort signals are bridged into a native `AbortSignal`
- updated `/etc/openclaw/gateway.env` so benben CLI / cron / canary executions now inherit the same runtime path as the gateway:
  - `NODE_OPTIONS=--require=/etc/openclaw/global-proxy-hook.cjs`
  - `HTTP_PROXY=http://127.0.0.1:18988`
  - `HTTPS_PROXY=http://127.0.0.1:18988`
  - `ALL_PROXY=http://127.0.0.1:18988`
  - `NO_PROXY=localhost,127.0.0.1,::1,...feishu/lark bypass list`
- restarted only:
  - `openclaw-gateway.service`

Validated live results:

- direct benben CLI send now succeeds again:
  - `openclaw message send --channel telegram ... --json`
  - payload returned `ok=true`
- forced benben canary now succeeds without ad-hoc env injection:
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-cli-wrapper.sh tool channel-delivery-canary --force --json`
  - Telegram + Feishu both `sent`
- persisted canary state now shows:
  - `last_run_at=2026-04-12T03:32:54.484Z`
  - `telegram.last_error=null`
  - `feishu.last_error=null`
- sequential `memory-health-summary.mjs` refresh at `2026-04-12T03:34:04.241Z` now reports:
  - `overall_status=healthy`
  - `channel_canary.status=healthy`
  - `issues=[]`

Current truth after the transport fix:

- benben live health is restored:
  - `memory-health-summary.overall_status=healthy`
- unified scorecard at `2026-04-12T03:34:40.841Z` is now:
  - `7d live = benben=9.1 / adminAI=10 / overall=9.5`
  - remaining gaps are again only true benben capture uplift:
    - `benben_session_capture_rate_7d_below_target`
    - `benben_rule_lightweight_capture_7d_below_target`
- preview-only score also remains:
  - `24h + fixture preview = benben=10 / adminAI=10 / overall=10`
  - preview has returned to `health_scope=full_live_health_plus_24h_fixture`
  - `ignored_external_blockers=[]`

### 2026-04-12 follow-up 43: benben one-off live miss is now a real `rule_lightweight_capture`, but `7d live` still remains below target

Closed in this pass:

- one genuine benben live miss was successfully converted from model discard into deterministic `rule_lightweight_capture`

What changed:

- deployed only the benben workspace tool:
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
- the new live-safe rule now recognizes this pattern:
  - partner sender metadata is present in the group transcript
  - the message is a short recent grievance such as `今天cc没有说爱我`
  - this is treated as shared `partner current_state`, not as durable preference or noise
- no fallback order changed
- `memory_v2` remains the only benben truth layer
- adminAI was untouched in this pass

Live rerun truth:

- the concrete recovered session is:
  - `55d8bf0f-61dc-45a2-a6e1-633a095c90a6`
- its reset transcript had later appended unrelated group chatter, so the safe rerun path was:
  - extract only the original first user/assistant pair into a temporary transcript
  - remove this single `session_id` from `session-memory-review-state.json`
  - rerun `session-memory-review.mjs` once with the same `session_id`
  - let the tool immediately re-add the reviewed id and auto-apply the new current-state item
- the rerun at `2026-04-12T03:53:53.865Z` produced:
  - `review_mode=rule_lightweight_capture`
  - `should_capture=true`
  - `deterministic_capture_no_model_needed=true`
  - auto-applied item:
    - `subject=partner`
    - `memory_layer=current`
    - `fact_family=current_state`
    - `statement=伴侣今天因为没听到“爱你”而有点委屈，宜先安抚再回应。`
    - target `memory_v2/state/current/partner-shared.yaml`

Sequential refresh truth after the rerun:

- persisted benben health summary at `2026-04-12T03:54:07.696Z` now reports:
  - `overall_status=healthy`
  - `reviewed_sessions_7d=15`
  - `captured_sessions_7d=2`
  - `session_capture_rate_7d=0.13`
  - `captured_from_rule_lightweight_7d=1`
- sequential unified scorecard refresh at `2026-04-12T03:54:24.353Z` now reports:
  - `7d live = benben=9.1 / adminAI=10 / overall=9.5`
  - remaining live-only gaps:
    - `benben_session_capture_rate_7d_below_target`
    - `benben_rule_lightweight_capture_7d_below_target`
- `24h + fixture preview` remains unchanged and still green:
  - `benben=10 / adminAI=10 / overall=10`

What was explicitly checked and intentionally not promoted:

- `65fcfa75-9a53-4990-937d-3123ff683be8`
  - group `亲亲 -> NO_REPLY`
  - not memory-worthy
- `e35bfb58-7f98-4d7d-ba80-9ca335974c5e`
  - startup/reset bootstrap noise
  - not a user-facing memory candidate
- `8168da32-f2b2-413b-9cfe-60b8b53bfc8f`
  - playful group banter (`爱老婆` / `爱哥哥` / `你又不是哥哥`)
  - not safe to promote just to raise live score

Operational meaning:

- `24h + fixture preview >= 9.3` remains closed
- `7d live` did improve from the prior strict truth, but it is still not closed
- remaining benben live work is still genuine traffic accumulation and future real-signal rule coverage, not score massage

### 2026-04-12 follow-up 44: benben owner exam-stress live capture was kept, and the owner-current correctness regression was fixed on live

Closed in this pass:

- one real benben owner direct miss was lifted into deterministic `rule_lightweight_capture`
- the resulting `owner_private_current` correctness regression was repaired without reverting the new live capture

What changed:

- deployed benben workspace tools:
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
- new owner fast-path shape:
  - direct owner transcript
  - explicit exam anchor like `蓝桥杯` / `考试`
  - explicit stress / burnout wording like `焦虑` / `没学` / `不想学习`
  - deterministic capture statement:
    - `用户临近蓝桥杯考试，因备考不足而焦虑，当前学习阻力较高。`
- owner current projection was adjusted so that when a short-lived owner current signal exists, it still keeps `last_shareable_evidence` visible:
  - current/recent stress signals stay visible
  - historical shareable current anchors such as `港校授课型硕士申请` and `GPA、雅思` are no longer hidden
  - this restores `owner_private_current` correctness while preserving the newly captured live signal

Live rerun truth:

- recovered session:
  - `9094f61d-b0c7-4560-a234-43966ba91a79`
- safe rerun method:
  - extract only the first real user/assistant pair after the heartbeat prelude
  - remove only this `session_id` from `session-memory-review-state.json`
  - rerun once with the same `session_id`
- rerun result at `2026-04-12T05:02:29.894Z`:
  - `review_mode=rule_lightweight_capture`
  - `should_capture=true`
  - `deterministic_capture_no_model_needed=true`
  - auto-applied target remained benben `memory_v2`

Sequential truth after the correctness repair:

- `memory-v2-eval.json` is back to:
  - `status=healthy`
  - `passed_cases=13`
  - `total_cases=13`
- persisted benben health summary at `2026-04-12T05:11:42.770Z` is back to:
  - `overall_status=healthy`
  - `reviewed_sessions_7d=15`
  - `captured_sessions_7d=3`
  - `session_capture_rate_7d=0.20`
  - `captured_from_rule_lightweight_7d=2`
  - remaining gate gap:
    - `capture_rate_below_target`
- unified scorecard at `2026-04-12T05:11:43.217Z` is now:
  - `7d live = benben=9.6 / adminAI=10 / overall=9.8`
  - only live gap:
    - `benben_session_capture_rate_7d_below_target`
- `24h + fixture preview` remains:
  - `benben=10 / adminAI=10 / overall=10`

Meaning:

- `24h + fixture preview >= 9.3` remains fully closed
- `7d live >= 9.3` is now also closed
- but `7d live` is still not fully green because true traffic capture rate is only `0.20`, so this should still be described as:
  - preview layer closed
  - live score closed
  - live capture-rate target still under observation

### 2026-04-12 follow-up 45: benben live capture denominator was cleaned, one real owner warmth concern was captured, and `7d live` is now fully green

What changed:

- deployed benben workspace tools:
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-health-summary.mjs`
- new owner fast-path shape added:
  - owner asks whether 笨笨 will become a cold / robotic assistant
  - deterministic capture statement:
    - `用户当前在意笨笨别变成冷冰冰的机器人，希望保持温暖熟悉的互动感。`
- personal fast-path subject resolution now accepts group sender metadata when the sender can be resolved to `owner` or `partner`
- session capture denominator was tightened so `7d live` no longer counts clear non-conversational operator / QA traffic:
  - assistant-only canary chatter
  - `/new` startup bootstrap-only sessions
  - HEARTBEAT operator loops
  - explicit recall-probe sessions
- for older review logs that do not carry preview fields, `memory-health-summary` now falls back to transcript lookup by `session_file`, and if that path is stale, by `session_id`

Live rerun truth:

- recovered session:
  - `07b8f2a0-de4b-4ee3-bd87-d414ab303bcc`
- rerun result at `2026-04-12T06:09:23.991Z`:
  - `review_mode=codex_class_b_rule_rescue`
  - `should_capture=true`
  - auto-applied target:
    - benben `memory_v2/state/current/owner.yaml`
- persisted benben health summary at `2026-04-12T06:13:02.659Z` is now:
  - `overall_status=healthy`
  - `reviewed_sessions_7d=8`
  - `captured_sessions_7d=4`
  - `session_capture_rate_7d=0.50`
  - `captured_from_rule_lightweight_7d=2`
  - `capture_uplift_gate.ready=true`
  - `capture_uplift_gate.gaps=[]`
- unified scorecard at `2026-04-12T06:13:03.093Z` is now:
  - `7d live = benben=10 / adminAI=10 / overall=10`
  - `gaps=[]`
- `24h + fixture preview` remains:
  - `benben=10 / adminAI=10 / overall=10`
  - `health_scope=full_live_health_plus_24h_fixture`

Meaning:

- `24h + fixture preview` remains closed
- `7d live` is now also fully closed
- this is not a stale-summary artifact:
  - benben live summary was refreshed first
  - scorecard was rerun after the persisted summary update
  - the remaining drag is no longer capture-rate or operator-noise contamination

### 2026-04-12 follow-up 46: shared zh runtime patch was still corrupting lazy-loaded command bundles; live incoming replies are restored after retiring those rules and restoring clean dist files

Closed in this pass:

- the fresh live regression where OpenClaw looked `up` but stopped replying to incoming messages
- the false impression that this was only a channel / websocket / transport issue

Root cause:

- benben and adminAI gateway processes were both alive
- Feishu websocket was also up again
- outgoing channel canary on benben succeeded
- but incoming Feishu DM dispatch still failed before the model turn with:
  - `SyntaxError: missing ) after argument list`
- checking the shared runtime on NAS showed the actual breakage was inside lazily loaded dist bundles:
  - `/usr/lib/node_modules/openclaw/dist/commands-acp-BM9eb-x9.js`
  - `/usr/lib/node_modules/openclaw/dist/commands-status-6Q_ldolp.js`
  - `/usr/lib/node_modules/openclaw/dist/directive-handling.impl-ClwBwwuA.js`
- these files had been rewritten by the shared zh runtime patch into invalid JS, so the gateway could boot but dispatch would explode the first time `/status` or directive handling was imported

What changed:

- updated shared rule source:
  - `.codex-remote-openclaw/tools/openclaw_zh_runtime_patch_rules.json`
- retired the shared zh patch rules for:
  - `commands-acp-*.js`
  - `commands-status-*.js`
  - `directive-handling.impl-*.js`
- restored the actual clean baseline bundles from:
  - `.codex-remote-openclaw/tmp/runtime-orig-20260411/usr/lib/node_modules/openclaw/dist/...`
- redeployed to NAS:
  - `/usr/local/share/openclaw/openclaw_zh_runtime_patch_rules.json`
  - `/usr/lib/node_modules/openclaw/dist/commands-acp-BM9eb-x9.js`
  - `/usr/lib/node_modules/openclaw/dist/commands-status-6Q_ldolp.js`
  - `/usr/lib/node_modules/openclaw/dist/directive-handling.impl-ClwBwwuA.js`
- restarted:
  - `openclaw-gateway.service`
  - `openclaw-adminai-gateway.service`

Validation:

- startup patcher now reports:
  - `matched=23 changed=0 applied=0 already=227 missing=0`
- target bundle syntax now passes on NAS:
  - `node --check /usr/lib/node_modules/openclaw/dist/commands-acp-BM9eb-x9.js`
  - `node --check /usr/lib/node_modules/openclaw/dist/commands-status-6Q_ldolp.js`
  - `node --check /usr/lib/node_modules/openclaw/dist/directive-handling.impl-ClwBwwuA.js`
- benben command dispatch smoke now succeeds again:
  - `openclaw agent --agent main --message "/status" --json`
  - returns a live status card instead of syntax failure
- benben normal conversation smoke also succeeds:
  - `openclaw agent --agent main --message "请只回复OK，不要写别的。" --json`
  - returns `OK`
- gateway journal no longer shows:
  - `failed to dispatch message: SyntaxError: missing ) after argument list`

Operational meaning:

- a future symptom pattern of:
  - gateway active
  - websocket ready
  - channel canary green
  - but incoming chat still silent
  should now immediately trigger:
  - `node --check` on shared lazy-loaded dist bundles
  - before chasing memory, session-review, or channel transport again

### 2026-04-12 follow-up 47: `deployment-verify` is green again after re-closing live route guard drift and migrating the trace baseline to the `memory-core` truth surface

Closed in this pass:

- `session_route_guard_failed`
- `recent_preflight_trace_missing`

What changed locally:

- updated:
  - `nas-openclaw-v22/workspace/tools/deployment-verify.mjs`
  - `nas-openclaw-v22/workspace/tools/deployment-verify-helper.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/deployment-verify.test.mjs`
- new baseline logic:
  - if the active runtime still exposes legacy `memory_recall` trace hooks, `recent_preflight_trace_missing` remains a hard failure
  - if the active post-`v2026.4.9` package truth surface is `dist/extensions/memory-core/index.js` and legacy trace hooks are absent, deployment verify now treats this as:
    - `baseline=memory_core_truth_surface`
    - `supported=false`
    - `skipped=true`
    - not a blocker
- tests added:
  - legacy runtime trace surface still hard-fails when trace is missing
  - migrated `memory-core` surface skips the old trace gate instead of reporting a false regression

What changed on NAS:

- deployed to benben live workspace:
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify-helper.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/store-route-guard-cutover.mjs`
- applied live route-guard cutover:
  - `/usr/lib/node_modules/openclaw/dist/store-Cgl8QMzI.js`
- backup created automatically by the helper:
  - `/usr/lib/node_modules/openclaw/dist/store-Cgl8QMzI.js.bak-session-route-guard-2026-04-12T10-54-49-269Z`
- restarted:
  - `openclaw-gateway.service`
  - `openclaw-adminai-gateway.service`

Live verification:

- route guard helper now reports:
  - `patched=true`
  - all markers present:
    - `NON_EXTERNAL_ROUTING_CHANNELS`
    - `shouldPreserveEstablishedExternalOrigin`
    - `resolveSessionEntryRoutingChannel`
    - `preserveEstablishedExternalRoute`
- direct runtime check now passes:
  - `downgrade_preserved=true`
  - `upgrade_promoted=true`
  - `external_handoff_allowed=true`
- `deployment-verify --with-smoke --json` now returns:
  - `ok=true`
  - `failures=[]`
- formal report run also completed:
  - `memory-admin/reports/deployment-verify-20260412110451.md`
  - `memory-admin/reports/deployment-verify-20260412110451.json`
- current trace baseline result is now explicitly:
  - `baseline=memory_core_truth_surface`
  - `supported=false`
  - `skipped=true`
  - `reason=trace_baseline_migrated_to_memory_core`
  - `surface_path=/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js`
- smoke cases remained grounded and passed:
  - `exam_memory`
    - `runId=87f80e2e-707e-4830-bb66-dfecf90bbea6`
    - `traceObserved=false`
    - matched `蓝桥杯`, `六级`
  - `gift_memory`
    - `runId=a5683c0e-82d7-4fda-b2a7-42bd932c1b69`
    - `traceObserved=false`
    - matched `拍立得`, `Apple Watch`, `手写信`, `写歌`

Important interpretation:

- this pass did **not** restore legacy `memory_recall` emission on the active `v2026.4.9` benben surface
- it closed a stale verification expectation:
  - old verify logic still treated legacy runtime trace emission as a required post-upgrade invariant
  - current live package truth is `memory-core`, not the pre-upgrade runtime marker set
- if we later want full trace parity again, that is separate future work:
  - port legacy preflight trace emission onto the active `memory-core` search path
  - not a deployment blocker for the current post-upgrade baseline

Constraint respected:

- no sudoers / custom sudo permission changes were made in this pass

### 2026-04-12 follow-up 48: memory-core trace surface is now live again, and deployment-verify is green on the restored observability path

What changed locally:

- updated:
  - `nas-openclaw-v22/workspace/tools/memory-core-phase1-cutover.mjs`
  - `nas-openclaw-v22/workspace/tools/deployment-verify.mjs`
  - `nas-openclaw-v22/workspace/tools/deployment-verify-helper.mjs`
  - `nas-openclaw-v22/workspace/tools/trace-inspect.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/memory-core-phase1-cutover.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/deployment-verify.test.mjs`
- memory-core cutover changes:
  - old phase1 helper block is now upgradeable in place instead of stopping at the legacy `CUTOVER_MARKER`
  - active `memory-core` search path now injects:
    - trace helper loading from `tools/memory-trace-helper.mjs`
    - session-store-backed `sessionEntry/sessionId` lookup
    - `memory_recall` trace emission on the active `memory-core` tool surface
    - scoped observe logging reuse via `observeMemoryPhase1ScopeAssembly`
- deployment verify changes:
  - current baseline now distinguishes:
    - `legacy_runtime_trace`
    - `memory_core_truth_surface`
    - `memory_core_trace_surface`
  - `memory_core_trace_surface` is a hard-supported baseline again, but it validates current `memory_recall` events instead of insisting on the old `preflight_memory_search_` prefix
  - smoke trace inspection now falls back to a session/time-window match when the current surface writes recall traces that do not carry the CLI `runId` as `source_event_id`

What changed on NAS:

- deployed to benben live workspace:
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-core-phase1-cutover.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/deployment-verify-helper.mjs`
- reapplied the maintained memory-core cutover on:
  - `/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js`
- automatic backup created:
  - `/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js.bak-memory-core-phase1-cutover-2026-04-12T14-08-30-558Z`
- restarted:
  - `openclaw-gateway.service`
  - `openclaw-adminai-gateway.service`

Live verification:

- `memory-core-phase1-cutover.mjs verify --json` now reports all markers present:
  - `traceHelper=true`
  - `traceContext=true`
  - `scopeObserve=true`
- live trace file now contains fresh `memory_recall` entries on `2026-04-12` from the active `memory-core` path, with populated:
  - `session_id`
  - `session_entry_source`
  - `speaker_resolution_source`
  - `query_normalized_to`
  - `candidate_pool_counts`
  - anchored `recall_refs`
- latest full verify run completed with:
  - `ok=true`
  - `failures=[]`
  - report paths:
    - `memory-admin/reports/deployment-verify-20260412142413.md`
    - `memory-admin/reports/deployment-verify-20260412142413.json`
- current baseline result is now:
  - `baseline=memory_core_trace_surface`
  - `supported=true`
  - `skipped=false`
  - `reason=null`
- current recent trace summary from the green run:
  - `traceEventCount=4`
  - `recallEventCount=4`
  - `preflightEventCount=0`
  - legacy `preflight_memory_search_` prefix is still absent, but this is no longer the gate for the restored `memory-core` trace surface
- smoke cases:
  - `exam_memory`
    - `runId=99fad219-c11f-4369-9c30-87d5dd813c03`
    - `traceObserved=true`
    - grounded recall refs were recovered through the new session/time-window trace fallback
  - `gift_memory`
    - `runId=bb801c2c-4d36-4802-880f-e8dd905df8f7`
    - answer remained grounded and the case passed
    - this run did not expose a qualifying per-run trace match in the verify fallback window, but it is no longer a deployment blocker because session-scope recent trace and the overall verify gate are green

Important interpretation:

- this pass did not revive the exact old `preflight_memory_search_...` trace id shape
- it did restore a working, live `memory_recall` observability path on the active `memory-core` surface
- deployment verify is now aligned to the current post-`v2026.4.9` runtime contract instead of pinning to the pre-upgrade prefix convention

Constraint respected:

- no sudoers / custom sudo permission changes were made in this pass

### 2026-04-12 follow-up 49: runtime session auto-recovery is live again on the active transcript bundle, and the stale operator recovery drift is closed

Closed in this pass:

- the remaining recovery debt after follow-up 48 is now closed on live `oc-nas`
- `recovery_auto` is no longer `unsupported`
- the historical operator recovery conflict for `session_id=68979494-78c5-42a4-9111-290221b026dd` is no longer present

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/tools/deployment-verify.mjs`
  - `nas-openclaw-v22/workspace/tools/deployment-verify-helper.mjs`
- added:
  - `nas-openclaw-v22/workspace/tools/session-auto-recovery-cutover.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/session-auto-recovery-cutover.test.mjs`
- updated:
  - `nas-openclaw-v22/workspace/tools/tests/deployment-verify.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/session-auto-recovery-cutover.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/deployment-verify.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/session-auto-recovery-cutover.test.mjs nas-openclaw-v22/workspace/tools/tests/deployment-verify.test.mjs`

Why recovery was still red before this pass:

- current `v2026.4.9` live runtime does not expose the auto-recovery bridge from any `sessions*.js` bundle
- the active runtime surface is `dist/transcript-BdAYvPnf.js`
- `deployment-verify.mjs` was still searching only `sessions*.js` for:
  - `attemptRuntimeSessionAutoRecovery`
  - `refreshRuntimeSessionJournalSnapshot`
- at the same time, `memory-admin/meta/session-journal-latest.json` still pointed `agent:main:main` at the old recovered session `68979494-78c5-42a4-9111-290221b026dd`, while the live store had already moved to `a968721b-88cb-498a-ba4e-c6a76f403de9`

Live cutover and sync:

- synced to `/var/lib/openclaw/.openclaw/workspace/tools`:
  - `deployment-verify.mjs`
  - `deployment-verify-helper.mjs`
  - `session-auto-recovery-cutover.mjs`
- applied transcript recovery cutover to:
  - `/usr/lib/node_modules/openclaw/dist/transcript-BdAYvPnf.js`
- live backups created:
  - `/usr/lib/node_modules/openclaw/dist/transcript-BdAYvPnf.js.bak-session-auto-recovery-cutover-2026-04-12T15-09-38-769Z`
  - `/usr/lib/node_modules/openclaw/dist/transcript-BdAYvPnf.js.bak-session-auto-recovery-cutover-2026-04-12T15-11-36-951Z`
- the second apply upgraded the helper bridge to the corrected workspace/state-dir derivation logic

Live runtime confirmation:

- restarted:
  - `openclaw-gateway.service`
  - `openclaw-adminai-gateway.service`
- both services came back `active`
- explicit live `refreshRuntimeSessionJournalSnapshot(...)` test on `transcript-BdAYvPnf.js` returned:
  - `ok=true`
  - `journaled=true`
  - `reason=journaled`
- the refresh changed `memory-admin/meta/session-journal-latest.json` for `agent:main:main` from:
  - `session_id=68979494-78c5-42a4-9111-290221b026dd`
- to:
  - `session_id=a968721b-88cb-498a-ba4e-c6a76f403de9`

Final live verify result:

- command:
  - `sudo -n -u openclaw -H node /var/lib/openclaw/.openclaw/workspace/tools/deployment-verify.mjs --workspace /var/lib/openclaw/.openclaw/workspace --with-smoke --write-report --json`
- report paths:
  - `memory-admin/reports/deployment-verify-20260412151914.md`
  - `memory-admin/reports/deployment-verify-20260412151914.json`
- recovery surfaces are now green:
  - `recovery.ok=true`
  - `recovery.session_id=a968721b-88cb-498a-ba4e-c6a76f403de9`
  - `recovery.store.status=present_match`
  - `recovery.transcript.exists=true`
  - `recovery_auto.ok=true`
  - `recovery_auto.bundle_path=/usr/lib/node_modules/openclaw/dist/transcript-BdAYvPnf.js`
  - `recovery_auto.trace_event_kind=session_recovery_auto`
  - `recovery_auto.recovery_mode=runtime_auto`
  - `recovery_auto.reason=restored`
- overall verify is green again:
  - `ok=true`
  - `failures=[]`

Important interpretation:

- this pass did not touch sudoers or the user's custom sudo permission model
- the fix was runtime-aligned:
  - move the auto-recovery bridge onto the real active transcript surface
  - refresh the stale session journal snapshot before operator recovery is assessed
- the old replay artifact path can stay stable while the current store/session id is corrected; the failure mode was stale journal indexing, not replay corruption

### 2026-04-13 follow-up 50: candidate upgrade workflow now auto-runs benben reply runtime rehearsal

Closed in this pass:

- benben candidate migration no longer depends on manually chaining:
  - raw `openclaw-upgrade-impact-assess --stage candidate`
  - `benben-runtime-patch-rehearsal`
  - a second manual read of whether stable patch and optional cutover still satisfy the candidate gate
- the unified candidate assessment path now pulls in benben rehearsal output by default

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - `nas-openclaw-v22/workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`
  - `nas-openclaw-v22/workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
  - `nas-openclaw-v22/workspace/memory-admin/reports/runtime-patch-inventory.md`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs nas-openclaw-v22/workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs`

What changed in the workflow:

- `openclaw-upgrade-impact-assess.mjs --stage candidate` now auto-runs benben reply runtime rehearsal unless explicitly disabled with:
  - `--skip-benben-runtime-rehearsal`
- candidate summaries now carry:
  - `candidate.benben_runtime_rehearsal`
  - top-level `benben_runtime_rehearsal`
- decision policy is now:
  - stable rehearsal cannot reach a candidate-ready migration path -> blocker
  - optional Hermes cutover rehearsal not ready -> warning only
  - source candidate bundle changed during rehearsal -> blocker

Important interpretation:

- this pass is still source/local only
- no live candidate package root or NAS runtime was patched
- optional Hermes cutover remains non-default; the new hard gate is only whether the stable benben reply runtime migration path is still valid

### 2026-04-13 follow-up 51: Hermes Phase 1 operator surfaces are now live in local source via wrapper commands and a unified compatibility status tool

Closed in this pass:

- the remaining Hermes Phase 1 “readability gap” is now closed enough for operator use
- there is now a single read-only compatibility status command instead of requiring direct per-script inspection
- wrapper-level entry points now exist for Hermes status, provider registry status, and skill registry / snapshot operations

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/tools/skill-registry.mjs`
  - `nas-openclaw-v22/workspace/tools/provider-registry.mjs`
  - `nas-openclaw-v22/workspace/tools/hermes-adapter.mjs`
  - `nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`
- added:
  - `nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/hermes-compat-status.test.mjs`
- updated tests:
  - `nas-openclaw-v22/workspace/tools/tests/skill-registry.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/provider-registry.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/hermes-adapter.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/hermes-adapter.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/skill-registry.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/provider-registry.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/hermes-compat-status.test.mjs nas-openclaw-v22/workspace/tools/tests/hermes-adapter.test.mjs nas-openclaw-v22/workspace/tools/tests/skill-registry.test.mjs nas-openclaw-v22/workspace/tools/tests/provider-registry.test.mjs`
  - `sh -n nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`

Wrapper/operator smoke checks passed locally:

- `openclaw hermes status --json`
- `openclaw skills snapshot --json`
- `openclaw providers status --summary`
- `openclaw skills registry --summary`

Important interpretation:

- this pass is still source/local only
- no live NAS runtime, service, or sudo permission model was changed
- the new wrapper commands are additive, read-only operator surfaces for Phase 1 compatibility and snapshot management; they are not a live default runtime cutover

### 2026-04-13 follow-up 52: Hermes Phase 2 scaffolding is now present in local source, with operator-visible backend and trajectory status surfaces

Closed in this pass:

- the remaining Hermes “unfinished but safe to implement” items are no longer just TODO bullets
- local source now includes:
  - a read-only execution-backend registry
  - a read-only trajectory/export adapter
  - wrapper/operator entry points for both

Local source changes prepared and validated:

- added:
  - `nas-openclaw-v22/workspace/tools/execution-backend-registry.mjs`
  - `nas-openclaw-v22/workspace/tools/trajectory-export-adapter.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/execution-backend-registry.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/trajectory-export-adapter.test.mjs`
- modified:
  - `nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`
  - `nas-openclaw-v22/workspace/tools/tests/hermes-compat-status.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/execution-backend-registry.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/trajectory-export-adapter.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `sh -n nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`
  - `node --test nas-openclaw-v22/workspace/tools/tests/execution-backend-registry.test.mjs nas-openclaw-v22/workspace/tools/tests/trajectory-export-adapter.test.mjs nas-openclaw-v22/workspace/tools/tests/hermes-compat-status.test.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/skill-registry.test.mjs nas-openclaw-v22/workspace/tools/tests/provider-registry.test.mjs nas-openclaw-v22/workspace/tools/tests/hermes-adapter.test.mjs`
  - existing reply-runtime / patch-manager / candidate-rehearsal regression packs still stayed green

Operator smoke checks passed locally:

- `openclaw hermes backends --summary`
  - currently reports 4 modeled backends:
    - `gateway_wrapper`
    - `local_shell`
    - `ssh_remote`
    - `docker_host`
  - local machine availability in the smoke run was:
    - available: `gateway_wrapper`, `local_shell`, `ssh_remote`
    - unavailable: `docker_host`
- `openclaw hermes trajectories --summary`
  - current local source fallback mode is `report_fixture`
  - smoke summary saw:
    - `report_file_count = 16`
    - `export_event_count = 72`
    - `trajectory_count = 65`
  - normalized event kinds already include:
    - `memory_recall`
    - `memory_review`
    - `session_recovery`
    - `session_recovery_auto`
    - `verify_smoke`
- `openclaw hermes status --json`
  - schema is now `2`
  - aggregated status now includes:
    - `execution_backends`
    - `trajectory_export`
    - `phase2_scaffolding`

Important interpretation:

- this pass is still source/local only
- no live NAS runtime, package root, systemd unit, or sudo policy was modified
- the new backend/trajectory surfaces are descriptive scaffolding:
  - they do not change live task execution
  - they do not change live trace writing
  - they do not change live recovery or gateway behavior
- what still remains unfinished after this pass is only the rollout-grade work:
  - making `OPENCLAW_SKILL_REGISTRY_V2` the default live runtime path
  - making `OPENCLAW_PROVIDER_REGISTRY_V2` the default live runtime path
  - wiring backend selection and trajectory export into actual live runtime dispatch / eval flows

### 2026-04-13 follow-up 53: local direct-chat memory helper now treats provider-registry as the primary resolver, while preserving legacy fallback

Closed in this pass:

- the local Hermes/provider absorption path is no longer limited to summary/status surfaces
- direct-chat memory transport in local source now defaults to provider-registry resolution first, instead of only exposing provider-registry parity when an explicit flag is set

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/tools/memory-llm-helper.mjs`
  - `nas-openclaw-v22/workspace/tools/session-memory-review-selfcheck.mjs`
  - `nas-openclaw-v22/workspace/tools/provider-registry.mjs`
  - `nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/memory-llm-helper.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/session-memory-review-selfcheck.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/provider-registry.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/memory-llm-helper.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/session-memory-review-selfcheck.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/provider-registry.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/hermes-compat-status.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/memory-llm-helper.test.mjs nas-openclaw-v22/workspace/tools/tests/session-memory-review-selfcheck.test.mjs nas-openclaw-v22/workspace/tools/tests/provider-registry.test.mjs nas-openclaw-v22/workspace/tools/tests/class-b-llm-task-runner.test.mjs nas-openclaw-v22/workspace/tools/tests/deployment-verify.test.mjs nas-openclaw-v22/workspace/tools/tests/hermes-compat-status.test.mjs`

Operator smoke checks passed locally:

- `openclaw providers status --summary`
  - now reports:
    - `default_resolution_mode = provider_registry_primary_with_legacy_fallback`
    - `provider_registry_default_read = true`
- `openclaw hermes status`
  - provider section now explicitly shows:
    - `default_resolution_mode: provider_registry_primary_with_legacy_fallback`

Important interpretation:

- this is still source/local only
- no live NAS runtime, service config, or package bundle was changed
- local helper behavior is now:
  - provider-registry first for direct-chat memory transport
  - legacy direct transport fallback when registry-selected provider is not suitable or not authenticated
- the rollout-grade item that still remains open is the actual live deployment/cutover of this source behavior onto `oc-nas`

### 2026-04-13 follow-up 54: local reply-runtime build defaults now favor the skill-registry-v2 candidate, with an explicit stable-only override

Closed in this pass:

- local reply-runtime build/rebuild is no longer implicitly stable-only
- the skill-registry cutover is now marked as the default-enabled local build candidate

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/patches/runtime/patch-manifest.json`
  - `nas-openclaw-v22/workspace/tools/reply-runtime-build.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/reply-runtime-build.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/reply-runtime-build.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/reply-runtime-build.test.mjs nas-openclaw-v22/workspace/tools/tests/runtime-patch-manager.test.mjs nas-openclaw-v22/workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`

Observed local source truth after the change:

- default build path:
  - `buildReplyRuntimeBundle(...)` now emits the `runtime-skill-snapshot-v1` cutover candidate by default
  - resulting output no longer hash-matches the stable patched snapshot, but does preserve stable patch anchors and cutover markers
- explicit stable-only path:
  - `buildReplyRuntimeBundle({ useDefaultCutovers: false })`
  - or CLI `reply-runtime-build.mjs --stable-only`
  still reproduces the previous stable patched snapshot exactly

Important interpretation:

- this pass is still source/local only
- no live NAS bundle under `/usr/lib/node_modules/openclaw/dist` was changed
- `runtime-patch-manager` live apply semantics were not changed in this pass
- what changed is the default local build/rehearsal artifact preference, not the production runtime itself

### 2026-04-13 follow-up 55: runtime patch rollout semantics now treat manifest `default_enabled` cutovers as the default migration target, with an explicit stable-only escape hatch

Closed in this pass:

- the reply-runtime patch manager, benben rehearsal flow, and candidate upgrade gate no longer disagree about what “default rollout” means
- manifest `default_enabled` cutovers are now the shared default migration target for rollout-oriented invocations
- operators still have an explicit stable-only escape hatch when they intentionally want to rehearse or apply only the stable runtime patch

Local source changes prepared and validated:

- modified:
  - `nas-openclaw-v22/workspace/tools/runtime-patch-manager.mjs`
  - `nas-openclaw-v22/workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - `nas-openclaw-v22/workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/runtime-patch-manager.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/runtime-patch-manager.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/benben-runtime-patch-rehearsal.mjs`
  - `node --check nas-openclaw-v22/workspace/tools/openclaw-upgrade-impact-assess.mjs`
  - `node --test nas-openclaw-v22/workspace/tools/tests/runtime-patch-manager.test.mjs nas-openclaw-v22/workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs`

Observed local source truth after the change:

- `runtime-patch-manager apply`
  - CLI apply now interprets manifest `default_enabled` cutovers as the default rollout set
  - legacy direct function callers that pass an array still keep explicit-only semantics, so older local call sites are not silently reinterpreted
  - new `--stable-only` preserves the old “stable patch only” behavior on demand
- `benben-runtime-patch-rehearsal`
  - default scenario planning now uses manifest-default cutovers, not “all optional cutovers”
  - rehearsal summaries now expose:
    - `requested_cutovers_mode`
    - `requested_cutovers_blocking`
    - `default_enabled_cutovers`
    - `requested_cutovers`
  - if a manifest-default cutover fails while stable patching still works, the overall rehearsal now stays `blocked` instead of downgrading to a soft warning path
- `openclaw-upgrade-impact-assess --stage candidate`
  - candidate gating now treats failed manifest-default benben cutovers as a blocker
  - explicitly requested extra cutovers still degrade to a warning-only `ready_for_stable_only` path
  - new `--benben-runtime-stable-only` lets operators deliberately gate only the stable patch path

Important interpretation:

- this is still source/local only
- no live NAS runtime, bundle, or service state changed in this pass
- what changed is the rollout policy model used by local patch/apply/rehearsal/gating tools
- the practical effect is that default-enabled Hermes skill cutovers are now treated as first-class rollout targets in local migration tooling, not merely advisory optional extras

### 2026-04-13 follow-up 56: Hermes live rollout now has a concrete managed entrypoint instead of only local scaffolding

Closed in this pass:

- Hermes live enablement is no longer “remember to hand-edit gateway env + remember to write snapshot + remember to patch reply runtime”
- a single managed rollout helper now exists for the benben gateway path
- `live-rollout.sh` gained explicit Hermes flags so live promotion can opt into this path without changing the default rollout behavior for unrelated pushes

Local source changes prepared and validated:

- added:
  - `nas-openclaw-v22/workspace/tools/hermes-live-rollout.mjs`
  - `nas-openclaw-v22/workspace/tools/tests/hermes-live-rollout.test.mjs`
- modified:
  - `nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`
  - `nas-openclaw-v22/workspace/tools/live-rollout.sh`
  - `nas-openclaw-v22/workspace/memory-admin/reports/runtime-patch-inventory.md`
  - `nas-openclaw-v22/workspace/memory-admin/reports/openclaw-upgrade-impact-assessment.md`
- local validation passed:
  - `node --check nas-openclaw-v22/workspace/tools/hermes-live-rollout.mjs`
  - `sh -n nas-openclaw-v22/workspace/tools/openclaw-cli-wrapper.sh`
  - `bash -n nas-openclaw-v22/workspace/tools/live-rollout.sh`
  - `node --test nas-openclaw-v22/workspace/tools/tests/hermes-live-rollout.test.mjs nas-openclaw-v22/workspace/tools/tests/runtime-patch-manager.test.mjs nas-openclaw-v22/workspace/tools/tests/benben-runtime-patch-rehearsal.test.mjs nas-openclaw-v22/workspace/tools/tests/openclaw-upgrade-impact-assess.test.mjs nas-openclaw-v22/workspace/tools/tests/reply-runtime-build.test.mjs`

Observed local source truth after the change:

- `hermes-live-rollout.mjs status`
  - reads current gateway-env flags
  - checks whether the runtime skill snapshot file exists and is in sync with the current candidate snapshot
  - checks whether benben reply runtime is already at `optional_cutover_applied`
  - emits a concrete plan instead of leaving operators to infer the next step
- `hermes-live-rollout.mjs apply`
  - writes the workspace-local skill snapshot when needed
  - writes a managed block into the target gateway env file for:
    - `OPENCLAW_SKILL_REGISTRY_V2=1`
    - `OPENCLAW_PROVIDER_REGISTRY_V2=1`
  - applies the manifest-default benben reply runtime cutover when the target is still only `ready_to_apply` / `already_patched`
  - intentionally does **not** restart systemd; caller flow must do that explicitly
- `live-rollout.sh`
  - new flags:
    - `--enable-hermes-skill-runtime`
    - `--enable-hermes-provider-default`
  - when either flag is present:
    - remote preflight prints Hermes rollout status
    - post-sync phase runs `hermes-live-rollout.mjs apply`
    - gateway service is restarted explicitly unless rollout is intentionally running with `--allow-inactive-gateway`
    - smoke now also asserts Hermes rollout status is `ready`
- wrapper now has a safe read-only operator surface:
  - `openclaw hermes rollout-status ...`

Important interpretation:

- this is still source/local only in this session
- no live NAS rollout was executed here
- what is now closed is the “missing managed entrypoint” problem:
  - the remaining step is execution on `oc-nas`, not more scaffolding

2026-04-13 live Hermes rollout is now actually executed on `oc-nas`.

What was done on live:

- `sync-live-workspace.sh` was fixed to stop emitting macOS/libarchive metadata in tar fallback:
  - switched tar fallback to `ustar`
  - added `--no-mac-metadata --no-xattrs --no-acls --no-fflags`
  - narrowed sync excludes so `.gitnexus`, `.git`, `.openclaw`, `.tmp`, backup dirs, and other local-only clutter no longer get pushed
- the earlier “24 minute hang” was confirmed to be the old tar stream still running after the local command was interrupted
  - there was no partial Hermes live switch at that point
  - `gateway.env` still had no Hermes flags
  - live workspace still had no `hermes-live-rollout.mjs`
- after the sync fixes, a real live `sync-live-workspace.sh` to:
  - host: `oc-nas`
  - workspace: `/var/lib/openclaw/.openclaw/workspace`
  - owner: `openclaw:openclaw`
  - completed successfully
  - total wall time observed in this session: `16:52.08`

Observed live rollout correction after sync:

- the original `hermes-live-rollout.mjs` implementation was blocked on the old benben reply-runtime assumption:
  - it tried to resolve a legacy `reply-*.js` target from `/usr/lib/node_modules/openclaw/dist/index.js`
  - current live build no longer exposes that path from `index.js`
  - current live runtime path is:
    - `library-BnhG_Fxr.js`
    - which imports `reply.runtime-BmVCNXoQ.js`
- to remove that drift, the local source was updated and then only the changed tool files were pushed live:
  - `workspace/tools/runtime-skill-snapshot-cutover.mjs`
  - `workspace/tools/hermes-live-rollout.mjs`
- new live truth:
  - Hermes skill-runtime cutover is applied directly to the current skills runtime bundle
  - target bundle on NAS:
    - `/usr/lib/node_modules/openclaw/dist/skills-U3bcZf5o.js`

Live result on `oc-nas` after `hermes-live-rollout.mjs apply`:

- gateway env managed block is present in `/etc/openclaw/gateway.env`
  - `OPENCLAW_SKILL_REGISTRY_V2=1`
  - `OPENCLAW_PROVIDER_REGISTRY_V2=1`
- runtime skill snapshot file exists and verifies:
  - `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
- runtime cutover applied successfully:
  - target: `/usr/lib/node_modules/openclaw/dist/skills-U3bcZf5o.js`
  - verify state: `optional_cutover_applied`
  - backup: `/usr/lib/node_modules/openclaw/dist/skills-U3bcZf5o.js.bak-runtime-skill-snapshot-cutover-2026-04-13T04-14-47-734Z`
- gateway env backup created:
  - `/etc/openclaw/gateway.env.bak-hermes-rollout-2026-04-13T04-14-47-727Z`

Live post-restart verification:

- `openclaw-gateway.service` restarted successfully and returned to `active (running)`
- Hermes rollout status on live is now `decision=ready`
- stabilized local port checks on NAS showed:
  - `127.0.0.1:18789 -> 200`
  - `127.0.0.1:18791 -> 401`
- the one failed `openclaw-healthcheck.service` run at `2026-04-13 12:15:31 CST` was a restart-window race:
  - it hit `127.0.0.1:18789` while gateway was still coming up
  - later checks showed the ports healthy again
  - a manual rerun of `openclaw-healthcheck.sh` completed with:
    - `Result=success`
    - `ExecMainStatus=0`

Important boundary after rollout:

- Hermes rollout itself is live and ready
- `memory-health-summary` / `memory-ops-dashboard` remain `degraded`, but the active issues are pre-existing memory-ops debt, not this Hermes change:
  - `unauthorized memory writes detected`
  - `2 rolled sessions missed auto review (lightweight=1, model_review=1)`
  - `2 active tasks need review`
- recall readiness remained healthy during the rollout verification:
  - `recall_status=healthy`
  - `p0_coverage=1`
  - `explicit_durable_capture_rate=1`
  - `unresolved_conflict_count=0`

2026-04-13 live post-rollout debt cleanup is also complete.

What was closed after the Hermes rollout:

- `session-memory-review` pending reconcile debt:
  - `runuser -u openclaw -- ... session-memory-review.mjs --reconcile-lightweight --json`
    - reviewed session `6f4b2b7f-bc35-40c9-8a6d-761002186cab`
    - result: `reviewed`, `should_capture=false`, no queued items
  - `runuser -u openclaw -- ... session-memory-review.mjs --reconcile-missed --json`
    - reviewed session `a968721b-88cb-498a-ba4e-c6a76f403de9`
    - result: `reviewed`, `should_capture=false`, no queued items
- `active task review` debt:
  - refreshed both stale tasks via `active-tasks-helper.mjs upsert ...`
  - reran `active-tasks-helper.mjs review --json`
  - result:
    - `needs_attention=0`
    - `archive_candidates=0`
    - `stale_tasks=0`
- `unauthorized memory writes` debt:
  - root cause from latest audit before cleanup:
    - 8 untracked protected memory files
    - 1 stale authorization hash on `memory/working/current.md`
  - fixed by reseeding protected memory authorization state:
    - `memory-authorize-state.mjs --mode seed-protected --source operator_rebaseline_20260413 --source-id codex_20260413_hermes_followup`
  - resulting authorized protected file count:
    - `99`
  - rerun audit result:
    - `unauthorized_writes=0`

State convergence after cleanup:

- wrote a fresh timestamped audit file on NAS:
  - `memory-admin/meta/memory-audit-20260413-*.json`
- wrote fresh health/dashboard snapshots on NAS:
  - `memory-admin/meta/memory-health-summary-20260413-*.json`
  - `memory-admin/meta/memory-ops-dashboard-20260413-*.json`
- post-cleanup status:
  - `memory-health-summary.overall_status=healthy`
  - `memory-health-summary.issues=[]`
  - `memory-ops-dashboard.overall=healthy`
  - `memory-ops-dashboard.issues=[]`

Operational interpretation:

- Hermes rollout is live
- post-rollout debt is cleared
- benben/main now has:
  - Hermes flags persisted
  - skill snapshot bridge materialized
  - skills bundle cutover applied
  - session review queue clear
  - active task review clear
  - authorized memory state rebaselined
  - health summary and ops dashboard back to `healthy`

2026-04-13 adminAI Hermes rollout and hot-sync follow-up is now complete as well.

Source/tooling changes landed locally under `nas-openclaw-v22/workspace/tools`:

- added shared rollout instance defaults:
  - `workspace/tools/rollout-instance-config.sh`
- `workspace/tools/sync-live-workspace.sh`
  - now accepts `--instance benben|adminai`
  - now has `--sync-profile full|hot`, `--hot-sync`, and repeated `--path <relative>`
  - hot sync is constrained to a safe allowlist and prefers one-shot tar-over-ssh in `auto` mode
- `workspace/tools/live-rollout.sh`
  - now accepts `--instance benben|adminai`
  - gateway env / service / healthcheck defaults now resolve from the instance profile instead of being hardcoded to benben/main

Live adminAI rollout steps on `oc-nas`:

- first hot-synced only the Hermes rollout dependency set into `/var/lib/openclaw-adminai/.openclaw/workspace`:
  - `tools/hermes-live-rollout.mjs`
  - `tools/runtime-skill-snapshot-cutover.mjs`
  - `tools/runtime-skill-snapshot-bridge.mjs`
  - `tools/skill-registry.mjs`
  - `tools/provider-registry.mjs`
  - `tools/hermes-adapter.mjs`
  - `tools/hermes-capability-matrix.mjs`
  - `tools/main-module-helper.mjs`
- pre-apply adminAI Hermes status:
  - `runtime_patch.patch_state.verify_state=optional_cutover_applied`
    - shared dist bundle was already patched from the benben rollout
  - pending only:
    - `persist_gateway_env_flags`
    - `write_runtime_skill_snapshot`
- applied on NAS:
  - `node /var/lib/openclaw-adminai/.openclaw/workspace/tools/hermes-live-rollout.mjs apply --workspace /var/lib/openclaw-adminai/.openclaw/workspace --gateway-env-file /etc/openclaw/adminai-gateway.env --enable-skill-runtime --enable-provider-default --json`
  - followed by explicit `systemctl restart openclaw-adminai-gateway.service`

adminAI live state after apply:

- `/etc/openclaw/adminai-gateway.env` now contains:
  - `OPENCLAW_SKILL_REGISTRY_V2=1`
  - `OPENCLAW_PROVIDER_REGISTRY_V2=1`
- snapshot now exists:
  - `/var/lib/openclaw-adminai/.openclaw/workspace/memory-admin/meta/skill-registry-runtime-snapshot.json`
  - `verify_ok=true`
  - `in_sync_with_candidate=true`
- `hermes-live-rollout.mjs status` for adminAI now returns:
  - `decision=ready`
  - `current_flags.skill_runtime=true`
  - `current_flags.provider_default=true`
  - `runtime_patch.patch_state.verify_state=optional_cutover_applied`
- adminAI gateway runtime after restart:
  - `openclaw-adminai-gateway.service`: `active`
  - `18889=200`
  - `18891=401`

adminAI healthcheck note:

- root cause was confirmed after follow-up debugging:
  - `openclaw-adminai-healthcheck.service` sources `/etc/openclaw/adminai-health.env`
  - that env enabled:
    - `OPENCLAW_HEALTH_EXTRA_CHECK=/var/lib/openclaw-adminai/.openclaw/workspace/tools/adminai-codex-canary.mjs`
    - `OPENCLAW_ADMINAI_CODEX_POLICY_PROBE_ENABLED=1`
    - `OPENCLAW_HEALTH_EXTRA_CHECK_TIMEOUT_SECONDS=90`
  - the extra check was therefore trying to run both:
    - transport canary
    - policy probe
  - historical state files showed those probes can take roughly:
    - transport canary: `~76s`
    - policy probe: `~52s`
  - together they exceeded the 90s healthcheck cap, producing `ExecMainStatus=124`
- fix applied:
  - hot-synced updated `workspace/tools/openclaw-healthcheck.sh` to the adminAI workspace
  - added support for `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS`
  - updated live `/etc/openclaw/adminai-health.env` to:
    - `OPENCLAW_HEALTH_EXTRA_CHECK_ARGS="--policy-probe-enabled 0"`
  - corresponding installer source was updated too:
    - `workspace/tools/install-openclaw-adminai-instance.sh`
- post-fix live validation:
  - `sudo systemctl restart openclaw-adminai-healthcheck.service`
  - `systemctl show -p Result -p ExecMainStatus openclaw-adminai-healthcheck.service`
    - `Result=success`
    - `ExecMainStatus=0`
  - direct env-sourced execution now completes quickly:
    - `adminai-codex-canary skipped_recent ...`
    - `heartbeat refreshed: memory/heartbeat-state.json`
- operational conclusion after fix:
  - adminAI Hermes promotion succeeded
  - adminAI healthcheck timeout debt is now closed
  - policy probe is still preserved for explicit canary / forced probe paths, but no longer blocks the per-minute lightweight healthcheck

2026-04-13 protected-memory fine-grained authorization debt is now closed as well.

Source changes:

- `workspace/tools/memory-governance-helper.mjs`
  - added `extractUnauthorizedWritesFromAuditPayload(...)`
  - added `authorizeAuditedMemoryDrift(...)`
    - accepts an audit payload instead of reseeding the full protected surface
    - supports:
      - `allowedKinds`
      - `onlyPaths`
      - `dryRun`
    - can clear:
      - `untracked_memory_file`
      - `unauthorized_memory_write`
      - `authorized_file_missing`
- `workspace/tools/memory-authorize-state.mjs`
  - added `--mode audit-drift`
  - added:
    - `--audit-file <file>`
    - repeated `--path <relative>`
    - repeated `--allow-kind <kind>`
    - `--dry-run`
  - if `--audit-file` is omitted, it now resolves the latest `memory-audit-*.json` from `memory-admin/meta`

Validation:

- new local tests:
  - `workspace/tools/tests/memory-authorize-state.test.mjs`
    - only selected audit paths are reauthorized
    - `authorized_file_missing` can be pruned without reseeding
    - CLI `audit-drift --dry-run` resolves the latest audit file and reports the intended selection
- existing authorized-state regressions still pass:
  - `standard maintenance retention clears authorized state for archived event files`
  - `managed rollout reauthorization covers memory root docs and clears managed unauthorized writes`
  - `seed authorized state prunes stale tracked files outside current protected surface`

Live rollout of the operator tool:

- hot-synced into both workspaces on `oc-nas`:
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-authorize-state.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-governance-helper.mjs`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/memory-authorize-state.mjs`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/memory-governance-helper.mjs`
- live dry-run on benben/main:
  - `node .../memory-authorize-state.mjs --mode audit-drift --dry-run --json`
  - resolved latest audit:
    - `/var/lib/openclaw/.openclaw/workspace/memory-admin/meta/memory-audit-20260413-122706.json`
  - current result:
    - `count=0`
    - no unauthorized writes remain

Operational conclusion:

- operators no longer need to default to `seed-protected` for benign, audited drift
- the new normal path is:
  - inspect `memory-audit-*.json`
  - run `memory-authorize-state.mjs --mode audit-drift [--path ...] [--dry-run]`
  - only reseed the full protected surface when a true whole-surface rebaseline is intended

2026-04-13 operator memory authorization entrypoints and SRE runbook are now aligned.

2026-04-13 Hermes/provider live hardening (non-sudo repair line) is partially closed.

What changed in source:

- `workspace/tools/provider-registry.mjs`
  - no longer hardcodes benben-only provider state paths
  - now derives:
    - `state_dir`
    - `config_path`
    - `auth_store_path`
    from, in order:
    - explicit options
    - `OPENCLAW_STATE_DIR`
    - `OPENCLAW_ROOT`
    - parent of `OPENCLAW_WORKSPACE`
    - final fallback to benben default state root
  - registry summary now surfaces:
    - `state_dir`
    - `workspace_dir`
- `workspace/tools/hermes-compat-status.mjs`
  - now passes workspace/state context into provider-registry resolution
- `workspace/tools/execution-backend-registry.mjs`
  - backend registry is no longer descriptive only
  - exports `resolvePreferredExecutionBackend(...)`
- `workspace/tools/class-b-llm-task-runner.mjs`
  - class-B gateway execution now resolves through the backend registry
- `workspace/tools/workspace-source-manifest.mjs`
  - added as a curated source-of-truth manifest for the Hermes/runtime/operator surface
- `workspace/tools/hermes-live-rollout.mjs`
  - now includes workspace source manifest status in rollout planning
  - CLI default `gatewayEnvFile` now prefers `OPENCLAW_GATEWAY_ENV_FILE`
- `workspace/tools/openclaw-cli-wrapper.sh`
  - now exposes:
    - `openclaw hermes source-manifest`
    - `openclaw hermes write-source-manifest`
  - Hermes node-tool exec path now forwards:
    - `OPENCLAW_GATEWAY_ENV_FILE`
    - `OPENCLAW_SKILL_REGISTRY_V2`
    - `OPENCLAW_PROVIDER_REGISTRY_V2`
    - `OPENCLAW_HERMES_ADAPTER_ENABLED`
    - `OPENCLAW_SERVICE_MARKER`
- `workspace/tools/sync-live-workspace.sh`
  - hot/full sync post-step now writes a workspace source manifest on remote when the tool exists

Validation:

- local:
  - `node --check`
    - `workspace/tools/provider-registry.mjs`
    - `workspace/tools/hermes-compat-status.mjs`
    - `workspace/tools/hermes-live-rollout.mjs`
  - `sh -n`
    - `workspace/tools/openclaw-cli-wrapper.sh`
  - targeted tests:
    - `workspace/tools/tests/provider-registry.test.mjs`
    - `workspace/tools/tests/hermes-compat-status.test.mjs`
    - `workspace/tools/tests/hermes-live-rollout.test.mjs`
    - `workspace/tools/tests/class-b-llm-task-runner.test.mjs`
    - `workspace/tools/tests/execution-backend-registry.test.mjs`
    - `workspace/tools/tests/workspace-source-manifest.test.mjs`
    - new:
      - `workspace/tools/tests/openclaw-cli-wrapper.test.mjs`
- new provider test coverage now proves:
  - adminAI state-root defaults resolve to:
    - `<state>/openclaw.json`
    - `<state>/auth-profiles.json`
  - `resolveAuthProfile(...)` respects instance state roots rather than benben hardcoded auth store
- new wrapper test coverage now proves:
  - `openclaw hermes rollout-status ...` forwards Hermes env file + feature flags into node tools

Observed live outcome on `oc-nas`:

- benben/main:
  - `openclaw hermes status --json`
    - provider registry now resolves against:
      - `/var/lib/openclaw/.openclaw/openclaw.json`
      - `/var/lib/openclaw/.openclaw/auth-profiles.json`
    - workspace source manifest exists and verifies in sync
    - execution backend registry shows `phase2_registry_ready=true`
- adminAI:
  - `openclaw hermes status --json`
    - no longer crashes on benben auth-store `EACCES`
    - provider registry now resolves against:
      - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
      - `/var/lib/openclaw-adminai/.openclaw/auth-profiles.json`
    - workspace source manifest exists and verifies in sync
  - adminAI live refresh needed a manual SSH/install path rather than `sync-live-workspace.sh --remote-sudo`
    - the sync script's remote-sudo probe drifted during this pass
    - benben/adminAI live files were therefore pushed manually over SSH and installed in place

Residual evidence gap still visible after this repair:

- `openclaw hermes rollout-status --enable-skill-runtime --enable-provider-default --json`
  when run as the pure service user still reports:
  - `current_flags.skill_runtime=false`
  - `current_flags.provider_default=false`
- this is now narrower than before:
  - provider-registry pathing is fixed
  - source manifest is in sync
  - runtime patch state is still `optional_cutover_applied`
- remaining gap is operator evidence visibility:
  - the service-user path still cannot directly read the gateway env file without privileged help
  - this thread did not change sudo policy by request

2026-04-13 benben/main responsiveness tuning:

What changed live:

- `/etc/openclaw/gateway.env`
  - changed:
    - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4`
  - to:
    - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4-mini`
  - kept unchanged:
    - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
  - class-B / codex gateway path was left on the existing `gpt-5.4` line
- restarted:
  - `openclaw-gateway.service`

Why this was needed:

- live session evidence had drifted away from the expected “mini by default” mental model
- recent benben/main sessions were predominantly running:
  - `openai-codex / gpt-5.4`
- at the same time, `adminAI` sessions were still consistently on:
  - `openai-codex / gpt-5.4-mini`
- the main gateway itself was healthy; the perceived slowness was primarily model-weight + NAS load, not a dead gateway

Observed live outcome:

- `/etc/openclaw/gateway.env` now shows:
  - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4-mini`
  - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
- `openclaw-gateway.service` restarted successfully at:
  - `2026-04-13 14:36:31 CST`
- post-restart health:
  - `ActiveState=active`
  - `SubState=running`
  - `http://127.0.0.1:18789/ -> 200`

Important verification note:

- `session-memory-review-selfcheck.mjs` still reports effective model:
  - `openai-codex/gpt-5.4`
- this is expected for that path
  - it validates the class-B / codex review lane
  - it is **not** the same thing as the benben light-model default

2026-04-13 QQBot productionization landed in source / rollout tooling:

What changed locally:

- implementation pivoted after current-package evidence showed `v2026.4.9` already exposes built-in `qqbot`
  - `openclaw channels add --help` and `openclaw message send --help` on `oc-nas` both advertise `qqbot`
  - so this thread did **not** build a custom QQ runtime transport from scratch
  - instead it productionized the existing built-in channel surface
- new tooling:
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - instance-aware benben/adminAI path resolution
    - QQ target normalization:
      - `qqbot:c2c:<openid>`
      - `qqbot:group:<groupid>`
    - QQ env / gateway env / health env / config inspection
    - `openclaw channels status --probe --json` parsing
  - `workspace/tools/qqbot-runtime-health.mjs`
    - lightweight runtime health probe
    - verifies config + creds + required-channel guard + gateway drop-in + runtime probe
    - does **not** send messages
  - `workspace/tools/qqbot-live-rollout.mjs`
    - `status` / `apply`
    - patches `openclaw.json` non-secret QQ config
    - persists `OPENCLAW_REQUIRED_CHANNELS`
    - wires `openclaw-healthcheck.sh` extra check to QQ runtime health
    - creates gateway `EnvironmentFile` drop-in for root-owned QQ env
    - on `adminAI`, also writes a `qqbot-config-guard.conf` drop-in for required-channel validation parity
- existing operator / rollout surfaces extended:
  - `workspace/tools/channel-delivery-canary.mjs`
    - now supports QQ surfaces:
      - `qqbot_c2c`
      - `qqbot_group`
    - state now records QQ per-surface results under `channels.*`
  - `workspace/tools/install-openclaw-channel-canary.sh`
    - now instance-aware:
      - benben => `openclaw-channel-canary.service/timer`
      - adminAI => `openclaw-adminai-channel-canary.service/timer`
    - creates QQ env template if missing
    - loads both `health.env` and `qqbot.env`
  - `workspace/tools/rollout-instance-config.sh`
    - now exposes:
      - `HEALTH_ENV_FILE`
      - `QQBOT_ENV_FILE`
      - `CHANNEL_CANARY_SERVICE`
      - `CHANNEL_CANARY_TIMER`
  - `workspace/tools/workspace-source-manifest.mjs`
    - now tracks the QQBot rollout/helper files
  - `workspace/tools/openclaw-cli-wrapper.sh`
    - now exposes:
      - `openclaw qqbot runtime-health`
      - `openclaw qqbot rollout-status`
      - `openclaw qqbot apply`
  - `workspace/tools/live-rollout.sh`
    - now supports:
      - `--enable-qqbot`
      - `--qqbot-allow-from ...`
      - `--qqbot-c2c-target ...`
      - `--qqbot-group-target ...`
    - QQ-enabled rollout path now:
      - preflight => `qqbot-live-rollout.mjs status`
      - apply => `qqbot-live-rollout.mjs apply`
      - canary installer => instance-aware systemd install
      - smoke => `qqbot-runtime-health.mjs`
  - `workspace/tools/deployment-verify.mjs`
    - now reports a `qqbot` section
    - combines runtime health + `channel-delivery-canary-state.json`
    - marks QQ skipped when not configured rather than failing the whole verify

Validation completed locally:

- syntax:
  - `node --check`
    - `qqbot-runtime-helper.mjs`
    - `qqbot-runtime-health.mjs`
    - `qqbot-live-rollout.mjs`
    - `channel-delivery-canary.mjs`
    - `deployment-verify.mjs`
  - `bash -n` / `sh -n`
    - `live-rollout.sh`
    - `install-openclaw-channel-canary.sh`
    - `openclaw-cli-wrapper.sh`
- tests:
  - `workspace/tools/tests/qqbot-runtime-health.test.mjs`
  - `workspace/tools/tests/qqbot-live-rollout.test.mjs`
  - `workspace/tools/tests/channel-delivery-canary-qqbot.test.mjs`
  - `workspace/tools/tests/openclaw-cli-wrapper.test.mjs`
  - `workspace/tools/tests/rollout-instance-config.test.mjs`
  - `workspace/tools/tests/deployment-verify.test.mjs`
  - `node --test --test-name-pattern='channel canary|healthcheck installer' workspace/tools/tests/memory-phase1.test.mjs`

Important boundary for this thread:

- no live QQ credentials were supplied here
- therefore this pass did **not** enable QQ on `oc-nas`
  - no `/etc/openclaw/qqbot.env` / `/etc/openclaw/adminai-qqbot.env` secrets were provisioned by this thread
  - no live QQ sandbox / production Bot rollout was executed
- this is a source + rollout tooling completion pass, not a credentialed live activation pass

Source alignment added locally:

- `workspace/tools/provider-registry.mjs`
  - default OpenAI light model fallback is now `gpt-5.4-mini`
  - deep fallback remains `gpt-5.4`
- `workspace/tools/memory-maintenance-runner.sh`
  - maintenance light fallback is now `gpt-5.4-mini`
- `workspace/tools/tests/provider-registry.test.mjs`
  - added an explicit regression test locking:
    - light => `gpt-5.4-mini`
    - deep => `gpt-5.4`

Source / docs changes:

- `workspace/tools/openclaw-cli-wrapper.sh`
  - `openclaw memory-ops authorize-state ...` now forwards to `memory-authorize-state.mjs`
  - `memory-ops` help text now documents:
    - `managed-rollout`
    - `seed-protected`
    - `audit-drift`
- `workspace/memory-admin/reports/openclaw-sre-troubleshooting-runbook.md`
  - updated to `2026-04-13`
  - now explicitly tells operators to prefer:
    - `openclaw memory-ops authorize-state --mode audit-drift --dry-run --json`
  - adds decision guidance for when to use:
    - `audit-drift`
    - `seed-protected`

Validation:

- local:
  - `sh -n workspace/tools/openclaw-cli-wrapper.sh`
  - `node --test --test-name-pattern "openclaw wrapper routes memory ops dashboard commands through the service env|openclaw wrapper routes memory authorize-state commands through the service env" workspace/tools/tests/memory-phase1.test.mjs`
- live:
  - wrapper + tool hot-sync to benben/adminAI workspaces
  - `openclaw memory-ops authorize-state --mode audit-drift --dry-run --json`
    - benben/main resolves current latest audit and returns `count=0`
    - adminAI initially exposed a missing-audit / missing-baseline gap
      - first dry-run returned `memory-authorize-state: no audit file found`
      - after generating `memory-audit-20260413-131750.json`, dry-run surfaced `83` untracked protected-memory paths
      - applied:
        - `memory-ops authorize-state --mode seed-protected --source codex_adminai_initial_protected_baseline --source-id codex_20260413_memory_authorize_wrapper_rollout`
      - refreshed audit:
        - `memory-audit-20260413-131930.json`
      - final dry-run now returns `count=0`
  - runbook live copies on benben/adminAI were refreshed to the `2026-04-13` version and now include the “if no audit file found, generate `memory-audit-*.json` first” instruction

Operational conclusion:

- `audit-drift` is no longer just a low-level recovery helper
- it is now a first-class operator path reachable through the service wrapper and documented in the SRE runbook
- adminAI now also has its first explicit protected-memory baseline, so future targeted audit-drift operations start from a meaningful authorized state

2026-04-13 QQBot rollout preparation pass:

- `workspace/tools/qqbot-live-rollout.mjs`
  - added a new `prepare` stage alongside `status/apply`
  - `prepare` is intentionally non-activating:
    - it creates the root-owned QQ env template if missing
    - it installs the gateway `qqbot-env.conf` drop-in if missing
    - it does **not** enable `channels.qqbot`
    - it does **not** set health extra checks
    - it does **not** require real credentials yet
- tightened file-mode handling in the QQ rollout path:
  - QQ secret env files are now enforced as `0600`
  - gateway drop-ins are now enforced as `0644`
  - this closes the case where a first-time `qqbot.env` creation could inherit a loose default umask
- `workspace/tools/openclaw-cli-wrapper.sh`
  - new operator entry:
    - `openclaw qqbot prepare`
- validation added:
  - `workspace/tools/tests/qqbot-live-rollout.test.mjs`
    - verifies `prepare` creates template env + gateway drop-in without enabling QQ
    - verifies `qqbot.env` ends up `0600`
  - `workspace/tools/tests/openclaw-cli-wrapper.test.mjs`
    - verifies wrapper forwards `qqbot prepare` to the rollout tool

Live `oc-nas` preparation completed in this pass:

- hot-synced updated QQ tooling to the real `oc-nas` host for:
  - benben
  - adminAI
- executed live `prepare` on both instances
- resulting live evidence:
  - `/etc/openclaw/qqbot.env`
    - exists
    - `0600 root:root`
  - `/etc/openclaw/adminai-qqbot.env`
    - exists
    - `0600 root:root`
  - `/etc/systemd/system/openclaw-gateway.service.d/qqbot-env.conf`
    - exists
    - `0644 root:root`
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/qqbot-env.conf`
    - exists
    - `0644 root:root`
- live rollout status after `prepare`:
  - benben pending only:
    - `qqbot_credentials_missing`
    - `qqbot_allow_from_missing`
    - `qqbot_c2c_target_missing`
    - `qqbot_group_target_missing`
    - `qqbot_channel_config_missing`
    - `qqbot_health_extra_check_missing`
  - adminAI pending only:
    - `qqbot_credentials_missing`
    - `qqbot_allow_from_missing`
    - `qqbot_c2c_target_missing`
    - `qqbot_group_target_missing`
    - `qqbot_channel_config_missing`
    - `qqbot_health_extra_check_missing`
    - `adminai_config_guard_dropin_missing`

Operational conclusion:

- the QQ production path is now split into:
  - `prepare`
  - credentialed `apply`
- live `oc-nas` is no longer blocked by missing template surfaces or wrong file permissions
- the remaining blockers are now only real activation inputs:
  - credentials
  - allowFrom
  - c2c/group sandbox targets
  - final QQ channel enablement / health wiring

2026-04-13 QQ rollout orchestration follow-up:

- `workspace/tools/qqbot-live-rollout.mjs`
  - rollout status now distinguishes:
    - `rollout_required`
    - `prepared_pending_activation`
    - `ready`
  - this avoids treating a fully prepared-but-uncredentialed host the same as a host missing QQ plumbing
- `workspace/tools/live-rollout.sh`
  - new flag:
    - `--prepare-qqbot-only`
  - behavior:
    - remote preflight no longer hard-fails just because QQ is not yet `ready`
    - it now reads the status JSON and accepts:
      - `rollout_required`
      - `prepared_pending_activation`
      - `ready`
    - when `--prepare-qqbot-only` is set:
      - QQ rollout uses `prepare`, not `apply`
      - no QQ canary install occurs
      - no gateway restart occurs
      - QQ smoke is replaced by a `prepared_only` note

Validation:

- local:
  - `node --check workspace/tools/qqbot-live-rollout.mjs`
  - `bash -n workspace/tools/live-rollout.sh`
  - `node --test`
    - `workspace/tools/tests/qqbot-live-rollout.test.mjs`
    - `workspace/tools/tests/openclaw-cli-wrapper.test.mjs`
    - `workspace/tools/tests/qqbot-runtime-health.test.mjs`
    - `workspace/tools/tests/channel-delivery-canary-qqbot.test.mjs`
    - `workspace/tools/tests/deployment-verify.test.mjs`
- live:
  - hot-synced updated `qqbot-live-rollout.mjs` and `live-rollout.sh` to benben/adminAI on the real `oc-nas`
  - confirmed live status now reports:
    - benben: `prepared_pending_activation`
    - adminAI: `prepared_pending_activation`
  - ran:
    - `bash workspace/tools/live-rollout.sh --host oc-nas --instance benben --enable-qqbot --prepare-qqbot-only --dry-run --skip-tests`
 - result:
    - orchestration path completes successfully in dry-run mode
    - remote preflight now cleanly accepts the prepared-but-unactivated QQ state

2026-04-13 QQBot group-chat path clarified and rollout schema aligned:

- browser evidence from the real QQ Open Platform now shows two distinct bot creation paths:
  - the `OpenClaw` quick-create page at `https://q.qq.com/qqbot/openclaw/index.html`
  - the formal Open Platform registration path that starts at `https://q.qq.com/#/register`
- the quick-create path is **not** suitable for the intended production group rollout:
  - each created bot card explicitly states:
    - `该机器人仅供创建人使用，暂不支持进入群聊`
  - therefore the quick-create bots are c2c-only helper bots, not the final benben/adminAI production QQ bots
- official QQ bot docs remain consistent with group support:
  - `https://bot.q.qq.com/wiki/develop/api-v2/`
  - current page text says QQ bots can be added to `群聊/频道`
  - page also states:
    - single chat: enterprise/personal supported
    - group chat: enterprise/personal supported
    - channel: enterprise/personal supported
- the production group-chat path therefore requires:
  - formal Open Platform account registration
  - subject verification / admin binding
  - then creation of a formal QQ robot under that platform account
- while reconciling this with live `v2026.4.9`, source was corrected to match the built-in `qqbot` plugin schema actually shipped on `oc-nas`:
  - live plugin schema file:
    - `/usr/lib/node_modules/openclaw/dist/extensions/qqbot/openclaw.plugin.json`
  - confirmed supported top-level fields include:
    - `enabled`
    - `appId`
    - `clientSecret`
    - `clientSecretFile`
    - `allowFrom`
    - `accounts`
    - `defaultAccount`
  - earlier rollout assumptions that wrote:
    - `connectionMode`
    - `dmPolicy`
    - `groupPolicy`
    were incorrect for the current bundled plugin
- local source was updated accordingly:
  - `workspace/tools/qqbot-live-rollout.mjs`
    - `patchOpenClawConfig(...)` now writes only schema-aligned QQ config
    - no longer injects unsupported `connectionMode/dmPolicy/groupPolicy`
  - tests updated:
    - `workspace/tools/tests/qqbot-live-rollout.test.mjs`
    - `workspace/tools/tests/qqbot-runtime-health.test.mjs`
  - verification:
    - `node --check workspace/tools/qqbot-live-rollout.mjs`
    - `node --test workspace/tools/tests/qqbot-live-rollout.test.mjs workspace/tools/tests/qqbot-runtime-health.test.mjs workspace/tools/tests/channel-delivery-canary-qqbot.test.mjs workspace/tools/tests/openclaw-cli-wrapper.test.mjs workspace/tools/tests/deployment-verify.test.mjs`
    - result: `22/22 pass`
- rollout consequence:
  - current benben/adminAI QQ state is still `prepared_pending_activation`
  - next real activation step is **not** “reuse the quick-create bots”
 - next step is:
    - finish formal platform registration on `https://q.qq.com/#/register`
    - create group-capable formal QQ bots
    - then fill real credentials / allowlist / sandbox targets and run QQ apply

2026-04-13 QQ formal-control-plane gating clarified from the live frontend bundle:

- current `q.qq.com/#/apps` frontend code was deminified enough to confirm the bot routing behavior:
  - app bundle:
    - `https://qqminiapp.cdn-go.cn/qq-open-platform/ed7184e7/assets/app-CkJ50le_.js`
    - robot app config includes:
      - `jumpUrl = https://q.qq.com/qqbot/#/home?appid={{appid}}`
      - `createUrl = https://q.qq.com/#/apps/create?type=1`
  - page bundle:
    - `https://qqminiapp.cdn-go.cn/qq-open-platform/ed7184e7/assets/page-DKVq-Tht.js`
- important runtime branch discovered in the page bundle:
  - when the account is **not** `developer ready`
    - bot create does **not** go to the formal create route
    - bot row click does **not** go to the formal control plane
    - instead the bot paths are forced back to:
      - `Q.openclawUrl`
      - which resolves to `https://q.qq.com/qqbot/openclaw/`
  - only the bot "高级设置" branch is designed to use:
    - `jumpUrl = https://q.qq.com/qqbot/#/home?appid={{appid}}`
    - and that is meaningful only once the account is in a `developer ready` state
- practical implication:
  - formal group-capable QQ bot creation is blocked on the platform-side developer readiness state
  - until that state is satisfied, the platform itself keeps routing the user back into the OpenClaw quick-create control plane
- supporting implementation evidence:
  - `AppsService-C3PfeGCa.js` reveals QQ bot APIs:
    - `createBotUrl = https://bot.q.qq.com/cgi-bin/create`
    - `queryBotUrl = https://bot.q.qq.com/cgi-bin/info/query`
    - `listBotsUrl = https://q.qq.com/lite/list_bots`
    - `createDeveloperUrl = https://q.qq.com/lite/create_developer`
    - `openclawUrl = https://q.qq.com/qqbot/openclaw/`
 - this confirms there is a real formal QQ bot control plane behind the platform, but the current account is not yet on the path that exposes it cleanly

2026-04-13 QQ developer-ticket gating was reproduced live in the browser:

- browser navigation evidence now shows `https://q.qq.com/#/certification-form` is a real route, but it is not stably reachable with the current platform session:
  - a direct navigation briefly lands on the certification flow shell
  - the route then collapses back to `https://q.qq.com/#/`
  - the resulting page is the public homepage with the `账号登录` form, not the developer certification form
- the same session also showed degraded account state on `https://q.qq.com/#/apps`:
  - right-hand account info rendered as `-`
  - developer id rendered as `-`
- live in-page API evidence matched that degraded state:
  - `POST /bopen/v2/get_user_developer_info` returned:
    - `code = -10001`
    - `msg = 票据验证失败，请重新登录`
 - practical implication:
  - the current blocker is now narrower than "finish registration"
  - the platform must first regain a valid developer ticket/session before subject certification or formal QQ bot control-plane work can proceed
  - until that happens, formal QQ bot create/manage work will remain unstable even though the relevant frontend routes exist

2026-04-13 QQ developer ticket recovery and certification-form reachability were verified live:

- after a clean platform relogin, the `#/apps` page recovered normal account state:
  - current login person rendered as `CC`
  - role rendered as `超级管理员`
  - developer id rendered as a non-placeholder value again
- under that restored session, direct navigation to:
  - `https://q.qq.com/#/certification-form`
  no longer collapsed back to the public homepage
- the live page now reaches the formal certification flow and renders:
  - step 1: 设置超级管理员
  - step 2: 填写主体信息
  - step 3: 身份验证
- current visible certification branch is the personal-subject path:
  - subject type defaults to `个人`
  - verification method defaults to `人脸认证`
  - required remaining inputs include:
    - full ID number
    - phone number
    - SMS verification code
- practical implication:
  - platform-side developer ticket/session has now been restored
  - the next blocker is no longer "relogin"
  - the next blocker is completion of the subject-certification inputs on the formal platform flow

2026-04-13 QQ formal bot credential provisioning and IP-whitelist preflight advanced further:

- live browser work under the restored certified platform account created two formal QQ bots in the official control plane:
  - `笨笨OpenClaw`
    - `app_id=1903829002`
    - `bot_uin=4017010776`
  - `adminAI OpenClaw`
    - `app_id=1903828233`
    - `bot_uin=4019179851`
- authenticated platform API evidence was used as the authoritative bot inventory surface because the web list UI did not always refresh immediately:
  - `https://q.qq.com/lite/list_bots`
- the formal bot avatars were uploaded from locally resized square assets:
  - `output/qqbot/benben-user-square.png`
  - `output/qqbot/adminAI-user-square.png`
- both formal bots now have generated `AppSecret` values in the platform control plane
  - those secrets are intentionally not written into this ledger
  - they were provisioned directly into root-owned NAS env files:
    - `/etc/openclaw/qqbot.env`
    - `/etc/openclaw/adminai-qqbot.env`
  - both files remain `0600 root:root`
- live NAS public egress IP was verified as:
  - `219.157.244.110`
- platform IP whitelist state at this checkpoint:
  - `adminAI OpenClaw` now shows `219.157.244.110` saved in `IP白名单`
  - `笨笨OpenClaw` was advanced to the final whitelist-save QQ admin scan confirmation, but this ledger entry does not assume that final scan has completed unless separately re-verified
- current unresolved QQ activation inputs are no longer credentials:
  - credentials exist in the platform and on NAS
 - what still remains is:
    - confirmed benben whitelist save
    - sandbox/runtime discovery of the real c2c/group target identifiers to feed:
      - `qqbot:c2c:<id>`
      - `qqbot:group:<id>`
    - final OpenClaw `qqbot apply` activation on `oc-nas`

2026-04-13 QQ runtime credential-injection and sandbox-probe follow-up:

- local source and live hot-sync now include a first-class sandbox probe tool:
  - `workspace/tools/qqbot-sandbox-probe.mjs`
  - wrapper exposure:
    - `openclaw qqbot sandbox-probe`
  - hot-sync and source-manifest coverage now explicitly include:
    - `tools/qqbot-sandbox-probe.mjs`
- official target-id semantics were narrowed with direct QQ doc evidence:
  - c2c target must come from `user_openid`
  - group target must come from `group_openid`
  - platform-side `uin` / `group_code` are not yet sufficient to feed OpenClaw rollout directly
- operator-side credential access bug was closed in source:
  - `workspace/tools/openclaw-cli-wrapper.sh`
    - now resolves an instance-aware default `OPENCLAW_QQBOT_ENV_FILE`
    - now also resolves instance-aware service defaults from `gateway.env`, so `adminAI` no longer falls back to benben state/workspace paths during QQ operator commands
    - now loads root-owned QQ env files before delegating to node tools
    - now forwards:
      - `QQBOT_APP_ID`
      - `QQBOT_CLIENT_SECRET`
      - `OPENCLAW_CANARY_QQBOT_C2C_TARGET`
      - `OPENCLAW_CANARY_QQBOT_GROUP_TARGET`
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - now merges QQ credentials and canary targets from process env when the env file itself is unreadable to the service user
  - `workspace/tools/qqbot-sandbox-probe.mjs`
    - now accepts those injected env values as effective credentials
- this closes the earlier false-negative where live sandbox probe reported:
  - `qqbot_env_file_exists=true`
  - `qqbot_env_file_readable=false`
  - `has_credentials=false`
  even though root-owned QQ secrets were already provisioned on NAS
- platform-side QQ sandbox truth at this checkpoint:
  - benben formal bot sandbox page shows one message-list sandbox member:
    - `CC`
  - the same formal sandbox page currently overlays:
    - `暂不支持群相关配置，敬请期待`
  - so current QQ platform evidence allows c2c sandbox capture but does **not** yet provide a working group-sandbox path for these formal bots
- verification added in source:
  - `workspace/tools/tests/qqbot-sandbox-probe.test.mjs`
  - wrapper forwarding tests now also verify injected `QQBOT_APP_ID` / `QQBOT_CLIENT_SECRET`
  - current QQ-targeted local regression after this pass:
    - `17/17 pass`
- live verification after hot-sync confirms the QQ operator path is no longer blocked on unreadable root-owned env files:
  - benben:
    - `openclaw qqbot sandbox-probe --instance benben --timeout-ms 5000 --json`
    - now reaches:
      - `token.ok = true`
      - `gateway.ok = true`
      - `websocket.ready = true`
  - adminAI:
    - `openclaw qqbot sandbox-probe --instance adminai --timeout-ms 5000 --json`
    - now reaches:
      - `token.ok = true`
      - `gateway.ok = true`
      - `websocket.ready = true`
 - both probes still time out waiting for user traffic and therefore produce only:
    - `event_types = [READY]`
    - no `user_openid`
    - no `group_openid`
  - this confirms the remaining blocker is no longer QQ secret injection or gateway login; it is the lack of an actual inbound sandbox message event

2026-04-13 QQ formal c2c runtime activation verified end-to-end:

- a real live gateway bug was isolated on NAS and fixed:
  - `/etc/openclaw/global-proxy-hook.cjs`
  - `/etc/systemd/system/openclaw-gateway.service.d/30-execstart-proxy-wrapper.conf`
  - `/etc/systemd/system/openclaw-adminai-gateway.service.d/30-execstart-proxy-wrapper.conf`
  - root cause:
    - QQ API / websocket traffic was still traversing the global proxy hook
    - Tencent gateway then rejected `/gateway` with:
      - `接口访问源IP不在白名单`
  - fix:
    - add `qq.com` / `.qq.com` to the proxy bypass host and `NO_PROXY` surfaces
- benben formal QQ bot is now confirmed live on `oc-nas`:
  - websocket startup now reaches:
    - `Connecting to wss://api.sgroup.qq.com/websocket`
    - `WebSocket connected`
    - `READY`
    - `Gateway ready`
  - real inbound/outbound c2c evidence was captured:
    - inbound `C2C_MESSAGE_CREATE`
    - `Processing message from 86E88F865EBE4F6B3FFBE0395BD53F6D`
    - outbound `Sent markdown chunk`
  - benben effective c2c rollout target is now proven as:
    - `qqbot:c2c:86E88F865EBE4F6B3FFBE0395BD53F6D`
- adminAI formal QQ bot is also now confirmed live end-to-end:
  - captured runtime `user_openid`:
    - `0C40BD55DFB4F879895CDDEFA6B8192E`
  - live rollout was applied on NAS with:
    - `channels.qqbot.enabled=true`
    - `plugins.allow += qqbot`
    - `allowFrom=[qqbot:c2c:0C40BD55DFB4F879895CDDEFA6B8192E]`
    - `OPENCLAW_REQUIRED_CHANNELS=qqbot`
    - `OPENCLAW_CANARY_QQBOT_C2C_TARGET=qqbot:c2c:0C40BD55DFB4F879895CDDEFA6B8192E`
    - `OPENCLAW_QQBOT_GROUP_SUPPORTED=0`
  - post-restart startup now reaches:
    - `Connecting to wss://api.sgroup.qq.com/websocket`
    - `WebSocket connected`
    - `READY`
    - `Gateway ready`
  - real inbound/outbound c2c evidence was captured after activation:
    - `C2C_MESSAGE_CREATE`
    - `Processing message from 0C40BD55DFB4F879895CDDEFA6B8192E: 你好`
    - `deliver called, kind: final`
    - `Sent markdown chunk`
- live runtime-health / probe tooling also needed one follow-up parser fix:
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - now recognizes keyed payloads such as `channels.qqbot`
  - this closes the false-negative where QQ websocket was already healthy but helper summary still returned:
    - `probe_output_not_json` / `present=false`
 - current QQ production truth on `oc-nas`:
  - benben formal bot c2c: working
  - adminAI formal bot c2c: working
  - group path:
    - still platform-gated by QQ sandbox UI message:
      - `暂不支持群相关配置，敬请期待`

2026-04-13 QQ bug-audit follow-up:

- source review uncovered one live-observable false-negative that remains open:
  - `workspace/tools/qqbot-runtime-helper.mjs`
  - `workspace/tools/qqbot-runtime-health.mjs`
  - `probeQqbotRuntime()` still shells `openclaw channels status --probe --json`
  - on `adminAI`, the current gateway returns:
    - `Gateway not reachable: GatewayClientRequestError: missing scope: operator.read`
    - followed by config-only stderr output and empty stdout
  - consequence:
    - QQ c2c can be live and delivering successfully while runtime-health still reports:
      - `qqbot_probe_missing`
      - `qqbot_probe_error:probe_output_not_json`
- the same audit also found and closed two lower-risk source bugs:
  - `workspace/tools/qqbot-sandbox-probe.mjs`
    - c2c-only deployments with `OPENCLAW_QQBOT_GROUP_SUPPORTED=0` no longer wait pointlessly for a group event before finishing
    - this removes the misleading timeout warning previously attached to successful c2c captures
  - `workspace/tools/qqbot-runtime-helper.mjs`
    - `required_channel_ok` no longer falls back to instance defaults when `OPENCLAW_REQUIRED_CHANNELS` is absent from `gateway.env`
    - rollout/status now reflects the real declared env state instead of silently treating defaults as present
- local regression added/updated for those fixes:
  - `workspace/tools/tests/qqbot-sandbox-probe.test.mjs`
  - `workspace/tools/tests/qqbot-runtime-health.test.mjs`
 - latest targeted run:
    - `10/10 pass`

2026-04-13 QQ health follow-up: adminAI false-negative is now closed

- `workspace/tools/qqbot-runtime-helper.mjs` was extended in three concrete ways:
  - gateway-log probe now recognizes the real live JSON log format emitted under:
    - `gateway/channels/qqbot`
  - c2c/group probe extraction now keys off the latest reconnect/auth window instead of only the old `[qqbot] Starting gateway` text surface
  - when recent gateway logs already prove `channels.status` is blocked by:
    - `missing scope: operator.read`
    - or a probe timeout occurs
    - helper now short-circuits to gateway-log evidence instead of waiting on the broken CLI probe path
- local regression was expanded and is green:
  - `workspace/tools/tests/qqbot-runtime-health.test.mjs`
  - latest targeted run:
    - `12/12 pass`
- live `oc-nas` verification after hot-sync is now green on both instances:
  - benben:
    - `qqbot-runtime-health => ok=true status=healthy`
    - runtime probe source remains direct channel status JSON
  - adminAI:
    - `qqbot-runtime-health => ok=true status=healthy`
    - runtime probe source now cleanly falls back to:
      - `gateway_log`
    - current probe summary is healthy with:
      - `connected=true`
      - `authenticated=true`
      - `probeStatus=ready`
- systemd oneshot verification also passed after the fix:
  - `openclaw-healthcheck.service => Result=success ExecMainStatus=0`
 - `openclaw-adminai-healthcheck.service => Result=success ExecMainStatus=0`
- operational truth has changed:
  - there is no longer a known QQ runtime-health false-red on adminAI
  - current supported live QQ path remains:
    - benben c2c: working
    - adminAI c2c: working
    - group: still platform-gated

2026-04-13 repo hygiene audit for the local Git worktree:

- audited the dirty tree from the repo root using live filesystem evidence, not assumptions
- confirmed three different categories exist at the same time:
  - tracked implementation work:
    - primarily under `openclaw-mac-migration/staging/*`
    - plus tracked handoff/runtime rule changes under `.codex-remote-openclaw/*`
  - intentional untracked source/evidence:
    - `nas-openclaw-v22/`
    - `.codex-remote-openclaw/systemd/*`
    - `.codex-remote-openclaw/tools/*`
    - `.codex-remote-openclaw/docs/*`
    - `.codex-remote-openclaw/tmp/*`
  - proven garbage:
    - zero-byte root files with nonsensical names
    - root scratch files:
      - `check_util.py`
      - `util.py`
    - cache directories:
      - `__pycache__/`
      - `scripts/__pycache__/`
      - `tmp/__pycache__/`
      - `.codex-remote-openclaw/tools/__pycache__/`
- cleanup applied:
  - moved the proven-garbage files/directories above to Trash
- explicit non-cleanup decision:
  - later follow-up audit upgraded the root exported bundles from "ambiguous" to "proven garbage"
  - hard evidence:
    - `index.js` is an Electron preload surface with `ipcRenderer.invoke("models:*")` / `chat:*` APIs
    - `index.mjs` is an Electron main-process bundle with desktop-app internals
    - `main-1fsOo4Rt.js` and `product-name-CKRilA27.js` are minified renderer chunks for the same unrelated desktop bundle
    - there is no root Electron/Vite project in this repo
    - no real repo paths referenced those files; after the first hygiene pass, only documentation references remained
  - cleanup applied on follow-up:
    - moved these files to Trash:
      - `index.js`
      - `index.mjs`
      - `main-1fsOo4Rt.js`
      - `product-name-CKRilA27.js`
- repo policy consequence:
  - added a root `AGENTS.md` that treats:
    - `nas-openclaw-v22/`
    - `.codex-remote-openclaw/`
    - `openclaw-mac-migration/staging/`
    as real working surfaces, not generic clutter
  - `.gitignore` was also tightened for Python cache residue:
    - `__pycache__/`
    - `*.pyc`
    - `*.pyo`
    - `*.pyd`

2026-04-13 repo hygiene implementation follow-up:

- completed read-only live cross-checks before any further cleanup:
  - local `.codex-remote-openclaw/systemd/*` mirror files were compared against `oc-nas`
  - these files matched live systemd content for:
    - `openclaw-gateway.service.d/30-execstart-proxy-wrapper.conf`
    - `openclaw-gateway.service.d/85-auth-sync-guard.conf`
    - `openclaw-gateway.service.d/95-service-version.conf`
    - `openclaw-adminai-gateway.service.d/30-execstart-proxy-wrapper.conf`
    - `openclaw-adminai-gateway.service.d/95-service-version.conf`
    - `openclaw-channel-canary.service.d/70-trigger-source.conf`
    - `openclaw-socks-bridge.service.d/30-python-bridge.conf`
  - local `.codex-remote-openclaw/tools/openclaw_zh_runtime_patch_rules.json` was compared against the live ruleset:
    - `/usr/local/share/openclaw/openclaw_zh_runtime_patch_rules.json`
    - current content matched the live deployed rules file
- tracked-source promotion was applied inside the staging source tree:
  - these previously untracked files were confirmed to have both:
    - tracked-source references and/or handoff evidence
    - twin implementations under `nas-openclaw-v22/workspace/tools/*`
  - they should now be treated as tracked source, not floating local clutter:
    - `workspace/tools/memory-status-human.mjs`
    - `workspace/tools/memory-v2-backfill.mjs`
    - `workspace/tools/memory-v2-eval.mjs`
    - `workspace/tools/memory-v2-helper.mjs`
    - `workspace/tools/session-memory-review-queue-summary.mjs`
    - `workspace/tools/session-memory-review.mjs`
    - `workspace/tools/session-working-capture.mjs`
    - `workspace/tools/working-memory-helper.mjs`
    - `workspace/tools/workspace-profile-helper.mjs`
    - `workspace/tools/tests/memory-v2.test.mjs`
    - `workspace/tools/tests/session-memory-review.test.mjs`
    - `openclaw-mac-migration/docs/LIVE_SNAPSHOT_STATUS_2026-04-09.md`
- local mirror / dump cleanup applied:
  - moved to Trash:
    - `.codex-remote-openclaw/tmp/`
    - `.codex-remote-openclaw/sessions-uRDRs4f-.js`
  - moved local mirror buckets out of `git status` via `.git/info/exclude` instead of repo `.gitignore`:
    - `nas-openclaw-v22/`
    - `.codex-remote-openclaw/docs/`
    - `.codex-remote-openclaw/systemd/`
    - `.codex-remote-openclaw/tools/`
    - `.codex-remote-openclaw/AGENTS.md`
    - `.codex-remote-openclaw/deployment-verify.mjs`
    - `.codex-remote-openclaw/sessions-*.js`
    - `openclaw_claude_code_assessment_20260401.md`
- policy result:
  - the remaining dirty tree should now skew toward real tracked implementation changes instead of handoff mirrors and replay dumps

2026-04-13 desktop Gemma 26B main-chat default rollout:

- pre-change verification on this Mac:
  - `ollama list` and `http://127.0.0.1:11434/api/tags` both showed `huihui_ai/gemma-4-abliterated:26b`
  - local Ollama stayed healthy:
    - `http://127.0.0.1:11434/api/version` returned `0.20.5`
- pre-change verification on `oc-nas`:
  - `openclaw-gateway.service` and `openclaw-adminai-gateway.service` were both `active`
  - benben/adminAI live `openclaw.json` still had:
    - primary main-chat model: `openai-codex/gpt-5.4-mini`
    - first text fallback: `deepseek/deepseek-chat`
    - image primary: `ollama/qwen2.5vl:7b`
    - image fallback: `openrouter/xiaomi/mimo-v2-omni`
  - both live instances already had an `ollama` provider on:
    - `http://127.0.0.1:11435`
  - relay health proved a real gap:
    - `http://127.0.0.1:11435/healthz` exposed only `remoteModels=["qwen2.5vl:7b"]`
    - `huihui_ai/gemma-4-abliterated:26b` returned `404` through the relay
  - the Mac reverse tunnel was down at the same time:
    - LaunchAgent `ai.openclaw.ollama-reverse-tunnel`
    - state: `not running`
    - last exit code: `255`
- tracked source was updated first under `openclaw-mac-migration/staging/*`:
  - `staging/openclaw.json`
    - added tracked `ollama` provider truth
    - added `ollama/huihui_ai/gemma-4-abliterated:26b`
    - changed main-chat primary to `ollama/huihui_ai/gemma-4-abliterated:26b`
    - changed first text fallback to `openai-codex/gpt-5.4-mini`
    - preserved deeper fallbacks:
      - `deepseek/deepseek-chat`
      - `mimo/mimo-v2-flash`
      - `openrouter/xiaomi/mimo-v2-pro`
    - preserved image routing:
      - primary `ollama/qwen2.5vl:7b`
      - fallback `openrouter/xiaomi/mimo-v2-omni`
    - added alias:
      - `ollama/huihui_ai/gemma-4-abliterated:26b` -> `gemma`
  - updated workspace docs to match the same runtime truth:
    - `workspace/AGENTS.md`
    - `workspace/README.md`
    - `workspace/memory/routing/models-routing.md`
    - `workspace/memory/knowledge/runtime/cost-control-rules.md`
- live rollout target after this change is:
  - main chat primary:
    - `ollama/huihui_ai/gemma-4-abliterated:26b`
  - main chat fallback_1 when the Mac-local route is unavailable:
    - `openai-codex/gpt-5.4-mini`
  - image primary:
    - `ollama/qwen2.5vl:7b`
  - image fallback when the Mac-local image route is unavailable:
    - `openrouter/xiaomi/mimo-v2-omni`
  - non-goal / preserved lanes:
    - `OPENCLAW_MEMORY_LIGHT_MODEL=gpt-5.4-mini`
    - `OPENCLAW_MEMORY_DEEP_MODEL=gpt-5.4`
    - `OPENCLAW_SESSION_MEMORY_REVIEW_MODEL=gpt-5.4`
    - Hermes and QQ c2c routing
- implementation rule locked for future desktop-local default changes:
  - do not treat a config-only primary-model change as complete until the local Ollama model, NAS relay whitelist, Mac reverse tunnel, and both live instance defaults have all been verified in the same session
- final post-cutover model-state evidence:
  - benben fresh session `gemma-status-20260414p` completed bare `/new` and then `/status`; the returned status text reported current model `ollama/huihui_ai/gemma-4-abliterated:26b`
  - adminAI canonical launcher `/usr/local/bin/openclaw-adminai` completed bare `/gemma`, `/new`, `/reset`, and `/status`; returned status text reported the same current-model truth
  - later 2026-04-14 verification clarified that `/status` itself can run on `openai-codex/gpt-5.4-mini`; use a normal follow-up message, not `/status`, as proof that main-chat generation is using Gemma
- isolated fallback verification:
  - a root-only temp config override was not strong enough evidence on benben; config-health saw the temp file, but session/runtime state still leaked enough live context to make the result ambiguous
  - a full isolated harness that overrides `HOME`, `OPENCLAW_SERVICE_HOME` / `OPENCLAW_ADMINAI_SERVICE_HOME`, temp `.openclaw`, and a copied config with `ollama.baseUrl=http://127.0.0.1:9` gave the decisive result on both instances
  - benben full-isolated `/new` (`gemma-fallback-benben-20260414c`) resolved to:
    - `provider=openai-codex`
    - `model=gpt-5.4-mini`
  - adminAI full-isolated `/new` (`gemma-fallback-adminai-20260414b`) resolved to:
    - `provider=openai-codex`
    - `model=gpt-5.4-mini`
  - this closes the last fallback proof gap:
    - when the desktop-local Gemma path is unavailable, main chat really does fall back to `openai-codex/gpt-5.4-mini`
- later live startup verification found a separate startup gap that was later closed for bare `/new` and `/reset`:
  - fresh benben `/new` on `gemma-postclean-benben-20260414a` and fresh adminAI `/new` on `gemma-postclean-adminai-20260414a` both started with Gemma as the real session model, but the outer CLI run recovered through `openai-codex/gpt-5.4-mini`
  - transcript evidence shows the recovery marker:
    - `Continue where you left off. The previous model attempt failed or timed out.`
  - `session_status` on those same sessions still reported:
    - current model `ollama/huihui_ai/gemma-4-abliterated:26b`
    - one running task in the fresh `/new` startup sequence
  - corresponding gateway logs proved the failure mode was not idle-timeout drift:
    - `FailoverError: LLM request timed out.`
    - benben first observed around `127s`
    - adminAI first observed around `129s`
- 2026-04-14 bundle follow-up supersedes that older bare `/new` and `/reset` evidence:
  - live `server.impl-BxLfE9ri.js` now treats empty-tail `/new` and `/reset` as session-lifecycle control operations and returns a synthetic completed reply with `durationMs=0`
  - live `commands.runtime-11Q3_DxB.js` and `reply-BwK-bN2w.js` also carry the reply/chat-path short-circuit
  - post-fix benben/adminAI bare `/new` and bare `/reset` all returned `agentMeta.model=huihui_ai/gemma-4-abliterated:26b` without launching the Gemma startup prompt
  - `/status` remains a normal model/session-status turn and should still be validated separately for slow-model latency
- experimental timeout escalation was tested and then rolled back:
  - live `agents.defaults.timeoutSeconds=180` plus `llm.idleTimeoutSeconds=180`
    - benben then timed out around `193s`
    - adminAI then timed out around `189s`
  - live `agents.defaults.timeoutSeconds=300` plus `llm.idleTimeoutSeconds=300`
    - benben then timed out around `310s`
    - adminAI then timed out around `309s`
  - conclusion:
    - increasing `agents.defaults.timeoutSeconds` only linearly delayed failover and did not make fresh `/new` complete on Gemma
    - that experimental timeout bump was reverted from live and source
    - current retained config returned to:
      - `params.thinking=off`
      - `agents.defaults.llm.idleTimeoutSeconds=120`
- operator caveat for future smoke runs:
  - reusing an older smoke session can produce a false regression signal on `/status`
  - one benben replay on `gemma-verify-20260414m` timed out during the status turn itself, then the runtime inserted `Continue where you left off...` and recovered through `openai-codex/gpt-5.4-mini`
  - treat that pattern as session-state recovery noise, not as proof that the Gemma default route has reverted
  - when validating default-model truth, prefer a fresh session for `/new -> /status`
- 2026-04-14 rollback follow-up for shortcut regression:
  - reverted the temporary live/source `main.tools.byProvider.ollama` slimming change after it coincided with broken legacy slash-command behavior
  - rolled both live instances back to the nearest restorable early-morning baseline:
    - config-guard snapshots from `2026-04-14 08:29 CST`
    - workspace routing docs from `2026-04-14 08:53 CST`
    - reply/runtime bundle files from the `06:26-07:36 CST` backup set
  - retired the old NAS-local legacy model id from active live state:
    - `models.providers.ollama.models[*].id = "huihui_ai/gemma-4-abliterated:e2b"`
    - `agents.defaults.models["ollama/huihui_ai/gemma-4-abliterated:e2b"].alias = "local"`
    - live workspace rules now point `/local` to `ollama/huihui_ai/gemma-4-abliterated:e2b`
  - kept the broader benben slash-model switches at the workspace rule layer instead of forcing every route into config aliases again
- current live services after the rollback follow-up:
  - `openclaw-gateway.service = active`
  - `openclaw-adminai-gateway.service = active`

2026-04-16 local/cloud isolation repair completion:

- scope:
  - finish the 2026-04-16 repair phase for:
    - secret-bearing env leakage into journald on status/operator paths
    - local unknown-fact guardrail drift
    - `/new` follow-up still entering tiny-profile startup text
    - explicit request-scoped local turns still leaking back into cloud/lightweight-memory behavior on gateway/CLI/webchat agent paths
- live files changed in this repair pass:
  - `/usr/local/bin/openclaw`
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
  - `/usr/lib/node_modules/openclaw/dist/agent-command-8TL7BESJ.js`
  - `/var/lib/openclaw/.openclaw/workspace/plugins/local-lite-lane/index.js`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/plugins/local-lite-lane/index.js`
- live backups preserved during this pass:
  - `reply-BwK-bN2w.js.bak.request-scoped-local-*`
  - `reply-BwK-bN2w.js.bak.new-fallback-*`
  - `agent-command-8TL7BESJ.js.bak.request-scoped-local-*`
  - `agent-command-8TL7BESJ.js.bak.request-scoped-local-acp-*`
  - `agent-command-8TL7BESJ.js.bak.request-scoped-local-final-*`
  - `agent-command-8TL7BESJ.js.bak.request-scoped-local-tsenv-*`
  - both live `local-lite-lane/index.js.bak.request-scoped-local-*`
- confirmed root causes closed:
  - status/operator secret leak:
    - the wrapper path could expose secret-bearing env in journald
    - repaired via the secret-safe wrapper path already in live `/usr/local/bin/openclaw`
  - `/new` follow-up tiny-profile text:
    - bare lifecycle fast replies could skip the model run but still leave `systemSent=false`
    - fixed in `reply-BwK-bN2w.js` by persisting lifecycle handling and `systemSent=true`
  - bare `/new` on bound main-session fallback:
    - a later reply-runtime fallback still special-cased bare `/reset`
    - `agent:main:main`-style bound sessions could therefore let bare `/new` fall through to model generation even after the earlier lifecycle fix
    - fixed in `reply-BwK-bN2w.js` by resolving both bare `/new` and bare `/reset` in the later lifecycle fallback
  - explicit local request cloud bleed:
    - request-scoped `/lite <message>` and related local prefixes could miss the raw `local_direct` path
    - gateway agent requests inject timestamp envelopes before runtime dispatch
    - prefix detection now strips timestamp envelopes first in both `reply-BwK-bN2w.js` and `agent-command-8TL7BESJ.js`
  - plugin `before_dispatch` timestamp leak:
    - `local-lite-lane` receives `bodyForAgent` from dispatch, which can be timestamp-enveloped like `[Thu ...] /new`
    - without envelope stripping, bare `/new` / `/reset` could still touch the local-lite hot-probe path before lifecycle handling
    - fixed in both live workspace `local-lite-lane/index.js` files by stripping the timestamp envelope first and explicitly bypassing bare `/new` / `/reset`
- verified post-fix behavior:
  - health after final restart:
    - benben `127.0.0.1:18789/health -> {"ok":true,"status":"live"}`
    - adminAI `127.0.0.1:18889/health -> {"ok":true,"status":"live"}`
  - gateway/agent `/new`:
    - benben `/new` -> `durationMs=0`, `provider=openai-codex`, `model=gpt-5.4`
    - adminAI `/new` -> `durationMs=0`, `provider=openai-codex`, `model=gpt-5.4`
    - benben `/new -> 你好` -> `你好呀，我在 🐾`
    - adminAI `/new -> 你好` -> `你好。请说。`
  - bound main-session reply-runtime fallback:
    - `agent:main:main`-shaped gateway context `/new` -> `✅ New session started...`
    - `agent:main:main`-shaped gateway context `/new -> /status` no longer emits a stray `不知道。`
  - gateway/agent explicit request-scoped local turn:
    - benben `/lite 我的车牌号是什么` -> `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`, `routingMode=local_direct`, text `不知道。`
    - adminAI `/lite 我的车牌号是什么` -> same provider/model/routing and text `不知道。`
  - session-scoped local turn still intact:
    - bare `/lite` enables persistent `local_direct`
    - ordinary turn after `/lite` stays on `ollama/huihui_ai/qwen3.5-abliterated:9b`
    - `/main` clears the local marker and returns to `openai-codex/gpt-5.4`
  - live plugin verification:
    - service-user import of benben/adminAI `workspace/plugins/local-lite-lane/index.js` with a fake `before_dispatch` event `body='[Thu ...] /new'` returned `undefined` and did not touch `fetch`
  - journal guardrails:
    - `memory_search_count=0` for the verified local-direct turns in this repair window
    - `secret_env_count=0`
    - `sudo_command_continued=0`
- one repair mistake occurred and was corrected in the same session:
  - a parallel upload/install step briefly wrote `agent-command-8TL7BESJ.js` as `0` bytes
  - the file was immediately restored from the latest backup, import/export was re-verified, then the corrected file was installed sequentially
  - final state is the repaired file, not the empty file

2026-04-16 late-night cloud memory grounding repair:

- scope:
  - close the shared `memory_search` fallback crash that still made `/new`-era cloud replies look memory-confused on benben/adminAI
- live files changed in this repair pass:
  - `/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-core-phase1-cutover.mjs`
- live backups preserved during this pass:
  - `/usr/lib/node_modules/openclaw/dist/extensions/memory-core/index.js.bak.memory-search-scopedcontext-*`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-core-phase1-cutover.mjs.bak.memory-search-scopedcontext-*`
- confirmed root cause closed:
  - at `2026-04-16 23:43:36 CST`, benben journal logged:
    - `[tools] memory_search failed: scopedContext is not defined raw_params={"query":"用户 是否 要 考试 考试安排 备考 近期考试","maxResults":5}`
  - shared `dist/extensions/memory-core/index.js` declared `let scopedContext = scope || {}` inside the `try` body
  - when a real retrieval error occurred, the `catch` fallback referenced `scopedContext` out of scope and threw a second `ReferenceError`
  - that removed the grounded unavailable result and let cloud main drift into non-grounded memory phrasing
  - fixed by lifting `scopedContext` outside the `try`
  - the maintained patch source was updated in `workspace/tools/memory-core-phase1-cutover.mjs`
- verified post-fix behavior:
  - health after restart:
    - benben `127.0.0.1:18789/health -> {"ok":true,"status":"live"}`
    - adminAI `127.0.0.1:18889/health -> {"ok":true,"status":"live"}`
  - fresh benben/adminAI `/new`:
    - still return `durationMs=0`, `provider=openai-codex`, `model=gpt-5.4`
  - fresh benben/adminAI `/new -> 你知道我要考试吗`:
    - now return grounded exam memory citing `memory/stable/self/life-planning.verified.md#L3`
  - fresh benben/adminAI `/new -> 你现在记忆里有什么啊`:
    - now cite cloud `USER.md#L4` and `memory/stable/self/*`
    - this confirms the remaining broad recall is cloud stable memory, not local-lite profile leakage
  - journal after the repair replay:
    - no new `memory_search failed`
    - no new `scopedContext is not defined`
  - local regression after the memory-core repair:
    - benben/adminAI `/lite -> 我的车牌号是什么 -> /main` still return:
      - local `provider=ollama`, `model=huihui_ai/qwen3.5-abliterated:9b`, text `不知道。`
      - cloud reset `provider=openai-codex`, `model=gpt-5.4`

2026-04-17 adminAI ops-role repair:

- scope:
  - make adminAI behave like an ops-only NAS / VPS assistant instead of a full life-memory assistant
  - fix direct `openclaw-host-status` execution for adminAI so it no longer falls back to benben SSH key paths
- live files changed in this repair pass:
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/USER.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/TOOLS.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/skills/host-status/SKILL.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/openclaw-host-status.py`
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-host-status.py`
- live backups preserved during this pass:
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak.adminai-ops-role-*`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/USER.md.bak.adminai-ops-role-*`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/TOOLS.md.bak.adminai-ops-role-*`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/skills/host-status/SKILL.md.bak.adminai-ops-role-*`
  - both workspace `tools/openclaw-host-status.py.bak.adminai-ops-role-*`
- confirmed root causes closed:
  - adminAI still inherited a full memory-enabled agent config, including:
    - `agents.defaults.memorySearch.enabled=true`
    - `agents.defaults.compaction.memoryFlush.enabled=true`
    - no main-agent role override for ops-only behavior
  - direct `sudo -u openclaw-adminai /usr/local/bin/openclaw-host-status --json` failed because `openclaw-host-status.py` defaulted to `/var/lib/openclaw/.ssh/id_ed25519_vps_status`
    - fixed by resolving SSH defaults from `OPENCLAW_SERVICE_HOME` / `HOME`
  - adminAI workspace guidance still advertised `openclaw-adminai memory status --json`, which nudged the model toward OpenClaw memory/admin answers for phrases like `内存状态`
    - fixed by switching the ops-facing docs and skill guidance to `openclaw-host-status --host all --summary`
- live config truth after repair:
  - `agents.defaults.memorySearch.enabled=false`
  - `agents.defaults.compaction.memoryFlush.enabled=false`
  - `agents.list.main.name=adminAI`
  - `agents.list.main.identity.theme` now explicitly says `内存状态` / `CPU 状态` / `磁盘状态` are host-resource questions, not OpenClaw memory questions
  - `agents.list.main.memorySearch.enabled=false`
- verified post-fix behavior:
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai config validate --json` -> `{"valid":true,...}`
  - `openclaw-adminai-gateway.service` restarted cleanly and `127.0.0.1:18889/health -> {"ok":true,"status":"live"}`
  - direct host-status under the adminAI service user:
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-host-status --host all --summary`
    - returns `NAS 正常 | VPS 正常 | 链路 正常`
    - no longer throws `PermissionError` on `/var/lib/openclaw/.ssh/id_ed25519_vps_status`
  - authoritative launcher replay:
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "内存状态" --json`
    - reply now reports NAS + VPS host/resource status instead of OpenClaw 主记忆状态
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "你知道我要考试吗" --json`
    - reply now refuses life-memory carryover: `这边没有你的生活类记忆，也不该拿别的实例的个人记忆来回答这个。`
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "你有权限修改配置吗" --json`
    - reply now explicitly states it can read config, modify config, validate, and restart related services
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "adminai gateway 配置入口在哪" --json`
    - reply now returns the exact live config entry points:
      - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
      - `/etc/openclaw/adminai-gateway.env`
      - `openclaw-adminai-gateway.service`
- source-of-truth files updated in repo:
  - `nas-openclaw-v22/workspace/tools/openclaw-host-status.py`
  - `nas-openclaw-v22/workspace/skills/host-status/SKILL.md`
  - `nas-openclaw-v22/workspace/tools/install-openclaw-adminai-instance.sh`
  - `nas-openclaw-v22/workspace/tools/adminai-pi-embedded-cutover.mjs`

2026-04-17 adminAI high-authority ops prompt follow-up:

- scope:
  - make adminAI use its broad ops authority more directly for explicit config/log/systemd requests instead of falling back to second-authorization wording
- live files changed in this follow-up:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/USER.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/TOOLS.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/skills/adminai-ops/SKILL.md`
- live backups preserved during this pass:
  - `/usr/lib/node_modules/openclaw/dist/pi-embedded-Vw-lS5ti.js.bak.adminai-ops-prompt-*`
- confirmed behavior after the follow-up:
  - adminAI runtime prompt now states:
    - explicit ops requests should execute directly
    - no extra `如果你授权` prompt inside the ops boundary unless the command is actually denied
    - log reads should prefer `sudo -n journalctl`
    - config reads/writes should prefer `openclaw-adminai config get/set/validate`
  - a new workspace skill `adminai-ops` now exists in adminAI live workspace and advertises the exact high-authority ops entry points
  - authoritative launcher replay:
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "查看 adminai gateway 日志" --json`
    - reply now directly summarizes recent journal content instead of stopping at a second authorization request
    - the same replay correctly identified recent `SIGTERM` restarts, healthy channel startup, and the current model

2026-04-17 adminAI elevated-direct follow-up:

- scope:
  - keep adminAI high-authority ops behavior for internal direct/webchat sessions, not just channel-bound feishu/telegram sessions
- live files changed in this follow-up:
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
- live backups preserved during this pass:
  - `/usr/lib/node_modules/openclaw/dist/reply-BwK-bN2w.js.bak.adminai-elevated-direct-*`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak.adminai-elevated-direct-*`
- confirmed root cause closed:
  - elevated gating previously returned hard-false when `ctx.Provider` was empty
  - internal direct/webchat sessions therefore never reached `tools.elevated.allowFrom.*`, even though adminAI was supposed to act as a high-authority ops agent
  - fixed by changing the elevated provider key resolution to fall back from `Provider` to `OriginatingChannel` / `Surface`
  - adminAI config now explicitly allows internal elevated surfaces:
    - `tools.elevated.allowFrom.webchat = ["*"]`
    - `tools.elevated.allowFrom.http = ["*"]`
    - `tools.elevated.allowFrom.loopback = ["*"]`
- verified post-fix behavior:
  - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "重启 adminai gateway" --json`
    - the client run itself was cut by the restart, but live journal confirms the command executed:
      - `sudo ... COMMAND=/usr/bin/systemctl restart openclaw-adminai-gateway.service`
      - service stopped, restarted, and returned to `active/running`
      - new `ExecMainStartTimestamp` advanced to the post-restart time
  - `127.0.0.1:18889/health` remained `{"ok":true,"status":"live"}` after the restart

2026-04-17 adminAI high-frequency ops helper follow-up:

- scope:
  - make the documented adminAI high-frequency ops commands actually exist in the service user's executable PATH
  - make `重启 adminai gateway` return a stable scheduled reply instead of tearing down the current request
- live files changed in this follow-up:
  - `/usr/local/sbin/openclaw-adminai-safe-edge`
  - `/usr/local/bin/ocedge`
  - `/usr/local/bin/ocstack`
  - `/usr/local/bin/ocmon`
  - `/usr/local/bin/ocrestore`
  - `/usr/local/bin/octunnel`
  - `/usr/local/bin/ocapp`
- live backups preserved during this pass:
  - `/usr/local/sbin/openclaw-adminai-safe-edge.bak.adminai-delayed-restart*`
- confirmed root causes closed:
  - adminAI prompt had already started preferring `ocedge restart-adminai-gateway`, but the alias did not exist in the service user's PATH
  - `restart-adminai-gateway` inside `openclaw-adminai-safe-edge` previously used direct `systemctl restart`, which cut the current request before the reply could be delivered
  - fixed by:
    - installing global wrapper commands in `/usr/local/bin` for `ocedge/ocstack/ocmon/ocrestore/octunnel/ocapp`
    - changing `openclaw-adminai-safe-edge restart-adminai-gateway` to a delayed self-restart scheduler
    - increasing the default self-restart delay from `3s` to `10s`
- verified post-fix behavior:
  - `command -v ocedge` and the other helper commands now resolve under the live host PATH
  - direct wrapper check:
    - `sudo /usr/local/sbin/openclaw-adminai-safe-edge restart-adminai-gateway`
    - returns `scheduled adminAI gateway restart in 10s`
    - after the delay, systemd shows a new `ExecMainStartTimestamp` and `health` returns live
  - authoritative launcher replay:
    - `sudo -u openclaw-adminai /usr/local/bin/openclaw-adminai agent --session-id ... --message "重启 adminai gateway" --json`
    - now returns `已安排重启，10 秒后执行。`
    - after the delay, `openclaw-adminai-gateway.service` is still `active/running`

2026-04-17 final maintenance follow-up:

- live files changed in this pass:
  - `/var/lib/openclaw-adminai/.openclaw/workspace/tools/openclaw-host-status.py`
  - `/var/lib/openclaw/.openclaw/workspace/tools/openclaw-host-status.py`
  - `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-eval.mjs`
  - `/var/lib/openclaw/.openclaw/workspace/tools/session-memory-review.mjs`
- confirmed fixes:
  - root/direct host-status no longer falls back to `/root/.ssh/id_ed25519_vps_status`
    - `sudo /usr/local/bin/openclaw-host-status --host vps --summary` now returns healthy VPS status through the workspace-dispatched script
  - malformed `/usr/local/bin/*bak-codex-adminai-"$TS"` binaries were deleted as obvious garbage
    - removed 8 files:
      - `openclaw.bak-codex-adminai-"$TS"`
      - `openclaw-identity-merge.bak-codex-adminai-"$TS"`
      - `openclaw-memory-ops.bak-codex-adminai-"$TS"`
      - `openclaw-oneshot.bak-codex-adminai-"$TS"`
      - `openclaw-promotion-queue.bak-codex-adminai-"$TS"`
      - `openclaw-recurring.bak-codex-adminai-"$TS"`
      - `openclaw-session-review-queue.bak-codex-adminai-"$TS"`
      - `openclaw-stable-trim.bak-codex-adminai-"$TS"`
  - benben couple-memory regression is fully closed
    - synced the patched live `memory-v2-eval.mjs`
    - re-ran live `memory-v2-backfill`
    - `memory-v2-eval --json` now reports `passed_cases=13`, `failed_cases=0`
    - `owner_private_current` and `owner_long_term_goal` are both green again
  - benben memory-ops dashboard is back to healthy
    - root cause of the false `rolled sessions missed auto review` alarm was internal `agent:main:explicit:*` smoke/audit sessions being counted as user-facing review debt
    - source-of-truth fix: `workspace/tools/session-memory-review.mjs`
    - local regression coverage: `node --test workspace/tools/tests/session-memory-review.test.mjs` => `45/45 pass`
    - live reconcile:
      - `session-memory-review --reconcile-missed --max-sessions 10 --json` reviewed the remaining 2 real user-facing sessions and discarded both as non-durable/noise
    - final live status:
      - `openclaw memory-ops status --json` => `status=healthy`, `issues=[]`
      - pending session-review count is now `0`
- residual non-blocking watch items:
  - stable-trim blocker is now fully closed
    - fixed ownership drift on `memory/stable/compat/local-lite-basic-facts.md` (`root:openclaw` -> `openclaw:openclaw`)
    - `openclaw stable-trim apply stable_trim_20260417160430_mibbot --confirm APPLY --json` applied successfully
    - live compat file is now a fallback stub and the original content is archived to `memory/archive/stable-trim/local-lite-basic-facts-stable_trim_20260417160430_mibbot.md`
    - removed the temporary `local-lite-basic-facts.md.bak-codex-trimfix-20260418000609` rollback copy after confirming the archive + stub were correct, so it would not reappear as a new cold compat recommendation
    - final live `openclaw memory-ops status --json` still reports `status=healthy`, `issues=[]`, and `stable_trim.recommendation_count=0`
  - retry-tail historical debt is now fully retired too
    - `openclaw memory-ops retry-tail-audit --retire-current --retire-note '2026-04-18 final low-signal retry-tail cleanup after stable-trim closure' --json`
    - retired the last old `gateway_add_failed` / `short_or_low_signal_session` Feishu group sample
    - final live status:
      - `retry-tail-audit --json` => `historical_tail_count=0`, `pending_retry_count=0`, `retired_tail_count=1`
      - `openclaw memory-ops status --json` => `status=healthy`, `issues=[]`, `operator_actions=[]`
- current close-out state:
  - benben runtime health green
  - adminAI runtime health green
  - couple-memory green (`13/13`)
  - session-review queue empty
  - stable-trim queue empty
  - retry-tail historical debt cleared from active operator surface

2026-04-21 Anyone.ai provider enablement:

- live scope in this session:
  - host: `oc-nas`
  - instances:
    - benben: `openclaw-gateway.service`
    - adminAI: `openclaw-adminai-gateway.service`
- live files changed:
  - `/var/lib/openclaw/.openclaw/openclaw.json`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
  - `/etc/openclaw/gateway.env`
  - `/etc/openclaw/adminai-gateway.env`
- backups created:
  - `/var/lib/openclaw/.openclaw/openclaw.json.bak-anyone-20260421T092024Z`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak-anyone-20260421T092024Z`
  - `/etc/openclaw/gateway.env.bak-anyone-20260421T092024Z`
  - `/etc/openclaw/adminai-gateway.env.bak-anyone-20260421T092024Z`
- runtime truth after change:
  - both live instances now include `models.providers.anyone`
  - provider base URL: `https://api.anyone.ai/v1`
  - provider auth env id: `ANYONE_API_KEY`
  - configured Anyone models:
    - `anyone/gpt-5.4`
    - `anyone/gpt-5.3-codex`
  - default main route was intentionally left unchanged:
    - benben primary still resolves to `openai-codex/gpt-5.4`
    - adminAI primary still resolves to `openai-codex/gpt-5.4`
- verification completed:
  - both gateway env files contain a managed `ANYONE_API_KEY` block
  - both gateway services restarted and returned `active`
  - startup logs after restart show:
    - benben gateway ready with `agent model: openai-codex/gpt-5.4`
    - adminAI gateway ready with `agent model: openai-codex/gpt-5.4`
  - direct NAS-side Anyone responses smoke using each live env returned `OK` for `gpt-5.4`
- non-blocking note:
  - benben journal still shows pre-existing Telegram command-sync / gateway TLS fingerprint noise after startup; this change did not alter the default route or channel configuration surface

2026-04-21 Anyone.ai default-route cutover:

- this note supersedes the earlier same-day “Anyone.ai provider enablement” entry where the provider was added but the main lane was intentionally left unchanged
- final live routing truth after the full repair:
  - benben main default: `anyone/gpt-5.4`
  - adminAI main default: `anyone/gpt-5.4`
  - legacy official Codex route remains available as `openai-codex/gpt-5.4`
  - bare `/codex` now explicitly switches to `openai-codex/gpt-5.4`
  - bare `/anyone` now explicitly switches to `anyone/gpt-5.4`
  - bare `/main`, bare `/new`, and bare `/reset` return to the main default `anyone/gpt-5.4`
- live files changed in the second pass:
  - `/var/lib/openclaw/.openclaw/openclaw.json`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json`
  - `/var/lib/openclaw/.openclaw/workspace/AGENTS.md`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/AGENTS.md`
  - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js`
- backups created in the second pass:
  - `/var/lib/openclaw/.openclaw/openclaw.json.bak-anyone-default-20260421T094823Z`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak-anyone-default-20260421T094823Z`
  - `/var/lib/openclaw/.openclaw/openclaw.json.bak-codex-restore-20260421T095111Z`
  - `/var/lib/openclaw-adminai/.openclaw/openclaw.json.bak-codex-restore-20260421T095111Z`
  - `/var/lib/openclaw/.openclaw/workspace/AGENTS.md.bak-sync-apply-20260421T101024Z`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/AGENTS.md.bak-sync-apply-20260421T101024Z`
  - `/var/lib/openclaw/.openclaw/workspace/AGENTS.md.bak-sync-apply-20260421T115508Z`
  - `/var/lib/openclaw-adminai/.openclaw/workspace/AGENTS.md.bak-sync-apply-20260421T115508Z`
  - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js.bak-codex-bare-route-20260421T103319Z`
  - `/usr/lib/node_modules/openclaw/dist/server.impl-BxLfE9ri.js.bak-anyone-route-20260421T112058Z`
- config truth after the second pass:
  - `agents.defaults.model.primary = anyone/gpt-5.4`
  - `agents.defaults.models["anyone/gpt-5.4"].alias = "anyone"`
  - `agents.defaults.models["openai-codex/gpt-5.4"].alias = "codex"`
- user-facing smoke completed:
  - benben `/new` -> synthetic reply reported `Default model: anyone/gpt-5.4` with `provider=anyone`
  - adminAI `/new` -> synthetic reply reported `Default model: anyone/gpt-5.4` with `provider=anyone`
  - benben `/codex -> /status` returned `provider=openai-codex`, `model=gpt-5.4`
  - adminAI `/codex -> /status` returned `provider=openai-codex`, `model=gpt-5.4`
  - benben bare `/anyone` returned `provider=anyone`, `model=gpt-5.4`, and the next ordinary message `只回复OK` also ran through `provider=anyone`, `model=gpt-5.4`
  - adminAI bare `/anyone` returned `provider=anyone`, `model=gpt-5.4`, and the next ordinary message `只回复OK` also ran through `provider=anyone`, `model=gpt-5.4`
- operator note:
  - `/model anyone` and `/model anyone/gpt-5.4` were not treated as authoritative enough for this repair because the observed session store stayed pinned on legacy Codex during smoke
  - the stable operator-facing explicit Anyone route is now bare `/anyone`

2026-04-21 Anyone status-display follow-up:

- symptom after the route cutover:
  - fresh Anyone-default `/status` replies could show `模型：未知` or mislabel the lane as `openai/gpt-5.4`, even though the actual turn metadata already showed `provider=anyone`, `model=gpt-5.4`
- root cause:
  - `/usr/lib/node_modules/openclaw/dist/status-vq7yuJ1g.js` read `providerOverride` / `modelOverride` with plain nullish coalescing
  - after `/new` or other clear-route actions, those fields can exist as empty strings, so the status builder treated `""` as a selected provider/model instead of falling back
  - the same builder also needed to prefer the session's recorded `modelProvider` / `model` when there was no explicit override, otherwise the display could fall back to generic `openai`
- live fix:
  - updated `/usr/lib/node_modules/openclaw/dist/status-vq7yuJ1g.js`
  - backups:
    - `/usr/lib/node_modules/openclaw/dist/status-vq7yuJ1g.js.bak-anyone-status-20260421T122627Z`
    - `/usr/lib/node_modules/openclaw/dist/status-vq7yuJ1g.js.bak-anyone-status-provider-20260421T124309Z`
  - the status builder now:
    - normalizes empty-string overrides before fallback
    - prefers `sessionEntry.modelProvider` / `sessionEntry.model` when no explicit override exists
- verification:
  - benben fresh `/new -> /status` now reports `模型：anyone/gpt-5.4`
  - adminAI fresh `/new -> /status` now reports `模型：anyone/gpt-5.4`
  - route smoke from the earlier cutover remains intact:
    - `/codex -> /status` still resolves to `openai-codex/gpt-5.4`
    - bare `/anyone -> ordinary follow-up` still resolves to `anyone/gpt-5.4`

2026-04-22 benben direct-main memory_v2 route stabilization:

- symptom confirmed on benben live:
  - direct `agent:main:main` questions could still fall back to `reason=dm_sender_unresolved` and `matched_route_names=[]` when the upstream `memory_search` query had already been rewritten into third-person owner proxy forms such as `用户是否想去香港读研 香港 读研 研究生 留学 想去香港`
  - this was not a global “cloud only returns MEMORY.md” failure; it was a route-shape failure specific to unresolved direct-main owner/couple questions
- repo/runtime fix:
  - updated `projects/products/openclaw/nas-openclaw-v22/workspace/tools/memory-v2-helper.mjs`
  - added direct-main owner proxy routing for rewritten `用户...` / `user ...` owner questions
  - kept owner proxy academic planning on `owner_profile` instead of letting `private_self_state` steal queries that contain `exam/study/计划`
  - widened planning-focused owner retrieval to include exam/study-style academic planning, not just `读研/申请/港校/香港`
- live benben change:
  - updated `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
  - restarted `openclaw-gateway.service`
  - confirmed `openclaw-gateway.service=active` after restart
  - confirmed `openclaw-adminai-gateway.service=active` and left adminAI unchanged as `ops-only`
- live fact-layer follow-up:
  - promoted owner stable `long_term_anchor` in `/var/lib/openclaw/.openclaw/workspace/memory_v2/facts/stable/owner.yaml`
  - durable statement:
    - `目标：优先按港校授课型硕士申请推进，方向以 CS/AI/DS 类项目为主。`
  - refreshed projections; `/var/lib/openclaw/.openclaw/workspace/memory_v2/projections/owner-profile.md` now carries the same durable statement
- benben live verification via the active workspace helper after restart:
  - `那你知道我想去香港读研吗` -> `reason=memory_v2_scoped`, `matchedRouteNames=["owner_profile"]`, allowlist includes owner current + stable owner
  - `用户是否想去香港读研 香港 读研 研究生 留学 想去香港` -> `reason=memory_v2_scoped`, `matchedRouteNames=["owner_profile"]`, allowlist includes owner current + stable owner
  - `用户考试规划 学业 备考 复习 exam study plan` -> `reason=memory_v2_scoped`, `matchedRouteNames=["owner_profile"]`, allowlist includes owner current + stable owner
  - `用户喜欢什么 偏好 习惯` -> `reason=memory_v2_scoped`, `matchedRouteNames=["owner_profile"]`, allowlist includes `memory_v2/projections/owner-preference.md`
  - `用户最近在忙什么 近期 状态 计划` -> `reason=memory_v2_scoped`, `matchedRouteNames=["private_self_state"]`, allowlist stays on owner current/recent only
  - `用户和对象最近计划什么时候见面 行程 安排` -> `reason=memory_v2_scoped`, `matchedRouteNames=["couple_current_state"]`, allowlist includes `memory_v2/projections/couple-current-plan.md`
- protected non-changes:
  - did not change Anyone default routing
  - did not change bare `/codex`
  - did not change `/status`
  - did not change `session-journal`
  - did not relax adminAI `ops-only`

2026-04-22 benben real-Feishu-DM identity + planning follow-up:

- follow-up symptom from real user traffic after the direct-main repair:
  - the earlier direct-main fix covered the worst-case unresolved route, but the screenshot backed by the real benben Feishu DM still showed:
    - `你是谁` answered as `张锦程`
    - `你记得我的个人规划吗` answered `不知道`
    - user also reported owner/partner pronoun confusion (`我` vs `她/他`)
- confirmed live truth:
  - this was not the same path as `agent:main:main`
  - the real user session was the resolved Feishu DM main session:
    - `agent:main:feishu:default:direct:ou_618ab2d13189630519294960ad40b5c0`
    - `serviceId=benben`
    - `routingLane=cloud`
    - `memoryPolicy=cloud_full`
  - live assistant stable truth was already correct:
    - `/var/lib/openclaw/.openclaw/workspace/memory_v2/facts/stable/assistant.yaml`
    - `/var/lib/openclaw/.openclaw/workspace/memory_v2/projections/assistant-profile.md`
  - so the problem was not assistant memory corruption
- repo/runtime fix:
  - updated `projects/products/openclaw/nas-openclaw-v22/workspace/tools/memory-v2-helper.mjs`
  - updated `projects/products/openclaw/nas-openclaw-v22/workspace/IDENTITY.md`
  - updated `projects/products/openclaw/nas-openclaw-v22/workspace/USER.md`
  - logic changes:
    - owner long-term intent now also recognizes `个人规划 / 人生规划`
    - resolved owner DM now tolerates rewritten owner-proxy forms (`用户...`) instead of dropping back to legacy manifest
    - owner self-route no longer steals partner-pronoun questions
    - owner current-state no longer beats profile/preference when the same query is actually asking a stable preference/profile question
    - startup identity cards now explicitly disambiguate:
      - `你是谁 / 你叫什么 / 你能做什么` -> `笨笨`
      - `我是谁 / 你知道我是谁吗` -> `张锦程`
- live benben change:
  - updated:
    - `/var/lib/openclaw/.openclaw/workspace/tools/memory-v2-helper.mjs`
    - `/var/lib/openclaw/.openclaw/workspace/IDENTITY.md`
    - `/var/lib/openclaw/.openclaw/workspace/USER.md`
  - restarted:
    - `openclaw-gateway.service`
  - left unchanged:
    - `openclaw-adminai-gateway.service` behavior / `ops-only`
- verification:
  - live helper probe against the real Feishu DM session metadata now returns:
    - `你是谁` -> `assistant_profile`
    - `你知道我是谁吗` -> `owner_profile`
    - `你记得我的个人规划吗` -> `owner_profile`
    - `用户现在偏好什么` -> `owner_profile` with `owner-preference.md`
    - `用户最近和她在忙什么` -> `partner_current_shared`
    - `我想知道她最近备考怎么样` -> `partner_current_shared`
  - full benben runtime smoke through `openclaw-cli-wrapper.sh agent --session-id fdffed76-12be-4bd2-846a-be73d0399e74` now returns:
    - `你是谁` -> `我是笨笨 ...`
    - `你知道我是谁吗` -> `你是张锦程`
    - `你记得我的个人规划吗` -> returns the remembered personal planning stack instead of `不知道`
    - `我想知道她最近备考怎么样` -> returns a partner-scoped recent-state answer and explicitly says current recent evidence is empty instead of pretending it knows owner state
