import assert from "node:assert/strict";
import test from "node:test";

import { overallStatus, renderHealthSummary } from "./workspace-health.mjs";

test("overallStatus flags structural issues before cleanup notes", () => {
  const hygiene = {
    git_clean: true,
    unregistered_project_surfaces: [],
    nonexistent_project_references: [],
    project_route_metadata_mismatches: [],
  };
  const disk = {
    retention_gaps: [],
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
      cleanup_buckets: {
        delete: [{ pretty: "17M", count: 113, path: "(obvious garbage files)" }],
      },
      retention_manifest_loaded: true,
    },
  });

  assert.match(summary, /status: ok/u);
  assert.match(summary, /git_clean: yes/u);
  assert.match(summary, /project_route_metadata_mismatches: 0/u);
  assert.match(summary, /retention_gaps: 0/u);
  assert.match(summary, /largest_paths:/u);
  assert.match(summary, /obvious_garbage: 17M, 113 files/u);
});
