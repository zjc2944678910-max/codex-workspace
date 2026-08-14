# Cloudflare Edge Deployment Ledger

## 2026-08-14 — Vocab Atelier public BYOK workspace

- Hostname: `vocab.nodezjc12348888.xyz`
- Tunnel: `ielts-vocab-hub`
- Origin: `http://127.0.0.1:8090`
- Product root: `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/projects/ielts-vocab-hub`
- Runtime: a same-origin public gateway on `8090`, an isolated Python backend on `8091`, and `cloudflared`.
- Persistence: public visitor data lives below `~/.local/share/ielts-vocab-hub-public/visitors/`; each visitor has an independent SQLite database, profile images, and `api.json` with mode `0600`.
- Identity: Cloudflare Access email when present; otherwise a signed, Secure, HttpOnly, SameSite cookie. The browser never receives an API key from status or export endpoints.
- Autostart: `com.vocabatelier.public` and `com.vocabatelier.tunnel` user LaunchAgents.
- Verification: HTTPS returned `200`; AI/API UI was visible; two synthetic visitors retained distinct API models and chat lists; all 34 local tests passed.

### Rollback

1. Unload `com.vocabatelier.tunnel` and `com.vocabatelier.public` from the current user LaunchAgent domain.
2. Delete only the `vocab.nodezjc12348888.xyz` published application route from the `ielts-vocab-hub` tunnel.
3. If full removal is required, delete that tunnel after the route is removed.
4. Preserve `~/.local/share/ielts-vocab-hub-public/` unless the user separately authorizes deletion of public visitor data.
5. The private localhost app on ports `8080`/`8081` is independent and must not be removed during this rollback.

No tunnel token, API key, visitor cookie, account identifier, or visitor data is recorded here.
