# Paper 001 Research Workbench Ops Surface

This directory is the operator-facing surface for `paper-001`.

## Routing Evidence

- Project name: `Paper 001 Research Workbench`
- Aliases: `paper-001`, `paper001`, `论文工作台`
- Registry routing keywords: `paper-001`, `paper001`, `论文工作台`, `TabFact`, `可验证执行`, `Paper 001 Research Workbench`
- Main code: `projects/research/paper-001`
- Ops surface: `ops/projects/paper-001`
- State/data: `state/project-data/paper-001`
- Scratch: `scratch/projects/paper-001`
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

- Current status: Registered local research workbench for `paper-001`. The repository contains an active paper draft, reproducibility material, experiments, and local uncommitted research work. Registration records routing only; it does not accept or commit the current project worktree.
- Risk gate: L0/L1 local research by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs paper-001`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project validation commands remain in the project README and must run from `projects/research/paper-001`.
- Next useful work: Review and checkpoint the current research changes inside the `paper-001` repository as a separate project task; keep claims, paper text, tests, and result artifacts synchronized.
- Model review guidance: Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for bounded architecture, research, writing, or code review. Do not send private data, credentials, or unbounded experiment output.

## Stable Docs

- [Project README](../../../projects/research/paper-001/README.md)
- [Project constraints](../../../projects/research/paper-001/PROJECT.md)
- [Claims register](../../../projects/research/paper-001/CLAIMS.md)
- [Decision log](../../../projects/research/paper-001/DECISIONS.md)
- [Reproducibility guide](../../../projects/research/paper-001/REPRODUCIBILITY.md)
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
