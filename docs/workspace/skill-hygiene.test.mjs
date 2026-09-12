import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { auditSkillTree } from "./skill-hygiene.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const generatedArchive = path.join(repoRoot, "archive", "skills", "generated", "2026-04-18");
const execFileAsync = promisify(execFile);
const scannerPath = path.join(repoRoot, "docs", "workspace", "skill-hygiene.mjs");

async function withFixture(callback) {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "skill-hygiene-"));
  try {
    return await callback(fixture);
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
}

async function writeSkill(root, relativePath, content) {
  const file = path.join(root, relativePath, "SKILL.md");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  return file;
}

function validSkill(name, description = "A fixture skill.") {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;
}

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

test("legacy skillRoot remains a single-root inventory with sizes and multiline metadata", async () => {
  await withFixture(async (fixture) => {
    const root = path.join(fixture, "skills");
    const shared = path.join(root, "shared.md");
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(shared, "shared\n", "utf8");
    const content = [
      "---",
      "name: multiline",
      "description: >",
      "  first line",
      "  second line",
      "---",
      "[shared](../shared.md)",
      "[missing](missing.md)",
      "```md",
      "[fenced](fenced.md)",
      "```",
      "Inline `[example](example.md)` is documentation.",
      "[url](https://example.com/url.md) [anchor](#section) [template]({{base}}/template.md)",
      "````md",
      "[four-fence](four-fence.py)",
      "```md",
      "[nested-three](nested-three.py)",
      "```",
      "````",
      "",
    ].join("\n");
    const skill = await writeSkill(root, "multiline", content);
    const result = await auditSkillTree(fixture, { skillRoot: "skills" });
    assert.equal(result.root, "skills");
    assert.equal(result.skill_count, 1);
    assert.equal(result.active_skill_count, 1);
    assert.equal(result.skills[0].bytes, Buffer.byteLength(content, "utf8"));
    assert.equal(result.skills[0].lines, content.split(/\r\n|\r|\n/u).length - 1);
    assert.equal(result.skills[0].resolved_path, await fs.realpath(skill));
    assert.equal("installed_count" in result, false);
    assert.equal("active_count" in result, false);
    assert.deepEqual(
      result.issues.filter((issue) => issue.type === "missing_reference").map((issue) => issue.reference),
      ["missing.md"],
    );
    assert.equal(result.issues.some((issue) => issue.reference.includes("fenced")), false);
    assert.equal(result.issues.some((issue) => issue.reference.includes("example")), false);
    assert.equal(result.issues.some((issue) => issue.reference.includes("four-fence")), false);
    assert.equal(result.issues.some((issue) => issue.reference.includes("nested-three")), false);
  });
});

test("checks concrete scripts, assets, and absolute linked files", async () => {
  await withFixture(async (fixture) => {
    const root = path.join(fixture, "skills");
    const skillDir = path.join(root, "files");
    const absoluteFile = path.join(fixture, "outside.json");
    const absoluteMissing = path.join(fixture, "missing-outside.json");
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, "script.py"), "print('ok')\n", "utf8");
    await fs.writeFile(path.join(skillDir, "asset.png"), "fixture\n", "utf8");
    await fs.writeFile(absoluteFile, "{}\n", "utf8");
    const content = `${validSkill("file-links")}\n[script](script.py) [asset](asset.png) [outside](${absoluteFile}) [missing](${absoluteMissing}) [route](/docs/latest)\n`;
    await writeSkill(root, "files", content);
    const result = await auditSkillTree(fixture, { skillRoot: "skills" });
    assert.deepEqual(
      result.issues.filter((issue) => issue.type === "missing_reference").map((issue) => issue.reference),
      [absoluteMissing],
    );
  });
});

test("multiple roots report source roots and active duplicates", async () => {
  await withFixture(async (fixture) => {
    const first = path.join(fixture, "first");
    const second = path.join(fixture, "second");
    await writeSkill(first, "one", validSkill("same"));
    await writeSkill(second, "two", validSkill("same"));
    const result = await auditSkillTree(fixture, { skillRoots: ["first", "second"] });
    assert.deepEqual(result.roots, ["first", "second"]);
    assert.equal(result.skill_count, 2);
    assert.equal(result.active_skill_count, 2);
    assert.deepEqual(result.skills.map((skill) => skill.source_root), ["first", "second"]);
    assert.deepEqual(result.issues.filter((issue) => issue.type === "duplicate_name"), [
      { type: "duplicate_name", name: "same", paths: ["first/one/SKILL.md", "second/two/SKILL.md"] },
    ]);
  });
});

