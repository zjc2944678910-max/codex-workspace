# Memory Retention Summary v0.1 Acceptance

Date: 2026-07-16

- Product commit: `3448e84 feat(memory): expose retention summary metadata`
- Remote: product `origin/main` contains `3448e84`
- Manifest: [memory-retention-summary-v0.1.md](../manifests/memory-retention-summary-v0.1.md)

## Accepted Result

The owner export now reports conservative retention aggregates from the
payload-free metadata API. Non-owner denial and `include_counts=false` perform
no new count reads. Review repaired an exception-boundary regression so a
failed optional metadata read degrades only `retention_state`; authoritative
summary-read failures still propagate.

## Verification

- Memory service tests: `37 passed`.
- Affected API contract tests: `2 passed`.
- Final full Python suite at `0e53f74`: `1743 passed, 1 existing warning`.
- Ruff lint, compileall, and diff checks: passed.
- Synthetic/in-memory stores only; no private payload or data mutation.

Real retention production, deletion, vault coverage, and live owner binding
remain unconfirmed.
