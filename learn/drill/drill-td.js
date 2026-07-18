'use strict';
// Quiz Defense — battle engine: canvas setup, game state, update loop,
// towers/enemies/projectiles, radial menu, quiz gate, HUD, renderer.
//
// Split from the old single-file drill.js (2026-07-14). The four files are
// classic scripts sharing the global scope, loaded in order by index.html:
//   drill-core.js -> drill-audio.js -> drill-world.js -> drill-td.js
// Top-level cross-file references only run from event handlers (boot is
// DOMContentLoaded), so declaration order across files is not load-bearing —
// but keep new top-level *executable* statements out of the earlier files if
// they call into later ones.

// Re-fit the battle canvas when the viewport changes mid-battle (rotating
// the phone, browser chrome collapsing). initTDGame sizes the canvas ONCE,
// so without this a battle entered in portrait keeps a portrait-width canvas
// after rotating to landscape — a tiny map floating in black space. All
// live pixel-space state (enemies, projectiles, particles, corpses, damage
// numbers) is rescaled by the cell-size ratio; towers/slots/waypoints are
// stored in grid units and need nothing.
function tdRefitCanvas() {
  if (!td || !td.canvas) return;
  const wrap = document.getElementById('td-canvas-wrap');
  if (!wrap) return;
  const W = wrap.clientWidth || window.innerWidth;
  const H = wrap.clientHeight || 0;
  const cellByW = Math.floor(W / TD_COLS);
  const cellByH = H > 0 ? Math.floor(H / TD_ROWS) : cellByW;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cellCss = Math.min(cellByW, cellByH);
  const newCs = Math.round(cellCss * dpr);
  if (!newCs || newCs < 4 || newCs === td.cellSize) return;
  const k = newCs / td.cellSize;
  td.cellSize = newCs;
  td.canvas.width  = newCs * TD_COLS;
  td.canvas.height = newCs * TD_ROWS;
  td.canvas.style.width  = cellCss * TD_COLS + 'px';
  td.canvas.style.height = cellCss * TD_ROWS + 'px';
  for (const e of td.enemies) { e.x *= k; e.y *= k; if (e._px !== undefined) e._px *= k; }
  for (const p of td.projectiles) {
    p.x *= k; p.y *= k; p.spd *= k; p.splash *= k;
    if (p.px !== undefined) { p.px *= k; p.py *= k; }
  }
  for (const p of td.particles) { p.x *= k; p.y *= k; p.vx *= k; p.vy *= k; p.r *= k; }
  for (const n of td.damageNumbers) { n.x *= k; n.y *= k; }
  for (const c of td.corpses) { c.x *= k; c.footY *= k; }
}
let _tdResizeTimer = null;
['resize', 'orientationchange'].forEach(ev => window.addEventListener(ev, () => {
  clearTimeout(_tdResizeTimer);
  _tdResizeTimer = setTimeout(tdRefitCanvas, 200);
}));

function showTowerDefenseScreen(levelDef, nodeId, run) {
  const levelIdx = typeof nodeId === 'number' ? nodeId : -1; // compat
  if (td && td.running) { cancelAnimationFrame(td.animFrame); td.running = false; }
  mapMusic.stop();
  battleMusicHorn.start(); // battle theme — battle screens only, loops

  // Resources persist across the whole run — no fresh per-map baseline.
  // A battle starts with exactly what the run currently holds
  // (run.gold/run.lives/run.maxLives), plus whatever a rest site or relic
  // adds on top (both resolved inside tdMakeState, which also owns the
  // "No Gold" modifier's wallet-banking so that challenge can't wipe your
  // persisted gold — see there). Falls back to the level's configured
  // defaults only when there's no run at all (e.g. a standalone dev test).
  const persistedLives    = run ? run.lives    : levelDef.startLives;
  const persistedMaxLives = run ? run.maxLives : levelDef.startLives;
  // ?dev=1 (Creator Mode) gets the bottomless testing purse; real balance otherwise.
  const persistedGold = TD_CREATOR_MODE ? 99999 : (run ? run.gold : levelDef.startGold);

  // Vanguard's Calling (shop consumable): consume one charge by
  // permanently trimming this node's wave list, so a Retry after defeat
  // keeps the shortened waves too instead of re-consuming the charge.
  // node.levelDef is a stable object for the run's lifetime (see
  // tdFreshLevelDefFor), so __firstWaveSkipped correctly guards against
  // double-applying on repeat visits/retries of the same node.
  if (run && run.pendingSkipFirstWave > 0 && !levelDef.__firstWaveSkipped
      && levelDef.waveDefs && levelDef.waveDefs.length > 1) {
    levelDef.waveDefs.shift();
    levelDef.__firstWaveSkipped = true;
    run.pendingSkipFirstWave -= 1;
    tdSaveRun(run);
  }

  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');

  setTopBar('td-level', { name: levelDef.name, levelIdx });

  EL.contentArea.innerHTML = `
    <div id="td-wrap">
      <div id="td-canvas-wrap">
        <canvas id="td-canvas"></canvas>
        <div id="td-radial-menu" class="td-radial-menu" style="display:none"></div>
      </div>
      <div id="td-hud">
        <button id="td-hud-back" class="td-hud-back" title="Back to map">←</button>
        <div class="td-stat td-stat-lives">
          <div class="td-stat-top"><span>❤️</span><span id="td-lives">${persistedLives}</span></div>
          <div class="td-lives-bar"><div id="td-lives-fill"></div></div>
        </div>
        <div class="td-mid">
          <div id="td-wave-lbl">${levelDef.name} · Place towers, then start!</div>
          <div id="td-wave-dots" class="td-wave-dots"></div>
        </div>
        <div class="td-stat">🪙 <span id="td-gold-val">${persistedGold}</span></div>
        <button id="td-mute-btn" class="td-mute-btn" title="Toggle sound">🔊</button>
        <button id="td-pause-btn" class="td-mute-btn" title="Pause/Resume">⏸</button>
      </div>
      <div id="td-bottom-bar">
        <div id="td-actions">
          <div class="td-actions-row">
            <div id="td-powerup-tray" class="td-powerup-tray" style="display:none"></div>
            <button class="td-quiz-btn" id="td-quiz-btn">📝 +25🪙 (3)</button>
            <button class="td-wave-btn" id="td-wave-btn">
              <span class="td-wave-btn-main">⚔️ Start Wave 1</span>
              <span id="td-wave-preview" class="td-wave-preview" style="display:none"></span>
            </button>
          </div>
        </div>
      </div>
      <div class="td-q-overlay" id="td-q-overlay">
        <div class="td-q-sheet" id="td-q-sheet"></div>
      </div>
    </div>`;

  document.getElementById('td-hud-back').addEventListener('click', showTDWorldMap);

  initTDGame(levelDef, levelIdx, persistedLives, persistedMaxLives, persistedGold);
  td.__run    = run || null;
  td.__nodeId = nodeId;
  td.mapId    = run ? run.mapId : 0;

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

function initTDGame(levelDef, levelIdx, persistedLives, persistedMaxLives, persistedGold) {
  // Landscape painted maps (frontierTownLevelDef) declare their own grid;
  // everything else keeps the default portrait grid. Reset unconditionally
  // so a previous painted level's dimensions never leak into the next one.
  TD_COLS = levelDef.gridCols || TD_DEFAULT_COLS;
  TD_ROWS = levelDef.gridRows || TD_DEFAULT_ROWS;

  td = tdMakeState(levelDef, levelIdx, persistedLives, persistedMaxLives, persistedGold);
  const canvas = document.getElementById('td-canvas');
  const wrap   = document.getElementById('td-canvas-wrap');
  td.canvas = canvas;
  td.ctx    = canvas.getContext('2d');

  if (levelDef.usesPaintedBg) {
    td.usesPaintedBg = levelDef.usesPaintedBg;
    td.paintedBg = new Image();
    td.paintedBg.src = TD_PAINTED_BG_IMAGES[levelDef.usesPaintedBg] || '';
    td.buildSlotSet = new Set((levelDef.buildSlots || []).map(([c,r]) => `${c},${r}`));
    td.slotCenterMap = levelDef.slotCenters || null;
    td.slotFacingMap = levelDef.slotFacing || null;
    td.occluders = levelDef.occludersPx || null;
    td.bgSize = levelDef.bgSize || null;
    // Fill the letterbox around the contain-fit canvas with the same map
    // art, cover-fit and darkened. The old .35 green-tinted wash was light
    // enough that the stretched cover copy read as PART OF THE MAP ("why is
    // there a green overlay / is it cut off?" — owner, 2026-07-12). Neutral
    // blue-black at .82 keeps a hint of forest texture but is unmistakably
    // backdrop, while still avoiding the dead-black vignette this exists
    // to prevent.
    wrap.style.background =
      `linear-gradient(rgba(8,11,16,.82), rgba(8,11,16,.82)), ` +
      `url('${td.paintedBg.src}') center / cover no-repeat`;
  } else {
    td.usesPaintedBg = null;
    td.paintedBg = null;
    td.buildSlotSet = null;
    td.slotCenterMap = null;
    td.slotFacingMap = null;
    td.occluders = null;
    td.bgSize = null;
    wrap.style.background = '';
  }

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
  EL.tdRadialMenu   = document.getElementById('td-radial-menu');
  EL.tdWavePreview  = document.getElementById('td-wave-preview');
  EL.tdPowerUpTray  = document.getElementById('td-powerup-tray');

  // No hardcoded width cap here — the wrap's actual size (bounded by the
  // outer #app[data-mode="tower"] max-width) is the real ceiling. This used
  // to additionally cap at 1100, which bottlenecked the battle canvas on
  // wide landscape screens the same way the region map was bottlenecked.
  const W = wrap.clientWidth || window.innerWidth;
  const H = wrap.clientHeight || 0;
  const cellByW = Math.floor(W / TD_COLS);
  const cellByH = H > 0 ? Math.floor(H / TD_ROWS) : cellByW;
  // HiDPI: back the canvas at devicePixelRatio resolution and scale it down
  // via CSS. Without this a 3x phone renders the whole battle at 1/3 native
  // resolution and stretches it — the entire game looked slightly blurry on
  // mobile. All game math runs in backing-store (canvas) pixels via
  // td.cellSize; taps and DOM overlays already convert through
  // getBoundingClientRect scaling, so only the sizing here changes.
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cellCss = Math.min(cellByW, cellByH);
  td.cellSize   = Math.round(cellCss * dpr);
  canvas.width  = td.cellSize * TD_COLS;
  canvas.height = td.cellSize * TD_ROWS;
  canvas.style.width  = cellCss * TD_COLS + 'px';
  canvas.style.height = cellCss * TD_ROWS + 'px';

  // Creator mode: wire the canvas author listeners up front (they no-op
  // until the 🗺️ Map chip is on) and show the creator toolbar. The author
  // listeners MUST register BEFORE the gameplay click handler below so the
  // editor's capture-phase router can intercept the taps it consumes;
  // untouched gameplay taps still reach the radial menu.
  if (TD_CREATOR_MODE) { tdAuthorInitEditor(canvas); tdCreatorBuildToolbar(); }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top)  * sy;
    const cs = td.cellSize;

    // Hit-test against the actual rendered center of each tower/build slot
    // instead of floor-dividing the tap point into a grid cell. Painted maps
    // (Frontier Town) hand-place slot centers at exact pixel coordinates via
    // tdCellCenter/slotCenterMap, and those coordinates round to their
    // "logical" cell (nearest cell, used for path-collision + buildSlotSet
    // membership) — but a plain floor(px/cs) quantizes to whichever cell the
    // point falls inside, which disagrees with "nearest" for any slot whose
    // fractional cell coordinate is above .5. That mismatch made tapping
    // directly on a slot's drawn marker sometimes open the neighboring cell's
    // menu instead (or hit nothing, if the floor-quantized cell wasn't a
    // registered slot at all).
    const candidates = [];
    for (const t of td.towers) candidates.push([t.col, t.row]);
    if (td.buildSlotSet) for (const key of td.buildSlotSet) candidates.push(key.split(',').map(Number));
    let col = -1, row = -1, bestDist = Infinity;
    for (const [c, r] of candidates) {
      const [cx, cy] = tdCellCenter(c, r, cs);
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestDist) { bestDist = d; col = c; row = r; }
    }
    if (col < 0 || bestDist > cs * 0.65) {
      // Tapped empty ground, not near any tower/slot — fall back to plain
      // grid math. tdHandleTap will no-op on an unregistered cell, but it
      // still needs a call so an open radial menu gets dismissed on an
      // outside tap.
      col = Math.floor(px / cs);
      row = Math.floor(py / cs);
    }
    td.tapCol = col; td.tapRow = row;
    tdHandleTap(col, row);
  });

  EL.tdMuteBtn.addEventListener('click', () => {
    const muted = tdAudio.toggleMute();
    menuMusic.setMuted(muted);
    mapMusic.setMuted(muted);
    EL.tdMuteBtn.textContent = muted ? '🔇' : '🔊';
  });

  EL.tdPauseBtn.addEventListener('click', () => {
    if (!td || td.over || td.won) return;
    td.paused = !td.paused;
    EL.tdPauseBtn.textContent = td.paused ? '▶' : '⏸';
  });

  EL.tdWaveBtn.addEventListener('click', tdOnWaveBtn);
  EL.tdQuizBtn.addEventListener('click', () => {
    if (!td || td.quizOpen || td.over || td.won) return;
    if (td.optQuizUsed >= tdQuizMax()) {
      const btn = EL.tdQuizBtn;
      if (btn) { btn.textContent = `📝 Max ${tdQuizMax()}/wave`; setTimeout(() => tdUpdateHUD(), 1500); }
      return;
    }
    td.optQuizUsed++;
    tdOpenQuiz(25, true, () => tdUpdateHUD());
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

// ╔══════════════════════════════════════════════════════════════
//  TD ENGINE — state factory, game loop, enemy AI, tower targeting,
//  projectile physics (S-3)
// ╚══════════════════════════════════════════════════════════════

// ── Game state ─────────────────────────────────────────────────

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

// Sums equipped-relic effects into a single mods object. Category exclusivity
// is enforced at equip time (tdEquipRelic), so at most one relic per category
// can ever be in tdEquippedRelics — no additional dedup needed here.
function tdComputeRelicMods() {
  const m = {
    killGoldMult: 1, towerDmgMult: 1, bossDmgMult: 1, startGoldAdd: 0, maxLivesAdd: 0,
    towerRateMult: 1, towerRangeMult: 1, splashMult: 1, enemySpeedMult: 1,
    buildCostMult: 1, upgradeCostMult: 1, waveGoldAdd: 0, interestRate: 0,
    waveLifeAdd: 0, quizGoldMult: 1, quizUsesAdd: 0, armorPierce: false,
    upkeepTotal: 0,
  };
  for (const id of tdEquippedRelics) {
    const r = TD_RELICS.find(x => x.id === id);
    if (!r) continue;
    m.upkeepTotal += r.upkeep;
    const { type, value } = r.effect;
    if      (type === 'kill-gold-mult')    m.killGoldMult    *= value;
    else if (type === 'tower-dmg-mult')    m.towerDmgMult    *= value;
    else if (type === 'boss-dmg-mult')     m.bossDmgMult     *= value;
    else if (type === 'start-gold-add')    m.startGoldAdd    += value;
    else if (type === 'max-lives-add')     m.maxLivesAdd     += value;
    else if (type === 'tower-rate-mult')   m.towerRateMult   *= value;
    else if (type === 'tower-range-mult')  m.towerRangeMult  *= value;
    else if (type === 'splash-mult')       m.splashMult      *= value;
    else if (type === 'enemy-speed-mult')  m.enemySpeedMult  *= value;
    else if (type === 'build-cost-mult')   m.buildCostMult   *= value;
    else if (type === 'upgrade-cost-mult') m.upgradeCostMult *= value;
    else if (type === 'wave-gold-add')     m.waveGoldAdd     += value;
    else if (type === 'interest-rate')     m.interestRate    += value;
    else if (type === 'wave-life-add')     m.waveLifeAdd     += value;
    else if (type === 'quiz-gold-mult')    m.quizGoldMult    *= value;
    else if (type === 'quiz-uses-add')     m.quizUsesAdd     += value;
    else if (type === 'armor-pierce')      m.armorPierce      = true;
  }
  return m;
}

// Bonus questions allowed per wave (relics can raise the base 3).
function tdQuizMax() { return 3 + (td?.relicMods?.quizUsesAdd || 0); }

function tdEquipRelic(id) {
  const r = TD_RELICS.find(x => x.id === id);
  if (!r || !tdOwnedRelics.has(id)) return;
  for (const equippedId of [...tdEquippedRelics]) {
    const equipped = TD_RELICS.find(x => x.id === equippedId);
    if (equipped && equipped.category === r.category && equippedId !== id) tdEquippedRelics.delete(equippedId);
  }
  tdEquippedRelics.add(id);
  saveGameState();
}

function tdUnequipRelic(id) {
  tdEquippedRelics.delete(id);
  saveGameState();
}

// persistedLives/persistedMaxLives/persistedGold are the run's actual
// current wallet/health (or levelDef's configured defaults with no run —
// see showTowerDefenseScreen). Everything else here is a bonus layered on
// top for THIS battle: a rest-site choice (consumed once, read directly
// here rather than threaded through more params), and relic effects
// (ongoing — apply fresh every battle, same as any other relic bonus).
function tdMakeState(levelDef, levelIdx, persistedLives, persistedMaxLives, persistedGold) {
  const mods = levelDef.modifiers || {};
  const relicMods = tdComputeRelicMods();
  const restBonus = tdLoadRestBonus();
  tdClearRestBonus();

  const baseLives = persistedLives != null ? persistedLives : levelDef.startLives;
  const baseMax   = persistedMaxLives != null ? persistedMaxLives : levelDef.startLives;
  const restLivesBonus = restBonus && restBonus.type === 'lives' ? Math.max(0, restBonus.value) : 0;
  // Rest heals current lives (capped at max); relics can raise the max
  // itself, growing every battle they're equipped — that compounding is
  // an intentional relic power, not a bug (see Iron Constitution).
  const initialMaxLives = baseMax + relicMods.maxLivesAdd;
  const initialLives = Math.min(initialMaxLives, baseLives + relicMods.maxLivesAdd + restLivesBonus);

  // "No Gold" challenge modifier: you fight this battle on kill-income
  // alone (0 starting gold), but your persisted wallet is banked aside
  // and restored at victory (see tdVictory) instead of being overwritten
  // by whatever you scraped together — the challenge should cost you a
  // harder fight, not silently wipe gold you'd already earned in prior
  // battles.
  const noGoldBankedGold = mods.noGold ? (persistedGold != null ? persistedGold : levelDef.startGold) : 0;
  const restGoldBonus = restBonus && restBonus.type === 'gold' ? Math.max(0, restBonus.value) : 0;
  const baseGold = mods.noGold ? 0 : (persistedGold != null ? persistedGold : levelDef.startGold);
  const initialGold = mods.noGold ? 0 : Math.max(0, baseGold + relicMods.startGoldAdd - relicMods.upkeepTotal + restGoldBonus);

  return {
    running:false, paused:false, animFrame:null, lastTs:0,
    canvas:null, ctx:null, cellSize:40,
    lives: initialLives, gold: initialGold, maxLives: initialMaxLives,
    noGoldBankedGold,
    waveIdx:-1, spawnQueue:[], spawnTimer:0, waveActive:false,
    enemies:[], towers:[], projectiles:[], particles:[], corpses:[], damageNumbers:[],
    radialMenu:null, eid:0,
    quizOpen:false, quizQ:null, quizAnswered:false, quizDone:null, quizOptional:false,
    tapCol:-1, tapRow:-1,
    over:false, won:false, shake:0, bossFlash:0, lastShootSnd:0,
    bgTime: 0, mapId: -1,
    levelDef, levelIdx,
    pathSet: tdComputePathSet(levelDef.wps),
    optQuizUsed: 0,
    activePowerUps: [],
    powerUpMods: { towerRateMult:1, enemySpeedMult: mods.speedPlus ? 1.25 : 1, killGoldMult:1 },
    relicMods,
    modifiers: { ironman: !!mods.ironman, noGold: !!mods.noGold, speedPlus: !!mods.speedPlus },
    endless: false, endlessWave: 0, endlessKills: 0,
  };
}

let td = null;
let tdOwnedRelics    = new Set();
let tdEquippedRelics = new Set();

// ── Game loop ──────────────────────────────────────────────────

function tdLoop(ts) {
  if (!td || !td.running) return;
  const dt = Math.min((ts - td.lastTs) / 1000, 0.1);
  td.lastTs = ts;
  td.bgTime += dt;
  if (!td.paused && !td.over && !td.won) {
    tdUpdate(dt);
  }
  tdRender();
  if (tdTuningOn) tdDevTickFps(ts);
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

  // Author-mode ghost walkers: move like real enemies (same tdMoveEnemy,
  // same lane) but live outside td.enemies so towers never target them,
  // leaking costs nothing, and wave-clear logic never sees them.
  if (td.__ghosts?.length) td.__ghosts = td.__ghosts.filter(g => !tdMoveEnemy(g, dt));

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

  for (const e of td.enemies) {
    if (!e.healer || e.hp <= 0) continue;
    e.healTimer -= dt;
    if (e.healTimer > 0) continue;
    e.healTimer = e.healInterval;
    const radiusPx = e.healRadius * td.cellSize;
    for (const o of td.enemies) {
      if (o === e || o.hp <= 0 || o.hp >= o.maxHp) continue;
      if (Math.hypot(o.x - e.x, o.y - e.y) <= radiusPx) {
        o.hp = Math.min(o.maxHp, o.hp + e.healAmount);
        td.damageNumbers.push({ x: o.x, y: o.y - o.r * td.cellSize - 6, label: '+' + e.healAmount, life: 0.6, maxLife: 0.6, color: '#34D399' });
      }
    }
  }

  tdFireTowers(dt);
  tdMoveProjectiles(dt);

  const died = td.enemies.filter(e => e.hp <= 0);
  for (const e of died) {
    // Painted death sequence (A-3): purely a render-layer corpse effect —
    // the enemy is removed from play immediately, so nothing downstream
    // (targeting, leak counting, wave clears) knows corpses exist.
    if (tdEnemySheetReady(TD_ENEMY_SHEET_IMAGES[e.type], 'death')) {
      td.corpses.push({ type: e.type, x: e.x, footY: e.y + e.r * td.cellSize * 0.78,
        r: e.r, faceLeft: !!e._faceLeft, t: 0 });
    }
    const killReward = Math.round(e.reward * (td.powerUpMods?.killGoldMult || 1) * (td.relicMods?.killGoldMult || 1));
    td.gold += killReward;
    td.damageNumbers.push({ x: e.x + 8, y: e.y - e.r * td.cellSize - 10, label: '+' + killReward + '🪙', life: 0.85, maxLife: 0.85, color: '#FBBF24' });
    if (e.isBoss) {
      tdSpawnParticles(e.x, e.y, e.color, 40);
      tdSpawnParticles(e.x, e.y, '#FFFFFF', 16);
      tdSpawnParticles(e.x, e.y, '#FBBF24', 24);
      td.shake = 0.9;
      td.bossFlash = 0.35;
    } else if (e.type === 'goblin') {
      // Goblins scatter spinning gold coin quads
      if (!reducedMotionQuery?.matches) {
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2, spd = 40 + Math.random() * 60;
          const life = 0.4 + Math.random() * 0.25;
          td.particles.push({ x: e.x, y: e.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
            life, maxLife: life, r: 3 + Math.random()*2, color: '#FBBF24', shape: 'coin', angle: Math.random()*Math.PI });
        }
      }
      tdSpawnParticles(e.x, e.y, e.color, 6);
    } else if (e.type === 'scout') {
      // Scouts streak off fast in their travel direction
      const dir = e.dir || 0;
      if (!reducedMotionQuery?.matches) {
        for (let i = 0; i < 10; i++) {
          const spread = (Math.random() - 0.5) * 0.6;
          const spd = 120 + Math.random() * 80;
          const life = 0.18 + Math.random() * 0.12;
          td.particles.push({ x: e.x, y: e.y,
            vx: Math.cos(dir + spread) * spd, vy: Math.sin(dir + spread) * spd,
            life, maxLife: life, r: 1.5 + Math.random(), color: e.color });
        }
      }
      tdSpawnParticles(e.x, e.y, '#FFFFFF', 3);
    } else if (e.type === 'orc') {
      // Orcs leave a smoke puff — large slow upward gray particles
      if (!reducedMotionQuery?.matches) {
        for (let i = 0; i < 8; i++) {
          const spd = 8 + Math.random() * 20;
          const life = 0.5 + Math.random() * 0.35;
          td.particles.push({ x: e.x + (Math.random()-0.5)*10, y: e.y,
            vx: (Math.random()-0.5) * spd, vy: -spd * (0.7 + Math.random()),
            life, maxLife: life, r: 5 + Math.random()*6, color: '#94A3B8' });
        }
      }
      tdSpawnParticles(e.x, e.y, e.color, 8);
    } else if (e.type === 'troll') {
      // Trolls crumble — expanding ring + heavy slow particles
      if (!reducedMotionQuery?.matches) {
        td.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0,
          life: 0.55, maxLife: 0.55, r: e.r * td.cellSize * 1.8, color: e.color, shape: 'ring' });
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, spd = 15 + Math.random() * 30;
          const life = 0.6 + Math.random() * 0.4;
          td.particles.push({ x: e.x, y: e.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
            life, maxLife: life, r: 3 + Math.random()*4, color: e.color });
        }
      }
      tdSpawnParticles(e.x, e.y, '#C084FC', 6);
      td.shake = 0.3;
    } else {
      tdSpawnParticles(e.x, e.y, e.color, 12);
      tdSpawnParticles(e.x, e.y, '#FFFFFF', 4);
    }
    tdAudio.death(td.canvas ? e.x / td.canvas.width : 0.5);
  }
  if (died.length) { if (td.endless) td.endlessKills += died.length; td.enemies = td.enemies.filter(e => e.hp > 0); tdUpdateHUD(); }

  td.particles = td.particles.filter(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0;
  });
  td.corpses = td.corpses.filter(c => {
    c.t += dt; return c.t < 1.5;
  });

  td.damageNumbers = td.damageNumbers.filter(n => {
    n.y -= 28 * dt; n.life -= dt; return n.life > 0;
  });

  for (const t of td.towers) {
    if (t.firePulse) t.firePulse = Math.max(0, t.firePulse - dt);
    if (t.flashLife) t.flashLife = Math.max(0, t.flashLife - dt);
  }
  for (const e of td.enemies) if (e.hitFlash)   e.hitFlash   = Math.max(0, e.hitFlash   - dt);

  if (td.waveActive && td.spawnQueue.length === 0 && td.enemies.length === 0) {
    td.waveActive = false;
    const rm = td.relicMods || {};
    const waveGold = 15 + (rm.waveGoldAdd || 0) + Math.round(td.gold * (rm.interestRate || 0));
    td.gold += waveGold;
    if (rm.waveLifeAdd) td.lives = Math.min(td.maxLives, td.lives + rm.waveLifeAdd);
    td.damageNumbers.push({ x: td.canvas ? td.canvas.width / 2 : 160, y: td.canvas ? td.canvas.height * 0.18 : 80, label: `+${waveGold}🪙 Wave Clear!`, life: 1.6, maxLife: 1.6, color: '#FBBF24' });
    if (td.waveIdx >= td.levelDef.waveDefs.length - 1) {
      if (td.endless) {
        td.endlessWave++;
        tdEndlessNextBatch();
        tdClearWavePowerUps(); tdUpdateHUD(); tdUpdateWaveBtn(); tdUpdatePowerUpTray();
      } else { tdVictory(); }
    } else { tdClearWavePowerUps(); tdUpdateHUD(); tdUpdateWaveBtn(); tdUpdatePowerUpTray(); }
  }
}

