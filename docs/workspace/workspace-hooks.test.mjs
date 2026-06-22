import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const hookScript = path.join(repoRoot, ".codex", "hooks", "workspace_guard.py");
const hooksConfigPath = path.join(repoRoot, ".codex", "hooks.json");

function runHook(event, payload = {}) {
  const result = spawnSync("python3", [hookScript, event], {
    cwd: repoRoot,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    input: JSON.stringify(payload),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `hook exited ${result.status}`).trim());
  }
  const stdout = result.stdout.trim();
  return stdout ? JSON.parse(stdout) : {};
}

function hookCommand(eventName) {
  const config = JSON.parse(readFileSync(hooksConfigPath, "utf8"));
  const hooks = config.hooks?.[eventName]?.[0]?.hooks;
  return hooks?.[0]?.command;
}

test("session hook injects workspace routing context", () => {
  const output = runHook("session-start", { source: "startup" });
  assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(output.hookSpecificOutput.additionalContext, /workspace index/u);
  assert.match(output.hookSpecificOutput.additionalContext, /L3 state changes/u);
});

test("configured hook command resolves workspace script from nested git cwd", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-"));
  try {
    const gitInit = spawnSync("git", ["init", "-q"], {
      cwd: tempRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (gitInit.status !== 0) {
      throw new Error((gitInit.stderr || gitInit.stdout || "git exited " + gitInit.status).trim());
    }

    const command = hookCommand("SessionStart");
    assert.equal(typeof command, "string");
    const result = spawnSync("sh", ["-lc", command], {
      cwd: tempRoot,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      input: JSON.stringify({ source: "startup" }),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout.trim());
    assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("prompt hook emits route and risk hints for OpenClaw live work", () => {
  const output = runHook("user-prompt-submit", {
    session_id: "workspace-hooks-test",
    prompt: "看看 OpenClaw openclaw-gateway 状态",
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(output.hookSpecificOutput.additionalContext, /OpenClaw/u);
  assert.match(output.hookSpecificOutput.additionalContext, /L2 read-only/u);
});

test("prompt hook warns on shared live alias ambiguity", () => {
  const output = runHook("user-prompt-submit", {
    session_id: "workspace-hooks-test",
    prompt: "看看 oc-nas 状态",
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(output.hookSpecificOutput.additionalContext, /shared live host alias/u);
  assert.doesNotMatch(output.hookSpecificOutput.additionalContext, /Route hint from prompt:/u);
});

test("prompt hook keeps explicit route evidence when shared live alias is present", () => {
  const output = runHook("user-prompt-submit", {
    session_id: "workspace-hooks-test",
    prompt: "看看 OpenClaw oc-nas 状态",
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(output.hookSpecificOutput.additionalContext, /Route hint from prompt: OpenClaw/u);
  assert.match(output.hookSpecificOutput.additionalContext, /shared live host alias/u);
});

test("pre-tool hook denies destructive git commands", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "git reset --hard HEAD~1",
    },
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
  assert.match(output.hookSpecificOutput.permissionDecisionReason, /blocked/u);
});

test("pre-tool hook warns but does not deny read-only live evidence commands", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "ssh oc-nas 'journalctl -u openclaw-gateway -n 50 --no-pager'",
    },
  });
  assert.match(output.systemMessage, /L2 read-only/u);
  assert.equal(output.hookSpecificOutput, undefined);
});

test("pre-tool hook allows inspection searches that mention blocked text", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "rg -n 'git reset --hard|rm -rf' AGENTS.md WORKER.md",
    },
  });
  assert.deepEqual(output, {});
});

test("pre-tool hook still denies shell wrapper execution of blocked commands", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "bash -lc 'git reset --hard HEAD~1'",
    },
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
  assert.match(output.hookSpecificOutput.permissionDecisionReason, /git reset --hard/u);
});

test("pre-tool hook treats git status with flags as inspection", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "git -C /tmp/example status --short",
    },
  });
  assert.deepEqual(output, {});
});

test("permission hook denies L3 approval requests without repair gate", () => {
  const output = runHook("permission-request", {
    tool_input: {
      command: "ssh oc-nas 'sudo systemctl restart openclaw-gateway'",
    },
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "PermissionRequest");
  assert.equal(output.hookSpecificOutput.decision.behavior, "deny");
  assert.match(output.hookSpecificOutput.decision.message, /进入修复阶段/u);
});

test("stop hook reminds high-risk answers to include structured closeout", () => {
  const output = runHook("stop", {
    last_assistant_message: "OpenClaw oc-nas live audit looked concerning.",
  });
  assert.match(output.systemMessage, /confirmed evidence/u);
});

test("stop hook stays quiet for normal completed closeouts", () => {
  const output = runHook("stop", {
    last_assistant_message: "completed\nconfirmed: local tests passed\nrisks: none",
  });
  assert.deepEqual(output, {});
});

test("hygiene summarizer only reports non-trackable workspace paths", () => {
  const python = `
import importlib.util
import json
import pathlib

script = pathlib.Path(${JSON.stringify(hookScript)})
spec = importlib.util.spec_from_file_location("workspace_guard", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

cases = [
    {
        "after": {
            "modified_tracked": [".codex/config.toml"],
            "untracked_source": [".codex/hooks/workspace_guard.py"],
            "other_tracked": [],
        },
        "unregistered_project_surfaces": [],
        "nonexistent_project_references": [],
    },
    {
        "after": {
            "modified_tracked": [],
            "untracked_source": ["projects/products/example/file.txt"],
            "other_tracked": [],
        },
        "unregistered_project_surfaces": [],
        "nonexistent_project_references": [],
    },
]

print(json.dumps([module.summarize_hygiene_issues(case) for case in cases]))
`;

  const result = spawnSync("python3", ["-c", python], {
    cwd: repoRoot,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `python exited ${result.status}`).trim());
  }

  const [cleanMessage, dirtyMessage] = JSON.parse(result.stdout);
  assert.equal(cleanMessage, "");
  assert.match(dirtyMessage, /non-trackable workspace paths changed/u);
  assert.match(dirtyMessage, /projects\/products\/example\/file\.txt/u);
});
