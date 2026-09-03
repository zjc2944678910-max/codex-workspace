import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

import {
  assessRouteAmbiguity,
  enrichMatches,
  findProjects,
  loadProjectRegistry,
  parseArgs,
  renderProjectMatches,
  riskGate,
} from "./find-project.mjs";

const scriptPath = path.resolve(import.meta.dirname, "find-project.mjs");

test("find-project parses query flags", () => {
  assert.deepEqual(parseArgs(["笨笨", "--json", "--limit", "2"]), {
    query: "笨笨",
    json: true,
    limit: 2,
  });
});

test("find-project matches Chinese aliases", async () => {
  const registry = await loadProjectRegistry();
  const matches = findProjects(registry, "笨笨");
  assert.equal(matches[0].project.slug, "openclaw");
  assert.ok(matches[0].matched_terms.includes("笨笨"));
});

test("find-project matches service and host route tokens", async () => {
  const registry = await loadProjectRegistry();
  const serviceMatches = findProjects(registry, "codex_antigravity");
  const hostMatches = findProjects(registry, "node.nodezjc12348888.xyz");

  assert.equal(serviceMatches[0].project.slug, "sub2api");
  assert.ok(hostMatches.some((match) => match.project.slug === "proxy-nodes"));
  assert.ok(hostMatches.some((match) => match.project.slug === "cloudflare-edge"));
});

test("find-project renders useful project entrypoints", async () => {
  const registry = await loadProjectRegistry();
  const matches = await enrichMatches(findProjects(registry, "openclaw", { limit: 1 }));
  const rendered = renderProjectMatches("openclaw", matches);

  assert.match(rendered, /OpenClaw \(openclaw\)/u);
  assert.match(rendered, /L2 read-only first pass; L3 changes require `进入修复阶段`/u);
  assert.match(rendered, /ops\/projects\/openclaw\/README.md/u);
  assert.match(rendered, /ops\/projects\/openclaw\/runbooks\/sre-troubleshooting-runbook.md/u);
});

test("find-project risk gates distinguish live and local projects", async () => {
  const registry = await loadProjectRegistry();
  const openclaw = registry.projects.find((project) => project.slug === "openclaw");
  const hotel = registry.projects.find((project) => project.slug === "hotel-mgmt");

  assert.match(riskGate(openclaw), /L2 read-only/u);
  assert.match(riskGate(openclaw), /进入修复阶段/u);
  assert.match(riskGate(hotel), /no live infra/u);
});

test("find-project returns no matches for unknown query", async () => {
  const registry = await loadProjectRegistry();
  assert.deepEqual(findProjects(registry, "definitely-not-a-project"), []);
});

test("find-project marks a shared-host tie as ambiguous", async () => {
  const registry = await loadProjectRegistry();
  const matches = findProjects(registry, "home-vps-root", { limit: Number.MAX_SAFE_INTEGER });
  const route = assessRouteAmbiguity("home-vps-root", matches);

  assert.equal(route.ambiguous, true);
  assert.equal(route.ambiguity_reason, "shared_host_alias_tie");
  assert.deepEqual(route.ambiguous_projects, ["openclaw", "sub2api", "vps-racknerd"]);
  assert.deepEqual(route.required_route_evidence, ["service_name", "project_path"]);
  assert.ok(route.candidate_route_evidence.openclaw.service_names.includes("openclaw-gateway"));
  assert.ok(route.candidate_route_evidence.sub2api.project_paths.includes("ops/projects/sub2api"));
});

test("find-project JSON keeps ambiguity evidence even when output is limited", () => {
  const result = spawnSync("node", [scriptPath, "home-vps-root", "--json", "--limit", "1"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.matches.length, 1);
  assert.equal(parsed.ambiguous, true);
  assert.deepEqual(parsed.ambiguous_projects, ["openclaw", "sub2api", "vps-racknerd"]);
  assert.deepEqual(parsed.required_route_evidence, ["service_name", "project_path"]);
});

test("find-project text requires secondary evidence for shared hosts", async () => {
  const registry = await loadProjectRegistry();
  const matches = findProjects(registry, "home-vps-root", { limit: Number.MAX_SAFE_INTEGER });
  const route = assessRouteAmbiguity("home-vps-root", matches);
  const rendered = renderProjectMatches("home-vps-root", matches.slice(0, 1), route);

  assert.match(rendered, /ambiguous: yes/u);
  assert.match(rendered, /required_route_evidence: service_name or project_path/u);
  assert.match(rendered, /candidate_route_evidence:/u);
});