// ── Enemies ────────────────────────────────────────────────────

function tdSpawnEnemy(type) {
  const def  = TD_ENEMY_DEFS[type];
  const mult = td.levelDef.enemyMult;
  const cs   = td.cellSize;
  const [c0, r0] = td.levelDef.wps[0];
  let hp = def.maxHp * mult;
  // Executioner's Draught (shop consumable): halves the next boss's HP the
  // moment it spawns, then the charge is spent — a boss node's "boss"
  // enemy or Frontier Town's "bandit_boss" both carry isBoss, so this
  // fires on whichever boss-flagged enemy is next, run-wide.
  if (def.isBoss && td.__run && td.__run.pendingBossHalfHp > 0) {
    hp *= 0.5;
    td.__run.pendingBossHalfHp -= 1;
    tdSaveRun(td.__run);
  }
  td.enemies.push({
    id: td.eid++, type,
    hp, maxHp: hp,
    spd: def.spd * (td.levelDef.enemySpeedMult || 1) * (td.powerUpMods?.enemySpeedMult || 1) * (td.relicMods?.enemySpeedMult || 1), color: def.color,
    r: def.r * (td.levelDef.enemyScaleMult || 1), reward: def.reward,
    isBoss: def.isBoss || false, lifeLoss: (def.lifeLoss || 1) * (td.modifiers?.ironman ? 2 : 1),
    armored: def.armored || false, flying: def.flying || false, healer: def.healer || false,
    healAmount: def.healAmount || 0, healInterval: def.healInterval || 0, healRadius: def.healRadius || 0,
    healTimer: def.healInterval || 0,
    hitFlash: 0, animOffset: Math.random() * 100, wpIdx: 1,
    x: c0 * cs + cs / 2,
    y: r0 * cs + cs / 2,
    dist: 0,
  });
}

function tdMoveEnemy(e, dt) {
  const cs  = td.cellSize;
  // Prefer the exact painted-road polyline when the map supplies one (see
  // FRONTIER_TOWN_WPS_EXACT) — falls back to the Manhattan grid path for
  // maps without hand-painted art, unchanged from before.
  const exactWps = td.levelDef.wpsExact;
  const wps = exactWps || td.levelDef.wps;
  // ?dev=1 live enemy-speed multiplier (1 otherwise); applies to ghosts too.
  let rem = e.spd * cs * dt * (td.__devMods?.enemySpeed || 1);
  while (rem > 0 && e.wpIdx < wps.length) {
    const [tc, tr] = wps[e.wpIdx];
    const tx = exactWps ? tc * cs : tc * cs + cs / 2;
    const ty = exactWps ? tr * cs : tr * cs + cs / 2;
    const dx = tx - e.x, dy = ty - e.y;
    const d  = Math.hypot(dx, dy);
    if (d < 0.5) { e.wpIdx++; continue; }
    e.dir = Math.atan2(dy, dx);
    if (rem >= d) { e.x = tx; e.y = ty; e.dist += d; rem -= d; e.wpIdx++; }
    else          { const f = rem / d; e.x += dx*f; e.y += dy*f; e.dist += rem; rem = 0; }
  }
  return e.wpIdx >= wps.length;
}

// ── Towers ─────────────────────────────────────────────────────

function tdGetTowerStats(tower) {
  const def  = TD_TOWER_DEFS.find(d => d.id === tower.type);
  const base = (!tower.level || tower.level === 0) ? def : { ...def, ...def.upgrades[tower.level - 1] };
  const rm = td && td.relicMods;
  if (!rm) return base;
  return {
    ...base,
    rate:   base.rate  * (rm.towerRateMult  || 1),
    range:  base.range * (rm.towerRangeMult || 1),
    splash: base.splash ? base.splash * (rm.splashMult || 1) : base.splash,
  };
}

// Render/targeting center for a grid cell. Procedural maps have no exact
// art to align to, so the grid-cell center is correct there. Painted maps
// (e.g. Frontier Town) hand-paint clearings at specific pixel positions
// that don't fall exactly on this grid's cell centers — using the exact
// position keeps towers centered in the clearing instead of near the edge.
function tdCellCenter(col, row, cs) {
  const exact = td.slotCenterMap && td.slotCenterMap[`${col},${row}`];
  if (exact) return [exact[0] * cs, exact[1] * cs];
  return [col * cs + cs / 2, row * cs + cs / 2];
}