test("overlapping and cyclic symlink roots deduplicate by real file identity", async () => {
  await withFixture(async (fixture) => {
    const root = path.join(fixture, "root");
    await writeSkill(root, "nested", validSkill("cycle-safe"));
    await fs.symlink(root, path.join(root, "loop"), "dir");
    await fs.symlink(root, path.join(fixture, "alias"), "dir");
    const result = await auditSkillTree(fixture, { skillRoots: ["root", "alias"] });
    assert.equal(result.skill_count, 1);
    assert.equal(result.skills[0].resolved_path, await fs.realpath(path.join(root, "nested", "SKILL.md")));
    assert.equal(result.issues.some((issue) => issue.type === "duplicate_name"), false);
  });
});

test("disabled paths stay in inventory and do not create active duplicate or reference issues", async () => {
  await withFixture(async (fixture) => {
    const first = path.join(fixture, "first");
    const second = path.join(fixture, "second");
    await writeSkill(first, "one", validSkill("same"));
    const disabled = await writeSkill(second, "two", `${validSkill("same")}\n[missing](missing.md)\n`);
    const result = await auditSkillTree(fixture, {
      skillRoots: ["first", "second"],
      disabledSkillPaths: [path.relative(fixture, disabled)],
    });
    assert.equal(result.skill_count, 2);
    assert.equal(result.active_skill_count, 1);
    assert.equal(result.skills.find((skill) => skill.path === "second/two/SKILL.md").enabled, false);
    assert.equal(result.issues.some((issue) => issue.type === "duplicate_name"), false);
    assert.equal(result.issues.some((issue) => issue.type === "missing_reference"), false);
  });
});

test("explicit missing roots are reported and repeated CLI flags are honored", async () => {
  await withFixture(async (fixture) => {
    const first = path.join(fixture, "first");
    const second = path.join(fixture, "second");
    await writeSkill(first, "one", validSkill("same"));
    const disabled = await writeSkill(second, "two", validSkill("same"));
    const success = await execFileAsync(process.execPath, [
      scannerPath,
      "--json",
      "--skill-root",
      "first",
      "--skill-root",
      "second",
      "--disabled-skill",
      path.relative(fixture, disabled),
    ], { cwd: fixture });
    const result = JSON.parse(success.stdout);
    assert.equal(result.skill_count, 2);
    assert.equal(result.active_skill_count, 1);
    await assert.rejects(
      execFileAsync(process.execPath, [scannerPath, "--json", "--skill-root", "missing"], { cwd: fixture }),
      (error) => {
        assert.equal(error.code, 1);
        const failed = JSON.parse(error.stdout);
        assert.equal(failed.issues[0].type, "skill_root_error");
        assert.equal(failed.issues[0].code, "ENOENT");
        return true;
      },
    );
  });
});

test("default root tolerates only an absent root and reports broken nested links", async () => {
  await withFixture(async (fixture) => {
    const root = path.join(fixture, ".agents", "skills");
    await writeSkill(root, "present", validSkill("present"));
    await fs.symlink(path.join(fixture, "does-not-exist"), path.join(root, "broken"), "dir");
    const result = await auditSkillTree(fixture);
    const errors = result.issues.filter((issue) => issue.type === "skill_root_error");
    assert.equal(errors.length, 1);
    assert.equal(errors[0].path, ".agents/skills/broken");
  });
});

test("--help prints usage without scanning", async () => {
  const result = await execFileAsync(process.execPath, [scannerPath, "--help"], { cwd: repoRoot });
  assert.match(result.stdout, /^Usage: node docs\/workspace\/skill-hygiene\.mjs \[options\]/u);
  assert.match(result.stdout, /--skill-root PATH/u);
  assert.doesNotMatch(result.stdout, /skill_count=/u);
});
