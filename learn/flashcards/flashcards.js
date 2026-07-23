'use strict';
// Term Flashcards — a standalone learning app built on the shared glossary
// (content/glossary.json). Flip a card to reveal the definition, mark each
// term "Know it" or "Review", and drill the ones you don't know yet. Progress
// is tracked client-side in localStorage. No dependency on the game or the
// Study/Drill app — this is its own self-contained PWA.

const KNOWN_KEY = 'fc_known_v1';   // terms the user marked "Know it"
const THEME_KEY = 'fc_theme';

// ── Version badge (derived from the SW cache name) ─────────────
let APP_VERSION = '?';
(async () => {
  if (!('caches' in window)) return;
  try {
    const keys = await caches.keys();
    const hit = keys.find(k => k.startsWith('de-flashcards-'));
    if (!hit) return;
    APP_VERSION = hit.replace('de-flashcards-v', '');
    const el = document.querySelector('.fc-version');
    if (el) el.textContent = `v${APP_VERSION}`;
  } catch (_) {}
})();

// ── Storage (private-browsing-safe) ────────────────────────────
const Store = {
  get(k)    { try { return localStorage.getItem(k); }  catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); }      catch {} },
};

// ── State ──────────────────────────────────────────────────────
let TERMS   = [];          // [{term, short, full}]
let deck    = [];          // array of indices into TERMS
let pos     = 0;           // current position in deck
let flipped = false;
let mode    = 'all';       // 'all' | 'review'
let known   = new Set();   // term strings marked known

const main = document.getElementById('fc-main');

// ── Theme ──────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  Store.set(THEME_KEY, t);
  const btn = document.getElementById('fc-theme');
  if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
}
document.getElementById('fc-theme').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

