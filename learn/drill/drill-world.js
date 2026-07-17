'use strict';
// Quiz Defense — world: TD tuning config (towers/enemies/power-ups/relics),
// sprites, painted-map loading (loadWorldData/tdInitWorldData), level/run
// generation, region world-map UI, inter-node panels, tutorial.
//
// Split from the old single-file drill.js (2026-07-14). The four files are
// classic scripts sharing the global scope, loaded in order by index.html:
//   drill-core.js -> drill-audio.js -> drill-world.js -> drill-td.js
// Top-level cross-file references only run from event handlers (boot is
// DOMContentLoaded), so declaration order across files is not load-bearing —
// but keep new top-level *executable* statements out of the earlier files if
// they call into later ones.

// ╔══════════════════════════════════════════════════════════════
//  TD GAME CONFIG — now data-driven: edit learn/drill/config.json
// ╚══════════════════════════════════════════════════════════════
// The tower/enemy/power-up/relic/event tuning tables and the Frontier Town
// knobs moved to config.json (2026-07-14) so balance changes are a JSON
// edit, not a code change — same pattern as the map JSONs. loadWorldData()
// fetches it at boot and tdApplyConfig() assigns these globals. Design
// rationale that used to live in inline comments (the L4-ranger
// second-projectile rule, the 2026-07-05 heavy-shot rate rebalance, the
// G-2 special enemy semantics, the TEMP frontier startGold) is summarized
// in config.json's _notes.
let TD_CONFIG = null;
let TD_TOWER_DEFS = null;          // towers: cost/range/dmg/rate + upgrades
let TD_ENEMY_DEFS = null;          // enemies: maxHp/spd/reward (+flags)
let TD_POWER_UPS = null;           // power-ups: cost/scope/effect
let TD_RELICS = null;              // relics: category/rarity/upkeep/effect
let TD_RELIC_CATEGORIES = null;    // category id -> label
let TD_RELIC_RARITY_COST = null;   // shop pricing by rarity
let TD_RELIC_RARITY_WEIGHT = null; // shop odds by rarity
let TD_EVENTS = null;              // inter-node event card deck

function tdApplyConfig(cfg) {
  TD_CONFIG              = cfg;
  TD_TOWER_DEFS          = cfg.towers;
  TD_ENEMY_DEFS          = cfg.enemies;
  TD_POWER_UPS           = cfg.powerUps;
  TD_RELICS              = cfg.relics;
  TD_RELIC_CATEGORIES    = cfg.relicCategories;
  TD_RELIC_RARITY_COST   = cfg.relicRarityCost;
  TD_RELIC_RARITY_WEIGHT = cfg.relicRarityWeight;
  TD_EVENTS              = cfg.events;
}

// Weighted-random pick from a relic pool, honoring TD_RELIC_RARITY_WEIGHT.
// Falls back to a plain uniform pick if the pool's rarities happen to sum
// to zero weight (shouldn't happen with the four known rarity tiers).
function tdPickWeightedRelic(pool) {
  const total = pool.reduce((sum, r) => sum + (TD_RELIC_RARITY_WEIGHT[r.rarity] || 0), 0);
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
  let roll = Math.random() * total;
  for (const r of pool) {
    roll -= (TD_RELIC_RARITY_WEIGHT[r.rarity] || 0);
    if (roll <= 0) return r;
  }
  return pool[pool.length - 1];
}

// ╔══════════════════════════════════════════════════════════════
//  TD CONTENT DATA — maps, sprites, events (not tuning targets)
// ╚══════════════════════════════════════════════════════════════

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

// ─── LANDMARK ANCHORS (V-15) ──────────────────────────────────────────────
// 2×2-cell pixel-art landmarks anchored at map entry, exit, and midpoint.
// 'watchtower'/'gate' frame the entry/exit; 'shrine' is the mid landmark.
const TD_LANDMARKS = {
  watchtower: {
    pal: { K:'#241a0a', S:'#9c8a6a', s:'#6b5a42', R:'#7a2020', W:'#FDE68A', w:'#B45309', F:'#4ADE80', P:'#3a2a14' },
    frames: [
      ['......FF......', '.....FFFF.....', '......P.......', '......P.......',
       '.....RRR......', '....RRRRR.....', '...RRRRRRR....', '..RRRRRRRRR...',
       '.KKKKKKKKKKK..', '.KSSSSSSSSSK..', '.KSsSSSSSsSK..', '.KSSSWWSSSSK..',
       '.KSSSWWSSSSK..', '.KSsSSSSSsSK..', '.KSSSSSSSSSK..', '.KSSSWWSSSSK..',
       '.KSSSWWSSSSK..', '.KKKKKKKKKKK..'],
      ['.....FF.......', '....FFFF......', '......P.......', '......P.......',
       '.....RRR......', '....RRRRR.....', '...RRRRRRR....', '..RRRRRRRRR...',
       '.KKKKKKKKKKK..', '.KSSSSSSSSSK..', '.KSsSSSSSsSK..', '.KSSSwwSSSSK..',
       '.KSSSwwSSSSK..', '.KSsSSSSSsSK..', '.KSSSSSSSSSK..', '.KSSSwwSSSSK..',
       '.KSSSwwSSSSK..', '.KKKKKKKKKKK..'],
    ]},
  gate: {
    pal: { R:'#4a3018', K:'#241a0a', S:'#9c8a6a', s:'#6b5a42', g:'#3a2a1a', G:'#F59E0B' },
    frames: [
      ['RR..........RR', 'KK..........KK', 'SS..........SS', 'SS..........SS',
       'SsKKKKKKKKKKsS', 'SSKgggggggggKS', 'SSKgGgGgGgGgKS', 'SSKgggggggggKS',
       'SSKgGgGgGgGgKS', 'SSKgggggggggKS', 'SSK.........KS', 'SSK.........KS',
       'SSK.........KS', 'SsKKKKKKKKKKsS', 'SS..........SS', 'SS..........SS'],
      ['RR..........RR', 'KK..........KK', 'SS..........SS', 'SS..........SS',
       'SsKKKKKKKKKKsS', 'SSKGgGgGgGgGKS', 'SSKgGgGgGgGgKS', 'SSKGgGgGgGgGKS',
       'SSKgGgGgGgGgKS', 'SSKGgGgGgGgGKS', 'SSK.........KS', 'SSK.........KS',
       'SSK.........KS', 'SsKKKKKKKKKKsS', 'SS..........SS', 'SS..........SS'],
    ]},
  // Verdant mid-landmark: stone circle with a glowing rune center.
  shrine: {
    pal: { K:'#4b5563', G:'#34D399', g:'#065f46' },
    frames: [
      ['..............', '...KKKKKKKK...', '..K........K..', '.K..K....K..K.',
       '.K.K......K.K.', 'K.K...GG...K.K', 'K.K..GggG..K.K', 'K.K..GggG..K.K',
       'K.K...GG...K.K', '.K.K......K.K.', '.K..K....K..K.', '..K........K..',
       '...KKKKKKKK...', '..............'],
      ['..............', '...KKKKKKKK...', '..K........K..', '.K..K....K..K.',
       '.K.K......K.K.', 'K.K..GGGG..K.K', 'K.K.GggggG.K.K', 'K.K.GggggG.K.K',
       'K.K..GGGG..K.K', '.K.K......K.K.', '.K..K....K..K.', '..K........K..',
       '...KKKKKKKK...', '..............'],
    ]},
};
const TD_LANDMARK_MID = { verdant: 'shrine' };

// ── Waypoint pool for procedural (non-painted) battle maps — one grid path
// is picked per spine battle node. (The old run graph's B/C path groups were
// unreachable once every run went through the Verdant spine with pathId 0;
// removed 2026-07-13.) ──
const TD_WPS_POOL = [
  [[-1,1],[7,1],[7,4],[2,4],[2,8],[9,8]],
  [[-1,5],[3,5],[3,2],[7,2],[7,7],[4,7],[4,4],[9,4]],
  [[-1,4],[3,4],[3,1],[6,1],[6,7],[3,7],[3,9],[9,9]],
];

