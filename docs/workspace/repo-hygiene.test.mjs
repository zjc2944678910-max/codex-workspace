import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";

import { buildCheckpointCommitMessage, buildRepoHygieneSummary, classifyStatusEntries, expandStatusPath, findNonexistentProjectRefs, findProjectRouteMetadataMismatches, findUnregisteredSurfaces, isTrackablePath, listProjectSurfaces, loadProjectRegistry, parseArgs, renderSummary, summarizeCheckpointScope } from "./repo-hygiene.mjs";

function runGit(repoRoot, args) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
}

async function createFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workspace-hygiene-"));
  runGit(root, ["init"]);
  runGit(root, ["config", "user.name", "Codex"]);
  runGit(root, ["config", "user.email", "codex@example.com"]);

  await fs.mkdir(path.join(root, ".codex", "agents"), { recursive: true });
  await fs.mkdir(path.join(root, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(root, "ops", "projects", "sample-product", "manifests"), { recursive: true });
  await fs.writeFile(path.join(root, "AGENTS.md"), "agents\n", "utf8");
  await fs.writeFile(path.join(root, "WORKER.md"), "worker contract\n", "utf8");
  await fs.writeFile(path.join(root, "CLAUDE.md"), "legacy adapter shim\n", "utf8");
  await fs.writeFile(path.join(root, ".codex", "config.toml"), "model = \"gpt-5.4\"\n", "utf8");
  await fs.writeFile(path.join(root, "README.md"), "workspace\n", "utf8");
  await fs.writeFile(path.join(root, "WORKSPACE_MAP.md"), "map\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "PROJECT_TEMPLATE.md"), "template\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "sample-product", "README.md"), "sample\n", "utf8");
  await fs.writeFile(path.join(root, "ops", "projects", "sample-product", "DEPLOYMENT_LEDGER.md"), "ledger\n", "utf8");
  await fs.writeFile(path.join(root, ".gitignore"), "/state/\n/projects/\n", "utf8");
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "fixture"]);
  return root;
}

