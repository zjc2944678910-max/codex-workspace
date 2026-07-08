# StackChan Firmware Repair Evidence - 2026-07-08

## Route Lock

- target_project: personal-ai-companion + StackChan device firmware integration
- product_root: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion`
- ops_docs: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion`
- protected_thread: `019f4054-6b58-74c1-ad8f-30354bffaf9b`
- forbidden_code_scope: do not edit `profile.py`, `evaluation.py`, or tests unless explicitly requested for integration code.

## Risk Classification

- level: L3 repair execution
- rationale: firmware flashing changes connected-device flash state and may affect bootability, pairing, Wi-Fi config, and account binding.
- execution_strategy: collect official documentation and rollback evidence first, keep all project code untouched, use only official M5Stack/M5Burner firmware paths unless explicitly redirected.

## Device Evidence

- serial_port: `/dev/cu.usbmodem101`
- tty_port: `/dev/tty.usbmodem101`
- USB identity: Espressif USB JTAG/serial debug unit
- USB serial / MAC: `68:ee:8f:d7:44:94`
- esptool: `esptool.py v4.8.1`
- chip: `ESP32-S3 (QFN56) revision v0.2`
- features: WiFi, BLE
- crystal: 40MHz
- flash manufacturer/device: `46 / 4018`
- flash size: `16MB`
- flash type: quad
- flash voltage: `3.3V`

## Current Flash Backup

- backup_file: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/backups/stackchan-68ee8fd74494-full-flash-20260708-1619.bin`
- size: `16,777,216` bytes
- sha256: `21dabef74b9d3b066e4662587d7c9f2c9893b8b334f421751f360f3f28c1db0d`
- read_command_log: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/logs/esptool-read-full-flash.log`

Rollback write-back command, only if explicitly needed:

```bash
uvx --from 'esptool==4.8.1' esptool.py --port /dev/cu.usbmodem101 --baud 460800 write_flash 0x0 /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/backups/stackchan-68ee8fd74494-full-flash-20260708-1619.bin
```

## Partition And Firmware Evidence

Partition table from backup:

| Label | Type | Subtype | Offset | Size |
| --- | --- | --- | --- | --- |
| nvs | data | nvs | `0x9000` | `0x4000` |
| otadata | data | ota | `0xd000` | `0x2000` |
| phy_init | data | phy | `0xf000` | `0x1000` |
| ota_0 | app | ota_0 | `0x20000` | `0x4f0000` |
| ota_1 | app | ota_1 | `0x510000` | `0x4f0000` |
| assets | data | spiffs | `0xa00000` | `0x400000` |
| coredump | data | coredump | `0xe00000` | `0x10000` |

App image metadata:

| Slot | Project | Version | Compile Time | Image Hash |
| --- | --- | --- | --- | --- |
| ota_0 | `stack-chan` | `1.2.4` | `Apr 15 2026 09:18:33` | `c9fa17a7c1242de79f87b4b30580e1fdae4f699af3c66c4c1e352f6e7eb951b5` |
| ota_1 | `stack-chan` | `1.4.3` | `Jul 1 2026 10:58:19` | `db0c68bc8ada8bef0d95b61f8301b391ff63ec3d9a5e87b624d65b943c2aa851` |

Current active slot inference:

- `otadata` first entry has `ota_seq=1` and `ota_state=0x2`; this normally maps to `ota_0`.
- Treat the active firmware as likely `stack-chan 1.2.4` until confirmed on device screen/UI.
- `ota_1` already contains `stack-chan 1.4.3`, matching the latest official StackChan-UserDemo version found in the M5Burner public firmware list.

## Official Firmware Sources

Official documentation facts:

- StackChan is CoreS3 / ESP32-S3 based with 16MB flash and 8MB PSRAM.
- Download mode: connect USB-C, hold `RST` for about 3 seconds until the indicator LED turns green.
- Factory firmware can be restored with M5Burner: search `StackChan`, check `Only Official`, download the latest firmware, click Burn, choose the port, Start.
- M5Burner supports later Configure for device settings after flashing.
- StackChan World unbinding clears AI Agent settings, deletes conversation history, disconnects the app, and permits rebinding after restart.
- For XiaoZhi-based firmware, M5Stack documents that StackChan World and xiaozhi.me binding systems are not interoperable; unpair before switching between them.

M5Burner evidence:

