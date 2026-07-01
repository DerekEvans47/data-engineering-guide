# Nightly Handoff — 2026-07-01

## Completed this session (4 items, 132 effort points)

| ID   | Title | Effort | Branch | PR |
|------|-------|--------|--------|----|
| S-3  | Extract tower-defense engine block into one delimited section | 40 | refactor/td-engine-section | #53 merged |
| G-2  | Enemy special types — raider (fast), brute (armored), wisp (flying), shaman (healer) | 42 | feat/enemy-special-types | #54 merged |
| S-7  | Split drill.css into labelled sections + consolidated @keyframes/reduced-motion | 25 | chore/split-drill-css-layers | #55 merged |
| V-15 | Landmark anchors — watchtower (entry), castle gate (exit), theme mid-landmark | 25 | feat/td-landmark-anchors | #56 merged |

## Partial (started but not committed)
_None._

## Skipped (never started)
| ID | Reason |
|----|--------|
| I-2 | Cloud sync via GitHub Gist requires a GitHub OAuth app decision that can't be made unilaterally — flagged in BACKLOG.md notes as needing to "flag before implementing." Deferred to a session where the user has weighed in. |

## Conflicted PRs (need manual review before next run)
_None — all 4 PRs this session merged cleanly (squash), no rebases needed._

## State for next run

- **SW cache version**: `de-drill-v78`
- **Running effort total this session**: 132 / 150 (target), well inside the "solid session" band. Stopped deliberately at 4 items rather than stretching for a 5th — two of the four items required real mid-implementation bug investigation (see below), and quality/verification rigor was prioritized over hitting the top of the point range.

### Two real regressions were caught and fixed *during this session* (not pre-existing bugs)

1. **S-7 (CSS cascade order)** — Consolidating all `@keyframes` + both `prefers-reduced-motion` media queries into one section initially placed that section *mid-file*, before some of the normal rules it's meant to override (`.rn-pulse`, `.td-star-anim`, `.tdm-ring`). For equal-specificity CSS rules the *later* source-order rule wins — so the reduced-motion override silently stopped applying under the verifier's `reducedMotion: 'reduce'` browser context, leaving `.rn-pulse`'s scale animation running forever and making the SVG run-map node "not stable" for Playwright's click (a real, reproducible click-timeout failure, not a hunch). Fixed by moving the whole consolidated section to the very end of the file, after every rule it could possibly override. Verified byte-for-byte rule equivalence with a small rule-chunk diff script before and after.
2. **V-15 (negative timestamp)** — `td.bgTime` can be a hair negative on the very first render frame of a battle (rAF timestamp vs. the `performance.now()` call that seeds `lastTs` — a real, if rare, clock-skew edge case). `Math.floor(bgT % 2)` returned `-1` on that negative input instead of wrapping (JS `%` keeps the sign of its left operand, unlike Python's), which crashed `tdDrawSprite` via an out-of-bounds array read (`frames[-1]` → `undefined`) the instant a battle started. Reproduced with a stack-traced Playwright run, confirmed the exact negative `bgT` value, and fixed with a sign-safe modulo `((bgT % 2) + 2) % 2`. Re-ran the verifier twice after the fix to confirm it wasn't flaky.

Both are documented in their respective commit messages / PR bodies in detail — worth reading if touching those code paths again.

### Recommended next items (priority order, derived fresh from BACKLOG.md — do not trust this list blindly, re-derive per Phase 2 instructions)

1. **S-4** (30 pts, P1) — Extract canvas render block (`tdRender` sub-functions). Dependency `S-3` is now DONE, so this is newly unblocked. Natural follow-on to this session's S-3 work — the render function is one large block (`tdRender`, ~350 lines) with sub-sections already commented; likely a banner-and-light-consolidation job similar to S-3, not a full rewrite.
2. **V-20** (15 pts, P2) — Enemy status effect visuals (freeze/burn/stun overlays). Dependency `G-2` is now DONE (this session), so this is newly unblocked and pairs naturally with the armored/flying/healer badges added in G-2 — could reuse the same badge-render pattern.
3. **EQ-3** (25 pts, P2 per BACKLOG, but see caution below) — Power-up content list (12 power-ups). **Caution**: only 5 power-up effect *types* currently exist in the engine (gold_rush, rapid_fire, pathsalt, fortify, scavenger). At least 7 of the 12 specced power-ups (Eagle Shot, Iron Skin, Adrenaline, Cheap Labour, Recall, Scout Report, Overclock) need brand-new engine effect logic, not just data entries — this is very likely a >2x effort overshoot against its 25-point label. Budget accordingly or split into a data-only sub-item (add the 5 already-supported effect types' variants) plus a separate engine-effects item for the rest.
4. **EQ-4** (45 pts, P1) — Relic system data model + equip menu. Large, self-contained, unblocks EQ-5/6/7/8.
5. **U-4** (20 pts, P2) — Color-blind mode (pattern fills on towers).

### Backlog status summary (as of end of session)
DONE items added this session: **S-3, G-2, S-7, V-15** (29 total DONE items in BACKLOG.md now).

Newly unblocked by this session's work: **S-4** (dep S-3), **V-20** (dep G-2).

Still blocked: EQ-5/6/7/8 (dep EQ-4), P-5 (dep P-1, G-4), C-5 (dep P-3), C-6 (dep C-1 — ONGOING, not DONE).