function tdFireTowers(dt) {
  for (const t of td.towers) {
    t.cd = (t.cd || 0) - dt * (td.powerUpMods?.towerRateMult || 1);
    if (t.cd > 0) continue;
    const stats   = tdGetTowerStats(t);
    const cs      = td.cellSize;
    const [tx, ty] = tdCellCenter(t.col, t.row, cs);
    const rangePx = stats.range * cs;

    // Multi-projectile towers (L4 Ranger) spread their extra projectiles
    // across the top-N in-range enemies by "furthest along the path"
    // priority, so a 2nd projectile is a real "also hits another enemy"
    // upgrade rather than a disguised damage multiplier on whichever single
    // target a 1-projectile tower would already have picked. Falls back to
    // re-targeting the same enemy if fewer enemies are in range than the
    // tower has projectiles.
    const inRange = [];
    for (const e of td.enemies) {
      if (e.flying && t.type === 'mortar') continue; // mortar shells can't reach flying enemies
      const d = Math.hypot(e.x - tx, e.y - ty);
      if (d <= rangePx) inRange.push(e);
    }
    if (inRange.length) {
      inRange.sort((a, b) => b.dist - a.dist);
      const shots = stats.projectiles || 1;
      let firstTarget = null;
      for (let i = 0; i < shots; i++) {
        const target = inRange[Math.min(i, inRange.length - 1)];
        firstTarget = firstTarget || target;
        td.projectiles.push({
          x: tx, y: ty, eid: target.id,
          // Speed in cell-units like enemy spd, not a fixed px/s — a flat
          // 280 was tuned pre-HiDPI and turned into a crawl once the canvas
          // rendered at device resolution (enemies scale with cellSize,
          // projectiles didn't). 10 cells/s crosses a max-range shot in
          // ~0.5s so an arrow lands before the next one nocks.
          spd: cs * 10, dmg: stats.dmg * (td.relicMods?.towerDmgMult || 1),
          splash: stats.splash * cs,
          color: stats.glow || stats.color,
        });
      }
      t.cd = 1 / stats.rate;
      t.firePulse  = 0.22;
      t.flashAngle = Math.atan2(firstTarget.y - ty, firstTarget.x - tx);
      t.flashLife  = 0.06;
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
      // ?dev=1 live tower-damage multiplier (1 otherwise) — applied at hit
      // time so slider changes affect projectiles already in flight too.
      const dmg = p.dmg * (td.__devMods?.towerDmg || 1);
      const bossMult    = td.relicMods?.bossDmgMult || 1;
      const armorPierce = !!td.relicMods?.armorPierce;
      if (p.splash > 0) {
        for (const e of td.enemies) {
          if (Math.hypot(e.x - hx, e.y - hy) <= p.splash) {
            const hitDmg = dmg * (e.isBoss ? bossMult : 1);
            e.hp -= (e.armored && !armorPierce) ? hitDmg * 0.5 : hitDmg;
          }
        }
      } else {
        target.hp -= dmg * (target.isBoss ? bossMult : 1);
      }
      td.damageNumbers.push({ x: hx, y: hy - 8, val: Math.round(dmg), life: 0.65, maxLife: 0.65, color: p.color });
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

// Tapping a build slot or an existing tower opens a radial arc of actions
// anchored right at that cell instead of a persistent tool bar — build
// options (Bastion/Ranger/Mortar) on an empty slot, Upgrade/Sell only when
// a tower already occupies it. Selecting an option commits immediately;
// there's no separate select-then-confirm step since the tap that opens
// the menu already picked the location.
function tdHandleTap(col, row) {
  if (!td || td.over || td.won || td.quizOpen) return;
  if (col < 0 || col >= TD_COLS || row < 0 || row >= TD_ROWS) return;

  const reopenBlocked = td.radialMenu && td.radialMenu.col === col && td.radialMenu.row === row;
  if (td.radialMenu) tdCloseRadialMenu();
  if (reopenBlocked) return; // tapping the open menu's own cell just dismisses it

  const tower = td.towers.find(t => t.col === col && t.row === row);
  if (tower) { tdOpenRadialMenu(col, row, tower); return; }

  if (td.pathSet.has(`${col},${row}`)) return;
  if (td.buildSlotSet && !td.buildSlotSet.has(`${col},${row}`)) return;
  tdOpenRadialMenu(col, row, null);
}

function tdOpenRadialMenu(col, row, tower) {
  const menuEl = EL.tdRadialMenu;
  const canvas = td.canvas;
  const wrap   = document.getElementById('td-canvas-wrap');
  if (!menuEl || !canvas || !wrap) return;

  let items, label = null;
  if (tower) {
    const def  = TD_TOWER_DEFS.find(d => d.id === tower.type);
    const lvl  = tower.level || 0;
    let totalSpent = def.cost;
    for (let l = 0; l < lvl; l++) totalSpent += def.upgrades[l].cost;
    const sellVal = Math.round(totalSpent * (tower.placedThisBuild ? 1.0 : 0.6));
    label = `${def.icon || ''} ${def.name} · L${lvl + 1}`;
    items = [];
    if (lvl < def.upgrades.length) {
      const upgCost = Math.round(def.upgrades[lvl].cost * (td.relicMods?.upgradeCostMult || 1));
      items.push({
        id: 'upgrade', icon: '⬆️', sub: `${upgCost}🪙`, accent: '#FBBF24', cost: upgCost,
        disabled: td.gold < upgCost,
        onSelect: () => {
          td.gold -= upgCost;
          tower.level = lvl + 1;
          tdUpdateHUD();
          tdAudio.place(tower.col / (TD_COLS - 1));
        },
      });
    }
    items.push({
      id: 'sell', icon: '💸', sub: `+${sellVal}🪙`, accent: '#EF4444', cost: null, disabled: false,
      onSelect: () => {
        const idx = td.towers.indexOf(tower);
        if (idx >= 0) td.towers.splice(idx, 1);
        td.gold += sellVal;
        tdUpdateHUD();
      },
    });
  } else {
    items = TD_TOWER_DEFS.map(def => {
      const buildCost = Math.round(def.cost * (td.relicMods?.buildCostMult || 1));
      return {
        id: def.id, icon: def.icon, sub: `${buildCost}🪙`, accent: def.color, cost: buildCost,
        isBuild: true,
        disabled: td.gold < buildCost,
        onSelect: () => {
          td.gold -= buildCost;
          td.towers.push({ col, row, type: def.id, cd: 0, level: 0, placedThisBuild: true, idlePhase: Math.random() * Math.PI * 2 });
          tdUpdateHUD();
          tdAudio.place(col / (TD_COLS - 1));
        },
      };
    });
  }

  td.radialMenu = { col, row, items };
  tdRenderRadialMenu(items, label);
}

function tdRenderRadialMenu(items, label) {
  const menuEl = EL.tdRadialMenu;
  const canvas = td.canvas;
  const wrap   = document.getElementById('td-canvas-wrap');
  if (!menuEl || !canvas || !td.radialMenu) return;

  const rect     = canvas.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const scaleX   = rect.width  / canvas.width;
  const scaleY   = rect.height / canvas.height;
  const [cx, cy] = tdCellCenter(td.radialMenu.col, td.radialMenu.row, td.cellSize);
  const anchorX  = cx * scaleX + (rect.left - wrapRect.left);
  const anchorY  = cy * scaleY + (rect.top  - wrapRect.top);

  // Arc opens toward the center of the map from wherever it's tapped, so
  // it never spills off whichever edge (top, bottom, left, or right) is
  // closest to the tapped cell — a slot near the map's left edge fans
  // rightward, one near the top fans downward, etc.
  const n      = items.length;
  const radius = 60;
  const spread = n <= 1 ? 0 : Math.min(150, 50 + (n - 1) * 45);
  const center = Math.atan2(wrapRect.height/2 - anchorY, wrapRect.width/2 - anchorX) * 180 / Math.PI;
  const start  = center - spread / 2;
  const step   = n > 1 ? spread / (n - 1) : 0;
  const btnPad = 28; // half the 52px button, keeps the whole circle on-screen

  const btnsHtml = items.map((item, i) => {
    const deg = n === 1 ? center : start + step * i;
    const rad = deg * Math.PI / 180;
    const x = Math.max(btnPad, Math.min(wrapRect.width  - btnPad, anchorX + Math.cos(rad) * radius));
    const y = Math.max(btnPad, Math.min(wrapRect.height - btnPad, anchorY + Math.sin(rad) * radius));
    return `<button class="td-radial-btn${item.disabled ? ' disabled' : ''}" data-idx="${i}"
        style="left:${x}px; top:${y}px; border-color:${item.accent || 'rgba(255,255,255,.5)'}">
      <span class="td-radial-icon">${item.icon}</span>
      <span class="td-radial-sub">${item.sub}</span>
    </button>`;
  }).join('');

  // Label sits on the opposite side of the arc so it never overlaps the buttons.
  const labelRad = (center + 180) * Math.PI / 180;
  const labelX = Math.max(64, Math.min(wrapRect.width  - 64, anchorX + Math.cos(labelRad) * (radius + 40)));
  const labelY = Math.max(16, Math.min(wrapRect.height - 16, anchorY + Math.sin(labelRad) * (radius + 40)));
  const labelHtml = label
    ? `<div class="td-radial-label" style="left:${labelX}px; top:${labelY}px">${label}</div>`
    : '';

  menuEl.innerHTML = btnsHtml + labelHtml;
  menuEl.style.display = 'block';
  menuEl.querySelectorAll('.td-radial-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = items[+btn.dataset.idx];
      if (!item || item.disabled) return;
      // Build options are two-tap: first tap arms (stat card + range ring
      // preview at the placement spot), second tap on the same option
      // builds. Upgrade/sell keep single-tap commit.
      if (item.isBuild && td.radialArmedId !== item.id) {
        td.radialArmedId = item.id;
        menuEl.querySelectorAll('.td-radial-btn').forEach(b =>
          b.classList.toggle('armed', +b.dataset.idx === +btn.dataset.idx));
        tdShowTowerInfoCard(item, btn);
        const def = TD_TOWER_DEFS.find(d => d.id === item.id);
        const [pcx, pcy] = tdCellCenter(td.radialMenu.col, td.radialMenu.row, td.cellSize);
        td.rangePreview = { x: pcx, y: pcy, r: def.range * td.cellSize, color: def.color };
        return;
      }
      item.onSelect();
      tdCloseRadialMenu();
    });
  });
}

// Compact stacked stat card shown while a build option is armed — our
// stylized version of the reference TD's bottom stat strip, anchored next
// to the placement spot instead of across the screen.
function tdShowTowerInfoCard(item, btnEl) {
  const menuEl = EL.tdRadialMenu;
  const wrap = document.getElementById('td-canvas-wrap');
  if (!menuEl || !wrap) return;
  const def = TD_TOWER_DEFS.find(d => d.id === item.id);
  if (!def) return;
  let card = menuEl.querySelector('.td-tower-info');
  if (!card) {
    card = document.createElement('div');
    card.className = 'td-tower-info';
    menuEl.appendChild(card);
  }
  card.innerHTML = `
    <div class="td-ti-name" style="color:${def.color}">${def.icon} ${def.name}</div>
    <div class="td-ti-row"><span>🗡️ Damage</span><b>${def.dmg}</b></div>
    <div class="td-ti-row"><span>🎯 Range</span><b>${def.range}</b></div>
    <div class="td-ti-row"><span>⚡ Fire rate</span><b>${def.rate}/s</b></div>
    <div class="td-ti-hint">tap again to build</div>`;
  card.style.borderColor = def.color;
  // beside the armed button, flipped left if it would leave the wrap
  const wrapRect = wrap.getBoundingClientRect();
  const bx = parseFloat(btnEl.style.left), by = parseFloat(btnEl.style.top);
  card.style.top = Math.max(8, Math.min(wrapRect.height - 118, by - 44)) + 'px';
  card.style.left = (bx + 44 + 128 > wrapRect.width ? bx - 44 - 128 : bx + 44) + 'px';
}

// Keeps affordability current if gold changes (e.g. a quiz reward) while
// the menu is still open, without repositioning or rebuilding it.
function tdRefreshRadialMenuAfford() {
  if (!td.radialMenu) return;
  const menuEl = EL.tdRadialMenu;
  if (!menuEl) return;
  menuEl.querySelectorAll('.td-radial-btn').forEach(btn => {
    const item = td.radialMenu.items[+btn.dataset.idx];
    if (!item || item.cost == null) return;
    item.disabled = td.gold < item.cost;
    btn.classList.toggle('disabled', item.disabled);
  });
}

function tdCloseRadialMenu() {
  td.radialMenu = null;
  td.radialArmedId = null;
  td.rangePreview = null;
  const menuEl = EL.tdRadialMenu;
  if (menuEl) { menuEl.style.display = 'none'; menuEl.innerHTML = ''; }
}

// ── Tutorial (first-run, shown once, localStorage-gated) ──────

