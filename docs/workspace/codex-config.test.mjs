import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const configPath = path.join(repoRoot, ".codex", "config.toml");
const agentsDir = path.join(repoRoot, ".codex", "agents");

function loadToml(pathToFile) {
  const script = `
import json
import pathlib
import tomllib

data = tomllib.loads(pathlib.Path(${JSON.stringify(pathToFile)}).read_text())
print(json.dumps(data, ensure_ascii=False))
`;
  const result = spawnSync("python3", ["-c", script], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `python exited ${result.status}`).trim());
  }
  return JSON.parse(result.stdout);
}

function codexHome() {
  const configured = String(process.env.CODEX_HOME || "").trim();
  return configured ? path.resolve(configured) : path.join(os.homedir(), ".codex");
}

test("codex config defines workspace token budget defaults", () => {
  const config = loadToml(configPath);

  assert.equal(config.review_model, "gpt-5.6-sol");
  assert.equal(config.model_context_window, 1000000);
  assert.equal(config.model_auto_compact_token_limit, 252000);
  assert.ok(config.model_auto_compact_token_limit < config.model_context_window);
  // Runtime context points to policy instead of duplicating a second copy.
  assert.match(config.developer_instructions, /AGENTS\.md/u);
  assert.ok(fs.existsSync(path.join(repoRoot, "AGENTS.md")));
  assert.equal(config.agents.max_concurrent_threads_per_session, 6);
  assert.equal(config.agents.default_subagent_model, "gpt-5.6-luna");
  assert.equal(config.agents.default_subagent_reasoning_effort, "medium");
  assert.equal(config.agents.max_depth, 1);
  for (const legacyKey of ["max_concurrent_threads_per_session", "default_subagent_model", "default_subagent_reasoning_effort", "max_depth", "job_max_runtime_seconds"]) {
    assert.equal(Object.hasOwn(config, legacyKey), false, legacyKey);
  }
  // Primary model and effort belong to the user's selection, not workspace policy.
  assert.equal(Object.hasOwn(config, "model"), false);
  assert.equal(Object.hasOwn(config, "model_reasoning_effort"), false);
});

test("codex profile v2 files define token budget profiles", (context) => {
  const baseConfig = loadToml(configPath);
  const homeDir = codexHome();
  const expectedProfiles = {
    fast: {
      model_reasoning_effort: "low",
      model_auto_compact_token_limit: 180000,
    },
    standard: {
      model_reasoning_effort: "high",
      model_auto_compact_token_limit: 200000,
    },
    audit: {
      model_reasoning_effort: "xhigh",
      model_auto_compact_token_limit: 220000,
    },
  };
  const missing = Object.keys(expectedProfiles)
    .map((name) => path.join(homeDir, `${name}.config.toml`))
    .filter((profilePath) => !fs.existsSync(profilePath));
  if (missing.length > 0) {
    context.skip(`profile v2 files missing under ${homeDir}: ${missing.map((file) => path.basename(file)).join(", ")}`);
    return;
  }

  const loadedProfiles = {};
  for (const [name, expected] of Object.entries(expectedProfiles)) {
    const profile = loadToml(path.join(homeDir, `${name}.config.toml`));
    loadedProfiles[name] = profile;
    assert.equal(profile.model_reasoning_effort, expected.model_reasoning_effort);
    assert.equal(profile.model_auto_compact_token_limit, expected.model_auto_compact_token_limit);
    assert.ok(profile.model_auto_compact_token_limit < baseConfig.model_auto_compact_token_limit);
  }
  assert.ok(loadedProfiles.fast.model_auto_compact_token_limit < loadedProfiles.standard.model_auto_compact_token_limit);
  assert.ok(loadedProfiles.audit.model_auto_compact_token_limit > loadedProfiles.standard.model_auto_compact_token_limit);
});

test("codex roles retain identities with explicit model, reasoning and permission boundaries", () => {
  const agentFiles = fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith(".toml"));
  const expected = {
    repo_mapper: ["gpt-5.6-luna", "medium", "read-only"],
    docs_checker: ["gpt-5.6-luna", "medium", "read-only"],
    surgical_fixer: ["gpt-5.6-luna", "xhigh", "workspace-write"],
    verifier: ["gpt-5.6-luna", "xhigh", "workspace-write"],
    refactor_worker: ["gpt-5.6-sol", "high", "workspace-write"],
    review_guard: ["gpt-5.6-sol", "high", "read-only"],
    worker: ["gpt-5.6-sol", "high", "workspace-write"],
    independent_reviewer: ["gpt-6-astra", "xhigh", "read-only"],
  };
  const seen = new Set();

  for (const file of agentFiles) {
    const agent = loadToml(path.join(agentsDir, file));
    assert.ok(Object.hasOwn(expected, agent.name), file);
    assert.equal(seen.has(agent.name), false, `duplicate role: ${agent.name}`);
    seen.add(agent.name);
    assert.deepEqual([agent.model, agent.model_reasoning_effort, agent.sandbox_mode], expected[agent.name], file);
    assert.ok(agent.description.trim(), file);
    assert.ok(agent.developer_instructions.trim(), file);
  }
  assert.deepEqual([...seen].sort(), Object.keys(expected).sort());
});
