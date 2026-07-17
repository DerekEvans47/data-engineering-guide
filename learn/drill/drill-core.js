'use strict';
// Quiz Defense — core: storage, XP/streaks/achievements, quiz flow, boot,
// home/profile/filter UI.
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
    const hit = keys.find(k => k.startsWith('de-drill-'));
    if (!hit) return;
    APP_VERSION = hit.replace('de-drill-v', '');
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

// ╔══════════════════════════════════════════════════════════════
//  QUESTION LOGIC MODULE
//  validateQuestionBank · shuffle · queue · mastery · accuracy
// ╚══════════════════════════════════════════════════════════════

// ── Question-bank schema validation ───────────────────────────
function validateQuestionBank(questions) {
  if (!Array.isArray(questions)) {
    console.warn('[QB] question-bank.json is not an array — using empty bank');
    return [];
  }
  const valid = [];
  for (const q of questions) {
    const missing = [];
    if (typeof q.num       !== 'number')  missing.push('num');
    if (typeof q.part      !== 'number')  missing.push('part');
    if (typeof q.stem      !== 'string')  missing.push('stem');
    if (q.type !== 'mc' && q.type !== 'tf') missing.push('type(mc|tf)');
    if (q.type === 'mc' && (!Array.isArray(q.options) || q.options.length < 2)) missing.push('options');
    if (q.correct == null) missing.push('correct');
    if (missing.length) {
      console.warn(`[QB] Skipping malformed question num=${q.num ?? '?'}: missing ${missing.join(', ')}`);
    } else {
      valid.push(q);
    }
  }
  if (valid.length < questions.length) {
    console.warn(`[QB] Loaded ${valid.length}/${questions.length} questions (${questions.length - valid.length} skipped)`);
  }
  return valid;
}

// ── Question shuffle helpers ───────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function seededShuffle(arr, seed) {
  const a = [...arr]; let s = Math.abs(seed) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7FFFFFFF;
    const j = Math.abs(s) % (i + 1); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Session queue ──────────────────────────────────────────────
function buildDrillQueue() {
  const seen = new Set(JSON.parse(StorageManager.get(SEEN_KEY) || '[]'));
  queue = shuffle(allQuestions.filter(q => activeParts.includes(q.part) && !seen.has(q.id)));
  currentQNum = 0; currentQTotal = queue.length; sessionXpEarned = 0;
}
function markDrillSeen(id) {
  const seen = new Set(JSON.parse(StorageManager.get(SEEN_KEY) || '[]'));
  seen.add(id); StorageManager.set(SEEN_KEY, JSON.stringify([...seen]));
}
function resetDrillSeen() { StorageManager.remove(SEEN_KEY); }

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // World/map data loads in parallel with the question bank; both are
    // required, so either failing lands on the same retry screen below.
    const worldReady = loadWorldData();
    const res = await fetch('../../content/question-bank.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const questions = Array.isArray(raw) ? raw : (raw.questions || raw);
    allQuestions = validateQuestionBank(questions);
    if (!Array.isArray(raw) && raw.version) {
      const QB_VER_KEY = 'qb_version';
      const prevVer = StorageManager.get(QB_VER_KEY);
      if (prevVer !== raw.version) StorageManager.set(QB_VER_KEY, raw.version);
    }
    await worldReady;
  } catch (_) {
    document.getElementById('app').innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;padding:2rem;text-align:center;font-family:system-ui">' +
      '<div style="font-size:2rem">📡</div>' +
      '<div style="color:#E6EDF3;font-size:1rem;font-weight:600">Could not load game data</div>' +
      '<div style="color:#8899bb;font-size:.85rem">Check your connection and try again.</div>' +
      '<button onclick="location.reload()" style="margin-top:.5rem;padding:.7rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer">&#x27F3; Retry</button>' +
      '</div>';
    return;
  }

  const saved = JSON.parse(StorageManager.get(FILTER_KEY) || 'null');
  activeParts  = saved || [...new Set(allQuestions.map(q => q.part))].sort((a,b) => a-b);

  loadGameState();
  applyTheme(StorageManager.get(THEME_KEY) || 'dark');
  colorBlindMode = StorageManager.get(COLORBLIND_KEY) === '1';
  bindUI();
  buildFilterDrawer();
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

  // TD relic collection (EQ-4). Until EQ-6/EQ-8 ship real acquisition (store
  // purchase, post-map earn), grant the starter set on first load so the
  // equip menu is usable now; owned collection persists and grows from there.
  const savedOwned = StorageManager.get(TD_RELICS_OWNED_KEY);
  tdOwnedRelics = savedOwned != null ? new Set(JSON.parse(savedOwned)) : new Set(TD_RELICS.map(r => r.id));
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

