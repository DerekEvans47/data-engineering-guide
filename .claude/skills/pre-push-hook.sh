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

# Block any commit whose message or body contains a session URL
if [ -n "$RANGE" ]; then
  bad=$(git log --format="%h %s" "$RANGE" 2>/dev/null | grep -iE "claude\.ai/code/session_[A-Za-z0-9]" || true)
  if [ -n "$bad" ]; then
    echo "ERROR: commit(s) contain session URLs (violates CLAUDE.md PII rule):" >&2
    echo "$bad" >&2
    exit 1
  fi
  bad_body=$(git log --format="%h%n%B" "$RANGE" 2>/dev/null | grep -iE "claude\.ai/code/session_[A-Za-z0-9]" || true)
  if [ -n "$bad_body" ]; then
    echo "ERROR: commit body/trailer contains a session URL (violates CLAUDE.md PII rule)" >&2
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
