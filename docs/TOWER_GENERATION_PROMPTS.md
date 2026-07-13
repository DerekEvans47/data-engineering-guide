# Tower Generation Prompts — Verdant

Companion to `BATTLEMAP_GENERATION_PROMPTS.md`, same pipeline (Nano Banana, attach a
reference image, style-anchor with a COMMON BLOCK, one prompt per subject). This file
produces painted-pixel-art **tower sprite sheets** instead of full battle-map
backgrounds.

**Why this exists:** the original towers (`TD_SPRITES.bastion/ranger/mortar` in
`learn/drill/drill.js`) are flat, hand-authored pixel-art frames recolored per upgrade
tier (`pals[lvl]`). That's the same rendering technique the old procedural terrain
used, and it read as a sticker pasted on top of the painted battle-map backgrounds —
no shared lighting, no ground contact, wrong level of painterly detail. See
`ART_DIRECTION_HANDOFF.md`'s compositing-rejection reasoning: this is the same
"sticker map" problem, just on towers instead of terrain. The fix is the same one that
worked for the maps — paint the tower in the same technique as the scene.

**Status: Ranger — shipped and wired (all 4 tiers, front + back facing), but tiers
1 and 4 are queued for an art regen — see "Regen queue" below (2026-07-13).**
`learn/drill/assets/towers/ranger-tier{1,2,3,4}.png` (front) and
`ranger-tier{1,2,3,4}-back.png` (back) are wired into
`TD_TOWER_TIER_IMAGES`/`tdRenderTowers`, with `TD_TOWER_DEFS.ranger` carrying 3
upgrades (4 total levels) to match. Towers orient toward the road automatically (see
"Code-side facing logic" below). See "What actually shipped" below for the exact
spec that produced the approved front art, and "Facing variants" for the back sheet.

## How to use this file

1. Open a Nano Banana session and attach
   `learn/drill/assets/worlds/verdant/battlemaps/frontier-town.png` as the reference
   image — style, camera, and scale anchor, same file the battle-map prompts use.
   *(Do not attach `assets/reference/verdant-style-reference.png` — that's a holdover
   from the sprite-catalog compositing pipeline the maps themselves moved past.)*
2. Paste the **COMMON BLOCK** below, then the tower's **SUBJECT BLOCK**.
3. Don't push a commit for every iteration — iterate on the prompt and generations in
   chat, only commit once a sheet actually passes the eyeball checklist.
4. Run the **eyeball checklist**. The failure mode that matters most: if any tier
   doesn't read as an upgrade of the *same* building, regenerate the whole sheet —
   don't try to edit one cell into matching.
5. Save the keeper to repo root, then slice + alpha-extract with
   `python3 scripts/remove_magenta_bg.py <upload>.png -o /tmp/out.png`, crop each tier
   to its own file, and save as `learn/drill/assets/towers/<tower-id>-tier<N>.png`.
   Delete the raw upload from repo root once the processed tiers are in place.

## What actually shipped (Ranger)

Three real Nano Banana rounds got here, each correcting a specific failure — see
"Process notes" below for what went wrong at each step. The prompt that actually
produced the approved art:

- **4 cells, single row, one per tier, left to right, base → ultimate. No
  duplicates, no alternate takes — exactly 4 distinct images.** Early attempts that
  asked for extra rows (an idle/active animation frame, then 3 camera-pitch view
  variants) came back with duplicated/misinterpreted columns instead of clean tiers,
  so the shipped version dropped every axis except tier.
- **No shadow, no grass patch baked into the art at all.** Shadows are now drawn in
  code instead (see "Shadow direction" below) — a semi-transparent shape darkens
  whatever's under it by construction, so it works on any terrain without needing to
  match a specific turf color, and it's one shared implementation instead of 4
  separately-painted, terrain-specific shadows.
- **No character, no firing/idle animation baked in** — the tower is a static
  structure; the game already has code-side firing feedback (muzzle-flash line,
  projectile, hit particles, an idle breathing-scale pulse) and doesn't need a second
  painted frame for that.