- official macOS DMG: `https://m5burner-cdn.m5stack.com/app/M5Burner-v3-mac-x64.dmg`
- local DMG: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/tools/M5Burner-v3-mac-x64.dmg`
- DMG size: `98,782,584` bytes
- DMG sha256: `6d9680a6d36ea572faef07f173c4343f0c3466227a8ae9429c8ed83cecdcd734`
- app version: `M5Burner 3.0.0`

Official M5Stack-authored StackChan firmware entries from the public M5Burner list:

| Firmware | FID | Latest | Published | File |
| --- | --- | --- | --- | --- |
| `StackChan-UserDemo` | `a0873b3516e945f28d39a0870736a017` | `V1.4.3` | `2026-07-02` | `fb75fa818e63b7ee6b0d35eba308f386.bin` |
| `UIFlow2.0` category `stackchan` | `c926e9606e0feb75d3208f7eb46fd1cc` | `v2.4.8` | `2026-06-26` | `69c2504cc6c09df9b4bb8fc4daba138f.bin` |
| `StackChan RemoteControl FactoryTest` | `6a47743bf564d2b8f0b205f47635ce58` | `v1.1` | `2026-04-24` | `ff840d01842ac952e49d8f2227328cad.bin` |

## Minimal Flash Plan

1. Confirm whether the device is currently bound to StackChan World or xiaozhi.me.
2. If switching between StackChan World factory firmware and any other XiaoZhi firmware, unpair first through StackChan World or the device Settings menu.
3. Use official M5Burner 3.0.0 only.
4. Prefer one of two official targets:
   - factory/companion route: `StackChan-UserDemo` latest `V1.4.3`;
   - programmable/custom-backend prep route: `UIFlow2.0` category `stackchan` latest `v2.4.8`, because its M5Burner flow exposes `Server`, Wi-Fi, timezone, and boot options.
5. Select `/dev/cu.usbmodem101`; if not visible, enter download mode with `RST` held about 3 seconds until the LED is green.
6. Burn with M5Burner.
7. Minimal verification only: boot completes, screen shows expected firmware/startup state, Wi-Fi/config screen can be reached, and custom backend configuration path remains available. Do not connect to `personal-ai-companion` yet.

## Current Stop Condition

Do not flash until the human confirms the unbinding state and chooses the official target firmware: `StackChan-UserDemo V1.4.3` or `UIFlow2.0 StackChan v2.4.8`.

## Flash Execution - UIFlow2.0 StackChan v2.4.8

User confirmed:

- StackChan World / xiaozhi.me unbinding was completed manually.
- Target firmware: `UIFlow2.0` category `stackchan`, version `v2.4.8`.

M5Burner GUI status:

- Official M5Burner app launched from `/Volumes/m5burner/M5Burner.app`.
- macOS reported the DMG app as unsigned (`spctl`: `no usable signature`), and the app process had no stable visible window for automation.
- M5Burner app resource inspection confirmed:
  - firmware download base: `https://m5burner-cdn.m5stack.com/firmware`
  - burn command shape: `write_flash -z --flash_mode dio --flash_freq 80m --flash_size detect 0x000 <bin>`
  - UIFlow2 config path overlays NVS at `0x9000` when explicitly configured.

Official firmware downloaded:

- url: `https://m5burner-cdn.m5stack.com/firmware/69c2504cc6c09df9b4bb8fc4daba138f.bin`
- local_file: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/firmware/69c2504cc6c09df9b4bb8fc4daba138f.bin`
- size: `16,121,856` bytes
- sha256: `c8d7898b4d5530ae3876b7791c4247b13cf4463e48d6411092024e1f7589fc5a`

Downloaded image evidence:

- image type: `ESP32-S3`
- bootloader compile time: `Jun 26 2026 09:16:26`
- factory app project: `micropython`
- factory app version: `V2.4.8`
- factory app compile time: `Jun 26 2026 09:16:15`
- factory app ESP-IDF: `v5.5.1-dirty`
- partition table:

| Label | Type | Subtype | Offset | Size |
| --- | --- | --- | --- | --- |
| nvs | data | nvs | `0x9000` | `24K` |
| phy_init | data | phy | `0xf000` | `4K` |
| factory | app | factory | `0x10000` | `9792K` |
| sys | data | fat | `0x9a0000` | `1M` |
| vfs | data | fat | `0xaa0000` | `4864K` |
| storage | data | spiffs | `0xf60000` | `640K` |

Flash command executed:

```bash
uvx --from 'esptool==4.8.1' esptool.py --chip auto --port /dev/cu.usbmodem101 --baud 460800 --before default_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size detect 0x000 /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/firmware/69c2504cc6c09df9b4bb8fc4daba138f.bin
```

Flash result:

- detected chip: `ESP32-S3 (QFN56) revision v0.2`
- detected MAC: `68:ee:8f:d7:44:94`
- detected flash size: `16MB`
- erased range: `0x00000000` to `0x00f5ffff`
- wrote: `16,121,856` bytes
- write duration: `69.2` seconds
- verification: `Hash of data verified.`
- log: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/logs/esptool-write-uiflow2-v2.4.8.log`

Post-flash verification status:

- USB serial port briefly returned after reset, then disappeared during subsequent `read_mac` attempt.
- After waiting, no `/dev/cu.usbmodem*` or Espressif USB device was visible from macOS.
- Treat firmware write as successful because esptool completed data verification before reset.
- Device boot/config status still requires physical screen confirmation.

## UIFlow2 Wi-Fi Configuration

Observed after physical confirmation:

- Device booted into `UIFlow2` and showed `Device MAC: 68EE8FD74494`.
- `DEVELOP` page initially showed no access code because Wi-Fi/server link was not established.
- The device screen did not provide a usable on-screen keyboard for direct SSID/password entry.

Configuration method:

- Generated a UIFlow2 NVS config using the official M5Burner `nvs` tool.
- Wi-Fi SSID/password were entered locally by the user in a Terminal prompt and were not written to this report or to esptool logs.
- Wrote only the UIFlow2 NVS partition at `0x9000`; did not reflash the full firmware.

NVS write result:

