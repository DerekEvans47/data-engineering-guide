#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"

bash "$REPO_ROOT/.claude/skills/verifier-browser.sh"

# Regenerate changelog from commit history
cd "$REPO_ROOT"
npx --yes git-cliff --config cliff.toml --unreleased --output CHANGELOG.md 2>/dev/null || true
if ! git diff --quiet CHANGELOG.md 2>/dev/null; then
  git add CHANGELOG.md
  last_msg=$(git log -1 --format="%s")
  if [ "$last_msg" = "chore: update changelog" ]; then
    git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit --no-verify --amend --no-edit --reset-author
  else
    git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit --no-verify -m "chore: update changelog"
  fi
fi
