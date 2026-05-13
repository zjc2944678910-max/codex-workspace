#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const TRACKABLE_EXACT_PATHS = new Set([
  "AGENTS.md",
  "WORKER.md",
  "CLAUDE.md",
  ".gitignore",
  ".codex/config.toml",
  ".codex/hooks.json",
  "README.md",
  "WORKSPACE_MAP.md",
  "ops/README.md",
  "ops/projects/README.md",
  "ops/projects/PROJECT_TEMPLATE.md",
]);

const TRACKABLE_PREFIXES = [
  ".codex/agents/",
  ".codex/hooks/",
  "docs/",
];

const PROJECT_OPS_DOCS = new Set([
  "README.md",
  "DEPLOYMENT_LEDGER.md",
  "ARCHITECTURE_TODO.md",
]);

const PROJECT_OPS_TRACKED_DIRS = new Set([
  "manifests",
  "reports",
  "runbooks",
]);

const THEME_PRIORITY = new Map([
  ["workspace", 0],
  ["codex-config", 1],
  ["docs", 2],
  ["ops", 3],
  ["hygiene", 4],
]);

function parseArgs(argv = []) {
  const options = {
    repo: "",
    checkpointCommit: false,
    checkpointMessage: "",
    turnId: "",
    dryRun: false,
    json: false,
    quiet: false,
    auto: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--repo") {
      options.repo = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--checkpoint-commit") {
      options.checkpointCommit = true;
      continue;
    }
    if (arg === "--checkpoint-message") {
      options.checkpointMessage = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--turn-id") {
      options.turnId = String(argv[index + 1] || "").trim();
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
    if (arg === "--quiet") {
      options.quiet = true;
      continue;
    }
    if (arg === "--auto") {
      options.auto = true;
      options.checkpointCommit = true;
      options.json = true;
      options.quiet = true;
    }
  }
  return options;
}

function runGit(repoRoot, args, options = {}) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 && options.allowFailure !== true) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return result;
}

function resolveRepoRoot(cwd = process.cwd()) {
  const result = spawnSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `failed to resolve repo root from ${cwd}`).trim());
  return result.stdout.trim();
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureWorkspaceRoot(repoRoot) {
  const requiredPaths = [
    path.join(repoRoot, "AGENTS.md"),
    path.join(repoRoot, "docs", "workspace"),
    path.join(repoRoot, ".codex", "config.toml"),
  ];
  for (const requiredPath of requiredPaths) {
    if (!(await pathExists(requiredPath))) throw new Error(`unsupported root repo for repo hygiene: ${repoRoot}`);
  }
}

function parseStatusEntries(repoRoot) {
  return runGit(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]).stdout
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      raw: line,
      code: line.slice(0, 2),
      path: line.slice(3),
    }));
}

function expandStatusPath(statusPath = "") {
  const normalized = String(statusPath || "").trim();
  if (!normalized.includes(" -> ")) return [normalized].filter(Boolean);
  return normalized.split(" -> ").map((entry) => entry.trim()).filter(Boolean);
}

function classifyStatusEntries(entries = []) {
  const summary = {
    modifiedTracked: [],
    untrackedSource: [],
    otherTracked: [],
  };
  for (const entry of entries) {
    const paths = expandStatusPath(entry.path);
    if (entry.raw.startsWith("?? ")) {
      summary.untrackedSource.push(...paths);
      continue;
    }
    if (/[MACRUDT]/u.test(entry.code)) {
      summary.modifiedTracked.push(...paths);
      continue;
    }
    summary.otherTracked.push(...paths);
  }
  return summary;
}

