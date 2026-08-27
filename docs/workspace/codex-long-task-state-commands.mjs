import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { appendSlice } from "./codex-long-task-append-slice.mjs";
import {
  ACTIONABLE_RUN_STATUSES,
  OPS_CANDIDATES_FILE,
  assertRouteLockUnchanged,
  assertRunCanMutate,
  isPathWithin,
  loadContinuation,
  normalizeList,
  normalizeSemantic,
  nowIso,
  persistState,
  readProjectIndex,
  recoverPendingTransaction,
  stableHash,
  updateRunIndex,
  validateEvidenceFiles,
  withRunLock,
} from "./codex-long-task-state.mjs";

function nextValue(argv, index, option) {
  const value = String(argv[index + 1] || "").trim();
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

function parseStatusArgs(argv = []) {
  const options = { workspaceRoot: "", project: "", runRoot: "", shared: false, all: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--workspace-root") { options.workspaceRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--project") { options.project = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--run-root") { options.runRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--shared") { options.shared = true; continue; }
    if (arg === "--all") { options.all = true; continue; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--help" || arg === "-h") { options.help = true; continue; }
    throw new Error(`unknown status option: ${arg}`);
  }
  return options;
}

function parseResumeArgs(argv = []) {
  const options = parseStatusArgs(argv);
  delete options.all;
  return options;
}

function parseCheckpointArgs(argv = []) {
  const options = {
    runRoot: "", phase: "", activeSlice: "", nextAction: "", evidenceFiles: [],
    confirmed: [], decisions: [], dryRun: false, json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--run-root") { options.runRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--phase") { options.phase = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--active-slice") { options.activeSlice = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--next-action") { options.nextAction = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--evidence-file") { options.evidenceFiles.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--confirmed") { options.confirmed.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--decision") { options.decisions.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--dry-run") { options.dryRun = true; continue; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--help" || arg === "-h") { options.help = true; continue; }
    throw new Error(`unknown checkpoint option: ${arg}`);
  }
  return options;
}

function parseReopenArgs(argv = []) {
  const options = {
    runRoot: "", evidenceFacts: [], evidenceFiles: [], hypothesis: "", approach: "",
    devAgent: "model_worker_delegate", devTaskId: "", verifyTaskId: "", dryRun: false, json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--run-root") { options.runRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--evidence-fact" || arg === "--new-evidence-fact") { options.evidenceFacts.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--evidence-file" || arg === "--new-evidence-file") { options.evidenceFiles.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--hypothesis") { options.hypothesis = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--approach") { options.approach = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--dev-agent") { options.devAgent = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--dev-task-id") { options.devTaskId = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--verify-task-id") { options.verifyTaskId = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--dry-run") { options.dryRun = true; continue; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--help" || arg === "-h") { options.help = true; continue; }
    throw new Error(`unknown reopen option: ${arg}`);
  }
  return options;
}

