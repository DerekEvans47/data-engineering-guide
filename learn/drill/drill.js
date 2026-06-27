'use strict';

// ── Storage keys ──────────────────────────────────────────────
const SEEN_KEY         = 'drill_seen_ids';
const FILTER_KEY       = 'drill_filter_parts';
const THEME_KEY        = 'drill_theme';
const MAP_KEY          = 'drill_map_state';
const RUN_KEY          = 'drill_run_state';
const DRILL_STATS_KEY  = 'drill_stats';
const LOADOUT_KEY      = 'drill_loadout';

// ── Global state ──────────────────────────────────────────────
let questions   = [];
let seen        = new Set();
let filterParts = new Set();
let currentQ    = null;
let streak      = 0;
let sessionCorrect = 0;
let sessionTotal   = 0;
let mode        = 'home';   // 'home' | 'quiz' | 'map' | 'run'
let currentMapNode = null;  // node currently being run
let runState    = null;     // persisted run progress

// ── Tower-defence state ───────────────────────────────────────
let td = null;   // TowerDefence instance

// ── DOM refs ──────────────────────────────────────────────────
const EL = {};

// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────
function $(id){ return document.getElementById(id); }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function saveRunState(){
  if(runState) localStorage.setItem(RUN_KEY, JSON.stringify(runState));
}

function loadRunState(){
  try{ return JSON.parse(localStorage.getItem(RUN_KEY)); }catch(e){ return null; }
}

function clearRunState(){
  localStorage.removeItem(RUN_KEY);
  runState = null;
}

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────
function loadSeen(){
  try{ seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY))||[]); }
  catch(e){ seen = new Set(); }
}
function saveSeen(){ localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); }

function loadFilter(){
  try{
    const stored = JSON.parse(localStorage.getItem(FILTER_KEY));
    filterParts = stored ? new Set(stored) : new Set();
  } catch(e){ filterParts = new Set(); }
}
function saveFilter(){ localStorage.setItem(FILTER_KEY, JSON.stringify([...filterParts])); }

// ─────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  if(EL.themeToggle) EL.themeToggle.textContent = t==='dark'?'☀️':'🌙';
}
function toggleTheme(){
  applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
}

// ─────────────────────────────────────────────────────────────
// Map
// ─────────────────────────────────────────────────────────────
const MAP_NODES = [
  { id:'n1',  part:1,  label:'Part 1',  x:10,  y:75 },
  { id:'n2',  part:2,  label:'Part 2',  x:25,  y:55 },
  { id:'n3',  part:3,  label:'Part 3',  x:40,  y:70 },
  { id:'n4',  part:4,  label:'Part 4',  x:55,  y:50 },
  { id:'n5',  part:5,  label:'Part 5',  x:70,  y:65 },
  { id:'n6',  part:6,  label:'Part 6',  x:85,  y:45 },
  { id:'n7',  part:7,  label:'Part 7',  x:15,  y:30 },
  { id:'n8',  part:8,  label:'Part 8',  x:30,  y:15 },
  { id:'n9',  part:9,  label:'Part 9',  x:50,  y:25 },
  { id:'n10', part:10, label:'Interview Prep', x:70, y:15 },
];

const MAP_EDGES = [
  ['n1','n2'],['n2','n3'],['n3','n4'],['n4','n5'],['n5','n6'],
  ['n2','n7'],['n7','n8'],['n8','n9'],['n9','n10'],
  ['n6','n10'],
];

function getNodeStatus(node){
  const all   = questions.filter(q=>q.part===node.part);
  const done  = all.filter(q=>seen.has(q.id));
  if(done.length===0)               return 'locked';
  if(done.length===all.length)      return 'done';
  return 'active';
}