function tdShowTutorial() {
  td.paused = true;
  const overlay = EL.tdQOverlay;
  const sheet   = EL.tdQSheet;
  const steps = [
    { icon: '🏗️', title: 'Place a tower',
      body: 'Tap a glowing clearing on the map to open your build options, then tap a tower to place it. Towers fire automatically at enemies.' },
    { icon: '⚔️', title: 'Start a wave',
      body: 'Once your towers are placed, tap <strong>Start Wave</strong>. Need extra gold? Tap 📝 any time for an optional bonus question — correct answers pay out instantly.' },
    { icon: '📝', title: 'Earn gold, upgrade, survive',
      body: 'Tap a placed tower for Upgrade &amp; Sell options. Kill rewards and bonus-question gold fund it all — hold the line through every wave to win. Good luck!' },
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
  const reward = Math.round(baseReward * bossMult * (td.relicMods?.quizGoldMult || 1));
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
  const mastered   = isMastered(q.id);

  const overlay = EL.tdQOverlay;
  const sheet   = EL.tdQSheet;
  sheet.innerHTML = `
    <div class="td-q-head">
      <div style="display:flex;gap:.5rem;align-items:center">
        <span class="td-q-reward">📝 Correct = +${reward}🪙</span>
        <span class="td-diff-badge" style="background:${diffColors[diff]}20;color:${diffColors[diff]};border:1px solid ${diffColors[diff]}55">${diff}</span>
        ${mastered ? '<span class="td-mastery-badge">⭐ Mastered</span>' : ''}
      </div>
      ${isOptional ? `<button id="td-skip" class="td-q-skip">✕</button>` : ''}
    </div>
    <div class="td-q-meta">Part ${q.part} — ${PART_NAMES[q.part] || ''}${q.topic ? ` · ${q.topic}` : ''}</div>
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

      recordQuizResult(q.id, correct);

      const fb = sheet.querySelector('#td-q-fb');
      fb.style.display = 'block';
      if (correct) {
        td.gold += reward; tdUpdateHUD();
        const earned = awardXP(true, 'drill');
        const streakTag = streak >= 3 ? ` · 🔥${streak} streak` : '';
        fb.innerHTML = `<span class="td-fb-ok">✓ Correct! +${reward}🪙 · +${earned} XP${streakTag}</span>`;
        if (!mastered && isMastered(q.id)) {
          fb.innerHTML += '<div class="td-mastery-toast">⭐ Question mastered!</div>';
        }
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
  const begin = () => {
    td.waveIdx     = nextIdx;
    td.optQuizUsed = 0;
    tdStartWave(nextIdx);
    tdUpdateWaveBtn();
    tdUpdateHUD();
  };
  begin();
}

function tdStartWave(idx) {
  td.waveActive = true;
  td.spawnQueue = [];
  for (const [type, count, gap] of td.levelDef.waveDefs[idx]) {
    for (let i = 0; i < count; i++) td.spawnQueue.push({ type, gap });
  }
  td.spawnTimer = 0.5;
  // Pre-wave build phase ends — clear placedThisBuild flags and close any open menu
  for (const t of td.towers) t.placedThisBuild = false;
  tdCloseRadialMenu();
  tdUpdateWavePreview();
  tdAudio.waveStart();
  mapMusic.stop();
}

// ── Power-up runtime (EQ-2) ────────────────────────────────────

function tdRecomputePowerUpMods() {
  const m = td.powerUpMods;
  m.towerRateMult = 1; m.enemySpeedMult = 1; m.killGoldMult = 1;
  for (const active of td.activePowerUps) {
    const pu = TD_POWER_UPS[active.id];
    if (!pu) continue;
    const { type, value } = pu.effect;
    if (type === 'tower-rate')  m.towerRateMult  *= (1 + value);
    if (type === 'enemy-speed') m.enemySpeedMult *= (1 + value);
    if (type === 'kill-gold')   m.killGoldMult   *= value;
  }
}

function tdClearWavePowerUps() {
  td.activePowerUps = td.activePowerUps.filter(p => p.scope !== 'wave');
  tdRecomputePowerUpMods();
}

function tdUpdatePowerUpTray() {
  const el = EL.tdPowerUpTray;
  if (!el) return;
  const run      = td?.__run;
  const powerUps = run?.powerUps || [];
  const between  = !td.waveActive && td.waveIdx >= 0 && td.waveIdx < td.levelDef.waveDefs.length - 1;
  if (!between || !powerUps.length) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = `<span class="td-pu-label">Power-ups</span>` +
    powerUps.map((pid, i) => {
      const pu = TD_POWER_UPS[pid];
      if (!pu) return '';
      return `<button class="td-pu-chip" data-idx="${i}">` +
        `${pu.icon} ${pu.name}<span class="td-pu-scope">${pu.scope === 'wave' ? '1 wave' : 'this node'}</span></button>`;
    }).join('');
  el.querySelectorAll('.td-pu-chip').forEach(btn => {
    btn.addEventListener('click', () => tdActivatePowerUp(+btn.dataset.idx));
  });
}

function tdActivatePowerUp(idx) {
  const run = td?.__run;
  if (!run?.powerUps) return;
  const pid = run.powerUps[idx];
  const pu  = TD_POWER_UPS[pid];
  if (!pu) return;
  run.powerUps.splice(idx, 1);
  tdSaveRun(run);
  const { type, value } = pu.effect;
  if (type === 'gold-now') {
    td.gold += value;
    td.damageNumbers.push({ x: td.canvas ? td.canvas.width / 2 : 160, y: 60,
      label: `+${value}🪙 ${pu.name}!`, life: 1.4, maxLife: 1.4, color: '#FBBF24' });
  } else if (type === 'lives') {
    td.lives   += value;
    td.maxLives += value;
    td.activePowerUps.push({ id: pid, scope: pu.scope });
  } else {
    td.activePowerUps.push({ id: pid, scope: pu.scope });
    tdRecomputePowerUpMods();
  }
  tdUpdateHUD();
  tdUpdatePowerUpTray();
}

function tdEndlessNextBatch() {
  const mult = td.levelDef.enemyMult * Math.pow(1.18, td.endlessWave);
  const seed = ((td.mapId + 1) * 31337 + (td.endlessWave + 1) * 99991) >>> 0;
  const rng  = makeSeedRng(seed);
  const waves = generateWaves(mult, 3, rng);
  if (td.endlessWave > 0 && td.endlessWave % 3 === 2) {
    waves.push([['boss', 1, 4.0], ['goblin', 4 + td.endlessWave, 0.8]]);
  }
  td.levelDef.waveDefs.push(...waves);
}

function tdEnterEndless() {
  td.won = false; td.endless = true; td.optQuizUsed = 0;
  tdEndlessNextBatch();
  const actDiv = EL.tdActions;
  if (!actDiv) return;
  actDiv.innerHTML = `
    <div id="td-powerup-tray" class="td-powerup-tray" style="display:none"></div>
    <div class="td-actions-row">
      <button class="td-quiz-btn" id="td-quiz-btn">📝 +25🪙 (3)</button>
      <button class="td-wave-btn" id="td-wave-btn">
        <span class="td-wave-btn-main">⚔️ Start Wave 1</span>
        <span id="td-wave-preview" class="td-wave-preview" style="display:none"></span>
      </button>
    </div>`;
  EL.tdPowerUpTray = document.getElementById('td-powerup-tray');
  EL.tdWavePreview = document.getElementById('td-wave-preview');
  EL.tdWaveBtn     = document.getElementById('td-wave-btn');
  EL.tdQuizBtn     = document.getElementById('td-quiz-btn');
  EL.tdWaveBtn.addEventListener('click', tdOnWaveBtn);
  EL.tdQuizBtn.addEventListener('click', function() {
    if (!td || td.quizOpen || td.over || td.won) return;
    if (td.optQuizUsed >= tdQuizMax()) { const b = EL.tdQuizBtn; if (b) { b.textContent = `📝 Max ${tdQuizMax()}/wave`; setTimeout(tdUpdateHUD, 1500); } return; }
    td.optQuizUsed++;
    tdOpenQuiz(25, true, function() { tdUpdateHUD(); });
  });
  tdUpdateHUD(); tdUpdateWaveBtn(); tdUpdatePowerUpTray();
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
    if (td.endless) {
      wEl.textContent = td.waveActive ? `⚡ Endless · Wave ${td.waveIdx + 1}` : `⚡ Wave clear! ${td.endlessKills} kills`;
    } else if (td.waveIdx < 0)           wEl.textContent = 'Place towers, then start!';
    else if (td.waveActive)       wEl.textContent = ''; // wave button is the single Wave X/Y indicator
    else if (td.waveIdx < wc - 1) wEl.textContent = `Wave ${td.waveIdx + 1} cleared!`;
    else                          wEl.textContent = 'All waves cleared!';
  }

  const dotsEl = EL.tdWaveDots;
  if (dotsEl) {
    if (td.endless) { dotsEl.innerHTML = ''; }
    else {
      dotsEl.innerHTML = Array.from({length: wc}, (_, i) => {
        const cls = i < td.waveIdx ? 'done' : (i === td.waveIdx && td.waveActive ? 'active' : '');
        return `<span class="td-wdot ${cls}"></span>`;
      }).join('');
    }
  }

  const quizBtn = EL.tdQuizBtn;
  if (quizBtn) {
    const rem = tdQuizMax() - td.optQuizUsed;
    quizBtn.textContent = rem > 0 ? `📝 +25🪙 (${rem})` : '📝 Max/wave';
    quizBtn.style.opacity = rem > 0 ? '1' : '0.4';
  }
  tdRefreshRadialMenuAfford();
  tdUpdateWavePreview();
}

function tdUpdateWaveBtn() {
  const btn = EL.tdWaveBtn;
  if (!btn) return;
  const wc = td.levelDef.waveDefs.length;
  const mainSpan = btn.querySelector('.td-wave-btn-main');
  const setText = t => { if (mainSpan) mainSpan.textContent = t; else btn.textContent = t; };
  // During a wave the button turns into the single progress indicator —
  // "Wave X/Y" bottom-right, no duplicate labels elsewhere.
  if (td.waveActive) { btn.disabled = true; setText(`⚔️ Wave ${td.waveIdx + 1}/${wc}`); return; }
  const next = td.waveIdx + 1;
  if (next >= wc) { btn.disabled = true; return; }
  btn.disabled = false;
  setText(`⚔️ Start Wave ${next + 1}`);
}

function tdUpdateWavePreview() {
  const el = EL.tdWavePreview;
  if (!el) return;
  const nextIdx = td.waveIdx + 1;
  const waveDefs = td.levelDef.waveDefs;
  if (td.waveActive || nextIdx >= waveDefs.length) { el.style.display = 'none'; return; }
  const EMOJI = { goblin:'👺', orc:'👹', scout:'💨', troll:'🧌', boss:'💀', raider:'🏃', brute:'🛡️', wisp:'🕊️', shaman:'➕', bandit:'🗡️', bandit_rider:'🏇', bandit_boss:'🏴‍☠️' };
  const COLORS = { goblin:'#4ADE80', orc:'#FBBF24', scout:'#F472B6', troll:'#C084FC', boss:'#EF4444', raider:'#38BDF8', brute:'#78716C', wisp:'#A5F3FC', shaman:'#34D399', bandit:'#B45309', bandit_rider:'#92400E', bandit_boss:'#7C2D12' };
  const wave = waveDefs[nextIdx];
  const hasBoss = wave.some(([t]) => TD_ENEMY_DEFS[t]?.isBoss);
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
  tdAudio.gameOver();
  earnGold(15);
  const actDiv = EL.tdActions;
  if (actDiv) {
    if (td.endless) {
      actDiv.innerHTML = `
        <div class="td-end-msg td-end-lose">⚡ Endless over — ${td.endlessKills} kills · ${td.endlessWave} batch${td.endlessWave !== 1 ? 'es' : ''} cleared</div>
        <button class="td-map-btn" id="td-map">🗺️ Map</button>`;
      document.getElementById('td-map').addEventListener('click', () => { const r=td.__run; if (r) showRunMap(r); else showTDWorldMap(); });
    } else {
      actDiv.innerHTML = `
        <div class="td-end-msg td-end-lose">💀 Defeated — the horde broke through</div>
        <button class="td-wave-btn" id="td-retry">🔄 Retry</button>
        <button class="td-map-btn" id="td-map">🗺️ Map</button>`;
      document.getElementById('td-retry').addEventListener('click', () => showTowerDefenseScreen(td.levelDef, td.__nodeId, td.__run));
      document.getElementById('td-map').addEventListener('click', () => { const r=td.__run; if (r) { const n=r.nodes.find(x=>x.id===td.__nodeId); if(n&&n.state==='active'){n.state='available';r.activeId=null;tdSaveRun(r);} showRunMap(r); } else showTDWorldMap(); });
    }
  }
}

function tdVictory() {
  td.won = true;
  tdClearAutosave();
  tdAudio.victory();
  const livesLost  = td.maxLives - td.lives;
  const stars      = livesLost === 0 ? 3 : livesLost <= 5 ? 2 : 1;
  tdSaveStars(td.levelIdx, stars);

  const modCount   = Object.values(td.modifiers || {}).filter(Boolean).length;
  const goldReward = 30 + td.levelIdx * 10 + modCount * 15;
  earnGold(goldReward);
  unlockIfNew('td_win');

  const starStr  = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  const modBadge = modCount > 0 ? ` 🔥×${modCount}` : '';
  showAchievementToast({ icon:'🛡️', name:'Victory!', desc:`${starStr} ${td.levelDef.name} cleared! +${goldReward}🪙${modBadge}` });

  const run   = td.__run;
  const nodeId = td.__nodeId;
  if (run && nodeId) {
    markNodeCompleted(run, nodeId);
    run.stats.battlesWon++;
    run.stats.goldEarned += goldReward;
    // Persist the run's actual wallet/health forward to the next battle.
    // "No Gold" fought this battle on kill-income alone (td.gold started
    // at 0) — its real banked total (noGoldBankedGold) was stashed aside
    // in tdMakeState and gets added back here, on top of whatever was
    // earned, rather than being overwritten by it. The flat victory bonus
    // (goldReward) also banks into the run wallet here, not just the
    // separate meta `gold` stat earnGold() already credited above.
    run.gold = td.gold + (td.noGoldBankedGold || 0) + goldReward;
    run.lives = td.lives;
    run.maxLives = td.maxLives;
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
          <button class="td-wave-btn" id="td-endless" style="flex:1">⚡ Endless</button>
        </div>
      </div>`;
    document.getElementById('td-map').addEventListener('click', () => { if (run) showRunMap(run); else showTDWorldMap(); });
    document.getElementById('td-endless')?.addEventListener('click', tdEnterEndless);
  }
}

// ╔══════════════════════════════════════════════════════════════
//  TD RENDERER — canvas draw calls only, no game-state mutation
//  sprites · terrain · towers/enemies · particles · HUD overlays (S-4)
// ╚══════════════════════════════════════════════════════════════

// ── Pixel-art sprite blitter ────────────────────────────────────
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

// Per-theme background cell colour palettes (3 shades, picked by cell seed)
const TD_THEME_CELLS = {
  verdant: ['#162a10', '#122409', '#1a3012'],
};

// ── Background & terrain ─────────────────────────────────────────

function tdRenderBackground(ctx, cs, W, H, isLight, PAL) {
  if (td.paintedBg) {
    if (td.paintedBg.complete && td.paintedBg.naturalWidth) {
      // Sampling mode comes from the map JSON's pixelArt flag (default
      // true). Today's art is 2× NN-upscaled pixel art: bilinear
      // resampling to the canvas (2048 source → e.g. 2520 backing px on a
      // dpr-3 phone) smears every pixel edge, so it draws nearest-neighbor
      // to match the sprites. When a high-density repaint ships, flip
      // pixelArt to false in the JSON: real detail downscales better with
      // bilinear (NN would alias) — no code change needed.
      const smooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = td.levelDef.pixelArt === false;
      ctx.drawImage(td.paintedBg, 0, 0, W, H);
      ctx.imageSmoothingEnabled = smooth;
      return;
    }
    // Image still loading — flat fallback fill for this frame only.
    ctx.fillStyle = '#162016';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const mapDef = TD_MAPS[td.mapId] ?? TD_MAPS[0];
  const palette = isLight ? null : (TD_THEME_CELLS[mapDef.themeName] ?? TD_THEME_CELLS.verdant);
  if (palette) {
    for (let r = 0; r < TD_ROWS; r++) {
      for (let c = 0; c < TD_COLS; c++) {
        const seed = ((c * 2654435761 + r * 1234567891) >>> 0);
        ctx.fillStyle = palette[seed % 3];
        ctx.fillRect(c * cs, r * cs, cs, cs);
      }
    }
  } else {
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);
  }
}

