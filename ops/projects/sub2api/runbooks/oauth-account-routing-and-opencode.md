# Sub2API OAuth Account Routing And OpenCode Runbook

Use this runbook when Sub2API accounts test green in the admin UI but OpenCode
or `/v1/chat/completions` cannot use them, or when newly imported Gemini /
Antigravity OAuth accounts do not appear in scheduling.

## Safety Gate

Classify live work on this VPS as:

- L2 read-only: SSH checks, `docker ps`, `docker logs`, PostgreSQL `select`
  queries, health checks, and config inspection.
- L3 repair execution: `insert`, `update`, `delete`, compose edits, image
  rollouts, service restarts, account status resets, or rollback.

Before L3, state the repair target, reason, risk, rollback, verification, and
whether the user has explicitly said `进入修复阶段`.

Never paste API keys, OAuth tokens, refresh tokens, cookie values, or raw
credential JSON into tracked docs or chat.

## Stable Access

Preferred SSH command:

```bash
ssh -o ProxyCommand="ssh home-nas-wg nc %h %p" root@107.175.140.175
```

Quick service check:

```bash
docker ps --filter name=^/sub2api$ --format "{{.Image}} {{.Status}}"
docker exec sub2api-postgres pg_isready -U sub2api -d sub2api
```

Expected repaired baseline:

- Image: `sub2api:antigravity-chatcc-20260616T144111`
- Health: `healthy`
- Compose env: `ANTIGRAVITY_USER_AGENT_VERSION=2.1.4`

Check the env:

```bash
docker exec sub2api printenv ANTIGRAVITY_USER_AGENT_VERSION
```

## Known Routing Facts

API keys and groups as of the 2026-06-16 repair:

| API key name | Key id | Target group | Group id | Platform |
| --- | ---: | --- | ---: | --- |
| `codex_gemini` | 6 | `gemini-default` | 4 | `gemini` |
| `codex_antigravity` | 7 | `antigravity-default-1` | 5 | `antigravity` |

Known useful account groups:

| Group | Purpose |
| --- | --- |
| `gemini-default` | Gemini OAuth accounts used by `codex_gemini` |
| `antigravity-default-1` | Antigravity OAuth accounts used by `codex_antigravity` |
| `antigravity-default-2` | Spare Antigravity group; do not assume OpenCode uses it |

## Read-Only Triage

Use short PostgreSQL queries and avoid selecting `credentials`.

Find relevant accounts:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select id,name,platform,type,status,schedulable,
       coalesce(error_message,''),
       coalesce(last_used_at::text,''),
       coalesce(updated_at::text,'')
from accounts
where name in ('xuan','xuan41445@gmail.com','zjc','zjc2944678910@gmail.com')
   or id in (57,58,59,60)
order by id;"
```

Check memberships:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select a.id,a.name,a.platform,
       coalesce(g.id::text,''),
       coalesce(g.name,''),
       coalesce(ag.priority::text,'')
from accounts a
left join account_groups ag on ag.account_id = a.id
left join groups g on g.id = ag.group_id
where a.id in (57,58,59,60)
order by a.id,g.id;"
```

Check API key routing without printing keys:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select k.id,k.name,k.status,
       coalesce(k.group_id::text,''),
       coalesce(g.name,''),
       coalesce(g.platform,'')
from api_keys k
left join groups g on g.id = k.group_id
where k.deleted_at is null
order by k.id;"
```

Check group members:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select a.id,a.name,a.platform,a.status,a.schedulable,
       coalesce(a.error_message,''),
       ag.priority
from accounts a
join account_groups ag on ag.account_id = a.id
where ag.group_id in (4,5)
order by ag.group_id,a.id;"
```

Recent log patterns:

```bash
docker logs --since 30m sub2api 2>&1 \
  | grep -E 'account_id.: (57|58|59|60)|VALIDATION_REQUIRED|SERVICE_DISABLED|Invalid bearer|version.*supported|All available accounts exhausted' \
  | tail -120
```

## Error Decision Table

| Symptom | Evidence | Meaning | Action |
| --- | --- | --- | --- |
| Admin test works but OpenCode cannot use the new account | Account is `active` but has no `account_groups` row for the API key group | Scheduler cannot see the account | Add group membership after L3 approval |
| `All available accounts exhausted` in OpenCode | Logs show every scheduled account failed or was unavailable | Usually wrong platform path, auth error, or all accounts blocked | Inspect per-account upstream errors before changing config |
| `Invalid bearer token` on Antigravity via `/v1/chat/completions` | Logs show Antigravity account tried through generic Anthropic path | Chat Completions was routed to the wrong upstream adapter | Use repaired image `sub2api:antigravity-chatcc-20260616T144111` |
| `This version of Antigravity is no longer supported` | HTTP 200 body contains upgrade message | Antigravity client version is stale | Set `ANTIGRAVITY_USER_AGENT_VERSION=2.1.4` and restart `sub2api` |
| `VALIDATION_REQUIRED` or `Verify your account to continue` | Upstream 403 with Google validation URL | Google account needs user verification | User must complete verification, then retest; optionally remove account from scheduling until fixed |
| `SERVICE_DISABLED` for `cloudaicompanion.googleapis.com` | Upstream 403 says Gemini for Google Cloud API disabled | Google Cloud Code Assist/Gemini API not enabled or not propagated | Enable the service in the linked Google project or wait, then retest |
| `Drive API scope not available (403)` during refresh | Logs mention Drive API 403 but account still refreshes | Tier detection lacks Drive scope; may fall back | Not automatically fatal; focus on final account test result |

