/* ============================================================
   DATA ENGINEERING & AI PRACTITIONER'S GUIDE
   Shared JavaScript — guide.js
   Sidebar render, glossary, tooltips, responsive behavior
============================================================ */

/* ============================================================
   TABLE OF CONTENTS
   Add new sections here — sidebar auto-updates everywhere
============================================================ */
const TOC = [
  { id: 'part1', label: 'Part 1 · Data Platform Foundation', sections: [
    { id: '1.1', label: 'The Modern Data Stack',   file: '01-data-platform-foundation/1-1-modern-data-stack.html' },
    { id: '1.2', label: 'Medallion Architecture',  file: '01-data-platform-foundation/1-2-medallion-architecture.html' },
    { id: '1.3', label: 'Azure Data Lake Storage', file: '01-data-platform-foundation/1-3-adls.html' },
    { id: '1.4', label: 'Azure Data Factory',      file: '01-data-platform-foundation/1-4-adf.html' },
    { id: '1.5', label: 'Data Mesh',               file: '01-data-platform-foundation/1-5-data-mesh.html' },
  ]},
  { id: 'part2', label: 'Part 2 · Data Fundamentals', sections: [
    { id: '2.1', label: 'CTEs',               file: '02-data-fundamentals/2-1-ctes.html' },
    { id: '2.2', label: 'Partitions',         file: '02-data-fundamentals/2-2-partitions.html' },
    { id: '2.3', label: 'Data Terminology',   file: '02-data-fundamentals/2-3-data-terminology.html' },
    { id: '2.4', label: 'Glossary',           file: '02-data-fundamentals/2-4-glossary.html' },
  ]},
  { id: 'part3', label: 'Part 3 · Compute & Transform', sections: [
    { id: '3.1', label: 'YAML & Config Languages',   file: '03-compute-and-transformation/3-1-yaml.html' },
    { id: '3.2', label: 'Advanced SQL',              file: '03-compute-and-transformation/3-2-advanced-sql.html' },
    { id: '3.3', label: 'Python for Data',           file: '03-compute-and-transformation/3-3-python.html' },
    { id: '3.4', label: 'Spark & Databricks',        file: '03-compute-and-transformation/3-4-spark-databricks.html' },
    { id: '3.5', label: 'PySpark',                   file: '03-compute-and-transformation/3-5-pyspark.html' },
    { id: '3.6', label: 'Delta Lake & File Formats', file: '03-compute-and-transformation/3-6-delta-lake.html' },
    { id: '3.7', label: 'dbt',                       file: '03-compute-and-transformation/3-7-dbt.html' },
  ]},
  { id: 'part4', label: 'Part 4 · Analytics & Visualization', sections: [
    { id: '4.1', label: 'Dimensional Modeling', file: '04-analytics-and-visualisation/4-1-dimensional-modeling.html' },
    { id: '4.2', label: 'SCDs Types 0–7',       file: '04-analytics-and-visualisation/4-2-slowly-changing-dimensions.html' },
    { id: '4.3', label: 'Power BI',             file: '04-analytics-and-visualisation/4-3-power-bi.html' },
    { id: '4.4', label: 'DAX',                  file: '04-analytics-and-visualisation/4-4-dax.html' },
  ]},
  { id: 'part5', label: 'Part 5 · Delivery & Leadership', sections: [
    { id: '5.1', label: 'Agile for Data Teams',      file: '05-delivery-and-leadership/5-1-agile.html' },
    { id: '5.2', label: 'Git & GitHub',              file: '05-delivery-and-leadership/5-2-git-github.html' },
    { id: '5.3', label: 'MVP-Driven Delivery',       file: '05-delivery-and-leadership/5-3-mvp-delivery.html' },
    { id: '5.4', label: 'DataOps & CI/CD',           file: '05-delivery-and-leadership/5-4-dataops-cicd.html' },
    { id: '5.5', label: 'Stakeholder Communication', file: '05-delivery-and-leadership/5-5-stakeholder-communication.html' },
    { id: '5.6', label: 'Change Management',         file: '05-delivery-and-leadership/5-6-change-management.html' },
  ]},
  { id: 'part6', label: 'Part 6 · AI & Agentic Systems', sections: [
    { id: '6.1', label: 'How LLMs Work',          file: '06-ai-and-agentic-systems/6-1-how-llms-work.html' },
    { id: '6.2', label: 'MCP',                    file: '06-ai-and-agentic-systems/6-2-mcp.html' },
    { id: '6.3', label: 'RAG',                    file: '06-ai-and-agentic-systems/6-3-rag.html' },
    { id: '6.4', label: 'AI Agents & Sub-Agents', file: '06-ai-and-agentic-systems/6-4-ai-agents.html' },
    { id: '6.5', label: 'Agentic Data Pipelines', file: '06-ai-and-agentic-systems/6-5-agentic-data-pipelines.html' },
    { id: '6.6', label: 'LLM Fine-Tuning vs. Prompting', file: '06-ai-and-agentic-systems/6-6-llm-fine-tuning-vs-prompting.html' },
    { id: '6.7', label: 'NLP Task Types in Practice', file: '06-ai-and-agentic-systems/6-7-nlp-task-types-practice.html' },
  ]},
  { id: 'part7', label: 'Part 7 · Product Management Fundamentals', sections: [
    { id: '7.1', label: 'User Stories & Roadmaps',       file: '07-product-management-fundamentals/7-1-user-stories-roadmaps.html' },
    { id: '7.2', label: 'Jira, Confluence & Figma',      file: '07-product-management-fundamentals/7-2-jira-confluence-figma.html' },
    { id: '7.3', label: 'UX Principles for Data Products', file: '07-product-management-fundamentals/7-3-ux-principles-data-products.html' },
    { id: '7.4', label: 'The Software Development Lifecycle', file: '07-product-management-fundamentals/7-4-software-development-lifecycle.html' },
  ]},
  { id: 'part8', label: 'Part 8 · Classical ML & Statistics', sections: [
    { id: '8.1', label: 'Regression & Classification',        file: '08-classical-ml-and-statistics/8-1-regression-classification.html' },
    { id: '8.2', label: 'Clustering & Unsupervised Learning', file: '08-classical-ml-and-statistics/8-2-clustering-unsupervised-learning.html' },
    { id: '8.3', label: 'Model Evaluation Metrics',           file: '08-classical-ml-and-statistics/8-3-model-evaluation-metrics.html' },
    { id: '8.4', label: 'A/B Testing & Hypothesis Testing',   file: '08-classical-ml-and-statistics/8-4-ab-testing-hypothesis-testing.html' },
    { id: '8.5', label: 'Deep Learning Basics',               file: '08-classical-ml-and-statistics/8-5-deep-learning-basics.html' },
  ]},
  { id: 'part9', label: 'Part 9 · Supply Chain Analytics', sections: [
    { id: '9.1', label: 'Demand Forecasting Basics', file: '09-supply-chain-analytics/9-1-demand-forecasting-basics.html' },
    { id: '9.2', label: 'Inventory Optimization',     file: '09-supply-chain-analytics/9-2-inventory-optimization.html' },
  ]},
  { id: 'partA', label: 'Appendix', sections: [
    { id: 'A', label: 'Free Tier Resources',   file: 'appendix/A-free-tier-resources.html' },
    { id: 'B', label: 'Quick Reference Cards', file: 'appendix/B-quick-reference-cards.html' },
    { id: 'C', label: 'Security Fundamentals', file: 'appendix/C-security-fundamentals.html' },
    { id: 'D', label: 'Interview Prep Guide',  file: 'appendix/D-interview-prep.html' },
  ]},
];