// ── XP, streak & gold ──────────────────────────────────────────
function awardXP(isCorrect, context) {
  if (!isCorrect) {
    streak = 0;
    saveGameState();
    refreshTopBarStats();
    return 0;
  }

  streak++;
  if (streak > bestStreak) bestStreak = streak;

  const streakMult = streak >= 10 ? 2.5 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  const base   = context === 'daily' ? 150 : 100;
  const earned = Math.round(base * streakMult);

  const prevIdx = getLevel(xp).idx;
  xp += earned;
  sessionXpEarned += earned;
  saveGameState();

  const newIdx = getLevel(xp).idx;
  if (newIdx > prevIdx) showLevelUpToast(getLevel(xp));

  refreshTopBarStats();
  if (earned > 0) showXpPopup(earned, streakMult);
  return earned;
}

// ── Question mastery tracking ──────────────────────────────────
const MASTERY_THRESHOLD = 3;

function getMasteryData() {
  try { return JSON.parse(StorageManager.get(MASTERY_KEY)) || {}; }
  catch { return {}; }
}

function recordQuizResult(qId, correct) {
  const data = getMasteryData();
  if (!data[qId]) data[qId] = { correct: 0, seen: 0 };
  data[qId].seen++;
  if (correct) data[qId].correct++;
  StorageManager.set(MASTERY_KEY, JSON.stringify(data));
}

function isMastered(qId) {
  const data = getMasteryData();
  return (data[qId]?.correct ?? 0) >= MASTERY_THRESHOLD;
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

function showXpPopup(amount, mult) {
  const area = EL.cardArea;
  if (!area) return;
  area.style.position = 'relative';
  const el = document.createElement('div');
  el.className = 'xp-popup';
  el.textContent = `+${amount} XP${mult > 1 ? ` ×${mult}` : ''}`;
  area.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ── Achievements ───────────────────────────────────────────────
function checkAchievements(isCorrect, context) {
  if (!isCorrect) return;
  unlockIfNew('first_blood');
  if (streak >= 5)  unlockIfNew('streak_5');
  if (streak >= 10) unlockIfNew('streak_10');
  if (xp >= 500)    unlockIfNew('xp_500');
  if (xp >= 3000)   unlockIfNew('xp_3000');
  if (context === 'daily') unlockIfNew('daily_done');
  if (checkPolymath())     unlockIfNew('polymath');
  if (checkAllSeen())      unlockIfNew('all_questions');
}

function checkPolymath() {
  return [1,2,3,4,5,6,7,8,9].every(p => partAccuracy[p] && partAccuracy[p].t > 0);
}
function checkAllSeen() {
  return new Set(JSON.parse(StorageManager.get(SEEN_KEY) || '[]')).size >= allQuestions.length;
}
function checkPerfectPart(partNum) {
  const acc = partAccuracy[partNum];
  if (!acc || acc.t === 0) return false;
  return acc.t >= allQuestions.filter(q => q.part === partNum).length && acc.c === acc.t;
}

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

function showLevelUpToast(level) {
  const el = EL.achievementToast;
  el.innerHTML = `<span class="ach-icon">${level.icon}</span><div class="ach-text"><div class="ach-name">Level Up!</div><div class="ach-desc">You are now ${level.title}</div></div>`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3400);
}

// ── Part accuracy ──────────────────────────────────────────────
function trackAccuracy(partNum, isCorrect) {
  if (!partAccuracy[partNum]) partAccuracy[partNum] = { c: 0, t: 0 };
  partAccuracy[partNum].t++;
  if (isCorrect) partAccuracy[partNum].c++;
  saveGameState();
}

function getAccuracyDot(partNum) {
  const acc = partAccuracy[partNum];
  if (!acc || acc.t === 0) return '';
  const pct   = Math.round((acc.c / acc.t) * 100);
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return `<span class="accuracy-dot" style="color:${color}">${pct}%</span>`;
}

// ── Daily challenge ────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDailyQuestions() {
  const seed = todayKey().split('-').reduce((a, n) => a * 31 + parseInt(n, 10), 1);
  return seededShuffle([...allQuestions], seed).slice(0, 5);
}
function getDailyState() {
  const raw = JSON.parse(StorageManager.get(DAILY_KEY) || 'null');
  if (!raw || raw.date !== todayKey()) return { date: todayKey(), answeredIds: [], correct: 0, complete: false };
  return raw;
}
function saveDailyState(state) { StorageManager.set(DAILY_KEY, JSON.stringify(state)); }

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

