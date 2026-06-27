# Game Improvement Prompt

To run a game improvement session, start a new Claude Code session and say:

> Read `GAME_IMPROVEMENT_PROMPT.md` and follow it exactly, starting from Phase 0.

Alternatively, copy and paste everything between the triple-backtick fences.
Update "Session goal override" only if you want to direct a specific item;
otherwise leave it blank for auto-pick.

---

```
You are running a game improvement session on the data-engineering-guide repository.

PRIORITY: quality over quantity. A fully working, regression-free implementation of
two items is worth more than five half-finished ones. Never start an item you cannot
finish cleanly. Depth beats breadth.

Follow every rule in CLAUDE.md exactly.

════════════════════════════════════════
PHASE 0 — SELF-HEAL PENDING PRS  (before anything else)
════════════════════════════════════════

Run these commands first:

  git fetch origin
  git log --oneline origin/main -10

Then check for open PRs from previous nightly runs using the GitHub MCP tool:

  mcp__github__list_pull_requests  (owner: REPO_OWNER, repo: data-engineering-guide, state: open)

For each open PR from a nightly/claude branch:
  1. Read its mergeable state via mcp__github__pull_request_read
  2. If conflict-free → merge it immediately via mcp__github__merge_pull_request
     before doing any new work
  3. If conflicted → note it in the Phase 5 handoff; do not redo work already
     in that PR, and do not create a new branch that overlaps its files

After merging any pending PRs, run:
  git pull origin main

This ensures tonight's branches start from a fully up-to-date base. Skipping this
step means any file touched by a pending PR will produce a merge conflict when your
new PRs are eventually merged.

════════════════════════════════════════
PHASE 1 — ORIENT  (read before touching anything)
════════════════════════════════════════

Read all of these files in full before writing a single line of code:

  1. CLAUDE.md
  2. BACKLOG.md
  3. TODO.md
  4. learn/drill/drill.js          ← read the ENTIRE file; do not skim
  5. learn/drill/drill.css
  6. content/question-bank.json    ← note the exact schema of existing questions

The git log from Phase 0 tells you what the last nightly session completed. Mark
anything already merged as DONE in BACKLOG.md or TODO.md before proceeding.

════════════════════════════════════════
PHASE 2 — SESSION PLAN  (write this out before any code)
════════════════════════════════════════

1. Filter BACKLOG.md + TODO.md: Status = TODO, all Dependencies = DONE or —
2. Sort by Priority (P0 first) then Effort ascending
3. For each candidate ask: "Can I implement this completely and correctly without
   leaving the codebase in a broken intermediate state?" If no → skip it, note why.
4. Write your ordered work list: ID, title, one-sentence implementation plan, files affected
5. Group items that touch the same file onto the same branch:
     - learn/drill/ changes  → one branch per logical theme
     - content/ changes      → questions/parts-N-N (CLAUDE.md format)
     - guide/ changes        → one branch per part
     - unrelated items       → separate branches, never mixed

Session goal override: *(leave blank for auto-pick)*

════════════════════════════════════════
PHASE 3 — IMPLEMENT  (repeat this loop for every item)
════════════════════════════════════════

─── 3a. PRE-FLIGHT ───────────────────────────────────────────

Before touching any file for this item:
  - Re-read every function you plan to modify in its entirety
  - Identify all call sites of functions you will rename or change signatures on
  - List any localStorage keys you will read or write — never rename an existing
    key without a migration path or you silently wipe user data
  - Confirm the item is still unblocked (no unresolved dependency appeared)

─── 3b. BRANCH ───────────────────────────────────────────────

  git fetch origin && git pull origin main   ← only before the FIRST branch of the session

Branch name: type/short-description (≤5 words, hyphenated — see CLAUDE.md).
Never push directly to main.

─── 3c. IMPLEMENT ────────────────────────────────────────────

Rules:
  - Only change what the item requires — no opportunistic cleanup, no extra features
  - No comments that describe WHAT code does; only add a comment when the WHY
    would genuinely surprise a reader
  - No backwards-compatibility shims for things you are fully replacing
  - No partial implementations — if a feature needs three functions, add all three
    or add none; never leave a half-wired code path
  - If you discover the item is larger than its effort estimate (>2× overshoot):
    commit nothing for it, skip to the next item, add a note in TODO.md

Codebase-specific pitfalls — verify each one before committing:

  drill.js
  ├─ TD grid is 9 cols (0–8) × 10 rows (0–9). Col 9 does not exist; off-by-one
  │  silently places towers or enemies out of bounds.
  ├─ switchTab(), setTopBar(), showHome() are called from many places. Any
  │  signature or behavior change ripples everywhere — trace all call sites first.
  ├─ The requestAnimationFrame loop runs at ~60 fps. Never add synchronous I/O,
  │  DOM queries, or heavy computation inside tdRender() or its sub-functions.
  ├─ ctx.save() / ctx.restore() must bracket any canvas state changes (transform,
  │  fillStyle, globalAlpha, etc.) or state leaks into unrelated draw calls.
  ├─ No bundler — ES2017 max (async/await OK; avoid optional chaining ?. and
  │  nullish coalescing ?? unless confirmed safe for target browsers).
  └─ Every localStorage.getItem() can return null on first run; every setItem()
     can throw in private browsing. Handle both.

  drill.css
  ├─ New rules silently lose to higher-specificity existing rules. Check the
  │  cascade before assuming a new rule applies.
  └─ Mobile layout uses a 768 px breakpoint. Mentally verify both viewports.

  question-bank.json
  ├─ Schema: id, part, topic, type, stem, options (mc only), correct, explanation,
  │  difficulty (integer 1–100, optional but required for new questions), num
  │  — NOT question/answer; those fields do not exist
  ├─ correct: integer 0–3 for mc (0-based index); boolean true/false for tf
  ├─ tf questions must NOT have an options field
  ├─ difficulty: integer 1–100; used by tdQDifficulty() to bucket into easy/medium/hard
  │  for level wave weighting; questions without it fall back to length heuristic
  ├─ num must be sequential from 1 with no gaps or duplicates
  ├─ Duplicate IDs or nums break the drill UI — check existing max before assigning
  └─ question-bank.json is in the sw.js ASSETS list — adding questions also
     requires bumping the SW cache version in the same commit

  sw.js
  └─ The cache string (e.g. 'de-drill-v20') MUST be incremented whenever any
     file in learn/drill/ OR content/question-bank.json changes.
     Increment only the number; keep the prefix format identical.

─── 3d. VERIFY — zero tolerance, fix before committing ───────

Run every check that applies:

  node --check learn/drill/drill.js
  node -e "JSON.parse(require('fs').readFileSync('content/question-bank.json','utf8'))"

SW version check (required for EVERY learn/drill/ change — no exceptions):

  grep "const CACHE" learn/drill/sw.js

  Confirm the number is higher than it was before your change. The sw.js bump
  MUST be in the same commit as the learn/drill/ file that changed. Never plan
  to "bump it in a follow-up" — production users served by the old SW will get
  stale cached files and see a broken app until someone manually clears cache.

Playwright visual verification (required for EVERY learn/drill/ change):

  npm install playwright --prefix /tmp/pw-install 2>/dev/null || true
  python3 -m http.server 8765 --directory . &
  SERVER_PID=$!
  node scripts/verify-drill.js --port 8765 --shots /tmp/drill-verify-$(date +%s)
  VERIFY_EXIT=$?
  kill $SERVER_PID
  exit $VERIFY_EXIT

  Must exit 0 (PASS) — all 20 checks green. If any check fails: fix the
  regression before committing. Include the shot directory path in the PR body.

Then do a manual logic pass:
  □ Re-read every function you added or modified
  □ Trace the happy path end-to-end as a user would experience it
  □ Trace one error path: empty localStorage, offline network, mis-tap
  □ Check for: off-by-one errors, unguarded null dereferences, unreachable code,
    variables used before assignment, missing return values
  □ Confirm sw.js cache version is bumped if learn/drill/ was touched
  □ Confirm BACKLOG.md or TODO.md entry is marked DONE with today's date

If any check fails: fix it before moving on.

─── 3e. COMMIT ───────────────────────────────────────────────

Stage only files for this item — never git add . or git add -A.

Commit message format:
  type(ID): imperative summary under 72 chars

  Explain WHY this change was needed and what approach was chosen.
  Note any non-obvious tradeoffs or constraints.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

NEVER include in commit messages or PR bodies:
  - Claude-Session URLs or any claude.ai links
  - Session identifiers of any kind
  - Personal email addresses or usernames
Only attribution allowed: Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

─── 3f. PUSH ─────────────────────────────────────────────────

  git push -u origin <branch-name>

Network failure → retry up to 4× with 2 s / 4 s / 8 s / 16 s backoff.
Any other failure → investigate before retrying.

─── 3g. LOOP ─────────────────────────────────────────────────

Move to the next item on the session plan.
Do not open PRs yet — batch them all at the end.

════════════════════════════════════════
PHASE 4 — OPEN PRs  (after all commits are pushed)
════════════════════════════════════════

For questions/* branches — follow CLAUDE.md PR format exactly:
  Title:  Add questions: Parts N, N, N
  Body:   parts covered, question count by part, question types used

For all other branches:
  Title:  ≤70 chars, imperative
  Body:
    ## What
    - Bullet list of items completed (ID + title)

    ## Why
    One paragraph on the motivation.

    ## Files changed
    - file — reason

    ## Unblocks
    - Any TODO/BACKLOG items whose dependencies are now satisfied

════════════════════════════════════════
PHASE 5 — SESSION HANDOFF
════════════════════════════════════════

Write a brief handoff note for the next nightly run:

  COMPLETED:        [IDs and titles]
  PARTIAL:          [ID — what was done, what remains, why it stopped]
  SKIPPED:          [ID — reason: too complex / dependency missing / conflicted PR]
  CONFLICTED PRS:   [PR numbers that could not be auto-merged and need manual review]
  NEXT RUN:         [recommended first item and why]
  SW VERSION:       [current cache string in sw.js after this session]

════════════════════════════════════════
ABSOLUTE GUARDRAILS
════════════════════════════════════════

  1. Never push to main
  2. Never skip node --check — a syntax error makes the entire app a blank screen
  3. Never skip JSON validation — a parse error breaks every quiz mode
  4. Never rename a localStorage key without migrating the old value to the new key
  5. Never amend a commit that has already been pushed
  6. Never put unrelated files on the same branch
  7. Never leave the codebase in a broken intermediate state — if item N introduces
     a regression, fix it before starting item N+1
  8. Never implement half a feature — all or nothing
  9. If token limit approaches mid-item: stop coding, push what is fully complete,
     skip the unfinished item cleanly, write the Phase 5 handoff
 10. Never change any file in learn/drill/ without bumping sw.js in the same
     commit — a follow-up bump leaves production broken between the two pushes
```