/* ============================================================
   GLOSSARY DATA
   Add terms as new sections are written
============================================================ */
const GLOSSARY = {

  'SQL Server': {
    short: "Microsoft's relational database — enterprise data storage backbone for decades.",
    full: "Microsoft SQL Server is a relational database management system (RDBMS) storing data in structured tables and using T-SQL (Transact-SQL) as its query language. For decades it was the center of enterprise data operations in Windows-based organizations. Many organizations are mid-migration from it today."
  },

  'SSIS': {
    short: "SQL Server Integration Services — Microsoft's legacy ETL pipeline tool.",
    full: "SQL Server Integration Services is Microsoft's legacy data integration tool. It handles extraction, transformation, and loading using a visual package-based workflow. Still running in many enterprises — often the system being replaced when organizations migrate to Azure Data Factory."
  },

  'ETL': {
    short: "Extract, Transform, Load — the classic pattern for moving data between systems.",
    full: "ETL (Extract, Transform, Load) is the original data movement pattern: extract from source systems, transform to fit the target schema, then load into the destination. Modern stacks often flip this to ELT — load raw data first, transform in place using cloud compute. ELT is generally faster to implement and easier to debug."
  },

  'Object Storage': {
    short: "A flat storage system where files are stored as objects — infinitely scalable and cheap.",
    full: "Object storage stores data as individual objects (file + metadata + unique ID) rather than in a hierarchical file system. It's infinitely scalable and costs a fraction of traditional storage. Azure Blob Storage, Amazon S3, and Google Cloud Storage are examples. ADLS is built on Azure Blob Storage with an added hierarchical namespace."
  },

  'ERP': {
    short: "Enterprise Resource Planning — software managing core business processes.",
    full: "ERP (Enterprise Resource Planning) systems integrate and manage core business processes: finance, manufacturing, supply chain, HR, procurement. SAP S/4HANA, Oracle ERP, and Microsoft Dynamics are common examples. ERPs are often the primary source of transactional data in manufacturing and logistics environments."
  },

  'CRM': {
    short: "Customer Relationship Management — software for managing customers and sales.",
    full: "CRM (Customer Relationship Management) systems track customer relationships, sales pipelines, support tickets, and marketing. Salesforce is the dominant enterprise CRM. CRMs are common Layer 1 data sources — you extract from them, not transform inside them."
  },

  'ADF': {
    short: "Azure Data Factory — Microsoft's cloud-based data ingestion orchestrator.",
    full: "Azure Data Factory (ADF) is Microsoft's cloud ETL and data integration service. It orchestrates data movement between hundreds of supported sources and destinations using 'pipelines' — sequences of activities (Copy, Lookup, ForEach, etc.) that can be scheduled, event-triggered, or run manually."
  },

  'ADLS': {
    short: "Azure Data Lake Storage — Microsoft's cloud storage for big data analytics.",
    full: "Azure Data Lake Storage (ADLS) is Microsoft's scalable cloud storage service built on Azure Blob Storage with an added hierarchical namespace. Designed for big data analytics workloads — storing everything from raw ingested files (Bronze) to refined analytical datasets (Gold). Integrates natively with Databricks, ADF, and Power BI."
  },

  'Databricks': {
    short: "A cloud analytics platform built on Apache Spark — the primary compute/transform layer.",
    full: "Databricks is a cloud-based data engineering and analytics platform built on Apache Spark. It provides notebooks, jobs, clusters, and workflows for data engineers, scientists, and analysts. Databricks introduced the Medallion Architecture (Bronze/Silver/Gold) and Delta Lake. It is the primary compute layer in modern Azure data stacks."
  },

  'Power BI': {
    short: "Microsoft's business intelligence tool — turns data into dashboards and reports.",
    full: "Power BI is Microsoft's business intelligence platform. It connects to data sources including Azure services, enables data modeling using DAX (Data Analysis Expressions), and renders interactive dashboards and reports. Integrates tightly with the Microsoft 365 ecosystem."
  },

  'Medallion Architecture': {
    short: "A three-tier data pattern: Bronze (raw), Silver (cleaned), Gold (business-ready).",
    full: "The Medallion Architecture is a data design pattern popularized by Databricks that organizes data into three progressively refined layers: Bronze holds raw as-ingested data; Silver holds cleaned and validated data; Gold holds business-ready aggregates. All three tiers physically live in ADLS."
  },

  'Zhamak Dehghani': {
    short: "Software architect who coined the term Data Mesh in a 2019 paper.",
    full: "Zhamak Dehghani introduced the Data Mesh concept in a 2019 paper at martinfowler.com, drawing on her observation that the same centralized data platform bottleneck appeared across every large organization she worked with."
  },

  'Microservices': {
    short: "Software architecture pattern: small, independently deployable services each owned by a team.",
    full: "Microservices is an architectural pattern where a large application is decomposed into small, independently deployable services each owned by a specific team. Dehghani used this as an analogy for how data ownership could be decentralized."
  },

  'Domain-Aware Data Engineering': {
    short: "A hybrid between centralized platforms and full Data Mesh — more domain input, less full decentralization.",
    full: "Domain-aware data engineering is an informal term for the common middle ground: domain teams have meaningful input into their pipelines and may own certain data products, but a central platform team still provides infrastructure, governance, and cross-domain coordination."
  },

  'Idempotent': {
    short: "A process that produces the same result no matter how many times it runs.",
    full: "In data engineering, idempotency means a pipeline can be re-run multiple times and always produce the same output. Critical for Bronze ingestion — if an ADF pipeline fails at 3am and reruns at 4am, the Bronze layer must not end up with duplicate records."
  },

  'Schema-on-Read': {
    short: "Data is stored raw, and the schema is applied when you read it — not when you write it.",
    full: "Schema-on-read stores data in its original format (files, JSON, CSV, Parquet) and applies a structure only when querying. Used in data lakes — flexible and tolerant of source changes. Medallion Bronze uses schema-on-read; Gold typically uses schema-on-write."
  },

  'Schema-on-Write': {
    short: "Data must match a predefined structure before it can be stored.",
    full: "Schema-on-write requires data to conform to a defined schema at the time of writing. Used in traditional databases and data warehouses — faster query performance but brittle when sources change."
  },

  'Hierarchical Namespace': {
    short: "A feature of ADLS Gen2 that makes directory operations atomic and efficient.",
    full: "ADLS Gen2 adds a hierarchical namespace (HNS) on top of Azure Blob Storage, enabling true directory operations. Without HNS, renaming a folder of 1 million files requires 1 million individual API calls. With HNS, the same operation is a single atomic rename."
  },

  'RBAC': {
    short: "Role-Based Access Control — grants permissions based on predefined roles.",
    full: "Role-Based Access Control (RBAC) in Azure assigns permissions through roles (e.g., Storage Blob Data Reader, Storage Blob Data Contributor). Applied at the resource level — subscription, resource group, or storage account."
  },

  'Managed Identity': {
    short: "An Azure feature that gives a service its own identity without needing stored credentials.",
    full: "Managed Identity gives an Azure service (like Databricks or ADF) an automatically managed identity in Azure Active Directory. Instead of storing connection strings or passwords, you grant the managed identity access to resources directly."
  },

  'SAS Token': {
    short: "Shared Access Signature — a time-limited, permission-scoped URL for Azure storage access.",
    full: "A Shared Access Signature (SAS) token is a URI that grants time-limited, permission-scoped access to Azure Storage resources without exposing account keys. Used for temporary or delegated access."
  },

  'Linked Service': {
    short: "In ADF, a connection definition — credentials and configuration for a data source or destination.",
    full: "A Linked Service in Azure Data Factory is the equivalent of a connection string — it defines how to connect to a specific data source or destination. Every Dataset in ADF references a Linked Service."
  },

  'Integration Runtime': {
    short: "The compute infrastructure ADF uses to execute data movement — three types for different scenarios.",
    full: "An Integration Runtime (IR) in ADF is the engine that physically performs data movement. Azure IR handles cloud-to-cloud transfers. Self-Hosted IR enables ADF to reach systems inside your network. SSIS IR runs legacy SSIS packages in the cloud."
  },

  'Watermark': {
    short: "A pointer that tracks how far an incremental pipeline has processed.",
    full: "In incremental data loading, a watermark is a stored value (usually a timestamp or sequence number) that marks the last successfully processed record. Each pipeline run reads the current watermark, queries for newer records, processes them, and updates the watermark."
  },

  'CDC': {
    short: "Change Data Capture — detecting and capturing row-level changes at the source database.",
    full: "Change Data Capture (CDC) reads the transaction log of a source database to capture every insert, update, and delete as it happens — without querying the source table. More precise than watermark-based incremental loads because it captures deletes."
  },

  'DIU': {
    short: "Data Integration Unit — the measure of compute power ADF uses for data movement.",
    full: "A Data Integration Unit (DIU) is ADF's unit of compute for data movement activities. More DIUs means faster data transfer but higher cost. DIU hours are one of the main components of ADF's cost model."
  },

  'Liquid Clustering': {
    short: "A Databricks Delta Lake feature that clusters data on multiple columns without a fixed partition folder hierarchy.",
    full: "Liquid Clustering (Databricks 13.3+) replaces traditional storage partitioning. It uses Z-ordering and file-level statistics to enable efficient file skipping on one or more clustering columns. Unlike partitioning, clustering columns can be changed at any time without rewriting data."
  },

  'Backfill': {
    short: "Processing historical data retroactively — running a pipeline over past periods it missed or that need correction.",
    full: "A backfill re-runs a pipeline over a historical time range. Common reasons: the pipeline was down during a period, a bug in the logic was fixed, or a new dataset requires history loaded before go-live. Backfills must be idempotent."
  },

  'Schema Drift': {
    short: "A source system changing its schema without notice, breaking downstream pipelines.",
    full: "Schema drift occurs when a source system adds, removes, renames, or changes the type of a column without informing the data team. In Bronze-Silver-Gold architectures, Bronze absorbs schema changes gracefully (schema-on-read). Silver logic may break if it references a renamed or removed column."
  },

  'Late-Arriving Data': {
    short: "Events that appear in the pipeline after the processing window for their time period has already closed.",
    full: "Late-arriving data is a record whose event timestamp belongs to a past processing window that has already been closed. Handling strategies include keeping processing windows open longer, using Delta Lake MERGE, or accepting the late record in the next window."
  },

  'Dead Letter Queue': {
    short: "A holding area for records that failed processing — so they can be investigated without blocking the main pipeline.",
    full: "A dead letter queue (DLQ) captures records that a pipeline could not process. Instead of failing the entire pipeline or silently dropping bad records, the DLQ stores them for investigation, root cause analysis, and replay."
  },

  'Snapshot': {
    short: "A complete point-in-time copy of data state, preserved for later comparison or audit.",
    full: "A snapshot captures the full state of a dataset at a specific moment. Used for regulatory audit trails, historical comparisons, and SCD Type 2 implementations. Delta Lake's time travel feature provides snapshot access to any past version of a table."
  },

  'Upsert': {
    short: "Insert if the record does not exist; update if it does. Also called MERGE.",
    full: "An upsert (update + insert) applies a MERGE operation: if a record with the same key already exists in the target, update it; if not, insert it. In Delta Lake and SQL Server, this is implemented with MERGE INTO ... WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT."
  },

  'Grain': {
    short: "The level of detail that one row in a fact table represents — the most important design decision in dimensional modeling.",
    full: "The grain of a fact table defines what a single row means. The grain must be declared and agreed upon before any facts or dimensions are added to the table. Mixing grains in one table causes incorrect aggregations."
  },

  'Surrogate Key': {
    short: "A system-generated unique identifier with no business meaning — the primary key in a dimensional model.",
    full: "A surrogate key is an integer or UUID generated by the data platform to uniquely identify a row. Surrogate keys have no business meaning — they are pure technical identifiers that support SCD Type 2 by allowing multiple versions of the same entity to coexist."
  },

  'Natural Key': {
    short: "An identifier that comes from the source system and has real-world meaning (e.g. customer email, product SKU).",
    full: "A natural key is the identifier the source system uses to identify an entity. Natural keys can be problematic: they may change, may be non-unique across systems, and may be long strings that make join performance worse than integer surrogate keys."
  },

  'Data Contract': {
    short: "A formal, versioned agreement between a data producer and its consumers defining schema, quality, and SLAs.",
    full: "A data contract is a machine-readable specification that defines what a data producer promises to deliver: the schema, quality guarantees, versioning policy, and ownership. Contracts are typically stored in Git alongside pipeline code and validated automatically on each pipeline run."
  },

  'Data Lineage': {
    short: "The documented trail of where data came from, how it was transformed, and where it went.",
    full: "Data lineage tracks the journey of data from its origin through every transformation to its final consumption point. Column-level lineage tracks individual fields. Lineage is essential for impact analysis and regulatory compliance."
  },

  'Data Observability': {
    short: "Continuously monitoring pipeline health — freshness, volume, schema, and distribution — without manual checking.",
    full: "Data observability applies the principles of software observability to data pipelines. It monitors five pillars automatically: freshness, volume, schema, distribution, and lineage. Tools like Monte Carlo, Soda, and Databricks Lakehouse Monitoring implement observability."
  },

  'SLA': {
    short: "Service Level Agreement — a commitment to end users about data availability and quality.",
    full: "In a data context, an SLA is a formal commitment to data consumers: the dashboard will be refreshed by 8am, the pipeline will complete within 4 hours of source data availability. Breaking an SLA has business consequences."
  },

  'Data Catalog': {
    short: "A searchable inventory of data assets — tables, columns, owners, definitions, and lineage.",
    full: "A data catalog is the system of record for what data exists in an organisation. It documents every table, view, and data product: what it contains, who owns it, how fresh it is, and who can access it. Tools include Microsoft Purview and Databricks Unity Catalog."
  },

  'PII': {
    short: "Personally Identifiable Information — any data that can identify an individual person.",
    full: "PII includes names, email addresses, phone numbers, national ID numbers, and any combination of attributes that can uniquely identify a person. Regulatory frameworks like GDPR and CCPA impose obligations on how PII is collected, stored, processed, and deleted."
  },

  'Semantic Layer': {
    short: "A business-friendly abstraction layer that translates physical data models into business terminology.",
    full: "A semantic layer sits between physical data tables and business users, translating technical column names into business concepts. Tools like dbt Semantic Layer, Microsoft Analysis Services, and Looker's LookML implement semantic layers."
  },

  'Pushdown Predicate': {
    short: "A query filter applied at the storage layer before data is read into memory, reducing data transfer.",
    full: "A pushdown predicate moves WHERE clause filters as close to the data source as possible. Instead of reading 1TB of data into Spark and then filtering, the storage engine applies the filter first. Partition pruning is the most extreme form — skipping entire files."
  },

  'Cardinality': {
    short: "The number of distinct values in a column — a key factor in join performance and index effectiveness.",
    full: "Cardinality measures uniqueness. A column with high cardinality has many distinct values (customer_id). A column with low cardinality has few distinct values (boolean flags). Cardinality matters for choosing partition columns and understanding join performance."
  },

  'Lakehouse': {
    short: "An architecture combining the flexibility of a data lake with the reliability and query performance of a data warehouse.",
    full: "A Lakehouse stores data in open file formats on cheap object storage while adding data warehouse features: ACID transactions, schema enforcement, query optimisation, and BI tool connectivity. Databricks coined the term; Delta Lake's transaction log brings database-grade reliability to object storage."
  },

  /* ── PART 6 GLOSSARY TERMS ─────────────────────────────── */

  'LLM': {
    short: "Large Language Model — a neural network trained on vast text that generates human-like language.",
    full: "A Large Language Model (LLM) is a neural network with billions of parameters trained on massive text corpora. It predicts the next most probable token given the preceding context — which, at sufficient scale, produces coherent reasoning, code generation, and document summarization. GPT-4, Claude, and Gemini are examples. LLMs do not retrieve facts; they reproduce patterns from training data, which is why hallucination is an inherent property rather than a fixable bug."
  },

  'Token': {
    short: "The basic unit an LLM reads and writes — roughly 3/4 of a word on average.",
    full: "A token is the atomic unit of text that LLMs process. Tokenizers split text into tokens before feeding it to the model. One token is roughly 3/4 of an English word — 'engineering' is one token, but 'unstructured' may be two. Token count drives cost (most APIs charge per token) and context window limits. Code and non-English languages often tokenize less efficiently than English prose."
  },

  'Context Window': {
    short: "The maximum number of tokens an LLM can process in a single request — its 'working memory'.",
    full: "The context window defines how much text an LLM can consider at once — both the input (system prompt + user message + retrieved context) and the output. GPT-4o supports 128K tokens; Claude 3 supports up to 200K; Gemini 1.5 Pro supports 1M. Larger context windows enable longer documents and richer RAG retrieval but increase cost and latency. The LLM has no memory of conversations outside the current context window."
  },

  'Hallucination': {
    short: "When an LLM generates plausible-sounding but factually incorrect information.",
    full: "Hallucination occurs when an LLM generates text that is confidently stated but factually wrong — fabricating citations, statistics, names, or technical details. It is an inherent property of the token-prediction mechanism: the model produces the most statistically probable continuation, not a verified fact. Hallucination is reduced by: setting temperature near 0, providing source documents via RAG, asking the model to cite its sources, and validating outputs programmatically."
  },

  'Temperature': {
    short: "A parameter controlling how random or deterministic an LLM's output is. Low = precise; high = creative.",
    full: "Temperature scales the probability distribution over possible next tokens before sampling. At temperature 0, the model always picks the highest-probability token (fully deterministic). At temperature 1.0, it samples proportionally from the full distribution (more varied). At temperature >1.5, it becomes incoherent. For data engineering tasks — SQL generation, data extraction, classification — set temperature to 0 or 0.1. For creative tasks, 0.7–1.0 is appropriate."
  },

  'RAG': {
    short: "Retrieval-Augmented Generation — grounding LLM responses by retrieving relevant documents before generating.",
    full: "Retrieval-Augmented Generation (RAG) is a technique that augments an LLM prompt with retrieved context documents before asking the model to generate a response. It solves the two main LLM limitations for enterprise use: the model has no access to private organizational data, and its training has a knowledge cutoff. RAG retrieves relevant chunks from a vector database at query time and injects them into the prompt, giving the model up-to-date, proprietary context without retraining."
  },

  'Embedding': {
    short: "A dense numerical vector representation of text that encodes semantic meaning.",
    full: "An embedding is a dense vector of floating-point numbers (typically 1,536 or 3,072 dimensions for OpenAI models) that encodes the semantic meaning of a piece of text. Texts with similar meanings have similar embeddings — their vectors are 'close' in high-dimensional space as measured by cosine similarity. Embeddings are generated by separate embedding models (text-embedding-3-large, Azure OpenAI embedding endpoints). They are the mathematical foundation of semantic search and RAG retrieval."
  },

  'Vector Database': {
    short: "A database optimised for storing and querying high-dimensional embedding vectors by semantic similarity.",
    full: "A vector database stores embeddings and supports Approximate Nearest Neighbor (ANN) search — finding the K vectors most similar to a query vector efficiently, even across millions of stored vectors. Unlike SQL databases that filter by exact matches, vector databases filter by semantic similarity. Examples: Pinecone (managed), Qdrant (open-source/managed), Weaviate (hybrid search), Chroma (local/dev), Azure AI Search (enterprise Azure-native)."
  },

  'Chunking': {
    short: "Splitting documents into smaller pieces before embedding for RAG — critical for retrieval quality.",
    full: "Chunking is the process of splitting source documents into smaller segments before generating embeddings. Chunk size is a key RAG design decision: chunks too large carry too much irrelevant context per retrieval; chunks too small may lack sufficient context for the LLM to answer. Common strategies: fixed-size (512 tokens), sliding window (overlapping chunks for continuity), semantic (split on paragraph/section boundaries), and recursive (intelligent boundary detection)."
  },

  'Agent': {
    short: "An LLM that can take autonomous actions via tools, iterate based on results, and pursue a goal.",
    full: "In AI systems, an agent is an LLM combined with a set of tools and a loop that allows it to take actions, observe results, and continue reasoning until a goal is achieved. Unlike a single LLM call that generates one response, an agent can use tools (run SQL, call APIs, read files, search the web), observe the output, and decide what to do next — repeating this loop until the task is complete or it determines it cannot proceed."
  },

  'Function Calling': {
    short: "A structured way for LLMs to signal they want to call a tool, returning structured JSON instead of prose.",
    full: "Function calling (also called tool use) is an API feature that allows an LLM to return a structured JSON object specifying which function to call and with what arguments, instead of generating prose. The calling application executes the function and returns the result back to the model. This enables reliable integration with external tools because the output is machine-parseable rather than requiring the model to embed calls in natural language that must be parsed."
  },

  'MCP': {
    short: "Model Context Protocol — an open standard for connecting LLMs to external tools and data sources.",
    full: "Model Context Protocol (MCP), released by Anthropic in late 2024, is an open standard that defines how LLM applications connect to external tools, data sources, and services. It standardizes the communication pattern between a host application (the LLM orchestrator) and MCP servers (tool providers) using a JSON-RPC protocol over stdio or HTTP/SSE. MCP replaces bespoke per-tool integrations with a single, universal connection interface."
  },

  'Fine-tuning': {
    short: "Training a pre-trained model on additional domain-specific data to improve performance on a specific task.",
    full: "Fine-tuning takes a pre-trained LLM and continues training it on a smaller, task-specific dataset. It updates the model's weights to improve performance on that specific task or domain. For enterprise data engineering, fine-tuning is rarely the right answer: it requires labeled training data, compute, and ongoing maintenance. RAG almost always achieves better factual grounding without the cost. Fine-tuning is appropriate for tasks where a specific style, format, or capability must be deeply embedded — not for knowledge retrieval."
  },

  'Feature Store': {
    short: "A centralized repository of reusable ML features, computed once and served to both training and serving pipelines.",
    full: "A feature store is a system that manages the lifecycle of ML features: computing them from raw data, storing them with versioning and point-in-time correctness, and serving them to both model training and real-time inference. The critical problem it solves is training-serving skew: if training uses features computed one way and inference computes them differently, model performance degrades in production. Feature stores ensure the same features are served in both contexts. Examples: Databricks Feature Store, Feast (open-source)."
  },

  'ReAct': {
    short: "Reasoning + Acting — a prompting pattern where agents alternate between thinking steps and action steps.",
    full: "ReAct (Reasoning + Acting) is an agent prompting pattern that interleaves reasoning traces with action execution. The agent outputs a 'Thought:' explaining its reasoning, then an 'Action:' specifying a tool call, then receives an 'Observation:' from the tool, then reasons again. This loop continues until the agent emits a final answer. ReAct improves agent reliability over pure action-chaining by making the reasoning transparent and catchable."
  },

  /* ── PART 8 GLOSSARY TERMS — 8.1 Regression & Classification ──── */

  'Supervised Learning': {
    short: "Machine learning that learns a mapping from labeled examples — inputs paired with known correct outputs.",
    full: "Supervised learning trains a model on historical examples where the correct answer (the label) is already known, so the model learns a mapping from input features to that label. It splits into two families based on the label's shape: regression (continuous numbers) and classification (categories). Contrast with unsupervised learning, where no label exists and the goal is to find structure rather than predict a known outcome."
  },

  'Regression': {
    short: "A supervised learning task that predicts a continuous numeric value.",
    full: "Regression is the supervised learning task where the target variable is a continuous number — revenue, units demanded, a sale price — rather than a category. Linear regression is the simplest and most interpretable regression algorithm; decision trees and random forests can also be used in regression mode by predicting an average value at each leaf instead of a class."
  },

  'Classification': {
    short: "A supervised learning task that predicts which category something belongs to.",
    full: "Classification is the supervised learning task where the target variable is a category rather than a number — binary (two classes, e.g. churn/no churn) or multiclass (three or more, e.g. which support queue a ticket routes to). Logistic regression, decision trees, and random forests are all commonly used for classification."
  },

  'Linear Regression': {
    short: "A regression algorithm that fits a straight line minimizing the squared error between predictions and actual values.",
    full: "Linear regression predicts a continuous target as a weighted sum of input features: y = b0 + b1x1 + b2x2 + ... The weights are chosen to minimize mean squared error across the training data, typically via gradient descent. Its main strength is interpretability — each weight directly states a feature's effect on the prediction. Its main limitation is the assumption that every feature-target relationship is a straight line."
  },

  'Logistic Regression': {
    short: "A classification algorithm that outputs a probability via the sigmoid function, despite the regression in its name.",
    full: "Logistic regression computes a weighted sum of features, like linear regression, then passes it through the sigmoid function to squash the result into a probability between 0 and 1. A threshold (commonly 0.5) converts that probability into a final class label. Despite the name, it is a classification algorithm — widely used for churn, fraud, and credit risk because its weights remain interpretable as log-odds, which matters in regulated decisions."
  },

  'Decision Tree': {
    short: "A model that predicts via a sequence of yes/no questions, splitting data into progressively purer groups.",
    full: "A decision tree splits training data through a branching sequence of yes/no questions on feature values, choosing each split to maximize the purity (via Gini impurity, entropy, or variance reduction) of the resulting groups, down to leaf nodes holding the final prediction. Highly interpretable — it can be drawn and read directly — but prone to overfitting if grown without constraints like maximum depth or minimum samples per leaf."
  },

  'Random Forest': {
    short: "An ensemble of many decision trees, combined via bagging, that trades single-tree interpretability for higher accuracy.",
    full: "A random forest trains many decision trees (often hundreds), each on a random bootstrap sample of rows and a random subset of features at each split (bagging). Predictions are combined via majority vote (classification) or averaging (regression). Because each tree overfits differently, combining them cancels out much of that noise, typically yielding higher accuracy and lower overfitting risk than a single tree — at the cost of losing a single readable diagram of the model's logic."
  },

  'Bagging': {
    short: "Bootstrap aggregating — training many models on random data subsets and combining their predictions to reduce variance.",
    full: "Bagging (bootstrap aggregating) trains multiple instances of a model independently and in parallel, each on a random bootstrap sample of the training rows (and, in a random forest, a random subset of features per split). Combining their predictions — by voting or averaging — reduces variance because each model's overfitting tends to be uncorrelated with the others'. Contrast with boosting, which trains models sequentially to correct prior models' errors."
  },

  'Gradient Descent': {
    short: "An iterative optimization method that nudges a model's weights downhill on its error surface until error is minimized.",
    full: "Gradient descent trains a model by repeatedly measuring the slope of its cost function (how wrong its current predictions are) with respect to its weights, then adjusting the weights a small step in the direction that reduces error most — like feeling your way downhill in fog. The learning rate controls step size: too large and training oscillates without converging; too small and training is needlessly slow. Used to train linear/logistic regression, gradient-boosted trees, and neural networks alike."
  },

  'Overfitting': {
    short: "When a model learns training data too specifically — including its noise — and performs poorly on new, unseen data.",
    full: "Overfitting occurs when a model fits the training data so closely that it captures noise and idiosyncrasies rather than the generalizable pattern, producing excellent training accuracy but poor performance on a held-out test set. An unconstrained decision tree memorizing every training row is the textbook example. Detected via a train/test split or cross-validation; addressed by simplifying the model, adding more training data, or fixing leaking features. Contrast with underfitting, where the model is too simple to capture the real pattern at all."
  },

  /* ── 8.2 Clustering & Unsupervised Learning ──── */

  'Unsupervised Learning': {
    short: "Machine learning that finds structure in data with no known label to predict.",
    full: "Unsupervised learning has no target variable to learn from — there is no known 'correct answer' column in the training data. Instead, algorithms search for latent structure already present in the data, most commonly by clustering similar rows together. Contrast with supervised learning, which learns a mapping to a known label. Because there's no ground truth to check against, validating that an unsupervised result is meaningful requires human domain judgment, not just a metric."
  },

  'K-Means': {
    short: "A clustering algorithm that partitions data into K groups by iteratively assigning points to the nearest centroid.",
    full: "K-means clustering requires choosing the number of clusters, K, in advance. It then repeats two steps until convergence: assign each point to its nearest centroid (cluster center), then recompute each centroid as the mean of its newly assigned points. Fast and scalable, but assumes roughly round, similarly sized clusters, is sensitive to initialization, and requires standardized features since it relies entirely on distance calculations."
  },

  'Centroid': {
    short: "The center point — the mean position — of a cluster in K-means or similar algorithms.",
    full: "A centroid is the mean position of all points currently assigned to a cluster. K-means alternates between assigning points to their nearest centroid and recomputing each centroid as the average of its assigned points, until the centroids stop moving meaningfully between iterations."
  },

  'Hierarchical Clustering': {
    short: "A clustering method that builds a nested tree of groupings without requiring the number of clusters upfront.",
    full: "Hierarchical (typically agglomerative) clustering starts with every point as its own cluster and repeatedly merges the two closest clusters until everything has merged into one. The result is a dendrogram showing every possible number of clusters at once, with the final cluster count chosen afterward by cutting the tree at a chosen height. Doesn't scale well to large datasets due to its computational cost, but provides a richer, visually inspectable structure than K-means."
  },

  'Dendrogram': {
    short: "The tree diagram produced by hierarchical clustering, showing nested groupings at every level.",
    full: "A dendrogram visualizes the merge history of hierarchical clustering as a tree, with the height of each merge representing how dissimilar the two merged clusters were. Cutting the tree at a given height yields a specific number of clusters — cutting near the top yields few, broad clusters; cutting lower yields many, finer-grained ones."
  },

  'DBSCAN': {
    short: "Density-Based Spatial Clustering of Applications with Noise — groups points by density rather than distance to a center.",
    full: "DBSCAN defines clusters as regions of densely packed points, using two parameters: epsilon (a neighborhood distance) and minPts (the minimum neighbors required to count as a dense 'core' point). Points not reachable from any dense region are labeled noise rather than forced into a cluster. Unlike K-means, DBSCAN requires no upfront cluster count and can detect arbitrarily shaped clusters, making it well-suited to anomaly and fraud detection."
  },

  /* ── 8.3 Model Evaluation Metrics ──── */

  'Confusion Matrix': {
    short: "A table comparing predicted versus actual classes, broken into true/false positives and negatives.",
    full: "A confusion matrix breaks a classifier's predictions into four outcomes: true positive (correctly predicted positive), false positive (incorrectly predicted positive), true negative (correctly predicted negative), and false negative (incorrectly predicted negative — a missed real positive). Every other classification metric in this guide — precision, recall, F1, AUC-ROC — is derived from these four counts."
  },

  'Precision': {
    short: "Of everything a model flagged as positive, the proportion that was actually positive.",
    full: "Precision = TP / (TP + FP). High precision means few false alarms — when the model flags something positive, it's usually right. Precision matters most when a false positive is the costly mistake, such as a spam filter wrongly burying a legitimate email."
  },

  'Recall': {
    short: "Of everything actually positive, the proportion a model correctly caught.",
    full: "Recall = TP / (TP + FN). High recall means few real positives are missed. Recall matters most when a false negative is the costly mistake, such as cancer screening or fraud detection, where missing a real case is far worse than a false alarm."
  },

  'Classification Threshold': {
    short: "The cutoff probability above which a model's prediction counts as the positive class.",
    full: "Most classifiers (e.g. logistic regression) output a probability, not a direct label. The classification threshold — often defaulted to 0.5 — converts that probability into a final positive/negative prediction. Lowering the threshold increases recall and typically decreases precision; raising it does the reverse. Tuning the threshold to match the actual business cost of false positives versus false negatives is often cheaper than retraining a model."
  },

  'F1 Score': {
    short: "The harmonic mean of precision and recall, summarizing both into a single number.",
    full: "F1 = 2 × (Precision × Recall) / (Precision + Recall). Because it's a harmonic mean rather than a simple average, F1 penalizes a large imbalance between precision and recall much more heavily, preventing a model that's lopsided in either direction from scoring artificially well. It assumes precision and recall matter equally, which isn't always true of the real business cost structure."
  },

  'AUC-ROC': {
    short: "Area Under the ROC Curve — summarizes a classifier's performance across every possible threshold in one number.",
    full: "The ROC (Receiver Operating Characteristic) curve plots true positive rate against false positive rate across every classification threshold. AUC condenses that curve into a single score: 1.0 is a perfect classifier, 0.5 is equivalent to random guessing. AUC can look deceptively strong on severely imbalanced data even when real-world precision is poor, since its false positive rate is computed against a very large denominator of negatives — Precision-Recall AUC is often the more honest alternative in that case."
  },

  'RMSE': {
    short: "Root Mean Squared Error — a regression metric that penalizes large errors disproportionately.",
    full: "RMSE squares every prediction error, averages the squares, then takes the square root to return to the target's original units. Because errors are squared before averaging, large individual misses are penalized far more heavily than small ones — useful when large errors carry disproportionate real-world cost. Contrast with MAE, which is more robust to outliers."
  },

  'MAE': {
    short: "Mean Absolute Error — a regression metric using unsquared error, more robust to outliers than RMSE.",
    full: "MAE averages the absolute value of every prediction error with no squaring, making it far less sensitive to a small number of large outlier errors than RMSE. A large gap between RMSE and MAE on the same dataset signals that a handful of large misses, rather than consistent everyday error, are driving overall performance."
  },

  /* ── 8.4 A/B Testing & Hypothesis Testing ──── */

  'A/B Testing': {
    short: "Splitting users randomly between two versions to measure whether a change causes a real difference in outcomes.",
    full: "A/B testing randomly assigns users or visitors to one of two (or more) versions of a product experience, then compares a target metric between groups. Random assignment is what allows any resulting difference to be attributed to the change itself rather than to pre-existing differences between the groups. Requires a pre-determined sample size and a single primary metric to be statistically valid."
  },

  'Null Hypothesis': {
    short: "The default, skeptical assumption in a hypothesis test that there is no real effect or difference.",
    full: "The null hypothesis (H0) assumes there is no real difference between A and B, and that any observed gap is attributable to random sampling variation alone. A hypothesis test is built to ask whether the observed data is surprising enough, under this assumption, to justify rejecting it in favor of the alternative hypothesis (H1), which claims a real difference exists."
  },

  'P-Value': {
    short: "The probability of observing a result at least this extreme if the null hypothesis were actually true.",
    full: "A p-value is the probability of seeing a difference at least as large as the one measured, assuming the null hypothesis (no real effect) is true. A small p-value is evidence against the null hypothesis. Critically, a p-value is NOT the probability that the null (or alternative) hypothesis is true given the data — it is a probability calculated under the assumption that the null is true, a distinction that is the single most common statistical misinterpretation in business reporting."
  },

  'Statistical Significance': {
    short: "A result whose p-value falls below a pre-chosen significance threshold, typically 0.05.",
    full: "A result is called statistically significant when its p-value is below the chosen significance level (alpha), conventionally 0.05, leading to rejection of the null hypothesis. Statistical significance only indicates that an effect is likely real and non-zero — it says nothing about whether the effect is large enough to matter for the business, a distinct judgment called practical or business significance."
  },

  'Statistical Power': {
    short: "The probability that a test correctly detects a real effect when one truly exists.",
    full: "Statistical power (1 minus the Type II error rate) is the probability of correctly rejecting the null hypothesis when it is actually false — that is, correctly detecting a real effect. Power depends on sample size, the size of the true effect, and the chosen significance level. An underpowered test (too small a sample) risks a Type II error: missing a real effect and wrongly concluding 'no difference found.'"
  },

  'Type I Error': {
    short: "A false positive in hypothesis testing — concluding a real effect exists when it doesn't.",
    full: "A Type I error means rejecting a null hypothesis that was actually true — concluding there's a real difference between A and B when there genuinely isn't one. Its rate is controlled directly by the chosen significance level (alpha); setting alpha = 0.05 means accepting up to a 5% chance of this kind of false alarm by design, for a single properly conducted test."
  },

  'Type II Error': {
    short: "A false negative in hypothesis testing — failing to detect a real effect that does exist.",
    full: "A Type II error means failing to reject a null hypothesis that was actually false — missing a real difference between A and B because the test lacked the statistical power to detect it, commonly due to too small a sample size. This is the error most often mistaken for 'the change didn't work,' when the more accurate conclusion is 'we didn't collect enough data to see that it worked.'"
  },

  /* ── 8.5 Deep Learning Basics ──── */

  'Deep Learning': {
    short: "Machine learning using many-layered neural networks that learn their own feature representations from raw data.",
    full: "Deep learning trains neural networks with many stacked layers ('depth') to learn useful internal representations directly from raw, often unstructured input — images, audio, text — rather than requiring a human to hand-engineer tabular features first. This is its core advantage over classical ML. On structured, tabular business data where good features already exist, classical ML (especially gradient-boosted trees and random forests) frequently matches or beats deep learning at a fraction of the training cost and with far better interpretability."
  },

  'Neural Network': {
    short: "A model built from layers of simple computational units (neurons), each computing a weighted sum plus a non-linear activation.",
    full: "A neural network consists of an input layer, one or more hidden layers, and an output layer, each made of neurons that compute a weighted sum of inputs plus a bias, passed through a non-linear activation function. Hidden layers are where the network builds its own learned feature representations. Trained via backpropagation, an extension of gradient descent across every layer."
  },

  'Activation Function': {
    short: "A non-linear function applied to a neuron's weighted sum, without which stacking layers provides no extra modeling power.",
    full: "An activation function (e.g. sigmoid, or more commonly today ReLU) introduces non-linearity into a neural network. Without it, any number of stacked linear layers algebraically collapses into a single equivalent linear transformation — providing no more modeling capacity than plain linear regression, regardless of depth. Non-linear activation functions are what allow each additional layer to genuinely add new representational power."
  },

  'Backpropagation': {
    short: "The algorithm that trains a neural network by propagating prediction error backward through every layer.",
    full: "Backpropagation extends gradient descent to multi-layer networks using the calculus chain rule: after a forward pass produces a prediction, the backward pass calculates, layer by layer working from the output back to the input, how much each individual weight contributed to the final error. Every weight is then nudged slightly to reduce that error. This is what makes training networks with millions of weights computationally feasible."
  },

  'CNN': {
    short: "Convolutional Neural Network — the standard deep learning architecture for image data.",
    full: "A Convolutional Neural Network (CNN) slides small learned filters across an image rather than connecting every pixel to every neuron, allowing it to detect local visual patterns (edges, textures) that combine in deeper layers into increasingly complex visual concepts. The standard architecture for image classification, object detection, and visual defect inspection tasks."
  },

  'Transfer Learning': {
    short: "Adapting a model already trained on a large general dataset to a new, more specific task using comparatively little new data.",
    full: "Transfer learning fine-tunes a pre-trained model — already trained on a large, general dataset — for a new, related task using a much smaller, task-specific dataset, rather than training an entirely new network from scratch. It works because early layers of a network trained on diverse data learn broadly reusable representations. This is why most production deep learning systems, and most LLM applications, start from a pre-trained foundation model rather than training from a blank slate."
  },

  /* ── 6.6 LLM Fine-Tuning vs. Prompting ──── */

  'Prompt Engineering': {
    short: "Structuring instructions to a model to reliably get the desired behavior, with no changes to the model itself.",
    full: "Prompt engineering structures a model's instructions — task description, constraints, output format, relevant context — to reliably elicit the desired behavior, entirely without modifying the model. It is the cheapest, fastest-iterating point on the customization spectrum: changes take effect immediately, with no training step and no risk to the model's other capabilities."
  },

  'Few-Shot Learning': {
    short: "Including a small number of worked examples directly in a prompt, rather than relying purely on written instructions.",
    full: "Few-shot prompting extends zero-shot prompting by including a handful of worked input/output examples in the prompt itself. It routinely closes much of the accuracy gap to a fine-tuned model, at none of fine-tuning's cost, data requirements, or maintenance burden — making it the natural second step before reaching for anything heavier on the customization spectrum."
  },

  'Fine-Tuning': {
    short: "Continuing to train an already-trained model on a smaller, task-specific dataset, permanently changing its weights.",
    full: "Fine-tuning is the only major LLM customization approach that actually modifies a model's internal weights, baking new behavior in permanently rather than supplying it fresh at each call as prompting and RAG do. It is well suited to teaching a stable skill or style, but carries a maintenance burden (any change requires retraining) and a risk (catastrophic forgetting) that prompting and RAG structurally cannot have."
  },

  'LoRA': {
    short: "Low-Rank Adaptation — a fine-tuning technique that trains a small adapter on top of frozen original weights instead of updating every weight.",
    full: "LoRA (Low-Rank Adaptation) freezes a model's original pre-trained weights and trains a much smaller pair of low-rank adapter matrices added on top during inference, exploiting the fact that the needed adaptation is usually well-approximated by a much simpler, lower-rank update than the full weight matrix. This cuts trainable parameters by orders of magnitude versus full fine-tuning, which is what made fine-tuning practical outside large AI labs."
  },

  'Catastrophic Forgetting': {
    short: "The tendency for a model to lose general capability while being fine-tuned on a narrow new task.",
    full: "Catastrophic forgetting occurs when the same weight updates that teach a model a new narrow task degrade its performance on unrelated tasks it previously handled well. It is a risk specific to fine-tuning — since prompting, few-shot prompting, and RAG never change a model's weights, none of them can cause this failure mode."
  },

  /* ── 6.7 NLP Task Types in Practice ──── */

  'Named Entity Recognition': {
    short: "An NLP task that identifies and labels specific spans of text — names, dates, amounts — rather than classifying a whole document.",
    full: "Named Entity Recognition (NER) tags specific spans within a text as belonging to a predefined entity type (PERSON, ORGANIZATION, DATE, MONEY, etc.), rather than assigning one label to the entire document the way classification does. It's the technique behind automatically extracting structured fields — invoice numbers, vendor names, due dates — from otherwise unstructured text."
  },

  'Sentiment Analysis': {
    short: "A specialized form of text classification that assigns an emotional polarity — positive, negative, neutral — to text.",
    full: "Sentiment analysis is text classification applied specifically to opinion or emotion, commonly used on customer reviews, support transcripts, and social media content. Like other classification tasks, it has a fixed, enumerable output space, which is what makes precision/recall-style evaluation (section 8.3) a natural fit."
  },

  'Summarization': {
    short: "Producing a shorter text that captures the key content of a longer source document.",
    full: "Summarization splits into two distinct techniques: extractive summarization selects and stitches together actual sentences from the source (cannot add unsupported content, but can read disjointedly), and abstractive summarization generates new paraphrased sentences (more fluent, but able to introduce content not actually present in the source — a hallucination risk extractive summarization structurally cannot have)."
  },

  'Conversational AI': {
    short: "Chatbots and virtual assistants that combine intent recognition with open-ended response generation.",
    full: "Conversational AI combines intent recognition (a classification sub-task: what is the user trying to do?) with open-ended, generative response production. Because the response is generated rather than selected from a fixed set, it carries the highest hallucination risk of the NLP task types covered in this guide — mitigated, though never eliminated, by grounding responses in retrieved source documents via RAG."
  },

  /* ── 9.1 Demand Forecasting Basics ──── */

  'Bullwhip Effect': {
    short: "The amplification of small demand fluctuations into much larger order swings as they propagate up a supply chain.",
    full: "The bullwhip effect describes how a modest, genuine change in end-customer demand gets progressively amplified at each successive link of a supply chain — retailer to distributor to manufacturer to supplier — as each link adds its own safety buffer on top of an already-distorted signal from the link before it. It is fundamentally an information-distortion problem, best mitigated by giving every link visibility into actual end-customer demand rather than just the orders received from the next link downstream."
  },

  'Moving Average': {
    short: "A baseline forecast that averages the most recent N periods of actual demand.",
    full: "The moving average forecast averages the last N periods of actual demand to predict the next period, smoothing out short-term noise compared to a naive (last-value) forecast. Its main weakness is lag: because it weights all N periods equally and drops older periods to zero weight beyond the window, it responds slowly to genuine recent shifts in demand — the gap exponential smoothing is designed to close."
  },

  'Exponential Smoothing': {
    short: "A forecasting method that weights recent observations more heavily, with weight decaying exponentially further back in time.",
    full: "Exponential smoothing forecasts the next period as a weighted average of the most recent actual value and the previous forecast, governed by a smoothing parameter (alpha) that controls how quickly the forecast reacts to new information. Unlike a moving average, it weights every past observation (with exponentially decaying weight) rather than cutting off sharply after N periods. Holt-Winters variants extend it to explicitly model trend and seasonality."
  },

  'ARIMA': {
    short: "AutoRegressive Integrated Moving Average — a statistical forecasting method requiring the input series to be stationary.",
    full: "ARIMA (AutoRegressive Integrated Moving Average) models a time series using its own past values (autoregressive), differencing to achieve stationarity (integrated), and past forecast errors (moving average). It can capture more complex patterns than exponential smoothing but requires the input series to be stationary — achieved via differencing if the raw series has a trend — and more historical data to fit reliably."
  },

  'MAPE': {
    short: "Mean Absolute Percentage Error — a forecast accuracy metric that becomes unstable when actual demand is near zero.",
    full: "MAPE (Mean Absolute Percentage Error) expresses average forecast error as a percentage of the actual value, which is intuitive for business stakeholders. Its key pitfall: because it divides by the actual value, MAPE becomes mathematically unstable — producing enormous or undefined percentage errors — when actual demand is zero or very close to zero, exactly the situation intermittent or low-volume demand creates routinely. An absolute-error metric like MAE is usually more honest in that case."
  },

  /* ── 9.2 Inventory Optimization ──── */

  'EOQ': {
    short: "Economic Order Quantity — the order size that minimizes combined ordering cost and holding cost.",
    full: "EOQ (Economic Order Quantity) calculates the order quantity that minimizes the combined total of ordering cost (roughly fixed per order, regardless of size) and holding cost (rises with order size). It assumes constant, known demand and fixed lead times — it does not address demand uncertainty at all, which is what safety stock separately handles."
  },

  'Safety Stock': {
    short: "Extra inventory held to buffer against demand and lead-time uncertainty, on top of expected demand.",
    full: "Safety stock is additional inventory held specifically to absorb the gap between forecasted and actual demand, or between expected and actual lead time. It should scale with each product's actual forecast uncertainty (forecast error) rather than be set as a flat buffer applied uniformly across an entire catalog — products with volatile, hard-to-forecast demand need substantially more safety stock than stable, predictable ones, even at the same average demand level."
  },

  'Just-in-Time': {
    short: "An inventory strategy that minimizes held stock by timing deliveries to arrive as close as possible to the moment of need.",
    full: "Just-in-Time (JIT) inventory strategy minimizes holding cost by keeping little to no buffer stock, relying instead on highly reliable, tightly coordinated suppliers to deliver close to the moment of actual need. Its cost efficiency and its disruption fragility are the same property — the buffer it removes for cost savings is the same buffer that would otherwise absorb a supply delay or demand spike — which is why it fits best for stable demand with reliable, diversified supply, and poorly for single-source, hard-to-substitute, long-lead-time components."
  },

};

