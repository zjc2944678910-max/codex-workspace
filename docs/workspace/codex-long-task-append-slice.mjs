#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  assertRouteLockUnchanged,
  assertRunCanMutate,
  buildSliceKey,
  loadContinuation,
  persistState,
  readProjectIndex,
  recoverPendingTransaction,
  withRunLock,
} from "./codex-long-task-state.mjs";

function parseArgs(argv = []) {
  const options = {
    runRoot: "",
    scope: "",
    devAgent: "model_worker_delegate",
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
  --dev-agent <name>       model_worker_delegate (default), refactor_worker, or surgical_fixer.
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
  const devAgent = String(options.devAgent || "model_worker_delegate").trim() || "model_worker_delegate";
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
- If the role is model_worker_delegate, follow WORKER.md.
- Do not refactor unless the role is refactor_worker.
- Preserve public behavior unless the acceptance criteria says otherwise.
- Stop and report if the required change exceeds this slice.
- Keep output compact.
- Do not paste long source excerpts, full diffs, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Acceptance Criteria

${bulletList(options.acceptance, "<criterion>")}

## Write

- Product/project code changes in the assigned write set.
- ${runPath("agents", devTaskId, "dev-result.md")}

## Return

result: ${runPath("agents", devTaskId, "dev-result.md")}
status: implemented | blocked
changed_files: <comma-separated paths>
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`;

  const verifyBrief = `# Verification Brief

## Role

verifier

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}
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
- Keep output compact.
- Do not paste long source excerpts, full logs, or unrelated output.
- Return evidence pointers instead of pasted context when possible.

## Write

- ${runPath("agents", verifyTaskId, "verify-result.md")}

## Return

result: ${runPath("agents", verifyTaskId, "verify-result.md")}
status: pass | fail | blocked
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
failure_signature: <stable normalized failure identity; required when status is fail>
failed_acceptance: <exact failed acceptance criterion; repeat this line when more than one fails>
risks: <residual risks or empty>
followups: <optional next steps or empty>
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
  const execute = async () => {
    if (options.dryRun !== true) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: options.dryRun !== true });
    const state = structuredClone(loaded.state);
    if (!options._reopen) assertRunCanMutate(state, "append");
    await assertRouteLockUnchanged(state);

    if (!options._reopen && state.run_status === "blocked") {
      throw new Error("run is blocked; use reopen with new evidence, hypothesis, and approach");
    }
    const ledgerPath = path.join(runRoot, "03-task-ledger.md");
    const ledgerText = await readRequiredFile(ledgerPath, "task ledger");
    const taskIds = resolveTaskIds(ledgerText, options);
    const slice = buildSliceFiles(runRoot, options, taskIds);
    const sliceKey = buildSliceKey({
      projectRoot: state.project_root,
      workspaceRoot: state.workspace_root,
      scope: options.scope,
      owned: options.owned,
      acceptance: options.acceptance,
    });

    const targetFiles = [...slice.files.keys()].map((relativePath) => path.join(runRoot, relativePath));
    const existingFiles = [];
    for (const targetPath of targetFiles) {
      if (await pathExists(targetPath)) existingFiles.push(targetPath);
    }
    if (existingFiles.length > 0) throw new Error(`target files already exist: ${existingFiles.join(", ")}`);

    const prior = state.active_slice ? state.slices?.[state.active_slice] : null;
    if (!options._reopen && prior && !["verified", "done", "deferred", "superseded"].includes(prior.status)) {
      throw new Error(`active slice ${prior.dev_task_id} is ${prior.status}; close or checkpoint it before append`);
    }
    const localDuplicate = Object.values(state.slices || {}).find((item) => item.slice_key === sliceKey);
    if (localDuplicate && !options._reopen) {
      throw new Error(`duplicate slice rejected: ${localDuplicate.dev_task_id} has the same normalized scope, ownership, and acceptance`);
    }
    if (!options._reopen) {
      const { index } = await readProjectIndex({
        workspaceRoot: state.workspace_root,
        project: state.project,
        shared: state.shared,
      });
      const crossRun = index.runs.find((record) => record.run_root !== runRoot
        && (record.slices || []).some((item) => item.slice_key === sliceKey && !["verified", "done", "deferred", "superseded"].includes(item.status)));
      if (crossRun) throw new Error(`duplicate unresolved slice exists in another run: ${crossRun.run_root}`);
    }

    const nextAction = `send ${path.join(runRoot, "agents", taskIds.devTaskId, "dev-brief.md")} to ${options.devAgent || "model_worker_delegate"}${(options.devAgent || "model_worker_delegate") === "model_worker_delegate" ? " (model worker)" : ""}`;
    const epoch = options._reopen ? 2 : 1;
    const sliceState = {
      dev_task_id: taskIds.devTaskId,
      verify_task_id: taskIds.verifyTaskId,
      slice_key: sliceKey,
      scope: String(options.scope || "").trim(),
      owned: [...(options.owned || [])],
      acceptance: [...(options.acceptance || [])],
      epoch,
      status: "pending",
      predecessor_slice: options._reopen?.predecessorSlice || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.slices[taskIds.devTaskId] = sliceState;
    state.active_slice = taskIds.devTaskId;
    state.run_status = "active";
    state.phase = options._reopen ? "reopened_slice_ready" : "slice_ready";
    state.next_action = nextAction;

    if (options._reopen) {
      const chain = state.failure_chains?.[options._reopen.failureKey];
      if (!chain) throw new Error(`reopen failure chain not found: ${options._reopen.failureKey}`);
      chain.epoch = 2;
      chain.attempts_in_epoch = 0;
      chain.status = "open";
      chain.successor_slice = taskIds.devTaskId;
      chain.evidence_facts = [...new Set([...(chain.evidence_facts || []), ...options._reopen.evidenceFacts])].sort();
      chain.evidence_files = [...new Set([...(chain.evidence_files || []), ...options._reopen.evidenceFiles.map((item) => item.path)])].sort();
      chain.evidence_digests = [...new Set([...(chain.evidence_digests || []), ...options._reopen.evidenceFiles.map((item) => item.digest)])].sort();
      chain.hypotheses = [...new Set([...(chain.hypotheses || []), options._reopen.hypothesis])].sort();
      chain.approaches = [...new Set([...(chain.approaches || []), options._reopen.approach])].sort();
      chain.updated_at = new Date().toISOString();
      sliceState.failure_key = chain.failure_key;
      state.active_failure = chain.failure_key;
      const predecessor = state.slices[options._reopen.predecessorSlice];
      if (predecessor) predecessor.status = "superseded";
    }

    const nextLedgerText = `${ledgerText.trimEnd()}\n${slice.ledgerRows.join("\n")}\n`;
    const result = {
      ok: true,
      dry_run: options.dryRun === true,
      run_root: runRoot,
      dev_task_id: taskIds.devTaskId,
      verify_task_id: taskIds.verifyTaskId,
      slice_key: sliceKey,
      epoch,
      files: [...slice.files.keys()],
      ledger_rows: slice.ledgerRows,
      next_action: nextAction,
    };
    if (options.dryRun === true) return result;

    await persistState(runRoot, options._reopen ? "reopen-slice" : "append-slice", state, [
      ...[...slice.files.entries()].map(([relativePath, content]) => ({ relativePath, content })),
      { relativePath: "03-task-ledger.md", content: nextLedgerText },
    ]);
    return result;
  };

  if (options.dryRun === true || options._lockHeld === true) return execute();
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
