# Project Knowledge Map

Searchable map of workspace memory: where routing facts live, which docs are
authoritative, and when to spend strong-model review budget.

Machine routing source: [`project-registry.json`](./project-registry.json).
Short generated index: [`../../PROJECTS.md`](../../PROJECTS.md).
Policy source: [`../../AGENTS.md`](../../AGENTS.md).

## How To Use

- Start here when a task names a project, alias, service, host, runbook, or old
  workspace path and you need the right surface quickly.
- Use this file as an index, not a replacement for the linked docs.
- For long tasks, create a Route Lock from the project row before delegating or
  asking external models for advice.
- For live infrastructure rows, keep first-pass work L2 read-only. L3 repair
  still requires the user to say `进入修复阶段`.

## Global Entry Points

| Need | Start Here | Notes |
| --- | --- | --- |
| Workspace routing and risk policy | [`AGENTS.md`](../../AGENTS.md) | Canonical guardrails, risk ladder, worker/model rules. |
| Daily orientation | [`README.md`](../../README.md), [`PROJECTS.md`](../../PROJECTS.md) | Canonical root, placement rules, generated project list. |
| Legacy path translation | [`WORKSPACE_MAP.md`](../../WORKSPACE_MAP.md) | Use when notes mention `-/` or `codex-workplace`. |
| Durable workspace decisions | [`workspace-decisions.md`](../decisions/workspace-decisions.md) | Do not re-litigate decisions without drift evidence. |
| Tooling and health | [`docs/workspace/README.md`](./README.md) | Long-task CLI, health checks, retention, Playwright wrapper. |
| Long task protocol | [`codex-long-task-runbook.md`](./codex-long-task-runbook.md) | Route Lock, slices, repair loops, closeout. |
| Worker contract | [`WORKER.md`](../../WORKER.md) | Scope, forbidden actions, output shape for local workers. |

## Durable Decisions To Reuse

| Date | Decision | Where |
| --- | --- | --- |
| 2026-06-17 | `codex-workspace` is a project-neutral workspace index; no project is default. | [`workspace-decisions.md`](../decisions/workspace-decisions.md) |
| 2026-06-17 | `PROJECTS.md` is generated from `project-registry.json`; do not edit by hand. | [`workspace-decisions.md`](../decisions/workspace-decisions.md) |
| 2026-06-22 | `codex-workspace` owns shared `openclaw` / `sub2api` ops docs; sibling workspace holds pointers. | [`workspace-decisions.md`](../decisions/workspace-decisions.md) |
| 2026-06-22 | Separate infra layers (`vps-racknerd`, `cloudflare-edge`, `nas-platform`) from apps (`openclaw`, `sub2api`, `proxy-nodes`, `telegram-dual-relay`). | [`workspace-decisions.md`](../decisions/workspace-decisions.md) |
| 2026-06-22 | All project code physically lives under `projects/`; sibling workspace reaches it by local ignored symlinks. | [`workspace-decisions.md`](../decisions/workspace-decisions.md) |

## Project Map

Canonical project identity, aliases, and paths still live in
[`project-registry.json`](./project-registry.json). This table is a
human-facing overlay for risk gates, knowledge entrypoints, and model-review
strategy. Update the registry first when a project is added, removed, renamed,
or rerouted.

