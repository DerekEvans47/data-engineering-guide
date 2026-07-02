# Art Direction Session Handoff — 2026-07-02

Read this before doing anything else in the next session. This was a long,
human-driven, conversational art-direction and design exploration — not an
implementation session. **Zero game code was changed.** Everything below is
context to pick the conversation back up, not a queue of finished work.

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
picker grab it. See BACKLOG.md's picking-order note — V-35 (effort 15) is the
lowest-effort unblocked P1 item and is the realistic next auto-pick; that's
fine, it's well-scoped and doesn't need this doc's context.

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
