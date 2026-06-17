#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
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
  await fs.writeFile(projectsMdPath(repoRoot), renderProjectsMd(registry, repoRoot), "utf8");
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
    process.stdout.write(`Regenerated PROJECTS.md from ${path.relative(repoRoot, registryPath(repoRoot))}.\n`);
    return;
  }
  process.stdout.write(`Registered project: ${result.project.name} (${result.project.slug})\n`);
  process.stdout.write(`Ops docs: ${path.join(repoRoot, result.project.ops_surface)}\n`);
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
  buildProject,
  createSurfaces,
  defaultRepoRoot,
  parseArgs,
  registerProject,
  renderOpsReadme,
  renderProjectsMd,
  splitValues,
};
