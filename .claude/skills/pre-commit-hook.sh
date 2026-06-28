#!/usr/bin/env bash
# pre-commit hook — regenerate CHANGELOG.md and stage it so the
# changelog is always baked into the commit being made.
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
npx --yes git-cliff --config cliff.toml --output CHANGELOG.md 2>/dev/null || true
git add CHANGELOG.md 2>/dev/null || true
