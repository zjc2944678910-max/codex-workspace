# codex-workspace

This directory is a long-lived Codex workspace root.

It is designed to keep project code, operator evidence, temporary outputs, and machine-local state separated so future Codex sessions can locate the right surface quickly.

## Main Areas

- `docs/`: long-lived workspace-level documentation
- `ops/`: operator-facing mirrors, evidence, logs, rollback bundles
- `projects/`: actual project trees
- `scratch/`: temporary outputs and disposable working material
- `archive/`: retired documents, cleanup records, and snapshots
- `state/`: local machine state and review/staging residue

## OpenClaw Defaults

- Mainline code: `projects/openclaw/main/nas-openclaw-v22`
- Migration reference: `projects/openclaw/migration/openclaw-mac-migration`
- Sidecar state: `projects/openclaw/sidecar-state`
- Operator truth and mirrors: `ops/openclaw`

See `WORKSPACE_MAP.md` for old-to-new path mapping.