## L3 Repair: Add Missing Group Membership

Only run after the user says `进入修复阶段`.

Create evidence directory:

```bash
REPAIR_DIR="/root/codex-repair-sub2api-new-accounts-$(date +%Y%m%dT%H%M%S%z)"
mkdir -p "$REPAIR_DIR"
printf '%s' "$REPAIR_DIR" > /root/codex-repair-last-sub2api-new-accounts
```

Save before state:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select id,name,platform,status,schedulable,coalesce(error_message,'')
from accounts
where id in (57,58,59,60)
order by id;" > "$REPAIR_DIR/accounts-before.txt"

docker exec sub2api-postgres psql -U sub2api -d sub2api -Atc "
select a.id,a.name,a.platform,
       coalesce(g.id::text,''),
       coalesce(g.name,''),
       coalesce(ag.priority::text,'')
from accounts a
left join account_groups ag on ag.account_id = a.id
left join groups g on g.id = ag.group_id
where a.id in (57,58,59,60)
order by a.id,g.id;" > "$REPAIR_DIR/memberships-before.txt"
```

Add Antigravity accounts to the group used by `codex_antigravity`:

```sql
insert into account_groups (account_id, group_id, priority, created_at)
values (58,5,1,now()), (60,5,1,now())
on conflict (account_id, group_id) do update
set priority = excluded.priority;
```

Equivalent one-liner:

```bash
docker exec sub2api-postgres psql -U sub2api -d sub2api -v ON_ERROR_STOP=1 -c "
insert into account_groups (account_id, group_id, priority, created_at)
values (58,5,1,now()), (60,5,1,now())
on conflict (account_id, group_id) do update set priority=excluded.priority;"
```

No service restart is required for this membership repair.

Rollback:

```sql
delete from account_groups where (account_id, group_id) in ((58,5),(60,5));
```

Remove only a validation-blocked account from scheduling:

```sql
delete from account_groups where account_id = 58 and group_id = 5;
```

## L3 Repair: Reset Status After User Fixes OAuth Or Validation

Only reset status after the user has actually re-authorized or completed Google
validation. Resetting early just puts the account back into the failure loop.

Example:

```sql
update accounts
set status = 'active',
    error_message = null,
    updated_at = now()
where id in (57,58,59,60)
  and status = 'error';
```

Prefer narrowing the `where` clause to a single account id and the exact known
error message.

## Verification

Admin UI tests are useful, but also verify the API route that OpenCode uses.

Use a redacted API key from the admin UI or a secure shell variable. Do not
print it into logs or docs.

Antigravity / OpenCode-compatible smoke:

```bash
API_KEY='<redacted codex_antigravity key>'
curl -sS -m 90 -w '\nHTTP_STATUS:%{http_code}\n' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/v1/chat/completions \
  -d '{"model":"claude-opus-4-6-thinking","messages":[{"role":"user","content":"Say hi in one short sentence."}],"max_tokens":24,"stream":false}'
```

Expected:

- HTTP 200.
- Response object is `chat.completion`.
- Logs show `platform=antigravity`.
- New account ids eventually appear when the scheduler chooses them.

Gemini smoke:

```bash
API_KEY='<redacted codex_gemini key>'
curl -sS -m 60 -w '\nHTTP_STATUS:%{http_code}\n' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8080/v1/chat/completions \
  -d '{"model":"gemini-3.1-pro-preview","messages":[{"role":"user","content":"Say hi in one short sentence."}],"max_tokens":24,"stream":false}'
```

## OpenCode Provider Notes

OpenCode should use the public Sub2API base URL ending in `/v1`, for example:

```text
http://107.175.140.175:8080/v1
```

Do not use `localhost` or `127.0.0.1` as the OpenCode provider base URL unless
OpenCode itself is running on the VPS.

Recommended model names tested during the repair:

- Antigravity: `claude-opus-4-6-thinking`
- Gemini: `gemini-3.1-pro-preview`

For custom providers, keep the provider API key scoped to the intended group:

- `codex_antigravity` for Antigravity-backed Claude models.
- `codex_gemini` for Gemini models.

## 2026-06-16 Case Study

Observed sequence:

1. `codex_antigravity` worked in the admin account tester but OpenCode failed.
2. `/v1/chat/completions` initially fell through to the generic Anthropic path,
   causing Antigravity OAuth tokens to be sent to the wrong upstream.
3. A custom image fixed Antigravity Chat Completions conversion.
4. Antigravity then returned an upgrade message until
   `ANTIGRAVITY_USER_AGENT_VERSION=2.1.4` was set.
5. New Gemini accounts were already grouped into `gemini-default`.
6. New Antigravity accounts were active but ungrouped, so
   `codex_antigravity` could not schedule them.
7. Adding `(58,5)` and `(60,5)` to `account_groups` made account `60` usable.
8. Account `58` needed Google validation before it could pass.
9. After the user completed re-authorization/validation, the accounts passed
   admin tests.

Keep this distinction clear: group membership fixes scheduler visibility;
Google validation and disabled Google services must be fixed at the Google
account/project side.
