# Verdant Battle-Map Generation Prompts

One prompt per world-map spine node. Each battle map is themed to the landmark its
node sits beside (`battleTheme` in `learn/drill/assets/worlds/verdant/region-preset.json`).

## How to use this file

1. Open a Nano Banana session and **attach
   `learn/drill/assets/worlds/verdant/battlemaps/frontier-town.png` as the reference
   image** — it is the proven style/scale/camera anchor for battle maps. Do this for
   EVERY prompt; style prose alone does not hold (proven by A/B test, see
   `ART_DIRECTION_HANDOFF.md`).
2. Paste the **COMMON BLOCK** below, then the map's **SCENE BLOCK**, as one prompt.
3. Run the **eyeball checklist**. If it fails structurally (wrong lane count, forked
   exit), regenerate — do not try to edit topology, it doesn't work. Small scenery
   flaws are fine; markers/towers cover a lot.
4. Save the keeper as `learn/drill/assets/worlds/verdant/battlemaps/<battleTheme>.png`
   (exact names in the table). Push to main.
5. The Gemini sparkle watermark is unavoidable — it gets cleaned in post during
   authoring, don't burn rolls on it.
6. Authoring (waypoint lane + build-slot JSON) happens after art lands, in a Claude
   session: road-mask extraction → waypoints ordered spawn→leak → slots verified
   against clearings → `<battleTheme>.json` (schema template:
   `battlemaps/frontier-town.json`).

## Difficulty ladder

Direction convention (all maps): **defended objective/exit on the RIGHT edge**;
enemies enter from left/top/bottom edges and flow left→right. Battle scenes are
camera-relative, not compass-aligned with the world map.

| # | Node | Name | battleTheme | Entrances | Lanes | Clearings | Mood |
|---|------|------|-------------|-----------|-------|-----------|------|
| 0 | start | Frontier Town | `town-gate` | 1 (W) | 1 | 11 | morning — **DONE** |
| 1 | n1 | Windmill Crossing | `windmill-bridge` | 1 (W) | 1 | 8–10 | morning |
| 2 | n2 | Scarecrow Fields | `farmland` | 1 (W) | 1 | 9–11 | midday |
| 3 | n3 | Miller's Homestead | `farmstead` | 1 (S) | 1 | 9–11 | midday |
| 4 | n4 | Abandoned Village | `ruins` | 1 (W) | 1, tight corners | 10–12 | thin overcast |
| 5 | n5 | Shepherd's Pasture | `pasture` | 2 (W+S) | 2 → merge mid | 10–12 | bright |
| 6 | n6 | Beehive Bend | `apiary` | 1 (W) | 1, longest path | 10–12 | golden afternoon |
| 7 | n7 | The Watchtower | `crag-tower` | 2 (NW+W) | 2 around crag → merge | 11–13 | clear |
| 8 | n8 | The Standing Stones | `stone-circle` | 2 (W+S) | 2, late merge | 11–13 | pale sun |
| 9 | n9 | Charcoal Burners' Camp | `charcoal-camp` | 2 (W+S) | 2, lanes CROSS once | 12–14 | hazy smoke |
| 10 | n10 | Logging Camp | `timber-camp` | 3 (NW+W+SW) | 3 → staged merges | 12–14 | day |
| 11 | n11 | The Lone Monolith | `moor-monolith` | 3 (W+N+S) | 3, late merge | 12–14 | overcast |
| 12 | n12 | The Corrupted Mile | `blighted-forest` | 3 (W+NW+S) | 3, staged merges | 12–14 | grey gloom |
| 13 | boss | The Ruined Keep | `keep-siege` | 3 (W+N+S) | 3 → causeway | 13–15 | darkest, mist |

---

## COMMON BLOCK — paste first in every prompt