| Project | Route Tokens | Risk Gate | Code / Ops | Knowledge Entrypoints | Strong-Model Use |
| --- | --- | --- | --- | --- | --- |
| Antigravity MCP | `antigravity-mcp`, `ag worker` | L0/L1 local product; no live infra | Code: `projects/products/antigravity-mcp`; Ops: [`ops/projects/antigravity-mcp`](../../ops/projects/antigravity-mcp/README.md); not GitNexus indexed | Ops README; local STDIO MCP worker | Opus 5 may review worker routing; Codex owns edits. |
| BigData-Spark-Research-Workbench | `bigdata-spark-research-workbench`, `spark-research-workbench` | L0/L1 local research; no live infra | Code: `projects/research/bigdata-spark-research-workbench`; Ops: [`ops/projects/bigdata-spark-research-workbench`](../../ops/projects/bigdata-spark-research-workbench/README.md) | [`course-project-workflow.md`](../../ops/projects/bigdata-spark-research-workbench/runbooks/course-project-workflow.md); reports under `ops/projects/bigdata-spark-research-workbench/reports/`; GitNexus indexed | Claude Code Opus 5 may advise on literature framing, analysis plans, and code/test review; Codex authors and verifies. |
| Cloudflare Edge / DNS | `cloudflare-edge`, `cloudflare`, `CF`, `橙云`, `nodezjc12348888.xyz` | L2 read-only for live DNS/edge facts; L3 changes require `进入修复阶段` | Ops-only: [`ops/projects/cloudflare-edge`](../../ops/projects/cloudflare-edge/README.md) | Domain, subdomain, Origin Rule, cert, DDNS, CF credential state notes in README | Opus 5 may review bounded redacted evidence and high-risk routing plans; never send tokens, and Codex owns conclusions. |
| CUMCM-2026-Workbench | `cumcm-2026-workbench`, `cumcm2026`, `cumcm-workbench` | L0/L1 local research; no live infra | Code: `projects/research/cumcm-2026-workbench`; Ops: [`ops/projects/cumcm-2026-workbench`](../../ops/projects/cumcm-2026-workbench/README.md) | [`contest-day-workflow.md`](../../ops/projects/cumcm-2026-workbench/runbooks/contest-day-workflow.md); [`github-resource-matrix.md`](../../ops/projects/cumcm-2026-workbench/reports/github-resource-matrix.md); GitNexus indexed | Opus 5 may advise on strategy, modeling alternatives, writing, and final risk review; Codex implements and verifies. |
| ClaimFlow | `claimflow`, `claim-flow` | L0/L1 local research; no live infra | Code: `projects/research/claimflow`; Ops: [`ops/projects/claimflow`](../../ops/projects/claimflow/README.md); not GitNexus indexed | Ops README; local research scaffold | Opus 5 may advise on research framing; Codex owns edits. |
| Cosmic Guardian | `space-shooter`, `cosmic-guardian`, `太空射击` | L0/L1 local product; no live infra | Code: `projects/products/space-shooter`; Ops: [`ops/projects/space-shooter`](../../ops/projects/space-shooter/README.md); not GitNexus indexed | Ops README; local Canvas game | Opus 5 may advise on game feel and visual polish; Codex authors the artifact. |
| Hotel Management System | `hotel-mgmt`, `酒店管理系统` | L0/L1 local product; no live infra | Code: `projects/products/hotel-mgmt`; Ops: [`ops/projects/hotel-mgmt`](../../ops/projects/hotel-mgmt/README.md); GitNexus indexed | Ops README, code repo, sibling symlink context in [`project-surfaces.md`](./project-surfaces.md) | Opus 5 may review Java/data flow or UI/report quality; Codex makes all changes. |
| IELTS Vocab Hub | `ielts-vocab-hub`, `ielts-vocab`, `vocab-atelier`, `雅思查词助手`, `vocab.nodezjc12348888.xyz` | L0/L1 for local docs/code; L2 read-only for the public vocab host and LaunchAgents; L3 repair requires `进入修复阶段` | Code: `projects/products/ielts-vocab-hub`; Ops: [`ops/projects/ielts-vocab-hub`](../../ops/projects/ielts-vocab-hub/README.md); GitNexus indexed | [`DEPLOYMENT_LEDGER.md`](../../ops/projects/ielts-vocab-hub/DEPLOYMENT_LEDGER.md); compatibility symlink from `antigravity-workspace/projects/ielts-vocab-hub` | Opus 5 may review lookup UX, dictionary fallback, or note-taking flows; live host/LaunchAgent evidence stays bounded and redacted. |
| Love Letter Site | `love-letter-site` | L0/L1 local product; no live infra | Code: `projects/products/love-letter-site`; Ops: [`ops/projects/love-letter-site`](../../ops/projects/love-letter-site/README.md) | Ops README; local assets/output; not GitNexus indexed | Opus 5 may advise on copy, interaction, emotional tone, and visual polish; Codex authors the artifact. |
| MathorCup-D | `mathorcup-d`, `mathorcup_D`, `MathorCup_D_repo`, `mathorcup` | L0/L1 local research; no live infra | Code: `projects/products/MathorCup_D_repo`, `projects/research/mathorcup_D`; Ops: [`ops/projects/mathorcup-d`](../../ops/projects/mathorcup-d/README.md) | Submission repo indexed; research workspace not targeted; scratch archive under `archive/cleanup/2026-05-11-scratch-retention/` | Opus 5 may advise on explanation, paper polish, result sanity, and reproducibility; Codex owns edits and checks. |
| Minesweeper Pro | `minesweeper`, `扫雷`, `minesweeper-pro` | L0/L1 local product; no live infra | Code: `projects/products/minesweeper`; Ops: [`ops/projects/minesweeper`](../../ops/projects/minesweeper/README.md); not GitNexus indexed | Ops README; local web game | Opus 5 may advise on interaction and visual polish; Codex authors the artifact. |
| Neon Survivors 2088 | `neon-survivors`, `霓虹幸存者`, `neon-survivors-2088` | L0/L1 local product; no live infra | Code: `projects/products/neon-survivors`; Ops: [`ops/projects/neon-survivors`](../../ops/projects/neon-survivors/README.md); not GitNexus indexed | Ops README; local Canvas roguelite | Opus 5 may advise on combat feel and visual polish; Codex authors the artifact. |
| NAS Platform | `nas-platform`, `oc-nas` | L2 read-only for NAS/live status; L3 config/service changes require `进入修复阶段` | Config root: `projects/infrastructure/nas-platform`; Ops: [`ops/projects/nas-platform`](../../ops/projects/nas-platform/README.md) | [`nas-wg-ssh-access.md`](../../ops/projects/nas-platform/runbooks/nas-wg-ssh-access.md); local path is not standalone git | Opus 5 may synthesize bounded read-only evidence; Codex gathers evidence and makes the final judgment. |
| OpenClaw | `openclaw`, `open claw`, `笨笨`, `benben`, `adminAI`, `oc-nas` | L2 read-only for live/production/NAS; L3 repair requires `进入修复阶段` | Code: `projects/products/openclaw/nas-openclaw-v22`; migration: `projects/migrations/openclaw-mac-migration`; Ops: [`ops/projects/openclaw`](../../ops/projects/openclaw/README.md) | [`DEPLOYMENT_LEDGER.md`](../../ops/projects/openclaw/DEPLOYMENT_LEDGER.md); [`ARCHITECTURE_TODO.md`](../../ops/projects/openclaw/ARCHITECTURE_TODO.md); [`sre-troubleshooting-runbook.md`](../../ops/projects/openclaw/runbooks/sre-troubleshooting-runbook.md); [`upgrade-impact-assessment.md`](../../ops/projects/openclaw/runbooks/upgrade-impact-assessment.md); manifests/reports | Opus 5 may provide bounded read-only architecture/root-cause review; Codex verifies and owns any later authorized repair. |
| Paper 001 Research Workbench | `paper-001`, `paper001`, `论文工作台`, `TabFact`, `可验证执行` | L0/L1 local research; no live infra | Code: `projects/research/paper-001`; Ops: [`ops/projects/paper-001`](../../ops/projects/paper-001/README.md); not GitNexus indexed | Project README, `PROJECT.md`, `CLAIMS.md`, `DECISIONS.md`, `REPRODUCIBILITY.md`, paper/experiment/result surfaces | Opus 5 may advise on research framing, evidence consistency, writing, and code/test review; Codex owns edits and verification. |
| Personal AI Companion | `personal-ai-companion`, `stackchan-ai`, `stackchan-companion`, `ai-companion`, `xiaoxin`, `小芯`, `StackChan`, `memory-service`, `长期记忆`, `个人AI伴侣`, `桌面AI伴侣`, `xiaoxin.nodezjc12348888.xyz`, `auth.nodezjc12348888.xyz` | L0/L1 for local docs/code; L2 read-only for Xiaoxin live/NAS/VPS/auth status; L3 repair requires `进入修复阶段` | Code: `projects/products/personal-ai-companion`; Ops: [`ops/projects/personal-ai-companion`](../../ops/projects/personal-ai-companion/README.md) | [`product-cloud-current-status-20260713.md`](../../ops/projects/personal-ai-companion/reports/product-cloud-current-status-20260713.md); [`health-owner-summary-contract-v0.1.md`](../../ops/projects/personal-ai-companion/manifests/health-owner-summary-contract-v0.1.md); [`health-owner-summary-contract-v0.1-acceptance-20260715.md`](../../ops/projects/personal-ai-companion/reports/health-owner-summary-contract-v0.1-acceptance-20260715.md); [`DEPLOYMENT_LEDGER.md`](../../ops/projects/personal-ai-companion/DEPLOYMENT_LEDGER.md); GitNexus indexed | Opus 5 may advise on memory architecture, privacy, auth/code review, device design, and companion UX; Codex implements and verifies. |
| Pet Clinic Management System | `pet-clinic`, `宠物诊所管理系统`, `niit`, `192.168.151.133` | L0/L1 for local product work; L2 read-only for the NIIT lab VM/HBase; L3 repair requires `进入修复阶段` | Code: `projects/products/pet-clinic`; Ops: [`ops/projects/pet-clinic`](../../ops/projects/pet-clinic/README.md); GitNexus indexed | Ops README, code repo, sibling symlink context in [`project-surfaces.md`](./project-surfaces.md) | As of 2026-07-02, the assignment is submitted; do not prioritize local dirty-state cleanup unless asked. For live review, provide only bounded, redacted, read-only evidence; Codex owns conclusions and any later authorized repair. |
| Personal Portfolio | `personal-portfolio`, `portfolio`, `作品集`, `个人主页` | L0/L1 local product; no live infra | Code: `projects/products/personal-portfolio`; Ops: [`ops/projects/personal-portfolio`](../../ops/projects/personal-portfolio/README.md); not GitNexus indexed | Ops README; local React/Vite site | Opus 5 may advise on copy and visual polish; Codex authors the artifact. |
| Proxy Nodes VPS | `proxy-nodes`, `代理节点`, `自建节点`, `Shadowrocket订阅`, `node.nodezjc12348888.xyz` | L2 read-only for live VPS/proxy status; L3 config/service changes require `进入修复阶段` | Ops-only: [`ops/projects/proxy-nodes`](../../ops/projects/proxy-nodes/README.md) | README has server access, risk gate, subscription security, rollout log, cross-refs | Opus 5 may review bounded routing/security evidence and plans; Codex owns conclusions and any authorized repair. |
| SLA-SQL Research | `sla-sql`, `sla-aware-sql` | L0/L1 local research; no live infra | Code: `projects/research/sla-sql`; Ops: [`ops/projects/sla-sql`](../../ops/projects/sla-sql/README.md); not GitNexus indexed | Local prototype, smoke test, bulky Spark results | Opus 5 may advise on experimental design; Codex owns edits and checks. |
| Sub2API | `sub2api`, `Sub2API`, `sub2`, `中转站`, `codex_gemini`, `codex_antigravity` | L2 read-only for live service; L3 service/database/config changes require `进入修复阶段` | Ops-only: [`ops/projects/sub2api`](../../ops/projects/sub2api/README.md) | [`DEPLOYMENT_LEDGER.md`](../../ops/projects/sub2api/DEPLOYMENT_LEDGER.md); [`oauth-account-routing-and-opencode.md`](../../ops/projects/sub2api/runbooks/oauth-account-routing-and-opencode.md) | Service operations only; Sub2API is disabled as a Codex advisor. Opus 5 may review bounded evidence, while service audit and repair still follow L2/L3 gates. |
| Telegram Dual Relay | `telegram-dual-relay` | L2 read-only for live relay; L3 service/config changes require `进入修复阶段` | Code: `projects/infrastructure/telegram-dual-relay`; Ops: [`ops/projects/telegram-dual-relay`](../../ops/projects/telegram-dual-relay/README.md); GitNexus indexed | Ops README; code repo; state under `state/project-data/telegram-dual-relay` | Opus 5 may review relay architecture, failure modes, or user-facing copy; Codex implements and verifies. |
| Tianchi Purchase Redemption | `tianchi-purchase-redemption`, `tianchi-231573`, `purchase-redemption`, `资金流入流出预测` | L0/L1 local research; no live infra | Code: `projects/research/tianchi-purchase-redemption`; Ops: [`ops/projects/tianchi-purchase-redemption`](../../ops/projects/tianchi-purchase-redemption/README.md) | Data policy, key commands, [`data-download.md`](../../ops/projects/tianchi-purchase-redemption/manifests/data-download.md); not GitNexus indexed | Opus 5 may advise on modeling assumptions, report polish, reproducibility, and leakage checks; Codex owns the work. |
| VPS Racknerd Box | `vps-racknerd`, `racknerd`, `home-vps-root`, `那台VPS`, `服务器VPS` | L2 read-only for live VPS; L3 host/network/service changes require `进入修复阶段` | Ops-only: [`ops/projects/vps-racknerd`](../../ops/projects/vps-racknerd/README.md) | Scope, machine basics, SSH/mgmt access, traffic-card/IP incident notes in README | Opus 5 may review bounded live evidence and rollback plans; Codex owns evidence gathering and decisions. |

