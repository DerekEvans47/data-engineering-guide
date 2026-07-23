# Quiz Defense

Two things in one PWA, kept separate: a standalone tower-defense **game** that themes the
modern data engineering & AI stack, and a self-directed **learning suite** (Study/Drill
modes plus a full written guide) built on a shared question bank. Place towers, defend
against waves of enemies, and earn gold from kills — progressing across a node-based run
map through three acts. When you want to study instead of play, the same app's **Study &
Drill** modes work the question bank directly. The game no longer gates play behind
questions; the two experiences are decoupled and each stands on its own.

Play it at `learn/drill/index.html` (installable as a PWA — see below), or read the
reference guide directly if you'd rather skip the game.

## The game

- **Painted battle maps.** Each map is a hand-painted isometric scene (starting with
  Frontier Town) with a fixed road your enemies walk and a handful of buildable
  clearings alongside it.
- **Towers that face the road.** Ranger towers render as painted-pixel-art structures
  with distinct tiers (wood → wood/stone → stone → stone & diamond) and orient toward
  whichever direction the road actually runs past their clearing — front or back art,
  picked automatically from the map geometry, with code-side mirroring covering the
  other two facings.
- **Kill-driven economy.** Defeated enemies pay out gold; wave clears and shops let you
  reinvest between waves. Fund and time your defense purely through play — no questions
  involved.
- **A run, not just a level.** The world map is split into three acts — **The Verdant
  Frontier**, **The Cursed Graveyard**, and **The Void** — each mapped to three parts of
  the guide (1–3, 4–6, 7–9 respectively). Between battles, a node-based run map offers
  shops, rest sites, elite fights, and random events, with relics and power-ups to build
  around.
- **Offline-installable PWA.** Add to Home Screen on iPhone or Android; a service
  worker caches everything needed to play without a connection.

## The guide

Alongside the game is a full self-directed reference guide — Parts 1–9 plus an
appendix — covering the same material the Study/Drill question bank is drawn from. It's
there if you want to read deeply on a topic instead of (or alongside) playing; the game
doesn't require it.

<details>
<summary><strong>Guide contents (Parts 1–9 + Appendix)</strong></summary>

### Part 1 — The Data Platform Foundation
| Section | Topic |
|---|---|
| 1.1 | The Modern Data Stack |
| 1.2 | Medallion Architecture |
| 1.3 | Azure Data Lake Storage |
| 1.4 | Azure Data Factory |
| 1.5 | Data Mesh |

### Part 2 — Data Fundamentals & Terminology
| Section | Topic |
|---|---|
| 2.1 | Common Table Expressions (CTEs) |
| 2.2 | Partitions |
| 2.3 | Data Terminology |
| 2.4 | Glossary |

### Part 3 — Compute & Transformation
| Section | Topic |
|---|---|
| 3.1 | YAML & Configuration Languages |
| 3.2 | Advanced SQL |
| 3.3 | Python for Data Engineering |
| 3.4 | Apache Spark & Databricks |
| 3.5 | PySpark |
| 3.6 | Delta Lake & File Formats |
| 3.7 | dbt (data build tool) |

### Part 4 — Analytics & Visualisation
| Section | Topic |
|---|---|
| 4.1 | Dimensional Data Modeling |
| 4.2 | Slowly Changing Dimensions (Types 0–7) |
| 4.3 | Power BI |
| 4.4 | DAX |

### Part 5 — Delivery, Tooling & Leadership
| Section | Topic |
|---|---|
| 5.1 | Agile for Data Teams |
| 5.2 | Git & GitHub |
| 5.3 | MVP-Driven Delivery |
| 5.4 | DataOps & CI/CD |
| 5.5 | Stakeholder Communication & Data Storytelling |
| 5.6 | Change Management & Adoption |

