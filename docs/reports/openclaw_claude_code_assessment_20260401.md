# OpenClaw 视角下的 Claude Code 泄露实现评估

日期: 2026-04-01

分析范围:

- 泄露代码压缩包: `/Users/zhangjincheng/Downloads/claw-code-main.zip`
- 解压后工作目录: `/tmp/openclaw_analysis/claw-code-main`
- NAS 上可见的 OpenClaw 运行时和脚本:
  - `/home/cc/MacBookpro/.openclaw-runtime/openclaw-2026.3.2/package.json`
  - `/home/cc/.openclaw/openclaw.json`
  - `/home/cc/openclaw-sync/session-working-capture.mjs`
  - `/home/cc/openclaw-sync/memory-maintenance-runner.sh`
  - `/home/cc/openclaw-sync/memory-health-summary.mjs`
  - `/home/cc/openclaw-sync/memory-retrieval-routes.mjs`
  - `/home/cc/openclaw-sync/recall-plane-builder.mjs`
  - `/home/cc/openclaw-sync/memory-phase1-helper.mjs`

边界说明:

- 我没有去追任何私有接口复现，也没有尝试复原 Anthropic 内部环境。
- `openclaw@home-nas` 当前不可直接登录；NAS 上实际可见项目痕迹在 `cc` 用户目录下。以下关于大龙虾的判断，基于 NAS 上当前可见运行时、配置和 memory/session 工具链。

## 先给结论

对大龙虾真正有帮助的，不是“Claude Code 的神秘能力”，而是 5 个更朴素但非常实用的工程模式:

1. 本地 session 持久化和恢复路径要极简、可诊断、可切换。
2. 工具要有明确 contract 和风险等级，审批链路要和 contract 绑定。
3. 项目级 instruction/context 文件要有继承和预算控制。
4. MCP/stdin 工具进程管理要做成 typed manager，而不是散落在各处的 ad-hoc 调用。
5. Provider 调用层要把重试、request id、OAuth/token 刷新、stream 解析隔离成独立模块。

对大龙虾帮助不大的部分同样明确:

1. 泄露代码并没有成熟的长期记忆系统。
2. 泄露代码并没有成熟的多 agent 执行框架。
3. 所谓 daemon/background/bridge 大多还是“兼容骨架”或上游痕迹，不是可直接拿来用的生产实现。
4. sandbox/权限边界是有想法，但文件系统隔离非常弱，不能照抄。
5. 观测性和 trace 基本不够，大龙虾不能从这里抄出一个成熟运维面。

结合 NAS 上当前 OpenClaw 状态看，你的大龙虾在 memory/recall/governance 这一块已经明显比泄露代码更强。真正值得吸收的是 session、tool contract、approval、MCP 管理、provider adapter 这些“底座能力”，而不是回退去模仿它更简单的 memory 方案。

---

## 第一部分：先理解泄露代码本身

### 1. 顶层目录结构

| 目录 | 作用 | 判断 |
| --- | --- | --- |
| `.claude/sessions/` | 示例 session JSON | 明显实现 |
| `rust/` | 真正的主要实现面 | 明显实现 |
| `rust/crates/api` | Anthropic API client + SSE + OAuth | 明显实现 |
| `rust/crates/commands` | slash command 元数据和 resume 支持 | 明显实现 |
| `rust/crates/compat-harness` | 从上游 TS 归档提取命令/工具/启动阶段 | 明显实现，但不是 runtime |
| `rust/crates/runtime` | session/runtime/config/prompt/tool loop/MCP/sandbox | 明显实现 |
| `rust/crates/rusty-claude-cli` | CLI/REPL 入口 | 明显实现 |
| `rust/crates/tools` | 内建工具注册与执行 | 明显实现 |
| `src/` | Python 端“porting workspace”与索引/模拟层 | 明显实现，但不是主运行时 |
| `tests/` | Python 端验证 | 明显实现 |
| `assets/` | 文档图像 | 非运行时 |

关键判断:

- 这份仓库不是“原始泄露代码”原样保留。
- 按 README，Python `src/` 是 porting workspace；Rust `rust/` 才是当前最接近可运行 harness 的实现。
- 因此对大龙虾有参考价值的，主要是 Rust workspace，而不是顶层 Python 模拟层。

证据:

- `README.md`
- `rust/README.md`
- `src/main.py`
- `src/query_engine.py`

### 2. 主要模块边界

| 模块 | 主要边界 | 证据 |
| --- | --- | --- |
| `api` | Provider API、SSE、OAuth、重试 | `rust/crates/api/src/client.rs`, `error.rs`, `sse.rs` |
| `runtime` | session、turn loop、config、prompt、permissions、sandbox、MCP、usage | `rust/crates/runtime/src/lib.rs` |
| `tools` | 工具 schema、permission requirement、执行器 | `rust/crates/tools/src/lib.rs` |
| `commands` | slash command surface、resume compatibility | `rust/crates/commands/src/lib.rs` |
| `rusty-claude-cli` | REPL/CLI、session 文件管理、输出渲染、交互审批 | `rust/crates/rusty-claude-cli/src/main.rs` |
| `compat-harness` | 读取上游归档做 manifest 抽取 | `rust/crates/compat-harness/src/lib.rs` |

### 3. session / memory / agent / tool / permissions / config / transport / UI / CLI / logging 相关模块

#### Session

- `rust/crates/runtime/src/session.rs`
  - `Session`
  - `ConversationMessage`
  - `ContentBlock`
  - `Session::save_to_path`
  - `Session::load_from_path`
- `rust/crates/rusty-claude-cli/src/main.rs`
  - `sessions_dir`
  - `create_managed_session_handle`
  - `list_managed_sessions`
  - `/resume`
  - `/session list`
  - `/session switch`

