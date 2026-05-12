# Project Outline Mapping

Mapping from the course project PDF outline (项目大纲) to workbench
directories and CLI commands.

## Outline Sections → Workbench Directories

| PDF Outline Section | Workbench Directory/File | CLI Command |
|---|---|---|
| 选题 (Topic Selection) | `topics/<slug>/topic.yaml` | `init-topic --topic <slug>` |
| 文献调研 (Literature Research) | `topics/<slug>/literature/literature_matrix.csv` | Manual entry |
| 文献综述 (Literature Review) | `topics/<slug>/report/sections/literature-review.md` | Manual writing |
| 研究背景 (Background) | `topics/<slug>/report/sections/background.md` | Manual writing |
| 实验环境 (Environment) | `topics/<slug>/report/sections/data-environment.md` | `verify-env` for checks |
| 数据集 (Dataset) | `topics/<slug>/data/raw/`, `data/processed/` | Manual collection |
| 方法设计 (Method Design) | `topics/<slug>/report/sections/method-design.md` | Manual writing |
| Spark 实现 (Spark Implementation) | `topics/<slug>/experiments/code/` | `smoke-test --topic <slug>` |
| 实验结果 (Results) | `topics/<slug>/results/tables/`, `results/metrics/`, `results/figures/` | Manual generation |
| 结果分析 (Analysis) | `topics/<slug>/report/sections/results-analysis.md` | Manual writing |
| 局限性 (Limitations) | `topics/<slug>/report/sections/limitations.md` | Manual writing |
| 结论 (Conclusion) | `topics/<slug>/report/sections/conclusion.md` | Manual writing |
| 参考文献 (References) | `topics/<slug>/report/sections/references.md` | Manual writing |
| 摘要 (Abstract) | `topics/<slug>/report/sections/abstract.md` | Manual writing |

## Outline Deliverables → Workbench Commands

| Deliverable | Command |
|---|---|
| 课程报告 (Course Report PDF) | `build-report` → `compile-report` |
| 支撑材料 (Support Materials) | `build-support` |
| 答辩材料 (Defense Materials) | `build-defense` |
| 最终打包 (Final Package) | `package-project --topic <slug>` |
| 质量验证 (Quality Check) | `verify-project --topic <slug>` |

## Workflow Mapping

| PDF Phase | Weeks | Workbench Commands |
|---|---|---|
| 选题与文献调研 | 1-2 | `init-topic`, manual literature entry |
| 开题报告 | 3 | Manual writing of introduction sections |
| 实验与分析 | 4 | `smoke-test`, manual experiment code and results |
| 论文撰写 | 5 | `build-report`, `build-support`, `build-defense` |
| 提交与答辩 | 6 | `compile-report`, `package-project`, `verify-project` |

## Notes

- The PDF outline is oriented toward Hadoop/Spark course projects
- All report sections are in Chinese (zh-CN) by default
- The workbench does not enforce CUMCM-specific rules (anonymity, page limits, etc.)
- Literature minimum is 10 non-empty records (matches typical course requirements)
- Defense materials are Markdown-based; no PPTX generation required
