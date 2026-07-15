# PAC Persona Memory Contract v0.1

Date: 2026-07-11

Status: L1 local design contract. This document defines a future-safe contract
for persona use of approved memory summaries. It does not authorize a schema
change, a runtime read, an API call, an import, a model request, or any use of
real data or identity material.

## Route Lock

- target_project: `personal-ai-companion`
- target_surface:
  `ops/projects/personal-ai-companion/manifests/persona-memory-contract-v0.1.md`
  only
- project_root:
  `projects/products/personal-ai-companion`
- route_evidence: explicit owner request for the approved-memory contract for
  the companion persona
- forbidden_surfaces: real chats, private profiles, portrait or voice assets,
  databases, migrations, network, Git, GitHub, model providers, live devices,
  credentials, and runtime configuration

## Purpose And Scope

An **Approved Persona Memory Summary** (APMS) is a narrowly redacted,
reviewed, time-bounded projection that a companion persona may use to make a
response more helpful. It is not a source record, an identity profile, a chat
excerpt, a prompt dump, or a model-training example.

The contract applies to persona-facing use of a safe projection from the memory
layer. It aligns with the existing `MemoryAtom`, `access_scope`,
`prompt_projection`, provenance, review, and consent concepts, while adding an
explicit `viewer_scope` and lifecycle for the projection itself.

This contract does not:

- authorize use of a real person's likeness, name, voice, speech pattern,
  biography, portrait, or private message;
- make a candidate, inferred fact, raw transcript, vault payload, or
  `never_quote` material eligible for persona use;
- authorize cloud egress, speaker delivery, or a real device merely because a
  summary is approved; or
- prove that a current runtime, API, cache, database, or model implements this
  contract.

The owner-attested future visual-likeness slice is recorded separately in
[Visual Likeness Consent Boundary](visual-likeness-consent-boundary-v0.1.md).
That record does not widen APMS scope: an APMS may never contain, derive from,
or authorize a likeness asset. It also does not authorize voice, writing style,
private chats, provider upload, real-device display, or asset intake.

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative.

## Compatibility Anchors

- [Memory Layer v0.1](memory-layer-v0.1.md) supplies the baseline L1/L2/L3
  split, memory classes, provenance, consent, review, deletion, and projection
  vocabulary.
- [Memory Readiness Map](../reports/memory-readiness-20260711.md) is a dated
  evidence snapshot, not the current source of truth. Current facts live in the
  project [README](../README.md), with the remaining production boundary in the
  [Phase 4 readiness banner](../reports/memory-phase-4-readiness-20260714.md).
- [Companion Avatar and Persona Boundary](../reports/companion-avatar-and-persona-boundary-20260711.md)
  establishes the current non-human identity boundary and separate future
  identity/voice intake.
- [Visual Likeness Consent Boundary](visual-likeness-consent-boundary-v0.1.md)
  records the owner-attested future visual slice and its separate revocation
  and retention boundary; it is not APMS consent.
- [Product Blueprint](product-blueprint-v0.1.md) establishes that style is
  consent-scoped and revocable, not a grant to imitate a real person.

## Contract Boundary

An APMS is an access artifact derived from a reviewed source. It may be read
only for the stated purpose and only while every gate below remains true.

```text
reviewed promoted source
  -> normalized, redacted candidate summary
  -> consent and viewer-scope decision
  -> approved persona-memory summary
  -> request-time policy decision
  -> narrowly projected companion response
```

The contract is intentionally stricter than ordinary L2 recall:

- A candidate, rejected, deleted, expired, withdrawn, or review-pending source
  is never an APMS source.
- `source_kind=inference` is not eligible as a persona fact. It may only lead
  to a new summary after an owner independently confirms it as a fact and the
  normal review path completes.
- The summary MUST narrow, never broaden, the source's scope, sensitivity,
  retention, consent, and delivery policies.
- The summary has a maximum lifetime and a review deadline even when the source
  atom has a longer retention policy.
- A persona uses the summary as context, not as proof about a person, a
  relationship, or the person's current state.

## Approved Persona Memory Summary Fields

All identifiers below are opaque references. They MUST NOT embed a name,
message, source session, vault handle, credential, portrait reference, voice
reference, or other raw private value.