> Attached image is the **style, palette, camera-angle, and zoom reference** — match
> its painted-pixel-art rendering exactly: same dithered shading, same saturation,
> same camera (steeper than a typical 3/4 view, buildings show a front face and trees
> show side volume — NEVER pure vertical top-down), and the **same zoom level** (the
> road the same width, trees the same size). Create a completely new composition; do
> not copy the reference layout.
>
> Landscape 16:9. **No horizon, no sky, no atmospheric distance — the whole canvas at
> one overhead height and scale.** **No parchment border, no frame, no compass** —
> terrain runs full-bleed to every edge; this is a game playfield, not a map.
>
> **Road rules:** every road is a wide dirt road (two carts wide), winding and
> organic, never straight. Roads touch the canvas edges ONLY at the entrances and the
> single exit named below. All entrance roads eventually merge so that **exactly ONE
> road exits at the RIGHT edge**. No forks other than the merges described. Roads
> never fade out or pass under solid scenery.
>
> **Build clearings:** the number given below of **small, flat, open grass clearings,
> completely empty of objects**, each roughly three cart-lengths across, distributed
> along BOTH sides of every road over its whole length — deliberate flat pads, not
> big lawns. All scenery stays out of the clearings and off the roads.
>
> **Forbidden:** text, letters, numbers, labels, icons, markers, glowing pins, people,
> animals, enemies, towers, weapons — the battlefield is empty and waiting.

---

## SCENE BLOCKS

### 1 — Windmill Crossing (`windmill-bridge.png`)

> **Scene: a stream crossing beside a windmill — an easy early battlefield.**
> A single road enters at the **left edge**, winds east in two lazy curves, crosses a
> north–south **stream** over a single **stone bridge** at mid-map, and exits at the
> **right edge**. The stream runs from the top edge to the bottom edge, splitting the
> field; the bridge is the only crossing. On a low grassy knoll just north of the
> bridge stands a **windmill** with wide sails. Scenery: split-rail fences, stacked
> wheat sheaves, a grain cart, two or three oak trees, wildflower tufts, forest fringe
> along the top and bottom edges. Morning light, peaceful.
> **8 to 10 build clearings.** Exactly one of each: road, stream, bridge, windmill.

### 2 — Scarecrow Fields (`farmland.png`)

> **Scene: open crop fields under a wide sky-less noon — an easy battlefield.**
> A single road enters at the **left edge**, makes one long lazy S through the middle
> of the map, and exits at the **right edge**. Either side of the road: rectangular
> **tilled crop strips** in varied greens and browns, separated by low hedgerows, with
> **three scarecrows** standing in different fields (posts and straw, not creatures).
> Scenery: a hay wagon, a water trough, a lone large oak, low hedges, forest fringe
> top and bottom. Bright midday light.
> **9 to 11 build clearings** set as mown pads between the crop strips.
> Exactly one road. Exactly three scarecrows.

### 3 — Miller's Homestead (`farmstead.png`)

> **Scene: a working farmstead — an easy battlefield with a bottom entrance.**
> A single road enters at the **bottom edge**, left of center, curves north then bends
> east around the farm buildings, and exits at the **right edge**. The farmstead sits
> in the upper-left: a large thatched **farmhouse**, a **granary** on staddle stones,
> and a small **water mill** with its wheel in a pond fed by a short stream from the
> top edge (the road never crosses the water). Scenery: an orchard of six to eight
> fruit trees in rows, fences, a vegetable plot, a woodpile, chicken coop (empty).
> Midday light. **9 to 11 build clearings.**
> Exactly one of each: road, farmhouse, granary, mill, pond.

### 4 — Abandoned Village (`ruins.png`)

> **Scene: a village lost to time — tight corners between broken walls.**
> A single road enters at the **left edge** and picks its way east through a **ruined
> village** — six to eight roofless cottages with collapsed thatch, broken stone
> walls, and doorways open to the weather — before exiting at the **right edge**. The
> road takes SHORT, TIGHT bends around the ruins, unlike the lazy country curves of
> other maps: three or four sharp corners where walls force the road to turn.
> Scenery: rubble piles, a dry stone well, an overgrown cart with a broken wheel, ivy
> on the walls, weeds cracking the old lane, forest fringe top and bottom. Thin
> overcast light, quiet and eerie but still green and alive — this is neglect, not
> corruption. **10 to 12 build clearings**, several of them inside roofless building
> shells (readable as flat floor pads open to the sky).
> Exactly one road. No intact buildings.

### 5 — Shepherd's Pasture (`pasture.png`) — FIRST TWO-LANE MAP

> **Scene: highland sheep pasture — the first battlefield with two approaches.**
> TWO roads: one enters at the **left edge**, one enters at the **bottom edge** left
> of center. They wind toward each other and **merge at a wide gate in a dry-stone
> wall at mid-map**, continuing east as ONE road that exits at the **right edge**.
> A long **dry-stone wall** crosses part of the field with the gate at the merge
> point. Scenery: two fenced sheep pens standing empty (the flock driven to safety),
> a small shepherd's hut with a peat roof, a wool cart, scattered boulders, gorse
> bushes, forest fringe top edge only — the bottom edge is open moor grass where the
> south road enters. Bright upland light.
> **10 to 12 build clearings**, including two or three positioned where they can see
> BOTH roads before the merge. Exactly two entrance roads merging into one exit road;
> one wall gate; one hut.

