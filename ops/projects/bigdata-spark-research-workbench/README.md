# BigData-Spark-Research-Workbench Ops Surface

Operator-facing surface for the BigData Spark Research workbench project.

## Routing Evidence

- Project name: `bigdata-spark-research-workbench`
- Aliases: `bigdata-spark-research`, `spark-research-workbench`
- Registry routing keywords: `bigdata-spark-research-workbench`, `spark-research-workbench`, `bigdata-spark-research`
- Code root: `projects/research/bigdata-spark-research-workbench`
- Ops surface: `ops/projects/bigdata-spark-research-workbench`
- Kind: `research`
- Registry risk profile: `research_local`
- GitNexus status: indexed
- Orientation: Hadoop/Spark course-project research (NOT CUMCM)
- Route evidence: user explicitly requested this project by name and provided implementation plan

## Ops Quality Baseline

- Current status: Registered research surface for `bigdata-spark-research-workbench`. Day-to-day work is local/research unless a future task introduces live infrastructure evidence.
- Risk gate: L0/L1 local docs/code/research work by default; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs bigdata-spark-research-workbench`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Project-specific commands belong in `## Key Commands` or project runbooks once confirmed.
- Next useful work: Keep routing facts synced with the registry; add project-specific commands or runbooks when they become confirmed; promote durable conclusions out of scratch/session notes.
- Model review guidance: Use Sub2API/Claude review for architecture, code review, writing, research, or UX polish when the task is non-tiny. Use [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for packet shape.

## Stable Docs

- [Project README](../../../projects/research/bigdata-spark-research-workbench/README.md)
- [Course Project Workflow](./runbooks/course-project-workflow.md)
- [Project Outline Mapping](./reports/project-outline-mapping.md)

## Key Commands

```bash
python3 src/main.py init-topic --topic <slug>
python3 src/main.py verify-env
python3 src/main.py smoke-test --topic <slug>
python3 src/main.py build-support --topic <slug>
python3 src/main.py build-report --topic <slug>
python3 src/main.py build-defense --topic <slug>
python3 src/main.py compile-report --topic <slug>
python3 src/main.py package-project --topic <slug>
python3 src/main.py verify-project --topic <slug>
```

## Differentiators from CUMCM Workbench

- No anonymity rules (students can include names/affiliations)
- No page limit enforcement
- No commitment/numbering page restrictions
- Literature minimum is 10 non-empty records
- Requires Spark experiment code and smoke test results
- Defense materials are Markdown-based (no PPTX required)
- `ai_used` scope is auxiliary-only with team decision ownership
