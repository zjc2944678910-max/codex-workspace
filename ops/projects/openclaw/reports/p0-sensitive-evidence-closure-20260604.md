# P0 Sensitive Evidence Closure - 2026-06-04

## Status

Closed for the remote OpenClaw cleanup target. Local evidence cleanup authorized
and executed as a follow-up in this Codex session.

## Scope

- Incident/evidence directory:
  `/Users/zhangjincheng/Desktop/p0-audit-evidence-20260602`
- Primary OpenClaw target repository:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/openclaw/nas-openclaw-v22`
- Primary sensitive target path:
  `memory_v4/memory_v4.db`
- Temporary verification clone from this closure audit:
  `/tmp/codex-openclaw-remote-audit-0NeQIC`

## Authorization

- User explicitly authorized the L3 cleanup stage with: `进入修复阶段`
- Authorization time observed by Codex: 2026-06-04 15:50:18 CST +0800

## Closure Evidence

- Current remote branch checked by read-only `git ls-remote`:
  `refs/heads/codex/openclaw-benben-vnext-core`
- Remote branch commit at closure check:
  `194c2810d77e39e011ed345c996ff9ba182e7b08`
- A temporary read-only clone of the current remote branch verified:
  - `memory_v4/memory_v4.db` is absent from the current remote tree.
  - Git history for `memory_v4/memory_v4.db` on the current remote branch has
    zero commits.
- Local OpenClaw working copy state before evidence deletion:
  - `memory_v4/memory_v4.db` is no longer tracked.
  - `memory_v4/memory_v4.db` is ignored by `.gitignore`.
  - The local clone still contains old path history and should not be treated as
    a clean source of truth for sensitive-history checks.

## Cleanup Manifest

### Keep

- This closure report.
- Project ops docs under `ops/projects/openclaw/`.

### Delete

- `/Users/zhangjincheng/Desktop/p0-audit-evidence-20260602`
  - Reason: completed P0 evidence package containing pre-filter bundle,
    restore clones, and cleanup logs; user requested deletion after closure.
  - Size observed before deletion: about 723M.
- `/tmp/codex-openclaw-remote-audit-0NeQIC`
  - Reason: temporary read-only verification clone created during closure audit.

### Archive

- No sensitive bundle or restore clone was archived. This is intentional: the
  remote cleanup target is verified closed, and the user requested evidence
  deletion rather than long-term retention of sensitive rollback material.

### Ask

- Local source clone hygiene remains a separate decision. The local OpenClaw
  clone still has old path history and may need replacement with a fresh clone
  if future sensitive-history checks should operate from a clean local copy.

## Residual Risk

- The local OpenClaw clone is behind/ahead of the remote rewritten branch and
  still contains old Git history. This closure does not rewrite or delete that
  source clone.
- Other repositories mentioned by the original evidence package, such as the
  ApacheJIT local cache, were not broadened into this cleanup.

## Verification After Cleanup

- Evidence directory deleted: yes
- Temporary verification clone deleted: yes
- Cleanup verification time: 2026-06-04 15:50 CST
