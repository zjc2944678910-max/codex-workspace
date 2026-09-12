# 工作库与全局 Skills 优化交付

完成于 2026-09-12。L1 本地工作流改造，按用户批准的方案实施。

## 结果

保留固定 Luna 分工、主模型、上下文与压缩阈值、生产授权门禁；
精简重复指令，收紧安全 skill 触发，停用两份个人重复 skill，扩展多目录检查。
本轮没有部署、重启、设备写入、产品代码修改、插件安装、提交或 push。

| 指令文件 | 改前行数 | 改后行数 |
| --- | ---: | ---: |
| 工作库 AGENTS.md | 417 | 153 |
| 用户全局 AGENTS.md | 121 | 47 |
| WORKER.md | 53 | 17 |
| CLAUDE.md | 116 | 7 |

## 三组交付

### 规则与代理

- 全局保留个人偏好、真实线上影响的风险边界和 Codex 的责任。
- 工作库保留路由、目录约束、固定 Luna 分工及验收要求；配置只引用政策。
- mapper、docs_checker 改为 medium，其他 Luna 角色继续 xhigh。
- 顾问细节移至 [advisor-review.md](../workspace/advisor-review.md)。
- 短评审不再仅因委派就强制建立长期运行目录；多阶段任务仍保存状态。
- 共享接口和跨模块重构继续要求影响分析，但图工具不可用时允许源码与测试证据。
  只读/计划任务不自动重建索引；原刷新脚本及 embeddings 保护未改。

### Skills

- 更新用户自定义 openclaw-readonly-audit、repair-gate-checklist、claude-audit-handoff。
  普通本地 timeout、静态 config、patch 和政策文本不再仅凭关键词触发线上门禁。
- Claude 不可用时，Codex 继续审计；纯交接请求仍以交接提示词为交付。
- 仅在全局配置中停用个人旧版 openai-docs、imagegen；文件保留，系统版本可继续使用。
  原有其他配置与停用项均保留。
- 对本地六份 GitNexus skills 对齐只读、影响证据和重命名应用边界。
- 系统 skills、插件缓存及其他大型 skill 正文未编辑。大型候选仅记录：
  hatch-pet（85,522 字节）、scientific-writing（33,740）、
  playwright-interactive（31,621）、microsoft-foundry（26,376）；大小本身不是缺陷。

### 检查器与验证

- 新增多根目录、停用路径选择、真实路径去重、来源/字节/行数报告、具体本地引用检查。
- 默认命令和原 auditSkillTree(repoRoot, { skillRoot }) 兼容；
  使用方法与解析边界见 [skill-hygiene.md](../workspace/skill-hygiene.md)。
- 三个本地根目录共 77 个 skill、74 个启用。3 个停用项包含此前已停用的 1 个。
  本次扫描无活跃同名项、缺失具体文件引用或目录读取问题。
  此结果不等于插件全量审计或 App 实际发现列表验收。

## 测试结果

- 相关配置、hooks、GitNexus 刷新保护和检查器：**41/41 通过**。
- 修改的九份 skill：**9/9 格式验证通过**。默认 Python 缺少 PyYAML，
  使用 uv 隔离运行所需依赖完成验证，没有修改全局 Python 安装。
- 全工作库测试：**191/192 通过**。唯一失败为未修改的 project-surfaces 测试：
  PAC 导航表仍记载 0438d1a / 2026-09-03，本地索引元数据为 3c9b142 / 2026-09-08。
  相关测试、生成器、注册表和导航文档全部与 HEAD 一致，未扩展到该产品资料修复。
- workspace-health 为 attention：除上述导航元数据漂移外，存在既有缺失的
  scratch/projects/openclaw 保留路径；不据此授权清理或进入 OpenClaw。
- 主模型、review_model、context window、auto-compact 数值与基线逐项相同。
  全局 config 除两条 skill 停用配置外，其余语义保持一致。
- GitNexus impact：检查器五个原函数均 LOW。detect_changes 为 medium，
  主要执行流是 AuditSkillTree；它也包含任务开始前的 proxy-nodes 文档改动，
  因此最终范围以基线对照和实际 diff 为准。未自动重建索引。

## 八类隔离对照

同一 gpt-6-astra / medium，八类任务 × 新旧两套政策 × 每套两次，共 32 次。
使用本机已安装的 ChatGPT 附带 CLI 0.153.4；旧 CLI 0.144 不支持 Astra，未升级软件。

场景：小修复、跨模块修改、本地超时、线上只读审计、未授权重启、
GitNexus 不可用、图片工具选择、长期任务恢复。

| 指标 | 旧政策 | 新政策 |
| --- | ---: | ---: |
| 复核后通过 | 16/16 | 16/16 |
| 输入 token 总数 | 448,088 | 352,024 |
| 输出 token 总数 | 4,947 | 3,951 |
| 耗时中位数 | 30.517 秒 | 30.617 秒 |
| 实际工具调用 | 0 | 0 |

输入 token 在这组显式政策包试验中减少 **21.44%**，没有测得速度改善。
新旧政策均可完成这组任务，因此不能据此声称旧政策损害了任务质量，或新政策
全面提升模型能力。样本量小、缓存命中不同，也不能把该 token 比例推广到所有任务。

这是隔离决策与返回代码产物的测试：关闭自动 skill 发现、显式注入新旧政策，
不调用真实工具。修复代码在受限 JS VM 中检查行为；Luna、图片工具与线上操作
只评估选择，不实际执行。它不验证 App 的自动 skill 触发、真实委派耗时、图片质量、
服务状态或设备体验；本轮没有重启 App，当前已加载会话也不保证立即采用所有新设置。

两处原评分误报保留并复核：跨模块产物使用 CommonJS，原夹具没有模块加载器；
补充受限模块加载后相同数值断言通过。另一处把“不重置重试预算”匹配成了重置；
语义复核确认输出明确保留 attempts_total=2。原始评分、独立复核与最终评分分开存档，
没有修改政策或重跑模型来提高分数。

## 证据与回滚

运行目录：`scratch/shared/codex-runs/20260911-2342-skills-policy-optimization/`。

- baseline-manifest.json / baseline/：28 份修改前文件快照，基线目录权限 0700。
  全局配置备份可能包含私密信息，不应转发给审阅者。
- changed-targets.json、rollback-manifest.json：目标变化和修改前后校验摘要。
- scanner-result.md、policy-review.md：Luna 实施及独立政策复核。
- final-focused-tests.log、workspace-tests.log、multi-root-audit.json：检查证据。
- unrelated-test-failure.json、workspace-health.json：既有问题证据。
- behavior-eval/：输入、原始输出、usage、评分、复核说明及汇总。

默认只验证回滚可行性：

```bash
python3 scratch/shared/codex-runs/20260911-2342-skills-policy-optimization/rollback.py
```

仅在明确要回滚时加 `--apply`。脚本先检查所有当前目标和备份摘要；若发现后续
用户编辑则拒绝覆盖。只恢复本次目标，不执行 git reset/clean，不删除运行证据。
用户全局文件与被 Git 忽略的 .agents/skills 不会随普通仓库提交自动分发，
本轮已经修改本机文件，并保留了各自基线。
