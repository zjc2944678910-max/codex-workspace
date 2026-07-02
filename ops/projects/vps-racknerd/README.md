# VPS Racknerd Box Ops Surface

This directory is the operator-facing surface for `vps-racknerd`.

## Routing Evidence

- Project name: `VPS Racknerd Box`
- Aliases: `vps-racknerd`, `racknerd`, `home-vps-root`, `那台VPS`, `服务器VPS`
- Registry routing keywords: `vps`, `racknerd`, `107.175.180.163`, `流量卡封`, `目的IP RST`, `vps-tunnel`, `vps-via-nas`, `换IP`, `ColoCrossing`, `nginx host`, `vps-racknerd`, `VPS Racknerd Box`, `home-vps-root`, `那台VPS`, `服务器VPS`
- Main code: `ops-only`
- Ops surface: `ops/projects/vps-racknerd`
- State/data: `state/project-data/vps-racknerd`
- Scratch: `scratch/projects/vps-racknerd`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `home-vps-root`, `107.175.180.163`, `vps-tunnel`, `vps-via-nas`
- Service names: `nginx`, `sshd`, `openclaw-gateway`
- Registry risk profile: `live_infra`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered live infrastructure surface for `vps-racknerd`. Treat this README as routing and durable context, not proof of current live health; collect fresh L2 evidence before judging runtime state.
- Risk gate: L2 read-only for live status, logs, SSH evidence, config inspection, and root-cause analysis. L3 state-changing repair requires the explicit phrase `进入修复阶段`.
- Common commands:
  - `node docs/workspace/find-project.mjs vps-racknerd`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; promote durable findings into this README, runbooks, reports, or ledgers after read-only audits; write an explicit L3 plan only after the repair gate opens.
- Model review guidance: Use Claude review or Sub2API only with bounded, redacted, read-only evidence. Do not send credentials, private configs, cookies, tokens, or unbounded logs. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are
local-only by default and are not part of the workspace-index repository
surface.

## 范围 / Scope

这是 **racknerd VPS 这台机本身** 的真源(2026-06-22 从 openclaw/proxy-nodes 抽出)。
机器层面的事实(IP、连通、SSH 接入、nginx host)归这里;跑在机上的 app(openclaw 网关、
proxy 节点、sub2api 中转)各自项目。

- **属于这里**:VPS IP / 换 IP、流量卡封连通事故、SSH/隧道接入、nginx host。
- **不属于这里**:节点配置(proxy-nodes)、CF/DNS(cloudflare-edge)、各 app 逻辑。

## 机器基本面

- 商家 racknerd(ColoCrossing 段),纯公网 IP。**当前 IP = `107.175.180.163`**(2026-06-21 前为 `107.175.140.175`)。
- nginx vhost `openclaw-gateway`(listen 8443/20002),为多 app 共用回源入口(node./api./sub.)。443 被 xray REALITY 占用。
- 主机账户:`home-vps-root`(root@racknerd);`home-vps` 是 nas-tunnel 隧道账户(nologin,**别用它跑命令**)。

## SSH / 管理接入(直连被封时走 NAS 中转)

- `~/.ssh/config`:`vps-via-nas`(`ProxyCommand ssh home-nas-wg nc %h %p`,登录)、`vps-tunnel`(同上 + `LocalForward 18080→8080`、`13000→3000`,中转站本地访问)。
- LaunchAgent `~/Library/LaunchAgents/com.zjc.vps-tunnel.plist`(KeepAlive 常驻隧道)。
- 关键:`home-nas-wg`(WireGuard utun11, UDP)不碰被封 IP;NAS sshd `AllowTcpForwarding no` → 用 `nc` 接力,**非** `-J`/`-W`。

## 流量卡封 VPS IP 排障(2026-06-16,从 openclaw 迁入)

- **现象**:某张移动流量卡(郑州移动,出口 `223.104.19.112`)连不上 VPS 的 SSH 和翻墙节点;别卡正常。普通上网正常,只连不上 `107.175.140.175`。
- **根因**:非 fail2ban(该 IP 不在 ban、当天还登录成功过),非 GFW 全网封(别卡能连)。是**该流量卡运营商按目的 IP 做 TCP RST**(VPS IP 被标记成代理 IP)。判据:`ping 0% 丢包` + `nc github:22 通` + 连本 VPS 全失败 + sshd `Connection reset [preauth]`。
- **处置**:管理改走 NAS 中转(见上 SSH 段);对外服务走 CF 前置(见 `cloudflare-edge`)。
- ⚠️ 教训:`node.` 子域 + `127.0.0.1:18789` 是 OpenClaw 网关公网入口,不是翻墙节点用,翻墙 WS 须独立端口/子域,别复用。

## VPS 换 IP:107.175.140.175 → 107.175.180.163(2026-06-21,从 proxy-nodes 迁入)

- 诊断(itdog 实测旧 IP `:443`):移动**能握手**(最快 193ms)但均 653ms、最差 2298ms、23/136 超时;电信 175ms。**非 GFW 精准封,是移动↔ColoCrossing 段路由劣化(丢包+高延迟)**——移动连 SSH 都握手失败。
- 用户 $3 换同段 IP 后**移动直连恢复**:REALITY-443=1204ms、hy2 9444=171ms / 8443=130ms(hy2 在移动最优)。
- 迁移(同 VM/磁盘,仅换公网 IP,VPS 侧配置不变):
  - 直连节点(REALITY/hy2):服务端 bind 0.0.0.0 不变,客户端「地址」改新 IP。
  - CF DNS(node./sub./api.):改新 IP,橙云保留(见 `cloudflare-edge`)。
  - nas-relay:`codex-nas-vps-fallback-relay.service`(NAS 上 python TCP 中转)`Environment=TARGET_HOST` 旧→新 + daemon-reload + restart。备份 `…service.bak-ipchg-*`。
- 验证(2026-06-21):新 VPS xray/wifi-fb/sing-box/nginx 全 active;CF node WS 443=101;sub2api 面板=200;经 relay→新 VPS:8443 TLS OK。
- 残留:若再换 IP,需再改 nas-relay `TARGET_HOST`;NAS↔VPS 反向隧道/WG endpoint 若硬编码旧 IP 需同步(本会话未全面排查 NAS 侧)。

## 关联

- 节点:`ops/projects/proxy-nodes/`。CF/DNS:`ops/projects/cloudflare-edge/`。网关/bot:`ops/projects/openclaw/`。中转:`ops/projects/sub2api/`。
