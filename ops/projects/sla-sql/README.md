# SLA-SQL Research Ops Surface

This directory is the operator-facing surface for `sla-sql`.

## Routing Evidence

- Project name: `SLA-SQL Research`
- Aliases: `sla-aware-sql`
- Registry routing keywords: `sla-sql`, `SLA-SQL Research`, `sla-aware-sql`
- Main code: `projects/research/sla-sql`
- Ops surface: `ops/projects/sla-sql`
- State/data: `state/project-data/sla-sql`
- Scratch: `scratch/projects/sla-sql`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `research_local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered research surface for `sla-sql`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs sla-sql`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - From the research root: `python3 smoke_test_sla_sql.py`

- Next useful work: Keep routing facts synced with the registry; bulky Spark/TPC-H result files stay local and should not be committed.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

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
