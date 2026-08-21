# Antigravity MCP Ops Surface

This directory is the operator-facing surface for `antigravity-mcp`.

## Routing Evidence

- Project name: `Antigravity MCP`
- Aliases: `antigravity-mcp`, `ag worker`
- Registry routing keywords: `antigravity-mcp`, `ag worker`, `Antigravity MCP`
- Main code: `projects/products/antigravity-mcp`
- Ops surface: `ops/projects/antigravity-mcp`
- State/data: `state/project-data/antigravity-mcp`
- Scratch: `scratch/projects/antigravity-mcp`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Current Local Baseline

- Transport: local STDIO MCP; no listening network port.
- Runtime: Node.js/TypeScript with MCP TypeScript SDK v2.
- Fixed worker identity: authorized Antigravity account slot `3`; no account
  rotation or fallback.
- Allowed models: `gemini-3.7-flash-low`, `gemini-3.7-flash-medium`, and
  `gemini-3.7-flash-high`, selected only through fixed task routes.
- Safety boundary: analysis receives a sanitized temporary source snapshot,
  runs with `agy --sandbox --mode plan`, and never uses the existing unsafe
  `ag` launcher.
- Repository access: explicit `ANTIGRAVITY_ALLOWED_ROOTS` allowlist; empty by
  default.

## Key Commands

```bash
cd projects/products/antigravity-mcp
npm run check
codex mcp get antigravity_worker
```

Any authentication, quota, model-availability, or terms-of-service error is a
hard stop. Do not connect this project to Sub2API or use another account as an
automatic fallback.

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
