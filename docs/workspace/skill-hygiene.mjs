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
const LOCAL_FILE_EXTENSION = /(?:^|\/)[^/]*\.[a-z\d]{1,16}$/iu;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:/iu;
const TEMPLATE_MARKER = /(?:\{\{|\}\}|\{%|%\}|\$\{|\}|\{)/u;

function displayPath(repoRoot, absolutePath) {
  const relative = path.relative(path.resolve(repoRoot), absolutePath).replace(/\\/gu, "/");
  return relative || ".";
}

function lineCount(text) {
  if (!text) return 0;
  return (String(text).match(/\r\n|\r|\n/gu) || []).length + (/\r\n$|\r$|\n$/u.test(text) ? 0 : 1);
}

function isSkillFileName(name) {
  return name === "SKILL.md";
}

async function statFollowSymlink(absolutePath) {
  try {
    const stat = await fs.stat(absolutePath);
    const realPath = await fs.realpath(absolutePath);
    return { stat, realPath };
  } catch (error) {
    error.path = absolutePath;
    throw error;
  }
}

/** Walk a skill root while following symlinks safely. */
async function walkSkillFiles(directory, options = {}) {
  const files = [];
  const errors = [];
  const visitedDirectories = options.visitedDirectories || new Set();
  const visitedFiles = options.visitedFiles || new Set();
  const sourceRoot = options.sourceRoot || directory;

  let rootInfo;
  try {
    rootInfo = await statFollowSymlink(directory);
  } catch (error) {
    errors.push({ path: directory, error });
    return { files, errors };
  }
  if (!rootInfo.stat.isDirectory()) {
    const error = new Error(`Skill root is not a directory: ${directory}`);
    error.code = "ENOTDIR";
    errors.push({ path: directory, error });
    return { files, errors };
  }
  if (visitedDirectories.has(rootInfo.realPath)) return { files, errors };
  visitedDirectories.add(rootInfo.realPath);

  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    error.path = directory;
    errors.push({ path: directory, error });
    return { files, errors };
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    let info;
    try {
      info = await statFollowSymlink(absolute);
    } catch (error) {
      errors.push({ path: absolute, error });
      continue;
    }
    if (info.stat.isDirectory()) {
      const nested = await walkSkillFiles(absolute, {
        sourceRoot,
        visitedDirectories,
        visitedFiles,
      });
      files.push(...nested.files);
      errors.push(...nested.errors);
    } else if (info.stat.isFile() && isSkillFileName(entry.name) && !visitedFiles.has(info.realPath)) {
      visitedFiles.add(info.realPath);
      files.push({ absolute, realPath: info.realPath, sourceRoot });
    }
  }
  return { files, errors };
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "~" || trimmed === "null") return "";
  return trimmed.replace(/^['"]|['"]$/gu, "");
}

function frontmatterValue(text, key) {
  const source = String(text || "");
  const lines = source.split(/\r\n|\r|\n/u);
  const hasFrontmatter = lines[0]?.trim() === "---";
  const start = hasFrontmatter ? 1 : 0;
  let limit = lines.length;
  if (hasFrontmatter) {
    const closeIndex = lines.slice(start).findIndex((line) => /^(?:---|\.\.\.)\s*$/u.test(line.trim()));
    if (closeIndex >= 0) limit = start + closeIndex;
  }
  const escapedKey = String(key).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const keyPattern = new RegExp(`^${escapedKey}\\s*:\\s*(.*)$`, "u");
  for (let index = start; index < limit; index += 1) {
    const match = lines[index].match(keyPattern);
    if (!match) continue;
    const rawValue = match[1] || "";
    if (!/^[|>][+-]?\s*$/u.test(rawValue.trim())) return parseScalar(rawValue);
    const folded = rawValue.trim().startsWith(">");
    const continuation = [];
    for (let next = index + 1; next < limit; next += 1) {
      if (/^[A-Za-z0-9_-]+\s*:/u.test(lines[next]) && !/^\s/u.test(lines[next])) break;
      continuation.push(lines[next].replace(/^\s{2}/u, ""));
    }
    return parseScalar(folded ? continuation.join(" ") : continuation.join("\n"));
  }
  return "";
}

function scanSkillText(text, filePath, name) {
  const issues = [];
  if (!name) issues.push({ type: "missing_name", file: filePath });
  if (!frontmatterValue(text, "description")) {
    issues.push({ type: "missing_description", file: filePath, name });
  }
  if (GENERIC_NAMES.has(name)) issues.push({ type: "generic_name", file: filePath, name });
  for (const marker of STALE_MARKERS) {
    if (marker.test(text) || marker.test(name)) {
      issues.push({ type: "stale_marker", file: filePath, name, marker: marker.source });
    }
  }
  return issues;
}

function stripMarkdownDestination(destination) {
  let target = String(destination || "").trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1).trim();
  const anchorOrQuery = target.search(/[?#]/u);
  if (anchorOrQuery >= 0) target = target.slice(0, anchorOrQuery);
  if (!target || target.startsWith("#") || URL_SCHEME.test(target) || target.startsWith("//")) return "";
  if (TEMPLATE_MARKER.test(target)) return "";
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function markdownReferences(text) {
  const references = [];
  const lines = String(text || "").split(/\r\n|\r|\n/u);
  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/u);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const trailing = fenceMatch[2];
      if (!fence) {
        fence = { character: marker[0], length: marker.length };
      } else if (fence.character === marker[0] && marker.length >= fence.length && !trailing.trim()) {
        fence = null;
      }
      continue;
    }
    if (fence) continue;
    const searchable = line.replace(/(`+)(?:(?!\1)[^\n])*?\1/gu, "");
    const patterns = [
      /!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/gu,
      /^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gu,
    ];
    for (const pattern of patterns) {
      for (const match of searchable.matchAll(pattern)) {
        const target = stripMarkdownDestination(match[1]);
        if (!target || !LOCAL_FILE_EXTENSION.test(target)) continue;
        references.push({ target, line: index + 1 });
      }
    }
  }
  return references;
}

async function readDisabledPaths(repoRoot, disabledSkillPaths = []) {
  const selectors = [];
  for (const value of disabledSkillPaths) {
    if (typeof value !== "string" || !value.trim()) continue;
    const absolute = path.resolve(repoRoot, value);
    let realPath = "";
    try {
      realPath = await fs.realpath(absolute);
    } catch {
      // A not-yet-existing selector can still match a lexical candidate path.
    }
    selectors.push({ absolute, realPath });
  }
  return selectors;
}

function isDisabledSkill(candidate, selectors) {
  const absolute = path.resolve(candidate.absolute);
  return selectors.some((selector) => {
    if (absolute === selector.absolute || absolute === selector.realPath || candidate.realPath === selector.realPath) return true;
    const directory = selector.realPath || selector.absolute;
    return absolute.startsWith(`${directory}${path.sep}`) || candidate.realPath.startsWith(`${directory}${path.sep}`);
  });
}

function rootErrorIssue(repoRoot, root, entry) {
  const code = entry.error?.code || "UNKNOWN";
  const message = entry.error?.message || String(entry.error);
  return {
    type: "skill_root_error",
    root: displayPath(repoRoot, root),
    path: displayPath(repoRoot, entry.path),
    code,
    message,
  };
}

function normalizeRoots(repoRoot, options) {
  if (Object.prototype.hasOwnProperty.call(options, "skillRoots")) {
    if (!Array.isArray(options.skillRoots)) throw new TypeError("options.skillRoots must be an array of paths");
    return options.skillRoots.map((root) => {
      if (typeof root !== "string" || !root.trim()) throw new TypeError("skill root paths must be non-empty strings");
      return path.resolve(repoRoot, root);
    });
  }
  const legacy = options.skillRoot || DEFAULT_SKILL_ROOT;
  if (typeof legacy !== "string" || !legacy.trim()) throw new TypeError("options.skillRoot must be a non-empty path");
  return [path.resolve(repoRoot, legacy)];
}

export async function auditSkillTree(repoRoot = process.cwd(), options = {}) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const roots = normalizeRoots(resolvedRepoRoot, options);
  const explicitRoots = Object.prototype.hasOwnProperty.call(options, "skillRoots") || Object.prototype.hasOwnProperty.call(options, "skillRoot");
  const disabledPaths = Array.isArray(options.disabledSkillPaths) ? options.disabledSkillPaths : [];
  const disabledSelectors = await readDisabledPaths(resolvedRepoRoot, disabledPaths);
  const visitedDirectories = new Set();
  const visitedFiles = new Set();
  const candidates = [];
  const rootErrors = [];
  for (const root of roots) {
    const discovered = await walkSkillFiles(root, {
      sourceRoot: root,
      visitedDirectories,
      visitedFiles,
    });
    candidates.push(...discovered.files);
    for (const entry of discovered.errors) {
      const isImplicitMissingDefault = !explicitRoots
        && roots.length === 1
        && root === path.resolve(resolvedRepoRoot, DEFAULT_SKILL_ROOT)
        && entry.path === root
        && entry.error?.code === "ENOENT";
      if (!isImplicitMissingDefault) rootErrors.push(rootErrorIssue(resolvedRepoRoot, root, entry));
    }
  }

  const skills = [];
  const issues = [...rootErrors];
  const activeNames = new Map();
  candidates.sort((left, right) => {
    const sourceOrder = left.sourceRoot.localeCompare(right.sourceRoot);
    return sourceOrder || left.absolute.localeCompare(right.absolute);
  });
  for (const candidate of candidates) {
    let text;
    try {
      text = await fs.readFile(candidate.realPath, "utf8");
    } catch (error) {
      issues.push({
        type: "skill_read_error",
        file: displayPath(resolvedRepoRoot, candidate.absolute),
        path: candidate.realPath,
        code: error?.code || "UNKNOWN",
        message: error?.message || String(error),
      });
      continue;
    }
    const name = frontmatterValue(text, "name");
    const enabled = !isDisabledSkill(candidate, disabledSelectors);
    const relative = displayPath(resolvedRepoRoot, candidate.absolute);
    const sourceRoot = displayPath(resolvedRepoRoot, candidate.sourceRoot);
    const skill = {
      name,
      path: relative,
      source_root: sourceRoot,
      resolved_path: candidate.realPath,
      bytes: Buffer.byteLength(text, "utf8"),
      lines: lineCount(text),
      enabled,
    };
    skills.push(skill);
    issues.push(...scanSkillText(text, relative, name));
    if (!enabled) continue;

    const previous = activeNames.get(name) || [];
    previous.push(relative);
    activeNames.set(name, previous);
    for (const reference of markdownReferences(text)) {
      const target = path.isAbsolute(reference.target)
        ? path.normalize(reference.target)
        : path.resolve(path.dirname(candidate.realPath), reference.target);
      try {
        const stat = await fs.stat(target);
        if (!stat.isFile()) throw Object.assign(new Error("Referenced path is not a file"), { code: "ENOTFILE" });
      } catch (error) {
        issues.push({
          type: "missing_reference",
          file: relative,
          name,
          reference: reference.target,
          line: reference.line,
          code: error?.code || "ENOENT",
        });
      }
    }
  }

  for (const [name, paths] of activeNames.entries()) {
    if (name && paths.length > 1) issues.push({ type: "duplicate_name", name, paths });
  }

  const rootLabels = roots.map((root) => displayPath(resolvedRepoRoot, root));
  const installedCount = skills.length;
  const activeCount = skills.filter((skill) => skill.enabled).length;
  return {
    root: rootLabels.length === 1 ? rootLabels[0] : rootLabels.join(","),
    roots: rootLabels,
    status: installedCount > 0 ? "ok" : "empty_or_missing",
    skill_count: installedCount,
    installed_skill_count: installedCount,
    active_skill_count: activeCount,
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

function parseCliArguments(argv) {
  const skillRoots = [];
  const disabledSkillPaths = [];
  let json = false;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") json = true;
    else if (argument === "--help") help = true;
    else if (argument === "--skill-root" || argument === "--disabled-skill") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
      (argument === "--skill-root" ? skillRoots : disabledSkillPaths).push(value);
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return {
    json,
    help,
    options: skillRoots.length || disabledSkillPaths.length
      ? { ...(skillRoots.length ? { skillRoots } : {}), ...(disabledSkillPaths.length ? { disabledSkillPaths } : {}) }
      : {},
  };
}

function renderUsage() {
  return [
    "Usage: node docs/workspace/skill-hygiene.mjs [options]",
    "",
    "Options:",
    "  --json                    Emit the complete audit as JSON.",
    "  --skill-root PATH         Add a skill root; may be repeated.",
    "  --disabled-skill PATH     Disable a skill path; may be repeated.",
    "  --help                    Show this help and exit.",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const parsed = parseCliArguments(process.argv.slice(2));
    if (parsed.help) {
      process.stdout.write(`${renderUsage()}\n`);
      process.exitCode = 0;
    } else {
      const result = await auditSkillTree(process.cwd(), parsed.options);
      if (parsed.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else process.stdout.write(`${renderSkillAudit(result)}\n`);
      process.exitCode = result.issues.length > 0 ? 1 : 0;
    }
  } catch (error) {
    process.stderr.write(`skill-hygiene: ${error?.message || String(error)}\n`);
    process.exitCode = 2;
  }
}
