# Shadowrocket 13 Chinese Nodes - 2026-08-11

## Scope And Authorization

- Risk level: L3 production subscription repair.
- Authorization: the user explicitly said
  `按小火箭13节点进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: the existing 11-record Shadowrocket Base64 subscription.
- Out of scope: `mac-main.txt`, Clash YAML, proxy services, Cloudflare,
  connection credentials, and every other subscription.

The secret filename is omitted. Its non-secret filename audit ID is
`e379949018`.

## Applied Change

- Renamed the existing 11 records to the same Chinese display names used by
  Clash.
- Added two VLESS+WS records:
  - `住宅线路｜萨克拉门托`;
  - `住宅线路｜华盛顿`.
- Inserted the fixed-city records after `住宅线路｜自动`.
- Preserved the Base64 subscription format.
- Preserved the existing 11 connection records exactly except for their URI
  fragments or the NAS comma-record label.
- Built both new records from the existing automatic residential VLESS+WS
  record, changing only the opaque WS path and display name. Their UUID,
  endpoint, TLS, SNI, Host, fingerprint, and transport fields remained aligned
  with the current fixed Xray inbounds.

Final inventory:

1. `CF直连｜移动优先`
2. `CF直连｜WS`
3. `CF直连｜XHTTP`
4. `住宅线路｜自动`
5. `住宅线路｜萨克拉门托`
6. `住宅线路｜华盛顿`
7. `住宅线路｜兼容WS`
8. `住宅线路｜XHTTP自动`
9. `住宅线路｜HY2自动`
10. `VPS直连｜HY2-443`
11. `VPS直连｜HY2-8443`
12. `家庭中转｜NAS`
13. `VPS直连｜REALITY`

## Rollback Evidence

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260811T151643+0800-shadowrocket-13-chinese`
- VPS bundle, mode 0700:
  `/root/rollback/proxy-nodes/20260811T151643+0800-shadowrocket-13-chinese`
- Secret target and public URL metadata, mode 0600:
  `scratch/projects/proxy-nodes/shadowrocket-13-chinese-publish.json`

Rollback requires atomically restoring `shadowrocket-subscription.txt` from
the VPS bundle to the target retained in the local manifest. No service reload
or restart is required.

## Verification

- Pre-publication HTTPS fetch matched the rollback original.
- The existing 11 records were independently compared and all non-name bytes
  remained identical.
- The candidate decoded to 13 unique names: 9 VLESS, 3 HY2, and one NAS comma
  record.
- Both fixed records used the UUID and paths from their live Xray inbounds.
- A temporary Mihomo configuration generated directly from the two new VLESS
  URIs passed configuration validation.
- End-to-end requests through both new URIs succeeded, matched their assigned
  upstream exits, and produced two distinct exit IPs.
- The published file SHA-256 matched the validated candidate; its public body
  decoded to the expected 13 names.
- nginx, Xray, and sing-box remained active with zero restart loops.
- The separate `mac-main.txt` content hash remained unchanged.

## Residual Risk

- Shadowrocket must refresh the subscription before the two new records and
  Chinese names appear locally.
- A client may temporarily retain stale imported records until subscription
  replacement completes.
- The subscription URL and decoded node records are credentials and must not
  be published.

## Follow-up

The `家庭中转｜NAS` record was later found to contain stale connection
parameters and was repaired under separate L3 authorization. This did not
change the 13-node inventory or Chinese display names. See
`2026-08-11-nas-relay-node-credential-repair.md`.
