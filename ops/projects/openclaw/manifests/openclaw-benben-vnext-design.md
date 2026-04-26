# openclaw-benben vNext Design

Date: 2026-04-26
Status: design draft, no live changes executed
Target instance name: `openclaw-benben`

## 1. Decision Summary

Build a new `openclaw-benben` instance instead of continuing to patch the current benben runtime.

The old OpenClaw/benben instance remains a read-only reference, rollback anchor, and migration evidence source until the new instance passes the acceptance matrix. It should not be deleted or mutated during design and inventory.

The new instance should be a complete OpenClaw-style personal/couple assistant for the owner and partner, with a cleaner runtime, Memory V4 as the only canonical long-term memory truth surface, stronger identity handling, stronger privacy boundaries, and a first-class usage/token ledger.

## 2. User Product Intent

The new benben is:

- A shared life assistant for the owner and partner.
- Primarily serving the owner.
- A companion with its own personality, not a faceless command bot.
- Close and natural in owner DM, partner DM, and groups, while still respecting privacy boundaries.
- A living assistant that can remember, plan, remind, summarize, organize, and execute approved actions.

The new benben must correctly distinguish:

- The owner.
- The partner.
- benben itself.
- Other group members.
- The current speaker in each channel.
- The subject being discussed when words like "我", "你", "他", "她", "我们" appear.

## 3. Confirmed Product Requirements

### Scope

- Build under a new NAS/service identity named `openclaw-benben`.
- Continue using the current Feishu benben bot as the final production entrance.
- Telegram support is deferred to Phase 2.
- `adminAI` is out of scope for the first build.
- The old OpenClaw/benben instance is logically deprecated, but kept as rollback/source evidence until cutover is proven.

### Memory

Must remember long-term:

- Birthdays.
- Schools.
- Majors.
- Exam plans.
- Preferences.
- Relationship history.
- Gift preferences.
- Communication rules and red flags.

Must remember short-term:

- Today mood.
- Recent plans.
- Tasks just mentioned.
- Session continuity across `/new` when appropriate.

Memory behavior:

- Active memory capture is allowed.
- Durable memory promotion must be auditable.
- The owner has the highest permission to view, modify, and delete all memory.
- The partner does not need memory-admin permissions by default.

### Channels

Must support:

- Feishu owner DM.
- Feishu partner DM.
- Feishu ordinary groups.
- Feishu project/work groups, if configured later.
- Web console.
- Telegram in Phase 2.

Behavior:

- It may proactively reply in groups when the topic is relevant.
- It should not dominate casual human chat.
- It chooses answer length based on context.
- It may proactively send reminders or summaries when useful.
- Quiet hours are not required initially; add later if needed.

### Tooling

Must support:

- NAS file reading and organization.
- Local execution.
- Scheduled tasks.
- Heartbeats.
- Auto summaries.
- Long-term planning.
- Web console.
- File management.
- Trace and debug surfaces.

High-risk actions must ask the owner first:

- Modify/delete/move source files.
- Execute shell commands with side effects.
- Restart services.
- Change production config.
- Change credentials or tokens.
- Send messages that may reveal private information.
- External posting, publishing, login, or account operations.

### Usage And Tokens

Must support:

- `/status`.
- `/usage`.
- Model switching.
- Token accounting per provider/model/session/channel/user.
- Cost estimation where model pricing is known.
- Provider quota display when available.
- Clear separation between local usage estimates and official provider account balances.

Secrets and API tokens:

- Must not be printed to terminal or committed.
- Must be migrated through env/secret files with redacted inventory.
- Telegram bot tokens are inventoried now but enabled in Phase 2.

## 4. Non-Goals For Phase 1

- Do not rebuild adminAI.
- Do not enable Telegram production delivery in Phase 1.
- Do not remove or delete the old benben instance.
- Do not use V2/V3/projection/transcript/raw archive as answer truth.
- Do not hardcode private names, birthdays, or relationship facts in code.
- Do not run two active Feishu webhook consumers for the same production bot at the same time.
- Do not weaken tool safety just to feel more autonomous.

## 5. Existing Capability Inventory To Preserve

This is the capability surface that the new instance must preserve or intentionally replace.

### Conversation Runtime

- Feishu message send/receive.
- Direct chat and group chat routing.
- `/new` and `/reset`.
- `/status`.
- `/usage codex`, `/usage openrouter`, `/usage deepseek`, and natural language quota prompts.
- Model switches such as `/codex`, `/flash`, `/hunter`, `/healer`, `/deepseek`, `/gpt4omini`, `/claude`, and `/anyone`.
- Progress notices for long-running tasks.
- Session logs and transcript storage.

### Memory Runtime

