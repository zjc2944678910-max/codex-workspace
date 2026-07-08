# StackChan Command Protocol v0.1

Status: local design and validation baseline.

This protocol upgrades StackChan from a boot-time `DEVICE_CONNECTED` handshake
to a safe local command/event contract. It is intentionally bridge-first: the
schema and local validation can land before writing any StackChan `/flash/*`
file, restarting the bridge, or changing device runtime state.

## Scope And Gates

- Local bridge and product code only.
- Current bridge: `192.168.31.225:18769`.
- Current upstream API: `http://127.0.0.1:8768/v1/chat`.
- Current device IP: `192.168.31.215`.
- No `/flash/boot.py`, `/flash/main.py`, device client, bridge restart, token
  change, port switch, or flashing is part of v0.1 local validation.
- Any device write, service restart, token change, or port switch is L3 repair
  execution and waits for the explicit phrase `进入修复阶段`.

## Command Envelope

Bridge to device commands use `protocol_version=stackchan.command.v0.1`.

Required common fields:

```json
{
  "protocol_version": "stackchan.command.v0.1",
  "command_id": "cmd_...",
  "idempotency_key": "optional-stable-key",
  "type": "speak",
  "target_device_id": "stackchan-01",
  "created_at_ms": 1783520000000,
  "expires_at_ms": 1783520030000,
  "priority": "normal",
  "body": {},
  "delivery": {
    "mode": "speaker",
    "retry": 0,
    "timeout_ms": 10000
  },
  "privacy": {
    "sensitivity": "public_safe",
    "source_scopes": [],
    "contains_memory": false,
    "contains_pii": false,
    "contains_health": false,
    "redaction_policy": "drop"
  },
  "origin": {
    "producer": "personal-ai-companion",
    "request_id": "req_..."
  },
  "requires_ack": true
}
```

Supported command types:

| Type | Body | Purpose |
| --- | --- | --- |
| `speak` | `text`, optional `language`, `speed`, `interrupt` | Speak short rendered text. Max text length is 180 chars. |
| `expression` | `name`, optional `duration_ms` | Set a bounded face/expression state such as `happy` or `thinking`. |
| `motion` | `action`, optional `repeat` | Bounded head/body motion such as `nod`, `shake`, or `reset`. |
| `action` | `name` | High-level device state such as `wake`, `sleep`, `listen`, `idle`, `reset_pose`. |
| `status` | `fields` | Request battery/network/uptime/temperature/heap/firmware status. |
| `ack` | `event_id`, `result` | Bridge acknowledges a device event. |
| `error` | `code`, optional `message`, `related_command_id` | Bridge sends a bounded error notification. |

## Event Envelope

Device to bridge events use `protocol_version=stackchan.event.v0.1`.

Required common fields:

```json
{
  "protocol_version": "stackchan.event.v0.1",
  "event_id": "evt_...",
  "type": "boot",
  "device_id": "stackchan-01",
  "created_at_ms": 1783520000000,
  "body": {},
  "ack_for_command_id": null,
  "status": {
    "firmware": "uiflow2-v2.4.8",
    "network": "wifi",
    "battery_pct": null,
    "uptime_s": 12
  }
}
```

Supported event types:

| Type | Body | Purpose |
| --- | --- | --- |
| `boot` | `reason`, optional `boot_count` | Replaces the coarse `DEVICE_CONNECTED` signal. |
| `touch` | `region`, `gesture` | Head/body/button touch event. |
| `button` | `region`, `gesture` | Button alias for device UI events. |
| `battery` | `battery_pct`, optional `charging` | Battery report when available. |
| `network` | `ip`, optional `rssi_dbm`, `ssid_hash` | Network report without raw Wi-Fi secrets. |
| `status` | status fields | Periodic or status-request response. |
| `ack` | `command_id`, `result`, optional `detail` | Command execution result. |
| `error` | `code`, optional `message`, `related_command_id` | Device-side error report. |