// ── World definition — a single world since the one-big-run decision
// (2026-07-12). The Cursed Graveyard / Void worlds and the map-select screen
// that reached them were removed 2026-07-13 (git history has them). ──
const TD_MAPS = [
  {
    id: 0, name: 'The Verdant Frontier', regionName: 'Eldervale', icon: '🌿', color: '#4ADE80',
    parts: [1,2,3], themeName: 'verdant',
    diffByDepth: [
      {easy:0.75, medium:0.25, hard:0.00},
      {easy:0.45, medium:0.45, hard:0.10},
      {easy:0.15, medium:0.55, hard:0.30},
      {easy:0.00, medium:0.30, hard:0.70},
    ],
  },
];



const TD_INTER_META = {
  shop:  { icon:'🛒', color:'#FBBF24', label:'Shop' },
  elite: { icon:'⚔️', color:'#EF4444', label:'Elite' },
  rest:  { icon:'🔥', color:'#10B981', label:'Rest' },
  event: { icon:'🎲', color:'#A78BFA', label:'Event' },
};

// ── World data — loaded at boot from assets/worlds/ (V-40) ──────
// The authoring JSONs under assets/worlds/ are the SINGLE source of truth
// for painted-map data: region-preset.json (spine node placement, verified
// against the road-pixel mask — see its _notes for the full placement
// history) and battlemaps/*.json (lanes, build slots, occluders — see each
// file's _notes for art-pass/retune history). They used to be mirrored as
// inline constants here, which drifted (the #138 pathing/slot/occluder
// retune never made it back to the JSON); now loadWorldData() fetches them
// during boot and tdInitWorldData() adapts the authoring schema to the
// runtime shapes the engine uses, deriving the grid-path and slot tables
// that used to be computed inline at parse time. Adding a battle map means
// adding a JSON+PNG pair under assets/worlds/ (plus sw.js ASSETS entries) —
// zero new lines here.
let VERDANT_REGION = null;
// Raw authoring JSONs, kept as fetched (and mutated by author mode's
// in-app editors) so ?author=1 can re-derive runtime state after an edit
// and export a file-ready replacement for the JSON on disk.
let VERDANT_REGION_JSON = null;
let FRONTIER_TOWN_JSON = null;
let FRONTIER_TOWN_MAP = null;
let FRONTIER_TOWN_WPS = null;
let FRONTIER_TOWN_WPS_EXACT = null;
let FRONTIER_TOWN_SLOTS = null;
let FRONTIER_TOWN_SLOT_CENTERS = {};
let FRONTIER_TOWN_SLOT_FACING = {};
let TD_PAINTED_BG_IMAGES = {};

async function loadWorldData() {
  const base = 'assets/worlds/verdant/';
  const [regionRes, ftRes, cfgRes] = await Promise.all([
    fetch(base + 'region-preset.json'),
    fetch(base + 'battlemaps/frontier-town.json'),
    fetch('config.json'),
  ]);
  if (!regionRes.ok || !ftRes.ok || !cfgRes.ok) {
    throw new Error(`world data HTTP ${regionRes.status}/${ftRes.status}/${cfgRes.status}`);
  }
  tdApplyConfig(await cfgRes.json());
  tdInitWorldData(await regionRes.json(), await ftRes.json());
}

function tdInitWorldData(regionJson, ftJson) {
  VERDANT_REGION_JSON = regionJson;
  FRONTIER_TOWN_JSON = ftJson;
  VERDANT_REGION = {
    image: 'assets/worlds/verdant/' + regionJson.image,
    viewBox: regionJson.viewBox,
    spine: regionJson.spine,
  };

  // The authored path is a smooth hand-traced polyline, but the TD engine's
  // path-set/build-slot blocking (tdComputePathSet) only supports axis-
  // aligned segments — tdBuildManhattanWps reduces it to a stair-stepped
  // grid path. Enemy *movement* walks the exact polyline (wpsExact below).
  FRONTIER_TOWN_MAP = {
    image: 'assets/worlds/verdant/battlemaps/' + ftJson.image,
    // pixelArt: NN vs bilinear sampling at render time — see the JSON flag.
    pixelArt: ftJson.pixelArt !== false,
    viewBox: ftJson.viewBox,
    cols: ftJson.grid.cols, rows: ftJson.grid.rows,
    waypointsPx: ftJson.lanes[0].waypoints,
    buildSlotsPx: ftJson.buildSlots.map(s => [s.x, s.y]),
    // Occluders normalize to polygons ([[x,y],…]) at runtime: rect entries
    // ([x0,y0,x1,y1]) stay the compact authoring form for boxes, poly
    // entries support free shapes (roof peaks, gate arches). The renderer
    // and editor only ever see polygons.
    occludersPx: ftJson.occluders.map(o => o.poly || [
      [o.rect[0], o.rect[1]], [o.rect[2], o.rect[1]],
      [o.rect[2], o.rect[3]], [o.rect[0], o.rect[3]],
    ]),
  };

  const { viewBox, cols, rows, waypointsPx, buildSlotsPx } = FRONTIER_TOWN_MAP;
  const cellW = viewBox[2] / cols, cellH = viewBox[3] / rows;

  FRONTIER_TOWN_WPS = tdBuildManhattanWps(waypointsPx, viewBox[2], viewBox[3], cols, rows);

  // Build-slot pixel coords → grid cells, nudged off the path/each other if
  // rounding collides them (computed once at load). Also keeps the exact
  // (unrounded) pixel position each slot was hand-painted at, so a placed
  // tower can render dead-center in its clearing instead of at the center
  // of whichever grid cell the rounding happened to land on, plus which way
  // it should face the road (see tdComputeSlotFacing).
  FRONTIER_TOWN_SLOT_CENTERS = {};
  FRONTIER_TOWN_SLOT_FACING = {};
  const pathSet = tdManhattanPathSet(FRONTIER_TOWN_WPS, cols, rows);
  const used = new Set();
  const NEIGHBORS = [[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
  FRONTIER_TOWN_SLOTS = buildSlotsPx.map(([x, y]) => {
    const baseC = Math.min(cols-1, Math.max(0, Math.round(x / cellW)));
    const baseR = Math.min(rows-1, Math.max(0, Math.round(y / cellH)));
    for (const [dc, dr] of NEIGHBORS) {
      const c = baseC + dc, r = baseR + dr;
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      const key = `${c},${r}`;
      if (pathSet.has(key) || used.has(key)) continue;
      used.add(key);
      FRONTIER_TOWN_SLOT_CENTERS[key] = [x / cellW, y / cellH];
      FRONTIER_TOWN_SLOT_FACING[key] = tdComputeSlotFacing(x, y, waypointsPx);
      return [c, r];
    }
    // no free neighbor found — keep original cell, still usable most of the time
    const fallbackKey = `${baseC},${baseR}`;
    FRONTIER_TOWN_SLOT_CENTERS[fallbackKey] = [x / cellW, y / cellH];
    FRONTIER_TOWN_SLOT_FACING[fallbackKey] = tdComputeSlotFacing(x, y, waypointsPx);
    return [baseC, baseR];
  });

  // Exact pixel-accurate movement polyline — same [x/cellW, y/cellH]
  // normalization as the slot centers, applied to the road. Without this,
  // enemies cut straight through terrain (the log pile, well, etc.) along
  // the Manhattan-reduced path's straight hops.
  const pts = waypointsPx.map(([x, y]) => [x / cellW, y / cellH]);
  // Extend the final hop off the right edge, mirroring tdBuildManhattanWps,
  // so enemies exit the map instead of stopping at the last painted point.
  pts.push([cols, pts[pts.length - 1][1]]);
  FRONTIER_TOWN_WPS_EXACT = pts;

  // Keyed by levelDef.usesPaintedBg — grows automatically as more spine
  // nodes get painted battle maps.
  TD_PAINTED_BG_IMAGES = { 'frontier-town': FRONTIER_TOWN_MAP.image };
}

function tdManhattanPathSet(wps, cols, rows) {
  const s = new Set();
  for (let i = 0; i < wps.length - 1; i++) {
    const [c0,r0] = wps[i], [c1,r1] = wps[i+1];
    if (r0 === r1) {
      const lo = Math.max(0, Math.min(c0,c1)), hi = Math.min(cols-1, Math.max(c0,c1));
      for (let c = lo; c <= hi; c++) s.add(`${c},${r0}`);
    } else {
      const lo = Math.max(0, Math.min(r0,r1)), hi = Math.min(rows-1, Math.max(r0,r1));
      for (let r = lo; r <= hi; r++) s.add(`${c0},${r}`);
    }
  }
  return s;
}

// Reduces a pixel-space polyline to an axis-aligned grid path: inserts a
// corner point wherever two consecutive grid points differ in both col and
// row, and extends the final hop off the canvas edge so enemies exit the
// map instead of stopping mid-screen.
function tdBuildManhattanWps(pointsPx, viewW, viewH, cols, rows) {
  const cellW = viewW / cols, cellH = viewH / rows;
  const toGrid = ([x, y]) => [Math.round(x / cellW) - (x <= 0 ? 1 : 0), Math.round(y / cellH)];
  const raw = pointsPx.map(toGrid);
  const wps = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const [pc, pr] = wps[wps.length - 1];
    const [c, r] = raw[i];
    if (c !== pc && r !== pr) wps.push([c, pr]);
    if (c !== pc || r !== pr) wps.push([c, r]);
  }
  const [lc, lr] = wps[wps.length - 1];
  if (lc < cols) wps.push([cols, lr]);
  return wps;
}

// Nearest point on a pixel-space polyline to a query point — used by
// tdComputeSlotFacing to find which way a tower should face without
// hardcoding a facing per build slot.
function tdNearestPointOnPolyline(px, py, points) {
  let best = null, bestDist = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[i + 1];
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = x1 + t * dx, qy = y1 + t * dy;
    const d = Math.hypot(px - qx, py - qy);
    if (d < bestDist) { bestDist = d; best = [qx, qy]; }
  }
  return best;
}

