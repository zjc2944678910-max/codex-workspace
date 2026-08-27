#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { splitMarkdownRow } from "./codex-long-task-repair.mjs";
import {
  FAILURE_LEDGER_FILE,
  MAX_REPAIRS_PER_EPOCH,
  assertRouteLockUnchanged,
  assertRunCanMutate,
  buildFailureKey,
  buildSliceKey,
  ensureFailureChain,
  evidenceDigest,
  extractFailureDescriptor,
  isPathWithin,
  loadContinuation,
  normalizeList,
  parseRepairNumberFromResult,
  persistState,
  readFailureEvents,
  recoverPendingTransaction,
  renderFailureEvents,
  withRunLock,
} from "./codex-long-task-state.mjs";

function parseArgs(argv = []) {
  const options = {
    runRoot: "",
    result: "",
    devTaskId: "",
    verifyTaskId: "",
    status: "",
    dryRun: false,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--run-root") {
      options.runRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--result") {
      options.result = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--dev-task-id") {
      options.devTaskId = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--verify-task-id") {
      options.verifyTaskId = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--status") {
      options.status = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
  }
  return options;
}

function printHelp() {
  process.stdout.write(`Usage:
  node docs/workspace/codex-long-task-close-slice.mjs --run-root <path> --result <path> [options]

Options:
  --dev-task-id <id>       Explicit development task ID, e.g. T03.
  --verify-task-id <id>    Explicit verifier task ID, e.g. T04.
  --status <status>        Override detected status: pass, fail, or blocked.
  --dry-run                Print planned ledger changes without writing.
  --json                   Print JSON.
`);
}

function normalizeRunRoot(value = "") {
  if (!value.trim()) throw new Error("--run-root is required");
  return path.resolve(value);
}

function validateTaskId(taskId = "") {
  if (!/^T\d+$/u.test(taskId)) throw new Error(`invalid task id: ${taskId}`);
}

function joinMarkdownRow(cells = []) {
  return `| ${cells.join(" | ")} |`;
}

function appendNote(note = "", addition = "") {
  const cleanNote = String(note || "").trim();
  if (!cleanNote) return addition;
  if (cleanNote.includes(addition)) return cleanNote;
  return `${cleanNote}; ${addition}`;
}

function normalizeStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["pass", "passed", "success", "successful", "verified", "done"].includes(normalized)) return "pass";
  if (["fail", "failed", "failure"].includes(normalized)) return "fail";
  if (["blocked", "block"].includes(normalized)) return "blocked";
  return "";
}

function detectResultStatus(resultText = "", override = "") {
  const explicit = normalizeStatus(override);
  if (explicit) return explicit;

  const statusLine = String(resultText || "").match(/^status\s*:\s*([a-z_ -]+)/imu);
  if (statusLine) {
    const status = normalizeStatus(statusLine[1]);
    if (status) return status;
  }

  const statusSection = String(resultText || "").match(/^##\s+Status\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+|\s*$)/imu);
  if (statusSection) {
    for (const line of statusSection[1].split(/\r?\n/u)) {
      const status = normalizeStatus(line.replace(/^[-*]\s*/u, ""));
      if (status) return status;
    }
  }

  const lower = String(resultText || "").toLowerCase();
  if (/\bpass(?:ed)?\b/u.test(lower)) return "pass";
  if (/\bfail(?:ed|ure)?\b/u.test(lower)) return "fail";
  if (/\bblocked\b/u.test(lower)) return "blocked";
  throw new Error("could not detect result status; pass --status pass|fail|blocked");
}

function inferVerifyTaskIdFromResultPath(resultPath = "") {
  const normalized = String(resultPath || "").replace(/\\/g, "/");
  const match = normalized.match(/\/agents\/(T\d+)\/(?:verify-result|recheck-\d+-result)\.md$/u)
    || normalized.match(/^agents\/(T\d+)\/(?:verify-result|recheck-\d+-result)\.md$/u);
  return match ? match[1] : "";
}

function resultLabel(resultPath = "") {
  return path.basename(String(resultPath || "").trim()) || "verification result";
}

function inferDevTaskIdFromLedger(ledgerText = "", verifyTaskId = "") {
  validateTaskId(verifyTaskId);
  for (const line of ledgerText.split(/\r?\n/u)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) continue;
    const [taskId, , agent, , inputs, , , notes] = cells;
    if (taskId !== verifyTaskId || agent !== "verifier") continue;
    const devFromPath = inputs.match(/agents\/(T\d+)\/dev-result\.md/u);
    if (devFromPath) return devFromPath[1];
    const devFromNote = notes.match(/verifies\s+(T\d+)/u);
    if (devFromNote) return devFromNote[1];
  }
  throw new Error(`could not infer development task from verifier ${verifyTaskId}`);
}

