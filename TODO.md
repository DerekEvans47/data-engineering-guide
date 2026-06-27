# Technical Debt & Structural TODO

This file tracks architectural improvements, refactoring work, and content expansion.
It complements `BACKLOG.md` (game design features) and is consumed by the nightly run.

A nightly agent should pick the **highest-priority, lowest-effort item with no unresolved
dependencies** across both this file and `BACKLOG.md`.

---

## Priority Key

| Tier | Description |
|------|-------------|
| P0   | Blocking — causes data loss, crashes, or prevents core features |
| P1   | High — significantly improves maintainability or user experience |
| P2   | Medium — useful polish or debt reduction |
| P3   | Low — optional, schedule opportunistically |

---

## S — Structure & Modularization

Addresses the core finding from the 2026-06-25 repo audit: `drill.js` is a 3,448-line
monolith with 126+ functions and zero module boundaries.

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| S-1 | Extract storage layer from drill.js | 15 | P0 | DONE | — | Create `StorageManager` object wrapping all 37 localStorage calls. Single source of truth. Add try/catch for private-browsing failures. Enables I-1 through I-4. |
| S-2 | Extract question-logic module | 20 | P1 | TODO | S-1 | Pull shuffle, filter, accuracy tracking, and session-queue logic out of drill.js into a self-contained section or file. Reduces coupling to game loop. |
| S-3 | Extract tower-defense engine block | 40 | P1 | TODO | — | Move enemy AI, tower targeting, projectile physics, and wave-spawn logic into a clearly delimited section of drill.js (or separate file if bundler added). Give it a clean `TDGame` interface. |
| S-4 | Extract canvas render block | 30 | P1 | TODO | S-3 | Move all `tdRender` sub-functions (sprites, terrain, HUD, particles) into a renderer section. Separate draw logic from game-state mutation. |
| S-5 | Cache frequently accessed DOM elements | 8 | P1 | DONE | — | 194 `getElementById`/`querySelector` calls, many repeated in the 60 fps render loop. Cache refs in an `EL` object at `bindUI()` time. Low effort, measurable perf gain on low-end mobile. |
| S-6 | Data-drive TD level/tower/enemy config | 18 | P2 | TODO | — | Move `TD_LEVEL_DEFS`, tower cost/stat tables, and enemy stat tables out of drill.js into a config block or JSON file. Makes tuning accessible without touching game logic. |
| S-7 | Split drill.css into logical layers | 25 | P2 | TODO | — | Reorganize into clearly labelled sections: variables/reset, layout, components (cards, buttons, HUD), screens (home, world-map, game, study), animations. Currently 2,016 lines mixed together. |
| S-8 | Add error handling at system boundaries | 10 | P0 | DONE | S-1 | `fetch('question-bank.json')` has no error fallback. localStorage can throw in private browsing. Wrap both with try/catch and show a user-facing message on failure. |
| S-9 | JSON schema + load-time validation for question-bank | 12 | P1 | DONE | — | Define expected shape for a question object. Validate on load; log warnings for malformed entries so broken questions fail loudly during development. |
| S-10 | TypeScript migration (stretch goal) | 80 | P3 | TODO | S-1,S-2,S-3,S-4 | Adds compile-time safety for game state and question objects. Only worthwhile after modules are extracted. Optional — assess after S-1 through S-4 are done. |

---

## Q — Question Bank Expansion

Content growth needed to make spaced repetition and drill mode meaningful (target: 300+ questions).

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| Q-1 | Add 30 questions for Parts 1–3 | 20 | P0 | DONE | — | Current bank has 100 total. Parts 1–3 are most-played; add coverage for ADLS, ADF, Spark, dbt, CTEs, Delta Lake. Use QUESTION_GENERATION_PROMPT.md. |
| Q-2 | Add 30 questions for Parts 4–6 | 20 | P1 | DONE | Q-1 | Analytics/viz, delivery/leadership, AI & agentic systems. |
| Q-3 | Add 20 questions for Parts 7–9 + Appendix | 15 | P1 | DONE | Q-2 | PM fundamentals, ML/statistics, supply chain, interview prep. |
| Q-4 | Add scenario/case-study question type | 25 | P2 | TODO | Q-1 | Multi-sentence scenario followed by 4 options. Requires new `type: "scenario"` in schema and a wider card render. More realistic to real-world DE decision-making. |
| Q-5 | Review and update stale questions | 10 | P2 | TODO | — | Some questions may reference outdated services or API versions. Audit and update annually. |

---

## G — Guide Content Gaps

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| GC-1 | Finish Part 9 (Supply Chain Analytics) | 30 | P2 | TODO | — | GUIDE_PLANNING.md shows only 2 of the planned sections are written. Add remaining sections. |
| GC-2 | Add code examples to Part 3 sections | 20 | P2 | TODO | — | Spark, PySpark, dbt, and advanced SQL sections would benefit from runnable code blocks with syntax highlighting. |
| GC-3 | Cross-link guide sections to drill questions | 15 | P2 | TODO | — | Add "Practice this in Quiz Defense →" call-to-action links at the bottom of each guide section, deep-linking to the relevant drill topic. |

---

## A — Accessibility & Platform

| ID  | Title | Effort | Priority | Status | Dependencies | Notes |
|-----|-------|--------|----------|--------|--------------|-------|
| A-1 | Touch target audit (≥48 px) | 10 | P1 | TODO | — | Canvas tap zones and HUD buttons need minimum 48 px hit areas. Already tracked as U-2 in BACKLOG; duplicate here for structural visibility. |
| A-2 | Respect `prefers-reduced-motion` | 8 | P2 | TODO | — | Disable CSS animations and canvas particle effects if system preference is set. Low effort. |
| A-3 | Offline fallback for question-bank fetch failure | 12 | P1 | DONE | S-8 | If `question-bank.json` fails to load and no SW cache exists, show a graceful error with retry button rather than a blank screen. |

---

## Completed Items

| ID  | Title | Completed |
|-----|-------|-----------|
| —   | Repo structure audit | 2026-06-25 |
| S-1 | Extract storage layer (StorageManager wrapping 39 localStorage calls) | 2026-06-26 |
| S-8 | Error handling at system boundaries (res.ok check + try/catch) | 2026-06-26 |
| S-5 | Cache DOM refs in EL object (bindUI + initTDGame; 38 hot-path lookups eliminated) | 2026-06-26 |
| S-9 | validateQuestionBank(): schema check on load, warns + skips malformed entries | 2026-06-26 |
| A-3 | Offline fallback already implemented via S-8 error handler (retry button shown) | 2026-06-26 |
| Q-1 | Add 30 questions for Parts 1–3 (10+12+8; bank now 130 total) | 2026-06-26 |
| Q-2 | Add 30 questions for Parts 4–6 (10+10+10; bank now 160 total) | 2026-06-26 |
| Q-3 | Add 20 questions for Parts 7–9 + Interview Prep (bank now 200 total) | 2026-06-27 |

---

*Last updated: 2026-06-27. Picking order: filter `Status = TODO`, sort by Priority then Effort ascending, take the first item whose dependencies are all `DONE` or `—`.*
