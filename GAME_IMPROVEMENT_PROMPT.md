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

Read all of these files before writing a single line of code:

  1. CLAUDE.md                     ← read in full; rules are non-negotiable
  2. BACKLOG.md                    ← read in full; derive picking order here
  3. learn/drill/drill.js          ← do NOT read the entire file upfront;
                                      use Grep/Glob to locate the specific
                                      functions your chosen item touches, then
                                      Read only those sections in full.
                                      (The file is 4 500+ lines — a full read
                                      wastes context before you start coding.)
  4. learn/drill/drill.css         ← read in full if your item touches CSS
  5. content/question-bank.json    ← read in full only if adding questions;
                                      otherwise just check the max `num` and
                                      `id` values to avoid collisions

The git log from Phase 0 tells you what the last nightly session completed. Mark
anything already merged as DONE in BACKLOG.md before proceeding.

════════════════════════════════════════
PHASE 2 — SESSION PLAN  (write this out before any code)
════════════════════════════════════════

1. Filter BACKLOG.md: Status = TODO, all Dependencies = DONE or —
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
    commit nothing for it, skip to the next item, add a note in BACKLOG.md

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
  ├─ No bundler — ES2020 features in use (optional chaining `?.`, nullish
  │  coalescing `??`, async/await). Do not add top-level `await` or dynamic
  │  `import()` — the file is loaded as a plain script tag, not a module.
  ├─ Sprite sheet assets live in `learn/drill/assets/map/`. The manifest at
  │  `learn/drill/assets/map/manifest.json` describes all 6 deco sheets
  │  (deco-verdant-1/2, deco-decay-1/2, deco-void-1/2). Any new asset added
  │  there must also be added to the sw.js ASSETS array.
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

  bash .claude/skills/verifier-browser.sh

  Must exit 0 (PASS) — all checks green. The script starts its own server,
  drives Chromium through the full app flow (home → map → run node → TD battle),
  and validates: home renders, filter drawer builds, canvas initialises, wave
  preview shows, wave preview hides on start, service worker registers.
  If any check fails: fix the regression before committing.
  Screenshot is saved to /tmp/drill-verify-*/verify-pass.png — include the path
  in the PR body.

Then do a manual logic pass:
  □ Re-read every function you added or modified
  □ Trace the happy path end-to-end as a user would experience it
  □ Trace one error path: empty localStorage, offline network, mis-tap
  □ Check for: off-by-one errors, unguarded null dereferences, unreachable code,
    variables used before assignment, missing return values
  □ Confirm sw.js cache version is bumped if learn/drill/ was touched
  □ Confirm BACKLOG.md entry is marked DONE with today's date

If any check fails: fix it before moving on.

─── 3e. COMMIT ───────────────────────────────────────────────

Stage only files for this item — never git add . or git add -A.

Commit message format:
  type(ID): imperative summary under 72 chars

  Explain WHY this change was needed and what approach was chosen.
  Note any non-obvious tradeoffs or constraints.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

NEVER include in commit messages or PR bodies:
  - Claude-Session URLs or any claude.ai links of any kind
  - "_Generated by Claude Code" or "_Generated with Claude Code" footers
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

NEVER include in any PR title or body:
  - claude.ai links of any kind (session URLs, chat links, etc.)
  - "_Generated by Claude Code" or "_Generated with Claude Code" footers
  - Session identifiers or internal task IDs
  - Any claude.ai/code/session_* URL

The pre-push hook does NOT intercept GitHub API calls — PR body content
is entirely self-enforced. Check every PR body before calling
mcp__github__create_pull_request.

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
  9. If token usage crosses ~70% of context limit mid-item: stop coding, push
     what is fully complete, skip the unfinished item cleanly, write the Phase 5
     handoff. Target is 150 effort points per session — hitting 110 cleanly is
     better than hitting 150 with a broken tail.
 10. Never change any file in learn/drill/ without bumping sw.js in the same
     commit — a follow-up bump leaves production broken between the two pushes
 11. Never put a claude.ai link, session URL, or "_Generated by Claude Code" footer
     in any PR title or body — the pre-push hook does not catch GitHub API calls;
     this is self-enforced and non-negotiable
```

---

## How to Derive the Picking Order (do this in Phase 2, not from memory)

The static table that used to live here was removed because it became stale
within days of being written. Derive the live list from BACKLOG.md instead:

1. Open `BACKLOG.md` — it is the single source of truth.
2. Filter rows where `Status = TODO`.
3. For each candidate, check its `Dependencies` column: every listed ID must
   have `Status = DONE` or `—` in BACKLOG.md, OR must be in a merged PR you
   confirmed in Phase 0. If any dependency is unresolved → skip the item.
4. Sort the remaining candidates: **Priority ascending (P0 → P3), then Effort
   ascending within the same tier**.
5. The first item on that sorted list is your next task.

This means the session plan is always correct regardless of what previous
sessions completed — no manual table maintenance required.

### Session point budget: 150 effort points per run

Each session targets **~150 effort points** of completed, verified, merged work.
Track a running total as you commit each item and keep picking until the budget
is spent or the token limit approaches.

Picking rule — before starting each candidate item ask:
  `runningTotal + item.effort ≤ 160` → pick it
  `runningTotal + item.effort > 160` → skip to the next lower-effort item that fits;
  if nothing fits, close out the session

**Large-item guardrails:**

| Item effort | Max per session | Notes |
|-------------|-----------------|-------|
| ≤ 20        | no cap          | Fill the budget freely with these |
| 21–40       | 4               | Mix with smaller items |
| 41–60       | 2               | Each one anchors roughly half the budget |
| > 60        | 1               | Sole focus for the night; pair only with XS items (≤ 10) |

**Token headroom rule:** If token usage crosses ~70% of the context limit
mid-item, stop coding immediately — push everything fully committed so far,
skip the in-progress item cleanly, and write the Phase 5 handoff. A clean
110-point session is better than a 150-point session with a broken tail.

A solid session lands **100–130 points** cleanly verified.
An excellent session lands **130–160 points** with no regressions.
Quality beats quantity — every committed item must be verifier-green before the next begins.

---

*Last updated: 2026-06-28. Session target: 150 effort points per run.*