判断:

- session 是纯 JSON 文件持久化。
- 管理维度是单工作目录下的 `.claude/sessions/*.json`。
- 这是典型“本地 coding CLI”方案，不是多租户或服务端 session 系统。

#### Memory / Context

- `rust/crates/runtime/src/prompt.rs`
  - `ProjectContext`
  - `discover_instruction_files`
  - `render_instruction_files`
  - `load_system_prompt`
- `rust/crates/runtime/src/compact.rs`
  - `compact_session`
  - `format_compact_summary`
  - `get_compact_continuation_message`
- `rust/crates/rusty-claude-cli/src/main.rs`
  - `render_memory_report`

判断:

- 这里的“memory”主要是:
  - 项目 instruction files: `CLAUDE.md`, `CLAUDE.local.md`, `.claude/CLAUDE.md`, `.claude/instructions.md`
  - session compaction summary
- 不存在明显的长期记忆、向量检索、事实升格、recall plane。

#### Agent

- `rust/crates/tools/src/lib.rs`
  - `ToolSpec` 里存在 `Agent`
  - `execute_agent`

判断:

- `Agent` 不是实际多 agent runtime。
- `execute_agent` 只是写出 `.clawd-agents/<agent-id>.md` 和 manifest JSON，状态写成 `queued`。
- 没有 worker/supervisor/IPC/结果回流。

结论:

- 多 agent 是表面接口，不是成熟能力。

#### Tool

- `rust/crates/tools/src/lib.rs`
  - `ToolSpec`
  - `mvp_tool_specs`
  - `execute_tool`
- `rust/crates/rusty-claude-cli/src/main.rs`
  - `CliToolExecutor`
  - `filter_tool_specs`

判断:

- 工具定义和执行是分开的。
- 每个工具都带 schema 和 `required_permission`。
- 这是这份代码里最值得借鉴的部分之一。

#### Permissions

- `rust/crates/runtime/src/permissions.rs`
  - `PermissionMode`
  - `PermissionPolicy`
  - `PermissionPrompter`
  - `PermissionRequest`
- `rust/crates/rusty-claude-cli/src/main.rs`
  - `CliPermissionPrompter`
  - `permission_policy`

判断:

- 权限是“工具级别的 mode gate”，不是资源级/路径级/策略引擎级权限系统。
- mode 只有:
  - `ReadOnly`
  - `WorkspaceWrite`
  - `DangerFullAccess`
  - `Prompt`
  - `Allow`

#### Config

- `rust/crates/runtime/src/config.rs`
  - `ConfigLoader`
  - `RuntimeConfig`
  - `RuntimeFeatureConfig`
  - `McpServerConfig`
  - `OAuthConfig`
  - `SandboxConfig`

判断:

- 配置采用 user/project/local 分层 merge:
  - `~/.claude.json`
  - `~/.claude/settings.json`
  - `<cwd>/.claude.json`
  - `<cwd>/.claude/settings.json`
  - `<cwd>/.claude/settings.local.json`
- 这是很实用的配置 layering 模式。

#### Transport

- `rust/crates/api/src/sse.rs`
- `rust/crates/runtime/src/mcp_client.rs`
- `rust/crates/runtime/src/mcp_stdio.rs`
- `rust/crates/runtime/src/remote.rs`

判断:

- 模型供应商 transport: HTTP + SSE。
- 工具侧 transport: MCP typed config 支持 stdio / sse / http / ws / sdk / claude-ai-proxy。
- 但实际 `McpServerManager` 只管 stdio；远程 transport 主要停留在 bootstrap/config 层。

#### UI / CLI

- `rust/crates/rusty-claude-cli/src/main.rs`
- `rust/crates/rusty-claude-cli/src/input.rs`
- `rust/crates/rusty-claude-cli/src/render.rs`

判断:

- 有成熟度中等的 CLI/REPL 交互。
- 有 slash command、输入历史、多行输入、命令补全、Markdown 渲染。
- 没看到复杂 TUI 或桌面 UI 主实现。

#### Logging / Usage / Status

- `rust/crates/runtime/src/usage.rs`
- `rust/crates/rusty-claude-cli/src/main.rs`
- `rust/crates/api/src/client.rs`

判断:

- 有 usage tracking、status report、request id。
- 没有真正的 trace/span/log pipeline。
- 甚至 `api::AnthropicClient::send_raw_request` 直接 `eprintln!` 输出 base_url/header 状态，比较粗糙。

### 4. feature flags / 实验开关 / 未发布能力

明显存在的“开关/未发布痕迹”有 3 类:

1. 上游归档 feature gate 抽取
   - `compat-harness::extract_commands`
   - `compat-harness::extract_tools`
   - 它会识别 `feature('...')`
   - 说明原上游有 feature-gated surface
   - 但这是“提取器”，不是当前 runtime 自己的 feature-flag 框架

2. Config surface 里存在若干看起来像功能开关的 setting
   - `autoCompactEnabled`
   - `autoMemoryEnabled`
   - `autoDreamEnabled`
   - `fileCheckpointingEnabled`
   - `todoFeatureEnabled`
   - `teammateMode`
   - `permissions.defaultMode`
   - 证据: `rust/crates/tools/src/lib.rs` 的 `supported_config_setting`

3. Bootstrap skeleton 暗示了大量上游模式
   - `DaemonWorkerFastPath`
   - `BridgeFastPath`
   - `DaemonFastPath`
   - `BackgroundSessionFastPath`
   - `EnvironmentRunnerFastPath`
   - 证据: `rust/crates/runtime/src/bootstrap.rs`

判断:

