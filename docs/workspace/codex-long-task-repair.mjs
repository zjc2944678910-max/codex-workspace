#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  FAILURE_LEDGER_FILE,
  MAX_REPAIRS_PER_EPOCH,
  assertRouteLockUnchanged,
  assertRunCanMutate,
  buildAttemptKey,
  buildFailureKey,
  buildSliceKey,
  currentOwnedFileDigest,
  ensureFailureChain,
  evidenceDigest,
  extractFailureDescriptor,
  isPathWithin,
  loadContinuation,
  normalizeList,
  normalizeSemantic,
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
    verifyResult: "",
    repairNumber: "",
    maxRepairs: 3,
    evidence: [],
    expected: [],
    hypothesis: "",
    approach: "",
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
    if (arg === "--verify-result") {
      options.verifyResult = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--repair-number") {
      options.repairNumber = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--max-repairs") {
      options.maxRepairs = Number(String(argv[index + 1] || "").trim());
      index += 1;
      continue;
    }
    if (arg === "--evidence") {
      options.evidence.push(String(argv[index + 1] || "").trim());
      index += 1;
      continue;
    }
    if (arg === "--expected") {
      options.expected.push(String(argv[index + 1] || "").trim());
      index += 1;
      continue;
    }
    if (arg === "--hypothesis") {
      options.hypothesis = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--approach") {
      options.approach = String(argv[index + 1] || "").trim();
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
  node docs/workspace/codex-long-task-repair.mjs --run-root <path> --verify-result <path> [options]

Options:
  --dev-task-id <id>       Explicit development task ID, e.g. T03.
  --verify-task-id <id>    Explicit verification task ID, e.g. T04.
  --repair-number <n>      Explicit repair attempt number. Defaults to next.
  --max-repairs <n>        Compatibility option; the only accepted value is 3.
  --evidence <text>        Repeatable failing evidence override.
  --expected <text>        Repeatable expected behavior line.
  --hypothesis <text>      Normalized cause hypothesis for deduplication.
  --approach <text>        Concrete repair approach for deduplication.
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

function splitMarkdownRow(row = "") {
  const cells = [];
  let current = "";
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === "|" && row[index - 1] !== "\\") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  if (cells[0] === "") cells.shift();
  if (cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function joinMarkdownRow(cells = []) {
  return `| ${cells.join(" | ")} |`;
}

function inferTaskIdFromVerifyResult(verifyResultPath = "") {
  const normalized = String(verifyResultPath || "").replace(/\\/g, "/");
  const match = normalized.match(/\/agents\/(T\d+)\/(?:verify-result|recheck-\d+-result)\.md$/u)
    || normalized.match(/^agents\/(T\d+)\/(?:verify-result|recheck-\d+-result)\.md$/u);
  return match ? match[1] : "";
}

function findLedgerRow(ledgerText = "", taskId = "") {
  validateTaskId(taskId);
  return ledgerText.split(/\r?\n/u).find((line) => {
    if (!line.trim().startsWith("|")) return false;
    const cells = splitMarkdownRow(line);
    return cells[0] === taskId;
  }) || "";
}

function inferDevTaskIdFromLedger(ledgerText = "", verifyTaskId = "") {
  const row = findLedgerRow(ledgerText, verifyTaskId);
  if (!row) throw new Error(`verification task not found in ledger: ${verifyTaskId}`);
  const devFromPath = row.match(/agents\/(T\d+)\/dev-result\.md/u);
  if (devFromPath) return devFromPath[1];
  const devFromNote = row.match(/verifies\s+(T\d+)/u);
  if (devFromNote) return devFromNote[1];
  throw new Error(`could not infer development task from ledger row: ${verifyTaskId}`);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readRequiredFile(targetPath, label) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch {
    throw new Error(`missing ${label}: ${targetPath}`);
  }
}

async function nextRepairNumber(runRoot, devTaskId, options = {}) {
  const devDir = path.join(runRoot, "agents", devTaskId);
  let max = 0;
  try {
    const entries = await fs.readdir(devDir);
    for (const entry of entries) {
      const match = entry.match(/^repair-(\d+)-(brief|result)\.md$/u);
      if (match) max = Math.max(max, Number(match[1]));
    }
  } catch {
    max = 0;
  }
  const expected = max + 1;
  if (options.repairNumber) {
    const parsed = Number(options.repairNumber);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`invalid repair number: ${options.repairNumber}`);
    if (parsed !== expected) throw new Error(`--repair-number must be the next sequential attempt: expected ${expected}, got ${parsed}`);
  }
  return expected;
}

function bulletList(values = [], fallback = "<fill in>") {
  const cleaned = values.map((value) => String(value || "").trim()).filter(Boolean);
  if (cleaned.length === 0) return `- ${fallback}`;
  return cleaned.map((value) => `- ${value}`).join("\n");
}

function failingEvidenceBlock(options = {}, verifyResultText = "") {
  const cleaned = (options.evidence || []).map((value) => String(value || "").trim()).filter(Boolean);
  if (cleaned.length > 0) return bulletList(cleaned);
  const trimmed = String(verifyResultText || "").trim();
  if (!trimmed) return "<Paste the smallest exact failing evidence here.>";
  return `\`\`\`text\n${trimmed}\n\`\`\``;
}

function buildRepairBrief(runRoot, options = {}, ids = {}, verifyResultText = "") {
  const { devTaskId, verifyTaskId, repairNumber, verifyResultPath } = ids;
  const runPath = (...segments) => path.join(runRoot, ...segments);
  return `# Repair Brief

## Role

model_worker_delegate

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}
- Original development result: ${runPath("agents", devTaskId, "dev-result.md")}
- Failing verification result: ${verifyResultPath}

## Codex Verifier/Review Findings

Refer to the failing verification result for the exact Codex verifier/review findings:
${verifyResultPath}

## Failing Evidence

${failingEvidenceBlock(options, verifyResultText)}

## Expected Behavior

${bulletList(options.expected, "<describe expected behavior>")}

## Hypothesis

${String(options.hypothesis || "").trim() || "Verifier-guided cause hypothesis derived from the stable failure signature."}

## Approach

${String(options.approach || "").trim() || "Make the smallest change that resolves the failed acceptance criterion."}

## Constraints

- Fix only the Codex verifier/review findings and failing evidence listed above.
- Repair executor: model worker (model_worker_delegate). This is the
  default; Codex must not direct-patch L0/L1 implementation defects unless a
  bypass reason applies (tiny mechanical fix, worker unavailable, L2/L3/deploy
  issue, explicit user request).
- If Codex bypasses worker repair, the final output must include why_no_worker.
- If the role is model_worker_delegate, follow WORKER.md.
- Preserve the prior implementation unless a finding directly contradicts it.
- Do not broaden scope, refactor, or clean up unrelated code.
- Prefer the same files changed in the original development attempt.
- Do not start a refactor.
- Stop after this repair if the fix would exceed the original task slice.
- Keep output compact.
- Do not paste long source excerpts, full diffs, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Write

- Product/project code changes needed for the repair.
- ${runPath("agents", devTaskId, `repair-${repairNumber}-result.md`)}

## Return

result: ${runPath("agents", devTaskId, `repair-${repairNumber}-result.md`)}
status: implemented | blocked
changed_files: <comma-separated paths>
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>

## Recheck

After repair, send the result back to verifier task ${verifyTaskId}.
`;
}

function appendNote(note = "", addition = "") {
  const cleanNote = String(note || "").trim();
  if (!cleanNote) return addition;
  if (cleanNote.includes(addition)) return cleanNote;
  return `${cleanNote}; ${addition}`;
}

function updateLedgerForRepair(ledgerText = "", ids = {}) {
  const { devTaskId, verifyTaskId, repairNumber } = ids;
  let foundDev = false;
  let foundVerify = false;
  const lines = ledgerText.split(/\r?\n/u).map((line) => {
    if (!line.trim().startsWith("|")) return line;
    const cells = splitMarkdownRow(line);
    if (cells.length < 8) return line;
    if (cells[0] === devTaskId) {
      foundDev = true;
      cells[1] = "needs_fix";
      const retries = Number(cells[6]);
      cells[6] = String(Number.isFinite(retries) ? retries + 1 : 1);
      cells[7] = appendNote(cells[7], `repair-${repairNumber} requested`);
      return joinMarkdownRow(cells);
    }
    if (cells[0] === verifyTaskId) {
      foundVerify = true;
      cells[1] = "blocked";
      cells[7] = appendNote(cells[7], `failed; repair-${repairNumber} requested for ${devTaskId}`);
      return joinMarkdownRow(cells);
    }
    return line;
  });
  if (!foundDev) throw new Error(`development task not found in ledger: ${devTaskId}`);
  if (!foundVerify) throw new Error(`verification task not found in ledger: ${verifyTaskId}`);
  return lines.join("\n");
}

function resolveVerifyResultPath(runRoot, options = {}) {
  if (options.verifyResult) {
    return path.isAbsolute(options.verifyResult)
      ? options.verifyResult
      : path.resolve(options.verifyResult);
  }
  if (options.verifyTaskId) {
    validateTaskId(options.verifyTaskId);
    return path.join(runRoot, "agents", options.verifyTaskId, "verify-result.md");
  }
  throw new Error("--verify-result or --verify-task-id is required");
}

function isFailedVerification(resultText = "") {
  const statusLine = String(resultText || "").match(/^status\s*:\s*([a-z_ -]+)/imu)?.[1] || "";
  const statusSection = String(resultText || "").match(/^##\s+Status\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+|\s*$)/imu)?.[1] || "";
  if (statusLine || statusSection) return /\bfail(?:ed|ure)?\b/iu.test(`${statusLine}\n${statusSection}`);
  return /^\s*(?:fail|failed|failure)\s*$/imu.test(String(resultText || ""));
}

async function createRepair(options = {}) {
  const runRoot = normalizeRunRoot(options.runRoot);
  const requestedMaxRepairs = options.maxRepairs === undefined ? MAX_REPAIRS_PER_EPOCH : Number(options.maxRepairs);
  if (requestedMaxRepairs !== MAX_REPAIRS_PER_EPOCH) {
    throw new Error(`--max-repairs is fixed at ${MAX_REPAIRS_PER_EPOCH}`);
  }
  const execute = async () => {
    if (options.dryRun !== true) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: options.dryRun !== true });
    const state = structuredClone(loaded.state);
    assertRunCanMutate(state, "repair");
    await assertRouteLockUnchanged(state);

    const ledgerPath = path.join(runRoot, "03-task-ledger.md");
    const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
    const verifyResultPath = resolveVerifyResultPath(runRoot, options);
    if (!isPathWithin(verifyResultPath, runRoot)) throw new Error(`verification result is outside the run: ${verifyResultPath}`);
    const verifyResultText = await readRequiredFile(verifyResultPath, "verification result");
    if (!isFailedVerification(verifyResultText)) throw new Error("repair requires a verifier result with status: fail");
    const verifyTaskId = options.verifyTaskId || inferTaskIdFromVerifyResult(verifyResultPath);
    if (!verifyTaskId) throw new Error("could not infer verification task id; pass --verify-task-id");
    validateTaskId(verifyTaskId);
    const devTaskId = options.devTaskId || inferDevTaskIdFromLedger(ledgerText, verifyTaskId);
    validateTaskId(devTaskId);
    const repairNumber = await nextRepairNumber(runRoot, devTaskId, options);
    if (repairNumber > MAX_REPAIRS_PER_EPOCH) {
      throw new Error(`repair limit exceeded for ${devTaskId}: ${repairNumber} > ${MAX_REPAIRS_PER_EPOCH}`);
    }

    let sliceState = state.slices?.[devTaskId];
    if (!sliceState) {
      const devBrief = await readRequiredFile(path.join(runRoot, "agents", devTaskId, "dev-brief.md"), "development brief");
      const task = devBrief.match(/^##\s+Task\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+)/imu)?.[1]?.trim() || `legacy slice ${devTaskId}`;
      const owned = [...devBrief.matchAll(/^[-*]\s+(.+)$/gmu)].map((match) => match[1].trim()).filter((value) => !value.startsWith("<"));
      const acceptanceSection = devBrief.match(/^##\s+Acceptance Criteria\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+)/imu)?.[1] || "";
      const acceptance = [...acceptanceSection.matchAll(/^[-*]\s+(.+)$/gmu)].map((match) => match[1].trim());
      sliceState = {
        dev_task_id: devTaskId,
        verify_task_id: verifyTaskId,
        slice_key: buildSliceKey({ projectRoot: state.project_root, workspaceRoot: state.workspace_root, scope: task, owned, acceptance }),
        scope: task,
        owned,
        acceptance,
        epoch: 1,
        status: "needs_fix",
        legacy_reconstructed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.slices[devTaskId] = sliceState;
    }
    if (sliceState.verify_task_id !== verifyTaskId) throw new Error(`verification task ${verifyTaskId} does not belong to slice ${devTaskId}`);

    const existingChain = sliceState.failure_key ? state.failure_chains?.[sliceState.failure_key] : null;
    const ingestInitialFailure = !state.legacy_migrated && sliceState.status === "pending" && !existingChain;
    const closedFailureReady = sliceState.status === "needs_fix" && existingChain?.status === "open";
    if (!state.legacy_migrated && !ingestInitialFailure && !closedFailureReady) {
      throw new Error("repair requires a current initial verifier failure or a closed needs_fix failure chain");
    }
    if (existingChain && ["attempt_pending", "verifying"].includes(existingChain.status)) {
      throw new Error(`repair is not allowed while failure chain is ${existingChain.status}`);
    }
    if (["verified", "done", "deferred", "superseded"].includes(sliceState.status)) {
      throw new Error(`repair is not allowed for ${sliceState.status} slice ${devTaskId}`);
    }
    const expectedVerificationPath = existingChain && Number(existingChain.attempts_in_epoch || 0) > 0
      ? path.join(runRoot, "agents", verifyTaskId, `recheck-${existingChain.attempts_in_epoch}-result.md`)
      : path.join(runRoot, "agents", verifyTaskId, "verify-result.md");
    if (path.resolve(verifyResultPath) !== path.resolve(expectedVerificationPath)) {
      throw new Error(`repair requires the current failing verifier result: ${expectedVerificationPath}`);
    }

    const descriptor = extractFailureDescriptor(verifyResultText, sliceState.acceptance);
    if (!state.legacy_migrated && !descriptor.explicit_fields_valid) {
      throw new Error("new runs require verifier failure_signature and failed_acceptance fields");
    }
    const normalizedAcceptance = normalizeList(sliceState.acceptance || []);
    if (!state.legacy_migrated && descriptor.failed_acceptance.some((item) => !normalizedAcceptance.includes(item))) {
      throw new Error("failed_acceptance must exactly match an acceptance criterion from the slice");
    }
    const descriptorFailureKey = buildFailureKey({
      sliceKey: sliceState.slice_key,
      failureSignature: descriptor.failure_signature,
      failedAcceptance: descriptor.failed_acceptance,
    });
    if (Number(sliceState.epoch || 1) === 2 && sliceState.failure_key && descriptorFailureKey !== sliceState.failure_key) {
      throw new Error("reopened slice must retain the predecessor failure_signature and failed_acceptance identity");
    }
    const resultDigest = await evidenceDigest(verifyResultPath);
    const chain = ensureFailureChain(state, sliceState, descriptor, {
      facts: descriptor.failure_signature ? [descriptor.failure_signature] : [],
      files: [verifyResultPath],
      digests: [resultDigest],
    });
    if (state.legacy_migrated && Number(chain.attempts_in_epoch || 0) === 0 && repairNumber > 1) {
      chain.attempts_in_epoch = repairNumber - 1;
      chain.attempts_total = Math.max(Number(chain.attempts_total || 0), repairNumber - 1);
      chain.status = "open";
      chain.legacy_attempts_reconstructed = true;
    }
    if (chain.status === "exhausted" || Number(chain.attempts_in_epoch || 0) >= MAX_REPAIRS_PER_EPOCH) {
      throw new Error(`repair epoch ${chain.epoch} is exhausted for ${devTaskId}`);
    }
    if (repairNumber !== Number(chain.attempts_in_epoch || 0) + 1) {
      throw new Error(`repair state conflict for ${devTaskId}: expected attempt ${Number(chain.attempts_in_epoch || 0) + 1}, got ${repairNumber}`);
    }

    const hypothesis = normalizeSemantic(options.hypothesis || "verifier-guided cause hypothesis derived from the stable failure signature");
    const approach = normalizeSemantic(options.approach || "make the smallest change that resolves the failed acceptance criterion");
    const attemptKey = buildAttemptKey({
      failureKey: chain.failure_key,
      hypothesis,
      approach,
      owned: sliceState.owned,
      projectRoot: state.project_root,
      workspaceRoot: state.workspace_root,
    });
    if ((chain.attempt_keys || []).includes(attemptKey)) throw new Error(`duplicate repair attempt rejected: ${attemptKey}`);
    const fileStateDigest = await currentOwnedFileDigest(state, sliceState);
    if ((chain.file_state_digests || []).includes(fileStateDigest)) {
      throw new Error("repair rejected because the unresolved failure has the same owned-file state as a prior attempt");
    }

    const targetRelativePath = path.join("agents", devTaskId, `repair-${repairNumber}-brief.md`);
    const targetPath = path.join(runRoot, targetRelativePath);
    if (await pathExists(targetPath)) throw new Error(`repair brief already exists: ${targetPath}`);

    const ids = { devTaskId, verifyTaskId, repairNumber, verifyResultPath };
    const repairBrief = buildRepairBrief(runRoot, { ...options, hypothesis, approach }, ids, verifyResultText);
    const nextLedgerText = updateLedgerForRepair(ledgerText, ids);
    const events = await readFailureEvents(runRoot);
    const initialFailureEvent = ingestInitialFailure ? {
      schema: "codex-long-task-failure-event/v1",
      event: "verification_failed",
      at: new Date().toISOString(),
      run_id: state.run_id,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      slice_key: sliceState.slice_key,
      failure_key: chain.failure_key,
      epoch: chain.epoch,
      attempt_in_epoch: null,
      attempts_total: chain.attempts_total,
      failure_signature: descriptor.failure_signature,
      failed_acceptance: descriptor.failed_acceptance,
      verification_result: verifyResultPath,
      verification_digest: resultDigest,
      result: "failed",
      ingested_by: "repair",
    } : null;
    const event = {
      schema: "codex-long-task-failure-event/v1",
      event: "attempt_created",
      at: new Date().toISOString(),
      run_id: state.run_id,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      slice_key: sliceState.slice_key,
      failure_key: chain.failure_key,
      attempt_key: attemptKey,
      epoch: chain.epoch,
      attempt_in_epoch: repairNumber,
      attempt_total: Number(chain.attempts_total || 0) + 1,
      failure_signature: descriptor.failure_signature,
      failed_acceptance: descriptor.failed_acceptance,
      hypothesis,
      approach,
      owned_paths: sliceState.owned,
      input_file_state_digest: fileStateDigest,
      verification_result: verifyResultPath,
      verification_digest: resultDigest,
      result: "pending",
      forbidden_repeat: { attempt_key: attemptKey, file_state_digest: fileStateDigest },
    };
    chain.attempts_in_epoch = repairNumber;
    chain.attempts_total = Number(chain.attempts_total || 0) + 1;
    chain.attempt_keys = [...(chain.attempt_keys || []), attemptKey];
    chain.file_state_digests = [...(chain.file_state_digests || []), fileStateDigest];
    chain.hypotheses = normalizeList([...(chain.hypotheses || []), hypothesis]);
    chain.approaches = normalizeList([...(chain.approaches || []), approach]);
    chain.status = "attempt_pending";
    chain.updated_at = new Date().toISOString();
    sliceState.status = "repairing";
    sliceState.failure_key = chain.failure_key;
    sliceState.updated_at = new Date().toISOString();
    state.active_slice = devTaskId;
    state.active_failure = chain.failure_key;
    state.run_status = "active";
    state.phase = "repair_ready";
    state.next_action = `send ${targetPath} back to model_worker_delegate (same model worker if resumable) for ${devTaskId}`;

    const result = {
      ok: true,
      dry_run: options.dryRun === true,
      run_root: runRoot,
      dev_task_id: devTaskId,
      verify_task_id: verifyTaskId,
      repair_number: repairNumber,
      epoch: chain.epoch,
      failure_key: chain.failure_key,
      attempt_key: attemptKey,
      file: targetRelativePath,
      next_action: state.next_action,
    };
    if (options.dryRun === true) return { ...result, ledger_changed: nextLedgerText !== ledgerText };

    await persistState(runRoot, "create-repair", state, [
      { relativePath: targetRelativePath, content: repairBrief },
      { relativePath: "03-task-ledger.md", content: nextLedgerText },
      { relativePath: FAILURE_LEDGER_FILE, content: renderFailureEvents([...events, ...(initialFailureEvent ? [initialFailureEvent] : []), event]) },
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
    createRepair(options)
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
  buildRepairBrief,
  createRepair,
  inferDevTaskIdFromLedger,
  inferTaskIdFromVerifyResult,
  parseArgs,
  splitMarkdownRow,
  updateLedgerForRepair,
};
