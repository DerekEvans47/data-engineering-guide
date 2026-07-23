'use strict';
// Quiz Defense — core: storage, XP/streaks/achievements, boot, home & profile UI.
// Standalone tower-defense game; no quiz or study/drill code (that lives in the
// separate learning app).
//
// Split from the old single-file drill.js (2026-07-14). The four files are
// classic scripts sharing the global scope, loaded in order by index.html:
//   drill-core.js -> drill-audio.js -> drill-world.js -> drill-td.js
// Top-level cross-file references only run from event handlers (boot is
// DOMContentLoaded), so declaration order across files is not load-bearing —
// but keep new top-level *executable* statements out of the earlier files if
// they call into later ones.

let APP_VERSION = '?';
(async () => {
  if (!('caches' in window)) return;
  try {
    const keys = await caches.keys();
    const hit = keys.find(k => k.startsWith('quiz-defense-game-'));
    if (!hit) return;
    APP_VERSION = hit.replace('quiz-defense-game-v', '');
    const el = document.querySelector('.home-version');
    if (el) el.textContent = el.textContent.replace(/^v[\w.?]+/, `v${APP_VERSION}`);
  } catch (_) {}
})();

// ── Storage keys ──────────────────────────────────────────────
const SEEN_KEY         = 'drill_seen_ids';
const FILTER_KEY       = 'drill_filter_parts';
const THEME_KEY        = 'drill_theme';
const COLORBLIND_KEY   = 'drill_colorblind';
const XP_KEY           = 'game_xp';
const STREAK_KEY       = 'game_streak';
const BEST_STREAK_KEY  = 'game_best_streak';
const ACHIEVEMENTS_KEY = 'game_achievements';
const DAILY_KEY        = 'daily_state';
const ACCURACY_KEY     = 'part_accuracy';
const GOLD_KEY         = 'game_gold';
const TUTORIAL_KEY     = 'qd_tutorial_v1';
const TD_TUTORIAL_KEY    = 'td_tutorial_v1';
const AUTOSAVE_KEY       = 'td_autosave';
const TD_INTER_KEY       = 'td_inter_v1';
const TD_REST_BONUS_KEY  = 'td_rest_bonus';
const TD_RUN_KEY         = 'td_run_v1';
const TD_MAPS_BEATEN_KEY = 'td_maps_beaten';
const MASTERY_KEY        = 'question_mastery';
const TD_RELICS_OWNED_KEY    = 'td_relics_owned';
const TD_RELICS_EQUIPPED_KEY = 'td_relics_equipped';
const INSTALL_BANNER_KEY     = 'qd_install_banner_dismissed';

// ── Storage layer (private-browsing-safe) ─────────────────────
const StorageManager = {
  get(key)       { try { return localStorage.getItem(key); }    catch { return null; } },
  set(key, value){ try { localStorage.setItem(key, value); }    catch { /* private browsing */ } },
  remove(key)    { try { localStorage.removeItem(key); }        catch { /* private browsing */ } },
};

const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

// ── Add to Home Screen ──────────────────────────────────────────
// Only a real fullscreen (no browser chrome, no pull-to-refresh) once
// launched standalone — a page in a normal browser tab can never hide
// the address bar itself. Android/Chrome exposes an installable-app
// prompt via this event; iOS Safari has no equivalent API, so it gets
// manual "tap Share" instructions instead (see showHome()).
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});
function isStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

const LETTERS = ['A','B','C','D'];

const PART_NAMES = {
  1:'Data Platform Foundation', 2:'Data Fundamentals',
  3:'Compute & Transformation',  4:'Analytics & Visualisation',
  5:'Delivery & Leadership',     6:'AI & Agentic Systems',
  7:'Product Management',        8:'Classical ML & Statistics',
  9:'Supply Chain Analytics'
};

