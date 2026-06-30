# Nightly Handoff — 2026-06-30

## Completed this session (5 items, 143 effort points)

| ID   | Title | Effort | Branch | PR |
|------|-------|--------|--------|----|
| EQ-2 | Power-up system — data model, scope, pre-wave tray | 35 | feat/td-powerup-system | #45 merged |
| V-23 | Run-map: themed node shapes per type | 20 | feat/run-map-node-shapes | #46 merged |
| G-7  | Endless mode — procedural waves after victory | 30 | feat/endless-mode | #47 merged |
| S-2  | Extract question-logic module | 20 | feat/question-logic-module | #48 merged |
| S-6  | Data-drive TD level/tower/enemy config (config section) | 18 | feat/td-config-section | #49 merged |
| G-8  | Difficulty modifier toggles — Ironman, No Gold, Speed+ | 20 | feat/difficulty-modifiers | #50 merged |

_Note: 6 items completed, total = 143 pts._

## Partial (started but not committed)
_None._

## Skipped
_None._

## Conflicted PRs
_None — all PRs in this session merged cleanly._

## State for next run

- **SW cache version**: `de-drill-v73`
- **question-bank.json format**: Versioned object `{ "version": "1.0", "questions": [...] }` — bump `"version"` string when adding questions; app stores it under `qb_version` in localStorage
- **SW strategy**: question-bank.json uses network-first (no SW bump needed for content updates), all other assets cache-first

### Recommended next items (priority order)

1. **S-7** (effort 25, P2) — Split drill.css into logical layers; currently 2100+ lines mixed; add clearly labelled section headers (variables, layout, components, screens, animations)
2. **V-24** (effort 30, P2) — Run-map background: warm sepia noise pass + ink-stain vignette; no image assets needed, pure Canvas 2D; unblocked
3. **V-15** (effort 25, P2) — Landmark anchor objects on TD map (entry portal, mid-structure, exit gate); multi-cell sprites drawn before towers in tdRender
4. **EQ-3/4** (effort varies, P1) — Extend power-up system; EQ-2 is DONE so this is unblocked
5. **I-3 follow-up** (quick) — "New questions available!" toast when `qb_version` changes between loads (not yet a BACKLOG item; should be filed as I-5 or similar)

## Technical notes for next run

### G-7 endless mode details
- `tdEndlessNextBatch()` appends 3 waves via `generateWaves(mult, 3, rng)` to `td.levelDef.waveDefs`; seed = `(mapId+1)*31337 + (batchIdx+1)*99991`
- Enemy mult = `levelDef.enemyMult * 1.18^endlessWave` (18% escalation per batch)
- Every 3rd batch (indices 2, 5, 8…) also appends a bonus boss wave
- `tdEnterEndless()` resets `td.won = false`, rebuilds actDiv with fresh button refs, re-binds event listeners
- Wave dots hidden in endless; HUD shows "⚡ Endless · Wave N" / "⚡ Wave clear! K kills"
- Game-over in endless: kill + batch score displayed; no retry button (back to map only)

### S-2 question-logic module
- Clear `QUESTION LOGIC MODULE` header at top of drill.js (line ~192)
- `shuffle`, `seededShuffle`, `buildDrillQueue`, `markDrillSeen`, `resetDrillSeen` moved into that section
- Old `// ── Helpers ──` and `// ── Drill queue ──` section stubs removed
- All `// ── Question mastery tracking ──`, `// ── Part accuracy ──`, `// ── Daily challenge ──` subsections remain in place with their existing headers

### S-6 TD config section
- `TD GAME CONFIG` double-line header before `TD_TOWER_DEFS`; sub-headers for tower defs, enemy defs, shop items, power-up defs
- `TD CONTENT DATA` double-line header before `TD_SPRITES`
- `TD_SHOP_ITEMS` and `TD_POWER_UPS` moved from ~line 2703 to immediately after `TD_ENEMY_DEFS`

### G-8 difficulty modifier toggles
- Three chips on level confirm panel (`showLevelConfirmPanel`): ☠️ Ironman, 🚫 No Gold, 💨 Speed+
- Modifiers stored in `levelDef.modifiers` before launching battle (set by panel Play handler)
- `tdMakeState` reads `levelDef.modifiers`:
  - `noGold` → `initialGold = 0`
  - `speedPlus` → `powerUpMods.enemySpeedMult = 1.25`
  - `ironman` → stored in `td.modifiers.ironman`
- `tdSpawnEnemy` doubles `lifeLoss` when `td.modifiers.ironman`
- `tdVictory` adds `modCount * 15` to goldReward; toast shows `🔥×N` badge
- CSS: `.tdcp-modifiers`, `.tdcp-mod-btn`, `.tdcp-mod-btn.active` (gold border when active)

### EQ-2 power-up system (from previous session, now shipping)
- `TD_POWER_UPS` constant defines 5 power-ups: gold_rush, rapid_fire, pathsalt, fortify, scavenger
- `tdRecomputePowerUpMods()` regenerates net multipliers from `td.activePowerUps`
- `tdClearWavePowerUps()` strips scope:'wave' power-ups after each wave clears
- Pre-wave tray (#td-powerup-tray) renders chips; clicking activates and applies gold-now immediately
- `td.powerUpMods` tracks {towerRateMult, enemySpeedMult, killGoldMult}

### V-23 node shapes (from previous session, now shipping)
- `nodeShape(type, nodeId, cx, cy, r, fill, stroke, sw, extraAttrs)` helper inside `renderRunMap`
- boss → diamond `<path>`, shop → hexagon `<polygon>`, event → 8-pointed star `<polygon>`, battle/elite → pentagon `<polygon>`, rest/default → `<circle>`

### Backlog status summary (as of end of session)
DONE items: V-13, V-16, V-17, V-18, V-19, V-21, V-22, V-23, V-25, V-29, V-30, V-31, V-32, V-26, V-27, V-28, C-3, C-4, P-2, P-8, U-2, U-5, U-6, U-7, U-8, U-9, U-10, U-11, G-1, G-7, G-8, S-1, S-2, S-5, S-6, S-8, S-9, EQ-1, EQ-2, I-1, I-3, I-4, T-1, T-2, T-3, T-4, U-1

TODO (highest value unblocked):
- S-7 (25 pts, P2) — Split drill.css
- V-15 (25 pts, P2) — Landmark anchor objects
- V-24 (30 pts, P2) — Run-map parchment background
- S-3 (40 pts, P1) — Extract tower-defense engine block
- EQ-4 (45 pts, P1) — Relic system
