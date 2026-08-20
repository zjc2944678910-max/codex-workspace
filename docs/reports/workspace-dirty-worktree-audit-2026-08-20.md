# Workspace Dirty Worktree Audit — 2026-08-20

## Scope

Read-only review of dirty project repositories reported by workspace health.
No project file was edited, deleted, staged, committed, or deployed.

## Decisions

| Project | Evidence | Decision | Review after |
| --- | --- | --- | --- |
| `personal-ai-companion` | `main` is one commit ahead of `origin/main`; 156 changes (82 tracked, 74 untracked) span iOS, cloud/realtime, memory, tests, device support, and deployment examples. | Preserve as an active local candidate set. L2 read-only at workspace level; require a dedicated project task before acceptance, cleanup, commit, or any live action. | 2026-08-27 |
| `paper-001` | Active `codex/paper-001-arr` branch; 33 changes (20 tracked, 13 untracked) cover manuscript text, annotation material, evidence notes, program-aware baseline code/results, and tests. | Preserve as active research work. Registration is complete, but project changes remain for a separate evidence-synchronized review/commit task. | 2026-09-03 |
| `pet-clinic` | 19 changes (14 tracked, 5 untracked) exactly match the previously acknowledged submitted assignment state. | Continue preserving without cleanup; extend the acknowledgement after confirming counts are unchanged. | 2026-10-20 |

## Safety boundary

- Personal AI Companion remains L2 read-only here; no product or live state was changed.
- Acknowledgements fail closed when counts change or `review_after` expires.
- Acknowledgement is not acceptance of correctness and is not permission to
  commit, delete, deploy, or repair project files.
