import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repo = process.cwd();
const mapPath = path.join(repo, "docs", "workspace", "project-knowledge-map.md");
const registryPath = path.join(repo, "docs", "workspace", "project-registry.json");

async function readKnowledgeMap() {
  return fs.readFile(mapPath, "utf8");
}

async function readProjectRegistry() {
  return JSON.parse(await fs.readFile(registryPath, "utf8"));
}

function findProjectRow(mapText = "", project = {}) {
  const opsSurface = project.ops_surface || `ops/projects/${project.slug}`;
  return mapText
    .split(/\r?\n/u)
    .find((line) => line.startsWith("|") && line.includes(opsSurface)) || "";
}

test("project knowledge map includes every registered project", async () => {
  const [mapText, registry] = await Promise.all([readKnowledgeMap(), readProjectRegistry()]);

  for (const project of registry.projects) {
    const row = findProjectRow(mapText, project);
    assert.ok(row, `missing project row for ${project.slug}`);
    assert.match(row, new RegExp(project.slug.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
});

test("project knowledge map keeps live risk gates explicit", async () => {
  const [mapText, registry] = await Promise.all([readKnowledgeMap(), readProjectRegistry()]);

  for (const project of registry.projects) {
    const row = findProjectRow(mapText, project);
    assert.ok(row, `missing project row for ${project.slug}`);
    if (project.risk_profile === "live_infra" || project.risk_profile === "live_product") {
      assert.match(row, /L2/u, `${project.slug} must declare L2`);
      assert.match(row, /进入修复阶段/u, `${project.slug} must declare the L3 repair gate phrase`);
    } else {
      assert.match(row, /no live infra/u, `${project.slug} must explicitly say it has no live infra`);
    }
  }
});

test("project knowledge map has explicit Sub2API role split", async () => {
  const mapText = await readKnowledgeMap();
  assert.match(mapText, /Sub2API-as-service/u);
  assert.match(mapText, /Sub2API-as-advisor/u);
  assert.match(mapText, /read-only reasoning\/drafting\/review aid/u);
});

test("project knowledge map relative links resolve locally", async () => {
  const mapText = await readKnowledgeMap();
  const missing = [];
  for (const match of mapText.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const rawTarget = match[1];
    if (/^[a-z]+:/iu.test(rawTarget)) continue;
    const target = rawTarget.split("#")[0];
    if (!target) continue;
    const resolved = path.normalize(path.join(path.dirname(mapPath), target));
    try {
      await fs.access(resolved);
    } catch {
      missing.push(`${rawTarget} -> ${resolved}`);
    }
  }
  assert.deepEqual(missing, []);
});
