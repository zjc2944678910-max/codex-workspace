#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_LIMIT = 25;
const DEFAULT_RETENTION_GAP_BYTES = 100 * 1024 * 1024; // 100MB

function parseArgs(argv = []) {
  const options = {
    repo: "",
    json: false,
    limit: DEFAULT_LIMIT,
    retentionGapThreshold: DEFAULT_RETENTION_GAP_BYTES,
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
    if (arg === "--retention-gap-threshold") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) options.retentionGapThreshold = parsed;
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
      throw new Error(`unsupported workspace root for disk report: ${repoRoot}`);
    }
  }
}

async function listChildDirs(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!(await pathExists(absolutePath))) return [];
  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.posix.join(relativePath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function collectInventoryPaths(repoRoot) {
  const candidates = new Set([
    ".codex",
    "archive",
    "docs",
    "ops",
    "ops/projects",
    "projects",
    "projects/infrastructure",
    "projects/migrations",
    "projects/products",
    "projects/research",
    "scratch",
    "scratch/projects",
    "scratch/shared",
    "state",
  ]);

  const parentDirs = [
    "archive",
    "ops/projects",
    "projects/infrastructure",
    "projects/migrations",
    "projects/products",
    "projects/research",
    "scratch/projects",
    "scratch/shared",
    "state",
  ];
  for (const opsProjectDir of await listChildDirs(repoRoot, "ops/projects")) {
    parentDirs.push(opsProjectDir);
  }

  for (const parent of parentDirs) {
    for (const child of await listChildDirs(repoRoot, parent)) {
      candidates.add(child);
    }
  }

  const existing = [];
  for (const candidate of candidates) {
    if (await pathExists(path.join(repoRoot, candidate))) existing.push(candidate);
  }
  return existing.sort((left, right) => left.localeCompare(right));
}

async function directorySize(targetPath) {
  let total = 0;
  let entries;
  try {
    entries = await fs.readdir(targetPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOTDIR") {
      const stats = await fs.lstat(targetPath);
      return stats.size;
    }
    if (error?.code === "ENOENT" || error?.code === "EACCES") return 0;
    throw error;
  }

  for (const entry of entries) {
    const absolute = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(absolute);
      continue;
    }
    try {
      const stats = await fs.lstat(absolute);
      total += stats.size;
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "EACCES") throw error;
    }
  }
  return total;
}

function opsProjectSubdir(normalized = "") {
  const match = String(normalized).match(/^ops\/projects\/[^/]+(?:\/([^/]+))?/u);
  return match?.[1] || "";
}

function classifyCleanupBucket(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/").replace(/^\.\/+/u, "");
  if (!normalized) return { bucket: "ask", reason: "unknown" };
  if (normalized === ".codex" || normalized === "docs" || normalized.startsWith("docs/")) {
    return { bucket: "keep", reason: "workspace source of truth" };
  }
  if (normalized === "projects" || normalized.startsWith("projects/")) {
    return { bucket: "keep", reason: "project source or reference tree" };
  }
  if (normalized.startsWith("ops/projects/")) {
    const subdir = opsProjectSubdir(normalized);
    if (subdir === "rollback") {
      return { bucket: "keep", reason: "live rollback backup" };
    }
    if (subdir === "manifests") {
      return { bucket: "keep", reason: "operator manifest source of truth" };
    }
    if (subdir === "evidence" || subdir === "logs" || subdir === "quarantine") {
      return { bucket: "archive", reason: "operator evidence or quarantine" };
    }
    return { bucket: "keep", reason: "operator documentation" };
  }
  if (normalized.startsWith("archive")) {
    return { bucket: "archive", reason: "retired material" };
  }
  if (normalized.startsWith("scratch")) {
    return { bucket: "ask", reason: "temporary workspace output" };
  }
  if (normalized.startsWith("state")) {
    return { bucket: "ask", reason: "local machine state" };
  }
  if (normalized.startsWith("ops")) {
    return { bucket: "keep", reason: "operator documentation" };
  }
  return { bucket: "ask", reason: "unclassified workspace path" };
}

function isObviousGarbage(relativePath) {
  const basename = path.basename(relativePath);
  return basename === ".DS_Store"
    || basename === "Thumbs.db"
    || basename.endsWith(".pyc")
    || relativePath.split(path.sep).includes("__pycache__");
}

