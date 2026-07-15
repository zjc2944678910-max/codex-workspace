# PAC HealthKit Release Readiness

- Audit ID: `PAC-HEALTHKIT-RELEASE-READINESS`
- Original audit date: 2026-07-13
- Snapshot revalidation date: 2026-07-14
- Task level: L1 local release-readiness audit
- Historical baseline: `e15e553e2aed5739de37f7f6a05e954c06a80b1b`
- Snapshot canonical baseline: `b8462a9a81636a93aae356e9d038a871107571b1`
- Snapshot product branch: `codex/initial-private-publish`
- Product evidence source (read-only):
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Report source: `ops/projects/personal-ai-companion/reports/healthkit-release-readiness-20260713.md`

Historical snapshot note (updated 2026-07-15): this report preserves the
2026-07-13/14 audit against the commits and compatibility branch named above;
they are evidence for that audit window, not the current product authority. Use
the project [README](../README.md) and product `main@72258a1` for current facts.
The five-family, trend-only local chat projection exists, but no transmission of
a health summary through the source-gated authenticated cloud-chat path has been
accepted. Local HealthKit authorization and off-device health-summary
transmission remain separate gates.

## Route Lock And Boundaries

| Field | Value |
| --- | --- |
| target_project | `personal-ai-companion` |
| target_surface | HealthKit release readiness for the committed iOS host |
| project_root | `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion` |
| route_evidence | Explicit task route lock, registered project ops surface, historical commit `e15e553`, and current canonical commit `b8462a9` on `codex/initial-private-publish` |
| forbidden_surfaces | Product working tree writes, Apple Developer/App Store Connect login, signing/capability changes, real device, HealthKit authorization or samples, NAS/VPS/live services, deployment, credentials, shared ops indexes |

The canonical product checkout had unrelated untracked control material at both
audit points. The original conclusions came from the immutable `e15e553`
snapshot. The 2026-07-14 revalidation used tracked files at `b8462a9`, targeted
Git history/diffs, local smoke binaries, plist validation, and an unsigned
Simulator build. Neither pass started the App, called `HKHealthStore`, requested
authorization, inspected a real device, or accessed a health sample.

## Decision

**Not ready to claim external release readiness.** The committed source is
ready for the next gated release-preparation slice: it has a bounded
read-only five-type implementation, the HealthKit entitlement/capability, a
purpose string, resolved dependencies, and a successful unsigned Simulator
compile. It lacks the release evidence and owner-controlled materials needed
to make a TestFlight or App Store claim: no development-signing/device
evidence, no archive/distribution evidence, no App Store Connect App Privacy
record, no verified public privacy policy, and no account-deletion path in the
current canonical source.

This is not a finding that HealthKit access is unsafe. It is a finding that
source-level and unsigned-build evidence must not be promoted into device or
distribution evidence.

## 2026-07-14 Current Canonical Revalidation

- The HealthKit provider, five-case signal enum, and identifier mapping are
  byte-equivalent between `e15e553` and current canonical `b8462a9`. The
  original five-type, read-only scope conclusion therefore remains current.
- `Info.plist` gained local StackChan networking declarations after the original
  audit; its HealthKit purpose string is unchanged. The base HealthKit
  entitlement, capability declaration, iOS 17.0 target, and lack of clinical or
  Health Records entitlement remain unchanged.
- The default `AppBridgeClientFactory` still returns `MockLANBridgeClient` and
  marks live transport unavailable. A separate bounded
  `LCDScreenE2ELANBridgeClient` can issue owner-private screen commands, but its
  chat `send` method rejects every request. Health summaries therefore have no
  current live path; enabling one still requires a new data-flow and App Privacy
  review.
- Current canonical contains Google/Authentik account authentication but no
  account-deletion API route or iOS deletion UI. A separate local product branch
  contains candidate privacy/account-deletion work through `4863840`, but that
  commit is not an ancestor of canonical and is not current release evidence.
- Current canonical still has no first-party `PrivacyInfo.xcprivacy`, published
  privacy policy artifact, or App Store Connect App Privacy export. Dependency
  privacy manifests are included in the unsigned Simulator product.
