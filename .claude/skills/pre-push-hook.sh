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

# Compute commit range for this push
RANGE=$(echo "$PUSH_INFO" | awk '{print $4 ".." $2}' | head -1)

# Block any commit whose message/body contains a personal identifier:
# Claude session URLs, Claude-Session trailers, or generated-by footers.
if [ -n "$RANGE" ]; then
  PII_PATTERN='claude\.ai/code/session_[A-Za-z0-9]|Claude-Session:|Generated (by|with) \[?Claude Code'
  bad=$(git log --format="%h%n%B" "$RANGE" 2>/dev/null | grep -iE "$PII_PATTERN" || true)
  if [ -n "$bad" ]; then
    echo "ERROR: commit message/body contains a personal identifier (violates CLAUDE.md PII rule):" >&2
    echo "$bad" >&2
    exit 1
  fi
fi

# Only run browser verifier when learn/drill/ files are in the push
DRILL_CHANGED=false
if [ -n "$RANGE" ] && git diff --name-only "$RANGE" 2>/dev/null | grep -q "^learn/drill/"; then
  DRILL_CHANGED=true
fi
if [ "$DRILL_CHANGED" = "true" ]; then
  bash "$REPO_ROOT/.claude/skills/verifier-browser.sh"
fi