- Session startup memory routing.
- Short-term daily/current memory.
- Long-term owner, partner, and couple memory.
- Session review after `/new`.
- Promotion queues.
- Memory health reports.
- Memory explainability controls.
- Identity merge and memory ops commands.
- Memory V4 migration tools and canonical recall.

### Model And Provider Runtime

- Default model route: `anyone/gpt-5.4`.
- Main fallback chain.
- OpenAI/Codex/OpenRouter/DeepSeek/Anyone provider surfaces.
- Auth profile store.
- Provider registry.
- Usage snapshots and cost estimates.

### Automation Runtime

- Heartbeats.
- One-shot reminders.
- Recurring scheduled jobs.
- Cron run logs.
- Auto daily capture.
- Session memory review.
- Memory maintenance.

### Tool Runtime

- NAS file access.
- Device pairing / Mac node access.
- Browser relay.
- Finder narrow control.
- Content package workflows.
- OpenClaw CLI wrappers.
- Safe file write helpers.
- Deployment verification and healthcheck.

### Operator Surfaces

- Web console.
- Logs and trace.
- Health summaries.
- Ops dashboards.
- Rollback manifests.
- Deployment ledger.

## 6. vNext Architecture

### 6.1 Runtime Layout

Recommended NAS layout:

```text
/var/lib/openclaw-benben/.openclaw/
  openclaw.json
  auth-profiles.json
  agents/
  workspace/
  memory_v4/
  memory-admin/
  logs/
  trace/
  cron/
  rollback/

/etc/openclaw-benben/
  gateway.env
  providers.env
  feishu.env
  telegram.env          # Phase 2 only
  secrets.inventory.json

/etc/systemd/system/
  openclaw-benben.service
```

The new instance should use separate ports, state root, workspace root, logs, trace, and env files from the old service. The service marker should make it impossible to confuse old and new logs.

### 6.2 Message Envelope

Every inbound message must be normalized before memory or model routing:

```json
{
  "event_id": "provider event id",
  "channel": "feishu",
  "chat_type": "direct|group",
  "chat_id": "stable chat id",
  "sender_channel_user_id": "Feishu open_id/user_id",
  "speaker_entity_id": "entity:user:self|entity:person:partner|entity:person:<id>",
  "viewer_entity_id": "who will see the answer",
  "bot_entity_id": "entity:assistant:benben",
  "session_key": "stable scoped session key",
  "text": "raw user text",
  "scope": "owner_private|partner_private|couple_shared|ordinary_group|project_group",
  "delivery": {
    "reply_channel": "feishu",
    "reply_to": "chat id"
  }
}
```

This envelope is the fix for the current "我/你/他" confusion. The model should never infer speaker identity from text alone when a channel identity is available.

### 6.3 Identity Kernel

Responsibilities:

- Maintain channel identity bindings.
- Map Feishu sender IDs to stable entity IDs.
- Map group IDs to disclosure scopes.
- Provide pronoun hints to the model.
- Reject or downgrade memory queries when the viewer lacks permission.

Core entities:

- `entity:user:self`: owner.
- `entity:person:partner`: partner.
- `entity:assistant:benben`: benben.
- `entity:group:<id>`: groups.
- `entity:person:<id>`: other people.

Identity checks must run before:

- Memory recall.
- Tool execution.
- `/memory` operations.
- Proactive replies.
- External message delivery.

### 6.4 Memory Kernel

Truth hierarchy:

1. Memory V4 canonical atoms.
2. Memory V4 Session Delta for fresh/current session continuity.
3. Approved current-state memory surfaces generated from V4.
4. Legacy V2/V3/projections/transcripts/raw archives only as migration evidence or rollback references.

Hard rules:

- No V2/V3 fallback in answers.
- Raw archives are never answer truth surfaces.
- `memory_atoms` only come from review/promote paths.
- Active capture can create candidates/deltas, but durable promotion must remain auditable.

Memory scopes:

- `owner_private`: owner-only.
- `partner_private`: partner-only by default.
- `couple_shared`: visible to owner and partner, summarized carefully in groups.
- `ordinary_group`: only group-safe public facts.
- `project_group`: project-scoped facts only.

### 6.5 Privacy Kernel

Default matrix:

| Viewer | Owner private | Partner private | Couple shared | Group-safe shared |
| --- | --- | --- | --- | --- |
| Owner DM | Full | Allowed unless marked restricted | Full | Full |
| Partner DM | Hidden unless explicitly shared | Own facts | Full | Full |
| Ordinary group | Hidden | Hidden | Summary only, no intimate details | Full |
| Project group | Hidden unless project-relevant and allowed | Hidden | Usually hidden | Project facts only |
| Web console owner | Full admin | Full admin | Full admin | Full admin |

