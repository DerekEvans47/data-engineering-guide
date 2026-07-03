#!/usr/bin/env python3
"""
Convert a solid magenta (#FF00FF) chroma-key background to real alpha transparency.

Background: sprite sheets generated for tower/enemy art (see TOWER_GENERATION_PROMPTS.md)
are requested on a flat magenta field specifically so background removal is a simple
color-distance threshold, not the fragile checkerboard-detection problem
`remove_checker_bg.py` exists to solve (see BACKLOG.md's Asset Generation Notes). This
script is that simpler counterpart: no checker-cell detection, just "how far is this
pixel from pure magenta."

Algorithm:
  1. Compute each pixel's Euclidean distance to (255, 0, 255) in RGB space.
  2. Pixels within `--tolerance` are background; alpha = 0.
  3. A soft band just outside the tolerance gets partial alpha (linear falloff over
     `--feather` units of distance) so cutout edges aren't hard/jagged.
  4. Optionally write a `--preview` PNG compositing the result onto solid magenta, so a
     "did this actually go transparent" check doesn't require an editor with alpha
     checkering — a transparent PNG and a solid-magenta PNG look identical in most
     viewers otherwise.

Usage:
    pip install pillow numpy
    python3 scripts/remove_magenta_bg.py sheet.png -o sheet-alpha.png
    python3 scripts/remove_magenta_bg.py sheet.png -o sheet-alpha.png --preview preview.png
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

MAGENTA = np.array([255, 0, 255], dtype=np.float32)


def remove_magenta(img: Image.Image, tolerance: float, feather: float) -> Image.Image:
    """Magenta lacks green entirely (0, 255, 0 -> 0), which real sprite content
    (wood/stone/skin tones, even near-black outlines) essentially never does at
    R=B=255 simultaneously. So "green deficiency relative to R/B" is a much
    cleaner keying signal than raw Euclidean distance to magenta, which conflates
    "close to magenta" with "dark and therefore numerically far from a bright
    color" — a near-black outline pixel with a slight magenta anti-aliasing tint
    reads as "far from magenta" by distance alone even though it's still visibly
    pink-contaminated. This also decontaminates (de-spills) partially-transparent
    edge pixels instead of just adjusting alpha, which is what actually removes
    the visible magenta fringe left behind by naive distance thresholding.
    """
    rgba = np.array(img.convert("RGBA"), dtype=np.float32)
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]

    m = np.minimum(r, b)              # magenta's shared R/B strength
    spill = np.maximum(0.0, m - g)    # how much R/B exceed G — the magenta bias

    # 0 at/above tolerance+feather (fully background) -> 1 at/below tolerance (fully opaque)
    alpha = np.clip((tolerance + feather - spill) / max(feather, 1e-6), 0.0, 1.0)

    # De-spill: pull R/B down toward G in proportion to the detected spill, so
    # partially-transparent edge pixels approach their true hue instead of
    # staying magenta-shifted once composited over a new background.
    r = np.clip(r - spill, 0, 255)
    b = np.clip(b - spill, 0, 255)

    rgba[..., 0] = r
    rgba[..., 2] = b
    rgba[..., 3] = alpha * 255.0
    return Image.fromarray(rgba.astype(np.uint8), mode="RGBA")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input", type=Path, help="Source PNG with a magenta background")
    p.add_argument("-o", "--output", type=Path, required=True, help="Output RGBA PNG path")
    p.add_argument("--tolerance", type=float, default=55.0, help="Color-distance fully-background threshold (default 55)")
    p.add_argument("--feather", type=float, default=25.0, help="Distance band over which alpha ramps to fully opaque (default 25)")
    p.add_argument("--preview", type=Path, help="Also write a QA preview composited onto solid magenta")
    args = p.parse_args()

    img = Image.open(args.input)
    out = remove_magenta(img, args.tolerance, args.feather)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    out.save(args.output)
    print(f"Wrote {args.output} ({out.size[0]}x{out.size[1]}, RGBA)")

    if args.preview:
        bg = Image.new("RGBA", out.size, (255, 0, 255, 255))
        bg.alpha_composite(out)
        bg.convert("RGB").save(args.preview)
        print(f"Wrote preview {args.preview}")


if __name__ == "__main__":
    main()
