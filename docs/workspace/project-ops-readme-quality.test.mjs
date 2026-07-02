import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repo = process.cwd();
const registryPath = path.join(repo, "docs", "workspace", "project-registry.json");

async function readProjectRegistry() {
  return JSON.parse(await fs.readFile(registryPath, "utf8"));
}

async function readProjectReadme(project) {
  const readmePath = path.join(repo, project.ops_surface, "README.md");
  return fs.readFile(readmePath, "utf8");
}

function isLiveProject(project) {
  return project.risk_profile === "live_infra" || project.risk_profile === "live_product";
}

test("project ops READMEs include the quality baseline", async () => {
  const registry = await readProjectRegistry();
  const required = [
    "## Ops Quality Baseline",
    "Current status:",
    "Risk gate:",
    "Common commands:",
    "Next useful work:",
    "Model review guidance:",
    "model-review-packets.md",
  ];

  for (const project of registry.projects) {
    const text = await readProjectReadme(project);
    for (const marker of required) {
      assert.ok(text.includes(marker), `${project.slug} missing ${marker}`);
    }
  }
});

test("project ops READMEs preserve live risk gates", async () => {
  const registry = await readProjectRegistry();

  for (const project of registry.projects) {
    const text = await readProjectReadme(project);
    const baseline = text.split("## Ops Quality Baseline")[1]?.split("\n## ")[0] || "";
    assert.ok(baseline, `${project.slug} missing baseline body`);

    if (isLiveProject(project)) {
      assert.match(baseline, /L2 read-only/u, `${project.slug} must declare L2 read-only`);
      assert.match(baseline, /进入修复阶段/u, `${project.slug} must declare L3 repair phrase`);
      assert.match(baseline, /not proof of current live health/u, `${project.slug} must not imply fresh live health`);
      assert.match(baseline, /bounded, redacted, read-only evidence/u, `${project.slug} must bound model review evidence`);
    } else {
      assert.match(baseline, /L0\/L1/u, `${project.slug} must declare local risk level`);
      assert.match(baseline, /no live infrastructure is registered/u, `${project.slug} must declare no live infra`);
    }
  }
});

test("project ops READMEs include registry lookup commands", async () => {
  const registry = await readProjectRegistry();

  for (const project of registry.projects) {
    const text = await readProjectReadme(project);
    assert.match(
      text,
      new RegExp(`node docs/workspace/find-project\\.mjs ${project.slug.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u"),
      `${project.slug} missing find-project command`,
    );
    assert.match(text, /node docs\/workspace\/workspace-health\.mjs --repo "\$PWD" --limit 12/u);
  }
});

test("project ops README model packet links resolve", async () => {
  const registry = await readProjectRegistry();
  const missing = [];

  for (const project of registry.projects) {
    const readmePath = path.join(repo, project.ops_surface, "README.md");
    const text = await fs.readFile(readmePath, "utf8");
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
      const rawTarget = match[1];
      if (/^[a-z]+:/iu.test(rawTarget)) continue;
      const target = rawTarget.split("#")[0];
      if (!target) continue;
      const resolved = path.normalize(path.join(path.dirname(readmePath), target));
      try {
        await fs.access(resolved);
      } catch {
        missing.push(`${project.slug}: ${rawTarget} -> ${resolved}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
