import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { dispatchLongTask, normalizeCommand, parseCommand } from "./codex-long-task.mjs";

test("parseCommand handles help and command aliases", () => {
  assert.deepEqual(parseCommand(["--help"]), { help: true, command: "", rest: [] });
  assert.equal(parseCommand(["append", "--scope", "x"]).command, "append");
  assert.throws(() => parseCommand(["unknown"]), /unknown command/u);
  assert.equal(normalizeCommand(" Close-Slice "), "close-slice");
  for (const command of ["status", "resume", "checkpoint", "reopen", "ops-candidate", "finalize"]) {
    assert.equal(parseCommand([command]).command, command);
  }
});

test("dispatchLongTask can run the full local slice lifecycle", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-wrapper-"));
  const init = await dispatchLongTask([
    "init",
    "--workspace-root", workspaceRoot,
    "--project", "demo",
    "--project-root", workspaceRoot,
    "--task", "Wrapper lifecycle",
    "--slug", "wrapper-lifecycle",
    "--timestamp", "20260430-0500",
  ]);
  const runRoot = init.result.run_root;
  assert.equal(init.command, "init");
  assert.match(runRoot, /wrapper-lifecycle/u);

  const checkpoint = await dispatchLongTask([
    "checkpoint",
    "--run-root", runRoot,
    "--phase", "planned",
    "--next-action", "append the first implementation slice",
  ]);
  assert.equal(checkpoint.result.checkpoint_seq, 1);
  const status = await dispatchLongTask(["status", "--run-root", runRoot]);
  assert.equal(status.result.runs[0].status, "active");
  const resume = await dispatchLongTask(["resume", "--run-root", runRoot]);
  assert.equal(resume.result.next_action, "append the first implementation slice");

  const append = await dispatchLongTask([
    "append",
    "--run-root", runRoot,
    "--scope", "Implement wrapper lifecycle",
    "--owned", "docs/workspace/codex-long-task.mjs",
    "--acceptance", "wrapper routes every subcommand",
  ]);
  assert.equal(append.result.dev_task_id, "T03");
  assert.equal(append.result.verify_task_id, "T04");

  await fs.writeFile(path.join(runRoot, "agents", "T03", "dev-result.md"), "# Development Result\n\nImplemented wrapper.\n", "utf8");
  await fs.writeFile(path.join(runRoot, "agents", "T04", "verify-result.md"), "# Verification Result\n\nstatus: fail\nfailure_signature: wrapper-route-failed\nfailed_acceptance: wrapper routes every subcommand\n", "utf8");

  const repair = await dispatchLongTask([
    "repair",
    "--run-root", runRoot,
    "--verify-result", path.join(runRoot, "agents", "T04", "verify-result.md"),
    "--expected", "wrapper routes every subcommand",
  ]);
  assert.equal(repair.result.repair_number, 1);

  await fs.writeFile(path.join(runRoot, "agents", "T03", "repair-1-result.md"), "# Repair Result\n\nFixed wrapper routing.\n", "utf8");

  const recheck = await dispatchLongTask([
    "recheck",
    "--run-root", runRoot,
    "--repair-result", path.join(runRoot, "agents", "T03", "repair-1-result.md"),
  ]);
  assert.equal(recheck.result.verify_task_id, "T04");

  await fs.writeFile(path.join(runRoot, "agents", "T04", "recheck-1-result.md"), "# Verification Result\n\n## Status\n\npass\n", "utf8");

  const close = await dispatchLongTask([
    "close",
    "--run-root", runRoot,
    "--result", path.join(runRoot, "agents", "T04", "recheck-1-result.md"),
  ]);
  assert.equal(close.result.status, "pass");

  const opsReadme = path.join(workspaceRoot, "ops", "projects", "demo", "README.md");
  await fs.mkdir(path.dirname(opsReadme), { recursive: true });
  await fs.writeFile(opsReadme, "# Demo\n", "utf8");
  const candidate = await dispatchLongTask([
    "ops-candidate",
    "--run-root", runRoot,
    "--type", "readme",
    "--target", "ops/projects/demo/README.md",
    "--fact", "The wrapper lifecycle passed its focused recheck.",
    "--evidence-file", path.join(runRoot, "agents", "T04", "recheck-1-result.md"),
    "--verified-at", "2026-08-27T12:00:00+08:00",
    "--durability-basis", "The wrapper command contract remains valid across future runs until its CLI changes.",
    "--recheck-condition", "Recheck after wrapper lifecycle changes.",
    "--residual-risk", "Only the focused lifecycle was exercised.",
  ]);
  assert.equal(candidate.result.file, "10-ops-promotion-candidates.md");
  const finalize = await dispatchLongTask(["finalize", "--run-root", runRoot, "--status", "completed"]);
  assert.equal(finalize.result.status, "completed");

  const ledger = await fs.readFile(path.join(runRoot, "03-task-ledger.md"), "utf8");
  assert.match(ledger, /\| T03 \| verified \|/u);
  assert.match(ledger, /\| T04 \| done \|/u);
});

test("dispatchLongTask returns help payload", async () => {
  assert.deepEqual(await dispatchLongTask(["help"]), { ok: true, help: true });
  assert.deepEqual(await dispatchLongTask(["init", "--help"]), { ok: true, help: true, command: "init" });
});