// Edge vignette that breathes slowly (the V-31 sprite-sheet terrain-deco
// system this function also drew was retired 2026-07-02 and removed 2026-07-13)
function tdRenderVignette(ctx, bgT, W, H) {
  const vig = 0.06 + 0.022 * Math.sin(bgT * 0.28);
  const vGrad = ctx.createRadialGradient(W*.5, H*.5, W*.18, W*.5, H*.5, W*.88);
  vGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(1, `rgba(0,0,0,${vig})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, W, H);
}

// Cobblestone path tiles (V-12)
function tdRenderPath(ctx, cs, PAL) {
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
}

// Animated data-flow dots on path (V-13)
function tdRenderDataFlowDots(ctx, cs, bgT) {
  const wpsArr = td.levelDef.wps;
  const segs = [];
  let totalLen = 0;
  for (let i = 0; i < wpsArr.length - 1; i++) {
    const [c0, r0] = wpsArr[i], [c1, r1] = wpsArr[i+1];
    const x0 = c0*cs + cs/2, y0 = r0*cs + cs/2;
    const x1 = c1*cs + cs/2, y1 = r1*cs + cs/2;
    const len = Math.hypot(x1-x0, y1-y0);
    segs.push({ x0, y0, x1, y1, len });
    totalLen += len;
  }
  if (totalLen > 0) {
    const spacing  = totalLen / 4;
    const dotSpeed = cs * 1.0;
    for (let i = 0; i < 4; i++) {
      let rem = ((bgT * dotSpeed + i * spacing) % totalLen);
      let dx = null, dy = null;
      for (const seg of segs) {
        if (rem <= seg.len) {
          const f = rem / seg.len;
          dx = seg.x0 + (seg.x1 - seg.x0) * f;
          dy = seg.y0 + (seg.y1 - seg.y0) * f;
          break;
        }
        rem -= seg.len;
      }
      if (dx == null) continue;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath(); ctx.arc(dx, dy, cs * 0.20, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(dx, dy, cs * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

// Animated entry / exit portals
function tdRenderPortals(ctx, cs, W, bgT, entryRow, exitRow) {
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
}

// Landmark anchors (V-15)
function tdRenderLandmarks(ctx, cs, W, bgT, wps, entryRow, exitRow) {
  const mapDef = TD_MAPS[td.mapId] ?? TD_MAPS[0];
  const midWp  = wps[Math.floor(wps.length / 2)];
  // bgT can be a hair negative on the very first render (rAF timestamp vs.
  // the performance.now() call that seeded lastTs) — normalize before % 2,
  // since JS % keeps the sign of its left operand instead of wrapping.
  const frame  = Math.floor(((bgT % 2) + 2) % 2);
  const drawLandmark = (key, cx, cy) => {
    const lm = TD_LANDMARKS[key];
    if (!lm) return;
    const ps = (cs * 2.15) / lm.frames[0].length;
    tdDrawSprite(ctx, lm.frames, frame, lm.pal, cx, cy, ps);
  };
  drawLandmark('watchtower', cs * 0.35, entryRow * cs + cs / 2);
  drawLandmark('gate', W - cs * 0.35, exitRow * cs + cs / 2);
  drawLandmark(TD_LANDMARK_MID[mapDef.themeName] || 'shrine', midWp[0] * cs + cs / 2, midWp[1] * cs + cs / 2);
}

// Pending placement highlight + tower placement ghost preview
// Marks empty build slots on painted maps (the art shows clearings, but a
// faint pip makes it obvious which cells are actually tappable).
function tdRenderBuildSlots(ctx, cs, bgT) {
  if (!td.buildSlotSet) return;
  const pulse = 0.5 + 0.5 * Math.sin(bgT * 2.4);
  for (const key of td.buildSlotSet) {
    const [col, row] = key.split(',').map(Number);
    if (td.towers.some(t => t.col === col && t.row === row)) continue;
    const [px, py] = tdCellCenter(col, row, cs);
    ctx.beginPath();
    ctx.arc(px, py, cs*0.22 + pulse*1.5, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(251,191,36,${0.45 + pulse*0.25})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function tdRenderPlacementUI(ctx, cs, bgT) {
  tdRenderBuildSlots(ctx, cs, bgT);
  // Highlight whichever cell the radial menu is currently open on.
  if (td.radialMenu) {
    const [mpx, mpy] = tdCellCenter(td.radialMenu.col, td.radialMenu.row, cs);
    const pulse = 0.5 + 0.5 * Math.sin(bgT * 6);
    ctx.fillStyle = `rgba(74,222,128,${0.18 + pulse * 0.14})`;
    ctx.fillRect(mpx - cs/2, mpy - cs/2, cs, cs);
    ctx.strokeStyle = `rgba(74,222,128,${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(mpx - cs/2 + 1, mpy - cs/2 + 1, cs - 2, cs - 2);
  }
}

// ── Entities ───────────────────────────────────────────────────

// Color-blind mode (U-4): a subtle white pattern clipped to the tower tile,
// distinguishing tower type without relying on the border/glow color alone.
function tdDrawTowerPattern(ctx, x, y, size, pattern) {
  ctx.save();
  tdRRect(ctx, x, y, size, size, 4);
  ctx.clip();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.1;
  const step = size / 4;
  if (pattern === 'diagonal' || pattern === 'cross') {
    for (let i = -size; i < size * 2; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + size, y + size);
      ctx.stroke();
      if (pattern === 'cross') {
        ctx.beginPath();
        ctx.moveTo(x + i + size, y);
        ctx.lineTo(x + i, y + size);
        ctx.stroke();
      }
    }
  } else if (pattern === 'dots') {
    ctx.fillStyle = '#FFFFFF';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc(x + step * (c + 0.75), y + step * (r + 0.75), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// Blackened copy of a tower sprite, rendered once per source image into an
// offscreen canvas and cached. `ctx.filter = 'brightness(0)'` would be the
// one-line way to get this, but iOS Safari (pre-18) silently ignores canvas
// filters — the sprite drew in full colour and the "shadow" appeared as a
// pale sheared duplicate of the tower instead of a dark shape on the
// ground. source-in compositing (draw sprite, then fill black through its
// alpha) is supported everywhere and produces the identical cutout.
const TD_TOWER_SILHOUETTES = new Map();
function tdTowerSilhouette(tierImg) {
  let sil = TD_TOWER_SILHOUETTES.get(tierImg);
  if (!sil) {
    sil = document.createElement('canvas');
    sil.width  = tierImg.naturalWidth;
    sil.height = tierImg.naturalHeight;
    const sctx = sil.getContext('2d');
    sctx.drawImage(tierImg, 0, 0);
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, sil.width, sil.height);
    TD_TOWER_SILHOUETTES.set(tierImg, sil);
  }
  return sil;
}

// Silhouette shadow: redraws the tower's OWN sprite blackened (see
// tdTowerSilhouette), so the shadow is a solid-black cutout of the tower's
// exact shape (roof, walls, ladder rungs, whatever it actually is) instead
// of a generic ellipse. A ladder tower gets a ladder-shaped shadow, a stone
// tower gets a wider, blockier one, and every future asset gets a correct
// shadow for free with no per-tier tuning. Sheared toward lower-left
// (matching the
// map's implied sun — see the shadow-direction note in
// docs/TOWER_GENERATION_PROMPTS.md) so it reads as fallen on the ground rather
// than a second copy of the tower. The squash factor here (0.50) is
// deliberately less flat than a "physically correct" dropped shadow would
// be — at actual in-game cell sizes (as small as ~30px on mobile), thin
// features like ladder rungs get crushed into an unrecognizable blur if
// squashed much flatter, so this keeps enough of the sprite's vertical
// structure that its shape still reads as itself, not just a smudge. The
// shear/squash only scales with height above the ground, so it's identical
// for every placement of the same tower/tier regardless of where it sits on
// the map — real directional light is parallel at this scale, so position
// doesn't change a shadow's shape, only which cell it happens to fall in.
function tdRenderTowerShadow(ctx, tierImg, px, groundY, renderW, renderH) {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.translate(px, groundY);
  ctx.transform(1, 0, 0.20, 0.50, 0, 0);
  ctx.drawImage(tdTowerSilhouette(tierImg), -renderW / 2, -renderH, renderW, renderH);
  ctx.restore();
}

// Horizontally flips whatever `draw` renders, around the vertical line
// x=px, so a tower's art/shadow can face the opposite way without a second
// asset — used for the 2 of 4 facings that mirroring covers for free (see
// tdComputeSlotFacing). Kept separate from ring/flash/badge drawing (those
// stay unmirrored) since text and the targeting flash shouldn't render
// backwards.
function tdWithMirror(ctx, px, mirror, draw) {
  if (!mirror) { draw(); return; }
  ctx.save();
  ctx.translate(px, 0); ctx.scale(-1, 1); ctx.translate(-px, 0);
  draw();
  ctx.restore();
}

// One tower (shadow, art, upgrade ring, muzzle flash, level tag). Called
// from the depth-sorted world pass in tdRender; its ground-contact baseline
// there is tdCellCenter y + cs/2 — the same groundY computed below.
function tdDrawTower(ctx, cs, bgT, t) {
    const def   = TD_TOWER_DEFS.find(d => d.id === t.type);
    const stats = tdGetTowerStats(t);
    const lvl   = t.level || 0;
    const maxLvl = def.upgrades.length;
    const [px, py] = tdCellCenter(t.col, t.row, cs);
    const groundY = py + cs / 2; // where the tower's base sits

    // Painted tower art (V-36) — currently only Ranger. Falls back to the pixel
    // TD_SPRITES rendering below for every other tower type, or if the image
    // hasn't finished loading yet. Variant (front/back) + mirror come from
    // this slot's precomputed facing (tdComputeSlotFacing) so the tower
    // orients toward the road instead of always facing the same way.
    const facing  = td.slotFacingMap?.[`${t.col},${t.row}`];
    const variant = facing?.back ? 'back' : 'front';
    const mirror  = facing?.mirror || false;
    const tierImg  = TD_TOWER_TIER_IMAGES[t.type]?.[variant]?.[lvl] || TD_TOWER_TIER_IMAGES[t.type]?.front?.[lvl];
    const useImage = tierImg && tierImg.complete && tierImg.naturalWidth > 0;
    const renderH  = useImage ? cs * 1.9 : 0;
    const renderW  = useImage ? renderH * (tierImg.naturalWidth / tierImg.naturalHeight) : 0;

    if (useImage) tdWithMirror(ctx, px, mirror, () => tdRenderTowerShadow(ctx, tierImg, px, groundY, renderW, renderH));

    if (lvl > 0) {
      const glowColor = stats.glow || '#F59E0B';
      const ringR     = cs * (0.48 + lvl * 0.08);
      const ringY     = useImage ? groundY : py;
      ctx.beginPath(); ctx.arc(px, ringY, ringR, 0, Math.PI*2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth   = lvl >= maxLvl ? 3 : 2;
      ctx.globalAlpha = 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if ((t.flashLife || 0) > 0) {
      const frac     = t.flashLife / 0.06;
      const flashLen = cs * (0.30 + 0.25 * frac);
      const angle    = t.flashAngle || 0;
      const fx       = px, fy = useImage ? groundY - renderH * 0.6 : py;
      ctx.save();
      ctx.globalAlpha = frac * 0.85;
      ctx.strokeStyle = stats.glow || def.color;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(angle) * flashLen, fy + Math.sin(angle) * flashLen);
      ctx.stroke();
      ctx.restore();
    }

    if (useImage) {
      tdWithMirror(ctx, px, mirror, () => ctx.drawImage(tierImg, px - renderW / 2, groundY - renderH, renderW, renderH));
      if (lvl > 0) {
        ctx.font      = `bold ${Math.round(cs*.22)}px sans-serif`;
        ctx.fillStyle = lvl >= maxLvl ? '#C084FC' : '#F59E0B';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('L' + (lvl+1), px + renderW/2 - 2, groundY - 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      }
      return;
    }

    ctx.fillStyle = 'rgba(0,0,0,.5)';
    tdRRect(ctx, px-cs/2+1, py-cs/2+1, cs-2, cs-2, 5); ctx.fill();

    ctx.strokeStyle = lvl > 0 ? (stats.glow || def.color) : def.color;
    ctx.lineWidth   = lvl > 0 ? 2 : 1.5;
    tdRRect(ctx, px-cs/2+2, py-cs/2+2, cs-4, cs-4, 4); ctx.stroke();

    if (colorBlindMode && def.pattern) tdDrawTowerPattern(ctx, px-cs/2+2, py-cs/2+2, cs-4, def.pattern);

    const tSpr = TD_SPRITES[t.type];
    if (tSpr) {
      const tPal   = tSpr.pals[lvl] || tSpr.pals[0];
      const tPs    = Math.max(2, Math.floor(cs * 0.82 / Math.max(tSpr.pw, tSpr.ph)));
      const fIdx   = (t.firePulse || 0) > 0.12 ? 1 : 0;
      const idle   = (t.firePulse || 0) < 0.05 ? 1 + 0.04 * Math.sin(bgT * 1.8 + (t.idlePhase || 0)) : 1;
      ctx.save();
      ctx.translate(px, py); ctx.scale(idle, idle); ctx.translate(-px, -py);
      tdDrawSprite(ctx, tSpr.frames, fIdx, tPal, px, py, tPs);
      ctx.restore();
    }

    if (lvl > 0) {
      ctx.font      = `bold ${Math.round(cs*.22)}px sans-serif`;
      ctx.fillStyle = lvl >= maxLvl ? '#C084FC' : '#F59E0B';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('L' + (lvl+1), px + cs/2 - 2, py + cs/2 - 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
}

// Structures that straddle the road (gate towers, overhanging rooflines):
// their pixels are redrawn from the painted background AFTER enemies, so
// units visibly pass BEHIND them — cheap occlusion without y-sorting.
function tdRenderOccluders(ctx) {
  if (!td.occluders || !td.paintedBg || !td.paintedBg.complete || !td.paintedBg.naturalWidth || !td.bgSize) return;
  const [imgW, imgH] = td.bgSize;
  const kx = td.canvas.width / imgW, ky = td.canvas.height / imgH;
  // Authoring coordinates live in the JSON's logical viewBox space
  // (td.bgSize, 2048×868 today) no matter what resolution the PNG actually
  // ships at — sx/sy rescale the source rect so a higher-density repaint
  // is a pure asset swap with zero coordinate migration.
  const sx = td.paintedBg.naturalWidth / imgW, sy = td.paintedBg.naturalHeight / imgH;
  // Occluders are polygons (rects arrive pre-converted, see
  // tdInitWorldData): clip to the shape, then blit its bounding box of the
  // map art back over whatever was drawn — only the pixels inside the
  // polygon land.
  for (const poly of td.occluders) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ctx.save();
    // Same sampling mode as tdRenderBackground — the blit re-draws
    // background pixels, so a smoothing mismatch would make every occluder
    // patch visibly softer/sharper than the map around it. (restore()
    // resets it.)
    ctx.imageSmoothingEnabled = td.levelDef.pixelArt === false;
    ctx.beginPath();
    poly.forEach(([x, y], i) => {
      ctx[i ? 'lineTo' : 'moveTo'](x * kx, y * ky);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(td.paintedBg, x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy,
      x0 * kx, y0 * ky, (x1 - x0) * kx, (y1 - y0) * ky);
    ctx.restore();
  }
}

// Corpse death sequences (A-3): 4 painted frames over ~0.55s, hold the
// final lying pose, then fade. Drawn under living enemies.
function tdRenderCorpses(ctx, cs) {
  for (const c of td.corpses) {
    const sheet = TD_ENEMY_SHEET_IMAGES[c.type];
    if (!tdEnemySheetReady(sheet, 'death')) continue;
    const img = sheet.death.img;
    const fw = img.naturalWidth / sheet.death.frames, fh = img.naturalHeight;
    const h = c.r * cs * (sheet.scale || 3.2), w = h * fw / fh;
    const fr = Math.min(sheet.death.frames - 1, Math.floor(c.t / 0.14));
    const alpha = c.t < 0.9 ? 1 : Math.max(0, 1 - (c.t - 0.9) / 0.6);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    if (c.faceLeft) { ctx.translate(c.x, 0); ctx.scale(-1, 1); ctx.translate(-c.x, 0); }
    ctx.drawImage(img, fr * fw, 0, fw, fh, c.x - w / 2, c.footY - h, w, h);
    ctx.restore();
  }
}

// One enemy (shadow, sprite/fallback, badges, HP bar). Called from the
// depth-sorted world pass in tdRender; its foot baseline there is
// e.y + e.r*cs*0.78 — matching the painted sheets' footY below.
function tdDrawEnemy(ctx, cs, bgT, e) {
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
    // Painted animation sheet (A-3) if this enemy type has one; otherwise
    // the original tinted-circle + procedural pixel sprite fallback.
    const eSheet = TD_ENEMY_SHEET_IMAGES[e.type];
    let paintedTopY = null;
    if (tdEnemySheetReady(eSheet, 'walk')) {
      // facing: mirror when actually moving left (vertical jogs keep the
      // last horizontal facing)
      if (e._px !== undefined) {
        const dx = e.x - e._px;
        if (dx < -0.5) e._faceLeft = true;
        else if (dx > 0.5) e._faceLeft = false;
      }
      e._px = e.x;
      const wImg = eSheet.walk.img;
      const fw = wImg.naturalWidth / eSheet.walk.frames, fh = wImg.naturalHeight;
      const eh = e.r * cs * (eSheet.scale || 3.2), ew = eh * fw / fh;
      // A-B-A-B playback, cadence scaled by the enemy's speed stat
      const fr = Math.floor(bgT * 3.2 * (e.spd || 1.5) + (e.animOffset || 0)) % eSheet.walk.frames;
      const footY = e.y + r * 0.78;
      paintedTopY = footY - eh;
      ctx.save();
      // Nearest-neighbor keeps the pixel-art crunch when downscaling the
      // large source frames — smoothing turns them to mush against the map.
      ctx.imageSmoothingEnabled = false;
      if (e._faceLeft) { ctx.translate(e.x, 0); ctx.scale(-1, 1); ctx.translate(-e.x, 0); }
      ctx.drawImage(wImg, fr * fw, 0, fw, fh, e.x - ew / 2, footY - eh, ew, eh);
      ctx.restore();
    } else {
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
    } else if (e.armored || e.flying || e.healer) {
      // G-2: special-type badge (armored/flying/healer mechanics aren't visible otherwise)
      ctx.font = `${Math.round(r * 0.85)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.armored ? '🛡️' : e.flying ? '🕊️' : '➕', e.x, e.y - r - cs * 0.28);
    }
    // HP bar (wider for bosses); painted sprites are taller than the old
    // backing circle, so the bar rides above the sprite's actual top
    const bw = e.isBoss ? r*3.6 : r*2.4, bh = Math.max(e.isBoss ? 5 : 3, cs*.09);
    const bx = e.x - bw/2;
    const by = paintedTopY !== null ? paintedTopY - bh - 3
             : e.y - r - bh - (e.isBoss ? cs*0.55 : 3);
    const hpFrac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hpFrac > .5 ? '#4ADE80' : hpFrac > .25 ? '#FBBF24' : '#EF4444';
    ctx.fillRect(bx, by, bw*hpFrac, bh);
    if (e.isBoss) {
      ctx.strokeStyle = '#FBBF2488'; ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }
}

// ── Projectiles, particles & floating text ───────────────────────

function tdRenderProjectiles(ctx, cs) {
  for (const p of td.projectiles) {
    if (p.px !== undefined) {
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = p.color + '70'; ctx.lineWidth = cs * 0.14; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(p.x, p.y, cs * .13, 0, Math.PI*2);
    ctx.fillStyle = p.color; ctx.fill();
  }
}

function tdRenderParticles(ctx) {
  for (const p of td.particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.shape === 'coin') {
      const spin = (1 - a) * Math.PI * 3 + (p.angle || 0);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(spin);
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
      ctx.restore();
    } else if (p.shape === 'ring') {
      const rr = p.r * (2 - a);
      ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI*2);
      ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      ctx.globalAlpha = a * 0.7;
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function tdRenderDamageNumbers(ctx, cs) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(cs * 0.34)}px sans-serif`;
  for (const n of td.damageNumbers) {
    const a = n.life / n.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = n.color;
    ctx.fillText(n.label !== undefined ? n.label : ('-' + n.val), n.x, n.y);
  }
  ctx.globalAlpha = 1;
}

// ── HUD overlays: boss flash, pause, game over / victory ────────

function tdRenderOverlays(ctx, cs, W, H) {
  if ((td.bossFlash || 0) > 0) {
    ctx.fillStyle = `rgba(255,255,255,${td.bossFlash * 0.6})`;
    ctx.fillRect(0, 0, W, H);
    td.bossFlash = Math.max(0, td.bossFlash - 0.016);
  }

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

// ── Orchestrator ──────────────────────────────────────────────────

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
  const bgT = td.bgTime;

  tdRenderBackground(ctx, cs, W, H, isLight, PAL);
  // Painted maps already depict scenery/road/gate in the art itself — skip
  // the procedural terrain deco layer that's meant for the flat theme fill.
  if (!td.paintedBg) tdRenderVignette(ctx, bgT, W, H);

  let sx = 0, sy = 0;
  if (td.shake > 0) {
    td.shake = Math.max(0, td.shake - 0.016);
    const mag = td.shake * 7;
    sx = (Math.random() - 0.5) * mag * 2;
    sy = (Math.random() - 0.5) * mag * 2;
  }
  ctx.save();
  ctx.translate(sx, sy);

  if (!td.paintedBg) tdRenderPath(ctx, cs, PAL);
  // Dots ride the Manhattan-grid path used for enemy movement, which only
  // approximates a painted road's silhouette (see tdBuildManhattanWps) —
  // fine floating over the flat procedural path, visibly off the road
  // once there's real art underneath.
  if (!td.paintedBg) tdRenderDataFlowDots(ctx, cs, bgT);

  const wps      = td.levelDef.wps;
  const entryRow = wps[0][1], exitRow = wps[wps.length-1][1];

  if (!td.paintedBg) {
    tdRenderPortals(ctx, cs, W, bgT, entryRow, exitRow);
    tdRenderLandmarks(ctx, cs, W, bgT, wps, entryRow, exitRow);
  }
  tdRenderPlacementUI(ctx, cs, bgT);
  // Armed-build range preview ring (two-tap placement flow) — a ground
  // decal, so it draws under the depth-sorted units/towers below.
  if (td.rangePreview) {
    const rp = td.rangePreview;
    ctx.save();
    ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = rp.color + 'CC'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rp.color + '14'; ctx.fill();
    ctx.restore();
  }
  tdRenderCorpses(ctx, cs);
  // Depth-sorted world pass: towers and living units (ghosts included —
  // they must depth-test like real enemies) interleave by ground-contact Y,
  // Kingdom-Rush style. An enemy on the road NORTH of a tower's base now
  // passes BEHIND it instead of stamping feet/shadow over the tower art;
  // one walking SOUTH correctly crosses in front. Baseline ties keep
  // path-progress order so side-by-side enemies don't flicker. Corpses lie
  // flat and stay under everything; painted-building occlusion is still
  // the occluder blit after this pass.
  const worldItems = [];
  for (const t of td.towers) {
    const [, py] = tdCellCenter(t.col, t.row, cs);
    worldItems.push({ y: py + cs / 2, d: 0, draw: () => tdDrawTower(ctx, cs, bgT, t) });
  }
  for (const e of [...td.enemies, ...(td.__ghosts || [])]) {
    worldItems.push({ y: e.y + e.r * cs * 0.78, d: e.dist || 0, draw: () => tdDrawEnemy(ctx, cs, bgT, e) });
  }
  worldItems.sort((a, b) => (a.y - b.y) || (b.d - a.d));
  for (const item of worldItems) item.draw();
  tdRenderOccluders(ctx);
  tdRenderProjectiles(ctx, cs);
  tdRenderParticles(ctx);
  tdRenderDamageNumbers(ctx, cs);

  ctx.restore();

  tdRenderOverlays(ctx, cs, W, H);
  tdRenderAuthorOverlay(ctx, cs, W, H);
}

// ── Map authoring tools (Creator Mode → 🗺️ Map) — v2, in-app editor ──
// Dev-only. On painted battle maps the overlay shows every occluder rect
// (red, with its [x0,y0,x1,y1]), every build slot (blue ring + [x,y]), and
// the enemy lane (yellow); hovering shows a live crosshair + IMAGE-SPACE
// pixel readout (the same 2048×868 coordinates the authoring JSON uses),
// and a tap on empty ground still copies "[x,y]" like v1.
//
// v2 (2026-07-14): on maps whose authoring JSON is loaded (Frontier Town),
// the map is EDITABLE in place. A floating toolbar picks the tool:
//   ✥  move    — drag slots, lane points (orange dots), occluder corners
//   ⊕  slot    — tap adds a build slot
//   ➜  lane    — tap inserts a lane waypoint into the nearest segment
//   ▦  occl    — tap adds an occluder rect (drag corners to fit)
//   ✕  delete  — tap removes the slot / lane point / occluder under it
//   👻 ghost   — walks a test goblin down the lane (real renderer, real
//                occlusion, no targeting/lives/wave effects)
//   📋 export  — copies the full updated frontier-town.json to clipboard
//                (also printed to console), ready to paste over the file
// Every edit mutates FRONTIER_TOWN_JSON and re-runs tdInitWorldData, so
// path, slot cells, and facing re-derive live — what you see is exactly
// what the exported JSON will play like.
// ── Creator mode (one switch, two on-page toggles) ─────────────────
// Enter with ?dev=1 — the single editor entry point (the old ?author /
// ?dev split, then the transitional ?author / ?edit aliases, were retired
// 2026-07-17). On the battle screen a small toolbar then offers two
// independent chips:
//   🗺️ Map  — the map-authoring overlay + editors (drag slots / lanes /
//             occluders, ghost-walk, export frontier-town.json)
//   ⚙️ Tune — the tuning panel: gold cheat, wave clear, FPS, live
//             enemy-speed / tower-damage sliders, 📋 multipliers, and the
//             🏺 relic editor (export config.json)
// Neither is on until tapped, so entering Creator Mode no longer commits
// you to one toolset. Both can be on at once. The 99999 testing purse
// applies whenever Creator Mode is on (see persistedGold in
// showTowerDefenseScreen), independent of which chips are active.
const TD_CREATOR_MODE = typeof location !== 'undefined' &&
  new URLSearchParams(location.search).has('dev');
// Runtime toggles, driven by the creator toolbar; reset per battle.
let tdMapToolsOn = false;  // map-authoring overlay + editors (was ?author=1)
let tdTuningOn   = false;  // tuning panel: cheats/sliders/relics (was ?dev=1)

// The single Creator-Mode toolbar: ⬅ back plus two chips that toggle the
// map-authoring tools and the tuning panel independently. Built once per
// battle in initTDGame; the chips lazily build/tear down the two existing
// sub-panels (td-author-bar, td-dev-panel) so nothing is on until tapped.
function tdCreatorBuildToolbar() {
  const wrap = document.getElementById('td-canvas-wrap');
  if (!wrap) return;
  // Fresh battle → nothing enabled yet; drop any panels left in the DOM.
  tdMapToolsOn = false;
  tdTuningOn   = false;
  document.getElementById('td-author-bar')?.remove();
  document.getElementById('td-dev-panel')?.remove();
  document.getElementById('td-creator-bar')?.remove();

  const bar = document.createElement('div');
  bar.id = 'td-creator-bar';
  bar.className = 'td-creator-bar';
  bar.innerHTML =
    `<button class="td-author-btn" data-act="back" title="Back to the region map">⬅</button>` +
    `<button class="td-author-btn" data-tog="map"  title="Map tools — drag slots / lanes / occluders, ghost-walk, export frontier-town.json">🗺️</button>` +
    `<button class="td-author-btn" data-tog="tune" title="Tuning — gold / wave cheats, live sliders, relic editor, export config.json">⚙️</button>`;
  wrap.appendChild(bar);

  const sync = () => {
    bar.querySelector('[data-tog="map"]').classList.toggle('active', tdMapToolsOn);
    bar.querySelector('[data-tog="tune"]').classList.toggle('active', tdTuningOn);
  };
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.act === 'back') { showTDWorldMap(); return; }
    if (b.dataset.tog === 'map') {
      tdMapToolsOn = !tdMapToolsOn;
      if (tdMapToolsOn) tdAuthorBuildToolbar();
      else document.getElementById('td-author-bar')?.remove();
    } else if (b.dataset.tog === 'tune') {
      tdTuningOn = !tdTuningOn;
      if (tdTuningOn) tdDevBuildPanel();
      else document.getElementById('td-dev-panel')?.remove();
    }
    sync();
  });
  sync();
}

function tdDevBuildPanel() {
  const wrap = document.getElementById('td-canvas-wrap');
  if (!wrap) return;
  document.getElementById('td-dev-panel')?.remove();
  td.__devMods = { enemySpeed: 1, towerDmg: 1 };
  const panel = document.createElement('div');
  panel.id = 'td-dev-panel';
  panel.className = 'td-dev-panel';
  panel.innerHTML =
    `<div class="td-dev-row">
       <button data-act="gold" title="+500 gold">+500🪙</button>
       <button data-act="wave" title="Clear the wave: kills every enemy, empties the spawn queue">☠️ wave</button>
       <span class="td-dev-val" id="td-dev-fps">–</span>
     </div>
     <div class="td-dev-row" title="Enemy speed multiplier (live)">🐌
       <input type="range" data-mod="enemySpeed" min="0.25" max="2.5" step="0.05" value="1">
       <span class="td-dev-val" data-val="enemySpeed">1.00</span>
     </div>
     <div class="td-dev-row" title="Tower damage multiplier (live)">⚔️
       <input type="range" data-mod="towerDmg" min="0.25" max="3" step="0.05" value="1">
       <span class="td-dev-val" data-val="towerDmg">1.00</span>
     </div>
     <div class="td-dev-row">
       <button data-act="copy" title="Copy current multipliers as JSON — fold the keepers into config.json">📋 multipliers</button>
       <button data-act="relics" title="Relic editor: add/remove/tune relics, then export config.json">🏺 relics</button>
     </div>`;
  wrap.appendChild(panel);
  panel.addEventListener('input', e => {
    const mod = e.target.dataset && e.target.dataset.mod;
    if (!mod) return;
    td.__devMods[mod] = parseFloat(e.target.value);
    panel.querySelector(`[data-val="${mod}"]`).textContent = td.__devMods[mod].toFixed(2);
  });
  panel.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.stopPropagation();
    if (btn.dataset.act === 'back') { showTDWorldMap(); return; }
    if (btn.dataset.act === 'gold') { td.gold += 500; tdUpdateHUD(); }
    else if (btn.dataset.act === 'wave') { td.spawnQueue = []; td.enemies.forEach(en => { en.hp = 0; }); }
    else if (btn.dataset.act === 'copy') {
      const txt = JSON.stringify({
        devEnemySpeedMult: td.__devMods.enemySpeed,
        devTowerDmgMult: td.__devMods.towerDmg,
      }, null, 2);
      console.log(txt);
      tdAuthorCopy(txt, ok => { btn.textContent = ok ? '✓ copied' : '⚠ see console'; setTimeout(() => { btn.textContent = '📋 multipliers'; }, 1400); });
    }
    else if (btn.dataset.act === 'relics') { tdOpenRelicEditor(); }
  });
}

// ── Relic editor (?dev=1) ──────────────────────────────────────
// Same edit-then-export loop as the map editors: tweak relics in-app
// (changes apply live to TD_RELICS, so the next battle uses them), then 📋
// exports the FULL updated config.json for pasting over
// learn/drill/config.json. Relic ids are immutable — saved owned/equipped
// sets reference them; rename via the Name field instead.
const TD_RELIC_EFFECT_TYPES = [
  ['kill-gold-mult',    'Kill gold ×'],
  ['tower-dmg-mult',    'Tower damage ×'],
  ['boss-dmg-mult',     'Boss damage ×'],
  ['start-gold-add',    'Start gold +'],
  ['max-lives-add',     'Max lives +'],
  ['tower-rate-mult',   'Fire rate ×'],
  ['tower-range-mult',  'Range ×'],
  ['splash-mult',       'Splash radius ×'],
  ['enemy-speed-mult',  'Enemy speed ×'],
  ['build-cost-mult',   'Build cost ×'],
  ['upgrade-cost-mult', 'Upgrade cost ×'],
  ['wave-gold-add',     'Wave-clear gold +'],
  ['interest-rate',     'Wave-clear interest (0–1)'],
  ['wave-life-add',     'Wave-clear lives +'],
  ['quiz-gold-mult',    'Question gold ×'],
  ['quiz-uses-add',     'Questions/wave +'],
  ['armor-pierce',      'Armor pierce (1 = on)'],
];
const TD_RELIC_RARITIES = ['common', 'uncommon', 'rare', 'legendary'];

function tdRelicEditorExportConfig() {
  // Make sure every category used by a relic has a display label.
  for (const r of TD_RELICS) {
    if (!TD_RELIC_CATEGORIES[r.category]) {
      TD_RELIC_CATEGORIES[r.category] =
        r.category.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  return JSON.stringify(TD_CONFIG, null, 2) + '\n';
}

function tdOpenRelicEditor() {
  document.getElementById('td-relic-editor')?.remove();
  const ov = document.createElement('div');
  ov.id = 'td-relic-editor';
  ov.className = 'tre-overlay';

  // Toolbar state lives in this closure so it survives renderList() calls
  // (search/filter/sort/view-toggle) without needing to touch TD_RELICS or
  // rebuild the header — that split is what keeps the search box focused
  // while typing (see renderList vs renderHeader below).
  let treSearch = '';
  let treCategoryFilter = 'all';
  let treSort = 'name';
  let treView = 'grid';

  // One unified swatch for both layouts: real sprite art if config.json
  // set one, else the emoji fallback — same logic as every other relic
  // render site (tdRelicIconHtml), just wrapped for consistent sizing.
  // No longer an editable field in the header; icon editing (rarely
  // needed now that 18/20 relics have real art) moved into the Icon
  // field down in the details.
  function artSwatch(r) {
    const tip = r.img ? 'Sprite art on file' : 'No art yet — emoji fallback shown in-game';
    return `<span class="tre-art-swatch" title="${tip}">${tdRelicIconHtml(r)}</span>`;
  }

  function relicCard(r, i) {
    const effOpts = TD_RELIC_EFFECT_TYPES.map(([t, label]) =>
      `<option value="${t}" ${r.effect.type === t ? 'selected' : ''}>${label}</option>`).join('');
    const rarOpts = TD_RELIC_RARITIES.map(x =>
      `<option value="${x}" ${r.rarity === x ? 'selected' : ''}>${x}</option>`).join('');
    // Accent color, same grammar as the player vault grid. Computed once
    // at render time — editing the Category field live doesn't re-color
    // the stripe until the next full render; acceptable for a cosmetic
    // accent on a rarely-renamed field.
    const group = tdRelicCategoryGroup(r.category);
    return `
    <div class="tre-card group-${group}" data-idx="${i}">
      <div class="tre-card-head">
        ${artSwatch(r)}
        <input class="tre-name" data-field="name" value="${r.name.replace(/"/g, '&quot;')}" aria-label="Name">
        <button class="tre-del" data-del="${i}" title="Delete relic">🗑</button>
      </div>
      <div class="tre-grid">
        <label>Category <input data-field="category" value="${r.category}" list="tre-cats"></label>
        <label>Rarity <select data-field="rarity">${rarOpts}</select></label>
        <label>Upkeep 🪙/node <input data-field="upkeep" type="number" min="0" step="1" value="${r.upkeep}"></label>
        <label>Starter <input data-field="starter" type="checkbox" ${r.starter ? 'checked' : ''}></label>
        <label>Effect <select data-field="effect.type">${effOpts}</select></label>
        <label>Value <input data-field="effect.value" type="number" step="0.01" value="${r.effect.value}"></label>
        <label class="tre-wide">Description <input data-field="desc" value="${r.desc.replace(/"/g, '&quot;')}"></label>
        <label class="tre-wide tre-icon-field">Icon (emoji fallback, used only without art above) <input data-field="icon" value="${r.icon}" maxlength="4"></label>
      </div>
      <div class="tre-id">id: ${r.id}</div>
    </div>`;
  }

  // Compact single-row-per-relic power view — same data-field contract as
  // relicCard so the one delegated input/delete listeners below work for
  // both layouts unchanged. Icon editing is grid-view-only (list rows are
  // already tight); description loses its label in favor of a placeholder.
  function relicRow(r, i) {
    const effOpts = TD_RELIC_EFFECT_TYPES.map(([t, label]) =>
      `<option value="${t}" ${r.effect.type === t ? 'selected' : ''}>${label}</option>`).join('');
    const rarOpts = TD_RELIC_RARITIES.map(x =>
      `<option value="${x}" ${r.rarity === x ? 'selected' : ''}>${x}</option>`).join('');
    const group = tdRelicCategoryGroup(r.category);
    return `
    <div class="tre-card tre-row group-${group}" data-idx="${i}" title="id: ${r.id}">
      ${artSwatch(r)}
      <input class="tre-row-field tre-row-name" data-field="name" value="${r.name.replace(/"/g, '&quot;')}" aria-label="Name">
      <input class="tre-row-field tre-row-cat" data-field="category" value="${r.category}" list="tre-cats" aria-label="Category">
      <select class="tre-row-field tre-row-rarity" data-field="rarity" aria-label="Rarity">${rarOpts}</select>
      <input class="tre-row-field tre-row-num" data-field="upkeep" type="number" min="0" step="1" value="${r.upkeep}" aria-label="Upkeep" title="Upkeep 🪙/node">
      <label class="tre-row-starter" title="Starter relic"><input type="checkbox" data-field="starter" ${r.starter ? 'checked' : ''}> ⭐</label>
      <select class="tre-row-field tre-row-effect" data-field="effect.type" aria-label="Effect">${effOpts}</select>
      <input class="tre-row-field tre-row-num" data-field="effect.value" type="number" step="0.01" value="${r.effect.value}" aria-label="Value">
      <input class="tre-row-field tre-row-desc" data-field="desc" value="${r.desc.replace(/"/g, '&quot;')}" aria-label="Description" placeholder="Description">
      <button class="tre-del" data-del="${i}" title="Delete relic">🗑</button>
    </div>`;
  }

  const SORTERS = {
    name:         (a, b) => a.r.name.localeCompare(b.r.name),
    category:     (a, b) => a.r.category.localeCompare(b.r.category) || a.r.name.localeCompare(b.r.name),
    rarity:       (a, b) => (TD_RARITY_ORDER[a.r.rarity] ?? 0) - (TD_RARITY_ORDER[b.r.rarity] ?? 0) || a.r.name.localeCompare(b.r.name),
    'upkeep-asc': (a, b) => a.r.upkeep - b.r.upkeep || a.r.name.localeCompare(b.r.name),
    'upkeep-desc':(a, b) => b.r.upkeep - a.r.upkeep || a.r.name.localeCompare(b.r.name),
  };

  // Filters/sorts a DISPLAY view without touching TD_RELICS order — each
  // entry keeps its original index (i) so data-idx still resolves to the
  // right TD_RELICS entry for the shared edit/delete handlers regardless
  // of how the list is currently sorted or filtered.
  function visibleEntries() {
    const q = treSearch.trim().toLowerCase();
    let entries = TD_RELICS.map((r, i) => ({ r, i }));
    if (treCategoryFilter !== 'all') entries = entries.filter(e => e.r.category === treCategoryFilter);
    if (q) entries = entries.filter(e => e.r.name.toLowerCase().includes(q) || e.r.id.toLowerCase().includes(q));
    entries.sort(SORTERS[treSort] || SORTERS.name);
    return entries;
  }

  // Rebuilds ONLY the card/row list — called on every search keystroke and
  // filter/sort/view change, so it must never touch the header DOM (that
  // would destroy and recreate the search input, killing focus mid-type).
  function renderList() {
    const listEl = ov.querySelector('#tre-list');
    if (!listEl) return;
    const entries = visibleEntries();
    listEl.className = `tre-list view-${treView}`;
    listEl.innerHTML = entries.length
      ? entries.map(({ r, i }) => (treView === 'list' ? relicRow(r, i) : relicCard(r, i))).join('')
      : `<div class="tre-empty">No relics match${treSearch ? ` "${treSearch}"` : ''}${treCategoryFilter !== 'all' ? ` in ${TD_RELIC_CATEGORIES[treCategoryFilter] || treCategoryFilter}` : ''}.</div>`;
    listEl.querySelectorAll('.tre-del').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.del, 10);
      const r = TD_RELICS[idx];
      if (!r || !confirm(`Delete relic "${r.name}"?`)) return;
      TD_RELICS.splice(idx, 1);
      tdOwnedRelics.delete(r.id); tdEquippedRelics.delete(r.id);
      saveGameState();
      renderHeader(); // count + category options may have changed
    }));
  }

  // Full rebuild: title count, category filter/datalist options, toolbar
  // state, then the list. Only called on open/add/delete — anything that
  // fires per-keystroke (search) or per-selection (filter/sort/view) calls
  // renderList() alone so the toolbar controls never lose focus/state.
  function renderHeader() {
    const cats = [...new Set([...Object.keys(TD_RELIC_CATEGORIES), ...TD_RELICS.map(r => r.category)])].sort();
    ov.innerHTML = `
      <div class="tre-head">
        <span class="tre-title">🏺 Relic Editor · ${TD_RELICS.length}</span>
        <div class="tre-toolbar">
          <input id="tre-search" class="tre-toolbar-search" type="search" placeholder="Search relics…" value="${treSearch.replace(/"/g, '&quot;')}" aria-label="Search relics">
          <select id="tre-filter-cat" class="tre-toolbar-select" title="Filter by category" aria-label="Filter by category">
            <option value="all">All categories</option>
            ${cats.map(c => `<option value="${c}" ${treCategoryFilter === c ? 'selected' : ''}>${TD_RELIC_CATEGORIES[c] || c}</option>`).join('')}
          </select>
          <select id="tre-sort" class="tre-toolbar-select" title="Sort by" aria-label="Sort by">
            <option value="name" ${treSort === 'name' ? 'selected' : ''}>Name (A–Z)</option>
            <option value="category" ${treSort === 'category' ? 'selected' : ''}>Item type</option>
            <option value="rarity" ${treSort === 'rarity' ? 'selected' : ''}>Rarity</option>
            <option value="upkeep-asc" ${treSort === 'upkeep-asc' ? 'selected' : ''}>Cost (low → high)</option>
            <option value="upkeep-desc" ${treSort === 'upkeep-desc' ? 'selected' : ''}>Cost (high → low)</option>
          </select>
          <div class="tre-view-toggle" role="group" aria-label="Layout">
            <button class="tre-view-btn ${treView === 'grid' ? 'active' : ''}" data-view="grid" title="Grid — 3 columns">▦</button>
            <button class="tre-view-btn ${treView === 'list' ? 'active' : ''}" data-view="list" title="List — one row per relic">☰</button>
          </div>
        </div>
        <div class="tre-head-actions">
          <button id="tre-add">＋ Add</button>
          <button id="tre-export">📋 config.json</button>
          <button id="tre-close">✕</button>
        </div>
      </div>
      <div class="tre-note">Edits apply from the next battle. 📋 copies the full config.json — paste it over learn/drill/config.json and push.</div>
      <datalist id="tre-cats">${cats.map(c => `<option value="${c}">`).join('')}</datalist>
      <div class="tre-list view-${treView}" id="tre-list"></div>`;

    ov.querySelector('#tre-close').addEventListener('click', () => ov.remove());
    ov.querySelector('#tre-add').addEventListener('click', () => {
      let n = TD_RELICS.length + 1, id = `new_relic_${n}`;
      while (TD_RELICS.some(r => r.id === id)) id = `new_relic_${++n}`;
      TD_RELICS.push({ id, name: 'New Relic', icon: '🏺', category: 'gold', rarity: 'common',
        upkeep: 0, desc: 'Describe the effect', effect: { type: 'kill-gold-mult', value: 1.1 } });
      renderHeader();
      ov.querySelector('.tre-list').lastElementChild?.scrollIntoView({ block: 'center' });
    });
    ov.querySelector('#tre-export').addEventListener('click', e => {
      const btn = e.currentTarget;
      tdAuthorCopy(tdRelicEditorExportConfig(), ok => {
        btn.textContent = ok ? '✓ copied' : '⚠ see console';
        if (!ok) console.log(tdRelicEditorExportConfig());
        setTimeout(() => { btn.textContent = '📋 config.json'; }, 1600);
      });
    });
    ov.querySelector('#tre-search').addEventListener('input', e => { treSearch = e.target.value; renderList(); });
    ov.querySelector('#tre-filter-cat').addEventListener('change', e => { treCategoryFilter = e.target.value; renderList(); });
    ov.querySelector('#tre-sort').addEventListener('change', e => { treSort = e.target.value; renderList(); });
    ov.querySelectorAll('.tre-view-btn').forEach(b => b.addEventListener('click', () => {
      treView = b.dataset.view;
      ov.querySelectorAll('.tre-view-btn').forEach(x => x.classList.toggle('active', x.dataset.view === treView));
      renderList();
    }));

    renderList();
  }

  // One delegated listener writes edits straight into the relic objects
  // (TD_RELICS === TD_CONFIG.relics, so the export sees them immediately).
  // Works unchanged for both relicCard and relicRow markup since both use
  // the same .tre-card[data-idx] + [data-field] contract.
  ov.addEventListener('input', e => {
    const el = e.target;
    const card = el.closest('.tre-card');
    const field = el.dataset && el.dataset.field;
    if (!card || !field) return;
    const r = TD_RELICS[parseInt(card.dataset.idx, 10)];
    if (!r) return;
    if (field === 'starter')            { if (el.checked) r.starter = true; else delete r.starter; }
    else if (field === 'upkeep')        r.upkeep = Math.max(0, parseInt(el.value, 10) || 0);
    else if (field === 'effect.value')  r.effect.value = parseFloat(el.value) || 0;
    else if (field === 'effect.type')   r.effect.type = el.value;
    else if (field === 'category')      r.category = el.value.trim() || r.category;
    else                                r[field] = el.value;
  });

  renderHeader();
  document.body.appendChild(ov);
}

let __tdDevFrames = 0, __tdDevFpsTs = 0;
function tdDevTickFps(ts) {
  __tdDevFrames++;
  if (ts - __tdDevFpsTs >= 500) {
    const el = document.getElementById('td-dev-fps');
    if (el) el.textContent = Math.round(__tdDevFrames * 1000 / (ts - __tdDevFpsTs)) + 'fps';
    __tdDevFrames = 0;
    __tdDevFpsTs = ts;
  }
}

function tdRenderAuthorOverlay(ctx, cs, W, H) {
  if (!tdMapToolsOn || !td.bgSize) return;
  const kx = W / td.bgSize[0], ky = H / td.bgSize[1];
  const fs = Math.max(10, Math.round(cs * 0.24));
  ctx.save();
  ctx.font = `bold ${fs}px monospace`;
  ctx.textBaseline = 'bottom';

  ctx.strokeStyle = '#FBBF24AA'; ctx.lineWidth = 1.5;   // enemy lane
  const lane = td.levelDef.wpsExact;
  if (lane) {
    ctx.beginPath();
    lane.forEach(([gx, gy], i) => ctx[i ? 'lineTo' : 'moveTo'](gx * cs, gy * cs));
    ctx.stroke();
  }

  ctx.strokeStyle = '#FF3B30'; ctx.fillStyle = '#FF3B30'; ctx.lineWidth = 2;
  for (const poly of (td.occluders || [])) {
    ctx.beginPath();
    poly.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * kx, y * ky));
    ctx.closePath();
    ctx.stroke();
    ctx.fillText(`[${poly[0][0]},${poly[0][1]}] ${poly.length}pt`, poly[0][0] * kx, poly[0][1] * ky - 2);
  }

  ctx.strokeStyle = '#3B82F6'; ctx.fillStyle = '#60A5FA';
  (td.levelDef.buildSlots || []).forEach(([c, r], i) => {
    const ctr = td.slotCenterMap?.[`${c},${r}`];
    const [gx, gy] = ctr || [c + 0.5, r + 0.5];
    const px = gx * cs, py = gy * cs;
    ctx.beginPath(); ctx.arc(px, py, cs * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillText(`s${i + 1} [${Math.round(px / kx)},${Math.round(py / ky)}]`, px - cs * 0.5, py - cs * 0.5 - 2);
  });

  // Editable-map handles: lane points (orange), occluder corners (small
  // red squares). Slots already draw as blue rings above. The handle the
  // finger is currently dragging highlights white.
  if (tdAuthorEditable()) {
    const j = FRONTIER_TOWN_JSON, drag = td.__authorDrag;
    j.lanes[0].waypoints.forEach(([x, y], i) => {
      const on = drag && drag.kind === 'wp' && drag.i === i;
      ctx.beginPath(); ctx.arc(x * kx, y * ky, on ? 8 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#FFFFFF' : '#FB923C'; ctx.fill();
      ctx.strokeStyle = '#0008'; ctx.lineWidth = 1; ctx.stroke();
    });
    j.occluders.forEach((o, i) => {
      if (o.poly) {
        o.poly.forEach(([cx, cy], v) => {
          const on = drag && drag.kind === 'occ-vert' && drag.i === i && drag.v === v;
          ctx.fillStyle = on ? '#FFFFFF' : '#FF3B30';
          ctx.fillRect(cx * kx - (on ? 6 : 4), cy * ky - (on ? 6 : 4), on ? 12 : 8, on ? 12 : 8);
        });
        return;
      }
      const [x0, y0, x1, y1] = o.rect;
      [[x0, y0, 0], [x1, y0, 1], [x0, y1, 2], [x1, y1, 3]].forEach(([cx, cy, c]) => {
        const on = drag && drag.kind === 'occ-corner' && drag.i === i && drag.c === c;
        ctx.fillStyle = on ? '#FFFFFF' : '#FF3B30';
        ctx.fillRect(cx * kx - (on ? 6 : 4), cy * ky - (on ? 6 : 4), on ? 12 : 8, on ? 12 : 8);
      });
    });
  }

  if (td.__authorCursor) {
    const { px, py, ix, iy } = td.__authorCursor;
    ctx.strokeStyle = '#FFFFFF88'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    ctx.fillStyle = '#FFF'; ctx.fillText(`[${ix},${iy}]`, px + 6, py - 4);
  }
  ctx.fillStyle = '#0009';
  ctx.fillRect(0, 0, fs * 15, fs * 1.6 * (1 + (td.__authorClicks?.length || 0)));
  ctx.fillStyle = '#4ADE80'; ctx.textBaseline = 'top';
  const toolLbl = tdAuthorEditable()
    ? `AUTHOR ✎ ${td.__authorTool || 'move'} — see toolbar`
    : 'AUTHOR MODE — click to copy [x,y]';
  ctx.fillText(toolLbl, 4, 2);
  (td.__authorClicks || []).forEach((c, i) => {
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`[${c[0]},${c[1]}]`, 4, 2 + fs * 1.6 * (i + 1));
  });
  // Copy confirmation flash (~1.4s) beside the cursor/click point
  const cp = td.__authorCopied;
  if (cp && Date.now() < cp.until) {
    const cur = td.__authorCursor;
    const fx = cur ? cur.px + 8 : 4, fy = cur ? cur.py + fs : fs * 2;
    ctx.fillStyle = cp.ok ? '#4ADE80' : '#EF4444';
    ctx.fillText(cp.ok ? `✓ copied ${cp.txt}` : `⚠ copy failed — use console`, fx, fy);
  }
  ctx.restore();
}

// True when the current battle map's authoring JSON is loaded and the
// in-app editor can round-trip it (only Frontier Town has painted-map
// JSON today; procedural maps have nothing to edit).
function tdAuthorEditable() {
  return tdMapToolsOn && td && td.usesPaintedBg === 'frontier-town' && !!FRONTIER_TOWN_JSON;
}

// Clipboard write with the legacy hidden-textarea fallback (the Clipboard
// API rejects as a PROMISE — a sync try/catch never sees it). Shared by
// the coordinate probe and the JSON export.
function tdAuthorCopy(txt, flash) {
  const legacy = () => {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); flash(ok);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(txt).then(() => flash(true)).catch(legacy);
  } else legacy();
}

