# Rev 6 Follow-ups — working doc (2026-07-12)

Owner feedback batch after the rev 6 wide-map deploy (v130). This doc is the
survival checkpoint: if the session context truncates, resume from here.
Branch: `fix/wide-map-followups`. Update Status as items ACTUALLY land — do
not pre-mark anything DONE.

| # | Item | Plan | Status |
|---|------|------|--------|
| 1 | This doc | Commit + push before starting work | DONE |
| 2 | Remove "Choose Your Map" screen | One big run: play routes straight into the Verdant run (map 0); chooser code stays dormant | TODO |
| 3 | Region title → fantasy name, gold script font | Rename region header to **Eldervale** (owner can veto — one string). Gold fill, white outline, medieval-script-but-readable font, self-hosted woff2 in assets/fonts + SW ASSETS, serif fallback | TODO |
| 4 | Mist vapor on region map (natural, broken, uneven, light) | Try painted-style wisps as a canvas overlay (low-alpha noise patches). HONESTY GATE: owner said "if it can't look natural, tell me" — if it reads fake, report back instead of shipping | TODO |
| 5 | Remove flag from ruined keep (region.png) | Clone-stamp out (sparkle-removal technique). Locate flag coords first | TODO |
| 6a | Slot markers off pad centers | Audit each of the 8 buildSlotsPx against the shipped 2048 asset; retune to visual pad centers | TODO |
| 6b | New slot on big east dirt patch (owner's circle) | Add 9th slot at that patch's center (locate precisely) | TODO |
| 6c | Unused dirt pads stand out (owner's squares) | Composite props stolen from the map itself (barrels/wagons/crates, feathered paste) onto unused pads; regenerate asset | TODO |
| 7 | Green overlay / cutoff strip below canvas | Diagnose: letterbox area likely shows wrap's cover-scaled bg + tint. Fix to neutral dark. CONFIRM in code first | TODO |
| 8 | Second radial (build-arm step) larger + displaced | Make confirm/stat step same size + anchor as first radial. Find both render paths first | TODO |
| 9 | Goblins walk through gate walls | Add tight occluders for west/east gate wall+towers (road passes THROUGH them — the legitimate exception to the zero-occluder rule). Measure rects | TODO |

## Ship checklist (learn/drill gate)
- [ ] sw.js cache bump (v130 → v131) + any new assets (font) in ASSETS
- [ ] Verifier pass (`bash .claude/skills/verifier-browser.sh`)
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

## Resolution notes (append as items land — with real values, not plans)
- (empty)
