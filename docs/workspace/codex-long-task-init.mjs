#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  CONTINUATION_FILE,
  FAILURE_LEDGER_FILE,
  OPS_CANDIDATES_FILE,
  commitRunFiles,
  initializeRunState,
  withRunLock,
} from "./codex-long-task-state.mjs";

function parseArgs(argv = []) {
  const options = {
    workspaceRoot: "",
    project: "",
    projectRoot: "",
    task: "",
    routeEvidence: "",
    slug: "",
    timestamp: "",
    shared: false,
    dryRun: false,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (arg === "--workspace-root") {
      options.workspaceRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--project") {
      options.project = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--project-root") {
      options.projectRoot = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--task") {
      options.task = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--route-evidence") {
      options.routeEvidence = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--slug") {
      options.slug = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--timestamp") {
      options.timestamp = String(argv[index + 1] || "").trim();
      index += 1;
      continue;
    }
    if (arg === "--shared") {
      options.shared = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
  }
  return options;
}

function printHelp() {
  process.stdout.write(`Usage:
  node docs/workspace/codex-long-task-init.mjs --project <name> --task <goal> [options]

Options:
  --workspace-root <path>  Workspace root. Defaults to current working directory.
  --project-root <path>    Absolute project repo path for 01-confirmed-context.md.
  --route-evidence <text>  Explicit user/path evidence that selected this target.
  --slug <slug>            Stable ASCII slug. Defaults to a slugified task.
  --timestamp <stamp>      Deterministic timestamp, e.g. 20260429-2315.
  --shared                 Use scratch/shared/codex-runs instead of scratch/projects/<project>.
  --dry-run                Print planned paths without writing files.
  --json                   Print JSON.
`);
}

function slugify(value = "") {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/gu, "")
    .replace(/_/gu, "-")
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");
  return slug || "long-task";
}

function defaultTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function resolveWorkspaceRoot(options = {}) {
  return path.resolve(options.workspaceRoot || process.cwd());
}

function buildRunRoot(options = {}) {
  const workspaceRoot = resolveWorkspaceRoot(options);
  const project = slugify(options.project || "shared");
  const slug = slugify(options.slug || options.task || "long-task");
  const timestamp = String(options.timestamp || defaultTimestamp()).trim();
  const runName = `${timestamp}-${slug}`;
  const relativeRunRoot = options.shared === true
    ? path.join("scratch", "shared", "codex-runs", runName)
    : path.join("scratch", "projects", project, "codex-runs", runName);
  return {
    workspaceRoot,
    runRoot: path.join(workspaceRoot, relativeRunRoot),
    relativeRunRoot,
    project,
    slug,
    timestamp,
  };
}

function buildRouteLock(options = {}, run = buildRunRoot(options)) {
  const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : "";
  const project = options.project || (options.shared ? "shared" : run.project);
  return {
    project,
    targetSurface: projectRoot || "(fill in target surface before delegation)",
    projectRoot: projectRoot || "(fill in absolute project root, or N/A for workspace-index/shared work)",
    routeEvidence: options.routeEvidence || (projectRoot ? `CLI --project ${project} --project-root ${projectRoot}` : "(fill in exact user phrase, path, service, host alias, repo, or config surface that selected this target)"),
    forbiddenSurfaces: "Any project, repo, ops surface, state path, or scratch path not listed in target_surface or project_root.",
  };
}

function renderRouteLock(routeLock = {}) {
  return `## Route Lock

- target_project: ${routeLock.project}
- target_surface: ${routeLock.targetSurface}
- project_root: ${routeLock.projectRoot}
- route_evidence: ${routeLock.routeEvidence}
- forbidden_surfaces: ${routeLock.forbiddenSurfaces}
`;
}

