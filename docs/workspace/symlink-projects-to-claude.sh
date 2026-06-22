#!/usr/bin/env bash
# Mirror every codex-workspace project code dir into claude-workspace as a
# relative symlink, so both workspaces can see/edit the same single physical copy.
#
# Policy (decisions 2026-06-22): project code lives ONCE in codex-workspace; each
# project is its own git repo (own remote = backup). claude-workspace holds only
# local, git-ignored symlinks. New projects default to codex; run this to (re)link.
#
# Idempotent: safe to re-run. Doubles as the repair tool for dangling links after
# a codex project is renamed/moved (it re-points to the current codex layout and
# reports links whose codex target no longer exists).
#
# Usage:
#   bash docs/workspace/symlink-projects-to-claude.sh           # apply
#   bash docs/workspace/symlink-projects-to-claude.sh --dry-run # preview only
set -euo pipefail

CODEX_ROOT="/Users/zhangjincheng/Documents/GitHub/codex-workspace"
CLAUDE_ROOT="/Users/zhangjincheng/Documents/GitHub/claude-workspace"
DRY="${1:-}"

# claude registers openclaw under infrastructure/ (not products/); map exceptions here.
declare -A CLAUDE_PATH_OVERRIDE=(
  ["products/openclaw"]="infrastructure/openclaw"
)

linked=0; repaired=0; skipped=0
for codex_dir in "$CODEX_ROOT"/projects/*/*; do
  [ -d "$codex_dir" ] || continue
  rel="${codex_dir#"$CODEX_ROOT"/projects/}"          # e.g. products/love-letter-site
  claude_rel="${CLAUDE_PATH_OVERRIDE[$rel]:-$rel}"
  link="$CLAUDE_ROOT/projects/$claude_rel"
  target="../../../codex-workspace/projects/$rel"

  # already a correct symlink?
  if [ -L "$link" ] && [ "$(readlink "$link")" = "$target" ] && [ -e "$link" ]; then
    skipped=$((skipped+1)); continue
  fi
  if [ "$DRY" = "--dry-run" ]; then
    echo "would link: projects/$claude_rel -> $target"; continue
  fi
  mkdir -p "$(dirname "$link")"
  if [ -L "$link" ] || [ ! -e "$link" ]; then
    ln -sfn "$target" "$link" && { echo "linked: projects/$claude_rel"; linked=$((linked+1)); }
  elif [ -d "$link" ] && [ -z "$(ls -A "$link" 2>/dev/null)" ]; then
    rmdir "$link" && ln -s "$target" "$link" && { echo "linked (was empty dir): projects/$claude_rel"; linked=$((linked+1)); }
  else
    echo "SKIP (real non-empty dir in claude, not overwriting): projects/$claude_rel"; skipped=$((skipped+1))
  fi
done

# report dangling claude project symlinks (codex target gone)
echo "--- dangling check ---"
while IFS= read -r l; do
  [ -e "$l" ] || echo "DANGLING: ${l#"$CLAUDE_ROOT"/} -> $(readlink "$l")"
done < <(find "$CLAUDE_ROOT/projects" -maxdepth 2 -type l 2>/dev/null)

echo "done: linked=$linked skipped=$skipped"