- usb_identity_before_write: `Espressif USB JTAG/serial debug unit`
- port: `/dev/cu.usbmodem101`
- chip: `ESP32-S3 (QFN56) revision v0.2`
- mac: `68:ee:8f:d7:44:94`
- erase/write range: `0x00009000` to `0x0000efff`
- wrote: `24,576` bytes
- verification: `Hash of data verified.`
- after action: `Staying in bootloader`; requires physical short `RST` press to boot UIFlow2.
- log: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/logs/esptool-write-uiflow2-wifi-nvs-20260708-175223.log`

Post-NVS recovery:

- After the first NVS-only Wi-Fi write, UIFlow2 booted to USB CDC but the screen remained black.
- USB identity in app mode: `StackChan(UiFlow2)`.
- MicroPython REPL was reachable and confirmed:
  - MicroPython: `1.27.0`
  - machine: `M5STACK StackChan with ESP32S3`
  - display APIs were callable.
- Soft boot log initially failed in `boot.py` / `startup` with `ESP_ERR_NVS_NOT_FOUND`.
- Additional missing UIFlow2 network keys were added via MicroPython NVS without printing Wi-Fi secrets:
  - `net_mode=WIFI`
  - `protocol=DHCP`
  - `ip_addr=`
  - `netmask=255.255.255.0`
  - `gateway=`
  - `dns=8.8.8.8`
- Next boot showed missing StackChan servo zero keys. The firmware log's own default values were written:
  - `zero_pos_1=450`
  - `zero_pos_2=125`
- Latest observed soft reboot log no longer showed NVS or servo calibration errors and reached:

```text
Startup with network type: WIFI
WiFi initialized
```

Final observed device state:

- UIFlow2 `DEVELOP` page displayed the expected device MAC.
- Wi-Fi status icon was present.
- `Access Code` appeared on screen, confirming the UIFlow2 server link was established.
- The transient access code was not recorded in this report.

## UIFlow2 Wi-Fi NVS Configuration

Physical screen confirmation:

- Device booted into `Head Calibration`.
- After calibration, device booted into `UIFlow2` with `DEVELOP`, `SETTING`, `APP RUN`, `APP LIST`, and `EZ-DATA` tabs.
- Device MAC shown on screen: `68EE8FD74494`.

Configuration path:

- The on-device `SETTING` page exposes `SSID`, `PASS`, and `SERVER`, but did not provide a practical on-screen keyboard for text entry.
- Used the official M5Burner UIFlow2 NVS format and M5Burner bundled `nvs` tool.
- Wi-Fi SSID and password were entered locally through hidden macOS dialogs and were not printed in chat or logs.
- Temporary CSV and NVS files were created under `/tmp/stackchan-uiflow2-config.*` and removed by the execution trap after flashing.

NVS configuration values written:

- `server`: `uiflow2.m5stack.com`
- `sntp0`: `ntp.aliyun.com`
- `sntp1`: `cn.pool.ntp.org`
- `sntp2`: `pool.ntp.org`
- `tz`: `CST-8`
- `boot_option`: `1`
- Wi-Fi SSID/password: supplied locally; not recorded.

NVS write command shape:

```bash
uvx --from 'esptool==4.8.1' esptool.py --chip auto --port /dev/cu.usbmodem101 --baud 460800 --before default_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size detect 0x9000 <temp-uiflow2-cfg.bin>
```

NVS write result:

- detected chip: `ESP32-S3 (QFN56) revision v0.2`
- detected MAC: `68:ee:8f:d7:44:94`
- erased range: `0x00009000` to `0x0000efff`
- wrote: `24,576` bytes
- verification: `Hash of data verified.`
- post-reset port: `/dev/cu.usbmodem101` and `/dev/tty.usbmodem101` remained visible for at least 12 seconds.
- log: `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/logs/esptool-write-uiflow2-wifi-nvs.log`

## Minimal LAN Integration Validation

Date/time:

- `2026-07-08 18:25-18:34 CST`

Scope:

- Validated only the minimal StackChan-to-local-API path.
- No project code was changed.
- No `.env`, `memory.db`, real chats, profile exemplars, cleaning samples, or API keys were read or exported.
- No persistent StackChan `main.py` or RUN ALWAYS script was written.

Local API state:

- `personal-ai-companion` newer service was listening only on loopback:
  - process: `python -m uvicorn personal_ai_companion.api.app:create_app --factory --host 127.0.0.1 --port 8768`
  - listener: `127.0.0.1:8768`
- Mac Wi-Fi address used for device access: `192.168.31.225`

Temporary LAN proxy:

- Started a temporary Python reverse proxy bound to `192.168.31.225:18768`.
- Upstream target: `127.0.0.1:8768`.
- Allowed path: `POST /v1/chat` only.
- Other paths/methods returned `403`.
- The proxy was stopped after validation; `lsof -nP -iTCP:18768 -sTCP:LISTEN` returned no listener.

Local API payload shape used for validation:

```json
{
  "channel": "stackchan",
  "device_id": "stackchan-01",
  "actor_entity_id": "entity:user:self",
  "delivery_mode": "speaker",
  "scope": "owner_private",
  "text": "StackChan device LAN integration ping",
  "model_hint": "mock",
  "memory_limit": 0,
  "recent_context_limit": 0,
  "conversation_context_retention_hours": 0,
  "style_rewrite": false,
  "metadata": {
    "integration_test": "stackchan_device_lan_ping"
  }
}
```

Observed local API response:

- HTTP status: `200`
- route: `provider=relay`, `model=mock`, `reason=explicit_model_hint`
- model status: `ok=false`, `error=http_503`
- reply body was the controlled relay-unavailable fallback.
- `memory_ids` was empty.
- `recent_context_count` was `0`.

Device-side validation:

- Device serial port before and after test: `/dev/cu.usbmodem101`
- StackChan Wi-Fi state from MicroPython REPL:
  - active: `True`
  - connected: `True`
  - IP: `192.168.31.215`
  - netmask: `255.255.255.0`
  - gateway: `192.168.31.1`
  - DNS: `192.168.31.1`
- Device began POST to `http://192.168.31.225:18768/v1/chat`.
- Proxy log confirmed the request arrived from the StackChan IP and upstream returned `200`:

