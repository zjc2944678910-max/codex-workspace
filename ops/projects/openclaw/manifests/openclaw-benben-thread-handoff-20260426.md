# OpenClaw Benben Thread Handoff

Date: 2026-04-26
Audience: a new Codex thread with no prior context
Status: ready for direct execution handoff

## 1. Goal

Rebuild benben as a new `openclaw-benben` instance instead of continuing to patch the old production benben runtime.

The current intended path is:

1. Keep old benben production service alive as rollback anchor.
2. Use a new NAS shadow instance for real environment development and validation.
3. Rebuild identity, privacy, Memory V4 answer path, usage, and tool gating in the new instance.
4. Only after validation, do a separate L3 Feishu production ingress cutover.

## 2. User Decisions Already Confirmed

These decisions are settled unless the user explicitly changes them:

- New instance name: `openclaw-benben`
- It is a shared life assistant for owner + partner, but primarily serves the owner.
- It should have its own personality, not be a faceless tool.
- It should distinguish owner, partner, benben, and other people correctly.
- It can be close and natural in DMs.
- It may reply proactively in groups when relevant, but must respect privacy.
- Long-term memory that must exist:
  - birthdays
  - schools
  - majors
  - exam plans
  - preferences
  - relationship history
  - gift preferences
  - communication rules / red flags
- Short-term memory:
  - today mood
  - recent plans
  - tasks just mentioned
- Memory behavior:
  - active memory capture allowed
  - owner has full view/edit/delete authority over all memory
  - partner does not get memory-admin permissions by default
- Final production entrance remains the current Feishu benben bot.
- Telegram is Phase 2, not Phase 1.
- `adminAI` is out of scope for Phase 1.
- High-risk tools must ask first:
  - source file writes/deletes/moves
  - shell side effects
  - service restarts
  - config writes
  - credential changes
  - external posting/login/account operations

## 3. Hard Constraints

- Do not touch `adminAI` in this phase.
- Do not use V2/V3 fallback for answers.
- Do not use projection/transcript/raw archive as answer truth.
- Do not hardcode private facts into code.
- Do not let old and new services both consume the same production Feishu ingress.
- Treat any future Feishu cutover as L3 with repair gate + preflight.
- Never print or commit secret values.

## 4. What Was Done In This Thread

### 4.1 Root repo design/inventory docs created

All under:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/openclaw/manifests/`

Created files:

- `openclaw-benben-vnext-design.md`
- `old-benben-service-inventory.json`
- `old-benben-secret-inventory.redacted.json`
- `old-benben-feature-inventory.md`
- `openclaw-benben-implementation-plan.md`
- `openclaw-benben-shadow-bootstrap-20260426.json`
- `openclaw-benben-thread-handoff-20260426.md`

Why:

- design doc captures target behavior and architecture
- service inventory captures old benben live state and paths
- secret inventory captures secret surfaces without values
- feature inventory captures what must be preserved or intentionally replaced
- implementation plan turns this into staged work
- shadow bootstrap manifest records the actual L3 NAS changes
- this handoff doc lets a fresh thread continue without prior context

### 4.2 NAS shadow instance was created

Host: `oc-nas`

New shadow instance:

- service: `openclaw-benben.service`
- user: `openclaw-benben`
- group: `users`
- state root: `/var/lib/openclaw-benben/.openclaw`
- config root: `/etc/openclaw-benben`
- gateway port: `18792`
- browser/control sidecar observed on `18794`

Old production instance was kept intact:

- service: `openclaw-gateway.service`
- still `active/running`
- still listening on `18789`
- also listening on `18791`
- not restarted
- not modified

### 4.3 Shadow config behavior

Shadow instance intentionally starts with production channel ingress disabled:

- `channels.feishu.enabled = false`
- `channels.telegram.enabled = false`
- `channels.qqbot.enabled = false`
- corresponding plugin entries for `feishu`, `telegram`, `qqbot` disabled

Why:

- final production entrance is still the current Feishu bot
- dual consumers are unsafe
- shadow is meant for safe runtime validation before cutover

### 4.4 Live verification completed

Confirmed on NAS:

- old service active/running
- shadow service active/running
- shadow `/health` returns `{"ok":true,"status":"live"}`
- CLI health returns `ok:true`
- shadow channels are configured but not running
- shadow listener present on `127.0.0.1:18792`
- secret values were not printed

### 4.5 Product repo local vNext core implemented

Repo:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`

Branch:

`codex/openclaw-benben-vnext-core`

Latest commit:

`d9018318d75b41f64b39355ed17735ec6971fb0a`