async function readRequiredFile(targetPath, label) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch {
    throw new Error(`missing ${label}: ${targetPath}`);
  }
}

function resolveResultPath(options = {}) {
  if (!String(options.result || "").trim()) throw new Error("--result is required");
  return path.isAbsolute(options.result) ? options.result : path.resolve(options.result);
}

function updateLedgerForClose(ledgerText = "", ids = {}) {
  const { devTaskId, verifyTaskId, status, resultName } = ids;
  let foundDev = false;
  let foundVerify = false;
  const lines = ledgerText.split(/\r?\n/u).map((line) => {
    if (!line.trim().startsWith("|")) return line;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) return line;
    if (cells[0] === devTaskId) {
      foundDev = true;
      if (status === "pass") {
        cells[1] = "verified";
        cells[7] = appendNote(cells[7], `verified by ${resultName}`);
      } else if (status === "fail") {
        cells[1] = "needs_fix";
        cells[7] = appendNote(cells[7], `failed in ${resultName}; repair needed`);
      } else {
        cells[1] = "blocked";
        cells[7] = appendNote(cells[7], `blocked by ${resultName}`);
      }
      return joinMarkdownRow(cells);
    }
    if (cells[0] === verifyTaskId) {
      foundVerify = true;
      if (status === "pass") {
        cells[1] = "done";
        cells[7] = appendNote(cells[7], `closed by ${resultName}`);
      } else if (status === "fail") {
        cells[1] = "blocked";
        cells[7] = appendNote(cells[7], `failed in ${resultName}; run repair`);
      } else {
        cells[1] = "blocked";
        cells[7] = appendNote(cells[7], `blocked by ${resultName}`);
      }
      return joinMarkdownRow(cells);
    }
    return line;
  });
  if (!foundDev) throw new Error(`development task not found in ledger: ${devTaskId}`);
  if (!foundVerify) throw new Error(`verification task not found in ledger: ${verifyTaskId}`);
  return lines.join("\n");
}

