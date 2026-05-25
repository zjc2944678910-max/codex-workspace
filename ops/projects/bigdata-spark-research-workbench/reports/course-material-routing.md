# Course Material Routing

This note maps the local course-material folder to the
`bigdata-spark-research-workbench` project surfaces. It is a routing guide only;
do not physically merge the desktop course folder into the workbench root.

## Source Folder

```text
/Users/zhangjincheng/Desktop/PHLCSYK-401007A 数据科学课
```

## Target Project

```text
/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/research/bigdata-spark-research-workbench
```

## Recommended Mapping

| Source item | Kind | Recommended target | Treatment |
| --- | --- | --- | --- |
| `项目大纲.pdf` | Course requirement | `ops/projects/bigdata-spark-research-workbench/reports/` or topic `support/course-requirements/` | Keep as authoritative requirement reference. Summarize into ops docs when useful. |
| `5.16-PHLCSYK-401007A时间表.pdf` | Schedule | topic `support/course-requirements/` | Keep as schedule reference; do not include in final report body unless required. |
| `18点PHLCSYK-401007论文阶段注意事项介绍.pptx` | Writing / submission guidance | topic `support/course-requirements/` | Keep as support guidance; extract actionable report rules into runbook if needed. |
| `大数据基础_Lecture1_四部分完整讲解.docx` | Lecture notes | topic `support/lecture-notes/` or `report/appendix/lecture-notes/` | Use for background understanding; cite only if course rules allow lecture-note references. |
| `副教授ppt/0516-大数据-第1讲.pdf` | Lecture slide | topic `support/lecture-notes/副教授ppt/` | Keep as support material. |
| `副教授ppt/0516-大数据-第2讲.pdf` | Lecture slide | topic `support/lecture-notes/副教授ppt/` | Keep as support material. |
| `易教授课件0516/主导师课程1.pdf` | Lecture slide | topic `support/lecture-notes/易教授课件0516/` | Keep as support material. |
| `易教授课件0516/主导师课程2.pdf` | Lecture slide | topic `support/lecture-notes/易教授课件0516/` | Keep as support material. |
| `易教授课件0516/主导师课程3.pdf` | Lecture slide | topic `support/lecture-notes/易教授课件0516/` | Keep as support material. |
| `易教授课件0516/主导师课程4.pdf` | Lecture slide | topic `support/lecture-notes/易教授课件0516/` | Keep as support material. |
| `易教授课件0516/主导师课程5.pdf` | Lecture slide | topic `support/lecture-notes/易教授课件0516/` | Keep as support material. |
| `易教授课件0516/.~主导师课程1.pptx` | Office temp file | None | Ignore. Do not copy into workbench. |
| `例子/PHLCSZC-302004-密集-G5-终稿-0803.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `例子/PHLCSZC-302004-密集-G6-终稿-0811.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `例子/PHLCSZC-302007-G2-终稿.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `例子/PHLCSZLX-301001-G1-终稿.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `例子/PHLCSZLX-301001-G2-终稿.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `例子/PHLCSZLX-301001-G4-终稿.docx` | Example final paper | topic `support/examples/` | Keep as style/reference example; do not mix into report sources. |
| `作业/作业1/PHLCSYK-401007-A班-HW1-作业说明.docx` | Homework requirement | topic `support/homework/hw1/` | Keep as requirement reference. Extract only relevant constraints into topic docs. |
| `作业/作业1/PHLCSYK-401007-A班-G9-HW1.docx` | Submitted homework | topic `support/homework/hw1/` or topic `report/appendix/homework/` | Keep as prior deliverable/reference. Do not treat as source of truth for final report. |
| `作业/作业2/PHLCSYK-401007-A班-HW2-要求说明.docx` | Homework requirement | topic `support/homework/hw2/` | Keep as requirement reference. |
| `作业/作业2/PHLCSYK-401007-A班-G9-HW2.docx` | Submitted homework | topic `support/homework/hw2/` or topic `report/appendix/homework/` | Keep as prior deliverable/reference. Promote only final figures/text intentionally. |
| `.DS_Store` files | macOS metadata | None | Ignore. Do not copy into workbench. |

## Suggested Topic-Local Layout

For the active JIT-DP topic, use:

```text
topics/jit-defect-prediction/support/course-requirements/
topics/jit-defect-prediction/support/lecture-notes/
topics/jit-defect-prediction/support/examples/
topics/jit-defect-prediction/support/homework/hw1/
topics/jit-defect-prediction/support/homework/hw2/
```

Keep report-source Markdown in:

```text
topics/jit-defect-prediction/report/sections/
topics/jit-defect-prediction/report/appendix/
```

Keep experiment-source files in:

```text
topics/jit-defect-prediction/experiments/code/
topics/jit-defect-prediction/data/
topics/jit-defect-prediction/results/
```

## Rule Of Thumb

- Course PDFs, PPTX, DOCX examples, and homework statements are support material.
- Only edited, final report prose belongs in `report/sections/`.
- Only runnable scripts belong in `experiments/code/`.
- Only generated and accepted tables, metrics, and figures belong in `results/`.
- Do not copy Office temp files or `.DS_Store`.
