#!/usr/bin/env python3
"""Measure a battle map's road thickness to verify generation zoom/scale.

Zoom anchors and new battle maps are accepted on a NUMBER, not a squint:
the road's median vertical thickness (in px) must land in the expected
band for the map's grid tier (see docs/BATTLEMAP_GENERATION_PROMPTS.md,
"Zoom ladder"). Usage:

    python3 scripts/measure_road_width.py map.png
    python3 scripts/measure_road_width.py map.png --band 260,440
    python3 scripts/measure_road_width.py anchor.png --expect-ratio 0.68 \
        --baseline learn/drill/assets/worlds/verdant/battlemaps/frontier-town.png

Detection: "road-ish" = brown/tan dirt (r > g > b ordering with enough
red-blue separation, not too dark). Works on both the pale packed-dirt
roads (post-Unit-Readability-Standard maps) and Frontier Town's legacy
dark mud road. Per sampled column, the longest road-ish run inside the
scan band is taken (small gaps tolerated for dithering/stones); the
median across columns is the road thickness. Columns whose best run is
tiny (< min-run) are treated as "road not present here" (forest border,
gatehouse occlusion) and skipped.
"""
import argparse
import sys

from PIL import Image


def road_thickness(path, band=None, gap_tol=6, min_run=20, step=4):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    y0, y1 = band if band else (0, h)

    def roadish(r, g, b):
        return r > 60 and r >= g - 5 and g > b and (r - b) >= 25

    widths = []
    for x in range(0, w, step):
        best = run = gap = 0
        for y in range(y0, min(y1, h)):
            if roadish(*px[x, y]):
                run += gap + 1
                gap = 0
            elif run:
                if gap < gap_tol:
                    gap += 1
                else:
                    best = max(best, run)
                    run = gap = 0
        best = max(best, run)
        if best >= min_run:
            widths.append(best)
    if not widths:
        raise SystemExit(f"{path}: no road-like runs >= {min_run}px found "
                         f"in band y={y0}..{y1} — wrong band or wrong palette?")
    widths.sort()
    n = len(widths)
    return {
        "image": path, "size": (w, h), "columns_with_road": n,
        "median": widths[n // 2], "p25": widths[n // 4], "p75": widths[3 * n // 4],
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--band", help="y0,y1 scan band (default: full height; "
                    "use a band when other brown content — roofs, fields — "
                    "would out-run the road)")
    ap.add_argument("--baseline", help="reference map to compare against")
    ap.add_argument("--baseline-band", help="y0,y1 scan band for the baseline "
                    "(its road usually sits at a different y than the candidate's)")
    ap.add_argument("--expect-ratio", type=float,
                    help="expected thickness ratio vs baseline (e.g. 0.68 "
                    "for a 28-col anchor vs the 19-col original); "
                    "±10%% tolerance")
    args = ap.parse_args()

    band = tuple(int(v) for v in args.band.split(",")) if args.band else None
    r = road_thickness(args.image, band)
    print(f"{r['image']}: {r['size'][0]}x{r['size'][1]}, "
          f"road thickness median {r['median']}px "
          f"(p25 {r['p25']}, p75 {r['p75']}, {r['columns_with_road']} cols)")

    if args.baseline:
        bband = (tuple(int(v) for v in args.baseline_band.split(","))
                 if args.baseline_band else band)
        b = road_thickness(args.baseline, bband)
        ratio = r["median"] / b["median"]
        print(f"baseline {b['image']}: median {b['median']}px -> ratio {ratio:.3f}")
        if args.expect_ratio:
            lo, hi = args.expect_ratio * 0.9, args.expect_ratio * 1.1
            ok = lo <= ratio <= hi
            print(f"expected {args.expect_ratio:.3f} (accept {lo:.3f}-{hi:.3f}): "
                  f"{'PASS' if ok else 'FAIL'}")
            sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
