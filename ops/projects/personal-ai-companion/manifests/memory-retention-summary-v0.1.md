# Memory Retention Summary v0.1

Status: local/synthetic source accepted at product `3448e84`, retained in
current `main@0e53f74`.

## Accepted Boundary

- Owner-only `export_summary` gains a metadata-only retention projection.
- Bounded aggregates cover explicit-future expiry, expired-at-boundary,
  no-expiry/legacy, and export-suppressed overlap.
- Existing class/scope filters, privacy denial ordering, audit, and
  `include_counts=false` behavior remain intact.
- Invalid, incomplete, or failed optional metadata reads fail closed without
  hiding the authoritative summary counts.

## Explicit Exclusions

- No memory content enters the retention projection.
- No schema, migration, vault, vector, retention executor, deletion, scheduler,
  real database, or authenticated-chat wiring.
- The projection is descriptive metadata, not proof that retention executed.