Every event should include a small `status` snapshot when possible, but it must
not include tokens, raw SSIDs/passwords, private chat text, memory content, or
profile examples.

## Bridge API Design

The v0.1 bridge API is additive to the current authenticated LAN bridge. It is
a design target until a later local bridge restart is explicitly approved.

### Enqueue Command

`POST /stackchan/commands/enqueue`

- Caller: trusted local producer on the bridge side.
- Auth: existing bridge token.
- Body: command envelope.
- Response: `202` with `command_id`, `queued_at_ms`, `queue_depth`,
  `expires_at_ms`.
- Rejects invalid envelopes, duplicate non-expired `idempotency_key`, full
  queue, or any speaker command that violates the privacy rules below.

### Poll Command

`GET /stackchan/commands/poll?device_id=stackchan-01&limit=1`

- Caller: StackChan device.
- Auth: existing bridge token.
- Response: `200` with `commands`, `remaining`, and `poll_interval_ms`.
- The bridge discards expired commands before returning work.
- Returned commands are marked delivered and remain in memory until ack or TTL.
- v0.1 does not redeliver a command after it has been returned by `poll`.
  If the device fails before posting ack, the command remains delivered until
  its TTL expires and is then discarded. Redelivery, dead-letter inspection, and
  durable queue persistence are deferred to v0.2 or the L3 repair plan.

### Ack Result

`POST /stackchan/commands/ack`

- Caller: StackChan device.
- Auth: existing bridge token.
- Body: event envelope with `type=ack`.
- Response: `200` with `received`, `command_id`, `result`, and
  `next_poll_interval_ms`.
- The bridge removes acked commands from the in-memory queue.
- Bridge logs should record ids and result only, not spoken text.

### Queue Limits

The v0.1 local queue is intentionally in-memory and bounded. The local helper
defaults to `max_depth=20`. A full queue rejects new commands instead of
evicting older commands or silently dropping work.

## Speaker Delivery Privacy Rules

StackChan speaker output is treated as more public than private iOS/screen
delivery.

For v0.1, a command whose delivery mode includes `speaker` must satisfy all of:

- `privacy.sensitivity == "public_safe"`.
- `privacy.contains_memory == false`.
- `privacy.contains_pii == false`.
- `privacy.contains_health == false`.
- `privacy.source_scopes` does not include `health_private`,
  `style_training`, `memory_maintenance`, or `partner_private`.
- `body` does not include provenance keys such as `memory_ids`, `source_spans`,
  `raw_prompt`, `private_context`, or `profile_exemplars`.

If a reply depends on sensitive memory, health, intimate, or partner-private
content, the safe default is not to enqueue a `speak` command. The bridge should
drop, summarize to a non-sensitive screen-only hint, or ask the owner to open a
private screen channel.

## Minimal Local Validation

The local validation surface is:

- Product module:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/src/personal_ai_companion/stackchan/protocol.py`
- Focused tests:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/tests/test_stackchan_protocol.py`

Run without touching the device or current bridge:

```bash
cd /Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion
.venv/bin/python -m pytest -q tests/test_stackchan_protocol.py
```

This verifies:

- public-safe `speak` command validation;
- speaker blocking for memory/health/private source scopes;
- rejection of private provenance keys inside speak bodies;
- `status` command and `boot` event envelopes;
- in-memory enqueue, poll, ack, expiration, and idempotency behavior.

## Next L3 Repair Plan Boundary

When the user explicitly says `进入修复阶段`, a later repair plan may include:

1. Add the three command endpoints to `scripts/stackchan_bridge.py`.
2. Restart the local bridge on the existing `192.168.31.225:18769` listener
   with the existing token file and allowlist.
3. Add or paste a removable MicroPython device client that polls commands and
   posts ack events.
4. Verify first with `status`, then `expression`, then a short public-safe
   `speak`, and finally a combined expression plus speak flow.

Do not perform any of those runtime or device actions during v0.1 local design
validation.
