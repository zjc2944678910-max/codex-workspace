#!/usr/bin/env node

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KIND_BUCKETS = {
  product: "products",
  infrastructure: "infrastructure",
  research: "research",
  migration: "migrations",
};

const DEFAULT_RISK = {
  product: "local",
  infrastructure: "local",
  research: "research_local",
  migration: "local",
};

const RISK_PROFILES = new Set(["local", "research_local", "live_product", "live_infra"]);
const GITNEXUS_STATUSES = new Set(["unknown", "indexed", "not_indexed", "not_targeted"]);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u;

function parseArgs(argv = []) {
  const options = {
    repo: "",
    slug: "",
    name: "",
    kind: "",
    codeRoot: "",
    opsOnly: false,
    riskProfile: "",
    alias: [],
    routingKeyword: [],
    liveHost: [],
    service: [],
    gitnexusStatus: "unknown",
    codeRole: "main",
    dryRun: false,
    regen: false,
    symlink: true,
    grokSync: true,
    antigravitySync: true,
    claudeSync: true,
    opencodeSync: true,
    claudeLiteSync: true,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--repo") {
      options.repo = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--slug") {
      options.slug = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--name") {
      options.name = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--kind") {
      options.kind = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--code-root") {
      options.codeRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--ops-only") {
      options.opsOnly = true;
      continue;
    }
    if (arg === "--risk-profile") {
      options.riskProfile = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--alias") {
      options.alias.push(String(argv[index + 1] || ""));
      index += 1;
      continue;
    }
    if (arg === "--routing-keyword") {
      options.routingKeyword.push(String(argv[index + 1] || ""));
      index += 1;
      continue;
    }
    if (arg === "--live-host") {
      options.liveHost.push(String(argv[index + 1] || ""));
      index += 1;
      continue;
    }
    if (arg === "--service") {
      options.service.push(String(argv[index + 1] || ""));
      index += 1;
      continue;
    }
    if (arg === "--gitnexus-status") {
      options.gitnexusStatus = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--code-role") {
      options.codeRole = String(argv[index + 1] || "").trim() || "main";
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--regen") {
      options.regen = true;
      continue;
    }
    if (arg === "--no-symlink") {
      options.symlink = false;
      continue;
    }
    if (arg === "--no-grok-sync") {
      options.grokSync = false;
      continue;
    }
    if (arg === "--no-antigravity-sync") {
      options.antigravitySync = false;
      continue;
    }
    if (arg === "--no-claude-sync") {
      options.claudeSync = false;
      continue;
    }
    if (arg === "--no-opencode-sync") {
      options.opencodeSync = false;
      continue;
    }
    if (arg === "--no-claude-lite-sync") {
      options.claudeLiteSync = false;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  return [
    "Usage:",
    "  node docs/workspace/codex-register-project.mjs --regen",
    "  node docs/workspace/codex-register-project.mjs --slug <slug> --name \"<Name>\" --kind <kind>",
    "",
    "Options:",
    "  --kind product|infrastructure|research|migration",
    "  --code-root <path>          Defaults to projects/<bucket>/<slug>.",
    "  --ops-only                  Register an ops-only project with no local code root.",
    "  --risk-profile <profile>    local|research_local|live_product|live_infra.",
    "  --alias <value>             Repeatable or comma-separated.",
    "  --routing-keyword <value>   Repeatable or comma-separated.",
    "  --live-host <value>         Repeatable or comma-separated.",
    "  --service <value>           Repeatable or comma-separated.",
    "  --gitnexus-status <value>   unknown|indexed|not_indexed|not_targeted.",
    "  --dry-run                   Print the project record without writing files.",
    "  --no-symlink                Skip auto-creating the claude-workspace symlink.",
    "  --no-grok-sync              Skip importing the new project into grok-workspace.",
    "  --no-antigravity-sync       Skip importing the new project into antigravity-workspace.",
    "  --no-claude-sync            Skip importing the new project into claude-workspace.",
    "  --no-opencode-sync          Skip importing the new project into opencode-workspace.",
    "  --no-claude-lite-sync       Skip importing the new project into claude-lite-workspace.",
    "",
  ].join("\n");
}

function splitValues(values = []) {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    for (const item of String(value || "").split(",")) {
      const cleaned = item.trim();
      if (cleaned && !seen.has(cleaned)) {
        seen.add(cleaned);
        result.push(cleaned);
      }
    }
  }
  return result;
}