| Field | Required | Contract and validation rule | Purpose |
| --- | --- | --- | --- |
| `summary_id` | Yes | Opaque, unique, stable for one APMS revision. | Addresses this projection without exposing its source. |
| `contract_version` | Yes | `v0.1` for this contract. Unknown versions fail closed. | Makes policy interpretation explicit. |
| `summary_revision` | Yes | Monotonic integer. A changed text, scope, consent, or redaction result creates a new revision. | Prevents silent mutation of approved meaning. |
| `source_atom_ref` | Yes | Opaque reference to one promoted, non-deleted L2 source atom. A vault entry is never a direct source. | Preserves traceability without source content. |
| `source_kind` | Yes | A reviewed source classification, never an unverified inference. | Distinguishes the origin type for policy checks. |
| `source_provenance_digest` | Yes | Non-reversible digest or opaque provenance reference only. | Allows integrity and cascade matching. |
| `memory_class` | Yes | Only `preference`, `event`, `relationship`, `chat_summary`, `device_status`, or a safely abstract `style_signal` are eligible. Other classes deny. | Applies class-specific safety rules. |
| `access_scope` | Yes | Must be an eligible source scope: `owner_private`, `couple_shared`, or `group_safe_shared`. The summary cannot be wider than this value. | Retains the source's privacy boundary. |
| `viewer_scope` | Yes | One of `owner_private`, `couple_shared`, or `group_safe_shared`, narrowed to the request viewer and delivery mode. | Defines who may receive a response influenced by this summary. |
| `viewer_binding` | Yes | Opaque owner/viewer/entity binding plus trust requirement; no implicit identity matching. | Prevents use for a lookalike, unknown visitor, or unrelated session. |
| `persona_use_purpose` | Yes | One of `response_continuity`, `preference_adaptation`, `relationship_boundary`, or `safety_boundary`. `identity_emulation` is invalid. | Limits why the persona may use it. |
| `delivery_allowlist` | Yes | Explicit allowed delivery modes. Cloud model context and speaker delivery require separate request-time authorization. | Prevents a safe private projection from becoming a public output. |
| `summary_text` | Yes | Concise normalized statement. It MUST contain no verbatim transcript, direct identifier, address, secret, health value, intimate detail, raw style exemplar, or vault marker. | The only content the persona may receive. |
| `prompt_projection` | Yes | Must be `summary` for an APMS. `full`, `handle`, and `none` are not usable persona projections. | Keeps the projection bounded. |
| `sensitivity` | Yes | Must be no less restrictive than the source sensitivity. | Preserves minimum handling requirements. |
| `redaction_profile` | Yes | Named policy profile that states which classes of detail were removed or prohibited. | Makes redaction repeatable and testable. |
| `redaction_state` | Yes | `verified` is required for use. `unknown`, `failed`, or `not_applicable` deny use. | Blocks unsafe summaries when redaction cannot be established. |
| `source_review_state` | Yes | `owner_approved` is required. Pending, rejected, expired, or unknown review denies use. | Requires source review before persona use. |
| `review_ref` | Yes | Opaque review-item reference. | Connects the summary to its approval decision. |
| `reviewed_by_role` | Yes | Must identify the authorized review role, not a raw personal identifier. | Enables accountability. |
| `approved_at` | Yes | UTC timestamp set when the APMS revision is approved. | Starts lifecycle accounting. |
| `consent_requirement` | Yes | Existing semantic values: `none`, `explicit_required`, `explicit_granted`, or `denied`. | States whether consent is a prerequisite. |
| `consent_ref` | Conditional | Required when consent is explicit; opaque record reference only. | Links to a scoped consent decision. |
| `consent_subject_refs` | Yes | Opaque set of every data subject represented by the summary. Empty is valid only for a confirmed owner-only preference with no other subject. | Ensures all represented people are covered. |
| `consent_state` | Yes | `active`, `revoked`, `expired`, `denied`, or `unknown`. Only `active` satisfies an explicit requirement. | Makes withdrawal decisive at read time. |
| `consent_expires_at` | Conditional | Required for explicit consent. It bounds `expires_at`. | Prevents indefinite reuse of consent. |
| `issued_at` | Yes | UTC timestamp for this projection revision. | Establishes an auditable start. |
| `expires_at` | Yes | Non-null UTC timestamp. It MUST be no later than source expiry, consent expiry, or applicable class policy. | Makes persona access time-bounded. |
| `review_due_at` | Yes | Non-null UTC timestamp no later than `expires_at`. | Requires revalidation before stale use. |
| `lifecycle_state` | Yes | `active`, `withdrawn`, `expired`, `deleted`, `blocked`, or `superseded`. Only `active` is readable. | Makes all terminal states deny by default. |
| `withdrawn_at` | Conditional | Required for `withdrawn`; absent only before withdrawal. | Records effective withdrawal time. |
| `deletion_state` | Yes | `not_requested`, `requested`, `tombstoned`, or `completed`. Any state other than `not_requested` blocks use. | Separates immediate non-use from later physical deletion. |
| `policy_version` | Yes | Version of the consent, redaction, and disclosure rules evaluated. | Detects stale policy decisions. |
| `decision_trace_ref` | Yes | Opaque reference to metadata-only audit evidence. | Supports explainability without replaying content. |

