# Data Engineering & AI Practitioner's Guide

A self-directed learning system covering the full modern data engineering stack — built to accelerate progression to Director and Principal Data Engineering roles. Combines a textbook-style reference guide with a mobile-first drill app for daily question practice.

## What's in here

| Section | Purpose |
|---|---|
| **Guide** (Parts 1–9 + Appendix) | Reference reading — WHY before WHAT, real trade-offs, no assumed knowledge |
| **DE Drill App** | Mobile PWA with two modes: Study (by part, in order) and Drill (randomised, tracks seen questions) |

---

## Repository Structure

```
guide/
  index.html                          ← Cover page / table of contents
  assets/                             ← Shared CSS and JS
  01-data-platform-foundation/
  02-data-fundamentals/
  03-compute-and-transformation/
  04-analytics-and-visualisation/
  05-delivery-and-leadership/
  06-ai-and-agentic-systems/
  07-product-management-fundamentals/
  08-classical-ml-and-statistics/
  09-supply-chain-analytics/
  appendix/                           ← A–D
learn/
  drill/                              ← DE Drill PWA (Study + Drill modes)
content/
  question-bank.json                  ← Shared question bank (grows with each generation run)
QUESTION_GENERATION_PROMPT.md         ← Paste into Claude for off-peak question generation
```

---

## DE Drill App (`learn/drill/`)

A mobile-first PWA installable via **Add to Home Screen** on iPhone or Android.

### Study Mode
All 9 parts listed with per-part progress bars. Tap a part to work through its questions in order. A back button returns to the part list at any time.

### Drill Mode
Randomised queue across all parts (or a filtered subset). Tracks which questions you've seen so it never repeats until you've exhausted the pool. Session score shown live.

### Question types
- Multiple Choice (4 options, one correct)
- True / False

All questions include a detailed explanation covering why the correct answer is right, why each wrong answer fails, and a practical takeaway.

### Installing on iPhone
1. Open `learn/drill/index.html` in Safari
2. Tap the Share icon → **Add to Home Screen**
3. The app installs as a standalone PWA with offline support

---

## Question Bank

`content/question-bank.json` — grows with each generation run. The app shows live question counts per part.

Questions are generated in batches of 20 (4 sections × 5 questions) using `QUESTION_GENERATION_PROMPT.md`. Each batch targets the least-covered sections. At most 50% of questions are drawn directly from guide content — the rest extend into adjacent tooling, real-world application, common pitfalls, and practitioner-level depth not covered in the guide.

---

## Guide Content

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

---

## Guide Features

- Interactive quizzes with immediate feedback and scoring
- Hover/click glossary tooltips on key terms
- Sortable comparison tables
- Collapsible deep-dive sections
- Scroll-reveal SVG diagrams
- Prev/Next section navigation
- Sidebar with full table of contents
- Mobile-responsive layout

---

## Technical

Pure HTML, CSS, and vanilla JavaScript — no build step, no dependencies, no framework. Hosted on GitHub Pages.

The drill app is a PWA with a service worker for offline support. Question progress is tracked client-side via `localStorage`.
