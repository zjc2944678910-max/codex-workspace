# Bounded Worker Handoff

Apply the current AGENTS.md policy; this file defines the handoff format only.
Codex supplies a concrete independent task, Route Lock, owned files, constraints,
acceptance criteria and relevant evidence. The brief itself holds the Route
Lock; no run directory is required. Apply AGENTS.md's context selection policy.
Make the brief sufficient for a helper that has not seen the conversation:

- State the goal, relevant user requirements, settled interfaces and decisions.
- Give the Route Lock, owned files, allowed actions and acceptance checks.
- Point to accessible files, symbols, focused evidence and needed attachments;
  do not assume earlier chat content is available. Include relevant rejected
  approaches when this prevents repeating failed work.

Keep this in the spawn message; use only the detail the slice needs, with no
fixed length or separate brief file. If critical context is missing, ask the
main agent for the specific fact or evidence instead of guessing or rereading
the whole task history. The main agent supplies the missing context or adjusts
the assignment without an extra user approval step.

Use the runtime's named-role selector when available. Otherwise, the main agent
reads the role file and explicitly supplies its model, effort and constraints
through the supported spawn interface, including a task name. This fallback
does not prove that the role file's sandbox setting was applied.

Workers are not alone in the checkout: preserve others' edits and stay inside
owned files. If scope or authority is insufficient, return the mismatch and
evidence to Codex. Do not independently choose another project, broaden the
assignment, spawn any child agent, bypass concurrency limits with extra
processes, commit, or perform external/live mutations. Parallel writers need
disjoint ownership and settled shared interfaces. The main agent coordinates
shared files and test/build resources and also honors assigned ownership.

Return a compact summary, changed files, checks and outcomes, evidence pointers,
risks and followups. Use these keys when structured output is requested:
`summary`, `changed_files`, `tests_run`, `evidence_pointers`, `risks`, `followups`.
Use empty arrays where appropriate; avoid pasting full diffs and logs.
Codex reviews the work and owns acceptance.
