#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: docs/workspace/playwright-scratch.sh [--label <name>] [--print-workdir] -- <playwright-cli args...>

Run Playwright CLI from a workspace-owned scratch directory so `.playwright-cli/`
state does not land in the repository root.

Options:
  --label <name>      Scratch subdirectory label. Default: workspace-root
  --print-workdir     Print the resolved scratch workdir and exit.
  -h, --help          Show this help text.

Examples:
  docs/workspace/playwright-scratch.sh --label sub2api -- open https://example.com --headed
  docs/workspace/playwright-scratch.sh --label sub2api -- snapshot
EOF
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
label="${PLAYWRIGHT_WORKDIR_LABEL:-workspace-root}"
print_workdir="false"
args=()

while (($# > 0)); do
  case "$1" in
    --label)
      shift
      if (($# == 0)); then
        echo "Error: --label requires a value." >&2
        exit 1
      fi
      label="$1"
      ;;
    --label=*)
      label="${1#*=}"
      ;;
    --print-workdir)
      print_workdir="true"
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    --)
      shift
      while (($# > 0)); do
        args+=("$1")
        shift
      done
      break
      ;;
    *)
      args+=("$1")
      ;;
  esac
  shift
done

if [[ ! "$label" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Error: label must match [A-Za-z0-9._-]+." >&2
  exit 1
fi

workdir="${repo_root}/scratch/shared/playwright-cli/${label}"

if [[ "$print_workdir" == "true" ]]; then
  printf '%s\n' "$workdir"
  exit 0
fi

if ((${#args[@]} == 0)); then
  show_help >&2
  exit 1
fi

mkdir -p "$workdir"

pwcli_wrapper="${CODEX_HOME:-$HOME/.codex}/skills/playwright/scripts/playwright_cli.sh"
if [[ -x "$pwcli_wrapper" ]]; then
  cmd=("$pwcli_wrapper")
else
  cmd=(npx --yes --package @playwright/cli playwright-cli)
fi

(
  cd "$workdir"
  exec "${cmd[@]}" "${args[@]}"
)
