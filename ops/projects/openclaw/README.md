# OpenClaw Ops Surface

This directory is the operator-facing surface for OpenClaw.

## Routing Evidence

- Project name: `OpenClaw`
- Aliases: `open claw`, `openclaw-mac-migration`, `笨笨`, `benben`, `adminAI`, `openclaw`
- Registry routing keywords: `openclaw`, `open claw`, `benben`, `adminai`, `openclaw-mac-migration`, `笨笨`, `adminAI`, `oc_alert`, `ocedge`, `edge 告警`, `网关`, `edge`
- Main code: `projects/products/openclaw/nas-openclaw-v22`
- Migration reference: `projects/migrations/openclaw-mac-migration`
- State/data: `state/project-data/openclaw`
- Ops surface: `ops/projects/openclaw`
- Reports: `ops/projects/openclaw/reports`
- Runbooks: `ops/projects/openclaw/runbooks`
- Live host aliases: `oc-nas`, `home-nas`, `home-vps-root`
- Service names: `openclaw-gateway`, `openclaw-benben`, `openclaw-benben.service`, `oc_alert.sh`, `openclaw-socks-bridge.service`
- Registry risk profile: `live_infra`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Stable Docs

- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md`
- `manifests/workspace-acceptance.md`
- `reports/claude-code-assessment-20260401.md`
- `reports/knowledge-layer-inventory-20260322.md`
- `reports/legacy-runtime-inventory-20260322.md`
- `reports/security-best-practices-report-20260314.md`
- `runbooks/sre-troubleshooting-runbook.md`
- `runbooks/upgrade-impact-assessment.md`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of systemd units, tools, and runtime-live artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy operator artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, and `quarantine/` are local-only by default and are not part of the workspace-index repository surface.

## 运维记录 / Operational Notes (promoted from claude-workspace, 2026-06-22)

Promoted from claude-workspace (canonical owner per Plan A; do not duplicate
back into claude). Scope = the OpenClaw gateway/bot itself: summary, gateway
entry, the edge watchdog root cause, and the traffic-card connectivity incident
below. The proxy / 翻墙 node rollouts (CF-WS / Webshare / hy2 / XHTTP / NAS DDNS /
VPS IP change) were relocated to `ops/projects/proxy-nodes/` — see
「关联:代理节点」at the end.

## Summary

OpenClaw 是跨 NAS（家用 zjcNAS）+ VPS（racknerd 107.175.180.163）的自建网关/机器人基础设施。
NAS 跑 OpenClaw 网关（`openclaw-benben.service`，端口 18792，对应 Telegram 笨笨 bot；
还有 adminAI 实例）。VPS 是公网边缘（nginx 反代 + 反向 SSH 隧道把 NAS 网关暴露到公网）。

## 架构与入口（边缘看门狗的关键）

- **本地入口** = VPS 上 `http://127.0.0.1:18789/`：经反向隧道转发到 NAS 网关；NAS 网关关 → `connection refused`。
- **公网入口** = `https://nodezjc12348888.xyz:20002`（+ `node.` 子域）：VPS nginx 上游挂 → `502`。
- Telegram 出站走代理：NAS `openclaw-socks-bridge`（本机 inactive）/ VPS `sing-box` + `xray`。

## 边缘告警看门狗（重要根因记录，2026-06-16）

- 脚本：**VPS** `/usr/local/bin/oc_alert.sh`，由 **`/etc/cron.d/oc_alert`（`* * * * *` 每分钟）** 触发。
- 逻辑：每分钟探本地入口 + 公网入口（+ sing-box UDP）；挂了每 `REMINDER_SEC=1800`(30min) 重发一次
  到 Telegram chat `8421829242`(笨笨)；sing-box 挂会自动 `systemctl start`（自愈）。
- **现象**：用户故意关 NAS 网关后，看门狗误判为故障，每 30 分钟刷屏「⚠️ OpenClaw edge 告警:
  本地入口异常（连接失败）；公网入口异常（上游返回 502）」。源头在 VPS，**不在 NAS**（NAS 侧
  所有 openclaw systemd timer 均 disabled/inactive，cron 空，n8n/uptime-kuma 无关）。
