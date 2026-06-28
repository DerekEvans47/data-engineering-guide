'use strict';

// ── Storage keys ──────────────────────────────────────────────
const SEEN_KEY         = 'drill_seen_ids';
const FILTER_KEY       = 'drill_filter_parts';
const THEME_KEY        = 'drill_theme';
const XP_KEY           = 'game_xp';
const STREAK_KEY       = 'game_streak';
const BEST_STREAK_KEY  = 'game_best_streak';
const ACHIEVEMENTS_KEY = 'game_achievements';
const DUNGEON_KEY      = 'dungeon_cleared';
const DAILY_KEY        = 'daily_state';
const ACCURACY_KEY     = 'part_accuracy';
const RELIC_KEY        = 'game_relics';
const GOLD_KEY         = 'game_gold';
const ITEMS_KEY        = 'game_items';
const TUTORIAL_KEY     = 'qd_tutorial_v1';
const TD_TUTORIAL_KEY    = 'td_tutorial_v1';
const AUTOSAVE_KEY       = 'td_autosave';
const TD_INTER_KEY       = 'td_inter_v1';
const TD_REST_BONUS_KEY  = 'td_rest_bonus';
const TD_RUN_KEY         = 'td_run_v1';
const TD_MAPS_BEATEN_KEY = 'td_maps_beaten';

// ── Storage layer (private-browsing-safe) ─────────────────────
const StorageManager = {
  get(key)       { try { return localStorage.getItem(key); }    catch { return null; } },
  set(key, value){ try { localStorage.setItem(key, value); }    catch { /* private browsing */ } },
  remove(key)    { try { localStorage.removeItem(key); }        catch { /* private browsing */ } },
};

const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

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
  { id: 'dungeon_first', name: 'Dungeon Diver',   desc: 'Cleared your first dungeon floor',   icon: '🗝️' },
  { id: 'boss_slayer',   name: 'Boss Slayer',     desc: 'Defeated a dungeon boss',            icon: '🐉' },
  { id: 'dungeon_all',   name: 'Dungeon Master',  desc: 'Cleared all 9 dungeon floors',       icon: '👑' },
  { id: 'xp_500',        name: 'XP Rising',       desc: 'Earned 500 total XP',                icon: '💰' },
  { id: 'xp_3000',       name: 'XP Legend',       desc: 'Earned 3,000 total XP',              icon: '💫' },
  { id: 'relic_first',   name: 'Relic Hunter',    desc: 'Collected your first relic',         icon: '🏺' },
  { id: 'relic_five',    name: 'Archaeologist',   desc: 'Collected 5 relics',                 icon: '🔮' },
  { id: 'shopaholic',    name: 'Shopaholic',      desc: 'Purchased from the shop',             icon: '🛍️' },
  { id: 'item_user',     name: 'Item Master',     desc: 'Used an item in an encounter',        icon: '⚗️' },
  { id: 'td_win',        name: 'Defender',        desc: 'Survived all waves in Tower Defense', icon: '🛡️' },
];

const FLOOR_THEMES = {
  1: { name: 'The Platform Fortress',   emoji: '🏰', color: '#3B82F6', boss: 'The Architect Colossus' },
  2: { name: 'The Data Caverns',        emoji: '🌊', color: '#06B6D4', boss: 'The Schema Kraken'      },
  3: { name: 'The Engine Room',         emoji: '⚙️', color: '#F59E0B', boss: 'The Pipeline Golem'     },
  4: { name: 'The Analytics Sanctum',   emoji: '📊', color: '#8B5CF6', boss: 'The Dashboard Oracle'   },
  5: { name: 'The Leadership Tower',    emoji: '🏛️', color: '#EC4899', boss: 'The Delivery Titan'     },
  6: { name: 'The AI Nexus',            emoji: '🤖', color: '#10B981', boss: 'The Rogue Model'         },
  7: { name: 'The Product Labyrinth',   emoji: '📋', color: '#F97316', boss: 'The Roadmap Demon'       },
  8: { name: 'The Statistics Citadel',  emoji: '🧮', color: '#6366F1', boss: 'The Stats Sorcerer'      },
  9: { name: 'The Supply Chain Keep',   emoji: '📦', color: '#EF4444', boss: 'The Chain Dragon'        },
};

const ACTS = [
  { floors: [1,2,3], name: 'Act I',   subtitle: 'The Foundation', emoji: '🌑' },
  { floors: [4,5,6], name: 'Act II',  subtitle: 'The Ascent',     emoji: '🌓' },
  { floors: [7,8,9], name: 'Act III', subtitle: 'The Summit',     emoji: '🌕' },
];

const ROOM_TYPES = {
  combat:   { icon: '⚔️', label: 'Combat',        color: '#3B82F6', hpRisk: true  },
  elite:    { icon: '💀', label: 'Elite',          color: '#A855F7', hpRisk: true  },
  rest:     { icon: '🔥', label: 'Rest Site',      color: '#10B981', hpRisk: false },
  treasure: { icon: '💰', label: 'Treasure',       color: '#F59E0B', hpRisk: false },
  shop:     { icon: '🛒', label: 'Shop',           color: '#EC4899', hpRisk: false },
  boss:     { icon: '☠️', label: 'Boss',           color: '#EF4444', hpRisk: true  },
};

const RELICS = [
  { id: 'iron_quill',    name: 'Iron Quill',       desc: 'Each correct answer grants +25 bonus XP',     icon: '🪶' },
  { id: 'coffee_flask',  name: 'Coffee Flask',     desc: 'First wrong answer per floor: no HP loss',    icon: '☕' },
  { id: 'golden_idol',   name: 'Golden Idol',      desc: 'Treasure rooms grant triple XP on correct',   icon: '🏺' },
  { id: 'data_tome',     name: 'Data Tome',        desc: 'Maximum HP increased by 1',                   icon: '📖' },
  { id: 'boss_crown',    name: "Boss's Crown",     desc: 'Boss encounters grant 400 base XP',           icon: '👑' },
  { id: 'scholars_ring', name: "Scholar's Ring",   desc: 'Rest sites also restore 50 XP',               icon: '💍' },
  { id: 'phoenix_ash',   name: 'Phoenix Ash',      desc: 'Revive once per floor at 1 HP',               icon: '🔮' },
];

const ITEMS = [
  { id: 'fifty_fifty', name: '50/50',         desc: 'Eliminate two wrong answers (MC only)',      icon: '🎲', cost: 40 },
  { id: 'swap',        name: 'Question Swap', desc: 'Replace this question with a fresh one',     icon: '🔄', cost: 35 },
  { id: 'ward',        name: 'Ward',          desc: 'Block your next HP loss this encounter',     icon: '🛡️', cost: 30 },
  { id: 'surge',       name: 'Power Surge',   desc: 'Next correct answer earns double XP',        icon: '⚡', cost: 45 },
];

const ENEMY_NAMES = [
  'Data Goblin', 'Schema Imp', 'Query Troll', 'Index Wraith',
  'Cache Bandit', 'The Null Pointer', 'Stack Goblin', 'Race Condition',
  'Deadlock Daemon', 'The Stale Cache', 'Orphan Record', 'The Shard Imp',
];

const FLOOR_MINIONS = ['👺','👻','🧟','💀','🦇','🐍','🕷️','🦂','🧿'];
const ELITE_MINIONS = ['🔮','🌑','⚡','🌪️','🔥','❄️','☠️','👁️','💣'];

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

// Game state
let xp           = 0;
let streak       = 0;
let bestStreak   = 0;
let achievements = new Set();
let partAccuracy = {};
let relics       = new Set();

// Gold & items
let gold          = 0;
let itemInventory = { fifty_fifty: 0, swap: 0, ward: 0, surge: 0 };
let activeWard    = false;
let activeSurge   = false;

// Dungeon run state
let dungeonFloor          = null;
let dungeonHp             = 3;
const DUNGEON_MAX_HP      = 3;
let isBossRoom            = false;
let clearedFloors         = new Set();
let dungeonRoomContext    = 'combat';
let dungeonFirstWrongUsed = false;
let dungeonReviveUsed     = false;
let dungeonFloorPool      = [];

// Dungeon map state
let dungeonMapData       = null;
let dungeonCurrentNodeId = null;
let dungeonActiveNodeId  = null;
let dungeonClearedNodes  = new Set();

// Cached DOM refs — populated in bindUI() and initTDGame() to avoid repeated
// getElementById calls in hot paths like tdUpdateHUD.
const EL = {};

// ── Question-bank schema validation ─────────────────────��──────
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

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('../../content/question-bank.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    allQuestions = validateQuestionBank(raw);
  } catch (_) {
    document.getElementById('app').innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;padding:2rem;text-align:center;font-family:system-ui">' +
      '<div style="font-size:2rem">📡</div>' +
      '<div style="color:#E6EDF3;font-size:1rem;font-weight:600">Could not load question bank</div>' +
      '<div style="color:#8899bb;font-size:.85rem">Check your connection and try again.</div>' +
      '<button onclick="location.reload()" style="margin-top:.5rem;padding:.7rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer">&#x27F3; Retry</button>' +
      '</div>';
    return;
  }

  const saved = JSON.parse(StorageManager.get(FILTER_KEY) || 'null');
  activeParts  = saved || [...new Set(allQuestions.map(q => q.part))].sort((a,b) => a-b);

  loadGameState();
  applyTheme(StorageManager.get(THEME_KEY) || 'dark');
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
  clearedFloors = new Set(JSON.parse(StorageManager.get(DUNGEON_KEY)     || '[]'));
  relics        = new Set(JSON.parse(StorageManager.get(RELIC_KEY)       || '[]'));
  const savedItems = JSON.parse(StorageManager.get(ITEMS_KEY) || 'null');
  if (savedItems) itemInventory = { fifty_fifty: 0, swap: 0, ward: 0, surge: 0, ...savedItems };
}

function saveGameState() {
  StorageManager.set(XP_KEY,           xp);
  StorageManager.set(STREAK_KEY,       streak);
  StorageManager.set(BEST_STREAK_KEY,  bestStreak);
  StorageManager.set(GOLD_KEY,         gold);
  StorageManager.set(ACHIEVEMENTS_KEY, JSON.stringify([...achievements]));
  StorageManager.set(ACCURACY_KEY,     JSON.stringify(partAccuracy));
  StorageManager.set(DUNGEON_KEY,      JSON.stringify([...clearedFloors]));
  StorageManager.set(RELIC_KEY,        JSON.stringify([...relics]));
  StorageManager.set(ITEMS_KEY,        JSON.stringify(itemInventory));
}

