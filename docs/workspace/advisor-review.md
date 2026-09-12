# Bounded Claude Review

Read only when independent advice materially reduces a difficult architecture,
root-cause, security or regression uncertainty. AGENTS.md owns execution policy.
Use `claude_review_delegate` when available. Default to `claude-opus-5`,
`review_tier=standard`, CLI effort `max`; reserve `claude-fable-5` and
`review_tier=extreme` for exceptionally difficult cases. Claude is never an
implementation worker.

Provide a bounded source_of_truth, scope, constraints, acceptance criteria,
forbidden actions and concise evidence. For provided-evidence reviews allow no
tools; otherwise restrict tools to Read, Grep and Glob as needed. Do not supply
credentials, private configs, databases or unbounded logs. No edits, commits,
service operations, deploys or external writes are allowed.

Preserve the configured Claude Code provider or host-authenticated environment;
do not clear relay URLs or substitute first-party authentication. A standalone
`claude auth status` does not establish host-authenticated availability. Make
at most one bounded no-tools check through the intended entrypoint. If it fails,
continue in Codex and report the missing optional review. Do not discover or use
Sub2API or other model relay pools as fallback advisors.

Codex checks material claims against evidence, reconciles disagreement, performs
any authorized implementation and owns verification and final judgment.
For a request solely to prepare a handoff prompt, delivering that prompt is the
requested outcome even if Claude cannot be called.
