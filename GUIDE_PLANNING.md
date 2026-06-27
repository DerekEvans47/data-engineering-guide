# DATA ENGINEERING & AI PRACTITIONER'S GUIDE
## Editorial Planning Notes — v6
*Reference document. Load at the start of every build session.*
*Last updated: Session 7 — Confirmed Part 7 (Product Management Fundamentals,*
*7.1–7.4) is live in the actual repo (resolving v5's open question). Built*
*sections 6.6–6.7 (Applied LLM/NLP, extending Part 6) and Part 9 (Supply*
*Chain Analytics, 9.1–9.2) in full. Updated guide.js TOC + GLOSSARY,*
*index.html (both mobile and desktop TOC blocks, unlocked Part 7), and*
*re-wired live nav between 6.5→6.6→6.7→7.1 and 8.5→9.1→9.2→Appendix A.*
*Applied the Part 8 footer-page renumbering (40–44) and 8.5's forward nav*
*link directly, since the 8.5 file was available this session. 8.1–8.4's*
*footer numbers and 8.1's Prev-button fix still require manual local edits*
*— see MANUAL-EDITS-NEEDED.md, since those four files weren't available in*
*this session's project mount.*
*Session 6: Built out Part 8 (Classical ML & Statistics) in full, 8.1–8.5.*
*Session 5: Added planned (not yet built) Parts 7-9 and 6.6-6.7, based on gap*
*analysis against a specific Director/PM-Data Science job posting.*
 
---
 
## THE MANDATE
 
This guide is an end-to-end trusted source. A reader with surface-level knowledge
of most topics should be able to read A to Z and come out able to direct, evaluate,
and implement solutions across the full modern data engineering stack — including AI.
 
"Come in and be an expert A to Z. Be the trusted source."
 
That means:
- Every technology gets the WHY before the WHAT
- Every choice gets compared to its real alternatives (not just Azure vs Azure)
- Every concept gets a real-world analogy, example, and a "gotcha"
- Every section gets at least one comparison table
- Nothing is assumed knowledge unless it was explicitly covered earlier in the guide
- The guide tells readers what they don't know to ask about
---

## CURRENT BUILD STATE (updated Session 7)
ORIGINAL SCOPE COMPLETE: Parts 1–6 (now 7 sections, 6.1–6.7) + Appendix A–D
PART 7 — COMPLETE AND LIVE: Product Management Fundamentals, 7.1–7.4, confirmed
  present in the actual repo this session (07-product-management-fundamentals/).
PART 8 — COMPLETE: Classical ML & Statistics, 8.1–8.5.
PART 9 — COMPLETE (Session 7): Supply Chain Analytics, 09-supply-chain-analytics/,
  9.1 Demand Forecasting Basics, 9.2 Inventory Optimization. Figures 9.1–9.4,
  pages 47–48.
SESSION 7 ADDITION — 6.6–6.7 (Applied LLM/NLP) COMPLETE: extends Part 6 to
  7 sections. Figures 6.11–6.14, pages 45–46.

Current live structure (target — see manual-edits caveat below for what's
  still pending in your actual local files):
  01-data-platform-foundation/   (5 sections, 1.1–1.5) ✓
  02-data-fundamentals/          (4 sections, 2.1–2.4) ✓
  03-compute-and-transformation/ (7 sections, 3.1–3.7) ✓
  04-analytics-and-visualisation/(4 sections, 4.1–4.4) ✓
  05-delivery-and-leadership/    (6 sections, 5.1–5.6) ✓
  06-ai-and-agentic-systems/     (7 sections, 6.1–6.7) ✓ — ends at Figure 6.14, page 46
  07-product-management-fundamentals/ (4 sections, 7.1–7.4) ✓ — ends page 39
  08-classical-ml-and-statistics/(5 sections, 8.1–8.5) ✓ — ends at Figure 8.10, page 44
  09-supply-chain-analytics/     (2 sections, 9.1–9.2) ✓ — ends at Figure 9.4, page 48
  appendix/                      (4 sections, A–D) ✓ — ends at Figure D.2, page 35

PAGE NUMBERING — KNOWN, ACCEPTED QUIRK (carried forward, not newly introduced):
  Appendix occupies pages 32–35 even though it now sits last in TOC/click-through
  order, after Parts 7, 8, and 9 (pages 36–48). This is the same pattern already
  established when Part 7 and Part 8 were appended after Appendix's existing page
  numbers rather than renumbering Appendix itself. 6.6/6.7/9.1/9.2 continue that
  same precedent: new content gets the next sequential page number after the
  current build-order maximum, not a number reflecting strict Part order. A full
  renumber (Appendix + Part 7 + Part 8, 9 files) is possible later if desired —
  it needs 7.1–7.3, 8.1–8.4, and A/B/C uploaded in a session, since they weren't
  available this session.

OUTSTANDING MANUAL EDITS (see MANUAL-EDITS-NEEDED.md for exact find/replace text):
  - 8-1 through 8-4: footer page numbers (currently old 36–39, need 40–43;
    8.5 was already fixed to 44 this session since that file was available)
  - 8-1: Prev button, disabled "Coming Previously: Part 7" → live link to 7.4
  - 7-1: Prev button → should point to 6.7 (currently likely points to old 6.5)
  - Appendix A: Prev button → should point to 9.2 (currently likely points to old 6.5)
  None of these block the new content from working — they're nav-polish and
  page-numbering-consistency items on files this session didn't have access to.

PLANNED — NOT YET BUILT:
  None remaining from the Session 5 gap-analysis list. Appendix D interview
  questions for Parts 7, 8, and 9 are still outstanding (see below) — this is
  now the top of the recommended build queue.

---
## SCOPE — WHAT "END TO END" MEANS
 

The guide covers a practitioner who needs to:
1. Understand the architecture and WHY each component exists
2. Know which tool to use and WHY over alternatives (including non-Azure options)
3. Be able to implement or direct implementation of solutions
4. Communicate and lead across technical and business stakeholders
5. Work in a modern data team using version control, CI/CD, and agile practices
6. Understand where AI fits into data engineering today and tomorrow

---
## Figure and page numbering
Figures: Figure X.Y where X = part number, Y = sequential within that part
  Part 5 ended at Figure 5.12 → Part 6 begins at Figure 6.1
  Part 6 now ends at Figure 6.14 (6.6–6.7 added Session 7)
NUMBERING CONVENTION RULE:
  All numbered Parts (1, 2, 3...) use number.number format (e.g., 7.1, 7.2).
  The Appendix is the only exception — it uses letter.number format (e.g., D.1, D.2)
  and restarts its own figure sequence per section (A.1, B.1, C.1, D.1...), rather
  than continuing the numeric sequence from the last numbered Part.
Pages: sequential by build order, appended after the current maximum — see the
  "known, accepted quirk" note above for why this no longer matches strict
  Part/TOC order for Appendix specifically.

---
## Navigation — last section in a part
The final section of each part uses sec-nav-disabled on the Next button:
  <!-- <span class="sec-nav-btn sec-nav-next sec-nav-disabled">
    <span class="sec-nav-text"><span class="sec-nav-tag">Coming Next</span>
    <span class="sec-nav-name">Part X — Name</span></span>
    <span class="sec-nav-arrow">&#8594;</span>
  </span> -->
Note: as of Session 7, every Part through Part 9 is built and live, so there
are no disabled "Coming Next" placeholders left anywhere in the guide except
Appendix D's "Guide Complete" end-state, which is correct and permanent.
---

## Repository structure

Sections: 01-data-platform-foundation/, 02-data-fundamentals/,
          03-compute-and-transformation/, 04-analytics-and-visualisation/,
          05-delivery-and-leadership/, 06-ai-and-agentic-systems/,
          07-product-management-fundamentals/, 08-classical-ml-and-statistics/,
          09-supply-chain-analytics/, appendix/
Coming:   Appendix D interview questions for Parts 7, 8, and 9 (next up)

---
## ARCHITECTURAL DECISIONS (Already Made)
 
- Multi-file structure: styles.css / guide.js / section-X-X.html
- Standalone build: python build script inlines CSS+JS for offline/mobile use
- GitHub Pages as hosting target (all relative paths, index.html as entry)
- Each section: Read → Practice → Apply
- Textbook tone: engaging, insight-forward, not documentation-style
- Every section: minimum one comparison table (internal + external competitors)
- Hover/click glossary terms (yellow = key term, blue = defined term)
- Margin notes: Key Term / Legacy Note / Interview Insight / Remember / Reality Check
- Figures: technical schematic style, animated SVG where appropriate
---
 
## COMPLETE TABLE OF CONTENTS — REORDERED
*(Sections ordered least to most complex within each part.
 Parts ordered so each builds on the previous.)*
*(Sections marked ✓ are written. File names reflect final numbering.)*
 
### PART 1 — THE DATA PLATFORM FOUNDATION
*Conceptual entry point. No prior knowledge required.*
- 1.1 The Modern Data Stack ✓ (overview — big picture first)
- 1.2 Medallion Architecture (data organisation pattern — before storage/ingestion)
- 1.3 Azure Data Lake Storage / Blob Storage (the storage layer)
- 1.4 Azure Data Factory (orchestration — more complex than pure storage)
- 1.5 Data Mesh ✓ (most complex — philosophical challenge to the centralised model;
     needs 1.1–1.4 as context before the alternative makes sense)
### PART 2 — DATA FUNDAMENTALS & TERMINOLOGY
*Moved from Part 6. Vocabulary and building blocks before implementation.*
*Reader now has platform context from Part 1; these terms will make sense.*
- 2.1 CTEs (Common Table Expressions) — simplest SQL concept, widely known
- 2.2 Partitions — more complex (3 different types across storage/SQL/compute)
- 2.3 Data Terminology (fill/kill, idempotency, watermark, CDC, etc.)
- 2.4 Glossary (pure reference — always last)
### PART 3 — COMPUTE & TRANSFORMATION
*Was Part 2. Reordered: syntax/languages first, platforms second, tools last.*
- 3.1 YAML & Configuration Languages (syntax only — simplest, used everywhere)
- 3.2 Advanced SQL (foundational, most readers have baseline SQL)
- 3.3 Python for Data Engineering (widely known, builds on SQL context)
- 3.4 Apache Spark & Databricks (platform — needs SQL/Python foundation)
- 3.5 PySpark (Python API for Spark — builds directly on 3.3 + 3.4)
- 3.6 Delta Lake & File Formats (builds on Databricks — needs Spark context)
- 3.7 dbt (most complex — ties SQL, Python, Git, testing, CI/CD together)
### PART 4 — ANALYTICS & VISUALIZATION
*Was Part 3. Internal order was already correct — unchanged.*
- 4.1 Dimensional Data Modeling (foundation before BI tools)
- 4.2 SCDs Types 0–7 (builds directly on 4.1)
- 4.3 Power BI (the tool — needs modeling context from 4.1/4.2)
- 4.4 DAX (hardest part of Power BI — naturally last)
### PART 5 — DELIVERY, TOOLING & LEADERSHIP
*Was Part 4. Reordered: process framework first, tools second, leadership last.*
- 5.1 Agile for Data Teams (framework — context for everything else in this part)
- 5.2 Git & GitHub (practical tool — prerequisite for DataOps)
- 5.3 MVP-Driven Delivery (builds on Agile framework)
- 5.4 DataOps & CI/CD (most technical — needs Git + MVP + Agile)
- 5.5 Stakeholder Communication & Data Storytelling (soft skills)
- 5.6 Change Management & Adoption (broadest scope — organisational transformation)
### PART 6 — AI & AGENTIC SYSTEMS
*Was Part 5. Most complex — builds on everything. Slightly reordered internally.*
- 6.1 How LLMs Work ✓ (foundational — no prereqs beyond the rest of guide)
- 6.2 MCP ✓ (Model Context Protocol — simpler protocol concept)
- 6.3 RAG ✓ (more components: embeddings, vectors, chunking — more complex than MCP)
- 6.4 AI Agents & Sub-Agents ✓ (builds on LLMs + MCP + RAG)
- 6.5 Agentic Data Pipelines ✓ (most complex — applies everything to data engineering)
- 6.6 LLM Fine-Tuning vs. Prompting ✓ (applied layer on top of 6.1's theory;
     when fine-tuning is worth it vs. prompt engineering vs. RAG, revisited)
- 6.7 NLP Task Types in Practice ✓ (text classification, summarization,
     conversational AI; concrete task vocabulary builds on 6.6's tuning concepts)
### PART 7 — PRODUCT MANAGEMENT FUNDAMENTALS ✓ COMPLETE AND LIVE
*New part. Conceptual entry point for PM — no prior knowledge required beyond Part 5's Agile.*
- 7.1 User Stories & Roadmaps ✓ (foundational PM artifacts, simplest concept)
- 7.2 Jira, Confluence & Figma in Practice ✓ (tooling, builds on 7.1's artifacts)
- 7.3 UX Principles for Data Products ✓ (heavier concept, needs 7.1/7.2 context)
- 7.4 The Software Development Lifecycle ✓ (broadest scope, ties Part 5 + Part 7 together)
### PART 8 — CLASSICAL ML & STATISTICS ✓ COMPLETE
*New part. Ordered simplest stats concept to most applied.*
- 8.1 Regression & Classification ✓ (foundational supervised learning)
- 8.2 Clustering & Unsupervised Learning ✓ (builds on 8.1's vocabulary)
- 8.3 Model Evaluation Metrics ✓ (precision, recall, F1, AUC-ROC; needs 8.1/8.2 as context)
- 8.4 A/B Testing & Hypothesis Testing ✓ (applies statistical rigor to business decisions)
- 8.5 Deep Learning Basics ✓ (conceptual fluency only, most complex, naturally last)
### PART 9 — SUPPLY CHAIN ANALYTICS ✓ COMPLETE (Session 7)
*New part. Domain-specific — narrower audience than Parts 1–8.*
- 9.1 Demand Forecasting Basics ✓ (foundational domain concept)
- 9.2 Inventory Optimization ✓ (builds on 9.1's forecasting output)
### APPENDIX
- A: Free Tier Resources & Hands-On Practice ✓
- B: Quick Reference Cards (one per tool) ✓
- C: Security Fundamentals (RBAC, Managed Identities, Key Vault, SAS tokens) ✓
- D: Interview Preparation Guide ✓
  NOTE: once Parts 7–9 are built, revisit Appendix D to add 3–5 interview
  questions per new section, consistent with the existing pattern for Parts 1–6.
---
 
## EXTERNAL COMPETITOR COMPARISONS — BY SECTION
*(Every technology must justify itself against real alternatives. Not just "Azure vs Azure.")*
 
### 1.1 — Modern Data Stack
WHY AZURE OVER:
- AWS: Better Microsoft ecosystem integration (Office 365, Teams, Active Directory).
  Azure wins when org is already Microsoft-first. AWS wins on raw service breadth and maturity.
- GCP: BigQuery is simpler for analytics-only orgs. Azure wins on enterprise integration.
  GCP wins on ML/AI native tooling (Vertex AI).
- Snowflake: Snowflake is simpler, managed, SQL-first. Azure+Databricks wins on
  flexibility, compute separation, and large-scale engineering workloads.
COMPARISON TABLE: Azure stack vs AWS stack vs GCP stack vs Snowflake
(ingestion / storage / compute / consumption layer mapping)
### 1.3 — Medallion Architecture
WHY MEDALLION OVER:
- Traditional staging/ODS/EDW: Medallion is cloud-native, schema-on-read,
  tolerates messy sources better. EDW requires upfront schema agreement.
- Lambda architecture: Medallion is simpler — Lambda required separate batch and
  streaming paths. Medallion unifies them through Delta Lake.
- Kappa architecture: Kappa is streaming-only. Medallion handles both.
COMPARISON TABLE: Medallion vs Lambda vs Kappa vs Traditional EDW
### 1.4 — Azure Data Lake Storage
WHY AZURE BLOB/ADLS OVER:
- Amazon S3: S3 is more mature, larger ecosystem, slightly cheaper at scale.
  ADLS wins on Active Directory integration, fine-grained ACLs, Databricks native.
- Google Cloud Storage (GCS): GCS has BigQuery native integration advantage.
  ADLS wins in Microsoft shops.
- Azure Data Lake Gen1: Deprecated. Gen2 adds Blob compatibility + hierarchical namespace.
- On-premises HDFS: HDFS requires managing your own hardware.
  Cloud object storage is virtually unlimited with zero infrastructure management.
COMPARISON TABLES:
1. Azure Blob vs S3 vs GCS: cost per GB, durability (all 99.999999999%), latency,
   ecosystem integrations, access control model, max object size
2. Azure Storage types: Blob vs Files vs Table vs Queue vs Disk
   (what each does, when to use, cost model)
3. ADLS access tiers: Hot vs Cool vs Cold vs Archive
   (storage cost, retrieval cost, retrieval time, minimum retention)
BLOB STORAGE FULL TREATMENT (user explicitly requested):
- What it is: object storage — each file stored as an independent object with
  metadata and a unique URL. No folder hierarchy in pure Blob (ADLS adds this).
- Why it exists: traditional file systems don't scale to petabytes without
  massive infrastructure. Object storage separates storage cost from compute cost.
- How it differs: File storage = hierarchy of folders. Block storage = raw disk
  (used for VMs). Object storage = flat namespace with infinite scale.
- ADLS Gen2 is Blob Storage + hierarchical namespace + fine-grained POSIX ACLs
- The hierarchical namespace is what makes ADLS work with Databricks efficiently
  (directory operations become atomic instead of iterating every object)
### 1.5 — Azure Data Factory
WHY ADF OVER:
- Informatica: Informatica is more feature-rich for complex transformations but
  extremely expensive. ADF wins on cost and Azure-native integration.
- Talend: Similar comparison to Informatica. On-prem legacy, cloud version exists.
- Fivetran / Airbyte: These are EL tools (Extract-Load), not full orchestration.
  Fivetran wins for SaaS connector depth and ease. ADF wins for enterprise control.
- Apache Airflow: Airflow is code-first (Python DAGs), more flexible, steeper curve.
  ADF wins for no-code/low-code teams. Airflow wins for engineers who want full control.
- SSIS: Legacy. ADF is its cloud successor. SSIS is faster for on-prem scenarios
  but has no cloud scalability story.
COMPARISON TABLE: ADF vs Informatica vs Fivetran vs Airflow vs SSIS vs Synapse Pipelines
(cost model, learning curve, connector count, cloud-native, code vs visual, scalability)
NOTE: Azure Synapse Pipelines IS ADF embedded in Synapse — same engine, different UI.
### 2.1 — Spark & Databricks
WHY DATABRICKS OVER:
- Azure Synapse Analytics: Synapse is Microsoft's attempt to be "all-in-one"
  (data warehouse + data lake + pipelines + Spark + Power BI). Databricks wins on
  Spark performance (Photon), collaboration, MLflow, and ecosystem maturity.
  Synapse wins on integration with Azure native services and simpler licensing.
  IMPORTANT: Many enterprises run BOTH. Know when to use which.
- Snowflake: Snowflake is SQL-first, managed, no infrastructure to think about.
  Databricks wins on Python/ML workloads, large-scale engineering, Delta Lake.
  Snowflake wins on simplicity, SQL analytics, and BI tool connectivity.
- Google BigQuery: Serverless, no cluster management, extremely fast for SQL.
  Databricks wins on Python flexibility and streaming. BigQuery wins on serverless model.
- Amazon EMR / Glue: AWS equivalents. EMR is raw Spark (more control, more work).
  Glue is managed but limited. Databricks wins on developer experience everywhere.
- Apache Spark on Kubernetes (self-managed): Maximum control, maximum complexity.
  Only for teams with significant infrastructure capability. Databricks wins for
  everyone who doesn't want to manage Spark themselves.
WHY PYTHON/PYSPARK OVER:
- Scala: Spark is written in Scala. Scala PySpark is faster. BUT: Python ecosystem,
  hiring pool, and ML library compatibility make Python the practical choice.
  Most orgs choose PySpark (Python) for 95% of work.
- R: R is for statisticians and data scientists, not data engineers.
  R has Sparklyr but the ecosystem is thin for engineering work.
- Java: Similar to Scala. More verbose, no ML ecosystem advantage for data work.
- SQL-only (Spark SQL): SQL is great but can't handle complex pipeline logic,
  API calls, file manipulation. PySpark + SQL together is the right pattern.
COMPARISON TABLE: Databricks vs Synapse vs Snowflake vs BigQuery vs Redshift
(architecture, cost model, SQL support, Python support, ML native, streaming, market share)
### 2.3 — Delta Lake & File Formats
WHY DELTA LAKE OVER:
- Apache Iceberg: Iceberg is vendor-neutral (Netflix, Apple backing).
  Strong argument for Iceberg if avoiding Databricks lock-in.
  Delta wins in Databricks environments. Iceberg is winning in multi-cloud orgs.
  Microsoft Fabric now supports both — the war is ongoing.
- Apache Hudi: Created by Uber, strong for CDC (change data capture) use cases.
  Less adoption than Delta or Iceberg outside Uber-ecosystem orgs.
- Plain Parquet: No ACID, no time travel, no schema enforcement. Parquet is a
  file format, not a table format. Delta is built on Parquet but adds the table layer.
- ORC: Hive-native format. Fast for Hive queries, less relevant in Spark/Databricks.
WHY PARQUET OVER:
- CSV: No schema, no compression, slow to read. CSV is for human readability only.
- JSON: Schema-less, verbose, slow for analytics. Good for APIs, not storage.
- Avro: Row-based, great for streaming and schema evolution. Not ideal for analytics.
- ORC: Column-based like Parquet, optimized for Hive. Parquet wins in Spark ecosystem.
COMPARISON TABLES:
1. File formats: Parquet vs ORC vs Avro vs JSON vs CSV vs Delta
   (row vs column, compression ratio, schema support, read speed, write speed, use case)
2. Table formats: Delta Lake vs Apache Iceberg vs Apache Hudi
   (ACID, time travel, CDC, ecosystem backing, Azure support, future trajectory)
### 2.4 — dbt
WHY DBT OVER:
- Stored procedures: No version control, no testing, no documentation, no DAG.
  dbt wins on maintainability for any team larger than one person.
- Custom Python/Spark: More flexibility but no standardization. dbt provides
  conventions that make pipelines readable by others.
- SSIS/ADF Data Flows: Visual tools are harder to version control and test.
  dbt wins for SQL-first transformation teams.
- Dataform (Google): Similar concept, Google-native. dbt wins on ecosystem size.
COMPARISON TABLE: dbt vs stored procedures vs ADF Data Flows vs Spark notebooks vs Dataform
(version control, testing, documentation, cost, learning curve, ecosystem)
### 2.5 — YAML
WHY YAML OVER:
- JSON: JSON is more widely used in APIs but harder to read/write by hand.
  YAML wins for config files meant to be edited by humans.
- XML: Verbose, legacy. XML is for systems that haven't migrated yet.
- TOML: Simpler than YAML but less common in the data engineering ecosystem.
- INI files: Very simple but limited (no nested structures).
COMPARISON TABLE: YAML vs JSON vs XML vs TOML vs INI
(readability, comments support, data types, verbosity, tooling support, common use)
### 2.6 — Advanced SQL
WHY SQL OVER:
- "Everything in Python": SQL executes at the database/compute engine level.
  For set-based operations on large data, SQL is faster than any Python loop.
  The right answer is SQL for data transformation, Python for orchestration logic.
COMPARISON TABLE: T-SQL (SQL Server) vs Spark SQL vs BigQuery SQL vs Snowflake SQL
(syntax differences that matter: date functions, string functions, window functions,
semi-structured data handling — what to check when moving between environments)
### 2.7 — Python for Data Engineering
WHY PYTHON OVER:
- R: R is statistics-first. Python is engineering-first. Python wins for
  data engineering (pipelines, APIs, orchestration, ML in production).
- Scala: Scala is Spark-native and faster. Python wins on hiring, ecosystem, ML.
- Java: More enterprise history but verbose. Python wins on iteration speed.
- PowerShell: Windows-specific, limited data ecosystem. Python is cross-platform.
COMPARISON TABLE: Python vs R vs Scala vs Julia for data work
(ecosystem size, ML support, Spark native, hiring pool, learning curve, speed)
KEY LIBRARY COMPARISON:
- pandas vs PySpark vs Polars (the 2024 challenger — 10-100x faster than pandas for medium data)
- pandas: <1M rows comfortable, single machine, richest API
- PySpark: distributed, millions to billions of rows, cluster required
- Polars: single machine but much faster than pandas, Rust-backed, growing fast
COMPARISON TABLE: pandas vs PySpark vs Polars
(rows where each shines, memory model, API style, speed benchmark, maturity, use case)
### 3.3 — Power BI
WHY POWER BI OVER:
- Tableau: Tableau has better visualization flexibility and stronger desktop client.
  Power BI wins on cost (included in M365 E3+), Microsoft integration, and
  AL/AI features in Fabric. Tableau was the market leader — Power BI caught it ~2021.
- Looker (Google): Code-first BI with LookML. Powerful for technical teams.
  Power BI wins on business user adoption. Looker wins on centralized metric governance.
- Qlik: Associative query model is genuinely different (and useful). Strong in
  manufacturing/industrial sectors. Power BI wins on ecosystem and cost.
- Apache Superset: Open source, free, very capable. Wins on cost.
  Power BI wins on business user friendliness, mobile, and Microsoft support.
- Grafana: Built for infrastructure/observability metrics, not business analytics.
  Wrong tool for business BI, right tool for pipeline monitoring dashboards.
COMPARISON TABLE: Power BI vs Tableau vs Looker vs Qlik vs Superset
(cost, learning curve, technical depth, business user friendliness, market share,
Microsoft/Azure native integration, mobile support, embedded analytics)
---
 
## NEW SECTION: 4.2 — GIT & GITHUB FOR DATA TEAMS
*(Explicitly requested by user. Full section treatment.)*
 
### Why This Section Exists
Every tool in the modern data stack — Databricks notebooks, dbt models, ADF ARM
templates, Python scripts, YAML configs — needs version control. Git is the
universal version control system. GitHub is where it lives. This section covers
both because data practitioners who come from non-software backgrounds often
know the concepts but not the commands, or the commands but not the strategy.
 
### Learning Outcomes
a. Explain what version control is and why it matters for data work
b. Execute the core Git workflow: clone, branch, commit, push, pull, merge
c. Distinguish between fetch, pull, merge, rebase, and cherry-pick
d. Create and manage Pull Requests on GitHub
e. Apply branching strategies to data engineering projects
f. Use Git with Databricks, dbt, and ADF pipelines
 
### Content Outline
 
**WHY VERSION CONTROL EXISTS**
- The "final_v2_FINAL_use_this_one.sql" problem — everyone has been there
- Three things version control gives you: history, collaboration, rollback
- The difference between saving a file and committing a version
**GIT FUNDAMENTALS**
- Repository (repo) — the project's entire history in one place
- Local vs Remote — your machine vs GitHub
- Working directory vs Staging area vs Repository (the three stages)
- Commit — a snapshot with a message and an author
- Branch — a parallel line of work that doesn't affect main until merged
- HEAD — where you currently are in the history
**CORE COMMANDS (with real data engineering examples)**
- git init / git clone — start from scratch vs copy from GitHub
- git status — what's changed since last commit
- git add / git add . — stage changes (the "intent to commit" step)
- git commit -m "message" — snapshot with description
- git push — send local commits to GitHub
- git pull — get remote changes (fetch + merge in one step)
- git fetch — download changes WITHOUT merging (check first, merge second)
- git branch — list branches
- git checkout -b feature/new-pipeline — create and switch to new branch
- git switch — modern alternative to checkout for branch switching
- git merge — combine branch into current branch
- git rebase — move branch to new base (rewrite history — use carefully)
- git log --oneline — compact history view
- git diff — see exactly what changed
- git stash / git stash pop — temporarily shelve work in progress
- git reset — undo commits (soft vs mixed vs hard — critical distinction)
- git revert — undo a commit safely (creates new commit, doesn't rewrite history)
- git cherry-pick — apply a specific commit from another branch
- git tag — mark a specific point in history (releases, deployments)
- git blame — see who wrote each line (useful for data pipelines with unknown authors)
**FETCH vs PULL vs MERGE — The Most Confused Trio**
- fetch: "show me what changed remotely but don't touch my files"
- pull: "get remote changes and merge them into my current branch"
- merge: "combine this branch into that branch"
- When to use each: fetch when you want to review first, pull when you trust the remote
**MERGE vs REBASE — When to Use Each**
- Merge: preserves history, creates a merge commit, safe for shared branches
- Rebase: rewrites history, cleaner log, NEVER rebase shared branches (golden rule)
- For data teams: merge for main/develop branches, rebase only for personal feature branches
**MERGE CONFLICTS**
- What they are: two people changed the same lines differently
- How to read a conflict marker (<<< HEAD, ===, >>> branch-name)
- How to resolve: choose one, choose the other, or write something new
- Tools: VS Code has excellent visual conflict resolution
- Prevention: small commits, short-lived branches, pull before you push
**PULL REQUESTS (PRs)**
- What a PR is: a formal request to merge your branch into main
- Why PRs matter for data: code review catches SQL logic errors and schema issues
- What to include in a PR description for data work
- Review checklist for data PRs: logic, tests, documentation, naming conventions
- Squash and merge vs merge commit vs rebase and merge — the three PR merge strategies
**BRANCHING STRATEGIES FOR DATA TEAMS**
- GitFlow: main + develop + feature + release + hotfix branches. Complex, full lifecycle.
- GitHub Flow: main + feature branches only. Simple, fast, good for most data teams.
- Trunk-based development: everyone commits to main (with feature flags). Fastest iteration.
- Recommendation for data teams: GitHub Flow — branches per feature/fix, PR to main
**.GITIGNORE FOR DATA PROJECTS**
- Never commit: credentials, .env files, large data files, __pycache__
- Always commit: SQL, Python, YAML configs, dbt models, ADF pipeline JSON
- Common data engineering .gitignore entries:
  .env, *.csv, *.parquet, *.xlsx, __pycache__, .databricks, target/ (dbt artifacts)
**GIT IN THE DATA ENGINEERING ECOSYSTEM**
- Databricks + Git: workspace Git integration, repos, bundle CI/CD (DABs)
- dbt + Git: every model is a .sql file, every test is YAML — Git-native by design
- ADF + Git: connect ADF to GitHub repo, pipelines stored as JSON ARM templates
  (IMPORTANT: ADF Git integration changes how you publish — understand collaboration mode)
- GitHub Actions: automate dbt runs, data quality checks on PR, Databricks deployment
- Azure DevOps: Microsoft's GitHub alternative, tighter Azure integration, common in enterprise
**COMPARISON TABLE: Git Hosting Platforms**
- GitHub vs GitLab vs Bitbucket vs Azure DevOps Repos
  (market share, CI/CD native, pricing, Azure integration, data tool ecosystem support)
**GLOSSARY OF GIT TERMS**
All terms defined: repo, clone, fork, commit, branch, merge, rebase, cherry-pick,
stash, tag, HEAD, origin, upstream, remote, staging area, working tree, conflict,
.gitignore, pull request, merge request, squash, diff, blame, bisect
 
---
 
## SECTION-BY-SECTION PLANNING NOTES
 
### 1.3 — Medallion Architecture
COMPARISON TABLES:
1. Medallion vs Lambda vs Kappa vs Traditional EDW
2. 2-layer (Bronze/Gold) vs 3-layer (Bronze/Silver/Gold) — when to simplify
PROACTIVE TOPICS:
- What "idempotent" means and why Bronze MUST be idempotent
- Schema-on-read vs schema-on-write
- Late-arriving data patterns
- Full refresh vs incremental at each tier
- Partition strategy at each tier (preview of 6.1)
- Delta Lake as preferred format (preview of 2.3)
- SCD Type 2 at Silver layer (preview of 3.2)
INTERVIEW: "Why not write directly to Gold?" is a very common question
### 1.4 — Azure Data Lake Storage
(See Blob Storage and competitor details in External Comparisons section above)
ADDITIONAL PROACTIVE TOPICS:
- Hierarchical namespace — the key architectural difference from pure Blob
- Security deep dive: RBAC vs ACLs vs Managed Identities vs SAS tokens
  When to use each (practical decision guide)
- Lifecycle management policies — auto-tier data from Hot to Archive on schedule
- Storage redundancy options: LRS, ZRS, GRS, GZRS (cost vs durability matrix)
- Performance tiers: Standard (HDD) vs Premium (SSD) — when Premium is justified
- Soft delete and versioning — accidental deletion recovery
- Databricks mounting vs ABFS driver (abfss://) vs Unity Catalog credential
  (mounting is deprecated in new architectures — note this clearly)
- Azure Storage Explorer as a practical tool
### 1.5 — Azure Data Factory
(See competitor comparisons above)
STREAMING IMPORTANT NOTE:
ADF is a BATCH orchestration tool. Many practitioners try to use it for real-time.
Introduce streaming concept here: Event Hubs / Kafka → Databricks Structured
Streaming → Delta Lake. This is the Azure streaming architecture. ADF is not in it.
ADDITIONAL PROACTIVE TOPICS:
- Integration Runtimes: Azure IR (cloud-to-cloud), Self-Hosted IR (on-prem connections),
  SSIS IR (lift-and-shift for SSIS packages). Self-Hosted IR is commonly needed for
  ERP connections in manufacturing environments.
- Linked Services vs Datasets vs Activities vs Pipelines vs Triggers — the object model
- Incremental load patterns: watermark table, CDC, last modified timestamp
- Parameterized pipelines — building generic reusable patterns vs one-off pipelines
- Copy Activity vs Mapping Data Flow: Copy is fast/simple, Data Flow is visual ETL
  (most work should go to Databricks, not ADF Data Flows)
- Cost model: pipeline runs + activity runs + DIU hours + IR runtime.
  ADF costs surprise people — document them clearly.
- ADF monitoring: Azure Monitor integration, alert rules, retry policies
### 2.1 — Spark & Databricks
(See full competitor comparisons above)
ADDITIONAL PROACTIVE TOPICS:
- Apache Spark architecture: Driver, Executors, Cluster Manager
- DAG execution model — why Spark is lazy (transformations don't run until actions)
- Shuffle — the most expensive operation, why it happens, how to minimize
- Broadcast joins — small table optimization that every PySpark engineer needs
- Caching (.cache() vs .persist()) — when and why
- Photon engine — what it is (C++ vectorized engine), what it accelerates,
  when it matters (SQL/Delta workloads primarily)
- Unity Catalog — governance layer, catalog.schema.table naming,
  row/column level security, data lineage, storage credentials
- Auto Loader — streaming ingestion from cloud storage (common pattern)
- Databricks Asset Bundles (DABs) — modern CI/CD deployment of notebooks+jobs
- Cluster policies — cost governance for teams
- Spot instance strategy — significant cost savings with retry configuration
### 2.2 — PySpark
(See Python/PySpark competitor comparisons above)
NOTE ON POLARS: Polars is worth a full dedicated comparison. It's gaining rapidly
and many data engineers are switching from pandas to Polars for medium-scale work.
Databricks has native Polars support. This is NOT to be ignored.
 
### 2.3 — Delta Lake & File Formats
(See file format and table format comparisons above)
ADDITIONAL PROACTIVE TOPICS:
- ACID transactions in data lake context — Atomicity, Consistency, Isolation, Durability
  explained with a real pipeline failure scenario
- Time travel: RESTORE TABLE, VERSION AS OF, TIMESTAMP AS OF
- Change Data Feed (CDF) — reading only what changed since last run
- OPTIMIZE (compaction) — solving the small files problem
- VACUUM — removing old versions (caution: sets time travel limit)
- Z-ordering — multidimensional clustering for faster queries
- Liquid Clustering (new in Databricks Runtime 13.3) — replacing Z-ordering
- Delta Sharing — cross-org sharing without copying data
- Lakehouse = data lake (storage flexibility) + data warehouse (ACID, governance)
### 2.4 — dbt
(See competitor comparisons above)
ADDITIONAL PROACTIVE TOPICS:
- dbt project structure: models/, seeds/, tests/, macros/, snapshots/
- Sources vs models — where data comes from vs what dbt builds
- ref() function — how dbt builds the DAG automatically
- schema.yml — where tests and documentation live
- Generic tests: unique, not_null, accepted_values, relationships
- Singular tests: custom SQL assertions
- dbt docs generate / dbt docs serve — live documentation
- Jinja templating minimum: if/else, for loops, variables, macros
- Materializations: view vs table vs incremental vs ephemeral
  Incremental models are where most complexity lives — cover thoroughly
- SCD Type 2 via dbt snapshots
- dbt-databricks adapter configuration
- dbt in CI/CD: dbt build on PR, defer to production (slim CI)
### 2.5 — YAML
PRACTICAL FOCUS: YAML as it appears in the data engineering stack
- dbt project.yml and schema.yml (most common encounter for data engineers)
- ADF pipeline JSON (technically JSON but same concepts)
- GitHub Actions workflow files (.yml)
- Databricks config files (bundle.yml for DABs)
- Azure DevOps pipeline YAML
GOTCHAS TO DOCUMENT:
- yes/no/true/false/on/off are all booleans in YAML (version: "1.0" vs version: 1.0)
- Tabs are illegal — only spaces for indentation
- Multiline strings: | (literal) vs > (folded)
- Anchors (&) and aliases (*) for DRY YAML
### 2.6 — Advanced SQL
MUST COVER:
- Window functions with full examples: ROW_NUMBER, RANK, DENSE_RANK, NTILE,
  LAG, LEAD, SUM OVER, AVG OVER, FIRST_VALUE, LAST_VALUE
- CTEs (cross-reference to 6.2, more depth here)
- Performance: EXPLAIN plans, statistics, index strategy
- Partitions in SQL (query partition elimination vs storage partitions — different concepts)
- Common anti-patterns: SELECT *, implicit conversions, functions on indexed columns
- Merge/upsert patterns (SQL MERGE statement, Delta MERGE)
- Recursive CTEs with real example (hierarchy traversal)
- PIVOT and UNPIVOT
- CROSS APPLY / LATERAL JOIN
- Temporal tables (SQL Server specific — relevant for ERP-heavy environments)
COMPARISON TABLE: T-SQL vs Spark SQL vs BigQuery SQL — differences that matter
### 3.1 — Dimensional Modeling
COMPARISON TABLE: Star Schema vs Snowflake Schema vs One Big Table (OBT)
The OBT debate is important: dbt's modern approach often favors OBT for simplicity.
Traditional Kimball favors star schema. Both are right in different contexts.
ADDITIONAL:
- Kimball vs Inmon: two schools of data warehousing. Not religious debate — understand both.
- Slowly Changing Dimensions preview here (full in 3.2)
- Conformed dimensions — the glue that lets you join facts across subjects
- Bridge tables for many-to-many (e.g., customer-to-account in banking/finance)
- Degenerate dimensions (order number on a fact table)
- Junk dimensions (grouping low-cardinality flags)
- Role-playing dimensions (one dim table used multiple times in same fact)
- Date dimension — must cover: it's required, what columns to include, time zone handling
### 3.2 — SCDs Types 0–7
CORE IS THE COMPARISON TABLE:
Type 0: Fixed (ignore changes)
Type 1: Overwrite (no history preserved)
Type 2: New row (full history — most important, most common)
Type 3: Previous value column (one change tracked)
Type 4: Mini-dimension (separate table for rapid-change attributes)
Type 6: Hybrid 1+2+3 (current value + history + previous value all available)
Type 7: Dual key (fact table FK to current and historical dimension views)
(Types 5 and 0 are rarely implemented — note this clearly)
IMPLEMENTATION SECTION:
- SCD Type 2 in Delta Lake with MERGE statement (full code example)
- SCD Type 2 in dbt with snapshots (full example)
- SCD Type 1 in Delta Lake (just MERGE with WHEN MATCHED THEN UPDATE)
### 3.3 — Power BI
(See full competitor comparisons above)
MOST IMPORTANT TECHNICAL DECISION — DirectQuery vs Import vs Composite:
- Import: data copied into Power BI's in-memory model. Fast queries, data refreshes on schedule.
  Limitation: dataset size limit (1GB for Pro, 25GB for Premium), not real-time.
- DirectQuery: every visual queries the source directly. Real-time, no size limit.
  Limitation: slow (every interaction hits the database), DAX limitations.
- Composite: some tables imported, some DirectQuery. Best of both with added complexity.
- Live Connection: connects to SSAS/Azure AS/Power BI datasets. Read-only.
- Recommendation algorithm: start with Import, move to Composite only when forced.
ADDITIONAL:
- Row-level security (RLS): static vs dynamic (username() function)
- Deployment pipelines: Dev/Test/Prod promotion
- Dataflows: Power Query in the cloud, reusable across datasets
- Goals/Metrics and scorecards
- Power BI Embedded for developers
- Microsoft Fabric: where Power BI is going (converging with Azure data services)
  Fabric is important to understand — it's the future of this entire stack.
- Gateway: on-premises data gateway for connecting to local sources
### 3.4 — DAX
COMPARISON TABLE: DAX vs M (Power Query) — many practitioners confuse these
- M: runs in Power Query at refresh time, shapes and loads data
- DAX: runs at query time in the semantic model, calculates measures
- Rule of thumb: use M to clean and shape, use DAX to calculate
KEY CONCEPTS:
- Context transition (the hardest concept in DAX — explained with clear analogy)
- CALCULATE: changes the filter context — most important function
- ALL / ALLEXCEPT / ALLSELECTED: removing filters
- FILTER: row-by-row iteration (slow) vs filter arguments in CALCULATE (fast)
- Time intelligence: SAMEPERIODLASTYEAR, DATEADD, TOTALYTD, TOTALQTD
- Variables: VAR ... RETURN pattern (performance + readability)
- Iterator functions: SUMX, AVERAGEX, MAXX — when and why
### 4.1 — MVP-Driven Delivery
NOTE: Frame specifically for data context. Software MVP ≠ Data MVP.
Data MVP = the minimum data and logic needed to answer one specific business question.
- How to identify what "minimum" means: work backwards from the decision
- Delivery anti-patterns in data: over-engineering the Bronze layer,
  building a perfect data model before anyone has asked a question,
  cleaning ALL the data before delivering ANY value
- Stakeholder expectations: "MVP" sounds like "not finished" to business users.
  Reframe it: "the working version we'll learn from"
### 4.2 — Git & GitHub (NEW — see full section above)
 
### 4.3 — DataOps & CI/CD
(Git section 4.2 is a prerequisite — reference it clearly)
COMPARISON TABLE: Azure DevOps vs GitHub Actions vs Jenkins vs GitLab CI
(native Azure integration, data tool support, cost, configuration complexity)
DATA QUALITY TOOLS COMPARISON:
- Great Expectations vs dbt tests vs Soda vs Monte Carlo vs Datafold
  (cost, complexity, where in pipeline, anomaly detection, enterprise support)
DATA OBSERVABILITY:
- Observability = knowing your pipeline is healthy without manually checking
- Key metrics to monitor: row counts, null rates, freshness, schema drift
- Alert fatigue — why thresholds matter more than alerts
CI/CD FOR DATA SPECIFICALLY:
- dbt CI: run changed models + tests on PR (slim CI pattern)
- ADF CI/CD: ARM template export, Azure DevOps pipeline deployment
- Databricks CI/CD: DABs (Databricks Asset Bundles), pytest for notebooks
- The "publish" button in ADF is a trap — explain why and how Git mode changes this
### 4.4 — Agile for Data Teams
WHY STANDARD SCRUM DOESN'T WORK FOR DATA:
- Sprint velocity is impossible to measure for exploratory work
- "Definition of done" is unclear when data quality is a spectrum
- Stakeholders don't understand why the same dataset takes different amounts of time
DATA-ADAPTED APPROACHES:
- Kanban for data engineering (flow-based, continuous)
- Shape Up (Basecamp methodology) — good fit for data projects
- JIRA vs Azure Boards vs Linear vs Notion for data team tracking
### 4.5 — Stakeholder Communication
THE "SO WHAT" FRAMEWORK:
Every data deliverable needs: what it shows, what it means, what to do about it
THE TRANSLATOR ROLE:
- From business: "our reports are wrong" → actually: which reports, how wrong, since when
- From technical: "the pipeline has schema drift" → actually: the cost center column is missing
THE DATA NARRATIVE:
- Data storytelling is not about making pretty charts
- It's about making the right decision feel obvious to the person who needs to make it
- Pyramid principle for data presentations
### 4.6 — Change Management
DASHBOARD GRAVEYARD PHENOMENON:
Why built data products don't get used, and how to prevent it at design time.
Key insight: adoption is not a post-launch problem, it's a design-time problem.
ENABLEMENT vs TRAINING:
- Training: here's how to use this dashboard
- Enablement: here's what question to answer with this dashboard and why it matters
CHAMPIONS NETWORK:
- One business user per domain who cares about data quality
- They are your quality assurance AND your adoption engine
### 5.1 — How LLMs Work
COMPARISON TABLE: LLM providers
- GPT-4o (OpenAI): market leader, widest API ecosystem
- Claude (Anthropic): strong reasoning, large context window, safety focus
- Gemini (Google): native Google Cloud integration, multimodal
- Mistral (EU-based): strong open-source models, data residency options
- Llama (Meta, open source): free, self-hostable, privacy-first enterprise option
- Azure OpenAI: GPT-4 with Azure compliance, RBAC, private endpoints
  (this is what most enterprise data teams actually use)
KEY CONCEPTS:
- Tokens, context window, embeddings — the three things to understand
- Temperature (randomness) and why you want it near 0 for data tasks
- System prompt vs user prompt vs assistant turn
- Prompt engineering: clear instructions, examples, step-by-step
- Hallucination: why it happens (predicting plausible tokens, not facts)
- RAG as the mitigation (preview of 5.4)
- Fine-tuning: when it's worth it (almost never for enterprise data questions)
- Azure OpenAI vs OpenAI API: same models, Azure adds compliance and private network
### 5.2 — MCP
COMPARISON TABLE: MCP vs function calling vs plugins vs tool use
(these are all variations of "giving an LLM access to tools" — explain the lineage)
 
### 5.3 — Agents
COMPARISON TABLE: LangChain vs LlamaIndex vs AutoGen vs CrewAI vs custom implementation
(maturity, complexity, community, Azure integration, observability)
 
### 5.4 — RAG
COMPARISON TABLE:
1. RAG vs fine-tuning vs few-shot prompting — when each wins
2. Vector databases: Chroma vs Pinecone vs Weaviate vs Qdrant vs Azure AI Search
   (cost, managed vs self-hosted, performance, Azure native, hybrid search support)
### 5.5 — Agentic Data Pipelines
PROACTIVE TOPICS:
- LLM-generated SQL: GitHub Copilot in Azure Data Studio, AI in Fabric
- Anomaly detection at scale: statistical vs ML-based vs LLM-based approaches
- Feature stores (Databricks Feature Store, Feast): what they are and why
- The AI engineer vs data engineer distinction and convergence
- Current limits: why fully autonomous data pipelines are not production-ready yet
### 6.1 — Partitions
IMPORTANT DISTINCTION:
- Storage partitioning (physical file organization by folder)
- SQL table partitioning (database feature for query performance)
- Spark compute partitioning (how data is split across executors)
These are THREE DIFFERENT THINGS often called by the same name.
COMPARISON TABLE: Partition by date vs by region vs by entity type (pros/cons matrix)
PROACTIVE: Liquid Clustering as the modern alternative in Databricks
### 6.2 — CTEs
COMPARISON TABLE: CTEs vs Subqueries vs Temp Tables vs Views vs Table Variables
(readability, performance, reusability, when optimizer materializes each)
INCLUDE: Recursive CTE full example with organizational hierarchy
 
### 6.3 — Data Terminology
FULL TERM LIST (user explicitly requested):
- Fill and Kill (financial data — order execution term, appears in trading systems)
- Archive vs Soft Delete vs Hard Delete vs Tombstone
- Idempotency — pipeline can run multiple times with same result (critical concept)
- Backfill — processing historical data retroactively
- Watermark — tracking progress in incremental/streaming processing
- Snapshot — point-in-time copy of data state
- Incremental load — only processing new/changed records
- Change Data Capture (CDC) — detecting row-level changes at source
- Schema drift — source schema changing unexpectedly (breaking pipelines)
- Data skew — uneven data distribution causing hot partitions
- Broadcast join — optimization for joining large table to small table in Spark
- Shuffle — data redistribution across Spark executors (expensive operation)
- Pushdown predicate — filter applied at storage layer, not compute layer
- Cardinality — uniqueness of values in a column
- Normalized vs Denormalized
- Materialized view — pre-computed query result stored as physical table
- Late-arriving data — events that arrive after their expected processing window
- Dead letter queue — where failed records go for investigation
- Data lineage — tracking data from source to consumption
- Data catalog — searchable inventory of data assets
- Data contract — formal agreement between producer and consumer of a dataset
- Data observability — monitoring pipeline health without manual checking
- SLA vs SLO vs SLI in data pipeline context
- Grain — the level of detail represented by one row in a fact table
- Surrogate key vs Natural key vs Business key
- Upsert / Merge — insert if new, update if exists
- ETL vs ELT (covered in 1.1 — cross-reference)
- Batch vs Streaming (covered in 1.5 — cross-reference)
- Full load vs Incremental load
- Hot path vs Cold path (Lambda architecture terms)
- Lakehouse (covered in 2.3 — cross-reference)
- Semantic layer — business-friendly layer on top of physical data model
- Row-level security (RLS) — restricting data access by user identity
- Column-level security — masking or restricting specific columns
- Data masking vs Data encryption
- PII (Personally Identifiable Information) — regulatory importance

## NEW SECTIONS — COMPARISON TABLE TRACKER
*Comparison tables originally stubbed in Session 5; all now built as of Session 7.*

### 6.6 - LLM Fine-Tuning vs. Prompting ✓ BUILT (Session 7)
COMPARISON TABLE: Fine-tuning vs. Prompt Engineering vs. RAG vs. Few-Shot
  (cost, data requirements, maintenance burden, when each actually wins)

### 6.7 - NLP Task Types in Practice ✓ BUILT (Session 7)
COMPARISON TABLE: Classification vs. Summarization vs. Conversational AI
  (model requirements, evaluation approach, common failure modes per task type)

### 7.1 - User Stories & Roadmaps ✓ BUILT (live in repo)
COMPARISON TABLE: User Stories vs. Use Cases vs. Job Stories vs. PRDs
  (when each format communicates better to which audience)

### 7.2 - Jira, Confluence & Figma in Practice ✓ BUILT (live in repo)
COMPARISON TABLE: Jira vs. Azure Boards vs. Linear vs. Notion
  (cross-reference 5.3's MVP-Driven Delivery comparison - avoid duplicating,
  link back instead)

### 7.3 - UX Principles for Data Products ✓ BUILT (live in repo)
COMPARISON TABLE: Design Thinking vs. Lean UX vs. Jobs-to-be-Done
  (different frameworks for the same underlying goal - when each fits)

### 7.4 - The Software Development Lifecycle ✓ BUILT (live in repo)
COMPARISON TABLE: Waterfall vs. Agile vs. DevOps-integrated SDLC
  (cross-reference 5.1 Agile - this section is the broader container)

### 8.1 - Regression & Classification ✓ BUILT (Session 6)
COMPARISON TABLE: Linear Regression vs. Logistic Regression vs. Decision Trees
  vs. Random Forest (interpretability, performance, when each is the right call)

### 8.2 - Clustering & Unsupervised Learning ✓ BUILT (Session 6)
COMPARISON TABLE: K-Means vs. Hierarchical Clustering vs. DBSCAN
  (assumptions, scalability, when clusters are actually meaningful)

### 8.3 - Model Evaluation Metrics ✓ BUILT (Session 6)
COMPARISON TABLE: Precision/Recall vs. F1 vs. AUC-ROC vs. RMSE
  (which metric for which problem type - classification vs. regression)

### 8.4 - A/B Testing & Hypothesis Testing ✓ BUILT (Session 6)
COMPARISON TABLE: Frequentist vs. Bayesian A/B Testing approaches
  (sample size requirements, interpretation, common stakeholder misunderstandings)

### 8.5 - Deep Learning Basics ✓ BUILT (Session 6)
COMPARISON TABLE: Classical ML vs. Deep Learning
  (when the added complexity of deep learning is actually justified)

### 9.1 - Demand Forecasting Basics ✓ BUILT (Session 7)
COMPARISON TABLE: Moving Average vs. Exponential Smoothing vs. ARIMA vs. ML-based forecasting
  (data requirements, interpretability, accuracy tradeoffs)

### 9.2 - Inventory Optimization ✓ BUILT (Session 7)
COMPARISON TABLE: EOQ (Economic Order Quantity) vs. Just-in-Time vs. Safety Stock approaches
  (when each model fits which supply chain risk profile)

---
 
## APPENDIX D — INTERVIEW PREPARATION GUIDE (NEW)
*This is a career-focused addition that serves the primary purpose of the guide.*
 
### What Senior Data Engineering Interviews Actually Test
- Architecture: "How would you design a pipeline for X?" (open-ended, no right answer)
- Debugging: "This pipeline failed at 3am. Walk me through your investigation."
- Tradeoffs: "When would you use Databricks vs Synapse?" (the real answer has nuance)
- Communication: "Explain this design to a business stakeholder."
- Technical depth: SQL problems, Python problems, explain how Spark shuffle works
### Common Questions by Section
(Populate as sections are written — each section should end with 3-5 interview questions.
 NOW THE TOP PRIORITY: Parts 6 extension (6.6-6.7), 7, 8, and 9 all still need their
 interview questions added to Appendix D — none of this has been done yet.)
 
### The "Tell Me About Yourself" for Data Engineering
How to frame a data engineering career narrative.
 
---
 
## GLOSSARY TERMS COLLECTED SO FAR
 
From 1.1: SQL Server, SSIS, ETL/ELT, Object Storage, ERP, CRM, ADF, ADLS,
          Databricks, Power BI, Medallion Architecture
From 1.2: Data Mesh, Data Product, Federated Governance, Domain Ownership,
          Zhamak Dehghani, Microservices, Domain-Aware Data Engineering
Pending 4.2: All Git terms (see section outline above)
Pending 6.3: All data terminology terms (see full list above)
From 6.6 (Session 7, in guide.js GLOSSARY): Prompt Engineering, Few-Shot Learning,
          Fine-Tuning, LoRA, Catastrophic Forgetting
From 6.7 (Session 7): Named Entity Recognition, Sentiment Analysis, Summarization,
          Conversational AI
Pending 7.x: User story, PRD, JTBD, SDLC terms — built and live in the repo's
          7.1-7.4 HTML files, but not yet confirmed present in guide.js's
          GLOSSARY object specifically (wasn't available to check this session)
From 8.1 (Session 6, in guide.js GLOSSARY): Supervised Learning, Regression,
          Classification, Linear Regression, Logistic Regression, Decision Tree,
          Random Forest, Bagging, Gradient Descent, Overfitting
From 8.2 (Session 6): Unsupervised Learning, K-Means, Centroid,
          Hierarchical Clustering, Dendrogram, DBSCAN
From 8.3 (Session 6): Confusion Matrix, Precision, Recall,
          Classification Threshold, F1 Score, AUC-ROC, RMSE, MAE
From 8.4 (Session 6): A/B Testing, Null Hypothesis, P-Value,
          Statistical Significance, Statistical Power, Type I Error, Type II Error
From 8.5 (Session 6): Deep Learning, Neural Network, Activation Function,
          Backpropagation, CNN, Transfer Learning
From 9.1 (Session 7, in guide.js GLOSSARY): Bullwhip Effect, Moving Average,
          Exponential Smoothing, ARIMA, MAPE
From 9.2 (Session 7): EOQ, Safety Stock, Just-in-Time
 
---
 
## BUILD SEQUENCE RECOMMENDATION

ORIGINAL SCOPE (Parts 1–6 + Appendix A–D): COMPLETE. Live and stable.

SESSION 6: Part 8 (Classical ML & Statistics), all 5 sections (8.1–8.5): COMPLETE.

SESSION 7: Part 7 confirmed live in the actual repo (resolving the open question
from v5). Built 6.6–6.7 (Applied LLM/NLP) and Part 9 (Supply Chain Analytics,
9.1–9.2) in full. Updated guide.js (TOC reorder + 17 new glossary terms),
index.html (mobile + desktop TOC, unlocked Part 7), and re-wired live nav
6.5→6.6→6.7→7.1 and 8.5→9.1→9.2→Appendix A. Applied 8.5's own footer/nav fix
directly (file was available). All Session 5 gap-analysis scope is now built.

REMAINING WORK:
1. Manual local edits to 8.1–8.4 (footer page numbers) and 8.1's Prev button,
   plus 7.1's and Appendix A's Prev buttons — see MANUAL-EDITS-NEEDED.md.
   None of this blocks new content from working; it's nav/numbering polish.
2. Appendix D interview questions for the 6.6-6.7 extension, Part 7, Part 8,
   and Part 9 — NOW THE TOP PRIORITY, since all primary content is built.
3. Optional full page-renumbering pass (Appendix + Part 7 + Part 8) if strict
   Part-order page numbers matter more than the current build-order sequence
   — needs 7.1–7.3, 8.1–8.4, and A/B/C uploaded in a future session.
4. Re-run `npx pagefind --site . --output-path _pagefind` after applying this
   session's files locally, so the new sections are searchable.

Each new section follows: comparison table, WHY-before-WHAT structure,
real-world analogy + gotcha, margin notes, and glossary terms — all now
logged above for 6.6, 6.7, 9.1, and 9.2.

At each session start: load this planning doc + summarize what was last built.

---
*End of planning notes v6*