```text
18:31:39 request_start path=/v1/chat client=192.168.31.215
18:31:41 upstream_done status=200 bytes=553
18:31:41 access client=192.168.31.215 "POST /v1/chat HTTP/1.0" 200 -
```

Notes:

- The host serial reader lost the USB serial connection during/after the device POST with `Device not configured`.
- The USB serial device reappeared immediately afterward at `/dev/cu.usbmodem101` and `/dev/tty.usbmodem101`.
- Because the proxy logged the StackChan source IP and upstream HTTP `200`, the LAN/API integration path was confirmed even though the serial reader did not capture the device-side response print.

Rollback/current state:

- Temporary LAN proxy has been stopped.
- No device-side persistent file was written, so there is no device script to remove.
- If the screen is not back on UIFlow2, press the physical `RST` button or run `machine.reset()` from REPL.
- Full flash rollback image remains:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-firmware-20260708-160849/backups/stackchan-68ee8fd74494-full-flash-20260708-1619.bin`

Next bounded integration options:

- Keep using a temporary local LAN proxy for manual testing.
- Add a small authenticated local StackChan bridge that exposes only the intended `/v1/chat` shape.
- Write a removable StackChan-side MicroPython app after confirming the desired input/output UX.

## StackChan Bridge Integration

Date/time:

- `2026-07-08 18:40-18:59 CST`

Implemented local bridge artifacts:

- Bridge script:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/stackchan_bridge.py`
- Device-side reusable MicroPython source:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/stackchan_device_async_client.py`

Bridge behavior:

- Listens on: `192.168.31.225:18769`
- Upstream: `http://127.0.0.1:8768/v1/chat`
- Allowed clients for this run:
  - Mac self-test: `192.168.31.225`
  - StackChan: `192.168.31.215`
- Allowed StackChan request path:
  - sync: `POST /stackchan/chat`
  - async: `POST /stackchan/chat_async`
  - async result polling: `GET /stackchan/result/<request_id>`
- Fixed upstream envelope values:
  - `channel=stackchan`
  - `device_id=stackchan-01`
  - `actor_entity_id=entity:user:self`
  - `delivery_mode=speaker`
  - `scope=owner_private`
  - `model_hint=claude`
  - `memory_limit=0`
  - `recent_context_limit=0`
  - `conversation_context_retention_hours=0`
  - `style_rewrite=false`

Synchronous bridge finding:

- Mac self-test through `POST /stackchan/chat` returned `ok=true`.
- StackChan synchronous request reached the bridge and upstream returned HTTP `200`, but the device-side serial session did not reliably capture the reply after a multi-second blocking request.
- A first device request with non-ASCII JSON returned `400 invalid_json`; likely cause was MicroPython `urequests` `Content-Length` mismatch when sending a Unicode string body.
- Device client source now encodes JSON with `.encode("utf-8")` before POST.

Async bridge validation:

- Mac async self-test:
  - queued response included `request_id=req_97d879d02c454de0`
  - polling returned `ok=true`, `reply=ASYNC_CONNECTED`
  - upstream route: `provider=claude`, `model=claude-sonnet-4-6`
- StackChan async device test:
  - device IP: `192.168.31.215`
  - queued response included `request_id=req_a2e3bfd4152440eb`
  - first poll was pending
  - second poll returned:

```text
__PAC_OK__ True
__PAC_REPLY__ DEVICE_CONNECTED
```

Bridge log evidence:

```text
18:54:49 request_start client=192.168.31.215 path=/stackchan/chat_async
18:54:51 upstream_done status=200 ok=True reply_chars=16
```

Current state:

- Bridge process remained running after validation:
  - PID: `42186`
  - listener: `192.168.31.225:18769`
  - health check: `{"ok":true,"service":"stackchan_bridge"}`
- Device serial port remained visible after reset:
  - `/dev/cu.usbmodem101`
  - `/dev/tty.usbmodem101`
- No StackChan boot script was installed.
- No product source file was changed.

Rollback:

- Stop the temporary bridge process:

```bash
kill 42186
```

- Remove scratch artifacts if no longer needed:

```bash
rm -rf /Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708
```

- If the device is left in REPL, press physical `RST` to return to UIFlow2.

## Authenticated Local Bridge Staging

Date/time:

- `2026-07-08 19:23-19:31 CST`

Purpose:

- Stage a formal local StackChan bridge with both LAN allowlist and token auth.
- Keep the previous scratch bridge on `18769` running until the device token
  write/switch step is explicitly performed.

Added durable artifacts:

- Product script:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/scripts/stackchan_bridge.py`
- Ops runbook:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/ops/projects/personal-ai-companion/runbooks/stackchan-local-bridge.md`

