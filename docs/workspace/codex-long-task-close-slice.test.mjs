import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendSlice } from "./codex-long-task-append-slice.mjs";
import {
  closeSlice,
  detectResultStatus,
  inferVerifyTaskIdFromResultPath,
  updateLedgerForClose,
} from "./codex-long-task-close-slice.mjs";
import { createLongTaskRun } from "./codex-long-task-init.mjs";
import { createRepair } from "./codex-long-task-repair.mjs";
import { createRecheck } from "./codex-long-task-recheck.mjs";

async function createVerifyingRun({ recheckStatus = "pass" } = {}) {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-close-"));
  const run = await createLongTaskRun({
    workspaceRoot,
    project: "demo",
    task: "Demo close slice",
    slug: "demo-close",
    timestamp: "20260430-0400",
  });
  await appendSlice({
    runRoot: run.run_root,
    scope: "Implement preference sync",
    owned: ["src/preferences.ts"],
    acceptance: ["preference changes are persisted"],
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "dev-result.md"), "# Development Result\n\nChanged preferences.\n", "utf8");
  await fs.writeFile(path.join(run.run_root, "agents", "T04", "verify-result.md"), "# Verification Result\n\n## Status\n\nfail\n", "utf8");
  await createRepair({
    runRoot: run.run_root,
    verifyResult: path.join(run.run_root, "agents", "T04", "verify-result.md"),
    expected: ["preference changes are persisted"],
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "repair-1-result.md"), "# Repair Result\n\nFixed persistence edge case.\n", "utf8");
  await createRecheck({
    runRoot: run.run_root,
    repairResult: path.join(run.run_root, "agents", "T03", "repair-1-result.md"),
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T04", "recheck-1-result.md"), `# Verification Result\n\n## Status\n\n${recheckStatus}\n`, "utf8");
  return run;
}

test("detectResultStatus handles common result formats", () => {
  assert.equal(detectResultStatus("status: pass"), "pass");
  assert.equal(detectResultStatus("## Status\n\nfailed\n"), "fail");
  assert.equal(detectResultStatus("## Status\n\n- blocked\n"), "blocked");
  assert.equal(detectResultStatus("anything", "passed"), "pass");
});

test("inferVerifyTaskIdFromResultPath reads verify and recheck paths", () => {
  assert.equal(inferVerifyTaskIdFromResultPath("/tmp/run/agents/T04/verify-result.md"), "T04");
  assert.equal(inferVerifyTaskIdFromResultPath("/tmp/run/agents/T04/recheck-2-result.md"), "T04");
  assert.equal(inferVerifyTaskIdFromResultPath("/tmp/nope.md"), "");
});

test("updateLedgerForClose marks pass as verified and done", async () => {
  const run = await createVerifyingRun();
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const updated = updateLedgerForClose(ledger, {
    devTaskId: "T03",
    verifyTaskId: "T04",
    status: "pass",
    resultName: "recheck-1-result.md",
  });
  assert.match(updated, /\| T03 \| verified \| model_worker_delegate/u);
  assert.match(updated, /verified by recheck-1-result\.md/u);
  assert.match(updated, /\| T04 \| done \| verifier/u);
  assert.match(updated, /closed by recheck-1-result\.md/u);
});

test("updateLedgerForClose marks fail as needs_fix and blocked", async () => {
  const run = await createVerifyingRun({ recheckStatus: "fail" });
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const updated = updateLedgerForClose(ledger, {
    devTaskId: "T03",
    verifyTaskId: "T04",
    status: "fail",
    resultName: "recheck-1-result.md",
  });
  assert.match(updated, /\| T03 \| needs_fix \| model_worker_delegate/u);
  assert.match(updated, /failed in recheck-1-result\.md; repair needed/u);
  assert.match(updated, /\| T04 \| blocked \| verifier/u);
  assert.match(updated, /failed in recheck-1-result\.md; run repair/u);
});

test("closeSlice writes pass ledger changes", async () => {
  const run = await createVerifyingRun();
  const result = await closeSlice({
    runRoot: run.run_root,
    result: path.join(run.run_root, "agents", "T04", "recheck-1-result.md"),
  });
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.ok, true);
  assert.equal(result.status, "pass");
  assert.equal(result.dev_task_id, "T03");
  assert.equal(result.verify_task_id, "T04");
  assert.match(ledger, /\| T03 \| verified/u);
  assert.match(ledger, /\| T04 \| done/u);
});

test("closeSlice dry run does not mutate", async () => {
  const run = await createVerifyingRun();
  const before = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const result = await closeSlice({
    runRoot: run.run_root,
    result: path.join(run.run_root, "agents", "T04", "recheck-1-result.md"),
    dryRun: true,
  });
  const after = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.dry_run, true);
  assert.equal(result.ledger_changed, true);
  assert.equal(before, after);
});

test("closeSlice fail keeps the repair path open", async () => {
  const run = await createVerifyingRun({ recheckStatus: "fail" });
  const result = await closeSlice({
    runRoot: run.run_root,
    result: path.join(run.run_root, "agents", "T04", "recheck-1-result.md"),
  });
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.status, "fail");
  assert.match(result.next_action, /codex-long-task-repair\.mjs/u);
  assert.match(ledger, /\| T03 \| needs_fix/u);
  assert.match(ledger, /\| T04 \| blocked/u);
});
