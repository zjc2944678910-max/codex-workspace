# OpenClaw Upgrade Impact Assessment

更新时间：2026-04-11

适用对象：`home-nas` 上从 `2026.3.24` 评估升级到上游 `v2026.4.9` 的 benben + adminAI 双实例。

这不是普通 npm 更新检查。它默认把升级视为一轮带本地 runtime patch、双实例隔离、记忆契约和 health contract 的迁移评估。

## 核心工具

- tool: `workspace/tools/openclaw-upgrade-impact-assess.mjs`
- 默认目标版本：`v2026.4.9`
- 默认 host：`home-nas`
- 默认执行模式：`auto`

它会同时采集并汇总：

- 当前生产包版本
- 离线候选包的 bundle / patch 兼容性（`--stage candidate`）
- benben reply runtime rehearsal（candidate 阶段默认启用，可显式跳过）
- active bundle basenames + sha256
- benben reply runtime patch `verify_state` 与 optional cutover 状态
- benben runtime marker 审计
- adminAI `OPENCLAW_SERVICE_MARKER=openclaw-adminai` 静态审计
- benben `AGENTS.md` 双人生活助手三轴约束审计
- benben `memory-health-summary / deployment-verify / memory-v2-eval / mempalace-sidecar status`
- adminAI `status / preflight / verify / runtime observe / optional canary`
- 关键 systemd unit 状态
- 与升级前 baseline 的 drift compare
- 最终 `baseline_ready / go / no_go` 结论

## 升级前基线采集

在 NAS 本机或任意能 SSH 到 `home-nas` 的控制机执行：

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage pre \
  --mode ssh \
  --host home-nas \
  --write-report
```

如果就是在 NAS 本机执行：

```bash
sudo node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage pre \
  --mode local \
  --write-report
```

产物会写到：

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-*.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-*.json`

pre 阶段默认要求：

- benben：`healthy`、`memory-v2-eval 13/13`、`owner_private_current` 通过、sidecar 为 `healthy + shadow_retrieve`
- benben runtime patch：`verify_state=already_patched`，或在显式启用 skill-registry-v2 cutover 后为 `optional_cutover_applied`
- adminAI：`verify_state=already_patched`
- `openclaw.json` fallback chain 不漂移
- `adminAI` service marker 和 benben `AGENTS` 三轴约束都能被静态审计到

## 离线候选包审计

在真正动 live npm 包之前，先对解压后的候选包做一次离线 gate。这个阶段不碰 NAS 的 active package root，只检查新包能否承接 benben/adminAI 的当前 patch 契约。

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage candidate \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --write-report
```

`candidate` 阶段会额外检查：

- 新包里的 `memory_search` 是否仍保留 benben 当前需要的自定义语义标记：
  - `historical_evidence`
  - `answer_summary_cn / answer_debug_summary_cn / answer_full_summary_cn`
  - `hybrid_answer_guidance_cn`
- `memory_search` 是否已经从旧 runtime hook 面迁到 `extensions/memory-core/index.js`
- repo 当前的 `runtime-patch-manager.mjs` 对候选 `reply` bundle 是否还能得到：
  - `verify_state=ready_to_apply`
  - 或 `already_patched`
  - 或 `optional_cutover_applied`
- repo 当前的 `adminai-pi-embedded-patch-manager.mjs` 对候选 `pi-embedded` 是否还能得到：
  - `verify_state=ready_to_apply`
  - 或至少 `already_patched`
- benben reply runtime rehearsal 是否至少证明：
  - stable patch rehearsal 后可回到 `candidate_ready`
  - 原始 candidate reply bundle 未被 rehearsal 改写

默认情况下，`openclaw-upgrade-impact-assess.mjs --stage candidate` 会自动调用：

```bash
node workspace/tools/benben-runtime-patch-rehearsal.mjs --json
```

把 benben stable patch / optional cutover migration rehearsal 结果一起并入 candidate 报告；如果你只想保留原先的静态 compatibility gate，可显式跳过：

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage candidate \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --skip-benben-runtime-rehearsal \
  --write-report
```

如果 `candidate` 就已经 `no_go`，说明这次升级不是“直接换包”，而是必须先做 benben/adminAI patch migration。

### `v2026.4.9` candidate migration flow

当前 repo 已经补齐了离线迁移工具和候选 patch artifacts：

