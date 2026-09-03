import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applyRetentionPlan,
  buildRetentionPlan,
  discoverRunRoots,
  findCodexRunsEntry,
  parseArgs,
} from "./codex-run-retention.mjs";

async function writeRunState(runRoot, name, overrides = {}) {
  await fs.writeFile(
    path.join(runRoot, name, "08-continuation.json"),
    JSON.stringify({
      run_status: "completed",
      phase: "finalized_completed",
      next_action: "none",
      ...overrides,
    }),
    "utf8",
  );
}

async function entryExists(targetPath) {
  try {
    await fs.lstat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function allPlannedSourcesExist(plan) {
  return (await Promise.all(plan.archive.map((name) => entryExists(path.join(plan.run_root, name)))))
    .every(Boolean);
}

async function createFixture(options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workspace-codex-runs-"));
  const relativeRunRoot = options.relativeRunRoot || path.join("scratch", "shared", "codex-runs");
  const runRoot = path.join(root, relativeRunRoot);
  await fs.mkdir(path.join(root, ".codex"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(runRoot, { recursive: true });
  await fs.writeFile(path.join(root, "AGENTS.md"), "workspace\n", "utf8");
  await fs.writeFile(path.join(root, ".codex", "config.toml"), "model = \"gpt-5.4\"\n", "utf8");
  await fs.writeFile(
    path.join(root, "docs", "workspace", "scratch-retention.json"),
    JSON.stringify({
      entries: [
        {
          path: relativeRunRoot.replace(/\\/gu, "/"),
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
    await fs.mkdir(path.join(runRoot, name), { recursive: true });
    await fs.writeFile(path.join(runRoot, name, "notes.txt"), `${name}\n`, "utf8");
    await writeRunState(runRoot, name);
  }
  const indexPath = path.join(root, "state", "project-data", "fixture", "codex-long-tasks", "index.json");
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, JSON.stringify({
    schema: "codex-long-task-index/v1",
    project: "fixture",
    runs: [
      "20260430-0001-explicit",
      "20260430-0002-old",
      "20260430-0003-old",
      "20260430-0004-old",
      "20260501-0005-new",
      "20260502-0006-new",
    ].map((name) => ({
      run_id: name,
      run_root: path.join(runRoot, name),
      status: "completed",
      phase: "finalized_completed",
    })),
  }), "utf8");
  return root;
}

test("parseArgs is dry-run by default and requires explicit apply", () => {
  assert.deepEqual(parseArgs([]), {
    repo: "",
    dryRun: true,
    apply: false,
    json: false,
    keepLatest: undefined,
    archiveRoot: "",
    runRoot: "",
    project: "",
  });
  const apply = parseArgs(["--project", "sample", "--apply"]);
  assert.equal(apply.project, "sample");
  assert.equal(apply.apply, true);
  assert.equal(apply.dryRun, false);
});

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

test("buildRetentionPlan supports a project codex-runs root", async () => {
  const repoRoot = await createFixture({
    relativeRunRoot: path.join("scratch", "projects", "sample", "codex-runs"),
  });
  const plan = await buildRetentionPlan({ repo: repoRoot, project: "sample", keepLatest: 1 });
  assert.equal(plan.project, "sample");
  assert.equal(plan.run_root_relative, "scratch/projects/sample/codex-runs");
  assert.deepEqual(plan.archive, [
    "20260430-0002-old",
    "20260430-0003-old",
    "20260430-0004-old",
    "20260501-0005-new",
  ]);
});

test("buildRetentionPlan supports an explicit in-workspace run root", async () => {
  const relativeRunRoot = path.join("scratch", "custom", "codex-runs");
  const repoRoot = await createFixture({ relativeRunRoot });
  const plan = await buildRetentionPlan({ repo: repoRoot, runRoot: relativeRunRoot, keepLatest: 0 });
  assert.equal(plan.run_root_relative, "scratch/custom/codex-runs");
  assert.equal(plan.archive.length, 5);
  assert.deepEqual(plan.keep, ["20260430-0001-explicit"]);
});

test("buildRetentionPlan never archives active, blocked, awaiting-user, or unknown runs", async () => {
  const repoRoot = await createFixture();
  const runRoot = path.join(repoRoot, "scratch", "shared", "codex-runs");
  await writeRunState(runRoot, "20260430-0002-old", { run_status: "active", phase: "implementing" });
  await writeRunState(runRoot, "20260430-0003-old", { run_status: "blocked", phase: "blocked" });
  await writeRunState(runRoot, "20260430-0004-old", {
    run_status: "completed",
    phase: "awaiting_user_acceptance",
  });
  await fs.rm(path.join(runRoot, "20260501-0005-new", "08-continuation.json"));

  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 0 });
  assert.deepEqual(plan.archive, ["20260502-0006-new"]);
  assert.deepEqual(plan.keep_protected, [
    "20260430-0002-old",
    "20260430-0003-old",
    "20260430-0004-old",
    "20260501-0005-new",
  ]);
  assert.ok(plan.runs.find((entry) => entry.name === "20260430-0002-old")
    .protection_reasons.some((reason) => reason.startsWith("index_state_conflict:")));
});

test("buildRetentionPlan protects a terminal continuation when the project index remains actionable", async () => {
  const repoRoot = await createFixture();
  const indexPath = path.join(repoRoot, "state", "project-data", "fixture", "codex-long-tasks", "index.json");
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  index.runs.find((entry) => entry.run_id === "20260430-0002-old").status = "active";
  await fs.writeFile(indexPath, JSON.stringify(index), "utf8");

  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 0 });
  assert.ok(!plan.archive.includes("20260430-0002-old"));
  const run = plan.runs.find((entry) => entry.name === "20260430-0002-old");
  assert.equal(run.protected, true);
  assert.ok(run.protection_reasons.includes("index_status:active"));
  assert.ok(run.protection_reasons.includes("index_state_conflict:active:completed"));
});

test("buildRetentionPlan protects a terminal run while the project index phase awaits the user", async () => {
  const repoRoot = await createFixture();
  const indexPath = path.join(repoRoot, "state", "project-data", "fixture", "codex-long-tasks", "index.json");
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  index.runs.find((entry) => entry.run_id === "20260430-0003-old").phase = "awaiting_user_acceptance";
  await fs.writeFile(indexPath, JSON.stringify(index), "utf8");

  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 0 });
  assert.ok(!plan.archive.includes("20260430-0003-old"));
  const run = plan.runs.find((entry) => entry.name === "20260430-0003-old");
  assert.ok(run.protection_reasons.includes("index_phase:awaiting_user_acceptance"));
});

test("buildRetentionPlan fails closed when indexes duplicate a run root", async () => {
  const repoRoot = await createFixture();
  const indexPath = path.join(repoRoot, "state", "project-data", "fixture", "codex-long-tasks", "index.json");
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const duplicated = index.runs.find((entry) => entry.run_id === "20260430-0002-old");
  index.runs.push({ ...duplicated });
  await fs.writeFile(indexPath, JSON.stringify(index), "utf8");

  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 0 });
  assert.ok(!plan.archive.includes("20260430-0002-old"));
  assert.ok(plan.index_errors.some((entry) => /duplicate long-task index run_root/u.test(entry.error)));
  assert.ok(plan.runs.find((entry) => entry.name === "20260430-0002-old")
    .protection_reasons.includes("duplicate_index_record"));
});

