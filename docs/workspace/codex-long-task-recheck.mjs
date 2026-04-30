#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { splitMarkdownRow } from "./codex-long-task-repair.mjs";

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

## Write

- ${runPath("agents", verifyTaskId, `recheck-${repairNumber}-result.md`)}

## Return

result: ${runPath("agents", verifyTaskId, `recheck-${repairNumber}-result.md`)}
status: pass | fail | blocked
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
  const ledgerPath = path.join(runRoot, "03-task-ledger.md");
  const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
  const repairResultPath = resolveRepairResultPath(runRoot, options);
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

  const ids = { devTaskId, verifyTaskId, repairNumber, repairResultPath };
  const recheckBrief = buildRecheckBrief(runRoot, ids, repairResultText);
  const nextLedgerText = updateLedgerForRecheck(ledgerText, ids);
  const result = {
    ok: true,
    dry_run: options.dryRun === true,
    run_root: runRoot,
    dev_task_id: devTaskId,
    verify_task_id: verifyTaskId,
    repair_number: repairNumber,
    file: targetRelativePath,
    next_action: `send ${targetPath} back to the same verifier for ${verifyTaskId}`,
  };

  if (options.dryRun === true) return {
    ...result,
    ledger_changed: nextLedgerText !== ledgerText,
  };

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, recheckBrief, "utf8");
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
