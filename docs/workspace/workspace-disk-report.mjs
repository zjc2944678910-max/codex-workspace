#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_LIMIT = 25;
const DEFAULT_RETENTION_GAP_BYTES = 100 * 1024 * 1024; // 100MB
const DEFAULT_STATE_RETENTION_GAP_BYTES = 100 * 1024 * 1024; // 100MB

function parseArgs(argv = []) {
  const options = {
    repo: "",
    json: false,
    limit: DEFAULT_LIMIT,
    retentionGapThreshold: DEFAULT_RETENTION_GAP_BYTES,
    stateRetentionGapThreshold: DEFAULT_STATE_RETENTION_GAP_BYTES,
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
      continue;
    }
    if (arg === "--state-retention-gap-threshold") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed >= 0) options.stateRetentionGapThreshold = parsed;
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
    "state/project-data",
    "state/review",
    "state/staging",
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

async function loadRetentionManifest(repoRoot, fileName) {
  const manifestPath = path.join(repoRoot, "docs", "workspace", fileName);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadScratchRetention(repoRoot) {
  return loadRetentionManifest(repoRoot, "scratch-retention.json");
}

async function loadStateRetention(repoRoot) {
  return loadRetentionManifest(repoRoot, "state-retention.json");
}

function defaultRetentionContainerPaths(prefix = "scratch/") {
  if (prefix === "state/") return ["state", "state/project-data", "state/review", "state/staging"];
  return ["scratch/projects", "scratch/shared"];
}

function findRetentionGaps(entries, retentionManifest, thresholdBytes, options = {}) {
  if (!retentionManifest || !retentionManifest.entries) return [];
  const prefix = options.prefix || "scratch/";
  const containerPaths = new Set(options.containerPaths || defaultRetentionContainerPaths(prefix));
  const reason = options.reason || "scratch path >= threshold with no retention entry";
  const covered = new Set(
    retentionManifest.entries.map((e) => String(e.path || "").replace(/\\/g, "/")),
  );
  const coversPath = (coveredPath, entryPath) => {
    if (entryPath === coveredPath) return true;
    if (containerPaths.has(coveredPath)) return false;
    return entryPath.startsWith(`${coveredPath}/`);
  };
  return entries
    .filter((entry) => {
      if (!entry.path.startsWith(prefix)) return false;
      if (entry.bytes < thresholdBytes) return false;
      return ![...covered].some((c) => coversPath(c, entry.path));
    })
    .map((entry) => ({
      path: entry.path,
      bytes: entry.bytes,
      pretty: entry.pretty,
      reason,
    }));
}

function dateOnlyMs(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function findRetentionOverdue(entries, retentionManifest, options = {}) {
  if (!retentionManifest || !Array.isArray(retentionManifest.entries)) return [];
  const prefix = options.prefix || "scratch/";
  const reason = options.reason || "scratch retention entry exceeded retention_days since last_active";
  const entriesByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const nowMs = dateOnlyMs(options.now || new Date());
  if (!Number.isFinite(nowMs)) return [];
  const defaultRetentionDays = Number(retentionManifest.default_retention_days);

  return retentionManifest.entries
    .map((manifestEntry) => {
      const entryPath = String(manifestEntry.path || "").replace(/\\/g, "/");
      const diskEntry = entriesByPath.get(entryPath);
      if (!entryPath.startsWith(prefix) || !diskEntry) return null;

      const retentionDays = Number.isFinite(Number(manifestEntry.retention_days))
        ? Number(manifestEntry.retention_days)
        : defaultRetentionDays;
      const lastActiveMs = dateOnlyMs(manifestEntry.last_active);
      if (!Number.isFinite(retentionDays) || retentionDays < 0 || !Number.isFinite(lastActiveMs)) return null;

      const ageDays = Math.floor((nowMs - lastActiveMs) / (24 * 60 * 60 * 1000));
      if (ageDays <= retentionDays) return null;
      return {
        path: entryPath,
        bytes: diskEntry.bytes,
        pretty: diskEntry.pretty,
        age_days: ageDays,
        retention_days: retentionDays,
        last_active: manifestEntry.last_active,
        active: manifestEntry.active === true,
        disposition: manifestEntry.disposition || "",
        reason,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftOverdue = left.age_days - left.retention_days;
      const rightOverdue = right.age_days - right.retention_days;
      if (rightOverdue !== leftOverdue) return rightOverdue - leftOverdue;
      return left.path.localeCompare(right.path);
    });
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
  const stateRetentionManifest = await loadStateRetention(repoRoot);
  const retentionThreshold = Number.isFinite(options.retentionGapThreshold)
    ? options.retentionGapThreshold
    : DEFAULT_RETENTION_GAP_BYTES;
  const stateRetentionThreshold = Number.isFinite(options.stateRetentionGapThreshold)
    ? options.stateRetentionGapThreshold
    : DEFAULT_STATE_RETENTION_GAP_BYTES;
  const retentionGaps = findRetentionGaps(entries, retentionManifest, retentionThreshold);
  const retentionOverdue = findRetentionOverdue(entries, retentionManifest, { now: options.now });
  const stateRetentionGaps = findRetentionGaps(entries, stateRetentionManifest, stateRetentionThreshold, {
    prefix: "state/",
    containerPaths: ["state", "state/project-data", "state/review", "state/staging"],
    reason: "state path >= threshold with no retention entry",
  });
  const stateRetentionOverdue = findRetentionOverdue(entries, stateRetentionManifest, {
    now: options.now,
    prefix: "state/",
    reason: "state retention entry exceeded retention_days since last_active",
  });
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
    retention_overdue: retentionOverdue,
    retention_gap_threshold_bytes: retentionThreshold,
    retention_manifest_loaded: retentionManifest !== null,
    state_retention_gaps: stateRetentionGaps,
    state_retention_overdue: stateRetentionOverdue,
    state_retention_gap_threshold_bytes: stateRetentionThreshold,
    state_retention_manifest_loaded: stateRetentionManifest !== null,
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
  lines.push("retention_overdue:");
  if (!report.retention_overdue || report.retention_overdue.length === 0) {
    lines.push("- (none)");
  } else {
    for (const overdue of report.retention_overdue) {
      lines.push(`- ${overdue.pretty}\t${overdue.path}\tage ${overdue.age_days}d > ${overdue.retention_days}d; ${overdue.disposition || "review"}`);
    }
  }
  lines.push("", `state_retention_manifest_loaded: ${report.state_retention_manifest_loaded ? "yes" : "no"}`);
  lines.push(`state_retention_gap_threshold: ${formatBytes(report.state_retention_gap_threshold_bytes)}`);
  lines.push("state_retention_gaps:");
  if (!report.state_retention_gaps || report.state_retention_gaps.length === 0) {
    lines.push("- (none)");
  } else {
    for (const gap of report.state_retention_gaps) {
      lines.push(`- ${gap.pretty}\t${gap.path}\t${gap.reason}`);
    }
  }
  lines.push("state_retention_overdue:");
  if (!report.state_retention_overdue || report.state_retention_overdue.length === 0) {
    lines.push("- (none)");
  } else {
    for (const overdue of report.state_retention_overdue) {
      lines.push(`- ${overdue.pretty}\t${overdue.path}\tage ${overdue.age_days}d > ${overdue.retention_days}d; ${overdue.disposition || "review"}`);
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
  findRetentionOverdue,
  formatBytes,
  loadScratchRetention,
  loadStateRetention,
  renderReport,
};
