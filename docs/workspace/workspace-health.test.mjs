import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  renderMocProjectSection,
  renderProjectSurfacesProjectSection,
} from "./codex-register-project.mjs";
import {
  buildCodexWorkflowSummary,
  buildNestedGitSummary,
  buildWorkspaceGovernanceSummary,
  buildWorkspaceHealth,
  findLongTaskCompletionCandidates,
  overallStatus,
  renderHealthSummary,
} from "./workspace-health.mjs";

function runGit(args = [], cwd = process.cwd()) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

test("overallStatus flags structural issues before cleanup notes", () => {
  const hygiene = {
    git_clean: true,
    unregistered_project_surfaces: [],
    nonexistent_project_references: [],
    project_route_metadata_mismatches: [],
  };
  const disk = {
    retention_gaps: [],
    retention_overdue: [],
    cleanup_buckets: {
      delete: [{ count: 3 }],
    },
  };

  assert.equal(overallStatus(hygiene, disk), "ok");
  assert.equal(overallStatus({
    ...hygiene,
    unregistered_project_surfaces: ["projects/products/rogue"],
  }, disk), "attention");
  assert.equal(overallStatus({
    ...hygiene,
    project_route_metadata_mismatches: [{ project: "Sample", field: "aliases" }],
  }, disk), "attention");
  assert.equal(overallStatus(hygiene, {
    ...disk,
    retention_overdue: [{ path: "scratch/projects/misc" }],
  }), "attention");
  assert.equal(overallStatus(hygiene, {
    ...disk,
    state_retention_gaps: [{ path: "state/project-data/unknown" }],
  }), "attention");
  assert.equal(overallStatus(hygiene, {
    ...disk,
    state_retention_manifest_loaded: false,
  }), "attention");
  assert.equal(overallStatus(hygiene, disk, { issues: ["notify_not_wrapper_only"] }), "attention");
  assert.equal(overallStatus(hygiene, disk, {}, { dirty_repos: [{ path: "projects/sample" }] }), "attention");
  assert.equal(overallStatus(hygiene, disk, {}, { review_dirty_repos: [{ path: "projects/sample" }] }), "attention");
  assert.equal(overallStatus(hygiene, disk, {}, { acknowledged_dirty_repos: [{ path: "projects/sample" }] }), "ok");
  assert.equal(overallStatus(hygiene, disk, {}, {}, {
    long_task_completion_candidates: [{ path: "scratch/shared/codex-runs/done" }],
  }), "ok");
  assert.equal(overallStatus(hygiene, disk, {}, {}, {
    missing_active_retention_paths: [{ path: "scratch/projects/missing" }],
  }), "attention");
  assert.equal(overallStatus(hygiene, disk, {}, {}, {
    project_documentation_mismatches: [{ project: "sample" }],
  }), "attention");
});

