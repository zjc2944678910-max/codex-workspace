# Workspace Decisions

Durable workspace-level decisions that should survive beyond one session.
Project-specific facts belong in `ops/projects/<slug>/README.md`; long-task
slice decisions belong in that run's `05-decisions.md`.

## 2026-06-17

- **Decision**: Keep `codex-workspace` as a project-neutral workspace index and
  expose a short root `PROJECTS.md` generated from
  `docs/workspace/project-registry.json`.
- **Rationale**: Codex sessions need a fast human-readable project map without
  treating any registered project as the default work target.
- **Affects**: project routing, onboarding, workspace health, and daily session
  startup.
- **Risk**: `PROJECTS.md` can drift if edited by hand; regenerate it with
  `node docs/workspace/codex-register-project.mjs --regen`.

- **Decision**: Use `DAILY.md` only as a short-lived buffer.
- **Rationale**: Daily notes make handoff and resume easier, but stable facts
  should remain in project ops READMEs or this decision log.
- **Affects**: session closeout, memory hygiene, and workspace summaries.
- **Risk**: Old daily notes can become stale if facts are not promoted.

## 2026-06-22

- **Decision (Plan A — single owner for shared ops)**: `codex-workspace` is
  the **canonical owner** of the shared `openclaw` / `sub2api` ops docs.
  `claude-workspace` now holds **thin pointer READMEs only** for these two.
- **Rationale**: manual two-way sync caused recurring drift; single owner
  removes it by construction. claude-unique knowledge (sub2api topology;
  openclaw watchdog/traffic-card/edge-node narrative) was promoted into the
  codex copies before the claude side was reduced to pointers.
- **How to apply**: edit openclaw/sub2api ops **here** (codex). Keep registry
  routing tokens mirrored into each README (repo-hygiene.mjs still enforces).
- **Affects**: all future openclaw/sub2api ops edits; sibling cross-ref intact.

- **Decision (infra-layer vs app taxonomy, 2026-06-22)**: separate the
  shared **infrastructure layer** from the **applications** that ride on it,
  so cross-cutting facts get a single home instead of piling into one app doc.
  - **Layer** (ops-only): `vps-racknerd` (the racknerd box: IP/换IP/连通/SSH/
    nginx host), `cloudflare-edge` (CF account + `nodezjc12348888.xyz` zone:
    橙云/Origin Rule/edge cert/token/DDNS), `nas-platform` (the NAS box).
  - **App**: `openclaw` (gateway/笨笨 bot/edge watchdog), `proxy-nodes`
    (xray/sing-box nodes), `sub2api` (AI relay), `telegram-dual-relay`.
  - **Routing**: a fact about the box → vps-racknerd; CF/DNS → cloudflare-edge;
    a node → proxy-nodes; the bot/gateway → openclaw; the relay → sub2api.
    Cross-cutting incidents get a primary layer home + cross-refs from apps.
  - **Why**: openclaw had become a catch-all (proxy nodes, VPS IP, CF, DDNS all
    filed under it because they share the VPS + node. subdomain + openclaw-gateway
    nginx vhost). Layer/app split keeps each doc single-responsibility.
  - **Ledger note**: `openclaw/DEPLOYMENT_LEDGER.md` (7642 lines) was audited
    and is genuinely openclaw application history (models/bot/channels); it is
    NOT split. The one 2026-06-16 mixed entry keeps a cross-ref to the layer docs.

- **Decision (openclaw code symlink, 2026-06-22)**: claude-workspace exposes the
  openclaw code by symlinking `claude-workspace/projects/infrastructure/openclaw`
  → `codex-workspace/projects/products/openclaw` (relative link). One physical
  copy lives HERE (codex); claude only has the link. The link is **local +
  git-ignored + Syncthing-ignored** (not committed anywhere).
  - **Maintenance contract**: if you rename or move `projects/products/openclaw`
    in this repo, re-point the claude link so it does not dangle:
    `ln -sfn <new-relative-target> ~/Documents/GitHub/claude-workspace/projects/infrastructure/openclaw`
  - Other shared projects (sub2api/proxy-nodes/vps-racknerd/cloudflare-edge) are
    ops-only (no code), so no symlink applies.

- **Decision (project code consolidation, 2026-06-22)**: ALL project code lives
  ONCE in `codex-workspace/projects/`. Each project is its own git repo with its
  own GitHub remote (that remote is the backup — codex-workspace git ignores
  `projects/*`, and neither workspace is Syncthing-managed). claude-workspace gets
  **local, git-ignored relative symlinks** mirroring each codex project.
  - **Tool**: `docs/workspace/symlink-projects-to-claude.sh` (idempotent). Run it
    to (re)create all claude symlinks, and as the **repair tool** for dangling
    links after a project is renamed/moved here.
  - **New project default**: create/register the code in codex, then run the
    script to link it into claude. (openclaw maps to claude `infrastructure/openclaw`
    via the override in the script.)
  - **Migrated 2026-06-22**: `hotel-mgmt` + `pet-clinic` moved from claude (they
    had NO backup) into codex as new private repos
    `github.com/zjc2944678910-max/{hotel-mgmt,pet-clinic}`, then symlinked back.
  - **gitnexus**: indexes moved with the dirs; the claude registry path resolves
    via symlink. Re-index at the codex path only if gitnexus misbehaves.
