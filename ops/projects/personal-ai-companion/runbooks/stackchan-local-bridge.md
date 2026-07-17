# StackChan Local Bridge Runbook

This runbook covers the local authenticated StackChan bridge for
`personal-ai-companion`.

## Scope

- Local Mac only.
- No public deployment.
- Upstream API remains bound to `127.0.0.1:8768`.
- StackChan reaches only the bridge on the home LAN.
- The bridge forwards only the fixed StackChan envelope shape to `/v1/chat`.

## Current State

- Current bridge listener: `192.168.31.225:18769`.
- Current bridge upstream: `http://127.0.0.1:8768/v1/chat`.
- Current bridge supervisor: user LaunchAgent
  `xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge`.
- Current device entry: the flag-gated boot hook starts the status-only v0.2
  daemon at `/flash/apps/04_pac_v02_status_daemon.py` after network setup and
  the existing three-second Ctrl-C window.
- The UIFlow2 worker reads its Bridge URL, dedicated device ID, and firmware
  label from runtime-only `pac` NVS keys. The current private endpoint and
  identity are not embedded in worker source.
- Manual UIFlow2 App List launch remains a rollback/fallback path.
- Command protocol v0.1 is documented in
  `runbooks/stackchan-command-protocol-v0.1.md`, deployed into the current
  local bridge, and installed as removable device files. It is not wired into
  boot auto-start.

## Local Runtime Boundaries

- `8768` is the StackChan integration API port. Keep it running while the bridge
  is active.
- `8767` may still exist as an older or parallel local development API
  instance. Do not treat it as the StackChan upstream unless the bridge
  configuration is changed deliberately.
- Local API processes currently use the product root as their working directory,
  so `memory.db` and uvicorn log/PID files may appear there during local MVP
  runs.
- Do not stop `8767`/`8768`, move `memory.db`, or consolidate the two API
  processes as part of a docs-only cleanup. That is a separate L3 repair because
  it changes live local runtime state.

## Files

- Product script:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/scripts/stackchan_bridge.py`
- Local token file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/token`
- Local PID file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.pid`
- LaunchAgent plist:
  `/Users/zhangjincheng/Library/LaunchAgents/xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge.plist`
- LaunchAgent stdout/stderr:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/launchagent.stdout.log`
  and `launchagent.stderr.log`

The token file is local state and must not be committed or printed.

## Start

The current entry is the user LaunchAgent. It uses absolute executable paths,
reads the credential only from the owner-only token file, starts at login, and
restarts only after an abnormal exit.

```bash
plutil -lint "$HOME/Library/LaunchAgents/xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge.plist"
launchctl list xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge
```

Use `launchctl kickstart -k` instead of a second `bootstrap` when the job is
already loaded. Do not use `launchctl print` in shared evidence because the GUI
launchd domain may display unrelated inherited environment values.

## Historical Manual Start

This screen-based start remains a fallback when the LaunchAgent has been
explicitly unloaded:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion

STATE_DIR=/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge
PRODUCT=/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion

screen -dmS personal-ai-companion-stackchan-bridge zsh -lc "\
cd '$PRODUCT' && \
echo \$\$ > '$STATE_DIR/stackchan_bridge.pid' && \
exec python3 -u scripts/stackchan_bridge.py \
  --bind-host 192.168.31.225 \
  --port 18769 \
  --allow-client 192.168.31.225 \
  --allow-client 192.168.31.215 \
  --allow-client 192.168.31.132 \
  --token-file '$STATE_DIR/token' \
  --scope owner_private \
  --model-hint claude \
  --memory-limit 0 \
  --recent-context-limit 0 \
  --retention-hours 0 \
  --reply-chars 180 \
  --speak-audio \
  > '$STATE_DIR/stackchan_bridge.log' 2>&1"
