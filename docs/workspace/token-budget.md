# Token Budget Runbook

Use this with `AGENTS.md` and `daily-workflow.md` when choosing how much model,
context, tooling, and delegation a task deserves.

## Profiles

| Profile | Use For | Defaults |
| --- | --- | --- |
| `fast` | Ordinary questions, tiny edits, known-scope local fixes | low reasoning, early compact |
| `standard` | Default local development and focused workflow work | high reasoning, normal compact |
| `audit` | L2, architecture, complex root cause, production audits, hard regressions | xhigh reasoning, broader context |

CLI examples:

```bash
codex --profile fast
codex --profile standard
codex --profile audit
```

## Delegation Budget

- L0 and small known-scope L1 default to zero agents.
- Ordinary L1 should use at most one helper agent.
- Use the full mapper -> review -> worker -> verifier chain only when at least
  two risk signals are present: unknown call chain, cross-module contract, API
  route, security/auth/secret boundary, flaky or failing verification, broad
  refactor, repeated repair, or messy handoff state.
- Keep `review_guard` as the high-cost risk pass; do not use it as routine
  confidence padding.

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

- Long tasks store reusable facts in `05-decisions.md`.
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
