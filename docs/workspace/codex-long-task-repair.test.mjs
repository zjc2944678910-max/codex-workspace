import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendSlice } from "./codex-long-task-append-slice.mjs";
import { createLongTaskRun } from "./codex-long-task-init.mjs";
import {
  createRepair,
  inferDevTaskIdFromLedger,
  inferTaskIdFromVerifyResult,
  splitMarkdownRow,
  updateLedgerForRepair,
} from "./codex-long-task-repair.mjs";

async function createFailedRun() {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-repair-"));
  const run = await createLongTaskRun({
    workspaceRoot,
    project: "demo",
    task: "Demo repair loop",
    slug: "demo-repair",
    timestamp: "20260430-0200",
  });
  await appendSlice({
    runRoot: run.run_root,
    scope: "Implement preference sync",
    owned: ["src/preferences.ts"],
    acceptance: ["preference changes are persisted"],
  });
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "dev-result.md"), "# Development Result\n\nChanged preferences.\n", "utf8");
  await fs.writeFile(path.join(run.run_root, "agents", "T04", "verify-result.md"), "# Verification Result\n\n## Status\n\nfail\n\n## Failing Evidence\n\nExpected persisted state.\n", "utf8");
  return run;
}

test("inferTaskIdFromVerifyResult reads standard verify result paths", () => {
  assert.equal(inferTaskIdFromVerifyResult("/tmp/run/agents/T04/verify-result.md"), "T04");
  assert.equal(inferTaskIdFromVerifyResult("agents/T12/verify-result.md"), "T12");
  assert.equal(inferTaskIdFromVerifyResult("/tmp/nope.md"), "");
});

test("splitMarkdownRow handles escaped pipes", () => {
  assert.deepEqual(splitMarkdownRow("| T03 | pending | fix A \\| B |"), ["T03", "pending", "fix A \\| B"]);
});

test("inferDevTaskIdFromLedger finds the dev task from verify row", async () => {
  const run = await createFailedRun();
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  assert.equal(inferDevTaskIdFromLedger(ledger, "T04"), "T03");
});

test("updateLedgerForRepair marks dev and verifier rows", async () => {
  const run = await createFailedRun();
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const updated = updateLedgerForRepair(ledger, {
    devTaskId: "T03",
    verifyTaskId: "T04",
    repairNumber: 1,
  });
  assert.match(updated, /\| T03 \| needs_fix \| surgical_fixer/u);
  assert.match(updated, /\| T03 \| needs_fix [^\n]+ \| 1 \| implementation slice; repair-1 requested \|/u);
  assert.match(updated, /\| T04 \| blocked \| verifier/u);
  assert.match(updated, /failed; repair-1 requested for T03/u);
});

test("createRepair writes repair brief and updates ledger", async () => {
  const run = await createFailedRun();
  const result = await createRepair({
    runRoot: run.run_root,
    verifyResult: path.join(run.run_root, "agents", "T04", "verify-result.md"),
    expected: ["preference changes are persisted"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.dev_task_id, "T03");
  assert.equal(result.verify_task_id, "T04");
  assert.equal(result.repair_number, 1);

  const brief = await fs.readFile(path.join(run.run_root, "agents", "T03", "repair-1-brief.md"), "utf8");
  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  assert.match(brief, /Expected persisted state/u);
  assert.match(brief, /preference changes are persisted/u);
  assert.match(brief, /send the result back to verifier task T04/u);
  assert.match(ledger, /\| T03 \| needs_fix/u);
  assert.match(ledger, /\| T04 \| blocked/u);
});

test("createRepair dry run does not write or mutate", async () => {
  const run = await createFailedRun();
  const before = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const result = await createRepair({
    runRoot: run.run_root,
    verifyTaskId: "T04",
    dryRun: true,
  });
  const after = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.dry_run, true);
  assert.equal(result.ledger_changed, true);
  assert.equal(before, after);
  await assert.rejects(fs.access(path.join(run.run_root, "agents", "T03", "repair-1-brief.md")));
});

test("createRepair respects the repair limit", async () => {
  const run = await createFailedRun();
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "repair-1-result.md"), "still failing\n", "utf8");
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "repair-2-result.md"), "still failing\n", "utf8");
  await fs.writeFile(path.join(run.run_root, "agents", "T03", "repair-3-result.md"), "still failing\n", "utf8");
  await assert.rejects(createRepair({
    runRoot: run.run_root,
    verifyTaskId: "T04",
  }), /repair limit exceeded/u);
});