function isTrackablePath(relativePath) {
  const normalized = String(relativePath || "").trim().replace(/\\/g, "/");
  if (!normalized) return false;
  if (TRACKABLE_EXACT_PATHS.has(normalized)) return true;
  if (TRACKABLE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;

  const projectOpsMatch = normalized.match(/^ops\/projects\/([^/]+)\/([^/]+)$/u);
  if (projectOpsMatch && PROJECT_OPS_DOCS.has(projectOpsMatch[2])) return true;

  const projectOpsSubdirMatch = normalized.match(/^ops\/projects\/[^/]+\/([^/]+)\/.+/u);
  if (projectOpsSubdirMatch && PROJECT_OPS_TRACKED_DIRS.has(projectOpsSubdirMatch[1])) return true;

  return false;
}

function summarizePathForCheckpoint(relativePath) {
  const normalized = String(relativePath || "").trim().replace(/\\/g, "/");
  if (!normalized) return "";
  if (normalized === ".gitignore") return "hygiene";
  if (normalized === "AGENTS.md" || normalized === "WORKER.md" || normalized === "CLAUDE.md" || normalized === "README.md" || normalized === "WORKSPACE_MAP.md") return "workspace";
  if (normalized.startsWith(".codex/")) return "codex-config";
  if (normalized.startsWith("docs/")) {
    if (normalized.startsWith("docs/workspace/")) return "workspace";
    return "docs";
  }
  if (normalized.startsWith("ops/")) return "ops";
  return "workspace";
}

function summarizeCheckpointScope(summary = {}) {
  const pendingPaths = [
    ...(summary.modifiedTracked || []),
    ...(summary.untrackedSource || []),
    ...(summary.otherTracked || []),
  ];
  const counts = new Map();
  for (const entry of pendingPaths) {
    const label = summarizePathForCheckpoint(entry);
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  const labels = [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      const leftPriority = THEME_PRIORITY.get(left[0]) ?? 99;
      const rightPriority = THEME_PRIORITY.get(right[0]) ?? 99;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left[0].localeCompare(right[0]);
    })
    .map(([label]) => label);
  if (labels.length === 0) return "";
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

function buildCheckpointCommitMessage(options = {}, statusSummary = {}) {
  const explicit = String(options.checkpointMessage || "").trim();
  if (explicit) return explicit;
  const turnId = String(options.turnId || "").trim();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/u, "Z");
  const scope = summarizeCheckpointScope(statusSummary);
  const metadata = [turnId || timestamp, scope].filter(Boolean).join("; ");
  return `chore: codex workspace checkpoint (${metadata})`;
}

function createCheckpointCommit(repoRoot, statusSummary = {}, options = {}) {
  const pendingPaths = [
    ...(statusSummary.modifiedTracked || []),
    ...(statusSummary.untrackedSource || []),
    ...(statusSummary.otherTracked || []),
  ];
  if (pendingPaths.length === 0) {
    return { ok: true, skipped: "no_source_changes" };
  }
  const blockedPaths = pendingPaths.filter((entry) => !isTrackablePath(entry));
  if (blockedPaths.length > 0) {
    return {
      ok: false,
      skipped: "non_trackable_paths_present",
      blocked_paths: blockedPaths,
    };
  }
  if (options.dryRun === true) {
    return {
      ok: true,
      dry_run: true,
      message: buildCheckpointCommitMessage(options, statusSummary),
    };
  }
  runGit(repoRoot, ["add", "-A"]);
  const message = buildCheckpointCommitMessage(options, statusSummary);
  const commitResult = runGit(repoRoot, ["commit", "-m", message], { allowFailure: true });
  if (commitResult.status !== 0) {
    return {
      ok: false,
      message,
      error: (commitResult.stderr || commitResult.stdout || "git commit failed").trim(),
    };
  }
  return {
    ok: true,
    message,
    commit: runGit(repoRoot, ["rev-parse", "HEAD"]).stdout.trim(),
  };
}

async function loadProjectRegistry(repoRoot) {
  const registryPath = path.join(repoRoot, "docs", "workspace", "project-registry.json");
  try {
    const raw = await fs.readFile(registryPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function listProjectSurfaces(repoRoot) {
  const projectRoots = [];
  for (const kind of ["products", "infrastructure", "research", "migrations"]) {
    const kindDir = path.join(repoRoot, "projects", kind);
    try {
      const entries = await fs.readdir(kindDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          projectRoots.push(`projects/${kind}/${entry.name}`);
        }
      }
    } catch { /* kind dir may not exist */ }
  }
  return projectRoots.sort();
}

function findUnregisteredSurfaces(projectSurfaces, registry) {
  if (!registry || !registry.projects) return projectSurfaces;
  const registered = new Set();
  for (const proj of registry.projects) {
    const candidates = Array.isArray(proj.surfaces) && proj.surfaces.length > 0
      ? proj.surfaces
      : (proj.code_roots || []);
    for (const entry of candidates) {
      const root = typeof entry === "string"
        ? entry
        : (typeof entry?.surface === "string" ? entry.surface : "");
      const normalized = String(root || "").replace(/\\/g, "/");
      if (/^projects\/[^/]+\/[^/]+$/u.test(normalized)) {
        registered.add(normalized);
      }
    }
  }
  return projectSurfaces.filter((surface) => !registered.has(surface));
}

const PROJECTS_REF_RE = /(?<!\/)projects\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*/gu;

async function walkMdFiles(dirPath) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function findNonexistentProjectRefs(repoRoot) {
  const scanFiles = [];
  // Root-level policy docs only (exclude WORKSPACE_MAP.md which contains legacy mapping paths)
  const rootDocs = ["README.md", "AGENTS.md"];
  for (const name of rootDocs) {
    scanFiles.push(path.join(repoRoot, name));
  }
  // docs/workspace/*.md (not recursive — only workspace entrypoints)
  try {
    const wsDir = path.join(repoRoot, "docs", "workspace");
    const entries = await fs.readdir(wsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        scanFiles.push(path.join(wsDir, entry.name));
      }
    }
  } catch { /* docs/workspace may not exist */ }
  // ops/projects/*/README.md only (entrypoint READMEs, not deep manifests/reports)
  try {
    const opsDir = path.join(repoRoot, "ops", "projects");
    const opsEntries = await fs.readdir(opsDir, { withFileTypes: true });
    for (const entry of opsEntries) {
      if (entry.isDirectory()) {
        const readmePath = path.join(opsDir, entry.name, "README.md");
        if (await pathExists(readmePath)) {
          scanFiles.push(readmePath);
        }
      }
    }
  } catch { /* ops/projects may not exist */ }

  const missing = [];
  const seen = new Set();
  for (const filePath of scanFiles) {
    let content;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const match of content.matchAll(PROJECTS_REF_RE)) {
      const ref = match[0];
      if (seen.has(ref)) continue;
      seen.add(ref);
      const absRef = path.join(repoRoot, ref);
      if (!(await pathExists(absRef))) {
        missing.push(ref);
      }
    }
  }
  return missing.sort();
}

async function buildRepoHygieneSummary(options = {}) {
  const repoRoot = path.resolve(options.repo || resolveRepoRoot(options.cwd || process.cwd()));
  await ensureWorkspaceRoot(repoRoot);

  const beforeStatus = classifyStatusEntries(parseStatusEntries(repoRoot));
  const checkpointCommit = options.checkpointCommit ? createCheckpointCommit(repoRoot, beforeStatus, options) : null;
  const afterStatus = classifyStatusEntries(parseStatusEntries(repoRoot));

  const registry = await loadProjectRegistry(repoRoot);
  const projectSurfaces = await listProjectSurfaces(repoRoot);
  const unregisteredSurfaces = findUnregisteredSurfaces(projectSurfaces, registry);
  const nonexistentRefs = await findNonexistentProjectRefs(repoRoot);

  return {
    repo_root: repoRoot,
    dry_run: options.dryRun === true,
    checkpoint_commit_requested: options.checkpointCommit === true,
    before: {
      modified_tracked: beforeStatus.modifiedTracked,
      untracked_source: beforeStatus.untrackedSource,
      other_tracked: beforeStatus.otherTracked,
    },
    after: {
      modified_tracked: afterStatus.modifiedTracked,
      untracked_source: afterStatus.untrackedSource,
      other_tracked: afterStatus.otherTracked,
    },
    checkpoint_commit: checkpointCommit,
    git_clean: afterStatus.modifiedTracked.length === 0 && afterStatus.untrackedSource.length === 0 && afterStatus.otherTracked.length === 0,
    unregistered_project_surfaces: unregisteredSurfaces,
    nonexistent_project_references: nonexistentRefs,
  };
}

function renderSummary(summary) {
  const lines = [
    `repo_root: ${summary.repo_root}`,
    `git_clean: ${summary.git_clean ? "yes" : "no"}`,
    `checkpoint_commit: ${summary.checkpoint_commit?.commit || summary.checkpoint_commit?.skipped || "(none)"}`,
    `modified_tracked: ${summary.after.modified_tracked.length}`,
    `untracked_source: ${summary.after.untracked_source.length}`,
  ];
  if (summary.unregistered_project_surfaces?.length > 0) {
    lines.push(`unregistered_project_surfaces: ${summary.unregistered_project_surfaces.join(", ")}`);
  }
  if (summary.nonexistent_project_references?.length > 0) {
    lines.push(`nonexistent_project_references: ${summary.nonexistent_project_references.join(", ")}`);
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await buildRepoHygieneSummary(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }
  if (!options.quiet) process.stdout.write(renderSummary(summary));
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
  buildRepoHygieneSummary,
  buildCheckpointCommitMessage,
  classifyStatusEntries,
  expandStatusPath,
  findNonexistentProjectRefs,
  findUnregisteredSurfaces,
  isTrackablePath,
  listProjectSurfaces,
  loadProjectRegistry,
  renderSummary,
  resolveRepoRoot,
  summarizeCheckpointScope,
};