- 这些开关和 phase 不能等同于“当前仓库真的实现了这些能力”。
- 其中很大一部分更像“镜像 surface”或“上游兼容痕迹”。

### 5. 错误处理、重试、恢复机制

明显实现:

- API 层有 typed error 和 retry/backoff
  - `api/src/error.rs`
  - `api/src/client.rs::send_with_retry`
- session 有 save/load
  - `runtime/src/session.rs`
- REPL 每轮后 persist session
  - `rusty-claude-cli/src/main.rs::persist_session`
  - `run_repl`
- compaction 允许在 resume 后对 session 文件直接压缩并写回
  - `run_resume_command`

成熟度判断:

- API retry: 中等成熟
- session 恢复: 中等成熟
- checkpoint / 断点续跑: 弱
- tool side-effect recovery: 证据不足

缺失:

- 没有看到 append-only event log
- 没有看到工具执行 checkpoint
- 没有看到 crash recovery transaction
- 没有看到 shell/background 任务恢复

### 6. 是否存在后台 agent、守护进程、长生命周期任务

明显实现:

- `bash` 支持 `run_in_background`
- 返回 `background_task_id`
- 证据: `runtime/src/bash.rs`

但要明确:

- 这是“后台 shell child process”，不是长期 agent supervisor。
- 没有看到 PID 恢复、心跳、租约、持久状态机、重连机制。

关于 daemon:

- `bootstrap.rs` 里有 `DaemonFastPath` 等 phase
- `compat-harness` 也会从上游入口里识别 daemon/bridge/background session
- 但当前 CLI 主入口并没有对应的完整 daemon 分支实现

结论:

- 真正的“常驻 agent/守护进程”证据不足。
- 现有背景任务能力不够拿来直接当大龙虾常驻 agent 底座。

### 7. 是否有上下文压缩、摘要、长期记忆机制

明确有:

- deterministic session compaction
  - `runtime/src/compact.rs`
- instruction file 继承 + budget
  - `runtime/src/prompt.rs`

明确没有:

- 长期记忆存储
- durable facts promotion
- retrieval plane
- working memory/stable memory 分层
- recall routing

结论:

- 有“上下文压缩”
- 没有“大龙虾意义上的 memory 系统”

### 8. 是否存在多 agent 协作、子任务委派、planner / executor 分层

表面迹象:

- `Agent` 工具
- `teammateMode` config
- bootstrap phase 里有多种 fast path 名称

实际落地:

- `execute_agent` 只是写队列文件
- 没有真正 worker/executor
- 没有 planner/executor/council 机制

结论:

- 只有表面接口
- 不能把它当成成熟多 agent 架构

### 9. 工具调用的注册、路由、权限与审批模型

明显实现:

- `ToolSpec`
  - name
  - description
  - input_schema
  - required_permission
- `execute_tool`
- `PermissionPolicy`
- `CliPermissionPrompter`
- `--allowedTools` 过滤

判断:

- 注册、路由、permission contract 是清晰的。
- 审批流很简单，但结构干净。
- 这块是最适合抽象后借鉴给大龙虾的。

### 10. 与模型供应商或模型调用相关的抽象层

明显实现:

- `runtime::ApiClient` trait
- `AnthropicRuntimeClient`
- `api::AnthropicClient`
- OAuth/token refresh
- retry/backoff
- SSE parser

判断:

- Provider adapter 分层是清楚的。
- 当前实现强绑定 Anthropic，但分层方式是对的。

### 11. 状态持久化方式

| 状态 | 持久化方式 | 证据 |
| --- | --- | --- |
| session | JSON 文件 | `runtime/src/session.rs`, `.claude/sessions/*.json` |
| OAuth credentials | `credentials.json` | `runtime/src/oauth.rs` |
| todo | `.clawd-todos.json` | `tools/src/lib.rs::todo_store_path` |
| agent queue | `.clawd-agents/*.json` + `.md` | `tools/src/lib.rs::execute_agent` |
| config | JSON 文件 | `runtime/src/config.rs`, `tools/src/lib.rs::execute_config` |

判断:

- 全部是文件型持久化。
- 没有看到 sqlite/postgres/kv/event store。

### 12. 插件体系、扩展机制、可插拔边界

明显存在:

- Skills 文件加载
  - `tools/src/lib.rs::execute_skill`
- MCP server config
  - `runtime/src/config.rs`
- MCP stdio process manager
  - `runtime/src/mcp_stdio.rs`

但不应高估:

- 没有真正意义上的“插件 runtime lifecycle”
- 没有版本协商、隔离、权限沙箱、扩展发布机制
- `Skill` 只是读取本地 markdown 提示文件

结论:

- 是“可插拔边界雏形”
- 不是成熟插件系统

---

## 第二部分：建立“大龙虾 OpenClaw 适配视角”

先说大龙虾当前侧重能力。根据 NAS 上现有运行时和脚本，我看到:

- 你已经有 agent defaults / subagents concurrency / compaction mode
  - 证据: `/home/cc/.openclaw/openclaw.json`
- 你已经有常驻 memory maintenance runner、锁文件、阶段化维护、报告输出
  - 证据: `/home/cc/openclaw-sync/memory-maintenance-runner.sh`
- 你已经有 retrieval routing、recall plane、working memory capture、governance policy、channel/chatType scope
  - 证据: `/home/cc/openclaw-sync/memory-retrieval-routes.mjs`
  - `/home/cc/openclaw-sync/recall-plane-builder.mjs`
  - `/home/cc/openclaw-sync/memory-phase1-helper.mjs`
  - `/home/cc/openclaw-sync/session-working-capture.mjs`
