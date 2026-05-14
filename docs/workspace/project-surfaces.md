# Project Surfaces Summary

Human-readable overview of registered workspace projects, their registered
surfaces, actual working code roots, and GitNexus indexing status.

Source of truth for scripts: [`project-registry.json`](./project-registry.json).

## Registered Projects

| Project | Registered Surface(s) | Working Code Root(s) | Ops Surface | GitNexus |
| --- | --- | --- | --- | --- |
| OpenClaw | `projects/products/openclaw`, `projects/migrations/openclaw-mac-migration` | `projects/products/openclaw/nas-openclaw-v22`; `projects/migrations/openclaw-mac-migration` | `ops/projects/openclaw` | mainline indexed; migration not targeted |
| NAS Platform | `projects/infrastructure/nas-platform` | `projects/infrastructure/nas-platform` | `ops/projects/nas-platform` | indexed |
| Telegram Dual Relay | `projects/infrastructure/telegram-dual-relay` | `projects/infrastructure/telegram-dual-relay` | `ops/projects/telegram-dual-relay` | indexed |
| MathorCup-D | `projects/research/mathorcup_D`, `projects/products/MathorCup_D_repo` | `projects/products/MathorCup_D_repo`; `projects/research/mathorcup_D` | `ops/projects/mathorcup-d` | submission repo indexed; research workspace not targeted |
| BigData-Spark-Research-Workbench | `projects/research/bigdata-spark-research-workbench` | `projects/research/bigdata-spark-research-workbench` | `ops/projects/bigdata-spark-research-workbench` | indexed |
| CUMCM-2026-Workbench | `projects/research/cumcm-2026-workbench` | `projects/research/cumcm-2026-workbench` | `ops/projects/cumcm-2026-workbench` | indexed |

Legacy GitNexus reference: the old workspace root `-/` remains a legacy-only
reference after the active code roots above are indexed.

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

## Registration Rule

Long-lived project surfaces under `projects/*/*` must be registered via
`ops/projects/<project>/README.md`.  Unregistered project code roots are
flagged by `repo-hygiene.mjs` as policy violations.

## Scratch-First Rule

Tests, scaffolds, and one-off experiments must start in
`scratch/projects/<name>/` until they are promoted to `projects/` with a
corresponding `ops/projects/<name>/README.md`.
