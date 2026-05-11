# CUMCM-2026-Workbench Ops Surface

Operator-facing surface for the CUMCM 2026 workbench research project.

## Routing Evidence

- Project name: `CUMCM-2026-Workbench`
- Aliases: `cumcm-2026-workbench`, `cumcm2026`, `cumcm-workbench`
- Code root: `projects/research/cumcm-2026-workbench`
- Ops surface: `ops/projects/cumcm-2026-workbench`
- Kind: `research`

## Stable Docs

- [Project README](../../../projects/research/cumcm-2026-workbench/README.md)
- [GitHub Resource Matrix](./reports/github-resource-matrix.md)
- [Contest Day Workflow](./runbooks/contest-day-workflow.md)

## Key Commands

```bash
python3 src/main.py fetch-template
python3 src/main.py init-case --case <slug>
python3 src/main.py smoke-test --case <slug>
python3 src/main.py build-paper --case <slug>
python3 src/main.py build-support --case <slug>
python3 src/main.py verify-submission --case <slug>
python3 src/main.py compile-paper --case <slug>
```
