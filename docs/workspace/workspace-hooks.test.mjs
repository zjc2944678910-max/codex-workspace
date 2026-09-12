import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const hookScript = path.join(repoRoot, ".codex", "hooks", "workspace_guard.py");
const hooksConfigPath = path.join(repoRoot, ".codex", "hooks.json");

function runHook(event, payload = {}, extraEnv = {}) {
  const result = spawnSync("python3", [hookScript, event], {
    cwd: repoRoot,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", ...extraEnv },
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

test("session and prompt hooks omit active-run reminders without accessing task indexes", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-long-task-"));
  try {
    const registryPath = path.join(tempRoot, "docs", "workspace", "project-registry.json");
    const indexPath = path.join(tempRoot, "state", "project-data", "demo", "codex-long-tasks", "index.json");
    const opsPath = path.join(tempRoot, "ops", "projects", "demo", "README.md");
    mkdirSync(path.dirname(registryPath), { recursive: true });
    mkdirSync(path.dirname(indexPath), { recursive: true });
    mkdirSync(path.dirname(opsPath), { recursive: true });
    writeFileSync(registryPath, `${JSON.stringify({ projects: [{
      slug: "demo",
      name: "Demo Project",
      routing_keywords: ["demo"],
      ops_surface: "ops/projects/demo",
      state_data: "state/project-data/demo",
      risk_profile: "local",
    }] })}\n`);
    writeFileSync(indexPath, `${JSON.stringify({
      schema: "codex-long-task-index/v1",
      runs: [
        { project: "demo", status: "active", run_root: "/tmp/run-1", next_action: "step one", updated_at: "2026-08-27T12:05:00Z" },
        { project: "demo", status: "blocked", run_root: "/tmp/run-2", next_action: "add new evidence", updated_at: "2026-08-27T12:04:00Z" },
        { project: "demo", status: "needs_user_decision", run_root: "/tmp/run-3", next_action: "wait for user", updated_at: "2026-08-27T12:03:00Z" },
        { project: "demo", status: "active", run_root: "/tmp/run-4", next_action: "older step", updated_at: "2026-08-27T12:02:00Z" },
        { project: "demo", status: "completed", run_root: "/tmp/run-closed", next_action: "none", updated_at: "2026-08-27T12:06:00Z" },
      ],
    })}\n`);
    writeFileSync(opsPath, "# Demo OPS\n");
    const indexBefore = readFileSync(indexPath, "utf8");
    const opsBefore = readFileSync(opsPath, "utf8");
    const python = `
import importlib.util
import json
import pathlib

script = pathlib.Path(${JSON.stringify(hookScript)})
spec = importlib.util.spec_from_file_location("workspace_guard", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

module.WORKSPACE_ROOT = pathlib.Path(${JSON.stringify(tempRoot)})
module.PROJECT_REGISTRY_PATH = pathlib.Path(${JSON.stringify(registryPath)})
index_path = pathlib.Path(${JSON.stringify(indexPath)})
index_accesses = []
original_open = pathlib.Path.open

def tracked_open(self, *args, **kwargs):
    if self == index_path:
        mode = args[0] if args else kwargs.get("mode", "r")
        index_accesses.append(str(mode))
    return original_open(self, *args, **kwargs)

pathlib.Path.open = tracked_open
print(json.dumps({
    "session": module.workspace_context(),
    "prompt": module.prompt_context({"prompt": "continue demo long task"}),
    "index_accesses": index_accesses,
}))
`;
    const result = spawnSync("python3", ["-c", python], {
      cwd: repoRoot,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) throw new Error((result.stderr || result.stdout).trim());
    const output = JSON.parse(result.stdout);
    for (const context of [output.session, output.prompt]) {
      assert.doesNotMatch(context, /Active long-task reminder/u);
      assert.doesNotMatch(context, /run-[1-4]|run-closed/u);
      assert.doesNotMatch(context, /step one|add new evidence|wait for user|older step/u);
    }
    assert.deepEqual(output.index_accesses, []);
    assert.equal(readFileSync(indexPath, "utf8"), indexBefore);
    assert.equal(readFileSync(opsPath, "utf8"), opsBefore);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
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

test("pre-tool matcher covers command and file-writing tools", () => {
  const config = JSON.parse(readFileSync(hooksConfigPath, "utf8"));
  const matcher = config.hooks?.PreToolUse?.[0]?.matcher || "";
  for (const toolName of ["Bash", "exec_command", "functions.exec_command", "apply_patch", "functions.apply_patch", "Edit", "Write"]) {
    assert.match(toolName, new RegExp(`^(?:${matcher})$`));
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

test("legacy long-task state is read-only until the current task explicitly opts in", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-legacy-state-"));
  try {
    const statePath = path.join(tempRoot, "state.json");
    const env = { CODEX_WORKSPACE_HOOK_STATE_PATH: statePath };
    const runRoot = path.join(tempRoot, "state", "project-data", "demo", "codex-runs", "run-1");

    for (const command of [
      `node docs/workspace/codex-long-task.mjs checkpoint --run-root ${runRoot} --phase implementing --next-action test`,
      `node docs/workspace/codex-long-task.mjs resume --run-root ${runRoot}`,
      `python3 -c "from pathlib import Path; Path('08-continuation.json').write_text('{}')"`,
    ]) {
      const output = runHook("pre-tool-use", {
        session_id: "legacy-task",
        tool_name: "functions.exec_command",
        tool_input: { command, workdir: runRoot },
      }, env);
      assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
      assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
      assert.match(output.hookSpecificOutput.permissionDecisionReason, /启用旧长任务流程/u);
    }

    const missingWorkdirOutput = runHook("pre-tool-use", {
      session_id: "legacy-task",
      tool_name: "functions.exec_command",
      tool_input: {
        command: `python3 -c "from pathlib import Path; Path('08-continuation.json').write_text('{}')"`,
      },
    }, env);
    assert.equal(missingWorkdirOutput.hookSpecificOutput.permissionDecision, "deny");

    const statusOutput = runHook("pre-tool-use", {
      session_id: "legacy-task",
      tool_name: "functions.exec_command",
      tool_input: {
        command: `node docs/workspace/codex-long-task.mjs status --run-root ${runRoot}`,
        workdir: repoRoot,
      },
    }, env);
    assert.deepEqual(statusOutput, {});

    for (const command of [
      "node docs/workspace/codex-long-task.mjs --help",
      `node docs/workspace/codex-long-task.mjs checkpoint --run-root ${runRoot} --help`,
      `node docs/workspace/codex-long-task.mjs checkpoint --run-root ${runRoot} --phase test --next-action verify --dry-run`,
    ]) {
      assert.deepEqual(runHook("pre-tool-use", {
        session_id: "legacy-task",
        tool_name: "functions.exec_command",
        tool_input: { command, workdir: repoRoot },
      }, env), {});
    }

    const readOutput = runHook("pre-tool-use", {
      session_id: "legacy-task",
      tool_name: "functions.exec_command",
      tool_input: { command: "cat 08-continuation.json", workdir: runRoot },
    }, env);
    assert.deepEqual(readOutput, {});

    const searchOutput = runHook("pre-tool-use", {
      session_id: "legacy-task",
      tool_name: "functions.exec_command",
      tool_input: {
        command: "rg -n 'codex-long-task.mjs checkpoint|08-continuation.json|write_text' docs/workspace",
        workdir: repoRoot,
      },
    }, env);
    assert.deepEqual(searchOutput, {});
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("legacy long-task file tools block control state but allow candidate source", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-legacy-files-"));
  try {
    const env = { CODEX_WORKSPACE_HOOK_STATE_PATH: path.join(tempRoot, "state.json") };
    const runRoot = path.join(tempRoot, "state", "project-data", "demo", "codex-runs", "run-1");
    const controlPatch = `*** Begin Patch\n*** Update File: ${runRoot}/03-task-ledger.md\n@@\n-old\n+new\n*** End Patch`;
    const denied = runHook("pre-tool-use", {
      session_id: "legacy-files",
      tool_name: "apply_patch",
      tool_input: { patch: controlPatch },
    }, env);
    assert.equal(denied.hookSpecificOutput.permissionDecision, "deny");
    assert.match(denied.hookSpecificOutput.permissionDecisionReason, /control state/u);

    const editDenied = runHook("pre-tool-use", {
      session_id: "legacy-files",
      tool_name: "Write",
      tool_input: { file_path: `${runRoot}/09-failure-ledger.jsonl`, content: "{}\n" },
    }, env);
    assert.equal(editDenied.hookSpecificOutput.permissionDecision, "deny");

    const candidateAllowed = runHook("pre-tool-use", {
      session_id: "legacy-files",
      tool_name: "apply_patch",
      tool_input: {
        patch: `*** Begin Patch\n*** Update File: ${runRoot}/candidate/src/example.py\n@@\n-old\n+new\n*** End Patch`,
      },
    }, env);
    assert.deepEqual(candidateAllowed, {});
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("legacy long-task opt-in is task-scoped and stop or disable revokes it", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-legacy-auth-"));
  try {
    const statePath = path.join(tempRoot, "state.json");
    const env = { CODEX_WORKSPACE_HOOK_STATE_PATH: statePath };
    const command = "node docs/workspace/codex-long-task.mjs checkpoint --run-root /tmp/demo/codex-runs/run-1 --phase test --next-action verify";
    const payload = {
      session_id: "opted-in-task",
      tool_name: "functions.exec_command",
      tool_input: { command, workdir: repoRoot },
    };

    const quotedPrompt = runHook("user-prompt-submit", {
      session_id: "quoted-task",
      prompt: "是不是说‘启用旧长任务流程’就可以？",
    }, env);
    assert.doesNotMatch(quotedPrompt.hookSpecificOutput?.additionalContext || "", /explicitly enabled/u);
    assert.equal(runHook("pre-tool-use", { ...payload, session_id: "quoted-task" }, env).hookSpecificOutput.permissionDecision, "deny");

    const enabled = runHook("user-prompt-submit", {
      session_id: "opted-in-task",
      prompt: "启用旧长任务流程",
    }, env);
    assert.match(enabled.hookSpecificOutput.additionalContext, /explicitly enabled/u);
    assert.deepEqual(runHook("pre-tool-use", payload, env), {});
    assert.equal(runHook("pre-tool-use", { ...payload, session_id: "other-task" }, env).hookSpecificOutput.permissionDecision, "deny");

    runHook("user-prompt-submit", {
      session_id: "opted-in-task",
      prompt: "停用旧长任务流程",
    }, env);
    assert.equal(runHook("pre-tool-use", payload, env).hookSpecificOutput.permissionDecision, "deny");

    runHook("user-prompt-submit", {
      session_id: "opted-in-task",
      prompt: "启用旧长任务流程",
    }, env);
    runHook("stop", {
      session_id: "opted-in-task",
      last_assistant_message: "completed\nconfirmed: done\nrisks: none",
    }, env);
    assert.equal(runHook("pre-tool-use", payload, env).hookSpecificOutput.permissionDecision, "deny");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
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

test("pre-tool hook allows git clean dry-run but denies forced clean", () => {
  const dryRunOutput = runHook("pre-tool-use", {
    tool_input: {
      command: "git clean -nfd",
    },
  });
  assert.deepEqual(dryRunOutput, {});

  const destructiveOutput = runHook("pre-tool-use", {
    tool_input: {
      command: "git clean -fd",
    },
  });
  assert.equal(destructiveOutput.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(destructiveOutput.hookSpecificOutput.permissionDecision, "deny");
  assert.match(destructiveOutput.hookSpecificOutput.permissionDecisionReason, /git clean -f/u);
});

test("pre-tool hook allows read-only remote service status with live notice", () => {
  const output = runHook("pre-tool-use", {
    tool_input: {
      command: "ssh oc-nas 'systemctl status openclaw-gateway --no-pager'",
    },
  });
  assert.match(output.systemMessage, /L2 read-only/u);
  assert.equal(output.hookSpecificOutput, undefined);
});

test("pre-tool hook denies remote live reboot commands", () => {
  for (const command of [
    "ssh oc-nas 'sudo reboot'",
    "ssh oc-nas 'sudo shutdown -r now'",
  ]) {
    const output = runHook("pre-tool-use", {
      tool_input: { command },
    });
    assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
    assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
    assert.match(output.hookSpecificOutput.permissionDecisionReason, /进入修复阶段/u);
  }
});

test("pre-tool hook denies local service mutation commands", () => {
  for (const command of [
    "brew services restart postgresql",
    "launchctl kickstart -k gui/501/com.example.agent",
  ]) {
    const output = runHook("pre-tool-use", {
      tool_input: { command },
    });
    assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
    assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
    assert.match(output.hookSpecificOutput.permissionDecisionReason, /L3 repair execution/u);
  }
});

test("hook trackable-path policy accepts generated workspace entrypoints", () => {
  const python = `
import importlib.util
import json
import pathlib

script = pathlib.Path(${JSON.stringify(hookScript)})
spec = importlib.util.spec_from_file_location("workspace_guard", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

print(json.dumps({
    "PROJECTS.md": module.is_trackable_path("PROJECTS.md"),
    "MOC.md": module.is_trackable_path("MOC.md"),
    "DAILY.md": module.is_trackable_path("DAILY.md"),
    "AGENTS.md": module.is_trackable_path("AGENTS.md"),
}))
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

  const trackable = JSON.parse(result.stdout);
  assert.equal(trackable["PROJECTS.md"], true);
  assert.equal(trackable["MOC.md"], true);
  assert.equal(trackable["DAILY.md"], true);
  assert.equal(trackable["AGENTS.md"], true);
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

test("permission hook denies legacy state mutation without task opt-in", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-legacy-permission-"));
  try {
    const output = runHook("permission-request", {
      session_id: "legacy-permission-task",
      tool_input: {
        command: "node docs/workspace/codex-long-task.mjs checkpoint --run-root /tmp/demo/codex-runs/run-1 --phase test --next-action verify",
      },
    }, { CODEX_WORKSPACE_HOOK_STATE_PATH: path.join(tempRoot, "state.json") });
    assert.equal(output.hookSpecificOutput.hookEventName, "PermissionRequest");
    assert.equal(output.hookSpecificOutput.decision.behavior, "deny");
    assert.match(output.hookSpecificOutput.decision.message, /启用旧长任务流程/u);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("repair authorization state keeps task entries and prunes expired legacy entries", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-state-"));
  try {
    const statePath = path.join(tempRoot, "state.json");
    const python = `
import importlib.util
import json
import pathlib
import time

script = pathlib.Path(${JSON.stringify(hookScript)})
spec = importlib.util.spec_from_file_location("workspace_guard", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

module.STATE_PATH = pathlib.Path(${JSON.stringify(statePath)})
now = int(time.time())
module.write_state({
    "expired-session": {"authorized_at": now - 3600, "expires_at": now - 1},
    "active-legacy-session": {"authorized_at": now, "expires_at": now + 600},
    "task-session": {"authorized_at": now - 7200, "scope": module.REPAIR_AUTH_SCOPE},
})

active = module.repair_auth_active({"session_id": "task-session"})
print(json.dumps({"active": active, "state": module.read_state()}))
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

    const output = JSON.parse(result.stdout);
    assert.equal(output.active, true);
    assert.deepEqual(Object.keys(output.state), ["active-legacy-session", "task-session"]);
    assert.equal(output.state["task-session"].scope, "task");
    assert.equal("expires_at" in output.state["task-session"], false);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("repair authorization lasts until the stop hook completes the task", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "codex-workspace-hook-state-"));
  try {
    const statePath = path.join(tempRoot, "state.json");
    const python = `
import importlib.util
import json
import pathlib

script = pathlib.Path(${JSON.stringify(hookScript)})
spec = importlib.util.spec_from_file_location("workspace_guard", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

module.STATE_PATH = pathlib.Path(${JSON.stringify(statePath)})
payload = {"session_id": "task-session", "prompt": module.REPAIR_PHRASE}
context = module.prompt_context(payload)
stored = module.read_state()["task-session"]
active_before_stop = module.repair_auth_active(payload)
module.check_stop({
    **payload,
    "last_assistant_message": "completed\\nconfirmed: local tests passed\\nrisks: none",
})
active_after_stop = module.repair_auth_active(payload)

print(json.dumps({
    "context": context,
    "stored": stored,
    "active_before_stop": active_before_stop,
    "active_after_stop": active_after_stop,
    "state": module.read_state(),
}))
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

    const output = JSON.parse(result.stdout);
    assert.match(output.context, /current task/u);
    assert.doesNotMatch(output.context, /30 minutes/u);
    assert.equal(output.stored.scope, "task");
    assert.equal("expires_at" in output.stored, false);
    assert.equal(output.active_before_stop, true);
    assert.equal(output.active_after_stop, false);
    assert.deepEqual(output.state, {});
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
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
