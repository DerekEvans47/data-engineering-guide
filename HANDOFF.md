# Nightly Handoff — 2026-06-29 (session 2)

## Completed this session (8 items, 108 effort points)

| ID   | Title | Effort | Branch | PR |
|------|-------|--------|--------|----|
| APP_VERSION | Auto-derive display version from SW cache name | — | feat/sw-version-display | #35 merged |
| C-3  | Question topic tag in quiz overlay (already done, confirmed) | 15 | — | confirmed DONE |
| P-2  | XP shown in quiz feedback + streak multiplier tag (already done, confirmed) | 22 | — | confirmed DONE |
| P-8  | Question mastery tracking (3 correct = mastered, deprioritised) | 30 | feat/quiz-xp-mastery | #37 merged |
| V-16 | Level-gated tower sprite evolution (pals[lvl] already implemented) | 25 | — | confirmed DONE |
| V-21 | Run-map perturbed node positions + bezier connectors | 20 | feat/run-map-bezier-nodes | #38 merged |
| V-22 | Run-map traveled/untraveled path distinction | 10 | feat/run-map-bezier-nodes | #38 merged |
| V-25 | Run-map fog of war on unreachable nodes | 15 | feat/run-map-path-fog | #39 merged |
| V-17 | Tower idle breathing animation (per-tower idlePhase, ±4% sin-wave scale) | 15 | feat/tower-idle-animation | #40 merged |
| V-19 | Type-specific enemy death animations | 25 | feat/enemy-death-animations | #41 merged |
| I-3  | Offline question-bank versioning (network-first SW, versioned JSON) | 18 | feat/qb-version-check | #42 merged |

_Note: APP_VERSION, C-3, P-2, V-16, V-22 were discovered already implemented — counted as confirmed DONE, not re-implemented._

## Partial (started but not committed)
_None._

## Skipped
_None._

## Conflicted PRs
_None — all PRs in this session merged cleanly._

## State for next run

- **SW cache version**: `de-drill-v67`
- **question-bank.json format**: Now versioned object `{ "version": "1.0", "questions": [...] }` — bump version string when adding questions, app stores it under `qb_version` in localStorage
- **SW strategy**: question-bank.json uses network-first (no SW bump needed for question updates), all other assets cache-first

### Recommended next items (priority order)

1. **S-2** (effort 20, P1) — Extract question-logic module; S-1 is DONE; pure refactor with no user-visible change but reduces drill.js coupling
2. **EQ-2** (effort 35, P1) — Power-up system data model + pre-wave tray; depends on EQ-1 (DONE); unlocks EQ-3/6/7
3. **V-23** (effort 20, P2) — Run-map themed node shapes (shield pentagon, scroll, coin hex, skull diamond); V-21 DONE so this is unblocked
4. **G-7** (effort 30, P2) — Endless mode: procedural waves beyond wave 5 + score display
5. **I-3 follow-up** (0 pts, quick) — Add "New questions available!" toast when `qb_version` changes between loads

## Technical notes for next run

### V-19 death animation details
- `e.dir` is now stored on every enemy during movement (angle in radians to next waypoint)
- Scout death uses `e.dir` for directional streak; safe to extend for other directional effects
- `td.bossFlash` is a new field (0–1 float) that drives a full-screen white overlay; decays at 0.016/frame
- `shape:'coin'` particles use `ctx.rotate(spin)` + `fillRect` — spin angle = `(1-a)*PI*3 + p.angle`
- `shape:'ring'` particles use `ctx.arc` with expanding radius `r * (2 - a)` and stroke instead of fill

### I-3 question-bank.json format
- Old: `[...questions]`
- New: `{ "version": "1.0", "questions": [...questions] }`
- Boot code handles both (backward compat): `Array.isArray(raw) ? raw : raw.questions`
- To bump version: change `"version"` string in question-bank.json (any string; stored in `qb_version` localStorage key)
- SW serves it network-first — updates reach users on next page load without any SW bump

### Tower idle animation (V-17)
- `idlePhase: Math.random() * Math.PI * 2` added to tower object at placement time (both placement paths)
- Breathing: `idle = 1 + 0.04 * Math.sin(bgT * 1.8 + t.idlePhase)` when `firePulse < 0.05`
- Implemented with `ctx.save/translate/scale/restore` around the sprite draw — no game logic changes

### Run-map fog of war (V-25)
- Checks `node.prevIds.map(pid => run.nodes.find(n=>n.id===pid))`
- Near-reachable = any predecessor has state `completed`, `available`, or `active`
- Far nodes (no near-reachable predecessor): `opacity="0.28"` on the `<g>` element
- Near nodes: `opacity="1"`

### Backlog status summary (as of end of session)
DONE items: V-13, V-16, V-17, V-18, V-19, V-21, V-22, V-25, V-29, V-30, V-31, V-32, V-26, V-27, V-28, C-3, C-4, P-2, P-8, U-2, U-5, U-6, U-7, U-8, U-9, U-10, U-11, G-1, S-1, S-5, S-8, S-9, EQ-1, I-1, I-3, I-4, T-1, T-2, T-3, T-4, U-1

TODO (highest value unblocked):
- S-2 (20 pts, P1) — Extract question-logic module
- EQ-2 (35 pts, P1) — Power-up system
- EQ-4 (45 pts, P1) — Relic system
- V-23 (20 pts, P2) — Run-map themed node shapes
- G-7 (30 pts, P2) — Endless mode