// Derives which painted variant (front/back) and horizontal mirror a tower
// at pixel (px, py) should render with, purely from the direction toward
// the nearest point on the road — never hardcoded per slot, so this works
// for any map that supplies a pixel-space waypoint polyline and slot
// positions, not just Frontier Town. "front" art's default (unmirrored)
// entrance leans screen-right; "back" art's default entrance leans
// screen-left (measured directly from the art — see
// docs/TOWER_GENERATION_PROMPTS.md's facing-variant notes). Mirroring flips
// whichever variant is picked so the entrance leans toward whichever side
// the road is actually on, not just whichever side the art happened to be
// painted facing.
function tdComputeSlotFacing(px, py, waypointsPx) {
  const [qx, qy] = tdNearestPointOnPolyline(px, py, waypointsPx);
  const dx = qx - px, dy = qy - py;
  const back = dy < 0;
  const mirror = back ? dx >= 0 : dx < 0;
  return { back, mirror };
}

// Painted-pixel-art tower tiers (V-36) — matches the battle-map art style instead
// of the flat hand-authored TD_SPRITES pixel frames. Only Ranger has painted art
// so far; any tower type absent from this map still renders via TD_SPRITES in
// tdRenderTowers. All 4 tiers wired (base + 3 upgrades, matching
// TD_TOWER_DEFS.ranger's 4 levels). Each tower type carries a `front` and a
// `back` variant — genuinely distinct art (different window/roof/entrance
// placement, not a mirror of each other) picked per placement based on
// which way the road runs past that slot (see tdComputeSlotFacing);
// horizontal mirroring in tdRenderTowers covers the other 2 of the 4
// facings so only 2 real generations were needed per tower.
function tdLoadTowerTiers(towerId, suffix) {
  return [1, 2, 3, 4].map(n => { const img = new Image(); img.src = `assets/towers/${towerId}-tier${n}${suffix}.png`; return img; });
}
const TD_TOWER_TIER_IMAGES = {
  ranger: {
    front: tdLoadTowerTiers('ranger', ''),
    back: tdLoadTowerTiers('ranger', '-back'),
  },
};

// Painted enemy animation sheets (A-3) — walk is 2 keyframes played
// A-B-A-B with the playback rate following enemy speed (the A-1 pilot
// established Nano tops out at 2 distinct keyframes per generation);
// death is a 4-pose sequence rendered as a corpse effect after the enemy
// leaves play, so game logic (targeting, leaks, rewards) never sees a
// "dying" state. Enemy types absent from this map fall back to the
// procedural TD_SPRITES frames in tdRenderEnemies, same pattern as
// TD_TOWER_TIER_IMAGES — the roster migrates one enemy at a time.
function tdLoadEnemySheet(src, frames) {
  const img = new Image();
  img.src = src;
  return { img, frames };
}
// Per-type `scale` sets rendered height as (enemy r × cellSize × scale).
// Size ladder (vs a ~2.5-cell house): goblin ≤ ¼ house — one of the tiniest
// enemies; human-sized units ≈ ½ house; bosses approach a full house.
const TD_ENEMY_SHEET_IMAGES = {
  goblin: {
    scale: 2.0,
    walk:  tdLoadEnemySheet('assets/enemies/goblin-walk.png', 2),
    death: tdLoadEnemySheet('assets/enemies/goblin-death.png', 4),
  },
};
function tdEnemySheetReady(sheet, anim) {
  return sheet && sheet[anim] && sheet[anim].img.complete && sheet[anim].img.naturalWidth > 0;
}

// Bespoke 3-wave composition for Frontier Town: bandits on foot, escalating
// to faster bandit riders, closing with a single bandit boss. Kept separate
// from the generic generateWaves (goblins/orcs/trolls/etc.) since that
// generator stacks up to 8 different enemy types into wave 3 alone — far
// more variety than a clean first-level escalation needs. Every world map
// gets its own themed roster + wave shape (see TD_ENEMY_DEFS) rather than
// reusing one generic enemy pool everywhere.
function frontierTownWaves(rng) {
  return [
    // Wave 1 is all goblins (the one enemy with painted A-3 art) so the
    // sprite work can be play-tested in isolation; waves 2-3 stay bandits.
    [['goblin', 6 + Math.floor(rng() * 3), 0.9]],
    [['bandit', 5 + Math.floor(rng() * 3), 0.8], ['bandit_rider', 3 + Math.floor(rng() * 2), 1.1]],
    [['bandit', 4 + Math.floor(rng() * 3), 0.8], ['bandit_rider', 3 + Math.floor(rng() * 2), 1.0], ['bandit_boss', 1, 2.0]],
  ];
}

function frontierTownLevelDef() {
  const mapDef = TD_MAPS[0];
  const rng = makeSeedRng((Date.now() ^ 0x51a7c0de) >>> 0);
  const waveDefs = frontierTownWaves(rng);
  // Map-scoped tuning knobs come from config.json's frontierTown section
  // (enemySpeedMult keeps the rev6 road's ~23s crossing; enemyScaleMult is
  // the unit-vs-building readability retune; ?dev=1 / ?author=1 override
  // startGold with a 99999 testing purse in showTowerDefenseScreen).
  const knobs = TD_CONFIG.frontierTown;
  return {
    name: 'Frontier Town', act: mapDef.name, icon: '🏘️', color: mapDef.color,
    enemyMult: 1.0,
    enemySpeedMult: knobs.enemySpeedMult,
    enemyScaleMult: knobs.enemyScaleMult,
    startGold: knobs.startGold, startLives: knobs.startLives,
    wps: FRONTIER_TOWN_WPS,
    wpsExact: FRONTIER_TOWN_WPS_EXACT,
    diffWeights: { easy: 0.8, medium: 0.2, hard: 0 },
    waveDefs, parts: mapDef.parts, deco: [], isBoss: false,
    usesPaintedBg: 'frontier-town',
    pixelArt: FRONTIER_TOWN_MAP.pixelArt,
    occludersPx: FRONTIER_TOWN_MAP.occludersPx,
    bgSize: [FRONTIER_TOWN_MAP.viewBox[2], FRONTIER_TOWN_MAP.viewBox[3]],
    gridCols: FRONTIER_TOWN_MAP.cols, gridRows: FRONTIER_TOWN_MAP.rows,
    buildSlots: FRONTIER_TOWN_SLOTS,
    slotCenters: FRONTIER_TOWN_SLOT_CENTERS,
    slotFacing: FRONTIER_TOWN_SLOT_FACING,
  };
}

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

  function bucketize(qs) {
    const b = { easy:[], medium:[], hard:[] };
    for (const q of qs) b[tdQDifficulty(q)].push(q);
    return b;
  }

  // Prefer questions the player hasn't mastered yet; fall back to all if buckets empty
  const fresh   = src.filter(q => !isMastered(q.id));
  const primary = bucketize(fresh.length >= 5 ? fresh : src);
  const fallback = bucketize(src);

  const r = Math.random();
  let pick;
  if (r < weights.easy && (primary.easy.length || fallback.easy.length))                                 pick = 'easy';
  else if (r < weights.easy + weights.medium && (primary.medium.length || fallback.medium.length))       pick = 'medium';
  else if (primary.hard.length || fallback.hard.length)                                                  pick = 'hard';
  else                                                                                                    pick = 'medium';

  const bucket = primary[pick].length ? primary[pick] : (fallback[pick].length ? fallback[pick] : src);
  return bucket[Math.floor(Math.random() * bucket.length)];
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

