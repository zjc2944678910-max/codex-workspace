# Sub2API Deployment Ledger

## 2026-07-06: Codex-Dedicated Fresh Sub2API Instance

Live host: `107.175.180.163`

### Changes

- Created an isolated Codex-dedicated instance under `/opt/sub2api-codex`.
- Created a fresh source checkout from `https://github.com/Wei-Shaw/sub2api`
  under `/opt/sub2api-codex-src` at commit
  `759332aa926394d07587cea81901cbd318b328d6`.
- Built and deployed `sub2api:codex-fresh-20260706T132016` only for the
  `sub2api-codex` application container.
- Kept the existing shared instance under `/opt/sub2api` on
  `sub2api:responses-toolchain-ws-output-20260703T232310`.
- Created separate containers/data paths for the Codex instance:
  `sub2api-codex`, `sub2api-codex-postgres`, `sub2api-codex-redis`, and
  `/opt/sub2api-codex/{data,postgres_data,redis_data}`.
- Added an nginx origin server block for
  `codex-sub.nodezjc12348888.xyz` forwarding to `127.0.0.1:8081`.
- Created Cloudflare DNS `A` record
  `codex-sub.nodezjc12348888.xyz -> 107.175.180.163`, proxied.
- Created Cloudflare Origin Rule `codex-sub-port-8443` matching
  `https://codex-sub.nodezjc12348888.xyz/*` and overriding the destination
  port to `8443`.
- Created a new local Codex profile at `~/.codex/codex-sub2api.config.toml`
  and a root-only/new-instance API key secret outside tracked docs.

### Evidence On VPS

- `/root/codex-repair-sub2api-codex-20260706T125058+0800`

### Verification

- `sub2api-codex` reported `healthy` on
  `sub2api:codex-fresh-20260706T132016`.
- Existing `sub2api` remained `healthy` on
  `sub2api:responses-toolchain-ws-output-20260703T232310`.
- `http://127.0.0.1:8081/health` returned `{"status":"ok"}`.
- Local nginx SNI/origin check for
  `https://codex-sub.nodezjc12348888.xyz:8443/health` returned
  `{"status":"ok"}` from the VPS itself.
- Admin login on the new instance succeeded for the new admin user.
- The new `codex_main` API key returned `/v1/models` from the new instance.
- Public DNS for `codex-sub.nodezjc12348888.xyz` resolved through Cloudflare
  proxy IPs.
- `https://codex-sub.nodezjc12348888.xyz/health` returned `{"status":"ok"}`.
- Authenticated `https://codex-sub.nodezjc12348888.xyz/v1/models` returned
  9 models; the first listed model was `claude-fable-5`.

### Rollback

```bash
/root/codex-repair-sub2api-codex-20260706T125058+0800/rollback/rollback-sub2api-codex-to-pre-fresh-image.sh
```

## 2026-07-03: Responses Tool Continuation Repair

Live host: `107.175.180.163`

### Changes

- Built and deployed `sub2api:responses-toolchain-ws-output-20260703T232310`.
- Updated `/opt/sub2api/docker-compose.yml` to use that image and restarted only
  the `sub2api` container with `docker compose up -d --no-deps sub2api`.
- Routed HTTP `/v1/responses` tool-chain requests for OpenAI OAuth accounts
  through WSv2 when the request contains tools/tool choice or
  `previous_response_id` plus `function_call_output`.
- Preserved upstream `call_id` values on `previous_response_id` continuation
  requests so returned tool outputs match the original upstream tool call.
- Reconstructed non-stream HTTP responses from WS `response.output_item.done`
  events when the terminal `response.completed.response.output` was empty.
- Kept API keys, account groups, OAuth accounts, PostgreSQL, Redis, Cloudflare,
  and ordinary `/v1/chat/completions` routing unchanged.
- Supersedes failed intermediate images:
  `sub2api:responses-tool-continuation-20260703T195033`,
  `sub2api:responses-tool-continuation-20260703T201204`, and
  `sub2api:responses-toolchain-route-20260703T214630`.

### Evidence On VPS

- `/root/codex-repair-sub2api-responses-tool-continuation-20260703T193334+0800`

### Verification

- Focused Go tests passed for WSv2 output reconstruction, HTTP tool-chain WSv2
  routing, HTTP tool-output WSv2 routing, and `previous_response_id` call-id
  preservation.
- Final Docker image build completed successfully.
- Container reported `healthy`; disk remained below the emergency threshold
  after earlier cleanup (`/` at 64% used during final verification).
- Antigravity `/v1/chat/completions` smoke returned HTTP 200 for
  `claude-sonnet-4-6` and `gpt-oss-120b-medium`.