// Re-derive everything downstream of the authoring JSON after an edit:
// world globals via tdInitWorldData, then the live battle's levelDef and
// td state, so the change is visible (and playable) the same frame.
function tdAuthorApplyWorldEdits() {
  tdInitWorldData(VERDANT_REGION_JSON, FRONTIER_TOWN_JSON);
  const ld = td.levelDef;
  ld.wps         = FRONTIER_TOWN_WPS;
  ld.wpsExact    = FRONTIER_TOWN_WPS_EXACT;
  ld.occludersPx = FRONTIER_TOWN_MAP.occludersPx;
  ld.buildSlots  = FRONTIER_TOWN_SLOTS;
  ld.slotCenters = FRONTIER_TOWN_SLOT_CENTERS;
  ld.slotFacing  = FRONTIER_TOWN_SLOT_FACING;
  td.pathSet       = tdComputePathSet(ld.wps);
  td.buildSlotSet  = new Set(ld.buildSlots.map(([c, r]) => `${c},${r}`));
  td.slotCenterMap = ld.slotCenters;
  td.slotFacingMap = ld.slotFacing;
  td.occluders     = ld.occludersPx;
}

// Distance from point to segment, image-px space (for lane-point insertion).
function tdAuthorSegDist(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Nearest editable handle under an image-px point. Priority when radii
// overlap: whatever is closest wins across kinds; occluder BODY only hits
// when no handle was close enough (so corners stay grabbable inside rects).
function tdAuthorHitTest(ix, iy) {
  const j = FRONTIER_TOWN_JSON;
  let best = null, bestD = Infinity;
  const consider = (d, lim, hit) => { if (d <= lim && d < bestD) { bestD = d; best = hit; } };
  j.lanes[0].waypoints.forEach((p, i) =>
    consider(Math.hypot(ix - p[0], iy - p[1]), 30, { kind: 'wp', i }));
  j.buildSlots.forEach((s, i) =>
    consider(Math.hypot(ix - s.x, iy - s.y), 42, { kind: 'slot', i }));
  j.occluders.forEach((o, i) => {
    if (o.poly) {
      o.poly.forEach(([cx, cy], v) =>
        consider(Math.hypot(ix - cx, iy - cy), 30, { kind: 'occ-vert', i, v }));
      return;
    }
    const [x0, y0, x1, y1] = o.rect;
    [[x0, y0, 0], [x1, y0, 1], [x0, y1, 2], [x1, y1, 3]].forEach(([cx, cy, c]) =>
      consider(Math.hypot(ix - cx, iy - cy), 30, { kind: 'occ-corner', i, c }));
  });
  if (!best) {
    j.occluders.forEach((o, i) => {
      if (best) return;
      const inside = o.poly
        ? tdAuthorPointInPoly(ix, iy, o.poly)
        : (ix >= o.rect[0] && ix <= o.rect[2] && iy >= o.rect[1] && iy <= o.rect[3]);
      if (inside) best = { kind: 'occ-body', i };
    });
  }
  return best;
}

// Ray-cast point-in-polygon (image-px space).
function tdAuthorPointInPoly(px, py, poly) {
  let inside = false;
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const [xa, ya] = poly[a], [xb, yb] = poly[b];
    if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) inside = !inside;
  }
  return inside;
}

