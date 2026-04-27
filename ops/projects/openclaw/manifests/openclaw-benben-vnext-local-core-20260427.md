# openclaw-benben vNext Local Core Checkpoint

Date: 2026-04-27
Task level: L1 local engineering
Live changes: none

## Product Repo Checkpoint

- repo: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- branch: `codex/openclaw-benben-vnext-core`
- latest local commit: `6915cb64fb3708c248210753e60bfa0ac8ce40b8`
- latest shadow-synced commit: `6915cb64fb3708c248210753e60bfa0ac8ce40b8`
- tool-execution checkpoint: `6915cb64fb3708c248210753e60bfa0ac8ce40b8`
- response-composer checkpoint: `b2a0fa46c579db2cf7de81d5cf33d65b8f8e29d4`
- prompt-plan checkpoint: `facaeeb1ae4a8a258809ead7968c231a57fd53e2`
- answer-plan checkpoint: `d9a8a8d924f33e3ed1e908a4ce8c70a0f6767c5d`
- persona checkpoint: `7a8811368e89843213410963f1baa2e9e3a64e77`
- core commit: `3164adc2fd834b311691be0ef51af03ff3fbeec2`
- latest local commit message: `feat: add benben dry-run tool execution plan`
- latest shadow-synced commit message: `test: add benben dry-run shadow preflight suite`
- response-composer checkpoint message: `feat: add benben dry-run response composition`
- tool-execution checkpoint message: `feat: add benben dry-run tool execution plan`
- prompt-plan checkpoint message: `feat: add benben dry-run prompt planning`
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
- `workspace/tools/openclaw-benben/model-executor-kernel.mjs`
- `workspace/tools/openclaw-benben/model-prompt-kernel.mjs`
- `workspace/tools/openclaw-benben/response-composer-kernel.mjs`
- `workspace/tools/openclaw-benben/tool-execution-kernel.mjs`
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

## Latest Local Response-Composer Add-on

Commit `b2a0fa46c579db2cf7de81d5cf33d65b8f8e29d4` adds a dry-run
response composition planner.

Properties:

- no Feishu send
- no runtime commit
- records candidate reply hash/length, source kind, output caps, truncation
  policy, sanitizer policy, and confirmation requirements
- detects secret-like and high-risk-action-shaped output without persisting raw
  candidate text
- keeps `safe_to_send=false` and `delivery_sent=false` in dry-run
- rejects non-V4, legacy fallback, or raw-archive truth memory surfaces before a
  future delivery can be planned

## Latest Local Model-Execution Add-on

Commit `625b29da0954d4d6c5a901fbf0954ea72e4611b3` adds a dry-run model
execution planner.

Properties:

- no provider request materialization
- no provider response persistence
- no network calls
- no model call
- no Feishu send
- no runtime commit
- records provider/model route, prompt contract reference, input hash/length,
  timeout, retry/fallback policy, idempotency hashes, and usage estimate metadata
- rejects materialized raw prompts and non-V4/legacy/raw-archive memory truth
  surfaces before a future model call can be planned

## Latest Local Tool-Execution Add-on

Commit `6915cb64fb3708c248210753e60bfa0ac8ce40b8` adds a dry-run tool
execution planner.

Properties:

- no proposed action execution
- no raw action persistence
- no Feishu send
- no runtime commit
- gates each proposed action through `ToolGate`
- records action type, gate decision, confirmation/L3 flags, command hash/length,
  target path hash/kind, and coarse command risk shape
- keeps `all_execution_disabled=true`, `executed_action_count=0`, and
  `raw_actions_persisted=false`

## Safety Properties

- Dry-run Feishu adapter only; no send path is implemented.
- `production_ingress` remains false in dry-run reports.
- Model calls are disabled by default.
- Ordinary messages are planned before any optional Memory V4 recall or future
  model route.
- Model-prompt planning is metadata-only; raw prompts are not materialized in
  dry-run.
- Model-execution planning is metadata-only; provider requests and network calls
  stay disabled in dry-run.
- Response composition is metadata-only in trace/report and remains dry-run
  gated before delivery.
- Tool execution is metadata-only in trace/report; proposed actions are gated but
  never executed in dry-run.
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
node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter-boundary-check.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter-compat-matrix.test.mjs workspace/tools/tests/memory-v4/memory-v4-privacy-scope-gate.test.mjs workspace/tools/tests/memory-v4/memory-v4-answer-service.test.mjs workspace/tools/tests/memory-v4/memory-v4-answer-composer.test.mjs workspace/tools/tests/memory-v4/memory-v4-session-delta.test.mjs workspace/tools/tests/session-memory-review.test.mjs workspace/tools/tests/session-memory-review-queue.test.mjs
find workspace/tools/openclaw-benben -name '*.mjs' -exec node --check {} \;
node --check workspace/tools/workspace-source-manifest.mjs
git diff --check
node workspace/tools/openclaw-benben/dry-run-suite.mjs --json
rg -n "SECRET_TOOL_ARG|SECRET_MESSAGE_PAYLOAD|SECRET_TOOL_EXEC|systemctl restart|ssh oc-nas|scratch/projects/openclaw-benben/tool-result|SYNTHETIC_ANSWER_PAYLOAD|chat_fixture_owner|entity:user:self" scratch/projects/openclaw-benben/dry-run-suite
```

Results:

- local benben + source-manifest tests: 50 pass / 0 fail
- benben + Memory V4 + source-manifest aggregate regression: 135 pass / 0 fail
- syntax checks: pass
- diff whitespace check before commit: pass
- default synthetic dry-run suite: 8 cases, all `ok:true`, all `sent:false`,
  all `production_ingress:false`, all `runtime_committed:false`, all
  `model_call_enabled:false`
- synthetic/raw/tool denylist scan: no matches

## L3 Boundary For Shadow Sync

Commit `6915cb64fb3708c248210753e60bfa0ac8ce40b8` was synced to the NAS shadow
workspace after explicit L3 authorization on 2026-04-27.

Do not execute any further NAS write, service restart, env/config change, or
channel enablement unless the user explicitly says `进入修复阶段`.

Local candidate package manifest:

- latest: `openclaw-benben-shadow-sync-candidate-tool-executor-20260427.json`
- supersedes: `openclaw-benben-shadow-sync-candidate-model-executor-20260427.json`
- 37 files
- aggregate sha256:
  `99630a83dc3ac68689df31aeec5c7bb4491c47a5220db99a069d36709ba62482`

Execution status:

- Commit `d9018318d75b41f64b39355ed17735ec6971fb0a` was executed on NAS shadow
  after explicit L3 authorization.
- Commit `6915cb64fb3708c248210753e60bfa0ac8ce40b8` was executed on NAS shadow
  after explicit L3 authorization. This includes the persona, answer-plan,
  prompt-plan, model-execution, response-composer, and tool-execution checkpoints.
- Execution manifest:
  `openclaw-benben-shadow-sync-execution-tool-executor-20260427.json`
- Shadow sync target:
  `/var/lib/openclaw-benben/.openclaw/workspace`
- Old production service remained untouched.
- Shadow service was restarted only after file sync and validation.
- Post-sync remote verification: 37 manifest files matched, syntax passed,
  focused tests passed 50/50, dry-run suite passed 8/8, leak scan matched 0,
  shadow health returned `{"ok":true,"status":"live"}`, and
  `OPENCLAW_SHADOW_DISABLE_PRODUCTION_CHANNELS=1` remained set.

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
