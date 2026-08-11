# Clash Chinese Node Names - 2026-08-11

## Scope And Authorization

- Risk level: L3 repair execution.
- Authorization: the user explicitly said `按中文名称进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: display names and matching selection-group references in the
  existing Clash YAML profile.
- Out of scope: every connection parameter, Xray, nginx, sing-box,
  Cloudflare, Webshare, Shadowrocket, and NAS repair.

## Applied Change

The 13 Clash node display names were normalized as follows:

| Previous name | Current name |
| --- | --- |
| `VLESS-WS-Mobile-8443` | `CF直连｜移动优先` |
| `CF-node-WS` | `CF直连｜WS` |
| `CF-node-XHTTP` | `CF直连｜XHTTP` |
| `住宅线路-自动` | `住宅线路｜自动` |
| `住宅线路-萨克拉门托` | `住宅线路｜萨克拉门托` |
| `住宅线路-华盛顿` | `住宅线路｜华盛顿` |
| `VLESS-WS-Mobile-Webshare-8443` | `住宅线路｜兼容WS` |
| `CF-Webshare-XHTTP` | `住宅线路｜XHTTP自动` |
| `1号节点9444端口` | `住宅线路｜HY2自动` |
| `HY2-Mobile-443` | `VPS直连｜HY2-443` |
| `zjc的2号节点8443` | `VPS直连｜HY2-8443` |
| `nas-relay-18443-fixed` | `家庭中转｜NAS` |
| `VLESS-Reality-443` | `VPS直连｜REALITY` |

Both proxy groups retained their existing names and behavior. No proxy was
added, removed, reordered, or otherwise reconfigured.

## Rollback Evidence

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260811T144420+0800-clash-chinese-names`
- VPS bundle, mode 0700:
  `/root/rollback/proxy-nodes/20260811T144420+0800-clash-chinese-names`
- The exact secret-bearing public target remains only in the ignored,
  mode-0600 manifest:
  `scratch/projects/proxy-nodes/clash-subscription-publish.json`

Rollback requires restoring only `clash-profile.yaml` from the VPS bundle to
the secret target retained in the local manifest. No service restart or reload
is required.

## Verification

- Source contained exactly the 13 approved previous names.
- Candidate contained 13 unique current names and all proxy-group references
  resolved.
- A structured round-trip comparison replaced the current names with their
  previous values and reconstructed the original parsed YAML object exactly.
  This proves that all non-name fields remained unchanged.
- Clash Verge Rev's bundled Mihomo configuration test succeeded.
- The public profile SHA-256 matched the validated published candidate.
- Isolated Mihomo requests succeeded through representative renamed CF,
  residential, and VPS nodes.

## Unrelated Live Finding

`家庭中转｜NAS` was selected successfully by name, but its test request timed
out twice. Because its connection fields were byte-for-byte unchanged by this
operation, this is an existing route-health issue rather than a rename defect.
No NAS repair was attempted because it was outside the authorized scope.

## Residual Risk

- After refreshing the subscription, a client that had persisted a previous
  node name may require one manual selection.
- The subscription URL remains a credential and must not be published.

## Follow-up

The local Clash Verge `自建+三毛合并` profile was synchronized later the same
day. Its stored choices and name-based filters now understand the Chinese node
names. The Shadowrocket Base64 subscription was also synchronized and expanded
to the same 13-node Chinese inventory. See
`2026-08-11-merged-profile-chinese-names.md` and
`2026-08-11-shadowrocket-13-chinese-nodes.md`.

The unrelated NAS route-health finding was subsequently repaired under a
separate L3 authorization. Its stale UUID, SNI, and WebSocket Host were synced
without changing this naming operation; see
`2026-08-11-nas-relay-node-credential-repair.md`.