test("buildWorkspaceGovernanceSummary reports deterministic retention and documentation drift", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-governance-health-"));
  await fs.mkdir(path.join(repo, "docs", "workspace"), { recursive: true });
  await fs.mkdir(path.join(repo, "scratch", "projects", "present"), { recursive: true });
  await fs.writeFile(path.join(repo, "docs", "workspace", "scratch-retention.json"), JSON.stringify({
    entries: [
      { path: "scratch/projects/missing", project: "missing", active: true, disposition: "retain" },
      { path: "scratch/projects/present", project: "present", active: true, disposition: "retain" },
      { path: "scratch/projects/inactive", project: "inactive", active: false, disposition: "archive" },
    ],
  }), "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "state-retention.json"), "{\"entries\":[]}", "utf8");
  const registry = {
    projects: [
      {
        slug: "alpha",
        name: "Alpha",
        ops_surface: "ops/projects/alpha",
        code_roots: [{ path: "projects/products/alpha", gitnexus_status: "indexed" }],
        gitnexus_indexed: true,
      },
      {
        slug: "beta",
        name: "Beta",
        ops_surface: "ops/projects/beta",
        code_roots: [{ path: "projects/products/beta", gitnexus_status: "not_indexed" }],
        gitnexus_indexed: false,
      },
    ],
  };
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-registry.json"), JSON.stringify(registry), "utf8");
  await fs.writeFile(path.join(repo, "MOC.md"), [
    "<!-- BEGIN GENERATED PROJECT LINKS -->",
    renderMocProjectSection({ projects: [registry.projects[0]] }),
    "<!-- END GENERATED PROJECT LINKS -->",
  ].join("\n"), "utf8");
  const surfaceSection = renderProjectSurfacesProjectSection(registry, {})
    .replace("`main`: `indexed` (local metadata missing)", "`main`: `not_indexed`");
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-surfaces.md"), [
    "<!-- BEGIN GENERATED PROJECT SURFACES -->",
    surfaceSection,
    "<!-- END GENERATED PROJECT SURFACES -->",
  ].join("\n"), "utf8");

  const summary = await buildWorkspaceGovernanceSummary({ repo });
  assert.deepEqual(summary.missing_active_retention_paths.map((entry) => entry.path), [
    "scratch/projects/missing",
  ]);
  assert.deepEqual(summary.project_documentation_mismatches.map((entry) => [entry.project, entry.field]), [
    ["alpha", "generated_project_line"],
    ["beta", "generated_project_line"],
  ]);
  assert.deepEqual(summary.long_task_completion_candidates, []);
});

test("project documentation checks stay inside unique generated marker sections", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-governance-doc-boundary-"));
  await fs.mkdir(path.join(repo, "docs", "workspace"), { recursive: true });
  const registry = {
    projects: [{
      slug: "alpha",
      name: "Alpha",
      ops_surface: "ops/projects/alpha",
      code_roots: [],
      gitnexus_indexed: false,
    }],
  };
  const mocLine = renderMocProjectSection(registry);
  const surfaceSection = renderProjectSurfacesProjectSection(registry, {});
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-registry.json"), JSON.stringify(registry), "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "scratch-retention.json"), "{\"entries\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "state-retention.json"), "{\"entries\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "MOC.md"), [
    mocLine,
    "<!-- BEGIN GENERATED PROJECT LINKS -->",
    "<!-- END GENERATED PROJECT LINKS -->",
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-surfaces.md"), [
    "<!-- BEGIN GENERATED PROJECT SURFACES -->",
    surfaceSection,
    surfaceSection.split("\n").at(-1),
    "<!-- END GENERATED PROJECT SURFACES -->",
  ].join("\n"), "utf8");

  const summary = await buildWorkspaceGovernanceSummary({ repo });
  assert.ok(summary.project_documentation_mismatches.some((entry) => (
    entry.project === "alpha" && entry.document === "MOC.md" && entry.actual === "missing"
  )));
  assert.ok(summary.project_documentation_mismatches.some((entry) => (
    entry.project === "alpha"
      && entry.document === "docs/workspace/project-surfaces.md"
      && entry.actual === "duplicate (2)"
  )));

  await fs.writeFile(path.join(repo, "MOC.md"), [
    "<!-- BEGIN GENERATED PROJECT LINKS -->",
    mocLine,
    "<!-- END GENERATED PROJECT LINKS -->",
    "<!-- BEGIN GENERATED PROJECT LINKS -->",
    mocLine,
    "<!-- END GENERATED PROJECT LINKS -->",
  ].join("\n"), "utf8");
  const duplicateMarkers = await buildWorkspaceGovernanceSummary({ repo });
  assert.ok(duplicateMarkers.project_documentation_mismatches.some((entry) => (
    entry.document === "MOC.md" && entry.field === "generated_section_markers"
  )));
});

