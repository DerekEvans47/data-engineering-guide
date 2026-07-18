# _reference — Art Pipeline & Canonical Reference Sheets

Not loaded by the game. This directory is the source of truth for how painted
art gets designed, generated, QC'd, and shipped. One subdirectory per
character (`goblin/`, later `man_at_arms/`, `bandit/`, …), each containing:

- `reference.png` — the **ground-truth panel**: shipped frames enlarged,
  measured palette, engine spec, do-not list. Built by
  `tools/build-reference.py` from the live assets, so it cannot drift.
  **This is the image you attach to every generation prompt.**
- `reference.html` — the panel source (the .png is a render of it).
- `source/` — raw generator outputs that were accepted (provenance).

## The pipeline

**Stage 0 — Ground truth.** Regenerate `reference.png` whenever a character's
shipped sheets change (`python3 tools/build-reference.py <char>`, render step
documented in the script header). Add new characters to `SHEETS` in the script.

**Stage 1 — Design sheet (new characters only).** Before any production art,
iterate in the generator on a rich model sheet (turnaround, key poses, tier
variants side by side) with the style constants attached — the goblin
`reference.png` anchors scale and style until the new character has its own.
Approve the design *before* making strips. Generated text on design sheets is
disposable; never rely on it.

**Stage 2 — Production strips.** One animation per generation request (walk,
then attack, then death) — small asks drift less. Judge results only on
character/pose/style. **Never reject for file geometry** (frame counts, exact
dimensions, background) — geometry is fixed mechanically in Stage 3.

**Stage 3 — QC + mechanical conversion.** Key out the background (request a
flat magenta bg if the tool can't emit true alpha — never checkerboard),
slice frames, scale the character to match the walk sheet's content height,
align feet to the shared baseline, and check the numbers against the
reference: palette distance per ramp, outline-halo coverage (goblin canon:
46% of opaque pixels), saturation ceiling. Synthesize the halo by dilating
the alpha mask with `#140F0A` if the generator drew thin outlines.

**Stage 4 — Integration.** File under `assets/enemies/` (or the relevant
family dir), wire `TD_ENEMY_SHEET_IMAGES`/config, add to `sw.js` ASSETS,
bump the cache, run the browser verifier, PR + merge.

## Style constants (apply to every character)

- Muted, desaturated palettes — never lime/cartoon saturation.
- Thick warm-black halo outline (`#140F0A`) around the full silhouette —
  the single most identifying trait of the game's art.
- Hand-painted low-res: soft blended shading and AA edges are correct;
  this is not strict indexed pixel art.
- Scale ladder (vs a ~2.5-cell house): goblin ≤ ¼ house · human-sized ≈ ½
  house · bosses ≈ full house.
- Characters: side view facing right, feet on a shared baseline,
  transparent RGBA, no baked shadows, no text in generated images.

## Family specs

- **Enemies & allied soldiers** (animated strips): 110px frame height
  baseline (taller allowed for pose headroom with a per-anim scale override,
  e.g. goblin attack = 118px); walk 2f / death 4f / attack 4f.
- **Towers** (static tier images, see `TD_TOWER_TIER_IMAGES`): per-level
  art, front + back variants, rendered ~1.9 cells tall — no animation
  strips. Same palette/outline/painted-style constants apply.
