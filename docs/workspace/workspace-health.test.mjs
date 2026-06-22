import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildCodexWorkflowSummary, overallStatus, renderHealthSummary } from "./workspace-health.mjs";

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
  assert.equal(overallStatus(hygiene, disk, { issues: ["notify_not_wrapper_only"] }), "attention");
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
      cleanup_buckets: {
        delete: [{ pretty: "17M", count: 113, path: "(obvious garbage files)" }],
      },
      retention_manifest_loaded: true,
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

  assert.match(summary, /status: ok/u);
  assert.match(summary, /git_clean: yes/u);
  assert.match(summary, /project_route_metadata_mismatches: 0/u);
  assert.match(summary, /retention_gaps: 0/u);
  assert.match(summary, /retention_overdue: 0/u);
  assert.match(summary, /codex_notify_wrapper: ok/u);
  assert.match(summary, /workspace_health_daily: PAUSED/u);
  assert.match(summary, /mobile_bridge_heartbeat: PAUSED/u);
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
      cleanup_buckets: {
        delete: [],
      },
      retention_manifest_loaded: true,
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
  assert.equal(summary.notify_via_desktop_client, true);
  assert.equal(summary.notify_has_previous_notify, true);
  assert.deepEqual(summary.issues, [
    "notify_not_wrapper_only",
    "notify_via_desktop_client",
    "notify_has_previous_notify",
  ]);
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
  assert.equal(summary.bark_enabled, true);
  assert.equal(summary.telegram_enabled, false);
  assert.equal(summary.workspace_health_daily, "PAUSED");
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