Local-only state:

- Token file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/token`
- Token file permissions: `0600`
- Token value was not printed or copied into this report.

Formal bridge staging instance:

- Listener: `192.168.31.225:18770`
- PID: `91919`
- Allowed clients:
  - `192.168.31.225`
  - `192.168.31.215`
- Upstream: `http://127.0.0.1:8768/v1/chat`
- Fixed upstream envelope:
  - `channel=stackchan`
  - `device_id=stackchan-01`
  - `actor_entity_id=entity:user:self`
  - `delivery_mode=speaker`
  - `scope=owner_private`
  - `model_hint=claude`
  - `memory_limit=0`
  - `recent_context_limit=0`
  - `conversation_context_retention_hours=0`
  - `style_rewrite=false`

Verification:

- Health check returned:

```json
{"ok":true,"service":"stackchan_bridge","auth_required":true,"allowed_client":true}
```

- Unauthenticated `POST /stackchan/chat_async` returned:

```json
{"ok":false,"status":"error","error":"unauthorized"}
```

- Authenticated async self-test returned:
  - queued: `request_id=req_d340792b9dfa4a08`
  - final reply: `FORMAL_BRIDGE_OK`
  - total time: about `6.7s`

Current split state:

- Old scratch bridge remains on `192.168.31.225:18769`, PID `42186`.
- Formal token bridge is staged on `192.168.31.225:18770`, PID `91919`.
- No StackChan boot script or token file was written to the device in this step.

Rollback:

- Stop staged formal bridge:

```bash
kill 91919
```

- Remove staged local token/PID state only if intentionally decommissioning:

```bash
rm -rf /Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge
```

Next switch step:

- Stop old scratch bridge on `18769`.
- Restart `scripts/stackchan_bridge.py` on `18769` with the token file.
- Update/paste a StackChan device client that sends `Authorization: Bearer <token>`.

## Authenticated Bridge Cutover

Date/time:

- `2026-07-08 19:45-19:55 CST`

Cutover result:

- Old scratch bridge on `18769` was stopped.
- Formal token bridge was moved from staging port `18770` to production local
  port `18769`.
- `18770` no longer had a listener after the cutover.
- Formal bridge now runs under detached `screen` session:
  `personal-ai-companion-stackchan-bridge`
- Current bridge PID: `33490`
- Listener: `192.168.31.225:18769`
- Log:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.log`

Mac verification after cutover:

- Health check returned:

```json
{"ok":true,"service":"stackchan_bridge","auth_required":true,"allowed_client":true}
```

- Unauthenticated `POST /stackchan/chat_async` returned:

```json
{"ok":false,"status":"error","error":"unauthorized"}
```

- Authenticated Mac async self-test:
  - queued: `request_id=req_89301f59615d4bc4`
  - final reply: `FORMAL18769_OK`
  - total time: about `5.1s`

StackChan verification after cutover:

- Device IP: `192.168.31.215`
- Device made authenticated async request to:
  `http://192.168.31.225:18769/stackchan/chat_async`
- queued: `request_id=req_4d70339d68ca4d2c`
- final device-side output:

```text
__PAC_OK__ True
__PAC_REPLY__ TOKEN18769_OK
```

Bridge log evidence:

```text
19:53:54 request_start client=192.168.31.215 path=/stackchan/chat_async
19:53:59 upstream_done status=200 ok=True reply_chars=13
```

Current state:

- Formal token bridge is active on `192.168.31.225:18769`.
- Token is stored only in local state file with `0600` permissions.
- Token value was not printed or copied into this report.
- No StackChan boot script or persistent token file was written to the device.
- Device serial port remained visible after reset:
  - `/dev/cu.usbmodem101`
  - `/dev/tty.usbmodem101`

Rollback:

```bash
kill "$(cat /Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.pid)"
screen -S personal-ai-companion-stackchan-bridge -X quit
```

If needed, restart the previous scratch bridge from:
`/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/stackchan_bridge.py`

## Device Manual Client Persistence

Date/time:

- `2026-07-08 20:00-20:05 CST`

Device-side persistent changes:

- Added manual client file:
  `/flash/pac_bridge_client.py`
- Stored bridge token in ESP32 NVS:
  - namespace: `pac`
  - key: `bridge_token`
- Did not modify:
  - `/flash/boot.py`
  - `/flash/main.py`
- Did not install boot/run-always behavior.
- Token value was not printed or copied into this report.

Install verification:

- `/flash/pac_bridge_client.py` did not preexist.
- written size: `2479` bytes
- NVS token readback:
  - length: `64`
  - match with local bridge token: `True`

Manual run verification:

- Device imported its persisted module:

```python
import pac_bridge_client
pac_bridge_client.demo()
```

- Device Wi-Fi state:
  - connected: `True`
  - IP: `192.168.31.215`
- Device request:
  - target: `http://192.168.31.225:18769/stackchan/chat_async`
  - queued: `request_id=req_65f345b1d73542bb`
  - final reply: `DEVICE_CONNECTED`
- Bridge log evidence:

```text
20:03:43 request_start client=192.168.31.215 path=/stackchan/chat_async
20:03:59 upstream_done status=200 ok=True reply_chars=16
```

Current state:

- Formal token bridge remains active on `192.168.31.225:18769`, PID `33490`.
- Device serial port remained visible after reset:
  - `/dev/cu.usbmodem101`
  - `/dev/tty.usbmodem101`
