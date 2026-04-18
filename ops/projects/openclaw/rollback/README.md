# OpenClaw Rollback Bundles

This directory stores rollback-ready bundles for OpenClaw changes.

## Layout

- `YYYY/`
  - `YYYY-MM-DD_HHMMSS_<change>/`
    - `README.md`
    - `before/`
    - `after/`
    - `diff/`
    - `restore-notes.md`
    - `verify.md`

## Usage Rules

- Create a rollback bundle only for changes that may need structured reversal.
- Keep timestamps at the directory level, not in ordinary source filenames.
- Store snapshots and restore notes here; do not place them in project source trees.
- This directory is local-only by default and is not part of the workspace-index tracked surface.
