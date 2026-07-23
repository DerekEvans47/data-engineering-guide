# Data Engineering Guide

A self-directed learning resource for the modern data engineering & AI stack. This repo
holds the **learning material**, split into three independent pieces that share a common
question bank:

- **Study & Drill app** (`learn/drill/`) — a standalone PWA with **Study Mode** (all 9
  parts, progress tracked), **Drill Mode** (randomized flashcards, optionally filtered),
  and a **Daily Challenge**. Open `learn/drill/index.html`.
- **The written guide** (`guide/`) — a full reference site, Parts 1–9 plus an appendix,
  with interactive quizzes, glossary tooltips, and diagrams. Open `guide/index.html`.
- **The question bank** (`content/question-bank.json`) — the shared source of questions
  the Study & Drill app is built on.

> **Note — the game moved out.** A tower-defense game (*Quiz Defense*) used to live here.
> It has been fully separated into the self-contained [`game/`](game/) folder and is
> destined for its own repository — it shares no code with the learning material. See
> [`game/README.md`](game/README.md). Once it's living in its own repo, the `game/` folder
> can be removed from here.

## The Study & Drill app

- **Study Mode** — all 9 parts with per-part progress rings, worked through in order.
- **Drill Mode** — a randomized queue across all parts (or a filtered subset) that tracks
  which questions you've seen so it doesn't repeat until you've exhausted the pool.
- **Daily Challenge** — a fixed 5-question set each day worth 1.5× XP.
- **Gamification** — XP, levels/ranks, streaks, achievements, and per-question mastery,
  all tracked client-side via `localStorage`.
- **Offline-installable PWA** — Add to Home Screen on iPhone or Android; a service worker
  caches everything needed to study without a connection.

## The guide

A full self-directed reference guide — Parts 1–9 plus an appendix — covering the same
material the Study/Drill question bank is drawn from. Read deeply on a topic instead of
(or alongside) the flashcards.

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
  drill/                               ← Study & Drill app (Study/Drill/Daily)
    index.html, learn.css, sw.js
    learn-core.js                    ← storage, XP/achievements, boot, home, study/drill flow
    assets/                            ← splash background + font
guide/
  index.html                           ← Cover page / table of contents
  assets/                              ← Shared CSS and JS
  01-data-platform-foundation/  …  09-supply-chain-analytics/
  appendix/                            ← A–D
content/
  question-bank.json                   ← Shared question bank
game/                                  ← Standalone tower-defense game (separated; bound for
                                         its own repo — shares no code with the above)
docs/                                  ← Planning docs, prompt generation notes, changelog
  CHANGELOG.md                         ← Auto-generated, do not hand-edit
  *_GENERATION_PROMPT*.md              ← Paste-into-Claude prompt templates
scripts/                                ← Asset-processing utilities (used by the game)
CLAUDE.md                              ← Project rules for Claude Code (stays at root)
```

## Technical

Pure HTML, CSS, and vanilla JavaScript — no build step, no dependencies, no framework.
Hosted on GitHub Pages. The Study & Drill app is a self-contained PWA with a service
worker for offline support; progress is tracked client-side via `localStorage`. The
game in `game/` is likewise self-contained and independent.