```

## Verify

Health check does not print or require the token, but still enforces the client
allowlist:

```bash
curl -sS http://192.168.31.225:18769/healthz
```

For chat verification, read the token locally and send it only in an HTTP
header. Do not paste the token into chat logs.

Use `/stackchan/chat_async` for device traffic:

1. `POST /stackchan/chat_async` with `Authorization: Bearer <token>` and
   `{"text":"..."}`
2. Read `request_id`.
3. Poll `GET /stackchan/result/<request_id>` with the same token.

## Historical Manual Entry v1

The first minimal formal entry was manual UIFlow2 App List launch.

Keep this entry as a repeatable rollback/fallback path when the goal is to run
the StackChan bridge without changing boot behavior:

1. Confirm the local bridge is healthy:

   ```bash
   curl -sS http://192.168.31.225:18769/healthz
   ```

2. Confirm the local API is still loopback-only and listening on `8768`:

   ```bash
   lsof -nP -iTCP:8768 -sTCP:LISTEN
   ```

3. Confirm StackChan is reachable on the LAN:

   ```bash
   ping -c 1 192.168.31.215
   arp -n 192.168.31.215
   ```

   Expected device MAC: `68:ee:8f:d7:44:94`.

4. On the device, open UIFlow2 App List and launch
   `/flash/apps/00_pac_bridge_demo.py`.

5. Treat `DEVICE_CONNECTED` or a short successful text response as the minimal
   end-to-end verification signal.

This historical v1 entry intentionally did not modify `/flash/boot.py` or
`/flash/main.py`. The current device state is the v1.2 boot-time auto-start
documented below.

## Auto-Start Gate

Any future change to boot-time launch behavior is L3 repair execution.

Do not write `/flash/boot.py`, `/flash/main.py`, restart the bridge, or change
service parameters until the user explicitly says `进入修复阶段`.

The same gate applies to installing a StackChan command-polling client, changing
the bridge listener, changing token storage, or turning the v0.1 command API on
in the running bridge.

Before an auto-start repair, record:

- target file or service parameter;
- reason for the change;
- boot-loop, Wi-Fi, bridge, and serial-recovery risks;
- rollback command or full-flash rollback path;
- minimal verification plan.

## Boot-Time Auto-Start

Current device auto-start state:

- `/flash/boot.py` has a PAC flag-gated auto-start patch.
- `/flash/pac_autostart_enabled` exists and enables the PAC auto-start path.
- UIFlow2 NVS `uiflow/boot_option` is set to `2`, which performs network setup
  before the PAC launch.
- `/flash/main.py` is the original placeholder:
  `# main.py`
- The auto-start path runs:
  `/flash/apps/04_pac_v02_status_daemon.py`
- The daemon polls only the dedicated `stackchan-status-test` v0.2 status
  identity. It retries only transport and HTTP 5xx failures with capped
  exponential backoff. Credential, HTTP 4xx, protocol, correlation, expiry,
  runtime-config, journal-integrity, unsupported-command, keyboard interrupt,
  and unexpected errors stop it.
- The worker journal stores the complete validated command and frozen primary/
  ACK payloads. It is retained through ACK transport/5xx ambiguity, removed only
  after strict ACK response validation, and cleared after a successful empty
  poll when the Bridge has already completed the command.
- Runtime configuration uses ESP32 NVS namespace `pac` with keys `bridge_url`,
  `device_id`, and `firmware_label`. The URL must be canonical HTTP with a
  literal RFC1918 address and explicit port; labels are bounded ASCII values.
- The previous handshake entry remains installed at
  `/flash/apps/00_pac_bridge_demo.py`. Short text chat remains manual through:
  `/flash/apps/01_pac_chat_test.py`

Local backup and patch evidence:

- Original boot backup:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/backups/boot-py-before-pac-autostart-20260708-215857.py`
- Patched boot source:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/boot-py-pac-autostart-20260708-215857.py`
- Original main placeholder backup:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/backups/main-py-before-autostart-20260708-214949.py`
- Continuous-runtime pre-switch boot backup:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-before-boot-switch-20260717-012552/boot.py`
- Continuous-runtime installed boot source:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-continuous-20260717/boot-status-daemon-20260717-012552.py`
- Pre-worker-hardening backup, including the old worker, unchanged daemon,
  prior journal, and non-credential NVS state:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-continuous-20260717/device-before-worker-hardening-20260717-021652/`

Disable auto-start from StackChan REPL:

```python
import os, esp32, machine
try:
    os.remove("/flash/pac_autostart_enabled")
except OSError:
    pass
nvs = esp32.NVS("uiflow")
nvs.set_u8("boot_option", 1)
nvs.commit()
machine.reset()
```

Re-enable auto-start from StackChan REPL:

```python
import esp32, machine
open("/flash/pac_autostart_enabled", "wb").write(b"1\n")
nvs = esp32.NVS("uiflow")
nvs.set_u8("boot_option", 2)
nvs.commit()
machine.reset()
```

## Stop

```bash
launchctl bootout "gui/$(id -u)/xyz.nodezjc12348888.personal-ai-companion.stackchan-bridge"
```

For a historical screen-based fallback process, use its PID file and screen
session only after confirming the LaunchAgent is unloaded.

