# PAC Integration Contracts v0.1

- Status: accepted local contract baseline
- Accepted date: 2026-07-15
- Product source: `main@65d47b557e69a2abf8a3853541c1e8416790a0d9`
- Product package: `src/personal_ai_companion/integrations/`
- Fixtures: `fixtures/integrations/v0.1/`
- Acceptance report:
  [integration-contracts-v0.1-acceptance-20260715.md](../reports/integration-contracts-v0.1-acceptance-20260715.md)

## Purpose And Boundary

This manifest freezes the additive data contracts required before building the
custom-provider registry, backend MCP gateway, supported phone-action path, or
concrete `HealthSource` adapters. The package is transport-free and has no
runtime wiring into chat, model routing, iOS, HealthKit, App Bridge, MCP, or a
network client.

The contracts do not store or project provider/MCP endpoints, API keys,
environment values, bearer material, raw probe errors, source locators, raw
health samples, or target-app completion claims. Fixed fixtures are synthetic.

## Versioned Contract Families

| Family | Wire version | Public types | Accepted invariant |
| --- | --- | --- | --- |
| Provider | `pac.provider_profile.v0.1` | `ProviderCapability`, `ProviderProfile` | Profile/capability availability and safe health only; no endpoint or credential value is projected. Enabled, available, credential, capability, and health states must agree. |
| MCP | `pac.mcp.v0.1` | `MCPToolCapability`, `MCPServerProfile`, `ToolCallConfirmation`, `ToolCallRequest` | Servers and tools are declared explicitly. Read-only tools reject confirmation; state-changing tools require a short-lived owner confirmation bound to the exact request fingerprint. Authorization fails for undeclared/disabled tools, missing credentials, unhealthy servers, mismatched effects, or expired windows. |
| Phone action | `pac.phone_action.v0.1` | `PhoneActionRequest`, `PhoneActionPreview`, `PhoneActionConfirmation`, `PhoneActionOutcome` | Only App Intent, Shortcut, URL scheme, universal-link, and share-sheet handoffs are representable. Preview and confirmation bind the exact request fingerprint. `handed_off` never means target-app completion. |
| Health source | `pac.health_source.v0.1` | `HealthTrendProjection`, `HealthSourceSnapshot` | Only steps, active energy, heart rate, sleep, and workouts are representable. Content hashes bind canonical qualitative family projections and windows. Composition is deterministic and fails closed on source, revision, attribution, content, or snapshot-ID conflicts. |

## Shared Wire Rules

- Each object uses exact required fields; unknown or missing fields fail closed.
- Direct construction and `from_dict` use the same semantic validation.
- Boolean values are never accepted as integers or timestamps.
- Nested JSON is size/depth bounded, cycle checked, finite, deeply immutable,
  and defensively copied on output.
- Collections use canonical order and reject duplicate capability, tool, or
  health-family identities where order is part of the contract.
- Canonical ASCII JSON and SHA-256 fingerprints bind replay-sensitive intent.
- Validation errors contain fixed codes only and never echo rejected values.
- DTOs are frozen and slotted; request parameters and tool schemas are hidden
  from `repr`.

## Explicit Non-Claims

Acceptance of this manifest does not establish any of the following:

- a custom provider registry, encrypted secret store, provider fallback, or
  live provider health;
- an MCP connection, discovery process, tool execution, audit store, or chat
  integration;
- an iOS settings screen, phone action, target-app acknowledgement, background
  automation, message/notification access, or arbitrary app control;
- a concrete `HealthSource` adapter, HealthKit authorization, manual export,
  webhook, third-party API, real health data, or off-device transmission;
- signing, Personal Team device acceptance, TestFlight, App Store distribution,
  NAS/VPS/cloud change, or deployment.

## Next Gates

The contracts satisfied the dependency for `PAC-CUSTOM-PROVIDER-REGISTRY` and
the first MCP gateway task at the time of this contract acceptance. The
provider task was subsequently accepted as 9A/9B, and the bounded
`PAC-MCP-GATEWAY-READONLY` slice was accepted at product `2dc2948`; these are
historical dependency notes, not current queue instructions. The current next
task is `PAC-IOS-SUPPORTED-APP-ACTION`. At that historical point, the provider
task still required encrypted server-side secret handling and an explicit owner
fallback policy before runtime wiring; those requirements were addressed by
the later 9A/9B acceptances.

Phone-action execution and concrete health adapters remain later tasks. Any
real device, credential, provider, MCP server, health data, signing, or live
service work requires a new scope and the applicable L2/L3 gate.
