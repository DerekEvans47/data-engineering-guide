#!/usr/bin/env python3
"""Apply the standard map color grade (owner-picked 'grade B', 2026-07-12).

The verdant art line generates dark (mean brightness ~0.30-0.37, 90% of
pixels below mid-gray). This grade lifts value and warmth into the range
the owner prefers (~0.49) without touching the units' reserved accent
palette (reds/purples/blues/bone) — greens and browns brighten, unit
outline contrast improves. Run AFTER compositing/sparkle cleanup, BEFORE
the 2x nearest-neighbor upscale.

    python3 scripts/grade_map.py in.png out.png
    python3 scripts/grade_map.py in.png out.png --gamma 0.75 --sat 1.15 --warm 0.05
"""
import argparse

import numpy as np
from PIL import Image


def grade(img, gamma, satk, warm):
    v = img.max(2, keepdims=True)
    scale = np.where(v > 0, (v ** gamma) / np.maximum(v, 1e-6), 1.0)
    out = img * scale
    lum = out.mean(2, keepdims=True)
    out = lum + (out - lum) * satk
    out[..., 0] *= 1 + warm
    out[..., 2] *= 1 - warm * 0.6
    return np.clip(out, 0, 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--gamma", type=float, default=0.75, help="value gamma (<1 brightens)")
    ap.add_argument("--sat", type=float, default=1.15, help="saturation multiplier")
    ap.add_argument("--warm", type=float, default=0.05, help="warmth shift (+R, -0.6*B)")
    args = ap.parse_args()
    im = np.asarray(Image.open(args.src).convert("RGB"), dtype=np.float32) / 255
    out = grade(im, args.gamma, args.sat, args.warm)
    Image.fromarray((out * 255).astype(np.uint8)).save(args.out)
    v = out.max(2)
    print(f"{args.out}: meanV {im.max(2).mean():.3f} -> {v.mean():.3f}")


if __name__ == "__main__":
    main()