const LEVELS = [
  { min: 0,     title: 'Data Intern',    icon: '🌱' },
  { min: 250,   title: 'Junior DE',      icon: '💾' },
  { min: 700,   title: 'Data Engineer',  icon: '⚙️' },
  { min: 1500,  title: 'Senior DE',      icon: '🔧' },
  { min: 3000,  title: 'Staff Engineer', icon: '🏗️' },
  { min: 5500,  title: 'Principal',      icon: '🎯' },
  { min: 9000,  title: 'Distinguished',  icon: '⭐' },
  { min: 15000, title: 'Data Architect', icon: '🌐' },
];

const ACHIEVEMENT_LIST = [
  { id: 'first_blood',   name: 'First Blood',    desc: 'First correct answer',               icon: '⚡' },
  { id: 'streak_5',      name: 'On a Roll',       desc: '5 correct answers in a row',         icon: '🔥' },
  { id: 'streak_10',     name: 'Unstoppable',     desc: '10 correct answers in a row',        icon: '💥' },
  { id: 'daily_done',    name: 'Daily Grind',     desc: 'Complete a daily challenge',         icon: '📅' },
  { id: 'perfect_part',  name: 'Flawless',        desc: '100% correct on any part',           icon: '💎' },
  { id: 'polymath',      name: 'Polymath',        desc: 'Answered from all 9 parts',          icon: '🎓' },
  { id: 'all_questions', name: 'Completionist',   desc: 'Answered all questions in Drill',    icon: '🏆' },
  { id: 'xp_500',        name: 'XP Rising',       desc: 'Earned 500 total XP',                icon: '💰' },
  { id: 'xp_3000',       name: 'XP Legend',       desc: 'Earned 3,000 total XP',              icon: '💫' },
  { id: 'td_win',        name: 'Defender',        desc: 'Survived all waves in Tower Defense', icon: '🛡️' },
];

// ── App state ──────────────────────────────────────────────────
let allQuestions    = [];
let mode            = 'study';
let studyPart       = null;
let dailyActive     = false;
let queue           = [];
let current         = null;
let answered        = false;
let sessionCorrect  = 0;
let sessionTotal    = 0;
let sessionXpEarned = 0;
let activeParts     = [];
let currentQNum     = 0;
let currentQTotal   = 0;
let colorBlindMode  = false;

// Game state
let xp           = 0;
let streak       = 0;
let bestStreak   = 0;
let achievements = new Set();
let partAccuracy = {};

// Meta gold (persists across runs; distinct from in-battle run gold)
let gold = 0;

// Cached DOM refs — populated in bindUI() and initTDGame() to avoid repeated
// getElementById calls in hot paths like tdUpdateHUD.
const EL = {};

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // World/map data is required for the game and is the only fatal dependency.
  try {
    await loadWorldData();
  } catch (_) {
    document.getElementById('app').innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;padding:2rem;text-align:center;font-family:system-ui">' +
      '<div style="font-size:2rem">📡</div>' +
      '<div style="color:#E6EDF3;font-size:1rem;font-weight:600">Could not load game data</div>' +
      '<div style="color:#8899bb;font-size:.85rem">Check your connection and try again.</div>' +
      '<button onclick="location.reload()" style="margin-top:.5rem;padding:.7rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer">&#x27F3; Retry</button>' +
      '</div>';
    return;
  }

  loadGameState();
  applyTheme(StorageManager.get(THEME_KEY) || 'dark');
  bindUI();
  showHome();
});

// ── Game state I/O ─────────────────────────────────────────────
function loadGameState() {
  xp            = parseInt(StorageManager.get(XP_KEY)         || '0', 10);
  streak        = parseInt(StorageManager.get(STREAK_KEY)      || '0', 10);
  bestStreak    = parseInt(StorageManager.get(BEST_STREAK_KEY) || '0', 10);
  gold          = parseInt(StorageManager.get(GOLD_KEY)        || '0', 10);
  achievements  = new Set(JSON.parse(StorageManager.get(ACHIEVEMENTS_KEY) || '[]'));
  partAccuracy  = JSON.parse(StorageManager.get(ACCURACY_KEY)  || '{}');

  // TD relic collection (EQ-4). Fresh installs get only the relics flagged
  // "starter" in config.json — the rest are found in run shops, so the
  // collection grows from play. Existing saves keep whatever they own.
  const savedOwned = StorageManager.get(TD_RELICS_OWNED_KEY);
  tdOwnedRelics = savedOwned != null ? new Set(JSON.parse(savedOwned)) : new Set(TD_RELICS.filter(r => r.starter).map(r => r.id));
  tdEquippedRelics = new Set(JSON.parse(StorageManager.get(TD_RELICS_EQUIPPED_KEY) || '[]'));
}