/* ============================================================
   SIDEBAR RENDER
   Called once per page load. Reads TOC and builds nav HTML.
============================================================ */
function renderSidebar(activeSectionId) {
  const container = document.getElementById('sidebarNav');
  if (!container) return;

  // Find which part contains the active section
  let activePartId = null;
  TOC.forEach(part => {
    part.sections.forEach(sec => {
      if (sec.id === activeSectionId) activePartId = part.id;
    });
  });

  const root = (window.GUIDE_ROOT || '');
  const _dm = document.body.classList.contains('dark-mode');
  let html = `<div class="dm-row"><button class="dm-btn" id="darkModeBtn" onclick="toggleDarkMode()"><span class="dm-icon">${_dm ? '&#9728;' : '&#9790;'}</span><span>${_dm ? 'Light mode' : 'Dark mode'}</span></button></div>`;
  html += `<a href="${root}index.html" class="nav-home">&#8592; Cover Page</a>`;
  TOC.forEach(part => {
    const isActivePart = part.id === activePartId;
    html += `<div class="nav-part ${isActivePart ? 'open' : ''}" id="${part.id}">`;
    html += `<div class="nav-part-head" onclick="togglePart('${part.id}')">`;
    html += `<span class="part-label">${part.label}</span>`;
    html += `<span class="part-chevron">&#9658;</span>`;
    html += `</div><div class="nav-items">`;

    part.sections.forEach(sec => {
      if (sec.id === activeSectionId) {
        html += `<a href="#" class="nav-link active">${sec.id} &nbsp;${sec.label}</a>`;
      } else if (sec.file) {
        html += `<a href="${(typeof window.GUIDE_ROOT!=='undefined'?window.GUIDE_ROOT:'') + sec.file}" class="nav-link done">${sec.id} &nbsp;${sec.label} <span class="ck">&#10003;</span></a>`;
      } else {
        html += `<span class="nav-link locked">${sec.id} &nbsp;${sec.label} <span class="lk">&#128274;</span></span>`;
      }
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

/* ============================================================
   GLOSSARY — TOOLTIP & DEFINITION CARD
============================================================ */
function initGlossary() {
  const tooltip = document.getElementById('tooltip');
  const defCard = document.getElementById('def-card');
  const defTerm = document.getElementById('def-term');
  const defBody = document.getElementById('def-body');

  document.querySelectorAll('[data-term]').forEach(el => {
    const term = el.dataset.term;
    const entry = GLOSSARY[term];
    if (!entry) return;

    el.addEventListener('mouseenter', e => {
      if (window.innerWidth <= 768) return;
      tooltip.textContent = entry.short;
      tooltip.style.display = 'block';
      positionTooltip(e);
    });
    el.addEventListener('mousemove', positionTooltip);
    el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    el.addEventListener('click', e => {
      e.stopPropagation();
      tooltip.style.display = 'none';
      defTerm.textContent = term;
      defBody.textContent = entry.full;
      defCard.style.display = 'block';
    });
  });

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 55;
    tooltip.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    tooltip.style.top  = Math.max(y, 8) + 'px';
  }

  document.addEventListener('click', () => { tooltip.style.display = 'none'; });

  const closeBtn = document.getElementById('defClose');
  if (closeBtn) closeBtn.addEventListener('click', () => { defCard.style.display = 'none'; });
}

/* ============================================================
   SIDEBAR — DESKTOP TOGGLE
============================================================ */
function toggleSidebar() {
  if (isMobile()) {
    openMobileSidebar();
    return;
  }
  const sidebar  = document.getElementById('sidebar');
  const mainWrap = document.getElementById('mainWrap');
  const btn      = document.getElementById('sidebarToggleBtn');
  sidebar.classList.toggle('collapsed');
  mainWrap.classList.toggle('expanded');
  if (btn) btn.textContent = sidebar.classList.contains('collapsed') ? '\u25B6' : '\u25C0';
}

/* ============================================================
   SIDEBAR — MOBILE OVERLAY
============================================================ */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('visible');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn) menuBtn.style.display = 'none';
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.textContent = '\u2715';
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn && isMobile()) menuBtn.style.display = 'flex';
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.textContent = '\u25C0';
}

/* ============================================================
   NAV PART COLLAPSE / EXPAND
============================================================ */
function togglePart(partId) {
  const el = document.getElementById(partId);
  if (el) el.classList.toggle('open');
}

/* ============================================================
   UTILITY
============================================================ */
function isMobile() { return window.innerWidth <= 768; }

window.addEventListener('resize', function() {
  if (!isMobile()) closeMobileSidebar();
});

/* ============================================================
   INIT — called from each HTML file
   Usage: initGuide('1.1')  or  initGuide('6.3')  etc.
============================================================ */


/* ============================================================
   LEARNING CHECK — QUIZ ENGINE
============================================================ */
function initQuiz() {
  const quizSection = document.querySelector('.quiz-section');
  if (!quizSection) return;

  let totalCorrect = 0;
  let totalAnswered = 0;
  const totalQuestions = quizSection.querySelectorAll('.quiz-question').length;

  quizSection.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', () => {
      const question = option.closest('.quiz-question');
      if (question.dataset.answered) return;

      question.dataset.answered = 'true';
      totalAnswered++;

      const isCorrect = option.dataset.correct === 'true';
      const allOptions = question.querySelectorAll('.quiz-option');

      allOptions.forEach(o => o.classList.add('locked'));

      if (isCorrect) {
        option.classList.add('correct');
        totalCorrect++;
      } else {
        option.classList.add('incorrect');
        question.querySelector('[data-correct="true"]').classList.add('reveal');
      }

      const exp = question.querySelector('.quiz-explanation');
      if (exp) exp.classList.add('visible');

      const scoreEl = quizSection.querySelector('.quiz-score-num');
      if (scoreEl) scoreEl.textContent = totalCorrect + '/' + totalQuestions;

      if (totalAnswered === totalQuestions) {
        setTimeout(() => showFinalResult(quizSection, totalCorrect, totalQuestions), 600);
      }
    });
  });

  const retryBtn = quizSection.querySelector('.quiz-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => resetQuiz(quizSection));
  }
}

