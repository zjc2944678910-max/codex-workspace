#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { inspectRunDirectory, loadRunIndexRecords } from "./codex-run-retention.mjs";
import { classifyCleanupBucket, formatBytes } from "./workspace-disk-report.mjs";

const DEFAULT_LIMIT = 25;
const DEFAULT_STALE_DAYS = 7;
const GENERATED_DIRECTORY_NAMES = new Set([
  ".build",
  ".cache",
  ".next",
  ".pio",
  ".pytest_cache",
  ".venv",
  "Build",
  "DerivedData",
  "SourcePackages",
  "__pycache__",
  "build",
  "dist",
  "node_modules",
  "target",
  "venv",
  "vendor",
]);
const PROTECTED_PATH_SEGMENTS = new Set([
  ".git",
  ".worktree",
  ".worktrees",
  "rollback",
  "worktree",
  "worktrees",
]);

function parseArgs(argv = []) {
  const options = {
    repo: "",
    json: false,
    limit: DEFAULT_LIMIT,
    staleDays: DEFAULT_STALE_DAYS,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--repo") {
      options.repo = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--limit") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) options.limit = parsed;
      index += 1;
      continue;
    }
    if (arg === "--stale-days") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) options.staleDays = parsed;
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
      throw new Error(`unsupported workspace root for deep disk audit: ${repoRoot}`);
    }
  }
}

