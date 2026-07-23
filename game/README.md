# Quiz Defense — Game

A data-engineering-themed **tower defense** game. Place towers, defend a painted
isometric road against waves of enemies, and earn gold from kills to build and
upgrade your defense across a node-based run map through three acts.

Pure HTML, CSS, and vanilla JavaScript — no build step, no dependencies, no
framework. Installable as an offline PWA via the included service worker.

This folder is fully self-contained: it has no dependency on any question bank or
learning material. (It was split out of the combined `data-engineering-guide`
repo; the Study/Drill learning app and written guide live there.)

## Run it

Serve this folder over HTTP and open `index.html`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

## Files

```
index.html          ← app shell
drill-core.js       ← storage, XP/achievements, boot, home, profile
drill-audio.js      ← Web Audio engine (music + SFX)
drill-world.js      ← map/run-map data, level generation, region UI
drill-td.js         ← tower-defense battle engine
config.json         ← all gameplay tuning (towers/enemies/relics/…)
drill.css           ← styles
sw.js               ← service worker (offline cache)
manifest.json       ← PWA manifest
assets/             ← painted maps, tower/enemy/relic art, audio, fonts
verify.sh           ← Playwright smoke test (home → map → battle → wave)
```

## Verify

```bash
bash verify.sh
```

Drives Chromium through the full flow (home → region map → battle → wave start)
and asserts the game runs standalone with no quiz gating. Exit 0 = pass.

## Service worker

When you change any file under this folder, bump the cache version in `sw.js`
(`const CACHE = 'quiz-defense-game-vN'`) so browsers pick up the new assets. The
home-screen version badge derives from that cache name automatically.

## Standalone-repo setup (git hooks / PII protection)

This folder carries everything needed to run as its own repository, including
git hooks that keep Claude session IDs and other personal identifiers out of
commits. The hook scripts are tracked in `.claude/skills/`, and `.claude/settings.json`
re-installs them into `.git/hooks/` at the start of every Claude Code session — so
after moving this folder to a new repo, just open it once in Claude Code.

To install the hooks manually (or without Claude Code):

```bash
cp .claude/skills/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
cp .claude/skills/pre-push-hook.sh  .git/hooks/pre-push   && chmod +x .git/hooks/pre-push
```

See `CLAUDE.md` for the full commit-hygiene rules the hooks enforce.