Latest commit message:

`test: add benben dry-run shadow preflight suite`

Core commit:

`3164adc2fd834b311691be0ef51af03ff3fbeec2`

Core commit message:

`feat: add openclaw-benben vnext dry-run core`

Local code location:

- `workspace/tools/openclaw-benben/`

Local test location:

- `workspace/tools/tests/openclaw-benben/`

Implemented locally:

- message envelope
- identity kernel
- privacy kernel
- Memory V4 wrapper
- usage ledger
- tool gate
- Feishu dry-run adapter
- command router
- memory command planner
- turn runner
- dry-run CLI
- dry-run suite with synthetic Feishu fixtures
- README and source-manifest registration

Key safety properties:

- Feishu adapter is dry-run only and does not send.
- No production ingress is enabled.
- No model call is made by default.
- No runtime commit is performed.
- `/memory` admin is owner-direct only.
- `/memory` mutations require confirmation and remain uncommitted.
- Trace/report/usage surfaces are sanitized and do not persist raw text, chat IDs,
  entity IDs, memory answers, tokens, or secrets.
- Memory answer truth is Memory V4 only; V2/V3/projection/transcript/raw archive
  are rejected as answer truth surfaces.
- Synthetic shadow-preflight suite covers owner status, owner memory mutation
  confirmation, partner memory-admin denial, project group status, and unknown
  sender reset denial.

Verification:

- `node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs`
  passed: 40 tests.
- Benben + Memory V4 + source-manifest aggregate regression passed: 68 tests.
- `node workspace/tools/openclaw-benben/dry-run-suite.mjs --json` passed 5
  synthetic cases with no send, no production ingress, no runtime commit, and no
  model call.
- `node --check` passed for benben `.mjs` files and source-manifest.
- `git diff --cached --check` passed before commit.

Shadow sync candidate manifest:

- `openclaw-benben-shadow-sync-candidate-20260427.json`
- contains 28 source files from product commit `d9018318d75b41f64b39355ed17735ec6971fb0a`
- aggregate sha256:
  `caae29566f693ef535ad6107f24210aa48e11677389d3a5fe824b2d42eb90013`
- candidate only; executing it on NAS is L3 and still requires `进入修复阶段`

## 5. Live NAS State At Handoff

### Production old benben

- service: `openclaw-gateway.service`
- state: `active/running`
- main PID observed during this thread: `1559349`
- ports: `18789`, `18791`

### Shadow benben

- service: `openclaw-benben.service`
- state: `active/running`
- enabled at boot: `disabled`
- main PID observed during this thread: `2141430`
- ports: `18792`, `18794`
- working directory: `/var/lib/openclaw-benben`

### Shadow files on NAS

- `/var/lib/openclaw-benben/.openclaw/openclaw.json`
- `/var/lib/openclaw-benben/.openclaw/auth-profiles.json`
- `/var/lib/openclaw-benben/.openclaw/workspace`
- `/var/lib/openclaw-benben/.openclaw/bootstrap/bootstrap-manifest.json`
- `/etc/openclaw-benben/secrets.env`
- `/etc/openclaw-benben/shadow.env`
- `/etc/openclaw-benben/secrets.inventory.json`
- `/etc/systemd/system/openclaw-benben.service`

## 6. Problems Hit And How They Were Resolved

### Problem 1: schema-invalid shadow config

Initial shadow config added custom keys like:

- `meta.shadowInstance`
- `meta.shadowName`
- `meta.createdAt`
- `meta.productionIngressEnabled`
- `tools.exec.shadowRequiresConfirmation`
- `plugins.entries.*.shadowDisabled`
- `tools.exec.ask = owner-confirm`

OpenClaw config validator rejected these.

Fix applied:

- removed all non-schema keys
- changed `tools.exec.ask` to valid value `always`
- kept shadow metadata in separate manifest JSON instead of strict OpenClaw config

### Problem 2: stale plugin path kept crashing shadow

Old config had a stale plugin load path:

- `plugins.load.paths` still referenced `.../workspace/plugins/local-lite-lane`

That path was invalid for shadow and caused restart loops.

Fix applied:

- removed `local-lite-lane` from `plugins.entries`
- removed it from `plugins.allow`
- filtered `plugins.load.paths` to existing paths only

Result:

- shadow gateway now starts cleanly and serves health on `18792`

## 7. What Was Not Done

- No Feishu production ingress cutover
- No Telegram enablement
- No real Feishu message tests through shadow
- No sync of commit `d9018318d75b41f64b39355ed17735ec6971fb0a` to the NAS shadow workspace
- No service/env/channel/systemd changes after the local vNext core checkpoint
- No migration of the local dry-run core into an active runtime bundle