test("root hygiene trackable-path gate matches workspace policy", () => {
  assert.equal(isTrackablePath("AGENTS.md"), true);
  assert.equal(isTrackablePath("WORKER.md"), true);
  assert.equal(isTrackablePath("CLAUDE.md"), true);
  assert.equal(isTrackablePath(".codex/agents/repo-mapper.toml"), true);
  assert.equal(isTrackablePath(".codex/hooks.json"), true);
  assert.equal(isTrackablePath(".codex/hooks/workspace_guard.py"), true);
  assert.equal(isTrackablePath("docs/workspace/repo-hygiene.mjs"), true);
  assert.equal(isTrackablePath("ops/projects/PROJECT_TEMPLATE.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/README.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/DEPLOYMENT_LEDGER.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/ARCHITECTURE_TODO.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/manifests/test.json"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/reports/audit.md"), true);
  assert.equal(isTrackablePath("ops/projects/sample-product/runbooks/restart.md"), true);
  assert.equal(isTrackablePath("projects/README.md"), false);
  assert.equal(isTrackablePath("projects/products/sample-product/file.txt"), false);
  assert.equal(isTrackablePath("scratch/README.md"), false);
  assert.equal(isTrackablePath("ops/projects/sample-product/rollback/README.md"), false);
  assert.equal(isTrackablePath("ops/projects/sample-product/evidence/run.json"), false);
  assert.equal(isTrackablePath("state/tmp.json"), false);
});

test("root hygiene summarizes checkpoint scope from allowed workspace paths", () => {
  assert.equal(summarizeCheckpointScope({
    modifiedTracked: [".gitignore", "AGENTS.md"],
    untrackedSource: ["docs/workspace/repo-hygiene.mjs"],
    otherTracked: [],
  }), "workspace, hygiene");
  assert.match(buildCheckpointCommitMessage({
    turnId: "root-scope",
  }, {
    modifiedTracked: [".gitignore", "AGENTS.md"],
    untrackedSource: ["docs/workspace/repo-hygiene.mjs"],
    otherTracked: [],
  }), /root-scope; workspace, hygiene/u);
});

test("root hygiene can checkpoint allowed tracked changes into a clean commit", async () => {
  const repoRoot = await createFixture();
  await fs.writeFile(path.join(repoRoot, "docs", "workspace", "daily-workflow.md"), "workflow\n", "utf8");
  await fs.writeFile(path.join(repoRoot, "AGENTS.md"), "agents updated\n", "utf8");

  const summary = await buildRepoHygieneSummary({
    repo: repoRoot,
    checkpointCommit: true,
    turnId: "root-turn",
  });

  assert.equal(summary.git_clean, true);
  assert.equal(summary.checkpoint_commit?.ok, true);
  assert.match(summary.checkpoint_commit?.message || "", /root-turn/u);
  assert.match(summary.checkpoint_commit?.message || "", /workspace/u);
});

test("root hygiene blocks checkpoint when non-trackable paths are present", async () => {
  const repoRoot = await createFixture();
  await fs.mkdir(path.join(repoRoot, "tmp"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "tmp", "notes.txt"), "temp\n", "utf8");

  const summary = await buildRepoHygieneSummary({
    repo: repoRoot,
    checkpointCommit: true,
    turnId: "root-turn-blocked",
  });

  assert.equal(summary.git_clean, false);
  assert.equal(summary.checkpoint_commit?.ok, false);
  assert.equal(summary.checkpoint_commit?.skipped, "non_trackable_paths_present");
  assert.deepEqual(summary.checkpoint_commit?.blocked_paths, ["tmp/notes.txt"]);
});

test("root hygiene expands rename paths before trackability checks", () => {
  assert.deepEqual(expandStatusPath("docs/reports/a.md -> projects/products/sample-product/a.md"), [
    "docs/reports/a.md",
    "projects/products/sample-product/a.md",
  ]);

  const summary = classifyStatusEntries([
    {
      raw: "R  docs/reports/a.md -> projects/products/sample-product/a.md",
      code: "R ",
      path: "docs/reports/a.md -> projects/products/sample-product/a.md",
    },
  ]);

  assert.deepEqual(summary.modifiedTracked, [
    "docs/reports/a.md",
    "projects/products/sample-product/a.md",
  ]);
  assert.equal(summary.modifiedTracked.every(isTrackablePath), false);
});

test("repo hygiene loads project registry from fixture", async () => {
  const repoRoot = await createFixture();
  const registry = {
    projects: [
      { slug: "sample-product", code_roots: ["projects/products/sample-product"] },
    ],
  };
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "project-registry.json"),
    JSON.stringify(registry),
    "utf8",
  );
  const loaded = await loadProjectRegistry(repoRoot);
  assert.equal(loaded.projects[0].slug, "sample-product");
});

test("repo hygiene detects unregistered project surfaces", async () => {
  const repoRoot = await createFixture();
  // Create two project surfaces: one registered, one not
  await fs.mkdir(path.join(repoRoot, "projects", "products", "sample-product"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "projects", "products", "rogue-app"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "projects", "products", "sample-product", "src.txt"), "code\n", "utf8");
  await fs.writeFile(path.join(repoRoot, "projects", "products", "rogue-app", "src.txt"), "code\n", "utf8");

  const registry = {
    projects: [
      { slug: "sample-product", code_roots: ["projects/products/sample-product"] },
    ],
  };

  const surfaces = await listProjectSurfaces(repoRoot);
  assert.ok(surfaces.includes("projects/products/sample-product"));
  assert.ok(surfaces.includes("projects/products/rogue-app"));

  const unregistered = findUnregisteredSurfaces(surfaces, registry);
  assert.deepEqual(unregistered, ["projects/products/rogue-app"]);
});

