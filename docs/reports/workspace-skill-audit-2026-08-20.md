# Workspace Skill Audit — 2026-08-20

## Scope and decision

This audit covers the workspace-local skill surface under `.agents/skills/`.
Global `$CODEX_HOME/skills`, plugin caches, sibling workspaces, and project
repositories are out of scope.

The old generated skill bundle was an ignored local snapshot, not a tracked
source of truth. It was archived rather than deleted so active skill discovery
does not load stale names or stale path guidance.

## Keep

| Path | Reason | Evidence |
| --- | --- | --- |
| `.agents/skills/gitnexus/` | Active workspace exploration and impact tooling | Six maintained GitNexus skills; names are descriptive and instructions point to the GitNexus MCP surface. |
| `.codex/agents/` | Project-scoped Codex agent source of truth | Tracked TOML agents with explicit model, reasoning, sandbox, and role boundaries. |

## Archive

The following ignored generated snapshots moved to
`archive/skills/generated/2026-04-18/`:

| Original active path | Archive path |
| --- | --- |
| `.agents/skills/generated/backup-host-status-summary-20260329t091128` | `archive/skills/generated/2026-04-18/backup-host-status-summary-20260329t091128` |
| `.agents/skills/generated/backup-host-status-summary-20260329t091216` | `archive/skills/generated/2026-04-18/backup-host-status-summary-20260329t091216` |
| `.agents/skills/generated/backup-host-status-summary-20260329t091255` | `archive/skills/generated/2026-04-18/backup-host-status-summary-20260329t091255` |
| `.agents/skills/generated/cluster-677` | `archive/skills/generated/2026-04-18/cluster-677` |
| `.agents/skills/generated/cluster-678` | `archive/skills/generated/2026-04-18/cluster-678` |
| `.agents/skills/generated/cluster-679` | `archive/skills/generated/2026-04-18/cluster-679` |
| `.agents/skills/generated/cluster-694` | `archive/skills/generated/2026-04-18/cluster-694` |
| `.agents/skills/generated/cluster-699` | `archive/skills/generated/2026-04-18/cluster-699` |
| `.agents/skills/generated/gate-log` | `archive/skills/generated/2026-04-18/gate-log` |
| `.agents/skills/generated/memory-maintenance` | `archive/skills/generated/2026-04-18/memory-maintenance` |
| `.agents/skills/generated/raw-tools` | `archive/skills/generated/2026-04-18/raw-tools` |
| `.agents/skills/generated/runtime-live` | `archive/skills/generated/2026-04-18/runtime-live` |
| `.agents/skills/generated/scripts` | `archive/skills/generated/2026-04-18/scripts` |
| `.agents/skills/generated/snake-game` | `archive/skills/generated/2026-04-18/snake-game` |
| `.agents/skills/generated/tests` | `archive/skills/generated/2026-04-18/tests` |
| `.agents/skills/generated/today-command` | `archive/skills/generated/2026-04-18/today-command` |
| `.agents/skills/generated/tools` | `archive/skills/generated/2026-04-18/tools` |

Reason labels: `generated evidence/tmp`, `ignored cache/build artifact`, and
`insufficiently current as active guidance`.

Confirmed stale indicators before archiving:

- all 17 files were ignored by the workspace root `.gitignore`;
- file timestamps were 2026-04-18;
- frontmatter described areas of the legacy root `-`;
- five names used cluster or timestamp identifiers;
- several entries referenced `$REMOTE_BACKUP`, staging, sanitized, or other
  historical mirror paths;
- the GitNexus index reported for the workspace was 33 commits behind `HEAD`.

Restore procedure: move the exact directory from
`archive/skills/generated/2026-04-18/` back to `.agents/skills/generated/`.
No file content was changed by the archive move.

## Delete

None. The user authorized active-surface organization, not irreversible
deletion. The archive remains recoverable locally.

## Ask / future review

| Surface | Why it remains open |
| --- | --- |
| Global `$CODEX_HOME/skills` and plugin-provided skills | Explicitly outside this workspace-local pass. |
| Project-specific skills inside ignored product repositories | Need project routing and owner evidence before changing. |
| New generated skills after GitNexus refresh | Re-evaluate only if a repeated workflow justifies a maintained, descriptive skill. |

## Active skill policy

New workspace-local skills should use a descriptive, stable name, point to
current routed paths, and state read/write or live-risk boundaries. Generated
cluster or timestamp names are discovery artifacts, not durable skill names.

## Index refresh result

`npx gitnexus analyze --embeddings` refreshed the workspace index to the current
commit `c28884c` with 2,805 nodes, 3,883 edges, 66 clusters, 67 flows, and 516
embeddings. `npx gitnexus status` reports the repository up to date.

The analyzer printed repeated `.gitnexus/lbug` lock warnings and exited with a
mutex-lock error after reporting successful repository indexing. The resulting
metadata is current and readable; the CLI shutdown error remains an operational
tooling risk to revisit separately.
