import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendSlice, escapeCell, findNextTaskNumber, resolveTaskIds } from "./codex-long-task-append-slice.mjs";
import { createLongTaskRun } from "./codex-long-task-init.mjs";

async function createRun() {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-slice-"));
  const run = await createLongTaskRun({
    workspaceRoot,
    project: "demo",
    task: "Demo append slice",
    slug: "demo-append",
    timestamp: "20260430-0100",
  });
  return run;
}

test("findNextTaskNumber reads the next ledger task id", () => {
  assert.equal(findNextTaskNumber("| T01 | x |\n| T12 | y |\n"), 13);
  assert.equal(findNextTaskNumber("# empty\n"), 1);
});

test("resolveTaskIds can infer or honor explicit ids", () => {
  assert.deepEqual(resolveTaskIds("| T01 | x |\n| T02 | y |\n", {}), {
    devTaskId: "T03",
    verifyTaskId: "T04",
  });
  assert.deepEqual(resolveTaskIds("| T01 | x |\n", {
    devTaskId: "T10",
    verifyTaskId: "T11",
  }), {
    devTaskId: "T10",
    verifyTaskId: "T11",
  });
  assert.throws(() => resolveTaskIds("", { devTaskId: "bad" }), /invalid task id/u);
});

test("escapeCell keeps markdown table rows stable", () => {
  assert.equal(escapeCell("fix A | B\nnow"), "fix A \\| B now");
});

test("appendSlice writes dev and verify briefs and updates the ledger", async () => {
  const run = await createRun();
  const result = await appendSlice({
    runRoot: run.run_root,
    scope: "Implement preference sync",
    owned: ["src/preferences.ts", "tests/preferences.test.ts"],
    acceptance: ["preference changes are persisted", "tests cover missing state"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.dev_task_id, "T03");
  assert.equal(result.verify_task_id, "T04");
  assert.equal(result.files.includes(path.join("agents", "T03", "dev-brief.md")), true);
  assert.equal(result.files.includes(path.join("agents", "T04", "verify-brief.md")), true);

  const ledger = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const devBrief = await fs.readFile(path.join(run.run_root, "agents", "T03", "dev-brief.md"), "utf8");
  const verifyBrief = await fs.readFile(path.join(run.run_root, "agents", "T04", "verify-brief.md"), "utf8");

  assert.match(ledger, /\| T03 \| pending \| model_worker_delegate \| Implement preference sync/u);
  assert.match(ledger, /\| T04 \| pending \| verifier \| verify Implement preference sync/u);
  assert.match(devBrief, /src\/preferences\.ts/u);
  assert.match(devBrief, /preference changes are persisted/u);
  assert.match(devBrief, /Decisions:/u);
  assert.match(devBrief, /evidence_pointers:/u);
  assert.match(verifyBrief, new RegExp(`${run.run_root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}/agents/T03/dev-result\\.md`, "u"));
  assert.match(verifyBrief, /Decisions:/u);
  assert.match(verifyBrief, /evidence_pointers:/u);
});

test("appendSlice dry run does not write files or mutate the ledger", async () => {
  const run = await createRun();
  const before = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");
  const result = await appendSlice({
    runRoot: run.run_root,
    scope: "Dry run slice",
    dryRun: true,
  });
  const after = await fs.readFile(path.join(run.run_root, "03-task-ledger.md"), "utf8");

  assert.equal(result.dry_run, true);
  assert.equal(result.dev_task_id, "T03");
  assert.equal(before, after);
  await assert.rejects(fs.access(path.join(run.run_root, "agents", "T03", "dev-brief.md")));
});

test("appendSlice rejects existing target files", async () => {
  const run = await createRun();
  await appendSlice({
    runRoot: run.run_root,
    scope: "First slice",
  });
  await assert.rejects(appendSlice({
    runRoot: run.run_root,
    scope: "Duplicate explicit slice",
    devTaskId: "T03",
    verifyTaskId: "T04",
  }), /target files already exist/u);
});
