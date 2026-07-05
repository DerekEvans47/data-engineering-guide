# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- EQ-6 store node — power-ups + rarity-weighted relic

- EQ-7 inventory panel + relic-acquired equip prompt

- Frontier Town bandit roster + Ranger L4 multi-projectile (#102)

- New Run option on the home screen

- Unit Readability Standard - outline+pop pass for battlefield sprites

- Add Music Lab for A/B testing map-theme candidates

- Add battle-music contenders (horn & strings) to Music Lab

- Add real MIDI transcription as a 5th Music Lab candidate

- Author W-1 node spine + life coordinates; backlog alignment pass (#76)

- Author frontier-town battle-map lanes + build slots (G-9 data template) (#82)

- Color-blind mode — pattern fills per tower type

- Commit chosen Verdant region world map + file W-7 map-life overlay (#75)

- Disable quiz gate for testing, compact quiz card, letterbox backdrop, smaller goblins

- Fantasy-themed battle-screen HUD chrome (wave/quiz/radial/back buttons)

- Gemini sparkle watermark removal script + map art pipeline docs

- Goblin pilot sprite assets (A-1 done) - walk keyframes + death sequence

- Landscape battle map + painted Verdant world map (G-9) (#88)

- Mirror frontier-town for left-to-right flow; 11 slots centered in clearings (#84)

- Original driving march theme for the world/region map

- Painted Ranger tower art, code-side shadow, testing gold bump (#94)

- Painted goblin renderer (A-3), all-goblin wave 1, battle music, compact wave button

- Play a real temp audio file for the map theme (WorldMap.m4a)

- Playtest round 3 - sprite size/quality, single battle song, HUD cleanup, two-tap build with stat card, arrow SFX

- Radial build/manage menu replaces persistent tower bar (#93)

- Relic system — data model, exclusivity, upkeep, equip menu

- Seamless full-bleed game UI, remove duplicate top bar (#89)

- Tower facing — orient toward the road, front/back art (#98)

- Wire new Frontier Town painted map (path + slots) and add unit-art backlog


### 🐛 Bug Fixes

- HiDPI canvas - battle was rendering at 1/3 native resolution on phones

- Accurate slot taps, grounded tower shadow, 4th ranger tier (#95)

- Bypass HTTP/CDN caching for SW-installed assets (#100)

- Clamp Frontier Town waypoints to the road's grid row

- Enemy pathing follows the painted road, re-center build slots

- Frontier-town reduced to 10 build slots, aligned to painted clearings (#83)

- Home screen requires scrolling to see Start Game button (#90)

- Home screen width cap, region map crop-fill, header opacity

- Landscape maps were wasting ~20-40% of screen width/height

- Node spine onto road ribbon; name nodes + per-node battle themes (#77)

- Nudge frontier-town s3 down into its clearing (161,290) (#85)

- Prevent pull-to-refresh bounce, nudge install for true fullscreen (#91)

- Re-fit battle canvas on rotation + force-update via version badge

- Regenerate Frontier Town's levelDef fresh instead of a stale persisted snapshot (#101)

- Remove Nano Banana watermark from verdant terrain background (#73)

- Spine bend-spread pass — 5 nodes repositioned onto the trail (#79)

- Standing stones marker onto the road west of the circle (321,217) (#80)

- Stones node onto road; swap Lakeside Hamlet for Charcoal Burners' Camp (#78)

- Stop map music on entering battle, trim loop tail

- Swap map theme to MP3 (world-map-temp.mp3), drop broken M4A

- Tower shadows follow each sprite's own silhouette (#96)

- True landscape width, integrated map header, tower centering (#92)

- Tune shadow squash for legibility at real mobile scale (#97)

- Tutorial enemy speed on the straight road + bigger painted sprites


### 📚 Content

- Add questions: Parts 1, 2, 4, 6


### 🔧 Infrastructure

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Home screen: splash-art background + fantasy-styled buttons (#87)

- Remove obsolete pixel-art deco assets, land new Verdant worldmap art (#71)

- Add G-9 (multi-path map topology) and G-10 (barracks tower) (#59)

- Add Verdant world-map style reference contact sheet (#72)

- Add art-direction session handoff, flag G-9 for human review (#63)

- Add landscape orientation to G-9 scope (#61)

- Audit question bank for stale content — none found

- Battle-map generation prompt book — all 13 remaining Verdant maps (#86)

- Correct G-9 -- run map also needs landscape orientation (#62)

- Document stale scope premise, skip until re-scoped

- Extract canvas render block into renderer section

- Fold fixed build-slot placement into G-9 (#60)

- Linear world-map pivot — add W section, rescope G-9, retire V-24/V-35 (#74)

- Mark EQ-6 done, note tdMoveEnemy no longer axis-aligned-only

- Mark EQ-7 done (inventory panel + relic-acquired prompt)

- Master battle-map prompt + unique prompts for all 14 Verdant levels

- Nest assets by world; retire legacy deco loader; land frontier-town battle map (#81)

- Reorganize docs into docs/, README leads with the game (#99)

- Session handoff 2026-07-02 (105 pts — S-4, EQ-4, C-7, U-4)


