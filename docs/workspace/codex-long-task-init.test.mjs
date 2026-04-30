import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildRunRoot, createLongTaskRun, slugify } from "./codex-long-task-init.mjs";

test("slugify creates stable ascii fallbacks", () => {
  assert.equal(slugify("Fix Login Flow!"), "fix-login-flow");
  assert.equal(slugify("多智能体长任务"), "long-task");
  assert.equal(slugify("  OpenClaw_vNext  "), "openclaw-vnext");
});

test("buildRunRoot uses project scratch by default", () => {
  const run = buildRunRoot({
    workspaceRoot: "/workspace",
    project: "OpenClaw",
    task: "Fix Login Flow",
    timestamp: "20260429-2315",
  });
  assert.equal(run.relativeRunRoot, path.join("scratch", "projects", "openclaw", "codex-runs", "20260429-2315-fix-login-flow"));
});

test("buildRunRoot can use shared scratch", () => {
  const run = buildRunRoot({
    workspaceRoot: "/workspace",
    project: "ignored",
    task: "Research Notes",
    timestamp: "20260429-2315",
    shared: true,
  });
  assert.equal(run.relativeRunRoot, path.join("scratch", "shared", "codex-runs", "20260429-2315-research-notes"));
});

test("createLongTaskRun writes the expected file protocol", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-"));
  const result = await createLongTaskRun({
    workspaceRoot,
    project: "openclaw",
    projectRoot: path.join(workspaceRoot, "projects", "products", "openclaw"),
    task: "Implement remembered preference sync",
    slug: "preference-sync",
    timestamp: "20260429-2315",
  });

  assert.equal(result.ok, true);
  assert.equal(result.files.includes("00-request.md"), true);
  assert.equal(result.files.includes("07-agent-registry.md"), true);
  assert.equal(result.files.includes(path.join("agents", "T01", "mapper-brief.md")), true);
  assert.equal(result.files.includes(path.join("agents", "T02", "review-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "dev-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "verify-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "repair-brief.md")), true);
  assert.equal(result.files.includes(path.join("agents", ".gitkeep")), true);

  const request = await fs.readFile(path.join(result.run_root, "00-request.md"), "utf8");
  const ledger = await fs.readFile(path.join(result.run_root, "03-task-ledger.md"), "utf8");
  const mapperBrief = await fs.readFile(path.join(result.run_root, "agents", "T01", "mapper-brief.md"), "utf8");
  const reviewBrief = await fs.readFile(path.join(result.run_root, "agents", "T02", "review-brief.md"), "utf8");
  const devTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "dev-brief.md"), "utf8");
  const verifyTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "verify-brief.md"), "utf8");
  const repairTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "repair-brief.md"), "utf8");
  assert.match(request, /Implement remembered preference sync/u);
  assert.match(ledger, /repo_mapper/u);
  assert.match(ledger, /review_guard/u);
  assert.match(mapperBrief, new RegExp(`${result.run_root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}/00-request\\.md`, "u"));
  assert.match(mapperBrief, /status: mapped \| blocked/u);
  assert.match(reviewBrief, new RegExp(`${result.run_root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}/agents/T01/mapper-result\\.md`, "u"));
  assert.match(reviewBrief, /status: pass \| changes_requested \| blocked/u);
  assert.match(devTemplate, /status: implemented \| blocked/u);
  assert.match(verifyTemplate, /status: pass \| fail \| blocked/u);
  assert.match(repairTemplate, /Failing Evidence/u);
});

test("createLongTaskRun dry run does not write files", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-dry-"));
  const result = await createLongTaskRun({
    workspaceRoot,
    project: "demo",
    task: "Dry run",
    timestamp: "20260429-2315",
    dryRun: true,
  });
  assert.equal(result.dry_run, true);
  await assert.rejects(fs.access(result.run_root));
});