test("repo hygiene prefers registered surfaces over nested code roots", async () => {
  const repoRoot = await createFixture();
  await fs.mkdir(path.join(repoRoot, "projects", "products", "sample-product"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "projects", "products", "sample-product", "src.txt"), "code\n", "utf8");

  const surfaces = await listProjectSurfaces(repoRoot);
  const registry = {
    projects: [
      {
        slug: "sample-product",
        surfaces: ["projects/products/sample-product"],
        code_roots: [
          {
            path: "projects/products/sample-product/app",
            role: "repo",
            gitnexus_status: "indexed",
          },
        ],
      },
    ],
  };

  const unregistered = findUnregisteredSurfaces(surfaces, registry);
  assert.deepEqual(unregistered, []);
});

test("repo hygiene detects nonexistent project references in docs", async () => {
  const repoRoot = await createFixture();
  // Write a doc that references a nonexistent project path
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "notes.md"),
    "See projects/products/ghost-app/src for details.\n",
    "utf8",
  );
  // Create a real project so it is not flagged
  await fs.mkdir(path.join(repoRoot, "projects", "products", "sample-product"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "README.md"),
    "workspace has projects/products/sample-product\n",
    "utf8",
  );

  const missing = await findNonexistentProjectRefs(repoRoot);
  assert.ok(missing.includes("projects/products/ghost-app/src"));
  assert.ok(!missing.includes("projects/products/sample-product"));
});

test("repo hygiene scan boundary is narrowed to entrypoint markdown only", async () => {
  const repoRoot = await createFixture();
  // Create a deep markdown file under ops/projects with a bad ref — should NOT be scanned
  await fs.mkdir(path.join(repoRoot, "ops", "projects", "sample-product", "manifests"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "ops", "projects", "sample-product", "manifests", "notes.md"),
    "See projects/products/deep-ghost for details.\n",
    "utf8",
  );
  // Write a docs/workspace/*.md file with a bad ref — SHOULD be scanned
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "workspace-notes.md"),
    "See projects/products/shallow-ghost for details.\n",
    "utf8",
  );

  const missing = await findNonexistentProjectRefs(repoRoot);
  // Deep ops file should not be scanned
  assert.ok(!missing.includes("projects/products/deep-ghost"));
  // docs/workspace/*.md should be scanned
  assert.ok(missing.includes("projects/products/shallow-ghost"));
});

test("repo hygiene scans ops/projects/*/README.md entrypoints", async () => {
  const repoRoot = await createFixture();
  // Write a bad ref in an ops project README — should be detected
  await fs.writeFile(
    path.join(repoRoot, "ops", "projects", "sample-product", "README.md"),
    "This project depends on projects/products/phantom-lib.\n",
    "utf8",
  );

  const missing = await findNonexistentProjectRefs(repoRoot);
  assert.ok(missing.includes("projects/products/phantom-lib"));
});

test("repo hygiene does not flag ops/projects substring as nonexistent projects ref", async () => {
  const repoRoot = await createFixture();
  // Create a real project so projects/products/sample-product exists on disk
  await fs.mkdir(path.join(repoRoot, "projects", "products", "sample-product"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "README.md"),
    "Registered project records live in:\n\n- `ops/projects/<project>/README.md`\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(repoRoot, "WORKSPACE_MAP.md"),
    "Old `projects/openclaw/migration/openclaw-mac-migration`\n- New `projects/migrations/openclaw-mac-migration`\n",
    "utf8",
  );

  const missing = await findNonexistentProjectRefs(repoRoot);
  // ops/projects should not be parsed as projects/... refs
  for (const ref of missing) {
    assert.ok(
      !ref.startsWith("projects/projects"),
      `false positive: ${ref} was incorrectly extracted from ops/projects substring`,
    );
  }
});