### Prohibited Fields And Values

An APMS MUST NOT contain raw source text, source spans, raw chat/session IDs,
vault handles, encrypted payloads, embeddings, external provider prompt IDs,
portrait or image references, voice clips, voiceprint-like features, biometric
values, full names, contact details, addresses, credentials, private health
data, or unreviewed model inferences.

`partner_private`, `health_private`, `style_training`,
`memory_maintenance`, `sensitive_fact`, vault-associated material, and
`never_quote` are denied for APMS projection by default. A safe
`style_signal` is eligible only when it is an abstract response-shape rule,
passes owner review, and cannot identify or imitate a real person. A
`style_signal` derived in any part from another person's material always
requires active explicit consent for the exact persona-use purpose.

## Consent And Viewer-Scope Rules

Consent is purpose-, subject-, scope-, delivery-, and time-specific. It is not
transferred from a source atom to a new purpose automatically, and it is never
blanket consent for style imitation, voice, likeness, model training, cloud
egress, speaker output, or sharing.

1. A summary that represents another person, relationship, private style source,
   or consent-sensitive detail MUST list every represented subject and have
   active explicit consent for the exact persona-use purpose.
2. An owner may approve use of their own direct, low-risk preference only within
   `owner_private`, but approval still requires source review and expiry.
3. `viewer_scope` is an APMS projection scope, not a replacement for source
   `access_scope`. It MUST be equal to or more restrictive than
   `access_scope`.
4. Unknown or untrusted viewer identity is never upgraded by conversational
   context. It receives no owner-private summary. A shared-device request may
   use only an independently approved `group_safe_shared` summary.
5. Speaker delivery is stricter than private-screen delivery. It is allowed only
   for an explicit `group_safe_shared` viewer scope, an allowlisted speaker
   route, and the applicable request-time presence policy. If presence is
   unknown, no private summary may influence speech.
6. This contract grants no cloud-model egress. A future cloud route must pass a
   separate egress approval that names the provider, endpoint, retention and
   logging policy, and projection boundary.
7. Any unavailable consent record, consent check, identity binding, or policy
   version mismatch is a denial, not a retry using less strict defaults.

## Source Review And Redaction Rules

Before an APMS becomes `active`, all of the following MUST be true:

1. The source is a promoted L2 atom with complete provenance metadata and no
   active delete, disable, withdrawal, expiry, or review hold.
2. The source has passed normalization. Long quotes, raw chat excerpts, and
   sensitive payloads are rejected or stay outside the APMS boundary.
3. The owner has approved the source-to-summary transformation and its stated
   persona-use purpose. Approval of the source alone is insufficient if the
   projection changes scope, purpose, delivery, or wording.
4. The summary is independently redaction-verified. A reviewer cannot waive a
   failed redaction check by marking it approved.
5. The summary is minimised to the smallest safe fact or response-shape rule.
   It cannot assert unobserved motives, emotions, relationship status, or a
   real person's identity.
6. The APMS receives a finite expiry and review deadline. A new review creates
   a new revision; it does not silently extend the old one.

## Read, Deny, Withdraw, And Delete Flows

### Read Flow