test("applyRetentionPlan dry run leaves directories in place", async () => {
  const repoRoot = await createFixture();
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1 });
  const applied = await applyRetentionPlan(plan, {});
  assert.equal(applied.dry_run, true);
  const entries = await fs.readdir(path.join(repoRoot, "scratch", "shared", "codex-runs"));
  assert.equal(entries.length, 6);
});

test("applyRetentionPlan moves archived runs into cleanup archive", async () => {
  const repoRoot = await createFixture();
  const archiveRoot = path.join(repoRoot, "archive", "cleanup", "rotation", "scratch", "shared", "codex-runs");
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1, archiveRoot });
  const applied = await applyRetentionPlan(plan, { apply: true });
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

test("applyRetentionPlan does not move runs when dryRun false is passed without apply", async () => {
  const repoRoot = await createFixture();
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1 });
  const applied = await applyRetentionPlan(plan, { dryRun: false });
  assert.equal(applied.dry_run, true);
  assert.deepEqual(applied.archived, []);
  assert.equal((await fs.readdir(plan.run_root)).length, 6);
});

test("applyRetentionPlan rechecks continuation, index, and explicit keep before moving any run", async () => {
  const repoRoot = await createFixture();
  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1 });
  const newlyActive = plan.archive.at(-1);
  await writeRunState(plan.run_root, newlyActive, { run_status: "active", phase: "implementing" });

  await assert.rejects(
    applyRetentionPlan(plan, { apply: true }),
    /retention plan is stale/u,
  );
  assert.ok(await allPlannedSourcesExist(plan));

  await writeRunState(plan.run_root, newlyActive);
  const indexPath = path.join(repoRoot, "state", "project-data", "fixture", "codex-long-tasks", "index.json");
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  index.runs.find((entry) => entry.run_id === newlyActive).status = "blocked";
  await fs.writeFile(indexPath, JSON.stringify(index), "utf8");
  await assert.rejects(
    applyRetentionPlan(plan, { apply: true }),
    /retention plan is stale/u,
  );
  assert.ok(await allPlannedSourcesExist(plan));

  index.runs.find((entry) => entry.run_id === newlyActive).status = "completed";
  await fs.writeFile(indexPath, JSON.stringify(index), "utf8");
  const retentionPath = path.join(repoRoot, "docs", "workspace", "scratch-retention.json");
  const retention = JSON.parse(await fs.readFile(retentionPath, "utf8"));
  retention.entries[0].keep.push(newlyActive);
  await fs.writeFile(retentionPath, JSON.stringify(retention), "utf8");
  await assert.rejects(
    applyRetentionPlan(plan, { apply: true }),
    /retention plan is stale/u,
  );
  assert.ok(await allPlannedSourcesExist(plan));
});

