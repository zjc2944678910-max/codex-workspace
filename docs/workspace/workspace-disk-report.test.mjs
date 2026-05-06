import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildWorkspaceDiskReport,
  classifyCleanupBucket,
  collectObviousGarbage,
  formatBytes,
  renderReport,
} from "./workspace-disk-report.mjs";

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workspace-disk-"));
  await fs.mkdir(path.join(root, ".codex"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(root, "projects", "products", "app"), { recursive: true });
  await fs.mkdir(path.join(root, "scratch", "shared", "run"), { recursive: true });
  await fs.mkdir(path.join(root, "ops", "projects", "sample-product", "rollback", "backup"), { recursive: true });
  await fs.mkdir(path.join(root, ".git"), { recursive: true });
  await fs.writeFile(path.join(root, "AGENTS.md"), "workspace policy\n", "utf8");
  await fs.writeFile(path.join(root, ".codex", "config.toml"), "model = \"gpt-5.4\"\n", "utf8");
  await fs.writeFile(path.join(root, "projects", "products", "app", "source.txt"), "source\n", "utf8");
  await fs.writeFile(path.join(root, "scratch", "shared", "run", "artifact.bin"), "artifact\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "sample-product", "rollback", "backup", "state.json"), "{}\n", "utf8");
  await fs.writeFile(path.join(root, ".DS_Store"), "trash\n", "utf8");
  await fs.writeFile(path.join(root, ".git", ".DS_Store"), "ignored internal trash\n", "utf8");
  return root;
}

test("workspace disk report classifies known workspace buckets conservatively", () => {
  assert.deepEqual(classifyCleanupBucket("projects/products/app"), {
    bucket: "keep",
    reason: "project source or reference tree",
  });
  assert.deepEqual(classifyCleanupBucket("ops/projects/sample-product/rollback/backup"), {
    bucket: "keep",
    reason: "live rollback backup",
  });
  assert.deepEqual(classifyCleanupBucket("ops/projects/sample-product/evidence/run-1"), {
    bucket: "archive",
    reason: "operator evidence or quarantine",
  });
  assert.deepEqual(classifyCleanupBucket("scratch/shared/run"), {
    bucket: "ask",
    reason: "temporary workspace output",
  });
});

test("workspace disk report finds large paths and obvious garbage without scanning .git garbage", async () => {
  const repoRoot = await createFixture();
  const garbage = await collectObviousGarbage(repoRoot);
  assert.equal(garbage.count, 1);
  assert.deepEqual(garbage.samples, [".DS_Store"]);

  const report = await buildWorkspaceDiskReport({ repo: repoRoot, limit: 10 });
  assert.equal(report.repo_root, repoRoot);
  assert.equal(report.cleanup_buckets.delete.length, 1);
  assert.equal(report.cleanup_buckets.delete[0].count, 1);
  assert.ok(report.largest_paths.some((entry) => entry.path === "scratch/shared/run" && entry.bucket === "ask"));
  assert.ok(report.cleanup_buckets.keep.some((entry) => entry.path === "projects/products/app"));
  assert.match(renderReport(report), /cleanup_buckets/u);
});

test("workspace disk report formats compact byte values", () => {
  assert.equal(formatBytes(0), "0B");
  assert.equal(formatBytes(512), "512B");
  assert.equal(formatBytes(1536), "1.5K");
  assert.equal(formatBytes(1024 * 1024), "1.0M");
});
