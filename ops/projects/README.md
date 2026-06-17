# ops/projects

This subtree groups operator-facing material by project.

Each registered project should have:

- `README.md`: canonical project record and routing aliases
- `DEPLOYMENT_LEDGER.md`: deployment and environment history when applicable
- `ARCHITECTURE_TODO.md`: durable architecture backlog when applicable
- `manifests/`: tracked project manifests and inventories
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures

Use `ops/projects/<project>/` for:

- deployment ledgers
- architecture TODOs
- manifests
- durable reports
- project-specific runbooks
- systemd and tooling mirrors
- evidence bundles
- rollback bundles
- project-specific logs
- operator quarantine

Local-only subdirectories should stay ignored by the root repository:

- `mirrors/`
- `evidence/`
- `logs/`
- `quarantine/`
- `rollback/`

Start new project records with the registration helper when possible:

```bash
node docs/workspace/codex-register-project.mjs --slug <slug> --name "<Name>" --kind product
```

Use `PROJECT_TEMPLATE.md` only when the helper is not available or a project
needs unusual hand-authored structure.

See `docs/workspace/project-registry.json` for the machine-readable registry,
`PROJECTS.md` for the generated short project index,
`docs/workspace/project-surfaces.md` for the richer human-readable summary, and
`docs/workspace/scratch-retention.json` for scratch path retention policy.

Keep routing metadata in both places with distinct roles:

- `docs/workspace/project-registry.json`: machine-readable routing keywords,
  live host aliases, service names, and risk profile for hooks and scripts
- `ops/projects/<project>/README.md`: human-facing routing evidence and stable
  project entrypoint

When adding or changing project routing facts, update both files in the same
change. Do not add aliases, live host names, service names, project surfaces, or
GitNexus status in only one place.

After registry-only edits, regenerate the short root index:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

Use the drift explainer before and after routing changes:

```bash
node docs/workspace/repo-hygiene.mjs --repo "$PWD" --explain-mismatch
```

`docs/workspace/repo-hygiene.mjs` checks these records for route metadata drift.
If it reports `project_route_metadata_mismatches`, treat the registry as the
machine source and the matching ops README as the human-facing entrypoint, then
bring both back into agreement.