test("applyRetentionPlan recomputes manifest keep_latest and preflights every destination", async () => {
  const repoRoot = await createFixture();
  const retentionPath = path.join(repoRoot, "docs", "workspace", "scratch-retention.json");
  const retention = JSON.parse(await fs.readFile(retentionPath, "utf8"));
  retention.entries[0].keep_latest = 1;
  await fs.writeFile(retentionPath, JSON.stringify(retention), "utf8");
  const plan = await buildRetentionPlan({ repo: repoRoot });
  assert.equal(plan.keep_latest_override, null);

  retention.entries[0].keep_latest = 6;
  await fs.writeFile(retentionPath, JSON.stringify(retention), "utf8");
  await assert.rejects(applyRetentionPlan(plan, { apply: true }), /retention plan is stale/u);
  assert.ok(await allPlannedSourcesExist(plan));

  retention.entries[0].keep_latest = 1;
  await fs.writeFile(retentionPath, JSON.stringify(retention), "utf8");
  const blockedDestination = path.join(plan.archive_root, plan.archive.at(-1));
  await fs.mkdir(blockedDestination, { recursive: true });
  await assert.rejects(applyRetentionPlan(plan, { apply: true }), /archive destination already exists/u);
  assert.ok(await allPlannedSourcesExist(plan));
});

test("retention rejects symlink escapes, external archives, and unsafe plan names", async () => {
  const repoRoot = await createFixture();
  const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-runs-external-"));
  const symlinkRoot = path.join(repoRoot, "scratch", "custom", "codex-runs");
  await fs.mkdir(path.dirname(symlinkRoot), { recursive: true });
  await fs.symlink(externalRoot, symlinkRoot);
  await assert.rejects(
    buildRetentionPlan({ repo: repoRoot, runRoot: "scratch/custom/codex-runs" }),
    /resolves outside the workspace/u,
  );

  const plan = await buildRetentionPlan({ repo: repoRoot, keepLatest: 1 });
  await assert.rejects(
    applyRetentionPlan({ ...plan, archive_root: path.join(externalRoot, "archive") }, { apply: true }),
    /archive root must stay inside the workspace archive directory/u,
  );
  await assert.rejects(
    applyRetentionPlan({ ...plan, archive: ["../escape"] }, { apply: true }),
    /invalid run directory name/u,
  );

  const redirectedRepo = await createFixture();
  const redirectedPlan = await buildRetentionPlan({ repo: redirectedRepo, keepLatest: 1 });
  const redirectedTarget = path.join(redirectedRepo, "scratch", "redirected-archive");
  await fs.mkdir(redirectedTarget, { recursive: true });
  await fs.symlink(redirectedTarget, path.join(redirectedRepo, "archive"));
  await assert.rejects(
    applyRetentionPlan(redirectedPlan, { apply: true }),
    /archive directory must not be a symbolic-link redirect/u,
  );
});

test("discoverRunRoots skips codex-runs symlinks that resolve outside the workspace", async () => {
  const repoRoot = await createFixture();
  const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), "external-discovered-codex-runs-"));
  const projectRoot = path.join(repoRoot, "scratch", "projects", "escaped");
  await fs.mkdir(projectRoot, { recursive: true });
  await fs.symlink(externalRoot, path.join(projectRoot, "codex-runs"));
  const errors = [];

  const roots = await discoverRunRoots(repoRoot, { errors });
  assert.ok(!roots.includes(path.join(projectRoot, "codex-runs")));
  assert.ok(errors.some((entry) => entry.path === path.join(projectRoot, "codex-runs")));
});
