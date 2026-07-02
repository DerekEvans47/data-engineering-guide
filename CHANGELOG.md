# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- TD map visual overhaul — three-act themes, background fills, animation system (#17)

- Background music on home, map, and battle screens (#23)

- Data-flow dots, directional muzzle flash, reduced-motion (#33)

- Derive APP_VERSION from SW cache name

- Difficulty modifier toggles on level confirm panel (G-8) (#50)

- Endless mode — procedural waves after victory with kill/batch score (#47)

- Enemy special types — fast/armored/flying/healer (#54)

- Landmark anchor objects on TD map (#56)

- Offline question-bank versioning (I-3)

- Power-up system — data model, pre-wave tray, effect engine (#45)

- Relic system — data model, exclusivity, upkeep, equip menu

- Run-map fog of war on deeply-locked nodes (V-25)

- Seeded node position jitter on run map

- Show app version on home screen (#26)

- Sprite sheet deco pipeline replacing parallax grass (#32)

- Themed node shapes on run map (#46)

- Topic tag, XP feedback, question mastery tracking

- Tower idle breathing animation (V-17)

- Type-specific enemy death animations (V-19)


### 🐛 Bug Fixes

- U-2 touch target audit — enforce ≥48 px on all interactive elements

- Audio not working in TD drill + pre-commit changelog hook (#22)

- Auto-reload page when service worker updates (#27)

- Crash in AudioContext unlock + retry on failure

- IOS audio session escalation + statechange realignment

- Proper async iOS audio unlock + session activation (#25)

- Restore alpha transparency on verdant/decay deco sprite sheets (#58)

- Unlock Web Audio on iOS via shared context + gesture listener (#24)


### 📚 Content

- Add questions: Parts 1, 2, 4, 6

- Add questions: Parts 1, 3, 5, 6

- Add questions: Parts 2, 3, 6, 6

- Add questions: Parts 3, 4, 6, 7


### 🔧 Infrastructure

- Eliminate scroll during TD gameplay (#15)

- Add G-9 (multi-path map topology) and G-10 (barracks tower) (#59)

- Add art-direction session handoff, flag G-9 for human review (#63)

- Add landscape orientation to G-9 scope (#61)

- Audit question bank for stale content — none found

- Consolidate TD engine into one delimited section (#53)

- Correct G-9 -- run map also needs landscape orientation (#62)

- Document stale scope premise, skip until re-scoped

- Extract TD Game Config section — tower/enemy/shop/power-up defs (#49)

- Extract canvas render block into renderer section

- Extract question-logic module section in drill.js (#48)

- Fold fixed build-slot placement into G-9 (#60)

- Harden nightly prompt — handoff file, inline PRs, conflict resolution (#20)

- Nightly handoff 2026-06-30 (143 pts — EQ-2, V-23, G-7, S-2, S-6, G-8) (#51)

- Ramp nightly session target to 150 effort points per run (#19)

- Session handoff 2026-06-29 (#34)

- Session handoff 2026-06-29 session 2

- Session handoff 2026-07-01 (#57)

- Show live AudioContext state in version badge (#28)

- Split drill.css into labelled sections (#55)

- Strip session URLs from all PR bodies, not just questions/* (#21)

- Update nightly prompt to use dynamic backlog picking (#18)


