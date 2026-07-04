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
| S-2 | Extract question-logic module | 20 | P1 | DONE | S-1 | Pull shuffle, filter, accuracy tracking, and session-queue logic out of drill.js into a self-contained section or file. Reduces coupling to game loop. |
| S-3 | Extract tower-defense engine block | 40 | P1 | DONE | — | Move enemy AI, tower targeting, projectile physics, and wave-spawn logic into a clearly delimited section of drill.js (or separate file if bundler added). Give it a clean `TDGame` interface. |
| S-4 | Extract canvas render block | 30 | P1 | DONE | S-3 | Move all `tdRender` sub-functions (sprites, terrain, HUD, particles) into a renderer section. Separate draw logic from game-state mutation. |
| S-6 | Data-drive TD level/tower/enemy config | 18 | P2 | DONE | — | Move `TD_LEVEL_DEFS`, tower cost/stat tables, and enemy stat tables out of drill.js into a config block or JSON file. Makes tuning accessible without touching game logic. |
| S-7 | Split drill.css into logical layers | 25 | P2 | DONE | — | Reorganize into clearly labelled sections: variables/reset, layout, components (cards, buttons, HUD), screens (home, world-map, game, study), animations. Currently 2,016 lines mixed together. |
| S-10 | TypeScript migration (stretch goal) | 80 | P3 | TODO | S-1,S-2,S-3,S-4 | Adds compile-time safety for game state and question objects. Only worthwhile after modules are extracted. Optional — assess after S-1 through S-4 are done. |

---