test("buildWorkspaceGovernanceSummary finds explicit active-run completion candidates", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-governance-runs-"));
  const runRoot = path.join(repo, "scratch", "projects", "sample", "codex-runs");
  const acceptedRun = path.join(runRoot, "20260820-0001-accepted");
  const activeRun = path.join(runRoot, "20260820-0002-active");
  await fs.mkdir(path.join(repo, "docs", "workspace"), { recursive: true });
  await fs.mkdir(acceptedRun, { recursive: true });
  await fs.mkdir(activeRun, { recursive: true });
  await fs.writeFile(path.join(repo, "docs", "workspace", "scratch-retention.json"), "{\"entries\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "state-retention.json"), "{\"entries\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-registry.json"), "{\"projects\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "MOC.md"), [
    "<!-- BEGIN GENERATED PROJECT LINKS -->",
    "<!-- END GENERATED PROJECT LINKS -->",
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-surfaces.md"), [
    "<!-- BEGIN GENERATED PROJECT SURFACES -->",
    "<!-- END GENERATED PROJECT SURFACES -->",
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(acceptedRun, "08-continuation.json"), JSON.stringify({
    run_status: "active",
    phase: "ci-repair-accepted",
    next_action: "No further action; replacement run is green.",
  }), "utf8");
  await fs.writeFile(path.join(activeRun, "08-continuation.json"), JSON.stringify({
    run_status: "active",
    phase: "implementing",
    next_action: "Run focused tests.",
  }), "utf8");

  const summary = await buildWorkspaceGovernanceSummary({ repo });
  assert.deepEqual(summary.long_task_completion_candidates.map((entry) => entry.path), [
    "scratch/projects/sample/codex-runs/20260820-0001-accepted",
  ]);
});

test("long-task completion discovery never reads a codex-runs symlink outside the workspace", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-governance-symlink-"));
  const external = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-external-runs-"));
  const externalRun = path.join(external, "20260820-escaped");
  await fs.mkdir(path.join(repo, "scratch", "shared"), { recursive: true });
  await fs.mkdir(externalRun, { recursive: true });
  await fs.writeFile(path.join(externalRun, "08-continuation.json"), JSON.stringify({
    run_status: "active",
    phase: "implementation_completed",
    next_action: "No further action.",
  }), "utf8");
  await fs.symlink(external, path.join(repo, "scratch", "shared", "codex-runs"));

  assert.deepEqual(await findLongTaskCompletionCandidates(repo), []);
});

test("buildNestedGitSummary reports dirty project repositories", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-nested-git-"));
  const cleanRepo = path.join(repo, "projects", "clean-app");
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  const plainDir = path.join(repo, "projects", "plain-dir");

  await fs.mkdir(cleanRepo, { recursive: true });
  await fs.mkdir(dirtyRepo, { recursive: true });
  await fs.mkdir(plainDir, { recursive: true });
  runGit(["init", "-q"], cleanRepo);
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "note.txt"), "local scratch\n", "utf8");

  const summary = await buildNestedGitSummary({ repo });
  assert.equal(summary.repo_count, 2);
  assert.deepEqual(summary.clean_repos, ["projects/clean-app"]);
  assert.equal(summary.dirty_repos.length, 1);
  assert.equal(summary.dirty_repos[0].path, "projects/dirty-app");
  assert.equal(summary.dirty_repos[0].dirty_count, 1);
  assert.equal(summary.dirty_repos[0].untracked_count, 1);
  assert.deepEqual(summary.errors, []);
});

test("buildNestedGitSummary stops at project repositories and ignores nested dependency repos", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-nested-dependency-git-"));
  const projectRepo = path.join(repo, "projects", "app");
  const dependencyRepo = path.join(projectRepo, ".build", "checkouts", "dependency");
  await fs.mkdir(dependencyRepo, { recursive: true });
  runGit(["init", "-q"], projectRepo);
  runGit(["init", "-q"], dependencyRepo);

  const summary = await buildNestedGitSummary({ repo });
  assert.equal(summary.repo_count, 1);
  const reportedPaths = [
    ...summary.clean_repos,
    ...summary.dirty_repos.map((entry) => entry.path),
    ...summary.acknowledged_dirty_repos.map((entry) => entry.path),
    ...summary.review_dirty_repos.map((entry) => entry.path),
  ];
  assert.deepEqual(reportedPaths, ["projects/app"]);
});

