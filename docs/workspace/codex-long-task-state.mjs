import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CONTINUATION_FILE = "08-continuation.json";
const FAILURE_LEDGER_FILE = "09-failure-ledger.jsonl";
const OPS_CANDIDATES_FILE = "10-ops-promotion-candidates.md";
const TRANSACTION_FILE = ".codex-long-task-transaction.json";
const LOCK_DIR = ".codex-long-task.lock";
const STATE_SCHEMA = "codex-long-task-state/v2";
const INDEX_SCHEMA = "codex-long-task-index/v1";
const MAX_REPAIRS_PER_EPOCH = 3;
const MAX_EPOCHS = 2;

const ACTIONABLE_RUN_STATUSES = new Set(["active", "blocked", "needs_user_decision"]);
const FINAL_RUN_STATUSES = new Set(["completed", "deferred"]);
const SLICE_STATUSES = new Set(["pending", "needs_fix", "repairing", "verifying", "verified", "done", "blocked", "deferred", "superseded"]);
const FAILURE_CHAIN_STATUSES = new Set(["open", "attempt_pending", "verifying", "exhausted", "resolved", "needs_user_decision"]);

function nowIso() {
  return new Date().toISOString();
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeSemantic(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\\/gu, "/")
    .replace(/\b\d{4}-\d{2}-\d{2}[t ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:z|[+-]\d{2}:?\d{2})?\b/giu, "<timestamp>")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/gu, "<date>")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

