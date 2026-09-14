# Code Representation Caching Research Workbench Ops Surface

This directory is the operator-facing surface for `code-representation-caching`.

## Routing Evidence

- Project name: `Code Representation Caching Research Workbench`
- Aliases: `cache representation paper`, `code-as-image caching`, `代码表示缓存论文`
- Registry routing keywords: `code-as-image`, `prompt caching`, `incremental code edits`, `cache reuse`, `code-representation-caching`, `Code Representation Caching Research Workbench`, `cache representation paper`, `code-as-image caching`, `代码表示缓存论文`
- Main code: `projects/research/code-representation-caching`
- Ops surface: `ops/projects/code-representation-caching`
- State/data: `state/project-data/code-representation-caching`
- Scratch: `scratch/projects/code-representation-caching`
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

- Current status: Registered local research workbench for the mechanism-pilot
  stage. Registration and a passing dry-run do not validate provider cache
  behavior or a paper contribution.
- Risk gate: Use L0/L1 for local research code and documentation; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs code-representation-caching`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Run project-specific checks from
    `projects/research/code-representation-caching`.
- Next useful work: Reverify the provider API contract and primary literature
  before authorizing the six-request paid preflight.
- Model review guidance: Use
  [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for
  bounded research, protocol, or code review. Never send credentials, private
  configuration, or unbounded raw experiment output.

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