| Step | Required decision | If the decision fails |
| --- | --- | --- |
| 1 | Parse a request with `summary_id`, requesting viewer binding, delivery mode, persona-use purpose, and request time. | Deny without loading summary text. |
| 2 | Resolve the request through `InteractionEnvelope`, `IdentityKernel`, and the current viewer trust boundary. | Treat the viewer as unknown and deny private use. |
| 3 | Load only APMS metadata needed for eligibility. Confirm `lifecycle_state=active`, no deletion request, and current policy version. | Block and write metadata-only audit evidence. |
| 4 | Check `access_scope`, `viewer_scope`, viewer binding, delivery allowlist, and speaker presence policy. | Return no memory projection and use the appropriate generic response. |
| 5 | Check consent state, purpose, represented subjects, and consent expiry. | Block immediately; do not substitute a nearby or older consent. |
| 6 | Check source review, source lifecycle, source provenance, APMS expiry, and review deadline. | Block as unreviewed, stale, or unverifiable. |
| 7 | Check `redaction_state=verified` and scan the supplied summary for prohibited markers or values. | Reject the projection and do not retry with raw source data. |
| 8 | Project only `summary_text` for the allowlisted use. The persona must not expose its metadata, source, consent, or audit trace. | N/A. |
| 9 | Record an allow or deny event containing actor class, decision reason code, policy version, timestamp, and opaque references only. | Audit failure itself fails closed for protected scopes. |

No call path may read a source atom, a vault payload, a raw source, or a real
identity asset merely to produce a degradation response.

### Deny Flow

A denial returns no summary text, source reference, consent state, subject
identity, or indication that a particular memory exists to an untrusted viewer.
The system records only a metadata-only reason code such as `viewer_mismatch`,
`consent_missing`, `consent_revoked`, `source_unreviewed`,
`redaction_failed`, `expired`, `delivery_not_allowed`, or
`policy_unavailable`.

Denial never falls back to raw recall, a candidate memory, an inferred profile,
an unscoped style rule, or an alternate delivery channel.

### Withdrawal And Revocation Flow

Withdrawal is a consent decision. Revocation takes effect at the recorded
effective time and wins over every prior approval.

1. Accept a withdrawal only from the owner, represented subject, or an
   explicitly authorized consent administrator under the relevant scope.
2. Match affected APMS revisions by `consent_ref`, represented subject,
   provenance digest, and source reference. A failed or ambiguous match blocks
   the candidate summary pending manual review; it never leaves it readable.
3. Set affected summaries to `lifecycle_state=withdrawn`, record
   `withdrawn_at`, and invalidate their read eligibility immediately.
4. Invalidate prompt packs, response queues, local caches, and derived summary
   revisions that carry the affected summary ID or provenance. A cache that
   cannot prove it is fresh is treated as invalid.
5. Keep only metadata needed to prove the action and perform a later deletion
   decision. Do not retain summary text in an audit event.
6. A future restoration requires fresh active consent, fresh source review,
   fresh redaction verification, and a new APMS revision. Revocation is never
   reversed by re-enabling a class or by restoring an old cache entry.

### Deletion And Expiry Flow

Deletion request, withdrawal, source disable, source deletion, redaction
failure, review expiry, and policy mismatch all make the APMS non-readable at
once. `deletion_state=requested` and `deletion_state=tombstoned` are
therefore read denials even before physical deletion completes.

Physical deletion, secure wiping, backup handling, key destruction, and any
change to a real database remain separate L3 decisions. This contract defines
the required semantic result: no further persona use after the effective
withdrawal, deletion, or expiry time. It does not claim that a current runtime
can enforce physical deletion across storage systems.

## Degraded Persona Responses

When an APMS cannot be used, the companion continues with a generic,
non-memory-based response. It MUST NOT invent a replacement fact, hint at a
blocked person's identity, quote a blocked detail, or turn the denial into a
new memory candidate.

| Situation | Allowed private-owner response intent | Required shared or unknown-viewer response intent |
| --- | --- | --- |
| No approved summary or unreviewed source | State that there is no confirmed context to rely on; invite the user to state their current preference. | Ask for current context without saying whether any private memory exists. |
| Consent revoked, deletion requested, or class disabled | State only that the companion will not use that remembered detail and invite fresh, voluntary context. | Do not mention revocation, deletion, or memory existence. Use a generic context request. |
| Expired or review-due summary | State that no current confirmed preference is available and ask what is wanted now. | Same generic context request; no lifecycle detail. |
| Redaction, policy, audit, or identity check unavailable | State that the response will stay general rather than rely on private context. | Keep the reply general without exposing a security or system failure. |
| Speaker route or presence is not trusted | Use only separately approved group-safe information, or give a neutral response. | Same neutral response; never redirect the private fact to speech. |

Illustrative private-owner wording is: "I do not have confirmed private context
I can use here. Tell me what matters now." Illustrative shared wording is:
"I do not have enough confirmed context for that. Tell me how you would like
to proceed." Product localization may change tone but not disclosure behavior.