- **Material progression, exactly this sequence:** wood + hay roof → wood/stone/hay
  integrated (a real structural mix — stone foundation, wood upper walls and roof, not
  a patch) → full stone with a proper slate roof → full stone + glowing diamond inlay
  along the mortar joints and roofline (same silhouette as tier 3, richer material
  only).
- Reference image: `frontier-town.png` only.

## Shadow direction (for the code-side shadow, not the art)

Checked pixel evidence directly rather than assuming: cropped and inspected several
objects in `frontier-town.png` (a tree's ground shadow, a second tree, the well roof,
a house roof, the woodpile). 3 of 4 checkable objects — both trees' ground shadows and
one house roof — agree the map's implied sun sits **upper-right**, so shadows fall
**lower-left**. One object (the well roof) reads the opposite way, so the map isn't
using a rigorously consistent light vector (typical of AI-painted art using soft
per-object shading rather than one global directional light) — this is "good enough
to pick one convention," not a precise physical measurement. Shadow direction should
be **the same for every tower regardless of where it sits on the map** — real
directional light is parallel at this scale, so position only changes which of the
tower's *own* surfaces face the camera, never which way its shadow points.

## COMMON BLOCK — paste first in every tower prompt

> Attached image is the style, palette, and camera-angle reference — match it exactly:
> same painted-pixel-art rendering technique, same rich dithered shading, same
> saturation, same camera (steeper than a typical 3/4 perspective, closer to bird's-eye
> but never flat top-down). **This must NOT look like a flat vector icon or a clean
> cartoon asset-pack sprite** — every surface needs the same hand-painted texture as
> the reference: wood has visible grain and brush-stroke variation, thatch is
> individual overlapping strands with tonal variation, stone blocks are individually
> shaded with distinct facets, not flat color fills with a thick uniform outline. Match
> the reference's scale: this tower should read as a small structure roughly the size
> of the reference's well or hay-cart, not as large as a farmhouse.
>
> **Exactly 4 cells, one per tier, in a single row, left to right, base → ultimate. No
> duplicates, no extra columns, no alternate takes of the same tier — 4 distinct
> images only.** The camera angle is identical in all 4 cells.
>
> Flat solid magenta (`#FF00FF`) fills the rest of each cell — this is a sprite sheet
> for alpha extraction (see `scripts/remove_magenta_bg.py`), not a scene. No grass
> patch, no shadow, no ground plane baked into the art — both are handled in code so
> the tower works on any battle-map terrain, not just the one it was painted next to.
>
> Trace a continuous 1–2px dark outline around each tower's own silhouette — the
> reference art already does this by default, match it.
>
> **Silhouette continuity is a hard requirement:** all 4 towers are the SAME
> structure, same footprint, same closed-roof silhouette, same window/door placement.
> Each tier is a genuine rebuild in the new material, not the previous tier with a
> texture patched onto one section — if a later tier keeps an obviously
> wood/thatch part where the spec calls for stone, that's wrong; the whole structure
> converts.
>
> **No visible character, archer, or any figure anywhere on the sheet.** No
> firing/idle animation baked in — this is a static structure only.
>
> No text, letters, numbers, labels, UI icons, health bars, or range circles anywhere
> on the sheet.

## SUBJECT BLOCK — Ranger (arrow) tower — shipped

**Note (2026-07-13):** the tier 1 and tier 4 paragraphs below are what originally
shipped, kept for the record — both are superseded by the "Regen queue" section
further down (tier 1's single-post silhouette reads as a treehouse; tier 4's cyan
palette clashes with the warm-graded maps). Any future full-sheet regen should use
the Regen queue's revised tier 1 and tier 4 specs in place of these paragraphs.

