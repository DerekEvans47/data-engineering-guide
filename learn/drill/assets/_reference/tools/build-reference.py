#!/usr/bin/env python3
"""Build a ground-truth art reference panel for a character from its shipped
sprite sheets. Everything on the panel is extracted from the live game assets
— nothing is generated — so it cannot drift from what actually ships.

Usage:
    python3 build-reference.py goblin
      → reads  learn/drill/assets/enemies/goblin-*.png
      → writes learn/drill/assets/_reference/goblin/reference.html

Then render the HTML to PNG (from the repo root, using the repo's Playwright):
    node -e "
      let c; try { ({chromium:c}=require('playwright')) }
      catch { ({chromium:c}=require('/opt/node22/lib/node_modules/playwright')) }
      (async () => {
        const b = await c.launch({executablePath:'/opt/pw-browsers/chromium'});
        const p = await b.newPage({viewport:{width:1280,height:900}});
        await p.goto('file://' + process.cwd() + '/learn/drill/assets/_reference/goblin/reference.html');
        await p.waitForTimeout(400);
        await p.screenshot({path:'learn/drill/assets/_reference/goblin/reference.png', fullPage:true});
        await b.close();
      })();"

The PNG panel is what you attach to image-generation prompts (Nano etc.) as
the style reference. See ../README.md for the full pipeline.
"""
import base64
import struct
import sys
import zlib
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[5]
ENEMIES = REPO / 'learn/drill/assets/enemies'
OUT = Path(__file__).resolve().parents[1]

# Known sheet inventory per character: (anim, frame_count). Extend as
# characters gain animations or new characters get painted art.
SHEETS = {
    'goblin': [('walk', 2), ('death', 4), ('attack', 4)],
}


def decode_png(path):
    data = path.read_bytes()
    pos, w, h, idat = 8, 0, 0, b''
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos + 8])
        chunk = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct = struct.unpack('>IIBB', chunk[:10])
            assert bd == 8 and ct == 6, f'{path}: need RGBA8, got depth={bd} type={ct}'
        elif typ == b'IDAT':
            idat += chunk
        pos += 12 + ln
    raw = zlib.decompress(idat)
    stride, bpp = w * 4, 4
    out, prev, p = bytearray(), bytearray(stride), 0
    for _ in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out += line
        prev = line
    return w, h, bytes(out)