## Rollback

- Unload the LaunchAgent with the command above.
- Keep `127.0.0.1:8768` unchanged.
- To restore the prior device boot target exactly, run the bounded USB helper
  from the continuous-runtime scratch directory:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-continuous-20260717
uv run --with mpremote python device_switch_boot_target.py \
  --port /dev/cu.usbmodem101 \
  --expected-current boot-status-daemon-20260717-012552.py \
  --replacement device-before-boot-switch-20260717-012552/boot.py
```

- Soft-reset the device only after the reverse write verifies its hash.
- To roll back only the worker hardening, restore the owner-only pre-hardening
  worker and daemon backup with the bounded USB helper:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-continuous-20260717
uv run --with mpremote python device_install_status_daemon.py \
  --port /dev/cu.usbmodem101 \
  --worker device-before-worker-hardening-20260717-021652/pac_v02_status_worker.py \
  --daemon device-before-worker-hardening-20260717-021652/apps__04_pac_v02_status_daemon.py
```

- The three runtime keys did not exist before this repair. Erase them from the
  StackChan REPL for an exact NVS rollback, then reset:

```python
import esp32, machine
nvs = esp32.NVS("pac")
for key in ("bridge_url", "device_id", "firmware_label"):
    try:
        nvs.erase_key(key)
    except OSError:
        pass
nvs.commit()
machine.reset()
```

- The rollback leaves `/flash/main.py`, `boot_option=2`, the flag, token NVS,
  old app, and status files intact.
- Do not delete the token or state directory as part of ordinary rollback.
- Fixed DHCP addresses remain a live dependency. If `.225`, `.215`, or `.132`
  changes, stop and update the Bridge allowlist, worker NVS, and temporary iOS
  configuration under a fresh L3 gate.

## Device Notes

- Keep manual App List launch as a rollback/fallback path. The current entry is
  the v1.2 boot-time PAC auto-start path documented above.
- For MicroPython, send JSON request bodies as UTF-8 bytes so `Content-Length`
  is byte-accurate for non-ASCII text.
- Device token storage uses ESP32 NVS namespace `pac`, key `bridge_token`.
- Device runtime status configuration uses the same namespace with separate
  `bridge_url`, `device_id`, and `firmware_label` keys. Do not place the token in
  any of those values or in evidence output.
- Manual client file:
  `/flash/pac_bridge_client.py`
- UIFlow2 app-list entry:
  `/flash/apps/pac_bridge_demo.py`
- UIFlow2 app-list shortcut, sorted before the default sample:
  `/flash/apps/00_pac_bridge_demo.py`
- UIFlow2 short text test app:
  `/flash/apps/01_pac_chat_test.py`
- Command protocol client:
  `/flash/pac_command_client.py`
- Command protocol one-shot test app:
  `/flash/apps/02_pac_command_poll_test.py`
- Command protocol `speak` uses bridge-generated local WAV audio from macOS
  `say`/`afconvert`, downloaded over the authenticated bridge and played with
  `M5.Speaker.playWavFile`.

Manual run from StackChan REPL:

```python
import pac_bridge_client
pac_bridge_client.demo()
```

Manual run of the app-list entry from StackChan REPL:

```python
exec(open("/flash/apps/pac_bridge_demo.py").read())
```

Manual run of the sorted app-list shortcut from StackChan REPL:

```python
exec(open("/flash/apps/00_pac_bridge_demo.py").read())
```

Manual run of the short text test app from StackChan REPL:

```python
exec(open("/flash/apps/01_pac_chat_test.py").read())
```

Manual run of the command polling client from StackChan REPL:

```python
import pac_command_client
pac_command_client.run_once(send_boot=True)
```

Manual run of the command polling app from StackChan REPL:

```python
exec(open("/flash/apps/02_pac_command_poll_test.py").read())
```

Manual removal from StackChan REPL:

```python
import os, esp32
os.remove("/flash/apps/00_pac_bridge_demo.py")
os.remove("/flash/apps/01_pac_chat_test.py")
os.remove("/flash/apps/02_pac_command_poll_test.py")
os.remove("/flash/apps/pac_bridge_demo.py")
os.remove("/flash/pac_bridge_client.py")
os.remove("/flash/pac_command_client.py")
nvs = esp32.NVS("pac")
nvs.erase_key("bridge_token")
nvs.commit()
```

This app/client removal does not restore the auto-start boot patch. Use the
auto-start disable commands above first if reverting to stock UIFlow2 launch
behavior.
