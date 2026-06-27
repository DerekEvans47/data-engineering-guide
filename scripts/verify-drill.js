/**
 * Playwright end-to-end verification for the Quiz Defense drill app.
 *
 * Usage:
 *   python3 -m http.server 8765 --directory . &
 *   node scripts/verify-drill.js [--port 8765] [--shots /path/to/screenshots]
 *   pkill -f "python3 -m http.server 8765"
 *
 * Exit 0 = PASS, Exit 1 = FAIL. Screenshots saved to --shots dir (default: /tmp/drill-verify).
 *
 * Requires playwright npm package:
 *   npm install playwright --prefix /tmp/pw-install
 * Chromium is pre-installed at /opt/pw-browsers/chromium in the remote environment.
 */

const args    = process.argv.slice(2);
const port    = args.includes('--port')  ? args[args.indexOf('--port')  + 1] : '8765';
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : '/tmp/drill-verify';
const BASE    = `http://localhost:${port}/learn/drill/index.html`;

// Try loading playwright from multiple candidate paths
let playwright;
const candidates = [
  '/tmp/pw-install/node_modules/playwright',
  '/tmp/pw-test/node_modules/playwright',
  'playwright',
];
for (const p of candidates) {
  try { playwright = require(p); break; } catch {}
}
if (!playwright) {
  console.error('playwright not found. Run: npm install playwright --prefix /tmp/pw-install');
  process.exit(1);
}

require('fs').mkdirSync(shotsDir, { recursive: true });

(async () => {
  const { chromium } = playwright;
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Fresh context — no localStorage, simulates a brand new user
  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  let failures = 0;
  function check(label, value, expected = true) {
    const ok = expected === true ? !!value : value === expected;
    console.log(`  ${ok ? '✅' : '❌'} ${label}${!ok ? ` (got: ${JSON.stringify(value)})` : ''}`);
    if (!ok) failures++;
    return ok;
  }

  async function shot(name) {
    await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: false });
  }

  // ── 1. Home screen ────────────────────────────────────────────
  console.log('\n── LOAD');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await shot('01-home');
  check('Home title = "Quiz Defense"',  await page.textContent('.home-title').catch(() => ''), 'Quiz Defense');
  check('4 home cards rendered',        (await page.$$('.home-card')).length, 4);
  check('No JS errors on load',         jsErrors.length, 0);

  // ── 2. Play → tutorial ────────────────────────────────────────
  console.log('\n── PLAY');
  jsErrors.length = 0;
  await page.click('[data-goto="tower"]');
  await page.waitForTimeout(1200);
  await shot('02-tutorial');
  check('Tutorial overlay shown',       await page.$('.tutorial-overlay') !== null);
  check('No JS errors entering Play',   jsErrors.length, 0);

  // ── 3. Dismiss tutorial → world map ──────────────────────────
  console.log('\n── WORLD MAP');
  await page.click('#btn-tutorial-ok');
  await page.waitForTimeout(800);
  await shot('03-worldmap');
  check('World map SVG renders',        await page.$('#tdm-svg') !== null);
  check('9 level nodes present',        (await page.$$('.tdm-map-node')).length, 9);
  check('Exactly 1 node unlocked',      (await page.$$('.tdm-map-node:not(.locked)')).length, 1);

  // ── 4. Enter level 1 ─────────────────────────────────────────
  console.log('\n── LEVEL');
  jsErrors.length = 0;
  await page.click('.tdm-map-node:not(.locked)');
  await page.waitForTimeout(2000);
  await shot('04-level');
  check('Game canvas renders',          await page.$('canvas') !== null);
  check('Back-to-map button exists',    await page.$('#btn-back-map') !== null);
  const bbBottom = await page.$eval('.bottom-bar', el => window.getComputedStyle(el).bottom).catch(() => 'N/A');
  check('Bottom-bar not auto (CSS var)',  bbBottom !== 'auto' && bbBottom !== '');
  check('No JS errors in level',         jsErrors.length, 0);

  // ── 5. Navigation: level → map → home ────────────────────────
  console.log('\n── NAVIGATION');
  await page.click('#btn-back-map');
  await page.waitForTimeout(600);
  check('Back to world map',            await page.$('#tdm-svg') !== null);
  await page.click('#btn-back-home');
  await page.waitForTimeout(600);
  await shot('05-home-return');
  check('Back to home from world map',  await page.$('.home-title') !== null);

  // ── 6. Study ─────────────────────────────────────────────────
  console.log('\n── STUDY');
  jsErrors.length = 0;
  await page.click('[data-goto="study"]');
  await page.waitForTimeout(1000);
  await shot('06-study');
  check('Study part grid renders',      await page.$('.part-grid') !== null);
  check('Study back button present',    await page.$('#btn-back-home') !== null);
  check('No JS errors in Study',        jsErrors.length, 0);
  await page.click('#btn-back-home');
  await page.waitForTimeout(500);

  // ── 7. Drill ─────────────────────────────────────────────────
  console.log('\n── DRILL');
  jsErrors.length = 0;
  await page.click('[data-goto="drill"]');
  await page.waitForTimeout(1000);
  await shot('07-drill');
  check('Drill question card renders',  await page.$('.q-card') !== null);
  check('Drill back button present',    await page.$('#btn-back-home') !== null);
  check('No JS errors in Drill',        jsErrors.length, 0);

  // ── 8. SW cache version ───────────────────────────────────────
  console.log('\n── SERVICE WORKER');
  const swText   = await page.evaluate(() => fetch('./sw.js').then(r => r.text()));
  const swMatch  = swText.match(/const CACHE\s*=\s*'([^']+)'/);
  const swVer    = swMatch ? swMatch[1] : 'not found';
  console.log(`  SW cache string: ${swVer}`);
  check('SW cache string present',      !!swMatch);
  // Confirm SW is registered
  const swReg = await page.evaluate(() =>
    navigator.serviceWorker.getRegistrations().then(r => r.length > 0)
  ).catch(() => false);
  check('Service worker registered',    swReg);

  // ── Result ────────────────────────────────────────────────────
  console.log(`\n── RESULT`);
  if (failures === 0) {
    console.log(`  PASS — all checks green  (SW: ${swVer})`);
    console.log(`  Screenshots: ${shotsDir}/`);
  } else {
    console.log(`  FAIL — ${failures} check(s) failed`);
    console.log(`  Screenshots: ${shotsDir}/`);
  }

  await browser.close();
  process.exit(failures > 0 ? 1 : 0);
})().catch(e => {
  console.error('\nFATAL:', e.message);
  process.exit(1);
});
