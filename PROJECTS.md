# Project Index

<!-- GENERATED FILE - do not edit by hand.
     Update docs/workspace/project-registry.json, then run:
     node docs/workspace/codex-register-project.mjs --regen -->

Short human-readable project map for Codex sessions started from
`codex-workspace`.

Machine source of truth: `docs/workspace/project-registry.json`.

## Workspace Roots

- Codex workspace root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace`
- Sibling workspace: `/Users/zhangjincheng/Documents/GitHub/claude-workspace`

## Active Projects

| Project | Kind | Risk | Code Root(s) | Ops Surface |
| --- | --- | --- | --- | --- |
| **BigData-Spark-Research-Workbench** (`bigdata-spark-research-workbench`) | research | research_local | `projects/research/bigdata-spark-research-workbench` | `ops/projects/bigdata-spark-research-workbench` |
| **Cloudflare Edge / DNS** (`cloudflare-edge`) | infrastructure | live_infra | `ops-only` | `ops/projects/cloudflare-edge` |
| **CUMCM-2026-Workbench** (`cumcm-2026-workbench`) | research | research_local | `projects/research/cumcm-2026-workbench` | `ops/projects/cumcm-2026-workbench` |
| **Love Letter Site** (`love-letter-site`) | product | local | `projects/products/love-letter-site` | `ops/projects/love-letter-site` |
| **MathorCup-D** (`mathorcup-d`) | research | research_local | `projects/products/MathorCup_D_repo`<br>`projects/research/mathorcup_D` | `ops/projects/mathorcup-d` |
| **NAS Platform** (`nas-platform`) | infrastructure | live_infra | `projects/infrastructure/nas-platform` | `ops/projects/nas-platform` |
| **OpenClaw** (`openclaw`) | infrastructure | live_infra | `projects/products/openclaw/nas-openclaw-v22`<br>`projects/migrations/openclaw-mac-migration` | `ops/projects/openclaw` |
| **Proxy Nodes VPS** (`proxy-nodes`) | infrastructure | live_infra | `ops-only` | `ops/projects/proxy-nodes` |
| **Sub2API** (`sub2api`) | infrastructure | live_infra | `ops-only` | `ops/projects/sub2api` |
| **Telegram Dual Relay** (`telegram-dual-relay`) | infrastructure | live_infra | `projects/infrastructure/telegram-dual-relay` | `ops/projects/telegram-dual-relay` |
| **Tianchi Purchase Redemption** (`tianchi-purchase-redemption`) | research | research_local | `projects/research/tianchi-purchase-redemption` | `ops/projects/tianchi-purchase-redemption` |
| **VPS Racknerd Box** (`vps-racknerd`) | infrastructure | live_infra | `ops-only` | `ops/projects/vps-racknerd` |

## Routing

- Route by explicit project name, registered alias, host/service, path, or file.
- Code implementation belongs in the registered code root or external live source.
- Durable project facts belong in `ops/projects/<slug>/README.md`.
- Temporary work belongs in `scratch/projects/<slug>/` or `scratch/shared/`.
- Imported raw material belongs in ignored `inbox/`; cross-tool summaries belong in ignored `handoffs/`.
- Live/NAS/VPS/production tasks default to L2 read-only audit; L3 repair still needs `进入修复阶段`.

## Registration

```bash
node docs/workspace/codex-register-project.mjs --slug <slug> --name "<Name>" --kind product
node docs/workspace/codex-register-project.mjs --regen
```

## Sibling Workspace

- Name: `claude-workspace`
- Root: `/Users/zhangjincheng/Documents/GitHub/claude-workspace`
- Registry: `registry/project-registry.json`
- Primarily maintained there: `hotel-mgmt`, `pet-clinic`

Projects below are routed/maintained by the sibling workspace (claude) for their ops/registry, but as of 2026-06-22 ALL project CODE physically lives in THIS codex repo under projects/ (single-copy model). hotel-mgmt/pet-clinic code is here at projects/products/{hotel-mgmt,pet-clinic} (own git repos = backup); claude only holds symlinks. So 'maintained by claude' = ownership/routing, not code location. Shared projects openclaw and sub2api are registered in both workspaces.
