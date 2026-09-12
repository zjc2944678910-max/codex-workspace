# Token Budget Runbook

Use this with `AGENTS.md` and `daily-workflow.md` when choosing how much model,
context, tooling, and delegation a task deserves.

## Optional Profiles

Keep the user's chosen main model and reasoning strength unless asked to change
them. These profiles are available for explicit selection; task classification
does not automatically switch the main model or its effort.
Profile-file values alone do not prove the effective settings: project config
and explicit task overrides also participate. Check the loaded configuration
when changing profiles. This workspace does not pin the primary model or effort.

| Profile | Use For | Defaults |
| --- | --- | --- |
| `fast` | Ordinary questions, tiny edits, known-scope local fixes | low reasoning, early compact |
| `standard` | Default local development and focused workflow work | high reasoning, normal compact |
| `audit` | L2, architecture, complex root cause, production audits, hard regressions | xhigh reasoning, broader context |

Codex CLI profile v2 loads these from `$CODEX_HOME/<profile>.config.toml`
for example `$CODEX_HOME/fast.config.toml`, not from inline `[profiles.*]`
blocks in this repo's `.codex/config.toml`. The tracked workspace config keeps
the broad default context window (`1000000`) and auto-compact limit (`252000`).
Leave these context values unchanged when adjusting delegation. A brief recovery
note may help when needed; the legacy generator is not required. The profile
files define these optional settings:

- `fast`: low reasoning, compact at `180000`
- `standard`: high reasoning, compact at `200000`
- `audit`: xhigh reasoning, compact at `220000`

CLI examples:

```bash
/Applications/ChatGPT.app/Contents/Resources/codex --profile fast
/Applications/ChatGPT.app/Contents/Resources/codex --profile standard
/Applications/ChatGPT.app/Contents/Resources/codex --profile audit
```

## Delegation Budget

AGENTS.md owns delegation and file ownership; model defaults live in config.
Choose zero or more useful independent slices without mandatory role quotas.
The configured ceiling is six spawned agents, excluding the main agent; actual
runtime capacity may be lower. Reuse helpers or batch work instead of bypassing
the limit. Do not infer a fixed role chain from task size or a count of risks.

Bounded lookup uses Luna, substantial implementation and routine separate review
use Sol, and unresolved material risks may justify an independent Astra review.
The role TOML files specify effort. Pass concise briefs and evidence rather than
full history. Avoid redoing a completed slice while waiting for its result.

Judge efficiency by final correctness, rework, end-to-end elapsed time and usage
across the main agent and every helper. More total tokens can still cost less
with cheaper models; shorter instructions alone do not prove a cheaper task.

The user-global auto-compact value is currently `900000`, while this workspace
sets `252000`. Both values are intentionally preserved in the first policy
optimization. This note does not claim the running App uses either without
runtime evidence, or that a particular billing threshold still applies.

## Command Output Budget

- Prefer targeted commands over broad scans.
- Use `rg -n <term> <paths>` with specific terms and paths.
- Read ranges with `sed -n` or `nl -ba | sed -n`, not whole large files.
- Start diffs with `git diff --stat`, `git diff --name-only`, or scoped paths;
  expand only the files needed for the decision.
- For tests, keep the final summary and the first failing block. Put full logs
  in a run directory or scratch path only when they are evidence.
- For live/read-only audits, capture long evidence to files or remote log
  pointers and summarize the decisive 30-80 lines.

## Evidence Pointers

Use this shape instead of pasting context:

```text
source: <path or command>
lines: <line number/range or "summary">
finding: <confirmed fact>
risk: <why it matters or empty>
next: <next action>
```

Only paste long excerpts when the exact text is the evidence under review.

## Decision Reuse

- Read relevant existing recovery notes before restarting work. In explicitly
  opted-in legacy runs these include `05-decisions.md`, `08-continuation.json`
  and `09-failure-ledger.jsonl`; their existence does not require updates.
- Workspace-level durable decisions belong in
  `docs/decisions/workspace-decisions.md`.
- Project routing, common commands, and stable architecture facts belong in the
  matching `ops/projects/<project>/README.md`.
- Reuse confirmed facts before re-exploring. Recheck only when a file changed,
  an index is stale, a command fails, or new evidence contradicts the ledger.

## GitNexus First

For indexed projects, prefer GitNexus before broad text sweeps:

- `query` for likely flows and symbols.
- `context` for callers/callees of a known symbol.
- `impact` for blast radius before changing shared code.
- `api_impact` for route handlers.

If GitNexus is missing or stale, record that fact and fall back to `rg`,
focused reads, and local tests.
