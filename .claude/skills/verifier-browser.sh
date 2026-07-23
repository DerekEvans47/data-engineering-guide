#!/usr/bin/env bash
# verifier-browser.sh — Playwright smoke test for learn/drill
#
# Usage (called by Claude's /verify skill automatically):
#   bash .claude/skills/verifier-browser.sh
#
# Exit 0 = PASS, exit 1 = FAIL
# Requires: node, playwright (@playwright/test or raw), python3 (for HTTP server)
# Browser: /opt/pw-browsers/chromium (pre-installed in Claude Code remote env)

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# DRILL_SCRATCH/DRILL_KEEP: CI overrides — fixed dir + keep the screenshot
# for artifact upload instead of the default per-run tmpdir that's wiped.
export SCRATCHPAD="${DRILL_SCRATCH:-${TMPDIR:-/tmp}/drill-verify-$$}"
mkdir -p "$SCRATCHPAD"

# ── Start local HTTP server ────────────────────────────────────────────────
PORT=8797
python3 -m http.server "$PORT" --directory "$REPO_ROOT" \
  > "$SCRATCHPAD/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; [ -z "${DRILL_KEEP:-}" ] && rm -rf "$SCRATCHPAD"' EXIT
sleep 1

# ── Playwright test ────────────────────────────────────────────────────────
node - <<'JSEOF'
// Resolve playwright: repo-local node_modules first (CI installs it there),
// then the Claude remote-env global install.
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const PORT = process.env.DRILL_PORT || 8797;
const BASE = `http://localhost:${PORT}/learn/drill/index.html`;
const SCRATCHPAD = process.env.SCRATCHPAD || '/tmp/drill-verify';