// ── Run State Management ──────────────────────────────────────

function tdLoadMapBeaten() {
  try { return JSON.parse(StorageManager.get(TD_MAPS_BEATEN_KEY) || '[]'); } catch { return []; }
}
function tdSaveMapBeaten(beaten) { StorageManager.set(TD_MAPS_BEATEN_KEY, JSON.stringify(beaten)); }
function tdMarkMapBeaten(mapId) {
  const b = tdLoadMapBeaten();
  if (!b.includes(mapId)) { b.push(mapId); tdSaveMapBeaten(b); }
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
    if (progress > 0.4) wave.push(['raider', 2+Math.floor(rng()*3), 0.7+rng()*0.3]);
    if (progress > 0.45) wave.push(['brute',  1+Math.floor(rng()*2), 1.4+rng()*0.5]);
    if (progress > 0.55) wave.push(['wisp',   2+Math.floor(rng()*2), 1.1+rng()*0.4]);
    if (progress > 0.7) wave.push(['shaman', 1, 1.6]);
    if (wave.length === 0) wave.push(['goblin', 5+Math.floor(rng()*5), 1.0]);
    // Boss enemy on every 3rd wave (waves 3, 6, …) — spawns after 2 s gap
    if ((w + 1) % 3 === 0) wave.push(['boss', 1, 2.0]);
    waves.push(wave);
  }
  return waves;
}

const RUN_LEVEL_ADJ  = ['Verdant','Iron','Shadow','Cursed','Blazing','Frozen','Arcane','Ancient','Ruined','Forsaken'];
const RUN_LEVEL_NOUN = ['Trail','Pass','Gate','Keep','Valley','Crossing','Ridge','Bastion','Hollow','Reach'];

function generateLevelName(rng) {
  return RUN_LEVEL_ADJ[Math.floor(rng()*RUN_LEVEL_ADJ.length)] + ' ' + RUN_LEVEL_NOUN[Math.floor(rng()*RUN_LEVEL_NOUN.length)];
}

function generateBattleLevel(mapDef, nodeDepth, rng, isBossNode) {
  const depthBucket = nodeDepth <= 2 ? 0 : nodeDepth <= 4 ? 1 : nodeDepth <= 6 ? 2 : 3;
  const diffWeights = mapDef.diffByDepth[depthBucket];
  const isBoss      = isBossNode || nodeDepth >= 10;
  const enemyMult   = 1.0 + (nodeDepth / 11) * 3.5 + (mapDef.id * 0.5);
  const startGold   = 150 + nodeDepth * 12 + mapDef.id * 20;
  const startLives  = Math.max(8, 22 - Math.floor(nodeDepth * 1.2) - mapDef.id * 2);
  const wps         = TD_WPS_POOL[Math.floor(rng() * TD_WPS_POOL.length)];
  const waveCount   = isBoss ? 7 : 4 + Math.floor(rng() * 2);
  const waveDefs    = generateWaves(enemyMult, waveCount, rng);
  return {
    name:       isBoss ? mapDef.icon + ' ' + mapDef.name + ' Boss' : generateLevelName(rng),
    act:        mapDef.name,
    icon:       isBoss ? '💀' : mapDef.icon,
    color:      isBoss ? '#EF4444' : mapDef.color,
    enemyMult, startGold, startLives, wps, diffWeights, waveDefs,
    parts:      mapDef.parts,
    deco:       [],
    isBoss,
  };
}

// Runs use the painted region map's fixed 14-node spine. (The procedural
// fork/converge run graph it replaced was removed 2026-07-13 along with the
// Decay/Void worlds that still used it.)
function generateVerdantRun() {
  const seed   = (Date.now() ^ (Math.random() * 0x7FFFFFFF | 0)) >>> 0;
  const rng    = makeSeedRng(seed);
  const mapDef = TD_MAPS[0];
  const spine  = VERDANT_REGION.spine;

  // typeRules: minBattles 8, shops 2, campfires(rest) 2 — exactly fills the
  // 12 middle nodes (n1..n12) between the fixed start/boss endpoints.
  const typePool = ['shop','shop','rest','rest', ...Array(8).fill('battle')];
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
  }

  const nodes = spine.map((s, i) => {
    const isStart = s.id === 'start', isBoss = s.id === 'boss';
    const type = isStart ? 'start' : isBoss ? 'battle' : typePool[i - 1];
    const needsDef = isStart || isBoss || type === 'battle' || type === 'elite';
    const levelDef = isStart ? frontierTownLevelDef()
                    : needsDef ? generateBattleLevel(mapDef, i, rng, isBoss)
                    : null;
    return {
      id: s.id, name: s.name, battleTheme: s.battleTheme, type,
      x: s.x, y: s.y, depth: i,
      nextIds: isBoss ? [] : [spine[i + 1].id],
      prevIds: isStart ? [] : [spine[i - 1].id],
      levelDef, state: 'locked',
    };
  });
  nodes[0].state = 'available';

  const run = {
    mapId: 0, seed, nodes, currentId: null, visitedIds: [], activeId: null,
    powerUps: ['gold_rush'], stats: { battlesWon:0, goldEarned:0, xpEarned:0, carryGold:0 },
    usesRegionMap: true,
  };
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

