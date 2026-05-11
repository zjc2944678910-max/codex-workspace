# Contest Day Workflow

This runbook is for `CUMCM-2026-Workbench` and assumes the contest timing
published on the official site: `2026-09-10 18:00` to `2026-09-13 20:00`
Beijing time.

## T-30 Days

1. Verify the workbench CLI still runs locally.
2. Refresh the local LaTeX template snapshot with `python3 src/main.py fetch-template`.
3. Rehearse one old problem with the current bundle workflow.
4. Confirm each team member knows the case directory structure.

## T-7 Days

1. Re-run a timed dry run using one archived problem.
2. Check that `smoke-test`, `build-paper`, `build-support`, and `verify-submission` still pass.
3. Confirm local Python and optional PDF tooling are available.
4. If `latexmk` or `xelatex` is available, run `compile-paper` once on the dry-run case.
5. Freeze any nonessential tool changes.

## T-1 Day

1. Prepare a clean working branch and confirm disk space.
2. Confirm all needed offline references exist under the workbench.
3. Re-read the official submission and AI usage requirements.
4. Confirm the team will not browse GitHub, forums, or social media for
   problem-specific discussion after the contest starts.

## Contest Window

1. Start a case immediately after the problem is released:
   `python3 src/main.py init-case --case <problem-slug>`
2. Put working code under `analysis/` and runnable support code under `support/code/`.
3. Save final figures to `results/figures/` and final tables to `results/tables/`.
4. Draft the paper in `paper/sections/` while experiments are running.
5. If AI is used, keep `support/ai/ai_usage.yaml` current instead of backfilling it later.
6. Keep `support/code/smoke_test.py` or `case.yaml`'s `smoke_command` aligned with the runnable code entry point.

## Final 6 Hours

1. Run `smoke-test`.
2. Run `build-support`.
3. Run `build-paper`.
4. If a TeX engine is installed, run `compile-paper` and confirm page limits.
5. Run `package-submission`.
6. Run `verify-submission` until it passes.
7. Manually inspect anonymity, appendix file lists, zip contents, and final bundle sizes.