## Privacy Failure Modes

| Failure mode | Required fail-closed behavior | Metadata-only evidence |
| --- | --- | --- |
| Missing, unknown, expired, or revoked consent | Deny use immediately. | Reason code, opaque consent reference, timestamp. |
| Viewer identity missing, mismatched, or untrusted | Deny private and couple-scoped use; do not infer identity from wording. | Viewer trust result and decision code. |
| Source is candidate, inferred, unreviewed, deleted, disabled, or lacks provenance | Deny before summary text is loaded. | Source state and opaque reference. |
| Redaction profile missing, stale, or failed | Reject the summary and do not read the source to repair it automatically. | Redaction profile/version and reason code. |
| Summary contains a vault marker, raw quote, direct identifier, identity asset reference, or other prohibited value | Reject, quarantine for review, and do not project a partial source. | Sanitized rule ID only, never the rejected value. |
| APMS or consent expiry reached | Deny and require a new review; never auto-renew. | Lifecycle decision and timestamp. |
| Revocation cannot enumerate every derived revision or cache | Block all summaries linked to the affected source/consent family until reconciliation proves safety. | Cascade hold reason and opaque relation keys. |
| Speaker route, presence proof, or delivery policy is unavailable | Suppress the APMS from speaker output. | Delivery decision and route class. |
| Policy or audit service unavailable | For protected scopes, deny use and keep the response generic. | Availability state if it can be recorded safely. |
| Prompt injection asks the persona to ignore scope, consent, or redaction | Treat request text as untrusted; policy gates remain outside prompt control. | Injection-policy denial code. |
| Cloud egress approval is absent or cannot be verified | Do not send the APMS to a cloud provider. | Egress-policy denial code. |
| Denial text could reveal memory existence to a non-owner | Replace it with the generic shared response. | Disclosure-safe response class only. |

## Future Real-Person Likeness And Voice Gate

The companion remains a non-human persona by default. An approved memory
summary cannot authorize a real-person avatar, portrait, illustration derived
from a person, name, voice, speech pattern, biography, or identity imitation.

Before any future `PAC-COMPANION-IDENTITY-VOICE-INTAKE` may move past intake,
all of the following must be recorded as separate, affirmative, person-specific
approvals. No material is collected, opened, generated, transmitted, or
processed by this contract.

| Required threshold | Required decision boundary |
| --- | --- |
| Subject and authority | The represented person and the party authorized to consent are established through an approved privacy process. Affection, relationship status, ownership of a device, or a third-party request is not sufficient. |
| Modality separation | Portrait/photo, illustration, video, recorded voice, voice characteristics, speech pattern, name, biography, and style rule each require separate scope. Consent for one modality does not grant another. |
| Source-material scope | The record names exactly which future material classes are authorized and forbids substitute sources, public-web collection, and unapproved derivations. |
| Purpose and transformation | The record names allowed use such as display, one private reply, synthesis, evaluation, or training. It states whether derivatives, embeddings, models, and provider processing are prohibited or permitted. |
| Output and audience | The record names private screen, local speaker, remote route, sharing, export, and archival surfaces. Any unnamed surface is denied. |
| Storage, access, and retention | The record names storage boundary, operators, access method, retention, backups, deletion handling, and audit limits. |
| Revocation path | The subject has a clear withdrawal mechanism. A synthetic revocation test must demonstrate immediate serving stop before any real material task is approved. |
| Independent approval | Owner approval, subject consent, and a technical scope review are all present. They are not collapsed into a generic checkbox. |
| L3 execution gate | Actual intake, provider use, configuration, model work, asset processing, speaker/device output, storage changes, or deletion work needs a separately scoped L3 authorization. |

On withdrawal of a real-person identity or voice authorization, future design
must immediately stop serving, generation, replay, and new derivation for the
affected scope. It must invalidate known caches and queues, then follow a
separately approved L3 deletion and backup plan. It must not claim complete
physical deletion without evidence from that later plan.

## Synthetic Fixture And Test Plan

This is a future test plan only. Fixtures use synthetic opaque identifiers and
invented neutral text. They MUST NOT include real chats, names, photos, voice
clips, profile material, database rows, device data, credentials, or network
responses.

### Fixture Families

