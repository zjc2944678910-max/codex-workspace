import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";

import { buildCheckpointCommitMessage, buildRepoHygieneSummary, classifyStatusEntries, expandStatusPath, isTrackablePath, summarizeCheckpointScope } from "./repo-hygiene.mjs";

function runGit(repoRoot, args) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
}

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workspace-hygiene-"));
  runGit(root, ["init"]);
  runGit(root, ["config", "user.name", "Codex"]);
  runGit(root, ["config", "user.email", "codex@example.com"]);

  await fs.mkdir(path.join(root, ".codex", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(root, "ops", "projects", "sample-product", "manifests"), { recursive: true });
  await fs.writeFile(path.join(root, "AGENTS.md"), "agents\n", "utf8");
  await fs.writeFile(path.join(root, "WORKER.md"), "worker contract\n", "utf8");
  await fs.writeFile(path.join(root, "CLAUDE.md"), "legacy adapter shim\n", "utf8");
  await fs.writeFile(path.join(root, ".codex", "config.toml"), "model = \"gpt-5.4\"\n", "utf8");
  await fs.writeFile(path.join(root, "README.md"), "workspace\n", "utf8");
  await fs.writeFile(path.join(root, "WORKSPACE_MAP.md"), "map\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "PROJECT_TEMPLATE.md"), "template\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "sample-product", "README.md"), "sample\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "sample-product", "DEPLOYMENT_LEDGER.md"), "ledger\n", "utf8");
  await fs.writeFile(path.join(root, ".gitignore"), "/state/\n/projects/\n", "utf8");
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "fixture"]);
  return root;
}

test("root hygiene trackable-path gate matches workspace policy", () => {
  assert.equal(isTrackablePath("AGENTS.md"), true);
  assert.equal(isTrackablePath("WORKER.md"), true);
  assert.equal(isTrackablePath("CLAUDE.md"), true);
  assert.equal(isTrackablePath(".codex/agents/repo-mapper.toml"), true);
  assert.equal(isTrackablePath("docs/workspace/repo-hygiene.mjs"), true);
  assert.equal(isTrackablePath("ops/projects/PROJECT_TEMPLATE.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/README.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/DEPLOYMENT_LEDGER.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/ARCHITECTURE_TODO.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/manifests/test.json"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/reports/audit.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/runbooks/restart.md"), true);
  assert.equal(isTrackablePath("projects/README.md"), false);
  assert.equal(isTrackablePath("projects/products/sample-product/file.txt"), false);
  assert.equal(isTrackablePath("scratch/README.md"), false);
  assert.equal(isTrackablePath("ops/projects/sample-product/rollback/README.md"), false);
  assert.equal(isTrackablePath("ops/projects/sample-product/evidence/run.json"), false);
  assert.equal(isTrackablePath("state/tmp.json"), false);
});

test("root hygiene summarizes checkpoint scope from allowed workspace paths", () => {
  assert.equal(summarizeCheckpointScope({
    modifiedTracked: [".gitignore", "AGENTS.md"],
    untrackedSource: ["docs/workspace/repo-hygiene.mjs"],
    otherTracked: [],
  }), "workspace, hygiene");
  assert.match(buildCheckpointCommitMessage({
    turnId: "root-scope",
  }, {
    modifiedTracked: [".gitignore", "AGENTS.md"],
    untrackedSource: ["docs/workspace/repo-hygiene.mjs"],
    otherTracked: [],
  }), /root-scope; workspace, hygiene/u);
});

test("root hygiene can checkpoint allowed tracked changes into a clean commit", async () => {
  const repoRoot = await createFixture();
  await fs.writeFile(path.join(repoRoot, "docs", "workspace", "daily-workflow.md"), "workflow\n", "utf8");
  await fs.writeFile(path.join(repoRoot, "AGENTS.md"), "agents updated\n", "utf8");

  const summary = await buildRepoHygieneSummary({
    repo: repoRoot,
    checkpointCommit: true,
    turnId: "root-turn",
  });

  assert.equal(summary.git_clean, true);
  assert.equal(summary.checkpoint_commit?.ok, true);
  assert.match(summary.checkpoint_commit?.message || "", /root-turn/u);
  assert.match(summary.checkpoint_commit?.message || "", /workspace/u);
});

test("root hygiene blocks checkpoint when non-trackable paths are present", async () => {
  const repoRoot = await createFixture();
  await fs.mkdir(path.join(repoRoot, "tmp"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "tmp", "notes.txt"), "temp\n", "utf8");

  const summary = await buildRepoHygieneSummary({
    repo: repoRoot,
    checkpointCommit: true,
    turnId: "root-turn-blocked",
  });

  assert.equal(summary.git_clean, false);
  assert.equal(summary.checkpoint_commit?.ok, false);
  assert.equal(summary.checkpoint_commit?.skipped, "non_trackable_paths_present");
  assert.deepEqual(summary.checkpoint_commit?.blocked_paths, ["tmp/notes.txt"]);
});

test("root hygiene expands rename paths before trackability checks", () => {
  assert.deepEqual(expandStatusPath("docs/reports/a.md -> projects/products/sample-product/a.md"), [
    "docs/reports/a.md",
    "projects/products/sample-product/a.md",
  ]);

  const summary = classifyStatusEntries([
    {
      raw: "R  docs/reports/a.md -> projects/products/sample-product/a.md",
      code: "R ",
      path: "docs/reports/a.md -> projects/products/sample-product/a.md",
    },
  ]);

  assert.deepEqual(summary.modifiedTracked, [
    "docs/reports/a.md",
    "projects/products/sample-product/a.md",
  ]);
  assert.equal(summary.modifiedTracked.every(isTrackablePath), false);
});