function saveGameState() {
  StorageManager.set(XP_KEY,           xp);
  StorageManager.set(STREAK_KEY,       streak);
  StorageManager.set(BEST_STREAK_KEY,  bestStreak);
  StorageManager.set(GOLD_KEY,         gold);
  StorageManager.set(ACHIEVEMENTS_KEY, JSON.stringify([...achievements]));
  StorageManager.set(ACCURACY_KEY,     JSON.stringify(partAccuracy));
  StorageManager.set(TD_RELICS_OWNED_KEY,    JSON.stringify([...tdOwnedRelics]));
  StorageManager.set(TD_RELICS_EQUIPPED_KEY, JSON.stringify([...tdEquippedRelics]));
}

// ── Gold helpers ───────────────────────────────────────────────
function earnGold(amount) {
  if (amount <= 0) return;
  gold += amount;
  saveGameState();
  refreshGoldDisplay();
}

function spendGold(amount) {
  if (gold < amount) return false;
  gold -= amount;
  saveGameState();
  refreshGoldDisplay();
  return true;
}

function refreshGoldDisplay() {
  document.querySelectorAll('.gold-badge').forEach(el => { el.textContent = `🪙 ${gold}`; });
  document.querySelectorAll('.shop-gold-live').forEach(el => { el.textContent = gold; });
}

// ── Level system ───────────────────────────────────────────────
function getLevel(totalXp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].min) idx = i;
    else break;
  }
  const lvl  = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? Math.min(1, (totalXp - lvl.min) / (next.min - lvl.min)) : 1;
  return { ...lvl, idx, next, progress };
}

function refreshTopBarStats() {
  const badge = document.getElementById('xp-badge');
  if (badge) { const l = getLevel(xp); badge.textContent = `${l.icon} ${xp.toLocaleString()}`; }
  const sb = document.getElementById('streak-badge');
  if (sb) {
    if (streak >= 2) { sb.textContent = `🔥 ${streak}`; sb.style.display = 'inline-flex'; }
    else sb.style.display = 'none';
  }
}

// ── Achievements ───────────────────────────────────────────────
function unlockIfNew(id) {
  if (achievements.has(id)) return;
  achievements.add(id); saveGameState();
  const a = ACHIEVEMENT_LIST.find(a => a.id === id);
  if (a) showAchievementToast(a);
}

function showAchievementToast(a) {
  const el = EL.achievementToast;
  el.innerHTML = `<span class="ach-icon">${a.icon}</span><div class="ach-text"><div class="ach-name">Achievement: ${a.name}</div><div class="ach-desc">${a.desc}</div></div>`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3400);
}

// ── Theme ──────────────────────────────────────────────────────
function applyTheme(t) { document.documentElement.dataset.theme = t; StorageManager.set(THEME_KEY, t); }
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  const icon = next === 'light' ? '🌙' : '☀️';
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = icon;
  const homeBtn = document.getElementById('home-theme-btn');
  if (homeBtn) homeBtn.textContent = icon;
}
function themeBtn() {
  return `<button class="btn-theme" id="btn-theme">${document.documentElement.dataset.theme !== 'light' ? '☀️' : '🌙'}</button>`;
}

// ── Color-blind mode (U-4) ───────────────────────────────────────
function toggleColorBlindMode() {
  colorBlindMode = !colorBlindMode;
  StorageManager.set(COLORBLIND_KEY, colorBlindMode ? '1' : '0');
  const btn = document.getElementById('btn-colorblind');
  if (btn) btn.textContent = `🎨 Tower Patterns: ${colorBlindMode ? 'On' : 'Off'}`;
}
function bindThemeBtn() { document.getElementById('btn-theme')?.addEventListener('click', toggleTheme); }

