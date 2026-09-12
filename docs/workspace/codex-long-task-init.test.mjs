import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildRouteLock, buildRunRoot, createLongTaskRun, renderRouteLock, slugify } from "./codex-long-task-init.mjs";

test("slugify creates stable ascii fallbacks", () => {
  assert.equal(slugify("Fix Login Flow!"), "fix-login-flow");
  assert.equal(slugify("多智能体长任务"), "long-task");
  assert.equal(slugify("  SampleProduct_vNext  "), "sampleproduct-vnext");
});

test("buildRunRoot uses project scratch by default", () => {
  const run = buildRunRoot({
    workspaceRoot: "/workspace",
    project: "SampleProduct",
    task: "Fix Login Flow",
    timestamp: "20260429-2315",
  });
  assert.equal(run.relativeRunRoot, path.join("scratch", "projects", "sampleproduct", "codex-runs", "20260429-2315-fix-login-flow"));
});

test("route lock records the selected target surface", () => {
  const routeLock = buildRouteLock({
    workspaceRoot: "/workspace",
    project: "sample-product",
    projectRoot: "/workspace/projects/products/sample-product",
  });
  assert.equal(routeLock.project, "sample-product");
  assert.equal(routeLock.targetSurface, "/workspace/projects/products/sample-product");
  assert.equal(routeLock.projectRoot, "/workspace/projects/products/sample-product");
  assert.match(renderRouteLock(routeLock), /target_project: sample-product/u);
  assert.match(renderRouteLock(routeLock), /forbidden_surfaces:/u);
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
    project: "sample-product",
    projectRoot: path.join(workspaceRoot, "projects", "products", "sample-product"),
    task: "Implement remembered preference sync",
    slug: "preference-sync",
    timestamp: "20260429-2315",
  });

  assert.equal(result.ok, true);
  assert.equal(result.files.includes("00-request.md"), true);
  assert.equal(result.files.includes("07-agent-registry.md"), true);
  assert.equal(result.files.includes("08-continuation.json"), true);
  assert.equal(result.files.includes("09-failure-ledger.jsonl"), true);
  assert.equal(result.files.includes("10-ops-promotion-candidates.md"), true);
  assert.equal(result.files.includes(path.join("agents", "T01", "mapper-brief.md")), true);
  assert.equal(result.files.includes(path.join("agents", "T02", "review-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "dev-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "verify-brief.md")), true);
  assert.equal(result.files.includes(path.join("brief-templates", "repair-brief.md")), true);
  assert.equal(result.files.includes(path.join("agents", ".gitkeep")), true);

  const request = await fs.readFile(path.join(result.run_root, "00-request.md"), "utf8");
  const context = await fs.readFile(path.join(result.run_root, "01-confirmed-context.md"), "utf8");
  const ledger = await fs.readFile(path.join(result.run_root, "03-task-ledger.md"), "utf8");
  const plan = await fs.readFile(path.join(result.run_root, "02-plan.md"), "utf8");
  const decisions = await fs.readFile(path.join(result.run_root, "05-decisions.md"), "utf8");
  const mapperBrief = await fs.readFile(path.join(result.run_root, "agents", "T01", "mapper-brief.md"), "utf8");
  const reviewBrief = await fs.readFile(path.join(result.run_root, "agents", "T02", "review-brief.md"), "utf8");
  const devTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "dev-brief.md"), "utf8");
  const verifyTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "verify-brief.md"), "utf8");
  const repairTemplate = await fs.readFile(path.join(result.run_root, "brief-templates", "repair-brief.md"), "utf8");
  const continuation = JSON.parse(await fs.readFile(path.join(result.run_root, "08-continuation.json"), "utf8"));
  const candidates = await fs.readFile(path.join(result.run_root, "10-ops-promotion-candidates.md"), "utf8");
  assert.match(request, /Implement remembered preference sync/u);
  assert.equal(continuation.run_status, "active");
  assert.match(candidates, /never updates OPS by itself/u);
  assert.match(context, /## Route Lock/u);
  assert.match(context, /target_project: sample-product/u);
  assert.match(context, new RegExp(`target_surface: ${path.join(workspaceRoot, "projects", "products", "sample-product").replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u"));
  assert.match(context, /route_evidence:/u);
  assert.match(context, /forbidden_surfaces:/u);
  assert.match(plan, /Follow the current AGENTS\.md/u);
  assert.match(plan, /Root may inspect, implement, repair, and verify/u);
  assert.match(plan, /Helpers are optional/u);
  assert.match(plan, /no mapper\/review\/worker\/verifier chain is prescribed/u);
  assert.doesNotMatch(plan, /Ordinary L1 slices use at most one helper/u);
  assert.match(plan, /evidence pointers/u);
  assert.match(ledger, /repo_mapper/u);
  assert.match(ledger, /review_guard/u);
  assert.match(ledger, /\| T01 \| deferred \| repo_mapper/u);
  assert.match(ledger, /\| T02 \| deferred \| review_guard/u);
  assert.match(decisions, /## Reusable Facts/u);
  assert.match(decisions, /## Common Commands/u);
  assert.match(decisions, /## Drift Triggers/u);
  assert.match(mapperBrief, new RegExp(`${result.run_root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}/00-request\\.md`, "u"));
  assert.match(mapperBrief, /Route lock:/u);
  assert.match(mapperBrief, /Honor Route Lock/u);
  assert.match(mapperBrief, /return blocked and explain; do not switch projects/u);
  assert.match(mapperBrief, /status: mapped \| blocked/u);
  assert.match(mapperBrief, /evidence_pointers:/u);
  assert.doesNotMatch(reviewBrief, /agents\/T01\/mapper-result\.md/u);
  assert.match(reviewBrief, /Root may inspect, implement, repair, and verify directly/u);
  assert.match(reviewBrief, /not a required stage in a prescribed agent chain/u);
  assert.match(reviewBrief, /Route lock:/u);
  assert.match(reviewBrief, /Review only target_surface\/project_root/u);
  assert.match(reviewBrief, /status: pass \| changes_requested \| blocked/u);
  assert.match(reviewBrief, /evidence_pointers:/u);
  assert.match(devTemplate, /Route lock:/u);
  assert.match(devTemplate, /Root may execute this brief directly/u);
  assert.match(devTemplate, /backward-compatible legacy role label/u);
  assert.doesNotMatch(devTemplate, /Mapper result:|Review result:/u);
  assert.match(devTemplate, /root explicitly authorizes it/u);
  assert.match(devTemplate, /Change only files in target_surface\/project_root/u);
  assert.match(devTemplate, /status: implemented \| blocked/u);
  assert.match(devTemplate, /evidence_pointers:/u);
  assert.match(verifyTemplate, /Route lock:/u);
  assert.match(verifyTemplate, /Root may verify directly/u);
  assert.match(verifyTemplate, /Validate only target_surface\/project_root/u);
  assert.match(verifyTemplate, /status: pass \| fail \| blocked/u);
  assert.match(verifyTemplate, /evidence_pointers:/u);
  assert.match(repairTemplate, /Route lock:/u);
  assert.match(repairTemplate, /Repair only target_surface\/project_root/u);
  assert.match(repairTemplate, /Codex Verifier\/Review Findings/u);
  assert.match(repairTemplate, /model_worker_delegate/u);
  assert.match(repairTemplate, /Do not broaden scope/u);
  assert.match(repairTemplate, /Root may repair directly/u);
  assert.match(repairTemplate, /backward-compatible legacy role label/u);
  assert.doesNotMatch(repairTemplate, /why_no_worker|bypass reason|Repair executor:/u);
  assert.match(repairTemplate, /Failing Evidence/u);
  assert.match(repairTemplate, /evidence_pointers:/u);
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
