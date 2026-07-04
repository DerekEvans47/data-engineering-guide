# Verdant World — Battle-Map Generation Prompts

The foundational (master) prompt for generating battle-map art with Nano
Banana (Gemini), plus a unique, ready-to-assemble prompt block for each of the
14 Verdant region levels. Future sessions: read this whole header before
generating anything, then see `docs/MAP_ART_PIPELINE.md` for the mandatory
post-processing every export goes through (watermark removal, edge crop,
acceptance checklist).

## How to use

1. Take the **master prompt** below and replace each `[SLOT]` with the
   level's values from its block in the per-level section.
2. **Attach the style reference image**
   (`learn/drill/assets/reference/verdant-style-reference.png`) with every
   generation — it anchors art style far more reliably than prose. It carries
   style only; composition must come from the text.
3. Generate **fresh** each attempt. Never ask the model to structurally edit a
   previous image (move a road, rezoom, remove people) — structural edits
   drift; only small additive edits ("add a hamlet in this empty field, keep
   everything else identical") work.
4. Expect the road-edge and watermark defects anyway; the pipeline doc fixes
   them deterministically in post.

## Design rules baked into the master (do not remove)

- **The border must justify the path.** Impassable terrain (dense forest for
  Verdant) rings the scene, so "why don't enemies go around?" is answered by
  the art. The tree line breaks only where roads cross the frame edge.
- **No forced tower choices.** Clearings form a *gradient* of usefulness, not
  binary sniper-vs-everything slots: most clearings sit close enough to the
  path that every tower type functions (a mortar might cover only one bend —
  weak but legal), a couple hug the road (premium for short-range), and at
  most 1–2 sit in the true fringe. Never accept a map where a cluster of
  clearings only works for long-range towers.
- **False elevation is welcome, flatness is not required.** Low cliffs, rocky
  ledges, terraced banks, a crag with a clearing on top — purely cosmetic
  (the engine is flat), so elevation must never overhang or hide the road or
  any clearing.
- **Path complexity ramps across the region** (see table). Early levels:
  one winding road. Mid levels: forks that reconverge. Later levels: multiple
  entrances. Final ~2 levels only: multiple exits — the rare, hard variant.
  (Engine note: today's engine walks a single waypoint path; multi-path play
  is backlog item G-9. Generate the art with the branches anyway — art leads
  code, and an unused branch reads as an honest side road until G-9 lands.)
- Tower range context for wiring (cells): Mortar 2.8–3.3, Bastion 3.0–3.6,
  Ranger 4.5–6.0. "Close to the path" ≈ within ~2.5 cells of some segment.

## Master prompt (fixed layer)

```
A top-down fantasy battle-map scene in painted-pixel-art style.

SCENE: [LEVEL SCENE — landmarks, mood, elevation feature if any].
[PALETTE LINE].

PATHS: [PATH SPEC — entrances, exits, branching]. Every road is a worn dirt
path cut off by the frame where it enters or exits — this image is a cropped
section of a larger world and each road visibly continues beyond the canvas.
Roads never dead-end in an open field or clearing.

COMPOSITION: Dense, dark, impassable pine forest fills the border of the
canvas on all sides — a thick band of old-growth trees pressing in on the
scene. The tree line breaks open only where a road crosses the frame edge.
No vignette framing beyond the forest itself: the world visibly continues
past all four edges.

CLEARINGS: Include [CLEARING COUNT] organic, irregular open grass clearings —
natural rounded patches of flat ground, not geometric shapes, not squares,
not bare dirt rectangles. Distribute them at varied distances from the
roads: several right beside the road, most within a short walk of it, and at
most one or two out in the grassy fringe. Each clearing is separate from the
road, with a strip of grass between them — never attached to or carved out
of the road itself. Each clearing is completely empty and unobstructed: no
trees, rocks, fences, props, or animals inside.

CONTENT RULES: No people or human figures anywhere in the scene. Livestock
(sheep, goats, chickens) welcome where scene-appropriate. No text, letters,
numbers, labels, icons, pins, arrows, watermarks, logos, or sparkle marks
anywhere in the image.

CAMERA: Steeper and more overhead than a typical 3/4 perspective — the
viewer standing much higher up and tilting their view down toward the
ground, closer to bird's-eye, though not perfectly flat orthographic; trees
and rocks show much more of their top surface and much less of their side
profile.

RENDERING: Painted-pixel-art, rich painterly dithered shading, soft
consistent lighting, saturated fantasy palette, clean readable shapes.

SCALE & FRAME: No horizon, no sky, no atmospheric distance — the entire
canvas is seen from the same overhead height at the same scale, edge to
edge. Aspect ratio approximately 2.16:1. The largest structure occupies
roughly [SCALE ANCHOR]% of the canvas width.
```

**Default palette line (levels 1–11):** `Healthy deep greens and warm
late-afternoon light, earthy and weathered, muted saturation. The mood is
adventurous and slightly tense — a frontier region, not cozy or pastoral.`

## Path-complexity ramp

| Levels | Paths |
|---|---|
| Frontier Town → Miller's Homestead | Single winding road |
| Abandoned Village → Beehive Bend | One entrance, fork that reconverges, one exit |
| The Watchtower → The Lone Monolith | Two entrances converging, internal branching, one exit |
| The Corrupted Mile | Two entrances, **two exits** (hard) |
| The Ruined Keep (boss) | Two entrances, two defended keep breaches (functionally two exits) |

---

## Per-level prompts

### 1. Frontier Town (`town-gate`) — start

- **SCENE:** A fortified frontier waypoint carved out of deep forest. In the
  heart of the clearing: Frontier Town — 6–8 rugged timber-and-stone
  buildings (garrison hall, smithy with smoking chimney, supply depot with
  stacked crates and barrels, houses) and a wooden watchtower rising above
  the rooftops. Banners and torch posts line the road. A wooden palisade wall
  with a fortified gatehouse spans the clearing at each end of town,
  stretching from forest edge to forest edge — the road through the gates is
  the only way through.
- **PATHS:** One road: emerges from the forest at the LEFT edge, passes
  through the first gatehouse, crosses the town, exits the second gatehouse
  and disappears into the forest off the RIGHT edge.
- **CLEARINGS:** 6–8. **SCALE ANCHOR:** 8–12 (houses).
- Status: generated and cleaned — `Gemini_Generated_Image_i7e101i7e101i7e1.png`
  (root, awaiting integration).

### 2. Windmill Crossing (`windmill-bridge`)

- **SCENE:** A river crossing in rolling farmland. A stone-and-timber windmill
  with slowly weathered sails stands on a low grassy rise beside the river
  (false elevation: the mill's knoll, with a clearing partway up). A sturdy
  wooden bridge carries the road over the water; reeds, a small dock, a
  miller's shed. The river enters and exits under the forest border.
- **PATHS:** One road: LEFT edge → winds to the bridge (natural chokepoint)
  → RIGHT edge.
- **CLEARINGS:** 6–8, at least one on the mill's rise. **SCALE ANCHOR:** 10–15 (windmill).

### 3. Scarecrow Fields (`farmland`)

- **SCENE:** Broad wheat and vegetable fields divided by hedgerows and rail
  fences, dotted with crooked scarecrows (weathered, slightly eerie, arms
  askew — scarecrows are props, not people). A hay barn, a well, stacked hay
  bales. Crows perched on fence posts.
- **PATHS:** One road: LEFT edge → lazy S-curve between the fields → RIGHT
  edge.
- **CLEARINGS:** 7–8 (fallow patches between fields read naturally).
  **SCALE ANCHOR:** 8–12 (barn).

### 4. Miller's Homestead (`farmstead`)

- **SCENE:** A prosperous but isolated homestead: farmhouse with stone
  chimney, grain barn, root cellar door set into a low earthen bank (false
  elevation), a duck pond, fenced paddocks, an orchard corner. A dog-less,
  person-less working farm holding its breath.
- **PATHS:** One road: TOP-LEFT edge → curls around the pond and through the
  homestead yard → BOTTOM-RIGHT edge.
- **CLEARINGS:** 7–8. **SCALE ANCHOR:** 10–14 (farmhouse).

### 5. Abandoned Village (`ruins`) — first fork

- **SCENE:** A village emptied years ago: collapsed thatch roofs, roofless
  stone cottages swallowed by ivy, a cracked well, an overgrown village
  square with a leaning signpost (no readable text). Grass grows through the
  road. Mood shifts one notch quieter and stranger — still Verdant greens,
  but cooler light.
- **PATHS:** One road enters at the LEFT edge, **forks at the village square
  into two routes** — one through the ruined main street, one skirting the
  back gardens — and **reconverges** before exiting the RIGHT edge.
- **CLEARINGS:** 8–9 spread across both routes so both are defensible.
  **SCALE ANCHOR:** 8–12 (largest ruin).

### 6. Shepherd's Pasture (`pasture`)

- **SCENE:** Rolling sheep country: drystone walls terracing two low green
  hills (false elevation: walled terraces with clearings on top), grazing
  sheep flocks, a shepherd's stone bothy with a smoking chimney, a wooden
  sheepfold. A spring-fed stream threading between the hills.
- **PATHS:** One road enters at the LEFT edge, **forks around the larger
  hill** — low route through the valley, high route over a terraced
  shoulder — **reconverges**, exits RIGHT edge.
- **CLEARINGS:** 8–9, including 2 on terrace tops (ranged-favoring but still
  in reach of the valley path for mid-range towers). **SCALE ANCHOR:** 8–10 (bothy).

### 7. Beehive Bend (`apiary`)

- **SCENE:** A flowering meadow inside a tight river bend — wildflower drifts,
  rows of woven straw bee skeps on low wooden stands, a honey-gatherer's hut,
  a plank footbridge. Bees suggested as faint golden specks around the skeps.
  The river hems in one whole side of the scene.
- **PATHS:** One road enters at the TOP edge, **splits around the apiary
  meadow** — riverside route and forest-side route — **reconverges** at the
  footbridge, exits the BOTTOM edge.
- **CLEARINGS:** 8–9. **SCALE ANCHOR:** 8–10 (hut).

### 8. The Watchtower (`crag-tower`) — two entrances begin

- **SCENE:** A rocky crag rising from the forest (the map's false-elevation
  centerpiece: layered stone ledges, scree slopes), crowned by a weathered
  round watchtower with a fire brazier at its top. A switchback trail climbs
  the crag; pines cling to the rock. Clearings sit on ledges at different
  heights.
- **PATHS:** **Two roads enter** — LEFT edge and BOTTOM edge — meet below
  the crag, and one combined road exits the RIGHT edge past the tower.
- **CLEARINGS:** 8–10, several on ledges overlooking the merge point.
  **SCALE ANCHOR:** 12–16 (the tower — hero landmark).

### 9. The Standing Stones (`stone-circle`)

- **SCENE:** A megalithic circle on open moorland — tall lichen-covered
  standing stones, a fallen lintel, faint concentric rings worn into the
  grass around them. Heather and gorse patches, scattered boulders, thin
  ground mist at the forest border. Ancient, watchful, not yet corrupted.
- **PATHS:** **Two roads enter** — TOP-LEFT and BOTTOM-LEFT edges — and
  **braid around the stone circle** (passing on opposite sides) before
  merging and exiting the RIGHT edge.
- **CLEARINGS:** 9–10; the circle's center is NOT a clearing (the stones
  own it). **SCALE ANCHOR:** 10–14 (tallest stone).

### 10. Charcoal Burners' Camp (`charcoal-camp`)

- **SCENE:** A soot-stained working camp in a half-cleared wood: dome-shaped
  earthen charcoal kilns seeping thin smoke, cordwood stacks, a burners' hut,
  blackened ground patches, tree stumps. Hazy air, embers glowing in one
  kiln's vent.
- **PATHS:** **Two roads enter** — LEFT and TOP edges — link through the camp
  with a **connecting spur between them** (a working track), merge, exit
  RIGHT edge.
- **CLEARINGS:** 9–10 (burned-bare patches read naturally as clearings).
  **SCALE ANCHOR:** 8–10 (kilns).

### 11. Logging Camp (`timber-camp`)

- **SCENE:** An industrial-scale logging operation: log piles taller than
  huts, a saw pit, a log flume on trestles running downhill toward the river
  (false elevation: the flume's slope), stump fields, two-man saws leaning on
  racks, an ox-cart loaded with trunks. The forest border visibly gnawed back
  by the clearing work.
- **PATHS:** **Two roads enter** — LEFT and BOTTOM edges — with an internal
  fork around the log piles, merge at the camp center, exit TOP-RIGHT edge.
- **CLEARINGS:** 9–11 (stump fields excuse many). **SCALE ANCHOR:** 8–12 (main shed).

### 12. The Lone Monolith (`moor-monolith`)

- **SCENE:** Bleak high moorland under wide gray-green light. One colossal
  weathered monolith dominates the scene from a raised tor (false elevation),
  carved with faint unreadable spiral grooves. Bog pools, cotton-grass,
  leaning waymarker stones, drifting mist ropes. The first genuinely ominous
  map — corruption hinted only by a thin gray tinge to the moor grass near
  the monolith (≤10% of frame).
- **PATHS:** **Two roads enter** — LEFT and TOP edges — merge below the tor,
  and the combined road exits the RIGHT edge, skirting the monolith's base.
- **CLEARINGS:** 9–11, including 2 on the tor's shoulder. **SCALE ANCHOR:** 12–16 (monolith).

### 13. The Corrupted Mile (`blighted-forest`) — two exits

- **SCENE:** The forest dying by degrees: healthy pines at the frame edges
  graying and going leafless toward the center, weeping black sap, gray mist
  pooling in hollows, a ruined waystation with a collapsed roof, crows.
  Corruption owns ~30–40% of the frame (the sick heart of the map), Verdant
  green surviving at the borders. Palette line for this level: `Verdant
  greens at the edges decaying to ash-gray and sickly olive at the center;
  cold light, heavy mood.`
- **PATHS:** **Two roads enter** — LEFT and BOTTOM-LEFT edges — merge at the
  waystation, then **split again into two exits** (TOP-RIGHT and
  BOTTOM-RIGHT edges). The hard map: defenses must cover both escape routes.
- **CLEARINGS:** 10–12, spread so BOTH exit branches are defensible without
  abandoning the other. **SCALE ANCHOR:** 8–12 (waystation).

### 14. The Ruined Keep (`keep-siege`) — boss

- **SCENE:** An ancient keep reclaimed by nature — shattered curtain wall,
  one standing tower, ivy and young trees growing from the rubble — now
  freshly re-fortified by *something*: crude barricades, black banners (no
  readable symbols), braziers burning cold gray flame. Corruption confined
  to the keep and its immediate ground (~15% of frame); the surrounding
  forest still green. Palette line: `Verdant greens pressing in on a
  gray-stone, cold-lit ruin; late dusk, long shadows, siege mood.`
- **PATHS:** **Two roads enter** — LEFT and BOTTOM edges — and each drives
  at its own **breach in the keep's broken wall** (north breach and south
  breach). Both roads terminate at the keep: two defended endpoints,
  functionally two exits. Landmark-terminus map — never crop the keep side
  (see pipeline doc).
- **CLEARINGS:** 10–12, several in the shadow of the outer wall covering
  both breach approaches. **SCALE ANCHOR:** 18–22 (the keep — final boss
  landmark, allowed to break the normal building cap).

---

## Wiring reminders (after art is accepted)

- Hand-place waypoints, build slots (in clearings), and confirm the near/far
  clearing mix against real tower ranges (see the ramp table's engine note —
  multi-path levels need G-9 before both branches are live).
- Run the full `docs/MAP_ART_PIPELINE.md` checklist on every export before
  committing it.
