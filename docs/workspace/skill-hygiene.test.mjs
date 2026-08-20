import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { auditSkillTree } from "./skill-hygiene.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const generatedArchive = path.join(repoRoot, "archive", "skills", "generated", "2026-04-18");

test("active local skills have no stale generated markers or duplicate names", async () => {
  const result = await auditSkillTree(repoRoot);
  assert.deepEqual(result.issues, []);
});

test("generated skill snapshots stay recoverable outside active discovery", async (context) => {
  try {
    await fs.access(generatedArchive);
  } catch {
    context.skip("local generated skill archive is not present in this checkout");
    return;
  }

  const entries = (await fs.readdir(generatedArchive, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.equal(entries.length, 17);
  assert.equal((await auditSkillTree(repoRoot)).skills.some((skill) => skill.path.includes("/generated/")), false);
  const report = await fs.readFile(path.join(repoRoot, "docs", "reports", "workspace-skill-audit-2026-08-20.md"), "utf8");
  for (const entry of entries) {
    assert.match(report, new RegExp(`archive/skills/generated/2026-04-18/${entry.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u"));
  }
});