- Two-step Antigravity `/v1/responses` probe for `gpt-5.5` returned HTTP 200
  for both the initial forced function call and the follow-up
  `previous_response_id` + `function_call_output` request.
- Service logs for the probe showed `conn_reused=true` on the WS continuation.
- Last 10-minute log scan after deployment found zero matches for
  `No tool output found`, `Unsupported parameter`, `previous response not found`,
  and `missing_final_response`.

### Rollback

```bash
cd /opt/sub2api
# Restore:
# /root/codex-repair-sub2api-responses-tool-continuation-20260703T193334+0800/docker-compose.before-ws-output-final-20260703T234325+0800.yml
# or set the sub2api service image back to:
#   sub2api:responses-tool-continuation-20260703T211356
docker compose up -d --no-deps sub2api
```

## 2026-07-02: OpenCat Antigravity Responses Thought/Done Repair

Live host: `107.175.180.163`

### Changes

- Built and deployed final image
  `sub2api:opencat-responses-clean-20260702T155005`.
- Updated `/opt/sub2api/docker-compose.yml` to use that image and restarted only
  the `sub2api` container with `docker compose up -d --no-deps sub2api`.
- Filtered Antigravity Gemini `thought: true` parts out of user-visible
  `/v1/responses` output so OpenCat no longer sees upstream reasoning text as
  assistant content.
- Added accumulated text to `response.output_text.done.text`, matching strict
  OpenAI Responses clients that parse the terminal text event after rendering
  deltas.
- Kept API keys, account groups, OAuth accounts, PostgreSQL, Redis, Cloudflare,
  and `/v1/chat/completions` routing unchanged.
- Supersedes the intermediate image
  `sub2api:opencat-thought-filter-20260702T152830`.

### Evidence On VPS

- `/root/codex-repair-sub2api-opencat-thought-filter-20260702T152226+0800`

### Verification

- `go test ./internal/pkg/apicompat` passed in `golang:1.26.2-alpine`.
- Final image build completed successfully.
- Container reported `healthy`; `/health` returned `{"status":"ok"}`.
- OpenCat-shaped `/v1/responses` streaming request for `claude-sonnet-4-6`
  returned HTTP 200 with text `OK`, `response.output_text.done.text: "OK"`,
  no detected `User says` / `The user said` / `Chinese` reasoning leak, and
  no missing strict stream fields.
- Antigravity `/v1/models` returned HTTP 200 with no missing `id`, `object`,
  `created`, or `owned_by` fields across 11 returned models.
- `codex_antigravity` MCP smoke returned HTTP 200 for `gpt-oss-120b-medium`,
  `gemini-3.1-pro-high`, and `claude-opus-4-6-thinking`.
- Final log scan showed the verification requests as HTTP 200 and no
  `panic`, `fatal`, `forward_failed`, or `server_error` entries.

### Rollback

```bash
cd /opt/sub2api
# Immediate pre-final rollback:
# /root/codex-repair-sub2api-opencat-thought-filter-20260702T152226+0800/docker-compose.before-final.yml
#
# Full rollback to the previous same-day OpenCat compatibility image:
#   sub2api:opencat-compat-20260702T150705
docker compose up -d --no-deps sub2api
```

Source file backups are under:

```text
/root/codex-repair-sub2api-opencat-thought-filter-20260702T152226+0800/files-before/
```

## 2026-07-02: OpenCat Antigravity OpenAI-Compatibility Repair

Live host: `107.175.180.163`

### Changes

- Built and deployed `sub2api:opencat-compat-20260702T150705`.
- Updated `/opt/sub2api/docker-compose.yml` to use that image and restarted only
  the `sub2api` container with `docker compose up -d --no-deps sub2api`.
- Normalized Antigravity `/v1/models` responses to include OpenAI-compatible
  model fields required by strict clients: `object`, `created`, and `owned_by`.
- Adjusted Responses SSE serialization so zero-valued `sequence_number`,
  `output_index`, `content_index`, and `summary_index` are emitted on the event
  types where OpenAI-compatible clients may treat them as required.
- Kept API keys, account groups, OAuth accounts, PostgreSQL, Redis, Cloudflare,
  and `/v1/chat/completions` routing unchanged.

### Evidence On VPS

- `/root/codex-repair-sub2api-opencat-compat-20260702T142935+0800`

### Verification

- `go test ./internal/pkg/apicompat` passed in `golang:1.26.2-alpine`.
- New image build completed successfully.
- Container reported `healthy`; `/health` returned `{"status":"ok"}`.
- `codex_antigravity` MCP smoke returned HTTP 200 for `gpt-oss-120b-medium`,
  `gemini-3.1-pro-high`, and `claude-opus-4-6-thinking`.
- Antigravity `/v1/models` returned HTTP 200 with no missing `id`, `object`,
  `created`, or `owned_by` fields across the returned model list.