// ── HP helpers ─────────────────────────────────────────────────
function getMaxHp() { return DUNGEON_MAX_HP + (relics.has('data_tome') ? 1 : 0); }

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
  if (!isCorrect && context !== 'treasure') {
    streak = 0;
    saveGameState();
    refreshTopBarStats();
    return 0;
  }

  if (isCorrect) {
    streak++;
    if (streak > bestStreak) bestStreak = streak;
  }

  const streakMult = streak >= 10 ? 2.5 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  const surgeMult  = (isCorrect && activeSurge) ? 2 : 1;

  let base;
  if      (context === 'boss')     base = relics.has('boss_crown') ? 400 : 250;
  else if (context === 'treasure') base = isCorrect ? (relics.has('golden_idol') ? 300 : 100) : 20;
  else if (context === 'elite')    base = 150;
  else if (context === 'daily')    base = 150;
  else                             base = 100;

  const bonus  = (isCorrect && relics.has('iron_quill')) ? 25 : 0;
  const earned = Math.round(base * (isCorrect ? streakMult * surgeMult : 1)) + bonus;

  if (isCorrect && activeSurge) {
    activeSurge = false;
    showAchievementToast({ icon: '⚡', name: 'Power Surge!', desc: `${surgeMult}× XP bonus applied` });
    refreshItemTray();
  }

  if (isCorrect && mode === 'dungeon') {
    const goldMap = { combat: 10, elite: 20, boss: 50, treasure: 15 };
    earnGold(goldMap[context] ?? 8);
  }

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
  if (context === 'boss')  unlockIfNew('boss_slayer');
  if (context === 'daily') unlockIfNew('daily_done');
  if (checkPolymath())     unlockIfNew('polymath');
  if (checkAllSeen())      unlockIfNew('all_questions');
  if (relics.size >= 1)    unlockIfNew('relic_first');
  if (relics.size >= 5)    unlockIfNew('relic_five');
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
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
}
function themeBtn() {
  return `<button class="btn-theme" id="btn-theme">${document.documentElement.dataset.theme !== 'light' ? '☀️' : '🌙'}</button>`;
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

// ── Relic bar ──────────────────────────────────────────────────
function renderRelicBar() {
  if (relics.size === 0) return '';
  const pips = [...relics].map(id => {
    const r = RELICS.find(r => r.id === id);
    return r ? `<span class="relic-pip" title="${r.name}: ${r.desc}">${r.icon}</span>` : '';
  }).join('');
  return `<div class="relic-bar">${pips}</div>`;
}

// ── Top bar ────────────────────────────────────────────────────
function setTopBar(state, extra = {}) {
  const bar = document.getElementById('top-bar');

  if (state === 'home') {
    bar.innerHTML = `<span class="logo">Quiz Defense</span><div class="top-bar-right">${gameBadges()}${themeBtn()}</div>`;
    bindThemeBtn(); bindXpBadge();

  } else if (state === 'study-list') {
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

  } else if (state === 'td-world' || state === 'tower') {
    bar.innerHTML = `<button class="btn-back" id="btn-back-home">← Home</button><div class="top-bar-right">${gameBadges()}<button class="btn-filter" id="btn-td-help">? Help</button>${themeBtn()}</div>`;
    document.getElementById('btn-back-home').addEventListener('click', showHome);
    document.getElementById('btn-td-help').addEventListener('click', () => showTutorial(() => {}));
    bindThemeBtn(); bindXpBadge();

  } else if (state === 'td-level') {
    const { name } = extra;
    bar.innerHTML = `
      <button class="btn-back" id="btn-back-map">← Map</button>
      <span class="top-center" style="font-size:.78rem">${name}</span>
      <div class="top-bar-right">${gameBadges()}</div>`;
    document.getElementById('btn-back-map').addEventListener('click', showTDWorldMap);
    bindXpBadge();

  } else if (state === 'dungeon-map') {
    bar.innerHTML = `<button class="btn-back" id="btn-back-home">← Home</button><div class="top-bar-right"><span class="gold-badge">🪙 ${gold}</span>${gameBadges()}${themeBtn()}</div>`;
    document.getElementById('btn-back-home').addEventListener('click', showHome);
    bindThemeBtn(); bindXpBadge();

  } else if (state === 'dungeon-floor-map') {
    const { floor } = extra;
    const theme = FLOOR_THEMES[floor];
    bar.innerHTML = `
      <button class="btn-back" id="btn-back">← Floors</button>
      <span class="top-center">${theme.emoji} ${renderHpHtml()}</span>
      <div class="top-bar-right"><span class="gold-badge">🪙 ${gold}</span>${gameBadges()}</div>`;
    document.getElementById('btn-back').addEventListener('click', () => {
      dungeonMapData = null; showDungeonMap();
    });
    bindXpBadge();

  } else if (state === 'dungeon-encounter') {
    const { floor } = extra;
    const theme = FLOOR_THEMES[floor];
    bar.innerHTML = `
      <button class="btn-back" id="btn-back">← Map</button>
      <span class="top-center">${renderHpHtml()}</span>
      <div class="top-bar-right"><span class="gold-badge">🪙 ${gold}</span><span class="floor-label">${theme.emoji} ${floor}</span></div>`;
    document.getElementById('btn-back').addEventListener('click', () => {
      if (!answered) { dungeonActiveNodeId = null; current = null; }
      showFloorMapScreen();
    });
  }
}

function refreshSessionScore() {
  const el = document.getElementById('session-score');
  if (el) el.textContent = sessionTotal > 0 ? `${sessionCorrect}/${sessionTotal}` : '';
}

// ── HP hearts ──────────────────────────────────────────────────
function renderHpHtml() {
  let h = '';
  const max = getMaxHp();
  for (let i = 0; i < max; i++) {
    h += `<span class="heart ${i < dungeonHp ? 'filled' : 'empty'}" id="heart-${i}">♥</span>`;
  }
  return `<span class="hp-hearts">${h}</span>`;
}

function loseHp() {
  if (dungeonHp <= 0) return;
  dungeonHp--;
  const tc = document.querySelector('.top-bar .top-center');
  if (tc) tc.innerHTML = renderHpHtml();
  const lost = document.getElementById(`heart-${dungeonHp}`);
  if (lost) { lost.classList.remove('filled'); lost.classList.add('empty', 'losing'); setTimeout(() => lost.classList.remove('losing'), 400); }
}

// ── Profile sheet ──────────────────────────────────────────────
function openProfile() {
  const sheet = EL.profileSheet;
  const l     = getLevel(xp);
  const nextXp = l.next ? (l.next.min - xp).toLocaleString() : null;
  const pct    = Math.round(l.progress * 100);

  const itemHTML = ITEMS.map(item => {
    const owned = itemInventory[item.id] || 0;
    return `
      <div class="ach-cell ${owned > 0 ? 'unlocked' : 'locked'}" title="${item.desc}">
        <span class="ach-cell-icon">${item.icon}</span>
        <span class="ach-cell-name">${item.name}${owned > 0 ? ` ×${owned}` : ''}</span>
      </div>`;
  }).join('');

  const relicHTML = RELICS.map(r => `
    <div class="ach-cell ${relics.has(r.id) ? 'unlocked' : 'locked'}" title="${r.desc}">
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
        <div class="stat-cell"><div class="stat-val">${clearedFloors.size}/9</div><div class="stat-label">Floors Cleared</div></div>
        <div class="stat-cell"><div class="stat-val">🪙 ${gold}</div><div class="stat-label">Gold</div></div>
        <div class="stat-cell"><div class="stat-val">${relics.size}/${RELICS.length}</div><div class="stat-label">Relics</div></div>
      </div>
      <div class="ach-grid-title">Items</div>
      <div class="ach-grid">${itemHTML}</div>
      <div class="ach-grid-title" style="margin-top:.9rem">Relics</div>
      <div class="ach-grid">${relicHTML}</div>
      <div class="ach-grid-title" style="margin-top:.9rem">Achievements</div>
      <div class="ach-grid">${achHTML}</div>
      <div class="profile-save-row">
        <button class="profile-save-btn" id="btn-export-save">⬇ Export Save</button>
        <button class="profile-save-btn" id="btn-import-save">⬆ Import Save</button>
      </div>
    </div>`;

  sheet.style.display = 'flex';
  requestAnimationFrame(() => sheet.classList.add('open'));
  document.getElementById('profile-backdrop').addEventListener('click', closeProfile);
  document.getElementById('btn-close-profile').addEventListener('click', closeProfile);
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
    ACHIEVEMENTS_KEY, DUNGEON_KEY, DAILY_KEY, ACCURACY_KEY, RELIC_KEY,
    GOLD_KEY, ITEMS_KEY, TUTORIAL_KEY, AUTOSAVE_KEY, TD_STARS_KEY, TD_INTER_KEY, TD_REST_BONUS_KEY,
    TD_RUN_KEY, TD_MAPS_BEATEN_KEY,
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
    tdMusic.stop();
  }
  mode = 'home'; dailyActive = false; studyPart = null;
  answered = false;
  EL.cardArea.style.display = 'none';
  EL.bottomBar.style.display = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  EL.app.dataset.mode = 'home';

  const beaten      = tdLoadMapBeaten();
  const existRun    = tdLoadRun();
  const mapsCleared = beaten.length;
  const runActive   = existRun !== null;
  const l = getLevel(xp);

  setTopBar('home');
  EL.contentArea.innerHTML = `
    <div class="home-screen">
      <div class="home-hero">
        <div class="home-logo-mark">🛡️</div>
        <h1 class="home-title">Quiz Defense</h1>
        <p class="home-subtitle">Data Engineering · Tower Defense</p>
      </div>
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
        <button class="home-card home-card-secondary" id="btn-how-to-play">
          <span class="home-card-icon">📖</span>
          <div class="home-card-text">
            <span class="home-card-title">How to Play</span>
            <span class="home-card-desc">Learn the rules</span>
          </div>
          <span class="home-card-arrow">›</span>
        </button>
      </div>
    </div>`;

  document.getElementById('btn-play').addEventListener('click', () => {
    mode = 'tower';
    EL.app.dataset.mode = 'tower';
    showTDWorldMap();
  });
  document.getElementById('btn-how-to-play').addEventListener('click', () => {
    showTutorial(() => {});
  });
  document.getElementById('home-stat-xp').addEventListener('click', openProfile);
}

// ── Tab switching ──────────────────────────────────────────────
function switchTab(newMode) {
  if (td && td.running) { cancelAnimationFrame(td.animFrame); td.running = false; td = null; tdMusic.stop(); }

  mode = newMode; dailyActive = false; studyPart = null;
  answered = false; sessionCorrect = 0; sessionTotal = 0; sessionXpEarned = 0;
  EL.app.dataset.mode = newMode;

  if (mode === 'study')       { setTopBar('study-list'); showPartList(); }
  else if (mode === 'drill')  { setTopBar('drill'); buildDrillQueue(); showNext(); }
  else if (mode === 'dungeon'){ dungeonMapData = null; showDungeonMap(); }
  else if (mode === 'tower')  { showTDWorldMap(); }
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

// ── Drill queue ────────────────────────────────────────────────
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

// ── Dungeon: floor list with acts ──────────────────────────────
function showDungeonMap() {
  mode = 'dungeon'; dungeonMapData = null;
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-map');

  const area = EL.contentArea;
  area.innerHTML = `
    <div class="dungeon-map">
      <div class="dungeon-map-header">
        <h2>Dungeon</h2>
        <p>Navigate branching paths, collect relics, conquer all nine floors.</p>
        <div class="dungeon-header-row">
          ${renderRelicBar()}
          <button class="btn-dungeon-shop" id="btn-dungeon-shop">🛒 Shop <span class="gold-badge-inline">🪙 ${gold}</span></button>
        </div>
      </div>
      <div class="floor-list" id="floor-list"></div>
    </div>`;

  document.getElementById('btn-dungeon-shop').addEventListener('click', openShopFromMap);

  const list = document.getElementById('floor-list');
  let lastAct = -1;

  for (let f = 1; f <= 9; f++) {
    const qs      = allQuestions.filter(q => q.part === f);
    const theme   = FLOOR_THEMES[f];
    const cleared = clearedFloors.has(f);
    const hasQ    = qs.length > 0;
    const actIdx  = ACTS.findIndex(a => a.floors.includes(f));
    const act     = ACTS[actIdx];

    if (actIdx !== lastAct) {
      lastAct = actIdx;
      const ah = document.createElement('div');
      ah.className = `act-header act-${actIdx + 1}`;
      ah.innerHTML = `<span class="act-emoji">${act.emoji}</span><div><div class="act-name">${act.name}</div><div class="act-subtitle">${act.subtitle}</div></div>`;
      list.appendChild(ah);
    }

    const card = document.createElement('div');
    card.className = `floor-card ${cleared ? 'cleared' : ''} ${!hasQ ? 'locked' : ''}`;
    card.style.setProperty('--floor-color', theme.color);
    card.innerHTML = `
      <div class="floor-emoji">${theme.emoji}</div>
      <div class="floor-info">
        <div class="floor-name">Floor ${f}: ${theme.name}</div>
        <div class="floor-sub">${PART_NAMES[f]} · ${qs.length} questions</div>
        ${cleared ? `<div class="floor-cleared-badge">CLEARED ✓</div>` : ''}
      </div>
      <div class="floor-action">${cleared ? '🏆' : hasQ ? '▶' : '🔒'}</div>`;
    if (hasQ) card.addEventListener('click', () => enterDungeonFloor(f));
    list.appendChild(card);
  }
}

// ── Dungeon: map row-size helper ───────────────────────────────
function getRowSizes(n) {
  if (n <= 0)  return [];
  if (n === 1) return [1];
  if (n === 2) return [1, 1];
  if (n === 3) return [1, 2];
  if (n === 4) return [2, 2];
  if (n === 5) return [2, 2, 1];
  if (n === 6) return [2, 2, 2];
  if (n === 7) return [2, 3, 2];
  if (n === 8) return [3, 3, 2];
  if (n === 9) return [3, 3, 3];
  if (n === 10) return [3, 4, 3];
  if (n === 11) return [3, 3, 2, 3];
  if (n === 12) return [3, 3, 3, 3];
  if (n === 13) return [3, 3, 4, 3];
  if (n === 14) return [3, 4, 4, 3];
  if (n === 15) return [3, 4, 4, 4];
  if (n === 16) return [4, 4, 4, 4];
  if (n === 17) return [3, 4, 4, 3, 3];
  if (n === 18) return [3, 4, 4, 4, 3];
  if (n === 19) return [4, 4, 4, 4, 3];
  return [4, 4, 4, 4, 4];
}

// ── Dungeon: generate branching map with room types ────────────
function generateFloorMap(floorNum) {
  const daySeed = todayKey().split('-').reduce((a, n) => a * 31 + parseInt(n, 10), 1);
  const seed    = floorNum * 9999 + daySeed;
  const floorQs = seededShuffle(allQuestions.filter(q => q.part === floorNum), seed);
  if (floorQs.length === 0) return null;

  const boss = floorQs[floorQs.length - 1];
  const pool = floorQs.slice(0, -1);

  const actIdx   = ACTS.findIndex(a => a.floors.includes(floorNum));
  const actMax   = [8, 14, 20][actIdx] ?? 8;
  const nodeCount = Math.min(pool.length, actMax);
  const rowSizes  = getRowSizes(nodeCount);

  let s = Math.abs(seed) || 1;
  function rng() { s = (s * 1664525 + 1013904223) & 0x7FFFFFFF; return Math.abs(s); }

  const nodes = [];
  for (let row = 0; row < rowSizes.length; row++) {
    const count         = rowSizes[row];
    const isLastContent = row === rowSizes.length - 1;
    for (let col = 0; col < count; col++) {
      let roomType;
      if (isLastContent) {
        roomType = 'elite';
      } else {
        const r = rng() % 10;
        roomType = r < 4 ? 'combat' : r < 6 ? 'elite' : r < 7 ? 'treasure' : r < 8 ? 'shop' : 'rest';
      }
      nodes.push({ id: `r${row}-${col}`, row, col, colTotal: count, roomType, q: null });
    }
  }

  const bossRow = rowSizes.length;
  nodes.push({ id: 'boss', row: bossRow, col: 0, colTotal: 1, roomType: 'boss', q: boss });

  const questionNodes = nodes.filter(nd => nd.roomType !== 'rest' && nd.roomType !== 'boss' && nd.roomType !== 'shop');
  let qIdx = 0;
  for (const nd of questionNodes) { nd.q = pool[qIdx++ % (pool.length || 1)]; }

  const edges = [];
  if (rowSizes.length === 0) return { nodes, edges, totalRows: 1 };

  for (let row = 0; row < rowSizes.length; row++) {
    const cur  = nodes.filter(nd => nd.row === row);
    const next = nodes.filter(nd => nd.row === row + 1);
    if (!next.length) continue;
    const outMap = new Map(cur.map(nd  => [nd.id, new Set()]));
    const inMap  = new Map(next.map(nd => [nd.id, new Set()]));
    for (const nd of cur) {
      const tgt = next[rng() % next.length];
      edges.push({ from: nd.id, to: tgt.id });
      outMap.get(nd.id).add(tgt.id); inMap.get(tgt.id).add(nd.id);
    }
    for (const nn of next) {
      if (!inMap.get(nn.id).size) {
        const src = cur[rng() % cur.length];
        edges.push({ from: src.id, to: nn.id });
        outMap.get(src.id).add(nn.id); inMap.get(nn.id).add(src.id);
      }
    }
    for (const nd of cur) {
      if (rng() % 3 === 0) {
        const avail = next.filter(nn => !outMap.get(nd.id).has(nn.id));
        if (avail.length) { const tgt = avail[rng() % avail.length]; edges.push({ from: nd.id, to: tgt.id }); outMap.get(nd.id).add(tgt.id); }
      }
    }
  }

  return { nodes, edges, totalRows: rowSizes.length + 1 };
}

// ── Dungeon: enter floor ───────────────────────────────────────
function enterDungeonFloor(floorNum) {
  dungeonFloor          = floorNum;
  dungeonHp             = getMaxHp();
  isBossRoom            = false;
  sessionCorrect        = 0; sessionTotal = 0; sessionXpEarned = 0;
  answered              = false; current = null;
  dungeonRoomContext    = 'combat';
  dungeonFirstWrongUsed = false;
  dungeonReviveUsed     = false;
  activeWard            = false;
  activeSurge           = false;
  dungeonCurrentNodeId  = null;
  dungeonActiveNodeId   = null;
  dungeonClearedNodes   = new Set();
  dungeonMapData        = generateFloorMap(floorNum);
  if (!dungeonMapData) return;
  dungeonFloorPool = allQuestions.filter(q => q.part === floorNum);
  showFloorMapScreen();
}

// ── Dungeon: floor map screen ──────────────────────────────────
function showFloorMapScreen() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-floor-map', { floor: dungeonFloor });

  const theme = FLOOR_THEMES[dungeonFloor];
  const area  = EL.contentArea;
  area.innerHTML = `
    <div class="dungeon-floor-map">
      <div class="dfm-header">
        <div class="dfm-title">Floor ${dungeonFloor}: ${theme.name}</div>
        <div class="dfm-sub">Choose your path</div>
        ${renderRelicBar()}
      </div>
      <div class="dfm-map-wrap" id="dfm-map-wrap"></div>
      <div class="map-legend">
        <span class="legend-item"><span class="legend-node combat">⚔️</span> Combat</span>
        <span class="legend-item"><span class="legend-node elite">💀</span> Elite</span>
        <span class="legend-item"><span class="legend-node rest">🔥</span> Rest</span>
        <span class="legend-item"><span class="legend-node treasure">💰</span> Treasure</span>
        <span class="legend-item"><span class="legend-node shop">🛒</span> Shop</span>
        <span class="legend-item"><span class="legend-node boss">${theme.emoji}</span> Boss</span>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    const wrap = document.getElementById('dfm-map-wrap');
    if (wrap) renderMapNodes(wrap);
  });
}

// ── Dungeon: render SVG node map ───────────────────────────────
function renderMapNodes(container) {
  const { nodes, edges, totalRows } = dungeonMapData;
  const avail = getAvailableNodes();
  const W = Math.floor(container.getBoundingClientRect().width) || 300;
  const ROW_H = 68, PAD_X = 36, PAD_Y = 38;
  const H = PAD_Y * 2 + (totalRows - 1) * ROW_H;

  function nodePos(nd) {
    return {
      x: PAD_X + (nd.col + 0.5) / nd.colTotal * (W - PAD_X * 2),
      y: PAD_Y + (totalRows - 1 - nd.row) * ROW_H,
    };
  }

  let svgLines = '';
  const seen = new Set();
  for (const e of edges) {
    const key = `${e.from}→${e.to}`;
    if (seen.has(key)) continue; seen.add(key);
    const fn = nodes.find(n => n.id === e.from), tn = nodes.find(n => n.id === e.to);
    if (!fn || !tn) continue;
    const fp = nodePos(fn), tp = nodePos(tn);
    const cls = dungeonClearedNodes.has(e.from) && dungeonClearedNodes.has(e.to) ? 'map-edge cleared'
              : dungeonClearedNodes.has(e.from) && avail.includes(e.to) ? 'map-edge active'
              : 'map-edge';
    svgLines += `<line class="${cls}" x1="${fp.x.toFixed(1)}" y1="${fp.y.toFixed(1)}" x2="${tp.x.toFixed(1)}" y2="${tp.y.toFixed(1)}"/>`;
  }

  const ROOM_ICONS = { combat: '⚔️', elite: '💀', rest: '🔥', treasure: '💰', shop: '🛒', boss: FLOOR_THEMES[dungeonFloor].emoji };

  let nodesHTML = '';
  for (const nd of nodes) {
    const pos = nodePos(nd);
    const nr  = nd.roomType === 'boss' ? 26 : 22;
    const isAvail   = avail.includes(nd.id);
    const isCleared = dungeonClearedNodes.has(nd.id);
    const cls = ['map-node', nd.roomType, isAvail ? 'available' : '', isCleared ? 'cleared' : ''].filter(Boolean).join(' ');
    nodesHTML += `<button class="${cls}"
      style="left:${(pos.x-nr).toFixed(0)}px;top:${(pos.y-nr).toFixed(0)}px;width:${nr*2}px;height:${nr*2}px;"
      data-node-id="${nd.id}" ${!isAvail ? 'disabled' : ''}>
      ${ROOM_ICONS[nd.roomType] || '⚔️'}
    </button>`;
  }

  container.style.position = 'relative';
  container.style.height   = H + 'px';
  container.innerHTML = `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svgLines}</svg>${nodesHTML}`;
  container.querySelectorAll('.map-node:not([disabled])').forEach(btn =>
    btn.addEventListener('click', () => startNodeEncounter(btn.dataset.nodeId)));
}

// ── Dungeon: available nodes ───────────────────────────────────
function getAvailableNodes() {
  const { nodes, edges } = dungeonMapData;
  if (dungeonCurrentNodeId === null) return nodes.filter(nd => nd.row === 0).map(nd => nd.id);
  return edges.filter(e => e.from === dungeonCurrentNodeId).map(e => e.to).filter(id => !dungeonClearedNodes.has(id));
}

// ── Dungeon: start encounter ───────────────────────────────────
function startNodeEncounter(nodeId) {
  const nd = dungeonMapData.nodes.find(n => n.id === nodeId);
  if (!nd) return;

  if (nd.roomType === 'rest') { startRestSite(nodeId); return; }
  if (nd.roomType === 'shop') { startShopNode(nodeId); return; }

  activeWard  = false;
  activeSurge = false;

  dungeonActiveNodeId  = nodeId;
  dungeonRoomContext   = nd.roomType;
  isBossRoom           = nd.roomType === 'boss';
  current              = nd.q;
  answered             = false;

  EL.contentArea.innerHTML = '';
  EL.cardArea.style.display  = 'block';
  EL.bottomBar.style.display = 'block';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-encounter', { floor: dungeonFloor });

  const roomNum   = dungeonClearedNodes.size + 1;
  const roomTotal = dungeonMapData.nodes.length;
  renderQuestion(current, roomNum, roomTotal, buildEnemyForNode(nd));

  EL.btnCheck.disabled      = true;
  EL.btnCheck.style.display = 'block';
  EL.btnNext.classList.remove('show');
  EL.btnNext.textContent = 'Continue →';

  bindItemTray();
}

// ── Dungeon: rest site ─────────────────────────────────────────
function startRestSite(nodeId) {
  dungeonActiveNodeId = nodeId;
  dungeonRoomContext  = 'rest';
  answered            = true;

  EL.contentArea.innerHTML = '';
  EL.cardArea.style.display  = 'block';
  EL.bottomBar.style.display = 'block';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-encounter', { floor: dungeonFloor });

  const canHeal = dungeonHp < getMaxHp();
  const xpBonus = relics.has('scholars_ring') ? ' · +50 XP' : '';
  const card = EL.qCard;
  card.innerHTML = `
    <div class="rest-site-card">
      <div class="rest-site-icon">🔥</div>
      <div class="rest-site-title">Rest Site</div>
      <div class="rest-site-desc">${canHeal
        ? `You settle in and recover.<br><strong>HP +1 restored</strong>${xpBonus}.`
        : `You rest, but you are already at full health.${xpBonus ? `<br>${xpBonus.trim()}.` : ''}`}</div>
    </div>`;

  EL.btnCheck.style.display = 'none';
  const btnNext = EL.btnNext;
  btnNext.classList.add('show');
  btnNext.textContent = canHeal ? `Rest (+1 HP) →` : 'Rest →';
}

// ── Dungeon: shop node ─────────────────────────────────────────
function startShopNode(nodeId) {
  dungeonActiveNodeId = nodeId;
  dungeonRoomContext  = 'shop';
  answered            = true;

  EL.contentArea.innerHTML = '';
  EL.cardArea.style.display  = 'block';
  EL.bottomBar.style.display = 'block';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-encounter', { floor: dungeonFloor });

  _renderShopContent(EL.qCard, null);

  EL.btnCheck.style.display = 'none';
  const btnNext = EL.btnNext;
  btnNext.classList.add('show');
  btnNext.textContent = 'Leave Shop →';
}

// ── Shop: open from dungeon map ────────────────────────────────
function openShopFromMap() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-map');

  const area = EL.contentArea;
  area.innerHTML = '<div id="shop-map-wrap"></div>';
  _renderShopContent(document.getElementById('shop-map-wrap'), () => {
    area.innerHTML = ''; showDungeonMap();
  });
}

// ── Shop: shared rendering ─────────────────────────────────────
function _renderShopContent(container, onLeave) {
  container.innerHTML = `
    <div class="shop-screen-page">
      <div class="shop-header-row">
        <span class="shop-icon-title">🛒 Item Shop</span>
        <span class="gold-display">🪙 <span class="shop-gold-live">${gold}</span></span>
      </div>
      <p class="shop-sub">Items earned here persist between floors</p>
      <div class="shop-items-list" id="shop-items-list">
        ${_renderShopItems()}
      </div>
      ${onLeave ? `<button class="btn-leave-shop" id="btn-leave-shop">← Return to Map</button>` : ''}
    </div>`;

  if (onLeave) container.querySelector('#btn-leave-shop').addEventListener('click', onLeave);
  _bindShopBuyButtons(container);
}

function _renderShopItems() {
  return ITEMS.map(item => {
    const owned     = itemInventory[item.id] || 0;
    const canAfford = gold >= item.cost;
    return `
      <div class="shop-item-card ${canAfford ? '' : 'cant-afford'}" data-item-id="${item.id}">
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-body">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
        </div>
        <div class="shop-item-right">
          <div class="shop-item-stock">Owned: ${owned}</div>
          <div class="shop-item-cost">🪙 ${item.cost}</div>
          <button class="btn-shop-buy" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Buy' : 'Too costly'}
          </button>
        </div>
      </div>`;
  }).join('');
}

function _bindShopBuyButtons(container) {
  container.querySelectorAll('.btn-shop-buy:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      const item   = ITEMS.find(i => i.id === itemId);
      if (!item || !spendGold(item.cost)) return;
      itemInventory[item.id] = (itemInventory[item.id] || 0) + 1;
      saveGameState();
      unlockIfNew('shopaholic');
      showAchievementToast({ icon: item.icon, name: 'Purchased!', desc: `${item.name} added to inventory` });
      const listEl = container.querySelector('.shop-items-list');
      if (listEl) { listEl.innerHTML = _renderShopItems(); _bindShopBuyButtons(container); }
      container.querySelectorAll('.shop-gold-live').forEach(el => { el.textContent = gold; });
      refreshItemTray();
    });
  });
}

// ── Item tray ──────────────────────────────────────────────────
function renderItemTray() {
  const total = ITEMS.reduce((n, it) => n + (itemInventory[it.id] || 0), 0);
  const label = `<div class="item-tray-label">ITEMS${total > 0 ? ` · ${total} available` : ' · none'}</div>`;
  const slots  = ITEMS.map(item => {
    const count      = itemInventory[item.id] || 0;
    const isActive   = (item.id === 'ward' && activeWard) || (item.id === 'surge' && activeSurge);
    const isEmpty    = count === 0;
    const isUnusable = answered && (item.id === 'fifty_fifty' || item.id === 'swap');
    return `
      <button class="item-slot${isEmpty ? ' empty' : ''}${isActive ? ' active' : ''}${isUnusable ? ' unusable' : ''}"
        data-item-id="${item.id}" title="${item.name}: ${item.desc}" ${isEmpty ? 'disabled' : ''}>
        <span class="item-slot-icon">${item.icon}</span>
        ${count > 0 ? `<span class="item-slot-count">×${count}</span>` : ''}
        ${isActive ? '<span class="item-slot-active-dot"></span>' : ''}
      </button>`;
  }).join('');
  return `${label}<div class="item-tray">${slots}</div>`;
}

function bindItemTray() {
  document.querySelectorAll('#item-tray-wrap .item-slot:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      if (answered && (itemId === 'fifty_fifty' || itemId === 'swap')) return;
      useItem(itemId);
    });
  });
}

function refreshItemTray() {
  const wrap = document.getElementById('item-tray-wrap');
  if (!wrap) return;
  wrap.innerHTML = renderItemTray();
  bindItemTray();
}

function useItem(itemId) {
  const item = ITEMS.find(i => i.id === itemId);
  if (!item || (itemInventory[itemId] || 0) <= 0) return;

  if (itemId === 'fifty_fifty') {
    if (answered || !current || current.type !== 'mc') return;
    const card     = EL.qCard;
    const allOpts  = [...card.querySelectorAll('.opt')];
    const wrongOpts = allOpts.filter(o => parseInt(o.dataset.index, 10) !== current.correct && !o.classList.contains('selected'));
    shuffle(wrongOpts).slice(0, 2).forEach(o => {
      o.style.opacity = '0.2'; o.style.pointerEvents = 'none'; o.style.transition = 'opacity .25s';
    });
    itemInventory[itemId]--;
    saveGameState(); unlockIfNew('item_user');
    refreshItemTray();
    showAchievementToast({ icon: '🎲', name: '50/50!', desc: 'Two wrong answers eliminated' });

  } else if (itemId === 'swap') {
    if (answered) return;
    const pool = dungeonFloorPool.filter(q => q.id !== current?.id);
    if (pool.length === 0) return;
    current = pool[Math.floor(Math.random() * pool.length)];
    const nd = dungeonMapData?.nodes.find(n => n.id === dungeonActiveNodeId);
    const roomNum   = dungeonClearedNodes.size + 1;
    const roomTotal = dungeonMapData.nodes.length;
    renderQuestion(current, roomNum, roomTotal, nd ? buildEnemyForNode(nd) : null);
    EL.btnCheck.disabled      = true;
    EL.btnCheck.style.display = 'block';
    EL.btnNext.classList.remove('show');
    itemInventory[itemId]--;
    saveGameState(); unlockIfNew('item_user');
    bindItemTray();
    showAchievementToast({ icon: '🔄', name: 'Swapped!', desc: 'Fresh question loaded' });

  } else if (itemId === 'ward') {
    if (activeWard) return;
    activeWard = true;
    itemInventory[itemId]--;
    saveGameState(); unlockIfNew('item_user');
    refreshItemTray();
    showAchievementToast({ icon: '🛡️', name: 'Ward Active!', desc: 'Next HP loss blocked' });

  } else if (itemId === 'surge') {
    if (activeSurge) return;
    activeSurge = true;
    itemInventory[itemId]--;
    saveGameState(); unlockIfNew('item_user');
    refreshItemTray();
    showAchievementToast({ icon: '⚡', name: 'Power Surge!', desc: 'Next correct answer earns double XP' });
  }
}

function buildEnemyForNode(nd) {
  const theme = FLOOR_THEMES[dungeonFloor];
  if (nd.roomType === 'boss') return { name: theme.boss, roomType: 'boss', emoji: theme.emoji };
  const emojiList = nd.roomType === 'elite' ? ELITE_MINIONS : FLOOR_MINIONS;
  const nameIdx   = (nd.row * 10 + nd.col) % ENEMY_NAMES.length;
  const prefix    = nd.roomType === 'elite' ? 'Elite ' : '';
  return {
    name:     prefix + ENEMY_NAMES[nameIdx],
    roomType: nd.roomType,
    emoji:    emojiList[(dungeonFloor - 1) % emojiList.length],
  };
}

// ── Dungeon: relic choice ──────────────────────────────────────
function showRelicChoice(onComplete) {
  const unowned = RELICS.filter(r => !relics.has(r.id));
  if (unowned.length === 0) {
    xp += 200; sessionXpEarned += 200; saveGameState(); refreshTopBarStats();
    onComplete(); return;
  }

  const choices = shuffle(unowned).slice(0, 3);
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('dungeon-map');

  const area = EL.contentArea;
  area.innerHTML = `
    <div class="relic-choice-screen">
      <div class="relic-choice-title">✨ Floor Cleared!</div>
      <div class="relic-choice-sub">Choose a Relic to carry forward</div>
      <div class="relic-options" id="relic-options">
        ${choices.map(r => `
          <div class="relic-card" data-relic-id="${r.id}">
            <div class="relic-card-icon">${r.icon}</div>
            <div class="relic-card-body">
              <div class="relic-card-name">${r.name}</div>
              <div class="relic-card-desc">${r.desc}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  document.querySelectorAll('.relic-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.relicId;
      relics.add(id); saveGameState();
      checkAchievements(true, 'normal');
      onComplete();
    });
  });
}

// ── Dungeon: continue after encounter ─────────────────────────
function handleDungeonContinue() {
  if (!dungeonActiveNodeId) { showFloorMapScreen(); return; }

  const nd = dungeonMapData.nodes.find(n => n.id === dungeonActiveNodeId);

  if (nd?.roomType === 'rest') {
    if (dungeonHp < getMaxHp()) dungeonHp++;
    if (relics.has('scholars_ring')) { xp += 50; sessionXpEarned += 50; saveGameState(); refreshTopBarStats(); }
  }

  if (dungeonHp <= 0 && relics.has('phoenix_ash') && !dungeonReviveUsed) {
    dungeonReviveUsed = true;
    dungeonHp = 1;
    showAchievementToast({ icon: '🔮', name: 'Phoenix Ash', desc: 'Revived with 1 HP!' });
    const tc = document.querySelector('.top-bar .top-center');
    if (tc) tc.innerHTML = renderHpHtml();
  }

  dungeonClearedNodes.add(dungeonActiveNodeId);
  dungeonCurrentNodeId = dungeonActiveNodeId;
  dungeonActiveNodeId  = null;
  current = null; answered = false;

  if (dungeonHp <= 0)                    { showDungeonFailed(); return; }
  if (dungeonClearedNodes.has('boss'))   { showDungeonFloorComplete(); return; }
  if (!getAvailableNodes().length)       { showDungeonFloorComplete(); return; }

  showFloorMapScreen();
}

// ── Show next question (Study / Drill only) ────────────────────
function showNext() {
  if (mode === 'dungeon') return;
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

  renderQuestion(current, currentQNum, currentQTotal, null);
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
function renderQuestion(q, num, total, enemy) {
  const card      = EL.qCard;
  const typeLabel = q.type === 'tf' ? 'True / False' : 'Multiple Choice';
  const numLabel  = mode === 'dungeon' ? `Room ${num}/${total}` : `Q${num}/${total}`;

  const optHTML = q.type === 'mc'
    ? `<div class="options">${q.options.map((o, i) =>
        `<div class="opt" data-index="${i}"><div class="opt-letter">${LETTERS[i]}</div><div class="opt-text">${o}</div></div>`
      ).join('')}</div>`
    : `<div class="tf-options"><div class="tf-opt" data-value="true">True</div><div class="tf-opt" data-value="false">False</div></div>`;

  const rt = enemy ? ROOM_TYPES[enemy.roomType] : null;
  const roomBanner = rt ? `<div class="room-type-banner room-${enemy.roomType}">${rt.icon} ${rt.label.toUpperCase()}</div>` : '';

  const enemyHTML = enemy ? `
    <div class="dungeon-enemy ${enemy.roomType}">
      <div class="enemy-sprite enemy-idle" id="enemy-sprite">${enemy.emoji}</div>
      <div class="enemy-details">
        <div class="enemy-name">${enemy.name}</div>
        <div class="enemy-type-badge">${
          enemy.roomType === 'boss'    ? '☠️ BOSS'     :
          enemy.roomType === 'elite'   ? '💀 ELITE'    :
          enemy.roomType === 'treasure'? '💰 TREASURE' : '⚔️ MINION'
        }</div>
        <div class="enemy-hp-wrap"><div class="enemy-hp-fill" id="enemy-hp-fill"></div></div>
      </div>
    </div>` : '';

  const itemTrayHTML = mode === 'dungeon'
    ? `<div class="item-tray-wrap" id="item-tray-wrap">${renderItemTray()}</div>`
    : '';

  card.innerHTML = `
    ${roomBanner}
    ${enemyHTML}
    <div class="card-header">
      <div class="card-header-left"><span class="q-id">#${q.num}</span><div class="part-chip">Part ${q.part}</div></div>
      <div class="q-num">${numLabel}</div>
    </div>
    <div class="q-type">${typeLabel}</div>
    <p class="q-stem">${q.stem}</p>
    ${optHTML}
    ${itemTrayHTML}
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

  refreshItemTray();

  if (mode === 'dungeon') {
    const sprite = document.getElementById('enemy-sprite');
    const hpBar  = document.getElementById('enemy-hp-fill');
    if (isCorrect) {
      if (hpBar) { hpBar.style.transition = 'width .28s ease'; hpBar.style.width = '0%'; }
      setTimeout(() => {
        if (sprite) { sprite.classList.remove('enemy-idle'); sprite.classList.add('enemy-die'); }
        setTimeout(() => revealAnswerResult(isCorrect), 540);
      }, 280);
    } else {
      if (sprite) {
        sprite.classList.remove('enemy-idle');
        sprite.classList.add('enemy-attack');
        setTimeout(() => sprite?.classList.remove('enemy-attack'), 460);
      }
      setTimeout(() => revealAnswerResult(isCorrect), 440);
    }
  } else {
    revealAnswerResult(isCorrect);
  }
}

function revealAnswerResult(isCorrect) {
  if (isCorrect) sessionCorrect++;

  // HP loss: ward > coffee_flask > take damage (treasure always safe)
  if (mode === 'dungeon' && !isCorrect) {
    if (dungeonRoomContext !== 'treasure') {
      if (activeWard) {
        activeWard = false;
        showAchievementToast({ icon: '🛡️', name: 'Ward!', desc: 'HP damage blocked' });
        refreshItemTray();
      } else if (relics.has('coffee_flask') && !dungeonFirstWrongUsed) {
        dungeonFirstWrongUsed = true;
        showAchievementToast({ icon: '☕', name: 'Coffee Flask', desc: 'HP damage blocked!' });
      } else {
        loseHp();
      }
    }
  }

  const ctx = mode === 'dungeon' ? dungeonRoomContext : (dailyActive ? 'daily' : 'normal');
  awardXP(isCorrect, ctx);
  checkAchievements(isCorrect, ctx);
  trackAccuracy(current.part, isCorrect);
  if (studyPart && isCorrect && checkPerfectPart(studyPart)) unlockIfNew('perfect_part');

  // Treasure correct: also award a random item
  if (mode === 'dungeon' && isCorrect && dungeonRoomContext === 'treasure') {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    itemInventory[item.id] = (itemInventory[item.id] || 0) + 1;
    saveGameState();
    setTimeout(() => {
      showAchievementToast({ icon: item.icon, name: '💰 Treasure Found!', desc: `${item.name} added to your items` });
      refreshItemTray();
    }, 700);
  }

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
  const btnNext = EL.btnNext;
  btnNext.classList.add('show');
  if (mode === 'dungeon' && dungeonHp <= 0 && !(relics.has('phoenix_ash') && !dungeonReviveUsed)) {
    btnNext.textContent = 'View Results →';
  }
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

function showDungeonFloorComplete() {
  const isFirstClear = !clearedFloors.has(dungeonFloor);
  clearedFloors.add(dungeonFloor); saveGameState();
  unlockIfNew('dungeon_first');
  if (clearedFloors.size === 9) unlockIfNew('dungeon_all');

  if (isFirstClear) { showRelicChoice(() => _renderFloorCompleteScreen()); }
  else              { _renderFloorCompleteScreen(); }
}

function _renderFloorCompleteScreen() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.contentArea.innerHTML = '';

  const theme  = FLOOR_THEMES[dungeonFloor];
  const hpLeft = '❤️'.repeat(dungeonHp) + '🖤'.repeat(getMaxHp() - dungeonHp);
  const xpLine = sessionXpEarned > 0 ? `<div class="xp-earned">+${sessionXpEarned.toLocaleString()} XP earned</div>` : '';

  const screen = EL.completeScreen;
  screen.classList.add('show');
  screen.innerHTML = `
    <div class="complete-icon">${theme.emoji}</div>
    <h2>Floor ${dungeonFloor} Cleared!</h2>
    <div class="score-big">${sessionCorrect}/${sessionTotal}</div>
    ${xpLine}
    <p>${theme.name} conquered.<br>${hpLeft}</p>
    ${dungeonFloor < 9 && allQuestions.filter(q => q.part === dungeonFloor + 1).length > 0
      ? `<button class="btn-restart" id="btn-next-floor">Next Floor →</button>` : ''}
    <button class="btn-reset-all" id="btn-dungeon-map">← Dungeon Map</button>`;

  document.getElementById('btn-dungeon-map').addEventListener('click', () => { screen.classList.remove('show'); showDungeonMap(); });
  document.getElementById('btn-next-floor')?.addEventListener('click', () => { screen.classList.remove('show'); enterDungeonFloor(dungeonFloor + 1); });
}

function showDungeonFailed() {
  hideQuestion();
  EL.progressWrap.style.display = 'none';
  EL.contentArea.innerHTML = '';

  const theme  = FLOOR_THEMES[dungeonFloor];
  const xpLine = sessionXpEarned > 0 ? `<div class="xp-earned">+${sessionXpEarned.toLocaleString()} XP (partial)</div>` : '';

  const screen = EL.completeScreen;
  screen.classList.add('show');
  screen.innerHTML = `
    <div class="complete-icon">💀</div>
    <h2>Dungeon Failed</h2>
    <div class="score-big" style="color:#EF4444">${sessionCorrect}/${sessionTotal}</div>
    ${xpLine}
    <p>You fell in ${theme.name}.<br>Courage is trying again.</p>
    <button class="btn-restart" id="btn-retry">Retry Floor ${dungeonFloor}</button>
    <button class="btn-reset-all" id="btn-dungeon-map">← Dungeon Map</button>`;

  document.getElementById('btn-retry').addEventListener('click', () => { screen.classList.remove('show'); enterDungeonFloor(dungeonFloor); });
  document.getElementById('btn-dungeon-map').addEventListener('click', () => { screen.classList.remove('show'); showDungeonMap(); });
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
  EL.btnNext.addEventListener('click', () => {
    if (mode === 'dungeon') handleDungeonContinue();
    else showNext();
  });
}

// ── Helpers ────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
//  TOWER DEFENSE GAME
// ══════════════════════════════════════════════════════════════

const TD_COLS = 9, TD_ROWS = 10;
const TD_STARS_KEY = 'td_stars_v1';

// ── Audio engine ───────────────────────────────────────────────

const tdAudio = (() => {
  let actx = null, muted = false;

  function ac() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  // pan: -1 (left) … 0 (centre) … +1 (right); omit or pass 0 for no panning
  function tone(freq, type, dur, gainPeak, freqEnd, pan) {
    const c = ac(); if (!c || muted) return;
    const g = c.createGain(), o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), c.currentTime + dur);
    g.gain.setValueAtTime(gainPeak, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    if (pan) {
      try {
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(p); p.connect(c.destination);
      } catch(_) { g.connect(c.destination); }
    } else {
      g.connect(c.destination);
    }
    o.start(c.currentTime); o.stop(c.currentTime + dur + 0.02);
  }

  function arpeggio(notes, type, noteDur, gain) {
    const c = ac(); if (!c || muted) return;
    notes.forEach((freq, i) => {
      const t = c.currentTime + i * noteDur;
      const g = c.createGain(), o = c.createOscillator();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 1.6);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + noteDur * 1.6 + 0.02);
    });
  }

  // colFrac: tower/enemy x as 0–1 fraction of canvas width → pan value
  function colPan(colFrac) { return (colFrac * 2 - 1) * 0.75; }

  return {
    // positional SFX — pass colFrac (0–1) for stereo placement
    shoot:     (colFrac=0.5) => tone(900, 'square',   0.07, 0.08, 420, colPan(colFrac)),
    hit:       (colFrac=0.5) => tone(260, 'sine',     0.10, 0.12, 110, colPan(colFrac)),
    death:     (colFrac=0.5) => tone(360, 'sawtooth', 0.18, 0.18, 55,  colPan(colFrac)),
    place:     (colFrac=0.5) => tone(430, 'sine',     0.14, 0.16, 390, colPan(colFrac)),
    // non-positional SFX
    lifeLost:  () => tone(440, 'sine',     0.45, 0.28, 185),
    waveStart: () => arpeggio([330, 415, 523], 'square', 0.09, 0.11),
    correct:   () => arpeggio([523, 659, 784], 'sine',   0.10, 0.14),
    wrong:     () => tone(200, 'sawtooth', 0.22, 0.16, 140),
    victory:   () => arpeggio([523, 659, 784, 1047], 'sine', 0.12, 0.16),
    gameOver:  () => arpeggio([330, 277, 220, 165], 'sawtooth', 0.16, 0.16),
    get muted() { return muted; },
    get ctx()   { return actx; },
    toggleMute() { muted = !muted; return muted; },
  };
})();

