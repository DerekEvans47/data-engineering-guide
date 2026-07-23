# Data Engineering Guide — Changelog

A record of every feature, fix, and improvement shipped to the project.

## Unreleased

### ✨ Features

- 20-relic system with real effects + in-app relic editor (?dev=1) (#148)

- Frontier Town rev 7 - new painterly art direction + first-pass authoring

- Frontier Town wide battle map (30x13, rev 6) + map art pipeline updates (#133)

- New Run option on the home screen

- Unit Readability Standard - outline+pop pass for battlefield sprites

- Ambient animation layer on the region map

- Barracks units block the lane and fight enemies in melee (#158)

- Dev tooling - in-app map editors, CI verify gate, config.json, dev panel (#142)

- Disable quiz gate for testing, compact quiz card, letterbox backdrop, smaller goblins

- Goblin attack animation + canonical art reference pipeline (#160)

- Make run gold/lives truly persistent, add shop consumables

- Map authoring overlay (?author=1) (#136)

- New regenerated region map (nodes re-placed) + road-structure occlusion

- Optional quiz, real starting gold, remove dead dungeon mode (#147)

- Playtest round 3 - sprite size/quality, single battle song, HUD cleanup, two-tap build with stat card, arrow SFX

- Polygon occluders + back buttons in author/dev tools (#143)

- Regen ranger tier 1 as grounded timber watchtower (#140)

- Relic editor - remove emoji from header, add search/filter/sort/view toggle (#156)

- Relic vault on Home + compact grid redesign, goblin-only Frontier Town waves (#153)

- Render relic sprite art in-game, drop the two defective icons (#152)

- Reshape Verdant spine - node re-placement, Fishing Camp added (#130)

- Slice relic icon sheet into 36 transparent PNGs (20 wired ids + 16 placeholders)

- Split build radial menu into towers-top / barracks-bottom hexagon (#157)


### 🐛 Bug Fixes

- HiDPI canvas - battle was rendering at 1/3 native resolution on phones

- Author-mode copy confirmation flash + clipboard fallback (#137)

- Depth-sort towers vs units + NN sampling for rev 7 map

- Draw the painted map nearest-neighbor - map was blurry vs crisp units (#144)

- Goblin attack loop skips the overhead windup frame (#161)

- IPhone landscape home fit + sheep tint; docs: K-section backlog review + STATUS handoff (#132)

- Playtest round 4 - landscape home fit, arrow physics, full-bleed map, ambient polish (#131)

- Region map node placement redone with road-mask snapping

- Relic editor 3-column grid + fix dead-space bug, larger Home config button (#155)

- Rev6 follow-ups - one-run flow, Eldervale title, battle-map polish (#134)

- Round-2 polish - Cinzel title, visible mist drift, precise occluders (#135)

- Swap relic menu placement - player select on world map, dev editor on Home (#154)

- Tower shadows render as dark silhouettes on iOS Safari (#146)

- Tune Frontier Town enemy pathing, tower slots and occluders (#138)


### 🔧 Infrastructure

- Add Glossary card to the hub; flag stale docs and fix stale comments (#165)

- Add a learning landing page and a term-flashcards app (#163)

- Add files via upload

- Add files via upload

- Add files via upload

- Add files via upload

- Delete Gemini_Generated_Image_ngutc5ngutc5ngut.png

- Move game docs under game/ and add the game's PII hooks + CLAUDE.md (#166)

- Separate the tower-defense game from the learning material (#162)

- Unify the glossary and connect every learning app to the hub (#164)

- Adjust object placement and occlusion

- Keep repo links out of copy-paste image-gen prompts (#159)

- Make ?dev=1 the single Creator Mode link (#150)

- Modularize Quiz Defense - map data from JSON, drill.js split in four (#141)

- Remove dead multi-world code and retired deco/music systems from drill.js (#139)

- Resolution-independent map rendering + pixelArt flag - hi-res regen prep (#145)

- Unify ?dev and ?author into one Creator Mode with on-page toggles (#149)