// ── Verdant painted world map (G-9) ─────────────────────────────
// Renders the region.png spine as a real world map instead of the
// procedural SVG node graph: node coords are already in the image's pixel
// space, so this is a straight overlay, not a layout/generation pass.
// ── Region-map ambient animation layer ─────────────────────────
// Pure decoration between the painted art and the interactive nodes:
// drifting mist over the corrupted zone, chimney smoke, bird flocks,
// water glints, fluttering pennants, and a few grazing sheep dots (the
// painted sheep are baked pixels — these extras read as flock life).
// Everything is CSS-animated SVG, GPU-composited, no JS per frame, and
// fully disabled under prefers-reduced-motion (see drill.css).
// Coordinates are in the region viewBox (1024×474); water-glint points
// were snapped to actual blue pixels of the painted rivers/lake.
const RVM_AMBIENT = {
  // Durations halved 2026-07-12 (with wider keyframe drift in drill.css):
  // the old 55-90s cycles moved ~1px/s — imperceptible in practice.
  mist: [   // corrupted NE + eastern swamp
    { cx: 780, cy: 90,  rx: 90,  ry: 40, dur: 34, delay: 0,   op: .16 },
    { cx: 880, cy: 150, rx: 110, ry: 55, dur: 42, delay: -20, op: .20 },
    { cx: 950, cy: 250, rx: 90,  ry: 50, dur: 30, delay: -18, op: .15 },
    { cx: 830, cy: 205, rx: 70,  ry: 35, dur: 38, delay: -8,  op: .12 },
    // Light vapor drifting out of the corrupted corner into the mid-region
    // (owner request) — deliberately weaker (op .07-.12) and smaller than
    // the corrupted-zone banks so it reads as thinning outflow, broken and
    // uneven, not a second weather system. Same three-lobe gradient patches.
    { cx: 700, cy: 330, rx: 75, ry: 30, dur: 44, delay: -12, op: .10 },
    { cx: 612, cy: 175, rx: 60, ry: 24, dur: 37, delay: -22, op: .07 },
    { cx: 795, cy: 395, rx: 85, ry: 34, dur: 34, delay: -15, op: .12 },
    { cx: 545, cy: 300, rx: 55, ry: 22, dur: 48, delay: -28, op: .07 },
  ],
  // Chimney/campfire sources as [x, y, dx]: dx is the horizontal drift (px)
  // a puff picks up over its rise, matched to each landmark's PAINTED plume
  // so the animated smoke continues the baked art instead of crossing it —
  // the kiln plumes lean right, the town chimney's leans slightly left.
  // Anchors sit on the actual chimney/kiln tips (verified on zoomed crops;
  // the old lakehouse source hovered over the road).
  smoke: [
    [361, 88,  15], [387, 99, 15],  // charcoal kilns (painted plumes lean right)
    [253, 286, -7],                 // town chimney (painted plume leans left)
    [574, 311, 9],                  // manor chimney
    [624, 107, 10],                 // lakehouse stovepipe
  ],
  glints: [ // ripple squiggles on painted water
    [234,106],[259,158],[300,250],[348,333],[298,394],[325,93],[326,144],
    [338,268],[364,306],[590,140],[660,130],[700,180],[619,198],[708,196],[872,277],
  ],
  // Pennant pole planted ON the crag watchtower's roof apex. The ruined
  // keep's pennant was removed (owner, 2026-07-12): a crisp flying flag on
  // a decrepit corrupted ruin read as out of place.
  flags: [
    { x: 444, y: 191 },
  ],
  sheep: [  // grazing wanderers inside the painted flocks' open grass
    { x: 555, y: 235, dur: 55, delay: 0 },   // lakeside meadow (was in the trees NW of it)
    { x: 662, y: 372, dur: 68, delay: -22 },
    { x: 862, y: 312, dur: 60, delay: -40 },
  ],
};