- 你已经有 plugin-sdk / extensions / gateway / rpc / tui / ui
  - 证据: `/home/cc/MacBookpro/.openclaw-runtime/openclaw-2026.3.2/package.json`

所以适配原则应该是:

- memory 不要向泄露代码看齐，应该只吸收其更轻的 context 管理技巧
- 插件系统也不需要回退到它更简单的 skill + MCP 雏形
- 真正值得吸收的是“本地 harness 的内核工程 hygiene”

### 适配判断总表

| 模块/机制 | 这是什么 | 解决的问题 | Claude Code 为什么可能这么设计 | 对大龙虾价值 | 分类 | 原因 | 迁移成本 | 潜在风险 | 最合理落地方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Session JSON + managed sessions | 每个工作区 `.claude/sessions/*.json` + list/switch/resume | 本地 CLI 会话恢复 | 简单、可诊断、无外部依赖 | 高 | 改造后可借鉴 | 大龙虾也需要稳定 session 恢复，但不能只靠 cwd 文件 | 中 | 维护风险低，产品复杂度低 | 做成“大龙虾 session journal + snapshot”，保留 list/switch/replay 能力 |
| `compact.rs` deterministic compaction | 本地生成 summary system message，保留最近消息 | 控制上下文长度 | 便宜、无需额外模型调用 | 中 | 只有思路参考价值 | 大龙虾已有更复杂 memory/recall；直接照抄会降级 | 低 | 信息丢失风险 | 只借 continuation envelope 形式，不借它的 summary 逻辑 |
| `prompt.rs` instruction inheritance | 祖先目录中 `CLAUDE*.md` 继承、去重、截断 | 项目级指令加载 | coding harness 需要 repo-local guidance | 高 | 可直接借鉴 | 对代码代理极实用，且和你现有 memory 不冲突 | 低 | 复杂度低 | 在 OpenClaw coding/ops 子代理中引入 repo instruction loader |
| `PermissionPolicy` + `ToolSpec.required_permission` | 工具级权限 contract + 审批 | 限制高风险工具自动执行 | 交互式 CLI 需要最小可解释审批 | 高 | 改造后可借鉴 | 结构干净，但粒度太粗 | 中 | 安全风险中 | 扩展为风险类型、资源范围、渠道来源、外部集成级审批 |
| `bash.rs` + `sandbox.rs` | shell 执行、timeout、background、Linux unshare | 执行系统命令 | coding harness 必需 | 中 | 改造后可借鉴 | shell contract 值得借，sandbox 不能直接信 | 中 | 安全风险高 | 借输出 envelope、timeout、background 协议；sandbox 重写 |
| `McpServerManager` | stdio MCP 发现、tool route、call/shutdown | 管理工具进程 | 给工具扩展留标准协议口 | 高 | 改造后可借鉴 | 结构好，但只支持 stdio | 中 | 耦合风险中 | 抽成 OpenClaw plugin/tool bridge 的受管进程层 |
| `api::AnthropicClient` + `ApiClient` trait | Provider adapter、SSE、OAuth、retry | 隔离供应商调用细节 | 避免 API 逻辑污染 runtime | 高 | 可直接借鉴 | 大龙虾本来就多模型/多通道，更需要这一层 | 中 | 维护风险低 | 做统一 provider adapter + request id + retry policy |
| `execute_agent` | 把 agent 任务写到文件队列里 | 给模型一个“委派”表面 | 先有 API surface，再补执行器 | 低 | 不建议借鉴 | 对大龙虾几乎没实际帮助 | 低 | 产品复杂度误导 | 不抄。直接做真实 subagent supervisor |
| Config layering | user/project/local merge | 定位配置优先级 | 本地开发者工具常见模式 | 高 | 可直接借鉴 | 对大龙虾的 coding/runtime profile 非常适用 | 低 | 风险低 | 沿用三层配置，但字段体系按 OpenClaw 重设 |
| Remote upstream proxy helpers | 远程 session + token + CA bundle + proxy env | 接入 Anthropic 私有远程环境 | 适配其私有运行环境 | 低 | 不建议借鉴 | 强依赖私有生态 | 高 | 合规/耦合风险高 | 忽略，只保留“远程连接配置集中化”的思路 |
| Python porting workspace | 上游 surface 映射/查询工具 | 做 clean-room 对照与分析 | 便于理解归档 | 低 | 只有思路参考价值 | 不是生产 agent runtime | 低 | 维护风险中 | 如果你要做“架构审计器”，可参考其 manifest 思路 |

---

## 第三部分：大龙虾最关心的 12 项能力评估

