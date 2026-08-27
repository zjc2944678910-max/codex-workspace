#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { splitMarkdownRow } from "./codex-long-task-repair.mjs";
import {
  FAILURE_LEDGER_FILE,
  assertRouteLockUnchanged,
  assertRunCanMutate,
  currentOwnedFileDigest,
  isPathWithin,
  loadContinuation,
  persistState,
  readFailureEvents,
  recoverPendingTransaction,
  renderFailureEvents,
  withRunLock,
} from "./codex-long-task-state.mjs";

function parseArgs(argv = []) {
  const options = {
    runRoot: "",
    devTaskId: "",
    verifyTaskId: "",
    repairNumber: "",
    repairResult: "",
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
    if (arg === "--repair-number") {
      options.repairNumber = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--repair-result") {
      options.repairResult = String(argv[index + 1] || "").trim();
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
  node docs/workspace/codex-long-task-recheck.mjs --run-root <path> --repair-result <path> [options]

Options:
  --dev-task-id <id>       Explicit development task ID, e.g. T03.
  --verify-task-id <id>    Explicit verifier task ID, e.g. T04.
  --repair-number <n>      Explicit repair attempt number.
  --dry-run                Print planned file and ledger changes without writing.
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

function inferDevTaskIdFromRepairResult(repairResultPath = "") {
  const normalized = String(repairResultPath || "").replace(/\\/g, "/");
  const match = normalized.match(/\/agents\/(T\d+)\/repair-\d+-result\.md$/u) || normalized.match(/^agents\/(T\d+)\/repair-\d+-result\.md$/u);
  return match ? match[1] : "";
}

function inferRepairNumberFromRepairResult(repairResultPath = "") {
  const normalized = String(repairResultPath || "").replace(/\\/g, "/");
  const match = normalized.match(/\/repair-(\d+)-result\.md$/u) || normalized.match(/^repair-(\d+)-result\.md$/u);
  return match ? Number(match[1]) : 0;
}

function inferVerifyTaskIdFromLedger(ledgerText = "", devTaskId = "") {
  validateTaskId(devTaskId);
  for (const line of ledgerText.split(/\r?\n/u)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) continue;
    const [taskId, , agent, , inputs, , , notes] = cells;
    if (agent !== "verifier") continue;
    if (inputs.includes(`agents/${devTaskId}/dev-result.md`) || notes.includes(`verifies ${devTaskId}`)) return taskId;
  }
  throw new Error(`could not infer verifier task for ${devTaskId}`);
}

async function readRequiredFile(targetPath, label) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch {
    throw new Error(`missing ${label}: ${targetPath}`);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveRepairResultPath(runRoot, options = {}) {
  if (options.repairResult) {
    return path.isAbsolute(options.repairResult)
      ? options.repairResult
      : path.resolve(options.repairResult);
  }
  if (options.devTaskId && options.repairNumber) {
    validateTaskId(options.devTaskId);
    const repairNumber = Number(options.repairNumber);
    if (!Number.isInteger(repairNumber) || repairNumber < 1) throw new Error(`invalid repair number: ${options.repairNumber}`);
    return path.join(runRoot, "agents", options.devTaskId, `repair-${repairNumber}-result.md`);
  }
  throw new Error("--repair-result or --dev-task-id plus --repair-number is required");
}

function buildRecheckBrief(runRoot, ids = {}, repairResultText = "") {
  const { devTaskId, verifyTaskId, repairNumber, repairResultPath } = ids;
  const runPath = (...segments) => path.join(runRoot, ...segments);
  return `# Recheck Brief

## Role

verifier

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}
- Original development result: ${runPath("agents", devTaskId, "dev-result.md")}
- Original verification result: ${runPath("agents", verifyTaskId, "verify-result.md")}
- Repair result: ${repairResultPath}

## Task

Recheck repair-${repairNumber} for development task ${devTaskId}.

Confirm the original failing evidence is resolved and run the smallest useful
checks needed for the acceptance criteria.

## Repair Summary

\`\`\`text
${String(repairResultText || "").trim() || "(repair result was empty)"}
\`\`\`

## Constraints

- Verify, do not redesign.
- Do not make product code changes unless explicitly asked for a test-only fix.
- Report exact commands and outcomes.
- Separate confirmed failures from suspected failures.
- Keep output compact.
- Do not paste long source excerpts, full logs, or unrelated output.
- Return evidence pointers instead of pasted context when possible.

## Write

- ${runPath("agents", verifyTaskId, `recheck-${repairNumber}-result.md`)}

## Return

result: ${runPath("agents", verifyTaskId, `recheck-${repairNumber}-result.md`)}
status: pass | fail | blocked
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
failure_signature: <stable normalized failure identity; required when status is fail>
failed_acceptance: <exact failed acceptance criterion; repeat this line when more than one fails>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`;
}

function updateLedgerForRecheck(ledgerText = "", ids = {}) {
  const { devTaskId, verifyTaskId, repairNumber } = ids;
  let foundDev = false;
  let foundVerify = false;
  const lines = ledgerText.split(/\r?\n/u).map((line) => {
    if (!line.trim().startsWith("|")) return line;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) return line;
    if (cells[0] === devTaskId) {
      foundDev = true;
      cells[1] = "verifying";
      cells[7] = appendNote(cells[7], `repair-${repairNumber} submitted for recheck`);
      return joinMarkdownRow(cells);
    }
    if (cells[0] === verifyTaskId) {
      foundVerify = true;
      cells[1] = "verifying";
      cells[7] = appendNote(cells[7], `recheck-${repairNumber} requested`);
      return joinMarkdownRow(cells);
    }
    return line;
  });
  if (!foundDev) throw new Error(`development task not found in ledger: ${devTaskId}`);
  if (!foundVerify) throw new Error(`verification task not found in ledger: ${verifyTaskId}`);
  return lines.join("\n");
}

async function createRecheck(options = {}) {
  const runRoot = normalizeRunRoot(options.runRoot);
  const execute = async () => {
    if (options.dryRun !== true) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: options.dryRun !== true });
    const state = structuredClone(loaded.state);
    assertRunCanMutate(state, "recheck");
    await assertRouteLockUnchanged(state);

    const ledgerPath = path.join(runRoot, "03-task-ledger.md");
    const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
    const repairResultPath = resolveRepairResultPath(runRoot, options);
    if (!isPathWithin(repairResultPath, runRoot)) throw new Error(`repair result is outside the run: ${repairResultPath}`);
    const repairResultText = await readRequiredFile(repairResultPath, "repair result");
    const devTaskId = options.devTaskId || inferDevTaskIdFromRepairResult(repairResultPath);
    if (!devTaskId) throw new Error("could not infer development task id; pass --dev-task-id");
    validateTaskId(devTaskId);
    const verifyTaskId = options.verifyTaskId || inferVerifyTaskIdFromLedger(ledgerText, devTaskId);
    validateTaskId(verifyTaskId);
    const repairNumber = options.repairNumber ? Number(options.repairNumber) : inferRepairNumberFromRepairResult(repairResultPath);
    if (!Number.isInteger(repairNumber) || repairNumber < 1) throw new Error("could not infer repair number; pass --repair-number");

    const targetRelativePath = path.join("agents", verifyTaskId, `recheck-${repairNumber}-brief.md`);
    const targetPath = path.join(runRoot, targetRelativePath);
    if (await pathExists(targetPath)) throw new Error(`recheck brief already exists: ${targetPath}`);

    const slice = state.slices?.[devTaskId];
    if (!slice) throw new Error(`continuation conflict: slice ${devTaskId} is missing`);
    if (slice.verify_task_id !== verifyTaskId) throw new Error(`verification task ${verifyTaskId} does not belong to slice ${devTaskId}`);
    const chain = slice.failure_key ? state.failure_chains?.[slice.failure_key] : null;
    if (!chain) throw new Error(`failure chain is missing for slice ${devTaskId}`);
    if (slice.status !== "repairing" || chain.status !== "attempt_pending") {
      throw new Error(`recheck is not allowed while slice/chain is ${slice.status}/${chain.status}`);
    }
    if (Number(chain.attempts_in_epoch || 0) !== repairNumber) {
      throw new Error(`recheck must match the latest repair attempt ${chain.attempts_in_epoch}`);
    }
    const expectedRepairResultPath = path.join(runRoot, "agents", devTaskId, `repair-${repairNumber}-result.md`);
    if (path.resolve(repairResultPath) !== path.resolve(expectedRepairResultPath)) {
      throw new Error(`recheck requires the current repair result: ${expectedRepairResultPath}`);
    }

    const events = await readFailureEvents(runRoot);
    const attempt = [...events].reverse().find((event) => event.event === "attempt_created"
      && event.failure_key === chain.failure_key
      && Number(event.epoch) === Number(chain.epoch)
      && Number(event.attempt_in_epoch) === repairNumber);
    if (!attempt) throw new Error(`failure ledger conflict: repair attempt ${repairNumber} is missing`);
    const outputFileStateDigest = await currentOwnedFileDigest(state, slice);
    let hasConcreteOwnedFile = false;
    for (const owned of slice.owned || []) {
      const target = path.isAbsolute(owned) ? owned : path.resolve(state.project_root || state.workspace_root, owned);
      try {
        const stat = await fs.stat(target);
        if (stat.isFile()) { hasConcreteOwnedFile = true; break; }
      } catch {
        // Some legacy ownership entries name modules rather than concrete files.
      }
    }
    if (hasConcreteOwnedFile && outputFileStateDigest === attempt.input_file_state_digest) {
      throw new Error("recheck rejected because repair left the owned-file state unchanged");
    }

    const ids = { devTaskId, verifyTaskId, repairNumber, repairResultPath };
    const recheckBrief = buildRecheckBrief(runRoot, ids, repairResultText);
    const nextLedgerText = updateLedgerForRecheck(ledgerText, ids);
    const event = {
      schema: "codex-long-task-failure-event/v1",
      event: "repair_submitted",
      at: new Date().toISOString(),
      run_id: state.run_id,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      slice_key: slice.slice_key,
      failure_key: chain.failure_key,
      attempt_key: attempt.attempt_key,
      epoch: chain.epoch,
      attempt_in_epoch: repairNumber,
      input_file_state_digest: attempt.input_file_state_digest,
      output_file_state_digest: outputFileStateDigest,
      owned_files_changed: outputFileStateDigest !== attempt.input_file_state_digest,
      repair_result: repairResultPath,
      result: "pending_recheck",
    };
    chain.status = "verifying";
    chain.updated_at = new Date().toISOString();
    slice.status = "verifying";
    slice.updated_at = new Date().toISOString();
    state.active_slice = devTaskId;
    state.active_failure = chain.failure_key;
    state.phase = "recheck_ready";
    state.next_action = `send ${targetPath} back to the same verifier for ${verifyTaskId}`;
    const result = {
      ok: true,
      dry_run: options.dryRun === true,
      run_root: runRoot,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      repair_number: repairNumber,
      epoch: chain.epoch,
      file: targetRelativePath,
      next_action: state.next_action,
    };

    if (options.dryRun === true) return { ...result, ledger_changed: nextLedgerText !== ledgerText };
    await persistState(runRoot, "create-recheck", state, [
      { relativePath: targetRelativePath, content: recheckBrief },
      { relativePath: "03-task-ledger.md", content: nextLedgerText },
      { relativePath: FAILURE_LEDGER_FILE, content: renderFailureEvents([...events, event]) },
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
    createRecheck(options)
      .then((result) => {
        if (options.json) {
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          return;
        }
        process.stdout.write(`repair_number: ${result.repair_number}\n`);
        process.stdout.write(`file: ${path.join(result.run_root, result.file)}\n`);
        process.stdout.write(`next_action: ${result.next_action}\n`);
      })
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}

export {
  buildRecheckBrief,
  createRecheck,
  inferDevTaskIdFromRepairResult,
  inferRepairNumberFromRepairResult,
  inferVerifyTaskIdFromLedger,
  parseArgs,
  updateLedgerForRecheck,
};
