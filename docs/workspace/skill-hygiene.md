# Skill Inventory And Validation

The scanner reads only explicitly selected directories. The default remains the
workspace's `.agents/skills`; it does not silently inspect user configuration,
plugin caches or credentials.

```bash
node docs/workspace/skill-hygiene.mjs
node docs/workspace/skill-hygiene.mjs --json \
  --skill-root .agents/skills \
  --skill-root "$HOME/.codex/skills" \
  --skill-root "$HOME/.agents/skills" \
  --disabled-skill "$HOME/.codex/skills/openai-docs/SKILL.md" \
  --disabled-skill "$HOME/.codex/skills/imagegen/SKILL.md"
```

Pass every disabled selector relevant to the audit; the example is not an
automatic mirror of the user's config. `--disabled-skill` accepts a SKILL.md
path or a directory subtree. It does not disable anything in Codex; it only
models that selection for this read-only inventory. `--help` shows usage.

Programmatic callers retain `auditSkillTree(repoRoot, { skillRoot })`. New
callers may supply `skillRoots: string[]` and `disabledSkillPaths: string[]`.
`skillRoots` takes precedence over legacy `skillRoot` when both are supplied.
Paths are relative to repoRoot unless absolute. Overlapping and symlinked roots
are deduplicated by real file identity, with traversal cycle protection.

JSON preserves `root`, `status`, `skill_count`, `skills`, and `issues`. It adds
`roots`, `installed_skill_count` and `active_skill_count`; each skill includes
`source_root`, `resolved_path`, `bytes`, `lines`, and `enabled`. For overlapping
roots, source_root is the first root that discovered the file. Legacy status
describes inventory presence; check `issues` for findings. CLI exit codes are
0 for no findings, 1 for inventory findings, and 2 for invalid CLI input/errors.

Checks cover names, descriptions, historical stale markers, active duplicate
names, inaccessible roots and missing concrete local linked files. Disabled
entries remain in inventory and metadata checks, but are excluded from active
duplicate and missing-reference checks. Code fences, inline code, URLs, anchors,
templates, HTML links and extensionless web routes are not treated as local
file references. This is a focused Markdown/metadata check, not a full YAML or
Markdown parser, runtime skill registry, security audit or behavioral eval.

Large entrypoint sizes are inventory data, not automatic failures. Split a
large skill only when substantial conditional detail can be loaded on demand.
Validate changed skills with the skill-creator validator and use isolated
old/new task comparisons when decision quality needs measurement. Compare
observable outcomes and artifacts; passing metadata checks alone does not show
that a skill improves model performance.
