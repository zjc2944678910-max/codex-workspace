# Model Review Packets

Reusable evidence packet templates for Sub2API advisors and Claude review.
These templates standardize what Codex sends out for high-value second
opinions while keeping secrets, live mutations, and unbounded logs out of scope.

Use with:

- Sub2API for planning, research, writing, code-review advice, UX/copy polish,
  and fallback Claude-style reviews.
- Claude review for bounded repo-only, provided-evidence, or live read-only
  audits when the local CLI is available.

## Rules

- Send summaries, file pointers, selected snippets, small test excerpts, and
  screenshots or observations when useful.
- Do not send API keys, OAuth tokens, cookies, private config files, full logs,
  databases, or secret-bearing environment files.
- External models advise; Codex applies edits, runs commands, and owns final
  acceptance.
- For live/NAS/VPS/OpenClaw/Sub2API-service work, forbid writes, restarts,
  deploys, database changes, config changes, and destructive commands unless
  the user has explicitly opened L3 with `进入修复阶段`.

## Architecture Review Packet

Use for design tradeoffs, shared contracts, routing changes, and medium-to-large
refactors.

```text
model_preference: claude-opus-thinking | gemini-pro | auto
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
model_preference: claude-opus-thinking | auto
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
model_preference: gemini-pro | auto
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
model_preference: claude-opus-thinking | auto
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

If local Claude review is unavailable, send the same packet through Sub2API with
`model_preference: claude-opus-thinking` and record `fallback: sub2api` in the
task notes.