- **处置**：给 `oc_alert.sh` 加 edge 维护开关 `EDGE_MAINT_FILE`（默认 `/etc/openclaw/.disable-edge-alert`）；
  存在该 flag 时只静默 edge 告警，**保留 sing-box 自愈**。计划停机前 `touch` 该 flag 即可。
  - 当前状态：flag 已建，edge 告警静默中；cron 正常每分钟跑（dry-run 见 `edge_maint_suppressed=1`）。
  - 恢复告警：`rm /etc/openclaw/.disable-edge-alert`（或重新拉起 NAS 网关后 edge 恢复正常即自动停）。
  - 备份：`/usr/local/bin/oc_alert.sh.bak-edgemaint-*`、`/etc/cron.d/oc_alert.bak-*`。

## 流量卡封 VPS IP 排障 + CF 前置（2026-06-16）

- **现象**：某张移动流量卡（郑州移动，出口 `223.104.19.112`）连不上 VPS 的 SSH 和翻墙节点；
  其他卡正常。普通上网正常，只是连不上 `107.175.140.175`。
- **根因**：不是 fail2ban 封（该 IP 不在 ban 列表、当天还登录成功过），不是 GFW 全网封
  （别卡能连）。是**这张流量卡的运营商按目的 IP 做 TCP RST**：VPS IP 被标记成代理 IP →
  对它的裸 TCP 连接被中途 RST。判据：`ping 0% 丢包` + `nc github:22 通` + 连本 VPS 全失败
  + sshd 日志大量 `Connection reset [preauth]`。
- **管理通道（已落地，本机 macOS）**：直连被封，改走 NAS 中转。
  - `~/.ssh/config`：`vps-via-nas`（`ProxyCommand ssh home-nas-wg nc %h %p`，登录）、
    `vps-tunnel`（同上 + `LocalForward 18080→8080`、`13000→3000`，中转站）。
  - LaunchAgent `~/Library/LaunchAgents/com.zjc.vps-tunnel.plist`（KeepAlive 常驻隧道）。
  - 关键：`home-nas-wg`(WireGuard utun11, UDP) 不碰被封 IP；NAS sshd `AllowTcpForwarding no`，
    所以用 `nc` 接力而非 `-J`/`-W`。
- **中转站走 CF（Phase 1，已落地，治本）**：域名 `nodezjc12348888.xyz` NS 已搬 Cloudflare。
  - `api.` 子域（橙云）+ **CF Origin Rule 回源端口→8443**（因 VPS 443 是 xray Reality，
    nginx 在 8443/20002）。`api.→new-api:3000`，`sub.→sub2api:8080`。
  - 客户端连 `https://api.nodezjc12348888.xyz/v1`，不再依赖隧道。SSL 模式 Full（泛域名证书
    `*.nodezjc12348888.xyz`，acme.sh ECC）。
- **翻墙节点走 CF（Phase 2，已放弃并回滚）**：Reality/Hysteria2 无法过 CF；需改 VLESS+WS+TLS。
  曾加 xray `cf-ws-in` inbound + `cdn.` vhost，**已全部回滚**（用户放弃）。
  - ⚠️ 教训：`node.` 子域 + `127.0.0.1:18789` 是 **OpenClaw NAS 网关公网入口**，不是翻墙节点用，
    勿复用。翻墙 WS 若重做要用独立端口（如 18790）+ 独立子域（如 `cdn.`），别碰 node./18789。

## 主机/账号速查

- `home-nas`（cc@zjcNAS，sudo，ProxyJump home-vps）/ `oc-nas`（benben，公钥被拒）/ `home-nas-admin`（cc:33333）。
- `home-vps-root`（root@racknerd）；`home-vps` 是 nas-tunnel 隧道账户（nologin，别用它跑命令）。
- NAS docker 数据真实路径在 `/volume1/docker/data/<app>`（非 `stacks/`）；docker 需 `sudo`（cc 不在 docker 组）。

## 关联:代理节点 (proxy-nodes)

以下代理/翻墙基础设施已迁出 openclaw,见 `ops/projects/proxy-nodes/README.md`
的「节点上线记录」:CF-WS 兜底节点、Webshare 住宅出口、sing-box Hysteria2 9444、
CF XHTTP 变体、NAS 家宽 DDNS、VPS 换 IP(107.175.140.175→107.175.180.163)。
它们与 openclaw 的耦合点 = 共用 VPS、`node.` 子域、`openclaw-gateway` nginx vhost。
