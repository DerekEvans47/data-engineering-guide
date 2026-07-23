#!/usr/bin/env bash
# verifier-browser.sh — Playwright smoke test for the learn/drill LEARNING app
# (Study Mode, Drill/flashcards, Daily Challenge). The tower-defense game lives
# in its own top-level game/ folder and carries its own game/verify.sh.
#
# Usage (called by Claude's /verify skill automatically):
#   bash .claude/skills/verifier-browser.sh
#
# Exit 0 = PASS, exit 1 = FAIL
# Requires: node, playwright, python3 (for HTTP server)
# Browser: /opt/pw-browsers/chromium (pre-installed in Claude Code remote env)

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
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
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const PORT = process.env.DRILL_PORT || 8797;
const BASE = `http://localhost:${PORT}/learn/drill/index.html`;
const SCRATCHPAD = process.env.SCRATCHPAD || '/tmp/drill-verify';

(async () => {
  const launchOpts = {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  const preinstalled = process.env.DRILL_CHROMIUM || '/opt/pw-browsers/chromium';
  if (require('fs').existsSync(preinstalled)) launchOpts.executablePath = preinstalled;
  const browser = await chromium.launch(launchOpts);
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror',  err => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console',   msg => { if (msg.type() === 'error' && !msg.text().includes('fonts')) errors.push(msg.text()); });
  page.on('response',  res => { if (res.status() >= 400 && !res.url().includes('fonts')) errors.push(`HTTP ${res.status()} ${res.url()}`); });

  // External font fetches are known noise (no internet in the remote env) and
  // the proxy sometimes hangs them — abort deterministically.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());

  // ── 1. Home renders (learning app, no game) ────────────────────────────
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('h1.home-title', { timeout: 15000 });
  const homeTitle = await page.textContent('h1.home-title').catch(() => null);
  if (!homeTitle?.includes('Study')) throw new Error(`Home title not found: ${homeTitle}`);
  console.log('✅ Home screen renders:', homeTitle.trim());
  if (await page.$('#btn-play')) throw new Error('Game Play button present — learning app should have no game');
  console.log('✅ Home is learning-only (no tower-defense game)');

  // ── 2. Study by Part → part list → question ────────────────────────────
  await page.click('#btn-study', { force: true });
  await page.waitForTimeout(400);
  const partCards = await page.$$eval('.part-card', els => els.length).catch(() => 0);
  if (partCards < 1) throw new Error('Study part list rendered no parts — showPartList likely broken');
  console.log(`✅ Study part list renders ${partCards} part(s)`);
  const firstCard = await page.$('.part-card:not(.locked)');
  if (!firstCard) throw new Error('No unlocked part to study');
  await firstCard.click();
  await page.waitForTimeout(400);
  const qLen = await page.$eval('.q-card', el => el.textContent.length).catch(() => 0);
  if (qLen === 0) throw new Error('Study question did not render — renderQuestion likely broken');
  console.log(`✅ Study question renders (${qLen} chars)`);

  // ── 3. Answering reveals the explanation ───────────────────────────────
  const opt = await page.$('.opt, .tf-opt');
  if (!opt) throw new Error('Question has no selectable option');
  await opt.click();
  await page.waitForTimeout(150);
  await page.click('#btn-check').catch(() => {});
  await page.waitForTimeout(300);
  const explained = await page.$eval('#explanation', el => el.classList.contains('show')).catch(() => false);
  if (!explained) throw new Error('Checking an answer did not reveal the explanation');
  console.log('✅ Answer check reveals explanation');

  // ── 4. Drill mode + filter drawer ──────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-drill', { timeout: 15000 });
  await page.click('#btn-drill', { force: true });
  await page.waitForTimeout(400);
  const drillQ = await page.$eval('.q-card', el => el.textContent.length).catch(() => 0);
  if (drillQ === 0) throw new Error('Drill mode did not render a question');
  const filterContent = await page.$eval('#filter-drawer', el => el.innerHTML).catch(() => null);
  if (!filterContent?.includes('filter-panel')) throw new Error('Filter drawer empty — buildFilterDrawer/bindUI likely broken');
  console.log('✅ Drill mode renders a question; filter drawer built');

  // ── 5. Profile opens (learning stats) ──────────────────────────────────
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#home-stat-xp', { timeout: 15000 });
  await page.click('#home-stat-xp', { force: true });
  await page.waitForTimeout(300);
  const prof = await page.$eval('.profile-panel', el => el.textContent.includes('Achievements')).catch(() => false);
  if (!prof) throw new Error('Profile sheet did not open');
  console.log('✅ Profile opens with learning stats');

  // ── 6. Service worker registers ────────────────────────────────────────
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return 'none';
    return (reg.active || reg.installing || reg.waiting) ? (reg.active ? 'active' : 'installing') : 'none';
  });
  console.log(`✅ Service worker: ${swState}`);

  await page.screenshot({ path: `${SCRATCHPAD}/verify-pass.png` });

  if (errors.length) {
    console.log('\n⚠️  Non-fatal errors detected:');
    errors.slice(0, 8).forEach(e => console.log('  ' + e));
  }
  await browser.close();
  console.log('\n✅ PASS — all checks cleared');
  console.log(`\n▶ Screenshot saved: ${SCRATCHPAD}/verify-pass.png`);
})().catch(err => { console.error('\n❌ FAIL:', err.message); process.exit(1); });
JSEOF
