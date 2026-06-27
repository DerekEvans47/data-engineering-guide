# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- Deep roguelite themes — acts, relics, room types, rest sites (#29)

- Gold economy, consumable items, shop rooms, longer floors

- Kingdom Rush-style world map, 9 levels, tower upgrades, difficulty scaling

- Mario World-style run map with difficulty-colored nodes (#63)

- S-5 DOM cache, S-9 question-bank validation, syntax question prompt

- Slay the Spire-style branching dungeon map with animated enemies (#28)

- T-2 chiptune BGM, T-3 spatial audio, T-4 adaptive music intensity

- Tower Defense mini-game — quiz powers your towers

- U-6 pause, U-7 place confirm, U-8 free sell, G-1 boss enemies

- UI overhaul — rename to Quiz Defense, add home screen

- V-7 Parallax terrain: animated grass, pebbles, breathing vignette

- Visual & audio polish: backlog, Web Audio, HUD, placement ghost, star screen

- Visual pass: canvas theme, enemy emojis, fire pulse, hit flash, projectile trail

- Animated map sprites, cross-path branching (#64)

- Dark redesign, gamification & dungeon crawler mode

- Illustrated SVG world map with biome terrain and winding road

- Pixel-art sprite overhaul — replace emoji with canvas sprites (#40)

- Procedural run-based map system with 3 themed maps

- Reduced-motion support and offline retry button (A-2, A-3)

- Storage layer, error handling, auto-save, save export/import (#54)

- Stylized terrain decorations for all 9 levels (#42)

- Wave preview, cobblestone path, bug fixes, verification gate, changelog


### 🐛 Bug Fixes

- Blank home screen crash on first load (tdLoadStars array)

- Bump SW cache to v19 to serve fixed drill.js

- Correct field names in TD quiz rendering (#49)

- Restore --tab-h var, add TODO/NIGHTLY_PROMPT docs

- Syntax error in TD_ENEMY_DEFS (] should be })


### 📚 Content

- Add questions: Parts 1, 2, 3 (#55)

- Add questions: Parts 1, 3, 8, 9

- Add questions: Parts 3, 4, 5, 8 (#53)

- Add questions: Parts 4, 5, 6 (Q-2, 30 questions, sw v26)

- Add questions: Parts 7, 8, 8, 9


### 🔧 Infrastructure

- Add .gitignore to exclude Playwright test-results directory

- Add PWA icons for drill app home screen install

- Add Part 2 challenge questions: Data Fundamentals

- Add Part 3 challenge questions: Compute & Transformation

- Add Parts 4, 5 & 6 challenge questions: Analytics & Visualisation / Delivery & Leadership / AI & Agentic Systems

- Add branch verification rule to CLAUDE.md

- Add dark mode toggle to drill app

- Add learn/drill service worker checklist to CLAUDE.md

- Add mobile drill app with PWA support and question bank

- Add permanent question ID numbers to cards

- Add question numbers to cards; restore full explanations

- Add scenario review system with async Claude feedback

- Bump service worker cache to v27

- Fix auto-merge workflow for question generation PRs

- Fix drill app scroll: natural page scroll with sticky bottom bar

- Migrate challenge questions to run-file architecture

- Remove hardcoded question count from README

- Simplify learn/drill to tower defense game with home screen

- Unified Study + Drill app; retire challenge questions and scenarios

- Update README to reflect consolidated app structure

- Update README to reflect full learning system scope (#14)

- Add .nojekyll for GitHub Pages static serving

- Add 20 questions for Parts 3, 6, 7, 8 (sw v36)

- Blank Study page and frozen TD quiz overlay

- Prevent session URLs in automated PRs and commits

- Restructure repo into guide/, learn/, and content/ hierarchy

- Update changelog


