#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function parseArgs(argv = []) {
  const options = {
    runRoot: "",
    scope: "",
    devAgent: "claude_codegen_delegate",
    devTaskId: "",
    verifyTaskId: "",
    owned: [],
    acceptance: [],
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
    if (arg === "--scope") {
      options.scope = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--dev-agent") {
      options.devAgent = String(argv[index + 1] || "").trim();
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
    if (arg === "--owned") {
      options.owned.push(String(argv[index + 1] || "").trim());
      index += 1;
      continue;
    }
    if (arg === "--acceptance") {
      options.acceptance.push(String(argv[index + 1] || "").trim());
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
  node docs/workspace/codex-long-task-append-slice.mjs --run-root <path> --scope <slice> [options]

Options:
  --dev-agent <name>       claude_codegen_delegate (default), refactor_worker, or surgical_fixer.
  --dev-task-id <id>       Explicit development task ID, e.g. T03.
  --verify-task-id <id>    Explicit verification task ID, e.g. T04.
  --owned <path/module>    Repeatable owned write scope line.
  --acceptance <criterion> Repeatable acceptance criterion.
  --dry-run                Print planned files and ledger rows without writing.
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

function formatTaskId(number) {
  return `T${String(number).padStart(2, "0")}`;
}

function taskNumber(taskId = "") {
  validateTaskId(taskId);
  return Number(taskId.slice(1));
}

function findNextTaskNumber(ledgerText = "") {
  let max = 0;
  for (const match of ledgerText.matchAll(/\bT(\d+)\b/gu)) {
    max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

function escapeCell(value = "") {
  return String(value || "")
    .replace(/\r?\n/gu, " ")
    .replace(/\|/gu, "\\|")
    .replace(/\s+/gu, " ")
    .trim();
}

function bulletList(values = [], fallback = "<fill in>") {
  const cleaned = values.map((value) => String(value || "").trim()).filter(Boolean);
  if (cleaned.length === 0) return `- ${fallback}`;
  return cleaned.map((value) => `- ${value}`).join("\n");
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
  } catch (error) {
    throw new Error(`missing ${label}: ${targetPath}`);
  }
}

function resolveTaskIds(ledgerText = "", options = {}) {
  if (options.devTaskId) validateTaskId(options.devTaskId);
  if (options.verifyTaskId) validateTaskId(options.verifyTaskId);

  const next = findNextTaskNumber(ledgerText);
  const devTaskId = options.devTaskId || formatTaskId(next);
  const verifyTaskId = options.verifyTaskId || formatTaskId(taskNumber(devTaskId) + 1);
  if (devTaskId === verifyTaskId) throw new Error("development and verification task IDs must differ");
  return { devTaskId, verifyTaskId };
}

function buildSliceFiles(runRoot, options = {}, taskIds = {}) {
  const scope = String(options.scope || "").trim();
  if (!scope) throw new Error("--scope is required");
  const devAgent = String(options.devAgent || "claude_codegen_delegate").trim() || "claude_codegen_delegate";
  const { devTaskId, verifyTaskId } = taskIds;
  const runPath = (...segments) => path.join(runRoot, ...segments);

  const devBrief = `# Development Brief

## Role

${devAgent}

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}
- Mapper result: ${runPath("agents", "T01", "mapper-result.md")}
- Review result: ${runPath("agents", "T02", "review-result.md")}

## Task

${scope}

## Ownership

${bulletList(options.owned, "<explicit write set>")}

## Constraints

- Make the smallest defensible change.
- If the role is claude_codegen_delegate, follow CLAUDE.md.
- Do not refactor unless the role is refactor_worker.
- Preserve public behavior unless the acceptance criteria says otherwise.
- Stop and report if the required change exceeds this slice.

## Acceptance Criteria

${bulletList(options.acceptance, "<criterion>")}

## Write

- Product/project code changes in the assigned write set.
- ${runPath("agents", devTaskId, "dev-result.md")}

## Return

result: ${runPath("agents", devTaskId, "dev-result.md")}
status: implemented | blocked
changed_files: <comma-separated paths>
`;

  const verifyBrief = `# Verification Brief

## Role

verifier

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Development result: ${runPath("agents", devTaskId, "dev-result.md")}

## Task

Verify this implementation slice: ${scope}

## Acceptance Criteria

${bulletList(options.acceptance, "<criterion>")}

## Constraints

- Verify, do not redesign.
- Do not make product code changes unless explicitly asked for a test-only fix.
- Report exact commands and outcomes.
- Separate confirmed failures from suspected failures.

## Write

- ${runPath("agents", verifyTaskId, "verify-result.md")}

## Return

result: ${runPath("agents", verifyTaskId, "verify-result.md")}
status: pass | fail | blocked
`;

  const ledgerRows = [
    `| ${devTaskId} | pending | ${escapeCell(devAgent)} | ${escapeCell(scope)} | 00-request.md, 02-plan.md, agents/T01/mapper-result.md, agents/T02/review-result.md | agents/${devTaskId}/dev-result.md | 0 | implementation slice |`,
    `| ${verifyTaskId} | pending | verifier | verify ${escapeCell(scope)} | agents/${devTaskId}/dev-result.md | agents/${verifyTaskId}/verify-result.md | 0 | verifies ${devTaskId} |`,
  ];

  return {
    files: new Map([
      [path.join("agents", devTaskId, "dev-brief.md"), devBrief],
      [path.join("agents", verifyTaskId, "verify-brief.md"), verifyBrief],
    ]),
    ledgerRows,
  };
}

async function appendSlice(options = {}) {
  const runRoot = normalizeRunRoot(options.runRoot);
  const ledgerPath = path.join(runRoot, "03-task-ledger.md");
  const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
  const taskIds = resolveTaskIds(ledgerText, options);
  const slice = buildSliceFiles(runRoot, options, taskIds);

  const targetFiles = [...slice.files.keys()].map((relativePath) => path.join(runRoot, relativePath));
  const existingFiles = [];
  for (const targetPath of targetFiles) {
    if (await pathExists(targetPath)) existingFiles.push(targetPath);
  }
  if (existingFiles.length > 0) throw new Error(`target files already exist: ${existingFiles.join(", ")}`);

  const result = {
    ok: true,
    dry_run: options.dryRun === true,
    run_root: runRoot,
    dev_task_id: taskIds.devTaskId,
    verify_task_id: taskIds.verifyTaskId,
    files: [...slice.files.keys()],
    ledger_rows: slice.ledgerRows,
    next_action: `send ${path.join(runRoot, "agents", taskIds.devTaskId, "dev-brief.md")} to ${options.devAgent || "claude_codegen_delegate"}${(options.devAgent || "claude_codegen_delegate") === "claude_codegen_delegate" ? " (Claude Code worker)" : ""}`,
  };

  if (options.dryRun === true) return result;

  for (const [relativePath, content] of slice.files.entries()) {
    const targetPath = path.join(runRoot, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, "utf8");
  }
  const nextLedgerText = `${ledgerText.trimEnd()}\n${slice.ledgerRows.join("\n")}\n`;
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
    appendSlice(options)
      .then((result) => {
        if (options.json) {
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          return;
        }
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
  appendSlice,
  buildSliceFiles,
  escapeCell,
  findNextTaskNumber,
  parseArgs,
  resolveTaskIds,
};
