import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("project surfaces list every registered project", async () => {
  const [registryText, surfacesText] = await Promise.all([
    fs.readFile(path.join(repoRoot, "docs", "workspace", "project-registry.json"), "utf8"),
    fs.readFile(path.join(repoRoot, "docs", "workspace", "project-surfaces.md"), "utf8"),
  ]);
  const registry = JSON.parse(registryText);
  for (const project of registry.projects) {
    const opsSurface = project.ops_surface || `ops/projects/${project.slug}`;
    const row = surfacesText
      .split(/\r?\n/u)
      .find((line) => line.startsWith("|") && line.includes(opsSurface));
    assert.ok(row, `project-surfaces.md missing ${project.slug}`);
  }
});
