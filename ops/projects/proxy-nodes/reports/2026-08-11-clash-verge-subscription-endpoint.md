# Clash Verge Subscription Endpoint - 2026-08-11

## Scope And Authorization

- Risk level: L3 repair execution.
- Authorization: the user explicitly said `进入修复阶段`.
- Route Lock: `proxy-nodes`; target surface was the existing Racknerd VPS
  static subscription directory.
- Forbidden surfaces: the existing Shadowrocket subscription, proxy services,
  nginx configuration, Cloudflare, OpenClaw, Sub2API, and NAS configuration.

## Diagnosis

Clash Verge Rev fetched the current Shadowrocket/Hiddify subscription
successfully, but the response body was a Base64-encoded list of share links.
Clash Verge Rev expected a Clash/Mihomo YAML mapping and rejected the string as
`invalid yaml`.

The active source subscription observed in the nginx access log at 09:14 CST
contained 11 records. Ten were standard URI records and one was a
Shadowrocket/Surge-style comma record for the NAS VLESS relay.

## Applied Change

- Added one new randomly named `.yaml` file under the existing
  `/var/www/hiddify-sub/hiddify/` static alias.
- Preserved all 11 source nodes: 8 VLESS and 3 Hysteria2.
- Added a manual selection group and an automatic latency group.
- Excluded Webshare, port 9444, and XHTTP variants from automatic selection to
  avoid consuming limited residential traffic or automatically choosing the
  previously experimental transport. Those nodes remain manually selectable.
- Did not edit nginx configuration, overwrite the original `.txt` subscription,
  restart a service, or reload nginx.

The secret public filename is intentionally omitted. Its non-secret audit ID is
`98b24396ce8c`; the generated profile SHA-256 prefix is `5ccabab084ab`.

## Verification

- Ruby YAML parser: top-level mapping, 11 nodes, 2 proxy groups.
- Clash Verge bundled Mihomo: v1.19.29 configuration test passed.
- Public HTTPS fetch: HTTP 200; fetched SHA-256 matched the local validated
  profile.
- Remote file: `root:root`, mode `0644`, one hard link.
- `nginx -t`: successful; no reload was required.
- Direct Mihomo delay checks: 10 of 11 nodes returned a valid latency.
- The NAS relay delay API returned a generic 503, but an actual HTTPS request
  through that node returned HTTP 204 in about 1.95 seconds. This confirms the
  converted NAS node carries traffic even if the UI latency test can report a
  false negative.

## Rollback

Remove only the newly added YAML file. The exact secret-bearing target and its
rollback metadata are retained locally in the ignored, mode-0600 manifest:

`scratch/projects/proxy-nodes/clash-subscription-publish.json`

The original Shadowrocket subscription remains unchanged, so rollback does not
require a service reload.

## Residual Risk

- The new subscription URL is a credential because its response contains node
  connection material. Do not publish it or send it to an online converter.
- If the URL leaks, replace the random subscription filename. If the returned
  node credentials may also have been copied, rotate the affected node
  credentials as well.
- NAS relay latency display can be unreliable even though proxied traffic was
  verified successfully.

## Follow-up

The source Shadowrocket subscription was expanded later on 2026-08-11 from 11
records to the same 13-node Chinese inventory used by Clash, including two
fixed residential-city exits. See
`2026-08-11-shadowrocket-13-chinese-nodes.md`.
