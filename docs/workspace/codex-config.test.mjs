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

  assert.equal(config.model_context_window, 1000000);
  assert.equal(config.model_auto_compact_token_limit, 900000);
  assert.ok(config.model_auto_compact_token_limit < config.model_context_window);
  assert.match(config.developer_instructions, /lightest safe path/u);
  assert.match(config.developer_instructions, /进入修复阶段/u);
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
      model_auto_compact_token_limit: 300000,
    },
    audit: {
      model_reasoning_effort: "xhigh",
      model_auto_compact_token_limit: 450000,
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

test("codex subagents default to gpt-5.5 xhigh", () => {
  const agentFiles = fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith(".toml"));
  assert.ok(agentFiles.length > 0);

  for (const file of agentFiles) {
    const agent = loadToml(path.join(agentsDir, file));
    assert.equal(agent.model, "gpt-5.5", file);
    assert.equal(agent.model_reasoning_effort, "xhigh", file);
  }
});
