# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- EQ-1 gold economy reform (carry-over, wave-clear bonus)

- TD map visual overhaul — three-act themes, background fills, animation system (#17)

- TD tutorial, tower inspect card, gold kill floaters (U-1, U-10, U-11)

- Background music on home, map, and battle screens (#23)

- Data-flow dots, directional muzzle flash, reduced-motion (#33)

- Derive APP_VERSION from SW cache name

- Endless mode — procedural waves after victory with kill/batch score (#47)

- Float tower placement chip near tower, larger buttons

- Offline question-bank versioning (I-3)

- Power-up system — data model, pre-wave tray, effect engine (#45)

- Replace SMIL pulse with CSS animation on run-map nodes (drill.css)

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

- Block session URLs in pre-push hook

- Changelog auto-generation, no-PII commit rule, C-1 status update

- Crash in AudioContext unlock + retry on failure

- Dedup changelog entries from retry commits

- IOS audio session escalation + statechange realignment

- Pre-push hook skips deletes, only verifies drill changes

- Proper async iOS audio unlock + session activation (#25)

- Reset stuck-active run nodes when showing run map

- Unlock Web Audio on iOS via shared context + gesture listener (#24)


### 📚 Content

- Add questions: Parts 1, 3, 5, 6

- Add questions: Parts 2, 3, 6, 7

- Add questions: Parts 3, 4, 6, 7

- Add questions: Parts 7, 8, 9 and Interview Prep (20 questions, bank → 200)


### 🔧 Infrastructure

- Eliminate scroll during TD gameplay (#15)

- Initial commit

- Ban session URLs and Generated-by footers in all PR bodies

- Harden nightly prompt — handoff file, inline PRs, conflict resolution (#20)

- Make .claude/skills scripts executable

- Merge TODO.md into BACKLOG.md as single nightly source

- Ramp nightly session target to 150 effort points per run (#19)

- Session handoff 2026-06-29 (#34)

- Session handoff 2026-06-29 session 2

- Show live AudioContext state in version badge (#28)

- Strip session URLs from all PR bodies, not just questions/* (#21)

- Update nightly prompt to use dynamic backlog picking (#18)


