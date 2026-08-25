# IELTS Vocab Hub Ops Surface

This directory is the operator-facing surface for `ielts-vocab-hub`.

## Routing Evidence

- Project name: `IELTS Vocab Hub`
- Aliases: `ielts-vocab`, `ielts-dictionary`, `vocab-atelier`, `vocabatelier`, `雅思查词助手`
- Registry routing keywords: `Vocab Atelier`, `雅思查词`, `vocab.nodezjc12348888.xyz`, `ielts-vocab-hub`, `IELTS Vocab Hub`, `ielts-vocab`, `ielts-dictionary`, `vocab-atelier`, `vocabatelier`, `雅思查词助手`
- Main code: `projects/products/ielts-vocab-hub`
- Ops surface: `ops/projects/ielts-vocab-hub`
- State/data: `state/project-data/ielts-vocab-hub`
- Scratch: `scratch/projects/ielts-vocab-hub`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `vocab.nodezjc12348888.xyz`
- Service names: `com.vocabatelier.public`, `com.vocabatelier.local-api`, `com.vocabatelier.local-page`, `com.vocabatelier.tunnel`, `com.vocabatelier.vps-reverse`
- Registry risk profile: `live_product`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered live product surface for `ielts-vocab-hub`. Canonical code now lives at `projects/products/ielts-vocab-hub`. The previous Antigravity path is a local symlink only. Treat this README as routing and durable context, not proof of current live health.
- Risk gate: L0/L1 for local docs/code/tests. L2 read-only for `vocab.nodezjc12348888.xyz`, LaunchAgents, Authentik, Nginx, or visitor data. L3 state-changing repair requires the explicit phrase `进入修复阶段`.
- Common commands:
  - `node docs/workspace/find-project.mjs ielts-vocab-hub`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - From the product root: `python3 -m unittest discover -s tests -p 'test_*.py'`
  - Local private app: `./start.sh` or `./start-private.sh`
- Next useful work: Keep routing facts synced with the registry; add runbooks for LaunchAgent path cutover only after an L3 gate; promote durable conclusions out of scratch/session notes.
- Model review guidance: Use a bounded review for local code/UX. For the public host or LaunchAgents, provide only bounded, redacted, read-only evidence. Never send API keys, visitor cookies, Authentik allowlists, or tunnel tokens. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Canonical Code And Compatibility Paths

- Codex code window: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/ielts-vocab-hub`
- Independent product git: `https://github.com/zjc2944678910-max/ielts-vocab-hub`
- Compatibility symlink: `/Users/zhangjincheng/Documents/GitHub/antigravity-workspace/projects/ielts-vocab-hub`
- Live LaunchAgents still name the Antigravity path; that path now resolves through the symlink. Changing those plists is an L3 runtime change.

## Key Commands

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/ielts-vocab-hub
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/performance-ui.test.js
node tests/markdown.test.js
./start.sh
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
