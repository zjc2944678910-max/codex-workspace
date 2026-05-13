# Legacy Runtime Adapter Shim

This file is not a workspace strategy source.

If the underlying runtime adapter is still Claude CLI or an
Anthropic-compatible proxy, read and follow `WORKER.md` before doing any work.
The active executor contract is `WORKER.md`; the active policy authority is
`AGENTS.md`.
The default short-task path remains worker-first execution under Codex control,
not independent orchestration.

Do not infer from this file that Claude owns implementation, review,
or orchestration in this workspace. Runtime identity is separate from the
strategy role exposed to Codex as `model_worker_delegate`.
