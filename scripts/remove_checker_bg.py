#!/usr/bin/env python3
"""
Remove a baked-in "transparency checkerboard" from generated sprite-sheet PNGs.

Background: several image-generation tools can't emit real alpha transparency.
When asked for a transparent background they instead draw a literal checkerboard
(the standard "no background" indicator most editors show) and flatten it into
an opaque RGBA PNG (alpha = 255 everywhere). The asset then renders as a solid
tile instead of a transparent sprite. This script detects that checker pattern
per image and converts it back into real alpha.

Algorithm (see docs/BACKLOG.md V-34 for the incident this was written for):
  1. Sample a border frame (assumed background) to learn the checker's two
     tone values (dark/light) and cell size.
  2. Flag pixels as "checker candidates" if they're low-saturation (near
     R=G=B) and their luminance falls within [dark-tol, light+tol].
  3. Median-filter the candidate mask to kill salt-and-pepper misses caused
     by anti-aliasing at checker-cell edges.
  4. Morphologically close small gaps, then drop any connected component
     smaller than a size scaled to the detected checker cell (kills stray
     single-pixel false positives inside sprite art without eating real
     negative-space holes, e.g. an archway opening).
  5. Feather the remaining hard edge with a small Gaussian blur on alpha so
     cutouts don't look jagged, and write the result as a new RGBA PNG.

This is a *color-threshold* approach, not true background removal — it works
well when the checker is low-saturation gray/near-white and sprite art doesn't
share that exact tone range. It struggles on art with glow/magic effects that
bleed color into the surrounding checker cells (soft halo pixels fall outside
the tolerance) or art that itself uses flat neutral grays close to the checker
tone (e.g. stone, skin) — tightening tolerance leaves a halo, loosening it eats
holes in the sprite. See the "--sat-tol/--edge-tol" tuning notes below and the
prevention recommendation in docs/BACKLOG.md: fix this at generation time (request
a solid saturated chroma-key background, e.g. pure magenta/green, instead of a
checkerboard) rather than relying on this script as the primary defense.

Usage:
    pip install pillow numpy scipy
    python3 scripts/remove_checker_bg.py path/to/sheet.png -o path/to/out.png
    python3 scripts/remove_checker_bg.py path/to/*.png --in-place
    python3 scripts/remove_checker_bg.py sheet.png -o out.png --preview preview.png

Tuning (only needed when the defaults leave a visible halo or eat sprite art —
run with --preview and composite-check before trusting a batch run):
    --sat-tol   max per-pixel channel spread (max-min) to count as "neutral
                gray" (default 10). Raise if checker cells have color bleed
                from nearby glow effects; lower if it's eating into gray/neutral
                sprite content (stone, metal, skin).
    --edge-tol  how far outside [dark, light] a pixel's luminance may fall and
                still count as checker (default 5). Same trade-off as --sat-tol.
    --median-size / --close-iter  denoise/gap-fill strength on the checker mask.
    --min-blob  override the auto (checker-cell-scaled) minimum connected-
                component size kept as background.

Verifying results: transparent PNGs render as a checkerboard in most viewers/
editors, which makes it impossible to eyeball whether removal worked by just
opening the file — you'll see "checker" either way. Use --preview to composite
the result onto a loud, unmistakable color (magenta) and inspect that instead.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def measure_checker_colors(arr: np.ndarray, strip: int = 40) -> tuple[float, float]:
    """Sample a border frame and return the (dark, light) checker luminances."""
    border = np.concatenate([
        arr[0:strip, :, :].reshape(-1, 3),
        arr[-strip:, :, :].reshape(-1, 3),
        arr[:, 0:strip, :].reshape(-1, 3),
        arr[:, -strip:, :].reshape(-1, 3),
    ])
    lum = border.mean(axis=1)
    sat = border.max(axis=1) - border.min(axis=1)
    neutral_lum = lum[sat <= 8]
    if neutral_lum.size < 10:
        raise ValueError(
            "Couldn't find a neutral-gray border strip to learn the checker "
            "colors from — this image may not have a checkerboard background, "
            "or the border is occupied by sprite content."
        )
    dark = float(np.median(neutral_lum[neutral_lum < neutral_lum.mean()]))
    light = float(np.median(neutral_lum[neutral_lum >= neutral_lum.mean()]))
    return dark, light


def measure_period(channel: np.ndarray) -> float:
    """Estimate checker cell size (px) from a background-only scanline."""
    diffs = np.abs(np.diff(channel.astype(int)))
    trans = np.where(diffs > 12)[0]
    if len(trans) < 4:
        return 20.0
    gaps = np.diff(trans)
    gaps = gaps[gaps > 2]  # drop 1px double-edges from antialiasing
    return float(np.median(gaps)) if len(gaps) else 20.0


def remove_checker(
    im: Image.Image,
    sat_tol: int = 10,
    edge_tol: int = 5,
    close_iter: int = 1,
    feather: float = 0.8,
    median_size: int = 3,
    min_blob: int | None = None,
) -> tuple[Image.Image, dict]:
    """Return (rgba_image, stats) with the checkerboard background keyed out."""
    arr = np.array(im.convert("RGB")).astype(np.int16)

    dark, light = measure_checker_colors(arr)
    period = measure_period(arr[2, :, 0])
    if min_blob is None:
        min_blob = max(15, round(0.35 * period * period))
    lo, hi = dark - edge_tol, light + edge_tol

    lum = arr.mean(axis=-1)
    sat = arr.max(axis=-1) - arr.min(axis=-1)
    candidate = (sat <= sat_tol) & (lum >= lo) & (lum <= hi)

    if median_size:
        candidate = ndimage.median_filter(candidate.astype(np.uint8), size=median_size).astype(bool)

    struct = np.ones((3, 3), dtype=bool)
    closed = ndimage.binary_closing(candidate, structure=struct, iterations=close_iter)

    lbl, n = ndimage.label(closed, structure=struct)
    if n:
        sizes = ndimage.sum(closed, lbl, index=np.arange(1, n + 1))
        keep_labels = np.where(sizes >= min_blob)[0] + 1
        checkerish = np.isin(lbl, keep_labels)
    else:
        keep_labels = []
        checkerish = closed

    alpha = np.where(checkerish, 0, 255).astype(np.float64)
    if feather > 0:
        alpha = ndimage.gaussian_filter(alpha, sigma=feather)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)

    out = np.dstack([arr.astype(np.uint8), alpha])
    stats = {
        "dark": dark, "light": light, "period": period, "min_blob": min_blob,
        "removed_pct": 100.0 * checkerish.sum() / checkerish.size,
        "components_kept": len(keep_labels), "components_total": n,
    }
    return Image.fromarray(out, mode="RGBA"), stats


def make_preview(rgba: Image.Image, color=(255, 0, 200, 255)) -> Image.Image:
    """Composite onto a loud solid color so transparency is actually visible.

    A transparent PNG renders as a checkerboard in most viewers, which makes it
    impossible to tell success from failure by eye. Compositing onto an
    unmistakable color (default magenta) turns "still checkered" into a real
    visual signal instead of a viewer artifact.
    """
    bg = Image.new("RGBA", rgba.size, color)
    return Image.alpha_composite(bg, rgba).convert("RGB")


def main():
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("inputs", nargs="+", type=Path, help="PNG file(s) to process")
    p.add_argument("-o", "--output", type=Path, help="Output path (single input only)")
    p.add_argument("--in-place", action="store_true", help="Overwrite each input file")
    p.add_argument("--preview", type=Path, help="Also write an on-magenta QA preview (single input only)")
    p.add_argument("--sat-tol", type=int, default=10)
    p.add_argument("--edge-tol", type=int, default=5)
    p.add_argument("--close-iter", type=int, default=1)
    p.add_argument("--feather", type=float, default=0.8)
    p.add_argument("--median-size", type=int, default=3)
    p.add_argument("--min-blob", type=int, default=None)
    args = p.parse_args()

    if not args.in_place and not args.output and len(args.inputs) > 1:
        p.error("Batch runs need --in-place (per-file output paths aren't supported with -o)")
    if args.output and len(args.inputs) > 1:
        p.error("-o only works with a single input file; use --in-place for batches")

    for path in args.inputs:
        im = Image.open(path)
        rgba, stats = remove_checker(
            im,
            sat_tol=args.sat_tol, edge_tol=args.edge_tol, close_iter=args.close_iter,
            feather=args.feather, median_size=args.median_size, min_blob=args.min_blob,
        )
        out_path = path if args.in_place else (args.output or path.with_suffix(".transparent.png"))
        rgba.save(out_path)
        print(
            f"{path.name}: dark={stats['dark']:.0f} light={stats['light']:.0f} "
            f"period={stats['period']:.1f} min_blob={stats['min_blob']} "
            f"removed={stats['removed_pct']:.1f}% "
            f"blobs_kept={stats['components_kept']}/{stats['components_total']} "
            f"-> {out_path}"
        )
        if args.preview:
            make_preview(rgba).save(args.preview)
            print(f"  preview -> {args.preview}")


if __name__ == "__main__":
    sys.exit(main())