test("buildNestedGitSummary separates acknowledged and strict dirty repositories", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-acknowledged-git-"));
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  const acknowledgementPath = path.join(repo, "acknowledgements.json");

  await fs.mkdir(dirtyRepo, { recursive: true });
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "note.txt"), "submitted local work\n", "utf8");
  await fs.writeFile(
    acknowledgementPath,
    JSON.stringify({
      nested_git: [
        {
          path: "projects/dirty-app",
          status: "acknowledged",
          reason: "known submitted work",
          expected: {
            dirty_count: 1,
            tracked_count: 0,
            untracked_count: 1,
          },
        },
      ],
    }),
    "utf8",
  );

  const acknowledged = await buildNestedGitSummary({ repo, acknowledgementPath });
  assert.equal(acknowledged.dirty_repos.length, 0);
  assert.equal(acknowledged.review_dirty_repos.length, 0);
  assert.equal(acknowledged.acknowledged_dirty_repos.length, 1);
  assert.equal(acknowledged.acknowledged_dirty_repos[0].acknowledgement_reason, "known submitted work");

  const strict = await buildNestedGitSummary({
    repo,
    acknowledgementPath,
    strictAcknowledgements: true,
  });
  assert.equal(strict.dirty_repos.length, 1);
  assert.equal(strict.acknowledged_dirty_repos.length, 0);
});

test("buildNestedGitSummary sends changed acknowledged dirty state to review", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-review-git-"));
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  const acknowledgementPath = path.join(repo, "acknowledgements.json");

  await fs.mkdir(dirtyRepo, { recursive: true });
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "first.txt"), "one\n", "utf8");
  await fs.writeFile(path.join(dirtyRepo, "second.txt"), "two\n", "utf8");
  await fs.writeFile(
    acknowledgementPath,
    JSON.stringify({
      nested_git: [
        {
          path: "projects/dirty-app",
          status: "acknowledged",
          reason: "previously one file",
          expected: {
            dirty_count: 1,
            tracked_count: 0,
            untracked_count: 1,
          },
        },
      ],
    }),
    "utf8",
  );

  const summary = await buildNestedGitSummary({ repo, acknowledgementPath });
  assert.equal(summary.dirty_repos.length, 0);
  assert.equal(summary.acknowledged_dirty_repos.length, 0);
  assert.equal(summary.review_dirty_repos.length, 1);
  assert.equal(summary.review_dirty_repos[0].acknowledgement_status, "expectation_mismatch");
});

test("buildNestedGitSummary sends overdue acknowledgements to review", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-overdue-ack-git-"));
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  const acknowledgementPath = path.join(repo, "acknowledgements.json");

  await fs.mkdir(dirtyRepo, { recursive: true });
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "note.txt"), "known local work\n", "utf8");
  await fs.writeFile(
    acknowledgementPath,
    JSON.stringify({
      nested_git: [{
        path: "projects/dirty-app",
        status: "acknowledged",
        reason: "review periodically",
        review_after: "2026-08-01",
        expected: { dirty_count: 1, tracked_count: 0, untracked_count: 1 },
      }],
    }),
    "utf8",
  );

  const summary = await buildNestedGitSummary({
    repo,
    acknowledgementPath,
    now: "2026-08-20",
  });
  assert.equal(summary.acknowledged_dirty_repos.length, 0);
  assert.equal(summary.review_dirty_repos.length, 1);
  assert.equal(summary.review_dirty_repos[0].acknowledgement_status, "review_overdue");
});

