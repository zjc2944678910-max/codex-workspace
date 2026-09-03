#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const docsDir = path.dirname(modulePath);
const repoRoot = path.resolve(docsDir, "..", "..");
const DEFAULT_REGISTRY_PATH = path.join(docsDir, "project-registry.json");

function parseArgs(argv = []) {
  const options = {
    query: "",
    json: false,
    limit: 5,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
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
    if (!options.query) options.query = arg;
  }
  return options;
}

function normalize(value = "") {
  return String(value || "").trim().toLocaleLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function codeRootPaths(project = {}) {
  return asArray(project.code_roots)
    .map((entry) => typeof entry === "string" ? entry : entry?.path)
    .filter(Boolean);
}

function projectTerms(project = {}) {
  return [
    project.slug,
    project.name,
    project.kind,
    project.risk_profile,
    project.ops_surface,
    ...codeRootPaths(project),
    ...asArray(project.aliases),
    ...asArray(project.routing_keywords),
    ...asArray(project.live_host_aliases),
    ...asArray(project.service_names),
  ].filter(Boolean);
}

function scoreProject(project = {}, query = "") {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return { score: 0, matched_terms: [] };
  const matchedTerms = [];
  let score = 0;
  for (const term of projectTerms(project)) {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) continue;
    if (normalizedTerm === normalizedQuery) {
      matchedTerms.push(term);
      score = Math.max(score, 100);
    } else if (normalizedTerm.includes(normalizedQuery)) {
      matchedTerms.push(term);
      score = Math.max(score, 40 + Math.min(40, normalizedQuery.length));
    }
  }
  return { score, matched_terms: [...new Set(matchedTerms)] };
}

function findProjects(registry = {}, query = "", options = {}) {
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 5;
  return asArray(registry.projects)
    .map((project) => ({ project, ...scoreProject(project, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return String(left.project.slug).localeCompare(String(right.project.slug));
    })
    .slice(0, limit);
}

function routeEvidence(project = {}) {
  return {
    service_names: asArray(project.service_names),
    project_paths: [
      ...codeRootPaths(project),
      project.ops_surface,
    ].filter(Boolean),
  };
}

function assessRouteAmbiguity(query = "", matches = []) {
  const normalizedQuery = normalize(query);
  const topScore = matches[0]?.score || 0;
  const sharedHostMatches = matches.filter((match) => {
    if (!topScore || match.score !== topScore) return false;
    return asArray(match.project?.live_host_aliases)
      .some((alias) => normalize(alias) === normalizedQuery);
  });
  const ambiguous = sharedHostMatches.length > 1;
  return {
    ambiguous,
    ambiguity_reason: ambiguous ? "shared_host_alias_tie" : null,
    ambiguous_projects: ambiguous ? sharedHostMatches.map((match) => match.project.slug) : [],
    required_route_evidence: ambiguous ? ["service_name", "project_path"] : [],
    candidate_route_evidence: ambiguous
      ? Object.fromEntries(sharedHostMatches.map((match) => [match.project.slug, routeEvidence(match.project)]))
      : {},
  };
}

function riskGate(project = {}) {
  if (project.risk_profile === "live_infra" || project.risk_profile === "live_product") {
    return "L2 read-only first pass; L3 changes require `进入修复阶段`.";
  }
  return "L0/L1 local work; no live infra by default.";
}

async function pathExists(relativePath) {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  try {
    const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.posix.join(relativeDir.replace(/\\/gu, "/"), entry.name))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error && ["ENOENT", "ENOTDIR"].includes(error.code)) return [];
    throw error;
  }
}

async function projectEntrypoints(project = {}) {
  const opsSurface = project.ops_surface || `ops/projects/${project.slug}`;
  const entrypoints = {
    ops_readme: "",
    code_roots: codeRootPaths(project),
    runbooks: [],
    reports: [],
    durable_docs: [],
  };
  const opsReadme = path.posix.join(opsSurface, "README.md");
  if (await pathExists(opsReadme)) entrypoints.ops_readme = opsReadme;
  entrypoints.runbooks = await listMarkdownFiles(path.posix.join(opsSurface, "runbooks"));
  entrypoints.reports = await listMarkdownFiles(path.posix.join(opsSurface, "reports"));
  for (const doc of ["DEPLOYMENT_LEDGER.md", "ARCHITECTURE_TODO.md"]) {
    const relativePath = path.posix.join(opsSurface, doc);
    if (await pathExists(relativePath)) entrypoints.durable_docs.push(relativePath);
  }
  return entrypoints;
}

async function enrichMatches(matches = []) {
  const enriched = [];
  for (const match of matches) {
    enriched.push({
      ...match,
      risk_gate: riskGate(match.project),
      entrypoints: await projectEntrypoints(match.project),
    });
  }
  return enriched;
}

function renderProjectMatches(query = "", matches = [], route = assessRouteAmbiguity(query, matches)) {
  const lines = [
    `query: ${query}`,
    `matches: ${matches.length}`,
    `ambiguous: ${route.ambiguous ? "yes" : "no"}`,
  ];
  if (route.ambiguous) {
    lines.push(
      `ambiguity_reason: ${route.ambiguity_reason}`,
      `required_route_evidence: ${route.required_route_evidence.join(" or ")}`,
      "candidate_route_evidence:",
    );
    for (const slug of route.ambiguous_projects) {
      const evidence = route.candidate_route_evidence?.[slug] || {};
      lines.push(
        `- ${slug}`,
        `  service_names: ${evidence.service_names?.join(", ") || "-"}`,
        `  project_paths: ${evidence.project_paths?.join("; ") || "-"}`,
      );
    }
  }
  for (const match of matches) {
    const project = match.project;
    const entrypoints = match.entrypoints || {};
    lines.push(
      "",
      `- ${project.name} (${project.slug})`,
      `  kind: ${project.kind}`,
      `  risk: ${project.risk_profile}`,
      `  gate: ${match.risk_gate}`,
      `  matched: ${match.matched_terms.join(", ") || "-"}`,
      `  ops: ${entrypoints.ops_readme || project.ops_surface || "-"}`,
      `  code: ${entrypoints.code_roots?.length ? entrypoints.code_roots.join("; ") : "ops-only"}`,
    );
    if (entrypoints.durable_docs?.length) lines.push(`  durable_docs: ${entrypoints.durable_docs.join("; ")}`);
    if (entrypoints.runbooks?.length) lines.push(`  runbooks: ${entrypoints.runbooks.join("; ")}`);
    if (entrypoints.reports?.length) lines.push(`  reports: ${entrypoints.reports.join("; ")}`);
  }
  return `${lines.join("\n")}\n`;
}

async function loadProjectRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  return JSON.parse(await fs.readFile(registryPath, "utf8"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.query) {
    process.stderr.write("usage: node docs/workspace/find-project.mjs <query> [--json] [--limit N]\n");
    process.exitCode = 1;
    return;
  }
  const registry = await loadProjectRegistry();
  const allMatches = findProjects(registry, options.query, { limit: Number.MAX_SAFE_INTEGER });
  const route = assessRouteAmbiguity(options.query, allMatches);
  const matches = await enrichMatches(allMatches.slice(0, options.limit));
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ query: options.query, ...route, matches }, null, 2)}\n`);
    return;
  }
  process.stdout.write(renderProjectMatches(options.query, matches, route));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === modulePath) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export {
  assessRouteAmbiguity,
  enrichMatches,
  findProjects,
  loadProjectRegistry,
  parseArgs,
  projectTerms,
  renderProjectMatches,
  riskGate,
};
