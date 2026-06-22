# Proxy Nodes VPS Ops Surface

This directory is the operator-facing surface for `proxy-nodes`.

## Routing Evidence

- Project name: `Proxy Nodes VPS`
- Aliases: `proxy-nodes`, `代理节点`, `自建节点`, `Shadowrocket订阅`
- Registry routing keywords: `proxy-nodes`, `节点订阅`, `Shadowrocket`, `VLESS`, `Hysteria2`, `node.nodezjc12348888.xyz`, `nodezjc12348888.xyz`, `107.175.180.163`, `Proxy Nodes VPS`, `代理节点`, `自建节点`, `Shadowrocket订阅`
- Main code: `ops-only`
- Ops surface: `ops/projects/proxy-nodes`
- State/data: `state/project-data/proxy-nodes`
- Scratch: `scratch/projects/proxy-nodes`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `107.175.180.163`, `node.nodezjc12348888.xyz`, `nodezjc12348888.xyz`
- Service names: `xray`, `sing-box`, `nginx`, `x-ui`, `xray-wifi-fallback`
- Registry risk profile: `live_infra`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

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

## Current Server Access

Primary SSH entrypoint:

```bash
ssh root@107.175.180.163
```

Do not store SSH passwords, private keys, complete proxy passwords, UUIDs, or
full secret subscription URLs in tracked ops docs. Keep those in the local
credential store or ignored operator state.

## Risk Gate

This project is live infrastructure.

- L2 read-only audit: SSH status checks, listener checks, logs, config reads,
  subscription decoding, and root-cause analysis.
- L3 repair execution: production config writes, subscription file writes,
  runtime parameter changes, firewall changes, service restarts, node deletion,
  or credential rotation.

L3 repair requires the user to explicitly say `进入修复阶段` before changing
live state.

## Subscription Security

Treat every proxy subscription URL as a credential, not as a normal shareable
link.

The current custom Shadowrocket/Hiddify subscription is published under this
shape:

```text
https://node.nodezjc12348888.xyz:8443/hiddify/<secret-subscription-token>.txt
```

The exact token path is intentionally not committed here. The subscription
payload may be base64-encoded, but that is encoding rather than encryption.
Anyone who obtains the URL can fetch/import the subscription and use the nodes
inside it.

Leak impact:

- Exposes the proxy node connection material contained in that subscription:
  hostnames, ports, protocol parameters, paths, UUIDs/passwords, SNI/Host, and
  similar client credentials.
- Allows unauthorized traffic through any still-valid nodes in the subscription.
- Does not by itself expose the server SSH password or private keys.
- Also exposes any third-party or relay nodes copied into the same subscription.

Default leak response:

1. Create a new random subscription path and publish the new subscription there.
2. Update trusted client devices to the new subscription URL.
3. Make the old subscription URL return 404 or otherwise stop serving it.
4. If exposure may be untrusted or public, rotate self-hosted node UUIDs,
   passwords, paths, and short IDs as applicable.
5. For third-party or external relay nodes, rotate or reissue credentials from
   the upstream provider if possible.

Operational preference: when only the subscription URL needs to change, rotate
the URL first to stop easy reuse. When node credentials may have been copied,
rotate node credentials too; changing only the URL is not enough because the old
node credentials may already be imported elsewhere.

## 节点上线记录 / Node Rollout Log

Relocated from openclaw ops (2026-06-22): these are proxy / 翻墙 nodes, not
the OpenClaw gateway/bot. They run on the same VPS and reuse openclaw's
`node.` subdomain + the `openclaw-gateway` nginx vhost, which is why they
were originally filed under openclaw. Canonical home is here.

## CF-WS 兜底节点上线 (2026-06-19)

移动按目的 IP 封 `107.175.140.175` → REALITY 直连节点(443/24443)在移动/部分 WiFi 不可用。
已把 WS 兜底节点接到 Cloudflare 橙云,给一个不依赖被封 IP / 不依赖漂移家宽的稳定入口。