(async () => {
  // The pre-installed Chromium exists in the Claude remote env; elsewhere
  // (CI) fall back to playwright's own downloaded browser.
  const launchOpts = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  };
  const preinstalled = process.env.DRILL_CHROMIUM || '/opt/pw-browsers/chromium';
  if (require('fs').existsSync(preinstalled)) launchOpts.executablePath = preinstalled;
  const browser = await chromium.launch(launchOpts);
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();

  // Spy on Web Audio API — intercept OscillatorNode.start() to verify sound fires
  await page.addInitScript(() => {
    window.__oscCount = 0;
    const _AC = window.AudioContext || window.webkitAudioContext;
    if (!_AC) return;
    class SpyAC extends _AC {
      createOscillator() {
        const osc = super.createOscillator();
        const orig = osc.start.bind(osc);
        osc.start = (...a) => { window.__oscCount++; return orig(...a); };
        return osc;
      }
    }
    window.AudioContext = SpyAC;
    window.webkitAudioContext = SpyAC;
  });

  const errors = [];
  page.on('pageerror',  err => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console',   msg => { if (msg.type() === 'error' && !msg.text().includes('fonts')) errors.push(msg.text()); });
  page.on('response',  res => { if (res.status() >= 400 && !res.url().includes('fonts')) errors.push(`HTTP ${res.status()} ${res.url()}`); });

  // External font fetches are known noise (no internet in the remote env),
  // but the proxy sometimes HANGS them instead of resetting, which stalls
  // networkidle until the goto timeout. Abort them deterministically —
  // the app never depends on them.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());

  // ── 1. App loads, home screen renders ──────────────────────────────────
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  const homeTitle = await page.textContent('h1.home-title').catch(() => null);
  if (!homeTitle?.includes('Quiz Defense')) throw new Error(`Home title not found: ${homeTitle}`);
  console.log('✅ Home screen renders:', homeTitle.trim());

  // ── 2. Filter drawer builds without crashing ───────────────────────────
  const filterContent = await page.$eval('#filter-drawer', el => el.innerHTML).catch(() => null);
  if (!filterContent?.includes('filter-panel')) throw new Error('Filter drawer empty — bindUI() likely broken');
  console.log('✅ Filter drawer built correctly');

  // ── 3. Navigate to TD battle ────────────────────────────────────────────
  await page.evaluate(() => {
    localStorage.setItem('qd_tutorial_v1', '1');
    localStorage.setItem('td_tutorial_v1', '1');
  });
  await page.click('#btn-play', { force: true });
  // The "Choose Your Map" screen was removed 2026-07-12 (one big run):
  // play now routes STRAIGHT to the Verdant region map. If a map-card
  // screen ever reappears here, that's a regression against that decision.
  await page.waitForTimeout(800);
  // Verdant renders the painted region map (region.png) with a linear
  // spine — Frontier Town ('start') is the sole available node on a fresh run.
  const regionImg = await page.$('#rvm-svg image');
  if (!regionImg) throw new Error('Painted region map <image> not found — renderVerdantWorldMap likely broken');
  const startNode = await page.$('.rvm-node.rvm-pulse[data-id="start"]');
  if (!startNode) throw new Error('Frontier Town start node not available on the region map');
  console.log('✅ Verdant region map renders with Frontier Town available');
  await startNode.click();
  await page.waitForTimeout(800);
  const playBtn = await page.$('.tdcp-btn-play');
  if (!playBtn) throw new Error('No TD play button found');
  await playBtn.click();
  await page.waitForTimeout(1500);
  console.log('✅ Navigated to TD battle (Frontier Town)');

  // ── 4. TD canvas and wave preview present ──────────────────────────────
  const canvas = await page.$('#td-canvas');
  if (!canvas) throw new Error('#td-canvas not found — initTDGame likely crashed');
  console.log('✅ TD canvas present');

  const actionsRow = await page.$('.td-actions-row');
  if (!actionsRow) throw new Error('.td-actions-row not found — HTML structure broken');
  console.log('✅ .td-actions-row present');

  const previewDisplay = await page.$eval('#td-wave-preview', el => el.style.display).catch(() => null);
  if (previewDisplay !== 'flex') throw new Error(`Wave preview display=${previewDisplay}, expected flex`);
  const previewText = await page.$eval('#td-wave-preview', el => el.textContent.trim());
  if (!previewText) throw new Error('Wave preview has no content');
  console.log('✅ Wave preview shows:', previewText.slice(0, 60));

  // ── 5. Wave button visible and enabled ─────────────────────────────────
  const waveBtnText = await page.$eval('#td-wave-btn', el => el.textContent.trim()).catch(() => null);
  if (!waveBtnText?.includes('Start Wave')) throw new Error(`Wave button text unexpected: ${waveBtnText}`);
  console.log('✅ Wave button:', waveBtnText);

  // ── 6. Radial build/manage menu + tower placement ──────────────────────
  // Tapping an empty buildable cell opens a radial menu of tower options
  // (no sell/upgrade — nothing to sell/upgrade yet); tapping the same cell
  // again once a tower sits there opens Upgrade + Sell instead.
  const cell = await page.evaluate(() => {
    const c = document.getElementById('td-canvas');
    const r = c.getBoundingClientRect();
    const sx = r.width / c.width, sy = r.height / c.height;
    const candidates = td.buildSlotSet
      ? [...td.buildSlotSet].map(k => k.split(',').map(Number))
      : Array.from({ length: TD_ROWS }, (_, row) => row)
          .flatMap(row => Array.from({ length: TD_COLS }, (_, col) => [col, row]));
    for (const [col, row] of candidates) {
      if (!td.pathSet.has(`${col},${row}`) && !td.towers.some(t => t.col === col && t.row === row)) {
        return { x: r.left + (col + 0.5) * td.cellSize * sx, y: r.top + (row + 0.5) * td.cellSize * sy };
      }
    }
    return null;
  });
  if (!cell) throw new Error('No valid cell found for tower placement');

  await page.mouse.click(cell.x, cell.y);
  await page.waitForTimeout(300);
  const buildBtns = await page.$$('.td-radial-btn');
  if (buildBtns.length === 0) throw new Error('Radial menu did not open after tapping an empty buildable cell');
  const buildIcons = await page.$$eval('.td-radial-btn .td-radial-icon', els => els.map(e => e.textContent));
  if (buildIcons.includes('💸') || buildIcons.includes('⬆️')) {
    throw new Error(`Sell/Upgrade shown on an empty slot before any tower is placed: ${buildIcons.join(',')}`);
  }
  console.log(`✅ Radial menu on empty slot shows ${buildBtns.length} build option(s), no Sell/Upgrade`);

  // Two-tap build flow: first tap arms (stat card + range ring), second builds
  await buildBtns[0].click({ force: true });
  await page.waitForTimeout(250);
  const infoCard = await page.$('.td-tower-info');
  if (!infoCard) throw new Error('Armed build option did not show the tower stat card');
  const armedPreview = await page.evaluate(() => !!td.rangePreview);
  if (!armedPreview) throw new Error('Armed build option did not set the range preview ring');
  console.log('✅ Build arm shows stat card + range preview');
  await buildBtns[0].click({ force: true }); // second tap builds
  await page.waitForTimeout(400);
  const towerPlaced = await page.evaluate(() => td.towers.length > 0);
  if (!towerPlaced) throw new Error('Second tap on armed build option did not place a tower');
  const oscAfterPlace = await page.evaluate(() => window.__oscCount);
  if (oscAfterPlace === 0) throw new Error('No oscillator notes fired on tower placement — audio silent');
  console.log(`✅ Tower placement audio: ${oscAfterPlace} oscillator note(s) fired`);

  await page.mouse.click(cell.x, cell.y); // same cell, now occupied
  await page.waitForTimeout(300);
  const manageIcons = await page.$$eval('.td-radial-btn .td-radial-icon', els => els.map(e => e.textContent));
  if (!manageIcons.includes('💸')) throw new Error(`Sell option missing on an occupied cell: ${manageIcons.join(',')}`);
  if (!manageIcons.includes('⬆️')) throw new Error(`Upgrade option missing on an occupied cell (should be < L3): ${manageIcons.join(',')}`);
  if (manageIcons.some(i => i !== '💸' && i !== '⬆️')) {
    throw new Error(`Build options leaked into the occupied-cell menu: ${manageIcons.join(',')}`);
  }
  console.log('✅ Radial menu on occupied cell shows only Upgrade + Sell');

  await page.mouse.click(cell.x, cell.y); // tap again to close before starting the wave
  await page.waitForTimeout(200);

  // ── 7. Waves are ungated and the game is fully quiz-free ──
  await page.click('#td-wave-btn');
  await page.waitForTimeout(600);
  const waveActive = await page.evaluate(() => td.waveActive);
  if (!waveActive) throw new Error('Wave did not start on button press');
  console.log('✅ Wave starts immediately (no question gate)');

  const quizBtnGone = (await page.$('#td-quiz-btn')) === null;
  if (!quizBtnGone) throw new Error('In-battle quiz button still present — game should be quiz-free');
  console.log('✅ No in-battle quiz button (game is standalone)');

  const previewAfter = await page.$eval('#td-wave-preview', el => el.style.display).catch(() => 'gone');
  if (previewAfter !== 'none') throw new Error(`Preview should be none during wave, got: ${previewAfter}`);
  console.log('✅ Wave preview hides once wave starts');

  const oscTotal = await page.evaluate(() => window.__oscCount);
  // place(1) + waveStart(3) = at least 4
  if (oscTotal < 4) throw new Error(`Too few oscillator notes fired (${oscTotal}) — audio engine broken`);
  console.log(`✅ Audio engine: ${oscTotal} total oscillator note(s) across placement + wave start`);

  // ── 9. SW registered ───────────────────────────────────────────────────
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return (reg?.active || reg?.waiting || reg?.installing)?.state || null;
  });
  if (!swState) throw new Error('Service worker not registered');
  console.log('✅ Service worker:', swState);

  // ── Screenshot ─────────────────────────────────────────────────────────
  await page.screenshot({ path: `${SCRATCHPAD}/verify-pass.png` });

  if (errors.length) {
    console.error('\n⚠️  Non-fatal errors detected:');
    errors.forEach(e => console.error(' ', e));
  }

  console.log('\n✅ PASS — all checks cleared');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('\n❌ FAIL:', err.message);
  process.exit(1);
});
JSEOF

EXIT=$?
echo ""
if [ $EXIT -eq 0 ]; then
  echo "▶ Screenshot saved: $SCRATCHPAD/verify-pass.png"
else
  echo "▶ Verification FAILED — do not push until fixed"
fi
exit $EXIT
