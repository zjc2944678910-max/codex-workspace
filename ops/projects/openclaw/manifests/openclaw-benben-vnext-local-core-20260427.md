# openclaw-benben vNext Local Core Checkpoint

Date: 2026-04-27
Task level: L1 local engineering
Live changes: none

## Product Repo Checkpoint

- repo: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- branch: `codex/openclaw-benben-vnext-core`
- latest local commit: `facaeeb1ae4a8a258809ead7968c231a57fd53e2`
- latest shadow-synced commit: `d9018318d75b41f64b39355ed17735ec6971fb0a`
- answer-plan checkpoint: `d9a8a8d924f33e3ed1e908a4ce8c70a0f6767c5d`
- persona checkpoint: `7a8811368e89843213410963f1baa2e9e3a64e77`
- core commit: `3164adc2fd834b311691be0ef51af03ff3fbeec2`
- latest local commit message: `feat: add benben dry-run prompt planning`
- latest shadow-synced commit message: `test: add benben dry-run shadow preflight suite`
- answer-plan checkpoint message: `feat: add benben dry-run answer planning`
- persona checkpoint message: `feat: add benben dry-run persona kernel`
- core commit message: `feat: add openclaw-benben vnext dry-run core`
- worktree after commit: clean

## Implemented Local Modules

- `workspace/tools/openclaw-benben/message-envelope.mjs`
- `workspace/tools/openclaw-benben/identity-kernel.mjs`
- `workspace/tools/openclaw-benben/privacy-kernel.mjs`
- `workspace/tools/openclaw-benben/memory-v4-wrapper.mjs`
- `workspace/tools/openclaw-benben/usage-ledger.mjs`
- `workspace/tools/openclaw-benben/tool-gate.mjs`
- `workspace/tools/openclaw-benben/feishu-adapter.mjs`
- `workspace/tools/openclaw-benben/command-router.mjs`
- `workspace/tools/openclaw-benben/memory-command-router.mjs`
- `workspace/tools/openclaw-benben/turn-runner.mjs`
- `workspace/tools/openclaw-benben/persona-kernel.mjs`
- `workspace/tools/openclaw-benben/answer-plan-kernel.mjs`
- `workspace/tools/openclaw-benben/model-prompt-kernel.mjs`
- `workspace/tools/openclaw-benben/dry-run-cli.mjs`
- `workspace/tools/openclaw-benben/dry-run-suite.mjs`
- `workspace/tools/openclaw-benben/index.mjs`
- `workspace/tools/openclaw-benben/README.md`
- `workspace/tools/openclaw-benben/fixtures/*.json`

## Implemented Local Tests

- `workspace/tools/tests/openclaw-benben/openclaw-benben-core.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-runtime-adapter.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-turn-runner.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-dry-run-cli.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-dry-run-suite.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-memory-command.test.mjs`

## Latest Local Persona Add-on

Commit `7a8811368e89843213410963f1baa2e9e3a64e77` adds a local dry-run
persona kernel for identity questions such as `你是谁`.

Properties:

- no model call
- no Memory V4 recall
- no Feishu send
- no runtime commit
- owner, partner, group, and unknown contexts get bounded persona plans
- trace/report surfaces keep persona metadata but not raw reply text or raw input

## Latest Local Answer-Plan Add-on

Commit `d9a8a8d924f33e3ed1e908a4ce8c70a0f6767c5d` adds a local dry-run
ordinary-message answer planner.

Properties:

- no model call
- no Feishu send
- no runtime commit
- plans default route `anyone/gpt-5.4` without invoking it
- records audience, answer style, Memory V4 truth surface, and recall policy
- Memory V4 recall remains opt-in and is blocked for unknown direct senders and
  ordinary groups
- trace/report surfaces keep plan metadata but not raw input

## Latest Local Prompt-Plan Add-on

Commit `facaeeb1ae4a8a258809ead7968c231a57fd53e2` adds a dry-run
model-prompt planner.

Properties:

- no raw prompt materialization
- no model call
- no Feishu send
- no runtime commit
- emits prompt contract version, profile, route, constraints, input hash/length,
  and Memory V4 metadata only
