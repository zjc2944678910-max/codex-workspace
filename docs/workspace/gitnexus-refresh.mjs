#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function parseArgs(argv = []) {
  return {
    force: argv.includes("--force"),
    json: argv.includes("--json"),
  };
}

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function buildAnalyzeArgs(options = {}, previousMeta = {}) {
  const args = ["gitnexus", "analyze", "--skip-agents-md"];
  const hadEmbeddings = Number(previousMeta?.stats?.embeddings || 0) > 0;
  if (hadEmbeddings) args.push("--embeddings");
  if (options.force === true) args.push("--force");
  return args;
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function evaluateRefreshResult(input = {}) {
  const analyzeOutput = `${input.analyzeStdout || ""}\n${input.analyzeStderr || ""}`;
  const metaMatchesHead = Boolean(input.head)
    && String(input.metaCommit || "").startsWith(String(input.head));
  const statusUpToDate = /Status:\s*✅\s*up-to-date/u.test(input.statusOutput || "");
  const indexedSuccessfully = /Repository indexed successfully/u.test(analyzeOutput);
  const successIndex = analyzeOutput.indexOf("Repository indexed successfully");
  const mutexMatch = /mutex lock failed:\s*Invalid argument/iu.exec(analyzeOutput);
  const knownMutexAfterSuccess = Boolean(mutexMatch) && mutexMatch.index > successIndex;
  const analyzeSucceeded = input.analyzeStatus === 0;
  const acceptedKnownShutdownError = !analyzeSucceeded
    && indexedSuccessfully
    && metaMatchesHead
    && statusUpToDate
    && knownMutexAfterSuccess;
  return {
    ok: (analyzeSucceeded || acceptedKnownShutdownError) && metaMatchesHead && statusUpToDate,
    analyze_succeeded: analyzeSucceeded,
    accepted_known_shutdown_error: acceptedKnownShutdownError,
    indexed_successfully: indexedSuccessfully,
    meta_matches_head: metaMatchesHead,
    status_up_to_date: statusUpToDate,
  };
}

function refreshGitNexus(repoRoot = process.cwd(), options = {}) {
  const root = path.resolve(repoRoot);
  const metaPath = path.join(root, ".gitnexus", "meta.json");
  const previousMeta = readJsonIfExists(metaPath) || {};
  const analyzeArgs = buildAnalyzeArgs(options, previousMeta);
  const analyze = run("npx", analyzeArgs, root);
  const head = run("git", ["rev-parse", "HEAD"], root).stdout.trim();
  const currentMeta = readJsonIfExists(metaPath) || {};
  const status = run("npx", ["gitnexus", "status"], root);
  const verdict = evaluateRefreshResult({
    analyzeStatus: analyze.status,
    analyzeStdout: analyze.stdout,
    analyzeStderr: analyze.stderr,
    head,
    metaCommit: currentMeta.lastCommit,
    statusOutput: `${status.stdout || ""}\n${status.stderr || ""}`,
  });
  return {
    ...verdict,
    repo_root: root,
    head,
    indexed_commit: currentMeta.lastCommit || "",
    embeddings: Number(currentMeta?.stats?.embeddings || 0),
    analyze_args: analyzeArgs,
    analyze_exit_code: analyze.status,
    status_exit_code: status.status,
    status_output: String(status.stdout || status.stderr || "").trim(),
    analyze_output_tail: `${analyze.stdout || ""}\n${analyze.stderr || ""}`.trim().split(/\r?\n/u).slice(-12),
  };
}

function renderResult(result = {}) {
  return [
    `ok: ${result.ok ? "yes" : "no"}`,
    `head: ${result.head || ""}`,
    `indexed_commit: ${result.indexed_commit || ""}`,
    `embeddings: ${Number(result.embeddings || 0)}`,
    `analyze_exit_code: ${result.analyze_exit_code}`,
    `accepted_known_shutdown_error: ${result.accepted_known_shutdown_error ? "yes" : "no"}`,
    result.status_output || "",
  ].filter(Boolean).join("\n") + "\n";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = refreshGitNexus(process.cwd(), options);
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : renderResult(result));
  process.exitCode = result.ok ? 0 : 1;
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);
if (entryPath === modulePath) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export {
  buildAnalyzeArgs,
  evaluateRefreshResult,
  parseArgs,
  refreshGitNexus,
  renderResult,
};