---

## Expected Picking Order

Items sorted by Priority then Effort. Merge pending PRs in Phase 0 first — the
actual available list may differ depending on what previous sessions completed.

| Order | ID | Title | Effort | Priority | Unblocks |
|-------|----|-------|--------|----------|----------|
| 1 | S-1 | Extract storage layer | 15 | P0 | I-1, I-2, I-3, I-4 |
| 2 | S-8 | Error handling at system boundaries | 10 | P0 | A-3 |
| 3 | Q-1 | 30 new questions, Parts 1–3 | 20 | P0 | Q-2 |
| 4 | I-1 | Save export / import (JSON blob) | 12 | P0 | I-2, P-3, P-7 |
| 5 | I-4 | Auto-save every 30 s | 10 | P0 | — |
| 6 | S-5 | Cache DOM element references | 8 | P1 | — |
| 7 | S-9 | Question bank JSON schema validation | 12 | P1 | — |
| 8 | S-2 | Extract question-logic module | 20 | P1 | — |
| 9 | I-3 | Offline question-bank versioning | 18 | P1 | — |
| 10 | A-1 | Touch target audit (≥48 px) | 10 | P1 | — |
| 11 | C-4 | Explanation on wrong answer | 18 | P1 | — |
| 12 | U-6 | Pause / resume mid-wave | 18 | P1 | — |
| 13 | U-7 | Tower placement confirmation | 12 | P1 | — |
| 14 | U-8 | Free sell pre-wave | 15 | P1 | U-7 |
| 15 | P-2 | XP tied to quiz correctness | 22 | P1 | P-1 |
| 16 | P-8 | Question mastery tracking | 30 | P1 | I-1 |
| 17 | Q-2 | 30 new questions, Parts 4–6 | 20 | P1 | Q-1 |
| 18 | G-1 | Boss enemies | 35 | P1 | — |
| 19 | G-2 | Enemy special types | 42 | P1 | G-1 |
| 20 | S-3 | Extract TD engine block | 40 | P1 | — |
| 21 | S-4 | Extract canvas render block | 30 | P1 | S-3 |
| 22 | A-2 | prefers-reduced-motion | 8 | P2 | — |
| 23 | V-8 | Floating damage numbers | 14 | P2 | — |
| 24 | V-9 | Screen shake | 8 | P2 | — |
| 25 | S-6 | Data-drive TD level/tower/enemy config | 18 | P2 | — |
| 26 | S-7 | Split drill.css into logical layers | 25 | P2 | — |
| 27 | Q-3 | 20 new questions, Parts 7–9 + Appendix | 15 | P1 | Q-2 |
| … | … | Continue through remaining TODO items | … | … | … |

A solid session completes items 1–6.
An excellent session adds 7–10 and one UX quick-win.

---

*Last updated: 2026-06-25*
