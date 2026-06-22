import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildProject, parseArgs, renderProjectsMd, splitValues } from "./codex-register-project.mjs";

const scriptPath = path.resolve(import.meta.dirname, "codex-register-project.mjs");
const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-register-project-"));
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(root, "ops", "projects"), { recursive: true });
  await fs.writeFile(
    path.join(root, "docs", "workspace", "project-registry.json"),
    JSON.stringify({
      "$schema": "workspace-project-registry/v1",
      "description": "fixture",
      "updated": "2026-01-01",
      "projects": [],
      "sibling_workspace": {
        "name": "claude-workspace",
        "root": "/tmp/claude-workspace",
        "registry": "registry/project-registry.json",
        "projects": ["other-app"]
      }
    }, null, 2),
    "utf8",
  );
  return root;
}

function runScript(repoRoot, args = []) {
  const result = spawnSync("node", [scriptPath, "--repo", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `script exited ${result.status}`).trim());
  }
  return result;
}

test("register-project parses comma-separated values", () => {
  assert.deepEqual(splitValues(["alpha,beta", " beta ", "gamma"]), ["alpha", "beta", "gamma"]);
  assert.equal(parseArgs(["--slug", "demo", "--name", "Demo", "--kind", "product"]).slug, "demo");
});

test("workspace project aliases are globally unique", async () => {
  const registry = JSON.parse(await fs.readFile(path.join(repoRoot, "docs", "workspace", "project-registry.json"), "utf8"));
  const owners = new Map();
  const duplicates = [];

  for (const project of registry.projects || []) {
    for (const alias of project.aliases || []) {
      if (typeof alias !== "string" || !alias.trim()) continue;
      const key = alias.trim().toLowerCase();
      const previous = owners.get(key);
      if (previous && previous !== project.slug) {
        duplicates.push({ alias, first: previous, second: project.slug });
      } else {
        owners.set(key, project.slug);
      }
    }
  }

  assert.deepEqual(duplicates, []);
});

test("register-project builds default surfaces and live risk", async () => {
  const repoRoot = await createFixture();
  const { project } = buildProject(repoRoot, parseArgs([
    "--slug", "sample-app",
    "--name", "Sample App",
    "--kind", "product",
    "--alias", "sample",
    "--live-host", "sample-host",
  ]));

  assert.equal(project.risk_profile, "live_product");
  assert.equal(project.code_roots[0].path, "projects/products/sample-app");
  assert.equal(project.ops_surface, "ops/projects/sample-app");
  assert.deepEqual(project.routing_keywords, ["sample-app", "Sample App", "sample"]);
});

test("register-project dry-run does not create surfaces", async () => {
  const repoRoot = await createFixture();
  const result = runScript(repoRoot, [
    "--slug", "dry-app",
    "--name", "Dry App",
    "--kind", "research",
    "--dry-run",
  ]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(parsed.action, "dry-run");
  await assert.rejects(fs.access(path.join(repoRoot, "ops", "projects", "dry-app")));
});

test("register-project creates project surfaces and generated index", async () => {
  const repoRoot = await createFixture();
  runScript(repoRoot, [
    "--slug", "sample-app",
    "--name", "Sample App",
    "--kind", "product",
    "--alias", "sample",
    "--routing-keyword", "sample keyword",
    "--service", "sample-api",
    "--gitnexus-status", "indexed",
  ]);

  const registry = JSON.parse(await fs.readFile(path.join(repoRoot, "docs", "workspace", "project-registry.json"), "utf8"));
  const project = registry.projects[0];
  assert.equal(project.slug, "sample-app");
  assert.equal(project.gitnexus_indexed, true);
  assert.equal(project.code_roots[0].gitnexus_status, "indexed");

  const readme = await fs.readFile(path.join(repoRoot, "ops", "projects", "sample-app", "README.md"), "utf8");
  assert.match(readme, /Sample App/u);
  assert.match(readme, /sample-api/u);

  const projectsMd = await fs.readFile(path.join(repoRoot, "PROJECTS.md"), "utf8");
  assert.match(projectsMd, /Sample App/u);
  assert.match(projectsMd, /projects\/products\/sample-app/u);

  await fs.access(path.join(repoRoot, "projects", "products", "sample-app"));
  await fs.access(path.join(repoRoot, "state", "project-data", "sample-app"));
  await fs.access(path.join(repoRoot, "scratch", "projects", "sample-app"));
});

test("register-project regen renders PROJECTS.md from existing registry", async () => {
  const repoRoot = await createFixture();
  const registry = {
    projects: [
      {
        slug: "ops-only",
        name: "Ops Only",
        kind: "infrastructure",
        risk_profile: "live_infra",
        code_roots: [],
        ops_surface: "ops/projects/ops-only",
      },
    ],
  };
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "project-registry.json"),
    JSON.stringify(registry, null, 2),
    "utf8",
  );

  runScript(repoRoot, ["--regen"]);
  const projectsMd = await fs.readFile(path.join(repoRoot, "PROJECTS.md"), "utf8");
  assert.match(projectsMd, /Ops Only/u);
  assert.match(projectsMd, /`ops-only`/u);
});

test("register-project renderer includes sibling workspace context", () => {
  const rendered = renderProjectsMd({
    projects: [],
    sibling_workspace: {
      name: "claude-workspace",
      root: "/tmp/claude",
      registry: "registry/project-registry.json",
      projects: ["pet-clinic"],
    },
  }, "/tmp/codex");

  assert.match(rendered, /Sibling Workspace/u);
  assert.match(rendered, /pet-clinic/u);
});