### Part 6 — AI & Agentic Systems
| Section | Topic |
|---|---|
| 6.1 | How LLMs Work |
| 6.2 | Model Context Protocol (MCP) |
| 6.3 | Retrieval-Augmented Generation (RAG) |
| 6.4 | AI Agents & Sub-Agents |
| 6.5 | Agentic Data Pipelines |
| 6.6 | LLM Fine-Tuning vs. Prompting |
| 6.7 | NLP Task Types in Practice |

### Part 7 — Product Management Fundamentals
| Section | Topic |
|---|---|
| 7.1 | User Stories & Roadmaps |
| 7.2 | Jira, Confluence & Figma in Practice |
| 7.3 | UX Principles for Data Products |
| 7.4 | The Software Development Lifecycle |

### Part 8 — Classical ML & Statistics
| Section | Topic |
|---|---|
| 8.1 | Regression & Classification |
| 8.2 | Clustering & Unsupervised Learning |
| 8.3 | Model Evaluation Metrics |
| 8.4 | A/B Testing & Hypothesis Testing |
| 8.5 | Deep Learning Basics |

### Part 9 — Supply Chain Analytics
| Section | Topic |
|---|---|
| 9.1 | Demand Forecasting Basics |
| 9.2 | Inventory Optimization |

### Appendix
| Section | Topic |
|---|---|
| A | Free Tier Resources & Hands-On Practice |
| B | Quick Reference Cards |
| C | Security Fundamentals |
| D | Interview Preparation Guide |

**Guide features:** interactive quizzes with immediate feedback, hover/click glossary
tooltips, sortable comparison tables, collapsible deep-dive sections, scroll-reveal SVG
diagrams, prev/next section navigation, full sidebar table of contents.

</details>

The learning material lives in its own **Study & Drill** section, reached from the home
screen (separate from the game's Play flow). It's built on the shared question bank and
never touches the tower-defense engine:

- **Study Mode** — all 9 parts with per-part progress bars, worked through in order, plus
  a Daily Challenge.
- **Drill Mode** — a randomised queue across all parts (or a filtered subset) that
  tracks which questions you've seen so it doesn't repeat until you've exhausted the
  pool.

## Installing on iPhone

1. Open `learn/drill/index.html` in Safari.
2. Tap the Share icon → **Add to Home Screen**.
3. The app installs as a standalone PWA with offline support.

## Question bank

`content/question-bank.json` grows with each generation run — the app shows live
question counts per part. Each batch targets the least-covered sections; at most 50% of
questions are drawn directly from guide content, the rest extend into adjacent tooling,
real-world application, and practitioner-level depth not covered in the guide itself.
Generation prompts live in `docs/QUESTION_GENERATION_PROMPT.md` and
`docs/SYNTAX_QUESTION_GENERATION_PROMPT.md`.

## Repository structure

```
learn/
  drill/                               ← Quiz Defense (game + Study/Drill modes)
    index.html, drill.css, sw.js
    drill-core.js, drill-audio.js, drill-world.js, drill-td.js
    config.json                      ← all gameplay tuning (towers/enemies/…)
    assets/                            ← battle maps, tower art, world/region art
guide/
  index.html                           ← Cover page / table of contents
  assets/                              ← Shared CSS and JS
  01-data-platform-foundation/  …  09-supply-chain-analytics/
  appendix/                            ← A–D
content/
  question-bank.json                   ← Shared question bank
docs/                                  ← Planning docs, art/prompt generation notes, changelog
  BACKLOG.md                           ← Game design & technical backlog
  CHANGELOG.md                         ← Auto-generated, do not hand-edit
  *_GENERATION_PROMPT*.md              ← Paste-into-Claude prompt templates
  ART_DIRECTION_HANDOFF.md, *_HANDOFF.md, GUIDE_PLANNING.md
scripts/                                ← Asset-processing utilities (chroma-key/checker removal)
CLAUDE.md                              ← Project rules for Claude Code (stays at root)
```

## Technical

Pure HTML, CSS, and vanilla JavaScript — no build step, no dependencies, no framework.
Hosted on GitHub Pages. The game and drill app are a single PWA with a service worker
for offline support; progress is tracked client-side via `localStorage`.
