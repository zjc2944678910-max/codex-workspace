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
- `docs/workspace/workspace-hooks.test.mjs`: regression tests for hook behavior.

## Installed Hooks

| Event | Purpose | Behavior |
| --- | --- | --- |
| `SessionStart` | Load workspace rules | Adds context that this root is a workspace index, not a product repo. |
| `UserPromptSubmit` | Route by prompt | Adds route/risk hints for registered projects such as OpenClaw, NAS Platform, Telegram Dual Relay, MathorCup-D, Spark, and CUMCM. |
| `PreToolUse` | Command guard | Blocks destructive local commands and L3-looking live mutations unless the repair gate is open. |
| `PermissionRequest` | Approval guard | Denies dangerous approval requests if approval prompts are enabled in a future profile. |
| `PostToolUse` | Hygiene check | Runs workspace hygiene after file edits and only warns when policy-relevant issues appear. |
| `Stop` | Closeout reminder | Reminds high-risk L2/L3/live answers to include evidence, risks, and next steps. |

## Repair Gate

L3 repair execution remains gated by the exact user phrase:

```text
进入修复阶段
```

When that phrase appears in a user prompt, the hook runner records a session
repair window for 30 minutes in:

```text
~/.codex/state/codex-workspace-hooks.json
```

The gate only relaxes L3-looking command blocking. It does not authorize broad
scope changes, production cutovers, deploys, or unrelated cleanup.

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

Read-only live evidence commands, such as `journalctl` probes, are not blocked.
They get an L2 read-only reminder.

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
