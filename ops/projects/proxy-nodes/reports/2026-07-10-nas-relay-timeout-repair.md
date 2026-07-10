# NAS Relay Timeout Repair - 2026-07-10

## Scope

- Client endpoint: `nas-relay.nodezjc12348888.xyz:18443`
- Protocol path: VLESS over WebSocket and TLS
- Route Lock: `proxy-nodes`, with `nas-platform` and `cloudflare-edge` as dependencies
- Risk: L2 read-only audit followed by explicitly authorized L3 repair

## Confirmed Root Causes

1. The Xiaomi router had no TCP port-forward rule for `18443` to the NAS.
2. `nas-relay` had only an AAAA record, so IPv4-only clients had no usable address.
3. The `node.nodezjc12348888.xyz` nginx server lacked the direct VLESS WebSocket location for the `23083` inbound. Requests fell through to the OpenClaw gateway on `18789`, which returned JSON and caused Xray to report `unexpected response version 123` (`{`).
4. After the functional fixes, the direct NAS-to-VPS route remained unstable: repeated probes observed 55-66.7% packet loss and about 278 ms RTT to `107.175.180.163`. The LAN gateway, `1.1.1.1`, and Cloudflare edge each had 0% loss in the same window.

## Applied Changes

- Added router NAT rule: TCP `18443` -> `192.168.31.6:18443`.
- Added a DNS-only A record for `nas-relay` while retaining its existing AAAA record.
- Updated `/home/cc/cf-ddns.sh` to idempotently maintain A records for both `nas` and `nas-relay`.
- Added the missing direct WebSocket location in the `node.` nginx server, routing it to `127.0.0.1:23083`.
- Changed the NAS relay upstream from direct VPS `107.175.180.163:8443` to Cloudflare `node.nodezjc12348888.xyz:443`.

## Verification

- Direct Xray `23083` full VLESS request: HTTP `204`.
- nginx `8443` full VLESS request after route fix: HTTP `204`.
- External full path through `nas-relay:18443`: HTTP `204`.
- Pre-upstream-change automatic samples: 7/12 succeeded; failed samples hit the 15-second timeout.
- Post-upstream-change automatic samples: 12/12 succeeded; time to first byte was 0.78-0.93 seconds.
- NAS-to-Cloudflare WebSocket canary: 10/10 returned `101`, with 0.56-0.63 second time to first byte.
- `nginx`, `xray-wifi-fallback`, and `codex-nas-vps-fallback-relay` remained active with `NRestarts=0`.

## Rollback

- nginx: `/etc/nginx/sites-available/openclaw-gateway.bak-nas-relay-direct-ws-20260710T1724CST`
- NAS relay unit: `/etc/systemd/system/codex-nas-vps-fallback-relay.service.bak-cf-upstream-20260710T1742CST`
- DDNS script: `/home/cc/cf-ddns.sh.bak-nas-relay-dualstack-20260710T1648CST`
- Router: remove the `nas-relay-18443` TCP forwarding rule.
- DNS: remove only the added `nas-relay` A record; retain the pre-existing AAAA record.

## Residual Risk

The relay now depends on Cloudflare for its NAS-to-VPS segment. This removes the observed lossy direct route but reduces path independence from the existing Cloudflare-backed proxy nodes.