function dedupe(values = []) {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const cleaned = String(value || "").trim();
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }
  return result;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function registryPath(repoRoot) {
  return path.join(repoRoot, "docs", "workspace", "project-registry.json");
}

function projectsMdPath(repoRoot) {
  return path.join(repoRoot, "PROJECTS.md");
}

function mocPath(repoRoot) {
  return path.join(repoRoot, "MOC.md");
}

function projectSurfacesPath(repoRoot) {
  return path.join(repoRoot, "docs", "workspace", "project-surfaces.md");
}

function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

async function loadRegistry(repoRoot) {
  const raw = await fs.readFile(registryPath(repoRoot), "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("project registry must be a JSON object");
  if (!Array.isArray(parsed.projects)) parsed.projects = [];
  return parsed;
}

async function saveRegistry(repoRoot, registry) {
  registry.updated = today();
  await fs.writeFile(registryPath(repoRoot), `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function asWorkspacePath(repoRoot, value) {
  const expanded = String(value || "").trim();
  if (!expanded) return "";
  if (path.isAbsolute(expanded)) return path.normalize(expanded);
  return path.join(repoRoot, expanded);
}

function displayPath(repoRoot, absolutePath) {
  const relative = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  return absolutePath.replace(/\\/g, "/");
}

function defaultCodeRoot(repoRoot, kind, slug) {
  return path.join(repoRoot, "projects", KIND_BUCKETS[kind], slug);
}

function defaultRisk(kind, liveHosts = []) {
  const base = DEFAULT_RISK[kind] || "local";
  if (liveHosts.length === 0 || base !== "local") return base;
  return kind === "infrastructure" ? "live_infra" : "live_product";
}

function projectCodeRootPaths(project = {}) {
  const roots = [];
  for (const entry of Array.isArray(project.code_roots) ? project.code_roots : []) {
    if (typeof entry === "string" && entry.trim()) {
      roots.push(entry.trim());
      continue;
    }
    if (typeof entry?.path === "string" && entry.path.trim()) roots.push(entry.path.trim());
  }
  return roots;
}

function projectDisplayCodeRoots(project = {}) {
  const roots = projectCodeRootPaths(project);
  return roots.length > 0 ? roots : ["ops-only"];
}

function tableCell(value = "") {
  return String(value || "").replace(/\|/gu, "\\|");
}

function mdCode(value = "") {
  return `\`${String(value || "").replace(/`/gu, "\\`")}\``;
}

function inlineValues(values = [], fallback = "-") {
  const cleaned = dedupe(values);
  return cleaned.length > 0 ? cleaned.map(mdCode).join(", ") : fallback;
}

function tableCodeValues(values = [], fallback = "-") {
  const cleaned = dedupe(values);
  return cleaned.length > 0 ? cleaned.map(mdCode).join("<br>") : fallback;
}