test("buildNestedGitSummary fails closed for invalid review dates and keeps the boundary date current", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-invalid-ack-git-"));
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  const acknowledgementPath = path.join(repo, "acknowledgements.json");
  await fs.mkdir(dirtyRepo, { recursive: true });
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "note.txt"), "known local work\n", "utf8");

  const writeAcknowledgement = (reviewAfter) => fs.writeFile(
    acknowledgementPath,
    JSON.stringify({ nested_git: [{
      path: "projects/dirty-app",
      status: "acknowledged",
      review_after: reviewAfter,
      expected: { dirty_count: 1, tracked_count: 0, untracked_count: 1 },
    }] }),
    "utf8",
  );

  await writeAcknowledgement("2026-99-99");
  const invalidDate = await buildNestedGitSummary({ repo, acknowledgementPath, now: "2026-08-20" });
  assert.equal(invalidDate.review_dirty_repos[0].acknowledgement_status, "review_date_invalid");

  await writeAcknowledgement("2026-08-20");
  const boundary = await buildNestedGitSummary({ repo, acknowledgementPath, now: "2026-08-20" });
  assert.equal(boundary.acknowledged_dirty_repos.length, 1);

  const invalidNow = await buildNestedGitSummary({ repo, acknowledgementPath, now: "not-a-date" });
  assert.equal(invalidNow.review_dirty_repos[0].acknowledgement_status, "review_date_invalid");
});

test("buildWorkspaceHealth forwards the deterministic date to nested acknowledgement review", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-health-date-forward-"));
  const dirtyRepo = path.join(repo, "projects", "dirty-app");
  await fs.mkdir(path.join(repo, ".codex"), { recursive: true });
  await fs.mkdir(path.join(repo, "docs", "workspace"), { recursive: true });
  await fs.mkdir(dirtyRepo, { recursive: true });
  await fs.writeFile(path.join(repo, "AGENTS.md"), "workspace policy\n", "utf8");
  await fs.writeFile(path.join(repo, ".codex", "config.toml"), "model = \"gpt-5.6-sol\"\n", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "project-registry.json"), "{\"projects\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "scratch-retention.json"), "{\"entries\":[]}", "utf8");
  await fs.writeFile(path.join(repo, "docs", "workspace", "state-retention.json"), "{\"entries\":[]}", "utf8");
  runGit(["init", "-q"], repo);
  runGit(["init", "-q"], dirtyRepo);
  await fs.writeFile(path.join(dirtyRepo, "note.txt"), "known local work\n", "utf8");
  const acknowledgementPath = path.join(repo, "docs", "workspace", "workspace-health-acknowledgements.json");
  await fs.writeFile(acknowledgementPath, JSON.stringify({ nested_git: [{
    path: "projects/dirty-app",
    status: "acknowledged",
    review_after: "2026-08-19",
    expected: { dirty_count: 1, tracked_count: 0, untracked_count: 1 },
  }] }), "utf8");

  const result = await buildWorkspaceHealth({ repo, acknowledgementPath, now: "2026-08-20" });
  assert.equal(result.nested_git.review_dirty_repos[0].acknowledgement_status, "review_overdue");
});