function parseOpsCandidateArgs(argv = []) {
  const options = {
    runRoot: "", type: "", target: "", fact: "", evidenceFiles: [], verifiedAt: "",
    durabilityBasis: "", recheckCondition: "", residualRisk: "", dryRun: false, json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--run-root") { options.runRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--type") { options.type = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--target") { options.target = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--fact") { options.fact = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--evidence-file") { options.evidenceFiles.push(nextValue(argv, index, arg)); index += 1; continue; }
    if (arg === "--verified-at") { options.verifiedAt = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--durability-basis") { options.durabilityBasis = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--recheck-condition" || arg === "--recheck-trigger") { options.recheckCondition = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--residual-risk" || arg === "--risk") { options.residualRisk = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--dry-run") { options.dryRun = true; continue; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--help" || arg === "-h") { options.help = true; continue; }
    throw new Error(`unknown ops-candidate option: ${arg}`);
  }
  return options;
}

function parseFinalizeArgs(argv = []) {
  const options = { runRoot: "", status: "completed", nextAction: "", dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--run-root") { options.runRoot = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--status") { options.status = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--next-action") { options.nextAction = nextValue(argv, index, arg); index += 1; continue; }
    if (arg === "--dry-run") { options.dryRun = true; continue; }
    if (arg === "--json") { options.json = true; continue; }
    if (arg === "--help" || arg === "-h") { options.help = true; continue; }
    throw new Error(`unknown finalize option: ${arg}`);
  }
  return options;
}

function summarizeState(state, legacy = false) {
  const slice = state.active_slice ? state.slices?.[state.active_slice] : null;
  const chain = state.active_failure ? state.failure_chains?.[state.active_failure] : null;
  return {
    run_id: state.run_id,
    run_root: state.run_root,
    project: state.project,
    status: state.run_status,
    phase: state.phase,
    active_slice: state.active_slice,
    slice_status: slice?.status || null,
    epoch: chain?.epoch || slice?.epoch || null,
    attempts_in_epoch: chain?.attempts_in_epoch || 0,
    attempts_total: chain?.attempts_total || 0,
    checkpoint_seq: state.checkpoint_seq || 0,
    next_action: state.next_action,
    legacy_state: legacy || state.legacy_migrated === true,
    updated_at: state.updated_at,
  };
}

async function statusLongTasks(options = {}) {
  if (options.runRoot) {
    const loaded = await loadContinuation(path.resolve(options.runRoot));
    return { ok: true, runs: [summarizeState(loaded.state, loaded.legacy)], conflicts: [] };
  }
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  const records = [];
  const conflicts = [];
  if (options.project || options.shared) {
    const project = options.project || "workspace";
    const { index } = await readProjectIndex({ workspaceRoot, project, shared: options.shared || project === "workspace" || project === "shared" });
    records.push(...index.runs);
  } else {
    const stateRoot = path.join(workspaceRoot, "state", "project-data");
    let entries = [];
    try {
      entries = await fs.readdir(stateRoot, { withFileTypes: true });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    for (const entry of entries.filter((item) => item.isDirectory())) {
      const indexPath = path.join(stateRoot, entry.name, "codex-long-tasks", "index.json");
      try {
        const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
        if (!Array.isArray(index.runs)) throw new Error("runs missing");
        records.push(...index.runs);
      } catch (error) {
        if (error?.code !== "ENOENT") conflicts.push({ index: indexPath, reason: `corrupt index: ${error.message}` });
      }
    }
  }
  const filtered = records
    .filter((record) => options.all === true || ACTIONABLE_RUN_STATUSES.has(record.status))
    .sort((left, right) => String(right.updated_at || "").localeCompare(String(left.updated_at || "")));
  return { ok: conflicts.length === 0, runs: filtered, conflicts };
}

async function resolveResumeRunRoot(options = {}) {
  if (options.runRoot) return path.resolve(options.runRoot);
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  if (!options.project && !options.shared) throw new Error("resume requires --run-root or --project");
  const project = options.project || "workspace";
  const { index } = await readProjectIndex({ workspaceRoot, project, shared: options.shared || project === "workspace" || project === "shared" });
  const active = index.runs.filter((run) => ACTIONABLE_RUN_STATUSES.has(run.status));
  if (active.length === 0) throw new Error(`no active run for project ${project}`);
  if (active.length > 1) throw new Error(`multiple active runs for project ${project}; pass --run-root explicitly`);
  return path.resolve(active[0].run_root);
}

async function validateResumeConsistency(state) {
  if (!state.active_slice) return;
  const slice = state.slices?.[state.active_slice];
  if (!slice) throw new Error(`continuation conflict: active slice ${state.active_slice} is missing`);
  const ledger = await fs.readFile(path.join(state.run_root, "03-task-ledger.md"), "utf8");
  for (const taskId of [slice.dev_task_id, slice.verify_task_id]) {
    if (taskId && !new RegExp(`^\\|\\s*${taskId}\\s*\\|`, "mu").test(ledger)) {
      throw new Error(`continuation conflict: ${taskId} is missing from 03-task-ledger.md`);
    }
  }
}

async function resumeLongTask(options = {}) {
  const runRoot = await resolveResumeRunRoot(options);
  return withRunLock(runRoot, async () => {
    const recovery = await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: false });
    const { changed } = await assertRouteLockUnchanged(loaded.state);
    await validateResumeConsistency(loaded.state);
    if (!loaded.legacy) {
      if (changed) await persistState(runRoot, "lock-route-on-resume", loaded.state);
      else await updateRunIndex(loaded.state);
    }
    return {
      ok: true,
      recovered_transaction: recovery.recovered,
      recovered_operation: recovery.operation,
      ...summarizeState(loaded.state, loaded.legacy),
    };
  });
}

