# Realtime Conversation v1 Acceptance - 2026-07-21

## Decision

`partially field accepted`: implementation, regression coverage, signed-device
installation, protected-database readiness, continuous physical CoreS3 PCM, a
VAD-shaped synthetic real-provider end-to-end turn, the 1-2 second synthetic
latency objective, and exact-generation interruption are accepted. The
owner-facing acoustic conversation remains pending because the iPhone has not
completed its first live microphone turn in the actual room.

## Accepted Evidence

- Private-LAN CoreS3 worker auto-starts beside the unchanged v0.2 status daemon.
- The physical harness received playback, mute, cancel, and reconnect ACKs with
  exact session/turn/generation correlation and no flash speech writes.
- Mac `/healthz` reports realtime enabled and both robot-audio and deterministic
  presence lanes configured; the old Bridge stays healthy at queue depth zero.
- The iOS Host signed, installed, and launched on the owner's iPhone 15 Pro Max.
  The endpoint is non-secret and credentials remain Keychain/NVS-only.
- The protected memory database was backed up, migrated through its one
  registered v3 step, integrity checked, and reopened by the realtime service.
- Final verification passed `1973` Python tests and `36` Swift tests. Focused
  lint passed; the only full-suite warning is the existing Starlette/httpx
  deprecation.
- Synthetic end-to-end metrics: STT final 261.2 ms, model first delta 519.9 ms,
  robot first audio submission 1686.7 ms, completion 3609.3 ms.
- CoreS3 continuity: one 5.568-second Chinese phrase submitted 56/56 100 ms
  slices, maximum device interval 133 ms, and zero intervals over 150 ms. Three
  additional 2-second runs also had zero intervals over 150 ms.
- Barge-in: robot cancel ACK plus `turn.interrupted` returned in 56.9 ms with
  zero stale model deltas. The final v0.2 presence queue depth was zero.
- The configured Relay still returns HTTP 503/no available accounts. Realtime
  is therefore pinned to a warmed no-thinking local 2B model with Azure SDK
  STT/TTS; this working route now meets the synthetic 1-2 second target.

## Pending Owner Observation

1. Complete one actual-room iPhone microphone -> Mac -> audible CoreS3 reply
   and compare the owner-observed start with `turn.metrics.first_audio_ms`.
2. Speak during robot playback and confirm prompt stop with no stale audio.
3. Confirm robot playback does not repeatedly self-trigger VAD in the room.
4. Re-authenticate the Xcode Apple ID when a fresh signed build is needed.
5. Bootstrap/restart the user LaunchAgent and confirm automatic recovery.
6. Calibrate voiceprint only if the optional owner-only gate is desired.

## Rollback

Stop only the realtime Mac service, disable the App control, and remove only the
CoreS3 realtime worker plus `rt_audio_token`/`rt_audio_port`. Restore the
pre-daemon file if needed. The complete-WAV flow and v0.2 command lane were not
removed and remain the immediate fallback. The pre-v3 SQLite and pre-worker
device backups are retained in untracked project state/scratch locations.