- Antigravity `/v1/responses` streaming with an OpenCat user agent emitted
  `response.created` with `sequence_number: 0`, `response.output_item.added`
  with `output_index: 0`, and `response.output_text.delta` with
  `output_index: 0` and `content_index: 0`.
- Antigravity `/v1/chat/completions` remained HTTP 200 for
  `gpt-oss-120b-medium`, `gemini-3.1-pro-high`, and
  `claude-opus-4-6-thinking`.

### Rollback

```bash
cd /opt/sub2api
# Restore:
# /root/codex-repair-sub2api-opencat-compat-20260702T142935+0800/docker-compose.before.yml
# or set the sub2api service image back to:
#   sub2api:antigravity-toolcfg3-20260623T004508
docker compose up -d --no-deps sub2api
```

Source file backups are under:

```text
/root/codex-repair-sub2api-opencat-compat-20260702T142935+0800/files-before/
```

## 2026-06-22: Antigravity Responses API Output Repair

Live host: `107.175.180.163`

### Changes

- Built and deployed `sub2api:antigravity-responses-20260622T172737`.
- Updated `/opt/sub2api/docker-compose.yml` to use that image and restarted only
  the `sub2api` container with `docker compose up -d --no-deps sub2api`.
- Added an Antigravity-specific `/v1/responses` forwarding path so Responses
  API requests use the Antigravity Claude-to-Gemini bridge instead of the
  generic Anthropic upstream path.
- Kept `/v1/chat/completions` behavior unchanged; no PostgreSQL, Redis,
  account, key, OAuth, or group-membership changes were made.

### Evidence On VPS

- `/root/codex-repair-sub2api-responses-20260622T170050+0800`

### Verification

- Compile-only check passed for `backend/internal/service` and
  `backend/internal/handler`.
- New image build completed successfully.
- Container reported `healthy`; `/health` returned `{"status":"ok"}`.
- `codex_antigravity` `/v1/responses` returned HTTP 200 with output text for
  `gemini-3.5-flash-low` and `claude-sonnet-4-6`.
- `codex_antigravity` `/v1/responses` streaming returned HTTP 200 and emitted
  `response.output_text.delta`.
- `codex_antigravity` `/v1/chat/completions` returned HTTP 200 with output text
  after the change.
- Recent `ops_error_logs` for Antigravity were empty after the deployment
  verification window.

### Rollback

```bash
cd /opt/sub2api
# Restore the compose backup from:
# /root/codex-repair-sub2api-responses-20260622T170050+0800/docker-compose.before.yml
# or set image back to:
#   sub2api:antigravity-chatcc-20260616T144111
docker compose up -d --no-deps sub2api
```

Source file backups are under:

```text
/root/codex-repair-sub2api-responses-20260622T170050+0800/files-before/
```

## 2026-06-15: Antigravity Default Model Mapping Fix

Live host: `107.175.140.175` (pre-IP-change; current `107.175.180.163`)

Promoted from DAILY (2026-06-15 L3 repair); not previously in this ledger.

### Changes

- Corrected Antigravity default models: removed unavailable models, added the
  missing 3.5 Flash, fixed display-name ↔ upstream-id mismatch. Truth source:
  upstream `cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels`
  (available set = 8: 2 Claude + 5 Gemini + GPT-OSS).
  - `3.5 Flash (High)`=`gemini-3-flash-agent`, `(Medium)`=`gemini-3.5-flash-low`,
    `(Low)`=`gemini-3.5-flash-extra-low`; `3.1 Pro (High)`=`gemini-pro-agent`
    (`gemini-3.1-pro-high` deprecated upstream); Sonnet/Opus 4.6 are Thinking versions.
- Code (3 files): `internal/pkg/antigravity/claude_types.go` (model list),
  `internal/domain/constants.go` (`DefaultAntigravityModelMapping`),
  `frontend/src/composables/useModelWhitelist.ts` (`antigravityModels` + presets).
- DB: cleared stale `model_mapping` for accounts 46/49/52 → all 5 antigravity
  accounts use the new default.
- Deploy: image `sub2api:antigravity-fix-20260615`, compose tag bump,
  `docker compose up -d sub2api`.

### Rollback

- Source `*.bak-20260615-213859`, compose `*.bak-20260615-215240`, mapping backup
  `/opt/sub2api-src-fix/.antigravity-mapping-backup-20260615-213859.json`;
  one-shot revert to old image `sub2api:codex-model-list-20260615`.

### Residual

- `ensureAntigravityDefaultPassthroughs` (account.go) injects deprecated
  `gemini-3.1-pro-high` for custom mappings; no account uses a custom mapping so
  it does not trigger.

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