function buildMap(){
  const wrap = EL.mapCanvas;
  wrap.innerHTML = '';

  // edges
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','map-svg');
  MAP_EDGES.forEach(([a,b])=>{
    const na=MAP_NODES.find(n=>n.id===a);
    const nb=MAP_NODES.find(n=>n.id===b);
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',na.x+'%'); line.setAttribute('y1',na.y+'%');
    line.setAttribute('x2',nb.x+'%'); line.setAttribute('y2',nb.y+'%');
    line.setAttribute('stroke','var(--border)'); line.setAttribute('stroke-width','2');
    svg.appendChild(line);
  });
  wrap.appendChild(svg);

  // Reset any stuck 'active' run nodes before rebuilding
  if(runState && runState.done){
    MAP_NODES.forEach(n => {
      const el = document.getElementById('node-'+n.id);
      if(el && el.classList.contains('run-active')){
        el.classList.remove('run-active');
      }
    });
  }

  // nodes
  MAP_NODES.forEach(node=>{
    const status = getNodeStatus(node);
    const div = document.createElement('div');
    div.className  = 'map-node '+status;
    div.id         = 'node-'+node.id;
    div.style.left = node.x+'%';
    div.style.top  = node.y+'%';

    const all  = questions.filter(q=>q.part===node.part);
    const done = all.filter(q=>seen.has(q.id));

    div.innerHTML = `
      <div class="node-icon">${statusIcon(status)}</div>
      <div class="node-label">${node.label}</div>
      <div class="node-progress">${done.length}/${all.length}</div>
    `;

    if(status!=='locked') div.addEventListener('click',()=>startRun(node));
    wrap.appendChild(div);
  });
}

function statusIcon(s){
  if(s==='done')   return '✅';
  if(s==='active') return '🔥';
  return '🔒';
}

// ─────────────────────────────────────────────────────────────
// Run mode  (quiz within a map node)
// ─────────────────────────────────────────────────────────────
function startRun(node){
  currentMapNode = node;

  // Restore or create run state
  const saved = loadRunState();
  if(saved && saved.nodeId===node.id){
    runState = saved;
  } else {
    const nodeQs = shuffle(questions.filter(q=>q.part===node.part));
    runState = { nodeId:node.id, queue:nodeQs.map(q=>q.id), idx:0, correct:0, hp:20, gold:0, done:false };
    saveRunState();
  }

  showRunMap();
}

function showRunMap(){
  mode = 'run';
  showScreen('run-map-screen');

  // Reset any stuck run-active classes before marking the current one
  document.querySelectorAll('.map-node.run-active').forEach(el => {
    el.classList.remove('run-active');
  });

  // Rebuild the mini-map
  buildMap();

  // Then highlight current node
  if(currentMapNode){
    const el = document.getElementById('node-'+currentMapNode.id);
    if(el) el.classList.add('run-active');
  }

  // Show wave preview
  renderWavePreview();

  // Start button
  EL.startWaveBtn.onclick = startWave;
}

function renderWavePreview(){
  if(!runState || runState.done){ EL.wavePreviewCard.style.display='none'; return; }

  // Count enemy types for this wave
  const waveQs = runState.queue.slice(runState.idx, runState.idx+5);
  const qs = waveQs.map(id=>questions.find(q=>q.id===id)).filter(Boolean);

  const typeCounts = {};
  qs.forEach(q=>{
    const t = enemyTypeForQuestion(q);
    typeCounts[t] = (typeCounts[t]||0)+1;
  });

  const parts = Object.entries(typeCounts).map(([t,c])=>`${c}× ${t}`).join(', ');
  EL.waveEnemyList.textContent = parts || 'No enemies';
  EL.wavePreviewCard.style.display = 'block';
}

function enemyTypeForQuestion(q){
  if(!q) return 'Minion';
  const type = (q.type||'').toLowerCase();
  if(type==='definition')   return 'Grunt';
  if(type==='scenario')     return 'Brute';
  if(type==='code')         return 'Mage';
  if(type==='multi-select') return 'Swarm';
  return 'Minion';
}

// ─────────────────────────────────────────────────────────────
// Wave / TD  
// ─────────────────────────────────────────────────────────────
function startWave(){
  if(!runState || runState.done) return;

  // Hide wave preview once the wave actually starts
  EL.wavePreviewCard.style.display = 'none';

  mode = 'run';
  showScreen('quiz-screen');
  loadQuestion();
}

function completeWave(allCorrect){
  if(!runState) return;

  const waveSize = 5;
  runState.idx += waveSize;
  if(runState.idx >= runState.queue.length) runState.done = true;

  const goldEarned = allCorrect ? 30 : 15;
  runState.gold += goldEarned;
  saveRunState();

  if(runState.done){
    showRunComplete();
  } else {
    showRunMap();
  }
}

function showRunComplete(){
  showScreen('run-complete-screen');
  EL.runCompleteMsg.textContent =
    `Node cleared! +${runState.gold} gold earned. HP remaining: ${runState.hp}`;
  clearRunState();
}

// ─────────────────────────────────────────────────────────────
// Question engine
// ─────────────────────────────────────────────────────────────
function pickQuestion(){
  const pool = questions.filter(q=>{
    if(filterParts.size>0 && !filterParts.has(q.part)) return false;
    return !seen.has(q.id);
  });
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}

