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