// ── Game stat badges ───────────────────────────────────────────
function gameBadges() {
  const l = getLevel(xp);
  const sd = streak >= 2 ? 'inline-flex' : 'none';
  return `<span class="streak-badge" id="streak-badge" style="display:${sd}">🔥 ${streak}</span>
    <button class="xp-badge" id="xp-badge">${l.icon} ${xp.toLocaleString()}</button>`;
}
function bindXpBadge() { document.getElementById('xp-badge')?.addEventListener('click', openProfile); }

// ── Top bar ────────────────────────────────────────────────────
// Back/relic/help buttons are inlined directly into each TD screen's own
// header row (map-select-header, region-map-header, ...) instead of a
// separate persistent bar stacked above it — one header band per screen,
// not two. This just wires the shared button ids up once markup is in.
function bindTdHeaderActions(onBack) {
  document.getElementById('td-header-back')?.addEventListener('click', onBack || showHome);
  document.getElementById('td-header-inventory')?.addEventListener('click', showInventoryPanel);
  document.getElementById('td-header-help')?.addEventListener('click', () => showTutorial(() => {}));
}

// Every game screen (home, map select, world map, battle) builds its own
// contextual header inline, so the shared top bar is never shown — it stays
// hidden here instead of stacking a second, redundant chrome band above the UI.
const TD_TOPBAR_STATES = new Set(['home', 'td-world', 'tower', 'td-level']);

function setTopBar(state, extra = {}) {
  const bar = document.getElementById('top-bar');
  if (TD_TOPBAR_STATES.has(state)) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  // Game screens (home, world map, battle) build their own inline headers,
  // so the shared top bar stays hidden for every state the game uses.
  bar.style.display = 'none';
  bar.innerHTML = '';
}

// ── Profile sheet ──────────────────────────────────────────────
function openProfile() {
  const sheet = EL.profileSheet;
  const l     = getLevel(xp);
  const nextXp = l.next ? (l.next.min - xp).toLocaleString() : null;
  const pct    = Math.round(l.progress * 100);

  const relicHTML = TD_RELICS.map(r => `
    <div class="ach-cell ${tdOwnedRelics.has(r.id) ? 'unlocked' : 'locked'}" title="${r.desc}">
      <span class="ach-cell-icon">${tdRelicIconHtml(r)}</span>
      <span class="ach-cell-name">${r.name}</span>
    </div>`).join('');

  const achHTML = ACHIEVEMENT_LIST.map(a => `
    <div class="ach-cell ${achievements.has(a.id) ? 'unlocked' : 'locked'}" title="${a.desc}">
      <span class="ach-cell-icon">${a.icon}</span>
      <span class="ach-cell-name">${a.name}</span>
    </div>`).join('');

  sheet.innerHTML = `
    <div class="profile-backdrop" id="profile-backdrop"></div>
    <div class="profile-panel">
      <div class="profile-header">
        <div class="profile-level-icon">${l.icon}</div>
        <div>
          <div class="profile-level-title">${l.title}</div>
          <div class="profile-xp">${xp.toLocaleString()} XP${nextXp ? ` · ${nextXp} to next level` : ' · Max level'}</div>
        </div>
        <button class="btn-close-profile" id="btn-close-profile">✕</button>
      </div>
      <div class="profile-progress-bar"><div class="profile-progress-fill" style="width:${pct}%"></div></div>
      <div class="profile-stats">
        <div class="stat-cell"><div class="stat-val">🔥 ${bestStreak}</div><div class="stat-label">Best Streak</div></div>
        <div class="stat-cell"><div class="stat-val">${tdLoadMapBeaten().length}/3</div><div class="stat-label">Maps Cleared</div></div>
        <div class="stat-cell"><div class="stat-val">🪙 ${gold}</div><div class="stat-label">Gold</div></div>
        <div class="stat-cell"><div class="stat-val">${tdOwnedRelics.size}/${TD_RELICS.length}</div><div class="stat-label">Relics</div></div>
      </div>
      <div class="ach-grid-title">Relics</div>
      <div class="ach-grid">${relicHTML}</div>
      <div class="ach-grid-title" style="margin-top:.9rem">Achievements</div>
      <div class="ach-grid">${achHTML}</div>
      <div class="profile-save-row">
        <button class="profile-save-btn" id="btn-colorblind">🎨 Tower Patterns: ${colorBlindMode ? 'On' : 'Off'}</button>
      </div>
      <div class="profile-save-row">
        <button class="profile-save-btn" id="btn-export-save">⬇ Export Save</button>
        <button class="profile-save-btn" id="btn-import-save">⬆ Import Save</button>
      </div>
    </div>`;

  sheet.style.display = 'flex';
  requestAnimationFrame(() => sheet.classList.add('open'));
  document.getElementById('profile-backdrop').addEventListener('click', closeProfile);
  document.getElementById('btn-close-profile').addEventListener('click', closeProfile);
  document.getElementById('btn-colorblind').addEventListener('click', toggleColorBlindMode);
  document.getElementById('btn-export-save').addEventListener('click', exportSave);
  document.getElementById('btn-import-save').addEventListener('click', importSave);
}