## 8. Current Repos And Dirty State

### Root repo

Repo:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace`

State after local vNext core documentation update:

- clean before the 2026-04-27 documentation update
- this handoff and implementation plan were updated to reference product commit `d901831`

### Product repo

Repo:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`

Current branch after local vNext core checkpoint:

- `codex/openclaw-benben-vnext-core`

Current commit:

- `d9018318d75b41f64b39355ed17735ec6971fb0a`

Current state:

- clean after commit `d901831`

Important note:

- Do not sync this code to NAS shadow unless the user explicitly enters L3 by
  saying `进入修复阶段`.
- Do not enable Feishu, Telegram, or QQbot channels as part of local core work.

## 9. Options Considered And Rejected

### Rejected: keep patching old production benben

Reason:

- identity and memory bugs were already stacking up
- too much risk of continuing to patch production truth path

### Rejected: immediately replace old benben with new service

Reason:

- same Feishu bot cannot safely be consumed by two services at once
- a rushed ingress switch would create reply duplication / routing confusion risk

### Rejected: enable shadow Feishu immediately

Reason:

- would violate safe dual-consumer boundary before new runtime exists

### Rejected: use V2/V3/projections/raw transcript as truth

Reason:

- user explicitly rejected that
- vNext must be Memory V4 canonical-first

## 10. Best Immediate Next Step

The best next step is **not** another infrastructure tweak.

The best next step is to start building the new benben runtime logic against the shadow instance:

1. pick product repo as implementation repo
2. create a dedicated `openclaw-benben` code surface there
3. implement:
   - message envelope
   - identity kernel
   - privacy kernel
   - Memory V4 wrapper
   - usage ledger
   - tool gate
4. add unit tests first
5. only after that, sync new code into the shadow workspace and verify it on `18792`

## 11. Exact Highest-Priority Work Items

### Priority 1

Decide the actual code location in the product repo for vNext logic.

Practical default:

- stay in MJS for fastest compatibility with existing OpenClaw codebase
- add new modules under a dedicated benben/vnext path instead of patching the old huge bundle first

### Priority 2

Implement a strict normalized message envelope containing:

- `channel`
- `chat_type`
- `chat_id`
- `sender_channel_user_id`
- `speaker_entity_id`
- `viewer_entity_id`
- `bot_entity_id`
- `session_key`
- `scope`
- raw `text`

### Priority 3

Build identity mapping rules for:

- owner
- partner
- benben
- other DM peers
- ordinary groups
- project groups

The key behavior is that "我/你/她/他/我们" can no longer be inferred from text alone when channel identity is already known.

### Priority 4

Wire Memory V4 answer path so that:

- canonical atoms are first truth surface
- session delta supports short-term continuity
- blocked facts say "scope blocked" rather than pretending no memory exists
- `legacy_fallback_used=false`

## 12. Useful Commands For New Thread

### Inspect live services

```bash
ssh oc-nas 'systemctl is-active openclaw-gateway.service; systemctl is-active openclaw-benben.service'
```

### Check shadow health

```bash
ssh oc-nas 'curl -s http://127.0.0.1:18792/health'
```

### Inspect shadow config shape

```bash
ssh oc-nas 'sudo -n node --input-type=module' <<'NODE'
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('/var/lib/openclaw-benben/.openclaw/openclaw.json', 'utf8'));
console.log(JSON.stringify({
  gateway: c.gateway,
  channels: {
    feishu: c.channels?.feishu?.enabled,
    telegram: c.channels?.telegram?.enabled,
    qqbot: c.channels?.qqbot?.enabled,
  },
  plugins: {
    feishu: c.plugins?.entries?.feishu?.enabled,
    telegram: c.plugins?.entries?.telegram?.enabled,
    qqbot: c.plugins?.entries?.qqbot?.enabled,
  }
}, null, 2));
NODE
```

### Stop shadow if needed

```bash
ssh oc-nas 'sudo -n systemctl stop openclaw-benben.service'
```

### Tail shadow logs

```bash
ssh oc-nas 'sudo -n journalctl -u openclaw-benben.service -n 120 --no-pager --output=short-iso'
```

## 13. Assumptions The New Thread Should Keep

- User still wants NAS-first development, not local-only development.
- User still wants the current Feishu bot as final production entrance.
- User still wants Telegram deferred to Phase 2.
- User still wants owner-only memory-admin rights.
- User still wants old benben preserved until cutover is proven.

If any of these change, revisit the architecture and cutover plan immediately.