- StackChan has a manual client available, but it is not started automatically.

Device rollback:

Run from StackChan REPL:

```python
import os, esp32
os.remove("/flash/pac_bridge_client.py")
nvs = esp32.NVS("pac")
nvs.erase_key("bridge_token")
nvs.commit()
```

## UIFlow2 App-List Entry

Date/time:

- `2026-07-08 20:13-20:18 CST`

Device-side persistent changes:

- Added app-list file:
  `/flash/apps/pac_bridge_demo.py`
- Did not modify:
  - `/flash/boot.py`
  - `/flash/main.py`
- Did not install boot/run-always behavior.
- The app file does not contain the bridge token.

Install verification:

- `/flash/apps` initially contained:
  - `helloworld.py`
- `/flash/apps/pac_bridge_demo.py` did not preexist.
- written size: `1089` bytes
- `/flash/apps` after install:
  - `helloworld.py`
  - `pac_bridge_demo.py`

Manual app execution verification:

- Executed from REPL:

```python
exec(open("/flash/apps/pac_bridge_demo.py").read())
```

- The app imported `/flash/pac_bridge_client.py`, read the NVS token, and
  reached the formal bridge on `192.168.31.225:18769`.
- queued: `request_id=req_5ef8d1acd4ef4b1a`
- final reply: `DEVICE_CONNECTED`
- Bridge log evidence:

```text
20:17:40 request_start client=192.168.31.215 path=/stackchan/chat_async
20:17:43 upstream_done status=200 ok=True reply_chars=16
```

Current state:

- Formal token bridge remains active on `192.168.31.225:18769`, PID `33490`.
- Device serial port remained visible after reset:
  - `/dev/cu.usbmodem101`
  - `/dev/tty.usbmodem101`
- The app-list file is present, but a physical screen check is still needed to
  confirm how UIFlow2 refreshes or displays newly added app files.

Device rollback:

Run from StackChan REPL:

```python
import os, esp32
os.remove("/flash/apps/00_pac_bridge_demo.py")
os.remove("/flash/apps/pac_bridge_demo.py")
os.remove("/flash/pac_bridge_client.py")
nvs = esp32.NVS("pac")
nvs.erase_key("bridge_token")
nvs.commit()
```

## UIFlow2 Sorted App-List Shortcut

Date/time:

- `2026-07-08 20:40-20:42 CST`

Device-side persistent changes:

- Added sorted app-list shortcut:
  `/flash/apps/00_pac_bridge_demo.py`
- Source file copied unchanged from:
  `/flash/apps/pac_bridge_demo.py`
- Did not modify:
  - `/flash/boot.py`
  - `/flash/main.py`
- Did not install boot/run-always behavior.
- The shortcut file does not contain the bridge token.

Install verification:

- copied size: `1089` bytes
- `/flash/apps` after shortcut install:
  - `00_pac_bridge_demo.py`
  - `helloworld.py`
  - `pac_bridge_demo.py`

Manual shortcut execution verification:

- Executed from serial raw REPL:

```python
exec(open("/flash/apps/00_pac_bridge_demo.py").read())
```

- Device Wi-Fi address during verification:
  `192.168.31.215`
- queued: `request_id=req_690aa10e8b46418d`
- final reply: `DEVICE_CONNECTED`
- Bridge log evidence:

```text
20:41:54 request_start client=192.168.31.215 path=/stackchan/chat_async
20:41:59 upstream_done status=200 ok=True reply_chars=16
```

Shortcut-only rollback:

Run from StackChan REPL:

```python
import os
os.remove("/flash/apps/00_pac_bridge_demo.py")
```

## Read-Only Handoff And Formal Entry Decision

Date/time:

- `2026-07-08 21:03 CST`

Scope:

- Continued from the StackChan + `personal-ai-companion` integration handoff.
- Kept this pass read-only for runtime and device state.
- Did not read or export `.env`, `memory.db`, real chat logs, profile
  exemplars, cleaning samples, API keys, or the bridge token.
- Did not modify project code, `profile.py`, `evaluation.py`, tests, bridge
  parameters, `127.0.0.1:8768`, `/flash/boot.py`, or `/flash/main.py`.
- Did not deploy public infrastructure and did not touch NAS/OpenClaw/Cloudflare.

Confirmed local state:

- Bridge screen session:
  `personal-ai-companion-stackchan-bridge`
- Bridge listener:
  `192.168.31.225:18769`
- Bridge health check:
  `{"ok":true,"service":"stackchan_bridge","auth_required":true,"allowed_client":true}`
- `personal-ai-companion` API listener:
  `127.0.0.1:8768`
- API `/healthz` is not defined and returned `404`; this is not treated as an
  API failure because `/v1/chat` is the defined chat route.
- Direct `/v1/chat` was not called during this read-only pass because the route
  records synthetic conversation/usage state.
- Device serial port:
  `/dev/cu.usbmodem101`
- Device LAN reachability:
  `192.168.31.215` responded to ping.
- Device ARP identity:
  `68:ee:8f:d7:44:94`
- Bridge log tail showed earlier StackChan requests from `192.168.31.215`
  completed with upstream HTTP `200` and `ok=True`.

Device app-list status:

