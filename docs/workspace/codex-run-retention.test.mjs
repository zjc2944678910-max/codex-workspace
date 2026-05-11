import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applyRetentionPlan,
  buildRetentionPlan,
  findCodexRunsEntry,
} from "./codex-run-retention.mjs";

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workspace-codex-runs-"));
  await fs.mkdir(path.join(root, ".codex"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(root, "scratch", "shared", "codex-runs"), { recursive: true });
  await fs.writeFile(path.join(root, "AGENTS.md"), "workspace\n", "utf8");
  await fs.writeFile(path.join(root, ".codex", "config.toml"), "model = \"gpt-5.4\"\n", "utf8");
  await fs.writeFile(
    path.join(root, "docs", "workspace", "scratch-retention.json"),
    JSON.stringify({
      entries: [
        {
          path: "scratch/shared/codex-runs",
          keep: ["20260430-0001-explicit"],
        },
      ],
    }),
    "utf8",
  );
  for (const name of [
    "20260430-0001-explicit",
    "20260430-0002-old",
    "20260430-0003-old",
    "20260430-0004-old",
    "20260501-0005-new",
    "20260502-0006-new",
  ]) {
    await fs.mkdir(path.join(root, "scratch", "shared", "codex-runs", name), { recursive: true });
    await fs.writeFile(path.join(root, "scratch", "shared", "codex-runs", name, "notes.txt"), `${name}\n`, "utf8");
  }
  return root;
}

test("findCodexRunsEntry returns the codex-runs retention entry", () => {
  const entry = findCodexRunsEntry({
    entries: [
      { path: "scratch/shared/codex-runs", keep: ["a"] },
      { path: "scratch/projects/openclaw" },
    ],
  });
  assert.equal(entry?.path, "scratch/shared/codex-runs");
});

test("buildRetentionPlan keeps latest directories plus explicit keeps", async () => {
  const repoRoot = await createFixture();
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 2 });
  assert.deepEqual(plan.keep_explicit, ["20260430-0001-explicit"]);
  assert.deepEqual(plan.keep, [
    "20260430-0001-explicit",
    "20260501-0005-new",
    "20260502-0006-new",
  ]);
  assert.deepEqual(plan.archive, [
    "20260430-0002-old",
    "20260430-0003-old",
    "20260430-0004-old",
  ]);
});

test("buildRetentionPlan falls back to manifest keep_latest", async () => {
  const repoRoot = await createFixture();
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "scratch-retention.json"),
    JSON.stringify({
      entries: [
        {
          path: "scratch/shared/codex-runs",
          keep_latest: 1,
          keep: ["20260430-0001-explicit"],
        },
      ],
    }),
    "utf8",
  );
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: undefined });
  assert.equal(plan.keep_latest, 1);
  assert.deepEqual(plan.keep, [
    "20260430-0001-explicit",
    "20260502-0006-new",
  ]);
});

test("applyRetentionPlan dry run leaves directories in place", async () => {
  const repoRoot = await createFixture();
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1 });
  const applied = await applyRetentionPlan(plan, { dryRun: true });
  assert.equal(applied.dry_run, true);
  const entries = await fs.readdir(path.join(repoRoot, "scratch", "shared", "codex-runs"));
  assert.equal(entries.length, 6);
});

test("applyRetentionPlan moves archived runs into cleanup archive", async () => {
  const repoRoot = await createFixture();
  const archiveRoot = path.join(repoRoot, "archive", "cleanup", "rotation", "scratch", "shared", "codex-runs");
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1, archiveRoot });
  const applied = await applyRetentionPlan(plan, { dryRun: false });
  assert.deepEqual(applied.archived, [
    "20260430-0002-old",
    "20260430-0003-old",
    "20260430-0004-old",
    "20260501-0005-new",
  ]);
  const remaining = (await fs.readdir(path.join(repoRoot, "scratch", "shared", "codex-runs"))).sort();
  assert.deepEqual(remaining, [
    "20260430-0001-explicit",
    "20260502-0006-new",
  ]);
  const archived = (await fs.readdir(archiveRoot)).sort();
  assert.deepEqual(archived, applied.archived);
});