// An occluder's editable outline as a polygon regardless of storage form.
function tdAuthorOccPoly(o) {
  return o.poly || [
    [o.rect[0], o.rect[1]], [o.rect[2], o.rect[1]],
    [o.rect[2], o.rect[3]], [o.rect[0], o.rect[3]],
  ];
}

// One tap with a non-move tool active: add / insert / delete at the point.
function tdAuthorAct(tool, ix, iy) {
  const j = FRONTIER_TOWN_JSON;
  const wps = j.lanes[0].waypoints;
  if (tool === 'slot') {
    j.buildSlots.push({ id: 's' + (j.buildSlots.length + 1), x: ix, y: iy,
      pad: 'open', note: 'authored in-app' });
  } else if (tool === 'wp') {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < wps.length - 1; i++) {
      const d = tdAuthorSegDist(ix, iy, wps[i], wps[i + 1]);
      if (d < bd) { bd = d; bi = i; }
    }
    wps.splice(bi + 1, 0, [ix, iy]);
  } else if (tool === 'occl') {
    // Tap near an existing occluder's edge → insert a vertex there (the
    // path to non-rectangular shapes: a rect converts to a 4-point poly on
    // its first extra vertex, then every vertex drags freely). Tap on open
    // ground → new rect occluder.
    let edge = null;
    j.occluders.forEach((o, i) => {
      const poly = tdAuthorOccPoly(o);
      for (let s = 0; s < poly.length; s++) {
        const d = tdAuthorSegDist(ix, iy, poly[s], poly[(s + 1) % poly.length]);
        if (d <= 25 && (!edge || d < edge.d)) edge = { i, seg: s, d };
      }
    });
    if (edge) {
      const o = j.occluders[edge.i];
      if (!o.poly) { o.poly = tdAuthorOccPoly(o); delete o.rect; }
      o.poly.splice(edge.seg + 1, 0, [ix, iy]);
    } else {
      j.occluders.push({ id: 'occ-' + (j.occluders.length + 1),
        rect: [ix - 40, iy - 40, ix + 40, iy + 40] });
    }
  } else if (tool === 'del') {
    const hit = tdAuthorHitTest(ix, iy);
    if (!hit) return;
    if (hit.kind === 'wp') { if (wps.length > 2) wps.splice(hit.i, 1); }
    else if (hit.kind === 'slot') j.buildSlots.splice(hit.i, 1);
    else if (hit.kind === 'occ-vert' && j.occluders[hit.i].poly.length > 3) {
      // deleting a vertex keeps the shape; a triangle's vertex deletes the
      // whole occluder (a 2-point polygon can't occlude anything)
      j.occluders[hit.i].poly.splice(hit.v, 1);
    }
    else j.occluders.splice(hit.i, 1);
  }
  tdAuthorApplyWorldEdits();
}