If privacy blocks a result, the assistant should say it cannot disclose that scope here, not pretend no memory exists.

### 6.6 Model Router

The router should be declarative rather than patched into a giant bundle:

```text
intent -> task class -> provider route -> model -> fallback policy -> usage ledger
```

Initial defaults:

- Main cloud model: `anyone/gpt-5.4`.
- Memory light/deep review: `anyone/gpt-5.4`.
- Manual Codex route: OpenAI/Codex profile.
- Local/lite routes can be added after core identity and memory are stable.

Fallback must be explicit. If a route falls back, the trace should show it.

### 6.7 Usage Ledger

Record one usage event for every model/tool call:

```json
{
  "ts": "iso timestamp",
  "event_id": "turn or job id",
  "session_key": "scoped session key",
  "channel": "feishu|web|telegram|cron",
  "actor_entity_id": "entity:user:self",
  "provider": "anyone|openai-codex|openrouter|deepseek",
  "model": "model id",
  "input_tokens": 0,
  "output_tokens": 0,
  "cache_read_tokens": 0,
  "cache_write_tokens": 0,
  "estimated_cost": null,
  "source": "agent|memory_review|heartbeat|cron|tool"
}
```

`/status` should show current session state. `/usage` should show aggregate usage and must not pretend local estimates are official provider account balances.

### 6.8 Tool Runtime

Tool actions are classified:

- Read-only: allowed when identity and scope permit.
- Low-risk writes to output/scratch: allowed with trace.
- Source file writes: ask owner.
- Deletion/move/rename: ask owner.
- Shell commands with side effects: ask owner.
- Service restart/config change: L3 repair gate.
- External posting/account operation: ask owner.

The new runtime should make this policy structural, not prompt-only.

### 6.9 Proactive Engine

Allowed initially:

- Reminders the owner explicitly asked for.
- Heartbeat checks.
- Session summaries.
- Memory maintenance summaries.
- Long-term plan nudges when relevant.
- Group replies only when directly useful or clearly invited by context.

Not enabled initially:

- Quiet-hour enforcement.
- Autonomous outreach to partner without owner-visible policy.
- Telegram delivery.
- Social posting.

### 6.10 Web Console

The console should expose:

- Current model and session.
- Memory recall/explain trace.
- `/memory` admin UI.
- Usage and token ledger.
- Scheduled jobs.
- File management with confirmation gates.
- Health status.
- Cutover/rollback status.

## 7. `/memory` Command Design

Owner permissions:

- `/memory search <query>`
- `/memory show <id>`
- `/memory edit <id>`
- `/memory delete <id>`
- `/memory approve <candidate>`
- `/memory reject <candidate>`
- `/memory scopes <entity>`
- `/memory explain on|full|off`

Partner default:

- No memory-admin powers in Phase 1.
- Normal conversation can still create candidates or session deltas.
- Any deletion/correction request from partner should be logged and escalated for owner review unless a stricter privacy policy is later defined.

Group behavior:

- `/memory` should not expose private memory in groups.
- Group memory commands should be rejected or limited to group-safe summaries.

## 8. Secret And Credential Migration

Credential sources to inventory, redacted:

- Existing gateway env.
- Existing Feishu app credentials.
- Existing provider env keys.
- Existing auth profiles.
- Existing gateway token.
- Existing node pairing token.
- Telegram bot token, Phase 2.
- Any proxy hook config path, without printing secret values.

Migration rules:

- Inventory names and presence, not values.
- Never print token values.
- Never commit tokens.
- Prefer secret/env files owned by the service user with restrictive permissions.
- Keep an encrypted or root-only rollback copy before switching.
- Token migration is L3 if performed on live NAS.

## 9. Cutover Strategy

Because the final production entrance is the same Feishu bot, two active webhook consumers must not process the same production bot events concurrently.

Safe sequence:

1. Build the new instance locally or on NAS without binding the production Feishu webhook.
2. Run local/unit tests for identity, privacy, Memory V4, `/memory`, usage, and tool gates.
3. Run shadow Feishu tests through controlled CLI delivery where possible.
4. Take a production preflight snapshot of old service, config, credentials, memory, and traces.
5. Disable or park old Feishu ingress.
6. Enable new `openclaw-benben` Feishu ingress.
7. Restart only the services declared in the L3 gate.
8. Run full real Feishu acceptance tests.
9. If any critical test fails, rollback ingress/env/service to old instance and do not mutate/downgrade the new V4 DB.

## 10. Acceptance Matrix

### Identity

- Owner DM: "你知道我是谁吗" returns owner identity.
- Owner DM: "你是谁" returns benben identity.
- Partner DM: speaker binds to partner, not owner.
- Group: speaker identity is preserved per sender.
- Pronoun tests do not confuse owner, partner, and benben.