function showFinalResult(quizSection, correct, total) {
  const final = quizSection.querySelector('.quiz-final');
  if (!final) return;

  const scoreEl = final.querySelector('.quiz-final-score');
  const msgEl   = final.querySelector('.quiz-final-msg');

  if (scoreEl) {
    scoreEl.innerHTML = correct + '<span class="denom">/' + total + '</span>';
  }

  const msgs = {
    perfect:  "Perfect score — these concepts are locked in. Move to the next section.",
    strong:   "Strong result. A quick look at the one you missed and you're ready to continue.",
    solid:    "Solid foundation. Review the explanations for the ones you missed before moving on.",
    revisit:  "Consider revisiting this section before continuing — these concepts underpin everything that follows."
  };

  let msg = msgs.revisit;
  if (correct === total)       msg = msgs.perfect;
  else if (correct >= total-1) msg = msgs.strong;
  else if (correct >= total-2) msg = msgs.solid;

  if (msgEl) msgEl.textContent = msg;

  final.classList.add('visible');
  final.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetQuiz(quizSection) {
  quizSection.querySelectorAll('.quiz-question').forEach(q => {
    delete q.dataset.answered;
  });
  quizSection.querySelectorAll('.quiz-option').forEach(o => {
    o.classList.remove('correct', 'incorrect', 'reveal', 'locked');
  });
  quizSection.querySelectorAll('.quiz-explanation').forEach(e => {
    e.classList.remove('visible');
  });

  const total = quizSection.querySelectorAll('.quiz-question').length;
  const scoreEl = quizSection.querySelector('.quiz-score-num');
  if (scoreEl) scoreEl.textContent = '0/' + total;

  quizSection.querySelector('.quiz-final')?.classList.remove('visible');
  quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  initQuiz();
}

/* ============================================================
   SCROLL-TRIGGERED FIGURE REVEAL
============================================================ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const figObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        figObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-scroll-figure]').forEach(fig => {
    fig.style.opacity = '0';
    fig.style.transform = 'translateY(18px)';
    fig.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    figObserver.observe(fig);
  });

  const fig2 = document.querySelector('[data-build-fig2]');
  if (fig2) {
    const layers = Array.from(fig2.querySelectorAll('.diagram-layer'));
    layers.sort((a, b) => parseFloat(b.getAttribute('y') || 0) - parseFloat(a.getAttribute('y') || 0));
    layers.forEach(layer => {
      layer.style.opacity = '0';
      layer.style.transition = 'opacity 0.7s ease';
    });

    const buildObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          layers.forEach((layer, i) => {
            setTimeout(() => { layer.style.opacity = '1'; }, i * 380);
          });
          buildObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    buildObserver.observe(fig2);
  }
}

/* ============================================================
   DEEP-DIVE COLLAPSIBLE BOXES
============================================================ */
function initDeepDives() {
  document.querySelectorAll('.deep-dive-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const box = trigger.closest('.deep-dive');
      box.classList.toggle('open');
    });
  });
}

