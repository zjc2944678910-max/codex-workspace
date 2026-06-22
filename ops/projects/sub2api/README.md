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

## Risk Notes

Treat live checks as L2 read-only. Any database writes, compose edits, image
rollouts, account status resets, or service restarts are L3 repair execution
and require the user to explicitly say `进入修复阶段`.

The admin panel is now publicly reachable via Cloudflare (since 2026-06-17);
treat auth hardening (strong password, CF Access, or IP allowlist) as an open
action.

Do not write API keys, OAuth access tokens, refresh tokens, cookies, or raw
credential JSON into tracked ops docs.
