#!/usr/bin/env python3
"""Workspace-local Codex hook guardrails."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


WORKSPACE_ROOT = Path("/Users/zhangjincheng/Documents/GitHub/codex-workspace")
STATE_PATH = Path.home() / ".codex" / "state" / "codex-workspace-hooks.json"
REPAIR_PHRASE = "进入修复阶段"
REPAIR_AUTH_TTL_SECONDS = 30 * 60


ROUTE_HINTS = [
    {
        "project": "OpenClaw",
        "keywords": ["openclaw", "open claw", "benben", "adminai", "openclaw-mac-migration"],
        "surface": "ops/projects/openclaw; projects/products/openclaw/nas-openclaw-v22",
        "risk": "OpenClaw/live/NAS requests are L2 read-only by default; L3 changes require the exact repair phrase.",
    },
    {
        "project": "NAS Platform",
        "keywords": ["nas-platform"],
        "surface": "ops/projects/nas-platform; projects/infrastructure/nas-platform",
        "risk": "NAS host/config/service work is L2 read-only unless repair is explicitly opened.",
    },
    {
        "project": "Telegram Dual Relay",
        "keywords": ["telegram-dual-relay", "telegram dual relay"],
        "surface": "ops/projects/telegram-dual-relay; projects/infrastructure/telegram-dual-relay",
        "risk": "Relay service changes are L3 when they touch live service state.",
    },
    {
        "project": "MathorCup-D",
        "keywords": ["mathorcup-d", "mathorcup_d", "mathorcup", "mathorcup_d_repo"],
        "surface": "ops/projects/mathorcup-d; projects/products/MathorCup_D_repo",
        "risk": "Research/submission work is normally L0/L1 unless it changes publication or delivery state.",
    },
    {
        "project": "BigData-Spark-Research-Workbench",
        "keywords": ["bigdata-spark-research-workbench", "spark-research-workbench", "bigdata-spark-research"],
        "surface": "ops/projects/bigdata-spark-research-workbench; projects/research/bigdata-spark-research-workbench",
        "risk": "Research workbench changes are normally L0/L1.",
    },
    {
        "project": "CUMCM-2026-Workbench",
        "keywords": ["cumcm-2026-workbench", "cumcm2026", "cumcm-workbench"],
        "surface": "ops/projects/cumcm-2026-workbench; projects/research/cumcm-2026-workbench",
        "risk": "Competition/research work is normally L0/L1 unless external submission state changes.",
    },
]

READ_ONLY_LIVE_TERMS = [
    "oc-nas",
    "openclaw",
    "openclaw-gateway",
    "openclaw-benben",
    "nas-platform",
    "telegram-dual-relay",
    "/etc/openclaw",
    "production",
    " prod ",
]

TRACKABLE_EXACT_PATHS = {
    "AGENTS.md",
    "WORKER.md",
    "CLAUDE.md",
    ".gitignore",
    ".codex/config.toml",
    ".codex/hooks.json",
    "README.md",
    "WORKSPACE_MAP.md",
    "ops/README.md",
    "ops/projects/README.md",
    "ops/projects/PROJECT_TEMPLATE.md",
}

TRACKABLE_PREFIXES = (
    ".codex/agents/",
    ".codex/hooks/",
    "docs/",
)

PROJECT_OPS_DOCS = {
    "README.md",
    "DEPLOYMENT_LEDGER.md",
    "ARCHITECTURE_TODO.md",
}

PROJECT_OPS_TRACKED_DIRS = {
    "manifests",
    "reports",
    "runbooks",
}

HARD_BLOCK_PATTERNS = [
    (re.compile(r"\bgit\s+reset\s+--hard\b", re.I), "git reset --hard is destructive and is blocked by workspace policy."),
    (re.compile(r"\bgit\s+checkout\s+--\b", re.I), "git checkout -- can discard user work and is blocked by workspace policy."),
    (re.compile(r"\bgit\s+clean\s+-[A-Za-z]*f", re.I), "git clean -f can delete untracked work and is blocked by workspace policy."),
    (re.compile(r"\brm\s+-[A-Za-z]*r[A-Za-z]*f\b|\brm\s+-[A-Za-z]*f[A-Za-z]*r\b", re.I), "rm -rf is blocked; use a narrowly reviewed cleanup command instead."),
    (re.compile(r"\bfind\b.+\s-delete\b", re.I | re.S), "find -delete is blocked because it can remove broad path sets."),
    (re.compile(r"\bmkfs(\.\w+)?\b|\bdiskutil\s+erase|\bdd\s+.*\bof=", re.I | re.S), "Disk formatting/raw write commands are blocked."),
    (re.compile(r"\b(?:curl|wget)\b.+\|\s*(?:sh|bash|zsh)\b", re.I | re.S), "Piping remote scripts into a shell is blocked."),
]

L3_BLOCK_PATTERNS = [
    (re.compile(r"\bsystemctl\s+(?:restart|stop|start|reload|enable|disable|edit|daemon-reload)\b", re.I), "systemd service mutation is L3 repair execution."),
    (re.compile(r"\bservice\s+\S+\s+(?:restart|stop|start|reload)\b", re.I), "service mutation is L3 repair execution."),
    (re.compile(r"\bdocker\s+(?:compose\s+)?(?:down|rm|rmi|prune|restart|stop|kill)\b", re.I), "Docker runtime mutation is L3 repair execution."),
    (re.compile(r"\bdocker\s+system\s+prune\b|\bdocker\s+volume\s+rm\b", re.I), "Docker destructive cleanup is L3 repair execution."),
    (re.compile(r"\bkubectl\s+(?:apply|delete|rollout|scale|patch|cordon|drain)\b", re.I), "Kubernetes mutation is L3 repair execution."),
    (re.compile(r"\bhelm\s+(?:upgrade|install|rollback|uninstall)\b", re.I), "Helm mutation is L3 repair execution."),
    (re.compile(r"\bterraform\s+(?:apply|destroy|import|taint)\b", re.I), "Terraform state mutation is L3 repair execution."),
    (re.compile(r"\bwrangler\s+deploy\b|\bvercel\b.+--prod\b|\bnetlify\s+deploy\b.+--prod\b", re.I | re.S), "Production deploy command is L3 repair execution."),
    (re.compile(r"\b(?:scp|rsync)\b.+\boc-nas\b|\boc-nas\b.+\b(?:scp|rsync)\b", re.I | re.S), "Copying files to or from oc-nas is L3 unless explicitly scoped as read-only evidence collection."),
    (re.compile(r"\bssh\b.+\boc-nas\b.+(?:systemctl|docker|kubectl|helm|terraform|sed\s+-i|tee\s+/etc|>\s*/etc|rm\s+-|mv\s+/etc|cp\s+.+/etc)", re.I | re.S), "Remote live-host mutation through oc-nas is L3 repair execution."),
]


def load_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def emit_json(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False))


def emit_context(event_name: str, message: str) -> None:
    emit_json(
        {
            "hookSpecificOutput": {
                "hookEventName": event_name,
                "additionalContext": message,
            }
        }
    )


def emit_system_message(message: str) -> None:
    emit_json({"systemMessage": message})


def deny_pre_tool(reason: str) -> None:
    emit_json(
        {
            "systemMessage": reason,
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            },
        }
    )


def deny_permission_request(reason: str) -> None:
    emit_json(
        {
            "systemMessage": reason,
            "hookSpecificOutput": {
                "hookEventName": "PermissionRequest",
                "decision": {
                    "behavior": "deny",
                    "message": reason,
                },
            },
        }
    )


def session_key(payload: dict[str, Any]) -> str:
    for key in ("session_id", "session-id", "sessionId", "thread_id", "thread-id"):
        value = str(payload.get(key) or "").strip()
        if value:
            return value
    return f"cwd:{payload.get('cwd') or os.getcwd()}"


def read_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {}
    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def write_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def record_repair_auth(payload: dict[str, Any]) -> None:
    state = read_state()
    now = int(time.time())
    state[session_key(payload)] = {
        "authorized_at": now,
        "expires_at": now + REPAIR_AUTH_TTL_SECONDS,
    }
    write_state(state)


def repair_auth_active(payload: dict[str, Any]) -> bool:
    entry = read_state().get(session_key(payload))
    if not isinstance(entry, dict):
        return False
    return int(entry.get("expires_at") or 0) > int(time.time())


def workspace_context() -> str:
    return (
        "Workspace guardrails: this root is the codex-workspace index, not a default product repo. "
        "Start substantive work by stating task level, rationale, and execution strategy. "
        "Route project work only from explicit evidence in ops/projects/<project>/README.md or a named path/service. "
        "OpenClaw/NAS/live/production work is L2 read-only by default; L3 state changes require the exact phrase "
        f"{REPAIR_PHRASE!r}. Use Route Lock for long tasks and keep root tracking limited to workspace control files."
    )


def matching_routes(prompt: str) -> list[dict[str, str]]:
    lowered = prompt.lower()
    matches = []
    for route in ROUTE_HINTS:
        if any(keyword in lowered for keyword in route["keywords"]):
            matches.append(route)
    return matches


def prompt_context(payload: dict[str, Any]) -> str:
    prompt = str(payload.get("prompt") or "")
    lowered = f" {prompt.lower()} "
    parts = []

    matches = matching_routes(prompt)
    if matches:
        route_lines = [
            f"{item['project']}: route via {item['surface']}. {item['risk']}"
            for item in matches
        ]
        parts.append("Route hint from prompt: " + " | ".join(route_lines))

    if "oc-nas" in lowered and not any(name in lowered for name in (" openclaw ", " nas-platform ", " telegram-dual-relay ")):
        parts.append(
            "oc-nas is a shared live host alias across registered projects; do not infer the target project without clearer service/path evidence."
        )

    if any(term in lowered for term in (" live ", " production ", " prod ", " ssh ", " systemctl ", " restart ", " deploy ", " rollback ", " oc-nas ")):
        parts.append(
            "Risk reminder: live/production/status/config/service investigations are L2 read-only; service changes, deploys, restarts, rollback, or config writes are L3."
        )

    if REPAIR_PHRASE in prompt:
        record_repair_auth(payload)
        parts.append(
            "Repair gate phrase detected for this session for 30 minutes. Keep the L3 plan scoped, preserve rollback evidence, and do not broaden the repair."
        )

    return " ".join(parts)


def command_text(payload: dict[str, Any]) -> str:
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return ""
    for key in ("command", "cmd"):
        value = tool_input.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def has_live_terms(command: str) -> bool:
    lowered = f" {command.lower()} "
    return any(term in lowered for term in READ_ONLY_LIVE_TERMS)


def classify_command(command: str) -> tuple[str, str]:
    if not command:
        return "", ""

    for pattern, reason in HARD_BLOCK_PATTERNS:
        if pattern.search(command):
            return "hard_block", reason

    for pattern, reason in L3_BLOCK_PATTERNS:
        if pattern.search(command):
            return "l3_block", reason

    if has_live_terms(command):
        return "live_notice", "Workspace hook: live/NAS/production term detected. Treat this as L2 read-only unless a scoped L3 repair gate is already open."

    return "", ""


def is_trackable_path(relative_path: str) -> bool:
    normalized = str(relative_path or "").strip().replace("\\", "/")
    if not normalized:
        return False
    if normalized in TRACKABLE_EXACT_PATHS:
        return True
    if any(normalized.startswith(prefix) for prefix in TRACKABLE_PREFIXES):
        return True

    project_ops_match = re.match(r"^ops/projects/([^/]+)/([^/]+)$", normalized)
    if project_ops_match and project_ops_match.group(2) in PROJECT_OPS_DOCS:
        return True

    project_ops_subdir_match = re.match(r"^ops/projects/[^/]+/([^/]+)/.+", normalized)
    if project_ops_subdir_match and project_ops_subdir_match.group(1) in PROJECT_OPS_TRACKED_DIRS:
        return True

    return False


def run_repo_hygiene() -> dict[str, Any]:
    script = WORKSPACE_ROOT / "docs" / "workspace" / "repo-hygiene.mjs"
    if not script.exists():
        return {"error": f"missing hygiene script: {script}"}
    completed = subprocess.run(
        ["node", str(script), "--repo", str(WORKSPACE_ROOT), "--json", "--quiet"],
        check=False,
        capture_output=True,
        text=True,
        timeout=20,
    )
    if completed.returncode != 0:
        return {
            "error": (completed.stderr or completed.stdout or "repo hygiene failed").strip(),
        }
    try:
        data = json.loads((completed.stdout or "").strip() or "{}")
    except json.JSONDecodeError as exc:
        return {"error": f"repo hygiene returned invalid JSON: {exc}"}
    return data if isinstance(data, dict) else {"error": "repo hygiene returned non-object JSON"}


def summarize_hygiene_issues(summary: dict[str, Any]) -> str:
    if summary.get("error"):
        return f"Workspace hygiene check failed: {summary['error']}"

    after = summary.get("after") if isinstance(summary.get("after"), dict) else {}
    pending_paths = []
    for key in ("modified_tracked", "untracked_source", "other_tracked"):
        values = after.get(key) if isinstance(after.get(key), list) else []
        pending_paths.extend(str(value) for value in values)

    non_trackable = [path for path in pending_paths if not is_trackable_path(path)]
    unregistered = summary.get("unregistered_project_surfaces") or []
    missing_refs = summary.get("nonexistent_project_references") or []

    messages = []
    if non_trackable:
        preview = ", ".join(non_trackable[:5])
        suffix = f" (+{len(non_trackable) - 5} more)" if len(non_trackable) > 5 else ""
        messages.append(f"non-trackable workspace paths changed: {preview}{suffix}")
    if unregistered:
        preview = ", ".join(str(item) for item in unregistered[:3])
        suffix = f" (+{len(unregistered) - 3} more)" if len(unregistered) > 3 else ""
        messages.append(f"unregistered project surfaces detected: {preview}{suffix}")
    if missing_refs:
        preview = ", ".join(str(item) for item in missing_refs[:3])
        suffix = f" (+{len(missing_refs) - 3} more)" if len(missing_refs) > 3 else ""
        messages.append(f"nonexistent project references detected: {preview}{suffix}")

    if not messages:
        return ""
    return "Workspace hygiene attention: " + " | ".join(messages)


def check_command(payload: dict[str, Any]) -> None:
    command = command_text(payload)
    policy, reason = classify_command(command)
    if policy == "hard_block":
        deny_pre_tool(reason)
        return
    if policy == "l3_block":
        if repair_auth_active(payload):
            emit_system_message(
                f"Workspace hook: L3-looking command allowed because {REPAIR_PHRASE!r} was seen recently. Keep execution scoped and verify rollback."
            )
            return
        deny_pre_tool(f"{reason} Ask the user to say {REPAIR_PHRASE!r} before executing this state-changing action.")
        return
    if policy == "live_notice":
        emit_system_message(reason)


def check_hygiene_after_edit() -> None:
    message = summarize_hygiene_issues(run_repo_hygiene())
    if message:
        emit_system_message(message)


def check_permission_request(payload: dict[str, Any]) -> None:
    command = command_text(payload)
    policy, reason = classify_command(command)
    if policy == "hard_block":
        deny_permission_request(reason)
        return
    if policy == "l3_block" and not repair_auth_active(payload):
        deny_permission_request(f"{reason} Ask the user to say {REPAIR_PHRASE!r} before approving this state-changing action.")


def check_stop(payload: dict[str, Any]) -> None:
    message = str(payload.get("last_assistant_message") or "")
    if not message.strip():
        return

    lowered = message.lower()
    mentions_high_risk = any(
        token in lowered
        for token in ("l2", "l3", "live", "production", "oc-nas", "openclaw", "nas")
    )
    has_status_closeout = any(
        token in lowered
        for token in ("completed", "confirmed", "unconfirmed", "risks", "next steps", "rollback")
    )
    if mentions_high_risk and not has_status_closeout:
        emit_system_message(
            "Workspace closeout reminder: L2/L3/live answers should separate confirmed evidence, hypotheses or risks, and next steps."
        )


def main() -> int:
    event = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
    payload = load_payload()

    if event == "session-start":
        emit_context("SessionStart", workspace_context())
        return 0

    if event == "user-prompt-submit":
        context = prompt_context(payload)
        if context:
            emit_context("UserPromptSubmit", context)
        return 0

    if event == "pre-tool-use":
        check_command(payload)
        return 0

    if event == "permission-request":
        check_permission_request(payload)
        return 0

    if event == "post-tool-use":
        check_hygiene_after_edit()
        return 0

    if event == "stop":
        check_stop(payload)
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
