# Game Design & Technical Backlog

This is the single source of truth for all game improvement work — both structural/technical-debt items and game design features. The nightly agent picks the **highest-priority, lowest-effort** item with no unresolved dependencies.

---

## Priority Key

| Tier | Description |
|------|-------------|
| P0   | Critical — blocks meaningful play or retention, or causes data loss/crashes |
| P1   | High — significantly improves experience or maintainability |
| P2   | Medium — polish, depth, or debt reduction |
| P3   | Low — nice-to-have, schedule opportunistically |

---

## S — Structure & Modularization

Addresses the core finding from the 2026-06-25 repo audit: `drill.js` is a 3,448-line monolith with 126+ functions and zero module boundaries.

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| S-2 | Extract question-logic module | 20 | P1 | TODO | S-1 | Pull shuffle, filter, accuracy tracking, and session-queue logic out of drill.js into a self-contained section or file. Reduces coupling to game loop. |
| S-3 | Extract tower-defense engine block | 40 | P1 | TODO | — | Move enemy AI, tower targeting, projectile physics, and wave-spawn logic into a clearly delimited section of drill.js (or separate file if bundler added). Give it a clean `TDGame` interface. |
| S-4 | Extract canvas render block | 30 | P1 | TODO | S-3 | Move all `tdRender` sub-functions (sprites, terrain, HUD, particles) into a renderer section. Separate draw logic from game-state mutation. |
| S-6 | Data-drive TD level/tower/enemy config | 18 | P2 | TODO | — | Move `TD_LEVEL_DEFS`, tower cost/stat tables, and enemy stat tables out of drill.js into a config block or JSON file. Makes tuning accessible without touching game logic. |
| S-7 | Split drill.css into logical layers | 25 | P2 | TODO | — | Reorganize into clearly labelled sections: variables/reset, layout, components (cards, buttons, HUD), screens (home, world-map, game, study), animations. Currently 2,016 lines mixed together. |
| S-10 | TypeScript migration (stretch goal) | 80 | P3 | TODO | S-1,S-2,S-3,S-4 | Adds compile-time safety for game state and question objects. Only worthwhile after modules are extracted. Optional — assess after S-1 through S-4 are done. |

---

## I — Infrastructure & Persistence

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| I-2 | Cloud sync via GitHub Gist | 35 | P1 | TODO | I-1 | Serialize save to a private Gist keyed by user email. Requires OAuth scope gist. |
| I-3 | Offline question-bank versioning | 18 | P1 | DONE | SW | Embed a `qb_version` field in question-bank.json; SW compares and refreshes only on version bump. |
| I-5 | Account system (Supabase / Clerk) | 90 | P3 | TODO | I-2 | Full auth + cloud DB. Enables leaderboards, cross-device sync. High effort, needs infra decision. |

---

