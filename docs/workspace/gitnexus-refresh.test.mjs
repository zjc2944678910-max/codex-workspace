import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyzeArgs, evaluateRefreshResult } from "./gitnexus-refresh.mjs";

test("gitnexus refresh preserves embeddings and skips generated agent docs", () => {
  const args = buildAnalyzeArgs({}, { stats: { embeddings: 516 } });
  assert.deepEqual(args, ["gitnexus", "analyze", "--skip-agents-md", "--embeddings"]);
  assert.equal(args.includes("--skills"), false);
});

test("gitnexus refresh does not expose an option that drops existing embeddings", () => {
  const args = buildAnalyzeArgs({ embeddings: false }, { stats: { embeddings: 516 } });
  assert.equal(args.includes("--embeddings"), true);
});

test("gitnexus refresh accepts the known post-success mutex shutdown only with current metadata", () => {
  const result = evaluateRefreshResult({
    analyzeStatus: 1,
    analyzeStdout: "Repository indexed successfully (6.3s)",
    analyzeStderr: "mutex lock failed: Invalid argument",
    head: "abc1234",
    metaCommit: "abc123456789",
    statusOutput: "Status: ✅ up-to-date",
  });
  assert.equal(result.ok, true);
  assert.equal(result.accepted_known_shutdown_error, true);
});

test("gitnexus refresh fails closed when the index commit does not match HEAD", () => {
  const result = evaluateRefreshResult({
    analyzeStatus: 1,
    analyzeStdout: "Repository indexed successfully (6.3s)",
    analyzeStderr: "mutex lock failed: Invalid argument",
    head: "new1234",
    metaCommit: "old1234",
    statusOutput: "Status: ⚠️ stale",
  });
  assert.equal(result.ok, false);
  assert.equal(result.meta_matches_head, false);
});

test("gitnexus refresh rejects unrelated invalid-argument failures", () => {
  const result = evaluateRefreshResult({
    analyzeStatus: 1,
    analyzeStdout: "Repository indexed successfully (6.3s)",
    analyzeStderr: "invalid option: Invalid argument",
    head: "abc1234",
    metaCommit: "abc123456789",
    statusOutput: "Status: ✅ up-to-date",
  });
  assert.equal(result.ok, false);
  assert.equal(result.accepted_known_shutdown_error, false);
});

test("gitnexus refresh rejects mutex errors that occur before successful indexing", () => {
  const result = evaluateRefreshResult({
    analyzeStatus: 1,
    analyzeStdout: "mutex lock failed: Invalid argument\nRepository indexed successfully (6.3s)",
    head: "abc1234",
    metaCommit: "abc123456789",
    statusOutput: "Status: ✅ up-to-date",
  });
  assert.equal(result.ok, false);
});