function loadQuestion(){
  if(mode==='run' && runState){
    // Run mode: pull from queue
    const idx  = runState.idx;
    const queue = runState.queue;
    if(idx >= queue.length){ showRunComplete(); return; }
    const qId = queue[idx];
    currentQ  = questions.find(q=>q.id===qId);
    if(!currentQ){ runState.idx++; saveRunState(); loadQuestion(); return; }
  } else {
    currentQ = pickQuestion();
    if(!currentQ){ showEmptyState(); return; }
  }
  renderQuestion(currentQ);
}

function renderQuestion(q){
  showScreen('quiz-screen');

  EL.questionText.textContent  = q.question;
  EL.partBadge.textContent     = 'Part '+q.part;
  EL.typeBadge.textContent     = q.type||'MCQ';
  EL.explanation.style.display = 'none';
  EL.nextBtn.style.display     = 'none';
  EL.feedback.className        = 'feedback';
  EL.feedback.style.display    = 'none';

  // Determine if multi-select
  const isMulti = (q.type||'').toLowerCase()==='multi-select';

  EL.answersGrid.innerHTML = '';
  const opts = shuffle([...q.options]);
  opts.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className   = 'answer-btn';
    btn.textContent = opt;
    if(isMulti){
      btn.addEventListener('click',()=>btn.classList.toggle('selected'));
    } else {
      btn.addEventListener('click',()=>handleAnswer(opt, q));
    }
    EL.answersGrid.appendChild(btn);
  });

  if(isMulti){
    const submitBtn = document.createElement('button');
    submitBtn.className   = 'submit-multi-btn';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click',()=>{
      const selected = [...EL.answersGrid.querySelectorAll('.answer-btn.selected')]
                        .map(b=>b.textContent);
      handleMultiAnswer(selected, q);
    });
    EL.answersGrid.appendChild(submitBtn);
  }

  // Code block
  if(q.code){
    EL.codeBlock.textContent = q.code;
    EL.codeBlock.style.display = 'block';
    if(window.Prism) Prism.highlightElement(EL.codeBlock);
  } else {
    EL.codeBlock.style.display='none';
  }
}

function handleAnswer(chosen, q){
  const correct = chosen === q.answer;
  showAnswerFeedback(correct, q);
  markSeen(q, correct);
}

function handleMultiAnswer(chosen, q){
  const correct_set = new Set(Array.isArray(q.answer)?q.answer:[q.answer]);
  const chosen_set  = new Set(chosen);
  const correct = chosen_set.size===correct_set.size &&
                  [...chosen_set].every(c=>correct_set.has(c));
  showAnswerFeedback(correct, q);
  markSeen(q, correct);
}

function markSeen(q, wasCorrect){
  seen.add(q.id);
  saveSeen();
  sessionTotal++;
  if(wasCorrect){
    streak++; sessionCorrect++;
    if(mode==='run' && runState){ runState.correct++; }
  } else {
    streak = 0;
  }
  if(mode==='run' && runState){ runState.idx++; saveRunState(); }
  updateStats();
}

function showAnswerFeedback(correct, q){
  const btns = EL.answersGrid.querySelectorAll('.answer-btn');
  btns.forEach(btn=>{
    const isCorrect = Array.isArray(q.answer)
      ? q.answer.includes(btn.textContent)
      : btn.textContent===q.answer;
    btn.classList.add(isCorrect?'correct':'wrong');
    btn.disabled=true;
  });

  EL.feedback.className        = 'feedback '+(correct?'correct':'wrong');
  EL.feedback.textContent      = correct?'✅ Correct!':'❌ Wrong';
  EL.feedback.style.display    = 'block';
  EL.explanation.textContent   = q.explanation||'';
  EL.explanation.style.display = 'block';
  EL.nextBtn.style.display     = 'block';
}

function showEmptyState(){
  showScreen('empty-screen');
}

function nextQuestion(){
  if(mode==='run' && runState){
    const waveSize = 5;
    const waveStart = Math.floor((runState.idx-1)/waveSize)*waveSize;
    if(runState.idx >= waveStart+waveSize || runState.idx >= runState.queue.length){
      const allCorrect = runState.correct >= waveSize;
      completeWave(allCorrect);
      return;
    }
  }
  loadQuestion();
}

