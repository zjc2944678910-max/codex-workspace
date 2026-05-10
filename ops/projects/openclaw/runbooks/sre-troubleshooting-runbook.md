# OpenClaw 记忆系统故障排查顺序表（SRE 手册）
更新时间：2026-04-13
适用范围：stable / routing / timeline / defaults / active_tasks / proposals / promotions / explainability / runtime patch / Hermes skill/provider cutover / protected memory authorization / Telegram 输出链路。

---
## 0. 总体排查原则（固定顺序）
1) **服务面**：进程/端口/Telegram 网关是否正常。`systemctl status openclaw-gateway.service`
2) **用户可见输出链路**：reply bundle + output mode 是否处于 final_only，是否有异常 block/tool 泄漏。
3) **对象本体**：defaults / active_tasks / stable / routing / timeline 内容正确且 JSON 未损坏。
4) **生成链路**：candidate proposals 是否产生；是否进入 promotions；state 偏移量是否推进。
5) **召回链路**：memorySearch 来源、路径（stable/routing/timeline/sessions）是否可读且未被禁用。
6) **runtime patch**：hash / apply / verify / rollback 安全。
7) **explainability**：first_seen / last_confirmed / evidence_refs 是否存在，便于溯源。

---
## 1. 故障类型索引
- A. 输出问题（啰嗦、Browser/Exec/Tool 泄漏、非最终答案）
- B. defaults 问题（默认地点/语言/时区/答题风格失效或冲突）
- C. active_tasks / `/new` 连续性问题
- D. proposal → promotion 问题
- E. 召回/检索问题（记住没用上、routing/timeline 错召）
- F. 状态文件 / 写安全问题（损坏、并发覆盖、锁残留）
- G. runtime patch 问题
- H. explainability / 溯源问题

---
## 2. 每类问题的固定排查顺序与检查点

### A. 输出问题
1. **确认模式**：/usr/lib/node_modules/openclaw/dist/reply-C5LKjXcC.js 是否处于 final_only 逻辑（非 debug）。
   - 查关键过滤器：搜索 `OUTPUT_MODE_FINAL_ONLY`、`buildUserVisibleFilter` 是否存在。
2. **确认是否开启 verbose**：在聊天文本是否包含“调试/verbose/显示过程”；session verboseLevel 是否被打开。
3. **观察用户可见输出**：最近聊天是否仍含 Browser/Exec/Tool 行。
4. **若仍泄漏**：
   - 检查 reply bundle 是否被替换（见 G 节 patch 验证）。
   - 确认 gateway 重启：`systemctl restart openclaw-gateway.service` 后复测。

### B. defaults 问题（如 `/weather` 不走默认）
1. **文件**：`/root/.openclaw/workspace/memory/stable/defaults.json`（字段：weather_location_default / language_default / timezone_default / answer_style_default，元数据 metadata.first_seen/last_confirmed/evidence_refs）。
2. **辅助脚本**：`defaults-helper.mjs` 是否正常读写；确认 SUPPORTED_KEYS 未缺。
3. **调用链**：`weather-run.sh`、runtime tool dispatch（在 reply bundle 中 weather 工具注册）。
4. **冲突检查**：defaults.json 是否有空值或重复来源；必要时查备份 `defaults.json.bak-*`。
5. **验证**：在聊天输入 `/weather` 或“查天气”应走默认地点；如未走，查看 logs/工具返回。

### C. active_tasks / `/new` 连续性问题
1. **文件**：`memory/active-tasks/tasks.json` 是否存在、JSON 完整；字段：version、tasks[].id/status/title/next_step/metadata.first_seen/last_confirmed。
2. **归档**：`memory/active-tasks/archive.jsonl` 近期是否有异常空行或格式错。
3. **辅助脚本**：`active-tasks-helper.mjs` 正常（emptyStore、ensureMetadata）。
4. **注入链路**：`proposal-promoter.mjs` 会 upsert 任务；检查它的调用是否记录在 `proposal-promotions*.json[l]`。
5. **/new 流程**：确认 reply bundle 中 active task inject（Stage D/E）未被跳过；如 /new 后失忆，先看 tasks.json 是否被重置。

