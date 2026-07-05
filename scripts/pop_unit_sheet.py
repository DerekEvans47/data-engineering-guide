#!/usr/bin/env python3
"""Apply the Unit Readability Standard to a packed sprite sheet.

Any gameplay object rendered ON the battlefield at sub-cell size (enemies,
troops, pickups) gets this pass before its sheet is committed — see
docs/MAP_ART_PIPELINE.md "Unit Readability Standard" for the decision
rationale (Kingdom Rush-style separation: units must never share the
terrain's palette or sink into its texture).

What it does, per cell:
  1. Downscale to a target cell height ~2x the largest in-game render size
     (default 100px). Baking the final resolution here beats runtime
     downscaling from the full-res generation — no smoothing mush.
  2. Saturation + brightness pop (defaults 1.45 / 1.12 — proven visually
     against the Frontier Town road).
  3. A dark outline dilated from the alpha silhouette (default 4px at the
     target scale, so ~2px at typical render size) — the single biggest
     readability win at small sizes.
  4. Re-pack all cells at uniform size, feet re-anchored to the bottom pad.

IMPORTANT: run this on the PRISTINE packed sheet (from git history or the
original generation), never on an already-processed sheet — outline and
saturation stack if applied twice.

Usage:
  python3 scripts/pop_unit_sheet.py sheet.png --frames 2 [--out out.png]
      [--cell-h 100] [--outline 4] [--sat 1.45] [--bright 1.12]
"""
import argparse
from PIL import Image, ImageEnhance, ImageFilter


def pop_cell(cell, target_h, outline_px, sat, bright, outline_rgb=(20, 15, 10)):
    scale = target_h / cell.height
    w = max(1, round(cell.width * scale))
    small = cell.resize((w, target_h), Image.LANCZOS)

    small = ImageEnhance.Color(small).enhance(sat)
    small = ImageEnhance.Brightness(small).enhance(bright)

    # outline: dilate the alpha silhouette, paint it dark, sprite on top.
    # pad the canvas so the outline never clips at cell edges.
    pad = outline_px + 1
    padded = Image.new('RGBA', (small.width + pad * 2, small.height + pad * 2), (0, 0, 0, 0))
    padded.paste(small, (pad, pad), small)
    alpha = padded.getchannel('A').point(lambda v: 255 if v > 60 else 0)
    dilated = alpha.filter(ImageFilter.MaxFilter(outline_px * 2 + 1))
    out = Image.new('RGBA', padded.size, (0, 0, 0, 0))
    out.paste(Image.new('RGBA', padded.size, outline_rgb + (255,)), (0, 0), dilated)
    out.paste(padded, (0, 0), padded)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet')
    ap.add_argument('--frames', type=int, required=True, help='number of cells in the (single-row) sheet')
    ap.add_argument('--out', help='output path (default: overwrite input)')
    ap.add_argument('--cell-h', type=int, default=100)
    ap.add_argument('--outline', type=int, default=4)
    ap.add_argument('--sat', type=float, default=1.45)
    ap.add_argument('--bright', type=float, default=1.12)
    args = ap.parse_args()

    img = Image.open(args.sheet).convert('RGBA')
    cw = img.width // args.frames
    cells = [pop_cell(img.crop((i * cw, 0, (i + 1) * cw, img.height)),
                      args.cell_h, args.outline, args.sat, args.bright)
             for i in range(args.frames)]

    ncw = max(c.width for c in cells)
    nch = max(c.height for c in cells)
    sheet = Image.new('RGBA', (ncw * len(cells), nch), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        # feet stay on the bottom edge (cells carry their own bottom pad)
        sheet.paste(c, (i * ncw + (ncw - c.width) // 2, nch - c.height), c)
    out = args.out or args.sheet
    sheet.save(out)
    print(f'{args.sheet}: {args.frames} cells -> {sheet.size} ({ncw}x{nch}/cell) -> {out}')


if __name__ == '__main__':
    main()
