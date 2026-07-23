#!/usr/bin/env bash
# pre-commit hook (game repo) — scan STAGED FILE CONTENT for personal
# identifiers (Claude session URLs, session trailers, or the generated-by
# footer) accidentally left in code/docs, and block the commit if found.
# The pre-push hook covers commit messages; this covers file contents.
#
# Installed into .git/hooks/pre-commit by .claude/settings.json on session start.
set -euo pipefail

PII_PATTERN='claude\.ai/code/session_[A-Za-z0-9]|Claude-Session:|Generated (by|with) \[?Claude Code'

# Only the staged additions (lines starting with '+'), excluding the diff header.
staged_added=$(git diff --cached --unified=0 --no-color 2>/dev/null \
  | grep -E '^\+' | grep -vE '^\+\+\+' || true)

hits=$(printf '%s\n' "$staged_added" | grep -iE "$PII_PATTERN" || true)
if [ -n "$hits" ]; then
  echo "ERROR: staged changes contain a personal identifier (violates CLAUDE.md):" >&2
  printf '%s\n' "$hits" >&2
  echo "Remove it from the file(s) and re-stage before committing." >&2
  exit 1
fi
