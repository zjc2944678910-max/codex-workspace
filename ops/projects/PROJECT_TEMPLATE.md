# <Project Name> Ops Surface

This directory is the operator-facing surface for `<project-slug>`.

## Routing Evidence

- Project name:
- Aliases:
- Main code:
- Ops surface:
- State/data:
- Scratch:
- Reports:
- Runbooks:
- Live host aliases:
- Service names:

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

## Stable Docs

- `README.md`
- `DEPLOYMENT_LEDGER.md`
- `ARCHITECTURE_TODO.md`
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

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are local-only
by default and are not part of the workspace-index repository surface.
