# openclaw-benben vNext Local Core Checkpoint

Date: 2026-04-27
Task level: L1 local engineering
Live changes: none

## Product Repo Checkpoint

- repo: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- branch: `codex/openclaw-benben-vnext-core`
- commit: `3164adc2fd834b311691be0ef51af03ff3fbeec2`
- commit message: `feat: add openclaw-benben vnext dry-run core`
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
- `workspace/tools/openclaw-benben/dry-run-cli.mjs`
- `workspace/tools/openclaw-benben/index.mjs`
- `workspace/tools/openclaw-benben/README.md`

## Implemented Local Tests

- `workspace/tools/tests/openclaw-benben/openclaw-benben-core.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-runtime-adapter.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-turn-runner.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-dry-run-cli.test.mjs`
- `workspace/tools/tests/openclaw-benben/openclaw-benben-memory-command.test.mjs`

## Safety Properties

- Dry-run Feishu adapter only; no send path is implemented.
- `production_ingress` remains false in dry-run reports.
- Model calls are disabled by default.
- Runtime commits are not performed.
- `/memory` admin is owner-direct only.
- `/memory` mutation actions require owner confirmation and remain uncommitted.
- Dry-run trace/report/usage outputs are sanitized.
- Memory answer truth is restricted to Memory V4; legacy fallback and raw archive truth surfaces are rejected.
- Tool gate fail-closes L3 actions such as service restarts, config/env writes, channel sends, and `adminAI`.

## Verification

Commands run in the product repo:

```bash
node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs
node --test workspace/tools/tests/openclaw-benben/*.test.mjs workspace/tools/tests/workspace-source-manifest.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter.test.mjs workspace/tools/tests/memory-v4/memory-v4-benben-adapter-boundary-check.test.mjs workspace/tools/tests/memory-v4/memory-v4-privacy-scope-gate.test.mjs workspace/tools/tests/memory-v4/memory-v4-answer-service.test.mjs workspace/tools/tests/memory-v4/memory-v4-live-session-delta.test.mjs
find workspace/tools/openclaw-benben -name '*.mjs' -exec node --check {} \; && node --check workspace/tools/workspace-source-manifest.mjs
git diff --cached --check
```

Results:

- local benben + source-manifest tests: 37 pass / 0 fail
- benben + Memory V4 + source-manifest aggregate regression: 65 pass / 0 fail
- syntax checks: pass
- cached diff whitespace check before commit: pass

## L3 Boundary For Shadow Sync

The next deployment-shaped action is to sync commit `3164adc2fd834b311691be0ef51af03ff3fbeec2`
to the NAS shadow workspace. That is L3 because it writes live NAS files.

Do not execute the sync unless the user explicitly says `进入修复阶段`.

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