test("renderHealthSummary gives a compact structure report", () => {
  const summary = renderHealthSummary({
    hygiene: {
      repo_root: "/workspace",
      git_clean: true,
      unregistered_project_surfaces: [],
      nonexistent_project_references: [],
      project_route_metadata_mismatches: [],
    },
    disk: {
      largest_paths: [
        { pretty: "1.0G", path: "projects", bucket: "keep" },
        { pretty: "700M", path: "scratch/projects/prototype", bucket: "ask" },
      ],
      retention_gaps: [],
      retention_overdue: [],
      state_retention_gaps: [],
      state_retention_overdue: [],
      cleanup_buckets: {
        delete: [{ pretty: "17M", count: 113, path: "(obvious garbage files)" }],
      },
      retention_manifest_loaded: true,
      state_retention_manifest_loaded: true,
    },
    codex_workflow: {
      notify_wrapper_only: true,
      bark_enabled: true,
      telegram_enabled: false,
      workspace_health_notify_enabled: true,
      workspace_health_daily: "PAUSED",
      mobile_bridge_heartbeat: "PAUSED",
      issues: [],
    },
    nested_git: {
      repo_count: 2,
      dirty_repos: [
        { path: "projects/products/pet-clinic", dirty_count: 18, tracked_count: 14, untracked_count: 4 },
      ],
      errors: [],
    },
  });

  assert.match(summary, /status: attention/u);
  assert.match(summary, /git_clean: yes/u);
  assert.match(summary, /project_route_metadata_mismatches: 0/u);
  assert.match(summary, /missing_active_retention_paths: 0/u);
  assert.match(summary, /long_task_completion_candidates: 0/u);
  assert.match(summary, /project_documentation_mismatches: 0/u);
  assert.match(summary, /retention_gaps: 0/u);
  assert.match(summary, /retention_overdue: 0/u);
  assert.match(summary, /state_retention_manifest_loaded: yes/u);
  assert.match(summary, /state_retention_gaps: 0/u);
  assert.match(summary, /state_retention_overdue: 0/u);
  assert.match(summary, /codex_notify_wrapper: ok/u);
  assert.match(summary, /workspace_health_daily: PAUSED/u);
  assert.match(summary, /mobile_bridge_heartbeat: PAUSED/u);
  assert.match(summary, /nested_git_repos: 2/u);
  assert.match(summary, /nested_git_dirty: 1/u);
  assert.match(summary, /nested_git_acknowledged: 0/u);
  assert.match(summary, /nested_git_needs_review: 0/u);
  assert.match(summary, /nested_git_dirty_repos:/u);
  assert.match(summary, /projects\/products\/pet-clinic\t18 changes \(14 tracked, 4 untracked\)/u);
  assert.match(summary, /largest_paths:/u);
  assert.match(summary, /obvious_garbage: 17M, 113 files/u);
});

test("renderHealthSummary reports overdue retention paths", () => {
  const summary = renderHealthSummary({
    hygiene: {
      repo_root: "/workspace",
      git_clean: true,
      unregistered_project_surfaces: [],
      nonexistent_project_references: [],
      project_route_metadata_mismatches: [],
    },
    disk: {
      largest_paths: [],
      retention_gaps: [],
      retention_overdue: [
        { pretty: "97K", path: "scratch/projects/misc", age_days: 113, retention_days: 14 },
      ],
      state_retention_gaps: [],
      state_retention_overdue: [],
      cleanup_buckets: {
        delete: [],
      },
      retention_manifest_loaded: true,
      state_retention_manifest_loaded: true,
    },
    codex_workflow: {
      notify_wrapper_only: true,
      bark_enabled: true,
      telegram_enabled: false,
      workspace_health_notify_enabled: true,
      workspace_health_daily: "PAUSED",
      mobile_bridge_heartbeat: "PAUSED",
      issues: [],
    },
  });

  assert.match(summary, /status: attention/u);
  assert.match(summary, /retention_overdue: 1/u);
  assert.match(summary, /scratch\/projects\/misc\tage 113d > 14d/u);
});

test("renderHealthSummary reports state retention gaps", () => {
  const summary = renderHealthSummary({
    hygiene: {
      repo_root: "/workspace",
      git_clean: true,
      unregistered_project_surfaces: [],
      nonexistent_project_references: [],
      project_route_metadata_mismatches: [],
    },
    disk: {
      largest_paths: [],
      retention_gaps: [],
      retention_overdue: [],
      state_retention_gaps: [
        { pretty: "300M", path: "state/project-data/unregistered" },
      ],
      state_retention_overdue: [],
      cleanup_buckets: {
        delete: [],
      },
      retention_manifest_loaded: true,
      state_retention_manifest_loaded: true,
    },
    codex_workflow: {
      notify_wrapper_only: true,
      bark_enabled: true,
      telegram_enabled: false,
      workspace_health_notify_enabled: true,
      workspace_health_daily: "PAUSED",
      mobile_bridge_heartbeat: "PAUSED",
      issues: [],
    },
  });

  assert.match(summary, /status: attention/u);
  assert.match(summary, /state_retention_gaps: 1/u);
  assert.match(summary, /state_retention_gap_paths:/u);
  assert.match(summary, /state\/project-data\/unregistered/u);
});