## V — Visual & Animation

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| V-13 | Animated data-flow indicators on path | 15 | P2 | DONE | V-12 | Small glowing dots drift along path direction at ~1 cell/s, 30% opacity. Reinforces "data moving through a pipeline" narrative. Computed from waypoint direction vectors in tdRender. |
| V-14 | DE-themed map palettes (6 themes tied to guide topics) | 35 | P1 | SUPERSEDED | — | Superseded by V-26 (three-act theme data) + V-31 (sprite render loop). Original spec called for 6 palette-only themes; replaced by verdant/decay/void with actual sprite sheet assets. |
| V-15 | Landmark anchor objects (entry portal, mid-structure, exit gate) | 25 | P2 | TODO | V-12 | 2×2 multi-cell canvas sprites at map start, midpoint, and exit. Watchtower at entry, castle gate at exit; theme-specific mid landmark (e.g. server rack for warehouse, cauldron for swamp). Drawn in tdRender before towers. |
| V-16 | Level-gated tower sprite evolution (L1/L2/L3 distinct look) | 25 | P1 | DONE | — | L1 = wood/basic, L2 = stone/reinforced, L3 = enchanted/glowing. New pixel-art frame sets per upgrade tier rather than just a ring color change. The tower visually transforms on upgrade. |
| V-17 | Tower idle animation (barrel rotation / turret pulse) | 15 | P2 | DONE | V-16 | Slow sin-wave rotation on tower top or breathing scale effect between shots. Adds life to the board without impacting perf — angle stored per-tower, updated in tdUpdate. |
| V-18 | Directional muzzle flash toward last target | 12 | P2 | DONE | V-1 | Short line segment from tower center toward last-fired target position, visible for ~60 ms. Replaces omnidirectional fire-pulse ring with a directional cue. Store `t.lastTargetAngle` in tdFireTowers. |
| V-19 | Type-specific enemy death animations | 25 | P2 | DONE | V-3 | Goblins scatter gold coins (spinning quads), orcs leave a brief smoke puff, scouts streak off-screen, trolls crumble (slow expanding ring). Boss gets a shockwave + screen-filling flash. Replace uniform particle burst. |
| V-20 | Enemy status effect visuals (freeze / burn / stun) | 15 | P2 | TODO | G-2 | Overlay sprites on enemies with active status: freeze = blue crystal ring, burn = orange ember orbit, stun = yellow stars. Required visual layer for G-2 special enemy types. |
| V-21 | Run-map: perturbed node positions + bezier connectors | 20 | P2 | DONE | — | Each tier's nodes get small random x/y offsets (seeded per run so layout is stable on re-open). Connectors become quadratic bezier curves using the midpoint as control. Breaks the perfect-column flowchart look. |
| V-22 | Run-map: traveled / untraveled path distinction | 10 | P2 | DONE | V-21 | Two-pass connector draw: thick desaturated line for future paths, thinner bright line for already-visited segments. Adds journey history at a glance. |
| V-23 | Run-map: themed node shapes per type | 20 | P2 | TODO | V-21 | Replace generic circles: battle nodes → shield pentagon, quiz nodes → scroll silhouette, shop → coin hex, boss → skull diamond, event → star burst. Drawn with Path2D; player can scan the map without reading emoji. |
| V-24 | Run-map background: parchment + gothic/steampunk overlay | 30 | P2 | TODO | — | Warm sepia/tan base drawn with noise pass (many small semi-transparent quads). Ink-stain vignette at edges. One or two procedural decorations (gear, compass rose, or crossed-swords) in corner cells. Connectors become ink-line strokes. Theme: adventure map parchment with medieval/steampunk details — matches the goblin/orc enemy aesthetic without requiring any image assets. |
| V-25 | Run-map fog of war on unreachable nodes | 15 | P2 | DONE | V-21 | Nodes and connectors beyond any reachable path are drawn at 25% opacity with a desaturated palette. Revealed when the player's active path reaches the preceding node. Adds tension and makes earned progress feel visible. |
| V-29 | Sprite sheet asset loader (manifest + Image cache) | 25 | P1 | DONE | V-26 | At level start, read `learn/drill/assets/map/manifest.json`, resolve the two sheets for the active theme (`deco-{theme}-1.png`, `deco-{theme}-2.png`), and preload them via `new Image()` into `td.spriteSheets[key]`. Slice formula: `ctx.drawImage(sheet, col*256, row*256, 256, 256, dx, dy, renderSize, renderSize)`. Manifest already committed to branch. |
| V-30 | Manifest-driven terrainDeco generation | 40 | P2 | DONE | V-29 | Replace the grass/pebble seed loop in `initTDGame` (~line 3697) with a manifest-driven placement pass. Seeded RNG: `let s=(mapId*2654435761)>>>0`. Pick sprites by `themeName`; honour placement rules — `anywhere` (any open cell), `path-adjacent` (within 1 cell of path), `open` (requires clear radius). Target 35–40% of non-path cells. Each entry in `td.terrainDeco`: `{sheetKey, spriteIdx, col, row, fx, fy, phase, size}`. |
| V-31 | Sprite drawImage render loop (replace parallax grass) | 30 | P2 | DONE | V-29, V-30, V-28 | In `tdRender()`, replace the parallax grass/pebble loop with a `drawImage` loop over `td.terrainDeco`. Call `applyDecoAnimation(ctx, spriteDef, d.phase, bgT)` where `spriteDef.animate` is set, wrapped in `ctx.save()`/`ctx.restore()`. Render scale per size field: `large=0.85`, `medium=0.60`, `small=0.35` of `cellSize`. Also remove the old `levelDef.deco` / `tdDrawSprite` block (~lines 4593–4602). |
| V-32 | sw.js ASSETS — add 6 deco PNG paths + manifest | 3 | P1 | DONE | V-31 | Add `'./assets/map/manifest.json'` and all six `'./assets/map/deco-{theme}-{N}.png'` paths to the `ASSETS` array in `sw.js`. Cache version already bumped to v48 for Tasks 1/5/6; bump again to v49 for this commit. |
| V-33 | Decommission dungeon mode | 65 | P3 | TODO | — | Remove all dungeon-mode screens, level defs, CSS, and DOM injection (`showDungeonScreen`, dungeon `TD_LEVEL_DEFS` entries, related buttons). Keep TD battle map, world map, and run-map intact. Work on a separate branch: `chore/decom-dungeon-mode`. |

