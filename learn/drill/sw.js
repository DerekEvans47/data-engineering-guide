const CACHE = 'de-drill-v148';
const ASSETS = [
  './index.html',
  './config.json',
  './drill.css',
  './drill-core.js',
  './drill-audio.js',
  './drill-world.js',
  './drill-td.js',
  './assets/splash-background.png',
  './assets/audio/world-map-temp.mp3',
  './assets/audio/verdant-battle-horn.mp3',
  './assets/audio/verdant-battle-strings.mp3',
  './assets/worlds/verdant/region.png',
  './assets/worlds/verdant/region-preset.json',
  './assets/worlds/verdant/battlemaps/frontier-town.png',
  './assets/worlds/verdant/battlemaps/frontier-town.json',
  './assets/fonts/Cinzel-Bold.woff2',
  './assets/enemies/goblin-walk.png',
  './assets/enemies/goblin-death.png',
  './assets/towers/ranger-tier1.png',
  './assets/towers/ranger-tier2.png',
  './assets/towers/ranger-tier3.png',
  './assets/towers/ranger-tier4.png',
  './assets/towers/ranger-tier1-back.png',
  './assets/towers/ranger-tier2-back.png',
  './assets/towers/ranger-tier3-back.png',
  './assets/towers/ranger-tier4-back.png',
  '../../content/question-bank.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('install', e => {
  // `cache: 'reload'` forces each fetch to bypass HTTP caching and go to the
  // network, bypassing not just the browser's own HTTP cache but also
  // avoiding a response GitHub Pages' CDN edge may still be holding from
  // before this deploy. Without this, a bumped CACHE name can still get
  // populated with stale asset bytes (e.g. an old drill.js) even though the
  // service worker script itself — and its version badge — correctly
  // updated, since only the SW script itself is guaranteed a fresh
  // network fetch by the spec; everything it fetches in its own install
  // handler is a normal, cacheable request otherwise.
  const requests = ASSETS.map(url => new Request(url, { cache: 'reload' }));
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(requests)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Question bank: network-first so content updates don't need a SW bump
  if (e.request.url.endsWith('question-bank.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