- Prior install evidence confirms:
  - `/flash/pac_bridge_client.py`
  - `/flash/apps/pac_bridge_demo.py`
  - `/flash/apps/00_pac_bridge_demo.py`
- This pass did not reopen MicroPython REPL to re-enumerate `/flash/apps`,
  because doing so could interrupt the current UIFlow2 foreground state.

Decision:

- The minimal reversible formal run entry is manual UIFlow2 App List launch of
  `/flash/apps/00_pac_bridge_demo.py`.
- This keeps the official UIFlow2 boot path intact and avoids boot-loop risk.
- A formal entry means documented, repeatable, and reversible; it does not need
  to be automatic.

Rejected for this phase:

- Writing `/flash/boot.py`.
- Writing `/flash/main.py`.
- Restarting or changing the bridge.
- Changing `personal-ai-companion` service parameters.
- Building the full voice chain.

L3 gate:

- Any move to boot-time auto-start, bridge restart, service parameter change, or
  firmware boot file write must be handled as L3 repair execution.
- Do not execute those actions until the user explicitly says
  `进入修复阶段`.

Current recommended next step:

- Use the runbook's `Formal Run Entry v1` procedure for normal manual launches.
- If auto-start becomes necessary, create a separate L3 repair checklist first.

## Formal Run Entry v1 Acceptance

Date/time:

- `2026-07-08 21:22-21:26 CST`

Network recovery:

- Mac Wi-Fi returned to:
  `192.168.31.225`
- StackChan remained reachable at:
  `192.168.31.215`
- Device ARP identity:
  `68:ee:8f:d7:44:94`
- Bridge health check returned:
  `{"ok":true,"service":"stackchan_bridge","auth_required":true,"allowed_client":true}`

Acceptance execution:

- Executed the same formal entry file:
  `/flash/apps/00_pac_bridge_demo.py`
- The execution did not write device flash and did not modify
  `/flash/boot.py` or `/flash/main.py`.
- queued:
  `request_id=req_5c2d883ad8c84f32`
- final reply:
  `DEVICE_CONNECTED`
- Bridge log evidence:

```text
21:26:31 request_start client=192.168.31.215 path=/stackchan/chat_async
21:26:36 upstream_done status=200 ok=True reply_chars=16
```

Conclusion:

- Formal Run Entry v1 is accepted for the current phase.
- The accepted behavior is manual launch through the UIFlow2 app-list entry or
  equivalent one-shot execution of `/flash/apps/00_pac_bridge_demo.py`.
- Auto-start remains out of scope until a separate L3 repair gate is authorized.

## Short Text Request Acceptance

Date/time:

- `2026-07-08 21:29 CST`

Scope:

- Ran one synthetic non-private short text request through the installed
  StackChan bridge client.
- Did not write device flash.
- Did not modify `/flash/boot.py`, `/flash/main.py`, bridge parameters,
  `profile.py`, `evaluation.py`, or tests.
- This request did call `/v1/chat`, so it may have produced one synthetic
  local usage/conversation-state event.

Input:

- `你好，StackChan 短文本接入测试，请用一句中文回复 OK。`

Device-side evidence:

- Wi-Fi connected:
  `192.168.31.215`
- queued:
  `request_id=req_37686bb141794754`
- final `ok`:
  `True`
- final reply:
  `你好！测试收到，一切正常，OK！ 😊`

Bridge log evidence:

```text
21:29:25 request_start client=192.168.31.215 path=/stackchan/chat_async
21:29:31 upstream_done status=200 ok=True reply_chars=18
```

Conclusion:

- StackChan can send a real short text request through the authenticated local
  bridge to `personal-ai-companion` and receive a short model response.
- The current accepted level is still manual/one-shot execution, not boot-time
  auto-start and not a full voice chain.

## UIFlow2 Manual Screen Launch Acceptance

Date/time:

- `2026-07-08 21:32 CST`

Scope:

- Verified the physical UIFlow2 app-list/manual launch path.
- User launched the installed app-list entry from the device screen.
- Did not write device flash.
- Did not modify `/flash/boot.py`, `/flash/main.py`, bridge parameters,
  `profile.py`, `evaluation.py`, or tests.

Bridge log evidence:

```text
21:32:04 request_start client=192.168.31.215 path=/stackchan/chat_async
21:32:08 upstream_done status=200 ok=True reply_chars=16
```

Conclusion:

- The UIFlow2 manual screen path can trigger the StackChan bridge successfully.
- The accepted v1 launch path is now both documented and physically verified:
  select `/flash/apps/00_pac_bridge_demo.py` from UIFlow2 App List and run once.

## UIFlow2 Short Text App v1.1

Date/time:

- `2026-07-08 21:35-21:37 CST`

Device-side persistent changes:

- Added app-list file:
  `/flash/apps/01_pac_chat_test.py`
