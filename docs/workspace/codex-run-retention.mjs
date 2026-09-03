#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_KEEP = 10;
const DEFAULT_RUN_ROOT = "scratch/shared/codex-runs";
const DEFAULT_ARCHIVE_BASE = "archive/cleanup/2026-05-11-codex-runs-rotation";
const TERMINAL_RUN_STATUSES = new Set([
  "completed",
  "deferred",
]);
const PROTECTED_RUN_STATUSES = new Set([
  "active",
  "blocked",
  "awaiting_user",
  "awaiting_user_decision",
  "needs_user_decision",
]);

function parseArgs(argv = []) {
  const options = {
    repo: "",
    dryRun: true,
    apply: false,
    json: false,
    keepLatest: undefined,
    archiveRoot: "",
    runRoot: "",
    project: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--repo") {
      options.repo = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      options.apply = false;
      continue;
    }
    if (arg === "--apply") {
      options.apply = true;
      options.dryRun = false;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--keep-latest") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) options.keepLatest = parsed;
      index += 1;
      continue;
    }
    if (arg === "--archive-root") {
      options.archiveRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--run-root") {
      options.runRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--project") {
      options.project = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return options;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function pathEntryExists(targetPath) {
  try {
    await fs.lstat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function ensureWorkspaceRoot(repoRoot) {
  const requiredPaths = [
    path.join(repoRoot, "AGENTS.md"),
    path.join(repoRoot, "docs", "workspace"),
    path.join(repoRoot, ".codex", "config.toml"),
  ];
  for (const requiredPath of requiredPaths) {
    if (!(await pathExists(requiredPath))) {
      throw new Error(`unsupported workspace root for codex-run retention: ${repoRoot}`);
    }
  }
}

async function listRunDirs(runRoot) {
  const entries = await fs.readdir(runRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function normalizeRelativePath(value = "") {
  return String(value || "")
    .replace(/\\/gu, "/")
    .replace(/^\.\//u, "")
    .replace(/\/+$/u, "");
}

function isPathInside(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function isSafeRunName(value = "") {
  const name = String(value || "");
  return Boolean(name)
    && name !== "."
    && name !== ".."
    && path.basename(name) === name
    && !name.includes("/")
    && !name.includes("\\");
}

async function nearestExistingRealPath(candidatePath) {
  let current = path.resolve(candidatePath);
  while (true) {
    try {
      return {
        existing_path: current,
        real_path: await fs.realpath(current),
      };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

async function assertWorkspacePathBoundary(repoRoot, candidatePath, label, options = {}) {
  const lexicalRepoRoot = path.resolve(repoRoot);
  const lexicalCandidate = path.resolve(candidatePath);
  if (!isPathInside(lexicalRepoRoot, lexicalCandidate)) {
    throw new Error(`${label} must stay inside the workspace: ${candidatePath}`);
  }
  const realRepoRoot = await fs.realpath(lexicalRepoRoot);
  if (options.mustExist === true) {
    const realCandidate = await fs.realpath(lexicalCandidate);
    if (!isPathInside(realRepoRoot, realCandidate)) {
      throw new Error(`${label} resolves outside the workspace: ${candidatePath}`);
    }
    return realCandidate;
  }
  const ancestor = await nearestExistingRealPath(lexicalCandidate);
  if (!isPathInside(realRepoRoot, ancestor.real_path)) {
    throw new Error(`${label} resolves outside the workspace: ${candidatePath}`);
  }
  return lexicalCandidate;
}

async function assertArchiveRootLocation(repoRoot, archiveRoot, options = {}) {
  const archiveBase = path.resolve(repoRoot, "archive");
  const candidate = path.resolve(archiveRoot);
  if (!isPathInside(archiveBase, candidate)) {
    throw new Error(`archive root must stay inside the workspace archive directory: ${archiveRoot}`);
  }
  try {
    const realRepoRoot = await fs.realpath(repoRoot);
    const realArchiveBase = await fs.realpath(archiveBase);
    if (realArchiveBase !== path.join(realRepoRoot, "archive")) {
      throw new Error("workspace archive directory must not be a symbolic-link redirect");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return assertWorkspacePathBoundary(repoRoot, candidate, "archive root", options);
}

function resolveRunRoot(repoRoot, options = {}) {
  if (options.runRoot && options.project) {
    throw new Error("use either --run-root or --project, not both");
  }
  const project = String(options.project || "").trim();
  if (project && !/^[a-z0-9][a-z0-9._-]*$/u.test(project)) {
    throw new Error(`invalid project slug for codex-run retention: ${project}`);
  }
  const requested = options.runRoot
    || (project ? path.join("scratch", "projects", project, "codex-runs") : DEFAULT_RUN_ROOT);
  const absolute = path.resolve(repoRoot, requested);
  if (!isPathInside(repoRoot, absolute) || path.basename(absolute) !== "codex-runs") {
    throw new Error(`run root must be a codex-runs directory inside the workspace: ${requested}`);
  }
  return {
    absolute,
    relative: normalizeRelativePath(path.relative(repoRoot, absolute)),
    project: project || null,
  };
}

async function loadScratchRetention(repoRoot) {
  const retentionPath = path.join(repoRoot, "docs", "workspace", "scratch-retention.json");
  const raw = await fs.readFile(retentionPath, "utf8");
  return JSON.parse(raw);
}

function findCodexRunsEntry(retentionManifest = {}, runRoot = DEFAULT_RUN_ROOT) {
  const normalizedRunRoot = normalizeRelativePath(runRoot);
  return (retentionManifest.entries || [])
    .filter((entry) => {
      const entryPath = normalizeRelativePath(entry.path);
      return entryPath === normalizedRunRoot || normalizedRunRoot.startsWith(`${entryPath}/`);
    })
    .sort((left, right) => normalizeRelativePath(right.path).length - normalizeRelativePath(left.path).length)[0] || null;
}

function normalizeKeepSet(entry = {}) {
  return new Set((entry.keep || []).map((value) => String(value || "").trim()).filter(Boolean));
}

function normalizeRunStatus(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/gu, "_");
}

function phaseNeedsProtection(phase = "") {
  const normalized = normalizeRunStatus(phase);
  return normalized.includes("blocked")
    || normalized.includes("awaiting_user")
    || normalized.includes("awaiting_owner")
    || normalized.includes("awaiting_authorization")
    || normalized.includes("needs_user_decision");
}

async function inspectRunDirectory(runRoot, name, options = {}) {
  const continuationPath = path.join(runRoot, name, "08-continuation.json");
  let continuation = null;
  let stateError = "";
  try {
    continuation = JSON.parse(await fs.readFile(continuationPath, "utf8"));
  } catch (error) {
    stateError = error?.code === "ENOENT" ? "missing_continuation" : "invalid_continuation";
  }
  const status = normalizeRunStatus(continuation?.run_status || continuation?.status);
  const phase = normalizeRunStatus(continuation?.phase);
  const absoluteRunRoot = path.resolve(runRoot, name);
  const indexRecord = options.indexRecords instanceof Map
    ? options.indexRecords.get(absoluteRunRoot) || null
    : null;
  const indexStatus = normalizeRunStatus(indexRecord?.status);
  const indexPhase = normalizeRunStatus(indexRecord?.phase);
  const protectionReasons = [];
  if (stateError) protectionReasons.push(stateError);
  if (!status) protectionReasons.push("unknown_status");
  if (PROTECTED_RUN_STATUSES.has(status)) protectionReasons.push(`status:${status}`);
  if (phaseNeedsProtection(phase)) protectionReasons.push(`phase:${phase}`);
  if (options.requireIndex === true && !indexRecord) protectionReasons.push("missing_index_record");
  if (indexRecord?.index_conflict === true) protectionReasons.push("duplicate_index_record");
  if (PROTECTED_RUN_STATUSES.has(indexStatus)) protectionReasons.push(`index_status:${indexStatus}`);
  if (phaseNeedsProtection(indexPhase)) protectionReasons.push(`index_phase:${indexPhase}`);
  if (indexRecord && indexStatus !== status) protectionReasons.push(`index_state_conflict:${indexStatus || "unknown"}:${status || "unknown"}`);
  const terminal = TERMINAL_RUN_STATUSES.has(status);
  if (!terminal && protectionReasons.length === 0) protectionReasons.push(`non_terminal_status:${status}`);
  return {
    name,
    status: status || "unknown",
    phase,
    index_status: indexStatus || "unknown",
    index_phase: indexPhase,
    index_path: String(indexRecord?.index_path || ""),
    next_action: String(continuation?.next_action || "").trim(),
    continuation_path: continuationPath,
    terminal,
    protected: protectionReasons.length > 0,
    protection_reasons: protectionReasons,
  };
}

async function discoverRunRoots(repoRoot, options = {}) {
  const roots = [];
  const errors = Array.isArray(options.errors) ? options.errors : [];
  const absoluteRepoRoot = path.resolve(repoRoot);
  const realRepoRoot = await fs.realpath(absoluteRepoRoot);

  async function safeDirectory(candidate, label) {
    let stats;
    try {
      stats = await fs.lstat(candidate);
    } catch (error) {
      if (error?.code === "ENOENT") return "";
      errors.push({ path: candidate, error: `${label}: ${error?.code || error?.message || error}` });
      return "";
    }
    if (!stats.isDirectory() && !stats.isSymbolicLink()) return "";
    try {
      const resolved = await fs.realpath(candidate);
      const resolvedStats = await fs.lstat(resolved);
      if (!resolvedStats.isDirectory() || !isPathInside(realRepoRoot, resolved)) {
        errors.push({ path: candidate, error: `${label}: resolves outside the workspace or is not a directory` });
        return "";
      }
      return path.resolve(candidate);
    } catch (error) {
      errors.push({ path: candidate, error: `${label}: ${error?.code || error?.message || error}` });
      return "";
    }
  }

  const sharedRoot = path.join(repoRoot, DEFAULT_RUN_ROOT);
  const safeSharedRoot = await safeDirectory(sharedRoot, "shared run root");
  if (safeSharedRoot) roots.push(safeSharedRoot);
  const projectsRoot = path.join(repoRoot, "scratch", "projects");
  const safeProjectsRoot = await safeDirectory(projectsRoot, "project run-root container");
  if (!safeProjectsRoot) return roots.sort((left, right) => left.localeCompare(right));
  let projects = [];
  try {
    projects = await fs.readdir(safeProjectsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  for (const entry of projects) {
    if (!entry.isDirectory()) continue;
    const runRoot = path.join(safeProjectsRoot, entry.name, "codex-runs");
    const safeRunRoot = await safeDirectory(runRoot, `project run root ${entry.name}`);
    if (safeRunRoot) roots.push(safeRunRoot);
  }
  return roots.sort((left, right) => left.localeCompare(right));
}

async function loadRunIndexRecords(repoRoot) {
  const result = {
    by_run_root: new Map(),
    errors: [],
  };
  const projectDataRoot = path.join(repoRoot, "state", "project-data");
  let projects = [];
  try {
    projects = await fs.readdir(projectDataRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return result;
  }
  for (const entry of projects) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(projectDataRoot, entry.name, "codex-long-tasks", "index.json");
    let index = null;
    try {
      index = JSON.parse(await fs.readFile(indexPath, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      result.errors.push({
        path: indexPath,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (!Array.isArray(index?.runs)) {
      result.errors.push({ path: indexPath, error: "invalid long-task index: runs must be an array" });
      continue;
    }
    for (const record of index.runs) {
      if (!record?.run_root) continue;
      const runRoot = path.isAbsolute(String(record.run_root))
        ? path.resolve(String(record.run_root))
        : path.resolve(repoRoot, String(record.run_root));
      if (!isPathInside(repoRoot, runRoot)) continue;
      const normalizedRecord = {
        ...record,
        index_path: indexPath,
        status: normalizeRunStatus(record.status),
        phase: normalizeRunStatus(record.phase),
      };
      const previous = result.by_run_root.get(runRoot);
      if (previous) {
        result.errors.push({
          path: runRoot,
          error: `duplicate long-task index run_root: ${previous.index_path}; ${indexPath}`,
        });
        result.by_run_root.set(runRoot, {
          ...normalizedRecord,
          index_conflict: true,
          index_paths: [...new Set([...(previous.index_paths || [previous.index_path]), indexPath])],
        });
        continue;
      }
      result.by_run_root.set(runRoot, normalizedRecord);
    }
  }
  return result;
}

async function buildRetentionPlan(options = {}) {
  const repoRoot = path.resolve(options.repo || process.cwd());
  await ensureWorkspaceRoot(repoRoot);
  const resolvedRunRoot = resolveRunRoot(repoRoot, options);
  const runRoot = resolvedRunRoot.absolute;
  await assertWorkspacePathBoundary(repoRoot, runRoot, "run root", { mustExist: true });
  const retentionManifest = await loadScratchRetention(repoRoot);
  const codexRunsEntry = findCodexRunsEntry(retentionManifest, resolvedRunRoot.relative);
  const keepExplicit = normalizeKeepSet(codexRunsEntry || {});
  const runDirs = await listRunDirs(runRoot);
  const indexRecords = await loadRunIndexRecords(repoRoot);
  const runs = await Promise.all(runDirs.map((name) => inspectRunDirectory(runRoot, name, {
    indexRecords: indexRecords.by_run_root,
    requireIndex: true,
  })));
  const keepLatestSource = options.keepLatest ?? codexRunsEntry?.keep_latest ?? DEFAULT_KEEP;
  const parsedKeepLatest = Number(keepLatestSource);
  const keepLatest = Number.isFinite(parsedKeepLatest) && parsedKeepLatest >= 0
    ? Math.floor(parsedKeepLatest)
    : DEFAULT_KEEP;
  const latestNames = keepLatest === 0 ? [] : runDirs.slice(-keepLatest);
  const keepProtected = runs.filter((entry) => entry.protected).map((entry) => entry.name);
  const keep = new Set([...latestNames, ...keepExplicit, ...keepProtected]);
  const archive = runs.filter((entry) => entry.terminal && !keep.has(entry.name)).map((entry) => entry.name);
  const archiveRoot = path.resolve(
    options.archiveRoot || path.join(repoRoot, DEFAULT_ARCHIVE_BASE, resolvedRunRoot.relative),
  );
  await assertArchiveRootLocation(repoRoot, archiveRoot);

  return {
    repo_root: repoRoot,
    run_root: runRoot,
    run_root_relative: resolvedRunRoot.relative,
    project: resolvedRunRoot.project,
    archive_root: archiveRoot,
    keep_latest: keepLatest,
    keep_latest_override: options.keepLatest === undefined ? null : keepLatest,
    keep_latest_names: latestNames,
    keep_explicit: [...keepExplicit].sort(),
    keep_protected: keepProtected,
    keep: runDirs.filter((name) => keep.has(name)),
    archive,
    runs,
    index_errors: indexRecords.errors,
  };
}

async function applyRetentionPlan(plan = {}, options = {}) {
  const apply = options.apply === true;
  const archiveNames = Array.isArray(plan.archive) ? plan.archive : [];
  if (!apply || archiveNames.length === 0) {
    return {
      dry_run: !apply,
      applied: apply,
      archived: [],
    };
  }
  if (!plan.repo_root || !plan.run_root || !plan.archive_root || !isPathInside(plan.repo_root, plan.run_root)) {
    throw new Error("refusing retention apply with an invalid run root");
  }
  await ensureWorkspaceRoot(path.resolve(plan.repo_root));
  const realRunRoot = await assertWorkspacePathBoundary(
    plan.repo_root,
    plan.run_root,
    "run root",
    { mustExist: true },
  );
  await assertArchiveRootLocation(plan.repo_root, plan.archive_root);
  if (isPathInside(plan.run_root, plan.archive_root) || path.resolve(plan.run_root) === path.resolve(plan.archive_root)) {
    throw new Error("archive root must not be inside the run root");
  }
  if (new Set(archiveNames).size !== archiveNames.length) {
    throw new Error("retention plan contains duplicate archive entries");
  }
  for (const name of archiveNames) {
    if (!isSafeRunName(name)) throw new Error(`invalid run directory name in retention plan: ${name}`);
  }

  const currentPlan = await buildRetentionPlan({
    repo: plan.repo_root,
    runRoot: plan.run_root,
    keepLatest: plan.keep_latest_override === null || plan.keep_latest_override === undefined
      ? undefined
      : plan.keep_latest_override,
    archiveRoot: plan.archive_root,
  });
  const currentArchive = new Set(currentPlan.archive);
  const unsafeNow = archiveNames.filter((name) => !currentArchive.has(name));
  if (unsafeNow.length > 0) {
    throw new Error(`retention plan is stale; runs are no longer safe to archive: ${unsafeNow.join(", ")}`);
  }

  const moves = [];
  for (const name of archiveNames) {
    const source = path.join(plan.run_root, name);
    const destination = path.join(plan.archive_root, name);
    const sourceStats = await fs.lstat(source);
    if (!sourceStats.isDirectory() || sourceStats.isSymbolicLink()) {
      throw new Error(`run source must remain a real directory: ${source}`);
    }
    const realSource = await fs.realpath(source);
    if (path.dirname(realSource) !== realRunRoot) {
      throw new Error(`run directory resolves outside the selected run root: ${source}`);
    }
    if (await pathEntryExists(destination)) {
      throw new Error(`archive destination already exists: ${destination}`);
    }
    moves.push({
      name,
      source,
      destination,
      realSource,
      sourceDevice: sourceStats.dev,
      sourceInode: sourceStats.ino,
    });
  }

  await fs.mkdir(plan.archive_root, { recursive: true });
  const realArchiveRoot = await assertArchiveRootLocation(
    plan.repo_root,
    plan.archive_root,
    { mustExist: true },
  );
  const realRepoRoot = await fs.realpath(plan.repo_root);
  const realArchiveBase = await fs.realpath(path.join(plan.repo_root, "archive"));
  if (realArchiveBase !== path.join(realRepoRoot, "archive") || !isPathInside(realArchiveBase, realArchiveRoot)) {
    throw new Error("archive root must resolve inside the workspace archive directory");
  }
  if (isPathInside(realRunRoot, realArchiveRoot)) {
    throw new Error("archive root must not resolve inside the run root");
  }
  const archived = [];
  for (const move of moves) {
    if (await pathEntryExists(move.destination)) {
      throw new Error(`archive destination appeared after preflight: ${move.destination}`);
    }
    const currentSourceStats = await fs.lstat(move.source);
    const currentRealSource = await fs.realpath(move.source);
    if (!currentSourceStats.isDirectory()
      || currentSourceStats.isSymbolicLink()
      || currentSourceStats.dev !== move.sourceDevice
      || currentSourceStats.ino !== move.sourceInode
      || currentRealSource !== move.realSource
      || path.dirname(currentRealSource) !== realRunRoot) {
      throw new Error(`run directory changed after preflight: ${move.source}`);
    }
    await fs.rename(move.source, move.destination);
    archived.push(move.name);
  }
  return {
    dry_run: false,
    applied: true,
    archived,
  };
}

function renderPlan(result = {}) {
  const lines = [
    `repo_root: ${result.repo_root}`,
    `run_root: ${result.run_root}`,
    `project: ${result.project || "(shared)"}`,
    `archive_root: ${result.archive_root}`,
    `mode: ${result.dry_run ? "dry-run" : "apply"}`,
    `keep_latest: ${result.keep_latest}`,
    `keep_explicit: ${result.keep_explicit.length > 0 ? result.keep_explicit.join(", ") : "(none)"}`,
    `keep_protected: ${result.keep_protected.length > 0 ? result.keep_protected.join(", ") : "(none)"}`,
    `keep: ${result.keep.length > 0 ? result.keep.join(", ") : "(none)"}`,
    `archive: ${result.archive.length > 0 ? result.archive.join(", ") : "(none)"}`,
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = await buildRetentionPlan(options);
  const applied = await applyRetentionPlan(plan, options);
  const result = {
    ...plan,
    ...applied,
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  process.stdout.write(renderPlan(result));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);
if (entryPath === modulePath) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export {
  applyRetentionPlan,
  buildRetentionPlan,
  discoverRunRoots,
  findCodexRunsEntry,
  inspectRunDirectory,
  loadRunIndexRecords,
  parseArgs,
  renderPlan,
  resolveRunRoot,
};