- rejects non-V4, legacy fallback, or raw-archive truth memory surfaces before a
  future model call can be planned
- trace/report surfaces keep prompt metadata but not raw user text, Memory V4
  answer text, or recall ids

## Safety Properties

- Dry-run Feishu adapter only; no send path is implemented.
- `production_ingress` remains false in dry-run reports.
- Model calls are disabled by default.
- Ordinary messages are planned before any optional Memory V4 recall or future
  model route.
- Model-prompt planning is metadata-only; raw prompts are not materialized in
  dry-run.
- Runtime commits are not performed.
- `/memory` admin is owner-direct only.
- `/memory` mutation actions require owner confirmation and remain uncommitted.
- Dry-run trace/report/usage outputs are sanitized.
- Memory answer truth is restricted to Memory V4; legacy fallback and raw archive truth surfaces are rejected.
- Tool gate fail-closes L3 actions such as service restarts, config/env writes, channel sends, and `adminAI`.
- Synthetic shadow-preflight fixtures use fake Feishu IDs and fake payloads only.

## Verification

Commands run in the product repo:

```bash
node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs
node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter-boundary-check.test.mjs workspace/tools/tests/memory-v4/memory-v4-privacy-scope-gate.test.mjs workspace/tools/tests/memory-v4/memory-v4-answer-service.test.mjs workspace/tools/tests/memory-v4/memory-v4-live-session-delta.test.mjs
find workspace/tools/openclaw-benben -name '*.mjs' -exec node --check {} \; && node --check workspace/tools/workspace-source-manifest.mjs
git diff --cached --check
node workspace/tools/openclaw-benben/dry-run-suite.mjs --json
```

Results:

- local benben + source-manifest tests: 46 pass / 0 fail
- benben + Memory V4 + source-manifest aggregate regression: 74 pass / 0 fail
- syntax checks: pass
- cached diff whitespace check before commit: pass
- default synthetic dry-run suite: 8 cases, all `ok:true`, all `sent:false`,
  all `production_ingress:false`, all `runtime_committed:false`, all
  `model_call_enabled:false`

## L3 Boundary For Shadow Sync

The next deployment-shaped action is to sync commit `facaeeb1ae4a8a258809ead7968c231a57fd53e2`
to the NAS shadow workspace. That is L3 because it writes live NAS files.

Do not execute the sync unless the user explicitly says `进入修复阶段`.

Local candidate package manifest:

- latest: `openclaw-benben-shadow-sync-candidate-prompt-plan-20260427.json`
- supersedes: `openclaw-benben-shadow-sync-candidate-answer-plan-20260427.json`
- 34 files
- aggregate sha256:
  `2ae81886df243f329f800991de4cbb5b48134b2bc1230ded0e065d7127886942`

Execution status:

- Commit `d9018318d75b41f64b39355ed17735ec6971fb0a` was executed on NAS shadow
  after explicit L3 authorization.
- Commits `7a8811368e89843213410963f1baa2e9e3a64e77` and
  `d9a8a8d924f33e3ed1e908a4ce8c70a0f6767c5d` and
  `facaeeb1ae4a8a258809ead7968c231a57fd53e2` have not been synced to NAS shadow.
- Execution manifest:
  `openclaw-benben-shadow-sync-execution-20260427.json`
- Shadow sync target:
  `/var/lib/openclaw-benben/.openclaw/workspace`
- Old production service remained untouched.
- Shadow service was restarted only after file sync and validation.

Minimum L3 plan:

- preflight old production service remains active/running
- preflight shadow service health and channel-disabled state
- snapshot target shadow workspace path before write
- copy only the vNext local-core files and tests, or pull the exact commit into shadow
- verify dry-run CLI on shadow with fixture input and separate identity config
- verify Feishu, Telegram, and QQbot channels/plugins remain disabled
- do not enable production Feishu ingress

Rollback:

- restore the shadow workspace snapshot or revert the shadow checkout
- leave old `openclaw-gateway.service` untouched as rollback anchor
- stop `openclaw-benben.service` only if shadow health regresses and the L3 plan allows it