// ─────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────
function updateStats(){
  const total = questions.length;
  const done  = seen.size;
  const pct   = total?Math.round(done/total*100):0;

  if(EL.progressFill)  EL.progressFill.style.width = pct+'%';
  if(EL.progressText)  EL.progressText.textContent  = `${done}/${total} (${pct}%)`;
  if(EL.streakCount)   EL.streakCount.textContent   = streak;
  if(EL.sessionScore)  EL.sessionScore.textContent  = `${sessionCorrect}/${sessionTotal}`;
}

// ─────────────────────────────────────────────────────────────
// Screen management
// ─────────────────────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');
}

// ─────────────────────────────────────────────────────────────
// Filter drawer
// ─────────────────────────────────────────────────────────────
function buildFilterDrawer(){
  EL.filterList.innerHTML = '';
  const parts = [...new Set(questions.map(q=>q.part))].sort((a,b)=>a-b);
  parts.forEach(p=>{
    const label = document.createElement('label');
    label.className = 'filter-item';
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.value   = p;
    cb.checked = filterParts.size===0 || filterParts.has(p);
    cb.addEventListener('change',()=>{
      if(cb.checked) filterParts.add(p);
      else           filterParts.delete(p);
      saveFilter();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' Part '+p));
    EL.filterList.appendChild(label);
  });
}

// ─────────────────────────────────────────────────────────────
// Tower Defence mini-game
// ─────────────────────────────────────────────────────────────

// ── Sprite sheets (data-URIs replaced at build time, placeholders here) ──
const SPRITES = {
  tower:  null,   // 32×32 tower tile
  enemy:  null,   // 32×32 enemy sprite
  bullet: null,   // 8×8 bullet
};

// ── Layout constants ──────────────────────────────────────────────────────
const COLS   = 20;
const ROWS   = 14;
const CELL   = 40;   // px per grid cell
const W      = COLS * CELL;   // 800
const H      = ROWS * CELL;   // 560

// Enemy path (grid coords, left→right across the canvas)
const PATH = [
  {x:0, y:6},{x:1,y:6},{x:2,y:6},{x:3,y:6},{x:4,y:6},
  {x:4,y:7},{x:4,y:8},{x:4,y:9},
  {x:5,y:9},{x:6,y:9},{x:7,y:9},{x:8,y:9},
  {x:8,y:8},{x:8,y:7},{x:8,y:6},{x:8,y:5},{x:8,y:4},
  {x:9,y:4},{x:10,y:4},{x:11,y:4},{x:12,y:4},
  {x:12,y:5},{x:12,y:6},{x:12,y:7},{x:12,y:8},{x:12,y:9},
  {x:13,y:9},{x:14,y:9},{x:15,y:9},{x:16,y:9},
  {x:16,y:8},{x:16,y:7},{x:16,y:6},{x:16,y:5},
  {x:17,y:5},{x:18,y:5},{x:19,y:5},
];

// Cells that are part of the path (set for fast lookup)
const PATH_SET = new Set(PATH.map(p=>`${p.x},${p.y}`));

const TOWER_TYPES = {
  basic:  { name:'Basic',   cost:50,  dmg:20, range:2, rate:60,  color:'#4a9eff', radius:15 },
  sniper: { name:'Sniper',  cost:100, dmg:60, range:5, rate:120, color:'#9b59b6', radius:15 },
  rapid:  { name:'Rapid',   cost:75,  dmg:10, range:2, rate:20,  color:'#e67e22', radius:15 },
  splash: { name:'Splash',  cost:125, dmg:30, range:3, rate:90,  color:'#e74c3c', radius:15, splash:true },
};

class TowerDefence {
  constructor(canvas, onWaveEnd){
    this.canvas     = canvas;
    this.ctx        = canvas.getContext('2d');
    this.onWaveEnd  = onWaveEnd;  // callback(survived:bool)

    canvas.width  = W;
    canvas.height = H;

    this.gold       = 150;
    this.hp         = runState ? runState.hp : 20;
    this.towers     = [];
    this.enemies    = [];
    this.bullets    = [];
    this.frame      = 0;
    this.waveActive = false;
    this.selectedTowerType = 'basic';
    this.floatLabels = [];
    this.pendingEnemies = [];   // enemies queued for this wave
    this.spawnIdx   = 0;
    this.spawnTimer = 0;

    this.inspectTower = null;   // tower being inspected
    this.tutorialStep = 0;      // 0 = not shown, 1..N = step index
    this.tutorialDone = false;

    this._raf = null;
    this._boundLoop = this._loop.bind(this);

    this._setupInput();
    this._setupTowerBtns();
    this._startTutorial();
    this._render();
  }