### D. proposal → promotion 问题
1. **生成**：`memory-admin/meta/candidate-proposals.jsonl` 是否有新行；字段含 fact/category/suggested_target_layer/confidence。
2. **状态**：`proposal-promotions-processed.json` 内 hashes 是否推进；`proposal-promotions-state.json` last_offset 是否递增、initialized 是否 true。
3. **晋升结果**：`proposal-promotions.jsonl` 是否写入；对应 active_tasks/defaults/stable 是否被更新。
4. **脚本**：`proposal-promoter.mjs` 阈值（DEF_CONF_THRESH/DEF_TOOL_THRESH）是否过高；检查 KW_PROGRESS 关键词。
5. **异常时**：确认 `safe-file-write.mjs` 是否返回错误；查看 `runtime-patch-manager` 是否影响 reply bundle 中 promoter 触发（patch anchors）。

### E. 召回 / 检索问题
1. **记忆源文件**：
   - stable：`memory/stable/*.md`
   - routing：`memory/routing/models-routing.md`
   - timeline：`memory/timeline/history-timeline.md`
   - sessions：`/root/.openclaw/workspace/output/sessions/*`（如存在）
2. **配置**：openclaw.json → agents.defaults.memorySearch.sources 是否包含 memory/sessions；extraPaths 列表。
3. **检索模型**：openclaw.json → memorySearch.model=`text-embedding-3-small`; provider=openai；cache on。
4. **常见症状**：
   - 明明写入 stable 但没召回 → 检查文本长度、是否在 top8；确认 sync 是否被停（watch 进程）。
   - routing / timeline 错召 → 查看模型路由文件是否最新，是否包含过期条目。
5. **必要命令**：`ls -l memory/stable`, `rg "关键词" memory/stable` 验证存在；检查 output/logs 是否有 memory_search 错误。

### F. 状态文件 / 写安全问题
1. **检查损坏**：对所有 JSON 关键文件跑 `jq . file`（tasks.json, defaults.json, proposal/promotions state）。
2. **写安全**：确认 `safe-file-write.mjs` 存在且使用 writeJsonAtomic/appendJsonlAtomic；查看文件是否存在 `.lock` 残留（一般不应有）。
3. **原子写与锁**：若发现部分文件 0 字节或半截，先从对应 `.bak` 或归档恢复。
4. **一致性**：state 文件中的 last_offset 与 jsonl 行数是否匹配；不一致时先备份再校正。
5. **保护面授权优先级**：
   - 先跑 `openclaw memory-ops authorize-state --mode audit-drift --dry-run --json`
   - 如果返回 `memory-authorize-state: no audit file found`，先生成一份：
     - `node tools/memory-audit.mjs --workspace "$WORKSPACE" --json > memory-admin/meta/memory-audit-YYYYMMDD-HHMMSS.json`
   - 只对白名单 drift 做授权时，用 repeated `--path` 和 `--allow-kind`
   - `audit-drift` 适合 benign、已审计、可解释的漂移；不要一上来就 `seed-protected`
6. **何时才用 seed-protected**：
   - 大范围、明确受控的基线重建
   - managed rollout 或结构迁移后需要整体重签名
   - 如果只是少量审计可解释的写入，优先 `audit-drift`

### G. runtime patch 问题
1. **清单**：`patches/runtime/patch-manifest.json`，目标 reply bundle = `reply-C5LKjXcC.js`。
2. **当前哈希与状态**：`node tools/runtime-patch-manager.mjs verify`
   - `verify_state=already_patched`：stable patch 已落地
   - `verify_state=optional_cutover_applied`：stable patch + `runtime-skill-snapshot-v1` 都已落地
   - `verify_state=ready_to_apply`：当前还是 base，需要先打 stable patch
   - `verify_state=patched_drifted`：markers 还在，但 hash 已偏离受管快照
