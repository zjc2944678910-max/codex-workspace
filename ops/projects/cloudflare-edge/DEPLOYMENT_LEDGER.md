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

## 2026-08-14 — Learning notes and Access identity upgrade (staged)

- Scope: Markdown notebooks, versioned autosave, hybrid local search, Markdown/ZIP migration, AI note context and confirmed AI drafts, stable Access-email data identity, and one-time legacy anonymous-data claim.
- Product root: `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/projects/ielts-vocab-hub`
- Rollback bundle: `rollback/vocab-notes-20260814-093420/` (mode `0700`), containing pre-change code and all 14 user databases/state directories.
- Verification: 43 Python tests, Markdown safety tests, Python/JavaScript syntax checks, and isolated desktop/mobile browser acceptance passed with zero console errors.
- Data boundary: note bodies, revisions, draft sizes, and chat-note links remain per-user on this Mac. API keys and pending AI drafts are excluded from data export.
- Access status: application support is implemented, but enforcement must remain disabled until the owner supplies and confirms the invitation email allowlist and the Access application/policy is verified.
- Current public behavior at staging time: HTTPS `200` through the existing tunnel; anonymous-cookie compatibility remains enabled to avoid locking out existing users before the allowlist is confirmed.

### Rollback

1. Restore the staged product files from the rollback bundle's `code/` directory.
2. Restart only `com.vocabatelier.public`; do not restart or alter unrelated services.
3. If Access enforcement was enabled, disable the `vocab.nodezjc12348888.xyz` Access policy or set `IELTS_VOCAB_REQUIRE_ACCESS=0` before restarting the public service.
4. Preserve all user databases and new note tables; schema migration is additive and rollback must not delete notes or backups.

## 2026-08-14 — Vocab Authentik publication and single-user enforcement

- Hostname: `vocab.nodezjc12348888.xyz`
- Public route: proxied Cloudflare `A` record to the VPS, with the Vocab-only Origin Rule rewriting HTTPS origin traffic to port `8443`.
- VPS route: the dedicated Nginx vhost performs Authentik forward authentication, then proxies only to the Mac reverse-SSH origin at `127.0.0.1:29148`.
- Auth route: the embedded Authentik outpost is reached only through the existing private VPS listener at `127.0.0.1:29000`.
- Identity: Authentik application `vocab-atelier` has a direct one-user policy binding and a 30-day session. The gateway remains fail-closed and derives the per-user data key from Authentik's stable UID when the upstream email attribute is empty.
- Allowlist: the local runtime contains one approved email and its corresponding Authentik username. No plaintext account identifier is recorded in this ledger.
- Security mitigation: the Vocab Nginx subrequest now overwrites `X-Original-URI`, and the application rejects Authentik responses without a stable UID or an allowlisted email. This is scoped mitigation for the installed Authentik `2026.2.1`; no shared Authentik upgrade was performed.
- Legacy data: the authenticated account reports legacy anonymous data as available for explicit claim. It was not automatically merged.
- Previous Cloudflare Tunnel: retained as an unused rollback path; the live `vocab` DNS record no longer targets it.

### Verification

- Unauthenticated public requests return `302` to the Vocab Authentik flow; a client-supplied `X-Original-URI` receives the same `302` and does not reach the app.
- A real Chrome session loaded the complete Vocab Atelier notes workspace, and `/api/account/status` returned `authenticated=true` with `identity_mode=access`.
- Direct local checks returned `401` for no identity and for an unapproved identity, and `200` for the approved Authentik identity path.
- Nginx configuration validation passed and both private reverse listeners responded.
- Product verification passed: 51 Python tests, Markdown renderer tests, Python compilation, and JavaScript syntax checks.

### Backups and rollback

- Authentik database backup on the NAS: `/var/backups/vocab-authentik/20260814T142203+0800/`.
- VPS Nginx and Cloudflare DNS evidence: `/var/backups/vocabatelier-auth-20260814-125023/`.
- Local LaunchAgent backup: `rollback/vocab-authentik-20260814-125023/com.vocabatelier.public.before-enforcement.plist`.
- Pre-UID gateway files: `rollback/vocab-authentik-20260814-125023/local-product/`.
- Roll back in this order: restore the Vocab Nginx vhost and DNS record from the VPS bundle, restore the public LaunchAgent and gateway files, reload only the Vocab services, then remove only the `vocab-atelier` application/provider binding if the Authentik change itself must be reverted.
- Preserve all visitor databases and note data during rollback.
