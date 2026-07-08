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
