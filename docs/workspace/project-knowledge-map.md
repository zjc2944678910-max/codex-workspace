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
| BigData-Spark-Research-Workbench | `bigdata-spark-research-workbench`, `spark-research-workbench` | L0/L1 local research; no live infra | Code: `projects/research/bigdata-spark-research-workbench`; Ops: [`ops/projects/bigdata-spark-research-workbench`](../../ops/projects/bigdata-spark-research-workbench/README.md) | [`course-project-workflow.md`](../../ops/projects/bigdata-spark-research-workbench/runbooks/course-project-workflow.md); reports under `ops/projects/bigdata-spark-research-workbench/reports/`; GitNexus indexed | Sub2API for literature framing, paper structure, Spark analysis plans; Claude review for code/test review before submission. |
| Cloudflare Edge / DNS | `cloudflare-edge`, `cloudflare`, `CF`, `橙云`, `nodezjc12348888.xyz` | L2 read-only for live DNS/edge facts; L3 changes require `进入修复阶段` | Ops-only: [`ops/projects/cloudflare-edge`](../../ops/projects/cloudflare-edge/README.md) | Domain, subdomain, Origin Rule, cert, DDNS, CF credential state notes in README | Sub2API/Claude only on redacted summaries; never send tokens. Use Claude review for high-risk edge routing plans before any L3. |
| CUMCM-2026-Workbench | `cumcm-2026-workbench`, `cumcm2026`, `cumcm-workbench` | L0/L1 local research; no live infra | Code: `projects/research/cumcm-2026-workbench`; Ops: [`ops/projects/cumcm-2026-workbench`](../../ops/projects/cumcm-2026-workbench/README.md) | [`contest-day-workflow.md`](../../ops/projects/cumcm-2026-workbench/runbooks/contest-day-workflow.md); [`github-resource-matrix.md`](../../ops/projects/cumcm-2026-workbench/reports/github-resource-matrix.md); GitNexus indexed | Sub2API for contest strategy, modeling alternatives, writing polish; Claude review for final solution/code risk review. |
| Hotel Management System | `hotel-mgmt`, `酒店管理系统` | L0/L1 local product; no live infra | Code: `projects/products/hotel-mgmt`; Ops: [`ops/projects/hotel-mgmt`](../../ops/projects/hotel-mgmt/README.md); GitNexus indexed | Ops README, code repo, sibling symlink context in [`project-surfaces.md`](./project-surfaces.md) | Claude review for Java/data-flow code review; Sub2API for UI/report polish. |
| Love Letter Site | `love-letter-site` | L0/L1 local product; no live infra | Code: `projects/products/love-letter-site`; Ops: [`ops/projects/love-letter-site`](../../ops/projects/love-letter-site/README.md) | Ops README; local assets/output; not GitNexus indexed | Use Sub2API/Gemini for copy, interaction, emotional tone, and visual polish before sharing. |
| MathorCup-D | `mathorcup-d`, `mathorcup_D`, `MathorCup_D_repo`, `mathorcup` | L0/L1 local research; no live infra | Code: `projects/products/MathorCup_D_repo`, `projects/research/mathorcup_D`; Ops: [`ops/projects/mathorcup-d`](../../ops/projects/mathorcup-d/README.md) | Submission repo indexed; research workspace not targeted; scratch archive under `archive/cleanup/2026-05-11-scratch-retention/` | Sub2API for solution explanation, paper polishing, and result sanity checks; Claude review for reproducibility/code audit. |
| NAS Platform | `nas-platform`, `oc-nas` | L2 read-only for NAS/live status; L3 config/service changes require `进入修复阶段` | Config root: `projects/infrastructure/nas-platform`; Ops: [`ops/projects/nas-platform`](../../ops/projects/nas-platform/README.md) | [`nas-wg-ssh-access.md`](../../ops/projects/nas-platform/runbooks/nas-wg-ssh-access.md); local path is not standalone git | Claude review is valuable for read-only live evidence synthesis; Sub2API only with redacted summaries. |
| OpenClaw | `openclaw`, `open claw`, `笨笨`, `benben`, `adminAI`, `oc-nas` | L2 read-only for live/production/NAS; L3 repair requires `进入修复阶段` | Code: `projects/products/openclaw/nas-openclaw-v22`; migration: `projects/migrations/openclaw-mac-migration`; Ops: [`ops/projects/openclaw`](../../ops/projects/openclaw/README.md) | [`DEPLOYMENT_LEDGER.md`](../../ops/projects/openclaw/DEPLOYMENT_LEDGER.md); [`ARCHITECTURE_TODO.md`](../../ops/projects/openclaw/ARCHITECTURE_TODO.md); [`sre-troubleshooting-runbook.md`](../../ops/projects/openclaw/runbooks/sre-troubleshooting-runbook.md); [`upgrade-impact-assessment.md`](../../ops/projects/openclaw/runbooks/upgrade-impact-assessment.md); manifests/reports | Prefer Claude review for bounded read-only architecture/root-cause reviews. Use Sub2API only on selected non-secret snippets or summaries. |
| Pet Clinic Management System | `pet-clinic`, `宠物诊所管理系统` | L0/L1 local product; no live infra | Code: `projects/products/pet-clinic`; Ops: [`ops/projects/pet-clinic`](../../ops/projects/pet-clinic/README.md); GitNexus indexed | Ops README, code repo, sibling symlink context in [`project-surfaces.md`](./project-surfaces.md) | As of 2026-07-02, user says the assignment is submitted; do not prioritize local dirty-state cleanup unless asked. Claude review can still help if future code review is requested. |
| Proxy Nodes VPS | `proxy-nodes`, `代理节点`, `自建节点`, `Shadowrocket订阅`, `node.nodezjc12348888.xyz` | L2 read-only for live VPS/proxy status; L3 config/service changes require `进入修复阶段` | Ops-only: [`ops/projects/proxy-nodes`](../../ops/projects/proxy-nodes/README.md) | README has server access, risk gate, subscription security, rollout log, cross-refs | Claude review for live routing/security plan reviews; Sub2API only with redacted topology summaries. |
| Sub2API | `sub2api`, `Sub2API`, `sub2`, `中转站`, `codex_gemini`, `codex_antigravity` | L2 read-only for live service; L3 service/database/config changes require `进入修复阶段` | Ops-only: [`ops/projects/sub2api`](../../ops/projects/sub2api/README.md) | [`DEPLOYMENT_LEDGER.md`](../../ops/projects/sub2api/DEPLOYMENT_LEDGER.md); [`oauth-account-routing-and-opencode.md`](../../ops/projects/sub2api/runbooks/oauth-account-routing-and-opencode.md) | Distinguish service audit from model-pool use. Using Sub2API MCP as an advisor is read-only; auditing or repairing the service follows L2/L3 gates. |
| Telegram Dual Relay | `telegram-dual-relay` | L2 read-only for live relay; L3 service/config changes require `进入修复阶段` | Code: `projects/infrastructure/telegram-dual-relay`; Ops: [`ops/projects/telegram-dual-relay`](../../ops/projects/telegram-dual-relay/README.md); GitNexus indexed | Ops README; code repo; state under `state/project-data/telegram-dual-relay` | Claude review for relay architecture and failure-mode reviews; Sub2API for message-flow docs and user-facing copy. |
| Tianchi Purchase Redemption | `tianchi-purchase-redemption`, `tianchi-231573`, `purchase-redemption`, `资金流入流出预测` | L0/L1 local research; no live infra | Code: `projects/research/tianchi-purchase-redemption`; Ops: [`ops/projects/tianchi-purchase-redemption`](../../ops/projects/tianchi-purchase-redemption/README.md) | Data policy, key commands, [`data-download.md`](../../ops/projects/tianchi-purchase-redemption/manifests/data-download.md); not GitNexus indexed | Sub2API for modeling assumptions and report polish; Claude review for reproducibility and leakage checks. |
| VPS Racknerd Box | `vps-racknerd`, `racknerd`, `home-vps-root`, `那台VPS`, `服务器VPS` | L2 read-only for live VPS; L3 host/network/service changes require `进入修复阶段` | Ops-only: [`ops/projects/vps-racknerd`](../../ops/projects/vps-racknerd/README.md) | Scope, machine basics, SSH/mgmt access, traffic-card/IP incident notes in README | Claude review for high-risk live evidence and rollback plans; Sub2API only with redacted non-secret summaries. |

