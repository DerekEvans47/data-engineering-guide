# Syntax Question Generation Prompt

Generate syntax-based questions for the data-engineering-guide question bank.
These are **code-first** questions: the learner reads a snippet and either fills in
a blank or identifies the correct / incorrect statement.

To run a generation session, start a new Claude Code session and say:

> Read `SYNTAX_QUESTION_GENERATION_PROMPT.md` and follow it exactly, starting from Step 1.

---

```
Generate a new batch of syntax questions for the data-engineering-guide question bank.

═══════════════════════════════════════════════════════
STEP 1 — CHOOSE A THEME
═══════════════════════════════════════════════════════
Pick ONE theme from the list below that has the fewest questions already in
content/question-bank.json (filter by syntaxTheme field). Generate 20–25
questions for that theme before moving to another.

Available themes:

  sql          — SQL: window functions, CTEs, JOINs, NULLs, EXPLAIN, CASE
  spark        — PySpark / Spark SQL: DataFrame API, transformations, UDFs
  dbt          — dbt: ref(), source(), model YAML, schema tests, macros
  delta        — Delta Lake: MERGE INTO, time travel, OPTIMIZE, Z-ORDER, VACUUM
  databricks   — Databricks: widgets, %run, Unity Catalog SQL, job YAML
  airflow      — Airflow: DAG syntax, operators, XCom, TaskFlow, schedule
  yaml_ci      — YAML/CI: GitHub Actions, Azure Pipelines, dbt project.yml
  python_de    — Python DE patterns: comprehensions, generators, context managers,
                 typing hints for data pipelines

═══════════════════════════════════════════════════════
STEP 2 — READ THE CURRENT BANK
═══════════════════════════════════════════════════════
Run:
  python3 -c "
  import json
  qs = json.load(open('content/question-bank.json'))
  syntax = [q for q in qs if q.get('syntaxTheme')]
  from collections import Counter
  print(Counter(q['syntaxTheme'] for q in syntax))
  print('Max num:', max((q['num'] for q in qs), default=0))
  "

Note the max num — new questions must continue the sequence.

═══════════════════════════════════════════════════════
STEP 3 — QUESTION TYPES
═══════════════════════════════════════════════════════
Every syntax question uses type "mc" with exactly ONE extra field: "code".

TWO subtypes are allowed:

A) Fill-in-the-blank
   • The code block contains ___ (three underscores) where the answer goes.
   • stem explains what the code should do.
   • Four options are the candidate completions (not the full snippet).
   • Example:

   "code": "SELECT dept, ___ OVER (PARTITION BY dept ORDER BY salary DESC)\nFROM employees;",
   "stem": "Which window function assigns a unique sequential integer to each row within a department, ordered by salary descending — with no gaps in the sequence even when values are tied?",
   "options": ["RANK()", "ROW_NUMBER()", "DENSE_RANK()", "NTILE(4)"],
   "correct": 2,

B) Spot the correct / incorrect statement
   • code block is empty string "" — the four options ARE the code snippets.
   • stem asks the learner to pick the statement that is correct/syntactically
     valid/produces the described output, OR to spot the one that will error.
   • Keep options short (≤ 2 lines each) so they fit the card.
   • Example:

   "code": "",
   "stem": "A Delta table at /mnt/sales needs to be queried as of exactly 7 days ago. Which statement is correct?",
   "options": [
     "SELECT * FROM sales TIMESTAMP AS OF date_sub(current_date(), 7)",
     "SELECT * FROM sales VERSION AS OF -7",
     "SELECT * FROM delta.`/mnt/sales`@v-7",
     "SELECT * FROM sales FOR SYSTEM_TIME AS OF '7 days ago'"
   ],
   "correct": 0,

═══════════════════════════════════════════════════════
STEP 4 — DIFFICULTY SCORING
═══════════════════════════════════════════════════════
Use the same rubric as the main bank. Syntax questions tend to cluster at
26–65. Spread scores across that range; no two questions in a batch may
share the same score.

  1–25   Recall — keyword or clause name any practitioner knows
  26–50  Understanding — choose the right variant for a clear scenario
  51–75  Analysis — subtle behavioural difference (e.g. RANK vs DENSE_RANK)
  76–100 Synthesis — predict output, cross-clause interaction, gotcha

═══════════════════════════════════════════════════════
STEP 5 — SCHEMA (every question must match exactly)
═══════════════════════════════════════════════════════
{
  "id":          "<theme>-<kebab-slug>",          // unique, no spaces
  "part":        <integer 1–9>,                    // closest guide part
  "topic":       "<Topic Name>",
  "syntaxTheme": "<theme from Step 1>",
  "type":        "mc",
  "code":        "<snippet or empty string>",
  "stem":        "<question text>",
  "options":     ["A", "B", "C", "D"],
  "correct":     <0-indexed integer>,
  "explanation": "<1–3 sentence explanation of why the answer is correct and the distractors are wrong>",
  "difficulty":  <integer 1–100, unique within batch>,
  "num":         <max_num + 1, incrementing>
}

Validation — run this before writing:
  python3 -c "
  import json, sys
  batch = json.loads(open('/tmp/syntax_batch.json').read())
  required = {'id','part','topic','syntaxTheme','type','code','stem','options','correct','explanation','difficulty','num'}
  errors = []
  diffs = []
  for i, q in enumerate(batch):
      missing = required - q.keys()
      if missing: errors.append(f'Q{i}: missing {missing}')
      if q.get('type') != 'mc': errors.append(f'Q{i}: type must be mc')
      if not isinstance(q.get('options'), list) or len(q['options']) != 4:
          errors.append(f'Q{i}: options must be list of 4')
      if q.get('correct') not in [0,1,2,3]: errors.append(f'Q{i}: correct must be 0-3')
      if q.get('difficulty') in diffs: errors.append(f'Q{i}: duplicate difficulty {q[\"difficulty\"]}')
      else: diffs.append(q.get('difficulty'))
  if errors:
      print('ERRORS:'); [print(' ', e) for e in errors]; sys.exit(1)
  else:
      print(f'OK — {len(batch)} questions valid')
  "

═══════════════════════════════════════════════════════
STEP 6 — WRITE TO BANK
═══════════════════════════════════════════════════════
Append the validated batch to content/question-bank.json:

  python3 -c "
  import json
  bank = json.load(open('content/question-bank.json'))
  batch = json.load(open('/tmp/syntax_batch.json'))
  bank.extend(batch)
  json.dump(bank, open('content/question-bank.json', 'w'), indent=2)
  print(f'Bank now has {len(bank)} questions')
  "

Then update BACKLOG.md to reflect questions added.

═══════════════════════════════════════════════════════
STEP 7 — COMMIT
═══════════════════════════════════════════════════════
git add content/question-bank.json BACKLOG.md
git commit -m "questions: add <N> <theme> syntax questions (bank now <total>)"

Branch naming: questions/syntax-<theme>   (e.g. questions/syntax-sql)
Open a PR to main after committing.

NEVER include in commit messages or PR bodies:
  - Claude-Session URLs or any claude.ai links
  - Session identifiers of any kind
  - Personal email addresses or usernames
Only attribution allowed: Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Coverage Targets

| Theme | Target | Notes |
|-------|--------|-------|
| sql | 25 | Window functions, CTEs, JOINs, NULLs, CASE, set ops |
| spark | 25 | DataFrame API, Spark SQL, UDFs, streaming basics |
| dbt | 20 | ref/source, YAML config, schema tests, macros |
| delta | 20 | MERGE, time travel, OPTIMIZE, VACUUM, constraints |
| databricks | 15 | Widgets, Unity Catalog, job YAML, %run, secrets |
| airflow | 20 | DAG/task syntax, operators, XCom, TaskFlow API |
| yaml_ci | 15 | GitHub Actions, Azure Pipelines, dbt project.yml |
| python_de | 20 | Generators, typing, context managers, dataclasses |

**Total target: ~160 syntax questions**

## Future: Themed Run Map Nodes

When enough questions exist per theme (≥15), themed "Syntax Gauntlet" nodes
can be added to the run map — pulling exclusively from that syntaxTheme pool
and showing the theme emoji + name on the node card. This work is tracked
in BACKLOG.md under the syntax-nodes item (not yet added).
