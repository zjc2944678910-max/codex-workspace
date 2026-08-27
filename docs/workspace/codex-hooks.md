# Codex Workspace Hooks

This document records the repo-local Codex hooks installed for
`/Users/zhangjincheng/Documents/GitHub/codex-workspace`.

The hooks are guardrails for this workspace index. They are intentionally
conservative: they add context, warn on risky work, and block clearly dangerous
commands, but they are not a complete security sandbox.

## Files

- `.codex/config.toml`: enables `codex_hooks`.
- `.codex/hooks.json`: wires lifecycle events to the hook runner.
- `.codex/hooks/workspace_guard.py`: implements the workspace policy.
- `docs/workspace/project-registry.json`: machine-readable source for route
  hints, live host aliases, and service names.
- `docs/workspace/workspace-hooks.test.mjs`: regression tests for hook behavior.

## Installed Hooks

| Event | Purpose | Behavior |
| --- | --- | --- |
| `SessionStart` | Load workspace rules | Adds compact workspace context and read-only reminders for up to three active long-task runs. |
| `UserPromptSubmit` | Route by prompt | Adds registry-derived route/risk hints and up to three matching active-run reminders. |
| `PreToolUse` | Command guard | Blocks destructive local commands and L3-looking live mutations unless the repair gate is open, while allowing read-only inspection commands that merely mention blocked strings. |
| `PermissionRequest` | Approval guard | Denies dangerous approval requests if approval prompts are enabled in a future profile. |
| `PostToolUse` | Hygiene check | Runs workspace hygiene after file edits and only warns when policy-relevant issues appear. |
| `Stop` | Closeout and repair-gate cleanup | Clears task-scoped repair authorization and reminds high-risk L2/L3/live answers to include evidence, risks, and next steps. |

## Repair Gate

L3 repair execution remains gated by the exact user phrase:

```text
进入修复阶段
```

When that phrase appears in a user prompt, the hook runner records task-scoped
repair authorization in:

```text
~/.codex/state/codex-workspace-hooks.json
```

The authorization stays active for the current task execution even when it runs
longer than 30 minutes. The `Stop` hook removes it when that task execution ends,
so it is not carried into the next task execution.

The gate only relaxes L3-looking command blocking. It does not authorize broad
scope changes, production cutovers, deploys, or unrelated cleanup.

## Routing Metadata

Hooks load project metadata from `docs/workspace/project-registry.json`.
Each project may define:

- `routing_keywords`
- `live_host_aliases`
- `service_names`
- `risk_profile`

The project ops README remains the human-facing routing record. Shared live
aliases should stay explicit in both places.
`repo-hygiene.mjs` reports `project_route_metadata_mismatches` when registry
fields drift from the matching ops README.

## Long-Task Recovery Reminders

`SessionStart` and `UserPromptSubmit` read the active-run indexes beneath
project `state_data` directories. A reminder includes the run and its recorded
next action, is capped at three relevant runs, and omits closed runs. Hooks do
not create a run, checkpoint, repair a transaction, change an index, or write
OPS; the CLI remains the source of truth for recovery and conflict handling.

## Command Policy

The hook blocks destructive local commands such as:

- `git reset --hard`
- `git checkout --`
- `git clean -f`
- `rm -rf`
- `find ... -delete`
- disk formatting or raw disk write commands
- `curl ... | sh` style remote script execution

The hook blocks L3-looking live/runtime commands unless the repair gate is open,
including common patterns around:

- `systemctl restart|stop|start|reload`
- `docker compose down`, `docker restart`, `docker system prune`
- `kubectl apply|delete|rollout|scale|patch`
- `helm upgrade|rollback`
- `terraform apply|destroy`
- production deploy commands
- `scp` or `rsync` involving `oc-nas`
- `ssh oc-nas` commands that mutate services or `/etc`

Read-only inspection commands, such as `rg`, `sed -n`, `git show`, `git status`,
and `journalctl` probes, are not blocked just because they mention risky text.
They still get an L2 read-only reminder when live terms are present.

## Verification

Run focused hook tests:

```bash
node --test docs/workspace/workspace-hooks.test.mjs
```

Run all workspace tests:

```bash
node --test docs/workspace/*.test.mjs
```

Validate hook files directly:

```bash
python3 -m py_compile .codex/hooks/workspace_guard.py
python3 -m json.tool .codex/hooks.json
python3 - <<'PY'
import tomllib
from pathlib import Path
tomllib.loads(Path(".codex/config.toml").read_text())
print("toml: ok")
PY
```

Check workspace hygiene:

```bash
node docs/workspace/repo-hygiene.mjs --json --quiet
node docs/workspace/workspace-health.mjs
```

## Disable Or Roll Back

Temporarily disable the repo-local hooks by setting:

```toml
[features]
codex_hooks = false
```

To fully remove this hook set, delete:

```text
.codex/hooks.json
.codex/hooks/
docs/workspace/workspace-hooks.test.mjs
```

Then remove `.codex/hooks.json` and `.codex/hooks/` from the root tracking
policy in `AGENTS.md`, `docs/workspace/repo-hygiene.mjs`, and
`docs/workspace/repo-hygiene.test.mjs`.

After any rollback, run:

```bash
node --test docs/workspace/*.test.mjs
node docs/workspace/repo-hygiene.mjs --json --quiet
```