// TD/game screens (home, map select, world map, battle) build their own
// contextual header inline — the persistent top bar is only for the
// study/drill screens, so it stays hidden here instead of
// stacking a second, mostly-redundant chrome band above the game UI.
const TD_TOPBAR_STATES = new Set(['home', 'td-world', 'tower', 'td-level']);

function setTopBar(state, extra = {}) {
  const bar = document.getElementById('top-bar');
  if (TD_TOPBAR_STATES.has(state)) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  bar.style.display = '';

  if (state === 'study-list') {
    bar.innerHTML = `<button class="btn-back" id="btn-back-home">← Home</button><div class="top-bar-right">${gameBadges()}${themeBtn()}</div>`;
    document.getElementById('btn-back-home').addEventListener('click', showHome);
    bindThemeBtn(); bindXpBadge();

  } else if (state === 'study-question') {
    const { part, idx, total } = extra;
    bar.innerHTML = `
      <button class="btn-back" id="btn-back">← ${dailyActive ? 'Study' : 'Parts'}</button>
      <span class="top-center">${typeof part === 'number' ? `Part ${part}` : part} · ${idx}/${total}</span>
      <div class="top-bar-right">${gameBadges()}</div>`;
    document.getElementById('btn-back').addEventListener('click', () => {
      dailyActive = false; studyPart = null;
      setTopBar('study-list'); hideQuestion(); showPartList();
    });
    bindXpBadge();

  } else if (state === 'drill') {
    bar.innerHTML = `
      <button class="btn-back" id="btn-back-home">← Home</button>
      <span class="session-score" id="session-score"></span>
      <div class="top-bar-right">${gameBadges()}
        <button class="btn-filter" id="btn-filter">Filter</button>
        ${themeBtn()}
      </div>`;
    document.getElementById('btn-back-home').addEventListener('click', showHome);
    document.getElementById('btn-filter').addEventListener('click', openFilter);
    bindThemeBtn(); bindXpBadge(); refreshSessionScore();
  }
}

function refreshSessionScore() {
  const el = document.getElementById('session-score');
  if (el) el.textContent = sessionTotal > 0 ? `${sessionCorrect}/${sessionTotal}` : '';
}

