import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const configPath = path.join(repoRoot, ".codex", "config.toml");

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

test("codex config defines token budget profiles", () => {
  const config = loadToml(configPath);

  assert.equal(config.model_auto_compact_token_limit, 300000);
  assert.equal(config.profiles.fast.model_reasoning_effort, "low");
  assert.equal(config.profiles.standard.model_reasoning_effort, "high");
  assert.equal(config.profiles.audit.model_reasoning_effort, "xhigh");
  assert.ok(config.profiles.fast.model_auto_compact_token_limit < config.profiles.standard.model_auto_compact_token_limit);
  assert.ok(config.profiles.audit.model_auto_compact_token_limit > config.profiles.standard.model_auto_compact_token_limit);
  assert.match(config.developer_instructions, /lightest safe path/u);
  assert.match(config.developer_instructions, /进入修复阶段/u);
});