| 能力 | 泄露代码里是否有明显实现 | 证据 | 成熟度 | 是否适合大龙虾 | 推荐动作 |
| --- | --- | --- | --- | --- | --- |
| 1. Session 生命周期管理 | 有，但偏本地 CLI | `runtime/src/session.rs`, `rusty-claude-cli/src/main.rs` | 中 | 适合，但要服务化改造 | 改造 |
| 2. 长期记忆 / 上下文压缩 / summarization | 只有 instruction files + local compaction | `runtime/src/prompt.rs`, `runtime/src/compact.rs` | 低到中 | instruction loader 适合；长期记忆不适合 | 改造 |
| 3. 多 agent / 子任务拆分 / planner-executor / council | 只有表面接口 | `tools/src/lib.rs::execute_agent` | 低 | 不适合直接吸收 | 放弃 |
| 4. Tool registry / routing / contracts | 明显有 | `tools/src/lib.rs::ToolSpec`, `execute_tool` | 中到高 | 适合 | 采用 |
| 5. 用户确认机制 | 明显有 | `runtime/src/permissions.rs`, `CliPermissionPrompter` | 中 | 适合，但要持久化审计 | 改造 |
| 6. 高风险操作拦截 | 有粗粒度模式 | tool required_permission + permission mode | 中 | 适合，但粒度不够 | 改造 |
| 7. 沙箱 / 权限模型 / 执行边界 | 有，但文件系统隔离很弱 | `runtime/src/sandbox.rs`, `runtime/src/bash.rs` | 低到中 | 不适合直接用 | 观察 |
| 8. 后台任务 / 守护进程 / 常驻 agent | 只有 background shell 和骨架 phase | `runtime/src/bash.rs`, `runtime/src/bootstrap.rs` | 低 | 不适合直接用 | 放弃 |
| 9. 故障恢复 / checkpoint / retry / resumability | API retry + session restore 有；checkpoint 没有 | `api/src/client.rs`, `session.rs`, `main.rs` | 中 | 部分适合 | 改造 |
| 10. 可观测性 | usage/status 有；trace 很弱 | `runtime/src/usage.rs`, `main.rs` | 低 | 不够 | 放弃 |
| 11. CLI / TUI / UI 交互设计 | CLI/REPL 做得还行 | `rusty-claude-cli/src/main.rs`, `input.rs` | 中 | 局部适合 | 观察 |
| 12. 插件系统 / 扩展点设计 | MCP + Skill 雏形 | `runtime/src/mcp_stdio.rs`, `tools/src/lib.rs::execute_skill` | 中偏低 | OpenClaw 只适合借一部分 | 改造 |

### 1. Session 生命周期管理

- 会话创建: 有，启动 REPL 时创建 `session-<timestamp>.json`
- 会话恢复: 有，`--resume`、`/resume`、`/session switch`
- 会话隔离: 只按 cwd 目录隔离，不是租户级
- 会话过期: 证据不足
- 会话压缩: 有，`/compact`

判断:

- 对大龙虾值得吸收，但只能吸收“接口和持久化纪律”，不能直接照搬“cwd 下 JSON 文件”。

推荐动作: 改造

### 2. 长期记忆 / 上下文压缩 / summarization

- 明显实现:
  - instruction file inheritance
  - deterministic compaction
- 没有:
  - durable memory
  - retrieval plane
  - promotion pipeline

判断:

- 大龙虾已有更强 memory 体系。
- 值得吸收的是 instruction file budget 和 continuation envelope。

推荐动作: 改造

### 3. 多 agent / 子任务拆分 / planner-executor / council

- 明显实现: 不足
- 证据: `execute_agent` 只写文件队列
- 做法成熟度: 低
- 是否适合大龙虾: 不适合

推荐动作: 放弃

### 4. Tool registry / tool routing / tool contracts

- 明显实现: 有
- 证据:
  - `ToolSpec`
  - `required_permission`
  - `input_schema`
  - `execute_tool`
- 做法成熟度: 中到高
- 是否适合大龙虾: 适合

推荐动作: 采用

### 5. 用户确认机制（approval flow）

- 明显实现: 有
- 证据: `PermissionPolicy::authorize`, `CliPermissionPrompter`
- 成熟度: 中
- 适配性:
  - 对单机 CLI 够用
  - 对大龙虾不够，因为你有多通道、异步执行、后台任务、插件

推荐动作: 改造

### 6. 高风险操作拦截机制

- shell: 有
- 文件写入: 有
- 网络访问: 间接有，但不细
- 外部集成: 基本没有细粒度分类
- 自动执行: 由 permission mode 决定

判断:

- 架构思路值得吸收。
- 风险分类太粗，不足以覆盖 OpenClaw 的 gateway/plugin/external integrations。

推荐动作: 改造

### 7. 沙箱 / 权限模型 / 执行边界

- 明显实现: 有一部分
- 证据: `sandbox.rs`, `bash.rs`
- 成熟度判断:
  - namespace/net 隔离: 有一定实现
  - filesystem isolation: 很弱

关键问题:

- `unshare --mount` 不等于真正文件系统隔离。
- 代码里没有真正的 mount policy enforcement、bind mount 策略、chroot/pivot root/landlock。
- `allow-list` 更多像状态表达和环境变量传递，不像真实约束。

对大龙虾判断:

- 不能直接吸收。

推荐动作: 观察

### 8. 后台任务 / 守护进程 / 常驻 agent

- 明显实现: 不足
- 证据:
  - `bash` background child process
  - bootstrap 骨架 phase
- 成熟度: 低
- 是否适合大龙虾: 不适合直接吸收

推荐动作: 放弃

### 9. 故障恢复 / checkpoint / retry / resumability

- 明显实现:
  - API retry/backoff
  - session persist/resume
- 不明显:
  - tool checkpoint
  - side-effect replay protection
  - workflow resumability

判断:

- 对大龙虾值得吸收的是:
  - API retry + request id
  - session persist discipline
- 但还远不够构成生产 checkpoint。

推荐动作: 改造

### 10. 可观测性

- logs: 有少量 stderr/debug/status
- traces: 证据不足
- 调试模式: 很弱
- 运行态诊断: status/cost/memory/config 有一些

判断:

- 做法不成熟
- 不适合大龙虾直接吸收

推荐动作: 放弃

### 11. CLI / TUI / UI 交互设计

- 明显实现:
  - slash command
  - line editor
  - multi-line
  - command completion
  - markdown render
- 成熟度: 中
- 对大龙虾适配:
  - 本地运维 TUI/CLI 值得参考
  - 非核心路线

推荐动作: 观察

### 12. 插件系统 / 扩展点设计

- 明显实现:
  - MCP config typing
  - stdio MCP manager
  - skill markdown loader
- 没有:
  - 真正插件 lifecycle
  - 权限隔离
  - 发布/版本管理