function rvmAmbientHtml() {
  const A = RVM_AMBIENT;
  // Each mist patch is a cluster of three soft-edged lobes on a radial
  // gradient (opaque core fading to nothing) rather than one flat ellipse —
  // a single uniform-fill ellipse read as a hard-rimmed "floating plate"
  // even under blur. Lobes share the patch's drift but at staggered
  // durations so the cluster stretches and re-forms as it moves.
  const mistDefs = `<defs>
    <radialGradient id="rvm-mist-grad">
      <stop offset="0%"  stop-color="#cfd8d4" stop-opacity="1"/>
      <stop offset="55%" stop-color="#cfd8d4" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#cfd8d4" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
  const mist = A.mist.map((m, i) => {
    const lobes = [
      { ox: -m.rx * .40, oy:  m.ry * .22, fx: .62, fy: .74, dmul: 1.18 },
      { ox:  m.rx * .38, oy: -m.ry * .18, fx: .70, fy: .66, dmul: 0.86 },
      { ox: 0,           oy: 0,           fx: 1,   fy: 1,   dmul: 1    },
    ];
    return lobes.map((l, j) => `
    <ellipse class="rvm-mist rvm-mist-${(i + j) % 2 ? 'b' : 'a'}" fill="url(#rvm-mist-grad)"
      cx="${(m.cx + l.ox).toFixed(0)}" cy="${(m.cy + l.oy).toFixed(0)}"
      rx="${(m.rx * l.fx).toFixed(0)}" ry="${(m.ry * l.fy).toFixed(0)}"
      style="animation-duration:${(m.dur * l.dmul).toFixed(0)}s;animation-delay:${m.delay - j * 7}s;--mist-op:${m.op}"/>`).join('');
  }).join('');
  const smoke = A.smoke.map(([x, y, dx]) => [0, 1, 2, 3].map(p => `
    <circle class="rvm-smoke" cx="${x}" cy="${y}" r="${(2.0 + p * 0.4).toFixed(1)}"
      style="animation-delay:${(p * 1.4).toFixed(1)}s;--sdx:${dx}px"/>`).join('')).join('');
  const glints = A.glints.map(([x, y], i) => `
    <path class="rvm-glint" d="M-4 0 q2 -2.4 4 0 t4 0" transform="translate(${x},${y})"
      style="animation-delay:${((i * 0.7) % 3.4).toFixed(1)}s;animation-duration:${(2.6 + (i % 4) * 0.5).toFixed(1)}s"/>`).join('');
  const bird = 'M0 0 Q2 -2.2 4 0 Q6 -2.2 8 0';
  const flock = (cls) => `
    <g class="rvm-flock ${cls}">
      <path d="${bird}" transform="translate(0,0) scale(1.05)"/>
      <path d="${bird}" transform="translate(-11,6) scale(0.9)"/>
      <path d="${bird}" transform="translate(-22,11) scale(0.75)"/>
      <path d="${bird}" transform="translate(11,7) scale(0.85)"/>
    </g>`;
  const flags = A.flags.map(f => `
    <g class="rvm-flagpole" transform="translate(${f.x},${f.y})">
      <line x1="0" y1="0" x2="0" y2="-9" stroke="#3a2c1c" stroke-width="1"/>
      <polygon class="rvm-flag" points="0,-9 8,-7.2 0,-5.4" fill="#B33A2F"/>
    </g>`).join('');
  const sheep = A.sheep.map((s, i) => `
    <g class="rvm-sheep rvm-sheep-${i}" transform="translate(${s.x},${s.y})"
       style="animation-duration:${s.dur}s;animation-delay:${s.delay}s">
      <ellipse cx="0" cy="0" rx="2.6" ry="1.7" fill="#d9d5a8"/>
      <circle cx="2.4" cy="-0.4" r="0.9" fill="#57504a"/>
    </g>`).join('');
  return `<g class="rvm-ambient" aria-hidden="true">
    ${mistDefs}${glints}${smoke}${sheep}${flags}${mist}${flock('rvm-flock-a')}${flock('rvm-flock-b')}
  </g>`;
}

function renderVerdantWorldMap(run) {
  const mapDef = TD_MAPS[run.mapId];
  const [, , VW, VH] = VERDANT_REGION.viewBox;
  const spine = VERDANT_REGION.spine;

  const TI = { start:'🏘', battle:'⚔', shop:'🛒', rest:'🔥', elite:'💀' };
  function nodeColor(node) {
    if (node.id === 'boss') return '#EF4444';
    if (node.type === 'start') return mapDef.color;
    if (node.type === 'battle' || node.type === 'elite') {
      const dw = node.levelDef && node.levelDef.diffWeights;
      if (!dw) return '#9CA3AF';
      return dw.hard >= 0.5 ? '#EF4444' : dw.hard >= 0.2 ? '#FBBF24' : '#4ADE80';
    }
    const TC = { shop:'#FBBF24', rest:'#10B981' };
    return TC[node.type] || mapDef.color;
  }

  const roadsHtml = spine.slice(1).map((s, i) => {
    const prev = spine[i]; // spine[i] is the node before s (i is 0-based over slice(1))
    const prevNode = run.nodes.find(n => n.id === prev.id);
    const curNode  = run.nodes.find(n => n.id === s.id);
    const done = run.visitedIds.includes(prev.id) && run.visitedIds.includes(s.id);
    const ahead = run.visitedIds.includes(prev.id);
    const cls = done ? 'rvm-road-done' : ahead ? 'rvm-road-ahead' : 'rvm-road-future';
    return `<line class="rvm-road ${cls}" x1="${prevNode.x}" y1="${prevNode.y}" x2="${curNode.x}" y2="${curNode.y}"/>`;
  }).join('');

  const nodesHtml = run.nodes.map(node => {
    const col = nodeColor(node);
    const icon = TI[node.id === 'boss' ? 'battle' : node.type] || '⚔';
    const label = node.name;
    if (node.state === 'completed') {
      return `<g class="rvm-node rvm-completed" data-id="${node.id}">
        <circle cx="${node.x}" cy="${node.y}" r="13" fill="#07090e" stroke="#2d4455" stroke-width="1.5" opacity="0.85"/>
        <text x="${node.x}" y="${node.y+4}" font-size="10" text-anchor="middle" fill="#8fb0c5">✓</text>
      </g>`;
    }
    if (node.state === 'available' || node.state === 'active') {
      const pulse = node.state === 'available' ? 'rvm-pulse' : '';
      return `<g class="rvm-node ${pulse}" data-id="${node.id}" style="cursor:pointer">
        <circle cx="${node.x}" cy="${node.y}" r="20" fill="${col}22" stroke="${col}70" stroke-width="2"/>
        <circle cx="${node.x}" cy="${node.y}" r="13" fill="#0c1020" stroke="${col}" stroke-width="2.5"/>
        <text x="${node.x}" y="${node.y+5}" font-size="12" text-anchor="middle">${icon}</text>
        <text x="${node.x}" y="${node.y-24}" font-size="8" text-anchor="middle" fill="#fff9ec" font-weight="700" stroke="#000" stroke-width="2.2" paint-order="stroke">${label}</text>
      </g>`;
    }
    const prevVisited = run.visitedIds.includes(node.id === 'start' ? node.id : (node.prevIds[0] || ''));
    const fog = prevVisited ? '0.9' : '0.32';
    return `<g class="rvm-node rvm-future" data-id="${node.id}" opacity="${fog}">
      <circle cx="${node.x}" cy="${node.y}" r="12" fill="${col}12" stroke="${col}45" stroke-width="1.5"/>
      <text x="${node.x}" y="${node.y+4}" font-size="10" text-anchor="middle" opacity="0.55">${icon}</text>
    </g>`;
  }).join('');

  const svg = `<svg id="rvm-svg" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">
    <image href="${VERDANT_REGION.image}" x="0" y="0" width="${VW}" height="${VH}" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="${VW}" height="${VH}" fill="rgba(6,9,16,.12)"/>
    ${rvmAmbientHtml()}
    ${roadsHtml}
    ${nodesHtml}
  </svg>`;

  EL.contentArea.innerHTML = `
    <div id="rvm-wrap" class="region-map-wrap">
      <div class="region-map-header">
        <button class="td-header-back" id="td-header-back">← Home</button>
        <div class="region-map-header-text">
          <span class="region-map-title region-map-title-fancy">${mapDef.regionName || mapDef.name}</span>
        </div>
        <div class="td-header-right">
          <button class="td-header-icon" id="td-header-inventory" title="Inventory">🎒</button>
          <button class="td-header-icon" id="td-header-help" title="Help">?</button>
        </div>
      </div>
      ${svg}
    </div>`;
  bindTdHeaderActions(showHome);

  // Cover-fit, not contain-fit: Math.max (not Math.min) so the map fills
  // the wrap completely, cropping whichever dimension overflows (wrap has
  // overflow:hidden) instead of leaving letterbox margins to keep the full
  // map uncropped. #rvm-wrap centers via align-items/justify-content, so
  // whichever axis overflows gets trimmed evenly from both edges.
  //
  // But cover-fit alone can crop a spine node off-screen entirely on
  // aspect ratios far from the map's own (e.g. a tablet-shaped landscape
  // viewport clips x=915 — the boss node — before a phone-shaped one
  // would). So the scale is also capped at whatever keeps every node's
  // bounding box (plus a little padding for its label/circle) inside the
  // visible window; only backs off from full cover-fit on those extreme
  // ratios, and only as much as it has to.
  const rvmWrap = document.getElementById('rvm-wrap');
  const rvmSvg  = document.getElementById('rvm-svg');
  const nodePad = 40;
  const nodeXs = spine.map(s => s.x), nodeYs = spine.map(s => s.y);
  const minX = Math.min(...nodeXs) - nodePad, maxX = Math.max(...nodeXs) + nodePad;
  const minY = Math.min(...nodeYs) - nodePad, maxY = Math.max(...nodeYs) + nodePad;
  const cx = VW / 2, cy = VH / 2;
  const maxSafeScale = Math.min(
    rvmWrap.clientWidth  / (2 * Math.max(cx - minX, maxX - cx)),
    rvmWrap.clientHeight / (2 * Math.max(cy - minY, maxY - cy)),
  );
  const coverScale = Math.max(rvmWrap.clientWidth / VW, rvmWrap.clientHeight / VH);
  const scale = Math.min(coverScale, maxSafeScale);
  rvmSvg.style.width  = (VW * scale) + 'px';
  rvmSvg.style.height = (VH * scale) + 'px';

  document.querySelectorAll('.rvm-node[data-id]').forEach(g => {
    const node = run.nodes.find(n => n.id === g.dataset.id);
    if (!node || (node.state !== 'available' && node.state !== 'active')) return;
    g.addEventListener('click', () => {
      markNodeEntered(run, node.id);
      if (node.type === 'shop' || node.type === 'rest') showInterNodePanel(node, run);
      else showLevelConfirmPanel(tdFreshLevelDefFor(node), node.id, run);
    });
  });

  // Creator mode (?dev / ?author / ?edit): every spine node becomes
  // draggable and the updated region-preset.json is exportable — see
  // rvmAuthorInitEditor. The region map has no per-screen toolbar, so
  // spine editing is simply on whenever Creator Mode is.
  if (TD_CREATOR_MODE) rvmAuthorInitEditor(run);
}

// ── Region-map node editor (?author=1) ─────────────────────────
// The world-map counterpart of the battle-map editor in drill-td.js: drag
// any spine node (pointer events, touch included) to reposition it on the
// painted road; roads connected to it follow live, the coordinates write
// through to VERDANT_REGION_JSON.spine (shared object with
// VERDANT_REGION.spine) AND the active run's nodes, and 📋 exports the
// full updated region-preset.json to the clipboard. No road-mask snapping
// — position by eye with the painted road visible under the node; the
// verifier + a playtest remain the guardrail, same as battle-map edits.
function rvmAuthorInitEditor(run) {
  const svg  = document.getElementById('rvm-svg');
  const wrap = document.getElementById('rvm-wrap');
  if (!svg || !wrap || !VERDANT_REGION_JSON) return;
  const spine = VERDANT_REGION_JSON.spine;
  const [, , VW] = VERDANT_REGION.viewBox;
  svg.style.touchAction = 'none';

  const bar = document.createElement('div');
  bar.id = 'rvm-author-bar';
  bar.className = 'td-author-bar';
  bar.innerHTML = `<button class="td-author-btn" data-act="back" title="Back home">⬅</button>
    <span class="rvm-author-hint">AUTHOR — drag nodes</span>
    <button class="td-author-btn" data-act="export" title="Copy updated region-preset.json">📋</button>`;
  wrap.appendChild(bar);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.act === 'back') { showHome(); return; }
    const txt = JSON.stringify(VERDANT_REGION_JSON, null, 2) + '\n';
    console.log(txt);
    tdAuthorCopy(txt, ok => {
      b.textContent = ok ? '✓' : '⚠';
      setTimeout(() => { b.textContent = '📋'; }, 1400);
    });
  });

  // client → viewBox coords (uniform scale: the svg's CSS size is set
  // proportional to the viewBox by the fit logic above)
  const toVb = e => {
    const r = svg.getBoundingClientRect();
    const k = VW / r.width;
    return { x: Math.round((e.clientX - r.left) * k), y: Math.round((e.clientY - r.top) * k) };
  };

  const lines = [...svg.querySelectorAll('.rvm-road')];
  svg.querySelectorAll('.rvm-node[data-id]').forEach(g => {
    g.style.cursor = 'move';
    // Future/completed nodes ship with pointer-events:none (not clickable
    // in normal play) — the editor needs to drag ALL nodes.
    g.style.pointerEvents = 'auto';
    g.addEventListener('pointerdown', e => {
      const si = spine.findIndex(s => s.id === g.dataset.id);
      if (si < 0) return;
      e.preventDefault();
      g.setPointerCapture(e.pointerId);
      const s = spine[si];
      const ox = s.x, oy = s.y;
      const p0 = toVb(e);
      let dragged = false;
      const onMove = ev => {
        const p = toVb(ev);
        const nx = ox + (p.x - p0.x), ny = oy + (p.y - p0.y);
        if (nx === s.x && ny === s.y) return;
        dragged = true;
        s.x = nx; s.y = ny;
        const rn = run.nodes.find(n => n.id === s.id);
        if (rn) { rn.x = nx; rn.y = ny; }
        // Nodes render at their original coords — translate the group and
        // re-aim the two road segments touching it; everything else stays.
        g.setAttribute('transform', `translate(${nx - ox},${ny - oy})`);
        if (lines[si - 1]) { lines[si - 1].setAttribute('x2', nx); lines[si - 1].setAttribute('y2', ny); }
        if (lines[si])     { lines[si].setAttribute('x1', nx);     lines[si].setAttribute('y1', ny); }
      };
      const onUp = () => {
        g.removeEventListener('pointermove', onMove);
        g.removeEventListener('pointerup', onUp);
        g.removeEventListener('pointercancel', onUp);
        if (dragged) {
          tdSaveRun(run); // moved layout previews across screens this run
          // Swallow the click synthesized by this drag's pointerup so an
          // available node doesn't launch its battle. Expires quickly in
          // case no click follows (some touch sequences), so it can never
          // eat a later legitimate tap.
          const swallow = ev2 => { ev2.stopImmediatePropagation(); ev2.preventDefault(); };
          g.addEventListener('click', swallow, { capture: true, once: true });
          setTimeout(() => g.removeEventListener('click', swallow, { capture: true }), 400);
        }
      };
      g.addEventListener('pointermove', onMove);
      g.addEventListener('pointerup', onUp);
      g.addEventListener('pointercancel', onUp);
    });
  });
}

// A run is only resumable if it matches the current map schema — old
// pre-painted-map Verdant runs (no usesRegionMap flag) are from the
// superseded 25-node procedural graph and can't be continued on the new
// spine, so they're treated as stale and replaced with a fresh run.
function isRunCompatible(run, mapId) {
  return !!run && run.mapId === mapId && (mapId !== 0 || run.usesRegionMap === true);
}

function showRunMap(run) {
  EL.cardArea.style.display    = 'none';
  EL.bottomBar.style.display   = 'none';
  EL.progressWrap.style.display = 'none';
  EL.completeScreen.classList.remove('show');
  setTopBar('td-world');
  menuMusic.stop();
  battleMusicHorn.stop();
  mapMusic.start();
  // If the user closed the browser mid-battle, any node stuck in 'active'
  // state can never be clicked (pointer-events:none). Reset them here so
  // they're clickable again.
  run.nodes.forEach(n => { if (n.state === 'active') { n.state = 'available'; run.activeId = null; } });
  tdSaveRun(run);
  renderVerdantWorldMap(run); // all runs are Verdant region runs (isRunCompatible discards stale saves)
}

// One big run (owner decision 2026-07-12): play routes straight into the
// Verdant run. The old "Choose Your Map" screen was removed 2026-07-13.
function showTDWorldMap() {
  battleMusicHorn.stop();
  const existRun = tdLoadRun();
  const run = isRunCompatible(existRun, 0) ? existRun : generateVerdantRun();
  showRunMap(run);
}

// ── Relic equip menu (EQ-4) ──────────────────────────────────────
// Reachable from the run map / map select top bar. Category exclusivity is
// enforced silently on equip (old relic in that category auto-drops) — the
// richer "Replace or skip?" conflict UI is EQ-7's job, not this item's.
// EQ-7 surface (2): consolidated inventory — the run's held power-ups (read-
// only; they're spent from the pre-wave tray during battle, not managed
// here) plus the existing relic collection/equip list. One 🎒 button now
// covers both, replacing the relic-only 🏺 menu.
function showInventoryPanel() {
  const existing = document.querySelector('.relic-equip-overlay');
  if (existing) existing.remove();

  const upkeep = tdComputeRelicMods().upkeepTotal;
  const owned  = TD_RELICS.filter(r => tdOwnedRelics.has(r.id));
  const run    = tdLoadRun();
  const heldPowerUps = (run && run.powerUps) || [];

  const overlay = document.createElement('div');
  overlay.className = 'relic-equip-overlay';
  overlay.innerHTML = `
    <div class="relic-equip-sheet">
      <div class="relic-equip-header">
        <span class="relic-equip-title">🎒 Inventory</span>
        <button class="relic-equip-close" id="relic-equip-close">✕</button>
      </div>
      <div class="inv-section-label">Power-ups (${heldPowerUps.length}/3) — spent from the pre-wave tray in battle</div>
      <div class="relic-equip-list inv-powerup-list">
        ${heldPowerUps.length ? heldPowerUps.map(pid => {
          const pu = TD_POWER_UPS[pid];
          if (!pu) return '';
          return `<div class="relic-equip-card inv-powerup-card">
            <div class="relic-equip-icon">${pu.icon}</div>
            <div class="relic-equip-body">
              <div class="relic-equip-name">${pu.name}</div>
              <div class="relic-equip-meta">${pu.scope === 'wave' ? 'Lasts one wave' : 'Lasts this node'}</div>
            </div>
          </div>`;
        }).join('') : '<div class="relic-equip-empty">No power-ups held right now.</div>'}
      </div>
      <div class="inv-section-label">Relics — upkeep: ${upkeep}🪙 / node start</div>
      <div class="relic-equip-list">
        ${owned.length ? owned.map(r => {
          const isEq = tdEquippedRelics.has(r.id);
          return `<div class="relic-equip-card${isEq ? ' equipped' : ''}" data-relic-id="${r.id}">
            <div class="relic-equip-icon">${r.icon}</div>
            <div class="relic-equip-body">
              <div class="relic-equip-name">${r.name} <span class="relic-equip-rarity rarity-${r.rarity}">${r.rarity}</span></div>
              <div class="relic-equip-desc">${r.desc}</div>
              <div class="relic-equip-meta">${TD_RELIC_CATEGORIES[r.category] || r.category}${r.upkeep ? ` · ${r.upkeep}🪙/node upkeep` : ''}</div>
            </div>
            <div class="relic-equip-status">${isEq ? '✓ Equipped' : 'Tap to equip'}</div>
          </div>`;
        }).join('') : '<div class="relic-equip-empty">No relics collected yet.</div>'}
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('relic-equip-close').addEventListener('click', () => overlay.remove());
  overlay.querySelectorAll('.relic-equip-card[data-relic-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.relicId;
      if (tdEquippedRelics.has(id)) tdUnequipRelic(id); else tdEquipRelic(id);
      showInventoryPanel();
    });
  });
}

