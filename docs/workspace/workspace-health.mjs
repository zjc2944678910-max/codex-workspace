#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildRepoHygieneSummary } from "./repo-hygiene.mjs";
import {
  loadLocalGitNexusMetadata,
  renderMocProjectSection,
  renderProjectSurfacesProjectSection,
} from "./codex-register-project.mjs";
import {
  discoverRunRoots,
  inspectRunDirectory,
  loadRunIndexRecords,
} from "./codex-run-retention.mjs";
import { buildWorkspaceDiskReport } from "./workspace-disk-report.mjs";

const DEFAULT_LIMIT = 8;
const DEFAULT_ACKNOWLEDGEMENTS_PATH = "docs/workspace/workspace-health-acknowledgements.json";
const NESTED_GIT_SCAN_ROOTS = ["projects"];
const NESTED_GIT_SKIP_DIRS = new Set([
  ".git",
  ".build",
  ".hg",
  ".pio",
  ".svn",
  "node_modules",
  ".venv",
  "venv",
  "__pycache__",
  "target",
  "dist",
  "build",
  ".next",
  "SourcePackages",
  "vendor",
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
      return;
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

function dateOnlyMs(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = Date.UTC(year, month - 1, day);
  const normalized = new Date(result);
  if (normalized.getUTCFullYear() !== year
    || normalized.getUTCMonth() !== month - 1
    || normalized.getUTCDate() !== day) {
    return Number.NaN;
  }
  return result;
}

function acknowledgementReviewStatus(acknowledgement = {}, now = new Date()) {
  const reviewAfter = String(acknowledgement.review_after || "").trim();
  if (!reviewAfter) return "current";
  const reviewAfterMs = dateOnlyMs(reviewAfter);
  const nowMs = dateOnlyMs(now);
  if (!Number.isFinite(reviewAfterMs) || !Number.isFinite(nowMs)) return "review_date_invalid";
  return nowMs > reviewAfterMs ? "review_overdue" : "current";
}

function classifyNestedGitDirty(entry = {}, acknowledgements = [], options = {}) {
  const acknowledgement = acknowledgements.find((candidate) => candidate?.path === entry.path);
  if (!acknowledgement) return { bucket: "dirty", entry };
  if (acknowledgement.status === "acknowledged" && countMatchesExpectation(entry, acknowledgement.expected || {})) {
    const reviewStatus = acknowledgementReviewStatus(acknowledgement, options.now || new Date());
    if (reviewStatus !== "current") {
      return {
        bucket: "review",
        entry: acknowledgedEntry(entry, acknowledgement, reviewStatus),
      };
    }
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
    const classified = classifyNestedGitDirty(entry, acknowledgements.nested_git, { now: options.now });
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  const text = await readTextIfExists(filePath);
  return text ? JSON.parse(text) : null;
}

function terminalNextAction(value = "") {
  const text = String(value || "").trim().toLowerCase();
  return /\bno further action\b/u.test(text)
    || /\bnothing further\b/u.test(text)
    || /\bimplementation complete\b/u.test(text)
    || /\bwork complete\b/u.test(text)
    || /^(?:none|done)(?:[.;:]|$)/u.test(text)
    || /(?:无需|不需|没有|无)后续/u.test(text);
}

function isLongTaskCompletionCandidate(run = {}) {
  const indexActionable = ["active", "blocked", "needs_user_decision"].includes(run.index_status);
  const stateFinal = ["completed", "deferred"].includes(run.status);
  if (indexActionable && stateFinal) return true;
  if (run.status !== "active" || run.protected !== true) return false;
  if (String(run.phase || "").includes("awaiting") || String(run.phase || "").includes("blocked")) return false;
  return terminalNextAction(run.next_action)
    || /(?:^|_)(?:accepted|completed|finalized)(?:_|$)/u.test(String(run.phase || ""));
}

async function findLongTaskCompletionCandidates(repo) {
  const candidates = [];
  const indexRecords = await loadRunIndexRecords(repo);
  for (const runRoot of await discoverRunRoots(repo)) {
    let entries = [];
    try {
      entries = await fs.readdir(runRoot, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const run = await inspectRunDirectory(runRoot, entry.name, {
        indexRecords: indexRecords.by_run_root,
        requireIndex: true,
      });
      if (!isLongTaskCompletionCandidate(run)) continue;
      const indexConflict = ["active", "blocked", "needs_user_decision"].includes(run.index_status)
        && ["completed", "deferred"].includes(run.status);
      candidates.push({
        path: path.relative(repo, path.join(runRoot, entry.name)).replace(/\\/gu, "/"),
        status: run.status,
        phase: run.phase,
        index_status: run.index_status,
        index_phase: run.index_phase,
        index_path: run.index_path ? path.relative(repo, run.index_path).replace(/\\/gu, "/") : "",
        next_action: run.next_action,
        candidate_type: indexConflict ? `finalize_${run.status}` : "terminal_phase_or_next_action",
        confidence: indexConflict ? "high" : "medium",
        reason: indexConflict
          ? "long-task index is actionable while continuation state is terminal"
          : "active run has an explicit terminal phase or next action",
      });
    }
  }
  return candidates.sort((left, right) => left.path.localeCompare(right.path));
}

function extractGeneratedSection(content = "", startMarker = "", endMarker = "") {
  const lines = String(content || "").replace(/\r\n/gu, "\n").split("\n");
  const starts = lines.flatMap((line, index) => line === startMarker ? [index] : []);
  const ends = lines.flatMap((line, index) => line === endMarker ? [index] : []);
  const valid = starts.length === 1 && ends.length === 1 && ends[0] > starts[0];
  return {
    valid,
    start_count: starts.length,
    end_count: ends.length,
    lines: valid ? lines.slice(starts[0] + 1, ends[0]) : [],
  };
}

function lineCount(lines = [], expected = "") {
  return lines.reduce((total, line) => total + (line === expected ? 1 : 0), 0);
}

async function findProjectDocumentationMismatches(repo) {
  const registry = await readJsonIfExists(path.join(repo, "docs", "workspace", "project-registry.json"));
  if (!registry || !Array.isArray(registry.projects)) return [];
  const [moc, surfaces, metadata] = await Promise.all([
    readTextIfExists(path.join(repo, "MOC.md")),
    readTextIfExists(path.join(repo, "docs", "workspace", "project-surfaces.md")),
    loadLocalGitNexusMetadata(repo, registry),
  ]);
  const mismatches = [];
  const specifications = [
    {
      document: "MOC.md",
      content: moc,
      start_marker: "<!-- BEGIN GENERATED PROJECT LINKS -->",
      end_marker: "<!-- END GENERATED PROJECT LINKS -->",
      expected: renderMocProjectSection(registry),
    },
    {
      document: "docs/workspace/project-surfaces.md",
      content: surfaces,
      start_marker: "<!-- BEGIN GENERATED PROJECT SURFACES -->",
      end_marker: "<!-- END GENERATED PROJECT SURFACES -->",
      expected: renderProjectSurfacesProjectSection(registry, metadata),
    },
  ];
  const sections = new Map();
  for (const specification of specifications) {
    const section = extractGeneratedSection(
      specification.content,
      specification.start_marker,
      specification.end_marker,
    );
    sections.set(specification.document, section);
    if (section.valid) continue;
    mismatches.push({
      project: "(workspace)",
      document: specification.document,
      field: "generated_section_markers",
      expected: `one ordered ${specification.start_marker} ... ${specification.end_marker} section`,
      actual: `start markers ${section.start_count}; end markers ${section.end_count}`,
    });
  }

  for (const project of registry.projects) {
    const slug = String(project.slug || "").trim();
    const expectedMocLine = renderMocProjectSection({ projects: [project] });
    const mocSection = sections.get("MOC.md");
    const mocOccurrences = mocSection?.valid ? lineCount(mocSection.lines, expectedMocLine) : 0;
    if (mocSection?.valid && mocOccurrences !== 1) {
      mismatches.push({
        project: slug,
        document: "MOC.md",
        field: "generated_project_line",
        expected: expectedMocLine,
        actual: mocOccurrences === 0 ? "missing" : `duplicate (${mocOccurrences})`,
      });
    }

    const expectedSurfaceLine = renderProjectSurfacesProjectSection({ projects: [project] }, metadata)
      .split("\n")
      .at(-1);
    const surfaceSection = sections.get("docs/workspace/project-surfaces.md");
    const surfaceOccurrences = surfaceSection?.valid ? lineCount(surfaceSection.lines, expectedSurfaceLine) : 0;
    if (surfaceSection?.valid && surfaceOccurrences !== 1) {
      const opsSurface = String(project.ops_surface || `ops/projects/${slug}`).trim();
      const actualLine = surfaceSection.lines.find((line) => line.startsWith("|") && line.includes(`\`${opsSurface}\``));
      mismatches.push({
        project: slug,
        document: "docs/workspace/project-surfaces.md",
        field: "generated_project_line",
        expected: expectedSurfaceLine,
        actual: surfaceOccurrences > 1 ? `duplicate (${surfaceOccurrences})` : actualLine || "missing",
      });
    }
  }
  for (const specification of specifications) {
    const section = sections.get(specification.document);
    if (!section?.valid || section.lines.join("\n") === specification.expected) continue;
    const hasProjectMismatch = mismatches.some((entry) => (
      entry.document === specification.document && entry.field === "generated_project_line"
    ));
    if (hasProjectMismatch) continue;
    const expectedLines = specification.expected ? specification.expected.split("\n").length : 0;
    mismatches.push({
      project: "(workspace)",
      document: specification.document,
      field: "generated_section_content",
      expected: `${expectedLines} ordered registry-derived lines`,
      actual: `${section.lines.length} lines with extra, missing, or ordering drift`,
    });
  }
  return mismatches.sort((left, right) => {
    const projectOrder = left.project.localeCompare(right.project);
    return projectOrder || left.document.localeCompare(right.document) || left.field.localeCompare(right.field);
  });
}

async function buildWorkspaceGovernanceSummary(options = {}) {
  const repo = path.resolve(options.repo || process.cwd());
  const missingActiveRetentionPaths = [];
  for (const fileName of ["scratch-retention.json", "state-retention.json"]) {
    const manifest = await readJsonIfExists(path.join(repo, "docs", "workspace", fileName));
    for (const entry of (manifest?.entries || [])) {
      const relativePath = String(entry.path || "").replace(/\\/gu, "/");
      if (entry.active !== true || !relativePath || await pathExists(path.join(repo, relativePath))) continue;
      missingActiveRetentionPaths.push({
        path: relativePath,
        manifest: `docs/workspace/${fileName}`,
        project: entry.project || null,
        disposition: entry.disposition || "",
        reason: "active retention entry points to a missing path",
      });
    }
  }
  missingActiveRetentionPaths.sort((left, right) => left.path.localeCompare(right.path));

  return {
    missing_active_retention_paths: missingActiveRetentionPaths,
    long_task_completion_candidates: await findLongTaskCompletionCandidates(repo),
    project_documentation_mismatches: await findProjectDocumentationMismatches(repo),
  };
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
  if (mobileBridgeHeartbeat.exists && mobileBridgeHeartbeat.status !== "PAUSED") {
    issues.push("mobile_bridge_heartbeat_not_paused");
  }

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

function overallStatus(hygiene = {}, disk = {}, codexWorkflow = {}, nestedGit = {}, governance = {}) {
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
    || count(nestedGit.errors) > 0
    || count(governance.missing_active_retention_paths) > 0
    || count(governance.project_documentation_mismatches) > 0;
  return structuralIssues ? "attention" : "ok";
}

async function buildWorkspaceHealth(options = {}) {
  const repo = path.resolve(options.repo || process.cwd());
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
  const hygiene = await buildRepoHygieneSummary({ repo });
  const disk = await buildWorkspaceDiskReport({ repo, limit, now: options.now });
  const codexWorkflow = await buildCodexWorkflowSummary(options);
  const nestedGit = await buildNestedGitSummary({
    repo,
    strictAcknowledgements: options.strictAcknowledgements,
    acknowledgementPath: options.acknowledgementPath,
    now: options.now,
  });
  const governance = await buildWorkspaceGovernanceSummary({ repo });
  return {
    repo_root: repo,
    status: overallStatus(hygiene, disk, codexWorkflow, nestedGit, governance),
    hygiene,
    disk,
    codex_workflow: codexWorkflow,
    nested_git: nestedGit,
    ...governance,
  };
}

function renderHealthSummary(result = {}) {
  const hygiene = result.hygiene || {};
  const disk = result.disk || {};
  const codexWorkflow = result.codex_workflow || {};
  const nestedGit = result.nested_git || {};
  const notifyOk = codexWorkflow.notify_routes_to_wrapper ?? codexWorkflow.notify_wrapper_only;
  const governance = {
    missing_active_retention_paths: result.missing_active_retention_paths || [],
    long_task_completion_candidates: result.long_task_completion_candidates || [],
    project_documentation_mismatches: result.project_documentation_mismatches || [],
  };
  const status = result.status || overallStatus(hygiene, disk, codexWorkflow, nestedGit, governance);
  const garbage = disk.cleanup_buckets?.delete?.[0] || null;
  const lines = [
    `repo_root: ${hygiene.repo_root || result.repo_root || ""}`,
    `status: ${status}`,
    `git_clean: ${hygiene.git_clean ? "yes" : "no"}`,
    `unregistered_project_surfaces: ${count(hygiene.unregistered_project_surfaces)}`,
    `nonexistent_project_references: ${count(hygiene.nonexistent_project_references)}`,
    `project_route_metadata_mismatches: ${count(hygiene.project_route_metadata_mismatches)}`,
    `missing_active_retention_paths: ${count(governance.missing_active_retention_paths)}`,
    `long_task_completion_candidates: ${count(governance.long_task_completion_candidates)}`,
    `project_documentation_mismatches: ${count(governance.project_documentation_mismatches)}`,
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
  if (count(governance.missing_active_retention_paths) > 0) {
    lines.push("", "missing_active_retention_path_details:");
    for (const entry of governance.missing_active_retention_paths) {
      lines.push(`- ${entry.path}\t${entry.manifest}`);
    }
  }
  if (count(governance.long_task_completion_candidates) > 0) {
    lines.push("", "long_task_completion_candidate_details:");
    for (const entry of governance.long_task_completion_candidates) {
      lines.push(`- ${entry.path}\t${entry.phase || entry.status}`);
    }
  }
  if (count(governance.project_documentation_mismatches) > 0) {
    lines.push("", "project_documentation_mismatch_details:");
    for (const entry of governance.project_documentation_mismatches) {
      lines.push(`- ${entry.project}\t${entry.document}\t${entry.field}: expected ${entry.expected}; actual ${entry.actual}`);
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
  buildWorkspaceGovernanceSummary,
  buildWorkspaceHealth,
  findLongTaskCompletionCandidates,
  findProjectDocumentationMismatches,
  isLongTaskCompletionCandidate,
  overallStatus,
  parseArgs,
  renderHealthSummary,
};