/* ============================================================
   SORTABLE TABLES
============================================================ */
function initSortableTables() {
  document.querySelectorAll('.data-table.sortable').forEach(table => {
    const headers = table.querySelectorAll('th');
    headers.forEach((th, colIdx) => {
      th.addEventListener('click', () => {
        const isAsc = th.dataset.dir !== 'asc';
        headers.forEach(h => { h.classList.remove('sort-asc', 'sort-desc'); delete h.dataset.dir; });
        th.dataset.dir = isAsc ? 'asc' : 'desc';
        th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');

        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        rows.sort((a, b) => {
          const aVal = a.cells[colIdx] ? a.cells[colIdx].textContent.trim() : '';
          const bVal = b.cells[colIdx] ? b.cells[colIdx].textContent.trim() : '';
          return isAsc ? aVal.localeCompare(bVal, undefined, {numeric: true})
                       : bVal.localeCompare(aVal, undefined, {numeric: true});
        });
        rows.forEach(row => table.appendChild(row));
      });
    });
  });
}

/* ============================================================
   PROGRESS TRACKING
============================================================ */
function initProgressTracking() {
  const sectionId = document.body.dataset.section;
  if (!sectionId) return;

  const btn = document.getElementById('markReadBtn');
  if (!btn) return;

  try {
    const reads = JSON.parse(localStorage.getItem('guide-reads') || '{}');
    if (reads[sectionId]) _setReadUI(btn, true);
  } catch(e) {}

  btn.addEventListener('click', () => {
    try {
      const reads = JSON.parse(localStorage.getItem('guide-reads') || '{}');
      if (reads[sectionId]) {
        delete reads[sectionId];
        localStorage.setItem('guide-reads', JSON.stringify(reads));
        _setReadUI(btn, false);
      } else {
        reads[sectionId] = new Date().toISOString();
        localStorage.setItem('guide-reads', JSON.stringify(reads));
        _setReadUI(btn, true);
      }
    } catch(e) {}
  });
}

