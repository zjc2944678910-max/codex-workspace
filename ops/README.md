# ops

This area stores reviewed, operator-facing material that should not live in
project source trees. It is not a live task journal.

- `shared/`: future shared operator utilities or notes
- `projects/`: per-project operator docs, mirrors, evidence, logs, rollback bundles, and quarantine

Promote a long-task fact into OPS only when all four gates pass:

- the fact has been verified;
- it remains useful across tasks rather than describing a transient run;
- it belongs to the current Route Lock project;
- it has evidence, a recheck condition, and a stated residual risk.

Running failures, raw logs, timestamps without stable meaning, hypotheses, and
temporary continuation state stay in the run directory. `ops-candidate` records
a proposal in `10-ops-promotion-candidates.md`; `finalize` keeps it there for
Codex review and never edits an OPS target automatically.
