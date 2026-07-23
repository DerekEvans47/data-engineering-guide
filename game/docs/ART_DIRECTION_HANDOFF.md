# Art Direction Session Handoff — 2026-07-02

Read this before doing anything else in the next session. This was a long,
human-driven, conversational art-direction and design exploration — not an
implementation session. **Zero game code was changed.** Everything below is
context to pick the conversation back up, not a queue of finished work.

## ✅ 2026-07-02 follow-up session — read this FIRST, it supersedes parts of this doc

A second, user-driven session ran the same day and changed the picture substantially.
Sections below marked "superseded" are kept for history only.

### The big pivot: linear world map, multi-path battle maps

The world map is now a **single linear journey** across one painted map image; all
route-choice strategy moved to the **battle maps** (G-9, rescoped). World-map strategy
becomes per-node stakes: engagement tiers, a corruption/pursuit meter, gold wagers,
campfire dilemmas — full design in **BACKLOG.md's new W section**. This supersedes this
doc's items 7/11/12 (fixed build slots still apply to battle maps; the 25-node run-graph
analysis and "landmark count must match node count" reasoning no longer bind the world
map, which needs only one traceable trail).

### Art pipeline — final form (compositing REJECTED, layout-conditioning REJECTED)

Three approaches were tested head-to-head this session:
1. **Programmatic compositing** (terrain + sprite catalogs + code placement): produces
   "sticker map" quality — no unified lighting/shadows/ground-contact. Rejected for
   scenery. The catalogs still matter (see below).
2. **Layout-conditioned repaint** (feed Nano a mockup to repaint): drifts (duplicated
   mills, vanished sheep) AND constraining composition kills the aliveness that makes
   free generations good. Rejected.
3. **Free generation with loose narrative guidance** (topology described as geography,
   landmarks attached to routes): produces hero-quality maps that hold structure. **This
   is the pipeline.** The game adapts to the art: node spines are hand-placed along the
   painted trails (trivial now that the world map is linear).

**Division of labor:** painted map = scenery layer (one image per preset). Runtime
overlays = node markers (`assets/worlds/verdant/markers.png` catalog — markers SHOULD pop
like UI, Kingdom Rush-style), roads-already-painted, mist-creep corruption visual.

### Locked prompt guards (add to EVERY map generation — the fixed technical layer)

- **Attach a style-reference image.** Proven by controlled A/B this session: identical
  style prose, different subject matter → pastoral prompt drifted to storybook
  watercolor, forest prompt held pixel-art. Content priors beat style words; only a
  reference image anchors reliably.
- **No-horizon guard:** "No horizon, no sky, no atmospheric distance — the entire canvas
  is seen from the same overhead height at the same scale, edge to edge." (A pastoral
  generation grew a vista horizon, making the top third unusable for node placement.)
- **Roads-go-somewhere rule:** every trail terminus must reach a landmark or exit the
  map border. Origin settlement at the start of the trail (player came from somewhere);
  road exits the border past the boss ruin (foreshadows the next world).
- **Count guards:** "exactly one of each: village, mill, bridge, keep…" — mostly holds,
  tolerate minor violations (an extra stream crossing is cosmetic).
