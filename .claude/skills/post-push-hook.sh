#!/usr/bin/env bash
# Push any trailing commit the pre-push hook left behind (typically the
# auto-generated "chore: update changelog" commit that git-cliff creates
# after git has already captured the push object set).
set -euo pipefail

current_branch=$(git branch --show-current 2>/dev/null) || exit 0
[[ -z "$current_branch" ]] && exit 0

# Only act if there's a tracking remote branch
if ! git rev-parse "origin/$current_branch" >/dev/null 2>&1; then
  exit 0
fi

unpushed=$(git rev-list "origin/${current_branch}..HEAD" --count 2>/dev/null) || unpushed=0
if [[ "$unpushed" -gt 0 ]]; then
  git push origin "$current_branch"
fi
