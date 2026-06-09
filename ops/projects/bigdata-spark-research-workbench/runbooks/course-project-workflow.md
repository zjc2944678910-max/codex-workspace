# Course Project Workflow — 6-Week Cadence

This runbook describes the recommended 6-week workflow for a Hadoop/Spark
course research project using the bigdata-spark-research-workbench.

## Week 1: Topic Ideation

- Brainstorm research topics related to Hadoop/Spark
- Evaluate feasibility with available cluster resources
- Run `init-topic --topic <slug>` to scaffold the project
- Run `verify-env` to check for PySpark, Java, LaTeX availability
- Begin literature search

**Deliverable:** Initialized topic skeleton, initial keyword list

## Week 2: Literature Review (10 Papers)

- Collect and read at least 10 relevant papers
- Fill in `literature/literature_matrix.csv` with all required fields
- Write `report/sections/literature-review.md`
- Refine `report/sections/background.md`

**Deliverable:** Completed literature matrix, draft literature review section

## Week 3: Introduction & Data Collection

- Finalize `report/sections/abstract.md` (draft)
- Write `report/sections/background.md` in detail
- Collect or generate experiment data under `data/raw/`
- Document data sources in `data/raw/README.md`
- Design experiment methodology in `report/sections/method-design.md`
- Document environment in `report/sections/data-environment.md`

**Deliverable:** Completed introduction sections, data collected

## Week 4: Body — Spark Implementation & Data Analysis

- Implement Spark jobs under `experiments/code/`
- Write Spark job configuration under `experiments/config/`
- Run smoke test: `smoke-test --topic <slug>`
- Process data into `data/processed/`
- Generate result tables under `results/tables/`
- Generate figures under `results/figures/`
- Record metrics under `results/metrics/`
- Write `report/sections/spark-implementation.md`
- Write `report/sections/results-analysis.md`

**Deliverable:** Working Spark code, smoke test passing, initial results

## HW4 Checkpoint: Complete Project Draft

- Current requirement file: `作业/作业4/PHLCSYK-401007-A班-HW4-要求说明.docx`
- Current submitted file: `作业/作业4/PHLCSYK-401007-A班-G9-HW4.docx`
- Deadline: `2026-06-13 12:00` Beijing time
- Submit a Word-format complete project draft with title, author information,
  introduction, method, results and discussion, conclusion, and references
- Target length is about 1500 Chinese characters; groups ahead of schedule may
  write more
- Keep the submitted `.docx` under topic `support/homework/hw4/`; promote only
  intentionally revised prose, figures, tables, and results into report sources

## Week 5: Final Report & Defense Preparation

- Complete all report sections
- Write `report/sections/limitations.md` and `report/sections/conclusion.md`
- Write `report/sections/references.md`
- Fill in appendix (`report/appendix/`)
- Build support: `build-support --topic <slug>`
- Build report: `build-report --topic <slug>`
- Build defense: `build-defense --topic <slug>`
- Review and fill in `defense/slides.md` and `defense/defense_outline.md`
- If AI was used, fill in `support/ai/ai_usage.yaml`

**Deliverable:** Complete report draft, defense materials, support bundle

## Week 6: Revision & Finalization

- Compile report: `compile-report --topic <slug>`
- Review compiled PDF for accuracy and completeness
- Package project: `package-project --topic <slug>`
- Verify project: `verify-project --topic <slug>`
- Fix any verification failures
- Final submission

**Deliverable:** Compiled PDF, packaged dist, passing verification

## Key Milestones

| Week | Milestone | Verification |
|---|---|---|
| 1 | Topic initialized | `init-topic` + `verify-env` |
| 2 | Literature complete | 10+ rows in CSV |
| 3 | Introduction drafted | abstract + background + data-environment |
| 4 | Results generated | `smoke-test` passes, tables/metrics present |
| 5 | Report complete | `build-report` + `build-support` + `build-defense` |
| 6 | Final submission | `compile-report` + `package-project` + `verify-project` |
