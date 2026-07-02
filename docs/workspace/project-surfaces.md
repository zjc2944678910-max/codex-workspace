# Project Surfaces Summary

Human-readable overview of registered workspace projects, their registered
surfaces, actual working code roots, and GitNexus indexing status.

Source of truth for scripts: [`project-registry.json`](./project-registry.json).

## Registered Projects

| Project | Registered Surface(s) | Working Code Root(s) | Ops Surface | GitNexus |
| --- | --- | --- | --- | --- |
| OpenClaw | `projects/products/openclaw`, `projects/migrations/openclaw-mac-migration` | `projects/products/openclaw/nas-openclaw-v22`; `projects/migrations/openclaw-mac-migration` | `ops/projects/openclaw` | mainline indexed; migration not targeted |
| Hotel Management System | `projects/products/hotel-mgmt` | `projects/products/hotel-mgmt` | `ops/projects/hotel-mgmt` | indexed |
| Love Letter Site | `projects/products/love-letter-site` | `projects/products/love-letter-site` | `ops/projects/love-letter-site` | not indexed |
| NAS Platform | `projects/infrastructure/nas-platform` | `projects/infrastructure/nas-platform` | `ops/projects/nas-platform` | unknown; local path is not a standalone git repo |
| Pet Clinic Management System | `projects/products/pet-clinic` | `projects/products/pet-clinic` | `ops/projects/pet-clinic` | indexed |
| Telegram Dual Relay | `projects/infrastructure/telegram-dual-relay` | `projects/infrastructure/telegram-dual-relay` | `ops/projects/telegram-dual-relay` | indexed |
| Sub2API | ops-only live service | live source on VPS at `/opt/sub2api-src-fix`; no local tracked code root | `ops/projects/sub2api` | not indexed |
| Proxy Nodes VPS | ops-only live service | live xray/sing-box on VPS; no local tracked code root | `ops/projects/proxy-nodes` | not indexed |
| VPS Racknerd Box | ops-only (infra layer) | the racknerd VPS box itself; no code | `ops/projects/vps-racknerd` | not indexed |
| Cloudflare Edge / DNS | ops-only (infra layer) | CF account + `nodezjc12348888.xyz` zone; no code | `ops/projects/cloudflare-edge` | not indexed |
| MathorCup-D | `projects/research/mathorcup_D`, `projects/products/MathorCup_D_repo` | `projects/products/MathorCup_D_repo`; `projects/research/mathorcup_D` | `ops/projects/mathorcup-d` | submission repo indexed; research workspace not targeted |
| BigData-Spark-Research-Workbench | `projects/research/bigdata-spark-research-workbench` | `projects/research/bigdata-spark-research-workbench` | `ops/projects/bigdata-spark-research-workbench` | indexed |
| CUMCM-2026-Workbench | `projects/research/cumcm-2026-workbench` | `projects/research/cumcm-2026-workbench` | `ops/projects/cumcm-2026-workbench` | indexed |
| Tianchi Purchase Redemption | `projects/research/tianchi-purchase-redemption` | `projects/research/tianchi-purchase-redemption` | `ops/projects/tianchi-purchase-redemption` | not indexed |

Legacy GitNexus reference: the old workspace root `-/` remains a legacy-only
reference after the active code roots above are indexed.

## Sibling Workspace (claude-workspace)

Root: `/Users/zhangjincheng/Documents/GitHub/claude-workspace`
(registry: `registry/project-registry.json`).

These projects are also registered in claude-workspace for routing awareness,
but their code roots physically live in this repo under `projects/` and are
exposed to claude-workspace through local git-ignored symlinks per the
2026-06-22 project code consolidation decision:

| Project | Slug | Kind |
| --- | --- | --- |
| 酒店管理系统 (大数据实践 Group6 项目十) | `hotel-mgmt` | product |
| 宠物诊所管理系统 (大数据实践 Group6 项目三) | `pet-clinic` | product |

Shared projects `openclaw` and `sub2api` are registered in both workspaces, but
per Plan A (2026-06-22) **codex-workspace is the canonical owner** of their ops
docs; claude-workspace holds thin pointer READMEs only. The infra-layer projects
`proxy-nodes`, `vps-racknerd`, and `cloudflare-edge` are codex-only.

## Scratch Paths

| Scratch Path | Owning Project | Status | Retention (days) |
| --- | --- | --- | --- |
| `scratch/projects` | workspace | retain container | 30 |
| `scratch/shared` | workspace | retain container | 30 |
| `scratch/projects/openclaw` | openclaw | retain active scratch | 90 |
| `scratch/projects/mathorcup-upload` | mathorcup-d | archived to `archive/cleanup/2026-05-11-scratch-retention/...` on 2026-05-11 | 60 |
| `scratch/projects/mimo-100t-evidence` | (none) | archive after review | 30 |
| `scratch/projects/misc` | (none) | prune when stale | 14 |
| `scratch/shared/codex-runs` | workspace | rotate, keep latest debugging batch | 30 |
| `scratch/shared/douyin-7633454865993256234` | (none) | contents archived on 2026-05-11 | 60 |
| `scratch/shared/hatch-pet` | (none) | retain during evaluation window | 60 |

Source of truth for scripts: [`scratch-retention.json`](./scratch-retention.json).

## State Paths

| State Path | Owning Project | Status | Retention (days) |
| --- | --- | --- | --- |
| `state/project-data/bigdata-spark-research-workbench` | bigdata-spark-research-workbench | retain active research sidecar data | 180 |
| `state/project-data/launchagent-repair` | workspace | review after repair window | 60 |
| `state/project-data/telegram-dual-relay` | telegram-dual-relay | retain active relay state | 90 |
| `state/project-data/telegram-claude-relay` | workspace | review legacy relay migration state | 90 |
| `state/review` | workspace | review candidate bundles | 90 |
| `state/staging` | workspace | review temporary staging monthly | 30 |

Source of truth for scripts: [`state-retention.json`](./state-retention.json).

## Registration Rule

Long-lived project surfaces under `projects/*/*` must be registered via
`ops/projects/<project>/README.md`.  Unregistered project code roots are
flagged by `repo-hygiene.mjs` as policy violations.

## Scratch-First Rule

Tests, scaffolds, and one-off experiments must start in
`scratch/projects/<name>/` until they are promoted to `projects/` with a
corresponding `ops/projects/<name>/README.md`.