  // ── Tutorial ────────────────────────────────────────────────
  _startTutorial(){
    if(localStorage.getItem('td_tutorial_done')) { this.tutorialDone=true; return; }
    this.tutorialStep = 1;
    this._showTutorialStep();
  }

  _showTutorialStep(){
    const steps = [
      null,   // 0-indexed padding
      'Welcome to Quiz Defense! Answer questions correctly to earn gold and damage enemies.',
      'Click an empty cell (not on the path) to place a tower. Select tower type on the right.',
      'Towers automatically shoot enemies that enter their range.',
      'Enemies that reach the exit cost you HP. Survive the wave!',
      null,   // sentinel: tutorial complete
    ];
    const msg = steps[this.tutorialStep];
    const overlay = document.getElementById('td-tutorial-overlay');
    const text    = document.getElementById('td-tutorial-text');
    if(!overlay||!text) return;
    if(!msg){
      overlay.style.display='none';
      this.tutorialDone=true;
      localStorage.setItem('td_tutorial_done','1');
      return;
    }
    overlay.style.display='flex';
    text.textContent = msg;
  }

  advanceTutorial(){
    if(this.tutorialDone) return;
    this.tutorialStep++;
    this._showTutorialStep();
  }

  // ── Input ────────────────────────────────────────────────────
  _setupInput(){
    this.canvas.addEventListener('click', e=>{
      if(!this.tutorialDone){ this.advanceTutorial(); return; }
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const cx = Math.floor((e.clientX - rect.left)*scaleX / CELL);
      const cy = Math.floor((e.clientY - rect.top )*scaleY / CELL);

      // Check if clicking an existing tower → inspect
      const existing = this.towers.find(t=>t.cx===cx&&t.cy===cy);
      if(existing){
        this.inspectTower = (this.inspectTower===existing) ? null : existing;
        this._updateInspectCard();
        return;
      }
      this.inspectTower = null;
      this._updateInspectCard();

      if(PATH_SET.has(`${cx},${cy}`)) return;   // can't build on path
      if(this.towers.find(t=>t.cx===cx&&t.cy===cy)) return;

      const type = TOWER_TYPES[this.selectedTowerType];
      if(this.gold < type.cost){ this._flash('Not enough gold!'); return; }

      this.gold -= type.cost;
      this.towers.push({ cx,cy, type:this.selectedTowerType, ...type, cooldown:0, totalDmg:0, kills:0 });
      this._updateHUD();
    });
  }

