# ZCode NAS GUI 自动化规程

> 状态：已验证（2026-08-28 两个 codex-run 实战 + 同日 ZCode 会话审计教训）。
> 风险门：GUI 点击属状态变更操作，须 L3（`进入修复阶段`）开启后才执行；
> 截图、读图、读日志保持 L2 只读。

## 环境事实

- 主机别名：`oc-nas`（SSH `BatchMode`，用户 `cc`）；WireGuard 直连走
  `home-nas-wg`（见 `nas-wg-ssh-access.md`）。
- ZCode Desktop 3.9.2 以 systemd user 服务 `zcode-desktop.service` 常驻，
  运行在虚拟显示 `DISPLAY=:77`。
- 工具链：`xdotool`（鼠标/键盘）、ImageMagick `import`（截图）。
- Bot Channel 现状（2026-08-28）：WeChat（长轮询）与飞书（WebSocket）均已
  绑定，且均限定 `zcode-nas-workspace` 工作区。

## 强制操作循环（每个点击动作都必须走完）

1. **截图**：`ssh -o BatchMode=yes oc-nas 'DISPLAY=:77 import -window root png:-' > /tmp/nas-gui-current.png`
2. **读图**：本地查看截图，确认目标元素存在、可见、未被遮挡，并从该截图
   本身计算坐标。**禁止**使用上一轮的缓存坐标或记忆坐标。
3. **点击**：`ssh -o BatchMode=yes oc-nas 'DISPLAY=:77 xdotool mousemove X Y click 1'`
   （X/Y 来自第 2 步刚读的图，不是历史值）。
4. **回读验证**：再次截图，确认界面状态发生了预期变化（弹窗出现/按钮态
   切换/页面跳转）。未变化则视为失败，回到第 1 步，不得连续盲试。

## 已知坑

- **OAuth deep-link 路由机制（2026-08-28 反编译 app.asar + 实战确认）**：主进程
  维护 `state → windowId` 路由表；渲染进程在用户点「Connect」发起 startOAuth
  时经 `registerOAuthState` IPC 写入表项，**TTL 300 秒**，到期自动删除。回调
  到达时按 state 查表：命中即路由（随后 token request + handleCallback）；
  未命中则缓存并打印误导性的「等待 renderer ready」日志（该缓存只在某个
  renderer 发出 RendererReady 时补投，欢迎页 Ctrl+R 并不触发）。因此：
  **登录回传必须在 startOAuth 后 5 分钟内送达，且 state 必须与当前等待会话
  一致**（旧 state 的回调永远无法命中，cancelPending 后旧 state 即作废）。
  当日失败三次（13:31、14:35 超 TTL；14:44 state 不匹配）皆由此解释。
- **NAS 端 ZCode 登录可用流程（2026-08-28 14:50-14:52 验证成功，先例 08:46）**：
  1) 点 Cancel → 点 Connect to BigModel（欢迎页坐标：Cancel (720,599)、
     Connect (720,559)，1440x900 无缩放）；2) 立即取
     `/home/cc/zcode-desktop/caught-urls.log` 末行登录链接（startOAuth 后
     毫秒级写入；写入方为早前会话遗留机制，进程归属未查明，勿贸然清理）；
     3) 用户浏览器完成 BigModel 登录并回传跳转 URL；4) 取 query 中
     authCode+state 拼 `zcode://oauth/callback?...`，经
     `DISPLAY=:77 timeout 40s <AppImage> --appimage-extract-and-run
     --no-sandbox "<回调>"` 单实例转交；5) 回读 app.log 应见
     「OAuth 回调路由成功」+ `oauth.handleCallback OK`，再截图确认主界面。
- **xdotool 在该虚拟屏的坑**：无窗口管理器支持 `_NET_ACTIVE_WINDOW`，
  `windowactivate` 必失败；用 `windowfocus --sync <id>` + `getwindowfocus`
  验证后发键。Ctrl+R 对欢迎页无效果，勿重复尝试。
- **盲点坐标事故（2026-08-28）**：ZCode 会话曾在虚拟屏上凭推测坐标点击，
  点错按钮导致人工截图纠错、返工约 30 分钟。此为本规程的直接起因。
- 虚拟屏分辨率/窗口布局可能变化，任何间隔较久的两次点击之间必须重新截图。

## 参考

- 人工直操作入口（VNC over SSH，无需 agent 代点）：见同目录
  `nas-zcode-vnc-access.md`。
- 事实来源：`scratch/projects/nas-platform/codex-runs/20260828-1018-enable-zcode-mobile-remote-control-and-bind-wechat-and-feishu-bot-channels-on-oc-nas/05-decisions.md`
- 跨工具 skill：`~/.agents/skills/nas-gui-automation/SKILL.md`（ZCode/codex
  共用触发入口，本文件为权威细节）。
