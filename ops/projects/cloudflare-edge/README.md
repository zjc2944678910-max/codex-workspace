# Cloudflare Edge / DNS Ops Surface

This directory is the operator-facing surface for `cloudflare-edge`.

## Routing Evidence

- Project name: `Cloudflare Edge / DNS`
- Aliases: `cloudflare-edge`, `cloudflare`, `cf-edge`, `CF`, `橙云`
- Registry routing keywords: `cloudflare`, `CF`, `nodezjc12348888.xyz`, `Origin Rule`, `橙云`, `edge cert`, `Universal SSL`, `DDNS`, `CF_Token`, `acme`, `proxied`, `cloudflare-edge`, `Cloudflare Edge / DNS`, `cf-edge`
- Main code: `ops-only`
- Ops surface: `ops/projects/cloudflare-edge`
- State/data: `state/project-data/cloudflare-edge`
- Scratch: `scratch/projects/cloudflare-edge`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `nodezjc12348888.xyz`, `api.nodezjc12348888.xyz`, `sub.nodezjc12348888.xyz`, `node.nodezjc12348888.xyz`, `nas.nodezjc12348888.xyz`
- Service names: `cloudflare`, `acme.sh`
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

## 范围 / Scope

这是 **Cloudflare + `nodezjc12348888.xyz` 域** 这一层的真源(2026-06-22 从
openclaw/proxy-nodes/sub2api 抽出整合)。各 app 只保留自己用到 CF 的那一句 + 指回这里。

- **属于这里**:CF 账号、橙云/灰云、Origin Rules、边缘证书、CF token 状态、DNS 记录、DDNS。
- **不属于这里**:节点/网关/中转的应用逻辑(各自 app 项目)。

## 域名 / 子域映射

域 `nodezjc12348888.xyz`,NS 已托管 Cloudflare。

| 子域 | 云状态 | 回源 | 用途(app) |
| --- | --- | --- | --- |
| `api.` | 橙云(proxied) | nginx 8443 → `new-api:3000` | sub2api(new-api) |
| `sub.` | 橙云 | nginx 8443 → `sub2api:8080` | sub2api |
| `node.` | 橙云 | nginx 8443 → proxy 节点(23083 等) | proxy-nodes / openclaw 网关入口 |
| `nas.` | **灰云(DNS-only)** | 直连家宽 `:18443` | proxy-nodes(nas-relay) |
| `ai.` | (按需) | `:29133`(authentik SSO) | — |

## Origin Rules

CF 边缘默认回源 443,但 VPS 443 被 xray REALITY 占用,nginx 在 8443/20002。故需 Origin Rule 改回源端口:

- `api-port-8443`:匹配 `api.`/`sub.` → 回源端口 8443。
- `node-port-8443`:匹配 `http.host eq "node.nodezjc12348888.xyz"` → 回源端口 8443(独立规则)。
- **客户端用 443**(经 CF 验证 101);8443 亦可。移动几乎不封 443,首选 443。

## 边缘证书

- Universal SSL `*.nodezjc12348888.xyz`(acme.sh ECC,Full 模式)。
- **关键坑**:新主机名(sub./node.)只翻橙云、证书没覆盖 → 持续 `403 Edge IP Restricted`。须确认边缘证书覆盖该主机名。

## CF 凭据状态(排障用)

- acme domain conf `~/.acme.sh/nodezjc12348888.xyz_ecc/*.conf` 的 scoped `CF_Token`:**仅 DNS:Edit**,可翻橙云,**改不了 Rulesets/Origin Rule**(API `Authentication error`)。
- account.conf 的 `SAVED_CF_Key`/`SAVED_CF_Email`(Global Key):**已失效**(API `9103`)。
- DDNS 专用 token(见下):面板新建 **Edit zone DNS**,仅本域,与 acme 的分开、可独立吊销。存 NAS `~/.cf-ddns.env`(chmod 600,**不入库**)。
- → 脚本化改 Origin Rule / Edge Cert 需要带 **Config Rules/Rulesets:Edit** 权的新 token。

## WS/h2 坑

- WS 走 HTTP/1.1 Upgrade:客户端 ALPN 必须含 `http/1.1`,否则 h2 被 CF 边缘 400。
- XHTTP 走 h2,不受此限。
- CF **免费 anycast 到中国线路抖动**(client→CF 段)是 CF-node 偶发超时根因,非服务器侧。缓解:客户端开「Cloudflare 优选 IP」。

## NAS 家宽 DDNS (2026-06-20)

(从 proxy-nodes 迁入:本质是 CF DNS 记录 + CF token,归 CF 层。)

- 目的:`nas.` 给家宽固定域名,家宽 IP 漂移自动跟(nas-relay 入口在家宽)。**灰云/DNS-only**,不走 CF 代理。
- 专用 token:面板 **Edit zone DNS**(仅本域),存 NAS `~/.cf-ddns.env`(chmod 600,不入库)。
- 脚本 `/home/cc/cf-ddns.sh`:取公网 IP(ipify/ifconfig)→ python3 调 CF API → upsert `nas.` A 记录(proxied=false, ttl 120),日志 `~/cf-ddns.log`。
- 调度:用户级 crontab 受限 → `/etc/cron.d/cf-ddns`(带用户字段 `cc`,`*/3`)。
- 验证(2026-06-20):token verify active;首跑 CREATED `nas.→61.163.130.135`;外部 `nc nas.:18443` succeeded。
- 回滚:`sudo rm /etc/cron.d/cf-ddns`;删 `~/cf-ddns.sh ~/.cf-ddns.env ~/cf-ddns.log`;CF 删 `nas.` 记录;吊销该 token。
- 注:DDNS 只解决 IP 漂移,治不了家宽链路本身抖/断。

## 关联

- 节点如何用 node. 橙云:`ops/projects/proxy-nodes/README.md`「节点上线记录」。
- sub2api 如何用 api./sub. 前置:`ops/projects/sub2api/README.md` + 其 DEPLOYMENT_LEDGER 06-17。
- VPS 这台机本身(IP/连通):`ops/projects/vps-racknerd/README.md`。