function normalizedRelativePath(value = "") {
  return String(value || "").replace(/\\/gu, "/").replace(/^\.\//u, "");
}

function emptyMetrics() {
  return { bytes: 0, logical_bytes: 0, file_count: 0, directory_count: 0 };
}

function addMetrics(target, source) {
  target.bytes += Number(source.bytes || 0);
  target.logical_bytes += Number(source.logical_bytes || 0);
  target.file_count += Number(source.file_count || 0);
  target.directory_count += Number(source.directory_count || 0);
  return target;
}

function allocatedBytes(stats) {
  return Number.isFinite(stats?.blocks)
    ? Math.max(0, stats.blocks) * 512
    : Number(stats?.size || 0);
}

function isGeneratedDirectory(name = "") {
  if (GENERATED_DIRECTORY_NAMES.has(name)) return true;
  const normalized = String(name || "").toLowerCase();
  return normalized.startsWith(".build")
    || normalized === "deriveddata"
    || normalized.includes("derived-data")
    || normalized.endsWith("-derived")
    || normalized.includes("-derived-")
    || normalized.endsWith(".noindex");
}

function isProtectedPathSegment(segment = "") {
  const normalized = String(segment || "").toLowerCase();
  return PROTECTED_PATH_SEGMENTS.has(normalized)
    || normalized.startsWith("rollback-")
    || normalized.startsWith("rollback_");
}

function isSourceSnapshotPath(relativePath = "") {
  const basename = path.posix.basename(normalizedRelativePath(relativePath)).toLowerCase();
  return /(?:source[-_]?snapshot|snapshot[-_]?source)/u.test(basename);
}

function runDirectoryInfo(absolutePath, relativePath) {
  const normalized = normalizedRelativePath(relativePath);
  const match = normalized.match(/^scratch\/(?:shared|projects\/[^/]+)\/codex-runs\/([^/]+)$/u);
  if (!match) return null;
  return {
    runRoot: path.dirname(absolutePath),
    name: match[1],
    path: normalized,
  };
}

function pathIsCoveredBy(parentPath, candidatePath) {
  return candidatePath === parentPath || candidatePath.startsWith(`${parentPath}/`);
}

function uniqueCandidateBytes(items = []) {
  const selected = [];
  const sorted = [...items].sort((left, right) => {
    const depth = left.path.split("/").length - right.path.split("/").length;
    return depth || left.path.localeCompare(right.path);
  });
  for (const item of sorted) {
    if (selected.some((entry) => pathIsCoveredBy(entry.path, item.path))) continue;
    selected.push(item);
  }
  return {
    bytes: selected.reduce((sum, entry) => sum + Number(entry.bytes || 0), 0),
    paths: selected.map((entry) => entry.path),
  };
}

function summarizeCandidates(items = [], limit = DEFAULT_LIMIT) {
  const sorted = [...items].sort((left, right) => {
    if (right.bytes !== left.bytes) return right.bytes - left.bytes;
    return left.path.localeCompare(right.path);
  });
  const bytes = sorted.reduce((sum, entry) => sum + Number(entry.bytes || 0), 0);
  return {
    count: sorted.length,
    bytes,
    pretty: formatBytes(bytes),
    items: sorted.slice(0, limit),
    truncated: sorted.length > limit,
  };
}

function candidateEntry(relativePath, metrics, fields = {}) {
  return {
    path: normalizedRelativePath(relativePath),
    bytes: metrics.bytes,
    logical_bytes: metrics.logical_bytes,
    pretty: formatBytes(metrics.bytes),
    ...fields,
  };
}

async function buildWorkspaceDeepAudit(options = {}) {
  const repoRoot = path.resolve(options.repo || process.cwd());
  await ensureWorkspaceRoot(repoRoot);
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
  const staleDays = Number.isFinite(options.staleDays) && options.staleDays >= 0
    ? options.staleDays
    : DEFAULT_STALE_DAYS;
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (!Number.isFinite(now.getTime())) throw new Error(`invalid deep-audit date: ${options.now}`);
  const staleThresholdMs = now.getTime() - staleDays * 24 * 60 * 60 * 1000;
  const seenInodes = new Set();
  const scanErrors = [];
  const generatedCaches = [];
  const staleIncompleteDownloads = [];
  const sourceSnapshots = [];
  const completedRuns = [];
  const snapshotGeneratedChildren = new Map();
  const indexRecords = await loadRunIndexRecords(repoRoot);

  async function scan(absolutePath, relativePath, context = {}) {
    let stats;
    try {
      stats = await fs.lstat(absolutePath);
    } catch (error) {
      if (["EACCES", "ENOENT", "EPERM"].includes(error?.code)) {
        scanErrors.push({ path: normalizedRelativePath(relativePath), code: error.code, operation: "lstat" });
        return emptyMetrics();
      }
      throw error;
    }
    const inodeKey = !stats.isDirectory() && stats.nlink > 1 && Number.isFinite(stats.dev) && Number.isFinite(stats.ino)
      ? `${stats.dev}:${stats.ino}`
      : "";
    if (inodeKey && seenInodes.has(inodeKey)) return emptyMetrics();
    if (inodeKey) seenInodes.add(inodeKey);

    const metrics = {
      bytes: allocatedBytes(stats),
      logical_bytes: Number(stats.size || 0),
      file_count: stats.isDirectory() ? 0 : 1,
      directory_count: stats.isDirectory() ? 1 : 0,
    };
    const normalized = normalizedRelativePath(relativePath);
    const pathSegments = normalized.split("/").filter(Boolean);
    const currentRunInfo = stats.isDirectory() ? runDirectoryInfo(absolutePath, normalized) : null;
    const currentRun = currentRunInfo
      ? await inspectRunDirectory(currentRunInfo.runRoot, currentRunInfo.name, {
          indexRecords: indexRecords.by_run_root,
          requireIndex: true,
        })
      : null;
    const protectedPath = context.protectedPath === true
      || pathSegments.some(isProtectedPathSegment)
      || pathSegments[0] === "archive"
      || currentRun?.protected === true;

    if (!stats.isDirectory()) {
      if (!protectedPath && normalized.endsWith(".incomplete") && stats.mtimeMs <= staleThresholdMs) {
        const ageDays = Math.floor((now.getTime() - stats.mtimeMs) / (24 * 60 * 60 * 1000));
        staleIncompleteDownloads.push(candidateEntry(normalized, metrics, {
          bucket: "delete",
          age_days: ageDays,
          reason: `incomplete download older than ${staleDays} days`,
        }));
      }
      return metrics;
    }

    const name = path.basename(absolutePath);
    const sourceSnapshotRoot = !protectedPath && isSourceSnapshotPath(normalized)
      ? normalized
      : context.sourceSnapshotRoot || "";
    if (sourceSnapshotRoot && !snapshotGeneratedChildren.has(sourceSnapshotRoot)) {
      snapshotGeneratedChildren.set(sourceSnapshotRoot, new Set());
    }
    const generatedRoot = !protectedPath && isGeneratedDirectory(name) && context.insideGenerated !== true;
    const childContext = {
      protectedPath,
      sourceSnapshotRoot,
      insideGenerated: context.insideGenerated === true || generatedRoot,
    };
    let entries = [];
    try {
      entries = await fs.readdir(absolutePath, { withFileTypes: true });
    } catch (error) {
      if (["EACCES", "ENOENT", "EPERM"].includes(error?.code)) {
        scanErrors.push({ path: normalized, code: error.code, operation: "readdir" });
        return metrics;
      }
      throw error;
    }
    for (const entry of entries) {
      addMetrics(metrics, await scan(
        path.join(absolutePath, entry.name),
        path.posix.join(normalized, entry.name),
        childContext,
      ));
    }

    if (generatedRoot) {
      const item = candidateEntry(normalized, metrics, {
        bucket: "ask",
        reason: "generated dependency, cache, or build directory; review before cleanup",
      });
      generatedCaches.push(item);
      if (sourceSnapshotRoot) snapshotGeneratedChildren.get(sourceSnapshotRoot).add(normalized);
    }

    if (!protectedPath && isSourceSnapshotPath(normalized)) {
      const generatedChildren = [...(snapshotGeneratedChildren.get(normalized) || [])].sort();
      if (generatedChildren.length > 0) {
        sourceSnapshots.push(candidateEntry(normalized, metrics, {
          bucket: "ask",
          generated_child_count: generatedChildren.length,
          generated_children: generatedChildren.slice(0, limit),
          reason: "source snapshot contains generated build or cache directories",
        }));
      }
    }

    if (currentRunInfo && currentRun?.terminal) {
        completedRuns.push(candidateEntry(normalized, metrics, {
          bucket: currentRun.protected ? "keep" : "archive",
          status: currentRun.status,
          phase: currentRun.phase,
          protected: currentRun.protected,
          protection_reasons: currentRun.protection_reasons,
          reason: currentRun.protected
            ? "completed run still has a protected awaiting or blocked phase"
            : "completed long-task run artifact; archive or delete only after review",
        }));
    }
    return metrics;
  }

  const rootStats = await fs.lstat(repoRoot);
  const rootMetrics = {
    bytes: allocatedBytes(rootStats),
    logical_bytes: Number(rootStats.size || 0),
    file_count: 0,
    directory_count: 1,
  };
  const topLevelPaths = [];
  const rootEntries = await fs.readdir(repoRoot, { withFileTypes: true });
  for (const entry of rootEntries) {
    const relativePath = normalizedRelativePath(entry.name);
    const metrics = await scan(path.join(repoRoot, entry.name), relativePath, {});
    addMetrics(rootMetrics, metrics);
    const classification = classifyCleanupBucket(relativePath);
    topLevelPaths.push(candidateEntry(relativePath, metrics, {
      bucket: classification.bucket,
      reason: classification.reason,
    }));
  }
  topLevelPaths.sort((left, right) => right.bytes - left.bytes || left.path.localeCompare(right.path));

  const reclaimable = uniqueCandidateBytes([
    ...staleIncompleteDownloads,
    ...generatedCaches,
    ...completedRuns.filter((entry) => entry.bucket === "archive"),
  ]);
  const categories = {
    stale_incomplete_downloads: summarizeCandidates(staleIncompleteDownloads, limit),
    generated_caches: summarizeCandidates(generatedCaches, limit),
    source_snapshots_with_generated_content: summarizeCandidates(sourceSnapshots, limit),
    completed_run_artifacts: summarizeCandidates(completedRuns, limit),
  };
  return {
    repo_root: repoRoot,
    read_only: true,
    stale_days: staleDays,
    limit,
    root_usage: {
      ...rootMetrics,
      pretty: formatBytes(rootMetrics.bytes),
      logical_pretty: formatBytes(rootMetrics.logical_bytes),
    },
    top_level_paths: topLevelPaths.slice(0, limit),
    categories,
    estimated_reclaimable_bytes: reclaimable.bytes,
    estimated_reclaimable_pretty: formatBytes(reclaimable.bytes),
    estimated_reclaimable_paths: reclaimable.paths.slice(0, limit),
    estimate_note: "unique stale downloads, generated caches, and unprotected completed-run footprints; review candidates, not deletion authorization",
    cleanup_buckets: {
      keep: completedRuns.filter((entry) => entry.bucket === "keep").slice(0, limit),
      delete: [...staleIncompleteDownloads].sort((left, right) => right.bytes - left.bytes).slice(0, limit),
      archive: completedRuns.filter((entry) => entry.bucket === "archive").sort((left, right) => right.bytes - left.bytes).slice(0, limit),
      ask: [...generatedCaches, ...sourceSnapshots].sort((left, right) => right.bytes - left.bytes).slice(0, limit),
    },
    scan_errors: scanErrors,
    long_task_index_errors: indexRecords.errors,
  };
}

function renderDeepAudit(report = {}) {
  const lines = [
    `repo_root: ${report.repo_root}`,
    `read_only: ${report.read_only ? "yes" : "no"}`,
    `root_actual_usage: ${report.root_usage?.pretty || "0B"}`,
    `root_logical_usage: ${report.root_usage?.logical_pretty || "0B"}`,
    `estimated_reclaimable: ${report.estimated_reclaimable_pretty || "0B"}`,
    `estimate_note: ${report.estimate_note || ""}`,
    `scan_errors: ${(report.scan_errors || []).length}`,
    `long_task_index_errors: ${(report.long_task_index_errors || []).length}`,
    "",
    "top_level_paths:",
  ];
  for (const entry of (report.top_level_paths || [])) {
    lines.push(`- ${entry.pretty}\t${entry.path}\t[${entry.bucket}: ${entry.reason}]`);
  }
  lines.push("", "categories:");
  for (const name of [
    "stale_incomplete_downloads",
    "generated_caches",
    "source_snapshots_with_generated_content",
    "completed_run_artifacts",
  ]) {
    const category = report.categories?.[name] || {};
    lines.push(`${name}: ${category.pretty || "0B"}, ${category.count || 0} items`);
    for (const item of (category.items || [])) {
      lines.push(`- ${item.pretty}\t${item.path}\t[${item.bucket}: ${item.reason}]`);
    }
  }
  if ((report.scan_errors || []).length > 0) {
    lines.push("", "scan_error_paths:");
    for (const error of report.scan_errors) {
      lines.push(`- ${error.path}\t${error.operation}: ${error.code}`);
    }
  }
  if ((report.long_task_index_errors || []).length > 0) {
    lines.push("", "long_task_index_error_paths:");
    for (const error of report.long_task_index_errors) {
      lines.push(`- ${error.path}\t${error.error}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildWorkspaceDeepAudit(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
    return;
  }
  process.stdout.write(renderDeepAudit(report));
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
  buildWorkspaceDeepAudit,
  isGeneratedDirectory,
  isSourceSnapshotPath,
  parseArgs,
  renderDeepAudit,
  summarizeCandidates,
  uniqueCandidateBytes,
};