判断:

- OpenClaw 已经有更强 plugin-sdk/extension surface。
- 真正值得吸收的是“typed MCP tool bridge”。

推荐动作: 改造

---

## 第四部分：大龙虾落地建议清单

### P0：应该立刻做

#### 1. 建立可恢复的 Session Journal + Snapshot

- 建议名称: 可恢复 Session Journal
- 它解决的问题: OpenClaw 长生命周期 agent 在崩溃、重启、切换节点后难以精确恢复上下文与工具执行边界
- 参考模块/模式: `runtime/src/session.rs`, `rusty-claude-cli/src/main.rs::persist_session`
- 为什么适合大龙虾: 你已经有 `agents/main/sessions/sessions.json` 和 session working capture，补 journal 会直接增强稳定性
- 预期收益:
  - 降低会话损坏率
  - 支持断点恢复
  - 给 memory 捕获提供稳定输入
- 需要修改的子系统:
  - agent runtime
  - session store
  - memory capture ingestion
- 实施复杂度: 中
- 风险等级: 中
- 是否建议现在做: 是
- MVP:
  - 每轮 turn 追加 JSONL event
  - 每 N 轮生成 snapshot
  - 恢复时先读 snapshot，再 replay journal

#### 2. 把工具 contract 和风险等级独立成注册表

- 建议名称: Typed Tool Contract Registry
- 它解决的问题: 工具权限、审批、审计、路由现在容易散在实现里
- 参考模块/模式: `tools/src/lib.rs::ToolSpec`, `required_permission`
- 为什么适合大龙虾: 你已经有插件、gateway、skills、extensions，越早统一 contract 越省维护成本
- 预期收益:
  - 工具边界清晰
  - 审批链路标准化
  - 更容易做 trace 和审计
- 需要修改的子系统:
  - tool runtime
  - plugin bridge
  - approval flow
  - observability
- 实施复杂度: 中
- 风险等级: 低到中
- 是否建议现在做: 是
- MVP:
  - 为每个工具定义 schema / risk_class / side_effect_scope / approval_policy
  - 执行器只消费 contract，不直接写死权限逻辑

#### 3. 建立审批链路和高风险操作门禁

- 建议名称: Approval Ladder
- 它解决的问题: shell、文件写入、网络、外部集成、自动执行缺少统一门禁
- 参考模块/模式: `runtime/src/permissions.rs`, `CliPermissionPrompter`
- 为什么适合大龙虾: 大龙虾多通道、多插件、多后台任务，风险远高于本地 coding CLI
- 预期收益:
  - 安全边界清晰
  - 降低误执行风险
  - 审计更容易
- 需要修改的子系统:
  - command/tool runtime
  - plugin runtime
  - message ingress
  - operator UX
- 实施复杂度: 中
- 风险等级: 高
- 是否建议现在做: 是
- MVP:
  - 先做 5 类风险:
    - read
    - workspace_write
    - host_exec
    - external_network
    - external_side_effect
  - 每次审批写入审计事件

### P1：近期值得验证

#### 4. 在 coding/ops 子代理里引入 repo instruction inheritance

- 建议名称: Repo Instruction Loader
- 它解决的问题: 代码代理缺少 repo-local 规则注入和预算控制
- 参考模块/模式: `runtime/src/prompt.rs`
- 为什么适合大龙虾: 不会冲击你已有 memory 架构，但能显著提升 coding 子代理稳定性
- 预期收益:
  - 规则加载更稳定
  - 降低 system prompt 污染
  - 更好地贴近 repo 实际约束
- 需要修改的子系统:
  - coding agent
  - prompt builder
- 实施复杂度: 低
- 风险等级: 低
- 是否建议现在做: 是
- MVP:
  - 支持 `CLAUDE.md` / `.claude/instructions.md` 祖先链加载
  - 做去重和字符预算

#### 5. 引入 MCP 受管进程层

- 建议名称: Managed MCP Worker Layer
- 它解决的问题: 外部工具进程缺少统一发现、路由、生命周期管理
- 参考模块/模式: `runtime/src/mcp_stdio.rs::McpServerManager`
- 为什么适合大龙虾: 你已有 plugin 和 extension surface，MCP 进程管理是天然增强项
- 预期收益:
  - 工具发现和调用统一
  - 更容易做健康检查和权限绑定
- 需要修改的子系统:
  - plugin bridge
  - tools runtime
  - health/ops
- 实施复杂度: 中
- 风险等级: 中
- 是否建议现在做: 是
- MVP:
  - 先只支持 stdio MCP
  - 做 initialize/list_tools/call_tool/shutdown
  - 给每个 MCP tool 补 route metadata

#### 6. 做 deterministic compaction envelope，而不是照抄它的 summary 内容

- 建议名称: Continuation Envelope
- 它解决的问题: 大会话恢复时需要稳定 continuation 语义
- 参考模块/模式: `runtime/src/compact.rs`
- 为什么适合大龙虾: 你已有 recall/memory，缺的是更标准的 continuation envelope
- 预期收益:
  - 恢复过程更稳定
  - memory 与 session 边界更清楚
- 需要修改的子系统:
  - session runtime
  - memory summarizer
- 实施复杂度: 低到中
- 风险等级: 中
- 是否建议现在做: 是
- MVP:
  - 不重写 memory
  - 只定义 compacted continuation message schema

### P2：中长期方向

#### 7. 建立真正可用的 trace / observability 基线

- 建议名称: Agent Trace Envelope
- 它解决的问题: 运行态不可诊断
- 参考模块/模式: 泄露代码几乎没有成熟实现，只能反向说明这是缺口
- 为什么适合大龙虾: 你已经有多 agent 和 memory maintenance，没有 trace 会越来越难维护
- 预期收益:
  - 能诊断失败
  - 能重放会话
  - 能优化 memory 和 routing
