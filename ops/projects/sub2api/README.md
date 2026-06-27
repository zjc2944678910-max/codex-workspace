# Sub2API Ops Surface

This directory is the operator-facing surface for the Sub2API AI API gateway
running on the VPS.

## Routing Evidence

- Project name: `Sub2API`
- Aliases: `sub2api`, `Sub2API`, `sub2api vps`, `sub2api gateway`, `codex_gemini`, `codex_antigravity`, `中转站`, `sub2`
- Registry routing keywords: `sub2api`, `Sub2API`, `Sub2API VPS`, `AI API gateway`, `codex_gemini`, `codex_antigravity`, `gemini-default`, `antigravity-default-1`, `中转站`, `gemini中转`, `账号池`, `sub.nodezjc12348888.xyz`, `new-api`
- Main code: live source checkout at `/opt/sub2api-src-fix` on the VPS; no tracked code root in this workspace
- Ops surface: `ops/projects/sub2api`
- State/data: live data is on the VPS under `/opt/sub2api` and Docker volumes/directories
- Scratch: none registered
- Reports: `ops/projects/sub2api/reports`
- Runbooks: `ops/projects/sub2api/runbooks`
- Live host aliases: `sub2api-vps`, `107.175.180.163`, `home-vps-root`, `vps-tunnel`, `home-nas-wg`
- Service names: `sub2api`, `sub2api-postgres`, `sub2api-redis`, `codex_gemini`, `codex_antigravity`, `new-api`
- Registry risk profile: `live_infra`

Route into this project only when the user explicitly names one of these
entries, provides a matching host/service/account/key, or asks for a file that
belongs to this surface.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md`
- `reports/`
- `runbooks/oauth-account-routing-and-opencode.md`

## Live Access

Preferred SSH path:

```bash
ssh -o ProxyCommand="ssh home-nas-wg nc %h %p" root@107.175.180.163
```

Fallback direct SSH may work from some networks, but the WireGuard NAS
ProxyCommand path is the stable route for this VPS.

## Current Known Service Shape

- Compose directory: `/opt/sub2api`
- Compose file: `/opt/sub2api/docker-compose.yml`
- Source checkout used for custom image builds: `/opt/sub2api-src-fix`
- Application container: `sub2api`
- PostgreSQL container: `sub2api-postgres`
- Redis container: `sub2api-redis`
- Current repaired image as of 2026-06-16: `sub2api:antigravity-chatcc-20260616T144111`
- Required Antigravity client version environment: `ANTIGRAVITY_USER_AGENT_VERSION=2.1.4`
- Public access (2026-06-17): `sub.` is now Cloudflare-fronted and publicly
  reachable at `https://sub.nodezjc12348888.xyz` (standard 443). See
  `DEPLOYMENT_LEDGER.md` → `2026-06-17` for the CF fronting + Gemini quota root cause.

## Entry And Topology

Promoted from claude-workspace (the request-path detail was unique to that copy).

- **Local access** = `http://127.0.0.1:18080`: forwarded by the `vps-tunnel` SSH
  tunnel to VPS docker `sub2api:8080`. Tunnel process: `ssh -NT ... vps-tunnel`
  (on the mac side).
- **Public access** = `https://sub.nodezjc12348888.xyz` (standard 443, no port).
- **Request path**: browser 443 → Cloudflare (orange cloud) → CF Origin Rule
  rewrites the origin port to `8443` → VPS nginx `sub.nodezjc12348888.xyz`
  (listen 8443/20002) → `proxy_pass 127.0.0.1:8080` → sub2api.
- VPS origin port `443` is occupied by **xray REALITY** (serverNames only accept
  cloudflare/microsoft, no nginx fallback), so hitting origin 443 directly does
  not reach sub2api; you must go through CF→8443 or nginx 8443/20002 directly.
- Same domain, other hosts: `api.nodezjc12348888.xyz` → `new-api:3000`;
  `ai.` → `:29133` (with authentik SSO).

## Codex Main-Model Client Config (2026-06-23, local — no VPS change)

Making Sub2API antigravity models (`claude-sonnet-4-6-thinking`,
`gemini-3.1-pro-high`, etc.) usable as the **Codex main model** (full agent
tool loop, not just chat) needed two **local** Codex-client fixes. The gateway
`/v1/responses` adapter itself is fine — it correctly maps single-turn
`function_call`, full-input multi-turn `function_call_output → tool_result`, and
streams the right Responses SSE events (verified by direct probes).

1. **Profiles v2 migration.** codex `0.142.0-alpha.6` rejects a legacy
   `[profiles.sub2api]` table in `config.toml` when `--profile sub2api` is used
   (`--profile ... cannot be used while ... contains legacy ... profile`). Moved
   the profile body to `~/.codex/sub2api.config.toml` (top-level keys, layered on
   base config) and removed the legacy table from `config.toml`.
   `[model_providers.sub2api]` stays in base config.
2. **Disable the built-in web_search tool for this profile.** Web search is ON
   by default; Codex injects a server-side `web_search` tool. The
   Antigravity/Gemini upstream rejects any request that mixes a server-side
   built-in tool with function tools (`Please enable
   tool_config.include_server_side_tool_invocations to use Built-in tools with
   Function calling`), and Codex always sends `shell`/`apply_patch` as function
   tools, so **every** agent turn 400s. Fix: `web_search = "disabled"` (top-level
   in `~/.codex/sub2api.config.toml`). Note: `tools.web_search=false` and
   `--disable web_search` do **not** work — the override must be the top-level
   `web_search` = `"live"|"indexed"|"cached"|"disabled"` key.

Verified via `codex exec --profile sub2api`: Claude + Gemini both complete the
loop, make tool calls, and create+edit files (`config.json` 1→2). The
`sub2api_mcp.py` advisor path is separate and already defaulted to
`max_tokens=4096`.

## Risk Notes

Treat live checks as L2 read-only. Any database writes, compose edits, image
rollouts, account status resets, or service restarts are L3 repair execution
and require the user to explicitly say `进入修复阶段`.

The admin panel is now publicly reachable via Cloudflare (since 2026-06-17);
treat auth hardening (strong password, CF Access, or IP allowlist) as an open
action.

Do not write API keys, OAuth access tokens, refresh tokens, cookies, or raw
credential JSON into tracked ops docs.