## I — Infrastructure & Persistence

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| I-2 | Cloud sync via GitHub Gist | 35 | P1 | TODO | I-1 | Serialize save to a private Gist keyed by user email. Requires OAuth scope gist. |
| I-3 | Offline question-bank versioning | 18 | P1 | DONE | SW | Embed a `qb_version` field in question-bank.json; SW compares and refreshes only on version bump. |
| I-5 | Account system (Supabase / Clerk) | 90 | P3 | TODO | I-2 | Full auth + cloud DB. Enables leaderboards, cross-device sync. High effort, needs infra decision. |
| I-6 | Stale baked-in `node.levelDef` on persisted runs | 8 | P1 | DONE | — | A run's node array (including each node's `levelDef`) is generated once and persisted via `tdSaveRun`/localStorage; a run created before a `levelDef`-shaping change (e.g. V-36's `slotFacing`) replayed that node with a permanently stale object forever, since nothing ever refreshed an already-baked `node.levelDef`. Manifested as the tower-facing feature working in every fresh test but never for an existing player's in-progress run. Fixed for the `start` node (`tdFreshLevelDefFor` in `drill.js`, regenerates `frontierTownLevelDef()` fresh at play-time instead of trusting the persisted snapshot — safe since its waves already reseed from `Date.now()` on every call, no continuity to lose). Other battle/elite nodes still use their baked-in `levelDef` from `generateBattleLevel`, which is fine today since nothing added a comparable new field there yet — but the same class of bug would recur if one ever does; worth applying the same "regenerate, don't trust the persisted snapshot" pattern there too if/when that changes. |

---

## V — Visual & Animation

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| V-13 | Animated data-flow indicators on path | 15 | P2 | DONE | V-12 | Small glowing dots drift along path direction at ~1 cell/s, 30% opacity. Reinforces "data moving through a pipeline" narrative. Computed from waypoint direction vectors in tdRender. |
| V-14 | DE-themed map palettes (6 themes tied to guide topics) | 35 | P1 | SUPERSEDED | — | Superseded by V-26 (three-act theme data) + V-31 (sprite render loop). Original spec called for 6 palette-only themes; replaced by verdant/decay/void with actual sprite sheet assets. |
| V-15 | Landmark anchor objects (entry portal, mid-structure, exit gate) | 25 | P2 | DONE | V-12 | 2×2 multi-cell canvas sprites at map start, midpoint, and exit. Watchtower at entry, castle gate at exit; theme-specific mid landmark (e.g. server rack for warehouse, cauldron for swamp). Drawn in tdRender before towers. |
| V-16 | Level-gated tower sprite evolution (L1/L2/L3 distinct look) | 25 | P1 | DONE | — | L1 = wood/basic, L2 = stone/reinforced, L3 = enchanted/glowing. New pixel-art frame sets per upgrade tier rather than just a ring color change. The tower visually transforms on upgrade. |
| V-17 | Tower idle animation (barrel rotation / turret pulse) | 15 | P2 | DONE | V-16 | Slow sin-wave rotation on tower top or breathing scale effect between shots. Adds life to the board without impacting perf — angle stored per-tower, updated in tdUpdate. |
| V-18 | Directional muzzle flash toward last target | 12 | P2 | DONE | V-1 | Short line segment from tower center toward last-fired target position, visible for ~60 ms. Replaces omnidirectional fire-pulse ring with a directional cue. Store `t.lastTargetAngle` in tdFireTowers. |
| V-19 | Type-specific enemy death animations | 25 | P2 | DONE | V-3 | Goblins scatter gold coins (spinning quads), orcs leave a brief smoke puff, scouts streak off-screen, trolls crumble (slow expanding ring). Boss gets a shockwave + screen-filling flash. Replace uniform particle burst. |
| V-20 | Enemy status effect visuals (freeze / burn / stun) | 15→~40 (see note) | P2 | TODO | G-2 | Overlay sprites on enemies with active status: freeze = blue crystal ring, burn = orange ember orbit, stun = yellow stars. **2026-07-02 scoping note**: this item's premise is stale — G-2 shipped as raider(fast)/brute(armored)/wisp(flying)/shaman(healer), none of which involve freeze/burn/stun, and no tower currently applies any timed status effect to enemies (searched the full engine — no freeze/burn/stun/DoT/slow-with-duration mechanic exists anywhere; `pathsalt` is a global wave-scoped speed multiplier, not a per-enemy status). "Overlay sprites... visual layer" undersells the real work: there is no underlying status-effect system to skin. Before this can be a 15-pt visual task, a real status-effect engine needs to exist (per-enemy active-status array, duration countdown in tdUpdate, speed/damage modification, a tower or power-up that actually applies freeze/burn/stun). Re-scope as two items — a new "status-effect engine" item (~25-30 pts) + this visual layer (~15 pts) — or fold into a tower-special-abilities item (G-3 already covers "active skills" and could reasonably absorb a freeze/stun ability). Skipped this session per the >2× effort-overshoot guardrail — do not attempt as a standalone 15-pt item until re-scoped. |
| V-21 | Run-map: perturbed node positions + bezier connectors | 20 | P2 | DONE | — | Each tier's nodes get small random x/y offsets (seeded per run so layout is stable on re-open). Connectors become quadratic bezier curves using the midpoint as control. Breaks the perfect-column flowchart look. |
| V-22 | Run-map: traveled / untraveled path distinction | 10 | P2 | DONE | V-21 | Two-pass connector draw: thick desaturated line for future paths, thinner bright line for already-visited segments. Adds journey history at a glance. |
| V-23 | Run-map: themed node shapes per type | 20 | P2 | DONE | V-21 | Replace generic circles: battle nodes → shield pentagon, quiz nodes → scroll silhouette, shop → coin hex, boss → skull diamond, event → star burst. Drawn with Path2D; player can scan the map without reading emoji. |
| V-24 | Run-map background: parchment + gothic/steampunk overlay | 30 | P2 | SUPERSEDED | — | Superseded 2026-07-02 by W-1: the world map is now a full painted parchment-style map image (hero-quality Nano art, committed under `assets/worlds/verdant/`), which replaces any procedural parchment/noise canvas work. |
| V-25 | Run-map fog of war on unreachable nodes | 15 | P2 | DONE | V-21 | Nodes and connectors beyond any reachable path are drawn at 25% opacity with a desaturated palette. Revealed when the player's active path reaches the preceding node. Adds tension and makes earned progress feel visible. |
| V-29 | Sprite sheet asset loader (manifest + Image cache) | 25 | P1 | DONE | V-26 | At level start, read `learn/drill/assets/map/manifest.json`, resolve the two sheets for the active theme (`deco-{theme}-1.png`, `deco-{theme}-2.png`), and preload them via `new Image()` into `td.spriteSheets[key]`. Slice formula: `ctx.drawImage(sheet, col*256, row*256, 256, 256, dx, dy, renderSize, renderSize)`. Manifest already committed to branch. |
| V-30 | Manifest-driven terrainDeco generation | 40 | P2 | DONE | V-29 | Replace the grass/pebble seed loop in `initTDGame` (~line 3697) with a manifest-driven placement pass. Seeded RNG: `let s=(mapId*2654435761)>>>0`. Pick sprites by `themeName`; honour placement rules — `anywhere` (any open cell), `path-adjacent` (within 1 cell of path), `open` (requires clear radius). Target 35–40% of non-path cells. Each entry in `td.terrainDeco`: `{sheetKey, spriteIdx, col, row, fx, fy, phase, size}`. |
| V-31 | Sprite drawImage render loop (replace parallax grass) | 30 | P2 | DONE | V-29, V-30, V-28 | In `tdRender()`, replace the parallax grass/pebble loop with a `drawImage` loop over `td.terrainDeco`. Call `applyDecoAnimation(ctx, spriteDef, d.phase, bgT)` where `spriteDef.animate` is set, wrapped in `ctx.save()`/`ctx.restore()`. Render scale per size field: `large=0.85`, `medium=0.60`, `small=0.35` of `cellSize`. Also remove the old `levelDef.deco` / `tdDrawSprite` block (~lines 4593–4602). |
| V-32 | sw.js ASSETS — add 6 deco PNG paths + manifest | 3 | P1 | DONE | V-31 | Add `'./assets/map/manifest.json'` and all six `'./assets/map/deco-{theme}-{N}.png'` paths to the `ASSETS` array in `sw.js`. Cache version already bumped to v48 for Tasks 1/5/6; bump again to v49 for this commit. |
| V-33 | Decommission dungeon mode | 65 | P3 | TODO | — | Remove all dungeon-mode screens, level defs, CSS, and DOM injection (`showDungeonScreen`, dungeon `TD_LEVEL_DEFS` entries, related buttons). Keep TD battle map, world map, and run-map intact. Work on a separate branch: `chore/decom-dungeon-mode`. |
| V-34 | Deco sprite sheets missing alpha transparency (verdant/decay) | 8 | P1 | DONE | V-29 | All 6 `assets/map/deco-*.png` sheets were generated with alpha fully opaque (255) and a gray checkerboard baked into RGB instead of real transparency — every terrain deco rendered as a solid 256×256 tile. Fixed `deco-verdant-{1,2}.png` and `deco-decay-{1,2}.png` via `scripts/remove_checker_bg.py` (color-threshold keying + connected-component cleanup + edge feather). sw.js cache bumped to v79. |
| V-35 | Deco sprite sheets missing alpha transparency (void) | 15 | P1 | OBSOLETE | V-34 | **2026-07-02: obsolete — nothing left to fix.** All six `deco-*.png` pixel sprite sheets (void included) were deleted when the art direction pivoted to full painted backgrounds (see `ART_DIRECTION_HANDOFF.md` 2026-07-02 addendum); `manifest.json` sheets list is now empty and the battle map renders without per-cell deco pending G-9 painted backgrounds. |
| V-36 | Painted-pixel-art tower sprite sheets (match battle-map art style) | 45 | P1 | DONE (Ranger) | V-16 | Ranger shipped: 4 painted tiers (`ranger-tier{1-4}.png`) wired into `TD_TOWER_TIER_IMAGES`/`tdRenderTowers`, replacing the flat `TD_SPRITES.ranger` pixel frames. Code-side silhouette shadow (`tdRenderTowerShadow`, reuses each tier's own sprite via a `brightness(0)` canvas filter) grounds it in the scene instead of a baked-in art shadow. A second "back" facing sheet (`ranger-tier{1-4}-back.png`) plus code-side horizontal mirroring (`tdComputeSlotFacing`/`tdWithMirror`) makes towers orient toward the road automatically. See `TOWER_GENERATION_PROMPTS.md` for the full prompt book and process notes. Bastion and Mortar still on the old `TD_SPRITES` pixel-frame path — follow the same pipeline once prioritized. |

---

## G — Gameplay Depth

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| G-2 | Enemy special types (fast/armored/flying/healer) | 42 | P1 | DONE | G-1 | Armored: halved splash dmg. Flying: ignores certain towers. Healer: restores nearby HP. |
| G-3 | Tower special abilities (active skills, cooldowns) | 50 | P2 | TODO | — | E.g. Arcane: AoE freeze 5 s (cooldown 30 s) triggered by tap. Requires ability UI. |
| G-4 | Power-up cards (superseded by EQ-2/EQ-3 — see EQ section) | 38 | P2 | SUPERSEDED | — | **2026-07-02 alignment pass:** status corrected from TODO — EQ-2 (data model, DONE) and EQ-3 (content list) fully absorb this item; keeping it TODO risked the nightly picker duplicating shipped work. |
| G-5 | Relic passive system (superseded by EQ-4/EQ-5 — see EQ section) | 55 | P2 | SUPERSEDED | — | **2026-07-02 alignment pass:** status corrected from TODO — EQ-4 (relic system, DONE) and EQ-5 (content list) fully absorb this item; it was unblocked (dep EQ-1 DONE) and would have been auto-picked as a duplicate of shipped work. |
| G-6 | Wave editor / sandbox mode | 28 | P3 | TODO | — | Dev/debug mode to test enemy combos and tower loadouts without question gating. |
| G-7 | Endless mode (procedural waves beyond wave 5) | 30 | P2 | DONE | — | After final wave, spawn escalating procedural waves until lives = 0; score leaderboard. |
| G-8 | Difficulty modifier toggles (Ironman, No-Gold, Speed+) | 20 | P2 | DONE | — | Toggles on level select that multiply star rewards if enabled. |
| G-9 | Multi-path BATTLE-map topology + fixed build slots + landscape grid | 70 | P1 | TODO | — | **⚠️ Do not auto-implement — needs the user for art + lane-layout choices.** **2026-07-02 rescope:** the world-map/run-map half of this item is REMOVED — the world map pivoted to a single linear journey (see new W section); strategic route choice now lives here on the battle map, per the original Kingdom Rush inspiration. Remaining scope: (1) path data model generalized from one `wps` array to multiple named lanes with per-lane `pathSet`s (each enemy tagged with a lane index); (2) audit every single-path assumption — `tdMoveEnemy`, tower targeting/range, `tdGenerateTerrainDeco` (obsolete anyway, see (7)), wave spawn distribution across lanes; (3) new `buildSlots: [[col,row],...]` per level; placement validation switches from "any non-path cell" to "cell in slot list and unoccupied" — hand-placed scarce slots are what guarantees no single tower covers both lanes; (4) landscape grid ~16:9 — confirmed cheap (`td.cellSize` fit logic + all ~20 `TD_COLS`/`TD_ROWS` call sites already generic); (5) default lane design: two paths converging into one shared exit (classic TD); fully-separate-paths reserved as a rare bonus-map variant, one per world; (6) mobile orientation prompt, once per play session at the world-map/battle-map boundary (nothing exists today); (7) battle-map backgrounds become full painted scenes **themed to the world-map node landmark** — each spine node in `assets/worlds/verdant/region-preset.json` carries a `battleTheme` key (windmill-bridge, farmland, farmstead, ruins, pasture, apiary, crag-tower, stone-circle, timber-camp, lakeshore, moor-monolith, blighted-forest, keep-siege) and its battle map is generated to match, via the pipeline in `ART_DIRECTION_HANDOFF.md` (style-reference-anchored Nano generation) — the per-cell pixel deco sprite system was fully removed 2026-07-02/03 (deco sheets and manifest deleted; loader stubbed), so painted art replaces `terrainDeco` rather than coexisting with it. Fold the "diagonal path geometry" idea (Feasibility Notes) into this redesign of `tdComputePathSet`. |
| G-10 | Barracks/spawner tower — melee troops on the path | 55 | P2 | TODO | — | New tower archetype: instead of firing projectiles, periodically spawns 1-3 friendly melee units that walk onto the path and physically contest space with enemies (not projectile targeting — real collision/combat between two unit types that don't currently interact this way). Needs: (1) new friendly-unit AI — spawn, path-walk to an engagement point, melee-attack nearest enemy, take damage, die, respawn on cooldown; (2) decide whether troops fully block the path or act as a speed bump enemies push through after killing them; (3) upgrade tiers mirroring V-16 (more troops, better troop stats, faster respawn, possibly a stronger troop type at tier 3); (4) new sprite set — building + soldier unit with idle/walk/attack/death states, separate from both existing tower and enemy sprites. Ships fine with current pixel art; would pair naturally with whichever art-style work (V-34/V-35 follow-on) gets picked, but doesn't depend on it. |
| G-11 | Frontier Town bandit roster + Ranger multi-projectile L4 | 20 | P1 | DONE | — | Stats-only pass (no new sprites/animations yet — TD_SPRITES has no entry for these types so they render as plain colored circles + HP bars, same graceful fallback sprite-less enemy types already use). New `TD_ENEMY_DEFS` entries: `bandit` (maxHp 75, spd 1.5, reward 5 — foot-soldier fodder), `bandit_rider` (maxHp 55, spd 2.1, reward 8 — "a little quicker", traded HP for speed), `bandit_boss` (maxHp 350, spd 0.7, reward 60, isBoss, lifeLoss 2 — a real boss-scale HP jump over regular bandits but deliberately far below the generic `boss` def's 2000, since this is meant to read as "the hardest part of level 1", not a genuine wall). New `frontierTownWaves()` replaces the generic `generateWaves()` call for Frontier Town specifically — 3 clean waves (bandits only → bandits+riders → bandits+riders+1 boss) instead of the generic generator's up-to-8-enemy-types-by-wave-3 chaos, which doesn't suit a clean tutorial-level escalation. Every world map is meant to get its own themed roster + wave shape this way, not share one generic pool. Also added `projectiles` field to `TD_TOWER_DEFS.ranger` (1 on L1-L3, 2 on L4) — `tdFireTowers` now collects all in-range enemies sorted by path progress and fires one projectile per unit of `projectiles` at successive targets (falls back to re-targeting the same enemy if fewer are in range), so L4's 2nd projectile is a genuine "also hits another enemy" upgrade rather than a disguised damage multiplier; L4's per-projectile damage was reduced from 70 to 44 to match L3 exactly, per the intended upgrade philosophy (L1-3: same 1 projectile, more damage/speed each tier; L4: same damage as L3, +1 projectile). Fixed two latent bugs surfaced while wiring this in: the wave-preview boss-styling check and the boss-music-intensity check both hardcoded `type === 'boss'` instead of reading each type's `isBoss` flag from `TD_ENEMY_DEFS`, so neither would have triggered for `bandit_boss` (or any future differently-named boss type) without this fix. |

---

## W — World Map: Linear Journey & Risk Economy

**Design pivot decided with the user 2026-07-02.** The world map is a **single linear path** across painted hero-quality map art (art pipeline in `ART_DIRECTION_HANDOFF.md`); strategic *route* choice moved to multi-path battle maps (G-9). Player choice on the world map becomes **per-node stakes, not direction**: risk-takers compound rewards, safe play is slower-but-viable (never a death spiral — explicit guardrail). Core loop = W-2 + W-3; W-4/W-5 layer on; W-6 only if playtesting demands.

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| W-1 | Linear world-map spine on painted map art | 55 | P1 | TODO | — | **⚠️ Do not auto-implement — needs the user's chosen map + hand-placed node coordinates.** Replaces `generateRun`'s 3-lane graph and `RUN_NODE_POS` with a per-preset ordered node table: a spine of 12–16 nodes (≥8 battles, boss last) hand-placed along the painted trail of the chosen map image. Landscape SVG viewBox sized to the map image; node markers overlaid at runtime from the `assets/worlds/verdant/markers.png` catalog (node types still shuffle per run within the fixed spine); fog-of-war + mist-creep hooks reserved for W-3. **Map chosen and committed 2026-07-02: `assets/worlds/verdant/region.png`** (restructured path) — region-scale (3-4× zoomed out) serpentine single-road map, Wild Frontier style anchor, watermark removed. Additional presets per world remain the plan (3 per difficulty eventually). Note: the painted map contains faint background lanes and junctions by design (living-region layer); the canonical route is defined by the node spine + traveled-road brightening (V-22 pattern), not by the raw art. Shares the once-per-session landscape-orientation prompt with G-9 item (6). |
| W-2 | Battle engagement tiers (standard vs elite contract) | 30 | P1 | TODO | W-1 | Pre-battle stakes choice on every battle node: **Standard** (normal waves/questions/gold) or **Elite contract** (harder waves + harder question tier + constrained build slots → 2–3× gold, relic-drop chance, bonus XP). Reuses existing `diffWeights`/`getDiffInfo` tiers and EQ-4 relics as the premium reward. Elite stops being a random node type and becomes an opt-in mode on any battle — for a study app this aims the incentive at harder question material. **Pre-G-9 note:** the "constrained build slots" elite modifier requires G-9's build-slot system; until G-9 ships, elite contracts use the other constraint levers (harder waves, harder question tier, reduced start gold) — do not block W-2 on G-9. |
| W-3 | Corruption meter (pursuing-threat pacing system) | 40 | P1 | TODO | W-2 | FTL-rebel-fleet pattern wearing our lore: the Void spreads as the player lingers. Standard/safe choices tick corruption up; elite contracts and won wagers push it back. Corruption tiers apply visible modifiers to REMAINING nodes: +wave HP %, corrupted enemy variants, reduced node start gold, shop price inflation, boss modifiers. **Guardrail (explicit design decision):** corruption taxes reward velocity and boss difficulty but must stay recoverable — a strong late elite streak can push it back; safe play must remain viable, just slower/poorer. Visual: grey mist creeps along the painted trail from the keep end as the meter rises (runtime overlay, no new art). |
| W-4 | Performance wagers (gold stakes on battle outcomes) | 20 | P2 | TODO | W-2 | Optional pre-battle stake on a concrete outcome: zero leaks / quiz accuracy ≥ 80% / no tower sold. Win = 2× return (and reduces corruption once W-3 lands); lose = stake gone. Makes quiz accuracy — the study mechanic — the thing being bet on. |
| W-5 | Campfire dilemmas (heal OR forge OR fortune) | 25 | P2 | TODO | W-1 | Campfire nodes offer exactly ONE of: heal lives; forge (upgrade/reroll a relic or power-up); fortune-teller gamble (random strong boon or mild curse — the user's original "fortune read" idea). Walking away from two options is the point. Safe heal ticks corruption once W-3 exists; item stands alone without it. |
| W-6 | Spur detour nodes (optional side-excursions) | 25 | P3 | TODO | W-1 | **Deferred — do not build in v1.** 1-node cul-de-sac trails off the spine (the painted maps already show spur trails to watchtower/stone-circle landmarks) hosting hard optional fights/events. Only if playtesting shows the linear spine feels too passive. |
| W-7 | Ambient world-map life layer (animated overlay) | 30 | P2 | TODO | W-1 | The painted map stays a static PNG; life comes from a thin animated overlay at hand-authored coordinates (authored in the same pass as the W-1 node spine, stored per preset). Effects ranked by payoff/cost: (1) chimney/charcoal-camp smoke — drifting fading puffs from marked points (the art already paints static wisps at the charcoal camp to anchor them); (2) water glints — twinkling sparkles along marked river/lake polylines + slow drifting highlight dashes along flow direction (direct reuse of the V-13 flow-dot technique); (3) cloud shadows — 2-3 huge soft translucent shade blobs drifting slowly across the whole map; this is the answer to "tree sway": painted trees cannot be deformed without artifacts, but moving light over the canopy reads as wind; (4) corrupted-corner mist drift — slow circulating grey wisps at the keep corner, and the foundation the W-3 mist-creep visual extends along the road; (5) lantern glow-pulse at the waystation/hamlets (applyDecoAnimation glow-pulse pattern already exists); (6) rare tiny bird pairs drifting across (~every 20-30 s). All effects gated behind prefers-reduced-motion (U-5 pattern exists). Perf budget trivial: ~a dozen particles + 3 shadow blobs. |

---

## EQ — Economy, Equipment & Items

A cohesive system covering gold carry-over between nodes, power-ups (short-lived consumables bought at store), and relics (permanent passives earned on map completion). All items are foundational to meaningful run-to-run strategy; implement in dependency order EQ-1 → EQ-2/EQ-4 → EQ-3/EQ-5/EQ-6/EQ-7 → EQ-8.

| ID   | Title | Effort | Priority | Status | Dependencies | Notes |
|------|-------|--------|----------|--------|--------------|-------|
| EQ-1 | Gold economy reform (carry-over, per-kill, per-wave) | 20 | P1 | DONE | — | Three changes: (1) Remaining gold carries into next node — finish node with 5g → next node starts at `nodeStartGold + 5`. `nodeStartGold` = cost of 2 basic towers (≈120g). (2) Kill gold is already dynamic in `TD_ENEMY_DEFS` (`reward` field); wire it to spendable in-battle gold, not just meta gold. (3) Wave-clear gold = static flat bonus (e.g. +15g) separate from the per-victory meta reward. Boss kill counts as 1 wave-clear bonus + its `reward`. |
| EQ-2 | Power-up system — data model, scope, pre-wave tray | 35 | P1 | DONE | EQ-1 | Power-up schema: `{ id, name, icon, cost, scope:'wave'\|'node', effect:{type, value}, uses:1 }`. Max 3 power-ups in player inventory at any time; duplicates allowed. Pre-wave activation tray: row of power-up buttons shown between wave-clear and "Start Wave". Activating applies effect immediately; `scope:'wave'` clears on wave end, `scope:'node'` clears on node end. Serialize in run autosave. |
| EQ-3 | Power-up content list (12 power-ups, costs 40–100g) | 25 | P2 | TODO | EQ-2 | Defined power-ups (scope / effect / cost): Gold Rush (wave / +50g now / 40g), Rapid Fire (wave / towers +30% rate / 50g), Eagle Shot (wave / towers +20% range / 45g), Pathsalt (wave / enemies −25% speed / 80g), Iron Skin (wave / lives can't drop below current−1 this wave / 70g), Scavenger (node / kill gold ×1.5 / 70g), Fortify (node / +3 lives / 80g), Adrenaline (node / wave-clear gold ×2 / 90g), Cheap Labour (node / tower costs −20% / 85g), Recall (node / one tower refunded 100% / 60g), Scout Report (node / next wave composition revealed 10 s early / 30g), Overclock (wave / towers fire 2× but lose 1 life on wave end / 55g). |
| EQ-4 | Relic system — data model, category exclusivity, upkeep, equip menu | 45 | P1 | DONE | EQ-1 | Relic schema: `{ id, name, icon, category, description, rarity:'common'\|'uncommon'\|'rare'\|'legendary', upkeep:goldPerNode, effect }`. **Category exclusivity**: only one relic per category may be equipped (enforced on equip — old one dropped automatically). Prevents infinite stacking (e.g. two gold-multiplier relics). Upkeep is deducted from `nodeStartGold` at the START of each node; shown clearly in equip screen. Unlimited relics in collection; equip menu is scrollable with category badges. Relic effects computed in `tdMakeState` and injected into `levelDef` or tower/enemy stat multipliers. Serialize in player meta-save (persists across runs). |
| EQ-5 | Relic content list (16 relics across 8 categories, tiered rarity) | 30 | P2 | TODO | EQ-4 | Relics by category (upkeep / rarity): **gold**: Midas Touch (+25% kill gold / 10g/node / uncommon); **wave-gold**: Warlord's Tithe (+20g per wave clear / 8g/node / common); **start-gold**: Merchant's Purse (+60 node start gold / 0 / common); **damage**: Runed Blade (towers +15% dmg / 12g/node / uncommon); **range**: Eagle Eye (towers +1 range cell / 10g/node / uncommon); **lives**: Iron Constitution (+5 max lives per node / 15g/node / rare); **tower-cost**: Master Builder (tower costs −15% / 10g/node / uncommon); **boss**: Dragonslayer (boss HP −30% / 20g/node / legendary); **carry-gold**: Overflowing Coffers (carry 150% of leftover gold, not 100% / 0 / rare); **sell**: Recycler (tower sell returns 80% instead of 60% / 0 / uncommon); **wave-lives**: Guardian Pact (no life lost if first enemy leaks each wave / 18g/node / rare); **spawn-delay**: Trapper's Patience (+1 s before first enemy spawns each wave / 5g/node / common); **kill-combo**: Berserker's Chain (each kill in 3 s window gives +1g bonus, stacking / 12g/node / rare); **tower-upgrade**: Artificer's Guild (upgrade cost −20% / 10g/node / uncommon); **quiz**: Scholar's Ring (quiz gold reward +15g / 0 / common); **all-towers**: Warcry (all towers +10% dmg AND +10% range / 25g/node / legendary). |
| EQ-6 | Store node — 3 power-ups + 1 relic, rarity weighting | 30 | P1 | DONE | EQ-2, EQ-4 | New run-map node type `'shop'`. Shop appears after every 3rd battle node approximately. Shop screen: 4 cards — 3 power-ups (random, priced at `powerUp.cost`) and 1 relic (random, priced by rarity: common 120g, uncommon 180g, rare 250g, legendary 400g). Rarity weight for store relic: common 40%, uncommon 35%, rare 20%, legendary 5%. If power-up inventory is full (3/3) the 3 power-up slots show "Inventory Full" and are untappable. "Skip" exits without buying. Purchased items deducted from carry-over gold immediately. Relic offered is removed from loot pool for the rest of that run once purchased (one-of-a-kind). **2026-07-02 note:** "appears after every 3rd battle node" is superseded by the linear pivot — shop node placement is governed by the W-1 spine type-shuffle (typeRules in the preset JSON); this item is the shop *content* (3 power-ups + 1 relic + rarity weighting), which is unchanged. W-3 later adds corruption-scaled pricing. **2026-07-04 shipped:** replaced the old placeholder shop (`TD_SHOP_ITEMS`, which spent permanent meta-gold instead of run carry-over gold — removed as dead code). Relic exclusion from the offer pool is implemented via permanent `tdOwnedRelics` membership (stronger than "rest of that run" — matches EQ-4's actual persist-across-runs design, since re-offering something already permanently owned wouldn't make sense). |
| EQ-7 | Inventory & equip UI (power-up tray, relic panel, pre-map screen) | 35 | P1 | DONE | EQ-2, EQ-4 | Three surfaces: (1) **Pre-wave power-up tray** — row of up-to-3 power-up chips shown between wave-clear and "Start Wave" button; tap to activate, chip greys out and shows scope tag. (2) **Inventory panel** — accessible via 🎒 button on run map; shows power-up slots (3 max, with name/icon/scope/uses) and relic list (scrollable, shows category tag + upkeep/node). (3) **Pre-map equip screen** — shown when starting a new map during a run; shows currently equipped relics with swap option; also shown immediately when relic is earned or purchased so player can decide. Max one relic per category enforced here with clear conflict UI ("Replace [existing] or skip?"). **2026-07-04 shipped:** (1) was already done under EQ-2. (2) shipped as a renamed 🏺→🎒 `showInventoryPanel`, adding a read-only power-up section above the existing relic list. (3)'s conflict-prompt half shipped as `showRelicAcquiredPrompt`, wired into EQ-6's shop purchase flow. The "starting a new map" trigger is NOT implemented — a run is currently scoped to one map/world (only Verdant exists), so there's no mid-run map transition to hook; revisit once a second world ships. |
| EQ-8 | Post-map relic earn flow (win screen → equip-1 gate) | 20 | P2 | TODO | EQ-4, EQ-7 | On full map completion, victory screen gains a "Claim Relic" step: game selects 3 relic options weighted by rarity (rare/legendary more likely on harder maps); player picks 1. Selection goes to collection immediately. If the earned relic conflicts with an equipped one, the equip-conflict UI (from EQ-7) fires. Relic goes to owned collection even if not equipped. |

---

## P — Progression & Meta-Loop

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| P-1 | Skill tree / upgrade meta-progression | 60 | P1 | TODO | — | Persistent tree (unlocked with XP): unlock new tower types, start-gold bonuses, extra lives. |
| P-2 | XP → level-up tied to quiz correctness | 22 | P1 | DONE | — | Bonus XP for correct answers; correct-streak multiplier. Feeds P-1 tree. |
| P-3 | Spaced repetition tracker (SM-2 per question) | 65 | P2 | TODO | I-1 | Per-question interval/ease stored in localStorage. Drill mode surfaces due cards. |
| P-4 | Daily challenge level (new layout every 24 h) | 45 | P2 | TODO | I-1 | Seeded-random layout from `Date.toDateString()`. Bonus XP for first clear. |
| P-5 | Run-based roguelite structure (Act I → II → III draft) | 70 | P2 | TODO | EQ-3, P-1 | Each "run" drafts 3 towers, 1 relic from random offerings. Permadeath = restart run, keep XP. |
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
| C-7 | Review and update stale questions | 10 | P2 | DONE | — | Audit questions for outdated services or API versions. Run annually. **2026-07-02 audit**: swept all 300 questions against a curated list of known-deprecated/renamed terms (Azure SQL Data Warehouse, AWS Data Pipeline, Python 2, old Spark/Hadoop/Airflow versions, deprecated pandas APIs, stale LLM/AI terminology, etc.) — no genuinely stale content found. One incidental match (#224, "Azure SQL Data Warehouse") is accurate historical lineage in the explanation, not a stale current-state claim; left as-is. No question edits required this cycle. |

---

## UX — User Experience & Accessibility

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| U-2 | Touch target size audit (≥48 px tap zones) | 10 | P1 | DONE | — | Canvas tap and HUD buttons need minimum 48 px hit areas for mobile. |
| U-3 | Keyboard / gamepad support | 40 | P3 | TODO | — | Arrow keys to navigate world map; 1–4 to select towers; Space to start wave. |
| U-4 | Color-blind mode (shape indicators alongside color) | 20 | P2 | DONE | — | Overlay pattern fill (diagonal lines, dots) on towers so color isn't sole differentiator. |
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
| EQ-2 | Power-up system — data model, scope, pre-wave tray | 35 | 2026-06-30 |
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
| V-23 | Run-map: themed node shapes per type | 20 | 2026-06-30 |
| G-7 | Endless mode (procedural waves + kill/batch score) | 30 | 2026-06-30 |
| S-2 | Extract question-logic module (module header + shuffle/queue consolidation) | 20 | 2026-06-30 |
| S-6 | TD Game Config section (tower/enemy/shop/power-up defs consolidated) | 18 | 2026-06-30 |
| G-8 | Difficulty modifier toggles — Ironman, No Gold, Speed+ (+15🪙 per modifier) | 20 | 2026-06-30 |
| S-3 | TD engine section — enemy AI, tower targeting, projectile physics consolidated | 40 | 2026-07-01 |
| G-2 | Enemy special types — raider (fast), brute (armored), wisp (flying), shaman (healer) | 42 | 2026-07-01 |
| S-7 | Split drill.css into labelled sections + consolidated all @keyframes/reduced-motion | 25 | 2026-07-01 |
| V-15 | Landmark anchors — watchtower (entry), castle gate (exit), theme mid-landmark | 25 | 2026-07-01 |
| V-34 | Fixed missing alpha transparency in verdant/decay deco sprite sheets | 8 | 2026-07-02 |
| S-4 | Canvas renderer section — tdRender split into 13 named draw sub-functions | 30 | 2026-07-02 |
| EQ-4 | Relic system — 4-relic starter set, category exclusivity, upkeep, equip menu (run-map 🏺 button) | 45 | 2026-07-02 |
| C-7 | Stale-question audit — 300 questions swept, no stale content found | 10 | 2026-07-02 |
| U-4 | Color-blind mode — pattern fills (diagonal/dots/cross) per tower type, profile-sheet toggle | 20 | 2026-07-02 |
| EQ-6 | Store node — 3 power-ups + rarity-weighted relic, spends run carry-over gold | 30 | 2026-07-04 |
| EQ-7 | Inventory panel (🎒, power-ups + relics) and relic-acquired equip/conflict prompt | 35 | 2026-07-04 |

---

## A — Painted Unit Art (enemy/troop sprites via Nano)

Replacing the procedural `TD_SPRITES` pixel frames with painted sprites in the
battle-map art style. Generation items are **user + Nano** (like G-9's art);
engine items are code. Follow the Asset Generation Notes below for every
sheet: solid magenta `#FF00FF` background + closed silhouette outline, and
attach the style reference image. Consistent rules for ALL unit sheets:
same 3/4 side-view camera as the buildings/towers, fixed frame cell size,
feet on a consistent baseline row in every frame (the engine anchors sprites
by feet), one animation per sheet row.

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| A-1 | Enemy sheet template + goblin pilot | 20 | P1 | TODO | — | **User + Nano.** Define the reusable sheet spec and prove it end-to-end with one enemy (goblin): side-view facing RIGHT, walk cycle 6 frames (row 1), death 4 frames (row 2), fixed cell (e.g. 128×128), magenta bg, closed outline, feet baseline constant across frames. Scale anchor: enemy height ≈ 60–70% of a tower's base width so units read smaller than towers. No left-facing frames — the engine mirrors. Validate: chroma-key removal clean, frames align when flipped through as a strip. The template prompt gets documented in docs/MAP_PROMPTS_VERDANT.md style once proven. |
| A-2 | Verdant enemy roster sheets | 35 | P1 | TODO | A-1 | **User + Nano.** Apply the A-1 template to the rest of the roster: orc, raider (fast), brute (armored), wisp (flying — needs hover bob in walk row instead of steps, no ground shadow baked in), shaman (healer — add a 4-frame cast row), boss (bigger cell, e.g. 192×192). One sheet per enemy, one PR per batch so a bad generation doesn't block the rest. "Running" needs no extra frames — speed is conveyed by playback rate (raider plays its walk cycle faster). |
| A-3 | Engine: painted-enemy animation renderer | 30 | P1 | TODO | A-1 | Code item. Sprite-sheet loader (reuse the tower tiers loader pattern), per-enemy state machine (walk loop, death one-shot), feet-anchored `drawImage`, horizontal mirror when moving left, playback rate scaled by enemy speed. Keep V-19's type-specific death particles layered on top of the death frames. Fall back to procedural `TD_SPRITES` for any enemy without a painted sheet so the roster can migrate incrementally. |
| A-4 | Combat animations (attack frames + friendly troops) | 40 | P2 | TODO | G-10, A-1 | **User + Nano** for the art, code for the hookup. Only needed when G-10 barracks lands: per-enemy attack row (4 frames) + a full friendly soldier sheet (idle/walk/attack/death). Do not generate these early — G-10's design decisions (block vs speed-bump, troop count) determine what states are actually needed. |

---

## Asset Generation Notes — preventing another V-34/V-35

**Root cause of V-34/V-35:** the image generator used for `deco-*.png` can't emit real
alpha transparency. Asked for a "transparent background," it drew a literal checkerboard
(the standard no-background indicator most editors show) and flattened it into an opaque
RGBA image (alpha 255 everywhere) instead of encoding actual alpha. Any future sprite
batch made the same way will have the same defect.

**Fix at generation time (do this, not post-processing):** request sprites on a solid,
highly saturated chroma-key color — pure magenta (`#FF00FF`) or pure green (`#00FF00`) —
instead of "transparent" or a checkerboard. A flat single color is what makes background
removal trivial and safe: one color-distance test, no threshold tuning, and near-zero
risk of colliding with real sprite content, because saturated magenta/green essentially
never appears in pixel-art stone/metal/skin/foliage palettes. A gray-on-gray checkerboard
does collide with that palette — that's exactly why V-35 (void theme) is stuck: its
grays overlap the sprites' own grays, so no single tolerance setting can separate them.

**On the "black outline frame" idea:** a frame around the *canvas edge* doesn't help much
on its own — the space between the icon and the frame is still whatever background style
was generated, so it still needs color-based removal. What *does* help, and is worth
requesting explicitly in the generation prompt, is a continuous 1–2px dark outline traced
around each sprite's own silhouette (most of the current sprites already have this by
style default — check before assuming it's missing). A closed outline turns background
removal into a flood-fill from the canvas border instead of a color-threshold problem:
flood outward-in through every pixel reachable without crossing the outline, regardless of
what color or pattern the background turns out to be. Combine both — chroma-key
background *and* a guaranteed closed outline — and removal becomes both simple and immune
to glow/color-bleed edge cases like the one blocking V-35.

**Process going forward:** run `scripts/remove_checker_bg.py <sheet>.png --preview
preview.png` on every newly generated sheet before it's committed, and actually look at
`preview.png` (composited onto magenta) rather than the raw PNG — a transparent PNG and a
checkerboard-background PNG look identical in most viewers, which is exactly how V-34/V-35
made it into the repo unnoticed.

---

## GitHub Pages Feasibility Notes

All items in this backlog are compatible with a static GitHub Pages deployment (no server, no bundler). Specific notes:

- **V-13 through V-25, U-9 through U-11**: Pure Canvas 2D API + CSS. No external assets or server calls required.
- **V-14 (themed palettes)**: Palette objects are inline JS — no image files needed.
- **V-15 (landmark sprites)**: Inline pixel-art arrays like the existing `TD_SPRITES` entries. No uploads.
- **P-6 (leaderboards)**: Only item requiring a backend. GitHub Gist API workaround exists but needs OAuth — flag before implementing.
- **I-2 (cloud sync)**: Also requires GitHub OAuth — flag before implementing.
- **Diagonal path geometry** (not yet filed): `tdComputePathSet` (grid pathSet, used only for tower-placement blocking) still only handles axis-aligned segments — that part is unchanged. **2026-07-04 update:** `tdMoveEnemy` itself no longer has this restriction for maps that supply an exact pixel polyline (`levelDef.wpsExact`, currently just Frontier Town) — enemies walk the true painted-road curve instead of the Manhattan reduction. **G-9 already redesigns `tdComputePathSet` for multi-lane support — fold any remaining diagonal-geometry work for the *blocking* grid into G-9's implementation**, to avoid two uncoordinated redesigns of the same function.

---

*Last updated: 2026-07-04 (EQ-6 store node shipped; Frontier Town enemy pathing now follows the exact painted road instead of the Manhattan grid reduction; build slots re-centered on their painted clearings). Picking order: filter `Status = TODO`, sort by Priority then Effort ascending, take the first item whose dependencies are all `DONE` or `—`. W-1 and G-9 are flagged do-not-auto-implement.*
