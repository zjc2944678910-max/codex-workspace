# Model Review Packets

Reusable evidence packet templates for Claude Code review. These templates
standardize what Codex sends out for high-value second opinions while keeping
secrets, live mutations, and unbounded logs out of scope.

Use with:

- Claude Code CLI model `claude-opus-5` with `review_tier: standard` for normal
  bounded reviews. Use `claude-fable-5` with `review_tier: extreme` only for
  exceptionally difficult root-cause, architecture, security, or hard
  regression reviews.

## Rules

- Send summaries, file pointers, selected snippets, small test excerpts, and
  screenshots or observations when useful.
- Do not send API keys, OAuth tokens, cookies, private config files, full logs,
  databases, or secret-bearing environment files.
- Claude advises; Codex applies edits, runs commands, and owns final acceptance.
- For live/NAS/VPS/OpenClaw/Sub2API-service work, forbid writes, restarts,
  deploys, database changes, config changes, and destructive commands unless
  the user has explicitly opened L3 with `进入修复阶段`.

## Architecture Review Packet

Use for design tradeoffs, shared contracts, routing changes, and medium-to-large
refactors.

```text
model: claude-opus-5
review_tier: standard
effort: max
review_type: architecture
source_of_truth: repo_only | provided_evidence
task:
decision_needed:
repo_root:
scope:
relevant_files:
confirmed_evidence:
current_design:
proposed_change:
constraints:
forbidden_actions:
acceptance:
requested_output:
- architecture risks
- alternatives
- recommended path
- test/verification strategy
- residual uncertainty
```

## Code Review Packet

Use after a local implementation, candidate patch, or worker result.

```text
model: claude-opus-5
review_tier: standard
effort: max
review_type: code_review
source_of_truth: repo_only | provided_evidence
task:
repo_root:
changed_files:
relevant_contracts:
diff_summary:
tests_run:
known_failures:
constraints:
forbidden_actions:
acceptance:
requested_output:
- findings first, ordered by severity
- file/line references
- missing tests
- regression risks
- verdict: pass | changes_requested | blocked
```

## UX / Creative Polish Packet

Use for websites, frontend flows, presentations, copy, and emotionally important
or public-facing artifacts.

```text
model: claude-opus-5
review_tier: standard
effort: max
review_type: ux_polish
artifact:
audience:
user_goal:
current_state:
screenshots_or_observations:
copy_snippets:
visual_constraints:
interaction_constraints:
brand_or_tone:
must_keep:
must_avoid:
acceptance:
requested_output:
- top UX issues
- copy/tone improvements
- visual hierarchy suggestions
- accessibility concerns
- final polish checklist
```

## Live Read-Only Audit Packet

Use only after Codex has gathered bounded, non-secret evidence. This packet is
for judgment and risk review, not repair execution.

```text
model: claude-opus-5
review_tier: standard
effort: max
review_type: live_readonly_audit
source_of_truth: provided_evidence | ssh_live:<host>
task:
target_project:
target_surface:
risk_level: L2 read-only
evidence_bundle:
observed_symptoms:
confirmed_facts:
hypotheses:
forbidden_actions:
- no writes
- no restarts
- no config changes
- no database changes
- no deploys
- no deletes
acceptance:
requested_output:
- evidence-backed conclusion
- confidence level
- likely root cause candidates
- missing evidence
- L3 repair plan only if explicitly requested later
- rollback considerations
```

## Fallback Note

Preserve the user's configured Claude Code relay or `claude-desktop-3p`
environment. Do not use standalone `claude auth status` as the sole availability
check because desktop host authentication may not appear there. Use one bounded
no-tools call through the intended entrypoint using the selected tier. If Codex
cannot inherit the host credentials or the request fails once, continue with
Codex alone and record that the optional advisory bridge was unavailable. Do
not fall back to Sub2API or another relay model pool.