function closeProfile() {
  const sheet = EL.profileSheet;
  sheet.classList.remove('open');
  setTimeout(() => { sheet.style.display = 'none'; }, 300);
}

function exportSave() {
  const EXPORT_KEYS = [
    SEEN_KEY, FILTER_KEY, THEME_KEY, XP_KEY, STREAK_KEY, BEST_STREAK_KEY,
    ACHIEVEMENTS_KEY, DAILY_KEY, ACCURACY_KEY,
    GOLD_KEY, TUTORIAL_KEY, AUTOSAVE_KEY, TD_STARS_KEY, TD_INTER_KEY, TD_REST_BONUS_KEY,
    TD_RUN_KEY, TD_MAPS_BEATEN_KEY, MASTERY_KEY,
    TD_RELICS_OWNED_KEY, TD_RELICS_EQUIPPED_KEY,
  ];
  for (let p = 1; p <= 9; p++) EXPORT_KEYS.push('study_seen_p' + p);
  const data = {};
  for (const k of EXPORT_KEYS) {
    const v = StorageManager.get(k);
    if (v !== null) data[k] = v;
  }
  const blob = new Blob([JSON.stringify({ version: 1, data })], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'quiz-defense-save.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importSave() {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', function() {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const obj = JSON.parse(e.target.result);
        if (!obj || !obj.data || typeof obj.data !== 'object') throw new Error('bad');
        for (const k of Object.keys(obj.data)) StorageManager.set(k, obj.data[k]);
        closeProfile();
        location.reload();
      } catch (_) {
        alert('Import failed: invalid save file.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// ── Home screen ────────────────────────────────────────────────
function showHome() {
  if (td && td.running) {
    cancelAnimationFrame(td.animFrame);
    if (td.autoSaveInterval) { clearInterval(td.autoSaveInterval); }
    td.running = false;
    td = null;
  }
  mapMusic.stop();
  mode = 'home'; dailyActive = false; studyPart = null;
  answered = false;
  EL.cardArea.style.display = 'none';
  EL.bottomBar.style.display = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  EL.app.dataset.mode = 'home';

  const beaten      = tdLoadMapBeaten();
  const existRunRaw = tdLoadRun();
  const mapsCleared = beaten.length;
  const runActive   = isRunCompatible(existRunRaw, existRunRaw && existRunRaw.mapId);
  const l = getLevel(xp);

  setTopBar('home');
  EL.contentArea.innerHTML = `
    <div class="home-screen">
      <button class="home-theme-btn" id="home-theme-btn">${document.documentElement.dataset.theme !== 'light' ? '☀️' : '🌙'}</button>
      <button class="home-theme-btn" id="music-lab-btn" style="right:calc(2.9rem + env(safe-area-inset-right))" title="Music Lab (temp)">🎵</button>
      <div class="home-hero">
        <h1 class="home-title">Quiz Defense</h1>
        <span class="home-subtitle">Data Engineering · Tower Defense</span>
      </div>
      <div class="home-bottom">
        <div class="home-stats">
          <div class="home-stat" id="home-stat-xp">⚡ ${xp.toLocaleString()} XP</div>
          <div class="home-stat">🔥 ${streak} streak</div>
          <div class="home-stat">🪙 ${gold}</div>
        </div>
        <div class="home-progress-row">
          <div class="home-progress-cell">
            <div class="home-progress-val">${mapsCleared} <span class="home-progress-denom">/ 3</span></div>
            <div class="home-progress-label">Maps cleared</div>
          </div>
          <div class="home-progress-divider"></div>
          <div class="home-progress-cell">
            <div class="home-progress-val">${l.icon} <span class="home-progress-rank">${l.title}</span></div>
            <div class="home-progress-label">Rank</div>
          </div>
        </div>
        <div class="home-menu">
          <button class="home-card home-card-primary" id="btn-play">
            <span class="home-card-icon">▶</span>
            <div class="home-card-text">
              <span class="home-card-title">${mapsCleared === 0 && !runActive ? 'Start Game' : runActive ? 'Continue Run' : 'New Run'}</span>
              <span class="home-card-desc">Tower Defense · ${mapsCleared} / 3 maps cleared</span>
            </div>
            <span class="home-card-arrow">›</span>
          </button>
          ${runActive ? `
          <button class="home-card home-card-secondary" id="btn-new-run">
            <span class="home-card-icon">↺</span>
            <div class="home-card-text">
              <span class="home-card-title">New Run</span>
              <span class="home-card-desc">Abandon progress and start over</span>
            </div>
            <span class="home-card-arrow">›</span>
          </button>` : ''}
          <button class="home-card home-card-secondary" id="btn-how-to-play">
            <span class="home-card-icon">📖</span>
            <div class="home-card-text">
              <span class="home-card-title">How to Play</span>
              <span class="home-card-desc">Learn the rules</span>
            </div>
            <span class="home-card-arrow">›</span>
          </button>
          ${TD_CREATOR_MODE ? `
          <button class="home-card home-card-secondary home-card-dev" id="btn-config">
            <span class="home-card-icon">⚙️</span>
            <div class="home-card-text">
              <span class="home-card-title">Configuration</span>
              <span class="home-card-desc">Edit relics — values, effects, rarity (Creator Mode)</span>
            </div>
            <span class="home-card-arrow">›</span>
          </button>` : ''}
        </div>
        <div class="install-banner" id="install-banner" style="display:none">
          <span class="install-banner-text" id="install-banner-text"></span>
          <button class="install-banner-btn" id="install-banner-btn" style="display:none">Install</button>
          <button class="install-banner-close" id="install-banner-close" aria-label="Dismiss">✕</button>
        </div>
      </div>
      <div class="home-version" id="home-version">v${APP_VERSION}</div>
    </div>`;

  document.getElementById('btn-play').addEventListener('click', () => {
    mode = 'tower';
    EL.app.dataset.mode = 'tower';
    showTDWorldMap();
  });
  const newRunBtn = document.getElementById('btn-new-run');
  if (newRunBtn) newRunBtn.addEventListener('click', () => {
    if (!confirm('Start a new run? Current run progress (cleared nodes, relics, run gold) is abandoned. XP and rank are kept.')) return;
    tdClearRun();
    mode = 'tower';
    EL.app.dataset.mode = 'tower';
    showTDWorldMap();
  });
  document.getElementById('btn-how-to-play').addEventListener('click', () => {
    showTutorial(() => {});
  });
  document.getElementById('home-stat-xp').addEventListener('click', openProfile);
  // Force-update escape hatch: tapping the version badge nukes the service
  // worker + every cache and reloads from the network. For the "my bookmark
  // is stuck on an old version" case where the normal SW update cycle
  // (two reloads) doesn't kick in.
  document.getElementById('home-version').addEventListener('click', async () => {
    if (!confirm(`You're on v${APP_VERSION}. Force-update? This clears the offline cache and reloads the latest version from the network.`)) return;
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (_) { /* still reload — a plain reload is better than nothing */ }
    location.reload();
  });
  document.getElementById('home-theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('music-lab-btn').addEventListener('click', showMusicLab);
  document.getElementById('btn-config')?.addEventListener('click', tdOpenRelicEditor);
  menuMusic.start();
  setupInstallBanner();

  // Live audio-state badge — shows what the AudioContext is actually doing.
  // Tapping anywhere updates it immediately; auto-clears when leaving home.
  const _vEl = document.querySelector('.home-version');
  const _hasAC = typeof AudioContext !== 'undefined' ? 'AC' : typeof webkitAudioContext !== 'undefined' ? 'wAC' : 'NONE';
  function _updateAudioBadge() {
    if (!_vEl || !_vEl.isConnected) return;
    const ctx = tdAudio.ctx;
    const state = ctx ? ctx.state : 'no ctx';
    _vEl.textContent = `v${APP_VERSION} · ${_hasAC} · ${state}`;
  }
  _updateAudioBadge();
  const _audioStatusTimer = setInterval(_updateAudioBadge, 600);
  document.addEventListener('touchstart', _updateAudioBadge, { passive: true });
  // Attach cleanup to a property so it can be found on re-render
  _vEl._cleanup = () => {
    clearInterval(_audioStatusTimer);
    document.removeEventListener('touchstart', _updateAudioBadge);
  };
  // Clean up previous home render's listeners if any
  const _prev = document.querySelector('.home-version[data-ac-cleanup]');
  if (_prev && _prev._cleanup) _prev._cleanup();
}

// Nudge players toward "Add to Home Screen" — the only way to get a real
// fullscreen (no address bar, no pull-to-refresh) since a page in a normal
// browser tab can never hide the browser's own chrome. Skipped entirely if
// already running standalone, previously dismissed, or on a platform with
// no concrete install action to offer (desktop browsers, etc).
function setupInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (!banner || isStandalone() || StorageManager.get(INSTALL_BANNER_KEY)) return;

  const textEl = document.getElementById('install-banner-text');
  const btnEl  = document.getElementById('install-banner-btn');

  if (isIOS()) {
    textEl.textContent = '📲 Add to Home Screen for fullscreen — tap Share, then "Add to Home Screen"';
  } else if (deferredInstallPrompt) {
    textEl.textContent = '📲 Install for fullscreen — no browser bar, no pull-to-refresh';
    btnEl.style.display = 'inline-flex';
    btnEl.addEventListener('click', async () => {
      const prompt = deferredInstallPrompt;
      if (!prompt) return;
      deferredInstallPrompt = null;
      prompt.prompt();
      await prompt.userChoice;
      StorageManager.set(INSTALL_BANNER_KEY, '1');
      banner.remove();
    });
  } else {
    return; // no actionable install path on this platform — don't nag
  }

  banner.style.display = 'flex';
  document.getElementById('install-banner-close').addEventListener('click', () => {
    StorageManager.set(INSTALL_BANNER_KEY, '1');
    banner.remove();
  });
}

// ── UI bindings ────────────────────────────────────────────────
function bindUI() {
  // Cache static DOM refs once — avoids repeated lookups in hot paths
  EL.app              = document.getElementById('app');
  EL.contentArea      = document.getElementById('content-area');
  EL.completeScreen   = document.getElementById('complete-screen');
  EL.progressWrap     = document.getElementById('progress-wrap');
  EL.cardArea         = document.getElementById('card-area');
  EL.bottomBar        = document.getElementById('bottom-bar');
  EL.achievementToast = document.getElementById('achievement-toast');
  EL.profileSheet     = document.getElementById('profile-sheet');
}

// ══════════════════════════════════════════════════════════════
//  TOWER DEFENSE GAME
// ══════════════════════════════════════════════════════════════

// Default portrait grid; painted battle maps (frontierTownLevelDef) override
// these per-level at initTDGame time via levelDef.gridCols/gridRows.
const TD_DEFAULT_COLS = 9, TD_DEFAULT_ROWS = 10;

// Waves start immediately with no question gate — the tower defense stands
// entirely on its own (kill rewards fund the economy).
let TD_COLS = TD_DEFAULT_COLS, TD_ROWS = TD_DEFAULT_ROWS;
const TD_STARS_KEY = 'td_stars_v1';
