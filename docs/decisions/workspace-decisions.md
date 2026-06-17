# Workspace Decisions

Durable workspace-level decisions that should survive beyond one session.
Project-specific facts belong in `ops/projects/<slug>/README.md`; long-task
slice decisions belong in that run's `05-decisions.md`.

## 2026-06-17

- **Decision**: Keep `codex-workspace` as a project-neutral workspace index and
  expose a short root `PROJECTS.md` generated from
  `docs/workspace/project-registry.json`.
- **Rationale**: Codex sessions need a fast human-readable project map without
  treating any registered project as the default work target.
- **Affects**: project routing, onboarding, workspace health, and daily session
  startup.
- **Risk**: `PROJECTS.md` can drift if edited by hand; regenerate it with
  `node docs/workspace/codex-register-project.mjs --regen`.

- **Decision**: Use `DAILY.md` only as a short-lived buffer.
- **Rationale**: Daily notes make handoff and resume easier, but stable facts
  should remain in project ops READMEs or this decision log.
- **Affects**: session closeout, memory hygiene, and workspace summaries.
- **Risk**: Old daily notes can become stale if facts are not promoted.
