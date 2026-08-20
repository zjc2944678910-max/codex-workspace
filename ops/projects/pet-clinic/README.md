# Pet Clinic Management System Ops Surface

This directory is the operator-facing surface for `pet-clinic`.

## Routing Evidence

- Project name: `Pet Clinic Management System`
- Aliases: `pet-clinic`, `宠物诊所管理系统`, `宠物诊所`
- Registry routing keywords: `pet-clinic`, `Pet Clinic Management System`, `宠物诊所管理系统`, `宠物诊所`, `niit`, `192.168.151.133`
- Main code: `projects/products/pet-clinic`
- Ops surface: `ops/projects/pet-clinic`
- State/data: `state/project-data/pet-clinic`
- Scratch: `scratch/projects/pet-clinic`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: `niit`, `192.168.151.133`
- Service names: -
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

- Current status: Registered product surface for `pet-clinic`. Local Tomcat/CSV work stays L0/L1. The NIIT lab VM `niit` (`192.168.151.133`) is a live HBase/Hadoop host. This registration is routing metadata, not proof of current live health.
- Risk gate: L2 read-only by default when the task names `niit`, HBase, or the lab VM; L3 needs `进入修复阶段`. Pure local code/docs without the VM stay L0/L1.
- Common commands:
  - `node docs/workspace/find-project.mjs pet-clinic`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; add project-specific commands or runbooks when they become confirmed; promote durable conclusions out of scratch/session notes.
- Model review guidance: Local architecture, code review, writing, research, or UX polish may use a bounded review. For the NIIT VM or HBase, provide only bounded, redacted, read-only evidence. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

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
