#!/usr/bin/env python3
"""Slice a Nano Banana (Gemini) relic-icon sheet into individual transparent PNGs.

Relic icon sheets are generated as an NxN grid of hero objects on a solid
magenta (#FF00FF) chroma-key background (see the relic sheet prompt in
learn/drill/assets/reference/). This cuts each cell out, keys the magenta
background to transparency, and despills the antialiased edge ring.

Why not a simple "distance to one magenta sample" key: the edge between an
object and the magenta background is antialiased, so edge pixels are a
blended ramp of colors, not a hard cut. A plain RGB-distance-to-magenta
threshold either leaves a visible pink/magenta fringe (threshold too loose)
or eats real object detail (too tight) — and the right threshold differs by
what color happens to sit next to the background in a given cell. Keying on
a MAGENTA-BIAS score (min(R,B) - G) instead works uniformly: pure magenta and
any antialiased blend toward it keeps a high bias regardless of brightness,
while real object colors (steel, gold, wood, even blue-violet glows) don't
share that R&B-high/G-low signature. A final 1px alpha erosion (MinFilter)
shaves off whatever thin uncertain ring is left, regardless of its hue.

Known Gemini defect this does NOT fix: on a few generations, a requested
*golden* glow/halo rendered pink instead of gold — a real content mistake
baked into the source pixels (confirmed by sampling: a wide ~15px smooth
gradient, not a thin AA fringe), most likely the model blending the glow
toward the magenta backdrop's hue during generation. No chroma-key threshold
can separate "intended pink" from "background pollution" when they're the
same color over a wide gradient — flag affected cells for a manual touch-up
or a single-cell regenerate ("redraw cell N as specified") instead.

Usage:
  python3 scripts/slice_relic_sheet.py sheet.png --names midas_touch,golden_fang,... \
      --out-dir learn/drill/assets/relics --cols 6 --rows 6
"""
import argparse
import sys

import numpy as np
from PIL import Image, ImageFilter


def key_cell(cell_rgb, low_m, high_m):
    """Magenta-bias chroma-key + despill. Returns an RGBA image."""
    arr = np.array(cell_rgb, dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    m = np.clip(np.minimum(r, b) - g, 0, None)
    alpha = 1 - np.clip((m - low_m) / (high_m - low_m), 0, 1)

    # Despill: pull the magenta excess out of partially-keyed edge pixels
    # proportional to how transparent they already are, so a half-opaque
    # edge pixel doesn't still read as pink once composited.
    despill = m * (1 - alpha)
    r2 = np.clip(r - despill, 0, 255)
    b2 = np.clip(b - despill, 0, 255)

    a8 = (alpha * 255).astype(np.uint8)
    a8 = np.array(Image.fromarray(a8, mode='L').filter(ImageFilter.MinFilter(3)))
    return Image.fromarray(np.stack([r2, g, b2, a8], axis=-1).astype(np.uint8), mode='RGBA')


def flagged_fraction(cell_rgba, low_m=40, alpha_thresh=60):
    """Diagnostic only: fraction of pixels that are both opaque-ish and still
    magenta-biased. High values are a real fringe OR just legitimate
    violet/purple object content (the same hue family as magenta) — always
    confirm visually before treating a high score as a defect.
    """
    arr = np.array(cell_rgba)
    r, g, b, a = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int), arr[..., 3].astype(int)
    m = np.minimum(r, b) - g
    bad = (a > alpha_thresh) & (m > low_m)
    return bad.sum() / m.size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet')
    ap.add_argument('--names', required=True, help='comma-separated cell names, row-major, left-to-right/top-to-bottom')
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--cols', type=int, default=6)
    ap.add_argument('--rows', type=int, default=6)
    ap.add_argument('--inset', type=int, default=4, help='px trimmed off each cell edge to drop the grid divider line')
    ap.add_argument('--low-m', type=float, default=25, help='magenta-bias floor: at/below this, fully opaque')
    ap.add_argument('--high-m', type=float, default=110, help='magenta-bias ceiling: at/above this, fully transparent')
    ap.add_argument('--report', action='store_true', help='print the flagged-fraction diagnostic per cell, sorted worst-first')
    args = ap.parse_args()

    names = args.names.split(',')
    if len(names) != args.cols * args.rows:
        sys.exit(f'{len(names)} names given, expected {args.cols * args.rows} for a {args.cols}x{args.rows} grid')

    img = Image.open(args.sheet).convert('RGB')
    W, H = img.size
    report = []
    for idx, name in enumerate(names):
        row, col = divmod(idx, args.cols)
        x0, x1 = round(col * W / args.cols), round((col + 1) * W / args.cols)
        y0, y1 = round(row * H / args.rows), round((row + 1) * H / args.rows)
        cell = img.crop((x0 + args.inset, y0 + args.inset, x1 - args.inset, y1 - args.inset))
        out = key_cell(cell, args.low_m, args.high_m)
        out.save(f'{args.out_dir}/{name.strip()}.png')
        if args.report:
            report.append((name.strip(), flagged_fraction(out)))

    print(f'sliced {len(names)} icons -> {args.out_dir}')
    if args.report:
        report.sort(key=lambda t: -t[1])
        print(f"\n{'name':24s} {'flagged':>8s}  (confirm visually before treating as a defect)")
        for name, frac in report:
            print(f'{name:24s} {frac*100:7.2f}%')


if __name__ == '__main__':
    main()