## Sub2API Context Split

- **Sub2API-as-service**: live infra project. Use the Sub2API project row,
  keep audits L2 read-only, and require `进入修复阶段` for database, config,
  deploy, service, or runtime changes.
- **Sub2API-as-advisor**: external model pool accessed through MCP. This is a
  read-only reasoning/drafting/review aid, governed by the templates below and
  the no-secrets rule.

## Model Review Playbook

Use strong models when the answer quality is worth an independent pass. Keep
the evidence bounded and non-secret.

| Situation | First Choice | Why | Required Boundary |
| --- | --- | --- | --- |
| Broad planning, writing, research framing, UX/copy polish | Sub2API with Gemini strong profile | Wide synthesis and polish | Brief + file pointers + selected excerpts; no credentials. |
| Architecture review, subtle regression hunt, code review, shared contract risk | Sub2API with Claude Opus Thinking or local Claude review | Deep implementation and risk reasoning | Exact scope, source of truth, constraints, acceptance criteria. |
| Live/NAS/VPS/OpenClaw/Sub2API evidence judgment | Claude review, read-only, bounded | Independent second opinion lowers high-cost wrong conclusions | `source_of_truth` must be explicit; forbidden actions must ban writes/restarts/deploys. |
| Frontend/creative/public artifact | Sub2API staged: concept -> review -> polish | Quality improves across passes | Send screenshots/observations or small snippets, not whole repos. |
| Ordinary tiny fix or obvious local fact | Codex only | Extra model call adds noise | One focused read/edit/verify loop is enough. |

### Sub2API Advisor Template

Use this shape when asking the model pool for advice:

```text
Task:
model_preference:
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
- For live service topics, keep Sub2API/Claude evidence read-only unless the
  user explicitly opens L3 repair.

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

If local Claude review is unavailable, use the Sub2API Claude Opus route with
the same template and record `fallback: sub2api`.

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
