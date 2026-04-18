# OpenClaw Runtime Patch Inventory (2026-03-13)

目标：把 dist 级别的关键补丁变成可重放、可校验、可回滚的体系，避免升级后丢失。

## 入口定位
- dist 目录：`/usr/lib/node_modules/openclaw/dist`
- 实际 reply bundle 由 `index.js` 中 `import "./reply-<hash>.js"` 决定；当前为 `reply-C5LKjXcC.js`。

## 当前正式补丁
- **reply-runtime-v1**
  - 目标文件：`reply-*.js`（当前 `reply-C5LKjXcC.js`）
  - 作用：
    - weather tool 调用 `/root/.openclaw/workspace/tools/weather-run.sh` + defaults 解析
    - 新会话注入近期 active_tasks（非稳定记忆）
    - candidate proposer 轻量触发 + 去重 + 写入 `candidate-proposals.jsonl`
    - proposal promoter 异步触发（`proposal-promoter.mjs`）
    - debug 日志（`/tmp/candidate-debug.log`）
  - 依赖外部脚本：`defaults-helper.mjs`, `active-tasks-helper.mjs`, `weather-run.sh`, `proposal-promoter.mjs`
  - 校验锚点：
    - "Deterministic wttr.in lookup with defaults-helper for location resolution"
    - "Recent active tasks (continuity; not long-term memory)"
    - "candidate-proposer"
    - "PROMOTER_BIN"
  - base_hash: `f1cbef4f200f092a8934efdfabaaffb66968453f89d77c16e001c12e54499289`
  - patched_hash: `455c8a2525823d3fb6ae867aaee79b2e412a4e0733df6bc794dad3efb0fa9c88`
  - patch 文件：`/root/.openclaw/workspace/patches/runtime/reply-runtime-v1.patch`
  - 风险：中（依赖当前 dist 版本；哈希不匹配时需人工比对）

## 工具
- `/root/.openclaw/workspace/tools/runtime-patch-manager.mjs`
  - 命令：
    - `node runtime-patch-manager.mjs status`：显示当前 reply 路径、snapshot hash parity、稳定 patch 状态和 optional cutover 状态
    - `node runtime-patch-manager.mjs apply [--patch id]`：校验 hash=base，再打稳定 patch，并默认按 manifest 的 `default_enabled` cutovers 继续推进；自动备份到同目录 `.bak-patch-<ts>`
    - `node runtime-patch-manager.mjs apply --stable-only`：只打稳定 patch，不推进 manifest 默认 cutover
    - `node runtime-patch-manager.mjs apply --enable-skill-registry-v2-cutover`：显式指定要叠加 Hermes skill snapshot bridge cutover
    - `node runtime-patch-manager.mjs verify`：检查 `verify_state`、stable patch markers 和 optional cutover markers
    - `node runtime-patch-manager.mjs rollback`：用最新 `.bak-patch-*` 备份回滚

## 备份与素材
- 基线文件：`/root/.openclaw/workspace/patches/runtime/reply-base-C5LKjXcC.js`
- 已打补丁文件快照：`/root/.openclaw/workspace/patches/runtime/reply-patched-C5LKjXcC.js`
- 补丁文件：`/root/.openclaw/workspace/patches/runtime/reply-runtime-v1.patch`
- 清单：`/root/.openclaw/workspace/patches/runtime/patch-manifest.json`

## 升级 / 重装流程
1) 升级 OpenClaw 后，在 dist 目录找到新的 reply bundle（或让工具自动识别）。
2) 运行 `node runtime-patch-manager.mjs status`：确认 hash 是否等于 manifest 的 base_hash。
3) 若匹配，运行 `node runtime-patch-manager.mjs apply`；完成后 `verify`。
4) 若 hash 不匹配：
   - 不要强行套 patch；先人工比对新版 reply 与 `reply-patched-C5LKjXcC.js`，必要时重做 patch 文件，再更新 manifest。

## candidate migration rehearsal