function buildFiles(options = {}) {
  const run = buildRunRoot(options);
  const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : "";
  const routeLock = buildRouteLock(options, run);
  const routeLockReference = "Route Lock in 01-confirmed-context.md";
  const task = String(options.task || "").trim() || "(fill in task goal)";
  const now = new Date().toISOString();
  const runPath = (...segments) => path.join(run.runRoot, ...segments);
  return {
    ...run,
    files: new Map([
      ["00-request.md", `# Request

Created: ${now}

## Goal

${task}

## User Constraints

- Follow AGENTS.md risk layering, Route Lock, and final output format.
- Use codex-long-task-runbook.md as the canonical operational workflow.
`],
      ["01-confirmed-context.md", `# Confirmed Context

## Workspace Root

${run.workspaceRoot}

## Project

${options.project || (options.shared ? "shared" : run.project)}

## Project Root

${projectRoot || "(fill in absolute project root)"}

${renderRouteLock(routeLock)}

## Risk Level

(fill in L0/L1/L2/L3, rationale, and execution strategy)

## Confirmed Facts

- (fill in facts before delegation)

## Hypotheses

- (fill in hypotheses separately from facts)
`],
      ["02-plan.md", `# Plan

## Strategy

1. Follow the current AGENTS.md for workflow, model, and concurrency choices.
2. Root may inspect, implement, repair, and verify each slice directly.
3. Helpers are optional and should be used only when they provide a useful bounded contribution; no mapper/review/worker/verifier chain is prescribed.
4. Root must explicitly authorize any refactor in the applicable brief before assigning refactor_worker or starting the refactor.

## Evidence Budget

- Prefer evidence pointers: file path, line number, confirmed finding, risk, next action.
- Keep long logs and large excerpts out of chat; store them in this run directory when needed.
- Reuse 05-decisions.md before re-exploring; recheck only when drift evidence appears.

## Implementation Slices

- T01: (fill in first slice)
`],
      ["03-task-ledger.md", `# Task Ledger

| ID | Status | Agent | Scope | Inputs | Outputs | Retries | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | deferred | repo_mapper | map task surface if delegation gate opens | 00-request.md, 01-confirmed-context.md | agents/T01/mapper-result.md | 0 | optional; use only when surface/contract/impact is unclear |
| T02 | deferred | review_guard | pre-change risk review if risk gate opens | 01-confirmed-context.md, 02-plan.md | agents/T02/review-result.md | 0 | optional; use only for concrete correctness/security/rollback/test risk |
`],
      ["04-risk-register.md", `# Risk Register

## Confirmed Risks

- (none yet)

## Hypotheses

- (none yet)

## Rollback Idea

- (fill in before edits)

## Open Questions

- (none yet)
`],
      ["05-decisions.md", `# Decisions

| Time | Decision | Rationale | Applies To |
| --- | --- | --- | --- |
| ${now} | Created long-task run directory | Preserve state outside chat context | whole run |

## Reusable Facts

- (record confirmed project routes, entry points, test commands, contracts, and architecture facts)

## Common Commands

- (record verified commands so future slices do not rediscover them)

## Drift Triggers

- Recheck a cached fact only when a related file changed, an index is stale, a command fails, or new evidence contradicts this ledger.
`],
      ["06-final-summary.md", `# Final Summary

## Confirmed Facts

## Changes

## Verification

## Residual Risks

## Next Steps
`],
      ["07-agent-registry.md", `# Agent Registry

| Task ID | Role | Agent Name | Agent ID | Created For | Resume Rule | Status |
| --- | --- | --- | --- | --- | --- | --- |
`],
      [path.join("agents", "T01", "mapper-brief.md"), `# Mapper Brief

## Execution Policy

- Root may inspect, implement, repair, and verify directly.
- Helpers are optional under the current AGENTS.md; use this brief only if root delegates this bounded mapping task.
- This brief is not a required stage in a prescribed agent chain.

## Role

repo_mapper

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Route lock: ${runPath("01-confirmed-context.md")}
- Decisions: ${runPath("05-decisions.md")}

## Task

Map the real implementation or investigation surface for this request inside the locked target.
Identify entry points, files, symbols, call chains, data contracts, nearby tests,
and likely blast radius.

## Constraints

- Read-only.
- Do not edit files.
- Honor ${routeLockReference}.
- Explore only target_surface/project_root from the Route Lock.
- If evidence points outside the Route Lock, return blocked and explain; do not switch projects.
- Separate confirmed facts from hypotheses.
- Prefer concrete paths and commands over abstract advice.
- Keep output compact: files, symbols, execution paths, risks, and open questions only.
- Do not paste long source excerpts, full command output, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Write

- ${runPath("agents", "T01", "mapper-result.md")}

## Return

result: ${runPath("agents", "T01", "mapper-result.md")}
status: mapped | blocked
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`],
      [path.join("agents", "T02", "review-brief.md"), `# Review Brief

## Execution Policy

- Root may inspect, implement, repair, and verify directly.
- Helpers are optional under the current AGENTS.md; use this brief only if root delegates this bounded review task.
- This brief is not a required stage in a prescribed agent chain.

## Role

review_guard

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Route lock: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}

## Task

Review the plan and available evidence for correctness, regressions, edge cases,
security exposure, missing tests, rollback concerns, and unclear assumptions.

## Constraints

- Read-only.
- Do not implement.
- Honor ${routeLockReference}.
- Review only target_surface/project_root from the Route Lock.
- If the plan relies on another project or surface, return blocked and explain.
- Lead with concrete findings.
- Ground findings in files, paths, contracts, or missing evidence.
- Keep output compact: findings, evidence paths, missing tests, risks, and followups only.
- Do not paste long source excerpts, full diffs, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Write

- ${runPath("agents", "T02", "review-result.md")}

## Return

result: ${runPath("agents", "T02", "review-result.md")}
status: pass | changes_requested | blocked
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`],
      [path.join("brief-templates", "dev-brief.md"), `# Development Brief Template

Copy this file to ${runPath("agents", "<task-id>", "dev-brief.md")} and fill in
the placeholders before root executes it directly or delegates a bounded slice.

## Execution Policy

- Follow the current AGENTS.md for workflow, model, and concurrency choices.
- Root may execute this brief directly. Helpers are optional, and no full agent chain is prescribed.
- model_worker_delegate is a backward-compatible legacy role label; when delegation is useful, map it to an available worker and follow WORKER.md.

## Role

model_worker_delegate

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Route lock: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}

## Task

<Describe the smallest implementation slice.>

## Ownership

- Owned files/modules: <explicit write set>
- Other agents may be working elsewhere. Do not revert unrelated changes.

## Constraints

- Make the smallest defensible change.
- Honor ${routeLockReference}.
- Change only files in target_surface/project_root and the assigned write set.
- If the required fix belongs to another project or surface, return blocked and explain.
- Do not refactor unless root explicitly authorizes it in this brief; refactor_worker labels that authorized path.
- Preserve public behavior unless the acceptance criteria says otherwise.
- Stop and report if the required change exceeds this slice.
- Keep output compact.
- Do not paste long source excerpts, full diffs, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Acceptance Criteria

- <criterion 1>
- <criterion 2>

## Write

- Product/project code changes in the assigned write set.
- ${runPath("agents", "<task-id>", "dev-result.md")}

## Return

result: ${runPath("agents", "<task-id>", "dev-result.md")}
status: implemented | blocked
changed_files: <comma-separated paths>
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`],
      [path.join("brief-templates", "verify-brief.md"), `# Verification Brief Template

Copy this file to ${runPath("agents", "<task-id>", "verify-brief.md")} and fill
in the placeholders before root verifies directly or delegates a bounded verification task.

## Execution Policy

- Follow the current AGENTS.md for workflow, model, and concurrency choices.
- Root may verify directly. A verifier helper is optional, and this brief is not a required stage in a prescribed agent chain.

## Role

verifier

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Route lock: ${runPath("01-confirmed-context.md")}
- Plan: ${runPath("02-plan.md")}
- Ledger: ${runPath("03-task-ledger.md")}
- Decisions: ${runPath("05-decisions.md")}
- Development result: ${runPath("agents", "<dev-task-id>", "dev-result.md")}

## Task

Verify the assigned behavior with the smallest useful checks.

## Acceptance Criteria

- <criterion 1>
- <criterion 2>

## Constraints

- Verify, do not redesign.
- Honor ${routeLockReference}.
- Validate only target_surface/project_root from the Route Lock.
- If verification requires another project or surface, return blocked and explain.
- Do not make product code changes unless explicitly asked for a test-only fix.
- Report exact commands and outcomes.
- Separate confirmed failures from suspected failures.
- Keep output compact.
- Do not paste long source excerpts, full logs, or unrelated output.
- Return evidence pointers instead of pasted context when possible.

## Write

- ${runPath("agents", "<task-id>", "verify-result.md")}

## Return

result: ${runPath("agents", "<task-id>", "verify-result.md")}
status: pass | fail | blocked
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`],
      [path.join("brief-templates", "repair-brief.md"), `# Repair Brief Template

Copy this file to ${runPath("agents", "<dev-task-id>", "repair-<n>-brief.md")}
before root repairs directly or delegates a bounded repair task.

## Execution Policy

- Follow the current AGENTS.md for workflow, model, and concurrency choices.
- Root may repair directly. Helpers are optional, and no full agent chain is prescribed.
- model_worker_delegate is a backward-compatible legacy role label; when delegation is useful, map it to an available worker and follow WORKER.md.

## Role

model_worker_delegate

## Inputs

- Request: ${runPath("00-request.md")}
- Confirmed context: ${runPath("01-confirmed-context.md")}
- Route lock: ${runPath("01-confirmed-context.md")}
- Original development result: ${runPath("agents", "<dev-task-id>", "dev-result.md")}
- Failing verification result: ${runPath("agents", "<verify-task-id>", "verify-result.md")}
- Decisions: ${runPath("05-decisions.md")}

## Codex Verifier/Review Findings

<Paste the exact Codex verifier or review findings here.>

## Failing Evidence

<Paste the smallest exact failing evidence here.>

## Expected Behavior

<Describe expected behavior.>

## Constraints

- Fix only the Codex verifier/review findings and failing evidence listed above.
- Preserve the prior implementation unless a finding directly contradicts it.
- Do not broaden scope, refactor, or clean up unrelated code.
- Honor ${routeLockReference}.
- Repair only target_surface/project_root from the Route Lock and the assigned write set.
- If the fix belongs to another project or surface, return blocked and explain.
- Prefer the same files changed in the original development attempt.
- Do not start a refactor unless root explicitly authorizes it in this brief.
- Stop after this repair if the fix would exceed the original task slice.
- Keep output compact.
- Do not paste long source excerpts, full diffs, or large logs.
- Return evidence pointers instead of pasted context when possible.

## Write

- Product/project code changes needed for the repair.
- ${runPath("agents", "<dev-task-id>", "repair-<n>-result.md")}

## Return

result: ${runPath("agents", "<dev-task-id>", "repair-<n>-result.md")}
status: implemented | blocked
changed_files: <comma-separated paths>
tests_run: <commands or checks actually run>
evidence_pointers: <path:line finding list>
risks: <residual risks or empty>
followups: <optional next steps or empty>
`],
      [path.join("agents", ".gitkeep"), ""],
    ]),
  };
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function createLongTaskRun(options = {}) {
  const run = buildFiles(options);
  const exists = await pathExists(run.runRoot);
  if (options.dryRun === true) {
    return {
      ok: true,
      dry_run: true,
      run_root: run.runRoot,
      exists,
      files: [...run.files.keys(), CONTINUATION_FILE, FAILURE_LEDGER_FILE, OPS_CANDIDATES_FILE],
    };
  }
  if (exists) throw new Error(`run directory already exists: ${run.runRoot}`);
  await fs.mkdir(run.runRoot, { recursive: true });
  const state = await withRunLock(run.runRoot, async () => {
    await commitRunFiles(run.runRoot, "initialize-markdown-run", [...run.files.entries()].map(([relativePath, content]) => ({ relativePath, content })));
    return initializeRunState(run.runRoot, options);
  });
  return {
    ok: true,
    dry_run: false,
    run_root: run.runRoot,
    files: [...run.files.keys(), ...state.files],
  };
}

function isCliEntry() {
  return process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
}

if (isCliEntry()) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    createLongTaskRun(options)
      .then((result) => {
        if (options.json) {
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          return;
        }
        process.stdout.write(`run_root: ${result.run_root}\n`);
        process.stdout.write(`files: ${result.files.length}\n`);
      })
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}

export {
  buildFiles,
  buildRunRoot,
  buildRouteLock,
  createLongTaskRun,
  defaultTimestamp,
  parseArgs,
  renderRouteLock,
  slugify,
};
