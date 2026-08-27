import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { appendSlice } from "./codex-long-task-append-slice.mjs";
import { closeSlice } from "./codex-long-task-close-slice.mjs";
import { createLongTaskRun } from "./codex-long-task-init.mjs";
import { createRecheck } from "./codex-long-task-recheck.mjs";
import { createRepair } from "./codex-long-task-repair.mjs";
import {
  addOpsCandidate,
  checkpointLongTask,
  finalizeLongTask,
  reopenLongTask,
  resumeLongTask,
  statusLongTasks,
} from "./codex-long-task-state-commands.mjs";
import {
  CONTINUATION_FILE,
  FAILURE_LEDGER_FILE,
  OPS_CANDIDATES_FILE,
  TRANSACTION_FILE,
  buildAttemptKey,
  buildFailureKey,
  buildSliceKey,
  loadContinuation,
  normalizeStableLines,
} from "./codex-long-task-state.mjs";

async function createWorkspaceRun({ workspaceRoot = "", timestamp = "20260827-1200", shared = false } = {}) {
  const root = workspaceRoot || await fs.mkdtemp(path.join(os.tmpdir(), "codex-long-task-state-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "preferences.ts"), "export const version = 0;\n", "utf8");
  const run = await createLongTaskRun({
    workspaceRoot: root,
    project: shared ? "shared" : "demo",
    projectRoot: root,
    task: "Protect long-task continuation state",
    slug: `state-${timestamp}`,
    timestamp,
    shared,
  });
  return { workspaceRoot: root, run };
}

async function appendPreferenceSlice(runRoot) {
  return appendSlice({
    runRoot,
    scope: "Implement preference sync",
    owned: ["src/preferences.ts"],
    acceptance: ["preference changes are persisted"],
  });
}

function failingResult(extra = "") {
  return `# Verification Result\n\nstatus: fail\nfailure_signature: persistence-mismatch\nfailed_acceptance: preference changes are persisted\n${extra}\n`;
}

async function startFailedRun(options = {}) {
  const fixture = await createWorkspaceRun(options);
  await appendPreferenceSlice(fixture.run.run_root);
  await fs.writeFile(path.join(fixture.run.run_root, "agents", "T03", "dev-result.md"), "status: implemented\n", "utf8");
  const verifyResult = path.join(fixture.run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(verifyResult, failingResult(), "utf8");
  await closeSlice({ runRoot: fixture.run.run_root, result: verifyResult });
  return fixture;
}

async function failRepairAttempt({ workspaceRoot, runRoot, devTaskId, verifyTaskId, number, epoch }) {
  const repair = await createRepair({
    runRoot,
    verifyResult: number === 1
      ? path.join(runRoot, "agents", verifyTaskId, "verify-result.md")
      : path.join(runRoot, "agents", verifyTaskId, `recheck-${number - 1}-result.md`),
    hypothesis: `epoch ${epoch} hypothesis ${number}`,
    approach: `epoch ${epoch} approach ${number}`,
  });
  assert.equal(repair.repair_number, number);
  await fs.writeFile(path.join(workspaceRoot, "src", "preferences.ts"), `export const version = ${epoch * 10 + number};\n`, "utf8");
  const repairResult = path.join(runRoot, "agents", devTaskId, `repair-${number}-result.md`);
  await fs.writeFile(repairResult, `status: implemented\nchanged_files: src/preferences.ts\n`, "utf8");
  await createRecheck({ runRoot, repairResult });
  const recheckResult = path.join(runRoot, "agents", verifyTaskId, `recheck-${number}-result.md`);
  await fs.writeFile(recheckResult, failingResult(`log_time: 2026-08-27T12:0${number}:00Z`), "utf8");
  return closeSlice({ runRoot, result: recheckResult });
}

test("fingerprints normalize case, whitespace, paths, timestamps, and log order", () => {
  const firstSlice = buildSliceKey({
    workspaceRoot: "/tmp/Workspace",
    projectRoot: "/tmp/Workspace/Project",
    scope: " Implement  Preference Sync ",
    owned: ["./src/a.ts", "tests/../tests/a.test.ts"],
    acceptance: ["Tests PASS", "State persists"],
  });
  const secondSlice = buildSliceKey({
    workspaceRoot: "/tmp/workspace",
    projectRoot: "/tmp/workspace/project",
    scope: "implement preference sync",
    owned: ["tests/a.test.ts", "src/a.ts"],
    acceptance: ["state persists", "tests pass"],
  });
  assert.equal(firstSlice, secondSlice);

  const firstFailure = buildFailureKey({
    sliceKey: firstSlice,
    failureSignature: "2026-08-27T12:00:00Z timeout\nexpected saved state",
    failedAcceptance: ["State persists"],
  });
  const secondFailure = buildFailureKey({
    sliceKey: secondSlice,
    failureSignature: " EXPECTED SAVED STATE \n2026-08-27T19:42:10+08:00   timeout",
    failedAcceptance: ["state persists"],
  });
  assert.equal(firstFailure, secondFailure);
  assert.deepEqual(normalizeStableLines("b\na\na"), ["a", "b"]);
  assert.equal(buildAttemptKey({ failureKey: firstFailure, hypothesis: " Cache Race ", approach: "SERIALIZE", owned: ["./src/a.ts"], projectRoot: "/tmp/workspace/project" }),
    buildAttemptKey({ failureKey: secondFailure, hypothesis: "cache race", approach: "serialize", owned: ["src/a.ts"], projectRoot: "/tmp/workspace/project" }));
});

test("init writes continuation, failure ledger, OPS candidate file, and project/shared indexes", async () => {
  const projectFixture = await createWorkspaceRun();
  for (const file of [CONTINUATION_FILE, FAILURE_LEDGER_FILE, OPS_CANDIDATES_FILE]) {
    await fs.access(path.join(projectFixture.run.run_root, file));
    assert.equal(projectFixture.run.files.includes(file), true);
  }
  const projectIndex = JSON.parse(await fs.readFile(path.join(projectFixture.workspaceRoot, "state", "project-data", "demo", "codex-long-tasks", "index.json"), "utf8"));
  assert.equal(projectIndex.runs[0].run_root, projectFixture.run.run_root);

  const sharedFixture = await createWorkspaceRun({ workspaceRoot: projectFixture.workspaceRoot, timestamp: "20260827-1201", shared: true });
  const sharedIndex = JSON.parse(await fs.readFile(path.join(projectFixture.workspaceRoot, "state", "project-data", "workspace", "codex-long-tasks", "index.json"), "utf8"));
  assert.equal(sharedIndex.runs[0].run_root, sharedFixture.run.run_root);
});

test("checkpoint, status, and resume persist a compact continuation and replay an interrupted transaction", async () => {
  const { workspaceRoot, run } = await createWorkspaceRun();
  const checkpoint = await checkpointLongTask({
    runRoot: run.run_root,
    phase: "mapping",
    nextAction: "inspect the exact entry point",
    confirmed: ["route is locked"],
  });
  assert.equal(checkpoint.checkpoint_seq, 1);
  const status = await statusLongTasks({ workspaceRoot, project: "demo" });
  assert.equal(status.runs.length, 1);
  assert.equal(status.runs[0].next_action, "inspect the exact entry point");

  await fs.writeFile(path.join(run.run_root, TRANSACTION_FILE), `${JSON.stringify({
    schema: "codex-long-task-transaction/v1",
    operation: "test-interruption",
    entries: [{ relative_path: "06-final-summary.md", content: "# Recovered\n" }],
  })}\n`, "utf8");
  const resumed = await resumeLongTask({ runRoot: run.run_root });
  assert.equal(resumed.recovered_transaction, true);
  assert.equal(await fs.readFile(path.join(run.run_root, "06-final-summary.md"), "utf8"), "# Recovered\n");
  await assert.rejects(fs.access(path.join(run.run_root, TRANSACTION_FILE)));

  const staleLock = path.join(run.run_root, ".codex-long-task.lock");
  await fs.mkdir(staleLock);
  await fs.writeFile(path.join(staleLock, "owner.json"), `${JSON.stringify({ pid: 99999999, created_at: new Date().toISOString() })}\n`, "utf8");
  const afterStaleLock = await checkpointLongTask({ runRoot: run.run_root, phase: "recovered-lock", nextAction: "continue after stale lock" });
  assert.equal(afterStaleLock.checkpoint_seq, 2);
});

test("legacy markdown-only runs stay read-only until the first subsequent write", async () => {
  const { run } = await createWorkspaceRun();
  await fs.rm(path.join(run.run_root, CONTINUATION_FILE));
  await fs.rm(path.join(run.run_root, FAILURE_LEDGER_FILE));
  await fs.rm(path.join(run.run_root, OPS_CANDIDATES_FILE));

  const status = await statusLongTasks({ runRoot: run.run_root });
  assert.equal(status.runs[0].legacy_state, true);
  await assert.rejects(fs.access(path.join(run.run_root, CONTINUATION_FILE)));

  const resumed = await resumeLongTask({ runRoot: run.run_root });
  assert.equal(resumed.legacy_state, true);
  await assert.rejects(fs.access(path.join(run.run_root, CONTINUATION_FILE)));

  await checkpointLongTask({ runRoot: run.run_root, phase: "legacy-resumed", nextAction: "continue from disk" });
  await fs.access(path.join(run.run_root, CONTINUATION_FILE));
  const loaded = await loadContinuation(run.run_root);
  assert.equal(loaded.state.legacy_migrated, true);
  assert.equal(loaded.state.checkpoint_seq, 1);
});

test("resume refuses multiple active runs, corrupt state, and Route Lock drift", async () => {
  const first = await createWorkspaceRun({ timestamp: "20260827-1210" });
  await createWorkspaceRun({ workspaceRoot: first.workspaceRoot, timestamp: "20260827-1211" });
  await assert.rejects(resumeLongTask({ workspaceRoot: first.workspaceRoot, project: "demo" }), /multiple active runs/u);

  const corrupt = await createWorkspaceRun({ timestamp: "20260827-1212" });
  await fs.writeFile(path.join(corrupt.run.run_root, CONTINUATION_FILE), "{not-json\n", "utf8");
  await assert.rejects(resumeLongTask({ runRoot: corrupt.run.run_root }), /corrupt continuation state/u);

  const mismatchedRoot = await createWorkspaceRun({ timestamp: "20260827-1214" });
  const mismatchPath = path.join(mismatchedRoot.run.run_root, CONTINUATION_FILE);
  const mismatchState = JSON.parse(await fs.readFile(mismatchPath, "utf8"));
  mismatchState.run_root = path.join(mismatchedRoot.workspaceRoot, "other-run");
  await fs.writeFile(mismatchPath, `${JSON.stringify(mismatchState)}\n`, "utf8");
  await assert.rejects(resumeLongTask({ runRoot: mismatchedRoot.run.run_root }), /continuation conflict: state run_root/u);

  const invalidShape = await createWorkspaceRun({ timestamp: "20260827-1215" });
  const invalidShapePath = path.join(invalidShape.run.run_root, CONTINUATION_FILE);
  const invalidState = JSON.parse(await fs.readFile(invalidShapePath, "utf8"));
  invalidState.slices = [];
  await fs.writeFile(invalidShapePath, `${JSON.stringify(invalidState)}\n`, "utf8");
  await assert.rejects(resumeLongTask({ runRoot: invalidShape.run.run_root }), /slices must be an object/u);

  const routingDrift = await createWorkspaceRun({ timestamp: "20260827-1216" });
  const routingPath = path.join(routingDrift.run.run_root, CONTINUATION_FILE);
  const routingState = JSON.parse(await fs.readFile(routingPath, "utf8"));
  routingState.state_data = path.join("state", "project-data", "other-project");
  await fs.writeFile(routingPath, `${JSON.stringify(routingState)}\n`, "utf8");
  await assert.rejects(resumeLongTask({ runRoot: routingDrift.run.run_root }), /state_data\/ops_surface routing drifted/u);

  const drift = await createWorkspaceRun({ timestamp: "20260827-1213" });
  const contextPath = path.join(drift.run.run_root, "01-confirmed-context.md");
  const context = await fs.readFile(contextPath, "utf8");
  await fs.writeFile(contextPath, context.replace(`target_surface: ${drift.workspaceRoot}`, `target_surface: ${drift.workspaceRoot}/other`), "utf8");
  await assert.rejects(resumeLongTask({ runRoot: drift.run.run_root }), /Route Lock drift/u);
});

test("semantic duplicate slices are rejected inside one run and across unresolved runs", async () => {
  const first = await createWorkspaceRun({ timestamp: "20260827-1220" });
  await appendSlice({
    runRoot: first.run.run_root,
    scope: "Implement A",
    owned: ["src/preferences.ts", "tests/../tests/a.test.ts"],
    acceptance: ["A passes", "State persists"],
  });
  await fs.writeFile(path.join(first.run.run_root, "agents", "T04", "verify-result.md"), "status: pass\n", "utf8");
  await closeSlice({ runRoot: first.run.run_root, result: path.join(first.run.run_root, "agents", "T04", "verify-result.md") });
  await assert.rejects(appendSlice({
    runRoot: first.run.run_root,
    scope: " implement   a ",
    owned: ["tests/a.test.ts", "./src/preferences.ts"],
    acceptance: ["state persists", "a PASSES"],
  }), /duplicate slice rejected/u);

  const active = await createWorkspaceRun({ workspaceRoot: first.workspaceRoot, timestamp: "20260827-1221" });
  await appendPreferenceSlice(active.run.run_root);
  const competing = await createWorkspaceRun({ workspaceRoot: first.workspaceRoot, timestamp: "20260827-1222" });
  await assert.rejects(appendSlice({
    runRoot: competing.run.run_root,
    scope: " implement preference sync ",
    owned: ["./src/preferences.ts"],
    acceptance: ["PREFERENCE changes are persisted"],
  }), /duplicate unresolved slice exists in another run/u);

  await finalizeLongTask({ runRoot: active.run.run_root, status: "deferred" });
  await assert.rejects(appendSlice({
    runRoot: competing.run.run_root,
    scope: "implement preference sync",
    owned: ["src/preferences.ts"],
    acceptance: ["preference changes are persisted"],
  }), /duplicate unresolved slice exists in another run/u);
});

test("concurrent identical repairs allow exactly one mutation and reject non-3 limits", async () => {
  const { run } = await startFailedRun({ timestamp: "20260827-1230" });
  const options = {
    runRoot: run.run_root,
    verifyResult: path.join(run.run_root, "agents", "T04", "verify-result.md"),
    hypothesis: "single cause",
    approach: "single approach",
  };
  const outcomes = await Promise.allSettled([createRepair(options), createRepair(options)]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  const events = (await fs.readFile(path.join(run.run_root, FAILURE_LEDGER_FILE), "utf8")).trim().split(/\r?\n/u).map(JSON.parse);
  assert.equal(events.filter((event) => event.event === "attempt_created").length, 1);
  assert.equal(events.filter((event) => event.event === "verification_failed").length, 1);
  await assert.rejects(createRepair({ ...options, maxRepairs: 4 }), /fixed at 3/u);

  const direct = await createWorkspaceRun({ timestamp: "20260827-1231" });
  await appendPreferenceSlice(direct.run.run_root);
  const directResult = path.join(direct.run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(directResult, failingResult(), "utf8");
  await createRepair({ runRoot: direct.run.run_root, verifyResult: directResult, hypothesis: "direct cause", approach: "direct repair" });
  const directEvents = (await fs.readFile(path.join(direct.run.run_root, FAILURE_LEDGER_FILE), "utf8")).trim().split(/\r?\n/u).map(JSON.parse);
  assert.equal(directEvents.filter((event) => event.event === "verification_failed" && event.ingested_by === "repair").length, 1);
});

test("new runs require stable verifier fields and reject stale or out-of-run results", async () => {
  const fixture = await createWorkspaceRun({ timestamp: "20260827-1235" });
  await appendPreferenceSlice(fixture.run.run_root);
  const resultPath = path.join(fixture.run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(resultPath, "status: fail\n", "utf8");
  await assert.rejects(createRepair({ runRoot: fixture.run.run_root, verifyResult: resultPath }), /require verifier failure_signature/u);
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: resultPath }), /require verifier failure_signature/u);
  await fs.writeFile(resultPath, "status: fail\nfailure_signature: persistence-mismatch\n", "utf8");
  await assert.rejects(createRepair({ runRoot: fixture.run.run_root, verifyResult: resultPath }), /require verifier failure_signature and failed_acceptance/u);
  await fs.writeFile(resultPath, "status: fail\nfailed_acceptance: preference changes are persisted\n", "utf8");
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: resultPath }), /require verifier failure_signature and failed_acceptance/u);
  await fs.writeFile(resultPath, "status: fail\nfailure_signature: <stable normalized failure identity>\nfailed_acceptance: <exact failed acceptance criterion>\n", "utf8");
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: resultPath }), /require verifier failure_signature and failed_acceptance/u);
  await fs.writeFile(resultPath, "status: fail\nfailure_signature: persistence-mismatch\nfailed_acceptance: a different criterion\n", "utf8");
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: resultPath }), /exactly match an acceptance criterion/u);

  const external = path.join(fixture.workspaceRoot, "external-result.md");
  await fs.writeFile(external, failingResult(), "utf8");
  await assert.rejects(createRepair({ runRoot: fixture.run.run_root, verifyResult: external }), /outside the run/u);
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: external, devTaskId: "T03", verifyTaskId: "T04" }), /outside the run/u);

  await fs.writeFile(resultPath, failingResult(), "utf8");
  await closeSlice({ runRoot: fixture.run.run_root, result: resultPath });
  await createRepair({
    runRoot: fixture.run.run_root,
    verifyResult: resultPath,
    hypothesis: "stale close guard",
    approach: "prepare a real repair",
  });
  await fs.writeFile(resultPath, "status: pass\n", "utf8");
  await assert.rejects(closeSlice({ runRoot: fixture.run.run_root, result: resultPath }), /initial verify result is stale/u);
  await assert.rejects(createRepair({
    runRoot: fixture.run.run_root,
    verifyResult: resultPath,
    hypothesis: "another",
    approach: "another",
  }), /status: fail|attempt_pending/u);
});