- Local source evidence:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/pac_chat_test_app.py`
- Written size:
  `1187` bytes
- Did not modify:
  - `/flash/boot.py`
  - `/flash/main.py`
- Did not install boot/run-always behavior.
- The app file does not contain the bridge token.

App behavior:

- Imports `/flash/pac_bridge_client.py`.
- Sends the synthetic non-private fixed test text:
  `我在 StackChan 上叫你啦，请用一句中文回复我。`
- Displays `PAC Chat`, `OK`, and the first part of the model reply on the
  StackChan screen when successful.

Install verification:

- `/flash/apps` after install:
  - `00_pac_bridge_demo.py`
  - `01_pac_chat_test.py`
  - `helloworld.py`
  - `pac_bridge_demo.py`

Execution verification:

- Executed from serial raw REPL:

```python
exec(open("/flash/apps/01_pac_chat_test.py").read())
```

- Device Wi-Fi address during verification:
  `192.168.31.215`
- queued:
  `request_id=req_a611f2e2c93941e3`
- final reply:
  `你好！很高兴在 StackChan 上和你聊天！😊`
- Bridge log evidence:

```text
21:37:13 request_start client=192.168.31.215 path=/stackchan/chat_async
21:37:17 upstream_done status=200 ok=True reply_chars=25
```

Shortcut-only rollback:

Run from StackChan REPL:

```python
import os
os.remove("/flash/apps/01_pac_chat_test.py")
```

Conclusion:

- v1.1 now has a reversible UIFlow2 app-list entry for one-shot real short text
  requests.
- The accepted launch path remains manual; auto-start remains out of scope until
  a separate L3 repair gate is authorized.

## UIFlow2 Short Text Screen Launch Acceptance

Date/time:

- `2026-07-08 21:39 CST`

Scope:

- Verified the physical UIFlow2 app-list/manual launch path for
  `/flash/apps/01_pac_chat_test.py`.
- User launched the installed short text app from the device screen.
- Did not write device flash during this acceptance check.
- Did not modify `/flash/boot.py`, `/flash/main.py`, bridge parameters,
  `profile.py`, `evaluation.py`, or tests.

Bridge log evidence:

```text
21:39:11 request_start client=192.168.31.215 path=/stackchan/chat_async
21:39:15 upstream_done status=200 ok=True reply_chars=25
```

Conclusion:

- The UIFlow2 manual screen path can trigger the v1.1 short text app
  successfully.
- StackChan now has two verified manual entries:
  - `/flash/apps/00_pac_bridge_demo.py` for `DEVICE_CONNECTED`.
  - `/flash/apps/01_pac_chat_test.py` for one-shot short text chat.

## Boot-Time Auto-Start v1.2

Date/time:

- `2026-07-08 21:49-22:03 CST`

L3 repair goal:

- Reduce device screen tapping by making StackChan automatically run the PAC
  connectivity handshake after reset/power-on.

Attempted low-risk path:

- Wrote a temporary `/flash/main.py` PAC launcher and tried
  `uiflow/boot_option=0`.
- Result: `boot_option=0` skipped UIFlow2 Wi-Fi initialization; device reported:
  `WIFI False False ('0.0.0.0', '0.0.0.0', '0.0.0.0', '0.0.0.0')`
- Immediate rollback completed:
  - `uiflow/boot_option` restored to `1`
  - `/flash/main.py` restored to the original placeholder:
    `# main.py`
- Recovery confirmation:
  - UIFlow2 startup output returned
  - StackChan became reachable again at `192.168.31.215`
  - bridge health remained OK

Successful auto-start path:

- Backed up original boot source locally:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/backups/boot-py-before-pac-autostart-20260708-215857.py`
- Wrote patched boot source from:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/scratch/projects/personal-ai-companion/stackchan-integration-20260708/boot-py-pac-autostart-20260708-215857.py`
- Device-side persistent changes:
  - `/flash/boot.py` patched with a flag-gated PAC auto-start hook
  - `/flash/pac_autostart_enabled` added
  - `uiflow/boot_option` set to `2`
- Preserved:
  - `/flash/main.py` remains the original 10-byte placeholder
  - `/flash/pac_bridge_client.py`
  - `/flash/apps/00_pac_bridge_demo.py`
  - `/flash/apps/01_pac_chat_test.py`
- The boot hook does not contain the bridge token.
- The boot hook waits 3 seconds before launching, so serial Ctrl-C can interrupt
  the path for recovery.

Auto-start behavior:

- UIFlow2 performs Wi-Fi initialization.
- If `/flash/pac_autostart_enabled` exists, boot launches:
  `/flash/apps/00_pac_bridge_demo.py`
- After the PAC handshake app returns, the boot script continues to UIFlow2 sync.
- Short text chat remains manual through:
  `/flash/apps/01_pac_chat_test.py`

Verification:

- Reset output showed:
  - `Startup with network type: WIFI`
  - `WiFi initialized`
  - `PAC autostart enabled; Ctrl-C within 3 seconds to cancel`
  - `PAC autostart launching /flash/apps/00_pac_bridge_demo.py`
  - Wi-Fi address: `192.168.31.215`
  - queued: `request_id=req_57a327b46ba3461e`
  - final reply: `DEVICE_CONNECTED`
- Bridge log evidence:

```text
22:02:28 request_start client=192.168.31.215 path=/stackchan/chat_async
22:02:31 upstream_done status=200 ok=True reply_chars=16
```

Post-verification:

- bridge health:
  `{"ok":true,"service":"stackchan_bridge","auth_required":true,"allowed_client":true}`
- device ping:
  `192.168.31.215` reachable

Disable auto-start:

Run from StackChan REPL:

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

Conclusion:

- Boot-time auto-start v1.2 is active and verified.
- Current auto-start only performs the `DEVICE_CONNECTED` handshake.
- Full voice control, continuous command polling, and Mac-side bridge autostart
  remain future work.
