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

**Status: Ranger — DONE, shipped, all 4 tiers wired.**
`learn/drill/assets/towers/ranger-tier{1,2,3,4}.png` are wired into
`TD_TOWER_TIER_IMAGES`/`tdRenderTowers`, with `TD_TOWER_DEFS.ranger` carrying 3
upgrades (4 total levels) to match. See "What actually shipped" below for the exact
spec that produced the approved art, and "Process notes" for lessons from the
iterations that didn't.

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

## Future work (deferred, not built yet)

- **Bastion and Mortar** get their own SUBJECT BLOCK using this same COMMON BLOCK,
  grid spec, and eyeball checklist, once there's a reason to prioritize them.
- **Multiple view variants by map position** (the camera-pitch-by-depth-zone idea from
  process note 3) — explicitly deferred until the single-view Ranger tower is proven
  out in the actual game. If revisited, generate it as its own follow-up pass per
  tower (not bundled into the initial tier-progression generation) given how process
  note 3 went the one time both were attempted together.
- **Tier 1 silhouette inconsistency (known asset issue, cosmetic only now):** tiers
  2–4 share a wide, centered stone/wood base with a ladder leaned against one side —
  tier 1 instead sits on a narrow single post with a separate ladder planted well off
  to one side (measured: tier 1's ground-contact centroid sits at ~74% of its own
  image width; tiers 2–4 sit at ~49–51%). This violates the "same footprint"
  silhouette-continuity rule above. It no longer causes a shadow-placement bug — the
  shadow is now a silhouette cutout of each tier's own sprite (see "Code-side shadow
  rendering" below), so it automatically follows tier 1's off-center post+ladder
  shape instead of needing to be manually anchored to it — but the tower design
  itself is still inconsistent art-direction-wise across tiers. Worth a regen of
  tier 1 alone (matching tiers 2–4's centered stone base silhouette, with the
  wood-only tier-1 materials) if this keeps bothering the eye in play-testing.

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