## Sub2API Context Split

- **Sub2API-as-service**: live infra project. Use the Sub2API project row,
  keep audits L2 read-only, and require `进入修复阶段` for database, config,
  deploy, service, or runtime changes.
- **Sub2API-as-advisor (retired)**: this was a read-only reasoning/drafting/review aid.
  It is now disabled and must not be discovered,
  called, smoke-tested, or used as a fallback.

## Model Review Playbook

Use strong models when the answer quality is worth an independent pass. Keep
the evidence bounded and non-secret. For copy-ready evidence packet shapes, see
[`model-review-packets.md`](./model-review-packets.md).

| Situation | First Choice | Why | Required Boundary |
| --- | --- | --- | --- |
| Broad planning, writing, research framing, UX/copy polish | Codex, optionally Opus 5 read-only review | Independent synthesis without handing off authorship | Brief + file pointers + selected excerpts; no credentials. |
| Architecture review, subtle regression hunt, code review, shared contract risk | Claude Code Opus 5 read-only review | Deep implementation and risk reasoning | Exact scope, source of truth, constraints, acceptance criteria. |
| Live/NAS/VPS/OpenClaw/Sub2API evidence judgment | Opus 5 read-only bounded review | Independent second opinion lowers high-cost wrong conclusions | `source_of_truth` must be explicit; forbidden actions must ban writes/restarts/deploys. |
| Frontend/creative/public artifact | Codex authors, Opus 5 may review | Independent quality pass while Codex owns the artifact | Send screenshots/observations or small snippets, not whole repos. |
| Ordinary tiny fix or obvious local fact | Codex only | Extra model call adds noise | One focused read/edit/verify loop is enough. |

