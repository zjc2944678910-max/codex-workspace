import assert from "node:assert/strict";
import test from "node:test";

import {
  enrichMatches,
  findProjects,
  loadProjectRegistry,
  parseArgs,
  renderProjectMatches,
  riskGate,
} from "./find-project.mjs";

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
