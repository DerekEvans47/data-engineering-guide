# Project Status — Quick Handoff

> ⚠️ **Superseded — this snapshot predates the 2026-07 restructure.** As of 2026-07-23 the
> repo was split: the **learning material** (the written guide, the Study & Drill app, the
> Flashcards app, and the shared question bank + glossary) lives here behind a landing page
> (`index.html`), and the **tower-defense game** was moved to a standalone `game/` folder
> (bound for its own repository) with the **in-battle quiz mechanic removed**. Everything
> below (PRs #130–132, v129, the quiz-linked roadmap) describes the pre-split game and is
> kept only for history.

*Updated 2026-07-05. One-page snapshot: what just happened, what's next, what's open.
Deeper context: `docs/BACKLOG.md` (full item list), `docs/CHANGELOG.md` (commit history).*

## Last things done (2026-07-05, PRs #130–#132)

- **Region-map spine reshaped** (#130): nodes re-placed via user-targeted grid cells,
  **Fishing Camp** added (lakeshore theme), Abandoned Village node cut, Corrupted Mile
  renamed **The Abandoned Town**. Journey order now follows the painted road.
- **Playtest round 4** (#131): landscape home-screen fit, Ranger rebalance (slow heavy
  shots, arrows now 10 cells/s instead of a pre-HiDPI crawl), full-bleed region map (black
  bars removed), ambient polish (flags on tower tips, smoke drifts with painted plumes,
  ripple glints, soft irregular mist, sheep re-anchored).
- **This PR** (#132): iPhone-Safari landscape home fix (real cause: the landscape media
  queries sat above the base rules in drill.css and were being overridden by source
  order; second tighter tier added for the ~330px toolbar viewport), sheep tinted to
  match the painted herd (#d9d5a8), backlog review + new **K section** (genre benchmark:
  Kingdom Rush / BTD6 / GemCraft / Defense Grid — 11 new items), this file.

## Next up (recommended order)

1. **K-1 Game speed toggle (1×/2×)** — 12 pts, highest value-per-point in the backlog.
2. **K-2 Early-call wave bonus** — 18 pts, fixes between-wave dead air; quiz-linked.
3. **K-3 Per-tower targeting priority** — 20 pts, biggest cheap tactical win.
4. Then: EQ-3 power-up content, K-7 named minibosses, W-2 elite contracts (core risk
   loop), K-4 quiz-charged active abilities (the identity feature — worth doing well).

## Active issues / watch list

- **iPhone landscape home fix needs on-device confirmation** — verified in Chromium at
  852×330 (Safari-toolbar size), but the previous "fix" also passed there while the CSS
  ordering bug hid the real layout. Check on the actual phone after this deploy (v129).
- **GitHub Pages deploys can fail transiently** ("Deployment failed, try again later",
  seen twice on #131). If the version badge doesn't advance after a merge: re-run the
  FULL `pages build and deployment` workflow (re-running only failed jobs reuses the
  same artifact and fails the same way).
- **`lakeshore` battle map has no scene block yet** in BATTLEMAP_GENERATION_PROMPTS.md
  (new Fishing Camp node); `blighted-forest` block is retired. The numbered `###`
  headings in that file still use the pre-2026-07-05 node order — battleTheme keys are
  canonical.
- **Ranger rebalance is untested against late waves** — DPS was held constant per tier,
  but slower fire rate changes feel against fast enemies (raiders/riders); watch wave
  3+ leak rates on real playthroughs.
- **W-2/W-3 (elite contracts + corruption meter)** — the designed risk-economy core loop
  is still unbuilt; the world map currently has no per-node stakes choice.
