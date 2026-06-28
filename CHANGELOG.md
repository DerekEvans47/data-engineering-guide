# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- EQ-1 gold economy reform (carry-over, wave-clear bonus)

- TD map visual overhaul — three-act themes, background fills, animation system (#17)

- TD tutorial, tower inspect card, gold kill floaters (U-1, U-10, U-11)

- Background music on home, map, and battle screens (#23)

- Float tower placement chip near tower, larger buttons

- Replace SMIL pulse with CSS animation on run-map nodes (drill.css)

- Show app version on home screen (#26)


### 🐛 Bug Fixes

- U-2 touch target audit — enforce ≥48 px on all interactive elements

- Audio not working in TD drill + pre-commit changelog hook (#22)

- Block session URLs in pre-push hook

- Changelog auto-generation, no-PII commit rule, C-1 status update

- Dedup changelog entries from retry commits

- Pre-push hook skips deletes, only verifies drill changes

- Proper async iOS audio unlock + session activation (#25)

- Reset stuck-active run nodes when showing run map

- Unlock Web Audio on iOS via shared context + gesture listener (#24)


### 📚 Content

- Add questions: Parts 2, 3, 6, 7

- Add questions: Parts 7, 8, 9 and Interview Prep (20 questions, bank → 200)


### 🔧 Infrastructure

- Eliminate scroll during TD gameplay (#15)

- Initial commit

- Ban session URLs and Generated-by footers in all PR bodies

- Harden nightly prompt — handoff file, inline PRs, conflict resolution (#20)

- Make .claude/skills scripts executable

- Merge TODO.md into BACKLOG.md as single nightly source

- Ramp nightly session target to 150 effort points per run (#19)

- Strip session URLs from all PR bodies, not just questions/* (#21)

- Update nightly prompt to use dynamic backlog picking (#18)


