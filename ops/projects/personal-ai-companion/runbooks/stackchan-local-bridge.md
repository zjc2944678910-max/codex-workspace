# StackChan Local Bridge Runbook

This runbook covers the local authenticated StackChan bridge for
`personal-ai-companion`.

## Scope

- Local Mac only.
- No public deployment.
- Upstream API remains bound to `127.0.0.1:8768`.
- StackChan reaches only the bridge on the home LAN.
- The bridge forwards only the fixed StackChan envelope shape to `/v1/chat`.

## Files

- Product script:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/projects/products/personal-ai-companion/scripts/stackchan_bridge.py`
- Local token file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/token`
- Local PID file:
  `/Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.pid`

The token file is local state and must not be committed or printed.

## Start

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
  --token-file '$STATE_DIR/token' \
  --scope owner_private \
  --model-hint claude \
  --memory-limit 0 \
  --recent-context-limit 0 \
  --retention-hours 0 \
  --reply-chars 180 \
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

## Stop

```bash
kill "$(cat /Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge/stackchan_bridge.pid)"
screen -S personal-ai-companion-stackchan-bridge -X quit
```

## Rollback

- Stop the bridge process with the command above.
- Keep `127.0.0.1:8768` unchanged.
- If needed, restart the previous scratch bridge from the session notes.
- Remove only local bridge state if intentionally decommissioning:

```bash
rm -rf /Users/zhangjincheng/Documents/GitHub/codex-workspace/state/project-data/personal-ai-companion/stackchan-bridge
```

## Device Notes

- Do not install a StackChan boot script until the manual bridge client path has
  been verified.
- For MicroPython, send JSON request bodies as UTF-8 bytes so `Content-Length`
  is byte-accurate for non-ASCII text.
- Device token storage uses ESP32 NVS namespace `pac`, key `bridge_token`.
- Manual client file:
  `/flash/pac_bridge_client.py`
- UIFlow2 app-list entry:
  `/flash/apps/pac_bridge_demo.py`
- UIFlow2 app-list shortcut, sorted before the default sample:
  `/flash/apps/00_pac_bridge_demo.py`

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

Manual removal from StackChan REPL:

```python
import os, esp32
os.remove("/flash/apps/00_pac_bridge_demo.py")
os.remove("/flash/apps/pac_bridge_demo.py")
os.remove("/flash/pac_bridge_client.py")
nvs = esp32.NVS("pac")
nvs.erase_key("bridge_token")
nvs.commit()
```

This does not remove or modify `/flash/boot.py` or `/flash/main.py`.
