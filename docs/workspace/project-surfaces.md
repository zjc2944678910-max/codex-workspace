# Project Surfaces Summary

Human-readable overview of registered workspace projects, their registered
surfaces, actual working code roots, and GitNexus indexing status.

Source of truth for scripts: [`project-registry.json`](./project-registry.json).

## Registered Projects

<!-- BEGIN GENERATED PROJECT SURFACES -->
| Project | Registered Surface(s) | Working Code Root(s) | Ops Surface | GitNexus |
| --- | --- | --- | --- | --- |
| Antigravity MCP | `projects/products/antigravity-mcp` | `projects/products/antigravity-mcp` | `ops/projects/antigravity-mcp` | `main`: `not_indexed` |
| BigData-Spark-Research-Workbench | `projects/research/bigdata-spark-research-workbench` | `projects/research/bigdata-spark-research-workbench` | `ops/projects/bigdata-spark-research-workbench` | `research-workspace`: `indexed` at `b94ab67` (2026-06-22) |
| ClaimFlow | `projects/research/claimflow` | `projects/research/claimflow` | `ops/projects/claimflow` | `main`: `not_indexed` |
| Cloudflare Edge / DNS | ops-only | ops-only | `ops/projects/cloudflare-edge` | `not_indexed` |
| CUMCM-2026-Workbench | `projects/research/cumcm-2026-workbench` | `projects/research/cumcm-2026-workbench` | `ops/projects/cumcm-2026-workbench` | `research-workspace`: `indexed` at `111d7b2` (2026-06-22) |
| Hotel Management System | `projects/products/hotel-mgmt` | `projects/products/hotel-mgmt` | `ops/projects/hotel-mgmt` | `main`: `indexed` at `d97ae53` (2026-07-04) |
| IELTS Vocab Hub | `projects/products/ielts-vocab-hub` | `projects/products/ielts-vocab-hub` | `ops/projects/ielts-vocab-hub` | `main`: `indexed` at `aba9c33` (2026-08-15) |
| Love Letter Site | `projects/products/love-letter-site` | `projects/products/love-letter-site` | `ops/projects/love-letter-site` | `main`: `not_indexed` |
| MathorCup-D | `projects/research/mathorcup_D`<br>`projects/products/MathorCup_D_repo` | `projects/products/MathorCup_D_repo`<br>`projects/research/mathorcup_D` | `ops/projects/mathorcup-d` | `submission-repo`: `indexed` at `71acb62` (2026-05-11);<br>`research-workspace`: `not_targeted` |
| Minesweeper Pro | `projects/products/minesweeper` | `projects/products/minesweeper` | `ops/projects/minesweeper` | `main`: `not_indexed` |
| NAS Platform | `projects/infrastructure/nas-platform` | `projects/infrastructure/nas-platform` | `ops/projects/nas-platform` | `infrastructure-config-root`: `indexed` (2026-07-04) |
| Neon Survivors 2088 | `projects/products/neon-survivors` | `projects/products/neon-survivors` | `ops/projects/neon-survivors` | `main`: `not_indexed` |
| OpenClaw | `projects/products/openclaw`<br>`projects/migrations/openclaw-mac-migration` | `projects/products/openclaw/nas-openclaw-v22`<br>`projects/migrations/openclaw-mac-migration` | `ops/projects/openclaw` | `mainline`: `indexed` at `2dfe52f` (2026-06-22);<br>`migration-reference`: `not_targeted` |
| Paper 001 Research Workbench | `projects/research/paper-001` | `projects/research/paper-001` | `ops/projects/paper-001` | `main`: `not_indexed` |
| Personal AI Companion | `projects/products/personal-ai-companion` | `projects/products/personal-ai-companion` | `ops/projects/personal-ai-companion` | `main`: `indexed` at `50a067d` (2026-09-02) |
| Personal Portfolio | `projects/products/personal-portfolio` | `projects/products/personal-portfolio` | `ops/projects/personal-portfolio` | `main`: `not_indexed` |
| Pet Clinic Management System | `projects/products/pet-clinic` | `projects/products/pet-clinic` | `ops/projects/pet-clinic` | `main`: `indexed` (2026-06-09) |
| Proxy Nodes VPS | ops-only | ops-only | `ops/projects/proxy-nodes` | `not_indexed` |
| SLA-SQL Research | `projects/research/sla-sql` | `projects/research/sla-sql` | `ops/projects/sla-sql` | `main`: `not_indexed` |
| Cosmic Guardian | `projects/products/space-shooter` | `projects/products/space-shooter` | `ops/projects/space-shooter` | `main`: `not_indexed` |
| Sub2API | ops-only | ops-only | `ops/projects/sub2api` | `not_indexed` |
| Telegram Dual Relay | `projects/infrastructure/telegram-dual-relay` | `projects/infrastructure/telegram-dual-relay` | `ops/projects/telegram-dual-relay` | `service-repo`: `indexed` at `3245726` (2026-06-22) |
| Tianchi Purchase Redemption | `projects/research/tianchi-purchase-redemption` | `projects/research/tianchi-purchase-redemption` | `ops/projects/tianchi-purchase-redemption` | `research-workspace`: `not_indexed` |
| VPS Racknerd Box | ops-only | ops-only | `ops/projects/vps-racknerd` | `not_indexed` |
<!-- END GENERATED PROJECT SURFACES -->

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
| `scratch/projects/personal-ai-companion` | personal-ai-companion | retain active local QA/build/evidence scratch | 90 |
| `scratch/projects/proxy-nodes` | proxy-nodes | retain validation and rollback scratch | 90 |
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
| `state/project-data/personal-ai-companion` | personal-ai-companion | retain active device/iOS/rollback/evidence state | 180 |
| `state/project-data/bigdata-spark-research-workbench` | bigdata-spark-research-workbench | retain active research sidecar data | 180 |
| `state/project-data/launchagent-repair` | workspace | review after repair window | 60 |
| `state/project-data/telegram-dual-relay` | telegram-dual-relay | retain active relay state | 90 |
| `state/project-data/telegram-claude-relay` | workspace | review legacy relay migration state | 90 |
| `state/review` | workspace | review candidate bundles | 90 |
| `state/staging` | workspace | review temporary staging after project ownership review | 90 |

Source of truth for scripts: [`state-retention.json`](./state-retention.json).

## Registration Rule

Long-lived project surfaces under `projects/*/*` must be registered via
`ops/projects/<project>/README.md`.  Unregistered project code roots are
flagged by `repo-hygiene.mjs` as policy violations.

## Scratch-First Rule

Tests, scaffolds, and one-off experiments must start in
`scratch/projects/<name>/` until they are promoted to `projects/` with a
corresponding `ops/projects/<name>/README.md`.
