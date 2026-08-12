# Mixed Flat Selector And Network Compatibility Repair - 2026-08-12

## Scope And Authorization

- Risk level: L3 local and production subscription repair.
- Authorization: the user explicitly said
  `按混合单层选择和网络兼容进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: the local `自建+三毛合并` profile, the Clash self-hosted
  subscription source and caches, eight Cloudflare-backed VLESS client ports,
  and Clash's conflicting TUN state.
- Out of scope: Shadowrocket subscription contents, airport contents, proxy
  exits, NAS/VPS proxy services, router, Cloudflare rules, UUIDs, WebSocket
  paths, and every non-Clash client.

## Confirmed Diagnosis

### Nested selector behavior

The merged profile's final rule pointed to `统一选择`, while the UI exposed
separate `自建节点`, `住宅出口`, and `三毛机场` groups. Changing a node inside
one of those child groups did not affect traffic unless `统一选择` first pointed
to that child group. This was valid Mihomo behavior but did not match the
desired "click a node and use it" interaction.

### Network compatibility

- Clash and Shadowrocket packet tunnels were simultaneously running.
- Shadowrocket owned the system default route, while an idle Clash TUN still
  existed and participated in DNS and routing state.
- Clash logs recorded direct connection timeouts to the Cloudflare VLESS
  endpoint on port 8443.
- The same eight VLESS records succeeded on port 443 in isolated Mihomo tests
  forced through the physical Wi-Fi interface.
- The subscription download endpoint initially returned HTTP 403 on both 443
  and 8443 after publication. Current nginx evidence confirmed that the new
  source file had accidentally been installed mode 0600, so nginx could not
  read it. Restoring the normal static-subscription mode fixed both ports.

## Applied Change

### Flat mixed profile

The merged profile now has two groups only:

1. `节点选择`: a manual selector containing `自动选择`, `DIRECT`, all 13
   self-hosted nodes, and all 38 airport records;
2. `自动选择`: the existing URL-test group with its existing residential and
   XHTTP exclusions.

The final rule is now `MATCH,节点选择`. Selecting a concrete self-hosted or
airport node inside `节点选择` therefore immediately changes the traffic path.

The profile card description was updated to describe the 13+38 inventory, and
its saved selection was reduced to the single `节点选择` group while preserving
the previously used Washington residential node.

### Client port compatibility

Changed only the client-facing port from 8443 to 443 for these eight
Cloudflare-backed VLESS records:

- three direct Cloudflare variants;
- three primary residential variants;
- one compatibility WebSocket variant;
- one residential XHTTP variant.

The NAS relay, all Hysteria2 records, REALITY, connection credentials, SNI,
Host, path, transport, and exit routing were unchanged.

The public Clash subscription and active local self-hosted profile were
synchronized. The merged profile uses a dedicated pre-seeded 443 cache under
the user-owned profiles directory rather than overwriting the root-managed old
provider cache.

The Clash subscription download URL was also moved from explicit port 8443 to
standard HTTPS port 443 after both Cloudflare edge addresses returned HTTP 200
and candidate-matching bodies. The Shadowrocket subscription URL was not
changed.

### TUN ownership

Clash's persistent and runtime TUN switches were disabled while Shadowrocket
was active. Shadowrocket remained running and the system default route stayed
on its tunnel throughout the repair. When returning to Clash, the user should
first disconnect Shadowrocket and then enable Clash's virtual network adapter.

## Rollback Evidence

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260812T162447+0800-mixed-flat-network-compat`
- VPS bundle, mode 0700:
  `/root/rollback/proxy-nodes/20260812T162447+0800-mixed-flat-network-compat`
- Secret-bearing candidate directory, mode 0700:
  `scratch/projects/proxy-nodes/20260812T162447+0800-mixed-flat-network-compat`
- Publish manifest, mode 0600:
  `scratch/projects/proxy-nodes/mixed-flat-network-compat-publish.json`

Rollback requires restoring the remote Clash source and its original mode,
then restoring the local profile, profile index, Clash runtime settings, and
Verge settings from the bundle. The new user-owned dedicated cache can be
ignored after rollback.

## Verification

- Structured comparisons proved that the remote/local self-hosted inventory
  changed only the eight approved port values.
- All eight VLESS variants completed real HTTP 204 requests on port 443 through
  an isolated Mihomo core bound to physical Wi-Fi.
- The flat mixed profile loaded with 53 manual choices: 13 self-hosted, 38
  airport, `自动选择`, and `DIRECT`.
- Direct selection and real requests succeeded for representative direct and
  residential self-hosted nodes and an airport node.
- The final rule resolved to `节点选择`.
- The public subscription returned HTTP 200 on both tested Cloudflare edge
  addresses over port 443, and both body hashes matched the validated remote
  candidate.
- The final remote file mode was restored to 0644, matching other static
  subscription files. A temporary 0600 publication mode caused HTTP 403 and
  was corrected before completion.
- The merged profile loaded with the dedicated 443 cache and accepted direct
  selection of the Washington node.
- The user's original independent self-hosted profile was restored as the
  active Clash runtime after verification.
- Clash TUN was false in both persistent settings and runtime state;
  Shadowrocket remained running and the default route remained unchanged.

## Residual Risk And Usage

- Do not run both virtual network adapters together. Use this sequence:
  - Shadowrocket to Clash: disconnect Shadowrocket, open Clash, enable Clash's
    virtual network adapter;
  - Clash to Shadowrocket: disable Clash's virtual network adapter, then
    connect Shadowrocket.
- The Clash subscription now downloads over standard HTTPS port 443. Its
  dedicated local cache still keeps the self-hosted nodes available during a
  temporary update failure.
- Several airport nodes timed out during physical-Wi-Fi sampling while another
  airport node succeeded. Airport health was not modified by this repair.
- Subscription URLs and node records remain credentials and must not be
  published.