### 6 — Beehive Bend (`apiary.png`)

> **Scene: a honey farm in golden light — one lane, but the longest road in the
> region.** A single road enters at the **left edge** and takes an EXTREME winding
> course: two full hairpin bends — first sweeping far north around a cluster of
> **woven-skep beehives**, then far south around a second larger hive cluster and a
> **honey shed** — before exiting at the **right edge**. The road's course should be
> nearly twice as long as a direct crossing. Scenery: eight to ten beehives across the
> two clusters, wildflower meadows in full bloom everywhere (the bees' pasture), a
> flowering orchard corner, a honey cart with barrels, forest fringe top and bottom.
> Warm golden afternoon light. **10 to 12 build clearings** tucked into the hairpin
> loops — the loops should surround pads that see the road on multiple sides.
> Exactly one road, two hive clusters, one shed.

### 7 — The Watchtower (`crag-tower.png`)

> **Scene: a rocky crag commanding the road — two lanes around the high ground.**
> A grey **rocky crag** rises at center-map with a wooden **watchtower** on its top.
> TWO roads: one enters at the **upper-left edge**, one at the **left edge** lower
> down. They pass on OPPOSITE sides of the crag — north lane and south lane — and
> **merge just east of the crag**, exiting as one road at the **right edge**.
> Scenery: scree slopes and boulders around the crag base, a climbers' path (thin
> foot-trail, clearly narrower than the roads) zigzagging up to the tower, wind-bent
> pines, a small spring pool, forest fringe top and bottom. Clear cool light.
> **11 to 13 build clearings**, including two or three ROCKY LEDGE pads on the crag's
> flanks that overlook both lanes — flat stone platforms, visually distinct from the
> grass pads. Exactly two entrance roads merging into one exit; one crag; one tower.

### 8 — The Standing Stones (`stone-circle.png`)

> **Scene: an ancient stone circle on open moor — two lanes that stay apart.**
> TWO roads: one enters at the **left edge** and runs east across the NORTH half,
> passing beside a **circle of nine tall standing stones**; the other enters at the
> **bottom edge** and runs northeast along a shallow grassy **gully** in the south
> half. They stay far apart for most of the map and **merge only in the final quarter**
> before exiting at the **right edge** — defenders must split their attention.
> Scenery: the megalith circle with a flat altar stone, two lone outlier monoliths,
> moor grass, heather patches, a scatter of boulders, a single wind-twisted tree,
> sparse forest fringe on the top edge only. Pale watery sunlight, mystical calm.
> **11 to 13 build clearings**, deliberately WEIGHTED: more pads along each separate
> lane, only two or three covering the merged final stretch.
> Exactly two entrance roads with one late merge; nine stones in the circle.

### 9 — Charcoal Burners' Camp (`charcoal-camp.png`) — LANES CROSS

> **Scene: a smoky woodland industry — two lanes that CROSS each other.**
> TWO roads: one enters at the **left edge**, one at the **bottom edge**. They **cross
> each other once at a wide dirt junction at mid-map** — continuing PAST each other —
> then bend back toward one another and **merge in the final third**, exiting as one
> road at the **right edge**. The crossing means every enemy passes the junction
> twice-over territory: pads near the junction see both lanes.
> Scenery: three smoking **charcoal mounds** (earth-covered domes with thin smoke
> wisps), a burners' hut, long drying racks of split wood, soot-darkened ground
> patches, stacked billets, dense forest fringe top and bottom (this is deep
> woodland). Hazy, smoke-softened light. **12 to 14 build clearings.**
> Exactly two entrance roads, one crossing junction, one merge; three mounds.

### 10 — Logging Camp (`timber-camp.png`) — FIRST THREE-LANE MAP

> **Scene: a great timber operation — three approaches out of the cut forest.**
> THREE roads: entering at the **upper-left edge**, the **left edge**, and the
> **lower-left edge**. The upper and middle roads **merge in the second quarter**;
> the lower road runs alone longer and **merges in the third quarter**; ONE road
> exits at the **right edge**. Massive **log piles** — stacked trunks taller than a
> cart — line stretches of the roads like walls, shaping the lanes. Scenery: a
> sawyers' pit, two log sledges, a foreman's hut, a field of fresh tree stumps
> across the left half (the cut zone — open ground, long sightlines), dense uncut
> forest on the right half and fringes. Plain working daylight.
> **12 to 14 build clearings**, several set BETWEEN log-pile walls so their coverage
> is deliberately channeled. Exactly three entrance roads merging in two stages.

