#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_SKILL_ROOT = ".agents/skills";
const STALE_MARKERS = [
  /\barea of -\b/iu,
  /\bcluster-\d+\b/iu,
  /backup-host-status-summary-\d{8}t\d+/iu,
  /\$REMOTE_BACKUP/u,
  /(?:^|[\s/])(?:staging|sanitized)\/(?:workspace|optional-review|base)(?:[\s/`])/iu,
];
const GENERIC_NAMES = new Set(["raw-tools", "scripts", "tests", "tools"]);

async function walkSkillFiles(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return files;
    throw error;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkSkillFiles(absolute));
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(absolute);
    }
  }
  return files;
}

function frontmatterValue(text, key) {
  const match = String(text || "").match(new RegExp(`^${key}:\\s*(.+)$`, "mu"));
  return match ? match[1].trim().replace(/^['"]|['"]$/gu, "") : "";
}

function scanSkillText(text, filePath, name) {
  const issues = [];
  if (!name) issues.push({ type: "missing_name", file: filePath });
  if (!frontmatterValue(text, "description")) {
    issues.push({ type: "missing_description", file: filePath, name });
  }
  if (GENERIC_NAMES.has(name)) {
    issues.push({ type: "generic_name", file: filePath, name });
  }
  for (const marker of STALE_MARKERS) {
    if (marker.test(text) || marker.test(name)) {
      issues.push({ type: "stale_marker", file: filePath, name, marker: marker.source });
    }
  }
  return issues;
}

export async function auditSkillTree(repoRoot = process.cwd(), options = {}) {
  const root = path.resolve(repoRoot, options.skillRoot || DEFAULT_SKILL_ROOT);
  const files = await walkSkillFiles(root);
  const skills = [];
  const issues = [];
  const names = new Map();

  for (const absolute of files.sort()) {
    const text = await fs.readFile(absolute, "utf8");
    const name = frontmatterValue(text, "name");
    const relative = path.relative(path.resolve(repoRoot), absolute).replace(/\\/gu, "/");
    skills.push({ name, path: relative });
    const previous = names.get(name) || [];
    previous.push(relative);
    names.set(name, previous);
    issues.push(...scanSkillText(text, relative, name));
  }

  for (const [name, paths] of names.entries()) {
    if (name && paths.length > 1) {
      issues.push({ type: "duplicate_name", name, paths });
    }
  }

  return {
    root: path.relative(path.resolve(repoRoot), root).replace(/\\/gu, "/") || ".",
    status: files.length > 0 ? "ok" : "empty_or_missing",
    skill_count: skills.length,
    skills,
    issues,
  };
}

export function renderSkillAudit(result = {}) {
  const status = result.issues?.length ? "attention" : "ok";
  return [
    `skill_root=${result.root || ""}`,
    `status=${status}`,
    `skill_count=${Number(result.skill_count || 0)}`,
    `issue_count=${Array.isArray(result.issues) ? result.issues.length : 0}`,
    ...(result.issues || []).map((issue) => JSON.stringify(issue)),
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const result = await auditSkillTree(process.cwd());
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderSkillAudit(result)}\n`);
  }
  process.exitCode = result.issues.length > 0 ? 1 : 0;
}