---

## G — Gameplay Depth

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| G-2 | Enemy special types (fast/armored/flying/healer) | 42 | P1 | TODO | G-1 | Armored: halved splash dmg. Flying: ignores certain towers. Healer: restores nearby HP. |
| G-3 | Tower special abilities (active skills, cooldowns) | 50 | P2 | TODO | — | E.g. Arcane: AoE freeze 5 s (cooldown 30 s) triggered by tap. Requires ability UI. |
| G-4 | Power-up cards (superseded by EQ-2/EQ-3 — see EQ section) | 38 | P2 | TODO | G-3 | Original spec: draw 2 cards at level start. Full design in EQ-2/EQ-3; scope expanded to wave/node dual-mode with store purchasing. |
| G-5 | Relic passive system (superseded by EQ-4/EQ-5 — see EQ section) | 55 | P2 | TODO | EQ-1 | Original spec: permanent relics earned post-level. Full design in EQ-4/EQ-5 with category exclusivity, upkeep costs, and rarity tiers. |
| G-6 | Wave editor / sandbox mode | 28 | P3 | TODO | — | Dev/debug mode to test enemy combos and tower loadouts without question gating. |
| G-7 | Endless mode (procedural waves beyond wave 5) | 30 | P2 | TODO | — | After final wave, spawn escalating procedural waves until lives = 0; score leaderboard. |
| G-8 | Difficulty modifier toggles (Ironman, No-Gold, Speed+) | 20 | P2 | TODO | — | Toggles on level select that multiply star rewards if enabled. |

---

## EQ — Economy, Equipment & Items

A cohesive system covering gold carry-over between nodes, power-ups (short-lived consumables bought at store), and relics (permanent passives earned on map completion). All items are foundational to meaningful run-to-run strategy; implement in dependency order EQ-1 → EQ-2/EQ-4 → EQ-3/EQ-5/EQ-6/EQ-7 → EQ-8.