拓扑(VLESS+WS+TLS over CF):
```
客户端 → CF橙云 node.nodezjc12348888.xyz:8443
  → CF边缘(8443)回源源站8443
  → nginx vhost openclaw-gateway(server_name node., listen 8443/20002, node.证书)
  → proxy_pass 127.0.0.1:23083
  → xray-wifi-fallback.service(VLESS+WS, path /assets-…)
```
关键事实:
- 节点是独立 `xray.service`(`/usr/local/etc/xray/config.json`,REALITY 443/24443),**非 x-ui 托管**;WS 节点是独立 `xray-wifi-fallback.service`。
- REALITY 与 CF 橙云互斥(CF 终止 TLS),所以套 CF 只能走 WS/TCP 系,不能用现有 REALITY 节点,也不能 Hysteria2(UDP,CF 免费不代理)。
- 本次改动:nginx `openclaw-gateway` 修死端口 `18789→23083` + node. 块加 `listen 8443`;CF DNS `node.` 翻橙云(proxied=true)。备份 `openclaw-gateway.bak-cfnode-20260619T215700`。
- CF 凭据:acme conf `CF_Token`(DNS:Edit,可翻橙云,**改不了 Origin Rule**,API 验证 `Authentication error`)。
- Origin Rule(2026-06-19 经 CF 面板手动加,浏览器自动化):`node-port-8443` 匹配 `http.host eq "node.nodezjc12348888.xyz"` → 改回源端口 8443,独立于 api./sub. 的 `api-port-8443` 规则。**客户端用 443**(经 CF 验证 101);8443 亦可。移动几乎不封 443,故首选 443。
- 客户端 ALPN 必须含 `http/1.1`:WS 走 HTTP/1.1 Upgrade,h2 会被 CF 边缘 400。
- 验证(2026-06-19):源站 8443 WS=101;CF 边缘 `--http1.1` WS=101(Server: cloudflare);边缘证书已覆盖 node.(无 403 edge-restricted)。
- **移动实测(2026-06-22,更新 06-19 的「移动实链路未测」)**:用户客户端实跑,报告此节点移动数据 + 全流量可用。客户端配置:`类型 VLESS` / `地址 node.nodezjc12348888.xyz` / `端口 8443` / `传输 websocket` / `TLS 开` / `流控 none` / `UDP 转发 开` / `多路复用 关` / `备注 VLESS-WS-Mobile-8443`(UUID 为凭据,不入档)。延迟/吞吐量化数据待补。
- 回滚:CF 把 node. 点回灰云(proxied=false);nginx 恢复 `.bak-cfnode-*` + reload。REALITY 节点全程未动。

### Webshare 住宅出口节点 (2026-06-19)

在同一 `node.` 子域 + 443 链路上，用**第二个 WS path** 再加一个节点，出口走 Webshare Static Residential 代理（美国住宅 IP）。

- 同服务 `xray-wifi-fallback.service`（`/etc/xray-wifi-fallback.json`）内新增：
  - inbound `webshare-vless-ws` `127.0.0.1:23085`，path `/assets-3a7f1c9e2d5b8406`（直连节点是 `/assets-baab…`→23083）。
  - 两个 http outbound `webshare1`/`webshare2`（Webshare 两个住宅 IP，账密认证；**凭据不入库**，在 Webshare 面板 Static Residential → Proxy List）。xray `http` 出站每个只能一个 server，多 IP 须拆多 outbound + balancer。
  - routing：`balancers:[{tag:webshare-bal,selector:["webshare"]}]`，rule `inboundTag=[webshare-vless-ws] → balancerTag=webshare-bal`；其余 inbound 默认走 `direct`(freedom)。
- nginx `openclaw-gateway`：node./apex 块各加 `location /assets-3a7f1c9e2d5b8406 → 127.0.0.1:23085`。备份 `openclaw-gateway.bak-webshare-*`。
- CF 无新增（复用 node. 橙云 + `node-port-8443` Origin Rule）。客户端 = node. 443 配置，仅 **path 改 `/assets-3a7f1c9e2d5b8406`**。
- 验证(2026-06-19)：Webshare 两出口 `curl -x` 通(9.142.211.156 / 45.56.183.242)；源站+CF 443 新路径 WS=101。**全链路出口 IP 待真实客户端确认**(应显示美国住宅 IP)。
- **带宽 250GB/月**：仅供需住宅 IP 的特定用途，勿当通用 VPN 跑视频。
- 回滚:`xray-wifi-fallback.json` 恢复 `.bak-webshare-*` + 重启服务;nginx 恢复 `openclaw-gateway.bak-webshare-*` + reload。直连节点/REALITY 不受影响。
- 注:xray 26.x 提示 WS 传输弃用、迁 XHTTP，仅警告，暂不影响。