  _setupTowerBtns(){
    Object.keys(TOWER_TYPES).forEach(key=>{
      const btn = document.getElementById('td-tower-'+key);
      if(!btn) return;
      btn.addEventListener('click',()=>{
        this.selectedTowerType = key;
        document.querySelectorAll('.td-tower-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
    // Default selection
    const def = document.getElementById('td-tower-basic');
    if(def) def.classList.add('selected');
  }

  // ── Tower inspect card ───────────────────────────────────────
  _updateInspectCard(){
    const card = document.getElementById('td-inspect-card');
    if(!card) return;
    if(!this.inspectTower){ card.style.display='none'; return; }
    const t = this.inspectTower;
    card.style.display = 'block';
    const nameEl  = document.getElementById('td-inspect-name');
    const statsEl = document.getElementById('td-inspect-stats');
    const sellBtn = document.getElementById('td-inspect-sell');
    if(nameEl)  nameEl.textContent  = (TOWER_TYPES[t.type]||{}).name || t.type;
    if(statsEl) statsEl.textContent =
      `DMG: ${t.dmg}  RNG: ${t.range}  Kills: ${t.kills}  Total DMG: ${t.totalDmg}`;
    if(sellBtn){
      const refund = Math.floor(t.cost*0.5);
      sellBtn.textContent = `Sell (+${refund}g)`;
      sellBtn.onclick = ()=>{
        this.gold += refund;
        this.towers = this.towers.filter(x=>x!==t);
        this.inspectTower = null;
        this._updateInspectCard();
        this._updateHUD();
      };
    }
  }

  // ── Wave spawning ─────────────────────────────────────────────
  spawnWave(enemyList){
    // enemyList: array of {type, hp, speed, reward}
    this.pendingEnemies = [...enemyList];
    this.spawnIdx   = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    if(this._raf===null) this._raf = requestAnimationFrame(this._boundLoop);
  }

  // ── Game loop ──────────────────────────────────────────────────
  _loop(){
    this._raf = null;
    this.frame++;
    this._spawnTick();
    this._moveTick();
    this._shootTick();
    this._moveBullets();
    this._checkWaveEnd();
    this._render();
    if(this.waveActive || this.enemies.length || this.bullets.length){
      this._raf = requestAnimationFrame(this._boundLoop);
    }
  }

  _spawnTick(){
    if(this.spawnIdx >= this.pendingEnemies.length) return;
    this.spawnTimer++;
    if(this.spawnTimer < 60) return;   // 1 enemy per second
    this.spawnTimer = 0;
    const spec = this.pendingEnemies[this.spawnIdx++];
    this.enemies.push({
      ...spec,
      pathIdx: 0,
      x: PATH[0].x*CELL + CELL/2,
      y: PATH[0].y*CELL + CELL/2,
      maxHp: spec.hp,
    });
  }

  _moveTick(){
    const toRemove = [];
    this.enemies.forEach(e=>{
      if(e.pathIdx >= PATH.length-1){ toRemove.push(e); this.hp--; this._updateHUD(); return; }
      const target = PATH[e.pathIdx+1];
      const tx = target.x*CELL+CELL/2;
      const ty = target.y*CELL+CELL/2;
      const dx = tx-e.x; const dy = ty-e.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(dist < e.speed){ e.pathIdx++; e.x=tx; e.y=ty; }
      else { e.x+=dx/dist*e.speed; e.y+=dy/dist*e.speed; }
    });
    toRemove.forEach(e=>this.enemies.splice(this.enemies.indexOf(e),1));
  }

  _shootTick(){
    this.towers.forEach(t=>{
      if(t.cooldown>0){ t.cooldown--; return; }
      const range = t.range*CELL;
      const tx = t.cx*CELL+CELL/2;
      const ty = t.cy*CELL+CELL/2;
      const target = this.enemies.find(e=>{
        const dx=e.x-tx; const dy=e.y-ty;
        return Math.sqrt(dx*dx+dy*dy)<=range;
      });
      if(!target) return;
      t.cooldown = t.rate;
      this.bullets.push({ x:tx, y:ty, tx:target, dmg:t.dmg, splash:!!t.splash, range:t.range*CELL, tower:t });
    });
  }

  _moveBullets(){
    const toRemove = [];
    this.bullets.forEach(b=>{
      if(!b.tx || !this.enemies.includes(b.tx)){ toRemove.push(b); return; }
      const dx=b.tx.x-b.x; const dy=b.tx.y-b.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<8){
        // Hit!
        if(b.splash){
          this.enemies.forEach(e=>{
            const ex=e.x-b.tx.x; const ey=e.y-b.tx.y;
            if(Math.sqrt(ex*ex+ey*ey)<=b.range/2){
              e.hp -= b.dmg;
              b.tower.totalDmg += b.dmg;
            }
          });
        } else {
          b.tx.hp -= b.dmg;
          b.tower.totalDmg += b.dmg;
        }
        toRemove.push(b);
        // Remove dead enemies
        const dead = this.enemies.filter(e=>e.hp<=0);
        dead.forEach(e=>{
          this.gold += e.reward;
          b.tower.kills++;
          this._addFloatLabel('+'+e.reward+'g', e.x, e.y, '#f1c40f');
          this.enemies.splice(this.enemies.indexOf(e),1);
        });
        this._updateHUD();
      } else {
        b.x+=dx/dist*6; b.y+=dy/dist*6;
      }
    });
    toRemove.forEach(b=>this.bullets.splice(this.bullets.indexOf(b),1));
  }

  _checkWaveEnd(){
    if(!this.waveActive) return;
    if(this.spawnIdx < this.pendingEnemies.length) return;   // still spawning
    if(this.enemies.length > 0) return;                       // still alive
    this.waveActive = false;
    if(runState) runState.hp = this.hp;
    if(this.onWaveEnd) this.onWaveEnd(this.hp > 0);
  }

  // ── Float labels ──────────────────────────────────────────────
  _addFloatLabel(text, x, y, color='#fff'){
    this.floatLabels.push({ text, x, y, color, life:60, vy:-1 });
  }

  _updateFloatLabels(){
    this.floatLabels = this.floatLabels.filter(l=>l.life>0);
    this.floatLabels.forEach(l=>{ l.y+=l.vy; l.life--; });
  }

  // ── HUD ───────────────────────────────────────────────────────
  _flash(msg){
    const el = document.getElementById('td-flash');
    if(!el) return;
    el.textContent = msg;
    el.style.opacity='1';
    setTimeout(()=>el.style.opacity='0', 1500);
  }

  _updateHUD(){
    const gEl = document.getElementById('td-gold');  if(gEl)  gEl.textContent  = this.gold;
    const hEl = document.getElementById('td-hp');    if(hEl)  hEl.textContent  = this.hp;
  }

  // ── Render ────────────────────────────────────────────────────
  _render(){
    const ctx = this.ctx;
    ctx.clearRect(0,0,W,H);

    // Grid
    ctx.strokeStyle='rgba(255,255,255,0.05)';
    ctx.lineWidth=1;
    for(let c=0;c<COLS;c++){ ctx.beginPath(); ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,H); ctx.stroke(); }
    for(let r=0;r<ROWS;r++){ ctx.beginPath(); ctx.moveTo(0,r*CELL); ctx.lineTo(W,r*CELL); ctx.stroke(); }

    // Path
    ctx.fillStyle='rgba(120,100,60,0.4)';
    PATH.forEach(p=>ctx.fillRect(p.x*CELL,p.y*CELL,CELL,CELL));

    // Towers
    this.towers.forEach(t=>{
      const spec = TOWER_TYPES[t.type];
      const isSelected = (this.inspectTower===t);
      const tx=t.cx*CELL+CELL/2; const ty=t.cy*CELL+CELL/2;

      // Range ring (only when inspected)
      if(isSelected){
        ctx.beginPath();
        ctx.arc(tx,ty,spec.range*CELL,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,255,255,0.25)';
        ctx.lineWidth=1;
        ctx.stroke();
      }

      // Tower body
      ctx.fillStyle   = spec.color;
      ctx.strokeStyle = isSelected?'#fff':'rgba(0,0,0,0.4)';
      ctx.lineWidth   = isSelected?2:1;
      roundRect(ctx, t.cx*CELL+4, t.cy*CELL+4, CELL-8, CELL-8, 6);
      ctx.fill(); ctx.stroke();

      // Label
      ctx.fillStyle  ='#fff';
      ctx.font       ='bold 10px Inter';
      ctx.textAlign  ='center';
      ctx.fillText(spec.name[0], tx, ty+4);
    });

    // Enemies
    this.enemies.forEach(e=>{
      const r = 12;
      ctx.beginPath();
      ctx.arc(e.x,e.y,r,0,Math.PI*2);
      ctx.fillStyle=(e.type==='Brute')?'#c0392b':(e.type==='Mage')?'#8e44ad':'#e74c3c';
      ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();

      // HP bar
      const bw=28; const bh=4;
      ctx.fillStyle='#333';
      ctx.fillRect(e.x-bw/2, e.y-r-7, bw, bh);
      ctx.fillStyle='#2ecc71';
      ctx.fillRect(e.x-bw/2, e.y-r-7, bw*(e.hp/e.maxHp), bh);

      // Label
      ctx.fillStyle='#fff'; ctx.font='bold 9px Inter'; ctx.textAlign='center';
      ctx.fillText(e.type[0], e.x, e.y+4);
    });

    // Bullets
    this.bullets.forEach(b=>{
      ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2);
      ctx.fillStyle='#f39c12'; ctx.fill();
    });

    // Float labels
    this._updateFloatLabels();
    this.floatLabels.forEach(l=>{
      ctx.globalAlpha = l.life/60;
      ctx.fillStyle   = l.color;
      ctx.font        = 'bold 13px Inter';
      ctx.textAlign   = 'center';
      ctx.fillText(l.text, l.x, l.y);
    });
    ctx.globalAlpha=1;
  }

  destroy(){
    if(this._raf!==null){ cancelAnimationFrame(this._raf); this._raf=null; }
  }
}

// ─────────────────────────────────────────────────────────────
// initTDGame — called when quiz-screen answer is submitted in run mode
// ─────────────────────────────────────────────────────────────
function initTDGame(correct, question){
  const canvas = document.getElementById('td-canvas');
  if(!canvas) return;

  if(td){ td.destroy(); td=null; }

  // Build enemy list from the question
  const enemyType = enemyTypeForQuestion(question);
  const baseHp    = correct ? 30 : 80;     // easier enemies if answered correctly
  const reward    = correct ? 20 : 10;
  const count     = correct ? 3  : 6;
  const enemies   = Array.from({length:count}, ()=>({
    type:   enemyType,
    hp:     baseHp,
    speed:  correct ? 1.5 : 2.5,
    reward: reward,
  }));

  td = new TowerDefence(canvas, (survived)=>{
    // Wave ended: survived = hp still > 0 after wave
    if(!survived && runState){ runState.hp = Math.max(0, runState.hp-1); saveRunState(); }
    // Continue to next question
    setTimeout(()=>nextQuestion(), 800);
  });
  td.__run = runState;   // expose for debugging
  td.spawnWave(enemies);
  td._updateHUD();
}

// ─────────────────────────────────────────────────────────────
// bindUI — wire up all DOM elements
// ─────────────────────────────────────────────────────────────
function bindUI(){
  EL.homeScreen       = $('home-screen');
  EL.quizScreen       = $('quiz-screen');
  EL.mapScreen        = $('map-screen');
  EL.runMapScreen     = $('run-map-screen');
  EL.runCompleteScreen= $('run-complete-screen');
  EL.emptyScreen      = $('empty-screen');

  EL.questionText     = $('question-text');
  EL.answersGrid      = $('answers-grid');
  EL.feedback         = $('feedback');
  EL.explanation      = $('explanation');
  EL.nextBtn          = $('next-btn');
  EL.codeBlock        = $('code-block');
  EL.partBadge        = $('part-badge');
  EL.typeBadge        = $('type-badge');

  EL.progressFill     = $('progress-fill');
  EL.progressText     = $('progress-text');
  EL.streakCount      = $('streak-count');
  EL.sessionScore     = $('session-score');

  EL.filterBtn        = $('filter-btn');
  EL.filterDrawer     = $('filter-drawer');
  EL.filterList       = $('filter-list');
  EL.closeFilterBtn   = $('close-filter-btn');
  EL.themeToggle      = $('theme-toggle');

  EL.mapCanvas        = $('map-canvas');
  EL.startWaveBtn     = $('start-wave-btn');
  EL.wavePreviewCard  = $('wave-preview-card');
  EL.waveEnemyList    = $('wave-enemy-list');
  EL.runCompleteMsg   = $('run-complete-msg');

  // Navigation
  $('start-btn')    && ($('start-btn').onclick    = ()=>{ mode='quiz'; showScreen('quiz-screen'); loadQuestion(); });
  $('map-btn')      && ($('map-btn').onclick      = ()=>{ mode='map';  showScreen('map-screen');  buildMap(); });
  $('home-btn')     && ($('home-btn').onclick     = ()=>{ mode='home'; showScreen('home-screen'); });
  $('map-home-btn') && ($('map-home-btn').onclick = ()=>{ mode='home'; showScreen('home-screen'); });
  $('run-home-btn') && ($('run-home-btn').onclick = ()=>{ mode='home'; showScreen('home-screen'); });
  $('complete-home-btn') && ($('complete-home-btn').onclick = ()=>{ mode='home'; showScreen('home-screen'); });
  $('empty-home-btn')    && ($('empty-home-btn').onclick    = ()=>{ mode='home'; showScreen('home-screen'); });
  $('reset-btn')    && ($('reset-btn').onclick    = ()=>{
    if(!confirm('Reset all progress?')) return;
    seen.clear(); saveSeen(); streak=0; sessionCorrect=0; sessionTotal=0;
    clearRunState(); updateStats();
    mode='home'; showScreen('home-screen');
  });

  EL.nextBtn && (EL.nextBtn.onclick = nextQuestion);

  EL.filterBtn && (EL.filterBtn.onclick = ()=>{
    EL.filterDrawer.classList.toggle('open');
  });
  EL.closeFilterBtn && (EL.closeFilterBtn.onclick = ()=>{
    EL.filterDrawer.classList.remove('open');
  });

  EL.themeToggle && (EL.themeToggle.onclick = toggleTheme);

  // Tutorial overlay button
  const tutBtn = $('td-tutorial-next');
  if(tutBtn) tutBtn.onclick = ()=>{ if(td) td.advanceTutorial(); };
}

// ─────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────
async function boot(){
  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY)||'dark';
  applyTheme(savedTheme);

  // Load questions
  try{
    const res  = await fetch('../../content/question-bank.json');
    const data = await res.json();
    questions  = data.questions || data;
  } catch(e){
    console.error('Failed to load questions', e);
    questions = [];
  }

  loadSeen();
  loadFilter();

  bindUI();           // populate EL refs first
  buildFilterDrawer(); // then build filter UI (needs EL.filterList)
  updateStats();
  showScreen('home-screen');
}

document.addEventListener('DOMContentLoaded', boot);

// Service-worker registration
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW reg failed',e));
  });
}

// ─────────────────────────────────────────────────────────────
// roundRect helper (used by TD renderer)
// ─────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