async function checkpointLongTask(options = {}) {
  if (!String(options.runRoot || "").trim()) throw new Error("--run-root is required");
  if (!String(options.nextAction || "").trim()) throw new Error("--next-action is required");
  const runRoot = path.resolve(options.runRoot);
  const execute = async () => {
    if (!options.dryRun) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: !options.dryRun });
    const state = structuredClone(loaded.state);
    assertRunCanMutate(state, "checkpoint");
    await assertRouteLockUnchanged(state);
    if (options.activeSlice && !state.slices?.[options.activeSlice]) throw new Error(`unknown active slice: ${options.activeSlice}`);
    const evidenceFiles = options.evidenceFiles || [];
    const evidence = evidenceFiles.length > 0 ? await validateEvidenceFiles(state, evidenceFiles) : [];
    const seq = Number(state.checkpoint_seq || 0) + 1;
    const checkpoint = {
      seq,
      at: nowIso(),
      phase: options.phase || state.phase,
      active_slice: options.activeSlice || state.active_slice,
      next_action: options.nextAction,
      evidence_files: evidence.map((item) => item.path),
      confirmed: normalizeList(options.confirmed || []),
      decisions: normalizeList(options.decisions || []),
    };
    state.checkpoint_seq = seq;
    state.phase = checkpoint.phase;
    state.active_slice = checkpoint.active_slice;
    state.next_action = checkpoint.next_action;
    state.checkpoints = [...(state.checkpoints || []), checkpoint].slice(-50);
    if (!options.dryRun) await persistState(runRoot, "checkpoint", state);
    return { ok: true, dry_run: options.dryRun === true, ...summarizeState(state), checkpoint };
  };
  return options.dryRun ? execute() : withRunLock(runRoot, execute);
}

async function reopenLongTask(options = {}) {
  if (!String(options.runRoot || "").trim()) throw new Error("--run-root is required");
  if (options.evidenceFacts.length === 0) throw new Error("at least one --evidence-fact is required");
  if (!String(options.hypothesis || "").trim()) throw new Error("--hypothesis is required");
  if (!String(options.approach || "").trim()) throw new Error("--approach is required");
  const runRoot = path.resolve(options.runRoot);
  const execute = async () => {
    if (!options.dryRun) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: !options.dryRun });
    const state = structuredClone(loaded.state);
    await assertRouteLockUnchanged(state);
    if (state.run_status !== "blocked") throw new Error(`reopen requires a blocked first epoch; current status is ${state.run_status}`);
    const predecessor = state.active_slice ? state.slices?.[state.active_slice] : null;
    const chain = state.active_failure ? state.failure_chains?.[state.active_failure] : null;
    if (!predecessor || !chain) throw new Error("reopen conflict: blocked slice or failure chain is missing");
    if (Number(chain.epoch || 1) !== 1 || Number(chain.attempts_in_epoch || 0) < 3) {
      throw new Error("reopen is allowed only after the first epoch exhausts all 3 repairs");
    }
    const evidence = await validateEvidenceFiles(state, options.evidenceFiles);
    const normalizedFacts = normalizeList(options.evidenceFacts);
    const newFacts = normalizedFacts.filter((fact) => !(chain.evidence_facts || []).includes(fact));
    const newDigests = evidence.map((item) => item.digest).filter((digest) => !(chain.evidence_digests || []).includes(digest));
    const hypothesis = normalizeSemantic(options.hypothesis);
    const approach = normalizeSemantic(options.approach);
    if (newFacts.length === 0 || newDigests.length === 0) throw new Error("reopen requires a new evidence fact and new evidence file content");
    if ((chain.hypotheses || []).includes(hypothesis)) throw new Error("reopen requires a new hypothesis");
    if ((chain.approaches || []).includes(approach)) throw new Error("reopen requires a new approach");

    return appendSlice({
      runRoot,
      scope: predecessor.scope,
      owned: predecessor.owned || [],
      acceptance: predecessor.acceptance || [],
      devAgent: options.devAgent,
      devTaskId: options.devTaskId,
      verifyTaskId: options.verifyTaskId,
      dryRun: options.dryRun,
      _lockHeld: !options.dryRun,
      _reopen: {
        failureKey: chain.failure_key,
        predecessorSlice: predecessor.dev_task_id,
        evidenceFacts: normalizedFacts,
        evidenceFiles: evidence,
        hypothesis,
        approach,
      },
    });
  };
  return options.dryRun ? execute() : withRunLock(runRoot, execute);
}