- 新工具：`node /root/.openclaw/workspace/tools/benben-runtime-patch-rehearsal.mjs`
- 作用：对一个离线 candidate package root 一次性完成：
  - 原始 `--stage candidate` gate
  - stable reply runtime patch rehearsal
  - stable + `runtime-skill-snapshot-v1` optional cutover rehearsal
  - 原始 candidate reply bundle 不变性检查
- 典型用法：

```bash
node /root/.openclaw/workspace/tools/benben-runtime-patch-rehearsal.mjs \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage/package \
  --baseline /root/.openclaw/workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --write-report
```

- 默认情况下，它只会演练 manifest 里 `default_enabled=true` 的 benben cutovers，而不是把所有 optional cutover 一视同仁。
- 如果只想确认 stable patch 能否承接当前契约，可加 `--skip-optional-cutovers`（或 `--stable-only`）。
- 该工具只在临时 clone 上打补丁；不会直接改你传入的 candidate package root。
- `openclaw-upgrade-impact-assess.mjs --stage candidate` 现在默认也会把这一步带上；只有显式传 `--skip-benben-runtime-rehearsal` 时才退回旧的静态 gate。

## Hermes live rollout

- 新工具：`node /root/.openclaw/workspace/tools/hermes-live-rollout.mjs`
- 作用：把 Hermes live promotion 收口成一个可读 plan + 可执行 apply 的单工具：
  - 读取 `/etc/openclaw/gateway.env` 当前 flag 状态
  - 校验 / 生成 `memory-admin/meta/skill-registry-runtime-snapshot.json`
  - 校验 benben reply runtime 当前是否已经落到 `optional_cutover_applied`
  - 在 `apply` 时写入受管 env block，并在需要时推进默认 runtime cutover
- 典型只读预览：

```bash
node /root/.openclaw/workspace/tools/hermes-live-rollout.mjs status \
  --workspace /root/.openclaw/workspace \
  --gateway-env-file /etc/openclaw/gateway.env \
  --enable-skill-runtime \
  --enable-provider-default \
  --json
```

- `apply` 只负责文件面和 reply runtime patch 面；不会替你做 `systemctl restart`，调用它的 rollout flow 需要显式重启 gateway。

## 回滚
- 使用 `node runtime-patch-manager.mjs rollback` 恢复到最近 `.bak-patch-*` 备份。
- 或直接用 dist 内的 `.bak-*` 手动还原。

## 验证要点
- `status/verify` 至少应给出可解释的 `verify_state`：
  - `already_patched`
  - `optional_cutover_applied`
  - `ready_to_apply`
  - `patched_drifted`
- `optional_cutover_applied` 代表当前 reply bundle 已处于受管的 skill-registry-v2 cutover 状态，不应再被当成普通 drift。
- `/weather` 走 defaults；`/new` 注入 active_tasks；Telegram 普通对话可触发 proposer；promoter 可运行。

## 注意
- manifest 的 base_hash/patch_file 针对当前 dist 版本。若 OpenClaw 升级导致 hash 变化，需更新 base/patched/patch diff 后再用工具。
- 不要把业务逻辑继续下沉到 dist；保持“薄接线，重逻辑在 workspace/tools”。

## 新增命令与回滚语义（2026-03-13 收口）
- 预检查：`node /root/.openclaw/workspace/tools/runtime-patch-manager.mjs preflight`
  - 输出：入口文件、当前 hash、base/patched snapshot hash 对比、anchors、optional cutover state、是否已有安全备份/基线备份。
  - 升级后第一步先跑 preflight，确认 `ready_to_apply`、`already_patched` 或 `optional_cutover_applied`；若是 `patched_drifted` 或 `unknown`，需要人工比对。
- 回滚语义
  - `rollback-safe`（也兼容别名 `rollback`）：恢复到 dist 内最新的 `.bak-patch-*`，用于快速恢复“最近可用版本”。
  - `rollback-base`: 恢复到 manifest 定义的 base 快照（`reply-base-C5LKjXcC.js`），用于严格验证“未打补丁”状态或重建 patch；若基线缺失或 hash 不符会显式报错。
- 其他命令未变：`status`、`verify`、`apply`。
