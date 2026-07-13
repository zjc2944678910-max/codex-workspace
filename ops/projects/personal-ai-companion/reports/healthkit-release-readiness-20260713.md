# PAC HealthKit Release Readiness

- Audit ID: `PAC-HEALTHKIT-RELEASE-READINESS`
- Date: 2026-07-13
- Task level: L1 local release-readiness audit
- Baseline: `e15e553e2aed5739de37f7f6a05e954c06a80b1b`
- Product branch at audit start: `codex/initial-private-publish`
- Product evidence source (read-only):
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- Report source: `ops/projects/personal-ai-companion/reports/healthkit-release-readiness-20260713.md`

## Route Lock And Boundaries

| Field | Value |
| --- | --- |
| target_project | `personal-ai-companion` |
| target_surface | HealthKit release readiness for the committed iOS host |
| project_root | `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion` |
| route_evidence | Explicit task route lock, registered project ops surface, and commit `e15e553` on `codex/initial-private-publish` |
| forbidden_surfaces | Product working tree writes, Apple Developer/App Store Connect login, signing/capability changes, real device, HealthKit authorization or samples, NAS/VPS/live services, deployment, credentials, shared ops indexes |

The canonical product checkout had unrelated uncommitted changes at audit start.
All product conclusions below therefore come from `git show` or `git grep` at
the immutable baseline, never from that checkout's working tree. The audit did
not start an app, call `HKHealthStore`, request authorization, inspect a real
device, or access a health sample.

## Decision

**Not ready to claim external release readiness.** The committed source is
ready for the next gated release-preparation slice: it has a bounded
read-only five-type implementation, the HealthKit entitlement/capability, a
purpose string, resolved dependencies, and a successful unsigned Simulator
compile. It lacks the release evidence and owner-controlled materials needed
to make a TestFlight or App Store claim: no development-signing/device
evidence, no archive/distribution evidence, no App Store Connect App Privacy
record, and no verified public privacy policy or account-lifecycle evidence.

This is not a finding that HealthKit access is unsafe. It is a finding that
source-level and unsigned-build evidence must not be promoted into device or
distribution evidence.

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
five types above and has no per-object authorization types at this baseline.
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
bridge could transmit it. At `e15e553`, however, the default factory returns
`MockLANBridgeClient`, and the factory reports
`canStartLiveTransportInCurrentPhase: false`.

Evidence:

- `AppBridgeClientFactory.swift:49-110`
- `AppEnvironment.swift:19-75`
- `InteractionEnvelope.swift:3-43`
- `LANBridgeClient.swift:59-94`

Thus this audit confirms *local aggregation plus the current offline mock
transport*. It does not claim that a future live transport would keep the
summary local; that scenario requires a new privacy and App Privacy review.

## Host Configuration And Dependencies

| Area | Confirmed evidence | Release interpretation |
| --- | --- | --- |
| HealthKit purpose string | `Info.plist` has `NSHealthShareUsageDescription`: used to read user-selected local health/fitness data and generate a trend summary. | Present, but broad. It does not name the five categories or state the chat-context boundary. |
| Entitlement | `PersonalAICompanionHost.entitlements` contains only `com.apple.developer.healthkit = true`. | Base HealthKit entitlement is present. |
| HealthKit capability | `project.pbxproj` has `SystemCapabilities.com.apple.HealthKit.enabled = 1`; `CODE_SIGN_ENTITLEMENTS` names the entitlement file. | Xcode project declares the capability and packages the entitlement source. |
| Clinical/Health Records | No `com.apple.developer.healthkit.access` entitlement key or Health Records/clinical purpose string exists in the baseline host plist/entitlements. The actual read registry contains no clinical type. | No source-level clinical claim or entitlement was found. This does not inspect the Apple Developer portal. |
| Minimum platform | Both Debug and Release settings use `IPHONEOS_DEPLOYMENT_TARGET = 17.0`. | The release target is iOS 17.0 or later. |
| Google dependency | `Package.swift` depends on `GoogleSignIn`; `Package.resolved` pins `GoogleSignIn-iOS` to `9.2.0` with AppAuth, App Check, GoogleUtilities, GTMAppAuth, GTMSessionFetcher, InteropForGoogle, and Promises. | Third-party SDK privacy declarations and all auth/network behavior need independent release disclosure review. |

Relevant baseline paths:

- `ios/PersonalAICompanion/XcodeHost/Info.plist:52-55`
- `ios/PersonalAICompanion/XcodeHost/PersonalAICompanionHost.entitlements:5-6`
- `ios/PersonalAICompanion/XcodeHost/PersonalAICompanionHost.xcodeproj/project.pbxproj:82-89, 168-216`
- `ios/PersonalAICompanion/Package.swift:214-223`
- `ios/PersonalAICompanion/Package.resolved:1-78`

## Privacy Materials

### Present in source or built dependencies

- The first-party `Info.plist` contains a HealthKit read-purpose string.
- The first-party host contains the base HealthKit entitlement and Xcode
  capability declaration.
- The source produces aggregate trend text rather than serializing raw
  `HKSample` objects into `HealthContextSnapshot`.