Upgrade any row above to Fable 5 only when the review is exceptionally
difficult, and record `review_tier: extreme`.

### Claude Code Advisor Template

Use this shape when asking Claude Code for advice:

```text
Task:
model: claude-opus-5
review_tier: standard
effort: max
Context:
Relevant files:
Confirmed evidence:
Constraints:
Forbidden:
Expected output:
```

Rules:

- Send summaries, paths, small snippets, and test output excerpts.
- Do not send API keys, OAuth tokens, cookies, raw private configs, full logs,
  or complete secret-bearing environment files.
- Treat output as advisory; Codex verifies locally and owns final acceptance.
- For live service topics, keep Claude evidence read-only; opening L3 authorizes
  Codex repair, not Claude implementation.

### Claude Review Template

Use Claude review for bounded independent audits:

```text
source_of_truth: repo_only | provided_evidence | ssh_live:<host>
mode: risk_review | arch_review | evidence_review | prod_audit | prod_deep_audit
scope_hint:
constraints:
forbidden_actions:
acceptance:
```

For `openclaw`, NAS, VPS, proxy nodes, Cloudflare, Telegram relay, or live
Sub2API service work, include explicit forbidden actions such as no writes, no
restarts, no config changes, no database changes, and no deploys.

If local Claude review is unavailable or unauthenticated, continue with Codex
alone and record that the optional advisory pass was skipped. Do not fall back
to Sub2API.

## Maintenance Checklist

- After registry-only project edits, run:
  `node docs/workspace/codex-register-project.mjs --regen`
- After routing, hygiene, or knowledge-map edits, run:
  `node --test docs/workspace/*.test.mjs`
- For a compact health summary, run:
  `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
- When adding a project, update the registry first, then ensure this map points
  to the new ops README, code root, runbooks, reports, and review strategy.
- When adding a durable decision, prefer
  [`workspace-decisions.md`](../decisions/workspace-decisions.md) for
  workspace-level facts and the project ops README for project-specific facts.
- Review this map whenever a project is added, archived, or changes infra
  exposure; otherwise do a light stale-check once per quarter.