### Long-Term Memory

- Owner birthday, school, major.
- Partner birthday, school, major.
- Exam plan, if canonical memory exists.
- Owner preferences.
- Partner preferences.
- Relationship history.
- Gift preferences.
- Communication rules and red flags.

### Short-Term Memory

- A just-mentioned task survives the appropriate `/new` review path.
- Today mood is recalled as current, not durable forever.
- Recent plans are distinct from stable facts.

### Privacy

- Owner DM can access owner-private and couple-shared facts.
- Partner DM cannot access owner-private facts unless explicitly shared.
- Ordinary group cannot reveal private/couple intimate facts.
- Project group cannot leak personal facts unrelated to the project.
- Blocked facts produce "scope blocked" style answers, not false "I do not know".

### Commands

- `/new`.
- `/reset`.
- `/status`.
- `/usage`.
- Model switches.
- `/memory` owner admin operations.
- `/memory` group safety behavior.

### Tooling

- Read-only file inspection.
- File management with confirmation.
- Scheduled one-shot reminder.
- Recurring task listing.
- Heartbeat run.
- Web console health view.
- Trace lookup for a turn.

### Usage

- Model usage is recorded.
- Session usage is visible.
- Cron/heartbeat usage is separated from chat.
- Provider/model are correct.
- Cost estimates are clearly labeled as estimates.

### Feishu Real Conversation Gate

Before final cutover is accepted:

- At least 20 visible owner DM turns.
- Partner DM identity and privacy test.
- Ordinary group privacy test.
- Project/group-safe test if a project group is available.
- At least one `/new` continuity test.
- At least one memory correction test.
- At least one usage/status test.
- Trace confirms no V2/V3 fallback and no raw archive truth surface.

## 11. Implementation Phases

### Phase 0: Read-Only Inventory

Output:

- Current old benben feature inventory.
- Current credential inventory, redacted.
- Current service/config/path inventory.
- Current Memory V4 DB inventory.
- Current Feishu identity map inventory.

No live writes.

### Phase 1: Core Skeleton

Output:

- New repo/workspace structure.
- Message envelope library.
- Identity kernel.
- Privacy kernel.
- Memory V4 adapter integration.
- Usage ledger schema.
- Unit tests.

No production Feishu cutover.

### Phase 2: Channel And Commands

Output:

- Feishu adapter.
- `/new`, `/reset`, `/status`, `/usage`, model switch commands.
- `/memory` owner admin commands.
- Web console MVP.
- Trace viewer MVP.

Telegram remains disabled unless separately approved.

### Phase 3: Tools And Automation

Output:

- Tool runtime permission gates.
- File management.
- Scheduled tasks.
- Heartbeats.
- Auto summaries.
- Long-term planning.

### Phase 4: NAS Deploy Rehearsal

Output:

- `openclaw-benben` user/service layout.
- Redacted secret migration.
- Shadow service running without production Feishu ingress.
- Rollback snapshot.
- Deployment verification report.

This is L3 when run on NAS.

### Phase 5: Production Feishu Cutover

Output:

- Old Feishu ingress parked.
- New Feishu ingress active.
- Full Feishu acceptance matrix.
- Rollback verification.

This is L3 and requires a repair gate checklist plus final preflight.

### Phase 6: Telegram Phase 2

Output:

- Telegram bot token migration.
- Telegram channel adapter.
- Telegram acceptance matrix.

## 12. Risks

- Same Feishu bot cannot safely be served by two active webhook consumers at the same time.
- Secret migration can break existing paired nodes if gateway tokens drift.
- Old functionality may be hidden in patched runtime bundles, so Phase 0 must inventory behavior carefully.
- Memory migration can recreate old privacy bugs if V2/V3/projections are treated as answer truth.
- Active memory capture can become noisy unless candidates and durable atoms stay separate.
- Proactive group replies can feel intrusive without rate limits and relevance checks.
- A full rewrite can take longer than repair; the safer path is staged capability parity.

## 13. Rollback Principle

Before any live cutover:

- Snapshot old service unit and env.
- Snapshot old openclaw config.
- Snapshot old auth profiles.
- Snapshot old workspace tools needed for rollback.
- Snapshot old memory stores.
- Snapshot new service state.
- Record checksums.

Rollback means restoring Feishu ingress and service ownership to the old instance. It must not mutate or downgrade the new Memory V4 DB.

## 14. Immediate Next Step

Run Phase 0 read-only inventory and produce:

- `old-benben-feature-inventory.md`
- `old-benben-secret-inventory.redacted.json`
- `old-benben-service-inventory.json`
- `openclaw-benben-implementation-plan.md`

Only after Phase 0 should implementation begin.