test("repo hygiene accepts mirrored project route metadata", async () => {
  const repoRoot = await createFixture();
  await fs.writeFile(
    path.join(repoRoot, "ops", "projects", "sample-product", "README.md"),
    [
      "# Sample Product Ops Surface",
      "",
      "## Routing Evidence",
      "",
      "- Project name: `Sample Product`",
      "- Aliases: `sample`, `sample-live`",
      "- Registry routing keywords: `sample-product`, `sample`, `sample-live`",
      "- Main code: `projects/products/sample-product`",
      "- Ops surface: `ops/projects/sample-product`",
      "- Live host aliases: `sample-live`",
      "- Service names: `sample-api`",
      "- Registry risk profile: `live_product`",
      "",
    ].join("\n"),
    "utf8",
  );
  const registry = {
    projects: [
      {
        slug: "sample-product",
        name: "Sample Product",
        aliases: ["sample", "sample-live"],
        routing_keywords: ["sample-product", "sample", "sample-live"],
        code_roots: [{ path: "projects/products/sample-product" }],
        ops_surface: "ops/projects/sample-product",
        live_host_aliases: ["sample-live"],
        service_names: ["sample-api"],
        risk_profile: "live_product",
      },
    ],
  };

  const mismatches = await findProjectRouteMetadataMismatches(repoRoot, registry);
  assert.deepEqual(mismatches, []);
});

test("repo hygiene detects project route metadata drift", async () => {
  const repoRoot = await createFixture();
  await fs.writeFile(
    path.join(repoRoot, "ops", "projects", "sample-product", "README.md"),
    [
      "# Sample Product Ops Surface",
      "",
      "## Routing Evidence",
      "",
      "- Project name: `Sample Product`",
      "- Main code: `projects/products/sample-product`",
      "- Ops surface: `ops/projects/sample-product`",
      "",
    ].join("\n"),
    "utf8",
  );
  const registry = {
    projects: [
      {
        slug: "sample-product",
        name: "Sample Product",
        aliases: ["sample-alias"],
        code_roots: [{ path: "projects/products/sample-product" }],
        ops_surface: "ops/projects/sample-product",
        live_host_aliases: ["sample-live"],
        service_names: ["sample-api"],
        risk_profile: "live_product",
      },
    ],
  };

  const mismatches = await findProjectRouteMetadataMismatches(repoRoot, registry);
  assert.deepEqual(mismatches.map((entry) => entry.field).sort(), [
    "aliases",
    "live_host_aliases",
    "risk_profile",
    "service_names",
  ]);
});

test("repo hygiene can explain project route metadata drift", () => {
  const summary = {
    repo_root: "/workspace",
    git_clean: true,
    checkpoint_commit: null,
    after: {
      modified_tracked: [],
      untracked_source: [],
    },
    project_route_metadata_mismatches: [
      {
        project: "Sample Product",
        field: "service_names",
        missing: ["sample-api"],
        readme: "ops/projects/sample-product/README.md",
      },
    ],
  };

  assert.equal(parseArgs(["--explain-mismatch"]).explainMismatch, true);
  const rendered = renderSummary(summary, { explainMismatch: true });
  assert.match(rendered, /project_route_metadata_mismatch_details:/u);
  assert.match(rendered, /Sample Product service_names missing/u);
  assert.match(rendered, /sample-api/u);
});

test("repo hygiene summary includes new policy fields", async () => {
  const repoRoot = await createFixture();
  await fs.mkdir(path.join(repoRoot, "projects", "products", "unregistered"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "projects", "products", "unregistered", "app.js"), "// code\n", "utf8");

  const registry = {
    projects: [
      { slug: "sample-product", code_roots: ["projects/products/sample-product"] },
    ],
  };
  await fs.writeFile(
    path.join(repoRoot, "docs", "workspace", "project-registry.json"),
    JSON.stringify(registry),
    "utf8",
  );

  const summary = await buildRepoHygieneSummary({ repo: repoRoot });
  assert.ok(Array.isArray(summary.unregistered_project_surfaces));
  assert.ok(summary.unregistered_project_surfaces.includes("projects/products/unregistered"));
  assert.ok(Array.isArray(summary.nonexistent_project_references));
  assert.ok(Array.isArray(summary.project_route_metadata_mismatches));
  // existing fields still present
  assert.ok("git_clean" in summary);
  assert.ok("before" in summary);
  assert.ok("after" in summary);
});
