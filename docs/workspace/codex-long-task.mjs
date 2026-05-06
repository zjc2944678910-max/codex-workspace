#!/usr/bin/env node

import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { appendSlice, parseArgs as parseAppendArgs } from "./codex-long-task-append-slice.mjs";
import { closeSlice, parseArgs as parseCloseArgs } from "./codex-long-task-close-slice.mjs";
import { createLongTaskRun, parseArgs as parseInitArgs } from "./codex-long-task-init.mjs";
import { createRecheck, parseArgs as parseRecheckArgs } from "./codex-long-task-recheck.mjs";
import { createRepair, parseArgs as parseRepairArgs } from "./codex-long-task-repair.mjs";

const COMMANDS = new Map([
  ["init", { parse: parseInitArgs, run: createLongTaskRun }],
  ["append", { parse: parseAppendArgs, run: appendSlice }],
  ["append-slice", { parse: parseAppendArgs, run: appendSlice }],
  ["repair", { parse: parseRepairArgs, run: createRepair }],
  ["recheck", { parse: parseRecheckArgs, run: createRecheck }],
  ["close", { parse: parseCloseArgs, run: closeSlice }],
  ["close-slice", { parse: parseCloseArgs, run: closeSlice }],
]);

function printHelp() {
  process.stdout.write(`Usage:
  node docs/workspace/codex-long-task.mjs <command> [options]

Commands:
  init          Create a long-task run directory.
  append        Append a development and verification slice.
  repair        Generate a repair brief after verification fails.
  recheck       Generate a verifier recheck brief after repair.
  close         Close a slice from verify/recheck result status.

Examples:
  node docs/workspace/codex-long-task.mjs init --project sample-product --task "Implement feature flag sync"
  node docs/workspace/codex-long-task.mjs append --run-root <run-root> --scope "Implement feature flag sync"
  node docs/workspace/codex-long-task.mjs repair --run-root <run-root> --verify-result <run-root>/agents/T04/verify-result.md
  node docs/workspace/codex-long-task.mjs recheck --run-root <run-root> --repair-result <run-root>/agents/T03/repair-1-result.md
  node docs/workspace/codex-long-task.mjs close --run-root <run-root> --result <run-root>/agents/T04/recheck-1-result.md
`);
}

function normalizeCommand(value = "") {
  return String(value || "").trim().toLowerCase();
}

function parseCommand(argv = []) {
  const [rawCommand, ...rest] = argv;
  const command = normalizeCommand(rawCommand);
  if (!command || command === "--help" || command === "-h" || command === "help") {
    return { help: true, command: "", rest: [] };
  }
  if (!COMMANDS.has(command)) throw new Error(`unknown command: ${rawCommand}`);
  return { help: false, command, rest };
}

async function dispatchLongTask(argv = []) {
  const parsed = parseCommand(argv);
  if (parsed.help) return { ok: true, help: true };

  const entry = COMMANDS.get(parsed.command);
  const options = entry.parse(parsed.rest);
  if (options.help) return { ok: true, help: true, command: parsed.command };

  const result = await entry.run(options);
  return {
    command: parsed.command,
    options,
    result,
  };
}

function printResult(payload = {}) {
  const { command, options = {}, result = {} } = payload;
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === "init") {
    process.stdout.write(`run_root: ${result.run_root}\n`);
    process.stdout.write(`files: ${(result.files || []).length}\n`);
    return;
  }
  if (command === "append" || command === "append-slice") {
    process.stdout.write(`dev_task_id: ${result.dev_task_id}\n`);
    process.stdout.write(`verify_task_id: ${result.verify_task_id}\n`);
    process.stdout.write(`next_action: ${result.next_action}\n`);
    return;
  }
  if (command === "repair" || command === "recheck") {
    process.stdout.write(`repair_number: ${result.repair_number}\n`);
    process.stdout.write(`file: ${path.join(result.run_root, result.file)}\n`);
    process.stdout.write(`next_action: ${result.next_action}\n`);
    return;
  }
  if (command === "close" || command === "close-slice") {
    process.stdout.write(`status: ${result.status}\n`);
    process.stdout.write(`dev_task_id: ${result.dev_task_id}\n`);
    process.stdout.write(`verify_task_id: ${result.verify_task_id}\n`);
    process.stdout.write(`next_action: ${result.next_action}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function isCliEntry() {
  return process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
}

if (isCliEntry()) {
  dispatchLongTask(process.argv.slice(2))
    .then((payload) => {
      if (payload.help) {
        printHelp();
        return;
      }
      printResult(payload);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

export {
  dispatchLongTask,
  normalizeCommand,
  parseCommand,
};