- 需要修改的子系统:
  - agent runtime
  - tool runtime
  - memory pipeline
  - ops dashboard
- 实施复杂度: 高
- 风险等级: 中
- 是否建议现在做: 否，先做 P0
- 不建议现在做的原因: 需要先把 session / tool contract / approval 事件标准化
- MVP:
  - 每个 turn / tool / approval / memory write 发统一 trace event

#### 8. 建立真实的后台任务 supervisor

- 建议名称: Background Task Supervisor
- 它解决的问题: 后台 shell 或长任务不可恢复、不可观测
- 参考模块/模式: `runtime/src/bash.rs` 的 `background_task_id`
- 为什么适合大龙虾: 你已经有 maintenance runner 和常驻流程
- 预期收益:
  - 后台任务可靠性提升
  - 更容易恢复和追踪
- 需要修改的子系统:
  - runtime scheduler
  - ops
  - trace
- 实施复杂度: 高
- 风险等级: 高
- 是否建议现在做: 否
- 不建议现在做的原因: 先补 session/trace/approval 基线
- MVP:
  - 任务表 + heartbeat + stdout/stderr capture + cancel/restart

#### 9. 统一 provider adapter

- 建议名称: Provider Adapter Layer
- 它解决的问题: 模型供应商耦合和重试/鉴权逻辑散落
- 参考模块/模式: `runtime::ApiClient`, `api::AnthropicClient`
- 为什么适合大龙虾: 多模型、多路由本来就是你的核心
- 预期收益:
  - 降低 provider 耦合
  - retry/request id/OAuth 更一致
- 需要修改的子系统:
  - model router
  - gateway
  - agent runtime
- 实施复杂度: 中到高
- 风险等级: 中
- 是否建议现在做: 否
- 不建议现在做的原因: 如果当前 provider adapter 已存在，优先做 session/approval
- MVP:
  - 统一 `send`, `stream`, `request_id`, `retryable`, `auth_source`

### P3：先观察，不急着做

#### 10. CLI slash command UX 小优化

- 建议名称: Operator CLI Polish
- 它解决的问题: 本地运维体验
- 参考模块/模式: `rusty-claude-cli/src/input.rs`, slash commands
- 为什么适合大龙虾: 适合 operator 模式，不是主价值
- 预期收益: 使用体验更好
- 需要修改的子系统: CLI/TUI
- 实施复杂度: 低
- 风险等级: 低
- 是否建议现在做: 否
- 不建议现在做的原因: ROI 不如 P0/P1
- MVP:
  - `/status`, `/session`, `/memory` 三个命令先做好

#### 11. “Agent” 表面委派接口

- 建议名称: Handoff Surface
- 它解决的问题: 给模型暴露委派入口
- 参考模块/模式: `tools/src/lib.rs::execute_agent`
- 为什么适合大龙虾: 只有在你真实 supervisor 到位后才有意义
- 预期收益: 很有限
- 需要修改的子系统: agent runtime
- 实施复杂度: 低
- 风险等级: 中
- 是否建议现在做: 否
- 不建议现在做的原因: 现在做只会制造“看起来有多 agent”的假象
- MVP:
  - 只有在真实 worker queue 上线后再暴露

---

## 第五部分：Claude Code 里看起来很强，但大龙虾不该直接抄的东西

### 1. 强依赖 Claude 私有生态的设计

不该抄:

- `runtime/src/remote.rs` 的 `CLAUDE_CODE_REMOTE`, `CCR_*`, upstream proxy, session token, CA bundle
- `mcp.rs` 里对 `ccr-sessions` / `session_ingress` URL 的处理

为什么不值得:

- 这是 Anthropic 私有环境适配，不是通用 agent 架构资产。
- 直接带入会把大龙虾绑到错误的假设上。

替代建议:

- 只保留“远程运行配置集中化”的模式
- 远程链路重做成 OpenClaw 自己的 relay/session bootstrap

### 2. 对 Anthropic 内部产品环境成立、但对大龙虾不成立的前提

不该抄:

- cwd 下 `.claude/sessions` 即可解决 session 管理
- OAuth/token/credential 全都围绕 Anthropic API
- 工具默认围绕本地 coding REPL

为什么不值得:

- 大龙虾是多通道 AI gateway，不是单机 coding CLI。
- 你的 session 是长期、多来源、跨插件、多任务的。

替代建议:

- session 用 journal + snapshot + runtime metadata
- provider auth 独立于任何单家厂商

### 3. 复杂但收益不高的实现

不该抄:

- `compat-harness` 这类“从上游归档提取 surface”的兼容分析层

为什么不值得:

- 对大龙虾生产能力没有直接收益。
- 除非你在做内部架构审计器，否则只是额外维护负担。

替代建议:

- 如果要保留，只保留一个很轻的 surface inventory generator

### 4. 可能只是技术债或历史包袱的代码模式

不该抄:

- `bootstrap.rs` 那些 daemon/bridge/background/template/environment-runner phase skeleton

为什么不值得:

- 它们更像上游残影和兼容骨架，不是这份仓库真正落地的 runtime。
- 拿这些 phase 当 roadmap 很容易误判。

替代建议:

- 只把它当“可能存在过的入口分类”
- 不把它当实现依据

### 5. 会让大龙虾过早复杂化的设计

不该抄:

- 表面上暴露很多工具名、模式名、agent 名，但后端并无真实执行器
- 例如 `Agent`, `ToolSearch`, `StructuredOutput` 这类接口面先行

为什么不值得:

