# Bounded Worker Handoff

Apply the current AGENTS.md policy; this file defines the handoff format only.
Codex supplies a concrete independent task, Route Lock, owned files, constraints,
acceptance criteria and relevant evidence. For a short task the brief itself
holds the Route Lock; a run directory is not mandatory solely for delegation.

Workers are not alone in the checkout: preserve others' edits and stay inside
owned files. If scope or authority is insufficient, return the mismatch and
evidence to Codex. Do not independently choose another project, broaden the
assignment, spawn another writer, commit, or perform external/live mutations.

Return a compact summary, changed files, checks and outcomes, evidence pointers,
risks and followups. Use these keys when structured output is requested:
`summary`, `changed_files`, `tests_run`, `evidence_pointers`, `risks`, `followups`.
Use empty arrays where appropriate; avoid pasting full diffs and logs.
Codex reviews the work and owns acceptance.
