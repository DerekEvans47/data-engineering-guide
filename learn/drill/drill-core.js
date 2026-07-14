'use strict';
// Quiz Defense — core: storage, XP/streaks/achievements, quiz flow, boot,
// home/profile/filter UI, dungeon mode.
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
let colorBlindMode  = false;

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
  clearedFloors = new Set(JSON.parse(StorageManager.get(DUNGEON_KEY)     || '[]'));
  relics        = new Set(JSON.parse(StorageManager.get(RELIC_KEY)       || '[]'));
  const savedItems = JSON.parse(StorageManager.get(ITEMS_KEY) || 'null');
  if (savedItems) itemInventory = { fifty_fifty: 0, swap: 0, ward: 0, surge: 0, ...savedItems };

  // TD relic collection (EQ-4) — separate system from the legacy dungeon
  // `relics`/`RELIC_KEY` above. Until EQ-6/EQ-8 ship real acquisition (store
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
  StorageManager.set(DUNGEON_KEY,      JSON.stringify([...clearedFloors]));
  StorageManager.set(RELIC_KEY,        JSON.stringify([...relics]));
  StorageManager.set(ITEMS_KEY,        JSON.stringify(itemInventory));
  StorageManager.set(TD_RELICS_OWNED_KEY,    JSON.stringify([...tdOwnedRelics]));
  StorageManager.set(TD_RELICS_EQUIPPED_KEY, JSON.stringify([...tdEquippedRelics]));
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
// study/drill/dungeon screens, so it stays hidden here instead of
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
    ACHIEVEMENTS_KEY, DUNGEON_KEY, DAILY_KEY, ACCURACY_KEY, RELIC_KEY,
    GOLD_KEY, ITEMS_KEY, TUTORIAL_KEY, AUTOSAVE_KEY, TD_STARS_KEY, TD_INTER_KEY, TD_REST_BONUS_KEY,
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
    const nr  = nd.roomType === 'boss' ? 26 : 24;
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

// ══════════════════════════════════════════════════════════════
//  TOWER DEFENSE GAME
// ══════════════════════════════════════════════════════════════

// Default portrait grid; painted battle maps (frontierTownLevelDef) override
// these per-level at initTDGame time via levelDef.gridCols/gridRows.
const TD_DEFAULT_COLS = 9, TD_DEFAULT_ROWS = 10;

// TEMP (testing): true = waves start immediately with no question gate and
// the optional bonus-gold quiz button is hidden. Flip back to false once
// tower/enemy/map testing settles — questions are the core learning loop,
// this is not a permanent removal.
const TD_QUIZ_DISABLED = true;
let TD_COLS = TD_DEFAULT_COLS, TD_ROWS = TD_DEFAULT_ROWS;
const TD_STARS_KEY = 'td_stars_v1';