- 大龙虾已经复杂，继续增加“表面能力”会提高误判成本。

替代建议:

- 先做底层 contract 和 supervisor
- 再暴露给模型

### 6. 会引入严重权限/安全负担的做法

不该抄:

- 当前 sandbox 的文件系统隔离做法

为什么不值得:

- `unshare --mount` 并没有真正实现强文件系统隔离。
- `allowed_mounts` 更多像配置表述，不是真约束。
- 这会制造“看起来安全”的假象。

替代建议:

- 如果要做 host exec，按 OpenClaw 场景重做:
  - 明确的工作目录 allowlist
  - 网络策略
  - 外部 side-effect policy
  - 审批 + trace + audit

### 7. 看起来先进，但对当前阶段大龙虾没有 ROI 的能力

不该抄:

- 多 agent 表面接口
- 本地 TUI/REPL 细节
- DuckDuckGo HTML 抓取式 WebSearch/WebFetch

为什么不值得:

- 多 agent 表面接口没有真实执行器
- CLI 打磨不是当前瓶颈
- HTML 抓取在生产上很脆弱，也有维护风险

替代建议:

- 先做 session、approval、MCP、trace、provider adapter

---

## 第六部分：汇总总表

| 模块/机制 | 在 Claude Code 中的作用 | 对大龙虾的潜在价值 | 推荐动作 | 复杂度 | 风险 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| Session JSON + resume/list/switch | 本地 CLI session 生命周期 | 高 | 改造 | 中 | 中 | 值得吸收结构，不值得吸收存储形态 |
| Instruction file inheritance | repo-local guidance 注入 | 高 | 采用 | 低 | 低 | 非常适合 coding/ops 子代理 |
| Deterministic compaction | 本地上下文压缩 | 中 | 改造 | 低到中 | 中 | 只借 envelope，不借内容逻辑 |
| ToolSpec + required_permission | 工具 contract + 风险级别 | 高 | 采用 | 中 | 低到中 | 最值得吸收 |
| PermissionPolicy + prompt approval | 交互审批 | 高 | 改造 | 中 | 高 | 要扩到异步/审计/多通道 |
| bash tool + timeout/background | 系统命令执行 | 中 | 改造 | 中 | 高 | 输出 envelope 值得借，sandbox 不行 |
| sandbox/unshare | 执行边界尝试 | 低 | 放弃 | 中 | 高 | 文件系统隔离不可靠 |
| MCP stdio manager | 外部工具进程管理 | 高 | 改造 | 中 | 中 | 很适合做 plugin bridge 内核 |
| Provider adapter + retry/OAuth/SSE | 模型调用抽象 | 高 | 采用 | 中 | 低到中 | 值得统一为多 provider 层 |
| Agent tool file queue | 表面委派接口 | 低 | 放弃 | 低 | 中 | 没有真实执行器 |
| Bootstrap phase skeleton | 上游入口分类残影 | 低 | 放弃 | 低 | 低 | 只能当线索，不是实现 |
| CLI/REPL UX | 本地操作体验 | 中 | 观察 | 低 | 低 | 非当前主线 |
| Skill markdown loader | 读取本地 skill 指令 | 低到中 | 观察 | 低 | 低 | OpenClaw 已有更强扩展面 |
| Config layering | user/project/local 配置分层 | 高 | 采用 | 低 | 低 | 对多工作区和 coding agent 很实用 |
| Usage/status report | 基础诊断 | 中 | 改造 | 低 | 低 | 需要升格成 trace，不足以单独成体系 |

---

## 第七部分：压缩成 3 个列表

### A. 对大龙虾真正有帮助的 5 件事

1. Session 恢复路径要简单而稳定: list/switch/resume/persist discipline 值得吸收。
2. 工具 contract 要显式建模: schema、风险级、权限要求、执行器分离。
3. Repo instruction inheritance 很值钱: 对 coding/ops 子代理的稳定性提升直接。
4. MCP stdio manager 值得借: 适合收敛插件/工具进程管理。
5. Provider adapter 分层值得借: retry、request id、OAuth/SSE 不能散在业务逻辑里。

### B. 看起来很酷但不值得抄的 5 件事

1. `Agent` 工具表面委派: 只是写文件队列，不是真多 agent。
2. daemon/background/bridge fast path 骨架: 更像残影，不是成品。
3. 当前 sandbox 设计: 看起来安全，实际文件系统边界很弱。
4. 私有 Anthropic remote/CCR/upstream proxy 逻辑: 对大龙虾没有通用价值。
5. 它的 memory 方案: 只够本地 coding harness，不如你现在的大龙虾 memory 系统。

### C. 接下来两周最值得做的 3 个改造

1. 做 Session Journal + Snapshot + Replay。
2. 做 Typed Tool Contract Registry + Approval Ladder。
3. 做 MCP stdio 受管进程层，并把 tool route metadata 接到 trace/audit。

---

## 补充：结合 NAS 上 OpenClaw 现状的判断

你现在的大龙虾已经具备的、且明显强于泄露代码的部分:

- memory maintenance runner
- retrieval route manifest
- recall plane builder
- working memory/session capture
- governance / promotion / audience scope / confidentiality policy
- plugin-sdk / extensions / gateway / rpc / tui / ui surface

这意味着:

- 不要把精力花在“复刻 Claude Code 的 memory”
- 应该把精力花在“大龙虾底座补齐”
  - session durability
  - approval boundary
  - tool contracts
  - plugin/MCP worker management
  - trace and replay

一句话结论:

这份泄露实现对大龙虾真正有帮助的，不是让你更像 Claude Code，而是让你更像一个工程上收口得更干净、更可恢复、更可审计的 agent 系统。