> **Subject: a small enclosed archery watchtower, no visible occupant.** A single
> central support column holding up a small fully-roofed cabin/turret with one small
> arrow-slit window facing outward. Nothing stands outside or on top of it; the roof
> always closes off the top completely.
>
> **Tier 1 (base) — wood, hay roof.** The entire structure, including the support post
> and ladder, is rough-hewn raw timber. One small square window. A peaked hay/thatch
> roof (bundled thatch strands, warm golden-tan tone). No stone anywhere.
>
> **Tier 2 — wood, stone, and hay integrated.** The support column and the full lower
> half of the cabin walls are rebuilt in fitted stone (a genuinely reinforced base, not
> a thin patch). The upper half of the walls stays plank wood, and the roof is still
> hay/thatch.
>
> **Tier 3 — stone, with a proper roof.** The support column and the entire cabin, top
> to bottom, are now cut fitted stone — no wood remaining anywhere in the structure.
> The thatch is fully replaced with a proper steep, pointed roof of overlapping dark
> slate/stone tiles.
>
> **Tier 4 — stone and diamond (ultimate).** The same all-stone tower and slate roof,
> now inlaid with veins of glowing diamond/crystal running through the mortar joints
> and along the roof's ridge line, giving off a soft cyan-white glow along the seams.

**Layout:** single row, 4 columns, ~1536×384 (4 cells of 384×384), generous gutters,
no grid lines.

## Eyeball checklist

- [ ] Exactly 4 cells, single row, no duplicates.
- [ ] All 4 tiers read as the same enclosed, roofed structure at increasing material
      stages (wood/hay → wood+stone+hay → stone+slate → stone+slate+diamond) — not 4
      different buildings, and no tier keeps an obviously-wrong leftover material from
      the previous tier.
- [ ] No character, archer, or figure anywhere on the sheet.
- [ ] No animation frame, no grass patch, no shadow baked into the art.
- [ ] Rendering matches the reference's painted-pixel-art texture — visible wood
      grain, individual thatch strands, individually-shaded stone facets, dithered
      shading. **Reject anything that reads as a flat vector icon or clean cartoon
      asset-pack sprite with a thick uniform outline.**
- [ ] Scale matches a small clearing structure (well/hay-cart size), not a farmhouse.
- [ ] A closed dark outline traces each tower's own silhouette.
- [ ] Background is flat magenta — no scenery, no gradient sky, no ground plane.
- [ ] No text/UI anywhere.

## Process notes — what went wrong at each step (read before iterating again)

1. **First attempt** (archer visible, elven-woodcraft/vine theme, 4×3 grid with
   nock/draw/release rows): came back as a flat vector-icon style (thick uniform
   outlines, no dithered shading) instead of painted-pixel-art. Fix: explicitly forbid
   "flat vector icon / cartoon asset-pack sprite" and describe the specific painterly
   texture cues (wood grain, thatch strands, shaded stone facets).
2. **Second attempt** (wood→wood/stone→stone→stone/diamond materials, still with an
   archer, open crenellated top): style/texture was much better, but the archer
   disappeared behind an enclosed shed shape in tiers 3–4, making the row poses
   unreadable past column 1. Fix: drop the archer and any animation entirely — no
   character anywhere, closed roof at every tier, matching how the existing
   Bastion/Mortar towers already have no visible operator.
3. **Third attempt** (4×3 grid: 4 tiers × 3 camera-pitch-by-depth-zone rows): came back
   as 6 columns × 3 near-duplicate rows instead of the requested 4×3 — the model
   didn't reliably execute either the tier count or the camera-pitch row concept in one
   shot. Fix: **simplify to what you actually need first.** Dropped the camera-pitch
   row idea entirely (deferred — see "Future work"), asked for exactly 4 cells in a
   single row, and got a clean, correct result on the next try. Lesson: asking for two
   hard things at once (a strict count *and* a subtle camera-angle variation) compounds
   failure risk; nail the tier progression alone first.
4. **Shipped attempt:** single row, 4 tiers, explicit "no duplicates" instruction, no
   shadow/grass/animation. Clean result — see "What actually shipped" above.

**Alpha extraction lesson:** the first pass at `scripts/remove_magenta_bg.py` used
Euclidean distance-to-magenta for both the alpha mask and the cutoff, which left a
visible magenta fringe around every sprite — anti-aliased edge pixels blended between
the dark outline and magenta background are *numerically far* from pure magenta (very
different brightness) even though they're still visibly pink-contaminated. Fixed by
keying on green-channel deficiency instead (magenta uniquely lacks green; real content
essentially never does) and de-spilling the RGB of partially-transparent edge pixels,
not just adjusting their alpha — see the script's docstring for the exact reasoning.

