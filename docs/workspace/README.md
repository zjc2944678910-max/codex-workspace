# Workspace Tools

This directory contains workspace-level runbooks and small local tools for
daily Codex work.

## Long Task CLI

Use the unified long-task entrypoint when work is large enough to need a run
directory, task ledger, agent handoffs, repair loops, or rechecks.

Choose the project from the task first. Do not treat `openclaw` as the default
project name in this workspace.

```bash
node docs/workspace/codex-long-task.mjs --help
```

Common commands:

```bash
node docs/workspace/codex-long-task.mjs init --project sample-product --task "Implement feature flag sync"
node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "Implement feature flag sync"
node docs/workspace/codex-long-task.mjs repair --run-root <run-root> --verify-result <run-root>/agents/T04/verify-result.md
node docs/workspace/codex-long-task.mjs recheck --run-root <run-root> --repair-result <run-root>/agents/T03/repair-1-result.md
node docs/workspace/codex-long-task.mjs close --run-root <run-root> --result <run-root>/agents/T04/recheck-1-result.md
```

Reference:

- `codex-long-task-runbook.md`: operational workflow.
- `codex-multi-agent-long-task-template.md`: prompt and file protocol.
- `codex-long-task*.mjs`: local CLI tools.
- `codex-long-task*.test.mjs`: regression tests.

## Repo Hygiene

`repo-hygiene.mjs` supports workspace-root hygiene checks and checkpointing for
allowed tracked paths.

## Workspace Disk Report

Use `workspace-disk-report.mjs` before cleanup work to classify disk hotspots
into conservative `keep`, `delete`, `archive`, and `ask` buckets.

```bash
node docs/workspace/workspace-disk-report.mjs --limit 30
node docs/workspace/workspace-disk-report.mjs --json --limit 30
```

Run all workspace tool tests:

```bash
node --test docs/workspace/*.test.mjs
```
