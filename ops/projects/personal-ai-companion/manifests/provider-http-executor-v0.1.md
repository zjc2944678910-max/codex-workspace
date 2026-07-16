# Provider HTTP Executor v0.1

Status: local source accepted at product `9ebda8c`, retained in current
`main@0e53f74`.

## Accepted Boundary

- Caller-opt-in OpenAI-compatible chat-completions executor only.
- Reuses validated Provider configuration and runtime-message contracts.
- Bearer-only authentication, HTTPS endpoint composition, redirects disabled,
  bounded timeout, and a 256 KiB streamed-response ceiling.
- Strict JSON media type and response-shape validation with fixed redacted
  failures.
- Injectable sender coverage; no test used an external network.

## Explicit Exclusions

- No default app, Cloud route, ModelRouter, or ChatRuntime wiring.
- No real Provider, endpoint, credential, prompt, response, or health probe.
- No deployment, live reconfiguration, sensitive privacy class, or fallback
  policy expansion.
