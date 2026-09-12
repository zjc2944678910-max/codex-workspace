# Token Budget Runbook

Use this with `AGENTS.md` and `daily-workflow.md` when choosing how much model,
context, tooling, and delegation a task deserves.

## Profiles

| Profile | Use For | Defaults |
| --- | --- | --- |
| `fast` | Ordinary questions, tiny edits, known-scope local fixes | low reasoning, early compact |
| `standard` | Default local development and focused workflow work | high reasoning, normal compact |
| `audit` | L2, architecture, complex root cause, production audits, hard regressions | xhigh reasoning, broader context |

Codex CLI profile v2 loads these from `$CODEX_HOME/<profile>.config.toml`
for example `$CODEX_HOME/fast.config.toml`, not from inline `[profiles.*]`
blocks in this repo's `.codex/config.toml`. The tracked workspace config keeps
the broad default context window (`1000000`) and auto-compact limit (`252000`).
Long-task continuity lives on disk, so raising the compact threshold is not the
recovery mechanism. The profile files lower the budget for day-to-day use:

- `fast`: low reasoning, compact at `180000`
- `standard`: high reasoning, compact at `200000`
- `audit`: xhigh reasoning, compact at `220000`

CLI examples:

```bash
codex --profile fast
codex --profile standard
codex --profile audit
```

## Delegation Budget

AGENTS.md owns the delegation policy: keep a useful Luna slice for non-tiny
local work, with the small-task and no-independent-slice exceptions. Do not
infer a full chain from task size or a fixed number of risk signals. Mapper and
docs-checker use medium; other roles retain xhigh. These are defaults to verify
against task quality, not a claim that extra reasoning always helps.

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

- Long tasks store reusable facts in `05-decisions.md`, current continuation in
  `08-continuation.json`, and failed approaches in `09-failure-ledger.jsonl`.
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
