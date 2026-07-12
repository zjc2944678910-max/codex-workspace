# Codex-Dedicated Account-Data Import Runbook

Use this runbook to import user-supplied Sub2API account-data exports into the
Codex-dedicated relay. It is intentionally separate from the shared-instance
Gemini and Antigravity routing runbook.

## Scope And Safety Gate

Target only this isolated service unless the user explicitly names another
target:

- host: `107.175.180.163`
- application: `sub2api-codex`
- database container and database: `sub2api-codex-postgres` /
  `sub2api_codex`
- local application API: `http://127.0.0.1:8081`
- intended default OpenAI group: `openai-default` (confirm its live id; it was
  group `5` during the 2026-07-12 import)

Do not touch the shared `sub2api` service, its PostgreSQL database, proxy
configuration, API keys, images, or runtime configuration.

Classify the operation before acting:

- L2 read-only: source classification, SSH inspection, service health checks,
  PostgreSQL `select` queries, endpoint/source inspection, and backup catalog
  validation.
- L3 repair execution: copying raw account data to the server, creating a
  database dump, posting an import, deleting accounts, or deleting temporary
  credential material.

Before L3, record the target, reason, risks, rollback method, verification
method, and explicit authorization. Do not execute L3 work until the user has
said `进入修复阶段`.

Never put OAuth access tokens, refresh tokens, API keys, cookies, raw account
JSON, administrator passwords, or administrator login responses into tracked
files, shell output, chat, or model-review packets.

## Classify The Input First

Do not trust the file name. A file described as a card-code export can instead
contain newline-delimited Sub2API account objects.

Before choosing an import endpoint, inspect the format locally and produce only
non-secret aggregates:

1. Count the records after any title or non-JSON preamble.
2. Confirm that each account record is valid JSON and identify its `platform`
   and `type` without printing `credentials`.
3. Determine whether proxy data or `proxy_key` references are present.
4. Calculate the count of unique access-token fingerprints and the collision
   count against the target without writing raw tokens to reports.
5. Record expiry and refresh-token availability as counts or ranges only.

Use `POST /api/v1/admin/accounts/data` for Sub2API account-data exports. Do
not substitute a card-code workflow or a specialized session-import endpoint
merely because the file name is misleading. If the data is actually card codes
or another unsupported format, stop and obtain a format-specific plan.

## Read-Only Preflight

Use the application's dedicated containers, not the shared instance. First
confirm the target is healthy:

```bash
docker inspect -f '{{.Name}}|{{.State.Status}}|{{.State.Health.Status}}' \
  sub2api-codex sub2api-codex-postgres sub2api-codex-redis
curl --fail --silent --show-error http://127.0.0.1:8081/health
```

Capture target account count, maximum id, and the destination group without
selecting credentials:

```bash
docker exec sub2api-codex-postgres \
  psql -U sub2api_codex -d sub2api_codex -Atc "
select count(*), max(id)
from accounts
where deleted_at is null;"

docker exec sub2api-codex-postgres \
  psql -U sub2api_codex -d sub2api_codex -Atc "
select id,name,platform
from groups
where name = 'openai-default'
order by id;"
```

The preflight must establish all of the following before importing:

- the account record count and unique-token count match the source inventory;
- source access-token fingerprints do not collide with non-deleted target
  accounts;
- the intended group exists and its current id is known;
- source proxy behavior is understood; do not introduce proxies implicitly;
- the source expiry behavior is known, especially whether refresh tokens exist.

## Evidence And Backup

Create a root-only evidence directory on the VPS before copying raw material.
The raw source is sensitive; the later reports and rollback script must not be.

```bash
umask 077
REPAIR_DIR="/root/codex-repair-sub2api-codex-import-$(date +%Y%m%dT%H%M%S%z)"
mkdir -p "$REPAIR_DIR"/{input,backup,reports,rollback}
chmod 700 "$REPAIR_DIR" "$REPAIR_DIR"/{input,backup,reports,rollback}
```

Create and validate a custom-format database dump before import:

```bash
docker exec sub2api-codex-postgres \
  pg_dump -U sub2api_codex -d sub2api_codex -Fc \
  > "$REPAIR_DIR/backup/sub2api-codex-before-import.dump"

docker exec -i sub2api-codex-postgres pg_restore -l \
  < "$REPAIR_DIR/backup/sub2api-codex-before-import.dump" \
  > "$REPAIR_DIR/reports/backup-catalog.txt"
```

Also save non-secret before-state reports: account count and maximum id,
destination group, source record count, token-fingerprint collision count, and
the intended batch marker. Do not save raw account data in `reports/`.

## L3 Import Procedure

Perform this section only after explicit repair authorization.

1. Generate a unique batch marker and idempotency key. Preserve existing
   account `extra` fields, and add the batch marker under a dedicated key such
   as `codex_sub2api_import_batch`.
