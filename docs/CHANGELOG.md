# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- EQ-6 store node — power-ups + rarity-weighted relic

- EQ-7 inventory panel + relic-acquired equip prompt

- Frontier Town bandit roster + Ranger L4 multi-projectile (#102)

- Frontier Town rev 7 - new painterly art direction + first-pass authoring

- Frontier Town wide battle map (30x13, rev 6) + map art pipeline updates (#133)

- New Run option on the home screen

- Unit Readability Standard - outline+pop pass for battlefield sprites

- Add Music Lab for A/B testing map-theme candidates

- Add battle-music contenders (horn & strings) to Music Lab

- Add real MIDI transcription as a 5th Music Lab candidate

- Ambient animation layer on the region map

- Dev tooling - in-app map editors, CI verify gate, config.json, dev panel (#142)

- Disable quiz gate for testing, compact quiz card, letterbox backdrop, smaller goblins

- Fantasy-themed battle-screen HUD chrome (wave/quiz/radial/back buttons)

- Gemini sparkle watermark removal script + map art pipeline docs

- Goblin pilot sprite assets (A-1 done) - walk keyframes + death sequence

- Map authoring overlay (?author=1) (#136)

- New regenerated region map (nodes re-placed) + road-structure occlusion

- Original driving march theme for the world/region map

- Painted goblin renderer (A-3), all-goblin wave 1, battle music, compact wave button

- Play a real temp audio file for the map theme (WorldMap.m4a)

- Playtest round 3 - sprite size/quality, single battle song, HUD cleanup, two-tap build with stat card, arrow SFX

- Polygon occluders + back buttons in author/dev tools (#143)

- Regen ranger tier 1 as grounded timber watchtower (#140)

- Reshape Verdant spine - node re-placement, Fishing Camp added (#130)

- Tower facing — orient toward the road, front/back art (#98)

- Wire new Frontier Town painted map (path + slots) and add unit-art backlog


### 🐛 Bug Fixes

- HiDPI canvas - battle was rendering at 1/3 native resolution on phones

- Accurate slot taps, grounded tower shadow, 4th ranger tier (#95)

- Author-mode copy confirmation flash + clipboard fallback (#137)

- Bypass HTTP/CDN caching for SW-installed assets (#100)

- Clamp Frontier Town waypoints to the road's grid row

- Draw the painted map nearest-neighbor - map was blurry vs crisp units (#144)

- Enemy pathing follows the painted road, re-center build slots

- Home screen width cap, region map crop-fill, header opacity

- IPhone landscape home fit + sheep tint; docs: K-section backlog review + STATUS handoff (#132)

- Landscape maps were wasting ~20-40% of screen width/height

- Playtest round 4 - landscape home fit, arrow physics, full-bleed map, ambient polish (#131)

- Re-fit battle canvas on rotation + force-update via version badge

- Regenerate Frontier Town's levelDef fresh instead of a stale persisted snapshot (#101)

- Region map node placement redone with road-mask snapping

- Rev6 follow-ups - one-run flow, Eldervale title, battle-map polish (#134)

- Round-2 polish - Cinzel title, visible mist drift, precise occluders (#135)

- Stop map music on entering battle, trim loop tail

- Swap map theme to MP3 (world-map-temp.mp3), drop broken M4A

- Tower shadows follow each sprite's own silhouette (#96)

- Tune Frontier Town enemy pathing, tower slots and occluders (#138)

- Tune shadow squash for legibility at real mobile scale (#97)

- Tutorial enemy speed on the straight road + bigger painted sprites


### 🔧 Infrastructure

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Adjust object placement and occlusion

- Mark EQ-6 done, note tdMoveEnemy no longer axis-aligned-only

- Mark EQ-7 done (inventory panel + relic-acquired prompt)

- Master battle-map prompt + unique prompts for all 14 Verdant levels

- Modularize Quiz Defense - map data from JSON, drill.js split in four (#141)

- Remove dead multi-world code and retired deco/music systems from drill.js (#139)

- Reorganize docs into docs/, README leads with the game (#99)

- Resolution-independent map rendering + pixelArt flag - hi-res regen prep (#145)


