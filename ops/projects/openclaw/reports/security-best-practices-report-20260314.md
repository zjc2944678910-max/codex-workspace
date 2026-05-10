# OpenClaw Audit Report

Audit date: 2026-03-14
Target host: `107.175.140.175`
Scope: runtime, configuration, memory/state layout, file roles, security posture, duplicate/redundant files
Method: read-only inspection over SSH plus `openclaw security audit --deep --json`

## Executive Summary

This OpenClaw deployment is a single-user, loopback-bound gateway running as `root` on Ubuntu. Its network exposure is relatively tight: the gateway listens only on `127.0.0.1:18789`, uses token auth, and Telegram access is limited to one approved account with `dmPolicy: "pairing"` and `groupPolicy: "allowlist"`.

The main security weaknesses are local-state concentration and privilege level, not public internet exposure. Secrets are stored in plaintext in multiple places, the service runs as `root`, sandboxing is disabled, browser control is enabled with `noSandbox: true`, and host shell execution is enabled for the Telegram operator path. In a personal-assistant trust model this may be acceptable, but it creates a very high blast radius if the host, Telegram account, or bot token is compromised.

## How OpenClaw Operates On This Host

1. `systemd` starts the gateway service:
   - `/etc/systemd/system/openclaw-gateway.service`
   - Exec path: `node /usr/lib/node_modules/openclaw/dist/index.js gateway --port 18789`
2. Environment is loaded from `/etc/openclaw/gateway.env:1-14`.
   - This provides gateway auth, LLM provider credentials, Telegram bot credentials, and proxy settings.
3. A global Undici hook is injected from `/etc/openclaw/global-proxy-hook.cjs:1-57`.
   - It forces most HTTP/S traffic through local HTTP proxy `127.0.0.1:18988`.
   - It bypasses proxying for `api.deepseek.com`, `openrouter.ai`, and `api.openai.com`.
4. The local proxy bridge is defined in `/etc/openclaw/xray-socks-bridge.json:1-51`.
   - Inbound HTTP proxy on `127.0.0.1:18988`
   - Outbound SOCKS proxy upstream
5. Runtime listeners:
   - `127.0.0.1:18789`: gateway WebSocket
   - `127.0.0.1:18791`: browser control service
   - `127.0.0.1:18792`: reserved/related local service surface
6. Active channel/plugin usage:
   - Telegram plugin enabled at `/root/.openclaw/openclaw.json:281-305`
   - One cron job in `/root/.openclaw/cron/jobs.json`
   - Browser control enabled at `/root/.openclaw/openclaw.json:326-334`

## How Memory Works Here

OpenClaw’s own docs describe the workspace as the agent’s home and `~/.openclaw/` as state/config/session storage:
- Workspace concept: `/usr/lib/node_modules/openclaw/docs/concepts/agent-workspace.md:9-22`
- Workspace file map: `/usr/lib/node_modules/openclaw/docs/concepts/agent-workspace.md:64-124`
- Memory search design: `/usr/lib/node_modules/openclaw/docs/concepts/memory.md:92-125`
- Index storage and freshness: `/usr/lib/node_modules/openclaw/docs/concepts/memory.md:388-397`

This host uses both Markdown memory files and per-agent SQLite indexes:

1. Source-of-truth memory files live under:
   - `/root/.openclaw/workspace/memory/`
   - Stable cards: `stable/`
   - Routing notes: `routing/`
   - Active task state: `active-tasks/`
   - Timeline: `timeline/`
2. Configured memory search is enabled in `/root/.openclaw/openclaw.json:118-184`.
   - `sources = ["memory", "sessions"]`
   - `experimental.sessionMemory = true`
   - embeddings provider = `openai`
   - remote endpoint = OpenRouter-compatible base URL
   - sync on session start, on search, file watch, and every 5 minutes
3. Per-agent memory databases:
   - `/root/.openclaw/memory/main.sqlite`
   - `/root/.openclaw/memory/coding_expert.sqlite`