function _setReadUI(btn, isRead) {
  const icon = btn.querySelector('.read-icon');
  const label = btn.querySelector('.read-label');
  if (isRead) {
    btn.classList.add('read');
    if (icon)  icon.textContent = '\u2713';
    if (label) label.textContent = 'Section Read';
  } else {
    btn.classList.remove('read');
    if (icon)  icon.textContent = '\u25CB';
    if (label) label.textContent = 'Mark as Read';
  }
}

/* ============================================================
   COPY BUTTONS (for code blocks)
============================================================ */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-wrap')?.querySelector('code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    });
  });
}

/* ============================================================
   DARK MODE
============================================================ */
function initDarkMode() {
  try {
    if (localStorage.getItem('guide-dark-mode') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  } catch(e) {}
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('guide-dark-mode', isDark ? 'dark' : 'light'); } catch(e) {}
  const btn = document.getElementById('darkModeBtn');
  if (btn) btn.innerHTML = isDark
    ? '<span class="dm-icon">&#9728;</span><span>Light mode</span>'
    : '<span class="dm-icon">&#9790;</span><span>Dark mode</span>';
}

function initGuide(activeSectionId) {
  initDarkMode();
  renderSidebar(activeSectionId);
  initGlossary();
  initDeepDives();
  initSortableTables();
  initCopyButtons();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollReveal();
      initQuiz();
      initProgressTracking();
    });
  } else {
    initScrollReveal();
    initQuiz();
    initProgressTracking();
  }

  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileSidebar);

  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'sidebarToggleBtn') {
      toggleSidebar();
    }
  });
}

// Apply saved theme before first paint to prevent flash of light mode
(function() {
  try {
    if (localStorage.getItem('guide-dark-mode') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  } catch(e) {}
})();