async function collectObviousGarbage(repoRoot, options = {}) {
  const garbage = {
    count: 0,
    bytes: 0,
    samples: [],
  };
  const sampleLimit = options.sampleLimit || 20;

  async function walk(currentPath) {
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "EACCES") return;
      throw error;
    }
    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const absolute = path.join(currentPath, entry.name);
      const relative = path.relative(repoRoot, absolute);
      if (entry.isDirectory()) {
        if (isObviousGarbage(relative)) {
          const bytes = await directorySize(absolute);
          garbage.count += 1;
          garbage.bytes += bytes;
          if (garbage.samples.length < sampleLimit) garbage.samples.push(relative.replace(/\\/g, "/"));
          continue;
        }
        await walk(absolute);
        continue;
      }
      if (!isObviousGarbage(relative)) continue;
      const stats = await fs.lstat(absolute);
      garbage.count += 1;
      garbage.bytes += stats.size;
      if (garbage.samples.length < sampleLimit) garbage.samples.push(relative.replace(/\\/g, "/"));
    }
  }

  await walk(repoRoot);
  return garbage;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value}B`;
  const units = ["K", "M", "G", "T"];
  let scaled = value / 1024;
  for (const unit of units) {
    if (scaled < 1024 || unit === units[units.length - 1]) {
      return `${scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1)}${unit}`;
    }
    scaled /= 1024;
  }
  return `${value}B`;
}

async function loadScratchRetention(repoRoot) {
  const manifestPath = path.join(repoRoot, "docs", "workspace", "scratch-retention.json");
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findRetentionGaps(entries, retentionManifest, thresholdBytes) {
  if (!retentionManifest || !retentionManifest.entries) return [];
  const covered = new Set(
    retentionManifest.entries.map((e) => String(e.path || "").replace(/\\/g, "/")),
  );
  const coversPath = (coveredPath, entryPath) => {
    if (entryPath === coveredPath) return true;
    if (coveredPath === "scratch/projects" || coveredPath === "scratch/shared") return false;
    return entryPath.startsWith(`${coveredPath}/`);
  };
  return entries
    .filter((entry) => {
      if (!entry.path.startsWith("scratch/")) return false;
      if (entry.bytes < thresholdBytes) return false;
      return ![...covered].some((c) => coversPath(c, entry.path));
    })
    .map((entry) => ({
      path: entry.path,
      bytes: entry.bytes,
      pretty: entry.pretty,
      reason: "scratch path >= threshold with no retention entry",
    }));
}

async function buildWorkspaceDiskReport(options = {}) {
  const repoRoot = path.resolve(options.repo || process.cwd());
  await ensureWorkspaceRoot(repoRoot);
  const inventoryPaths = await collectInventoryPaths(repoRoot);
  const entries = [];
  for (const relativePath of inventoryPaths) {
    const absolutePath = path.join(repoRoot, relativePath);
    const bytes = await directorySize(absolutePath);
    const classification = classifyCleanupBucket(relativePath);
    entries.push({
      path: relativePath,
      bytes,
      pretty: formatBytes(bytes),
      bucket: classification.bucket,
      reason: classification.reason,
    });
  }
  entries.sort((left, right) => {
    if (right.bytes !== left.bytes) return right.bytes - left.bytes;
    return left.path.localeCompare(right.path);
  });

  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
  const obviousGarbage = await collectObviousGarbage(repoRoot);
  const retentionManifest = await loadScratchRetention(repoRoot);
  const retentionThreshold = Number.isFinite(options.retentionGapThreshold)
    ? options.retentionGapThreshold
    : DEFAULT_RETENTION_GAP_BYTES;
  const retentionGaps = findRetentionGaps(entries, retentionManifest, retentionThreshold);
  return {
    repo_root: repoRoot,
    limit,
    largest_paths: entries.slice(0, limit),
    cleanup_buckets: {
      keep: entries.filter((entry) => entry.bucket === "keep").slice(0, limit),
      delete: obviousGarbage.count > 0
        ? [{
            path: "(obvious garbage files)",
            bytes: obviousGarbage.bytes,
            pretty: formatBytes(obviousGarbage.bytes),
            count: obviousGarbage.count,
            reason: ".DS_Store, Thumbs.db, __pycache__, or .pyc",
            samples: obviousGarbage.samples,
          }]
        : [],
      archive: entries.filter((entry) => entry.bucket === "archive").slice(0, limit),
      ask: entries.filter((entry) => entry.bucket === "ask").slice(0, limit),
    },
    retention_gaps: retentionGaps,
    retention_gap_threshold_bytes: retentionThreshold,
    retention_manifest_loaded: retentionManifest !== null,
  };
}

function renderReport(report) {
  const lines = [
    `repo_root: ${report.repo_root}`,
    `limit: ${report.limit}`,
    "",
    "largest_paths:",
  ];
  for (const entry of report.largest_paths) {
    lines.push(`- ${entry.pretty}\t${entry.path}\t[${entry.bucket}: ${entry.reason}]`);
  }
  lines.push("", "cleanup_buckets:");
  for (const bucket of ["keep", "delete", "archive", "ask"]) {
    lines.push(`${bucket}:`);
    const entries = report.cleanup_buckets[bucket] || [];
    if (entries.length === 0) {
      lines.push("- (none)");
      continue;
    }
    for (const entry of entries) {
      const count = entry.count ? `, ${entry.count} files` : "";
      lines.push(`- ${entry.pretty}${count}\t${entry.path}\t${entry.reason}`);
    }
  }
  lines.push("", `retention_manifest_loaded: ${report.retention_manifest_loaded ? "yes" : "no"}`);
  lines.push(`retention_gap_threshold: ${formatBytes(report.retention_gap_threshold_bytes)}`);
  lines.push("retention_gaps:");
  if (!report.retention_gaps || report.retention_gaps.length === 0) {
    lines.push("- (none)");
  } else {
    for (const gap of report.retention_gaps) {
      lines.push(`- ${gap.pretty}\t${gap.path}\t${gap.reason}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildWorkspaceDiskReport(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
    return;
  }
  process.stdout.write(renderReport(report));
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
  buildWorkspaceDiskReport,
  classifyCleanupBucket,
  collectObviousGarbage,
  collectInventoryPaths,
  findRetentionGaps,
  formatBytes,
  loadScratchRetention,
  renderReport,
};
