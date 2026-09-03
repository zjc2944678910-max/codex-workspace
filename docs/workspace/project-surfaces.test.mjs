import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  loadLocalGitNexusMetadata,
  renderMocProjectSection,
  renderProjectSurfacesProjectSection,
} from "./codex-register-project.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("project surfaces list every registered project", async () => {
  const [registryText, surfacesText, mocText] = await Promise.all([
    fs.readFile(path.join(repoRoot, "docs", "workspace", "project-registry.json"), "utf8"),
    fs.readFile(path.join(repoRoot, "docs", "workspace", "project-surfaces.md"), "utf8"),
    fs.readFile(path.join(repoRoot, "MOC.md"), "utf8"),
  ]);
  const registry = JSON.parse(registryText);
  const metadata = await loadLocalGitNexusMetadata(repoRoot, registry);
  assert.ok(surfacesText.includes(renderProjectSurfacesProjectSection(registry, metadata)));
  assert.ok(mocText.includes(renderMocProjectSection(registry)));
  for (const project of registry.projects) {
    const opsSurface = project.ops_surface || `ops/projects/${project.slug}`;
    const row = surfacesText
      .split(/\r?\n/u)
      .find((line) => line.startsWith("|") && line.includes(opsSurface));
    assert.ok(row, `project-surfaces.md missing ${project.slug}`);
    assert.match(mocText, new RegExp(`${project.ops_surface}/README\\|`, "u"), `MOC.md missing ${project.slug}`);
  }
});