- benben candidate cutover:
  - `workspace/tools/memory-core-phase1-cutover.mjs`
  - patch target: `dist/extensions/memory-core/index.js`
  - patch artifacts:
    - `workspace/patches/runtime/memory-core-base-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/memory-core-patched-v2026.4.9-phase1.js`
    - `workspace/patches/runtime/memory-core-phase1-v2026.4.9.patch`
- adminAI candidate cutover:
  - `workspace/tools/adminai-pi-embedded-cutover.mjs`
  - actual patch target: `dist/pi-embedded-Vw-lS5ti.js`
    - 注意：`pi-embedded-DZSqcPKt.js` 只是 wrapper / re-export，不是需要打补丁的真实逻辑 bundle
  - candidate manifest:
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json`
  - patch artifacts:
    - `workspace/patches/runtime/pi-embedded-base-Vw-lS5ti.adminai-v2026.4.9-prepatch.js`
    - `workspace/patches/runtime/pi-embedded-patched-Vw-lS5ti.adminai-v2026.4.9-ops.js`
    - `workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-ops.patch`

离线迁移的推荐顺序：

```bash
cp <candidate>/dist/extensions/memory-core/index.js workspace/patches/runtime/memory-core-base-v2026.4.9-prepatch.js
cp <candidate>/dist/pi-embedded-Vw-lS5ti.js workspace/patches/runtime/pi-embedded-base-Vw-lS5ti.adminai-v2026.4.9-prepatch.js

node workspace/tools/memory-core-phase1-cutover.mjs apply \
  --bundle-file <candidate>/dist/extensions/memory-core/index.js \
  --json

node workspace/tools/adminai-pi-embedded-cutover.mjs apply \
  --bundle-file <candidate>/dist/pi-embedded-Vw-lS5ti.js \
  --json

node workspace/tools/adminai-pi-embedded-patch-manager.mjs verify \
  --manifest workspace/patches/runtime/pi-embedded-adminai-v2026.4.9-manifest.json \
  --target <candidate>/dist/pi-embedded-Vw-lS5ti.js
```

完成迁移后，再回跑 candidate gate：

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage candidate \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --write-report
```

当前 repo 已验证：

- benben candidate `memory-core` 自定义语义 markers 已恢复
- adminAI candidate `verify_state=already_patched`
- 最新 candidate 报告已转为 `candidate_ready`

### benben reply runtime single-command rehearsal

上面的 candidate gate 解决的是“能不能承接当前 patch 契约”。如果要继续回答“stable patch 打上去后会不会过 gate”“显式叠 Hermes skill cutover 后还会不会过 gate”，现在可以直接跑单命令 rehearsal：

```bash
node workspace/tools/benben-runtime-patch-rehearsal.mjs \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --write-report
```

它会顺序做三件事：

- 先对原始 candidate root 跑一次只读 `--stage candidate`
- 再克隆 candidate root，演练 benben stable reply runtime patch
- 再克隆 candidate root，演练 `runtime-skill-snapshot-v1` optional cutover

输出重点是：

- 原始 candidate 是否仍需 migration
- stable patch rehearsal 后是否已经转成 `candidate_ready`
- stable + optional cutover rehearsal 后是否仍保持 `candidate_ready`
- 原始 candidate reply bundle 在整个演练过程中是否保持未修改

默认情况下它只会演练 manifest 中 `default_enabled=true` 的 benben cutovers；如果只想验证 stable patch，可加：

```bash
node workspace/tools/benben-runtime-patch-rehearsal.mjs \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --skip-optional-cutovers \
  --write-report
```

如果你就是想让 candidate gate 明确只以 stable patch 为目标，也可以直接在 candidate assess 侧传：

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage candidate \
  --candidate-package-root /tmp/openclaw-2026.4.9-stage.EEIpy7/package \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --benben-runtime-stable-only \
  --write-report
```

## 升级后静态和功能验收

升级完新包后，拿升级前 JSON 作为 baseline：

```bash
node workspace/tools/openclaw-upgrade-impact-assess.mjs \
  --stage post \
  --mode ssh \
  --host home-nas \
  --baseline /absolute/path/to/openclaw-upgrade-impact-pre-v2026.4.9-*.json \
  --force-adminai-probes \
  --write-report
