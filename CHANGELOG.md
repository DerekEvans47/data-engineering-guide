# Quiz Defense — Changelog

A record of every feature, fix, and improvement shipped to the app.

## Unreleased

### ✨ Features

- EQ-1 gold economy reform (carry-over, wave-clear bonus)

- TD map visual overhaul — three-act themes, background fills, animation system (#17)

- TD tutorial, tower inspect card, gold kill floaters (U-1, U-10, U-11)

- Float tower placement chip near tower, larger buttons

- Replace SMIL pulse with CSS animation on run-map nodes (drill.css)


### 🐛 Bug Fixes

- U-2 touch target audit — enforce ≥48 px on all interactive elements

- Block session URLs in pre-push hook

- Changelog auto-generation, no-PII commit rule, C-1 status update

- Dedup changelog entries from retry commits

- Pre-push hook skips deletes, only verifies drill changes

- Reset stuck-active run nodes when showing run map


### 📚 Content

- Add questions: Parts 2, 3, 6, 7

- Add questions: Parts 7, 8, 9 and Interview Prep (20 questions, bank → 200)


### 🔧 Infrastructure

- Eliminate scroll during TD gameplay (#15)

- Initial commit

- Ban session URLs and Generated-by footers in all PR bodies

- Make .claude/skills scripts executable

- Merge TODO.md into BACKLOG.md as single nightly source

- Update nightly prompt to use dynamic backlog picking