2. Build the account-data request from the validated source in the root-only
   evidence directory. Do not include a proxy payload when the source does not
   contain proxy data.
3. Call `POST /api/v1/admin/accounts/data` using the application's current
   account-data handler contract. Pass `skip_default_group_bind=false` when the
   accounts must bind to the default OpenAI group.
4. Capture only the response summary in `reports/import_result.json`: created,
   reused, failed, and error counts. Restrict the file to owner read/write.
5. Stop on any account or proxy failure. Do not retry with a new idempotency key
   until the error and target state have been inspected.

The import response alone is not acceptance evidence. It must be followed by
the database and health checks below.

## Post-Import Acceptance

Query by the batch marker and only select operational metadata. The following
query verifies account type, scheduler state, expiry policy, and proxy state
without reading credentials:

```bash
BATCH_MARKER='replace-with-the-import-batch-marker'

# Feed variable-bearing SQL through standard input. `psql` does not interpolate
# `:'batch_marker'` when the SQL is supplied through its `-c` option.
docker exec -i sub2api-codex-postgres \
  psql -U sub2api_codex -d sub2api_codex -At -F $'\t' \
  -v "batch_marker=$BATCH_MARKER" <<'SQL'
select id,platform,type,status,schedulable,
       coalesce(to_char(expires_at at time zone 'UTC',
                        'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'),''),
       auto_pause_on_expired,coalesce(proxy_id::text,'')
from accounts
where deleted_at is null
  and extra ->> 'codex_sub2api_import_batch' = :'batch_marker'
order by id;
SQL
```

Verify each imported account has exactly one expected group membership:

```bash
docker exec -i sub2api-codex-postgres \
  psql -U sub2api_codex -d sub2api_codex -At -F $'\t' \
  -v "batch_marker=$BATCH_MARKER" <<'SQL'
select a.id,count(ag.group_id),
       coalesce(string_agg(g.id::text || ':' || g.name, ',' order by g.id),'')
from accounts a
left join account_groups ag on ag.account_id = a.id
left join groups g on g.id = ag.group_id
where a.deleted_at is null
  and a.extra ->> 'codex_sub2api_import_batch' = :'batch_marker'
group by a.id
order by a.id;
SQL
```

Accept the batch only when all of the following are true:

- API-created count and marker-selected account count match the source count.
- The total non-deleted account count changes by the expected amount.
- Every imported account has the intended platform/type, is `active`, is
  schedulable, has no unexpected proxy association, and has the expected expiry
  auto-pause setting.
- Each imported account has one membership in the intended current group.
- The three dedicated containers remain healthy and `/health` returns HTTP 200.

Write the imported ids, non-secret account metadata, before/after totals, and
PASS/FAIL checks under `reports/` with mode `600`.

## Rollback

Keep the database dump as the full recovery option, but generate a narrow
application-level rollback script for the current batch as well.

The rollback script must:

1. contain a fixed expected id set and a fixed batch marker;
2. query the database first and refuse to run if any marked account id is not in
   that expected set;
3. obtain `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the running application
   container only in memory;
4. authenticate through `/api/v1/auth/login` without writing the token to disk;
5. call `DELETE /api/v1/admin/accounts/:id` one account at a time;
6. verify that no active account remains for the batch marker; and
7. be root-only (`chmod 700`) and syntax-checked before it is retained.

Do not use a broad SQL `delete` as the normal rollback path. Do not execute the
rollback merely because it exists; it is another L3 action requiring explicit
authorization.

## Sensitive Material Lifecycle

Keep these items:

- pre-import database dump and validated catalog;
- non-secret before/after reports, imported id list, and API result summary;
- the scoped rollback script and its checksum; and
- a cleanup manifest recording the decision for each candidate path.

Treat these as sensitive temporary material:

- raw source exports and normalized NDJSON;
- generated import payloads and requests;
- administrator login responses; and
- access-token fingerprint scratch files.

The import request and general L3 authorization do not automatically authorize
deletion of those files. Create a cleanup manifest, retain the sensitive files
with owner-only permissions, and delete them only after the user explicitly
authorizes that deletion. Do not delete the backup, non-secret reports, or
rollback script as part of temporary-file cleanup.

## Expiry And Renewal Risk

Some OpenAI OAuth exports have no refresh token. For those accounts, record the
expiry range and confirm `auto_pause_on_expired=true`; they will stop scheduling
at expiry and cannot renew without a separate authorized refresh or replacement
operation. Treat this as a residual operational risk, not an import failure.

## Closeout

Add a concise, secret-free entry to `DEPLOYMENT_LEDGER.md` containing:

- target isolation and endpoint used;
- source and import totals;
- before/after account totals and imported id range;
- group, scheduler, proxy, expiry, and health verification;
- evidence, dump, and rollback-script paths; and
- residual expiry and temporary-material cleanup status.

For a historical example, see the 2026-07-12 Codex-dedicated account-data
import entry in the deployment ledger.