4. SQLite schema confirms hybrid memory search:
   - `files`
   - `chunks`
   - `embedding_cache`
   - `chunks_fts` (FTS5)
   - `chunks_vec` / `chunks_vec_rowids` (sqlite-vec)
5. Current indexed footprint:
   - `main.sqlite`: 9 files, 9 chunks, 176 embedding-cache entries, 9 vector rowids
   - `coding_expert.sqlite`: 8 files, 8 chunks, 29 embedding-cache entries, 8 vector rowids
6. Session memory also exists outside SQLite:
   - session registry: `/root/.openclaw/agents/*/sessions/sessions.json`
   - transcript files: `/root/.openclaw/agents/main/sessions/*.jsonl`
   - reset snapshots: `*.jsonl.reset.*`
   - quarantine snapshot: `/root/.openclaw/agents/main/sessions-quarantine/`
7. A custom curation script exists:
   - `/root/.openclaw/tools/curate_openclaw_memory.py`
   - It classifies facts into `identity`, `devices`, `projects`, `preferences`, `workflow`
   - This indicates the operator is maintaining higher-level stable memory cards in addition to raw session data

## File and Directory Roles

### Install and runtime

- `/usr/lib/node_modules/openclaw/`
  - Application package root
  - `dist/`: compiled runtime code
  - `docs/`: bundled docs
  - `extensions/`: optional channel and plugin packages
  - `node_modules/`: dependencies
  - `assets/`: static assets

- `/etc/openclaw/`
  - `gateway.env`: environment-based secrets and runtime parameters
  - `gateway.env.bak`: backup copy
  - `global-proxy-hook.cjs`: HTTP client routing hook
  - `xray-socks-bridge.json`: local proxy bridge config
  - `test-*.mjs`: local test scripts

### State directory

- `/root/.openclaw/openclaw.json`
  - Main persisted runtime config
- `/root/.openclaw/agents/`
  - Per-agent session registries, transcript logs, and agent-local metadata
- `/root/.openclaw/memory/`
  - Per-agent SQLite vector/full-text memory indexes
- `/root/.openclaw/workspace/`
  - Human-editable agent workspace and durable Markdown memory
- `/root/.openclaw/workspace-coding_expert/`
  - Separate workspace root for alternate profile/agent
- `/root/.openclaw/credentials/`
  - Telegram allowlist/pairing state
- `/root/.openclaw/identity/`
  - Device identity/auth state
- `/root/.openclaw/devices/`
  - Paired/pending device records
- `/root/.openclaw/cron/`
  - Job definitions and run logs
- `/root/.openclaw/browser/`
  - Browser profile/user-data for Playwright/Chromium automation
- `/root/.openclaw/imported-chatgpt-archive/`
  - Imported historical archive plus profile/timeline cards
- `/root/.openclaw/backups/`
  - Snapshot backups of config and memory migration artifacts
- `/root/.openclaw/logs/`
  - Config audit and related local logs
- `/tmp/openclaw/`
  - Current day runtime log

### Workspace contents

Based on the workspace file map and current files:

- `AGENTS.md`: agent operating rules and memory behavior
- `SOUL.md`: persona and tone
- `USER.md`: user profile
- `IDENTITY.md`: agent identity
- `TOOLS.md`: local operational notes
- `HEARTBEAT.md`: periodic check instructions
- `memory/`: durable Markdown memory
- `memory-admin/`: memory tuning/admin notes
- `skills/`: workspace-specific skills
- `tools/`: helper scripts used by the workflow
- `output/`: generated content/output area
- `patches/`: runtime patch artifacts
- `snake_game/`: unrelated/example project inside workspace
- `telegram-quick-commands.md`: operator command shortcuts

Notable state sizes:

- `/root/.openclaw/browser`: 29M
- `/root/.openclaw/memory`: 17M
- `/root/.openclaw/workspace`: 7.8M
- `/root/.openclaw/imported-chatgpt-archive`: 4.5M