## Facing variants (front/back) — DONE, shipped

Towers now orient toward the road instead of always facing the same way. Rather than
4 separately-generated compass directions, only a second "back" sheet was generated —
`learn/drill/assets/towers/ranger-tier{1,2,3,4}-back.png` — and horizontal mirroring
in code covers the other 2 of the 4 facings for free (see "Code-side facing logic"
below). Same COMMON BLOCK and SUBJECT BLOCK as the front sheet, plus one addition:

> Same tower design, same 4-tier material progression, same camera angle and scale as
> before — but the entrance side is flipped to the far side of the structure. The
> arrow-slit window and the ladder are now attached to the back-left face of the
> cabin, facing up and away from the viewer, instead of the front-right face facing
> down and toward the viewer. Everything else (materials per tier, silhouette, camera
> pitch) is unchanged — only which face of the building the window and ladder are on.

**What actually shipped:** the back sheet reads as a genuinely different side of the
same tower family (a roof dormer + smaller window instead of the front's wall-mounted
arrow slit, ladder relocated and — on tiers 3-4 — leading to a proper door instead of
the front's plain double-door with no ladder), while still tracking the same
wood→wood/stone→stone→stone/diamond material progression. Tier 4's glowing marks read
as stylized angular fantasy runes (individually carved into separate blocks with a
cyan glow), not literal text — checked closely since the COMMON BLOCK explicitly
forbids text/letters, and early passes of this had actual English-letter shapes.

**Process notes:**
1. First attempt asked for the orientation change too vaguely ("opposite corner") and
   the model redesigned the tower instead of just relocating the entrance — a
   different base shape (ground-level shed vs. the shipped elevated post), plus a new
   architectural feature (the roof dormer) with no clear connection between the ladder
   and any opening on tiers 3-4. Fixed by being explicit that this must be the *same*
   structure/silhouette per tier, only the window+ladder move, and that the ladder
   must visibly connect to a real opening.
2. On reflection, the redesigned silhouette (dormer window) wasn't actually a problem
   on its own — a real building can plausibly have a feature on one face that isn't on
   the other. The thing that matters is whether front and back still read as the same
   tower family when both are on screen at once (which happens routinely, since
   different build slots get different facings) — confirmed by direct side-by-side
   pixel comparison against the shipped front tiers once the ladder-connection fix
   landed.
3. **Wrong file uploaded once:** the first "corrected" upload was actually a duplicate
   of the original front sheet, not the approved back-facing one — caught by directly
   diffing the processed back tiers against the shipped front tiers (all 4 came back
   visually identical, which should never happen for a genuinely different variant).
   Re-uploaded correctly afterward. Worth this exact check — image comparison, not
   just an eyeball glance — any time a "variant" generation is approved from chat but
   the file that lands in the repo is what actually ships.

## Code-side facing logic

`tdComputeSlotFacing` (in `learn/drill/drill.js`) derives a `{ back, mirror }` pair
per build slot from pure geometry — the direction from that slot's pixel position to
the nearest point on the map's road polyline (`tdNearestPointOnPolyline`) — computed
once at module load per map, same pattern as `FRONTIER_TOWN_SLOT_CENTERS`. Nothing is
hardcoded per tower instance, so this works for any map that supplies a pixel-space
waypoint list and slot positions, not just Frontier Town:

- If the road is generally above the slot (away from the camera), use the `back`
  variant; otherwise `front`.
- Front art's default (unmirrored) entrance leans screen-right; back art's default
  leans screen-left (measured directly from the art). Mirror flips whichever variant
  is picked so the entrance leans toward whichever side the road is actually on.

`tdWithMirror` applies the mirror as a canvas transform (`translate → scale(-1,1) →
translate` around the tower's own center) wrapped around just the shadow and sprite
draws — the upgrade ring, targeting flash, and level-badge text are drawn outside that
wrapper so text doesn't render backwards and the flash still points at the real target
angle.

## Regen queue — tier 1 (silhouette) + tier 4 (palette), 2026-07-13

Play-testing on Frontier Town (owner, 2026-07-13) confirmed two of the four tiers
need a regen. Tiers 2 and 3 are approved as shipped.

### Why tier 1: reads as a treehouse, not a watchtower

This is the "tier 1 silhouette inconsistency" previously listed under Future work,
now confirmed bothering the eye in actual play. A tiny hut on one narrow post with a
big leaning ladder reads as a backyard treehouse / hunting deer-stand. It clashes two
ways: (a) every building on Frontier Town is wide, chunky, and ground-hugging — the
map's own watchtower vernacular is the palisade gatehouse: a solid timber box planted
on the ground; (b) tier 1 doesn't even read as the same building as its own upgrades
(measured ground-contact centroid: tier 1 at ~74% of its own image width; tiers 2–4
at ~49–51%).

### Why tier 4: coldest, brightest object on a warm map

Measured mean warmth (R−B of opaque pixels) and lightness, sprite vs map buildings:

| Object | Warmth (R−B) | Lightness |
|---|---|---|
| Map wooden house | +60 | 0.35 |
| Map gatehouse tower | +54 | 0.34 |
| Map smithy (stone building) | +34 | 0.35 |
| Ranger tier 2 | +42 | 0.33 |
| Ranger tier 3 | −12 | 0.32 |
| Ranger tier 4 | **−23** | **0.40** |

Every shipped battle map goes through the warm grade (grade B, `scripts/grade_map.py`
— gamma 0.75, sat ×1.15, warm +5%), so even the map's "grey" smithy stone leans brown.
The tower sprites never got that grade, and for tier 4 the coolness is painted in
(ice-blue stone + cyan crystal glow) — running the sprite through grade B was tested
directly and does NOT fix it; the palette starts ~57 points cooler than the map's own
stone. There's a thematic clash too: cyan glowing crystal reads frost/arcane on the
most mundane map in the game. The fix is a warm glow: amber/gold ember-light, which
also ties into the existing upgrade-feedback color language (upgrade ring and
max-level badge are already amber `#F59E0B` / gold). Tier 3's slight coolness (−12)
is acceptable — it reads as neutral grey next to the smithy and is approved as-is.

### Sizing: checked, no change

Render size is NOT part of the problem. All tiers render at the same height
(`renderH = cs × 1.9` ≈ 130px in Frontier Town's 2048-wide space, `tdRenderTowers`).
Measured against the map: regular houses ≈ 100px tall, the big barn (largest building)
≈ 140px — so the tower stands taller than every house and just under barn height.
Correct TD presence; keep `cs × 1.9`.

### Single-tier regen process (differs from the full-sheet pipeline)

1. Attach TWO reference images: `frontier-town.png` (style/palette/camera anchor, as
   always) AND the shipped neighbor tier as the silhouette/family anchor —
   `assets/towers/ranger-tier2.png` for the tier 1 regen,
   `assets/towers/ranger-tier3.png` for the tier 4 regen.
2. Paste the COMMON BLOCK (drop its "exactly 4 cells" paragraph), then the regen
   SUBJECT BLOCK below. Ask for **ONE cell, one image, 384×384, magenta background** —
   single-subject requests are what this model executes reliably (see Process notes
   #3: simplify).
3. Same alpha pipeline (`scripts/remove_magenta_bg.py`), no slicing needed. Save over
   `assets/towers/ranger-tier1.png` / `ranger-tier4.png`.
4. Regen the matching `-back` variant with the same Facing-variants amendment as
   before (window + ladder relocated to the back-left face). Diff the processed back
   file against the front to confirm it's genuinely different (see Facing variants
   process note #3 — the wrong-file-upload trap).
5. Before committing, composite all 4 tiers side-by-side onto Frontier Town at game
   scale (`cs × 1.9`) and check the family read. If the regen'd cell doesn't read as
   the same building line, regen the cell again — don't patch it.

### SUBJECT BLOCK — Tier 1 regen (replaces the original tier 1 spec)

> **Subject: a single tower, one image.** This is the tier-1 (base) stage of the
> attached reference tower: the SAME structure, footprint, camera angle, and scale,
> rebuilt entirely in rough-hewn raw timber — no stone anywhere. Match the attached
> tower's wide, centered ground footprint exactly: a sturdy timber-frame / log-crib
> base planted directly on the ground and filling the same width as the attachment's
> stone base — **NOT a single narrow post, stilt, or pole**. The ladder leans against
> the side of the base, same position as the attachment, visibly connecting to the
> elevated cabin. One small square window. Peaked hay/thatch roof (bundled thatch
> strands, warm golden-tan tone).
>
> The result must read as a frontier military watch platform — the same structural
> vernacular as a palisade corner tower — never as a treehouse or a hunting
> deer-stand.

### SUBJECT BLOCK — Tier 4 regen (replaces the original tier 4 spec)

> **Subject: a single tower, one image.** This is the tier-4 (ultimate) stage of the
> attached reference tower: keep the attachment's silhouette, footprint, camera
> angle, scale, and slate roof EXACTLY — only the materials change, in two ways:
>
> 1. The stone is warm grey — sun-warmed granite with subtle brown/tan undertones,
>    matching the stonework of the smithy building in the attached battle-map
>    reference. **Never blue, never icy, never cold grey.**
> 2. Veins of glowing molten gold/amber ember-light run through the mortar joints and
>    along the roof's ridge line — a warm orange-gold glow (`#F59E0B` family), like
>    forge-light seeping through the seams. **NOT cyan, NOT blue, NOT white
>    crystal.** The glow is subtle seam-light only — no flames, no floating
>    particles, no aura.

### Regen eyeball checklist (in addition to the main checklist above)

- [ ] Tier 1: ground contact is a wide centered base (centroid near the sprite's own
      horizontal center), ladder against the side — reads watchtower, not treehouse.
- [ ] Tier 4: stone leans warm/neutral (spot-check: mean R ≥ mean B over the sprite's
      opaque pixels), glow reads amber/gold, silhouette matches shipped tier 3.
- [ ] Family read: regen'd tier composited next to the untouched tiers on
      Frontier Town at `cs × 1.9` still reads as the same building line.

## Future work (deferred, not built yet)

- **Bastion and Mortar** get their own SUBJECT BLOCK using this same COMMON BLOCK,
  grid spec, and eyeball checklist, once there's a reason to prioritize them — including
  their own front/back facing variants, following the same process as Ranger's.
- ~~Tier 1 silhouette inconsistency~~ — promoted to the "Regen queue" section above
  (2026-07-13) after play-testing confirmed it. The shadow-placement side of it was
  already fixed by the silhouette-cutout shadow (see "Code-side shadow rendering"
  below).

## Code-side shadow rendering

The shadow is drawn by redrawing each tier's own sprite through the canvas
`brightness(0)` filter (blackens every RGB pixel, alpha untouched), then squashed
and sheared toward lower-left with a single shared affine transform
(`tdRenderTowerShadow` in `learn/drill/drill.js`). This makes the shadow a true
silhouette of whatever that tier's art actually is — a ladder casts a ladder-shaped
shadow, a wide stone base casts a wide stone-shaped one — instead of a generic
ellipse, and it requires no per-tier tuning: any future tier or tower type gets a
correct shadow automatically just by having art wired into `TD_TOWER_TIER_IMAGES`.
An earlier version used a plain ellipse (then a per-tier x-anchor correcting for
tier 1's off-center footprint specifically) — both were replaced once the
silhouette approach made per-tier tuning unnecessary.

**Squash factor is tuned for legibility, not physical accuracy.** The first
silhouette pass squashed to 24% height (closer to a "real" flattened shadow), which
looked right zoomed into a screenshot but crushed the ladder into an unrecognizable
blur at actual in-game cell sizes (as small as ~30px on a phone viewport) — thin
1-2px features like rungs just don't survive that much non-uniform bilinear
downscaling. Squash was relaxed to 50% (less flat, more of the sprite's vertical
structure preserved) specifically so the shape still reads as itself at real game
scale, confirmed by screenshotting the actual mobile-viewport render rather than a
zoomed-in crop — always check at true render size, not a magnified one, since
legibility problems like this don't show up when zoomed in.
