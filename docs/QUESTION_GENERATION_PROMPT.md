# Question Generation Prompt

To run a question generation session, start a new Claude Code session and say:

> Read `QUESTION_GENERATION_PROMPT.md` and follow it exactly, starting from Step 1.

---

```
Generate a new batch of questions for the data-engineering-guide question bank.

═══════════════════════════════════════════════════════
STEP 1 — AUDIT AND BACKFILL MISSING DIFFICULTY SCORES
═══════════════════════════════════════════════════════
Read `content/question-bank.json` and check for questions missing a difficulty score:

  python3 -c "
  import json
  qs = json.load(open('content/question-bank.json'))
  missing = [q for q in qs if 'difficulty' not in q]
  print(f'{len(missing)} questions missing difficulty (of {len(qs)} total)')
  for q in missing:
      print(f'  num={q[\"num\"]:3d}  part={q[\"part\"]}  {q[\"type\"]}  {q[\"stem\"][:60]}')
  "

If ALL questions already have a difficulty field → print "All scored — proceed to Step 2"
and skip the rest of this step.

If ANY questions are missing a difficulty field → score every unscored question
before doing anything else. Do not generate new questions until all existing
questions are scored. The full calibrated scale requires complete coverage —
a partial score set produces anchors that skew new questions.

SCORING THE BACKLOG:

Work through unscored questions in batches of 20, applying the same rubric
used for new questions (defined in Step 4):

  1–25   Recall — direct definition, T/F on a clear fact
  26–50  Understanding — apply one concept to a straightforward scenario
  51–75  Analysis — compare trade-offs, multi-constraint scenario
  76–100 Synthesis — architect-level judgment, counter-intuitive answer,
                     combining 2+ distinct concepts

For each batch of 20:
  a. Score each question independently.
  b. Recalibrate the batch against itself — spread scores, avoid clustering.
  c. Write the scores into the existing question objects in question-bank.json
     by adding the "difficulty" field to each question that is missing it.
     Do NOT change any other field.
  d. Verify no questions in the batch share the same difficulty score.

After all batches are done, run a global uniqueness check:
  python3 -c "
  import json
  qs = json.load(open('content/question-bank.json'))
  scored = [q for q in qs if 'difficulty' in q]
  unscored = [q for q in qs if 'difficulty' not in q]
  diffs = [q['difficulty'] for q in scored]
  dupes = [d for d in set(diffs) if diffs.count(d) > 1]
  print(f'Scored: {len(scored)}, Unscored: {len(unscored)}')
  if dupes: print('WARNING — duplicate difficulty values:', dupes)
  else: print('All difficulty values unique')
  print('Range:', min(diffs), '–', max(diffs))
  "

If any two questions share the same difficulty value, adjust one of them by ±1
until all values are unique across the entire bank.

Commit the backfill BEFORE proceeding to new question generation:
  git add content/question-bank.json
  git commit -m "chore: backfill difficulty scores for existing questions (N questions)"

═══════════════════════════════════════════════════════
STEP 2 — DETERMINE WHICH 4 SECTIONS TO GENERATE
═══════════════════════════════════════════════════════
Read `content/question-bank.json` (now fully scored from Step 1).

Group existing questions by their `topic` field. Count how many questions
exist per topic. Find the 4 topics (guide sections) with the fewest questions,
prioritising zero-coverage gaps first.

The guide sections come from these Part directories:
  guide/01-data-platform-foundation/
  guide/02-data-fundamentals/
  guide/03-compute-and-transformation/
  guide/04-analytics-and-visualisation/
  guide/05-delivery-and-leadership/
  guide/06-ai-and-agentic-systems/
  guide/07-product-management-fundamentals/
  guide/08-classical-ml-and-statistics/
  guide/09-supply-chain-analytics/

Each directory contains one or more HTML files; each file is a section.
List the HTML files in each directory to discover all sections, then map
them against existing `topic` values in the question bank to find gaps.

Do NOT repeat a section/topic that already has 5 or more questions.

═══════════════════════════════════════════════════════
STEP 3 — READ SECTION CONTENT
═══════════════════════════════════════════════════════
For each of the 4 chosen sections, grep the relevant guide HTML file for:
  - <h1 class="chap-title">   → section title (use as the `topic` value)
  - <li> inside .outcomes     → learning outcomes
  - <h2 class="sec-title">    → major sub-topics

Do NOT read entire files. These targeted excerpts are sufficient context.

═══════════════════════════════════════════════════════
STEP 4 — DESIGN 5 QUESTIONS PER SECTION (20 total)
═══════════════════════════════════════════════════════
For each section, write exactly 5 questions.

CONTENT BALANCE:
  - At most 50% of questions should directly test content from the guide text
  - The remaining 50%+ should expand beyond the guide — test adjacent concepts,
    real-world application, common pitfalls, industry tooling, or depth that
    a practitioner at Director / Data Science lead level would need
  - If a topic is closely related to the section theme but not covered in the
    guide (a key tool, a common pattern, a counterexample), include it
  - Questions should teach, not just review — explanations are part of the value

QUESTION TYPES (no drag-and-drop — app is mobile-only):
  - Multiple choice (type: "mc") — exactly 4 options, exactly one correct
  - True / False (type: "tf") — boolean correct answer
  - Mix types within each section; avoid 5 consecutive of the same type
  - Aim for roughly 3 mc + 2 tf per section

QUALITY STANDARDS:
  - Each question tests ONE clear concept or skill
  - Distractors must be plausible and wrong for a specific, articulable reason
  - No trick questions, no ambiguous wording
  - Scenario-based questions ("A team is doing X — what should they do?") are
    preferred over pure definition recall
  - Explanation: 80–200 words covering (a) why the correct answer is right,
    (b) why each wrong answer fails, (c) one practical takeaway

═══════════════════════════════════════════════════════
STEP 5 — SCORE DIFFICULTY (1–100) FOR ALL 20 QUESTIONS
═══════════════════════════════════════════════════════
Before writing to the file, assign a `difficulty` integer (1–100) to every
question. This score controls which levels players encounter the question in
the tower defense game — harder questions appear in later, higher-stakes waves.

RUBRIC:
  1–25   Recall
         Direct definition, single-fact recognition, or T/F on an
         unambiguous statement. A reader who skimmed the section would pass.
         Example: "What does ETL stand for?" or "True/False: Hot tier has
         higher storage cost than Cool tier."

  26–50  Understanding
         Apply one concept to a straightforward scenario. One obvious
         wrong turn exists, but the scenario gives clear signals.
         Example: "A team needs millisecond access to data queried weekly —
         which tier?" (Cold vs Archive is the key distinction.)

  51–75  Analysis
         Compare trade-offs between two or more valid-sounding options.
         Requires knowing why the distractors fail, not just why the answer
         is right. Multi-constraint scenarios belong here.
         Example: "A pipeline must handle late-arriving records AND support
         time-travel queries — which format?" (requires knowing both constraints)

  76–100 Synthesis
         Architect-level judgment: ambiguous real-world constraints, multiple
         competing priorities, counter-intuitive correct answer, or requires
         combining 2+ distinct concepts correctly.
         Example: "A Director must choose between a data mesh and a data lake
         given [5 constraints] — which and why?" No single rule resolves it.

CALIBRATION PROCESS:
  1. Score each question independently against the rubric above.
  2. List all 20 questions with their provisional scores.
  3. Re-read them as a group and recalibrate: the hardest question in this
     batch should be the highest score; the easiest should be the lowest.
     Spread scores — avoid clustering everything in the 40–60 band.
  4. Sample 5 existing questions as anchors to keep the scale consistent
     across sessions (Step 1 guarantees all existing questions are scored):
       python3 -c "
       import json, random
       qs = json.load(open('content/question-bank.json'))
       sample = random.sample(qs, 5)
       for q in sorted(sample, key=lambda x: x['difficulty']):
           print(q['difficulty'], q['type'], q['stem'][:80])
       "
     Adjust your scores so they feel consistent relative to those anchors.

GENERAL GUIDELINES:
  - T/F questions rarely exceed 50 (binary choice limits ceiling)
  - Pure recall MC rarely exceeds 35
  - A question with 4 all-plausible distractors rarely falls below 45
  - Scenario questions with 3+ constraints rarely fall below 55
  - No two questions should share the exact same score

═══════════════════════════════════════════════════════
STEP 6 — FIND CURRENT MAX AND WRITE QUESTIONS
═══════════════════════════════════════════════════════
Before writing, get the current max `num`:

  python3 -c "
  import json
  qs = json.load(open('content/question-bank.json'))
  print('max num:', max(q['num'] for q in qs))
  print('total:', len(qs))
  "

Append the 20 new questions to `content/question-bank.json`.

JSON schema per question (preserve this exact field order):
{
  "id":          "p<partNum>-<topic-slug>-<NNN>",
  "part":        3,
  "topic":       "Delta Lake",
  "type":        "mc",
  "stem":        "...",
  "options":     ["...", "...", "...", "..."],
  "correct":     0,
  "explanation": "...",
  "difficulty":  62,
  "num":         83
}

Field rules:
  id          — unique slug: p<part>-<kebab-section-name>-<NNN> (001, 002…)
                Check all existing IDs before assigning — no duplicates allowed
  part        — integer 1–9 matching the guide Part
  topic       — the section title from <h1 class="chap-title"> in the guide HTML,
                NOT the Part name. Use the exact string from the heading.
                (e.g. "Delta Lake", "RAG Pipelines", not "Part 3")
  type        — "mc" or "tf" only
  stem        — the question text
  options     — mc only, array of exactly 4 strings; omit this field entirely for tf
  correct     — mc: integer 0–3 (0-based index into options); tf: boolean true or false
  explanation — string, 80–200 words
  difficulty  — integer 1–100 from Step 4; no two questions share the same score
  num         — sequential integer starting at (current max num + 1), incrementing by 1

═══════════════════════════════════════════════════════
STEP 7 — VERIFY JSON
═══════════════════════════════════════════════════════
Run all of these checks — fix any failure before committing:

  python3 -c "import json; json.load(open('content/question-bank.json')); print('JSON valid')"

  python3 -c "
  import json
  qs = json.load(open('content/question-bank.json'))
  ids = [q['id'] for q in qs]
  nums = [q['num'] for q in qs]
  diffs = [q['difficulty'] for q in qs]
  assert len(ids) == len(set(ids)), 'DUPLICATE IDs: ' + str([x for x in ids if ids.count(x)>1])
  assert len(nums) == len(set(nums)), 'DUPLICATE nums: ' + str([x for x in nums if nums.count(x)>1])
  assert sorted(nums) == list(range(1, len(nums)+1)), 'nums not sequential from 1'
  mc = [q for q in qs if q['type']=='mc']
  tf = [q for q in qs if q['type']=='tf']
  assert all(isinstance(q['correct'], int) and 0 <= q['correct'] <= 3 for q in mc), 'bad mc correct'
  assert all(isinstance(q['correct'], bool) for q in tf), 'bad tf correct'
  assert all('options' not in q for q in tf), 'tf has options field'
  assert all(len(q['options'])==4 for q in mc), 'mc options not exactly 4'
  assert all('difficulty' in q for q in qs), 'MISSING difficulty on: ' + str([q['id'] for q in qs if 'difficulty' not in q])
  assert all(isinstance(d, int) and 1 <= d <= 100 for d in diffs), 'difficulty out of range'
  assert len(diffs) == len(set(diffs)), 'DUPLICATE difficulty scores: ' + str([d for d in set(diffs) if diffs.count(d)>1])
  print('All checks passed —', len(qs), 'questions,', len(mc), 'mc,', len(tf), 'tf')
  print('Difficulty range:', min(diffs), '–', max(diffs))
  print('Unscored questions: 0')
  "

═══════════════════════════════════════════════════════
STEP 8 — BUMP SERVICE WORKER CACHE VERSION
═══════════════════════════════════════════════════════
`content/question-bank.json` is listed in `learn/drill/sw.js` ASSETS.
If you do not bump the SW version, users will be served the old cached
question bank — they will never see the new questions.

  grep "const CACHE" learn/drill/sw.js

Increment the version number by 1 (e.g. de-study-v2 → de-study-v3).
This change goes in the SAME commit as question-bank.json — never a follow-up.

═══════════════════════════════════════════════════════
STEP 9 — COMMIT AND PUSH
═══════════════════════════════════════════════════════
Branch name uses the 4 part numbers covered:
  questions/parts-N-N-N-N   (e.g. questions/parts-1-3-6-8)

  git fetch origin main && git pull origin main
  git checkout -b questions/parts-N-N-N-N
  git add content/question-bank.json learn/drill/sw.js
  git commit -m "Add 20 questions: Parts N, N, N, N — <brief theme summary>

  Sections covered: <list>
  Difficulty range: <min>–<max>
  SW bumped: de-study-vX → de-study-vY"
  git push -u origin questions/parts-N-N-N-N

Then open a PR to main with title:  Add questions: Parts N, N, N, N

PR body must include:
  - Which sections are covered (one line each)
  - Question count per part
  - Question types used (X mc, Y tf)
  - Difficulty range and distribution summary
  - SW version bump (old → new)

NEVER include in PR body or commit messages:
  - claude.ai links of any kind — session URLs, chat links, any claude.ai/* URL
  - "_Generated by Claude Code" or "_Generated with Claude Code" footers
  - Session identifiers of any kind
  - Personal email addresses or usernames
Only attribution allowed: Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
The pre-push hook does NOT intercept GitHub API calls — self-check every PR body
before calling mcp__github__create_pull_request.

═══════════════════════════════════════════════════════
COMPLETION CHECKLIST
═══════════════════════════════════════════════════════
□ Step 1: All existing questions have a difficulty score (0 unscored)
□ Step 1: If backfill was needed, committed separately before new questions
□ 4 sections selected — all have fewer than 5 existing questions
□ 5 questions per section, 20 total
□ ≤50% of questions directly from guide content
□ Mixed question types (mc and tf) within each section
□ All explanations 80–200 words
□ topic field matches <h1 class="chap-title"> exactly — not the Part name
□ num values are sequential from (previous max + 1), no duplicates
□ correct is integer 0–3 for mc, boolean for tf
□ tf questions have no options field
□ difficulty is integer 1–100, unique across the ENTIRE bank (not just new 20)
□ difficulty scores are spread across the rubric bands — not clustered
□ JSON validates — all assertions pass including "Unscored questions: 0"
□ sw.js cache version bumped in same commit as new questions
□ Pushed to questions/parts-N-N-N-N
□ PR opened to main
```