// ── Profile sheet ──────────────────────────────────────────────
function openProfile() {
  const sheet = EL.profileSheet;
  const l     = getLevel(xp);
  const nextXp = l.next ? (l.next.min - xp).toLocaleString() : null;
  const pct    = Math.round(l.progress * 100);

  const relicHTML = TD_RELICS.map(r => `
    <div class="ach-cell ${tdOwnedRelics.has(r.id) ? 'unlocked' : 'locked'}" title="${r.desc}">
      <span class="ach-cell-icon">${r.icon}</span>
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

// ── Study: Part list ───────────────────────────────────────────
function showPartList() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');

  const daily     = getDailyState();
  const dqs       = getDailyQuestions();
  const dAnswered = daily.answeredIds.length;
  const dDone     = daily.complete;

  const area = EL.contentArea;
  area.innerHTML = `
    <div class="part-list">
      <div class="part-list-header"><h2>Study by Part</h2><p>Tap a part to begin</p></div>
      <div class="daily-banner ${dDone ? 'done' : ''}" id="daily-banner">
        <div class="daily-left">
          <span class="daily-icon">${dDone ? '✅' : '📅'}</span>
          <div>
            <div class="daily-title">Daily Challenge</div>
            <div class="daily-sub">${dDone ? `Done! ${daily.correct}/${dqs.length} correct` : dAnswered > 0 ? `${dAnswered}/${dqs.length} answered · 1.5× XP` : `${dqs.length} questions · 1.5× XP`}</div>
          </div>
        </div>
        ${dDone ? '' : `<button class="btn-daily" id="btn-daily">${dAnswered > 0 ? 'Continue' : 'Start'}</button>`}
      </div>
      <div class="part-grid" id="part-grid"></div>
    </div>`;

  document.getElementById('btn-daily')?.addEventListener('click', startDailyChallenge);

  const grid = document.getElementById('part-grid');
  for (let p = 1; p <= 9; p++) {
    const qs = allQuestions.filter(q => q.part === p);
    const total = qs.length, seen = getStudySeen(p);
    const pct = total === 0 ? 0 : Math.round((seen / total) * 100);
    const hasQ = total > 0;
    const R = 18, sz = 44, circ = 2 * Math.PI * R, off = circ * (1 - pct / 100);
    const ringColor = pct === 100 ? 'var(--correct)' : 'var(--accent)';
    const ringHTML = hasQ ? `<svg class="progress-ring" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
      <circle class="ring-bg" cx="${sz/2}" cy="${sz/2}" r="${R}"/>
      <circle class="ring-fill" cx="${sz/2}" cy="${sz/2}" r="${R}" stroke="${ringColor}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
      ${pct > 0 ? `<text class="ring-text" x="${sz/2}" y="${sz/2+1}">${pct}%</text>` : ''}
    </svg>` : '';
    const card = document.createElement('div');
    card.className = 'part-card' + (hasQ ? '' : ' locked');
    card.innerHTML = `
      <div class="part-card-top"><span class="part-badge">Part ${p}</span>${ringHTML}</div>
      <div class="part-card-name">${PART_NAMES[p]}</div>
      <div class="part-card-meta ${hasQ ? '' : 'coming-soon'}">${hasQ ? `${total} question${total !== 1 ? 's' : ''} ${getAccuracyDot(p)}` : 'Coming soon'}</div>`;
    if (hasQ) card.addEventListener('click', () => startStudyPart(p));
    grid.appendChild(card);
  }
}

function getStudySeen(partNum) { return new Set(JSON.parse(StorageManager.get(`study_seen_p${partNum}`) || '[]')).size; }
function markStudySeen(partNum, id) {
  const key  = `study_seen_p${partNum}`;
  const seen = new Set(JSON.parse(StorageManager.get(key) || '[]'));
  seen.add(id); StorageManager.set(key, JSON.stringify([...seen]));
}

// ── Daily challenge ────────────────────────────────────────────
function startDailyChallenge() {
  const state = getDailyState(), dqs = getDailyQuestions();
  const todo = dqs.filter(q => !state.answeredIds.includes(q.id));
  if (todo.length === 0) return;
  dailyActive = true; queue = todo;
  currentQNum = state.answeredIds.length; currentQTotal = dqs.length;
  sessionCorrect = state.correct; sessionTotal = state.answeredIds.length;
  sessionXpEarned = 0; answered = false;
  EL.contentArea.innerHTML = '';
  showNext();
}

// ── Study flow ─────────────────────────────────────────────────
function startStudyPart(partNum) {
  studyPart = partNum; dailyActive = false;
  queue = allQuestions.filter(q => q.part === partNum);
  sessionCorrect = 0; sessionTotal = 0; sessionXpEarned = 0;
  answered = false; currentQNum = 0; currentQTotal = queue.length;
  EL.contentArea.innerHTML = '';
  showNext();
}

// ── Show next question (Study / Drill only) ────────────────────
function showNext() {
  if (queue.length === 0) { showComplete(); return; }

  current = queue.shift(); answered = false; currentQNum++;

  if (mode === 'study') {
    const total = dailyActive ? currentQTotal : allQuestions.filter(q => q.part === studyPart).length;
    setTopBar('study-question', { part: dailyActive ? '📅 Daily' : studyPart, idx: currentQNum, total });
    EL.progressWrap.style.display = 'none';
  } else if (mode === 'drill') {
    updateDrillProgress();
  }

  EL.contentArea.innerHTML = '';
  EL.cardArea.style.display  = 'block';
  EL.bottomBar.style.display = 'block';
  EL.completeScreen.classList.remove('show');

  renderQuestion(current, currentQNum, currentQTotal);
  EL.btnCheck.disabled      = true;
  EL.btnCheck.style.display = 'block';
  EL.btnNext.classList.remove('show');
  EL.btnNext.textContent = 'Continue →';
}

function hideQuestion() {
  EL.cardArea.style.display  = 'none';
  EL.bottomBar.style.display = 'none';
}

function updateDrillProgress() {
  const seen  = JSON.parse(StorageManager.get(SEEN_KEY) || '[]').length;
  const total = allQuestions.filter(q => activeParts.includes(q.part)).length;
  const pct   = total === 0 ? 0 : Math.round((seen / total) * 100);
  EL.progressWrap.style.display = 'block';
  document.getElementById('progress-fill').style.width   = pct + '%';
  document.getElementById('progress-label').textContent  = `${seen} of ${total} seen`;
  refreshSessionScore();
}

// ── Render question card ───────────────────────────────────────
function renderQuestion(q, num, total) {
  const card      = EL.qCard;
  const typeLabel = q.type === 'tf' ? 'True / False' : 'Multiple Choice';
  const numLabel  = `Q${num}/${total}`;

  const optHTML = q.type === 'mc'
    ? `<div class="options">${q.options.map((o, i) =>
        `<div class="opt" data-index="${i}"><div class="opt-letter">${LETTERS[i]}</div><div class="opt-text">${o}</div></div>`
      ).join('')}</div>`
    : `<div class="tf-options"><div class="tf-opt" data-value="true">True</div><div class="tf-opt" data-value="false">False</div></div>`;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-header-left"><span class="q-id">#${q.num}</span><div class="part-chip">Part ${q.part}</div></div>
      <div class="q-num">${numLabel}</div>
    </div>
    <div class="q-type">${typeLabel}</div>
    <p class="q-stem">${q.stem}</p>
    ${optHTML}
    <div class="explanation" id="explanation"></div>`;

  const sel = q.type === 'mc' ? '.opt' : '.tf-opt';
  card.querySelectorAll(sel).forEach(opt => {
    opt.addEventListener('click', () => {
      if (answered) return;
      card.querySelectorAll(sel).forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      EL.btnCheck.disabled = false;
    });
  });
}

// ── Check answer ───────────────────────────────────────────────
function checkAnswer() {
  if (answered) return;
  answered = true; sessionTotal++;

  const card = EL.qCard;
  let isCorrect = false;

  if (current.type === 'mc') {
    const sel = card.querySelector('.opt.selected');
    if (!sel) { answered = false; sessionTotal--; return; }
    const idx = parseInt(sel.dataset.index, 10);
    isCorrect = idx === current.correct;
    card.querySelectorAll('.opt').forEach((o, i) => {
      if (i === current.correct) o.classList.add('correct-answer');
      else if (i === idx && !isCorrect) o.classList.add('wrong-answer');
    });
  } else {
    const sel = card.querySelector('.tf-opt.selected');
    if (!sel) { answered = false; sessionTotal--; return; }
    const val = sel.dataset.value === 'true';
    isCorrect  = val === current.correct;
    card.querySelectorAll('.tf-opt').forEach(o => {
      const v = o.dataset.value === 'true';
      if (v === current.correct) o.classList.add('correct-answer');
      else if (o.classList.contains('selected') && !isCorrect) o.classList.add('wrong-answer');
    });
  }

  card.classList.remove('answer-correct', 'answer-wrong');
  void card.offsetWidth;
  card.classList.add(isCorrect ? 'answer-correct' : 'answer-wrong');
  setTimeout(() => card.classList.remove('answer-correct', 'answer-wrong'), 600);

  revealAnswerResult(isCorrect);
}

function revealAnswerResult(isCorrect) {
  if (isCorrect) sessionCorrect++;

  const ctx = dailyActive ? 'daily' : 'normal';
  awardXP(isCorrect, ctx);
  checkAchievements(isCorrect, ctx);
  trackAccuracy(current.part, isCorrect);
  if (studyPart && isCorrect && checkPerfectPart(studyPart)) unlockIfNew('perfect_part');

  if (mode === 'study') {
    if (dailyActive) {
      const ds = getDailyState();
      if (!ds.answeredIds.includes(current.id)) {
        ds.answeredIds.push(current.id);
        if (isCorrect) ds.correct++;
        if (ds.answeredIds.length >= getDailyQuestions().length) ds.complete = true;
        saveDailyState(ds);
      }
    } else if (studyPart) {
      markStudySeen(studyPart, current.id);
    }
  } else if (mode === 'drill') {
    markDrillSeen(current.id);
    updateDrillProgress();
    refreshSessionScore();
  }

  const exp = document.getElementById('explanation');
  if (exp) {
    exp.innerHTML = `<strong>${isCorrect ? '✓ Correct' : '✗ Incorrect'}</strong> — ${current.explanation}`;
    exp.classList.add('show');
    exp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  EL.btnCheck.style.display = 'none';
  EL.btnNext.classList.add('show');
}

// ── Complete screens ───────────────────────────────────────────
function showComplete() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.contentArea.innerHTML = '';

  const pct  = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
  const icon = pct >= 80 ? '🎯' : pct >= 60 ? '📈' : '📚';
  const msg  = pct >= 80 ? 'Strong session!' : pct >= 60 ? 'Good progress.' : 'Keep reviewing.';
  const xpLine = sessionXpEarned > 0 ? `<div class="xp-earned">+${sessionXpEarned.toLocaleString()} XP earned</div>` : '';

  const screen = EL.completeScreen;
  screen.classList.add('show');

  if (dailyActive) {
    const ds = getDailyState();
    screen.innerHTML = `<div class="complete-icon">📅</div><h2>Daily Complete!</h2>
      <div class="score-big">${ds.correct}/${getDailyQuestions().length}</div>${xpLine}
      <p>Come back tomorrow for a new challenge.</p>
      <button class="btn-restart" id="btn-back-study">← Back to Study</button>`;
    document.getElementById('btn-back-study').addEventListener('click', () => {
      screen.classList.remove('show'); dailyActive = false; setTopBar('study-list'); showPartList();
    });
  } else if (mode === 'study') {
    screen.innerHTML = `<div class="complete-icon">${icon}</div><h2>Part ${studyPart} Done</h2>
      <div class="score-big">${sessionCorrect}/${sessionTotal}</div>${xpLine}
      <p>${pct}% correct.</p>
      <button class="btn-restart" id="btn-restart">Try Again</button>
      <button class="btn-reset-all" id="btn-back-parts">← All Parts</button>`;
    document.getElementById('btn-restart').addEventListener('click', () => { screen.classList.remove('show'); startStudyPart(studyPart); });
    document.getElementById('btn-back-parts').addEventListener('click', () => { screen.classList.remove('show'); studyPart = null; setTopBar('study-list'); showPartList(); });
    if (pct === 100) unlockIfNew('perfect_part');
  } else {
    screen.innerHTML = `<div class="complete-icon">${icon}</div><h2>Session Complete</h2>
      <div class="score-big">${sessionCorrect}/${sessionTotal}</div>${xpLine}
      <p>${pct}% correct. ${msg}</p>
      <button class="btn-restart" id="btn-restart">New Session</button>
      <button class="btn-reset-all" id="btn-reset-all">Reset all progress</button>`;
    document.getElementById('btn-restart').addEventListener('click', () => { screen.classList.remove('show'); setTopBar('drill'); buildDrillQueue(); showNext(); });
    document.getElementById('btn-reset-all').addEventListener('click', () => { resetDrillSeen(); screen.classList.remove('show'); setTopBar('drill'); buildDrillQueue(); showNext(); });
  }
}

// ── Filter drawer ──────────────────────────────────────────────
function buildFilterDrawer() {
  const parts  = [...new Set(allQuestions.map(q => q.part))].sort((a,b) => a-b);
  const drawer = EL.filterDrawer;
  drawer.innerHTML = `
    <div class="filter-panel">
      <h3>Filter by Part</h3>
      <div class="filter-options" id="filter-chips">
        ${parts.map(p => `<div class="filter-chip ${activeParts.includes(p) ? 'active' : ''}" data-part="${p}">Part ${p}</div>`).join('')}
      </div>
      <button class="btn-apply" id="btn-apply-filter">Apply</button>
    </div>`;
  drawer.querySelectorAll('.filter-chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')));
  document.getElementById('btn-apply-filter').addEventListener('click', () => {
    const sel = [...drawer.querySelectorAll('.filter-chip.active')].map(c => parseInt(c.dataset.part, 10));
    if (!sel.length) return;
    activeParts = sel; StorageManager.set(FILTER_KEY, JSON.stringify(activeParts));
    closeFilter(); buildDrillQueue(); setTopBar('drill'); showNext();
  });
  drawer.addEventListener('click', e => { if (e.target === drawer) closeFilter(); });
}
function openFilter()  { EL.filterDrawer.classList.add('open'); }
function closeFilter() { EL.filterDrawer.classList.remove('open'); }

