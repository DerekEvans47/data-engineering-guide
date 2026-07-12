# Rev 6 Follow-ups — working doc (2026-07-12)

Owner feedback batch after the rev 6 wide-map deploy (v130). This doc is the
survival checkpoint: if the session context truncates, resume from here.
Branch: `fix/wide-map-followups`. Update Status as items ACTUALLY land — do
not pre-mark anything DONE.

| # | Item | Plan | Status |
|---|------|------|--------|
| 1 | This doc | Commit + push before starting work | DONE |
| 2 | Remove "Choose Your Map" screen | One big run: play routes straight into the Verdant run (map 0); chooser code stays dormant | DONE |
| 3 | Region title → fantasy name, gold script font | Rename region header to **Eldervale** (owner can veto — one string). Gold fill, white outline, medieval-script-but-readable font, self-hosted woff2 in assets/fonts + SW ASSETS, serif fallback | DONE |
| 4 | Mist vapor on region map (natural, broken, uneven, light) | Try painted-style wisps as a canvas overlay (low-alpha noise patches). HONESTY GATE: owner said "if it can't look natural, tell me" — if it reads fake, report back instead of shipping | DONE |
| 5 | Remove flag from ruined keep (region.png) | Clone-stamp out (sparkle-removal technique). Locate flag coords first | DONE (was the animated SVG pennant, not paint) |
| 6a | Slot markers off pad centers | Audit each of the 8 buildSlotsPx against the shipped 2048 asset; retune to visual pad centers | DONE |
| 6b | New slot on big east dirt patch (owner's circle) | Add 9th slot at that patch's center (locate precisely) | DONE |
| 6c | Unused dirt pads stand out (owner's squares) | Composite props stolen from the map itself (barrels/wagons/crates, feathered paste) onto unused pads; regenerate asset | DONE |
| 7 | Green overlay / cutoff strip below canvas | Diagnose: letterbox area likely shows wrap's cover-scaled bg + tint. Fix to neutral dark. CONFIRM in code first | DONE |
| 8 | Second radial (build-arm step) larger + displaced | Make confirm/stat step same size + anchor as first radial. Find both render paths first | DONE (CSS transform bug) |
| 9 | Goblins walk through gate walls | Add tight occluders for west/east gate wall+towers (road passes THROUGH them — the legitimate exception to the zero-occluder rule). Measure rects | DONE |

## Ship checklist (learn/drill gate)
- [x] sw.js cache bump (v130 → v131) + font added to ASSETS
- [x] Verifier pass (verifier itself updated for the no-chooser flow)
- [ ] PR → merge → pages workflow green
- [ ] Owner phone check

## Context notes (so nothing is re-derived after truncation)
- Shipped map asset: 2048×868 (paint space 1024×434, ×2), grid 30×13
  (cellW 68.27, cellH 66.77). Waypoint lane rides the road's north half;
  occludersPx currently [].
- Slots: FRONTIER_TOWN_MAP.buildSlotsPx (drill.js ~3515) + mirrored in
  battlemaps/frontier-town.json. 8 slots (2 per gate outside, 4 inside).
- Region map: assets/worlds/verdant/region.png + markers.png.
- Grade B standard: scripts/grade_map.py defaults. Map edits happen in
  2048-space directly now (asset is the source of truth; paint originals
  in session scratchpad may be gone).
- Owner annotation (860-wide battle screenshot ≈ ×2.38 to asset px):
  circle = big dirt patch east of the camp across the road; squares = the
  unused interior dirt pads; arrows = markers sitting off pad centers.

## Resolution notes (real values, as landed)
- 2: showTDWorldMap() now loads/creates the map-0 run directly (isRunCompatible
  guard); rc-choose-map relabeled "World Map" and routed the same way;
  verifier-browser.sh updated to expect the region map straight from play.
- 3: region header shows mapDef.regionName = "Eldervale" (one string to
  rename); MedievalSharp.woff2 self-hosted (53 KB), gold #E8B84B, white
  outline via stacked 1px text-shadows (.region-map-title-fancy).
- 4: extended the EXISTING rvm mist system (three-lobe gradient patches):
  4 new patches at (700,330)(612,175)(795,395)(545,300), op .07-.12 —
  weaker than the corrupted-zone banks so it reads as thinning outflow.
- 5: removed the keep pennant entry from RVM_AMBIENT.flags (it was the
  animated SVG flag, not painted pixels); crag watchtower flag kept.
- 6a: s3 (1000,184)->(1050,190); s7 (1670,256)->(1584,240); others verified
  centered (2048-space).
- 6b: s9 = (1850,236), the big patch NE of the camp.
- 6c: props cloned in-map with feathered paste: barrels (src 1186,504)->pad
  (426,296); crates (src 394,204)->pad (870,204); wagon (src 1690,610)->pad
  (604,596).
- 7: letterbox gradient rgba(6,10,6,.35) green -> rgba(8,11,16,.82) neutral
  blue-black (texture kept, unmistakably backdrop).
- 8: root cause was CSS: .td-radial-btn.armed set transform:scale(1.12),
  REPLACING the base translate(-50%,-50%) -> armed button grew and jumped
  half its size down-right. Fix: keep translate, drop scale (glow only).
- 9: occludersPx = west gatehouse [392,328,466,496], east [1436,316,1514,504]
  (tower bodies only; units hidden ~0.5s passing through the gate).

## Round 2 (2026-07-12, second owner batch) — all landed
- Font: MedievalSharp -> Cinzel Bold (engraved caps, 'e' unambiguous), 20 KB
  woff2, outline now 8-direction 2px white shadows (~3x thicker).
- Mist WAS animated but at ~1px/s (60s cycles) — imperceptible. Durations
  halved (30-48s) + keyframe drift widened to ~±60px => ~2.5-3px/s.
- 7 slots nudged to owner arrow tips: s2(224,620) s3(1058,212) s4(544,528)
  s5(1014,606) s6(1296,622) s7(1590,260) s9(1842,278).
- Two tip-only occluders added for the circled south-row roof peaks:
  barn [692,388,752,436], south house [1140,404,1204,448].
- Floating-box artifact: the round-1 barrel paste landed half OUTSIDE the
  palisade and smeared dirt on the wall. Zone (360,224)-(516,336) restored
  from the pre-props asset (git 50cf090), barrels re-pasted tight on-pad
  (444,290); new props: firewood in the yard (518,400), barrels above the
  wagon pad (616,566).
- sw v131 -> v132 (font filename changed). Verifier PASS.

## Authoring mode (2026-07-12)
- `?author=1` on the app URL overlays, on painted battle maps: occluder
  rects (red, labeled [x0,y0,x1,y1]), build slots (blue rings, s1..s9 +
  [x,y]), enemy lane (yellow), live hover crosshair with image-space pixel
  readout, and click-to-copy (last 5 clicks listed on screen + clipboard +
  console). Owner self-service loop: hover/tap the pixel -> paste into
  FRONTIER_TOWN_MAP.buildSlotsPx / occludersPx -> bump sw.js -> verify.
