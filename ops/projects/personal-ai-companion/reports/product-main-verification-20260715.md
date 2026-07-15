# PAC Product Main Verification 2026-07-15

- Status: local source verification passed; no live-health claim
- Task level: L1 local verification
- Product baseline: `main@72258a127459a7aba3cd46f57cddf730d010b4fc`
- Remote comparison: local `main` and `origin/main` matched before the run
- Product checkout: `projects/products/personal-ai-companion`

## Scope And Boundary

This report makes the `1197`-test statement in the current PAC control docs
traceable to one command, product commit, date, and result. The run exercised
the checked-out Python test suite only. It did not inspect credentials, private
chat content, real health samples, a real device, a database outside test
fixtures, or any NAS/VPS/cloud runtime. It did not deploy, restart, migrate, or
change a live system.

Untracked product-local control material (`AGENTS.md`, `CLAUDE.md`, and `ops/`)
was present before the run and remained outside this task. No product source
file was edited.

## Verification

Environment:

- Python `3.11.4`
- pytest `8.4.2`

Command:

```bash
.venv/bin/python -m pytest -q
```

Result:

```text
1197 passed, 1 warning in 59.49s
```

The warning was the existing Starlette `TestClient`/`httpx` deprecation notice
reported from `fastapi/testclient.py`. It did not fail the suite.

## Interpretation

This result confirms the local Python suite at the exact product commit above.
It does not prove a live authenticated-chat vertical, HealthKit authorization,
health-context transmission, provider availability, device reliability, signing,
deployment health, or compatibility of later product commits. Current docs must
cite this report or repeat an equally bounded verification before carrying the
`1197` result to another baseline.
