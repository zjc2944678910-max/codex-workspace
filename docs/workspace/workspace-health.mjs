#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildRepoHygieneSummary } from "./repo-hygiene.mjs";
import { buildWorkspaceDiskReport } from "./workspace-disk-report.mjs";

const DEFAULT_LIMIT = 8;

function parseArgs(argv = []) {
  const options = {
    repo: "",
    json: false,
    limit: DEFAULT_LIMIT,
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
    }
  }
  return options;
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function overallStatus(hygiene = {}, disk = {}) {
  const structuralIssues = hygiene.git_clean !== true
    || count(hygiene.unregistered_project_surfaces) > 0
    || count(hygiene.nonexistent_project_references) > 0
    || count(disk.retention_gaps) > 0
    || disk.retention_manifest_loaded === false;
  return structuralIssues ? "attention" : "ok";
}

async function buildWorkspaceHealth(options = {}) {
  const repo = path.resolve(options.repo || process.cwd());
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
  const hygiene = await buildRepoHygieneSummary({ repo });
  const disk = await buildWorkspaceDiskReport({ repo, limit });
  return {
    repo_root: repo,
    status: overallStatus(hygiene, disk),
    hygiene,
    disk,
  };
}

function renderHealthSummary(result = {}) {
  const hygiene = result.hygiene || {};
  const disk = result.disk || {};
  const status = result.status || overallStatus(hygiene, disk);
  const garbage = disk.cleanup_buckets?.delete?.[0] || null;
  const lines = [
    `repo_root: ${hygiene.repo_root || result.repo_root || ""}`,
    `status: ${status}`,
    `git_clean: ${hygiene.git_clean ? "yes" : "no"}`,
    `unregistered_project_surfaces: ${count(hygiene.unregistered_project_surfaces)}`,
    `nonexistent_project_references: ${count(hygiene.nonexistent_project_references)}`,
    `retention_manifest_loaded: ${disk.retention_manifest_loaded ? "yes" : "no"}`,
    `retention_gaps: ${count(disk.retention_gaps)}`,
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
  buildWorkspaceHealth,
  overallStatus,
  parseArgs,
  renderHealthSummary,
};
