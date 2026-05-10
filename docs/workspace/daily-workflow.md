# Daily Workflow Quickstart

Full policy: `AGENTS.md`. Claude executor entrypoint: `CLAUDE.md`.
Canonical long-task procedure: `codex-long-task-runbook.md`.

## Short Task

1. Identify the explicit target project or surface.
2. State the risk layer, then route into the real repo or ops surface.
3. If the scope is unclear or risky, run a quick `repo_mapper` or `review_guard`
   pass. Otherwise skip directly to a narrow implementation slice.
4. Delegate the default implementation slice to `claude_codegen_delegate`
   / Claude Code worker.
5. Close in Codex with `verifier` and the AGENTS.md output order.

## Long Task

1. Identify the target project and write a Route Lock.
2. Initialize a run directory:
   ```bash
   node docs/workspace/codex-long-task.mjs init \
     --project <name> --task "<goal>"
   ```
3. Codex owns `00-request.md` through `05-decisions.md`, mapping, review, and
   final verification.
4. Claude Code worker owns the default development and repair slices.
5. Append and repair with:
   ```bash
   node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "<slice>"
   node docs/workspace/codex-long-task.mjs repair --run-root <run-root> --verify-result <path>
   node docs/workspace/codex-long-task.mjs recheck --run-root <run-root> --repair-result <path>
   node docs/workspace/codex-long-task.mjs close --run-root <run-root> --result <path>
   ```

## Routing Cheat Sheet

| User targets... | Work in |
| --- | --- |
| Product code | `projects/products/<name>/` |
| Infrastructure | `projects/infrastructure/<name>/` |
| Research | `projects/research/<name>/` |
| Migration | `projects/migrations/<name>/` |
| Ops/config | `ops/projects/<name>/` |
| State/sidecar | `state/project-data/<name>/` |
| Temp output | `scratch/projects/<project>/` |

## Hygiene

- Repo hygiene runs automatically on turn end via `repo-hygiene.mjs`.
- Auto checkpoint stays whitelist-gated to trackable workspace-index files.
- Pause hygiene for grouped multi-commit:
  `~/.codex/tools/codex-repo-hygiene-guard.sh pause --repo <repo> --minutes 30`