```

`post` 阶段会额外检查：

- 当前包版本是否已到 `v2026.4.9`
- runtime / `pi-embedded` / reply bundle 是否漂移
- benben / adminAI fallback chain 是否变化
- adminAI canary 与 policy probe 是否还满足：
  - `transport_canary.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`

`policy_probe.ok` 仍会被记录，但它现在不是单独的升级阻断项。原因是 policy probe 里还带有更细的附加布尔位，例如 `should_use_memory_after_diagnose`；这类附加语义如果偶发漂移，会记 warning，但不会覆盖本轮真正的硬约束：

- `first_action=ocapp_diagnose`
- `stop_on_ok=true`
- `transport_canary.ok=true`

## `decision` 语义

- `baseline_ready`
  - 升级前基线完整，允许进入升级准备
- `candidate_ready`
  - 离线候选包通过静态兼容性 gate，可以进入真正的 live 升级准备
- `go`
  - 升级后静态与功能验收通过，允许继续上线
- `no_go`
  - 存在 blocker，不能把本次升级结论记为通过

## 直接 No-Go 项

- benben active runtime bundle 未识别清楚
- adminAI `pi-embedded` bundle 未识别清楚
- 升级后包版本不是 `v2026.4.9`
- benben `memory-health-summary` / `memory-v2-eval` / `owner_private_current` / sidecar contract 任一退化
- adminAI `verify_state` 不是 `ready_to_apply` 或 `already_patched`
- `OPENCLAW_SERVICE_MARKER=openclaw-adminai` 静态审计失效
- benben `AGENTS.md` 双人生活助手三轴约束静态审计失效
- fallback chain 发生漂移

## benben runtime patch `verify_state` 语义

- `ready_to_apply`
  - 当前 reply bundle 命中 manifest `base_hash`，说明稳定 patch 还未落到目标 bundle
- `already_patched`
  - 当前 reply bundle 命中 manifest `patched_hash`，且稳定 patch markers 完整
- `optional_cutover_applied`
  - 当前 reply bundle 已包含稳定 patch，并额外叠加了 `runtime-skill-snapshot-v1`
  - 这属于受管状态，不应再被当成 reply bundle drift 误报
- `patched_drifted`
  - markers 还在，但当前 hash 已偏离受管 stable patch；先重建 baseline，不要直接继续叠补丁

## 当前 live 结论

截至 `2026-04-11`，`home-nas` 的 `openclaw@2026.4.9` live 升级已经完成，并且最新正式 `post` 报告已转为：

- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-post-v2026.4.9-20260411-081916Z.json`
- decision:
  - `go`

升级后的 steady-state `pre` 基线也已经重新采集完成：

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-083208Z.json`
- decision:
  - `baseline_ready`

当前 live 真值：

- benben:
  - `memory-health-summary.overall_status=healthy`
  - `deployment-verify` 通过
  - `memory-v2-eval=13/13`
  - `owner_private_current` 通过
  - historical sidecar=`healthy + shadow_retrieve`
- adminAI:
  - `verify_state=already_patched`
  - `transport_canary.ok=true`
  - `first_action=ocapp_diagnose`
  - `stop_on_ok=true`

升级后稳定基线重建说明：

- `20260411-082611Z` 那次 `pre` 报告不是升级回退，而是 benben 刚好有 1 个新发现的 feishu group session 尚未进入 session review
- 该 session:
  - `55d8bf0f-61dc-45a2-a6e1-633a095c90a6`
  - 内容被 rule review 判定为 `short_or_low_signal_session`
- reconcile 完成后，benben `session_review.pending_reconcile_count=0`
- `memory-health-summary.overall_status` 已回到 `healthy`
- 因此 `20260411-083208Z` 成为当前 `v2026.4.9` 的 steady-state pre baseline 真值

当前仍保留为 warning、但不阻断 `go` 的项：

- 无

## session review gate semantics（2026-04-11 更新）

`openclaw-upgrade-impact-assess` 现在不再只看 benben `session_review.pending_reconcile_count` 总数，而是直接读取 `memory-health-summary` 里的结构化拆分：

- `pending_reconcile_count`
- `pending_retry_count`
- `lightweight_reconcile.pending_candidate_count`
- `lightweight_reconcile.pending_skipped_count`

当前 gate 语义：

- `lightweight-only backlog`
  - 条件：`pending_reconcile_count > 0`，且 `pending_retry_count = 0`，且 `pending_skipped_count = 0`
  - 行为：记为 warning，不单独打成 `no_go`
- `model-review / retry backlog`
  - 条件：`pending_skipped_count > 0` 或 `pending_retry_count > 0`
  - 行为：继续视为 blocker

因此 benben `health` 即使短暂从 `healthy` 变成 `attention`，只要原因完全来自 lightweight-only session-review backlog，升级评估会把它解释为：

- `health gate: ok (lightweight_session_review_only)`

而不是直接落成泛化的 `benben_health_not_healthy`。

最新实机验证报告：

- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.md`
- `workspace/memory-admin/reports/openclaw-upgrade-impact-pre-v2026.4.9-20260411-091654Z.json`