- After dependency resolution, the unsigned Simulator product contained nine
  third-party bundle `PrivacyInfo.xcprivacy` files: AppAuth, AppAuthCore,
  FBLPromises, GTMAppAuth, GTMSessionFetcherCore, GoogleSignIn,
  GoogleUtilities Environment/Logger/UserDefaults. The resolved checkout
  contained 20 manifest files across all package products.

### Missing from the first-party release source

- No first-party `PrivacyInfo.xcprivacy` exists at `e15e553`; source-tree scan
  found no `.xcprivacy` file outside resolved dependencies.
- No App Store Connect App Privacy questionnaire/export is in source control.
  Portal content was intentionally not inspected.
- No publishable privacy policy artifact or URL was found in the product
  baseline. A source-tree absence is not proof that a policy does not exist
  elsewhere; publication and current content remain unconfirmed.
- No account-deletion implementation or release evidence was found by a
  targeted baseline scan. This audit does not determine whether the backend
  offers account creation; if it does, the owner must verify the applicable
  Apple account-deletion requirement before submission.

### Required manual disclosure decisions

The release owner must complete these against the final archive and actual
production behavior, rather than copying this audit into App Store Connect:

1. Declare whether health information is collected, linked, used for app
   functionality, or transmitted off-device after any real bridge is enabled.
   The current baseline does not enable that bridge.
2. Reconcile every final third-party SDK and its manifest with actual SDK
   initialization and data flows, including Google sign-in/auth flows.
3. Publish and link an accurate privacy policy. It must cover health summaries,
   local retention, any remote service, account lifecycle, and deletion process
   if the app supports accounts.
4. Confirm the App Privacy answers in App Store Connect against a signed,
   release-candidate archive; this audit cannot access that portal.
5. Decide whether to add a first-party privacy manifest after a required-reason
   API inventory. Its absence is not itself evidence of compliance or
   noncompliance.

## Four-Stage Evidence Matrix

| Stage | Current evidence | What it proves | What it does not prove | Gate for next action |
| --- | --- | --- | --- | --- |
| Simulator | Unsigned iOS Simulator build completed from an isolated `e15e553` snapshot. No simulator was launched. | The host and dependencies compile for `iphonesimulator` without code signing. | Health authorization UI, granted/denied behavior, real HealthKit availability, entitlement acceptance, hardware, or distribution. | L1 can improve local source/build evidence; any runtime authorization remains outside this audit. |
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
| Account deletion | [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) | Applies if the app supports account creation; account lifecycle remains unconfirmed. |

## Local Verification

All commands used an exported baseline snapshot under `/tmp`, never the
canonical product working tree.

| Check | Result | Limit |
| --- | --- | --- |
| `plutil -lint` for `Info.plist` and entitlement file | Passed for both. | Syntax only; does not prove signing or portal configuration. |
| `swift package resolve` | Passed with the pinned package graph, including `GoogleSignIn-iOS 9.2.0`. | Dependency resolution only; does not inspect runtime service behavior. |
| `swift run PersonalAICompanionHealthPermissionGateSmoke` | Passed. | Exercises source-level five-type mapping with mocks; no HealthKit authorization or samples. |
| `xcodebuild ... -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO ... build` | Passed and produced `PersonalAICompanionHost.app` for Simulator. | Unsigned compile only; no launch, simulator authorization, device, archive, TestFlight, or App Store evidence. |
| Source-tree scan for `.xcprivacy` | No first-party manifest at the baseline; resolved dependency manifests present and included in unsigned product bundles. | Does not answer App Store Connect App Privacy questions. |

The audit attempted the optional Sub2API read-only reviewer step, but this
environment exposed no `sub2api_model_pool` MCP tool. No external model was
used and no private material was sent outside the workspace.

## Status

**completed**

- Baseline-only source/configuration audit, privacy-material inventory, public
  Apple-reference check, plist validation, package resolution, five-type smoke,
  and unsigned Simulator build.

**confirmed**

- Five HealthKit read categories only; no write/share set; chat summary is
  bounded to the same five enum cases; base HealthKit entitlement/capability,
  iOS 17.0 minimum, and GoogleSignIn dependency are present.

**unconfirmed**

- Apple Developer portal capability/provisioning, device behavior, final signed
  archive, TestFlight/App Store status, App Privacy questionnaire, published
  privacy policy, account lifecycle/deletion, final runtime data flows, and
  production transport behavior.

**risks**

- The purpose string is present but not itemized; local raw samples are used
  transiently to derive sleep/workout aggregates; a future live bridge can
  serialize the summary; first-party privacy-manifest and App Privacy material
  are absent from this source baseline; Google SDK disclosure needs final
  archive/runtime review.

**next steps**

| Follow-on | Required level |
| --- | --- |
| Improve purpose wording, first-party privacy-manifest coverage, local source documentation, or account-deletion UI after product decisions | L1 local implementation/review |
| Inspect Apple Developer/App Store Connect state, certificates, profiles, devices, or submitted metadata without changing them | L2 read-only audit |
| Change capabilities/signing/profiles, install a signed device build, request HealthKit authorization, read samples, archive/upload, change store metadata, TestFlight, or App Store submission | L3 only after explicit `进入修复阶段` |