test("codex workflow summary flags notify drift without exposing secrets", async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workflow-health-"));
  const codexDir = path.join(homeDir, ".codex");
  await fs.mkdir(path.join(codexDir, "automations", "workspace-health-daily"), { recursive: true });
  await fs.mkdir(path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat"), { recursive: true });
  await fs.writeFile(
    path.join(codexDir, "config.toml"),
    'notify = ["/tmp/SkyComputerUseClient", "turn-ended", "--previous-notify", "[\\"/tmp/wrapper\\",\\"turn-ended\\"]"]\n',
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "notify-config.json"),
    JSON.stringify({
      bark: { enabled: true, device_key: "secret-device-key" },
      telegram: { enabled: false, bot_token: "secret-bot-token", chat_id: "secret-chat-id" },
      workspace_health: { enabled: true },
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "workspace-health-daily", "automation.toml"),
    'kind = "cron"\nstatus = "ACTIVE"\nname = "Workspace health daily"\n',
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat", "automation.toml"),
    'kind = "heartbeat"\nstatus = "PAUSED"\nname = "Mobile Codex Bridge heartbeat"\n',
    "utf8",
  );

  const summary = await buildCodexWorkflowSummary({ homeDir });
  const serialized = JSON.stringify(summary);
  assert.equal(summary.notify_wrapper_only, false);
  assert.equal(summary.notify_previous_wrapper, false);
  assert.equal(summary.notify_routes_to_wrapper, false);
  assert.equal(summary.notify_via_desktop_client, true);
  assert.equal(summary.notify_has_previous_notify, true);
  assert.deepEqual(summary.issues, [
    "notify_not_wrapper_only",
    "notify_via_desktop_client",
    "notify_has_previous_notify",
  ]);
  assert.doesNotMatch(serialized, /secret-device-key|secret-bot-token|secret-chat-id/u);
});