| Fixture | Synthetic setup | Expected result |
| --- | --- | --- |
| `approved_owner_preference` | Reviewed owner-private preference, verified redaction, active owner consent where required, valid viewer binding, and future expiry. | Private-owner text projection allowed. |
| `approved_style_rule` | Abstract, consented response-shape rule with no source quote or real-person markers. | Private text use allowed only for its stated purpose; no identity-emulation use. |
| `candidate_or_inference` | Candidate source or `source_kind=inference`, even with plausible summary text. | Denied before summary projection. |
| `viewer_scope_mismatch` | Active APMS requested by a different, unknown, or untrusted viewer. | Denied with shared-safe degradation wording. |
| `speaker_presence_unknown` | Owner-private APMS requested for speaker output with missing presence proof. | Suppressed; no private fact reaches speaker projection. |
| `consent_missing_or_expired` | Explicit consent required but absent, unknown, or past expiry. | Denied and metadata-only audit event. |
| `consent_revocation_cascade` | Multiple revisions and cached prompt-pack references share one synthetic consent reference. | All become non-readable at the revocation effective time. |
| `deletion_or_source_disable` | Summary deletion requested, source soft-deleted, or class disabled. | Immediate non-use even when physical deletion is pending. |
| `redaction_probe` | Summary includes synthetic direct-ID token, raw-quote token, or `[VAULT:synthetic]` marker. | Rejected without reading a raw source property. |
| `policy_or_audit_unavailable` | Consent, policy, or audit dependency returns an unavailable state. | Protected scope denies and emits generic response behavior. |
| `identity_voice_incomplete` | One or more future identity/voice thresholds absent. | No material-processing or output route can be approved. |
| `identity_voice_revoked` | Complete synthetic record becomes revoked while output is queued. | Serving and queue projection stop; later deletion is reported as a separate L3 plan. |

### Required Future Tests

1. Validate every required APMS field and reject unknown contract or policy
   versions.
2. Prove a valid summary can be read only by its correctly bound viewer, for
   its allowed purpose and delivery mode.
3. Prove scope never broadens from source `access_scope` to `viewer_scope`
   or delivery allowlist.
4. Prove candidates, inferences, review-pending sources, `never_quote`, vault,
   sensitive, health, partner-private, and raw style-source cases fail closed.
5. Prove consent hydration, expiry, revocation, and post-revocation cache
   invalidation all deny use. Include a same-timestamp read/revocation race.
6. Prove redaction rejects synthetic direct identifiers, transcript markers,
   vault markers, identity asset references, and prohibited source properties.
7. Use poison-object fixtures whose raw-source and provenance content getters
   raise if read; denial and degradation paths must not access them.
8. Prove deletion request, source deletion, source disable, expiry, and review
   deadline all remove persona eligibility immediately.
9. Prove private-owner and shared/unknown degradation responses do not echo
   summary text, source reference, consent state, subject identity, or the
   existence of a blocked memory.
10. Prove speaker projection fails when presence or delivery authorization is
    missing, and does not fall back to a cloud or private-text route.
11. Prove all allow and deny audits contain reason codes and opaque references
    only, with no summary text or raw source values.
12. Prove the likeness/voice gate denies each incomplete or revoked synthetic
    authorization and never loads an asset fixture.
13. Keep the contract test seam pure: no real database, filesystem source,
    network, model provider, device, migration, or external credential access.

## Conformance Checklist

An implementation may claim APMS v0.1 conformance only when it can demonstrate
with synthetic fixtures that:

- all field, source-review, consent, viewer-scope, redaction, expiry, and
  lifecycle requirements above are enforced before persona projection;
- revocation and deletion intent stop future use immediately and invalidate
  derived caches or place them under a fail-closed hold;
- a degradation response never leaks blocked memory existence to an untrusted
  viewer;
- speaker and cloud egress remain separately gated; and
- no real-person likeness or voice task begins without the separate intake and
  L3 authorization described above.

## Implementation Status And Next Boundary

This manifest resolves the contract semantics only. It does not add a data
model, endpoint, cache, migration, retention executor, identity-consent store,
or deletion mechanism. The dated memory readiness map remains historical
evidence; the project README and Phase 4 supersession banner control current
implementation facts. Older readiness plans remain design intent where they
conflict.

Any future implementation slice must remain synthetic-only unless a new task
explicitly authorizes a broader privacy scope. Any real-data read, schema or
state change, asset handling, cloud egress, identity/voice processing, or
permanent deletion remains separately risk-gated.
