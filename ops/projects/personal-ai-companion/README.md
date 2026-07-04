# Personal AI Companion Ops Surface

This directory is the operator-facing surface for `personal-ai-companion`.

## Routing Evidence

- Project name: `Personal AI Companion`
- Aliases: `stackchan-ai`, `stackchan-companion`, `personal-ai-companion`, `ai-companion`, `长期记忆助手`, `桌面AI伴侣`
- Registry routing keywords: `StackChan`, `memory-service`, `长期记忆`, `个人AI伴侣`, `女友风格`, `HealthKit`, `AlarmKit`, `personal-ai-companion`, `Personal AI Companion`, `stackchan-ai`, `stackchan-companion`, `ai-companion`, `长期记忆助手`, `桌面AI伴侣`
- Main code: `projects/products/personal-ai-companion`
- Ops surface: `ops/projects/personal-ai-companion`
- State/data: `state/project-data/personal-ai-companion`
- Scratch: `scratch/projects/personal-ai-companion`
- Reports: `reports/`
- Runbooks: `runbooks/`
- Live host aliases: -
- Service names: -
- Registry risk profile: `local`

Route into this project only when the user explicitly names one of these
entries, provides a matching path, or asks for a file that belongs to this
surface.

Mirror machine-readable fields in `docs/workspace/project-registry.json`.
Regenerate the short human index with:

```bash
node docs/workspace/codex-register-project.mjs --regen
```

## Stable Docs

- `README.md`
- `manifests/architecture-decisions-2026-07-04.md`
- `runbooks/mvp-build-order.md`
- `DEPLOYMENT_LEDGER.md` when deployment history exists
- `ARCHITECTURE_TODO.md` when architecture backlog exists
- `manifests/`
- `reports/`
- `runbooks/`

## Product Intent

`personal-ai-companion` is the dedicated project for the StackChan/iOS/NAS
personal AI companion discussed on 2026-07-04.

The intended product is a private assistant and desktop companion with:

- StackChan as a small embodied front end, not the main model host.
- A user-owned relay server as the control plane and model router.
- Cloud model routes for Gemini and Claude via the user's gateway.
- Optional NAS local model routes for private/offline or lightweight work.
- A long-term memory system that is inspectable, explainable, and forgettable.
- An iOS companion app that uses permission-scoped integrations only.
- Optional chat-log style modeling only with explicit consent from the person
  being modeled.

## Routing Guardrails

- Mentions of `StackChan`, `桌面AI伴侣`, `个人AI伴侣`, this memory-service
  design, HealthKit/AlarmKit integration for the companion app, or girlfriend
  style-profile planning should route here.
- OpenClaw/benben is a design reference only. Do not route this product to
  `ops/projects/openclaw` unless the user explicitly asks about OpenClaw,
  benben, oc-nas, or an OpenClaw file/path/service.
- Sub2API is a model gateway dependency/reference only. Do not route this
  product to `ops/projects/sub2api` unless the user explicitly asks about
  Sub2API gateway operations, live health, routing, or deployment.
- If the relay server, NAS deployment, DNS, or production app is later made
  live, re-evaluate the risk profile before state-changing work. Until then,
  local docs and code are L0/L1.

## Current Architecture Decision

Use the benben vNext ideas as patterns, not as a service clone:

- `InteractionEnvelope`: normalize every inbound event before memory/model work.
- `IdentityKernel`: bind user, girlfriend/partner, assistant, device, and
  relationship identities structurally.
- `PrivacyKernel`: filter memory by viewer, device, delivery mode, and consent.
- `MemoryService`: separate short-term session deltas, candidate memories,
  review queues, and promoted long-term memory atoms.
- `MemoryAdmin`: owner-visible search, explain, approve, reject, delete, and
  forget flows.
- `ToolGate`: require explicit owner confirmation for state-changing actions.

The first implementation should build the relay and memory-service locally
before changing StackChan firmware or deploying anything to NAS.

## Subdirectories

- `manifests/`: tracked operator manifests and inventory notes
- `reports/`: tracked durable project reports and audit writeups
- `runbooks/`: tracked project-specific operational procedures
- `mirrors/`: local mirrors of service units, tools, and runtime artifacts
- `evidence/`: timestamped evidence bundles for audits and repairs
- `rollback/`: timestamped rollback bundles for reversible change sets
- `logs/`: time-bucketed operator logs
- `quarantine/`: legacy artifacts or uncertain evidence retained locally

`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are
local-only by default and are not part of the workspace-index repository
surface.
