#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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
  --max-repairs <n>        Maximum repair attempts. Defaults to 3.
  --evidence <text>        Repeatable failing evidence override.
  --expected <text>        Repeatable expected behavior line.
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
  const match = normalized.match(/\/agents\/(T\d+)\/verify-result\.md$/u) || normalized.match(/^agents\/(T\d+)\/verify-result\.md$/u);
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
  if (options.repairNumber) {
    const parsed = Number(options.repairNumber);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`invalid repair number: ${options.repairNumber}`);
    return parsed;
  }
  const devDir = path.join(runRoot, "agents", devTaskId);
  let max = 0;
  try {
    const entries = await fs.readdir(devDir);
    for (const entry of entries) {
      const match = entry.match(/^repair-(\d+)-(brief|result)\.md$/u);
      if (match) max = Math.max(max, Number(match[1]));
    }
  } catch {
    return 1;
  }
  return max + 1;
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

## Write

- Product/project code changes needed for the repair.
- ${runPath("agents", devTaskId, `repair-${repairNumber}-result.md`)}

## Return

result: ${runPath("agents", devTaskId, `repair-${repairNumber}-result.md`)}
status: implemented | blocked
changed_files: <comma-separated paths>
tests_run: <commands or checks actually run>
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

async function createRepair(options = {}) {
  const runRoot = normalizeRunRoot(options.runRoot);
  const ledgerPath = path.join(runRoot, "03-task-ledger.md");
  const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
  const verifyResultPath = resolveVerifyResultPath(runRoot, options);
  const verifyResultText = await readRequiredFile(verifyResultPath, "verification result");
  const verifyTaskId = options.verifyTaskId || inferTaskIdFromVerifyResult(verifyResultPath);
  if (!verifyTaskId) throw new Error("could not infer verification task id; pass --verify-task-id");
  validateTaskId(verifyTaskId);
  const devTaskId = options.devTaskId || inferDevTaskIdFromLedger(ledgerText, verifyTaskId);
  validateTaskId(devTaskId);
  const repairNumber = await nextRepairNumber(runRoot, devTaskId, options);
  const maxRepairs = Number.isInteger(options.maxRepairs) && options.maxRepairs > 0 ? options.maxRepairs : 3;
  if (repairNumber > maxRepairs) throw new Error(`repair limit exceeded for ${devTaskId}: ${repairNumber} > ${maxRepairs}`);

  const targetRelativePath = path.join("agents", devTaskId, `repair-${repairNumber}-brief.md`);
  const targetPath = path.join(runRoot, targetRelativePath);
  if (await pathExists(targetPath)) throw new Error(`repair brief already exists: ${targetPath}`);

  const ids = { devTaskId, verifyTaskId, repairNumber, verifyResultPath };
  const repairBrief = buildRepairBrief(runRoot, options, ids, verifyResultText);
  const nextLedgerText = updateLedgerForRepair(ledgerText, ids);
  const result = {
    ok: true,
    dry_run: options.dryRun === true,
    run_root: runRoot,
    dev_task_id: devTaskId,
    verify_task_id: verifyTaskId,
    repair_number: repairNumber,
    file: targetRelativePath,
    next_action: `send ${targetPath} back to model_worker_delegate (same model worker if resumable) for ${devTaskId}`,
  };

  if (options.dryRun === true) return {
    ...result,
    ledger_changed: nextLedgerText !== ledgerText,
  };

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, repairBrief, "utf8");
  await fs.writeFile(ledgerPath, nextLedgerText, "utf8");
  return result;
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
