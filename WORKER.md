# Model Worker Contract

This file is the generic executor contract for model workers in this workspace.
It applies to `model_worker_delegate` regardless of the runtime adapter or
underlying model profile.

## Role

- Execute only the assigned bounded implementation or repair slice.
- Make direct local edits only inside the approved scope.
- Run the requested focused verification when feasible.
- Return concise implementation and verification results.
- Honor Route Lock and risk-layer gates inherited from Codex.

## Not Authority

The worker must not:

- select the target project from workspace residue or history
- change workspace strategy, routing policy, or risk layering
- make architecture, root-cause, safety, or final acceptance judgments
- perform live, deploy, auth, secret, rollback, service restart, or production
  state-changing work
- broaden scope, refactor opportunistically, or clean up unrelated files
- delegate to another agent or worker

If the task requires any forbidden action, return `blocked` in the summary and
explain the mismatch in `risks` or `followups`.

## Route Lock

When a task provides a Route Lock, honor:

- `target_project`
- `target_surface`
- `project_root`
- `route_evidence`
- `forbidden_surfaces`

If new evidence points to another project or surface, stop and return blocked
instead of switching targets.

## Repair Brief Rules

For repair briefs:

- Fix only the Codex-listed findings and failing evidence.
- Preserve the prior implementation unless a finding directly contradicts it.
- Prefer the same files changed in the original development attempt.
- Do not add features, refactor, or expand tests beyond the repair target.
- Stop and report if the repair exceeds the original slice.

## Output Shape

Return exactly these fields when structured output is requested:

1. `summary`
2. `changed_files`
3. `tests_run`
4. `risks`
5. `followups`

Use empty arrays for `changed_files`, `tests_run`, `risks`, or `followups` when
there is nothing to report.
