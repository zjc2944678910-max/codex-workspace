# Sub2API Deployment Ledger

## 2026-06-18: New Antigravity Account Group Binding

Live host: `107.175.140.175`

### Changes

- Bound newly imported Antigravity accounts `62/9999`, `63/8888`, and
  `65/7777` to `antigravity-default-1` (group id `5`).
- No service restart, image rollout, compose edit, or credential change.
- Updated `runbooks/oauth-account-routing-and-opencode.md` with a reusable
  fast path for future Gemini / Antigravity account imports.

### Evidence On VPS

- `/root/codex-repair-sub2api-bind-antigravity-20260618T110802+0800`

### Verification

- Before: accounts `62`, `63`, and `65` showed no explicit group membership.
- After: all three showed `5:antigravity-default-1`.
- Post-repair `codex_antigravity` `/v1/chat/completions` smoke returned HTTP
  200 for `claude-sonnet-4-6`.

### Rollback

```sql
delete from account_groups where (account_id, group_id) in ((62,5),(63,5),(65,5));
```

## 2026-06-16: OpenCode Chat Completions And Account Routing Repair

Live host: `107.175.140.175`

Access path used:

```bash
ssh -o ProxyCommand="ssh home-nas-wg nc %h %p" root@107.175.140.175
```

### Changes

- Built and deployed `sub2api:antigravity-chatcc-20260616T144111`.
- Updated `/opt/sub2api/docker-compose.yml` to use that image.
- Set `ANTIGRAVITY_USER_AGENT_VERSION=2.1.4` for the `sub2api` service.
- Added `/v1/chat/completions` support for Antigravity accounts in the custom
  image, so OpenCode can use OpenAI-compatible Chat Completions against
  Antigravity-backed Claude models.
- Confirmed `codex_gemini` routes to group `gemini-default` and
  `codex_antigravity` routes to group `antigravity-default-1`.
- Added newly imported Antigravity accounts to `antigravity-default-1` after
  they were found to be active but ungrouped.

### Evidence On VPS

- `/root/codex-repair-sub2api-gemini-oauth-20260616T113727+0800`
- `/root/codex-repair-sub2api-new-accounts-20260616T195325+0800`

### Verification

- Container health reported `healthy`.
- `/v1/chat/completions` non-stream responses returned HTTP 200 for
  `claude-opus-4-6-thinking`.
- `/v1/chat/completions` stream responses returned OpenAI-style SSE chunks and
  `[DONE]`.
- Tool-schema requests returned HTTP 200 after schema cleanup.
- Newly grouped Antigravity account `60 zjc` successfully served
  `codex_antigravity` traffic.
- Gemini account group membership for the new Gemini accounts was confirmed.

### Rollback

Image rollback:

```bash
cd /opt/sub2api
# Restore a docker-compose.yml backup from the repair evidence directory, or
# set image back to:
#   sub2api:gemini-chatcc-schemafix-20260616T1356
docker compose up -d --no-deps sub2api
```

Account-group rollback for the 2026-06-16 new-account grouping:

```sql
delete from account_groups where (account_id, group_id) in ((58,5),(60,5));
```

To remove only a validation-blocked Antigravity account from scheduling while
keeping the account record:

```sql
delete from account_groups where account_id = 58 and group_id = 5;
```

## 2026-06-17: CF Fronting Landing And Gemini Quota Root Cause

Synced from claude-workspace ops notes. No code/deploy change in this entry
beyond the Cloudflare panel work described below.

### CF Fronting For `sub.` (manual via Cloudflare panel)

- Problem: `sub.nodezjc12348888.xyz` was previously grey-cloud (DNS only), so the
  public path only reached non-standard ports `:8443` / `:20002`; client networks
  often blocked those, so the panel would not open.
- Fix (option 1, done by hand in the CF dashboard):
  1. Turn the `sub` A record to **orange cloud (proxied)**.
  2. Copy the `api` **Origin Rule (Destination Port → 8443)** to also match `sub`.
  3. **Cover `sub` with the edge certificate** (Universal SSL `*.nodezjc12348888.xyz`
     or add `sub` to the Advanced cert). This step is the key fix: orange cloud
     alone kept returning `403 Edge IP Restricted` because the cert did not yet
     cover the new hostname.
- Verify: `https://sub.nodezjc12348888.xyz/` → 200, title `Sub2API - AI API Gateway`;
  `/api/v1/auth/me` → 401 (correct unauthenticated response).
- Rollback: set the `sub` DNS record back to **DNS only (grey cloud)** to drop the
  public path; the local tunnel on `18080` is unaffected.

### CF Credential State (for troubleshooting)

- acme domain conf `~/.acme.sh/nodezjc12348888.xyz_ecc/*.conf` has a scoped
  `CF_Token` with **DNS:Edit only** — it cannot read or change Rulesets / Origin Rules.
- `account.conf` `SAVED_CF_Key` / `SAVED_CF_Email` (Global Key) is **invalid**
  (API returns `9103`).
- Scripting Origin Rule / edge cert changes needs a new token with
  **Config Rules / Rulesets:Edit** scope.

### Gemini Full Rate-Limit Root Cause (fixed by user, not in this session)

- Symptom: every model except `gemini-2.5-flash` returned `429 RESOURCE_EXHAUSTED`;
  user reported no usage but still throttled.
- Root cause: the gateway's own `scheduled_test_plans` self-test was burning quota,
  not user traffic (inference-path client IP was only the docker-internal
  `172.19.0.1`, zero external).
  - Old plans: 5 entries using `gemini-3.1-pro-preview`, cron `*/5` (every 5 min),
    plus `oauth_smart_retry attempt/60` on failure.
  - What it burned: the **Google Code Assist OAuth backend
    `cloudcode-pa.googleapis.com` per-account × per-model daily request quota (RPD)**,
    tier `google_ai_pro`. Counted per request, rolling window; poking the already
    exhausted preview every 5 min kept pushing the reset window back (7h → 9h),
    never recovering. `gemini-2.5-flash` was not in the test plan, so it stayed usable.
- Fix (done by user): test plans changed to `gemini-2.5-flash` /
  `gemini-3.5-flash-low` / `claude-sonnet-4-6`, cron relaxed to `*/30` and `0 * * * *`,
  preview plans deleted. Preview quota recovered ~8h after the burn stopped.

### Residual Risk

- The sub2api panel is now publicly reachable (was tunnel-only). Harden login/auth
  (strong password, CF Access, or IP allowlist); do not leave it bare.
- `new-api` (`api.` subdomain) is also public and shares the account pool; watch
  whether its traffic also hits Gemini.
