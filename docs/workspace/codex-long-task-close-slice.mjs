#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { splitMarkdownRow } from "./codex-long-task-repair.mjs";

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
  const ledgerPath = path.join(runRoot, "03-task-ledger.md");
  const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
  const resultPath = resolveResultPath(options);
  const resultText = await readRequiredFile(resultPath, "verification result");
  const verifyTaskId = options.verifyTaskId || inferVerifyTaskIdFromResultPath(resultPath);
  if (!verifyTaskId) throw new Error("could not infer verifier task id; pass --verify-task-id");
  validateTaskId(verifyTaskId);
  const devTaskId = options.devTaskId || inferDevTaskIdFromLedger(ledgerText, verifyTaskId);
  validateTaskId(devTaskId);
  const status = detectResultStatus(resultText, options.status);
  const name = resultLabel(resultPath);
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
    result: resultPath,
    ledger_changed: nextLedgerText !== ledgerText,
    next_action: status === "pass"
      ? `slice ${devTaskId}/${verifyTaskId} is closed`
      : status === "fail"
        ? `run codex-long-task-repair.mjs for ${path.join(runRoot, "agents", verifyTaskId, "verify-result.md")} or the failing recheck result`
        : `resolve blocker from ${resultPath}`,
  };

  if (options.dryRun === true) return result;
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