def measure_palette(paths):
    """Cluster opaque pixels; return (skin_ramp, gear_ramp, outline, outline_pct)."""
    cnt = Counter()
    for path in paths:
        w, h, px = decode_png(path)
        for i in range(0, len(px), 4):
            if px[i + 3] > 200:
                cnt[(px[i], px[i + 1], px[i + 2])] += 1
    total = sum(cnt.values())
    dark = sum(n for (r, g, b), n in cnt.items() if max(r, g, b) < 60)
    buckets, rep = Counter(), {}
    for (r, g, b), n in cnt.items():
        k = (r // 24, g // 24, b // 24)
        buckets[k] += n
        if k not in rep or cnt[rep[k]] < n:
            rep[k] = (r, g, b)
    skin, gear = [], []
    for k, n in buckets.most_common(24):
        r, g, b = rep[k]
        if max(r, g, b) < 60:
            continue
        (skin if (g >= r and g > b) else gear).append((r, g, b))
    lum = lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    skin.sort(key=lum, reverse=True)
    gear.sort(key=lum, reverse=True)
    return skin[:9], gear[:5], '#140F0A', round(100 * dark / total)


def main(char):
    sheets = SHEETS[char]
    paths = [ENEMIES / f'{char}-{anim}.png' for anim, _ in sheets]
    for p in paths:
        assert p.exists(), f'missing shipped sheet: {p}'
    skin, gear, outline, outline_pct = measure_palette(paths)

    def sw(colors):
        return ''.join(
            f'<div class="sw"><div class="chip" style="background:#{r:02X}{g:02X}{b:02X}"></div>'
            f'<span>#{r:02X}{g:02X}{b:02X}</span></div>'
            for r, g, b in colors)

    frames_html = ''
    for (anim, n), path in zip(sheets, paths):
        w, h, _ = decode_png(path)
        b64 = base64.b64encode(path.read_bytes()).decode()
        frames_html += f'''
  <div class="frames"><img src="data:image/png;base64,{b64}" width="{w * 3}" height="{h * 3}"></div>
  <div class="caption">{path.name} · {w}&times;{h} · {n} frames of {w // n}&times;{h}</div><br>'''

    anims = ' / '.join(f'{a.upper()} ({n}f)' for a, n in sheets)
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
  body {{ margin:0; background:#E8E4D8; font-family:"Courier New",monospace; color:#2A2620; width:1280px; }}
  .page {{ padding:24px 28px; }}
  h1 {{ font-size:22px; margin:0 0 2px; letter-spacing:1px; }}
  .sub {{ font-size:12px; margin-bottom:18px; color:#6B6455; }}
  h2 {{ font-size:13px; letter-spacing:2px; border-bottom:2px solid #2A2620; padding-bottom:3px; margin:22px 0 10px; }}
  .frames {{ background: repeating-conic-gradient(#CFCABC 0% 25%, #BDB8A8 0% 50%) 0 0/24px 24px;
      padding:14px; display:inline-block; border:2px solid #2A2620; margin-top:8px; }}
  .frames img {{ image-rendering:pixelated; display:block; }}
  .caption {{ font-size:11px; margin-top:6px; color:#6B6455; }}
  .swrow {{ display:flex; gap:10px; flex-wrap:wrap; margin-bottom:6px; }}
  .sw {{ text-align:center; font-size:10px; }}
  .chip {{ width:64px; height:44px; border:2px solid #2A2620; margin-bottom:3px; }}
  .spec {{ font-size:12px; line-height:1.7; background:#F2EFE6; border:2px solid #2A2620; padding:12px 16px; width:560px; }}
  .cols {{ display:flex; gap:28px; align-items:flex-start; }}
</style></head><body><div class="page">
  <h1>{char.upper()} — CANONICAL ART REFERENCE (GROUND TRUTH)</h1>
  <div class="sub">id: {char} &nbsp;·&nbsp; source of truth: shipped sprites + measured palette — everything below is extracted from the live game assets, nothing is generated</div>
  <h2>SHIPPED FRAMES — {anims} — shown 3&times;, nearest-neighbor</h2>{frames_html}
  <h2>MEASURED PALETTE — color-picked from the shipped pixels (not approximate)</h2>
  <div style="font-size:11px; margin-bottom:4px;">SKIN — muted ramp, light &rarr; shadow:</div>
  <div class="swrow">{sw(skin)}</div>
  <div style="font-size:11px; margin:10px 0 4px;">GEAR — warm brown ramp:</div>
  <div class="swrow">{sw(gear)}</div>
  <div style="font-size:11px; margin:10px 0 4px;">OUTLINE — warm near-black halo, {outline_pct}% of all opaque pixels:</div>
  <div class="swrow"><div class="sw"><div class="chip" style="background:{outline}"></div><span>{outline}</span></div></div>
  <div class="cols"><div>
  <h2>PRODUCTION SPEC (matches the game engine)</h2>
  <div class="spec">
    &bull; Frame height: <b>110 px</b> baseline. Taller sheets are allowed when a pose
      needs headroom (goblin attack = 118 px) — pair with a per-anim scale override
      in TD_ENEMY_SHEET_IMAGES so pixels-per-source-pixel stays constant.<br>
    &bull; Horizontal strip, single row, uniform frame width.<br>
    &bull; Frame budgets: walk <b>2</b> (A-B loop) · death <b>4</b> (one-shot) ·
      attack <b>4</b> (windup / strike / follow-through / recover).<br>
    &bull; Transparent RGBA. No baked ground shadow (engine draws its own).<br>
    &bull; Feet on a consistent baseline across ALL sheets — the engine hot-swaps
      animation states mid-frame.<br>
    &bull; Side view facing <b>right</b>; engine mirrors for left.<br>
    &bull; Style: <b>hand-painted low-res sprite</b> — soft blended shading and
      anti-aliased edges are CORRECT (this is not strict indexed pixel art).
  </div></div><div>
  <h2>DO NOT</h2>
  <div class="spec" style="width:420px">
    &bull; Brighten / saturate the skin toward lime or cartoon green.<br>
    &bull; Thin out the dark halo outline — it is the style's signature.<br>
    &bull; Change proportions (oversized head, stubby limbs stay).<br>
    &bull; Add gear, weapons, colors not present in the frames above.<br>
    &bull; Bake in shadows, glows, motion blur, particles, or checkerboard
      "transparency" — use a flat magenta background if true alpha is unavailable.<br>
    &bull; Put any text or labels inside generated sheets.
  </div></div></div>
</div></body></html>'''
    outdir = OUT / char
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / 'reference.html').write_text(html)
    print(f'wrote {outdir / "reference.html"}')
    print(f'palette: skin={len(skin)} gear={len(gear)} outline={outline} ({outline_pct}%)')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'goblin')
