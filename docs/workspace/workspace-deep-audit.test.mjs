import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildWorkspaceDeepAudit,
  parseArgs,
  renderDeepAudit,
  uniqueCandidateBytes,
} from "./workspace-deep-audit.mjs";

async function writeFileWithParents(filePath, content = "fixture\n") {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function createFixture() {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-deep-audit-"));
  await fs.mkdir(path.join(repo, ".codex"), { recursive: true });
  await fs.mkdir(path.join(repo, "docs", "workspace"), { recursive: true });
  await fs.writeFile(path.join(repo, "AGENTS.md"), "workspace policy\n", "utf8");
  await fs.writeFile(path.join(repo, ".codex", "config.toml"), "model = \"gpt-5.6-sol\"\n", "utf8");

  await writeFileWithParents(path.join(repo, "projects", "products", "sample", "build", "app.bin"));
  await writeFileWithParents(path.join(repo, "scratch", "source-snapshot", ".build", "artifact.bin"));
  await writeFileWithParents(path.join(repo, "scratch", "source-snapshot-clean", "src", "main.swift"));
  await writeFileWithParents(path.join(repo, "state", "rollback", "source-snapshot", "build", "keep.bin"));
  await writeFileWithParents(path.join(repo, "state", "rollback-before-cleanup", "build", "keep.bin"));
  await writeFileWithParents(path.join(repo, ".worktrees", "review", "build", "keep.bin"));

  const staleIncomplete = path.join(repo, "state", "downloads", "model.bin.incomplete");
  const freshIncomplete = path.join(repo, "state", "downloads", "fresh.bin.incomplete");
  await writeFileWithParents(staleIncomplete, "stale download\n");
  await writeFileWithParents(freshIncomplete, "fresh download\n");
  await fs.utimes(staleIncomplete, new Date("2026-08-01T00:00:00Z"), new Date("2026-08-01T00:00:00Z"));
  await fs.utimes(freshIncomplete, new Date("2026-08-19T00:00:00Z"), new Date("2026-08-19T00:00:00Z"));

  const completedRun = path.join(repo, "scratch", "projects", "sample", "codex-runs", "20260801-completed");
  await writeFileWithParents(path.join(completedRun, "08-continuation.json"), JSON.stringify({
    run_status: "completed",
    phase: "finalized_completed",
    next_action: "none",
  }));
  await writeFileWithParents(path.join(completedRun, "artifacts", "DerivedData", "app.bin"));

  const activeRun = path.join(repo, "scratch", "projects", "sample", "codex-runs", "20260802-active");
  await writeFileWithParents(path.join(activeRun, "08-continuation.json"), JSON.stringify({
    run_status: "active",
    phase: "implementing",
    next_action: "continue implementation",
  }));
  await writeFileWithParents(path.join(activeRun, "artifacts", "DerivedData", "keep.bin"));
  await writeFileWithParents(
    path.join(repo, "state", "project-data", "sample", "codex-long-tasks", "index.json"),
    JSON.stringify({
      schema: "codex-long-task-index/v1",
      project: "sample",
      runs: [
        {
          run_id: "20260801-completed",
          run_root: completedRun,
          status: "completed",
          phase: "finalized_completed",
        },
        {
          run_id: "20260802-active",
          run_root: activeRun,
          status: "active",
          phase: "implementing",
        },
      ],
    }),
  );
  return repo;
}

test("parseArgs keeps the deep audit read-only and accepts report controls", () => {
  assert.deepEqual(parseArgs([]), {
    repo: "",
    json: false,
    limit: 25,
    staleDays: 7,
  });
  assert.deepEqual(parseArgs(["--repo", "/tmp/workspace", "--json", "--limit", "3", "--stale-days", "14"]), {
    repo: "/tmp/workspace",
    json: true,
    limit: 3,
    staleDays: 14,
  });
});

test("buildWorkspaceDeepAudit reports actual usage and review buckets without mutating", async () => {
  const repo = await createFixture();
  const before = await fs.readdir(path.join(repo, "state", "downloads"));
  const report = await buildWorkspaceDeepAudit({
    repo,
    now: new Date("2026-08-20T00:00:00Z"),
    staleDays: 7,
    limit: 20,
  });
  const after = await fs.readdir(path.join(repo, "state", "downloads"));

  assert.equal(report.read_only, true);
  assert.ok(report.root_usage.bytes > 0);
  assert.ok(report.root_usage.logical_bytes > 0);
  assert.deepEqual(after, before);
  assert.deepEqual(report.categories.stale_incomplete_downloads.items.map((entry) => entry.path), [
    "state/downloads/model.bin.incomplete",
  ]);
  assert.equal(report.categories.source_snapshots_with_generated_content.count, 1);
  assert.equal(report.categories.source_snapshots_with_generated_content.items[0].path, "scratch/source-snapshot");
  assert.deepEqual(report.categories.completed_run_artifacts.items.map((entry) => entry.path), [
    "scratch/projects/sample/codex-runs/20260801-completed",
  ]);
  assert.ok(report.categories.generated_caches.items.some((entry) => entry.path === "projects/products/sample/build"));
  assert.ok(report.categories.generated_caches.items.some((entry) => entry.path === "scratch/source-snapshot/.build"));
  assert.ok(!report.categories.generated_caches.items.some((entry) => entry.path.includes("20260802-active")));
  assert.ok(!report.categories.generated_caches.items.some((entry) => entry.path.startsWith("state/rollback/")));
  assert.ok(!report.categories.generated_caches.items.some((entry) => entry.path.startsWith("state/rollback-before-cleanup/")));
  assert.ok(!report.categories.generated_caches.items.some((entry) => entry.path.startsWith(".worktrees/")));
  assert.ok(report.estimated_reclaimable_bytes > 0);
  assert.ok(report.estimated_reclaimable_paths.includes("scratch/projects/sample/codex-runs/20260801-completed"));
  assert.ok(!report.estimated_reclaimable_paths.some((entry) => entry.includes("20260801-completed/artifacts")));
  assert.equal(report.cleanup_buckets.delete[0].bucket, "delete");
  assert.equal(report.cleanup_buckets.archive[0].bucket, "archive");
  assert.equal(report.scan_errors.length, 0);
});

test("uniqueCandidateBytes avoids counting nested candidates twice", () => {
  const result = uniqueCandidateBytes([
    { path: "scratch/run", bytes: 100 },
    { path: "scratch/run/build", bytes: 60 },
    { path: "state/download.incomplete", bytes: 20 },
  ]);
  assert.equal(result.bytes, 120);
  assert.deepEqual(result.paths, ["scratch/run", "state/download.incomplete"]);
});

test("renderDeepAudit exposes the read-only boundary and required categories", () => {
  const rendered = renderDeepAudit({
    repo_root: "/workspace",
    read_only: true,
    root_usage: { pretty: "68G", logical_pretty: "70G" },
    estimated_reclaimable_pretty: "3.8G",
    estimate_note: "review candidates only",
    top_level_paths: [{ path: "scratch", pretty: "29G", bucket: "ask", reason: "temporary workspace output" }],
    categories: {
      stale_incomplete_downloads: { pretty: "3.0G", count: 3, items: [] },
      generated_caches: { pretty: "20G", count: 4, items: [] },
      source_snapshots_with_generated_content: { pretty: "10G", count: 2, items: [] },
      completed_run_artifacts: { pretty: "4.1G", count: 2, items: [] },
    },
    scan_errors: [],
  });
  assert.match(rendered, /read_only: yes/u);
  assert.match(rendered, /root_actual_usage: 68G/u);
  assert.match(rendered, /estimated_reclaimable: 3.8G/u);
  assert.match(rendered, /stale_incomplete_downloads: 3.0G, 3 items/u);
  assert.match(rendered, /source_snapshots_with_generated_content: 10G, 2 items/u);
});