// ── UI bindings ────────────────────────────────────────────────
function bindUI() {
  // Cache static DOM refs once — avoids repeated lookups in hot paths
  EL.app              = document.getElementById('app');
  EL.contentArea      = document.getElementById('content-area');
  EL.completeScreen   = document.getElementById('complete-screen');
  EL.progressWrap     = document.getElementById('progress-wrap');
  EL.cardArea         = document.getElementById('card-area');
  EL.btnCheck         = document.getElementById('btn-check');
  EL.bottomBar        = document.getElementById('bottom-bar');
  EL.btnNext          = document.getElementById('btn-next');
  EL.qCard            = document.getElementById('q-card');
  EL.filterDrawer     = document.getElementById('filter-drawer');
  EL.achievementToast = document.getElementById('achievement-toast');
  EL.profileSheet     = document.getElementById('profile-sheet');

  EL.btnCheck.addEventListener('click', checkAnswer);
  EL.btnNext.addEventListener('click', showNext);
}

// ══════════════════════════════════════════════════════════════
//  TOWER DEFENSE GAME
// ══════════════════════════════════════════════════════════════

// Default portrait grid; painted battle maps (frontierTownLevelDef) override
// these per-level at initTDGame time via levelDef.gridCols/gridRows.
const TD_DEFAULT_COLS = 9, TD_DEFAULT_ROWS = 10;

// Questions are opt-in (owner decision 2026-07-17): waves start immediately
// with no question gate; the 📝 button offers a bonus-gold question (max
// 3/wave) for players who want the edge. The TD must stand on its own.
let TD_COLS = TD_DEFAULT_COLS, TD_ROWS = TD_DEFAULT_ROWS;
const TD_STARS_KEY = 'td_stars_v1';
