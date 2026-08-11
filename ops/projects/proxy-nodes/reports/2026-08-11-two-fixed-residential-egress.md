# Two Fixed Residential Egresses - 2026-08-11

## Scope And Authorization

- Risk level: L3 repair execution.
- Authorization: the user explicitly said `按两个住宅出口进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: the existing Xray Webshare WS surface, its nginx locations, and
  the existing Clash YAML profile.
- Out of scope: sing-box, Webshare credentials or plan, Cloudflare settings,
  the original Shadowrocket subscription, other proxy nodes, and NAS services.

## Applied Change

- Preserved the existing automatic Webshare WS entry backed by
  `webshare-bal` and exposed it in Clash as `住宅线路-自动`.
- Added two loopback-only VLESS+WS inbounds to
  `/etc/xray-wifi-fallback.json`:
  - `residential-sacramento-ws` on port 23091, fixed to `webshare1`.
  - `residential-washington-ws` on port 23093, fixed to `webshare2`.
- Added matching opaque WS locations to both relevant server blocks in
  `/etc/nginx/sites-available/openclaw-gateway`. The random paths are omitted
  from this tracked report.
- Updated the existing secret Clash YAML profile in place:
  - renamed the `CF-Webshare-US` alias to `住宅线路-自动`;
  - added `住宅线路-萨克拉门托` and `住宅线路-华盛顿`;
  - added all three to the manual selection group;
  - kept all residential choices out of the automatic latency group.
- No public port, DNS record, certificate, credential, quota, or third-party
  account setting was changed.

## Rollback Evidence

The pre-change Xray, nginx, and Clash profile files were copied before any
live replacement. Backup SHA-256 values matched the then-live files.

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260811T142438+0800-two-residential-egress`
- VPS bundle, mode 0700:
  `/root/rollback/proxy-nodes/20260811T142438+0800-two-residential-egress`
- The exact secret-bearing public target remains only in the ignored,
  mode-0600 manifest:
  `scratch/projects/proxy-nodes/clash-subscription-publish.json`

Rollback requires restoring the three files from the VPS bundle to their
original targets, testing Xray and nginx, restarting
`xray-wifi-fallback.service`, reloading nginx, and confirming the public Clash
profile matches the restored profile. No database or Cloudflare rollback is
needed.

## Verification

- Candidate and installed Xray configuration: `Configuration OK`.
- Candidate and installed nginx configuration: syntax test successful.
- Candidate Clash profile: Ruby YAML mapping validation and Clash Verge Rev's
  bundled Mihomo configuration test succeeded.
- Runtime: `xray-wifi-fallback.service` and `nginx.service` active with zero
  restart loops; ports 23085, 23091, and 23093 listening on loopback.
- Both new paths returned WebSocket HTTP 101 through the origin and through
  the Cloudflare public edge.
- Public Clash profile fetch succeeded and its SHA-256 matched the validated
  published candidate.
- Isolated Mihomo end-to-end test:
  - `住宅线路-自动` selected successfully and exited through one configured
    residential proxy;
  - both fixed-city nodes selected successfully and matched their assigned
    upstreams;
  - the two fixed-city nodes produced distinct exit IPs.

One SSH session closed before returning the transaction script's summary.
Immediate read-only reconciliation confirmed that the intended candidate
files were installed, both services were active, all expected listeners were
present, and both live configuration tests passed before publication
continued.

## Residual Risk

- Xray currently warns that WebSocket transport is deprecated in favor of
  XHTTP. The warning was already relevant to the existing WS nodes and does
  not prevent this configuration from starting.
- A fixed residential node intentionally loses automatic failover. Use
  `住宅线路-自动` when continuity matters more than a stable city/IP.
- All residential nodes share the same 250GB monthly pool; adding selectable
  exits does not increase quota.
- The Clash subscription URL and opaque WS paths remain credentials and must
  not be published.

## Follow-up

Later on 2026-08-11, all Clash display names were normalized to Chinese. The
three current residential labels are `住宅线路｜自动`, `住宅线路｜萨克拉门托`,
and `住宅线路｜华盛顿`. See
`2026-08-11-clash-chinese-node-names.md` for the complete mapping.
