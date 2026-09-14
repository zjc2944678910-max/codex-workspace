# Code Representation Caching Research Workbench Ops Surface

This directory is the operator-facing surface for `code-representation-caching`.

## Routing Evidence

- Project name: `Code Representation Caching Research Workbench`
- Aliases: `cache representation paper`, `code-as-image caching`, `代码表示缓存论文`
- Registry routing keywords: `code-as-image`, `prompt caching`, `incremental code edits`, `cache reuse`, `code-representation-caching`, `Code Representation Caching Research Workbench`, `cache representation paper`, `code-as-image caching`, `代码表示缓存论文`
- Main code: `projects/research/code-representation-caching`
- Ops surface: `ops/projects/code-representation-caching`
- State/data: `state/project-data/code-representation-caching`
- Scratch: `scratch/projects/code-representation-caching`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `research_local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Ops Quality Baseline

- Current status: Registered local research workbench. The 2026-09-14
  whole-block preflight passed identical-input cache sanity, and the subsequent
  text-sentinel topology probe produced partial-prefix cache reads after a
  chunk-6 edit for both text and image. Direct markers on image blocks did not
  create cache writes on the tested OpenRouter → OpenAI route. The repeated
  three-position mechanism pilot completed all 54 requests for `$0.06523551`.
  Every warm repeat hit cache; edited text/image reuse was `0%/0%` at 10%,
  `0%/17.14%` at 50%, and about `84%/84%` at 90%. The text-midpoint prediction
  failed and is consistent with a first text prefix below the provider's
  1,024-token cache minimum. A frozen threshold-matched control then made all
  three edited text midpoints cacheable at 1,268–1,270 tokens, but failed its
  complete-validation rule when the second image cell's identical warm request
  missed cache. The automatic stop left 14 of 18 requests complete. The final
  validation status is `FAIL`, with partial support for the text-threshold
  explanation but no completed text/image result or paper contribution. A
  separately frozen unchanged-input stability screen then passed: ten
  consecutive text repeats and ten consecutive image repeats all hit cache with
  constant cached-token counts and zero rewrites. This supports stable reads
  within each warmed sequence. A follow-on independent-entry screen then
  completed 20 new cold-write/warm-read pairs: text passed 10/10 and image
  passed 10/10, with every cold request reading zero, every warm request reading
  exactly its paired write, and zero warm rewrites. This makes the earlier image
  miss consistent with intermittent retrieval but does not erase the failed
  threshold control. A separately frozen fixed-size local-edit replication then
  completed 90/90 requests and passed all 30 cells. Both representations had
  15/15 exact warm reads; normalized Text/Image edit reuse was `0%/0%` at 10%,
  `17.64%/17.22%` at 50%, and `85.79%/85.79%` at 90%. The mechanism gate now
  passes, but the current screenshot representation uses about 5.15 times the
  Text input tokens and therefore does not establish an image-compression or
  paper contribution.
- Risk gate: Use L0/L1 for local research code and documentation; no live infrastructure is registered for this project.
- Common commands:
  - `node docs/workspace/find-project.mjs code-representation-caching`
  - `node docs/workspace/workspace-health.mjs --repo "$PWD" --limit 12`
  - Run project-specific checks from
    `projects/research/code-representation-caching`.
- Last verification: frozen runner commit `78f4364` completed run
  `20260914T112310Z` with 90/90 requests and 30/30 valid cells for
  `$0.29916150`. All response, order, boundary, identity, reliability, and
  topology checks passed. The account delta reconciled exactly. The analyzer's
  serialization-only repair passed 26 unit tests and Python syntax checks;
  evidence hashes are recorded in
  `projects/research/code-representation-caching/docs/edit-replication-results-2026-09-14.md`.
- Next useful work: Pre-register a real coding-task/correctness pilot only after
  designing a code-image representation that demonstrates a genuine cold token
  or cost advantage over Text. Do not spend another run on the same synthetic
  cache mechanism or relabel the earlier stopped control.
- Model review guidance: Use
  [model-review-packets.md](../../../docs/workspace/model-review-packets.md) for
  bounded research, protocol, or code review. Never send credentials, private
  configuration, or unbounded raw experiment output.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are
local-only by default and are not part of the workspace-index repository
surface.