function validateOpsTarget(state, target, type) {
  const normalizedType = normalizeSemantic(type).replace(/\s+/gu, "-");
  const allowedTypes = new Set(["readme", "report", "runbook", "architecture", "deployment-ledger"]);
  if (!allowedTypes.has(normalizedType)) throw new Error(`unsupported OPS candidate type: ${type}`);
  const opsRoot = path.resolve(state.workspace_root, state.ops_surface);
  const targetPath = path.isAbsolute(target) ? path.resolve(target) : path.resolve(state.workspace_root, target);
  if (!isPathWithin(targetPath, opsRoot)) throw new Error(`OPS target is outside the Route Lock project OPS surface: ${targetPath}`);
  const perProjectOpsRoot = path.resolve(state.workspace_root, "ops", "projects");
  if (state.shared === true && isPathWithin(targetPath, perProjectOpsRoot)) {
    throw new Error(`shared workspace runs cannot promote into a project OPS surface: ${targetPath}`);
  }
  const basename = path.basename(targetPath).toLowerCase();
  const relative = path.relative(opsRoot, targetPath).replace(/\\/gu, "/").toLowerCase();
  const allowedShape = (normalizedType === "readme" && basename === "readme.md")
    || (normalizedType === "deployment-ledger" && basename === "deployment_ledger.md")
    || (normalizedType === "architecture" && (basename === "architecture_todo.md" || relative.includes("architecture")))
    || (normalizedType === "report" && relative.startsWith("reports/") && basename.endsWith(".md"))
    || (normalizedType === "runbook" && relative.startsWith("runbooks/") && basename.endsWith(".md"));
  if (!allowedShape) throw new Error(`OPS target does not match candidate type ${normalizedType}: ${targetPath}`);
  return { type: normalizedType, targetPath, relative };
}

async function addOpsCandidate(options = {}) {
  if (!String(options.runRoot || "").trim()) throw new Error("--run-root is required");
  for (const [name, value] of [["--type", options.type], ["--target", options.target], ["--fact", options.fact], ["--verified-at", options.verifiedAt], ["--durability-basis", options.durabilityBasis], ["--recheck-condition", options.recheckCondition], ["--residual-risk", options.residualRisk]]) {
    if (!String(value || "").trim()) throw new Error(`${name} is required`);
  }
  if (!Number.isFinite(Date.parse(options.verifiedAt))) throw new Error("--verified-at must be an ISO date/time");
  const runRoot = path.resolve(options.runRoot);
  const execute = async () => {
    if (!options.dryRun) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: !options.dryRun });
    const state = structuredClone(loaded.state);
    assertRunCanMutate(state, "ops-candidate");
    await assertRouteLockUnchanged(state);
    const hasVerifiedSlice = Object.values(state.slices || {}).some((slice) => ["verified", "done"].includes(slice.status));
    if (!hasVerifiedSlice) throw new Error("OPS candidate requires at least one verified slice in this run");
    const target = validateOpsTarget(state, options.target, options.type);
    const evidence = await validateEvidenceFiles(state, options.evidenceFiles);
    const candidate = {
      type: target.type,
      target: path.relative(state.workspace_root, target.targetPath).replace(/\\/gu, "/"),
      fact: String(options.fact).trim(),
      evidence: evidence.map((item) => ({ path: item.path, digest: item.digest })),
      verified_at: new Date(options.verifiedAt).toISOString(),
      durability_basis: String(options.durabilityBasis).trim(),
      durability_review_status: "pending_codex_review",
      recheck_condition: String(options.recheckCondition).trim(),
      residual_risk: String(options.residualRisk).trim(),
    };
    candidate.id = stableHash(candidate).slice(0, 12);
    const candidatePath = path.join(runRoot, OPS_CANDIDATES_FILE);
    const current = await fs.readFile(candidatePath, "utf8").catch(() => "# OPS Promotion Candidates\n\n");
    if (current.includes(`candidate_id: ${candidate.id}`)) throw new Error(`duplicate OPS candidate: ${candidate.id}`);
    const block = `## Candidate ${candidate.id}\n\n- candidate_id: ${candidate.id}\n- type: ${candidate.type}\n- target: ${candidate.target}\n- fact: ${candidate.fact}\n- evidence: ${candidate.evidence.map((item) => `${item.path}#sha256=${item.digest}`).join(", ")}\n- verified_at: ${candidate.verified_at}\n- durability_basis: ${candidate.durability_basis}\n- durability_review_status: ${candidate.durability_review_status}\n- recheck_condition: ${candidate.recheck_condition}\n- residual_risk: ${candidate.residual_risk}\n- promotion_status: pending_codex_review\n\n`;
    const next = `${current.trimEnd()}\n\n${block}`;
    state.ops_candidates = [...(state.ops_candidates || []), candidate];
    state.phase = "ops_candidate_recorded";
    state.next_action = "Codex reviews the candidate before any explicit OPS edit";
    if (!options.dryRun) await persistState(runRoot, "ops-candidate", state, [{ relativePath: OPS_CANDIDATES_FILE, content: next }]);
    return { ok: true, dry_run: options.dryRun === true, run_root: runRoot, candidate_id: candidate.id, file: OPS_CANDIDATES_FILE, target: candidate.target, next_action: state.next_action };
  };
  return options.dryRun ? execute() : withRunLock(runRoot, execute);
}