## Security Findings

### Critical / High

#### F1. Host-level command execution is enabled from Telegram while the gateway runs as `root`

Evidence:
- `tools.elevated.enabled = true` at `/root/.openclaw/openclaw.json:231-239`
- Telegram custom `bash` command is enabled at `/root/.openclaw/openclaw.json:295-303`
- Global sandbox is off at `/root/.openclaw/openclaw.json:199-201`
- Service runs as `root` (systemd + process inspection)

Impact:
- If the approved Telegram operator account is compromised, or if the bot token is stolen and access controls are bypassed elsewhere, the attacker gets a path to execute host commands as `root`.

Assessment:
- In a personal single-operator setup this is intentional, but from a security perspective it is still the highest-risk design choice in the deployment.

#### F2. Multiple plaintext secrets are stored locally and duplicated across config/state files

Evidence:
- `/etc/openclaw/gateway.env:1-14`
- `/root/.openclaw/agents/main/agent/auth-profiles.json:1-50`
- `/root/.openclaw/openclaw.json:281-334`
- `/etc/openclaw/xray-socks-bridge.json:14-31`
- duplicate/backup copies under `/root/.openclaw/openclaw.json.bak*` and `/root/.openclaw/backups/...`

Observed categories:
- Gateway auth token
- Telegram bot token
- OpenAI / OpenRouter / DeepSeek API credentials
- Upstream SOCKS proxy credentials

Impact:
- A single host compromise exposes all upstream accounts and automation channels.
- Rotation burden is high because secrets are duplicated, including in backups.

Assessment:
- File permissions are mostly root-only, so this is not a trivial local-user exposure issue.
- It is still a high-severity state-hygiene problem because secrets are stored in more places than necessary.

### Medium

#### F3. Browser automation runs with Chromium sandbox disabled

Evidence:
- `/root/.openclaw/openclaw.json:326-334` shows `"noSandbox": true`
- Browser control is enabled and listening locally

Impact:
- If an attacker reaches browser-control functionality through the gateway or local compromise, browser isolation is weaker than it should be.

Assessment:
- This is a hardening issue rather than a direct internet exposure issue, because the service is loopback-bound.

#### F4. The state directory contains substantial sensitive conversational history and imported archives

Evidence:
- Session registries and transcripts under `/root/.openclaw/agents/main/sessions/`
- Imported archive under `/root/.openclaw/imported-chatgpt-archive/`
- Durable memory cards and timelines under `/root/.openclaw/workspace/memory/`

Impact:
- The state directory is a concentrated privacy target.
- Exfiltration would leak both current operational memory and historical imported conversations.

Assessment:
- This is expected for OpenClaw, but it means host backup policy and access control are security-critical.

#### F5. Workspace git repository exists but is effectively unbacked and untracked

Evidence:
- `.git` exists in `/root/.openclaw/workspace/.git/`
- `.git/config` contains only core settings and no remotes
- `git status --short` shows the workspace is entirely untracked

Impact:
- More of an integrity/recovery issue than a confidentiality issue.
- The current workspace is not meaningfully versioned or backed up despite the docs recommending a private repo.

Assessment:
- Not a direct vulnerability, but relevant for audit completeness because memory/state recovery appears weak.

### Low

#### F6. Built-in audit reports weaker model tier for image/tool-adjacent usage

Evidence:
- `openclaw security audit --deep --json` warns on `openrouter/openai/gpt-4o-mini` for `agents.defaults.imageModel.primary`

Impact:
- Smaller/older models can be more susceptible to prompt-injection and tool misuse.

Assessment:
- This is a hardening note, not a concrete compromise path in the current config.

## Positive Security Posture Notes

- Gateway binds to loopback only:
  - `/root/.openclaw/openclaw.json:307-318`
- Gateway auth is enabled with token mode:
  - `/root/.openclaw/openclaw.json:310-313`
