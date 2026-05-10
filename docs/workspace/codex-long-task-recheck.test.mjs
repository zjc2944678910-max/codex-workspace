import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendSlice } from "./codex-long-task-append-slice.mjs";
import { createLongTaskRun } from "./codex-long-task-init.mjs";
import { createRepair } from "./codex-long-task-repair.mjs";
import {
  createRecheck,
  inferDevTaskIdFromRepairResult,
  inferRepairNumberFromRepairResult,
  inferVerifyTaskIdFromLedger,
  updateLedgerForRecheck,
} from "./codex-long-task-recheck.mjs";

async function createRepairReadyRun() {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-recheck-"));
  const run = await createLongTaskRun({
    workspaceRoot,
    project: "demo",
    task: "Demo recheck loop",
    slug: "demo-recheck",
    timestamp: "20260430-0300",
  });
  await appendSlice({
    runRoot: run.run_root,
    scope: "Implement preference sync",
    owned: ["src/preferences.ts"],
    acceptance: ["preference changes are persisted"],
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "dev-result.md"), "# Development Result\n\nChanged preferences.\n", "utf8");
  await fs.writeFile(path.join(run.run_root, "agents", "T04", "verify-result.md"), "# Verification Result\n\nfail\n", "utf8");
  await createRepair({
    runRoot: run.run_root,
    verifyResult: path.join(run.run_root, "agents", "T04", "verify-result.md"),
    expected: ["preference changes are persisted"],
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "repair-1-result.md"), "# Repair Result\n\nFixed persistence edge case.\n", "utf8");
  return run;
}

test("infers dev task and repair number from repair result path", () => {
  assert.equal(inferDevTaskIdFromRepairResult("/tmp/run/agents/T03/repair-2-result.md"), "T03");
  assert.equal(inferDevTaskIdFromRepairResult("agents/T12/repair-1-result.md"), "T12");
  assert.equal(inferDevTaskIdFromRepairResult("/tmp/nope.md"), "");
  assert.equal(inferRepairNumberFromRepairResult("/tmp/run/agents/T03/repair-2-result.md"), 2);
  assert.equal(inferRepairNumberFromRepairResult("repair-7-result.md"), 7);
  assert.equal(inferRepairNumberFromRepairResult("/tmp/nope.md"), 0);
});

test("infers verifier task from ledger", async () => {
  const run = await createRepairReadyRun();
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  assert.equal(inferVerifyTaskIdFromLedger(ledger, "T03"), "T04");
});

test("updateLedgerForRecheck marks dev and verifier as verifying", async () => {
  const run = await createRepairReadyRun();
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const updated = updateLedgerForRecheck(ledger, {
    devTaskId: "T03",
    verifyTaskId: "T04",
    repairNumber: 1,
  });
  assert.match(updated, /\| T03 \| verifying \| claude_codegen_delegate/u);
  assert.match(updated, /repair-1 submitted for recheck/u);
  assert.match(updated, /\| T04 \| verifying \| verifier/u);
  assert.match(updated, /recheck-1 requested/u);
});

test("createRecheck writes recheck brief and updates ledger", async () => {
  const run = await createRepairReadyRun();
  const result = await createRecheck({
    runRoot: run.run_root,
    repairResult: path.join(run.run_root, "agents", "T03", "repair-1-result.md"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.dev_task_id, "T03");
  assert.equal(result.verify_task_id, "T04");
  assert.equal(result.repair_number, 1);

  const brief = await fs.readFile(path.join(run.run_root, "agents", "T04", "recheck-1-brief.md"), "utf8");
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  assert.match(brief, /Fixed persistence edge case/u);
  assert.match(brief, /Original verification result/u);
  assert.match(brief, /status: pass \| fail \| blocked/u);
  assert.match(ledger, /\| T03 \| verifying/u);
  assert.match(ledger, /\| T04 \| verifying/u);
});

test("createRecheck dry run does not write or mutate", async () => {
  const run = await createRepairReadyRun();
  const before = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const result = await createRecheck({
    runRoot: run.run_root,
    repairResult: path.join(run.run_root, "agents", "T03", "repair-1-result.md"),
    dryRun: true,
  });
  const after = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.dry_run, true);
  assert.equal(result.ledger_changed, true);
  assert.equal(before, after);
  await assert.rejects(fs.access(path.join(run.run_root, "agents", "T04", "recheck-1-brief.md")));
});

test("createRecheck rejects existing recheck brief", async () => {
  const run = await createRepairReadyRun();
  await createRecheck({
    runRoot: run.run_root,
    repairResult: path.join(run.run_root, "agents", "T03", "repair-1-result.md"),
  });
  await assert.rejects(createRecheck({
    runRoot: run.run_root,
    repairResult: path.join(run.run_root, "agents", "T03", "repair-1-result.md"),
  }), /recheck brief already exists/u);
});