该报告当前真值：

- `decision=baseline_ready`
- `health gate: ok (healthy)`
- `session_review: healthy; pending_reconcile=0 (lightweight=0, model_review=0); pending_retry=0`

本轮已关闭的 warning：

- `benben_memory_surface_markers_missing`
  - 评估工具已改为优先审 `dist/extensions/memory-core/index.js`
- adminAI forced policy probe JSON 解析噪音
  - 评估工具现在能稳定解析强制 probe 的远端 JSON
  - 当前仍可能存在 policy 语义 warning，但不再是“拿不到远端 JSON”的假失败
- `bundle_resolution_warning:pi_embedded_candidate_fallback:*`
  - `post` 阶段现在会沿 `runtime-embedded-pi.runtime-* -> pi-embedded-Vw-lS5ti.js` 解析真实 logic bundle，不再把 wrapper fallback 当 warning
- `bundle_resolution_warning:reply_candidate_fallback:*`
  - `post` 阶段现在会沿 reply loader/runtime 文件解析真实 reply logic bundle，不再对多候选列表做保守 fallback 告警
- `legacy_reply_bundle_changed`
  - 在 `memory-core` 已是 benben 真值面的前提下，reply bundle 的版本切换不再单独作为 rollout warning
- `systemd_openclaw-adminai-healthcheck.service_not_active:inactive`
  - 当 `openclaw-adminai-healthcheck.timer` 处于 `active` 时，one-shot service 在非运行窗口显示 `inactive` 现在按 expected state 处理，不再单独告警
- `adminai_policy_probe_not_ok`
  - `v2026.4.9` 的 service-gated prompt 已补强为：
    - `should_use_memory_after_diagnose 必须视为 true`
  - 最新 formal post gate 中 forced policy probe 已恢复 `ok`

## 共享 store route-guard 收编状态

`v2026.4.9` live rollout 期间还做过一条共享 runtime 安全修复：

- live file:
  - `/usr/lib/node_modules/openclaw/dist/store-Cgl8QMzI.js`
- fix intent:
  - 如果 session 已经建立在外部 channel/provider 上，后续本地/webchat 写入不应把既有外部 route metadata 降级掉

这条修复现在已经从“live 手工 patch”收编成 repo 内的正式 cutover artifact：

- helper:
  - `workspace/tools/store-route-guard-cutover.mjs`
- tests:
  - `workspace/tools/tests/store-route-guard-cutover.test.mjs`
- snippet artifacts:
  - `workspace/patches/runtime/store-base-Cgl8QMzI.route-guard-snippet.js`
  - `workspace/patches/runtime/store-patched-Cgl8QMzI.route-guard-snippet.js`
- patch artifact:
  - `workspace/patches/runtime/store-Cgl8QMzI.route-guard.patch`

这一步没有再修改 live，因为 live 里的 working fix 已经存在；本轮只是把它变成将来可复用、可验证的 cutover helper。后续如果 `store-*` bundle 再次漂移，优先复用这个 helper/patch 思路，而不是重新做一次无法追踪的 live 手工编辑。

## 人工复核项

即使工具输出可继续，也要单独看这些项目：

- `runtime` bundle 是否更换，若更换则需要重建 benben runtime hook 基线
- `pi-embedded` bundle 是否更换，若更换则需要重建 adminAI patch baseline
- `reply` bundle 是否更换，这仍是历史兼容面，通常只记 warning

## 注意事项

- `--write-report` 永远把报告写到当前 workspace 的 `memory-admin/reports/`，即使 `--mode ssh` 也是写在执行这条命令的控制机上，而不是远端 host
- `--force-adminai-probes` 会主动跑 adminAI Codex canary / policy probe；只做被动快照时可以不加
- 这个工具不会替你 apply patch，也不会修改 fallback 顺序；它只负责采集、对比和给出 go/no-go 结论
