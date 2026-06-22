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
entry, and the edge watchdog. Cross-cutting infra was split to sibling ops
projects (see 关联 at the end): proxy nodes → `proxy-nodes`; the VPS box / IP /
connectivity → `vps-racknerd`; Cloudflare / DNS / DDNS → `cloudflare-edge`.

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

## 主机/账号速查

- `home-nas`（cc@zjcNAS，sudo，ProxyJump home-vps）/ `oc-nas`（benben，公钥被拒）/ `home-nas-admin`（cc:33333）。
- `home-vps-root`（root@racknerd）；`home-vps` 是 nas-tunnel 隧道账户（nologin，别用它跑命令）。
- NAS docker 数据真实路径在 `/volume1/docker/data/<app>`（非 `stacks/`）；docker 需 `sudo`（cc 不在 docker 组）。

## 关联 / Cross-refs

跨切基础设施已拆到各层项目(openclaw 只留网关/bot/看门狗):

- **代理/翻墙节点**(CF-WS/Webshare/hy2/XHTTP/REALITY):`ops/projects/proxy-nodes/`。
- **VPS 这台机**(IP/换 IP/流量卡封连通/SSH 接入):`ops/projects/vps-racknerd/`。
- **CF/DNS**(node. 橙云、Origin Rule、边缘证书、NAS DDNS):`ops/projects/cloudflare-edge/`。

耦合点 = 共用 VPS、`node.` 子域、`openclaw-gateway` nginx vhost。
