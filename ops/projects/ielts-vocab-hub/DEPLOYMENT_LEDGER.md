# IELTS Vocab Hub Deployment Ledger

No secrets, visitor cookies, API keys, tunnel tokens, or account identifiers
are recorded here.

## 2026-08-25 — Canonical code window moved into Codex

- Canonical product root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/ielts-vocab-hub`
- Compatibility path: `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/projects/ielts-vocab-hub` is now a relative symlink to the Codex product root.
- Independent git remote remains `https://github.com/zjc2944678910-max/ielts-vocab-hub.git`.
- Oxford source exports remain in `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/output/`; the private-catalog builder now discovers that directory instead of assuming `workspace/projects/<slug>`.
- Live LaunchAgents were not rewritten and were not reloaded. They still name the Antigravity path, which now resolves through the symlink.
- Public hostname and auth path are unchanged: `vocab.nodezjc12348888.xyz`. Historical Cloudflare/Authentik publication notes remain in `ops/projects/cloudflare-edge/DEPLOYMENT_LEDGER.md`.

### Rollback

1. Remove the Antigravity compatibility symlink.
2. Move the product tree back to `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/projects/ielts-vocab-hub`.
3. Do not unload or rewrite LaunchAgents unless a separate L3 repair is opened.

## Historical public publication

See `ops/projects/cloudflare-edge/DEPLOYMENT_LEDGER.md` entries dated 2026-08-14
for the Vocab Atelier public BYOK workspace, notes upgrade, and Authentik
publication. Those entries still mention the old Antigravity product root; that
path is now the compatibility symlink above.