async function closeSlice(options = {}) {
  const runRoot = normalizeRunRoot(options.runRoot);
  const execute = async () => {
    if (options.dryRun !== true) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: options.dryRun !== true });
    const state = structuredClone(loaded.state);
    assertRunCanMutate(state, "close");
    await assertRouteLockUnchanged(state);

    const ledgerPath = path.join(runRoot, "03-task-ledger.md");
    const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
    const resultPath = resolveResultPath(options);
    if (!isPathWithin(resultPath, runRoot)) throw new Error(`verification result is outside the run: ${resultPath}`);
    const resultText = await readRequiredFile(resultPath, "verification result");
    const verifyTaskId = options.verifyTaskId || inferVerifyTaskIdFromResultPath(resultPath);
    if (!verifyTaskId) throw new Error("could not infer verifier task id; pass --verify-task-id");
    validateTaskId(verifyTaskId);
    const devTaskId = options.devTaskId || inferDevTaskIdFromLedger(ledgerText, verifyTaskId);
    validateTaskId(devTaskId);
    const status = detectResultStatus(resultText, options.status);
    const name = resultLabel(resultPath);
    let slice = state.slices?.[devTaskId];
    if (!slice && state.legacy_migrated) {
      const devBrief = await readRequiredFile(path.join(runRoot, "agents", devTaskId, "dev-brief.md"), "development brief");
      const scope = devBrief.match(/^##\s+Task\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+)/imu)?.[1]?.trim() || `legacy slice ${devTaskId}`;
      const ownershipSection = devBrief.match(/^##\s+Ownership\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+)/imu)?.[1] || "";
      const acceptanceSection = devBrief.match(/^##\s+Acceptance Criteria\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+)/imu)?.[1] || "";
      const owned = [...ownershipSection.matchAll(/^[-*]\s+(.+)$/gmu)].map((match) => match[1].trim()).filter((value) => !value.startsWith("<"));
      const acceptance = [...acceptanceSection.matchAll(/^[-*]\s+(.+)$/gmu)].map((match) => match[1].trim());
      slice = {
        dev_task_id: devTaskId,
        verify_task_id: verifyTaskId,
        slice_key: buildSliceKey({ projectRoot: state.project_root, workspaceRoot: state.workspace_root, scope, owned, acceptance }),
        scope,
        owned,
        acceptance,
        epoch: 1,
        status: "pending",
        legacy_reconstructed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.slices[devTaskId] = slice;
    }
    if (!slice) throw new Error(`continuation conflict: slice ${devTaskId} is missing`);
    if (slice.verify_task_id !== verifyTaskId) throw new Error(`verification task ${verifyTaskId} does not belong to slice ${devTaskId}`);
    const repairNumber = parseRepairNumberFromResult(resultPath);
    const initialVerification = path.basename(resultPath) === "verify-result.md";
    const currentChain = slice.failure_key ? state.failure_chains?.[slice.failure_key] : null;
    if (initialVerification && slice.status !== "pending") {
      throw new Error(`initial verify result is stale while slice ${devTaskId} is ${slice.status}`);
    }
    if (!initialVerification && (slice.status !== "verifying" || currentChain?.status !== "verifying"
      || repairNumber !== Number(currentChain?.attempts_in_epoch || 0))) {
      throw new Error(`recheck result is not current for slice ${devTaskId}`);
    }
    const events = await readFailureEvents(runRoot);
    let event = null;
    let nextAction = "";

    if (status === "pass") {
      const chain = slice.failure_key ? state.failure_chains?.[slice.failure_key] : null;
      if (repairNumber > 0 && !chain) throw new Error(`failure chain is missing for recheck-${repairNumber}`);
      if (chain) {
        chain.status = "resolved";
        chain.resolved_at = new Date().toISOString();
        chain.updated_at = chain.resolved_at;
        event = {
          schema: "codex-long-task-failure-event/v1",
          event: "verification_passed",
          at: chain.resolved_at,
          run_id: state.run_id,
          dev_task_id: devTaskId,
          verify_task_id: verifyTaskId,
          slice_key: slice.slice_key,
          failure_key: chain.failure_key,
          epoch: chain.epoch,
          attempt_in_epoch: repairNumber || null,
          verification_result: resultPath,
          verification_digest: await evidenceDigest(resultPath),
          result: "resolved",
        };
      }
      slice.status = "verified";
      slice.updated_at = new Date().toISOString();
      state.active_failure = null;
      state.run_status = "active";
      state.phase = "slice_verified";
      nextAction = `slice ${devTaskId}/${verifyTaskId} is closed; checkpoint, append the next distinct slice, or finalize`;
    } else if (status === "fail") {
      const descriptor = extractFailureDescriptor(resultText, slice.acceptance);
      if (!state.legacy_migrated && !descriptor.explicit_fields_valid) {
        throw new Error("new runs require verifier failure_signature and failed_acceptance fields");
      }
      const normalizedAcceptance = normalizeList(slice.acceptance || []);
      if (!state.legacy_migrated && descriptor.failed_acceptance.some((item) => !normalizedAcceptance.includes(item))) {
        throw new Error("failed_acceptance must exactly match an acceptance criterion from the slice");
      }
      const computedFailureKey = buildFailureKey({
        sliceKey: slice.slice_key,
        failureSignature: descriptor.failure_signature,
        failedAcceptance: descriptor.failed_acceptance,
      });
      if (Number(slice.epoch || 1) === 2 && slice.failure_key && computedFailureKey !== slice.failure_key) {
        throw new Error("reopened slice must retain the predecessor failure_signature and failed_acceptance identity");
      }
      if (repairNumber > 0 && slice.failure_key && computedFailureKey !== slice.failure_key) {
        throw new Error("recheck failure_signature/failed_acceptance changed; verifier must keep the stable failure identity or explicitly start a new slice");
      }
      const digest = await evidenceDigest(resultPath);
      const chain = ensureFailureChain(state, slice, descriptor, {
        facts: descriptor.failure_signature ? [descriptor.failure_signature] : [],
        files: [resultPath],
        digests: [digest],
      });
      if (repairNumber > 0 && repairNumber !== Number(chain.attempts_in_epoch || 0)) {
        throw new Error(`recheck result ${repairNumber} does not match current repair attempt ${chain.attempts_in_epoch}`);
      }
      event = {
        schema: "codex-long-task-failure-event/v1",
        event: repairNumber > 0 ? "attempt_failed" : "verification_failed",
        at: new Date().toISOString(),
        run_id: state.run_id,
        dev_task_id: devTaskId,
        verify_task_id: verifyTaskId,
        slice_key: slice.slice_key,
        failure_key: chain.failure_key,
        epoch: chain.epoch,
        attempt_in_epoch: repairNumber || null,
        attempts_total: chain.attempts_total,
        failure_signature: descriptor.failure_signature,
        failed_acceptance: descriptor.failed_acceptance,
        verification_result: resultPath,
        verification_digest: digest,
        result: "failed",
      };
      if (repairNumber > 0 && Number(chain.attempts_in_epoch || 0) >= MAX_REPAIRS_PER_EPOCH) {
        if (Number(chain.epoch || 1) === 1) {
          chain.status = "exhausted";
          slice.status = "blocked";
          state.run_status = "blocked";
          state.phase = "first_epoch_exhausted";
          nextAction = "run reopen only with a new evidence fact, new in-scope evidence file, new hypothesis, and new approach";
        } else {
          chain.status = "needs_user_decision";
          slice.status = "blocked";
          state.run_status = "needs_user_decision";
          state.phase = "second_epoch_exhausted";
          nextAction = "wait for the user to set a new target; this slice cannot append, repair, or reopen again";
        }
      } else {
        chain.status = "open";
        slice.status = "needs_fix";
        state.run_status = "active";
        state.phase = "verification_failed";
        nextAction = `run codex-long-task-repair.mjs for ${resultPath} with a new hypothesis and approach`;
      }
      chain.updated_at = new Date().toISOString();
      slice.updated_at = chain.updated_at;
      state.active_failure = chain.failure_key;
    } else {
      slice.status = "blocked";
      slice.updated_at = new Date().toISOString();
      state.run_status = "blocked";
      state.phase = "verification_blocked";
      nextAction = `resolve blocker from ${resultPath}`;
    }
    state.active_slice = devTaskId;
    state.next_action = nextAction;

    const nextLedgerText = updateLedgerForClose(ledgerText, {
      devTaskId,
      verifyTaskId,
      status,
      resultName: name,
    });
    const result = {
      ok: true,
      dry_run: options.dryRun === true,
      run_root: runRoot,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      status,
      run_status: state.run_status,
      result: resultPath,
      ledger_changed: nextLedgerText !== ledgerText,
      next_action: nextAction,
    };
    if (options.dryRun === true) return result;
    await persistState(runRoot, "close-slice", state, [
      { relativePath: "03-task-ledger.md", content: nextLedgerText },
      { relativePath: FAILURE_LEDGER_FILE, content: renderFailureEvents(event ? [...events, event] : events) },
    ]);
    return result;
  };

  if (options.dryRun === true) return execute();
  return withRunLock(runRoot, execute);
}

function isCliEntry() {
  return process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
}

if (isCliEntry()) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    closeSlice(options)
      .then((result) => {
        if (options.json) {
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          return;
        }
        process.stdout.write(`status: ${result.status}\n`);
        process.stdout.write(`dev_task_id: ${result.dev_task_id}\n`);
        process.stdout.write(`verify_task_id: ${result.verify_task_id}\n`);
        process.stdout.write(`next_action: ${result.next_action}\n`);
      })
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}

export {
  closeSlice,
  detectResultStatus,
  inferDevTaskIdFromLedger,
  inferVerifyTaskIdFromResultPath,
  normalizeStatus,
  parseArgs,
  updateLedgerForClose,
};
