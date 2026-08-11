# NAS Relay Node Credential Repair - 2026-08-11

## Scope And Authorization

- Risk level: L3 production subscription repair.
- Authorization: the user explicitly said
  `按NAS中转节点进入修复阶段`.
- Route Lock: `proxy-nodes`, with read-only NAS and VPS dependencies.
- In scope: the `家庭中转｜NAS` connection record in the existing Clash and
  Shadowrocket subscription sources, plus the active local Clash provider
  cache.
- Out of scope: the NAS relay service, router, DNS, Cloudflare, nginx, Xray,
  sing-box, every other proxy record, and active Clash group selections.

## Confirmed Diagnosis

- The public NAS endpoint remained reachable over TCP and TLS.
- Before the repair, `codex-nas-vps-fallback-relay.service` was active,
  listening on its existing port, and had `NRestarts=0`.
- The relay still forwarded to the intended Cloudflare-backed VPS endpoint.
- The subscription record was stale:
  - its SNI and WebSocket Host used the apex hostname instead of the current
    working `node.` hostname;
  - its UUID was no longer authorized by the live VPS Xray configuration.
- Controlled variants isolated both requirements: correcting only SNI/Host
  still failed, while correcting SNI/Host and UUID together produced HTTP 204.

The failure was therefore in the client subscription record, not in the NAS
relay transport.

## Applied Change

- In the Clash subscription, changed only the NAS proxy's UUID, SNI, and
  WebSocket Host to match the current working Cloudflare VLESS+WS node.
- In the Shadowrocket subscription, made the equivalent three field changes
  in the NAS comma record.
- Preserved the NAS endpoint, port, protocol, TLS mode, WebSocket path, display
  name, node order, and all other records.
- Published both subscription files as one transaction after validating both
  candidates. A failure would have restored both originals.
- Refreshed the active merged Clash profile's `self-hosted` provider cache.
  Its existing group selections were preserved.
- Did not edit or restart any NAS, VPS, router, DNS, Cloudflare, or proxy
  service.

## Rollback Evidence

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260811T163323+0800-nas-relay-node-repair`
- VPS bundle, mode 0700:
  `/root/rollback/proxy-nodes/20260811T163323+0800-nas-relay-node-repair`
- Secret target metadata, mode 0600:
  `scratch/projects/proxy-nodes/nas-relay-node-repair-publish.json`

Rollback requires atomically restoring `clash-profile.yaml` and
`shadowrocket-subscription.txt` from the VPS bundle to the targets retained in
the ignored manifest, then refreshing the local `self-hosted` provider. No
service restart is required.

## Verification

- Structured comparisons proved that only the approved NAS fields changed in
  each source.
- The updated UUID is authorized by the live Xray configuration.
- Both independently generated candidates passed isolated Mihomo end-to-end
  requests with HTTP 204 before publication.
- Both public subscription bodies matched their validated candidates after
  publication.
- The local provider cache refreshed to the published Clash source and still
  contained 13 self-hosted nodes.
- A second isolated test built from that refreshed cache selected
  `家庭中转｜NAS` and completed a real HTTPS request with HTTP 204.
- The active Clash selections were unchanged.
- VPS nginx and Xray remained active with `NRestarts=0`.

## Residual Risk

- Shadowrocket must refresh its subscription before the corrected NAS record
  replaces its cached copy.
- The NAS management tunnel timed out during the final status-only recheck.
  This did not affect the end-to-end relay test, and no NAS command or service
  restart was issued during this repair.
- Subscription URLs and decoded connection records remain credentials and
  must not be published.