- Current local verification passed three HealthKit smoke executables, plist
  lint for the host and entitlement file, and an unsigned Simulator Host build
  with Xcode's iPhone Simulator 26.5 SDK.
- Canonical README/design notes record a 2026-07-12 Simulator build, install,
  launch, and successful opening of Apple's HealthKit authorization controller.
  No durable screenshot or raw run log was found for that event, it was not
  reproduced during this revalidation, and it is not real-device evidence.
- Both current Debug and Release build settings leave `DEVELOPMENT_TEAM` empty;
  no current archive, distribution-signing, TestFlight, or App Store evidence
  was found.

## Confirmed Product Scope

### Authorization and read scope

`HealthSignalKind` contains exactly five cases and
`HealthTrendReadScope.typeIdentifierBySignal` maps them one-for-one:

| Signal | HealthKit identifier | Authorization/read behavior |
| --- | --- | --- |
| steps | `HKQuantityTypeIdentifierStepCount` | Read only; 24-hour cumulative sum |
| active energy | `HKQuantityTypeIdentifierActiveEnergyBurned` | Read only; 24-hour cumulative sum |
| heart rate | `HKQuantityTypeIdentifierHeartRate` | Read only; 24-hour discrete average |
| sleep | `HKCategoryTypeIdentifierSleepAnalysis` | Read only; sleep-duration aggregate over a 36-hour window |
| workouts | `HKWorkoutTypeIdentifier` | Read only; count and total-duration aggregate over seven days |

Evidence:

- `ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Models/HealthSignalKind.swift:3-22`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionCore/Models/HealthAuthorizationModels.swift:105-113`
- `ios/PersonalAICompanion/Sources/PersonalAICompanionApp/HealthKit/HealthKitHealthProvider.swift:25-35, 373-424`

Both authorization paths pass an empty share set:
`requestAuthorization(toShare: [], read: ...)`. The registry produces only the
five types above and has no per-object authorization types at current canonical.
The source deliberately excludes correlations and medication dose event types
from an authorization request.

The implementation does locally read `HKCategorySample` values for sleep and
`HKWorkout` values for workouts in order to calculate the aggregates. It uses
`HKObjectQueryNoLimit` within the stated windows. That is local transient
processing in the source, not proof that no raw samples are ever read after a
user grants the corresponding category. The confirmed minimization boundary is
that raw samples are not placed in the chat context described below.

### Chat projection

`HealthContextSnapshot` has only `sourceKinds`, a window description, summary
text, and an inference marker. Its `sourceKinds` type is the same five-case
`HealthSignalKind` enum. The iOS provider produces at most these five summary
fragments: steps, active energy, average heart rate, sleep duration, and
workout count/duration. It joins them into one trend-oriented summary and adds
the non-clinical disclaimer.

Evidence:

- `HealthKitHealthProvider.swift:126-187`
- `HealthContextSnapshot.swift:3-19`
- `ChatViewModel.swift:246-350`

Chat includes this object only when both the per-message toggle and
`settings.healthContextEnabled` are true. It passes the object through the
`LANBridgeClient` contract, so the type is serializable and a future real
bridge could transmit it. At current canonical `b8462a9`, however, the default
factory returns `MockLANBridgeClient`, and the factory reports
`canStartLiveTransportInCurrentPhase: false`. The separate bounded LCD client
has a local-network transport for owner-private screen commands, but its chat
`send` method throws `unsupportedCommand`.

Evidence:

- `AppBridgeClientFactory.swift:49-110`
- `AppEnvironment.swift:19-75`
- `InteractionEnvelope.swift:3-43`
- `LANBridgeClient.swift:59-94`
- `LCDScreenE2ELANBridgeClient.swift:15-64`

Thus this audit confirms *local aggregation plus the current offline mock
transport*. It does not claim that a future live transport would keep the
summary local; that scenario requires a new privacy and App Privacy review.

## Host Configuration And Dependencies

| Area | Confirmed evidence | Release interpretation |
| --- | --- | --- |
| HealthKit purpose string | `Info.plist` has `NSHealthShareUsageDescription`: used to read user-selected local health/fitness data and generate a trend summary. | Present, but broad. It does not name the five categories or state the chat-context boundary. |
| Entitlement | `PersonalAICompanionHost.entitlements` contains only `com.apple.developer.healthkit = true`. | Base HealthKit entitlement is present. |
| HealthKit capability | `project.pbxproj` has `SystemCapabilities.com.apple.HealthKit.enabled = 1`; `CODE_SIGN_ENTITLEMENTS` names the entitlement file. | Xcode project declares the capability and packages the entitlement source. |
| Clinical/Health Records | No `com.apple.developer.healthkit.access` entitlement key or Health Records/clinical purpose string exists in the current host plist/entitlements. The actual read registry contains no clinical type. | No source-level clinical claim or entitlement was found. This does not inspect the Apple Developer portal. |
| Minimum platform | Both Debug and Release settings use `IPHONEOS_DEPLOYMENT_TARGET = 17.0`. | The release target is iOS 17.0 or later. |
| Signing configuration | Both current Debug and Release settings leave `DEVELOPMENT_TEAM` empty. | No current team selection or distribution-signing evidence is encoded in the project. |
| Google dependency | `Package.swift` depends on `GoogleSignIn`; `Package.resolved` pins `GoogleSignIn-iOS` to `9.2.0` with AppAuth, App Check, GoogleUtilities, GTMAppAuth, GTMSessionFetcher, InteropForGoogle, and Promises. | Third-party SDK privacy declarations and all auth/network behavior need independent release disclosure review. |

Relevant baseline paths:

- `ios/PersonalAICompanion/XcodeHost/Info.plist:52-55`
- `ios/PersonalAICompanion/XcodeHost/PersonalAICompanionHost.entitlements:5-6`
- `ios/PersonalAICompanion/XcodeHost/PersonalAICompanionHost.xcodeproj/project.pbxproj:130-134, 233-272`
- `ios/PersonalAICompanion/Package.swift:199-218`
- `ios/PersonalAICompanion/Package.resolved:1-78`

## Privacy Materials

### Present in source or built dependencies

- The first-party `Info.plist` contains a HealthKit read-purpose string.
- The first-party host contains the base HealthKit entitlement and Xcode
  capability declaration.
- The source produces aggregate trend text rather than serializing raw
  `HKSample` objects into `HealthContextSnapshot`.
- After dependency resolution, both audited unsigned Simulator products
  contained nine
  third-party bundle `PrivacyInfo.xcprivacy` files: AppAuth, AppAuthCore,
  FBLPromises, GTMAppAuth, GTMSessionFetcherCore, GoogleSignIn,
  GoogleUtilities Environment/Logger/UserDefaults. The resolved checkout
  contained 20 manifest files across all package products.

### Missing from the first-party release source

- No first-party `PrivacyInfo.xcprivacy` exists at either `e15e553` or current
  canonical `b8462a9`; source-tree scans excluding build output found no such
  file.
- No App Store Connect App Privacy questionnaire/export is in source control.
  Portal content was intentionally not inspected.
- No publishable privacy policy artifact or URL was found in current canonical.
  A draft and disclosure worksheet exist only on a separate local candidate
  branch, so publication and current content remain unconfirmed.
- Current canonical supports external account authentication but contains no
  account-deletion API route or in-app deletion UI. This is a confirmed release
  gap, not merely an applicability question. Candidate deletion work on a
  separate local branch must be reviewed and integrated before it can count as
  canonical evidence.

### Required manual disclosure decisions

The release owner must complete these against the final archive and actual
production behavior, rather than copying this audit into App Store Connect:

1. Declare whether health information is collected, linked, used for app
   functionality, or transmitted off-device after any real bridge is enabled.
   The current baseline does not enable that bridge.
2. Reconcile every final third-party SDK and its manifest with actual SDK
   initialization and data flows, including Google sign-in/auth flows.
3. Publish and link an accurate privacy policy. It must cover health summaries,
   local retention, remote services, account lifecycle, and deletion process.
4. Confirm the App Privacy answers in App Store Connect against a signed,
   release-candidate archive; this audit cannot access that portal.
5. Decide whether to add a first-party privacy manifest after a required-reason
   API inventory. Its absence is not itself evidence of compliance or
   noncompliance.

## Four-Stage Evidence Matrix

| Stage | Current evidence | What it proves | What it does not prove | Gate for next action |
| --- | --- | --- | --- | --- |
| Simulator | Unsigned iOS Simulator builds completed from historical `e15e553` and current canonical `b8462a9`; three current HealthKit smoke executables passed. Canonical docs record a 2026-07-12 launch and authorization-controller opening, without a retained screenshot/raw log. No simulator was launched during revalidation. | The current host and dependencies compile for `iphonesimulator` without code signing, and source-level scope/prompt/rollback invariants pass. The historical runtime note is supporting documentation only. | Durable prompt evidence, granted/denied behavior, real-device HealthKit availability, entitlement acceptance, hardware, or distribution. | L1 can improve local source/build evidence; any new runtime authorization remains outside this audit. |
| Development-signed device | Not performed. No certificate, profile, device, or signing account state was read. | Nothing. | Device installation, capability provisioning, HealthKit prompt behavior, selected-category behavior, and real sample handling. | First L2 read-only check of developer account/capability/device prerequisites; any signing/install/authorization action is L3 after `进入修复阶段`. |
| TestFlight | Not performed. No App Store Connect login or build upload. | Nothing. | Archive validity, processing, beta entitlement behavior, tester installation, or App Privacy completion. | L2 may inspect account/readiness only; archive/upload/tester actions are L3 after `进入修复阶段`. |
| App Store | Not performed. No App Store Connect submission/review evidence. | Nothing. | Store acceptance, privacy labels, policy link validation, account-deletion review, or HealthKit policy acceptance. | L2 may inspect read-only submission prerequisites; metadata mutation/submission is L3 after `进入修复阶段`. |

An unsigned build is deliberately recorded only in the Simulator row. It is not
substituted for a signed device, TestFlight, or App Store evidence item.

## Minimal Future Signed-Device Acceptance Plan

This is a procedure for a separately authorized execution, not work performed
by this audit.

1. Freeze the release-candidate commit and compare its five identifiers,
   entitlement, purpose string, and dependency lockfile to this report.
2. Perform an L2, read-only verification of the correct Apple Developer
   team, App ID capability, provisioning state, and dedicated test-device
   prerequisites. Do not alter any portal state at that step.
3. Only after the user explicitly says `进入修复阶段`, create/install a
   development-signed build on a dedicated non-personal test device.
4. Before accepting any system prompt, verify the app's intended set is exactly
   steps, active energy, heart rate, sleep, and workouts; confirm the app asks
   to share no type.
5. Exercise the deny/cancel path first and verify the app remains usable with
   no health context. Do not inspect, export, log, or retain health samples.
6. If an approved later test needs to validate summaries, use only the
   separately authorized test plan and document the sample source, retention,
   network state, and result outside this report. Re-run App Privacy review if
   a real bridge or any off-device transmission is enabled.

Stop immediately if any of these occur:

- a non-five-type category, write/share type, clinical/Health Records type, or
  unexpected system scope appears;
- signing/capability settings differ from the reviewed baseline;
- a real health sample would be read without the separately authorized test
  plan;
- any health summary reaches a live bridge, analytics, logs, cloud service, or
  third-party SDK without a fresh data-flow and disclosure decision;
- the test requires Apple account, device, certificate, or portal modification
  before the L2/L3 gates above have been satisfied.

## Apple Public References

All links below were fetched publicly with HTTP 200 on 2026-07-13. No Apple
account session was opened.

| Topic | Public Apple reference | Audit use |
| --- | --- | --- |
| HealthKit authorization | [Authorizing access to health data](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data) | Supports authorization and user-consent review. |
| HealthKit entitlement | [HealthKit Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit) | Supports entitlement/capability review. |
| Privacy manifests | [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) | Supports first- and third-party manifest inventory. |
| Manifest declarations | [Describing data use in privacy manifests](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests) | Supports final data-use manifest review. |
| App Privacy | [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/) | Requires owner confirmation in App Store Connect; no portal evidence was read. |
| App Review | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Drives minimum-permission, privacy policy, data handling, and review-risk assessment. |
| Account deletion | [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) | Current canonical supports account authentication but lacks deletion; candidate work outside canonical does not close this release gap. |

## Local Verification

The original commands used an exported `e15e553` snapshot under `/tmp`. The
2026-07-14 pass ran only tracked-source reads, local smoke binaries, plist lint,
and an unsigned build against current canonical `b8462a9`; it did not change
product source or access private/runtime data.

| Check | Result | Limit |
| --- | --- | --- |
| `plutil -lint` for `Info.plist` and entitlement file | Passed for both. | Syntax only; does not prove signing or portal configuration. |
| `swift package resolve` | Passed with the pinned package graph, including `GoogleSignIn-iOS 9.2.0`. | Dependency resolution only; does not inspect runtime service behavior. |
| `swift run PersonalAICompanionHealthPermissionGateSmoke` | Passed. | Exercises source-level five-type mapping with mocks; no HealthKit authorization or samples. |
| `xcodebuild ... -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO ... build` | Passed and produced `PersonalAICompanionHost.app` for Simulator. | Unsigned compile only; no launch, simulator authorization, device, archive, TestFlight, or App Store evidence. |
| Source-tree scan for `.xcprivacy` | No first-party manifest at either baseline; current resolved dependencies contain 20 manifests and the unsigned product includes nine dependency manifests. | Does not answer App Store Connect App Privacy questions. |
| `git diff --quiet e15e553..b8462a9 -- <HealthKit core paths>` | Passed; the provider, signal enum, and identifier mapping are unchanged. | Does not prove runtime behavior or Apple portal state. |
| Three current HealthKit smoke executables | Permission gate, prompt runtime evidence, and rollback policy all passed at `b8462a9`. | Mock/source contract evidence only; no authorization prompt or health sample. |
| Current `plutil -lint` and unsigned Simulator Host build | Both plist files passed; `xcodebuild` ended with `BUILD SUCCEEDED` using the iPhone Simulator 26.5 SDK. | Still not signing, device, archive, TestFlight, or App Store evidence. |
| Current account-deletion and first-party privacy-material scans | No deletion route/UI, first-party manifest, publishable policy, or App Privacy export in canonical. | A separate local candidate branch is not canonical evidence. |

The audit attempted the optional Sub2API read-only reviewer step, but this
environment exposed no `sub2api_model_pool` MCP tool. No external model was
used and no private material was sent outside the workspace.

## Status

**completed**

- Historical and current-canonical source/configuration audit,
  privacy-material inventory, public Apple-reference check, plist validation,
  package resolution, three current HealthKit smokes, and unsigned Simulator
  builds.

**confirmed**

- Five HealthKit read categories only; no write/share set; chat summary is
  bounded to the same five enum cases; base HealthKit entitlement/capability,
  iOS 17.0 minimum, GoogleSignIn dependency, and mock-default chat bridge
  boundary are present at current canonical `b8462a9`; the bounded live LCD
  client does not accept chat sends.

**unconfirmed**

- Apple Developer portal capability/provisioning, device behavior, final signed
  archive, TestFlight/App Store status, App Privacy questionnaire, published
  privacy policy, final runtime data flows, and production transport behavior.

**risks**

- The purpose string is present but not itemized; local raw samples are used
  transiently to derive sleep/workout aggregates; a future live bridge can
  serialize the summary; first-party privacy-manifest and App Privacy material
  are absent from current canonical; account deletion is absent despite active
  account authentication; Google SDK disclosure needs final archive/runtime
  review.

**next steps**

| Follow-on | Required level |
| --- | --- |
| Review and deliberately integrate or replace the non-canonical privacy/account-deletion candidate work; improve purpose wording, first-party privacy-manifest coverage, and local release documentation | L1 local implementation/review |
| Inspect Apple Developer/App Store Connect state, certificates, profiles, devices, or submitted metadata without changing them | L2 read-only audit |
| Change capabilities/signing/profiles, install a signed device build, request HealthKit authorization, read samples, archive/upload, change store metadata, TestFlight, or App Store submission | L3 only after explicit `进入修复阶段` |
