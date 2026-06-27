#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"

bash "$REPO_ROOT/.claude/skills/verifier-browser.sh"