### 11 — The Lone Monolith (`moor-monolith.png`)

> **Scene: a vast bare moor under a grey sky-less light — three far-flung lanes.**
> THREE roads: entering at the **left edge**, the **top edge** left of center, and
> the **bottom edge** left of center. They cross the open moor far apart — almost no
> cover between them — and **converge together at a single towering carved MONOLITH**
> standing right of center, where they become ONE road exiting at the **right edge**.
> Scenery: the monolith (tall, weathered, faintly carved), low heather and moor
> grass, half-buried boulders, two or three shallow peat pools, wisps of ground mist
> in the hollows, a single ruined sheepfold, NO forest except thin fringes at the
> corners — this map is defined by open emptiness and long sightlines. Overcast,
> cold light. **12 to 14 build clearings** — on this map they read as drier, flatter
> turf pads amid the heather. Exactly three entrance roads converging at one point;
> one monolith.

### 12 — The Corrupted Mile (`blighted-forest.png`) — FIRST CORRUPTED MAP

> **Scene: the land begins to die — three lanes through a blighted wood.**
> THREE roads: entering at the **left edge**, the **upper-left edge**, and the
> **bottom edge**. The upper two **merge in the second quarter**; the south road
> **merges in the final third**; ONE road exits at the **right edge** into deeper
> darkness. **Palette shift — this is the transition map:** the greens are dulled and
> grey-tinged, half the trees are bare and black-branched, the grass is patchy with
> ash-grey earth showing through. Ground mist pools between the trees. Scenery: dead
> and dying trees mixed with a few last living ones, a corrupted stream bed (dry,
> stained dark), a abandoned wayside shrine with its offerings scattered, twisted
> briars, ravens' nests in bare crowns (no birds visible). Grey, dim, cold light —
> but still clearly the same painted-pixel-art style as the reference, just a sicker
> palette. **12 to 14 build clearings** as pale dead-grass pads.
> Exactly three entrance roads merging in two stages.

### 13 — The Ruined Keep (`keep-siege.png`) — BOSS MAP

> **Scene: the siege of the Ruined Keep — the final battlefield.**
> The ivy-covered **RUINED KEEP** stands at the **right edge**, its broken gate arch
> the exit point. THREE roads: entering at the **left edge**, the **top edge**, and
> the **bottom edge**. All three converge in stages onto a raised stone **causeway**
> in the final quarter — the causeway runs straight to the keep gate, flanked by a
> dry moat ditch on either side. **Palette: fully corrupted** — grey-black earth,
> dead trees, heavy mist banks at the map edges, the only color the sickly green of
> the ivy and a faint ominous glow from inside the keep's gate. Scenery: siege
> debris (a broken ram, scattered shields — no intact weapons), fallen masonry
> blocks, a shattered outer wall the roads pass through as broken gaps, brackish
> moat pools, crow-picked wagon wrecks. Darkest mood in the region — but the same
> painted-pixel-art rendering as the reference throughout.
> **13 to 15 build clearings**, including two flat rampart stubs of the outer wall
> overlooking the causeway (stone pads, like the crag ledges of the watchtower map).
> Exactly three entrance roads; one causeway; one keep at the right edge.

---

## Eyeball checklist (run on every output before saving)

1. **Trace every entrance to the exit with one finger** — each declared entrance
   reaches the single right-edge exit; merges match the spec; no undeclared forks.
2. **Count the clearings** — inside the stated range, each pad small and empty.
3. **Camera** — buildings show fronts; not straight-down, no horizon or border.
4. **Zoom** — road width ≈ the reference's road width. Wider = too close; regen.
5. **Count guards held** (bridges, towers, monoliths, etc. per scene block).
6. Sparkle watermark is expected; ignore it (cleaned in post).

## After art lands

Push keepers to `learn/drill/assets/worlds/verdant/battlemaps/<battleTheme>.png`,
then run an authoring session per map (Claude): watermark cleanup → road mask →
waypoint lanes (each entrance = one lane entry, ordered spawn→leak) → build slots
verified in clearings → `<battleTheme>.json` per the `frontier-town.json` schema.