async function finalizeLongTask(options = {}) {
  if (!String(options.runRoot || "").trim()) throw new Error("--run-root is required");
  const status = normalizeSemantic(options.status).replace(/\s+/gu, "_");
  if (!new Set(["completed", "blocked", "deferred", "needs_user_decision"]).has(status)) {
    throw new Error("--status must be completed, blocked, deferred, or needs_user_decision");
  }
  const runRoot = path.resolve(options.runRoot);
  const execute = async () => {
    if (!options.dryRun) await recoverPendingTransaction(runRoot);
    const loaded = await loadContinuation(runRoot, { persistLegacy: !options.dryRun });
    const state = structuredClone(loaded.state);
    await assertRouteLockUnchanged(state);
    if (status === "completed") {
      const unfinished = Object.values(state.slices || {}).filter((slice) => !["verified", "done", "deferred"].includes(slice.status));
      if (unfinished.length > 0) throw new Error(`cannot finalize completed with unfinished slices: ${unfinished.map((slice) => slice.dev_task_id).join(", ")}`);
    }
    state.run_status = status;
    state.phase = `finalized_${status}`;
    state.next_action = options.nextAction || (status === "completed"
      ? "review pending OPS candidates; promote only by an explicit OPS edit"
      : status === "needs_user_decision"
        ? "wait for the user to set a new target"
        : `follow the recorded ${status} next action`);
    const candidatePath = path.join(runRoot, OPS_CANDIDATES_FILE);
    const current = await fs.readFile(candidatePath, "utf8").catch(() => "# OPS Promotion Candidates\n\n");
    const marker = `## Finalization\n\n- finalized_at: ${nowIso()}\n- run_status: ${status}\n- promotion_rule: candidates remain run-local until Codex explicitly edits the approved OPS target\n\n`;
    const next = current.includes("## Finalization") ? current : `${current.trimEnd()}\n\n${marker}`;
    if (!options.dryRun) await persistState(runRoot, "finalize", state, [{ relativePath: OPS_CANDIDATES_FILE, content: next }]);
    return { ok: true, dry_run: options.dryRun === true, run_root: runRoot, status, candidate_file: OPS_CANDIDATES_FILE, next_action: state.next_action };
  };
  return options.dryRun ? execute() : withRunLock(runRoot, execute);
}

export {
  addOpsCandidate,
  checkpointLongTask,
  finalizeLongTask,
  parseCheckpointArgs,
  parseFinalizeArgs,
  parseOpsCandidateArgs,
  parseReopenArgs,
  parseResumeArgs,
  parseStatusArgs,
  reopenLongTask,
  resumeLongTask,
  statusLongTasks,
  summarizeState,
};