| ID   | Title | Effort | Priority | Status | Dependencies | Notes |
|------|-------|--------|----------|--------|--------------|-------|
| EQ-1 | Gold economy reform (carry-over, per-kill, per-wave) | 20 | P1 | DONE | — | Three changes: (1) Remaining gold carries into next node — finish node with 5g → next node starts at `nodeStartGold + 5`. `nodeStartGold` = cost of 2 basic towers (≈120g). (2) Kill gold is already dynamic in `TD_ENEMY_DEFS` (`reward` field); wire it to spendable in-battle gold, not just meta gold. (3) Wave-clear gold = static flat bonus (e.g. +15g) separate from the per-victory meta reward. Boss kill counts as 1 wave-clear bonus + its `reward`. |
| EQ-2 | Power-up system — data model, scope, pre-wave tray | 35 | P1 | TODO | EQ-1 | Power-up schema: `{ id, name, icon, cost, scope:'wave'\|'node', effect:{type, value}, uses:1 }`. Max 3 power-ups in player inventory at any time; duplicates allowed. Pre-wave activation tray: row of power-up buttons shown between wave-clear and "Start Wave". Activating applies effect immediately; `scope:'wave'` clears on wave end, `scope:'node'` clears on node end. Serialize in run autosave. |
| EQ-3 | Power-up content list (12 power-ups, costs 40–100g) | 25 | P2 | TODO | EQ-2 | Defined power-ups (scope / effect / cost): Gold Rush (wave / +50g now / 40g), Rapid Fire (wave / towers +30% rate / 50g), Eagle Shot (wave / towers +20% range / 45g), Pathsalt (wave / enemies −25% speed / 80g), Iron Skin (wave / lives can't drop below current−1 this wave / 70g), Scavenger (node / kill gold ×1.5 / 70g), Fortify (node / +3 lives / 80g), Adrenaline (node / wave-clear gold ×2 / 90g), Cheap Labour (node / tower costs −20% / 85g), Recall (node / one tower refunded 100% / 60g), Scout Report (node / next wave composition revealed 10 s early / 30g), Overclock (wave / towers fire 2× but lose 1 life on wave end / 55g). |
| EQ-4 | Relic system — data model, category exclusivity, upkeep, equip menu | 45 | P1 | TODO | EQ-1 | Relic schema: `{ id, name, icon, category, description, rarity:'common'\|'uncommon'\|'rare'\|'legendary', upkeep:goldPerNode, effect }`. **Category exclusivity**: only one relic per category may be equipped (enforced on equip — old one dropped automatically). Prevents infinite stacking (e.g. two gold-multiplier relics). Upkeep is deducted from `nodeStartGold` at the START of each node; shown clearly in equip screen. Unlimited relics in collection; equip menu is scrollable with category badges. Relic effects computed in `tdMakeState` and injected into `levelDef` or tower/enemy stat multipliers. Serialize in player meta-save (persists across runs). |
| EQ-5 | Relic content list (16 relics across 8 categories, tiered rarity) | 30 | P2 | TODO | EQ-4 | Relics by category (upkeep / rarity): **gold**: Midas Touch (+25% kill gold / 10g/node / uncommon); **wave-gold**: Warlord's Tithe (+20g per wave clear / 8g/node / common); **start-gold**: Merchant's Purse (+60 node start gold / 0 / common); **damage**: Runed Blade (towers +15% dmg / 12g/node / uncommon); **range**: Eagle Eye (towers +1 range cell / 10g/node / uncommon); **lives**: Iron Constitution (+5 max lives per node / 15g/node / rare); **tower-cost**: Master Builder (tower costs −15% / 10g/node / uncommon); **boss**: Dragonslayer (boss HP −30% / 20g/node / legendary); **carry-gold**: Overflowing Coffers (carry 150% of leftover gold, not 100% / 0 / rare); **sell**: Recycler (tower sell returns 80% instead of 60% / 0 / uncommon); **wave-lives**: Guardian Pact (no life lost if first enemy leaks each wave / 18g/node / rare); **spawn-delay**: Trapper's Patience (+1 s before first enemy spawns each wave / 5g/node / common); **kill-combo**: Berserker's Chain (each kill in 3 s window gives +1g bonus, stacking / 12g/node / rare); **tower-upgrade**: Artificer's Guild (upgrade cost −20% / 10g/node / uncommon); **quiz**: Scholar's Ring (quiz gold reward +15g / 0 / common); **all-towers**: Warcry (all towers +10% dmg AND +10% range / 25g/node / legendary). |
| EQ-6 | Store node — 3 power-ups + 1 relic, rarity weighting | 30 | P1 | TODO | EQ-2, EQ-4 | New run-map node type `'shop'`. Shop appears after every 3rd battle node approximately. Shop screen: 4 cards — 3 power-ups (random, priced at `powerUp.cost`) and 1 relic (random, priced by rarity: common 120g, uncommon 180g, rare 250g, legendary 400g). Rarity weight for store relic: common 40%, uncommon 35%, rare 20%, legendary 5%. If power-up inventory is full (3/3) the 3 power-up slots show "Inventory Full" and are untappable. "Skip" exits without buying. Purchased items deducted from carry-over gold immediately. Relic offered is removed from loot pool for the rest of that run once purchased (one-of-a-kind). |
| EQ-7 | Inventory & equip UI (power-up tray, relic panel, pre-map screen) | 35 | P1 | TODO | EQ-2, EQ-4 | Three surfaces: (1) **Pre-wave power-up tray** — row of up-to-3 power-up chips shown between wave-clear and "Start Wave" button; tap to activate, chip greys out and shows scope tag. (2) **Inventory panel** — accessible via 🎒 button on run map; shows power-up slots (3 max, with name/icon/scope/uses) and relic list (scrollable, shows category tag + upkeep/node). (3) **Pre-map equip screen** — shown when starting a new map during a run; shows currently equipped relics with swap option; also shown immediately when relic is earned or purchased so player can decide. Max one relic per category enforced here with clear conflict UI ("Replace [existing] or skip?"). |
| EQ-8 | Post-map relic earn flow (win screen → equip-1 gate) | 20 | P2 | TODO | EQ-4, EQ-7 | On full map completion, victory screen gains a "Claim Relic" step: game selects 3 relic options weighted by rarity (rare/legendary more likely on harder maps); player picks 1. Selection goes to collection immediately. If the earned relic conflicts with an equipped one, the equip-conflict UI (from EQ-7) fires. Relic goes to owned collection even if not equipped. |

---

## P — Progression & Meta-Loop

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| P-1 | Skill tree / upgrade meta-progression | 60 | P1 | TODO | — | Persistent tree (unlocked with XP): unlock new tower types, start-gold bonuses, extra lives. |
| P-2 | XP → level-up tied to quiz correctness | 22 | P1 | DONE | — | Bonus XP for correct answers; correct-streak multiplier. Feeds P-1 tree. |
| P-3 | Spaced repetition tracker (SM-2 per question) | 65 | P2 | TODO | I-1 | Per-question interval/ease stored in localStorage. Drill mode surfaces due cards. |
| P-4 | Daily challenge level (new layout every 24 h) | 45 | P2 | TODO | I-1 | Seeded-random layout from `Date.toDateString()`. Bonus XP for first clear. |
| P-5 | Run-based roguelite structure (Act I → II → III draft) | 70 | P2 | TODO | G-4, P-1 | Each "run" drafts 3 towers, 1 relic from random offerings. Permadeath = restart run, keep XP. |
| P-6 | Leaderboards (daily / all-time score) | 80 | P3 | TODO | I-5 | Requires backend. Could use GitHub Gist as poor-man's leaderboard for small audience. |
| P-7 | Achievement system (first 3★, 10-win streak, etc.) | 35 | P2 | TODO | I-1 | Badge unlocks stored locally; displayed in profile panel. |
| P-8 | Question mastery tracking ("mastered" vs "learning") | 30 | P1 | DONE | I-1 | Per-question correct-count threshold; mastered Qs retire from pool or appear less often. |

---

## C — Content & Questions

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| C-1 | Expand question bank to 300+ questions | 50 | P0 | ONGOING | — | Handled exclusively by QUESTION_GENERATION_PROMPT.md sessions — skip in game improvement runs. Current bank: 200 questions (as of 2026-06-27); target: 300+. |
| C-2 | Question editor UI (add/edit/delete in-app) | 40 | P2 | TODO | I-1 | Modal form to add custom questions; stores to localStorage override list. |
| C-3 | Question categories / tags visible in quiz overlay | 15 | P2 | DONE | — | Show topic tag (e.g. "Spark", "Kafka") on quiz card for context. |
| C-5 | Question difficulty auto-calibration (ELO-style) | 55 | P3 | TODO | P-3 | Track per-question success rate; reclassify easy/medium/hard dynamically. |
| C-6 | Add scenario/case-study question type | 25 | P2 | TODO | C-1 | Multi-sentence scenario followed by 4 options. Requires new `type: "scenario"` in schema and a wider card render. More realistic to real-world DE decision-making. |
| C-7 | Review and update stale questions | 10 | P2 | TODO | — | Audit questions for outdated services or API versions. Run annually. |

---

## UX — User Experience & Accessibility

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| U-2 | Touch target size audit (≥48 px tap zones) | 10 | P1 | DONE | — | Canvas tap and HUD buttons need minimum 48 px hit areas for mobile. |
| U-3 | Keyboard / gamepad support | 40 | P3 | TODO | — | Arrow keys to navigate world map; 1–4 to select towers; Space to start wave. |
| U-4 | Color-blind mode (shape indicators alongside color) | 20 | P2 | TODO | — | Overlay pattern fill (diagonal lines, dots) on towers so color isn't sole differentiator. |
| U-5 | Reduced-motion respect (`prefers-reduced-motion`) | 8 | P2 | DONE | — | Disable CSS animations and canvas particle effects if system preference is set. |

---

## Completed Items

| ID  | Title | Effort | Completed |
|-----|-------|--------|-----------|
| —   | 9-level TD with tower upgrades | — | 2026-06-25 |
| —   | Question difficulty auto-rating (T/F → easy, MC length heuristic) | — | 2026-06-25 |
| —   | Star rating system (3★/2★/1★) persisted to localStorage | — | 2026-06-25 |
| —   | Star-gated level locking | — | 2026-06-25 |
| —   | Optional quiz cap (3 questions per wave) | — | 2026-06-25 |
| —   | Service worker cache-busting (de-drill-v10) | — | 2026-06-25 |
| —   | Repo structure audit | — | 2026-06-25 |
| V-2 | Animated SVG world map | 22 | 2026-06-25 |
| T-1 | Web Audio sound layer | 30 | 2026-06-25 |
| V-8 | Floating damage numbers | 14 | 2026-06-25 |
| V-9 | Screen shake on life lost | 8 | 2026-06-25 |
| V-4 | Tower placement ghost with colour feedback | 20 | 2026-06-25 |
| V-5 | HUD lives bar + wave dot indicators | 15 | 2026-06-25 |
| V-6 | Animated star victory screen | 18 | 2026-06-25 |
| V-10 | Dark/light canvas theme palette | 12 | 2026-06-25 |
| V-1 | Tower fire pulse + enemy hit flash + projectile trail | 28 | 2026-06-25 |
| V-3 | Enemy emoji variety + enhanced death burst | 32 | 2026-06-25 |
| V-7 | Parallax terrain: animated grass + pebbles + vignette | 45 | 2026-06-25 |
| V-11 | Stylized non-path terrain (8 sprite types, 9 hand-crafted maps) | 35 | 2026-06-25 |
| V-12 | Path tile border stitching (cobblestone road rendering) | 20 | 2026-06-25 |
| U-9 | Wave preview card ("Incoming: 6 Goblins + 1 Troll") | 10 | 2026-06-25 |
| I-4 | Auto-save every 30 s + resume prompt on re-enter | 10 | 2026-06-26 |
| I-1 | Save export / import (JSON blob download + file-picker restore) | 12 | 2026-06-26 |
| C-4 | Explanation / hint on wrong answer | 18 | 2026-06-26 |
| U-6 | Pause / resume mid-wave | 18 | 2026-06-26 |
| U-7 | Tower placement confirmation chip | 12 | 2026-06-26 |
| U-8 | Free sell for pre-wave placements | 15 | 2026-06-26 |
| G-1 | Boss enemies (every 3rd wave, pulsing ring, 💀 skull, +3 lives on leak) | 35 | 2026-06-26 |
| S-1 | Extract storage layer (StorageManager wrapping 39 localStorage calls) | 15 | 2026-06-26 |
| S-5 | Cache DOM refs in EL object (bindUI + initTDGame; 38 hot-path lookups eliminated) | 8 | 2026-06-26 |
| S-8 | Error handling at system boundaries (res.ok check + try/catch) | 10 | 2026-06-26 |
| S-9 | validateQuestionBank(): schema check on load, warns + skips malformed entries | 12 | 2026-06-26 |
| T-2 | Background chiptune music (C minor pentatonic, 8-step lookahead scheduler) | 55 | 2026-06-27 |
| T-3 | Spatial audio: StereoPannerNode on shoot/hit/death/place keyed to x-position | 22 | 2026-06-27 |
| T-4 | Adaptive music: 3 intensity layers (melody→+harmony→+percussion) by enemy count | 40 | 2026-06-27 |
| U-1 | Tutorial / first-run walkthrough (3-step modal, localStorage-gated) | 25 | 2026-06-27 |
| U-10 | Tap-to-inspect tower stats card (floating card, dismisses on tap elsewhere) | 15 | 2026-06-27 |
| U-11 | Gold floaters on enemy kill (+Ng🪙 float via damageNumbers label field) | 8 | 2026-06-27 |
| EQ-1 | Gold economy reform (carry-over +15g wave-clear bonus, gold carry between nodes) | 20 | 2026-06-28 |
| V-26 | Update TD_MAPS three-act structure (decay/void names, icons, colors, bgZones, themeName) | 8 | 2026-06-28 |
| V-27 | Canvas-math deco animation system (`applyDecoAnimation` + `TD_THEME_CELLS` palette table) | 18 | 2026-06-28 |
| V-28 | Per-cell themed background fills + remove grid lines | 10 | 2026-06-28 |
| V-29 | Sprite sheet asset loader (manifest + Image cache) | 25 | 2026-06-29 |
| V-30 | Manifest-driven terrainDeco generation | 40 | 2026-06-29 |
| V-31 | Sprite drawImage render loop (replace parallax grass) | 30 | 2026-06-29 |
| V-32 | sw.js ASSETS — add 6 deco PNG paths + manifest | 3 | 2026-06-29 |
| V-13 | Animated data-flow indicators on path | 15 | 2026-06-29 |
| V-18 | Directional muzzle flash toward last target | 12 | 2026-06-29 |
| U-5  | Reduced-motion respect (prefers-reduced-motion) | 8 | 2026-06-29 |
| C-3  | Question topic tag in TD quiz overlay | 15 | 2026-06-29 |
| P-2  | XP shown in quiz feedback + streak multiplier tag | 22 | 2026-06-29 |
| P-8  | Question mastery tracking (3 correct = mastered, deprioritised) | 30 | 2026-06-29 |
| V-16 | Level-gated tower sprite evolution (already implemented via pals[lvl]) | 25 | 2026-06-29 |
| V-21 | Run-map: perturbed node positions + bezier connectors | 20 | 2026-06-29 |

---

## GitHub Pages Feasibility Notes

All items in this backlog are compatible with a static GitHub Pages deployment (no server, no bundler). Specific notes:

- **V-13 through V-25, U-9 through U-11**: Pure Canvas 2D API + CSS. No external assets or server calls required.
- **V-14 (themed palettes)**: Palette objects are inline JS — no image files needed.
- **V-15 (landmark sprites)**: Inline pixel-art arrays like the existing `TD_SPRITES` entries. No uploads.
- **P-6 (leaderboards)**: Only item requiring a backend. GitHub Gist API workaround exists but needs OAuth — flag before implementing.
- **I-2 (cloud sync)**: Also requires GitHub OAuth — flag before implementing.
- **Diagonal path geometry** (not yet filed): Would require changes to `tdComputePathSet` and `tdMoveEnemy`, which currently only handle axis-aligned segments. Medium complexity — file as a separate item when ready.

---

*Last updated: 2026-06-28. Single source of truth. Picking order: filter `Status = TODO`, sort by Priority then Effort ascending, take the first item whose dependencies are all `DONE` or `—`. V-27 (`applyDecoAnimation`) and V-28 (per-cell background) are prerequisites for V-31.*