// ── Background music (T-2 / T-4) ──────────────────────────────
const tdMusic = (() => {
  let actx = null, masterGain = null;
  let playing = false, paused = false;
  let beat = 0, nextBeat = 0, timer = null;
  let intensity = 1; // 1=melody+bass  2=+harmony  3=+percussion

  const BPM  = 124;
  const S    = (60 / BPM) / 2;   // 8th-note duration in seconds
  const LOOK = 0.25;              // schedule this far ahead

  // C natural minor pentatonic (C Eb F G Bb)
  const N = {
    C3:130.81, F3:174.61, G3:196.00, Bb3:233.08,
    C4:261.63, Eb4:311.13, F4:349.23, G4:392.00, Bb4:466.16,
    C5:523.25, Eb5:622.25, F5:698.46, G5:783.99,
  };

  // 16-step (8th-note) patterns; 0 = rest
  const MELODY = [N.C5,0,N.Eb5,0,N.G5,N.Bb4,N.G4,0, N.F4,0,N.Eb4,N.C4,N.Eb4,N.G4,N.F4,0];
  const BASS   = [N.C3,N.G3,N.Bb3,N.F3];              // one note per 4 steps
  const HARM   = [N.G4,0,N.Bb4,0,N.Eb5,N.G4,N.Eb4,0, N.C4,0,N.G4,N.Eb4,N.G4,N.Bb4,N.G4,0];

  function ac() {
    if (!actx) {
      actx = tdAudio.ctx;
      if (!actx) {
        try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
      }
    }
    if (actx.state === 'suspended') actx.resume();
    if (!masterGain) {
      masterGain = actx.createGain();
      masterGain.gain.value = tdAudio.muted ? 0 : 0.16;
      masterGain.connect(actx.destination);
    }
    return actx;
  }

  function schedNote(freq, type, start, dur, vol) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + dur + 0.01);
  }

  function schedKick(start) {
    const g = actx.createGain(), o = actx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, start);
    o.frequency.exponentialRampToValueAtTime(38, start + 0.09);
    g.gain.setValueAtTime(0.55, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
    o.connect(g); g.connect(masterGain);
    o.start(start); o.stop(start + 0.15);
  }

  function schedHihat(start, open) {
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * 0.08), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(), g = actx.createGain();
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const dur = open ? 0.10 : 0.035;
    g.gain.setValueAtTime(0.12, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.buffer = buf;
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(start); src.stop(start + dur + 0.01);
  }

  function pump() {
    if (!playing || paused) return;
    const c = ac(); if (!c) return;
    const now = c.currentTime;

    while (nextBeat < now + LOOK) {
      const b = beat % 16;
      const t = nextBeat;

      if (intensity >= 1) {
        if (MELODY[b]) schedNote(MELODY[b], 'square',   t, S * 0.72, 0.11);
        if (b % 4 === 0) schedNote(BASS[b >> 2], 'sawtooth', t, S * 3.5, 0.13);
      }
      if (intensity >= 2 && HARM[b])
        schedNote(HARM[b], 'triangle', t, S * 0.55, 0.065);
      if (intensity >= 3) {
        if (b === 0 || b === 8) schedKick(t);
        if (b % 2 === 0) schedHihat(t, b === 4 || b === 12);
      }

      beat++;
      nextBeat += S;
    }
    timer = setTimeout(pump, 55);
  }

  return {
    start() {
      const c = ac(); if (!c || playing) return;
      playing = true; paused = false;
      beat = 0; nextBeat = c.currentTime + 0.15;
      pump();
    },
    stop() {
      playing = false;
      clearTimeout(timer); timer = null;
    },
    setPaused(p) {
      paused = p;
      if (!p && playing) {
        const c = actx;
        if (c) nextBeat = c.currentTime + 0.08;
        pump();
      }
    },
    // T-4: scale layers based on enemy pressure
    setIntensity(enemyCount, isBossWave) {
      intensity = isBossWave || enemyCount >= 8 ? 3 : enemyCount >= 4 ? 2 : 1;
    },
    setMuted(m) {
      if (!masterGain || !actx) return;
      masterGain.gain.setTargetAtTime(m ? 0 : 0.16, actx.currentTime, 0.08);
    },
  };
})();

function tdComputePathSet(wps) {
  const s = new Set();
  for (let i = 0; i < wps.length - 1; i++) {
    const [c0,r0] = wps[i], [c1,r1] = wps[i+1];
    if (r0 === r1) {
      const lo = Math.max(0, Math.min(c0,c1)), hi = Math.min(TD_COLS-1, Math.max(c0,c1));
      for (let c = lo; c <= hi; c++) s.add(`${c},${r0}`);
    } else {
      const lo = Math.max(0, Math.min(r0,r1)), hi = Math.min(TD_ROWS-1, Math.max(r0,r1));
      for (let r = lo; r <= hi; r++) s.add(`${c0},${r}`);
    }
  }
  return s;
}

const TD_TOWER_DEFS = [
  { id:'bastion', name:'Bastion', icon:'🏰', cost:60,  color:'#3B82F6', range:3.0, dmg:22,  rate:1.5,  splash:0,
    upgrades:[
      {cost:80,  icon:'🏰', dmg:38,  rate:1.8, range:3.2, splash:0,   glow:'#60A5FA'},
      {cost:150, icon:'🏯', dmg:70,  rate:2.1, range:3.6, splash:0,   glow:'#C084FC'},
    ]},
  { id:'ranger',  name:'Ranger',  icon:'🏹', cost:90,  color:'#10B981', range:4.5, dmg:14,  rate:2.5,  splash:0,
    upgrades:[
      {cost:100, icon:'🏹', dmg:24,  rate:3.2, range:5.0, splash:0,   glow:'#34D399'},
      {cost:180, icon:'🎯', dmg:44,  rate:4.0, range:5.6, splash:0,   glow:'#C084FC'},
    ]},
  { id:'mortar',  name:'Mortar',  icon:'💣', cost:130, color:'#EF4444', range:2.8, dmg:60,  rate:0.55, splash:1.5,
    upgrades:[
      {cost:120, icon:'💣', dmg:100, rate:0.65, range:3.0, splash:1.8, glow:'#F87171'},
      {cost:200, icon:'💥', dmg:180, rate:0.80, range:3.3, splash:2.3, glow:'#C084FC'},
    ]},
];

const TD_ENEMY_DEFS = {
  goblin: { maxHp:80,  spd:1.6, reward:5,  color:'#4ADE80', r:0.28 },
  orc:    { maxHp:220, spd:1.0, reward:12, color:'#FBBF24', r:0.36 },
  scout:  { maxHp:55,  spd:2.6, reward:8,  color:'#F472B6', r:0.22 },
  troll:  { maxHp:480, spd:0.7, reward:28, color:'#C084FC', r:0.42 },
  boss:   { maxHp:2000, spd:0.5, reward:100, color:'#EF4444', r:0.55, isBoss:true, lifeLoss:3 },
};

// ── Pixel-art sprite definitions ──────────────────────────────────────────
// Enemy sprites: { pw, ph, pal:{char→hex}, frames:[[rowStr…],…] }
// Tower sprites: { pw, ph, pals:[{…},{…},{…}], frames:[[rowStr…],…] }
// '.' = transparent pixel. Each row string must be exactly pw chars.
const TD_SPRITES = {

// GOBLIN — 8×10, quick green humanoid
goblin: { pw:8, ph:10,
  pal: { K:'#0D2B0D',G:'#38C048',g:'#1E8830',d:'#124420',
         Y:'#FFD700',p:'#050402',B:'#7A4010',b:'#4A2408',R:'#BC2800',r:'#781800' },
  frames: [
    ['..KKKK..', '.KGGgdK.', 'KGYpGYgK', '.KGgKgGK', '.KKBbKK.',
     '.KbRRbK.', '.KbRrbK.', '..KbKK..', '.KbK.bK.', '.bKK.bb.'],
    ['..KKKK..', '.KGGgdK.', 'KGYpGYgK', '.KGgKgGK', '.KKBbKK.',
     '.KbRRbK.', '.KbRrbK.', '..KbKK..', '.bb.KbK.', '.bb.KKb.'],
  ]},

// ORC — 10×12, stocky orange warrior
orc: { pw:10, ph:12,
  pal: { K:'#2A1800',O:'#E89820',o:'#A06010',d:'#602E00',
         Y:'#FFE000',p:'#050400',B:'#6A3A10',b:'#3A1E04',R:'#882000',r:'#541000' },
  frames: [
    ['..KKKKKK..', '.KOOooOK..', 'KOYpOYpoK.', '.KOoKKoOK.',
     '..KKBbKK..', '.KbRRRRbK.', '.KbRrRrbK.', '.KbRRRRbK.',
     '..KbKKbK..', '.KbKK.KbK.', '.bKKK.KKb.', '..........'],
    ['..KKKKKK..', '.KOOooOK..', 'KOYpOYpoK.', '.KOoKKoOK.',
     '..KKBbKK..', '.KbRRRRbK.', '.KbRrRrbK.', '.KbRRRRbK.',
     '..KbKKbK..', '.KbbbbbbK.', '..KbKKbK..', '..........'],
  ]},

// SCOUT — 7×10, thin pink speedster
scout: { pw:7, ph:10,
  pal: { K:'#3A0030',P:'#E040AA',p:'#A02070',d:'#601040',
         Y:'#FFD700',e:'#050402',B:'#6A3A10',b:'#3A1E04',W:'#F0F0F0',w:'#C0C0C0' },
  frames: [
    ['..KKK..', '.KPPpK.', 'KPYeYpK', '.KPKpPK', '..KpK..',
     '.KbWbK.', '.KbwbK.', '...KK..', '.KbK.bK', '.bK.Kbb'],
    ['..KKK..', '.KPPpK.', 'KPYeYpK', '.KPKpPK', '..KpK..',
     '.KbWbK.', '.KbwbK.', '...KK..', '.bK.KbK', 'bb.K.bK'],
  ]},

// TROLL — 12×14, massive purple brute
troll: { pw:12, ph:14,
  pal: { K:'#1A0A2A',T:'#8040C0',t:'#5020A0',d:'#2A1060',
         Y:'#FFE000',p:'#060402',B:'#5A3010',b:'#3A1808',R:'#AA1800',r:'#6A1000',
         G:'#606060',m:'#303030' },
  frames: [
    ['...KKKKKK...', '..KTTttdK...', '.KTYpTYptK..', '.KTTKKTTtK..',
     '..KKBBbKK...', '.KbGGGGGbK..', '.KbGmGmGbK..', '.KbRRRRRbK..',
     '..KbKKKbK...', '.KbKK.KKbK..', 'KbKKK.KKKbK.', '.KbK...KbK..',
     '..bKK.KKb...', '............'],
    ['...KKKKKK...', '..KTTttdK...', '.KTYpTYptK..', '.KTTKKTTtK..',
     '..KKBBbKK...', '.KbGGGGGbK..', '.KbGmGmGbK..', '.KbRRRRRbK..',
     '..KbKKKbK...', '.KbbbbbbbbK.', '..KbKKKbK...', '...KbKKbK...',
     '....bKKb....', '............'],
  ]},

// BASTION — 10×12, medieval stone tower; pals[0/1/2] for L1/L2/L3
bastion: { pw:10, ph:12,
  pals: [
    { K:'#0A1020',S:'#5A6878',s:'#3A4858',W:'#A0B4C0',w:'#708090',
      D:'#1C2430',B:'#1850A0',b:'#0A2860',A:'#080C14',G:'#60A0FF' },
    { K:'#0A1020',S:'#6A7888',s:'#4A5868',W:'#C0D4E0',w:'#90A8B8',
      D:'#1C2430',B:'#3878C8',b:'#1050A8',A:'#080C14',G:'#80C8FF' },
    { K:'#0A1020',S:'#8888B0',s:'#585888',W:'#D8D8FF',w:'#A8A8D8',
      D:'#1C2430',B:'#6868D8',b:'#3838A8',A:'#080C14',G:'#D0A0FF' },
  ],
  frames: [
    ['.KSK.KSK..', '.KsWsWsK..', 'KSwwwwwSK.', 'KSsDDDsSK.',
     'KSsBAbSSK.', 'KSsBBbSSK.', 'KSsBAbSSK.', 'KSsBBbSSK.',
     '.KSSsSSSK.', '.KSsssSK..', '.KSsssSK..', '.KKKsKKK..'],
    ['.KSK.KSK..', '.KsWsWsK..', 'KSwwwwwSK.', 'KSsDDDsSK.',
     'KSsGAGsSK.', 'KSsBBbSSK.', 'KSsGAGsSK.', 'KSsBBbSSK.',
     '.KSSsSSSK.', '.KSsssSK..', '.KSsssSK..', '.KKKsKKK..'],
  ]},

// RANGER — 10×12, archery watchtower
ranger: { pw:10, ph:12,
  pals: [
    { K:'#0A1808',S:'#304828',s:'#203018',W:'#8CC05A',w:'#608038',
      D:'#101808',T:'#7A5020',t:'#4A3010',A:'#060C06',G:'#60FF60' },
    { K:'#0A1808',S:'#405838',s:'#304028',W:'#A0D070',w:'#70A048',
      D:'#101808',T:'#9A7040',t:'#6A5020',A:'#060C06',G:'#80FF80' },
    { K:'#0A1808',S:'#507860',s:'#385848',W:'#C0FFC0',w:'#90D890',
      D:'#101808',T:'#C0A060',t:'#908040',A:'#060C06',G:'#A0FFDB' },
  ],
  frames: [
    ['....KKKK..', '..KTTTTK..', '.KTwwwwTK.', 'KSsAAAAsSK',
     'KSsBbBbsSK', '.KSSSsSSK.', '.KSsDDDSK.', '.KSsDDDSK.',
     '.KSsDDDSK.', '.KSsDDDSK.', '.KSssssSK.', '.KKKsKKK..'],
    ['....KKKK..', '..KTTTTK..', '.KTwwwwTK.', 'KSsGGGGsSK',
     'KSsBbBbsSK', '.KSSSsSSK.', '.KSsDDDSK.', '.KSsDDDSK.',
     '.KSsDDDSK.', '.KSsDDDSK.', '.KSssssSK.', '.KKKsKKK..'],
  ]},

// ─── TERRAIN DECORATIONS ─────────────────────────────────────────────────
// Drawn on non-path cells per level; prefix 'deco_' to avoid sprite conflicts.

// deco_tree — 8×10, lush deciduous tree
deco_tree: { pw:8, ph:10,
  pal: { K:'#0A180A',h:'#40C060',l:'#2A8828',L:'#1A6018',B:'#6B3A0A',b:'#4A2208' },
  frames: [['...hh...','..hllh..','.KlLLlK.','KhlLLlhK','KhlLLlhK',
             '.KlLLlK.','..KllK..','...Bb...','...Bb...','...KK...']]},

// deco_deadtree — 8×10, bare twisted branches (swamp / cursed)
deco_deadtree: { pw:8, ph:10,
  pal: { K:'#1A0A08',b:'#3A1A10',B:'#5A2A18',t:'#7A3A20' },
  frames: [['...KK...','..KBbK..','.tBbK...', '.KtBbKt.','.KtBbt..',
             '...Bb...','...bB...','...bB...','...bB...','..KBBK..']]},

// deco_rock — 8×6, stone outcrop
deco_rock: { pw:8, ph:6,
  pal: { K:'#202020',S:'#606060',s:'#484848',h:'#808080',d:'#303030' },
  frames: [['..hSSS..', '.hShhSs.','KShssshK','KSsssdsK','.KKSsKK.','...KKK..']]},

// deco_mountain — 8×8, snow-capped peak
deco_mountain: { pw:8, ph:8,
  pal: { K:'#101010',S:'#708090',s:'#506070',W:'#E0E8F0',w:'#C0C8D0' },
  frames: [['...WW...','..sWWs..','.KSWWSK.','KSswwssK',
             'KssssssK','.KssssK.','.KKssKK.','.KKssKK.']]},

// deco_shack — 10×10, log cabin
deco_shack: { pw:10, ph:10,
  pal: { K:'#1A0A08',R:'#6A3818',r:'#4A2810',B:'#8A5028',b:'#5A3018',
         W:'#8A5A1A',D:'#100A08' },
  frames: [['..KRRRK...', '.KrRRRrK..','KrRBDBRrK.','KrRBDBRrK.',
             'KrRRRRRrK.','KbWbWbWbK.','KbWbWbWbK.','KrBDBBBrK.',
             '.KrBBBrK..', '.KKKbKKK..']]},

// deco_ruins — 10×8, crumbled stone
deco_ruins: { pw:10, ph:8,
  pal: { K:'#0A0810',S:'#5A5060',s:'#3A3048',W:'#808098',w:'#606078',M:'#1A1628' },
  frames: [['KSKK.KSK..','KSwK.KwSK.','.KSWKKwK..','.KssKKsK..',
             '.KMssMK...','..KsMsK...','..KMsKK...','....KKK...']]},

// deco_gravestone — 6×8, grave marker
deco_gravestone: { pw:6, ph:8,
  pal: { K:'#0A0810',S:'#585868',s:'#383848',W:'#808090',w:'#505060' },
  frames: [['.KSSK.','KWSsWK','KWSsWK','KwswwK','KKKKKK','.KsK..', '.KsK..','..KK..']]},

// deco_reed — 4×8, swamp reed / cattail
deco_reed: { pw:4, ph:8,
  pal: { K:'#0A1A0A',G:'#30A030',g:'#185018',Y:'#C8C040' },
  frames: [['.YY.','.GG.','KGGK','.gg.','.gg.','Kgg.','.gK.','.KK.']]},

// MORTAR — 10×12, squat cannon emplacement
mortar: { pw:10, ph:12,
  pals: [
    { K:'#200A0A',S:'#703020',s:'#4A1A10',B:'#8A6040',b:'#5A3A20',
      R:'#CC2010',r:'#8C1008',C:'#B0A090',c:'#707060',G:'#FF6020',D:'#100505' },
    { K:'#200A0A',S:'#804030',s:'#5A2A18',B:'#A08060',b:'#6A4A30',
      R:'#E03010',r:'#A01800',C:'#D0C0A8',c:'#909080',G:'#FF8030',D:'#100505' },
    { K:'#200A0A',S:'#A04060',s:'#703040',B:'#C0A080',b:'#8A6040',
      R:'#FF2020',r:'#C00010',C:'#FFE0A0',c:'#B0A070',G:'#FF40FF',D:'#100505' },
  ],
  frames: [
    ['...KcccK..', '...KcCcK..', '..KKcccKK.', '..KcKKKcK.',
     '.KKssBssK.', 'KSsBbbbbSK', 'KSsRRRRsSK', 'KSsRrRrsSK',
     'KSsRRRRsSK', '.KSssssK..', '.KSssssK..', '.KKKsKKK..'],
    ['...KGGK...', '..KGcCcGK.', '..KKcccKK.', '..KcKKKcK.',
     '.KKssBssK.', 'KSsBbbbbSK', 'KSsRRRRsSK', 'KSsRrRrsSK',
     'KSsRRRRsSK', '.KSssssK..', '.KSssssK..', '.KKKsKKK..'],
  ]},
};

