import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildWorkspaceDiskReport,
  classifyCleanupBucket,
  collectObviousGarbage,
  findRetentionGaps,
  formatBytes,
  loadScratchRetention,
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

test("workspace disk report loads scratch retention manifest from fixture", async () => {
  const repoRoot = await createFixture();
  const manifest = {
    entries: [{ path: "scratch/shared/run", retention_days: 30 }],
  };
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "scratch-retention.json"),
    JSON.stringify(manifest),
    "utf8",
  );
  const loaded = await loadScratchRetention(repoRoot);
  assert.equal(loaded.entries[0].path, "scratch/shared/run");
});

test("workspace disk report returns null when no retention manifest exists", async () => {
  const repoRoot = await createFixture();
  const loaded = await loadScratchRetention(repoRoot);
  assert.equal(loaded, null);
});

test("findRetentionGaps flags large scratch paths without retention entries", () => {
  const entries = [
    { path: "scratch/projects/openclaw", bytes: 200 * 1024 * 1024, pretty: "200M", bucket: "ask" },
    { path: "scratch/shared/run", bytes: 50 * 1024 * 1024, pretty: "50M", bucket: "ask" },
    { path: "projects/products/app", bytes: 500 * 1024 * 1024, pretty: "500M", bucket: "keep" },
  ];
  const manifest = {
    entries: [{ path: "scratch/shared/run", retention_days: 30 }],
  };
  const gaps = findRetentionGaps(entries, manifest, 100 * 1024 * 1024);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].path, "scratch/projects/openclaw");
});

test("findRetentionGaps returns empty when all scratch paths have entries", () => {
  const entries = [
    { path: "scratch/projects/openclaw", bytes: 200 * 1024 * 1024, pretty: "200M", bucket: "ask" },
  ];
  const manifest = {
    entries: [{ path: "scratch/projects/openclaw", retention_days: 90 }],
  };
  const gaps = findRetentionGaps(entries, manifest, 100 * 1024 * 1024);
  assert.equal(gaps.length, 0);
});

test("findRetentionGaps does not let scratch container entries cover child workspaces", () => {
  const entries = [
    { path: "scratch/projects", bytes: 900 * 1024 * 1024, pretty: "900M", bucket: "ask" },
    { path: "scratch/projects/prototype", bytes: 300 * 1024 * 1024, pretty: "300M", bucket: "ask" },
  ];
  const manifest = {
    entries: [{ path: "scratch/projects", retention_days: 30 }],
  };
  const gaps = findRetentionGaps(entries, manifest, 100 * 1024 * 1024);
  assert.deepEqual(gaps.map((gap) => gap.path), ["scratch/projects/prototype"]);
});

test("findRetentionGaps respects overridden threshold in tests", () => {
  const entries = [
    { path: "scratch/projects/tiny", bytes: 500, pretty: "500B", bucket: "ask" },
  ];
  const manifest = { entries: [] };
  // With 0 threshold, even tiny paths are flagged
  const gaps = findRetentionGaps(entries, manifest, 0);
  assert.equal(gaps.length, 1);
  // With high threshold, nothing is flagged
  const gaps2 = findRetentionGaps(entries, manifest, 1000);
  assert.equal(gaps2.length, 0);
});

test("workspace disk report includes retention gaps in JSON output", async () => {
  const repoRoot = await createFixture();
  // Make scratch/shared/run large enough by adding more files
  await fs.writeFile(path.join(repoRoot, "scratch", "shared", "run", "big.bin"), "x".repeat(200), "utf8");
  const manifest = { entries: [] };
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "scratch-retention.json"),
    JSON.stringify(manifest),
    "utf8",
  );
  const report = await buildWorkspaceDiskReport({
    repo: repoRoot,
    limit: 10,
    retentionGapThreshold: 0,
  });
  assert.ok("retention_gaps" in report);
  assert.ok("retention_gap_threshold_bytes" in report);
  assert.ok("retention_manifest_loaded" in report);
  assert.equal(report.retention_manifest_loaded, true);
  assert.ok(report.retention_gaps.length > 0);
  assert.match(renderReport(report), /retention_gaps:/u);
});
