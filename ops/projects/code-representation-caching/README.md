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

- Current status: Registered local research workbench with a completed bounded
  pilot. Threshold-controlled replication established reliable, nearly
  identical Text/Image prefix-locality curves after corresponding cache
  boundaries became eligible. A compact 512-pixel Image representation then
  reduced cold prompt tokens, but failed the paired correctness/cost gate at
  independently calibrated `high` reasoning: Text scored 15/15 versus Image
  13/15, and Image cost more in all five pairs. The single predeclared terminal
  layout revision also failed: Text scored 15/15 versus Image 2/15; Image cold
  prompts were 78.56%–78.59% of paired Text and every cache check passed, but
  Image cost 12.51%–66.78% more in all five pairs. Per the frozen stopping rule,
  compact-image layout tuning on GPT-5.6 Luna under this deterministic task is
  closed as a bounded negative result. This rejects the current positive
  hypothesis for this branch; it is not a universal or publishable negative
  claim across models and realistic coding tasks.
- Risk gate: Use L0/L1 for local research code and documentation; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs code-representation-caching`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Run project-specific checks from
    `projects/research/code-representation-caching`.
- Last verification: frozen runner commit `2274650` completed terminal run
  `20260914T124453Z` with 30/30 requests and no request errors for `$0.02592243`.
  The automatic decision was `FAIL`; cache, model/provider, response-cache,
  token, cost, correctness, and account-delta checks were reconciled. The
  project passed 37 unit tests and Python syntax checks. Evidence hashes are in
  `projects/research/code-representation-caching/docs/readability-optimized-confirmation-results-2026-09-14.md`.
- Next useful work: Keep this branch closed. Continue only by preregistering a
  new question, such as public-benchmark replication of the negative
  correctness/cost trade-off or a cross-model study. Do not create another
  layout variant for this model/task or relabel input compression as total-cost
  success.
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
