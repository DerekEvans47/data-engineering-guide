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
SCRATCHPAD="${TMPDIR:-/tmp}/drill-verify-$$"
mkdir -p "$SCRATCHPAD"

# ── Start local HTTP server ────────────────────────────────────────────────
PORT=8797
python3 -m http.server "$PORT" --directory "$REPO_ROOT" \
  > "$SCRATCHPAD/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; rm -rf "$SCRATCHPAD"' EXIT
sleep 1

# ── Playwright test ────────────────────────────────────────────────────────
node - <<'JSEOF'
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PORT = process.env.DRILL_PORT || 8797;
const BASE = `http://localhost:${PORT}/learn/drill/index.html`;
const SCRATCHPAD = process.env.SCRATCHPAD || '/tmp/drill-verify';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror',  err => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console',   msg => { if (msg.type() === 'error' && !msg.text().includes('fonts')) errors.push(msg.text()); });
  page.on('response',  res => { if (res.status() >= 400 && !res.url().includes('fonts')) errors.push(`HTTP ${res.status()} ${res.url()}`); });

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
  await page.waitForTimeout(500);
  const mapCard = await page.$('.map-card:not(.map-card-locked)');
  if (!mapCard) throw new Error('No unlocked map card found');
  await mapCard.click();
  await page.waitForTimeout(800);
  const runNodes = await page.$$('.rn-available');
  if (runNodes.length < 3) throw new Error(`Expected 3 rn-available nodes, found ${runNodes.length} — stuck-active bug or missing nodes`);
  console.log('✅ All 3 starting nodes available:', runNodes.length);
  const runNode = runNodes[0];
  await runNode.click();
  await page.waitForTimeout(800);
  const playBtn = await page.$('.tdcp-btn-play');
  if (!playBtn) throw new Error('No TD play button found');
  await playBtn.click();
  await page.waitForTimeout(1500);
  console.log('✅ Navigated to TD battle');

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

  // ── 6. Quiz opens on wave start; preview hides after answer ────────────
  await page.click('#td-wave-btn');
  await page.waitForTimeout(600);
  const quizOpen = await page.$eval('.td-q-overlay', el => el.classList.contains('open')).catch(() => false);
  if (!quizOpen) throw new Error('Quiz overlay did not open on wave start');
  console.log('✅ Quiz overlay opens on wave start');

  const firstOpt = await page.$('.td-opt');
  if (firstOpt) {
    await firstOpt.click({ force: true });
    await page.waitForTimeout(800);
    const contBtn = await page.$('#td-q-cont');
    if (contBtn) await contBtn.click({ force: true });
    await page.waitForTimeout(800);
  }
  const previewAfter = await page.$eval('#td-wave-preview', el => el.style.display).catch(() => 'gone');
  if (previewAfter !== 'none') throw new Error(`Preview should be none during wave, got: ${previewAfter}`);
  console.log('✅ Wave preview hides once wave starts');

  // ── 7. SW registered ───────────────────────────────────────────────────
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
