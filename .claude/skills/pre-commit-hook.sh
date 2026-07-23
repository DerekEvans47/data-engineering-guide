#!/usr/bin/env bash
# pre-commit hook — (1) block staged file content that contains a Claude
# session URL (personal identifier; see CLAUDE.md), then (2) regenerate
# docs/CHANGELOG.md and stage it so the changelog is baked into the commit.
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# (1) Personal-identifier guard on staged file *content*. Match only a real
# session id (8+ chars after "session_") so this never trips on the pattern's
# own definition in the hook scripts, or short doc examples like "session_test".
staged_added=$(git diff --cached --unified=0 --no-color 2>/dev/null \
  | grep -E '^\+' | grep -vE '^\+\+\+' || true)
hits=$(printf '%s\n' "$staged_added" | grep -iE 'claude\.ai/code/session_[A-Za-z0-9]{8,}' || true)
if [ -n "$hits" ]; then
  echo "ERROR: staged changes contain a Claude session URL (violates CLAUDE.md PII rule):" >&2
  printf '%s\n' "$hits" >&2
  echo "Remove it from the file(s) and re-stage before committing." >&2
  exit 1
fi

# (2) Regenerate the changelog and stage it.
npx --yes git-cliff --config cliff.toml --output docs/CHANGELOG.md 2>/dev/null || true
git add docs/CHANGELOG.md 2>/dev/null || true