// Walks a test goblin down the lane. Reuses the real spawner so the ghost
// matches live tuning (speed/scale mults) exactly, then reroutes it to the
// ghost list — rendered and moved like a real enemy, ignored by everything
// else (see tdUpdate / the depth-sorted world pass in tdRender).
function tdAuthorSpawnGhost() {
  if (!td || !td.levelDef) return;
  tdSpawnEnemy('goblin');
  const g = td.enemies.pop();
  g.__ghost = true;
  (td.__ghosts = td.__ghosts || []).push(g);
}

function tdAuthorExport() {
  const txt = JSON.stringify(FRONTIER_TOWN_JSON, null, 2) + '\n';
  console.log(txt);
  const flash = ok => {
    td.__authorCopied = { txt: 'frontier-town.json', ok, until: Date.now() + 2200 };
  };
  tdAuthorCopy(txt, flash);
}

function tdAuthorBuildToolbar() {
  const wrap = document.getElementById('td-canvas-wrap');
  if (!wrap) return;
  document.getElementById('td-author-bar')?.remove();
  const bar = document.createElement('div');
  bar.id = 'td-author-bar';
  bar.className = 'td-author-bar';
  const editable = tdAuthorEditable();
  const tools = [
    ['move', '✥',  'Move — drag slots, lane points, occluder corners/vertices'],
    ['slot', '⊕',  'Add build slot at tap'],
    ['wp',   '➜',  'Insert lane waypoint at tap'],
    ['occl', '▦',  'Add occluder rect at tap — tap an existing occluder\'s edge to insert a vertex (non-square shapes)'],
    ['del',  '✕',  'Delete slot / lane point / occluder (or one polygon vertex) at tap'],
  ];
  bar.innerHTML =
    (editable ? tools.map(([id, icon, title]) =>
      `<button class="td-author-btn" data-tool="${id}" title="${title}">${icon}</button>`).join('') : '') +
    `<button class="td-author-btn" data-act="ghost" title="Ghost-walk a test goblin down the lane">👻</button>` +
    (editable ? `<button class="td-author-btn" data-act="export" title="Copy updated frontier-town.json">📋</button>` : '');
  wrap.appendChild(bar);
  const sync = () => bar.querySelectorAll('[data-tool]').forEach(b =>
    b.classList.toggle('active', b.dataset.tool === (td.__authorTool || 'move')));
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.tool) { td.__authorTool = b.dataset.tool; sync(); }
    else if (b.dataset.act === 'back') showTDWorldMap();
    else if (b.dataset.act === 'ghost') tdAuthorSpawnGhost();
    else if (b.dataset.act === 'export') tdAuthorExport();
  });
  sync();
}

// Wires the author tools onto a freshly-built battle canvas. Called from
// initTDGame (before the gameplay click handler is registered) whenever
// Creator Mode is on; every handler additionally gates on tdMapToolsOn so
// nothing fires until the 🗺️ Map chip is tapped. For non-editable maps it
// degrades to the v1 probes: hover readout + tap-to-copy.
function tdAuthorInitEditor(canvas) {
  const toImg = e => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (!td.bgSize) return null;
    return { px, py,
      ix: Math.round(px * td.bgSize[0] / canvas.width),
      iy: Math.round(py * td.bgSize[1] / canvas.height) };
  };
  td.__authorTool = 'move';
  // Without this, touch-dragging a handle scrolls/zooms the page instead
  // of firing pointermove.
  canvas.style.touchAction = 'none';

  canvas.addEventListener('mousemove', e => { td.__authorCursor = toImg(e); });
  canvas.addEventListener('mouseleave', () => { td.__authorCursor = null; });

  // ── Drag handling (move tool) — pointer events cover mouse AND touch ──
  let drag = null, moved = false;
  canvas.addEventListener('pointerdown', e => {
    if (!tdAuthorEditable() || (td.__authorTool || 'move') !== 'move') return;
    const p = toImg(e);
    if (!p) return;
    const hit = tdAuthorHitTest(p.ix, p.iy);
    if (!hit) return;
    drag = { ...hit, lastX: p.ix, lastY: p.iy };
    moved = false;
    td.__authorDrag = drag;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toImg(e);
    if (!p) return;
    const dx = p.ix - drag.lastX, dy = p.iy - drag.lastY;
    if (!dx && !dy) return;
    drag.lastX = p.ix; drag.lastY = p.iy;
    moved = true;
    const j = FRONTIER_TOWN_JSON;
    if (drag.kind === 'wp') {
      const w = j.lanes[0].waypoints[drag.i]; w[0] += dx; w[1] += dy;
    } else if (drag.kind === 'slot') {
      const s = j.buildSlots[drag.i]; s.x += dx; s.y += dy;
    } else if (drag.kind === 'occ-vert') {
      const v = j.occluders[drag.i].poly[drag.v]; v[0] += dx; v[1] += dy;
    } else if (drag.kind === 'occ-corner') {
      const r = j.occluders[drag.i].rect;
      if (drag.c === 0 || drag.c === 2) r[0] += dx; else r[2] += dx;
      if (drag.c === 0 || drag.c === 1) r[1] += dy; else r[3] += dy;
      // keep the rect normalized (x0<x1, y0<y1) while crossing over
      if (r[0] > r[2]) { [r[0], r[2]] = [r[2], r[0]]; drag.c ^= 1; }
      if (r[1] > r[3]) { [r[1], r[3]] = [r[3], r[1]]; drag.c ^= 2; }
    } else if (drag.kind === 'occ-body') {
      const o = j.occluders[drag.i];
      if (o.poly) o.poly.forEach(v => { v[0] += dx; v[1] += dy; });
      else { const r = o.rect; r[0] += dx; r[2] += dx; r[1] += dy; r[3] += dy; }
    }
    tdAuthorApplyWorldEdits();
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    td.__authorDrag = null;
    // A real drag happened — swallow the click that follows pointerup so
    // it neither copies a coordinate nor opens the radial menu.
    if (moved) td.__authorClickBlockUntil = performance.now() + 350;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ── Click router (capture phase = runs before the probe + gameplay
  // listeners): swallow post-drag clicks; route non-move tools to
  // tdAuthorAct; let everything else fall through untouched. ──
  canvas.addEventListener('click', e => {
    if (performance.now() < (td.__authorClickBlockUntil || 0)) {
      // Consume-once: only the click synthesized by the drag's own
      // pointerup gets swallowed, never a fast follow-up tap.
      td.__authorClickBlockUntil = 0;
      e.stopImmediatePropagation(); e.preventDefault();
      return;
    }
    if (!tdAuthorEditable() || (td.__authorTool || 'move') === 'move') return;
    const p = toImg(e);
    if (!p) return;
    tdAuthorAct(td.__authorTool, p.ix, p.iy);
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);

  // ── v1 coordinate probe: tap-to-copy (bubble phase — anything the
  // editor consumed never reaches here). Only while Map tools are on, so
  // ordinary gameplay taps don't copy coordinates. ──
  canvas.addEventListener('click', e => {
    if (!tdMapToolsOn) return;
    const p = toImg(e);
    if (!p) return;
    td.__authorClicks = [[p.ix, p.iy], ...(td.__authorClicks || [])].slice(0, 5);
    console.log(`author click: [${p.ix},${p.iy}]`);
    const txt = `[${p.ix},${p.iy}]`;
    tdAuthorCopy(txt, ok => { td.__authorCopied = { txt, ok, until: Date.now() + 1400 }; });
  });
  // The author sub-toolbar is shown on demand by the 🗺️ Map chip
  // (tdCreatorBuildToolbar), not auto-opened here.
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