test("codex workflow accepts desktop notify wrapper when previous notify routes to workspace wrapper", async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workflow-desktop-"));
  const codexDir = path.join(homeDir, ".codex");
  const wrapper = `${homeDir}/.codex/tools/codex-turn-ended-notify.sh`;
  await fs.mkdir(path.join(codexDir, "automations", "workspace-health-daily"), { recursive: true });
  await fs.mkdir(path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat"), { recursive: true });
  await fs.writeFile(
    path.join(codexDir, "config.toml"),
    `notify = ["/tmp/SkyComputerUseClient", "turn-ended", "--previous-notify", ${JSON.stringify(JSON.stringify([wrapper, "turn-ended"]))}]\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "notify-config.json"),
    JSON.stringify({
      bark: { enabled: true, device_key: "secret-device-key" },
      telegram: { enabled: false, bot_token: "secret-bot-token", chat_id: "secret-chat-id" },
      workspace_health: { enabled: true },
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "workspace-health-daily", "automation.toml"),
    'kind = "cron"\nstatus = "ACTIVE"\nname = "Workspace health daily"\n',
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat", "automation.toml"),
    'kind = "heartbeat"\nstatus = "PAUSED"\nname = "Mobile Codex Bridge heartbeat"\n',
    "utf8",
  );

  const summary = await buildCodexWorkflowSummary({ homeDir });
  const serialized = JSON.stringify(summary);
  assert.equal(summary.notify_wrapper_only, false);
  assert.equal(summary.notify_previous_wrapper, true);
  assert.equal(summary.notify_routes_to_wrapper, true);
  assert.equal(summary.notify_via_desktop_client, true);
  assert.equal(summary.notify_has_previous_notify, true);
  assert.deepEqual(summary.issues, []);
  assert.doesNotMatch(serialized, /secret-device-key|secret-bot-token|secret-chat-id/u);
});

test("codex workflow accepts intentionally paused daily health automation", async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workflow-paused-"));
  const codexDir = path.join(homeDir, ".codex");
  await fs.mkdir(path.join(codexDir, "automations", "workspace-health-daily"), { recursive: true });
  await fs.mkdir(path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat"), { recursive: true });
  await fs.writeFile(
    path.join(codexDir, "config.toml"),
    `notify = ["${homeDir}/.codex/tools/codex-turn-ended-notify.sh", "turn-ended"]\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "notify-config.json"),
    JSON.stringify({
      bark: { enabled: true, device_key: "secret-device-key" },
      telegram: { enabled: false, bot_token: "secret-bot-token", chat_id: "secret-chat-id" },
      workspace_health: { enabled: true },
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "workspace-health-daily", "automation.toml"),
    'kind = "cron"\nstatus = "PAUSED"\nname = "Workspace health daily"\n',
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat", "automation.toml"),
    'kind = "heartbeat"\nstatus = "PAUSED"\nname = "Mobile Codex Bridge heartbeat"\n',
    "utf8",
  );

  const summary = await buildCodexWorkflowSummary({ homeDir });
  assert.equal(summary.notify_wrapper_only, true);
  assert.equal(summary.notify_previous_wrapper, false);
  assert.equal(summary.notify_routes_to_wrapper, true);
  assert.equal(summary.bark_enabled, true);
  assert.equal(summary.telegram_enabled, false);
  assert.equal(summary.workspace_health_daily, "PAUSED");
  assert.deepEqual(summary.issues, []);
});

test("codex workflow treats removed mobile bridge heartbeat as optional", async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workflow-no-mobile-"));
  const codexDir = path.join(homeDir, ".codex");
  await fs.mkdir(path.join(codexDir, "automations", "workspace-health-daily"), { recursive: true });
  await fs.writeFile(
    path.join(codexDir, "config.toml"),
    `notify = ["${homeDir}/.codex/tools/codex-turn-ended-notify.sh", "turn-ended"]\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "notify-config.json"),
    JSON.stringify({
      bark: { enabled: true },
      telegram: { enabled: false },
      workspace_health: { enabled: true },
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "workspace-health-daily", "automation.toml"),
    'kind = "cron"\nstatus = "ACTIVE"\nname = "Workspace health daily"\n',
    "utf8",
  );

  const summary = await buildCodexWorkflowSummary({ homeDir });
  assert.equal(summary.workspace_health_daily, "ACTIVE");
  assert.equal(summary.mobile_bridge_heartbeat, "missing");
  assert.deepEqual(summary.issues, []);
});

test("codex workflow still flags missing daily health automation", async () => {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-workflow-missing-"));
  const codexDir = path.join(homeDir, ".codex");
  await fs.mkdir(path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat"), { recursive: true });
  await fs.writeFile(
    path.join(codexDir, "config.toml"),
    `notify = ["${homeDir}/.codex/tools/codex-turn-ended-notify.sh", "turn-ended"]\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "notify-config.json"),
    JSON.stringify({
      bark: { enabled: true },
      telegram: { enabled: false },
      workspace_health: { enabled: true },
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(codexDir, "automations", "mobile-codex-bridge-heartbeat", "automation.toml"),
    'kind = "heartbeat"\nstatus = "PAUSED"\nname = "Mobile Codex Bridge heartbeat"\n',
    "utf8",
  );

  const summary = await buildCodexWorkflowSummary({ homeDir });
  assert.equal(summary.workspace_health_daily, "missing");
  assert.deepEqual(summary.issues, ["workspace_health_daily_not_active"]);
});
