#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildRepoHygieneSummary } from "./repo-hygiene.mjs";
import { buildWorkspaceDiskReport } from "./workspace-disk-report.mjs";

const DEFAULT_LIMIT = 8;
const DEFAULT_ACKNOWLEDGEMENTS_PATH = "docs/workspace/workspace-health-acknowledgements.json";
const NESTED_GIT_SCAN_ROOTS = ["projects"];
const NESTED_GIT_SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  ".venv",
  "venv",
  "__pycache__",
  "target",
  "dist",
  "build",
  ".next",
]);

function parseArgs(argv = []) {
  const options = {
    repo: "",
    json: false,
    limit: DEFAULT_LIMIT,
    strictAcknowledgements: false,
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
    if (arg === "--strict") {
      options.strictAcknowledgements = true;
      continue;
    }
    if (arg === "--limit") {
      const parsed = Number.parseInt(String(argv[index + 1] || ""), 10);
      if (Number.isFinite(parsed) && parsed > 0) options.limit = parsed;
      index += 1;
    }
  }
  return options;
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

async function listNestedGitRoots(repo, options = {}) {
  const scanRoots = Array.isArray(options.scanRoots) && options.scanRoots.length > 0
    ? options.scanRoots
    : NESTED_GIT_SCAN_ROOTS;
  const roots = [];

  async function walk(absDir, relDir) {
    let entries = [];
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch (error) {
      if (error && ["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) return;
      throw error;
    }

    if (entries.some((entry) => entry.name === ".git" && (entry.isDirectory() || entry.isFile()))) {
      roots.push(relDir);
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (NESTED_GIT_SKIP_DIRS.has(entry.name)) continue;
      const childRel = relDir ? path.posix.join(relDir, entry.name) : entry.name;
      await walk(path.join(absDir, entry.name), childRel);
    }
  }

  for (const scanRoot of scanRoots) {
    const normalized = String(scanRoot || "").replace(/\\/gu, "/").replace(/^\/+/u, "").replace(/\/+$/u, "");
    if (!normalized) continue;
    await walk(path.join(repo, normalized), normalized);
  }

  return roots.sort((left, right) => left.localeCompare(right));
}

function parseGitStatusLines(text = "") {
  return String(text || "")
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function summarizeGitStatusLines(lines = []) {
  let tracked = 0;
  let untracked = 0;
  for (const line of lines) {
    if (line.startsWith("?? ")) {
      untracked += 1;
    } else {
      tracked += 1;
    }
  }
  return {
    dirty_count: lines.length,
    tracked_count: tracked,
    untracked_count: untracked,
  };
}

async function loadHealthAcknowledgements(repo, options = {}) {
  if (options.strictAcknowledgements === true) return { nested_git: [] };
  const acknowledgementPath = options.acknowledgementPath || DEFAULT_ACKNOWLEDGEMENTS_PATH;
  const absolutePath = path.isAbsolute(acknowledgementPath)
    ? acknowledgementPath
    : path.join(repo, acknowledgementPath);
  let text = "";
  try {
    text = await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return { nested_git: [] };
    throw error;
  }
  try {
    const parsed = JSON.parse(text);
    return {
      nested_git: Array.isArray(parsed.nested_git) ? parsed.nested_git : [],
    };
  } catch (error) {
    throw new Error(`failed to parse workspace health acknowledgements: ${absolutePath}: ${error.message}`);
  }
}

function countMatchesExpectation(entry = {}, expected = {}) {
  for (const key of ["dirty_count", "tracked_count", "untracked_count"]) {
    if (Number.isFinite(expected[key]) && entry[key] !== expected[key]) return false;
  }
  return true;
}

function acknowledgedEntry(entry = {}, acknowledgement = {}, status = "acknowledged") {
  return {
    ...entry,
    acknowledgement_status: status,
    acknowledgement_reason: acknowledgement.reason || "",
    last_reviewed: acknowledgement.last_reviewed || "",
    review_after: acknowledgement.review_after || "",
  };
}

function classifyNestedGitDirty(entry = {}, acknowledgements = []) {
  const acknowledgement = acknowledgements.find((candidate) => candidate?.path === entry.path);
  if (!acknowledgement) return { bucket: "dirty", entry };
  if (acknowledgement.status === "acknowledged" && countMatchesExpectation(entry, acknowledgement.expected || {})) {
    return { bucket: "acknowledged", entry: acknowledgedEntry(entry, acknowledgement) };
  }
  return {
    bucket: "review",
    entry: acknowledgedEntry(
      entry,
      acknowledgement,
      acknowledgement.status === "acknowledged" ? "expectation_mismatch" : acknowledgement.status || "needs_review",
    ),
  };
}

function nestedGitStatus(repo, relativePath) {
  const absolutePath = path.join(repo, relativePath);
  const result = spawnSync("git", ["-C", absolutePath, "status", "--porcelain=v1", "--untracked-files=all"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    return {
      path: relativePath,
      error: (result.stderr || result.stdout || "git status failed").trim(),
    };
  }
  const lines = parseGitStatusLines(result.stdout);
  return {
    path: relativePath,
    ...summarizeGitStatusLines(lines),
  };
}

async function buildNestedGitSummary(options = {}) {
  const repo = path.resolve(options.repo || process.cwd());
  const roots = await listNestedGitRoots(repo, options);
  const acknowledgements = await loadHealthAcknowledgements(repo, options);
  const summaries = roots.map((relativePath) => nestedGitStatus(repo, relativePath));
  const dirtyBuckets = {
    dirty_repos: [],
    acknowledged_dirty_repos: [],
    review_dirty_repos: [],
  };
  for (const entry of summaries.filter((candidate) => !candidate.error && candidate.dirty_count > 0)) {
    const classified = classifyNestedGitDirty(entry, acknowledgements.nested_git);
    if (classified.bucket === "acknowledged") {
      dirtyBuckets.acknowledged_dirty_repos.push(classified.entry);
    } else if (classified.bucket === "review") {
      dirtyBuckets.review_dirty_repos.push(classified.entry);
    } else {
      dirtyBuckets.dirty_repos.push(classified.entry);
    }
  }
  return {
    repo_count: roots.length,
    clean_repos: summaries.filter((entry) => !entry.error && entry.dirty_count === 0).map((entry) => entry.path),
    ...dirtyBuckets,
    errors: summaries.filter((entry) => entry.error),
  };
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return "";
    throw error;
  }
}

function parseTomlStringValue(text = "", key = "") {
  const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = text.match(new RegExp(`^\\s*${escapedKey}\\s*=\\s*"([^"]*)"`, "mu"));
  return match ? match[1] : "";
}

function parseNotifyArray(configText = "") {
  const match = configText.match(/^\s*notify\s*=\s*(\[[^\n]*\])/mu);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : null;
  } catch {
    return null;
  }
}

function sameStringArray(left = null, right = null) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function parsePreviousNotifyArray(notify = null) {
  if (!Array.isArray(notify)) return null;
  const previousIndex = notify.indexOf("--previous-notify");
  if (previousIndex < 0 || previousIndex + 1 >= notify.length) return null;
  try {
    const parsed = JSON.parse(String(notify[previousIndex + 1] || ""));
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : null;
  } catch {
    return null;
  }
}

async function readAutomationState(homeDir, id) {
  const automationPath = path.join(homeDir, ".codex", "automations", id, "automation.toml");
  const text = await readTextIfExists(automationPath);
  if (!text) return { exists: false, status: "missing" };
  return {
    exists: true,
    kind: parseTomlStringValue(text, "kind"),
    name: parseTomlStringValue(text, "name"),
    status: parseTomlStringValue(text, "status") || "unknown",
  };
}

async function buildCodexWorkflowSummary(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const expectedNotify = [
    path.join(homeDir, ".codex", "tools", "codex-turn-ended-notify.sh"),
    "turn-ended",
  ];
  const configText = await readTextIfExists(path.join(homeDir, ".codex", "config.toml"));
  const notify = parseNotifyArray(configText);
  const notifyWrapperOnly = sameStringArray(notify, expectedNotify);
  const notifyViaDesktopClient = Array.isArray(notify)
    ? notify.some((entry) => entry.includes("SkyComputerUseClient"))
    : false;
  const notifyHasPreviousNotify = Array.isArray(notify)
    ? notify.includes("--previous-notify")
    : false;
  const previousNotify = parsePreviousNotifyArray(notify);
  const notifyPreviousWrapper = sameStringArray(previousNotify, expectedNotify);
  const notifyRoutesToWrapper = notifyWrapperOnly || notifyPreviousWrapper;

  const notifyConfigText = await readTextIfExists(path.join(homeDir, ".codex", "notify-config.json"));
  let notifyConfig = {};
  try {
    notifyConfig = notifyConfigText ? JSON.parse(notifyConfigText) : {};
  } catch {
    notifyConfig = {};
  }

  const workspaceHealthDaily = await readAutomationState(homeDir, "workspace-health-daily");
  const mobileBridgeHeartbeat = await readAutomationState(homeDir, "mobile-codex-bridge-heartbeat");
  const barkEnabled = notifyConfig.bark?.enabled === true;
  const telegramEnabled = notifyConfig.telegram?.enabled === true;
  const workspaceHealthNotifyEnabled = notifyConfig.workspace_health?.enabled === true;

  const issues = [];
  if (!notifyRoutesToWrapper) issues.push("notify_not_wrapper_only");
  if (notifyViaDesktopClient && !notifyPreviousWrapper) issues.push("notify_via_desktop_client");
  if (notifyHasPreviousNotify && !notifyPreviousWrapper) issues.push("notify_has_previous_notify");
  if (!barkEnabled) issues.push("bark_disabled");
  if (telegramEnabled) issues.push("telegram_enabled");
  if (!workspaceHealthNotifyEnabled) issues.push("workspace_health_notify_disabled");
  if (!["ACTIVE", "PAUSED"].includes(workspaceHealthDaily.status)) {
    issues.push("workspace_health_daily_not_active");
  }
  if (mobileBridgeHeartbeat.status !== "PAUSED") issues.push("mobile_bridge_heartbeat_not_paused");

  return {
    notify_wrapper_only: notifyWrapperOnly,
    notify_previous_wrapper: notifyPreviousWrapper,
    notify_routes_to_wrapper: notifyRoutesToWrapper,
    notify_via_desktop_client: notifyViaDesktopClient,
    notify_has_previous_notify: notifyHasPreviousNotify,
    bark_enabled: barkEnabled,
    telegram_enabled: telegramEnabled,
    workspace_health_notify_enabled: workspaceHealthNotifyEnabled,
    workspace_health_daily: workspaceHealthDaily.status,
    mobile_bridge_heartbeat: mobileBridgeHeartbeat.status,
    issues,
  };
}

function overallStatus(hygiene = {}, disk = {}, codexWorkflow = {}, nestedGit = {}) {
  const structuralIssues = hygiene.git_clean !== true
    || count(hygiene.unregistered_project_surfaces) > 0
    || count(hygiene.nonexistent_project_references) > 0
    || count(hygiene.project_route_metadata_mismatches) > 0
    || count(disk.retention_gaps) > 0
    || count(disk.retention_overdue) > 0
    || disk.retention_manifest_loaded === false
    || count(disk.state_retention_gaps) > 0
    || count(disk.state_retention_overdue) > 0
    || disk.state_retention_manifest_loaded === false
    || count(codexWorkflow.issues) > 0
    || count(nestedGit.dirty_repos) > 0
    || count(nestedGit.review_dirty_repos) > 0
    || count(nestedGit.errors) > 0;
  return structuralIssues ? "attention" : "ok";
}

async function buildWorkspaceHealth(options = {}) {
  const repo = path.resolve(options.repo || process.cwd());
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
  const hygiene = await buildRepoHygieneSummary({ repo });
  const disk = await buildWorkspaceDiskReport({ repo, limit });
  const codexWorkflow = await buildCodexWorkflowSummary(options);
  const nestedGit = await buildNestedGitSummary({
    repo,
    strictAcknowledgements: options.strictAcknowledgements,
    acknowledgementPath: options.acknowledgementPath,
  });
  return {
    repo_root: repo,
    status: overallStatus(hygiene, disk, codexWorkflow, nestedGit),
    hygiene,
    disk,
    codex_workflow: codexWorkflow,
    nested_git: nestedGit,
  };
}

function renderHealthSummary(result = {}) {
  const hygiene = result.hygiene || {};
  const disk = result.disk || {};
  const codexWorkflow = result.codex_workflow || {};
  const nestedGit = result.nested_git || {};
  const notifyOk = codexWorkflow.notify_routes_to_wrapper ?? codexWorkflow.notify_wrapper_only;
  const status = result.status || overallStatus(hygiene, disk, codexWorkflow, nestedGit);
  const garbage = disk.cleanup_buckets?.delete?.[0] || null;
  const lines = [
    `repo_root: ${hygiene.repo_root || result.repo_root || ""}`,
    `status: ${status}`,
    `git_clean: ${hygiene.git_clean ? "yes" : "no"}`,
    `unregistered_project_surfaces: ${count(hygiene.unregistered_project_surfaces)}`,
    `nonexistent_project_references: ${count(hygiene.nonexistent_project_references)}`,
    `project_route_metadata_mismatches: ${count(hygiene.project_route_metadata_mismatches)}`,
    `retention_manifest_loaded: ${disk.retention_manifest_loaded ? "yes" : "no"}`,
    `retention_gaps: ${count(disk.retention_gaps)}`,
    `retention_overdue: ${count(disk.retention_overdue)}`,
    `state_retention_manifest_loaded: ${disk.state_retention_manifest_loaded === true ? "yes" : disk.state_retention_manifest_loaded === false ? "no" : "n/a"}`,
    `state_retention_gaps: ${count(disk.state_retention_gaps)}`,
    `state_retention_overdue: ${count(disk.state_retention_overdue)}`,
    `codex_notify_wrapper: ${notifyOk ? "ok" : "attention"}`,
    `bark_enabled: ${codexWorkflow.bark_enabled ? "yes" : "no"}`,
    `telegram_enabled: ${codexWorkflow.telegram_enabled ? "yes" : "no"}`,
    `workspace_health_notify: ${codexWorkflow.workspace_health_notify_enabled ? "yes" : "no"}`,
    `workspace_health_daily: ${codexWorkflow.workspace_health_daily || "unknown"}`,
    `mobile_bridge_heartbeat: ${codexWorkflow.mobile_bridge_heartbeat || "unknown"}`,
    `codex_workflow_issues: ${count(codexWorkflow.issues)}`,
    `nested_git_repos: ${nestedGit.repo_count || 0}`,
    `nested_git_dirty: ${count(nestedGit.dirty_repos)}`,
    `nested_git_acknowledged: ${count(nestedGit.acknowledged_dirty_repos)}`,
    `nested_git_needs_review: ${count(nestedGit.review_dirty_repos)}`,
    `nested_git_errors: ${count(nestedGit.errors)}`,
  ];
  if (garbage) {
    const fileCount = garbage.count ? `, ${garbage.count} files` : "";
    lines.push(`obvious_garbage: ${garbage.pretty}${fileCount}`);
  } else {
    lines.push("obvious_garbage: 0B");
  }
  lines.push("", "largest_paths:");
  for (const entry of (disk.largest_paths || [])) {
    lines.push(`- ${entry.pretty}\t${entry.path}\t[${entry.bucket}]`);
  }
  if (count(disk.retention_gaps) > 0) {
    lines.push("", "retention_gap_paths:");
    for (const gap of disk.retention_gaps) {
      lines.push(`- ${gap.pretty}\t${gap.path}`);
    }
  }
  if (count(disk.retention_overdue) > 0) {
    lines.push("", "retention_overdue_paths:");
    for (const overdue of disk.retention_overdue) {
      lines.push(`- ${overdue.pretty}\t${overdue.path}\tage ${overdue.age_days}d > ${overdue.retention_days}d`);
    }
  }
  if (count(disk.state_retention_gaps) > 0) {
    lines.push("", "state_retention_gap_paths:");
    for (const gap of disk.state_retention_gaps) {
      lines.push(`- ${gap.pretty}\t${gap.path}`);
    }
  }
  if (count(disk.state_retention_overdue) > 0) {
    lines.push("", "state_retention_overdue_paths:");
    for (const overdue of disk.state_retention_overdue) {
      lines.push(`- ${overdue.pretty}\t${overdue.path}\tage ${overdue.age_days}d > ${overdue.retention_days}d`);
    }
  }
  if (count(nestedGit.dirty_repos) > 0) {
    lines.push("", "nested_git_dirty_repos:");
    for (const entry of nestedGit.dirty_repos) {
      lines.push(`- ${entry.path}\t${entry.dirty_count} changes (${entry.tracked_count} tracked, ${entry.untracked_count} untracked)`);
    }
  }
  if (count(nestedGit.review_dirty_repos) > 0) {
    lines.push("", "nested_git_needs_review_repos:");
    for (const entry of nestedGit.review_dirty_repos) {
      const reason = entry.acknowledgement_reason ? `\t${entry.acknowledgement_reason}` : "";
      lines.push(`- ${entry.path}\t${entry.dirty_count} changes (${entry.tracked_count} tracked, ${entry.untracked_count} untracked)\t${entry.acknowledgement_status}${reason}`);
    }
  }
  if (count(nestedGit.acknowledged_dirty_repos) > 0) {
    lines.push("", "nested_git_acknowledged_repos:");
    for (const entry of nestedGit.acknowledged_dirty_repos) {
      const reason = entry.acknowledgement_reason ? `\t${entry.acknowledgement_reason}` : "";
      lines.push(`- ${entry.path}\t${entry.dirty_count} changes (${entry.tracked_count} tracked, ${entry.untracked_count} untracked)${reason}`);
    }
  }
  if (count(nestedGit.errors) > 0) {
    lines.push("", "nested_git_error_repos:");
    for (const entry of nestedGit.errors) {
      lines.push(`- ${entry.path}\t${entry.error}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await buildWorkspaceHealth(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  process.stdout.write(renderHealthSummary(result));
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
  buildNestedGitSummary,
  buildCodexWorkflowSummary,
  buildWorkspaceHealth,
  overallStatus,
  parseArgs,
  renderHealthSummary,
};
