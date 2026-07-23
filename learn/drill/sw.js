const CACHE = 'de-study-v1';
const ASSETS = [
  './index.html',
  './learn.css',
  './learn-core.js',
  './assets/splash-background.png',
  './assets/fonts/Cinzel-Bold.woff2',
  '../../content/question-bank.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('install', e => {
  // `cache: 'reload'` forces each fetch past the HTTP cache (and any stale
  // GitHub Pages CDN edge copy) so a bumped CACHE name never populates with
  // old asset bytes.
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
  // Question bank: network-first so content updates don't need a SW bump.
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