- **No text / letters / labels / icons / pins**; no people; no animals except sheep.
- **Surgical edits work, structural edits fail:** additive localized changes ("add a
  hamlet in this empty field, keep everything else identical") succeed; rerouting
  topology by edit does not — regenerate instead.
- Camera + rendering recipe: unchanged from the Recipe section below, still load-bearing.

### Per-world palette layer (stack on top of the fixed layer)

- **Verdant** (Parts 1–3): saturated healthy greens, warm light, living farmland.
  Corruption confined to the keep corner only (dead trees + grey mist, ~5% of frame).
- **Decay** (Parts 4–6): not started. Same fixed layer, palette shifts to greys/browns,
  graveyard/medieval-decay landmark vocabulary.
- **Void** (Parts 7–9): not started. Same fixed layer, eldritch palette.

### Asset state in repo (restructured 2026-07-03)

Layout: runtime assets under `learn/drill/assets/worlds/<world>/` (region.png,
region-preset.json, markers.png, battlemaps/<theme>.png); authoring-only
references under `learn/drill/assets/reference/`. The legacy `assets/map/`
directory, its manifest.json, and the drill.js deco loader are gone (stubbed).

- `reference/verdant-terrain-testbed.png` — sparse terrain (superseded as a base by the painted-map
  pipeline; still the geometry testbed), Nano watermark removed via diffusion inpaint.
- `reference/verdant-deco-structures.png`, `-deco-nature.png` — decoration catalogs
  (16 items each; nature sheet actually packs 5 items in row 3 — extract by connected
  components, NOT grid arithmetic, or sheep lose heads).
- `worlds/verdant/markers.png` — 12 node markers (battle ×3, shop ×3, campfire ×3,
  start, boss, locked). Production marker set for the runtime overlay.
- `reference/verdant-style-reference.png` — 2×2 contact sheet; attach to future prompts.
- The 6 old pixel `deco-*.png` battle-map sheets are DELETED (manifest emptied, SW cache
  bumped) — V-34's fix shipped, V-35 is obsolete.
- **Not yet committed:** the 3 candidate painted world maps (baseline / Golden Valley /
  Wild Frontier) live only in chat. User picks winner(s) and commits — the do-not-lose
  lesson from the header below still applies to these.

---

## ⚠️ Most important thing to know

**No image files exist in the repo from this session.** Every generated image
(4-panel style comparisons, sprite sheets, terrain tests, battle-map
backgrounds, run-map backgrounds) was shared back and forth in chat with the
user, who runs Nano Banana externally — none were downloaded or committed. If
you pick this up and the user references "the map we landed on," you don't
have it; ask them to re-share it, or re-run the last prompt in this doc.

**G-9 in BACKLOG.md is flagged "do not auto-implement."** It depends on art
that doesn't exist yet and on design decisions (lore, exact layout) that are
still being refined with the user directly. Do not let a nightly/autonomous
picker grab it. *(Stale as of the 2026-07-02 addendum: the original note here
recommended V-35 as the next auto-pick, but V-35 became OBSOLETE when the void
deco sheets were deleted in the painted-background pivot — consult BACKLOG.md's
current status column instead.)*

## Session arc, in order

1. **Fixed deco sprite transparency (V-34, DONE / V-35, TODO).** Six
   `assets/map/deco-*.png` sheets had a "no transparency" checkerboard baked in
   as fully opaque pixels instead of real alpha. Built `scripts/remove_checker_bg.py`
   (color-threshold + connected-component cleanup + edge feather), fixed
   verdant + decay (4 files). Void theme (2 files) resisted the fix — its
   glow/magic effects bleed color into the checker background in a way that
   collides with the theme's own gray palette; loosening tolerance to catch
   the glow halo eats holes in gray sprite content instead. Logged as **V-35**,
   still open. Prevention guidance written into BACKLOG.md's "Asset Generation
   Notes" section: generate future sprites on a solid chroma-key background
   (magenta/green), not a checkerboard — a flat color has zero palette-collision
   risk, unlike gray-on-gray.

2. **Assessed the visual gap vs. Kingdom Rush (the inspiration reference).**
   Concluded it's large and not closeable via a few backlog items — different
   production model entirely (funded studio, hand-painted, isometric-ish
   depth) vs. this project (solo/AI-assisted, procedural pixel sprites, flat
   canvas). Identified the achievable middle ground: extend the AI-generated
   painted-asset pipeline already proven by the deco fix to towers/enemies/
   terrain, rather than chasing full parity.

3. **Ran a 4-panel style comparison** (same scene, 4 candidate art directions:
   painted-premium / bold-vector / chunky-cartoon / elevated-pixel-art).
   Discussed feasibility risk for each — the real risk isn't "does it look
   good once," it's **generation-to-generation consistency** across the dozens
   of separate AI calls a full asset set would need.

4. **Tested feasibility with a 4×4 asset sheet** (tower upgrade tiers +
   enemies + a barracks/troop concept + terrain). Found real problems: tower
   tier 1 didn't share tier 2/3's silhouette (reads as 3 different buildings,
   not one upgrading); the boss enemy stylistically drifted from goblin/orc;
   terrain rendered as literal 3D raised blocks, incompatible with the
   engine's flat per-cell color-fill rendering (`TD_THEME_CELLS`).

5. **Solved seamless tile texturing, but then largely abandoned the approach.**
   First attempt at a tileable grass texture failed hard (visible grid/seam
   lines — a "patchwork" look). Second attempt, with the variable isolated (one
   tile, no color variants, standard "seamless tileable texture" terminology,
   explicitly flat/non-directional lighting), succeeded cleanly. **Lesson for
   next time:** avoid "grout line" / edge-shading language, it gets
   interpreted as a literal border; ask for uniform flat lighting instead.
   This technique works but was superseded by full painted backgrounds (next
   item) as the preferred direction — may still be worth revisiting for
   generic filler terrain if the full-background approach doesn't scale.

6. **Pivoted to full painted per-map backgrounds (the direction that stuck).**
   First test (single path, close-up forest scene) came out excellent —
   better and more consistent across regenerations than anything from the
   tile/sprite-sheet tests. This became the primary direction for the rest of
   the session.

7. **Discovered dense painted backgrounds require fixed build slots.**
   Free-placement-anywhere (today's model: any non-path grid cell) doesn't
   work once the background is densely painted with trees/rocks — towers
   would visually clip through painted art. Needs Kingdom-Rush-style curated,
   deliberately scarce build slots per map, hand-matched to clearings baked
   into the art. Folded into **G-9**.

8. **Iterated the battle-map background** through: two-path (initially fully
   separate exits, then corrected to converge into one shared exit — the more
   classic TD pattern; fully-separate-forever paths repurposed as an
   intentional rare "bonus/reward map" variant, one per world, not the
   default), asymmetric build-slot clearings (favor one path early, shared
   near the merge), and a locked camera angle (see Recipe below). Also
   decided: battle-map grid switches from portrait (`TD_COLS=9,TD_ROWS=10`) to
   landscape (~16:9), confirmed cheap in code (`td.cellSize =
   Math.min(cellByW, cellByH)` already fits any grid shape; all ~20
   `TD_COLS`/`TD_ROWS` call sites are already generic, not hardcoded).

9. **Extended landscape orientation to the run map too — this took a wrong
   turn worth knowing about.** Initially reasoned the run map (level-select
   screen) should stay portrait since it's "just a menu." That was wrong: the
   player alternates between run map and battle map constantly within one
   session (pick node → play → back to run map → repeat), so mismatched
   orientations mean rotating the device on every single transition instead of
   once. Corrected — both screens share landscape for the session; only the
   outer study-guide site stays portrait. If you see any reasoning elsewhere
   that assumes the run map is portrait, it's stale.

10. **Developed a lore frame** (previously nonexistent — checked, there was no
    narrative framing anywhere in the code before this). Player is a
    traveling guardian/scholar journeying from a healthy frontier toward the
    source of a corruption spreading across the land: **Verdant Frontier**
    (Parts 1-3, healthy/safe) → **Cursed Graveyard** (Parts 4-6, decaying) →
    **The Void** (Parts 7-9, fully consumed). For Verdant specifically: starts
    at a frontier village, ends at an ancient keep ruin reclaimed by nature
    (abandoned, not yet sinister) — with only a very subtle hint of the next
    world's corruption right at the ruin (confine to ~5% of the frame), not a
    broad transition. This is confirmed but described as "close, not final" —
    expect more refinement rounds.

11. **Found the run map's node graph already has the branching/converging
    structure the user wanted, independently designed.** Read the actual code
    (`generateRun`, `RUN_NODE_POS`): `start` forks 3-way (not 2) into six-node
    lanes, with a mid-lane cross-link (one lane's node 4 feeds into another
    lane's node 5 — not fully parallel), converges twice (`merge1` then
    `postmerge`), forks 2-way (`fork2l`/`fork2r`), converges again
    (`preboss`), then `boss`. **25 total nodes per run**, not ~12 — the
    background art needs way more small landmarks than first attempted to
    give each node something to sit near. `RUN_NODE_POS` is a fixed
    coordinate table, currently portrait-oriented with a bottom-to-top flow
    (start y=520, boss y=62 in the old 340×540 viewBox) — this gets rewritten
    for landscape as part of G-9 implementation, which is also the moment to
    deliberately align node coordinates to specific painted landmarks instead
    of hoping they land somewhere sensible.

12. **Iterated the run-map (Verdant) background** through several rounds:
    village + keep + a couple landmarks → too small/sparse, zoom out 200% →
    zoomed out with ~12 lettered landmarks (model added its own letter labels
    unprompted, harmless) → user liked it but wanted more landmarks (~18-20,
    matching the real 25-node count) and a softer/smaller corruption hint.
    Last result: user said **"very close"** — not yet explicitly finalized,
    but close enough that 1-2 more refinement rounds should land it.

## The "recipe" — locked language, reuse verbatim

**Camera angle** (proven twice, holds up well): *"steeper and more overhead
than a typical 3/4 perspective — the viewer standing much higher up and
tilting their view down toward the ground, closer to bird's-eye, though not
perfectly flat orthographic; trees and rocks show much more of their top
surface and much less of their side profile."*

**Rendering style**: *"painted-pixel-art, rich painterly dithered shading,
soft consistent lighting, saturated fantasy palette, clean readable shapes."*

**Background handling**: solid magenta (`#FF00FF`) chroma-key ONLY for sprite
sheets that need cropping/alpha extraction. Full-scene backgrounds (battle-map
terrain, run-map parchment) need no keying — used whole, no transparency
required.

**Seamless tiles** (if revisited): isolate to one tile at a time, use the
standard term "seamless tileable texture," explicitly flat/non-directional
lighting, avoid "edge"/"border"/"grout" language.

**Reference image conditioning**: if Nano Banana supports attaching a prior
successful image alongside a text prompt, that's more reliable for holding a
style than re-describing it in words each time — worth trying if not already
doing it.

## What's NOT done — don't assume any of this is finished

- Void deco transparency (V-35) — open, needs per-sprite tuning or regen.
- No production sprite sheets exist for towers/enemies/barracks in any style
  — the 4×4 test was a feasibility check, not final assets.
- Terrain ground tiles — technique validated (seamless tiling works with the
  right prompt) but never produced a final asset; likely moot if painted
  full-backgrounds become the terrain solution instead.
- Battle-map background — technique validated (converging 2-path, camera
  angle, asymmetric clearings) but no image was explicitly approved as final.
- Run-map backgrounds for Decay and Void worlds — not started, only Verdant
  was tested.
- **G-9 code implementation — nothing has been written.** This entire session
  was art direction and BACKLOG.md documentation only.

## Backlog changes this session (all committed + merged)

| PR | What |
|----|------|
| #58 | Fixed verdant/decay deco transparency (V-34 DONE), logged V-35, added Asset Generation Notes |
| #59 | Added G-9 (multi-path topology) and G-10 (barracks/spawner tower) |
| #60 | Folded fixed build-slot placement into G-9 |
| #61 | Added battle-map landscape orientation to G-9 |
| #62 | Corrected G-9 — run map needs landscape too, not just battle map |
| (this session, pending) | Flagged G-9 "do not auto-implement," cross-referenced the stale "diagonal path geometry" note to G-9 |

G-9 is now a large bundled item (85 effort: path topology + build slots +
battle-map landscape + run-map landscape + run-map coordinate rewrite). Worth
considering whether to split it into implementation-sized sub-items once art
is actually finalized and it's time to build — that's a judgment call for
whoever picks it up with the user present.
