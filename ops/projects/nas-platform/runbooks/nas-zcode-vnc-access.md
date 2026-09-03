# NAS ZCode 远程桌面入口（VNC over SSH）

> 状态：已验证（2026-08-28 部署当日端到端打通，RFB 003.008 握手成功）。
> 用途：在 Mac 上直接查看并操作 NAS 虚拟屏 `:77` 上的 ZCode Desktop
> 图形界面，作为 agent 截图代点之外的人工直操作入口。

## 架构

- NAS：`zcode-x11vnc.service`（systemd user 单元，用户 `cc`）把
  `DISPLAY=:77`（Xvfb 1440x900，ZCode Desktop 所在屏）用 x11vnc 暴露在
  **仅 `127.0.0.1:5900`**（`-localhost -shared -forever -noxdamage
  -repeat`），认证 `-rfbauth /home/cc/.vnc/passwd`（8 位密码，只在 NAS
  上存放，勿写入文档）。
- sshd：`/etc/ssh/sshd_config` 末尾 `Match User cc` → `AllowTcpForwarding
  local`（全局与其他用户仍为 no）。改动前备份：
  `/etc/ssh/sshd_config.bak-20260828-203345-pre-vnc-localforward`。
- Mac：`~/.ssh/config` 别名 `oc-nas-vnc`（ProxyJump home-vps，
  `LocalForward 15900 127.0.0.1:5900`，ExitOnForwardFailure yes，
  ServerAlive 30s×3）。

## 使用（Mac）

1. 隧道由 LaunchAgent 自动保活（`~/Library/LaunchAgents/com.zcode.nas-vnc-tunnel.plist`，
   KeepAlive，开机自启，断线自动重连，重试间隔 15s）。一般无需手动操作；
   手动重启：`launchctl bootout gui/$(id -u)/com.zcode.nas-vnc-tunnel && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.zcode.nas-vnc-tunnel.plist`
2. Finder ⌘K 或「屏幕共享」App 连接：`vnc://localhost:15900`，密码见
   NAS `/home/cc/.vnc/passwd`（询问所有者，不在文档存放）。
3. 首次点击屏幕共享时隧道若刚重连，需等几秒再连（经 VPS 中转建链有延迟）。

## 运维

- 状态：`ssh oc-nas 'systemctl --user status zcode-x11vnc.service'`
- 日志：`ssh oc-nas 'journalctl --user -u zcode-x11vnc.service -n 50'`
- 监听自检：`ssh oc-nas 'ss -tlnp | grep 5900'` 应只有 127.0.0.1 / ::1。
- x11vnc 只绑回环，外网与局域网均不可达；唯一通路是 SSH 隧道。

## 回滚

1. Mac：`launchctl bootout gui/$(id -u)/com.zcode.nas-vnc-tunnel`；
   删除 `~/Library/LaunchAgents/com.zcode.nas-vnc-tunnel.plist` 和
   `~/.ssh/config` 中 `oc-nas-vnc` 块。
2. NAS 服务：
   `systemctl --user disable --now zcode-x11vnc.service && rm ~/.config/systemd/user/zcode-x11vnc.service && systemctl --user daemon-reload && rm -rf ~/.vnc`
3. sshd：删除末尾 `Match User cc` 块后 `sudo systemctl reload ssh`
   （或恢复上面的备份再 reload）。

## 已知限制

- 链路经 VPS 中转（ProxyJump home-vps），有少量延迟；`home-nas-wg`
  WireGuard 直连当前不通（见 `nas-wg-ssh-access.md`），修复后可改直连。
- 首次部署日曾出现「隧道静默断开导致连接失败」：`ssh -fN` 拉起的隧道
  无保活，已改用 LaunchAgent KeepAlive 方案修复（2026-08-28 当晚）。
- VNC 密码为 x11vnc 8 位上限；如需更换：
  `ssh oc-nas 'x11vnc -storepasswd NEWPASS ~/.vnc/passwd'`（无需重启服务）。