3. **状态细节**：`runtime-patch-manager.mjs status/preflight/verify` 可比对 base_hash/patched_hash、snapshot hash parity、optional cutover state；`collectBackups()` 输出备份列表。
4. **操作顺序**：
   - 只读：`node tools/runtime-patch-manager.mjs status`
   - 检查 anchors：`verify`
   - 需要叠加 Hermes skill cutover 时：`apply --enable-skill-registry-v2-cutover`
   - 异常时：`rollback-safe`（最近备份），或 `rollback-base`（使用 reply-base 快照）
5. **发布后记得**：重启 gateway：`systemctl restart openclaw-gateway.service`。

### H. explainability / 溯源问题
1. **字段位置**：active_tasks.metadata、defaults.metadata、proposals/promotion 记录的 first_seen / last_confirmed / evidence_refs。
2. **生成端**：`active-tasks-helper.mjs` 和 `defaults-helper.mjs` 的 ensureMetadata；`proposal-promoter.mjs` 写 evidence_refs。
3. **排查**：如字段缺失，检查写入链是否跳过 helper；是否存在旧格式未迁移（value 字符串而无 metadata）。

---
## 3. 快速命令最小清单
- 服务健康：`systemctl status openclaw-gateway.service`
- 输出过滤检查：`rg "OUTPUT_MODE_FINAL_ONLY" /usr/lib/node_modules/openclaw/dist/reply-C5LKjXcC.js`
- defaults 查看：`cat /root/.openclaw/workspace/memory/stable/defaults.json | jq .`
- active tasks：`cat /root/.openclaw/workspace/memory/active-tasks/tasks.json | jq .`
- proposals 头尾：`tail -n 5 memory-admin/meta/candidate-proposals.jsonl`
- promotions 状态：`cat memory-admin/meta/proposal-promotions-state.json | jq .`
- runtime patch verify：`node /root/.openclaw/workspace/tools/runtime-patch-manager.mjs verify`
- 受保护记忆授权预演：`openclaw memory-ops authorize-state --mode audit-drift --dry-run --json`
- 路由/时间线查词：`rg "关键词" memory/stable memory/routing memory/timeline`

---
## 4. 结果分流指引
- 仅用户输出异常 → 调整 reply bundle / restart gateway。
- defaults 失效 → 修 defaults.json 或 defaults-helper；复测 /weather。
- `/new` 不接任务 → 校正 tasks.json / proposal-promoter 状态。
- proposal/promotion 链路断 → 对应 jsonl/state 校正；重跑 promoter。
- 召回缺失 → 校验 memorySearch 配置、文件存在性、模型/缓存。
- 状态文件损坏 → 用 .bak / archive 恢复，保持 atomic 写。
- 少量合法受保护写入 → 先用 `memory-ops authorize-state --mode audit-drift --dry-run` 选中范围，再执行正式授权。
- patch hash 不符 → rollback-safe/base 后再 verify。
- explainability 缺失 → 补 metadata 字段，确保 helper 写入链条。

---
## 5. 建议存放位置
已保存本文件：`/root/.openclaw/workspace/memory-admin/reports/openclaw-sre-troubleshooting-runbook.md`
如需让团队共用，可在 README / TOOLS 里附链接，但避免放入高频召回目录（stable）以免污染记忆。

---
## 6. 当前最值得优先盯的 3 个故障点
1) **unauthorized memory writes**：先用 `audit-drift --dry-run` 区分 benign drift 和真实越权写入，避免误用 `seed-protected` 把问题整体抹平。
2) **reply runtime verify_state 漂移**：例行确认 `already_patched` / `optional_cutover_applied` / `patched_drifted`，不要只盯 bundle hash。
3) **candidate rehearsal 阻断**：升级前优先看 benben runtime rehearsal 和 optional Hermes cutover 状态，避免把可选 cutover 误判成 live blocker。

---
## 7. 适用性结论
这份手册覆盖常见八类故障，给出固定检查顺序与文件/字段位置，可作为当前观察期标准排障入口；后续若新增层（如新 Stage）需追加对应步骤。
