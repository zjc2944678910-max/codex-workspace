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