function tdDrawSprite(ctx, frames, fIdx, pal, cx, cy, ps) {
  const frame = frames[fIdx % frames.length];
  const ph = frame.length, pw = frame[0].length;
  const ox = Math.round(cx - pw * ps / 2);
  const oy = Math.round(cy - ph * ps / 2);
  for (let y = 0; y < ph; y++) {
    const row = frame[y];
    for (let x = 0; x < pw; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x * ps, oy + y * ps, ps, ps);
    }
  }
}

// ── Waypoint pool (3 path groups × 3 waypoint configs each) ──
const TD_WPS_POOL = [
  // Path A (left branch)
  [
    [[-1,1],[7,1],[7,4],[2,4],[2,8],[9,8]],
    [[-1,5],[3,5],[3,2],[7,2],[7,7],[4,7],[4,4],[9,4]],
    [[-1,4],[3,4],[3,1],[6,1],[6,7],[3,7],[3,9],[9,9]],
  ],
  // Path B (center branch)
  [
    [[-1,2],[4,2],[4,1],[7,1],[7,7],[3,7],[3,5],[9,5]],
    [[-1,0],[5,0],[5,2],[1,2],[1,5],[5,5],[5,8],[9,8]],
    [[-1,1],[4,1],[4,3],[1,3],[1,7],[4,7],[4,9],[8,9],[8,5],[9,5]],
  ],
  // Path C (right branch)
  [
    [[-1,0],[8,0],[8,3],[1,3],[1,6],[8,6],[8,9],[9,9]],
    [[-1,2],[2,2],[2,8],[6,8],[6,3],[9,3]],
    [[-1,9],[1,9],[1,1],[7,1],[7,4],[3,4],[3,7],[7,7],[7,9],[9,9]],
  ],
];

// ── Three themed maps ──────────────────────────────────────────
const TD_MAPS = [
  {
    id: 0, name: 'The Verdant Frontier', icon: '🌿', color: '#4ADE80',
    subtitle: 'Parts 1–3 · SQL, Modeling & Pipelines',
    parts: [1,2,3], unlockRequirement: 0,
    bgZones: ['#1a3d08','#0a2810','#060c03'], themeName: 'verdant',
    diffByDepth: [
      {easy:0.75, medium:0.25, hard:0.00},
      {easy:0.45, medium:0.45, hard:0.10},
      {easy:0.15, medium:0.55, hard:0.30},
      {easy:0.00, medium:0.30, hard:0.70},
    ],
  },
  {
    id: 1, name: 'The Iron Wastes', icon: '⚙️', color: '#FB923C',
    subtitle: 'Parts 4–6 · Warehousing, Streaming & Cloud',
    parts: [4,5,6], unlockRequirement: 1,
    bgZones: ['#3d1a08','#251005','#100603'], themeName: 'wastes',
    diffByDepth: [
      {easy:0.40, medium:0.50, hard:0.10},
      {easy:0.15, medium:0.55, hard:0.30},
      {easy:0.00, medium:0.40, hard:0.60},
      {easy:0.00, medium:0.15, hard:0.85},
    ],
  },
  {
    id: 2, name: 'The Shadow Realm', icon: '👹', color: '#C084FC',
    subtitle: 'Parts 7–9 · Orchestration, Quality & Performance',
    parts: [7,8,9], unlockRequirement: 2,
    bgZones: ['#200836','#100320','#050010'], themeName: 'shadow',
    diffByDepth: [
      {easy:0.10, medium:0.50, hard:0.40},
      {easy:0.00, medium:0.35, hard:0.65},
      {easy:0.00, medium:0.15, hard:0.85},
      {easy:0.00, medium:0.00, hard:1.00},
    ],
  },
];


// ── Inter-node definitions (Bezier t=0.5 midpoints of road segments) ──────────
const TD_INTER_NODES = [
  { id:'in0', type:'shop',  x:119, y:436, fromLvl:0, toLvl:1, label:'Trading Post',  desc:'Spend gold on items' },
  { id:'in1', type:'elite', x:221, y:436, fromLvl:0, toLvl:2, label:'Ambush Site',    desc:'Hard question — double gold reward' },
  { id:'in2', type:'rest',  x:123, y:342, fromLvl:1, toLvl:3, label:'Campfire',       desc:'+30 gold or +2 lives next battle' },
  { id:'in3', type:'event', x:217, y:342, fromLvl:2, toLvl:3, label:'Crossroads',     desc:'A random encounter awaits' },
  { id:'in4', type:'event', x:116, y:258, fromLvl:3, toLvl:4, label:'Ancient Ruins',  desc:'A random encounter awaits' },
  { id:'in5', type:'shop',  x:224, y:258, fromLvl:3, toLvl:5, label:'Black Market',   desc:'Spend gold on items' },
  { id:'in6', type:'rest',  x:120, y:168, fromLvl:4, toLvl:6, label:'Sanctuary',      desc:'+30 gold or +2 lives next battle' },
  { id:'in7', type:'elite', x:221, y:168, fromLvl:5, toLvl:6, label:'Elite Guard',    desc:'Hard question — double gold reward' },
  { id:'in8', type:'rest',  x:125, y: 91, fromLvl:6, toLvl:7, label:'Ancient Shrine', desc:'+30 gold or +2 lives next battle' },
  { id:'in9', type:'elite', x:219, y: 91, fromLvl:6, toLvl:8, label:'Final Gauntlet', desc:'Hard question — double gold reward' },
];

const TD_INTER_META = {
  shop:  { icon:'🛒', color:'#FBBF24', label:'Shop' },
  elite: { icon:'⚔️', color:'#EF4444', label:'Elite' },
  rest:  { icon:'🔥', color:'#10B981', label:'Rest' },
  event: { icon:'🎲', color:'#A78BFA', label:'Event' },
};

const TD_EVENTS = [
  { icon:'💰', title:'Grant Funding',  desc:'A research grant comes through.',          effect:'gold+60' },
  { icon:'☕', title:'Coffee Break',   desc:'The team recharges for your next battle.',  effect:'lives+2' },
  { icon:'📉', title:'Data Breach',    desc:'A security incident drains resources.',     effect:'gold-30' },
  { icon:'🎓', title:'Hackathon Win',  desc:'You place first. Bonus XP awarded.',        effect:'xp+100'  },
  { icon:'⚙️', title:'System Outage', desc:'Infrastructure issues disrupt your forces.',effect:'lives-1' },
  { icon:'🔮', title:'Mystery Cache', desc:'Hidden data cache uncovered.',              effect:'gold+40' },
  { icon:'🪙', title:'Tax Refund',     desc:'Unexpected reimbursement arrives.',         effect:'gold+80' },
  { icon:'📡', title:'Signal Boost',   desc:'Your team gets extra starting funds.',      effect:'gold+50' },
];

const TD_SHOP_ITEMS = [
  { id:'extra_lives',  label:'+3 Lives',       icon:'❤️',  cost:80,  effect:'lives+3' },
  { id:'gold_cache',   label:'+50 Gold',        icon:'🪙',  cost:60,  effect:'gold+50' },
  { id:'rest_charge',  label:'Rest Next Battle',icon:'🔥',  cost:50,  effect:'rest_lives+2' },
  { id:'gold_boost',   label:'+100 Gold Next',  icon:'💰',  cost:90,  effect:'rest_gold+100' },
];

// ── Helpers ────────────────────────────────────────────────────

function tdQDifficulty(q) {
  if (typeof q.difficulty === 'number') {
    if (q.difficulty <= 33) return 'easy';
    if (q.difficulty <= 66) return 'medium';
    return 'hard';
  }
  // fallback heuristic for questions without a difficulty score
  if (q.type !== 'mc') return 'easy';
  const qLen   = (q.stem || '').length;
  const avgOpt = q.options ? q.options.reduce((s,o) => s + o.length, 0) / q.options.length : 30;
  if (qLen < 90 && avgOpt < 35) return 'medium';
  return 'hard';
}

function tdPickQuestion(levelDef) {
  const weights = levelDef.diffWeights;
  const pool    = (levelDef.parts && levelDef.parts.length)
    ? allQuestions.filter(q => levelDef.parts.includes(q.part))
    : allQuestions;
  const src = pool.length >= 10 ? pool : allQuestions;
  const buckets = { easy:[], medium:[], hard:[] };
  for (const q of src) buckets[tdQDifficulty(q)].push(q);

  const r = Math.random();
  let pick;
  if (r < weights.easy && buckets.easy.length)                         pick = 'easy';
  else if (r < weights.easy + weights.medium && buckets.medium.length) pick = 'medium';
  else if (buckets.hard.length)                                         pick = 'hard';
  else                                                                   pick = 'medium';

  const picked = buckets[pick].length ? buckets[pick] : allQuestions;
  return picked[Math.floor(Math.random() * picked.length)];
}

function tdLoadStars() {
  try {
    const raw = JSON.parse(StorageManager.get(TD_STARS_KEY));
    if (Array.isArray(raw)) return raw;
    // migrate object format {0:2, 1:3} → array
    if (raw && typeof raw === 'object') {
      const arr = [];
      Object.keys(raw).forEach(k => { arr[parseInt(k, 10)] = raw[k]; });
      return arr;
    }
    return [];
  } catch { return []; }
}
function tdSaveStars(levelIdx, stars) {
  const s = tdLoadStars();
  if (!s[levelIdx] || s[levelIdx] < stars) s[levelIdx] = stars;
  StorageManager.set(TD_STARS_KEY, JSON.stringify(s));
}

