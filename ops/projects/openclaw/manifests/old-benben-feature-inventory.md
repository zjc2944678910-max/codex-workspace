# old benben Feature Inventory

Date: 2026-04-26
Source of truth: `ssh_live:oc-nas`
Mode: L2 read-only inventory

No production writes, restarts, user creation, webhook changes, or secret-value reads were performed.

## Current Live Shape

- Service: `openclaw-gateway.service`
- State: `active/running`
- Service user: `openclaw:openclaw`
- Working directory: `/var/lib/openclaw`
- State root: `/var/lib/openclaw/.openclaw`
- Gateway: `loopback`, port `18789`, mode `local`
- Runtime bundle: `/usr/lib/node_modules/openclaw`
- CLI: `OpenClaw 2026.4.9 (0512059)`
- Default model: `anyone/gpt-5.4`
- Memory V4 DB: `/var/lib/openclaw/.openclaw/workspace/memory_v4/memory_v4.db`

## Must Preserve Or Intentionally Replace

### Channel Runtime

- Feishu is enabled.
- Feishu DM policy is `pairing`.
- Feishu group policy is `allowlist`.
- Feishu has two allowed DM identities and one allowed group identity.
- Telegram is enabled in old config and has ten custom commands, but vNext Phase 1 defers Telegram activation.
- QQBot plugin is enabled in plugin entries, but channel config says `enabled=false`; treat QQBot as out of scope unless separately approved.

### Command Runtime

Observed CLI surfaces that matter for parity:

- `openclaw agent`
- `openclaw message`
- `openclaw status`
- `openclaw sessions`
- `openclaw logs`
- `openclaw gateway`
- `openclaw health`
- `openclaw system heartbeat`
- `openclaw recurring`
- `openclaw oneshot`
- `openclaw memory-ops`
- `openclaw promotion-queue`
- `openclaw identity-merge`
- `openclaw stable-trim`
- `openclaw nodes`
- `openclaw devices`
- `openclaw directory`

Required user-facing commands:

- `/new`
- `/reset`
- `/status`
- `/usage`
- model switches such as `/anyone`, `/codex`, `/flash`, `/hunter`, `/healer`, `/deepseek`, `/gpt4omini`, `/claude`
- `/memory` vNext owner-admin command surface

### Model And Provider Runtime

Providers present in old config:

- `anyone`, API mode `openai-responses`, two configured models.
- `openai`, API mode `openai-responses`, two configured models.
- `openrouter`, API mode `openai-completions`, six configured models.
- `deepseek`, API mode `openai-completions`, two configured models.
- `mimo`, API mode `openai-completions`, three configured models.
- `ollama`, API mode `ollama`, four configured models.

Auth/profile surface:

- One `openai-codex:default` OAuth auth profile exists.
- It contains OAuth material and must be treated as secret during migration.

### Memory Runtime

Memory stores present:

- `workspace/memory`
- `workspace/memory_v2`
- `workspace/memory_v3`
- `workspace/memory_v4`
- `workspace/memory-admin`

Memory V4 confirmed:

- `memory_atoms`: 37
- `session_deltas`: 4
- `review_items`: 486
- `candidate_atoms`: 378
- `entities`: 2
- `entity_aliases`: 4
- `relations`: 0
- `archive_sessions`: 83
- `archive_messages`: 84

vNext rule:

- Use V4 canonical atoms and Session Delta as the answer truth chain.
- Use V2/V3/projections/transcripts/raw archives only as migration evidence or rollback references.
- Do not reintroduce V2/V3 fallback.

### Tools And Execution

Old config has:

- Elevated tools enabled.
- Filesystem access not restricted to workspace.
- Exec security mode set to `full`.
- Exec ask mode set to `off`.
- Image and audio media tools enabled.
- Browser plugin enabled.
- Device/node pairing surfaces enabled by CLI.

vNext must change the safety model:

- Read-only actions can be autonomous when scope allows.
- Source writes, deletes, shell side effects, service changes, config changes, credential changes, and external posting must ask the owner first.
- Service restarts/config writes remain L3 gate actions.

### Automation Runtime

Old surfaces to preserve:

- Heartbeat controls through `openclaw system heartbeat`.
- Recurring jobs through `openclaw recurring`.
- One-shot reminders through `openclaw oneshot`.
- Cron run logs and token usage reports.
- Session memory review.
- Memory maintenance reports.

### Operator Surfaces

Old surfaces to preserve or replace:

- Gateway health.
- `openclaw status --usage`.
- `openclaw logs`.
- Session listing and cleanup.
- Device/node status.
- Web/control UI through gateway.
- Trace and memory-admin reports.

## Known Redesign Requirements

- Identity must be structural, not prompt-only.
- Every inbound message must be normalized into a message envelope before memory/model routing.
- The envelope must include channel, chat type, chat id, sender channel id, speaker entity id, viewer entity id, bot entity id, session key, and disclosure scope.
- Group privacy must block private/couple details rather than answering "不知道" when the memory exists but cannot be disclosed.
- Usage/token accounting must be first-class and not scattered through session logs only.
- Tool gates must be structural and auditable.

## Current Risks To Avoid Copying

- Old workspace root shows owner `UNKNOWN:staff`; do not copy this ownership drift into vNext.
- Old config enables broad tools and `exec.ask=off`; vNext must not inherit this for high-risk actions.
- Old service and env are tightly coupled to the production Feishu bot; vNext cannot run as a second active production webhook consumer.
- Old memory stores contain V2/V3/projection surfaces; vNext must not treat them as answer truth.
- Old runtime functionality is spread across bundle, workspace tools, systemd drop-ins, env, and patches; implementation must follow the inventory, not copy the old bundle blindly.

## Evidence

- `systemctl show openclaw-gateway.service`
- `stat` over selected service/config/workspace paths
- key-name-only parse of `/etc/openclaw/gateway.env`
- redacted parse of `/var/lib/openclaw/.openclaw/openclaw.json`
- redacted parse of `/var/lib/openclaw/.openclaw/auth-profiles.json`
- `sqlite3` schema and counts over Memory V4 DB
- `openclaw --help` and selected command help