// EQ-7 surface (3): shown right after a relic purchase so the player can
// decide immediately rather than having to separately open the inventory
// panel. No-conflict case is a simple equip/later choice; a same-category
// conflict gets the explicit "Replace or skip?" UI the backlog calls for,
// instead of EQ-4's equip-menu default of silently auto-dropping the old one.
function showRelicAcquiredPrompt(relic) {
  const conflictId = [...tdEquippedRelics].find(id => {
    const eq = TD_RELICS.find(r => r.id === id);
    return eq && eq.category === relic.category && id !== relic.id;
  });
  const conflict = conflictId ? TD_RELICS.find(r => r.id === conflictId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'relic-equip-overlay';
  // Needs to render above the shop panel (.tdcp-overlay, z-index 9000) since
  // it can pop up while the shop is still open — the base .relic-equip-
  // overlay z-index (400) assumes it's the only overlay on screen.
  overlay.style.zIndex = '9500';
  overlay.innerHTML = `
    <div class="relic-equip-sheet">
      <div class="relic-equip-header">
        <span class="relic-equip-title">New Relic!</span>
      </div>
      <div class="relic-equip-card equipped" style="cursor:default">
        <div class="relic-equip-icon">${relic.icon}</div>
        <div class="relic-equip-body">
          <div class="relic-equip-name">${relic.name} <span class="relic-equip-rarity rarity-${relic.rarity}">${relic.rarity}</span></div>
          <div class="relic-equip-desc">${relic.desc}</div>
        </div>
      </div>
      ${conflict ? `<div class="inv-section-label">You already have ${conflict.name} equipped in ${TD_RELIC_CATEGORIES[relic.category] || relic.category}</div>` : ''}
      <div class="tdcp-actions" style="margin-top:.8rem">
        <button class="tdcp-btn-back" id="relic-acquired-skip">${conflict ? 'Skip' : 'Later'}</button>
        <button class="tdcp-btn-play" id="relic-acquired-equip">${conflict ? `Replace ${conflict.name}` : 'Equip now'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('relic-acquired-skip').addEventListener('click', () => overlay.remove());
  document.getElementById('relic-acquired-equip').addEventListener('click', () => { tdEquipRelic(relic.id); overlay.remove(); });
}

// Frontier Town's levelDef gets baked into a run's serialized node array at
// run-creation time (see the spine-generation code that calls
// frontierTownLevelDef() once), but that function keeps gaining fields as
// the game evolves (slot facing, new tower tiers, etc.) — a run created
// before one of those changes would replay the start node with a
// permanently stale levelDef otherwise, since runs persist across sessions
// via tdSaveRun/localStorage and nothing ever refreshes an already-baked
// node.levelDef. Frontier Town's waves are already reseeded from
// Date.now() on every call (see frontierTownLevelDef), so there's no
// continuity to lose by recomputing it fresh right before playing.
function tdFreshLevelDefFor(node) {
  return node.type === 'start' ? frontierTownLevelDef() : node.levelDef;
}

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
      <div class="tdcp-modifiers">
        <div class="tdcp-mod-label">Challenge Modifiers <span class="tdcp-mod-hint">+15🪙 each</span></div>
        <div class="tdcp-mod-row">
          <button class="tdcp-mod-btn" data-mod="ironman" title="Enemies deal 2× lives damage">☠️ Ironman</button>
          <button class="tdcp-mod-btn" data-mod="noGold" title="Start with 0 gold">🚫 No Gold</button>
          <button class="tdcp-mod-btn" data-mod="speedPlus" title="Enemies move 25% faster">💨 Speed+</button>
        </div>
      </div>
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
  panel.querySelectorAll('.tdcp-mod-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
  panel.querySelector('.tdcp-btn-play').addEventListener('click', () => {
    const mods = { ironman: false, noGold: false, speedPlus: false };
    panel.querySelectorAll('.tdcp-mod-btn.active').forEach(b => { mods[b.dataset.mod] = true; });
    levelDef.modifiers = mods;
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
    // EQ-6: 3 random power-up offers + 1 rarity-weighted relic offer, spent
    // against the run's carry-over gold (not the permanent meta `gold`).
    // Offers are rolled once per visit and held in closure — re-render()
    // only rebuilds the DOM/listeners after a purchase, it never re-rolls.
    const puOffers = Array.from({ length: 3 }, () => {
      const pool = Object.values(TD_POWER_UPS);
      return pool[Math.floor(Math.random() * pool.length)];
    });
    let relicOffer  = null;
    const relicPool = TD_RELICS.filter(r => !tdOwnedRelics.has(r.id));
    if (relicPool.length) relicOffer = tdPickWeightedRelic(relicPool);
    let relicSold = false;

    function render() {
      const carryGold = (run.stats && run.stats.carryGold) || 0;
      const puFull = run.powerUps.length >= 3;
      const puHtml = puOffers.map((pu, i) => {
        const disabled = puFull || carryGold < pu.cost;
        return `
        <div class="tdcp-shop-item${disabled ? ' cannot-afford' : ''}" data-kind="powerup" data-idx="${i}">
          <span class="tdcp-shop-icon">${pu.icon}</span>
          <div class="tdcp-shop-text">
            <span class="tdcp-shop-label">${pu.name}</span>
            <span class="tdcp-shop-sub">${puFull ? 'Inventory full (3/3)' : pu.scope === 'wave' ? 'Lasts one wave' : 'Lasts this node'}</span>
          </div>
          <span class="tdcp-shop-cost">🪙${pu.cost}</span>
        </div>`;
      }).join('');
      const relicCost = relicOffer ? TD_RELIC_RARITY_COST[relicOffer.rarity] : 0;
      const relicHtml = !relicOffer ? `
        <div class="tdcp-shop-item tdcp-shop-relic cannot-afford">
          <span class="tdcp-shop-icon">🏺</span>
          <div class="tdcp-shop-text">
            <span class="tdcp-shop-label">All Relics Owned</span>
            <span class="tdcp-shop-sub">Nothing left to offer right now</span>
          </div>
        </div>` : `
        <div class="tdcp-shop-item tdcp-shop-relic${(relicSold || carryGold < relicCost) ? ' cannot-afford' : ''}" data-kind="relic">
          <span class="tdcp-shop-icon">${relicOffer.icon}</span>
          <div class="tdcp-shop-text">
            <span class="tdcp-shop-label">${relicOffer.name}</span>
            <span class="tdcp-shop-sub">${relicSold ? 'Sold' : `${relicOffer.rarity} · ${TD_RELIC_CATEGORIES[relicOffer.category] || relicOffer.category}`}</span>
          </div>
          <span class="tdcp-shop-cost">🪙${relicCost}</span>
        </div>`;

      panel.innerHTML = `
        <div class="tdcp-panel">
          <div class="tdcp-header">
            <div class="tdcp-icon">${meta.icon}</div>
            <div class="tdcp-title-wrap">
              <div class="tdcp-name">Shop</div>
              <div class="tdcp-act">Carry-over gold: 🪙${carryGold}</div>
            </div>
          </div>
          <div class="tdcp-shop-grid">${puHtml}${relicHtml}</div>
          <div class="tdcp-actions">
            <button class="tdcp-btn-back">← Back</button>
            <button class="tdcp-btn-play tdcp-btn-leave">Leave Shop</button>
          </div>
        </div>`;

      panel.querySelector('.tdcp-btn-back').addEventListener('click', () => panel.remove());
      panel.querySelector('.tdcp-btn-leave').addEventListener('click', finishNode);
      panel.querySelectorAll('.tdcp-shop-item[data-kind="powerup"]:not(.cannot-afford)').forEach(el => {
        el.addEventListener('click', () => {
          const pu = puOffers[parseInt(el.dataset.idx)];
          if (!pu || run.powerUps.length >= 3 || (run.stats.carryGold || 0) < pu.cost) return;
          run.stats.carryGold -= pu.cost;
          run.powerUps.push(pu.id);
          tdSaveRun(run);
          render();
        });
      });
      const relicEl = panel.querySelector('.tdcp-shop-item[data-kind="relic"]:not(.cannot-afford)');
      if (relicEl) {
        relicEl.addEventListener('click', () => {
          if (!relicOffer || relicSold || (run.stats.carryGold || 0) < relicCost) return;
          run.stats.carryGold -= relicCost;
          tdSaveRun(run);
          tdOwnedRelics.add(relicOffer.id);
          saveGameState();
          relicSold = true;
          render();
          showRelicAcquiredPrompt(relicOffer);
        });
      }
    }
    render();

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
        <button class="td-map-btn"  id="rc-choose-map">🗺️ World Map</button>
      </div>
    </div>`;

  document.getElementById('rc-play-again').addEventListener('click', () => {
    const newRun = generateVerdantRun();
    showRunMap(newRun);
  });
  document.getElementById("rc-choose-map").addEventListener("click", showTDWorldMap);
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
            <div class="tutorial-step-desc">Tap a glowing clearing on the map to open build options. Towers cost gold — place them on high-traffic path bends for maximum effect.</div>
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
            <div class="tutorial-step-title">Bonus Questions, Bonus Gold</div>
            <div class="tutorial-step-desc">Questions are optional: tap the 📝 button (up to 3 per wave) for a bonus question. Answer correctly and the gold is yours — harder questions pay more.</div>
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
