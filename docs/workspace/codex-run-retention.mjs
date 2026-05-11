#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_KEEP = 10;

function parseArgs(argv = []) {
  const options = {
    repo: "",
    dryRun: false,
    json: false,
    keepLatest: undefined,
    archiveRoot: "",
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

async function loadScratchRetention(repoRoot) {
  const retentionPath = path.join(repoRoot, "docs", "workspace", "scratch-retention.json");
  const raw = await fs.readFile(retentionPath, "utf8");
  return JSON.parse(raw);
}

function findCodexRunsEntry(retentionManifest = {}) {
  return (retentionManifest.entries || []).find((entry) => entry.path === "scratch/shared/codex-runs") || null;
}

function normalizeKeepSet(entry = {}) {
  return new Set((entry.keep || []).map((value) => String(value || "").trim()).filter(Boolean));
}

async function buildRetentionPlan(options = {}) {
  const repoRoot = path.resolve(options.repo || process.cwd());
  await ensureWorkspaceRoot(repoRoot);
  const runRoot = path.join(repoRoot, "scratch", "shared", "codex-runs");
  const retentionManifest = await loadScratchRetention(repoRoot);
  const codexRunsEntry = findCodexRunsEntry(retentionManifest);
  const keepExplicit = normalizeKeepSet(codexRunsEntry || {});
  const runDirs = await listRunDirs(runRoot);
  const keepLatestSource = options.keepLatest ?? codexRunsEntry?.keep_latest ?? DEFAULT_KEEP;
  const keepLatest = Math.max(0, Number(keepLatestSource || 0));
  const latestNames = runDirs.slice(-keepLatest);
  const keep = new Set([...latestNames, ...keepExplicit]);
  const archive = runDirs.filter((name) => !keep.has(name));
  const archiveRoot = path.resolve(
    options.archiveRoot || path.join(repoRoot, "archive", "cleanup", "2026-05-11-codex-runs-rotation", "scratch", "shared", "codex-runs"),
  );

  return {
    repo_root: repoRoot,
    run_root: runRoot,
    archive_root: archiveRoot,
    keep_latest: keepLatest,
    keep_explicit: [...keepExplicit].sort(),
    keep: runDirs.filter((name) => keep.has(name)),
    archive,
  };
}

async function applyRetentionPlan(plan = {}, options = {}) {
  if (options.dryRun === true || plan.archive.length === 0) {
    return {
      dry_run: options.dryRun === true,
      archived: [],
    };
  }
  await fs.mkdir(plan.archive_root, { recursive: true });
  const archived = [];
  for (const name of plan.archive) {
    const source = path.join(plan.run_root, name);
    const destination = path.join(plan.archive_root, name);
    await fs.rename(source, destination);
    archived.push(name);
  }
  return {
    dry_run: false,
    archived,
  };
}

function renderPlan(result = {}) {
  const lines = [
    `repo_root: ${result.repo_root}`,
    `run_root: ${result.run_root}`,
    `archive_root: ${result.archive_root}`,
    `keep_latest: ${result.keep_latest}`,
    `keep_explicit: ${result.keep_explicit.length > 0 ? result.keep_explicit.join(", ") : "(none)"}`,
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
  findCodexRunsEntry,
  parseArgs,
  renderPlan,
};