function tdLoadInterCleared() {
  try {
    const raw = JSON.parse(StorageManager.get(TD_INTER_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function tdSaveInterCleared(cleared) {
  StorageManager.set(TD_INTER_KEY, JSON.stringify(cleared));
}
function tdMarkInterCleared(id) {
  const c = tdLoadInterCleared();
  if (!c.includes(id)) c.push(id);
  tdSaveInterCleared(c);
}

function tdLoadRestBonus() {
  try { return JSON.parse(StorageManager.get(TD_REST_BONUS_KEY)) || null; }
  catch { return null; }
}
function tdSaveRestBonus(bonus) {
  StorageManager.set(TD_REST_BONUS_KEY, JSON.stringify(bonus));
}
function tdClearRestBonus() {
  StorageManager.remove(TD_REST_BONUS_KEY);
}

function tdGetTowerStats(tower) {
  const def = TD_TOWER_DEFS.find(d => d.id === tower.type);
  if (!tower.level || tower.level === 0) return def;
  const up = def.upgrades[tower.level - 1];
  return { ...def, ...up };
}

// ── Run State Management ──────────────────────────────────────

function tdLoadMapBeaten() {
  try { return JSON.parse(StorageManager.get(TD_MAPS_BEATEN_KEY) || '[]'); } catch { return []; }
}
function tdSaveMapBeaten(beaten) { StorageManager.set(TD_MAPS_BEATEN_KEY, JSON.stringify(beaten)); }
function tdMarkMapBeaten(mapId) {
  const b = tdLoadMapBeaten();
  if (!b.includes(mapId)) { b.push(mapId); tdSaveMapBeaten(b); }
}
function isMapUnlocked(mapId) {
  if (mapId === 0) return true;
  return tdLoadMapBeaten().includes(mapId - 1);
}

function tdLoadRun() {
  try { return JSON.parse(StorageManager.get(TD_RUN_KEY) || 'null'); } catch { return null; }
}
function tdSaveRun(run) { StorageManager.set(TD_RUN_KEY, JSON.stringify(run)); }
function tdClearRun()   { StorageManager.remove(TD_RUN_KEY); }

// Seeded RNG (mulberry32)
function makeSeedRng(seed) {
  let s = seed >>> 0;
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateWaves(enemyMult, waveCount, rng) {
  const waves = [];
  for (let w = 0; w < waveCount; w++) {
    const progress = w / waveCount;
    const wave = [];
    if (progress > 0.3) wave.push(['goblin', 4+Math.floor(rng()*4), 0.9+rng()*0.4]);
    if (progress > 0.5) wave.push(['scout',  3+Math.floor(rng()*3), 0.8+rng()*0.3]);
    if (progress > 0.2) wave.push(['orc',    2+Math.floor(rng()*3), 1.2+rng()*0.5]);
    if (progress > 0.6) wave.push(['troll',  1+Math.floor(rng()*2), 1.8+rng()*0.8]);
    if (wave.length === 0) wave.push(['goblin', 5+Math.floor(rng()*5), 1.0]);
    // Boss enemy on every 3rd wave (waves 3, 6, …) — spawns after 2 s gap
    if ((w + 1) % 3 === 0) wave.push(['boss', 1, 2.0]);
    waves.push(wave);
  }
  return waves;
}

const RUN_LEVEL_ADJ  = ['Verdant','Iron','Shadow','Cursed','Blazing','Frozen','Arcane','Ancient','Ruined','Forsaken'];
const RUN_LEVEL_NOUN = ['Trail','Pass','Gate','Keep','Valley','Crossing','Ridge','Bastion','Hollow','Reach'];

function generateLevelName(mapDef, nodeDepth, rng) {
  return RUN_LEVEL_ADJ[Math.floor(rng()*RUN_LEVEL_ADJ.length)] + ' ' + RUN_LEVEL_NOUN[Math.floor(rng()*RUN_LEVEL_NOUN.length)];
}

function generateBattleLevel(mapDef, nodeDepth, pathId, rng, isBossNode) {
  const depthBucket = nodeDepth <= 2 ? 0 : nodeDepth <= 4 ? 1 : nodeDepth <= 6 ? 2 : 3;
  const diffWeights = mapDef.diffByDepth[depthBucket];
  const isBoss      = isBossNode || nodeDepth >= 10;
  const enemyMult   = 1.0 + (nodeDepth / 11) * 3.5 + (mapDef.id * 0.5);
  const startGold   = 150 + nodeDepth * 12 + mapDef.id * 20;
  const startLives  = Math.max(8, 22 - Math.floor(nodeDepth * 1.2) - mapDef.id * 2);
  const wpsPool     = TD_WPS_POOL[pathId % TD_WPS_POOL.length];
  const wps         = wpsPool[Math.floor(rng() * wpsPool.length)];
  const waveCount   = isBoss ? 7 : 4 + Math.floor(rng() * 2);
  const waveDefs    = generateWaves(enemyMult, waveCount, rng);
  return {
    name:       isBoss ? mapDef.icon + ' ' + mapDef.name + ' Boss' : generateLevelName(mapDef, nodeDepth, rng),
    act:        mapDef.name,
    icon:       isBoss ? '💀' : mapDef.icon,
    color:      isBoss ? '#EF4444' : mapDef.color,
    enemyMult, startGold, startLives, wps, diffWeights, waveDefs,
    parts:      mapDef.parts,
    deco:       [],
    isBoss,
  };
}

// Node positions in SVG (340×540 viewBox, y increases downward, start is at bottom)
const RUN_NODE_POS = {
  start:    [170, 520],
  a1:[65,478],  a2:[65,436],  a3:[65,394],  a4:[65,352],  a5:[65,310],  a6:[65,272],
  b1:[170,478], b2:[170,436], b3:[170,394], b4:[170,352], b5:[170,310], b6:[170,272],
  c1:[275,478], c2:[275,436], c3:[275,394], c4:[275,352], c5:[275,310], c6:[275,272],
  merge1:   [118, 234],
  postmerge:[170, 198],
  fork2l:   [105, 154],
  fork2r:   [235, 154],
  preboss:  [170, 108],
  boss:     [170, 62],
};

function generateRun(mapId) {
  const seed   = (Date.now() ^ (Math.random() * 0x7FFFFFFF | 0)) >>> 0;
  const rng    = makeSeedRng(seed);
  const mapDef = TD_MAPS[mapId];

  // 14 randomly-assigned node type slots: a2-a6 (5) + b2-b6 (5) + c2-c6 (5) - 1 each = 12 path random + fork2l + fork2r = 14
  const typePool = ['shop','shop','rest','rest']; // guaranteed minimums
  while (typePool.length < 14) {
    const r = rng();
    typePool.push(r < 0.60 ? 'battle' : r < 0.75 ? 'shop' : r < 0.85 ? 'rest' : r < 0.95 ? 'elite' : 'event');
  }
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
  }
  let poolIdx = 0;

  function makeNode(id, depth, pathId, forcedType, nextIds, prevIds) {
    const type     = forcedType || typePool[poolIdx++] || 'battle';
    const [x, y]   = RUN_NODE_POS[id];
    const needsDef = (type === 'battle' || type === 'elite') && id !== 'start';
    const levelDef = needsDef ? generateBattleLevel(mapDef, depth, pathId < 0 ? 0 : pathId, rng, id === 'boss') : null;
    return { id, type, x, y, depth, pathId, nextIds, prevIds, levelDef, state: 'locked' };
  }

  const nodes = [
    makeNode('start',    0, -1, 'start',   ['a1','b1','c1'], []),
    makeNode('a1',       1,  0, 'battle',  ['a2'],           ['start']),
    makeNode('a2',       2,  0, null,      ['a3'],           ['a1']),
    makeNode('a3',       3,  0, null,      ['a4'],           ['a2']),
    makeNode('a4',       4,  0, null,      ['a5','b5'],      ['a3']),
    makeNode('a5',       5,  0, null,      ['a6'],           ['a4']),
    makeNode('a6',       6,  0, null,      ['merge1'],       ['a5']),
    makeNode('b1',       1,  1, 'battle',  ['b2'],           ['start']),
    makeNode('b2',       2,  1, null,      ['b3'],           ['b1']),
    makeNode('b3',       3,  1, null,      ['b4'],           ['b2']),
    makeNode('b4',       4,  1, null,      ['b5'],           ['b3']),
    { ...makeNode('b5',  5,  1, null,      ['b6'],           ['b4','a4','c4']), prevMode: 'any' },
    makeNode('b6',       6,  1, null,      ['merge1'],       ['b5']),
    makeNode('c1',       1,  2, 'battle',  ['c2'],           ['start']),
    makeNode('c2',       2,  2, null,      ['c3'],           ['c1']),
    makeNode('c3',       3,  2, null,      ['c4'],           ['c2']),
    makeNode('c4',       4,  2, null,      ['c5','b5'],      ['c3']),
    makeNode('c5',       5,  2, null,      ['c6'],           ['c4']),
    makeNode('c6',       6,  2, null,      ['postmerge'],    ['c5']),
    makeNode('merge1',   7,  0, 'battle',  ['postmerge'],    ['a6','b6']),
    makeNode('postmerge',8, -1, 'shop',    ['fork2l','fork2r'], ['merge1','c6']),
    makeNode('fork2l',   9,  0, 'battle',  ['preboss'],      ['postmerge']),
    makeNode('fork2r',   9,  2, 'battle',  ['preboss'],      ['postmerge']),
    { ...makeNode('preboss',  10,-1, 'battle',  ['boss'],         ['fork2l','fork2r']), prevMode: 'any' },
    makeNode('boss',     11,-1, 'battle',  [],               ['preboss']),
  ];

  // Mark start as completed and first path nodes as available
  nodes.find(n => n.id === 'start').state = 'completed';
  ['a1','b1','c1'].forEach(id => { const n = nodes.find(x => x.id === id); if (n) n.state = 'available'; });

  const run = { mapId, seed, nodes, currentId:'start', visitedIds:['start'], activeId:null, stats:{battlesWon:0,goldEarned:0,xpEarned:0,carryGold:0} };
  tdSaveRun(run);
  return run;
}

function getAvailableNodes(run) { return run.nodes.filter(n => n.state === 'available'); }

function markNodeEntered(run, nodeId) {
  const node = run.nodes.find(n => n.id === nodeId);
  if (!node) return;
  node.state = 'active';
  run.activeId = nodeId;
  if (!run.visitedIds.includes(nodeId)) run.visitedIds.push(nodeId);
  tdSaveRun(run);
}

function markNodeCompleted(run, nodeId) {
  const node = run.nodes.find(n => n.id === nodeId);
  if (!node) return;
  node.state = 'completed';
  run.currentId = nodeId;
  run.activeId  = null;
  if (!run.visitedIds.includes(nodeId)) run.visitedIds.push(nodeId);
  for (const nextId of (node.nextIds || [])) {
    const next = run.nodes.find(n => n.id === nextId);
    if (!next || next.state !== 'locked') continue;
    const check = (next.prevMode === 'any') ? next.prevIds.some : next.prevIds.every;
    if (check.call(next.prevIds, pid => run.visitedIds.includes(pid))) next.state = 'available';
  }
  tdSaveRun(run);
}

function isRunComplete(run) {
  const boss = run.nodes.find(n => n.id === 'boss');
  return boss && boss.state === 'completed';
}

// ── SVG Run Map ────────────────────────────────────────────────

function renderRunMap(run) {
  const mapDef = TD_MAPS[run.mapId];

  // Returns difficulty color, stars string, and tier label based on diffWeights
  function getDiffInfo(levelDef) {
    if (!levelDef || !levelDef.diffWeights) return { col: '#9CA3AF', stars: '', tier: '' };
    const { hard } = levelDef.diffWeights;
    if (hard >= 0.5)  return { col: '#EF4444', stars: '★★★', tier: 'HARD' };
    if (hard >= 0.2)  return { col: '#FBBF24', stars: '★★☆', tier: 'MED' };
    return { col: '#4ADE80', stars: '★☆☆', tier: 'EASY' };
  }

  function getNodeColor(node) {
    if (node.id === 'boss') return '#EF4444';
    if (node.type === 'battle' || node.type === 'elite') return getDiffInfo(node.levelDef).col;
    const TC = { shop:'#FBBF24', rest:'#10B981', event:'#A78BFA' };
    return TC[node.type] || mapDef.color;
  }

  // Road brightness: traversed = bright solid, ahead (from visited) = medium, future = dim dashed
  function bezierRoad(x1, y1, x2, y2, prevId, nodeId) {
    const midy = (y1 + y2) / 2;
    const d = `M${x1},${y1} C${x1},${midy} ${x2},${midy} ${x2},${y2}`;
    const prevDone = run.visitedIds.includes(prevId);
    const nodeDone = run.visitedIds.includes(nodeId);
    if (prevDone && nodeDone) {
      // traversed – bright warm road
      return `<path d="${d}" fill="none" stroke="#1a0a02" stroke-width="9" stroke-linecap="round"/>` +
             `<path d="${d}" fill="none" stroke="#7a4a1a" stroke-width="5.5" stroke-linecap="round"/>` +
             `<path d="${d}" fill="none" stroke="#d4903a" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    }
    if (prevDone) {
      // ahead from visited – medium brightness, dashed hint
      return `<path d="${d}" fill="none" stroke="#120802" stroke-width="8" stroke-linecap="round"/>` +
             `<path d="${d}" fill="none" stroke="#5a3010" stroke-width="5" stroke-linecap="round"/>` +
             `<path d="${d}" fill="none" stroke="#b07030" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 5" opacity=".5"/>`;
    }
    // future – dim, barely visible but present so paths are visible
    return `<path d="${d}" fill="none" stroke="#0a0503" stroke-width="7" stroke-linecap="round"/>` +
           `<path d="${d}" fill="none" stroke="#2a1808" stroke-width="4" stroke-linecap="round"/>` +
           `<path d="${d}" fill="none" stroke="#6a4020" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 6" opacity=".3"/>`;
  }

  const drawn = new Set();
  const roads = run.nodes.filter(n => n.id !== 'start').flatMap(node =>
    node.prevIds.map(pid => {
      const key = pid + ':' + node.id;
      if (drawn.has(key)) return '';
      drawn.add(key);
      const prev = run.nodes.find(n => n.id === pid);
      return prev ? bezierRoad(prev.x, prev.y, node.x, node.y, pid, node.id) : '';
    })
  ).join('');

  const TI = { battle:'⚔', shop:'🛒', rest:'🔥', elite:'💀', event:'🎲', boss:'☠' };

  function goldBadge(node, x, y, alpha) {
    if (!node.levelDef) return '';
    const g = Math.round(node.levelDef.startGold / 10) * 10;
    return `<text x="${x}" y="${y}" font-size="5.5" text-anchor="middle" fill="#FBBF24" opacity="${alpha}" font-weight="600">🪙${g}</text>`;
  }

  const nodesHtml = run.nodes.map(node => {
    if (node.id === 'start') return '';
    const { x, y, state, type, id, levelDef } = node;
    const col  = getNodeColor(node);
    const icon = TI[id === 'boss' ? 'boss' : type] || '⚔';
    const { stars, tier } = getDiffInfo(levelDef);
    // label appears above node for most, below for nodes near the top
    const aboveY = y - 26;
    const belowY = y + 28;

    if (state === 'completed') {
      return `<g class="rn-completed" data-id="${id}">
        <circle cx="${x}" cy="${y}" r="14" fill="#07090e" stroke="#1c2e3e" stroke-width="1.5" opacity="0.75"/>
        <text x="${x}" y="${y+4}" font-size="10" text-anchor="middle" fill="#2d4455">✓</text>
      </g>`;
    }

    if (state === 'active') {
      return `<g class="rn-active" data-id="${id}">
        <circle cx="${x}" cy="${y}" r="23" fill="${col}20" stroke="${col}60" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="16" fill="#0c1020" stroke="${col}" stroke-width="2.5"/>
        <text x="${x}" y="${y+5}" font-size="12" text-anchor="middle">${icon}</text>
        ${stars ? `<text x="${x}" y="${aboveY}" font-size="5.5" text-anchor="middle" fill="${col}bb">${stars}</text>` : ''}
      </g>`;
    }

    if (state === 'available') {
      return `<g class="rn-available" data-id="${id}" style="cursor:pointer">
        <circle class="rn-pulse" cx="${x}" cy="${y}" r="21" fill="${col}18" stroke="${col}50" stroke-width="1.5"/>
        <circle cx="${x}" cy="${y}" r="16" fill="#0c1020" stroke="${col}" stroke-width="2.5"/>
        <text x="${x}" y="${y+5}" font-size="12" text-anchor="middle">${icon}</text>
        ${stars ? `<text x="${x}" y="${aboveY}" font-size="5.5" text-anchor="middle" fill="${col}ee" font-weight="700">${stars}</text>` :
                  `<text x="${x}" y="${aboveY}" font-size="5" text-anchor="middle" fill="${col}bb" font-weight="600">${type.toUpperCase()}</text>`}
        ${goldBadge(node, x, belowY, '0.7')}
      </g>`;
    }

    // future (was 'locked') — fully visible, difficulty-colored, no click, no padlock
    return `<g class="rn-future" data-id="${id}">
      <circle cx="${x}" cy="${y}" r="15" fill="${col}0a" stroke="${col}30" stroke-width="1.5"/>
      <text x="${x}" y="${y+4}" font-size="11" text-anchor="middle" opacity="0.4">${icon}</text>
      ${tier ? `<text x="${x}" y="${aboveY}" font-size="4.5" text-anchor="middle" fill="${col}45" font-weight="700">${tier}</text>` : ''}
      ${goldBadge(node, x, belowY, '0.25')}
    </g>`;
  }).join('');

  // Character position marker – offset beside currentId node
  const curNode = run.nodes.find(n => n.id === run.currentId);
  const markerHtml = (curNode && run.currentId !== 'start') ? (() => {
    const mx = curNode.x + 21, my = curNode.y - 19;
    return `<g>
      <circle cx="${mx}" cy="${my}" r="8" fill="#12141e" stroke="#FBBF2490" stroke-width="1.5"/>
      <text x="${mx}" y="${my+3}" font-size="7.5" text-anchor="middle">🧑</text>
    </g>`;
  })() : '';

  // Per-theme terrain decorations — animated sprites along map edges
  function verdantTerrain() {
    return `<g>
      <!-- distant static bg trees -->
      <g opacity="0.18">
        <circle cx="22" cy="482" r="7" fill="#1a5a28"/><rect x="19" y="485" width="6" height="9" fill="#3a2008"/>
        <circle cx="320" cy="472" r="6" fill="#1a5020"/><rect x="317" y="475" width="6" height="8" fill="#3a2008"/>
        <circle cx="318" cy="428" r="7" fill="#165022"/><rect x="315" y="431" width="6" height="9" fill="#3a2008"/>
      </g>
      <!-- animated tree 1 (left, mid-low) -->
      <g transform="translate(32,424)">
        <rect x="-3" y="0" width="6" height="15" fill="#4a3010" rx="2"/>
        <g>
          <circle cx="0" cy="-9" r="13" fill="#2d7a38" opacity="0.95"/>
          <circle cx="-7" cy="-3" r="9" fill="#1d6028" opacity="0.9"/>
          <circle cx="7" cy="-3" r="9" fill="#267535" opacity="0.9"/>
          <animateTransform attributeName="transform" type="rotate"
            values="-1.8 0 15; 1.8 0 15; -1.8 0 15" dur="3.4s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
        </g>
      </g>
      <!-- animated tree 2 (right, mid) -->
      <g transform="translate(314,370)">
        <rect x="-3" y="0" width="6" height="13" fill="#3a2508" rx="2"/>
        <g>
          <circle cx="0" cy="-8" r="12" fill="#1e6a2e" opacity="0.95"/>
          <circle cx="-6" cy="-3" r="8" fill="#28703a" opacity="0.9"/>
          <circle cx="5" cy="-4" r="8" fill="#1a5828" opacity="0.9"/>
          <animateTransform attributeName="transform" type="rotate"
            values="2 0 13; -2 0 13; 2 0 13" dur="2.9s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
        </g>
      </g>
      <!-- animated tree 3 (left, upper) -->
      <g transform="translate(28,305)">
        <rect x="-2.5" y="0" width="5" height="11" fill="#3a2008" rx="1.5"/>
        <g>
          <circle cx="0" cy="-7" r="10" fill="#257030" opacity="0.95"/>
          <circle cx="-5" cy="-2" r="7" fill="#1d6028" opacity="0.9"/>
          <animateTransform attributeName="transform" type="rotate"
            values="-2.2 0 11; 1.8 0 11; -2.2 0 11" dur="4.1s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
        </g>
      </g>
      <!-- reflective water pool (right side) -->
      <g transform="translate(316,292)" opacity="0.85">
        <ellipse cx="0" cy="0" rx="18" ry="6" fill="#1a4a7a" opacity="0.4"/>
        <ellipse cx="0" cy="-1" rx="16" ry="4" fill="#2a6aaa" opacity="0.25"/>
        <ellipse cx="-4" cy="-1.5" rx="5" ry="1.5" fill="#70b8e0" opacity="0.55">
          <animate attributeName="opacity" values="0.2;0.75;0.2" dur="1.9s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="-4;3;-4" dur="1.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </ellipse>
        <ellipse cx="4" cy="1" rx="3" ry="1" fill="#70b8e0" opacity="0.4">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.4s" begin="0.5s" repeatCount="indefinite"/>
        </ellipse>
      </g>
      <!-- fireflies blinking -->
      <circle cx="46" cy="345" r="1.8" fill="#c8f060" opacity="0">
        <animate attributeName="opacity" values="0;0.9;0;0" dur="2.6s" begin="0.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="296" cy="328" r="1.6" fill="#c8f060" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0;0" dur="3.2s" begin="1.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="50" cy="285" r="1.5" fill="#c8f060" opacity="0">
        <animate attributeName="opacity" values="0;0.9;0;0" dur="2.9s" begin="0.9s" repeatCount="indefinite"/>
      </circle>
      <circle cx="301" cy="265" r="1.7" fill="#c8f060" opacity="0">
        <animate attributeName="opacity" values="0;0.7;0;0" dur="3.6s" begin="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="44" cy="230" r="1.5" fill="#c8f060" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0;0" dur="2.4s" begin="1.8s" repeatCount="indefinite"/>
      </circle>
      <!-- bobbing flowers -->
      <g transform="translate(36,462)">
        <rect x="-1" y="-7" width="2" height="8" fill="#3a7020" rx="1"/>
        <circle cx="0" cy="-8" r="3" fill="#fbbf24">
          <animate attributeName="cy" values="-8;-9.5;-8" dur="2.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </circle>
      </g>
      <g transform="translate(320,445)">
        <rect x="-1" y="-6" width="2" height="7" fill="#3a7020" rx="1"/>
        <circle cx="0" cy="-7" r="2.8" fill="#f87171">
          <animate attributeName="cy" values="-7;-8.5;-7" dur="2.5s" begin="0.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </circle>
      </g>
      <g transform="translate(324,305)">
        <rect x="-1" y="-5" width="2" height="6" fill="#3a7020" rx="1"/>
        <circle cx="0" cy="-6" r="2.5" fill="#86efac">
          <animate attributeName="cy" values="-6;-7.5;-6" dur="1.9s" begin="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </circle>
      </g>
      <!-- rolling ground hills -->
      <ellipse cx="22" cy="244" rx="24" ry="8" fill="#1e5828" opacity="0.3"/>
      <ellipse cx="318" cy="234" rx="24" ry="7" fill="#1a5020" opacity="0.3"/>
    </g>`;
  }

  function wastesTerrain() {
    return `<g>
      <!-- rock formations -->
      <g opacity="0.55">
        <polygon points="20,474 34,474 27,461" fill="#4a3520"/>
        <polygon points="26,474 40,474 33,463" fill="#3a2810"/>
        <polygon points="308,464 322,464 315,451" fill="#4a3520"/>
        <polygon points="313,464 326,464 320,453" fill="#3a2810"/>
        <polygon points="22,378 36,378 29,364" fill="#4a3520" opacity="0.7"/>
        <polygon points="308,365 320,365 315,354" fill="#3a2810" opacity="0.7"/>
      </g>
      <!-- large rotating gear (left) -->
      <g transform="translate(30,300)">
        <circle cx="0" cy="0" r="11" fill="none" stroke="#7a4a18" stroke-width="2.5" opacity="0.7"/>
        <circle cx="0" cy="0" r="4" fill="#4a2a0a" opacity="0.8"/>
        <g opacity="0.7">
          <rect x="-2.5" y="-14.5" width="5" height="7" fill="#7a4a18" rx="2"/>
          <rect x="-2.5" y="7.5" width="5" height="7" fill="#7a4a18" rx="2"/>
          <rect x="-14.5" y="-2.5" width="7" height="5" fill="#7a4a18" rx="2"/>
          <rect x="7.5" y="-2.5" width="7" height="5" fill="#7a4a18" rx="2"/>
          <rect x="-11" y="-11" width="5" height="5" fill="#6a3a12" rx="1" transform="rotate(45 -8.5 -8.5)"/>
          <rect x="6" y="-11" width="5" height="5" fill="#6a3a12" rx="1" transform="rotate(45 8.5 -8.5)"/>
          <rect x="-11" y="6" width="5" height="5" fill="#6a3a12" rx="1" transform="rotate(45 -8.5 8.5)"/>
          <rect x="6" y="6" width="5" height="5" fill="#6a3a12" rx="1" transform="rotate(45 8.5 8.5)"/>
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 0" to="360 0 0" dur="12s" repeatCount="indefinite"/>
        </g>
      </g>
      <!-- small counter-rotating gear (right) -->
      <g transform="translate(314,390)">
        <circle cx="0" cy="0" r="8" fill="none" stroke="#6a3a14" stroke-width="2" opacity="0.65"/>
        <circle cx="0" cy="0" r="3" fill="#3a1808" opacity="0.75"/>
        <g opacity="0.65">
          <rect x="-2" y="-10.5" width="4" height="5.5" fill="#6a3a14" rx="1.5"/>
          <rect x="-2" y="5" width="4" height="5.5" fill="#6a3a14" rx="1.5"/>
          <rect x="-10.5" y="-2" width="5.5" height="4" fill="#6a3a14" rx="1.5"/>
          <rect x="5" y="-2" width="5.5" height="4" fill="#6a3a14" rx="1.5"/>
          <animateTransform attributeName="transform" type="rotate"
            from="360 0 0" to="0 0 0" dur="8s" repeatCount="indefinite"/>
        </g>
      </g>
      <!-- volcano (right side, upper) -->
      <g transform="translate(320,195)" opacity="0.8">
        <polygon points="0,22 -18,22 -9,0 9,0 18,22" fill="#3a1a08"/>
        <polygon points="-3,14 3,14 1,0 -1,0" fill="#8a2000" opacity="0.6"/>
        <ellipse cx="0" cy="22" rx="16" ry="4" fill="#ef4444" opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="1.6s" repeatCount="indefinite"/>
        </ellipse>
        <!-- smoke puffs -->
        <circle cx="-2" cy="-1" r="0" fill="#7a6050">
          <animate attributeName="r" values="0;7;8" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="-1;-22;-26" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.4;0" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="2" cy="-1" r="0" fill="#6a5040">
          <animate attributeName="r" values="0;6;7" dur="2.4s" begin="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="-1;-18;-22" dur="2.4s" begin="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.3;0" dur="2.4s" begin="0.9s" repeatCount="indefinite"/>
        </circle>
        <circle cx="-1" cy="-1" r="0" fill="#8a7060">
          <animate attributeName="r" values="0;5;6" dur="2.4s" begin="1.6s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="-1;-15;-18" dur="2.4s" begin="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.25;0" dur="2.4s" begin="1.6s" repeatCount="indefinite"/>
        </circle>
      </g>
      <!-- ember sparks drifting from volcano -->
      <circle cx="316" cy="183" r="1.5" fill="#ef4444" opacity="0">
        <animate attributeName="cx" values="316;304;296" dur="1.9s" begin="0.3s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="183;165;155" dur="1.9s" begin="0.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.9;0" dur="1.9s" begin="0.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="318" cy="183" r="1.2" fill="#fb923c" opacity="0">
        <animate attributeName="cx" values="318;326;333" dur="1.6s" begin="1.0s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="183;167;158" dur="1.6s" begin="1.0s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.8;0" dur="1.6s" begin="1.0s" repeatCount="indefinite"/>
      </circle>
      <circle cx="320" cy="185" r="1" fill="#fbbf24" opacity="0">
        <animate attributeName="cx" values="320;313;308" dur="2.1s" begin="1.7s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="185;163;150" dur="2.1s" begin="1.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.7;0" dur="2.1s" begin="1.7s" repeatCount="indefinite"/>
      </circle>
      <!-- heat shimmer lines -->
      <line x1="24" y1="450" x2="36" y2="450" stroke="#fb923c" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0;0.4;0" dur="0.9s" repeatCount="indefinite"/>
        <animate attributeName="y1" values="450;449;450" dur="0.9s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="450;449;450" dur="0.9s" repeatCount="indefinite"/>
      </line>
      <line x1="310" y1="440" x2="322" y2="440" stroke="#fb923c" stroke-width="1" opacity="0">
        <animate attributeName="opacity" values="0;0.35;0" dur="1.2s" begin="0.4s" repeatCount="indefinite"/>
      </line>
    </g>`;
  }

  function shadowTerrain() {
    return `<g>
      <!-- crystal formations (static base) -->
      <g opacity="0.55">
        <polygon points="20,466 26,449 32,466 26,470" fill="#7b35b8"/>
        <polygon points="26,470 32,455 38,470 32,474" fill="#6b2aaa"/>
        <polygon points="308,456 314,439 320,456 314,460" fill="#7b35b8"/>
        <polygon points="314,460 320,445 326,460 320,464" fill="#6b2aaa"/>
        <!-- upper crystals -->
        <polygon points="19,368 24,354 29,368 24,371" fill="#7b35b8" opacity="0.7"/>
        <polygon points="312,358 317,344 322,358 317,362" fill="#6b2aaa" opacity="0.7"/>
      </g>
      <!-- crystal glow pulses -->
      <ellipse cx="26" cy="462" rx="12" ry="9" fill="#7b35b8" opacity="0.08">
        <animate attributeName="opacity" values="0.04;0.18;0.04" dur="2.1s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="12;16;12" dur="2.1s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="314" cy="452" rx="12" ry="9" fill="#7b35b8" opacity="0.08">
        <animate attributeName="opacity" values="0.06;0.2;0.06" dur="2.7s" begin="0.9s" repeatCount="indefinite"/>
      </ellipse>
      <!-- gravestones -->
      <g opacity="0.5">
        <rect x="24" y="295" width="11" height="15" fill="#2a1040" rx="5.5"/>
        <rect x="26" y="310" width="7" height="6" fill="#2a1040"/>
        <rect x="309" y="285" width="11" height="15" fill="#221038" rx="5.5"/>
        <rect x="311" y="300" width="7" height="6" fill="#221038"/>
      </g>
      <!-- flickering candle left -->
      <g transform="translate(33,318)">
        <rect x="-3" y="-2" width="6" height="14" fill="#5a4020" rx="1.5"/>
        <rect x="-2.5" y="-4" width="5" height="3" fill="#7a6030"/>
        <g transform="translate(0,-10)">
          <ellipse cx="0" cy="0" rx="2.8" ry="4.5" fill="#ff8c00">
            <animate attributeName="rx" values="2.8;2;3.2;2.8" dur="0.38s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="4.5;5.5;3.5;4.5" dur="0.38s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="0" cy="1" rx="1.6" ry="2.8" fill="#ffdd44" opacity="0.85">
            <animate attributeName="rx" values="1.6;1;2;1.6" dur="0.38s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="0" cy="0" rx="9" ry="9" fill="#ff8c00" opacity="0.08">
            <animate attributeName="opacity" values="0.04;0.18;0.04" dur="0.38s" repeatCount="indefinite"/>
            <animate attributeName="rx" values="9;13;9" dur="0.38s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="9;13;9" dur="0.38s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      </g>
      <!-- flickering candle right -->
      <g transform="translate(311,308)">
        <rect x="-3" y="-2" width="6" height="13" fill="#5a4020" rx="1.5"/>
        <rect x="-2.5" y="-4" width="5" height="3" fill="#7a6030"/>
        <g transform="translate(0,-9)">
          <ellipse cx="0" cy="0" rx="2.8" ry="4.5" fill="#ff8c00">
            <animate attributeName="rx" values="3;2.2;2.8;3.2;3" dur="0.42s" begin="0.18s" repeatCount="indefinite"/>
            <animate attributeName="ry" values="4.5;5.5;3.8;5;4.5" dur="0.42s" begin="0.18s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="0" cy="1" rx="1.5" ry="2.8" fill="#ffdd44" opacity="0.85"/>
          <ellipse cx="0" cy="0" rx="9" ry="9" fill="#ff8c00" opacity="0.08">
            <animate attributeName="opacity" values="0.06;0.2;0.06" dur="0.42s" begin="0.18s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      </g>
      <!-- floating soul orbs -->
      <g>
        <circle cx="42" cy="355" r="5" fill="#C084FC" opacity="0.22">
          <animate attributeName="cy" values="355;344;355" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
          <animate attributeName="opacity" values="0.12;0.32;0.12" dur="3.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="42" cy="355" r="2.5" fill="#e0b0ff" opacity="0.4">
          <animate attributeName="cy" values="355;344;355" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </circle>
        <circle cx="301" cy="345" r="4" fill="#A855F7" opacity="0.18">
          <animate attributeName="cy" values="345;335;345" dur="3.8s" begin="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
          <animate attributeName="opacity" values="0.1;0.28;0.1" dur="3.8s" begin="1.1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="301" cy="345" r="2" fill="#d0a0ff" opacity="0.35">
          <animate attributeName="cy" values="345;335;345" dur="3.8s" begin="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </circle>
      </g>
      <!-- bat 1 — flies left to right -->
      <g opacity="0.72">
        <animateMotion path="M20,135 Q100,108 170,120 Q240,132 330,110" dur="8s" repeatCount="indefinite" calcMode="linear"/>
        <g>
          <animateTransform attributeName="transform" type="scale" values="1,1; 1,-0.65; 1,1" dur="0.42s" repeatCount="indefinite"/>
          <ellipse cx="0" cy="0" rx="4.5" ry="2.5" fill="#1a0828"/>
          <path d="M-4.5,0 Q-13,-7 -15,-1 Q-10,2.5 -4.5,0Z" fill="#1a0828"/>
          <path d="M4.5,0 Q13,-7 15,-1 Q10,2.5 4.5,0Z" fill="#1a0828"/>
        </g>
      </g>
      <!-- bat 2 — flies right to left, higher -->
      <g opacity="0.5">
        <animateMotion path="M330,200 Q240,178 170,188 Q100,198 20,175" dur="10s" begin="4s" repeatCount="indefinite" calcMode="linear"/>
        <g>
          <animateTransform attributeName="transform" type="scale" values="1,1; 1,-0.65; 1,1" dur="0.38s" begin="0.2s" repeatCount="indefinite"/>
          <ellipse cx="0" cy="0" rx="3.5" ry="2" fill="#150820"/>
          <path d="M-3.5,0 Q-10,-5 -12,-0.5 Q-8,2 -3.5,0Z" fill="#150820"/>
          <path d="M3.5,0 Q10,-5 12,-0.5 Q8,2 3.5,0Z" fill="#150820"/>
        </g>
      </g>
      <!-- fog wisps near convergence -->
      <ellipse cx="22" cy="236" rx="26" ry="7" fill="#7b35b8" opacity="0.12">
        <animate attributeName="opacity" values="0.06;0.18;0.06" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="26;32;26" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="318" cy="228" rx="24" ry="6" fill="#6b2aaa" opacity="0.1">
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="5s" begin="1.5s" repeatCount="indefinite"/>
      </ellipse>
    </g>`;
  }

  const terrainHtml = mapDef.themeName === 'verdant' ? verdantTerrain() :
                      mapDef.themeName === 'wastes'  ? wastesTerrain() :
                      shadowTerrain();

  const [bg0, bg1, bg2] = mapDef.bgZones;
  const mc = mapDef.color;
  const svg = `<svg id="tdm-svg" viewBox="0 0 340 540" xmlns="http://www.w3.org/2000/svg" overflow="hidden">
    <defs>
      <linearGradient id="rmBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bg2}"/>
        <stop offset="50%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg0}"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="340" height="540" fill="url(#rmBg)"/>
    ${terrainHtml}
    <line x1="0" y1="245" x2="340" y2="245" stroke="${mc}12" stroke-width="1" stroke-dasharray="6 8"/>
    <line x1="0" y1="182" x2="340" y2="182" stroke="${mc}12" stroke-width="1" stroke-dasharray="6 8"/>
    <text x="170" y="228" font-size="6" text-anchor="middle" fill="${mc}28" font-weight="700" letter-spacing="3">CONVERGENCE</text>
    <text x="170" y="506" font-size="6" text-anchor="middle" fill="${mc}40" font-weight="700" letter-spacing="2">CHOOSE YOUR PATH</text>
    <text x="65"  y="514" font-size="6" text-anchor="middle" fill="${mc}45" letter-spacing="1">PATH A</text>
    <text x="170" y="514" font-size="6" text-anchor="middle" fill="${mc}45" letter-spacing="1">PATH B</text>
    <text x="275" y="514" font-size="6" text-anchor="middle" fill="${mc}45" letter-spacing="1">PATH C</text>
    ${roads}
    ${nodesHtml}
    ${markerHtml}
    <text x="170" y="47"  font-size="7" text-anchor="middle" fill="#EF444488" font-weight="700" letter-spacing="2">BOSS</text>
    <text x="170" y="95"  font-size="6" text-anchor="middle" fill="${mc}55" font-weight="700" letter-spacing="1.5">PRE-BOSS</text>
  </svg>`;

  EL.contentArea.innerHTML = `
    <div id="tdm-wrap" class="run-map-wrap">
      <div class="run-map-header">
        <div class="run-map-title">${mapDef.icon} ${mapDef.name}</div>
        <div class="run-map-subtitle">${mapDef.subtitle}</div>
      </div>
      ${svg}
    </div>`;

  document.querySelectorAll('.rn-available').forEach(g => {
    g.addEventListener('click', () => {
      const nodeId = g.dataset.id;
      const node   = run.nodes.find(n => n.id === nodeId);
      if (!node) return;
      markNodeEntered(run, nodeId);
      if (node.type === 'battle' || node.type === 'elite' || node.id === 'boss') {
        showLevelConfirmPanel(node.levelDef, nodeId, run);
      } else {
        showInterNodePanel(node, run);
      }
    });
  });
}

// ── Map Selection Screen ───────────────────────────────────────

function showMapSelection() {
  if (td && td.running) {
    cancelAnimationFrame(td.animFrame);
    if (td.autoSaveInterval) clearInterval(td.autoSaveInterval);
    td.running = false; td = null;
    tdMusic.stop();
  }
  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('td-world');
  if (!StorageManager.get(TUTORIAL_KEY)) { showTutorial(_renderMapSelection); return; }
  _renderMapSelection();
}

function _renderMapSelection() {
  const beaten   = tdLoadMapBeaten();
  const existRun = tdLoadRun();

  const cardsHtml = TD_MAPS.map(map => {
    const unlocked = isMapUnlocked(map.id);
    const hasRun   = existRun && existRun.mapId === map.id;
    const isBeaten = beaten.includes(map.id);
    const lockedCls= unlocked ? '' : ' map-card-locked';
    const disAttr  = unlocked ? '' : 'disabled';
    const btnLabel = !unlocked ? '🔒 Locked' : hasRun ? '▶ Continue' : '⚔️ Start Run';
    return `<button class="map-card${lockedCls}" data-mapid="${map.id}" ${disAttr}>
      <div class="map-card-icon" style="color:${map.color}">${map.icon}</div>
      <div class="map-card-body">
        <div class="map-card-name" style="color:${map.color}">${map.name}</div>
        <div class="map-card-sub">${map.subtitle}</div>
        ${isBeaten ? '<div class="map-card-beaten">✓ Cleared</div>' : ''}
        ${!unlocked ? '<div class="map-card-req">Clear previous map to unlock</div>' : ''}
        ${hasRun && !isBeaten ? '<div class="map-card-active">Run in progress</div>' : ''}
      </div>
      <div class="map-card-btn">${btnLabel}</div>
    </button>`;
  }).join('');

  EL.contentArea.innerHTML = `
    <div class="map-select-screen">
      <div class="map-select-header">
        <div class="map-select-title">🛡️ Choose Your Map</div>
        <div class="map-select-sub">Select a world to begin your run</div>
      </div>
      <div class="map-select-cards">${cardsHtml}</div>
    </div>`;

  document.querySelectorAll('.map-card:not([disabled])').forEach(card => {
    card.addEventListener('click', () => {
      const mapId = parseInt(card.dataset.mapid);
      const run   = (existRun && existRun.mapId === mapId) ? existRun : generateRun(mapId);
      showRunMap(run);
    });
  });
}

function showRunMap(run) {
  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('td-world');
  // If the user closed the browser mid-battle, any node stuck in 'active'
  // state can never be clicked (pointer-events:none). Reset them here so
  // they're clickable again.
  run.nodes.forEach(n => { if (n.state === 'active') { n.state = 'available'; run.activeId = null; } });
  tdSaveRun(run);
  renderRunMap(run);
}

function showTDWorldMap() { showMapSelection(); }

// ── Level Confirmation Panel ───────────────────────────────────

function showLevelConfirmPanel(levelDef, nodeId, run) {
  const restBonus = tdLoadRestBonus();
  const carryGold = (run && run.stats && run.stats.carryGold) || 0;
  const dw = levelDef.diffWeights;
  const diffStars = dw.hard >= 0.4 ? '⭐⭐⭐' : dw.hard >= 0.2 || dw.medium >= 0.5 ? '⭐⭐' : '⭐';
  const diffLabel = dw.hard >= 0.4 ? 'Hard' : dw.hard >= 0.2 || dw.medium >= 0.5 ? 'Medium' : 'Easy';

  function bar(pct, col) {
    return `<div style="flex:${Math.round(pct*100)};background:${col};height:8px;border-radius:4px;min-width:${pct>0?'8px':'0'}"></div>`;
  }
  const qBar = `<div style="display:flex;gap:3px;border-radius:4px;overflow:hidden">
    ${bar(dw.easy,'#10B981')}${bar(dw.medium,'#FBBF24')}${bar(dw.hard,'#EF4444')}
  </div>
  <div style="display:flex;gap:8px;font-size:.65rem;color:#8899bb;margin-top:4px">
    ${dw.easy>0 ? `<span style="color:#10B981">●</span> Easy ${Math.round(dw.easy*100)}%` : ''}
    ${dw.medium>0 ? `<span style="color:#FBBF24">●</span> Med ${Math.round(dw.medium*100)}%` : ''}
    ${dw.hard>0 ? `<span style="color:#EF4444">●</span> Hard ${Math.round(dw.hard*100)}%` : ''}
  </div>`;

  const restBannerHtml = restBonus ? `
    <div class="tdcp-rest-bonus">
      ${restBonus.type==='lives' ? `❤️ +${restBonus.value} bonus lives` : `🪙 +${restBonus.value} bonus gold`} from rest
    </div>` : '';

  const panel = document.createElement('div');
  panel.className = 'tdcp-overlay';
  panel.innerHTML = `
    <div class="tdcp-panel">
      <div class="tdcp-header">
        <div class="tdcp-icon">${levelDef.icon}</div>
        <div class="tdcp-title-wrap">
          <div class="tdcp-name">${levelDef.name}</div>
          <div class="tdcp-act">${levelDef.act}</div>
        </div>
      </div>
      <div class="tdcp-stats">
        <div class="tdcp-stat"><span>❤️</span><span>${levelDef.startLives}${restBonus&&restBonus.type==='lives'?`+${restBonus.value}`:''}</span><span class="tdcp-stat-label">Lives</span></div>
        <div class="tdcp-stat"><span>🪙</span><span>${levelDef.startGold}${carryGold>0?`+${carryGold}🔁`:''}${restBonus&&restBonus.type==='gold'?`+${restBonus.value}`:''}</span><span class="tdcp-stat-label">Gold</span></div>
        <div class="tdcp-stat"><span>${diffStars}</span><span>${diffLabel}</span><span class="tdcp-stat-label">Difficulty</span></div>
      </div>
      ${restBannerHtml}
      <div class="tdcp-q-section"><div class="tdcp-q-label">Question Mix</div>${qBar}</div>
      <div class="tdcp-actions">
        <button class="tdcp-btn-back">← Back</button>
        <button class="tdcp-btn-play">⚔️ Play</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  panel.querySelector('.tdcp-btn-back').addEventListener('click', () => {
    if (run) {
      const node = run.nodes.find(n => n.id === nodeId);
      if (node && node.state === 'active') {
        node.state = 'available';
        run.activeId = null;
        run.visitedIds = run.visitedIds.filter(id => id !== nodeId);
        tdSaveRun(run);
      }
    }
    panel.remove();
    if (run) showRunMap(run);
  });
  panel.querySelector('.tdcp-btn-play').addEventListener('click', () => {
    panel.remove();
    showTowerDefenseScreen(levelDef, nodeId, run);
  });
  panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
}

// ── Inter-node Panel ───────────────────────────────────────────

function showInterNodePanel(node, run) {
  const meta  = TD_INTER_META[node.type] || { icon:'🎲', color:'#A78BFA', label:'Unknown' };
  const panel = document.createElement('div');
  panel.className = 'tdcp-overlay';

  function finishNode() { markNodeCompleted(run, node.id); panel.remove(); showRunMap(run); }

  if (node.type === 'rest') {
    panel.innerHTML = `
      <div class="tdcp-panel">
        <div class="tdcp-header">
          <div class="tdcp-icon">${meta.icon}</div>
          <div class="tdcp-title-wrap">
            <div class="tdcp-name">Rest Site</div>
            <div class="tdcp-act">Restore before the next battle</div>
          </div>
        </div>
        <div class="tdcp-rest-choices">
          <button class="tdcp-rest-choice tdcp-choice-lives" data-choice="lives">❤️ +2 Lives<div class="tdcp-choice-sub">for your next battle</div></button>
          <button class="tdcp-rest-choice tdcp-choice-gold"  data-choice="gold">🪙 +30 Gold<div class="tdcp-choice-sub">for your next battle</div></button>
        </div>
        <div class="tdcp-actions"><button class="tdcp-btn-back">← Back</button></div>
      </div>`;
    panel.querySelector('.tdcp-btn-back').addEventListener('click', () => panel.remove());
    panel.querySelectorAll('.tdcp-rest-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        tdSaveRestBonus(btn.dataset.choice === 'lives' ? {type:'lives',value:2} : {type:'gold',value:30});
        finishNode();
      });
    });

  } else if (node.type === 'shop') {
    const currentGold = gold;
    const itemsHtml = TD_SHOP_ITEMS.map(item => `
      <div class="tdcp-shop-item${currentGold < item.cost ? ' cannot-afford' : ''}" data-item="${item.id}">
        <span class="tdcp-shop-icon">${item.icon}</span>
        <span class="tdcp-shop-label">${item.label}</span>
        <span class="tdcp-shop-cost">🪙${item.cost}</span>
      </div>`).join('');
    panel.innerHTML = `
      <div class="tdcp-panel">
        <div class="tdcp-header">
          <div class="tdcp-icon">${meta.icon}</div>
          <div class="tdcp-title-wrap">
            <div class="tdcp-name">Shop</div>
            <div class="tdcp-act">Your gold: 🪙${currentGold}</div>
          </div>
        </div>
        <div class="tdcp-shop-grid">${itemsHtml}</div>
        <div class="tdcp-actions">
          <button class="tdcp-btn-back">← Back</button>
          <button class="tdcp-btn-play tdcp-btn-leave">Leave Shop</button>
        </div>
      </div>`;
    panel.querySelector('.tdcp-btn-back').addEventListener('click', () => panel.remove());
    panel.querySelector('.tdcp-btn-leave').addEventListener('click', finishNode);
    panel.querySelectorAll('.tdcp-shop-item:not(.cannot-afford)').forEach(el => {
      el.addEventListener('click', () => {
        const item = TD_SHOP_ITEMS.find(i => i.id === el.dataset.item);
        if (!item || gold < item.cost) return;
        spendGold(item.cost);
        const absVal = parseInt(item.effect.replace(/[^0-9]/g,''));
        const eff    = item.effect.split('+')[0].split('-')[0];
        if      (eff === 'lives')      { const c = tdLoadRestBonus(); tdSaveRestBonus({type:'lives', value:((c&&c.type==='lives')?c.value:0)+absVal}); }
        else if (eff === 'gold')       { earnGold(absVal); }
        else if (eff === 'rest_lives') { const c = tdLoadRestBonus(); tdSaveRestBonus({type:'lives', value:((c&&c.type==='lives')?c.value:0)+absVal}); }
        else if (eff === 'rest_gold')  { const c = tdLoadRestBonus(); tdSaveRestBonus({type:'gold',  value:((c&&c.type==='gold') ?c.value:0)+absVal}); }
        finishNode();
      });
    });

  } else if (node.type === 'event') {
    const ev = TD_EVENTS[Math.floor(Math.random() * TD_EVENTS.length)];
    panel.innerHTML = `
      <div class="tdcp-panel">
        <div class="tdcp-header">
          <div class="tdcp-icon">${meta.icon}</div>
          <div class="tdcp-title-wrap">
            <div class="tdcp-name">Random Event</div>
            <div class="tdcp-act">Something unexpected happens</div>
          </div>
        </div>
        <div class="tdcp-event-card">
          <div class="tdcp-event-icon">${ev.icon}</div>
          <div class="tdcp-event-title">${ev.title}</div>
          <div class="tdcp-event-desc">${ev.desc}</div>
        </div>
        <div class="tdcp-actions"><button class="tdcp-btn-play tdcp-btn-accept">Accept</button></div>
      </div>`;
    panel.querySelector('.tdcp-btn-accept').addEventListener('click', () => { applyTDEvent(ev); finishNode(); });

  } else if (node.type === 'elite') {
    renderEliteQuestion(node, panel, finishNode);
  }

  if (node.type !== 'elite') panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
  document.body.appendChild(panel);
}

function applyTDEvent(ev) {
  const minus  = ev.effect.includes('-');
  const absVal = parseInt(ev.effect.replace(/[^0-9]/g,''));
  if      (ev.effect.startsWith('gold'))  { if (minus) spendGold(Math.min(gold,absVal)); else earnGold(absVal); }
  else if (ev.effect.startsWith('xp'))    { awardXP(true, 'drill'); }
  else if (ev.effect.startsWith('lives')) {
    const c = tdLoadRestBonus(), cv = (c&&c.type==='lives')?c.value:0;
    tdSaveRestBonus({type:'lives', value: cv + (minus ? -absVal : absVal)});
  }
}

function renderEliteQuestion(node, panel, onComplete) {
  const hardQ  = allQuestions.filter(q => tdQDifficulty(q) === 'hard');
  const q      = hardQ.length ? hardQ[Math.floor(Math.random()*hardQ.length)] : allQuestions[Math.floor(Math.random()*allQuestions.length)];
  const meta   = TD_INTER_META[node.type] || {icon:'⚔️',color:'#EF4444'};
  const reward = 60;
  const optsHtml = q.type === 'mc'
    ? q.options.map((o,i) => `<button class="tdcp-elite-opt" data-idx="${i}">${LETTERS[i]}. ${o}</button>`).join('')
    : `<button class="tdcp-elite-opt" data-idx="0" data-correct="${q.correct===true}">True</button>
       <button class="tdcp-elite-opt" data-idx="1" data-correct="${q.correct===false}">False</button>`;
  panel.innerHTML = `
    <div class="tdcp-panel">
      <div class="tdcp-header">
        <div class="tdcp-icon">${meta.icon}</div>
        <div class="tdcp-title-wrap">
          <div class="tdcp-name">Elite Encounter</div>
          <div class="tdcp-act">Correct answer earns 🪙${reward}</div>
        </div>
      </div>
      <div class="tdcp-elite-stem">${q.stem}</div>
      <div class="tdcp-elite-opts">${optsHtml}</div>
      <div class="tdcp-elite-feedback" id="elite-feedback"></div>
    </div>`;
  function resolve(correct) {
    const fb = panel.querySelector('#elite-feedback');
    if (correct) { fb.textContent = '✅ Correct! +🪙'+reward; fb.style.color='#10B981'; earnGold(reward); }
    else         { fb.textContent = '❌ Incorrect. '+(q.explanation||''); fb.style.color='#EF4444'; }
    setTimeout(() => { panel.remove(); if (onComplete) onComplete(); }, 2200);
  }
  if (q.type === 'mc') {
    panel.querySelectorAll('.tdcp-elite-opt').forEach(btn => btn.addEventListener('click', () => resolve(parseInt(btn.dataset.idx) === q.answer)));
  } else {
    panel.querySelectorAll('.tdcp-elite-opt').forEach(btn => btn.addEventListener('click', () => resolve(btn.dataset.correct === 'true')));
  }
}

// ── Run Complete Screen ───────────────────────────────────────

function showRunCompleteScreen(run, finalGoldReward) {
  const mapDef = TD_MAPS[run.mapId];
  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('td-world');

  const s = run.stats;
  EL.contentArea.innerHTML = `
    <div class="run-complete-screen">
      <div class="run-complete-badge">${mapDef.icon}</div>
      <div class="run-complete-title" style="color:${mapDef.color}">${mapDef.name} Cleared!</div>
      <div class="run-complete-sub">You defeated the boss and completed the run</div>
      <div class="run-complete-stats">
        <div class="run-stat-item"><span class="run-stat-icon">⚔️</span><span class="run-stat-val">${s.battlesWon}</span><span class="run-stat-lbl">Battles Won</span></div>
        <div class="run-stat-item"><span class="run-stat-icon">🪙</span><span class="run-stat-val">${s.goldEarned}</span><span class="run-stat-lbl">Gold Earned</span></div>
        <div class="run-stat-item"><span class="run-stat-icon">⭐</span><span class="run-stat-val">${xp.toLocaleString()}</span><span class="run-stat-lbl">Total XP</span></div>
      </div>
      <div class="run-complete-btns">
        <button class="td-wave-btn" id="rc-play-again">▶ Play Again</button>
        <button class="td-map-btn"  id="rc-choose-map">🗺️ Choose Map</button>
      </div>
    </div>`;

  document.getElementById('rc-play-again').addEventListener('click', () => {
    const newRun = generateRun(run.mapId);
    showRunMap(newRun);
  });
  document.getElementById('rc-choose-map').addEventListener('click', showMapSelection);
}

// ── Tutorial ───────────────────────────────────────────────────

function showTutorial(onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  overlay.innerHTML = `
    <div class="tutorial-panel">
      <h2>🛡️ How to Play</h2>
      <div class="tutorial-steps">
        <div class="tutorial-step">
          <div class="tutorial-step-num">1</div>
          <div class="tutorial-step-body">
            <div class="tutorial-step-title">Place Towers</div>
            <div class="tutorial-step-desc">Select a tower type from the build panel, then tap any empty cell on the map. Towers cost gold — place them on high-traffic path bends for maximum effect.</div>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="tutorial-step-num">2</div>
          <div class="tutorial-step-body">
            <div class="tutorial-step-title">Start the Wave</div>
            <div class="tutorial-step-desc">Press <strong>Start Wave</strong> to send enemies down the path. Don't let them reach the exit — each one costs a life.</div>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="tutorial-step-num">3</div>
          <div class="tutorial-step-body">
            <div class="tutorial-step-title">Answer Questions to Earn Gold</div>
            <div class="tutorial-step-desc">A quiz question appears during each wave. Correct answers earn gold to buy and upgrade towers. Wrong answers cost you gold — study up!</div>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="tutorial-step-num">4</div>
          <div class="tutorial-step-body">
            <div class="tutorial-step-title">Upgrade &amp; Sell</div>
            <div class="tutorial-step-desc">Tap a placed tower to upgrade it (stronger) or sell it (refund) between waves. 3-star levels unlock the next.</div>
          </div>
        </div>
      </div>
      <button class="btn-tutorial-ok" id="btn-tutorial-ok">Got it — Let's Play!</button>
    </div>`;
  document.body.appendChild(overlay);
  function closeTutorial() {
    StorageManager.set(TUTORIAL_KEY, '1');
    overlay.remove();
    if (onClose) onClose();
  }
  document.getElementById('btn-tutorial-ok').addEventListener('click', closeTutorial);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeTutorial();
  });
}

// ── Game screen ────────────────────────────────────────────────

function showTowerDefenseScreen(levelDef, nodeId, run) {
  const levelIdx = typeof nodeId === 'number' ? nodeId : -1; // compat
  if (td && td.running) { cancelAnimationFrame(td.animFrame); td.running = false; }

  // Apply and clear any pending rest bonus
  const restBonus = tdLoadRestBonus();
  const carryGold = (run && run.stats && run.stats.carryGold) || 0;
  const startLives = levelDef.startLives + (restBonus && restBonus.type === 'lives' ? Math.max(0, restBonus.value) : 0);
  const startGold  = levelDef.startGold + carryGold + (restBonus && restBonus.type === 'gold' ? Math.max(0, restBonus.value) : 0);
  tdClearRestBonus();
  if (run && run.stats) { run.stats.carryGold = 0; tdSaveRun(run); }

  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');

  setTopBar('td-level', { name: levelDef.name, levelIdx });

  EL.contentArea.innerHTML = `
    <div id="td-wrap">
      <div id="td-hud">
        <div class="td-stat td-stat-lives">
          <div class="td-stat-top"><span>❤️</span><span id="td-lives">${startLives}</span></div>
          <div class="td-lives-bar"><div id="td-lives-fill"></div></div>
        </div>
        <div class="td-mid">
          <div id="td-wave-lbl">Place towers, then start!</div>
          <div id="td-wave-dots" class="td-wave-dots"></div>
        </div>
        <div class="td-stat">🪙 <span id="td-gold-val">${startGold}</span></div>
        <button id="td-mute-btn" class="td-mute-btn" title="Toggle sound">🔊</button>
        <button id="td-pause-btn" class="td-mute-btn" title="Pause/Resume">⏸</button>
      </div>
      <div id="td-canvas-wrap">
        <canvas id="td-canvas"></canvas>
        <div id="td-place-chip" class="td-place-chip" style="display:none"></div>
      </div>
      <div id="td-tools">
        ${TD_TOWER_DEFS.map(t => `
          <button class="td-tool-btn" data-tool="${t.id}">
            <span class="td-tool-icon">${t.icon}</span>
            <span class="td-tool-name">${t.name}</span>
            <span class="td-tool-cost">🪙${t.cost}</span>
          </button>`).join('')}
        <button class="td-tool-btn td-upgrade-btn" data-tool="upgrade">
          <span class="td-tool-icon">⬆️</span>
          <span class="td-tool-name">Upgrade</span>
          <span class="td-tool-cost">tap★</span>
        </button>
        <button class="td-tool-btn td-sell-btn" data-tool="sell">
          <span class="td-tool-icon">💸</span>
          <span class="td-tool-name">Sell</span>
          <span class="td-tool-cost">×0.6</span>
        </button>
      </div>
      <div id="td-inspect-card" class="td-inspect-card" style="display:none"></div>
      <div id="td-actions">
        <div id="td-wave-preview" class="td-wave-preview" style="display:none"></div>
        <div class="td-actions-row">
          <button class="td-quiz-btn" id="td-quiz-btn">📝 +25🪙 (3)</button>
          <button class="td-wave-btn" id="td-wave-btn">⚔️ Start Wave 1</button>
        </div>
      </div>
      <div class="td-q-overlay" id="td-q-overlay">
        <div class="td-q-sheet" id="td-q-sheet"></div>
      </div>
    </div>`;

  initTDGame(levelDef, levelIdx, startLives, startGold);
  td.__run   = run || null;
  td.__nodeId = nodeId;

  if (!StorageManager.get(TD_TUTORIAL_KEY)) {
    tdShowTutorial();
    return;
  }

  const _savedRaw = StorageManager.get(AUTOSAVE_KEY);
  const _saved = _savedRaw ? JSON.parse(_savedRaw) : null;
  if (_saved && _saved.levelIdx === levelIdx) {
    td.paused = true;
    const overlay = EL.tdQOverlay;
    const sheet   = EL.tdQSheet;
    sheet.innerHTML = `
      <div style="padding:1.5rem;text-align:center">
        <div style="font-size:1.1rem;font-weight:600;margin-bottom:1rem">💾 Resume saved game?</div>
        <div style="display:flex;gap:.75rem;justify-content:center">
          <button class="td-wave-btn" id="td-resume-yes" style="flex:1">▶ Resume</button>
          <button class="td-map-btn"  id="td-resume-no"  style="flex:1">🆕 New Game</button>
        </div>
      </div>`;
    overlay.classList.add('open');
    document.getElementById('td-resume-yes').addEventListener('click', () => {
      td.gold   = _saved.gold;
      td.lives  = _saved.lives;
      td.towers = _saved.towers.map(function(t) {
        return { col: t.col, row: t.row, type: t.type, level: t.level || 0, cd: 0 };
      });
      td.waveIdx = _saved.waveActive ? _saved.waveIdx - 1 : _saved.waveIdx;
      tdUpdateHUD();
      tdUpdateWaveBtn();
      overlay.classList.remove('open');
      td.paused = false;
    });
    document.getElementById('td-resume-no').addEventListener('click', () => {
      StorageManager.remove(AUTOSAVE_KEY);
      overlay.classList.remove('open');
      td.paused = false;
    });
  }
}

function initTDGame(levelDef, levelIdx, startLivesOverride, startGoldOverride) {
  td = tdMakeState(levelDef, levelIdx, startLivesOverride, startGoldOverride);
  const canvas = document.getElementById('td-canvas');
  const wrap   = document.getElementById('td-canvas-wrap');
  td.canvas = canvas;
  td.ctx    = canvas.getContext('2d');

  // Cache TD HUD refs — injected dynamically so must be queried here, not in bindUI
  EL.tdGoldVal   = document.getElementById('td-gold-val');
  EL.tdLives     = document.getElementById('td-lives');
  EL.tdLivesFill = document.getElementById('td-lives-fill');
  EL.tdWaveLbl   = document.getElementById('td-wave-lbl');
  EL.tdWaveDots  = document.getElementById('td-wave-dots');
  EL.tdQuizBtn   = document.getElementById('td-quiz-btn');
  EL.tdWaveBtn   = document.getElementById('td-wave-btn');
  EL.tdPauseBtn  = document.getElementById('td-pause-btn');
  EL.tdMuteBtn   = document.getElementById('td-mute-btn');
  EL.tdActions   = document.getElementById('td-actions');
  EL.tdQOverlay  = document.getElementById('td-q-overlay');
  EL.tdQSheet    = document.getElementById('td-q-sheet');
  EL.tdPlaceChip    = document.getElementById('td-place-chip');
  EL.tdWavePreview  = document.getElementById('td-wave-preview');
  EL.tdInspectCard  = document.getElementById('td-inspect-card');

  const W = Math.min(wrap.clientWidth || window.innerWidth, 500);
  td.cellSize   = Math.floor(W / TD_COLS);
  canvas.width  = td.cellSize * TD_COLS;
  canvas.height = td.cellSize * TD_ROWS;
  canvas.style.width  = canvas.width  + 'px';
  canvas.style.height = canvas.height + 'px';

  // Pre-compute terrain decorations (deterministic, no per-frame random)
  for (let row = 0; row < TD_ROWS; row++) {
    for (let col = 0; col < TD_COLS; col++) {
      if (td.pathSet.has(`${col},${row}`)) continue;
      const base = ((col * 2654435761 + row * 1234567891) >>> 0);
      const n = 2 + (base % 3);
      for (let i = 0; i < n; i++) {
        const seed = ((base ^ (i * 987654321)) >>> 0);
        td.terrainDeco.push({
          col, row,
          fx: ((seed & 0xFF) / 255) * 0.80 + 0.10,
          fy: (((seed >> 8) & 0xFF) / 255) * 0.80 + 0.10,
          phase: (((seed >> 16) & 0xFF) / 255) * Math.PI * 2,
          h: 0.09 + (((seed >> 24) & 0x0F) / 15) * 0.11,
          isPebble: ((seed >> 28) & 3) === 0,
        });
      }
    }
  }

  document.querySelectorAll('.td-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (td.inspectTower) tdDismissInspectCard();
      const tool = btn.dataset.tool;
      td.selectedTool = td.selectedTool === tool ? null : tool;
      document.querySelectorAll('.td-tool-btn').forEach(b => b.classList.remove('active'));
      if (td.selectedTool) btn.classList.add('active');
      td.pendingCol = td.pendingRow = -1;
      tdUpdatePlaceChip();
    });
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * sx / td.cellSize);
    const row = Math.floor((e.clientY - rect.top)  * sy / td.cellSize);
    td.tapCol = col; td.tapRow = row;
    tdHandleTap(col, row);
  });

  canvas.addEventListener('mousemove', e => {
    if (!td) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    td.hoverCol = Math.floor((e.clientX - rect.left) * sx / td.cellSize);
    td.hoverRow = Math.floor((e.clientY - rect.top)  * sy / td.cellSize);
  });
  canvas.addEventListener('mouseleave', () => { if (td) { td.hoverCol = -1; td.hoverRow = -1; } });
  canvas.addEventListener('touchmove', e => {
    if (!td) return;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    td.hoverCol = Math.floor((t.clientX - rect.left) * sx / td.cellSize);
    td.hoverRow = Math.floor((t.clientY - rect.top)  * sy / td.cellSize);
  }, { passive: true });

  EL.tdMuteBtn.addEventListener('click', () => {
    const muted = tdAudio.toggleMute();
    tdMusic.setMuted(muted);
    EL.tdMuteBtn.textContent = muted ? '🔇' : '🔊';
  });

  EL.tdPauseBtn.addEventListener('click', () => {
    if (!td || td.over || td.won) return;
    td.paused = !td.paused;
    EL.tdPauseBtn.textContent = td.paused ? '▶' : '⏸';
    tdMusic.setPaused(td.paused);
  });

  EL.tdWaveBtn.addEventListener('click', tdOnWaveBtn);
  EL.tdQuizBtn.addEventListener('click', () => {
    if (!td || td.quizOpen || td.over || td.won) return;
    if (td.optQuizUsed >= 3) {
      const btn = EL.tdQuizBtn;
      if (btn) { btn.textContent = '📝 Max 3/wave'; setTimeout(() => tdUpdateHUD(), 1500); }
      return;
    }
    tdOpenQuiz(25, true, () => { td.optQuizUsed++; tdUpdateHUD(); });
  });

  td.autoSaveInterval = setInterval(() => {
    if (!td || td.over || td.won) return;
    StorageManager.set(AUTOSAVE_KEY, JSON.stringify({
      levelIdx: td.levelIdx,
      gold: td.gold,
      lives: td.lives,
      waveIdx: td.waveIdx,
      waveActive: td.waveActive,
      towers: td.towers,
    }));
  }, 30000);

  tdUpdateHUD();
  tdRender();
  td.running = true;
  td.lastTs  = performance.now();
  td.animFrame = requestAnimationFrame(tdLoop);
}

function tdClearAutosave() {
  if (td && td.autoSaveInterval) { clearInterval(td.autoSaveInterval); td.autoSaveInterval = null; }
  StorageManager.remove(AUTOSAVE_KEY);
}

// ── Game state ─────────────────────────────────────────────────

function tdMakeState(levelDef, levelIdx, startLivesOverride, startGoldOverride) {
  const initialLives = startLivesOverride != null ? startLivesOverride : levelDef.startLives;
  const initialGold  = startGoldOverride  != null ? startGoldOverride  : levelDef.startGold;
  return {
    running:false, paused:false, animFrame:null, lastTs:0,
    canvas:null, ctx:null, cellSize:40,
    lives: initialLives, gold: initialGold, maxLives: initialLives,
    waveIdx:-1, spawnQueue:[], spawnTimer:0, waveActive:false,
    enemies:[], towers:[], projectiles:[], particles:[], damageNumbers:[],
    selectedTool:null, pendingCol:-1, pendingRow:-1, eid:0, inspectTower:null,
    quizOpen:false, quizQ:null, quizAnswered:false, quizDone:null, quizOptional:false,
    tapCol:-1, tapRow:-1,
    over:false, won:false, shake:0, lastShootSnd:0, hoverCol:-1, hoverRow:-1,
    bgTime: 0, terrainDeco: [],
    levelDef, levelIdx,
    pathSet: tdComputePathSet(levelDef.wps),
    optQuizUsed: 0,
  };
}

let td = null;

// ── Game loop ──────────────────────────────────────────────────

function tdLoop(ts) {
  if (!td || !td.running) return;
  const dt = Math.min((ts - td.lastTs) / 1000, 0.1);
  td.lastTs = ts;
  td.bgTime += dt;
  if (!td.paused && !td.over && !td.won) {
    tdUpdate(dt);
    // T-4: update music intensity based on enemy pressure
    if (td.waveActive) {
      const isBossWave = td.levelDef.waveDefs[td.waveIdx]?.some(([t]) => t === 'boss');
      tdMusic.setIntensity(td.enemies.length, isBossWave);
    }
  }
  tdRender();
  td.animFrame = requestAnimationFrame(tdLoop);
}

function tdUpdate(dt) {
  if (td.waveActive && td.spawnQueue.length > 0) {
    td.spawnTimer -= dt;
    if (td.spawnTimer <= 0) {
      const { type, gap } = td.spawnQueue.shift();
      tdSpawnEnemy(type);
      td.spawnTimer = gap;
    }
  }

  const leaked = [];
  for (const e of td.enemies) {
    if (tdMoveEnemy(e, dt)) leaked.push(e);
  }
  for (const e of leaked) {
    td.enemies = td.enemies.filter(x => x !== e);
    td.lives   = Math.max(0, td.lives - (e.lifeLoss || 1));
    tdUpdateHUD();
    tdAudio.lifeLost();
    td.shake = e.isBoss ? 1.2 : 0.45;
    if (td.lives <= 0 && !td.over) { tdGameOver(); return; }
  }

  tdFireTowers(dt);
  tdMoveProjectiles(dt);

  const died = td.enemies.filter(e => e.hp <= 0);
  for (const e of died) {
    td.gold += e.reward;
    td.damageNumbers.push({ x: e.x + 8, y: e.y - e.r * td.cellSize - 10, label: '+' + e.reward + '🪙', life: 0.85, maxLife: 0.85, color: '#FBBF24' });
    if (e.isBoss) {
      tdSpawnParticles(e.x, e.y, e.color, 40);
      tdSpawnParticles(e.x, e.y, '#FFFFFF', 16);
      tdSpawnParticles(e.x, e.y, '#FBBF24', 24);
      td.shake = 0.9;
    } else {
      tdSpawnParticles(e.x, e.y, e.color, 12);
      tdSpawnParticles(e.x, e.y, '#FFFFFF', 4);
    }
    tdAudio.death(td.canvas ? e.x / td.canvas.width : 0.5);
  }
  if (died.length) { td.enemies = td.enemies.filter(e => e.hp > 0); tdUpdateHUD(); }

  td.particles = td.particles.filter(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0;
  });

  td.damageNumbers = td.damageNumbers.filter(n => {
    n.y -= 28 * dt; n.life -= dt; return n.life > 0;
  });

  for (const t of td.towers)  if (t.firePulse)  t.firePulse  = Math.max(0, t.firePulse  - dt);
  for (const e of td.enemies) if (e.hitFlash)   e.hitFlash   = Math.max(0, e.hitFlash   - dt);

  if (td.waveActive && td.spawnQueue.length === 0 && td.enemies.length === 0) {
    td.waveActive = false;
    td.gold += 15;
    td.damageNumbers.push({ x: td.canvas ? td.canvas.width / 2 : 160, y: td.canvas ? td.canvas.height * 0.18 : 80, label: '+15🪙 Wave Clear!', life: 1.6, maxLife: 1.6, color: '#FBBF24' });
    if (td.waveIdx >= td.levelDef.waveDefs.length - 1) tdVictory();
    else { tdUpdateHUD(); tdUpdateWaveBtn(); }
  }
}

// ── Enemies ────────────────────────────────────────────────────

function tdSpawnEnemy(type) {
  const def  = TD_ENEMY_DEFS[type];
  const mult = td.levelDef.enemyMult;
  const cs   = td.cellSize;
  const [c0, r0] = td.levelDef.wps[0];
  td.enemies.push({
    id: td.eid++, type,
    hp: def.maxHp * mult, maxHp: def.maxHp * mult,
    spd: def.spd, color: def.color, r: def.r, reward: def.reward,
    isBoss: def.isBoss || false, lifeLoss: def.lifeLoss || 1,
    hitFlash: 0, animOffset: Math.random() * 100, wpIdx: 1,
    x: c0 * cs + cs / 2,
    y: r0 * cs + cs / 2,
    dist: 0,
  });
}

function tdMoveEnemy(e, dt) {
  const cs  = td.cellSize;
  const wps = td.levelDef.wps;
  let rem = e.spd * cs * dt;
  while (rem > 0 && e.wpIdx < wps.length) {
    const [tc, tr] = wps[e.wpIdx];
    const tx = tc * cs + cs / 2, ty = tr * cs + cs / 2;
    const dx = tx - e.x, dy = ty - e.y;
    const d  = Math.hypot(dx, dy);
    if (d < 0.5) { e.wpIdx++; continue; }
    if (rem >= d) { e.x = tx; e.y = ty; e.dist += d; rem -= d; e.wpIdx++; }
    else          { const f = rem / d; e.x += dx*f; e.y += dy*f; e.dist += rem; rem = 0; }
  }
  return e.wpIdx >= wps.length;
}

// ── Towers ─────────────────────────────────────────────────────

function tdFireTowers(dt) {
  for (const t of td.towers) {
    t.cd = (t.cd || 0) - dt;
    if (t.cd > 0) continue;
    const stats   = tdGetTowerStats(t);
    const cs      = td.cellSize;
    const tx      = t.col * cs + cs / 2, ty = t.row * cs + cs / 2;
    const rangePx = stats.range * cs;
    let target = null, bestDist = -1;
    for (const e of td.enemies) {
      const d = Math.hypot(e.x - tx, e.y - ty);
      if (d <= rangePx && e.dist > bestDist) { target = e; bestDist = e.dist; }
    }
    if (target) {
      td.projectiles.push({
        x: tx, y: ty, eid: target.id,
        spd: 280, dmg: stats.dmg,
        splash: stats.splash * cs,
        color: stats.glow || stats.color,
      });
      t.cd = 1 / stats.rate;
      t.firePulse = 0.22;
      const now = performance.now();
      if (now - td.lastShootSnd > 80) { tdAudio.shoot(t.col / (TD_COLS - 1)); td.lastShootSnd = now; }
    }
  }
}

function tdMoveProjectiles(dt) {
  const keep = [];
  for (const p of td.projectiles) {
    const target = td.enemies.find(e => e.id === p.eid);
    if (!target || target.hp <= 0) continue;
    const dx = target.x - p.x, dy = target.y - p.y;
    const d  = Math.hypot(dx, dy);
    if (p.spd * dt >= d) {
      const hx = target.x, hy = target.y;
      if (p.splash > 0) {
        for (const e of td.enemies) {
          if (Math.hypot(e.x - hx, e.y - hy) <= p.splash) e.hp -= p.dmg;
        }
      } else {
        target.hp -= p.dmg;
      }
      td.damageNumbers.push({ x: hx, y: hy - 8, val: Math.round(p.dmg), life: 0.65, maxLife: 0.65, color: p.color });
      if (target) target.hitFlash = 0.14;
      tdAudio.hit(td.canvas ? hx / td.canvas.width : 0.5);
      tdSpawnParticles(hx, hy, p.color, 5);
    } else {
      const f = p.spd * dt / d;
      p.px = p.x; p.py = p.y;
      p.x += dx * f; p.y += dy * f;
      keep.push(p);
    }
  }
  td.projectiles = keep;
}

function tdSpawnParticles(cx, cy, color, n) {
  if (reducedMotionQuery && reducedMotionQuery.matches) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, spd = 30 + Math.random() * 80;
    const life = 0.25 + Math.random() * 0.3;
    td.particles.push({
      x: cx, y: cy,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      life, maxLife: life, r: 2 + Math.random() * 3, color,
    });
  }
}

// ── Tower placement, upgrade & selling ────────────────────────

function tdHandleTap(col, row) {
  if (!td || td.over || td.won || td.quizOpen) return;
  if (col < 0 || col >= TD_COLS || row < 0 || row >= TD_ROWS) return;

  if (td.selectedTool && td.inspectTower) tdDismissInspectCard();

  if (td.selectedTool === 'sell') {
    const idx = td.towers.findIndex(t => t.col === col && t.row === row);
    if (idx >= 0) {
      const t   = td.towers[idx];
      const def = TD_TOWER_DEFS.find(d => d.id === t.type);
      let totalSpent = def.cost;
      for (let l = 0; l < (t.level || 0); l++) totalSpent += def.upgrades[l].cost;
      // Full refund for towers placed this build phase (before wave started)
      const refundRate = t.placedThisBuild ? 1.0 : 0.6;
      td.gold += Math.round(totalSpent * refundRate);
      td.towers.splice(idx, 1);
      tdUpdateHUD();
    }
    return;
  }

  if (td.selectedTool === 'upgrade') {
    const t = td.towers.find(tt => tt.col === col && tt.row === row);
    if (!t) return;
    const def = TD_TOWER_DEFS.find(d => d.id === t.type);
    const lvl = t.level || 0;
    if (lvl >= 2) return;
    const upgCost = def.upgrades[lvl].cost;
    if (td.gold < upgCost) return;
    td.gold -= upgCost;
    t.level = lvl + 1;
    tdUpdateHUD();
    tdAudio.place(t.col / (TD_COLS - 1));
    return;
  }

  if (!td.selectedTool) {
    const hit = td.towers.find(t => t.col === col && t.row === row);
    if (hit) tdShowInspectCard(hit); else tdDismissInspectCard();
    return;
  }
  if (td.pathSet.has(`${col},${row}`)) return;
  if (td.towers.some(t => t.col === col && t.row === row)) return;

  const def = TD_TOWER_DEFS.find(d => d.id === td.selectedTool);
  if (!def || td.gold < def.cost) return;

  if (td.pendingCol === col && td.pendingRow === row) {
    // Confirmed — commit the placement
    td.gold -= def.cost;
    td.towers.push({ col, row, type: def.id, cd: 0, level: 0, placedThisBuild: true });
    td.pendingCol = td.pendingRow = -1;
    tdUpdatePlaceChip();
    tdUpdateHUD();
    tdAudio.place(col / (TD_COLS - 1));
  } else {
    // First tap — show confirmation chip
    td.pendingCol = col;
    td.pendingRow = row;
    tdUpdatePlaceChip();
  }
}

function tdUpdatePlaceChip() {
  const chip = EL.tdPlaceChip;
  if (!chip) return;
  if (td.pendingCol < 0 || !td.selectedTool) {
    chip.style.display = 'none';
    return;
  }
  const def = TD_TOWER_DEFS.find(d => d.id === td.selectedTool);
  if (!def) { chip.style.display = 'none'; return; }
  chip.style.display = 'flex';

  // Position the chip floating near the tower cell
  const cs = td.cellSize;
  const col = td.pendingCol, row = td.pendingRow;
  const chipH = 88; // label + buttons row
  const centerY = row * cs + cs / 2;
  chip.style.top = Math.max(4, Math.min(centerY - chipH / 2, (td.canvas ? td.canvas.height : cs * TD_ROWS) - chipH - 4)) + 'px';
  if (col <= Math.floor(TD_COLS / 2)) {
    chip.style.left = ((col + 1) * cs + 6) + 'px';
    chip.style.right = 'auto';
  } else {
    chip.style.left = 'auto';
    chip.style.right = ((TD_COLS - col) * cs + 6) + 'px';
  }

  chip.innerHTML = `
    <span class="td-chip-label">${def.icon || ''} ${def.name}<br><span class="td-chip-cost">${def.cost}🪙</span></span>
    <div class="td-chip-btns">
      <button class="td-chip-ok" title="Confirm">✓</button>
      <button class="td-chip-cancel" title="Cancel">✗</button>
    </div>`;
  chip.querySelector('.td-chip-ok').addEventListener('click', () => {
    const col = td.pendingCol, row = td.pendingRow;
    if (col < 0) return;
    if (!td.pathSet.has(`${col},${row}`) && !td.towers.some(t => t.col === col && t.row === row) && td.gold >= def.cost) {
      td.gold -= def.cost;
      td.towers.push({ col, row, type: def.id, cd: 0, level: 0, placedThisBuild: true });
      tdUpdateHUD();
      tdAudio.place(col / (TD_COLS - 1));
    }
    td.pendingCol = td.pendingRow = -1;
    tdUpdatePlaceChip();
  });
  chip.querySelector('.td-chip-cancel').addEventListener('click', () => {
    td.pendingCol = td.pendingRow = -1;
    tdUpdatePlaceChip();
  });
}

// ── Tutorial (first-run, shown once, localStorage-gated) ──────

function tdShowTutorial() {
  td.paused = true;
  const overlay = EL.tdQOverlay;
  const sheet   = EL.tdQSheet;
  const steps = [
    { icon: '🏗️', title: 'Place a tower',
      body: 'Tap a tower type below to select it, then tap an empty cell on the map to place it. Confirm with ✓. Towers fire automatically at enemies.' },
    { icon: '⚔️', title: 'Start a wave',
      body: 'Once your towers are placed, tap <strong>Start Wave</strong>. Each wave begins with a quiz question — answer correctly for bonus gold!' },
    { icon: '📝', title: 'Earn gold, upgrade, survive',
      body: 'Kill rewards and quiz gold let you buy and upgrade towers. Hold the line through all waves to win the node. Good luck!' },
  ];
  var step = 0;
  function showStep() {
    var s = steps[step];
    var isLast = step === steps.length - 1;
    sheet.innerHTML =
      '<div class="tut-card">' +
        '<div class="tut-icon">' + s.icon + '</div>' +
        '<div class="tut-title">' + s.title + '</div>' +
        '<div class="tut-body">' + s.body + '</div>' +
        '<div class="tut-dots">' + steps.map(function(_, i) {
          return '<span class="tut-dot' + (i === step ? ' active' : '') + '"></span>';
        }).join('') + '</div>' +
        '<button class="td-wave-btn tut-btn" id="tut-next">' + (isLast ? "Let's Play! 🚀" : 'Next →') + '</button>' +
      '</div>';
    document.getElementById('tut-next').addEventListener('click', function() {
      step++;
      if (step < steps.length) { showStep(); }
      else {
        StorageManager.set(TD_TUTORIAL_KEY, '1');
        overlay.classList.remove('open');
        td.paused = false;
      }
    });
  }
  overlay.classList.add('open');
  showStep();
}

// ── Tower inspect card ─────────────────────────────────────────

function tdShowInspectCard(tower) {
  td.inspectTower = tower;
  const card = EL.tdInspectCard;
  if (!card) return;
  const def   = TD_TOWER_DEFS.find(function(d) { return d.id === tower.type; });
  const stats = tdGetTowerStats(tower);
  const lvl   = tower.level || 0;
  const lvlLabel = ['L1', 'L2', 'L3'][lvl] || 'L1';
  const dps   = (stats.dmg * stats.rate).toFixed(1);
  const splashTag = stats.splash > 0 ? ' <span class="tdi-tag">AoE</span>' : '';
  const upgLine = lvl < 2
    ? '<div class="tdi-row"><span>Upgrade</span><span>' + def.upgrades[lvl].cost + '🪙</span></div>'
    : '<div class="tdi-row"><span>Upgrade</span><span>Maxed ⭐</span></div>';
  let totalSpent = def.cost;
  for (let l = 0; l < lvl; l++) totalSpent += def.upgrades[l].cost;
  const sellVal = Math.round(totalSpent * (tower.placedThisBuild ? 1.0 : 0.6));
  card.innerHTML =
    '<div class="tdi-header">' + (def.icon || '') + ' ' + def.name +
      ' <span class="tdi-lvl">' + lvlLabel + '</span></div>' +
    '<div class="tdi-row"><span>DPS' + splashTag + '</span><span>' + dps + '</span></div>' +
    '<div class="tdi-row"><span>Range</span><span>' + stats.range + ' cells</span></div>' +
    upgLine +
    '<div class="tdi-row"><span>Sell</span><span>' + sellVal + '🪙</span></div>';

  const cs = td.cellSize;
  const canvasEl = td.canvas;
  const wrap = document.getElementById('td-canvas-wrap');
  if (canvasEl && wrap) {
    const rect = canvasEl.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const scaleX = rect.width / canvasEl.width;
    const scaleY = rect.height / canvasEl.height;
    const towerPxX = tower.col * cs * scaleX + (rect.left - wrapRect.left);
    const towerPxY = tower.row * cs * scaleY + (rect.top  - wrapRect.top);
    const cardW = 164;
    var left = Math.round(towerPxX + cs * scaleX / 2 - cardW / 2);
    var top  = Math.round(towerPxY - 130);
    left = Math.max(4, Math.min(left, Math.round(wrapRect.width) - cardW - 4));
    top  = Math.max(4, top);
    card.style.left = left + 'px';
    card.style.top  = top  + 'px';
  }
  card.style.display = 'block';
}

function tdDismissInspectCard() {
  if (!td) return;
  td.inspectTower = null;
  if (EL.tdInspectCard) EL.tdInspectCard.style.display = 'none';
}

// ── Quiz system ────────────────────────────────────────────────

function tdOpenQuiz(goldReward, isOptional, onDone) {
  if (td.quizOpen) return;
  td.paused     = true;
  td.quizOpen   = true;
  td.quizAnswered = false;
  td.quizDone   = onDone;
  td.quizOptional = isOptional;

  const q    = tdPickQuestion(td.levelDef);
  const diff = tdQDifficulty(q);
  const bossMult = td.levelDef.isBoss ? 1.5 : 1.0;
  const baseReward = isOptional ? (diff === 'hard' ? 45 : diff === 'medium' ? 30 : 18) : goldReward;
  const reward = Math.round(baseReward * bossMult);
  td.quizQ = q;

  let opts = '';
  if (q.type === 'mc') {
    q.options.forEach((o, i) => {
      opts += `<button class="td-opt" data-idx="${i}" data-correct="${i === q.correct}">${LETTERS[i]}. ${o}</button>`;
    });
  } else {
    opts = `<button class="td-opt td-tf-opt" data-idx="0" data-correct="${q.correct === true}">True</button>
            <button class="td-opt td-tf-opt" data-idx="1" data-correct="${q.correct === false}">False</button>`;
  }

  const diffColors = { easy:'#4ADE80', medium:'#FBBF24', hard:'#EF4444' };

  const overlay = EL.tdQOverlay;
  const sheet   = EL.tdQSheet;
  sheet.innerHTML = `
    <div class="td-q-head">
      <div style="display:flex;gap:.5rem;align-items:center">
        <span class="td-q-reward">📝 Correct = +${reward}🪙</span>
        <span class="td-diff-badge" style="background:${diffColors[diff]}20;color:${diffColors[diff]};border:1px solid ${diffColors[diff]}55">${diff}</span>
      </div>
      ${isOptional ? `<button id="td-skip" class="td-q-skip">✕</button>` : ''}
    </div>
    <div class="td-q-meta">Part ${q.part} — ${PART_NAMES[q.part] || ''}</div>
    <div class="td-q-text">${q.stem}</div>
    <div class="td-q-opts">${opts}</div>
    <div id="td-q-fb" style="display:none" class="td-q-fb"></div>
    <button id="td-q-cont" style="display:none" class="td-q-cont">Continue →</button>`;

  overlay.classList.add('open');

  sheet.querySelectorAll('.td-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (td.quizAnswered) return;
      td.quizAnswered = true;
      const correct = btn.dataset.correct === 'true';

      sheet.querySelectorAll('.td-opt').forEach(b => {
        b.classList.add(b.dataset.correct === 'true' ? 'correct' : 'wrong');
        b.disabled = true;
      });

      const fb = sheet.querySelector('#td-q-fb');
      fb.style.display = 'block';
      if (correct) {
        td.gold += reward; tdUpdateHUD();
        fb.innerHTML = `<span class="td-fb-ok">✓ Correct! +${reward}🪙</span>`;
        awardXP(true, 'drill');
        unlockIfNew('first_blood');
        tdAudio.correct();
      } else {
        fb.innerHTML = `<span class="td-fb-no">✗ Incorrect</span>`;
        awardXP(false, 'drill');
        tdAudio.wrong();
      }
      if (q.explanation) {
        fb.innerHTML += `<div class="td-q-exp">${q.explanation}</div>`;
      }
      const cont = sheet.querySelector('#td-q-cont');
      cont.style.display = 'block';
      cont.addEventListener('click', () => tdCloseQuiz(correct));
      requestAnimationFrame(() => cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    });
  });

  sheet.querySelector('#td-skip')?.addEventListener('click', () => {
    if (!td.quizAnswered) tdCloseQuiz(false);
  });
}

function tdCloseQuiz(correct) {
  EL.tdQOverlay.classList.remove('open');
  td.quizOpen = false;
  td.paused   = false;
  if (td.quizDone) { td.quizDone(correct); td.quizDone = null; }
}

// ── Wave management ────────────────────────────────────────────

function tdOnWaveBtn() {
  if (!td || td.quizOpen || td.waveActive || td.over || td.won) return;
  const nextIdx = td.waveIdx + 1;
  if (nextIdx >= td.levelDef.waveDefs.length) return;
  tdOpenQuiz(30, false, () => {
    td.waveIdx     = nextIdx;
    td.optQuizUsed = 0;
    tdStartWave(nextIdx);
    tdUpdateWaveBtn();
    tdUpdateHUD();
  });
}

function tdStartWave(idx) {
  td.waveActive = true;
  td.spawnQueue = [];
  for (const [type, count, gap] of td.levelDef.waveDefs[idx]) {
    for (let i = 0; i < count; i++) td.spawnQueue.push({ type, gap });
  }
  td.spawnTimer = 0.5;
  // Pre-wave build phase ends — clear placedThisBuild flags and any pending placement
  for (const t of td.towers) t.placedThisBuild = false;
  td.pendingCol = td.pendingRow = -1;
  tdUpdatePlaceChip();
  tdUpdateWavePreview();
  tdAudio.waveStart();
  tdMusic.start(); // no-op if already playing
}

function tdUpdateHUD() {
  const gEl = EL.tdGoldVal;  if (gEl) gEl.textContent = td.gold;

  const lEl = EL.tdLives;
  if (lEl) {
    lEl.textContent = td.lives;
    const frac = td.lives / td.maxLives;
    lEl.style.color = frac > 0.6 ? '#4ADE80' : frac > 0.3 ? '#FBBF24' : '#EF4444';
  }
  const fillEl = EL.tdLivesFill;
  if (fillEl) {
    const frac = Math.max(0, td.lives / td.maxLives);
    fillEl.style.width = (frac * 100) + '%';
    fillEl.style.background = frac > 0.6 ? '#4ADE80' : frac > 0.3 ? '#FBBF24' : '#EF4444';
  }

  const wEl = EL.tdWaveLbl;
  const wc  = td.levelDef.waveDefs.length;
  if (wEl) {
    if (td.waveIdx < 0)           wEl.textContent = 'Place towers, then start!';
    else if (td.waveActive)       wEl.textContent = `Wave ${td.waveIdx + 1} / ${wc}`;
    else if (td.waveIdx < wc - 1) wEl.textContent = `Wave ${td.waveIdx + 1} cleared!`;
    else                          wEl.textContent = 'All waves cleared!';
  }

  const dotsEl = EL.tdWaveDots;
  if (dotsEl) {
    dotsEl.innerHTML = Array.from({length: wc}, (_, i) => {
      const cls = i < td.waveIdx ? 'done' : (i === td.waveIdx && td.waveActive ? 'active' : '');
      return `<span class="td-wdot ${cls}"></span>`;
    }).join('');
  }

  const quizBtn = EL.tdQuizBtn;
  if (quizBtn) {
    const rem = 3 - td.optQuizUsed;
    quizBtn.textContent = rem > 0 ? `📝 +25🪙 (${rem})` : '📝 Max/wave';
    quizBtn.style.opacity = rem > 0 ? '1' : '0.4';
  }
  document.querySelectorAll('.td-tool-btn[data-tool]').forEach(btn => {
    const tool = btn.dataset.tool;
    if (tool === 'sell' || tool === 'upgrade') return;
    const def = TD_TOWER_DEFS.find(d => d.id === tool);
    if (def) btn.classList.toggle('unaffordable', td.gold < def.cost);
  });
  tdUpdateWavePreview();
}

function tdUpdateWaveBtn() {
  const btn = EL.tdWaveBtn;
  if (!btn) return;
  const next = td.waveIdx + 1;
  if (next >= td.levelDef.waveDefs.length) btn.disabled = true;
  else btn.textContent = `⚔️ Start Wave ${next + 1}`;
}

function tdUpdateWavePreview() {
  const el = EL.tdWavePreview;
  if (!el) return;
  const nextIdx = td.waveIdx + 1;
  const waveDefs = td.levelDef.waveDefs;
  if (td.waveActive || nextIdx >= waveDefs.length) { el.style.display = 'none'; return; }
  const EMOJI = { goblin:'👺', orc:'👹', scout:'💨', troll:'🧌', boss:'💀' };
  const COLORS = { goblin:'#4ADE80', orc:'#FBBF24', scout:'#F472B6', troll:'#C084FC', boss:'#EF4444' };
  const wave = waveDefs[nextIdx];
  const hasBoss = wave.some(([t]) => t === 'boss');
  const chips = wave.map(([type, count]) => {
    const col = COLORS[type] || '#aaa';
    return `<span class="td-wp-chip" style="border-color:${col}40;color:${col}">${EMOJI[type] || '👾'} ×${count}</span>`;
  }).join('');
  el.innerHTML = `<span class="td-wp-lbl">Wave ${nextIdx + 1}</span>${chips}`;
  el.className = 'td-wave-preview' + (hasBoss ? ' td-wave-preview-boss' : '');
  el.style.display = 'flex';
}

// ── End states ─────────────────────────────────────────────────

function tdGameOver() {
  td.over = true;
  tdClearAutosave();
  tdMusic.stop();
  tdAudio.gameOver();
  earnGold(15);
  const actDiv = EL.tdActions;
  if (actDiv) {
    actDiv.innerHTML = `
      <div class="td-end-msg td-end-lose">💀 Defeated — the horde broke through</div>
      <button class="td-wave-btn" id="td-retry">🔄 Retry</button>
      <button class="td-map-btn" id="td-map">🗺️ Map</button>`;
    document.getElementById('td-retry').addEventListener('click', () => showTowerDefenseScreen(td.levelDef, td.__nodeId, td.__run));
    document.getElementById('td-map').addEventListener('click', () => { const r=td.__run; if (r) { const n=r.nodes.find(x=>x.id===td.__nodeId); if(n&&n.state==='active'){n.state='available';r.activeId=null;tdSaveRun(r);} showRunMap(r); } else showTDWorldMap(); });
  }
}

function tdVictory() {
  td.won = true;
  tdClearAutosave();
  tdMusic.stop();
  tdAudio.victory();
  const livesLost  = td.maxLives - td.lives;
  const stars      = livesLost === 0 ? 3 : livesLost <= 5 ? 2 : 1;
  tdSaveStars(td.levelIdx, stars);

  const goldReward = 30 + td.levelIdx * 10;
  earnGold(goldReward);
  unlockIfNew('td_win');

  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  showAchievementToast({ icon:'🛡️', name:'Victory!', desc:`${starStr} ${td.levelDef.name} cleared! +${goldReward}🪙` });

  const run   = td.__run;
  const nodeId = td.__nodeId;
  if (run && nodeId) {
    markNodeCompleted(run, nodeId);
    run.stats.battlesWon++;
    run.stats.goldEarned += goldReward;
    run.stats.carryGold = td.gold;
    tdSaveRun(run);
    if (isRunComplete(run)) {
      tdMarkMapBeaten(run.mapId);
      tdClearRun();
      showRunCompleteScreen(run, goldReward);
      return;
    }
  }

  const actDiv = EL.tdActions;
  if (actDiv) {
    actDiv.innerHTML = `
      <div class="td-star-screen">
        <div class="td-star-row">
          ${[0,1,2].map(i => `<span class="td-star-anim ${i < stars ? 'lit' : 'dim'}" style="animation-delay:${0.10 + i * 0.20}s">★</span>`).join('')}
        </div>
        <div class="td-star-level">${td.levelDef.name}</div>
        <div class="td-star-reward">+${goldReward}🪙 earned</div>
        <div class="td-star-btns">
          <button class="td-map-btn" id="td-map">🗺️ Map</button>
        </div>
      </div>`;
    document.getElementById('td-map').addEventListener('click', () => { if (run) showRunMap(run); else showTDWorldMap(); });
  }
}

// ── Rendering ──────────────────────────────────────────────────

function tdRender() {
  if (!td?.ctx) return;
  const ctx = td.ctx, cs = td.cellSize;
  const W = td.canvas.width, H = td.canvas.height;

  const isLight = document.documentElement.dataset.theme === 'light';
  const PAL = isLight
    ? { bg:'#D4E8D4', path1:'#C8A46E', path2:'#D9B87C', mortar:'#8B6040', stone:'rgba(155,105,48,.32)',
        grid:'rgba(0,0,0,.06)', inLbl:'#16A34A', outLbl:'#DC2626' }
    : { bg:'#162016', path1:'#5a3a12', path2:'#7a5225', mortar:'#28110a', stone:'rgba(80,38,8,.55)',
        grid:'rgba(255,255,255,.03)', inLbl:'#4ADE80', outLbl:'#EF4444' };

  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Parallax terrain decoration ────────────────────────────────
  const bgT = td.bgTime;
  ctx.lineCap = 'round';
  for (const d of td.terrainDeco) {
    const bx = d.col * cs + d.fx * cs;
    const by = d.row * cs + d.fy * cs;
    if (d.isPebble) {
      ctx.beginPath();
      ctx.arc(bx, by, cs * d.h * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(130,108,72,.20)' : 'rgba(28,58,28,.26)';
      ctx.fill();
    } else {
      const sway = Math.sin(bgT * 1.05 + d.phase) * cs * 0.055;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + sway, by - cs * d.h);
      ctx.strokeStyle = isLight ? 'rgba(58,108,40,.26)' : 'rgba(38,88,38,.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  // Subtle edge vignette that breathes slowly
  const vig = 0.06 + 0.022 * Math.sin(bgT * 0.28);
  const vGrad = ctx.createRadialGradient(W*.5, H*.5, W*.18, W*.5, H*.5, W*.88);
  vGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(1, `rgba(0,0,0,${vig})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, W, H);

  let sx = 0, sy = 0;
  if (td.shake > 0) {
    td.shake = Math.max(0, td.shake - 0.016);
    const mag = td.shake * 7;
    sx = (Math.random() - 0.5) * mag * 2;
    sy = (Math.random() - 0.5) * mag * 2;
  }
  ctx.save();
  ctx.translate(sx, sy);

  ctx.strokeStyle = PAL.grid;
  ctx.lineWidth = .5;
  for (let c = 1; c < TD_COLS; c++) { ctx.beginPath(); ctx.moveTo(c*cs,0); ctx.lineTo(c*cs,H); ctx.stroke(); }
  for (let r = 1; r < TD_ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*cs); ctx.lineTo(W,r*cs); ctx.stroke(); }

  // ── Cobblestone path tiles (V-12) ──────────────────────────────
  for (const key of td.pathSet) {
    const [col, row] = key.split(',').map(Number);
    const hasN = td.pathSet.has(`${col},${row-1}`);
    const hasS = td.pathSet.has(`${col},${row+1}`);
    const hasE = td.pathSet.has(`${col+1},${row}`);
    const hasW = td.pathSet.has(`${col-1},${row}`);
    const x = col*cs, y = row*cs;
    // Base fill
    ctx.fillStyle = PAL.path1;
    ctx.fillRect(x, y, cs, cs);
    // Lighter inner fill — stitched flush to connected neighbors
    const ix = x + (hasW ? 0 : 2), iy = y + (hasN ? 0 : 2);
    const iw = cs - (hasW ? 0 : 2) - (hasE ? 0 : 2);
    const ih = cs - (hasN ? 0 : 2) - (hasS ? 0 : 2);
    ctx.fillStyle = PAL.path2;
    ctx.fillRect(ix, iy, iw, ih);
    // Stone texture (deterministic per-tile)
    const seed = ((col * 2654435761) ^ (row * 1234567891)) >>> 0;
    ctx.fillStyle = PAL.stone;
    for (let s = 0; s < 2; s++) {
      const sh = ((seed ^ (s * 987654321)) >>> 0);
      const sx = x + 4 + ((sh & 0xFF) % Math.max(1, cs - 8));
      const sy2 = y + 4 + (((sh >> 8) & 0xFF) % Math.max(1, cs - 8));
      const sw = 3 + ((sh >> 16) % 4);
      const sh2 = 2 + ((sh >> 20) % 3);
      if (sx + sw < x + cs - 2 && sy2 + sh2 < y + cs - 2) ctx.fillRect(sx, sy2, sw, sh2);
    }
    // Mortar lines on disconnected edges
    ctx.fillStyle = PAL.mortar;
    if (!hasN) ctx.fillRect(x, y, cs, 2);
    if (!hasS) ctx.fillRect(x, y + cs - 2, cs, 2);
    if (!hasW) ctx.fillRect(x, y, 2, cs);
    if (!hasE) ctx.fillRect(x + cs - 2, y, 2, cs);
  }

  if (td.levelDef.deco) {
    for (const [type, col, row] of td.levelDef.deco) {
      if (td.pathSet.has(`${col},${row}`)) continue;
      const spr = TD_SPRITES[type];
      if (!spr) continue;
      const cx = col*cs + cs/2, cy = row*cs + cs/2;
      const ps = Math.max(1, Math.floor(cs * 0.82 / Math.max(spr.pw, spr.ph)));
      tdDrawSprite(ctx, spr.frames, 0, spr.pal, cx, cy, ps);
    }
  }

  const wps      = td.levelDef.wps;
  const entryRow = wps[0][1], exitRow = wps[wps.length-1][1];

  // ── Animated entry / exit portals ───────────────────────────
  const pp  = 0.5 + 0.5 * Math.sin(bgT * 2.8);
  const pp2 = 0.5 + 0.5 * Math.sin(bgT * 2.8 + Math.PI);
  const inCY  = entryRow * cs + cs / 2;
  const outCY = exitRow  * cs + cs / 2;

  // Entry glow (green, left edge)
  const inG = ctx.createLinearGradient(0, 0, cs * 0.72, 0);
  inG.addColorStop(0, `rgba(74,222,128,${0.28 + pp * 0.18})`);
  inG.addColorStop(1, 'rgba(74,222,128,0)');
  ctx.fillStyle = inG;
  ctx.fillRect(0, entryRow * cs, cs * 0.72, cs);
  ctx.fillStyle = `rgba(74,222,128,${0.65 + pp * 0.35})`;
  ctx.fillRect(0, entryRow * cs, 3, cs);
  // Entry arc
  ctx.beginPath();
  ctx.arc(0, inCY, cs * 0.38, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = `rgba(74,222,128,${0.55 + pp * 0.35})`;
  ctx.lineWidth = 2 + pp * 1.5;
  ctx.stroke();
  // Entry label
  ctx.font = `bold ${Math.round(cs * 0.32)}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(74,222,128,${0.8 + pp * 0.2})`;
  ctx.fillText('▶ IN', cs * 0.1, inCY);

  // Exit glow (orange, right edge)
  const outG = ctx.createLinearGradient(W, 0, W - cs * 0.72, 0);
  outG.addColorStop(0, `rgba(251,146,60,${0.28 + pp2 * 0.18})`);
  outG.addColorStop(1, 'rgba(251,146,60,0)');
  ctx.fillStyle = outG;
  ctx.fillRect(W - cs * 0.72, exitRow * cs, cs * 0.72, cs);
  ctx.fillStyle = `rgba(251,146,60,${0.65 + pp2 * 0.35})`;
  ctx.fillRect(W - 3, exitRow * cs, 3, cs);
  // Exit arc
  ctx.beginPath();
  ctx.arc(W, outCY, cs * 0.38, Math.PI / 2, -Math.PI / 2);
  ctx.strokeStyle = `rgba(251,146,60,${0.55 + pp2 * 0.35})`;
  ctx.lineWidth = 2 + pp2 * 1.5;
  ctx.stroke();
  // Exit label
  ctx.textAlign = 'right';
  ctx.fillStyle = `rgba(251,146,60,${0.8 + pp2 * 0.2})`;
  ctx.fillText('OUT ▶', W - cs * 0.1, outCY);

  // Pending placement cell highlight
  if (td.pendingCol >= 0 && td.pendingRow >= 0) {
    const pc = td.pendingCol, pr = td.pendingRow;
    const pulse = 0.5 + 0.5 * Math.sin(bgT * 6);
    ctx.fillStyle = `rgba(74,222,128,${0.18 + pulse * 0.14})`;
    ctx.fillRect(pc*cs, pr*cs, cs, cs);
    ctx.strokeStyle = `rgba(74,222,128,${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pc*cs + 1, pr*cs + 1, cs - 2, cs - 2);
  }

  if (td.selectedTool && td.selectedTool !== 'sell' && td.selectedTool !== 'upgrade'
      && td.hoverCol >= 0 && td.hoverCol < TD_COLS && td.hoverRow >= 0 && td.hoverRow < TD_ROWS) {
    const def = TD_TOWER_DEFS.find(d => d.id === td.selectedTool);
    if (def) {
      const col = td.hoverCol, row = td.hoverRow;
      const px  = col*cs + cs/2, py = row*cs + cs/2;
      const isPath     = td.pathSet.has(`${col},${row}`);
      const isOccupied = td.towers.some(t => t.col === col && t.row === row);
      const canAfford  = td.gold >= def.cost;
      const canPlace   = !isPath && !isOccupied;
      const accent     = canPlace && canAfford ? def.color : '#EF4444';

      ctx.beginPath(); ctx.arc(px, py, def.range*cs, 0, Math.PI*2);
      ctx.fillStyle = accent + '18'; ctx.fill();
      ctx.strokeStyle = accent + '80'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = canPlace ? (canAfford ? accent + '28' : '#FBBF2430') : '#EF444430';
      ctx.fillRect(col*cs, row*cs, cs, cs);

      ctx.globalAlpha = canPlace && canAfford ? 0.60 : 0.22;
      const ghostSpr = TD_SPRITES[def.id];
      if (ghostSpr) {
        const ghostPal = ghostSpr.pals ? ghostSpr.pals[0] : ghostSpr.pal;
        const ghostPs  = Math.max(2, Math.floor(cs * 0.82 / Math.max(ghostSpr.pw, ghostSpr.ph)));
        tdDrawSprite(ctx, ghostSpr.frames, 0, ghostPal, px, py, ghostPs);
      }
      ctx.globalAlpha = 1;
    }
  }

  for (const t of td.towers) {
    const def   = TD_TOWER_DEFS.find(d => d.id === t.type);
    const stats = tdGetTowerStats(t);
    const lvl   = t.level || 0;
    const px    = t.col*cs + cs/2, py = t.row*cs + cs/2;

    if (lvl > 0) {
      const glowColor = stats.glow || '#F59E0B';
      const ringR     = cs * (0.48 + lvl * 0.08);
      ctx.beginPath(); ctx.arc(px, py, ringR, 0, Math.PI*2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth   = lvl === 2 ? 3 : 2;
      ctx.globalAlpha = 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if ((t.firePulse || 0) > 0) {
      const prog   = 1 - t.firePulse / 0.22;
      const pulseR = cs * (0.35 + prog * 0.55);
      const alpha  = (t.firePulse / 0.22) * 0.65;
      ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI*2);
      ctx.strokeStyle = stats.glow || def.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,.5)';
    tdRRect(ctx, t.col*cs+1, t.row*cs+1, cs-2, cs-2, 5); ctx.fill();

    ctx.strokeStyle = lvl > 0 ? (stats.glow || def.color) : def.color;
    ctx.lineWidth   = lvl > 0 ? 2 : 1.5;
    tdRRect(ctx, t.col*cs+2, t.row*cs+2, cs-4, cs-4, 4); ctx.stroke();

    const tSpr = TD_SPRITES[t.type];
    if (tSpr) {
      const tPal = tSpr.pals[lvl] || tSpr.pals[0];
      const tPs  = Math.max(2, Math.floor(cs * 0.82 / Math.max(tSpr.pw, tSpr.ph)));
      const fIdx = (t.firePulse || 0) > 0.12 ? 1 : 0;
      tdDrawSprite(ctx, tSpr.frames, fIdx, tPal, px, py, tPs);
    }

    if (lvl > 0) {
      ctx.font      = `bold ${Math.round(cs*.22)}px sans-serif`;
      ctx.fillStyle = lvl === 2 ? '#C084FC' : '#F59E0B';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('L' + (lvl+1), t.col*cs + cs - 2, t.row*cs + cs - 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
  }

  const sorted = [...td.enemies].sort((a,b) => b.dist - a.dist);
  for (const e of sorted) {
    const r = e.r * cs;
    // Boss pulsing outer ring
    if (e.isBoss) {
      const bPulse = 0.5 + 0.5 * Math.sin(bgT * 4 + e.animOffset);
      ctx.beginPath(); ctx.arc(e.x, e.y, r * (1.45 + bPulse * 0.25), 0, Math.PI*2);
      ctx.strokeStyle = `rgba(239,68,68,${0.55 + bPulse * 0.35})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, r * (1.15 + bPulse * 0.1), 0, Math.PI*2);
      ctx.strokeStyle = `rgba(251,191,36,${0.4 + bPulse * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // shadow
    ctx.beginPath(); ctx.ellipse(e.x, e.y + r*.65, r*.75, r*.25, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill();
    // tinted backing circle
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI*2);
    ctx.fillStyle = e.color + '40'; ctx.fill();
    ctx.strokeStyle = e.color; ctx.lineWidth = e.isBoss ? 3 : 1.5; ctx.stroke();
    // pixel-art sprite
    const eSpr = TD_SPRITES[e.type];
    if (eSpr) {
      const ePs  = Math.max(2, Math.floor(e.r * cs * 2.2 / eSpr.ph));
      const eFr  = Math.floor((bgT * 7 + (e.animOffset || 0)) % 2);
      tdDrawSprite(ctx, eSpr.frames, eFr, eSpr.pal, e.x, e.y, ePs);
    }
    // hit flash overlay
    if ((e.hitFlash || 0) > 0) {
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.08, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(e.hitFlash * 6, 0.55)})`;
      ctx.fill();
    }
    // Boss skull label
    if (e.isBoss) {
      ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💀', e.x, e.y - r - cs * 0.38);
    }
    // HP bar (wider for bosses)
    const bw = e.isBoss ? r*3.6 : r*2.4, bh = Math.max(e.isBoss ? 5 : 3, cs*.09);
    const bx = e.x - bw/2, by = e.y - r - bh - (e.isBoss ? cs*0.55 : 3);
    const hpFrac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hpFrac > .5 ? '#4ADE80' : hpFrac > .25 ? '#FBBF24' : '#EF4444';
    ctx.fillRect(bx, by, bw*hpFrac, bh);
    if (e.isBoss) {
      ctx.strokeStyle = '#FBBF2488'; ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }
  }

  for (const p of td.projectiles) {
    if (p.px !== undefined) {
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = p.color + '70'; ctx.lineWidth = cs * 0.14; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(p.x, p.y, cs * .13, 0, Math.PI*2);
    ctx.fillStyle = p.color; ctx.fill();
  }

  for (const p of td.particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2);
    ctx.fillStyle = p.color; ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(cs * 0.34)}px sans-serif`;
  for (const n of td.damageNumbers) {
    const a = n.life / n.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = n.color;
    ctx.fillText(n.label !== undefined ? n.label : ('-' + n.val), n.x, n.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  if (td.paused && !td.quizOpen && !td.over && !td.won) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(cs*.9)}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('⏸', W/2, H/2 - cs*.45);
    ctx.font = `${Math.round(cs*.38)}px sans-serif`;
    ctx.fillStyle = '#E6EDF3';
    ctx.fillText('Paused', W/2, H/2 + cs*.2);
    ctx.font = `${Math.round(cs*.26)}px sans-serif`;
    ctx.fillStyle = '#8B949E';
    ctx.fillText('Tap ▶ to resume', W/2, H/2 + cs*.75);
  }

  if (td.over || td.won) {
    ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(cs*.85)}px sans-serif`;
    ctx.fillStyle = td.won ? '#F59E0B' : '#EF4444';
    ctx.fillText(td.won ? 'VICTORY!' : 'DEFEATED', W/2, H/2 - cs*.6);
    ctx.font = `${Math.round(cs*.38)}px sans-serif`;
    ctx.fillStyle = '#E6EDF3';
    ctx.fillText(td.won ? 'All waves survived!' : 'The horde broke through!', W/2, H/2);
    ctx.font = `${Math.round(cs*.3)}px sans-serif`;
    ctx.fillStyle = '#8B949E';
    ctx.fillText('Tap below to continue', W/2, H/2 + cs*.7);
  }
}

function tdRRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
