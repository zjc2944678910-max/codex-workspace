# StackChan Command Protocol v0.1 Repair Evidence - 2026-07-08

## Route Lock

- target_project: personal-ai-companion + StackChan command protocol
- product_root:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_docs:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- bridge: `192.168.31.225:18769`
- upstream API: `127.0.0.1:8768/v1/chat`
- device IP: `192.168.31.215`
- protected_thread: `019f4054-6b58-74c1-ad8f-30354bffaf9b`

## Risk Classification

- level: L3 repair execution
- user authorization: user explicitly said `进入修复阶段`
- rationale: repair changed the running bridge process and wrote removable
  StackChan `/flash` files.
- execution_strategy: preserve rollback evidence first, patch only the bridge
  command protocol surface, restart the bridge on the same host/port/token
  configuration, write only removable device client/app files, then verify
  command delivery from safest to most visible command types.

## Forbidden Scope Preserved

- Did not write `/flash/boot.py`.
- Did not write `/flash/main.py`.
- Did not flash firmware.
- Did not change the bridge token.
- Did not change the bridge listener, port, upstream API, allowlist, scope, or
  model hint.
- Did not read or print the token value.
- Did not read `.env`, `memory.db`, real chat logs, profile exemplars, cleaning
  samples, or API keys.

## Rollback Evidence

Run directory:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-command-protocol-20260708-2315`

Backups:

- bridge script before command protocol:
  `backups/stackchan_bridge.before-command-protocol-v0.1.py`
- bridge log before command protocol restart:
  `backups/stackchan_bridge.log.before-command-protocol-v0.1`
- bridge log before adding generic event endpoint:
  `backups/stackchan_bridge.log.before-events-endpoint`
- bridge script before speak audio:
  `backups/stackchan_bridge.before-speak-audio-v0.1.py`
- bridge log before enabling speak audio:
  `backups/stackchan_bridge.log.before-speak-audio-v0.1`
- bridge log before one-shot audio cleanup:
  `backups/stackchan_bridge.log.before-audio-cleanup-v0.1`
- prior device bridge client:
  `backups/pac_bridge_client.before-command-protocol-v0.1.py`
- device command client before physical action feedback:
  `backups/pac_command_client.before-physical-action-v0.1.py`
- device command client before speak audio:
  `backups/pac_command_client.before-speak-audio-v0.1.py`

## Bridge Changes

Changed product script:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/scripts/stackchan_bridge.py`

Added authenticated endpoints:

- `POST /stackchan/commands/enqueue`
- `GET /stackchan/commands/poll?device_id=<device>&limit=<n>`
- `POST /stackchan/commands/ack`
- `POST /stackchan/events`

Bridge behavior:

- Reuses existing token auth and LAN allowlist.
- Reuses current in-memory command protocol validators from
  `personal_ai_companion.stackchan.protocol`.
- Logs only command/event ids, type, target, result, queue depth, and client IP.
  It does not log `speak.text`.
- Rejects speaker commands containing memory, health, PII, or blocked source
  scopes.

Current bridge after repair:

- listener: `192.168.31.225:18769`
- pid file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.pid`
- observed PID after final restart: `78272`
- observed PID after enabling speak audio cleanup: `28981`

## Device Changes

Added removable files:

- `/flash/pac_command_client.py`
- `/flash/apps/02_pac_command_poll_test.py`

Preserved existing files:

- `/flash/boot.py`
- `/flash/main.py`
- `/flash/pac_bridge_client.py`
- `/flash/apps/00_pac_bridge_demo.py`
- `/flash/apps/01_pac_chat_test.py`
- `/flash/apps/pac_bridge_demo.py`

Device client behavior:

- Reads the existing bridge token from ESP32 NVS namespace `pac`, key
  `bridge_token`.
- Sends JSON request bodies as UTF-8 bytes.
- Sends device events through `POST /stackchan/events`.
- Polls commands through `GET /stackchan/commands/poll`.
- Acks command results through `POST /stackchan/commands/ack`.
- Implements `status` as a real network/status snapshot.
- Implements `expression` as screen state.
- Implements `motion`/`action` as safe physical feedback through LED, short
  vibration, and tone, with ack `ok` when the physical feedback call succeeds.
- Implements `speak` as authenticated bridge-generated WAV playback. The bridge
  uses macOS `say` plus `afconvert`, serves the WAV through
  `/stackchan/audio/<id>.wav`, deletes it after serving, and the device plays it
  with `M5.Speaker.playWavFile`.

## Verification

Local tests:

```bash
python3 -m py_compile scripts/stackchan_bridge.py
.venv/bin/python -m pytest -q tests/test_stackchan_protocol.py tests/test_core_kernels.py
```

Result:

- `17 passed in 0.01s`

Staging bridge:

- temporary listener: `127.0.0.1:18771`
- verified health, enqueue, poll, ack, and unsafe speaker rejection.
- stopped after validation.

Formal bridge Mac verification:

- `GET /healthz` returned service `stackchan_bridge` and
  `command_protocol=stackchan.command.v0.1`.
- Mac self-test target `stackchan-selftest` successfully completed
  enqueue -> poll -> ack.
- Synthetic `boot` event to `POST /stackchan/events` returned `200`.
- Sensitive speaker self-test returned `400 validation_failed` with:
  `speaker_contains_memory_blocked` and `speaker_blocked_source_scope`.

Device verification:

- Device sent `boot` event and bridge returned `200 received`.
- Device executed `status` command and acked `ok`.
- Device executed `expression` command and acked `ok`.
- Device executed `motion` command and acked `partial`.
- After reloading the updated device client, device executed `action` and
  `motion` commands and acked `ok`.
- Device executed public-safe `speak` command with WAV playback and acked `ok`.
- After the final `speak` verification, the bridge audio directory was empty,
  confirming one-shot audio cleanup.
- Fresh `status` verification after the final restart produced
  `device_event type=status device_id=stackchan-01`, then command ack `ok`.
- Final health check returned `command_queue_depth=0`.

## Rollback

Restore bridge script:

```bash
cp /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-command-protocol-20260708-2315/backups/stackchan_bridge.before-command-protocol-v0.1.py \
  /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/scripts/stackchan_bridge.py
```

Restart bridge with the existing runbook command in:

`/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion/runbooks/stackchan-local-bridge.md`

Remove the v0.1 device client/app from StackChan REPL or mpremote:

```python
import os
for path in ("/flash/pac_command_client.py", "/flash/apps/02_pac_command_poll_test.py"):
    try:
        os.remove(path)
    except OSError:
        pass
```

## Residual Risk

- The command queue is in-memory. Commands are lost if the bridge restarts.
- v0.1 does not redeliver commands after `poll`; delivered commands wait for
  ack or TTL.
- Device-side `motion`/`action` is safe LED/vibration/tone feedback, not
  physical servo control.
- `speak` depends on macOS `say` and `afconvert` being available on the bridge
  host.
- The polling client is installed but not wired into boot auto-start. That is
  intentional; changing boot behavior remains a separate L3 step.