// ── Boot ───────────────────────────────────────────────────────
(async () => {
  applyTheme(Store.get(THEME_KEY) || 'dark');
  try {
    const res = await fetch('../../content/glossary.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    TERMS = (raw.terms || raw).filter(t => t && t.term);
    if (!TERMS.length) throw new Error('empty glossary');
  } catch (_) {
    main.innerHTML = `<div class="fc-error">
      <div class="fc-error-icon">📡</div>
      <div class="fc-error-title">Couldn't load the glossary</div>
      <div class="fc-error-sub">Check your connection and try again.</div>
      <button class="fc-btn fc-btn-primary" onclick="location.reload()">↻ Retry</button>
    </div>`;
    return;
  }
  known = new Set(JSON.parse(Store.get(KNOWN_KEY) || '[]'));
  buildDeck('all');
  render();
  document.addEventListener('keydown', onKey);
})();

// ── Deck ───────────────────────────────────────────────────────
function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(which) {
  mode = which;
  const all = TERMS.map((_, i) => i);
  deck = which === 'review' ? all.filter(i => !known.has(TERMS[i].term)) : all;
  deck = shuffle(deck);
  pos = 0;
  flipped = false;
}

function markKnown(isKnown) {
  const t = TERMS[deck[pos]];
  if (!t) return;
  if (isKnown) known.add(t.term); else known.delete(t.term);
  Store.set(KNOWN_KEY, JSON.stringify([...known]));
  next();
}

function next() {
  flipped = false;
  if (pos < deck.length - 1) { pos++; render(); }
  else { renderDone(); }
}
function prev() {
  flipped = false;
  if (pos > 0) { pos--; render(); }
}

// ── Render ─────────────────────────────────────────────────────
function stats() {
  return { total: TERMS.length, known: known.size, remaining: TERMS.length - known.size };
}

function render() {
  const s = stats();
  if (!deck.length) { renderEmptyReview(); return; }
  const t   = TERMS[deck[pos]];
  const pct = Math.round((s.known / s.total) * 100);
  const isKnown = known.has(t.term);

  main.innerHTML = `
    <div class="fc-bar">
      <div class="fc-modes">
        <button class="fc-mode ${mode === 'all' ? 'active' : ''}" data-mode="all">All ${s.total}</button>
        <button class="fc-mode ${mode === 'review' ? 'active' : ''}" data-mode="review">To review ${s.remaining}</button>
      </div>
      <button class="fc-icon-btn" id="fc-shuffle" title="Shuffle">🔀</button>
    </div>

    <div class="fc-progress">
      <div class="fc-progress-bar"><div class="fc-progress-fill" style="width:${pct}%"></div></div>
      <div class="fc-progress-label">${s.known} / ${s.total} known · card ${pos + 1} of ${deck.length}</div>
    </div>

    <div class="fc-card-wrap">
      <div class="fc-card ${flipped ? 'flipped' : ''}" id="fc-card">
        <div class="fc-face fc-front">
          ${isKnown ? '<span class="fc-known-tag">✓ known</span>' : ''}
          <div class="fc-term">${escapeHtml(t.term)}</div>
          <div class="fc-hint">tap to reveal</div>
        </div>
        <div class="fc-face fc-back">
          <div class="fc-term-sm">${escapeHtml(t.term)}</div>
          <div class="fc-short">${escapeHtml(t.short)}</div>
          ${t.full && t.full !== t.short ? `<div class="fc-full">${escapeHtml(t.full)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="fc-actions">
      <button class="fc-nav" id="fc-prev" ${pos === 0 ? 'disabled' : ''}>‹ Prev</button>
      <button class="fc-btn fc-btn-review" id="fc-review">↺ Review</button>
      <button class="fc-btn fc-btn-known" id="fc-known">✓ Know it</button>
      <button class="fc-nav" id="fc-next">Skip ›</button>
    </div>

    <div class="fc-foot">
      <span class="fc-version">v${APP_VERSION}</span>
      <button class="fc-reset" id="fc-reset">Reset progress</button>
    </div>`;

  document.getElementById('fc-card').addEventListener('click', flip);
  document.getElementById('fc-known').addEventListener('click', () => markKnown(true));
  document.getElementById('fc-review').addEventListener('click', () => markKnown(false));
  document.getElementById('fc-next').addEventListener('click', next);
  document.getElementById('fc-prev').addEventListener('click', prev);
  document.getElementById('fc-shuffle').addEventListener('click', () => { buildDeck(mode); render(); });
  document.getElementById('fc-reset').addEventListener('click', resetProgress);
  main.querySelectorAll('.fc-mode').forEach(b =>
    b.addEventListener('click', () => { buildDeck(b.dataset.mode); render(); }));
}

function flip() {
  flipped = !flipped;
  const card = document.getElementById('fc-card');
  if (card) card.classList.toggle('flipped', flipped);
}

function renderDone() {
  const s = stats();
  const pct = Math.round((s.known / s.total) * 100);
  main.innerHTML = `
    <div class="fc-done">
      <div class="fc-done-icon">${pct === 100 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
      <h2>Deck complete</h2>
      <div class="fc-done-score">${s.known} / ${s.total} <span>known</span></div>
      <p>${s.remaining === 0 ? 'You know every term. Nice.' : `${s.remaining} term${s.remaining === 1 ? '' : 's'} left to review.`}</p>
      <div class="fc-done-btns">
        ${s.remaining > 0 ? '<button class="fc-btn fc-btn-primary" id="fc-again-review">Review the rest</button>' : ''}
        <button class="fc-btn" id="fc-again-all">Shuffle all again</button>
      </div>
      <div class="fc-foot"><button class="fc-reset" id="fc-reset">Reset progress</button></div>
    </div>`;
  document.getElementById('fc-again-all').addEventListener('click', () => { buildDeck('all'); render(); });
  document.getElementById('fc-again-review')?.addEventListener('click', () => { buildDeck('review'); render(); });
  document.getElementById('fc-reset').addEventListener('click', resetProgress);
}

function renderEmptyReview() {
  main.innerHTML = `
    <div class="fc-done">
      <div class="fc-done-icon">🏆</div>
      <h2>Nothing to review</h2>
      <p>You've marked every term as known. Switch to <strong>All</strong> to run through them again.</p>
      <div class="fc-done-btns"><button class="fc-btn fc-btn-primary" id="fc-again-all">Study all terms</button></div>
      <div class="fc-foot"><button class="fc-reset" id="fc-reset">Reset progress</button></div>
    </div>`;
  document.getElementById('fc-again-all').addEventListener('click', () => { buildDeck('all'); render(); });
  document.getElementById('fc-reset').addEventListener('click', resetProgress);
}

function resetProgress() {
  if (!confirm('Reset all flashcard progress? This clears which terms you\'ve marked as known.')) return;
  known = new Set();
  Store.set(KNOWN_KEY, '[]');
  buildDeck('all');
  render();
}

function onKey(e) {
  if (!deck.length) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  else if (e.key === 'ArrowRight') { next(); }
  else if (e.key === 'ArrowLeft')  { prev(); }
  else if (e.key.toLowerCase() === 'k') { markKnown(true); }
  else if (e.key.toLowerCase() === 'r') { markKnown(false); }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
