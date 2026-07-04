#!/usr/bin/env python3
"""Detect and remove the Gemini 4-point-star sparkle watermark from generated maps.

The sparkle is a semi-transparent, light-gray, diamond/star-shaped overlay that
Gemini (Nano Banana) stamps near a corner of generated images — usually the
bottom-right or bottom-left quadrant. It survives "no watermark" prompt
instructions, so every generated map must be checked and cleaned in post.

This does NOT require generative inpainting. The sparkle always lands on
repeating organic texture (forest, grass), so a feathered clone-stamp of a
nearby same-texture patch is visually seamless at game zoom. Plain PIL.

Workflow (see docs/MAP_ART_PIPELINE.md):
  1. `--check` proposes candidate locations (bright + desaturated vs. local
     neighborhood). Gray rocks/stone false-positive, so a human confirms by
     cropping each candidate and looking.
  2. Re-run with `--center X,Y` (the confirmed sparkle) and a `--source dx,dy`
     offset pointing at a clean patch of the SAME texture (verify the source
     crop first — no boulders, buildings, or clearing edges, or you'll paste
     a visible twin).

Usage:
  python3 scripts/remove_gemini_sparkle.py map.png --check             # list candidates
  python3 scripts/remove_gemini_sparkle.py map.png \
      --center 1398,585 --size 100 --source 45,-120 --out clean.png    # remove
"""
import argparse
import sys
from PIL import Image, ImageFilter
import numpy as np


def find_candidates(arr):
    """Propose sparkle candidates: compact blobs that are brighter AND less
    saturated than their local (120px-tile) neighborhood median.

    The sparkle is translucent, so over dark forest its absolute brightness is
    low — only a *local* contrast test works on every background. Returns
    [(cx, cy, size, npx), ...]; expect false positives from gray rocks/stone,
    which is why a human confirms before removal.
    """
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    bright = (r + g + b) // 3
    spread = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    T = 120
    mask = np.zeros((h, w), dtype=bool)
    for ty in range(0, h, T):
        for tx in range(0, w, T):
            bt = bright[ty:ty+T, tx:tx+T]
            st = spread[ty:ty+T, tx:tx+T]
            mask[ty:ty+T, tx:tx+T] = (bt > np.median(bt) + 30) & (st < max(np.median(st), 12))

    seen = np.zeros_like(mask)
    scale = max(1, w // 1024)
    minpx, maxdim = 150 * scale * scale, 100 * scale
    out = []
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            if not mask[y, x] or seen[y, x]:
                continue
            stack = [(y, x)]
            seen[y, x] = True
            pts = []
            while stack:
                cy, cx = stack.pop()
                pts.append((cy, cx))
                for ny, nx in ((cy-1, cx), (cy+1, cx), (cy, cx-1), (cy, cx+1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(pts) < minpx:
                continue
            ys = [p[0] for p in pts]; xs = [p[1] for p in pts]
            bw, bh = max(xs) - min(xs), max(ys) - min(ys)
            if bw > maxdim or bh > maxdim or not (0.5 < bw / max(1, bh) < 2.0):
                continue
            out.append(((min(xs) + max(xs)) // 2, (min(ys) + max(ys)) // 2, max(bw, bh), len(pts)))
    # sparkles live near corners — rank by distance from image center, farthest first
    out.sort(key=lambda c: -((c[0] - w / 2) ** 2 + (c[1] - h / 2) ** 2))
    return out


def remove_sparkle(img, cx, cy, size, source_offset):
    """Clone-stamp texture from (cx+dx, cy+dy) over the sparkle, feathered."""
    pad = int(size * 0.75)            # cover soft edges beyond the bbox
    box = (cx - pad, cy - pad, cx + pad, cy + pad)
    dx, dy = source_offset
    src_box = (box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy)
    if not (0 <= src_box[0] and 0 <= src_box[1] and src_box[2] <= img.width and src_box[3] <= img.height):
        sys.exit(f"source patch {src_box} falls outside the image — pass a different --source offset")
    patch = img.crop(src_box)

    # Feathered circular mask: opaque center, Gaussian-soft rim
    m = np.zeros((patch.height, patch.width), dtype=np.uint8)
    yy, xx = np.ogrid[:patch.height, :patch.width]
    rad = pad * 0.80
    m[((xx - patch.width // 2) ** 2 + (yy - patch.height // 2) ** 2) <= rad ** 2] = 255
    mask = Image.fromarray(m).filter(ImageFilter.GaussianBlur(radius=pad * 0.18))

    img.paste(patch, box[:2], mask)
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('image')
    ap.add_argument('--out', help='output path (default: overwrite input)')
    ap.add_argument('--check', action='store_true', help='list candidates only; exit 1 if any found')
    ap.add_argument('--center', help='X,Y confirmed sparkle center — skips detection')
    ap.add_argument('--size', type=int, default=60, help='sparkle bbox size in px (with --center)')
    ap.add_argument('--source', default='-140,0', help='dx,dy clone-source offset (default -140,0)')
    args = ap.parse_args()

    img = Image.open(args.image).convert('RGB')

    if args.center:
        cx, cy = map(int, args.center.split(','))
        size = args.size
    else:
        cands = find_candidates(np.array(img))
        if not cands:
            print('no sparkle candidates detected')
            sys.exit(0)
        print('candidates (confirm visually, then re-run with --center):')
        for cx, cy, size, npx in cands:
            print(f'  ({cx}, {cy})  size ~{size}px  {npx}px blob')
        sys.exit(1)

    if args.check:
        sys.exit(1)

    dx, dy = map(int, args.source.split(','))
    img = remove_sparkle(img, cx, cy, size, (dx, dy))
    out = args.out or args.image
    img.save(out)
    print(f'cleaned -> {out}')


if __name__ == '__main__':
    main()