- Trusted proxies are limited to loopback:
  - `/root/.openclaw/openclaw.json:314-317`
- Telegram DM policy is `pairing`:
  - `/root/.openclaw/openclaw.json:288`
- Telegram groups are `allowlist` only:
  - `/root/.openclaw/openclaw.json:293`
- Explicit Telegram allowlist exists:
  - `/root/.openclaw/openclaw.json:290-292`
  - `/root/.openclaw/credentials/telegram-default-allowFrom.json`
- No public OpenClaw listener was found; exposed network services were `22/tcp`, `443/tcp`, and `8443/udp`

## Duplicate / Redundant Files

There are 95 backup-like files under `/root/.openclaw` and `/etc/openclaw`.

Exact duplicate-content groups observed include:

1. `/root/.openclaw/workspace/tools/proposal-promoter.mjs.bak-20260313-d21`
   and `/root/.openclaw/workspace/tools/proposal-promoter.mjs.bak-20260313-stageE2`
2. `/root/.openclaw/imported-chatgpt-archive/cards/profile-candidates.md`
   and `/root/.openclaw/backups/health-memory-20260312T083833Z/memory-legacy/chatgpt-profile-candidates.md`
3. `/root/.openclaw/openclaw.json.bak-token-local`
   and `/root/.openclaw/openclaw.json.bak-browser-proxy-20260311-142837`
4. `/root/.openclaw/backups/stageB-defaults-weather-20260312T145243Z/weather-SKILL.md.bak`
   and `/root/.openclaw/backups/stageB-defaults-weather-20260312T151318Z/SKILL.md`
5. `/root/.openclaw/imported-chatgpt-archive/cards/stable-profile.md`
   and `/root/.openclaw/backups/health-memory-20260312T083833Z/memory-legacy/chatgpt-stable-profile.md`
6. `stable-profile.md` appears in three identical copies:
   - `/root/.openclaw/workspace/memory/stable/stable-profile.md`
   - `/root/.openclaw/workspace/memory/stable/stable-profile.md.bak.2026-03-14-091449`
   - `/root/.openclaw/workspace/memory/stable/stable-profile.md.bak.2026-03-14-091855`
7. `/etc/openclaw/gateway.env`
   and `/root/.openclaw/backups/health-memory-20260312T083833Z/config/gateway.env`

Interpretation:
- The deployment contains meaningful historical clutter.
- Most duplication is backup-related, not package-manager duplication.
- Secret-bearing files are part of that backup set, which increases blast radius during exfiltration.

## Practical Interpretation

For an internet-facing OpenClaw deployment, the network-facing posture is better than average:
- loopback-only gateway
- token auth enabled
- Telegram sender gating
- no open-group exposure

For a host-compromise or operator-compromise scenario, the posture is weak:
- root service
- sandbox off
- browser sandbox off
- host exec exposed to Telegram operator path
- many plaintext duplicated secrets
- sensitive transcripts and imported archives on disk

## Built-in Audit Cross-Check

`openclaw security audit --deep --json` reported:

- `0 critical`
- `2 warn`
- `1 info`

Warnings it found:

1. `models.weak_tier`
2. `gateway.probe_failed` (timeout during deep probe)

Why manual audit found more:
- The built-in audit focuses on known config anti-patterns.
- It does not treat plaintext secret duplication, backup sprawl, or intentional single-user root workflows as critical by default.

## Recommended Next Steps

No changes were made during this audit. If remediation is desired later, the highest-value follow-ups would be:

1. Reduce secret duplication:
   - remove redundant plaintext copies
   - move provider creds to a single source of truth
2. Reconsider `root` + `sandbox: off` + Telegram `bash` together
3. Reconsider browser `noSandbox: true`
4. Prune stale backups and secret-bearing backup files
5. Decide whether imported archives and old reset transcripts are still needed
6. Put the workspace under a real private backup flow, or explicitly decide not to