function normalizeStableLines(value = "") {
  return [...new Set(String(value || "")
    .split(/\r?\n/gu)
    .map((line) => normalizeSemantic(line).replace(/^\s*(?:\d+\s*[:.)-]\s*|\[[^\]]+\]\s*)/u, ""))
    .filter(Boolean))]
    .sort();
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function normalizePathForKey(value = "", baseRoot = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  const base = path.resolve(baseRoot || process.cwd());
  const absolute = path.resolve(base, text);
  const relative = path.relative(base, absolute) || ".";
  return relative.replace(/\\/gu, "/").replace(/^\.\//u, "").toLowerCase();
}

function normalizeList(values = [], transform = normalizeSemantic) {
  return [...new Set(values.map((value) => transform(value)).filter(Boolean))].sort();
}

function buildSliceKey({ projectRoot = "", workspaceRoot = "", scope = "", owned = [], acceptance = [] } = {}) {
  const base = projectRoot || workspaceRoot || process.cwd();
  return stableHash({
    project_root: normalizePathForKey(projectRoot || workspaceRoot || ".", workspaceRoot || base),
    scope: normalizeSemantic(scope),
    owned_paths: normalizeList(owned, (value) => normalizePathForKey(value, base)),
    acceptance: normalizeList(acceptance),
  });
}

function buildFailureKey({ sliceKey = "", failureSignature = "", failedAcceptance = [] } = {}) {
  return stableHash({
    slice_key: String(sliceKey || "").trim(),
    failure_signature: normalizeStableLines(failureSignature),
    failed_acceptance: normalizeList(Array.isArray(failedAcceptance) ? failedAcceptance : [failedAcceptance]),
  });
}

function buildAttemptKey({ failureKey = "", hypothesis = "", approach = "", owned = [], projectRoot = "", workspaceRoot = "" } = {}) {
  const base = projectRoot || workspaceRoot || process.cwd();
  return stableHash({
    failure_key: String(failureKey || "").trim(),
    hypothesis: normalizeSemantic(hypothesis),
    approach: normalizeSemantic(approach),
    owned_paths: normalizeList(owned, (value) => normalizePathForKey(value, base)),
  });
}

function extractHeadingValue(markdown = "", heading = "") {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = String(markdown || "").match(new RegExp(`^##\\s+${escaped}\\s*\\r?\\n+([^\\r\\n]+)`, "imu"));
  return match ? match[1].trim() : "";
}

function parseRouteLock(markdown = "") {
  const fields = {};
  for (const key of ["target_project", "target_surface", "project_root", "route_evidence", "forbidden_surfaces"]) {
    const match = String(markdown || "").match(new RegExp(`^-\\s*${key}\\s*:\\s*(.+)$`, "imu"));
    fields[key] = match ? match[1].trim() : "";
  }
  return fields;
}

function routeLockHash(routeLock = {}) {
  return stableHash(Object.fromEntries(Object.entries(routeLock).map(([key, value]) => [key, normalizeSemantic(value)])));
}

function isPlaceholderRouteLock(routeLock = {}) {
  const values = [routeLock.target_project, routeLock.target_surface, routeLock.project_root, routeLock.route_evidence];
  return values.some((value) => !String(value || "").trim() || /\(fill in|<fill in|not listed/u.test(String(value || "")));
}

async function readJson(targetPath, { missing = null, label = "JSON state" } = {}) {
  try {
    return JSON.parse(await fs.readFile(targetPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return missing;
    throw new Error(`corrupt ${label}: ${targetPath}: ${error.message}`);
  }
}

async function atomicWrite(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`,
  );
  await fs.writeFile(tempPath, String(content), "utf8");
  await fs.rename(tempPath, targetPath);
}

async function acquireDirectoryLock(lockPath, label, { waitMs = 1500 } = {}) {
  const deadline = Date.now() + waitMs;
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  while (true) {
    try {
      await fs.mkdir(lockPath);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const metadata = await readJson(path.join(lockPath, "owner.json"), { missing: {} });
      const pid = Number(metadata?.pid || 0);
      let alive = false;
      if (pid > 0) {
        try {
          process.kill(pid, 0);
          alive = true;
        } catch (pidError) {
          alive = pidError?.code === "EPERM";
        }
      }
      const createdAt = Date.parse(metadata?.created_at || "");
      const stat = await fs.stat(lockPath).catch(() => null);
      const lockTime = Number.isFinite(createdAt) ? createdAt : Number(stat?.mtimeMs || Date.now());
      const ageMs = Date.now() - lockTime;
      const stale = (pid > 0 && !alive) || (pid <= 0 && ageMs >= 1000);
      if (stale) {
        await fs.rm(lockPath, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`${label} is locked by another mutation`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  await atomicWrite(path.join(lockPath, "owner.json"), `${JSON.stringify({ pid: process.pid, created_at: nowIso() }, null, 2)}\n`);
  return async () => {
    await fs.rm(lockPath, { recursive: true, force: true });
  };
}

async function acquireRunLock(runRoot) {
  return acquireDirectoryLock(path.join(runRoot, LOCK_DIR), `run ${runRoot}`);
}

async function withRunLock(runRoot, operation) {
  const root = path.resolve(runRoot);
  const release = await acquireRunLock(root);
  try {
    return await operation();
  } finally {
    await release();
  }
}

function assertRunRelativePath(relativePath = "") {
  const normalized = path.normalize(String(relativePath || ""));
  if (!normalized || path.isAbsolute(normalized) || normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`transaction target escapes run root: ${relativePath}`);
  }
  return normalized;
}

async function commitRunFiles(runRoot, operation, entries = []) {
  const root = path.resolve(runRoot);
  const transactionPath = path.join(root, TRANSACTION_FILE);
  const normalizedEntries = entries.map(({ relativePath, content }) => ({
    relative_path: assertRunRelativePath(relativePath),
    content: String(content),
  }));
  const transaction = {
    schema: "codex-long-task-transaction/v1",
    operation,
    created_at: nowIso(),
    entries: normalizedEntries,
  };
  await atomicWrite(transactionPath, `${JSON.stringify(transaction, null, 2)}\n`);
  for (const entry of normalizedEntries) {
    await atomicWrite(path.join(root, entry.relative_path), entry.content);
  }
  await fs.rm(transactionPath, { force: true });
}

async function recoverPendingTransaction(runRoot) {
  const root = path.resolve(runRoot);
  const transactionPath = path.join(root, TRANSACTION_FILE);
  const transaction = await readJson(transactionPath, { missing: null, label: "long-task transaction" });
  if (!transaction) return { recovered: false, operation: "" };
  if (!Array.isArray(transaction.entries)) throw new Error(`corrupt long-task transaction: ${transactionPath}: entries missing`);
  for (const entry of transaction.entries) {
    const relativePath = assertRunRelativePath(entry.relative_path);
    await atomicWrite(path.join(root, relativePath), String(entry.content ?? ""));
  }
  await fs.rm(transactionPath, { force: true });
  return { recovered: true, operation: String(transaction.operation || "unknown") };
}

async function loadRegistry(workspaceRoot) {
  const registryPath = path.join(workspaceRoot, "docs", "workspace", "project-registry.json");
  const registry = await readJson(registryPath, { missing: { projects: [] }, label: "project registry" });
  return Array.isArray(registry?.projects) ? registry.projects : [];
}

async function resolveProjectMetadata({ workspaceRoot, project, shared = false } = {}) {
  const normalizedProject = normalizeSemantic(project || (shared ? "workspace" : "shared"));
  const projects = await loadRegistry(workspaceRoot);
  const entry = projects.find((candidate) => normalizeSemantic(candidate?.slug) === normalizedProject) || null;
  const stateData = shared
    ? path.join("state", "project-data", "workspace")
    : String(entry?.state_data || path.join("state", "project-data", project || "shared"));
  const opsSurface = shared
    ? "ops"
    : String(entry?.ops_surface || path.join("ops", "projects", project || "shared"));
  return {
    registered: Boolean(entry),
    state_data: stateData,
    ops_surface: opsSurface,
  };
}

function indexPathForMetadata({ workspaceRoot, stateData } = {}) {
  return path.join(path.resolve(workspaceRoot), stateData, "codex-long-tasks", "index.json");
}

async function inferRunMetadata(runRoot) {
  const root = path.resolve(runRoot);
  const contextPath = path.join(root, "01-confirmed-context.md");
  let context = "";
  try {
    context = await fs.readFile(contextPath, "utf8");
  } catch {
    throw new Error(`missing confirmed context: ${contextPath}`);
  }
  const workspaceRoot = path.resolve(extractHeadingValue(context, "Workspace Root") || process.cwd());
  const routeLock = parseRouteLock(context);
  const project = extractHeadingValue(context, "Project") || routeLock.target_project || "shared";
  const headingProjectRoot = extractHeadingValue(context, "Project Root");
  const projectRootCandidate = routeLock.project_root || headingProjectRoot;
  const projectRoot = /\(fill in|n\/a|^$/iu.test(projectRootCandidate) ? "" : path.resolve(projectRootCandidate);
  const shared = root.includes(`${path.sep}scratch${path.sep}shared${path.sep}`) || normalizeSemantic(project) === "shared";
  const projectMetadata = await resolveProjectMetadata({ workspaceRoot, project, shared });
  return {
    workspaceRoot,
    project,
    projectRoot,
    shared,
    routeLock,
    route_lock_hash: routeLockHash(routeLock),
    route_lock_incomplete: isPlaceholderRouteLock(routeLock),
    ...projectMetadata,
  };
}

function renderOpsCandidateHeader() {
  return `# OPS Promotion Candidates\n\nThis file contains promotion candidates awaiting explicit Codex review. It never updates OPS by itself.\n\n`;
}

function buildInitialContinuation(runRoot, metadata = {}, { legacy = false } = {}) {
  const createdAt = nowIso();
  return {
    schema: STATE_SCHEMA,
    run_id: path.basename(path.resolve(runRoot)),
    run_root: path.resolve(runRoot),
    workspace_root: metadata.workspaceRoot,
    project: metadata.project,
    project_root: metadata.projectRoot,
    shared: metadata.shared === true,
    state_data: metadata.state_data,
    ops_surface: metadata.ops_surface,
    legacy_migrated: legacy,
    run_status: "active",
    phase: "initialized",
    active_slice: null,
    next_action: metadata.route_lock_incomplete
      ? "complete Route Lock, then checkpoint before the first handoff"
      : "checkpoint before the first handoff",
    route_lock: metadata.routeLock,
    route_lock_hash: legacy || !metadata.route_lock_incomplete ? metadata.route_lock_hash : "",
    checkpoint_seq: 0,
    checkpoints: [],
    slices: {},
    failure_chains: {},
    active_failure: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function validateContinuation(state, statePath = CONTINUATION_FILE, expectedRunRoot = "") {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error(`corrupt continuation state: ${statePath}`);
  if (state.schema !== STATE_SCHEMA) throw new Error(`unsupported continuation state schema in ${statePath}`);
  for (const field of ["run_id", "run_root", "workspace_root", "project", "state_data", "run_status", "phase"]) {
    if (typeof state[field] !== "string" || !state[field].trim()) throw new Error(`corrupt continuation state: ${statePath}: ${field} missing`);
  }
  if (expectedRunRoot && path.resolve(state.run_root) !== path.resolve(expectedRunRoot)) {
    throw new Error(`continuation conflict: state run_root does not match ${path.resolve(expectedRunRoot)}`);
  }
  if (![...ACTIONABLE_RUN_STATUSES, ...FINAL_RUN_STATUSES].includes(state.run_status)) {
    throw new Error(`corrupt continuation state: ${statePath}: unsupported run_status ${state.run_status}`);
  }
  if (!state.slices || typeof state.slices !== "object" || Array.isArray(state.slices)) {
    throw new Error(`corrupt continuation state: ${statePath}: slices must be an object`);
  }
  if (!state.failure_chains || typeof state.failure_chains !== "object" || Array.isArray(state.failure_chains)) {
    throw new Error(`corrupt continuation state: ${statePath}: failure_chains must be an object`);
  }
  if (!Array.isArray(state.checkpoints)) throw new Error(`corrupt continuation state: ${statePath}: checkpoints must be an array`);
  if (!Number.isInteger(state.checkpoint_seq) || state.checkpoint_seq < 0) {
    throw new Error(`corrupt continuation state: ${statePath}: checkpoint_seq must be a non-negative integer`);
  }
  for (const [taskId, slice] of Object.entries(state.slices)) {
    if (!slice || typeof slice !== "object" || Array.isArray(slice) || slice.dev_task_id !== taskId || !SLICE_STATUSES.has(slice.status)) {
      throw new Error(`corrupt continuation state: ${statePath}: invalid slice ${taskId}`);
    }
  }
  for (const [failureKey, chain] of Object.entries(state.failure_chains)) {
    if (!chain || typeof chain !== "object" || Array.isArray(chain) || chain.failure_key !== failureKey || !FAILURE_CHAIN_STATUSES.has(chain.status)) {
      throw new Error(`corrupt continuation state: ${statePath}: invalid failure chain ${failureKey}`);
    }
  }
  if (state.active_slice !== null && state.active_slice !== undefined && typeof state.active_slice !== "string") {
    throw new Error(`corrupt continuation state: ${statePath}: active_slice must be a string or null`);
  }
  if (state.active_failure !== null && state.active_failure !== undefined && typeof state.active_failure !== "string") {
    throw new Error(`corrupt continuation state: ${statePath}: active_failure must be a string or null`);
  }
  return state;
}

async function synthesizeLegacyState(runRoot) {
  const metadata = await inferRunMetadata(runRoot);
  const state = buildInitialContinuation(runRoot, metadata, { legacy: true });
  const ledgerPath = path.join(runRoot, "03-task-ledger.md");
  const ledger = await fs.readFile(ledgerPath, "utf8").catch(() => "");
  const statuses = [...ledger.matchAll(/^\|\s*T\d+\s*\|\s*([^|]+)\|/gmu)].map((match) => normalizeSemantic(match[1]));
  if (statuses.some((status) => status === "needs_fix" || status === "blocked")) {
    state.run_status = "blocked";
    state.phase = "legacy_blocked";
  } else if (statuses.some((status) => ["done", "verified"].includes(status))
    && statuses.every((status) => ["done", "verified", "deferred"].includes(status))) {
    state.run_status = "completed";
    state.phase = "legacy_completed";
  }
  return state;
}

async function loadContinuation(runRoot, { persistLegacy = false } = {}) {
  const root = path.resolve(runRoot);
  const statePath = path.join(root, CONTINUATION_FILE);
  const existing = await readJson(statePath, { missing: null, label: "continuation state" });
  if (existing) {
    const state = validateContinuation(existing, statePath, root);
    if (!(await pathExists(state.workspace_root))) throw new Error(`continuation conflict: workspace_root does not exist: ${state.workspace_root}`);
    const inferred = await inferRunMetadata(root);
    if (path.resolve(state.workspace_root) !== path.resolve(inferred.workspaceRoot)) {
      throw new Error("continuation conflict: workspace_root does not match 01-confirmed-context.md");
    }
    if (normalizeSemantic(state.project) !== normalizeSemantic(inferred.project) || state.shared !== inferred.shared) {
      throw new Error("continuation conflict: project/shared routing does not match 01-confirmed-context.md");
    }
    if (path.resolve(state.project_root || state.workspace_root) !== path.resolve(inferred.projectRoot || inferred.workspaceRoot)) {
      throw new Error("continuation conflict: project_root does not match the Route Lock");
    }
    const expectedRouting = await resolveProjectMetadata({
      workspaceRoot: inferred.workspaceRoot,
      project: inferred.project,
      shared: inferred.shared,
    });
    if (path.resolve(state.workspace_root, state.state_data) !== path.resolve(state.workspace_root, expectedRouting.state_data)
      || path.resolve(state.workspace_root, state.ops_surface) !== path.resolve(state.workspace_root, expectedRouting.ops_surface)) {
      throw new Error("continuation conflict: state_data/ops_surface routing drifted from the project registry");
    }
    return { state, legacy: false };
  }
  const state = await synthesizeLegacyState(root);
  if (persistLegacy) {
    const failureLedgerPath = path.join(root, FAILURE_LEDGER_FILE);
    const opsCandidatesPath = path.join(root, OPS_CANDIDATES_FILE);
    const entries = [
      { relativePath: CONTINUATION_FILE, content: `${JSON.stringify(state, null, 2)}\n` },
    ];
    if (!(await pathExists(failureLedgerPath))) entries.push({ relativePath: FAILURE_LEDGER_FILE, content: "" });
    if (!(await pathExists(opsCandidatesPath))) entries.push({ relativePath: OPS_CANDIDATES_FILE, content: renderOpsCandidateHeader() });
    await commitRunFiles(root, "legacy-state-bootstrap", entries);
  }
  return { state, legacy: true };
}

async function initializeRunState(runRoot, options = {}) {
  const metadata = await inferRunMetadata(runRoot);
  if (options.workspaceRoot) metadata.workspaceRoot = path.resolve(options.workspaceRoot);
  if (options.project) metadata.project = options.project;
  if (options.projectRoot) metadata.projectRoot = path.resolve(options.projectRoot);
  if (options.shared !== undefined) metadata.shared = options.shared === true;
  Object.assign(metadata, await resolveProjectMetadata(metadata));
  const state = buildInitialContinuation(runRoot, metadata);
  await commitRunFiles(runRoot, "initialize-state", [
    { relativePath: CONTINUATION_FILE, content: `${JSON.stringify(state, null, 2)}\n` },
    { relativePath: FAILURE_LEDGER_FILE, content: "" },
    { relativePath: OPS_CANDIDATES_FILE, content: renderOpsCandidateHeader() },
  ]);
  await updateRunIndex(state);
  return {
    state,
    files: [CONTINUATION_FILE, FAILURE_LEDGER_FILE, OPS_CANDIDATES_FILE],
  };
}

async function readFailureEvents(runRoot) {
  const ledgerPath = path.join(path.resolve(runRoot), FAILURE_LEDGER_FILE);
  let text = "";
  try {
    text = await fs.readFile(ledgerPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const events = [];
  for (const [index, line] of text.split(/\r?\n/gu).entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`corrupt failure ledger: ${ledgerPath}:${index + 1}: ${error.message}`);
    }
  }
  return events;
}

function renderFailureEvents(events = []) {
  return events.map((event) => JSON.stringify(event)).join("\n") + (events.length > 0 ? "\n" : "");
}

function buildIndexRecord(state = {}) {
  return {
    run_id: state.run_id,
    run_root: state.run_root,
    project: state.project,
    project_root: state.project_root,
    shared: state.shared === true,
    status: state.run_status,
    phase: state.phase,
    active_slice: state.active_slice,
    next_action: state.next_action,
    route_lock_hash: state.route_lock_hash,
    slice_keys: Object.values(state.slices || {}).map((slice) => slice.slice_key).filter(Boolean),
    slices: Object.values(state.slices || {}).map((slice) => ({
      dev_task_id: slice.dev_task_id,
      verify_task_id: slice.verify_task_id,
      slice_key: slice.slice_key,
      status: slice.status,
      epoch: slice.epoch || 1,
    })),
    failure_chains: state.failure_chains || {},
    checkpoint_seq: state.checkpoint_seq || 0,
    updated_at: state.updated_at || nowIso(),
  };
}

async function updateRunIndex(state = {}) {
  const indexPath = indexPathForMetadata({ workspaceRoot: state.workspace_root, stateData: state.state_data });
  const release = await acquireDirectoryLock(`${indexPath}.lock`, `project index ${indexPath}`);
  try {
    const index = await readJson(indexPath, {
      missing: { schema: INDEX_SCHEMA, project: state.project, updated_at: nowIso(), runs: [] },
      label: "long-task project index",
    });
    if (index.schema !== INDEX_SCHEMA || !Array.isArray(index.runs)) throw new Error(`corrupt long-task project index: ${indexPath}`);
    const record = buildIndexRecord(state);
    const nextRuns = index.runs.filter((item) => item?.run_root !== record.run_root);
    nextRuns.push(record);
    nextRuns.sort((left, right) => String(right.updated_at || "").localeCompare(String(left.updated_at || "")));
    index.project = state.project;
    index.updated_at = nowIso();
    index.runs = nextRuns;
    await atomicWrite(indexPath, `${JSON.stringify(index, null, 2)}\n`);
    return { indexPath, index };
  } finally {
    await release();
  }
}

async function readProjectIndex({ workspaceRoot, project, shared = false } = {}) {
  const metadata = await resolveProjectMetadata({ workspaceRoot, project, shared });
  const indexPath = indexPathForMetadata({ workspaceRoot, stateData: metadata.state_data });
  const index = await readJson(indexPath, {
    missing: { schema: INDEX_SCHEMA, project, updated_at: "", runs: [] },
    label: "long-task project index",
  });
  if (index.schema !== INDEX_SCHEMA || !Array.isArray(index.runs)) throw new Error(`corrupt long-task project index: ${indexPath}`);
  return { indexPath, index, metadata };
}

async function assertRouteLockUnchanged(state, { allowInitialLock = true } = {}) {
  const metadata = await inferRunMetadata(state.run_root);
  if (metadata.route_lock_incomplete) throw new Error(`Route Lock is incomplete: ${path.join(state.run_root, "01-confirmed-context.md")}`);
  if (!state.route_lock_hash && allowInitialLock) {
    state.route_lock = metadata.routeLock;
    state.route_lock_hash = metadata.route_lock_hash;
    state.project_root = metadata.projectRoot;
    state.project = metadata.project;
    return { changed: true, metadata };
  }
  if (state.route_lock_hash !== metadata.route_lock_hash) {
    throw new Error(`Route Lock drift detected for ${state.run_root}; restore the locked route or start a separately routed run`);
  }
  return { changed: false, metadata };
}

function assertRunCanMutate(state, command = "write") {
  if (state.run_status === "needs_user_decision") {
    throw new Error(`run needs user decision; ${command} is disabled until the user sets a new target`);
  }
  if (FINAL_RUN_STATUSES.has(state.run_status)) throw new Error(`run is ${state.run_status}; ${command} is disabled`);
}

async function persistState(runRoot, operation, state, extraEntries = []) {
  state.updated_at = nowIso();
  await commitRunFiles(runRoot, operation, [
    ...extraEntries,
    { relativePath: CONTINUATION_FILE, content: `${JSON.stringify(state, null, 2)}\n` },
  ]);
  await updateRunIndex(state);
}

async function currentOwnedFileDigest(state = {}, slice = {}) {
  const base = state.project_root || state.workspace_root;
  const records = [];
  for (const owned of normalizeList(slice.owned || [], (value) => String(value || "").trim())) {
    const targetPath = path.isAbsolute(owned) ? path.resolve(owned) : path.resolve(base, owned);
    let digest = "missing";
    try {
      const data = await fs.readFile(targetPath);
      digest = crypto.createHash("sha256").update(data).digest("hex");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    records.push({ path: normalizePathForKey(targetPath, base), digest });
  }
  return stableHash(records);
}

function extractLabeledValues(text = "", label = "") {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const values = [];
  for (const match of String(text || "").matchAll(new RegExp(`^${escaped}\\s*:\\s*(.+)$`, "gimu"))) values.push(match[1].trim());
  return values;
}

function extractFailureDescriptor(resultText = "", fallbackAcceptance = []) {
  const meaningful = (value) => {
    const normalized = normalizeSemantic(value);
    return Boolean(normalized)
      && !/^<.*>$/u.test(normalized)
      && !normalized.includes("stable normalized failure identity")
      && !normalized.includes("exact failed acceptance criterion");
  };
  const rawSignatures = extractLabeledValues(resultText, "failure_signature");
  const rawAcceptance = extractLabeledValues(resultText, "failed_acceptance");
  const explicitSignatures = rawSignatures.filter(meaningful);
  const explicitAcceptance = rawAcceptance.filter(meaningful);
  const section = String(resultText || "").match(/^##\s+(?:Failing Evidence|Failure|Findings)\s*\r?\n+([\s\S]*?)(?:\r?\n##\s+|\s*$)/imu);
  const signature = explicitSignatures.join("\n") || section?.[1]?.trim() || String(resultText || "").trim();
  const failedAcceptance = explicitAcceptance.length > 0 ? explicitAcceptance : fallbackAcceptance;
  return {
    failure_signature: normalizeStableLines(signature).join("\n"),
    failed_acceptance: normalizeList(failedAcceptance),
    signature_source: explicitSignatures.length > 0 ? "verifier" : "derived_legacy",
    explicit_fields_valid: rawSignatures.length > 0
      && rawAcceptance.length > 0
      && explicitSignatures.length === rawSignatures.length
      && explicitAcceptance.length === rawAcceptance.length,
  };
}

function ensureFailureChain(state, slice, descriptor, evidence = {}) {
  const failureKey = buildFailureKey({
    sliceKey: slice.slice_key,
    failureSignature: descriptor.failure_signature,
    failedAcceptance: descriptor.failed_acceptance,
  });
  const existing = state.failure_chains[failureKey] || {};
  const chain = {
    failure_key: failureKey,
    slice_key: slice.slice_key,
    epoch: Number(existing.epoch || slice.epoch || 1),
    attempts_total: Number(existing.attempts_total || 0),
    attempts_in_epoch: Number(existing.attempts_in_epoch || 0),
    status: existing.status || "open",
    failure_signature: descriptor.failure_signature,
    failed_acceptance: descriptor.failed_acceptance,
    signature_source: descriptor.signature_source,
    evidence_facts: normalizeList([...(existing.evidence_facts || []), ...(evidence.facts || [])]),
    evidence_files: normalizeList([...(existing.evidence_files || []), ...(evidence.files || [])], (value) => normalizePathForKey(value, state.run_root)),
    evidence_digests: normalizeList([...(existing.evidence_digests || []), ...(evidence.digests || [])]),
    hypotheses: normalizeList(existing.hypotheses || []),
    approaches: normalizeList(existing.approaches || []),
    attempt_keys: normalizeList(existing.attempt_keys || [], (value) => String(value || "").trim()),
    file_state_digests: normalizeList(existing.file_state_digests || [], (value) => String(value || "").trim()),
    predecessor_slice: existing.predecessor_slice || null,
    successor_slice: existing.successor_slice || null,
    updated_at: nowIso(),
  };
  state.failure_chains[failureKey] = chain;
  state.active_failure = failureKey;
  slice.failure_key = failureKey;
  return chain;
}

function parseRepairNumberFromResult(resultPath = "") {
  const match = path.basename(String(resultPath || "")).match(/^recheck-(\d+)-result\.md$/u);
  return match ? Number(match[1]) : 0;
}

function isPathWithin(targetPath, parentPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(targetPath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function evidenceDigest(targetPath) {
  const data = await fs.readFile(targetPath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function validateEvidenceFiles(state, files = []) {
  if (files.length === 0) throw new Error("at least one --evidence-file is required");
  const allowedRoots = [state.run_root, state.project_root || state.workspace_root].filter(Boolean);
  const result = [];
  for (const value of files) {
    const targetPath = path.resolve(value);
    if (!allowedRoots.some((root) => isPathWithin(targetPath, root))) {
      throw new Error(`evidence file is outside the run/Route Lock: ${targetPath}`);
    }
    if (!(await pathExists(targetPath))) throw new Error(`evidence file does not exist: ${targetPath}`);
    result.push({ path: targetPath, digest: await evidenceDigest(targetPath) });
  }
  return result;
}

export {
  ACTIONABLE_RUN_STATUSES,
  CONTINUATION_FILE,
  FAILURE_LEDGER_FILE,
  FINAL_RUN_STATUSES,
  INDEX_SCHEMA,
  MAX_EPOCHS,
  MAX_REPAIRS_PER_EPOCH,
  OPS_CANDIDATES_FILE,
  STATE_SCHEMA,
  TRANSACTION_FILE,
  assertRouteLockUnchanged,
  assertRunCanMutate,
  atomicWrite,
  buildAttemptKey,
  buildFailureKey,
  buildIndexRecord,
  buildInitialContinuation,
  buildSliceKey,
  commitRunFiles,
  currentOwnedFileDigest,
  ensureFailureChain,
  evidenceDigest,
  extractFailureDescriptor,
  inferRunMetadata,
  initializeRunState,
  isPathWithin,
  loadContinuation,
  normalizeList,
  normalizePathForKey,
  normalizeSemantic,
  normalizeStableLines,
  nowIso,
  parseRepairNumberFromResult,
  pathExists,
  persistState,
  readFailureEvents,
  readProjectIndex,
  recoverPendingTransaction,
  renderFailureEvents,
  renderOpsCandidateHeader,
  resolveProjectMetadata,
  routeLockHash,
  stableHash,
  updateRunIndex,
  validateEvidenceFiles,
  withRunLock,
};
