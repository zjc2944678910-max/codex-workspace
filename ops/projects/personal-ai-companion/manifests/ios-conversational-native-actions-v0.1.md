# PAC iOS Conversational Native Actions v0.1

- Status: accepted local/synthetic; device build/install confirmed
- Date: 2026-07-16
- Task: `PAC-IOS-CONVERSATIONAL-NATIVE-ACTIONS`
- Queue order: `13`
- Product source: `main@54a069a`
- Acceptance report:
  [ios-conversational-native-actions-v0.1-acceptance-20260716.md](../reports/ios-conversational-native-actions-v0.1-acceptance-20260716.md)

## Accepted Boundary

Xiaoxin Chat recognizes exactly six phone-local action kinds:

- `alarm.create`;
- `calendar.create_event`;
- `calendar.create_reminder`;
- `music.play`;
- `music.pause`; and
- `music.next`.

A recognized owner message creates a typed proposal and never executes before
an explicit confirmation tap. The proposal expires within five minutes,
validates its field combination, displays bounded details, and supports cancel,
loading, success, retryable fixed error, and fail-closed expiry states.
Unrecognized and conversationally ambiguous text continues through the existing
Chat client.

## Native Adapter Rules

- Alarm creation uses AlarmKit only on supported iOS versions and only after
  system authorization.
- Calendar creation requests EventKit write-only event access.
- Reminder creation requests EventKit reminder access.
- Apple Music control uses MediaPlayer. Search is limited to the owner's system
  media library; catalog-wide MusicKit and its paid App ID service are outside
  this Personal Team-compatible slice.
- Simulator and SwiftPM paths inject a mock executor. The production native
  frameworks are imported only by the reviewed iOS executor.

## Safety Rules

- No `/v1/chat` schema, Provider route, MCP tool, second authentication stack,
  secret, or ordinary settings store participates in native action execution.
- No arbitrary URL, server, tool, JSON schema, Shortcut, App Intent, target app,
  or background action input is reachable.
- Native framework errors map to fixed public messages and never reach UI,
  logs, snapshots, or exported state.
- Real permission prompts and side effects were not used for acceptance.

## Explicit Non-Scope

This acceptance does not prove a real alarm, calendar event, reminder, or music
effect; catalog-wide MusicKit search; background automation; remote or
state-changing MCP; deployment; Provider secret/server availability; production
database state; or private/health data handling.

Source rollback is to revert product commit `54a069a`. Device rollback is to
install the prior signed build. No service, database, or deployment rollback
exists because none was changed.