### sing-box Hysteria2 节点 + 9444 Webshare 故障转移 (2026-06-19)

本机另有独立 **`sing-box.service`**（`/etc/sing-box/config.json`，sing-box 1.13.2），与 xray 并行：
- hy2 `:8443/udp`（`hy2-in`）直连出口；hy2 `:9444/udp`（`hy2-webshare-test-in`）出口走 Webshare。
- 客户端 6 个节点 = 本 VPS xray（REALITY 443、CF-node 23083、CF-Webshare 23085）+ sing-box hy2（8443、9444）+ 家 NAS 中转（18443，入口在 NAS 非 VPS）。
- 节点数不影响速度：每连接只走一个，空闲入站零开销；带宽只由实际并发共享。
- 9444 升级（2026-06-19）：原单 socks 出站 `webshare-socks-out`(#2 45.56.183.242) → 加 `webshare-socks-1`(#1 9.142.211.156) + `urltest` 组 `webshare-auto`(url generate_204, interval 10m)，9444 路由改指 `webshare-auto`。**urltest=自动选快/故障转移，非严格 50/50 分摊**（sing-box 无 xray 式 balancer）。两 Webshare IP 共用同一 250GB/月池。
- 备份 `config.json.bak-balancer-*`；回滚=恢复该备份 + 重启 sing-box。check 通过、服务 active、9444/8443 监听正常。

### CF 节点 XHTTP 变体 (2026-06-20)

起因：CF-node-WS / CF-Webshare-US 偶发短超时。排查确认服务器侧健康（服务 NRestarts=0、nginx 无 upstream 错、CF→源站 101 秒回、load 低）→ 根因是 **CF 免费 anycast 到中国线路抖动**（client→CF 那段，非服务器）。
缓解两手：① 客户端开 Shadowrocket「Cloudflare 优选 IP」（客户端侧，只改节点地址为优选 IP，SNI/Host 仍 node.）；② 服务器侧加 **XHTTP 变体**（XHTTP 比 WS 在丢包/抖动下更稳，多连接可续传）。

- `xray-wifi-fallback.service` 再加两入站（不动 WS，两套并存对比）：
  - `xhttp-direct-in` `127.0.0.1:23087` path `/xhttp-d-8f2a1c5e` → 出口 direct(VPS)。
  - `xhttp-webshare-in` `127.0.0.1:23089` path `/xhttp-w-3b9e44a1` → 加入 webshare-bal 路由（出口 Webshare 住宅）。
  - streamSettings：`network:"xhttp"`, `security:"none"`, `xhttpSettings:{host:node., path, mode:"auto"}`。
- nginx `openclaw-gateway` node./apex 块各加两 `location /xhttp-*`，关键 `proxy_buffering off` + `proxy_request_buffering off`（XHTTP 流式必需）。备份 `openclaw-gateway.bak-xhttp-*`、xray 配置备份 `xray-wifi-fallback.json.bak-xhttp-*`。
- CF 复用 node. 橙云 + Origin Rule（XHTTP 就是普通 HTTP，CF 透明代理；且 XHTTP 走 h2 不受 WS-over-h2 的 400 影响）。
- 验证（2026-06-20）：xray test OK；服务 active；23087/23089 监听；直连带正确 Host=node. 返 400（= xhttp 入站已接到+host 校验，合成 curl 造不出真会话故 400；错 host 返 404），经 nginx 同为 400 → **路由正确**。**真实出口/连通待 Shadowrocket XHTTP 客户端确认**。
- 客户端：VLESS / node.:443 / type=xhttp / mode=auto / host=sni=node. / path 二选一。Shadowrocket 新版支持 xhttp。
- 回滚：两份 `.bak-xhttp-*` 恢复 + 重启 xray-wifi-fallback / reload nginx。WS 与其它节点不受影响。


## 关联 / Cross-refs

- VPS 这台机(IP/换 IP/连通/SSH 接入):`ops/projects/vps-racknerd/README.md`。
- CF/DNS(node. 橙云、Origin Rule、边缘证书、NAS DDNS):`ops/projects/cloudflare-edge/README.md`。
- 网关/bot:`ops/projects/openclaw/README.md`。