test("legacy runs reconstruct existing repair counts and expected text cannot change failure identity", async () => {
  const legacy = await createWorkspaceRun({ timestamp: "20260827-1236" });
  await appendPreferenceSlice(legacy.run.run_root);
  const verifyResult = path.join(legacy.run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(verifyResult, "status: fail\nlegacy failure evidence\n", "utf8");
  await fs.writeFile(path.join(legacy.run.run_root, "agents", "T03", "repair-1-result.md"), "status: implemented\n", "utf8");
  for (const file of [CONTINUATION_FILE, FAILURE_LEDGER_FILE, OPS_CANDIDATES_FILE]) await fs.rm(path.join(legacy.run.run_root, file));
  const repair = await createRepair({
    runRoot: legacy.run.run_root,
    verifyResult,
    repairNumber: 2,
    hypothesis: "legacy second hypothesis",
    approach: "legacy second approach",
    expected: ["this text must not identify the failure"],
  });
  assert.equal(repair.repair_number, 2);
  const loaded = await loadContinuation(legacy.run.run_root);
  const chain = loaded.state.failure_chains[loaded.state.active_failure];
  assert.equal(chain.attempts_total, 2);
  assert.equal(chain.failed_acceptance.includes("this text must not identify the failure"), false);

  const first = await startFailedRun({ timestamp: "20260827-1237" });
  const second = await startFailedRun({ timestamp: "20260827-1238" });
  const firstRepair = await createRepair({ runRoot: first.run.run_root, verifyResult: path.join(first.run.run_root, "agents", "T04", "verify-result.md"), expected: ["expected A"] });
  const secondRepair = await createRepair({ runRoot: second.run.run_root, verifyResult: path.join(second.run.run_root, "agents", "T04", "verify-result.md"), expected: ["expected B"] });
  assert.equal(firstRepair.failure_key, secondRepair.failure_key);
});

test("three failed repairs block epoch one, new evidence opens epoch two, and six total failures require the user", async () => {
  const { workspaceRoot, run } = await startFailedRun({ timestamp: "20260827-1240" });
  for (let number = 1; number <= 3; number += 1) {
    const result = await failRepairAttempt({ workspaceRoot, runRoot: run.run_root, devTaskId: "T03", verifyTaskId: "T04", number, epoch: 1 });
    assert.equal(result.run_status, number === 3 ? "blocked" : "active");
  }

  await assert.rejects(reopenLongTask({
    runRoot: run.run_root,
    evidenceFacts: ["persistence-mismatch"],
    evidenceFiles: [path.join(run.run_root, "agents", "T04", "recheck-3-result.md")],
    hypothesis: "epoch two new hypothesis",
    approach: "epoch two new approach",
  }), /new evidence fact and new evidence file content/u);

  const newEvidence = path.join(run.run_root, "new-evidence.md");
  await fs.writeFile(newEvidence, "Confirmed a newly isolated serialization boundary.\n", "utf8");
  const reopened = await reopenLongTask({
    runRoot: run.run_root,
    evidenceFacts: ["serialization boundary reproduces only after queue handoff"],
    evidenceFiles: [newEvidence],
    hypothesis: "queue handoff loses the persisted value",
    approach: "serialize the queue handoff before persistence",
  });
  assert.equal(reopened.epoch, 2);
  assert.equal(reopened.dev_task_id, "T05");
  assert.equal(reopened.verify_task_id, "T06");

  await fs.writeFile(path.join(run.run_root, "agents", "T05", "dev-result.md"), "status: implemented\n", "utf8");
  const verifyResult = path.join(run.run_root, "agents", "T06", "verify-result.md");
  await fs.writeFile(verifyResult, "status: fail\nfailure_signature: changed-failure\nfailed_acceptance: preference changes are persisted\n", "utf8");
  await assert.rejects(closeSlice({ runRoot: run.run_root, result: verifyResult }), /reopened slice must retain/u);
  await fs.writeFile(verifyResult, failingResult(), "utf8");
  await closeSlice({ runRoot: run.run_root, result: verifyResult });
  for (let number = 1; number <= 3; number += 1) {
    const result = await failRepairAttempt({ workspaceRoot, runRoot: run.run_root, devTaskId: "T05", verifyTaskId: "T06", number, epoch: 2 });
    assert.equal(result.run_status, number === 3 ? "needs_user_decision" : "active");
  }

  const loaded = await loadContinuation(run.run_root);
  const chain = loaded.state.failure_chains[loaded.state.active_failure];
  assert.equal(chain.attempts_total, 6);
  assert.equal(chain.epoch, 2);
  assert.equal(loaded.state.run_status, "needs_user_decision");
  await assert.rejects(appendSlice({ runRoot: run.run_root, scope: "try again", owned: ["src/preferences.ts"], acceptance: ["works"] }), /needs user decision/u);
  await assert.rejects(reopenLongTask({
    runRoot: run.run_root,
    evidenceFacts: ["another fact"], evidenceFiles: [newEvidence], hypothesis: "another hypothesis", approach: "another approach",
  }), /requires a blocked first epoch|current status/u);
});

test("OPS candidates and finalize stay inside the run and never edit OPS targets", async () => {
  const { workspaceRoot, run } = await createWorkspaceRun({ timestamp: "20260827-1250" });
  const opsReadme = path.join(workspaceRoot, "ops", "projects", "demo", "README.md");
  await fs.mkdir(path.dirname(opsReadme), { recursive: true });
  await fs.writeFile(opsReadme, "# Demo OPS\n", "utf8");
  await appendPreferenceSlice(run.run_root);
  const verifyResult = path.join(run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(verifyResult, "status: pass\n", "utf8");
  await closeSlice({ runRoot: run.run_root, result: verifyResult });
  const beforeOps = await fs.readFile(opsReadme, "utf8");

  const candidate = await addOpsCandidate({
    runRoot: run.run_root,
    type: "readme",
    target: "ops/projects/demo/README.md",
    fact: "The focused preference persistence check passed.",
    evidenceFiles: [verifyResult],
    verifiedAt: "2026-08-27T12:50:00+08:00",
    durabilityBasis: "The acceptance criterion is a stable project contract and was verified from a fresh run.",
    recheckCondition: "Recheck when persistence code or its contract changes.",
    residualRisk: "Only the focused local path was verified.",
  });
  assert.equal(candidate.file, OPS_CANDIDATES_FILE);
  const finalized = await finalizeLongTask({ runRoot: run.run_root, status: "completed" });
  assert.equal(finalized.status, "completed");
  assert.equal(await fs.readFile(opsReadme, "utf8"), beforeOps);
  const candidateText = await fs.readFile(path.join(run.run_root, OPS_CANDIDATES_FILE), "utf8");
  assert.match(candidateText, /pending_codex_review/u);
  assert.match(candidateText, /durability_review_status: pending_codex_review/u);
  assert.match(candidateText, /candidates remain run-local/u);

  const shared = await createWorkspaceRun({ workspaceRoot, timestamp: "20260827-1251", shared: true });
  await appendPreferenceSlice(shared.run.run_root);
  const sharedVerify = path.join(shared.run.run_root, "agents", "T04", "verify-result.md");
  await fs.writeFile(sharedVerify, "status: pass\n", "utf8");
  await closeSlice({ runRoot: shared.run.run_root, result: sharedVerify });
  await assert.rejects(addOpsCandidate({
    runRoot: shared.run.run_root,
    type: "readme",
    target: "ops/projects/demo/README.md",
    fact: "A shared run must not promote into project OPS.",
    evidenceFiles: [sharedVerify],
    verifiedAt: "2026-08-27T12:51:00+08:00",
    durabilityBasis: "This is a workspace-level routing invariant.",
    recheckCondition: "Recheck when shared routing changes.",
    residualRisk: "None known.",
  }), /shared workspace runs cannot promote/u);
});
