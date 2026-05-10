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

Start new project records from `PROJECT_TEMPLATE.md`.
