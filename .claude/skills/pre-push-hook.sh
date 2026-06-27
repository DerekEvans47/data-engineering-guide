#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Read push info from stdin; skip entirely for branch deletions
PUSH_INFO=$(cat)
if echo "$PUSH_INFO" | grep -q "^0000000000000000000000000000000000000000 "; then
  exit 0  # delete push — nothing to verify or changelog
fi
# Also skip if all local SHAs are zero (delete from remote ref side)
if echo "$PUSH_INFO" | awk '{print $2}' | grep -qv "^0\+$" 2>/dev/null; then
  : # has real commits, continue
elif [ -z "$PUSH_INFO" ]; then
  exit 0  # nothing being pushed
fi

# Only run browser verifier when learn/drill/ files are in the push
RANGE=$(echo "$PUSH_INFO" | awk '{print $4 ".." $2}' | head -1)
DRILL_CHANGED=false
if [ -n "$RANGE" ] && git diff --name-only "$RANGE" 2>/dev/null | grep -q "^learn/drill/"; then
  DRILL_CHANGED=true
fi
if [ "$DRILL_CHANGED" = "true" ]; then
  bash "$REPO_ROOT/.claude/skills/verifier-browser.sh"
fi

# Regenerate changelog from full commit history (no --unreleased: that requires tags)
cd "$REPO_ROOT"
npx --yes git-cliff --config cliff.toml --output CHANGELOG.md 2>/dev/null || true
if ! git diff --quiet CHANGELOG.md 2>/dev/null; then
  git add CHANGELOG.md
  last_msg=$(git log -1 --format="%s")
  if [ "$last_msg" = "chore: update changelog" ]; then
    git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit --no-verify --amend --no-edit --reset-author
  else
    git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit --no-verify -m "chore: update changelog"
  fi
fi
