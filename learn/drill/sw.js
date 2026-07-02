const CACHE = 'de-drill-v81';
const ASSETS = [
  './index.html',
  './drill.css',
  './drill.js',
  '../../content/question-bank.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  './assets/map/manifest.json',
  './assets/map/deco-verdant-1.png',
  './assets/map/deco-verdant-2.png',
  './assets/map/deco-decay-1.png',
  './assets/map/deco-decay-2.png',
  './assets/map/deco-void-1.png',
  './assets/map/deco-void-2.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
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
