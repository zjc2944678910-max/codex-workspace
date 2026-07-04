# MVP Build Order

Use this runbook when starting implementation so the project does not drift
into firmware work, model training, or live/NAS repair too early.

## Route Lock Template

For long implementation turns, use:

```yaml
target_project: personal-ai-companion
target_surface: local product + ops docs
project_root: /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion
ops_root: /Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion
route_evidence:
  - personal-ai-companion registry entry
  - StackChan / personal AI companion / memory-service request
forbidden_surfaces:
  - ops/projects/openclaw unless explicitly asked
  - ops/projects/sub2api unless explicitly asked
  - live NAS/VPS/service state unless repair gate is opened
```

## Step 1: Local Relay Skeleton

Build locally first.

Minimum modules:

- `api-gateway`
- `model-router`
- `chat-orchestrator`
- `usage-ledger`

Minimum endpoints:

```text
POST /v1/chat
GET  /v1/admin/usage
```

## Step 2: Memory-Service Core

Implement before iOS and before chat-log style work.

Minimum modules:

- `InteractionEnvelope`
- `IdentityKernel`
- `PrivacyKernel`
- `MemoryWritePipeline`
- `MemoryRecallPipeline`
- `MemoryAdmin`

Minimum endpoints:

```text
POST   /v1/memory/ingest
POST   /v1/memory/recall
GET    /v1/memory/search
GET    /v1/memory/{id}/explain
POST   /v1/memory/{id}/promote
POST   /v1/memory/{id}/reject
DELETE /v1/memory/{id}
```

## Step 3: Voice And StackChan

Only after `/v1/chat` and memory gates work.

Minimum endpoints:

```text
POST /v1/voice/stt
POST /v1/voice/tts
POST /v1/devices/register
```

Default behavior:

- StackChan uses the server relay as its only model/token holder.
- Sensitive memory is blocked from speaker output unless explicitly allowed.
- Firmware changes are a fallback if custom base URL configuration is missing.

## Step 4: iOS Companion

Keep all integrations permission-scoped.

Allowed targets:

- HealthKit summaries with user-granted categories.
- EventKit reminders/calendar with authorization.
- AlarmKit for app-owned alarms where supported.
- Shortcuts/App Intents for explicit user-triggered actions.

Explicitly out of scope:

- Reading WeChat, QQ, other apps, all notifications, or arbitrary phone data.

## Step 5: NAS Local Model

Add as an optional route after the relay contract is stable.

Good first uses:

- Private summarization.
- Memory candidate extraction.
- Offline fallback.
- Low-cost review jobs.

Do not rely on the NAS local model as the primary emotional dialogue model
unless hardware benchmarks prove quality and latency are good enough.

## Step 6: Chat-Log Import And Style Profile

Do this late and conservatively.

Requirements:

- Explicit consent record for the person whose style is modeled.
- Import job with cleaning, deduplication, and redaction.
- Candidate extraction into `candidate_atoms`, not direct stable memory.
- Style profile that is labeled as a consented profile, not the real person.
- Owner-visible deletion and revocation path.

## Verification Checklist

- Memory recall is scoped by envelope and privacy class.
- Unknown identity cannot access private memories.
- StackChan speaker output suppresses sensitive memory by default.
- Memory mutation requires owner confirmation.
- Usage logs do not include secret values.
- Raw chat logs are not used as answer truth.