function validateOptions(options = {}) {
  if (options.help || options.regen) return;
  if (!options.slug || !options.name || !options.kind) {
    throw new Error("Missing required args: --slug, --name, and --kind (or pass --regen).");
  }
  if (!SLUG_RE.test(options.slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }
  if (!Object.hasOwn(KIND_BUCKETS, options.kind)) {
    throw new Error(`Unsupported kind: ${options.kind}`);
  }
  if (options.riskProfile && !RISK_PROFILES.has(options.riskProfile)) {
    throw new Error(`Unsupported risk profile: ${options.riskProfile}`);
  }
  if (!GITNEXUS_STATUSES.has(options.gitnexusStatus)) {
    throw new Error(`Unsupported GitNexus status: ${options.gitnexusStatus}`);
  }
}

function buildProject(repoRoot, options = {}) {
  validateOptions(options);
  const liveHosts = splitValues(options.liveHost);
  const services = splitValues(options.service);
  const aliases = splitValues(options.alias);
  const routingKeywords = dedupe([
    ...splitValues(options.routingKeyword),
    options.slug,
    options.name,
    ...aliases,
  ]);
  const riskProfile = options.riskProfile || defaultRisk(options.kind, liveHosts);
  const opsSurfacePath = path.join(repoRoot, "ops", "projects", options.slug);
  const stateDataPath = path.join(repoRoot, "state", "project-data", options.slug);
  const scratchPath = path.join(repoRoot, "scratch", "projects", options.slug);

  const codeRoots = [];
  const surfaces = [];
  if (!options.opsOnly) {
    const codeRootPath = options.codeRoot
      ? asWorkspacePath(repoRoot, options.codeRoot)
      : defaultCodeRoot(repoRoot, options.kind, options.slug);
    const relativeCodeRoot = displayPath(repoRoot, codeRootPath);
    surfaces.push(relativeCodeRoot);
    codeRoots.push({
      path: relativeCodeRoot,
      role: options.codeRole || "main",
      gitnexus_status: options.gitnexusStatus || "unknown",
    });
  }

  return {
    project: {
      slug: options.slug,
      name: options.name,
      kind: options.kind,
      risk_profile: riskProfile,
      surfaces,
      code_roots: codeRoots,
      ops_surface: displayPath(repoRoot, opsSurfacePath),
      state_data: displayPath(repoRoot, stateDataPath),
      scratch: displayPath(repoRoot, scratchPath),
      aliases,
      routing_keywords: routingKeywords,
      live_host_aliases: liveHosts,
      service_names: services,
      gitnexus_indexed: options.gitnexusStatus === "indexed",
    },
    paths: {
      code_roots: codeRoots.map((entry) => asWorkspacePath(repoRoot, entry.path)),
      ops_surface: opsSurfacePath,
      state_data: stateDataPath,
      scratch: scratchPath,
    },
  };
}

function renderOpsReadme(project = {}) {
  const codeRoots = projectDisplayCodeRoots(project);
  return [
    `# ${project.name} Ops Surface`,
    "",
    `This directory is the operator-facing surface for \`${project.slug}\`.`,
    "",
    "## Routing Evidence",
    "",
    `- Project name: ${mdCode(project.name)}`,
    `- Aliases: ${inlineValues(project.aliases)}`,
    `- Registry routing keywords: ${inlineValues(project.routing_keywords)}`,
    `- Main code: ${inlineValues(codeRoots)}`,
    `- Ops surface: ${mdCode(project.ops_surface)}`,
    `- State/data: ${mdCode(project.state_data)}`,
    `- Scratch: ${mdCode(project.scratch)}`,
    "- Reports: `reports/`",
    "- Runbooks: `runbooks/`",
    `- Live host aliases: ${inlineValues(project.live_host_aliases)}`,
    `- Service names: ${inlineValues(project.service_names)}`,
    `- Registry risk profile: ${mdCode(project.risk_profile)}`,
    "",
    "Route into this project only when the user explicitly names one of these",
    "entries, provides a matching path, or asks for a file that belongs to this",
    "surface.",
    "",
    "Mirror machine-readable fields in `docs/workspace/project-registry.json`.",
    "Regenerate the short human index with:",
    "",
    "```bash",
    "node docs/workspace/codex-register-project.mjs --regen",
    "```",
    "",
    "## Stable Docs",
    "",
    "- `README.md`",
    "- `DEPLOYMENT_LEDGER.md` when deployment history exists",
    "- `ARCHITECTURE_TODO.md` when architecture backlog exists",
    "- `manifests/`",
    "- `reports/`",
    "- `runbooks/`",
    "",
    "## Subdirectories",
    "",
    "- `manifests/`: tracked operator manifests and inventory notes",
    "- `reports/`: tracked durable project reports and audit writeups",
    "- `runbooks/`: tracked project-specific operational procedures",
    "- `mirrors/`: local mirrors of service units, tools, and runtime artifacts",
    "- `evidence/`: timestamped evidence bundles for audits and repairs",
    "- `rollback/`: timestamped rollback bundles for reversible change sets",
    "- `logs/`: time-bucketed operator logs",
    "- `quarantine/`: legacy artifacts or uncertain evidence retained locally",
    "",
    "`mirrors/`, `evidence/`, `logs/`, `quarantine/`, and `rollback/` are",
    "local-only by default and are not part of the workspace-index repository",
    "surface.",
    "",
  ].join("\n");
}

function renderProjectsMd(registry = {}, repoRoot = "") {
  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  const sibling = registry.sibling_workspace || {};
  const lines = [
    "# Project Index",
    "",
    "<!-- GENERATED FILE - do not edit by hand.",
    "     Update docs/workspace/project-registry.json, then run:",
    "     node docs/workspace/codex-register-project.mjs --regen -->",
    "",
    "Short human-readable project map for Codex sessions started from",
    "`codex-workspace`.",
    "",
    "Machine source of truth: `docs/workspace/project-registry.json`.",
    "",
    "## Workspace Roots",
    "",
    `- Codex workspace root: ${mdCode(repoRoot || "/Users/zhangjincheng/Documents/GitHub/codex-workspace")}`,
  ];
  if (typeof sibling.root === "string" && sibling.root.trim()) {
    lines.push(`- Sibling workspace: ${mdCode(sibling.root)}`);
  }
  lines.push("", "## Active Projects", "");
  if (projects.length === 0) {
    lines.push("No active projects are registered yet.", "");
  } else {
    lines.push("| Project | Kind | Risk | Code Root(s) | Ops Surface |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const project of [...projects].sort((left, right) => String(left.slug).localeCompare(String(right.slug)))) {
      const projectName = `**${tableCell(project.name || project.slug)}** (${mdCode(project.slug)})`;
      lines.push([
        tableCell(projectName),
        tableCell(project.kind || ""),
        tableCell(project.risk_profile || ""),
        tableCell(tableCodeValues(projectDisplayCodeRoots(project))),
        tableCell(mdCode(project.ops_surface || "")),
      ].join(" | ").replace(/^/u, "| ").replace(/$/u, " |"));
    }
    lines.push("");
  }
  lines.push(
    "## Routing",
    "",
    "- Route by explicit project name, registered alias, host/service, path, or file.",
    "- Code implementation belongs in the registered code root or external live source.",
    "- Durable project facts belong in `ops/projects/<slug>/README.md`.",
    "- Temporary work belongs in `scratch/projects/<slug>/` or `scratch/shared/`.",
    "- Imported raw material belongs in ignored `inbox/`; cross-tool summaries belong in ignored `handoffs/`.",
    "- Live/NAS/VPS/production tasks default to L2 read-only audit; L3 repair still needs `进入修复阶段`.",
    "",
    "## Registration",
    "",
    "```bash",
    "node docs/workspace/codex-register-project.mjs --slug <slug> --name \"<Name>\" --kind product",
    "node docs/workspace/codex-register-project.mjs --regen",
    "```",
    "",
  );
  if (typeof sibling.root === "string" && sibling.root.trim()) {
    lines.push("## Sibling Workspace", "", `- Name: ${mdCode(sibling.name || "sibling")}`);
    lines.push(`- Root: ${mdCode(sibling.root)}`);
    if (typeof sibling.registry === "string" && sibling.registry.trim()) {
      lines.push(`- Registry: ${mdCode(sibling.registry)}`);
    }
    if (Array.isArray(sibling.projects) && sibling.projects.length > 0) {
      lines.push(`- Primarily maintained there: ${inlineValues(sibling.projects)}`);
    }
    if (typeof sibling.note === "string" && sibling.note.trim()) {
      lines.push("", sibling.note.trim());
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

const MOC_PROJECTS_START = "<!-- BEGIN GENERATED PROJECT LINKS -->";
const MOC_PROJECTS_END = "<!-- END GENERATED PROJECT LINKS -->";
const PROJECT_SURFACES_START = "<!-- BEGIN GENERATED PROJECT SURFACES -->";
const PROJECT_SURFACES_END = "<!-- END GENERATED PROJECT SURFACES -->";

function replaceGeneratedSection(document = "", options = {}) {
  const heading = String(options.heading || "").trim();
  const startMarker = String(options.startMarker || "").trim();
  const endMarker = String(options.endMarker || "").trim();
  const body = String(options.body || "").trim();
  const fallbackPrefix = String(options.fallbackPrefix || "").trim();
  const lines = String(document || "").replace(/\r\n/gu, "\n").split("\n");
  const generatedLines = [startMarker, ...(body ? body.split("\n") : []), endMarker];
  const existingStart = lines.indexOf(startMarker);
  const existingEnd = lines.indexOf(endMarker);

  if (existingStart >= 0 && existingEnd > existingStart) {
    lines.splice(existingStart, existingEnd - existingStart + 1, ...generatedLines);
    return `${lines.join("\n").trimEnd()}\n`;
  }

  const headingIndex = lines.indexOf(heading);
  if (headingIndex >= 0) {
    let nextHeading = lines.findIndex((line, index) => index > headingIndex && /^##\s+/u.test(line));
    if (nextHeading < 0) nextHeading = lines.length;
    lines.splice(headingIndex + 1, nextHeading - headingIndex - 1, "", ...generatedLines, "");
    return `${lines.join("\n").trimEnd()}\n`;
  }

  const prefix = String(document || "").trim() || fallbackPrefix;
  return `${[prefix, heading, "", ...generatedLines].filter((line, index, all) => line || all[index - 1] !== "").join("\n").trimEnd()}\n`;
}

function renderMocProjectSection(registry = {}) {
  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  return [...projects]
    .sort((left, right) => String(left.slug).localeCompare(String(right.slug)))
    .map((project) => {
      const opsSurface = project.ops_surface || `ops/projects/${project.slug}`;
      return `- [[${opsSurface}/README|${project.name || project.slug} (${project.slug})]]`;
    })
    .join("\n");
}

function renderMoc(registry = {}, existing = "") {
  return replaceGeneratedSection(existing, {
    heading: "## 项目 (ops/projects)",
    startMarker: MOC_PROJECTS_START,
    endMarker: MOC_PROJECTS_END,
    body: renderMocProjectSection(registry),
    fallbackPrefix: [
      "# 知识库总览 (MOC)",
      "",
      "> Map of Content — codex-workspace 的 Obsidian 图谱中心枢纽。",
      "> 给人导航用;机器路由真源是 `docs/workspace/project-registry.json`。",
    ].join("\n"),
  });
}

async function loadLocalGitNexusMetadata(repoRoot, registry = {}) {
  const metadata = {};
  for (const project of Array.isArray(registry.projects) ? registry.projects : []) {
    for (const codeRoot of Array.isArray(project.code_roots) ? project.code_roots : []) {
      const codeRootPath = typeof codeRoot === "string" ? codeRoot : codeRoot?.path;
      if (!codeRootPath || path.isAbsolute(codeRootPath)) continue;
      const absoluteRoot = path.resolve(repoRoot, codeRootPath);
      const relativeRoot = path.relative(repoRoot, absoluteRoot);
      if (!relativeRoot || relativeRoot === ".." || relativeRoot.startsWith(`..${path.sep}`)) continue;
      try {
        metadata[codeRootPath] = JSON.parse(await fs.readFile(path.join(absoluteRoot, ".gitnexus", "meta.json"), "utf8"));
      } catch (error) {
        if (!["ENOENT", "ENOTDIR", "EACCES"].includes(error?.code)) throw error;
      }
    }
  }
  return metadata;
}

function formatGitNexusStatus(codeRoot = {}, metadata = null) {
  const status = String(codeRoot?.gitnexus_status || "unknown").trim() || "unknown";
  const role = String(codeRoot?.role || "main").trim() || "main";
  if (status !== "indexed") return `${mdCode(role)}: ${mdCode(status)}`;
  const commit = String(metadata?.lastCommit || "").trim();
  const indexedDate = String(metadata?.indexedAt || "").slice(0, 10);
  const details = [commit ? `at ${mdCode(commit.slice(0, 7))}` : "", indexedDate ? `(${indexedDate})` : ""]
    .filter(Boolean)
    .join(" ");
  return `${mdCode(role)}: ${mdCode(status)}${details ? ` ${details}` : " (local metadata missing)"}`;
}

function renderProjectSurfacesProjectSection(registry = {}, metadata = {}) {
  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  const lines = [
    "| Project | Registered Surface(s) | Working Code Root(s) | Ops Surface | GitNexus |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const project of [...projects].sort((left, right) => String(left.slug).localeCompare(String(right.slug)))) {
    const surfaces = Array.isArray(project.surfaces) && project.surfaces.length > 0
      ? tableCodeValues(project.surfaces)
      : "ops-only";
    const codeRoots = Array.isArray(project.code_roots) ? project.code_roots : [];
    const workingRoots = codeRoots.length > 0
      ? tableCodeValues(codeRoots.map((entry) => typeof entry === "string" ? entry : entry?.path).filter(Boolean))
      : "ops-only";
    const gitnexus = codeRoots.length > 0
      ? codeRoots.map((entry) => {
        const normalized = typeof entry === "string" ? { path: entry, role: "main", gitnexus_status: "unknown" } : entry;
        return formatGitNexusStatus(normalized, metadata[normalized?.path] || null);
      }).join(";<br>")
      : mdCode(project.gitnexus_indexed === true ? "indexed" : "not_indexed");
    lines.push([
      tableCell(project.name || project.slug),
      tableCell(surfaces),
      tableCell(workingRoots),
      tableCell(mdCode(project.ops_surface || `ops/projects/${project.slug}`)),
      tableCell(gitnexus),
    ].join(" | ").replace(/^/u, "| ").replace(/$/u, " |"));
  }
  return lines.join("\n");
}

function renderProjectSurfaces(registry = {}, metadata = {}, existing = "") {
  return replaceGeneratedSection(existing, {
    heading: "## Registered Projects",
    startMarker: PROJECT_SURFACES_START,
    endMarker: PROJECT_SURFACES_END,
    body: renderProjectSurfacesProjectSection(registry, metadata),
    fallbackPrefix: [
      "# Project Surfaces Summary",
      "",
      "Human-readable overview generated from `project-registry.json` and local GitNexus metadata.",
    ].join("\n"),
  });
}

async function createSurfaces(project = {}, paths = {}) {
  for (const codeRoot of paths.code_roots || []) {
    await fs.mkdir(codeRoot, { recursive: true });
  }
  await fs.mkdir(paths.ops_surface, { recursive: true });
  await fs.mkdir(paths.state_data, { recursive: true });
  await fs.mkdir(paths.scratch, { recursive: true });
  for (const name of ["manifests", "reports", "runbooks"]) {
    await fs.mkdir(path.join(paths.ops_surface, name), { recursive: true });
  }
  const readmePath = path.join(paths.ops_surface, "README.md");
  try {
    await fs.access(readmePath);
  } catch {
    await fs.writeFile(readmePath, renderOpsReadme(project), "utf8");
  }
}

async function writeProjectsMd(repoRoot, registry) {
  const [existingMoc, existingProjectSurfaces, metadata] = await Promise.all([
    fs.readFile(mocPath(repoRoot), "utf8").catch((error) => error?.code === "ENOENT" ? "" : Promise.reject(error)),
    fs.readFile(projectSurfacesPath(repoRoot), "utf8").catch((error) => error?.code === "ENOENT" ? "" : Promise.reject(error)),
    loadLocalGitNexusMetadata(repoRoot, registry),
  ]);
  await Promise.all([
    fs.writeFile(projectsMdPath(repoRoot), renderProjectsMd(registry, repoRoot), "utf8"),
    fs.writeFile(mocPath(repoRoot), renderMoc(registry, existingMoc), "utf8"),
    fs.writeFile(
      projectSurfacesPath(repoRoot),
      renderProjectSurfaces(registry, metadata, existingProjectSurfaces),
      "utf8",
    ),
  ]);
}

async function registerProject(repoRoot, options = {}) {
  const registry = await loadRegistry(repoRoot);
  if (options.regen) {
    await writeProjectsMd(repoRoot, registry);
    return { ok: true, action: "regen", projects: registry.projects.length };
  }
  const { project, paths } = buildProject(repoRoot, options);
  if (registry.projects.some((entry) => entry?.slug === project.slug)) {
    throw new Error(`Project already registered: ${project.slug}`);
  }
  if (options.dryRun) {
    return { ok: true, action: "dry-run", project, paths };
  }
  await createSurfaces(project, paths);
  registry.projects.push(project);
  registry.projects.sort((left, right) => String(left.slug).localeCompare(String(right.slug)));
  await saveRegistry(repoRoot, registry);
  await writeProjectsMd(repoRoot, registry);
  return { ok: true, action: "register", project, paths };
}

function symlinkProjectToClaude(repoRoot, slug) {
  const script = path.join(repoRoot, "docs/workspace/symlink-projects-to-claude.sh");
  try {
    const run = spawnSync("bash", [script], { encoding: "utf8" });
    if (run.status === 0) {
      process.stdout.write(`Claude symlink: linked ${slug} into claude-workspace (symlink-projects-to-claude.sh).\n`);
    } else {
      process.stdout.write(`Claude symlink: skipped (script exit ${run.status}); run docs/workspace/symlink-projects-to-claude.sh manually.\n`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stdout.write(`Claude symlink: skipped (${msg}); run docs/workspace/symlink-projects-to-claude.sh manually.\n`);
  }
}

function grokWorkspaceRoot(repoRoot) {
  return frontDeskRoot(repoRoot, "grok-workspace");
}

function antigravityWorkspaceRoot(repoRoot) {
  return frontDeskRoot(repoRoot, "antigravity-workspace");
}

function frontDeskRoot(repoRoot, folderName) {
  return path.resolve(repoRoot, "..", folderName);
}

function notifyFrontDesk(repoRoot, slug, desk = {}) {
  const label = desk.label || "Front desk";
  const root = frontDeskRoot(repoRoot, desk.dir);
  const importer = path.join(root, "tools", "register-project.py");
  const linker = path.join(root, "tools", "symlink-from-codex.sh");
  if (!existsSync(importer)) {
    process.stdout.write(`${label} sync: skipped (importer missing at ${importer}).\n`);
    return { skipped: true, reason: "missing-importer" };
  }
  try {
    const imported = spawnSync("/usr/bin/python3", [importer, "--import-from-codex"], {
      encoding: "utf8",
      cwd: root,
    });
    if (imported.status !== 0) {
      const detail = (imported.stderr || imported.stdout || "").trim();
      process.stdout.write(`${label} sync: import failed for ${slug}${detail ? `: ${detail}` : ""}.\n`);
      return { skipped: false, ok: false, step: "import" };
    }
    process.stdout.write(`${label} sync: imported registry into ${desk.dir} (${slug}).\n`);
    if (existsSync(linker)) {
      const linked = spawnSync("bash", [linker], { encoding: "utf8", cwd: root });
      if (linked.status === 0) {
        process.stdout.write(`${label} sync: refreshed ${desk.dir} project symlinks.\n`);
      } else {
        process.stdout.write(`${label} sync: symlink script exit ${linked.status}; run ${desk.dir}/tools/symlink-from-codex.sh manually.\n`);
      }
    }
    return { skipped: false, ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stdout.write(`${label} sync: skipped (${msg}).\n`);
    return { skipped: true, reason: msg };
  }
}

const FRONT_DESKS = [
  { dir: "grok-workspace", label: "Grok", flag: "grokSync" },
  { dir: "antigravity-workspace", label: "Antigravity", flag: "antigravitySync" },
  { dir: "claude-workspace", label: "Claude", flag: "claudeSync" },
  { dir: "opencode-workspace", label: "Opencode", flag: "opencodeSync" },
  { dir: "claude-lite-workspace", label: "Claude Lite", flag: "claudeLiteSync" },
];

function notifyGrokWorkspace(repoRoot, slug) {
  return notifyFrontDesk(repoRoot, slug, { dir: "grok-workspace", label: "Grok" });
}

function notifyAntigravityWorkspace(repoRoot, slug) {
  return notifyFrontDesk(repoRoot, slug, { dir: "antigravity-workspace", label: "Antigravity" });
}

function notifyClaudeWorkspace(repoRoot, slug) {
  return notifyFrontDesk(repoRoot, slug, { dir: "claude-workspace", label: "Claude" });
}

function notifyOpencodeWorkspace(repoRoot, slug) {
  return notifyFrontDesk(repoRoot, slug, { dir: "opencode-workspace", label: "Opencode" });
}

function notifyClaudeLiteWorkspace(repoRoot, slug) {
  return notifyFrontDesk(repoRoot, slug, { dir: "claude-lite-workspace", label: "Claude Lite" });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  validateOptions(options);
  const repoRoot = path.resolve(options.repo || defaultRepoRoot());
  const result = await registerProject(repoRoot, options);
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (result.action === "regen") {
    process.stdout.write(`Regenerated PROJECTS.md, MOC.md, and docs/workspace/project-surfaces.md from ${path.relative(repoRoot, registryPath(repoRoot))}.\n`);
    return;
  }
  process.stdout.write(`Registered project: ${result.project.name} (${result.project.slug})\n`);
  process.stdout.write(`Ops docs: ${path.join(repoRoot, result.project.ops_surface)}\n`);
  // Auto-link the new project into claude-workspace. Only for the real codex repo
  // (skip when --repo overrides, e.g. tests) and only when a code root was created
  // (ops-only projects have no code dir to link).
  if (
    options.symlink &&
    repoRoot === defaultRepoRoot() &&
    (result.paths?.code_roots?.length || 0) > 0
  ) {
    symlinkProjectToClaude(repoRoot, result.project.slug);
  }
  if (repoRoot === defaultRepoRoot()) {
    for (const desk of FRONT_DESKS) {
      if (options[desk.flag]) notifyFrontDesk(repoRoot, result.project.slug, desk);
    }
  }
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
  FRONT_DESKS,
  antigravityWorkspaceRoot,
  buildProject,
  createSurfaces,
  defaultRepoRoot,
  grokWorkspaceRoot,
  notifyAntigravityWorkspace,
  notifyClaudeLiteWorkspace,
  notifyClaudeWorkspace,
  notifyFrontDesk,
  notifyGrokWorkspace,
  notifyOpencodeWorkspace,
  parseArgs,
  registerProject,
  renderMoc,
  renderMocProjectSection,
  renderOpsReadme,
  renderProjectSurfaces,
  renderProjectSurfacesProjectSection,
  renderProjectsMd,
  loadLocalGitNexusMetadata,
  splitValues,
};
