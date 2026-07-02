# CUMCM-2026-Workbench Ops Surface

Operator-facing surface for the CUMCM 2026 workbench research project.

## Routing Evidence

- Project name: `CUMCM-2026-Workbench`
- Aliases: `cumcm-2026-workbench`, `cumcm2026`, `cumcm-workbench`
- Registry routing keywords: `cumcm-2026-workbench`, `cumcm2026`, `cumcm-workbench`
- Code root: `projects/research/cumcm-2026-workbench`
- Ops surface: `ops/projects/cumcm-2026-workbench`
- Kind: `research`
- Registry risk profile: `research_local`
- GitNexus status: indexed

## Ops Quality Baseline

- Current status: Registered research surface for `cumcm-2026-workbench`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs cumcm-2026-workbench`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; add project-specific commands or runbooks when they become confirmed; promote durable conclusions out of scratch/session notes.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Stable Docs

- [Project README](../../../projects/research/cumcm-2026-workbench/README.md)
- [GitHub Resource Matrix](./reports/github-resource-matrix.md)
- [Contest Day Workflow](./runbooks/contest-day-workflow.md)

## Key Commands

```bash
python3 src/main.py fetch-template
python3 src/main.py init-case --case <slug>
python3 src/main.py smoke-test --case <slug>
python3 src/main.py build-support --case <slug>
python3 src/main.py build-paper --case <slug>
python3 src/main.py compile-paper --case <slug>
python3 src/main.py package-submission --case <slug>
python3 src/main.py verify-submission --case <slug>
```
